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
            const angleStep = 360 / zoneNodes.length;

            zoneNodes.forEach((node, idx) => {
                nodes.push({
                    node,
                    radius: baseRadius,
                    angle: idx * angleStep
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
