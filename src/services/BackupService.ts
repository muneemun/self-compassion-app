import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRelationshipStore } from '../store/useRelationshipStore';
import { useSelfTimeStore } from '../store/useSelfTimeStore';
import { useAppStore } from '../store/useAppStore';
import { Alert, Platform } from 'react-native';

export const BackupService = {
  /**
   * 이미지를 썸네일 크기로 압축하고 Base64로 변환합니다.
   */
  async processImageForBackup(uri: string): Promise<string | null> {
    try {
      if (!uri || uri.startsWith('http')) return null;

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 300 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      return result.base64 || null;
    } catch (e) {
      console.warn('Image processing failed for:', uri, e);
      return null;
    }
  },

  /**
   * Base64 데이터를 로컬 파일로 저장하고 URI를 반환합니다.
   */
  async restoreImageFromBackup(base64: string, id: string): Promise<string | null> {
    try {
      const folderUri = `${FileSystem.documentDirectory}avatars/`;
      const fileUri = `${folderUri}${id}_${Date.now()}.jpg`;

      // 폴더 생성
      const folderInfo = await FileSystem.getInfoAsync(folderUri);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64',
      });

      return fileUri;
    } catch (e) {
      console.error('Image restoration failed:', e);
      return null;
    }
  },

  /**
   * 현재 앱의 모든 데이터(인맥, 나와의 시간, 프로필)를 JSON 파일로 내보냅니다.
   */
  async exportData() {
    try {
      const originalRelationships = useRelationshipStore.getState().relationships;
      
      // 이미지 포함 고도화 작업
      const processedRelationships = await Promise.all(
        originalRelationships.map(async (rel) => {
          if (rel.image && !rel.image.startsWith('http')) {
            const base64 = await this.processImageForBackup(rel.image);
            return { ...rel, imageBase64: base64 };
          }
          return rel;
        })
      );

      // 사용자 프로필 이미지 포함 처리
      const originalProfile = useAppStore.getState().userProfile;
      let processedProfile = originalProfile;
      
      if (originalProfile && originalProfile.avatar && !originalProfile.avatar.startsWith('http')) {
        const base64 = await this.processImageForBackup(originalProfile.avatar);
        processedProfile = { ...originalProfile, avatarBase64: base64 };
      }

      const data = {
        version: '1.2.1',
        timestamp: new Date().toISOString(),
        relationships: processedRelationships,
        selfTimeEntries: useSelfTimeStore.getState().entries,
        userProfile: processedProfile,
      };

      let jsonString;
      try {
        jsonString = JSON.stringify(data, null, 2);
      } catch (serializeError) {
        throw new Error('데이터 구조가 복잡하여 변환할 수 없습니다. (순환 참조 의심)');
      }

      const filename = `social_orbit_backup_${new Date().toISOString().split('T')[0]}.json`;

      // 웹 환경 처리
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // 모바일 환경 처리: 파일 저장

      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: 'utf8'
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('공유 불가', '이 기기에서는 파일 공유를 지원하지 않습니다.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: '데이터 백업하기',
        UTI: 'public.json',
      });
    } catch (error: any) {
      console.error('Backup failed:', error);
      const errorMessage = error?.message || '알 수 없는 오류';
      Alert.alert('백업 실패', `데이터를 내보내는 중 오류가 발생했습니다.\n\n원인: ${errorMessage}`);
    }
  },

  /**
   * JSON 파일을 선택하여 앱의 데이터를 복원합니다.
   */
  async importData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      let content = '';

      if (Platform.OS === 'web') {
        // 웹에서는 fetch를 통해 blob URI 데이터를 읽어옴
        const response = await fetch(fileUri);
        content = await response.text();
      } else {
        content = await FileSystem.readAsStringAsync(fileUri);
      }
      
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        throw new Error('Invalid JSON format');
      }

      // 간단한 스키마 검증
      if (!data.relationships || !Array.isArray(data.relationships)) {
        throw new Error('Missing relationships data');
      }

      const confirmRestore = async () => {
        try {
          // 이미지 데이터 복원 처리
          const restoredRelationships = await Promise.all(
            (data.relationships || []).map(async (rel: any) => {
              if (rel.imageBase64) {
                const localUri = await this.restoreImageFromBackup(rel.imageBase64, rel.id);
                if (localUri) {
                  return { ...rel, image: localUri, imageBase64: undefined };
                }
              }
              return rel;
            })
          );

          // 각 스토어의 상태를 직접 업데이트
          useRelationshipStore.setState({ 
              relationships: restoredRelationships,
              lastAddedId: null 
          });
          
          if (data.selfTimeEntries) {
              useSelfTimeStore.setState({ entries: data.selfTimeEntries });
          }
          
          if (data.userProfile) {
              let restoredProfile = data.userProfile;
              
              // 사용자 프로필 이미지 데이터 복원
              if (restoredProfile.avatarBase64) {
                const localUri = await this.restoreImageFromBackup(restoredProfile.avatarBase64, 'user_avatar');
                if (localUri) {
                  restoredProfile = { ...restoredProfile, avatar: localUri, avatarBase64: undefined };
                }
              }
              
              useAppStore.setState({ userProfile: restoredProfile });
          }
          
          Alert.alert('복원 완료', '이미지를 포함한 모든 데이터가 성공적으로 복원되었습니다.');
        } catch (updateError) {
          console.error('Store update failed:', updateError);
          Alert.alert('복원 오류', '데이터 적용 중 문제가 발생했습니다.');
        }
      };

      if (Platform.OS === 'web') {
        if (confirm('데이터 복원: 기존의 모든 데이터가 백업 파일의 데이터로 교체됩니다. 계속하시겠습니까?')) {
          confirmRestore();
        }
      } else {
        Alert.alert(
          '데이터 복원',
          '기존의 모든 데이터가 백업 파일의 데이터로 교체됩니다. 계속하시겠습니까?\n\n(현재 기록은 사라집니다)',
          [
            { text: '취소', style: 'cancel' },
            { text: '복원하기', style: 'destructive', onPress: confirmRestore },
          ]
        );
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('복원 실패', '유효하지 않은 백업 파일이거나 처리 중 오류가 발생했습니다.');
    }
  },
};
