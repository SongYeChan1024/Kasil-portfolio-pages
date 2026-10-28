---
title: "2026-07-21_ChestSlotUI_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2a81ecc 파일: Assets/02_Scripts/UI/Game/ChestSlotUI.cs cs using TMPro; using UnityEngine; using UnityEngine.EventSystems; using UnityEngine.UI; "
description: "1. 이전 스크립트 전체 기준: 2a81ecc 파일: Assets/02_Scripts/UI/Game/ChestSlotUI.cs cs using TMPro; using UnityEngine; using UnityEngine.EventSystems; using UnityEngine.UI; "
published: false
migration_id: "3a436532580e81f59998efd41c05d007"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/UI/Game/ChestSlotUI.cs</code>

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

/// <summary>
/// 체스트 슬롯 1칸의 표시와 입력을 담당한다.
/// 더블클릭으로 인벤토리 이동, 드래그 앤 드롭으로 슬롯 지정 이동, 포인터 호버로 툴팁 출력을 처리한다.
/// </summary>
public class ChestSlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;      // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage;    // 등급별 슬롯 이미지
    [SerializeField] private Image categoryIconImage;   // 카테고리 아이콘 이미지
    [SerializeField] private Image itemImg;             // 아이템 아이콘 이미지
    [SerializeField] private TMP_Text itemStack;        // 아이템 개수 출력
    [SerializeField] private Transform itemInfo;        // 아이템 아이콘 위치

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

    private ChestUI chestUI;
    private int slotIndex;
    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    public int SlotIndex => slotIndex;
    public ChestUI OwnerUI => chestUI;

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();

        // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
        if (itemInfo == null)
```

```cs
        itemInfo = transform.Find("ItemInfo");

    if (itemInfo != null)
        canvasGroup = itemInfo.GetComponent<CanvasGroup>();
}

public void Initialize(ChestUI owner, int index)
{
    chestUI = owner;
    slotIndex = index;
    UpdateSlot(0, null, itemCategory.empty, ItemGrade.empty);
}

public void UpdateSlot(int stack, Sprite sprite, itemCategory _category, ItemGrade grade)
{
    if (stack <= 0 || sprite == null)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        ApplySlotFrame(ItemGrade.empty);
        ApplyCategoryIcon(itemCategory.empty);
        return;
    }

    itemImg.enabled = true;
    itemImg.sprite = sprite;
    itemStack.text = stack.ToString();
    ApplySlotFrame(grade);
    ApplyCategoryIcon(_category);
}

// 아이템 등급에 따라 슬롯 배경 이미지를 출력
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
```

```cs
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
        itemCategory.artifact => artifactSprite,
        itemCategory.consume => consumeSprite,
        itemCategory.memory => memorySprite,
        itemCategory.idle => idleSprite,
        _ => null
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

    // 상자 UI에서 인벤토리로 이동 처리를 실행
    chestUI.TryMoveToInventory(slotIndex);
}

public void OnBeginDrag(PointerEventData eventData)
{
    if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
        return;

    itemInfo.SetParent(mainCanvas.transform);
    itemInfo.SetAsLastSibling();

    if (canvasGroup != null)
```

```cs
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
            itemInfo.SetParent(transform);
            itemInfo.localPosition = Vector3.zero;
        }
    }

    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (droppedObj.TryGetComponent<InventorySlotUI>(out var inventorySlot))
            chestUI.TryMoveFromInventorySlot(inventorySlot.slotIndex, slotIndex);
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        // 드래그 중에는 툴팁을 표시하지 않습니다.
        if (InventorySlotUI.AnySlotDragging)
            return;

        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(SlotType.chest, slotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```

## 2. 변경 설명

인벤토리 슬롯을 드래그해 상자 슬롯 위에 올렸을 때 현재 <code>OnDrop</code>을 받을 상자 슬롯만 강조합니다. 포인터 진입 시 드래그 원본 타입을 확인하고, 드롭·드래그 종료·포인터 이탈·UI 비활성화 시 강조를 해제합니다. 표시 계층은 Raycast를 막지 않으므로 기존 인벤토리에서 상자로의 이동 판정은 그대로 유지됩니다.

## 3. 현재 스크립트 전체

- 기준: <code>c92a983</code>
- 파일: <code>Assets/02_Scripts/UI/Game/ChestSlotUI.cs</code>

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

/// <summary>
/// 체스트 슬롯 1칸의 표시와 입력을 담당한다.
/// 더블클릭으로 인벤토리 이동, 드래그 앤 드롭으로 슬롯 지정 이동, 포인터 호버로 툴팁 출력을 처리한다.
/// </summary>
public class ChestSlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;      // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage;    // 등급별 슬롯 이미지
    [SerializeField] private Image categoryIconImage;   // 카테고리 아이콘 이미지
    [SerializeField] private Image itemImg;             // 아이템 아이콘 이미지
    [SerializeField] private TMP_Text itemStack;        // 아이템 개수 출력
    [SerializeField] private Transform itemInfo;        // 아이템 아이콘 위치
    [SerializeField] private InventoryDropTargetFeedbackUI dropTargetFeedback; // 현재 드롭 예정 슬롯 강조

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

    private ChestUI chestUI;
    private int slotIndex;
    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    public int SlotIndex => slotIndex;
    public ChestUI OwnerUI => chestUI;

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();

```

```cs
    // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
    if (itemInfo == null)
        itemInfo = transform.Find("ItemInfo");

    if (itemInfo != null)
        canvasGroup = itemInfo.GetComponent<CanvasGroup>();

    if (dropTargetFeedback == null)
        dropTargetFeedback = GetComponentInChildren<InventoryDropTargetFeedbackUI>(true);

    dropTargetFeedback?.HideImmediate();
}

private void OnDisable()
{
    dropTargetFeedback?.HideImmediate();
}

public void Initialize(ChestUI owner, int index)
{
    chestUI = owner;
    slotIndex = index;
    UpdateSlot(0, null, itemCategory.empty, ItemGrade.empty);
}

public void UpdateSlot(int stack, Sprite sprite, itemCategory _category, ItemGrade grade)
{
    if (stack <= 0 || sprite == null)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        ApplySlotFrame(ItemGrade.empty);
        ApplyCategoryIcon(itemCategory.empty);
        return;
    }

    itemImg.enabled = true;
    itemImg.sprite = sprite;
    itemStack.text = stack.ToString();
    ApplySlotFrame(grade);
    ApplyCategoryIcon(_category);
}

// 아이템 등급에 따라 슬롯 배경 이미지를 출력
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
```

```cs
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
        return;
    }

    // 아이템 카테고리 종류별 라벨 아이콘을 출력한다
    categoryIconImage.enabled = true;
    categoryIconImage.sprite = category switch
    {
        itemCategory.artifact => artifactSprite,
        itemCategory.consume => consumeSprite,
        itemCategory.memory => memorySprite,
        itemCategory.idle => idleSprite,
        _ => null
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

    // 상자 UI에서 인벤토리로 이동 처리를 실행
```

```cs
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
        itemInfo.SetParent(transform);
        itemInfo.localPosition = Vector3.zero;
    }

    dropTargetFeedback?.SetAvailable(false);
}

public void OnDrop(PointerEventData eventData)
{
    // 실제 드롭 대상이 확정됐으므로 현재 슬롯 강조를 종료합니다.
    dropTargetFeedback?.SetAvailable(false);

    GameObject droppedObj = eventData.pointerDrag;
    if (droppedObj == null)
        return;

    if (droppedObj.TryGetComponent<InventorySlotUI>(out var inventorySlot))
        chestUI.TryMoveFromInventorySlot(inventorySlot.slotIndex, slotIndex);
}

public void OnPointerEnter(PointerEventData eventData)
{
    GameObject draggedObject = eventData.pointerDrag;
    if (draggedObject != null &&
        draggedObject.TryGetComponent<InventorySlotUI>(out _))
    {
        // 상자 슬롯의 실제 OnDrop 대상과 동일한 슬롯만 강조합니다.
        dropTargetFeedback?.SetAvailable(true);
        GlobalEventBus.OnTooltipUIClose?.Invoke();
        return;
```

```cs
        }

        // 드래그 중에는 툴팁을 표시하지 않습니다.
        if (draggedObject != null || InventorySlotUI.AnySlotDragging)
            return;

        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(SlotType.chest, slotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        dropTargetFeedback?.SetAvailable(false);

        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}

```
{% endraw %}
