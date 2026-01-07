# Self-Health Report 데이터 분석 및 구현 명세

## 1. 개요
Self-Health Report는 사용자의 모든 인간관계 데이터를 종합하여, **'나(Self)'의 사회적/정서적 건강 상태**를 시각화하는 대시보드입니다. 개별 관계의 미시적 분석이 아닌, 전체 관계망의 거시적 패턴을 분석합니다.

## 2. 데이터 소스
`useRelationshipStore`의 `relationships` 배열을 기반으로 계산합니다.
- **Relationships**: 현재 등록된 모든 인맥 데이터
- **History**: 각 인맥별 상호작용(Interaction) 로그

## 3. 차트별 데이터 매핑 전략

### A. Relationship Balance (5-Axis Radar Chart)
관계의 질적 균형을 보여주는 5가지 핵심 지표입니다. 전체 관계의 평균값을 사용합니다.

| 지표 (Axis) | 데이터 매핑 (Source) | 산출 로직 (Logic) |
| :--- | :--- | :--- |
| **Trust (신뢰)** | `metrics.trust` | 전체 관계의 신뢰도 평균 |
| **Growth (성장)** | `rqsResult.areaScores.growth` 또는 `metrics.satisfaction` | RQS 진단 데이터가 있으면 우선 사용, 없으면 만족도를 대체 지표로 사용 |
| **Stability (안정)** | `rqsResult.areaScores.safety` 또는 `zone` 분포 | RQS 안전성 점수 평균. 데이터 부족 시 Zone 1-2 비율로 계산 (상위 20% 관계망의 견고함) |
| **Passion (열정)** | `metrics.communication` | 소통 점수의 평균. (적극적인 교류 정도) |
| **Joy (기쁨)** | `metrics.satisfaction` + `temperature` | 만족도와 현재 정서 온도의 평균 |

### B. Energy Consumption (Stacked Bar Chart)
사용자가 관계 유지에 쏟은 에너지를 '감정적 몰입'과 '사회적 수행'으로 구분하여 요일별로 보여줍니다.

- **분석 대상**: 최근 7일간의 모든 `history` (Interaction) 데이터.
- **X축**: 요일 (Mon ~ Sun)
- **Bar 1: Emotional Energy (Primary Color)**
  - 정의: 깊은 공감이나 스트레스 등 감정 소모가 컸던 정도
  - 수식: `Sum( interaction.oxytocin + interaction.cortisol )`
  - 의미: 내가 얼마나 마음을 썼는가.
- **Bar 2: Social Battery (Secondary Color)**
  - 정의: 단순한 사회적 교류 빈도 및 수행 에너지
  - 수식: `Count( interaction ) * 20` (기본 수행 점수)
  - 의미: 내가 얼마나 많은 사람을 상대했는가.

### C. Check-in Pulse (Waveform Graph)
감정 상태의 일관성과 톤(Tone)을 시각화합니다.

- **Waveform Data**: 최근 7일간 `temperature`의 이동 평균선.
- **Positive Count**: `temperature >= 60` 인 상호작용 횟수.
- **Challenging Count**: `temperature < 40` 또는 `cortisol >= 60` 인 상호작용 횟수.
- **Logged**: 해당 주간의 총 상호작용 기록 수.

## 4. 구현 계획 (Implementation Tasks)

### 1단계: Hook 작성 (`useSelfHealthData`)
- `useRelationshipStore`에서 데이터를 가져와 위 로직대로 가공하는 커스텀 Hook을 구현합니다.
- `useMemo`를 활용하여 성능을 최적화합니다.
- 주간(Weekly) 데이터를 기본으로 하되, Monthly/Yearly 확장을 고려하여 기간 필터링 로직을 포함합니다.

### 2단계: UI 연동
- `SelfHealthReport.tsx`의 하드코딩된 Mock Data를 Hook에서 반환된 실제 데이터로 교체합니다.
- 데이터가 부족한 초기 유저를 위해 '최소 데이터 요건(Minimum Logs)' 미달 시 안내 문구를 표시하거나, 기본값(Neutral)을 보여주는 로직을 추가합니다.
