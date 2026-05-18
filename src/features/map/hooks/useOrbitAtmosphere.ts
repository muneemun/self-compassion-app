/**
 * 🌌 useOrbitAtmosphere — Intelligent Atmosphere Engine v5.0 (Strict Sync)
 *
 * 이중 레이어(Dual-Layer) 대기 시스템:
 *
 * [Layer A] 즉각 반응 (Event Flash)
 *   - 가장 최근 체크인 1개에 즉각 반응
 *   - 3~5초 후 자동 소멸하는 컬러 플래시 + 텍스트
 *
 * [Layer B] 누적 상태 (Ambient Field)
 *   - 모든 관계의 최근 10개 인터랙션 평균값 기반
 *   - 지속적인 배경색 + 연무 + 파동 효과
 *
 * 7단계 정서 기상 시스템 (Hybrid Pastel Sky):
 * L7  SUPERNOVA      정서적 초신성 (환희) - #F0F9FF (Crystal Blue)
 * L6  BREEZE         산들바람 (회복) - #FEFDFB (Bright Sand)
 * L5  NORMAL         평상시 (Default) - #FCF9F2 (Warm Sand)
 * L4  SURGE          에너지 급변 (Δ > 30) - #F0EBE1 (Dark Taupe)
 * L3  DRAIN          에너지 침잠 (소진) - #F3F4F6 (Cool Gray)
 * L2  MIST           흐릿한 관계 (흐림) - #E5E7EB (Mist Gray)
 * L1  STORM          정서적 위기 (폭풍) - #9CA3AF (Storm Gray)
 */

import { useMemo, useRef } from 'react';
import { Interaction, RelationshipNode } from '../../../types/relationship';

export type AtmosphereState =
    | 'STORM'           // L1: 정서적 위기
    | 'MIST'            // L2: 흐릿한 관계
    | 'DRAIN'           // L3: 에너지 소진
    | 'SURGE'           // L4: 에너지 급변 (Δ > 30)
    | 'NORMAL'          // L5: 평상시 (Default)
    | 'BREEZE'          // L6: 산들바람
    | 'SUPERNOVA';      // L7: 정서적 초신성

export interface AtmosphereTheme {
    state: AtmosphereState;
    backgroundColor: string;
    gradientColors: string[];
    mistEnabled: boolean;
    mistColor: string;
    turbulenceAmplitude: number;
    turbulenceSpeed: number;
    waveEnabled: boolean;
    waveColor: string;
    swirlSpeed: number;
    transitionDuration: number;
    ambientText: string;
    flashColor: string;
    eventText: string;
    description: string;
}

export const ATMOSPHERE_THEMES: Record<AtmosphereState, AtmosphereTheme> = {
    STORM: {
        state: 'STORM',
        backgroundColor: '#F5F3F4',
        gradientColors: ['#F5F3F4', '#EBE5E6', '#D6C8CA'],
        mistEnabled: true,
        mistColor: 'rgba(183, 28, 28, 0.05)',
        turbulenceAmplitude: 1.8,
        turbulenceSpeed: 45,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 2.5,
        transitionDuration: 1200,
        ambientText: '궤도에 강한 난기류가 발생했어요. 안전한 운행을 위해 잠시 멈춰도 괜찮아요.',
        flashColor: 'rgba(255, 0, 0, 0.3)',
        eventText: '궤도 난기류 주의',
        description: 'L1: 정서적 위기'
    },
    MIST: {
        state: 'MIST',
        backgroundColor: '#E5E7EB',
        gradientColors: ['#E5E7EB', '#D1D5DB', '#9CA3AF'],
        mistEnabled: true,
        mistColor: 'rgba(0, 0, 0, 0.03)',
        turbulenceAmplitude: 0.5,
        turbulenceSpeed: 20,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.3,
        transitionDuration: 2500,
        ambientText: '궤도에 안개가 끼어 있어요. 시야가 맑아질 때까지 천천히 운행하세요.',
        flashColor: 'rgba(255, 255, 255, 0.1)',
        eventText: '궤도에 안개 발생',
        description: 'L2: 불투명한 관계'
    },
    DRAIN: {
        state: 'DRAIN',
        backgroundColor: '#F3F4F6',
        gradientColors: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
        mistEnabled: true,
        mistColor: 'rgba(0, 43, 92, 0.06)',
        turbulenceAmplitude: 0.2,
        turbulenceSpeed: 10,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.1,
        transitionDuration: 3000,
        ambientText: '궤도 에너지가 낮아지고 있어요. 잠시 운행 속도를 늦춰도 괜찮아요.',
        flashColor: 'rgba(0, 43, 92, 0.3)',
        eventText: '궤도 에너지 낮음',
        description: 'L3: 정서적 소진'
    },
    SURGE: {
        state: 'SURGE',
        backgroundColor: '#F0EBE1',
        gradientColors: ['#F0EBE1', '#E3DCD0', '#D6CDBF'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 1.5,
        turbulenceSpeed: 40,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 2.0,
        transitionDuration: 1000,
        ambientText: '궤도에 큰 기류 변화가 감지되고 있어요. 운행 상태를 살펴보세요.',
        flashColor: 'rgba(76, 175, 80, 0.4)',
        eventText: '궤도 기류 변화 감지',
        description: 'L4: 에너지 급변'
    },
    NORMAL: {
        state: 'NORMAL',
        backgroundColor: '#FCF9F2',
        gradientColors: ['#FCF9F2', '#F2EEE3', '#E8E4D9'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0.1,
        turbulenceSpeed: 10,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.5,
        transitionDuration: 1500,
        ambientText: '궤도가 평온하게 운행 중이에요. 오늘도 안정적인 하루입니다.',
        flashColor: 'rgba(74, 93, 78, 0.1)',
        eventText: '평온한 궤도 운행 중',
        description: 'L5: 평상시(Default)'
    },
    BREEZE: {
        state: 'BREEZE',
        backgroundColor: '#FEFDFB',
        gradientColors: ['#FEFDFB', '#FAF7F0', '#F5EFE3'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0.3,
        turbulenceSpeed: 30,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.8,
        transitionDuration: 1800,
        ambientText: '궤도에 산들바람이 불고 있어요. 안정적으로 운행되고 있습니다.',
        flashColor: 'rgba(165, 214, 167, 0.5)',
        eventText: '궤도가 안정되고 있어요',
        description: 'L6: 싱그러운 회복'
    },
    SUPERNOVA: {
        state: 'SUPERNOVA',
        backgroundColor: '#F0F9FF',
        gradientColors: ['#F0F9FF', '#E0F2FE', '#BAE6FD'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0.1,
        turbulenceSpeed: 15,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 4.0,
        transitionDuration: 1500,
        ambientText: '궤도 운행이 최고의 컨디션이에요! 모든 관계가 환하게 빛나고 있어요.',
        flashColor: 'rgba(255, 255, 0, 0.6)',
        eventText: '궤도 컨디션 최고!',
        description: 'L7: 정서적 초신성'
    },
};

export const computeImmediateState = (relationships: RelationshipNode[]): AtmosphereTheme => {
    if (!relationships || relationships.length === 0) return ATMOSPHERE_THEMES.NORMAL;
    const candidates: Interaction[] = [];
    relationships.forEach(r => {
        if (r.interactions && r.interactions.length > 0) {
            candidates.push(r.interactions[r.interactions.length - 1]);
        }
    });
    if (candidates.length === 0) return ATMOSPHERE_THEMES.NORMAL;

    candidates.sort((a, b) => {
        const dA = new Date(a.createdAt || a.date || 0).getTime();
        const dB = new Date(b.createdAt || b.date || 0).getTime();
        return dB - dA;
    });

    const latest = candidates[0];
    const drain = latest.energyDrain || 0;
    const sat = latest.satisfaction || 0;

    let isSurge = false;
    const parentRel = relationships.find(r => 
        r.interactions && r.interactions.length >= 2 && 
        r.interactions[r.interactions.length - 1].id === latest.id
    );
    if (parentRel) {
        const prev = parentRel.interactions[parentRel.interactions.length - 2];
        const prevDrain = prev.energyDrain || 0;
        if (drain - prevDrain >= 30) isSurge = true;
    }

    if (drain > 85) return ATMOSPHERE_THEMES.STORM;
    if (isSurge) return ATMOSPHERE_THEMES.SURGE;
    if (drain > 65) return ATMOSPHERE_THEMES.MIST;
    if (sat < 30) return ATMOSPHERE_THEMES.DRAIN;
    if (sat < 50) return ATMOSPHERE_THEMES.MIST;
    if (sat >= 90 && drain < 30) return ATMOSPHERE_THEMES.SUPERNOVA;
    if (sat >= 75 && drain < 40) return ATMOSPHERE_THEMES.BREEZE; // Adjusted to L6
    return ATMOSPHERE_THEMES.NORMAL; // L5 Default
};

export const computeAmbientState = (relationships: RelationshipNode[]): AtmosphereTheme => {
    if (!relationships || relationships.length === 0) return ATMOSPHERE_THEMES.NORMAL;
    const all: Interaction[] = [];
    relationships.forEach(r => {
        all.push(...(r.interactions || []).slice(-10));
    });
    if (all.length === 0) return ATMOSPHERE_THEMES.NORMAL;

    const avgDrain = all.reduce((s, i) => s + (i.energyDrain || 0), 0) / all.length;
    const avgSat = all.reduce((s, i) => s + (i.satisfaction || 0), 0) / all.length;

    let isSurge = false;
    if (all.length >= 6) {
        const r5 = all.slice(-5);
        const e5 = all.slice(-10, -5);
        const rAvg = r5.reduce((s, i) => s + (i.energyDrain || 0), 0) / r5.length;
        const eAvg = e5.reduce((s, i) => s + (i.energyDrain || 0), 0) / e5.length;
        if (rAvg - eAvg >= 30) isSurge = true;
    }

    if (avgDrain > 85) return ATMOSPHERE_THEMES.STORM;
    if (isSurge) return ATMOSPHERE_THEMES.SURGE;
    if (avgDrain > 65) return ATMOSPHERE_THEMES.MIST;
    if (avgSat < 35) return ATMOSPHERE_THEMES.DRAIN;
    if (avgSat < 50) return ATMOSPHERE_THEMES.MIST;
    if (avgSat >= 90 && avgDrain < 30) return ATMOSPHERE_THEMES.SUPERNOVA;
    if (avgSat >= 75 && avgDrain < 45) return ATMOSPHERE_THEMES.BREEZE;
    return ATMOSPHERE_THEMES.NORMAL;
};

export const useOrbitAtmosphere = (
    relationships: RelationshipNode[],
    setSystemMessage: (msg: string | null) => void
) => {
    const prevImmediateStateRef = useRef<AtmosphereState>('NORMAL');

    const ambient = useMemo(
        () => computeAmbientState(relationships || []),
        [(relationships || []).map(r => (r?.interactions || []).length).join(',')]
    );

    const immediate = useMemo(
        () => computeImmediateState(relationships || []),
        [(relationships || []).map(r => {
            const last = r?.interactions && r.interactions.length > 0 
                ? r.interactions[r.interactions.length - 1] 
                : null;
            return last?.id ?? '';
        }).join(',')]
    );

    const immediateChanged = prevImmediateStateRef.current !== immediate.state;
    if (immediateChanged) {
        prevImmediateStateRef.current = immediate.state;
    }

    return { ambient, immediate, immediateChanged };
};
