import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, Image, StatusBar, Platform, Alert } from 'react-native';
import Svg, { Polygon, Line, Circle, Rect, G, Defs, LinearGradient as SvgLinearGradient, Stop, Path, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, MoreHorizontal, Calendar, Info, TrendingUp, BatteryFull, CheckCircle2, Download, Edit3, Shield, Zap, Leaf, Activity, X, Heart, History } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelfHealthData } from './useSelfHealthData';
import { useColors } from '../../theme/ColorLockContext';
import { HubLayout } from '../../layouts/BaseLayout';
import { AppHeader } from '../../components/AppHeader';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');

// 🎨 Design System
const THEME = {
    primary: "#4A5D4E", // Deep Sage Green
    secondary: "#D98B73", // Soft Terracotta
    background: "#FCF9F2", // Warm Ivory
    surface: "#FFFFFF",
    textMain: "#2F332F",
    textMuted: "#8C968D",
    surfaceDark: "#262926",
    accent: "#D98B73",
    oxytocin: '#D98B73',
    cortisol: '#8C968D',
};

export const SelfHealthReport = ({ onBack }: { onBack: () => void }) => {
    const colors = useColors();
    const textMuted = colors.gray[500];
    const [period, setPeriod] = useState<'주간' | '월간' | '연간'>('주간');
    const [infoModal, setInfoModal] = useState<{ visible: boolean; type: 'balance' | 'energy' | 'pulse' | 'oxytocin' | 'cortisol' | null }>({ visible: false, type: null });
    const { balanceData, pulseStats, pulsePoints, energyTotal, stats, dateRange } = useSelfHealthData(period);
    const relationships = useRelationshipStore(state => state.relationships);

    // 🔙 Navigation Handler
    const handleBack = () => {
        onBack();
    };

    // 🖥️ UI Components
    const renderHeader = () => (
        <AppHeader
            title="건강 리포트"
            leftAction={null}
            rightAction={
                <TouchableOpacity style={styles.iconBtn}>
                    <MoreHorizontal size={24} color={colors.primary} />
                </TouchableOpacity>
            }
        />
    );

    const renderPeriodToggle = () => (
        <View style={styles.toggleContainer}>
            <View style={styles.toggleTrack}>
                {(['주간', '월간', '연간'] as const).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.dateDisplay}>
                <Calendar size={16} color={textMuted} />
                <Text style={[styles.dateText, { color: textMuted }]}>
                    {`${dateRange.start.getMonth() + 1}월 ${dateRange.start.getDate()}일 - ${dateRange.end.getMonth() + 1}월 ${dateRange.end.getDate()}일`}
                </Text>
            </View>
        </View>
    );

    const renderRadarChart = () => {
        const size = 200;
        const center = size / 2;
        const radius = size * 0.4;

        // Real Data from Hook
        const data = balanceData;
        const keys = Object.keys(data);
        const totalPoints = keys.length;

        const getPoint = (value: number, index: number, maxRadius: number) => {
            const angle = (Math.PI * 2 * index) / totalPoints - Math.PI / 2;
            const r = (value / 100) * maxRadius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
        };

        const polyPoints = keys.map((key, i) => getPoint(data[key as keyof typeof data], i, radius)).join(' ');
        const levels = [20, 40, 60, 80, 100];

        return (
            <View style={styles.radarContainer}>
                <View style={styles.cardHeader}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.cardTitle, { color: colors.primary }]}>관계 밸런스</Text>
                            <TouchableOpacity onPress={() => setInfoModal({ visible: true, type: 'balance' })}>
                                <Info size={16} color={colors.primary} opacity={0.5} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardSubtitle}>현재 정서적 균형이 잡혀있습니다</Text>
                    </View>
                    <View style={styles.iconCircle}>
                        <Shield size={20} color={colors.primary} />
                    </View>
                </View>

                <View style={styles.chartWrapper}>
                    <Svg height={size} width={size}>
                        {levels.map(l => (
                            <Polygon
                                key={l}
                                points={keys.map((_, i) => getPoint(l, i, radius)).join(' ')}
                                stroke={THEME.primary}
                                strokeOpacity={0.1}
                                strokeWidth="1"
                                fill="none"
                            />
                        ))}
                        {keys.map((_, i) => {
                            const p = getPoint(100, i, radius).split(',');
                            return (
                                <Line
                                    key={i}
                                    x1={center} y1={center}
                                    x2={p[0]} y2={p[1]}
                                    stroke={THEME.primary}
                                    strokeOpacity={0.1}
                                    strokeWidth="1"
                                />
                            );
                        })}
                        <Polygon
                            points={polyPoints}
                            fill={THEME.primary}
                            fillOpacity={0.2}
                            stroke={THEME.primary}
                            strokeWidth="2"
                        />
                        {keys.map((key, i) => {
                            const p = getPoint(data[key as keyof typeof data], i, radius).split(',');
                            return (
                                <Circle key={i} cx={p[0]} cy={p[1]} r="3" fill={THEME.primary} />
                            );
                        })}
                    </Svg>
                    <Text style={[styles.chartLabel, { top: 0, alignSelf: 'center' }]}>신뢰</Text>
                    <Text style={[styles.chartLabel, { right: 10, top: '35%' }]}>성장</Text>
                    <Text style={[styles.chartLabel, { right: 20, bottom: 20 }]}>안정</Text>
                    <Text style={[styles.chartLabel, { left: 20, bottom: 20 }]}>열정</Text>
                    <Text style={[styles.chartLabel, { left: 10, top: '35%' }]}>즐거움</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScroll}>
                    <View style={styles.metricChip}>
                        <TrendingUp size={16} color={colors.primary} />
                        <Text style={styles.metricText}>소통 +12%</Text>
                    </View>
                    <View style={[styles.metricChip, { borderColor: THEME.secondary }]}>
                        <BatteryFull size={16} color={THEME.secondary} />
                        <Text style={[styles.metricText, { color: THEME.secondary }]}>활동 지수 안정</Text>
                    </View>
                    <View style={styles.metricChip}>
                        <CheckCircle2 size={16} color={colors.primary} />
                        <Text style={styles.metricText}>신뢰 안정적</Text>
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderEnergyChart = () => {
        const { interactionCounts, avgTemps, labels } = stats;
        const CHART_HEIGHT = 160;

        // Path calculation for Temperature Line - filter out nulls to prevent invalid paths
        const linePoints = avgTemps
            .map((temp: number | null, i: number) => {
                if (temp === null) return null;
                const chartAreaWidth = width - 48 - 40;
                const x = (i * chartAreaWidth / (labels.length > 1 ? labels.length - 1 : 1)) + 20;
                const y = CHART_HEIGHT - (temp * CHART_HEIGHT / 100);
                return { x, y };
            })
            .filter((p: any) => p !== null) as { x: number, y: number }[];

        const linePath = linePoints.length > 0 
            ? `M ${linePoints.map((p: any) => `${p.x},${p.y}`).join(' L ')}`
            : '';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.cardTitle, { color: colors.primary }]}>에너지 사용 리포트</Text>
                        <Text style={styles.cardSubtitle}>활동량 대비 정서적 만족도 조감</Text>
                    </View>
                    <TouchableOpacity style={styles.infoBtn} onPress={() => setInfoModal({ visible: true, type: 'energy' })}>
                        <Info size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.chartLegendRow}>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: THEME.secondary + '40' }]} />
                        <Text style={styles.legendLabel}>관계 활동량 (교류 횟수)</Text>
                    </View>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendLineIndicator, { borderColor: THEME.accent }]} />
                        <Text style={styles.legendLabel}>정서 온도</Text>
                    </View>
                </View>

                <View style={[styles.hybridChartContainer, { height: CHART_HEIGHT }]}>
                    <View style={styles.chartGrid}>
                        {[0, 25, 50, 75, 100].map(v => (
                            <View key={v} style={[styles.gridLine, { bottom: `${v}%` }]} />
                        ))}
                    </View>

                    <View style={styles.barsLayer}>
                        {interactionCounts.map((val: number, i: number) => (
                            <View key={i} style={styles.barColumnWrapper}>
                                <View style={[styles.interactionBar, { height: `${val}%`, backgroundColor: THEME.secondary + '30' }]} />
                            </View>
                        ))}
                    </View>

                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Path
                            d={linePath}
                            fill="none"
                            stroke={THEME.accent}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {linePoints.map((p: any, i: number) => (
                            <Circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={THEME.accent} strokeWidth="2" />
                        ))}
                    </Svg>
                </View>

                <View style={styles.xAxisLabels}>
                    {labels.map((d, i) => {
                        // 월간 데이터일 경우 라벨이 너무 많으므로 일부만 표시
                        if (period === '월간' && i % 5 !== 0 && i !== labels.length - 1) return null;
                        return <Text key={i} style={styles.xAxisText}>{d}</Text>;
                    })}
                </View>
            </View>
        );
    };

    const renderBiomarkerStats = () => {
        const { avgOxytocin, avgCortisol } = energyTotal;

        const getStatus = (type: 'oxytocin' | 'cortisol', val: number) => {
            if (type === 'oxytocin') {
                if (val >= 80) return { label: '정서 피크', color: '#D98B73' };
                if (val >= 60) return { label: '유대감 양호', color: '#7BA67E' };
                return { label: '회복 필요', color: '#8C968D' };
            } else {
                if (val >= 70) return { label: '스트레스 과다', color: '#D98B73' };
                if (val >= 40) return { label: '긴장 상태', color: '#E9A15A' };
                return { label: '정서적 이완', color: '#7BA67E' };
            }
        };

        const oxy = getStatus('oxytocin', avgOxytocin);
        const cort = getStatus('cortisol', avgCortisol);

        return (
            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 16 }]}>{period} 정서 영향 분석</Text>
                <View style={styles.impactGrid}>
                    <TouchableOpacity
                        style={[styles.impactCard, { backgroundColor: colors.white }]}
                        onPress={() => setInfoModal({ visible: true, type: 'oxytocin' })}
                    >
                        <View style={styles.impactLabelRow}>
                            <View style={[styles.impactIconBg, { backgroundColor: oxy.color + '1A' }]}>
                                <Heart size={14} color={oxy.color} fill={oxy.color} />
                            </View>
                            <Text style={[styles.impactLabel, { color: colors.primary }]}>옥시토신</Text>
                        </View>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${avgOxytocin}%`, backgroundColor: oxy.color }]} />
                        </View>
                        <View style={styles.impactValueRow}>
                            <Text style={[styles.impactLevel, { color: oxy.color }]}>{oxy.label}</Text>
                            <Text style={[styles.impactValue, { color: colors.primary }]}>{avgOxytocin}<Text style={{ fontSize: 10, opacity: 0.4 }}>%</Text></Text>
                        </View>
                        <Text style={styles.impactBrief}>따뜻한 교감이 주는 회복 에너지</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.impactCard, { backgroundColor: colors.white }]}
                        onPress={() => setInfoModal({ visible: true, type: 'cortisol' })}
                    >
                        <View style={styles.impactLabelRow}>
                            <View style={[styles.impactIconBg, { backgroundColor: cort.color + '1A' }]}>
                                <Activity size={14} color={cort.color} />
                            </View>
                            <Text style={[styles.impactLabel, { color: colors.primary }]}>코르티솔</Text>
                        </View>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${avgCortisol}%`, backgroundColor: cort.color }]} />
                        </View>
                        <View style={styles.impactValueRow}>
                            <Text style={[styles.impactLevel, { color: cort.color }]}>{cort.label}</Text>
                            <Text style={[styles.impactValue, { color: colors.primary }]}>{avgCortisol}<Text style={{ fontSize: 10, opacity: 0.4 }}>%</Text></Text>
                        </View>
                        <Text style={styles.impactBrief}>정서적 자극으로 인한 긴장 피로도</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderGlobalSocialTopography = () => {
        const matrixWidth = width - 48; // padding account
        const svgWidth = 200;
        const svgHeight = 160;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardTitle}>전체 관계 지형도</Text>
                            <TouchableOpacity onPress={() => Alert.alert('관계 지형도', '모든 관계의 만족도와 에너지 소모량을 한눈에 조망합니다.')}>
                                <Info size={16} color={colors.primary} opacity={0.5} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardSubtitle}>전체 인맥의 정서 분포 조감</Text>
                    </View>
                </View>

                <View style={styles.topographyPlot}>
                    <View style={styles.topographyGrid}>
                        <View style={[styles.gridCell, { backgroundColor: colors.primary + '05' }]}><Text style={styles.gridLabel}>고출력</Text></View>
                        <View style={[styles.gridCell, { backgroundColor: colors.accent + '05' }]}><Text style={styles.gridLabel}>충전</Text></View>
                        <View style={[styles.gridCell, { backgroundColor: '#8C968D10' }]}><Text style={styles.gridLabel}>소모</Text></View>
                        <View style={[styles.gridCell, { backgroundColor: '#90A4AE10' }]}><Text style={styles.gridLabel}>안정</Text></View>
                    </View>

                    <Svg height="160" width={matrixWidth - 48} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                        {/* Axes */}
                        <Line x1="20" y1="80" x2="180" y2="80" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                        <Line x1="100" y1="20" x2="100" y2="140" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />

                        {/* Data Points for each relationship */}
                        {relationships.map((node) => {
                            const lastHistory = (node.history || []).slice(-1)[0];
                            if (!lastHistory) return null;

                            const sat = lastHistory.satisfaction || 50;
                            const drain = lastHistory.energyDrain || 50;
                            
                            return (
                                <G key={node.id}>
                                    <Circle
                                        cx={20 + (sat / 100) * 160}
                                        cy={svgHeight - (20 + (drain / 100) * 120)}
                                        r="5"
                                        fill={colors.accent}
                                        stroke="white"
                                        strokeWidth="1.5"
                                        opacity={0.8}
                                    />
                                    <SvgText
                                        x={20 + (sat / 100) * 160}
                                        y={svgHeight - (20 + (drain / 100) * 120) + 12}
                                        fontSize="8"
                                        fontWeight="700"
                                        fill={colors.primary}
                                        textAnchor="middle"
                                        opacity="0.6"
                                    >
                                        {node.name}
                                    </SvgText>
                                </G>
                            );
                        })}
                    </Svg>
                </View>
                
                <View style={styles.chartLegendRow}>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: colors.accent }]} />
                        <Text style={styles.legendLabel}>인맥 분포</Text>
                    </View>
                    <Text style={styles.legendLabel}>X: 만족도 | Y: 에너지 소모</Text>
                </View>
            </View>
        );
    };

    const renderCheckInHistory = () => {
        // Aggregate all history across all relationships
        const allHistory = relationships.flatMap(node =>
            (node.history || []).map(h => ({
                ...h,
                nodeName: node.name,
                nodeImage: node.image,
                nodeId: node.id
            }))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 15);

        if (allHistory.length === 0) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardTitle}>전체 체크인 히스토리</Text>
                        </View>
                        <Text style={styles.cardSubtitle}>최근 교류 기록</Text>
                    </View>
                </View>
                {allHistory.map((h, i) => {
                    const dateStr = new Date(h.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                    return (
                        <TouchableOpacity
                            key={`${h.nodeId}-${i}`}
                            style={styles.historyItem}
                            onPress={() => Alert.alert('기록 상세', `${h.nodeName}님과의 기록: ${h.topic || '일상적인 교류'}`)}
                        >
                            <View style={styles.historyDateBox}>
                                <Text style={styles.historyDateText}>{dateStr}</Text>
                            </View>
                            <View style={styles.historyContent}>
                                <View style={styles.historyMainRow}>
                                    <Text style={styles.historyNodeName}>{h.nodeName}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: (h.temperature || 50) >= 60 ? colors.accent + '15' : '#8C968D15' }]}>
                                        <Text style={[styles.statusBadgeText, { color: (h.temperature || 50) >= 60 ? colors.accent : '#8C968D' }]}>
                                            {(h.temperature || 50) >= 60 ? '긍정' : '소모'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.historyTopic} numberOfLines={1}>{h.topic || '일상적인 교류'}</Text>
                            </View>
                            <View style={styles.historyMetrics}>
                                <View style={styles.miniMetric}>
                                    <Heart size={10} color={colors.accent} fill={colors.accent} />
                                    <Text style={styles.miniMetricValue}>{h.satisfaction || h.temperature || 50}</Text>
                                </View>
                                <View style={styles.miniMetric}>
                                    <Zap size={10} color="#D98B73" />
                                    <Text style={styles.miniMetricValue}>{h.energyDrain || 20}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <TouchableOpacity
                    style={{ marginTop: 24, alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)' }}
                    onPress={() => Alert.alert('히스토리 상세', '준비 중인 기능입니다.')}
                >
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', opacity: 0.6 }}>전체 기록 보기</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCheckInPulse = () => {
        const CHART_WIDTH = 300;
        const CHART_HEIGHT = 120;

        const points = pulsePoints.map((temp, i) => {
            const denominator = pulsePoints.length > 1 ? pulsePoints.length - 1 : 1;
            const x = (i / denominator) * CHART_WIDTH;
            const safeTemp = isNaN(temp) ? 50 : temp;
            const y = 100 - (safeTemp * 0.8);
            return `${x},${y}`;
        });

        const linePath = `M ${points.join(' L ')}`;
        const fillPath = `M 0,${CHART_HEIGHT} L ${points.join(' L ')} L ${CHART_WIDTH},${CHART_HEIGHT} Z`;

        return (
            <View style={styles.card}>
                <View style={[styles.cardHeader, { marginBottom: 16 }]}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardTitle}>감정 리듬</Text>
                            <TouchableOpacity onPress={() => setInfoModal({ visible: true, type: 'pulse' })}>
                                <Info size={16} color={colors.primary} opacity={0.5} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardSubtitle}>감정의 일관성 및 상태</Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn}>
                        <Edit3 size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.pulseContainer}>
                    <Svg height="120" width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
                        <Defs>
                            <SvgLinearGradient id="gradPulse" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={THEME.primary} stopOpacity="0.4" />
                                <Stop offset="1" stopColor={THEME.primary} stopOpacity="0" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d={fillPath} fill="url(#gradPulse)" />
                        <Path d={linePath} stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <Line x1="0" y1="60" x2={CHART_WIDTH} y2="60" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.1" strokeDasharray="4 4" />
                    </Svg>
                </View>

                <View style={styles.pulseFooter}>
                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: THEME.primary }]} />
                            <Text style={styles.legendText}>긍정적 ({pulseStats.positive})</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: THEME.secondary }]} />
                            <Text style={styles.legendText}>소모적 ({pulseStats.challenging})</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.pulseMetaLabel}>최근 {period === '주간' ? '7일' : period === '월간' ? '30일' : '1년'}</Text>
                        <Text style={styles.pulseMetaValue}>{pulseStats.total}회 기록됨</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderAdCard = () => (
        <View style={styles.adCard}>
            <View style={styles.adTag}><Text style={styles.adTagText}>Sponsored</Text></View>
            <View style={styles.adImagePlaceholder}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                <Text style={{ position: 'absolute', bottom: 10, left: 10, color: 'white', opacity: 0.8 }}>Calm Landscape</Text>
            </View>
            <View style={styles.adContent}>
                <View style={styles.adSource}>
                    <Leaf size={16} color={colors.accent} />
                    <Text style={[styles.adSourceText, { color: colors.accent }]}>HEADSPACE</Text>
                </View>
                <Text style={styles.adTitle}>Find your inner balance with daily 5-min meditations.</Text>
                <Text style={styles.adSubtitle}>Start your journey to better relationship health today.</Text>
            </View>
        </View>
    );

    const renderInfoModal = () => {
        if (!infoModal.visible || !infoModal.type) return null;

        const content = {
            balance: {
                title: '관계 밸런스 지표 가이드',
                subtitle: 'RQS Diagnosis Basis',
                items: [
                    { label: '신뢰 (Trust)', desc: '심리적 안전 영역 (Safety): 약점을 드러내도 괜찮은 안전한 관계' },
                    { label: '성장 (Growth)', desc: '성장 및 정체성 영역 (Growth): 나를 더 나은 사람으로 만드는 관계' },
                    { label: '안정 (Stability)', desc: '상호 호혜 영역 (Reciprocity): 주고받음이 균형 잡힌 지속 가능한 관계' },
                    { label: '즐거움 (Joy)', desc: '에너지 대사 영역 (Vitality): 만남 후 활력이 생기고 기분이 좋아지는 관계' },
                    { label: '열정 (Passion)', desc: '활력과 성장의 조화: 에너지가 넘치고 서로에게 몰입하는 상태' },
                ]
            },
            energy: {
                title: '에너지 사용 리포트 가이드',
                subtitle: 'Energy Consumption & Satisfaction',
                items: [
                    { label: '관계 활동량', desc: '해당 일에 발생한 상호작용 기록의 횟수입니다. 활동의 양적인 측면을 보여줍니다.' },
                    { label: '정서 온도', desc: '상호작용 시 느낀 정서적 만족도의 평균치입니다. 활동의 질적인 측면을 보여줍니다.' },
                ]
            },
            pulse: {
                title: '감정 리듬 분석',
                subtitle: 'Emotional Pulse Analysis',
                items: [
                    { label: '긍정적 (Positive)', desc: '정서적 온도가 60°C 이상으로, 만족스럽고 따뜻했던 상호작용입니다.' },
                    { label: '소모적 (Challenging)', desc: '정서적 온도가 40°C 이하이거나, 갈등/스트레스(Cortisol) 반응이 감지된 상호작용입니다.' },
                    { label: '일관성 (Consistency)', desc: '감정 기복이 크지 않고 안정적인 패턴을 유지하는지 보여줍니다.' },
                ]
            },
            oxytocin: {
                title: '옥시토신 (Oxytocin)',
                subtitle: '유대감과 치유의 호르몬',
                info: '모든 인맥과의 상호작용을 종합한 주간 평균 수치입니다. 사람과 정서적으로 깊이 연결되어 있다고 느낄 때 분비되는 사랑과 신뢰의 물질입니다. 높은 수치는 최근의 관계 활동들이 당신에게 정서적 안도감과 회복의 에너지를 주는 "핵심 그룹" 역할을 하고 있음을 의미합니다.'
            },
            cortisol: {
                title: '코르티솔 (Cortisol)',
                subtitle: '긴장과 스트레스 호르몬',
                info: '모든 인맥과의 상호작용을 종합한 주간 평균 수치입니다. 상호작용 시 긴장하거나 위협, 피로를 느낄 때 분비되는 스트레스 반응 물질입니다. 높은 수치가 지속되면 관계 자체가 심리적 부채가 되어 심신을 고갈시키며, 건강한 판단을 어렵게 만듭니다.'
            }
        }[infoModal.type] as any;

        return (
            <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setInfoModal({ visible: false, type: null })} />
                <View style={[styles.floatingPopupCard, { backgroundColor: THEME.surface }]}>
                    <View style={styles.guideHeader}>
                        <View>
                            <Text style={[styles.guideTitle, { color: colors.primary }]}>{content.title}</Text>
                            <Text style={[styles.guideSubTitle, { color: colors.accent }]}>{content.subtitle}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setInfoModal({ visible: false, type: null })} style={styles.popupCloseBtn}>
                            <X size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.popupScrollContainer}>
                        {content.info && (
                            <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.7, marginBottom: 12, fontSize: 14, lineHeight: 22 }]}>
                                {content.info}
                            </Text>
                        )}
                        {content.items && content.items.map((item: any, idx: number) => (
                            <View key={idx} style={[styles.guideStatusBox, { backgroundColor: colors.primary + '0A', marginTop: idx === 0 ? 0 : 12 }]}>
                                <Text style={[styles.guideStatusLabel, { color: colors.primary }]}>{item.label}</Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>{item.desc}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={[styles.popupConfirmBtn, { backgroundColor: colors.primary }]} onPress={() => setInfoModal({ visible: false, type: null })}>
                        <Text style={styles.popupConfirmText}>확인</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <HubLayout header={renderHeader()} scrollable>
                <View style={styles.scrollContent}>
                    {renderPeriodToggle()}
                    {renderRadarChart()}
                    {renderBiomarkerStats()}
                    {renderEnergyChart()}
                    {renderGlobalSocialTopography()}
                    {renderCheckInHistory()}
                    {renderCheckInPulse()}
                    {renderAdCard()}
                    <View style={{ height: 100 }} />
                </View>
            </HubLayout>
            <TouchableOpacity style={styles.fab}><Download size={20} color="white" /><Text style={styles.fabText}>PDF로 저장</Text></TouchableOpacity>
            {infoModal.visible && <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{renderInfoModal()}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: THEME.background },
    scrollContent: { paddingTop: 12, paddingHorizontal: 24, paddingBottom: 100, gap: 24 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(74,93,78,0.05)' },
    toggleContainer: { marginBottom: 8 },
    toggleTrack: { flexDirection: 'row', backgroundColor: '#EBE6DC', borderRadius: 99, padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 99 },
    toggleBtnActive: { backgroundColor: THEME.primary, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    toggleText: { fontSize: 13, fontWeight: '600', color: '#8C968D' },
    toggleTextActive: { color: 'white', fontWeight: '700' },
    dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
    dateText: { fontSize: 13, fontWeight: '600' },
    card: { backgroundColor: THEME.surface, borderRadius: 24, padding: 24, shadowColor: "#4A5D4E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
    radarContainer: { backgroundColor: THEME.surface, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: "#4A5D4E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
    cardTitle: { fontSize: 18, fontWeight: '800' },
    cardSubtitle: { fontSize: 13, color: THEME.textMuted, marginTop: 4 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74, 93, 78, 0.1)', alignItems: 'center', justifyContent: 'center' },
    chartWrapper: { position: 'relative', height: 240, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    chartLabel: { position: 'absolute', fontSize: 11, fontWeight: '700', color: THEME.primary, backgroundColor: THEME.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
    metricsScroll: { gap: 12, paddingHorizontal: 4 },
    metricChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: THEME.surface, borderWidth: 1, borderColor: 'rgba(74, 93, 78, 0.1)' },
    metricText: { fontSize: 13, fontWeight: '700', color: THEME.primary },
    infoBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(74, 93, 78, 0.05)' },
    editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(74, 93, 78, 0.1)', alignItems: 'center', justifyContent: 'center' },
    pulseContainer: { height: 120, marginVertical: 10 },
    pulseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    legendContainer: { flexDirection: 'row', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, fontWeight: '600', color: THEME.textMuted },
    pulseMetaLabel: { fontSize: 10, fontWeight: '700', color: THEME.textMuted, opacity: 0.5 },
    pulseMetaValue: { fontSize: 13, fontWeight: '800', color: THEME.primary },
    chartLegendRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    legendGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendBarIndicator: { width: 12, height: 12, borderRadius: 3 },
    legendLineIndicator: { width: 16, height: 0, borderBottomWidth: 2 },
    legendLabel: { fontSize: 11, color: THEME.textMuted, fontWeight: '600' },
    hybridChartContainer: { width: '100%', marginTop: 10 },
    chartGrid: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
    gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(74, 93, 78, 0.05)' },
    barsLayer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'flex-end' },
    barColumnWrapper: { width: 12, height: '100%', justifyContent: 'flex-end' },
    interactionBar: { width: '100%', borderRadius: 6 },
    xAxisLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 },
    xAxisText: { fontSize: 11, fontWeight: '700', color: THEME.textMuted },
    sectionContainer: { marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800' },
    impactGrid: { flexDirection: 'row', gap: 12 },
    impactCard: { flex: 1, padding: 20, borderRadius: 24, gap: 12, shadowColor: '#4A5D4E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2, borderWidth: 1, borderColor: 'rgba(74, 93, 78, 0.05)' },
    impactLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    impactIconBg: { padding: 6, borderRadius: 99 },
    impactLabel: { fontSize: 14, fontWeight: '800' },
    progressBg: { height: 4, backgroundColor: '#F5F5F5', borderRadius: 2, width: '100%' },
    progressFill: { height: '100%', borderRadius: 2 },
    impactValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    impactLevel: { fontSize: 11, fontWeight: '600' },
    impactValue: { fontSize: 18, fontWeight: '800' },
    impactBrief: { fontSize: 10, fontWeight: '700', opacity: 0.4, marginTop: 4 },
    adCard: { backgroundColor: THEME.surface, borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    adTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, zIndex: 1 },
    adTagText: { color: 'white', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    adImagePlaceholder: { height: 160, backgroundColor: '#E0E5E1' },
    adContent: { padding: 20 },
    adSource: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    adSourceText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    adTitle: { fontSize: 16, fontWeight: '800', color: THEME.primary, lineHeight: 22, marginBottom: 4 },
    adSubtitle: { fontSize: 13, color: THEME.textMuted },
    fab: { position: 'absolute', bottom: 160, right: 24, backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    fabText: { color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 14 },
    popupBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    floatingPopupCard: { width: '100%', maxHeight: '80%', borderRadius: 28, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
    guideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    guideTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    guideSubTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
    popupCloseBtn: { padding: 4 },
    popupScrollContainer: { marginBottom: 20 },
    guideStatusBox: { padding: 16, borderRadius: 16 },
    guideStatusLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    guideStatusDesc: { fontSize: 13, lineHeight: 18 },
    popupConfirmBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    popupConfirmText: { color: 'white', fontSize: 16, fontWeight: '700' },
    
    // New Matrix & History Styles
    topographyPlot: { position: 'relative', height: 160, width: '100%', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
    topographyGrid: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', flexWrap: 'wrap' },
    gridCell: { width: '50%', height: '50%', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.02)' },
    gridLabel: { fontSize: 10, fontWeight: '800', color: THEME.primary, opacity: 0.2, textTransform: 'uppercase' },
    historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyDateBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F7F6', alignItems: 'center', justifyContent: 'center' },
    historyDateText: { fontSize: 11, fontWeight: '800', color: THEME.primary, opacity: 0.5 },
    historyContent: { flex: 1, gap: 2 },
    historyMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    historyNodeName: { fontSize: 14, fontWeight: '800', color: THEME.primary },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusBadgeText: { fontSize: 9, fontWeight: '800' },
    historyTopic: { fontSize: 12, color: THEME.textMuted, fontWeight: '600' },
    historyMetrics: { alignItems: 'flex-end', gap: 4 },
    miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    miniMetricValue: { fontSize: 10, fontWeight: '800', color: THEME.primary, opacity: 0.6 },
});
