# Self-Health Report 데이터 분석 및 구현 명세 (v2.0)

## 1. 개요
Self-Health Report는 사용자의 모든 인간관계 데이터와 **'자기 돌봄(Self-Care)'** 활동을 종합하여, 내면의 **'정서 에너지'** 상태를 조감하는 대시보드입니다.

## 2. 데이터 소스 및 통합 (2-Track System)
- **Track 1: Social Interaction**: `useRelationshipStore`의 인맥 교류 로그. (만족도/에너지소모)
- **Track 2: Self-Care Recovery**: `useSelfTimeStore`의 자기 돌봄 로그. (회복 만족도)
- **통합 지표**: 두 트랙의 만족도를 합산/평균하여 '정서 에너지(Emotional Energy)'를 산출합니다.

## 3. 차트별 데이터 매핑 및 산출 로직

### A. 정서 에너지 사용 리포트 (Energy Usage Chart)
활동량(교류+회복) 대비 내면의 충전 상태를 보여주는 하이브리드 차트입니다.

| 항목 | 필드명 | 산출 로직 (Logic) |
| :--- | :--- | :--- |
| **사회적 교류량** | `interactionCounts` | 요일별 인맥 상호작용 횟수 (정규화 0~100) |
| **자기 돌봄량** | `selfTimeCounts` | 요일별 '나와의 시간' 기록 횟수 (정규화 0~100) |
| **정서 에너지** | `avgEnergyLevels` | (교류만족도합 + 회복만족도합) / 전체활동수 (0~100%) |

- **시각화**: 교류량/자기돌봄량은 스택바(Stacked Bar)로, 정서 에너지는 베지어 곡선(Line)으로 오버레이 표시.

### B. 정서적 관계 지형도 (Social Topography)
만족도와 에너지 소모의 상관관계를 4분면으로 분석합니다.

- **X축 (Energy Drain)**: 관계 유지에 드는 심리적 비용 (0 ~ 100)
- **Y축 (Satisfaction)**: 관계를 통해 얻는 정서적 보상 (0 ~ 100)
- **분류**:
  - **✨ 나의 비타민**: 고만족 / 저소모
  - **🧛 주의가 필요해**: 저만족 / 고소모
  - **🌀 성장의 자극**: 고만족 / 고소모
  - **🛡️ 일상의 중력**: 저만족 / 저소모

### C. 정서 에너지 흐름 (Check-in Pulse)
최근 상호작용의 감정적 톤(Tone)과 리듬을 분석합니다.

- **Waveform Data**: 최근 20개의 히스토리(교류+회복) 만족도 포인트.
- **Positive Count**: 에너지가 60% 이상인 기록 수.
- **Challenging Count**: 에너지가 40% 이하이거나 코르티솔이 높은 기록 수.

## 4. 핵심 데이터 모델 (`useSelfHealthData`)

Hook에서 반환되는 최종 객체 구조입니다.

```typescript
{
  pulseStats: { positive: number, challenging: number, total: number },
  pulsePoints: Array<{ value: number | null, isSelfTime: boolean }>,
  energyTotal: { avgOxytocin: number, avgCortisol: number },
  selfTimeStats: { totalRestoreMinutes: number, avgRestorationDelta: number, bestCategory: string },
  stats: {
    interactionCounts: number[], // 정규화된 바 높이
    selfTimeCounts: number[],    // 정규화된 바 높이
    avgEnergyLevels: (number | null)[], // 꺾은선 데이터
    labels: string[] // 요일/날짜 라벨
  },
  dateRange: { start: Date, end: Date }
}
```

## 5. 관리 지침
- 모든 데이터 가공은 `useMemo` 내에서 수행하여 UI 렌더링 성능을 보장합니다.
- 데이터가 없는 슬롯(Slot)은 `null`로 처리하여 차트에서 끊김 없이 부드럽게 표현되도록 합니다.
- **단위 일관성**: 모든 사용자 노출 데이터는 퍼센티지(%) 단위를 사용합니다.
