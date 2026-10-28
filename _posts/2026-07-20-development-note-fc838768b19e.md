---
title: "2026-07-20_TutorialManager_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/System/Tutorial/TutorialManager.cs cs using System; using System.Collections; using System.Collections.Generic;"
description: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/System/Tutorial/TutorialManager.cs cs using System; using System.Collections; using System.Collections.Generic;"
published: true
migration_id: "3a336532580e81fd9e02fc838768b19e"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2f085c3^</code>
- 파일: <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

/// <summary>
/// 튜토리얼 안내 데이터의 열림 조건과 클리어 조건을 해석하여 팝업 출력 흐름을 관리합니다.
/// 우선 Resources/JSON/TutorialGuide.json 데이터를 사용하고, 데이터가 없을 경우 기존 ScriptableObject 카탈로그 호출도 유지합니다.
/// </summary>
public sealed class TutorialManager : MonoBehaviour
{
    private const string CatalogResourcePath = "Tutorial/TutorialMessageCatalog";
    private const float DimmedGameplayHUDAlpha = 0.3f;
    private const float DefaultGameplayHUDAlpha = 1.0f;

    public static TutorialManager Instance { get; private set; }

    [SerializeField] private TutorialMessageCatalog catalog;
    [SerializeField] private TutorialPopup popup;

    private readonly Dictionary<int, TutorialGuideData> guideById = new();
    private readonly HashSet<int> openedGuideIds = new();
    private readonly Queue<TutorialGuideData> pendingGuides = new();

    private Action currentCompletion;
    private LocalInputReader inputReader;
    private TutorialGuideData currentGuide;
    private Coroutine durationRoutine;
    private Coroutine restoreInputRoutine;
    private float previousTimeScale = 1f;
    private bool isShowing;
    private bool pausedByTutorial;
    private bool tutorialCompletionSaved;
    private bool isRuntimeRadioShowing;
    private bool suspendedWasShowing;
    private int tutorialDeathPreventedRadioIndex;
    private Action suspendedCompletion;
    private TutorialGuideData suspendedGuide;

    public bool IsShowing => isShowing;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(this);
```

```cs
        return;
    }

    Instance = this;
    catalog ??= Resources.Load<TutorialMessageCatalog>(CatalogResourcePath);
    popup ??= GetComponentInChildren<TutorialPopup>(true);
    popup?.HideImmediate();

    LoadJsonGuides();
}

private void Start()
{
    Scene activeScene = SceneManager.GetActiveScene();
    NotifySceneLoaded(activeScene.name);
}

private void OnEnable()
{
    SceneManager.sceneLoaded += HandleSceneLoaded;
    GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;
    GlobalEventBus.OnEnemyDead += HandleEnemyDead;
    GlobalEventBus.OnEscapeRequest += HandleEscapeRequest;
    GlobalEventBus.OnMainActiveSkillCasted += HandleMainActiveSkillCasted;
}

private void OnDisable()
{
    SceneManager.sceneLoaded -= HandleSceneLoaded;
    GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;
    GlobalEventBus.OnEnemyDead -= HandleEnemyDead;
    GlobalEventBus.OnEscapeRequest -= HandleEscapeRequest;
    GlobalEventBus.OnMainActiveSkillCasted -= HandleMainActiveSkillCasted;

    if (!isShowing)
        return;

    popup?.HideImmediate();
    isShowing = false;
    currentCompletion = null;
    currentGuide = null;
    StopDurationRoutine();
    RestoreGameplay();
    SetGameplayHUDDimmed(false);
}

private void Update()
{
    TryShowPendingGuide();

    if (!isShowing || popup == null)
        return;

    if (IsConfirmInputPressed())
        popup.Confirm();
}

/// <summary>
/// 기존 TutorialTrigger나 외부 코드에서 특정 ID 팝업을 직접 요청할 때 사용하는 호환용 API입니다.
```

```cs
/// JSON 데이터가 로드된 경우에는 JSON 흐름만 사용하고, JSON 데이터가 없을 때만 기존 카탈로그를 백업으로 사용합니다.
/// </summary>
public bool Show(string tutorialId, Action completed = null)
{
    if (int.TryParse(tutorialId, out int tid) && guideById.TryGetValue(tid, out TutorialGuideData guide))
        return ShowGuide(guide, completed);

    if (guideById.Count > 0)
    {
        Debug.LogWarning($"[TutorialManager] JSON 튜토리얼 데이터가 로드되어 Catalog fallback을 사용하지 않습니다. 요청 ID={tutorialId}", this);
        return false;
    }

    if (isShowing || popup == null || catalog == null)
        return false;

    if (!catalog.TryGetEntry(tutorialId, out TutorialMessageEntry entry))
    {
        Debug.LogWarning($"[TutorialManager] 등록되지 않은 튜토리얼 ID입니다: {tutorialId}", this);
        return false;
    }

    isShowing = true;
    currentCompletion = completed;
    SetGameplayHUDDimmed(true);

    if (entry.PauseGame)
        PauseGameplay();

    popup.Show(entry, CompleteLegacyPopup);
    return true;
}

/// <summary>
/// 콜라이더 트리거 진입 조건을 튜토리얼 데이터 시스템에 전달합니다.
/// </summary>
public bool NotifyTriggerEnter(string triggerValue)
{
    bool clearedCurrent = TryClearCurrent(TutorialConditionTypes.TriggerEnter, triggerValue);
    bool openedNew = TryOpenByCondition(TutorialConditionTypes.TriggerEnter, triggerValue);
    return clearedCurrent || openedNew;
}

/// <summary>
/// 임의 이벤트 조건을 튜토리얼 데이터 시스템에 전달합니다.
/// </summary>
public bool NotifyEvent(string eventName)
{
    bool clearedCurrent = TryClearCurrent(TutorialConditionTypes.Event, eventName);
```

```cs
    bool openedNew = TryOpenByCondition(TutorialConditionTypes.Event, eventName);
    return clearedCurrent || openedNew;
}

/// <summary>
/// 튜토리얼에서 플레이어 사망을 막았을 때 출력하는 반복 가능 무전입니다.
/// JSON 진행 데이터와 분리해 HP가 1로 떨어질 때마다 번갈아 출력할 수 있게 합니다.
/// </summary>
public void ShowTutorialDeathPreventedRadio()
{
    if (popup == null || isRuntimeRadioShowing)
        return;

    string message = tutorialDeathPreventedRadioIndex % 2 == 0
        ? "\uC5D0\uB108\uBBF8\uB97C \uC8FD\uC5EC\uC57C \uD574!"
        : "\uC815\uC2E0\uCC28\uB824 \uC720\uC548!";
    tutorialDeathPreventedRadioIndex++;

    TutorialGuideData runtimeRadio = new()
    {
        TID = -9001 - tutorialDeathPreventedRadioIndex,
        ContentType = "Dialogue",
        Speaker = "Operator",
        SpeakerName = "\uAD00\uC81C\uC0AC",
        PortraitId = "Operator_Radio",
        DialogueText = message,
        Title = "\uAD00\uC81C\uC0AC",
        ConfirmText = string.Empty,
        ClearConditionType = TutorialConditionTypes.NextButton,
        ClearConditionValue = "-",
        RadioEffectId = "Radio_Default",
        PauseGame = true,
        IsTutorialAutoSkip = false
    };

    suspendedWasShowing = isShowing;
    suspendedGuide = currentGuide;
    suspendedCompletion = currentCompletion;

    isRuntimeRadioShowing = true;
    isShowing = true;
    currentGuide = runtimeRadio;
    currentCompletion = null;
    StopDurationRoutine();
    SetGameplayHUDDimmed(true);
    PauseGameplay();

    popup.Show(runtimeRadio, CompleteRuntimeRadio);
}
```

```cs
private void LoadJsonGuides()
{
    guideById.Clear();
    List<TutorialGuideData> guides = new LocalJsonTutorialGuideRepository().LoadAll();
    guides.Sort((a, b) =>
    {
        int stepCompare = a.TutorialStep.CompareTo(b.TutorialStep);
        return stepCompare != 0 ? stepCompare : a.TutorialGuideOrder.CompareTo(b.TutorialGuideOrder);
    });

    foreach (TutorialGuideData guide in guides)
    {
        if (guide == null || guide.TID <= 0 || guideById.ContainsKey(guide.TID))
            continue;

        guideById.Add(guide.TID, guide);
    }

    Debug.Log($"[TutorialManager] JSON 튜토리얼 데이터 {guideById.Count}개 로드 완료", this);
}

private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
{
    NotifySceneLoaded(scene.name);
}

private void NotifySceneLoaded(string sceneName)
{
    TryOpenByCondition(TutorialConditionTypes.SceneLoaded, sceneName);
}

private void HandleItemBoxOpened(IInteractable interactable, int playerId)
{
    if (interactable is ItemBox)
        NotifyEvent(TutorialEventNames.ItemBoxOpened);
}

private void HandleEnemyDead(int enemyId)
{
    NotifyEvent(TutorialEventNames.EnemyDead);
}

private void HandleEscapeRequest(bool success)
{
    NotifyEvent(success ? TutorialEventNames.EscapeSucceeded : TutorialEventNames.EscapeFailed);

    if (success)
        MarkTutorialCompleted();
}

private void HandleMainActiveSkillCasted()
{
    NotifyEvent(TutorialEventNames.MainActiveSkillCasted);
}

private bool TryOpenByCondition(string conditionType, string conditionValue)
```

```cs
{
    foreach (TutorialGuideData guide in guideById.Values)
    {
        if (openedGuideIds.Contains(guide.TID))
            continue;

        if (!IsConditionMatch(guide.OpenConditionType, guide.OpenConditionValue, conditionType, conditionValue))
            continue;

        RequestGuide(guide);
        return true;
    }

    return false;
}

private void RequestGuide(TutorialGuideData guide)
{
    if (guide == null)
        return;

    if (openedGuideIds.Contains(guide.TID))
        return;

    if (isShowing)
    {
        pendingGuides.Enqueue(guide);
        return;
    }

    ShowGuide(guide);
}

private void TryShowPendingGuide()
{
    if (isShowing || pendingGuides.Count == 0)
        return;

    ShowGuide(pendingGuides.Dequeue());
}

private bool ShowGuide(TutorialGuideData guide, Action completed = null)
{
    GlobalEventBus.OnMouseLocked?.Invoke(false);

    if (guide == null || isShowing || popup == null)
        return false;

    openedGuideIds.Add(guide.TID);
    currentGuide = guide;
    currentCompletion = completed;
    isShowing = true;
    SetGameplayHUDDimmed(true);

    if (guide.PauseGame)
        PauseGameplay();

    popup.Show(guide, HandlePopupConfirmed);
    StartDurationClearIfNeeded(guide);
    Debug.Log($"[TutorialManager] 안내 출력: {guide.TID} / UIHighlight={guide.UIHighlightPosition} / WorldHighlight={guide.HighlightEffectPosition}", this);
    return true;
}

private void HandlePopupConfirmed()
{
    if (ShouldDismissObjectiveOnly())
```

```cs
    {
        DismissCurrentObjectivePopup();
        return;
    }

    TryClearCurrent(TutorialConditionTypes.NextButton, string.Empty);
}

private bool ShouldDismissObjectiveOnly()
{
    if (currentGuide == null)
        return false;

    return IsSameContentType(currentGuide.ContentType, "Objective") ||
           IsSameConditionType(currentGuide.ClearConditionType, TutorialConditionTypes.Event);
}

private void DismissCurrentObjectivePopup()
{
    // ObjectivePanel의 버튼은 목표 완료가 아니라 화면에서 안내창만 접는 용도입니다.
    // 실제 완료 처리는 EnemyDead, ItemBoxOpened, EscapeSucceeded 같은 기존 이벤트 조건이 계속 담당합니다.
    popup?.HideImmediate();
    RestoreGameplay();
    SetGameplayHUDDimmed(false);
}

private bool IsConfirmInputPressed()
{
    // 관제사 무전은 화면 전체 클릭이나 단축키가 아니라, 무전 패널 자체를 눌렀을 때만 진행합니다.
    if (IsCurrentOperatorDialogue())
        return false;

    bool keyboardConfirmed = Keyboard.current != null &&
        (Keyboard.current.enterKey.wasPressedThisFrame ||
         Keyboard.current.spaceKey.wasPressedThisFrame ||
         Keyboard.current.escapeKey.wasPressedThisFrame);
    bool gamepadConfirmed = Gamepad.current != null && Gamepad.current.buttonSouth.wasPressedThisFrame;

    if (keyboardConfirmed || gamepadConfirmed)
        return true;

    // 무전/대화창은 별도 NEXT 버튼 없이 화면 클릭으로 다음 대사로 넘깁니다.
    bool dialogueClicked = currentGuide != null &&
                           IsSameContentType(currentGuide.ContentType, "Dialogue") &&
                           Mouse.current != null &&
```

```cs
                           Mouse.current.leftButton.wasPressedThisFrame;

    return dialogueClicked;
}

private bool IsCurrentOperatorDialogue()
{
    return currentGuide != null &&
           IsSameContentType(currentGuide.ContentType, "Dialogue") &&
           string.Equals(currentGuide.Speaker?.Trim(), "Operator", StringComparison.OrdinalIgnoreCase);
}

private bool TryClearCurrent(string conditionType, string conditionValue)
{
    if (!isShowing || currentGuide == null)
        return false;

    if (!IsConditionMatch(currentGuide.ClearConditionType, currentGuide.ClearConditionValue, conditionType, conditionValue))
        return false;

    CompleteCurrentGuide();
    return true;
}

private void CompleteCurrentGuide()
{
    if (!isShowing)
        return;

    TutorialGuideData completedGuide = currentGuide;
    isShowing = false;
    currentGuide = null;
    StopDurationRoutine();
    popup?.HideImmediate();
    RestoreGameplay();
    SetGameplayHUDDimmed(false);

    Action completion = currentCompletion;
    currentCompletion = null;
    completion?.Invoke();

    if (completedGuide == null)
        return;

    TryOpenByCondition(TutorialConditionTypes.PrevGuideClosed, completedGuide.TID.ToString());

    if (completedGuide.NextGuideID > 0 && guideById.TryGetValue(completedGuide.NextGuideID, out TutorialGuideData nextGuide))
        RequestGuide(nextGuide);

    // 다음 연쇄 대사가 없어 묶음이 완전히 끝났으면 커서를 다시 잠급니다.
    if (!isShowing)
    {
        GlobalEventBus.OnMouseLocked?.Invoke(true);
    }
}
```

```cs
private void CompleteLegacyPopup()
{
    if (!isShowing)
        return;

    isShowing = false;
    RestoreGameplay();
    popup?.HideImmediate();
    SetGameplayHUDDimmed(false);

    Action completion = currentCompletion;
    currentCompletion = null;
    completion?.Invoke();
}

private void CompleteRuntimeRadio()
{
    if (!isRuntimeRadioShowing)
        return;

    isRuntimeRadioShowing = false;
    RestoreGameplay();

    if (suspendedWasShowing && suspendedGuide != null)
    {
        currentGuide = suspendedGuide;
        currentCompletion = suspendedCompletion;
        isShowing = true;
        popup?.Show(currentGuide, HandlePopupConfirmed);

        if (currentGuide.PauseGame)
            PauseGameplay();
    }
    else
    {
        currentGuide = null;
        currentCompletion = null;
        isShowing = false;
        popup?.HideImmediate();
        SetGameplayHUDDimmed(false);
    }

    suspendedWasShowing = false;
    suspendedGuide = null;
    suspendedCompletion = null;
}

private void StartDurationClearIfNeeded(TutorialGuideData guide)
{
    StopDurationRoutine();

    if (!IsSameConditionType(guide.ClearConditionType, TutorialConditionTypes.Duration))
        return;

    float duration = guide.TutorialDuration > 0f ? guide.TutorialDuration : 3f;
    durationRoutine = StartCoroutine(DurationClearRoutine(duration));
}

private IEnumerator DurationClearRoutine(float duration)
{
    yield return new WaitForSecondsRealtime(duration);
```

```cs
    TryClearCurrent(TutorialConditionTypes.Duration, duration.ToString());
}

private void StopDurationRoutine()
{
    if (durationRoutine == null)
        return;

    StopCoroutine(durationRoutine);
    durationRoutine = null;
}

private static bool IsConditionMatch(string expectedType, string expectedValue, string actualType, string actualValue)
{
    if (!IsSameConditionType(expectedType, actualType))
        return false;

    if (string.IsNullOrWhiteSpace(expectedValue) || expectedValue == "-" || expectedValue == "*")
        return true;

    return string.Equals(expectedValue.Trim(), actualValue?.Trim(), StringComparison.OrdinalIgnoreCase);
}

private static bool IsSameConditionType(string a, string b)
{
    return string.Equals(NormalizeConditionType(a), NormalizeConditionType(b), StringComparison.OrdinalIgnoreCase);
}

private static string NormalizeConditionType(string conditionType)
{
    if (string.IsNullOrWhiteSpace(conditionType))
        return TutorialConditionTypes.None;

    string normalized = conditionType.Trim();

    // 엑셀 원본에서 사용하는 약식 조건명도 내부 조건명과 동일하게 처리합니다.
    if (string.Equals(normalized, "prevGuideEnd", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.PrevGuideClosed;
    if (string.Equals(normalized, "triggerEnter", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.TriggerEnter;
    if (string.Equals(normalized, "sceneLoaded", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.SceneLoaded;
```

```cs
    if (string.Equals(normalized, "nextButton", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.NextButton;
    if (string.Equals(normalized, "event", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.Event;
    if (string.Equals(normalized, "duration", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.Duration;

    return normalized;
}

private static bool IsSameContentType(string a, string b)
{
    return string.Equals(a?.Trim(), b, StringComparison.OrdinalIgnoreCase);
}

private void PauseGameplay()
{
    if (restoreInputRoutine != null)
    {
        StopCoroutine(restoreInputRoutine);
        restoreInputRoutine = null;
    }

    previousTimeScale = Time.timeScale;
    Time.timeScale = 0f;
    pausedByTutorial = true;

    inputReader = FindFirstObjectByType<LocalInputReader>();
    if (inputReader != null)
    {
        inputReader.SetGameplayInputBlocked(true);
        inputReader.SwitchToUIMap();
    }
}

private void RestoreGameplay()
{
    if (!pausedByTutorial)
        return;

    Time.timeScale = previousTimeScale;
    pausedByTutorial = false;

    if (inputReader != null)
    {
        LocalInputReader readerToRestore = inputReader;
        inputReader = null;

        // 확인 버튼을 누른 같은 프레임의 마우스/키 입력이 공격이나 이동으로 이어지지 않도록
        // 플레이어 액션맵 복귀를 한 프레임 늦춥니다.
        if (isActiveAndEnabled)
            restoreInputRoutine = StartCoroutine(RestorePlayerInputMapNextFrame(readerToRestore));
        else
```

```cs
            {
                readerToRestore.SwitchToPlayerMap();
                readerToRestore.SetGameplayInputBlocked(false);
            }
        }

        inputReader = null;
    }

    private void SetGameplayHUDDimmed(bool dimmed)
    {
        GlobalEventBus.OnGameplayHUDAlphaRequested?.Invoke(dimmed ? DimmedGameplayHUDAlpha : DefaultGameplayHUDAlpha);
    }

    private IEnumerator RestorePlayerInputMapNextFrame(LocalInputReader readerToRestore)
    {
        yield return null;

        if (readerToRestore != null)
        {
            readerToRestore.SwitchToPlayerMap();

            // NEXT/확인 클릭이 같은 프레임의 공격 입력으로 이어지지 않도록 한 프레임 더 입력 잠금을 유지합니다.
            yield return null;
            readerToRestore.SetGameplayInputBlocked(false);
        }

        restoreInputRoutine = null;
    }

    private void MarkTutorialCompleted()
    {
        if (tutorialCompletionSaved)
            return;

        tutorialCompletionSaved = true;

        PlayerSaveDataSO saveDataSO = PlayerSaveDataSO.Instance;
        PlayerSaveData saveData = saveDataSO != null
            ? saveDataSO.LoadSaveData()
            : new PlayerSaveData();

        saveData.isTutorialCompleted = true;
        saveDataSO?.SaveGameData(saveData);

        // 튜토리얼 완료 여부만 저장하고, 로비 이동은 인게임과 동일하게 ResultUI의 버튼 흐름에 맡깁니다.
    }

    private void OnDestroy()
    {
        RestoreGameplay();
        if (Instance == this)
            Instance = null;
    }
}
```

## 2. 변경 설명

튜토리얼 UI가 열린 동안 플레이어 입력을 차단하고, 확인 클릭이 닫힘 직후 게임 입력으로 관통하지 않도록 2프레임 뒤 입력을 복원했습니다. 이어서 가이드 데이터의 UI/월드 강조 위치를 TutorialHighlightController에 전달하고, 가이드 종료·Objective 전환·강제 종료 시 하이라이트를 확실히 정리하도록 생명주기를 연결했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>9d7af9e</code>
- 파일: <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

/// <summary>
/// 튜토리얼 안내 데이터의 열림 조건과 클리어 조건을 해석하여 팝업 출력 흐름을 관리합니다.
/// 우선 Resources/JSON/TutorialGuide.json 데이터를 사용하고, 데이터가 없을 경우 기존 ScriptableObject 카탈로그 호출도 유지합니다.
/// </summary>
public sealed class TutorialManager : MonoBehaviour
{
    private const string CatalogResourcePath = "Tutorial/TutorialMessageCatalog";
    private const float DimmedGameplayHUDAlpha = 0.3f;
    private const float DefaultGameplayHUDAlpha = 1.0f;

    public static TutorialManager Instance { get; private set; }

    [SerializeField] private TutorialMessageCatalog catalog;
    [SerializeField] private TutorialPopup popup;
    [SerializeField] private TutorialHighlightController highlightController;

    private readonly Dictionary<int, TutorialGuideData> guideById = new();
    private readonly HashSet<int> openedGuideIds = new();
    private readonly Queue<TutorialGuideData> pendingGuides = new();

    private Action currentCompletion;
    private LocalInputReader inputReader;
    private LocalInputReader pendingInputReader;
    private TutorialGuideData currentGuide;
    private Coroutine durationRoutine;
    private Coroutine restoreInputRoutine;
    private float previousTimeScale = 1f;
    private bool isShowing;
    private bool pausedByTutorial;
    private bool tutorialCompletionSaved;
    private bool isRuntimeRadioShowing;
    private bool suspendedWasShowing;
    private int tutorialDeathPreventedRadioIndex;
    private Action suspendedCompletion;
    private TutorialGuideData suspendedGuide;
```

```cs
public bool IsShowing => isShowing;

private void Awake()
{
    if (Instance != null && Instance != this)
    {
        Destroy(this);
        return;
    }

    Instance = this;
    catalog ??= Resources.Load<TutorialMessageCatalog>(CatalogResourcePath);
    popup ??= GetComponentInChildren<TutorialPopup>(true);
    highlightController ??= GetComponentInChildren<TutorialHighlightController>(true);
    popup?.HideImmediate();
    highlightController?.Hide();

    LoadJsonGuides();
}

private void Start()
{
    Scene activeScene = SceneManager.GetActiveScene();
    NotifySceneLoaded(activeScene.name);
}

private void OnEnable()
{
    SceneManager.sceneLoaded += HandleSceneLoaded;
    GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;
    GlobalEventBus.OnEnemyDead += HandleEnemyDead;
    GlobalEventBus.OnEscapeRequest += HandleEscapeRequest;
    GlobalEventBus.OnMainActiveSkillCasted += HandleMainActiveSkillCasted;
}

private void OnDisable()
{
    SceneManager.sceneLoaded -= HandleSceneLoaded;
    GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;
    GlobalEventBus.OnEnemyDead -= HandleEnemyDead;
    GlobalEventBus.OnEscapeRequest -= HandleEscapeRequest;
    GlobalEventBus.OnMainActiveSkillCasted -= HandleMainActiveSkillCasted;

    CompletePendingInputRestore();
    highlightController?.Hide();

    if (!isShowing)
        return;

    popup?.HideImmediate();
    isShowing = false;
    currentCompletion = null;
    currentGuide = null;
    StopDurationRoutine();
```

```cs
    RestoreGameplay();
    SetGameplayHUDDimmed(false);
}

private void Update()
{
    TryShowPendingGuide();

    if (!isShowing || popup == null)
        return;

    if (IsConfirmInputPressed())
        popup.Confirm();
}

/// <summary>
/// 기존 TutorialTrigger나 외부 코드에서 특정 ID 팝업을 직접 요청할 때 사용하는 호환용 API입니다.
/// JSON 데이터가 로드된 경우에는 JSON 흐름만 사용하고, JSON 데이터가 없을 때만 기존 카탈로그를 백업으로 사용합니다.
/// </summary>
public bool Show(string tutorialId, Action completed = null)
{
    if (int.TryParse(tutorialId, out int tid) && guideById.TryGetValue(tid, out TutorialGuideData guide))
        return ShowGuide(guide, completed);

    if (guideById.Count > 0)
    {
        Debug.LogWarning($"[TutorialManager] JSON 튜토리얼 데이터가 로드되어 Catalog fallback을 사용하지 않습니다. 요청 ID={tutorialId}", this);
        return false;
    }

    if (isShowing || popup == null || catalog == null)
        return false;

    if (!catalog.TryGetEntry(tutorialId, out TutorialMessageEntry entry))
    {
        Debug.LogWarning($"[TutorialManager] 등록되지 않은 튜토리얼 ID입니다: {tutorialId}", this);
        return false;
    }

    isShowing = true;
    currentCompletion = completed;
    highlightController?.Hide();
    SetGameplayHUDDimmed(true);

    if (entry.PauseGame)
        PauseGameplay();

    popup.Show(entry, CompleteLegacyPopup);
    return true;
}

/// <summary>
/// 콜라이더 트리거 진입 조건을 튜토리얼 데이터 시스템에 전달합니다.
/// </summary>
public bool NotifyTriggerEnter(string triggerValue)
{
```

```cs
    bool clearedCurrent = TryClearCurrent(TutorialConditionTypes.TriggerEnter, triggerValue);
    bool openedNew = TryOpenByCondition(TutorialConditionTypes.TriggerEnter, triggerValue);
    return clearedCurrent || openedNew;
}

/// <summary>
/// 임의 이벤트 조건을 튜토리얼 데이터 시스템에 전달합니다.
/// </summary>
public bool NotifyEvent(string eventName)
{
    bool clearedCurrent = TryClearCurrent(TutorialConditionTypes.Event, eventName);
    bool openedNew = TryOpenByCondition(TutorialConditionTypes.Event, eventName);
    return clearedCurrent || openedNew;
}

/// <summary>
/// 튜토리얼에서 플레이어 사망을 막았을 때 출력하는 반복 가능 무전입니다.
/// JSON 진행 데이터와 분리해 HP가 1로 떨어질 때마다 번갈아 출력할 수 있게 합니다.
/// </summary>
public void ShowTutorialDeathPreventedRadio()
{
    if (popup == null || isRuntimeRadioShowing)
        return;

    string message = tutorialDeathPreventedRadioIndex % 2 == 0
        ? "\uC5D0\uB108\uBBF8\uB97C \uC8FD\uC5EC\uC57C \uD574!"
        : "\uC815\uC2E0\uCC28\uB824 \uC720\uC548!";
    tutorialDeathPreventedRadioIndex++;

    TutorialGuideData runtimeRadio = new()
    {
        TID = -9001 - tutorialDeathPreventedRadioIndex,
        ContentType = "Dialogue",
        Speaker = "Operator",
        SpeakerName = "\uAD00\uC81C\uC0AC",
        PortraitId = "Operator_Radio",
        DialogueText = message,
        Title = "\uAD00\uC81C\uC0AC",
        ConfirmText = string.Empty,
        ClearConditionType = TutorialConditionTypes.NextButton,
        ClearConditionValue = "-",
        RadioEffectId = "Radio_Default",
        PauseGame = true,
```

```cs
        IsTutorialAutoSkip = false
    };

    suspendedWasShowing = isShowing;
    suspendedGuide = currentGuide;
    suspendedCompletion = currentCompletion;

    isRuntimeRadioShowing = true;
    isShowing = true;
    currentGuide = runtimeRadio;
    currentCompletion = null;
    StopDurationRoutine();
    highlightController?.Hide();
    SetGameplayHUDDimmed(true);
    PauseGameplay();

    popup.Show(runtimeRadio, CompleteRuntimeRadio);
}

private void LoadJsonGuides()
{
    guideById.Clear();
    List<TutorialGuideData> guides = new LocalJsonTutorialGuideRepository().LoadAll();
    guides.Sort((a, b) =>
    {
        int stepCompare = a.TutorialStep.CompareTo(b.TutorialStep);
        return stepCompare != 0 ? stepCompare : a.TutorialGuideOrder.CompareTo(b.TutorialGuideOrder);
    });

    foreach (TutorialGuideData guide in guides)
    {
        if (guide == null || guide.TID <= 0 || guideById.ContainsKey(guide.TID))
            continue;

        guideById.Add(guide.TID, guide);
    }

    Debug.Log($"[TutorialManager] JSON 튜토리얼 데이터 {guideById.Count}개 로드 완료", this);
}

private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
{
    NotifySceneLoaded(scene.name);
}

private void NotifySceneLoaded(string sceneName)
{
    TryOpenByCondition(TutorialConditionTypes.SceneLoaded, sceneName);
}

private void HandleItemBoxOpened(IInteractable interactable, int playerId)
{
    if (interactable is ItemBox)
        NotifyEvent(TutorialEventNames.ItemBoxOpened);
}
```

```cs
private void HandleEnemyDead(int enemyId)
{
    NotifyEvent(TutorialEventNames.EnemyDead);
}

private void HandleEscapeRequest(bool success)
{
    NotifyEvent(success ? TutorialEventNames.EscapeSucceeded : TutorialEventNames.EscapeFailed);

    if (success)
        MarkTutorialCompleted();
}

private void HandleMainActiveSkillCasted()
{
    NotifyEvent(TutorialEventNames.MainActiveSkillCasted);
}

private bool TryOpenByCondition(string conditionType, string conditionValue)
{
    foreach (TutorialGuideData guide in guideById.Values)
    {
        if (openedGuideIds.Contains(guide.TID))
            continue;

        if (!IsConditionMatch(guide.OpenConditionType, guide.OpenConditionValue, conditionType, conditionValue))
            continue;

        RequestGuide(guide);
        return true;
    }

    return false;
}

private void RequestGuide(TutorialGuideData guide)
{
    if (guide == null)
        return;

    if (openedGuideIds.Contains(guide.TID))
        return;

    if (isShowing)
    {
        pendingGuides.Enqueue(guide);
        return;
    }

    ShowGuide(guide);
}

private void TryShowPendingGuide()
{
    if (isShowing || pendingGuides.Count == 0)
        return;

    ShowGuide(pendingGuides.Dequeue());
}

private bool ShowGuide(TutorialGuideData guide, Action completed = null)
{
    GlobalEventBus.OnMouseLocked?.Invoke(false);

    if (guide == null || isShowing || popup == null)
        return false;

    openedGuideIds.Add(guide.TID);
```

```cs
    currentGuide = guide;
    currentCompletion = completed;
    isShowing = true;
    bool hasHighlight = highlightController != null && highlightController.Show(guide);
    SetGameplayHUDDimmed(!hasHighlight);

    if (guide.PauseGame)
        PauseGameplay();

    popup.Show(guide, HandlePopupConfirmed);
    StartDurationClearIfNeeded(guide);
    Debug.Log($"[TutorialManager] 안내 출력: {guide.TID} / UIHighlight={guide.UIHighlightPosition} / WorldHighlight={guide.HighlightEffectPosition}", this);
    return true;
}

private void HandlePopupConfirmed()
{
    if (ShouldDismissObjectiveOnly())
    {
        DismissCurrentObjectivePopup();
        return;
    }

    TryClearCurrent(TutorialConditionTypes.NextButton, string.Empty);
}

private bool ShouldDismissObjectiveOnly()
{
    if (currentGuide == null)
        return false;

    return IsSameContentType(currentGuide.ContentType, "Objective") ||
           IsSameConditionType(currentGuide.ClearConditionType, TutorialConditionTypes.Event);
}

private void DismissCurrentObjectivePopup()
{
    // ObjectivePanel의 버튼은 목표 완료가 아니라 화면에서 안내창만 접는 용도입니다.
    // 실제 완료 처리는 EnemyDead, ItemBoxOpened, EscapeSucceeded 같은 기존 이벤트 조건이 계속 담당합니다.
    popup?.HideImmediate();
    RestoreGameplay();
    SetGameplayHUDDimmed(false);
    highlightController?.EnterObjectiveMode();
}

private bool IsConfirmInputPressed()
{
    // 관제사 무전은 화면 전체 클릭이나 단축키가 아니라, 무전 패널 자체를 눌렀을 때만 진행합니다.
    if (IsCurrentOperatorDialogue())
        return false;
```

```cs
    bool keyboardConfirmed = Keyboard.current != null &&
        (Keyboard.current.enterKey.wasPressedThisFrame ||
         Keyboard.current.spaceKey.wasPressedThisFrame ||
         Keyboard.current.escapeKey.wasPressedThisFrame);
    bool gamepadConfirmed = Gamepad.current != null && Gamepad.current.buttonSouth.wasPressedThisFrame;

    if (keyboardConfirmed || gamepadConfirmed)
        return true;

    // 무전/대화창은 별도 NEXT 버튼 없이 화면 클릭으로 다음 대사로 넘깁니다.
    bool dialogueClicked = currentGuide != null &&
                           IsSameContentType(currentGuide.ContentType, "Dialogue") &&
                           Mouse.current != null &&
                           Mouse.current.leftButton.wasPressedThisFrame;

    return dialogueClicked;
}

private bool IsCurrentOperatorDialogue()
{
    return currentGuide != null &&
           IsSameContentType(currentGuide.ContentType, "Dialogue") &&
           string.Equals(currentGuide.Speaker?.Trim(), "Operator", StringComparison.OrdinalIgnoreCase);
}

private bool TryClearCurrent(string conditionType, string conditionValue)
{
    if (!isShowing || currentGuide == null)
        return false;

    if (!IsConditionMatch(currentGuide.ClearConditionType, currentGuide.ClearConditionValue, conditionType, conditionValue))
        return false;

    CompleteCurrentGuide();
    return true;
}

private void CompleteCurrentGuide()
{
    if (!isShowing)
        return;

    TutorialGuideData completedGuide = currentGuide;
    isShowing = false;
    currentGuide = null;
    StopDurationRoutine();
```

```cs
    popup?.HideImmediate();
    highlightController?.Hide();
    RestoreGameplay();
    SetGameplayHUDDimmed(false);

    Action completion = currentCompletion;
    currentCompletion = null;
    completion?.Invoke();

    if (completedGuide == null)
        return;

    TryOpenByCondition(TutorialConditionTypes.PrevGuideClosed, completedGuide.TID.ToString());

    if (completedGuide.NextGuideID > 0 && guideById.TryGetValue(completedGuide.NextGuideID, out TutorialGuideData nextGuide))
        RequestGuide(nextGuide);

    // 다음 연쇄 대사가 없어 묶음이 완전히 끝났으면 커서를 다시 잠급니다.
    if (!isShowing)
    {
        GlobalEventBus.OnMouseLocked?.Invoke(true);
    }
}

private void CompleteLegacyPopup()
{
    if (!isShowing)
        return;

    isShowing = false;
    RestoreGameplay();
    popup?.HideImmediate();
    highlightController?.Hide();
    SetGameplayHUDDimmed(false);

    Action completion = currentCompletion;
    currentCompletion = null;
    completion?.Invoke();
}

private void CompleteRuntimeRadio()
{
    if (!isRuntimeRadioShowing)
        return;

    isRuntimeRadioShowing = false;
    RestoreGameplay();

    if (suspendedWasShowing && suspendedGuide != null)
    {
        currentGuide = suspendedGuide;
        currentCompletion = suspendedCompletion;
        isShowing = true;
        bool hasHighlight = highlightController != null && highlightController.Show(currentGuide);
        SetGameplayHUDDimmed(!hasHighlight);
        popup?.Show(currentGuide, HandlePopupConfirmed);
```

```cs
        if (currentGuide.PauseGame)
            PauseGameplay();
    }
    else
    {
        currentGuide = null;
        currentCompletion = null;
        isShowing = false;
        popup?.HideImmediate();
        highlightController?.Hide();
        SetGameplayHUDDimmed(false);
    }

    suspendedWasShowing = false;
    suspendedGuide = null;
    suspendedCompletion = null;
}

private void StartDurationClearIfNeeded(TutorialGuideData guide)
{
    StopDurationRoutine();

    if (!IsSameConditionType(guide.ClearConditionType, TutorialConditionTypes.Duration))
        return;

    float duration = guide.TutorialDuration > 0f ? guide.TutorialDuration : 3f;
    durationRoutine = StartCoroutine(DurationClearRoutine(duration));
}

private IEnumerator DurationClearRoutine(float duration)
{
    yield return new WaitForSecondsRealtime(duration);
    TryClearCurrent(TutorialConditionTypes.Duration, duration.ToString());
}

private void StopDurationRoutine()
{
    if (durationRoutine == null)
        return;

    StopCoroutine(durationRoutine);
    durationRoutine = null;
}

private static bool IsConditionMatch(string expectedType, string expectedValue, string actualType, string actualValue)
{
    if (!IsSameConditionType(expectedType, actualType))
        return false;

    if (string.IsNullOrWhiteSpace(expectedValue) || expectedValue == "-" || expectedValue == "*")
        return true;

    return string.Equals(expectedValue.Trim(), actualValue?.Trim(), StringComparison.OrdinalIgnoreCase);
}
```

```cs
private static bool IsSameConditionType(string a, string b)
{
    return string.Equals(NormalizeConditionType(a), NormalizeConditionType(b), StringComparison.OrdinalIgnoreCase);
}

private static string NormalizeConditionType(string conditionType)
{
    if (string.IsNullOrWhiteSpace(conditionType))
        return TutorialConditionTypes.None;

    string normalized = conditionType.Trim();

    // 엑셀 원본에서 사용하는 약식 조건명도 내부 조건명과 동일하게 처리합니다.
    if (string.Equals(normalized, "prevGuideEnd", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.PrevGuideClosed;
    if (string.Equals(normalized, "triggerEnter", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.TriggerEnter;
    if (string.Equals(normalized, "sceneLoaded", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.SceneLoaded;
    if (string.Equals(normalized, "nextButton", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.NextButton;
    if (string.Equals(normalized, "event", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.Event;
    if (string.Equals(normalized, "duration", StringComparison.OrdinalIgnoreCase))
        return TutorialConditionTypes.Duration;

    return normalized;
}

private static bool IsSameContentType(string a, string b)
{
    return string.Equals(a?.Trim(), b, StringComparison.OrdinalIgnoreCase);
}

private void PauseGameplay()
{
    CompletePendingInputRestore();

    previousTimeScale = Time.timeScale;
    Time.timeScale = 0f;
```

```cs
    pausedByTutorial = true;

    inputReader = FindFirstObjectByType<LocalInputReader>();
    if (inputReader != null)
    {
        inputReader.SetGameplayInputBlocked(true);
        inputReader.SwitchToUIMap();
    }
}

private void RestoreGameplay()
{
    if (!pausedByTutorial)
        return;

    Time.timeScale = previousTimeScale;
    pausedByTutorial = false;

    if (inputReader != null)
    {
        LocalInputReader readerToRestore = inputReader;
        pendingInputReader = readerToRestore;
        inputReader = null;

        // 확인 버튼을 누른 같은 프레임의 마우스/키 입력이 공격이나 이동으로 이어지지 않도록
        // 클릭 입력이 완전히 끝난 뒤 플레이어 액션맵을 복구합니다.
        if (isActiveAndEnabled)
            restoreInputRoutine = StartCoroutine(RestorePlayerInputMapAfterClick(readerToRestore));
        else
            CompletePendingInputRestore();
    }

    inputReader = null;
}

private void SetGameplayHUDDimmed(bool dimmed)
{
    GlobalEventBus.OnGameplayHUDAlphaRequested?.Invoke(dimmed ? DimmedGameplayHUDAlpha : DefaultGameplayHUDAlpha);
}

private IEnumerator RestorePlayerInputMapAfterClick(LocalInputReader readerToRestore)
{
    yield return null;

    // 확인 클릭이 완전히 끝날 때까지 Player 액션맵을 비활성 상태로 유지합니다.
    yield return null;

    if (readerToRestore != null)
    {
        readerToRestore.SetGameplayInputBlocked(false);
        readerToRestore.SwitchToPlayerMap();
    }

    if (pendingInputReader == readerToRestore)
        pendingInputReader = null;

    restoreInputRoutine = null;
}

/// <summary>
```

```cs
    /// 튜토리얼 오브젝트가 비활성화되거나 씬이 전환돼도 입력 맵과 차단 상태가 남지 않게 즉시 복구합니다.
    /// </summary>
    private void CompletePendingInputRestore()
    {
        if (restoreInputRoutine != null)
        {
            StopCoroutine(restoreInputRoutine);
            restoreInputRoutine = null;
        }

        LocalInputReader readerToRestore = pendingInputReader;
        pendingInputReader = null;

        if (readerToRestore == null)
            return;

        readerToRestore.SetGameplayInputBlocked(false);
        readerToRestore.SwitchToPlayerMap();
    }

    private void MarkTutorialCompleted()
    {
        if (tutorialCompletionSaved)
            return;

        tutorialCompletionSaved = true;

        PlayerSaveDataSO saveDataSO = PlayerSaveDataSO.Instance;
        PlayerSaveData saveData = saveDataSO != null
            ? saveDataSO.LoadSaveData()
            : new PlayerSaveData();

        saveData.isTutorialCompleted = true;
        saveDataSO?.SaveGameData(saveData);

        // 튜토리얼 완료 여부만 저장하고, 로비 이동은 인게임과 동일하게 ResultUI의 버튼 흐름에 맡깁니다.
    }

    private void OnDestroy()
    {
        CompletePendingInputRestore();
        RestoreGameplay();
        if (Instance == this)
            Instance = null;
    }
}
```
{% endraw %}
