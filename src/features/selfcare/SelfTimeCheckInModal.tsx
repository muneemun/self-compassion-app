import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import { X, Sparkles, Calendar, Trash2, CheckCircle2, Leaf } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { useSelfTimeStore } from '../../store/useSelfTimeStore';
import { SelfCareCategory, SELF_CARE_CATEGORY_LABELS } from '../../types/selfTime';

const { width, height } = Dimensions.get('window');

// 🎨 Theme Colors
const THEME = {
    primary: "#4A5D4E",    // Sage Green
    secondary: "#D98B73",  // Terracotta
    background: "#FCF9F2", // Ivory
    surface: "#FFFFFF",
    textMain: "#2F332F",
    textMuted: "#8C968D",
    accent: "#E9A15A",
};

const CATEGORY_ICONS: Record<SelfCareCategory, string> = {
    SOMATIC: "🏃",
    WRITING: "📝",
    CREATIVE: "🎨",
    SENSORY: "🧘",
    MINDFULNESS: "🌿",
};

const SMART_SUGGESTIONS: Record<SelfCareCategory, string[]> = {
    SOMATIC: ['복식 호흡 5분', '가벼운 스트레칭', '산책하기', '요가'],
    WRITING: ['감사 일기 쓰기', '감정 토해내기', '계획 세우기'],
    CREATIVE: ['그림 그리기', '음악 만들기', '취미 활동'],
    SENSORY: ['따뜻한 차 마시기', '향수/아로마', 'ASMR 듣기', '스마트폰 끄기'],
    MINDFULNESS: ['바디스캔 명상', '멍 때리기', '현재에 집중하기'],
};

// 🎚️ Custom Slider Component
const CustomSlider = React.memo(({ value, onChange, activeColor, trackColor, thumbColor }: any) => {
    const [sliderWidth, setSliderWidth] = useState(0);

    const handleTouch = (e: any) => {
        if (sliderWidth <= 0) return;
        const px = e.nativeEvent.locationX;
        const pct = Math.min(100, Math.max(0, Math.round((px / sliderWidth) * 100)));
        if (!isNaN(pct)) {
            onChange(pct);
        }
    };

    return (
        <View
            style={styles.sliderWrapper}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouch}
            onResponderMove={handleTouch}
        >
            <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: trackColor }]} />
            <View pointerEvents="none" style={[styles.sliderActive, { backgroundColor: activeColor, width: `${value}%` }]} />
            <View pointerEvents="none" style={[
                styles.sliderThumb,
                { backgroundColor: thumbColor, left: `${value}%`, borderColor: activeColor }
            ]} />
        </View>
    );
});

export const SelfTimeCheckInModal = () => {
    const { isSelfTimeModalOpen, setSelfTimeModalOpen, editingLogId, setRelationshipLogModalOpen } = useAppStore();
    const entries = useSelfTimeStore(state => state.entries);
    const addEntry = useSelfTimeStore(state => state.addEntry);
    const updateEntry = useSelfTimeStore(state => state.updateEntry);
    const deleteEntry = useSelfTimeStore(state => state.deleteEntry);

    const handleDelete = () => {
        Alert.alert(
            "기록 삭제",
            "이 기록을 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                { 
                    text: "삭제", 
                    style: "destructive",
                    onPress: () => {
                        if (editingLogId) {
                            deleteEntry(editingLogId);
                            handleClose();
                        }
                    }
                }
            ]
        );
    };

    const [category, setCategory] = useState<SelfCareCategory | null>(null);
    const [activityName, setActivityName] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(15);
    const [physicalEnergy, setPhysicalEnergy] = useState(30); 
    const [emotionalSatisfaction, setEmotionalSatisfaction] = useState(70);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Reset or Load state when opened
    useEffect(() => {
        if (isSelfTimeModalOpen) {
            if (editingLogId) {
                const entry = entries.find(e => e.id === editingLogId);
                if (entry) {
                    setCategory(entry.category);
                    setActivityName(entry.activityName);
                    setDurationMinutes(entry.durationMinutes);
                    setPhysicalEnergy(entry.physicalEnergy);
                    setEmotionalSatisfaction(entry.emotionalSatisfaction);
                    setDate(entry.createdAt.split('T')[0]);
                }
            } else {
                setCategory(null);
                setActivityName('');
                setDurationMinutes(15);
                setPhysicalEnergy(30);
                setEmotionalSatisfaction(70);
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [isSelfTimeModalOpen, editingLogId, entries]);

    const handleClose = () => {
        setSelfTimeModalOpen(false);
        // Clear editing state by closing through the app store helper if needed
        // but here we just need to ensure editingLogId doesn't interfere next time
        // The AppStore's setRelationshipLogModalOpen handles this for relationships, 
        // but for SelfTime we should also manage it.
        useAppStore.setState({ editingLogId: null });
    };

    const handleSave = () => {
        if (!category) return;

        // 📅 날짜 안전하게 처리
        let finalISODate = new Date().toISOString();
        try {
            if (date) {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    finalISODate = d.toISOString();
                }
            }
        } catch (e) {
            console.error("Invalid date format:", date);
        }

        if (editingLogId) {
            updateEntry(editingLogId, {
                category,
                activityName: activityName || SELF_CARE_CATEGORY_LABELS[category],
                durationMinutes,
                physicalEnergy,
                emotionalSatisfaction,
                createdAt: finalISODate
            });
        } else {
            addEntry(
                category,
                activityName || SELF_CARE_CATEGORY_LABELS[category],
                durationMinutes,
                physicalEnergy,
                emotionalSatisfaction,
                finalISODate
            );
            
            // 🚀 메타 인지 피드백 시각화 트리거 (새 기록일 때만)
            const { setCognitiveFeedback } = useAppStore.getState();
            setCognitiveFeedback({
                message: "나를 위한 시간으로 궤도 에너지가 충전되었어요!",
                type: 'SELF_CARE'
            });
        }

        handleClose();
    };

    const renderCategories = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>휴식의 성격 선택</Text>
            <View style={styles.categoryGrid}>
                {(Object.keys(SELF_CARE_CATEGORY_LABELS) as SelfCareCategory[]).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    const isSelected = category === cat;
                    const desc = {
                        SOMATIC: '몸의 긴장 해소',
                        WRITING: '생각 정리와 기록',
                        CREATIVE: '창의적 에너지 발산',
                        SENSORY: '오감의 즐거움',
                        MINDFULNESS: '현재에 머무르기'
                    }[cat];

                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryCardGrid, 
                                isSelected && { 
                                    borderColor: THEME.primary, 
                                    backgroundColor: THEME.white,
                                    borderWidth: 2,
                                }
                            ]}
                            onPress={() => {
                                setCategory(cat);
                                setActivityName('');
                            }}
                        >
                            <View style={[
                                styles.gridIconWrapper, 
                                isSelected ? { backgroundColor: THEME.primary + '10' } : { backgroundColor: THEME.primary + '05' }
                            ]}>
                                <Text style={{ fontSize: 24 }}>{Icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[
                                    styles.gridCategoryText, 
                                    isSelected ? { color: THEME.primary, fontWeight: '900' } : { color: THEME.textMain }
                                ]}>
                                    {SELF_CARE_CATEGORY_LABELS[cat]}
                                </Text>
                                <Text style={[
                                    styles.gridCategoryDesc,
                                    isSelected && { color: THEME.primary, opacity: 0.8 }
                                ]}>{desc}</Text>
                            </View>
                            {isSelected && (
                                <View style={[styles.checkBadge, { backgroundColor: THEME.primary, borderColor: THEME.white }]}>
                                    <CheckCircle2 size={12} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderSmartSuggestions = () => {
        if (!category) return null;
        const suggestions = SMART_SUGGESTIONS[category];

        return (
            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>추천 활동 목록</Text>
                    <View style={styles.badgeCount}>
                        <Text style={styles.badgeCountText}>{suggestions.length}</Text>
                    </View>
                </View>
                
                <View style={styles.suggestionVerticalList}>
                    {suggestions.map((suggestion) => {
                        const isActive = activityName === suggestion;
                        return (
                            <TouchableOpacity
                                key={suggestion}
                                style={[
                                    styles.suggestionCardFull, 
                                    isActive && { borderColor: THEME.secondary, backgroundColor: THEME.secondary + '08' }
                                ]}
                                onPress={() => setActivityName(suggestion)}
                            >
                                <View style={[styles.suggestionIconLarge, isActive && { backgroundColor: THEME.secondary }]}>
                                    <Sparkles size={16} color={isActive ? 'white' : THEME.secondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.suggestionTitleText, isActive && { color: THEME.secondary }]}>
                                        {suggestion}
                                    </Text>
                                    <Text style={styles.suggestionSubText}>
                                        {category === 'MINDFULNESS' ? '정신적 명료함 회복' : '정서적 에너지 충전'}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View style={styles.activeCheckCircle}>
                                        <CheckCircle2 size={16} color={THEME.secondary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.customInputWrapper}>
                    <Text style={styles.inputLabel}>직접 입력</Text>
                    <TextInput
                        style={styles.textInputCompact}
                        placeholder="위 목록에 없는 활동을 하셨나요?"
                        placeholderTextColor={THEME.textMuted}
                        value={activityName}
                        onChangeText={setActivityName}
                    />
                </View>
            </View>
        );
    };

    const renderDate = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>기록 날짜</Text>
            <View style={styles.dateInputWrapper}>
                <Calendar size={18} color={THEME.primary} style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.dateInput}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={THEME.textMuted}
                />
            </View>
        </View>
    );

    const renderDuration = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>얼마나 시간을 보냈나요?</Text>
            <View style={styles.durationRow}>
                {[5, 15, 30, 60].map((mins) => {
                    const label = mins < 60 ? `${mins}분` : '1시간+';
                    return (
                        <TouchableOpacity
                            key={mins}
                            style={[
                                styles.durationBtnCompact, 
                                durationMinutes === mins && { backgroundColor: THEME.primary, borderColor: THEME.primary }
                            ]}
                            onPress={() => setDurationMinutes(mins)}
                        >
                            <Text style={[
                                styles.durationTextCompact, 
                                durationMinutes === mins && { color: 'white' }
                            ]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderDeltaSliders = () => (
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Sparkles size={18} color={THEME.secondary} />
                <Text style={styles.sectionTitle}>활동 결과 평가</Text>
            </View>

            <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>신체적 에너지 소모량</Text>
                    <Text style={[styles.sliderValue, { color: THEME.primary }]}>
                        {physicalEnergy < 30 ? '가벼움' : physicalEnergy < 70 ? '적당함' : '방전됨'} ({Math.round(physicalEnergy || 0)}%)
                    </Text>
                </View>
                <CustomSlider
                    value={physicalEnergy}
                    onChange={setPhysicalEnergy}
                    activeColor={THEME.primary}
                    trackColor="rgba(74, 93, 78, 0.1)"
                    thumbColor="#FFF"
                />
                <View style={styles.sliderGuideRow}>
                    <Text style={styles.sliderGuideText}>매우 가벼움</Text>
                    <Text style={styles.sliderGuideText}>완전 연소</Text>
                </View>
            </View>

            <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>정서적 충족감 (만족도)</Text>
                    <Text style={[styles.sliderValue, { color: THEME.secondary }]}>
                        {emotionalSatisfaction < 30 ? '아쉬움' : emotionalSatisfaction < 70 ? '무난함' : '완벽함'} ({Math.round(emotionalSatisfaction || 0)}%)
                    </Text>
                </View>
                <CustomSlider
                    value={emotionalSatisfaction}
                    onChange={setEmotionalSatisfaction}
                    activeColor={THEME.secondary}
                    trackColor="rgba(217, 139, 115, 0.1)"
                    thumbColor="#FFF"
                />
                <View style={styles.sliderGuideRow}>
                    <Text style={styles.sliderGuideText}>의무감/도피성</Text>
                    <Text style={styles.sliderGuideText}>충전/성취감</Text>
                </View>
            </View>
        </View>
    );

    return (
        <Modal
            visible={isSelfTimeModalOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.bottomSheet}
                >
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>🌿 {editingLogId ? '기록 수정' : '나와의 시간 기록'}</Text>
                            <Text style={styles.subtitle}>온전히 나를 위해 쓴 에너지를 채워주세요</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {editingLogId && (
                                <TouchableOpacity style={styles.closeBtn} onPress={handleDelete}>
                                    <Trash2 size={20} color={THEME.secondary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                                <X size={24} color={THEME.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {renderCategories()}

                        {category && (
                            <View>
                                {renderSmartSuggestions()}
                                {renderDate()}
                                {renderDuration()}
                                {renderDeltaSliders()}

                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={handleSave}
                                >
                                        <Text style={styles.saveBtnText}>{editingLogId ? '수정 사항 저장' : '기록 완료하고 에너지 채우기'}</Text>
                                </TouchableOpacity>
                                <View style={{ height: 40 }} />
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        backgroundColor: THEME.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: height * 0.9,
        minHeight: height * 0.5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(74, 93, 78, 0.2)',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(74, 93, 78, 0.05)',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.textMuted,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 24,
        gap: 32,
    },
    section: {
        marginBottom: 32,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.textMain,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCardGrid: {
        width: (width - 60) / 2, // 2 columns
        backgroundColor: THEME.surface,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.08)',
    },
    gridIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridCategoryText: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME.textMain,
    },
    gridCategoryDesc: {
        fontSize: 10,
        fontWeight: '600',
        color: THEME.textMuted,
        marginTop: 2,
    },
    checkBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeCount: {
        backgroundColor: THEME.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeCountText: {
        fontSize: 12,
        fontWeight: '800',
        color: THEME.primary,
    },
    suggestionVerticalList: {
        gap: 10,
    },
    suggestionCardFull: {
        backgroundColor: THEME.surface,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.08)',
    },
    suggestionIconLarge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: THEME.secondary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestionTitleText: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.textMain,
    },
    suggestionSubText: {
        fontSize: 12,
        color: THEME.textMuted,
        marginTop: 2,
        fontWeight: '500',
    },
    activeCheckCircle: {
        padding: 4,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME.textMuted,
        marginBottom: 10,
        marginLeft: 4,
    },
    customInputWrapper: {
        marginTop: 16,
    },
    textInputCompact: {
        backgroundColor: THEME.surface,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
        borderRadius: 20,
        padding: 14,
        paddingHorizontal: 20,
        fontSize: 15,
        fontWeight: '600',
        color: THEME.textMain,
    },
    durationRow: {
        flexDirection: 'row',
        gap: 8,
    },
    durationBtnCompact: {
        flex: 1,
        height: 48,
        backgroundColor: THEME.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationTextCompact: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME.textMain,
    },
    sliderContainer: {
        marginBottom: 20,
    },
    sliderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sliderLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.textMuted,
    },
    sliderValue: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.textMain,
    },
    sliderWrapper: {
        height: 44,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        position: 'absolute',
    },
    sliderActive: {
        height: 8,
        borderRadius: 4,
        position: 'absolute',
    },
    sliderThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        position: 'absolute',
        marginLeft: -14,
        borderWidth: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    sliderGuideRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    sliderGuideText: {
        fontSize: 11,
        color: THEME.textMuted,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: THEME.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 24,
        gap: 8,
        marginTop: 16,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    dateInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.08)',
    },
    dateInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: THEME.textMain,
    },
});
