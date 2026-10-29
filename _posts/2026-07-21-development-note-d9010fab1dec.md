---
title: "코드 변경 사항 기록//0721"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "2026-07-21 전체 스크립트 비교 정리 1. 한 줄 결론 2026-07-21에는 다크 스피릿의 피격 반응과 다중 추격 정합성을 보강하고, 에너미 처치 보상·튜토리얼 확정 보상 상자를 분리했으며, 인벤토리와 상자 사이에서 실제 드롭될 슬롯을 명확히 표시하도록 개선했습니다. 해당 작업"
description: "2026-07-21 전체 스크립트 비교 정리 1. 한 줄 결론 2026-07-21에는 다크 스피릿의 피격 반응과 다중 추격 정합성을 보강하고, 에너미 처치 보상·튜토리얼 확정 보상 상자를 분리했으며, 인벤토리와 상자 사이에서 실제 드롭될 슬롯을 명확히 표시하도록 개선했습니다. 해당 작업"
published: true
migration_id: "3a436532580e819a991bd9010fab1dec"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-21 전체 스크립트 비교 정리]({% endraw %}{% post_url 2026-07-21-development-note-c7102ff4b5dd %}{% raw %})

## 1. 한 줄 결론

2026-07-21에는 다크 스피릿의 피격 반응과 다중 추격 정합성을 보강하고, 에너미 처치 보상·튜토리얼 확정 보상 상자를 분리했으며, 인벤토리와 상자 사이에서 실제 드롭될 슬롯을 명확히 표시하도록 개선했습니다. 해당 작업을 기준으로 에너미 및 인벤토리 관련 기능은 동결 전 최종 안정화 단계에 들어갑니다.

## 2. 기록 범위

- 작성 기준: 송예찬이 직접 작성하거나 수정한 커밋만 포함
- 기준 날짜: 2026-07-21
- 기준 브랜치: <code>Release-0.3.3</code>
- 포함 커밋: <code>2a81ecc</code>, <code>c92a983</code>
- 제외 범위: 팀원 커밋 <code>c823a04</code>, 병합 커밋 <code>a51fb66</code>·<code>b88e064</code>, 코드 변경이 없었던 논의·인스펙터 확인
- 비교 기준: 각 스크립트를 해당 작업 직전 부모 커밋과 오늘 마지막 직접 수정 상태로 비교
- 현재 상태: 작업 트리 clean, 두 직접 커밋 모두 현재 HEAD에 포함

## 3. 직접 작성한 커밋

### 3-1. <code>2a81ecc</code> — 에너미 전투 피드백 및 처치 보상 시스템 완성

- 다크 스피릿 피격 플래시와 짧은 경직 추가
- 공격 중 피격 시 공격 상태와 콤보를 유지하도록 애니메이션 히트 스톱만 적용
- 피격 시 유효한 플레이어를 즉시 전투 타깃으로 인식
- 개체별 접근 지점과 NavMesh 회피 우선순위를 분산해 겹침 완화
- 공격·추격·디코이·패트롤 복귀 전환 정합성 보강
- 에너미 처치 시 씬별 설정 확률에 따라 전용 보상 상자 생성
- 에너미 전용 상자의 고등급 아티팩트 보정과 튜토리얼 상자의 TID 1001 확정 지급 적용
- 관련 씬, 다크 스피릿, 기본·에너미·튜토리얼 상자 프리팹 설정 반영

### 3-2. <code>c92a983</code> — 실제 드롭 예정 슬롯 하이라이트

- 아이템 드래그 중 Unity가 실제로 선택한 인벤토리·상자 슬롯만 강조
- 슬롯 사이에서도 기존 드롭 판정 결과와 동일한 대상 슬롯 표시
- 옅은 흰색 채움과 테두리 펄스 효과 적용
- 드롭, 취소, 포인터 이탈, UI 비활성화 시 강조 초기화
- 하이라이트의 Raycast 차단을 해제해 기존 입력과 이동·교환 로직 유지

## 4. 코드 변경 사항

### 4-1. 에너미 피격 피드백

- <code>EnemyStatus</code>가 비치명 실제 피해 이벤트를 개체 단위로 전달합니다.
- <code>EnemyVisible</code>은 공유 머티리얼을 변경하지 않고 피격 개체의 AnyPortrait 색상만 짧게 밝은 보라색으로 전환합니다.
- <code>EnemyMovement</code>의 코드 기본값은 일반 경직 0.08초, 공격 히트 스톱 0.04초입니다.
- 현재 <code>Enemy-DarkSpirit.prefab</code>의 실제 직렬화 값은 피격 플래시 0.1초, 일반 경직 0.3초, 공격 히트 스톱 0.1초, 재적용 간격 0.1초이며 런타임에는 프리팹 값이 우선 적용됩니다.
- <code>EnemyAnimator</code>는 <code>unscaledTime</code> 기준으로 재생 속도를 잠시 0으로 만들고 안전하게 복구합니다.
- 연속 피격 재적용 간격을 두어 무한 경직을 방지합니다.

### 4-2. 피격 인식과 다중 추격 정합성

- 실제 피해를 받으면 활동 반경 안의 가장 가까운 플레이어를 전투 타깃으로 즉시 등록합니다.
- 디코이 이동 타깃과 플레이어 전투 타깃을 분리해 디코이 종료 후 기존 전투 타깃으로 복귀합니다.
- 적마다 플레이어 주변의 서로 다른 NavMesh 접근 슬롯을 계산합니다. 현재 다크 스피릿 프리팹은 접근 반경 3.5, Agent Radius 0.7을 사용합니다.
- 개체 고유값을 기준으로 <code>avoidancePriority</code>를 분산하며, 다크 스피릿 프리팹 범위는 40\~60입니다.
- 공격 가능 거리와 쿨다운 조건을 분리하고, 공격 거리 안에서는 플레이어 중심으로 계속 파고들지 않도록 정지 조건을 제공합니다.

### 4-3. 에너미·튜토리얼 상자 보상

- <code>SpawnManager</code>가 각 에너미의 로컬 사망 이벤트를 구독하고 씬별 확률을 통과했을 때만 <code>ItemBox_Enemy</code>를 생성합니다. 현재 <code>DemoScene</code>과 <code>DemoScene Additive</code>는 25%, <code>DemoScene Patrol</code>은 20%, <code>DemoScene Tutorial</code>은 비활성입니다.
- 사망 위치는 NavMesh 위로 보정하며, 생성된 상자는 에너미가 속한 씬으로 이동합니다.
- <code>ItemBox</code>에 랜덤 상자와 분리된 확정 TID 보상 목록을 추가했습니다.
- <code>ItemBox_Tutorial</code>은 랜덤 생성을 끄고 TID 301×5, 302×5, 401×1, 1001×1을 확정 지급합니다.
- <code>ItemBox_Enemy</code>는 3\~5종을 생성하며 카테고리 가중치는 Memory/Consume/Artifact 40/40/20, 아티팩트 등급 가중치는 40/30/15/10/5로 기본 상자와 분리했습니다.
- <code>itemCategory</code> 직렬화 번호를 명시해 기존 씬과 프리팹 데이터가 열거형 순서 변경에 흔들리지 않게 했습니다.

### 4-4. 실제 드롭 대상 슬롯 표시

- <code>InventorySlotUI</code>와 <code>ChestSlotUI</code>가 현재 <code>pointerDrag</code>와 실제 <code>OnDrop</code> 경로를 기준으로 하이라이트 여부를 판단합니다.
- 하이라이트는 프리팹의 <code>DropTargetHighlight</code> Canvas 계층에서 색상·테두리를 담당합니다.
- 강조 이미지는 <code>raycastTarget = false</code>, CanvasGroup은 <code>blocksRaycasts = false</code>로 설정했습니다.
- 기존 슬롯 크기, 드롭 히트 영역, 교환 및 이동 판정은 변경하지 않았습니다.
- 아티팩트 해제처럼 특정 목적지 인덱스를 사용하지 않는 기존 경로는 잘못된 안내를 피하기 위해 개별 슬롯 강조에서 제외합니다.

## 5. 직접 수정한 스크립트

### 에너미·보상

- <code>Assets/02_Scripts/Define/Enums.cs</code>
- <code>Assets/02_Scripts/Manager/GameSystem/SpawnManager.cs</code>
- <code>Assets/02_Scripts/Presenter/EnemyPresenter.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyAnimator.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyBrain.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyCombat.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyMovement.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyStatus.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyVisible.cs</code>
- <code>Assets/02_Scripts/System/ItemBox.cs</code>

### 인벤토리·상자 드롭 강조

- <code>Assets/02_Scripts/Define/InventoryItemPlacementPolicy.cs</code>
- <code>Assets/02_Scripts/UI/Game/InventorySlotUI.cs</code>
- <code>Assets/02_Scripts/UI/Game/ChestSlotUI.cs</code>
- 전체 비교 대상: 13개
- 신규 C# 스크립트: 없음
- 기존 C# 수정: 13개

## 6. 직접 수정한 비스크립트 자산

- 씬: <code>DemoScene.unity</code>, <code>DemoScene Additive.unity</code>, <code>DemoScene Patrol.unity</code>, <code>DemoScene Tutorial.unity</code>, <code>TutorialScene.unity</code>
- 에너미 프리팹: <code>Enemy-DarkSpirit.prefab</code>
- 상자 프리팹: <code>ItemBox.prefab</code>, <code>ItemBox_Enemy.prefab</code>, <code>ItemBox_Tutorial.prefab</code>
- UI 프리팹: <code>UI-InventorySlot.prefab</code>, <code>UI-ChestSlot.prefab</code>
- 아이템 데이터: 테스트 소비 아이템 3종의 직렬화 데이터
- 참고: 후속 팀원 변경이 섞인 씬과 기본 상자는 오늘 직접 커밋 <code>2a81ecc</code>의 변경분만 기록 범위로 봅니다.

## 7. 전체 스크립트 비교 정리

비교 문서는 각 파일을 <code>이전 스크립트 전체 → 변경 설명 → 현재 스크립트 전체</code> 순서로 기록했습니다.

[2026-07-21 전체 스크립트 비교 정리]({% endraw %}{% post_url 2026-07-21-development-note-c7102ff4b5dd %}{% raw %})

## 8. 검증 결과

- Git 작업 트리 clean 확인
- 오늘 직접 작성한 2개 커밋과 팀원·병합 커밋 분리 확인
- 전체 비교 대상 13개 C# 파일이 두 직접 커밋 이후 현재 HEAD까지 변경되지 않았음을 확인
- 드롭 하이라이트 이미지가 Raycast를 차단하지 않도록 프리팹 참조 확인
- 프리팹 로컬 파일 ID 중복과 최근 Unity 컴파일·프리팹 파싱 오류가 없음을 확인

## 9. 기능 동결 전 회귀 확인 사항

- 다크 스피릿 단일·다수 피격 시 플래시와 경직이 공격 흐름을 끊지 않는지 확인
- 2마리, 5마리, 10마리 추격에서 접근 슬롯과 회피 우선순위가 겹침을 완화하는지 확인
- 디코이 종료 후 플레이어 전투 타깃으로 정상 복귀하는지 확인
- 에너미 처치 상자가 각 씬 설정값인 25%·25%·20%에 맞게 생성되고 NavMesh 지면에 놓이는지 확인
- 튜토리얼 상자에서 TID 301×5, 302×5, 401×1, 1001×1이 확정 지급되는지 확인
- 인벤토리·상자 슬롯 경계에서 표시된 슬롯과 실제 드롭 슬롯이 일치하는지 확인
- 드래그 취소와 UI 강제 종료 후 하이라이트 잔상이 남지 않는지 확인

[2026-07-21\_전체\_스크립트\_비교\_정리]({% endraw %}{% post_url 2026-07-21-development-note-c7102ff4b5dd %}{% raw %})
{% endraw %}
