---
title: "2026-07-20_ArtifactEquipSlotUI_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs cs using UnityEngine; using UnityEngine.EventSystems; using UnityEngine.UI; usin"
description: "1. 이전 스크립트 전체 기준: 6e5f262^ 파일: Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs cs using UnityEngine; using UnityEngine.EventSystems; using UnityEngine.UI; usin"
published: false
migration_id: "3a336532580e8183bd0fcf3ccf8b8ade"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>6e5f262^</code>
- 파일: <code>Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs</code>

```cs
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// 인벤토리 UI 안의 아티팩트 장착 슬롯 1칸을 담당합니다.
/// 직접 인벤토리 데이터를 수정하지 않고, 이벤트를 통해 Presenter에 장착/해제를 요청합니다.
/// </summary>
public class ArtifactEquipSlotUI : MonoBehaviour, IDropHandler, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("장착 슬롯 설정")]
    [SerializeField] private int equipSlotIndex; // 0, 1, 2 중 이 UI가 담당하는 장착 슬롯 번호

    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;   // 빈 장비칸 기본 이미지
    [SerializeField] private Image rarityFrameImage; // 장착된 아티팩트 등급별 슬롯 이미지
    [SerializeField] private Image itemImage;        // 장착된 아티팩트 아이콘 표시 이미지
    [SerializeField] private TMP_Text itemStack;     // 장착 수량 표시용 텍스트. 아티팩트는 1개만 표시합니다.

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    private ArtifactItemData currentArtifact; // 현재 UI에 표시 중인 아티팩트. 빈 슬롯 드래그를 막기 위해 캐시합니다.
    private Canvas mainCanvas;                // 드래그 중 아이콘을 최상단 Canvas로 올릴 때 사용합니다.
    private Transform originalItemParent;     // 드래그 종료 후 아이콘을 원래 장비 슬롯으로 되돌릴 때 사용합니다.

    public int EquipSlotIndex => equipSlotIndex;

    private void Awake()
    {
        EnsureReferences();
        UpdateSlot(null);
    }

    private void EnsureReferences()
    {
        if (mainCanvas == null)
```

```cs
        mainCanvas = GetComponentInParent<Canvas>();

    // 인스펙터 연결이 빠져도 프리팹 자식 이름이 유지되면 자동으로 복구합니다.
    // 단, 아이콘/등급 프레임처럼 역할이 분리된 이미지 이름만 찾습니다.
    if (slotFrameImage == null)
        slotFrameImage = FindChildImage("Image-Background");

    if (rarityFrameImage == null)
        rarityFrameImage = FindChildImage("Image-RarityFrame");

    if (rarityFrameImage == null)
        rarityFrameImage = CreateRarityFrameImage();

    if (itemImage == null)
        itemImage = FindChildImage("Image-EquipItemImage");

    // 빈 장비칸은 아이콘 이미지가 꺼져 있기 때문에 EventSystem이 드롭 대상을 찾지 못할 수 있습니다.
    // 배경 이미지를 Raycast Target으로 켜서 빈 슬롯에도 인벤토리 아이템을 드롭할 수 있게 합니다.
    if (slotFrameImage != null)
        slotFrameImage.raycastTarget = true;

    if (rarityFrameImage != null)
    {
        rarityFrameImage.raycastTarget = false;
        AlignRarityFrameToSlot();
    }
}

/// <summary>
/// 장착 슬롯에 표시할 아티팩트 아이콘, 수량, 등급 프레임을 갱신합니다.
/// </summary>
public void UpdateSlot(ArtifactItemData artifact)
{
    EnsureReferences();

    currentArtifact = artifact;

    if (artifact == null)
    {
        if (itemImage != null)
        {
            itemImage.enabled = false;
            itemImage.sprite = null;
            itemImage.color = Color.white;
        }

        if (itemStack != null)
            itemStack.text = "";

        ApplySlotFrame(ItemGrade.empty);
        return;
    }

    if (itemImage != null)
    {
        itemImage.enabled = true;
        itemImage.sprite = null;
        itemImage.color = Color.white;
```

```cs
    }

    if (itemStack != null)
        itemStack.text = "1";

    ApplySlotFrame(artifact.itemGrade);
    _ = LoadIconAsync(artifact.iconAddress);
}

/// <summary>
/// 장착된 아티팩트 등급에 맞춰 장비칸 프레임을 갱신합니다.
/// 빈 슬롯은 기본 배경만 표시하고, 아이템이 있으면 등급 프레임을 추가로 표시합니다.
/// </summary>
private void ApplySlotFrame(ItemGrade grade)
{
    if (slotFrameImage != null && emptySlotSprite != null)
        slotFrameImage.sprite = emptySlotSprite;

    if (rarityFrameImage == null)
        return;

    if (grade == ItemGrade.empty)
    {
        rarityFrameImage.enabled = false;
        rarityFrameImage.sprite = null;
        return;
    }

    Sprite frameSprite = GetSlotFrameSprite(grade);

    if (frameSprite == null)
    {
        rarityFrameImage.enabled = false;
        rarityFrameImage.sprite = null;
        if (itemImage != null)
            itemImage.color = GetRarityTint(grade);
        return;
    }

    rarityFrameImage.enabled = true;
    rarityFrameImage.color = Color.white;
    rarityFrameImage.sprite = frameSprite;
    AlignRarityFrameToSlot();

    // 아티팩트 슬롯은 Background / RarityFrame / ItemImage가 모두 자식 오브젝트입니다.
    // 프레임을 첫 번째로 보내면 Background 뒤에 숨어버리므로, 배경 바로 위이자 아이콘 아래에 둡니다.
    if (slotFrameImage != null)
        rarityFrameImage.transform.SetSiblingIndex(slotFrameImage.transform.GetSiblingIndex() + 1);

    if (itemImage != null)
        itemImage.transform.SetAsLastSibling();

    if (itemStack != null)
        itemStack.transform.SetAsLastSibling();
}

private void AlignRarityFrameToSlot()
{
```

```cs
    if (rarityFrameImage == null)
        return;

    RectTransform rarityRect = rarityFrameImage.rectTransform;
    if (rarityRect == null)
        return;

    // 창고 아티팩트 슬롯 프리팹에서 RarityFrame의 위치/크기 값이 슬롯 밖으로 틀어져 있는 경우가 있어,
    // 표시 시점마다 슬롯 전체를 덮는 프레임 레이어로 정렬합니다.
    rarityRect.anchorMin = Vector2.zero;
    rarityRect.anchorMax = Vector2.one;
    rarityRect.anchoredPosition = Vector2.zero;
    rarityRect.sizeDelta = Vector2.zero;
    rarityRect.localScale = Vector3.one;
    rarityRect.pivot = new Vector2(0.5f, 0.5f);
}

/// <summary>
/// 아이템 등급에 대응되는 슬롯 프레임 스프라이트를 반환합니다.
/// 일부 등급 이미지가 비어 있어도 바로 깨지지 않도록 낮은 등급 이미지로 대체합니다.
/// </summary>
private Sprite GetSlotFrameSprite(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => normalSlotSprite,
        ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
        ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
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
```

```cs
        _ => Color.white
    };
}

/// <summary>
/// 아티팩트 데이터의 Addressable 주소로 아이콘을 비동기 로드합니다.
/// </summary>
private async System.Threading.Tasks.Task LoadIconAsync(string iconAddress)
{
    if (string.IsNullOrEmpty(iconAddress) || itemImage == null)
        return;

    Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconAddress);

    if (loadedIcon == null)
        return;

    itemImage.enabled = true;
    itemImage.sprite = loadedIcon;
}

/// <summary>
/// 장비 슬롯 하위의 특정 이름을 가진 Image를 찾습니다.
/// 루트 슬롯 Image를 잘못 잡으면 클릭/드롭 판정이 흔들릴 수 있어 자식 이름을 기준으로만 찾습니다.
/// </summary>
private Image FindChildImage(string childName)
{
    Transform imageTransform = transform.Find(childName);

    if (imageTransform != null && imageTransform.TryGetComponent(out Image foundImage))
        return foundImage;

    Debug.LogWarning($"{name}: {childName}를 찾을 수 없습니다. ArtifactEquipSlotUI의 UI 참조를 인스펙터에서 연결해주세요.");
    return null;
}

private Image CreateRarityFrameImage()
{
    GameObject frameObject = new GameObject("Image-RarityFrame", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
    frameObject.transform.SetParent(transform, false);

    Image frameImage = frameObject.GetComponent<Image>();
    frameImage.enabled = false;
    frameImage.raycastTarget = false;
    frameImage.color = Color.white;

    RectTransform frameRect = frameImage.rectTransform;
    frameRect.anchorMin = Vector2.zero;
    frameRect.anchorMax = Vector2.one;
    frameRect.anchoredPosition = Vector2.zero;
```

```cs
    frameRect.sizeDelta = Vector2.zero;
    frameRect.localScale = Vector3.one;
    frameRect.pivot = new Vector2(0.5f, 0.5f);

    return frameImage;
}

/// <summary>
/// 장착 중인 아티팩트가 있을 때만 드래그를 시작합니다.
/// 드래그 중에는 아이콘 Raycast를 꺼서 아래 인벤토리 슬롯의 OnDrop이 받을 수 있게 합니다.
/// </summary>
public void OnBeginDrag(PointerEventData eventData)
{
    if (currentArtifact == null || itemImage == null || !itemImage.enabled)
        return;

    originalItemParent = itemImage.transform.parent;

    if (mainCanvas != null)
    {
        itemImage.transform.SetParent(mainCanvas.transform);
        itemImage.transform.SetAsLastSibling();
    }

    itemImage.raycastTarget = false;
}

/// <summary>
/// 드래그 중 아이콘을 마우스 위치에 따라 이동시켜 장비칸에서 빼는 느낌을 줍니다.
/// </summary>
public void OnDrag(PointerEventData eventData)
{
    if (currentArtifact == null || itemImage == null)
        return;

    itemImage.transform.position = eventData.position;
}

/// <summary>
/// 드래그가 끝나면 아이콘을 장비 슬롯 원래 위치로 되돌립니다.
/// 실제 해제 여부는 드롭을 받은 인벤토리 슬롯이 Presenter에 요청합니다.
/// </summary>
public void OnEndDrag(PointerEventData eventData)
{
    if (itemImage == null)
        return;

    itemImage.raycastTarget = true;

    if (originalItemParent != null)
    {
        itemImage.transform.SetParent(originalItemParent);
        itemImage.transform.localPosition = Vector3.zero;
    }

    originalItemParent = null;
}

/// <summary>
/// 인벤토리 슬롯을 장착 슬롯 위에 드롭하면 장착 요청 이벤트를 발생시킵니다.
/// 실제 장착 가능 여부와 데이터 이동은 InventoryPresenter가 판단합니다.
/// </summary>
```

```cs
    public void OnDrop(PointerEventData eventData)
    {
        if (eventData.pointerDrag == null)
            return;

        if (eventData.pointerDrag.TryGetComponent<InventorySlotUI>(out InventorySlotUI inventorySlot))
        {
            GlobalEventBus.OnArtifactEquipRequested?.Invoke(equipSlotIndex, inventorySlot.slotIndex);
        }
    }

    /// <summary>
    /// 장착 슬롯을 왼쪽 더블클릭하면 현재 장착된 아티팩트 해제를 요청합니다.
    /// 우클릭 해제는 사용하지 않고, 더블클릭/드래그 앤 드롭 흐름으로 통일합니다.
    /// </summary>
    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Left)
        {
            // 클릭 시 사운드 재생
            GlobalEventBus.OnClickAudio?.Invoke(true);
        }

        if (eventData.button != PointerEventData.InputButton.Left || eventData.clickCount < 2)
            return;

        GlobalEventBus.OnArtifactUnequipRequested?.Invoke(equipSlotIndex);
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        // 드래그 중에는 툴팁을 표시하지 않습니다.
        if (InventorySlotUI.AnySlotDragging)
            return;

        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(SlotType.artifact, equipSlotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```

## 2. 변경 설명

아티팩트 장착 슬롯의 드롭 수용 여부를 공통 정책으로 판정하도록 수정했습니다. 아티팩트가 아닌 아이템은 시각적으로도, 실제 드롭 처리에서도 동일하게 거부됩니다.

## 3. 현재 스크립트 전체

- 기준: <code>6e5f262</code>
- 파일: <code>Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs</code>

```cs
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// 인벤토리 UI 안의 아티팩트 장착 슬롯 1칸을 담당합니다.
/// 직접 인벤토리 데이터를 수정하지 않고, 이벤트를 통해 Presenter에 장착/해제를 요청합니다.
/// </summary>
public class ArtifactEquipSlotUI : MonoBehaviour, IDropHandler, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("장착 슬롯 설정")]
    [SerializeField] private int equipSlotIndex; // 0, 1, 2 중 이 UI가 담당하는 장착 슬롯 번호

    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;   // 빈 장비칸 기본 이미지
    [SerializeField] private Image rarityFrameImage; // 장착된 아티팩트 등급별 슬롯 이미지
    [SerializeField] private Image itemImage;        // 장착된 아티팩트 아이콘 표시 이미지
    [SerializeField] private TMP_Text itemStack;     // 장착 수량 표시용 텍스트. 아티팩트는 1개만 표시합니다.

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    private ArtifactItemData currentArtifact; // 현재 UI에 표시 중인 아티팩트. 빈 슬롯 드래그를 막기 위해 캐시합니다.
    private Canvas mainCanvas;                // 드래그 중 아이콘을 최상단 Canvas로 올릴 때 사용합니다.
    private Transform originalItemParent;     // 드래그 종료 후 아이콘을 원래 장비 슬롯으로 되돌릴 때 사용합니다.

    public int EquipSlotIndex => equipSlotIndex;

    private void Awake()
    {
        EnsureReferences();
        UpdateSlot(null);
    }

    private void EnsureReferences()
    {
        if (mainCanvas == null)
```

```cs
        mainCanvas = GetComponentInParent<Canvas>();

    // 인스펙터 연결이 빠져도 프리팹 자식 이름이 유지되면 자동으로 복구합니다.
    // 단, 아이콘/등급 프레임처럼 역할이 분리된 이미지 이름만 찾습니다.
    if (slotFrameImage == null)
        slotFrameImage = FindChildImage("Image-Background");

    if (rarityFrameImage == null)
        rarityFrameImage = FindChildImage("Image-RarityFrame");

    if (rarityFrameImage == null)
        rarityFrameImage = CreateRarityFrameImage();

    if (itemImage == null)
        itemImage = FindChildImage("Image-EquipItemImage");

    // 빈 장비칸은 아이콘 이미지가 꺼져 있기 때문에 EventSystem이 드롭 대상을 찾지 못할 수 있습니다.
    // 배경 이미지를 Raycast Target으로 켜서 빈 슬롯에도 인벤토리 아이템을 드롭할 수 있게 합니다.
    if (slotFrameImage != null)
        slotFrameImage.raycastTarget = true;

    if (rarityFrameImage != null)
    {
        rarityFrameImage.raycastTarget = false;
        AlignRarityFrameToSlot();
    }
}

/// <summary>
/// 장착 슬롯에 표시할 아티팩트 아이콘, 수량, 등급 프레임을 갱신합니다.
/// </summary>
public void UpdateSlot(ArtifactItemData artifact)
{
    EnsureReferences();

    currentArtifact = artifact;

    if (artifact == null)
    {
        if (itemImage != null)
        {
            itemImage.enabled = false;
            itemImage.sprite = null;
            itemImage.color = Color.white;
        }

        if (itemStack != null)
            itemStack.text = "";

        ApplySlotFrame(ItemGrade.empty);
        return;
    }

    if (itemImage != null)
    {
        itemImage.enabled = true;
        itemImage.sprite = null;
        itemImage.color = Color.white;
```

```cs
    }

    if (itemStack != null)
        itemStack.text = "1";

    ApplySlotFrame(artifact.itemGrade);
    _ = LoadIconAsync(artifact.iconAddress);
}

/// <summary>
/// 장착된 아티팩트 등급에 맞춰 장비칸 프레임을 갱신합니다.
/// 빈 슬롯은 기본 배경만 표시하고, 아이템이 있으면 등급 프레임을 추가로 표시합니다.
/// </summary>
private void ApplySlotFrame(ItemGrade grade)
{
    if (slotFrameImage != null && emptySlotSprite != null)
        slotFrameImage.sprite = emptySlotSprite;

    if (rarityFrameImage == null)
        return;

    if (grade == ItemGrade.empty)
    {
        rarityFrameImage.enabled = false;
        rarityFrameImage.sprite = null;
        return;
    }

    Sprite frameSprite = GetSlotFrameSprite(grade);

    if (frameSprite == null)
    {
        rarityFrameImage.enabled = false;
        rarityFrameImage.sprite = null;
        if (itemImage != null)
            itemImage.color = GetRarityTint(grade);
        return;
    }

    rarityFrameImage.enabled = true;
    rarityFrameImage.color = Color.white;
    rarityFrameImage.sprite = frameSprite;
    AlignRarityFrameToSlot();

    // 아티팩트 슬롯은 Background / RarityFrame / ItemImage가 모두 자식 오브젝트입니다.
    // 프레임을 첫 번째로 보내면 Background 뒤에 숨어버리므로, 배경 바로 위이자 아이콘 아래에 둡니다.
    if (slotFrameImage != null)
        rarityFrameImage.transform.SetSiblingIndex(slotFrameImage.transform.GetSiblingIndex() + 1);

    if (itemImage != null)
        itemImage.transform.SetAsLastSibling();

    if (itemStack != null)
        itemStack.transform.SetAsLastSibling();
}

private void AlignRarityFrameToSlot()
{
```

```cs
    if (rarityFrameImage == null)
        return;

    RectTransform rarityRect = rarityFrameImage.rectTransform;
    if (rarityRect == null)
        return;

    // 창고 아티팩트 슬롯 프리팹에서 RarityFrame의 위치/크기 값이 슬롯 밖으로 틀어져 있는 경우가 있어,
    // 표시 시점마다 슬롯 전체를 덮는 프레임 레이어로 정렬합니다.
    rarityRect.anchorMin = Vector2.zero;
    rarityRect.anchorMax = Vector2.one;
    rarityRect.anchoredPosition = Vector2.zero;
    rarityRect.sizeDelta = Vector2.zero;
    rarityRect.localScale = Vector3.one;
    rarityRect.pivot = new Vector2(0.5f, 0.5f);
}

/// <summary>
/// 아이템 등급에 대응되는 슬롯 프레임 스프라이트를 반환합니다.
/// 일부 등급 이미지가 비어 있어도 바로 깨지지 않도록 낮은 등급 이미지로 대체합니다.
/// </summary>
private Sprite GetSlotFrameSprite(ItemGrade grade)
{
    return grade switch
    {
        ItemGrade.normal => normalSlotSprite,
        ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
        ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
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
```

```cs
        _ => Color.white
    };
}

/// <summary>
/// 아티팩트 데이터의 Addressable 주소로 아이콘을 비동기 로드합니다.
/// </summary>
private async System.Threading.Tasks.Task LoadIconAsync(string iconAddress)
{
    if (string.IsNullOrEmpty(iconAddress) || itemImage == null)
        return;

    Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconAddress);

    if (loadedIcon == null)
        return;

    itemImage.enabled = true;
    itemImage.sprite = loadedIcon;
}

/// <summary>
/// 장비 슬롯 하위의 특정 이름을 가진 Image를 찾습니다.
/// 루트 슬롯 Image를 잘못 잡으면 클릭/드롭 판정이 흔들릴 수 있어 자식 이름을 기준으로만 찾습니다.
/// </summary>
private Image FindChildImage(string childName)
{
    Transform imageTransform = transform.Find(childName);

    if (imageTransform != null && imageTransform.TryGetComponent(out Image foundImage))
        return foundImage;

    Debug.LogWarning($"{name}: {childName}를 찾을 수 없습니다. ArtifactEquipSlotUI의 UI 참조를 인스펙터에서 연결해주세요.");
    return null;
}

private Image CreateRarityFrameImage()
{
    GameObject frameObject = new GameObject("Image-RarityFrame", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
    frameObject.transform.SetParent(transform, false);

    Image frameImage = frameObject.GetComponent<Image>();
    frameImage.enabled = false;
    frameImage.raycastTarget = false;
    frameImage.color = Color.white;

    RectTransform frameRect = frameImage.rectTransform;
    frameRect.anchorMin = Vector2.zero;
    frameRect.anchorMax = Vector2.one;
    frameRect.anchoredPosition = Vector2.zero;
```

```cs
    frameRect.sizeDelta = Vector2.zero;
    frameRect.localScale = Vector3.one;
    frameRect.pivot = new Vector2(0.5f, 0.5f);

    return frameImage;
}

/// <summary>
/// 장착 중인 아티팩트가 있을 때만 드래그를 시작합니다.
/// 드래그 중에는 아이콘 Raycast를 꺼서 아래 인벤토리 슬롯의 OnDrop이 받을 수 있게 합니다.
/// </summary>
public void OnBeginDrag(PointerEventData eventData)
{
    if (currentArtifact == null || itemImage == null || !itemImage.enabled)
        return;

    originalItemParent = itemImage.transform.parent;

    if (mainCanvas != null)
    {
        itemImage.transform.SetParent(mainCanvas.transform);
        itemImage.transform.SetAsLastSibling();
    }

    itemImage.raycastTarget = false;
}

/// <summary>
/// 드래그 중 아이콘을 마우스 위치에 따라 이동시켜 장비칸에서 빼는 느낌을 줍니다.
/// </summary>
public void OnDrag(PointerEventData eventData)
{
    if (currentArtifact == null || itemImage == null)
        return;

    itemImage.transform.position = eventData.position;
}

/// <summary>
/// 드래그가 끝나면 아이콘을 장비 슬롯 원래 위치로 되돌립니다.
/// 실제 해제 여부는 드롭을 받은 인벤토리 슬롯이 Presenter에 요청합니다.
/// </summary>
public void OnEndDrag(PointerEventData eventData)
{
    if (itemImage == null)
        return;

    itemImage.raycastTarget = true;

    if (originalItemParent != null)
    {
        itemImage.transform.SetParent(originalItemParent);
        itemImage.transform.localPosition = Vector3.zero;
    }

    originalItemParent = null;
}

/// <summary>
/// 인벤토리 슬롯을 장착 슬롯 위에 드롭하면 장착 요청 이벤트를 발생시킵니다.
/// 실제 장착 가능 여부와 데이터 이동은 InventoryPresenter가 판단합니다.
/// </summary>
```

```cs
    public void OnDrop(PointerEventData eventData)
    {
        if (eventData.pointerDrag == null)
            return;

        if (eventData.pointerDrag.TryGetComponent<InventorySlotUI>(out InventorySlotUI inventorySlot))
        {
            if (!InventoryItemPlacementPolicy.CanPlace(
                    inventorySlot.CurrentItemData,
                    InventoryDropTargetType.ArtifactSlot))
                return;

            GlobalEventBus.OnArtifactEquipRequested?.Invoke(equipSlotIndex, inventorySlot.slotIndex);
        }
    }

    /// <summary>
    /// 장착 슬롯을 왼쪽 더블클릭하면 현재 장착된 아티팩트 해제를 요청합니다.
    /// 우클릭 해제는 사용하지 않고, 더블클릭/드래그 앤 드롭 흐름으로 통일합니다.
    /// </summary>
    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Left)
        {
            // 클릭 시 사운드 재생
            GlobalEventBus.OnClickAudio?.Invoke(true);
        }

        if (eventData.button != PointerEventData.InputButton.Left || eventData.clickCount < 2)
            return;

        GlobalEventBus.OnArtifactUnequipRequested?.Invoke(equipSlotIndex);
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        // 드래그 중에는 툴팁을 표시하지 않습니다.
        if (InventorySlotUI.AnySlotDragging)
            return;

        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(SlotType.artifact, equipSlotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```
{% endraw %}
