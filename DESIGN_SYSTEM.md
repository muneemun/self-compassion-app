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

