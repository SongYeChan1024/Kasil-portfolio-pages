---
title: "2026-07-16_tutorial_storage_enemy_visual_script_summary"
date: 2026-07-16 12:00:00 +0900
categories: ["개발 메모", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "1. 문서 목적 이 문서는 2026-07-16에 수정한 핵심 스크립트를 읽기 위한 정리 문서다. 단순 변경 목록이 아니라, 각 스크립트가 왜 바뀌었고 현재 어떤 책임을 갖는지 중심으로 정리한다. 2. 튜토리얼 UI / 데이터 구조 2.1 TutorialGuideData.cs 이전 문제 "
description: "1. 문서 목적 이 문서는 2026-07-16에 수정한 핵심 스크립트를 읽기 위한 정리 문서다. 단순 변경 목록이 아니라, 각 스크립트가 왜 바뀌었고 현재 어떤 책임을 갖는지 중심으로 정리한다. 2. 튜토리얼 UI / 데이터 구조 2.1 TutorialGuideData.cs 이전 문제 "
published: true
migration_id: "39f36532580e81a08153f878b9a201ca"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
# 1. 문서 목적

이 문서는 2026-07-16에 수정한 핵심 스크립트를 읽기 위한 정리 문서다. 단순 변경 목록이 아니라, 각 스크립트가 왜 바뀌었고 현재 어떤 책임을 갖는지 중심으로 정리한다.

# 2. 튜토리얼 UI / 데이터 구조

## 2.1 TutorialGuideData.cs

### 이전 문제

- 튜토리얼 안내가 단순 팝업 중심으로만 구성되어 있었다.
- 새 기획서 기준으로 무전 대사, 캐릭터 대사, 조작 가이드를 구분해야 했다.
- 데이터가 확장되지 않으면 <code>TutorialPopup</code>에서 어떤 UI를 띄워야 하는지 판단하기 어렵다.

### 변경 설명

- 튜토리얼 가이드 데이터에 표시 타입과 캐릭터/무전/툴팁 계열 정보를 담을 수 있게 확장했다.
- <code>TutorialGuide.json</code>과 <code>TutorialGuide.xlsx</code>에서 각 가이드의 출력 방식과 순서를 관리할 수 있게 했다.

### 현재 책임

- JSON에서 읽은 튜토리얼 한 줄 데이터를 코드에서 사용할 수 있는 형태로 보관한다.
- 튜토리얼 단계, 출력 순서, 열림 조건, 클리어 조건, 다음 가이드 ID를 전달한다.
- UI 출력 타입 판단의 기준 데이터를 제공한다.

## 2.2 TutorialManager.cs

### 이전 문제

- 튜토리얼 메시지 출력 흐름이 단순 단계 진행 중심이었다.
- 콜라이더, 상자 열림, 이전 가이드 종료 같은 조건이 섞이면서 흐름 추적이 어려웠다.
- 새 UI 구조에서는 같은 가이드라도 일반 팝업인지, 무전인지, 대사인지 구분해야 했다.

### 변경 설명

- <code>TutorialGuide.json</code> 데이터를 기준으로 현재 출력 가능한 가이드를 찾는다.
- 조건이 충족되면 <code>TutorialPopup</code>에 데이터를 넘겨 UI를 연다.
- 가이드 종료 후 다음 가이드가 있으면 이어서 출력한다.

### 현재 책임

- 튜토리얼 진행 상태의 중심 관리자다.
- 트리거/이벤트로부터 조건 발생을 전달받는다.
- 이미 본 가이드와 다음 가이드 흐름을 관리한다.
- 팝업 표시 중 입력 흐름이 꼬이지 않도록 UI 출력 상태를 제어한다.

## 2.3 TutorialPopup.cs

### 이전 문제

- 하나의 팝업 UI에 모든 안내를 몰아 넣는 구조에 가까웠다.
- 무전, 유안 대사, 조작 툴팁은 화면 위치와 연출 목적이 달라 같은 패널로 처리하면 관리가 어려웠다.
- 버튼 클릭이 게임 입력과 겹쳐 총이 발사되거나 이동 입력이 전달될 수 있었다.

### 변경 설명

- 튜토리얼 표시 타입별로 다른 패널을 켜고 끌 수 있게 분리했다.
- 무전/대화 계열은 패널 자체를 클릭해 다음 대사로 진행할 수 있게 했다.
- 팝업이 열려 있는 동안 게임 입력이 새지 않도록 일시정지 또는 입력 차단 흐름을 보강했다.

### 현재 책임

- 전달받은 튜토리얼 가이드 데이터를 실제 UI로 표현한다.
- 일반 조작 툴팁, 무전 대사, 유안 대사를 구분해 표시한다.
- 확인/패널 클릭 시 <code>TutorialManager</code>에 종료 이벤트를 돌려준다.

# 3. 창고 / 퀵슬롯 / 아티팩트 UI

## 3.1 QuickSlotGroupUI.cs

### 이전 문제

- 창고에서 퀵슬롯을 등록한 뒤 인게임으로 진입할 때 UI가 즉시 반영되지 않는 경우가 있었다.
- 원인 후보는 퀵슬롯 복원 이벤트가 <code>GamePlayUI</code> 생성보다 먼저 발생해 UI가 이벤트를 놓치는 것이었다.

### 변경 설명

- <code>SyncFromInventory(PlayerInventory playerInventory)</code>를 추가했다.
- <code>GamePlayUI</code> 초기화 이후 현재 <code>PlayerInventory.quickSlots</code> 상태를 직접 읽어 UI에 1회 반영한다.
- 기존 이벤트 기반 갱신은 유지하고, 씬 진입 타이밍 문제만 보완했다.

### 현재 책임

- 여러 개의 <code>QuickSlotUI</code>를 묶어 관리한다.
- 퀵슬롯 변경 이벤트를 받아 슬롯별 UI를 갱신한다.
- 인게임 진입 시 현재 인벤토리 데이터를 읽어 초기 UI 상태를 보정한다.

## 3.2 QuickSlotUI.cs

### 이전 문제

- 창고 퀵슬롯의 아이템 이미지가 슬롯보다 크게 보이거나, 빈 슬롯이 Fill 이미지처럼 밝게 보였다.
- 퀵슬롯에도 레어리티 프레임이 필요했지만 인벤토리 슬롯과 같은 방식으로 표시되지 않았다.

### 변경 설명

- <code>slotFrameImage</code>, <code>rarityFrameImage</code>, 등급별 프레임 스프라이트 필드를 추가했다.
- 아이템 아이콘 최대 크기를 제한하는 <code>maxIconSize</code>를 추가했다.
- 빈 슬롯 색상을 인벤토리 슬롯 톤에 맞추는 <code>emptySlotColor</code>를 추가했다.
- 등급 프레임이 없을 경우 아이콘 틴트로 최소한의 레어리티 표시를 보완할 수 있게 했다.

### 현재 책임

- 퀵슬롯 한 칸의 아이콘, 수량, 빈 슬롯 배경, 레어리티 표시를 담당한다.
- 드래그 앤 드롭으로 인벤토리 슬롯에서 퀵슬롯 등록 요청을 전달한다.
- 퀵슬롯끼리 드롭하면 자리 교환 이벤트를 전달한다.

## 3.3 StorageInventoryUI.cs

### 이전 문제

- 창고 UI에서 인벤토리 슬롯, 안전 금고 슬롯, 퀵슬롯, 아티팩트 슬롯의 규칙이 일부 섞여 있었다.
- 퀵슬롯 등록 가능 아이템 제한이 명확하지 않았다.
- 아티팩트 슬롯끼리 교환하거나, 퀵슬롯끼리 교환하는 동작이 부족했다.
- 창고 쪽 슬롯이 TID 기준으로 레어리티를 안정적으로 갱신하지 못했다.

### 변경 설명

- <code>AreaType.Artifact</code>를 추가해 아티팩트 장착 슬롯도 창고 UI의 통합 드래그 규칙 안에서 관리한다.
- 퀵슬롯 등록은 소비 아이템만 허용하도록 <code>CanRegisterQuickSlot()</code>을 추가했다.
- <code>SwapQuickSlots()</code>, <code>DropToArtifactSlot()</code>, <code>SwapArtifactSlots()</code> 흐름을 추가했다.
- <code>RefreshInventorySlot()</code>과 <code>RefreshQuickSlot()</code>에서 TID로 아이템 데이터를 조회하고 등급을 UI에 전달한다.

### 현재 책임

- 창고 화면의 저장소, 인벤토리, 안전 금고, 아티팩트 장착 슬롯, 퀵슬롯 간 이동 규칙을 통합 관리한다.
- TID 기반으로 아이콘, 수량, 레어리티를 갱신한다.
- UI 조작 후 <code>PlayerData</code>에 저장될 데이터를 정합성 있게 갱신한다.

## 3.4 ArtifactEquipSlotUI.cs

### 이전 문제

- 창고 쪽 아티팩트 장착 슬롯에 레어리티 프레임이 보이지 않았다.
- 프리팹에 <code>Image-RarityFrame</code>이 없거나 연결되지 않으면 등급 표시를 할 수 없었다.
- 프레임 레이어가 아이콘보다 뒤/앞에 잘못 배치될 수 있었다.

### 변경 설명

- <code>EnsureReferences()</code>로 슬롯 구성요소를 자동으로 찾는다.
- <code>Image-RarityFrame</code>이 없으면 런타임에서 새로 생성하는 <code>CreateRarityFrameImage()</code>를 추가했다.
- <code>AlignRarityFrameToSlot()</code>으로 프레임 RectTransform을 슬롯 전체에 맞춘다.
- 프레임은 배경 위, 아이콘 아래에 위치하도록 sibling index를 정리한다.

### 현재 책임

- 아티팩트 장착 슬롯 한 칸의 아이콘, 수량, 레어리티 프레임을 표시한다.
- 프리팹 참조가 일부 빠져도 런타임에서 필요한 UI 참조를 보완한다.
- 창고 UI에서는 입력 처리를 <code>StorageInventoryUI</code>가 통합 관리할 수 있도록 분리된다.

# 4. 에너미 AI

## 4.1 EnemyBrain.cs

### 이전 문제

- 디코이 수류탄을 던지면 디코이 타겟이 플레이어 전투 타겟을 덮어써서, 디코이 종료 후 플레이어를 다시 공격하지 못하는 흐름이 생길 수 있었다.
- 공격 직후 에너미가 루트 반경/복귀 조건과 충돌해 굳거나 이상한 방향으로 이동하는 문제가 있었다.
- 플레이어가 근접에서 빙글빙글 돌면 시야 상실/복귀 로직이 너무 빨리 타는 문제가 있었다.

### 변경 설명

- <code>currentTarget</code>은 플레이어 전투 타겟, <code>aggroTarget</code>은 디코이 같은 임시 이동 우선 타겟으로 역할을 분리했다.
- <code>ResolvePriorityMoveTarget()</code>과 <code>HandlePriorityMoveTarget()</code>을 추가해 디코이 이동 목표를 전투 타겟과 분리했다.
- <code>postAttackDirectChaseTime</code>과 <code>postAttackRouteTolerance</code>를 추가해 공격 직후 짧은 시간 동안 직접 추적과 전투 재정렬을 우선한다.
- 디코이 종료 후 플레이어 타겟을 보존해 자연스럽게 전투 흐름으로 복귀할 수 있게 했다.

### 현재 책임

- 에너미의 순찰, 추격, 복귀, 디코이 반응, 전투 타겟 유지 흐름을 관리한다.
- 디코이는 이동 우선순위로만 사용하고 공격 대상으로 취급하지 않는다.
- 활동 반경과 복귀 조건을 유지하되, 공격 직후에는 짧은 보정 시간을 적용한다.

## 4.2 EnemyPerception.cs

### 이전 문제

- 근접 교전 중 시야 Raycast가 자기 자신의 콜라이더를 먼저 맞으면 플레이어가 가려진 것으로 판단될 수 있었다.
- 이 경우 너무 가까이 있으면 공격하지 못하거나 추격/복귀 판단이 흔들릴 수 있었다.

### 변경 설명

- 단일 <code>Physics.Raycast()</code> 대신 <code>Physics.RaycastAll()</code>을 사용한다.
- Raycast 결과 중 자기 자신 또는 자기 자식 콜라이더는 무시한다.
- 가장 가까운 유효 충돌체가 플레이어 또는 플레이어 자식인지 판단한다.

### 현재 책임

- 에너미가 타겟을 볼 수 있는지 판단한다.
- 장애물과 자기 자신의 콜라이더를 구분해 근접 교전 판정 안정성을 높인다.

## 4.3 EnemyCombat.cs

### 이전 문제

- 공격 직후 에너미 상태가 추격/복귀/재정렬 조건과 섞이면서 다음 공격으로 자연스럽게 이어지지 않는 문제가 있었다.

### 변경 설명

- 공격 이후 짧은 재정렬 시간 판단을 <code>EnemyBrain</code>이 사용할 수 있게 보조한다.
- 공격 후 직접 추적 보정 시간과 연계된다.

### 현재 책임

- 공격 가능 거리, 공격 쿨타임, 근접 전투 인식 범위, 공격 직후 상태 판단을 담당한다.

# 5. 비주얼 / 포트레이트

## 5.1 AnimatorShadowSync.cs

### 이전 문제

- 캐릭터 메인 포트레이트와 Shadow 포트레이트가 중첩되어 보이는 문제가 있었다.
- Shadow 쪽 AnyPortrait를 비활성화하면 Animator 업데이트가 멈춰 포즈가 굳을 위험이 있다.
- 팀 내에서 렌더 구조 전체를 당장 재정리하기 어려워 최소 수정이 필요했다.

### 변경 설명

- <code>apPortrait shadowPortrait</code>를 추가했다.
- <code>targetShadowAlpha</code>, <code>shadowFadeTime</code>, <code>currentShadowAlpha</code>를 추가했다.
- <code>ResolveShadowPortrait()</code>로 Shadow Animator 주변의 AnyPortrait를 자동 탐색한다.
- <code>SetMeshAlphaAll()</code>과 <code>MoveTowards()</code>를 사용해 EnemyVisible의 투명화 방식과 유사하게 처리한다.
- Animator와 AnyPortrait 컴포넌트는 끄지 않는다.

### 현재 책임

- 원본 Animator와 Shadow Animator의 파라미터/레이어 가중치를 동기화한다.
- Shadow 포트레이트의 렌더 알파만 조절해 겹침 문제를 임시 완화한다.
- 추후 Shadow 연출을 다시 살릴 때는 <code>targetShadowAlpha</code> 값 또는 렌더 구조를 재검토해야 한다.

## 5.2 Player\_Yuan.prefab

### 변경 설명

- 탄환 라인 렌더러가 신규 <code>M_BulletLine</code> 머티리얼을 사용하도록 연결했다.
- 라인 렌더러 색상 차이로 맞았을 때/안 맞았을 때 색이 다르게 보이던 현상을 완화했다.
- Shadow 포트레이트 알파 제어는 <code>AnimatorShadowSync</code>에서 처리한다.

## 5.3 test\_Grenade.prefab

### 변경 설명

- 디코이 수류탄 스프라이트를 적용했다.
- 기존 과하게 큰 수류탄 크기를 줄였다.
- 체공 중 궤적을 보여주기 위해 TrailRenderer를 추가했다.
- TrailRenderer 머티리얼은 탄환 라인과 같은 계열 리소스를 재사용한다.

# 6. 리소스 추가

## 6.1 M\_BulletLine.mat

- 탄환 라인 렌더러와 수류탄 TrailRenderer에서 사용할 공용 머티리얼이다.
- 보라색 계열 라인 텍스처를 사용한다.

## 6.2 Trail-Bullet.png

- 라인/트레일에 사용할 텍스처 리소스다.

## 6.3 Skill\_Decoy\_Granade.png

- 디코이 수류탄 표시용 스프라이트 리소스다.

# 7. 정합성 메모

- 오늘 수정은 대부분 기존 구조를 유지하는 최소 수정 방식이다.
- 튜토리얼 UI는 데이터 확장과 패널 분리 중심으로 구현했다.
- 창고 UI는 기존 <code>InventorySlotUI</code>, <code>QuickSlotUI</code>, <code>ArtifactEquipSlotUI</code>의 역할을 유지하면서 누락된 참조와 등급 표시를 보완했다.
- 에너미 AI는 순찰/복귀 구조를 갈아엎지 않고, 디코이와 전투 타겟의 책임을 분리하는 방식으로 안정화했다.
- 캐릭터 Shadow 포트레이트 문제는 임시 완화다. 최종 해결은 카메라, 레이어, Shadow 전용 렌더 구조를 다시 잡는 것이 더 정석이다.

# 8. 다음에 확인할 것

- 튜토리얼 대화 UI 이미지의 나인슬라이스 적용 여부
- 창고 퀵슬롯/아티팩트 레어리티 프레임 스프라이트 최종 연결 상태
- 디코이 수류탄 이후 에너미가 플레이어 전투 타겟으로 복귀하는지 장시간 테스트
- Shadow 포트레이트 알파 0 처리로 인해 의도한 그림자 연출까지 사라지는지 확인
- <code>SampleSceneProfile.asset</code> 변경이 의도된 그래픽 설정 변경인지 확인
{% endraw %}
