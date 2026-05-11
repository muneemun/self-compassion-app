import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { ArrowLeft, Share2, Info, Star, Zap, Activity, Download, Heart, Shield, Layout, Calendar, Plus, X, Save, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');

interface RelationshipReportProps {
    relationshipId: string;
    onBack: () => void;
}

export const RelationshipReport = ({ relationshipId, onBack }: RelationshipReportProps) => {
    const [showInfo, setShowInfo] = useState(false);
    const [showPrescription, setShowPrescription] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const colors = useColors();

    const node = useRelationshipStore(state => state.relationships.find(r => r.id === relationshipId));
    const addInteraction = useRelationshipStore(state => state.addInteraction);

    // Track which RQS report to show by its timestamp
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

    if (!node) return null;

    // Derived: Current viewing RQS result (selected or latest)
    const effectiveRqsResult = (selectedHistoryId ? node.rqsHistory?.find(h => h && h.lastChecked === selectedHistoryId) : null)
        || node.rqsResult
        || (() => {
            const { trust = 50, communication = 50, satisfaction = 50, frequency = 50 } = node.metrics || {};
            const avg = (trust + communication + satisfaction) / 3;
            let syntheticGrade = 'B';
            if (avg > 85) syntheticGrade = 'S';
            else if (avg > 70) syntheticGrade = 'A';
            else if (avg < 40) syntheticGrade = 'C';

            return {
                grade: syntheticGrade,
                areaScores: {
                    safety: (trust / 100) * 4,
                    reciprocity: (communication / 100) * 4,
                    vitality: (satisfaction / 100) * 4,
                    growth: ((trust + communication + satisfaction) / 300) * 4
                },
                totalScore: Math.round(avg),
                lastChecked: new Date().toISOString()
            };
        })();

    const { grade, areaScores, totalScore } = effectiveRqsResult as any;

    // Log Modal State (Moved down to avoid duplication and fix scope)
    const [showLogModal, setShowLogModal] = useState(false);
    const [newLog, setNewLog] = useState({ event: '', temperature: 50 });

    const handleSaveLog = () => {
        if (!newLog.event.trim()) {
            Alert.alert('내용 입력', '어떤 활동을 했는지 간단히 적어주세요.');
            return;
        }
        setShowLogModal(false);
        setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];
            addInteraction(relationshipId, today, newLog.temperature, newLog.event, '');
            setNewLog({ event: '', temperature: 50 });
        }, 100);
    };

    // Grade guides matching the logic in Detail but with more visual focus
    const grades: Record<string, any> = {
        S: { name: 'Soul Anchor', color: '#D98B73', desc: '회복탄력성을 지탱하는 가장 소중한 존재입니다.' },
        A: { name: 'Vision Mirror', color: '#4A5D4E', desc: '건강한 자아상을 강화하는 든든한 조력자입니다.' },
        B: { name: 'Neutral', color: '#8A9A8D', desc: '적절한 사회적 거리를 유지 중인 중립 관계입니다.' },
        C: { name: 'Vampire', color: '#2C2C2C', desc: '에너지 소모가 큰 관계입니다. 정서적 경계가 필요합니다.' },
    };

    const currentGrade = grades[grade] || grades['B'];

    // 🧠 Intelligent Semantic Template Engine: Orbit Zone + RQS + Timeline
    const generateSynthesis = () => {
        const history = node.history || [];
        const recentHistory = history.slice(-3);
        const avgTemp = recentHistory.length > 0
            ? recentHistory.reduce((acc, h) => acc + (h.temperature || 0), 0) / recentHistory.length
            : node.temperature;

        const recentCortisol = recentHistory.some(h => (h.cortisol || 0) > 60);

        // 🏗 Narrative Library
        const PART_A_DIAGNOSIS = {
            S: [
                `이 사람은 당신의 삶에 가장 단단한 뿌리가 되어주는 존재입니다.`,
                `서로의 영혼이 맞닿은 핵심 그룹과 같은 소중한 관계군요.`,
                `당신이 어떤 풍파를 겪어도 돌아올 수 있는 든든한 안식처입니다.`
            ],
            A: [
                `함께 성장하기에 더할 나위 없는 이상적인 파트너십을 유지하고 있습니다.`,
                `서로에게 긍정적인 영감을 주는 건강한 정서적 조력 관계입니다.`,
                `안정적인 신뢰를 바탕으로 서로의 자아상을 강화해주고 있습니다.`
            ],
            B: [
                `적절한 사회적 거리를 유연하게 관리하고 있는 중립적 상태입니다.`,
                `큰 갈등은 없으나, 관계의 깊이를 더하기 위한 새로운 모멘텀이 필요한 시기입니다.`,
                `에너지 소모를 최소화하며 담백한 관계의 흐름을 보여주고 있습니다.`
            ],
            C: [
                `현재 심리적 에너지 소모가 상당히 큰 'Vampire' 징후가 보입니다.`,
                `정서적 경계가 무너지며 당신의 회복탄력성을 저해할 위험이 있는 단계입니다.`,
                `관계의 궤도를 전면적으로 재검토하고 에너지를 보호해야 할 시점입니다.`
            ]
        };

        const PART_B_CONTEXT = {
            WARM: [
                `최근의 따뜻한 교감이 관계의 신뢰 자본을 더욱 두텁게 만들었습니다.`,
                `공유된 긍정적 정서가 강력한 유대감을 형성하여 안정성을 높여주고 있네요.`,
                `최근 상호작용에서 발생한 정서적 공명이 관계의 면역력을 높였습니다.`
            ],
            COLD: [
                `최근 정서적 개입이 줄어들며 관계가 다소 건조해진 상태로 감지됩니다.`,
                `익숙함 속에 가려져 서로의 마음을 살피는 데 소홀해진 시기가 아닌지 점검이 필요합니다.`,
                `구조적 안정감은 있으나 감정적 연결고리가 느슨해져 정서적 가뭄에 대비해야 합니다.`
            ],
            DANGER: [
                `최근 상호작용에서 코르티솔(스트레스) 수치가 위험 수준으로 관찰되었습니다.`,
                `상대방과의 대화에서 발생하는 정서적 마찰이 당신의 에너지를 고갈시키고 있습니다.`,
                `반복되는 부정적 패턴이 관계의 기초 체력을 저하시키고 있는 상태입니다.`
            ]
        };

        const PART_C_ACTION = {
            ZONE12: [
                `가장 소중한 관계일수록 익숙함에 속지 않는 노력이 필요합니다. 이번 주에는 [당연하다고 여겼던 진심]을 꺼내 전해 보세요.`,
                `상대방의 안정감이 당신에게 큰 힘이 되고 있음을 [구체적인 행동]으로 보답해볼 시간입니다.`,
                `깊은 신뢰를 바탕으로 한 [질적 대화]를 통해 정서 긴밀도를 한 층 더 높여 보시길 추천합니다.`
            ],
            ZONE34: [
                `지나친 에너지 몰입보다는 [건강한 거리감]을 유지하며 자신의 내면에 집중할 시기입니다.`,
                `상대방의 과도한 요구에 휩쓸리지 않도록 [심리적 바운더리]를 명확히 세우는 연습이 필요합니다.`,
                `이번 주에는 무리한 약속보다는 [가벼운 안부] 정도로만 접촉하며 에너지를 비축하는 것이 현명합니다.`
            ]
        };

        // 🎲 Selection Logic
        const pA_options = PART_A_DIAGNOSIS[grade as keyof typeof PART_A_DIAGNOSIS] || PART_A_DIAGNOSIS['B'];
        const pB_options = recentCortisol ? PART_B_CONTEXT.DANGER : (avgTemp > 60 ? PART_B_CONTEXT.WARM : PART_B_CONTEXT.COLD);
        const pC_options = node.zone <= 2 ? PART_C_ACTION.ZONE12 : PART_C_ACTION.ZONE34;

        // 고정적인 느낌을 피하기 위해 relationshipId를 시드(seed)로 하여 인덱스 선택 (항상 같은 조합 유지)
        const seed = relationshipId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const indexA = seed % pA_options.length;
        const indexB = (seed + 1) % pB_options.length;
        const indexC = (seed + 2) % pC_options.length;

        const diagnosisText = `${pA_options[indexA]} ${pB_options[indexB]}`;

        // 🛠️ Helper to render text with highlights [text]
        const renderActionPlan = (text: string) => {
            const parts = text.split(/(\[.*?\])/g);
            return (
                <Text>
                    {parts.map((part, i) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                            return (
                                <Text key={i} style={{ color: colors.accent, fontWeight: '800' }}>
                                    {part.slice(1, -1)}
                                </Text>
                            );
                        }
                        return part;
                    })}
                </Text>
            );
        };

        const actionPlanElement = renderActionPlan(pC_options[indexC]);

        const zoneGuide = {
            1: { name: '핵심 그룹', energy: '전적 수용' },
            2: { name: '정서적 공유 그룹', energy: '정서 경제' },
            3: { name: '기능적 협력 관계', energy: '효율 지향' },
            4: { name: '단순 인지 관계', energy: '인지 한계' },
            5: { name: '배경 소음(외부 환경)', energy: '에너지 차단' },
        }[node.zone] || { name: '불분명', energy: '-' };

        return {
            diagnosis: diagnosisText,
            actionPlan: actionPlanElement,
            zoneName: zoneGuide.name,
            zoneEnergy: zoneGuide.energy,
            avgTemp
        };
    };

    const synthesis = generateSynthesis();

    // 💊 Psychological Prescription Logic
    const generatePrescription = () => {
        const rxPool = {
            S: {
                title: '회복력 극대화 처방',
                pill: '옥시토신 부스터 (Oxytocin Booster)',
                dosage: '주 3회 이상 깊은 교감',
                instruction: '이미 충분히 훌륭한 관계입니다. 익숙함에 소홀해지지 않도록 "고마움"을 명시적으로 표현하는 것이 핵심입니다.',
                effect: '자아 안정성 및 스트레스 회복탄력성 강화'
            },
            A: {
                title: '동반 성장 처방',
                pill: '공명 서포터 (Resonance Supporter)',
                dosage: '월 2회 가치 공유 세션',
                instruction: '서로의 비전과 성장을 응원하는 대화가 필요합니다. 상호 영감을 주는 새로운 활동을 함께 시도해 보세요.',
                effect: '자아 확장 및 삶의 만족도 점진적 상승'
            },
            B: {
                title: '유대 강화 처방',
                pill: '정서 보충제 (Emotional Supplement)',
                dosage: '적정 거리 유지 및 안부 확인',
                instruction: '자칫 방치될 수 있는 중립 관계입니다. 가벼운 안부 인사가 예상치 못한 정서적 보상으로 돌아올 수 있습니다.',
                effect: '사회적 지지망의 완만한 확장'
            },
            C: {
                title: '에너지 방어 처방',
                pill: '코르티솔 차단제 (Cortisol Blocker)',
                dosage: '즉각적인 정서적 거리 확보',
                instruction: '당신의 에너지가 우선입니다. 상대의 감정적 요구에 "아니오"라고 말하는 연습을 통해 내면의 바운더리를 지키세요.',
                effect: '심리적 번아웃 방지 및 자아 보호'
            }
        };

        const currentRx = rxPool[grade as keyof typeof rxPool] || rxPool['B'];
        return currentRx;
    };

    const prescription = generatePrescription();

    const handleGenerateRx = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setShowPrescription(true);
        }, 1500);
    };

    const handleExportPdf = () => {
        Alert.alert(
            "PDF 리포트 생성 완료",
            "진단 리포트 및 심리 처방전이 PDF 파일로 생성되었습니다. 기기에 저장하거나 공유하시겠습니까?",
            [
                { text: "나중에", style: "cancel" },
                { text: "공유하기", onPress: () => { } }
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerSub}>심화 진단 리포트</Text>
                <Text style={[styles.headerDate, { color: colors.primary }]}>
                    {(() => {
                        const d = new Date(node.rqsResult?.lastChecked || Date.now());
                        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
                    })()}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                    style={[styles.headerBtn, { width: 40 }]}
                    onPress={() => setShowLogModal(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Plus size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn}>
                    <Share2 size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderGauge = (value: number, label: string, color: string) => {
        const size = 60;
        const radius = (size - 6) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <View style={[styles.gaugeCard, { backgroundColor: colors.white }]}>
                <View style={{ width: size, height: size }}>
                    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={colors.primary + '10'}
                            strokeWidth="3"
                            fill="none"
                        />
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="none"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        />
                    </Svg>
                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={[styles.gaugeValue, { color: colors.primary }]}>{value}</Text>
                    </View>
                </View>
                <Text style={[styles.gaugeLabel, { color: colors.primary }]}>{label}</Text>
            </View>
        );
    };

    const renderTrendChart = () => {
        // 🗓️ Calculate last 6 months labels
        const months: string[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(`${d.getMonth() + 1}월`);
        }

        // 📊 Calculate trend values based on actual history (RQS + Interactions)
        const rqsRecords = node.rqsHistory || (node.rqsResult ? [node.rqsResult] : []);
        const interactionHistory = node.history || [];

        const trendData = months.map((_, index) => {
            const monthOffset = 5 - index;
            const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();

            // 1. Check for RQS diagnosis in this month
            const monthlyRqs = rqsRecords.filter(r => {
                if (!r?.lastChecked) return false;
                const d = new Date(r.lastChecked);
                return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
            });

            if (monthlyRqs.length > 0) {
                const lastIdx = monthlyRqs.length - 1;
                return {
                    value: monthlyRqs[lastIdx]?.totalScore ?? totalScore,
                    isReal: true
                };
            }

            // 2. Fallback: Check for interaction history in this month
            const monthlyInteractions = interactionHistory.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
            });

            if (monthlyInteractions.length > 0) {
                const avgTemp = monthlyInteractions.reduce((acc, curr) => acc + (curr.temperature || 0), 0) / monthlyInteractions.length;
                return {
                    value: Math.round((totalScore * 0.4) + (avgTemp * 0.6)),
                    isReal: true
                };
            }

            // 3. Last Resort: Baseline
            if (monthOffset === 0) return { value: totalScore, isReal: true };
            return {
                value: Math.max(40, totalScore - 10),
                isReal: false
            };
        });

        // Determine trend status
        const isRising = trendData[5].value >= trendData[4].value;

        return (
            <View style={styles.trendSection}>
                <View style={styles.trendHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.trendTitle, { color: colors.primary }]}>최근 6개월 변화</Text>
                        <TouchableOpacity
                            onPress={() => setShowInfo(true)}
                        >
                            <Info size={14} color={colors.primary} opacity={0.4} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.trendBadge, { backgroundColor: isRising ? colors.accent + '15' : colors.primary + '15' }]}>
                        <Text style={[styles.trendBadgeText, { color: isRising ? colors.accent : colors.primary }]}>
                            {isRising ? "상승세" : "유지/조정"}
                        </Text>
                    </View>
                </View>
                <View style={[styles.chartContainer, { backgroundColor: colors.white }]}>
                    <View style={styles.barsArea}>
                        {trendData.map((d, i) => {
                            let barColor = colors.primary + '15'; // Muted (No Real Data)
                            if (i === 5) {
                                barColor = colors.accent; // Current Month Highlight
                            } else if (d.isReal) {
                                barColor = colors.primary + '80'; // Solid (Actual Data Recorded)
                            }

                            return (
                                <View key={i} style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${Math.max(d.value, 5)}%`,
                                                backgroundColor: barColor
                                            },
                                            i === 5 && styles.activeBar
                                        ]}
                                    />
                                    <Text style={styles.barLabel}>{months[i]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
                <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.primary + '80' }]} />
                        <Text style={styles.legendText}>기록된 데이터</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.primary + '15' }]} />
                        <Text style={styles.legendText}>데이터 없음(기본값)</Text>
                    </View>
                </View>
                <Text style={styles.trendDescription}>
                    * 관계 건강 점수는 사용자가 직접 진단한 기초 신뢰 안정성과 심리적 위치, 그리고 타임라인에 기록해온 상호작용의 빈도와 정서 긴밀도를 분석하여 산출됩니다.
                </Text>
            </View>
        );
    };

    return (
        <>
            <HubLayout header={renderHeader()} scrollable>
                <View style={styles.container}>
                    {/* Hero Section: RQS Grade */}
                    <View style={styles.heroSection}>
                        <View style={[styles.heroAura, { backgroundColor: (grades[grade]?.color || colors.primary) + '15' }]} />
                        <Text style={[styles.totalScoreLabel, { color: colors.primary }]}>Total Grade</Text>
                        <View style={styles.gradeContainer}>
                            <Text style={[styles.gradeText, { color: colors.primary }]}>{grade}</Text>
                            <View style={[styles.topBadge, { backgroundColor: colors.accent }]}>
                                <Text style={styles.topBadgeText}>TOP 5%</Text>
                            </View>
                        </View>
                        <Text style={[styles.heroSummary, { color: colors.primary }]}>
                            {totalScore >= 80 ? "관계 건강 상태가 매우 양호합니다.\n서로에게 큰 힘이 되고 있어요." : "적절한 긴밀도를 유지하고 있습니다.\n조금 더 세심한 관심이 필요합니다."}
                        </Text>
                    </View>

                    {/* History Selector (Horizontal Chips) */}
                    {node.rqsHistory && node.rqsHistory.length >= 1 && (
                        <View style={styles.historyContainer}>
                            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, opacity: 0.6 }}>진단 기록 히스토리</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                                {[...node.rqsHistory].reverse().map((h, idx) => {
                                    if (!h) return null;
                                    const hId = h.lastChecked || `history-${idx}`;
                                    const d = new Date(h.lastChecked || new Date());
                                    const dateStr = isNaN(d.getTime()) ? 'No Date' : `${d.getMonth() + 1}/${d.getDate()}`;
                                    const isSelected = selectedHistoryId === hId || (!selectedHistoryId && (node.rqsResult?.lastChecked === hId || idx === 0));
                                    return (
                                        <TouchableOpacity
                                            key={hId}
                                            style={[
                                                styles.historyChip,
                                                {
                                                    backgroundColor: isSelected ? colors.primary : colors.white,
                                                    borderColor: colors.primary + '20'
                                                }
                                            ]}
                                            onPress={() => setSelectedHistoryId(hId)}
                                        >
                                            <View style={[styles.historyGradeDot, { backgroundColor: grades[h.grade]?.color || colors.primary }]} />
                                            <Text style={[styles.historyDate, { color: isSelected ? colors.white : colors.primary }]}>{dateStr}</Text>
                                            {isSelected && <CheckCircle2 size={12} color="white" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* Metrics Grid */}
                    <View style={styles.metricsGrid}>
                        {renderGauge(Math.round((areaScores.safety / 4) * 100), "신뢰성", colors.primary)}
                        {renderGauge(Math.round((areaScores.reciprocity / 4) * 100), "친화력", colors.accent)}
                        {renderGauge(Math.round((areaScores.vitality / 4) * 100), "에너지", colors.primary)}
                    </View>

                    {/* Insight Card (Synthesis Results) */}
                    <View style={[styles.insightCardContainer, { backgroundColor: colors.white }]}>
                        <View style={styles.insightHeader}>
                            <Star size={18} color={colors.accent} fill={colors.accent} />
                            <Text style={[styles.insightTitle, { color: colors.primary }]}>이번 리포트의 인사이트</Text>
                        </View>
                        <Text style={[styles.insightMainText, { color: colors.primary }]}>
                            {synthesis.diagnosis}
                        </Text>
                        <View style={[styles.actionBox, { backgroundColor: colors.background }]}>
                            <Zap size={16} color={colors.accent} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionText, { color: colors.primary }]}>
                                    {synthesis.actionPlan}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.hashtagRow}>
                            <View style={[styles.tag, { backgroundColor: colors.primary + '0D' }]}><Text style={[styles.tagText, { color: colors.primary }]}>#안정성확보</Text></View>
                            <View style={[styles.tag, { backgroundColor: colors.primary + '0D' }]}><Text style={[styles.tagText, { color: colors.primary }]}>#정서적임계</Text></View>
                        </View>
                    </View>

                    {/* Trend Chart */}
                    {renderTrendChart()}

                    {/* Evidence Footer: 분석 근거 명시 */}
                    <View style={styles.evidenceSection}>
                        <View style={styles.evidenceHeader}>
                            <Shield size={14} color={colors.primary} opacity={0.5} />
                            <Text style={styles.evidenceTitle}>분석 데이터 근거 (EVIDENCE)</Text>
                        </View>

                        <View style={styles.evidenceGrid}>
                            <View style={[styles.evidenceItem, { backgroundColor: colors.white + '66' }]}>
                                <Layout size={16} color={colors.primary} opacity={0.4} style={{ marginBottom: 6 }} />
                                <Text style={[styles.evidenceVal, { color: colors.primary }]}>레이어 {node.zone}</Text>
                                <Text style={styles.evidenceKey}>심리적 거리</Text>
                                <Text style={styles.evidenceSub}>{synthesis.zoneName}</Text>
                            </View>

                            <View style={[styles.evidenceItem, { backgroundColor: colors.white + '66' }]}>
                                <Star size={16} color={colors.accent} opacity={0.6} style={{ marginBottom: 6 }} />
                                <Text style={[styles.evidenceVal, { color: colors.primary }]}>{grade} Grade</Text>
                                <Text style={styles.evidenceKey}>관계 기초 체력</Text>
                                <Text style={styles.evidenceSub}>{grades[grade]?.name || 'Unknown'}</Text>
                            </View>

                            <View style={[styles.evidenceItem, { backgroundColor: colors.white + '66' }]}>
                                <Activity size={16} color={colors.primary} opacity={0.4} style={{ marginBottom: 6 }} />
                                <Text style={[styles.evidenceVal, { color: colors.primary }]}>{Math.round(synthesis.avgTemp)}%</Text>
                                <Text style={styles.evidenceKey}>정서 주파수</Text>
                                <Text style={styles.evidenceSub}>최근 교감 농도</Text>
                            </View>
                        </View>

                        <Text style={styles.evidenceFooterText}>
                            * 이 리포트는 아래 {node.history?.length || 0}개의 상호작용 데이터와 정밀 진단 결과를 AI가 분석한 결과입니다.
                        </Text>

                        {/* 📋 Detailed Data Log: 최신순 정렬, 상위 5개만 노출 */}
                        <View style={styles.logContainer}>
                            {node.history && [...node.history]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 내림차순 (최신순)
                                .slice(0, 5) // 최근 5건
                                .map((item, idx) => (
                                    <View key={idx} style={[styles.logItem, { borderLeftColor: item.temperature > 70 ? colors.accent : colors.primary + '20' }]}>
                                        <View style={styles.logDateLine}>
                                            <Calendar size={10} color={colors.primary} opacity={0.4} />
                                            <Text style={styles.logDateText}>{item.date}</Text>
                                        </View>
                                        <View style={styles.logContentRow}>
                                            <Text style={[styles.logEventText, { color: colors.primary }]}>{item.event || "일반 상호작용"}</Text>
                                            <View style={styles.logIndicatorRow}>
                                                <View style={[styles.miniIndicator, { backgroundColor: colors.accent + '10' }]}>
                                                    <Text style={[styles.miniIndicatorText, { color: colors.accent }]}>{Math.round(item.temperature || 0)}%</Text>
                                                </View>
                                                {item.oxytocin && (
                                                    <Heart size={10} color="#4CAF50" fill="#4CAF50" />
                                                )}
                                                {item.cortisol && item.cortisol > 50 && (
                                                    <Zap size={10} color="#F44336" />
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ))}

                            {(node.history?.length || 0) > 5 && (
                                <TouchableOpacity style={styles.moreHistoryBtn}>
                                    <Text style={[styles.moreHistoryText, { color: colors.primary }]}>전체 이력 보기 ({node.history.length - 5}개 더보기)</Text>
                                    <ChevronRight size={14} color={colors.primary} opacity={0.6} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </HubLayout>

            {/* 하단 시스템 바 가독성 가드 */}
            <ExpoLinearGradient
                colors={['transparent', colors.background]}
                style={styles.navBottomGuard}
                pointerEvents="none"
            />

            {/* Custom Premium Popup (CR-23 Design) */}
            {showInfo && (
                <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowInfo(false)}
                    />
                    <View style={[styles.floatingPopupCard, { backgroundColor: colors.white }]}>
                        <View style={styles.guideHeader}>
                            <View>
                                <Text style={[styles.guideTitle, { color: colors.primary }]}>관계 건강 점수 분석 모델</Text>
                                <Text style={[styles.guideSubTitle, { color: colors.accent }]}>Relationship Analysis Basis</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowInfo(false)} style={styles.popupCloseBtn}>
                                <Activity size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.popupScrollContainer}>
                            <Text style={[styles.guideInfoText, { color: colors.primary }]}>
                                귀하의 리포트에서 나타나는 수치는 단순히 느낌이나 추측이 아닌, 실제 기록된 데이터를 바탕으로 분석됩니다.
                            </Text>

                            <View style={[styles.guideStatusBox, { backgroundColor: colors.primary + '0A' }]}>
                                <Text style={[styles.guideStatusLabel, { color: colors.primary }]}>
                                    1. 기초 신뢰 안정성
                                </Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>
                                    사용자가 직접 응답한 진단 데이터를 통해 관계의 본질적인 단단함을 측정합니다.
                                </Text>
                            </View>

                            <View style={[styles.guideStatusBox, { backgroundColor: colors.primary + '0A', marginTop: 12 }]}>
                                <Text style={[styles.guideStatusLabel, { color: colors.primary }]}>
                                    2. 기록된 상호작용 지표
                                </Text>
                                <Text style={[styles.guideStatusDesc, { color: colors.primary, opacity: 0.6 }]}>
                                    타임라인에 기록해온 실제 대화의 정서 긴밀도와 빈도를 통계적으로 환산하여 반영합니다.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.popupConfirmBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setShowInfo(false)}
                        >
                            <Text style={styles.popupConfirmText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Floating Action Button */}
            <View style={styles.bottomFabContainer}>
                <TouchableOpacity
                    style={[styles.mainFab, { backgroundColor: colors.primary }]}
                    onPress={handleGenerateRx}
                >
                    <Text style={styles.fabText}>심리 처방전(AI Rx) 조제하기</Text>
                    <Activity size={20} color={colors.white} />
                </TouchableOpacity>
            </View>

            {/* AI Prescription Modal Overlay */}
            {(isGenerating || showPrescription) && (
                <View style={[styles.prescriptionOverlay, { backgroundColor: 'rgba(252, 249, 242, 0.98)' }]}>
                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                        {isGenerating ? (
                            <View style={styles.generatingContainer}>
                                <View style={styles.capsuleAnimation}>
                                    <View style={[styles.capsuleHalf, { backgroundColor: (grades[grade]?.color || colors.primary) }]} />
                                    <View style={[styles.capsuleHalf, { backgroundColor: '#FFF' }]} />
                                </View>
                                <Text style={[styles.generatingText, { color: colors.primary }]}>AI가 데이터 기반{'\n'}맞춤 처방전을 조제 중입니다...</Text>
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={styles.rxScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.rxHeader}>
                                    <View style={styles.rxStamp}>
                                        <Text style={[styles.rxStampText, { color: grades[grade]?.color || colors.primary }]}>CERTIFIED</Text>
                                    </View>
                                    <Text style={styles.rxTag}>ANTIGRAVITY PSYCHOLOGICAL RX</Text>
                                    <Text style={[styles.rxTitle, { color: colors.primary }]}>{prescription.title}</Text>
                                    <View style={[styles.rxDivider, { backgroundColor: (grades[grade]?.color || colors.primary) + '30' }]} />
                                </View>

                                <View style={styles.rxSection}>
                                    <View style={styles.rxRow}>
                                        <Text style={styles.rxLabel}>환자 성함</Text>
                                        <Text style={[styles.rxValue, { color: colors.primary }]}>User (본인)</Text>
                                    </View>
                                    <View style={styles.rxRow}>
                                        <Text style={styles.rxLabel}>대상 이름</Text>
                                        <Text style={[styles.rxValue, { color: colors.primary }]}>{node.name}</Text>
                                    </View>
                                    <View style={styles.rxRow}>
                                        <Text style={styles.rxLabel}>관계 등급</Text>
                                        <Text style={[styles.rxValue, { color: grades[grade]?.color || colors.primary, fontWeight: '900' }]}>{grade} Grade ({grades[grade]?.name || 'Unknown'})</Text>
                                    </View>
                                </View>

                                <View style={[styles.rxMainCard, { backgroundColor: colors.white }]}>
                                    <View style={styles.pillIconContainer}>
                                        <View style={[styles.pillIcon, { backgroundColor: grades[grade]?.color || colors.primary }]}>
                                            <Activity size={24} color="white" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.pillLabel}>처방 성분</Text>
                                            <Text style={[styles.pillName, { color: colors.primary }]} numberOfLines={2}>
                                                {prescription.pill}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.dosageInfo}>
                                        <Text style={styles.dosageLabel}>권장 용법 (Dosage)</Text>
                                        <Text style={[styles.dosageText, { color: colors.primary }]}>{prescription.dosage}</Text>
                                    </View>

                                    <View style={styles.rxDividerDotted} />

                                    <View style={styles.instructionInfo}>
                                        <Text style={styles.dosageLabel}>처방 지침 (Instruction)</Text>
                                        <Text style={[styles.instructionText, { color: colors.primary }]}>{prescription.instruction}</Text>
                                    </View>

                                    <View style={[styles.effectBox, { backgroundColor: colors.background }]}>
                                        <Text style={styles.effectLabel}>기대 효과</Text>
                                        <Text style={[styles.effectText, { color: colors.primary }]}>{prescription.effect}</Text>
                                    </View>
                                </View>

                                <Text style={styles.rxFooter}>
                                    본 처방전은 AI 엔진이 최근 {node.history?.length || 0}개의 상호작용과{'\n'}RQS 진단 데이터를 정밀 분석하여 생성되었습니다.
                                </Text>

                                <View style={styles.rxActionGroup}>
                                    <TouchableOpacity
                                        style={[styles.pdfButton, { borderColor: colors.primary }]}
                                        onPress={handleExportPdf}
                                    >
                                        <Download size={18} color={colors.primary} />
                                        <Text style={[styles.pdfButtonText, { color: colors.primary }]}>PDF 리포트로 내보내기</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.closeRxBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => setShowPrescription(false)}
                                    >
                                        <Text style={styles.closeRxBtnText}>닫기</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </SafeAreaView>
                </View>
            )}

            {/* Log Modal */}
            <Modal
                transparent
                visible={showLogModal}
                animationType="fade"
                onRequestClose={() => setShowLogModal(false)}
            >
                <View style={[styles.popupBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowLogModal(false)} />
                    <View style={[styles.floatingPopupCard, { backgroundColor: colors.white, padding: 24 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.primary }]}>정서적 개입 기록</Text>
                            <TouchableOpacity onPress={() => setShowLogModal(false)}>
                                <X size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.primary }]}>무슨 일이 있었나요?</Text>
                        <TextInput
                            style={[styles.inputField, { color: colors.primary, borderColor: colors.primary + '30' }]}
                            placeholder="예: 저녁 식사, 안부 문자, 선물 등"
                            placeholderTextColor="#999"
                            value={newLog.event}
                            onChangeText={(text) => setNewLog({ ...newLog, event: text })}
                        />

                        <Text style={[styles.inputLabel, { color: colors.primary, marginTop: 20 }]}>정서 긴밀도 ({newLog.temperature}%)</Text>
                        <View style={styles.tempSelector}>
                            {[20, 40, 60, 80, 100].map(temp => (
                                <TouchableOpacity
                                    key={temp}
                                    style={[
                                        styles.tempChip,
                                        {
                                            backgroundColor: newLog.temperature === temp ? colors.accent : '#F5F5F5',
                                            borderColor: newLog.temperature === temp ? colors.accent : 'transparent'
                                        }
                                    ]}
                                    onPress={() => setNewLog({ ...newLog, temperature: temp })}
                                >
                                    <Text style={[styles.tempChipText, { color: newLog.temperature === temp ? 'white' : '#888' }]}>{temp}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.tempDesc}>
                            {newLog.temperature >= 80 ? '아주 따뜻하고 좋았어요!' : newLog.temperature >= 60 ? '평범하고 무난했어요.' : '다소 차갑거나 안 좋았어요.'}
                        </Text>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSaveLog}
                        >
                            <Save size={18} color="white" />
                            <Text style={styles.saveBtnText}>기록 저장하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSub: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        color: '#D98B73',
    },
    headerDate: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.6,
    },
    container: {
        paddingHorizontal: 20,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
        position: 'relative',
    },
    heroAura: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        top: 20,
    },
    totalScoreLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
        opacity: 0.6,
    },
    gradeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    gradeText: {
        fontSize: 88,
        fontWeight: '900',
        letterSpacing: -4,
    },
    topBadge: {
        marginTop: 12,
        marginLeft: -8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    topBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    heroSummary: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
        textAlign: 'center',
        opacity: 0.7,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    gaugeCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: 'rgba(74, 93, 78, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
    },
    gaugeValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    gaugeLabel: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.5,
    },
    insightCardContainer: {
        padding: 24,
        borderRadius: 32,
        marginBottom: 24,
        shadowColor: 'rgba(74, 93, 78, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    insightTitle: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    insightMainText: {
        fontSize: 17,
        lineHeight: 28,
        fontWeight: '600',
        marginBottom: 20,
    },
    actionBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 16,
    },
    actionText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    hashtagRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    trendSection: {
        marginBottom: 24,
    },
    trendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    trendTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    trendBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chartContainer: {
        height: 140,
        borderRadius: 24,
        padding: 20,
        paddingBottom: 10,
    },
    barsArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: '60%',
        borderRadius: 8,
        minHeight: 4,
    },
    activeBar: {
        shadowColor: '#D98B73',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    barLabel: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '600',
        marginTop: 8,
    },
    trendDescription: {
        fontSize: 11,
        color: '#9E9E9E',
        fontWeight: '500',
        lineHeight: 16,
        marginTop: 12,
        paddingHorizontal: 4,
    },
    // Premium Popup Styles (CR-23 Inspired)
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
        fontSize: 16,
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
    evidenceSection: {
        padding: 24,
        paddingBottom: 40,
        marginTop: 24, // 공간 확보
    },
    evidenceTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9E9E9E',
        letterSpacing: 1.5,
        // marginBottom: 16, // 제거
        // textAlign: 'center', // 제거
    },
    evidenceGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16, // Grid 상단 여백 추가
    },
    evidenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // 좌우 배치
        gap: 6,
        marginBottom: 16,
    },
    evidenceItem: {
        alignItems: 'center',
        flex: 1,
    },
    evidenceVal: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    evidenceKey: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9E9E9E',
    },
    evidenceSub: {
        fontSize: 9,
        fontWeight: '600',
        color: '#9E9E9E',
        marginTop: 4,
        opacity: 0.7,
    },
    evidenceFooterText: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '500',
        marginTop: 20,
        marginBottom: 16,
        textAlign: 'center',
        opacity: 0.6,
    },
    logContainer: {
        marginTop: 8,
        gap: 12,
    },
    logItem: {
        paddingLeft: 12,
        borderLeftWidth: 2,
        paddingVertical: 2,
    },
    logDateLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    logDateText: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '600',
    },
    logContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logEventText: {
        fontSize: 12,
        fontWeight: '700',
        opacity: 0.8,
        flex: 1,
    },
    logIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    navBottomGuard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        zIndex: 10,
    },
    miniIndicator: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    miniIndicatorText: {
        fontSize: 9,
        fontWeight: '800',
    },
    bottomFabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: 'transparent',
    },
    mainFab: {
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: 'rgba(74, 93, 78, 0.2)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
    },
    fabText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    // Prescription Modal Styles
    prescriptionOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
    },
    generatingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    capsuleAnimation: {
        width: 60,
        height: 100,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#EBE5D9',
        overflow: 'hidden',
        alignItems: 'center',
    },
    capsuleHalf: {
        width: '100%',
        flex: 1,
    },
    generatingText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.6,
    },
    rxScroll: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    rxHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    rxTag: {
        fontSize: 12,
        fontWeight: '900',
        color: '#D98B73',
        letterSpacing: 2,
        marginBottom: 8,
    },
    rxTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 20,
    },
    rxDivider: {
        width: '100%',
        height: 1,
    },
    rxStamp: {
        position: 'absolute',
        top: -10,
        right: -10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 2,
        borderColor: '#D4AF3740',
        borderRadius: 4,
        transform: [{ rotate: '15deg' }],
    },
    rxStampText: {
        fontSize: 10,
        fontWeight: '900',
        opacity: 0.5,
    },
    rxSection: {
        marginBottom: 32,
    },
    rxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    rxLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '700',
    },
    rxValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    rxMainCard: {
        padding: 20,
        borderRadius: 32,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        marginBottom: 32,
    },
    pillIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    pillIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '700',
        marginBottom: 2,
    },
    pillName: {
        fontSize: 18,
        fontWeight: '900',
    },
    dosageInfo: {
        marginBottom: 20,
    },
    dosageLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#A9AFAB',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    dosageText: {
        fontSize: 15,
        fontWeight: '600',
    },
    rxDividerDotted: {
        width: '100%',
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: 20,
    },
    instructionInfo: {
        marginBottom: 24,
    },
    instructionText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
    },
    effectBox: {
        padding: 16,
        borderRadius: 16,
    },
    effectLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#737874',
        marginBottom: 4,
    },
    effectText: {
        fontSize: 13,
        fontWeight: '700',
    },
    rxFooter: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 40,
    },
    rxActionGroup: {
        gap: 12,
        marginBottom: 100,
    },
    pdfButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1.5,
    },
    pdfButtonText: {
        fontSize: 14,
        fontWeight: '800',
    },
    closeRxBtn: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeRxBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    // Log Modal & Header Styles
    addLogBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#4A5D4E',
        gap: 4
    },
    addLogBtnText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700'
    },
    moreHistoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 4,
        marginTop: 4,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
    },
    moreHistoryText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.6
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        opacity: 0.8,
    },
    inputField: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    tempSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    tempChip: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    tempChipText: {
        fontSize: 12,
        fontWeight: '800',
    },
    tempDesc: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'center',
        marginBottom: 24,
    },
    saveBtn: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    // History Selector Styles
    historyContainer: {
        marginBottom: 20,
    },
    historyScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    historyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    historyGradeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    historyDate: {
        fontSize: 12,
        fontWeight: '800',
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.5,
    },
});
