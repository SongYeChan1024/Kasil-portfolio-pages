---
title: "2026-07-22_NoticeLobbyUI_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: dd3a3c0 파일: Assets/02_Scripts/UI/Game/NoticeLobbyUI.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; using"
description: "1. 이전 스크립트 전체 기준: dd3a3c0 파일: Assets/02_Scripts/UI/Game/NoticeLobbyUI.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; using"
published: true
migration_id: "3a536532580e81648affe60d4da4122c"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>dd3a3c0</code>
- 파일: <code>Assets/02_Scripts/UI/Game/NoticeLobbyUI.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class NoticeLobbyUI : MonoBehaviour
{
    [Header("UI 버튼")]
    [SerializeField] Button closeButton;
    [SerializeField] Button lobbyButton;

    void OnEnable()
    {
        if(closeButton != null) closeButton.onClick.AddListener(CloseNoticeUI);
        if(lobbyButton != null) lobbyButton.onClick.AddListener(GoToLobby);
    } 

    void OnDisable()
    {
        if(closeButton != null) closeButton.onClick.RemoveListener(CloseNoticeUI);
        if(lobbyButton != null) lobbyButton.onClick.RemoveListener(GoToLobby);
    }

    private void CloseNoticeUI()
    {
        GlobalEventBus.OnCloseTopUI?.Invoke();
    }

    private void GoToLobby()
    {
        GlobalEventBus.OnCloseTopUI?.Invoke();
        GlobalEventBus.OnGoToLobbyScene?.Invoke();
    }
}
```

## 2. 변경 설명

관제실 복귀 확인 시 씬 이동 이벤트를 즉시 호출하지 않고 <code>IResultService.HandleGameAbandon()</code>으로 실패 정산을 요청하도록 변경했습니다. 결과 서비스가 준비되지 않은 경우 오류를 남기고 중단해 아이템 정산 없이 로비로 이동하는 상황을 막습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/UI/Game/NoticeLobbyUI.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class NoticeLobbyUI : MonoBehaviour
{
    [Header("UI 버튼")]
    [SerializeField] Button closeButton;
    [SerializeField] Button lobbyButton;

    void OnEnable()
    {
        if(closeButton != null) closeButton.onClick.AddListener(CloseNoticeUI);
        if(lobbyButton != null) lobbyButton.onClick.AddListener(GoToLobby);
    } 

    void OnDisable()
    {
        if(closeButton != null) closeButton.onClick.RemoveListener(CloseNoticeUI);
        if(lobbyButton != null) lobbyButton.onClick.RemoveListener(GoToLobby);
    }

    private void CloseNoticeUI()
    {
        GlobalEventBus.OnCloseTopUI?.Invoke();
    }

    private void GoToLobby()
    {
        IResultService resultService = ResultServiceLocator.Instance;
        if (resultService == null)
        {
            Debug.LogError("NoticeLobbyUI: 게임 포기 결과를 처리할 ResultService가 준비되지 않았습니다.", this);
            return;
        }

        GlobalEventBus.OnCloseTopUI?.Invoke();
        // 씬을 즉시 이동하지 않고 기존 실패 정산과 결과 화면을 거친 뒤 로비 버튼에서 이동합니다.
        resultService.HandleGameAbandon();
    }
}
```
{% endraw %}
