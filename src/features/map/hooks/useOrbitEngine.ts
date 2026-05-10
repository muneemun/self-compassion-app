import { useMemo } from 'react';
import { RelationshipNode, RELATIONSHIP_TYPE_LABELS } from '../../../types/relationship';
import { ZONE_FILTERS } from '../constants';

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

    const filteredRelationships = useMemo(() => {
        if (!relationships) return [];
        if (selectedFilters.includes('전체')) return relationships;

        return relationships.filter(r => {
            if (!r) return false;
            const rType = RELATIONSHIP_TYPE_LABELS[r.type] || r.type;
            const zoneMatch = ZONE_FILTERS.find(zf => zf.zone === r.zone);
            const rZoneLabel = zoneMatch ? zoneMatch.label : (r.zone ? `Zone ${r.zone}` : '');
            return (rType && selectedFilters.includes(rType)) || (rZoneLabel && selectedFilters.includes(rZoneLabel));
        });
    }, [relationships, selectedFilters]);

    const positionedNodes = useMemo(() => {
        const zoneGroups: { [key: number]: RelationshipNode[] } = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        filteredRelationships.forEach(node => {
            if (node && node.zone && zoneGroups[node.zone]) {
                zoneGroups[node.zone].push(node);
            }
        });

        const nodes: Array<{ node: RelationshipNode; radius: number; angle: number }> = [];
        let startAngleOffset = 0;

        Object.keys(zoneGroups).sort().forEach(zoneStr => {
            const zone = parseInt(zoneStr);
            const zoneNodes = zoneGroups[zone];
            if (zoneNodes.length === 0) return;

            let sortedNodes = [...zoneNodes];
            if (sortMode === 'default') {
                sortedNodes.sort((a, b) => b.id.localeCompare(a.id));
            } else if (sortMode === 'hot') {
                sortedNodes.sort((a, b) => b.temperature - a.temperature);
            } else if (sortMode === 'cold') {
                sortedNodes.sort((a, b) => a.temperature - b.temperature);
            }

            const baseCircleRadius = (currentOrbitSize * (zone + 0.5)) / 7;
            const zoneWidth = currentOrbitSize / 8;

            sortedNodes.forEach((node, idx) => {
                const progress = idx / sortedNodes.length;
                let angle, radius;

                if (sortMode !== 'default') {
                    angle = (startAngleOffset + progress * 360) % 360;
                    const innerToOuterOffset = (progress - 0.5) * (zoneWidth * 0.6);
                    radius = baseCircleRadius + innerToOuterOffset;
                } else {
                    const maxPerLayer = zone <= 2 ? 5 : (zone === 3 ? 10 : 15);
                    const numLayers = Math.ceil(sortedNodes.length / maxPerLayer);
                    const layerIdx = idx % numLayers;
                    const idxInLayer = Math.floor(idx / numLayers);
                    const totalInThisLayer = Math.ceil(sortedNodes.length / numLayers);

                    const jitterSeed = parseInt(node.id.slice(-2), 16) || 0;
                    const jitterRadius = (jitterSeed % 10 - 5) * 4;
                    const jitterAngle = (jitterSeed % 20 - 10);

                    const layerOffset = numLayers > 1
                        ? (layerIdx - (numLayers - 1) / 2) * (zoneWidth / (numLayers + 0.2))
                        : 0;
                    radius = baseCircleRadius + layerOffset + jitterRadius;

                    const baseAngle = (idxInLayer * (360 / totalInThisLayer));
                    const staggerOffset = layerIdx * (360 / (numLayers * 2.5));
                    angle = (baseAngle + staggerOffset + startAngleOffset + jitterAngle) % 360;
                }

                nodes.push({ node, radius, angle });
            });

            startAngleOffset = (startAngleOffset + 45) % 360;
        });

        return nodes;
    }, [filteredRelationships, currentOrbitSize, sortMode]);

    return {
        positionedNodes,
        filteredCount: filteredRelationships.length
    };
};
