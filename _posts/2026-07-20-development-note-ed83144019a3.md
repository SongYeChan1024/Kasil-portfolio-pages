---
title: "2026-07-20_TutorialHighlightPrefabSetup_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 9d7af9e 파일: Assets/Editor/TutorialHighlightPrefabSetup.cs 2. 변경 설명 튜토리얼 하이라이트에 필요한 Canvas 계층, 한글 TMP 폰트, 대상 ID와 참조를 프"
description: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 9d7af9e 파일: Assets/Editor/TutorialHighlightPrefabSetup.cs 2. 변경 설명 튜토리얼 하이라이트에 필요한 Canvas 계층, 한글 TMP 폰트, 대상 ID와 참조를 프"
published: false
migration_id: "3a336532580e811589afed83144019a3"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

신규 파일로 이전 스크립트가 없습니다.

- 생성 커밋: <code>9d7af9e</code>
- 파일: <code>Assets/Editor/TutorialHighlightPrefabSetup.cs</code>

## 2. 변경 설명

튜토리얼 하이라이트에 필요한 Canvas 계층, 한글 TMP 폰트, 대상 ID와 참조를 프리팹에 설치하는 에디터 도구입니다. 이미 사용자가 조절한 RectTransform과 시각 설정은 덮어쓰지 않고, 없는 구성요소와 끊어진 참조만 보강하는 비파괴 동기화 방식으로 만들었습니다.

## 3. 현재 스크립트 전체

- 기준: <code>9d7af9e</code>
- 파일: <code>Assets/Editor/TutorialHighlightPrefabSetup.cs</code>

```cs
using System;
using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 기존 튜토리얼 UI 레이아웃을 보존하면서 하이라이트 전용 Canvas 오브젝트와 대상 마커만 추가합니다.
/// 반복 실행해도 이미 존재하는 오브젝트의 시각 설정은 덮어쓰지 않습니다.
/// </summary>
public static class TutorialHighlightPrefabSetup
{
    private const string TutorialSystemPrefabPath = "Assets/03_PreFabs/Tutorial/TutorialSystem.prefab";
    private const string GameUIPrefabPath = "Assets/03_PreFabs/UI/Canvas-GameUI.prefab";
    private const string ChestUIPrefabPath = "Assets/03_PreFabs/UI/Canvas-ChestUI.prefab";
    private const string InventoryUIPrefabPath = "Assets/03_PreFabs/UI/Canvas-InventoryUI.prefab";
    private const string TooltipUIPrefabPath = "Assets/03_PreFabs/UI/Canvas-ItemTooltipUI.prefab";
    private const string KoreanFontAssetPath = "Assets/07_Fonts/NotoSansKR_Kor.asset";

    private static readonly Color DefaultDimColor = new(0f, 0f, 0f, 0.62f);
    private static readonly Color DefaultFrameColor = new(1f, 0.5f, 0f, 1f);
    private static readonly Color DefaultInstructionColor = new(0.035f, 0.045f, 0.075f, 0.94f);

    [MenuItem("Tools/Lucid Diver/Tutorial/Install or Sync Highlight Layer")]
    public static void ApplyAll()
    {
        SetupTutorialSystemPrefab();
        SetupUITargetPrefabs();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        GameObject tutorialSystem = AssetDatabase.LoadAssetAtPath<GameObject>(TutorialSystemPrefabPath);
        Selection.activeObject = tutorialSystem;
        EditorGUIUtility.PingObject(tutorialSystem);
        Debug.Log("[TutorialHighlightSetup] 기존 UI 레이아웃을 유지한 채 하이라이트 레이어와 UI 대상 연결을 완료했습니다.");
    }

    /// <summary>
```

```cs
/// Unity 배치 모드 검증에서도 동일한 안전 동기화 작업을 실행합니다.
/// </summary>
public static void ApplyAllFromCommandLine()
{
    ApplyAll();
}

public static void SetupTutorialSystemPrefab()
{
    GameObject root = PrefabUtility.LoadPrefabContents(TutorialSystemPrefabPath);

    try
    {
        TutorialManager manager = root.GetComponent<TutorialManager>();
        Canvas tutorialCanvas = root.GetComponentInChildren<Canvas>(true);
        TutorialPopup popup = root.GetComponentInChildren<TutorialPopup>(true);

        if (manager == null || tutorialCanvas == null || popup == null)
            throw new InvalidOperationException("TutorialSystem 프리팹에서 TutorialManager, TutorialCanvas 또는 TutorialPopup을 찾지 못했습니다.");

        bool layerCreated;
        GameObject layerObject = EnsureUIObject("TutorialHighlightLayer", tutorialCanvas.transform, out layerCreated);
        RectTransform layerRect = layerObject.GetComponent<RectTransform>();
        if (layerCreated)
            SetStretch(layerRect);

        CanvasGroup layerCanvasGroup = GetOrAddComponent<CanvasGroup>(layerObject, out bool layerCanvasGroupAdded);
        layerCanvasGroup.interactable = false;
        layerCanvasGroup.blocksRaycasts = false;
        if (layerCanvasGroupAdded)
            layerCanvasGroup.alpha = 1f;

        TutorialHighlightController controller = GetOrAddComponent<TutorialHighlightController>(layerObject, out _);

        GameObject dimRoot = EnsureUIObject("DimRoot", layerObject.transform, out bool dimRootCreated);
        if (dimRootCreated)
```

```cs
    SetStretch(dimRoot.GetComponent<RectTransform>());

RectTransform dimLeft = EnsureDimPanel("DimLeft", dimRoot.transform);
RectTransform dimRight = EnsureDimPanel("DimRight", dimRoot.transform);
RectTransform dimTop = EnsureDimPanel("DimTop", dimRoot.transform);
RectTransform dimBottom = EnsureDimPanel("DimBottom", dimRoot.transform);

GameObject focusFrameObject = EnsureUIObject("FocusFrame", layerObject.transform, out bool focusFrameCreated);
RectTransform focusFrame = focusFrameObject.GetComponent<RectTransform>();
if (focusFrameCreated)
{
    SetCenteredRect(focusFrame, Vector2.zero, new Vector2(240f, 160f));
    focusFrameObject.SetActive(false);
}

CanvasGroup focusCanvasGroup = GetOrAddComponent<CanvasGroup>(focusFrameObject, out bool focusCanvasGroupAdded);
focusCanvasGroup.interactable = false;
focusCanvasGroup.blocksRaycasts = false;
if (focusCanvasGroupAdded)
    focusCanvasGroup.alpha = 1f;

EnsureFrameBorder("BorderTop", focusFrameObject.transform, FrameEdge.Top);
EnsureFrameBorder("BorderBottom", focusFrameObject.transform, FrameEdge.Bottom);
EnsureFrameBorder("BorderLeft", focusFrameObject.transform, FrameEdge.Left);
EnsureFrameBorder("BorderRight", focusFrameObject.transform, FrameEdge.Right);

GameObject instructionRoot = EnsureInstructionPanel(layerObject.transform, out TMP_Text instructionTitle, out TMP_Text instructionMessage);
```

```cs
    SerializedObject controllerObject = new(controller);
    SetObjectReference(controllerObject, "highlightCanvas", tutorialCanvas);
    SetObjectReference(controllerObject, "highlightLayer", layerRect);
    SetObjectReference(controllerObject, "dimRoot", dimRoot);
    SetObjectReference(controllerObject, "dimLeft", dimLeft);
    SetObjectReference(controllerObject, "dimRight", dimRight);
    SetObjectReference(controllerObject, "dimTop", dimTop);
    SetObjectReference(controllerObject, "dimBottom", dimBottom);
    SetObjectReference(controllerObject, "focusFrame", focusFrame);
    SetObjectReference(controllerObject, "focusFrameCanvasGroup", focusCanvasGroup);
    SetObjectReference(controllerObject, "instructionRoot", instructionRoot);
    SetObjectReference(controllerObject, "instructionTitleText", instructionTitle);
    SetObjectReference(controllerObject, "instructionMessageText", instructionMessage);
    controllerObject.ApplyModifiedPropertiesWithoutUndo();

    SerializedObject managerObject = new(manager);
    SetObjectReference(managerObject, "highlightController", controller);
    managerObject.ApplyModifiedPropertiesWithoutUndo();

    // 같은 Canvas에서는 뒤쪽 형제가 위에 그려지므로 하이라이트는 팝업 바로 앞에 둡니다.
    layerObject.transform.SetAsFirstSibling();
    SetLayerRecursively(layerObject, LayerMask.NameToLayer("UI"));

    dimRoot.SetActive(false);
    instructionRoot.SetActive(false);
    PrefabUtility.SaveAsPrefabAsset(root, TutorialSystemPrefabPath);
}
finally
{
```

```cs
        PrefabUtility.UnloadPrefabContents(root);
    }
}

private static void SetupUITargetPrefabs()
{
    SetupTargetPrefab(
        GameUIPrefabPath,
        new TargetSpec("Panel-MP/Skill-Shift", "GameplayUI_SprintButton", new Vector2(16f, 16f)),
        new TargetSpec("Panel-PlayerStatus/MP", "GameplayUI_MPGauge", new Vector2(18f, 12f)),
        new TargetSpec("Panel-MP/Skill-Q", "GameplayUI_SkillButton", new Vector2(16f, 16f)));

    SetupTargetPrefab(
        ChestUIPrefabPath,
        new TargetSpec("Panel-Chest/Image-ChestSpace", "ChestUI_ItemSlots", new Vector2(18f, 18f)));

    SetupTargetPrefab(
        InventoryUIPrefabPath,
        new TargetSpec("Panel-Inventory/Scroll View-Inventory", "InventoryUI_Slots", new Vector2(18f, 18f)),
        new TargetSpec("Panel-Inventory/Panel-QuickSlotList", "InventoryUI_QuickSlot_ArtifactSlot", new Vector2(18f, 18f)),
        new TargetSpec("Panel-Inventory/Panel-EquipSlotList", "InventoryUI_QuickSlot_ArtifactSlot", new Vector2(18f, 18f)));

    SetupTargetPrefab(
        TooltipUIPrefabPath,
        new TargetSpec("Panel-Tooltip", "ItemTooltipUI", new Vector2(16f, 16f)));
}

private static void SetupTargetPrefab(string prefabPath, params TargetSpec[] specs)
{
    GameObject root = PrefabUtility.LoadPrefabContents(prefabPath);

    try
    {
        foreach (TargetSpec spec in specs)
        {
            Transform targetTransform = root.transform.Find(spec.RelativePath);
            if (targetTransform == null)
            {
```

```cs
                Debug.LogWarning($"[TutorialHighlightSetup] 대상 경로를 찾지 못했습니다: {prefabPath} / {spec.RelativePath}");
                continue;
            }

            RectTransform targetRect = targetTransform as RectTransform;
            if (targetRect == null)
            {
                Debug.LogWarning($"[TutorialHighlightSetup] 대상이 RectTransform이 아닙니다: {prefabPath} / {spec.RelativePath}");
                continue;
            }

            TutorialHighlightTarget marker = targetTransform.GetComponent<TutorialHighlightTarget>();
            bool markerCreated = marker == null;
            if (markerCreated)
                marker = targetTransform.gameObject.AddComponent<TutorialHighlightTarget>();

            SerializedObject markerObject = new(marker);
            markerObject.FindProperty("targetId").stringValue = spec.TargetId;
            markerObject.FindProperty("targetKind").enumValueIndex = (int)TutorialHighlightTarget.TargetKind.UI;
            SetObjectReference(markerObject, "uiTarget", targetRect);
            // 사용자가 인스펙터에서 조절한 강조 여백은 동기화 메뉴를 다시 실행해도 유지합니다.
            if (markerCreated)
                markerObject.FindProperty("uiPadding").vector2Value = spec.Padding;
            markerObject.ApplyModifiedPropertiesWithoutUndo();
        }

        PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
    }
    finally
    {
        PrefabUtility.UnloadPrefabContents(root);
    }
}

private static GameObject EnsureInstructionPanel(
    Transform parent,
    out TMP_Text titleText,
    out TMP_Text messageText)
{
```

```cs
GameObject root = EnsureUIObject("HighlightInstructionPanel", parent, out bool rootCreated);
RectTransform rootRect = root.GetComponent<RectTransform>();
if (rootCreated)
{
    rootRect.anchorMin = new Vector2(0.5f, 1f);
    rootRect.anchorMax = new Vector2(0.5f, 1f);
    rootRect.pivot = new Vector2(0.5f, 1f);
    rootRect.anchoredPosition = new Vector2(0f, -42f);
    rootRect.sizeDelta = new Vector2(820f, 112f);
}

Image background = GetOrAddComponent<Image>(root, out bool backgroundAdded);
background.raycastTarget = false;
if (backgroundAdded)
    background.color = DefaultInstructionColor;

titleText = EnsureText("TitleText", root.transform, out bool titleCreated);
if (titleCreated)
{
    RectTransform titleRect = titleText.rectTransform;
    titleRect.anchorMin = new Vector2(0f, 0f);
    titleRect.anchorMax = new Vector2(0.28f, 1f);
    titleRect.offsetMin = new Vector2(24f, 12f);
    titleRect.offsetMax = new Vector2(-12f, -12f);
    titleText.fontSize = 28f;
    titleText.fontStyle = FontStyles.Bold;
    titleText.alignment = TextAlignmentOptions.MidlineLeft;
    titleText.text = "목표";
}

messageText = EnsureText("MessageText", root.transform, out bool messageCreated);
if (messageCreated)
{
    RectTransform messageRect = messageText.rectTransform;
    messageRect.anchorMin = new Vector2(0.28f, 0f);
    messageRect.anchorMax = Vector2.one;
    messageRect.offsetMin = new Vector2(12f, 12f);
```

```cs
        messageRect.offsetMax = new Vector2(-24f, -12f);
        messageText.fontSize = 25f;
        messageText.alignment = TextAlignmentOptions.MidlineLeft;
        messageText.text = "튜토리얼 목표를 수행하십시오.";
    }

    if (rootCreated)
        root.SetActive(false);

    return root;
}

private static RectTransform EnsureDimPanel(string name, Transform parent)
{
    GameObject panel = EnsureUIObject(name, parent, out bool created);
    RectTransform rect = panel.GetComponent<RectTransform>();
    if (created)
        SetCenteredRect(rect, Vector2.zero, Vector2.zero);

    Image image = GetOrAddComponent<Image>(panel, out bool imageAdded);
    image.raycastTarget = false;
    if (imageAdded)
        image.color = DefaultDimColor;

    return rect;
}

private static void EnsureFrameBorder(string name, Transform parent, FrameEdge edge)
{
    GameObject border = EnsureUIObject(name, parent, out bool created);
    RectTransform rect = border.GetComponent<RectTransform>();

    if (created)
    {
        const float thickness = 6f;

        switch (edge)
        {
            case FrameEdge.Top:
                rect.anchorMin = new Vector2(0f, 1f);
                rect.anchorMax = Vector2.one;
                rect.pivot = new Vector2(0.5f, 1f);
                rect.anchoredPosition = Vector2.zero;
                rect.sizeDelta = new Vector2(0f, thickness);
                break;
            case FrameEdge.Bottom:
                rect.anchorMin = Vector2.zero;
                rect.anchorMax = new Vector2(1f, 0f);
```

```cs
                rect.pivot = new Vector2(0.5f, 0f);
                rect.anchoredPosition = Vector2.zero;
                rect.sizeDelta = new Vector2(0f, thickness);
                break;
            case FrameEdge.Left:
                rect.anchorMin = Vector2.zero;
                rect.anchorMax = new Vector2(0f, 1f);
                rect.pivot = new Vector2(0f, 0.5f);
                rect.anchoredPosition = Vector2.zero;
                rect.sizeDelta = new Vector2(thickness, 0f);
                break;
            case FrameEdge.Right:
                rect.anchorMin = new Vector2(1f, 0f);
                rect.anchorMax = Vector2.one;
                rect.pivot = new Vector2(1f, 0.5f);
                rect.anchoredPosition = Vector2.zero;
                rect.sizeDelta = new Vector2(thickness, 0f);
                break;
        }
    }

    Image image = GetOrAddComponent<Image>(border, out bool imageAdded);
    image.raycastTarget = false;
    if (imageAdded)
        image.color = DefaultFrameColor;
}

private static TMP_Text EnsureText(string name, Transform parent, out bool created)
{
    GameObject textObject = EnsureUIObject(name, parent, out created);
    TextMeshProUGUI text = GetOrAddComponent<TextMeshProUGUI>(textObject, out bool textAdded);
    text.raycastTarget = false;

    if (textAdded)
    {
        text.color = Color.white;
        text.enableWordWrapping = true;
    }

    // 기본 LiberationSans에는 한글 글리프가 없으므로 프로젝트 한글 폰트를 사용합니다.
    // 다른 한글 폰트로 직접 교체한 경우에는 그 설정을 유지합니다.
```

```cs
    TMP_FontAsset koreanFont = AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(KoreanFontAssetPath);
    bool usesUnsupportedDefaultFont = text.font == null ||
                                      text.font.name.IndexOf("LiberationSans", StringComparison.OrdinalIgnoreCase) >= 0;
    if (koreanFont != null && (textAdded || usesUnsupportedDefaultFont))
        text.font = koreanFont;
    else if (textAdded && TMP_Settings.defaultFontAsset != null)
        text.font = TMP_Settings.defaultFontAsset;

    return text;
}

private static GameObject EnsureUIObject(string name, Transform parent, out bool created)
{
    Transform existing = parent.Find(name);
    if (existing != null)
    {
        created = false;
        return existing.gameObject;
    }

    GameObject result = new(name, typeof(RectTransform));
    result.transform.SetParent(parent, false);
    created = true;
    return result;
}

private static T GetOrAddComponent<T>(GameObject target, out bool added) where T : Component
{
    T component = target.GetComponent<T>();
    if (component != null)
    {
        added = false;
        return component;
    }

    added = true;
    return target.AddComponent<T>();
}

private static void SetObjectReference(SerializedObject serializedObject, string propertyName, UnityEngine.Object value)
{
    SerializedProperty property = serializedObject.FindProperty(propertyName);
    if (property == null)
        throw new MissingFieldException(serializedObject.targetObject.GetType().Name, propertyName);
```

```cs
        property.objectReferenceValue = value;
    }

    private static void SetStretch(RectTransform rect)
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
    }

    private static void SetCenteredRect(RectTransform rect, Vector2 position, Vector2 size)
    {
        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.anchoredPosition = position;
        rect.sizeDelta = size;
    }

    private static void SetLayerRecursively(GameObject root, int layer)
    {
        if (layer < 0)
            return;

        root.layer = layer;
        foreach (Transform child in root.transform)
            SetLayerRecursively(child.gameObject, layer);
    }

    private readonly struct TargetSpec
    {
        public TargetSpec(string relativePath, string targetId, Vector2 padding)
        {
            RelativePath = relativePath;
            TargetId = targetId;
            Padding = padding;
        }

        public string RelativePath { get; }
        public string TargetId { get; }
        public Vector2 Padding { get; }
    }

    private enum FrameEdge
    {
        Top,
        Bottom,
        Left,
        Right
    }
}
```
{% endraw %}
