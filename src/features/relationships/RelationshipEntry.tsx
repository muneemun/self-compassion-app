import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Platform, Keyboard, LayoutAnimation, BackHandler, SectionList, PanResponder, GestureResponderEvent } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, UserPlus, Zap, Edit3, Check, Search, Users, Camera, Phone, ChevronRight, X } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

type EntryMode = 'choice' | 'sync' | 'manual';
type ManualStep = 'name' | 'phone' | 'role' | 'type' | 'zone';

interface ContactItem {
    id: string;
    name: string;
    phoneNumber?: string;
    image?: string;
    company?: string;
}

const getInitialConsonant = (text: string) => {
    if (!text) return '#';
    const firstChar = text.trim().charAt(0);
    const code = firstChar.charCodeAt(0) - 44032;
    if (code > -1 && code < 11172) {
        // 한글
        const cho = Math.floor(code / 588);
        const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        return consonants[cho] || '#';
    }
    // 영어인 경우 알파벳 대문자로
    if (/[a-zA-Z]/.test(firstChar)) {
        return firstChar.toUpperCase();
    }
    return '#';
};

const getChosungStr = (text: string) => {
    const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i) - 44032;
        if (code > -1 && code < 11172) {
            result += consonants[Math.floor(code / 588)];
        } else {
            result += text.charAt(i);
        }
    }
    return result;
};

const ZONE_CONFIG = [
    {
        zone: 1,
        label: '핵심 그룹',
        desc: '감정적으로 가장 가깝고, 위기 시 바로 연락할 수 있는 사람',
        color: '#FFB74D',
        checks: ['거의 매일 연락하거나 만난다', '깊은 감정과 고민을 솔직하게 나눈다', '위기 상황에서 가장 먼저 떠오른다'],
    },
    {
        zone: 2,
        label: '정서적 공유 그룹',
        desc: '자주 만나며 개인적인 이야기를 나눌 수 있는 사람',
        color: '#D98B73',
        checks: ['정기적으로 연락하거나 만난다', '서로의 일상을 알고 있다', '개인적인 이야기를 나눌 수 있다'],
    },
    {
        zone: 3,
        label: '기능적 협력 관계',
        desc: '업무·활동 등 특정 목적으로 연결된 사람',
        color: '#4A5D4E',
        checks: ['주로 업무나 공통 활동을 통해 만난다', '필요할 때 연락하는 관계다', '서로 도움을 주고받을 수 있다'],
    },
    {
        zone: 4,
        label: '단순 인지 관계',
        desc: '안면이 있거나 이름을 아는 수준의 사람',
        color: '#90A4AE',
        checks: ['자주 만나지는 않는다', '특별한 교류가 없다', '이름이나 얼굴을 알고 있다'],
    },
    {
        zone: 5,
        label: '배경 소음',
        desc: '온라인에서만 연결되거나 거의 교류가 없는 사람',
        color: '#D1D5DB',
        checks: ['SNS 등 온라인으로만 연결되어 있다', '직접 대화한 적이 거의 없다', '배경 정보로만 알고 있다'],
    },
];

export const RelationshipEntry = ({ onBack, onComplete }: {
    onBack: () => void,
    onComplete: (data: { name: string; type: string; role: string; phoneNumber?: string; image?: string; zone?: number }) => void
}) => {
    const colors = useColors();
    const relationships = useRelationshipStore(state => state.relationships);

    const [mode, setMode] = useState<EntryMode>('choice');
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChip, setActiveChip] = useState<string>('ALL');
    const [contactGroups, setContactGroups] = useState<{id: string, name: string}[]>([{ id: 'ALL', name: '전체' }]);

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
    const [manualZone, setManualZone] = useState<number>(3);

    // Refs
    const scrollRef = useRef<any>(null);
    const sectionListRef = useRef<SectionList>(null);
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
                    { 
                        text: '나가기', 
                        style: 'destructive', 
                        onPress: () => {
                            if (relationships.length === 0) {
                                Alert.alert('필수 입력', '첫 번째 인맥 등록은 필수입니다. 추가 없이 시작할 수 없습니다.');
                            } else {
                                onBack();
                            }
                        } 
                    }
                ]
            );
            return true;
        }

        if (mode !== 'choice') {
            setMode('choice');
            return true;
        }

        if (relationships.length === 0) {
            Alert.alert('필수 입력', '첫 번째 인맥 등록은 필수입니다. 추가 없이 시작할 수 없습니다.');
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

    const sectionedContacts = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const isQueryOnlyChosung = /^[ㄱ-ㅎ]+$/.test(query);

        let filtered = contacts.filter(c => {
            const name = c.name.toLowerCase();
            if (name.includes(query)) return true;
            if (isQueryOnlyChosung) {
                const nameChosung = getChosungStr(name);
                if (nameChosung.includes(query)) return true;
            }
            return false;
        });

        if (activeChip === 'COMPANY') {
            filtered = filtered.filter(c => !!c.company);
        } else if (activeChip === 'FAMILY') {
            filtered = filtered.filter(c => 
                c.name.includes('엄마') || c.name.includes('아빠') || c.name.includes('형') || 
                c.name.includes('동생') || c.name.includes('누나') || c.name.includes('언니') || 
                c.name.includes('아들') || c.name.includes('딸') || c.name.includes('가족')
            );
        } else if (activeChip === 'HAS_PHONE') {
            filtered = filtered.filter(c => !!c.phoneNumber);
        }

        const sectionsMap: { [key: string]: ContactItem[] } = {};
        filtered.forEach(c => {
            const initial = getInitialConsonant(c.name);
            if (!sectionsMap[initial]) sectionsMap[initial] = [];
            sectionsMap[initial].push(c);
        });

        const sortedSections = Object.keys(sectionsMap).sort((a, b) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        }).map(key => ({
            title: key,
            data: sectionsMap[key].sort((a, b) => a.name.localeCompare(b.name))
        }));

        return sortedSections;
    }, [contacts, searchQuery, activeChip]);

    const scrollToSection = (index: number) => {
        if (sectionListRef.current && sectionedContacts[index]) {
            sectionListRef.current.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
            });
        }
    };

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

    const fetchContacts = async (groupId?: string) => {
        setLoading(true);
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                if (contactGroups.length === 1) {
                    try {
                        const groups = await Contacts.getGroupsAsync({});
                        if (groups && groups.length > 0) {
                            setContactGroups([{ id: 'ALL', name: '전체' }, ...groups.map((g: any) => ({ id: g.id!, name: g.name || '그룹없음' }))]);
                        } else {
                            setContactGroups([
                                { id: 'ALL', name: '전체' },
                                { id: 'COMPANY', name: '🏢 직장/동료' },
                                { id: 'FAMILY', name: '👨‍👩‍👧 가족' },
                                { id: 'HAS_PHONE', name: '📞 번호 있음' }
                            ]);
                        }
                    } catch (e) {
                        console.log('Groups fetch failed', e);
                        setContactGroups([
                            { id: 'ALL', name: '전체' },
                            { id: 'COMPANY', name: '🏢 직장/동료' },
                            { id: 'FAMILY', name: '👨‍👩‍👧 가족' },
                            { id: 'HAS_PHONE', name: '📞 번호 있음' }
                        ]);
                    }
                }

                const query: any = {
                    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image, Contacts.Fields.Company],
                };
                if (groupId && groupId !== 'ALL' && !['COMPANY', 'FAMILY', 'HAS_PHONE'].includes(groupId)) {
                    query.groupId = groupId;
                }
                const { data } = await Contacts.getContactsAsync(query);

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
                    if (groupId && groupId !== 'ALL') {
                        setContacts([]);
                    } else {
                        Alert.alert('알림', '가져올 수 있는 연락처가 없습니다.');
                    }
                }
            } else {
                Alert.alert('권한 필요', '연락처 접근 권한이 필요합니다.');
            }
        } catch (error) {
            console.error('Failed to load contacts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChipPress = (groupId: string) => {
        setActiveChip(groupId);
        fetchContacts(groupId);
    };

    const handleAddContact = (contact: ContactItem) => {
        onComplete({
            name: contact.name,
            type: 'friend',
            role: 'Acquaintance',
            phoneNumber: contact.phoneNumber,
            image: contact.image,
            zone: 1, // 연락처 동기화 시 기본 Zone 1 배치 (사용자가 진단 통해 추후 조정 가능)
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
        if (isCustomType && !customTypes.includes(finalType)) {
            setCustomTypes(prev => [...prev, finalType]);
        }
        onComplete({
            name: manualName,
            type: finalType,
            role: manualRole || 'Acquaintance',
            phoneNumber: manualPhone || undefined,
            image: manualImage || undefined,
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
                onPress={() => fetchContacts()}
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
                                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
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
                        disabled={!manualType && !isCustomType}
                    >
                        <Text style={styles.submitBtnText}>등록하기</Text>
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
        <View style={[styles.syncContainer, { paddingBottom: Platform.OS === 'android' ? 60 : 40 }]}>
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

            {/* Smart Filter Chips using Native Groups */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
                {contactGroups.map(chip => (
                    <TouchableOpacity
                        key={chip.id}
                        style={[
                            styles.filterChip,
                            activeChip === chip.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary + '20' }
                        ]}
                        onPress={() => handleChipPress(chip.id)}
                    >
                        <Text style={[
                            styles.filterChipText,
                            activeChip === chip.id ? { color: colors.white } : { color: colors.primary }
                        ]}>{chip.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.listWrapper}>
                <SectionList
                    ref={sectionListRef}
                    sections={sectionedContacts}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                            <Text style={[styles.sectionHeaderText, { color: colors.primary }]}>{title}</Text>
                        </View>
                    )}
                    renderItem={({ item: contact }) => (
                        <TouchableOpacity style={styles.contactItem} onPress={() => handleAddContact(contact)} activeOpacity={0.6}>
                            <View style={[styles.contactAvatar, { backgroundColor: 'rgba(74,93,78,0.05)' }]}>
                                {contact.image ? <Image source={{ uri: contact.image }} style={styles.miniAvatar} /> : <Users size={20} color={colors.primary} />}
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactName, { color: colors.primary }]}>{contact.name}</Text>
                                <Text style={[styles.contactPhone, { color: colors.primary, opacity: 0.5 }]}>{contact.phoneNumber}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    stickySectionHeadersEnabled
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            </View>
        </View>
    );

    return (
        <HubLayout header={renderHeader()} scrollable={false}>
            {mode === 'sync' ? renderSync() : (
                <KeyboardAwareScrollView
                    ref={scrollRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    enableOnAndroid={true}
                    extraScrollHeight={120}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {mode === 'choice' && renderChoice()}
                    {mode === 'manual' && renderManual()}
                </KeyboardAwareScrollView>
            )}
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
    zoneCard: { borderRadius: 16, padding: 16, marginBottom: 10 },
    zoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    zoneDot: { width: 14, height: 14, borderRadius: 7 },
    zoneLabel: { fontSize: 14, fontWeight: '800' },
    zoneDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    zoneCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    checkList: { marginTop: 12, paddingLeft: 26, gap: 6 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkDot: { width: 6, height: 6, borderRadius: 3 },
    checkText: { fontSize: 12, fontWeight: '500' },
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
    chipScroll: { maxHeight: 40, marginBottom: 16, flexGrow: 0 },
    chipScrollContent: { gap: 8, paddingHorizontal: 4 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    filterChipText: { fontSize: 13, fontWeight: '800' },
    listWrapper: { flex: 1 },
    sectionHeader: { paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
    sectionHeaderText: { fontSize: 16, fontWeight: '900' },
});
