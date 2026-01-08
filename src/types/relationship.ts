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
        date: string;
        temperature: number;
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
        category: 'Soul Anchor' | 'Vision Mirror' | 'Neutral' | 'Vampire';
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
