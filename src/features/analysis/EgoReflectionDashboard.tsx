import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { AppHeader } from '../../components/AppHeader';
import { ChevronLeft, Calendar, Brain, TrendingUp, ArrowRight, Zap, Heart, Info, X, Star, Trash2, Users, Battery, History, Sliders, AlertCircle, CheckCircle2, Leaf } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode } from '../../types/relationship';

const { width } = Dimensions.get('window');

interface EgoReflectionDashboardProps {
    onBack: () => void;
}

export const EgoReflectionDashboard = ({ onBack }: EgoReflectionDashboardProps) => {
    const colors = useColors();

    // Generate dynamic periods based on current date
    const getDynamicPeriods = () => {
        const now = new Date();
        const periods = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            periods.push(`${d.getFullYear()}년 ${d.getMonth() + 1}월`);
        }
        return periods;
    };

    const availablePeriods = getDynamicPeriods();
    const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0]);
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [activePopup, setActivePopup] = useState<'energy' | 'trend' | 'lens' | null>(null);
    const { relationships } = useRelationshipStore();

    const THEME = {
        primary: colors.primary,
        secondary: '#4A5D4E',
        accent: colors.accent,
        background: '#F9F7F2',
        white: '#FFFFFF',
    };

    const ZONE_INFO = {
        zone1: {
            name: '핵심 그룹',
            targetMin: 45, targetMax: 55, targetIdeal: 50,
            networkSizeLabel: '1~5명', capacity: 5, minCapacity: 1,
            color: '#FFB74D', icon: Heart,
            desc: '무조건적인 수용과 정서적 안전감을 제공하는 관계입니다. 당신의 자아가 완전히 무장해제하고 쉴 수 있는 가장 핵심적인 심리적 지지층으로, 삶의 회복탄력성을 지탱하는 뿌리입니다.',
            over: '과잉 시 특정인에 대한 의존도가 지나치게 높아져 자생적 회복력이 약해질 수 있습니다.',
            under: '부족 시 근원적인 고립감과 정서적 허기를 느끼며 작은 스트레스에도 쉽게 무너질 수 있습니다.'
        },
        zone2: {
            name: '정서적 공유 그룹',
            targetMin: 20, targetMax: 30, targetIdeal: 25,
            networkSizeLabel: '10~15명', capacity: 15, minCapacity: 1,
            color: '#D98B73', icon: Star,
            desc: '가치관과 취향을 공유하며 정기적으로 에너지를 주고받는 관계입니다. 건강한 자아상을 확인하고 외연을 확장할 수 있는 거울과 같은 역할을 수행합니다.',
            over: '과잉 시 타인의 시너지를 추구하다가 자신의 고유한 색깔과 주도성을 잃을 위험이 있습니다.',
            under: '부족 시 정서적 환기구가 부족해져 일상의 활력이 떨어지고 매너리즘에 빠지기 쉽습니다.'
        },
        zone3: {
            name: '기능적 협력 관계',
            targetMin: 10, targetMax: 20, targetIdeal: 15,
            networkSizeLabel: '최대 50명', capacity: 50, minCapacity: 0,
            color: '#4A5D4E', icon: Zap,
            desc: '업무적 목표나 사회적 합의를 위해 자주 교류하지만 정서적 유대는 비교적 낮은 관계입니다. 일상의 규칙성과 생산성을 지탱하는 기능적 지지대입니다.',
            over: '과잉 시 사무적 관계에 치여 정서적 소외감을 느끼고 번아웃(Burn-out)이 빠르게 찾아올 수 있습니다.',
            under: '부족 시 소속감이 약해지고 현실적인 협력 기반이 흔들려 사회적 성과 도출에 어려움을 겪을 수 있습니다.'
        },
        zone4: {
            name: '단순 인지 관계',
            targetMin: 5, targetMax: 15, targetIdeal: 10,
            networkSizeLabel: '최대 100명', capacity: 100, minCapacity: 0,
            color: '#90A4AE', icon: Calendar,
            desc: '이름과 얼굴은 알지만 깊은 교류는 없는, 인지적 한계선 안의 관계입니다. 나를 모르는 사회와 연결해주는 느슨하지만 광범위한 정보의 통로입니다.',
            over: '과잉 시 표면적인 사회활동에 에너지가 분산되어 깊이 있는 성찰 시간이 부족해집니다.',
            under: '적절한 배경 소음의 차단은 자아를 보호하는 강력한 심리적 방어막이 됩니다.'
        },
        zone5: {
            name: '배경 소음(외부 환경)',
            targetMin: 0, targetMax: 5, targetIdeal: 0,
            networkSizeLabel: '최대 150명', capacity: 150, minCapacity: 0,
            color: '#D1D5DB', icon: Trash2,
            desc: '인지 범위 밖의 타인이나 불필요한 디지털 연결들입니다. 의식하지 않아도 내 삶의 배경을 이루며 무의식적인 심리적 로드를 발생시키는 구간입니다.',
            over: '과잉 시 정보 과부하와 불필요한 비교로 인해 자아 집중력이 현저히 저하됩니다.',
            under: '적절한 배경 소음의 차단은 자아를 보호하는 강력한 심리적 방어막이 됩니다.'
        }
    };

    const MOCK_HISTORY: Record<string, any> = {};

    const getDataForPeriod = (period: string) => {
        if (period in MOCK_HISTORY) return { ...MOCK_HISTORY[period], energyDelta: 0 };

        const zoneEnergyMap = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
        const zoneCounts = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
        
        // Dynamic delta calculation
        const parsePeriod = (p: string) => {
            const m = p.match(/(\d+)년 (\d+)월/);
            return m ? { y: parseInt(m[1]), m: parseInt(m[2]) } : { y: 2026, m: 5 };
        };
        const target = parsePeriod(period);
        const prevM = target.m === 1 ? 12 : target.m - 1;
        const prevY = target.m === 1 ? target.y - 1 : target.y;

        let curSum = 0, curCnt = 0, preSum = 0, preCnt = 0;

        (relationships || []).forEach((r: RelationshipNode) => {
            const key = `zone${r.zone}` as keyof typeof zoneEnergyMap;
            if (zoneEnergyMap[key] !== undefined) {
                zoneEnergyMap[key] += (r.temperature || 50);
                zoneCounts[key] += 1;
            }
            (r.interactions || []).forEach(i => {
                const d = new Date(i.createdAt || i.date);
                if (d.getFullYear() === target.y && d.getMonth() + 1 === target.m) {
                    curSum += (i.satisfaction || 50); curCnt++;
                } else if (d.getFullYear() === prevY && d.getMonth() + 1 === prevM) {
                    preSum += (i.satisfaction || 50); preCnt++;
                }
            });
        });

        const energyDelta = preCnt > 0 ? Math.round((curSum / (curCnt || 1)) - (preSum / preCnt)) : (curCnt > 0 ? 5 : 0);

        const energyData = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
        const totalEnergySum = Object.values(zoneEnergyMap).reduce((a, b) => a + b, 0);
        if (totalEnergySum > 0) {
            (Object.keys(energyData) as Array<keyof typeof energyData>).forEach(key => {
                energyData[key] = Math.round((zoneEnergyMap[key] / totalEnergySum) * 100);
            });
        } else {
            energyData.zone1 = 15; energyData.zone2 = 25; energyData.zone3 = 30; energyData.zone4 = 20; energyData.zone5 = 10;
        }

        const sortedByTemp = [...(relationships || [])].sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
        const recovery = sortedByTemp.length > 0 ? sortedByTemp[0] : null;
        const drain = sortedByTemp.length > 0 ? sortedByTemp[sortedByTemp.length - 1] : null;

        const getInteractionWeight = (str: string = '') => {
            if (!str) return 0;
            if (str.includes('방금') || str.includes('분 전')) return 100;
            if (str.includes('오늘') || str.includes('시간 전')) return 80;
            if (str.includes('어제')) return 60;
            return 10;
        };
        const frequencySorted = [...(relationships || [])].sort((a, b) => getInteractionWeight(b.lastInteraction) - getInteractionWeight(a.lastInteraction));
        const frequency = frequencySorted.length > 0 ? frequencySorted[0] : null;

        let trendPoints = [80, 70, 90, 60, 40, 50, 30, 10, 20];
        return { energyData, zoneCounts, lensData: { recovery, drain, frequency }, trendPoints, energyDelta };
    };

    const { energyData, zoneCounts, lensData, trendPoints, energyDelta } = getDataForPeriod(selectedPeriod);
    const [selectedZone, setSelectedZone] = useState<keyof typeof energyData>('zone1');

    const METRIC_GUIDE = {
        energy: {
            title: '관계 에너지 분포',
            sub: '나의 심리적 자격 배치 (Mental Real Estate)',
            info: '단순한 인원수 비중이 아닙니다. 당신의 인생이라는 한정된 자원(시간, 감정, 생각)을 현재 어느 영역에 얼마나 "투자"하고 있는지를 보여주는 정서적 점유율입니다.',
            details: [
                { label: '에너지 비중 (%)', desc: '해당 구간에 투여된 당신의 심리적 시간과 감정의 밀도를 합산한 결과입니다.' },
                { label: '산출 방식 (Logic)', desc: '상호작용의 빈도(Frequency) + 교감의 깊이(Intensity) + 상호작용 후 남는 정서적 잔상(Residue)을 AI가 종합 분석합니다.' },
                { label: '건전성 지표', desc: '특정 구간이 권장 범위를 벗어나면, 당신의 자아가 외부 관계에 의해 "과부하"되거나 "영양실조" 상태임을 의미합니다.' }
            ]
        },
        trend: {
            title: '정서 에너지 흐름도',
            sub: '마음의 배터리 리포트',
            info: '최근 30일간의 인맥 교류(만족도)와 자기 돌봄(회복도)을 종합 분석한 정서 에너지의 변화 추이입니다.',
            details: [
                { label: '상승 곡선', desc: '자아 회복력(Resilience)이 높아진 상태이며, 긍정적인 정서가 축적되고 있음을 의미합니다.' },
                { label: '곡선의 굴곡', desc: '굴곡이 심할수록 외부 자극에 민감한 상태임을, 완만할수록 정서가 단단하고 평온한 상태임을 뜻합니다.' }
            ]
        },
        lens: {
            title: '다각도 관계 렌즈 분석',
            sub: '인맥 궤도의 다면적 통찰',
            info: '단순한 선호도를 넘어, 관계가 당신의 심리에 미치는 실제적인 영향(회복/소모/점유)을 분석합니다.',
            details: [
                { label: '나의 비타민', desc: '함께 있으면 저절로 기운이 나는 소중한 친구들이에요.' },
                { label: '주의가 필요해', desc: '만나고 나면 기운이 조금 빠질 수 있는 친구들이에요.' },
                { label: '자주 만난 사이', desc: '내 하루를 가장 많이 함께하는 단짝들이에요.' }
            ]
        }
    };

    const handlePeriodSelect = (period: string) => {
        setSelectedPeriod(period);
        setIsPeriodDropdownOpen(false);
    };

    const renderHeader = () => (
        <AppHeader
            title="균형 상세 리포트"
            leftAction={
                <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                    <ChevronLeft size={24} color={colors.primary} />
                </TouchableOpacity>
            }
        />
    );

    const renderLegend = () => (
        <View style={styles.legendContainer}>
            {(Object.keys(energyData) as Array<keyof typeof energyData>).map((zoneKey) => {
                const isSelected = selectedZone === zoneKey;
                return (
                    <TouchableOpacity
                        key={zoneKey}
                        onPress={() => setSelectedZone(zoneKey)}
                        style={[
                            styles.legendItem,
                            isSelected && { backgroundColor: ZONE_INFO[zoneKey].color + '15' }
                        ]}
                    >
                        <View style={[styles.legendDot, { backgroundColor: ZONE_INFO[zoneKey].color }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.legendText, { color: isSelected ? ZONE_INFO[zoneKey].color : '#737874', fontWeight: isSelected ? '800' : '500' }]}>
                                Zone {zoneKey.slice(-1)}
                            </Text>
                        </View>
                        <Text style={[styles.legendCount, { color: isSelected ? ZONE_INFO[zoneKey].color : '#9E9E9E' }]}>{zoneCounts[zoneKey]}명</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderEnergyChart = () => {
        const radius = 80;
        const innerGuideRadius = 60;
        const circumference = 2 * Math.PI * radius;
        const guideCircumference = 2 * Math.PI * innerGuideRadius;
        const zoneKeys: Array<keyof typeof energyData> = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'];

        return (
            <View style={styles.chartSection}>
                <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>관계 에너지 분포</Text>
                        <TouchableOpacity onPress={() => setActivePopup('energy')}>
                            <Info size={16} color={colors.primary} opacity={0.4} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.chartContainer}>
                    <View style={styles.chartWrapper}>
                        <Svg width={radius * 2.5} height={radius * 2.5} viewBox={`0 0 ${radius * 2.5} ${radius * 2.5}`}>
                            <Defs>
                                {zoneKeys.map((key) => (
                                    <LinearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="1" y2="1">
                                        <Stop offset="0%" stopColor={ZONE_INFO[key].color} stopOpacity="1" />
                                        <Stop offset="100%" stopColor={ZONE_INFO[key].color} stopOpacity="0.7" />
                                    </LinearGradient>
                                ))}
                            </Defs>
                            <Circle cx={radius * 1.25} cy={radius * 1.25} r={radius} fill="none" stroke="#EBE5D9" strokeWidth="12" strokeOpacity="0.3" />
                            {(() => {
                                let cumulativeActual = 0;
                                let cumulativeTarget = 0;
                                return zoneKeys.map((key) => {
                                    const value = energyData[key];
                                    const target = ZONE_INFO[key].targetIdeal;
                                    const dashActual = [(value / 100) * circumference, circumference].join(' ');
                                    const offsetActual = - (cumulativeActual / 100) * circumference;
                                    const dashTarget = [(target / 100) * guideCircumference, guideCircumference].join(' ');
                                    const offsetTarget = - (cumulativeTarget / 100) * guideCircumference;
                                    cumulativeActual += value;
                                    cumulativeTarget += target;
                                    return (
                                        <React.Fragment key={key}>
                                            <Circle cx={radius * 1.25} cy={radius * 1.25} r={radius} fill="none" stroke={`url(#grad-${key})`} strokeWidth="12" strokeDasharray={dashActual} strokeDashoffset={offsetActual} strokeLinecap="round" transform={`rotate(-90 ${radius * 1.25} ${radius * 1.25})`} />
                                            <Circle cx={radius * 1.25} cy={radius * 1.25} r={innerGuideRadius} fill="none" stroke={ZONE_INFO[key].color} strokeWidth="2" strokeDasharray={dashTarget} strokeDashoffset={offsetTarget} strokeOpacity="0.3" transform={`rotate(-90 ${radius * 1.25} ${radius * 1.25})`} />
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </Svg>
                        <View style={styles.chartCenter}>
                            <Text style={[styles.chartPercentage, { color: colors.primary }]}>{energyData[selectedZone]}%</Text>
                            {(() => {
                                const count = zoneCounts[selectedZone];
                                const { capacity, minCapacity } = ZONE_INFO[selectedZone];
                                let label = '건강'; let statusColor = colors.accent;
                                if (count < minCapacity) { label = '부족'; statusColor = '#90A4AE'; }
                                else if (count > capacity) { label = '초과'; statusColor = '#D98B73'; }
                                return <Text style={[styles.chartStatus, { color: statusColor }]}>{label}</Text>;
                            })()}
                        </View>
                    </View>
                    {renderLegend()}
                </View>
            </View>
        );
    };

    const renderTrendSection = () => {
        const MAX_POINTS = 9;
        const CHART_WIDTH = width - 80;
        const isLatest = selectedPeriod === availablePeriods[0];
        const displayPoints = isLatest ? trendPoints.slice(0, 5) : trendPoints;

        if (!displayPoints || displayPoints.length === 0) return null;

        const pathD = `M 0 ${displayPoints[0]} ${displayPoints.map((p, i) => `L ${(i * CHART_WIDTH) / (MAX_POINTS - 1)} ${p}`).join(' ')}`;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>정서 에너지 흐름도</Text>
                        <TouchableOpacity onPress={() => setActivePopup('trend')}>
                            <Info size={16} color={colors.primary} opacity={0.4} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.trendStatus}>
                        <TrendingUp size={14} color={energyDelta >= 0 ? colors.accent : '#D98B73'} style={{ transform: [{ rotate: energyDelta >= 0 ? '0deg' : '180deg' }] }} />
                        <Text style={[styles.trendStatusText, { color: energyDelta >= 0 ? colors.accent : '#D98B73' }]}>
                            전월 대비 {energyDelta >= 0 ? '+' : ''}{energyDelta}%
                        </Text>
                    </View>
                </View>

                <View style={[styles.trendChartCard, { backgroundColor: colors.white }]}>
                    <Svg width={CHART_WIDTH} height={120}>
                        <Defs>
                            <LinearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.2" />
                                <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        {[20, 60, 100].map((y, i) => (
                            <Line key={`grid-${i}`} x1="0" y1={y} x2={CHART_WIDTH} y2={y} stroke={colors.primary} strokeWidth="1" strokeOpacity="0.05" strokeDasharray="4 4" />
                        ))}
                        <Path d={pathD} fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
                        <Path d={`${pathD} L ${((displayPoints.length - 1) * CHART_WIDTH) / (MAX_POINTS - 1)} 120 L 0 120 Z`} fill="url(#trendGrad)" />
                        {displayPoints.map((p, i) => {
                            const cx = (i * CHART_WIDTH) / (MAX_POINTS - 1);
                            const isLast = i === displayPoints.length - 1;
                            const isCollecting = isLatest && isLast;
                            return (
                                <React.Fragment key={i}>
                                    <Circle cx={cx} cy={p} r={isCollecting ? 5 : 4} fill={colors.white} stroke={colors.accent} strokeWidth={isCollecting ? 3 : 2} />
                                    <SvgText x={cx} y={p - 12} fill={colors.accent} fontSize="11" fontWeight={isCollecting ? "900" : "700"} textAnchor="middle">{120 - p}</SvgText>
                                    {isCollecting && <SvgText x={cx} y={p + 20} fill={colors.primary} fontSize="10" fontWeight="600" textAnchor="middle" opacity="0.6">Today</SvgText>}
                                </React.Fragment>
                            );
                        })}
                    </Svg>
                    <View style={styles.trendXLabels}>
                        <Text style={styles.trendXText}>1일</Text>
                        <Text style={styles.trendXText}>15일</Text>
                        <Text style={styles.trendXText}>30일</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEnergyHealthList = () => (
        <View style={styles.section}>
            <View style={[styles.zoneDetailCard, { backgroundColor: colors.white }]}>
                <View style={styles.zoneDetailTitleRow}>
                    {React.createElement(ZONE_INFO[selectedZone].icon, { size: 18, color: ZONE_INFO[selectedZone].color })}
                    <Text style={[styles.zoneDetailTitle, { color: colors.primary }]}>{ZONE_INFO[selectedZone].name}</Text>
                </View>
                <Text style={[styles.zoneDetailBody, { color: colors.primary, opacity: 0.7 }]}>
                    {ZONE_INFO[selectedZone].desc}
                </Text>
                <View style={[styles.networkSizeBox, { backgroundColor: ZONE_INFO[selectedZone].color + '10' }]}>
                    <Users size={14} color={ZONE_INFO[selectedZone].color} />
                    <Text style={[styles.networkSizeText, { color: ZONE_INFO[selectedZone].color }]}>권장 관계 밀도: {ZONE_INFO[selectedZone].networkSizeLabel}</Text>
                </View>
            </View>
        </View>
    );

    const renderLensSection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>다각도 관계 분석</Text>
                    <TouchableOpacity onPress={() => setActivePopup('lens')}>
                        <Info size={16} color={colors.primary} opacity={0.4} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.lensGrid}>
                <View style={[styles.lensCard, { backgroundColor: '#F0F4F0' }]}>
                    <Battery size={16} color="#D4AF37" />
                    <Text style={styles.lensLabel}>나의 비타민</Text>
                    <Text style={styles.lensValue}>{lensData.recovery?.name || '공석'}</Text>
                </View>
                <View style={[styles.lensCard, { backgroundColor: '#FDF7F5' }]}>
                    <Zap size={16} color="#D98B73" />
                    <Text style={styles.lensLabel}>주의가 필요해</Text>
                    <Text style={styles.lensValue}>{lensData.drain?.name || '공석'}</Text>
                </View>
                <View style={[styles.lensCard, { backgroundColor: '#F5F7F8' }]}>
                    <History size={16} color={colors.primary} />
                    <Text style={styles.lensLabel}>자주 만난 사이</Text>
                    <Text style={styles.lensValue}>{lensData.frequency?.name || '기록부족'}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <HubLayout header={renderHeader()} scrollable>
            <View style={styles.container}>
                <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, { backgroundColor: colors.primary }]} onPress={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}>
                        <Text style={styles.filterChipText}>{selectedPeriod}{selectedPeriod === availablePeriods[0] && " (수집 중)"}</Text>
                        <ChevronLeft size={16} color={colors.white} style={{ transform: [{ rotate: isPeriodDropdownOpen ? '90deg' : '-90deg' }] }} />
                    </TouchableOpacity>
                    {isPeriodDropdownOpen && (
                        <View style={styles.dropdown}>
                            {availablePeriods.map((period, idx) => (
                                <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => handlePeriodSelect(period)}>
                                    <Text style={styles.dropdownText}>{period}</Text>
                                    {idx === 0 && <Text style={styles.collectingBadge}>🔥 수집 중</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                {renderTrendSection()}
                {renderEnergyChart()}
                {renderEnergyHealthList()}
                {renderLensSection()}
                <View style={{ height: 100 }} />
            </View>

            {activePopup && (
                <View style={styles.popupBackdrop}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActivePopup(null)} />
                    <View style={[styles.floatingPopupCard, { backgroundColor: colors.white }]}>
                        <View style={styles.guideHeader}>
                            <Text style={[styles.guideTitle, { color: colors.primary }]}>{METRIC_GUIDE[activePopup].title}</Text>
                            <TouchableOpacity onPress={() => setActivePopup(null)}><X size={20} color={colors.primary} /></TouchableOpacity>
                        </View>
                        <Text style={styles.guideInfoText}>{METRIC_GUIDE[activePopup].info}</Text>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setActivePopup(null)}>
                            <Text style={{ color: 'white', fontWeight: '700' }}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    iconBtn: { padding: 4 },
    filterRow: { marginBottom: 20, zIndex: 1000 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
    filterChipText: { color: 'white', fontWeight: '700', marginRight: 4 },
    dropdown: { position: 'absolute', top: 45, left: 0, backgroundColor: 'white', borderRadius: 12, width: 200, elevation: 5, shadowOpacity: 0.1, borderWidth: 1, borderColor: '#EEE', padding: 4 },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
    dropdownText: { fontSize: 14, fontWeight: '500' },
    collectingBadge: { fontSize: 10, color: '#D98B73', fontWeight: '700' },
    section: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    trendStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trendStatusText: { fontSize: 12, fontWeight: '700' },
    trendChartCard: { padding: 20, borderRadius: 20, elevation: 2, shadowOpacity: 0.05 },
    trendXLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    trendXText: { fontSize: 10, color: '#999' },
    chartSection: { marginBottom: 30 },
    chartContainer: { flexDirection: 'row', alignItems: 'center' },
    chartWrapper: { position: 'relative', width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
    chartCenter: { position: 'absolute', alignItems: 'center' },
    chartPercentage: { fontSize: 24, fontWeight: '900' },
    chartStatus: { fontSize: 12, fontWeight: '700' },
    legendContainer: { flex: 1, marginLeft: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 8, borderRadius: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    legendText: { fontSize: 12 },
    legendCount: { fontSize: 11, marginLeft: 'auto' },
    zoneDetailCard: { padding: 20, borderRadius: 20, elevation: 2, shadowOpacity: 0.05 },
    zoneDetailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    zoneDetailTitle: { fontSize: 16, fontWeight: '700' },
    zoneDetailBody: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
    networkSizeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10 },
    networkSizeText: { fontSize: 12, fontWeight: '600' },
    lensGrid: { flexDirection: 'row', gap: 10 },
    lensCard: { flex: 1, padding: 15, borderRadius: 15, alignItems: 'center' },
    lensLabel: { fontSize: 11, color: '#777', marginTop: 8 },
    lensValue: { fontSize: 14, fontWeight: '800', marginTop: 4 },
    popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    floatingPopupCard: { width: width - 60, padding: 24, borderRadius: 24 },
    guideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    guideTitle: { fontSize: 18, fontWeight: '800' },
    guideInfoText: { fontSize: 14, lineHeight: 22, opacity: 0.7, marginBottom: 24 },
    closeBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' }
});
