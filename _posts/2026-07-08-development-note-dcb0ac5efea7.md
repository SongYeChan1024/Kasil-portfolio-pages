---
title: "트러블 슈팅"
date: 2026-07-08 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-08\\_artifact\\_system\\_troubleshooting 1. 문서 개요 이 문서는 2026년 7월 8일 아티팩트 루팅/장착 시스템을 구현하면서 발생한 문제와 해결 과정을 정리한 트러블슈팅 문서다. 오늘 발생한 문제들은 대부분 “데이터는 생겼지만 기존 인벤토리 "
description: "2026-07-08\\_artifact\\_system\\_troubleshooting 1. 문서 개요 이 문서는 2026년 7월 8일 아티팩트 루팅/장착 시스템을 구현하면서 발생한 문제와 해결 과정을 정리한 트러블슈팅 문서다. 오늘 발생한 문제들은 대부분 “데이터는 생겼지만 기존 인벤토리 "
published: false
migration_id: "39736532580e80d59c79dcb0ac5efea7"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
# 2026-07-08\_artifact\_system\_troubleshooting

## 1. 문서 개요

이 문서는 2026년 7월 8일 아티팩트 루팅/장착 시스템을 구현하면서 발생한 문제와 해결 과정을 정리한 트러블슈팅 문서다.

오늘 발생한 문제들은 대부분 “데이터는 생겼지만 기존 인벤토리 흐름이 아티팩트를 모르는 상태”에서 발생했다. 즉, 아티팩트는 새 아이템 타입이기 때문에 데이터 로드, 루팅, 획득, 장착, UI 표시, 저장까지 각각의 흐름에 모두 연결이 필요했다.

## 2. 문제 1: 아티팩트 아이템이 인벤토리에 들어가지 않음

### 현상

아이템 박스에서 아티팩트가 생성되거나, 월드 드롭 아이템으로 아티팩트가 나와도 플레이어 인벤토리에 정상적으로 들어가지 않았다.

### 원인

<code>InventoryPresenter.TryPickUpItem()</code>은 TID 범위를 기준으로 아이템을 분류하고 있었다.

기존 처리 범위는 다음과 같았다.

```txt
100번대: 무기
300번대: 소모품
400번대: 특수 아이템
```

하지만 새로 추가한 아티팩트는 <code>1001~1005</code> TID를 사용했다. 기존 코드에는 1000번대 아이템을 처리하는 분기가 없었기 때문에 <code>Unknown item TID</code>로 빠질 수 있는 상태였다.

### 해결

1000번대 아티팩트를 인벤토리에 추가하는 분기를 넣었다.

```txt
else if (1000 <= pickedItemTID && pickedItemTID < 1100)
{
    remain = playerInventory.AddItem(data, remain);
}
```

### 정리

새 아이템 타입을 추가할 때는 데이터만 추가하는 것으로 끝나지 않는다.

아이템을 획득하는 진입점에서도 해당 타입을 인식할 수 있어야 한다.

## 3. 문제 2: 아이템 박스에서 아티팩트가 나오지 않음

### 현상

아티팩트 데이터를 JSON에 추가했지만 아이템 박스 루팅 결과에는 아티팩트가 포함되지 않았다.

### 원인

기존 <code>ItemBox</code>는 정해진 후보 아이템 목록에서만 아이템을 뽑는 구조였다.

아티팩트라는 새 카테고리가 생겼지만, 박스 루팅 로직에는 <code>artifact</code> 카테고리를 선택하는 확률 구조가 없었다.

### 해결

<code>ItemBox</code>에 카테고리 기반 루팅 구조를 추가했다.

기본 확률은 다음과 같이 설정했다.

```txt
소모품: 60
기억조각: 30
아티팩트: 10
```

아티팩트 카테고리가 선택되면 다시 아티팩트 등급별 가중치로 실제 TID를 선택하도록 만들었다.

```txt
normal: 55
uncommon: 25
rare: 12
epic: 6
legend: 2
```

### 정리

루팅 시스템은 “아이템 데이터 존재 여부”와 별개로 “그 아이템을 뽑는 규칙”이 필요하다.

데이터가 있어도 루팅 테이블에 포함되지 않으면 게임에서는 등장하지 않는다.

## 4. 문제 3: 장착 슬롯 중 일부만 이미지가 표시됨

### 현상

아티팩트 장비칸 3칸 중 한 칸만 이미지가 정상적으로 적용되고, 나머지 두 칸은 이미지가 비어 있거나 이상하게 보였다.

### 원인

<code>ArtifactEquipSlotUI</code>에 새로 추가한 필드들이 프리팹의 세 장비칸에 모두 연결되어 있지 않았다.

필요한 참조는 다음과 같았다.

```txt
slotFrameImage
rarityFrameImage
itemImage
emptySlotSprite
normalSlotSprite
uncommonSlotSprite
rareSlotSprite
epicSlotSprite
legendSlotSprite
```

스크립트에는 필드가 추가되었지만, 프리팹 직렬화 데이터에는 세 칸 모두 동일하게 연결되어 있지 않았다.

### 해결

<code>Canvas-InventoryUI.prefab</code>의 <code>EquipSlot_0</code>, <code>EquipSlot_1</code>, <code>EquipSlot_2</code>에 모두 동일한 슬롯 프레임 참조를 연결했다.

각 장비칸은 다음 구조를 사용한다.

```txt
EquipSlot_X
├─ Image-Background
├─ Image-RarityFrame
└─ Image-EquipItemImage
```

그리고 등급별 슬롯 이미지는 일반 인벤토리 슬롯에서 쓰던 이미지를 그대로 연결했다.

### 정리

UI 프리팹에서 같은 역할을 하는 슬롯이 여러 개 있을 때는, 스크립트 필드가 모든 슬롯에 동일하게 연결되어 있는지 확인해야 한다.

한 칸만 정상이고 나머지가 이상하다면 코드보다 프리팹 참조 누락을 먼저 의심할 수 있다.

## 5. 문제 4: 레어리티 색상이 장비칸에서 제대로 나뉘지 않음

### 현상

아티팩트를 장착해도 <code>normal</code>, <code>uncommon</code>, <code>rare</code>, <code>epic</code>, <code>legend</code>에 따라 슬롯 이미지가 바뀌지 않았다.

### 원인

장착 슬롯 UI가 아이템 아이콘만 표시하고 있었고, <code>artifact.itemGrade</code>를 기준으로 등급 프레임을 바꾸는 처리가 없었다.

또한 등급별 스프라이트 참조가 비어 있으면, 코드가 등급을 알아도 보여줄 이미지가 없었다.

### 해결

<code>ArtifactEquipSlotUI</code>에 등급 프레임 갱신 로직을 추가했다.

핵심 흐름은 다음과 같다.

```txt
장착 아이템 없음
-> itemImage 숨김
-> rarityFrameImage 숨김
-> emptySlotSprite 표시

장착 아이템 있음
-> itemImage 표시
-> artifact.itemGrade 확인
-> 해당 등급의 슬롯 프레임 표시
```

등급별 프레임 선택은 <code>GetSlotFrameSprite()</code>에서 처리한다.

### 정리

아이템 등급 UI는 데이터, 코드, 프리팹 참조가 모두 연결되어야 정상적으로 보인다.

```txt
JSON itemGrade
-> ItemData.itemGrade
-> ArtifactEquipSlotUI.ApplySlotFrame()
-> rarityFrameImage.sprite
```

이 중 하나라도 끊기면 레어리티 표시가 되지 않는다.

## 6. 문제 5: 아티팩트를 장착 슬롯에 드롭해도 장착되지 않음

### 현상

인벤토리의 아티팩트를 장비칸으로 드래그해도 장착되지 않았다.

### 원인

빈 장비칸이 UI Raycast를 받지 못했다.

빈 장비칸에서는 <code>Image-EquipItemImage</code>가 꺼져 있고, <code>Image-Background</code>의 <code>Raycast Target</code>도 꺼져 있었다.

그래서 Unity EventSystem 입장에서는 드롭할 대상이 없는 빈 공간처럼 인식되었다.

즉, <code>ArtifactEquipSlotUI.OnDrop()</code>이 호출되지 않았다.

### 해결

<code>ArtifactEquipSlotUI.Awake()</code>에서 배경 이미지를 Raycast Target으로 켜도록 했다.

```txt
if (slotFrameImage != null)
    slotFrameImage.raycastTarget = true;
```

### 정리

드래그 앤 드롭 UI에서 중요한 것은 “보이는 이미지”가 아니라 “Raycast를 받을 수 있는 UI Graphic”이 있는지다.

빈 슬롯이 드롭을 받아야 한다면, 슬롯 배경 또는 루트에 Raycast Target이 켜진 <code>Image</code>가 필요하다.

## 7. 문제 6: 장착한 아티팩트를 다시 뺄 수 없음

### 현상

아티팩트를 장착할 수는 있지만, 장착 후 인벤토리로 다시 빼낼 수 없었다.

### 원인

초기 구현에서는 장착 슬롯에 “장착 요청”만 있었고, “해제 요청” 입력 흐름이 부족했다.

처음에는 우클릭 해제를 넣었지만, 실제 조작 방향은 더블클릭과 드래그 앤 드롭이 더 적합했다.

### 해결

최종적으로 다음 두 가지 해제 방식을 지원하도록 수정했다.

```txt
1. 장착 슬롯 왼쪽 더블클릭
2. 장착 슬롯에서 인벤토리 슬롯으로 드래그 앤 드롭
```

드래그 앤 드롭 구조는 다음과 같다.

```txt
ArtifactEquipSlotUI
-> 장착된 아이템이 있으면 드래그 시작 가능
-> 드래그 중 아이콘을 마우스 위치로 이동
-> itemImage.raycastTarget = false

InventorySlotUI
-> ArtifactEquipSlotUI가 드롭되면
-> GlobalEventBus.OnArtifactUnequipRequested 호출
```

### 정리

장착 UI는 단순 표시 UI가 아니라, 아이템 이동의 출발점이 될 수도 있다.

따라서 장착 슬롯도 <code>IBeginDragHandler</code>, <code>IDragHandler</code>, <code>IEndDragHandler</code>를 구현해야 드래그 해제가 가능하다.

## 8. 문제 7: 장착한 채로 탈출하면 아티팩트가 증발함

### 현상

아티팩트를 장착한 상태로 탈출하면, 다음 세션이나 저장 데이터에서 해당 아티팩트가 사라졌다.

### 원인

기존 저장 구조는 다음 데이터만 저장했다.

```txt
inventorySlots
safeSlots
quickSlots
```

하지만 장착 중인 아티팩트는 인벤토리 슬롯에서 제거되어 <code>PlayerArtifactEquipment</code>에만 존재한다.

즉, 탈출 정산 시점에 저장되는 인벤토리 목록에는 장착 아티팩트가 없고, 별도 장착 슬롯 저장 구조도 없었다.

그래서 저장 결과에서 아티팩트가 누락되었다.

### 해결

<code>PlayerSaveData</code>에 장착 아티팩트 전용 저장 리스트를 추가했다.

```txt
public List<SaveSlotData> artifactSlots = new();
```

<code>ResultManager.InventorySync()</code>에서 현재 장착 중인 아티팩트를 저장하도록 했다.

```txt
PlayerArtifactEquipment.WriteToSave()
-> artifactSlots에 장착 슬롯 index, TID, amount 저장
```

그리고 게임 씬 로드 시에는 <code>GameManager.OnSceneLoaded()</code>에서 저장된 장착 정보를 복원하도록 했다.

```txt
PlayerArtifactEquipment.RestoreFromSave()
-> artifactSlots 읽기
-> TID 기준으로 ArtifactItemData 다시 로드
-> 장착 슬롯에 복원
```

### 정리

인벤토리에서 빠져 있는 장착 아이템은 별도 저장 구조가 필요하다.

장착 상태는 단순 UI 상태가 아니라 플레이어 세이브 데이터의 일부다.

## 9. 문제 8: 장착 해제 후 인벤토리가 가득 찬 경우

### 현상 가능성

장착한 아티팩트를 해제하려고 할 때, 인벤토리에 빈칸이 없으면 아이템을 넣을 수 없다.

### 원인

아티팩트 해제는 장착 슬롯에서 아이템을 빼고 인벤토리에 다시 넣는 흐름이다.

하지만 인벤토리가 가득 차면 반환할 위치가 없다.

### 해결 구조

<code>InventoryPresenter.HandleArtifactUnequipRequested()</code>는 먼저 해제를 시도한 뒤, 인벤토리에 넣을 수 없으면 다시 장착 상태로 복구한다.

```txt
UnequipArtifact()
-> playerInventory.AddItem()
-> remain > 0이면 다시 EquipArtifact()
```

### 정리

장착 해제는 단순히 슬롯을 비우는 작업이 아니라, 아이템이 돌아갈 목적지가 있어야 한다.

따라서 실패 시 복구 처리가 필요하다.

## 10. 이번 트러블슈팅에서 얻은 교훈

### 10.1 새 아이템 타입은 전체 흐름에 연결해야 한다

아티팩트는 단순히 JSON에 추가한다고 끝나는 아이템이 아니었다.

필요한 연결 지점:

```txt
데이터 enum
JSON 로더
아이템 획득
아이템 박스 루팅
인벤토리 UI
장착 슬롯 UI
저장 데이터
탈출 정산
씬 로드 복원
```

### 10.2 UI 드래그 앤 드롭은 Raycast Target이 핵심이다

드롭이 안 될 때는 로직보다 먼저 확인할 것:

```txt
대상 UI에 Graphic 컴포넌트가 있는가
Raycast Target이 켜져 있는가
드래그 중인 아이콘이 아래 슬롯 Raycast를 막고 있지 않은가
CanvasGroup.blocksRaycasts가 적절히 꺼지는가
```

### 10.3 장착 상태는 인벤토리와 별도 책임이다

인벤토리는 “보유 중인 아이템”을 관리한다.

장착 시스템은 “현재 사용 중인 아이템”을 관리한다.

둘을 분리하는 대신, 저장/복원 시에는 둘 다 저장 대상에 포함해야 한다.

### 10.4 프리팹 참조 누락은 코드 문제처럼 보일 수 있다

한 슬롯만 정상이고 나머지가 이상하다면, 코드보다 먼저 프리팹 직렬화 참조를 확인해야 한다.

이번에도 세 장비칸 중 일부만 이미지가 적용된 문제는 코드 로직 문제가 아니라 프리팹 참조 누락에 가까웠다.

## 11. 최종 상태

현재 아티팩트 시스템은 다음 상태까지 구현되었다.

```txt
아티팩트 데이터 로드 가능
아이템 박스에서 아티팩트 루팅 가능
인벤토리에 아티팩트 획득 가능
장착 슬롯에 아티팩트 장착 가능
등급별 장착 슬롯 프레임 표시 가능
더블클릭으로 해제 가능
드래그 앤 드롭으로 해제 가능
탈출 시 장착 아티팩트 저장 가능
씬 로드 시 장착 아티팩트 복원 가능
```

아직 남은 것은 “장착 효과가 실제 플레이어 능력치에 적용되는 단계”다.
{% endraw %}
