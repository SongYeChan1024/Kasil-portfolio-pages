---
title: "2026-07-20_InventorySlotUI_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/UI/Game/InventorySlotUI.cs cs ﻿/// /// 아이템 슬롯 하나의 역할을 수행합니다 /// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다. /// 인벤토리 슬롯끼리의 위치 교환,"
description: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/UI/Game/InventorySlotUI.cs cs ﻿/// /// 아이템 슬롯 하나의 역할을 수행합니다 /// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다. /// 인벤토리 슬롯끼리의 위치 교환,"
published: false
migration_id: "3a336532580e8196961de10772270d9b"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>6e5f262^</code>
- 파일: <code>Assets/02_Scripts/UI/Game/InventorySlotUI.cs</code>

```cs
﻿/// <summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
/// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다.
/// 인벤토리 슬롯끼리의 위치 교환, 체스트와의 우클릭 이동, 드래그 앤 드롭 이동, 포인터 호버로 툴팁 출력을 처리한다.
/// </summary>
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;      // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage;    // 등급별 슬롯 이미지
    [SerializeField] private Image itemImg;             // 아이템 아이콘 이미지
    [SerializeField] private TMP_Text itemStack;        // 아이템 개수 출력
    [SerializeField] private Transform itemInfo;        // 아이템 아이콘 위치
    [SerializeField] private SlotType slotType;         // 슬롯 종류
    [SerializeField] private Image categoryIconImage;   // 카테고리 아이콘 이미지

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    [Header("카테고리별 아이콘 이미지")]
    [SerializeField] private Sprite artifactSprite;
    [SerializeField] private Sprite consumeSprite;
    [SerializeField] private Sprite memorySprite;
    [SerializeField] private Sprite idleSprite;

    private InventoryUI inventoryUI;

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;
```

```cs
// 유니티 좀비 드래그(마우스를 떼지 않고 UI 재활성화 시 OnDrag가 이어지는 현상) 방지용 플래그
private bool isDragging = false;

/// <summary>
/// 어떤 슬롯이든 드래그 중인지 전역으로 확인할 수 있는 플래그입니다.
/// 드래그 중에는 툴팁 표시를 차단하는 데 사용합니다.
/// </summary>
public static bool AnySlotDragging { get; private set; }

private void Awake()
{

    inventoryUI = GetComponentInParent<InventoryUI>();
    mainCanvas = GetComponentInParent<Canvas>();

    // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
    if (slotFrameImage == null)
        slotFrameImage = GetComponent<Image>();

    if (itemInfo == null)
        itemInfo = transform.Find("ItemInfo");

    if (itemInfo != null)
        canvasGroup = itemInfo.GetComponent<CanvasGroup>();

    if (mainCanvas == null)
    {
        enabled = false;
        Debug.LogError("InventorySlotUI: Canvas를 찾을 수 없습니다.");
    }
}

/* 외부(InventoryUI)에서 인벤토리가 닫히기 직전에 호출하여 비활성화 에러 피하면서 상호작용 초기화 */
public void ResetDragState()
{
    isDragging = false; // 드래그 강제 취소 인식
    AnySlotDragging = false;

    if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
    {
        itemInfo.SetParent(transform, false);
        itemInfo.localPosition = Vector3.zero;
    }

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = true;
}

public void Initialize(int index)
{
    slotIndex = index;
    UpdateSlot(0, null, itemCategory.idle, ItemGrade.empty, SlotType.empty);
}

public void UpdateSlot(int stack, Sprite sprite, itemCategory _category, SlotType _type = SlotType.inventory)
{
```

```cs
    UpdateSlot(stack, sprite, _category, ItemGrade.empty, _type);
}

public void UpdateSlot(int stack, Sprite sprite, itemCategory _category, ItemGrade grade, SlotType _type)
{
    if (stack <= 0 || sprite == null)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        slotType = SlotType.empty;
        ApplySlotFrame(ItemGrade.empty);
        ApplyCategoryIcon(itemCategory.empty);
        return;
    }

    itemImg.enabled = true;
    itemImg.sprite = sprite;
    itemStack.text = stack.ToString();
    slotType = _type;
    ApplySlotFrame(grade);
    ApplyCategoryIcon(_category);
}

/// <summary>
/// 엑셀/JSON에서 넘어온 아이템 등급에 맞춰 슬롯 배경 이미지를 교체한다.
/// </summary>
/// 빈 슬롯
///-> slotFrameImage = emptySlotSprite
///-> rarityFrameImage 숨김
///-> itemImg 숨김

///아이템 있음
///-> slotFrameImage = emptySlotSprite 그대로 유지
///-> rarityFrameImage = 등급별 Sprite
///-> rarityFrameImage 표시
///-> itemImg 표시
private void ApplySlotFrame(ItemGrade grade)
{
    if (slotFrameImage != null)
    {
        slotFrameImage.sprite = emptySlotSprite;
    }

    if (rarityFrameImage == null)
        return;

    if (grade == ItemGrade.empty)
    {
        rarityFrameImage.enabled = false;
        rarityFrameImage.sprite = null;
        return;
    }

    rarityFrameImage.enabled = true;
    rarityFrameImage.color = Color.white;
    rarityFrameImage.sprite = GetSlotFrameSprite(grade);
}

private Sprite GetSlotFrameSprite(ItemGrade grade)
{
    return grade switch
    {
```

```cs
        ItemGrade.normal => normalSlotSprite != null ? normalSlotSprite : emptySlotSprite,
        ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
        ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
        ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
        ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
        _ => emptySlotSprite
    };
}

// 아이템 종류에 따라 카테고리 라벨 아이콘을 출력
private void ApplyCategoryIcon(itemCategory category)
{
    // 슬롯이 빈 칸이면 카테고리 라벨을 비활성화한다
    if (categoryIconImage == null || category == itemCategory.empty)
    {
        categoryIconImage.enabled = false;
        return;
    }

    // 아이템 카테고리 종류별 라벨 아이콘을 출력한다
    categoryIconImage.enabled = true;
    categoryIconImage.sprite = category switch
    {
        itemCategory.artifact   => artifactSprite,
        itemCategory.consume    => consumeSprite,
        itemCategory.memory     => memorySprite,
        itemCategory.idle       => idleSprite,
        _                       => null
    };
}

// 왼쪽 버튼 더블클릭으로 인벤토리 이동을 처리
public void OnPointerClick(PointerEventData eventData)
{
    // 왼쪽 버튼 클릭이 아니면 처리하지 않기
    if (eventData.button != PointerEventData.InputButton.Left)
    {
        return;
    }

    // 클릭 시 사운드 재생
    GlobalEventBus.OnClickAudio?.Invoke(true);

    // 1번만 클릭한 경우에는 처리하지 않기
    if (eventData.clickCount < 2)
    {
        return;
    }

    if (!itemImg.enabled)
    {
```

```cs
        return;
    }

    // 체스트가 열려 있을 때만 인벤토리 -> 체스트 이동을 허용한다.
    if (ChestUI.ActiveUI != null)
        ChestUI.ActiveUI.TryMoveFromInventory(slotIndex);
    // 체스트가 닫혀 있을 때에는 인벤토리 → 퀵슬롯 이동을 실행한다.
    else { }
}

public void OnBeginDrag(PointerEventData eventData)
{
    if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
        return;

    isDragging = true;
    AnySlotDragging = true;

    // 드래그 시작 시 열려 있는 툴팁을 닫습니다.
    GlobalEventBus.OnTooltipUIClose?.Invoke();
    
    itemInfo.SetParent(mainCanvas.transform);
    itemInfo.SetAsLastSibling();

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = false;
    inventoryUI?.ShowDropZone();
}

public void OnDrag(PointerEventData eventData)
{
    // OnBeginDrag를 정상적으로 거치지 않은 '좀비 드래그'는 철저히 무시
    if (!isDragging || itemInfo == null)
        return;

    itemInfo.position = eventData.position;
}

public void OnEndDrag(PointerEventData eventData)
{
    isDragging = false;
    AnySlotDragging = false;

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = true;

    if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
    {
        itemInfo.SetParent(transform);
        itemInfo.localPosition = Vector3.zero;
    }
    inventoryUI?.HideDropZone();
}

public void OnDrop(PointerEventData eventData)
{
    GameObject droppedObj = eventData.pointerDrag;
    if (droppedObj == null)
        return;
```

```cs
        if (droppedObj.TryGetComponent<InventorySlotUI>(out var originSlot))
        {
            if (originSlot == this)
                return;

            GlobalEventBus.OnSwapInventorySlot?.Invoke(slotIndex, originSlot.slotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<ArtifactEquipSlotUI>(out var artifactSlot))
        {
            // 장착 슬롯에서 일반 인벤토리 슬롯으로 드롭하면 해제를 요청합니다.
            // 실제로 인벤토리에 들어갈 공간이 있는지는 InventoryPresenter가 판단합니다.
            GlobalEventBus.OnArtifactUnequipRequested?.Invoke(artifactSlot.EquipSlotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<ChestSlotUI>(out var chestSlot))
        {
            if (chestSlot.OwnerUI == null)
                return;

            chestSlot.OwnerUI.TryMoveToInventorySlot(chestSlot.SlotIndex, slotIndex);
        }
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        // 드래그 중에는 툴팁을 표시하지 않습니다.
        if (AnySlotDragging)
            return;

        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(slotType, slotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```

## 2. 변경 설명

드래그를 시작할 때 슬롯의 itemData와 TID를 피드백 컨트롤러에 전달하고, 종료·취소 시 강조를 해제하도록 연결했습니다. 실제 아이템 정보가 없는 빈 슬롯에서는 잘못된 대상 강조가 시작되지 않도록 방어합니다.

## 3. 현재 스크립트 전체

- 기준: <code>6e5f262</code>
- 파일: <code>Assets/02_Scripts/UI/Game/InventorySlotUI.cs</code>

```cs
﻿/// <summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
/// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다.
/// 인벤토리 슬롯끼리의 위치 교환, 체스트와의 우클릭 이동, 드래그 앤 드롭 이동, 포인터 호버로 툴팁 출력을 처리한다.
/// </summary>
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;      // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage;    // 등급별 슬롯 이미지
    [SerializeField] private Image itemImg;             // 아이템 아이콘 이미지
    [SerializeField] private TMP_Text itemStack;        // 아이템 개수 출력
    [SerializeField] private Transform itemInfo;        // 아이템 아이콘 위치
    [SerializeField] private SlotType slotType;         // 슬롯 종류
    [SerializeField] private Image categoryIconImage;   // 카테고리 아이콘 이미지

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    [Header("카테고리별 아이콘 이미지")]
    [SerializeField] private Sprite artifactSprite;
    [SerializeField] private Sprite consumeSprite;
    [SerializeField] private Sprite memorySprite;
    [SerializeField] private Sprite idleSprite;

    private InventoryUI inventoryUI;
    private ItemData currentItemData;
    private int currentItemTid;
    private bool canAssignToQuickSlot = true;
```

```cs
public int slotIndex { get; set; }
public ItemData CurrentItemData => currentItemData;
public int CurrentItemTid => currentItemTid;
public bool CanAssignToQuickSlot => canAssignToQuickSlot;

private CanvasGroup canvasGroup;
private Canvas mainCanvas;

// 유니티 좀비 드래그(마우스를 떼지 않고 UI 재활성화 시 OnDrag가 이어지는 현상) 방지용 플래그
private bool isDragging = false;

/// <summary>
/// 어떤 슬롯이든 드래그 중인지 전역으로 확인할 수 있는 플래그입니다.
/// 드래그 중에는 툴팁 표시를 차단하는 데 사용합니다.
/// </summary>
public static bool AnySlotDragging { get; private set; }

private void Awake()
{

    inventoryUI = GetComponentInParent<InventoryUI>();
    mainCanvas = GetComponentInParent<Canvas>();

    // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
    if (slotFrameImage == null)
        slotFrameImage = GetComponent<Image>();

    if (itemInfo == null)
        itemInfo = transform.Find("ItemInfo");

    if (itemInfo != null)
        canvasGroup = itemInfo.GetComponent<CanvasGroup>();

    if (mainCanvas == null)
    {
        enabled = false;
        Debug.LogError("InventorySlotUI: Canvas를 찾을 수 없습니다.");
    }
}

/* 외부(InventoryUI)에서 인벤토리가 닫히기 직전에 호출하여 비활성화 에러 피하면서 상호작용 초기화 */
public void ResetDragState()
{
    isDragging = false; // 드래그 강제 취소 인식
    AnySlotDragging = false;

    if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
    {
        itemInfo.SetParent(transform, false);
        itemInfo.localPosition = Vector3.zero;
    }

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = true;
```

```cs
    inventoryUI?.HideEquipmentDropFeedback(true);
}

public void Initialize(int index, bool allowQuickSlotAssignment = true)
{
    slotIndex = index;
    canAssignToQuickSlot = allowQuickSlotAssignment;
    UpdateSlot(0, null, itemCategory.idle, ItemGrade.empty, SlotType.empty);
}

public void UpdateSlot(int stack, Sprite sprite, itemCategory _category, SlotType _type = SlotType.inventory)
{
    UpdateSlot(stack, sprite, _category, ItemGrade.empty, _type);
}

public void UpdateSlot(int stack, Sprite sprite, itemCategory _category, ItemGrade grade, SlotType _type)
{
    UpdateSlot(stack, sprite, _category, grade, _type, null, 0);
}

public void UpdateSlot(
    int stack,
    Sprite sprite,
    itemCategory _category,
    ItemGrade grade,
    SlotType _type,
    ItemData itemData,
    int itemTid = 0)
{
    currentItemData = itemData;
    currentItemTid = itemData != null ? itemData.TID : itemTid;

    if (stack <= 0 || sprite == null)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        slotType = SlotType.empty;
        currentItemData = null;
        currentItemTid = 0;
        ApplySlotFrame(ItemGrade.empty);
        ApplyCategoryIcon(itemCategory.empty);
        return;
    }

    itemImg.enabled = true;
    itemImg.sprite = sprite;
    itemStack.text = stack.ToString();
    slotType = _type;
    ApplySlotFrame(grade);
    ApplyCategoryIcon(_category);
}

/// <summary>
/// 엑셀/JSON에서 넘어온 아이템 등급에 맞춰 슬롯 배경 이미지를 교체한다.
/// </summary>
/// 빈 슬롯
```

```cs
///-> slotFrameImage = emptySlotSprite
///-> rarityFrameImage 숨김
///-> itemImg 숨김

///아이템 있음
///-> slotFrameImage = emptySlotSprite 그대로 유지
///-> rarityFrameImage = 등급별 Sprite
///-> rarityFrameImage 표시
///-> itemImg 표시
private void ApplySlotFrame(ItemGrade grade)
{
    if (slotFrameImage != null)
    {
        slotFrameImage.sprite = emptySlotSprite;
    }

    if (rarityFrameImage == null)
        return;

    if (grade == ItemGrade.empty)
    {
        rarityFrameImage.enabled = false;
        rarityFrameImage.sprite = null;
        return;
    }

    rarityFrameImage.enabled = true;
    rarityFrameImage.color = Color.white;
    rarityFrameImage.sprite = GetSlotFrameSprite(grade);
}

private Sprite GetSlotFrameSprite(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => normalSlotSprite != null ? normalSlotSprite : emptySlotSprite,
        ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
        ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
        ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
        ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
        _ => emptySlotSprite
    };
}

// 아이템 종류에 따라 카테고리 라벨 아이콘을 출력
private void ApplyCategoryIcon(itemCategory category)
{
    // 슬롯이 빈 칸이면 카테고리 라벨을 비활성화한다
    if (categoryIconImage == null || category == itemCategory.empty)
    {
        categoryIconImage.enabled = false;
```

```cs
        return;
    }

    // 아이템 카테고리 종류별 라벨 아이콘을 출력한다
    categoryIconImage.enabled = true;
    categoryIconImage.sprite = category switch
    {
        itemCategory.artifact   => artifactSprite,
        itemCategory.consume    => consumeSprite,
        itemCategory.memory     => memorySprite,
        itemCategory.idle       => idleSprite,
        _                       => null
    };
}

// 왼쪽 버튼 더블클릭으로 인벤토리 이동을 처리
public void OnPointerClick(PointerEventData eventData)
{
    // 왼쪽 버튼 클릭이 아니면 처리하지 않기
    if (eventData.button != PointerEventData.InputButton.Left)
    {
        return;
    }

    // 클릭 시 사운드 재생
    GlobalEventBus.OnClickAudio?.Invoke(true);

    // 1번만 클릭한 경우에는 처리하지 않기
    if (eventData.clickCount < 2)
    {
        return;
    }

    if (!itemImg.enabled)
    {
        return;
    }

    // 체스트가 열려 있을 때만 인벤토리 -> 체스트 이동을 허용한다.
    if (ChestUI.ActiveUI != null)
        ChestUI.ActiveUI.TryMoveFromInventory(slotIndex);
    // 체스트가 닫혀 있을 때에는 인벤토리 → 퀵슬롯 이동을 실행한다.
    else { }
}

public void OnBeginDrag(PointerEventData eventData)
{
    if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
        return;

    isDragging = true;
    AnySlotDragging = true;

    // 드래그 시작 시 열려 있는 툴팁을 닫습니다.
    GlobalEventBus.OnTooltipUIClose?.Invoke();
    
    itemInfo.SetParent(mainCanvas.transform);
    itemInfo.SetAsLastSibling();

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = false;
    inventoryUI?.ShowDropZone();
```

```cs
    inventoryUI?.ShowEquipmentDropFeedback(this);
}

public void OnDrag(PointerEventData eventData)
{
    // OnBeginDrag를 정상적으로 거치지 않은 '좀비 드래그'는 철저히 무시
    if (!isDragging || itemInfo == null)
        return;

    itemInfo.position = eventData.position;
}

public void OnEndDrag(PointerEventData eventData)
{
    isDragging = false;
    AnySlotDragging = false;

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = true;

    if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
    {
        itemInfo.SetParent(transform);
        itemInfo.localPosition = Vector3.zero;
    }
    inventoryUI?.HideDropZone();
    inventoryUI?.HideEquipmentDropFeedback();
}

public void OnDrop(PointerEventData eventData)
{
    GameObject droppedObj = eventData.pointerDrag;
    if (droppedObj == null)
        return;

    if (droppedObj.TryGetComponent<InventorySlotUI>(out var originSlot))
    {
        if (originSlot == this)
            return;

        GlobalEventBus.OnSwapInventorySlot?.Invoke(slotIndex, originSlot.slotIndex);
        return;
    }

    if (droppedObj.TryGetComponent<ArtifactEquipSlotUI>(out var artifactSlot))
    {
        // 장착 슬롯에서 일반 인벤토리 슬롯으로 드롭하면 해제를 요청합니다.
        // 실제로 인벤토리에 들어갈 공간이 있는지는 InventoryPresenter가 판단합니다.
        GlobalEventBus.OnArtifactUnequipRequested?.Invoke(artifactSlot.EquipSlotIndex);
        return;
    }

    if (droppedObj.TryGetComponent<ChestSlotUI>(out var chestSlot))
    {
        if (chestSlot.OwnerUI == null)
```

```cs
                return;

            chestSlot.OwnerUI.TryMoveToInventorySlot(chestSlot.SlotIndex, slotIndex);
        }
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        // 드래그 중에는 툴팁을 표시하지 않습니다.
        if (AnySlotDragging)
            return;

        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(slotType, slotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```
{% endraw %}
