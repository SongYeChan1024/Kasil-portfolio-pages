---
title: "2026-07-20_InputManager_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/Manager/Manager/InputManager.cs cs using System.Collections; using System.Collections.Generic; using UnityEngin"
description: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/Manager/Manager/InputManager.cs cs using System.Collections; using System.Collections.Generic; using UnityEngin"
published: false
migration_id: "3a336532580e81198c41c497207fb72d"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2f085c3^</code>
- 파일: <code>Assets/02_Scripts/Manager/Manager/InputManager.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;

public class InputManager : MonoBehaviour
{
    public static InputManager Instance { get; private set; }  //싱글톤 인스턴스 지정
    [SerializeField] private PlayerInput playerInput;

    private void Awake()
    {
        // 싱글톤 인스턴스 중복 방지 설정
        if (Instance != null)
        {
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 ResultManager 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }
        else
            Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GlobalEventBus.OnSwitchInputMap += SwitchInputMap;
        GlobalEventBus.OnGetInputAction += GetAction;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnSwitchInputMap -= SwitchInputMap;
        GlobalEventBus.OnGetInputAction -= GetAction;
    }

    public void SwitchInputMap(string mapName)
    {
        if (playerInput.currentActionMap != null && playerInput.currentActionMap.name == mapName) return;

        playerInput.SwitchCurrentActionMap(mapName);
        Debug.Log($"[InputManager] 조작 모드가 변경되었습니다: {mapName}");
    }

    // 다른 씬에서 특정 키(액션)를 구독할 수 있게 반환해주는 함수
    public InputAction GetAction(string mapName, string actionName)
    {
        return playerInput.actions.FindActionMap(mapName).FindAction(actionName);
    }
}
```

## 2. 변경 설명

비활성 또는 아직 준비되지 않은 PlayerInput을 직접 역참조하지 않도록 방어 로직을 추가했습니다. 액션 맵과 액션을 이름으로 찾을 때 존재 여부와 활성 상태를 확인하고, 누락 시 경고만 남겨 병합 후 참조 유실이 전체 입력 예외로 번지는 것을 막았습니다.

## 3. 현재 스크립트 전체

- 기준: <code>2f085c3</code>
- 파일: <code>Assets/02_Scripts/Manager/Manager/InputManager.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;

public class InputManager : MonoBehaviour
{
    public static InputManager Instance { get; private set; }  //싱글톤 인스턴스 지정
    [SerializeField] private PlayerInput playerInput;

    private void Awake()
    {
        // 싱글톤 인스턴스 중복 방지 설정
        if (Instance != null)
        {
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 ResultManager 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }
        else
            Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GlobalEventBus.OnSwitchInputMap += SwitchInputMap;
        GlobalEventBus.OnGetInputAction += GetAction;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnSwitchInputMap -= SwitchInputMap;
        GlobalEventBus.OnGetInputAction -= GetAction;
    }

    public void SwitchInputMap(string mapName)
    {
        if (string.IsNullOrWhiteSpace(mapName))
        {
            Debug.LogWarning("[InputManager] 전환할 입력 맵 이름이 비어 있습니다.", this);
            return;
        }

        if (!CanUsePlayerInput())
        {
            Debug.LogWarning($"[InputManager] PlayerInput이 준비되지 않아 입력 맵을 전환할 수 없습니다. ({mapName})", this);
            return;
        }

        InputActionMap targetMap = playerInput.actions.FindActionMap(mapName, false);
        if (targetMap == null)
        {
            Debug.LogWarning($"[InputManager] 입력 맵을 찾을 수 없습니다. ({mapName})", this);
            return;
        }

        if (playerInput.currentActionMap == targetMap)
            return;
```

```cs
        playerInput.SwitchCurrentActionMap(mapName);
        Debug.Log($"[InputManager] 조작 모드가 변경되었습니다: {mapName}");
    }

    // 다른 씬에서 특정 키(액션)를 구독할 수 있게 반환해주는 함수
    public InputAction GetAction(string mapName, string actionName)
    {
        if (!CanUsePlayerInput())
        {
            Debug.LogWarning("[InputManager] PlayerInput이 준비되지 않아 액션을 찾을 수 없습니다.", this);
            return null;
        }

        InputActionMap actionMap = playerInput.actions.FindActionMap(mapName, false);
        if (actionMap == null)
        {
            Debug.LogWarning($"[InputManager] 입력 맵을 찾을 수 없습니다. ({mapName})", this);
            return null;
        }

        InputAction action = actionMap.FindAction(actionName, false);
        if (action == null)
            Debug.LogWarning($"[InputManager] 입력 액션을 찾을 수 없습니다. ({mapName}/{actionName})", this);

        return action;
    }

    /// <summary>
    /// 현재 중앙 입력기가 액션 조회와 맵 전환에 사용 가능한 상태인지 확인합니다.
    /// </summary>
    private bool CanUsePlayerInput()
    {
        return playerInput != null &&
               playerInput.enabled &&
               playerInput.gameObject.activeInHierarchy &&
               playerInput.actions != null;
    }
}
```
{% endraw %}
