---
title: "2026-07-17_tutorial_combat_practice_script_compare"
date: 2026-07-17 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "문서 목적 이 문서는 2026-07-17에 송예찬이 직접 작성하거나 수정한 커밋만 대상으로, 변경된 모든 스크립트를 이전 상태 → 변경 설명 → 현재 상태 순서로 비교 정리한 문서다. 분석 기준은 Git 작성자 SongYeChan1024 이며, 대상 커밋은 다음 세 건이다. 60122e"
description: "문서 목적 이 문서는 2026-07-17에 송예찬이 직접 작성하거나 수정한 커밋만 대상으로, 변경된 모든 스크립트를 이전 상태 → 변경 설명 → 현재 상태 순서로 비교 정리한 문서다. 분석 기준은 Git 작성자 SongYeChan1024 이며, 대상 커밋은 다음 세 건이다. 60122e"
published: true
migration_id: "3a036532580e81318552fd08879a367e"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
# 문서 목적

이 문서는 2026-07-17에 송예찬이 직접 작성하거나 수정한 커밋만 대상으로, 변경된 모든 스크립트를 이전 상태 → 변경 설명 → 현재 상태 순서로 비교 정리한 문서다.

분석 기준은 Git 작성자 <code>SongYeChan1024 &lt;[이메일 제외]&gt;</code>이며, 대상 커밋은 다음 세 건이다.

- <code>60122ec</code> 튜토리얼 진행 우회 및 UI 입력 누수 수정
- <code>011771c</code> 튜토리얼 바닥 꺼짐 현상 수정 후 재커밋
- <code>424edea</code> feat: 튜토리얼 전투 실습 안정성 및 UI 흐름 개선

다른 팀원이 작성한 마우스 제한, 공중전화, 사운드, 설정 UI, 아이템 드래그, 플레이어 이동 관련 커밋은 이 문서에서 제외했다.

# 1. LocalInputReader.cs

파일: <code>Assets/02_Scripts/System/Player/LocalInputReader.cs</code>

## 이전 스크립트

- 입력 차단 전용 상태가 없었다.
- 튜토리얼 팝업이 열려 있어도 공격, 스킬, 상호작용, 구르기, 퀵슬롯 입력이 게임플레이로 전달될 수 있었다.
- UI를 닫은 프레임의 클릭이 공격 입력으로 이어질 가능성이 있었다.

```cs
public void OnAttack(InputAction.CallbackContext context)
{
    if (isInventoryOpen)
        return;

    if (context.performed)
        GlobalEventBus.OnAttackInput?.Invoke();
}
```

## 변경 설명

- <code>isGameplayInputBlocked</code> 상태를 추가했다.
- 이동, 공격, 스킬, 상호작용, 조준, 인벤토리, 퀵슬롯, 달리기, 구르기 입력에 공통 차단 조건을 적용했다.
- 입력 차단 시작 시 이동 벡터와 달리기 상태를 즉시 초기화하도록 했다.

## 현재 스크립트

```cs
public void SetGameplayInputBlocked(bool isBlocked)
{
    isGameplayInputBlocked = isBlocked;

    if (!isBlocked)
        return;

    isSprint = false;
    GlobalEventBus.OnSprintInput?.Invoke(false);
    GlobalEventBus.OnPlayerMove?.Invoke(Vector2.zero);
}
```

```cs
public void OnAttack(InputAction.CallbackContext context)
{
    if (isGameplayInputBlocked)
        return;

    if (isInventoryOpen)
        return;

    if (context.performed)
        GlobalEventBus.OnAttackInput?.Invoke();
}
```

## 정합성 확인

- 튜토리얼 UI 표시와 플레이어 입력 차단을 같은 상태로 묶었다.
- <code>PlayerInput</code> 자체가 비활성화된 상태에서 액션맵을 전환하는 경우는 별도 방어가 필요하다.

# 2. TutorialTrigger.cs

파일: <code>Assets/02_Scripts/System/Tutorial/TutorialTrigger.cs</code>

## 이전 스크립트

- 플레이어가 트리거에 진입하면 튜토리얼 메시지만 요청했다.
- 전투 실습 구간을 물리적으로 차단하거나 적 사망 후 해제하는 기능은 없었다.

```cs
private void OnTriggerEnter(Collider other)
{
    if ((triggerOnce && consumed) || !IsPlayer(other))
        return;

    bool handledByCondition = manager.NotifyTriggerEnter(TriggerValue);
    bool handledByFallback = !handledByCondition &&
        manager.Show(fallbackTutorialId);

    if (handledByCondition || handledByFallback)
        consumed = triggerOnce;
}
```

## 변경 설명

- 자식 콜라이더 중 이름이 <code>CombatCollider</code>로 시작하는 오브젝트를 전투 차단 콜라이더로 수집한다.
- 전투 실습 안내가 실제로 처리된 시점에 앞·뒤 차단 콜라이더를 활성화한다.
- <code>GlobalEventBus.OnEnemyDead</code> 이벤트를 구독해 적 처치 시 차단 콜라이더를 해제한다.
- 초기 구현에서는 플레이어가 트리거에 닿자마자 차단했지만, <code>011771c</code>에서 안내 처리 성공 후 활성화하도록 순서를 수정했다.

## 현재 스크립트

```cs
if (handledByCondition || handledByFallback)
{
    if (useCombatBlockers &&
        !combatBlockersActive &&
        !combatBlockersCleared)
    {
        ActivateCombatBlockers();
    }

    consumed = triggerOnce;
}
```

```cs
private void HandleEnemyDead(int enemyId)
{
    if (!useCombatBlockers || !combatBlockersActive)
        return;

    SetCombatBlockers(false);
    combatBlockersActive = false;
    combatBlockersCleared = true;
}
```

## 정합성 확인

- 2번 조작 안내와 3번 전투 실습 트리거의 역할이 분리됐다.
- 현재는 모든 <code>OnEnemyDead</code> 이벤트에 반응하므로, 튜토리얼 구간에 대상 적이 여러 마리라면 특정 적 식별 조건을 추가해야 한다.

# 3. TutorialManager.cs

파일: <code>Assets/02_Scripts/System/Tutorial/TutorialManager.cs</code>

## 이전 스크립트

- 팝업 표시 시 시간 정지와 액션맵 전환은 했지만, 게임플레이 입력을 별도 플래그로 막지는 않았다.
- 팝업을 닫는 클릭이 곧바로 공격 입력으로 전달될 수 있었다.
- 튜토리얼 사망 방지 무전과 HUD 투명도 조절 기능이 없었다.
- 목표 패널 닫기와 목표 조건 완료가 구분되지 않았다.

## 변경 설명

- 팝업 표시 시 <code>SetGameplayInputBlocked(true)</code>를 호출하도록 연결했다.
- 팝업 종료 후 액션맵 복귀와 입력 차단 해제를 서로 다른 프레임에 처리해 클릭 입력 누수를 줄였다.
- 튜토리얼 사망 방지 무전을 런타임 데이터로 생성하고 두 문구를 번갈아 표시한다.
- 무전 출력 동안 현재 가이드를 임시 보관하고, 무전 종료 후 기존 가이드를 복원한다.
- 튜토리얼 UI 표시 중 게임 HUD 알파를 0.3으로 낮추고 종료 시 1.0으로 복구한다.
- Objective 패널의 버튼은 화면을 접는 기능으로 사용하고, 실제 목표 완료는 <code>EnemyDead</code> 같은 이벤트가 담당하도록 분리했다.

## 현재 스크립트

```cs
inputReader = FindFirstObjectByType<LocalInputReader>();
if (inputReader != null)
{
    inputReader.SetGameplayInputBlocked(true);
    inputReader.SwitchToUIMap();
}
```

```cs
private IEnumerator RestorePlayerInputMapNextFrame(
    LocalInputReader readerToRestore)
{
    yield return null;

    if (readerToRestore != null)
    {
        readerToRestore.SwitchToPlayerMap();

        yield return null;
        readerToRestore.SetGameplayInputBlocked(false);
    }

    restoreInputRoutine = null;
}
```

```cs
string message = tutorialDeathPreventedRadioIndex % 2 == 0
    ? "에너미를 죽여야 해!"
    : "정신차려 유안!";
```

## 정합성 확인

- 시간 정지, 입력 차단, HUD 흐림을 튜토리얼 표시 상태와 함께 관리한다.
- 런타임 무전이 기존 팝업 위에 표시될 때 기존 가이드의 완료 콜백이 유지되는지 반복 테스트가 필요하다.

# 4. PlayerStatus.cs

파일: <code>Assets/02_Scripts/System/Player/PlayerStatus.cs</code>

## 이전 스크립트

- 튜토리얼과 일반 인게임이 동일한 사망 처리 흐름을 사용했다.
- 전투 실습 중 치명 피해를 받으면 게임오버와 로비 이동 흐름으로 이어질 수 있었다.

```cs
GetHp(-dmg);

string damageVfxId = hpCurrent <= 0.0f
    ? GameplayVFXIds.PlayerDeath
    : GameplayVFXIds.PlayerHit;
```

## 변경 설명

- <code>TutorialScene</code>이 로드된 경우에만 치명 피해를 차단한다.
- 튜토리얼 HP를 1로 고정하고 일반 피격 VFX, 애니메이션, 사운드를 출력한다.
- 사망 처리 대신 <code>TutorialManager.ShowTutorialDeathPreventedRadio()</code>를 호출한다.
- 일반 인게임의 기존 사망 처리에는 영향을 주지 않도록 씬 판정을 분리했다.

## 현재 스크립트

```cs
if (ShouldPreventTutorialDeath(dmg))
{
    PreventTutorialDeath();
    return;
}
```

```cs
private static bool IsTutorialSceneActive()
{
    return SceneManager.GetSceneByName("TutorialScene").isLoaded;
}
```

## 정합성 확인

- 튜토리얼 Additive 구조에 맞춰 활성 씬 이름이 아니라 로드 여부를 사용했다.
- 치명 피해가 반복될 때 무전이 지나치게 자주 발생하는지 플레이 테스트가 필요하다.

# 5. TutorialPopup.cs

파일: <code>Assets/02_Scripts/System/Tutorial/TutorialPopup.cs</code>

## 이전 스크립트

- <code>SetPopupRect</code>, <code>SetTitleRect</code>, <code>SetMessageRect</code>, <code>SetConfirmButton</code>이 런타임에 RectTransform을 직접 덮어썼다.
- 인스펙터에서 배경 이미지와 색을 맞춰도 레거시 스프라이트 설정이 다시 덮을 수 있었다.
- 분리된 패널의 ConfirmButton 참조가 누락되면 클릭 진행이 끊길 수 있었다.
- 레거시 공용 텍스트가 분리 패널 위에 함께 표시될 수 있었다.

## 변경 설명

- RectTransform 배치는 프리팹과 인스펙터가 담당하도록 런타임 위치·크기 쓰기를 제거했다.
- 분리 패널에 연결된 <code>BackgroundImage</code>의 Sprite, Color, Type을 우선 보존한다.
- ConfirmButton 참조가 비어 있으면 자식 버튼에서 자동으로 찾도록 했다.
- 분리 패널 사용 시 레거시 제목, 본문, 확인 텍스트를 숨기도록 했다.
- Guide, OperatorRadio, YuanDialogue, Objective 각 패널의 확인 버튼을 활성화해 패널 전체 클릭 구성과 연결할 수 있게 했다.

## 현재 스크립트

```cs
private void SetPopupRect(
    Vector2 anchorMin,
    Vector2 anchorMax,
    Vector2 anchoredPosition,
    Vector2 sizeDelta,
    Vector2 pivot)
{
    // RectTransform은 프리팹/인스펙터 설정을 사용한다.
}
```

```cs
if (panel != null && panel.BackgroundImage != null)
    return null;
```

```cs
private void ResolvePanelReferences()
{
    guidePanel.ResolveMissingReferences();
    operatorRadioPanel.ResolveMissingReferences();
    yuanDialoguePanel.ResolveMissingReferences();
    objectivePanel.ResolveMissingReferences();
}
```

## 정합성 확인

- UI 위치와 크기는 인스펙터 값이 단일 기준이 됐다.
- 해당 커밋의 일부 한글 주석이 Git diff에서 깨져 보였으므로 파일 인코딩을 한 번 확인하는 것이 안전하다.

# 6. GamePlayUI.cs

파일: <code>Assets/02_Scripts/UI/Game/GamePlayUI.cs</code>

## 이전 스크립트

- HUD의 전체 투명도를 외부 연출에서 조절하는 기능이 없었다.

## 변경 설명

- <code>CanvasGroup</code> 참조를 추가하고 없으면 런타임에 생성한다.
- <code>OnGameplayHUDAlphaRequested</code> 이벤트를 구독해 튜토리얼 UI 표시 중 HUD 알파를 낮춘다.
- 오브젝트 비활성화 시 알파를 1.0으로 복구한다.

## 현재 스크립트

```cs
private void SetHUDAlpha(float alpha)
{
    if (hudCanvasGroup == null)
        return;

    hudCanvasGroup.alpha = Mathf.Clamp01(alpha);
}
```

# 7. GlobalEventBus.cs

파일: <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>

## 이전 스크립트

- 튜토리얼 시스템이 GamePlayUI를 직접 참조하지 않고 HUD 알파를 요청할 통로가 없었다.

## 변경 설명 및 현재 스크립트

```cs
public static Action<float> OnGameplayHUDAlphaRequested;
```

- 튜토리얼과 HUD의 직접 의존성을 만들지 않고 알파 조절 요청을 전달한다.

# 8. EnemyStatus.cs

파일: <code>Assets/02_Scripts/System/Enemy/EnemyStatus.cs</code>

## 이전 스크립트

```cs
hpMax = 100.0f;
```

## 변경 설명 및 현재 스크립트

```cs
hpMax = 50.0f;
```

- 기본 에너미 체력을 100에서 50으로 낮췄다.
- 이 값은 공통 <code>EnemyStatus</code>의 Awake 초기화이므로 특정 다크 스피릿 프리팹만이 아니라 이 스크립트를 사용하는 모든 에너미에 영향을 줄 수 있다.
- 다크 스피릿 한정 밸런싱이 목적이라면 향후 프리팹 또는 데이터 기반 수치로 분리해야 한다.

# 9. 스크립트 외 직접 변경 사항

## TutorialGuide.json

- TID 2007 전투 실습의 열림 조건을 <code>PrevGuideClosed / 2006</code>에서 <code>TriggerEnter / TutorialScene_Step3_CombatPractice</code>로 변경했다.
- 공격·스킬 안내 직후 자동으로 전투 실습이 시작되는 대신, 3번 전투 실습 트리거 진입 시 시작되도록 분리했다.

## TutorialScene.unity

- Step3 전투 실습 트리거와 앞·뒤 CombatCollider 배치를 조정했다.
- 차단 콜라이더가 너무 일찍 켜져 플레이어가 바닥 아래로 떨어지던 흐름을 수정했다.
- 튜토리얼 UI 및 TutorialSystem 인스턴스 연결을 보정했다.

## TutorialSystem.prefab

- 패널별 ConfirmButton, BackgroundImage, TMP 텍스트, 캐릭터 이미지 참조를 인스펙터 기준으로 정리했다.
- 스크립트가 RectTransform을 덮지 않는 구조와 맞춰 UI 배치값을 프리팹에 저장했다.

## TutorialTrigger.prefab

- 전투 차단 옵션과 트리거 연결 값을 현재 Step3 구조에 맞췄다.

## Enemy-DarkSpirit.prefab

- 오늘 작성자 커밋에 포함된 다크 스피릿 프리팹 값을 함께 조정했다.
- 공통 EnemyStatus의 HP 변경과 프리팹 수치가 충돌하지 않는지 확인이 필요하다.

## SampleSceneProfile.asset

- <code>60122ec</code> 커밋에 함께 포함됐다.
- 튜토리얼 전용 수정 의도와 무관한 전역 렌더 설정이라면 별도 검토가 필요하다.

# 10. 테스트 체크리스트

- [ ] Step2 조작 안내에서는 전투 차단 콜라이더가 켜지지 않는지 확인
- [ ] Step3 전투 실습 안내가 실제로 열린 후 앞·뒤 콜라이더가 켜지는지 확인
- [ ] 대상 에너미 처치 후 두 차단 콜라이더가 모두 꺼지는지 확인
- [ ] 팝업 확인 클릭이 사격, 이동, 스킬 입력으로 전달되지 않는지 확인
- [ ] 팝업 종료 후 두 프레임 뒤 입력이 정상 복구되는지 확인
- [ ] 인스펙터에서 조정한 패널 위치와 배경 이미지가 런타임에 유지되는지 확인
- [ ] 튜토리얼에서 치명 피해를 받아도 HP 1이 유지되는지 확인
- [ ] 사망 방지 무전 두 문구가 번갈아 표시되고 기존 가이드가 복구되는지 확인
- [ ] 튜토리얼 UI 중 HUD 알파가 0.3, 종료 후 1.0으로 복구되는지 확인
- [ ] 일반 인게임에서는 기존 사망 처리가 유지되는지 확인
- [ ] EnemyStatus를 사용하는 모든 에너미의 HP가 50이 되는 것이 의도인지 확인
{% endraw %}
