import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, LayoutAnimation, BackHandler } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, UserPlus, Zap, Edit3, Check, Search, Users, Camera, Phone, ChevronRight, X } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

type EntryMode = 'choice' | 'sync' | 'manual';
type ManualStep = 'name' | 'phone' | 'role' | 'type';

interface ContactItem {
    id: string;
    name: string;
    phoneNumber?: string;
    image?: string;
}

export const RelationshipEntry = ({ onBack, onComplete }: {
    onBack: () => void,
    onComplete: (data: { name: string; type: string; role: string; phoneNumber?: string; image?: string }) => void
}) => {
    const colors = useColors();

    const [mode, setMode] = useState<EntryMode>('choice');
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Manual setup state
    const [manualStep, setManualStep] = useState<ManualStep>('name');
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [manualRole, setManualRole] = useState('');
    const [manualImage, setManualImage] = useState<string | null>(null);
    const [manualType, setManualType] = useState<string | undefined>(undefined);
    const [manualCustomType, setManualCustomType] = useState('');
    const [isCustomType, setIsCustomType] = useState(false);
    const [customTypes, setCustomTypes] = useState<string[]>([]);

    // Refs
    const scrollRef = useRef<ScrollView>(null);
    const nameInputRef = useRef<TextInput>(null);
    const phoneInputRef = useRef<TextInput>(null);
    const roleInputRef = useRef<TextInput>(null);

    // Check if any data entered
    const checkIfDirty = () => {
        if (mode === 'manual' && (manualName || manualPhone || manualRole || manualImage || manualType)) return true;
        if (mode === 'sync') return true;
        return false;
    };

    const handleBackPress = () => {
        if (checkIfDirty()) {
            Alert.alert(
                '등록 중단',
                '입력 중인 정보가 저장되지 않습니다. 정말 나갈까요?',
                [
                    { text: '계속 입력', style: 'cancel' },
                    { text: '나가기', style: 'destructive', onPress: () => onBack() }
                ]
            );
            return true;
        }

        if (mode !== 'choice') {
            setMode('choice');
            return true;
        }

        onBack();
        return true;
    };

    // Auto focus on step change
    useEffect(() => {
        if (mode === 'manual') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setTimeout(() => {
                if (manualStep === 'name') nameInputRef.current?.focus();
                else if (manualStep === 'phone') phoneInputRef.current?.focus();
                else if (manualStep === 'role') roleInputRef.current?.focus();
            }, 300);
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => backHandler.remove();
    }, [manualStep, mode, manualName, manualPhone, manualRole, manualImage, manualType]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setManualImage(result.assets[0].uri);
        }
    };

    const fetchContacts = async () => {
        setLoading(true);
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
            });

            if (data.length > 0) {
                const formatted = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    phoneNumber: c.phoneNumbers?.[0]?.number,
                    image: c.image?.uri
                })).filter(c => c.name);
                setContacts(formatted);
                setMode('sync');
            } else {
                Alert.alert('알림', '가져올 수 있는 연락처가 없습니다.');
            }
        } else {
            Alert.alert('권한 필요', '연락처 접근 권한이 필요합니다.');
        }
        setLoading(false);
    };

    const handleAddContact = (contact: ContactItem) => {
        onComplete({
            name: contact.name,
            type: 'friend',
            role: 'Acquaintance',
            phoneNumber: contact.phoneNumber,
            image: contact.image
        });
    };

    const handleManualSubmit = () => {
        if (!manualName.trim()) {
            setManualStep('name');
            return;
        }
        if (!manualType && !isCustomType) {
            setManualStep('type');
            return;
        }
        const finalType = isCustomType ? manualCustomType.trim() : manualType;
        if (!finalType) {
            Alert.alert('알림', '관계 유형을 입력해주세요.');
            return;
        }

        // Add to custom types if it's a new one
        if (isCustomType && !customTypes.includes(finalType)) {
            setCustomTypes(prev => [...prev, finalType]);
        }

        onComplete({
            name: manualName,
            type: finalType,
            role: manualRole || 'Acquaintance',
            phoneNumber: manualPhone || undefined,
            image: manualImage || undefined
        });
    };

    const renderSummaryItem = (label: string, value: string, step: ManualStep) => (
        <TouchableOpacity
            style={[styles.summaryItem, { backgroundColor: colors.white + 'A0', borderLeftWidth: 4, borderLeftColor: colors.primary + '30' }]}
            onPress={() => setManualStep(step)}
        >
            <View style={styles.summaryContent}>
                <Text style={[styles.summaryLabel, { color: colors.primary }]}>{label}</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{value || (label === '이름' ? '필수 입력' : '미입력')}</Text>
            </View>
            <View style={[styles.editCircle, { backgroundColor: colors.primary + '10' }]}>
                <Edit3 size={14} color={colors.primary} />
            </View>
        </TouchableOpacity>
    );

    const renderChoice = () => (
        <View style={styles.choiceContainer}>
            <View style={styles.headerInfo}>
                <Text style={[styles.title, { color: colors.primary }]}>새로운 관계 궤도</Text>
                <Text style={[styles.subtitle, { color: colors.primary, opacity: 0.6 }]}>
                    관계를 등록하는 방법을 선택해주세요.
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.choiceCard, { backgroundColor: colors.white }]}
                onPress={fetchContacts}
            >
                <View style={[styles.choiceIcon, { backgroundColor: 'rgba(74,93,78,0.1)' }]}>
                    <Zap size={24} color={colors.primary} />
                </View>
                <View style={styles.choiceContent}>
                    <Text style={[styles.choiceTitle, { color: colors.primary }]}>스마트 동기화</Text>
                    <Text style={[styles.choiceDesc, { color: colors.primary, opacity: 0.5 }]}>
                        연락처를 통해 빠르게 등록합니다.
                    </Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.choiceCard, { backgroundColor: colors.white }]}
                onPress={() => setMode('manual')}
            >
                <View style={[styles.choiceIcon, { backgroundColor: 'rgba(217,139,115,0.1)' }]}>
                    <Edit3 size={24} color={colors.accent} />
                </View>
                <View style={styles.choiceContent}>
                    <Text style={[styles.choiceTitle, { color: colors.primary }]}>직접 수동 입력</Text>
                    <Text style={[styles.choiceDesc, { color: colors.primary, opacity: 0.5 }]}>
                        이름부터 차근차근 입력합니다.
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderManual = () => (
        <View style={styles.manualContainer}>
            {/* Step 1: Name & Image */}
            {manualStep !== 'name' ? (
                renderSummaryItem('이름', manualName, 'name')
            ) : (
                <View style={[styles.activeCard, { backgroundColor: colors.white }]}>
                    <Text style={[styles.activeLabel, { color: colors.primary }]}>누구를 등록할까요?</Text>
                    <View style={styles.activeRow}>
                        <TouchableOpacity onPress={pickImage} style={styles.miniPicker}>
                            {manualImage ? (
                                <Image source={{ uri: manualImage }} style={styles.miniAvatar} />
                            ) : (
                                <Camera size={20} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                        <TextInput
                            ref={nameInputRef}
                            style={[styles.activeInput, { color: colors.primary }]}
                            value={manualName}
                            onChangeText={setManualName}
                            placeholder="이름을 입력하세요"
                            placeholderTextColor="rgba(74,93,78,0.3)"
                            returnKeyType="next"
                            onSubmitEditing={() => setManualStep('phone')}
                        />
                        <TouchableOpacity
                            onPress={() => setManualStep('phone')}
                            disabled={!manualName.trim()}
                            style={[styles.nextCircle, { backgroundColor: manualName.trim() ? colors.primary : colors.white + 'CC' }]}
                        >
                            <ChevronRight size={20} color={manualName.trim() ? "#fff" : colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Step 2: Phone */}
            {manualStep === 'name' ? null : (
                manualStep !== 'phone' ? (
                    renderSummaryItem('연락처', manualPhone, 'phone')
                ) : (
                    <View style={[styles.activeCard, { backgroundColor: colors.white }]}>
                        <Text style={[styles.activeLabel, { color: colors.primary }]}>연락처를 적어주세요 (선택)</Text>
                        <View style={styles.activeRow}>
                            <Phone size={20} color={colors.primary} style={{ marginRight: 15 }} />
                            <TextInput
                                ref={phoneInputRef}
                                style={[styles.activeInput, { color: colors.primary }]}
                                value={manualPhone}
                                onChangeText={setManualPhone}
                                placeholder="010-0000-0000"
                                placeholderTextColor="rgba(74,93,78,0.3)"
                                keyboardType="numeric"
                                returnKeyType="next"
                                onSubmitEditing={() => setManualStep('role')}
                            />
                            <TouchableOpacity
                                onPress={() => setManualStep('role')}
                                style={[styles.nextCircle, { backgroundColor: colors.primary }]}
                            >
                                <ChevronRight size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            )}

            {/* Step 3: Role / Tag */}
            {['name', 'phone'].includes(manualStep) ? null : (
                manualStep !== 'role' ? (
                    renderSummaryItem('역할', manualRole, 'role')
                ) : (
                    <View style={[styles.activeCard, { backgroundColor: colors.white }]}>
                        <Text style={[styles.activeLabel, { color: colors.primary }]}>당신에게 어떤 사람인가요?</Text>
                        <View style={styles.activeRow}>
                            <Edit3 size={20} color={colors.primary} style={{ marginRight: 15 }} />
                            <TextInput
                                ref={roleInputRef}
                                style={[styles.activeInput, { color: colors.primary }]}
                                value={manualRole}
                                onChangeText={setManualRole}
                                placeholder="예: 단짝, 팀장님, 아내"
                                placeholderTextColor="rgba(74,93,78,0.3)"
                                returnKeyType="next"
                                onSubmitEditing={() => setManualStep('type')}
                            />
                            <TouchableOpacity
                                onPress={() => setManualStep('type')}
                                style={[styles.nextCircle, { backgroundColor: colors.primary }]}
                            >
                                <ChevronRight size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            )}

            {/* Step 4: Type Selection */}
            {manualStep !== 'type' ? null : (
                <View style={[styles.activeCard, { backgroundColor: colors.white }]}>
                    <Text style={[styles.activeLabel, { color: colors.primary }]}>관계 유형을 선택해주세요</Text>
                    <View style={styles.typeGrid}>
                        {(['family', 'work', 'friend', 'partner'] as const).map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeChip,
                                    { backgroundColor: manualType === t && !isCustomType ? colors.primary : colors.white },
                                    (manualType !== t || isCustomType) && { borderWidth: 1, borderColor: 'rgba(74,93,78,0.1)' }
                                ]}
                                onPress={() => {
                                    setManualType(t);
                                    setIsCustomType(false);
                                }}
                            >
                                <Text style={[
                                    styles.typeChipText,
                                    { color: manualType === t && !isCustomType ? colors.white : colors.primary }
                                ]}>
                                    {t === 'family' ? '가족' : t === 'work' ? '업무' : t === 'friend' ? '친구' : '연인'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {customTypes.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeChip,
                                    { backgroundColor: manualType === t && !isCustomType ? colors.primary : colors.white },
                                    (manualType !== t || isCustomType) && { borderWidth: 1, borderColor: 'rgba(74,93,78,0.1)' }
                                ]}
                                onPress={() => {
                                    setManualType(t);
                                    setIsCustomType(false);
                                }}
                            >
                                <Text style={[
                                    styles.typeChipText,
                                    { color: manualType === t && !isCustomType ? colors.white : colors.primary }
                                ]}>
                                    {t}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[
                                styles.typeChip,
                                { backgroundColor: isCustomType ? colors.primary : colors.white },
                                !isCustomType && { borderWidth: 1, borderColor: 'rgba(74,93,78,0.1)' }
                            ]}
                            onPress={() => {
                                setIsCustomType(true);
                                setManualType(undefined);
                            }}
                        >
                            <Text style={[
                                styles.typeChipText,
                                { color: isCustomType ? colors.white : colors.primary }
                            ]}>
                                직접 입력
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isCustomType && (
                        <View style={[styles.activeRow, { marginBottom: 20 }]}>
                            <Edit3 size={18} color={colors.primary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.activeInput, { fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.primary + '30' }]}
                                value={manualCustomType}
                                onChangeText={setManualCustomType}
                                placeholder="유형을 직접 입력하세요 (예: 동호회)"
                                placeholderTextColor="rgba(74,93,78,0.3)"
                                autoFocus
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            { backgroundColor: colors.primary, opacity: (manualType || (isCustomType && manualCustomType.trim())) ? 1 : 0.5 }
                        ]}
                        onPress={handleManualSubmit}
                    >
                        <Text style={styles.submitBtnText}>등록 및 진단 시작</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderHeader = () => (
        <View style={COMMON_STYLES.headerContainer}>
            <View style={{ width: UI_CONSTANTS.BUTTON_SIZE }} />
            <Text style={[styles.headerTitle, { color: colors.primary }]}>관계 추가</Text>
            <TouchableOpacity
                onPress={handleBackPress}
                style={COMMON_STYLES.secondaryActionBtn}
            >
                <X size={UI_CONSTANTS.ICON_SIZE} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const renderSync = () => (
        <View style={styles.syncContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.white }]}>
                <Search size={18} color={colors.primary} style={{ opacity: 0.4 }} />
                <TextInput
                    style={[styles.searchInput, { color: colors.primary }]}
                    placeholder="연락처 검색..."
                    placeholderTextColor="rgba(74,93,78,0.3)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(contact => (
                    <TouchableOpacity key={contact.id} style={styles.contactItem} onPress={() => handleAddContact(contact)}>
                        <View style={[styles.contactAvatar, { backgroundColor: 'rgba(74,93,78,0.05)' }]}>
                            {contact.image ? <Image source={{ uri: contact.image }} style={styles.miniAvatar} /> : <Users size={20} color={colors.primary} />}
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactName, { color: colors.primary }]}>{contact.name}</Text>
                            <Text style={[styles.contactPhone, { color: colors.primary, opacity: 0.5 }]}>{contact.phoneNumber}</Text>
                        </View>
                        <View style={[styles.addIcon, { backgroundColor: colors.primary }]}><UserPlus size={14} color="#fff" /></View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <HubLayout header={renderHeader()} scrollable={false}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollRef}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {mode === 'choice' && renderChoice()}
                    {mode === 'sync' && renderSync()}
                    {mode === 'manual' && renderManual()}
                </ScrollView>
            </KeyboardAvoidingView>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    choiceContainer: { padding: 20 },
    headerInfo: { alignItems: 'center', marginVertical: 40 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
    subtitle: { fontSize: 15, textAlign: 'center', fontWeight: '500' },
    choiceCard: { flexDirection: 'row', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 16, elevation: 2 },
    choiceIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 20 },
    choiceContent: { flex: 1 },
    choiceTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    choiceDesc: { fontSize: 13, fontWeight: '500' },
    manualContainer: { padding: 20, gap: 12 },
    summaryItem: { flexDirection: 'row', padding: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between' },
    summaryContent: { flex: 1 },
    summaryLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2, opacity: 0.5 },
    summaryValue: { fontSize: 15, fontWeight: '800' },
    activeCard: { padding: 24, borderRadius: 28, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    activeLabel: { fontSize: 18, fontWeight: '800', marginBottom: 24 },
    activeRow: { flexDirection: 'row', alignItems: 'center' },
    miniPicker: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(74,93,78,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 15, overflow: 'hidden' },
    miniAvatar: { width: '100%', height: '100%' },
    activeInput: { flex: 1, fontSize: 20, fontWeight: '700', paddingVertical: 10 },
    nextCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    typeChip: { flex: 1, minWidth: '45%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    typeChipText: { fontSize: 14, fontWeight: '800' },
    submitBtn: { height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    syncContainer: { flex: 1, padding: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 25, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600' },
    contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    contactAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 16, fontWeight: '700' },
    contactPhone: { fontSize: 13 },
    addIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    editCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
