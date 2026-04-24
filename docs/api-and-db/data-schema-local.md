# Data Schema & Continuity Strategy (Local to Cloud)

> **Document Status:** Active
> **Last Updated:** 2026-04-24
> **Objective:** 로컬 DB에서 Cloud로의 이관 준비 및 **버전 업데이트 간 데이터 연속성(Data Continuity)** 보장.

---

## 🔗 Data Continuity Rules (데이터 연속성 보장 원칙)

**"v1.0에서 진단받은 기록이 v1.1로 업데이트했을 때 절대 사라져서는 안 되며, 새로 추가된 Analysis 기능에 자동으로 반영되어야 합니다."**

이를 위해 모든 로컬 DB 모델은 다음 원칙을 따릅니다.
1.  **Schema Versioning:** 로컬 스토어에 `schemaVersion` 상태를 유지하여, 앱이 업데이트될 때마다 마이그레이션 스크립트를 우선 실행합니다 (예: 누락된 필드에 기본값 추가).
2.  **App Version Tracking:** 모든 기록(레코드)은 생성될 당시의 `appVersion` 정보를 포함하여, 추후 데이터 정합성 문제 발생 시 디버깅 기준으로 삼습니다.
3.  **Forward Compatibility (상위 호환성):** v1.0의 레코드가 v1.1의 Analysis 연산 로직에 들어갔을 때 에러가 나지 않도록 Optional(`?`) 필드 처리 또는 널 병합(`??`) 연산자를 엄격히 사용합니다.

---

## 🗄️ Core Entities & Schema 명세서

모든 레코드는 **UUIDv4**, **Audit Trails (`createdAt`, `updatedAt`)**, **Soft Delete (`isDeleted`)** 필드를 필수로 포함합니다.

### 1. User Profile (최상위 계정 설정)
```typescript
interface UserData {
  id: string;             // UUID (PK)
  deviceId: string;       // 로컬 식별자
  tier: 'BASIC'|'SILVER'|'GOLD'; 
  schemaVersion: number;  // 데이터 마이그레이션 판별용 버전 (e.g., 1)
  createdAt: string;      
  updatedAt: string;
}
```

### 2. Diagnosis Result (진단 결과 스냅샷 - v1.0부터 존재)
**데이터 연속성 핵심:** v1.0에서 생성된 이 데이터가 v1.1의 Analysis 차트 생성의 원천 데이터가 됩니다.
```typescript
interface DiagnosisSnapshot {
  id: string;             // UUID
  relationshipId: string; // 연결된 인맥 UUID
  diagnosisType: 'ZONE' | 'RQS';
  resultData: object;     // JSON (v1.1 분석에서 읽어들일 수 있도록 구조 유지)
  appVersion: string;     // 생성 당시 앱 버전 (예: "1.0.0")
  createdAt: string;
}
```

### 3. Interaction Log (관계 기록 - v1.1 추가)
```typescript
interface InteractionLog {
  id: string;             // UUID
  relationshipId: string; 
  title: string;
  temperatureDelta: number; // 분석 엔진에 의해 맵의 온도 및 차트에 반영됨
  appVersion: string;     // e.g., "1.1.0"
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4. Self-Time Entry (자가 회복 기록 - v1.1 추가)
```typescript
interface SelfTimeEntry {
  id: string;             
  category: 'SOMATIC'|'WRITING'|'CREATIVE'|'SENSORY'|'MINDFULNESS';
  durationMinutes: number;
  intentionScore: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```
