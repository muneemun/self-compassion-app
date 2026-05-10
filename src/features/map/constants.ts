import { RelationshipNode } from '../../types/relationship';

export const ZONE_FILTERS = [
    { label: 'Zone 1', zone: 1 },
    { label: 'Zone 2', zone: 2 },
    { label: 'Zone 3', zone: 3 },
    { label: 'Zone 4', zone: 4 },
    { label: 'Zone 5', zone: 5 },
];

export const getDynamicTabs = (relationships: RelationshipNode[]) => {
    // 1. 존재하는 관계 타입 추출
    const types = Array.from(new Set(relationships.map(r => r.type)));
    const typeLabels = types.map(t => {
        const labels: Record<string, string> = {
            'family': '가족',
            'friend': '친구',
            'work': '직장',
            'partner': '연인',
            'other': '기타'
        };
        return labels[t.toLowerCase()] || t;
    });

    // 2. 고정된 Zone 필터 라벨 추출
    const zoneLabels = ZONE_FILTERS.map(zf => zf.label);

    // 3. '전체' + 타입 필터 + Zone 필터 합치기
    return ['전체', ...typeLabels, ...zoneLabels];
};

export const SORT_MODES = {
    DEFAULT: 'default',
    HOT: 'hot',
    COLD: 'cold'
};
