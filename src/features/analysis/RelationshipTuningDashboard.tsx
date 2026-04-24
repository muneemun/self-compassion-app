import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Alert,
    FlatList,
    Modal,
    Animated, // Import Added
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ChevronLeft, ChevronUp, ChevronDown, RefreshCw, History, LayoutGrid, Calendar, UserPlus, Info, Scale, Send, Sliders, Anchor, Sun, Brain, Zap, Heart, Infinity, MoreHorizontal, Check, X, Filter, Star, TrendingUp, TrendingDown, ArrowRight, Trash2, Users, AlertCircle, CheckCircle2, BarChart2, Flame, Snowflake, Activity, Sparkles, Shield } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { HubLayout } from '../../layouts/BaseLayout';
import { AppHeader } from '../../components/AppHeader';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode } from '../../types/relationship';
import { FocusTournament } from './FocusTournament';
import { RelationshipDetail } from '../relationships/RelationshipDetail';

const { width } = Dimensions.get('window');

// Define ZONE_INFO outside the component if it's a constant
const ZONE_INFO = {
    zone1: { targetMin: 15, targetMax: 25, targetIdeal: 20 }, // 핵심 그룹
    zone2: { targetMin: 15, targetMax: 25, targetIdeal: 20 }, // 정서적 공유 그룹
    zone3: { targetMin: 20, targetMax: 30, targetIdeal: 25 }, // 기능적 협력 관계
    zone4: { targetMin: 10, targetMax: 20, targetIdeal: 15 }, // 단순 인지 관계
    zone5: { targetMin: 10, targetMax: 20, targetIdeal: 15 }, // 배경 소음(외부 환경)
};

interface RelationshipTuningDashboardProps {
    onBack: () => void;
    onSelectNode: (id: string) => void;
    onGoToReport: () => void;
}

export const RelationshipTuningDashboard: React.FC<RelationshipTuningDashboardProps> = ({ onBack, onSelectNode, onGoToReport }) => {
    const colors = useColors();
    const { relationships, updateDiagnosisResult } = useRelationshipStore();

    // 🕹️ Selection State for Manual Tuning
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterZone, setFilterZone] = useState<number | null>(null);
    const [isTournamentMode, setIsTournamentMode] = useState(false);
    const [tournamentParticipants, setTournamentParticipants] = useState<RelationshipNode[]>([]);
    const [selectedLens, setSelectedLens] = useState<'None' | 'Positive' | 'Negative' | 'Frequency'>('None');

    // 🌟 Animation for Visualization
    const blinkAnim = useRef(new Animated.Value(0.3)).current;
    const AnimatedCircle = Animated.createAnimatedComponent(Circle);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, []);
    const [showStabilityInfo, setShowStabilityInfo] = useState(false);
    const [isRankingExpanded, setIsRankingExpanded] = useState(false);
    const [viewingRelationshipId, setViewingRelationshipId] = useState<string | null>(null);
    const [showCompletePopup, setShowCompletePopup] = useState(false);
    const [autoOpenLog, setAutoOpenLog] = useState(false);

    // 🎯 Dynamic Tuning Logic (Context-Aware)
    const handleStartContextualTuning = () => {
        if (selectedLens === 'None') {
            setIsSelectionMode(true);
            return;
        }

        let sortedData = [...relationships];
        if (selectedLens === 'Positive') {
            sortedData = sortedData.sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
        } else if (selectedLens === 'Negative') {
            sortedData = sortedData.sort((a, b) => (a.temperature || 0) - (b.temperature || 0));
        } else if (selectedLens === 'Frequency') {
            const getWeight = (str: string = '') => {
                if (str.includes('방금') || str.includes('분 전')) return 100;
                if (str.includes('오늘') || str.includes('시간 전')) return 80;
                if (str.includes('어제')) return 60;
                return 10;
            };
            sortedData = sortedData.sort((a, b) => getWeight(b.lastInteraction) - getWeight(a.lastInteraction));
        }

        const participants = sortedData.slice(0, 10); // Contextual Top 10
        if (participants.length < 2) {
            Alert.alert("분석 데이터 부족", "조율을 진행하기 위한 관계 데이터가 충분하지 않습니다.");
            return;
        }

        setTournamentParticipants(participants);
        setIsTournamentMode(true);
    };

    const getLensTuningInfo = () => {
        switch (selectedLens) {
            case 'Positive': return { label: '영혼의 배터리 조율', icon: Star, color: '#D4AF37' };
            case 'Negative': return { label: '에너지 포식자 조율', icon: Zap, color: '#D98B73' };
            case 'Frequency': return { label: '일상의 중력 조율', icon: History, color: colors.primary };
            default: return { label: '관계 균형 조율하기', icon: Scale, color: colors.primary };
        }
    };

    const lensTuningInfo = getLensTuningInfo();

    // 🎨 실제 데이터를 기반으로 로직 정교화
    // 1. Zone별 에너지 비중 계산 (온도 기반 가중치)
    const zoneEnergyMap = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
    const totalEnergySum = relationships.reduce((sum: number, r: RelationshipNode) => sum + (r.temperature || 50), 0);

    relationships.forEach((r: RelationshipNode) => {
        const key = `zone${r.zone}` as keyof typeof zoneEnergyMap;
        if (zoneEnergyMap[key] !== undefined) {
            zoneEnergyMap[key] += (r.temperature || 50);
        }
    });

    const energyPercents = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
    if (totalEnergySum > 0) {
        (Object.keys(energyPercents) as Array<keyof typeof energyPercents>).forEach(key => {
            energyPercents[key] = Math.round((zoneEnergyMap[key] / totalEnergySum) * 100);
        });
    }

    // 2. 안정성 및 불균형 상태 산출
    const stabilityScore = Math.max(0, 100 - (Object.keys(energyPercents) as Array<keyof typeof energyPercents>).reduce((acc, key) => {
        const actual = energyPercents[key];
        const ideal = ZONE_INFO[key].targetIdeal;
        return acc + Math.abs(actual - ideal);
    }, 0));

    const getStabilityStatus = (score: number) => {
        // Zone별 불균형 감지
        const imbalancedZones: Array<{ zone: number; name: string; actual: number; target: string; status: 'over' | 'under' }> = [];

        const zoneNames: Record<number, string> = {
            1: '핵심 그룹',
            2: '정서적 공유 그룹',
            3: '기능적 협력 관계',
            4: '단순 인지 관계',
            5: '배경 소음(외부 환경)'
        };

        (Object.keys(energyPercents) as Array<keyof typeof energyPercents>).forEach(key => {
            const zoneNum = parseInt(key.replace('zone', ''));
            const actual = energyPercents[key];
            const info = ZONE_INFO[key];

            if (actual > info.targetMax) {
                imbalancedZones.push({
                    zone: zoneNum,
                    name: zoneNames[zoneNum],
                    actual,
                    target: `${info.targetMin}-${info.targetMax}%`,
                    status: 'over'
                });
            } else if (actual < info.targetMin) {
                imbalancedZones.push({
                    zone: zoneNum,
                    name: zoneNames[zoneNum],
                    actual,
                    target: `${info.targetMin}-${info.targetMax}%`,
                    status: 'under'
                });
            }
        });

        // 동적 설명 문구 생성
        let dynamicDesc = '';

        if (score >= 85) {
            dynamicDesc = '모든 구역의 에너지가 이상적으로 분배되어 있습니다.';
        } else if (score >= 60) {
            if (imbalancedZones.length > 0) {
                const zone = imbalancedZones[0];
                dynamicDesc = `Zone ${zone.zone}(${zone.name})에 약간의 편차가 있으나 전반적으로 안정적입니다.`;
            } else {
                dynamicDesc = '전반적으로 안정적인 에너지 흐름을 보이고 있습니다.';
            }
        } else if (score >= 40) {
            if (imbalancedZones.length > 0) {
                const zone = imbalancedZones[0];
                const statusText = zone.status === 'over' ? '에너지 과다' : '에너지 부족';
                dynamicDesc = `Zone ${zone.zone}(${zone.name})에 ${statusText} 상태입니다.`;
            } else {
                dynamicDesc = '일부 구역에 에너지가 쏠려있어 조율이 권장됩니다.';
            }
        } else {
            if (imbalancedZones.length > 0) {
                const criticalZones = imbalancedZones.slice(0, 2).map(z => `Zone ${z.zone}(${z.name})`).join(', ');
                dynamicDesc = `${criticalZones}의 심각한 불균형이 감지되었습니다.`;
            } else {
                dynamicDesc = '관계망의 불균형이 심화되어 정서적 소모가 큽니다.';
            }
        }

        return {
            label: score >= 85 ? '최적' : score >= 60 ? '양호' : score >= 40 ? '주의' : '위험',
            desc: dynamicDesc,
            color: score >= 85 ? '#4A5D4E' : score >= 60 ? '#7BA67E' : score >= 40 ? '#E9A15A' : '#D98B73',
            imbalancedZones
        };
    };

    const stabilityStatus = getStabilityStatus(stabilityScore);

    const handleShowStabilityInfo = () => {
        setShowStabilityInfo(true);
    };

    const imbalancedRelationships = relationships.filter((r: RelationshipNode) => {
        const key = `zone${r.zone}` as keyof typeof energyPercents;
        const actual = energyPercents[key];
        const info = (ZONE_INFO as any)[key];
        return actual > info.targetMax || actual < info.targetMin;
    });

    const isSaturated = (Object.keys(energyPercents) as Array<keyof typeof energyPercents>).some(key => {
        return energyPercents[key] > (ZONE_INFO as any)[key].targetMax;
    });

    const imbalancedCount = imbalancedRelationships.length;

    // 3. 동적 넛지(Nudges) 추출
    // 3. 동적 넛지(Nudges) 추출
    const getDynamicNudges = () => {
        const items: any[] = [];
        const status = stabilityStatus; // 이미 계산된 stabilityStatus 사용

        // 🚨 1. 최우선 순위: 핵심 그룹(Zone 1) 에너지 부족 해결
        const zone1Issue = status.imbalancedZones.find(z => z.zone === 1 && z.status === 'under');
        if (zone1Issue) {
            const z1Neglected = relationships.find((r: RelationshipNode) =>
                r.zone === 1 && (r.lastInteraction?.includes('달') || r.lastInteraction?.includes('주'))
            );
            const moveCandidate = relationships.find((r: RelationshipNode) =>
                r.zone === 2 && r.metrics.satisfaction > 85
            );

            const target = z1Neglected || moveCandidate || relationships.find(r => r.zone === 1);
            if (target) {
                items.push({
                    id: `prio-z1-${target.id}`,
                    nodeId: target.id,
                    type: '핵심 그룹 강화',
                    target: target.name,
                    issue: '지탱 에너지가 임계점 이하입니다. 이 관계에 집중하세요.',
                    score: target.metrics?.trust || 70,
                    color: '#D4AF37', // Gold for Priority
                    action: '우선 조율',
                });
            }
        }

        // 🚨 2. 포화 구역 및 대규모 불균형 관리 (135명 등의 이슈)
        const overZone = status.imbalancedZones.find(z => z.status === 'over');
        if (overZone && imbalancedCount > 10) {
            const noiseCandidate = relationships.find((r: RelationshipNode) =>
                r.zone === overZone.zone && r.metrics.satisfaction < 50
            ) || relationships.find(r => r.zone === overZone.zone);

            if (noiseCandidate) {
                items.push({
                    id: `refactor-${noiseCandidate.id}`,
                    nodeId: noiseCandidate.id,
                    type: '구역 재배치',
                    target: noiseCandidate.name,
                    issue: `${imbalancedCount}명의 인원이 에너지를 소모 중입니다. 구역을 이동하세요.`,
                    score: noiseCandidate.metrics?.satisfaction || 40,
                    color: '#737874', // Gray for refactor
                    action: '구역 이동',
                });
            }
        }

        // 🟢 3. 기본 넛지: 소홀해진 관계
        const neglected = relationships.find((r: RelationshipNode) =>
            r.zone <= 2 && !items.some(i => i.id.includes(r.id)) &&
            (r.lastInteraction?.includes('달') || r.lastInteraction?.includes('주') || r.lastInteraction === '확인 필요')
        );

        if (neglected) {
            items.push({
                id: `neglected-${neglected.id}`,
                nodeId: neglected.id,
                type: '관계 회복',
                target: neglected.name,
                issue: '최근 교감이 부족하여 멀어지고 있어요',
                score: neglected.metrics?.trust || 75,
                color: '#D98B73',
                action: '안부 묻기',
            });
        }

        // 🟢 4. 새로운 인연
        const recent = relationships.find((r: RelationshipNode) =>
            (r.lastInteraction?.includes('방금') || r.lastInteraction?.includes('오늘')) &&
            !items.some(i => i.id.includes(r.id))
        );

        if (recent) {
            items.push({
                id: `recent-${recent.id}`,
                nodeId: recent.id,
                type: '관계 형성',
                target: recent.name,
                issue: '새로운 인연과 더 깊은 대화를 나눠보세요',
                score: 80,
                color: '#FFB74D',
                action: '약속 잡기',
            });
        }

        // 5. Fallback
        if (items.length < 2 && relationships.length > 0) {
            const spare = relationships.find(r => !items.some(i => i.id.includes(r.id)));
            if (spare) {
                items.push({
                    id: `spare-${spare.id}`,
                    nodeId: spare.id,
                    type: '일상 점검',
                    target: spare.name,
                    issue: '이 관계의 에너지를 한 번 점검해보실까요?',
                    score: 55,
                    color: colors.primary,
                    action: '둘러보기',
                });
            }
        }

        return items;
    };

    const [nudgeList, setNudgeList] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Initial load
    useEffect(() => {
        setNudgeList(getDynamicNudges());
    }, [relationships]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate loading & refresh data
        setTimeout(() => {
            const freshNudges = getDynamicNudges();
            // 셔플 효과를 위해 약간의 순서 변경 (예시)
            // 실제로는 서버 데이터를 다시 가져오거나 알고리즘 파라미터를 변경해야 함
            setNudgeList([...freshNudges]);
            setIsRefreshing(false);
        }, 800);
    };

    const renderHeader = () => (
        <AppHeader
            title={isSelectionMode ? '관계 선택' : '관계 튜닝'}
            leftAction={
                isSelectionMode ? (
                    <TouchableOpacity
                        onPress={() => {
                            setIsSelectionMode(false);
                            setSelectedIds([]);
                            setFilterZone(null);
                        }}
                        style={styles.iconBtn}
                    >
                        <ChevronLeft size={24} color={colors.primary} />
                    </TouchableOpacity>
                ) : null
            }
            rightAction={
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {isSelectionMode ? (
                        <TouchableOpacity
                            onPress={() => setSelectedIds(selectedIds.length === filteredRelationships.length ? [] : filteredRelationships.map(r => r.id))}
                        >
                            <CheckCircle2 size={24} color={colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={24} color={colors.primary} style={isRefreshing ? { transform: [{ rotate: '45deg' }] } : {}} />
                        </TouchableOpacity>
                    )}
                </View>
            }
        />
    );

    const filteredRelationships = filterZone
        ? relationships.filter((r: RelationshipNode) => r.zone === filterZone)
        : relationships;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const renderSelectionList = () => (
        <View style={styles.selectionView}>
            <View style={{ paddingVertical: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                    {[
                        { z: 1, label: '핵심' },
                        { z: 2, label: '정서' },
                        { z: 3, label: '협력' },
                        { z: 4, label: '인지' },
                        { z: 5, label: '외부' }
                    ].map(item => (
                        <TouchableOpacity
                            key={item.z}
                            onPress={() => setFilterZone(filterZone === item.z ? null : item.z)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: filterZone === item.z ? colors.primary : '#F0EADE',
                                borderWidth: 1,
                                borderColor: filterZone === item.z ? colors.primary : 'transparent'
                            }}
                        >
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: filterZone === item.z ? 'white' : colors.primary
                            }}>
                                Zone {item.z} {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.selectionScroll}>
                {filteredRelationships.map((r: RelationshipNode) => {
                    const zoneColor = {
                        1: '#FFB74D',
                        2: '#D98B73',
                        3: '#4A5D4E',
                        4: '#90A4AE',
                        5: '#D1D5DB'
                    }[r.zone] || colors.primary;

                    const dynamics = (() => {
                        if ((r.temperature || 0) >= 80) return { color: '#D98B73', icon: Flame };
                        if ((r.temperature || 0) <= 40) return { color: '#90A4AE', icon: Snowflake };
                        return { color: '#4A5D4E', icon: Activity };
                    })();
                    const DynamicsIcon = dynamics.icon;

                    return (
                        <TouchableOpacity
                            key={r.id}
                            style={[
                                styles.selectionItem,
                                { backgroundColor: colors.white, paddingVertical: 12, paddingHorizontal: 16, height: 'auto', alignItems: 'center' }
                            ]}
                            onPress={() => toggleSelect(r.id)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                {/* Avatar Section */}
                                <View style={{ width: 56, height: 56 }}>
                                    <View style={{
                                        width: '100%', height: '100%', borderRadius: 28, borderWidth: 3,
                                        borderColor: zoneColor, padding: 2, alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {r.image ? (
                                            <Image source={{ uri: r.image }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                                        ) : (
                                            <View style={{ width: '100%', height: '100%', borderRadius: 24, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>{r.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    {/* Badge */}
                                    <View style={{
                                        position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11,
                                        backgroundColor: '#fff', borderWidth: 2, borderColor: dynamics.color, alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <DynamicsIcon size={10} color={dynamics.color} fill={dynamics.color} />
                                    </View>
                                </View>

                                {/* Info Section */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, marginBottom: 2 }}>{r.name}</Text>
                                    <Text style={{ fontSize: 12, color: colors.primary, opacity: 0.6, fontWeight: '600' }}>
                                        {r.role || '관계'} • Zone {r.zone}
                                    </Text>
                                </View>
                            </View>

                            {/* Right Section: Temp Bar & Checkbox */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 4, height: 32, backgroundColor: '#E0E0E0', borderRadius: 2 }}>
                                    <View style={{
                                        width: '100%',
                                        height: `${r.temperature || 50}%`,
                                        backgroundColor: (r.temperature || 0) > 70 ? colors.accent : colors.primary,
                                        position: 'absolute', bottom: 0, borderRadius: 2
                                    }} />
                                </View>
                                <View style={{ alignItems: 'flex-end', minWidth: 24 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: (r.temperature || 0) > 70 ? colors.accent : colors.primary, marginBottom: 2 }}>
                                        {r.temperature || 0}°
                                    </Text>
                                </View>
                                <View style={[
                                    styles.checkBox,
                                    {
                                        borderColor: selectedIds.includes(r.id) ? colors.primary : '#D1D5DB',
                                        backgroundColor: selectedIds.includes(r.id) ? colors.primary : 'transparent',
                                        marginLeft: 4
                                    }
                                ]}>
                                    {selectedIds.includes(r.id) && <Check size={14} color="white" />}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {filteredRelationships.length === 0 && (
                    <View style={styles.emptySelection}>
                        <Info size={40} color={colors.primary} opacity={0.2} />
                        <Text style={styles.emptyText}>해당 구역에 등록된 관계가 없습니다.</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.selectionFooter}>
                <TouchableOpacity
                    disabled={selectedIds.length < 2}
                    style={[styles.startTuningBtn, { backgroundColor: colors.primary, opacity: selectedIds.length < 2 ? 0.5 : 1 }]}
                    onPress={() => {
                        const participants = relationships.filter((r: RelationshipNode) => selectedIds.includes(r.id));
                        setTournamentParticipants(participants);
                        setIsTournamentMode(true);
                    }}
                >
                    <Scale size={20} color="white" />
                    <Text style={styles.startTuningText}>{selectedIds.length}명 비교 시작하기</Text>
                </TouchableOpacity>
            </View>
        </View >
    );

    const renderOrbitVisualization = () => (
        <View style={styles.vizSection}>
            <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>균형 요약</Text>
                </View>
                {/* Insight Card Style Summary */}
                <View style={{ marginTop: 12, backgroundColor: '#F5F7F6', borderRadius: 16, padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '600' }}>현재 마음의 여유</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSaturated ? '#EF5350' : '#4A5D4E' }} />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#333' }}>
                                    {isSaturated ? '여유 없음' : '충분함'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: 1, height: '100%', backgroundColor: '#E0E0E0', marginHorizontal: 16 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '600' }}>우선 조율 포인트</Text>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: stabilityStatus.imbalancedZones.length > 0
                                    ? (stabilityStatus.imbalancedZones[0].status === 'over' ? '#EF5350' : '#FFB74D')
                                    : '#4A5D4E'
                            }}>
                                {stabilityStatus.imbalancedZones.length > 0
                                    ? `Zone ${stabilityStatus.imbalancedZones[0].zone} (${stabilityStatus.imbalancedZones[0].status === 'over' ? '비움 필요' : '채움 필요'})`
                                    : '균형 잡힘'}
                            </Text>
                        </View>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 12 }}>
                        <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>
                            {stabilityStatus.imbalancedZones.length > 0
                                ? `현재 Zone ${stabilityStatus.imbalancedZones[0].zone} 영역이 ${stabilityStatus.imbalancedZones[0].status === 'over' ? '너무 혼잡합니다. 관계를 정리하여 마음의 공간을 확보하세요.' : '너무 빈약합니다. 소중한 사람들과 더 자주 교류하여 에너지를 채우세요.'}`
                                : "관계 에너지가 적절하게 흐르고 있어 마음이 쾌적한 상태입니다."}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.vizCard, { backgroundColor: colors.white, height: 'auto', aspectRatio: undefined, paddingVertical: 24, justifyContent: 'flex-start' }]}>
                <TouchableOpacity onPress={onGoToReport} style={styles.vizCardDetailBtn}>
                    <BarChart2 size={14} color={colors.primary} />
                    <Text style={[styles.miniSelectText, { color: colors.primary }]}>상세 보기</Text>
                </TouchableOpacity>
                {/* 🏷️ Legend for Visualization */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF5350', borderWidth: 2, borderColor: '#EF5350' }} />
                        <Text style={{ fontSize: 11, color: '#555', fontWeight: '600' }}>과다</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FFB74D' }} />
                        <Text style={{ fontSize: 11, color: '#555', fontWeight: '600' }}>부족</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ccc', borderStyle: 'dotted' }} />
                        <Text style={{ fontSize: 11, color: '#999' }}>적정</Text>
                    </View>
                </View>

                <View style={styles.radarWrapper}>
                    <Svg height="260" width="260" viewBox="0 0 300 300">
                        {/* Orbit Rings - Touchable Zones with Diagnostic Styles */}
                        {/* 1. Halo Layer (Error Status Glow) - Drawn BEHIND track */}
                        {[
                            { z: 3, r: 110 },
                            { z: 2, r: 80 },
                            { z: 1, r: 50 }
                        ].map(ring => {
                            const issue = stabilityStatus.imbalancedZones.find(z => z.zone === ring.z);
                            if (!issue) return null; // Skip if normal

                            const isOver = issue.status === 'over';
                            const glowColor = isOver ? "#EF5350" : "#FFB74D";

                            return (
                                <AnimatedCircle
                                    key={`halo-${ring.z}`}
                                    cx="150" cy="150" r={ring.r}
                                    stroke={glowColor}
                                    strokeWidth={24} // Wide glow
                                    strokeOpacity={blinkAnim.interpolate({
                                        inputRange: [0.3, 1],
                                        outputRange: [0.1, 0.25] // Subtle pulsing opacity
                                    })}
                                    fill="none"
                                />
                            );
                        })}

                        {/* 2. Track Layer (Thin Guide Lines) - Always visible, Clean */}
                        {[
                            { z: 3, r: 110 },
                            { z: 2, r: 80 },
                            { z: 1, r: 50 }
                        ].map(ring => (
                            <Circle
                                key={`track-${ring.z}`}
                                cx="150" cy="150" r={ring.r}
                                stroke="#D9D9D9"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                fill="transparent"
                                onPress={() => { setIsSelectionMode(true); setFilterZone(ring.z); }}
                            />
                        ))}

                        {/* Dynamic Relationship Nodes */}
                        {relationships.map((r: RelationshipNode, i: number) => {
                            const angle = (i * 137.5) * (Math.PI / 180);
                            const rRadius = r.zone === 1 ? 50 : r.zone === 2 ? 80 : 110;
                            const cx = 150 + rRadius * Math.cos(angle);
                            const cy = 150 + rRadius * Math.sin(angle);
                            const isImbalanced = imbalancedRelationships.some((ir: RelationshipNode) => ir.id === r.id);

                            // Lens Logic
                            let isHighlighted = true;
                            let highlightColor = colors.primary;

                            if (selectedLens === 'Positive') {
                                isHighlighted = (r.temperature || 0) >= 80;
                                highlightColor = '#D4AF37'; // Gold
                            } else if (selectedLens === 'Negative') {
                                isHighlighted = (r.temperature || 0) <= 40;
                                highlightColor = '#D98B73'; // Terracotta
                            } else if (selectedLens === 'Frequency') {
                                isHighlighted = (r.lastInteraction?.includes('방금') || r.lastInteraction?.includes('어제'));
                                highlightColor = colors.accent;
                            }

                            return (
                                <React.Fragment key={r.id}>
                                    {isImbalanced && selectedLens === 'None' && (
                                        <Circle cx={cx} cy={cy} r={r.zone === 1 ? 12 : 10} stroke="#D98B73" strokeWidth="1" strokeOpacity="0.3" fill="none" />
                                    )}
                                    <Circle
                                        cx={cx} cy={cy}
                                        r={isHighlighted ? (isImbalanced ? 7 : 5) : 3}
                                        fill={isHighlighted ? (selectedLens === 'None' && isImbalanced ? '#D98B73' : highlightColor) : colors.primary}
                                        opacity={isHighlighted ? 1 : 0.15}
                                    />
                                    {isHighlighted && selectedLens !== 'None' && (
                                        <Circle cx={cx} cy={cy} r={8} stroke={highlightColor} strokeWidth="1" strokeOpacity="0.4" fill="none" />
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* 🎯 Stable Center Core (Self) */}
                        <Circle cx="150" cy="150" r="18" fill={colors.primary} />
                        <Circle cx="150" cy="150" r="8" fill="white" opacity="0.9" />
                    </Svg>
                </View>

                {/* Info Section (Moved Below Orbit) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', paddingHorizontal: 24, marginTop: 24 }}>
                    <View style={styles.stabilityBadgeContainer}>
                        <TouchableOpacity
                            style={[styles.stabilityBadge, { backgroundColor: stabilityStatus.color }]}
                            onPress={handleShowStabilityInfo}
                            activeOpacity={0.9}
                        >
                            <View style={styles.stabilityHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={styles.stabilityLabel}>안정성</Text>
                                    <Info size={10} color="rgba(255,255,255,0.6)" />
                                </View>
                                <View style={styles.stabilityStatusTag}>
                                    <Text style={styles.stabilityStatusText}>{stabilityStatus.label}</Text>
                                </View>
                            </View>
                            <Text style={styles.stabilityValue}>{stabilityScore}%</Text>
                        </TouchableOpacity>
                        <Text style={styles.stabilityDescText}>{stabilityStatus.desc}</Text>
                    </View>

                    <View style={[styles.imbalanceTag, { backgroundColor: imbalancedCount > 0 ? 'rgba(217, 139, 115, 0.1)' : colors.primary + '10', borderColor: imbalancedCount > 0 ? 'rgba(217, 139, 115, 0.2)' : colors.primary + '20' }]}>
                        <View style={[styles.dot, { backgroundColor: imbalancedCount > 0 ? '#D98B73' : colors.primary }]} />
                        <Text style={[styles.imbalanceText, { color: imbalancedCount > 0 ? '#D98B73' : colors.primary }]}>
                            {imbalancedCount > 0 ? `불균형 인물 ${imbalancedCount}명` : '평형 상태'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderNudgeCard = (item: any) => (
        <View key={item.id} style={[styles.nudgeCard, { backgroundColor: colors.white }]}>
            {/* 1. Header Row (Type & Priority) */}
            <View style={styles.cardHeaderRow}>
                <View style={[styles.typeBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.typeText, { color: item.color }]}>{item.type}</Text>
                </View>
                {/* 만약 긴급도가 높다면 표시 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} color={item.color} />
                    <Text style={{ fontSize: 11, color: item.color, fontWeight: '700' }}>주의</Text>
                </View>
            </View>

            {/* 2. Main Content (Avatar & Info) */}
            <View style={styles.cardMainContent}>
                <View style={[styles.avatarWrapper, { borderColor: item.color, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }]}>
                    {/* Placeholder Image가 없으므로 아이콘으로 대체 */}
                    <Users size={32} color="#AAAAAA" />

                    <View style={[styles.alertIcon, { backgroundColor: item.color }]}>
                        <TrendingDown size={14} color="white" />
                    </View>
                </View>

                <View style={styles.cardInfoGroup}>
                    <Text style={[styles.nudgeTargetName, { color: colors.primary }]}>{item.target}</Text>
                    <Text style={[styles.nudgeIssueText, { color: colors.primary }]}>{item.issue}</Text>
                </View>

                {/* 3. Metric Bar */}
                <View style={styles.metricContainer}>
                    <View style={styles.metricLabelRow}>
                        <Text style={styles.metricLabel}>관계 에너지</Text>
                        <Text style={[styles.metricValue, { color: item.color }]}>{Math.floor(item.score)}점</Text>
                    </View>
                    <View style={styles.metricTrack}>
                        <View style={[styles.metricFill, { width: `${Math.floor(item.score)}%`, backgroundColor: item.color }]} />
                    </View>
                </View>
            </View>

            {/* 4. Action Button */}
            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: item.color }]}
                activeOpacity={0.8}
                onPress={() => onSelectNode(item.nodeId)}
            >
                <Text style={styles.actionBtnText}>확인하기</Text>
                <ArrowRight size={16} color="white" />
            </TouchableOpacity>
        </View>
    );

    const renderFocusInsight = () => {
        // 상위 10명 관계 추출 (렌즈별 정렬 로직은 아래에서 수행)
        const topRelationships = [...relationships]
            .sort((a, b) => (b.temperature || 0) - (a.temperature || 0))
            .slice(0, 10);

        if (topRelationships.length === 0) return null;

        const anchor = topRelationships[0];
        const energySquad = topRelationships.slice(1);

        const PERSONA_INFO: any = {
            1: { label: '나의 앵커', icon: Anchor, desc: `"${anchor.name}님과의 대화는 당신에게 깊은 안정감을 주었습니다."` },
            2: { label: '성장 거울', icon: Infinity, desc: '거울 • 성장 피드백' },
            3: { label: '활력 충전', icon: Zap, desc: '에너자이저 • 활력 충전' },
            4: { label: '깊은 통찰', icon: Brain, desc: '현자 • 깊은 통찰' },
            5: { label: '긍정 태양', icon: Sun, desc: '선샤인 • 긍정 에너지' },
        };

        return (
            <View style={styles.focusSection}>
                {/* 🔍 Lens Tabs (Moved Here) */}
                <View style={[styles.lensTabContainer, { marginBottom: 24, marginHorizontal: -24 }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lensScroll}>
                        {[
                            { id: 'None', label: '전체', icon: LayoutGrid },
                            { id: 'Positive', label: '영혼의 배터리', icon: Star },
                            { id: 'Negative', label: '에너지 포식자', icon: Zap },
                            { id: 'Frequency', label: '일상의 중력', icon: History },
                        ].map((lens) => (
                            <TouchableOpacity
                                key={lens.id}
                                onPress={() => setSelectedLens(lens.id as any)}
                                style={[
                                    styles.lensTab,
                                    { backgroundColor: selectedLens === lens.id ? colors.primary : colors.white, borderColor: colors.primary + '10' },
                                    selectedLens === lens.id && styles.activeLensTab
                                ]}
                            >
                                <lens.icon size={14} color={selectedLens === lens.id ? 'white' : colors.primary} />
                                <Text style={[styles.lensTabText, { color: selectedLens === lens.id ? 'white' : colors.primary }]}>
                                    {lens.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.focusHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                        {selectedLens === 'Positive' ? '✨ 영혼의 배터리 순위' :
                            selectedLens === 'Negative' ? '⚠️ 에너지 포식자 순위' :
                                selectedLens === 'Frequency' ? '📊 일상의 중력 순위' : '집중 인사이트'}
                    </Text>
                    <Text style={styles.focusSub}>
                        {selectedLens === 'Positive' ? '당신에게 가장 긍정적인 회복 에너지를 주는 인물들입니다.' :
                            selectedLens === 'Negative' ? '현재 심리적 소모가 큰 관계들입니다. 적절한 방어와 조율이 필요합니다.' :
                                selectedLens === 'Frequency' ? '당신의 일상적인 시간을 가장 많이 점유하고 있는 실질적 관계들입니다.' :
                                    `당신의 웰빙에 가장 긍정적인 영향을 준 에너지 인물들입니다.`}
                    </Text>
                </View>

                {(() => {
                    let sortedData = [...relationships];
                    let themeColor = colors.accent;
                    let LensIcon = Star;

                    // Zone Colors for Borders
                    const zoneColors: Record<number, string> = {
                        1: '#FFB74D',
                        2: '#D98B73',
                        3: '#4A5D4E',
                        4: '#90A4AE',
                        5: '#D1D5DB'
                    };

                    if (selectedLens === 'Positive') {
                        sortedData = sortedData.sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
                        themeColor = '#D4AF37'; // Gold
                        LensIcon = Star;
                    } else if (selectedLens === 'Negative') {
                        sortedData = sortedData.sort((a, b) => (a.temperature || 0) - (b.temperature || 0));
                        themeColor = '#D98B73'; // Terracotta
                        LensIcon = Zap;
                    } else if (selectedLens === 'Frequency') {
                        // interaction frequency logic (simple mapping for now)
                        const getWeight = (str: string = '') => {
                            if (str.includes('방금') || str.includes('분 전')) return 100;
                            if (str.includes('오늘') || str.includes('시간 전')) return 80;
                            if (str.includes('어제')) return 60;
                            if (str.includes('일 전')) return 40;
                            return 10;
                        };
                        sortedData = sortedData.sort((a, b) => getWeight(b.lastInteraction) - getWeight(a.lastInteraction));
                        themeColor = colors.primary;
                        LensIcon = History;
                    } else {
                        sortedData = sortedData.sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
                    }

                    const topTen = sortedData.slice(0, 10);
                    const displayList = isRankingExpanded ? topTen : topTen.slice(0, 5);
                    const anchor = topTen[0];
                    if (!anchor) return null;

                    return (
                        <>
                            {/* Rank 1 Card */}
                            <TouchableOpacity
                                style={[styles.anchorCard, { backgroundColor: colors.white }]}
                                onPress={() => onSelectNode(anchor.id)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.anchorBadgeRow}>
                                    <View style={[styles.anchorBadge, { backgroundColor: themeColor + '10' }]}>
                                        <Text style={[styles.anchorBadgeText, { color: themeColor }]}>NO. 1</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: themeColor, fontWeight: '800' }}>
                                        {selectedLens === 'Frequency' ? `${anchor.lastInteraction} • ${anchor.temperature}°C` : `${anchor.temperature}°C`}
                                    </Text>
                                </View>
                                <View style={styles.anchorMain}>
                                    <View style={[styles.anchorAvatarWrapper, { borderWidth: 3, borderColor: zoneColors[anchor.zone] || '#D1D5DB', borderRadius: 100 }]}>
                                        <View style={[styles.anchorAvatarHalo, { backgroundColor: themeColor + '15' }]} />
                                        {anchor.image ? (
                                            <Image source={{ uri: anchor.image }} style={styles.anchorAvatar as any} />
                                        ) : (
                                            <View style={[styles.anchorAvatarDefault, { backgroundColor: colors.primary + '10' }]}>
                                                <LensIcon size={40} color={colors.primary} />
                                            </View>
                                        )}
                                        <View style={[styles.rankFloatingBadge, { backgroundColor: themeColor }]}>
                                            <Text style={styles.rankFloatingText}>1</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.anchorName, { color: colors.primary }]}>{anchor.name}</Text>
                                    <View style={[styles.personaPill, { backgroundColor: themeColor + '10' }]}>
                                        <LensIcon size={14} color={themeColor} />
                                        <Text style={[styles.personaLabel, { color: themeColor }]}>{anchor.role || '관계'}</Text>
                                    </View>
                                    <Text style={styles.anchorDesc}>
                                        {(() => {
                                            switch (selectedLens) {
                                                case 'Positive': return '당신을 가장 따사롭게 회복시키며 긍정 에너지를 공급하는 최고의 지지자입니다.';
                                                case 'Frequency': return '현재 당신의 물리적 시간과 관심을 가장 많이 점유하고 있는 일상의 중심축입니다.';
                                                case 'Negative': return '심리적 소모도가 가장 높고 에너지 방어가 필요한 관계입니다.';
                                                default: return '현재 당신의 인맥 궤도에서 가장 강력한 심리적 영향력을 미치는 존재입니다.';
                                            }
                                        })()}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Ranking list (Rank 2-10) */}
                            <View style={styles.squadList}>
                                {displayList.slice(1).map((r, idx) => {
                                    const rank = idx + 2;
                                    return (
                                        <TouchableOpacity
                                            key={r.id}
                                            style={[styles.squadItem, { backgroundColor: colors.white }]}
                                            onPress={() => onSelectNode(r.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.squadAvatarWrapper, { borderWidth: 2, borderColor: zoneColors[r.zone] || '#D1D5DB', borderRadius: 100 }]}>
                                                {r.image ? (
                                                    <Image source={{ uri: r.image }} style={styles.squadAvatar as any} />
                                                ) : (
                                                    <View style={[styles.squadAvatarDefault, { backgroundColor: colors.primary + '08' }]}>
                                                        <LensIcon size={20} color={colors.primary} />
                                                    </View>
                                                )}
                                                <View style={[styles.squadRankBadge, { backgroundColor: themeColor }]}>
                                                    <Text style={[styles.squadRankText, { color: 'white' }]}>{rank}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.squadInfo}>
                                                <View style={styles.squadNameRow}>
                                                    <Text style={[styles.squadName, { color: colors.primary }]}>{r.name}</Text>
                                                    <Text style={{ fontSize: 12, color: themeColor, fontWeight: '800' }}>
                                                        {selectedLens === 'Frequency' ? `${r.lastInteraction} • ${r.temperature}°C` : `${r.temperature}°C`}
                                                    </Text>
                                                </View>
                                                <View style={styles.squadPersonaRow}>
                                                    <Text style={styles.squadPersonaText}>{r.role || '관계 인지됨'}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* View More Button */}
                            {topTen.length > 5 && (
                                <TouchableOpacity
                                    style={[styles.viewMoreRankingBtn, { borderColor: themeColor + '20' }]}
                                    onPress={() => setIsRankingExpanded(!isRankingExpanded)}
                                >
                                    <Text style={[styles.viewMoreRankingText, { color: themeColor }]}>
                                        {isRankingExpanded ? '간략히 보기' : `순위 더보기 (총 ${topTen.length}명 중 나머지 확인)`}
                                    </Text>
                                    {isRankingExpanded ? <ChevronUp size={16} color={themeColor} /> : <ChevronDown size={16} color={themeColor} />}
                                </TouchableOpacity>
                            )}
                        </>
                    );
                })()}

            </View>
        );
    };

    if (isTournamentMode) {
        return (
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, display: viewingRelationshipId ? 'none' : 'flex' }}>
                    <FocusTournament
                        participants={tournamentParticipants}
                        onComplete={(winners) => {
                            // 📈 우선순위에 따른 정서 온도 가중치 반영
                            const isNegative = selectedLens === 'Negative';

                            winners.forEach((id, index) => {
                                const node = relationships.find(r => r.id === id);
                                if (node) {
                                    let weight = 0;
                                    if (isNegative) {
                                        // 에너지 디톡스 가중치 (점진적 하향)
                                        if (index === 0) weight = -5;
                                        else if (index === 1) weight = -3;
                                        else if (index === 2) weight = -1;
                                    } else {
                                        // 일반 조율 가중치
                                        if (index === 0) weight = 7;
                                        else if (index === 1) weight = 4;
                                        else if (index === 2) weight = 2;
                                    }

                                    if (weight !== 0) {
                                        const currentTemp = node.temperature || 50;
                                        const newTemp = Math.max(0, Math.min(100, currentTemp + weight));

                                        updateDiagnosisResult(id, {
                                            temperature: newTemp,
                                            event: isNegative ? '에너지 디톡스 반영' : '집중 조율 반영'
                                        });
                                    }
                                }
                            });

                            setShowCompletePopup(true);
                            setIsTournamentMode(false); // 팝업이 포함된 메인 레이아웃으로 전환
                            setIsSelectionMode(false);
                            setSelectedIds([]);
                        }}
                        onClose={() => setIsTournamentMode(false)}
                        entryLens={selectedLens}
                        onSelectParticipant={(id, autoCheckIn) => {
                            setViewingRelationshipId(id);
                            if (autoCheckIn) setAutoOpenLog(true);
                        }}
                        visible={!viewingRelationshipId}
                    />
                </View>
                {viewingRelationshipId && (
                    <Modal visible={true} transparent animationType="slide">
                        <View style={[StyleSheet.absoluteFill, { zIndex: 10, backgroundColor: colors.background }]}>
                            <RelationshipDetail
                                relationshipId={viewingRelationshipId}
                                onBack={() => {
                                    setViewingRelationshipId(null);
                                    setAutoOpenLog(false);
                                }}
                                onDiagnose={() => { }}
                                onManageProfile={() => { }}
                                onViewReport={() => { }}
                                autoOpenLog={autoOpenLog}
                            />
                        </View>
                    </Modal>
                )}
            </View>
        );
    }

    return (
        <HubLayout header={renderHeader()} scrollable={!isSelectionMode}>
            {isSelectionMode ? (
                renderSelectionList()
            ) : (
                <View style={[styles.dashboardContainer, { paddingTop: 12 }]}>



                    {renderOrbitVisualization()}
                    {renderFocusInsight()}

                    <View style={styles.nudgeSection}>
                        <View style={styles.nudgeHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>우선 관리</Text>
                            <TouchableOpacity>
                                <Text style={[styles.viewAll, { color: colors.primary }]}>전체보기</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            horizontal
                            data={nudgeList}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => renderNudgeCard(item)}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.nudgeScroll}
                        />
                    </View>

                    <View style={{ height: 260 }} />

                    {!isSelectionMode && (
                        <View style={styles.fabContainer}>
                            <TouchableOpacity
                                style={[styles.fab, { backgroundColor: lensTuningInfo.color }]}
                                onPress={handleStartContextualTuning}
                            >
                                <lensTuningInfo.icon size={24} color="white" />
                                <Text style={styles.fabText}>{lensTuningInfo.label}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Premium Guide Popup (Insight Style) */}
            {/* ℹ️ 관계 안정성 지표 안내 팝업 */}
            <Modal
                visible={showStabilityInfo}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStabilityInfo(false)}
            >
                <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowStabilityInfo(false)}
                    />
                    <View style={[styles.floatingPopupCard, { backgroundColor: colors.white }]}>
                        <View style={styles.guideHeader}>
                            <View>
                                <Text style={[styles.guideTitle, { color: colors.primary }]}>관계 안정성 지표 안내</Text>
                                <Text style={[styles.guideSubTitle, { color: colors.accent }]}>Stability Analysis Model</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowStabilityInfo(false)} style={styles.popupCloseBtn}>
                                <X size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.popupScrollContainer}>
                            <Text style={[styles.guideInfoText, { color: colors.primary }]}>
                                이 수치는 당신의 에너지 분포가 얼마나 균형 잡혀 있는지를 나타냅니다.
                            </Text>

                            <View style={[styles.zoneDistributionCard, { backgroundColor: colors.primary + '05' }]}>
                                <Text style={[styles.zoneDistributionTitle, { color: colors.primary }]}>현재 구역별 에너지 분포</Text>
                                {(Object.keys(energyPercents) as Array<keyof typeof energyPercents>).map((key) => {
                                    const zoneNum = parseInt(key.replace('zone', ''));
                                    const zoneName = ['안전기지', '심리적 우군', '전략적 동행', '사회적 지인', '배경 소음'][zoneNum - 1];
                                    const actual = energyPercents[key];
                                    const info = ZONE_INFO[key];
                                    const isImbalanced = actual > info.targetMax || actual < info.targetMin;
                                    const statusColor = isImbalanced ? '#D98B73' : '#4A5D4E';

                                    return (
                                        <View key={key} style={styles.zoneRow}>
                                            <View style={styles.zoneInfo}>
                                                <Text style={[styles.zoneName, { color: colors.primary }]}>Zone {zoneNum}</Text>
                                                <Text style={styles.zoneLabel}>{zoneName}</Text>
                                            </View>
                                            <View style={styles.zoneMetrics}>
                                                <View style={[styles.zoneBar, { backgroundColor: colors.primary + '10' }]}>
                                                    <View
                                                        style={[
                                                            styles.zoneBarFill,
                                                            {
                                                                width: `${Math.min(actual, 100)}%`,
                                                                backgroundColor: statusColor
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={[styles.zoneValue, { color: statusColor, fontWeight: isImbalanced ? '900' : '700' }]}>
                                                    {actual}%
                                                </Text>
                                            </View>
                                            <Text style={styles.zoneTarget}>목표: {info.targetMin}-{info.targetMax}%</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <Text style={[styles.sectionDivider, { color: colors.primary }]}>점수 구간별 의미</Text>

                            <View style={[styles.guideStatusBox, { backgroundColor: '#4A5D4E10' }]}>
                                <Text style={[styles.guideStatusLabel, { color: '#4A5D4E' }]}>최적 (85% ~)</Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>모든 구역의 에너지가 이상적으로 분배되어 있습니다.</Text>
                            </View>

                            <View style={[styles.guideStatusBox, { backgroundColor: '#7BA67E15', marginTop: 8 }]}>
                                <Text style={[styles.guideStatusLabel, { color: '#7BA67E' }]}>양호 (60% ~ 84%)</Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>전반적으로 안정적인 에너지 흐름을 보입니다.</Text>
                            </View>

                            <View style={[styles.guideStatusBox, { backgroundColor: '#E9A15A15', marginTop: 8 }]}>
                                <Text style={[styles.guideStatusLabel, { color: '#E9A15A' }]}>주의 (40% ~ 59%)</Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>특정 구역에 에너지가 편중되어 조율이 필요합니다.</Text>
                            </View>

                            <View style={[styles.guideStatusBox, { backgroundColor: '#D98B7315', marginTop: 8 }]}>
                                <Text style={[styles.guideStatusLabel, { color: '#D98B73' }]}>위험 (0% ~ 39%)</Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>심각한 불균형으로 정서적 소모가 큰 상태입니다.</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.popupConfirmBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setShowStabilityInfo(false)}
                        >
                            <Text style={styles.popupConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* 🎉 집중 조율 완료 커스텀 팝업 */}
            <Modal
                visible={showCompletePopup}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowCompletePopup(false);
                    setIsTournamentMode(false);
                }}
            >
                <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.floatingPopupCard, { backgroundColor: '#FFFFFF' }]}>
                        <View style={styles.guideHeader}>
                            <View>
                                <Text style={[styles.guideTitle, { color: colors.primary }]}>
                                    {selectedLens === 'Negative' ? "디톡스 완료" : "조율 완료"}
                                </Text>
                                <Text style={[styles.guideSubTitle, { color: selectedLens === 'Negative' ? '#D98B73' : colors.accent }]}>
                                    {selectedLens === 'Negative' ? "Energy Detox" : "Tuning Success"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => {
                                setShowCompletePopup(false);
                                setIsTournamentMode(false);
                            }} style={styles.popupCloseBtn}>
                                <X size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.popupScrollContainer, { alignItems: 'center', paddingVertical: 32 }]}>
                            <View style={{ backgroundColor: (selectedLens === 'Negative' ? '#D98B73' : colors.primary) + '10', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                {selectedLens === 'Negative' ? (
                                    <Shield size={40} color="#D98B73" />
                                ) : (
                                    <Sparkles size={40} color={colors.primary} />
                                )}
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary, marginBottom: 12, textAlign: 'center' }}>
                                {selectedLens === 'Negative'
                                    ? "마음의 방어선이\n설정되었습니다!"
                                    : "무의식의 우선순위가\n정서 온도에 반영되었습니다!"}
                            </Text>
                            <Text style={{ fontSize: 15, color: colors.primary, opacity: 0.6, textAlign: 'center', lineHeight: 22 }}>
                                {selectedLens === 'Negative'
                                    ? "소모적인 관계로부터 당신의 에너지를\n지키기 위한 변화를 오빗 맵에서 확인하세요."
                                    : "오빗 맵에서 변화된 인맥들의\n새로운 위치와 에너지를 확인해보세요."}
                            </Text>

                            <View style={{ marginTop: 32, width: '100%', gap: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary + '05', padding: 16, borderRadius: 16 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A5D4E' }} />
                                    <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '700' }}>
                                        {selectedLens === 'Negative' ? "심리적 에너지 보존 모드 가동" : "관계망 안정성 지수 향상 완료"}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary + '03', padding: 16, borderRadius: 16 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedLens === 'Negative' ? '#D98B73' : '#FFD700' }} />
                                    <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '700' }}>
                                        {selectedLens === 'Negative' ? "지목된 포식자 온도 하향 및 거리두기" : "상위 1~3위 인맥 정서 온도 보너스 반영"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.popupConfirmBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                            onPress={() => {
                                setShowCompletePopup(false);
                                setIsTournamentMode(false);
                            }}
                        >
                            <Text style={styles.popupConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    dashboardContainer: {
        paddingHorizontal: 0,
        paddingBottom: 40,
        paddingTop: 12,
    },
    container: {
        flex: 1,
    },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    iconBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    refreshText: {
        fontSize: 12,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 220, // 하단 플로팅 메뉴 가림 방지를 위해 충분한 여백 확보
    },
    vizSection: {
        paddingHorizontal: 24,
        marginTop: 12,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 4,
    },
    sectionSub: {
        fontSize: 15,
        color: '#737874',
        lineHeight: 22,
    },
    vizCard: {
        width: '100%',
        aspectRatio: 1.1,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
        overflow: 'hidden',
    },
    radarWrapper: {
        width: 260,
        height: 260,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vizOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    stabilityBadgeContainer: {
        alignItems: 'flex-start',
        gap: 6,
    },
    stabilityBadge: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        minWidth: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    stabilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 2,
    },
    stabilityLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.8)',
    },
    stabilityStatusTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    stabilityStatusText: {
        fontSize: 9,
        fontWeight: '900',
        color: 'white',
    },
    stabilityValue: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
    },
    stabilityDescText: {
        fontSize: 10,
        color: '#768278',
        fontWeight: '600',
        maxWidth: 160,
        lineHeight: 14,
    },
    imbalanceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(217, 139, 115, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(217, 139, 115, 0.2)',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D98B73',
    },
    imbalanceText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D98B73',
    },
    nudgeSection: {
        marginTop: 40,
    },
    nudgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    viewAll: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D98B73',
    },
    nudgeScroll: {
        paddingHorizontal: 24,
    },
    nudgeCard: {
        width: width * 0.72,
        height: 380, // 높이 증가 (공간 확보)
        borderRadius: 32,
        padding: 20, // 패딩 약간 축소하여 내부 가용 공간 확보
        marginRight: 16,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
        justifyContent: 'space-between', // 상-중-하 분배
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardMainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // 중앙 정렬
        gap: 16, // 요소 간 간격 일괄 적용 (Avatar - Info - Metric)
    },
    avatarWrapper: {
        width: 80, // 크기 약간 축소 (88 -> 80)
        height: 80,
        borderRadius: 40,
        padding: 3,
        borderWidth: 1.5,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    alertIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    cardInfoGroup: {
        alignItems: 'center',
        gap: 4,
    },
    nudgeTargetName: {
        fontSize: 18,
        fontWeight: '800',
    },
    nudgeIssueText: {
        fontSize: 13,
        opacity: 0.7,
        textAlign: 'center',
        lineHeight: 18,
    },
    metricContainer: {
        width: '100%',
        gap: 6,
    },
    metricLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
    },
    metricValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    metricTrack: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    metricFill: {
        height: '100%',
        borderRadius: 3,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 20,
        gap: 8,
        marginTop: 8, // 버튼과 위 컨텐츠 사이 간격
    },
    actionBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },

    // Focus Insight Section
    focusSection: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    focusHeader: {
        marginBottom: 20,
    },
    focusSub: {
        fontSize: 15,
        color: '#768278',
        lineHeight: 22,
        marginTop: 4,
    },
    anchorCard: {
        borderRadius: 32,
        padding: 24,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
        position: 'relative',
        overflow: 'hidden',
    },
    anchorBadge: {
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    anchorBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#4A5D4E',
        letterSpacing: 1,
    },
    anchorMain: {
        alignItems: 'center',
    },
    anchorAvatarWrapper: {
        marginTop: 10,
        marginBottom: 16,
        position: 'relative',
    },
    anchorAvatarHalo: {
        position: 'absolute',
        inset: -12,
        borderRadius: 100,
    },
    anchorAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'white',
    },
    anchorAvatarDefault: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankFloatingBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    rankFloatingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    anchorName: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
    },
    personaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 16,
    },
    personaLabel: {
        fontSize: 13,
        fontWeight: '800',
    },
    anchorDesc: {
        fontSize: 14,
        color: '#768278',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    impactContainer: {
        width: '100%',
        marginTop: 10,
    },
    impactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    impactLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#768278',
    },
    impactValue: {
        fontSize: 12,
        fontWeight: '900',
    },
    impactBarBg: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 100,
        overflow: 'hidden',
    },
    impactBarFill: {
        height: '100%',
        borderRadius: 100,
    },
    squadList: {
        marginTop: 16,
        gap: 12,
    },
    squadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    squadAvatarWrapper: {
        position: 'relative',
        marginRight: 16,
    },
    squadAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    squadAvatarDefault: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    squadRankBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: 'white',
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    squadRankText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#4A5D4E',
    },
    squadInfo: {
        flex: 1,
    },
    squadNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        paddingRight: 12,
    },
    squadName: {
        fontSize: 17,
        fontWeight: '800',
    },
    squadPersonaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    squadPersonaText: {
        fontSize: 13,
        color: '#768278',
        fontWeight: '500',
    },
    squadMore: {
        padding: 4,
    },

    fabContainer: {
        position: 'absolute',
        bottom: 160, // 하단 플로팅 메뉴 위로 확실하게 이동
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        height: 54,
        paddingHorizontal: 28,
        borderRadius: 27,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    fabText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    // Selection Mode Styles
    selectionView: {
        flex: 1,
    },
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    selectionScroll: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 100,
        gap: 12,
    },
    selectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 24,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    selectionAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    selectionAvatarWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    selectionAvatar: {
        width: '100%',
        height: '100%',
    },
    selectionAvatarDefault: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionInfo: {
        justifyContent: 'center',
    },
    selectionName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    selectionZone: {
        fontSize: 12,
        color: '#768278',
        fontWeight: '500',
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 160, // 하단 플로팅 메뉴 가림 방지를 위해 추가 패딩
        backgroundColor: '#FCF9F2',
        borderTopWidth: 1,
        borderTopColor: 'rgba(74, 93, 78, 0.05)',
    },
    startTuningBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    startTuningText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    emptySelection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#768278',
        fontWeight: '500',
    },
    titleWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    miniSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
    },
    miniSelectText: {
        fontSize: 11,
        fontWeight: '800',
    },
    hide: {
        display: 'none',
    },
    lensTabContainer: {
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    lensScroll: {
        gap: 8,
        paddingBottom: 4,
    },
    lensTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 100,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    activeLensTab: {
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    lensTabText: {
        fontSize: 12,
        fontWeight: '800',
    },
    // Premium Popup Styles (Insight Style)
    popupBackdrop: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    floatingPopupCard: {
        width: width * 0.85,
        borderRadius: 40,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
    },
    guideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    guideTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    guideSubTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    popupCloseBtn: {
        padding: 8,
        marginRight: -8,
        marginTop: -8,
    },
    popupScrollContainer: {
        marginVertical: 10,
    },
    guideInfoText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: 20,
        opacity: 0.7,
    },
    guideStatusBox: {
        padding: 16,
        borderRadius: 16,
    },
    guideStatusLabel: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
    },
    guideStatusDesc: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
    },
    popupConfirmBtn: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    popupConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    // Zone Distribution Chart Styles
    zoneDistributionCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        gap: 12,
    },
    zoneDistributionTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    zoneRow: {
        gap: 6,
    },
    zoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    zoneName: {
        fontSize: 12,
        fontWeight: '800',
    },
    zoneLabel: {
        fontSize: 11,
        color: '#768278',
        fontWeight: '600',
    },
    zoneMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    zoneBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    zoneBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    zoneValue: {
        fontSize: 13,
        fontWeight: '700',
        minWidth: 40,
        textAlign: 'right',
    },
    zoneTarget: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '600',
        marginTop: 2,
    },
    sectionDivider: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 8,
        marginBottom: 12,
        opacity: 0.5,
    },
    viewMoreRankingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 16,
        gap: 8,
    },
    viewMoreRankingText: {
        fontSize: 13,
        fontWeight: '800',
    },
    anchorBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tempBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    tempBadgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    vizCardDetailBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(74, 93, 78, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
});
