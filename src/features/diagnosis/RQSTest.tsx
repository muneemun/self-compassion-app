import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Easing, Alert, BackHandler, ScrollView, ActivityIndicator } from 'react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, Check, Users, Info, X, Shield, ArrowRight, Star, Heart, Zap, TrendingUp, RefreshCw, Activity } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width, height } = Dimensions.get('window');

interface RQSTestProps {
    relationshipId: string;
    onBack: () => void;
    onComplete: () => void;
}

type RQSPhase = 'TEST' | 'ANIMATION' | 'RESULT';

interface RQSQuestion {
    id: number;
    area: 'safety' | 'vitality' | 'growth' | 'reciprocity';
    areaLabel: string;
    title: string;
}

const RQS_QUESTIONS: RQSQuestion[] = [
    { id: 1, area: 'safety', areaLabel: '심리적 안전 영역', title: '이 사람 앞에서는 나의 실수나 약점을 숨기지 않고 솔직하게 말할 수 있는가?' },
    { id: 2, area: 'safety', areaLabel: '심리적 안전 영역', title: '내가 어떤 감정을 느껴도 이 사람이 나를 비난하거나 평가하지 않을 것이라 믿는가?' },
    { id: 3, area: 'vitality', areaLabel: '에너지 대사 영역', title: '이 사람과 대화하거나 헤어진 직후, 정신적으로 활력이 생기고 기분이 고양되는가?' },
    { id: 4, area: 'vitality', areaLabel: '에너지 대사 영역', title: '만남 도중 눈치를 보거나 비위를 맞추느라 신체적 긴장을 느끼지 않는가?' },
    { id: 5, area: 'growth', areaLabel: '성장 및 정체성 영역', title: '이 사람은 나의 장점을 구체적으로 발견해주고, 내가 더 나은 사람이 되고 싶게 만드는가?' },
    { id: 6, area: 'growth', areaLabel: '성장 및 정체성 영역', title: '이 사람과 함께 있을 때 꾸며낸 모습이 아닌, 가장 나다운 모습으로 존재할 수 있는가?' },
    { id: 7, area: 'reciprocity', areaLabel: '상호 호혜 영역', title: '내가 좋은 소식을 전했을 때, 이 사람은 진심으로 기뻐하며 축하해주는가?' },
    { id: 8, area: 'reciprocity', areaLabel: '상호 호혜 영역', title: '대화의 비중이 일방적이지 않으며, 충분히 경청받고 존중받는 느낌인가?' },
];

const GRADES: Record<'S' | 'A' | 'B' | 'C', { name: string; min: number; color: string; desc: string }> = {
    S: { name: '소울 앵커 (Soul Anchor)', min: 14, color: '#D98B73', desc: '[절대 긍정] 당신의 회복탄력성 그 자체입니다. 위기 시 당신을 지탱할 \'마법의 숫자 1~3명\'에 해당합니다. 시간과 에너지를 최우선으로 투자하십시오.' },
    A: { name: '비전 미러 (Vision Mirror)', min: 10, color: '#4A5D4E', desc: '[성장 촉진] 건강한 자아상을 강화하는 거울입니다. 슬럼프에 빠졌을 때나 새로운 도전을 할 때 이들과 교류하여 긍정적 자극을 받으십시오.' },
    B: { name: '뉴트럴 오비터 (Neutral Orbiter)', min: 6, color: '#8A9A8D', desc: '[감정 중립] 해롭지는 않으나 자아 성장에 큰 도움은 안 됩니다. 인지적 부하를 줄이기 위해 최소한의 예의와 매너로만 대응하는 \'사회적 거리\'를 유지하십시오.' },
    C: { name: '에너지 뱀파이어 (Vampire)', min: 0, color: '#2C2C2C', desc: '[독성 관계] 당신의 자아를 파괴하고 스트레스 호르몬(코르티솔)을 급증시킵니다. 정서적 분리(Gray Rock)를 즉시 시행하고 사적인 유대를 끊으십시오.' },
};

export const RQSTest = ({ relationshipId, onBack, onComplete }: RQSTestProps) => {
    const colors = useColors();
    const { getRelationshipById, updateRelationship, updateDiagnosisResult } = useRelationshipStore();
    const node = getRelationshipById(relationshipId);

    const [phase, setPhase] = useState<RQSPhase>('TEST');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

    // Animation for result
    const resultScale = useRef(new Animated.Value(0.8)).current;
    const resultOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
        return () => backHandler.remove();
    }, [phase, answers]);

    const handleBack = () => {
        if (phase === 'TEST' && answers.length > 0) {
            Alert.alert('테스트 중단', '지금 나가면 테스트 결과가 저장되지 않습니다. 정말 나갈까요?', [
                { text: '계속하기', style: 'cancel' },
                { text: '나가기', style: 'destructive', onPress: onBack }
            ]);
            return true;
        }
        onBack();
        return true;
    };

    const handleSelectScore = (score: number) => {
        const newAnswers = [...answers, score];
        setAnswers(newAnswers);

        if (currentQuestionIdx < RQS_QUESTIONS.length - 1) {
            // Next question
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
                setCurrentQuestionIdx(currentQuestionIdx + 1);
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
            });
        } else {
            // End of test -> Start Animation
            startAnimation(newAnswers);
        }
    };

    const startAnimation = (finalAnswers: number[]) => {
        setPhase('ANIMATION');
        // Logic will resume after animation
        setTimeout(() => {
            calculateAndSave(finalAnswers);
        }, 2500);
    };

    const calculateAndSave = (finalAnswers: number[]) => {
        const total = finalAnswers.reduce((a, b) => a + b, 0);
        let grade: 'S' | 'A' | 'B' | 'C' = 'C';
        if (total >= 14) grade = 'S';
        else if (total >= 10) grade = 'A';
        else if (total >= 6) grade = 'B';

        const areaScores = {
            safety: finalAnswers[0] + finalAnswers[1],
            vitality: finalAnswers[2] + finalAnswers[3],
            growth: finalAnswers[4] + finalAnswers[5],
            reciprocity: finalAnswers[6] + finalAnswers[7],
        };

        const rqsResult = {
            totalScore: total,
            grade,
            category: (grade === 'S' ? 'Soul Anchor' : grade === 'A' ? 'Vision Mirror' : grade === 'B' ? 'Neutral' : 'Vampire') as any,
            areaScores,
            lastChecked: new Date().toISOString()
        };

        // Record history
        const oxytocin = Math.round((areaScores.vitality + areaScores.reciprocity) / 8 * 100);
        const cortisol = Math.round((4 - areaScores.safety) / 4 * 100);
        const temperature = Math.round((total / 16) * 100);

        updateDiagnosisResult(relationshipId, {
            temperature,
            oxytocin,
            cortisol,
            rqsResult,
            event: `RQS 심화 진단 (${grade}등급)`
        });

        setPhase('RESULT');

        Animated.parallel([
            Animated.spring(resultScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            Animated.timing(resultOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();
    };

    if (!node) return null;

    const renderHeader = () => (
        <View style={COMMON_STYLES.headerContainer}>
            <TouchableOpacity onPress={handleBack} style={COMMON_STYLES.secondaryActionBtn}>
                <ArrowLeft size={UI_CONSTANTS.ICON_SIZE} color={colors.primary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
                <Text style={[styles.headerSub, { color: colors.primary, opacity: 0.5 }]}>RQS 심화 진단</Text>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>캐릭터 판별 테스트</Text>
            </View>
            <View style={{ width: UI_CONSTANTS.BUTTON_SIZE }} />
        </View>
    );

    const renderTest = () => {
        const q = RQS_QUESTIONS[currentQuestionIdx];
        const progress = ((currentQuestionIdx + 1) / RQS_QUESTIONS.length) * 100;

        return (
            <View style={styles.testContainer}>
                <View style={styles.progressArea}>
                    <View style={styles.progressRow}>
                        <Text style={[styles.areaTag, { color: colors.accent }]}>{q.areaLabel}</Text>
                        <Text style={[styles.questionCounter, { color: colors.primary }]}>
                            {currentQuestionIdx + 1} <Text style={{ opacity: 0.2 }}>/ 8</Text>
                        </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.primary + '10' }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
                    </View>
                </View>

                <Animated.View style={[styles.questionArea, { opacity: fadeAnim }]}>
                    <View style={styles.nodeRef}>
                        <Image source={{ uri: node.image }} style={styles.miniAvatar} />
                        <Text style={[styles.nodeRefText, { color: colors.primary }]}>{node.name}님과의 관계</Text>
                    </View>
                    <Text style={[styles.questionText, { color: colors.primary }]}>{q.title}</Text>
                </Animated.View>

                <View style={styles.answerArea}>
                    {[
                        { label: '전혀 아니다', score: 0, icon: <X size={20} color={colors.primary} /> },
                        { label: '대체로 그렇다', score: 1, icon: <Heart size={20} color={colors.accent} /> },
                        { label: '매우 그렇다', score: 2, icon: <Star size={20} color="#FFD700" /> },
                    ].map((btn) => (
                        <TouchableOpacity
                            key={btn.score}
                            style={[styles.answerBtn, { backgroundColor: colors.white, borderColor: colors.primary + '10' }]}
                            onPress={() => handleSelectScore(btn.score)}
                        >
                            <View style={styles.answerIcon}>{btn.icon}</View>
                            <Text style={[styles.answerLabel, { color: colors.primary }]}>{btn.label}</Text>
                            <View style={[styles.scoreBadge, { backgroundColor: colors.primary + '08' }]}>
                                <Text style={[styles.scoreText, { color: colors.primary }]}>{btn.score}pt</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderAnimation = () => (
        <View style={styles.animContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.animText, { color: colors.primary }]}>관계를 공명하고 캐릭터를 판별하는 중...</Text>
        </View>
    );

    const renderResult = () => {
        const res = node.rqsResult;
        if (!res) return null;
        const guide = GRADES[res.grade];

        const oxytocin = Math.round((res.areaScores.vitality + res.areaScores.reciprocity) / 8 * 100);
        const cortisol = Math.round((4 - res.areaScores.safety) / 4 * 100);

        const getPrescriptionActions = (grade: string) => {
            const actions: Record<string, string[]> = {
                S: ['정기적인 깊은 대화 시간 확보', '솔직한 감정 공유 및 감사 표현', '위기 시 가장 먼저 도움 요청하기'],
                A: ['중요한 도전 전 피드백 듣기', '슬럼프 시 의도적인 교류 갖기', '함께 성장하는 활동 참여하기'],
                B: ['비즈니스 매너 중심의 소통', '감정적 기대치와 투자 낮추기', '필요할 때만 선별적 연락'],
                C: ['사적인 정보 공유 자제 (Grey Rock)', '연락 횟수 및 소요 시간 제한', '감정적 거절 연습 (No-Go Zone)'],
            };
            return actions[grade] || [];
        };

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultScroll}>
                <Animated.View style={[styles.resultTop, { transform: [{ scale: resultScale }], opacity: resultOpacity }]}>
                    <View style={[styles.auraBackground, { backgroundColor: guide.color + '15' }]} />

                    <View style={styles.resultHeader}>
                        <View style={[styles.gradeBadge, { backgroundColor: guide.color }]}>
                            <Text style={styles.gradeText}>{res.grade}</Text>
                        </View>
                        <View>
                            <Text style={[styles.characterName, { color: colors.primary }]}>{guide.name}</Text>
                            <Text style={[styles.characterSub, { color: colors.primary, opacity: 0.5 }]}>RQS Relationship Character</Text>
                        </View>
                    </View>

                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarRing, { borderColor: guide.color }]}>
                            {node.image ? (
                                <Image source={{ uri: node.image }} style={styles.largeAvatar} />
                            ) : (
                                <View style={[styles.largeAvatar, { backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Users size={60} color={colors.primary} style={{ opacity: 0.1 }} />
                                </View>
                            )}
                        </View>
                        <View style={[styles.scoreFloatingBadge, { backgroundColor: guide.color }]}>
                            <Text style={styles.floatingScoreText}>{res.totalScore}pt</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Depth Analysis Card */}
                <View style={styles.analysisCard}>
                    <View style={styles.cardHeader}>
                        <Activity size={18} color={guide.color} />
                        <Text style={[styles.cardTitle, { color: colors.primary }]}>심층 관계 진단</Text>
                    </View>
                    <Text style={[styles.descriptionText, { color: colors.primary }]}>{guide.desc}</Text>

                    <View style={styles.divider} />

                    <View style={styles.statGrid}>
                        {[
                            { label: '심리 안전', val: res.areaScores.safety, icon: <Shield size={16} color="#D98B73" /> },
                            { label: '에너지 활력', val: res.areaScores.vitality, icon: <Zap size={16} color="#F1C40F" /> },
                            { label: '성장 동력', val: res.areaScores.growth, icon: <TrendingUp size={16} color="#4A5D4E" /> },
                            { label: '상호 호례', val: res.areaScores.reciprocity, icon: <RefreshCw size={16} color="#3498DB" /> },
                        ].map((stat) => (
                            <View key={stat.label} style={styles.statItem}>
                                <View style={styles.statHeader}>
                                    {stat.icon}
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                                <View style={styles.miniBarTrack}>
                                    <View style={[styles.miniBarFill, { width: `${(stat.val / 4) * 100}%`, backgroundColor: guide.color }]} />
                                </View>
                                <Text style={styles.statValInside}>{stat.val}/4</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Impact Analysis Section */}
                <View style={styles.impactSection}>
                    <Text style={styles.sectionTitle}>상태 영향도 분석</Text>
                    <View style={styles.impactContainer}>
                        <View style={[styles.impactBox, { backgroundColor: '#E8F5E9' }]}>
                            <Heart size={20} color="#2E7D32" fill="#2E7D32" />
                            <Text style={styles.impactLabel}>옥시토신</Text>
                            <Text style={[styles.impactValue, { color: '#2E7D32' }]}>{oxytocin}%</Text>
                        </View>
                        <View style={[styles.impactBox, { backgroundColor: '#FFF3E0' }]}>
                            <Zap size={20} color="#E65100" fill="#E65100" />
                            <Text style={styles.impactLabel}>코르티솔</Text>
                            <Text style={[styles.impactValue, { color: '#E65100' }]}>{cortisol}%</Text>
                        </View>
                    </View>
                </View>

                {/* Prescription Card */}
                <View style={[styles.prescriptionCard, { borderColor: guide.color + '40' }]}>
                    <View style={[styles.pillHeader, { backgroundColor: guide.color }]}>
                        <Info size={14} color="#fff" />
                        <Text style={styles.pillHeaderText}>Relationship Prescription</Text>
                    </View>
                    <Text style={styles.prescriptionTitle}>관리 처방전</Text>
                    <View style={styles.actionList}>
                        {getPrescriptionActions(res.grade).map((action, i) => (
                            <View key={i} style={styles.actionItem}>
                                <View style={[styles.actionDot, { backgroundColor: guide.color }]} />
                                <Text style={styles.actionText}>{action}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                    onPress={onComplete}
                >
                    <Text style={styles.confirmText}>결과 저장 및 궤도 확인</Text>
                    <Check size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        );
    };

    return (
        <HubLayout header={renderHeader()} scrollable={false}>
            <View style={styles.container}>
                {phase === 'TEST' && renderTest()}
                {phase === 'ANIMATION' && renderAnimation()}
                {phase === 'RESULT' && renderResult()}
            </View>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    headerTitle: { fontSize: 16, fontWeight: '800' },
    testContainer: { flex: 1, padding: 24 },
    progressArea: { marginBottom: 40 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    areaTag: { fontSize: 13, fontWeight: '800' },
    questionCounter: { fontSize: 18, fontWeight: '900' },
    progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    questionArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    nodeRef: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 2 },
    miniAvatar: { width: 24, height: 24, borderRadius: 12 },
    nodeRefText: { fontSize: 13, fontWeight: '700' },
    questionText: { fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
    answerArea: { gap: 12, marginBottom: 20 },
    answerBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1 },
    answerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    answerLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
    scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    scoreText: { fontSize: 12, fontWeight: '800' },
    animContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    animText: { marginTop: 20, fontSize: 16, fontWeight: '600', opacity: 0.6 },
    resultScroll: { padding: 24, paddingBottom: 60 },
    resultTop: { alignItems: 'center', marginBottom: 30 },
    gradeCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    gradeValue: { fontSize: 48, fontWeight: '900' },
    gradeSub: { fontSize: 10, fontWeight: '800', marginTop: -5 },
    resultCategory: { fontSize: 24, fontWeight: '800', marginBottom: 15 },
    scoreRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    scoreMain: { fontSize: 18, fontWeight: '900' },
    scoreTotal: { fontSize: 13, fontWeight: '700', opacity: 0.6 },
    diagnosisCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 30, elevation: 2 },
    cardLabel: { fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
    diagnosisText: { fontSize: 15, fontWeight: '600', lineHeight: 24, marginBottom: 24 },
    chartArea: { gap: 16 },
    chartRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chartInfo: { width: 80, flexDirection: 'row', alignItems: 'center', gap: 6 },
    chartLabel: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
    barTrack: { flex: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2 },
    barFill: { height: '100%', borderRadius: 2 },
    chartVal: { width: 30, fontSize: 12, fontWeight: '800', textAlign: 'right' },
    confirmBtn: { height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 },
    confirmText: { color: '#fff', fontSize: 18, fontWeight: '800' },

    // New Premium Report Styles
    auraBackground: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        top: -width * 0.4,
        zIndex: -1,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 30,
        width: '100%',
    },
    gradeBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradeText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
    },
    characterName: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    characterSub: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        padding: 5,
        borderStyle: 'dashed',
    },
    largeAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 65,
    },
    scoreFloatingBadge: {
        position: 'absolute',
        bottom: -10,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 5,
    },
    floatingScoreText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    analysisCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '600',
        opacity: 0.8,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 20,
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statItem: {
        width: '47%',
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: 12,
        borderRadius: 20,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.6,
    },
    miniBarTrack: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        marginBottom: 4,
    },
    miniBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    statValInside: {
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'right',
        opacity: 0.8,
    },
    impactSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    impactContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    impactBox: {
        flex: 1,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        gap: 6,
    },
    impactLabel: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.6,
    },
    impactValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    prescriptionCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginBottom: 32,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    pillHeader: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    pillHeaderText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    prescriptionTitle: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 16,
    },
    actionList: {
        gap: 12,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.8,
        flex: 1,
    },
});
