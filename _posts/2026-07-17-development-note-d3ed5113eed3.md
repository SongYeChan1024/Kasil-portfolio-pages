---
title: "코드 변경 사항 기록//0717"
date: 2026-07-17 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-17\\_tutorial\\_combat\\_practice\\_script\\_compare 1. 한 줄 결론 2026-07-17에는 송예찬이 직접 작성한 세 개의 커밋을 통해 튜토리얼 전투 실습 진행 차단, UI 입력 누수 방지, 바닥 꺼짐 원인 보정, 튜토리얼 UI 인스펙터 "
description: "2026-07-17\\_tutorial\\_combat\\_practice\\_script\\_compare 1. 한 줄 결론 2026-07-17에는 송예찬이 직접 작성한 세 개의 커밋을 통해 튜토리얼 전투 실습 진행 차단, UI 입력 누수 방지, 바닥 꺼짐 원인 보정, 튜토리얼 UI 인스펙터 "
published: false
migration_id: "3a036532580e81f9b90fd3ed5113eed3"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-17\_tutorial\_combat\_practice\_script\_compare]({% endraw %}{% post_url 2026-07-17-development-note-fd08879a367e %}{% raw %})

# 1. 한 줄 결론

2026-07-17에는 송예찬이 직접 작성한 세 개의 커밋을 통해 튜토리얼 전투 실습 진행 차단, UI 입력 누수 방지, 바닥 꺼짐 원인 보정, 튜토리얼 UI 인스펙터 제어 전환, 사망 방지 무전과 HUD 흐림 처리를 구현했다.

# 2. 기록 범위

- Git 작성자: <code>SongYeChan1024 &lt;[이메일 제외]&gt;</code>
- 포함 커밋: <code>60122ec</code>, <code>011771c</code>, <code>424edea</code>
- 포함 기준: 작성자가 직접 만든 커밋에 포함된 코드, 씬, 프리팹, JSON
- 제외 기준: 같은 날짜에 다른 팀원이 작성한 마우스 제한, 아이템 드래그, 공중전화, 사운드, 설정 UI, 플레이어 이동, QA 피드백 커밋

이 문서는 팀 전체 변경사항이 아니라 송예찬 개인 작업 기록이다.

# 3. 직접 작성한 커밋

## 60122ec — 튜토리얼 진행 우회 및 UI 입력 누수 수정

- Step3 전투 실습 구간의 앞·뒤 차단 콜라이더 제어 추가
- 적 처치 전 구간 이탈 방지
- 적 사망 이벤트 발생 시 차단 콜라이더 해제
- 튜토리얼 UI 중 이동, 공격, 스킬, 상호작용 등 플레이어 입력 차단
- 확인 클릭이 공격 입력으로 이어지지 않도록 입력 복구를 프레임 단위로 지연

## 011771c — 튜토리얼 바닥 꺼짐 현상 수정 후 재커밋

- 차단 콜라이더 활성화 시점을 단순 트리거 접촉 시점에서 튜토리얼 안내가 실제 처리된 시점으로 변경
- TID 2007 전투 실습을 이전 안내 자동 연결이 아니라 Step3 전투 실습 트리거 진입으로 시작하도록 변경
- 튜토리얼 씬의 트리거와 콜라이더 배치 보정

## 424edea — 튜토리얼 전투 실습 안정성 및 UI 흐름 개선

- 튜토리얼 UI RectTransform 제어를 스크립트에서 제거하고 프리팹·인스펙터 기준으로 전환
- 패널별 ConfirmButton 참조 자동 탐색과 클릭 진행 흐름 보강
- 캔버스에서 설정한 배경 이미지가 런타임에 덮이지 않도록 우선순위 수정
- 분리 패널 사용 시 레거시 공용 텍스트가 겹쳐 보이지 않도록 처리
- 튜토리얼 UI 중 인게임 HUD 알파를 0.3으로 낮추고 종료 시 복구
- 튜토리얼에서 치명 피해를 받아도 HP 1을 유지하도록 사망 방지
- 사망 방지 시 “에너미를 죽여야 해!”와 “정신차려 유안!” 무전을 번갈아 출력
- 무전 출력 중 시간 정지와 입력 차단 적용
- Objective 패널 닫기와 실제 목표 완료 이벤트를 분리
- 공통 에너미 기본 HP를 100에서 50으로 조정

# 4. 직접 수정한 전체 스크립트

## 입력

- <code>Assets/02_Scripts/System/Player/LocalInputReader.cs</code>
  - 튜토리얼 게임플레이 입력 차단 플래그와 입력별 방어 로직 추가

## 튜토리얼

- <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>
  - 입력 차단, 지연 복구, HUD 흐림, 런타임 사망 방지 무전, Objective 닫기 흐름 추가
- <code>Assets/02_Scripts/System/Tutorial/TutorialTrigger.cs</code>
  - CombatCollider 수집, 활성화, 적 처치 후 해제 흐름 추가
- <code>Assets/02_Scripts/System/Tutorial/TutorialPopup.cs</code>
  - 인스펙터 배치 우선, 배경 이미지 보존, ConfirmButton 자동 연결, 레거시 UI 숨김 처리

## 플레이어와 HUD

- <code>Assets/02_Scripts/System/Player/PlayerStatus.cs</code>
  - TutorialScene 로드 중 치명 피해를 HP 1로 제한하고 경고 무전 요청
- <code>Assets/02_Scripts/UI/Game/GamePlayUI.cs</code>
  - CanvasGroup 기반 HUD 알파 조절 이벤트 구독
- <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>
  - <code>OnGameplayHUDAlphaRequested</code> 이벤트 추가

## 에너미

- <code>Assets/02_Scripts/System/Enemy/EnemyStatus.cs</code>
  - 기본 HP 최대값을 100에서 50으로 변경

# 5. 직접 수정한 스크립트 외 파일

- <code>Assets/01_Scenes/TutorialScene.unity</code>
- <code>Assets/Resources/JSON/TutorialGuide.json</code>
- <code>Assets/03_PreFabs/Tutorial/TutorialSystem.prefab</code>
- <code>Assets/03_PreFabs/Tutorial/TutorialTrigger.prefab</code>
- <code>Assets/03_PreFabs/Characters/Enemy-DarkSpirit.prefab</code>
- <code>Assets/Settings/SampleSceneProfile.asset</code>

# 6. 주요 설계 결정

## 전투 실습 진입

Step2에서는 총과 스킬 사용법을 안내하고, Step3 전투 실습 트리거가 실제로 처리된 뒤에만 전투 차단 콜라이더를 켠다.

## 전투 실습 종료

적 사망 이벤트를 받으면 앞·뒤 차단 콜라이더를 해제한다. 현재는 모든 적 사망 이벤트에 반응하므로 대상 적이 여러 마리인 경우 식별 조건 추가를 검토한다.

## 튜토리얼 입력 차단

팝업이 열리면 TimeScale 정지, UI 액션맵 전환, 게임플레이 입력 차단을 함께 수행한다. 팝업 종료 후에는 클릭 입력이 공격으로 새지 않도록 액션맵 복구와 입력 차단 해제를 두 프레임에 나눠 처리한다.

## 튜토리얼 UI 배치

위치, 크기, 캐릭터 이미지, 배경 이미지는 프리팹·인스펙터 값을 단일 기준으로 사용한다. 스크립트는 데이터 표시, 패널 선택, 열기·닫기만 담당한다.

## 튜토리얼 사망 방지

TutorialScene이 Additive로 로드된 동안 치명 피해를 받으면 HP를 1로 유지한다. 게임오버 대신 관제사 무전을 표시하고, 무전이 끝나면 기존 튜토리얼 가이드를 복구한다.

# 7. 전체 스크립트 비교 문서

사용자가 직접 수정한 8개 스크립트만 이전 스크립트 → 변경 설명 → 현재 스크립트 형식으로 정리했다.

[2026-07-17\_tutorial\_combat\_practice\_script\_compare]({% endraw %}{% post_url 2026-07-17-development-note-fd08879a367e %}{% raw %})

# 8. 테스트 체크리스트

- [ ] Step2에서 CombatCollider가 활성화되지 않는지 확인
- [ ] Step3 안내 처리 후 앞·뒤 CombatCollider가 활성화되는지 확인
- [ ] 적 처치 후 차단 콜라이더가 모두 해제되는지 확인
- [ ] 팝업 확인 클릭이 공격, 이동, 스킬로 이어지지 않는지 확인
- [ ] 튜토리얼 UI 종료 후 플레이어 입력이 정상 복구되는지 확인
- [ ] 인스펙터에서 조정한 UI RectTransform과 배경 이미지가 유지되는지 확인
- [ ] 튜토리얼 치명 피해 시 HP 1과 교대 무전이 정상 작동하는지 확인
- [ ] 무전 종료 후 기존 튜토리얼 안내가 정상 복구되는지 확인
- [ ] HUD 알파가 팝업 중 0.3, 종료 후 1.0으로 복구되는지 확인
- [ ] 일반 인게임 사망 처리가 기존대로 작동하는지 확인

# 9. 추가 확인 필요

- <code>EnemyStatus.hpMax = 50</code>은 공통 스크립트 변경이므로 다크 스피릿 외 에너미에도 적용될 수 있다.
- <code>OnEnemyDead</code>가 특정 전투 실습 적이 아닌 다른 적의 사망에도 반응할 수 있다.
- <code>SampleSceneProfile.asset</code> 변경은 튜토리얼 전용 의도인지 확인이 필요하다.
- <code>TutorialPopup.cs</code> 일부 한글 주석은 커밋 diff에서 인코딩이 깨져 보이므로 파일 인코딩을 재확인하는 것이 안전하다.
- <code>PlayerInput</code> 비활성 상태에서 액션맵 전환 시 Unity InputSystem 경고가 발생할 수 있으므로 별도 방어 로직을 검토한다.
{% endraw %}
