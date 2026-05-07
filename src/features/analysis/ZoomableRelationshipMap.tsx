import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Line, G, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');
const MAP_SIZE = 800;

export const ZoomableRelationshipMap: React.FC<{ onClose: () => void; onSelectNode?: (id: string) => void }> = ({ onClose, onSelectNode }) => {
    const colors = useColors();
    const relationships = useRelationshipStore(state => state.relationships);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 0.5) scale.value = withSpring(0.5);
            if (scale.value > 3) scale.value = withSpring(3);
            savedScale.value = scale.value;
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX / scale.value;
            translateY.value = savedTranslateY.value + e.translationY / scale.value;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    const points = useMemo(() => {
        const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
        const data = relationships.map(node => {
            const lastHistory = (node.history || []).slice(-1)[0];
            const prevHistory = (node.history || []).slice(-2, -1)[0];
            const sat = lastHistory?.satisfaction ?? 50;
            const drain = lastHistory?.energyDrain ?? 50;
            const prevDrain = prevHistory?.energyDrain ?? drain;

            if (sat < 50 && drain >= 50) counts.q1++;
            else if (sat >= 50 && drain >= 50) counts.q2++;
            else if (sat < 50 && drain < 50) counts.q3++;
            else if (sat >= 50 && drain < 50) counts.q4++;

            let daysSince = -1;
            if (lastHistory?.createdAt) {
                const diff = new Date().getTime() - new Date(lastHistory.createdAt).getTime();
                daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));
            }

            return {
                id: node.id,
                name: node.name,
                x: 100 + (sat / 100) * (MAP_SIZE - 200),
                y: MAP_SIZE - (100 + (drain / 100) * (MAP_SIZE - 200)),
                color: node.zone === 1 ? '#FFB74D' : node.zone === 2 ? '#D98B73' : node.zone === 3 ? '#4A5D4E' : '#90A4AE',
                sat,
                drain,
                energyShift: drain > prevDrain ? 'up' : drain < prevDrain ? 'down' : 'stable',
                daysSince,
                zone: node.zone
            };
        });
        return { data, counts };
    }, [relationships]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.guideTextContainer}>
                    <Text style={styles.guideText}>두 손가락으로 확대/축소하거나 드래그하여 이동하세요</Text>
                </View>

                <View style={styles.mapWrapper}>
                    <GestureDetector gesture={composed}>
                        <Animated.View style={[styles.mapContainer, animatedStyle]}>
                            <Svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
                                {/* Quadrant Crosshair */}
                                <Line x1="0" y1={MAP_SIZE / 2} x2={MAP_SIZE} y2={MAP_SIZE / 2} stroke={colors.primary} strokeWidth="2" opacity="0.1" />
                                <Line x1={MAP_SIZE / 2} y1="0" x2={MAP_SIZE / 2} y2={MAP_SIZE} stroke={colors.primary} strokeWidth="2" opacity="0.1" />
                                
                                <SvgText x={MAP_SIZE - 250} y={150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08">에너지 충전소</SvgText>
                                <SvgText x="250" y={150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08" textAnchor="end">에너지 포식자</SvgText>
                                <SvgText x="250" y={MAP_SIZE - 150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08" textAnchor="end">피곤한 관계</SvgText>
                                <SvgText x={MAP_SIZE - 250} y={MAP_SIZE - 150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08">편안한 관계</SvgText>

                                {points.data.map((p) => {
                                    return (
                                        <G key={p.id}>
                                            {/* Energy Shift Indicator */}
                                            {p.energyShift !== 'stable' && (
                                                <SvgText x={p.x + 18} y={p.y - 10} fontSize="14" fill={p.energyShift === 'up' ? '#D98B73' : '#4A5D4E'}>
                                                    {p.energyShift === 'up' ? '↑' : '↓'}
                                                </SvgText>
                                            )}
                                            
                                            <Circle 
                                                cx={p.x} 
                                                cy={p.y} 
                                                r={14} 
                                                fill={p.color} 
                                                stroke="white" 
                                                strokeWidth="3" 
                                                onPress={() => onSelectNode?.(p.id)} 
                                            />
                                            
                                            <G pointerEvents="none">
                                                <SvgText x={p.x} y={p.y + 30} fontSize="14" fontWeight="900" fill={colors.primary} textAnchor="middle">{p.name}</SvgText>
                                                <SvgText x={p.x} y={p.y + 46} fontSize="10" fontWeight="700" fill={colors.primary} opacity="0.4" textAnchor="middle">
                                                    {`${p.sat} / ${p.drain}`}
                                                </SvgText>
                                                {p.daysSince >= 0 && (
                                                    <SvgText x={p.x} y={p.y + 58} fontSize="9" fontWeight="800" fill={p.daysSince > 14 ? '#D98B73' : '#8C968D'} textAnchor="middle">
                                                        {`D+${p.daysSince}`}
                                                    </SvgText>
                                                )}
                                            </G>
                                        </G>
                                    );
                                })}
                            </Svg>
                        </Animated.View>
                    </GestureDetector>
                </View>

                <View style={styles.footer}>
                    <View style={styles.legendContainer}>
                        <View style={styles.legendGrid}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#D98B73' }]} />
                                <Text style={styles.legendText}>{`포식자 ${points.counts.q1}`}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#FFB74D' }]} />
                                <Text style={styles.legendText}>{`충전소 ${points.counts.q2}`}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
                                <Text style={styles.legendText}>{`피곤함 ${points.counts.q3}`}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#4A5D4E' }]} />
                                <Text style={styles.legendText}>{`편안함 ${points.counts.q4}`}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.controlsContainer}>
                        <View style={styles.totalBadge}>
                            <Text style={styles.totalBadgeText}>{`TOTAL ${points.data.length}`}</Text>
                        </View>
                        <View style={styles.zoomControls}>
                            <TouchableOpacity style={styles.zoomBtn} onPress={() => { scale.value = withSpring(Math.min(3, scale.value + 0.5)); savedScale.value = scale.value; }}>
                                <ZoomIn size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.zoomBtn} onPress={() => { 
                                scale.value = withSpring(1);
                                translateX.value = withSpring(0);
                                translateY.value = withSpring(0);
                                savedScale.value = 1;
                                savedTranslateX.value = 0;
                                savedTranslateY.value = 0;
                            }}>
                                <Maximize size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.zoomBtn} onPress={() => { scale.value = withSpring(Math.max(0.5, scale.value - 0.5)); savedScale.value = scale.value; }}>
                                <ZoomOut size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCF9F2' },
    safeArea: { flex: 1 },
    guideTextContainer: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(74,93,78,0.02)' },
    guideText: { fontSize: 11, fontWeight: '700', color: '#8C968D', opacity: 0.8 },
    mapWrapper: { flex: 1, overflow: 'hidden' },
    mapContainer: { width: MAP_SIZE, height: MAP_SIZE, alignItems: 'center', justifyContent: 'center' },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)', backgroundColor: '#fff' },
    legendContainer: { marginBottom: 20 },
    legendGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 12 
    },
    legendItem: { 
        width: '45%', 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6 
    },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, fontWeight: '700', color: '#4A5D4E' },
    controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalBadge: { backgroundColor: '#4A5D4E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    totalBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    zoomControls: { flexDirection: 'row', gap: 8 },
    zoomBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
});
