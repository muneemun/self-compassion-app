# Feature Access Policy (Version & Tier Matrix)

> **Document Status:** Active
> **Last Updated:** 2026-04-24
> **Objective:** 버전(Version) 및 등급(Tier)에 따른 기능 접근 권한(Feature Gating)과 **'Feature Toggle'** 제어 구조 정의.

---

## 🔐 Feature Toggle Architecture (기능 노출 제어 로직)
앱 실행 시 현재 버전을 체크하여, **해당 버전에 맞는 기능들만 화면에 노출**하는 동적 토글(Toggle) 구조를 도입합니다.
UI 컴포넌트는 권한 및 버전에 따라 숨김(Hidden) 처리되거나 결제 유도(Paywall) 화면으로 라우팅되어야 합니다.

```typescript
// Example Feature Toggle & Tier Access Wrapper
export const useFeatureAccess = () => {
  const currentAppVersion = getAppVersion(); // e.g., '1.1.0'
  const currentTier = useUserStore(state => state.tier); // 'BASIC', 'SILVER', 'GOLD'
  
  const isFeatureEnabled = (featureKey: string, requiredVersion: string) => {
    return compareVersions(currentAppVersion, requiredVersion) >= 0;
  };

  const hasTierAccess = (requiredTier: string) => {
    // Tier 검사 로직
  };

  return { isFeatureEnabled, hasTierAccess };
};
```

---

## 📊 Feature Release & Access Matrix

어떤 버전에서 배포되며, 최종 SaaS 단계에서 어느 등급에게 허용되는지를 정의합니다.

| Module (모듈) | Feature (세부 기능) | Release Version | Basic (Free) | Silver (Pro) | Gold (SaaS) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Onboarding** | 초기 설정 및 기본 진단 | **v1.0** | ✓ | ✓ | ✓ |
| **Diagnosis** | Zone Diagnosis (관계 거리 진단) | **v1.0** | ✓ | ✓ | ✓ |
| | RQS Diagnosis (질적 심층 진단) | **v1.1** | ❌ (Paywall) | ✓ | ✓ |
| **Map** | Orbit Map (관계 궤도 조회) | **v1.1** | ✓ | ✓ | ✓ |
| | Node Capacity (인맥 등록 제한) | **v1.1** | Max 10 | Max 30 | Unlimited |
| **Analysis** | Energy Radar & Balance | **v1.1** | ✓ | ✓ | ✓ |
| | Trend Analysis (트렌드 추이) | **v1.2** | ❌ | ✓ | ✓ |
| | AI Sentiment Insights (서버 AI 분석) | **v2.0** | ❌ | ❌ | ✓ |
| **Check-in** | Relationship Log (상호작용 기록) | **v1.1** | 5 / Day | Unlimited | Unlimited |
| | Self-Time Log (자가 회복 기록) | **v1.1** | 1 / Day | Unlimited | Unlimited |
| **Prescription** | SOS Rx Center (처방전 발급) | **v2.0** | 3 Templates | All Templates | Dynamic |
| **Data Mgmt** | Cloud Sync (서버 동기화) | **v2.0** | ❌ | ❌ | ✓ |
