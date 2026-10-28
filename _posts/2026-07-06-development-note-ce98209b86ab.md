---
title: "2026-07-06_enemy_patrol_return_scene_fix_script_compare"
date: 2026-07-06 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 문서 개요 이 문서는 2026년 7월 6일 기준 진행한 패트롤 테스트 씬 연동 , 적 조사/복귀 구조 개선 , 청각 차단 판정 추가 , 적 HP UI 개체 분리 , ExitPoint 타이머 예외 대응 작업을 스크립트 비교 형식으로 정리한 문서이다. 문서 형식은 이전 스크립트 -> "
description: "1. 문서 개요 이 문서는 2026년 7월 6일 기준 진행한 패트롤 테스트 씬 연동 , 적 조사/복귀 구조 개선 , 청각 차단 판정 추가 , 적 HP UI 개체 분리 , ExitPoint 타이머 예외 대응 작업을 스크립트 비교 형식으로 정리한 문서이다. 문서 형식은 이전 스크립트 -> "
published: true
migration_id: "39536532580e80e3bca0ce98209b86ab"
migration_status: "published"
migration_flags: ["local_code_link_unlinked"]
---

{% raw %}
## 1. 문서 개요

이 문서는 2026년 7월 6일 기준 진행한 <code>패트롤 테스트 씬 연동</code>, <code>적 조사/복귀 구조 개선</code>, <code>청각 차단 판정 추가</code>, <code>적 HP UI 개체 분리</code>, <code>ExitPoint 타이머 예외 대응</code> 작업을 스크립트 비교 형식으로 정리한 문서이다.

문서 형식은 <code>이전 스크립트 -&gt; 설명 -&gt; 수정된 스크립트</code> 순서를 따르며, 이번 작업에서 구조가 실제로 바뀐 핵심 구간만 발췌해 기록한다.

---

## 2. 스크립트별 비교

### 2.1 GameManager.cs

- 대상 경로: \GameManager.cs\

#### 이전 스크립트

```cs
private readonly string playScene = "DemoScene";

private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
{
    if(scene.name == playScene)
    {
        // 플레이어 스폰
        // 인벤토리 복원
        // 적 스폰
    }
    else
    {
        timeTrack = false;
    }
}
```

#### 설명

기존 구조는 <code>DemoScene</code>만 실제 플레이 씬으로 취급했다.

그래서 <code>DemoScene Patrol</code>에 들어가도 씬은 로드되지만, 플레이어 스폰과 적 스폰 시작 흐름이 아예 타지 않는 문제가 있었다.

이번 수정에서는 플레이 씬 판정을 단일 문자열 비교가 아니라 배열 기반 판정으로 바꾸었다.

즉, 테스트 패트롤 씬도 기존 게임 플레이 씬과 같은 세션으로 인식하도록 구조를 확장한 것이다.

#### 수정된 스크립트

```cs
private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol" };

private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
{
    if (IsPlayScene(scene.name))
    {
        // 플레이어 스폰
        // 인벤토리 복원
        // 적 스폰
    }
    else
    {
        timeTrack = false;
    }
}

private bool IsPlayScene(string sceneName)
{
    for (int i = 0; i < playScenes.Length; i++)
    {
        if (sceneName == playScenes[i])
        {
            return true;
        }
    }

    return false;
}
```

---

### 2.2 EnemyPerception.cs

- 대상 경로: \EnemyPerception.cs\

#### 이전 스크립트

```cs
public bool CanHear(Vector3 selfPosition, NoiseStimulus stimulus)
{
    if (stimulus.Source == null)
    {
        return false;
    }

    float effectiveRadius = Mathf.Max(0.0f, stimulus.Radius);
    float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(selfPosition, stimulus.Position);
    return sqrDistance <= hearingRangeSqr && sqrDistance <= effectiveRadius * effectiveRadius;
}
```

#### 설명

기존 청각 판정은 사실상 거리 기반이었다.

즉, 소리 반경 안에 들어오기만 하면 벽 너머 총성이나 노이즈 오브젝트에도 적이 반응할 수 있었다.

이번 수정에서는 청각 판정에 <code>거리 + 차단물 판정</code>을 함께 넣었다.

적의 귀 위치와 소리 위치 사이를 <code>Linecast</code>로 확인하고, 벽 레이어가 막고 있으면 소리를 듣지 못하도록 바꿨다.

또한 기존 <code>Vector3 selfPosition</code>만 받던 구조를 <code>Transform self</code>를 받는 구조로 바꿔, 귀 위치 계산과 레이어 판정을 같은 함수 안에서 처리할 수 있게 했다.

#### 수정된 스크립트

```cs
[SerializeField] private bool requireLineOfHearing = true;
[SerializeField] private LayerMask hearingObstacleMask;
[SerializeField] private float soundSampleHeight = 1.2f;

public bool CanHear(Transform self, NoiseStimulus stimulus)
{
    if (self == null || stimulus.Source == null)
    {
        return false;
    }

    float effectiveRadius = Mathf.Max(0.0f, stimulus.Radius);
    float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, stimulus.Position);
    if (sqrDistance > hearingRangeSqr || sqrDistance > effectiveRadius * effectiveRadius)
    {
        return false;
    }

    if (!requireLineOfHearing)
    {
        return true;
    }

    LayerMask resolvedObstacleMask = ResolveHearingObstacleMask();
    if (resolvedObstacleMask.value == 0)
    {
        return true;
    }

    Vector3 earPosition = self.position + Vector3.up * eyeHeight;
    Vector3 soundPosition = stimulus.Position + Vector3.up * soundSampleHeight;

    return !Physics.Linecast(
        earPosition,
        soundPosition,
        resolvedObstacleMask,
        QueryTriggerInteraction.Ignore);
}
```

---

### 2.3 EnemyNoiseListener.cs

- 대상 경로: \EnemyNoiseListener.cs\

#### 이전 스크립트

```cs
[SerializeField] private float investigateStopDistance = 1.0f;
[SerializeField] private float investigateDuration = 2.0f;

public bool Investigate(...)
{
    if (!hasReachedInvestigatePoint)
    {
        Vector3 destination = GetInvestigateDestination();
        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, destination);
        if (sqrDistance <= investigateStopDistanceSqr)
        {
            hasReachedInvestigatePoint = true;
            investigateSearchEndTime = Time.time + investigateDuration;
            locomotion.Stop(agent, onWalkEvent);
            status.SetNowState(EnemyStatus.EnemyState.Investigate);
            return true;
        }

        locomotion.MoveTo(...);
        return true;
    }

    if (Time.time >= investigateSearchEndTime)
    {
        Clear();
        return false;
    }

    locomotion.Stop(agent, onWalkEvent);
    status.SetNowState(EnemyStatus.EnemyState.Investigate);
    return true;
}
```

#### 설명

기존 구조는 조사 지점에 실제로 도착해야만 <code>investigateDuration</code>이 시작되었다.

그래서 조사 지점까지 못 가면 조사 상태가 길게 유지되고, 복귀 로직도 늦어지는 문제가 있었다.

이번 수정에서는 조사 상태를 두 단계로 분리했다.

1. 조사 지점까지 이동하는 제한 시간
2. 도착 후 제자리에서 조사하는 시간

이를 위해 <code>maxInvestigateMoveTime</code>과 <code>investigateMoveEndTime</code>을 추가하고, 일정 시간 안에 조사지점에 도달하지 못하면 조사 상태를 종료하고 복귀로 넘기도록 바꿨다.

#### 수정된 스크립트

```cs
[SerializeField] private float maxInvestigateMoveTime = 3.0f;
[NonSerialized] private float investigateMoveEndTime;

public bool TryRegisterNoise(...)
{
    ...
    hasInvestigateTarget = true;
    hasReachedInvestigatePoint = false;
    investigateSearchEndTime = 0.0f;
    investigateMoveEndTime = Time.time + maxInvestigateMoveTime;
    currentInvestigatePriority = stimulus.Priority;
    return true;
}

public bool Investigate(...)
{
    if (!hasReachedInvestigatePoint)
    {
        if (Time.time >= investigateMoveEndTime)
        {
            Clear();
            return false;
        }

        Vector3 destination = GetInvestigateDestination();
        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, destination);
        if (sqrDistance <= investigateStopDistanceSqr)
        {
            hasReachedInvestigatePoint = true;
            investigateSearchEndTime = Time.time + investigateDuration;
            locomotion.Stop(agent, onWalkEvent);
            status.SetNowState(EnemyStatus.EnemyState.Investigate);
            return true;
        }

        locomotion.MoveTo(...);
        return true;
    }

    if (Time.time >= investigateSearchEndTime)
    {
        Clear();
        return false;
    }

    locomotion.Stop(agent, onWalkEvent);
    status.SetNowState(EnemyStatus.EnemyState.Investigate);
    return true;
}
```

---

### 2.4 EnemyMemory.cs

- 대상 경로: \EnemyMemory.cs\

#### 이전 스크립트

```cs
[SerializeField] private Vector3 homePosition;
[SerializeField] private EnemyPatrolRoute patrolRoute;
[SerializeField, Min(0)] private int patrolIndex;
[SerializeField] private bool needsReturnToPatrol;
[SerializeField] private bool isWaitingAtPatrolPoint;
[SerializeField] private float patrolWaitUntilTime;

public void MarkNeedsReturnToPatrol()
{
    if (!HasPatrolRoute)
    {
        return;
    }

    needsReturnToPatrol = true;
    ClearPatrolWait();
}

public void ClearReturnToPatrol()
{
    needsReturnToPatrol = false;
}
```

#### 설명

기존 메모리는 “지금 어느 순찰 포인트를 보고 있는가”만 기억하고 있었다.

즉, 복귀가 필요하다는 사실은 기억했지만 “어디로 복귀해야 하는가”는 따로 저장하지 않았다.

그래서 복귀 기준이 항상 현재 순찰 포인트에 묶였고, 여러 적이 같은 루트를 공유할 때 복귀 지점이 겹쳐 뭉치는 문제가 발생했다.

이번 수정에서는 <code>이탈 시작 지점</code>을 기억하는 복귀 앵커 개념을 추가했다.

이제 메모리는 순찰 중 처음 이탈한 위치와 당시 순찰 인덱스를 함께 저장하고, 복귀 완료 후 그 인덱스로 순찰을 다시 이어갈 수 있게 되었다.

#### 수정된 스크립트

```cs
[SerializeField] private bool hasReturnAnchor;
[SerializeField] private Vector3 returnAnchorPosition;
[SerializeField, Min(0)] private int returnPatrolIndex;

public bool HasReturnAnchor => hasReturnAnchor;
public Vector3 ReturnAnchorPosition => hasReturnAnchor ? returnAnchorPosition : homePosition;

public void CaptureReturnAnchor(Vector3 currentPosition)
{
    if (!HasPatrolRoute || hasReturnAnchor)
    {
        return;
    }

    hasReturnAnchor = true;
    returnAnchorPosition = currentPosition;
    returnPatrolIndex = patrolIndex;
}

public void ClearReturnToPatrol()
{
    needsReturnToPatrol = false;
    hasReturnAnchor = false;
    returnAnchorPosition = homePosition;
    returnPatrolIndex = patrolIndex;
}

public void CompleteReturnToPatrol()
{
    if (HasPatrolRoute)
    {
        patrolIndex = Mathf.Clamp(returnPatrolIndex, 0, patrolRoute.GetPointCount() - 1);
    }

    ClearPatrolWait();
    ClearReturnToPatrol();
}
```

---

### 2.5 EnemyBrain.cs

- 대상 경로: \EnemyBrain.cs\

#### 이전 스크립트

```cs
if (currentTarget != null)
{
    noiseListener.Clear();
    memory.ClearReturnToPatrol();
    memory.ClearPatrolWait();
}

private bool HandleReturnToPatrol(...)
{
    Transform patrolPoint = memory.GetCurrentPatrolPoint();
    if (patrolPoint == null)
    {
        memory.ClearReturnToPatrol();
        return false;
    }

    if (locomotion.HasReachedDestination(self.position, patrolPoint.position, memory.GetPointReachDistance()))
    {
        locomotion.Stop(agent, onWalkEvent);
        status.SetNowState(EnemyStatus.EnemyState.Patrol);
        memory.ClearReturnToPatrol();
        memory.BeginPatrolWait();

        if (memory.HasCompletedPatrolWait())
        {
            memory.AdvancePatrolIndex();
        }

        return true;
    }

    locomotion.MoveTo(... patrolPoint.position ...);
    return true;
}
```

#### 설명

기존 구조는 플레이어를 다시 보면 복귀 정보를 바로 지우고, 복귀할 때도 현재 순찰 포인트로 돌아갔다.

즉, “복귀 상태”는 있었지만 “복귀 기준점”이 공유 순찰 포인트에 묶여 있었다.

이번 수정에서는 두 가지가 바뀌었다.

첫째, 플레이어를 다시 봤다고 해서 복귀 기준점 자체를 지우지 않도록 변경했다.

둘째, 실제 복귀 목적지를 <code>GetCurrentPatrolPoint()</code>가 아니라 <code>ReturnAnchorPosition</code>으로 바꾸었다.

이 변화로 적은 각자 순찰에서 벗어난 자리로 복귀하고, 복귀가 끝나면 저장된 순찰 인덱스로 다시 순찰을 이어갈 수 있게 되었다.

#### 수정된 스크립트

```cs
if (currentTarget != null)
{
    noiseListener.Clear();
    memory.ClearPatrolWait();
}

private void RefreshTarget(...)
{
    bool hadTarget = currentTarget != null;
    ...
    currentTarget = perception.FindVisibleTarget(self, players);
    if (currentTarget != null)
    {
        if (!hadTarget)
        {
            memory.CaptureReturnAnchor(self.position);
        }

        noiseListener.Clear();
        memory.ClearPatrolWait();
    }
}

private bool HandleReturnToPatrol(...)
{
    Vector3 returnDestination = memory.ReturnAnchorPosition;

    if (locomotion.HasReachedDestination(self.position, returnDestination, memory.GetPointReachDistance()))
    {
        locomotion.Stop(agent, onWalkEvent);
        status.SetNowState(EnemyStatus.EnemyState.Patrol);
        memory.CompleteReturnToPatrol();
        return true;
    }

    locomotion.MoveTo(... returnDestination ...);
    return true;
}
```

---

### 2.6 EnemyMovement.cs

- 대상 경로: \EnemyMovement.cs\

#### 이전 스크립트

```cs
bool hasRegisteredNoise = noiseListener.TryRegisterNoise(
    perception,
    transform.position,
    stimulus,
    brain.HasTarget,
    myStatus,
    out bool interruptedChase);

if (hasRegisteredNoise)
{
    memory.MarkNeedsReturnToPatrol();
}
```

#### 설명

기존 구조는 소리에 반응하면 “복귀가 필요하다”는 플래그만 세웠다.

하지만 이 시점에 어디서 순찰이 끊겼는지는 저장하지 않았다.

이번 수정에서는 소리에 처음 반응하는 순간 <code>CaptureReturnAnchor(transform.position)</code>을 호출해, 이탈 시작 위치를 복귀 기준점으로 저장하도록 바꾸었다.

또한 <code>TryRegisterNoise()</code>에 <code>transform.position</code>이 아니라 <code>transform</code>을 넘겨, 청각 차단 판정이 귀 위치 기준으로 동작하게 맞췄다.

#### 수정된 스크립트

```cs
bool hasRegisteredNoise = noiseListener.TryRegisterNoise(
    perception,
    transform,
    stimulus,
    brain.HasTarget,
    myStatus,
    out bool interruptedChase);

if (hasRegisteredNoise)
{
    memory.CaptureReturnAnchor(transform.position);
    memory.MarkNeedsReturnToPatrol();
}
```

---

### 2.7 SpawnManager.cs + EnemyStatus.cs + EnemyHealthUI.cs

- 대상 경로:\SpawnManager.cs\\EnemyStatus.cs\\EnemyHealthUI.cs\

#### 이전 스크립트

```cs
// SpawnManager
GameObject spawnedEnemy = Instantiate(EnemyPrefab, pointTransform.position, pointTransform.rotation);
GlobalRuntimeData.CountingEnemyData(spawnedEnemy);

// EnemyStatus
GlobalEventBus.OnEnemyHealthChanged?.Invoke(objID, hpCurrent, hpMax);

// EnemyHealthUI
private void OnEnable()
{
    GlobalEventBus.OnEnemyHealthChanged += UpdateHealthBar;
}

private void UpdateHealthBar(int id, float currentHp, float maxHp)
{
    hpBar.fillAmount = currentHp / maxHp;
}
```

#### 설명

기존에는 적 생성 시 개체 식별 번호와 UI 갱신 이벤트가 느슨하게 연결되어 있었다.

그래서 적 UI들이 같은 전역 이벤트를 함께 듣고, 한 적이 맞았을 때 여러 UI가 동시에 갱신되는 문제가 발생했다.

이번 수정에서는

- <code>SpawnManager</code>가 적 생성 직후 런타임 고유 번호를 다시 부여하고
- <code>EnemyStatus</code>가 자기 자신의 로컬 체력 이벤트를 발행하며
- <code>EnemyHealthUI</code>는 자기 부모 <code>EnemyStatus</code>만 구독하도록 바뀌었다.

즉, 개체 식별과 UI 반영이 <code>전역 공용 구조</code>에서 <code>개체별 로컬 구조</code>로 바뀐 것이다.

#### 수정된 스크립트

```cs
// SpawnManager
private static void AssignEnemyRuntimeIdentity(GameObject spawnedEnemy)
{
    int enemyRuntimeId = GlobalRuntimeData.CountingEnemyData(spawnedEnemy);

    if (spawnedEnemy.TryGetComponent(out EnemyStatus enemyStatus))
    {
        enemyStatus.SetRuntimeObjectId(enemyRuntimeId);
        return;
    }

    if (spawnedEnemy.TryGetComponent(out EntityIdentity identity))
    {
        identity.SetupIdentity(enemyRuntimeId, Faction.enemy);
    }
}

// EnemyStatus
public event Action<float, float> OnLocalHealthChanged;

private void BroadcastHealthChanged()
{
    OnLocalHealthChanged?.Invoke(hpCurrent, hpMax);
    GlobalEventBus.OnEnemyHealthChanged?.Invoke(objID, hpCurrent, hpMax);
}

// EnemyHealthUI
private void OnEnable()
{
    ownerStatus.OnLocalHealthChanged += UpdateHealthBar;
    UpdateHealthBar(ownerStatus.hpCurrent, ownerStatus.hpMax);
}

private void UpdateHealthBar(float currentHp, float maxHp)
{
    hpBar.fillAmount = currentHp / maxHp;
}
```

---

### 2.8 ExitPoint.cs

- 대상 경로: \ExitPoint.cs\

#### 이전 스크립트

```cs
private void Awake()
{
    timerOn += timer.GetTimer;
    timerCanvas.SetActive(false);
}

public void Interact()
{
    timerCanvas.SetActive(true);
    timerOn?.Invoke(escapeTime);
}
```

#### 설명

기존 구조는 <code>timerCanvas</code>가 반드시 인스펙터에 연결되어 있다는 전제였다.

그래서 씬 병합이나 테스트 씬 작업 중 참조가 빠지면 즉시 <code>UnassignedReferenceException</code>이 발생했다.

이번 수정에서는 자식 <code>EscapeTimer</code>를 자동 탐색하는 보정 함수와, null-safe 활성화 함수를 추가해 참조 누락 상황에서도 플레이가 완전히 막히지 않도록 바꾸었다.

#### 수정된 스크립트

```cs
private void Awake()
{
    ResolveTimerCanvasReference();
    timerOn += timer.GetTimer;
    SetTimerCanvasActive(false);
}

private void ResolveTimerCanvasReference()
{
    if (timerCanvas != null) return;

    EscapeTimer escapeTimer = GetComponentInChildren<EscapeTimer>(true);
    if (escapeTimer != null)
    {
        timerCanvas = escapeTimer.gameObject;
    }
}

private void SetTimerCanvasActive(bool isActive)
{
    if (timerCanvas == null) return;
    timerCanvas.SetActive(isActive);
}
```

---

## 3. 정리

이번 구현에서 구조적으로 가장 크게 바뀐 부분은 세 가지이다.

- 패트롤 테스트 씬도 기존 플레이 씬과 같은 세션으로 인식되도록 씬 판정을 확장한 것
- 적 복귀 기준을 공유 순찰 포인트에서 개별 이탈 시작 지점으로 바꾼 것
- 적 HP UI와 청각 감지 로직을 전역 공용 처리에서 개체별/상황별 처리로 정리한 것

즉, 이번 작업은 단순한 현상 수정이 아니라

<code>씬 연동</code>, <code>조사 종료 조건</code>, <code>복귀 기준점</code>, <code>개체 식별</code>, <code>청각 차단</code>, <code>UI 갱신 책임</code>을 각각 더 올바른 위치로 옮겨 놓은 구조 정리 작업이라고 볼 수 있다.
{% endraw %}
