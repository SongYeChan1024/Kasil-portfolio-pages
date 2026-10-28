---
title: "코드 변경 사항 기록//0716"
date: 2026-07-16 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "2026-07-16\\_tutorial\\_storage\\_enemy\\_visual\\_script\\_summary 1. 한 줄 결론 튜토리얼 대화 UI를 무전/대사/툴팁 구조로 확장하고, 창고 슬롯 UI의 레어리티·퀵슬롯·아티팩트 교환 정합성을 보강했으며, 에너미 AI의 디코이 우선순위와 "
description: "2026-07-16\\_tutorial\\_storage\\_enemy\\_visual\\_script\\_summary 1. 한 줄 결론 튜토리얼 대화 UI를 무전/대사/툴팁 구조로 확장하고, 창고 슬롯 UI의 레어리티·퀵슬롯·아티팩트 교환 정합성을 보강했으며, 에너미 AI의 디코이 우선순위와 "
published: true
migration_id: "39f36532580e813d9b03d3ad2ad14437"
migration_status: "published"
migration_flags: []
---

{% raw %}
[2026-07-16\_tutorial\_storage\_enemy\_visual\_script\_summary]({% endraw %}{% post_url 2026-07-16-development-note-f878b9a201ca %}{% raw %})

# 1. 한 줄 결론

튜토리얼 대화 UI를 무전/대사/툴팁 구조로 확장하고, 창고 슬롯 UI의 레어리티·퀵슬롯·아티팩트 교환 정합성을 보강했으며, 에너미 AI의 디코이 우선순위와 근접 교전 복귀 오류를 완화했다. 추가로 탄환/수류탄 비주얼과 캐릭터 Shadow 포트레이트 겹침 문제를 최소 수정 방식으로 안정화했다.

# 2. 작업 개요

| 항목 | 내용 |
| --- | --- |
| 작업일 | 2026-07-16 |
| 주요 커밋 | a39e5d8, bc8e6ac, 458baed |
| 작업 범위 | 튜토리얼 UI, 창고/퀵슬롯/아티팩트 UI, 에너미 AI, 탄환/수류탄 비주얼, 캐릭터 Shadow 포트레이트 |
| 핵심 목적 | 테스트 플레이 중 발견된 UI/AI/비주얼 불일치를 현재 프로젝트 구조에 맞춰 최소 수정으로 정리 |

# 3. 주요 변경 요약

## 3.1 튜토리얼 대화 UI 구조 확장

- <code>TutorialGuide.json</code>과 <code>TutorialGuide.xlsx</code>를 기준으로 튜토리얼 메시지 데이터를 확장했다.
- 기존 단순 팝업 중심 안내에서 무전 대사, 유안 대사, 조작 툴팁을 구분하는 구조로 정리했다.
- <code>TutorialPopup</code>은 안내 종류에 따라 서로 다른 패널을 보여줄 수 있게 확장했다.
- 무전/대화 계열 UI는 별도 버튼 없이 패널 클릭으로 다음 대사로 넘어갈 수 있게 구성했다.
- 팝업 출력 중 입력이 게임 조작으로 전달되지 않도록 일시정지/입력 차단 흐름을 보강했다.

## 3.2 창고 슬롯 UI 정합성 수정

- 창고 인벤토리 슬롯도 인게임 인벤토리와 동일하게 TID 기준 아이템 데이터를 조회하고 레어리티 프레임을 갱신하도록 정리했다.
- 퀵슬롯은 소비 아이템만 등록 가능하도록 제한했다.
- 퀵슬롯끼리의 자리 교환을 허용했다.
- 아티팩트 슬롯은 아티팩트끼리 교환 가능하게 하고, 인벤토리와의 장착/해제 흐름을 유지했다.
- 아티팩트 장착 슬롯에 <code>Image-RarityFrame</code>이 없을 경우 런타임에서 보완 생성하도록 처리했다.
- 비어 있는 퀵슬롯이 밝은 Fill 이미지처럼 보이지 않도록 빈 슬롯 톤을 인벤토리 슬롯에 맞췄다.

## 3.3 창고 → 인게임 퀵슬롯 반영 문제 수정

- 창고에서 퀵슬롯 등록 후 인게임 진입 시 UI 반영 이벤트가 <code>GamePlayUI</code> 생성보다 먼저 발생할 수 있는 문제를 보완했다.
- <code>QuickSlotGroupUI.SyncFromInventory()</code>를 통해 <code>GamePlayUI</code> 초기화 이후 <code>PlayerInventory.quickSlots</code>를 직접 읽어 한 번 더 UI에 반영하도록 했다.
- 이벤트 누락 가능성을 줄이고, 씬 진입 타이밍에 따른 퀵슬롯 표시 불일치를 완화했다.

## 3.4 에너미 AI 디코이/전투 타겟 분리

- 디코이 타겟과 플레이어 전투 타겟을 분리했다.
- 디코이 지속 중에는 이동 목표만 디코이로 우선 전환하고, 플레이어 전투 타겟은 보존한다.
- 디코이 종료 후 보존된 플레이어 타겟으로 자연스럽게 복귀할 수 있도록 수정했다.
- 디코이를 공격 대상으로 취급하지 않도록 하여 공격 코루틴과 이동 우선순위가 섞이지 않게 했다.

## 3.5 에너미 근접 교전 및 공격 후 이상 이동 완화

- 공격 직후 짧은 시간 동안 직접 추적을 우선하도록 <code>postAttackDirectChaseTime</code>을 추가했다.
- 공격 돌진 직후 루트 반경 판정이 너무 빠르게 복귀를 유발하지 않도록 <code>postAttackRouteTolerance</code>를 추가했다.
- 근접 교전 중 시야 레이캐스트가 자기 자신의 콜라이더를 먼저 맞아 플레이어를 놓치는 문제를 완화했다.
- <code>Physics.RaycastAll()</code>로 충돌 후보를 확인하고, 자기 자신 계층의 콜라이더는 무시하도록 했다.

## 3.6 탄환 라인 / 수류탄 비주얼 수정

- 탄환 라인 렌더러용 <code>M_BulletLine.mat</code>을 추가했다.
- 맞았을 때와 빗나갔을 때 모두 보라색 계열 라인 텍스처가 의도대로 보이도록 색상 적용을 정리했다.
- 테스트 수류탄 프리팹에 디코이 수류탄 스프라이트를 적용했다.
- 수류탄 체공 중 TrailRenderer가 따라오도록 추가했다.
- 수류탄 스프라이트 크기를 기존보다 줄여 캐릭터 머리 크기 수준의 과도한 비율을 완화했다.

## 3.7 캐릭터 Shadow 포트레이트 겹침 완화

- <code>AnimatorShadowSync</code>에서 Shadow AnyPortrait를 끄지 않고 알파값만 조절하도록 수정했다.
- <code>SetMeshAlphaAll()</code>과 <code>MoveTowards()</code>를 사용해 EnemyVisible의 투명화 방식과 유사하게 처리했다.
- Shadow Animator 동기화는 유지하여 애니메이터 업데이트 중단으로 인한 포즈 고정 문제를 피했다.
- 현재는 임시 안정화 성격이며, 추후 Shadow 연출이 필요하면 카메라/레이어/렌더 구조를 별도로 재정리해야 한다.

# 4. 변경 파일 분류

## 튜토리얼 관련

- <code>Assets/02_Scripts/System/Tutorial/TutorialGuideData.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>
- <code>Assets/02_Scripts/System/Tutorial/TutorialPopup.cs</code>
- <code>Assets/02_Scripts/System/Player/LocalInputReader.cs</code>
- <code>Assets/03_PreFabs/Tutorial/TutorialSystem.prefab</code>
- <code>Assets/Resources/Excel/TutorialGuide.xlsx</code>
- <code>Assets/Resources/JSON/TutorialGuide.json</code>
- <code>Assets/01_Scenes/TutorialScene.unity</code>

## 창고/퀵슬롯/아티팩트 UI 관련

- <code>Assets/02_Scripts/System/Player/PlayerInventory.cs</code>
- <code>Assets/02_Scripts/UI/Game/GamePlayUI.cs</code>
- <code>Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs</code>
- <code>Assets/02_Scripts/UI/Lobby/StorageInventoryUI.cs</code>
- <code>Assets/02_Scripts/UI/QuickSlotGroupUI.cs</code>
- <code>Assets/02_Scripts/UI/QuickSlotUI.cs</code>
- <code>Assets/03_PreFabs/UI/Canvas-StorageInventory.prefab</code>

## 에너미 AI 관련

- <code>Assets/02_Scripts/System/Enemy/EnemyBrain.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyCombat.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyPerception.cs</code>

## 비주얼/프리팹 관련

- <code>Assets/02_Scripts/System/AnimatorShadowSync.cs</code>
- <code>Assets/03_PreFabs/Characters/Player_Yuan.prefab</code>
- <code>Assets/03_PreFabs/Item/test_Grenade.prefab</code>
- <code>Assets/04_Graphics/Materials/M_BulletLine.mat</code>
- <code>Assets/04_Graphics/Skill/Skill_Decoy_Granade.png</code>
- <code>Assets/04_Graphics/TrailRenderer/Trail-Bullet.png</code>

# 5. 검증 내용

- <code>dotnet build Assembly-CSharp.csproj --no-restore</code> 통과
- 기존 <code>System.Net.Http</code>, <code>System.IO.Compression</code> 버전 충돌 경고만 확인
- Unity 플레이 테스트 필요 항목은 아래 체크리스트에 분리

# 6. 테스트 체크리스트

- [x] 튜토리얼 진입 시 무전/대사/툴팁 UI가 의도한 패널로 분기되는지 확인
- [x] 튜토리얼 팝업 중 클릭/공격/이동 입력이 게임플레이로 새지 않는지 확인
- [x] 창고에서 퀵슬롯 등록 후 인게임 진입 시 퀵슬롯 UI가 즉시 반영되는지 확인
- [x] 창고 슬롯, 퀵슬롯, 아티팩트 슬롯에 레어리티 프레임이 정상 표시되는지 확인
- [x] 퀵슬롯에는 소비 아이템만 등록되는지 확인
- [x] 아티팩트 슬롯끼리 교환, 퀵슬롯끼리 교환이 정상 동작하는지 확인
- [x] 디코이 수류탄 종료 후 에너미가 플레이어 전투 타겟으로 복귀하는지 확인
- [x] 에너미가 근접 공격 후 굳거나 이상한 방향으로 이탈하지 않는지 확인
- [x] 탄환 라인과 수류탄 TrailRenderer가 의도한 보라색 계열로 보이는지 확인
- [x] 유안 Shadow 포트레이트 겹침이 완화되었는지 확인

# 7. 현재 남은 로컬 변경 확인

현재 워킹트리에는 <code>Assets/Settings/SampleSceneProfile.asset</code> 변경이 남아 있다. 이 파일은 그래픽/렌더 프로파일 계열 변경으로 보이며, 코드 변경 사항 기록에는 별도 잔여 변경으로만 기록한다. 커밋 전에는 의도한 그래픽 설정 변경인지 확인이 필요하다.
{% endraw %}
