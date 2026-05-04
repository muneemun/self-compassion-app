import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useRelationshipStore } from '../store/useRelationshipStore';
import { useSelfTimeStore } from '../store/useSelfTimeStore';
import { useAppStore } from '../store/useAppStore';
import { Alert, Platform } from 'react-native';

export const BackupService = {
  /**
   * 현재 앱의 모든 데이터(인맥, 나와의 시간, 프로필)를 JSON 파일로 내보냅니다.
   */
  async exportData() {
    try {
      const data = {
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        relationships: useRelationshipStore.getState().relationships,
        selfTimeEntries: useSelfTimeStore.getState().entries,
        userProfile: useAppStore.getState().userProfile,
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

      // 모바일 환경 처리: 디렉토리 존재 확인
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory!);
      if (!dirInfo.exists) {
        // 이론적으로는 항상 존재해야 하지만 안전을 위해 확인
        throw new Error('저장 장치 경로를 찾을 수 없습니다.');
      }

      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
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

      const confirmRestore = () => {
        try {
          // 각 스토어의 상태를 직접 업데이트
          useRelationshipStore.setState({ 
              relationships: data.relationships,
              lastAddedId: null 
          });
          
          if (data.selfTimeEntries) {
              useSelfTimeStore.setState({ entries: data.selfTimeEntries });
          }
          
          if (data.userProfile) {
              useAppStore.setState({ userProfile: data.userProfile });
          }
          
          Alert.alert('복원 완료', '성공적으로 데이터를 복원했습니다.');
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
