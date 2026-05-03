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
import { X, Sparkles, Calendar } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { useSelfTimeStore } from '../../store/useSelfTimeStore';
import { SelfCareCategory, SELF_CARE_CATEGORY_LABELS } from '../../types/selfTime';

const { height } = Dimensions.get('window');

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
            <View style={[styles.sliderTrack, { backgroundColor: trackColor }]} />
            <View style={[styles.sliderActive, { backgroundColor: activeColor, width: `${value}%` }]} />
            <View style={[
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
                message: "외부 중력장의 간섭을 차단했습니다. 시스템이 자아 회복 모드로 전환됩니다.",
                type: 'SELF_CARE'
            });
        }

        handleClose();
    };

    const renderCategories = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>어떤 종류의 휴식이었나요?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {(Object.keys(SELF_CARE_CATEGORY_LABELS) as SelfCareCategory[]).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    const isSelected = category === cat;
                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                            onPress={() => {
                                setCategory(cat);
                                setActivityName('');
                            }}
                        >
                            <View style={[styles.iconWrapper, isSelected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={{ fontSize: 24 }}>{Icon}</Text>
                            </View>
                            <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                                {SELF_CARE_CATEGORY_LABELS[cat]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderSmartSuggestions = () => {
        if (!category) return null;
        const suggestions = SMART_SUGGESTIONS[category];

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>무엇을 했나요?</Text>
                <View style={styles.chipsContainer}>
                    {suggestions.map((suggestion) => (
                        <TouchableOpacity
                            key={suggestion}
                            style={[styles.chip, activityName === suggestion && styles.chipActive]}
                            onPress={() => setActivityName(suggestion)}
                        >
                            <Text style={[styles.chipText, activityName === suggestion && styles.chipTextActive]}>
                                {suggestion}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    style={styles.textInput}
                    placeholder="직접 입력하기..."
                    placeholderTextColor={THEME.textMuted}
                    value={activityName}
                    onChangeText={setActivityName}
                />
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
            <View style={styles.chipsContainer}>
                {[5, 15, 30, 60].map((mins) => (
                    <TouchableOpacity
                        key={mins}
                        style={[styles.durationBtn, durationMinutes === mins && styles.durationBtnActive]}
                        onPress={() => setDurationMinutes(mins)}
                    >
                        <Text style={[styles.durationText, durationMinutes === mins && styles.durationTextActive]}>
                            {mins >= 60 ? '1시간+' : `${mins}분`}
                        </Text>
                    </TouchableOpacity>
                ))}
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
                        {physicalEnergy < 30 ? '가벼움' : physicalEnergy < 70 ? '적당함' : '방전됨'} ({physicalEnergy}%)
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
                        {emotionalSatisfaction < 30 ? '아쉬움' : emotionalSatisfaction < 70 ? '무난함' : '완벽함'} ({emotionalSatisfaction}%)
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
                        <View>
                            <Text style={styles.title}>🌿 {editingLogId ? '기록 수정' : '나와의 시간 기록'}</Text>
                            <Text style={styles.subtitle}>온전히 나를 위해 쓴 에너지를 채워주세요</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                            <X size={24} color={THEME.textMuted} />
                        </TouchableOpacity>
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
    categoryScroll: {
        gap: 12,
        paddingRight: 24,
    },
    categoryCard: {
        width: 100,
        height: 110,
        backgroundColor: THEME.surface,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.08)',
        shadowColor: "#4A5D4E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryCardActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME.textMain,
        textAlign: 'center',
    },
    categoryTextActive: {
        color: 'white',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: THEME.surface,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
    },
    chipActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.textMuted,
    },
    chipTextActive: {
        color: 'white',
        fontWeight: '700',
    },
    textInput: {
        backgroundColor: THEME.surface,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        fontWeight: '600',
        color: THEME.textMain,
        marginTop: 4,
    },
    durationBtn: {
        flex: 1,
        minWidth: 70,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
    },
    durationBtnActive: {
        backgroundColor: 'rgba(217, 139, 115, 0.1)',
        borderColor: THEME.secondary,
    },
    durationText: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.textMuted,
    },
    durationTextActive: {
        color: THEME.secondary,
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
