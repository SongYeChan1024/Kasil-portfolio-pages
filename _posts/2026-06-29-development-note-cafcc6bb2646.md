---
title: "코드변경사항 기록//0629"
date: 2026-06-29 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "2026-06-29\\_inventory\\_sortie\\_chest\\_compare 2026-06-29\\_inventory\\_sortie\\_chest\\_restore 2026-06-29 개발 보고서 1. 작업 개요 오늘은 로비의 출격 준비 UI부터 인게임 퀵슬롯, 상자와 인벤토리 간 아이"
description: "2026-06-29\\_inventory\\_sortie\\_chest\\_compare 2026-06-29\\_inventory\\_sortie\\_chest\\_restore 2026-06-29 개발 보고서 1. 작업 개요 오늘은 로비의 출격 준비 UI부터 인게임 퀵슬롯, 상자와 인벤토리 간 아이"
published: true
migration_id: "38e36532580e80559a0ecafcc6bb2646"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-06-29\_inventory\_sortie\_chest\_compare]({% endraw %}{% post_url 2026-06-29-development-note-c76ed1235865 %}{% raw %})

# 2026-06-29\_inventory\_sortie\_chest\_restore

# 2026-06-29 개발 보고서

## 1. 작업 개요

오늘은 로비의 출격 준비 UI부터 인게임 퀵슬롯, 상자와 인벤토리 간 아이템 이동, 바닥 드랍 및 픽업까지 이어지는 아이템 흐름을 전체적으로 복구하고 정리하는 작업을 진행했다. 기존 상태에서는 출격 준비 UI와 실제 퀵슬롯 개수가 맞지 않는 부분이 있었고, 상자와 인벤토리의 연결이 일부 끊겨 있었으며, 드래그 앤 드랍 기반의 바닥 버리기 UI도 롤백된 흔적이 남아 있었다. 또한 인벤토리가 가득 찬 상태에서 바닥 아이템을 주울 경우 아이템이 사라지는 문제가 확인되어 이 부분도 함께 수정했다.

이번 작업의 핵심 목표는 현재 프로젝트 구조를 기준으로 출격 준비 3슬롯 표시, 다음 출격으로의 퀵슬롯 복원, 상자-인벤토리 양방향 이동, 바닥 드랍, 바닥 픽업 예외 처리까지 한 흐름으로 다시 이어지게 만드는 것이었다. 이 과정에서 예전 깃 구조를 그대로 되돌리는 방식이 아니라, 현재 브랜치에 남아 있는 구조와 최근 병합 흔적을 반영해 최대한 기존 책임을 유지하는 방향으로 정리했다.

## 2. 상세 작업 내용

### 2.1 출격 준비 UI 3슬롯 확장

우선 출격 준비 UI를 현재 인게임 퀵슬롯 구조와 맞추기 위해 2칸 기준으로 남아 있던 표시 구조를 3칸 기준으로 확장했다. <code>Canvas-SortiePrepare.prefab</code>에 3번째 슬롯용 아이콘, 이름, 수량 표시 오브젝트를 추가하고, <code>SortiePrepareUI.cs</code>에서 이를 참조하도록 연결했다.

동시에 <code>SortiePrepareUI</code>의 <code>Refresh()</code>는 단순 테스트 문자열을 뿌리는 구조에서 벗어나, 실제 퀵슬롯 캐시 데이터인 <code>slotTID</code>, <code>slotSprite</code>, <code>slotCount</code>를 기준으로 표시하도록 정리했다. 각 슬롯은 비어 있으면 기본 문구를 표시하고, 값이 있을 경우에는 TID를 기준으로 실제 <code>ItemData</code>를 찾아 아이템 이름과 개수를 출력하도록 구현해 표시 구조를 실데이터 기반으로 바꿨다.

### 2.2 다음 출격 연결 및 퀵슬롯 저장/복원 정리

출격 준비 UI만 3칸으로 늘리는 것으로 끝나지 않도록, 결과 정산 이후 다음 출격에서 다시 같은 구성이 보이도록 퀵슬롯 저장 및 복원 흐름도 함께 정리했다. <code>ResultManager.cs</code>에서는 기존 2칸 기준으로 관리하던 퀵슬롯 캐시를 3칸 기준으로 확장해 <code>slotTID3</code>, <code>slotSprite3</code>, <code>slotCount3</code>를 추가했고, 탈출 성공 여부에 따라 3번 슬롯 데이터까지 캐싱하도록 맞췄다.

또한 <code>PlayerSaveData.quickSlots</code> 저장 시에도 <code>quickSlots[2]</code>까지 함께 기록하도록 수정해, 현재 세션 종료 후 다음 세션으로 이어질 퀵슬롯 정보를 온전히 보관하게 만들었다. 이후 <code>SendQuickSlotCacheEvent()</code>에서는 <code>GlobalEventBus.QuickSlotLoad</code>를 0, 1, 2번 슬롯에 대해 모두 발송하도록 정리했다.

인게임 진입 후의 복원 흐름은 <code>GameManager.cs</code>에서 플레이어 생성 이후 <code>PlayerInventory.RestoreFromSave()</code>를 호출하는 구조를 기준으로 맞췄다. 이를 통해 <code>DemoScene</code> 진입 시 저장된 인벤토리와 퀵슬롯 정보가 다시 런타임 슬롯에 복원되고, 출격 준비 UI에서는 <code>OnRequestQuickSlotCache</code>와 <code>QuickSlotLoad</code> 이벤트를 통해 가장 최근 캐시를 다시 표시할 수 있게 됐다.

### 2.3 상자와 인벤토리 연동 복구

이후에는 상자와 인벤토리 간 연결이 끊겨 있던 부분을 현재 구조 기준으로 다시 정리했다. <code>ItemBox.cs</code>는 고정 슬롯 방식으로 상자 내부 데이터를 유지하는 구조로 정리했고, <code>GetItem</code>, <code>IsSlotEmpty</code>, <code>RemoveAmount</code>, <code>TryAddItem</code>, <code>TryAddToSlot</code> 같은 메서드를 통해 상자 자체가 독립적으로 슬롯 데이터를 관리하도록 만들었다.

<code>ChestUI.cs</code>는 상자 데이터를 직접 읽어와 슬롯을 생성하고 갱신하는 역할만 담당하도록 정리했다. 상자에서 인벤토리로 아이템을 옮길 때는 한 번에 전체를 옮기는 메서드와 특정 인벤토리 슬롯으로 옮기는 메서드를 나눠 두었고, 반대로 인벤토리에서 상자로 옮기는 흐름도 같은 방식으로 맞췄다. 이 과정에서 전부 이동하지 못한 수량은 남겨 두도록 처리해, 부분 이동이 가능한 구조로 정리했다.

추가로 상자 안의 아이템이 전부 비어도 UI가 즉시 닫히지 않도록 동작을 수정했다. 이전에는 상자가 비면 인터페이스가 바로 닫히는 흐름이 되살아나 있었는데, 이번 정리에서는 상자 데이터는 빈 슬롯으로만 유지하고 닫기 여부는 플레이어 입력이나 닫기 버튼에 맡기도록 구조를 되돌렸다.

### 2.4 인벤토리 드래그 앤 드랍 및 바닥 버리기 UI 복구

인벤토리에서 아이템을 바닥으로 버리는 기능도 함께 복구했다. <code>InventoryUI.cs</code>에는 드랍존 UI를 표시하거나 숨기는 메서드를 추가했고, <code>InventorySlotUI.cs</code>에서는 드래그 시작 시 드랍존을 노출하고 드래그 종료 시 다시 숨기도록 흐름을 맞췄다.

이를 위해 <code>InventoryDropZoneUI.cs</code>를 추가해, 슬롯이 드랍존 위에 놓였을 때 <code>GlobalEventBus.OnInventoryDropRequested</code> 이벤트를 발생시키도록 구현했다. 실제 월드 드랍 생성은 <code>InventoryPresenter.cs</code>가 담당하도록 두어, UI는 입력만 전달하고 생성 책임은 Presenter에 남겨 두는 구조를 유지했다.

또한 상자 UI가 열려 있을 때는 인벤토리 드랍존을 사용할 수 없도록 <code>SetDropZoneAvailable(!isChestOpen)</code> 형태로 제어했다. 이 처리로 인해 같은 인벤토리 UI라도 일반 인벤토리 상태와 상자 연동 상태에서 동작이 섞이지 않도록 분리할 수 있었다.

### 2.5 인벤토리 가득 찼을 때 아이템 증발 문제 수정

오늘 작업에서 가장 직접적인 버그 수정은 바닥 아이템 픽업 예외 처리였다. 기존 <code>DropItem.cs</code>는 플레이어가 상호작용하면 실제로 인벤토리에 들어갔는지와 무관하게 곧바로 <code>Destroy(gameObject)</code>를 호출하는 구조였기 때문에, 인벤토리가 가득 찬 상황에서도 월드 아이템이 사라질 수 있었다.

이 문제를 해결하기 위해 <code>DropItem</code>은 먼저 현재 상호작용한 플레이어를 찾아 해당 플레이어의 픽업 처리 결과를 확인한 뒤, 실제로 받아들인 수량만큼만 월드 아이템 수량을 줄이도록 수정했다. 전부 주웠으면 오브젝트를 삭제하고, 일부만 들어갔으면 남은 수량을 유지하며, 아예 못 주웠으면 바닥에 그대로 남도록 바꿨다.

이에 맞춰 <code>InventoryPresenter.cs</code>에는 <code>TryPickUpItem()</code> 메서드를 추가해, 플레이어가 실제로 몇 개를 받을 수 있었는지 계산하고 남은 수량을 반환하도록 정리했다. 이 메서드는 무기, 소모품, 특수 아이템 분기까지 기존 아이템 분류 기준을 유지하면서, 실제 변화가 있을 때만 저장이 일어나도록 했다. 그 결과 픽업 성공/실패가 눈에 보이는 상태와 일치하도록 보정되었다.

### 2.6 인벤토리 오픈 상태 입력 처리 보정

이전 구현에서는 인벤토리를 열었을 때 곧바로 UI 전용 액션맵으로 전환되면서 이동과 상호작용이 막히는 경우가 있었는데, 이번 작업에서는 일반 인벤토리와 상자 UI를 구분해서 처리하도록 정리했다. <code>LocalInputReader.cs</code>에 <code>isInventoryOpen</code> 상태를 두고, 일반 인벤토리에서는 <code>Player</code> 액션맵을 유지한 채 공격과 퀵슬롯 사용만 막도록 수정했다.

이를 통해 인벤토리를 연 상태에서도 플레이어 이동과 <code>F</code> 상호작용은 유지되고, 상자 UI를 열었을 때만 <code>SwitchToUIMap()</code>으로 전환되도록 구조를 나눴다. 결과적으로 일반 인벤토리 조작과 컨테이너 조작의 입력 방식이 서로 덜 충돌하게 되었다.

## 3. 구조 정리 및 병합 흔적 대응

오늘 작업은 단순 기능 추가보다, 예전 깃 구조와 현재 브랜치 구조가 섞여 있던 흔적을 현재 프로젝트 기준으로 다시 맞추는 성격도 강했다. 특히 <code>PlayerInventory</code>, <code>InventoryPresenter</code>, <code>ChestUI</code>, <code>StorageInventoryUI</code>, <code>SortiePrepareUI</code>처럼 여러 시스템이 동시에 연결된 스크립트는 예전 버전을 그대로 복원하면 오히려 현재 브랜치와 충돌할 수 있었기 때문에, 최근 구조를 유지하면서 필요한 메서드와 데이터만 보강하는 방향으로 정리했다.

이 과정에서 <code>InventorySlotData</code>에 <code>itemData</code>를 안정적으로 유지하도록 보완한 것도 중요했다. 슬롯에 단순히 TID와 수량만 남는 구조에서는 상자 이동, 드랍, UI 이름 출력, 복원 처리 때마다 메타데이터를 다시 찾아야 해서 연결이 쉽게 깨졌는데, 이번에는 <code>AddItem</code>, <code>TryAddToSlot</code>, <code>ClearSlot</code>, <code>RestoreFromSave</code> 등 여러 구간에서 <code>itemData</code>까지 함께 유지하도록 맞췄다.

또한 <code>ItemBox</code> 프리팹은 이름 오타가 남아 있던 <code>ItermBox</code>에서 <code>ItemBox</code>로 정리했고, 드랍용 프리팹 및 아이템 ScriptableObject의 참조도 현재 구조에 맞게 다시 연결했다. 이로 인해 인스펙터에서 스크립트가 빠져 보이거나 드랍 프리팹 연결이 끊겨 있던 흔적도 함께 정리할 수 있었다.

## 4. 검증 결과

이번 작업 이후 <code>dotnet build UnityProject_LucidDiver.sln -nologo</code> 기준으로 전체 빌드를 다시 확인했고, 현재는 오류 없이 빌드가 통과하는 상태다. 남아 있는 것은 기존 프로젝트에 있던 unused field 경고와 <code>System.Net.Http</code> 버전 충돌 관련 경고 정도이며, 이번 수정 때문에 새로 발생한 컴파일 오류는 없는 것을 확인했다.

기능 기준으로는 다음 항목들이 연결된 상태로 정리되었다고 볼 수 있다. 출격 준비 UI 3슬롯 표시, 결과 정산 이후 퀵슬롯 캐시 전달, 인게임 진입 후 퀵슬롯 복원, 상자-인벤토리 양방향 이동, 인벤토리 드랍존을 통한 바닥 버리기, 인벤토리 가득 참 상태에서의 픽업 증발 방지까지가 현재 범위에서 반영되었다.

## 5. 결과 및 정리

오늘 작업을 통해 로비의 출격 준비 화면, 인게임 인벤토리, 퀵슬롯, 상자 UI, 월드 드랍 및 픽업이 다시 하나의 흐름으로 이어지도록 정리할 수 있었다. 특히 출격 준비 UI가 실제 퀵슬롯 구조와 맞지 않던 문제, 상자와 인벤토리 연결이 끊겨 있던 문제, 드래그 앤 드랍 기반 바닥 버리기 UI가 빠져 있던 문제, 인벤토리 가득 참 상태에서 아이템이 사라지던 문제를 한 번에 정리한 것이 이번 작업의 핵심 성과였다.

또한 이번 정리는 단순 복원이 아니라 현재 프로젝트 구조를 기준으로 책임을 다시 맞추는 방향으로 진행되었다는 점에서 의미가 있었다. 예전 깃의 기능을 참고하되 그대로 롤백하지 않고, 현재 남아 있는 구조와 병합 이후의 상태를 존중하면서 기능을 다시 연결했기 때문에 이후 다른 공용 시스템과도 비교적 자연스럽게 이어질 수 있는 상태가 되었다.

## 6. 향후 작업 계획

다음 단계에서는 이번에 복구한 인벤토리/상자 흐름을 실제 플레이 기준으로 추가 검증할 예정이다. 특히 상자에서 부분 이동이 여러 번 반복될 때 수량이 정확히 유지되는지, 바닥 드랍 후 재획득 시 퀵슬롯 수량 동기화가 계속 정상적으로 반영되는지, 출격 준비 UI가 여러 번 열리고 닫혀도 캐시가 안정적으로 유지되는지 확인이 필요하다.

별도 범위로 남아 있는 작업도 있다. <code>storageSlots</code> 기준 결과 보관, 동조율 저장과 로비 반영, 무기 장착 시각화 문제는 이번 정리 범위에 포함하지 않았기 때문에 이후 담당 범위가 정해지면 별도 작업으로 이어서 정리할 계획이다.
{% endraw %}
