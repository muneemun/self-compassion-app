import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, Image, ScrollView, Animated,
    KeyboardAvoidingView, Platform, Alert, ActionSheetIOS, Pressable
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {
    ChevronLeft, Camera, Check, User,
    MessageCircle, Sparkles, LogOut, Trash2, Cake
} from 'lucide-react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { useAppStore } from '../../store/useAppStore';

interface ProfileEditScreenProps {
    onBack: () => void;
}

export const ProfileEditScreen = ({ onBack }: ProfileEditScreenProps) => {
    const colors = useColors();
    const { userProfile, setUserProfile } = useAppStore();

    // Local state for editing
    const [name, setName] = useState(userProfile?.name || '');
    const [status, setStatus] = useState(userProfile?.status || '');
    const [mbti, setMbti] = useState(userProfile?.mbti || '');
    const [avatar, setAvatar] = useState(userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');
    const [birthday, setBirthday] = useState<Date | null>(userProfile?.birthday ? new Date(userProfile.birthday) : null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Aura Animation
    const auraAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(auraAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(auraAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '이미지를 선택하려면 갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진을 찍으려면 카메라 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleAvatarPress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['취소', '앨범에서 선택', '카메라로 촬영'],
                    cancelButtonIndex: 0,
                    title: '프로필 사진 수정'
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handlePickImage();
                    else if (buttonIndex === 2) handleTakePhoto();
                }
            );
        } else {
            Alert.alert(
                '프로필 사진 수정',
                '이미지를 가져올 방법을 선택하세요.',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '앨범에서 선택', onPress: handlePickImage },
                    { text: '카메라로 촬영', onPress: handleTakePhoto },
                ]
            );
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('알림', '이름을 입력해주세요.');
            return;
        }

        const updatedProfile = {
            ...userProfile,
            name: name.trim(),
            status: status.trim(),
            mbti: mbti.trim(),
            avatar,
            birthday: birthday ? birthday.getTime() : null,
            updatedAt: Date.now()
        };

        setUserProfile(updatedProfile);
        Alert.alert('저장 완료', '프로필 정보가 업데이트되었습니다.', [{ text: '확인', onPress: onBack }]);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>프로필 수정</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Check size={24} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const auraScale = auraAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1]
    });

    const auraOpacity = auraAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6]
    });

    return (
        <HubLayout header={renderHeader()}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Selection Area */}
                    <View style={styles.avatarSection}>
                        <Animated.View style={[
                            styles.avatarAura,
                            {
                                backgroundColor: colors.accent + '20',
                                transform: [{ scale: auraScale }],
                                opacity: auraOpacity
                            }
                        ]} />
                        <View style={[styles.avatarContainer, { borderColor: colors.white }]}>
                            <Image
                                source={{ uri: avatar }}
                                style={styles.avatarImage}
                            />
                            <TouchableOpacity
                                style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAvatarPress}
                            >
                                <Camera size={16} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.avatarHint, { color: colors.gray[500] }]}>중심 노드의 이미지를 변경합니다</Text>
                    </View>

                    {/* Basic Info Group */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.groupTitle, { color: colors.primary }]}>기본 정보</Text>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <User size={16} color={colors.gray[500]} />
                                <Text style={[styles.inputLabel, { color: colors.gray[500] }]}>이름 (닉네임)</Text>
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: colors.primary, backgroundColor: colors.white }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="이름을 입력하세요"
                                placeholderTextColor={colors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <MessageCircle size={16} color={colors.gray[500]} />
                                <Text style={[styles.inputLabel, { color: colors.gray[500] }]}>오늘의 마음 스테이트먼트</Text>
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.textArea, { color: colors.primary, backgroundColor: colors.white }]}
                                value={status}
                                onChangeText={setStatus}
                                placeholder="나를 표현하는 한 줄 문장"
                                placeholderTextColor={colors.gray[400]}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>

                    {/* Emotional Info Group */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.groupTitle, { color: colors.primary }]}>정서적 성향</Text>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <Sparkles size={16} color={colors.gray[500]} />
                                <Text style={[styles.inputLabel, { color: colors.gray[500] }]}>성격 유형 (예: MBTI)</Text>
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: colors.primary, backgroundColor: colors.white }]}
                                value={mbti}
                                onChangeText={setMbti}
                                placeholder="예: INFJ, 내면의 탐구자 등"
                                placeholderTextColor={colors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelRow}>
                                <Cake size={16} color={colors.gray[500]} />
                                <Text style={[styles.inputLabel, { color: colors.gray[500] }]}>생일 (연간 루틴용)</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.textInput, { backgroundColor: colors.white, justifyContent: 'center' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: birthday ? colors.primary : colors.gray[400], fontSize: 16 }}>
                                    {birthday ? birthday.toLocaleDateString() : '생일을 선택하세요'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={birthday || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) setBirthday(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {/* Info Only Area */}
                    <View style={[styles.infoBox, { backgroundColor: colors.primary + '05' }]}>
                        <Text style={[styles.infoText, { color: colors.primary + '80' }]}>
                            스페이스 시작일: {new Date(userProfile?.startedAt || Date.now()).toLocaleDateString()}
                        </Text>
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.dangerZone}>
                        <TouchableOpacity style={styles.dangerBtn}>
                            <LogOut size={18} color={colors.gray[500]} />
                            <Text style={[styles.dangerText, { color: colors.gray[500] }]}>로그아웃</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dangerBtn}>
                            <Trash2 size={18} color="#FF6B6B" />
                            <Text style={[styles.dangerText, { color: '#FF6B6B' }]}>계정 탈퇴</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    avatarAura: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        top: -15,
    },
    avatarContainer: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        position: 'relative',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 65,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarHint: {
        marginTop: 16,
        fontSize: 12,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 32,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 16,
        opacity: 0.8,
    },
    inputContainer: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        paddingLeft: 4,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    textInput: {
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    textArea: {
        height: 80,
        paddingTop: 14,
    },
    infoBox: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 40,
    },
    infoText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dangerZone: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 20,
    },
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dangerText: {
        fontSize: 13,
        fontWeight: '800',
    },
});
