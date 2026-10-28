---
title: "코드 변경 사항 기록//0722"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "1. 한 줄 결론 2026-07-22에는 인게임 ESC 메뉴와 인벤토리의 입력 우선순위를 정리하고, 관제실 복귀를 게임 포기 실패 정산으로 연결했으며, 튜토리얼에서 상자 UI와 안내 팝업이 충돌하지 않도록 입력·커서 복구 흐름을 보완했습니다. 2. 기록 범위 작성 기준: 송예찬 Song"
description: "1. 한 줄 결론 2026-07-22에는 인게임 ESC 메뉴와 인벤토리의 입력 우선순위를 정리하고, 관제실 복귀를 게임 포기 실패 정산으로 연결했으며, 튜토리얼에서 상자 UI와 안내 팝업이 충돌하지 않도록 입력·커서 복구 흐름을 보완했습니다. 2. 기록 범위 작성 기준: 송예찬 Song"
published: false
migration_id: "3a536532580e8171bbceff99449d15ae"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 한 줄 결론

2026-07-22에는 인게임 ESC 메뉴와 인벤토리의 입력 우선순위를 정리하고, 관제실 복귀를 게임 포기 실패 정산으로 연결했으며, 튜토리얼에서 상자 UI와 안내 팝업이 충돌하지 않도록 입력·커서 복구 흐름을 보완했습니다.

## 2. 기록 범위

- 작성 기준: 송예찬 <code>SongYeChan1024 &lt;[이메일 제외]&gt;</code> 직접 커밋만 포함
- 기준 날짜: 2026-07-22
- 기준 저장소: <code>UnityProject_LucidDiver</code>
- 기준 브랜치: <code>Release-0.3.3</code>
- 포함 커밋: <code>6196912</code>, <code>c32ccf5</code>, <code>37063ec</code>
- 제외 범위: 팀원 커밋과 병합 커밋, 코드 변경이 없었던 논의·인스펙터 확인
- 현재 상태: 작업 트리 clean, 로컬 브랜치와 <code>origin/Release-0.3.3</code> 동기화
- 비교 기준: 파일별 첫 직접 수정 직전 전문과 오늘 최종 HEAD 전문을 비교하고, 설명에는 직접 커밋의 변경만 분리해 기록

## 3. 직접 작성한 커밋

### 3-1. <code>6196912</code> — 인게임 ESC 메뉴 입력 차단 및 UI 상태 수정

- 게임 시간을 멈추지 않은 채 Player/UI 액션 맵을 전환하는 ESC 메뉴 흐름 구축
- 메뉴 중 이동·공격·스킬·상호작용·퀵슬롯·인벤토리 입력 차단
- 튜토리얼과 게임 메뉴의 입력 차단 소유권 분리
- HUD를 팝업 스택에서 분리하고 배경 UI Raycast를 제어
- 인게임·로비 메뉴 X 버튼과 관제실 이동 시 UI·입력 정리
- 사망·탈출 결과 확정 후 ESC 메뉴 재진입 방지

### 3-2. <code>c32ccf5</code> — 게임 포기 정산 및 튜토리얼 카메라 설정 보완

- 관제실 복귀를 <code>GameAbandon</code> 종료 사유로 기록하고 기존 실패 정산에 연결
- 게임 포기 시 소지 아이템·장착 아티팩트·퀵슬롯 데이터를 실패 규칙으로 정리
- 인벤토리 계열 UI가 열려 있으면 ESC로 먼저 닫고 메뉴 입력 관통 방지
- 관제실 복귀 확인창의 아이템 소실 경고 문구 적용
- 튜토리얼 카메라 Orthographic, Size, Near Clip과 SoftFog 설정을 인게임 기준으로 보정

### 3-3. <code>37063ec</code> — 튜토리얼 상자 UI 및 입력 흐름 충돌 수정

- 튜토리얼 씬에서는 인벤토리 닫기 ESC는 유지하되 게임 메뉴 진입 차단
- 상자 오픈 튜토리얼 이벤트를 UI 준비 다음 프레임으로 지연
- 동일 상자 이벤트 중복 처리 방지
- 안내 종료 후 인벤토리가 열려 있으면 UI 입력 맵과 커서 상태 유지
- 상자 종료 후 기존 플레이어 입력 복구 정합성 보완

## 4. 코드 변경 사항

### 4-1. ESC 메뉴와 입력 소유권

- <code>GameplayInputBlockSource.GameMenu</code>를 추가해 튜토리얼 차단과 메뉴 차단을 독립적으로 관리합니다.
- Player/UI 양쪽의 <code>GameMenu</code> 액션을 같은 토글 흐름에 연결합니다.
- 메뉴를 닫을 때 ESC 키 해제를 기다린 뒤 기존 액션 맵과 커서 잠금 상태를 복구합니다.
- 인벤토리·상자·툴팁이 열려 있으면 해당 UI를 먼저 닫고 같은 ESC 입력으로 메뉴가 열리지 않게 방어합니다.

### 4-2. UI 스택과 세션 정리

- <code>GamePlayUI</code>는 팝업 스택에 넣지 않는 Root UI로 열어 반복 ESC로 HUD가 닫히지 않게 합니다.
- 메뉴 아래 HUD·인벤토리·상자·툴팁은 보이되 Raycast를 차단합니다.
- 관제실 전환 전에 인게임 세션 UI를 일괄 비활성화하고 Lobby 입력 맵과 커서 상태로 정리합니다.
- 사망·탈출·게임 포기 결과가 확정되면 메뉴 계열 UI와 입력 복구 코루틴을 정리합니다.

### 4-3. 게임 포기 실패 정산

- <code>SessionEndReason.GameAbandon</code>과 <code>IResultService.HandleGameAbandon()</code>을 추가했습니다.
- 중복 확인 입력을 막고 진행 중 탈출 채널링을 취소한 뒤 실패 정산 이벤트를 동기적으로 발생시킵니다.
- 실패 정산에서 장착 아티팩트 null 안전성을 보강하고 퀵슬롯 저장값을 빈 슬롯으로 초기화합니다.
- 확인창은 씬을 즉시 이동하지 않고 결과 화면을 거쳐 로비로 이동하도록 변경했습니다.

### 4-4. 튜토리얼 상자 UI 정합성

- 튜토리얼에서는 게임 메뉴만 제한하고 상자·인벤토리 UI 흐름은 유지합니다.
- <code>ItemBoxOpened</code> 처리를 한 프레임 늦춰 Chest/Inventory UI 생성 이후 안내와 일시정지가 적용되게 합니다.
- 안내 종료 시 인벤토리가 열려 있으면 Player 맵으로 강제 복귀하거나 커서를 잠그지 않습니다.
- 중복 이벤트 코루틴을 하나로 제한하고 비활성화 시 안전하게 중단합니다.

## 5. 직접 수정한 스크립트

### 입력·UI 상태 관리

- <code>Assets/02_Scripts/Manager/GameManager.cs</code>
- <code>Assets/02_Scripts/Manager/Manager/InputManager.cs</code>
- <code>Assets/02_Scripts/Manager/Manager/SceneController.cs</code>
- <code>Assets/02_Scripts/Manager/Manager/UIManager.cs</code>
- <code>Assets/02_Scripts/Presenter/GameUIPresenter.cs</code>
- <code>Assets/02_Scripts/Presenter/InventoryPresenter.cs</code>
- <code>Assets/02_Scripts/System/Player/LocalInputReader.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>
- <code>Assets/02_Scripts/UI/Game/InGameMenuUI.cs</code>
- <code>Assets/02_Scripts/UI/Lobby/GameMenuUI.cs</code>
- <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>

### 게임 포기 정산

- <code>Assets/02_Scripts/Define/Enums.cs</code>
- <code>Assets/02_Scripts/Manager/Manager/ResultManager.cs</code>
- <code>Assets/02_Scripts/System/Player/PlayerStatus.cs</code>
- <code>Assets/02_Scripts/UI/Game/NoticeLobbyUI.cs</code>
- <code>Assets/02_Scripts/Utils/Interface/IResultService.cs</code>
- 전체 비교 대상: 16개
- 신규 C# 스크립트: 없음
- 기존 C# 수정: 16개

## 6. 직접 수정한 비스크립트 자산

- 씬: <code>DemoScene Tutorial.unity</code>, <code>IntroScene.unity</code>, <code>TutorialScene.unity</code>
- UI 프리팹: <code>Canvas-NoticeLobbyPanel.prefab</code>
- 입력 설정: <code>PlayerInputActions.inputactions</code>

## 7. 전체 스크립트 비교 문서

전체 비교 인덱스와 16개 파일별 전문 비교 문서를 하위 페이지로 작성했습니다.

[2026-07-22 전체 스크립트 비교 정리]({% endraw %}{% post_url 2026-07-22-development-note-c2b0da410792 %}{% raw %})

## 8. 검증 결과

- Git 작업 트리 clean 확인
- 오늘 직접 작성한 3개 커밋과 팀원·병합 커밋 분리 확인
- 직접 수정 C# 파일 16개와 비스크립트 자산 5개 확인
- 현재 HEAD가 마지막 직접 커밋 <code>37063ec</code>이며 원격 추적 브랜치와 동기화된 상태 확인
- 실제 Unity 실행·플레이 모드 회귀 테스트는 이 문서 작성 범위에 포함하지 않음

## 9. 회귀 테스트 체크리스트

- [ ] 인게임 ESC 메뉴 중 게임 시간은 흐르지만 이동·공격·스킬·상호작용·퀵슬롯 입력이 차단되는지 확인
- [ ] 설정·관제실 확인창을 ESC로 단계적으로 닫은 뒤 기존 입력 맵과 커서 상태가 복구되는지 확인
- [ ] 인벤토리·상자·툴팁이 열려 있을 때 첫 ESC는 UI만 닫고 메뉴를 열지 않는지 확인
- [ ] 사망·탈출 결과 화면에서 ESC 메뉴가 다시 열리지 않는지 확인
- [ ] 관제실 복귀 확정 시 실패 정산과 아이템·장착 장비·퀵슬롯 소실이 적용되는지 확인
- [ ] 튜토리얼 씬에서 ESC 게임 메뉴는 열리지 않고 인벤토리 닫기는 정상 동작하는지 확인
- [ ] 상자 오픈 직후 Chest/Inventory UI와 튜토리얼 안내가 함께 정상 표시되는지 확인
- [ ] 튜토리얼 안내 종료 후 인벤토리가 열려 있으면 UI 입력과 커서가 유지되는지 확인
- [ ] 관제실 이동 뒤 인게임 HUD·팝업·입력 상태가 남지 않는지 확인

## 10. 주의 사항

- <code>GlobalEventBus.cs</code>는 오늘 직접 커밋 사이에 팀원 커밋의 심상 기록 이벤트 변경이 함께 들어왔습니다. 전문 비교에는 현재 HEAD 전체가 보이지만 변경 설명은 송예찬 직접 수정분만 구분합니다.
- 문서상 정적 검증과 Git 비교는 완료했으나 Unity 컴파일, 씬 로드, 입력 액션 실기 검증은 별도로 진행해야 합니다.

[2026-07-22\_전체\_스크립트\_비교\_정리]({% endraw %}{% post_url 2026-07-22-development-note-c2b0da410792 %}{% raw %})
{% endraw %}
