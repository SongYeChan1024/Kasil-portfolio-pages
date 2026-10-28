---
title: "2026-07-20_QuickSlotUI_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/UI/QuickSlotUI.cs cs using TMPro; using UnityEngine; using UnityEngine.EventSystems; using UnityEngine.UI; publ"
description: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/UI/QuickSlotUI.cs cs using TMPro; using UnityEngine; using UnityEngine.EventSystems; using UnityEngine.UI; publ"
published: false
migration_id: "3a336532580e813db112d307ca0bb7b7"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>6e5f262^</code>
- 파일: <code>Assets/02_Scripts/UI/QuickSlotUI.cs</code>

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class QuickSlotUI : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("퀵슬롯 구성 요소")]
    [SerializeField] public Image slotIcon;
    [SerializeField] public TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;
    [SerializeField] private Image slotFrameImage;

    [Header("퀵슬롯 아이콘 크기")]
    [SerializeField] private Vector2 maxIconSize = new Vector2(64f, 64f);

    [Header("퀵슬롯 레어리티 표시")]
    [SerializeField] private Image rarityFrameImage;
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;
    [SerializeField] private bool useIconTintWhenFrameMissing = true;

    [Header("빈 슬롯 색상")]
    [SerializeField] private Color emptySlotColor = new Color(0.32f, 0.32f, 0.32f, 1f);

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private QuickSlotGroupUI quickSlotGroupUI;
    private Canvas mainCanvas;

    private void Awake()
    {
        EnsureReferences();
    }

    private void EnsureReferences()
    {
        if (mainCanvas == null)
            mainCanvas = GetComponentInParent<Canvas>();

        if (quickSlotGroupUI == null)
            quickSlotGroupUI = GetComponentInParent<QuickSlotGroupUI>();

        if (itemInfo != null && canvasGroup == null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
```

```cs
    if (slotFrameImage == null)
        slotFrameImage = GetComponent<Image>();

    if (rarityFrameImage == null)
        rarityFrameImage = FindChildImage("Image-RarityFrame");

    if (rarityFrameImage != null)
        rarityFrameImage.raycastTarget = false;
}

public void Initialize(int index)
{
    EnsureReferences();

    slotIndex = index;

    ApplyEmptySlotFrame();

    if (slotIcon != null)
        slotIcon.enabled = false;

    if (itemStack != null)
        itemStack.text = "";

    ApplyIconSizeLimit();
    ApplyRarity(ItemGrade.empty);
}

public void UpdateSlot(int stack, Sprite sprite)
{
    UpdateSlot(stack, sprite, ItemGrade.empty);
}

public void UpdateSlot(int stack, Sprite sprite, ItemGrade grade)
{
    EnsureReferences();

    if (slotIcon == null)
        return;

    ApplyEmptySlotFrame();

    if (sprite == null)
    {
        slotIcon.enabled = false;
        slotIcon.sprite = null;
        slotIcon.color = Color.white;

        if (itemStack != null)
            itemStack.text = "";

        ApplyRarity(ItemGrade.empty);
        return;
    }

    slotIcon.sprite = sprite;
    slotIcon.enabled = true;
    slotIcon.color = Color.white;
    slotIcon.preserveAspect = true;

    ApplyIconSizeLimit();
    ApplyRarity(grade);

    if (itemStack != null)
        itemStack.text = $"{Mathf.Max(0, stack)}";
}

private void ApplyIconSizeLimit()
{
    if (slotIcon == null)
        return;

    RectTransform iconRect = slotIcon.rectTransform;
```

```cs
    if (iconRect == null)
        return;

    iconRect.sizeDelta = maxIconSize;
}

private void ApplyEmptySlotFrame()
{
    if (slotFrameImage == null)
        return;

    if (emptySlotSprite != null)
        slotFrameImage.sprite = emptySlotSprite;

    // 인벤토리 슬롯의 빈 칸 톤과 맞춰 퀵슬롯이 fill 이미지처럼 밝게 뜨지 않도록 고정합니다.
    slotFrameImage.color = emptySlotColor;
}

private void ApplyRarity(ItemGrade grade)
{
    bool hasFrameVisual = false;

    if (rarityFrameImage != null)
    {
        Sprite frameSprite = GetRaritySprite(grade);
        hasFrameVisual = grade != ItemGrade.empty && frameSprite != null;

        rarityFrameImage.enabled = hasFrameVisual;
        rarityFrameImage.sprite = hasFrameVisual ? frameSprite : null;
        rarityFrameImage.color = Color.white;

        // 레어리티 프레임은 아이템 아이콘을 덮지 않도록 뒤쪽 레이어에 둡니다.
        if (hasFrameVisual)
            rarityFrameImage.transform.SetAsFirstSibling();
    }

    if (slotIcon != null && useIconTintWhenFrameMissing && !hasFrameVisual)
        slotIcon.color = grade == ItemGrade.empty ? Color.white : GetRarityTint(grade);

    if (itemInfo != null)
        itemInfo.SetAsLastSibling();

    if (itemStack != null)
        itemStack.transform.SetAsLastSibling();
}

private Sprite GetRaritySprite(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => normalSlotSprite,
        ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
        ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
```

```cs
        ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
        ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
        _ => null
    };
}

private Color GetRarityTint(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => Color.white,
        ItemGrade.uncommon => new Color(0.45f, 1f, 0.55f, 1f),
        ItemGrade.rare => new Color(0.45f, 0.7f, 1f, 1f),
        ItemGrade.epic => new Color(0.78f, 0.45f, 1f, 1f),
        ItemGrade.legend => new Color(1f, 0.72f, 0.24f, 1f),
        _ => Color.white
    };
}

private Image FindChildImage(string childName)
{
    Transform[] children = GetComponentsInChildren<Transform>(true);
    foreach (Transform child in children)
    {
        if (child.name == childName && child.TryGetComponent(out Image image))
            return image;
    }

    return null;
}

public void OnBeginDrag(PointerEventData eventData)
{
    EnsureReferences();

    if (itemInfo == null || slotIcon == null || !slotIcon.enabled || mainCanvas == null)
        return;

    itemInfo.SetParent(mainCanvas.transform);
    itemInfo.SetAsLastSibling();

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = false;
}

public void OnDrag(PointerEventData eventData)
{
    if (itemInfo != null)
        itemInfo.position = eventData.position;
}

public void OnEndDrag(PointerEventData eventData)
{
    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = true;
```

```cs
        if (itemInfo != null && mainCanvas != null && itemInfo.parent == mainCanvas.transform)
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

        if (droppedObj.TryGetComponent<InventorySlotUI>(out InventorySlotUI originSlot))
        {
            GlobalEventBus.OnDropItemQuickSlot(slotIndex, originSlot.slotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<QuickSlotUI>(out QuickSlotUI quickSlot))
            GlobalEventBus.OnSwapItemQuickSlot(quickSlot.slotIndex, slotIndex);
    }
}
```

## 2. 변경 설명

퀵슬롯이 소비 아이템만 받을 수 있도록 공통 배치 정책으로 드롭을 검증합니다. 드래그 피드백이 표시한 허용 상태와 실제 퀵슬롯 등록 결과를 일치시켰습니다.

## 3. 현재 스크립트 전체

- 기준: <code>6e5f262</code>
- 파일: <code>Assets/02_Scripts/UI/QuickSlotUI.cs</code>

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class QuickSlotUI : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("퀵슬롯 구성 요소")]
    [SerializeField] public Image slotIcon;
    [SerializeField] public TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;
    [SerializeField] private Image slotFrameImage;

    [Header("퀵슬롯 아이콘 크기")]
    [SerializeField] private Vector2 maxIconSize = new Vector2(64f, 64f);

    [Header("퀵슬롯 레어리티 표시")]
    [SerializeField] private Image rarityFrameImage;
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;
    [SerializeField] private bool useIconTintWhenFrameMissing = true;

    [Header("빈 슬롯 색상")]
    [SerializeField] private Color emptySlotColor = new Color(0.32f, 0.32f, 0.32f, 1f);

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private QuickSlotGroupUI quickSlotGroupUI;
    private Canvas mainCanvas;

    private void Awake()
    {
        EnsureReferences();
    }

    private void EnsureReferences()
    {
        if (mainCanvas == null)
            mainCanvas = GetComponentInParent<Canvas>();

        if (quickSlotGroupUI == null)
            quickSlotGroupUI = GetComponentInParent<QuickSlotGroupUI>();

        if (itemInfo != null && canvasGroup == null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
```

```cs
    if (slotFrameImage == null)
        slotFrameImage = GetComponent<Image>();

    if (rarityFrameImage == null)
        rarityFrameImage = FindChildImage("Image-RarityFrame");

    if (rarityFrameImage != null)
        rarityFrameImage.raycastTarget = false;
}

public void Initialize(int index)
{
    EnsureReferences();

    slotIndex = index;

    ApplyEmptySlotFrame();

    if (slotIcon != null)
        slotIcon.enabled = false;

    if (itemStack != null)
        itemStack.text = "";

    ApplyIconSizeLimit();
    ApplyRarity(ItemGrade.empty);
}

public void UpdateSlot(int stack, Sprite sprite)
{
    UpdateSlot(stack, sprite, ItemGrade.empty);
}

public void UpdateSlot(int stack, Sprite sprite, ItemGrade grade)
{
    EnsureReferences();

    if (slotIcon == null)
        return;

    ApplyEmptySlotFrame();

    if (sprite == null)
    {
        slotIcon.enabled = false;
        slotIcon.sprite = null;
        slotIcon.color = Color.white;

        if (itemStack != null)
            itemStack.text = "";

        ApplyRarity(ItemGrade.empty);
        return;
    }

    slotIcon.sprite = sprite;
    slotIcon.enabled = true;
    slotIcon.color = Color.white;
    slotIcon.preserveAspect = true;

    ApplyIconSizeLimit();
    ApplyRarity(grade);

    if (itemStack != null)
        itemStack.text = $"{Mathf.Max(0, stack)}";
}

private void ApplyIconSizeLimit()
{
    if (slotIcon == null)
        return;

    RectTransform iconRect = slotIcon.rectTransform;
```

```cs
    if (iconRect == null)
        return;

    iconRect.sizeDelta = maxIconSize;
}

private void ApplyEmptySlotFrame()
{
    if (slotFrameImage == null)
        return;

    if (emptySlotSprite != null)
        slotFrameImage.sprite = emptySlotSprite;

    // 인벤토리 슬롯의 빈 칸 톤과 맞춰 퀵슬롯이 fill 이미지처럼 밝게 뜨지 않도록 고정합니다.
    slotFrameImage.color = emptySlotColor;
}

private void ApplyRarity(ItemGrade grade)
{
    bool hasFrameVisual = false;

    if (rarityFrameImage != null)
    {
        Sprite frameSprite = GetRaritySprite(grade);
        hasFrameVisual = grade != ItemGrade.empty && frameSprite != null;

        rarityFrameImage.enabled = hasFrameVisual;
        rarityFrameImage.sprite = hasFrameVisual ? frameSprite : null;
        rarityFrameImage.color = Color.white;

        // 레어리티 프레임은 아이템 아이콘을 덮지 않도록 뒤쪽 레이어에 둡니다.
        if (hasFrameVisual)
            rarityFrameImage.transform.SetAsFirstSibling();
    }

    if (slotIcon != null && useIconTintWhenFrameMissing && !hasFrameVisual)
        slotIcon.color = grade == ItemGrade.empty ? Color.white : GetRarityTint(grade);

    if (itemInfo != null)
        itemInfo.SetAsLastSibling();

    if (itemStack != null)
        itemStack.transform.SetAsLastSibling();
}

private Sprite GetRaritySprite(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => normalSlotSprite,
        ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
        ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
```

```cs
        ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
        ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
        _ => null
    };
}

private Color GetRarityTint(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => Color.white,
        ItemGrade.uncommon => new Color(0.45f, 1f, 0.55f, 1f),
        ItemGrade.rare => new Color(0.45f, 0.7f, 1f, 1f),
        ItemGrade.epic => new Color(0.78f, 0.45f, 1f, 1f),
        ItemGrade.legend => new Color(1f, 0.72f, 0.24f, 1f),
        _ => Color.white
    };
}

private Image FindChildImage(string childName)
{
    Transform[] children = GetComponentsInChildren<Transform>(true);
    foreach (Transform child in children)
    {
        if (child.name == childName && child.TryGetComponent(out Image image))
            return image;
    }

    return null;
}

public void OnBeginDrag(PointerEventData eventData)
{
    EnsureReferences();

    if (itemInfo == null || slotIcon == null || !slotIcon.enabled || mainCanvas == null)
        return;

    itemInfo.SetParent(mainCanvas.transform);
    itemInfo.SetAsLastSibling();

    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = false;
}

public void OnDrag(PointerEventData eventData)
{
    if (itemInfo != null)
        itemInfo.position = eventData.position;
}

public void OnEndDrag(PointerEventData eventData)
{
    if (canvasGroup != null)
        canvasGroup.blocksRaycasts = true;
```

```cs
        if (itemInfo != null && mainCanvas != null && itemInfo.parent == mainCanvas.transform)
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

        if (droppedObj.TryGetComponent<InventorySlotUI>(out InventorySlotUI originSlot))
        {
            bool canAssign = originSlot.CanAssignToQuickSlot
                && InventoryItemPlacementPolicy.CanPlace(
                    originSlot.CurrentItemData,
                    originSlot.CurrentItemTid,
                    InventoryDropTargetType.QuickSlot);
            if (!canAssign)
                return;

            GlobalEventBus.OnDropItemQuickSlot(slotIndex, originSlot.slotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<QuickSlotUI>(out QuickSlotUI quickSlot))
            GlobalEventBus.OnSwapItemQuickSlot(quickSlot.slotIndex, slotIndex);
    }
}
```
{% endraw %}
