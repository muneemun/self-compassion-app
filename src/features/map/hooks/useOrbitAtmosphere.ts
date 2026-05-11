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
export type AtmosphereState =
    | 'NORMAL'
    | 'ENERGY_DRAIN'
    | 'ENERGY_CRITICAL'
    | 'LOW_SATISFACTION'
    | 'GOLDEN_BALANCE'
    | 'ENERGY_SURGE';

// ─── 대기 상태별 시각 + 텍스트 연출 정의 ─────────────────────────
export interface AtmosphereTheme {
    state: AtmosphereState;
    /** 지형도 캔버스 배경색 (Layer B 지속 배경) */
    backgroundColor: string;
    /** 연무(Mist) 레이어 활성화 여부 */
    mistEnabled: boolean;
    mistColor: string;
    /** 난기류 진폭 (0=없음) */
    turbulenceAmplitude: number;
    turbulenceSpeed: number;
    /** 에너지 파동(Wave) 활성화 여부 */
    waveEnabled: boolean;
    waveColor: string;
    /** 배경 전환 애니메이션 duration (ms) */
    transitionDuration: number;
    /** Layer B — 누적 상태 텍스트 (하단 상태바에 지속 표시) */
    ambientText: string;
    /** Layer A — 즉각 반응 플래시 색상 */
    flashColor: string;
    /** Layer A — 즉각 반응 텍스트 (3~5초 표시 후 소멸) */
    eventText: string;
    /** 상태 설명 (디버깅용) */
    description: string;
}

// ─── 대기 테마 매핑 ────────────────────────────────────────────────
export const ATMOSPHERE_THEMES: Record<AtmosphereState, AtmosphereTheme> = {
    NORMAL: {
        state: 'NORMAL',
        backgroundColor: '#FCF9F2',
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0,
        turbulenceSpeed: 60,
        waveEnabled: false,
        waveColor: 'transparent',
        transitionDuration: 1000,
        ambientText: '관계들이 편안하게 함께하고 있어요.',
        flashColor: 'rgba(74, 93, 78, 0.15)',
        eventText: '오늘 만남은 잔잔하게 흘러갔어요.',
        description: '평상시 — 균형 잡힌 관계 에너지',
    },

    ENERGY_DRAIN: {
        state: 'ENERGY_DRAIN',
        backgroundColor: '#3D0A0A',
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 2.0,
        turbulenceSpeed: 35,
        waveEnabled: false,
        waveColor: '#FF4444',
        transitionDuration: 1500,
        ambientText: '최근 만남들이 에너지를 많이 가져가고 있네요. 천천히 가도 돼요.',
        flashColor: 'rgba(180, 30, 30, 0.35)',
        eventText: '이번 만남에서 힘이 꽤 빠졌어요. 그럴 수 있어요.',
        description: '에너지 고갈 — 소모량 과다',
    },

    ENERGY_CRITICAL: {
        state: 'ENERGY_CRITICAL',
        backgroundColor: '#121212',
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 3.5,
        turbulenceSpeed: 25,
        waveEnabled: false,
        waveColor: '#880000',
        transitionDuration: 2000,
        ambientText: '요즘 많이 힘드셨을 것 같아요. 나를 먼저 챙겨도 괜찮아요.',
        flashColor: 'rgba(100, 0, 0, 0.5)',
        eventText: '이번 만남 뒤에 좀 쉬고 싶을 수도 있어요. 괜찮아요.',
        description: '에너지 임계치 — 번아웃 임박',
    },

    LOW_SATISFACTION: {
        state: 'LOW_SATISFACTION',
        backgroundColor: '#0D1B2A',
        mistEnabled: true,
        mistColor: 'rgba(180, 200, 230, 0.18)',
        turbulenceAmplitude: 0.8,
        turbulenceSpeed: 80,
        waveEnabled: false,
        waveColor: 'transparent',
        transitionDuration: 2000,
        ambientText: '요즘 만남이 좀 시들했을 수 있어요. 그런 시기도 괜찮아요.',
        flashColor: 'rgba(30, 60, 120, 0.35)',
        eventText: '오늘 만남이 조금 힘들었군요. 그런 날도 있어요.',
        description: '만족도 저하 — 관계 질적 하락',
    },

    GOLDEN_BALANCE: {
        state: 'GOLDEN_BALANCE',
        backgroundColor: '#FFFFFF',
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 0,
        turbulenceSpeed: 60,
        waveEnabled: false,
        waveColor: 'transparent',
        transitionDuration: 1500,
        ambientText: '지금 관계들이 참 따뜻하게 흐르고 있어요. 잘 되고 있어요.',
        flashColor: 'rgba(255, 220, 100, 0.3)',
        eventText: '오늘 만남이 참 좋았던 것 같아요. 기분 좋죠?',
        description: '골든 밸런스 — 최적 에너지 순환',
    },

    ENERGY_SURGE: {
        state: 'ENERGY_SURGE',
        backgroundColor: '#0F1A0F',
        mistEnabled: false,
        mistColor: 'transparent',
        turbulenceAmplitude: 1.5,
        turbulenceSpeed: 45,
        waveEnabled: true,
        waveColor: '#66BB6A',
        transitionDuration: 800,
        ambientText: '요즘 관계에서 변화가 있었나봐요. 나름 잘 버티고 있어요.',
        flashColor: 'rgba(50, 150, 80, 0.35)',
        eventText: '이번엔 평소보다 더 많은 걸 쏟았네요. 수고했어요.',
        description: '에너지 급변 — 소모량 급증',
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

    if (drain > 85)              return ATMOSPHERE_THEMES.ENERGY_CRITICAL;
    if (drain > 65)              return ATMOSPHERE_THEMES.ENERGY_DRAIN;
    if (isSurge)                 return ATMOSPHERE_THEMES.ENERGY_SURGE;
    if (sat < 40)                return ATMOSPHERE_THEMES.LOW_SATISFACTION;
    if (sat >= 75 && drain < 40) return ATMOSPHERE_THEMES.GOLDEN_BALANCE;
    return ATMOSPHERE_THEMES.NORMAL;
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

    if (avgDrain > 85)                   return ATMOSPHERE_THEMES.ENERGY_CRITICAL;
    if (avgDrain > 65)                   return ATMOSPHERE_THEMES.ENERGY_DRAIN;
    if (isSurge)                         return ATMOSPHERE_THEMES.ENERGY_SURGE;
    if (avgSat < 40)                     return ATMOSPHERE_THEMES.LOW_SATISFACTION;
    if (avgSat >= 75 && avgDrain < 40)   return ATMOSPHERE_THEMES.GOLDEN_BALANCE;
    return ATMOSPHERE_THEMES.NORMAL;
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
        () => computeAmbientState(relationships),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [relationships.map(r => (r.interactions || []).length).join(',')]
    );

    // Layer A: 최신 ID 기반 — 새 체크인마다 즉각 재계산
    const immediate = useMemo(
        () => computeImmediateState(relationships),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [relationships.map(r => {
            const last = r.interactions && r.interactions.length > 0 
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
