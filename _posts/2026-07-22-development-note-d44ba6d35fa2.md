---
title: "2026-07-22_SceneController_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Manager/Manager/SceneController.cs cs /// /// 모든 씬 전환을 관리하는 인스턴스 클래스 /// using UnityEngine; using UnityEngine.Sc"
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Manager/Manager/SceneController.cs cs /// /// 모든 씬 전환을 관리하는 인스턴스 클래스 /// using UnityEngine; using UnityEngine.Sc"
published: false
migration_id: "3a536532580e8189978cd44ba6d35fa2"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/Manager/Manager/SceneController.cs</code>

```cs
/// <summary>
/// 모든 씬 전환을 관리하는 인스턴스 클래스
/// </summary>
using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneController : MonoBehaviour
{
    public static SceneController Instance { get; private set; }

    // 로딩 후 넘어갈 씬 저장
    public SceneField TargetSceneName { get; private set; }             //기본 로딩 씬
    public SceneField TargetSceneName_additive { get; private set; }    //additive 로딩으로 덮어쓸 씬

    [Header("게임 씬 목록")]
    public SceneField lobbyScene;             //로비 허브 씬
    public SceneField tutorialScene;          //튜토리얼 레벨 씬
    public SceneField tutorialAdditiveScene;  //튜토리얼 런타임 Additive 씬
    public SceneField levelScene;             //레벨 디자인 씬
    public SceneField gameScene;              //게임플레이 씬
    public SceneField LoadScene;              //로딩 씬

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance!=null)
        {
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 SceneController 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }
        else
        {
            Instance = this;
        }
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GlobalEventBus.OnGoToLobbyScene += GoToLobbyScene;
        GlobalEventBus.OnGoToGameScene += GoToGameScene;
        GlobalEventBus.OnGoToTutorialScene += GoToTutorialScene;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnGoToLobbyScene -= GoToLobbyScene;
        GlobalEventBus.OnGoToGameScene -= GoToGameScene;
        GlobalEventBus.OnGoToTutorialScene -= GoToTutorialScene;
    }

    public void GoToLobbyScene()
    {
        SceneLoader(lobbyScene, false);
    }

    public void GoToGameScene()
    {
        SceneLoader(levelScene, true, gameScene);
    }

    public void GoToTutorialScene()
    {
        SceneLoader(tutorialScene, true, tutorialAdditiveScene);
    }

    // 씬 전환 메서드 (넘어가고 싶은 씬 이름, 로딩 씬 사용 여부(사용이 기본), 로드할 추가 씬(기본값 null))
    public void SceneLoader(SceneField scene, bool useLoadingScene = true, SceneField addScene = null)
    {
        if(scene==null)
        {
            Debug.Log($"목표하는 씬이 존재하지 않습니다");
            return;
        }
        if(LoadScene==null)
        {
            Debug.Log($"로딩 씬이 존재하지 않습니다");
            return;
        }

        // 이동 하고자 하는 씬 사전에 저장
        TargetSceneName = scene;

        // 단일 씬 이동 시 이전 additive 대상이 남지 않도록 null도 저장합니다.
        TargetSceneName_additive = addScene;

        // 로딩 씬이 요구될 경우, 로딩 씬을 Additive로 먼저 띄운 뒤 이전 씬을 비동기 언로드
        if(useLoadingScene)
        {
            // 현재 활성 씬 이름을 저장 (로딩 씬에서 비동기 언로드할 대상)
            PreviousSceneName = SceneManager.GetActiveScene().name;
            StartCoroutine(LoadLoadingSceneAdditive());
        }
        else
        {
            SceneManager.LoadScene(scene);
        }
    }

    // 이전 씬 이름 (LoadManager가 비동기 언로드할 대상)
    public string PreviousSceneName { get; private set; }

    // 로딩 씬을 Additive로 띄우는 코루틴
    private System.Collections.IEnumerator LoadLoadingSceneAdditive()
    {
        // 로딩 씬을 Additive로 로드 (이전 씬은 아직 살아있으므로 화면 끊김 없음)
        AsyncOperation loadOp = SceneManager.LoadSceneAsync(LoadScene, LoadSceneMode.Additive);
        while (!loadOp.isDone)
        {
            yield return null;
        }

        // 로딩 씬을 Active로 설정 (이후 LoadManager가 이전 씬 언로드를 진행)
        Scene loadingScene = SceneManager.GetSceneByName(LoadScene);
        SceneManager.SetActiveScene(loadingScene);
    }
}
```

## 2. 변경 설명

관제실 씬 참조와 Build Settings 로드 가능 여부를 먼저 검증하고, 전환 전에 인게임 세션 UI를 정리합니다. 입력 맵을 Lobby로 바꾸고 커서 잠금을 해제해 <code>DontDestroyOnLoad</code> UI와 입력 상태가 로비에 남지 않도록 했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/Manager/Manager/SceneController.cs</code>

```cs
/// <summary>
/// 모든 씬 전환을 관리하는 인스턴스 클래스
/// </summary>
using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneController : MonoBehaviour
{
    public static SceneController Instance { get; private set; }

    // 로딩 후 넘어갈 씬 저장
    public SceneField TargetSceneName { get; private set; }             //기본 로딩 씬
    public SceneField TargetSceneName_additive { get; private set; }    //additive 로딩으로 덮어쓸 씬

    [Header("게임 씬 목록")]
    public SceneField lobbyScene;             //로비 허브 씬
    public SceneField tutorialScene;          //튜토리얼 레벨 씬
    public SceneField tutorialAdditiveScene;  //튜토리얼 런타임 Additive 씬
    public SceneField levelScene;             //레벨 디자인 씬
    public SceneField gameScene;              //게임플레이 씬
    public SceneField LoadScene;              //로딩 씬

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance!=null)
        {
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 SceneController 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }
        else
        {
            Instance = this;
        }
        DontDestroyOnLoad(gameObject);
    }

    private void OnEnable()
    {
        GlobalEventBus.OnGoToLobbyScene += GoToLobbyScene;
        GlobalEventBus.OnGoToGameScene += GoToGameScene;
        GlobalEventBus.OnGoToTutorialScene += GoToTutorialScene;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnGoToLobbyScene -= GoToLobbyScene;
        GlobalEventBus.OnGoToGameScene -= GoToGameScene;
        GlobalEventBus.OnGoToTutorialScene -= GoToTutorialScene;
    }

    public void GoToLobbyScene()
    {
        // 참조 누락 시 현재 씬의 UI와 입력만 먼저 정리되는 상태를 방지합니다.
        if(lobbyScene == null)
        {
            Debug.Log("목표하는 씬이 존재하지 않습니다");
            return;
        }

        string lobbySceneName = lobbyScene.SceneName;
        if(string.IsNullOrWhiteSpace(lobbySceneName) || !Application.CanStreamedLevelBeLoaded(lobbySceneName))
        {
            Debug.LogError($"로비 씬을 불러올 수 없습니다. Build Settings와 씬 참조를 확인해 주세요. ({lobbySceneName})", this);
            return;
        }
        if(LoadScene == null)
        {
            Debug.Log("로딩 씬이 존재하지 않습니다");
            return;
        }

        // DontDestroyOnLoad로 유지되는 인게임 UI와 입력 상태를 로비 진입 전에 정리합니다.
        UIManager.Instance?.CloseGameplaySessionUIs();
        GlobalEventBus.OnSwitchInputMap?.Invoke("Lobby");
        GlobalEventBus.OnMouseLocked?.Invoke(false);

        SceneLoader(lobbyScene, false);
    }

    public void GoToGameScene()
    {
        SceneLoader(levelScene, true, gameScene);
    }

    public void GoToTutorialScene()
    {
        SceneLoader(tutorialScene, true, tutorialAdditiveScene);
    }

    // 씬 전환 메서드 (넘어가고 싶은 씬 이름, 로딩 씬 사용 여부(사용이 기본), 로드할 추가 씬(기본값 null))
    public void SceneLoader(SceneField scene, bool useLoadingScene = true, SceneField addScene = null)
    {
        if(scene==null)
        {
            Debug.Log($"목표하는 씬이 존재하지 않습니다");
            return;
        }
        if(LoadScene==null)
        {
            Debug.Log($"로딩 씬이 존재하지 않습니다");
            return;
        }

        // 이동 하고자 하는 씬 사전에 저장
        TargetSceneName = scene;

        // 단일 씬 이동 시 이전 additive 대상이 남지 않도록 null도 저장합니다.
        TargetSceneName_additive = addScene;

        // 로딩 씬이 요구될 경우, 로딩 씬을 Additive로 먼저 띄운 뒤 이전 씬을 비동기 언로드
        if(useLoadingScene)
        {
            // 현재 활성 씬 이름을 저장 (로딩 씬에서 비동기 언로드할 대상)
            PreviousSceneName = SceneManager.GetActiveScene().name;
            StartCoroutine(LoadLoadingSceneAdditive());
        }
        else
        {
            SceneManager.LoadScene(scene);
        }
    }

    // 이전 씬 이름 (LoadManager가 비동기 언로드할 대상)
    public string PreviousSceneName { get; private set; }

    // 로딩 씬을 Additive로 띄우는 코루틴
    private System.Collections.IEnumerator LoadLoadingSceneAdditive()
    {
        // 로딩 씬을 Additive로 로드 (이전 씬은 아직 살아있으므로 화면 끊김 없음)
        AsyncOperation loadOp = SceneManager.LoadSceneAsync(LoadScene, LoadSceneMode.Additive);
        while (!loadOp.isDone)
        {
            yield return null;
        }

        // 로딩 씬을 Active로 설정 (이후 LoadManager가 이전 씬 언로드를 진행)
        Scene loadingScene = SceneManager.GetSceneByName(LoadScene);
        SceneManager.SetActiveScene(loadingScene);
    }
}
```
{% endraw %}
