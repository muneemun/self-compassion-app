import { create } from 'zustand';

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
}

export const useAppStore = create<AppState>((set) => ({
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
}));
