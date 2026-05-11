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
import { useSelfTimeStore } from '../../store/useSelfTimeStore';
import { useAppStore } from '../../store/useAppStore';

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

const ZONE_COLORS: Record<number, string> = {
    1: '#FFB74D',
    2: '#D98B73',
    3: '#4A5D4E',
    4: '#90A4AE',
    5: '#D1D5DB'
};

export const SelfHealthReport = ({ onBack, onViewAllHistory, onSelectRelationship }: { onBack: () => void; onViewAllHistory?: () => void; onSelectRelationship?: (id: string) => void }) => {
    const colors = useColors();
    const textMuted = colors.gray[500];
    const [period, setPeriod] = useState<'주간' | '월간' | '연간'>('주간');
    const [infoModal, setInfoModal] = useState<{ visible: boolean; type: 'energy' | 'pulse' | 'oxytocin' | 'cortisol' | null }>({ visible: false, type: null });
    const { pulseStats, pulsePoints, energyTotal, stats, dateRange, selfTimeStats } = useSelfHealthData(period);
    const relationships = useRelationshipStore(state => state.relationships);
    const selfTimeEntries = useSelfTimeStore(state => state.entries);
    const { setRelationshipLogModalOpen, setSelfTimeModalOpen } = useAppStore();

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

    const renderSelfTimeCard = () => {
        if (!selfTimeStats || selfTimeStats.selfTimeCount === 0) return null;

        return (
            <View style={[styles.card, { backgroundColor: 'rgba(74,140,140,0.06)', borderColor: 'rgba(74,140,140,0.15)', borderWidth: 1, shadowOpacity: 0, elevation: 0 }]}>
                <View style={[styles.cardHeader, { marginBottom: 12 }]}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.cardTitle, { color: '#4A8C8C' }]}>나와의 시간 요약</Text>
                            <Leaf size={16} color="#4A8C8C" opacity={0.7} />
                        </View>
                        <Text style={styles.cardSubtitle}>이번 {period} 충전 리포트</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: colors.primary, opacity: 0.6, marginBottom: 4 }}>총 충전 시간</Text>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A8C8C' }}>{selfTimeStats.totalRestoreMinutes}<Text style={{ fontSize: 12 }}>분</Text></Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: colors.primary, opacity: 0.6, marginBottom: 4 }}>베스트 휴식</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 4 }}>{selfTimeStats.bestCategory}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: colors.primary, opacity: 0.6, marginBottom: 4 }}>회복 델타</Text>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#7BA67E' }}>+{selfTimeStats.avgRestorationDelta}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEnergyChart = () => {
        const { interactionCounts, selfTimeCounts, avgTemps, labels } = stats;
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
                        <Text style={styles.legendLabel}>교류량</Text>
                    </View>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: '#4A8C8C' + '50' }]} />
                        <Text style={styles.legendLabel}>나의 시간 (회복)</Text>
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
                                <View style={[styles.interactionBar, { height: `${val}%`, backgroundColor: THEME.secondary + '30', position: 'absolute', bottom: 0 }]} />
                                {selfTimeCounts && selfTimeCounts[i] > 0 && (
                                    <View style={[styles.interactionBar, { height: `${selfTimeCounts[i]}%`, backgroundColor: '#4A8C8C' + '80', position: 'absolute', bottom: 0 }]} />
                                )}
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


    const renderGlobalSocialTopography = () => {
        const matrixWidth = width - 48; // padding account
        const svgWidth = 200;
        const svgHeight = 160;

        const pointMap = new Map<string, any[]>();
        const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };

        relationships.forEach((node) => {
            // [Platformization] Use pure interaction data only
            const interactions = node.interactions || [];
            if (interactions.length === 0) return;

            const lastInteraction = interactions[interactions.length - 1];
            const sat = lastInteraction.satisfaction ?? 50;
            const drain = lastInteraction.energyDrain ?? 50;
            
            if (sat < 50 && drain >= 50) counts.q1++;
            else if (sat >= 50 && drain >= 50) counts.q2++;
            else if (sat < 50 && drain < 50) counts.q3++;
            else if (sat >= 50 && drain < 50) counts.q4++;

            const key = `${sat}_${drain}`;
            if (!pointMap.has(key)) pointMap.set(key, []);
            pointMap.get(key)!.push({ ...node, sat, drain });
        });


        return (
            <>
                <View style={[styles.card, { paddingVertical: 24, paddingHorizontal: 16 }]}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>정서적 관계 지형도</Text>
                            <Text style={styles.cardSubtitle}>전체 인맥의 관계 밸런스 조감</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                        {/* Vertical Label (Left) */}
                        <View style={{ width: 24, height: 160, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ 
                                fontSize: 8, 
                                fontWeight: '800', 
                                color: THEME.primary, 
                                opacity: 0.5, 
                                transform: [{ rotate: '-90deg' }],
                                width: 160,
                                textAlign: 'center'
                            }}>
                                낮음 ← 만족도 → 높음
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <View style={styles.topographyPlot}>
                                <View style={styles.topographyGrid}>
                                    {/* Top Row: Satisfaction High */}
                                    <View style={[styles.gridCell, { backgroundColor: '#4A5D4E08' }]}>
                                        <Text style={[styles.gridLabel, { color: '#4A5D4E' }]}>편안한 사이</Text>
                                        <Text style={[styles.gridLabelSub]}>저절로 기운이 나요</Text>
                                        <View style={styles.countBadge}><Text style={styles.countText}>{counts.q4}</Text></View>
                                    </View>
                                    <View style={[styles.gridCell, { backgroundColor: '#FFB74D08' }]}>
                                        <Text style={[styles.gridLabel, { color: '#FFB74D' }]}>뜨거운 사이</Text>
                                        <Text style={[styles.gridLabelSub]}>에너지가 넘쳐나요</Text>
                                        <View style={styles.countBadge}><Text style={styles.countText}>{counts.q2}</Text></View>
                                    </View>
                                    {/* Bottom Row: Satisfaction Low */}
                                    <View style={[styles.gridCell, { backgroundColor: '#90A4AE08' }]}>
                                        <Text style={[styles.gridLabel, { color: '#90A4AE' }]}>평범한 사이</Text>
                                        <Text style={[styles.gridLabelSub]}>그냥 무난한 사이예요</Text>
                                        <View style={styles.countBadge}><Text style={styles.countText}>{counts.q3}</Text></View>
                                    </View>
                                    <View style={[styles.gridCell, { backgroundColor: '#D98B7308' }]}>
                                        <Text style={[styles.gridLabel, { color: '#D98B73' }]}>지치는 사이</Text>
                                        <Text style={[styles.gridLabelSub]}>마음이 조금 무거워요</Text>
                                        <View style={styles.countBadge}><Text style={styles.countText}>{counts.q1}</Text></View>
                                    </View>
                                </View>

                                <Svg height="160" width="100%" viewBox="0 0 200 160" style={{ position: 'absolute' }}>
                                    {/* Central Axes Lines */}
                                    <Line x1="0" y1="80" x2="200" y2="80" stroke={THEME.primary} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                                    <Line x1="100" y1="0" x2="100" y2="160" stroke={THEME.primary} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />

                                    {/* Data Points */}
                                    {Array.from(pointMap.entries()).flatMap(([key, nodes]) => {
                                        const sat = nodes[0].sat;
                                        const drain = nodes[0].drain;
                                        const centerX = (drain / 100) * 200;
                                        const centerY = 160 - (sat / 100) * 160;

                                        return nodes.map((node, i) => {
                                            const angle = (i * 360 / nodes.length) * (Math.PI / 180);
                                            const offset = nodes.length > 1 ? 8 : 0;
                                            return (
                                                <Circle
                                                    key={`${node.id}-${i}`}
                                                    cx={centerX + offset * Math.cos(angle)}
                                                    cy={centerY + offset * Math.sin(angle)}
                                                    r="4"
                                                    fill={ZONE_COLORS[node.zone as keyof typeof ZONE_COLORS] || THEME.primary}
                                                    stroke="white"
                                                    strokeWidth="1"
                                                    opacity={0.8}
                                                />
                                            );
                                        });
                                    })}
                                </Svg>
                            </View>

                            {/* Horizontal Label (Bottom) */}
                            <Text style={{ 
                                fontSize: 8, 
                                fontWeight: '800', 
                                color: THEME.primary, 
                                opacity: 0.5, 
                                textAlign: 'center',
                                marginTop: 8
                            }}>
                                낮음 ← 에너지 → 높음
                            </Text>
                        </View>
                    </View>
                </View>
                
                <View style={styles.chartLegendRow}>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: ZONE_COLORS[1] }]} />
                        <Text style={styles.legendLabel}>Z1</Text>
                    </View>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: ZONE_COLORS[2] }]} />
                        <Text style={styles.legendLabel}>Z2</Text>
                    </View>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: ZONE_COLORS[3] }]} />
                        <Text style={styles.legendLabel}>Z3</Text>
                    </View>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: ZONE_COLORS[4] }]} />
                        <Text style={styles.legendLabel}>Z4</Text>
                    </View>
                    <View style={styles.legendGroup}>
                        <View style={[styles.legendBarIndicator, { backgroundColor: ZONE_COLORS[5] }]} />
                        <Text style={styles.legendLabel}>Z5</Text>
                    </View>
                </View>
            </>
        );
    };

    const renderCheckInHistory = () => {
        // 1. 인맥 교류 기록 (RelationshipStore.history)
        const interactionHistory = relationships.flatMap(node =>
            (node.history || []).map(h => ({
                id: h.id,
                type: 'interaction' as const,
                nodeId: node.id,
                nodeName: node.name,
                nodeImage: node.image,
                date: h.date,
                createdAt: h.createdAt || h.date, // Fallback for old data
                title: h.title || h.event || '교류',
                satisfaction: h.satisfaction,
                energyDrain: h.energyDrain,
                closeness: h.closeness ?? node.temperature,
            }))
        );

        // 2. 나와의 시간 기록 (SelfTimeStore.entries)
        const selfTimeHistory = (selfTimeEntries || []).filter(e => !e.isDeleted).map(e => ({
            id: e.id,
            type: 'selfTime' as const,
            nodeId: null as null,
            nodeName: '나와의 시간',
            nodeImage: null as null,
            date: e.createdAt.split('T')[0],
            createdAt: e.createdAt,
            title: e.activityName || '자기돌봄',
            satisfaction: e.emotionalSatisfaction,
            energyDrain: e.physicalEnergy,
            temperature: e.emotionalSatisfaction,
        }));

        // 3. 합쳐서 시간순 정렬, 최신 10개
        const getRelativeTime = (dateStr: string) => {
            const now = new Date();
            const past = new Date(dateStr);
            const diffMs = now.getTime() - past.getTime();
            const diffMin = Math.floor(diffMs / (1000 * 60));
            const diffHr = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHr / 24);

            if (diffMin < 1) return '방금 전';
            if (diffMin < 60) return `${diffMin}분 전`;
            if (diffHr < 24) return `${diffHr}시간 전`;
            if (diffDay === 1) return '어제';
            if (diffDay < 7) return `${diffDay}일 전`;
            return past.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        };

        const allHistory = [...interactionHistory, ...selfTimeHistory]
            .filter(h => h.createdAt && !isNaN(new Date(h.createdAt).getTime()))
            .sort((a, b) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeB - timeA;
            })
            .slice(0, 10);

        if (allHistory.length === 0) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardTitle}>전체 활동 히스토리</Text>
                        </View>
                        <Text style={styles.cardSubtitle}>인맥 교류 + 나와의 시간 통합 기록</Text>
                    </View>
                </View>
                {allHistory.map((h, i) => {
                    const dateStr = new Date(h.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                    const timeStr = new Date(h.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const isSelfTime = h.type === 'selfTime';
                    // 교류 활동의 라벨은 '현재 친밀도'가 아닌 '활동 자체의 질(만족도 vs 에너지 소모)'로 결정
                    const isPositive = isSelfTime ? true : ((h.satisfaction || 0) >= (h.energyDrain || 0));
                    const badgeColor = isSelfTime ? '#4A8C8C' : (isPositive ? colors.accent : '#8C968D');
                    const badgeLabel = isSelfTime ? '나만의시간' : (isPositive ? '긍정' : '소모');

                    return (
                        <TouchableOpacity
                            key={`${h.type}-${h.id}-${i}`}
                            style={[styles.historyItem, { marginBottom: 16 }]}
                            onPress={() => {
                                const title = h.title || '';
                                // 시스템 로그 및 초기 데이터는 수정 불가 (팝업 없음)
                                const isSystemLog = title.includes('초기') || 
                                                  title.includes('등록') || 
                                                  title.includes('추가') || 
                                                  title.includes('반영') || 
                                                  title.includes('진단') || 
                                                  title.includes('재설정') || 
                                                  title.includes('조율') || 
                                                  title.includes('업데이트');
                                
                                if (isSystemLog) return;

                                if (isSelfTime) {
                                    useAppStore.setState({ editingLogId: h.id, isSelfTimeModalOpen: true });
                                } else if (h.nodeId) {
                                    setRelationshipLogModalOpen(true, h.nodeId, h.id);
                                }
                            }}
                        >
                            <View style={[styles.historyDateBox, isSelfTime && { backgroundColor: 'rgba(74,140,140,0.12)', borderColor: 'rgba(74,140,140,0.2)' }]}>
                                <Text style={[styles.historyDateText, isSelfTime && { color: '#4A8C8C' }]}>{getRelativeTime(h.createdAt)}</Text>
                                <Text style={[styles.historyTimeText, isSelfTime && { color: '#4A8C8C' }]}>{timeStr}</Text>
                            </View>
                            <View style={styles.historyContent}>
                                <View style={styles.historyMainRow}>
                                    <Text style={styles.historyNodeName}>
                                        {isSelfTime ? '🌿 나' : h.nodeName}
                                    </Text>
                                    <View style={[styles.statusBadge, { backgroundColor: badgeColor + '20' }]}>
                                        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                                            {badgeLabel}
                                        </Text>
                                    </View>
                                </View>
                                {/* ✅ title 필드로 실제 제목 표시 */}
                                <Text style={styles.historyTopic} numberOfLines={1}>{h.title}</Text>
                            </View>
                            <View style={styles.historyMetrics}>
                                {(() => {
                                    const title = h.title || '';
                                    const isInitialOrSystem = title.includes('초기') || 
                                                             title.includes('등록') || 
                                                             title.includes('추가') || 
                                                             title.includes('진단') || 
                                                             title.includes('재설정') ||
                                                             title.includes('업데이트');
                                    
                                    // 조율이나 체크인이 아닌 순수 시스템 로그는 수치 미표시
                                    const showPercentage = !isInitialOrSystem;
                                    const isSystemLog = isInitialOrSystem || title.includes('조율') || title.includes('반영');

                                    if (!showPercentage) return null;

                                    return (
                                        <View style={[styles.miniMetric, { backgroundColor: isSelfTime ? 'rgba(74,140,140,0.1)' : 'rgba(217,139,115,0.1)' }]}>
                                            <Text style={[styles.miniMetricLabel, { color: isSelfTime ? '#4A8C8C' : colors.accent }]}>
                                                {isSelfTime ? '회복' : '교감'}
                                            </Text>
                                            <Text style={[styles.miniMetricValue, { color: isSelfTime ? '#4A8C8C' : colors.accent }]}>
                                                {Math.round(h.satisfaction || (h as any).closeness || h.temperature || 0)}%
                                            </Text>
                                        </View>
                                    );
                                })()}
                                {(() => {
                                    const title = h.title || '';
                                    const isSystemLog = title.includes('초기') || 
                                                      title.includes('등록') || 
                                                      title.includes('추가') || 
                                                      title.includes('반영') || 
                                                      title.includes('진단') || 
                                                      title.includes('재설정') || 
                                                      title.includes('조율') || 
                                                      title.includes('업데이트');
                                    return !isSystemLog ? (
                                        <Edit3 size={12} color={colors.primary} opacity={0.3} style={{ marginTop: 4 }} />
                                    ) : null;
                                })()}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <TouchableOpacity
                    style={{ marginTop: 8, alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)' }}
                    onPress={onViewAllHistory}
                >
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', opacity: 0.6 }}>전체 활동 기록 보기 ➔</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCheckInPulse = () => {
        const CHART_WIDTH = 300;
        const CHART_HEIGHT = 120;

        const points = pulsePoints.map((pt, i) => {
            const temp = pt.value;
            const denominator = pulsePoints.length > 1 ? pulsePoints.length - 1 : 1;
            const x = (i / denominator) * CHART_WIDTH;
            const safeTemp = (temp === null || isNaN(temp)) ? 50 : temp;
            const y = 100 - (safeTemp * 0.8);
            return { x, y, isSelfTime: pt.isSelfTime };
        });

        const linePoints = points.map(p => `${p.x},${p.y}`);
        const linePath = `M ${linePoints.join(' L ')}`;
        const fillPath = `M 0,${CHART_HEIGHT} L ${linePoints.join(' L ')} L ${CHART_WIDTH},${CHART_HEIGHT} Z`;

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
                        
                        {/* 🌿 나와의 시간 마커 (Self-Time Overlays) */}
                        {points.filter(p => p.isSelfTime).map((p, idx) => (
                            <Circle key={idx} cx={p.x} cy={p.y} r="5" fill="#4A8C8C" stroke="white" strokeWidth="2" />
                        ))}
                        
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
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#4A8C8C' }]} />
                            <Text style={styles.legendText}>나의시간</Text>
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
                subtitle: 'RQS 관계 분석 기준',
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
                subtitle: '나의 활동과 마음 온도',
                items: [
                    { label: '교류량', desc: '소중한 사람들과 얼마나 자주 어울렸는지 보여주는 횟수예요.' },
                    { label: '나의 시간 (회복)', desc: '일기를 쓰거나 휴식을 취하는 등, 나를 돌보는 데 쓴 시간이에요.' },
                    { label: '정서 온도', desc: '그날 누구와 함께, 혹은 혼자서 마음이 얼마나 편안했는지 보여주는 평균 온도예요.\n온도가 높다고 무조건 좋고, 낮다고 나쁜 건 아니에요! 내 마음의 온도가 어떻게 변하는지 지켜보는 것이 더 중요해요.' },
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
                    {renderSelfTimeCard()}
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
    chartWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
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
    topographyPlot: { position: 'relative', height: 160, width: '100%', marginVertical: 12 },
    topographyGrid: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', flexWrap: 'wrap' },
    gridCell: { width: '50%', height: '50%', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.02)' },
    gridLabel: { fontSize: 10, fontWeight: '900', color: THEME.primary, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 },
    gridLabelSub: { fontSize: 8, fontWeight: '600', color: THEME.primary, opacity: 0.35, marginTop: 2 },
    historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyDateBox: {
        minWidth: 52,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: '#F5F7F6',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyDateText: { fontSize: 10, fontWeight: '800', color: THEME.primary, opacity: 0.6 },
    historyTimeText: { fontSize: 9, color: THEME.primary, opacity: 0.35, marginTop: 2, fontWeight: '500' },
    historyContent: { flex: 1, gap: 2 },
    historyMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    historyNodeName: { fontSize: 14, fontWeight: '800', color: THEME.primary },
    miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    miniMetricLabel: { fontSize: 9, fontWeight: '800', opacity: 0.8 },
    miniMetricValue: { fontSize: 10, fontWeight: '900' },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusBadgeText: { fontSize: 9, fontWeight: '800' },
    historyTopic: { fontSize: 12, color: THEME.textMuted, fontWeight: '600' },
    historyMetrics: { alignItems: 'flex-end', gap: 4 },
    ctaBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});
