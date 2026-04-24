# Self-Compassion Relationship Tuning App

![App Preview](assets/preview.png) <!-- Update this with actual preview -->

## 🚀 Project Overview

**"내 마음을 갉아먹는 관계는 멀리, 나를 성장시키는 관계는 가까이"**

이 프로젝트는 개인의 인간관계 밀도와 정서적 에너지를 시각화하여, 스스로 관계의 거리를 조절하고 자기 회복(Self-Care) 에너지를 관리할 수 있도록 돕는 디지털 테라피/코칭 애플리케이션입니다. 

---

## 👨‍💻 Guidelines for External Developers (외부 개발자 가이드)

본 프로젝트는 현재 로컬(Offline-First) 환경 기반으로 동작하지만, 향후 **SaaS 플랫폼 전환 및 멀티 디바이스 동기화(Phase 3)**를 전제로 아키텍처가 설계되어 있습니다. 코드를 파악하거나 기능을 추가할 때 다음 사항을 반드시 준수해 주십시오.

### 1. Data Schema & Identifiers (데이터 구조)
* **UUID Mandatory:** 모든 엔티티(User, RelationshipNode, Log 등)의 Primary Key는 Auto-increment가 아닌 **UUIDv4**를 사용합니다. (디바이스 간 충돌 방지)
* **Audit Trails:** 모든 레코드에는 `createdAt`, `updatedAt` 필드가 포함되며, 삭제 시 `isDeleted: true` (Soft Delete) 플래그를 사용합니다.

### 2. Feature-based Modularization (기능 단위 모듈화)
* 프로젝트 폴더 구조는 **관심사 분리(Separation of Concerns)** 원칙을 따릅니다.
* `/src/core`: 앱의 변하지 않는 핵심 로직 (상태 관리, 타입, 테마).
* `/src/features`: 버전별로 추가/확장되는 개별 도메인 (onboarding, diagnosis, map, analysis 등).
* **규칙:** 새로운 기능(예: v1.1 Map 업데이트)을 추가할 때 기존 코드(예: v1.0 Onboarding)에 의존성을 발생시키거나 기존 UI를 침범해서는 안 됩니다. 모든 기능은 독립적인 모듈로 작동해야 합니다.

### 3. Feature Toggles & SaaS Routing
* 무료/유료(Tier) 권한 및 앱 버전(App Version)에 따라 기능이 차등 노출되도록 `useFeatureAccess`와 같은 제어 훅(Hook) 래퍼를 사용합니다.
* 자세한 정책 및 문서는 `/docs` 디렉터리를 참고하세요.

---

## 📁 Directory Structure (프로젝트 구조)

```
/src
  ├── core/          # 전역 상태(Store), 공통 타입, 테마, 글로벌 레이아웃
  ├── data/          # 로컬 DB (Zustand Persist/SQLite) 처리 및 로컬 백업 로직
  └── features/      # 비즈니스 도메인별 독립 모듈
      ├── onboarding/
      ├── map/
      ├── analysis/
      └── selfcare/

/docs
  ├── spec/          # 기능 명세서 및 릴리즈 로드맵
  ├── api-and-db/    # 데이터베이스 스키마 및 마이그레이션 전략
  └── scripts/       # (향후) 데이터 전환 스크립트 도구
```

## 🛠 Tech Stack

- **Framework:** React Native (Expo)
- **State Management:** Zustand (with Persist Middleware)
- **Styling:** Native StyleSheet / lucide-react-native
- **Animation:** React Native Reanimated / SVG
