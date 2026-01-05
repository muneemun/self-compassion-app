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
        event?: string;
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
}

export interface DiagnosisResult {
    score: number;
    label: 'Healthy' | 'Toxic' | 'Cold' | 'Heating Up' | 'Stable';
    prescription: string[];
    nextAction: string;
}
