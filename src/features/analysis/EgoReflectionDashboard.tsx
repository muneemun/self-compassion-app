import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Line, Rect } from 'react-native-svg';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { ChevronLeft, Calendar, Brain, TrendingUp, ArrowRight, Zap, Heart, Info, X, Star, Trash2, Users, Battery, History, Sliders, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode } from '../../types/relationship';


const { width } = Dimensions.get('window');

interface EgoReflectionDashboardProps {
    onBack: () => void;
}

export const EgoReflectionDashboard = ({ onBack }: EgoReflectionDashboardProps) => {
    const colors = useColors();
    const [selectedPeriod, setSelectedPeriod] = useState('2026년 10월');
    const [activePopup, setActivePopup] = useState<'energy' | 'trend' | 'lens' | null>(null);
    const { relationships } = useRelationshipStore();

    // 🔍 1. Zone Information Mapping
    const ZONE_INFO = {
        zone1: {
            name: '안전 기지 (Safety Base)',
            targetMin: 45, targetMax: 55, targetIdeal: 50,
            networkSizeLabel: '1~5명',
            color: colors.accent, icon: Heart,
            desc: '무조건적인 수용과 정서적 안전감을 제공하는 관계입니다. 당신의 자아가 완전히 무장해제하고 쉴 수 있는 가장 핵심적인 심리적 지지층으로, 삶의 회복탄력성을 지탱하는 뿌리입니다.',
            over: '과잉 시 특정인에 대한 의존도가 지나치게 높아져 자생적 회복력이 약해질 수 있습니다.',
            under: '부족 시 근원적인 고립감과 정서적 허기를 느끼며 작은 스트레스에도 쉽게 무너질 수 있습니다.'
        },
        zone2: {
            name: '심리적 우군 (Allies)',
            targetMin: 20, targetMax: 30, targetIdeal: 25,
            networkSizeLabel: '10~15명',
            color: '#FFB74D', icon: Star,
            desc: '가치관과 취향을 공유하며 정기적으로 에너지를 주고받는 관계입니다. 건강한 자아상을 확인하고 외연을 확장할 수 있는 거울과 같은 역할을 수행합니다.',
            over: '과잉 시 타인의 시너지를 추구하다가 자신의 고유한 색깔과 주도성을 잃을 위험이 있습니다.',
            under: '부족 시 정서적 환기구가 부족해져 일상의 활력이 떨어지고 매너리즘에 빠지기 쉽습니다.'
        },
        zone3: {
            name: '전략적 동행 (Strategic)',
            targetMin: 10, targetMax: 20, targetIdeal: 15,
            networkSizeLabel: '유동적',
            color: colors.primary, icon: Zap,
            desc: '업무적 목표나 사회적 합의를 위해 자주 교류하지만 정서적 유대는 비교적 낮은 관계입니다. 일상의 규칙성과 생산성을 지탱하는 기능적 지지대입니다.',
            over: '과잉 시 사무적 관계에 치여 정서적 소외감을 느끼고 번아웃(Burn-out)이 빠르게 찾아올 수 있습니다.',
            under: '부족 시 소속감이 약해지고 현실적인 협력 기반이 흔들려 사회적 성과 도출에 어려움을 겪을 수 있습니다.'
        },
        zone4: {
            name: '사회적 지인 (Social)',
            targetMin: 5, targetMax: 15, targetIdeal: 10,
            networkSizeLabel: '최대 150명',
            color: '#90A4AE', icon: Calendar,
            desc: '이름과 얼굴은 알지만 깊은 교류는 없는, 인지적 한계선 안의 관계입니다. 나를 모르는 사회와 연결해주는 느슨하지만 광범위한 정보의 통로입니다.',
            over: '과잉 시 표면적인 사회활동에 에너지가 분산되어 깊이 있는 성찰 시간이 부족해집니다.',
            under: '적절한 배경 소음의 차단은 자아를 보호하는 강력한 심리적 방어막이 됩니다.'
        },
        zone5: {
            name: '배경 소음 (Noise)',
            targetMin: 0, targetMax: 5, targetIdeal: 0,
            networkSizeLabel: '무제한',
            color: '#D1D5DB', icon: Trash2,
            desc: '인지 범위 밖의 타인이나 불필요한 디지털 연결들입니다. 의식하지 않아도 내 삶의 배경을 이루며 무의식적인 심리적 로드를 발생시키는 구간입니다.',
            over: '과잉 시 정보 과부하와 불필요한 비교로 인해 자아 집중력이 현저히 저하됩니다.',
            under: '적절한 배경 소음의 차단은 자아를 보호하는 강력한 심리적 방어막이 됩니다.'
        }
    };

    // 🔍 2. Dynamic Data Calculation based on Store
    const getCalculatedData = () => {
        const zoneEnergyMap = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
        const zoneCounts = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
        const totalEnergySum = relationships.reduce((sum: number, r: RelationshipNode) => sum + (r.temperature || 50), 0);

        relationships.forEach((r: RelationshipNode) => {
            const key = `zone${r.zone}` as keyof typeof zoneEnergyMap;
            if (zoneEnergyMap[key] !== undefined) {
                zoneEnergyMap[key] += (r.temperature || 50);
                zoneCounts[key] += 1;
            }
        });

        const energyData = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
        if (totalEnergySum > 0) {
            (Object.keys(energyData) as Array<keyof typeof energyData>).forEach(key => {
                energyData[key] = Math.round((zoneEnergyMap[key] / totalEnergySum) * 100);
            });
        } else {
            energyData.zone1 = 15; energyData.zone2 = 25; energyData.zone3 = 30; energyData.zone4 = 20; energyData.zone5 = 10;
        }

        const sortedByTemp = [...relationships].sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
        const recovery = sortedByTemp[0];
        const drain = sortedByTemp[sortedByTemp.length - 1];

        const getInteractionWeight = (str: string = '') => {
            if (str.includes('방금') || str.includes('분 전')) return 100;
            if (str.includes('오늘') || str.includes('시간 전')) return 80;
            if (str.includes('어제')) return 60;
            return 10;
        };
        const frequency = [...relationships].sort((a, b) => getInteractionWeight(b.lastInteraction) - getInteractionWeight(a.lastInteraction))[0];

        return { energyData, zoneCounts, lensData: { recovery, drain, frequency } };
    };

    const { energyData, zoneCounts, lensData } = getCalculatedData();
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
            title: '감성 트렌드 도표',
            sub: '마음의 일기예보',
            info: '최근 30일간의 모든 상호작용(온도, 옥시토신, 코르티솔)을 종합 분석한 정서의 흐름입니다.',
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
                { label: '영혼의 배터리', desc: '당신의 정서적 온도를 높여주는 가장 핵심적인 지지자들입니다.' },
                { label: '에너지 포식자', desc: '가장 많은 정적 에너지를 요구하거나 당신을 지치게 하는 주의 대상입니다.' },
                { label: '일상의 중력', desc: '감정적 깊이와 상관없이 당신의 일상을 실제적으로 가장 많이 차지하는 점유층입니다.' }
            ]
        }
    };


    const trendPoints = [80, 70, 90, 60, 40, 50, 30, 10, 20];

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>
                인사이트
            </Text>
            <TouchableOpacity style={styles.headerActionBtn}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.headerActionText, { color: colors.primary }]}>{selectedPeriod}</Text>
            </TouchableOpacity>
        </View>
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
                    <Svg width={radius * 2.5} height={radius * 2.5} viewBox={`0 0 ${radius * 2.5} ${radius * 2.5}`}>
                        <Defs>
                            {zoneKeys.map((key) => (
                                <LinearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0%" stopColor={ZONE_INFO[key].color} stopOpacity="1" />
                                    <Stop offset="100%" stopColor={ZONE_INFO[key].color} stopOpacity="0.7" />
                                </LinearGradient>
                            ))}
                        </Defs>

                        <Circle
                            cx={radius * 1.25}
                            cy={radius * 1.25}
                            r={radius}
                            fill="none"
                            stroke="#EBE5D9"
                            strokeWidth="12"
                            strokeOpacity="0.3"
                        />

                        {/* Zone 렌더링 순서 조정: 선택된 Zone을 마지막에 그려서 최상위에 표시 */}
                        {(() => {
                            // 선택된 Zone을 마지막으로 이동
                            const sortedKeys = [...zoneKeys];
                            const selectedIndex = sortedKeys.indexOf(selectedZone);
                            if (selectedIndex > -1) {
                                sortedKeys.splice(selectedIndex, 1);
                                sortedKeys.push(selectedZone);
                            }

                            let cumulativeActual = 0;
                            let cumulativeTarget = 0;

                            return sortedKeys.map((key) => {
                                const value = energyData[key];
                                const target = ZONE_INFO[key].targetIdeal;
                                const strokeDasharrayActual = [
                                    (value / 100) * circumference,
                                    circumference
                                ].join(' ');
                                const strokeDashoffsetActual = - (cumulativeActual / 100) * circumference;

                                const strokeDasharrayTarget = [
                                    (target / 100) * guideCircumference,
                                    guideCircumference
                                ].join(' ');
                                const strokeDashoffsetTarget = - (cumulativeTarget / 100) * guideCircumference;

                                cumulativeActual += value;
                                cumulativeTarget += target;

                                return (
                                    <React.Fragment key={key}>
                                        <Circle
                                            cx={radius * 1.25}
                                            cy={radius * 1.25}
                                            r={radius}
                                            fill="none"
                                            stroke={`url(#grad-${key})`}
                                            strokeWidth={selectedZone === key ? 16 : 12}
                                            strokeDasharray={strokeDasharrayActual}
                                            strokeDashoffset={strokeDashoffsetActual}
                                            strokeLinecap="round"
                                            transform={`rotate(-90 ${radius * 1.25} ${radius * 1.25})`}
                                        />
                                        <Circle
                                            cx={radius * 1.25}
                                            cy={radius * 1.25}
                                            r={innerGuideRadius}
                                            fill="none"
                                            stroke={ZONE_INFO[key].color}
                                            strokeWidth="2"
                                            strokeDasharray={strokeDasharrayTarget}
                                            strokeDashoffset={strokeDashoffsetTarget}
                                            strokeOpacity="0.3"
                                            transform={`rotate(-90 ${radius * 1.25} ${radius * 1.25})`}
                                        />
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </Svg>

                    <View style={styles.chartCenter}>
                        <Text style={[styles.chartPercentage, { color: colors.primary }]}>
                            {energyData[selectedZone]}%
                        </Text>
                        {(() => {
                            const val = energyData[selectedZone];
                            const { targetMin, targetMax } = ZONE_INFO[selectedZone];
                            let label = '건강';
                            let statusColor = colors.accent;
                            if (val < targetMin) { label = '부족'; statusColor = '#90A4AE'; }
                            else if (val > targetMax) { label = '초과'; statusColor = '#D98B73'; }
                            return (
                                <Text style={[styles.chartStatus, { color: statusColor }]}>{label}</Text>
                            );
                        })()}
                    </View>
                    {renderLegend()}
                </View>

                {/* 🎨 Improved Performance Gauge UI */}
                <View style={[styles.performanceGaugeContainer, { backgroundColor: colors.white }]}>
                    <View style={styles.gaugeHeaderRow}>
                        <View>
                            <Text style={[styles.gaugeTitle, { color: colors.primary }]}>{ZONE_INFO[selectedZone].name}</Text>
                            <Text style={[styles.gaugeSubTitle, { color: colors.primary, opacity: 0.5 }]}>현재 {zoneCounts[selectedZone]}명이 머무는 중</Text>
                        </View>
                        <View style={styles.gaugeStatusBadge}>
                            {(() => {
                                const val = energyData[selectedZone];
                                const { targetMin, targetMax } = ZONE_INFO[selectedZone];
                                if (val < targetMin) return <><AlertCircle size={14} color="#90A4AE" /><Text style={{ color: '#90A4AE', fontSize: 12, fontWeight: '800', marginLeft: 4 }}>공급 부족</Text></>;
                                if (val > targetMax) return <><AlertCircle size={14} color="#D98B73" /><Text style={{ color: '#D98B73', fontSize: 12, fontWeight: '800', marginLeft: 4 }}>에너지 초과</Text></>;
                                return <><CheckCircle2 size={14} color={colors.accent} /><Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', marginLeft: 4 }}>안정적 상태</Text></>;
                            })()}
                        </View>
                    </View>

                    {/* Gauge Visual Area */}
                    {/* Gauge Visual Area */}
                    <View style={styles.gaugeVisualArea}>
                        {/* TARGET Value Marker (Bubble now points to IDEAL) */}
                        <View style={styles.actualPointerWrapper}>
                            <View style={[styles.actualPointer, { left: `${ZONE_INFO[selectedZone].targetIdeal}%`, backgroundColor: '#54595E' }]}>
                                <Text style={styles.actualPointerText} numberOfLines={1}>권장 {ZONE_INFO[selectedZone].targetIdeal}%</Text>
                                <View style={[styles.pointerArrow, { borderTopColor: '#54595E' }]} />
                            </View>
                        </View>

                        {/* Track & Shading */}
                        <View style={[styles.trackBase, { backgroundColor: colors.primary + '0A' }]}>
                            {/* ACTUAL FILL BAR (Graph Line) */}
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    width: `${Math.min(100, energyData[selectedZone])}%`,
                                    backgroundColor: ZONE_INFO[selectedZone].color,
                                    borderRadius: 6,
                                    zIndex: 5
                                }}
                            />

                            {/* Recommended Range Guidelines (Lines) */}
                            <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${ZONE_INFO[selectedZone].targetMin}%`, width: 1, backgroundColor: colors.primary, opacity: 0.1, zIndex: 10 }} />
                            <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${ZONE_INFO[selectedZone].targetMax}%`, width: 1, backgroundColor: colors.primary, opacity: 0.1, zIndex: 10 }} />

                            {/* Ideal Target Center Line */}
                            <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${ZONE_INFO[selectedZone].targetIdeal}%`, width: 2, backgroundColor: '#54595E', zIndex: 11 }} />
                        </View>

                        {/* Labels (Bottom) */}
                        <View style={styles.gaugeXAxis}>
                            <View style={{ flex: 1 }}><Text style={styles.axisLabel}>현재 비중 {energyData[selectedZone]}%</Text></View>
                            <Text style={styles.axisLabel}>100%</Text>
                        </View>
                    </View>

                    <View style={[styles.nudgeBox, { backgroundColor: colors.background }]}>
                        <Text style={[styles.nudgeText, { color: colors.primary }]}>
                            {energyData[selectedZone] > ZONE_INFO[selectedZone].targetMax
                                ? '⚠️ 현재 이 구역에 너무 많은 에너지가 쏠려있어 다른 관계가 소외될 수 있습니다.'
                                : energyData[selectedZone] < ZONE_INFO[selectedZone].targetMin
                                    ? '⚠️ 자아 지탱을 위한 최소 에너지가 부족합니다. 더 많은 교감이 권장됩니다.'
                                    : '✨ 권장 범위 내에서 아주 건강한 에너지 균형을 유지하고 있습니다.'}
                        </Text>
                    </View>
                </View>
            </View >
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

                <View style={{ height: 1, backgroundColor: 'rgba(74,93,78,0.05)', marginVertical: 16 }} />

                <View style={styles.insightBox}>
                    <Zap size={16} color={colors.accent} />
                    <Text style={[styles.insightText, { color: colors.primary }]}>
                        {energyData[selectedZone] > ZONE_INFO[selectedZone].targetMax ? ZONE_INFO[selectedZone].over : energyData[selectedZone] < ZONE_INFO[selectedZone].targetMin ? ZONE_INFO[selectedZone].under : '현재 매우 균형 잡힌 에너지를 유지하고 있습니다.'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderTrendSection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>감성 트렌드</Text>
                    <TouchableOpacity onPress={() => setActivePopup('trend')}>
                        <Info size={16} color={colors.primary} opacity={0.4} />
                    </TouchableOpacity>
                </View>
                <View style={styles.trendStatus}>
                    <TrendingUp size={14} color={colors.accent} />
                    <Text style={[styles.trendStatusText, { color: colors.accent }]}>전월 대비 +12%</Text>
                </View>
            </View>

            <View style={[styles.trendChartCard, { backgroundColor: colors.white }]}>
                <Svg width={width - 80} height={120}>
                    <Defs>
                        <LinearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.2" />
                            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    <Path
                        d={`M 0 ${trendPoints[0]} ${trendPoints.map((p, i) => `L ${(i * (width - 80)) / (trendPoints.length - 1)} ${p}`).join(' ')}`}
                        fill="none"
                        stroke={colors.accent}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    <Path
                        d={`M 0 ${trendPoints[0]} ${trendPoints.map((p, i) => `L ${(i * (width - 80)) / (trendPoints.length - 1)} ${p}`).join(' ')} L ${width - 80} 120 L 0 120 Z`}
                        fill="url(#trendGrad)"
                    />

                    {trendPoints.map((p, i) => (
                        <Circle
                            key={i}
                            cx={(i * (width - 80)) / (trendPoints.length - 1)}
                            cy={p}
                            r="4"
                            fill={colors.white}
                            stroke={colors.accent}
                            strokeWidth="2"
                        />
                    ))}
                </Svg>

                <View style={styles.trendXLabels}>
                    <Text style={styles.trendXText}>1일</Text>
                    <Text style={styles.trendXText}>15일</Text>
                    <Text style={styles.trendXText}>30일</Text>
                </View>
            </View>
        </View>
    );

    return (
        <>
            <HubLayout header={renderHeader()} scrollable>
                <View style={styles.container}>
                    <Text style={[styles.pageTitle, { color: colors.primary }]}>자아 건강 리포트</Text>

                    <View style={styles.filterRow}>
                        <TouchableOpacity style={[styles.filterChip, { backgroundColor: colors.primary }]}>
                            <Text style={styles.filterChipText}>{selectedPeriod}</Text>
                            <ChevronLeft size={16} color={colors.white} style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.filterChip, { backgroundColor: colors.white, borderWidth: 1, borderColor: '#EBE5D9' }]}>
                            <Text style={[styles.filterChipText, { color: colors.primary }]}>지난 30일</Text>
                            <ChevronLeft size={16} color={colors.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    {renderEnergyChart()}
                    {renderEnergyHealthList()}

                    {/* New: Multi-Lens Summary Section */}
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
                                <View style={[styles.lensIconCircle, { backgroundColor: '#D4AF37' }]}>
                                    <Battery size={16} color="white" />
                                </View>
                                <Text style={styles.lensLabel}>영혼의 배터리</Text>
                                <Text style={styles.lensValue}>{lensData.recovery?.name || '공석'}</Text>
                                <Text style={styles.lensSub}>회복률 1위</Text>
                            </View>

                            <View style={[styles.lensCard, { backgroundColor: '#FDF7F5' }]}>
                                <View style={[styles.lensIconCircle, { backgroundColor: '#D98B73' }]}>
                                    <Zap size={16} color="white" />
                                </View>
                                <Text style={styles.lensLabel}>에너지 포식자</Text>
                                <Text style={styles.lensValue}>{lensData.drain?.name || '공석'}</Text>
                                <Text style={styles.lensSub}>주의 요망</Text>
                            </View>

                            <View style={[styles.lensCard, { backgroundColor: '#F5F7F8' }]}>
                                <View style={[styles.lensIconCircle, { backgroundColor: colors.primary }]}>
                                    <History size={16} color="white" />
                                </View>
                                <Text style={styles.lensLabel}>일상의 중력</Text>
                                <Text style={styles.lensValue}>{lensData.frequency?.name || '공석'}</Text>
                                <Text style={styles.lensSub}>최다 점유자</Text>
                            </View>
                        </View>
                    </View>

                    {renderTrendSection()}

                    <View style={{ height: 100 }} />
                </View>
            </HubLayout>

            {activePopup && (
                <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setActivePopup(null)}
                    />
                    <View style={[styles.floatingPopupCard, { backgroundColor: colors.white }]}>
                        <View style={styles.guideHeader}>
                            <View>
                                <Text style={[styles.guideTitle, { color: colors.primary }]}>{METRIC_GUIDE[activePopup].title}</Text>
                                <Text style={[styles.guideSubTitle, { color: colors.accent }]}>{METRIC_GUIDE[activePopup].sub}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setActivePopup(null)} style={styles.popupCloseBtn}>
                                <X size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.popupScrollContainer}>
                            <Text style={[styles.guideInfoText, { color: colors.primary }]}>
                                {METRIC_GUIDE[activePopup].info}
                            </Text>

                            {METRIC_GUIDE[activePopup].details.map((detail: any, idx: number) => (
                                <View key={idx} style={[styles.guideStatusBox, { backgroundColor: colors.primary + '0A', marginTop: idx > 0 ? 12 : 0 }]}>
                                    <Text style={[styles.guideStatusLabel, { color: colors.primary }]}>
                                        {detail.label}
                                    </Text>
                                    <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>
                                        {detail.desc}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.popupConfirmBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setActivePopup(null)}
                        >
                            <Text style={styles.popupConfirmText}>이해했습니다</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 22,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },
    headerActionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 20,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    filterChipText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    chartSection: {
        marginBottom: 32,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    chartCenter: {
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '50%',
        height: '50%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    chartPercentage: {
        fontSize: 24,
        fontWeight: '900',
    },
    chartStatus: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: -4,
    },
    legendContainer: {
        flex: 1,
        marginLeft: 24,
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    legendCount: {
        fontSize: 10,
        fontWeight: '800',
    },
    // 🎨 Performance Gauge Styles
    performanceGaugeContainer: {
        padding: 24,
        borderRadius: 32,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        zIndex: 100,
        position: 'relative',
    },
    gaugeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    gaugeTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    gaugeSubTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    gaugeStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7F8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    gaugeVisualArea: {
        marginVertical: 10,
        height: 80,
        justifyContent: 'center',
    },
    trackBase: {
        height: 12,
        borderRadius: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    goalAreaShade: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderStyle: 'dashed',
    },
    idealTickLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: 1.5,
        zIndex: 10,
    },
    actualPointerWrapper: {
        position: 'relative',
        height: 38,
        marginBottom: 4,
    },
    actualPointer: {
        position: 'absolute',
        top: 0,
        transform: [{ translateX: -30 }],
        width: 60,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actualPointerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    pointerArrow: {
        position: 'absolute',
        bottom: -6,
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    gaugeXAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 2,
    },
    axisLabel: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '700',
    },
    nudgeBox: {
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
    },
    nudgeText: {
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
        textAlign: 'center',
    },
    zoneDetailCard: {
        width: '100%',
        padding: 24,
        borderRadius: 28,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    zoneDetailTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    zoneDetailTitle: {
        fontSize: 17,
        fontWeight: '900',
    },
    zoneDetailBody: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    insightBox: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    insightText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    trendStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendStatusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    trendChartCard: {
        padding: 24,
        borderRadius: 28,
        alignItems: 'center',
    },
    trendXLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 12,
        paddingHorizontal: 10,
    },
    trendXText: {
        fontSize: 11,
        color: '#9E9E9E',
        fontWeight: '700',
    },
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
    lensGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    lensCard: {
        flex: 1,
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
    },
    lensIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    lensLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#737874',
        marginBottom: 4,
    },
    lensValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#4A5D4E',
        marginBottom: 2,
    },
    lensSub: {
        fontSize: 9,
        fontWeight: '700',
        color: '#9E9E9E',
        textTransform: 'uppercase',
    },
});
