import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Pause, Heart, ChevronRight, Brain, Shield, Zap, Sparkles, TrendingUp, UserCheck, MessageCircle, Trophy, Crown, Medal, History, Users } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { RelationshipNode } from '../../types/relationship';

const { width, height } = Dimensions.get('window');

interface FocusTournamentProps {
    participants: RelationshipNode[];
    onComplete: (winnerIds: string[]) => void;
    onClose: () => void;
    entryLens?: 'None' | 'Positive' | 'Negative' | 'Frequency';
}

export const FocusTournament: React.FC<FocusTournamentProps> = ({
    participants,
    onComplete,
    onClose,
    entryLens = 'None'
}) => {
    const colors = useColors();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [winners, setWinners] = useState<RelationshipNode[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [insightText, setInsightText] = useState('');
    const [leanType, setLeanType] = useState<'Stability' | 'Growth' | 'Vitality' | 'Boundaries' | 'Efficiency' | 'Expansion' | 'Harmony'>('Stability');

    // 🎬 Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const titleSlideAnim = useRef(new Animated.Value(-20)).current;
    const winnerScaleAnim = useRef(new Animated.Value(0.8)).current;
    const listSlideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (showResult) {
            Animated.stagger(200, [
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                    Animated.timing(titleSlideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
                ]),
                Animated.spring(winnerScaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
                Animated.timing(listSlideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]).start();
        }
    }, [showResult]);


    // Simple tournament logic: Compare 2 at a time from the list
    // This can be expanded to a full bracket if needed
    const totalRounds = Math.floor(participants.length / 2);
    const currentRound = Math.floor(currentIndex / 2) + 1;

    const leftParticipant = participants[currentIndex];
    const rightParticipant = participants[currentIndex + 1];

    const progress = (currentRound / totalRounds) * 100;

    const handleSelect = (winner: RelationshipNode) => {
        const nextWinners = [...winners, winner];
        setWinners(nextWinners);

        if (currentIndex + 2 >= participants.length || currentRound >= totalRounds) {
            // 조율 완료: 데이터 분석 후 결과 화면으로 전환
            analyzeResult(nextWinners);
            setShowResult(true);
        } else {
            setCurrentIndex(currentIndex + 2);
        }
    };

    const analyzeResult = (finalWinners: RelationshipNode[]) => {
        const zoneCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        finalWinners.forEach(w => {
            zoneCounts[w.zone] = (zoneCounts[w.zone] || 0) + 1;
        });

        // 1. 소모적 관계 조율 맥락 (Negative Lens)
        if (entryLens === 'Negative') {
            setLeanType('Boundaries');
            setInsightText('당신은 가장 소모적인 관계들 사이에서 [심리적 방어선]을 구축하는 선택을 했습니다. 나를 지키기 위한 건강한 거리두기가 무의식의 핵심 과제입니다.');
            return;
        }

        // 2. 일상의 중력 조율 맥락 (Frequency Lens)
        if (entryLens === 'Frequency') {
            setLeanType('Efficiency');
            setInsightText('가장 많은 시간을 점유한 관계들을 조율하며 [시간의 밀도]를 재평가했습니다. 단순히 자주 보는 것이 아닌, 의미 있는 교감에 집중하려는 욕구가 보입니다.');
            return;
        }

        // 3. Zone 분포에 따른 기본 분석
        const maxZone = Object.keys(zoneCounts).reduce((a, b) => zoneCounts[Number(a)] > zoneCounts[Number(b)] ? a : b);
        const maxCount = zoneCounts[Number(maxZone)];

        if (maxCount >= finalWinners.length * 0.7) {
            // 한 구역에 집중된 경우
            if (maxZone === '1') {
                setLeanType('Stability');
                setInsightText('당신은 오늘 새로운 자극보다 나를 지탱해주는 [깊은 안정감]을 선택했습니다. 안전 기지를 방어하려는 무의식이 강력하게 작동하고 있네요.');
            } else if (maxZone === '2') {
                setLeanType('Growth');
                setInsightText('오늘 당신의 마음은 [성장]을 향해 기울어 있습니다. 서로에게 긍정적인 영감을 주는 관계가 당신의 활력원이 되고 있어요.');
            } else if (maxZone === '4' || maxZone === '5') {
                setLeanType('Expansion');
                setInsightText('당신은 익숙함보다 [새로운 연결과 외연]에 더 민감하게 반응하고 있습니다. 관계의 확장을 통해 새로운 에너지를 수혈받고 싶은 상태입니다.');
            } else {
                setLeanType('Vitality');
                setInsightText('당신은 명확한 [목표와 활력]을 주는 관계에 집중하고 있습니다. 현재 추진 중인 일이나 변화에 에너지가 실리고 있는 상태입니다.');
            }
        } else {
            // 골고루 분포된 경우
            setLeanType('Harmony');
            setInsightText('당신은 각기 다른 역할을 하는 관계들 사이에서 [조화로운 균형]을 선택했습니다. 어느 한 쪽으로 치우치지 않는 유연한 자아 상태를 유지하고 있습니다.');
        }
    };

    const renderResultInsight = () => {
        const topWinner = winners[0];
        const config = {
            Stability: { label: '안정', color: '#4A5D4E', icon: Shield },
            Growth: { label: '성장', color: '#D98B73', icon: TrendingUp },
            Vitality: { label: '활력', color: colors.accent, icon: Zap },
            Boundaries: { label: '경계', color: '#737874', icon: Shield },
            Efficiency: { label: '정제', color: '#6B8E23', icon: History },
            Expansion: { label: '확장', color: '#C0C0C0', icon: Sparkles },
            Harmony: { label: '균형', color: colors.primary, icon: Heart },
        }[leanType];

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#F8F9F8' }]}>
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
                        {/* Podium Header */}
                        <Animated.View style={[styles.podiumHeader, { transform: [{ translateY: titleSlideAnim }] }]}>
                            <View style={styles.crownContainer}>
                                <Crown size={40} color="#D4AF37" fill="#D4AF37" />
                            </View>
                            <Text style={[styles.resultTitle, { color: colors.primary }]}>최종 조율 순위</Text>
                            <Text style={styles.resultSubTitle}>당신의 무의식이 선택한{'\n'}관계의 주인공들입니다.</Text>
                        </Animated.View>

                        {/* Rank 1 Card */}
                        {topWinner && (
                            <Animated.View style={[styles.topWinnerCard, { backgroundColor: colors.white, transform: [{ scale: winnerScaleAnim }] }]}>
                                <View style={[styles.rankBadge, { backgroundColor: '#D4AF37' }]}>
                                    <Text style={styles.rankBadgeText}>1st</Text>
                                </View>
                                <View style={styles.winnerMainInfo}>
                                    <View style={styles.winnerAvatarLg}>
                                        <Image source={{ uri: topWinner.image }} style={styles.avatar} />
                                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 60, borderWidth: 4, borderColor: '#D4AF3740' }} />
                                        <View style={styles.winnerHolo} />
                                    </View>
                                    <Text style={[styles.winnerNameLg, { color: colors.primary }]}>{topWinner.name}</Text>
                                    <Text style={styles.winnerRoleLg}>{topWinner.role}</Text>
                                </View>
                                <View style={styles.winnerQuoteBox}>
                                    <Text style={styles.winnerQuoteText}>"{topWinner.name}님은 현재 당신에게{'\n'} 가장 큰 정서적 지지 기반입니다."</Text>
                                </View>
                                <TouchableOpacity style={[styles.msgBtnMain, { backgroundColor: colors.primary }]}>
                                    <MessageCircle size={20} color="white" />
                                    <Text style={styles.msgBtnMainText}>안부 인사 전하기</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Animated List Content */}
                        <Animated.View style={{ transform: [{ translateY: listSlideAnim }] }}>
                            {/* Rank 2 & 3 List */}
                            <View style={styles.subWinnersSection}>
                                <Text style={styles.sectionTitle}>상위 랭커 (Top 2-3)</Text>
                                <View style={styles.subWinnersGrid}>
                                    {winners.slice(1, 3).map((w, i) => (
                                        <View key={w.id} style={[styles.subWinnerCard, { backgroundColor: colors.white }]}>
                                            <View style={[styles.miniRankBadge, { backgroundColor: i === 0 ? '#C0C0C0' : '#CD7F32' }]}>
                                                <Text style={styles.miniRankText}>{i + 2}</Text>
                                            </View>
                                            <Image source={{ uri: w.image }} style={styles.subWinnerAvatar} />
                                            <Text style={styles.subWinnerName} numberOfLines={1}>{w.name}</Text>
                                            <Text style={styles.subWinnerRole}>{w.role}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Summary Insight */}
                            <View style={styles.summaryInsightBox}>
                                <View style={styles.insightTag}>
                                    {(() => {
                                        const PatternIcon = (config.icon as any) || Sparkles;
                                        return <PatternIcon size={14} color={config.color} />;
                                    })()}
                                    <Text style={[styles.insightTagText, { color: config.color }]}>무의식의 선택 패턴: {config.label}</Text>
                                </View>
                                <Text style={styles.summaryInsightText}>
                                    라운드 전반적으로 당신은 <Text style={{ color: config.color, fontWeight: '900' }}>[{config.label}]</Text>적 가치를 우선했습니다.{'\n'}
                                    {insightText}
                                </Text>
                            </View>

                            {/* Participant List */}
                            <View style={styles.entryListSection}>
                                <View style={styles.sectionTitleRow}>
                                    <Users size={14} color="rgba(74, 93, 78, 0.4)" />
                                    <Text style={styles.sectionTitle}>조율 참여 명단 ({participants.length})</Text>
                                </View>
                                <View style={styles.entryList}>
                                    {participants.map((p) => (
                                        <View key={p.id} style={styles.entryItem}>
                                            <Image source={{ uri: p.image }} style={styles.entryAvatar} />
                                            <Text style={styles.entryName} numberOfLines={1}>{p.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.impactReport}>
                                <TrendingUp size={18} color={colors.primary} />
                                <Text style={styles.impactReportText}>이 조율로 관계망의 안정성이 <Text style={{ fontWeight: '900' }}>+15%</Text> 향상되었습니다.</Text>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </Animated.View>

                <View style={styles.resultFooter}>
                    <TouchableOpacity
                        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                        onPress={() => onComplete(winners.map(w => w.id))}
                    >
                        <Text style={styles.applyBtnText}>이 우선순위로 확정하기</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );

    };

    if (showResult) {
        return renderResultInsight();
    }

    if (!leftParticipant || !rightParticipant) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.pauseBadge}>
                    <Pause size={14} color={colors.primary} />
                    <Text style={styles.pauseText}>잠시 멈춤</Text>
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                    <Text style={styles.title}>1:1 집중 조율</Text>
                    <Text style={styles.roundText}>{currentRound} / {totalRounds} 라운드</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
                </View>
            </View>

            {/* Question */}
            <View style={styles.questionSection}>
                <Text style={[styles.question, { color: colors.primary }]}>
                    지금 당신에게 더 큰{'\n'}
                    <Text style={{ color: colors.accent }}>기쁨</Text>을 주는 사람은?
                </Text>
            </View>

            {/* Versus Cards */}
            <View style={styles.duelArea}>
                <View style={styles.cardsGrid}>
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.white }]}
                        onPress={() => handleSelect(leftParticipant)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.cardFavorite}>
                            <Heart size={20} color={colors.accent} fill={colors.accent} opacity={0.3} />
                        </View>
                        <View style={styles.cardContent}>
                            <View style={[styles.avatarContainer, { borderColor: colors.accent + '30' }]}>
                                {leftParticipant.image ? (
                                    <Image source={{ uri: leftParticipant.image }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '05' }]}>
                                        <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '800' }}>{leftParticipant.name[0]}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.name, { color: colors.primary }]}>{leftParticipant.name}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '05' }]}>
                                <Text style={[styles.roleText, { color: colors.primary }]}>{leftParticipant.role}</Text>
                            </View>
                        </View>
                        <View style={[styles.selectBtn, { backgroundColor: '#F8F9F8' }]}><Text style={styles.selectBtnText}>선택</Text></View>
                    </TouchableOpacity>

                    <View style={styles.vsBadgeContainer}>
                        <View style={[styles.vsBadge, { backgroundColor: colors.white }]}>
                            <Text style={[styles.vsText, { color: colors.accent }]}>VS</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.white }]}
                        onPress={() => handleSelect(rightParticipant)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.cardFavorite}>
                            <Heart size={20} color={colors.accent} fill={colors.accent} opacity={0.3} />
                        </View>
                        <View style={styles.cardContent}>
                            <View style={[styles.avatarContainer, { borderColor: colors.primary + '20' }]}>
                                {rightParticipant.image ? (
                                    <Image source={{ uri: rightParticipant.image }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '05' }]}>
                                        <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '800' }}>{rightParticipant.name[0]}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.name, { color: colors.primary }]}>{rightParticipant.name}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '05' }]}>
                                <Text style={[styles.roleText, { color: colors.primary }]}>{rightParticipant.role}</Text>
                            </View>
                        </View>
                        <View style={[styles.selectBtn, { backgroundColor: '#F8F9F8' }]}><Text style={styles.selectBtnText}>선택</Text></View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.skipBtn}>
                    <Text style={styles.skipText}>이 비교 건너뛰기</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF9F2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pauseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
    },
    pauseText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#4A5D4E',
    },
    progressSection: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#4A5D4E',
    },
    roundText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(74, 93, 78, 0.5)',
        marginBottom: 2,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(74, 93, 78, 0.08)',
        borderRadius: 100,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 100,
    },
    questionSection: {
        marginTop: 40,
        alignItems: 'center',
    },
    question: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 38,
    },
    duelArea: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    cardsGrid: {
        flexDirection: 'row',
        gap: 12,
        position: 'relative',
    },
    card: {
        flex: 1,
        borderRadius: 32,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        height: height * 0.45,
    },
    cardFavorite: {
        alignSelf: 'flex-end',
    },
    cardContent: {
        alignItems: 'center',
        width: '100%',
    },
    avatarContainer: {
        width: width * 0.25,
        height: width * 0.25,
        borderRadius: 100,
        borderWidth: 4,
        padding: 4,
        marginBottom: 16,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 6,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    metaText: {
        fontSize: 12,
        color: 'rgba(74, 93, 78, 0.5)',
        fontWeight: '600',
    },
    selectBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 100,
        alignItems: 'center',
    },
    selectBtnText: {
        fontSize: 14,
        fontWeight: '800',
    },
    vsBadgeContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -24 }, { translateY: -24 }],
        zIndex: 50,
    },
    vsBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    vsText: {
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    skipBtn: {
        marginTop: 32,
        alignSelf: 'center',
    },
    skipText: {
        fontSize: 14,
        color: 'rgba(74, 93, 78, 0.4)',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    // Result Styles
    resultScroll: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 150,
    },
    podiumHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    crownContainer: {
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    resultSubTitle: {
        fontSize: 16,
        color: 'rgba(74, 93, 78, 0.5)',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 22,
    },
    topWinnerCard: {
        borderRadius: 40,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    rankBadge: {
        position: 'absolute',
        top: -15,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    rankBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
    },
    winnerMainInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    winnerAvatarLg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        position: 'relative',
    },
    winnerHolo: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 60,
        borderWidth: 6,
        borderColor: '#D4AF3740',
    },
    winnerNameLg: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    winnerRoleLg: {
        fontSize: 14,
        color: 'rgba(74, 93, 78, 0.6)',
        fontWeight: '700',
        marginBottom: 20,
    },
    winnerQuoteBox: {
        backgroundColor: '#F8F9F8',
        padding: 16,
        borderRadius: 20,
        width: '100%',
        marginBottom: 20,
    },
    winnerQuoteText: {
        fontSize: 14,
        color: '#4A5D4E',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 20,
    },
    msgBtnMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 100,
    },
    msgBtnMainText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    subWinnersSection: {
        marginBottom: 32,
    },
    subWinnersGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    subWinnerCard: {
        flex: 1,
        borderRadius: 32,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    miniRankBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniRankText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    subWinnerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 12,
    },
    subWinnerName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4A5D4E',
        marginBottom: 2,
    },
    subWinnerRole: {
        fontSize: 12,
        color: 'rgba(74, 93, 78, 0.5)',
        fontWeight: '600',
    },
    summaryInsightBox: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        marginBottom: 20,
    },
    insightTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    insightTagText: {
        fontSize: 12,
        fontWeight: '900',
    },
    summaryInsightText: {
        fontSize: 15,
        color: '#4A5D4E',
        lineHeight: 24,
        fontWeight: '600',
    },
    impactReport: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
    },
    impactReportText: {
        fontSize: 14,
        color: '#4A5D4E',
        fontWeight: '500',
    },
    resultFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        backgroundColor: 'rgba(248, 249, 248, 0.95)',
    },
    applyBtn: {
        height: 64,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    applyBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: 'rgba(74, 93, 78, 0.4)',
        letterSpacing: 1,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    entryListSection: {
        marginBottom: 32,
        backgroundColor: 'rgba(74, 93, 78, 0.03)',
        borderRadius: 32,
        padding: 20,
    },
    entryList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    entryItem: {
        alignItems: 'center',
        width: (width - 80 - 24) / 4, // 4 items per row accounting for padding and gap
    },
    entryAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 6,
        backgroundColor: '#E8EBE9',
    },
    entryName: {
        fontSize: 11,
        color: '#4A5D4E',
        fontWeight: '700',
        textAlign: 'center',
    }
});
