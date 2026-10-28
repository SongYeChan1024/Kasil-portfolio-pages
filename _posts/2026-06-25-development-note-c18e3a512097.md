---
title: "코드변경사항 기록"
date: 2026-06-25 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-06-25\\_script\\_full\\_compare 전체 구조 변화 기존에는 ItemBox 가 단순히 아이템을 담아두는 박스에 가까웠고, 인벤토리와 체스트가 같은 슬롯 구조로 맞물려 움직이는 형태는 아니었어. 또 인벤토리 슬롯도 TID , 수량, 아이콘 중심이라 체스트로 다시 "
description: "2026-06-25\\_script\\_full\\_compare 전체 구조 변화 기존에는 ItemBox 가 단순히 아이템을 담아두는 박스에 가까웠고, 인벤토리와 체스트가 같은 슬롯 구조로 맞물려 움직이는 형태는 아니었어. 또 인벤토리 슬롯도 TID , 수량, 아이콘 중심이라 체스트로 다시 "
published: true
migration_id: "38a36532580e802e8f84c18e3a512097"
migration_status: "published"
migration_flags: ["local_code_link_unlinked"]
---

{% raw %}
[2026-06-25\_script\_full\_compare]({% endraw %}{% post_url 2026-06-25-development-note-c8dd2d717f26 %}{% raw %})

<b>전체 구조 변화</b>

기존에는 <code>ItemBox</code>가 단순히 아이템을 담아두는 박스에 가까웠고, 인벤토리와 체스트가 같은 슬롯 구조로 맞물려 움직이는 형태는 아니었어. 또 인벤토리 슬롯도 <code>TID</code>, 수량, 아이콘 중심이라 체스트로 다시 옮길 때 필요한 원본 <code>ItemData</code>를 안정적으로 참조하기 어려웠다.

지금은 <code>ItemBox</code>를 고정 슬롯을 가진 컨테이너 박스로 바꾸고, 인벤토리와 체스트가 각각 슬롯 단위로 데이터를 주고받도록 구조를 바꿨다.

<p>
 거기에 우클릭 이동, 드래그 앤 드롭, 드랍존을 통한 바닥 드랍까지 연결할 수 있게 입력/이벤트/UI 흐름을 정리한 상태이다.
</p>

<b>스크립트별 정리</b>

- \ItemBox.cs\: 기존에는 상자 안 아이템 목록을 가변적으로 다루는 쪽에 가까웠다면, 지금은 <code>slotCapacity</code>를 기준으로 고정 슬롯을 유지하는 컨테이너 구조로 바꿨어. 빈 칸도 실제 슬롯으로 유지되게 했고, <code>IsSlotEmpty</code>, <code>ClearSlot</code>, <code>RemoveAmount</code>, <code>TryAddItem</code>, <code>TryAddToSlot</code>을 추가해서 체스트 UI가 슬롯 단위로 정확하게 읽고 쓰게 만들었어. 랜덤 생성도 이제는 슬롯을 지우고 다시 채우는 방식이 아니라 고정 슬롯 안을 초기화한 뒤 채우는 방식으로 정리했어.
- \InventorySlotData.cs\: 기존에는 슬롯이 <code>TID</code>, 수량, 아이콘 정도만 들고 있었는데, 지금은 <code>ItemData itemData</code>를 추가해서 원본 아이템 데이터를 직접 참조하게 바꿨어. 이 변경 때문에 인벤토리에서 체스트로, 또는 체스트에서 인벤토리로 아이템을 옮길 때 실제 아이템 정보를 잃지 않게 됐어.
- \PlayerInventory.cs\: 기존에는 인벤토리 추가/사용/스왑 중심이었다면, 지금은 체스트 연동을 위해 슬롯 제어 기능을 더 세분화했어. <code>TryAddToSlot</code>, <code>GetSlot</code>, <code>GetSlotItemData</code>, <code>IsSlotEmpty</code>, <code>RemoveAmount</code>, <code>ClearSlot</code>을 정리했고, 슬롯 스왑할 때도 <code>itemData</code>까지 같이 바뀌게 수정했어. 덕분에 체스트와 인벤토리가 같은 규칙으로 수량 이동과 슬롯 지정 이동을 처리할 수 있게 됐어.
- \ChestUI.cs\: 기존에는 상자 UI가 열릴 때 슬롯을 만들고, 체스트에서 인벤토리로 꺼내는 기능 위주였다면 지금은 양방향 이동을 담당하는 중심 UI가 됐어. <code>Bind</code>, <code>CreateSlots</code>, <code>RefreshAll</code>, <code>RefreshSlot</code> 구조로 고정 슬롯 UI를 유지하게 했고, <code>TryMoveToInventory</code>, <code>TryMoveToInventorySlot</code>, <code>TryMoveFromInventory</code>, <code>TryMoveFromInventorySlot</code>을 추가해서 우클릭 이동과 드래그 지정 이동을 모두 처리하게 만들었어.
- \ChestSlotUI.cs\: 기존에는 우클릭으로 인벤토리로 꺼내는 기능 정도만 있었는데, 지금은 드래그 시작/이동/종료/드롭까지 처리하게 바꿨어. <code>itemInfo</code>, <code>CanvasGroup</code>, <code>mainCanvas</code>를 이용해서 체스트 슬롯 아이콘도 실제로 끌어다 놓을 수 있게 했고, 인벤토리 슬롯 위에 드롭하면 특정 칸으로 옮기도록 연결했어.
- \InventoryUI.cs\: 기존에는 인벤토리 슬롯 생성과 갱신만 담당했는데, 지금은 드랍존까지 함께 관리하는 UI가 됐어. <code>dropZone</code>, <code>CanvasGroup</code>, <code>SetDropZoneAvailable</code>, <code>ShowDropZone</code>, <code>HideDropZone</code>를 추가해서 드래그 중일 때만 드랍존이 보이게 하고, 체스트가 열려 있을 때는 드랍존을 끄도록 바꿨어.
- \InventorySlotUI.cs\: 기존에는 인벤토리 슬롯끼리 드래그 스왑하는 역할이 중심이었는데, 지금은 체스트와의 상호작용까지 맡게 됐어. 우클릭 시 체스트가 열려 있으면 상자로 보내도록 했고, 드래그 중에는 드랍존을 띄우고, 체스트 슬롯이나 드랍존에 내려놓았을 때 각각 다른 동작을 하도록 분기했어.
- \InventoryDropZoneUI.cs\: 이건 이번에 새로 만든 스크립트야. 인벤토리 슬롯을 드랍존 위에 놓았을 때 <code>GlobalEventBus.OnInventoryDropRequested</code>를 호출해서 Presenter 쪽에서 실제 월드 드랍 생성을 처리하게 연결했어.
- \InventoryPresenter.cs\: 기존에는 아이템 줍기, 인벤토리 UI 열기/닫기, 일부 장비 처리 중심이었다면, 지금은 인벤토리/체스트 전체 중재자 역할로 확장됐어. <code>OnItemBoxOpened</code>, <code>OnInventoryDropRequested</code>를 구독하게 했고, 상자 상호작용 시 인벤토리 UI와 체스트 UI를 같이 열고 닫는 흐름을 맡게 했어. 또 인벤토리 슬롯을 드랍존에 놓았을 때 <code>dropPrefab</code>으로 실제 바닥 드랍 오브젝트를 생성하고 인벤토리 수량을 차감하는 처리도 여기에 들어갔어.
- \LocalInputReader.cs\: 기존에는 인벤토리를 열 때 바로 UI 맵으로 넘기는 쪽에 가까웠다면, 지금은 일반 인벤토리는 Player 맵을 유지한 채 여닫도록 바꿨어. <code>isInventoryOpen</code> 상태값과 <code>SetInventoryOpenState</code>를 추가했고, <code>E</code> 키를 토글처럼 처리하도록 바꿨고, 인벤토리가 열려 있을 때 공격과 퀵슬롯은 막고 상호작용은 유지하는 방향으로 정리했어.
- \GlobalEventBus.cs\: 기존 이벤트 구조에 <code>OnItemBoxOpened</code>와 <code>OnInventoryDropRequested</code>를 추가했어. 이 덕분에 <code>ItemBox -&gt; InventoryPresenter</code>, <code>InventoryDropZoneUI -&gt; InventoryPresenter</code> 흐름이 직접 참조 없이 이벤트로 연결되게 됐어.
- \ItemData.cs\: 기존에는 아이콘과 사용 프리팹 정도만 참조했는데, 지금은 <code>dropPrefab</code> 필드를 추가해서 인벤토리에서 버릴 때 어떤 월드 드랍 오브젝트를 생성할지 데이터에서 직접 들고 있게 바꿨어.

<b>오늘 한 일 요약</b>

- <code>ItemBox</code>를 고정 슬롯 컨테이너 구조로 정리했다.
- 인벤토리 슬롯 데이터에 <code>ItemData</code> 참조를 추가해서 체스트와 양방향 이동이 가능하게 만들었다.
- <code>PlayerInventory</code>에 슬롯 단위 추가/제거/비움/조회 함수를 정리했다.
- <code>ChestUI</code>, <code>ChestSlotUI</code>를 체스트 전용 슬롯 UI 구조로 확장했다.
- <code>InventoryUI</code>, <code>InventorySlotUI</code>, <code>InventoryDropZoneUI</code>를 이용해서 드랍존 기반 버리기 흐름을 만들었다.
- <code>InventoryPresenter</code>에서 인벤토리/체스트/월드 드랍 흐름을 한 곳에서 중재하도록 정리했다.
- <code>LocalInputReader</code>를 수정해서 <code>E</code>와 <code>F</code> 입력 흐름이 현재 UI 구조와 맞게 동작하도록 바꿨다.
- <code>GlobalEventBus</code>, <code>ItemData</code>를 보강해서 상자 열기와 월드 드랍 생성을 이벤트/데이터 구조로 연결했다.
{% endraw %}
