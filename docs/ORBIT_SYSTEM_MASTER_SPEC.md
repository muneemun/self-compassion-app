# 🪐 Orbit System Master Specification (v1.1)

이 문서는 Social Orbit(관계 궤도)의 메타인지 시각화의 핵심인 **'정서 기상 시스템(Emotional Atmosphere System)'**의 디자인 철학, 컬러 스펙, 렌더링 기술 지침을 집대성한 마스터 명세서입니다.

## 1. 정서 기상 시스템 (Emotional Weather)의 철학
* **메타포:** 내 마음의 상태가 우주의 기후(색상과 빛)로 발현됩니다. 사용자는 단순히 텍스트를 읽는 것이 아니라, 앱의 전체적인 화면 톤(Tone & Manner)을 통해 즉각적이고 직관적으로 자신의 현재 정서 상태를 '체감'합니다.
* **디자인 원칙 (Hybrid Pastel Sky):** 원색의 쨍함과 어두운 배경의 답답함을 지워내고, 채도를 덜어낸 고급스러운 파스텔과 차콜 톤을 결합하여 심리적 안정감과 몰입감을 극대화합니다.

## 2. 7단계 정서 기상 시스템 컬러 스펙

| 레벨 | 상태 (State) | 베이스 톤 | SVG 그라데이션 배열 (Top → Mid → Bottom) | 시각적 특징 |
| :--- | :--- | :--- | :--- | :--- |
| **L7** | **SUPERNOVA** | Crystal Blue | `['#F0F9FF', '#E0F2FE', '#BAE6FD']` | 정서적 초신성. 환희와 강력한 에너지 충전. |
| **L6** | **BREEZE** | Bright Sand | `['#FEFDFB', '#FAF8F5', '#F5EFE6']` | 산들바람. 관계적 안정을 되찾고 정화되는 회복 상태. |
| **L5** | **NORMAL** | Warm Sand | `['#FCF9F2', '#F2EEE3', '#E8E4D9']` | 평상시 (기준점). 포근하고 편안한 디폴트 상태. |
| **L4** | **SURGE** | Dark Taupe | `['#F0EBE1', '#E8E2D5', '#DED6C5']` | 에너지 급변. 감정선이 무거워지기 시작하는 징조. |
| **L3** | **DRAIN** | Cool Gray | `['#F3F4F6', '#E5E7EB', '#D1D5DB']` | 에너지 소진. 웜톤이 배제되고 이성적이고 차가운 상태. |
| **L2** | **MIST** | Mist Gray | `['#E5E7EB', '#D1D5DB', '#9CA3AF']` | 흐릿한 관계. 시야가 제한되고 답답한 상태. |
| **L1** | **STORM** | Storm Gray | `['#9CA3AF', '#6B7280', '#4B5563']` | 정서적 위기. 무거운 잿빛과 강한 시각적 노이즈 발생. |

## 3. 동적 렌더링 엔진 기술 사양 (Technical Spec)

본 애플리케이션의 지도 렌더링은 성능과 심미성을 동시에 충족시키기 위해 다음의 엄격한 기술 사양을 따릅니다.

### 3.1 단색 렌더링 금지 (SVG LinearGradient 필수)
단순 `backgroundColor` 속성을 이용한 평면적인 단색 렌더링은 공간감(Depth)을 심각하게 훼손하므로 금지됩니다. 반드시 `react-native-svg`의 `<LinearGradient>` 컴포넌트를 사용하여 3단계 색상(`gradientColors`)이 부드럽게 섞이는 깊이감 있는 우주 배경을 구현해야 합니다.

### 3.2 엣지 블러 마스크 동기화 (Dynamic Masking)
지도 화면의 상/하단 UI 레이어(Header, Tab Bar)와 지도가 자연스럽게 겹치도록 적용되는 페이드 마스크(Blur Mask)는 **절대로 특정 색상(예: `#FCF9F2`)으로 하드코딩해서는 안 됩니다.**
* **상단 마스크 (`topMask`):** `stopColor`를 `currentTheme.gradientColors[0]` (그라데이션 최상단 색상)과 실시간 연동해야 합니다.
* **하단 마스크 (`bottomMask`):** `stopColor`를 `currentTheme.gradientColors[2]` (그라데이션 최하단 색상)과 실시간 연동해야 합니다.

### 3.3 피드백 애니메이션 정책
* **Wave (동심원 파동):** 시인성 방해를 방지하기 위해 기본 기상 상태에서는 비활성화(`waveEnabled: false`)하며, 일시적인 사용자 인터랙션(Check-in) 발생 시에만 제한적으로 활용합니다.
* **Flash (암전 방지):** 상호작용 피드백 시 오버레이의 색상은 마운트 시점에 동결(`Freeze`)되어야 하며, 페이드아웃 중 색상이 검은색 등으로 튕기는 깜빡임(Flickering) 현상이 단 1ms도 발생하지 않아야 합니다.
