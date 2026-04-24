export type SelfCareCategory = 'SOMATIC' | 'WRITING' | 'CREATIVE' | 'SENSORY' | 'MINDFULNESS';

export const SELF_CARE_CATEGORY_LABELS: Record<SelfCareCategory, string> = {
    SOMATIC: '신체 조절',
    WRITING: '표현적 글쓰기',
    CREATIVE: '창의적 표현',
    SENSORY: '감각 리셋',
    MINDFULNESS: '마음챙김'
};

export interface SelfTimeEntry {
    id: string;             // UUIDv4 (로컬-서버 동기화 방어용)
    category: SelfCareCategory;
    activityName: string;   // 예: "복식 호흡 5분"
    durationMinutes: number; // 소요 시간 (분 단위)
    intentionScore: number; // 의도성 (0 ~ 100)
    moodBefore: number;     // 하기 전 기분 온도 (0 ~ 100)
    moodAfter: number;      // 하고 난 후 기분 온도 (0 ~ 100)
    isDeleted: boolean;     // Soft delete 플래그
    appVersion: string;     // 데이터 마이그레이션 판별용 버전 정보 (예: "1.1.0")
    createdAt: string;      // ISO UTC string
    updatedAt: string;      // ISO UTC string
}
