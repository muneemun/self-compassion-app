import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AppState {
    isInitialized: boolean;
    setInitialized: (val: boolean) => void;
    hasCompletedOnboarding: boolean;
    setHasCompletedOnboarding: (val: boolean) => void;
    userProfile: any | null;
    setUserProfile: (profile: any) => void;
    activeZone: number;
    setActiveZone: (zone: number) => void;

    // 글로벌 '나와의 시간' 체크인 모달 제어
    isSelfTimeModalOpen: boolean;
    setSelfTimeModalOpen: (isOpen: boolean) => void;

    // 인맥 교류 피드백 상태
    interactionFeedback: { 
        targetId: string | null; 
        isActive: boolean;
        closenessDelta: number;
    };
    setInteractionFeedback: (feedback: { targetId: string | null; isActive: boolean; closenessDelta: number }) => void;

    // 인맥 기록 모달 제어
    isRelationshipLogModalOpen: boolean;
    currentLogTargetId: string | null;
    editingLogId: string | null; // For editing existing logs
    setRelationshipLogModalOpen: (isOpen: boolean, targetId?: string | null, logId?: string | null) => void;
    
    // 추가 상태들 (복구)
    recoveryPulseActive?: boolean;
    setRecoveryPulseActive?: (active: boolean) => void;
    cognitiveFeedback?: { message: string | null; type: string | null };
    setCognitiveFeedback?: (feedback: { message: string | null; type: string | null }) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            isInitialized: false,
            setInitialized: (val) => set({ isInitialized: val }),
            hasCompletedOnboarding: false,
            setHasCompletedOnboarding: (val) => set({ hasCompletedOnboarding: val }),
            userProfile: null,
            setUserProfile: (profile) => set({ userProfile: profile }),
            activeZone: 1,
            setActiveZone: (zone) => set({ activeZone: zone }),

            isSelfTimeModalOpen: false,
            setSelfTimeModalOpen: (isOpen) => set({ isSelfTimeModalOpen: isOpen }),

            recoveryPulseActive: false,
            setRecoveryPulseActive: (active) => set({ recoveryPulseActive: active }),
            cognitiveFeedback: { message: null, type: null },
            setCognitiveFeedback: (feedback) => set({ cognitiveFeedback: feedback }),

            interactionFeedback: { targetId: null, isActive: false, closenessDelta: 0 },
            setInteractionFeedback: (feedback) => set({ interactionFeedback: feedback }),

            isRelationshipLogModalOpen: false,
            currentLogTargetId: null,
            editingLogId: null,
            setRelationshipLogModalOpen: (isOpen, targetId = null, logId = null) => set({ 
                isRelationshipLogModalOpen: isOpen, 
                currentLogTargetId: targetId ?? (isOpen ? null : null),
                editingLogId: logId
            }),
        }),
        {
            name: 'social-orbit-app-storage',
            storage: createJSONStorage(() => 
                Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.localStorage : (null as any)) : AsyncStorage
            ),
        }
    )
);
