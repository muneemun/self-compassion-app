import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Easing, Alert, BackHandler } from 'react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, Check, Users, Info, X, Shield, ArrowRight, Star, Zap, RotateCcw } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width, height } = Dimensions.get('window');

interface DiagnosisProps {
    relationshipId: string;
    mode?: "ZONE" | "RQS";
    onBack: () => void;
}

type DiagnosisStep = 'CHECKLIST' | 'ANIMATION' | 'RESULT' | 'RQS';
import { RQSTest } from './RQSTest';

interface AlgorithmicQuestion {
    id: number;
    phase: string;
    title: string;
    targetZone: number;
    description: string;
}

const CHECKLIST: AlgorithmicQuestion[] = [
    {
        id: 1,
        phase: 'Phase A: 핵심 관계 판별',
        title: '내가 갑자기 입원하거나 큰 위기에 처했을 때 밤낮없이 달려올 사람인가?',
        targetZone: 1,
        description: '위급 상황에서의 헌신성'
    },
    {
        id: 2,
        phase: 'Phase A: 핵심 관계 판별',
        title: '나의 가장 부끄러운 비밀이나 취약함을 온전히 드러낼 수 있는가?',
        targetZone: 1,
        description: '심리적 안전감과 정서적 노출'
    },
    {
        id: 3,
        phase: 'Phase A: 핵심 관계 판별',
        title: '용건이 없어도 안부를 묻기 위해 한 달에 한 번 이상 연락하고 만나는가?',
        targetZone: 2,
        description: '일상적 교감의 자발성'
    },
    {
        id: 4,
        phase: 'Phase A: 핵심 관계 판별',
        title: '이 사람의 행복이나 슬픔이 내 감정에 깊은 영향을 미치는가?',
        targetZone: 2,
        description: '감정적 전이와 공감도'
    },
    {
        id: 5,
        phase: 'Phase B: 기능적 관계 판별',
        title: '사적인 친밀감은 낮지만, 업무나 목표를 위해 매주 소통해야 하는가?',
        targetZone: 3,
        description: '사적 친밀도는 낮으나 주기적 소통 필요'
    },
    {
        id: 6,
        phase: 'Phase B: 기능적 관계 판별',
        title: '함께 일하거나 공동체 활동을 할 때 반드시 협력해야 하는 대상인가?',
        targetZone: 3,
        description: '공동의 목표를 위한 필수 협력'
    },
    {
        id: 7,
        phase: 'Phase C: 인지적 관계 판별',
        title: '1년에 한 번이라도 연락을 주고받으며 서로의 근황을 알고 있는가?',
        targetZone: 4,
        description: '최소한의 소통 유지 여부'
    },
    {
        id: 8,
        phase: 'Phase C: 인지적 관계 판별',
        title: '길에서 우연히 만났을 때 10분 이상 막힘없이 대화가 가능한가?',
        targetZone: 4,
        description: '사회적 친숙도 및 인지 상태'
    },
    {
        id: 9,
        phase: 'Phase D: 관계 정리 판별',
        title: '지난 1년간 한 번도 교류가 없었으며 연락할 계획도 없는가?',
        targetZone: 5,
        description: '관계의 휴면/종료 상태'
    },
    {
        id: 10,
        phase: 'Phase D: 관계 정리 판별',
        title: '이 사람의 소식이 내 삶에 어떠한 영향도 주지 않는가?',
        targetZone: 5,
        description: '정서적 단절 및 삭제/차단 검토'
    }
];

const ZONE_GUIDES: Record<number, any> = {
    1: { name: '안전 기지', energy: '50%', color: '#D98B73', desc: '무조건적인 수용과 정서적 안전감 제공', title: 'Safety Base' },
    2: { name: '심리적 우군', energy: '25%', color: '#4A5D4E', desc: '가치관을 공유하며 정기적으로 교류함', title: 'Psychological Ally' },
    3: { name: '전략적 동행', energy: '15%', color: '#6B7F70', desc: '업무/필요에 의해 자주 보나 유대는 낮음', title: 'Strategic Partner' },
    4: { name: '사회적 지인', energy: '10%', color: '#8A9A8D', desc: '이름과 얼굴을 아는 인지적 한계선', title: 'Social Acquaintance' },
    5: { name: '배경 소음', energy: '0%', color: '#B0B0B0', desc: '인지 범위 밖의 타인 및 불필요한 연결', title: 'Background Noise' },
};

export const RelationshipDiagnosis = ({ relationshipId, mode = "ZONE", onBack }: DiagnosisProps) => {
    const colors = useColors();
    const { getRelationshipById, updateRelationship, updateDiagnosisResult } = useRelationshipStore();
    const node = getRelationshipById(relationshipId);

    const [step, setStep] = useState<DiagnosisStep>(mode === "RQS" ? "RQS" : "CHECKLIST");
    const [currentStep, setCurrentStep] = useState(0);
    const [finalZone, setFinalZone] = useState(1);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const orbitRotate = useRef(new Animated.Value(0)).current;
    const nodeScale = useRef(new Animated.Value(0)).current;

    const handleBackPress = () => {
        if (step === "CHECKLIST" || step === "RQS") {
            Alert.alert(
                '진단 중단',
                '지금 나가면 진단 과정이 저장되지 않습니다. 정말 중단할까요?',
                [
                    { text: '계속 진단', style: 'cancel' },
                    { text: '중단하고 나가기', style: 'destructive', onPress: () => onBack() }
                ]
            );
            return true;
        }

        // RESULT 단계에서는 알럿 없이 나감
        onBack();
        return true;
    };

    useEffect(() => {
        if (step === 'ANIMATION') {
            // Start orbit animation
            Animated.parallel([
                Animated.timing(orbitRotate, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(500),
                    Animated.spring(nodeScale, {
                        toValue: 1,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    })
                ])
            ]).start(() => {
                setTimeout(() => {
                    setStep('RESULT');
                }, 1000);
            });
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => backHandler.remove();
    }, [step]);

    if (!node) return null;

    const handleAnswer = (isYes: boolean) => {
        if (isYes) {
            const target = CHECKLIST[currentStep].targetZone;
            const temp = target === 1 ? 98 : target === 2 ? 85 : target === 3 ? 60 : target === 4 ? 30 : 5;
            setFinalZone(target);

            updateDiagnosisResult(relationshipId, {
                zone: target,
                temperature: temp,
                event: '관계 층위 재설정'
            });

            startTransition('ANIMATION');
        } else {
            if (currentStep < CHECKLIST.length - 1) {
                transitionQuestion();
            } else {
                setFinalZone(5);
                updateDiagnosisResult(relationshipId, {
                    zone: 5,
                    temperature: 0,
                    event: '관계 층위 재설정'
                });
                startTransition('ANIMATION');
            }
        }
    };

    const startTransition = (nextStep: DiagnosisStep) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            setStep(nextStep);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }).start();
        });
    };

    const transitionQuestion = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true
        }).start(() => {
            setCurrentStep(currentStep + 1);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true
            }).start();
        });
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            }).start(() => {
                setCurrentStep(currentStep - 1);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true
                }).start();
            });
        }
    };

    const renderHeader = () => {
        if (step === 'RESULT') return null;
        return (
            <View style={[COMMON_STYLES.headerContainer, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={handleBackPress} style={COMMON_STYLES.secondaryActionBtn}>
                    <X size={UI_CONSTANTS.ICON_SIZE} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSub, { color: colors.primary, opacity: 0.5 }]}>Orbit Diagnosis</Text>
                    <Text style={[styles.headerTitle, { color: colors.primary }]}>
                        {step === 'CHECKLIST' ? '단계별 배치 매뉴얼' : '인덱싱 중...'}
                    </Text>
                </View>
                <View style={{ width: UI_CONSTANTS.BUTTON_SIZE }} />
            </View>
        );
    };

    const renderChecklist = () => {
        const currentQuestion = CHECKLIST[currentStep];
        const progress = ((currentStep + 1) / CHECKLIST.length) * 100;

        return (
            <Animated.View style={[styles.checklistContent, { opacity: fadeAnim }]}>
                <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                        <Text style={[styles.phaseText, { color: colors.accent }]}>{currentQuestion.phase}</Text>
                        <Text style={[styles.stepCounter, { color: colors.primary }]}>
                            {currentStep + 1} <Text style={{ opacity: 0.3 }}>/ {CHECKLIST.length}</Text>
                        </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.primary + '1A' }]}>
                        <Animated.View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>

                <View style={styles.questionArea}>
                    <View style={styles.profileBadge}>
                        <View style={styles.avatarMini}>
                            {node.image ? (
                                <Image source={{ uri: node.image }} style={styles.avatarImg} />
                            ) : (
                                <Users size={14} color={colors.primary} />
                            )}
                        </View>
                        <Text style={[styles.profileName, { color: colors.primary }]}>{node.name}님과의 관계</Text>
                    </View>

                    <View style={styles.questionCard}>
                        <View style={styles.quoteMark}>
                            <Text style={[styles.quoteText, { color: colors.primary, opacity: 0.08 }]}>“</Text>
                        </View>
                        <Text style={[styles.questionText, { color: colors.primary }]}>
                            {currentQuestion.title}
                        </Text>
                        <View style={[styles.descBadge, { backgroundColor: colors.primary + '0D' }]}>
                            <Info size={14} color={colors.primary} style={{ opacity: 0.5 }} />
                            <Text style={[styles.descText, { color: colors.primary, opacity: 0.6 }]}>
                                {currentQuestion.description}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionArea}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.yesBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleAnswer(true)}
                    >
                        <Check color={colors.white} size={24} />
                        <Text style={styles.yesText}>예</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.noBtn, { borderColor: colors.primary + '33' }]}
                        onPress={() => handleAnswer(false)}
                    >
                        <X color={colors.primary} size={24} style={{ opacity: 0.5 }} />
                        <Text style={[styles.noText, { color: colors.primary }]}>아니오</Text>
                    </TouchableOpacity>

                    {currentStep > 0 && (
                        <TouchableOpacity
                            style={[styles.prevBtn]}
                            onPress={handlePrevStep}
                        >
                            <ArrowLeft color={colors.primary} size={16} style={{ opacity: 0.4 }} />
                            <Text style={[styles.prevText, { color: colors.primary, opacity: 0.6 }]}>이전 질문으로 돌아가기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        );
    };

    const renderAnimation = () => {
        const rotation = orbitRotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
        });

        return (
            <View style={styles.animationContent}>
                <View style={styles.orbitContainer}>
                    {/* Ring Orbits */}
                    {[1, 2, 3].map((r) => (
                        <View
                            key={r}
                            style={[
                                styles.animRing,
                                {
                                    width: 150 + r * 80,
                                    height: 150 + r * 80,
                                    opacity: 0.05,
                                    borderColor: colors.primary
                                }
                            ]}
                        />
                    ))}

                    {/* Main Active Orbit */}
                    <Animated.View style={[
                        styles.activeOrbit,
                        {
                            width: 150 + (6 - finalZone) * 40,
                            height: 150 + (6 - finalZone) * 40,
                            transform: [{ rotate: rotation }],
                            borderColor: ZONE_GUIDES[finalZone].color,
                        }
                    ]}>
                        <Animated.View style={[
                            styles.orbitingNode,
                            { transform: [{ scale: nodeScale }] }
                        ]}>
                            <View style={styles.nodeStem} />
                            <View style={styles.avatarWrapperMini}>
                                {node.image ? (
                                    <Image source={{ uri: node.image }} style={styles.avatarImg} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Users size={12} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    </Animated.View>

                    {/* Central Self */}
                    <View style={[styles.centralCore, { backgroundColor: colors.accent }]} />
                </View>

                <Animated.View style={[styles.animLabels, { opacity: nodeScale }]}>
                    <View style={styles.statusChip}>
                        <Shield size={14} color={colors.primary} />
                        <Text style={[styles.statusChipText, { color: colors.primary }]}>ORBIT DETERMINED</Text>
                    </View>
                    <Text style={[styles.animHeadline, { color: colors.primary }]}>준거 궤도 연산 중...</Text>
                </Animated.View>
            </View>
        );
    };

    const renderResult = () => {
        const guide = ZONE_GUIDES[finalZone];
        return (
            <View style={styles.resultContent}>
                <View style={styles.resultVisual}>
                    <View style={styles.visualAura}>
                        <Animated.View style={[styles.auraCircle, { backgroundColor: guide.color + '1A' }]} />
                    </View>

                    <View style={styles.orbitResultView}>
                        <View style={[styles.ringStatic, { width: 220, height: 220, borderColor: guide.color }]} />
                        <View style={styles.centerDotResult}>
                            <View style={[styles.dotSmall, { backgroundColor: guide.color }]} />
                        </View>

                        <View style={styles.resultAvatarContainer}>
                            <View style={[styles.resultAvatarBorder, { borderColor: guide.color }]}>
                                {node.image ? (
                                    <Image source={{ uri: node.image }} style={styles.avatarImg} />
                                ) : (
                                    <Users size={32} color={colors.primary} />
                                )}
                                <View style={[styles.resultBadge, { backgroundColor: guide.color }]}>
                                    <Shield size={12} color="#fff" />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.resultTextSection}>
                    <View style={styles.completeChip}>
                        <Check size={14} color={colors.accent} />
                        <Text style={[styles.completeText, { color: colors.accent }]}>ANALYSIS COMPLETE</Text>
                    </View>

                    <Text style={[styles.resultZone, { color: colors.primary }]}>
                        Zone {finalZone}: {'\n'}
                        <Text style={{ color: guide.color }}>{guide.name}</Text>
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.primary + '1A' }]} />

                    <Text style={[styles.resultDesc, { color: colors.primary }]}>
                        {guide.desc}
                    </Text>

                    <Text style={[styles.resultEnergy, { color: guide.color }]}>
                        권장 에너지 비중 {guide.energy}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        { backgroundColor: (finalZone === 1 || finalZone === 2) ? colors.accent : colors.primary + '20', marginBottom: 12 }
                    ]}
                    onPress={() => setStep('RQS')}
                >
                    <Text style={[styles.confirmText, { color: (finalZone === 1 || finalZone === 2) ? '#fff' : colors.primary }]}>
                        {(finalZone === 1 || finalZone === 2) ? '심화 캐릭터 진단 (권장)' : '심화 캐릭터 진단 하기'}
                    </Text>
                    <Zap size={20} color={(finalZone === 1 || finalZone === 2) ? '#fff' : colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                    onPress={onBack}
                >
                    <Text style={styles.confirmText}>분석 결과 확정하기</Text>
                    <ArrowRight size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                        setCurrentStep(0);
                        setStep('CHECKLIST');
                    }}
                >
                    <RotateCcw size={14} color={colors.primary} style={{ opacity: 0.5 }} />
                    <Text style={[styles.retryText, { color: colors.primary, opacity: 0.6 }]}>관계 층위 다시 판별하기 (DG-23)</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <HubLayout header={renderHeader()}>
            <View style={styles.container}>
                {step === 'CHECKLIST' && renderChecklist()}
                {step === 'ANIMATION' && renderAnimation()}
                {step === 'RESULT' && renderResult()}
                {step === "RQS" && (
                    <RQSTest
                        relationshipId={relationshipId}
                        onBack={() => {
                            if (mode === "RQS") {
                                onBack();
                            } else {
                                setStep("RESULT");
                            }
                        }}
                        onComplete={onBack}
                    />
                )}
            </View>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSub: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    checklistContent: {
        flex: 1,
        paddingHorizontal: 24,
    },
    progressSection: {
        marginTop: 20,
        marginBottom: 30,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    phaseText: {
        fontSize: 13,
        fontWeight: '800',
    },
    stepCounter: {
        fontSize: 18,
        fontWeight: '900',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    questionArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    avatarMini: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    profileName: {
        fontSize: 13,
        fontWeight: '700',
    },
    questionCard: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    quoteMark: {
        marginBottom: -15,
    },
    quoteText: {
        fontSize: 100,
        fontFamily: 'serif',
        lineHeight: 100,
    },
    questionText: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 24,
    },
    descBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    descText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionArea: {
        gap: 16,
        marginBottom: 40,
    },
    actionBtn: {
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
    },
    yesBtn: {
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    noBtn: {
        borderWidth: 1.5,
    },
    yesText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    noText: {
        fontSize: 18,
        fontWeight: '700',
    },

    // Animation Styles
    animationContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orbitContainer: {
        width: width,
        height: width,
        alignItems: 'center',
        justifyContent: 'center',
    },
    animRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
    },
    activeOrbit: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 3,
        alignItems: 'center',
    },
    orbitingNode: {
        position: 'absolute',
        top: -12,
        alignItems: 'center',
    },
    nodeStem: {
        width: 2,
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    avatarWrapperMini: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        backgroundColor: '#4A5D4E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centralCore: {
        width: 50,
        height: 50,
        borderRadius: 25,
        opacity: 0.8,
    },
    animLabels: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20,
        marginBottom: 12,
    },
    statusChipText: {
        fontSize: 11,
        fontWeight: '800',
    },
    animHeadline: {
        fontSize: 24,
        fontWeight: '800',
    },

    // Result Styles
    resultContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    resultVisual: {
        width: 300,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    visualAura: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    auraCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
    },
    orbitResultView: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringStatic: {
        borderRadius: 110,
        borderWidth: 4,
        opacity: 1,
    },
    centerDotResult: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotSmall: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    resultAvatarContainer: {
        position: 'absolute',
        top: -40,
    },
    resultAvatarBorder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        padding: 4,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    resultBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 10,
    },
    resultTextSection: {
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        marginBottom: 60,
    },
    completeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
        backgroundColor: 'rgba(217,139,115,0.1)',
        borderRadius: 20,
        marginBottom: 20,
    },
    completeText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    resultZone: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 16,
    },
    divider: {
        width: 40,
        height: 4,
        borderRadius: 2,
        marginBottom: 16,
    },
    resultDesc: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.6,
        marginBottom: 12,
    },
    resultEnergy: {
        fontSize: 18,
        fontWeight: '800',
    },
    confirmBtn: {
        width: '100%',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    confirmText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    prevBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 10,
    },
    prevText: {
        fontSize: 14,
        fontWeight: '600',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
    },
    retryText: {
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
