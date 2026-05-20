import { useMemo, useState, useCallback, useEffect } from 'react';
import { Dimensions, PanResponder } from 'react-native';
import * as ReAnimated from 'react-native-reanimated';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, Easing, cancelAnimation } from 'react-native-reanimated';
import { RelationshipNode, RELATIONSHIP_TYPE_LABELS } from '../../../types/relationship';
import { ZONE_FILTERS } from '../constants';

const { width, height } = Dimensions.get('window');

interface OrbitEngineProps {
    relationships: RelationshipNode[];
    viewState: {
        selectedFilters: string[];
        sortMode: 'default' | 'hot' | 'cold';
    };
    currentOrbitSize: number;
}

export const useOrbitEngine = ({ relationships, viewState, currentOrbitSize }: OrbitEngineProps) => {
    const { selectedFilters, sortMode } = viewState;

    // ─── 🕹️ Pan & Zoom Shared Values ──────────────────────────────────
    const panX = useSharedValue(0);
    const panY = useSharedValue(0);
    const scale = useSharedValue(1);
    const [isMoved, setIsMoved] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleRecenter = useCallback(() => {
        panX.value = ReAnimated.withSpring(0);
        panY.value = ReAnimated.withSpring(0);
        scale.value = ReAnimated.withSpring(1);
        setIsMoved(false);
    }, []);

    // ─── 🖐️ PanResponder Logic ────────────────────────────────────────
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            setIsMoved(true);
        },
        onPanResponderMove: (_, gesture) => {
            panX.value = gesture.dx;
            panY.value = gesture.dy;
        },
        onPanResponderRelease: (_, gesture) => {
            panX.value = ReAnimated.withSpring(gesture.dx);
            panY.value = ReAnimated.withSpring(gesture.dy);
        },
    }), []);

    // ─── 🧬 Node Distribution Logic ───────────────────────────────────
    const filteredRelationships = useMemo(() => {
        if (!relationships) return [];
        if (selectedFilters.includes('전체')) return relationships;

        return relationships.filter(r => {
            if (!r) return false;
            const rType = RELATIONSHIP_TYPE_LABELS[r.type] || r.type;
            const zoneMatch = ZONE_FILTERS.find(zf => zf.zone === r.zone);
            const rZoneLabel = zoneMatch ? zoneMatch.label : (r.zone ? `Zone ${r.zone}` : '');
            return (selectedFilters.includes(rType) || selectedFilters.includes(rZoneLabel));
        });
    }, [relationships, selectedFilters]);

    const distributedNodes = useMemo(() => {
        const nodes: Array<{ node: RelationshipNode; radius: number; angle: number }> = [];
        const zoneGroups: { [key: number]: RelationshipNode[] } = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        filteredRelationships.forEach(node => {
            if (node && node.zone && zoneGroups[node.zone]) {
                zoneGroups[node.zone].push(node);
            }
        });

        Object.keys(zoneGroups).sort().forEach(zoneStr => {
            const zone = parseInt(zoneStr);
            const zoneNodes = zoneGroups[zone];
            if (zoneNodes.length === 0) return;

            const baseRadius = (currentOrbitSize * (zone + 0.5)) / 7;
            const zoneWidth = currentOrbitSize / 8;
            const zoneRange = zoneWidth * 0.8;

            // 1. 체크인 데이터가 있는 노드 분류 및 온도 범위 추출
            const nodesWithData = zoneNodes.filter(n => n.interactions && n.interactions.length > 0);
            
            let minTemp = 50;
            let maxTemp = 50;
            
            if (nodesWithData.length > 0) {
                const temps = nodesWithData.map(n => n.temperature ?? 50);
                minTemp = Math.min(...temps);
                maxTemp = Math.max(...temps);
            }

            const angleStep = 360 / zoneNodes.length;

            zoneNodes.forEach((node, idx) => {
                let energyOffset = 0;
                
                // 2. 동적 반경 오프셋(Dynamic Energy Offset) 계산
                if (node.interactions && node.interactions.length > 0) {
                    const temp = node.temperature ?? 50;
                    if (maxTemp > minTemp) {
                        const t_norm = (temp - minTemp) / (maxTemp - minTemp);
                        // 에너지가 높으면(-), 낮으면(+) 오프셋 이동
                        energyOffset = (0.5 - t_norm) * zoneRange; 
                    } else {
                        energyOffset = 0; // 모두 동일한 온도일 경우 중앙
                    }
                } else {
                    // 체크인 데이터 없음: 최외곽 배치 (t_norm = 0 과 동일한 양수 오프셋 최대치)
                    energyOffset = 0.5 * zoneRange;
                }
                
                // 3. 고유 ID 기반 지터(Jitter) 생성 - 겹침 완벽 방지
                const jitterSeed = parseInt(node.id.slice(-4), 16) || (idx * 997);
                const jitterRadius = (jitterSeed % 31) - 15; // 반경 흔들림: -15px ~ +15px
                const jitterAngle = (jitterSeed % 21) - 10;  // 각도 흔들림: -10도 ~ +10도

                nodes.push({
                    node,
                    radius: baseRadius + energyOffset + jitterRadius,
                    angle: (idx * angleStep + jitterAngle) % 360
                });
            });
        });

        return nodes;
    }, [filteredRelationships, currentOrbitSize]);

    // ─── ✨ Animated Styles ───────────────────────────────────────────
    const canvasAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: panX.value },
            { translateY: panY.value },
            { scale: scale.value }
        ]
    }));

    const selfHaloStyle = useAnimatedStyle(() => ({
        opacity: ReAnimated.withRepeat(ReAnimated.withTiming(0.4, { duration: 1500 }), -1, true),
        transform: [{ scale: ReAnimated.withRepeat(ReAnimated.withTiming(1.2, { duration: 1500 }), -1, true) }]
    }));

    const selfHaloSizeStyle = { width: 120, height: 120, borderRadius: 60 };
    const centerNodeSizeStyle = { width: 80, height: 80, borderRadius: 40 };
    const centerAvatarSizeStyle = { width: 72, height: 72, borderRadius: 36 };

    return {
        panX, panY, zoomLevel: scale, zoomSharedValue: scale,
        isMoved, handleRecenter, panResponder, 
        distributedNodes, isFocused,
        canvasAnimatedStyle, selfHaloStyle, selfHaloSizeStyle, centerNodeSizeStyle, centerAvatarSizeStyle
    };
};
