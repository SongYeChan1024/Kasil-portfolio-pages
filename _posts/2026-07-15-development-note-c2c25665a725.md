---
title: "코드 변경 사항 기록//0715"
date: 2026-07-15 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-15\\_tutorial\\_scene\\_flow\\_code\\_analysis 이 문서는 2026-07-15 기준 튜토리얼 씬 구축 및 베타 병합 후 로컬 변경 상태 점검 내용을 정리한 코드 변경 사항 기록이다. AI가 작성한 초안이므로 PM/기획자 검토 후 확정한다. 1. "
description: "2026-07-15\\_tutorial\\_scene\\_flow\\_code\\_analysis 이 문서는 2026-07-15 기준 튜토리얼 씬 구축 및 베타 병합 후 로컬 변경 상태 점검 내용을 정리한 코드 변경 사항 기록이다. AI가 작성한 초안이므로 PM/기획자 검토 후 확정한다. 1. "
published: false
migration_id: "39e36532580e816294d7c2c25665a725"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-15\_tutorial\_scene\_flow\_code\_analysis]({% endraw %}{% post_url 2026-07-15-development-note-ef91da36f944 %}{% raw %})


이 문서는 2026-07-15 기준 튜토리얼 씬 구축 및 베타 병합 후 로컬 변경 상태 점검 내용을 정리한 코드 변경 사항 기록이다. AI가 작성한 초안이므로 PM/기획자 검토 후 확정한다.


# 1. 한 줄 결론

튜토리얼 씬을 별도 씬 + Additive 씬 구조로 구성하고, JSON 기반 단계별 안내 시스템을 추가했으며, 튜토리얼 완료/결과창/로비 이동 흐름을 인게임 정산 흐름과 맞췄다.

# 2. 작업 개요

| 항목 | 내용 |
| --- | --- |
| 작업일 | 2026-07-15 |
| 대표 커밋 | 3838dc8 feat: 튜토리얼 씬 및 진행 시스템 추가 |
| 작업 범위 | 튜토리얼 씬, 튜토리얼 메시지 데이터, 인트로 라우팅, 결과창 전환, 상자/탈출 이벤트 연동 |
| 핵심 목적 | 처음 실행 시 일회성으로 진입하는 튜토리얼을 구성하고, 개발 중 반복 테스트가 가능하도록 제어 옵션을 추가 |

# 3. 주요 변경 요약

## 3.1 튜토리얼 씬 구성

- <code>TutorialScene</code>을 별도 레벨 씬으로 사용한다.
- <code>DemoScene Tutorial</code>을 Additive 씬으로 함께 불러와 플레이어, 카메라, UI, 매니저 구조를 재사용한다.
- 기존 인게임 씬 구조를 그대로 가져오지 않고, 튜토리얼 전용 Additive 씬을 분리해 다른 씬 영향도를 줄였다.
- 튜토리얼 NavMesh와 트리거 구간을 튜토리얼 씬 한정으로 구성했다.

## 3.2 튜토리얼 진행 단계

| 단계 | 발동 방식 | 내용 |
| --- | --- | --- |
| 1 | 콜라이더 | WASD 이동 기본 |
| 2 | 콜라이더 | 전투 조작 사전 안내: 시야, 공격, MP, 스킬 |
| 3 | 콜라이더 | 전투 실습 |
| 4 | 콜라이더 | 상자 접근 및 F 상호작용 안내 |
| 5 | 상자 열림 이벤트 | 상자 안 아이템, 툴팁, 인벤토리 이동, 퀵슬롯/아티팩트 설명 |
| 6 | 콜라이더 | 포탈 / 탈출 안내 |

## 3.3 JSON 기반 튜토리얼 데이터

- <code>Assets/Resources/JSON/TutorialGuide.json</code>을 추가했다.
- 각 튜토리얼 메시지는 <code>TID</code>, <code>TutorialStep</code>, <code>TutorialGuideOrder</code>, <code>OpenConditionType</code>, <code>OpenConditionValue</code>, <code>ClearConditionType</code>, <code>ClearConditionValue</code>, <code>NextGuideID</code>를 가진다.
- 메시지 내용과 발동 조건을 코드에서 분리해, 기획 데이터 수정만으로 안내 흐름을 조정할 수 있게 했다.

## 3.4 인트로 라우팅

- <code>IntroSceneController</code>에 <code>useTutorialScene</code> 옵션을 유지했다.
- 개발 테스트를 위해 <code>resetTutorialCompletedOnIntro</code> 옵션을 추가했다.
- 이 옵션이 켜져 있으면 인트로 진입 시 <code>SaveFile.json</code>의 <code>isTutorialCompleted</code>만 false로 되돌린다.
- 세이브 전체 삭제 없이 튜토리얼 반복 테스트가 가능하다.

## 3.5 결과창 / 로비 이동 흐름 정리

- 튜토리얼 탈출 성공 시 바로 로비로 이동하지 않게 수정했다.
- 튜토리얼 완료 여부는 저장하되, 로비 이동은 인게임과 동일하게 <code>ResultUI</code>의 로비 버튼 흐름에 맡긴다.
- 최종 흐름은 다음과 같다.

```txt
튜토리얼 탈출 성공
→ OnEscapeRequest(true)
→ 결과창 표시
→ isTutorialCompleted 저장
→ ResultUI 로비 버튼 클릭
→ OnGoToLobbyScene
→ LobbyScene 이동
```

# 4. 변경 파일 분류

## 신규 파일

- <code>Assets/02_Scripts/System/Repository/LocalJsonTutorialGuideRepository.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialConditionTypes.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialGuideData.cs</code>
- <code>Assets/Resources/JSON/TutorialGuide.json</code>

## 핵심 수정 파일

- <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialTrigger.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialPopup.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialEventBridge.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialCompletionTrigger.cs</code>
- <code>Assets/02_Scripts/UI/Intro/IntroSceneController.cs</code>
- <code>Assets/02_Scripts/System/ExitPoint.cs</code>
- <code>Assets/02_Scripts/System/EscapeTimer.cs</code>

## 씬/프리팹 수정

- <code>Assets/01_Scenes/TutorialScene.unity</code>
- <code>Assets/01_Scenes/DemoScene Tutorial.unity</code>
- <code>Assets/01_Scenes/IntroScene.unity</code>
- <code>Assets/03_PreFabs/Tutorial/TutorialSystem.prefab</code>
- <code>Assets/03_PreFabs/Tutorial/TutorialTrigger.prefab</code>

# 5. 구현 의도

## 5.1 왜 JSON 기반인가

- 튜토리얼 문구와 조건은 코드보다 데이터에 가깝다.
- 기존 프로젝트가 아이템/스킬/오디오 등에서 ExcelToJson 계열 데이터 흐름을 사용하고 있다.
- 따라서 튜토리얼도 JSON 데이터로 분리하면 기획자가 문구와 순서를 조정하기 쉽다.

## 5.2 왜 5번은 콜라이더가 아닌 이벤트인가

상자 내부 설명은 플레이어가 특정 위치에 도달했는지가 아니라, 실제로 상자 UI를 열었는지가 핵심 조건이다. 그래서 <code>ItemBoxOpened</code> 이벤트를 기준으로 안내를 이어가는 구조가 더 정확하다.

## 5.3 왜 완료 즉시 로비 이동을 제거했는가

인게임에서는 탈출 성공 후 결과창이 먼저 뜨고, 결과창 버튼을 통해 로비로 이동한다. 튜토리얼도 같은 흐름을 타야 플레이 결과 정산, UI 정리, 입력 잠금 흐름이 꼬이지 않는다.

# 6. 테스트 체크리스트

- [ ] 인트로에서 <code>useTutorialScene = true</code>일 때 튜토리얼 씬으로 진입하는지 확인
- [ ] <code>resetTutorialCompletedOnIntro = true</code>일 때 완료 세이브가 false로 리셋되는지 확인
- [ ] 1\~6단계 튜토리얼 안내가 순서대로 출력되는지 확인
- [ ] 상자 UI 오픈 시 아이템/아티팩트 안내 단계가 이어지는지 확인
- [ ] 포탈 탈출 성공 후 결과창이 먼저 뜨는지 확인
- [ ] 결과창의 로비 버튼 클릭 시 로비로 이동하는지 확인
- [ ] 일반 인게임 씬의 탈출/결과창 흐름에 영향이 없는지 확인

# 7. 베타 병합 후 로컬 변경 발생 원인 분석

베타 브랜치에서 확인된 새 변경 사항은 정상적인 새 작업이라기보다, 이미 머지된 튜토리얼 구현을 로컬 변경이 되돌리는 형태였다.

관찰된 현상:

- <code>TutorialGuide.json</code> 삭제로 표시
- <code>TutorialGuideData.cs</code>, <code>TutorialConditionTypes.cs</code>, <code>LocalJsonTutorialGuideRepository.cs</code> 삭제로 표시
- <code>TutorialManager.cs</code>가 JSON 기반 구조에서 이전 Catalog 기반 구조로 되돌아가는 diff 발생
- <code>Enemy-DarkSpirit.prefab</code> 대량 삭제 diff 발생

판단:

- Unity 자동 저장으로 보기에는 변경량과 삭제 범위가 과도하다.
- 베타 이동 또는 패치 적용 과정에서 이전 브랜치 상태가 인덱스/워킹트리에 남았을 가능성이 높다.
- 해당 상태를 그대로 커밋하면 이미 머지된 팀원 작업을 되돌릴 위험이 있다.

권장 대응:

```bash
git status --short --branch
git diff --stat
git diff --cached --stat
```

의도하지 않은 되돌림이면 백업 후 복구:

```bash
git diff --cached > beta_local_staged_backup.patch
git diff > beta_local_unstaged_backup.patch
git restore --staged .
git restore .
```

---

# 9. 연결 문서

- [2026-07-15\_tutorial\_scene\_flow\_code\_analysis]({% endraw %}{% post_url 2026-07-15-development-note-ef91da36f944 %}{% raw %})
{% endraw %}
