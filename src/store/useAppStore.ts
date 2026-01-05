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
}));
