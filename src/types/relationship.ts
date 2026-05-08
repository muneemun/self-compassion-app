export type RelationshipType = 'family' | 'work' | 'friend' | 'mentor' | 'partner' | 'other';

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
    family: '가족',
    work: '업무',
    friend: '친구',
    partner: '연인',
    mentor: '멘토',
    other: '기타'
};

export interface HealthMetrics {
    trust: number;        // 0-100
    communication: number; // 0-100
    frequency: number;     // 0-100
    satisfaction: number;  // 0-100
}

export interface Interaction {
    id: string;
    date: string;
    createdAt: string;
    satisfaction: number;
    energyDrain: number;
    title: string;
    description?: string;
    closeness?: number;
}

export interface SystemLog {
    id: string;
    date: string;
    createdAt: string;
    event: string;
    details?: string;
    oldValue?: any;
    newValue?: any;
}

export interface RelationshipNode {
    id: string;
    name: string;
    role: string;
    type: RelationshipType;
    image?: string;
    phoneNumber?: string;

    // Dynamic State
    zone: number;        // 1 (Inner) - 4 (Outer)
    temperature: number; // 0 (Cold) - 100 (Warm)
    lastInteraction: string;

    // Diagnostic Data
    metrics: HealthMetrics;
    
    // [Platformization] Separate storage for interactions and system events
    interactions: Interaction[]; // 정서 교류 데이터 (분석용)
    systemLogs: SystemLog[];    // 시스템 이력 데이터 (로그용)
    
    // Legacy support for unified timeline (optional but helpful for transition)
    history: (Interaction | any)[];

    // Qualitative Influence (RQS)
    rqsResult?: {
        totalScore: number;
        grade: 'S' | 'A' | 'B' | 'C';
        category: 'Antidote' | 'Vampire' | 'Satellite' | 'Black Hole' | 'Balloon' | 'Neutral';
        areaScores: {
            safety: number;
            vitality: number;
            growth: number;
            reciprocity: number;
        };
        lastChecked: string;
    };
    rqsHistory?: RelationshipNode['rqsResult'][];
}

export interface DiagnosisResult {
    score: number;
    label: 'Healthy' | 'Toxic' | 'Cold' | 'Heating Up' | 'Stable';
    prescription: string[];
    nextAction: string;
}

export interface OrbitMapViewState {
    zoomLevel: number;
    selectedFilters: string[];
    sortMode: 'default' | 'hot' | 'cold';
    isFilterExpanded: boolean;
    activeSearchTag: string;
    viewMode: 'map' | 'list';
}

// 🧬 Dynamic Character System v2.0 — 4-Quadrant Aligned
export const DYNAMIC_CHARACTERS = {
    Draining: { type: 'Draining', label: '지치는 사이', color: '#D98B73', bgColor: '#D98B7315', icon: 'Zap', desc: '만나고 나면 마음의 기운이 조금 빠져요.' },
    Intense: { type: 'Intense', label: '뜨거운 사이', color: '#FFB74D', bgColor: '#FFB74D15', icon: 'Flame', desc: '에너지를 듬뿍 주고받는 활기찬 사이예요.' },
    Distant: { type: 'Distant', label: '평범한 사이', color: '#90A4AE', bgColor: '#90A4AE15', icon: 'CircleDashed', desc: '큰 감정 없이 그냥 아는 무난한 사이예요.' },
    Stable: { type: 'Stable', label: '편안한 사이', color: '#4A5D4E', bgColor: '#4A5D4E15', icon: 'Leaf', desc: '함께 있으면 저절로 기운이 나요.' },
};

export const RQS_GRADE_BADGES = {
    S: { grade: 'S', label: 'Soul Anchor', color: '#4A8C8C', desc: '깊은 신뢰와 성장을 함께하는 관계' },
    A: { grade: 'A', label: 'Vision Mirror', color: '#7986CB', desc: '나를 더 나은 방향으로 이끌어주는 관계' },
    B: { grade: 'B', label: 'Neutral', color: '#90A4AE', desc: '무난하고 평온한 중립적인 관계' },
    C: { grade: 'C', label: 'Needs Care', color: '#D98B73', desc: '관계 에너지 점검이 필요한 관계' },
};

export const getDynamicCharacter = (interactions: Interaction[]) => {
    if (!interactions || interactions.length === 0) return null;

    const recentLogs = interactions.slice(-5);
    const avgSat = recentLogs.reduce((acc, curr) => acc + (curr.satisfaction || 0), 0) / recentLogs.length;
    const avgDrain = recentLogs.reduce((acc, curr) => acc + (curr.energyDrain || 0), 0) / recentLogs.length;

    // 4-Quadrant mapping
    if (avgDrain >= 50 && avgSat < 50)  return DYNAMIC_CHARACTERS.Draining;  // Q1
    if (avgDrain >= 50 && avgSat >= 50) return DYNAMIC_CHARACTERS.Intense;    // Q2
    if (avgDrain < 50  && avgSat < 50)  return DYNAMIC_CHARACTERS.Distant;    // Q3
    return DYNAMIC_CHARACTERS.Stable;                                          // Q4
};


