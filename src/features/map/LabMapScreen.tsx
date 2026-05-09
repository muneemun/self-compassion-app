import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, ScrollView } from 'react-native';
import { Rocket, LayoutGrid, Activity, SlidersHorizontal, Info, Sparkles, ChevronRight, AlertCircle, TrendingUp, Zap, Flame, Snowflake, Skull, Shield, ArrowDown, ArrowUp, RefreshCcw, Leaf, CircleDashed } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { getDynamicCharacter, RQS_GRADE_BADGES } from '../../types/relationship';
import { SelfNode } from './SelfNode';
import Svg, { Circle, G, Path, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import ReAnimated, { useAnimatedStyle, withRepeat, withTiming, Easing, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.55;

type LabViewMode = 'FOCUS' | 'BALANCE' | 'DYNAMICS';

const ZONE_COLORS: Record<number, string> = {
    1: '#FFB74D',
    2: '#D98B73',
    3: '#4A5D4E',
    4: '#90A4AE',
    5: '#D1D5DB'
};

const ZONE_CAPACITY = { 1: 5, 2: 15, 3: 50, 4: 100, 5: 150 };

export const LabMapScreen = ({ onBack }: { onBack?: () => void }) => {
    const [viewMode, setViewMode] = useState<LabViewMode>('FOCUS');
    const relationships = useRelationshipStore(state => state.relationships);

    const labAnalysis = useMemo(() => {
        const zoneCounts = [0, 0, 0, 0, 0, 0];
        relationships.forEach(r => { if (r.zone) zoneCounts[r.zone]++; });

        let maxOverloadRatio = 0;
        let primaryIssueZone: number | null = null;
        let overloadedZones: number[] = [];

        [1, 2, 3, 4, 5].forEach(z => {
            const count = zoneCounts[z];
            const capacity = ZONE_CAPACITY[z as keyof typeof ZONE_CAPACITY];
            if (count > capacity) {
                overloadedZones.push(z);
                const ratio = count / capacity;
                if (ratio > maxOverloadRatio) {
                    maxOverloadRatio = ratio;
                    primaryIssueZone = z;
                }
            }
        });

        const vampires = relationships.filter(r => {
            const char = getDynamicCharacter(r.interactions || []);
            return char?.type === 'Draining' || r.rqsResult?.grade === 'C';
        });
        const antidotes = relationships.filter(r => {
            const char = getDynamicCharacter(r.interactions || []);
            return char?.type === 'Stable' || r.rqsResult?.grade === 'S';
        });

        let energy = 85; 
        overloadedZones.forEach(z => { energy -= (zoneCounts[z] - ZONE_CAPACITY[z as keyof typeof ZONE_CAPACITY]) * 2; });
        energy -= vampires.length * 8; // Slightly reduced penalty
        energy += antidotes.length * 4;
        
        return {
            condition: Math.max(5, Math.min(100, energy)),
            overloadedZones,
            primaryIssueZone,
            topVampire: vampires.length > 0 ? vampires[0] : null,
            zoneCounts
        };
    }, [relationships]);

    const focusNodes = useMemo(() => {
        return [...relationships]
            .sort((a, b) => {
                const aPrio = (a.rqsResult?.grade === 'C' ? 30 : 0) + Math.abs((a.temperature || 50) - 50);
                const bPrio = (b.rqsResult?.grade === 'C' ? 30 : 0) + Math.abs((b.temperature || 50) - 50);
                return bPrio - aPrio;
            })
            .slice(0, 12);
    }, [relationships]);

    // ==========================================
    // VIEW 1: FOCUS (Gravity Lines)
    // ==========================================
    const renderFocusView = () => {
        const centerX = width / 2;
        const centerY = MAP_HEIGHT / 2;

        return (
            <View style={styles.mapArea}>
                {/* SVG lines drawn explicitly behind nodes */}
                <Svg 
                    style={StyleSheet.absoluteFill}
                    width={width}
                    height={MAP_HEIGHT}
                >
                    {/* Orbit Rings (1 to 5) */}
                    {[1, 2, 3, 4, 5].map(zone => {
                        const radius = zone * 45 + 30;
                        return (
                            <Circle 
                                key={`orbit-${zone}`}
                                cx={centerX} 
                                cy={centerY} 
                                r={radius} 
                                stroke="#EBE5D9" 
                                strokeWidth="1" 
                                fill="none" 
                                strokeDasharray="3 3"
                            />
                        );
                    })}

                    {focusNodes.map((node, idx) => {
                        const angle = (idx * 360 / focusNodes.length) * Math.PI / 180;
                        const radius = (node.zone || 3) * 45 + 30;
                        const endX = centerX + radius * Math.cos(angle);
                        const endY = centerY + radius * Math.sin(angle);
                        
                        const strokeColor = 'rgba(74, 93, 78, 0.3)';
                        const strokeWidth = "2";
                        const dash = "4 4";

                        return (
                            <Line 
                                key={`line-${node.id}`}
                                x1={centerX} y1={centerY}
                                x2={endX} y2={endY}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={dash}
                            />
                        );
                    })}
                </Svg>

                <View style={[styles.centerNode, { top: centerY - 45, left: centerX - 45 }]}>
                    <SelfNode size={90} energyCondition={labAnalysis.condition} />
                </View>

                {focusNodes.map((node, idx) => {
                    const angle = (idx * 360 / focusNodes.length) * Math.PI / 180;
                    
                    const radius = (node.zone || 3) * 45 + 30;
                    
                    const x = centerX + radius * Math.cos(angle) - 22;
                    const y = centerY + radius * Math.sin(angle) - 22;
                    
                    const character = getDynamicCharacter(node.interactions || []);
                    const rqsGrade = node.rqsResult?.grade ? RQS_GRADE_BADGES[node.rqsResult.grade] : null;
                    const zoneColor = ZONE_COLORS[node.zone || 3] || '#4A5D4E';

                    const renderIcon = () => {
                        if (!character) return null;
                        const iconSize = 10;
                        if (character.icon === 'Zap') return <Zap color="white" size={iconSize} />;
                        if (character.icon === 'Flame') return <Flame color="white" size={iconSize} fill="white" />;
                        if (character.icon === 'CircleDashed') return <CircleDashed color="white" size={iconSize} />;
                        return <Leaf color="white" size={iconSize} />;
                    };

                    return (
                        <View key={node.id} style={[styles.nodeContainer, { left: x, top: y }]}>
                            <View style={[styles.avatarFrame, { borderColor: zoneColor, borderWidth: 2.5 }]}>
                                <Image source={{ uri: node.image || 'https://via.placeholder.com/100' }} style={styles.nodeImg} />
                            </View>
                            
                            {/* Primary character badge (bottom-right) */}
                            <View style={styles.badgeContainer}>
                                {character && (
                                    <View style={[styles.iconBadge, { backgroundColor: character.color }]}>
                                        {renderIcon()}
                                    </View>
                                )}
                            </View>

                            {/* RQS grade supplementary badge (top-left) */}
                            {rqsGrade && (
                                <View style={[styles.rqsBadge, { backgroundColor: rqsGrade.color }]}>
                                    <Text style={styles.rqsBadgeText}>{rqsGrade.grade}</Text>
                                </View>
                            )}

                            <Text style={[styles.nodeLabel, { color: '#4A5D4E' }]}>{node.name}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    // ==========================================
    // VIEW 2: BALANCE (Matrix View)
    // ==========================================
    const renderBalanceView = () => {
        return (
            <View style={styles.mapArea}>
                <View style={{ padding: 20, paddingBottom: 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#4A5D4E' }}>정서 밸런스 매트릭스</Text>
                    <Text style={{ fontSize: 12, color: '#8C968D', marginTop: 4 }}>교감의 만족도와 에너지 소모를 분석합니다.</Text>
                </View>
               <View style={{ flex: 1, margin: 20, borderWidth: 1, borderColor: '#EBE5D9', borderRadius: 16, backgroundColor: 'white', overflow: 'hidden' }}>
                   {/* 십자선 배경 */}
                   <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: '#EBE5D9' }} />
                   <View style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: '#EBE5D9' }} />
                   
                   {relationships.map(node => {
                        const logs = node.interactions || [];
                        const lastLog = logs.slice(-1)[0];
                        const sat = lastLog?.satisfaction || node.temperature || 50;
                        const drain = lastLog?.energyDrain || 50;
                        
                        const x = (sat / 100) * (width - 80);
                        const y = ((100 - drain) / 100) * (MAP_HEIGHT - 120);
                        
                        const character = getDynamicCharacter(node.interactions || []);
                       const rqsGrade = node.rqsResult?.grade ? RQS_GRADE_BADGES[node.rqsResult.grade] : null;
                       const zoneColor = ZONE_COLORS[node.zone || 3] || '#4A5D4E';

                       return (
                           <View key={`bal-${node.id}`} style={[styles.nodeContainer, { left: x - 16, top: y - 16, position: 'absolute' }]}>
                               <View style={[styles.avatarFrame, { borderColor: zoneColor, borderWidth: 2, width: 32, height: 32, padding: 1 }]}>
                                   <Image source={{ uri: node.image || 'https://via.placeholder.com/100' }} style={{ width: 26, height: 26, borderRadius: 13 }} />
                               </View>

                                {/* Mini Badges for Matrix */}
                                {character && (
                                    <View style={[styles.iconBadge, { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: character.color, borderWidth: 1 }]}>
                                        {character.icon === 'Zap' && <Zap color="white" size={6} />}
                                        {character.icon === 'Flame' && <Flame color="white" size={6} fill="white" />}
                                        {character.icon === 'CircleDashed' && <CircleDashed color="white" size={6} />}
                                        {character.icon === 'Leaf' && <Leaf color="white" size={6} />}
                                    </View>
                                )}
                                {rqsGrade && (
                                    <View style={[styles.rqsBadge, { position: 'absolute', top: -2, left: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: rqsGrade.color, borderWidth: 1 }]}>
                                        <Text style={{ fontSize: 5, fontWeight: '900', color: 'white' }}>{rqsGrade.grade}</Text>
                                    </View>
                                )}

                               <Text style={{ fontSize: 8, fontWeight: '700', color: '#4A5D4E', marginTop: 2, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 4, borderRadius: 4 }}>{node.name}</Text>
                           </View>
                       );
                   })}
               </View>
            </View>
        );
    };

    const renderDynamicsView = () => {
        return (
            <View style={styles.mapArea}>
                <View style={{ padding: 20, paddingBottom: 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#4A5D4E' }}>궤도 역학 분석 (용량 점검)</Text>
                    <Text style={{ fontSize: 12, color: '#8C968D', marginTop: 4 }}>점선(권장 인원)을 기준으로 현재 인맥 밀도를 관망합니다.</Text>
                </View>

                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly', paddingHorizontal: 10, paddingBottom: 40 }}>
                    {[1, 2, 3, 4, 5].map(z => {
                        const count = labAnalysis.zoneCounts[z];
                        const cap = ZONE_CAPACITY[z as keyof typeof ZONE_CAPACITY];
                        const isOver = count > cap;
                        
                        // 권장 인원을 100px 높이로 기준 잡기
                        const normalHeight = Math.min(100, (count / cap) * 100);
                        // 초과분은 최대 60px까지만 렌더링 (총 160px)
                        const overHeight = isOver ? Math.min(60, ((count - cap) / cap) * 100) : 0;

                        return (
                            <View key={`dyn-${z}`} style={{ alignItems: 'center', width: 50 }}>
                                {/* 1. 현재 수치 표시 */}
                                <View style={{ marginBottom: 12, alignItems: 'center' }}>
                                    {isOver && <AlertCircle size={14} color="#D98B73" style={{ marginBottom: 2 }} />}
                                    <Text style={{ fontSize: 14, fontWeight: '900', color: isOver ? '#D98B73' : '#4A5D4E' }}>
                                        {count}<Text style={{ fontSize: 10, fontWeight: '600' }}> 명</Text>
                                    </Text>
                                </View>

                                {/* 2. 세로 막대 및 점선 기준선 */}
                                <View style={{ height: 160, width: 32, justifyContent: 'flex-end', alignItems: 'center' }}>
                                    
                                    {/* 점선(권장선) 가이드 */}
                                    <View style={{ position: 'absolute', bottom: 100, width: 50, borderBottomWidth: 1, borderBottomColor: '#A0AAB2', borderStyle: 'dashed', zIndex: 10 }} />
                                    <Text style={{ position: 'absolute', bottom: 104, fontSize: 9, color: '#A0AAB2', fontWeight: '700', backgroundColor: '#FAF8F4', paddingHorizontal: 4, zIndex: 11 }}>
                                        권장 {cap}
                                    </Text>

                                    {/* 초과분 막대 (붉은색 계열) */}
                                    {isOver && (
                                        <View style={{ height: overHeight, width: '100%', backgroundColor: '#D98B73', borderTopLeftRadius: 6, borderTopRightRadius: 6, zIndex: 6 }} />
                                    )}
                                    
                                    {/* 정상 범위 막대 (Zone 고유 컬러) */}
                                    <View style={{ height: normalHeight, width: '100%', backgroundColor: ZONE_COLORS[z], borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopLeftRadius: isOver ? 0 : 6, borderTopRightRadius: isOver ? 0 : 6, zIndex: 5 }} />
                                </View>

                                {/* 3. 하단 라벨 */}
                                <View style={{ marginTop: 16, alignItems: 'center' }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ZONE_COLORS[z], marginBottom: 6, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }} />
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#4A5D4E' }}>Zone {z}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            
            <View style={styles.header}>
                <View style={styles.tabIndicator}>
                    {(['FOCUS', 'BALANCE', 'DYNAMICS'] as LabViewMode[]).map((mode) => (
                        <TouchableOpacity key={mode} onPress={() => setViewMode(mode)} style={[styles.tabBtn, viewMode === mode && styles.tabBtnActive]}>
                            <Text style={[styles.tabText, viewMode === mode && styles.tabTextActive]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            <View style={{ height: MAP_HEIGHT }}>
                {viewMode === 'FOCUS' && renderFocusView()}
                {viewMode === 'BALANCE' && renderBalanceView()}
                {viewMode === 'DYNAMICS' && renderDynamicsView()}
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF8F4' },
    header: { paddingTop: 100, paddingHorizontal: 20, alignItems: 'center', zIndex: 10 },
    tabIndicator: { flexDirection: 'row', backgroundColor: 'rgba(74, 93, 78, 0.08)', borderRadius: 25, padding: 4 },
    tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
    tabBtnActive: { backgroundColor: '#4A5D4E' },
    tabText: { fontSize: 11, fontWeight: '800', color: '#8C968D' },
    tabTextActive: { color: 'white' },
    
    mapArea: { flex: 1, position: 'relative' },
    centerNode: { position: 'absolute', zIndex: 10 },
    nodeContainer: { position: 'absolute', alignItems: 'center', zIndex: 20 },
    avatarFrame: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', padding: 2, justifyContent: 'center', alignItems: 'center' },
    nodeImg: { width: 38, height: 38, borderRadius: 19 },
    vampireOverlay: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(44, 44, 44, 0.4)' },
    badgeContainer: { position: 'absolute', bottom: -2, right: -2, zIndex: 5 },
    iconBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'white' },
    rqsBadge: { position: 'absolute', top: -2, left: -2, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: 'white', zIndex: 6 },
    rqsBadgeText: { fontSize: 7, fontWeight: '900', color: 'white' },
    nodeLabel: { fontSize: 9, fontWeight: '900', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
});
