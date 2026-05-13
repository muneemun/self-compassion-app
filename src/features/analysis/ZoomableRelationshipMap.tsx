import React, { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width, height } = Dimensions.get('window');
const MAP_SIZE = 800;
const NODE_RADIUS = 18;
const NODE_DIAMETER = NODE_RADIUS * 2;
const NODE_MIN_GAP = 4; // Minimum gap between nodes

const ZONE_COLORS: Record<number, string> = {
    1: '#FFB74D',
    2: '#D98B73',
    3: '#4A5D4E',
    4: '#90A4AE',
    5: '#D1D5DB'
};

// Collision avoidance: push overlapping nodes apart
const resolveCollisions = (nodes: { x: number; y: number; [key: string]: any }[]) => {
    const minDist = NODE_DIAMETER + NODE_MIN_GAP;
    const padding = 100; // Map padding from edges
    const maxIterations = 50;

    for (let iter = 0; iter < maxIterations; iter++) {
        let moved = false;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDist) {
                    moved = true;
                    const overlap = (minDist - dist) / 2;
                    // Normalize direction; if perfectly overlapping, push in random direction
                    const angle = dist > 0.01 ? Math.atan2(dy, dx) : (Math.PI / 4) * (i % 4);
                    const pushX = Math.cos(angle) * (overlap + 1);
                    const pushY = Math.sin(angle) * (overlap + 1);

                    nodes[i].x -= pushX;
                    nodes[i].y -= pushY;
                    nodes[j].x += pushX;
                    nodes[j].y += pushY;

                    // Clamp within map bounds
                    nodes[i].x = Math.max(padding, Math.min(MAP_SIZE - padding, nodes[i].x));
                    nodes[i].y = Math.max(padding, Math.min(MAP_SIZE - padding, nodes[i].y));
                    nodes[j].x = Math.max(padding, Math.min(MAP_SIZE - padding, nodes[j].x));
                    nodes[j].y = Math.max(padding, Math.min(MAP_SIZE - padding, nodes[j].y));
                }
            }
        }
        if (!moved) break;
    }
    return nodes;
};

export const ZoomableRelationshipMap: React.FC<{ dateRange?: {start: Date, end: Date} | null; onClose?: () => void; onSelectNode?: (id: string) => void }> = ({ dateRange, onClose, onSelectNode }) => {
    const colors = useColors();
    const relationships = useRelationshipStore(state => state.relationships);

    // Dynamic layout measurement for accurate centering
    const [mapAreaHeight, setMapAreaHeight] = useState(0);

    // Calculate initial scale so the entire MAP_SIZE fits within screen width
    // Scale applies around center (MAP_SIZE/2, MAP_SIZE/2), so center stays put.
    // Since transform order is [scale, translate], translate operates in SCALED space.
    const computedHeight = mapAreaHeight > 0 ? mapAreaHeight : (height - 320);
    const fitScale = Math.min(width / MAP_SIZE, computedHeight / MAP_SIZE);
    const initialScale = fitScale;
    const initialTranslateX = (width / 2 - MAP_SIZE / 2) / fitScale;
    const initialTranslateY = (computedHeight / 2 - MAP_SIZE / 2) / fitScale;

    const scale = useSharedValue(initialScale);
    const savedScale = useSharedValue(initialScale);
    const translateX = useSharedValue(initialTranslateX);
    const translateY = useSharedValue(initialTranslateY);
    const savedTranslateX = useSharedValue(initialTranslateX);
    const savedTranslateY = useSharedValue(initialTranslateY);

    // Re-center when actual layout is measured
    useEffect(() => {
        if (mapAreaHeight > 0) {
            const newFit = Math.min(width / MAP_SIZE, mapAreaHeight / MAP_SIZE);
            const newTX = (width / 2 - MAP_SIZE / 2) / newFit;
            const newTY = (mapAreaHeight / 2 - MAP_SIZE / 2) / newFit;
            scale.value = newFit;
            savedScale.value = newFit;
            translateX.value = newTX;
            translateY.value = newTY;
            savedTranslateX.value = newTX;
            savedTranslateY.value = newTY;
        }
    }, [mapAreaHeight]);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 0.3) scale.value = withSpring(0.3);
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
        let data = relationships
            .filter(node => {
                if (!dateRange) return (node.interactions || []).length > 0;
                const valid = (node.interactions || []).filter(i => {
                    const iDate = new Date(i.createdAt || i.date);
                    return iDate >= dateRange.start && iDate <= dateRange.end;
                });
                return valid.length > 0;
            })
            .map(node => {
                const logs = dateRange 
                    ? (node.interactions || []).filter(i => {
                        const iDate = new Date(i.createdAt || i.date);
                        return iDate >= dateRange.start && iDate <= dateRange.end;
                    }) 
                    : (node.interactions || []);

                const lastLog = logs.slice(-1)[0];
                const sat = lastLog?.satisfaction ?? 50;
                const drain = lastLog?.energyDrain ?? 50;

                if (sat < 50 && drain >= 50) counts.q1++;
                else if (sat >= 50 && drain >= 50) counts.q2++;
                else if (sat < 50 && drain < 50) counts.q3++;
                else if (sat >= 50 && drain < 50) counts.q4++;

                return {
                    id: node.id,
                    name: node.name,
                    image: node.image,
                    x: 100 + (drain / 100) * (MAP_SIZE - 200),
                    y: MAP_SIZE - (100 + (sat / 100) * (MAP_SIZE - 200)),
                    color: ZONE_COLORS[node.zone as keyof typeof ZONE_COLORS] || '#90A4AE',
                    zone: node.zone,
                };
            });

        // Resolve node collisions
        data = resolveCollisions(data);

        return { data, counts };
    }, [relationships, dateRange]);

    // Reset to fit-all view
    const handleResetView = () => {
        const h = mapAreaHeight > 0 ? mapAreaHeight : computedHeight;
        const fs = Math.min(width / MAP_SIZE, h / MAP_SIZE);
        const tx = (width / 2 - MAP_SIZE / 2) / fs;
        const ty = (h / 2 - MAP_SIZE / 2) / fs;
        scale.value = withSpring(fs);
        translateX.value = withSpring(tx);
        translateY.value = withSpring(ty);
        savedScale.value = fs;
        savedTranslateX.value = tx;
        savedTranslateY.value = ty;
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapWrapper} onLayout={(e) => setMapAreaHeight(e.nativeEvent.layout.height)}>
                <GestureDetector gesture={composed}>
                    <Animated.View style={[styles.mapContainer, animatedStyle]}>
                        {/* SVG Background: Axes, quadrant labels */}
                        <Svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} style={StyleSheet.absoluteFill}>
                            {/* Quadrant Crosshair */}
                            <Line x1="0" y1={MAP_SIZE / 2} x2={MAP_SIZE} y2={MAP_SIZE / 2} stroke={colors.primary} strokeWidth="2" opacity="0.1" />
                            <Line x1={MAP_SIZE / 2} y1="0" x2={MAP_SIZE / 2} y2={MAP_SIZE} stroke={colors.primary} strokeWidth="2" opacity="0.1" />

                            <SvgText x={MAP_SIZE - 250} y={150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08">성장의 자극</SvgText>
                            <SvgText x="250" y={150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08" textAnchor="end">✨ 나의 비타민</SvgText>
                            <SvgText x="250" y={MAP_SIZE - 150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08" textAnchor="end">일상의 중력</SvgText>
                            <SvgText x={MAP_SIZE - 250} y={MAP_SIZE - 150} fontSize="32" fontWeight="900" fill={colors.primary} opacity="0.08">⚠️ 주의가 필요해</SvgText>

                            {/* Axis Labels */}
                            <SvgText x={MAP_SIZE / 2} y={MAP_SIZE - 20} fontSize="14" fontWeight="800" fill={colors.primary} opacity="0.4" textAnchor="middle">낮음 ← 에너지 소모 → 높음</SvgText>
                            <SvgText x={20} y={MAP_SIZE / 2} fontSize="14" fontWeight="800" fill={colors.primary} opacity="0.4" textAnchor="middle" transform={`rotate(-90, 20, ${MAP_SIZE / 2})`}>낮음 ← 관계 만족도 → 높음</SvgText>
                        </Svg>

                        {/* Node Layer: RN Views over SVG for image support */}
                        {points.data.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                onPress={() => onSelectNode?.(p.id)}
                                activeOpacity={0.7}
                                style={[
                                    styles.nodeContainer,
                                    {
                                        left: p.x - NODE_RADIUS,
                                        top: p.y - NODE_RADIUS,
                                        width: NODE_DIAMETER,
                                        height: NODE_DIAMETER,
                                        borderRadius: NODE_RADIUS,
                                        borderColor: p.color,
                                    }
                                ]}
                            >
                                {p.image ? (
                                    <Image
                                        source={{ uri: p.image }}
                                        style={styles.nodeImage}
                                    />
                                ) : (
                                    <View style={[styles.nodeInitial, { backgroundColor: p.color }]}>
                                        <Text style={styles.nodeInitialText}>{p.name.charAt(0)}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>

            <View style={styles.guideTextContainer}>
                <Text style={styles.guideText}>두 손가락으로 확대/축소하거나 드래그하여 이동하세요</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.legendContainer}>
                    <View style={styles.legendGrid}>
                        <View style={styles.legendItem}>
                            <Text style={styles.legendText}>{`✨ 나의 비타민 ${points.counts.q4}`}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <Text style={styles.legendText}>{`⚡️ 성장 자극 ${points.counts.q2}`}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <Text style={styles.legendText}>{`🧱 일상의 중력 ${points.counts.q3}`}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <Text style={styles.legendText}>{`⚠️ 주의 필요 ${points.counts.q1}`}</Text>
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
                        <TouchableOpacity style={styles.zoomBtn} onPress={handleResetView}>
                            <Maximize size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.zoomBtn} onPress={() => { scale.value = withSpring(Math.max(0.3, scale.value - 0.5)); savedScale.value = scale.value; }}>
                            <ZoomOut size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCF9F2' },
    guideTextContainer: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(74,93,78,0.02)' },
    guideText: { fontSize: 11, fontWeight: '700', color: '#8C968D', opacity: 0.8 },
    mapWrapper: { flex: 1, overflow: 'hidden' },
    mapContainer: {
        width: MAP_SIZE,
        height: MAP_SIZE,
        backgroundColor: '#FAF8F4',
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },
    // Node styling
    nodeContainer: {
        position: 'absolute',
        borderWidth: 3,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    nodeImage: {
        width: '100%',
        height: '100%',
        borderRadius: NODE_RADIUS,
    },
    nodeInitial: {
        width: '100%',
        height: '100%',
        borderRadius: NODE_RADIUS,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nodeInitialText: {
        fontSize: 14,
        fontWeight: '900',
        color: 'white',
    },
    // Footer
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
    legendText: { fontSize: 12, fontWeight: '700', color: '#4A5D4E' },
    controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalBadge: { backgroundColor: '#4A5D4E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    totalBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    zoomControls: { flexDirection: 'row', gap: 8 },
    zoomBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
});
