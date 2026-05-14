# 🌿 "나와의 시간" 체크인 기능 추가 — 기획 제안서

> **작업 전 검토 및 승인이 필요한 문서입니다. 코드 작업은 승인 후 시작합니다.**  
> 작성일: 2026-04-24

---

## 1. 현재 시스템 진단 (What Exists)

현재 체크인 구조 (`RelationshipDetail.tsx → addInteraction`)는 다음을 기록합니다:

| 필드 | 설명 | 타입 |
|---|---|---|
| `title` | 활동 주제 (ex: 저녁 식사) | string |
| `description` | 상세 내용 | string |
| `energy` | 정서 에너지 (0–100) | number |
| `oxytocin` | 옥시토신 추정값 (고정 기본값 85) | number |
| `cortisol` | 코르티솔 추정값 (고정 기본값 30) | number |

**핵심 문제:**  
현재 시스템은 오직 **타인과의 상호작용(관계 소모/회복)**만 측정합니다.  
감정 에너지의 가장 중요한 **회복 변수**인 **"나를 위해 의도적으로 쓰는 시간"은 완전히 누락**되어 있습니다.  
즉, 에너지 소모 내역만 있고 자기충전 내역이 없는 불완전한 대차대조표 상태입니다.

---

## 2. 심리학·정신의학적 근거

### 왜 "나와의 시간"이 독립 변수여야 하는가?

**① 자아 고갈 이론 (Ego Depletion, Baumeister & Tierney)**  
모든 사회적 상호작용은 자기조절 자원을 소모합니다. 이 자원은 회복 활동 없이는 자동으로 복구되지 않습니다. 나를 위한 의도적 시간(Intentional Self-Time)이 바로 이 자원의 보충 메커니즘입니다.

**② 폴리베이걸 이론 (Polyvagal Theory, Porges)**  
미주신경(vagus nerve)의 복측(ventral vagal) 활성화 상태가 '안전-연결' 모드를 만듭니다. 혼자 하는 특정 활동(느린 호흡, 움직임, 자연 노출)이 이 상태를 가장 효율적으로 유도합니다. 이는 타인과의 상호작용으로는 얻을 수 없는 독립적인 회복 경로입니다.

**③ 자기결정이론 (Self-Determination Theory, Deci & Ryan)**  
심리적 웰빙의 3대 기본욕구 중 **자율성(Autonomy)**은 타인의 기대 없이 순수하게 나 자신을 위해 행동할 때 충족됩니다. 관계 에너지와 완전히 분리된 측정이 필요한 이유입니다.

**④ 자기연민 이론 (Self-Compassion, Kristin Neff)**  
자기연민의 3요소(마음챙김 / 자기친절 / 보편적 인간성) 중 마음챙김과 자기친절은 나와의 시간을 통해서만 실천됩니다. 이 앱의 핵심 철학인 "Self-Compassion"에 가장 직접 연결되는 데이터입니다.

**⑤ 내향성 회복 이론 (Introversion & Energy, Susan Cain / Hans Eysenck)**  
자극 역치에 따라 사람마다 필요한 자기충전 시간의 양이 다릅니다. 이 데이터를 쌓으면 사용자 고유의 "최적 자기시간 임계값"을 찾을 수 있습니다.

---

## 3. 추천 자기회복 태스크 (심리학·정신의학 기반)

체크인에서 선택 가능한 **카테고리 + 세부 태스크** 제안입니다.

### 🧘 Category A — 신체 조절 (Somatic Regulation)
*폴리베이걸 이론 / HPA axis 리셋*

| 태스크 | 효과 | 권장 시간 |
|---|---|---|
| 복식 호흡 (4-7-8 기법) | 코르티솔 즉시 감소, 부교감 활성 | 5–10분 |
| 점진적 근육 이완 (PMR) | 신체 긴장 → 심리 이완 전이 | 15–20분 |
| 냉온 샤워 | 노르에피네프린 급등 → 기분 안정화 | 3–5분 |
| 느린 리듬의 단독 산책 | 전두엽 활성 감소, 반추 사고 차단 | 20분 이상 |

### 📓 Category B — 표현적 글쓰기 (Expressive Writing)
*Pennebaker Method / 감정 처리 이론*

| 태스크 | 효과 | 권장 시간 |
|---|---|---|
| 감정 저널링 (비구조적 쓰기) | 감정 명명 → 편도체 활성 감소 | 15–20분 |
| 감사 일지 3항목 기록 | 도파민 회로 활성, 긍정 편향 강화 | 5분 |
| 자기연민 편지 쓰기 (Neff) | 자기비판 → 자기공감으로 전환 | 10–15분 |
| 오늘의 감정 그래프 그리기 | 감정 시각화 → 객관화 거리 확보 | 5분 |

### 🎨 Category C — 창의적 표현 (Creative Flow)
*몰입(Flow) 이론, Csikszentmihalyi*

| 태스크 | 효과 | 권장 시간 |
|---|---|---|
| 드로잉/낙서 | 전전두엽 부하 감소, 내측 디폴트 모드 활성 | 자유 |
| 악기 연주 / 음악 감상 | 보상 회로 자극, 사회적 긴장 해소 | 자유 |
| 혼자 요리 | 감각 집중 → 반추 차단, 성취감 | 30분+ |
| 독서 (목적 없는 순수 독서) | 공감 신경망 활성화, 경험 자아 확장 | 자유 |

### 🌿 Category D — 감각 리셋 (Sensory Reset)
*감각 과부하 이론 / 환경심리학*

| 태스크 | 효과 | 권장 시간 |
|---|---|---|
| 디지털 침묵 시간 (No Screen) | 도파민 과자극 회복, 집중력 재정비 | 30분 이상 |
| 자연 노출 (Awe Induction) | 자의식 축소, 시간 지각 확장 | 20분 이상 |
| 아로마 / 목욕 의식 | 후각-변연계 직통로 활용한 즉각 안정 | 20분 |
| 의도적 낮잠 (20분 이내) | 해마 재고화(memory consolidation) 보조 | 20분 이내 |

### 🔮 Category E — 마음챙김 (Mindfulness)
*MBSR(Kabat-Zinn) / 수용전념치료(ACT)*

| 태스크 | 효과 | 권장 시간 |
|---|---|---|
| 바디 스캔 명상 | 신체-정서 연결 강화, 해리 방지 | 15–30분 |
| 자기연민 브레이크 (3단계) | 급성 감정 고통 처리 | 5분 |
| 마음챙김 식사 | 자동 행동 → 의도 행동 전환 | 식사 시간 |
| 러빙카인드니스 명상 (Metta) | 자기 수용 → 타인 수용 순서로 확장 | 10–20분 |

---

## 4. 작업 범위 (Scope of Work)

### 📂 Layer 1: 타입 시스템
**파일:** `src/types/relationship.ts`

```typescript
// 추가할 새 타입
export type SelfTimeCategory =
  'somatic' | 'writing' | 'creative' | 'sensory' | 'mindfulness';

export interface SelfTimeEntry {
  id: string;
  date: string;                    // ISO 날짜
  category: SelfTimeCategory;      // 카테고리
  activityTitle: string;           // 구체적 활동명
  duration: number;                // 분 단위
  intentionScore: number;          // 0–100: 얼마나 의도적으로 나를 위했는가?
  moodBefore: number;              // 0–100: 하기 전 감정 상태
  moodAfter: number;               // 0–100: 한 후 감정 상태
  restorationScore: number;        // 자동 계산: moodAfter - moodBefore (델타)
  note?: string;                   // 선택적 메모
}
```

### 📂 Layer 2: 스토어
**파일 (신규):** `src/store/useSelfTimeStore.ts`

- 관계 스토어와 완전 분리 (독립 변수 원칙)
- `selfTimeLogs: SelfTimeEntry[]` — 전체 자기시간 로그
- `addSelfTimeEntry(entry)` — 새 기록 추가
- `getWeeklySelfTimeStats(period)` — 주간/월간 집계

> **설계 원칙:** 관계 소모 데이터(`useRelationshipStore`)와 자기충전 데이터(`useSelfTimeStore`)를 분리함으로써, 에너지 대차대조표(소모 vs 충전)의 독립적 계산이 가능해집니다.

### 📂 Layer 3: 분석 훅
**파일:** `src/features/analysis/useSelfHealthData.ts`

추가할 계산:
```
selfTimeBalance = Σ(restorationScore × duration) / 총 관계소모 에너지
```
- `totalRestoreMinutes`: 기간 내 자기시간 총 분
- `avgRestorationDelta`: 평균 기분 변화 (moodAfter - moodBefore)
- `bestCategory`: 나에게 가장 효과적인 자기시간 카테고리
- `energyNetBalance`: 관계 소모 − 자기 충전 (적자/흑자 판단)

### 📂 Layer 4: UI — 체크인 화면
**파일 (신규):** `src/features/selfcare/SelfTimeCheckIn.tsx`

체크인 플로우:
1. **카테고리 선택** (5가지 아이콘 카드)
2. **활동 선택** (카테고리별 추천 태스크 또는 직접 입력)
3. **하기 전 기분** (정서 에너지 슬라이더, 0–100)
4. **소요 시간** (분 단위 입력)
5. **의도성 체크** ("얼마나 순수하게 나를 위한 시간이었나요?" 슬라이더)
6. **하고 난 후 기분** (슬라이더)
7. **짧은 메모** (선택)

### 📂 Layer 5: 분석 대시보드 통합
**파일:** `src/features/analysis/SelfHealthReport.tsx`

추가할 섹션:
- **"나와의 시간" 위클리 카드**: 총 충전 시간, 평균 회복 델타, 베스트 카테고리
- **에너지 대차대조표 차트**: 기존 Energy Consumption Bar에 "Self-Restore" 레이어 오버레이
- **Check-in Pulse 보완**: 자기시간 기록일을 펄스 그래프에 마커로 표시

### 📂 Layer 6: 진입점(Navigation) 연결
**파일:** `App.tsx`

- FAB 또는 탭에 "나와의 시간 체크인" 진입점 추가
- 또는 SelfHealthReport 화면에서 직접 진입 가능하도록 연결

---

## 5. 적용 규칙 (Design Rules)

### Rule 1: 분리의 원칙 (Separation of Concerns)
관계 에너지와 자기충전 에너지는 **반드시 독립된 스토어**로 관리합니다.
두 데이터를 하나의 스토어에 섞으면 에너지 대차대조표 계산이 불명확해집니다.

### Rule 2: 델타 우선주의 (Delta-First Measurement)
단순한 "몇 분 했느냐"보다 `moodAfter - moodBefore`(회복 델타)가 핵심 지표입니다.
오래 했어도 회복 효과가 없었다면 낮은 델타로 기록됩니다.

### Rule 3: 의도성 가중치 (Intentionality Weighting)
자동적·습관적으로 한 시간(ex: 무의식적 유튜브 시청)은 의도적 자기시간과 달라야 합니다.
`intentionScore`를 가중치로 사용해 진정한 회복 값을 산출합니다.
```
effectiveRestore = restorationDelta × (intentionScore / 100)
```

### Rule 4: 비판단적 기록 (Non-Judgmental Logging)
델타가 낮거나 음수여도(=쉬었는데 기분이 더 안 좋아졌어도) 패턴 데이터로 중립 처리합니다.
UI에서 부정적 피드백을 주지 않습니다. 자기연민 철학 유지.

### Rule 5: 최소 마찰 원칙 (Minimum Friction)
체크인 전체 플로우는 **90초 이내** 완료 가능해야 합니다.
슬라이더 3개 + 카테고리 탭 + 선택적 메모 구조로 단순하게 유지합니다.

### Rule 6: 처방 연동 (Prescription Linkage)
자기시간이 부족한 날이 3일 이상 연속되면 SelfHealthReport에서 해당 유형의 활동을 처방(추천)합니다.
현재의 RQS 등급 + 에너지 패턴을 함께 고려합니다.

---

## 6. 작업 우선순위

| 순서 | 작업 | 파일 | 난이도 |
|---|---|---|---|
| 1 | 타입 추가 | `src/types/relationship.ts` | ⭐ |
| 2 | 스토어 신규 생성 | `src/store/useSelfTimeStore.ts` | ⭐⭐ |
| 3 | 체크인 UI 신규 | `src/features/selfcare/SelfTimeCheckIn.tsx` | ⭐⭐⭐ |
| 4 | 분석 훅 확장 | `src/features/analysis/useSelfHealthData.ts` | ⭐⭐ |
| 5 | 대시보드 통합 | `src/features/analysis/SelfHealthReport.tsx` | ⭐⭐⭐ |
| 6 | 네비게이션 연결 | `App.tsx` | ⭐ |

---

## 7. 작업 시작 전 결정 사항 (Decision Required)

### Q1. 진입점 위치
자기시간 체크인을 어디서 시작하게 할까요?
- **(A)** 메인 FAB 버튼 (타인 체크인과 동등한 위치)
- **(B)** SelfHealthReport 대시보드 내 버튼
- **(C)** 별도 탭 추가

### Q2. 스토어 저장 방식
- **(A)** 새 `useSelfTimeStore.ts` 독립 생성 ← 권장
- **(B)** 기존 `useRelationshipStore.ts`에 필드 추가

### Q3. 추천 태스크 UX
카테고리 선택 후 추천 태스크를 보여줄 때:
- **(A)** 미리 정의된 리스트에서 선택 (빠름)
- **(B)** 직접 입력 + 이전 기록에서 자동완성
- **(C)** 혼합 (리스트 + 직접 입력 모두 가능) ← 권장

### Q4. 에너지 대차대조표 시각화 우선도
- 이번 작업에서 대시보드까지 한 번에 할까요?
- 아니면 체크인 기능 먼저, 분석은 다음 단계로 나눌까요?

## 📝 [Pending Task] 시각적 넛지(Visual Nudge) 시나리오 반영
- 지능형 처방 시스템 대신, `docs/META_COGNITIVE_FEEDBACK_DESIGN.md` 파일에 '누적 에너지 대차대조표 기반 기후(Climate) 넛지' 4가지 케이스(만성 적자, 과부하, 정체, 코어 안정)를 설계 원칙으로 문서화하고 구현할 것.
