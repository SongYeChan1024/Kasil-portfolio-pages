---
title: "2026-06-25_script_full_compare"
date: 2026-06-25 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "상자·인벤토리·UI의 슬롯 이동 구조를 비교하기 위해 이전 버전과 작업 트리의 전체 스크립트를 함께 보관한 기록이다."
description: "상자·인벤토리·UI의 슬롯 이동 구조를 비교하기 위해 이전 버전과 작업 트리의 전체 스크립트를 함께 보관한 기록이다."
published: true
migration_id: "38a36532580e80639840c8dd2d717f26"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
# 2026-06-25 Script Full Compare

Previous version: <code>HEAD:path</code><br />Current version: working tree<br />Output encoding: UTF-8 with BOM

## Assets/02\_Scripts/System/ItemBox.cs

### Previous Script

```cs
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 플레이어가 상호작용할 수 있는 컨테이너 박스입니다.
/// 상자 안에는 실제로 옮길 수 있는 아이템 데이터가 들어 있으며,
/// 필요 시 시작 시점에 랜덤으로 아이템을 생성해 채워 넣습니다.
///</summary>
public class ItemBox : MonoBehaviour, IInteractable
{
    [Header("Container Contents")]
    [SerializeField] private List<BoxItemEntry> items = new();

    [Header("Random Loot Settings")]
    [SerializeField] private bool useRandomLoot = true;              // 시작 시 랜덤 아이템 생성 사용 여부
    [SerializeField] private int minCreateCount = 1;                // 최소 생성 아이템 종류 수
    [SerializeField] private int maxCreateCount = 2;                // 최대 생성 아이템 종류 수
    [SerializeField] private bool allowDuplicateLoot = false;       // 같은 아이템 중복 생성 허용 여부
    [SerializeField] private List<BoxLootOption> lootOptions = new(); // 랜덤 후보 아이템 목록

    private bool isOpened = false;

    ///<summary>
    /// 현재 상자 안에 들어 있는 아이템 목록입니다.
    /// ChestUI가 이 데이터를 읽어서 슬롯을 생성합니다.
    ///</summary>
    public IReadOnlyList<BoxItemEntry> Items => items;

    private void Awake()
    {
        // 랜덤 생성 모드를 사용하고,
        // 아직 상자 내용이 비어 있을 때만 시작 시 한 번 아이템을 채웁니다.
        if (useRandomLoot && items.Count == 0)
            GenerateRandomItems();
    }

    ///<summary>
    /// 인스펙터 우클릭 메뉴에서 수동으로 랜덤 아이템을 다시 생성할 때 사용합니다.
    /// 테스트할 때 편하게 확인할 수 있도록 추가합니다.
    ///</summary>
    [ContextMenu("Generate Random Items")]
    private void GenerateRandomItemsFromContextMenu()
    {
        GenerateRandomItems();
    }

    ///<summary>
    /// 플레이어가 상자와 상호작용했을 때 호출됩니다.
    /// 이미 열려 있으면 중복으로 열지 않습니다.
    ///</summary>
    public bool Interact(int playerID)
    {
        // 이미 열려 있으면 다시 열지 않음
        if (isOpened)
            return false;

        isOpened = true;

        // 상자 열림 이벤트를 발행하여 Presenter가 UI를 열도록 요청
        GlobalEventBus.OnItemBoxOpened?.Invoke(this, playerID);

        // 상자는 사라지지 않으므로 false 반환
        return false;
    }

    ///<summary>
    /// 지정한 인덱스의 상자 아이템 데이터를 반환합니다.
    ///</summary>
    public BoxItemEntry GetItem(int index)
    {
        if (index < 0 || index >= items.Count)
            return null;

        return items[index];
    }

    ///<summary>
    /// 상자 안 특정 아이템의 수량을 감소시킵니다.
    /// 수량이 0 이하가 되면 해당 엔트리를 제거합니다.
    ///</summary>
    public void RemoveAmount(int index, int amount)
    {
        if (index < 0 || index >= items.Count)
            return;

        items[index].amount -= amount;

        if (items[index].amount <= 0)
            items.RemoveAt(index);
    }

    ///<summary>
    /// 상자 안에 더 이상 아이템이 없는지 확인합니다.
    ///</summary>
    public bool IsEmpty()
    {
        return items.Count == 0;
    }

    ///<summary>
    /// 상자 UI를 닫을 때 다시 열 수 있도록 상태를 해제합니다.
    ///</summary>
    public void CloseBox()
    {
        isOpened = false;
    }

    ///<summary>
    /// 랜덤 후보 목록에서 1~2개의 아이템을 뽑아 상자 내용으로 채웁니다.
    /// 기존 내용은 지우고 새로 생성합니다.
    ///</summary>
    private void GenerateRandomItems()
    {
        // 잘못된 설정 방지
        int createMin = Mathf.Max(1, minCreateCount);
        int createMax = Mathf.Max(createMin, maxCreateCount);

        // 유효한 후보만 따로 모읍니다.
        List<BoxLootOption> pool = new List<BoxLootOption>();

        for (int i = 0; i < lootOptions.Count; i++)
        {
            if (lootOptions[i] == null || lootOptions[i].itemData == null)
                continue;

            pool.Add(lootOptions[i]);
        }

        // 후보가 없으면 생성하지 않음
        if (pool.Count == 0)
            return;

        items.Clear();

        // 이번 상자에 몇 종류의 아이템을 넣을지 결정
        int createCount = Random.Range(createMin, createMax + 1);

        for (int i = 0; i < createCount; i++)
        {
            // 중복 금지 상태에서 후보를 다 소진하면 종료
            if (pool.Count == 0)
                break;

            BoxLootOption selectedOption = PickRandomOption(pool);

            if (selectedOption == null || selectedOption.itemData == null)
                continue;

            // 수량 범위가 잘못 들어와도 최소 1개 이상 생성되도록 보정
            int minAmount = Mathf.Max(1, selectedOption.minAmount);
            int maxAmount = Mathf.Max(minAmount, selectedOption.maxAmount);
            int amount = Random.Range(minAmount, maxAmount + 1);

            // 실제 상자 내용 리스트에 추가
            items.Add(new BoxItemEntry
            {
                itemData = selectedOption.itemData,
                amount = amount
            });

            // 같은 아이템을 한 상자에서 중복 생성하지 않으려면 제거
            if (!allowDuplicateLoot)
                pool.Remove(selectedOption);
        }
    }

    ///<summary>
    /// 가중치(weight)를 기준으로 후보 아이템 하나를 랜덤 선택합니다.
    /// weight 값이 클수록 선택될 확률이 높아집니다.
    ///</summary>
    private BoxLootOption PickRandomOption(List<BoxLootOption> options)
    {
        int totalWeight = 0;

        for (int i = 0; i < options.Count; i++)
        {
            totalWeight += Mathf.Max(1, options[i].weight);
        }

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < options.Count; i++)
        {
            currentWeight += Mathf.Max(1, options[i].weight);

            if (randomValue < currentWeight)
                return options[i];
        }

        // 예외 상황 방지용 마지막 반환
        return options[options.Count - 1];
    }
}
```

### Current Script

```cs
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 플레이어가 상호작용할 수 있는 컨테이너 박스
/// 상자는 고정된 슬롯 개수를 가지며,
/// 아이템이 빠져도 슬롯 자체는 삭제되지 않고 빈 칸으로 유지된다.
/// </summary>
public class ItemBox : MonoBehaviour, IInteractable
{
[Header("Container Settings")]
[SerializeField] private int slotCapacity = 8;                 // 상자가 가질 고정 슬롯 개수
[SerializeField] private List<BoxItemEntry> items = new();     // 실제 슬롯 데이터 목록
[Header("Random Loot Settings")]
[SerializeField] private bool useRandomLoot = true;               // 시작 시 랜덤 아이템 생성 사용 여부
[SerializeField] private int minCreateCount = 1;                  // 최소 생성 아이템 종류 수
[SerializeField] private int maxCreateCount = 2;                  // 최대 생성 아이템 종류 수
[SerializeField] private bool allowDuplicateLoot = false;         // 같은 아이템 중복 생성 허용 여부
[SerializeField] private List<BoxLootOption> lootOptions = new(); // 랜덤 후보 아이템 목록

private bool isOpened = false;                                    // 현재 상자가 열려 있는지 여부

/// <summary>
/// 체스트 UI가 읽어갈 슬롯 목록
/// 슬롯 수는 항상 slotCapacity와 동일하게 유지된다.
/// </summary>
public IReadOnlyList<BoxItemEntry> Items => items;

/// <summary>
/// 현재 상자가 가지는 총 슬롯 개수
/// </summary>
public int SlotCount => items.Count;

private void Awake()
{
    EnsureSlotCapacity();

    // 랜덤 생성 모드를 사용하고,
    // 아직 상자 안이 완전히 비어 있을 때만 시작 시 한 번 채운다.
    if (useRandomLoot && IsEmpty())
        GenerateRandomItems();
}

private void OnValidate()
{
    EnsureSlotCapacity();
}

/// <summary>
/// 인스펙터 우클릭 메뉴에서 랜덤 아이템을 다시 생성할 때 사용
/// </summary>
[ContextMenu("Generate Random Items")]
private void GenerateRandomItemsFromContextMenu()
{
    EnsureSlotCapacity();
    GenerateRandomItems();
}

/// <summary>
/// 플레이어가 상자와 상호작용했을 때 호출
/// 이미 열려 있으면 중복으로 열지 않는다.
/// </summary>
public bool Interact(int playerID)
{
    if (isOpened)
        return false;

    isOpened = true;

    // Presenter가 체스트 UI를 열 수 있도록 이벤트 전달
    GlobalEventBus.OnItemBoxOpened?.Invoke(this, playerID);

    // 상자는 사라지지 않으므로 false 반환
    return false;
}

/// <summary>
/// 지정한 슬롯 인덱스의 데이터를 반환
/// </summary>
public BoxItemEntry GetItem(int index)
{
    if (index < 0 || index >= items.Count)
        return null;

    return items[index];
}

/// <summary>
/// 지정한 슬롯이 비어 있는지 확인
/// </summary>
public bool IsSlotEmpty(int index)
{
    if (index < 0 || index >= items.Count)
        return true;

    BoxItemEntry entry = items[index];
    if (entry == null)
        return true;

    return entry.itemData == null || entry.amount <= 0;
}

/// <summary>
/// 슬롯 하나를 완전히 비움
/// 슬롯 자체는 삭제하지 않는다.
/// </summary>
public void ClearSlot(int index)
{
    if (index < 0 || index >= items.Count)
        return;

    if (items[index] == null)
        items[index] = CreateEmptyEntry();

    items[index].itemData = null;
    items[index].amount = 0;
}

/// <summary>
/// 슬롯 하나에서 수량을 감소시킴
/// 수량이 0 이하가 되면 빈 슬롯으로 만든다.
/// </summary>
public void RemoveAmount(int index, int amount)
{
    if (index < 0 || index >= items.Count)
        return;

    if (IsSlotEmpty(index))
        return;

    items[index].amount -= amount;

    if (items[index].amount <= 0)
        ClearSlot(index);
}

/// <summary>
/// 상자 전체가 비어 있는지 확인
/// 슬롯 개수가 0인지가 아니라, 모든 슬롯이 비었는지를 본다.
/// </summary>
public bool IsEmpty()
{
    for (int i = 0; i < items.Count; i++)
    {
        if (!IsSlotEmpty(i))
            return false;
    }

    return true;
}

/// <summary>
/// 상자 UI를 닫을 때 다시 열 수 있도록 상태를 해제
/// </summary>
public void CloseBox()
{
    isOpened = false;
}

/// <summary>
/// 아이템을 상자 안에 넣고, 다 못 넣은 수량을 반환
/// 먼저 같은 아이템 스택을 채우고, 그 다음 빈 칸에 넣는다.
/// </summary>
public int TryAddItem(ItemData itemData, int count)
{
    if (itemData == null || count <= 0)
        return count;

    int remain = count;

    // 1. 먼저 같은 아이템이 있는 슬롯에 누적
    for (int i = 0; i < items.Count; i++)
    {
        if (IsSlotEmpty(i))
            continue;

        if (items[i].itemData.TID != itemData.TID)
            continue;

        remain = TryAddToSlot(i, itemData, remain);

        if (remain <= 0)
            return 0;
    }

    // 2. 남은 수량을 빈 슬롯에 추가
    for (int i = 0; i < items.Count; i++)
    {
        if (!IsSlotEmpty(i))
            continue;

        remain = TryAddToSlot(i, itemData, remain);

        if (remain <= 0)
            return 0;
    }

    return remain;
}

/// <summary>
/// 특정 슬롯에 아이템을 넣고, 다 못 넣은 수량을 반환
/// </summary>
public int TryAddToSlot(int slotIndex, ItemData itemData, int count)
{
    if (slotIndex < 0 || slotIndex >= items.Count)
        return count;

    if (itemData == null || count <= 0)
        return count;

    if (items[slotIndex] == null)
        items[slotIndex] = CreateEmptyEntry();

    BoxItemEntry slot = items[slotIndex];
    int maxStack = Mathf.Max(1, itemData.itemMultiple);

    // 빈 슬롯이면 새로 배치
    if (IsSlotEmpty(slotIndex))
    {
        int addAmount = Mathf.Min(count, maxStack);

        slot.itemData = itemData;
        slot.amount = addAmount;

        return count - addAmount;
    }

    // 같은 아이템이면 스택 누적
    if (slot.itemData.TID == itemData.TID)
    {
        int canAdd = maxStack - slot.amount;

        if (canAdd <= 0)
            return count;

        int addAmount = Mathf.Min(count, canAdd);
        slot.amount += addAmount;

        return count - addAmount;
    }

    // 다른 아이템이 이미 있으면 넣지 못함
    return count;
}

/// <summary>
/// 랜덤 후보 목록에서 아이템을 뽑아 상자 안 슬롯에 채움
/// 기존 슬롯은 삭제하지 않고 내용만 비운 뒤 다시 채운다.
/// </summary>
private void GenerateRandomItems()
{
    EnsureSlotCapacity();
    ClearAllSlots();

    int createMin = Mathf.Max(1, minCreateCount);
    int createMax = Mathf.Max(createMin, maxCreateCount);

    List<BoxLootOption> pool = new List<BoxLootOption>();

    for (int i = 0; i < lootOptions.Count; i++)
    {
        if (lootOptions[i] == null || lootOptions[i].itemData == null)
            continue;

        pool.Add(lootOptions[i]);
    }

    if (pool.Count == 0)
        return;

    int createCount = Random.Range(createMin, createMax + 1);

    // 중복 불가일 때는 후보 수 / 슬롯 수를 넘지 않도록 제한
    if (!allowDuplicateLoot)
        createCount = Mathf.Min(createCount, pool.Count);

    createCount = Mathf.Min(createCount, items.Count);

    for (int i = 0; i < createCount; i++)
    {
        if (pool.Count == 0)
            break;

        BoxLootOption selectedOption = PickRandomOption(pool);

        if (selectedOption == null || selectedOption.itemData == null)
            continue;

        int minAmount = Mathf.Max(1, selectedOption.minAmount);
        int maxAmount = Mathf.Max(minAmount, selectedOption.maxAmount);
        int amount = Random.Range(minAmount, maxAmount + 1);

        // 상자 안에 실제로 아이템 넣기
        TryAddItem(selectedOption.itemData, amount);

        if (!allowDuplicateLoot)
            pool.Remove(selectedOption);
    }
}

/// <summary>
/// 가중치 기준으로 랜덤 후보 하나를 선택
/// </summary>
private BoxLootOption PickRandomOption(List<BoxLootOption> options)
{
    int totalWeight = 0;

    for (int i = 0; i < options.Count; i++)
    {
        totalWeight += Mathf.Max(1, options[i].weight);
    }

    int randomValue = Random.Range(0, totalWeight);
    int currentWeight = 0;

    for (int i = 0; i < options.Count; i++)
    {
        currentWeight += Mathf.Max(1, options[i].weight);

        if (randomValue < currentWeight)
            return options[i];
    }

    return options[options.Count - 1];
}

/// <summary>
/// 상자의 슬롯 개수를 slotCapacity와 맞춤
/// 빈 슬롯도 실제 엔트리로 유지한다.
/// </summary>
private void EnsureSlotCapacity()
{
    if (slotCapacity < 1)
        slotCapacity = 1;

    if (items == null)
        items = new List<BoxItemEntry>();

    while (items.Count < slotCapacity)
    {
        items.Add(CreateEmptyEntry());
    }

    while (items.Count > slotCapacity)
    {
        items.RemoveAt(items.Count - 1);
    }

    for (int i = 0; i < items.Count; i++)
    {
        if (items[i] == null)
            items[i] = CreateEmptyEntry();
    }
}

/// <summary>
/// 상자 안의 모든 슬롯을 빈 칸으로 초기화
/// 슬롯 자체는 삭제하지 않는다.
/// </summary>
private void ClearAllSlots()
{
    for (int i = 0; i < items.Count; i++)
    {
        ClearSlot(i);
    }
}

/// <summary>
/// 빈 슬롯 엔트리를 생성
/// </summary>
private BoxItemEntry CreateEmptyEntry()
{
    return new BoxItemEntry
    {
        itemData = null,
        amount = 0
    };
}
}
```


## Assets/02\_Scripts/Data/InventorySlotData.cs

### Previous Script

```cs

///<summary>
/// 인벤토리 슬롯 하나에 해당하는 데이터 구조에 대한 클래스입니다
/// 이후 프로그램의 확장이나 기능 추가에 따라 구조가 바뀔 수 있습니다
///</summary>
using UnityEngine;
using UnityEngine.UI;

[System.Serializable]
public class InventorySlotData
{
    public int TID;         // itemData의 TID와 매칭 (0이면 빈 칸)
    public int order;       // 인벤토리상의 순서
    public int amount;      // 현재 가지고 있는 수량
    public Sprite icon;     // 아이템 이미지

    // 생성자
    public InventorySlotData(int _id, int _order, int _amount, Sprite _icon)
    {
        TID = _id;
        order = _order;
        amount = _amount;
        icon = _icon;
    }
}
```

### Current Script

```cs
using UnityEngine;

///<summary>
/// 인벤토리 슬롯 1칸이 들고 있는 데이터를 보관한다.
/// TID와 아이콘뿐 아니라 실제 ItemData도 함께 들고 있어야
/// 상자 UI로 아이템을 다시 옮길 때 원본 데이터를 사용할 수 있다.
///</summary>
[System.Serializable]
public class InventorySlotData
{
    public int TID;             // 아이템 고유 ID (0이면 빈 슬롯)
    public int order;           // 인벤토리 내 슬롯 순서
    public int amount;          // 현재 슬롯 수량
    public Sprite icon;         // UI에 표시할 아이콘
    public ItemData itemData;   // 실제 아이템 원본 데이터

    public InventorySlotData(int _id, int _order, int _amount, Sprite _icon, ItemData _itemData = null)
    {
        TID = _id;
        order = _order;
        amount = _amount;
        icon = _icon;
        itemData = _itemData;
    }
}
```

## Assets/02\_Scripts/System/Player/PlayerInventory.cs

### Previous Script

```cs
///<summary>
/// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스
///</summary>
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class PlayerInventory : MonoBehaviour
{
    public List<InventorySlotData> slots = new();
    public List<InventorySlotData> quickSlots = new();
    public int slotNum { get; private set; }
    public int quickSlotNum { get; private set; }

    // 로컬 이벤트
    public event Action<int> OnSlotChanged;             // 특정 칸의 정보 업데이트

    // Addressable Assets 불러오기
    private AsyncOperationHandle<Sprite> loadHandle;    // 메모리 관리를 위해 로드 상태를 저장할 핸들

    void Awake()
    {
        slotNum = 10;
        quickSlotNum = 3;

        // 모든 슬롯 데이터 초기화
        for (int i = 0; i < slotNum; i++)
        {
            slots.Add(new InventorySlotData(0, i, 0, null));
        }
        for (int i = 0; i < quickSlotNum; i++)
        {
            quickSlots.Add(new InventorySlotData(0, i, 0, null));
        }
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;
    }

    /* 인벤토리에 아이템 추가 또는 더해짐 */
    /* 인벤토리에 아이템 추가 및 남는 수량 반환 */
    public int AddItem(ItemData _itemData, int _count)
    {
        if (_itemData == null) return 0;

        // 동일 아이템이 이미 있으면 먼저 해당 슬롯에 누적 시도
        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID == _itemData.TID && slots[i].amount < _itemData.itemMultiple)
            {
                // 현재 수량 + 추가 수량을 합친 뒤 최대 스택 수를 넘는지 계산
                int totalAmount = slots[i].amount + _count;

                // 슬롯에는 최대 스택 수까지만 저장
                slots[i].amount = totalAmount >= _itemData.itemMultiple ? _itemData.itemMultiple : totalAmount;

                // UI 갱신 이벤트 호출
                OnSlotChanged?.Invoke(i);

                // 초과 수량 반환
                int remain = totalAmount - _itemData.itemMultiple;
                return remain > 0 ? remain : 0;
            }
        }

        // 빈 슬롯이 있으면 새 슬롯에 아이템 추가
        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID == 0)
            {
                slots[i].TID = _itemData.TID;

                // 아이콘 로드
                LoadSprite(_itemData.icon, i);

                // 새 슬롯에도 최대 스택 수까지만 저장
                slots[i].amount = _count >= _itemData.itemMultiple ? _itemData.itemMultiple : _count;

                // UI 갱신 이벤트 호출
                OnSlotChanged?.Invoke(i);

                // 초과 수량 반환
                int remain = _count - _itemData.itemMultiple;
                return remain > 0 ? remain : 0;
            }
        }

        // 인벤토리가 가득 차서 넣지 못한 경우 남은 수량 그대로 반환
        Debug.Log("인벤토리가 가득차서 아이템을 주울 수 없습니다.");
        return _count;
    }

    /* 아이템의 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
    private void LoadSprite(AssetReferenceSprite iconRef, int slotIndex)
    {
        loadHandle = Addressables.LoadAssetAsync<Sprite>(iconRef);

        loadHandle.Completed += (handle) =>
        {
            // 성공적으로 가져왔는지 확인
            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                // 로드된 아이콘을 슬롯 데이터에 반영
                slots[slotIndex].icon = handle.Result;

                // 아이콘이 준비된 시점에 UI를 한 번 더 갱신
                OnSlotChanged?.Invoke(slotIndex);
            }
            else
            {
                // 필요 시 에러 로그 추가 가능
                // Debug.LogError("스프라이트를 불러오는데 실패했습니다.");
            }
        };
    }

    public void UseItem(int slotIndex)
    {
        // 유효성 검사 (빈 슬롯이 아닌지)
        if (slots[slotIndex].TID == 0) return;

        // 갯수 차감
        slots[slotIndex].amount--;

        // 갯수가 0 이하라면 슬롯 초기화 (빈 슬롯으로 만들기)
        if (slots[slotIndex].amount <= 0)
        {
            slots[slotIndex].TID = 0;
            slots[slotIndex].amount = 0;
            slots[slotIndex].icon = null; // 필요시 명시적 null 처리
        }
    }

    /* 인벤토리 슬롯 데이터를 교환 */
    public void SwapSlotData(int _index1, int _index2)
    {
        /// ※추가: 해당 아이템이 동일한 아이템이라면 존재한다면 합산 가능한지 판정 후 합산 ///

        InventorySlotData slot1 = slots[_index1];
        InventorySlotData slot2 = slots[_index2];

        // 두 데이터 교환
        (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
        (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
        (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);

        // 변동사항 알림
        OnSlotChanged?.Invoke(_index1);
        OnSlotChanged?.Invoke(_index2);
    }

    /* 퀵슬롯에 아이템 추가 */
    public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
    {
        InventorySlotData slot = slots[_slotIndex];
        InventorySlotData qSlot = quickSlots[_quickIndex];

        // 소모품이 아닐 경우에는 퀵슬롯에 등록하지 않음
        if(slot.TID<=300 || slot.TID>=400) return;

        // 이미 퀵슬롯에 있다면 기존의 퀵슬롯 내용을 삭제
        for (int i = 0; i < quickSlotNum; i++)
        {
            if(quickSlots[i].TID==slot.TID)
            {
                GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
            }
        }

        qSlot.TID = slot.TID;
        qSlot.amount = slot.amount;
        qSlot.icon = slot.icon;

        OnSlotChanged?.Invoke(_slotIndex);
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
    }

    /* 퀵슬롯 아이템 사용 */
    public void UseQuickSlotItem(int _index)
    {
        if(quickSlots[_index]==null || _index>quickSlotNum) return;

        InventorySlotData slot = quickSlots[_index];
        // 아이템 사용으로 갯수 감소
        slot.amount--;
        // 사용에 따른 퀵슬롯 변화
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index, slot.icon, slot.amount);
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

        // 변동사항 알림
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
    }
}
```

### Current Script

```cs
/// <summary>
/// 플레이어의 인벤토리 데이터를 보관하고 아이템 수납 / 사용 / 교환을 관리한다.
/// </summary>
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class PlayerInventory : MonoBehaviour
{
public List<InventorySlotData> slots = new();
public List<InventorySlotData> quickSlots = new();
public int slotNum { get; private set; }
public int quickSlotNum { get; private set; }
// 특정 슬롯 UI를 갱신할 때 사용하는 이벤트
public event Action<int> OnSlotChanged;

// Addressables 스프라이트 로드 핸들
private AsyncOperationHandle<Sprite> loadHandle;

private void Awake()
{
    slotNum = 10;
    quickSlotNum = 3;

    // 인벤토리 슬롯 초기화
    for (int i = 0; i < slotNum; i++)
    {
        slots.Add(new InventorySlotData(0, i, 0, null, null));
    }

    // 퀵슬롯 초기화
    for (int i = 0; i < quickSlotNum; i++)
    {
        quickSlots.Add(new InventorySlotData(0, i, 0, null, null));
    }
}

private void OnEnable()
{
    /// 이벤트 구독 ///
    GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
    GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
    GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;
}

private void OnDisable()
{
    /// 이벤트 구독 해제 ///
    GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
    GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
    GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;
}

/// <summary>
/// 인벤토리에 아이템을 넣고, 다 못 넣은 남은 수량을 반환한다.
/// 1. 먼저 같은 아이템 스택을 채운다.
/// 2. 남은 수량은 빈 슬롯에 넣는다.
/// 3. 끝까지 못 넣은 수량만 반환한다.
/// </summary>
public int AddItem(ItemData _itemData, int _count)
{
    if (_itemData == null || _count <= 0)
        return _count;

    int remain = _count;

    // 1. 먼저 같은 아이템이 있는 기존 스택을 최대치까지 채운다.
    for (int i = 0; i < slotNum; i++)
    {
        if (slots[i].TID != _itemData.TID)
            continue;

        if (slots[i].amount >= _itemData.itemMultiple)
            continue;

        remain = TryAddToSlot(i, _itemData, remain);

        if (remain <= 0)
            return 0;
    }

    // 2. 남은 수량을 빈 슬롯들에 순서대로 배치한다.
    for (int i = 0; i < slotNum; i++)
    {
        if (!IsSlotEmpty(i))
            continue;

        remain = TryAddToSlot(i, _itemData, remain);

        if (remain <= 0)
            return 0;
    }

    // 3. 끝까지 못 넣은 수량 반환
    if (remain > 0)
        Debug.Log("인벤토리가 가득차 일부 아이템을 넣지 못했습니다.");

    return remain;
}

/// <summary>
/// 특정 슬롯 하나에 아이템을 넣고, 남은 수량을 반환한다.
/// 같은 아이템 스택이거나 빈 슬롯일 때만 넣을 수 있다.
/// </summary>
public int TryAddToSlot(int _slotIndex, ItemData _itemData, int _count)
{
    if (_slotIndex < 0 || _slotIndex >= slotNum)
        return _count;

    if (_itemData == null || _count <= 0)
        return _count;

    InventorySlotData slot = slots[_slotIndex];
    int maxStack = Mathf.Max(1, _itemData.itemMultiple);

    // 빈 슬롯이면 새로 아이템 배치
    if (IsSlotEmpty(_slotIndex))
    {
        int addAmount = Mathf.Min(_count, maxStack);

        slot.TID = _itemData.TID;
        slot.amount = addAmount;
        slot.icon = null;
        slot.itemData = _itemData;

        // 아이콘 로드
        LoadSprite(_itemData.icon, _slotIndex);

        // 텍스트 수량 반영을 위해 즉시 UI 갱신
        OnSlotChanged?.Invoke(_slotIndex);

        return _count - addAmount;
    }

    // 다른 아이템이 들어 있으면 넣을 수 없음
    if (slot.TID != _itemData.TID)
        return _count;

    // 같은 아이템 스택인데 원본 데이터가 비어 있으면 다시 연결해 둔다.
    if (slot.itemData == null)
        slot.itemData = _itemData;

    // 같은 아이템이면 남은 스택 공간만큼 추가
    int canAdd = maxStack - slot.amount;

    if (canAdd <= 0)
        return _count;

    int realAdd = Mathf.Min(_count, canAdd);
    slot.amount += realAdd;

    // 같은 아이템 스택 증가 반영
    OnSlotChanged?.Invoke(_slotIndex);

    return _count - realAdd;
}

/// <summary>
/// 특정 슬롯 데이터를 반환한다.
/// </summary>
public InventorySlotData GetSlot(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= slotNum)
        return null;

    return slots[_slotIndex];
}

/// <summary>
/// 특정 슬롯이 들고 있는 실제 ItemData를 반환한다.
/// 상자와 인벤토리 사이 이동 처리에서 사용한다.
/// </summary>
public ItemData GetSlotItemData(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= slotNum)
        return null;

    return slots[_slotIndex].itemData;
}

/// <summary>
/// 특정 슬롯이 비어 있는지 확인한다.
/// </summary>
public bool IsSlotEmpty(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= slotNum)
        return true;

    return slots[_slotIndex].TID == 0 || slots[_slotIndex].amount <= 0;
}

/// <summary>
/// 특정 슬롯의 수량을 감소시킨다.
/// 수량이 0 이하가 되면 슬롯을 비운다.
/// </summary>
public void RemoveAmount(int _slotIndex, int _count)
{
    if (_slotIndex < 0 || _slotIndex >= slotNum)
        return;

    if (IsSlotEmpty(_slotIndex))
        return;

    slots[_slotIndex].amount -= _count;

    if (slots[_slotIndex].amount <= 0)
    {
        ClearSlot(_slotIndex);
        return;
    }

    OnSlotChanged?.Invoke(_slotIndex);
}

/// <summary>
/// 특정 슬롯을 완전히 비운다.
/// </summary>
public void ClearSlot(int _slotIndex)
{
    if (_slotIndex < 0 || _slotIndex >= slotNum)
        return;

    slots[_slotIndex].TID = 0;
    slots[_slotIndex].amount = 0;
    slots[_slotIndex].icon = null;
    slots[_slotIndex].itemData = null;

    OnSlotChanged?.Invoke(_slotIndex);
}

/// <summary>
/// 아이템 아이콘 Addressable 주소를 해석해서 슬롯에 반영한다.
/// </summary>
private void LoadSprite(AssetReferenceSprite iconRef, int slotIndex)
{
    if (iconRef == null || !iconRef.RuntimeKeyIsValid())
    {
        slots[slotIndex].icon = null;
        OnSlotChanged?.Invoke(slotIndex);
        return;
    }

    loadHandle = Addressables.LoadAssetAsync<Sprite>(iconRef);

    loadHandle.Completed += (handle) =>
    {
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            slots[slotIndex].icon = handle.Result;
            OnSlotChanged?.Invoke(slotIndex);
        }
        else
        {
            slots[slotIndex].icon = null;
            OnSlotChanged?.Invoke(slotIndex);
        }
    };
}

/// <summary>
/// 슬롯의 아이템을 1개 사용한다.
/// </summary>
public void UseItem(int slotIndex)
{
    if (IsSlotEmpty(slotIndex))
        return;

    RemoveAmount(slotIndex, 1);
}

/// <summary>
/// 인벤토리 슬롯끼리 데이터를 교환한다.
/// </summary>
public void SwapSlotData(int _index1, int _index2)
{
    InventorySlotData slot1 = slots[_index1];
    InventorySlotData slot2 = slots[_index2];

    (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
    (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
    (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
    (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

    OnSlotChanged?.Invoke(_index1);
    OnSlotChanged?.Invoke(_index2);
}

/// <summary>
/// 인벤토리 아이템을 퀵슬롯에 등록한다.
/// </summary>
public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
{
    InventorySlotData slot = slots[_slotIndex];
    InventorySlotData qSlot = quickSlots[_quickIndex];

    // 소모품만 퀵슬롯 등록 가능
    if (slot.TID <= 300 || slot.TID >= 400)
        return;

    // 이미 등록된 동일 아이템이 있으면 기존 퀵슬롯 비우기
    for (int i = 0; i < quickSlotNum; i++)
    {
        if (quickSlots[i].TID == slot.TID)
        {
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }
    }

    qSlot.TID = slot.TID;
    qSlot.amount = slot.amount;
    qSlot.icon = slot.icon;
    qSlot.itemData = slot.itemData;

    OnSlotChanged?.Invoke(_slotIndex);
    GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
}

/// <summary>
/// 퀵슬롯 아이템을 1개 사용한다.
/// </summary>
public void UseQuickSlotItem(int _index)
{
    if (_index < 0 || _index >= quickSlotNum)
        return;

    if (quickSlots[_index] == null)
        return;

    InventorySlotData slot = quickSlots[_index];
    slot.amount--;

    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index, slot.icon, slot.amount);
}

/// <summary>
/// 퀵슬롯끼리 데이터를 교환한다.
/// </summary>
private void SwapItemQuickSlot(int _index1, int _index2)
{
    InventorySlotData slot1 = quickSlots[_index1];
    InventorySlotData slot2 = quickSlots[_index2];

    (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
    (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
    (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
    (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
    GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
}
}
```

## Assets/02\_Scripts/UI/ChestUI.cs

### Previous Script

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class ChestUI : MonoBehaviour
{
    [SerializeField] private Transform slotContainer;
    [SerializeField] private GameObject slotPrefab;
    [SerializeField] private List<GameObject> slotsObj = new();
    [SerializeField] private Button closeButton;

    private ItemBox itemBox;
    private PlayerInventory playerInventory;
    private Action onCloseRequested;

    private void Awake()
    {
        if (closeButton != null)
            closeButton.onClick.AddListener(CloseUI);
    }

    public void Bind(ItemBox box, PlayerInventory inventory, Action closeRequested = null)
    {
        itemBox = box;
        playerInventory = inventory;
        onCloseRequested = closeRequested;

        CreateSlots(itemBox.Items.Count);
        RefreshAll();
    }

    public void CreateSlots(int count)
    {
        foreach (var obj in slotsObj)
            Destroy(obj);

        slotsObj.Clear();

        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            ChestSlotUI slotUI = newSlot.GetComponent<ChestSlotUI>();
            slotUI.Initialize(this, i);
            slotsObj.Add(newSlot);
        }
    }

    public void RefreshAll()
    {
        for (int i = 0; i < slotsObj.Count; i++)
        {
            ChestSlotUI slotUI = slotsObj[i].GetComponent<ChestSlotUI>();
            BoxItemEntry entry = itemBox.GetItem(i);

            if (entry == null || entry.itemData == null)
                slotUI.UpdateSlot(0, null);
            else
                LoadSlotIcon(slotUI, entry);
        }
    }

    public void TryMoveToInventory(int slotIndex)
    {
        BoxItemEntry entry = itemBox.GetItem(slotIndex);
        if (entry == null || entry.itemData == null || entry.amount <= 0)
            return;

        int remain = playerInventory.AddItem(entry.itemData, entry.amount);
        int moved = entry.amount - remain;

        if (moved <= 0)
            return;

        itemBox.RemoveAmount(slotIndex, moved);

        CreateSlots(itemBox.Items.Count);
        RefreshAll();

        if (itemBox.IsEmpty())
            CloseUI();
    }

    public void CloseUI()
    {
        onCloseRequested?.Invoke();
    }

    private void LoadSlotIcon(ChestSlotUI slotUI, BoxItemEntry entry)
    {
        if (slotUI == null || entry == null || entry.itemData == null)
            return;

        AsyncOperationHandle<Sprite> handle = Addressables.LoadAssetAsync<Sprite>(entry.itemData.icon);
        handle.Completed += operation =>
        {
            if (slotUI == null)
                return;

            if (operation.Status == AsyncOperationStatus.Succeeded)
                slotUI.UpdateSlot(entry.amount, operation.Result);
            else
                slotUI.UpdateSlot(entry.amount, null);

            Addressables.Release(operation);
        };
    }
}
```

### Current Script

```cs
﻿using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using UnityEngine.UI;

///<summary>
/// 상자 UI를 관리하는 스크립트
/// 상자 슬롯은 고정 개수로 한 번만 생성하고,
/// 이후에는 슬롯 내용을 갱신하는 방식으로 동작한다.
///</summary>
public class ChestUI : MonoBehaviour
{
    [Header("Chest UI")]
    [SerializeField] private Transform slotContainer;           // 체스트 슬롯이 생성될 부모
    [SerializeField] private GameObject slotPrefab;             // 체스트 슬롯 프리팹
    [SerializeField] private List<GameObject> slotsObj = new(); // 생성된 슬롯 오브젝트 목록
    [SerializeField] private Button closeButton;                // 닫기 버튼

    private ItemBox itemBox;                                    // 현재 열려 있는 상자 데이터
    private PlayerInventory playerInventory;                    // 플레이어 인벤토리 참조
    private Action onCloseRequested;                            // 닫기 요청 콜백

    public static ChestUI ActiveUI { get; private set; }        // 현재 열려 있는 체스트 UI

    private void Awake()
    {
        if (closeButton != null)
            closeButton.onClick.AddListener(CloseUI);
    }

    private void OnDisable()
    {
        if (ActiveUI == this)
            ActiveUI = null;
    }

    ///<summary>
    /// 체스트 UI와 상자 데이터를 연결한다.
    /// 상자 슬롯 개수만큼 슬롯을 만들고, 내용을 갱신한다.
    ///</summary>
    public void Bind(ItemBox box, PlayerInventory inventory, Action closeRequested = null)
    {
        itemBox = box;
        playerInventory = inventory;
        onCloseRequested = closeRequested;
        ActiveUI = this;

        if (itemBox == null)
            return;

        // 고정 슬롯 개수 기준으로 슬롯 생성
        CreateSlots(itemBox.SlotCount);

        // 현재 상자 내용으로 슬롯 갱신
        RefreshAll();
    }

    ///<summary>
    /// 슬롯을 count개 생성한다.
    /// 이미 같은 개수로 만들어져 있으면 다시 만들지 않는다.
    ///</summary>
    public void CreateSlots(int count)
    {
        if (slotsObj.Count == count)
            return;

        // 기존 슬롯 제거
        for (int i = 0; i < slotsObj.Count; i++)
        {
            if (slotsObj[i] != null)
                Destroy(slotsObj[i]);
        }

        slotsObj.Clear();

        // 새 슬롯 생성
        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            ChestSlotUI slotUI = newSlot.GetComponent<ChestSlotUI>();

            if (slotUI != null)
                slotUI.Initialize(this, i);

            slotsObj.Add(newSlot);
        }
    }

    ///<summary>
    /// 모든 슬롯의 UI를 현재 상자 데이터 기준으로 갱신한다.
    ///</summary>
    public void RefreshAll()
    {
        if (itemBox == null)
            return;

        for (int i = 0; i < slotsObj.Count; i++)
        {
            RefreshSlot(i);
        }
    }

    ///<summary>
    /// 특정 슬롯 하나만 갱신한다.
    ///</summary>
    public void RefreshSlot(int slotIndex)
    {
        if (itemBox == null)
            return;

        if (slotIndex < 0 || slotIndex >= slotsObj.Count)
            return;

        ChestSlotUI slotUI = slotsObj[slotIndex].GetComponent<ChestSlotUI>();
        if (slotUI == null)
            return;

        BoxItemEntry entry = itemBox.GetItem(slotIndex);

        // 슬롯이 비어 있으면 빈 칸으로 갱신
        if (entry == null || entry.itemData == null || entry.amount <= 0)
        {
            slotUI.UpdateSlot(0, null);
            return;
        }

        // 아이콘이 필요한 슬롯이면 비동기로 불러와서 갱신
        LoadSlotIcon(slotUI, entry);
    }

    ///<summary>
    /// 체스트 슬롯의 아이템을 인벤토리로 옮긴다.
    /// 인벤토리에 다 못 들어간 수량은 상자에 남긴다.
    ///</summary>
    public void TryMoveToInventory(int slotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        BoxItemEntry entry = itemBox.GetItem(slotIndex);
        if (entry == null || entry.itemData == null || entry.amount <= 0)
            return;

        int remain = playerInventory.AddItem(entry.itemData, entry.amount);
        int movedAmount = entry.amount - remain;

        if (movedAmount <= 0)
            return;

        itemBox.RemoveAmount(slotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 체스트 슬롯의 아이템을 인벤토리의 특정 칸으로 옮긴다.
    /// 비어 있는 칸이거나 같은 아이템 스택일 때만 이동된다.
    ///</summary>
    public void TryMoveToInventorySlot(int chestSlotIndex, int inventorySlotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        BoxItemEntry entry = itemBox.GetItem(chestSlotIndex);
        if (entry == null || entry.itemData == null || entry.amount <= 0)
            return;

        int remain = playerInventory.TryAddToSlot(inventorySlotIndex, entry.itemData, entry.amount);
        int movedAmount = entry.amount - remain;

        if (movedAmount <= 0)
            return;

        itemBox.RemoveAmount(chestSlotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 인벤토리 슬롯의 아이템을 상자 안으로 옮긴다.
    /// 먼저 같은 아이템 스택을 채우고, 남는 수량은 빈 슬롯에 넣는다.
    ///</summary>
    public void TryMoveFromInventory(int inventorySlotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        InventorySlotData inventorySlot = playerInventory.GetSlot(inventorySlotIndex);
        if (inventorySlot == null || playerInventory.IsSlotEmpty(inventorySlotIndex))
            return;

        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);
        if (itemData == null)
            return;

        int remain = itemBox.TryAddItem(itemData, inventorySlot.amount);
        int movedAmount = inventorySlot.amount - remain;

        if (movedAmount <= 0)
            return;

        playerInventory.RemoveAmount(inventorySlotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 인벤토리 슬롯의 아이템을 상자의 특정 칸으로 옮긴다.
    /// 대상 칸이 비어 있거나 같은 아이템 스택일 때만 이동된다.
    ///</summary>
    public void TryMoveFromInventorySlot(int inventorySlotIndex, int chestSlotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        InventorySlotData inventorySlot = playerInventory.GetSlot(inventorySlotIndex);
        if (inventorySlot == null || playerInventory.IsSlotEmpty(inventorySlotIndex))
            return;

        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);
        if (itemData == null)
            return;

        int remain = itemBox.TryAddToSlot(chestSlotIndex, itemData, inventorySlot.amount);
        int movedAmount = inventorySlot.amount - remain;

        if (movedAmount <= 0)
            return;

        playerInventory.RemoveAmount(inventorySlotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 상자 UI를 닫는다.
    /// 실제 닫기 처리는 Presenter 쪽 콜백에 맡긴다.
    ///</summary>
    public void CloseUI()
    {
        onCloseRequested?.Invoke();
    }

    ///<summary>
    /// 슬롯 아이콘을 Addressables로 불러와 갱신한다.
    ///</summary>
    private void LoadSlotIcon(ChestSlotUI slotUI, BoxItemEntry entry)
    {
        if (slotUI == null || entry == null || entry.itemData == null)
            return;

        AsyncOperationHandle<Sprite> handle = Addressables.LoadAssetAsync<Sprite>(entry.itemData.icon);

        handle.Completed += operation =>
        {
            if (slotUI == null)
                return;

            if (operation.Status == AsyncOperationStatus.Succeeded)
                slotUI.UpdateSlot(entry.amount, operation.Result);
            else
                slotUI.UpdateSlot(entry.amount, null);

            Addressables.Release(operation);
        };
    }
}
```

## Assets/02\_Scripts/UI/ChestSlotUI.cs

### Previous Script

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class ChestSlotUI : MonoBehaviour, IPointerClickHandler
{
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;

    private ChestUI chestUI;
    private int slotIndex;

    public void Initialize(ChestUI owner, int index)
    {
        chestUI = owner;
        slotIndex = index;
        UpdateSlot(0, null);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Right)
            chestUI.TryMoveToInventory(slotIndex);
    }
}
```

### Current Script

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

///<summary>
/// 체스트 슬롯 1칸의 표시와 입력을 담당한다.
/// 우클릭으로 인벤토리 이동, 드래그앤드롭으로 슬롯 지정 이동을 처리한다.
///</summary>
public class ChestSlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    private ChestUI chestUI;
    private int slotIndex;
    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    public int SlotIndex => slotIndex;
    public ChestUI OwnerUI => chestUI;

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();

        // 프리팹에 직접 연결이 빠져 있어도 동일한 자식 이름을 찾아 자동 연결한다.
        if (itemInfo == null)
            itemInfo = transform.Find("ItemInfo");

        if (itemInfo != null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
    }

    public void Initialize(ChestUI owner, int index)
    {
        chestUI = owner;
        slotIndex = index;
        UpdateSlot(0, null);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Right)
            chestUI.TryMoveToInventory(slotIndex);
    }

    public void OnBeginDrag(PointerEventData eventData)
    {
        if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
            return;

        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;
    }

    public void OnDrag(PointerEventData eventData)
    {
        if (itemInfo == null)
            return;

        itemInfo.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = true;

        if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
        {
            itemInfo.SetParent(this.transform);
            itemInfo.localPosition = Vector3.zero;
        }
    }

    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (droppedObj.TryGetComponent<InventorySlotUI>(out var inventorySlot))
        {
            // 인벤토리 슬롯에서 체스트 특정 칸으로 드롭했을 때 그 칸으로 이동을 시도한다.
            chestUI.TryMoveFromInventorySlot(inventorySlot.slotIndex, slotIndex);
        }
    }
}
```

## Assets/02\_Scripts/UI/InventoryUI.cs

### Previous Script

```cs
///<summary>
/// 플레이어 UI 실행에 관련된 모든 작업을 수행합니다
/// 정보를 저장하지 않고 UI 출력에 대한 업데이트만 수행합니다
///</summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.AddressableAssets;

public class InventoryUI : MonoBehaviour
{
    [Header("Inventory UI")]
    [SerializeField] Transform slotContainer;               // 인벤토리 슬롯 목록 그리드
    [SerializeField] List<GameObject> slotsObj;              // 인벤토리 슬롯 오브젝트들
    [SerializeField] GameObject slotPrefab;                 // 슬롯 프리팹

    // 인벤토리 그리드 영역에 _count개의 슬롯을 생성
    public void CreatSlots(int _count)
    {
        if(slotsObj.Count==_count) return;

        // 리스트 내의 모든 슬롯 오브젝트 클리어
        slotsObj.Clear();
        // 지정된 갯수만큼 생성
        for (int i = 0; i < _count; i++)
        {
            // 새로운 슬롯 생성
            GameObject newSlot = Instantiate(slotPrefab, slotContainer.transform);
            newSlot.GetComponent<InventorySlotUI>().Initialize(i);
            slotsObj.Add(newSlot);
        }
    }

    public void UpdateSlot(int slotNum, InventorySlotData slotData)
    {
        var slotUI = slotsObj[slotNum].GetComponent<InventorySlotUI>();
        slotUI.UpdateSlot(slotData.amount, slotData.icon);
    }
}
```

### Current Script

```cs
///<summary>
/// 플레이어 인벤토리 UI 출력만 담당한다.
/// 실제 데이터 저장은 하지 않고 슬롯 생성/갱신과 드랍존 표시만 처리한다.
///</summary>
using System.Collections.Generic;
using UnityEngine;

public class InventoryUI : MonoBehaviour
{
    [Header("Inventory UI")]
    [SerializeField] private Transform slotContainer;            // 인벤토리 슬롯이 생성될 부모
    [SerializeField] private List<GameObject> slotsObj = new();  // 생성된 인벤토리 슬롯 오브젝트 목록
    [SerializeField] private GameObject slotPrefab;              // 인벤토리 슬롯 프리팹

    [Header("Drop Zone UI")]
    [SerializeField] private InventoryDropZoneUI dropZone;       // 드래그 중 버리기용 드랍존

    private CanvasGroup dropZoneCanvasGroup;                     // 드랍존 표시/입력 제어용
    private bool canUseDropZone = true;                          // 현재 드랍존 사용 가능 여부

    private void Awake()
    {
        if (dropZone == null)
            dropZone = GetComponentInChildren<InventoryDropZoneUI>(true);

        if (dropZone != null)
            dropZoneCanvasGroup = dropZone.GetComponent<CanvasGroup>();

        HideDropZone();
    }

    ///<summary>
    /// 인벤토리 슬롯을 count개 생성한다.
    /// 슬롯 수가 같으면 다시 만들지 않는다.
    ///</summary>
    public void CreatSlots(int count)
    {
        if (slotsObj.Count == count)
            return;

        for (int i = 0; i < slotsObj.Count; i++)
        {
            if (slotsObj[i] != null)
                Destroy(slotsObj[i]);
        }

        slotsObj.Clear();

        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(i);

            slotsObj.Add(newSlot);
        }
    }

    ///<summary>
    /// 특정 슬롯 UI를 현재 인벤토리 데이터로 갱신한다.
    ///</summary>
    public void UpdateSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = slotsObj[slotNum].GetComponent<InventorySlotUI>();
        slotUI.UpdateSlot(slotData.amount, slotData.icon);
    }

    ///<summary>
    /// 드랍존 사용 가능 여부를 설정한다.
    /// 체스트가 열려 있으면 드랍존을 끈다.
    ///</summary>
    public void SetDropZoneAvailable(bool available)
    {
        canUseDropZone = available;

        if (!canUseDropZone)
            HideDropZone();
    }

    ///<summary>
    /// 드래그 중일 때만 드랍존을 보이게 한다.
    ///</summary>
    public void ShowDropZone()
    {
        if (!canUseDropZone || dropZoneCanvasGroup == null)
            return;

        dropZoneCanvasGroup.alpha = 1f;
        dropZoneCanvasGroup.blocksRaycasts = true;
        dropZoneCanvasGroup.interactable = true;
    }

    ///<summary>
    /// 드래그가 끝나면 드랍존을 숨긴다.
    ///</summary>
    public void HideDropZone()
    {
        if (dropZoneCanvasGroup == null)
            return;

        dropZoneCanvasGroup.alpha = 0f;
        dropZoneCanvasGroup.blocksRaycasts = false;
        dropZoneCanvasGroup.interactable = false;
    }
}
```

## Assets/02\_Scripts/UI/InventorySlotUI.cs

### Previous Script

```cs
///<summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
///</summary>
using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("슬롯 내 요소")]
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    public int slotIndex { get; set; }

    // 드래그 기능 관련 변수
    private CanvasGroup canvasGroup;
    private InventoryUI inventoryUI;
    private Canvas mainCanvas;
    public event Action<int, int> OnSlotDrop;             // 슬롯이 드롭 되었을 때 이벤트

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();
        inventoryUI = GetComponentInParent<InventoryUI>();

        if(mainCanvas==null || inventoryUI==null)
        {
            this.enabled = false;
            Debug.LogError("InventorySlotUI: 필요한 컴포넌트가 없습니다.");
            return;
        }

        if(itemInfo!=null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
    }

    /* 슬롯 초기화 */
    public void Initialize(int index)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        slotIndex = index;
    }

    /* 해당 슬롯의 UI를 변경하는 함수 (아이템 갯수, 스프라이트 이미지) */
    public void UpdateSlot(int _stack, Sprite _sprite)
    {
        // 들어있는 아이템이 없을 경우 빈 공간으로 초기화
        if(_stack==0 || _sprite==null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemStack.text = $"{_stack}";
        itemImg.sprite = _sprite;
        itemImg.enabled = true;
    }

    /* 드래그 시작 시 호출 */
    public void OnBeginDrag(PointerEventData eventData)
    {
        // 빈 슬롯이여서 옮길 아이콘이 없다면 드래그 취소
        if(itemInfo==null || !itemImg.enabled) return;

        // 캔버스 최상단으로 올려 가장 위에 보이게 함
        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        // 아이콘의 마우스 방해 끄기
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;
    }

    /* 드래그 중 지속적으로 호출 */
    public void OnDrag(PointerEventData eventData)
    {
        itemInfo.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        // 아이콘의 마우스 방해 다시 켜기
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = true;

        // 만약 자식이 다른 슬롯에 드래그되지 못했다면 원위치로 복귀
        if (itemInfo.parent == mainCanvas.transform)
        {
            itemInfo.SetParent(this.transform);
            itemInfo.localPosition = Vector3.zero; // 한가운데로 정렬
        }
    }

    /* 자신의 위에 무언가 드롭 되었을 떄 호출 */
    public void OnDrop(PointerEventData eventData)
    {
        // 직전까지 유저가 드래그하던 오브젝트
        GameObject droppedObj = eventData.pointerDrag;

        if(droppedObj!=null)
        {
            if(droppedObj.TryGetComponent<InventorySlotUI>(out var originSlot))
            {
                if(originSlot == this) return;

                // 두 슬롯간에 교환이 있었음을 방송
                GlobalEventBus.OnSwapInventorySlot(slotIndex, originSlot.slotIndex);
            }
        }
    }
}
```

### Current Script

```cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

///<summary>
/// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다.
/// 인벤토리 슬롯끼리 교환하고, 체스트가 열려 있으면 체스트와도 아이템을 주고받는다.
///</summary>
public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private InventoryUI inventoryUI;
    private Canvas mainCanvas;

    public event Action<int, int> OnSlotDrop;

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();
        inventoryUI = GetComponentInParent<InventoryUI>();

        if (mainCanvas == null || inventoryUI == null)
        {
            this.enabled = false;
            Debug.LogError("InventorySlotUI: 필요한 컴포넌트가 없습니다.");
            return;
        }

        if (itemInfo != null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
    }

    ///<summary>
    /// 슬롯을 빈 상태로 초기화하고 인덱스를 기록한다.
    ///</summary>
    public void Initialize(int index)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        slotIndex = index;
    }

    ///<summary>
    /// 전달받은 수량과 아이콘으로 슬롯 UI를 갱신한다.
    ///</summary>
    public void UpdateSlot(int stack, Sprite sprite)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemStack.text = stack.ToString();
        itemImg.sprite = sprite;
        itemImg.enabled = true;
    }

    ///<summary>
    /// 체스트가 열려 있을 때 우클릭하면 인벤토리 아이템을 상자로 옮긴다.
    ///</summary>
    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button != PointerEventData.InputButton.Right)
            return;

        if (!itemImg.enabled || ChestUI.ActiveUI == null)
            return;

        ChestUI.ActiveUI.TryMoveFromInventory(slotIndex);
    }

    public void OnBeginDrag(PointerEventData eventData)
    {
        if (itemInfo == null || !itemImg.enabled)
            return;

        // 드래그 중 아이콘이 다른 UI 아래로 가려지지 않게 최상단으로 올린다.
        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;

        inventoryUI.ShowDropZone();
    }

    public void OnDrag(PointerEventData eventData)
    {
        if (itemInfo == null)
            return;

        itemInfo.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = true;

        // 드래그 처리에 성공하지 못했으면 원래 슬롯 위치로 돌려놓는다.
        if (itemInfo != null && itemInfo.parent == mainCanvas.transform)
        {
            itemInfo.SetParent(transform);
            itemInfo.localPosition = Vector3.zero;
        }

        inventoryUI.HideDropZone();
    }

    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (droppedObj.TryGetComponent(out InventorySlotUI originSlot))
        {
            if (originSlot == this)
                return;

            // 인벤토리 슬롯끼리는 기존처럼 서로 위치를 교환한다.
            GlobalEventBus.OnSwapInventorySlot?.Invoke(slotIndex, originSlot.slotIndex);
            OnSlotDrop?.Invoke(slotIndex, originSlot.slotIndex);
            return;
        }

        if (droppedObj.TryGetComponent(out ChestSlotUI chestSlot))
        {
            // 체스트 슬롯에서 인벤토리 특정 칸으로 드랍되면 그 칸으로 이동을 시도한다.
            chestSlot.OwnerUI?.TryMoveToInventorySlot(chestSlot.SlotIndex, slotIndex);
        }
    }
}
```

## Assets/02\_Scripts/UI/InventoryDropZoneUI.cs

### Previous Script

```cs
// No previous version
```

### Current Script

```cs
using UnityEngine;
using UnityEngine.EventSystems;

///<summary>
/// 인벤토리에서 아이템을 버릴 때 사용하는 드롭존 UI이다.
/// 인벤토리 슬롯이 이 영역에 드롭되면 Presenter 쪽으로 버리기 요청을 전달한다.
///</summary>
public class InventoryDropZoneUI : MonoBehaviour, IDropHandler
{
    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (!droppedObj.TryGetComponent<InventorySlotUI>(out var inventorySlot))
            return;

        // 현재 인벤토리 슬롯 번호를 넘겨서 월드 드롭 처리를 요청한다.
        GlobalEventBus.OnInventoryDropRequested?.Invoke(inventorySlot.slotIndex);
    }
}
```

## Assets/02\_Scripts/Presenter/InventoryPresenter.cs

### Previous Script

```cs
﻿///<summary>
/// 아이템과 인벤토리에 관한 모든 상호작용의 중재자 역할을 수행합니다.
/// 아이템 습득 시 상황에 따라 즉시 장착하거나 인벤토리에 수납합니다.
/// 인벤토리 UI와 상자 UI의 열기/닫기 흐름도 함께 관리합니다.
///</summary>
using UnityEngine;

public class InventoryPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerInventory playerInventory;            // 플레이어 인벤토리
    private LocalInputReader localInputReader;          // 플레이어 입력 처리
    private EntityIdentity identity;                    // 플레이어 고유 ID 참조

    // 컨테이너 상태 캐시
    private ItemBox currentBox;                         // 현재 열려 있는 상자
    private bool isChestOpen;                           // 상자 UI가 열려 있는지 여부
    private PlayerStatus playerStatus;                  // 플레이어 상태

    // UI 캐시
    private InventoryUI inventoryUI;                    // 인벤토리 UI 캐시
    private ResultUI resultUI;                          // 결과창 UI 캐시

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerInventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();
        identity = GetComponent<EntityIdentity>();

        if (playerWeapon == null || playerInventory == null || localInputReader == null || identity == null)
        {
            this.enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    private void OnEnable()
    {
        // 바닥에서 아이템이 주어졌을 때 터지는 전역 이벤트를 구독합니다
        GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

        // 상자와 상호작용했을 때 열림 요청 이벤트를 구독합니다
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

        // 입력으로 인벤토리 열기 / 닫기 요청이 들어왔을 때 실행할 메서드를 구독합니다
        localInputReader.OnInventoryOpenRequested += OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested += CloseInventoryUI;

        // 인벤토리 데이터 변경 이벤트를 구독 합니다
        playerInventory.OnSlotChanged += HandleSlotChanged;

        // 게임 종료시 이벤트
        //GlobalEventBus.OnShowGameResult += OpenResultUI;
    }

    private void OnDisable()
    {
        // 메모리 누수 방지를 위한 구독 해제
        GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;

        localInputReader.OnInventoryOpenRequested -= OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested -= CloseInventoryUI;

        playerInventory.OnSlotChanged -= HandleSlotChanged;

        //GlobalEventBus.OnShowGameResult -= OpenResultUI;
    }

    ///<summary>
    /// 인벤토리 UI에서 유저가 직접 장착 버튼을 누르는 경우 (인벤토리 구현 후 개발)
    ///</summary>
    // public void OnRequestEquipWeapon(string weaponTID)
    // {}

    /* 아이템 줍기 이벤트 신호를 받았을 때 자동 장착 혹은 인벤토리 수납 수행 */
    private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
    {
        // DataManager를 통해 ID로 아이템 원본 데이터를 찾음
        ItemData data = DataManager.Instance.GetItemData(pickedItemTID);
        if (data == null) return;

        // 주운 아이템을 인벤토리에 먼저 추가 후 하위 작업 진행(이후 구현)
        // TID 100대는 무기
        if (100 < pickedItemTID && pickedItemTID < 200)
        {
            // 만약 장착하고 있는 무기가 없다면 무기를 장착하고, 그렇지 않다면 인벤토리에 수납
            if (!playerWeapon.isEquipped)
            {
                WeaponItemData weaponData = data as WeaponItemData;
                if (weaponData != null)
                    playerWeapon.EquipWeapon(weaponData);
                else
                    Debug.LogError("무기가 아닌 아이템이 잘못된 TID를 가지고 있습니다.");
            }
            else
            {
                int throwItem = playerInventory.AddItem(data, count);

                /// ※ 버려지는 아이템에 대한 로직 추가 ///
            }
        }
        // TID 300대는 소모품
        else if (300 < pickedItemTID && pickedItemTID < 400)
        {
            playerInventory.AddItem(data, count);
        }
        // TID 400대는 파밍 아이템
        else if (400 < pickedItemTID && pickedItemTID < 500)
        {
            int throwItem = playerInventory.AddItem(data, count);

            /// ※ 버려지는 아이템에 대한 로직 추가 ///
        }
        // 그 외 아이템은 알 수 없는 아이템
        else
        {
            Debug.LogWarning("Unknown item TID: " + pickedItemTID);
        }

        // DataManager의 playerData 저장
        DataManager.Instance.SaveGame();
    }

    /* 상자와 상호작용 했을 때 상자 UI와 인벤토리 UI를 함께 오픈 */
    private void HandleItemBoxOpened(IInteractable interactable, int playerID)
    {
        // 다른 플레이어가 연 상자라면 무시
        if (identity.entityID != playerID)
            return;

        // 상호작용한 대상이 ItemBox가 아니면 무시
        ItemBox box = interactable as ItemBox;
        if (box == null)
            return;

        // 현재 열린 상자 상태 저장
        currentBox = box;
        isChestOpen = true;

        // 입력 액션맵을 UI 모드로 전환
        localInputReader.SwitchToUIMap();

        // 왼쪽 인벤토리 UI 오픈
        OpenInventoryUI();

        // 오른쪽 상자 UI 오픈 및 데이터 바인딩
        chestUI = UIManager.Instance.Open<ChestUI>();
        if (chestUI == null) return;

        // 상자 UI가 닫힐 때 현재 Presenter의 CloseContainerUI를 호출하도록 연결
        chestUI.Bind(box, playerInventory, CloseContainerUI);
    }

    /* 특정 칸의 인벤토리 슬롯이 바뀌었을 때 해당 칸을 갱신함 */
    private void HandleSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy) return;

        inventoryUI.UpdateSlot(index, playerInventory.slots[index]);
    }

    /* 인벤토리 UI 활성화 */
    public void OpenInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 창 조작을 수행하지 않음
        if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

        // 인벤토리 UI 활성화 및 UI 오브젝트 캐시 저장
        inventoryUI = UIManager.Instance.Open<InventoryUI>();
        if (inventoryUI == null) return;

        // 인벤토리 첫 실행시 슬롯 생성
        inventoryUI.CreatSlots(playerInventory.slotNum);

        // 인벤토리의 아이템 상태를 동기화
        for (int i = 0; i < playerInventory.slotNum; i++)
            inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
    }

    /* 인벤토리 UI 비활성화 */
    public void CloseInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 창 조작을 수행하지 않음
        if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

        // 상자 UI가 열려 있으면 인벤토리만 따로 닫지 않고 컨테이너 UI 전체를 닫음
        if (isChestOpen)
        {
            CloseContainerUI();
            return;
        }

        UIManager.Instance.Close<InventoryUI>();
        inventoryUI = null;

        // 일반 인벤토리를 닫았을 때는 다시 플레이 조작으로 복귀
        localInputReader.SwitchToPlayerMap();
    }

    /* 상자 UI와 인벤토리 UI를 함께 닫음 */
    public void CloseContainerUI()
    {
        // 현재 열려 있던 상자의 열림 상태 해제
        if (currentBox != null)
            currentBox.CloseBox();

        // 상자 UI와 인벤토리 UI를 함께 닫음
        UIManager.Instance.Close<ChestUI>();
        UIManager.Instance.Close<InventoryUI>();

        // 캐시 및 상태값 초기화
        chestUI = null;
        inventoryUI = null;
        currentBox = null;
        isChestOpen = false;

        // 입력 액션맵을 다시 플레이어 모드로 전환
        localInputReader.SwitchToPlayerMap();
    }

    private void OpenResultUI(bool _result)
    {
        Debug.Log("결과 창 패널을 출력합니다...");
        // UIManager에서 Canvas-ResultPanel을 받아와 실행
        resultUI = UIManager.Instance.Open<ResultUI>();

        if (resultUI == null) return;
        resultUI.UpdateResultUI(_result);
    }

    public int FindItemCount(int _tid)
    {
        foreach (InventorySlotData slot in playerInventory.slots)
        {
            if (slot.TID == _tid)
            {
                return slot.amount;
            }
        }
        return 0;
    }
}
```

### Current Script

```cs
/// <summary>
/// 아이템과 인벤토리에 관한 모든 상호작용의 중재자 역할을 수행한다.
/// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI 연결, 월드 드랍 처리를 담당한다.
/// </summary>
using UnityEngine;

public class InventoryPresenter : MonoBehaviour
{
// 게임 데이터 스크립트 참조
private PlayerWeapon playerWeapon;               // 플레이어 무기
private PlayerInventory playerInventory;         // 플레이어 인벤토리
private LocalInputReader localInputReader;       // 플레이어 입력 처리
private EntityIdentity identity;                 // 플레이어 고유 ID
private PlayerStatus playerStatus;               // 플레이어 상태
// 컨테이너 상태 캐시
private ItemBox currentBox;                      // 현재 열려 있는 상자
private bool isChestOpen;                        // 체스트 UI가 열려 있는지 여부

// UI 캐시
private InventoryUI inventoryUI;                 // 인벤토리 UI 캐시
private ChestUI chestUI;                         // 체스트 UI 캐시
private ResultUI resultUI;                       // 결과창 UI 캐시

private const float dropForwardDistance = 1.0f; // 플레이어 앞에 떨어질 거리
private const float dropUpOffset = 0.3f;        // 바닥 겹침 방지용 높이 보정

private void Awake()
{
    playerWeapon = GetComponent<PlayerWeapon>();
    playerInventory = GetComponent<PlayerInventory>();
    localInputReader = GetComponent<LocalInputReader>();
    identity = GetComponent<EntityIdentity>();
    playerStatus = GetComponent<PlayerStatus>();

    if (playerWeapon == null || playerInventory == null || localInputReader == null || identity == null || playerStatus == null)
    {
        this.enabled = false;
        Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
        return;
    }
}

private void OnEnable()
{
    // 바닥에서 아이템을 주웠을 때 발생하는 이벤트를 구독한다.
    GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

    // 상자와 상호작용했을 때 체스트 UI를 열기 위한 이벤트를 구독한다.
    GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

    // 인벤토리 아이템 버리기 요청 이벤트를 구독한다.
    GlobalEventBus.OnInventoryDropRequested += HandleInventoryDropRequested;

    // 입력으로 인벤토리 열기/닫기 요청이 들어오면 대응한다.
    localInputReader.OnInventoryOpenRequested += OpenInventoryUI;
    localInputReader.OnInventoryCloseRequested += CloseInventoryUI;

    // 인벤토리 슬롯 데이터 변경을 구독한다.
    playerInventory.OnSlotChanged += HandleSlotChanged;
}

private void OnDisable()
{
    // 메모리 누수 방지를 위한 구독 해제
    GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
    GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;
    GlobalEventBus.OnInventoryDropRequested -= HandleInventoryDropRequested;

    localInputReader.OnInventoryOpenRequested -= OpenInventoryUI;
    localInputReader.OnInventoryCloseRequested -= CloseInventoryUI;

    playerInventory.OnSlotChanged -= HandleSlotChanged;
}

/// <summary>
/// 아이템 줍기 이벤트를 받았을 때 자동 장착 또는 인벤토리 수납을 처리한다.
/// </summary>
private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
{
    ItemData data = DataManager.Instance.GetItemData(pickedItemTID);
    if (data == null)
        return;

    // TID 100대는 무기
    if (100 < pickedItemTID && pickedItemTID < 200)
    {
        if (!playerWeapon.isEquipped)
        {
            WeaponItemData weaponData = data as WeaponItemData;

            if (weaponData != null)
                playerWeapon.EquipWeapon(weaponData);
            else
                Debug.LogError("무기가 아닌 아이템이 잘못된 TID를 가지고 있습니다.");
        }
        else
        {
            int throwItem = playerInventory.AddItem(data, count);

            /// ※ 버려지는 아이템에 대한 로직 추가 ///
        }
    }
    // TID 300대는 소모품
    else if (300 < pickedItemTID && pickedItemTID < 400)
    {
        playerInventory.AddItem(data, count);
    }
    // TID 400대는 파밍 아이템
    else if (400 < pickedItemTID && pickedItemTID < 500)
    {
        int throwItem = playerInventory.AddItem(data, count);

        /// ※ 버려지는 아이템에 대한 로직 추가 ///
    }
    // 그 외는 알 수 없는 아이템
    else
    {
        Debug.LogWarning("Unknown item TID: " + pickedItemTID);
    }

    DataManager.Instance.SaveGame();
}

/// <summary>
/// 상자와 상호작용했을 때 인벤토리 UI와 체스트 UI를 함께 연다.
/// </summary>
private void HandleItemBoxOpened(IInteractable interactable, int playerID)
{
    // 다른 플레이어가 연 상자면 무시한다.
    if (identity.entityID != playerID)
        return;

    ItemBox box = interactable as ItemBox;
    if (box == null)
        return;

    currentBox = box;
    isChestOpen = true;

    // 체스트를 여는 동안 입력을 UI 모드로 전환한다.
    localInputReader.SwitchToUIMap();

    // 왼쪽 인벤토리 UI를 연다.
    OpenInventoryUI();

    // 오른쪽 체스트 UI를 열고 데이터와 닫기 콜백을 연결한다.
    chestUI = UIManager.Instance.Open<ChestUI>();
    if (chestUI == null)
        return;

    chestUI.Bind(box, playerInventory, CloseContainerUI);
}

/// <summary>
/// 특정 인벤토리 슬롯이 바뀌었을 때 UI의 그 슬롯만 갱신한다.
/// </summary>
private void HandleSlotChanged(int index)
{
    if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
        return;

    inventoryUI.UpdateSlot(index, playerInventory.slots[index]);
}

/// <summary>
/// 인벤토리 UI를 연다.
/// 일반 인벤토리일 때만 드랍존을 사용 가능하게 둔다.
/// </summary>
public void OpenInventoryUI()
{
    if (playerStatus.nowState != PlayerStatus.livingState.idle)
        return;

    inventoryUI = UIManager.Instance.Open<InventoryUI>();
    if (inventoryUI == null)
        return;

    // 입력 처리 쪽에도 인벤토리 열림 상태를 알려 준다.
    // 일반 인벤토리는 Player 맵을 유지하므로 이 값으로 공격/상호작용을 막는다.
    localInputReader.SetInventoryOpenState(true);

    inventoryUI.SetDropZoneAvailable(!isChestOpen);
    inventoryUI.CreatSlots(playerInventory.slotNum);

    for (int i = 0; i < playerInventory.slotNum; i++)
        inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
}

/// <summary>
/// 일반 인벤토리 UI를 닫는다.
/// 체스트가 열려 있는 경우에는 체스트 UI까지 함께 닫는다.
/// </summary>
public void CloseInventoryUI()
{
    if (playerStatus.nowState != PlayerStatus.livingState.idle)
        return;

    if (isChestOpen)
    {
        CloseContainerUI();
        return;
    }

    UIManager.Instance.Close<InventoryUI>();
    inventoryUI = null;

    // 일반 인벤토리를 닫았으니 입력 상태도 원래대로 되돌린다.
    localInputReader.SetInventoryOpenState(false);
    localInputReader.SwitchToPlayerMap();
}

/// <summary>
/// 체스트 UI와 인벤토리 UI를 함께 닫는다.
/// </summary>
public void CloseContainerUI()
{
    if (currentBox != null)
        currentBox.CloseBox();

    UIManager.Instance.Close<ChestUI>();
    UIManager.Instance.Close<InventoryUI>();

    chestUI = null;
    inventoryUI = null;
    currentBox = null;
    isChestOpen = false;

    // 체스트 UI와 인벤토리를 모두 닫았으니 인벤토리 열림 상태를 해제한다.
    localInputReader.SetInventoryOpenState(false);
    localInputReader.SwitchToPlayerMap();
}

/// <summary>
/// 인벤토리 아이템을 드랍존에 놓으면 플레이어 앞 바닥에 드랍 아이템을 생성한다.
/// 체스트가 열려 있을 때는 사용하지 않는다.
/// </summary>
private void HandleInventoryDropRequested(int slotIndex)
{
    if (isChestOpen)
        return;

    InventorySlotData slot = playerInventory.GetSlot(slotIndex);
    if (slot == null || playerInventory.IsSlotEmpty(slotIndex))
        return;

    ItemData itemData = playerInventory.GetSlotItemData(slotIndex);
    if (itemData == null)
        return;

    if (itemData.dropPrefab == null)
    {
        Debug.LogWarning($"드랍 프리팹이 연결되지 않았어. TID: {itemData.TID}");
        return;
    }

    int dropCount = slot.amount;

    Vector3 dropPosition = transform.position
        + transform.forward * dropForwardDistance
        + Vector3.up * dropUpOffset;

    // 드랍 프리팹이 GameObject가 아닌 다른 Unity 오브젝트로 잡혀 있어도
    // 런타임에서 최대한 안전하게 실제 게임오브젝트를 찾아 생성한다.
    UnityEngine.Object prefabObject = itemData.dropPrefab;

    Debug.Log($"인벤토리 드랍 생성 시도: item={itemData.itemName}, prefab={prefabObject.name}, type={prefabObject.GetType().Name}");
    UnityEngine.Object spawnedObject = Instantiate(prefabObject, dropPosition, Quaternion.identity);

    GameObject dropObject = null;

    if (spawnedObject is GameObject prefabGameObject)
        dropObject = prefabGameObject;
    else if (spawnedObject is Component prefabComponent)
        dropObject = prefabComponent.gameObject;

    if (dropObject == null)
    {
        Debug.LogError($"드랍 프리팹 생성 결과를 GameObject로 변환하지 못했어. item={itemData.itemName}, spawnedType={spawnedObject.GetType().Name}");
        Destroy(spawnedObject);
        return;
    }

    DropItem dropItem = dropObject.GetComponent<DropItem>();

    if (dropItem == null)
    {
        Debug.LogError("드랍 프리팹에 DropItem 컴포넌트가 없어.");
        Destroy(dropObject);
        return;
    }

    dropItem.itemData = itemData;
    dropItem.stackCount = dropCount;

    // 월드 드랍 생성이 끝난 뒤 인벤토리에서 수량을 제거한다.
    playerInventory.RemoveAmount(slotIndex, dropCount);
    DataManager.Instance.SaveGame();
}

private void OpenResultUI(bool result)
{
    Debug.Log("결과 창을 출력합니다.");
    resultUI = UIManager.Instance.Open<ResultUI>();

    if (resultUI == null)
        return;

    resultUI.UpdateResultUI(result);
}

public int FindItemCount(int tid)
{
    foreach (InventorySlotData slot in playerInventory.slots)
    {
        if (slot.TID == tid)
            return slot.amount;
    }

    return 0;
}
}
```

## Assets/02\_Scripts/System/Player/LocalInputReader.cs

### Previous Script

```cs
///<summary>
/// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스
/// 'Player input'에 등록되는 모든 메서드들이 정리되어 있습니다
///</summary>
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class LocalInputReader : MonoBehaviour
{
    // 참조 컴포넌트
    PlayerInput playerInput;
    public event Action OnInventoryOpenRequested;
    public event Action OnInventoryCloseRequested;

    private void Awake()
    {
        playerInput = GetComponentInParent<PlayerInput>();

        // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
        if(playerInput==null)
        {
            this.enabled = false;
            Debug.LogError("LocalInputReader: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    // 플레이어의 입력을 받아 글로벌 이벤트 변수에 전달하는 함수들

    /* 플레이어 이동 입력 처리 */
    public void OnMove(InputAction.CallbackContext context)
    {
        Vector2 moveInput = context.ReadValue<Vector2>();

        GlobalEventBus.OnPlayerMove?.Invoke(moveInput);
    }

    /* 플레이어 공격 입력 처리 */
    public void OnAttack(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            GlobalEventBus.OnAttackInput?.Invoke();
        }
    }

    /* 플레이어 상호작용 입력 처리 */
    public void OnInteract(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            GlobalEventBus.OnInteractionInput?.Invoke();
        }
    }

    public void OnAimPosition(InputAction.CallbackContext context)
    {
        // 마우스의 2D 픽셀 좌표를 읽어서 이벤트 버스로 전송
        Vector2 mousePos = context.ReadValue<Vector2>();
        GlobalEventBus.OnMousePositionInput?.Invoke(mousePos);
    }

    public void OpenInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            SwitchToUIMap();
            OnInventoryOpenRequested?.Invoke();
        }
    }

    public void CloseInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            OnInventoryCloseRequested?.Invoke();
        }
    }

    public void OnUseQuickSlot(InputAction.CallbackContext context)
    {
        if(context.performed)
        {
            // Scale값을 float로 읽어옴
            float rawValue = context.ReadValue<float>();
            // int로 형변환 하여 인덱스로 사용
            int slotIndex = (int)rawValue;
            // 퀵슬롯 사용 요청
            GlobalEventBus.OnQuickSlotUseRequested?.Invoke(slotIndex);
        }
    }
    /* 액션맵을 UI 모드로 전환 */
    public void SwitchToUIMap()
    {
        playerInput.SwitchCurrentActionMap("UI");
    }

    /* 액션맵을 플레이어 모드로 전환 */
    public void SwitchToPlayerMap()
    {
        playerInput.SwitchCurrentActionMap("Player");
    }
}
```

### Current Script

```cs
///<summary>
/// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스
/// PlayerInput에 등록되는 입력 메서드들을 모아 둔다
///</summary>
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class LocalInputReader : MonoBehaviour
{
    // 참조 컴포넌트
    private PlayerInput playerInput;

    public event Action OnInventoryOpenRequested;
    public event Action OnInventoryCloseRequested;

    private bool isInventoryOpen;   // 인벤토리나 체스트 UI가 열려 있는지 여부

    private void Awake()
    {
        playerInput = GetComponentInParent<PlayerInput>();

        // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
        if (playerInput == null)
        {
            this.enabled = false;
            Debug.LogError("LocalInputReader: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    // 플레이어의 입력을 받아 글로벌 이벤트 변수에 전달하는 함수들

    /* 플레이어 이동 입력 처리 */
    public void OnMove(InputAction.CallbackContext context)
    {
        Vector2 moveInput = context.ReadValue<Vector2>();
        GlobalEventBus.OnPlayerMove?.Invoke(moveInput);
    }

    /* 플레이어 공격 입력 처리 */
    public void OnAttack(InputAction.CallbackContext context)
    {
        // 인벤토리가 열려 있을 때는 공격 입력을 막는다
        if (isInventoryOpen)
            return;

        if (context.performed)
        {
            GlobalEventBus.OnAttackInput?.Invoke();
        }
    }

    /* 플레이어 상호작용 입력 처리 */
    public void OnInteract(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            GlobalEventBus.OnInteractionInput?.Invoke();
        }
    }

    public void OnAimPosition(InputAction.CallbackContext context)
    {
        // 마우스의 2D 픽셀 좌표를 읽어서 이벤트 버스로 전송
        Vector2 mousePos = context.ReadValue<Vector2>();
        GlobalEventBus.OnMousePositionInput?.Invoke(mousePos);
    }

    public void OpenInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            // 일반 인벤토리는 Player 맵을 유지한 채 열고
            // 이미 열려 있다면 같은 E 키로 다시 닫을 수 있게 토글 처리한다
            if (isInventoryOpen)
                OnInventoryCloseRequested?.Invoke();
            else
                OnInventoryOpenRequested?.Invoke();
        }
    }

    public void CloseInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            OnInventoryCloseRequested?.Invoke();
        }
    }

    public void OnUseQuickSlot(InputAction.CallbackContext context)
    {
        // 인벤토리가 열려 있을 때는 퀵슬롯 사용을 막는다
        if (isInventoryOpen)
            return;

        if (context.performed)
        {
            // Scale값을 float로 읽어옴
            float rawValue = context.ReadValue<float>();

            // int로 형변환 하여 인덱스로 사용
            int slotIndex = (int)rawValue;

            // 퀵슬롯 사용 요청
            GlobalEventBus.OnQuickSlotUseRequested?.Invoke(slotIndex);
        }
    }

    /* 액션맵을 UI 모드로 전환 */
    public void SwitchToUIMap()
    {
        playerInput.SwitchCurrentActionMap("UI");
    }

    /* 액션맵을 플레이어 모드로 전환 */
    public void SwitchToPlayerMap()
    {
        playerInput.SwitchCurrentActionMap("Player");
    }

    ///<summary>
    /// 인벤토리 열림 상태를 기록한다
    /// 일반 인벤토리는 Player 맵을 유지하므로 입력 분기용으로 사용한다
    ///</summary>
    public void SetInventoryOpenState(bool isOpen)
    {
        isInventoryOpen = isOpen;
    }
}
```

## Assets/02\_Scripts/Utils/GlobalEventBus.cs

### Previous Script

```cs
﻿///<summary>
/// 글로벌 이벤트 버스 클래스
/// 게임 내에서 발생하는 다양한 이벤트를 중앙에서 관리하고 전달하는 역할을 합니다.
///</summary>
using System;
using UnityEngine;

public class GlobalEventBus
{
    /// 플레이어 행동에 의한 이벤트 ///
    public static Action<Vector2> OnPlayerMove;                     // 플레이어 이동 버튼 입력: Action<이동 버튼 입력 벡터>
    public static Action OnAttackInput;                             // 공격 버튼 입력
    public static Action OnInteractionInput;                        // 상호작용 버튼 입력
    public static Action<Vector2> OnMousePositionInput;             // 마우스의 현재 화면 좌표 전달: Action<화면 상의 좌표>
    public static Action<GameObject> OnPlayerSpawned;               // 플레이어 생성 시 위치 정보 전달: Action<플레이어의 Transform>
    public static Action<Transform> OnPlayerDespawned;              // 플레이어 제거 시 위치 정보 전달: Action<플레이어의 Transform>

    /// 아이템 관련 이벤트 ///
    public static Action<int, int, int> OnItemPickedUp;             // 아아템을 주웠을 시: Action<플레이어 식별자 코드, 아이템 코드, 아이템 갯수>
    public static Action<int, Sprite, int> OnQuickSlotChanged;      // 퀵슬롯 정보가 변경되었을 시: Action<퀵슬롯 번호, 이미지, 갯수>
    public static Action<int> OnQuickSlotUseRequested;              // 특정 퀵슬롯 번호가 눌렷을 시: Action<퀵슬롯 번호>
    public static Action<int, int> OnSwapInventorySlot;             // 인벤토리 슬롯이 바뀌었을 시: Action<1번 슬롯 번호, 2번 슬롯 번호>
    public static Action<int, int> OnDropItemQuickSlot;             // 인벤토리에서 퀵슬롯에 아이템을 드래그 앤 드롭 할 시: Action<퀵슬롯 번호, 인벤토리 번호> | 인벤토리->퀵슬롯
    public static Action<int, int> OnSwapItemQuickSlot;             // 퀵슬롯에서 퀵슬롯으로 아이템을 드래그 앤 드롭 할 시: Action<1번 퀵슬롯 번호, 2번 퀵슬롯 번호)> | 2번슬롯->1번슬롯

    /// 특정 효과 발동 이벤트 ///
    public static Action<GameObject, float> OnHealRequested;        // 체력 회복 효과: Action<대상, 값>
    public static Action<GameObject, float> OnGainManaRequested;    // 마나 회복 효과: Action<대상, 값>

    /// 전투 관련 이벤트 ///
    public static Action<float, float> OnPlayerHealthChanged;       // 플레이어 체력 변동: Action<현재 체력, 전체 체력>
    public static Action<int> onPlayerDead;                         // 플레이어 사망 여부: Action<고유 번호>
    public static Action<float, float> OnPlayerManaChanged;         // 플레이어 마나 변동: Action<현재 마나, 전체 마나>
    public static Func<float, bool> OnRequestManaConsume;           // 플레이어 마나 소비 요청: Func<소모량, 성공여부>
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>

    /// 게임 시스템 관련 이벤트 ///
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
    public static Action OnReturnToLobby;                           // 로비로 돌아가기 이벤트 발생
}
```

### Current Script

```cs
///<summary>
/// 전역 이벤트 버스 클래스.
/// 게임 안에서 발생하는 여러 이벤트를 중앙에서 전달할 때 사용한다.
///</summary>
using System;
using UnityEngine;

public class GlobalEventBus
{
    ///<summary>
    /// 플레이어 입력 관련 이벤트
    ///</summary>
    public static Action<Vector2> OnPlayerMove;                  // 플레이어 이동 입력
    public static Action OnAttackInput;                          // 공격 입력
    public static Action OnInteractionInput;                     // 상호작용 입력
    public static Action<Vector2> OnMousePositionInput;          // 마우스 위치 전달
    public static Action<GameObject> OnPlayerSpawned;            // 플레이어 생성 전달
    public static Action<Transform> OnPlayerDespawned;           // 플레이어 제거 전달

    ///<summary>
    /// 아이템 관련 이벤트
    ///</summary>
    public static Action<int, int, int> OnItemPickedUp;          // 아이템 획득
    public static Action<IInteractable, int> OnItemBoxOpened;    // 상자 열기 요청
    public static Action<int, Sprite, int> OnQuickSlotChanged;   // 퀵슬롯 정보 변경
    public static Action<int> OnQuickSlotUseRequested;           // 퀵슬롯 사용 요청
    public static Action<int, int> OnSwapInventorySlot;          // 인벤토리 슬롯 교환
    public static Action<int> OnInventoryDropRequested;          // 인벤토리 아이템 버리기 요청
    public static Action<int, int> OnDropItemQuickSlot;          // 인벤토리 -> 퀵슬롯 드랍
    public static Action<int, int> OnSwapItemQuickSlot;          // 퀵슬롯끼리 교환

    ///<summary>
    /// 아이템 효과 이벤트
    ///</summary>
    public static Action<GameObject, float> OnHealRequested;     // 체력 회복 요청
    public static Action<GameObject, float> OnGainManaRequested; // 마나 회복 요청

    ///<summary>
    /// 전투/상태 관련 이벤트
    ///</summary>
    public static Action<float, float> OnPlayerHealthChanged;    // 플레이어 체력 변화
    public static Action<int> onPlayerDead;                      // 플레이어 사망
    public static Action<float, float> OnPlayerManaChanged;      // 플레이어 마나 변화
    public static Func<float, bool> OnRequestManaConsume;        // 플레이어 마나 소비 요청
    public static Action<int, float, float> OnEnemyHealthChanged;// 적 체력 변화
    public static Action<int> OnEnemyDead;                       // 적 사망

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                  // 탈출 판정 요청
    public static Action OnReturnToLobby;                        // 로비 복귀 요청
}
```

## Assets/02\_Scripts/Data/Item/ItemData.cs

### Previous Script

```cs
///<summary>
/// 아이템 데이터의 기본 틀이 되는 ScriptableObject 클래스
/// 각 아이템은 N*101번대부터 시작하며, 1의 자리가 0인 경우의 TID는 비워놓습니다
///
/// * 현재 아이템 번호 규칙
///  - 100번대: 무기
///  - 200번대: 방어구 (추후 구현)
///  - 300번대: 소모품
///  - 400번대: 그 외 아이템
/// 위 내용은 기획서의 변동에 따라 내용이 달라지거나 삭제될 수 있습니다.
///</summary>
using UnityEngine;
using UnityEngine.AddressableAssets;

public abstract class ItemData : ScriptableObject
{
    [Header("아이템 기본 정보")]
    public int TID;                                     // 아이템 코드(고유 ID)
    public string itemName;                             // 아이템 이름
    public string desc;                                 // 아이템 설명
    public itemCategory category;                       // 아이템 종류
    public int effectID;                                // 아이템 종류별 적용 효과 ID
    public int itemMultiple;                            // 중첩 용량

    [Header("연관 파일 주소")]
    public AssetReferenceSprite icon;                   // 아이템 아이콘
    public AssetReferenceGameObject itemPrefabRef;      // 아이템 프리팹 주소
}
```

### Current Script

```cs
///<summary>
/// 아이템 데이터의 기본 정보를 담는 ScriptableObject 클래스.
/// 각 아이템 종류별 상세 데이터는 이 클래스를 상속해서 확장한다.
///</summary>
using UnityEngine;
using UnityEngine.AddressableAssets;

public abstract class ItemData : ScriptableObject
{
    [Header("아이템 기본 정보")]
    public int TID;                               // 아이템 고유 ID
    public string itemName;                       // 아이템 이름
    public string desc;                           // 아이템 설명
    public itemCategory category;                 // 아이템 분류
    public int effectID;                          // 아이템 효과 ID
    public int itemMultiple;                      // 최대 스택 수량

    [Header("참조 리소스")]
    public AssetReferenceSprite icon;             // UI 아이콘
    public AssetReferenceGameObject itemPrefabRef;// 장착/사용에 쓰는 프리팹
    public GameObject dropPrefab;                 // 바닥 드랍에 쓰는 프리팹
}
```
{% endraw %}
