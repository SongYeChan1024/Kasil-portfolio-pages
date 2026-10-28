---
title: "2026-07-22_GameUIPresenter_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Presenter/GameUIPresenter.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; u"
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Presenter/GameUIPresenter.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; u"
published: false
migration_id: "3a536532580e81a59486c6d8ae853366"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/Presenter/GameUIPresenter.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;

public class GameUIPresenter : MonoBehaviour
{
    private UIManager uiManager;
    private InGameMenuUI inGameMenuUI;                  // 게임 메뉴 UI 캐시
    private SettingUI settingUI;                    // 설정 UI 캐시
    private NoticeLobbyUI noticeLobbyUI;            // 로비 이동 경고 UI
    private InputAction openSettingAction;          // 설정 창 열기 이벤트 (ESC)

    private void Start()
    {
        uiManager = UIManager.Instance;
    }

    private void OnEnable()
    {
        GlobalEventBus.OnOpenSettingUI += OpenSettingUI;
        GlobalEventBus.OnOpenNoticeLobbyUI += OpenNoticeLobbyUI;

        if (InputManager.Instance != null)
        {
            openSettingAction = InputManager.Instance.GetAction("Player", "GameMenu");
            if (openSettingAction != null)
            {
                openSettingAction.Enable();
                openSettingAction.performed += OpenPauseUI;
            }
        }
    }

    private void OnDisable()
    {
        GlobalEventBus.OnOpenSettingUI -= OpenSettingUI;
        GlobalEventBus.OnOpenNoticeLobbyUI -= OpenNoticeLobbyUI;

        if (openSettingAction != null)
        {
            openSettingAction.performed -= OpenPauseUI;
            openSettingAction.Disable();
        }
    }

    /* ESC 목록UI 열기 */
    public void OpenPauseUI(InputAction.CallbackContext context)
    {
        if (uiManager == null)
            uiManager = UIManager.Instance;
            
        if (uiManager == null) return;

        if (inGameMenuUI == null)
        {
            inGameMenuUI = uiManager.Open<InGameMenuUI>();
            return;
        }

        if (inGameMenuUI.gameObject.activeInHierarchy == false)
        {
            uiManager.Open<InGameMenuUI>();
        }
        else
        {
            if (uiManager.GetTopUI() != inGameMenuUI)
            {
                uiManager.CloseNowUI();
            }
            else
            {
                uiManager.Close<InGameMenuUI>();
            }
        }
    }

    /* 설정 UI 열기 */
    public void OpenSettingUI()
    {
        if (uiManager == null)
            uiManager = UIManager.Instance;
            
        if (uiManager == null) return;

        if (settingUI == null)
        {
            settingUI = uiManager.Open<SettingUI>();
            return;
        }

        if (settingUI.gameObject.activeInHierarchy == false)
        {
            uiManager.Open<SettingUI>();
        }
        else
        {
            uiManager.Close<SettingUI>();
        }
    }

    /* 로바 아동 시 경고 팝업 출력 */
    private void OpenNoticeLobbyUI()
    {
        if (uiManager == null)
            uiManager = UIManager.Instance;
            
        if (uiManager == null) return;

        if (noticeLobbyUI == null)
        {
            noticeLobbyUI = uiManager.Open<NoticeLobbyUI>();
            return;
        }

        if (noticeLobbyUI.gameObject.activeInHierarchy == false)
        {
            uiManager.Open<NoticeLobbyUI>();
        }
        else
        {
            uiManager.Close<NoticeLobbyUI>();
        }
    }
    
    /* 로비로 돌아가기 */
    private void GoToLobby()
    {
        
    }
}
```

## 2. 변경 설명

세 직접 커밋에 걸쳐 ESC 메뉴 흐름을 전면 정리했습니다. Player/UI 양쪽 ESC 액션을 연결하고 메뉴 입력 차단 소유권, 배경 UI Raycast, 이전 액션 맵·커서 복구, 세션 종료 정리를 추가했습니다. 이후 인벤토리 계열 UI를 메뉴보다 먼저 닫는 ESC 가드와 게임 포기 결과 연결을 보강했고, 최종적으로 TutorialScene에서는 게임 메뉴 진입만 제한하도록 했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/Presenter/GameUIPresenter.cs</code>

```cs
using System.Collections;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

public class GameUIPresenter : MonoBehaviour
{
    private const string PlayerInputMapName = "Player";
    private const string UIInputMapName = "UI";

    private UIManager uiManager;
    private InGameMenuUI inGameMenuUI;          // 게임 메뉴 UI 캐시
    private SettingUI settingUI;                // 설정 UI 캐시
    private NoticeLobbyUI noticeLobbyUI;        // 로비 이동 경고 UI
    private LocalInputReader localInputReader;  // 플레이어 입력 차단 및 액션 맵 전환

    private InputAction playerGameMenuAction;   // 플레이 중 ESC 입력
    private InputAction uiGameMenuAction;       // 메뉴가 열린 동안의 ESC 입력
    private Coroutine restoreInputRoutine;
    private Coroutine inventoryEscapeGuardRoutine;
    private string previousInputMapName = PlayerInputMapName;
    private bool isMenuInputCaptured;
    private bool isInventoryEscapeConsumed;
    private bool isSessionEnded;

    private void Start()
    {
        uiManager = UIManager.Instance;
        BindGameMenuActions();
    }

    private void OnEnable()
    {
        GlobalEventBus.OnOpenSettingUI += OpenSettingUI;
        GlobalEventBus.OnOpenNoticeLobbyUI += OpenNoticeLobbyUI;
        GlobalEventBus.OnCloseInGameMenuUI += CloseInGameMenuUI;
        GlobalEventBus.OnEscapeRequest += HandleSessionEnded;

        BindGameMenuActions();
    }

    private void OnDisable()
    {
        GlobalEventBus.OnOpenSettingUI -= OpenSettingUI;
        GlobalEventBus.OnOpenNoticeLobbyUI -= OpenNoticeLobbyUI;
        GlobalEventBus.OnCloseInGameMenuUI -= CloseInGameMenuUI;
        GlobalEventBus.OnEscapeRequest -= HandleSessionEnded;

        if (playerGameMenuAction != null)
        {
            playerGameMenuAction.performed -= OpenPauseUI;
        }

        if (uiGameMenuAction != null)
            uiGameMenuAction.performed -= OpenPauseUI;

        if (restoreInputRoutine != null)
        {
            StopCoroutine(restoreInputRoutine);
            restoreInputRoutine = null;
        }

        if (inventoryEscapeGuardRoutine != null)
        {
            StopCoroutine(inventoryEscapeGuardRoutine);
            inventoryEscapeGuardRoutine = null;
        }

        isInventoryEscapeConsumed = false;

        // 씬 전환 시에는 다음 입력 맵으로 바꾸지 않고 메뉴가 소유한 차단만 해제합니다.
        if (isMenuInputCaptured)
        {
            SetBackgroundGameplayUiRaycasts(true);
            if (localInputReader == null)
                localInputReader = FindFirstObjectByType<LocalInputReader>();
            localInputReader?.SetGameplayInputBlocked(false, GameplayInputBlockSource.GameMenu);
        }

        isMenuInputCaptured = false;
    }

    /// <summary>
    /// Player/UI 액션 맵 양쪽의 ESC 입력을 같은 메뉴 토글에 연결합니다.
    /// </summary>
    private void BindGameMenuActions()
    {
        InputManager inputManager = InputManager.Instance;
        if (inputManager == null)
            return;

        playerGameMenuAction = inputManager.GetAction(PlayerInputMapName, "GameMenu");
        if (playerGameMenuAction != null)
        {
            playerGameMenuAction.performed -= OpenPauseUI;
            playerGameMenuAction.performed += OpenPauseUI;
        }

        uiGameMenuAction = inputManager.GetAction(UIInputMapName, "GameMenu");
        if (uiGameMenuAction != null)
        {
            // UI 액션은 UI 맵이 선택될 때 InputManager가 활성화하므로 개별 Enable은 호출하지 않습니다.
            uiGameMenuAction.performed -= OpenPauseUI;
            uiGameMenuAction.performed += OpenPauseUI;
        }
    }

    /// <summary>
    /// ESC 입력 시 인벤토리 계열 UI를 먼저 닫고, 이후 게임 메뉴 또는 최상단 팝업을 처리합니다.
    /// 메뉴가 열린 동안에도 Time.timeScale은 변경하지 않습니다.
    /// </summary>
    public void OpenPauseUI(InputAction.CallbackContext context)
    {
        // 사망 또는 탈출 결과가 확정된 뒤에는 결과 UI 위로 인게임 메뉴가 다시 열리지 않게 합니다.
        if (isSessionEnded)
            return;

        // 인벤토리를 닫은 ESC가 액션 맵 전환 직후 메뉴 열기로 다시 처리되는 것을 막는다.
        if (isInventoryEscapeConsumed)
            return;

        uiManager ??= UIManager.Instance;
        if (uiManager == null)
            return;

        bool isMenuOpen = inGameMenuUI != null && inGameMenuUI.gameObject.activeInHierarchy;
        if (!isMenuOpen && TryCloseInventoryBeforeMenu())
            return;

        if (!isMenuOpen)
        {
            OpenInGameMenu();
            return;
        }

        // 설정/로비 확인창이 메뉴 위에 있으면 해당 팝업만 닫고 입력 차단은 유지합니다.
        if (uiManager.GetTopUI() != inGameMenuUI)
        {
            uiManager.CloseNowUI();
            return;
        }

        CloseInGameMenuUI();
    }

    /// <summary>
    /// ESC를 공통 뒤로가기 입력으로 사용하여 인벤토리 계열 UI를 메뉴보다 먼저 닫습니다.
    /// </summary>
    private bool TryCloseInventoryBeforeMenu()
    {
        bool isInventoryFamilyOpen = uiManager.IsOpen<InventoryUI>() ||
                                     uiManager.IsOpen<ChestUI>() ||
                                     uiManager.IsOpen<ItemTooltipUI>();
        if (!isInventoryFamilyOpen)
            return false;

        isInventoryEscapeConsumed = true;
        if (inventoryEscapeGuardRoutine != null)
            StopCoroutine(inventoryEscapeGuardRoutine);

        inventoryEscapeGuardRoutine = StartCoroutine(ReleaseInventoryEscapeGuard());
        GlobalEventBus.OnRequestCloseInventoryUI?.Invoke();
        return true;
    }

    /// <summary>
    /// ESC 키가 완전히 해제된 다음 프레임부터 새 메뉴 입력을 허용합니다.
    /// </summary>
    private IEnumerator ReleaseInventoryEscapeGuard()
    {
        while (Keyboard.current != null && Keyboard.current.escapeKey.isPressed)
            yield return null;

        yield return null;
        isInventoryEscapeConsumed = false;
        inventoryEscapeGuardRoutine = null;
    }

    /// <summary>
    /// 인게임 메뉴를 열고 플레이 조작을 UI 조작으로 전환합니다.
    /// </summary>
    private void OpenInGameMenu()
    {
        // 튜토리얼에서는 ESC 안내 확인과 인벤토리 닫기는 유지하고 게임 메뉴 진입만 차단합니다.
        if (SceneManager.GetSceneByName("TutorialScene").isLoaded)
            return;

        if (!TryCaptureGameplayInput())
            return;

        SetBackgroundGameplayUiRaycasts(false);
        inGameMenuUI = uiManager.Open<InGameMenuUI>();
        if (inGameMenuUI != null)
            return;

        // UI 생성에 실패했을 때 입력만 잠긴 상태가 남지 않도록 즉시 복구합니다.
        RestoreCapturedInput();
    }

    /// <summary>
    /// 이미 튜토리얼 등에서 입력을 막고 있지 않을 때만 메뉴가 입력 차단을 소유합니다.
    /// </summary>
    private bool TryCaptureGameplayInput()
    {
        if (isSessionEnded)
            return false;

        if (localInputReader == null)
            localInputReader = FindFirstObjectByType<LocalInputReader>();
        if (localInputReader == null || localInputReader.IsGameplayInputBlocked)
            return false;

        previousInputMapName = InputManager.Instance?.CurrentActionMapName;
        if (string.IsNullOrWhiteSpace(previousInputMapName))
            previousInputMapName = PlayerInputMapName;

        isMenuInputCaptured = true;
        localInputReader.SetGameplayInputBlocked(true, GameplayInputBlockSource.GameMenu);
        localInputReader.SwitchToUIMap();
        GlobalEventBus.OnMouseLocked?.Invoke(false);
        return true;
    }

    /// <summary>
    /// X 버튼 또는 ESC로 인게임 메뉴를 닫고 이전 입력 상태로 복귀합니다.
    /// </summary>
    private void CloseInGameMenuUI()
    {
        uiManager ??= UIManager.Instance;
        if (uiManager == null)
            return;

        // 하위 팝업이 남은 상태에서 메뉴만 닫혀 스택이 어긋나지 않도록 함께 정리합니다.
        uiManager.Close<SettingUI>();
        uiManager.Close<NoticeLobbyUI>();
        uiManager.Close<InGameMenuUI>();

        if (!isMenuInputCaptured)
            return;

        if (restoreInputRoutine != null)
            StopCoroutine(restoreInputRoutine);

        restoreInputRoutine = StartCoroutine(RestoreInputAfterEscapeReleased());
    }

    /// <summary>
    /// ESC를 누른 같은 프레임에 Player 맵이 다시 활성화되어 입력이 관통하는 것을 방지합니다.
    /// </summary>
    private IEnumerator RestoreInputAfterEscapeReleased()
    {
        while (Keyboard.current != null && Keyboard.current.escapeKey.isPressed)
            yield return null;

        yield return null;
        restoreInputRoutine = null;
        RestoreCapturedInput();
    }

    /// <summary>
    /// 메뉴를 열기 전 액션 맵과 커서 상태로 복구합니다.
    /// </summary>
    private void RestoreCapturedInput()
    {
        if (!isMenuInputCaptured)
            return;

        SetBackgroundGameplayUiRaycasts(true);
        if (localInputReader == null)
            localInputReader = FindFirstObjectByType<LocalInputReader>();
        localInputReader?.SetGameplayInputBlocked(false, GameplayInputBlockSource.GameMenu);
        isMenuInputCaptured = false;

        // 튜토리얼 등 다른 시스템의 차단이 남아 있으면 UI 입력 맵을 그대로 유지합니다.
        if (localInputReader != null && localInputReader.IsGameplayInputBlocked)
            return;

        GlobalEventBus.OnSwitchInputMap?.Invoke(previousInputMapName);

        // 인벤토리를 열어 둔 채 메뉴만 닫았다면 기존처럼 마우스를 사용할 수 있어야 합니다.
        bool isInventoryOpen = localInputReader != null && localInputReader.IsInventoryOpen;
        bool shouldLockMouse = previousInputMapName == PlayerInputMapName && !isInventoryOpen;
        GlobalEventBus.OnMouseLocked?.Invoke(shouldLockMouse);
    }

    /// <summary>
    /// ESC 메뉴 아래에 보이는 HUD와 인벤토리는 표시만 유지하고 마우스 상호작용을 차단합니다.
    /// </summary>
    private void SetBackgroundGameplayUiRaycasts(bool enabled)
    {
        uiManager ??= UIManager.Instance;
        uiManager?.SetRaycastEnabled<GamePlayUI>(enabled);
        uiManager?.SetRaycastEnabled<InventoryUI>(enabled);
        uiManager?.SetRaycastEnabled<ChestUI>(enabled);
        uiManager?.SetRaycastEnabled<ItemTooltipUI>(enabled);
    }

    /* 설정 UI 열기 */
    public void OpenSettingUI()
    {
        uiManager ??= UIManager.Instance;
        if (uiManager == null)
            return;

        if (settingUI == null)
        {
            settingUI = uiManager.Open<SettingUI>();
            return;
        }

        if (!settingUI.gameObject.activeInHierarchy)
            uiManager.Open<SettingUI>();
        else
            uiManager.Close<SettingUI>();
    }

    /* 로비 이동 시 경고 팝업 출력 */
    private void OpenNoticeLobbyUI()
    {
        uiManager ??= UIManager.Instance;
        if (uiManager == null)
            return;

        if (noticeLobbyUI == null)
        {
            noticeLobbyUI = uiManager.Open<NoticeLobbyUI>();
            return;
        }

        if (!noticeLobbyUI.gameObject.activeInHierarchy)
            uiManager.Open<NoticeLobbyUI>();
        else
            uiManager.Close<NoticeLobbyUI>();
    }

    /// <summary>
    /// 사망 또는 탈출 확정 시 메뉴 계열 UI를 닫고 결과 UI가 최상단에 열리도록 합니다.
    /// </summary>
    private void HandleSessionEnded(bool extractionResult)
    {
        isSessionEnded = true;

        if (restoreInputRoutine != null)
        {
            StopCoroutine(restoreInputRoutine);
            restoreInputRoutine = null;
        }

        if (inventoryEscapeGuardRoutine != null)
        {
            StopCoroutine(inventoryEscapeGuardRoutine);
            inventoryEscapeGuardRoutine = null;
        }

        isInventoryEscapeConsumed = false;

        if (isMenuInputCaptured)
        {
            if (localInputReader == null)
                localInputReader = FindFirstObjectByType<LocalInputReader>();
            SetBackgroundGameplayUiRaycasts(true);
            localInputReader?.SetGameplayInputBlocked(false, GameplayInputBlockSource.GameMenu);
            isMenuInputCaptured = false;
        }
        uiManager ??= UIManager.Instance;
        if (uiManager == null)
            return;

        uiManager.Close<SettingUI>();
        uiManager.Close<NoticeLobbyUI>();
        uiManager.Close<InGameMenuUI>();
    }
}
```
{% endraw %}
