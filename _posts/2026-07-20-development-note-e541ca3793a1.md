---
title: "2026-07-20_LocalInputReader_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/System/Player/LocalInputReader.cs cs /// /// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스 /// 'Player input'에 등록되는 모든"
description: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/System/Player/LocalInputReader.cs cs /// /// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스 /// 'Player input'에 등록되는 모든"
published: true
migration_id: "3a336532580e81d89a89e541ca3793a1"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2f085c3^</code>
- 파일: <code>Assets/02_Scripts/System/Player/LocalInputReader.cs</code>

```cs
/// <summary>
/// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스
/// 'Player input'에 등록되는 모든 메서드들이 정리되어 있습니다
/// </summary>
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class LocalInputReader : MonoBehaviour
{
    // 참조 컴포넌트
    PlayerInput playerInput;
    public event Action OnInventoryOpenRequested;
    public event Action OnInventoryCloseRequested;
    private bool isInventoryOpen;
    private bool isGameplayInputBlocked;
    public bool isSprint;

    private void Awake()
    {
        playerInput = GetComponentInParent<PlayerInput>();

        // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
        if(playerInput==null)
        {
            this.enabled = false;
            Debug.LogError("LocalInputReader: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }


    /* 액션맵을 UI 모드로 전환 */
    public void SwitchToUIMap()
    {
        // 튜토리얼/인벤토리 UI가 열릴 때 기존 이동 입력이 남아 캐릭터가 계속 움직이지 않도록 즉시 정지 값을 전달합니다.
        isSprint = false;
        GlobalEventBus.OnSprintInput?.Invoke(false);
        GlobalEventBus.OnPlayerMove?.Invoke(Vector2.zero);

        playerInput.SwitchCurrentActionMap("UI");
    }

    /* 액션맵을 플레이어 모드로 전환 */
    public void SwitchToPlayerMap()
    {
        playerInput.SwitchCurrentActionMap("Player");
    }

    public void SetGameplayInputBlocked(bool isBlocked)
    {
        isGameplayInputBlocked = isBlocked;

        // 튜토리얼 UI가 열리는 순간 남아 있던 이동/달리기 입력이 유지되지 않도록 즉시 정지시킵니다.
        if (!isBlocked)
            return;

        isSprint = false;
        GlobalEventBus.OnSprintInput?.Invoke(false);
        GlobalEventBus.OnPlayerMove?.Invoke(Vector2.zero);
    }

    public void SetInventoryOpenState(bool isOpen)
    {
```

```cs
        isInventoryOpen = isOpen;
    }
}
```

## 2. 변경 설명

현재 입력 차단 상태를 외부 시스템이 안전하게 조회할 수 있도록 공개하고, 액션 맵 전환은 중앙 InputManager 이벤트를 우선 사용하도록 복구했습니다. 중앙 관리자가 준비되지 않은 경우에만 PlayerInput 직접 전환을 fallback으로 사용하며, 누락된 맵은 경고로 처리합니다.

## 3. 현재 스크립트 전체

- 기준: <code>2f085c3</code>
- 파일: <code>Assets/02_Scripts/System/Player/LocalInputReader.cs</code>

```cs
/// <summary>
/// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스
/// 'Player input'에 등록되는 모든 메서드들이 정리되어 있습니다
/// </summary>
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class LocalInputReader : MonoBehaviour
{
    // 참조 컴포넌트
    PlayerInput playerInput;
    public event Action OnInventoryOpenRequested;
    public event Action OnInventoryCloseRequested;
    private bool isInventoryOpen;
    private bool isGameplayInputBlocked;
    public bool isSprint;
    public bool IsInventoryOpen => isInventoryOpen;
    public bool IsGameplayInputBlocked => isGameplayInputBlocked;

    private void Awake()
    {
        playerInput = GetComponentInParent<PlayerInput>();

        // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
        if(playerInput==null)
        {
            this.enabled = false;
            Debug.LogError("LocalInputReader: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }


    /* 액션맵을 UI 모드로 전환 */
    public void SwitchToUIMap()
    {
        // 튜토리얼/인벤토리 UI가 열릴 때 기존 이동 입력이 남아 캐릭터가 계속 움직이지 않도록 즉시 정지 값을 전달합니다.
        isSprint = false;
        GlobalEventBus.OnSprintInput?.Invoke(false);
        GlobalEventBus.OnPlayerMove?.Invoke(Vector2.zero);

        TrySwitchActionMap("UI");
    }

    /* 액션맵을 플레이어 모드로 전환 */
    public void SwitchToPlayerMap()
    {
        TrySwitchActionMap("Player");
    }

    /// <summary>
    /// 현재 입력을 관리하는 InputManager를 우선 사용하고, 연결되지 않은 경우에만 로컬 PlayerInput으로 전환합니다.
    /// </summary>
    private void TrySwitchActionMap(string mapName)
    {
        if (GlobalEventBus.OnSwitchInputMap != null)
        {
            GlobalEventBus.OnSwitchInputMap.Invoke(mapName);
            return;
        }
```

```cs
        // 플레이어 프리팹의 PlayerInput은 중앙 InputManager 구조에서 비활성화될 수 있으므로 안전하게 확인합니다.
        if (playerInput == null ||
            !playerInput.enabled ||
            !playerInput.gameObject.activeInHierarchy ||
            playerInput.actions == null)
        {
            Debug.LogWarning($"LocalInputReader: 입력 맵을 전환할 수 없습니다. ({mapName})", this);
            return;
        }

        InputActionMap targetMap = playerInput.actions.FindActionMap(mapName, false);
        if (targetMap == null)
        {
            Debug.LogWarning($"LocalInputReader: 입력 맵을 찾을 수 없습니다. ({mapName})", this);
            return;
        }

        if (playerInput.currentActionMap == targetMap)
            return;

        playerInput.SwitchCurrentActionMap(mapName);
    }

    public void SetGameplayInputBlocked(bool isBlocked)
    {
        isGameplayInputBlocked = isBlocked;

        // 튜토리얼 UI가 열리는 순간 남아 있던 이동/달리기 입력이 유지되지 않도록 즉시 정지시킵니다.
        if (!isBlocked)
            return;

        isSprint = false;
        GlobalEventBus.OnSprintInput?.Invoke(false);
        GlobalEventBus.OnPlayerMove?.Invoke(Vector2.zero);
    }

    public void SetInventoryOpenState(bool isOpen)
    {
        isInventoryOpen = isOpen;
    }
}
```
{% endraw %}
