---
title: "2026-07-22_InGameMenuUI_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/UI/Game/InGameMenuUI.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; using "
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/UI/Game/InGameMenuUI.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; using "
published: false
migration_id: "3a536532580e8188ba75f290e2f3ded2"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/UI/Game/InGameMenuUI.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class InGameMenuUI : MonoBehaviour
{
    [Header("UI 버튼")]
    [SerializeField] Button closeButton;
    [SerializeField] Button settingButton;
    [SerializeField] Button lobbyButton;
    [SerializeField] Button exitButton;

    void OnEnable()
    {
        if(closeButton != null) closeButton.onClick.AddListener(OpenSettingUI);
        if(settingButton != null) settingButton.onClick.AddListener(OpenSettingUI);
        if(lobbyButton != null) lobbyButton.onClick.AddListener(OnLobbyButton);
        if(exitButton != null) exitButton.onClick.AddListener(ExitGame);
    } 

    void OnDisable()
    {
        if(closeButton != null) closeButton.onClick.RemoveListener(OpenSettingUI);
        if(settingButton != null) settingButton.onClick.RemoveListener(OpenSettingUI);
        if(lobbyButton != null) lobbyButton.onClick.RemoveListener(OnLobbyButton);
        if(exitButton != null) exitButton.onClick.RemoveListener(ExitGame);
    }

    /* 설정 UI 버튼 누를 시 */
    private void OpenSettingUI()
    {
        GlobalEventBus.OnOpenSettingUI?.Invoke();
    }

    /* 로비로 돌아가기 버튼 누를 시 */
    private void OnLobbyButton()
    {
        GlobalEventBus.OnOpenNoticeLobbyUI?.Invoke();
    }

    /* 게임 종료 버튼 누를 시 */
    private void ExitGame()
    {
// 유니티 에디터
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
// 실제 빌드된 게임
#else
        Application.Quit();
#endif
    }
}
```

## 2. 변경 설명

닫기(X) 버튼이 설정 UI를 여는 잘못된 연결을 제거하고 <code>OnCloseInGameMenuUI</code> 이벤트를 발행하도록 수정했습니다. Presenter가 팝업 정리와 입력 맵·커서 복구를 한 곳에서 수행하게 됩니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/UI/Game/InGameMenuUI.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class InGameMenuUI : MonoBehaviour
{
    [Header("UI 버튼")]
    [SerializeField] Button closeButton;
    [SerializeField] Button settingButton;
    [SerializeField] Button lobbyButton;
    [SerializeField] Button exitButton;

    void OnEnable()
    {
        if(closeButton != null) closeButton.onClick.AddListener(CloseMenuUI);
        if(settingButton != null) settingButton.onClick.AddListener(OpenSettingUI);
        if(lobbyButton != null) lobbyButton.onClick.AddListener(OnLobbyButton);
        if(exitButton != null) exitButton.onClick.AddListener(ExitGame);
    } 

    void OnDisable()
    {
        if(closeButton != null) closeButton.onClick.RemoveListener(CloseMenuUI);
        if(settingButton != null) settingButton.onClick.RemoveListener(OpenSettingUI);
        if(lobbyButton != null) lobbyButton.onClick.RemoveListener(OnLobbyButton);
        if(exitButton != null) exitButton.onClick.RemoveListener(ExitGame);
    }

    /* 닫기 버튼을 누르면 인게임 메뉴 닫기를 요청한다. */
    private void CloseMenuUI()
    {
        GlobalEventBus.OnCloseInGameMenuUI?.Invoke();
    }

    /* 설정 UI 버튼 누를 시 */
    private void OpenSettingUI()
    {
        GlobalEventBus.OnOpenSettingUI?.Invoke();
    }

    /* 로비로 돌아가기 버튼 누를 시 */
    private void OnLobbyButton()
    {
        GlobalEventBus.OnOpenNoticeLobbyUI?.Invoke();
    }

    /* 게임 종료 버튼 누를 시 */
    private void ExitGame()
    {
// 유니티 에디터
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
// 실제 빌드된 게임
#else
        Application.Quit();
#endif
    }
}
```
{% endraw %}
