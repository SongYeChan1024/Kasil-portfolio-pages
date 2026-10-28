---
title: "2026-07-20_QuickSlotPresenter_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/Presenter/QuickSlotPresenter.cs cs /// /// 퀵슬롯 입력과 아이템 사용 효과를 중재하는 프레젠터입니다. /// 퀵슬롯에 등록된 아이템이 실제로 소비된 경우에만 효과를 "
description: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/Presenter/QuickSlotPresenter.cs cs /// /// 퀵슬롯 입력과 아이템 사용 효과를 중재하는 프레젠터입니다. /// 퀵슬롯에 등록된 아이템이 실제로 소비된 경우에만 효과를 "
published: true
migration_id: "3a336532580e8186969ec037b47815be"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2f085c3^</code>
- 파일: <code>Assets/02_Scripts/Presenter/QuickSlotPresenter.cs</code>

```cs
/// <summary>
/// 퀵슬롯 입력과 아이템 사용 효과를 중재하는 프레젠터입니다.
/// 퀵슬롯에 등록된 아이템이 실제로 소비된 경우에만 효과를 실행합니다.
/// </summary>
using UnityEngine;
using UnityEngine.InputSystem;

public class QuickSlotPresenter : MonoBehaviour
{
    [Header("참조 컴포넌트")]
    public PlayerInventory inventory;

    // 아이템 데이터 조회 인터페이스
    private IItemDataRepository itemRepo;

    private InputAction quickSlotAction;                // 퀵슬롯 사용 이벤트 캐시

    private void Awake()
    {
        inventory = GetComponent<PlayerInventory>();

        if (inventory == null)
        {
            enabled = false;
            Debug.LogError("QuickSlotPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        itemRepo = new LocalJsonItemRepository();
    }

    private void OnEnable()
    {
        if (GlobalEventBus.OnGetInputAction != null)
        {
            quickSlotAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "QuickSlot");
            if (quickSlotAction != null)
            {
                quickSlotAction.Enable();
                quickSlotAction.performed += OnQuickSlotInput;
            }
        }
    }

    private void OnDisable()
    {
        if (quickSlotAction != null)
        {
            quickSlotAction.performed -= OnQuickSlotInput;
            quickSlotAction.Disable();
        }
    }

    private void OnQuickSlotInput(InputAction.CallbackContext context)
    {
        float rawValue = context.ReadValue<float>();
        int slotIndex = (int)rawValue;
        UseQuickSlotItem(slotIndex);
    }

    /* 퀵슬롯에 등록된 아이템을 사용 */
    private void UseQuickSlotItem(int slotIndex)
    {
        // 퀵슬롯 범위 및 등록 여부 확인
        if (slotIndex < 0 || slotIndex >= inventory.quickSlotNum) return;
```

```cs
        InventorySlotData slot = inventory.quickSlots[slotIndex];
        if (slot == null || slot.TID == 0 || slot.amount <= 0) return;

        ItemData itemData = slot.itemData ?? itemRepo.GetItemDataByID(slot.TID);
        if (itemData == null) return;

        // 실제 인벤토리에서 소비가 성공했을 때만 아이템 효과를 실행합니다.
        bool isConsumed = inventory.UseQuickSlotItem(slotIndex);
        if (!isConsumed) return;

        ConsumeItemData consumable = itemData as ConsumeItemData;
        if (consumable == null) return;

        if (ItemEffectProcessor.Instance != null)
        {
            ItemEffectProcessor.Instance.UseConsumeItem(consumable, this.gameObject);
        }
        else
        {
            Debug.LogError("ItemEffectProcessor 인스턴스가 존재하지 않습니다.");
        }
    }
}
```

## 2. 변경 설명

입력 차단 상태를 확인한 뒤에만 퀵슬롯 아이템을 사용하도록 보강했습니다. 튜토리얼 팝업이나 인벤토리를 조작하는 동안 숫자키 입력이 실제 아이템 사용으로 전달되지 않게 했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>2f085c3</code>
- 파일: <code>Assets/02_Scripts/Presenter/QuickSlotPresenter.cs</code>

```cs
/// <summary>
/// 퀵슬롯 입력과 아이템 사용 효과를 중재하는 프레젠터입니다.
/// 퀵슬롯에 등록된 아이템이 실제로 소비된 경우에만 효과를 실행합니다.
/// </summary>
using UnityEngine;
using UnityEngine.InputSystem;

public class QuickSlotPresenter : MonoBehaviour
{
    [Header("참조 컴포넌트")]
    public PlayerInventory inventory;

    // 아이템 데이터 조회 인터페이스
    private IItemDataRepository itemRepo;
    private LocalInputReader localInputReader;          // 튜토리얼 및 인벤토리 입력 차단 상태

    private InputAction quickSlotAction;                // 퀵슬롯 사용 이벤트 캐시

    private void Awake()
    {
        inventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();

        if (inventory == null || localInputReader == null)
        {
            enabled = false;
            Debug.LogError("QuickSlotPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        itemRepo = new LocalJsonItemRepository();
    }

    private void OnEnable()
    {
        if (GlobalEventBus.OnGetInputAction != null)
        {
            quickSlotAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "QuickSlot");
            if (quickSlotAction != null)
            {
                quickSlotAction.Enable();
                quickSlotAction.performed += OnQuickSlotInput;
            }
        }
    }

    private void OnDisable()
    {
        if (quickSlotAction != null)
        {
            quickSlotAction.performed -= OnQuickSlotInput;
            quickSlotAction.Disable();
        }
    }

    private void OnQuickSlotInput(InputAction.CallbackContext context)
    {
        if (localInputReader.IsGameplayInputBlocked || localInputReader.IsInventoryOpen)
            return;
```

```cs
        float rawValue = context.ReadValue<float>();
        int slotIndex = (int)rawValue;
        UseQuickSlotItem(slotIndex);
    }

    /* 퀵슬롯에 등록된 아이템을 사용 */
    private void UseQuickSlotItem(int slotIndex)
    {
        // 퀵슬롯 범위 및 등록 여부 확인
        if (slotIndex < 0 || slotIndex >= inventory.quickSlotNum) return;

        InventorySlotData slot = inventory.quickSlots[slotIndex];
        if (slot == null || slot.TID == 0 || slot.amount <= 0) return;

        ItemData itemData = slot.itemData ?? itemRepo.GetItemDataByID(slot.TID);
        if (itemData == null) return;

        // 실제 인벤토리에서 소비가 성공했을 때만 아이템 효과를 실행합니다.
        bool isConsumed = inventory.UseQuickSlotItem(slotIndex);
        if (!isConsumed) return;

        ConsumeItemData consumable = itemData as ConsumeItemData;
        if (consumable == null) return;

        if (ItemEffectProcessor.Instance != null)
        {
            ItemEffectProcessor.Instance.UseConsumeItem(consumable, this.gameObject);
        }
        else
        {
            Debug.LogError("ItemEffectProcessor 인스턴스가 존재하지 않습니다.");
        }
    }
}
```
{% endraw %}
