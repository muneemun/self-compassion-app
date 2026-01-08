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

    // View State Persistence
    orbitMapViewState: OrbitMapViewState;
    setOrbitMapViewState: (newState: Partial<OrbitMapViewState>) => void;
}

export interface OrbitMapViewState {
    zoomLevel: number;
    selectedFilters: string[];
    activeSearchTag: string;
    sortMode: 'default' | 'hot' | 'cold';
    isFilterExpanded: boolean;
}

// 대규모 테스트를 위한 가상 데이터 생성기
const generateMockRelationships = (count: number): RelationshipNode[] => {
    const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '서윤', '서연', '지우', '하윤', '하은', '민서', '지유', '윤서', '채원', '수아', '현우', '동현', '준영', '건우', '태은', '유진', '민지', '수빈'];
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
    const roles = ['대학 동기', '회사 동료', '초중고 친구', '거래처 담당자', '먼 친척', '동호회 회원', '이웃', '스터디 멤버', '군대 동기', '전 직장 동료', '운동 파트너', '프로젝트 팀원'];
    const types: RelationshipNode['type'][] = ['friend', 'work', 'family', 'other'];

    const nodes: RelationshipNode[] = [];

    // Safety Base (Zone 1) - 약 5명
    for (let i = 0; i < 5; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        nodes.push({
            id: `mock-1-${i}`,
            name,
            role: '가장 소중한 인연',
            type: types[Math.floor(Math.random() * types.length)],
            zone: 1,
            temperature: 90 + Math.floor(Math.random() * 10),
            lastInteraction: '오늘',
            metrics: { trust: 90 + Math.random() * 10, communication: 80 + Math.random() * 20, frequency: 90 + Math.random() * 10, satisfaction: 90 + Math.random() * 10 },
            history: [],
        });
    }

    // Support (Zone 2) - 약 25명
    for (let i = 0; i < 25; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        nodes.push({
            id: `mock-2-${i}`,
            name,
            role: roles[Math.floor(Math.random() * roles.length)],
            type: types[Math.floor(Math.random() * types.length)],
            zone: 2,
            temperature: 70 + Math.floor(Math.random() * 20),
            lastInteraction: '며칠 전',
            metrics: { trust: 70 + Math.random() * 20, communication: 60 + Math.random() * 30, frequency: 50 + Math.random() * 40, satisfaction: 70 + Math.random() * 20 },
            history: [],
        });
    }

    // Strategic (Zone 3) - 약 40명
    for (let i = 0; i < 40; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        nodes.push({
            id: `mock-3-${i}`,
            name,
            role: roles[Math.floor(Math.random() * roles.length)],
            type: 'work',
            zone: 3,
            temperature: 50 + Math.floor(Math.random() * 20),
            lastInteraction: '이번 주',
            metrics: { trust: 50 + Math.random() * 40, communication: 70 + Math.random() * 30, frequency: 60 + Math.random() * 30, satisfaction: 50 + Math.random() * 30 },
            history: [],
        });
    }

    // Social (Zone 4) - 약 50명
    for (let i = 0; i < 50; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        nodes.push({
            id: `mock-4-${i}`,
            name,
            role: '지인',
            type: 'other',
            zone: 4,
            temperature: 30 + Math.floor(Math.random() * 25),
            lastInteraction: '한 달 전',
            metrics: { trust: 30 + Math.random() * 50, communication: 30 + Math.random() * 40, frequency: 20 + Math.random() * 40, satisfaction: 30 + Math.random() * 40 },
            history: [],
        });
    }

    // Background (Zone 5) - 나머지 (약 30명)
    for (let i = 0; i < count - nodes.length; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        nodes.push({
            id: `mock-5-${i}`,
            name,
            role: '배경 소음',
            type: 'other',
            zone: 5,
            temperature: 10 + Math.floor(Math.random() * 20),
            lastInteraction: '기억 안남',
            metrics: { trust: 20 + Math.random() * 30, communication: 10 + Math.random() * 30, frequency: 5 + Math.random() * 20, satisfaction: 20 + Math.random() * 30 },
            history: [],
        });
    }

    return nodes;
};

const INITIAL_DATA: RelationshipNode[] = generateMockRelationships(150);

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

                const newHistory = [...r.history, newHistoryEntry].slice(-12);
                let newRqsHistory = r.rqsHistory || [];
                // If history is empty but we have an existing result, seed it
                if (newRqsHistory.length === 0 && r.rqsResult) {
                    newRqsHistory = [r.rqsResult];
                }

                if (data.rqsResult) {
                    const isDuplicate = newRqsHistory.some(h => h?.lastChecked === data.rqsResult?.lastChecked);
                    if (!isDuplicate) {
                        newRqsHistory = [...newRqsHistory, data.rqsResult].slice(-10);
                    }
                }

                return {
                    ...r,
                    temperature: data.temperature ?? r.temperature,
                    zone: data.zone ?? r.zone,
                    rqsResult: data.rqsResult ?? r.rqsResult,
                    history: newHistory,
                    rqsHistory: newRqsHistory,
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

    // View State Implementation
    orbitMapViewState: {
        zoomLevel: 1.0,
        selectedFilters: ['전체'],
        activeSearchTag: '전체',
        sortMode: 'default',
        isFilterExpanded: false,
    },
    setOrbitMapViewState: (newState) => {
        set((state) => ({
            orbitMapViewState: { ...state.orbitMapViewState, ...newState }
        }));
    },
}));
