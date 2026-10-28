---
title: "2026-07-20_TutorialPrefabBuilder_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 9d7af9e^ 파일: Assets/Editor/TutorialPrefabBuilder.cs cs using System.Collections.Generic; using System.Linq; using TMPro; using UnityEditor; us"
description: "1. 이전 스크립트 전체 기준: 9d7af9e^ 파일: Assets/Editor/TutorialPrefabBuilder.cs cs using System.Collections.Generic; using System.Linq; using TMPro; using UnityEditor; us"
published: false
migration_id: "3a336532580e81b09c35e9ed5922fb05"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>9d7af9e^</code>
- 파일: <code>Assets/Editor/TutorialPrefabBuilder.cs</code>

```cs
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// 튜토리얼 시스템과 트리거 프리팹을 생성하고 TutorialScene에 기본 이동 트리거를 배치합니다.
/// </summary>
public static class TutorialPrefabBuilder
{
    private const string PrefabFolder = "Assets/03_PreFabs/Tutorial";
    private const string SystemPrefabPath = PrefabFolder + "/TutorialSystem.prefab";
    private const string TriggerPrefabPath = PrefabFolder + "/TutorialTrigger.prefab";
    private const string CatalogFolder = "Assets/Resources/Tutorial";
    private const string CatalogPath = CatalogFolder + "/TutorialMessageCatalog.asset";
    private const string TutorialScenePath = "Assets/01_Scenes/TutorialScene.unity";

    [MenuItem("Tools/Lucid Diver/Tutorial/Build Tutorial Prefabs and Scene")]
    public static void BuildTutorialAssets()
    {
        EnsureFolder(PrefabFolder);
        EnsureFolder(CatalogFolder);

        TutorialMessageCatalog catalog = CreateCatalogIfNeeded();
        CreateSystemPrefab(catalog);
        CreateTriggerPrefab();
        PlacePrefabsInTutorialScene();
        AddTutorialSceneToBuildSettings();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        GameObject systemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
        Selection.activeObject = systemPrefab;
        EditorGUIUtility.PingObject(systemPrefab);
        Debug.Log("[TutorialBuilder] TutorialSystem/Trigger 프리팹과 TutorialScene 기본 배치를 완료했습니다.");
    }

    private static TutorialMessageCatalog CreateCatalogIfNeeded()
    {
```

```cs
    TutorialMessageCatalog catalog = AssetDatabase.LoadAssetAtPath<TutorialMessageCatalog>(CatalogPath);
    bool created = catalog == null;

    if (created)
    {
        catalog = ScriptableObject.CreateInstance<TutorialMessageCatalog>();
        AssetDatabase.CreateAsset(catalog, CatalogPath);
    }

    SerializedObject serializedCatalog = new SerializedObject(catalog);
    SerializedProperty entries = serializedCatalog.FindProperty("entries");
    if (entries.arraySize == 0)
    {
        AddCatalogEntry(entries, "TUTORIAL_MOVE_001", "이동", "WASD 키를 사용하여 캐릭터를 이동할 수 있습니다.", true);
        AddCatalogEntry(entries, "TUTORIAL_INTERACT_001", "상호작용", "상호작용 키를 눌러 주변 오브젝트를 조사할 수 있습니다.", true);
        AddCatalogEntry(entries, "TUTORIAL_ITEM_001", "아이템 획득", "아이템을 획득하고 인벤토리와 퀵슬롯에서 확인해 보세요.", true);
        AddCatalogEntry(entries, "TUTORIAL_ATTACK_001", "기본 공격", "조준한 방향으로 기본 공격을 사용해 훈련용 에너미를 공격하세요.", true);
        AddCatalogEntry(entries, "TUTORIAL_SKILL_001", "프리즘 유탄", "스킬 키를 눌러 프리즘 유탄을 투척할 수 있습니다.", true);
        AddCatalogEntry(entries, "TUTORIAL_ESCAPE_001", "탈출", "탈출 지점에서 상호작용하고 채널링이 끝날 때까지 기다리세요.", true);
        serializedCatalog.ApplyModifiedPropertiesWithoutUndo();
        EditorUtility.SetDirty(catalog);
    }

    return catalog;
}

private static void AddCatalogEntry(
    SerializedProperty entries,
    string tutorialId,
    string title,
    string message,
    bool pauseGame)
{
    int index = entries.arraySize;
    entries.InsertArrayElementAtIndex(index);
    SerializedProperty entry = entries.GetArrayElementAtIndex(index);
```

```cs
    entry.FindPropertyRelative("tutorialId").stringValue = tutorialId;
    entry.FindPropertyRelative("title").stringValue = title;
    entry.FindPropertyRelative("message").stringValue = message;
    entry.FindPropertyRelative("confirmText").stringValue = "확인";
    entry.FindPropertyRelative("pauseGame").boolValue = pauseGame;
}

private static void CreateSystemPrefab(TutorialMessageCatalog catalog)
{
    GameObject root = new GameObject("TutorialSystem");
    TutorialManager manager = root.AddComponent<TutorialManager>();

    GameObject canvasObject = new GameObject(
        "TutorialCanvas",
        typeof(RectTransform),
        typeof(Canvas),
        typeof(CanvasScaler),
        typeof(GraphicRaycaster));
    canvasObject.transform.SetParent(root.transform, false);
    Canvas canvas = canvasObject.GetComponent<Canvas>();
    canvas.renderMode = RenderMode.ScreenSpaceOverlay;
    canvas.overrideSorting = true;
    canvas.sortingOrder = 5000;

    CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
    scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
    scaler.referenceResolution = new Vector2(1920f, 1080f);
    scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
    scaler.matchWidthOrHeight = 0.5f;

    GameObject panel = CreateUIObject("TutorialPopup", canvasObject.transform);
    RectTransform panelRect = panel.GetComponent<RectTransform>();
    panelRect.anchorMin = new Vector2(0.5f, 1f);
    panelRect.anchorMax = new Vector2(0.5f, 1f);
    panelRect.pivot = new Vector2(0.5f, 1f);
```

```cs
panelRect.anchoredPosition = new Vector2(0f, -56f);
panelRect.sizeDelta = new Vector2(920f, 230f);

Image background = panel.AddComponent<Image>();
background.color = new Color(0.055f, 0.035f, 0.12f, 0.94f);
CanvasGroup canvasGroup = panel.AddComponent<CanvasGroup>();
TutorialPopup popup = panel.AddComponent<TutorialPopup>();

TMP_Text titleText = CreateText(
    "TitleText",
    panel.transform,
    new Vector2(0f, 0.68f),
    new Vector2(1f, 1f),
    new Vector2(28f, -10f),
    new Vector2(-28f, -12f),
    36f,
    FontStyles.Bold,
    TextAlignmentOptions.Center);
titleText.text = "이동";
titleText.color = new Color(0.72f, 0.58f, 1f, 1f);

TMP_Text messageText = CreateText(
    "MessageText",
    panel.transform,
    new Vector2(0f, 0.28f),
    new Vector2(1f, 0.68f),
    new Vector2(42f, 0f),
    new Vector2(-42f, 0f),
    27f,
    FontStyles.Normal,
    TextAlignmentOptions.Center);
messageText.text = "WASD 키를 사용하여 캐릭터를 이동할 수 있습니다.";
messageText.color = Color.white;

GameObject buttonObject = CreateUIObject("ConfirmButton", panel.transform);
RectTransform buttonRect = buttonObject.GetComponent<RectTransform>();
buttonRect.anchorMin = new Vector2(0.5f, 0f);
buttonRect.anchorMax = new Vector2(0.5f, 0f);
buttonRect.pivot = new Vector2(0.5f, 0f);
buttonRect.anchoredPosition = new Vector2(0f, 18f);
buttonRect.sizeDelta = new Vector2(180f, 52f);
```

```cs
    Image buttonImage = buttonObject.AddComponent<Image>();
    buttonImage.color = new Color(0.38f, 0.16f, 0.68f, 1f);
    Button button = buttonObject.AddComponent<Button>();
    ColorBlock colors = button.colors;
    colors.highlightedColor = new Color(0.52f, 0.27f, 0.84f, 1f);
    colors.pressedColor = new Color(0.28f, 0.1f, 0.52f, 1f);
    button.colors = colors;

    TMP_Text confirmText = CreateText(
        "ConfirmText",
        buttonObject.transform,
        Vector2.zero,
        Vector2.one,
        new Vector2(8f, 4f),
        new Vector2(-8f, -4f),
        23f,
        FontStyles.Bold,
        TextAlignmentOptions.Center);
    confirmText.text = "확인";

    SerializedObject popupObject = new SerializedObject(popup);
    SetObjectReference(popupObject, "canvasGroup", canvasGroup);
    SetObjectReference(popupObject, "titleText", titleText);
    SetObjectReference(popupObject, "messageText", messageText);
    SetObjectReference(popupObject, "confirmText", confirmText);
    SetObjectReference(popupObject, "confirmButton", button);
    popupObject.ApplyModifiedPropertiesWithoutUndo();

    SerializedObject managerObject = new SerializedObject(manager);
    SetObjectReference(managerObject, "catalog", catalog);
    SetObjectReference(managerObject, "popup", popup);
    managerObject.ApplyModifiedPropertiesWithoutUndo();

    SetLayerRecursively(canvasObject, LayerMask.NameToLayer("UI"));
    panel.SetActive(false);
    PrefabUtility.SaveAsPrefabAsset(root, SystemPrefabPath);
    Object.DestroyImmediate(root);
}
```

```cs
private static void CreateTriggerPrefab()
{
    GameObject root = new GameObject("TutorialTrigger");
    BoxCollider collider = root.AddComponent<BoxCollider>();
    collider.isTrigger = true;
    collider.size = new Vector3(4f, 2f, 1f);
    TutorialTrigger trigger = root.AddComponent<TutorialTrigger>();

    SerializedObject triggerObject = new SerializedObject(trigger);
    triggerObject.FindProperty("tutorialId").stringValue = "TUTORIAL_MOVE_001";
    triggerObject.FindProperty("triggerOnce").boolValue = true;
    triggerObject.ApplyModifiedPropertiesWithoutUndo();

    PrefabUtility.SaveAsPrefabAsset(root, TriggerPrefabPath);
    Object.DestroyImmediate(root);
}

private static void PlacePrefabsInTutorialScene()
{
    Scene scene = SceneManager.GetSceneByPath(TutorialScenePath);
    bool openedForBuild = !scene.IsValid() || !scene.isLoaded;
    if (openedForBuild)
        scene = EditorSceneManager.OpenScene(TutorialScenePath, OpenSceneMode.Additive);

    if (FindTransform(scene, "TutorialSystem") == null)
    {
        GameObject systemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
        PrefabUtility.InstantiatePrefab(systemPrefab, scene);
    }

    Transform triggerGroup = FindTransform(scene, "TutorialTriggers");
    if (triggerGroup == null)
    {
        GameObject groupObject = new GameObject("TutorialTriggers");
        SceneManager.MoveGameObjectToScene(groupObject, scene);
        triggerGroup = groupObject.transform;
    }

    if (FindTransform(scene, "Trigger_Move") == null)
    {
```

```cs
        GameObject triggerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(TriggerPrefabPath);
        GameObject triggerObject = (GameObject)PrefabUtility.InstantiatePrefab(triggerPrefab, triggerGroup);
        triggerObject.name = "Trigger_Move";

        Transform spawnPoint = FindTransform(scene, "PlayerSpawnPoint");
        triggerObject.transform.position = spawnPoint != null
            ? spawnPoint.position + spawnPoint.forward * 4f + Vector3.up
            : Vector3.up;
        triggerObject.transform.rotation = spawnPoint != null ? spawnPoint.rotation : Quaternion.identity;
    }

    EditorSceneManager.MarkSceneDirty(scene);
    EditorSceneManager.SaveScene(scene);

    if (openedForBuild)
        EditorSceneManager.CloseScene(scene, true);
}

private static TMP_Text CreateText(
    string name,
    Transform parent,
    Vector2 anchorMin,
    Vector2 anchorMax,
    Vector2 offsetMin,
    Vector2 offsetMax,
    float fontSize,
    FontStyles fontStyle,
    TextAlignmentOptions alignment)
{
    GameObject textObject = CreateUIObject(name, parent);
    RectTransform rect = textObject.GetComponent<RectTransform>();
    rect.anchorMin = anchorMin;
    rect.anchorMax = anchorMax;
    rect.offsetMin = offsetMin;
    rect.offsetMax = offsetMax;

    TextMeshProUGUI text = textObject.AddComponent<TextMeshProUGUI>();
    text.fontSize = fontSize;
    text.fontStyle = fontStyle;
    text.alignment = alignment;
    text.enableWordWrapping = true;
    text.raycastTarget = false;
```

```cs
    if (TMP_Settings.defaultFontAsset != null)
        text.font = TMP_Settings.defaultFontAsset;
    return text;
}

private static GameObject CreateUIObject(string name, Transform parent)
{
    GameObject created = new GameObject(name, typeof(RectTransform));
    created.transform.SetParent(parent, false);
    return created;
}

private static void SetObjectReference(SerializedObject serializedObject, string propertyName, Object value)
{
    serializedObject.FindProperty(propertyName).objectReferenceValue = value;
}

private static Transform FindTransform(Scene scene, string objectName)
{
    foreach (GameObject root in scene.GetRootGameObjects())
    {
        Transform match = root.GetComponentsInChildren<Transform>(true)
            .FirstOrDefault(candidate => candidate.name == objectName);
        if (match != null)
            return match;
    }

    return null;
}

private static void AddTutorialSceneToBuildSettings()
{
    List<EditorBuildSettingsScene> scenes = EditorBuildSettings.scenes.ToList();
    if (scenes.All(scene => scene.path != TutorialScenePath))
    {
        scenes.Add(new EditorBuildSettingsScene(TutorialScenePath, true));
        EditorBuildSettings.scenes = scenes.ToArray();
    }
}

private static void SetLayerRecursively(GameObject root, int layer)
{
    if (layer < 0)
        return;

    root.layer = layer;
    foreach (Transform child in root.transform)
        SetLayerRecursively(child.gameObject, layer);
}

private static void EnsureFolder(string folderPath)
{
```

```cs
        string[] parts = folderPath.Split('/');
        string current = parts[0];
        for (int i = 1; i < parts.Length; i++)
        {
            string next = current + "/" + parts[i];
            if (!AssetDatabase.IsValidFolder(next))
                AssetDatabase.CreateFolder(current, parts[i]);
            current = next;
        }
    }
}
```

## 2. 변경 설명

튜토리얼 프리팹을 만들 때 기존 프리팹을 무조건 재생성하지 않도록 흐름을 변경했습니다. 기존 인스펙터 배치값을 보존한 채 TutorialHighlightPrefabSetup을 호출해 필요한 하이라이트 구조만 동기화합니다.

## 3. 현재 스크립트 전체

- 기준: <code>9d7af9e</code>
- 파일: <code>Assets/Editor/TutorialPrefabBuilder.cs</code>

```cs
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// 튜토리얼 시스템과 트리거 프리팹을 생성하고 TutorialScene에 기본 이동 트리거를 배치합니다.
/// </summary>
public static class TutorialPrefabBuilder
{
    private const string PrefabFolder = "Assets/03_PreFabs/Tutorial";
    private const string SystemPrefabPath = PrefabFolder + "/TutorialSystem.prefab";
    private const string TriggerPrefabPath = PrefabFolder + "/TutorialTrigger.prefab";
    private const string CatalogFolder = "Assets/Resources/Tutorial";
    private const string CatalogPath = CatalogFolder + "/TutorialMessageCatalog.asset";
    private const string TutorialScenePath = "Assets/01_Scenes/TutorialScene.unity";

    [MenuItem("Tools/Lucid Diver/Tutorial/Build Tutorial Prefabs and Scene")]
    public static void BuildTutorialAssets()
    {
        EnsureFolder(PrefabFolder);
        EnsureFolder(CatalogFolder);

        TutorialMessageCatalog catalog = CreateCatalogIfNeeded();
        CreateSystemPrefab(catalog);
        TutorialHighlightPrefabSetup.ApplyAll();
        CreateTriggerPrefab();
        PlacePrefabsInTutorialScene();
        AddTutorialSceneToBuildSettings();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        GameObject systemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
        Selection.activeObject = systemPrefab;
        EditorGUIUtility.PingObject(systemPrefab);
        Debug.Log("[TutorialBuilder] TutorialSystem/Trigger 프리팹과 TutorialScene 기본 배치를 완료했습니다.");
    }
```

```cs
private static TutorialMessageCatalog CreateCatalogIfNeeded()
{
    TutorialMessageCatalog catalog = AssetDatabase.LoadAssetAtPath<TutorialMessageCatalog>(CatalogPath);
    bool created = catalog == null;

    if (created)
    {
        catalog = ScriptableObject.CreateInstance<TutorialMessageCatalog>();
        AssetDatabase.CreateAsset(catalog, CatalogPath);
    }

    SerializedObject serializedCatalog = new SerializedObject(catalog);
    SerializedProperty entries = serializedCatalog.FindProperty("entries");
    if (entries.arraySize == 0)
    {
        AddCatalogEntry(entries, "TUTORIAL_MOVE_001", "이동", "WASD 키를 사용하여 캐릭터를 이동할 수 있습니다.", true);
        AddCatalogEntry(entries, "TUTORIAL_INTERACT_001", "상호작용", "상호작용 키를 눌러 주변 오브젝트를 조사할 수 있습니다.", true);
        AddCatalogEntry(entries, "TUTORIAL_ITEM_001", "아이템 획득", "아이템을 획득하고 인벤토리와 퀵슬롯에서 확인해 보세요.", true);
        AddCatalogEntry(entries, "TUTORIAL_ATTACK_001", "기본 공격", "조준한 방향으로 기본 공격을 사용해 훈련용 에너미를 공격하세요.", true);
        AddCatalogEntry(entries, "TUTORIAL_SKILL_001", "프리즘 유탄", "스킬 키를 눌러 프리즘 유탄을 투척할 수 있습니다.", true);
        AddCatalogEntry(entries, "TUTORIAL_ESCAPE_001", "탈출", "탈출 지점에서 상호작용하고 채널링이 끝날 때까지 기다리세요.", true);
        serializedCatalog.ApplyModifiedPropertiesWithoutUndo();
        EditorUtility.SetDirty(catalog);
    }

    return catalog;
}

private static void AddCatalogEntry(
    SerializedProperty entries,
    string tutorialId,
    string title,
    string message,
    bool pauseGame)
{
    int index = entries.arraySize;
    entries.InsertArrayElementAtIndex(index);
```

```cs
    SerializedProperty entry = entries.GetArrayElementAtIndex(index);
    entry.FindPropertyRelative("tutorialId").stringValue = tutorialId;
    entry.FindPropertyRelative("title").stringValue = title;
    entry.FindPropertyRelative("message").stringValue = message;
    entry.FindPropertyRelative("confirmText").stringValue = "확인";
    entry.FindPropertyRelative("pauseGame").boolValue = pauseGame;
}

private static void CreateSystemPrefab(TutorialMessageCatalog catalog)
{
    // 이미 구성된 프리팹은 새로 만들지 않고 필수 참조만 보강합니다.
    // 기존 방식으로 덮어쓰면 인스펙터에서 조정한 분리 패널과 레이아웃이 사라질 수 있습니다.
    GameObject existingPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
    if (existingPrefab != null)
    {
        GameObject prefabContents = PrefabUtility.LoadPrefabContents(SystemPrefabPath);

        try
        {
            TutorialManager existingManager = prefabContents.GetComponent<TutorialManager>();
            TutorialPopup existingPopup = prefabContents.GetComponentInChildren<TutorialPopup>(true);
            if (existingManager == null || existingPopup == null)
            {
                Debug.LogError("[TutorialBuilder] 기존 TutorialSystem 프리팹의 필수 컴포넌트를 찾지 못해 덮어쓰기를 중단합니다.");
                return;
            }

            SerializedObject existingManagerObject = new SerializedObject(existingManager);
            SetObjectReference(existingManagerObject, "catalog", catalog);
            SetObjectReference(existingManagerObject, "popup", existingPopup);
            existingManagerObject.ApplyModifiedPropertiesWithoutUndo();
```

```cs
        PrefabUtility.SaveAsPrefabAsset(prefabContents, SystemPrefabPath);
    }
    finally
    {
        PrefabUtility.UnloadPrefabContents(prefabContents);
    }

    return;
}

GameObject root = new GameObject("TutorialSystem");
TutorialManager manager = root.AddComponent<TutorialManager>();

GameObject canvasObject = new GameObject(
    "TutorialCanvas",
    typeof(RectTransform),
    typeof(Canvas),
    typeof(CanvasScaler),
    typeof(GraphicRaycaster));
canvasObject.transform.SetParent(root.transform, false);
Canvas canvas = canvasObject.GetComponent<Canvas>();
canvas.renderMode = RenderMode.ScreenSpaceOverlay;
canvas.overrideSorting = true;
canvas.sortingOrder = 5000;

CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
scaler.referenceResolution = new Vector2(1920f, 1080f);
scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
scaler.matchWidthOrHeight = 0.5f;

GameObject panel = CreateUIObject("TutorialPopup", canvasObject.transform);
RectTransform panelRect = panel.GetComponent<RectTransform>();
panelRect.anchorMin = new Vector2(0.5f, 1f);
panelRect.anchorMax = new Vector2(0.5f, 1f);
panelRect.pivot = new Vector2(0.5f, 1f);
panelRect.anchoredPosition = new Vector2(0f, -56f);
panelRect.sizeDelta = new Vector2(920f, 230f);

Image background = panel.AddComponent<Image>();
```

```cs
background.color = new Color(0.055f, 0.035f, 0.12f, 0.94f);
CanvasGroup canvasGroup = panel.AddComponent<CanvasGroup>();
TutorialPopup popup = panel.AddComponent<TutorialPopup>();

TMP_Text titleText = CreateText(
    "TitleText",
    panel.transform,
    new Vector2(0f, 0.68f),
    new Vector2(1f, 1f),
    new Vector2(28f, -10f),
    new Vector2(-28f, -12f),
    36f,
    FontStyles.Bold,
    TextAlignmentOptions.Center);
titleText.text = "이동";
titleText.color = new Color(0.72f, 0.58f, 1f, 1f);

TMP_Text messageText = CreateText(
    "MessageText",
    panel.transform,
    new Vector2(0f, 0.28f),
    new Vector2(1f, 0.68f),
    new Vector2(42f, 0f),
    new Vector2(-42f, 0f),
    27f,
    FontStyles.Normal,
    TextAlignmentOptions.Center);
messageText.text = "WASD 키를 사용하여 캐릭터를 이동할 수 있습니다.";
messageText.color = Color.white;

GameObject buttonObject = CreateUIObject("ConfirmButton", panel.transform);
RectTransform buttonRect = buttonObject.GetComponent<RectTransform>();
buttonRect.anchorMin = new Vector2(0.5f, 0f);
buttonRect.anchorMax = new Vector2(0.5f, 0f);
buttonRect.pivot = new Vector2(0.5f, 0f);
buttonRect.anchoredPosition = new Vector2(0f, 18f);
buttonRect.sizeDelta = new Vector2(180f, 52f);

Image buttonImage = buttonObject.AddComponent<Image>();
buttonImage.color = new Color(0.38f, 0.16f, 0.68f, 1f);
Button button = buttonObject.AddComponent<Button>();
```

```cs
    ColorBlock colors = button.colors;
    colors.highlightedColor = new Color(0.52f, 0.27f, 0.84f, 1f);
    colors.pressedColor = new Color(0.28f, 0.1f, 0.52f, 1f);
    button.colors = colors;

    TMP_Text confirmText = CreateText(
        "ConfirmText",
        buttonObject.transform,
        Vector2.zero,
        Vector2.one,
        new Vector2(8f, 4f),
        new Vector2(-8f, -4f),
        23f,
        FontStyles.Bold,
        TextAlignmentOptions.Center);
    confirmText.text = "확인";

    SerializedObject popupObject = new SerializedObject(popup);
    SetObjectReference(popupObject, "canvasGroup", canvasGroup);
    SetObjectReference(popupObject, "titleText", titleText);
    SetObjectReference(popupObject, "messageText", messageText);
    SetObjectReference(popupObject, "confirmText", confirmText);
    SetObjectReference(popupObject, "confirmButton", button);
    popupObject.ApplyModifiedPropertiesWithoutUndo();

    SerializedObject managerObject = new SerializedObject(manager);
    SetObjectReference(managerObject, "catalog", catalog);
    SetObjectReference(managerObject, "popup", popup);
    managerObject.ApplyModifiedPropertiesWithoutUndo();

    SetLayerRecursively(canvasObject, LayerMask.NameToLayer("UI"));
    panel.SetActive(false);
    PrefabUtility.SaveAsPrefabAsset(root, SystemPrefabPath);
    Object.DestroyImmediate(root);
}

private static void CreateTriggerPrefab()
{
    GameObject root = new GameObject("TutorialTrigger");
    BoxCollider collider = root.AddComponent<BoxCollider>();
```

```cs
    collider.isTrigger = true;
    collider.size = new Vector3(4f, 2f, 1f);
    TutorialTrigger trigger = root.AddComponent<TutorialTrigger>();

    SerializedObject triggerObject = new SerializedObject(trigger);
    triggerObject.FindProperty("tutorialId").stringValue = "TUTORIAL_MOVE_001";
    triggerObject.FindProperty("triggerOnce").boolValue = true;
    triggerObject.ApplyModifiedPropertiesWithoutUndo();

    PrefabUtility.SaveAsPrefabAsset(root, TriggerPrefabPath);
    Object.DestroyImmediate(root);
}

private static void PlacePrefabsInTutorialScene()
{
    Scene scene = SceneManager.GetSceneByPath(TutorialScenePath);
    bool openedForBuild = !scene.IsValid() || !scene.isLoaded;
    if (openedForBuild)
        scene = EditorSceneManager.OpenScene(TutorialScenePath, OpenSceneMode.Additive);

    if (FindTransform(scene, "TutorialSystem") == null)
    {
        GameObject systemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
        PrefabUtility.InstantiatePrefab(systemPrefab, scene);
    }

    Transform triggerGroup = FindTransform(scene, "TutorialTriggers");
    if (triggerGroup == null)
    {
        GameObject groupObject = new GameObject("TutorialTriggers");
        SceneManager.MoveGameObjectToScene(groupObject, scene);
        triggerGroup = groupObject.transform;
    }

    if (FindTransform(scene, "Trigger_Move") == null)
    {
        GameObject triggerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(TriggerPrefabPath);
```

```cs
        GameObject triggerObject = (GameObject)PrefabUtility.InstantiatePrefab(triggerPrefab, triggerGroup);
        triggerObject.name = "Trigger_Move";

        Transform spawnPoint = FindTransform(scene, "PlayerSpawnPoint");
        triggerObject.transform.position = spawnPoint != null
            ? spawnPoint.position + spawnPoint.forward * 4f + Vector3.up
            : Vector3.up;
        triggerObject.transform.rotation = spawnPoint != null ? spawnPoint.rotation : Quaternion.identity;
    }

    EditorSceneManager.MarkSceneDirty(scene);
    EditorSceneManager.SaveScene(scene);

    if (openedForBuild)
        EditorSceneManager.CloseScene(scene, true);
}

private static TMP_Text CreateText(
    string name,
    Transform parent,
    Vector2 anchorMin,
    Vector2 anchorMax,
    Vector2 offsetMin,
    Vector2 offsetMax,
    float fontSize,
    FontStyles fontStyle,
    TextAlignmentOptions alignment)
{
    GameObject textObject = CreateUIObject(name, parent);
    RectTransform rect = textObject.GetComponent<RectTransform>();
    rect.anchorMin = anchorMin;
    rect.anchorMax = anchorMax;
    rect.offsetMin = offsetMin;
    rect.offsetMax = offsetMax;

    TextMeshProUGUI text = textObject.AddComponent<TextMeshProUGUI>();
    text.fontSize = fontSize;
    text.fontStyle = fontStyle;
    text.alignment = alignment;
    text.enableWordWrapping = true;
    text.raycastTarget = false;
    if (TMP_Settings.defaultFontAsset != null)
        text.font = TMP_Settings.defaultFontAsset;
    return text;
}
```

```cs
private static GameObject CreateUIObject(string name, Transform parent)
{
    GameObject created = new GameObject(name, typeof(RectTransform));
    created.transform.SetParent(parent, false);
    return created;
}

private static void SetObjectReference(SerializedObject serializedObject, string propertyName, Object value)
{
    serializedObject.FindProperty(propertyName).objectReferenceValue = value;
}

private static Transform FindTransform(Scene scene, string objectName)
{
    foreach (GameObject root in scene.GetRootGameObjects())
    {
        Transform match = root.GetComponentsInChildren<Transform>(true)
            .FirstOrDefault(candidate => candidate.name == objectName);
        if (match != null)
            return match;
    }

    return null;
}

private static void AddTutorialSceneToBuildSettings()
{
    List<EditorBuildSettingsScene> scenes = EditorBuildSettings.scenes.ToList();
    if (scenes.All(scene => scene.path != TutorialScenePath))
    {
        scenes.Add(new EditorBuildSettingsScene(TutorialScenePath, true));
        EditorBuildSettings.scenes = scenes.ToArray();
    }
}

private static void SetLayerRecursively(GameObject root, int layer)
{
    if (layer < 0)
        return;

    root.layer = layer;
    foreach (Transform child in root.transform)
        SetLayerRecursively(child.gameObject, layer);
}

private static void EnsureFolder(string folderPath)
{
    string[] parts = folderPath.Split('/');
    string current = parts[0];
    for (int i = 1; i < parts.Length; i++)
```

```cs
        {
            string next = current + "/" + parts[i];
            if (!AssetDatabase.IsValidFolder(next))
                AssetDatabase.CreateFolder(current, parts[i]);
            current = next;
        }
    }
}
```
{% endraw %}
