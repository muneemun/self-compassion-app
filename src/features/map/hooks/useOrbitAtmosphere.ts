/**
 * 🌌 useOrbitAtmosphere — Intelligent Atmosphere Engine v3.0
 *
 * 이중 레이어(Dual-Layer) 대기 시스템:
 *
 * [Layer A] 즉각 반응 (Event Flash)
 *   - 가장 최근 체크인 1개에 즉각 반응
 *   - 3~5초 후 자동 소멸하는 컬러 플래시 + 텍스트
 *   - "방금 무슨 일이 있었는지"를 표현
 *
 * [Layer B] 누적 상태 (Ambient Field)
 *   - 모든 관계의 최근 10개 인터랙션 평균값 기반
 *   - 지속적인 배경색 + 연무 + 파동 효과
 *   - "전반적인 관계 건강 상태"를 표현
 *
 * 대기 상태 기준 (공통):
 *   ENERGY_DRAIN     — 에너지 소모 > 65
 *   ENERGY_CRITICAL  — 에너지 소모 > 85 (번아웃 임박)
 *   LOW_SATISFACTION — 만족도 < 40
 *   GOLDEN_BALANCE   — 만족도 >= 75 && 에너지 소모 < 40
 *   ENERGY_SURGE     — 직전 대비 소모량 20% 이상 급증
 *   NORMAL           — 기타 평상시
 */

import { useMemo, useRef } from 'react';
import { Interaction, RelationshipNode } from '../../../types/relationship';

// ─── 대기 상태 타입 ────────────────────────────────────────────────
// ─── 대기 상태 타입 (v5.0 Hybrid Weather) ──────────────────────────
export type AtmosphereState =
    | 'DEEP_SEA'        // L1: 고립/침잠
    | 'MIST'            // L2: 혼란/정체
    | 'STORM'           // L3: 갈등/소진
    | 'CALM'            // L4: 평온/일상
    | 'BREEZE'          // L5: 회복/연결
    | 'SUNSET'          // L6: 충전/유대
    | 'SUPERNOVA';      // L7: 환희/일체

// ─── 대기 상태별 시각 + 텍스트 연출 정의 ─────────────────────────
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
    swirlSpeed: number;      // v5 Swirl Engine Token
    transitionDuration: number;
    ambientText: string;
    flashColor: string;
    eventText: string;
    description: string;
}

export const ATMOSPHERE_THEMES: Record<AtmosphereState, AtmosphereTheme> = {
    DEEP_SEA: {
        state: 'DEEP_SEA',
        backgroundColor: '#000B1A',
        gradientColors: ['#000B1A', '#001533', '#002B5C'],
        mistEnabled: true,
        mistColor: 'rgba(0, 43, 92, 0.4)',
        turbulenceAmplitude: 0.2,
        turbulenceSpeed: 10,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.1,
        transitionDuration: 3000,
        ambientText: '깊은 침잠 속에 머물고 있어요. 조용히 숨을 골라보세요.',
        flashColor: 'rgba(0, 43, 92, 0.3)',
        eventText: '조용한 파동이 느껴집니다.',
        description: 'L1: 정서적 침잠'
    },
    MIST: {
        state: 'MIST',
        backgroundColor: '#1A1A1A',
        gradientColors: ['#1A1A1A', '#262626', '#333333'],
        mistEnabled: true,
        mistColor: 'rgba(255, 255, 255, 0.08)',
        turbulenceAmplitude: 0.5,
        turbulenceSpeed: 20,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.3,
        transitionDuration: 2500,
        ambientText: '관계의 풍경이 흐릿하네요. 서두르지 않아도 괜찮아요.',
        flashColor: 'rgba(255, 255, 255, 0.1)',
        eventText: '안개 속에서 신호가 들려와요.',
        description: 'L2: 불투명한 관계'
    },
    STORM: {
        state: 'STORM',
        backgroundColor: '#1F0505',
        gradientColors: ['#121212', '#1F0505', '#2D0A0A'],
        mistEnabled: true,
        mistColor: 'rgba(183, 28, 28, 0.15)',
        turbulenceAmplitude: 1.8,
        turbulenceSpeed: 45,
        waveEnabled: true,
        waveColor: '#B71C1C',
        swirlSpeed: 2.5,
        transitionDuration: 1200,
        ambientText: '폭풍우가 치고 있어요. 지금은 마음의 요새를 지킬 때입니다.',
        flashColor: 'rgba(255, 0, 0, 0.3)',
        eventText: '강한 정서적 충돌이 감지되었습니다!',
        description: 'L3: 갈등과 소진'
    },
    CALM: {
        state: 'CALM',
        backgroundColor: '#FCF9F2',
        gradientColors: ['#FCF9F2', '#F2EEE3', '#E8E4D9'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0,
        turbulenceSpeed: 60,
        waveEnabled: false,
        waveColor: 'transparent',
        swirlSpeed: 0.5,
        transitionDuration: 1500,
        ambientText: '대기가 평온합니다. 관계들이 제자리를 찾았어요.',
        flashColor: 'rgba(74, 93, 78, 0.1)',
        eventText: '기분 좋은 일상이 흐릅니다.',
        description: 'L4: 안정적 평온'
    },
    BREEZE: {
        state: 'BREEZE',
        backgroundColor: '#E8F5E9',
        gradientColors: ['#E8F5E9', '#C8E6C9', '#A5D6A7'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0.3,
        turbulenceSpeed: 30,
        waveEnabled: true,
        waveColor: 'rgba(129, 199, 132, 0.4)',
        swirlSpeed: 0.8,
        transitionDuration: 1800,
        ambientText: '산들바람이 불어와요. 관계에 새로운 생기가 돕니다.',
        flashColor: 'rgba(165, 214, 167, 0.5)',
        eventText: '회복의 신호가 감지되었어요.',
        description: 'L5: 싱그러운 회복'
    },
    SUNSET: {
        state: 'SUNSET',
        backgroundColor: '#FFF3E0',
        gradientColors: ['#FFF3E0', '#FFE0B2', '#FFB74D'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0.2,
        turbulenceSpeed: 20,
        waveEnabled: true,
        waveColor: 'rgba(255, 183, 77, 0.5)',
        swirlSpeed: 1.2,
        transitionDuration: 2000,
        ambientText: '노을빛 충전 중입니다. 마음이 따뜻하게 채워지네요.',
        flashColor: 'rgba(255, 215, 0, 0.4)',
        eventText: '에너지가 충전되었습니다!',
        description: 'L6: 따뜻한 유대'
    },
    SUPERNOVA: {
        state: 'SUPERNOVA',
        backgroundColor: '#FFFDE1',
        gradientColors: ['#FFFDE1', '#FFF9C4', '#FFD54F'],
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0.1,
        turbulenceSpeed: 15,
        waveEnabled: true,
        waveColor: '#FFD54F',
        swirlSpeed: 4.0,
        transitionDuration: 1500,
        ambientText: '축하해요! 최고의 정서적 일체감을 경험하고 계시네요.',
        flashColor: 'rgba(255, 255, 0, 0.6)',
        eventText: 'SUPERNOVA EXPLOSION!',
        description: 'L7: 정서적 초신성'
    },
};


// ─── Layer A: 즉각 반응 계산 (최신 체크인 1개) ────────────────────
export const computeImmediateState = (
    relationships: RelationshipNode[]
): AtmosphereTheme => {
    if (!relationships || relationships.length === 0) return ATMOSPHERE_THEMES.NORMAL;

    // 각 관계의 마지막 인터랙션만 수집
    const candidates: Interaction[] = [];
    relationships.forEach(r => {
        if (r.interactions && r.interactions.length > 0) {
            candidates.push(r.interactions[r.interactions.length - 1]);
        }
    });

    if (candidates.length === 0) return ATMOSPHERE_THEMES.NORMAL;

    // 가장 최근 1개 선택
    candidates.sort((a, b) => {
        const dA = new Date(a.createdAt || a.date || 0).getTime();
        const dB = new Date(b.createdAt || b.date || 0).getTime();
        return dB - dA;
    });

    const latest = candidates[0];
    const drain  = latest.energyDrain || 0;
    const sat    = latest.satisfaction  || 0;

    // 에너지 급변: 해당 관계의 직전 체크인과 비교
    // 근본적 수정: 절대값으로 30 이상 증가 && 현재 소모량이 65(경고 수준) 이상일 때만 급변으로 인정
    let isSurge = false;
    const parentRel = relationships.find(r =>
        r.interactions && r.interactions.length >= 2 &&
        r.interactions[r.interactions.length - 1].id === latest.id
    );
    if (parentRel) {
        const prev = parentRel.interactions[parentRel.interactions.length - 2];
        const prevDrain = prev.energyDrain || 0;
        if (drain - prevDrain >= 30 && drain >= 65) {
            isSurge = true;
        }
    }

    if (drain > 85)              return ATMOSPHERE_THEMES.STORM;
    if (drain > 65)              return ATMOSPHERE_THEMES.MIST;
    if (isSurge)                 return ATMOSPHERE_THEMES.STORM;
    if (sat < 30)                return ATMOSPHERE_THEMES.DEEP_SEA;
    if (sat < 50)                return ATMOSPHERE_THEMES.MIST;
    if (sat >= 90 && drain < 30) return ATMOSPHERE_THEMES.SUPERNOVA;
    if (sat >= 75 && drain < 40) return ATMOSPHERE_THEMES.SUNSET;
    if (sat >= 60 && drain < 50) return ATMOSPHERE_THEMES.BREEZE;
    return ATMOSPHERE_THEMES.CALM;
};

// ─── Layer B: 누적 상태 계산 (최근 10개 평균) ─────────────────────
export const computeAmbientState = (
    relationships: RelationshipNode[]
): AtmosphereTheme => {
    if (!relationships || relationships.length === 0) return ATMOSPHERE_THEMES.NORMAL;

    const all: Interaction[] = [];
    relationships.forEach(r => {
        all.push(...(r.interactions || []).slice(-10));
    });

    if (all.length === 0) return ATMOSPHERE_THEMES.NORMAL;

    const avgDrain = all.reduce((s, i) => s + (i.energyDrain || 0), 0) / all.length;
    const avgSat   = all.reduce((s, i) => s + (i.satisfaction  || 0), 0) / all.length;

    // 에너지 급변: 전체 최근 5개 vs 이전 5개
    let isSurge = false;
    if (all.length >= 6) {
        const r5 = all.slice(-5);
        const e5 = all.slice(-10, -5);
        const rAvg = r5.reduce((s, i) => s + (i.energyDrain || 0), 0) / r5.length;
        const eAvg = e5.reduce((s, i) => s + (i.energyDrain || 0), 0) / e5.length;
        if (rAvg - eAvg >= 30 && rAvg >= 65) {
            isSurge = true;
        }
    }

    if (avgDrain > 85)                   return ATMOSPHERE_THEMES.STORM;
    if (avgDrain > 65)                   return ATMOSPHERE_THEMES.MIST;
    if (isSurge)                         return ATMOSPHERE_THEMES.STORM;
    if (avgSat < 35)                     return ATMOSPHERE_THEMES.DEEP_SEA;
    if (avgSat < 50)                     return ATMOSPHERE_THEMES.MIST;
    if (avgSat >= 90 && avgDrain < 30)   return ATMOSPHERE_THEMES.SUPERNOVA;
    if (avgSat >= 75 && avgDrain < 40)   return ATMOSPHERE_THEMES.SUNSET;
    if (avgSat >= 60 && avgDrain < 50)   return ATMOSPHERE_THEMES.BREEZE;
    return ATMOSPHERE_THEMES.CALM;
};

// ─── Hook 반환 타입 ────────────────────────────────────────────────
export interface DualAtmosphere {
    /** Layer B — 누적 상태 (배경/마스크/연무 제어) */
    ambient: AtmosphereTheme;
    /** Layer A — 즉각 반응 (플래시/이벤트 텍스트 제어) */
    immediate: AtmosphereTheme;
    /** Layer A 텍스트가 새로 바뀌었는지 여부 (플래시 트리거용) */
    immediateChanged: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────
export const useOrbitAtmosphere = (
    relationships: RelationshipNode[],
    setSystemMessage: (msg: string | null) => void
): DualAtmosphere => {
    const prevImmediateStateRef = useRef<AtmosphereState>('NORMAL');

    // Layer B: 평균값 기반 — 인터랙션 수 변화 시 재계산
    const ambient = useMemo(
        () => computeAmbientState(relationships || []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [(relationships || []).map(r => (r?.interactions || []).length).join(',')]
    );

    // Layer A: 최신 ID 기반 — 새 체크인마다 즉각 재계산
    const immediate = useMemo(
        () => computeImmediateState(relationships || []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [(relationships || []).map(r => {
            const last = r?.interactions && r.interactions.length > 0 
                ? r.interactions[r.interactions.length - 1] 
                : null;
            return last?.id ?? '';
        }).join(',')]
    );

    // 즉각 반응이 새로 바뀌었는지 감지
    const immediateChanged = prevImmediateStateRef.current !== immediate.state;
    if (immediateChanged) {
        prevImmediateStateRef.current = immediate.state;
    }

    return { ambient, immediate, immediateChanged };
};
