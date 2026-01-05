import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, Trash2, Camera, User, Phone, Tag, Shield, Edit3, Check } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');

interface RelationshipProfileProps {
    relationshipId: string;
    onBack: () => void;
    onDelete: () => void;
}

export const RelationshipProfile = ({ relationshipId, onBack, onDelete }: RelationshipProfileProps) => {
    const colors = useColors();
    const { getRelationshipById, updateRelationship, deleteRelationship } = useRelationshipStore();
    const node = getRelationshipById(relationshipId);

    if (!node) return null;

    const [name, setName] = useState(node.name);
    const [phone, setPhone] = useState(node.phoneNumber || '');
    const [role, setRole] = useState(node.role);
    const [image, setImage] = useState(node.image);
    const [type, setType] = useState(node.type);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('오류', '이름을 입력해주세요.');
            return;
        }

        updateRelationship(relationshipId, {
            name,
            phoneNumber: phone,
            role,
            image,
            type
        });

        Alert.alert('성공', '프로필 정보가 업데이트되었습니다.', [
            { text: '확인', onPress: onBack }
        ]);
    };

    const handleDelete = () => {
        Alert.alert(
            '관계 삭제',
            `'${node.name}'님과의 모든 관계 데이터가 삭제됩니다. 정말 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        deleteRelationship(relationshipId);
                        onDelete();
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>프로필 관리</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                <Trash2 size={24} color="#FF5252" />
            </TouchableOpacity>
        </View>
    );

    const relationshipTypes: { id: typeof node.type; label: string; icon: any }[] = [
        { id: 'partner', label: '파트너', icon: Shield },
        { id: 'family', label: '가족', icon: User },
        { id: 'friend', label: '친구', icon: User },
        { id: 'work', label: '업무', icon: Shield },
        { id: 'other', label: '기타', icon: Tag },
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            <HubLayout header={renderHeader()} scrollable>
                <View style={styles.container}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '10' }]}>
                                    <User size={48} color={colors.primary} opacity={0.3} />
                                </View>
                            )}
                            <View style={[styles.cameraBtn, { backgroundColor: colors.accent }]}>
                                <Camera size={16} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.avatarHint, { color: colors.primary, opacity: 0.5 }]}>
                            사진을 터치하여 변경
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <User size={16} color={colors.primary} opacity={0.5} />
                                <Text style={[styles.label, { color: colors.primary }]}>이름</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { color: colors.primary, backgroundColor: colors.white }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="이름을 입력하세요"
                                placeholderTextColor={colors.primary + '40'}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Phone size={16} color={colors.primary} opacity={0.5} />
                                <Text style={[styles.label, { color: colors.primary }]}>연락처 (선택)</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { color: colors.primary, backgroundColor: colors.white }]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="연락처를 입력하세요"
                                placeholderTextColor={colors.primary + '40'}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Tag size={16} color={colors.primary} opacity={0.5} />
                                <Text style={[styles.label, { color: colors.primary }]}>나와의 역할</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { color: colors.primary, backgroundColor: colors.white }]}
                                value={role}
                                onChangeText={setRole}
                                placeholder="예: 아내, 직장 상사, 운동 메이트"
                                placeholderTextColor={colors.primary + '40'}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Edit3 size={16} color={colors.primary} opacity={0.5} />
                                <Text style={[styles.label, { color: colors.primary }]}>기본 관계 유형</Text>
                            </View>
                            <View style={styles.typeGrid}>
                                {relationshipTypes.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => setType(t.id)}
                                        style={[
                                            styles.typeChip,
                                            { backgroundColor: type === t.id ? colors.primary : colors.white },
                                            type === t.id ? styles.typeChipActive : null
                                        ]}
                                    >
                                        <Text style={[
                                            styles.typeChipText,
                                            { color: type === t.id ? '#FFF' : colors.primary }
                                        ]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                    >
                        <Check size={20} color="#FFF" />
                        <Text style={styles.saveBtnText}>저장하기</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </HubLayout>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(74, 93, 78, 0.05)',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    container: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        padding: 4,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
        alignItems: 'center',
        justifyContent: 'center',
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
        borderColor: '#FFF',
    },
    avatarHint: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 12,
    },
    formSection: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        opacity: 0.6,
    },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
    },
    typeChipActive: {
        borderColor: 'transparent',
    },
    typeChipText: {
        fontSize: 14,
        fontWeight: '700',
    },
    saveBtn: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 40,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});
