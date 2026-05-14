# 기획 및 정책 변경 이력 (Policy History)

> **Document Status:** Active
> **Objective:** 프로젝트 내 모든 기획/정책 문서(docs)의 수정 이력을 추적하여, 외부 업체와의 협업 시 "기획 의도"와 "변경 근거"를 명확히 남깁니다.

---

## 📝 정책 변경 기록 작성 규칙
어떤 기획/정책 문서든 수정이 발생하면, 반드시 아래 양식에 맞추어 히스토리를 최상단에 기록해야 합니다.

* **Date:** YYYY-MM-DD
* **Branch:** (예: `main`, `feature/analysis`)
* **Updated Document:** (수정된 문서명)
* **Changes:** (구체적인 수정 내용)
* **Reason / Intent:** (기획 의도 및 왜 정책이 변경되었는지)

---

## 📅 Version History

### [2026-04-26] 
* **Branch:** `feature/self-time`
* **Updated Document:** `src/docs/SELF_TIME_CHECKIN_PLAN.md`
* **Changes:** 
  * '나와의 시간(Self-Time)' 기록 시스템 최초 도입.
  * 외부 관계 중심의 앱 구조에서 '자기 돌봄'을 통한 정서 회복 축 추가.
* **Reason / Intent:** 관계의 소모를 해결하기 위해서는 타인과의 조율뿐만 아니라 스스로의 에너지를 충전하는 과정이 필수적이라는 '정서적 자생력' 개념 반영.

### [2026-04-28] 
* **Branch:** `main`
* **Updated Document:** `docs/backup-policy.md` (신규)
* **Changes:** 
  * 로컬 데이터 백업 및 복구 로직 강화.
  * 비정상 종료 시 데이터 유실 방지를 위한 자동 세이브 정책 수립.
* **Reason / Intent:** 사용자 기록이 앱의 핵심 가치인 만큼, 기술적 오류로 인한 데이터 유실을 방지하여 신뢰성 확보.

### [2026-05-03] 
* **Branch:** `main`
* **Updated Document:** `docs/STABILITY_AND_PERSISTENCE_GUIDE.md`
* **Changes:** 
  * 시스템 안정화 마일스톤 A, B, C 수립 및 시행.
  * 베지어 곡선(Bezier Curve) 기반의 고정밀 정서 트렌드 그래프 도입.
  * 데이터 위생 처리 레이어(Sanitization Layer) 구축.
* **Reason / Intent:** 프로토타입 수준의 UI를 상용 수준의 안정성과 미려한 시각화로 고도화.

### [2026-05-08] 
* **Branch:** `main`
* **Updated Document:** `src/docs/SELF_TIME_INTEGRATION_REPORT.md`
* **Changes:** 
  * '균형 상세 리포트' 내 2-Track(교류 만족도 + 자기 회복도) 분석 시스템 구축.
  * 옥시토신/코르티솔 등 심화 지표의 가이드라인 정립.
* **Reason / Intent:** 사용자가 자신의 정서적 충전과 소모를 한눈에 비교 분석할 수 있는 통합 인사이트 제공.

### [2026-05-12] 
* **Branch:** `main`
* **Updated Document:** `docs/spec/roadmap.md`
* **Changes:** 
  * 알림 센터 연동 및 딥링크(Deep Link)를 통한 접근성 강화.
  * 튜닝 탭 내 '나의 관계 밸런스' 중심 UI 재배치.
* **Reason / Intent:** 앱 진입 장벽을 낮추고, 사용자가 가장 필요로 하는 진단 기능으로의 경로 최적화.

### [2026-05-14] 
* **Branch:** `main`
* **Updated Document:** `docs/SERVICE_TERMINOLOGY_GUIDE.md`, `docs/CORE_ALGORITHM_GUIDE.md`
* **Changes:** 
  * 전사적 용어 개편: '정서 온도(Temperature)' → '정서 에너지(Emotional Energy)'.
  * 단위 통일: 도(°) 단위에서 퍼센티지(%) 단위로 변경.
  * '정서 영향력' 등의 용어를 '에너지 수준'으로 통일.
* **Reason / Intent:** 관계를 단순한 '온도'가 아닌, 관리하고 충전해야 하는 '에너지'의 관점으로 전환하여 사용자에게 더 능동적인 케어 동기 부여.
