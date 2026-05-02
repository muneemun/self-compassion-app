import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, ScrollView } from 'react-native';
import { Rocket, LayoutGrid, Activity, SlidersHorizontal, Info, Sparkles, ChevronRight, AlertCircle, TrendingUp, Zap, Flame, Snowflake, Skull, Shield, ArrowDown, ArrowUp, RefreshCcw } from 'lucide-react-native';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { SelfNode } from './SelfNode';
import Svg, { Circle, G, Path, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import ReAnimated, { useAnimatedStyle, withRepeat, withTiming, Easing, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.55;

type LabViewMode = 'FOCUS' | 'BALANCE' | 'DYNAMICS';
type SimEffect = 'NONE' | 'DRAIN' | 'BOOST' | 'RESTRUCTURE' | 'PURIFY';

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
    
    // 🧪 Simulation State
    const [simEffect, setSimEffect] = useState<SimEffect>('NONE');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastAnim = useRef(new Animated.Value(-100)).current;

    const triggerSimulation = (effect: SimEffect, message: string) => {
        setSimEffect(effect);
        setToastMessage(message);
        
        Animated.spring(toastAnim, {
            toValue: 60,
            useNativeDriver: true,
            tension: 50,
            friction: 7
        }).start();

        setTimeout(() => {
            Animated.timing(toastAnim, {
                toValue: -150,
                duration: 400,
                useNativeDriver: true
            }).start(() => {
                setToastMessage(null);
                setSimEffect('NONE');
            });
        }, 4000);
    };

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

        // 🧪 Override for Restructure Simulation
        if (simEffect === 'RESTRUCTURE') {
            overloadedZones = [];
            primaryIssueZone = null;
        }

        const vampires = relationships.filter(r => (r.rqsResult?.grade === 'C'));
        const antidotes = relationships.filter(r => (r.rqsResult?.grade === 'S'));

        let energy = 85; 
        overloadedZones.forEach(z => { energy -= (zoneCounts[z] - ZONE_CAPACITY[z as keyof typeof ZONE_CAPACITY]) * 2; });
        energy -= vampires.length * 10;
        energy += antidotes.length * 5;
        
        // 🧪 Override for Energy Simulations
        if (simEffect === 'DRAIN') energy = Math.max(5, energy - 30);
        if (simEffect === 'BOOST') energy = Math.min(100, energy + 20);

        return {
            condition: Math.max(5, Math.min(100, energy)),
            overloadedZones,
            primaryIssueZone,
            topVampire: vampires.length > 0 ? vampires[0] : null,
            zoneCounts
        };
    }, [relationships, simEffect]);

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
    // SIMULATION PANEL (TEST UI)
    // ==========================================
    const renderSimulationPanel = () => (
        <View style={styles.simPanel}>
            <Text style={styles.simTitle}>🧪 메타인지 피드백 테스트</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
                <TouchableOpacity style={styles.simBtn} onPress={() => triggerSimulation('DRAIN', '관측 데이터가 궤도에 동기화되었습니다. 태양(자아)의 에너지가 18% 감소한 상태로 맵에 반영되었습니다.')}>
                    <Text style={styles.simBtnText}>상호작용(감소) ⬇️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simBtn} onPress={() => triggerSimulation('RESTRUCTURE', '궤도 재배치가 완료되었습니다. Zone 2의 과밀 상태가 해소되어 구조적 여유가 확보되었습니다.')}>
                    <Text style={styles.simBtnText}>물리적 궤도 이동 💫</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simBtn} onPress={() => triggerSimulation('PURIFY', '외부 중력장의 간섭을 차단했습니다. 시스템이 자아(Self)에 온전히 집중하는 정화 모드로 전환됩니다.')}>
                    <Text style={styles.simBtnText}>자아 돌봄(휴식) 🧘</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderToast = () => {
        if (!toastMessage) return null;
        return (
            <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
                <Info size={16} color="#4A5D4E" />
                <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
        );
    };

    // ==========================================
    // VIEW 1: FOCUS (Gravity Lines)
    // ==========================================
    const renderFocusView = () => {
        const centerX = width / 2;
        const centerY = MAP_HEIGHT / 2;

        return (
            <View style={[styles.mapArea, simEffect === 'PURIFY' && { backgroundColor: 'rgba(250,248,244, 0.8)' }]}>
                {/* SVG lines drawn explicitly behind nodes */}
                <Svg 
                    style={[StyleSheet.absoluteFill, { opacity: simEffect === 'PURIFY' ? 0.1 : 1 }]}
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
                        
                        // 🧪 Simulation Effects on Lines
                        const isDraining = simEffect === 'DRAIN' && node.rqsResult?.grade === 'C';
                        const strokeColor = isDraining ? 'rgba(217, 139, 115, 0.8)' : 'rgba(74, 93, 78, 0.3)';
                        const strokeWidth = isDraining ? "3" : "2";
                        const dash = isDraining ? "none" : "4 4";

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
                    
                    // 🧪 Simulation Turbulence
                    const turbulence = simEffect === 'DRAIN' ? (Math.sin(idx * 5) * 6) : 0;
                    const radius = (node.zone || 3) * 45 + 30 + turbulence;
                    
                    const x = centerX + radius * Math.cos(angle) - 22;
                    const y = centerY + radius * Math.sin(angle) - 22;
                    
                    const zoneColor = ZONE_COLORS[node.zone || 3] || '#4A5D4E';
                    const isVampire = node.rqsResult?.grade === 'C';
                    const isAnchor = node.rqsResult?.grade === 'S';

                    return (
                        <View key={node.id} style={[styles.nodeContainer, { left: x, top: y, opacity: simEffect === 'PURIFY' ? 0.2 : 1 }]}>
                            <View style={[styles.avatarFrame, { borderColor: zoneColor, borderWidth: 2.5 }]}>
                                <Image source={{ uri: node.image || 'https://via.placeholder.com/100' }} style={styles.nodeImg} />
                                {isVampire && <View style={styles.vampireOverlay} />}
                            </View>
                            <View style={styles.badgeContainer}>
                                {isVampire ? (
                                    <View style={[styles.iconBadge, { backgroundColor: '#2C2C2C' }]}><Skull color="white" size={10} /></View>
                                ) : isAnchor ? (
                                    <View style={[styles.iconBadge, { backgroundColor: '#D98B73' }]}><Shield color="white" size={10} /></View>
                                ) : null}
                            </View>
                            <Text style={[styles.nodeLabel, { color: '#4A5D4E' }]}>{node.name}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderToast()}
            
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
                {/* Fallback for others in this test demo */}
                {viewMode !== 'FOCUS' && <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>테스트를 위해 FOCUS 뷰로 전환하세요.</Text></View>}
            </View>

            {renderSimulationPanel()}
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
    nodeLabel: { fontSize: 9, fontWeight: '900', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    
    // Toast
    toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, zIndex: 999 },
    toastText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#4A5D4E', lineHeight: 18 },

    // Simulation Panel
    simPanel: { position: 'absolute', bottom: 110, left: 0, right: 0, backgroundColor: 'white', paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: {width: 0, height: -10}, shadowOpacity: 0.05, shadowRadius: 20, elevation: 20 },
    simTitle: { fontSize: 12, fontWeight: '900', color: '#D98B73', marginBottom: 12, paddingHorizontal: 20 },
    simBtn: { backgroundColor: '#F5F5F5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    simBtnText: { fontSize: 12, fontWeight: '700', color: '#4A5D4E' },
});
