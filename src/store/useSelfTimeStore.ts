import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SelfTimeEntry, SelfCareCategory } from '../types/selfTime';

interface SelfTimeState {
    entries: SelfTimeEntry[];
    addEntry: (
        category: SelfCareCategory,
        activityName: string,
        durationMinutes: number,
        physicalEnergy: number,
        emotionalSatisfaction: number,
        createdAt?: string
    ) => void;
    updateEntry: (id: string, updates: Partial<Omit<SelfTimeEntry, 'id' | 'appVersion'>>) => void;
    deleteEntry: (id: string) => void;
    getRecentEntries: (days?: number) => SelfTimeEntry[];
}

const CURRENT_APP_VERSION = '1.1.0';

export const useSelfTimeStore = create<SelfTimeState>()(
    persist(
        (set, get) => ({
            entries: [],

            addEntry: (category, activityName, durationMinutes, physicalEnergy, emotionalSatisfaction, createdAt) => {
                const now = new Date().toISOString();
                const newEntry: SelfTimeEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    category,
                    activityName,
                    durationMinutes,
                    physicalEnergy,
                    emotionalSatisfaction,
                    isDeleted: false,
                    appVersion: CURRENT_APP_VERSION,
                    createdAt: createdAt || now,
                    updatedAt: now,
                };

                set((state) => ({
                    entries: [newEntry, ...state.entries],
                }));
            },

            updateEntry: (id: string, updates) => {
                set((state) => ({
                    entries: state.entries.map(entry =>
                        entry.id === id
                            ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
                            : entry
                    )
                }));
            },

            deleteEntry: (id: string) => {
                set((state) => ({
                    entries: state.entries.map(entry =>
                        entry.id === id
                            ? { ...entry, isDeleted: true, updatedAt: new Date().toISOString() }
                            : entry
                    )
                }));
            },

            // Soft-deleted 항목은 제외하고 최신순 정렬해서 반환
            getRecentEntries: (days = 30) => {
                const now = new Date();
                const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                
                return get().entries.filter(entry => 
                    !entry.isDeleted && new Date(entry.createdAt) >= cutoffDate
                ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
        }),
        {
            name: 'self-time-storage', // Local DB key
            storage: createJSONStorage(() => 
                Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.localStorage : (null as any)) : AsyncStorage
            ),
            version: 1, // 마이그레이션 대비 schema 버전
        }
    )
);
