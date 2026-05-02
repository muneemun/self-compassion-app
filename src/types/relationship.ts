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
    history: {
        id: string; // Unique ID for editing/deleting
        date: string;
        closeness: number;      // 기존 temperature -> 정서 긴밀도로 의미 전환
        satisfaction: number;   // 교류 충족감 (0 ~ 100)
        energyDrain: number;    // 정서적 소모량 (0 ~ 100)
        oxytocin?: number;
        cortisol?: number;
        title?: string; // 활동 주제 (ex: 저녁 식사)
        description?: string; // 상세 내용 (ex: 대화 내용, 기분 등)
        event?: string; // Legacy (호환성 유지)
    }[];

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

// 🧬 Dynamic Character System v1.1
export const DYNAMIC_CHARACTERS = {
    Vampire: { type: 'Vampire', icon: '🧛', label: '뱀파이어', color: '#8C968D', desc: '에너지를 일방적으로 소모시키는 주의 대상' },
    BlackHole: { type: 'BlackHole', icon: '🌀', label: '블랙홀', color: '#4A5D4E', desc: '고출력 교류 및 자아 매몰 위험' },
    Antidote: { type: 'Antidote', icon: '🌟', label: '안티도트', color: '#D98B73', desc: '깊은 치유 및 에너지 공급원' },
    Satellite: { type: 'Satellite', icon: '🛡️', label: '위성', color: '#90A4AE', desc: '안정적이고 조용한 지지' },
    Balloon: { type: 'Balloon', icon: '🎈', label: '풍선', color: '#FFD54F', desc: '가볍고 즐거운 일시적 환기' }
};

export const getDynamicCharacter = (history: any[]) => {
    if (!history || history.length === 0) return null;
    
    // 최근 교류 데이터 평균 계산
    const recentLogs = history.slice(-5);
    const avgSat = recentLogs.reduce((acc, curr) => acc + (curr.satisfaction || 0), 0) / recentLogs.length;
    const avgDrain = recentLogs.reduce((acc, curr) => acc + (curr.energyDrain || 0), 0) / recentLogs.length;

    // v1.1 알고리즘 매핑 (CORE_ALGORITHM_GUIDE.md 기준)
    if (avgDrain >= 70 && avgSat <= 40) return DYNAMIC_CHARACTERS.Vampire;
    if (avgDrain >= 70 && avgSat >= 70) return DYNAMIC_CHARACTERS.BlackHole;
    if (avgSat >= 70 && avgDrain <= 40) return DYNAMIC_CHARACTERS.Antidote;
    if (avgDrain <= 40 && avgSat <= 50) return DYNAMIC_CHARACTERS.Satellite;
    if (avgDrain <= 40) return DYNAMIC_CHARACTERS.Balloon;
    
    return null;
};
