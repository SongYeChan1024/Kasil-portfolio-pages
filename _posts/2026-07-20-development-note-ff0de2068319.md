---
title: "2026-07-20_InventoryDropFeedbackPrefabSetup_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 6e5f262 파일: Assets/Editor/InventoryDropFeedbackPrefabSetup.cs 2. 변경 설명 Inventory Canvas에 밝기 Fill, 흰색 Border, 피드백 컴포넌트"
description: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 6e5f262 파일: Assets/Editor/InventoryDropFeedbackPrefabSetup.cs 2. 변경 설명 Inventory Canvas에 밝기 Fill, 흰색 Border, 피드백 컴포넌트"
published: true
migration_id: "3a336532580e8157a395ff0de2068319"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

신규 파일로 이전 스크립트가 없습니다.

- 생성 커밋: <code>6e5f262</code>
- 파일: <code>Assets/Editor/InventoryDropFeedbackPrefabSetup.cs</code>

## 2. 변경 설명

Inventory Canvas에 밝기 Fill, 흰색 Border, 피드백 컴포넌트와 참조를 설치하는 에디터 도구입니다. 기존 사용자가 조정한 프리팹 배치와 이미지 값을 보존하고, 누락된 계층과 연결만 추가하는 비파괴 설정 방식으로 구성했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>6e5f262</code>
- 파일: <code>Assets/Editor/InventoryDropFeedbackPrefabSetup.cs</code>

```cs
using System;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 기존 인벤토리 프리팹 레이아웃을 보존하면서 드롭 가능 슬롯 피드백 Canvas 계층을 추가합니다.
/// 반복 실행 시 사용자가 인스펙터에서 변경한 색상, 두께, 배치 값은 덮어쓰지 않습니다.
/// </summary>
public static class InventoryDropFeedbackPrefabSetup
{
    private const string InventoryPrefabPath = "Assets/03_PreFabs/UI/Canvas-InventoryUI.prefab";

    private static readonly Color DefaultFillColor = new(1f, 1f, 1f, 0.12f);
    private static readonly Color DefaultBorderColor = new(0.9f, 0.96f, 1f, 0.72f);

    [MenuItem("Tools/Lucid Diver/UI/Install or Sync Inventory Drop Feedback")]
    public static void Apply()
    {
        GameObject root = PrefabUtility.LoadPrefabContents(InventoryPrefabPath);

        try
        {
            InventoryDropTargetFeedbackUI[] quickSlotTargets =
            {
                SetupTarget(root.transform, "Panel-Inventory/Panel-QuickSlotList/QuickSlot_0", InventoryDropTargetType.QuickSlot),
                SetupTarget(root.transform, "Panel-Inventory/Panel-QuickSlotList/QuickSlot_1", InventoryDropTargetType.QuickSlot),
                SetupTarget(root.transform, "Panel-Inventory/Panel-QuickSlotList/QuickSlot_2", InventoryDropTargetType.QuickSlot)
            };

            InventoryDropTargetFeedbackUI[] artifactSlotTargets =
            {
                SetupTarget(root.transform, "Panel-Inventory/Panel-EquipSlotList/EquipSlot_0", InventoryDropTargetType.ArtifactSlot),
                SetupTarget(root.transform, "Panel-Inventory/Panel-EquipSlotList/EquipSlot_1", InventoryDropTargetType.ArtifactSlot),
```

```cs
            SetupTarget(root.transform, "Panel-Inventory/Panel-EquipSlotList/EquipSlot_2", InventoryDropTargetType.ArtifactSlot)
        };

        InventoryDragFeedbackController controller = GetOrAddComponent<InventoryDragFeedbackController>(root, out _);
        SerializedObject controllerObject = new(controller);
        SetObjectReferenceArray(controllerObject, "quickSlotTargets", quickSlotTargets);
        SetObjectReferenceArray(controllerObject, "artifactSlotTargets", artifactSlotTargets);
        controllerObject.ApplyModifiedPropertiesWithoutUndo();

        InventoryUI inventoryUI = root.GetComponent<InventoryUI>();
        if (inventoryUI == null)
            inventoryUI = root.GetComponentInChildren<InventoryUI>(true);

        if (inventoryUI != null)
        {
            SerializedObject inventoryObject = new(inventoryUI);
            SetObjectReference(inventoryObject, "dropFeedbackController", controller);
            inventoryObject.ApplyModifiedPropertiesWithoutUndo();
        }

        PrefabUtility.SaveAsPrefabAsset(root, InventoryPrefabPath);
    }
    finally
    {
        PrefabUtility.UnloadPrefabContents(root);
    }

    AssetDatabase.SaveAssets();
    AssetDatabase.Refresh();

    GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(InventoryPrefabPath);
    Selection.activeObject = prefab;
    EditorGUIUtility.PingObject(prefab);
    Debug.Log("[InventoryDropFeedbackSetup] 인벤토리 드롭 가능 슬롯의 Canvas 피드백 연결을 완료했습니다.");
}

public static void ApplyFromCommandLine()
{
    Apply();
}
```

```cs
private static InventoryDropTargetFeedbackUI SetupTarget(Transform prefabRoot, string relativePath, InventoryDropTargetType targetType)
{
    Transform slot = prefabRoot.Find(relativePath);
    if (slot == null)
    {
        Debug.LogWarning($"[InventoryDropFeedbackSetup] 슬롯 경로를 찾지 못했습니다: {relativePath}");
        return null;
    }

    GameObject feedbackRoot = EnsureUIObject("DropTargetFeedback", slot, out bool feedbackCreated);
    RectTransform feedbackRect = feedbackRoot.GetComponent<RectTransform>();
    if (feedbackCreated)
        SetStretch(feedbackRect);

    CanvasGroup visualGroup = GetOrAddComponent<CanvasGroup>(feedbackRoot, out bool groupAdded);
    visualGroup.interactable = false;
    visualGroup.blocksRaycasts = false;
    if (groupAdded)
        visualGroup.alpha = 0f;

    // 아이템과 레어리티 프레임이 런타임에 형제 순서를 바꾸더라도 강조가 가려지지 않게 합니다.
    Canvas overlayCanvas = GetOrAddComponent<Canvas>(feedbackRoot, out bool canvasAdded);
    overlayCanvas.overrideSorting = true;
    if (canvasAdded)
        overlayCanvas.sortingOrder = 2;

    // 밝기와 테두리를 별도 자식 Image로 두어 디자이너가 Canvas에서 각각 조절할 수 있게 합니다.
    // 루트의 Image + Outline 방식은 사각형 전체를 여러 번 겹쳐 그려 아이콘을 가릴 수 있으므로 사용하지 않습니다.
    RemoveLegacyRootGraphics(feedbackRoot);
    SetupFillVisual(feedbackRoot.transform);
    SetupBorderVisual(feedbackRoot.transform);

    InventoryDropTargetFeedbackUI feedback = GetOrAddComponent<InventoryDropTargetFeedbackUI>(feedbackRoot, out _);

    SerializedObject feedbackObject = new(feedback);
    feedbackObject.FindProperty("targetType").enumValueIndex = (int)targetType;
```

```cs
    SetObjectReference(feedbackObject, "visualGroup", visualGroup);
    feedbackObject.ApplyModifiedPropertiesWithoutUndo();

    if (feedbackCreated)
        feedbackRoot.transform.SetAsLastSibling();

    SetLayerRecursively(feedbackRoot, LayerMask.NameToLayer("UI"));

    return feedback;
}

private static void SetupFillVisual(Transform feedbackRoot)
{
    GameObject fillObject = EnsureUIObject("Image-DropValidFill", feedbackRoot, out bool created);
    if (created)
        SetStretch(fillObject.GetComponent<RectTransform>());

    Image fillImage = GetOrAddComponent<Image>(fillObject, out bool imageAdded);
    fillImage.raycastTarget = false;
    if (imageAdded)
        fillImage.color = DefaultFillColor;

    SetLayerRecursively(fillObject, LayerMask.NameToLayer("UI"));
    fillObject.transform.SetAsFirstSibling();
}

private static void SetupBorderVisual(Transform feedbackRoot)
{
    GameObject borderObject = EnsureUIObject("Image-DropValidBorder", feedbackRoot, out bool created);
    if (created)
        SetStretch(borderObject.GetComponent<RectTransform>());

    Image borderImage = GetOrAddComponent<Image>(borderObject, out bool imageAdded);
    borderImage.raycastTarget = false;
    if (imageAdded)
    {
        borderImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
        borderImage.type = Image.Type.Sliced;
        borderImage.fillCenter = false;
        borderImage.color = DefaultBorderColor;
    }

    SetLayerRecursively(borderObject, LayerMask.NameToLayer("UI"));
```

```cs
    borderObject.transform.SetAsLastSibling();
}

private static void RemoveLegacyRootGraphics(GameObject feedbackRoot)
{
    // 초기 버전에서 루트에 직접 붙였던 그래픽만 제거합니다. 자식 Canvas 시각 값에는 손대지 않습니다.
    Outline legacyOutline = feedbackRoot.GetComponent<Outline>();
    if (legacyOutline != null)
        UnityEngine.Object.DestroyImmediate(legacyOutline);

    Image legacyImage = feedbackRoot.GetComponent<Image>();
    if (legacyImage != null)
        UnityEngine.Object.DestroyImmediate(legacyImage);

    CanvasRenderer legacyRenderer = feedbackRoot.GetComponent<CanvasRenderer>();
    if (legacyRenderer != null)
        UnityEngine.Object.DestroyImmediate(legacyRenderer);
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
```

```cs
        SerializedProperty property = serializedObject.FindProperty(propertyName);
        if (property == null)
            throw new MissingFieldException(serializedObject.targetObject.GetType().Name, propertyName);

        property.objectReferenceValue = value;
    }

    private static void SetObjectReferenceArray(
        SerializedObject serializedObject,
        string propertyName,
        UnityEngine.Object[] values)
    {
        SerializedProperty property = serializedObject.FindProperty(propertyName);
        if (property == null)
            throw new MissingFieldException(serializedObject.targetObject.GetType().Name, propertyName);

        property.arraySize = values?.Length ?? 0;
        for (int i = 0; i < property.arraySize; i++)
            property.GetArrayElementAtIndex(i).objectReferenceValue = values[i];
    }

    private static void SetStretch(RectTransform rect)
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
    }

    private static void SetLayerRecursively(GameObject root, int layer)
    {
        if (layer < 0)
            return;

        root.layer = layer;
        foreach (Transform child in root.transform)
            SetLayerRecursively(child.gameObject, layer);
    }
}
```
{% endraw %}
