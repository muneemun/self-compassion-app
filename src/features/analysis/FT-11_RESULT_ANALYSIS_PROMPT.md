# FT-11 집중 조율 결과(Ranking Center) 디자인 프롬프트

이 문서는 AI가 조율 결과를 생성하거나 UI를 렌더링할 때 참고해야 할 시각적 및 언어적 가이드라인을 정의합니다. 본 화면은 '누가 이겼는가(순위)'를 시각적으로 압도적으로 표현하는 데 집중합니다.

---

## 1. 시각적 무드 (Visual Mood)
*   **핵심 키워드**: 우승, 확정, 포디움, 영광스러움.
*   **배경**: 부드러운 화이트 배경(#F8F9F8) 위에 강조 컬러(Gold #D4AF37) 사용.
*   **아이콘**: 왕관(Crown), 트로피(Trophy), 메달(Medal) 등 승리를 상징하는 심볼 적극 활용.
*   **애니메이션**: 우승자 카드가 중앙으로 크게 확대되며 떠오르는 효과.

---

## 2. 화면 구성 요소 (Components)

### 2.1 포디움 헤드라인 (The Winner Celebration)
- **UI**: 상단 중앙에 황금빛 왕관 아이콘과 "최종 조율 순위" 타이틀.
- **프롬프트**: "조율의 주인공을 축하하는 축제 분위기를 조성하라. 하지만 가볍지 않고 심리적인 무게감이 느껴지는 고급스러운 연출을 하라."

### 2.2 우승자 메인 카드 (Rank 1st Hero Card)
- **UI**: 거대한 아바타, 입체적인 그림자가 적용된 카드, "1st" 뱃지.
- **프롬프트**: "1위 인물을 화면의 60% 이상 차지하도록 배치하여 가장 강력한 인식적 우선순위를 부여하라."
- **액션**: 1위에게 즉시 연락할 수 있는 메인 액션 버튼(Primary Button) 배치.

### 2.3 상위 랭커 그리드 (Top 2-3 Grid)
- **UI**: 2위와 3위를 나란히 배치하여 우승자와의 관계적 위계를 시각화.
- **프롬프트**: "비록 우승은 못 했으나 당신의 마음에서 높은 비중을 차지하는 중요한 인물임을 명시하라."

---

## 3. 언어 가이드 (Copywriting)

*   **톤앤매너**: 확신에 찬, 축하하는, 직관적인 서비스 가이드.
*   **구조**: [순위 확정 알림] -> [우승자의 가치 조명] -> [관계 확정 버튼]

---

## 4. UX 흐름 (Flow Transition)
- [조율 완료] -> [포디움 연출과 함께 우승자 등장] -> [상위 랭커 리스트 확인] -> [확정 버튼 시 MT-13 메인 복귀]

---

## 5. 🛠️ AI Stitch Master Prompt (복사하여 사용)

아래 프롬프트 블록은 AI 디자인 도구(Stitch 등)에서 이 화면을 생성하거나 수정할 때 최적의 결과를 얻기 위해 작성되었습니다.

> **Prompt Context**: Antigravity App - FT-11 Relationship Tournament Result Screen
> 
> **Screen Requirement**:
> - **Layout**: Modern Podium-style vertical layout. Top focus on the winner.
> - **Visual Hierarchy**: 
>   1. **The Hero (1st Place)**: Large gold-accented card featuring a 120px avatar with a glowing 'Hologram' crown border. Display name, role, and a "1st" gold badge. Include a personalized affirmation quote.
>   2. **The Podium Base (2nd & 3rd)**: A 2-column grid below the Hero, showing runners-up in slightly smaller cards with Silver/Bronze badges.
>   3. **The Insight (Why)**: A clean summary box at the bottom explaining the 'Selection Pattern' (e.g., Stability vs. Growth) in a poetic yet analytical tone.
> - **Styling**:
>   - **Background**: Soft off-white (#F8F9F8) or deep sage-green (#4A5D4E) depending on context.
>   - **Typography**: Heavy weight Nav-title "최종 조율 순위". Use serif for quotes for a premium feel.
>   - **Elements**: 3D-style Crown icons, subtle gradient shadows (y:20, blur:30, op:0.15) on the main card.
>   - **Animation Cues**: Floating effect for cards, smooth scale-up on entry.
> - **Key Button**: A high-contrast "Primary Action" button at the very bottom labeled "이 우선순위로 확정하기".
