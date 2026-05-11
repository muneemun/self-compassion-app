import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, ArrowRight, MoreHorizontal, Activity, Heart, Calendar, Zap, HeartPulse, CheckCircle2, Plus, Info, X, RefreshCw, Edit3, Shield, TrendingUp, HelpCircle, ChevronRight, Sparkles, Star, Trash2, Flame, Snowflake } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useAppStore } from '../../store/useAppStore';
import { getDynamicCharacter, DYNAMIC_CHARACTERS } from '../../types/relationship';

const { width } = Dimensions.get('window');

interface RelationshipDetailProps {
    relationshipId: string;
    onBack: () => void;
    onDiagnose: (mode: "ZONE" | "RQS") => void;
    onManageProfile: () => void;
    onViewReport: () => void;
    autoOpenLog?: boolean;
}

export const RelationshipDetail = ({ relationshipId, onBack, onDiagnose, onManageProfile, onViewReport, autoOpenLog }: RelationshipDetailProps) => {
    const colors = useColors();
    const node = useRelationshipStore(state => state.relationships.find(r => r.id === relationshipId));
    const addInteraction = useRelationshipStore(state => state.addInteraction);
    
    // 🧬 Sanitized Data (Crucial for Legacy Support)
    const safeHistory = useMemo(() => (node?.history || []).filter(h => h && h.date), [node?.history]);
    const safeInteractions = useMemo(() => (node?.interactions || []).filter(i => i && i.date), [node?.interactions]);

    // 🧬 Dynamic Character Calculation
    const dynamicCharacter = useMemo(() => node ? getDynamicCharacter(safeHistory) : null, [safeHistory]);

    if (!node) return null;

    // Log Modal State
    const setRelationshipLogModalOpen = useAppStore(state => state.setRelationshipLogModalOpen);
    const [showHealthCheckModal, setShowHealthCheckModal] = useState(false);
    const [graphPeriod, setGraphPeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');

    useEffect(() => {
        if (autoOpenLog) {
            setShowHealthCheckModal(true);
        }
    }, [autoOpenLog]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (graphPeriod === 'Weekly') return `${d.getDate()}일`;
        if (graphPeriod === 'Monthly') return `${d.getMonth() + 1}/${d.getDate()}`;
        return `${d.getMonth() + 1}월`;
    };

    // Graph Data Logic
    const historyData = useMemo(() => {
        if (safeHistory.length === 0) return null;

        const sorted = [...safeHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // 2개 미만이면 바로 리턴
        if (sorted.length < 2) return sorted;

        const now = new Date();
        let filtered = sorted;

        if (graphPeriod === 'Weekly') {
            const dateLimit = new Date();
            dateLimit.setDate(now.getDate() - 7);
            filtered = sorted.filter(d => new Date(d.date) >= dateLimit);
        } else if (graphPeriod === 'Monthly') {
            const dateLimit = new Date();
            dateLimit.setMonth(now.getMonth() - 1);
            filtered = sorted.filter(d => new Date(d.date) >= dateLimit);
        } else {
            // Yearly
            const dateLimit = new Date();
            dateLimit.setFullYear(now.getFullYear() - 1);
            filtered = sorted.filter(d => new Date(d.date) >= dateLimit);
        }

        if (filtered.length === 0) return sorted.slice(-1);
        return filtered;
    }, [safeHistory, graphPeriod]);

    const graphPaths = useMemo(() => {
        if (!historyData || historyData.length < 2) return null;

        const points = historyData.map((d, i) => ({
            x: i * (300 / (historyData.length - 1)),
            y: 100 - (d.closeness ?? d.temperature ?? 0)
        }));

        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 2;
            path += ` C ${cp1x} ${points[i].y}, ${cp1x} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
        }

        const fillPath = `${path} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

        return { path, fillPath, points };
    }, [historyData]);

    const trendText = useMemo(() => {
        if (!historyData || historyData.length < 2) return 'Start';
        const last = (historyData[historyData.length - 1] as any).closeness ?? historyData[historyData.length - 1].temperature ?? 0;
        const prev = (historyData[historyData.length - 2] as any).closeness ?? historyData[historyData.length - 2].temperature ?? 0;
        const diff = Math.round(last - prev);
        if (isNaN(diff)) return '0%';
        return diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%';
    }, [historyData]);

    // handleSaveLog removed in favor of global RelationshipLogModal

    // AI Analysis Logic
    const climateTrend = useMemo(() => {
        if (safeHistory.length < 2) return null;

        const sorted = [...safeHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const recent = sorted.slice(-3); 
        const previous = sorted.length > 3 ? sorted.slice(-6, -3) : sorted.slice(0, 1);

        const calcAvg = (list: any[], key: string) => {
            if (!list || list.length === 0) return 0;
            return list.reduce((sum, h) => sum + (h[key] || 0), 0) / list.length;
        };

        const recentSat = calcAvg(recent, 'satisfaction');
        const prevSat = calcAvg(previous, 'satisfaction');
        const satDiff = recentSat - prevSat;

        const recentDrain = calcAvg(recent, 'energyDrain');
        const prevDrain = calcAvg(previous, 'energyDrain');
        const drainDiff = recentDrain - prevDrain;

        return {
            satTrend: satDiff > 5 ? 'up' : satDiff < -5 ? 'down' : 'stable',
            drainTrend: drainDiff > 5 ? 'up' : drainDiff < -5 ? 'down' : 'stable',
            satDiff: Math.round(Math.abs(satDiff)),
            drainDiff: Math.round(Math.abs(drainDiff))
        };
    }, [safeHistory]);

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

    // 🌀 Calculate Dynamics (Active Interaction State)
    const dynamics = useMemo(() => {
        // Status Colors that fit the concept
        if (node.temperature >= 80) return { level: 'high', color: '#D98B73' }; // Flame concept
        if (node.temperature <= 40) return { level: 'low', color: '#90A4AE' };  // Snowflake concept
        return { level: 'medium', color: '#4A5D4E' }; // Normal Activity concept
    }, [node.temperature]);

    const getZoneGuide = (zone: number): { name: string; count: string; energy: string; desc: string; color: string, icon: any } => {
        const guides: Record<number, any> = {
            1: { name: '핵심 그룹', count: '1~5명', energy: '최대 지지', desc: '무조건적인 수용과 정서적 안전감 제공', color: '#FFB74D', icon: Heart },
            2: { name: '정서적 공유 그룹', count: '10~15명', energy: '정서 환기', desc: '가치관을 공유하며 정기적으로 교류함', color: '#D98B73', icon: Star },
            3: { name: '기능적 협력 관계', count: '유동적', energy: '일상 성취', desc: '업무/필요에 의해 자주 보나 유대는 낮음', color: '#4A5D4E', icon: Zap },
            4: { name: '단순 인지 관계', count: '최대 150명', energy: '사회적 연결', desc: '이름과 얼굴을 아는 인지적 한계선', color: '#90A4AE', icon: Calendar },
            5: { name: '배경 소음(외부 환경)', count: '무제한', energy: '간헐적 접촉', desc: '인지 범위 밖의 타인 및 불필요한 연결', color: '#D1D5DB', icon: Trash2 },
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
        stability: { title: '안정성 (Stability)', info: '관계 내 심리적 안전감과 신뢰의 두께를 의미합니다. 높을수록 갈등에도 흔들리지 않는 견고한 신뢰를 뜻합니다.' },
        intimacy: {
            title: '정서 긴밀도 (Emotional Temp)',
            info: '정서적 공명과 자발적 연결의 강도입니다.\n\n[긴밀도별 의미]\n🔥 81~100%: 깊은 유대감/치유 (소울메이트)\n☀️ 61~80%: 따뜻함/즐거움 (좋은 관계)\n☁️ 41~60%: 보통/일상적 (특별한 감정 없음)\n❄️ 0~40%: 냉랭함/스트레스 (관계 점검 필요)'
        },
        oxytocin: {
            title: '옥시토신 (Oxytocin)',
            sub: '유대감과 치유의 호르몬',
            info: '상대와 정서적으로 깊이 연결되어 있다고 느낄 때 분비되는 사랑과 신뢰의 물질입니다. 높은 수치는 이 관계가 당신에게 정서적 안도감과 회복의 에너지를 주는 "핵심 그룹"임을 의미합니다.'
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
                    <Text style={[styles.reportEntryTitle, { color: colors.primary }]}>심화 진단 리포트</Text>
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
        if (safeHistory.length < 2) return null;

        const chartHeight = 120;
        const chartWidth = width - 80; // Adjust for some padding
        const maxVal = 100;
        const data = safeHistory.slice(-5); // 최근 5개만
        const stepX = chartWidth / (data.length - 1);

        const getPath = (key: 'temperature' | 'oxytocin' | 'cortisol') => {
            const points = data.map((item, i) => {
                const val = (item as any)[key === 'temperature' ? 'closeness' : key] ?? (item as any)[key] ?? 0;
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
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.accent }]} /><Text style={styles.legendText}>긴밀도</Text></View>
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
        setShowHealthCheckModal(true);
    };

    const renderHealthCheckModal = () => (
        <Modal
            transparent
            visible={showHealthCheckModal}
            animationType="fade"
            onRequestClose={() => setShowHealthCheckModal(false)}
        >
            <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowHealthCheckModal(false)} />
                <View style={[styles.floatingPopupCard, { backgroundColor: colors.white, paddingHorizontal: 24, paddingVertical: 32 }]}>
                    <View style={styles.modalHeader}>
                        <View style={{ width: 24 }} />
                        <Text style={[styles.modalTitle, { color: colors.primary }]}>정서적 체크인</Text>
                        <TouchableOpacity onPress={() => setShowHealthCheckModal(false)}>
                            <X size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.selectedPersonHeader}>
                        <View style={[styles.largeAvatar, { borderColor: colors.primary }]}>
                            {node.image ? (
                                <Image source={{ uri: node.image }} style={styles.largeAvatarImg} />
                            ) : (
                                <Text style={{ fontSize: 32 }}>{(node.name || '?').charAt(0)}</Text>
                            )}
                        </View>
                        <Text style={[styles.actionTitle, { color: colors.primary }]}>{node.name}님</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.primary, opacity: 0.6 }]}>
                            관계를 건강하게 유지하기 위한{"\n"}진단 액션을 선택해 주세요
                        </Text>
                    </View>

                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={styles.actionCardLarge}
                            onPress={() => {
                                setShowHealthCheckModal(false);
                                setRelationshipLogModalOpen(true, relationshipId);
                            }}
                        >
                            <View style={[styles.actionIconBgLarge, { backgroundColor: '#F0F4F0' }]}>
                                <Edit3 size={24} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionLabelLarge, { color: colors.primary }]}>정서 기록</Text>
                                <Text style={[styles.actionDescLarge, { color: colors.primary, opacity: 0.5 }]}>오늘의 대화나 기분을 기록합니다</Text>
                            </View>
                            <ChevronRight size={20} color={colors.primary} opacity={0.3} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCardLarge}
                            onPress={() => {
                                setShowHealthCheckModal(false);
                                onDiagnose('ZONE');
                            }}
                        >
                            <View style={[styles.actionIconBgLarge, { backgroundColor: '#FFF5F0' }]}>
                                <RefreshCw size={24} color={colors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionLabelLarge, { color: colors.primary }]}>오빗존 재설정</Text>
                                <Text style={[styles.actionDescLarge, { color: colors.primary, opacity: 0.5 }]}>심리적 거리를 다시 측정합니다</Text>
                            </View>
                            <ChevronRight size={20} color={colors.primary} opacity={0.3} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCardLarge}
                            onPress={() => {
                                setShowHealthCheckModal(false);
                                onDiagnose('RQS');
                            }}
                        >
                            <View style={[styles.actionIconBgLarge, { backgroundColor: '#F0F7FF' }]}>
                                <Zap size={24} color="#4A90E2" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionLabelLarge, { color: colors.primary }]}>캐릭터 심화 진단</Text>
                                <Text style={[styles.actionDescLarge, { color: colors.primary, opacity: 0.5 }]}>관계의 질적 분석을 수행합니다</Text>
                            </View>
                            <ChevronRight size={20} color={colors.primary} opacity={0.3} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.background + 'E6' }]}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>{node.name}</Text>
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
        <View style={{
            flex: 1, backgroundColor: colors.background
        }
        } >
            <HubLayout header={renderHeader()} scrollable>
                <View style={[styles.container, { paddingBottom: 80 }]}>
                    {/* Profile Section */}
                    <TouchableOpacity
                        style={styles.profileContainer}
                        onPress={onManageProfile}
                        activeOpacity={0.7}
                    >
                        <View style={styles.avatarShadow}>
                            <View style={[styles.avatarWrapper, { backgroundColor: colors.white, borderWidth: 4, borderColor: rqs ? rqs.color : getZoneGuide(node.zone).color }]}>
                                {node.image ? (
                                    <Image source={{ uri: node.image }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Activity size={40} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: dynamics.color, borderColor: colors.background }]}>
                                {node.temperature >= 80 ? (
                                    <Flame color={colors.white} size={18} fill={colors.white} />
                                ) : node.temperature <= 40 ? (
                                    <Snowflake color={colors.white} size={18} />
                                ) : (
                                    <Activity color={colors.white} size={18} />
                                )}
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
                                {dynamicCharacter && (
                                    <View style={[styles.tag, { backgroundColor: dynamicCharacter.color + '1A' }]}>
                                        <Text style={[styles.tagText, { color: dynamicCharacter.color }]}>{dynamicCharacter.icon} {dynamicCharacter.label}</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={[styles.tag, { backgroundColor: colors.primary + '0D', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                                    onPress={() => setActivePopup('zone')}
                                >
                                    {(() => {
                                        const Icon = getZoneGuide(node.zone).icon;
                                        return <Icon size={14} color={colors.primary} opacity={0.6} />;
                                    })()}
                                    <Text style={[styles.tagText, { color: colors.primary, opacity: 0.8 }]}>
                                        Orbit {node.zone}: {getZoneGuide(node.zone).name}
                                    </Text>
                                </TouchableOpacity>
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
                                <View style={styles.statHeaderRow}>
                                    <Text style={[styles.statLabel, { color: colors.primary, opacity: 0.4 }]}>정서 긴밀도</Text>
                                </View>
                            </View>
                            <View style={styles.statContentRow}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{node.temperature}%</Text>
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.sectionTitle, { color: colors.primary }]}>정서 긴밀도 그래프</Text>
                                <TouchableOpacity onPress={() => setActivePopup('intimacy')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <HelpCircle size={16} color={colors.primary} opacity={0.6} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[styles.periodBadge, { backgroundColor: colors.primary + '0D' }]}
                                onPress={() => setGraphPeriod(p => p === 'Weekly' ? 'Monthly' : p === 'Monthly' ? 'Yearly' : 'Weekly')}
                            >
                                <Text style={[styles.periodText, { color: colors.primary, opacity: 1 }]}>{graphPeriod}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.graphCard, { backgroundColor: colors.white }]}>
                            <View style={styles.graphInfo}>
                                <View>
                                    <Text style={[styles.graphLabel, { color: colors.primary, opacity: 0.6 }]}>현재 긴밀도</Text>
                                    <View style={styles.graphValueRow}>
                                        <Text style={[styles.graphMainValue, { color: colors.primary }]}>{node.temperature}%</Text>
                                        <View style={styles.trendBadge}>
                                            <Text style={styles.trendText}>{trendText}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                                    <Text style={[styles.legendText, { color: colors.primary, opacity: 0.4 }]}>
                                        {graphPaths ? '감정 흐름' : '현재 상태'}
                                    </Text>
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

                                    {graphPaths ? (
                                        <>
                                            <Path
                                                d={graphPaths.fillPath}
                                                fill="url(#gradientGraph)"
                                            />
                                            <Path
                                                d={graphPaths.path}
                                                stroke={colors.accent}
                                                strokeWidth="3"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {graphPaths.points.map((p, i) => (
                                                <Circle key={i} cx={p.x} cy={p.y} r="3" fill={colors.white} stroke={colors.accent} strokeWidth="2" />
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <Line x1="0" y1={100 - node.temperature} x2="300" y2={100 - node.temperature} stroke={colors.accent} strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
                                            <Circle cx="150" cy={100 - node.temperature} r="5" fill={colors.accent} />
                                        </>
                                    )}
                                </Svg>
                                {!graphPaths && (
                                    <View style={{ position: 'absolute', bottom: 10, width: '100%', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 11, color: colors.primary, opacity: 0.5, backgroundColor: (colors.white as string) + 'CC', paddingHorizontal: 8, borderRadius: 4 }}>
                                            데이터가 누적되면 그래프가 활성화됩니다
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.graphXAxis}>
                                {graphPaths && historyData ? historyData.map((item, i) => (
                                    <Text key={i} style={[styles.xLabelText, { color: colors.primary }]}>
                                        {formatDate(item.date)}
                                    </Text>
                                )) : (
                                    <Text style={[styles.xLabelText, { color: colors.primary }]}>
                                        {historyData && historyData.length > 0 ? formatDate(historyData[historyData.length - 1].date) : 'Today'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* 🧬 Emotional Topography Section (v1.1) */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.sectionTitle, { color: colors.primary }]}>정서 지형도 (Climate Map)</Text>
                                <TouchableOpacity onPress={() => Alert.alert('정서 지형도', '교류의 만족도와 에너지 소모량을 기준으로 분석한 관계의 기후입니다.')}>
                                    <Info size={16} color={colors.primary} opacity={0.6} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 12, color: colors.textMuted }}>최근 30일 기준</Text>
                        </View>
                        
                        <View style={[styles.topographyCard, { backgroundColor: colors.white }]}>
                            <View style={styles.topographyPlot}>
                                <View style={styles.topographyGrid}>
                                    <View style={[styles.gridCell, { backgroundColor: colors.primary + '05' }]}><Text style={styles.gridLabel}>고출력</Text></View>
                                    <View style={[styles.gridCell, { backgroundColor: colors.accent + '05' }]}><Text style={styles.gridLabel}>충전</Text></View>
                                    <View style={[styles.gridCell, { backgroundColor: '#8C968D10' }]}><Text style={styles.gridLabel}>소모</Text></View>
                                    <View style={[styles.gridCell, { backgroundColor: '#90A4AE10' }]}><Text style={styles.gridLabel}>안정</Text></View>
                                </View>
                                
                                <Svg height="160" width={width - 88} viewBox="0 0 200 160">
                                    {/* Axes */}
                                    <Line x1="20" y1="80" x2="180" y2="80" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                                    <Line x1="100" y1="20" x2="100" y2="140" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                                    
                                    {/* Data Points */}
                                    {(node.history || []).slice(-10).map((h, i) => (
                                        <Circle 
                                            key={i}
                                            cx={20 + ((h.satisfaction || 0) / 100) * 160}
                                            cy={160 - (20 + ((h.energyDrain || 0) / 100) * 120)}
                                            r={i === (node.history?.length || 0) - 1 ? 5 : 3}
                                            fill={i === (node.history?.length || 0) - 1 ? colors.accent : colors.primary}
                                            opacity={0.6}
                                        />
                                    ))}
                                </Svg>
                            </View>
                            <Text style={styles.topographyDesc}>
                                {dynamicCharacter ? `현재 이 관계는 '${dynamicCharacter.label}' 기후에 머물러 있습니다. ${dynamicCharacter.desc}.` : '교류 데이터가 쌓이면 정밀한 기후 분석이 제공됩니다.'}
                            </Text>
                        </View>
                    </View>

                    {/* 🕵️ Climate Trend Observation (v1.1) */}
                    {climateTrend && (
                        <View style={styles.section}>
                            <View style={[styles.graphCard, { backgroundColor: colors.white, paddingVertical: 20 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <Activity size={18} color={colors.accent} />
                                    <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.primary }]}>기후 변화 목격 (Observation)</Text>
                                </View>
                                <Text style={{ fontSize: 14, color: colors.primary, lineHeight: 22, opacity: 0.8 }}>
                                    {climateTrend.satTrend === 'up' 
                                        ? `최근 교류의 만족도가 이전보다 ${climateTrend.satDiff}% 상승했습니다. 정서적으로 더 깊게 충전되고 있는 기류가 보입니다.`
                                        : climateTrend.satTrend === 'down'
                                            ? `최근 만족도가 ${climateTrend.satDiff}% 하락하는 추세입니다. 관계 기후가 조금씩 건조해지고 있음을 목격합니다.`
                                            : `관계의 만족도가 일정한 수준을 유지하며 안정적인 기류를 형성하고 있습니다.`}
                                    {'\n'}
                                    {climateTrend.drainTrend === 'up'
                                        ? `주의: 정서적 소모량이 ${climateTrend.drainDiff}% 증가했습니다. 현재 시스템이 과부하 상태로 이동하고 있을 가능성이 있습니다.`
                                        : climateTrend.drainTrend === 'down'
                                            ? `긍정적 변화: 소모량이 ${climateTrend.drainDiff}% 감소했습니다. 상호작용의 효율이 개선되고 있는 지점입니다.`
                                            : `에너지 소모 패턴에 큰 변화 없이 일정한 궤도를 유지 중입니다.`}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Timeline Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>정서적 개입 타임라인</Text>
                            <TouchableOpacity
                                style={[styles.addTimelineBtn, { backgroundColor: colors.primary + '1A' }]}
                                onPress={() => setRelationshipLogModalOpen(true, relationshipId)}
                            >
                                <Plus size={16} color={colors.primary} />
                                <Text style={[styles.addBtnText, { color: colors.primary }]}>기록</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.timelineCard, { backgroundColor: colors.white + '99' }]}>
                            <View style={[styles.timelineTrack, { backgroundColor: colors.primary + '1A' }]} />

                            {safeHistory.length > 0 ? (
                                [...safeHistory]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .slice(0, 5)
                                    .map((item, idx) => (
                                        <TouchableOpacity 
                                            key={idx} 
                                            style={[styles.timelineItem, { marginBottom: 16 }]}
                                            onPress={() => setRelationshipLogModalOpen(true, relationshipId, item.id)}
                                        >
                                            {(() => {
                                                const closeness = (item as any).closeness ?? item.temperature ?? 0;
                                                return (
                                                    <>
                                                        <View style={[styles.timelineDot, { backgroundColor: closeness >= 60 ? colors.accent : colors.primary, borderColor: colors.white }]} />
                                                        <Text style={[styles.timelineTime, { color: colors.primary, opacity: 0.5 }]}>
                                                            {item.date}   <Text style={{ color: colors.accent, fontWeight: '800', opacity: 1 }}>{closeness >= 80 ? '🔥' : closeness >= 60 ? '☀️' : closeness >= 40 ? '☁️' : '❄️'} {Math.round(closeness)}%</Text>
                                                        </Text>
                                                    </>
                                                );
                                            })()}
                                            <Text style={[styles.timelineTitle, { color: colors.primary }]}>{item.title || item.event}</Text>
                                            <Text style={[styles.timelineDesc, { color: colors.primary, opacity: 0.7 }]}>
                                                {item.description || '상세 내용 없음'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: colors.primary, opacity: 0.6 }}>아직 기록된 상호작용이 없습니다.</Text>
                                </View>
                            )}
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


                        <View style={{ height: 120 }} />
                    </View>
                </View>
            </HubLayout>

            {/* Floating Popup System */}
            {
                activePopup && (
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
                )
            }

            {/* Floating Health Check Button */}
            <View style={styles.fabContainer}>
                <View style={[styles.fabLabel, { backgroundColor: colors.white + 'F2' }]}>
                    <Text style={[styles.fabLabelText, { color: colors.primary }]}>체크인</Text>
                </View>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.accent }]}
                    onPress={handleHealthCheck}
                >
                    <View style={styles.fabPulse} />
                    <HeartPulse color={colors.white} size={30} />
                </TouchableOpacity>
            </View>
            {/* Log Input Modal Removed - Using Global Modal */}
            {renderHealthCheckModal()}
            {/* 하단 시스템 바 가독성 가드 */}
            <ExpoLinearGradient
                colors={['transparent', colors.background]}
                style={styles.navBottomGuard}
                pointerEvents="none"
            />
        </View >
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
        gap: 12,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
    },
    tagText: {
        fontSize: 14,
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
    tempWarningBadge: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#FCF9F2',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 20,
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
        paddingHorizontal: 10,
    },
    axisText: {
        fontSize: 10,
        fontWeight: '600',
    },
    // Modal Styles
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        opacity: 0.8,
    },
    inputField: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    tempValue: {
        fontSize: 18,
        fontWeight: '900',
        width: 40,
    },
    saveBtn: {
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
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
        fontSize: 12,
        fontWeight: '600',
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    timelineDesc: {
        fontSize: 10,
        lineHeight: 15,
        fontWeight: '700',
        marginTop: 2,
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
        bottom: 110,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 20,
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
    // Health Check Modal Styles
    selectedPersonHeader: {
        alignItems: 'center',
        marginTop: 10,
    },
    largeAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9F9F9',
        marginBottom: 12,
        overflow: 'hidden',
    },
    largeAvatarImg: {
        width: '100%',
        height: '100%',
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2F332F',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    actionSubtitle: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600',
        lineHeight: 20,
    },
    actionGrid: {
        width: '100%',
        gap: 12,
        marginTop: 24,
    },
    actionCardLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIconBgLarge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabelLarge: {
        fontSize: 14,
        fontWeight: '800',
    },
    actionDescLarge: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    navBottomGuard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        zIndex: 10,
    },
    topographyCard: {
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    topographyPlot: {
        height: 160,
        width: '100%',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    topographyGrid: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridCell: {
        width: '50%',
        height: '50%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(74, 93, 78, 0.2)',
        letterSpacing: 1,
    },
    topographyDesc: {
        fontSize: 13,
        color: '#8C968D',
        lineHeight: 18,
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
    }
});

// TemperatureSlider removed as it's now handled by the global RelationshipLogModal
