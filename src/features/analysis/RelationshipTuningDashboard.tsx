import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ChevronLeft, RefreshCw, History, LayoutGrid, Calendar, UserPlus, Info, Scale, Send, Sliders, Anchor, Sun, Brain, Zap, Heart, Infinity, MoreHorizontal, Check, X, Filter, Star } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode } from '../../types/relationship';
import { FocusTournament } from './FocusTournament';

const { width } = Dimensions.get('window');

// Define ZONE_INFO outside the component if it's a constant
const ZONE_INFO = {
    zone1: { targetMin: 15, targetMax: 25, targetIdeal: 20 }, // 안전기지
    zone2: { targetMin: 15, targetMax: 25, targetIdeal: 20 }, // 성장
    zone3: { targetMin: 20, targetMax: 30, targetIdeal: 25 }, // 확장
    zone4: { targetMin: 10, targetMax: 20, targetIdeal: 15 }, // 탐색
    zone5: { targetMin: 10, targetMax: 20, targetIdeal: 15 }, // 휴식
};

interface RelationshipTuningDashboardProps {
    onBack: () => void;
    onSelectNode: (id: string) => void;
}

export const RelationshipTuningDashboard: React.FC<RelationshipTuningDashboardProps> = ({ onBack, onSelectNode }) => {
    const colors = useColors();
    const { relationships } = useRelationshipStore();

    // 🕹️ Selection State for Manual Tuning
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterZone, setFilterZone] = useState<number | null>(null);
    const [isTournamentMode, setIsTournamentMode] = useState(false);
    const [tournamentParticipants, setTournamentParticipants] = useState<RelationshipNode[]>([]);
    const [selectedLens, setSelectedLens] = useState<'None' | 'Positive' | 'Negative' | 'Frequency'>('None');
    const [showStabilityInfo, setShowStabilityInfo] = useState(false);

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

        const participants = sortedData.slice(0, 6); // Contextual Top 6
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
            1: '안전기지',
            2: '심리적 우군',
            3: '전략적 동행',
            4: '사회적 지인',
            5: '배경 소음'
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
    const getDynamicNudges = () => {
        const items = [];

        // A. 소홀해진 안전기지 (Zone 1 중 마지막 교감이 오래된 사람 우선 검색)
        const neglected = relationships.find((r: RelationshipNode) =>
            r.zone === 1 && (r.lastInteraction?.includes('달') || r.lastInteraction?.includes('주') || r.lastInteraction === '확인 필요')
        ) || relationships.find((r: RelationshipNode) => r.zone === 1);

        if (neglected) {
            items.push({
                id: neglected.id,
                type: '우선 추천',
                category: '소홀해진 관계',
                name: neglected.name,
                lastContact: neglected.lastInteraction || '교감 필요',
                image: neglected.image,
                actionIcon: Send,
                actionLabel: '연락하기',
                color: '#D98B73',
            });
        }

        // B. 에너지 효율 (보람이 적고 노력이 큰 관계 검색)
        const lowRoi = relationships.find((r: RelationshipNode) =>
            (r.metrics.communication > 70 && r.metrics.satisfaction < 50) || r.id === '5'
        );

        if (lowRoi) {
            items.push({
                id: lowRoi.id,
                type: '균형 점검',
                category: '에너지 효율',
                name: lowRoi.name,
                lastContact: '"노력은 큰데 보람이 적어요"',
                actionIcon: Sliders,
                actionLabel: '조율하기',
                color: '#4A5D4E',
                isChart: true,
                chartData: {
                    input: lowRoi.metrics.communication || 85,
                    output: lowRoi.metrics.satisfaction || 25
                }
            });
        }

        // C. 새로운 인연 (최근 추가된 사람)
        const recent = relationships.find((r: RelationshipNode) =>
            r.lastInteraction?.includes('방금') || r.lastInteraction?.includes('오늘') || r.id === '16'
        ) || relationships[relationships.length - 1];

        if (recent && recent.id !== neglected?.id && recent.id !== lowRoi?.id) {
            items.push({
                id: recent.id,
                type: '환영하기',
                category: '새로운 인연',
                name: recent.name,
                lastContact: recent.role || '새로운 연결',
                image: recent.image,
                actionIcon: Calendar,
                actionLabel: '약속잡기',
                color: '#FFB74D',
            });
        }

        // Fallback if no dynamic nudges are generated
        if (items.length === 0 && relationships.length > 0) {
            // Example fallback: just pick the first few relationships
            relationships.slice(0, 3).forEach((r: RelationshipNode, index: number) => {
                items.push({
                    id: r.id,
                    type: index === 0 ? '긴급' : index === 1 ? '보기' : '신규',
                    category: r.role || '관계',
                    name: r.name,
                    lastContact: r.lastInteraction || '정보 없음',
                    image: r.image,
                    actionIcon: index === 0 ? Send : index === 1 ? Sliders : Calendar,
                    actionLabel: index === 0 ? '연락하기' : index === 1 ? '조율하기' : '약속잡기',
                    color: index === 0 ? '#D98B73' : index === 1 ? '#4A5D4E' : '#FFB74D',
                    isChart: index === 1,
                    chartData: index === 1 ? { input: 70, output: 40 } : undefined,
                });
            });
        }

        return items;
    };

    const dynamicNudges = getDynamicNudges();

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <TouchableOpacity onPress={isSelectionMode ? () => setIsSelectionMode(false) : onBack} style={styles.iconBtn}>
                    {isSelectionMode ? <X size={28} color={colors.primary} /> : <ChevronLeft size={28} color={colors.primary} />}
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>
                    {isSelectionMode ? '조율 대상 선택' : '튜닝 센터'}
                </Text>
                {isSelectionMode ? (
                    <TouchableOpacity
                        onPress={() => setSelectedIds(selectedIds.length === filteredRelationships.length ? [] : filteredRelationships.map(r => r.id))}
                        style={styles.refreshBtn}
                    >
                        <Text style={[styles.refreshText, { color: colors.primary }]}>
                            {selectedIds.length === filteredRelationships.length ? '전체 해제' : '전체 선택'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.refreshBtn}>
                        <RefreshCw size={18} color={colors.primary} />
                        <Text style={[styles.refreshText, { color: colors.primary }]}>새로고침</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!isSelectionMode && (
                <View style={styles.lensTabContainer}>
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
                                    { backgroundColor: selectedLens === lens.id ? colors.primary : colors.white },
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
            )}
        </View>
    );

    const filteredRelationships = filterZone
        ? relationships.filter((r: RelationshipNode) => r.zone === filterZone)
        : relationships;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const renderSelectionList = () => (
        <View style={styles.selectionView}>
            <View style={styles.filterBar}>
                {[1, 2, 3, 4, 5].map(z => (
                    <TouchableOpacity
                        key={z}
                        onPress={() => setFilterZone(filterZone === z ? null : z)}
                        style={[
                            styles.filterChip,
                            { backgroundColor: filterZone === z ? colors.primary : colors.white },
                            filterZone === z && { borderColor: colors.primary }
                        ]}
                    >
                        <Text style={[styles.filterChipText, { color: filterZone === z ? 'white' : colors.primary }]}>Zone {z}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.selectionScroll}>
                {filteredRelationships.map((r: RelationshipNode) => (
                    <TouchableOpacity
                        key={r.id}
                        style={[styles.selectionItem, { backgroundColor: colors.white }]}
                        onPress={() => toggleSelect(r.id)}
                    >
                        <View style={styles.selectionAvatarRow}>
                            <View style={styles.selectionAvatarWrapper}>
                                {r.image ? (
                                    <Image source={{ uri: r.image }} style={styles.selectionAvatar as any} />
                                ) : (
                                    <View style={[styles.selectionAvatarDefault, { backgroundColor: colors.primary + '10' }]}>
                                        <LayoutGrid size={24} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                            <View style={styles.selectionInfo}>
                                <Text style={[styles.selectionName, { color: colors.primary }]}>{r.name}</Text>
                                <Text style={styles.selectionZone}>Zone {r.zone} • {r.role || '관계'}</Text>
                            </View>
                        </View>
                        <View style={[
                            styles.checkBox,
                            { borderColor: colors.primary + '30', backgroundColor: selectedIds.includes(r.id) ? colors.primary : 'transparent' }
                        ]}>
                            {selectedIds.includes(r.id) && <Check size={14} color="white" />}
                        </View>
                    </TouchableOpacity>
                ))}

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
        </View>
    );

    const renderOrbitVisualization = () => (
        <View style={styles.vizSection}>
            <View style={styles.sectionHeader}>
                <View style={styles.titleWithIcon}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>균형 요약</Text>
                    <TouchableOpacity onPress={() => setIsSelectionMode(true)} style={isSelectionMode ? styles.hide : styles.miniSelectBtn}>
                        <Filter size={14} color={colors.primary} />
                        <Text style={[styles.miniSelectText, { color: colors.primary }]}>직접 선택</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.sectionSub}>
                    {isSaturated ? '현재 뇌 내 구역이 포화 상태입니다.' : '뇌 내 구역이 비교적 쾌적한 상태입니다.'}{'\n'}
                    <Text style={{ color: imbalancedCount > 0 ? '#D98B73' : colors.primary, fontWeight: '800' }}>
                        {imbalancedCount > 0 ? `${imbalancedCount}개의 관계를 재조정해야 합니다.` : '모든 관계가 평온하게 유지되고 있습니다.'}
                    </Text>
                </Text>
            </View>

            <View style={[styles.vizCard, { backgroundColor: colors.white }]}>
                <View style={styles.radarWrapper}>
                    <Svg height="260" width="260" viewBox="0 0 300 300">
                        {/* Orbit Rings - Touchable Zones */}
                        <Circle
                            cx="150" cy="150" r="110" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.1" fill="transparent"
                            onPress={() => { setIsSelectionMode(true); setFilterZone(3); }}
                        />
                        <Circle
                            cx="150" cy="150" r="80" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.15" fill="transparent"
                            onPress={() => { setIsSelectionMode(true); setFilterZone(2); }}
                        />
                        <Circle
                            cx="150" cy="150" r="50" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.2" fill="transparent"
                            onPress={() => { setIsSelectionMode(true); setFilterZone(1); }}
                        />

                        {/* Center Core */}
                        <Circle cx="150" cy="150" r="18" fill={colors.primary} />

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
                    </Svg>
                </View>

                <View style={[styles.vizOverlay, { bottom: 12 }]}>
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
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.typeText, { color: item.color }]}>{item.type}</Text>
                </View>
            </View>

            <View style={styles.cardMain}>
                {item.image ? (
                    <View style={[styles.avatarWrapper, { borderColor: item.color + '30' }]}>
                        <Image source={{ uri: item.image }} style={styles.avatar} />
                        {(item.type === '긴급' || item.type === 'URGENT') && (
                            <View style={[styles.alertIcon, { backgroundColor: item.color }]}>
                                <Info size={12} color="white" />
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.iconAvatar, { backgroundColor: item.color + '15' }]}>
                        <LayoutGrid size={32} color={item.color} />
                    </View>
                )}

                <Text style={[styles.cardName, { color: colors.primary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardCategory}>{item.category}</Text>
            </View>

            {item.isChart ? (
                <View style={styles.miniChartContainer}>
                    <View style={styles.miniChart}>
                        <View style={styles.chartCol}>
                            <View style={[styles.chartBar, { height: `${item.chartData?.input || 80}%`, backgroundColor: '#D98B73' }]} />
                            <Text style={styles.chartLabel}>노력</Text>
                        </View>
                        <View style={styles.chartCol}>
                            <View style={[styles.chartBar, { height: `${item.chartData?.output || 30}%`, backgroundColor: colors.primary + '40' }]} />
                            <Text style={styles.chartLabel}>보람</Text>
                        </View>
                    </View>
                    <Text style={styles.chartQuote}>{item.lastContact}</Text>
                </View>
            ) : (
                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <History size={14} color="#737874" />
                        <Text style={styles.infoLabel}>{item.type === '신규' ? '첫 만남' : '마지막 교감'}</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.primary }]}>{item.lastContact}</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: item.isChart ? 'transparent' : colors.primary, borderWidth: item.isChart ? 1 : 0, borderColor: colors.primary + '30' }]}
                onPress={() => onSelectNode(item.id)}
                activeOpacity={0.7}
            >
                <item.actionIcon size={18} color={item.isChart ? colors.primary : colors.white} />
                <Text style={[styles.actionBtnText, { color: item.isChart ? colors.primary : colors.white }]}>{item.actionLabel}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFocusInsight = () => {
        // 상위 5명 관계 추출
        const topRelationships = [...relationships]
            .sort((a, b) => (b.temperature || 0) - (a.temperature || 0))
            .slice(0, 5);

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

                    const topFive = sortedData.slice(0, 5);
                    const anchor = topFive[0];
                    if (!anchor) return null;

                    return (
                        <>
                            {/* Rank 1 Card */}
                            <TouchableOpacity
                                style={[styles.anchorCard, { backgroundColor: colors.white }]}
                                onPress={() => onSelectNode(anchor.id)}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.anchorBadge, { backgroundColor: themeColor + '10' }]}>
                                    <Text style={[styles.anchorBadgeText, { color: themeColor }]}>NO. 1</Text>
                                </View>
                                <View style={styles.anchorMain}>
                                    <View style={styles.anchorAvatarWrapper}>
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
                                        {selectedLens === 'Negative' ? `심리적 소모도가 가장 높은 관계입니다.` : `현재 당신의 인맥 궤도에서 가장 강력한 영향력을 미치는 존재입니다.`}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Ranking list (Rank 2-5) */}
                            <View style={styles.squadList}>
                                {topFive.slice(1).map((r, idx) => {
                                    const rank = idx + 2;
                                    return (
                                        <TouchableOpacity
                                            key={r.id}
                                            style={[styles.squadItem, { backgroundColor: colors.white }]}
                                            onPress={() => onSelectNode(r.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.squadAvatarWrapper}>
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
                                                    <Text style={{ fontSize: 12, color: themeColor, fontWeight: '800' }}>{selectedLens === 'Frequency' ? r.lastInteraction : `${r.temperature}°C`}</Text>
                                                </View>
                                                <View style={styles.squadPersonaRow}>
                                                    <Text style={styles.squadPersonaText}>{r.role || '관계 인지됨'}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    );
                })()}

            </View>
        );
    };

    if (isTournamentMode) {
        return (
            <FocusTournament
                participants={tournamentParticipants}
                onComplete={(winners) => {
                    console.log('Tournament complete, winners:', winners);
                    setIsTournamentMode(false);
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                }}
                onClose={() => setIsTournamentMode(false)}
                entryLens={selectedLens}
            />
        );
    }

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: '#FCF9F2', flex: 1 }]}>
            {renderHeader()}

            {isSelectionMode ? (
                renderSelectionList()
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {renderOrbitVisualization()}

                    {renderFocusInsight()}

                    <View style={styles.nudgeSection}>
                        <View style={styles.nudgeHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>우선 관리</Text>
                            <TouchableOpacity>
                                <Text style={styles.viewAll}>전체보기</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={width * 0.7 + 16}
                            decelerationRate="fast"
                            contentContainerStyle={styles.nudgeScroll}
                        >
                            {dynamicNudges.map(renderNudgeCard)}
                            <View style={{ width: 24 }} />
                        </ScrollView>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>
            )}

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

            {/* Premium Guide Popup (Insight Style) */}
            {showStabilityInfo && (
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

                            {/* Zone별 에너지 분포 차트 */}
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

                            {/* 점수 구간 설명 */}
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
            )}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
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
        paddingBottom: 120,
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
        width: width * 0.7,
        height: 340,
        borderRadius: 32,
        padding: 24,
        marginRight: 16,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
        justifyContent: 'space-between',
    },
    cardHeader: {
        alignItems: 'flex-end',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardMain: {
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        padding: 3,
        borderWidth: 1,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    alertIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardName: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 16,
    },
    cardCategory: {
        fontSize: 13,
        color: '#737874',
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#FCF9F2',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#737874',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    miniChartContainer: {
        alignItems: 'center',
    },
    miniChart: {
        flexDirection: 'row',
        height: 80,
        width: '100%',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 40,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    chartCol: {
        width: 32,
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    chartBar: {
        width: '100%',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
    },
    chartLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#737874',
        marginTop: 6,
    },
    chartQuote: {
        fontSize: 11,
        color: '#737874',
        fontStyle: 'italic',
        marginTop: 8,
        fontWeight: '500',
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
        position: 'absolute',
        top: 20,
        left: 20,
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
    actionBtn: {
        height: 44,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 34,
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
        paddingBottom: 40,
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
});
