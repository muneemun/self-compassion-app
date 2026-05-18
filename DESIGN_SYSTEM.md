# 관계궤도 (Social Orbit) Design System & UI Rules

이 문서는 앱 전반의 일관된 사용자 경험(UX)과 시각적 완성도(UI)를 유지하기 위한 핵심 기술 규칙을 정의합니다. 모든 새로운 화면 개발 시 이 규칙을 최우선으로 적용합니다.

## 1. Safe Area & Layout Header
- **SafeAreaProvider**: 모든 화면의 최상위(`App.tsx`)에 배치되어야 합니다.
- **Fixed Header Slot**: 헤더는 반드시 `HubLayout`의 `header` prop을 통해 공급하며, 스크롤 영역(`children`)과 분리하여 상단에 고정합니다.
- **Header Height**: 모든 헤더의 높이는 **64px**로 고정합니다.
- **Horizontal Padding**: 화면의 좌우 여백은 항상 **20px**을 유지하여 모든 요소의 시작점과 끝점을 일치시킵니다.

## 2. Action Buttons (Standardization)
- **Container Size**: 모든 상단 버튼(추가, 검색, 메뉴 등)은 **44x44px** 크기를 가집니다.
- **Border Radius**: 상단 버튼의 곡률은 **22px** (완전한 원형)로 고정합니다.
- **Icon Size**: 버튼 내부의 아이콘 크기는 **24px**로 통일합니다.
- **Visual Styles**:
    - **Primary Action (+ 등)**: `colors.primary` 배경색 + `white` 아이콘 + Shadow(y:4, opacity:0.1).
    - **Secondary Action (Search, Menu 등)**: `rgba(255,255,255,0.6)` 배경 + `colors.primary` 아이콘 + Border(1px, 5% opacity).

## 3. Typography & Harmony
- **Title Alignment**: 페이지 타이틀은 좌우 패딩 20px 라인에 맞춰 정렬합니다.
- **Component Gap**: 헤더 우측 버튼들 사이의 간격(`gap`)은 **10px**로 고정합니다.

## 4. Navigation & System UI
- **StatusBar**: `translucent` 옵션을 켜고 배경색을 `transparent`로 설정하여 헤더 컬러가 상태 표시줄까지 자연스럽게 이어지도록 합니다.
- **Bottom Navigation**: `SafeAreaView`의 `edges={['bottom']}`을 사용하여 시스템 홈 인디케이터와 겹치지 않도록 조절합니다.

---

## 5. Screen Specific Rules: FT-11 Ranking Center (Tournament Result)
- **Concept**: 포디움(Podium) 스타일의 위계 중심 레이아웃.
- **Top Winner (1st)**: 
    - 아바타 크기 **120px**, 골드 컬러(#D4AF37)의 홀로그램 테두리 적용.
    - 화면 중앙에 가장 큰 카드 형태로 배치하여 시각적 압도감 선사.
- **Sub Winners (2nd, 3rd)**: 
    - 1:1 비율의 카드 그리드로 배치하여 1위와의 위계 차이를 명확히 함.
- **Visual Anchor**: 상단에 **Crown 아이콘**을 배치하여 '관계의 주인공'이라는 테마를 강조.
- **Action Priority**: 우승자 카드 내부에 즉시 교감할 수 있는 **메인 액션 버튼** 배치.

---

## 6. Card Components (Premium Flat)
- **Concept**: 불필요한 장식을 배제하고 선과 면의 대비를 강조한 '절제된 미학'.
- **Background**: 기본적으로 순백색(`THEME.white`)을 사용하여 깔끔한 인상을 전달함.
- **Outline & Border**: 
    - 일반 상태: 1px 두께의 투명한 보더(`rgba(74, 93, 78, 0.08)`).
    - 선택/강조 상태: **2px** 두께의 솔리드 보더(`colors.primary`).
- **Shadow-Free Principle**: 카드 내부나 외부의 그림자(`Shadow`), 블러(`Blur`) 효과를 지양하여 렌더링 부하를 줄이고 시각적 노이즈를 최소화함.
- **Interactive Feedback**: 선택 시 입체적인 변화(Scale, Shadow) 대신, 색상의 반전이나 명확한 테두리 변화를 통해 피드백을 전달함.

---

## 7. Atmosphere Rendering Rules (정서 기상 배경 렌더링 규칙)

궤도 지도(Orbit Map)의 배경은 사용자의 정서 상태를 직관적으로 전달하는 **7단계 정서 기상 시스템(Emotional Atmosphere System)**에 의해 동적으로 결정됩니다.

> 📋 **상세 스펙**: [`docs/ORBIT_SYSTEM_MASTER_SPEC.md`](docs/ORBIT_SYSTEM_MASTER_SPEC.md) 참조

### 7.1 배경 렌더링 원칙
- **단색(`backgroundColor`) 배경 사용 금지**: 궤도 지도의 배경은 반드시 `react-native-svg`의 `<LinearGradient>`를 사용한 **3단계 수직 그라데이션**으로 렌더링해야 합니다. 단색은 공간감(Depth)을 훼손합니다.
- **색상 소스**: 각 기상 레벨의 그라데이션 색상은 `useOrbitAtmosphere.ts`의 `ATMOSPHERE_THEMES` 객체에서 `gradientColors: [top, mid, bottom]` 배열로 관리됩니다.

### 7.2 엣지 마스크 동기화 원칙
- 지도 상/하단의 블러 마스크(Fade Mask)는 **특정 색상 값을 하드코딩하지 않습니다.**
- 상단 마스크: `currentTheme.gradientColors[0]` (최상단 색상)과 실시간 연동.
- 하단 마스크: `currentTheme.gradientColors[2]` (최하단 색상)과 실시간 연동.

### 7.3 기상 전환 애니메이션
- 기상 전환 시 `interpolateColor`를 사용한 부드러운 색상 보간(Interpolation) 적용.
- 기본 전환 시간: `1200ms` (NORMAL 기준), 위기 상태: `800ms` (빠른 경고 반응).


---

## 8. Premium Micro-Feedback Rules (마이크로 인터랙션 피드백 규칙)

인맥 체크인 및 자기 돌봄 활동 완료 직후 화면에 나타나는 피드백 UI는 단순 메시지가 아닌, 명상적 감성을 정밀하게 가공한 프리미엄 마이크로 컴포넌트로 구현해야 합니다.

### 8.1 샌드-리넨 유리모프 캡슐 (Frosted Linen-Sand Pill)
- **캡슐화 원칙:** 투박한 전체 카드 오버레이를 전면 폐기하고, 상단 여백(`top: 160`)에 띄우는 완전한 알약 형태(Pill Shape, 곡률 `24px`)로 설계합니다.
- **재질(Material):**
  - **양수 감정 (충전/회복):** 포근한 크림 아이보리 반투명 배경 (`rgba(255, 255, 255, 0.92)`).
  - **음수 감정 (소진/위기):** 차분한 흙빛 토프 베이지 반투명 배경 (`rgba(232, 226, 213, 0.90)`).
  - **백드롭 블러:** `BlurView` 강도 12 필터를 활용해 궤도 배경 위에 은은하게 떠오르는 감성 필름 텍스처를 묘사합니다.
- **초정밀 헤어라인:** 두께 `0.8px` 실선 테두리를 매칭하며, 페르소나 테마 컬러의 투명도 `12%`를 border 컬러로 삼아 은은한 광채를 구현합니다.
- **고가독성 텍스트 매칭:** 소진(Drain) 등 어두운 흙빛 배경 시에는 텍스트를 차가운 회색 대신 고대비가 방어되는 묵직한 밤나무 숯색(`#37474F`)으로 매칭하여 완벽한 시인성을 유지합니다.

### 8.2 명상적 슬로우 스프링 (Slow Spring Motion)
- **하드웨어 가속 강제:** 애니메이션은 반드시 Reanimated `useSharedValue` 및 `useAnimatedStyle`을 사용하여 GPU 단독 연산(UI Thread)으로 기동해야 합니다. CPU 부하 유발 요소를 100% 차단합니다.
- **물리 모션 계수:**
  - 상단 여백 너머 `translateY: -25`에서 `0`으로 바람에 나부끼는 잎새처럼 유연하고 느긋하게 스프링 감속하며 미끄러져 내립니다 (`withSpring(0, { damping: 18, stiffness: 70 })`).
  - 퇴장 시에는 역방향 `translateY: -25` 및 `opacity: 0`으로 부드럽게 상승 활공하며 페이드아웃(`withTiming(0, { duration: 400 })`)합니다.

### 8.3 상호작용 독립성
- **상태 알약(Status Pill) 고립:** 타이머 기동 시 하단 상태 알약창("1명의 관계가...")의 펼침/닫힘이 강제 간섭되는 비동기 레이스 컨디션을 금지하며, 오직 사용자의 수동 터치에 의해서만 알약이 움직이도록 독립성을 보장합니다.
- **충전 파동 정방향화:** 충전 발생 시 노란 파동은 오직 중앙에서 바깥으로 3줄 팽창(`scale: 0` ➡️ `scale: 4`)하는 순방향 흐름으로 통일하여 비주얼 기류를 일원화합니다.

