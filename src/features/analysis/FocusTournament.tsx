import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Image,
    Easing,
    ScrollView,
    Modal,
} from 'react-native';
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
            flyAnim.setValue(0);
        }
    }, [visible, participants.length]);

    const leftParticipant = roundParticipants[matchIndex];
    const rightParticipant = roundParticipants[matchIndex + 1];

    const getRoundTitle = () => {
        const count = roundParticipants.length;
        if (count === 2) return "결승전";
        if (count === 3 || count === 4) return "준결승전";
        if (count >= 5 && count <= 8) return "8강전";
        return `${count}강전`;
    };

    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    const handleSelect = (winner: RelationshipNode, side: 'left' | 'right') => {
        if (selectedSide || !leftParticipant || !rightParticipant) return;
        setSelectedSide(side);

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

            setSelectedSide(null);
            heartScaleAnim.setValue(1);
            flyAnim.setValue(0);
            leftPressScale.setValue(1);
            rightPressScale.setValue(1);

            setCompletedMatches(prev => prev + 1);

            if (matchIndex + 2 >= roundParticipants.length - (roundParticipants.length % 2 === 0 ? 0 : 1)) {
                let nextRoundNodes = [...updatedNextWinners];
                if (roundParticipants.length % 2 !== 0) {
                    nextRoundNodes.push(roundParticipants[roundParticipants.length - 1]);
                }

                if (nextRoundNodes.length === 1) {
                    const fullRanking = [nextRoundNodes[0], ...updatedEliminated];
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

    const analyzeResult = (finalWinners: RelationshipNode[]) => {
        if (entryLens === 'Negative') {
            setLeanType('Boundaries');
            setInsightText('심리적 경계 설정과 에너지 관리가 가장 시급하게 필요한 관계들을 파악했습니다.');
        } else if (entryLens === 'Positive') {
            setLeanType('Growth');
            setInsightText('당신의 삶에 긍정적인 에너지를 불어넣는 소중한 비타민 같은 관계들을 확인했습니다.');
        } else if (entryLens === 'Frequency') {
            setLeanType('Vitality');
            setInsightText('자주 만나는 관계들 속에서 당신에게 가장 유의미한 영향을 주는 인물들을 확인했습니다.');
        } else {
            setLeanType('Harmony');
            setInsightText('당신의 정서적 안정감을 높여주는 핵심 인연들을 확인했습니다.');
        }
    };

    const renderResultInsight = () => {
        const topWinner = winners[0];
        if (!topWinner) return null;

        return (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: '#F8F9F8' }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary, textAlign: 'center' }}>
                            {entryLens === 'Negative' ? "에너지 디톡스 우선순위" : entryLens === 'Positive' ? "나의 비타민 랭킹" : entryLens === 'Frequency' ? "일상의 영향력 랭킹" : "관계 균형 조율 결과"}
                        </Text>
                        <View style={{ alignItems: 'center', marginTop: 32 }}>
                            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 40, fontWeight: '900', color: colors.primary }}>{topWinner.name.charAt(0)}</Text>
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: '900', marginTop: 16 }}>{topWinner.name}</Text>
                            <Text style={{ color: colors.primary, opacity: 0.6 }}>{topWinner.role}</Text>
                        </View>
                        <View style={{ marginTop: 40, backgroundColor: 'white', padding: 20, borderRadius: 24 }}>
                            <Text style={{ fontWeight: '700', marginBottom: 8 }}>조율 인사이트</Text>
                            <Text style={{ lineHeight: 20 }}>{insightText}</Text>
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 40 }}
                            onPress={() => onComplete(winners.map(w => w.id))}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>궤도에 반영하기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={onClose}>
                            <Text style={{ color: colors.primary, opacity: 0.5 }}>저장하지 않고 나가기</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            {showResult ? renderResultInsight() : (!leftParticipant || !rightParticipant) ? null : (
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.pauseBadge}>
                            <Pause size={14} color={colors.primary} />
                            <Text style={styles.pauseText}>일시정지</Text>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <Text style={styles.roundText}>{getRoundTitle()}</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
                        </View>
                    </View>

                    <View style={styles.questionSection}>
                        <Text style={[styles.question, { color: colors.primary }]}>
                            {entryLens === 'Negative' ? "누구와 함께할 때 에너지가 더 많이 소모되나요?" :
                             entryLens === 'Positive' ? "누구와 함께할 때 더 큰 에너지를 얻나요?" :
                             entryLens === 'Frequency' ? "누구와의 만남이 일상에 더 큰 영향을 미치나요?" :
                             "누구와 함께할 때 마음이 더 편안한가요?"}
                        </Text>
                    </View>

                    <View style={styles.duelArea}>
                        <View style={styles.cardsGrid}>
                            {[leftParticipant, rightParticipant].map((p, i) => {
                                const zoneColor = p.zone === 1 ? '#FFB74D' : p.zone === 2 ? '#D98B73' : p.zone === 3 ? '#4A5D4E' : p.zone === 4 ? '#90A4AE' : '#D1D5DB';
                                return (
                                    <AnimatedTouchableOpacity
                                        key={p.id}
                                        style={[styles.card, { backgroundColor: 'white', borderColor: zoneColor + '40', borderWidth: 1 }]}
                                        onPress={() => handleSelect(p, i === 0 ? 'left' : 'right')}
                                    >
                                        <View style={[styles.zoneBadge, { backgroundColor: zoneColor }]}>
                                            <Text style={styles.zoneBadgeText}>Zone {p.zone}</Text>
                                        </View>
                                        <View style={[styles.avatarContainer, { borderColor: zoneColor, borderWidth: 3, padding: 2 }]}>
                                            {p.image ? (
                                                <Image source={{ uri: p.image }} style={styles.avatarImage} />
                                            ) : (
                                                <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>{p.name.charAt(0)}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.name}>{p.name}</Text>
                                        <Text style={styles.role}>{p.role}</Text>
                                    </AnimatedTouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </SafeAreaView>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9F8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    closeBtn: { padding: 8 },
    pauseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    pauseText: { fontSize: 12, fontWeight: '700' },
    progressSection: { paddingHorizontal: 40, marginTop: 20 },
    roundText: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
    progressBarBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3 },
    progressBarFill: { height: '100%', borderRadius: 3 },
    questionSection: { paddingHorizontal: 40, marginTop: 40, alignItems: 'center' },
    question: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
    duelArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
    cardsGrid: { flexDirection: 'row', gap: 16 },
    card: { flex: 1, borderRadius: 32, padding: 24, alignItems: 'center', elevation: 4, shadowOpacity: 0.1, position: 'relative' },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
    name: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
    role: { fontSize: 13, opacity: 0.6 },
    zoneBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    zoneBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
});
