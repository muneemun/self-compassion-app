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
    Modal,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Pause, Heart, ChevronRight, ChevronLeft, Brain, Shield, Zap, Sparkles, TrendingUp, UserCheck, MessageCircle, Trophy, Crown, Medal, History, Users, HeartPulse, AlertTriangle, CloudRain } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { RelationshipNode } from '../../types/relationship';

const { width, height } = Dimensions.get('window');

interface FocusTournamentProps {
    participants: RelationshipNode[];
    onComplete: (winnerIds: string[]) => void;
    onClose: () => void;
    entryLens?: 'None' | 'Positive' | 'Negative' | 'Frequency';
    onSelectParticipant?: (id: string, autoCheckIn?: boolean) => void;
    visible?: boolean;
}

export const FocusTournament: React.FC<FocusTournamentProps> = ({
    participants,
    onComplete,
    onClose,
    entryLens = 'None',
    onSelectParticipant,
    visible = true
}) => {
    const colors = useColors();
    const isNegative = entryLens === 'Negative';
    const [currentIndex, setCurrentIndex] = useState(0);
    const [winners, setWinners] = useState<RelationshipNode[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [insightText, setInsightText] = useState('');
    const [leanType, setLeanType] = useState<'Stability' | 'Growth' | 'Vitality' | 'Boundaries' | 'Efficiency' | 'Expansion' | 'Harmony'>('Stability');
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // 🏆 Tournament State
    const [roundParticipants, setRoundParticipants] = useState<RelationshipNode[]>([]);
    const [nextRoundWinners, setNextRoundWinners] = useState<RelationshipNode[]>([]);
    const [eliminatedRanking, setEliminatedRanking] = useState<RelationshipNode[]>([]);
    const [matchIndex, setMatchIndex] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);
    const [completedMatches, setCompletedMatches] = useState(0);

    const shuffleArray = (array: RelationshipNode[]) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // 🎬 Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const titleSlideAnim = useRef(new Animated.Value(-20)).current;
    const winnerScaleAnim = useRef(new Animated.Value(0.8)).current;
    const listSlideAnim = useRef(new Animated.Value(30)).current;
    const heartScaleAnim = useRef(new Animated.Value(1)).current;
    const flyAnim = useRef(new Animated.Value(0)).current;
    const leftPressScale = useRef(new Animated.Value(1)).current;
    const rightPressScale = useRef(new Animated.Value(1)).current;

    const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);

    const AnimatedHeart = Animated.createAnimatedComponent(Heart);
    const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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

    useEffect(() => {
        if (visible && !showResult && participants.length > 0) {
            const shuffled = shuffleArray([...participants]);
            setRoundParticipants(shuffled);
            setNextRoundWinners([]);
            setEliminatedRanking([]);
            setMatchIndex(0);
            setCompletedMatches(0);
            setTotalMatches(participants.length - 1);
            flyAnim.setValue(0); // Reset animation
        }
    }, [visible, participants.length]);


    const leftParticipant = roundParticipants[matchIndex];
    const rightParticipant = roundParticipants[matchIndex + 1];

    const getRoundTitle = () => {
        const count = roundParticipants.length;
        if (count === 2) return "결승전";
        if (count === 3 || count === 4) return "4강전 (Semi-final)";
        if (count >= 5 && count <= 8) return "8강전";
        return `${count}강전`;
    };

    const progress = (completedMatches / totalMatches) * 100;

    const handleSkip = () => {
        if (selectedSide || !leftParticipant || !rightParticipant) return;

        // 현재 대결 쌍(leftParticipant, rightParticipant)을 제외한 현재 라운드의 남은 인원들
        const currentPair = [roundParticipants[matchIndex], roundParticipants[matchIndex + 1]];
        const otherRemaining = roundParticipants.slice(matchIndex + 2);

        if (otherRemaining.length === 0) {
            // 남은 인원이 없을 경우 현재 쌍의 순서만 바꿔서 환기시킴
            setRoundParticipants([
                ...roundParticipants.slice(0, matchIndex),
                currentPair[1],
                currentPair[0]
            ]);
            return;
        }

        // 현재 쌍을 맨 뒤로 보내고, 남은 인원들을 셔플하여 앞으로 배치
        const shuffledOthers = shuffleArray(otherRemaining);
        const newParticipants = [
            ...roundParticipants.slice(0, matchIndex),
            ...shuffledOthers,
            ...currentPair
        ];

        setRoundParticipants(newParticipants);
        flyAnim.setValue(0); // Reset animation if skipped
    };

    const handleSelect = (winner: RelationshipNode, side: 'left' | 'right') => {
        if (selectedSide || !leftParticipant || !rightParticipant) return;

        setSelectedSide(side);

        // 🎬 Animation Start Immediately
        Animated.parallel([
            Animated.sequence([
                Animated.timing(heartScaleAnim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
                Animated.spring(heartScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
            ]),
            Animated.timing(flyAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.bezier(0.2, 0.8, 0.2, 1)
            })
        ]).start();

        setTimeout(() => {
            const loser = side === 'left' ? rightParticipant : leftParticipant;
            const updatedNextWinners = [...nextRoundWinners, winner];
            const updatedEliminated = [loser, ...eliminatedRanking];

            setNextRoundWinners(updatedNextWinners);
            setEliminatedRanking(updatedEliminated);

            // Reset States
            setSelectedSide(null);
            heartScaleAnim.setValue(1);
            flyAnim.setValue(0);
            leftPressScale.setValue(1);
            rightPressScale.setValue(1);

            setCompletedMatches(prev => prev + 1);

            if (matchIndex + 2 >= roundParticipants.length - (roundParticipants.length % 2 === 0 ? 0 : 1)) {
                // Round End Logic
                let nextRoundNodes = [...updatedNextWinners];
                if (roundParticipants.length % 2 !== 0) {
                    const byeNode = roundParticipants[roundParticipants.length - 1];
                    nextRoundNodes.push(byeNode);
                }

                if (nextRoundNodes.length === 1) {
                    const finalWinner = nextRoundNodes[0];
                    const fullRanking = [finalWinner, ...updatedEliminated];
                    setWinners(fullRanking);
                    analyzeResult(fullRanking);
                    setShowResult(true);
                } else {
                    setRoundParticipants(nextRoundNodes);
                    setNextRoundWinners([]);
                    setMatchIndex(0);
                }
            } else {
                setMatchIndex(prev => prev + 2);
            }
        }, 800);
    };

    // 🌟 Interpolation Defs for Fly Animation (Orbit Stack)
    // 🌟 Interpolation Defs for Fly Animation (Orbit Stack)
    const flyLeftStyle = {
        transform: [
            { scale: leftPressScale },
            {
                translateX: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, -30, -400] // Left
                })
            },
            {
                translateY: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, -20, -500]
                })
            },
            {
                scale: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [1, 0.95, 0.6]
                })
            },
            {
                rotate: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: ['0deg', '-3deg', '-15deg']
                })
            }
        ],
        opacity: flyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.4]
        })
    };

    const flyRightStyle = {
        transform: [
            { scale: rightPressScale },
            {
                translateX: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, 30, 400] // Right
                })
            },
            {
                translateY: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, -20, -500]
                })
            },
            {
                scale: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [1, 0.95, 0.6]
                })
            },
            {
                rotate: flyAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: ['0deg', '3deg', '15deg']
                })
            }
        ],
        opacity: flyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.4]
        })
    };

    const fadeStyle = {
        opacity: flyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.5]
        }),
        transform: [{
            scale: flyAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95]
            })
        }]
    };

    const analyzeResult = (finalWinners: RelationshipNode[]) => {
        const zoneCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        finalWinners.forEach(w => {
            zoneCounts[w.zone] = (zoneCounts[w.zone] || 0) + 1;
        });

        if (entryLens === 'Negative') {
            setLeanType('Boundaries');
            setInsightText('당신은 가장 소모적인 관계들 사이에서 [심리적 방어선]을 구축하는 선택을 했습니다. 나를 지키기 위한 건강한 거리두기가 무의식의 핵심 과제입니다.');
            return;
        }

        if (entryLens === 'Frequency') {
            setLeanType('Efficiency');
            setInsightText('가장 많은 시간을 점유한 관계들을 조율하며 [시간의 밀도]를 재평가했습니다. 단순히 자주 보는 것이 아닌, 의미 있는 교감에 집중하려는 욕구가 보입니다.');
            return;
        }

        const maxZone = Object.keys(zoneCounts).reduce((a, b) => zoneCounts[Number(a)] > zoneCounts[Number(b)] ? a : b);
        const maxCount = zoneCounts[Number(maxZone)];

        if (maxCount >= finalWinners.length * 0.7) {
            if (maxZone === '1') {
                setLeanType('Stability');
                setInsightText('당신은 오늘 새로운 자극보다 나를 지탱해주는 [깊은 안정감]을 선택했습니다. 핵심 그룹을 방어하려는 무의식이 강력하게 작동하고 있네요.');
            } else if (maxZone === '2') {
                setLeanType('Growth');
                setInsightText('오늘 당신의 마음은 [성장]을 향해 기울어 있습니다. 가치관을 공유하는 정서적 공유 그룹과의 교감이 당신의 활력원이 되고 있어요.');
            } else if (maxZone === '4' || maxZone === '5') {
                setLeanType('Expansion');
                setInsightText('당신은 익숙함보다 [새로운 연결과 외연]에 더 민감하게 반응하고 있습니다. 관계의 확장을 통해 새로운 에너지를 수혈받고 싶은 상태입니다.');
            } else {
                setLeanType('Vitality');
                setInsightText('당신은 명확한 [목표와 활력]을 주는 관계에 집중하고 있습니다. 현재 추진 중인 일이나 변화에 에너지가 실리고 있는 상태입니다.');
            }
        } else {
            setLeanType('Harmony');
            setInsightText('당신은 각기 다른 역할을 하는 관계들 사이에서 [조화로운 균형]을 선택했습니다. 어느 한 쪽으로 치우치지 않는 유연한 자아 상태를 유지하고 있습니다.');
        }
    };

    const getLeanConfig = (type: typeof leanType) => {
        return {
            Stability: { label: '안정', color: '#4A5D4E', icon: Shield },
            Growth: { label: '성장', color: '#D98B73', icon: TrendingUp },
            Vitality: { label: colors.accent, color: colors.accent, icon: Zap },
            Boundaries: { label: '경계', color: '#737874', icon: Shield },
            Efficiency: { label: '정제', color: '#6B8E23', icon: History },
            Expansion: { label: '확장', color: '#C0C0C0', icon: Sparkles },
            Harmony: { label: '균형', color: colors.primary, icon: Heart },
        }[type];
    };

    const renderResultInsight = () => {
        const topWinner = winners[0];
        if (!topWinner) return null;

        const themeColor = isNegative ? '#D98B73' : colors.accent;
        const mainIcon = isNegative ? <Zap size={24} color="white" /> : <Trophy size={24} color="white" />;
        const titleText = isNegative ? "에너지 디톡스 우선순위" : "최종 조율 결과";
        const subTitleText = isNegative ? "내 마음을 무겁게 하는 관계 직면하기" : "당신의 무의식이 선택한 최고의 인맥";

        const config = getLeanConfig(leanType);

        const ZONE_COLORS: Record<number, string> = {
            1: '#FFB74D',
            2: '#D98B73',
            3: '#4A5D4E',
            4: '#90A4AE',
            5: '#D1D5DB'
        };

        return (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: '#F8F9F8' }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.subHeader}>
                        <TouchableOpacity onPress={() => setShowExitConfirm(true)} style={styles.backBtn}>
                            <ChevronLeft size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.subHeaderTitle}>조율 리포트</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
                            {/* Podium Header */}
                            <Animated.View style={[styles.podiumHeader, { transform: [{ translateY: titleSlideAnim }] }]}>
                                <View style={styles.crownContainer}>
                                    {isNegative ? (
                                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                            <AlertTriangle size={48} color="#D98B73" fill="#D98B73" />
                                            <View style={{ position: 'absolute', transform: [{ translateY: 5 }] }}>
                                                <Zap size={18} color="white" fill="white" />
                                            </View>
                                        </View>
                                    ) : (
                                        <Crown size={40} color="#D4AF37" fill="#D4AF37" />
                                    )}
                                </View>
                                <Text style={[styles.resultTitle, { color: colors.primary }]}>
                                    {isNegative ? "에너지 디톡스 우선순위" : "최종 조율 순위"}
                                </Text>
                                <Text style={styles.resultSubTitle}>
                                    {isNegative ? "내 마음을 무겁게 하는\n관계들입니다." : "당신의 무의식이 선택한\n관계의 주인공들입니다."}
                                </Text>
                            </Animated.View>

                            {/* Rank 1 Card */}
                            {topWinner && (
                                <Animated.View style={[styles.topWinnerCard, { backgroundColor: colors.white, transform: [{ scale: winnerScaleAnim }] }]}>
                                    <View style={[styles.rankBadge, { backgroundColor: isNegative ? "#90A4AE" : "#D4AF37" }]}>
                                        <Text style={styles.rankBadgeText}>{isNegative ? "Danger" : "1st"}</Text>
                                    </View>
                                    <View style={styles.winnerMainInfo}>
                                        <TouchableOpacity
                                            style={styles.winnerAvatarLg}
                                            onPress={() => onSelectParticipant && onSelectParticipant(topWinner.id)}
                                            activeOpacity={0.8}
                                        >
                                            {topWinner.image ? (
                                                <Image source={{ uri: topWinner.image }} style={styles.avatar} />
                                            ) : (
                                                <View style={{ width: "100%", height: "100%", borderRadius: 60, backgroundColor: colors.primary + "10", alignItems: "center", justifyContent: "center" }}>
                                                    <Text style={{ fontSize: 40, fontWeight: "900", color: colors.primary }}>{topWinner.name.charAt(0)}</Text>
                                                </View>
                                            )}
                                            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 60, borderWidth: 4, borderColor: "#D4AF3740" }} />
                                            <LinearGradient
                                                colors={['rgba(255,255,255,0.4)', 'transparent', 'rgba(255,255,255,0.1)']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.winnerHolo}
                                            />
                                        </TouchableOpacity>
                                        <Text style={[styles.winnerNameLg, { color: colors.primary }]}>{topWinner.name}</Text>
                                        <Text style={styles.winnerRoleLg}>{topWinner.role}</Text>
                                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: (ZONE_COLORS[topWinner.zone] || colors.primary) + "20", marginBottom: 16 }}>
                                            <Text style={{ fontSize: 12, fontWeight: "800", color: ZONE_COLORS[topWinner.zone] || colors.primary }}>Zone {topWinner.zone}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.winnerQuoteBox}>
                                        <Text style={styles.winnerQuoteText}>
                                            {isNegative
                                                ? `"${topWinner.name}님과의 관계에서 느끼는\n불편함은 당신의 잘못이 아닙니다."`
                                                : `"${topWinner.name}님은 현재 당신에게\n가장 큰 정서적 지지 기반입니다."`}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.checkInBtn, { backgroundColor: isNegative ? "#D98B73" : colors.accent }]}
                                        onPress={() => onSelectParticipant && onSelectParticipant(topWinner.id, true)}
                                        activeOpacity={0.8}
                                    >
                                        {isNegative ? <Shield size={18} color="white" /> : <HeartPulse size={18} color="white" />}
                                        <Text style={[styles.checkInBtnText, { color: "white" }]}>
                                            {isNegative ? "심리적 방어선 설정" : "정서적 체크인 시작"}
                                        </Text>
                                        <ChevronRight size={16} color="white" opacity={0.6} />
                                    </TouchableOpacity>
                                </Animated.View>
                            )}

                            {/* Animated List Content */}
                            <Animated.View style={{ transform: [{ translateY: listSlideAnim }] }}>
                                {/* Rank 2 & 3 List */}
                                <View style={styles.subWinnersSection}>
                                    <Text style={styles.sectionTitle}>{isNegative ? "집중 경계 대상 (Top 2-3)" : "상위 랭커 (Top 2-3)"}</Text>
                                    <View style={styles.subWinnersGrid}>
                                        {winners.slice(1, 3).map((w, i) => (
                                            <View key={w.id} style={[styles.subWinnerCard, { backgroundColor: colors.white }]}>
                                                <View style={[styles.miniRankBadge, { backgroundColor: i === 0 ? "#C0C0C0" : "#CD7F32", zIndex: 10 }]}>
                                                    <Text style={styles.miniRankText}>{i + 2}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => onSelectParticipant && onSelectParticipant(w.id)}
                                                    activeOpacity={0.8}
                                                >
                                                    {w.image ? (
                                                        <Image source={{ uri: w.image }} style={styles.subWinnerAvatar} />
                                                    ) : (
                                                        <View style={[styles.subWinnerAvatar, { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary + "10" }]}>
                                                            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>{w.name.charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                                <Text style={styles.subWinnerName} numberOfLines={1}>{w.name}</Text>
                                                <Text style={styles.subWinnerRole}>{w.role}</Text>
                                                <Text style={{ fontSize: 11, fontWeight: "700", color: ZONE_COLORS[w.zone] || colors.primary, marginTop: 2 }}>Z.{w.zone}</Text>
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
                                        라운드 전반적으로 당신은 <Text style={{ color: config.color, fontWeight: "900" }}>[{config.label}]</Text>적 가치를 우선했습니다.{"\n"}
                                        {insightText}
                                    </Text>
                                </View>

                                {/* Participant List (Ranked) */}
                                <View style={styles.entryListSection}>
                                    <View style={styles.sectionTitleRow}>
                                        <Users size={14} color="rgba(74, 93, 78, 0.4)" />
                                        <Text style={styles.sectionTitle}>{isNegative ? "전체 포식자 순위" : "전체 참여자 순위"} ({participants.length})</Text>
                                    </View>
                                    <View style={styles.entryList}>
                                        {[...winners, ...participants.filter(p => !winners.find(w => w.id === p.id))].slice(3).map((p, index) => {
                                            const zColor = ZONE_COLORS[p.zone] || colors.primary;
                                            return (
                                                <View key={p.id} style={styles.entryItem}>
                                                    <TouchableOpacity
                                                        style={{ position: "relative" }}
                                                        onPress={() => onSelectParticipant && onSelectParticipant(p.id)}
                                                        activeOpacity={0.8}
                                                    >
                                                        <View style={{
                                                            width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: zColor,
                                                            alignItems: "center", justifyContent: "center", backgroundColor: "#fff", marginBottom: 6
                                                        }}>
                                                            {p.image ? (
                                                                <Image source={{ uri: p.image }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                                            ) : (
                                                                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary + "10" }}>
                                                                    <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>{p.name.charAt(0)}</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <View style={{
                                                            position: "absolute", bottom: 6, right: -4,
                                                            backgroundColor: "#90A4AE", width: 18, height: 18, borderRadius: 9,
                                                            alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fff"
                                                        }}>
                                                            <Text style={{ fontSize: 9, color: "white", fontWeight: "800" }}>{index + 4}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    <Text style={styles.entryName} numberOfLines={1}>{p.name}</Text>
                                                    <Text style={{ fontSize: 10, color: zColor, fontWeight: "700", marginTop: 2 }}>Z.{p.zone}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View style={styles.impactReport}>
                                    <TrendingUp size={18} color={colors.primary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.impactReportText}>
                                            이 조율을 반영하면 <Text style={{ fontWeight: "900" }}>관계망의 안정성</Text>이 향상됩니다.
                                        </Text>
                                        <Text style={{ fontSize: 11, color: colors.primary, opacity: 0.6, marginTop: 4 }}>
                                            * 상위 1~3위 인맥에게 정서 온도 보너스가 차등 부여됩니다.
                                        </Text>
                                        <Text style={{ fontSize: 11, color: "#D98B73", fontWeight: "800", marginTop: 2 }}>
                                            (하단 버튼을 클릭해야 실제 데이터에 최종 반영됩니다)
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.scrollFooterContent}>
                                    <TouchableOpacity
                                        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => onComplete(winners.map(w => w.id))}
                                    >
                                        <Text style={styles.applyBtnText}>정서 온도에 반영하기</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setShowExitConfirm(true)}
                                    >
                                        <Text style={styles.cancelBtnText}>반영하지 않고 나가기</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </ScrollView>
                    </Animated.View>

                    {/* 🚪 종료 확인 팝업 */}
                    {showExitConfirm && (
                        <View style={styles.popupBackdrop}>
                            <View style={[styles.floatingPopupCard, { backgroundColor: '#FFFFFF' }]}>
                                <View style={styles.guideHeader}>
                                    <View>
                                        <Text style={[styles.guideTitle, { color: colors.primary }]}>조율 종료</Text>
                                        <Text style={[styles.guideSubTitle, { color: colors.accent }]}>End Selection</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowExitConfirm(false)} style={styles.popupCloseBtn}>
                                        <X size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.popupScrollContainer, { alignItems: 'center', paddingVertical: 24 }]}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary, marginBottom: 12, textAlign: 'center' }}>
                                        조율 정보를 반영하고 나가시겠습니까?
                                    </Text>
                                    <Text style={{ fontSize: 14, color: colors.primary, opacity: 0.6, textAlign: 'center', lineHeight: 20 }}>
                                        '반영하고 나가기'를 선택하시면 현재 순위가{'\n'}정서 온도 데이터에 저장됩니다.
                                    </Text>
                                </View>

                                <View style={{ gap: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.popupConfirmBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => {
                                            setShowExitConfirm(false);
                                            onComplete(winners.map(w => w.id));
                                        }}
                                    >
                                        <Text style={styles.popupConfirmText}>반영하고 나가기</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.popupConfirmBtn, { backgroundColor: '#F0F0F0' }]}
                                        onPress={() => {
                                            setShowExitConfirm(false);
                                            onClose();
                                        }}
                                    >
                                        <Text style={[styles.popupConfirmText, { color: colors.primary }]}>반영하지 않고 나가기</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ alignItems: 'center', paddingVertical: 12 }}
                                        onPress={() => setShowExitConfirm(false)}
                                    >
                                        <Text style={{ fontSize: 14, color: colors.primary, opacity: 0.4, fontWeight: '700' }}>취소</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            {showResult ? renderResultInsight() : (!leftParticipant || !rightParticipant) ? null : (
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
                            <Text style={styles.roundText}>{getRoundTitle()}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
                        </View>
                    </View>

                    {/* Question */}
                    <View style={styles.questionSection}>
                        <Text style={[styles.question, { color: colors.primary }]}>
                            {entryLens === 'Negative' ? (
                                <>지금 당신의 마음을 더{'\n'}<Text style={{ color: '#D98B73' }}>무겁게</Text> 만드는 사람은?</>
                            ) : (
                                <>지금 당신에게 더 큰{'\n'}<Text style={{ color: colors.accent }}>기쁨</Text>을 주는 사람은?</>
                            )}
                        </Text>
                    </View>

                    {/* Versus Cards */}
                    <View style={styles.duelArea}>
                        <View style={styles.cardsGrid}>
                            <AnimatedTouchableOpacity
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: colors.white,
                                        borderColor: selectedSide === 'left' ? (entryLens === 'Negative' ? '#D98B73' : colors.accent) : 'transparent',
                                        borderWidth: selectedSide === 'left' ? 2 : 0,
                                        // opacity, transform scale은 flyStyle/fadeStyle에서 처리하므로 여기서 제거하거나 유지하되 덮어씀. 
                                        // 기존 로직과 충돌 방지를 위해 애니메이션 스타일을 뒤에 배치
                                    },
                                    selectedSide === 'left' ? flyLeftStyle : (selectedSide ? fadeStyle : {})
                                ]}
                                onPress={() => handleSelect(leftParticipant, 'left')}
                                onPressIn={() => Animated.spring(leftPressScale, { toValue: 1.05, useNativeDriver: true }).start()}

                                activeOpacity={1} // Disable default opacity change to control manually
                                disabled={selectedSide !== null}
                            >
                                <View style={styles.cardFavorite}>
                                    <Animated.View style={{
                                        transform: [{ scale: selectedSide === 'left' ? heartScaleAnim : 1 }],
                                        opacity: selectedSide === 'left' ? 1 : 0
                                    }}>
                                        {entryLens === 'Negative' ? (
                                            <Zap size={24} color="#D98B73" fill="#D98B73" />
                                        ) : (
                                            <Heart size={24} color={colors.accent} fill={colors.accent} />
                                        )}
                                    </Animated.View>
                                </View>
                                <View style={styles.cardContent}>
                                    <View style={[
                                        styles.avatarContainer,
                                        {
                                            borderColor: selectedSide === 'left'
                                                ? (entryLens === 'Negative' ? '#D98B73' : colors.accent)
                                                : colors.primary + '20'
                                        }
                                    ]}>
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
                                <View style={[
                                    styles.selectBtn,
                                    {
                                        backgroundColor: selectedSide === 'left' ? (entryLens === 'Negative' ? '#D98B73' : colors.accent) : '#F8F9F8',
                                        shadowColor: selectedSide === 'left' ? (entryLens === 'Negative' ? '#D98B73' : colors.accent) : "transparent",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: selectedSide === 'left' ? 0.3 : 0,
                                        shadowRadius: 8,
                                        elevation: selectedSide === 'left' ? 5 : 0
                                    }
                                ]}>
                                    <Text style={[styles.selectBtnText, selectedSide === 'left' ? { color: colors.white } : { color: colors.primary + '60' }]}>
                                        {selectedSide === 'left' ? "Selected" : (entryLens === 'Negative' ? "직면" : "Select")}
                                    </Text>
                                </View>
                            </AnimatedTouchableOpacity>

                            <View style={styles.vsBadgeContainer}>
                                <View style={[styles.vsBadge, { backgroundColor: colors.white }]}>
                                    <Text style={[styles.vsText, { color: entryLens === 'Negative' ? '#D98B73' : colors.accent }]}>VS</Text>
                                </View>
                            </View>

                            <AnimatedTouchableOpacity
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: colors.white,
                                        borderColor: selectedSide === 'right' ? (entryLens === 'Negative' ? '#D98B73' : colors.accent) : 'transparent',
                                        borderWidth: selectedSide === 'right' ? 2 : 0,
                                    },
                                    selectedSide === 'right' ? flyRightStyle : (selectedSide ? fadeStyle : {})
                                ]}
                                onPress={() => handleSelect(rightParticipant, 'right')}
                                onPressIn={() => Animated.spring(rightPressScale, { toValue: 1.05, useNativeDriver: true }).start()}

                                activeOpacity={1}
                                disabled={selectedSide !== null}
                            >
                                <View style={styles.cardFavorite}>
                                    <Animated.View style={{
                                        transform: [{ scale: selectedSide === 'right' ? heartScaleAnim : 1 }],
                                        opacity: selectedSide === 'right' ? 1 : 0
                                    }}>
                                        {entryLens === 'Negative' ? (
                                            <Zap size={24} color="#D98B73" fill="#D98B73" />
                                        ) : (
                                            <Heart size={24} color={colors.accent} fill={colors.accent} />
                                        )}
                                    </Animated.View>
                                </View>
                                <View style={styles.cardContent}>
                                    <View style={[
                                        styles.avatarContainer,
                                        {
                                            borderColor: selectedSide === 'right'
                                                ? (entryLens === 'Negative' ? '#D98B73' : colors.accent)
                                                : colors.primary + '20'
                                        }
                                    ]}>
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
                                <View style={[
                                    styles.selectBtn,
                                    {
                                        backgroundColor: selectedSide === 'right' ? (entryLens === 'Negative' ? '#D98B73' : colors.accent) : '#F8F9F8',
                                        shadowColor: selectedSide === 'right' ? (entryLens === 'Negative' ? '#D98B73' : colors.accent) : "transparent",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: selectedSide === 'right' ? 0.3 : 0,
                                        shadowRadius: 8,
                                        elevation: selectedSide === 'right' ? 5 : 0
                                    }
                                ]}>
                                    <Text style={[styles.selectBtnText, selectedSide === 'right' ? { color: colors.white } : { color: colors.primary + '60' }]}>
                                        {selectedSide === 'right' ? "Selected" : (entryLens === 'Negative' ? "직면" : "Select")}
                                    </Text>
                                </View>
                            </AnimatedTouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={handleSkip}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipText}>이 비교 건너뛰기</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            )}
        </Modal>
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
        borderWidth: 2,
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
    subHeader: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    subHeaderTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#4A5D4E',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollFooterContent: {
        paddingHorizontal: 20,
        paddingBottom: 60,
        marginTop: 20,
    },
    resultFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        backgroundColor: '#F8F9F8',
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
        justifyContent: 'center',
        gap: 16,
    },
    entryItem: {
        alignItems: 'center',
        width: 60,
        marginBottom: 8,
    },
    entryName: {
        fontSize: 11,
        color: '#4A5D4E',
        fontWeight: '700',
        textAlign: 'center',
    },
    checkInBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 24,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    checkInBtnText: {
        fontSize: 16,
        fontWeight: '900',
    },
    cancelBtn: {
        marginTop: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        color: 'rgba(74, 93, 78, 0.4)',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    // Popup Styles
    popupBackdrop: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
    },
    floatingPopupCard: {
        width: width * 0.85,
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    guideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    guideTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    guideSubTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 2,
    },
    popupCloseBtn: {
        padding: 4,
    },
    popupScrollContainer: {
        width: '100%',
    },
    popupConfirmBtn: {
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupConfirmText: {
        fontSize: 16,
        fontWeight: '900',
        color: 'white',
    },
});
