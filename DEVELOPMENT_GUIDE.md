# Development Guide (프로젝트 개발 지침서)

> **문서 목적:** 외부 개발자가 이 프로젝트를 처음 맡았을 때 즉각적으로 지켜야 할 코딩 규칙, 폴더 구조, 데이터 보안 정책을 명시합니다. 특히 향후 SaaS 전환을 고려한 설계 원칙을 준수해야 합니다.

---

## 1. Project Overview (프로젝트 개요)
본 프로젝트는 개인의 인간관계 밀도와 정서적 에너지를 시각화하여 스스로 관계의 거리를 조절하고 자기 회복(Self-Care)을 돕는 앱입니다.
* **현재 (Phase 1):** 회원가입 없이 로컬 기기에만 데이터를 저장하는 오프라인 기반(Offline-First) MVP.
* **확장 (Phase 2):** 무료/유료 등급에 따른 기능 개방 (Freemium).
* **최종 (Phase 3):** 클라우드 기반 계정 관리와 유료 구독을 연동하는 SaaS 플랫폼.

---

## 🛡️ Safe-Step Protocol (철칙: 개발 안정성 가이드)

프로젝트의 복잡도가 높아짐에 따라 런타임 에러와 구문 오류를 원천 차단하기 위해 아래 지침을 반드시 준수한다.

### 1. 방어적 프로그래밍 (Defensive Programming)
*   **Zero-Access Assumption**: 모든 외부 데이터(Store, Props 등)는 언제든 `undefined` 또는 `null`일 수 있다고 가정한다.
*   **Safe Access**: 배열 접근 시 기본값(`|| []`)을 지정하고, 객체 참조 시 옵셔널 체이닝(`?.`)을 필수적으로 사용한다.
    *   *Bad*: `data.filter(...)`
    *   *Good*: `(data || []).filter(...)`

### 2. 원자적 구현 (Atomic Implementation)
*   **Single-Hook Edit**: 한 번의 수정 시 오직 하나의 훅(`useMemo`, `useEffect` 등) 또는 하나의 논리적 단위만 추가/수정한다.
*   **Hook Integrity**: 훅을 중첩하거나(Nested Hooks), 조건문 내에서 호출하는 등 리액트의 기본 규칙을 절대 위반하지 않는다.

### 3. 수정 후 즉시 검증 (Post-Edit Audit)
*   코드를 수정한 직후에는 반드시 `view_file` 등을 통해 수정된 영역의 괄호(`{}`, `()`) 닫힘 상태와 구문의 무결성을 육안으로 재검증한다.

### 4. 로직의 분리 (Logic Decoupling)
*   컴포넌트 내에 10라인 이상의 복잡한 계산 로직이나 분석 엔진이 들어갈 경우, 반드시 별도의 유틸리티 함수나 커스텀 훅으로 분리하여 가독성을 확보한다.

---

## 2. Tech Stack (기술 스택)
* **Framework:** React Native (Expo)
* **Language:** TypeScript
* **State Management:** Zustand (with Persist Middleware)
* **Local Database:** AsyncStorage / SQLite (오프라인 상태 유지)
* **Styling / Icons:** StyleSheet, lucide-react-native
* **Animation:** React Native Reanimated, react-native-svg

---

## 3. Naming Convention (명명 규칙)
일관된 프로젝트 관리를 위해 다음 명명 규칙을 엄격히 준수합니다.
* **파일/폴더명 (Files & Folders):** 
  * 컴포넌트(`*.tsx`): PascalCase (예: `SelfTimeCheckInModal.tsx`)
  * 유틸/훅(`*.ts`): camelCase (예: `useSelfTimeStore.ts`)
  * 문서 및 에셋: kebab-case 또는 snake_case (예: `feature_matrix.csv`, `feature-access-policy.md`)
* **변수 및 함수 (Variables & Functions):** camelCase (예: `handleCheckIn`, `isFeatureEnabled`)
* **상수 및 타입 (Constants & Types):** UPPER_SNAKE_CASE 및 PascalCase (예: `MAX_RELATIONSHIP_LIMIT`, `interface SelfTimeEntry`)

---

## 4. Feature Modules (기능 모듈 분리)
관심사 분리(Separation of Concerns)를 위해 비즈니스 로직은 `src/features` 하위에 독립된 도메인으로 격리됩니다.
* `/src/core`: 앱의 변하지 않는 핵심 로직 (공통 UI, 타입, 테마).
* `/src/features/diagnosis`: 존(Zone) 및 질적 진단 로직.
* `/src/features/analysis`: 관계 튜닝, 밸런스 차트 등 분석 리포트.
* `/src/features/map`: 오빗 맵 렌더링.
* `/src/features/selfcare`: 나와의 시간(Self-Time) 기능.
> **규칙:** 하나의 도메인 모듈이 다른 도메인의 상태를 직접 훼손해서는 안 됩니다. (예: `map` 개발 시 `onboarding` 로직 건드리기 금지).

---

## 6. Data Architecture Policy (데이터 산출 및 기록 원칙)
SaaS 플랫폼의 신뢰할 수 있는 데이터 분석을 위해, 인맥 데이터 기록 시 다음 원칙을 엄격히 준수합니다.
* **상호작용(Interactions):** 사용자가 직접 입력한 '만족도', '에너지 소모량' 등 정서적 가치가 포함된 기록입니다. 튜닝 대시보드 및 에너지 통계의 유일한 산출 근거가 됩니다.
* **시스템 로그(System Logs):** '신규 추가', 'ZONE 이동', 'RQS 진단 완료' 등 시스템에 의해 생성된 기록입니다. 이는 타임라인에는 표시되지만, 에너지 통계나 차트 데이터 산출에서는 반드시 **제외**되어야 합니다.
* **품질 지표(Quality Metrics):** RQS 진단 등을 통해 얻은 '정서적 온도', '안정성' 등 인맥의 현재 상태를 나타내는 질적 데이터입니다.
* **통계 산출 규칙:** 차트나 대시보드 구현 시 반드시 `r.interactions` 필드만 필터링하여 유령 데이터(만족도/소모량 0점)가 통계에 포함되지 않도록 주의해야 합니다.
