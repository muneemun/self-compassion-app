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

// 🧬 Dynamic Character System v5.0 — Particle Metaphor Aligned
export const DYNAMIC_CHARACTERS = {
    Charge: { 
        type: 'Charge', 
        label: '충전', 
        color: '#FFD700', 
        bgColor: '#FFD70015', 
        icon: 'Zap', 
        waveWidth: 3,
        waveColor: '#FFD700',
        desc: '활력이 생겨요! 에너지가 충전되었습니다.' 
    },
    Healing: { 
        type: 'Healing', 
        label: '회복', 
        color: '#81C784', 
        bgColor: '#81C78415', 
        icon: 'Leaf', 
        waveWidth: 3,
        waveColor: '#81C784',
        desc: '마음이 정화돼요. 관계가 푸르러집니다.' 
    },
    Drain: { 
        type: 'Drain', 
        label: '소진', 
        color: '#546E7A', 
        bgColor: '#546E7A15', 
        icon: 'Orbit', // Meteorite Metaphor
        waveWidth: 8,
        waveColor: '#37474F',
        desc: '너무 무거워요. 잠시 무게를 덜어볼까요?' 
    },
    Crisis: { 
        type: 'Crisis', 
        label: '위기', 
        color: '#D98B73', 
        bgColor: '#D98B7315', 
        icon: 'Activity', // Shard/Vibration Metaphor
        waveWidth: 1.5,
        waveColor: '#D98B73',
        desc: '위태로운 기류입니다. 주의가 필요해요.' 
    },
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

    // v5 사분면 매핑 (만족도와 소모량 기준)
    if (avgSat >= 70 && avgDrain < 40) return DYNAMIC_CHARACTERS.Charge;   // 만족도 높고 소모 적음 -> 충전
    if (avgSat >= 50 && avgDrain < 30) return DYNAMIC_CHARACTERS.Healing;  // 만족도 보통이고 소모 매우 적음 -> 회복
    if (avgDrain >= 60) return DYNAMIC_CHARACTERS.Drain;                   // 소모가 매우 높음 -> 소진
    if (avgSat < 40) return DYNAMIC_CHARACTERS.Crisis;                    // 만족도가 매우 낮음 -> 위기
    
    return DYNAMIC_CHARACTERS.Healing; // 기본값
};



