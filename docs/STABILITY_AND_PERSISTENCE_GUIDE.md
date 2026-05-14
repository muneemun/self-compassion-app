# 시스템 안정성 및 데이터 영속성 가이드 (Stability & Persistence Guide)

이 문서는 Social Orbit 애플리케이션의 네이티브 환경(APK/iOS) 안정성과 데이터 무결성을 보장하기 위한 기술적 지침을 담고 있습니다.

## 1. 데이터 영속성 관리 (Data Persistence)

### 지침
- 모든 글로벌 스토어(Zustand)는 `persist` 미들웨어를 사용하여 `AsyncStorage`에 영속화되어야 합니다.
- **주의**: 영속성 설정이 누락될 경우 앱 재시작 시 모든 사용 데이터가 초기화됩니다.

### 구현 예시 (`src/store/useRelationshipStore.ts`)
```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create()(
  persist(
    (set) => ({ ... }),
    {
      name: 'storage-name',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## 2. 네이티브 부팅 안전장치 (Hydration Safety)

### 지침
- 앱 부팅 시 저장소에서 데이터를 불러오는 과정(Hydration)이 완료될 때까지 메인 UI 렌더링을 지연시켜야 합니다.
- 하이드레이션 지연으로 인한 '무한 대기'를 방지하기 위해 반드시 **3초 세이프티 타임아웃**을 설정해야 합니다.

### 구현 예시 (`App.tsx`)
```typescript
const [isInitialized, setIsInitialized] = useState(false);

useEffect(() => {
  const safetyTimeout = setTimeout(() => {
    if (!isInitialized) setIsInitialized(true); // 강제 진입
  }, 3000);

  const interval = setInterval(() => {
    if (useStore.persist?.hasHydrated()) {
      setIsInitialized(true);
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    }
  }, 100);
}, []);
```

---

## 3. 애니메이션 라이브러리 충돌 방지 (Animation Conflict)

### 위험 요소
- 표준 `Animated` API와 `react-native-reanimated`의 `Easing` 함수를 혼용하면 네이티브 환경에서 즉시 앱이 종료(Crash)됩니다.

### 지침
- **표준 Animated (`RNAnimated`) 사용 시**: `react-native`의 `Easing`을 사용하십시오. (예: `import { Easing as RNEasing } from 'react-native'`)
- **Reanimated (`withTiming` 등) 사용 시**: `react-native-reanimated`의 `Easing`을 사용하십시오.

---

## 4. 데이터 방어 로직 (Null-Safety)

### 지침
- 텍스트 데이터(특히 이름 등)를 처리할 때 데이터 로딩 전후의 `undefined` 상태를 반드시 고려해야 합니다.
- 특히 `.charAt(0)`과 같은 문자열 메서드 호출 시 반드시 `(name || '?').charAt(0)` 패턴을 사용하여 런타임 에러를 방지하십시오.

---

## 5. 안정화 마일스톤 및 시각화 표준 (Milestones & Visualization)

프로토타입 수준의 UI를 상용 수준으로 고도화하기 위해 다음 마일스톤을 준수하여 개발되었습니다.

### **[Milestone A] 데이터 일관성 및 레이어 분리**
- **타임라인 일관성**: 모든 상호작용 기록이 시간순으로 정렬되도록 보장.
- **상태 분리**: 모달 및 팝업 레이어가 메인 UI의 제스처와 충돌하지 않도록 독립적 상태 관리 적용.
- **Empty States**: 데이터가 없는 초기 상태에서도 사용자가 고립감을 느끼지 않도록 '---' 마스킹 및 가이드 문구 제공.

### **[Milestone B] 고정밀 정서 데이터 시각화**
- **베지어 트렌드 그래프**: 단순 꺾은선이 아닌 고정밀 Bezier Curve를 사용하여 정서 에너지의 부드러운 흐름 시각화.
- **3-Tier 지형도**: 만족도와 에너지 소모를 축으로 하는 정서적 관계 지형도(Social Topography) 도입.
- **일관된 범례**: Zone별 색상과 캐릭터 아이콘의 전역적 일관성 확보.

### **[Milestone C] 데이터 위생 처리 레이어 (Sanitization)**
- **정밀 데이터 보정**: 소수점 처리 방식 통일 및 `NaN` 값에 대한 자동 대체 로직(`fallback to 50%`) 구축.
- **시스템 폴리싱**: 폰트 가독성, 아이콘 누락, 레이아웃 깨짐 현상을 전면 수정하여 완성도 확보.

---

## 6. 복구 전략 및 장애 대응
- 시스템 전체 롤백 시 미커밋 변경 사항이 유실될 수 있으므로, 중요한 안정화 코드는 즉시 커밋하거나 이 문서에 기록하여 복구 가능하도록 관리합니다.
