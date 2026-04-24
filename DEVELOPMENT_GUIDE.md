# Development Guide (프로젝트 개발 지침서)

> **문서 목적:** 외부 개발자가 이 프로젝트를 처음 맡았을 때 즉각적으로 지켜야 할 코딩 규칙, 폴더 구조, 데이터 보안 정책을 명시합니다. 특히 향후 SaaS 전환을 고려한 설계 원칙을 준수해야 합니다.

---

## 1. Project Overview (프로젝트 개요)
본 프로젝트는 개인의 인간관계 밀도와 정서적 에너지를 시각화하여 스스로 관계의 거리를 조절하고 자기 회복(Self-Care)을 돕는 앱입니다.
* **현재 (Phase 1):** 회원가입 없이 로컬 기기에만 데이터를 저장하는 오프라인 기반(Offline-First) MVP.
* **확장 (Phase 2):** 무료/유료 등급에 따른 기능 개방 (Freemium).
* **최종 (Phase 3):** 클라우드 기반 계정 관리와 유료 구독을 연동하는 SaaS 플랫폼.

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

## 5. Data & Security Policy (데이터 및 보안 정책)
향후 원활한 SaaS 전환을 위해 로컬 데이터 설계 시 다음 원칙을 반드시 지켜야 합니다.
* **UUIDv4 원칙:** 모든 Primary Key는 순차적 숫자가 아닌 고유 식별자(UUID)를 사용합니다.
* **무결성 유지:** 모든 엔티티에는 `createdAt`, `updatedAt`, `isDeleted` (Soft Delete) 필드를 강제합니다.
* **Feature Toggling (접근 권한 보안):** 
  v1.0, v1.1 등 버전 및 Basic/Silver/Gold 티어에 따른 무료 단계별 권한 기능은 `docs/feature-access-policy.md`에 명시되어 있습니다. 개발 시 컴포넌트나 화면 단위에서 `useFeatureAccess`와 같은 인증 래퍼를 거치도록 설계하여 프리미엄 기능 무단 접근을 방지해야 합니다.
