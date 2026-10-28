---
title: "코드 변경 사항 기록"
date: 2026-06-24 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "txt /// /// 플레이어가 상자와 상호작용했을 때 /// 기존처럼 드롭 아이템을 바로 바닥에 생성하지 않고, /// 상자 UI를 열어 안에 들어 있는 아이템을 인벤토리로 옮길 수 있게 바꾸는 작업 /// 전달 변경점 기존 상자 구조는 이랬다. 플레이어가 ItemBox 와 상호작용 "
description: "txt /// /// 플레이어가 상자와 상호작용했을 때 /// 기존처럼 드롭 아이템을 바로 바닥에 생성하지 않고, /// 상자 UI를 열어 안에 들어 있는 아이템을 인벤토리로 옮길 수 있게 바꾸는 작업 /// 전달 변경점 기존 상자 구조는 이랬다. 플레이어가 ItemBox 와 상호작용 "
published: true
migration_id: "38936532580e80b39b73f4c77c19ca5f"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
```txt
/// <summary>
/// 플레이어가 상자와 상호작용했을 때
/// 기존처럼 드롭 아이템을 바로 바닥에 생성하지 않고,
/// 상자 UI를 열어 안에 들어 있는 아이템을 인벤토리로 옮길 수 있게 바꾸는 작업
/// </summary>
```

<b>전달 변경점</b>

기존 상자 구조는 이랬다.

- 플레이어가 <code>ItemBox</code> 와 상호작용
- 상자가 즉시 랜덤 드롭 아이템을 바닥에 생성
- 상자는 사라짐
- 플레이어는 바닥에 떨어진 아이템을 다시 주워야 함

오늘 바꾼 구조는 이렇다.

- 플레이어가 <code>ItemBox</code> 와 상호작용
- 상자가 사라지지 않음
- 왼쪽에 <code>InventoryUI</code>
- 오른쪽에 <code>ChestUI</code>
- 상자 안에 들어 있는 아이템을 슬롯으로 보여줌
- 우클릭으로 인벤토리로 이동 가능
- 인벤토리에 다 못 들어간 수량은 일단 상자에 남김

즉 오늘 작업의 핵심은

<code>드롭 박스 -&gt; 컨테이너 박스</code> 구조로 바꾸는 것이었다.

---

<b>어디를 어떻게 고쳤는지</b>

1. <code>ItemBox</code>의 역할 변경

기존 <code>ItemBox</code> 는 <code>dropPrefabs</code> 중 하나를 뽑아 바닥에 생성하는 역할이었다.

오늘은 이 구조를 없애고

상자 내부에 실제 아이템 데이터를 저장하는 방식으로 변경했다.

핵심은 이것이다.

```txt
[SerializeField] private List<BoxItemEntry> items = new();
public IReadOnlyList<BoxItemEntry> Items => items;
```

즉 이제 상자는

<code>무엇을 바닥에 떨어뜨릴지</code>를 들고 있는 것이 아니라

<code>상자 안에 무엇이 들어 있는지</code>를 직접 들고 있게 됐다.

---

1. 상자 내부 아이템 1칸 데이터 분리

상자 안의 아이템 한 줄 데이터를 표현하기 위해

<code>BoxItemEntry</code> 클래스를 새로 만들었다.

```txt
[System.Serializable]
public class BoxItemEntry
{
    public ItemData itemData;
    public int amount = 1;
}
```

이 클래스는 상자 안 슬롯 1칸이

- 어떤 아이템인지
- 몇 개인지

를 저장하는 역할이다.

---

1. 랜덤 생성용 데이터 분리

상자 안에 랜덤으로 아이템을 채우기 위해

<code>BoxLootOption</code> 클래스를 새로 만들었다.

```txt
[System.Serializable]
public class BoxLootOption
{
    public ItemData itemData;
    public int weight = 1;
    public int minAmount = 1;
    public int maxAmount = 1;
}
```

이 데이터는

- 어떤 아이템 후보가 있는지
- 얼마나 자주 나올지
- 몇 개 나올지

를 인스펙터에서 조절하기 위한 용도다.

---

1. <code>ItemBox</code>가 시작 시 랜덤 아이템 생성 가능하도록 수정

이제 <code>ItemBox</code>는 필요하면 상자 생성 시점에

<code>lootOptions</code>에서 1\~2개 아이템을 뽑아 <code>items</code> 리스트를 채울 수 있다.

흐름은 이렇다.

- <code>useRandomLoot == true</code>
- <code>items</code>가 비어 있으면
- <code>GenerateRandomItems()</code> 실행
- <code>lootOptions</code> 중에서 가중치 기반으로 선택
- 선택된 결과를 <code>items</code>에 저장

즉 예전처럼 월드 드롭 오브젝트를 만드는 것이 아니라

체스트 UI가 읽을 수 있는 내부 데이터 리스트를 먼저 만든다.

---

1. 체스트 UI 추가

상자 전용 UI인 <code>ChestUI</code>, <code>ChestSlotUI</code>를 새로 만들었다.

이 UI는 <code>ItemBox.Items</code>를 읽어서

- 슬롯 개수 생성
- 각 슬롯 아이콘/수량 표시
- 우클릭 입력 감지

를 처리한다.

핵심 흐름은 이렇다.

```txt
CreateSlots(itemBox.Items.Count);
RefreshAll();
```

즉 상자 안에 아이템이 2종류 들어 있으면

체스트 슬롯도 2개 생성된다.

---

1. 우클릭으로 상자 -> 인벤토리 이동 구현

<code>ChestSlotUI</code>에서 우클릭을 감지하면

<code>ChestUI.TryMoveToInventory(slotIndex)</code>를 호출하게 만들었다.

이때 처리 흐름은 이렇다.

- 상자 슬롯 데이터 확인
- <code>playerInventory.AddItem()</code> 호출
- 실제로 들어간 수량 계산
- 들어간 만큼만 상자 수량 감소
- 상자 UI 다시 갱신
- 상자가 비었으면 UI 닫기

즉 지금 1차 구현 기준으로는

<code>인벤토리에 못 들어간 나머지는 상자에 남는다</code>.

---

1. <code>InventoryPresenter</code>가 상자 UI와 인벤토리 UI를 함께 관리하도록 수정

기존에는 인벤토리 열기/닫기만 담당했다면

오늘은 여기에 상자 UI 흐름까지 추가했다.

핵심 역할은 이렇다.

- 상자 열림 이벤트 구독
- 플레이어가 연 상자인지 확인
- 입력 액션맵을 UI 모드로 전환
- 왼쪽 <code>InventoryUI</code> 오픈
- 오른쪽 <code>ChestUI</code> 오픈
- 닫을 때 둘 다 같이 닫기
- 닫은 뒤 다시 Player 액션맵으로 복귀

즉 <code>InventoryPresenter</code>가

인벤토리와 체스트 UI 사이의 중재자 역할까지 하게 됐다.

---

1. 입력 액션맵 전환 메서드 분리

<code>LocalInputReader</code>에는 다음 메서드를 추가했다.

```txt
public void SwitchToUIMap()
{
    playerInput.SwitchCurrentActionMap("UI");
}

public void SwitchToPlayerMap()
{
    playerInput.SwitchCurrentActionMap("Player");
}
```

이렇게 분리해둔 이유는

상자를 열었을 때 Presenter가 직접 입력 상태를 제어하기 쉽게 만들기 위해서다.

---

1. <code>PlayerInventory.AddItem()</code> 수정

상자에서 인벤토리로 아이템을 옮기려면

몇 개가 실제로 들어가고 몇 개가 남는지 알아야 해서

<code>AddItem()</code>이 남는 수량을 정확히 반환하도록 보정했다.

이제 <code>AddItem()</code>은

- 동일 아이템 스택 누적
- 빈 슬롯 추가
- 남은 수량 반환
- 슬롯 변경 시 UI 이벤트 호출

까지 하도록 바뀌었다.

그리고 아이콘이 비동기로 로드된 뒤에도

다시 UI 갱신 이벤트를 한 번 더 보내도록 보완했다.

---

<b>오늘 만든 전체 흐름</b>

1. 플레이어가 상자와 상호작용
2. <code>ItemBox.Interact()</code> 실행
3. <code>GlobalEventBus.OnItemBoxOpened</code> 호출
4. <code>InventoryPresenter</code>가 이벤트 수신
5. <code>InventoryUI</code>와 <code>ChestUI</code> 함께 열기
6. <code>ChestUI</code>가 <code>ItemBox.Items</code>를 읽어서 슬롯 생성
7. 플레이어가 슬롯 우클릭
8. <code>PlayerInventory.AddItem()</code>으로 이동 시도
9. 들어간 만큼만 상자 수량 감소
10. 상자 비면 닫기

---

<b>현재 구현된 범위</b>

현재까지 구현된 것은 여기까지다.

- 상자를 열면 체스트 UI가 뜸
- 체스트 UI가 인벤토리 UI와 함께 열림
- 상자 안 아이템 데이터를 슬롯으로 표시하는 구조 준비
- 우클릭으로 상자 -> 인벤토리 이동 가능
- 인벤토리 초과분은 일단 상자에 남김
- 랜덤 상자 / 고정 테스트 상자 둘 다 만들 수 있는 구조 준비

---

<b>아직 남아 있는 작업</b>

아직 완성되지 않은 부분도 있다.

- 드래그 앤 드롭 이동
- 인벤토리와 상자 둘 다 꽉 찼을 때 바닥 드롭 처리
- <code>F</code> 키로도 UI 닫기 원하면 UI 액션맵 바인딩 추가 확인 필요
- 테스트용 박스 인스펙터에 <code>items</code> 또는 <code>lootOptions</code> 직접 연결 필요
- <code>drop prefab</code>이 아니라 <code>ItemData asset</code>을 연결해야 함

---

<b>주의할 점</b>

오늘 구조에서 가장 중요한 것은 이것이다.

상자에 넣는 데이터는

<code>testHealMedicine_Drop.prefab</code> 같은 드롭 프리팹이 아니라

<code>testHealMedicine.asset</code>, <code>testManaPiece.asset</code>, <code>testMemoryPiece.asset</code> 같은

<code>ItemData</code> 에셋이어야 한다.

즉 체스트 UI는

<code>월드에 떨어질 오브젝트</code>를 읽는 것이 아니라

<code>상자 안 아이템 데이터</code>를 읽는다.
{% endraw %}
