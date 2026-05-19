import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { RelationshipNode, HealthMetrics, OrbitMapViewState, Interaction } from '../types/relationship';

interface RelationshipState {
    relationships: RelationshipNode[];

    // Actions
    addRelationship: (name: string, type: RelationshipNode['type'], role: string, phoneNumber?: string, image?: string) => string;
    updateMetrics: (id: string, metrics: Partial<HealthMetrics>) => void;
    updateRelationship: (id: string, updates: Partial<RelationshipNode>) => void;
    deleteRelationship: (id: string) => void;
    getRelationshipById: (id: string) => RelationshipNode | undefined;
    calculateHealth: (id: string) => void;
    updateAnalysisResult: (id: string, updates: {
        zone?: number;
        temperature?: number;
        oxytocin?: number;
        cortisol?: number;
        rqsResult?: RelationshipNode['rqsResult'];
        event?: string;
    }) => void;
    addInteraction: (id: string, date: string, satisfaction: number, energyDrain: number, title: string, description: string) => void;
    updateInteraction: (personId: string, logId: string, updates: Partial<RelationshipNode['history'][0]>) => void;
    deleteInteraction: (personId: string, logId: string) => void;

    // View State Persistence
    orbitMapViewState: OrbitMapViewState;
    setOrbitMapViewState: (newState: Partial<OrbitMapViewState>) => void;
    lastAddedId: string | null;
    setLastAddedId: (id: string | null) => void;
}


// 대규모 테스트를 위한 가상 데이터 생성기
const generateMockRelationships = (count: number): RelationshipNode[] => {
    const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '서윤', '서연', '지우', '하윤', '하은', '민서', '지유', '윤서', '채원', '수아', '현우', '동현', '준영', '건우', '태은', '유진', '민지', '수빈'];
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
    const roles = ['대학 동기', '회사 동료', '초중고 친구', '거래처 담당자', '먼 친척', '동호회 회원', '이웃', '스터디 멤버', '군대 동기', '전 직장 동료', '운동 파트너', '프로젝트 팀원'];
    const types: RelationshipNode['type'][] = ['friend', 'work', 'family', 'other'];

    const nodes: RelationshipNode[] = [];

    // Utility to generate random history
    const generateHistory = (count: number, baseCloseness: number): Interaction[] => {
        const history: Interaction[] = [];
        for (let i = 0; i < count; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (count - i) * 3);
            const sat = 40 + Math.random() * 50;
            const drain = 20 + Math.random() * 40;
            history.push({
                id: Math.random().toString(36).substr(2, 9),
                date: date.toISOString().split('T')[0],
                createdAt: date.toISOString(),
                closeness: Math.max(10, Math.min(100, baseCloseness - (count - i) * 2 + Math.random() * 10)),
                satisfaction: Math.round(sat),
                energyDrain: Math.round(drain),
                title: '정기적 교류',
                description: '일상적인 대화와 안부 확인',
            });
        }
        return history;
    };

    // Safety Base (Zone 1) - 약 5명
    for (let i = 0; i < 5; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        const closeness = 90 + Math.floor(Math.random() * 10);
        const interactions = generateHistory(5, closeness);
        nodes.push({
            id: `mock-1-${i}`,
            name,
            role: '가장 소중한 인연',
            type: types[Math.floor(Math.random() * types.length)],
            zone: 1,
            temperature: closeness,
            lastInteraction: '오늘',
            metrics: { trust: 90 + Math.random() * 10, communication: 80 + Math.random() * 20, frequency: 90 + Math.random() * 10, satisfaction: 90 + Math.random() * 10 },
            interactions,
            systemLogs: [{ id: 'sys-1', date: '2024-01-01', createdAt: new Date().toISOString(), event: '관계 등록' }],
            history: interactions,
        });
    }

    // Support (Zone 2) - 약 25명
    for (let i = 0; i < 25; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        const closeness = 70 + Math.floor(Math.random() * 20);
        const interactions = generateHistory(3, closeness);
        nodes.push({
            id: `mock-2-${i}`,
            name,
            role: roles[Math.floor(Math.random() * roles.length)],
            type: types[Math.floor(Math.random() * types.length)],
            zone: 2,
            temperature: closeness,
            lastInteraction: '며칠 전',
            metrics: { trust: 70 + Math.random() * 20, communication: 60 + Math.random() * 30, frequency: 50 + Math.random() * 40, satisfaction: 70 + Math.random() * 20 },
            interactions,
            systemLogs: [{ id: 'sys-2', date: '2024-01-01', createdAt: new Date().toISOString(), event: '관계 등록' }],
            history: interactions,
        });
    }

    // Strategic (Zone 3) - 약 40명
    for (let i = 0; i < 40; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        const closeness = 50 + Math.floor(Math.random() * 20);
        const interactions = generateHistory(2, closeness);
        nodes.push({
            id: `mock-3-${i}`,
            name,
            role: roles[Math.floor(Math.random() * roles.length)],
            type: 'work',
            zone: 3,
            temperature: closeness,
            lastInteraction: '이번 주',
            metrics: { trust: 50 + Math.random() * 40, communication: 70 + Math.random() * 30, frequency: 60 + Math.random() * 30, satisfaction: 50 + Math.random() * 30 },
            interactions,
            systemLogs: [{ id: 'sys-3', date: '2024-01-01', createdAt: new Date().toISOString(), event: '관계 등록' }],
            history: interactions,
        });
    }

    // Social (Zone 4) - 약 50명
    for (let i = 0; i < 50; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        const closeness = 30 + Math.floor(Math.random() * 25);
        const interactions = generateHistory(1, closeness);
        nodes.push({
            id: `mock-4-${i}`,
            name,
            role: '지인',
            type: 'other',
            zone: 4,
            temperature: closeness,
            lastInteraction: '한 달 전',
            metrics: { trust: 30 + Math.random() * 50, communication: 30 + Math.random() * 40, frequency: 20 + Math.random() * 40, satisfaction: 30 + Math.random() * 40 },
            interactions,
            systemLogs: [{ id: 'sys-4', date: '2024-01-01', createdAt: new Date().toISOString(), event: '관계 등록' }],
            history: interactions,
        });
    }

    // Background (Zone 5) - 나머지 (약 30명)
    for (let i = 0; i < count - nodes.length; i++) {
        const name = lastNames[Math.floor(Math.random() * lastNames.length)] + firstNames[Math.floor(Math.random() * firstNames.length)];
        const closeness = 10 + Math.floor(Math.random() * 20);
        nodes.push({
            id: `mock-5-${i}`,
            name,
            role: '배경 소음',
            type: 'other',
            zone: 5,
            temperature: closeness,
            lastInteraction: '기억 안남',
            metrics: { trust: 20 + Math.random() * 30, communication: 10 + Math.random() * 30, frequency: 5 + Math.random() * 20, satisfaction: 20 + Math.random() * 30 },
            interactions: [],
            systemLogs: [{ id: 'sys-5', date: '2024-01-01', createdAt: new Date().toISOString(), event: '관계 등록' }],
            history: [],
        });
    }


    return nodes;
};

const INITIAL_DATA: RelationshipNode[] = [];

export const useRelationshipStore = create<RelationshipState>()(
    persist(
        (set, get) => ({
            relationships: INITIAL_DATA,

            addRelationship: (name, type, role, phoneNumber, image) => {
                const now = new Date().toISOString();
                const newNode: RelationshipNode = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    type,
                    role,
                    phoneNumber,
                    image,
                    zone: 3,
                    temperature: 0,
                    lastInteraction: 'Just added',
                    metrics: { trust: 0, communication: 0, frequency: 0, satisfaction: 0 },
                    interactions: [],
                    systemLogs: [{
                        id: Math.random().toString(36).substr(2, 9),
                        date: now.split('T')[0],
                        createdAt: now,
                        event: '관계 등록',
                        details: '새로운 관계가 궤도에 등록되었습니다.'
                    }],
                    history: [{
                        id: Math.random().toString(36).substr(2, 9),
                        date: now.split('T')[0],
                        createdAt: now,
                        title: '관계 등록',
                        event: '관계 등록',
                        satisfaction: 0,
                        energyDrain: 0,
                    }],
                };
                set((state) => ({ 
                    relationships: [...state.relationships, newNode],
                    lastAddedId: newNode.id
                }));
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

                        const { trust, communication, frequency, satisfaction } = r.metrics;
                        const avgTemp = Math.round((trust + communication + satisfaction) / 3);

                        return {
                            ...r,
                            temperature: avgTemp,
                        };
                    }),
                }));
            },

            updateAnalysisResult: (id, data) => {
                const now = new Date().toISOString();
                set((state) => ({
                    relationships: state.relationships.map((r) => {
                        if (r.id !== id) return r;

                        const systemLogEntry = {
                            id: Math.random().toString(36).substr(2, 9),
                            date: now.split('T')[0],
                            createdAt: now,
                            event: data.event || '분석 업데이트',
                            details: data.rqsResult ? `RQS 등급: ${data.rqsResult.grade}` : '관계 데이터 업데이트',
                        };

                        const newLogs = [...(r.systemLogs || []), systemLogEntry];
                        const newHistory = [...(r.history || []), { ...systemLogEntry, title: systemLogEntry.event }];

                        let newRqsHistory = r.rqsHistory || [];
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
                            systemLogs: newLogs,
                            history: newHistory,
                            rqsHistory: newRqsHistory,
                        };
                    }),
                }));
            },

            addInteraction: (id, date, satisfaction, energyDrain, title, description) => {
                const ALPHA = 0.15;
                const resonanceDelta = ALPHA * (satisfaction - energyDrain);
                const now = new Date().toISOString();

                set((state) => ({
                    relationships: state.relationships.map((r) => {
                        if (r.id !== id) return r;
                        
                        const currentCloseness = r.temperature || 0;
                        const newCloseness = Math.max(0, Math.min(100, currentCloseness + resonanceDelta));
                        
                        const newInteraction = {
                            id: Math.random().toString(36).substr(2, 9),
                            date,
                            createdAt: now,
                            satisfaction,
                            energyDrain,
                            title,
                            description,
                            closeness: newCloseness
                        };

                        return {
                            ...r,
                            lastInteraction: '방금',
                            temperature: newCloseness,
                            interactions: [...(r.interactions || []), newInteraction],
                            history: [...(r.history || []), newInteraction]
                        };
                    })
                }));
            },

            updateInteraction: (personId, logId, updates) => {
                set((state) => ({
                    relationships: state.relationships.map((r) => {
                        if (r.id !== personId) return r;
                        const updatedInteractions = (r.interactions || []).map(i => i.id === logId ? { ...i, ...updates } : i);
                        const updatedHistory = (r.history || []).map(h => h.id === logId ? { ...h, ...updates } : h);
                        return {
                            ...r,
                            interactions: updatedInteractions,
                            history: updatedHistory
                        };
                    })
                }));
            },

            deleteInteraction: (personId, logId) => {
                set((state) => ({
                    relationships: state.relationships.map((r) => {
                        if (r.id !== personId) return r;
                        return {
                            ...r,
                            interactions: (r.interactions || []).filter(i => i.id !== logId),
                            history: (r.history || []).filter(h => h.id !== logId)
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
                viewMode: 'map',
            },
            setOrbitMapViewState: (newState) => {
                set((state) => ({
                    orbitMapViewState: { ...state.orbitMapViewState, ...newState }
                }));
            },
            lastAddedId: null,
            setLastAddedId: (id) => set({ lastAddedId: id }),
        }),
        {
            name: 'social-orbit-storage',
            storage: createJSONStorage(() => 
                Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.localStorage : (null as any)) : AsyncStorage
            ),
        }
    )
);
