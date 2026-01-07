import { create } from 'zustand';
import { RelationshipNode, HealthMetrics } from '../types/relationship';

interface RelationshipState {
    relationships: RelationshipNode[];

    // Actions
    addRelationship: (name: string, type: RelationshipNode['type'], role: string, phoneNumber?: string, image?: string) => string;
    updateMetrics: (id: string, metrics: Partial<HealthMetrics>) => void;
    updateRelationship: (id: string, updates: Partial<RelationshipNode>) => void;
    deleteRelationship: (id: string) => void;
    getRelationshipById: (id: string) => RelationshipNode | undefined;
    calculateHealth: (id: string) => void;
    updateDiagnosisResult: (id: string, updates: {
        zone?: number;
        temperature?: number;
        oxytocin?: number;
        cortisol?: number;
        rqsResult?: RelationshipNode['rqsResult'];
        event?: string;
    }) => void;
    addInteraction: (id: string, date: string, temperature: number, title: string, description: string) => void;
}

// 초기 목업 데이터
// 초기 목업 데이터 (테스트를 위해 15명으로 확장)
const INITIAL_DATA: RelationshipNode[] = [
    {
        id: '1',
        name: '김민수',
        role: '가장 친한 친구',
        type: 'friend',
        zone: 1,
        temperature: 98,
        lastInteraction: '2시간 전',
        metrics: { trust: 95, communication: 92, frequency: 100, satisfaction: 98 },
        history: [{ date: '2024-01-01', temperature: 90, title: '심야 고민 상담', oxytocin: 80, cortisol: 20 }, { date: '2024-02-01', temperature: 98, title: '취업 축하 파티', oxytocin: 95, cortisol: 10 }],
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    },
    {
        id: '2',
        name: '최은경',
        role: '배우자',
        type: 'partner',
        zone: 1,
        temperature: 94,
        lastInteraction: '3개월 전', // 조율 대상: 소홀해진 안전기지 케이스
        metrics: { trust: 98, communication: 30, frequency: 20, satisfaction: 95 },
        history: [{ date: '2024-01-01', temperature: 88, title: '새해맞이 여행', oxytocin: 90, cortisol: 15 }, { date: '2024-02-01', temperature: 94, title: '주말 브런치', oxytocin: 92, cortisol: 12 }],
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
        id: '3',
        name: '정성훈',
        role: '멘토 / 직장 상사',
        type: 'work',
        zone: 2,
        temperature: 82,
        lastInteraction: '3일 전',
        metrics: { trust: 85, communication: 75, frequency: 60, satisfaction: 80 },
        history: [{ date: '2024-01-15', temperature: 75, title: '업무 피드백' }, { date: '2024-02-01', temperature: 82, title: '점심 식사' }],
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
    {
        id: '5',
        name: '박준호',
        role: '비즈니스 파트너',
        type: 'work',
        zone: 3,
        temperature: 55,
        lastInteraction: '1주일 전', // 조율 대상: 에너지 효율 저하 케이스 (노력 큼, 보람 적음)
        metrics: { trust: 70, communication: 95, frequency: 90, satisfaction: 40 },
        history: [{ date: '2024-01-20', temperature: 60 }, { date: '2024-02-01', temperature: 65 }],
    },
    {
        id: '16',
        name: '이지현',
        role: '뉴미디어 아티스트',
        type: 'other',
        zone: 3,
        temperature: 50,
        lastInteraction: '방금 추가됨', // 조율 대상: 새로운 인연 케이스
        metrics: { trust: 50, communication: 50, frequency: 50, satisfaction: 50 },
        history: [],
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
    {
        id: '4',
        name: '이보람',
        role: '친여동생',
        type: 'family',
        zone: 1,
        temperature: 87,
        lastInteraction: '어제',
        metrics: { trust: 90, communication: 65, frequency: 40, satisfaction: 85 },
        history: [{ date: '2024-01-10', temperature: 92 }, { date: '2024-02-01', temperature: 87 }],
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
    {
        id: '6',
        name: '한소희',
        role: '대학 동기',
        type: 'friend',
        zone: 2,
        temperature: 78,
        lastInteraction: '2주 전',
        metrics: { trust: 80, communication: 70, frequency: 45, satisfaction: 75 },
        history: [],
    },
    {
        id: '7',
        name: 'David Wilson',
        role: 'Global Team Lead',
        type: 'work',
        zone: 3,
        temperature: 58,
        lastInteraction: '어제',
        metrics: { trust: 60, communication: 90, frequency: 80, satisfaction: 55 },
        history: [],
    },
    {
        id: '10',
        name: '송지효',
        role: '고등학교 동창',
        type: 'friend',
        zone: 5,
        temperature: 25,
        lastInteraction: '6개월 전',
        metrics: { trust: 40, communication: 20, frequency: 10, satisfaction: 30 },
        history: [],
    }
];

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
    relationships: INITIAL_DATA,

    addRelationship: (name, type, role, phoneNumber, image) => {
        const newNode: RelationshipNode = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            type,
            role,
            phoneNumber,
            image,
            zone: 3,
            temperature: 50,
            lastInteraction: 'Just added',
            metrics: { trust: 50, communication: 50, frequency: 50, satisfaction: 50 },
            history: [],
        };
        set((state) => ({ relationships: [...state.relationships, newNode] }));
        get().calculateHealth(newNode.id);
        return newNode.id;
    },

    updateMetrics: (id, newMetrics) => {
        set((state) => ({
            relationships: state.relationships.map((r) =>
                r.id === id ? { ...r, metrics: { ...r.metrics, ...newMetrics } } : r
            ),
        }));
        get().calculateHealth(id);
    },

    updateRelationship: (id, updates) => {
        set((state) => ({
            relationships: state.relationships.map((r) =>
                r.id === id ? { ...r, ...updates } : r
            ),
        }));
    },
    deleteRelationship: (id) => {
        set((state) => ({
            relationships: state.relationships.filter((r) => r.id !== id),
        }));
    },

    getRelationshipById: (id) => get().relationships.find((r) => r.id === id),

    calculateHealth: (id) => {
        set((state) => ({
            relationships: state.relationships.map((r) => {
                if (r.id !== id) return r;

                // 진단 로직: 지표들의 평균으로 온도 산출
                const { trust, communication, frequency, satisfaction } = r.metrics;
                const avgTemp = Math.round((trust + communication + satisfaction) / 3);

                // 존(Zone) 결정 로직: 온도가 높고 자주 소통하면 1존, 아니면 밀려남
                let newZone = 4;
                if (avgTemp > 85 && frequency > 70) newZone = 1;
                else if (avgTemp > 60 && frequency > 40) newZone = 2;
                else if (avgTemp > 30) newZone = 3;

                return {
                    ...r,
                    temperature: avgTemp,
                    zone: newZone,
                };
            }),
        }));
    },

    updateDiagnosisResult: (id, data) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
            relationships: state.relationships.map((r) => {
                if (r.id !== id) return r;

                const lastHistory = r.history[r.history.length - 1];
                const newHistoryEntry = {
                    date: today,
                    temperature: data.temperature ?? (lastHistory?.temperature ?? r.temperature),
                    oxytocin: data.oxytocin ?? (lastHistory?.oxytocin ?? 50),
                    cortisol: data.cortisol ?? (lastHistory?.cortisol ?? 50),
                    event: data.event,
                };

                return {
                    ...r,
                    temperature: data.temperature ?? r.temperature,
                    zone: data.zone ?? r.zone,
                    rqsResult: data.rqsResult ?? r.rqsResult,
                    history: [...r.history, newHistoryEntry].slice(-12),
                };
            }),
        }));
    },

    addInteraction: (id, date, temperature, title, description) => {
        const safeTemp = isNaN(temperature) ? 50 : temperature;
        set((state) => ({
            relationships: state.relationships.map((r) => {
                if (r.id !== id) return r;
                return {
                    ...r,
                    lastInteraction: '방금',
                    temperature: safeTemp,
                    history: [
                        ...r.history,
                        {
                            date,
                            temperature: safeTemp,
                            title,
                            description,
                            event: title, // 레거시 호환
                            oxytocin: safeTemp > 80 ? 85 : 40,
                            cortisol: safeTemp < 40 ? 75 : 20,
                        }
                    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                };
            })
        }));
    },
}));
