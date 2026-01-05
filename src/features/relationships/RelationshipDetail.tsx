import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Alert } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, ArrowRight, MoreHorizontal, Activity, Heart, Calendar, Zap, HeartPulse, CheckCircle2, Plus, Info, X, RefreshCw, Edit3, Shield, TrendingUp, HelpCircle, ChevronRight } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');

interface RelationshipDetailProps {
    relationshipId: string;
    onBack: () => void;
    onDiagnose: (mode: "ZONE" | "RQS") => void;
    onManageProfile: () => void;
    onViewReport: () => void;
}

export const RelationshipDetail = ({ relationshipId, onBack, onDiagnose, onManageProfile, onViewReport }: RelationshipDetailProps) => {
    const colors = useColors();
    const node = useRelationshipStore(state => state.relationships.find(r => r.id === relationshipId));

    if (!node) return null;

    const getRQSData = () => {
        if (!node || !node.rqsResult) return null;
        const { grade, areaScores, totalScore } = node.rqsResult;
        const grades: Record<string, any> = {
            S: { name: 'Soul Anchor', color: '#D98B73', desc: '회복탄력성을 지탱하는 가장 소중한 존재입니다.' },
            A: { name: 'Vision Mirror', color: '#4A5D4E', desc: '건강한 자아상을 강화하는 든든한 조력자입니다.' },
            B: { name: 'Neutral', color: '#8A9A8D', desc: '적절한 사회적 거리를 유지 중인 중립 관계입니다.' },
            C: { name: 'Vampire', color: '#2C2C2C', desc: '에너지 소모가 큰 관계입니다. 정서적 경계가 필요합니다.' },
        };
        return { ...grades[grade], score: totalScore, areas: areaScores };
    };

    const rqs = getRQSData();
    const stability = rqs ? Math.round((rqs.areas.safety / 4) * 100) : Math.round(node.metrics.trust);
    const oxytocin = rqs ? Math.round((rqs.areas.vitality + rqs.areas.reciprocity) / 8 * 100) : 85;
    const cortisol = rqs ? Math.round((4 - rqs.areas.safety) / 4 * 100) : 32;

    const getZoneGuide = (zone: number): { name: string; count: string; energy: string; desc: string } => {
        const guides: Record<number, any> = {
            1: { name: '안전 기지', count: '1~5명', energy: '50%', desc: '무조건적인 수용과 정서적 안전감 제공' },
            2: { name: '심리적 우군', count: '10~15명', energy: '25%', desc: '가치관을 공유하며 정기적으로 교류함' },
            3: { name: '전략적 동행', count: '유동적', energy: '15%', desc: '업무/필요에 의해 자주 보나 유대는 낮음' },
            4: { name: '사회적 지인', count: '최대 150명', energy: '10%', desc: '이름과 얼굴을 아는 인지적 한계선' },
            5: { name: '배경 소음', count: '무제한', energy: '0%', desc: '인지 범위 밖의 타인 및 불필요한 연결' },
        };
        return guides[zone] || guides[5];
    };

    const getMetricStatus = (type: 'stability' | 'intimacy' | 'oxytocin' | 'cortisol', value: number) => {
        if (type === 'stability') {
            if (value >= 70) return { label: '견고함', color: '#4CAF50', desc: '신뢰 자본이 충분히 축적된 상태입니다.' };
            if (value >= 40) return { label: '보통', color: '#8A9A8D', desc: '일정한 신뢰를 유지하고 있습니다.' };
            return { label: '취약함', color: '#F44336', desc: '작은 갈등에도 관계가 흔들릴 수 있습니다.' };
        }
        if (type === 'intimacy') {
            if (value >= 80) return { label: '매우 깊음', color: '#FF5252', desc: '서로의 내면을 깊이 공유하는 상태입니다.' };
            if (value >= 40) return { label: '친밀함', color: '#D98B73', desc: '정서적 교감이 활발히 일어나고 있습니다.' };
            return { label: '서먹함', color: '#999999', desc: '공적인 관계나 거리감이 있는 상태입니다.' };
        }
        if (type === 'oxytocin') {
            if (value >= 60) return { label: '정서 치유', color: '#4CAF50', desc: '함께 있을 때 정서적 회복이 일어납니다.' };
            return { label: '건조함', color: '#8A9A8D', desc: '정서적 충만감이 다소 부족한 상태입니다.' };
        }
        if (type === 'cortisol') {
            if (value >= 60) return { label: '에너지 고갈', color: '#F44336', desc: '상호작용 시 심리적 피로도가 높습니다.' };
            if (value >= 30) return { label: '주의', color: '#FF9800', desc: '약간의 긴장이나 눈치 보기가 존재합니다.' };
            return { label: '편안함', color: '#4CAF50', desc: '상대 앞에서 가면 없이 편안한 상태입니다.' };
        }
        return { label: '', color: '#000', desc: '' };
    };

    const METRIC_GUIDE = {
        stability: { title: '안정성 (Stability)', info: '관계 내 심리적 안전감과 신뢰의 두께를 의미합니다. 70% 이상일 때 안정적입니다.' },
        intimacy: { title: '친밀도 (Intimacy)', info: '정서적 공명과 자발적 연결의 강도입니다. 80% 이상은 소울메이트 수준의 결합을 뜻합니다.' },
        oxytocin: {
            title: '옥시토신 (Oxytocin)',
            sub: '유대감과 치유의 호르몬',
            info: '상대와 정서적으로 깊이 연결되어 있다고 느낄 때 분비되는 사랑과 신뢰의 물질입니다. 높은 수치는 이 관계가 당신에게 정서적 안도감과 회복의 에너지를 주는 "안전 기지"임을 의미합니다.'
        },
        cortisol: {
            title: '코르티솔 (Cortisol)',
            sub: '긴장과 스트레스 호르몬',
            info: '상호작용 시 긴장하거나 위협, 무시를 느낄 때 분비되는 스트레스 반응 물질입니다. 높은 수치가 지속되면 관계 자체가 심리적 부채가 되어 심신을 고갈시키며, 건강한 판단을 어렵게 만듭니다.'
        },
        zone: {
            title: '오빗 존 (Orbit Zone)',
            info: '당신의 인간관계망에서 이 사람이 차지하는 공식적인 위치입니다. 각 존에 맞는 적절한 심리적 에너지 배분이 당신의 평온한 일상을 유지하는 핵심입니다.'
        }
    };

    const [activePopup, setActivePopup] = useState<keyof typeof METRIC_GUIDE | null>(null);

    const renderReportEntry = () => {
        if (!rqs) return null;

        return (
            <TouchableOpacity
                style={[styles.reportEntryBtn, { backgroundColor: colors.white }]}
                onPress={onViewReport}
                activeOpacity={0.8}
            >
                <View style={[styles.reportIconBg, { backgroundColor: colors.accent + '15' }]}>
                    <Activity size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.reportEntryTitle, { color: colors.primary }]}>정기 진단 리포트</Text>
                    <Text style={[styles.reportEntrySub, { color: colors.primary }]}>
                        {rqs.name} • 스코어 {rqs.score}
                    </Text>
                </View>
                <View style={[styles.reportGradeBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.reportGradeText}>{node.rqsResult?.grade}</Text>
                </View>
                <ChevronRight size={18} color={colors.primary} opacity={0.3} />
            </TouchableOpacity>
        );
    };

    const renderHistoryChart = () => {
        if (!node.history || node.history.length < 2) return null;

        const chartHeight = 120;
        const chartWidth = width - 80; // Adjust for some padding
        const maxVal = 100;
        const data = node.history.slice(-5); // 최근 5개만
        const stepX = chartWidth / (data.length - 1);

        const getPath = (key: 'temperature' | 'oxytocin' | 'cortisol') => {
            const points = data.map((item, i) => {
                const val = item[key] || 0;
                return {
                    x: i * stepX,
                    y: chartHeight - (val / maxVal) * chartHeight
                };
            });

            // Curved path (simple bezier)
            let path = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 2;
                path += ` C ${cp1x} ${points[i].y}, ${cp1x} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
            }
            return { path, points };
        };

        const tempLine = getPath('temperature');
        const oxyLine = getPath('oxytocin');
        const cortLine = getPath('cortisol');

        return (
            <View style={[styles.historySection, { backgroundColor: colors.white }]}>
                <View style={styles.historyHeader}>
                    <TrendingUp size={18} color={colors.primary} />
                    <Text style={[styles.historyTitle, { color: colors.primary }]}>관계 지표 변화 추이</Text>
                    <View style={styles.historyLegend}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.accent }]} /><Text style={styles.legendText}>온도</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.legendText}>옥시</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F44336' }]} /><Text style={styles.legendText}>코르</Text></View>
                    </View>
                </View>

                <View style={styles.chartArea}>
                    <Svg height={chartHeight} width={chartWidth + 4} style={{ overflow: 'visible' }}>
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((val) => (
                            <Line
                                key={val}
                                x1="0" y1={chartHeight - (val / 100) * chartHeight}
                                x2={chartWidth} y2={chartHeight - (val / 100) * chartHeight}
                                stroke={colors.primary + '10'} strokeWidth="1"
                            />
                        ))}

                        {/* Temperature Line */}
                        <Path d={tempLine.path} stroke={colors.accent} strokeWidth={3} fill="none" opacity={0.8} />
                        {/* Oxytocin Line */}
                        <Path d={oxyLine.path} stroke="#4CAF50" strokeWidth={3} fill="none" opacity={0.6} />
                        {/* Cortisol Line */}
                        <Path d={cortLine.path} stroke="#F44336" strokeWidth={3} fill="none" opacity={0.6} />

                        {/* Points */}
                        {tempLine.points.map((p, i) => <Circle key={`t-${i}`} cx={p.x} cy={p.y} r={4} fill={colors.accent} />)}
                        {oxyLine.points.map((p, i) => <Circle key={`o-${i}`} cx={p.x} cy={p.y} r={3} fill="#4CAF50" />)}
                        {cortLine.points.map((p, i) => <Circle key={`c-${i}`} cx={p.x} cy={p.y} r={3} fill="#F44336" />)}
                    </Svg>
                </View>
                <View style={styles.chartXLabels}>
                    {data.map((item, i) => (
                        <Text key={i} style={styles.xLabelText}>{item.date.split('-').slice(1).join('/')}</Text>
                    ))}
                </View>
            </View>
        );
    };

    const handleHealthCheck = () => {
        Alert.alert(
            "Relationship Health Check",
            "어떤 진단을 다시 진행하시겠습니까?",
            [
                {
                    text: "오빗 존(Zone) 재설정",
                    onPress: () => onDiagnose('ZONE')
                },
                {
                    text: "질적 캐릭터 심화 진단",
                    onPress: () => onDiagnose('RQS')
                },
                {
                    text: "취소",
                    style: "cancel"
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.background + 'E6' }]}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Social Orbit Intelligence</Text>
            <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                    Alert.alert(
                        "관리",
                        "수행할 작업을 선택하세요.",
                        [
                            { text: "프로필 정보 관리", onPress: onManageProfile },
                            { text: "진단 기록 보기", onPress: () => { } },
                            { text: "취소", style: "cancel" }
                        ]
                    );
                }}
            >
                <MoreHorizontal size={24} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <HubLayout header={renderHeader()} scrollable>
                <View style={styles.container}>
                    {/* Profile Section */}
                    <TouchableOpacity
                        style={styles.profileContainer}
                        onPress={onManageProfile}
                        activeOpacity={0.7}
                    >
                        <View style={styles.auraBlur} />
                        <View style={styles.avatarShadow}>
                            <View style={[styles.avatarWrapper, { backgroundColor: colors.white }]}>
                                {node.image ? (
                                    <Image source={{ uri: node.image }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Activity size={40} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                                <Activity color={colors.white} size={18} />
                            </View>
                            <View style={[styles.editBadge, { backgroundColor: colors.accent }]}>
                                <Edit3 color={colors.white} size={10} />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.name, { color: colors.primary }]}>{node.name}</Text>
                            <View style={styles.tagRow}>
                                {node.role && (
                                    <View style={[styles.tag, { backgroundColor: colors.accent + '1A' }]}>
                                        <Text style={[styles.tagText, { color: colors.accent }]}>{node.role}</Text>
                                    </View>
                                )}
                                <View style={styles.zoneTagContainer}>
                                    <TouchableOpacity
                                        style={[styles.tag, { backgroundColor: colors.primary + '0D' }]}
                                        onPress={() => setActivePopup('zone')}
                                    >
                                        <Text style={[styles.tagText, { color: colors.primary, opacity: 0.8 }]}>
                                            Orbit {node.zone}: {getZoneGuide(node.zone).name}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.refreshIconBtn}
                                        onPress={() => onDiagnose('ZONE')}
                                    >
                                        <RefreshCw size={12} color={colors.primary} style={{ opacity: 0.5 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Compact Report Entry */}
                    {renderReportEntry()}

                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.white }]}
                            onPress={() => setActivePopup('stability')}
                        >
                            <View style={styles.statHeaderRow}>
                                <Text style={[styles.statLabel, { color: colors.primary, opacity: 0.4 }]}>안정성</Text>
                            </View>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stability}%</Text>
                            <View style={[styles.miniStatusBadge, { backgroundColor: getMetricStatus('stability', stability).color + '1A' }]}>
                                <Text style={[styles.miniStatusText, { color: getMetricStatus('stability', stability).color }]}>
                                    {getMetricStatus('stability', stability).label}
                                </Text>
                            </View>
                            <ChevronRight size={14} color={colors.accent} style={styles.cardArrow} />
                        </TouchableOpacity>

                        <View style={[styles.statCard, { backgroundColor: colors.white }]}>
                            <Text style={[styles.statLabel, { color: colors.primary, opacity: 0.4 }]}>최근 만남</Text>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{node.lastInteraction}</Text>
                            <Calendar size={16} color={colors.accent} />
                        </View>

                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.white }]}
                            onPress={() => setActivePopup('intimacy')}
                        >
                            <View style={styles.statHeaderRow}>
                                <Text style={[styles.statLabel, { color: colors.primary, opacity: 0.4 }]}>친밀도</Text>
                            </View>
                            <View style={styles.statContentRow}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{node.temperature}°</Text>
                                <Heart size={14} color={node.temperature > 80 ? "#FF5252" : "#999"} fill={node.temperature > 80 ? "#FF5252" : "transparent"} />
                            </View>
                            <View style={[styles.miniStatusBadge, { backgroundColor: getMetricStatus('intimacy', node.temperature).color + '1A' }]}>
                                <Text style={[styles.miniStatusText, { color: getMetricStatus('intimacy', node.temperature).color }]}>
                                    {getMetricStatus('intimacy', node.temperature).label}
                                </Text>
                            </View>
                            <ChevronRight size={14} color={colors.accent} style={styles.cardArrow} />
                        </TouchableOpacity>
                    </View>

                    {/* Temperature Graph */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>정서 온도 그래프</Text>
                            <View style={[styles.periodBadge, { backgroundColor: colors.primary + '0D' }]}>
                                <Text style={[styles.periodText, { color: colors.primary, opacity: 0.5 }]}>Weekly</Text>
                            </View>
                        </View>
                        <View style={[styles.graphCard, { backgroundColor: colors.white }]}>
                            <View style={styles.graphInfo}>
                                <View>
                                    <Text style={[styles.graphLabel, { color: colors.primary, opacity: 0.6 }]}>이번 주 평균</Text>
                                    <View style={styles.graphValueRow}>
                                        <Text style={[styles.graphMainValue, { color: colors.primary }]}>{node.temperature}°C</Text>
                                        <View style={styles.trendBadge}>
                                            <Text style={styles.trendText}>+0.4°</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                                    <Text style={[styles.legendText, { color: colors.primary, opacity: 0.4 }]}>감정 흐름</Text>
                                </View>
                            </View>

                            <View style={styles.svgContainer}>
                                <Svg height="100" width={width - 88} viewBox="0 0 300 100">
                                    <Defs>
                                        <LinearGradient id="gradientGraph" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.2" />
                                            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
                                        </LinearGradient>
                                    </Defs>
                                    <Line x1="0" y1="0" x2="300" y2="0" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.1" />
                                    <Line x1="0" y1="50" x2="300" y2="50" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.1" />
                                    <Line x1="0" y1="100" x2="300" y2="100" stroke={colors.primary} strokeWidth="0.5" opacity="0.1" />

                                    <Path
                                        d="M0,70 Q30,60 60,50 T120,30 T180,45 T240,20 T300,35 L300,100 L0,100 Z"
                                        fill="url(#gradientGraph)"
                                    />
                                    <Path
                                        d="M0,70 Q30,60 60,50 T120,30 T180,45 T240,20 T300,35"
                                        stroke={colors.accent}
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <Circle cx="60" cy="50" r="3" fill={colors.white} stroke={colors.accent} strokeWidth="2" />
                                    <Circle cx="120" cy="30" r="3" fill={colors.white} stroke={colors.accent} strokeWidth="2" />
                                    <Circle cx="180" cy="45" r="3" fill={colors.white} stroke={colors.accent} strokeWidth="2" />
                                    <Circle cx="240" cy="20" r="3" fill={colors.white} stroke={colors.accent} strokeWidth="2" />
                                </Svg>
                            </View>
                            <View style={styles.graphXAxis}>
                                {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
                                    <Text key={day} style={[styles.axisText, { color: colors.primary, opacity: 0.4 }]}>{day}</Text>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Timeline Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>정서적 개입 타임라인</Text>
                            <TouchableOpacity style={[styles.addTimelineBtn, { backgroundColor: colors.primary + '1A' }]}>
                                <Plus size={16} color={colors.primary} />
                                <Text style={[styles.addBtnText, { color: colors.primary }]}>기록</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.timelineCard, { backgroundColor: colors.white + '99' }]}>
                            <View style={[styles.timelineTrack, { backgroundColor: colors.primary + '1A' }]} />
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: colors.accent, borderColor: colors.white }]} />
                                <Text style={[styles.timelineTime, { color: colors.primary, opacity: 0.5 }]}>Today, 14:00</Text>
                                <Text style={[styles.timelineTitle, { color: colors.primary }]}>깊은 대화 공유</Text>
                                <Text style={[styles.timelineDesc, { color: colors.primary, opacity: 0.7 }]}>미래 계획에 대한 긍정적인 공감을 나누었습니다.</Text>
                            </View>
                            <View style={[styles.timelineItem, { marginBottom: 0 }]}>
                                <View style={[styles.timelineDot, { backgroundColor: colors.primary, borderColor: colors.white }]} />
                                <Text style={[styles.timelineTime, { color: colors.primary, opacity: 0.5 }]}>Yesterday</Text>
                                <Text style={[styles.timelineTitle, { color: colors.primary }]}>가벼운 안부 인사</Text>
                                <Text style={[styles.timelineDesc, { color: colors.primary, opacity: 0.7 }]}>점심 식사 사진을 공유하며 일상적인 대화.</Text>
                            </View>
                        </View>
                    </View>

                    {/* Impact Analysis */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.primary, paddingHorizontal: 4, marginBottom: 16 }]}>최근 상호 작용 영향 분석</Text>
                        <View style={styles.impactGrid}>
                            <TouchableOpacity
                                style={[styles.impactCard, { backgroundColor: colors.white }]}
                                onPress={() => setActivePopup('oxytocin')}
                            >
                                <View style={styles.impactLabelRow}>
                                    <View style={[styles.impactIconBg, { backgroundColor: getMetricStatus('oxytocin', oxytocin).color + '1A' }]}>
                                        <Heart size={14} color={getMetricStatus('oxytocin', oxytocin).color} fill={getMetricStatus('oxytocin', oxytocin).color} />
                                    </View>
                                    <Text style={[styles.impactLabel, { color: colors.primary }]}>옥시토신</Text>
                                </View>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${oxytocin}%`, backgroundColor: getMetricStatus('oxytocin', oxytocin).color }]} />
                                </View>
                                <View style={styles.impactValueRow}>
                                    <Text style={[styles.impactLevel, { color: getMetricStatus('oxytocin', oxytocin).color }]}>{getMetricStatus('oxytocin', oxytocin).label}</Text>
                                    <Text style={[styles.impactValue, { color: colors.primary }]}>{oxytocin}<Text style={{ fontSize: 10, opacity: 0.4 }}>%</Text></Text>
                                </View>
                                <Text style={styles.impactBrief}>{METRIC_GUIDE.oxytocin.sub}</Text>
                                <ChevronRight size={14} color={colors.accent} style={styles.cardArrowAbsolute} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.impactCard, { backgroundColor: colors.white }]}
                                onPress={() => setActivePopup('cortisol')}
                            >
                                <View style={styles.impactLabelRow}>
                                    <View style={[styles.impactIconBg, { backgroundColor: getMetricStatus('cortisol', cortisol).color + '1A' }]}>
                                        <Zap size={14} color={getMetricStatus('cortisol', cortisol).color} fill={getMetricStatus('cortisol', cortisol).color} />
                                    </View>
                                    <Text style={[styles.impactLabel, { color: colors.primary }]}>코르티솔</Text>
                                </View>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${cortisol}%`, backgroundColor: getMetricStatus('cortisol', cortisol).color }]} />
                                </View>
                                <View style={styles.impactValueRow}>
                                    <Text style={[styles.impactLevel, { color: getMetricStatus('cortisol', cortisol).color }]}>{getMetricStatus('cortisol', cortisol).label}</Text>
                                    <Text style={[styles.impactValue, { color: colors.primary }]}>{cortisol}<Text style={{ fontSize: 10, opacity: 0.4 }}>%</Text></Text>
                                </View>
                                <Text style={styles.impactBrief}>{METRIC_GUIDE.cortisol.sub}</Text>
                                <ChevronRight size={14} color={colors.accent} style={styles.cardArrowAbsolute} />
                            </TouchableOpacity>
                        </View>


                        {/* Layer Determination Checklist link */}
                        <TouchableOpacity
                            style={[styles.rediagnoseLink, { backgroundColor: 'rgba(74, 93, 78, 0.05)', marginTop: 24 }]}
                            onPress={() => onDiagnose("ZONE")}
                        >
                            <Shield size={14} color={colors.primary} style={{ opacity: 0.6 }} />
                            <Text style={[styles.rediagnoseText, { color: colors.primary }]}>관계 층위 판별 체크리스트 (오빗 존 재설정)</Text>
                            <ArrowRight size={14} color={colors.primary} />
                        </TouchableOpacity>

                        {/* RQS Re-diagnose link */}
                        <TouchableOpacity
                            style={[styles.rediagnoseLink, { marginTop: 10 }]}
                            onPress={() => onDiagnose("RQS")}
                        >
                            <Activity size={14} color={colors.accent} style={{ opacity: 0.6 }} />
                            <Text style={[styles.rediagnoseText, { color: colors.accent }]}>질적 캐릭터 심화 진단 다시 하기</Text>
                            <ArrowRight size={14} color={colors.accent} />
                        </TouchableOpacity>
                        <View style={{ height: 120 }} />
                    </View>
                </View>
            </HubLayout>

            {/* Floating Popup System */}
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
                                {('sub' in METRIC_GUIDE[activePopup]) && (
                                    <Text style={[styles.guideSubTitle, { color: colors.accent }]}>{(METRIC_GUIDE[activePopup] as any).sub}</Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setActivePopup(null)} style={styles.popupCloseBtn}>
                                <X size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.popupScrollContainer}>
                            <Text style={[styles.guideInfoText, { color: colors.primary }]}>
                                {METRIC_GUIDE[activePopup].info}
                            </Text>

                            {activePopup === 'zone' ? (
                                <View style={[styles.guideStatusBox, { backgroundColor: colors.primary + '0A' }]}>
                                    <View style={styles.tooltipMeta}>
                                        <View style={styles.metaItem}>
                                            <View style={[styles.metaDot, { backgroundColor: colors.accent }]} />
                                            <Text style={[styles.metaText, { color: colors.primary }]}>에너지 {getZoneGuide(node.zone).energy}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <View style={[styles.metaDot, { backgroundColor: colors.primary }]} />
                                            <Text style={[styles.metaText, { color: colors.primary }]}>권장 {getZoneGuide(node.zone).count}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.8 }]}>
                                        {getZoneGuide(node.zone).name}: {getZoneGuide(node.zone).desc}
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.guideStatusBox, { backgroundColor: getMetricStatus(activePopup as any, activePopup === 'stability' ? stability : activePopup === 'intimacy' ? node.temperature : activePopup === 'oxytocin' ? oxytocin : cortisol).color + '0D' }]}>
                                    <Text style={[styles.guideStatusLabel, { color: getMetricStatus(activePopup as any, activePopup === 'stability' ? stability : activePopup === 'intimacy' ? node.temperature : activePopup === 'oxytocin' ? oxytocin : cortisol).color }]}>
                                        현재 상태: {getMetricStatus(activePopup as any, activePopup === 'stability' ? stability : activePopup === 'intimacy' ? node.temperature : activePopup === 'oxytocin' ? oxytocin : cortisol).label}
                                    </Text>
                                    <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>
                                        {getMetricStatus(activePopup as any, activePopup === 'stability' ? stability : activePopup === 'intimacy' ? node.temperature : activePopup === 'oxytocin' ? oxytocin : cortisol).desc}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.popupConfirmBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setActivePopup(null)}
                        >
                            <Text style={styles.popupConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Floating Health Check Button */}
            <View style={styles.fabContainer}>
                <View style={[styles.fabLabel, { backgroundColor: colors.white + 'F2' }]}>
                    <Text style={[styles.fabLabelText, { color: colors.primary }]}>건강 확인</Text>
                </View>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.accent }]}
                    onPress={handleHealthCheck}
                >
                    <View style={styles.fabPulse} />
                    <HeartPulse color={colors.white} size={30} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(74, 93, 78, 0.05)',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    container: {
        paddingTop: 20,
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    auraBlur: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(217, 139, 115, 0.15)',
        top: -40,
    },
    avatarShadow: {
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 16,
    },
    avatarWrapper: {
        width: 112,
        height: 112,
        borderRadius: 56,
        padding: 4,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 52,
    },
    statusBadge: {
        position: 'absolute',
        right: -4,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileInfo: {
        alignItems: 'center',
        gap: 6,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 99,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    editBadge: {
        position: 'absolute',
        right: -2,
        top: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FCF9F2',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        gap: 4,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    section: {
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    periodBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '600',
    },
    graphCard: {
        borderRadius: 32,
        paddingHorizontal: 20,
        paddingVertical: 24,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    graphInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    graphLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    graphValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    graphMainValue: {
        fontSize: 30,
        fontWeight: '800',
    },
    trendBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    trendText: {
        color: '#2E7D32',
        fontSize: 12,
        fontWeight: '700',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    svgContainer: {
        height: 100,
        width: '100%',
        marginBottom: 8,
    },
    graphXAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    axisText: {
        fontSize: 12,
        fontWeight: '500',
    },
    timelineCard: {
        borderRadius: 32,
        padding: 24,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    timelineTrack: {
        position: 'absolute',
        top: 24,
        bottom: 24,
        left: 35,
        width: 2,
        borderRadius: 1,
    },
    timelineItem: {
        paddingLeft: 40,
        marginBottom: 24,
    },
    timelineDot: {
        position: 'absolute',
        left: 31,
        top: 4,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
    },
    timelineTime: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    timelineDesc: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
        marginTop: 4,
    },
    impactGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    impactCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        gap: 12,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    impactLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    impactIconBg: {
        padding: 6,
        borderRadius: 99,
    },
    impactLabel: {
        fontSize: 14,
        fontWeight: '800',
    },
    progressBg: {
        height: 4,
        backgroundColor: '#F5F5F5',
        borderRadius: 2,
        width: '100%',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    impactValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    impactLevel: {
        fontSize: 11,
        fontWeight: '600',
    },
    impactValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fabLabel: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fabLabelText: {
        fontSize: 11,
        fontWeight: '800',
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#D98B73',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    fabPulse: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#D98B73',
        opacity: 0.2,
        borderRadius: 32,
        transform: [{ scale: 1.25 }],
    },
    addTimelineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    addBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    zoneTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoBtn: {
        padding: 4,
    },
    tooltipMeta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '700',
    },
    refreshIconBtn: {
        padding: 6,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        marginLeft: -4,
    },
    rediagnoseLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        backgroundColor: 'rgba(217, 139, 115, 0.05)',
        borderRadius: 20,
    },
    rediagnoseText: {
        fontSize: 13,
        fontWeight: '700',
    },
    statHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    miniStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    miniStatusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    statContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    guideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    guideTitle: {
        fontSize: 16,
        fontWeight: '900',
    },
    guideSubTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
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
    impactBrief: {
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.4,
        marginTop: 4,
    },
    cardArrow: {
        opacity: 0.7,
        marginTop: 8,
    },
    cardArrowAbsolute: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        opacity: 0.7,
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
    popupCloseBtn: {
        padding: 8,
        marginRight: -8,
        marginTop: -8,
    },
    popupScrollContainer: {
        marginVertical: 20,
    },
    popupConfirmBtn: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    popupConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    // History Chart Styles
    historySection: {
        marginHorizontal: 20,
        marginTop: 24,
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '800',
        flex: 1,
    },
    historyLegend: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.6,
    },
    chartArea: {
        height: 120,
        marginBottom: 10,
        alignItems: 'center',
    },
    chartXLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    xLabelText: {
        fontSize: 9,
        fontWeight: '600',
        opacity: 0.4,
    },

    // Report Entry Styles
    reportEntryBtn: {
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 16,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    reportIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportEntryTitle: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    reportEntrySub: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.4,
        marginTop: 2,
    },
    reportGradeBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportGradeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
});
