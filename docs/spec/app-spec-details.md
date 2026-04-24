# App Module Specification & Dependencies

> **Document Status:** Active
> **Last Updated:** 2026-04-24
> **Objective:** 외부 개발자 인수인계 및 장기 유지보수를 위한 **모듈화(Modularization)** 원칙과 각 도메인별 의존성(Dependency) 정의.

---

## 🧩 The "Modularization" Principle (모듈화 대원칙)

**"모든 기능은 완전히 독립적인 모듈로 설계되어야 합니다."**

기능의 추가(v1.1의 Map이나 Analysis 등)가 기존 코드(v1.0의 Onboarding 등)에 어떠한 사이드 이펙트(Side Effect)도 일으키지 않아야 합니다. 외부 개발자가 프로젝트에 투입되었을 때 코드가 스파게티처럼 얽혀있지 않도록, 기능별로 폴더 구조와 관심사(Concern)를 명확히 분리합니다.

*   **독립적 상태 관리:** Onboarding 모듈은 Map 모듈의 상태를 직접 수정하지 않습니다. 모든 통신은 전역 Store(Zustand)의 명확히 정의된 액션(Action)을 통해서만 이루어집니다.
*   **Lazy Loading / Feature Toggling:** 미개방 기능 모듈은 Entry Router에서 아예 렌더링되지 않도록 격리됩니다.

---

## 📦 Module Dependency Architecture (모듈 의존성 구조)

각 모듈이 어느 파일에 위치하며, 다른 어떤 모듈에 의존하는지 명세합니다.

### 1. `features/onboarding` (초기 설정 및 진입)
*   **역할:** 사용자 최초 실행 시 기본 설정 진행 및 첫 진단(Diagnosis) 유도.
*   **의존성 (Dependencies):** 
    *   **의존함:** `store/useAppStore` (온보딩 완료 상태 저장용)
    *   **영향을 받지 않음:** `map`, `analysis`, `prescription` 모듈이 업데이트되어도 Onboarding 코드는 절대 수정할 필요가 없습니다 (Zero Dependency on future modules).

### 2. `features/diagnosis` (진단 시스템)
*   **역할:** Zone / RQS 기반 인맥 진단 수행 후 결과값(Snapshot) 반환.
*   **의존성 (Dependencies):**
    *   **의존함:** `types/relationship` (진단 인터페이스)
    *   **독립성:** UI 모달 형태로 작동하며, 부모 컴포넌트에게 `onComplete(result)` 콜백만을 전달합니다. DB 저장은 모듈 외부(Store)에서 처리하여 순수성을 유지합니다.

### 3. `features/map` (오빗 맵 시각화 - v1.1)
*   **역할:** 로컬 데이터를 기반으로 궤도 렌더링 및 인터랙션 처리.
*   **의존성 (Dependencies):**
    *   **의존함:** `store/useRelationshipStore` (읽기 전용 데이터 구독).
    *   **독립성:** Map 컴포넌트 내부에 데이터 변환(Business Logic) 로직을 넣지 않고, Store에서 정제된 `RelationshipNode` 타입 데이터만을 받아 렌더링(View)하는 데 집중합니다.

### 4. `features/analysis` (분석 리포트 및 대차대조표 - v1.1)
*   **역할:** Interaction Log와 Self-Time Entry를 읽어와 차트 렌더링.
*   **의존성 (Dependencies):**
    *   **의존함:** `features/selfcare` (자가 회복 데이터), `features/relationships` (상호작용 데이터).
    *   **구조적 특징:** Analysis 모듈 전용 Hook(`useSelfHealthData.ts`)을 중간 계층(Adapter)으로 두어, 원본 데이터 스키마가 변경되더라도 UI 컴포넌트는 수정하지 않도록 방어선(Defensive Layer)을 구축합니다.

### 5. `features/selfcare` (나와의 시간 통합 관리 - v1.1)
*   **역할:** 자가 회복 기록에 대한 UI 및 로직.
*   **의존성 (Dependencies):**
    *   **의존함:** `store/useSelfTimeStore`.
    *   **독립성:** Global Modal로 설계하여, Map이나 Analysis 어디서 호출하든 단일 컴포넌트(`SelfTimeCheckInModal`)를 재사용합니다.

---

### 🚀 개발자 인수인계 노트 (Handover Note)
> **To Future Developer:** 
> 이 앱은 철저한 **모듈 격리(Module Isolation)** 규칙을 따르고 있습니다. 특정 화면에 기능(예: 버튼)을 추가할 때 기존 도메인의 코드를 직접 훼손하지 마시고, 가급적 **Composition(조합)**이나 **새로운 Feature 폴더**를 생성하여 플러그인(Plug-in)처럼 붙이는 방식으로 아키텍처를 유지해 주시기 바랍니다.
