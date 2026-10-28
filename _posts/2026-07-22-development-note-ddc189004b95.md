---
title: "2026-07-22_UIManager_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Manager/Manager/UIManager.cs cs using System; using System.Collections.Generic; using UnityEngine; /// /// 게임 내 "
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Manager/Manager/UIManager.cs cs using System; using System.Collections.Generic; using UnityEngine; /// /// 게임 내 "
published: true
migration_id: "3a536532580e81e2969addc189004b95"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/Manager/Manager/UIManager.cs</code>

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 게임 내 UI 프리팹을 생성, 캐싱, 열기, 닫기 처리하는 매니저입니다.
/// 씬 전환 또는 Additive 씬 로드 중 UIManager가 중복 생성될 수 있습니다.
/// 이 경우 중복 매니저의 UI 프리팹 등록값만 기존 매니저에 병합하고 중복 오브젝트는 제거합니다.
/// </summary>
public class UIManager : MonoBehaviour
{
    private static UIManager instance;

    // 파괴된 static 참조가 남았을 때 로드된 씬에서 살아있는 UIManager를 다시 찾아 복구합니다.
    public static UIManager Instance
    {
        get
        {
            if (instance == null)
            {
#if UNITY_2023_1_OR_NEWER
                instance = FindFirstObjectByType<UIManager>();
#else
                instance = FindObjectOfType<UIManager>();
#endif
            }

            return instance;
        }
        private set => instance = value;
    }

    [Header("UI Prefab Registry")]
    [SerializeField] private List<GameObject> uiPrefabs = new();

    private readonly Dictionary<Type, MonoBehaviour> uiInstances = new();
    private readonly Stack<MonoBehaviour> uiStack = new();

    private void Awake()
    {
        UIManager currentInstance = Instance;
        if(currentInstance != null && currentInstance != this)
        {
            // Additive 씬 로드로 중복 UIManager가 생성되면 프리팹 등록값만 병합하고 중복 오브젝트는 제거합니다.
            currentInstance.MergePrefabsFrom(uiPrefabs);
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 UIManager 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GlobalEventBus.OnCloseTopUI += CloseNowUI;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnCloseTopUI -= CloseNowUI;
    }

    private void OnDestroy()
    {
        // 자기 자신이 싱글톤 참조라면 파괴 시점에 참조를 비워 다음 접근 때 다시 찾을 수 있게 합니다.
        if(instance == this)
            instance = null;
    }

    /// <summary>
    /// 지정한 타입의 UI를 열고 화면 최상단에 배치합니다.
    /// </summary>
    public UiType Open<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return null;

        UiType ui = GetOrCreate<UiType>();
        if (ui == null) return null;

        ui.gameObject.SetActive(true);
        ui.transform.SetAsLastSibling();

        if (!uiStack.Contains(ui)) uiStack.Push(ui);

        return ui;
    }

    /// <summary>
    /// 지정한 타입의 UI를 닫습니다.
    /// </summary>
    public void Close<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return;

        if(!uiInstances.TryGetValue(typeof(UiType), out var ui) || ui == null) return;

        ui.gameObject.SetActive(false);
        if(uiStack.Contains(ui)) RemoveFromStack(ui);
    }

    /// <summary>
    /// 가장 최근에 열린 UI를 닫습니다.
    /// </summary>
    public void CloseNowUI()
    {
        if(this == null)
            return;

        if (uiStack.TryPop(out MonoBehaviour topUI))
        {
            if(topUI != null)
                topUI.gameObject.SetActive(false);
        }
        else
        {
            Debug.LogWarning("현재 닫을 UI가 없습니다.");
        }
    }

    /// <summary>
    /// 스택의 최상단 UI를 반환합니다.
    /// </summary>
    public MonoBehaviour GetTopUI()
    {
        if (this == null)
            return null;

        if (uiStack.TryPeek(out MonoBehaviour topUI))
            return topUI;
            
        return null;
    }

    /// <summary>
    /// 캐시된 UI를 반환하거나, 등록된 프리팹에서 찾아 새로 생성합니다.
    /// </summary>
    private UiType GetOrCreate<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return null;

        if(uiInstances.TryGetValue(typeof(UiType), out var cached) && cached != null)
            return (UiType)cached;

        foreach(var prefab in uiPrefabs)
        {
            if(prefab != null && prefab.TryGetComponent<UiType>(out _))
            {
                UiType ui = Instantiate(prefab, transform).GetComponent<UiType>();
                uiInstances[typeof(UiType)] = ui;
                return ui;
            }
        }

        Debug.LogError($"UIManager: UI 프리팹이 등록되지 않았습니다. ({typeof(UiType).Name}) / 등록 수: {uiPrefabs.Count}", this);
        return null;
    }

    /// <summary>
    /// 중복 UIManager가 가진 UI 프리팹 등록값을 현재 싱글톤 매니저에 병합합니다.
    /// </summary>
    private void MergePrefabsFrom(IEnumerable<GameObject> prefabs)
    {
        if(prefabs == null) return;

        foreach(GameObject prefab in prefabs)
        {
            if(prefab == null || uiPrefabs.Contains(prefab)) continue;

            uiPrefabs.Add(prefab);
        }
    }

    /// <summary>
    /// UI 스택에서 특정 UI만 제거합니다.
    /// </summary>
    private void RemoveFromStack(MonoBehaviour ui)
    {
        var temp = new List<MonoBehaviour>(uiStack);
        temp.Remove(ui);

        uiStack.Clear();
        for(int i = 0 ; i < temp.Count ; i++)
            uiStack.Push(temp[i]);
    }
}
```

## 2. 변경 설명

팝업 재오픈 시 스택 순서를 실제 화면 순서와 맞추고, 스택에 넣지 않는 Root UI 열기, UI 활성 상태 조회, Raycast 제어, 인게임 세션 UI 일괄 정리를 추가했습니다. 스택에서 항목을 제거할 때 기존 순서를 보존하도록 역순 재구성도 수정했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/Manager/Manager/UIManager.cs</code>

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 게임 내 UI 프리팹을 생성, 캐싱, 열기, 닫기 처리하는 매니저입니다.
/// 씬 전환 또는 Additive 씬 로드 중 UIManager가 중복 생성될 수 있습니다.
/// 이 경우 중복 매니저의 UI 프리팹 등록값만 기존 매니저에 병합하고 중복 오브젝트는 제거합니다.
/// </summary>
public class UIManager : MonoBehaviour
{
    private static UIManager instance;

    // 파괴된 static 참조가 남았을 때 로드된 씬에서 살아있는 UIManager를 다시 찾아 복구합니다.
    public static UIManager Instance
    {
        get
        {
            if (instance == null)
            {
#if UNITY_2023_1_OR_NEWER
                instance = FindFirstObjectByType<UIManager>();
#else
                instance = FindObjectOfType<UIManager>();
#endif
            }

            return instance;
        }
        private set => instance = value;
    }

    [Header("UI Prefab Registry")]
    [SerializeField] private List<GameObject> uiPrefabs = new();

    private readonly Dictionary<Type, MonoBehaviour> uiInstances = new();
    private readonly Stack<MonoBehaviour> uiStack = new();

    private void Awake()
    {
        UIManager currentInstance = Instance;
        if(currentInstance != null && currentInstance != this)
        {
            // Additive 씬 로드로 중복 UIManager가 생성되면 프리팹 등록값만 병합하고 중복 오브젝트는 제거합니다.
            currentInstance.MergePrefabsFrom(uiPrefabs);
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 UIManager 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GlobalEventBus.OnCloseTopUI += CloseNowUI;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnCloseTopUI -= CloseNowUI;
    }

    private void OnDestroy()
    {
        // 자기 자신이 싱글톤 참조라면 파괴 시점에 참조를 비워 다음 접근 때 다시 찾을 수 있게 합니다.
        if(instance == this)
            instance = null;
    }

    /// <summary>
    /// 지정한 타입의 UI를 열고 화면 최상단에 배치합니다.
    /// </summary>
    public UiType Open<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return null;

        UiType ui = GetOrCreate<UiType>();
        if (ui == null) return null;

        ui.gameObject.SetActive(true);
        ui.transform.SetAsLastSibling();

        // 이미 열려 있던 UI를 다시 앞으로 가져온 경우 화면 순서와 스택 순서도 함께 맞춥니다.
        if (uiStack.Contains(ui))
            RemoveFromStack(ui);

        uiStack.Push(ui);

        return ui;
    }

    /// <summary>
    /// HUD처럼 항상 바닥에 유지할 UI를 팝업 스택에 넣지 않고 엽니다.
    /// </summary>
    public UiType OpenRoot<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return null;

        UiType ui = GetOrCreate<UiType>();
        if (ui == null) return null;

        ui.gameObject.SetActive(true);
        ui.transform.SetAsFirstSibling();

        if (uiStack.Contains(ui))
            RemoveFromStack(ui);

        return ui;
    }

    /// <summary>
    /// 지정한 타입의 UI를 닫습니다.
    /// </summary>
    public void Close<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return;

        if(!uiInstances.TryGetValue(typeof(UiType), out var ui) || ui == null) return;

        ui.gameObject.SetActive(false);
        if(uiStack.Contains(ui)) RemoveFromStack(ui);
    }

    /// <summary>
    /// 가장 최근에 열린 UI를 닫습니다.
    /// </summary>
    public void CloseNowUI()
    {
        if(this == null)
            return;

        if (uiStack.TryPop(out MonoBehaviour topUI))
        {
            if(topUI != null)
                topUI.gameObject.SetActive(false);
        }
        else
        {
            Debug.LogWarning("현재 닫을 UI가 없습니다.");
        }
    }

    /// <summary>
    /// 지정한 UI가 현재 생성되어 있고 활성화된 상태인지 확인합니다.
    /// </summary>
    public bool IsOpen<UiType>() where UiType: MonoBehaviour
    {
        return uiInstances.TryGetValue(typeof(UiType), out MonoBehaviour ui) &&
               ui != null &&
               ui.gameObject.activeInHierarchy;
    }

    /// <summary>
    /// 지정한 UI의 렌더링은 유지하면서 마우스 포인터 이벤트만 허용하거나 차단합니다.
    /// ESC 메뉴 아래에 남아 있는 HUD와 인벤토리가 클릭되는 것을 막는 용도입니다.
    /// </summary>
    public void SetRaycastEnabled<UiType>(bool enabled) where UiType: MonoBehaviour
    {
        if(!uiInstances.TryGetValue(typeof(UiType), out MonoBehaviour ui) || ui == null)
            return;

        GraphicRaycaster[] raycasters = ui.GetComponentsInChildren<GraphicRaycaster>(true);
        for(int i = 0; i < raycasters.Length; i++)
        {
            if(raycasters[i] != null)
                raycasters[i].enabled = enabled;
        }
    }

    /// <summary>
    /// 인게임 세션에서 사용한 UI만 비활성화하고 팝업 스택에서 제거합니다.
    /// 로비 UI 인스턴스와 캐시는 유지하여 씬 전환 후 그대로 재사용할 수 있습니다.
    /// </summary>
    public void CloseGameplaySessionUIs()
    {
        foreach(MonoBehaviour ui in uiInstances.Values)
        {
            if(ui == null || !IsGameplaySessionUI(ui))
                continue;

            ui.gameObject.SetActive(false);
        }

        var remaining = new List<MonoBehaviour>();
        foreach(MonoBehaviour ui in uiStack)
        {
            if(ui == null || !ui.gameObject.activeInHierarchy || IsGameplaySessionUI(ui))
                continue;

            remaining.Add(ui);
        }

        uiStack.Clear();
        for(int i = remaining.Count - 1; i >= 0; i--)
            uiStack.Push(remaining[i]);
    }

    /// <summary>
    /// 스택의 최상단 UI를 반환합니다.
    /// </summary>
    public MonoBehaviour GetTopUI()
    {
        if (this == null)
            return null;

        if (uiStack.TryPeek(out MonoBehaviour topUI))
            return topUI;
            
        return null;
    }

    /// <summary>
    /// 캐시된 UI를 반환하거나, 등록된 프리팹에서 찾아 새로 생성합니다.
    /// </summary>
    private UiType GetOrCreate<UiType>() where UiType: MonoBehaviour
    {
        if(this == null)
            return null;

        if(uiInstances.TryGetValue(typeof(UiType), out var cached) && cached != null)
            return (UiType)cached;

        foreach(var prefab in uiPrefabs)
        {
            if(prefab != null && prefab.TryGetComponent<UiType>(out _))
            {
                UiType ui = Instantiate(prefab, transform).GetComponent<UiType>();
                uiInstances[typeof(UiType)] = ui;
                return ui;
            }
        }

        Debug.LogError($"UIManager: UI 프리팹이 등록되지 않았습니다. ({typeof(UiType).Name}) / 등록 수: {uiPrefabs.Count}", this);
        return null;
    }

    /// <summary>
    /// 중복 UIManager가 가진 UI 프리팹 등록값을 현재 싱글톤 매니저에 병합합니다.
    /// </summary>
    private void MergePrefabsFrom(IEnumerable<GameObject> prefabs)
    {
        if(prefabs == null) return;

        foreach(GameObject prefab in prefabs)
        {
            if(prefab == null || uiPrefabs.Contains(prefab)) continue;

            uiPrefabs.Add(prefab);
        }
    }

    /// <summary>
    /// UI 스택에서 특정 UI만 제거합니다.
    /// </summary>
    private void RemoveFromStack(MonoBehaviour ui)
    {
        var temp = new List<MonoBehaviour>(uiStack);
        temp.Remove(ui);

        uiStack.Clear();
        // Stack 열거 결과는 최상단부터 나오므로 역순으로 넣어 기존 스택 순서를 보존합니다.
        for(int i = temp.Count - 1 ; i >= 0 ; i--)
            uiStack.Push(temp[i]);
    }

    /// <summary>
    /// 로비 전환 시 정리해야 하는 인게임 전용 UI인지 판정합니다.
    /// </summary>
    private static bool IsGameplaySessionUI(MonoBehaviour ui)
    {
        return ui is GamePlayUI ||
               ui is InventoryUI ||
               ui is ChestUI ||
               ui is ItemTooltipUI ||
               ui is InGameMenuUI ||
               ui is NoticeLobbyUI ||
               ui is SettingUI ||
               ui is ResultUI;
    }
}
```
{% endraw %}
