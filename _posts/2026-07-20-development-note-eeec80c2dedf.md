---
title: "2026-07-20_PlayerInventory_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/System/Player/PlayerInventory.cs cs /// /// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스 /// using System; using Syste"
description: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/System/Player/PlayerInventory.cs cs /// /// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스 /// using System; using Syste"
published: false
migration_id: "3a336532580e8187a03deeec80c2dedf"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>6e5f262^</code>
- 파일: <code>Assets/02_Scripts/System/Player/PlayerInventory.cs</code>

```cs
/// <summary>
/// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스
/// </summary>
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

public class PlayerInventory : MonoBehaviour
{
    public List<InventorySlotData> slots = new();
    public List<InventorySlotData> quickSlots = new();
    public List<InventorySlotData> safeSlots = new();
    public List<InventorySlotData> anySlots = new();
    public int slotNum { get; private set; }
    public int quickSlotNum { get; private set; }
    public int safeSlotNum { get; private set; }

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private IItemDataRepository itemRepo;

    // 인벤토리 슬롯과 각성 보존 슬롯을 동시에 취급하는 경우에 AnySlots 헬퍼를 호출하여 사용
    public List<InventorySlotData> AnySlots => anySlots;

    // 특정 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSlotChanged;

    // 각성 보존 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSafeSlotChanged;

    // 아이템 드롭 시 생성 할 공통 드롭 아이템 오브젝트 프리팹
    [SerializeField] private GameObject itemPrefabRef;


    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;

        itemRepo = new LocalJsonItemRepository();
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;
    }

    /* 인벤토리 UI 초기화 */
    public void Initialize(int _slotNum, int _quickSlotNum, int _safeSlotNum)
    {
```

```cs
    slotNum = _slotNum;
    quickSlotNum = _quickSlotNum;
    safeSlotNum = _safeSlotNum; 
    
    // 모든 슬롯 (인벤토리, 퀵슬롯, 각성 보존 슬롯) 데이터 초기화
    for (int i = 0; i < _slotNum; i++)
    {
        slots.Add(new InventorySlotData(0, i, 0, null));
    }

    for (int j = 0; j < _safeSlotNum; j++)
    {
        safeSlots.Add(new InventorySlotData(0, j, 0, null));
    }

    RebuildAnySlots();

    for (int i = 0; i < _quickSlotNum; i++)
    {
        quickSlots.Add(new InventorySlotData(0, i, 0, null));
    }
}

// 인벤토리 슬롯과 각성 보존 슬롯을 병합해 anySlots 리스트 생성
public void RebuildAnySlots()
{
    anySlots.Clear();
    // 인벤토리 슬롯(우선순위 그대로)
    if (slots != null) anySlots.AddRange(slots);
    // 각성 보존 슬롯을 뒤에 추가
    if (safeSlots != null) anySlots.AddRange(safeSlots);
}

/* 인벤토리에 아이템 추가 및 남는 수량 반환 */
public int AddItem(ItemData _itemData, int _count)
{
    if (_itemData == null || _count <= 0) return _count;

    int remain = _count;

    // 1. 이미 인벤토리에 해당 아이템이 있는지 먼저 확인
    // (순서 관계 없이 모든 슬롯을 탐색)
    foreach (InventorySlotData slot in slots)
    {
        // 가득 차지 않은 슬롯에 각각 채움
        if (slot.TID == _itemData.TID)
        {
            // 동일 아이템이 있는 슬롯을 찾아 채움
            int beforeAmount = slot.amount;
            remain = TryAddToSlot(slot.order, _itemData, remain);

            // 획득 후 수량을 퀵슬롯에 반영
            if (beforeAmount != slot.amount)
            {
                QuickSlotRenew(_itemData);
            }

            if (remain <= 0) break;
        }
    }
```

```cs
    // 2. 인벤토리에 해당 아이템이 아예 없는 경우 빈 슬롯에 새롭게 추가
    // (모든 슬롯을 가득 채운 후 남은 아이템에 대해서도 동일한 처리를 실행)
    while (remain > 0)
    {
        //빈 슬롯을 찾았는지 확인
        bool foundEmptySlot = false;
        for (int i = 0; i < slotNum; i++)
        {
            // 이미 아이템이 있는 슬롯은 넘김
            if (!IsSlotEmpty(i)) continue;

            // 새 슬롯에 아이템을 추가
            int beforeAmount = slots[i].amount;
            remain = TryAddToSlot(i, _itemData, remain);
            foundEmptySlot = true;

            

            // 추가 후 총 보유 수량을 퀵슬롯에 반영
            if (beforeAmount != slots[i].amount)
            {
                QuickSlotRenew(_itemData);
            }

            if (remain <= 0) break;
        }

        // 빈 슬롯이 없으면 루프 탈출
        if (!foundEmptySlot) break;
    }

    // 3. 빈 슬롯을 찾을 수 없는 경우 처리 종료
    if (remain > 0)
    {
        Debug.Log("인벤토리가 가득차서 아이템을 주울 수 없습니다.");
    }

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    return remain;
}

/* 특정 슬롯 하나에 아이템을 넣고 남은 수량 반환 */
public int TryAddToSlot(int _slotIndex, ItemData _itemData, int _count)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return _count;
    if (_itemData == null || _count <= 0) return _count;

    InventorySlotData slot = anySlots[_slotIndex];
    int maxStack = Mathf.Max(1, _itemData.itemMultiple);

    // 빈 슬롯이면 새로 배치
    if (IsSlotEmpty(_slotIndex))
    {
        int addAmount = Mathf.Min(_count, maxStack);

        slot.TID = _itemData.TID;
        slot.amount = addAmount;
```

```cs
        slot.itemData = _itemData;

        // 아이콘 로드는 비동기로 백그라운드에서 진행 (LoadSprite 내부에서 UI 갱신을 알아서 수행)
        _ = LoadSprite(_itemData.iconAddress, _slotIndex, _itemData.TID);

        // 수량부터 먼저 반영
        OnSlotChanged?.Invoke(_slotIndex);

        return _count - addAmount;
    }

    // 다른 아이템이 들어 있으면 추가 불가
    if (slot.TID != _itemData.TID) return _count;

    // 같은 아이템인데 원본 데이터가 비어 있으면 다시 연결
    if (slot.itemData == null)
        slot.itemData = _itemData;

    int canAdd = maxStack - slot.amount;
    if (canAdd <= 0) return _count;

    int realAdd = Mathf.Min(_count, canAdd);
    slot.amount += realAdd;

    OnSlotChanged?.Invoke(_slotIndex);

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    // 남은 수량 반환
    return _count - realAdd;
}

/* 특정 슬롯 데이터 반환 */
public InventorySlotData GetSlot(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
    return anySlots[_slotIndex];
}

/* 특정 슬롯의 원본 ItemData 반환 */
public ItemData GetSlotItemData(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
    return anySlots[_slotIndex].itemData;
}

/* 특정 슬롯이 비어 있는지 확인 */
public bool IsSlotEmpty(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return true;
    return anySlots[_slotIndex].TID == 0 || anySlots[_slotIndex].amount <= 0;
}

/* 특정 슬롯 수량 차감 */
public void RemoveAmount(int _slotIndex, int _count)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;
```

```cs
    if (IsSlotEmpty(_slotIndex)) return;

    int tid = anySlots[_slotIndex].TID;
    anySlots[_slotIndex].amount -= _count;

    if (anySlots[_slotIndex].amount <= 0)
    {
        ClearSlot(_slotIndex);
        return;
    }

    OnSlotChanged?.Invoke(_slotIndex);
    SyncQuickSlotsByTID(tid);

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();
}

/* 특정 슬롯 완전 초기화 */
public void ClearSlot(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;

    int tid = anySlots[_slotIndex].TID;
    anySlots[_slotIndex].TID = 0;
    anySlots[_slotIndex].amount = 0;
    anySlots[_slotIndex].icon = null;
    anySlots[_slotIndex].itemData = null;

    OnSlotChanged?.Invoke(_slotIndex);

    if (tid != 0)
    {
        SyncQuickSlotsByTID(tid);
    }

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();
}

/* 특정 슬롯 아이템을 월드에 드롭하고, 성공 시 후처리 콜백을 실행 */
public void TryDropSlotToWorld(int _slotIndex, Vector3 dropPosition, Action onDropped = null)
{
    InventorySlotData slot = GetSlot(_slotIndex);
    if (slot == null || IsSlotEmpty(_slotIndex))
        return;

    ItemData itemData = GetSlotItemData(_slotIndex);
    if (itemData == null)
        return;

    int dropCount = slot.amount;

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    GameObject dropObject = Instantiate(itemPrefabRef, dropPosition, Quaternion.identity);
    DropItem dropItem = dropObject.GetComponent<DropItem>();

    if (dropItem == null)
    {
```

```cs
        Debug.LogError($"생성된 프리팹에 DropItem 컴포넌트가 없습니다: {dropObject.name}");
        Destroy(dropObject);
        return;
    }

    dropItem.Initialize(itemData, dropCount);

    VFXService.Instance?.Play(GameplayVFXIds.ItemDrop, dropPosition);

    RemoveAmount(_slotIndex, dropCount);

    onDropped?.Invoke();
}

/* 획득한 아이템을 퀵슬롯에서 찾아 개수 변동 반영 */
private void QuickSlotRenew(ItemData _itemData)
{
    if (_itemData == null) return;
    SyncQuickSlotsByTID(_itemData.TID);
}

/* 특정 아이템 TID를 등록한 모든 퀵슬롯의 수량과 UI를 다시 동기화 */
private void SyncQuickSlotsByTID(int tid)
{
    if (tid == 0) return;

    int totalCount = GetInventoryItemCount(tid);

    for (int i = 0; i < quickSlotNum; i++)
    {
        InventorySlotData quickSlot = quickSlots[i];
        if (quickSlot.TID != tid) continue;

        quickSlot.amount = totalCount;

        // 등록은 유지하되 아이콘이 아직 없으면 다시 로드를 시도합니다.
        if (quickSlot.icon == null && quickSlot.itemData != null)
        {
            _ = LoadQuickSlotSprite(quickSlot.itemData.iconAddress, i, quickSlot.TID);
            continue;
        }

        GlobalEventBus.OnQuickSlotChanged?.Invoke(i, quickSlot.icon, quickSlot.amount);
    }
}

/* 아이템의 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
private async Task LoadSprite(string iconRef, int slotIndex, int expectedTID)
{
    Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
    
    int currentTID = -1;
    if (slotIndex >= 0 && slotIndex < anySlots.Count)
    {
        currentTID = anySlots[slotIndex].TID;
    }
```

```cs
    if (currentTID != expectedTID || currentTID == 0)
    {
        // 그 사이에 슬롯 아이템이 바뀌었거나 지워졌으므로 덮어쓰기 취소
        return;
    }

    if (loadIcon == null)
    {
        // anySlots 헬퍼에서 먼저 기록 후 원본 슬롯에 각각 전달
        if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = null;

        if (slotIndex < slots.Count)
        {
            slots[slotIndex].icon = null;
            OnSlotChanged?.Invoke(slotIndex);
        }
        else
        {
            int safeIndex = slotIndex - slots.Count;
            if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = null;
            OnSafeSlotChanged?.Invoke(safeIndex);
        }
        return;
    }

    // 아이콘이 준비된 시점에 UI를 anySlots 헬퍼에서 갱신
    if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = loadIcon;

    // 로드된 아이콘을 각 슬롯 데이터에 반영
    if (slotIndex < slots.Count)
    {
        slots[slotIndex].icon = loadIcon;
        OnSlotChanged?.Invoke(slotIndex);
    }
    else
    {
        int safeIndex = slotIndex - slots.Count;
        if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = loadIcon;
        OnSafeSlotChanged?.Invoke(safeIndex);
    }
}

public void UseItem(int slotIndex)
{
    // 유효성 검사 (빈 슬롯이 아닌지)
    if (IsSlotEmpty(slotIndex)) return;

    // 갯수 차감
    RemoveAmount(slotIndex, 1);
}

/* 인벤토리 슬롯 데이터를 교환 */
public void SwapSlotData(int _index1, int _index2)
{
    /// ※추가: 해당 아이템이 동일한 아이템이라면 존재한다면 합산 가능한지 판정 후 합산 ///
```

```cs
if (_index1 < 0 || _index1 >= anySlots.Count) return;
if (_index2 < 0 || _index2 >= anySlots.Count) return;
if (_index1 == _index2) return;

InventorySlotData slot1 = anySlots[_index1];
InventorySlotData slot2 = anySlots[_index2];

if (slot1 == null || slot2 == null) return;

// 같은 아이템을 드롭한 경우에는 슬롯 교환보다 스택 합치기를 우선 처리합니다.
if (slot1.TID != 0 && slot1.TID == slot2.TID)
{
    ItemData itemData = slot1.itemData != null ? slot1.itemData : slot2.itemData;
    itemData ??= GetItemDataByTID(slot1.TID);

    int maxStack = itemData != null ? Mathf.Max(1, itemData.itemMultiple) : 1;
    int canMoveAmount = maxStack - slot1.amount;

    if (canMoveAmount > 0 && slot2.amount > 0)
    {
        int moveAmount = Mathf.Min(canMoveAmount, slot2.amount);

        slot1.amount += moveAmount;
        slot1.itemData ??= itemData;
        if (slot1.icon == null)
            slot1.icon = slot2.icon;

        slot2.amount -= moveAmount;

        if (slot2.amount <= 0)
        {
            slot2.TID = 0;
            slot2.amount = 0;
            slot2.icon = null;
            slot2.itemData = null;
        }

        NotifyInventorySlotChanged(_index1);
        NotifyInventorySlotChanged(_index2);
        SyncQuickSlotsByTID(slot1.TID);
        RebuildAnySlots();
        return;
    }
}

// 두 데이터 교환
(slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
```

```cs
    (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
    (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
    (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

    // 변동사항 알림
    NotifyInventorySlotChanged(_index1);
    NotifyInventorySlotChanged(_index2);

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();
}

private void NotifyInventorySlotChanged(int slotIndex)
{
    if (slotIndex < 0) return;

    if (slotIndex < slots.Count)
    {
        OnSlotChanged?.Invoke(slotIndex);
        return;
    }

    int safeSlotIndex = slotIndex - slots.Count;
    if (safeSlotIndex >= 0 && safeSlotIndex < safeSlots.Count)
    {
        OnSafeSlotChanged?.Invoke(safeSlotIndex);
    }
}

/* 퀵슬롯에 아이템 추가 */
public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
{
    // 퀵슬롯/인벤토리 인덱스 유효성 검사
    if (_quickIndex < 0 || _quickIndex >= quickSlotNum) return;
    if (_slotIndex < 0 || _slotIndex >= slotNum) return;

    InventorySlotData slot = slots[_slotIndex];

    // 소모품이 아닐 경우에는 퀵슬롯에 등록하지 않음
    if (slot.TID <= 300 || slot.TID >= 400) return;

    // 이미 다른 퀵슬롯에 있다면 기존 슬롯을 비움
    for (int i = 0; i < quickSlotNum; i++)
    {
        if (i == _quickIndex) continue;
        if (quickSlots[i].TID != slot.TID) continue;

        quickSlots[i].TID = 0;
        quickSlots[i].amount = 0;
        quickSlots[i].icon = null;
        quickSlots[i].itemData = null;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
    }
```

```cs
    InventorySlotData qSlot = quickSlots[_quickIndex];
    qSlot.TID = slot.TID;
    qSlot.amount = GetInventoryItemCount(slot.TID);
    qSlot.icon = slot.icon;
    qSlot.itemData = slot.itemData;

    // 변동사항 알림
    OnSlotChanged?.Invoke(_slotIndex);

    if (qSlot.icon != null)
    {
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
    }
    else if (qSlot.itemData != null)
    {
        _ = LoadQuickSlotSprite(qSlot.itemData.iconAddress, _quickIndex, qSlot.TID);
    }
    else
    {
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, null, qSlot.amount);
    }
}

/* 퀵슬롯 아이템 사용 */
public bool UseQuickSlotItem(int _index)
{
    // 퀵슬롯 범위 및 데이터 유효성 검사
    if (_index < 0 || _index >= quickSlotNum) return false;

    InventorySlotData slot = quickSlots[_index];
    if (slot == null || slot.TID == 0 || slot.amount <= 0) return false;

    // 등록된 슬롯 정보는 유지하고, 실제 인벤토리 수량만 차감합니다.
    return ConsumeInventoryItemByTID(slot.TID);
}

/* 인벤토리에서 특정 TID 아이템의 총 수량 계산 */
private int GetInventoryItemCount(int tid)
{
    int count = 0;

    for (int i = 0; i < slotNum; i++)
    {
        if (slots[i].TID == tid)
        {
            count += slots[i].amount;
        }
    }

    return count;
}

/* 인벤토리에서 특정 TID 아이템 1개를 차감 */
private bool ConsumeInventoryItemByTID(int tid)
{
    for (int i = 0; i < slotNum; i++)
    {
        if (slots[i].TID != tid || slots[i].amount <= 0)
        {
            continue;
        }
```

```cs
        slots[i].amount--;

        if (slots[i].amount <= 0)
        {
            ClearSlot(i);
            return true;
        }

        // 수량 변화가 생긴 인벤토리 슬롯 UI를 갱신
        OnSlotChanged?.Invoke(i);
        SyncQuickSlotsByTID(tid);
        return true;
    }

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    // 인벤토리에는 없지만 퀵슬롯에는 등록된 상태일 수 있으므로 한 번 더 정리합니다.
    SyncQuickSlotsByTID(tid);
    return false;
}

/* 퀵슬롯간에 아이템 교환 */
private void SwapItemQuickSlot(int _index1, int _index2)
{
    InventorySlotData slot1 = quickSlots[_index1];
    InventorySlotData slot2 = quickSlots[_index2];

    // 두 데이터 교환
    (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
    (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
    (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
    (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

    // 변동사항 알림
    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
}

/* 저장된 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 런타임 슬롯에 복원 */
public void RestoreFromSave(PlayerSaveData saveData)
{
    if (saveData == null) return;

    // 현재 런타임 슬롯 데이터를 모두 초기화
    ClearRuntimeSlots();

    // 저장된 아티펙트 슬롯 데이터를 순서대로 복원
    foreach(var savedSlot in saveData.artifactSlots)
    {
        if (savedSlot.index < 0 || savedSlot.index >= slotNum) continue;

        slots[savedSlot.index].TID = savedSlot.TID;
        slots[savedSlot.index].amount = savedSlot.amount;
```

```cs
    ////////////////////////////
}

// 저장된 인벤토리 슬롯 데이터를 순서대로 복원
foreach (var savedSlot in saveData.inventorySlots)
{
    if (savedSlot.index < 0 || savedSlot.index >= slotNum) continue;

    slots[savedSlot.index].TID = savedSlot.TID;
    slots[savedSlot.index].amount = savedSlot.amount;

    ItemData itemData = GetItemDataByTID(savedSlot.TID);
    slots[savedSlot.index].itemData = itemData;

    if (itemData != null)
    {
        _ = LoadSprite(itemData.iconAddress, savedSlot.index, savedSlot.TID);
    }

    OnSlotChanged?.Invoke(savedSlot.index);
}

// 저장된 각성 보존 슬롯 데이터를 순서대로 복원
foreach (var savedSlot in saveData.safeSlots)
{
    if (savedSlot.index < 0 || savedSlot.index >= safeSlotNum) continue;

    safeSlots[savedSlot.index].TID = savedSlot.TID;
    safeSlots[savedSlot.index].amount = savedSlot.amount;

    ItemData itemData = GetItemDataByTID(savedSlot.TID);
    safeSlots[savedSlot.index].itemData = itemData;

    if (itemData != null) _ = LoadSprite(itemData.iconAddress, savedSlot.index + slots.Count, savedSlot.TID);

    OnSafeSlotChanged?.Invoke(savedSlot.index);
}

// 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
RebuildAnySlots();

// 저장된 퀵슬롯 TID를 기준으로 퀵슬롯 데이터를 복원
for (int i = 0; i < quickSlotNum; i++)
{
    int tid = i < saveData.quickSlots.Count ? saveData.quickSlots[i] : 0;

    if (tid == 0)
    {
        quickSlots[i].TID = 0;
        quickSlots[i].amount = 0;
```

```cs
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
            continue;
        }

        quickSlots[i].TID = tid;
        quickSlots[i].amount = GetSavedItemCount(saveData, tid);

        ItemData itemData = GetItemDataByTID(tid);
        quickSlots[i].itemData = itemData;

        if (itemData != null)
        {
            _ = LoadQuickSlotSprite(itemData.iconAddress, i, tid);
        }
    }

    // 인벤토리 초기화 완료 후 시작 시점 스냅샷 저장
    SessionDataSO.Instance.SnapshotStartingInventory(anySlots);
}

/* TID를 통해 저장소에서 아이템 데이터 찾기 */
public ItemData GetItemDataByTID(int tid)
{
    if (tid == 0) return null;

    return itemRepo.GetItemDataByID(tid);
}

/* 퀵슬롯 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
private async Task LoadQuickSlotSprite(string iconRef, int quickIndex, int expectedTID)
{
    Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
    
    if (quickSlots[quickIndex].TID != expectedTID || quickSlots[quickIndex].TID == 0)
    {
        return;
    }

    if (loadIcon == null)
    {
        quickSlots[quickIndex].icon = null;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, null, quickSlots[quickIndex].amount);
        return;
    }

    quickSlots[quickIndex].icon = loadIcon;
    GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, loadIcon, quickSlots[quickIndex].amount);
}

/* 런타임 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 모두 초기화 */
private void ClearRuntimeSlots()
{
```

```cs
        for (int i = 0; i < slotNum; i++)
        {
            slots[i].TID = 0;
            slots[i].amount = 0;
            slots[i].icon = null;
            slots[i].itemData = null;
            OnSlotChanged?.Invoke(i);
        }

        for (int j = 0; j < safeSlotNum; j++)
        {
            safeSlots[j].TID = 0;
            safeSlots[j].amount = 0;
            safeSlots[j].icon = null;
            safeSlots[j].itemData = null;
            OnSafeSlotChanged?.Invoke(j);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        for (int i = 0; i < quickSlotNum; i++)
        {
            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }
    }

    /* 저장 데이터 기준 특정 TID 아이템 총 수량 계산 */
    private int GetSavedItemCount(PlayerSaveData saveData, int tid)
    {
        int count = 0;
        foreach (var slot in saveData.inventorySlots)
        {
            if (slot.TID == tid) count += slot.amount;
        }
        return count;
    }
}
```

## 2. 변경 설명

인벤토리 모델에서 퀵슬롯과 아티팩트 슬롯으로 아이템을 옮길 때 공통 InventoryItemPlacementPolicy를 사용하도록 변경했습니다. 화면에서 밝게 표시된 슬롯과 실제 장착 가능 결과가 어긋나지 않게 했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>6e5f262</code>
- 파일: <code>Assets/02_Scripts/System/Player/PlayerInventory.cs</code>

```cs
/// <summary>
/// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스
/// </summary>
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

public class PlayerInventory : MonoBehaviour
{
    public List<InventorySlotData> slots = new();
    public List<InventorySlotData> quickSlots = new();
    public List<InventorySlotData> safeSlots = new();
    public List<InventorySlotData> anySlots = new();
    public int slotNum { get; private set; }
    public int quickSlotNum { get; private set; }
    public int safeSlotNum { get; private set; }

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private IItemDataRepository itemRepo;

    // 인벤토리 슬롯과 각성 보존 슬롯을 동시에 취급하는 경우에 AnySlots 헬퍼를 호출하여 사용
    public List<InventorySlotData> AnySlots => anySlots;

    // 특정 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSlotChanged;

    // 각성 보존 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSafeSlotChanged;

    // 아이템 드롭 시 생성 할 공통 드롭 아이템 오브젝트 프리팹
    [SerializeField] private GameObject itemPrefabRef;


    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;

        itemRepo = new LocalJsonItemRepository();
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;
    }

    /* 인벤토리 UI 초기화 */
    public void Initialize(int _slotNum, int _quickSlotNum, int _safeSlotNum)
    {
```

```cs
    slotNum = _slotNum;
    quickSlotNum = _quickSlotNum;
    safeSlotNum = _safeSlotNum; 
    
    // 모든 슬롯 (인벤토리, 퀵슬롯, 각성 보존 슬롯) 데이터 초기화
    for (int i = 0; i < _slotNum; i++)
    {
        slots.Add(new InventorySlotData(0, i, 0, null));
    }

    for (int j = 0; j < _safeSlotNum; j++)
    {
        safeSlots.Add(new InventorySlotData(0, j, 0, null));
    }

    RebuildAnySlots();

    for (int i = 0; i < _quickSlotNum; i++)
    {
        quickSlots.Add(new InventorySlotData(0, i, 0, null));
    }
}

// 인벤토리 슬롯과 각성 보존 슬롯을 병합해 anySlots 리스트 생성
public void RebuildAnySlots()
{
    anySlots.Clear();
    // 인벤토리 슬롯(우선순위 그대로)
    if (slots != null) anySlots.AddRange(slots);
    // 각성 보존 슬롯을 뒤에 추가
    if (safeSlots != null) anySlots.AddRange(safeSlots);
}

/* 인벤토리에 아이템 추가 및 남는 수량 반환 */
public int AddItem(ItemData _itemData, int _count)
{
    if (_itemData == null || _count <= 0) return _count;

    int remain = _count;

    // 1. 이미 인벤토리에 해당 아이템이 있는지 먼저 확인
    // (순서 관계 없이 모든 슬롯을 탐색)
    foreach (InventorySlotData slot in slots)
    {
        // 가득 차지 않은 슬롯에 각각 채움
        if (slot.TID == _itemData.TID)
        {
            // 동일 아이템이 있는 슬롯을 찾아 채움
            int beforeAmount = slot.amount;
            remain = TryAddToSlot(slot.order, _itemData, remain);

            // 획득 후 수량을 퀵슬롯에 반영
            if (beforeAmount != slot.amount)
            {
                QuickSlotRenew(_itemData);
            }

            if (remain <= 0) break;
        }
    }
```

```cs
    // 2. 인벤토리에 해당 아이템이 아예 없는 경우 빈 슬롯에 새롭게 추가
    // (모든 슬롯을 가득 채운 후 남은 아이템에 대해서도 동일한 처리를 실행)
    while (remain > 0)
    {
        //빈 슬롯을 찾았는지 확인
        bool foundEmptySlot = false;
        for (int i = 0; i < slotNum; i++)
        {
            // 이미 아이템이 있는 슬롯은 넘김
            if (!IsSlotEmpty(i)) continue;

            // 새 슬롯에 아이템을 추가
            int beforeAmount = slots[i].amount;
            remain = TryAddToSlot(i, _itemData, remain);
            foundEmptySlot = true;

            

            // 추가 후 총 보유 수량을 퀵슬롯에 반영
            if (beforeAmount != slots[i].amount)
            {
                QuickSlotRenew(_itemData);
            }

            if (remain <= 0) break;
        }

        // 빈 슬롯이 없으면 루프 탈출
        if (!foundEmptySlot) break;
    }

    // 3. 빈 슬롯을 찾을 수 없는 경우 처리 종료
    if (remain > 0)
    {
        Debug.Log("인벤토리가 가득차서 아이템을 주울 수 없습니다.");
    }

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    return remain;
}

/* 특정 슬롯 하나에 아이템을 넣고 남은 수량 반환 */
public int TryAddToSlot(int _slotIndex, ItemData _itemData, int _count)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return _count;
    if (_itemData == null || _count <= 0) return _count;

    InventorySlotData slot = anySlots[_slotIndex];
    int maxStack = Mathf.Max(1, _itemData.itemMultiple);

    // 빈 슬롯이면 새로 배치
    if (IsSlotEmpty(_slotIndex))
    {
        int addAmount = Mathf.Min(_count, maxStack);

        slot.TID = _itemData.TID;
        slot.amount = addAmount;
```

```cs
        slot.itemData = _itemData;

        // 아이콘 로드는 비동기로 백그라운드에서 진행 (LoadSprite 내부에서 UI 갱신을 알아서 수행)
        _ = LoadSprite(_itemData.iconAddress, _slotIndex, _itemData.TID);

        // 수량부터 먼저 반영
        OnSlotChanged?.Invoke(_slotIndex);

        return _count - addAmount;
    }

    // 다른 아이템이 들어 있으면 추가 불가
    if (slot.TID != _itemData.TID) return _count;

    // 같은 아이템인데 원본 데이터가 비어 있으면 다시 연결
    if (slot.itemData == null)
        slot.itemData = _itemData;

    int canAdd = maxStack - slot.amount;
    if (canAdd <= 0) return _count;

    int realAdd = Mathf.Min(_count, canAdd);
    slot.amount += realAdd;

    OnSlotChanged?.Invoke(_slotIndex);

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    // 남은 수량 반환
    return _count - realAdd;
}

/* 특정 슬롯 데이터 반환 */
public InventorySlotData GetSlot(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
    return anySlots[_slotIndex];
}

/* 특정 슬롯의 원본 ItemData 반환 */
public ItemData GetSlotItemData(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
    return anySlots[_slotIndex].itemData;
}

/* 특정 슬롯이 비어 있는지 확인 */
public bool IsSlotEmpty(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return true;
    return anySlots[_slotIndex].TID == 0 || anySlots[_slotIndex].amount <= 0;
}

/* 특정 슬롯 수량 차감 */
public void RemoveAmount(int _slotIndex, int _count)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;
```

```cs
    if (IsSlotEmpty(_slotIndex)) return;

    int tid = anySlots[_slotIndex].TID;
    anySlots[_slotIndex].amount -= _count;

    if (anySlots[_slotIndex].amount <= 0)
    {
        ClearSlot(_slotIndex);
        return;
    }

    OnSlotChanged?.Invoke(_slotIndex);
    SyncQuickSlotsByTID(tid);

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();
}

/* 특정 슬롯 완전 초기화 */
public void ClearSlot(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;

    int tid = anySlots[_slotIndex].TID;
    anySlots[_slotIndex].TID = 0;
    anySlots[_slotIndex].amount = 0;
    anySlots[_slotIndex].icon = null;
    anySlots[_slotIndex].itemData = null;

    OnSlotChanged?.Invoke(_slotIndex);

    if (tid != 0)
    {
        SyncQuickSlotsByTID(tid);
    }

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();
}

/* 특정 슬롯 아이템을 월드에 드롭하고, 성공 시 후처리 콜백을 실행 */
public void TryDropSlotToWorld(int _slotIndex, Vector3 dropPosition, Action onDropped = null)
{
    InventorySlotData slot = GetSlot(_slotIndex);
    if (slot == null || IsSlotEmpty(_slotIndex))
        return;

    ItemData itemData = GetSlotItemData(_slotIndex);
    if (itemData == null)
        return;

    int dropCount = slot.amount;

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    GameObject dropObject = Instantiate(itemPrefabRef, dropPosition, Quaternion.identity);
    DropItem dropItem = dropObject.GetComponent<DropItem>();

    if (dropItem == null)
    {
```

```cs
        Debug.LogError($"생성된 프리팹에 DropItem 컴포넌트가 없습니다: {dropObject.name}");
        Destroy(dropObject);
        return;
    }

    dropItem.Initialize(itemData, dropCount);

    VFXService.Instance?.Play(GameplayVFXIds.ItemDrop, dropPosition);

    RemoveAmount(_slotIndex, dropCount);

    onDropped?.Invoke();
}

/* 획득한 아이템을 퀵슬롯에서 찾아 개수 변동 반영 */
private void QuickSlotRenew(ItemData _itemData)
{
    if (_itemData == null) return;
    SyncQuickSlotsByTID(_itemData.TID);
}

/* 특정 아이템 TID를 등록한 모든 퀵슬롯의 수량과 UI를 다시 동기화 */
private void SyncQuickSlotsByTID(int tid)
{
    if (tid == 0) return;

    int totalCount = GetInventoryItemCount(tid);

    for (int i = 0; i < quickSlotNum; i++)
    {
        InventorySlotData quickSlot = quickSlots[i];
        if (quickSlot.TID != tid) continue;

        quickSlot.amount = totalCount;

        // 등록은 유지하되 아이콘이 아직 없으면 다시 로드를 시도합니다.
        if (quickSlot.icon == null && quickSlot.itemData != null)
        {
            _ = LoadQuickSlotSprite(quickSlot.itemData.iconAddress, i, quickSlot.TID);
            continue;
        }

        GlobalEventBus.OnQuickSlotChanged?.Invoke(i, quickSlot.icon, quickSlot.amount);
    }
}

/* 아이템의 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
private async Task LoadSprite(string iconRef, int slotIndex, int expectedTID)
{
    Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
    
    int currentTID = -1;
    if (slotIndex >= 0 && slotIndex < anySlots.Count)
    {
        currentTID = anySlots[slotIndex].TID;
    }
```

```cs
    if (currentTID != expectedTID || currentTID == 0)
    {
        // 그 사이에 슬롯 아이템이 바뀌었거나 지워졌으므로 덮어쓰기 취소
        return;
    }

    if (loadIcon == null)
    {
        // anySlots 헬퍼에서 먼저 기록 후 원본 슬롯에 각각 전달
        if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = null;

        if (slotIndex < slots.Count)
        {
            slots[slotIndex].icon = null;
            OnSlotChanged?.Invoke(slotIndex);
        }
        else
        {
            int safeIndex = slotIndex - slots.Count;
            if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = null;
            OnSafeSlotChanged?.Invoke(safeIndex);
        }
        return;
    }

    // 아이콘이 준비된 시점에 UI를 anySlots 헬퍼에서 갱신
    if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = loadIcon;

    // 로드된 아이콘을 각 슬롯 데이터에 반영
    if (slotIndex < slots.Count)
    {
        slots[slotIndex].icon = loadIcon;
        OnSlotChanged?.Invoke(slotIndex);
    }
    else
    {
        int safeIndex = slotIndex - slots.Count;
        if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = loadIcon;
        OnSafeSlotChanged?.Invoke(safeIndex);
    }
}

public void UseItem(int slotIndex)
{
    // 유효성 검사 (빈 슬롯이 아닌지)
    if (IsSlotEmpty(slotIndex)) return;

    // 갯수 차감
    RemoveAmount(slotIndex, 1);
}

/* 인벤토리 슬롯 데이터를 교환 */
public void SwapSlotData(int _index1, int _index2)
{
    /// ※추가: 해당 아이템이 동일한 아이템이라면 존재한다면 합산 가능한지 판정 후 합산 ///
```

```cs
if (_index1 < 0 || _index1 >= anySlots.Count) return;
if (_index2 < 0 || _index2 >= anySlots.Count) return;
if (_index1 == _index2) return;

InventorySlotData slot1 = anySlots[_index1];
InventorySlotData slot2 = anySlots[_index2];

if (slot1 == null || slot2 == null) return;

// 같은 아이템을 드롭한 경우에는 슬롯 교환보다 스택 합치기를 우선 처리합니다.
if (slot1.TID != 0 && slot1.TID == slot2.TID)
{
    ItemData itemData = slot1.itemData != null ? slot1.itemData : slot2.itemData;
    itemData ??= GetItemDataByTID(slot1.TID);

    int maxStack = itemData != null ? Mathf.Max(1, itemData.itemMultiple) : 1;
    int canMoveAmount = maxStack - slot1.amount;

    if (canMoveAmount > 0 && slot2.amount > 0)
    {
        int moveAmount = Mathf.Min(canMoveAmount, slot2.amount);

        slot1.amount += moveAmount;
        slot1.itemData ??= itemData;
        if (slot1.icon == null)
            slot1.icon = slot2.icon;

        slot2.amount -= moveAmount;

        if (slot2.amount <= 0)
        {
            slot2.TID = 0;
            slot2.amount = 0;
            slot2.icon = null;
            slot2.itemData = null;
        }

        NotifyInventorySlotChanged(_index1);
        NotifyInventorySlotChanged(_index2);
        SyncQuickSlotsByTID(slot1.TID);
        RebuildAnySlots();
        return;
    }
}

// 두 데이터 교환
(slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
```

```cs
    (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
    (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
    (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

    // 변동사항 알림
    NotifyInventorySlotChanged(_index1);
    NotifyInventorySlotChanged(_index2);

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();
}

private void NotifyInventorySlotChanged(int slotIndex)
{
    if (slotIndex < 0) return;

    if (slotIndex < slots.Count)
    {
        OnSlotChanged?.Invoke(slotIndex);
        return;
    }

    int safeSlotIndex = slotIndex - slots.Count;
    if (safeSlotIndex >= 0 && safeSlotIndex < safeSlots.Count)
    {
        OnSafeSlotChanged?.Invoke(safeSlotIndex);
    }
}

/* 퀵슬롯에 아이템 추가 */
public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
{
    // 퀵슬롯/인벤토리 인덱스 유효성 검사
    if (_quickIndex < 0 || _quickIndex >= quickSlotNum) return;
    if (_slotIndex < 0 || _slotIndex >= slotNum) return;

    InventorySlotData slot = slots[_slotIndex];

    // UI 하이라이트와 동일한 공통 규칙으로 소모품만 퀵슬롯에 등록합니다.
    ItemData itemData = slot.itemData ?? GetItemDataByTID(slot.TID);
    if (!InventoryItemPlacementPolicy.CanPlace(itemData, slot.TID, InventoryDropTargetType.QuickSlot))
        return;

    if (slot.itemData == null)
        slot.itemData = itemData;

    // 이미 다른 퀵슬롯에 있다면 기존 슬롯을 비움
    for (int i = 0; i < quickSlotNum; i++)
    {
        if (i == _quickIndex) continue;
        if (quickSlots[i].TID != slot.TID) continue;

        quickSlots[i].TID = 0;
```

```cs
        quickSlots[i].amount = 0;
        quickSlots[i].icon = null;
        quickSlots[i].itemData = null;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
    }

    InventorySlotData qSlot = quickSlots[_quickIndex];
    qSlot.TID = slot.TID;
    qSlot.amount = GetInventoryItemCount(slot.TID);
    qSlot.icon = slot.icon;
    qSlot.itemData = slot.itemData;

    // 변동사항 알림
    OnSlotChanged?.Invoke(_slotIndex);

    if (qSlot.icon != null)
    {
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
    }
    else if (qSlot.itemData != null)
    {
        _ = LoadQuickSlotSprite(qSlot.itemData.iconAddress, _quickIndex, qSlot.TID);
    }
    else
    {
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, null, qSlot.amount);
    }
}

/* 퀵슬롯 아이템 사용 */
public bool UseQuickSlotItem(int _index)
{
    // 퀵슬롯 범위 및 데이터 유효성 검사
    if (_index < 0 || _index >= quickSlotNum) return false;

    InventorySlotData slot = quickSlots[_index];
    if (slot == null || slot.TID == 0 || slot.amount <= 0) return false;

    // 등록된 슬롯 정보는 유지하고, 실제 인벤토리 수량만 차감합니다.
    return ConsumeInventoryItemByTID(slot.TID);
}

/* 인벤토리에서 특정 TID 아이템의 총 수량 계산 */
private int GetInventoryItemCount(int tid)
{
    int count = 0;

    for (int i = 0; i < slotNum; i++)
    {
        if (slots[i].TID == tid)
        {
            count += slots[i].amount;
        }
    }

    return count;
}

/* 인벤토리에서 특정 TID 아이템 1개를 차감 */
```

```cs
private bool ConsumeInventoryItemByTID(int tid)
{
    for (int i = 0; i < slotNum; i++)
    {
        if (slots[i].TID != tid || slots[i].amount <= 0)
        {
            continue;
        }

        slots[i].amount--;

        if (slots[i].amount <= 0)
        {
            ClearSlot(i);
            return true;
        }

        // 수량 변화가 생긴 인벤토리 슬롯 UI를 갱신
        OnSlotChanged?.Invoke(i);
        SyncQuickSlotsByTID(tid);
        return true;
    }

    // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
    RebuildAnySlots();

    // 인벤토리에는 없지만 퀵슬롯에는 등록된 상태일 수 있으므로 한 번 더 정리합니다.
    SyncQuickSlotsByTID(tid);
    return false;
}

/* 퀵슬롯간에 아이템 교환 */
private void SwapItemQuickSlot(int _index1, int _index2)
{
    InventorySlotData slot1 = quickSlots[_index1];
    InventorySlotData slot2 = quickSlots[_index2];

    // 두 데이터 교환
    (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
    (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
    (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
    (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

    // 변동사항 알림
    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
}

/* 저장된 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 런타임 슬롯에 복원 */
public void RestoreFromSave(PlayerSaveData saveData)
{
    if (saveData == null) return;

    // 현재 런타임 슬롯 데이터를 모두 초기화
    ClearRuntimeSlots();

    // 저장된 아티펙트 슬롯 데이터를 순서대로 복원
```

```cs
foreach(var savedSlot in saveData.artifactSlots)
{
    if (savedSlot.index < 0 || savedSlot.index >= slotNum) continue;

    slots[savedSlot.index].TID = savedSlot.TID;
    slots[savedSlot.index].amount = savedSlot.amount;

    ////////////////////////////
}

// 저장된 인벤토리 슬롯 데이터를 순서대로 복원
foreach (var savedSlot in saveData.inventorySlots)
{
    if (savedSlot.index < 0 || savedSlot.index >= slotNum) continue;

    slots[savedSlot.index].TID = savedSlot.TID;
    slots[savedSlot.index].amount = savedSlot.amount;

    ItemData itemData = GetItemDataByTID(savedSlot.TID);
    slots[savedSlot.index].itemData = itemData;

    if (itemData != null)
    {
        _ = LoadSprite(itemData.iconAddress, savedSlot.index, savedSlot.TID);
    }

    OnSlotChanged?.Invoke(savedSlot.index);
}

// 저장된 각성 보존 슬롯 데이터를 순서대로 복원
foreach (var savedSlot in saveData.safeSlots)
{
    if (savedSlot.index < 0 || savedSlot.index >= safeSlotNum) continue;

    safeSlots[savedSlot.index].TID = savedSlot.TID;
    safeSlots[savedSlot.index].amount = savedSlot.amount;

    ItemData itemData = GetItemDataByTID(savedSlot.TID);
    safeSlots[savedSlot.index].itemData = itemData;

    if (itemData != null) _ = LoadSprite(itemData.iconAddress, savedSlot.index + slots.Count, savedSlot.TID);

    OnSafeSlotChanged?.Invoke(savedSlot.index);
}

// 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
RebuildAnySlots();

// 저장된 퀵슬롯 TID를 기준으로 퀵슬롯 데이터를 복원
```

```cs
    for (int i = 0; i < quickSlotNum; i++)
    {
        int tid = i < saveData.quickSlots.Count ? saveData.quickSlots[i] : 0;

        if (tid == 0)
        {
            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
            continue;
        }

        quickSlots[i].TID = tid;
        quickSlots[i].amount = GetSavedItemCount(saveData, tid);

        ItemData itemData = GetItemDataByTID(tid);
        quickSlots[i].itemData = itemData;

        if (itemData != null)
        {
            _ = LoadQuickSlotSprite(itemData.iconAddress, i, tid);
        }
    }

    // 인벤토리 초기화 완료 후 시작 시점 스냅샷 저장
    SessionDataSO.Instance.SnapshotStartingInventory(anySlots);
}

/* TID를 통해 저장소에서 아이템 데이터 찾기 */
public ItemData GetItemDataByTID(int tid)
{
    if (tid == 0) return null;

    return itemRepo.GetItemDataByID(tid);
}

/* 퀵슬롯 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
private async Task LoadQuickSlotSprite(string iconRef, int quickIndex, int expectedTID)
{
    Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
    
    if (quickSlots[quickIndex].TID != expectedTID || quickSlots[quickIndex].TID == 0)
    {
        return;
    }

    if (loadIcon == null)
    {
        quickSlots[quickIndex].icon = null;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, null, quickSlots[quickIndex].amount);
        return;
```

```cs
        }

        quickSlots[quickIndex].icon = loadIcon;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, loadIcon, quickSlots[quickIndex].amount);
    }

    /* 런타임 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 모두 초기화 */
    private void ClearRuntimeSlots()
    {
        for (int i = 0; i < slotNum; i++)
        {
            slots[i].TID = 0;
            slots[i].amount = 0;
            slots[i].icon = null;
            slots[i].itemData = null;
            OnSlotChanged?.Invoke(i);
        }

        for (int j = 0; j < safeSlotNum; j++)
        {
            safeSlots[j].TID = 0;
            safeSlots[j].amount = 0;
            safeSlots[j].icon = null;
            safeSlots[j].itemData = null;
            OnSafeSlotChanged?.Invoke(j);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        for (int i = 0; i < quickSlotNum; i++)
        {
            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }
    }

    /* 저장 데이터 기준 특정 TID 아이템 총 수량 계산 */
    private int GetSavedItemCount(PlayerSaveData saveData, int tid)
    {
        int count = 0;
        foreach (var slot in saveData.inventorySlots)
        {
            if (slot.TID == tid) count += slot.amount;
        }
        return count;
    }
}
```
{% endraw %}
