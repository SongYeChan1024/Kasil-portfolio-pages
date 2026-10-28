---
title: "2026-07-22_GameMenuUI_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/UI/Lobby/GameMenuUI.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; using U"
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/UI/Lobby/GameMenuUI.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; using U"
published: true
migration_id: "3a536532580e813c8587d7393c6fca91"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/UI/Lobby/GameMenuUI.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class GameMenuUI : MonoBehaviour
{
    [Header("UI 버튼")]
    [SerializeField] Button closeButton;
    [SerializeField] Button settingButton;
    [SerializeField] Button exitButton;

    void OnEnable()
    {
        if(closeButton != null) closeButton.onClick.AddListener(OpenSettingUI);
        if(settingButton != null) settingButton.onClick.AddListener(OpenSettingUI);
        if(exitButton != null) exitButton.onClick.AddListener(ExitGame);
    } 

    void OnDisable()
    {
        if(closeButton != null) closeButton.onClick.RemoveListener(OpenSettingUI);
        if(settingButton != null) settingButton.onClick.RemoveListener(OpenSettingUI);
        if(exitButton != null) exitButton.onClick.RemoveListener(ExitGame);
    }

    private void OpenSettingUI()
    {
        GlobalEventBus.OnOpenSettingUI?.Invoke();
    }

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

로비 메뉴의 닫기(X) 버튼이 설정 UI를 여는 연결을 제거하고 <code>OnCloseTopUI</code>로 현재 게임 메뉴만 닫도록 수정했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/UI/Lobby/GameMenuUI.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class GameMenuUI : MonoBehaviour
{
    [Header("UI 버튼")]
    [SerializeField] Button closeButton;
    [SerializeField] Button settingButton;
    [SerializeField] Button exitButton;

    void OnEnable()
    {
        if(closeButton != null) closeButton.onClick.AddListener(CloseMenuUI);
        if(settingButton != null) settingButton.onClick.AddListener(OpenSettingUI);
        if(exitButton != null) exitButton.onClick.AddListener(ExitGame);
    } 

    void OnDisable()
    {
        if(closeButton != null) closeButton.onClick.RemoveListener(CloseMenuUI);
        if(settingButton != null) settingButton.onClick.RemoveListener(OpenSettingUI);
        if(exitButton != null) exitButton.onClick.RemoveListener(ExitGame);
    }

    /* 닫기 버튼을 누르면 현재 로비 게임 메뉴만 닫는다. */
    private void CloseMenuUI()
    {
        GlobalEventBus.OnCloseTopUI?.Invoke();
    }

    private void OpenSettingUI()
    {
        GlobalEventBus.OnOpenSettingUI?.Invoke();
    }

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
