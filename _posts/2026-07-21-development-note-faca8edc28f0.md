---
title: "2026-07-21_EnemyBrain_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyBrain.cs cs using System; using System.Collections.Generic; using UnityEngine; using UnityEngi"
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyBrain.cs cs using System; using System.Collections.Generic; using UnityEngine; using UnityEngi"
published: true
migration_id: "3a436532580e8128951afaca8edc28f0"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyBrain.cs</code>

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적 AI의 상위 의사결정 계층입니다.
/// 감지 결과와 현재 상태를 바탕으로 조사, 복귀, 순찰, 추적, 공격 중 무엇을 할지 결정합니다.
/// </summary>
[Serializable]
public class EnemyBrain
{
    [Header("Post Attack Stabilization")]
    [SerializeField, Min(0f)] private float postAttackDirectChaseTime = 0.6f; // 공격 직후 복귀/차단 이동보다 직접 추적을 우선할 시간
    [SerializeField, Min(0f)] private float postAttackRouteTolerance = 4.0f;  // 공격 돌진 직후 루트 반경 판정에 임시로 더해 줄 여유 거리

    [SerializeField] private float checkInterval = 0.2f;     // AI 판단 주기

    [Header("Chase Aggro And Leash")]
    [SerializeField, Min(1f)] private float maxAggro = 100f;                  // 추적을 완전히 유지하는 최대 어그로
    [SerializeField, Min(0f)] private float sightLossGraceTime = 1f;         // 시야가 끊겨도 어그로 감소를 유예하는 시간
    [SerializeField, Min(0f)] private float aggroDecayPerSecond = 25f;       // 일반 추적 구간에서 초당 감소하는 어그로
    [SerializeField, Min(0f)] private float aggroRecoveryPerSecond = 50f;    // 추적 허용 구간에서 타겟을 볼 때 초당 회복하는 어그로
    [SerializeField, Min(0f)] private float chaseLeashDistance = 16f;        // 루트에서 이 거리까지 새 추적과 어그로 회복을 허용
    [SerializeField, Min(0f)] private float hardReturnDistance = 24f;        // 루트에서 이 거리를 넘으면 시야와 무관하게 즉시 복귀

    [NonSerialized] private WaitForSeconds checkingDelay;     // 판단 루프에서 재사용할 대기 객체
    [NonSerialized] private Transform currentTarget;          // 현재 전투 타겟으로 유지 중인 플레이어
    [NonSerialized] private Transform aggroTarget;            // 디코이처럼 전투 타겟보다 우선해서 이동할 임시 어그로 타겟
    [NonSerialized] private float aggroEndTime;               // 강제 추적 종료 시간
    [NonSerialized] private float currentAggro;                    // 현재 추적 유지에 남아 있는 어그로
    [NonSerialized] private float sightLostStartTime = -1f;        // 시야가 최초로 끊긴 시각
```

```cs
[NonSerialized] private float lastTickTime;                     // 프레임 변화와 무관한 어그로 계산용 이전 판단 시각

/// <summary>
/// 지정한 타겟을 일정 시간 동안 강제 어그로 대상으로 등록합니다.
/// 실제 추적 갱신은 자기 순찰 루트의 추적 허용 구간 안에서만 이루어집니다.
/// </summary>
public void ApplyAggro(Transform target, float duration)
{
    aggroTarget = target;
    aggroEndTime = Time.time + duration;
}

public Transform CurrentTarget => currentTarget;
public bool HasTarget => currentTarget != null;

public void OnValidate()
{
    checkInterval = Mathf.Max(0.05f, checkInterval);
    maxAggro = Mathf.Max(1f, maxAggro);
    sightLossGraceTime = Mathf.Max(0f, sightLossGraceTime);
    aggroDecayPerSecond = Mathf.Max(0f, aggroDecayPerSecond);
    aggroRecoveryPerSecond = Mathf.Max(0f, aggroRecoveryPerSecond);
    chaseLeashDistance = Mathf.Max(0f, chaseLeashDistance);
    hardReturnDistance = Mathf.Max(chaseLeashDistance, hardReturnDistance);
    postAttackDirectChaseTime = Mathf.Max(0f, postAttackDirectChaseTime);
    postAttackRouteTolerance = Mathf.Max(0f, postAttackRouteTolerance);
    checkingDelay = new WaitForSeconds(checkInterval);
}

/// <summary>
/// 판단 루프에서 재사용할 WaitForSeconds를 반환합니다.
/// 코루틴 반복 시 객체를 계속 새로 만들지 않도록 캐시합니다.
/// </summary>
public WaitForSeconds GetCheckDelay()
{
    if (checkingDelay == null)
    {
        checkingDelay = new WaitForSeconds(checkInterval);
    }

    return checkingDelay;
}

/// <summary>
/// 현재 추적 타겟을 강제로 비웁니다.
/// 큰 소리 조사 등으로 추적을 끊어야 할 때 호출합니다.
/// </summary>
public void ClearTarget()
{
    currentTarget = null;
    currentAggro = 0f;
    sightLostStartTime = -1f;
}

/// <summary>
```

```cs
/// 현재 감지 결과를 바탕으로 적의 다음 행동을 결정합니다.
/// 우선순위는 공격/추적 -> 조사 -> 복귀 -> 순찰 -> 대기 순서입니다.
/// </summary>
public void Tick(
    MonoBehaviour host,
    Transform self,
    EnemyStatus status,
    NavMeshAgent agent,
    EnemyMemory memory,
    EnemyPerception perception,
    EnemyNoiseListener noiseListener,
    EnemyLocomotion locomotion,
    EnemyCombat combat,
    EnemyInterceptPlanner interceptPlanner,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent,
    Action onAttackEvent)
{
    float now = Time.time;
    float tickDelta = lastTickTime > 0f ? Mathf.Max(0f, now - lastTickTime) : checkInterval;
    lastTickTime = now;

    RefreshTarget(self, perception, noiseListener, memory, GlobalRuntimeData.GetPlayerList().Values);

    Transform priorityMoveTarget = ResolvePriorityMoveTarget(memory, self.position);
    if (priorityMoveTarget != null)
    {
        HandlePriorityMoveTarget(
            self,
            agent,
            status,
            memory,
            locomotion,
            priorityMoveTarget,
            onWalkEvent,
            onLookDirEvent);
        return;
    }

    if (currentTarget == null)
    {
        memory.ClearTargetTracking();
        memory.ClearChasePlan();

        if (noiseListener.Investigate(self, agent, locomotion, status, onWalkEvent, onLookDirEvent))
        {
            return;
        }

        if (HandleReturnToPatrol(self, agent, status, memory, locomotion, onWalkEvent, onLookDirEvent))
        {
            return;
        }

```

```cs
    if (HandlePatrol(self, agent, status, memory, locomotion, onWalkEvent, onLookDirEvent))
    {
        return;
    }

    locomotion.SetIdle(agent, status, onWalkEvent);
    return;
}

// 플레이어를 다시 보면 조사/복귀 흐름은 즉시 끊고 추적 정보로 전환합니다.
noiseListener.Clear();
memory.ClearPatrolWait();

float enemyRouteDistance = memory.GetClosestPatrolPointDistance(self.position);
float targetRouteDistance = memory.GetClosestPatrolPointDistance(currentTarget.position);
float farthestRouteDistance = Mathf.Max(enemyRouteDistance, targetRouteDistance);
bool isPostAttackRepositioning = combat.IsInPostAttackRepositionGrace(postAttackDirectChaseTime);
float effectiveChaseLeashDistance = chaseLeashDistance;
float effectiveHardReturnDistance = hardReturnDistance;

if (isPostAttackRepositioning)
{
    // 공격 돌진 직후에는 에너미가 루트 반경 밖으로 살짝 밀려날 수 있으므로
    // 아주 짧은 시간 동안만 복귀 판정 반경에 여유를 주고 전투 재정렬을 우선합니다.
    effectiveChaseLeashDistance += postAttackRouteTolerance;
    effectiveHardReturnDistance += postAttackRouteTolerance;
}

// 에너미 또는 타겟이 활동 한계를 넘으면 남은 어그로와 시야를 무시하고 즉시 복귀합니다.
if (memory.HasPatrolRoute && farthestRouteDistance > effectiveHardReturnDistance)
{
    StopChaseAndReturn(self.position, agent, status, memory, locomotion, onWalkEvent);
    return;
}

bool isInsideChaseArea = !memory.HasPatrolRoute || farthestRouteDistance <= effectiveChaseLeashDistance;
float sqrDistToTarget = EnemyMathUtility.GetPlanarSqrDistance(self.position, currentTarget.position);
bool canSeeTarget = perception.CanSeeTrackedTarget(self, currentTarget);
```

```cs
bool canMaintainCloseCombatTarget =
    isInsideChaseArea &&
    combat.IsWithinCloseCombatAwareness(sqrDistToTarget) &&
    perception.HasClearLineOfSight(self, currentTarget);
bool canReacquireAfterAttack =
    isPostAttackRepositioning &&
    isInsideChaseArea &&
    perception.HasClearLineOfSight(self, currentTarget);
bool hasTargetAwareness = canSeeTarget || canMaintainCloseCombatTarget || canReacquireAfterAttack;

if (hasTargetAwareness && isInsideChaseArea)
{
    memory.UpdateTargetTracking(currentTarget);
    sightLostStartTime = -1f;
    currentAggro = Mathf.Min(maxAggro, currentAggro + aggroRecoveryPerSecond * tickDelta);

    // 근접 교전에서는 이동 속도가 거의 0이어도 플레이어를 향해 회전해
    // 원형 이동 중 공격 시야가 영구적으로 끊기지 않게 합니다.
    if (canMaintainCloseCombatTarget || canReacquireAfterAttack)
    {
        locomotion.FacePosition(self, currentTarget.position, onLookDirEvent);
    }
}
else if (!isInsideChaseArea)
{
    // 완충 구간에서는 타겟이 보여도 어그로를 회복하지 않고 빠르게 소진합니다.
    // 이때 새 위치 샘플도 저장하지 않아 루트 바깥으로 추적 목적지가 계속 늘어나는 것을 막습니다.
    sightLostStartTime = sightLostStartTime < 0f ? now : sightLostStartTime;
    currentAggro = Mathf.Max(0f, currentAggro - aggroDecayPerSecond * 2f * tickDelta);
}
else
{
    if (sightLostStartTime < 0f)
    {
        sightLostStartTime = now;
    }

    if (now - sightLostStartTime >= sightLossGraceTime)
    {
        currentAggro = Mathf.Max(0f, currentAggro - aggroDecayPerSecond * tickDelta);
    }
}

if (currentAggro <= 0f)
{
```

```cs
        StopChaseAndReturn(self.position, agent, status, memory, locomotion, onWalkEvent);
        return;
    }

    if (status.isAttacking)
    {
        memory.ClearChasePlan();
        return;
    }

    if (hasTargetAwareness && isInsideChaseArea && combat.CanStartAttack(sqrDistToTarget))
    {
        memory.ClearChasePlan();
        locomotion.Stop(agent, onWalkEvent);
        host.StartCoroutine(combat.RunCombo(
            self,
            currentTarget,
            agent,
            status,
            locomotion,
            onWalkEvent,
            onLookDirEvent,
            onAttackEvent));
        return;
    }

    {
        Vector3 chaseDestination = hasTargetAwareness && isInsideChaseArea
            ? currentTarget.position
            : memory.LastKnownTargetPosition;
        EnemyMemory.ChaseMoveMode chaseMoveMode = EnemyMemory.ChaseMoveMode.Direct;

        if (!isPostAttackRepositioning && canSeeTarget && isInsideChaseArea && interceptPlanner != null &&
            interceptPlanner.TryPlanIntercept(self, currentTarget, memory, out Vector3 interceptDestination))
        {
            chaseDestination = interceptDestination;
            chaseMoveMode = EnemyMemory.ChaseMoveMode.Intercept;
        }

        memory.SetChasePlan(chaseMoveMode, chaseDestination);
        locomotion.MoveTo(
            self,
            agent,
            chaseDestination,
            status,
            EnemyStatus.EnemyState.Chase,
            onWalkEvent,
            onLookDirEvent);
        return;
    }
}

/// <summary>
/// 디코이처럼 전투 타겟보다 우선해서 따라갈 임시 이동 타겟을 반환합니다.
```

```cs
/// 지속 시간이 끝났거나 활동 반경 밖으로 벗어난 디코이는 즉시 정리합니다.
/// </summary>
private Transform ResolvePriorityMoveTarget(EnemyMemory memory, Vector3 selfPosition)
{
    if (aggroTarget == null)
    {
        return null;
    }

    if (Time.time >= aggroEndTime || !IsInsideChaseArea(memory, selfPosition, aggroTarget.position))
    {
        aggroTarget = null;
        return null;
    }

    return aggroTarget;
}

/// <summary>
/// 디코이 타겟이 살아 있는 동안에는 플레이어 전투 타겟을 지우지 않고 이동 목표만 디코이로 우선 전환합니다.
/// 디코이는 공격 대상이 아니므로 공격 코루틴을 시작하지 않고, 종료 후에는 보존된 플레이어 타겟으로 자연스럽게 복귀합니다.
/// </summary>
private void HandlePriorityMoveTarget(
    Transform self,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Transform priorityMoveTarget,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent)
{
    if (priorityMoveTarget == null)
    {
        return;
    }

    currentAggro = maxAggro;
    sightLostStartTime = -1f;

    memory.ClearPatrolWait();
    memory.SetChasePlan(EnemyMemory.ChaseMoveMode.Direct, priorityMoveTarget.position);

    locomotion.MoveTo(
        self,
        agent,
        priorityMoveTarget.position,
        status,
        EnemyStatus.EnemyState.Chase,
        onWalkEvent,
        onLookDirEvent);
}

/// <summary>
/// 현재 추적 정보를 모두 정리하고 현 위치에서 가장 가까운 자기 순찰 포인트로 복귀를 예약합니다.
/// </summary>
private void StopChaseAndReturn(
    Vector3 currentPosition,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Action<bool> onWalkEvent)
{
```

```cs
    currentTarget = null;
    currentAggro = 0f;
    sightLostStartTime = -1f;
    memory.ClearTargetTracking();
    memory.ClearChasePlan();
    memory.MarkNeedsReturnToPatrol(currentPosition);
    locomotion.SetIdle(agent, status, onWalkEvent);
}

/// <summary>
/// 기존 타겟을 계속 유지할지, 새로 시야에 들어온 플레이어를 찾을지 결정합니다.
/// 강제 조사 중에는 즉시 시야 재획득하지 않도록 조사 모듈의 차단 규칙을 우선 적용합니다.
/// </summary>
private void RefreshTarget(
    Transform self,
    EnemyPerception perception,
    EnemyNoiseListener noiseListener,
    EnemyMemory memory,
    ICollection<GameObject> players)
{
    // 현재 플레이어가 사망하거나 탈출했다면 기존 어그로와 추적 기억을 즉시 제거합니다.
    // 이후 같은 틱에서 다른 생존 플레이어를 다시 탐색하므로 멀티플레이에서도 시체를 계속 점유하지 않습니다.
    if (currentTarget != null && !EnemyPerception.IsTargetAvailable(currentTarget))
    {
        currentTarget = null;
        currentAggro = 0.0f;
        sightLostStartTime = -1.0f;
        memory.ClearTargetTracking();
        memory.ClearChasePlan();
    }

    bool hadTarget = currentTarget != null;

    // 디코이 어그로는 전투 타겟을 덮어쓰지 않고 이동 우선순위로만 사용합니다.
    // 기존 플레이어 타겟을 보존해야 디코이 종료 후 바로 다시 전투 타겟으로 복귀할 수 있습니다.
    ResolvePriorityMoveTarget(memory, self.position);

    if (noiseListener.ShouldBlockSightReacquire())
    {
        currentTarget = null;
        return;
    }

    if (currentTarget != null)
    {
        return;
    }

    // 복귀 완충 구간에서는 새 타겟을 획득하지 않아 복귀와 재추적이 매 틱 반복되는 현상을 막습니다.
    if (!IsInsideChaseArea(memory, self.position))
    {
        return;
    }

    currentTarget = perception.FindVisibleTarget(self, players);
```

```cs
    if (currentTarget != null && !IsInsideChaseArea(memory, self.position, currentTarget.position))
    {
        currentTarget = null;
    }

    if (currentTarget != null)
    {
        currentAggro = maxAggro;
        sightLostStartTime = -1f;
        // 순찰이나 복귀 상태에서 처음 전투로 전환될 때만 복귀 기준점을 저장합니다.
        if (!hadTarget)
        {
            memory.CaptureReturnAnchor(self.position);
        }

        noiseListener.Clear();
        memory.ClearPatrolWait();
    }
}

/// <summary>
/// 에너미와 선택적 타겟이 모두 자기 순찰 루트의 추적 허용 반경 안에 있는지 확인합니다.
/// 루트가 없는 기존 에너미는 이전 동작을 유지하도록 거리 제한을 적용하지 않습니다.
/// </summary>
private bool IsInsideChaseArea(EnemyMemory memory, Vector3 enemyPosition, Vector3? targetPosition = null)
{
    if (memory == null || !memory.HasPatrolRoute)
    {
        return true;
    }

    if (memory.GetClosestPatrolPointDistance(enemyPosition) > chaseLeashDistance)
    {
        return false;
    }

    return !targetPosition.HasValue ||
           memory.GetClosestPatrolPointDistance(targetPosition.Value) <= chaseLeashDistance;
}

/// <summary>
/// 조사나 추적이 끝난 뒤 현재 순찰 이탈 기준점으로 복귀합니다.
/// 복귀가 끝나면 다시 Patrol 상태로 돌아가 직전 순찰 흐름을 이어갑니다.
/// </summary>
private bool HandleReturnToPatrol(
    Transform self,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent)
{
    if (memory == null || !memory.NeedsReturnToPatrol || !memory.HasPatrolRoute)
    {
        return false;
    }

    Vector3 returnDestination = memory.ReturnAnchorPosition;
```

```cs
    if (locomotion.HasReachedDestination(self.position, returnDestination, memory.GetPointReachDistance()))
    {
        locomotion.Stop(agent, onWalkEvent);
        status.SetNowState(EnemyStatus.EnemyState.Patrol);
        memory.CompleteReturnToPatrol();
        return true;
    }

    memory.ClearPatrolWait();
    locomotion.MoveTo(
        self,
        agent,
        returnDestination,
        status,
        EnemyStatus.EnemyState.Return,
        onWalkEvent,
        onLookDirEvent);
    return true;
}

/// <summary>
/// 타겟도 조사 상태도 없을 때 기본 순찰 루트를 따라 이동합니다.
/// 포인트에 도착하면 설정된 시간만큼 대기한 뒤 다음 포인트로 넘어갑니다.
/// </summary>
private bool HandlePatrol(
    Transform self,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent)
{
    if (memory == null || !memory.HasPatrolRoute)
    {
        return false;
    }

    Transform patrolPoint = memory.GetCurrentPatrolPoint();
    if (patrolPoint == null)
    {
        return false;
    }

    if (!memory.HasPatrolDestination && !memory.TryCreatePatrolDestination(agent))
    {
        locomotion.SetIdle(agent, status, onWalkEvent);
        return true;
    }

    Vector3 patrolDestination = memory.PatrolDestination;
    if (locomotion.HasReachedDestination(self.position, patrolDestination, memory.GetPointReachDistance()))
    {
        locomotion.Stop(agent, onWalkEvent);
        status.SetNowState(EnemyStatus.EnemyState.Patrol);

        if (!memory.IsWaitingAtPatrolPoint)
        {
```

```cs
                memory.BeginPatrolWait(memory.GetRandomPatrolWaitTime());
                return true;
            }

            if (memory.HasCompletedPatrolWait())
            {
                memory.ClearPatrolWait();
                memory.CompleteWanderDestination();
                if (memory.ShouldAdvancePatrolPoint)
                {
                    memory.AdvanceToRandomNearbyPoint();
                }
            }

            return true;
        }

        memory.ClearPatrolWait();
        locomotion.MoveTo(
            self,
            agent,
            patrolDestination,
            status,
            EnemyStatus.EnemyState.Patrol,
            onWalkEvent,
            onLookDirEvent);
        return true;
    }
}

```

## 2. 변경 설명

실제 피해를 받은 순간 활동 반경 안의 플레이어를 전투 타겟으로 등록하고 어그로와 추적 메모리를 갱신하도록 보강했습니다. 디코이 이동 타겟은 별도로 유지해 디코이 종료 후 전투 타겟으로 자연스럽게 복귀합니다. 또한 가까운 추격에서 개체 ID별로 플레이어 주변 접근 슬롯을 계산하고, NavMesh 샘플·직선 차단·완전 경로·활동 반경을 검증한 위치만 목적지로 사용합니다. 공격 쿨다운 중에는 설정에 따라 공격 거리 안에서 정지해 여러 적이 플레이어 중심에 포개지는 현상을 줄입니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyBrain.cs</code>

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적 AI의 상위 의사결정 계층입니다.
/// 감지 결과와 현재 상태를 바탕으로 조사, 복귀, 순찰, 추적, 공격 중 무엇을 할지 결정합니다.
/// </summary>
[Serializable]
public class EnemyBrain
{
    [Header("Post Attack Stabilization")]
    [SerializeField, Min(0f)] private float postAttackDirectChaseTime = 0.6f; // 공격 직후 복귀/차단 이동보다 직접 추적을 우선할 시간
    [SerializeField, Min(0f)] private float postAttackRouteTolerance = 4.0f;  // 공격 돌진 직후 루트 반경 판정에 임시로 더해 줄 여유 거리

    [SerializeField] private float checkInterval = 0.2f;     // AI 판단 주기

    [Header("Chase Aggro And Leash")]
    [SerializeField, Min(1f)] private float maxAggro = 100f;                  // 추적을 완전히 유지하는 최대 어그로
    [SerializeField, Min(0f)] private float sightLossGraceTime = 1f;         // 시야가 끊겨도 어그로 감소를 유예하는 시간
    [SerializeField, Min(0f)] private float aggroDecayPerSecond = 25f;       // 일반 추적 구간에서 초당 감소하는 어그로
    [SerializeField, Min(0f)] private float aggroRecoveryPerSecond = 50f;    // 추적 허용 구간에서 타겟을 볼 때 초당 회복하는 어그로
    [SerializeField, Min(0f)] private float chaseLeashDistance = 16f;        // 루트에서 이 거리까지 새 추적과 어그로 회복을 허용
    [SerializeField, Min(0f)] private float hardReturnDistance = 24f;        // 루트에서 이 거리를 넘으면 시야와 무관하게 즉시 복귀

    [Header("Chase Crowd Spacing")]
    [SerializeField] private bool enableDistributedApproach = false;                    // 플레이어 추격에만 개체별 접근 지점을 사용할지 여부
    [SerializeField, Min(0.1f)] private float distributedApproachRadius = 4.0f;          // 플레이어 중심에서 각 접근 지점까지의 거리
    [SerializeField, Min(0.1f)] private float distributedApproachActivationDistance = 10.0f; // 가까운 추격에서 접근 지점 분산을 시작할 거리
    [SerializeField, Range(2, 32)] private int distributedApproachSlotCount = 16;        // 플레이어 주변에 분산할 접근 지점 수
```

```cs
[SerializeField, Min(0.1f)] private float distributedApproachSampleDistance = 1.5f;  // 접근 지점을 NavMesh 위로 보정할 탐색 거리
[SerializeField, Min(0.05f)] private float distributedApproachReachDistance = 0.5f;  // 접근 슬롯에 도착했다고 판단할 평면 거리
[SerializeField] private bool holdInsideAttackRangeDuringCooldown = false;          // 공격 쿨다운 중 플레이어 중심으로 더 파고들지 않고 정지할지 여부

[NonSerialized] private WaitForSeconds checkingDelay;     // 판단 루프에서 재사용할 대기 객체
[NonSerialized] private Transform currentTarget;          // 현재 전투 타겟으로 유지 중인 플레이어
[NonSerialized] private Transform aggroTarget;            // 디코이처럼 전투 타겟보다 우선해서 이동할 임시 어그로 타겟
[NonSerialized] private float aggroEndTime;               // 강제 추적 종료 시간
[NonSerialized] private float currentAggro;                    // 현재 추적 유지에 남아 있는 어그로
[NonSerialized] private float sightLostStartTime = -1f;        // 시야가 최초로 끊긴 시각
[NonSerialized] private float lastTickTime;                     // 프레임 변화와 무관한 어그로 계산용 이전 판단 시각
[NonSerialized] private NavMeshPath distributedApproachPath;    // 접근 슬롯의 경로 유효성 검사에 재사용할 NavMesh 경로

/// <summary>
/// 지정한 타겟을 일정 시간 동안 강제 어그로 대상으로 등록합니다.
/// 실제 추적 갱신은 자기 순찰 루트의 추적 허용 구간 안에서만 이루어집니다.
/// </summary>
public void ApplyAggro(Transform target, float duration)
{
    aggroTarget = target;
    aggroEndTime = Time.time + duration;
}

public Transform CurrentTarget => currentTarget;
public bool HasTarget => currentTarget != null;

public void OnValidate()
{
    checkInterval = Mathf.Max(0.05f, checkInterval);
    maxAggro = Mathf.Max(1f, maxAggro);
    sightLossGraceTime = Mathf.Max(0f, sightLossGraceTime);
    aggroDecayPerSecond = Mathf.Max(0f, aggroDecayPerSecond);
```

```cs
    aggroRecoveryPerSecond = Mathf.Max(0f, aggroRecoveryPerSecond);
    chaseLeashDistance = Mathf.Max(0f, chaseLeashDistance);
    hardReturnDistance = Mathf.Max(chaseLeashDistance, hardReturnDistance);
    distributedApproachRadius = Mathf.Max(0.1f, distributedApproachRadius);
    distributedApproachActivationDistance = Mathf.Max(distributedApproachRadius, distributedApproachActivationDistance);
    distributedApproachSlotCount = Mathf.Clamp(distributedApproachSlotCount, 2, 32);
    distributedApproachSampleDistance = Mathf.Max(0.1f, distributedApproachSampleDistance);
    distributedApproachReachDistance = Mathf.Max(0.05f, distributedApproachReachDistance);
    postAttackDirectChaseTime = Mathf.Max(0f, postAttackDirectChaseTime);
    postAttackRouteTolerance = Mathf.Max(0f, postAttackRouteTolerance);
    checkingDelay = new WaitForSeconds(checkInterval);
}

/// <summary>
/// 판단 루프에서 재사용할 WaitForSeconds를 반환합니다.
/// 코루틴 반복 시 객체를 계속 새로 만들지 않도록 캐시합니다.
/// </summary>
public WaitForSeconds GetCheckDelay()
{
    if (checkingDelay == null)
    {
        checkingDelay = new WaitForSeconds(checkInterval);
    }

    return checkingDelay;
}

/// <summary>
/// 현재 추적 타겟을 강제로 비웁니다.
/// 큰 소리 조사 등으로 추적을 끊어야 할 때 호출합니다.
/// </summary>
public void ClearTarget()
{
    currentTarget = null;
    currentAggro = 0f;
    sightLostStartTime = -1f;
}

/// <summary>
/// 실제 피해를 받은 순간 플레이어를 전투 타겟으로 등록합니다.
/// 디코이 이동 타겟은 별도로 보존하므로 디코이가 끝난 뒤 이 전투 타겟으로 자연스럽게 복귀합니다.
/// </summary>
public bool TryAcquireCombatTargetFromDamage(
    Transform self,
    Transform damageTarget,
    EnemyMemory memory,
```

```cs
    EnemyNoiseListener noiseListener)
{
    if (self == null || memory == null || !EnemyPerception.IsTargetAvailable(damageTarget))
    {
        return false;
    }

    bool hadTarget = EnemyPerception.IsTargetAvailable(currentTarget);
    Transform resolvedTarget = hadTarget
        ? currentTarget
        : damageTarget;

    // 피격 반응도 자기 활동 범위 안에서만 허용해 원거리 공격으로 복귀 규칙이 무너지지 않게 합니다.
    if (!IsInsideChaseArea(memory, self.position, resolvedTarget.position))
    {
        return false;
    }

    currentTarget = resolvedTarget;
    currentAggro = maxAggro;
    sightLostStartTime = -1f;

    if (!hadTarget)
    {
        memory.CaptureReturnAnchor(self.position);
    }

    memory.UpdateTargetTracking(currentTarget);
    memory.ClearPatrolWait();
    memory.ClearChasePlan();

    // 강제 조사만 해제하며, EnemyBrain이 별도로 보관하는 디코이 우선 타겟은 유지합니다.
    noiseListener?.Clear();
    return true;
}

/// <summary>
/// 현재 감지 결과를 바탕으로 적의 다음 행동을 결정합니다.
/// 우선순위는 공격/추적 -> 조사 -> 복귀 -> 순찰 -> 대기 순서입니다.
/// </summary>
public void Tick(
    MonoBehaviour host,
    Transform self,
    EnemyStatus status,
    NavMeshAgent agent,
    EnemyMemory memory,
    EnemyPerception perception,
    EnemyNoiseListener noiseListener,
    EnemyLocomotion locomotion,
    EnemyCombat combat,
    EnemyInterceptPlanner interceptPlanner,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent,
    Action onAttackEvent)
{
    float now = Time.time;
    float tickDelta = lastTickTime > 0f ? Mathf.Max(0f, now - lastTickTime) : checkInterval;
    lastTickTime = now;

```

```cs
RefreshTarget(self, perception, noiseListener, memory, GlobalRuntimeData.GetPlayerList().Values);

Transform priorityMoveTarget = ResolvePriorityMoveTarget(memory, self.position);
if (priorityMoveTarget != null)
{
    HandlePriorityMoveTarget(
        self,
        agent,
        status,
        memory,
        locomotion,
        priorityMoveTarget,
        onWalkEvent,
        onLookDirEvent);
    return;
}

if (currentTarget == null)
{
    memory.ClearTargetTracking();
    memory.ClearChasePlan();

    if (noiseListener.Investigate(self, agent, locomotion, status, onWalkEvent, onLookDirEvent))
    {
        return;
    }

    if (HandleReturnToPatrol(self, agent, status, memory, locomotion, onWalkEvent, onLookDirEvent))
    {
        return;
    }

    if (HandlePatrol(self, agent, status, memory, locomotion, onWalkEvent, onLookDirEvent))
    {
        return;
    }

    locomotion.SetIdle(agent, status, onWalkEvent);
    return;
}

// 플레이어를 다시 보면 조사/복귀 흐름은 즉시 끊고 추적 정보로 전환합니다.
noiseListener.Clear();
memory.ClearPatrolWait();

float enemyRouteDistance = memory.GetClosestPatrolPointDistance(self.position);
float targetRouteDistance = memory.GetClosestPatrolPointDistance(currentTarget.position);
float farthestRouteDistance = Mathf.Max(enemyRouteDistance, targetRouteDistance);
bool isPostAttackRepositioning = combat.IsInPostAttackRepositionGrace(postAttackDirectChaseTime);
float effectiveChaseLeashDistance = chaseLeashDistance;
```

```cs
float effectiveHardReturnDistance = hardReturnDistance;

if (isPostAttackRepositioning)
{
    // 공격 돌진 직후에는 에너미가 루트 반경 밖으로 살짝 밀려날 수 있으므로
    // 아주 짧은 시간 동안만 복귀 판정 반경에 여유를 주고 전투 재정렬을 우선합니다.
    effectiveChaseLeashDistance += postAttackRouteTolerance;
    effectiveHardReturnDistance += postAttackRouteTolerance;
}

// 에너미 또는 타겟이 활동 한계를 넘으면 남은 어그로와 시야를 무시하고 즉시 복귀합니다.
if (memory.HasPatrolRoute && farthestRouteDistance > effectiveHardReturnDistance)
{
    StopChaseAndReturn(self.position, agent, status, memory, locomotion, onWalkEvent);
    return;
}

bool isInsideChaseArea = !memory.HasPatrolRoute || farthestRouteDistance <= effectiveChaseLeashDistance;
float sqrDistToTarget = EnemyMathUtility.GetPlanarSqrDistance(self.position, currentTarget.position);
bool canSeeTarget = perception.CanSeeTrackedTarget(self, currentTarget);
bool canMaintainCloseCombatTarget =
    isInsideChaseArea &&
    combat.IsWithinCloseCombatAwareness(sqrDistToTarget) &&
    perception.HasClearLineOfSight(self, currentTarget);
bool canReacquireAfterAttack =
    isPostAttackRepositioning &&
    isInsideChaseArea &&
    perception.HasClearLineOfSight(self, currentTarget);
bool hasTargetAwareness = canSeeTarget || canMaintainCloseCombatTarget || canReacquireAfterAttack;

if (hasTargetAwareness && isInsideChaseArea)
{
    memory.UpdateTargetTracking(currentTarget);
    sightLostStartTime = -1f;
    currentAggro = Mathf.Min(maxAggro, currentAggro + aggroRecoveryPerSecond * tickDelta);

    // 근접 교전에서는 이동 속도가 거의 0이어도 플레이어를 향해 회전해
```

```cs
    // 원형 이동 중 공격 시야가 영구적으로 끊기지 않게 합니다.
    if (canMaintainCloseCombatTarget || canReacquireAfterAttack)
    {
        locomotion.FacePosition(self, currentTarget.position, onLookDirEvent);
    }
}
else if (!isInsideChaseArea)
{
    // 완충 구간에서는 타겟이 보여도 어그로를 회복하지 않고 빠르게 소진합니다.
    // 이때 새 위치 샘플도 저장하지 않아 루트 바깥으로 추적 목적지가 계속 늘어나는 것을 막습니다.
    sightLostStartTime = sightLostStartTime < 0f ? now : sightLostStartTime;
    currentAggro = Mathf.Max(0f, currentAggro - aggroDecayPerSecond * 2f * tickDelta);
}
else
{
    if (sightLostStartTime < 0f)
    {
        sightLostStartTime = now;
    }

    if (now - sightLostStartTime >= sightLossGraceTime)
    {
        currentAggro = Mathf.Max(0f, currentAggro - aggroDecayPerSecond * tickDelta);
    }
}

if (currentAggro <= 0f)
{
    StopChaseAndReturn(self.position, agent, status, memory, locomotion, onWalkEvent);
    return;
}

if (status.isAttacking)
{
    memory.ClearChasePlan();
    return;
}

Vector3 distributedDestination = default;
bool hasDistributedApproach =
    hasTargetAwareness &&
    isInsideChaseArea &&
    TryResolveDistributedApproachDestination(
        self,
        status,
        agent,
        memory,
        currentTarget.position,
        out distributedDestination);

bool hasReachedDistributedApproach =
    hasDistributedApproach &&
    locomotion.HasReachedDestination(
        self.position,
```

```cs
        distributedDestination,
        distributedApproachReachDistance);

// NavMesh 보정으로 슬롯이 공격 거리 밖에 잡혔다면 직접 추격으로 전환해 슬롯에서 멈추지 않게 합니다.
if (hasReachedDistributedApproach && !combat.IsWithinAttackStartRange(sqrDistToTarget))
{
    hasDistributedApproach = false;
    hasReachedDistributedApproach = false;
}

if (hasTargetAwareness && isInsideChaseArea && combat.CanStartAttack(sqrDistToTarget))
{
    memory.ClearChasePlan();
    locomotion.Stop(agent, onWalkEvent);
    host.StartCoroutine(combat.RunCombo(
        self,
        currentTarget,
        agent,
        status,
        locomotion,
        onWalkEvent,
        onLookDirEvent,
        onAttackEvent));
    return;
}

// 공격 후 쿨다운에는 자기 접근 슬롯으로 재정렬해 돌진이 끝난 지점에 여러 개체가 포개지지 않게 합니다.
if (hasDistributedApproach && !hasReachedDistributedApproach)
{
    memory.SetChasePlan(EnemyMemory.ChaseMoveMode.Direct, distributedDestination);
    locomotion.MoveTo(
        self,
        agent,
        distributedDestination,
        status,
        EnemyStatus.EnemyState.Chase,
        onWalkEvent,
        onLookDirEvent);
    return;
}

// 공격 쿨다운 중에는 이미 확보한 공격 거리에서 정지해 플레이어 중심으로 포개지지 않게 합니다.
if (holdInsideAttackRangeDuringCooldown && hasTargetAwareness && isInsideChaseArea &&
    combat.IsWithinAttackStartRange(sqrDistToTarget))
{
    memory.ClearChasePlan();
    locomotion.Stop(agent, onWalkEvent);
    status.SetNowState(EnemyStatus.EnemyState.Chase);
```

```cs
        locomotion.FacePosition(self, currentTarget.position, onLookDirEvent);
        return;
    }

    {
        Vector3 chaseDestination = hasTargetAwareness && isInsideChaseArea
            ? currentTarget.position
            : memory.LastKnownTargetPosition;
        EnemyMemory.ChaseMoveMode chaseMoveMode = EnemyMemory.ChaseMoveMode.Direct;

        if (!isPostAttackRepositioning && canSeeTarget && isInsideChaseArea && interceptPlanner != null &&
            interceptPlanner.TryPlanIntercept(self, currentTarget, memory, out Vector3 interceptDestination))
        {
            chaseDestination = interceptDestination;
            chaseMoveMode = EnemyMemory.ChaseMoveMode.Intercept;
        }

        // 접근 슬롯에 도착한 틱에서도 플레이어가 움직였다면 최신 슬롯 위치를 추적 목적지로 유지합니다.
        if (hasDistributedApproach)
        {
            chaseDestination = distributedDestination;
            chaseMoveMode = EnemyMemory.ChaseMoveMode.Direct;
        }

        memory.SetChasePlan(chaseMoveMode, chaseDestination);
        locomotion.MoveTo(
            self,
            agent,
            chaseDestination,
            status,
            EnemyStatus.EnemyState.Chase,
            onWalkEvent,
            onLookDirEvent);
        return;
    }
}

/// <summary>
/// 전투 타겟 주변의 개체별 접근 슬롯을 계산하고 실제로 도달 가능한 NavMesh 위치만 반환합니다.
/// 디코이, 마지막 확인 위치, 조사, 순찰, 복귀 목적지에는 호출하지 않아 각 목적지 체계를 분리합니다.
/// </summary>
private bool TryResolveDistributedApproachDestination(
    Transform self,
    EnemyStatus status,
    NavMeshAgent agent,
    EnemyMemory memory,
    Vector3 targetPosition,
    out Vector3 destination)
{
```

```cs
destination = targetPosition;

if (!enableDistributedApproach || self == null || status == null || agent == null || memory == null ||
    !agent.enabled || !agent.isOnNavMesh)
{
    return false;
}

float activationDistanceSqr = distributedApproachActivationDistance * distributedApproachActivationDistance;
if (EnemyMathUtility.GetPlanarSqrDistance(self.position, targetPosition) > activationDistanceSqr)
{
    return false;
}

int identitySeed = status.objID > 0 ? status.objID : self.GetInstanceID();
int positiveSeed = identitySeed & int.MaxValue;
int slotIndex = (int)(((long)positiveSeed * 7L) % distributedApproachSlotCount);
float slotAngle = slotIndex * (Mathf.PI * 2.0f / distributedApproachSlotCount);
Vector3 slotOffset = new Vector3(Mathf.Cos(slotAngle), 0.0f, Mathf.Sin(slotAngle)) * distributedApproachRadius;
Vector3 slotCandidate = targetPosition + slotOffset;

if (!NavMesh.SamplePosition(
        slotCandidate,
        out NavMeshHit navHit,
        distributedApproachSampleDistance,
        agent.areaMask))
{
    return false;
}

// 타겟이 루트 경계 가까이에 있어도 접근 슬롯 자체가 활동 반경 밖으로 튀어나가지 않게 합니다.
if (!IsInsideChaseArea(memory, self.position, navHit.position))
{
    return false;
}

// 얇은 벽 반대편 슬롯은 경로가 완성되더라도 큰 우회 이동을 만들 수 있으므로 직선 NavMesh 연결을 확인합니다.
if (NavMesh.SamplePosition(
        targetPosition,
        out NavMeshHit targetNavHit,
        distributedApproachSampleDistance,
        agent.areaMask) &&
```

```cs
        NavMesh.Raycast(targetNavHit.position, navHit.position, out NavMeshHit blockedHit, agent.areaMask))
    {
        return false;
    }

    if (distributedApproachPath == null)
    {
        distributedApproachPath = new NavMeshPath();
    }

    if (!agent.CalculatePath(navHit.position, distributedApproachPath) ||
        distributedApproachPath.status != NavMeshPathStatus.PathComplete)
    {
        return false;
    }

    destination = navHit.position;
    return true;
}

/// <summary>
/// 디코이처럼 전투 타겟보다 우선해서 따라갈 임시 이동 타겟을 반환합니다.
/// 지속 시간이 끝났거나 활동 반경 밖으로 벗어난 디코이는 즉시 정리합니다.
/// </summary>
private Transform ResolvePriorityMoveTarget(EnemyMemory memory, Vector3 selfPosition)
{
    if (aggroTarget == null)
    {
        return null;
    }

    if (Time.time >= aggroEndTime || !IsInsideChaseArea(memory, selfPosition, aggroTarget.position))
    {
        aggroTarget = null;
        return null;
    }

    return aggroTarget;
}

/// <summary>
/// 디코이 타겟이 살아 있는 동안에는 플레이어 전투 타겟을 지우지 않고 이동 목표만 디코이로 우선 전환합니다.
/// 디코이는 공격 대상이 아니므로 공격 코루틴을 시작하지 않고, 종료 후에는 보존된 플레이어 타겟으로 자연스럽게 복귀합니다.
/// </summary>
private void HandlePriorityMoveTarget(
    Transform self,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Transform priorityMoveTarget,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent)
{
    if (priorityMoveTarget == null)
    {
        return;
    }

    currentAggro = maxAggro;
    sightLostStartTime = -1f;

    memory.ClearPatrolWait();
```

```cs
    memory.SetChasePlan(EnemyMemory.ChaseMoveMode.Direct, priorityMoveTarget.position);

    locomotion.MoveTo(
        self,
        agent,
        priorityMoveTarget.position,
        status,
        EnemyStatus.EnemyState.Chase,
        onWalkEvent,
        onLookDirEvent);
}

/// <summary>
/// 현재 추적 정보를 모두 정리하고 현 위치에서 가장 가까운 자기 순찰 포인트로 복귀를 예약합니다.
/// </summary>
private void StopChaseAndReturn(
    Vector3 currentPosition,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Action<bool> onWalkEvent)
{
    currentTarget = null;
    currentAggro = 0f;
    sightLostStartTime = -1f;
    memory.ClearTargetTracking();
    memory.ClearChasePlan();
    memory.MarkNeedsReturnToPatrol(currentPosition);
    locomotion.SetIdle(agent, status, onWalkEvent);
}

/// <summary>
/// 기존 타겟을 계속 유지할지, 새로 시야에 들어온 플레이어를 찾을지 결정합니다.
/// 강제 조사 중에는 즉시 시야 재획득하지 않도록 조사 모듈의 차단 규칙을 우선 적용합니다.
/// </summary>
private void RefreshTarget(
    Transform self,
    EnemyPerception perception,
    EnemyNoiseListener noiseListener,
    EnemyMemory memory,
    ICollection<GameObject> players)
{
    // 현재 플레이어가 사망하거나 탈출했다면 기존 어그로와 추적 기억을 즉시 제거합니다.
    // 이후 같은 틱에서 다른 생존 플레이어를 다시 탐색하므로 멀티플레이에서도 시체를 계속 점유하지 않습니다.
    if (currentTarget != null && !EnemyPerception.IsTargetAvailable(currentTarget))
    {
        currentTarget = null;
        currentAggro = 0.0f;
        sightLostStartTime = -1.0f;
        memory.ClearTargetTracking();
        memory.ClearChasePlan();
    }

    bool hadTarget = currentTarget != null;

```

```cs
    // 디코이 어그로는 전투 타겟을 덮어쓰지 않고 이동 우선순위로만 사용합니다.
    // 기존 플레이어 타겟을 보존해야 디코이 종료 후 바로 다시 전투 타겟으로 복귀할 수 있습니다.
    ResolvePriorityMoveTarget(memory, self.position);

    if (noiseListener.ShouldBlockSightReacquire())
    {
        currentTarget = null;
        return;
    }

    if (currentTarget != null)
    {
        return;
    }

    // 복귀 완충 구간에서는 새 타겟을 획득하지 않아 복귀와 재추적이 매 틱 반복되는 현상을 막습니다.
    if (!IsInsideChaseArea(memory, self.position))
    {
        return;
    }

    currentTarget = perception.FindVisibleTarget(self, players);
    if (currentTarget != null && !IsInsideChaseArea(memory, self.position, currentTarget.position))
    {
        currentTarget = null;
    }

    if (currentTarget != null)
    {
        currentAggro = maxAggro;
        sightLostStartTime = -1f;
        // 순찰이나 복귀 상태에서 처음 전투로 전환될 때만 복귀 기준점을 저장합니다.
        if (!hadTarget)
        {
            memory.CaptureReturnAnchor(self.position);
        }

        noiseListener.Clear();
        memory.ClearPatrolWait();
    }
}

/// <summary>
/// 에너미와 선택적 타겟이 모두 자기 순찰 루트의 추적 허용 반경 안에 있는지 확인합니다.
/// 루트가 없는 기존 에너미는 이전 동작을 유지하도록 거리 제한을 적용하지 않습니다.
/// </summary>
private bool IsInsideChaseArea(EnemyMemory memory, Vector3 enemyPosition, Vector3? targetPosition = null)
{
    if (memory == null || !memory.HasPatrolRoute)
    {
        return true;
    }

    if (memory.GetClosestPatrolPointDistance(enemyPosition) > chaseLeashDistance)
    {
        return false;
    }

    return !targetPosition.HasValue ||
           memory.GetClosestPatrolPointDistance(targetPosition.Value) <= chaseLeashDistance;
}

```

```cs
/// <summary>
/// 조사나 추적이 끝난 뒤 현재 순찰 이탈 기준점으로 복귀합니다.
/// 복귀가 끝나면 다시 Patrol 상태로 돌아가 직전 순찰 흐름을 이어갑니다.
/// </summary>
private bool HandleReturnToPatrol(
    Transform self,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent)
{
    if (memory == null || !memory.NeedsReturnToPatrol || !memory.HasPatrolRoute)
    {
        return false;
    }

    Vector3 returnDestination = memory.ReturnAnchorPosition;
    if (locomotion.HasReachedDestination(self.position, returnDestination, memory.GetPointReachDistance()))
    {
        locomotion.Stop(agent, onWalkEvent);
        status.SetNowState(EnemyStatus.EnemyState.Patrol);
        memory.CompleteReturnToPatrol();
        return true;
    }

    memory.ClearPatrolWait();
    locomotion.MoveTo(
        self,
        agent,
        returnDestination,
        status,
        EnemyStatus.EnemyState.Return,
        onWalkEvent,
        onLookDirEvent);
    return true;
}

/// <summary>
/// 타겟도 조사 상태도 없을 때 기본 순찰 루트를 따라 이동합니다.
/// 포인트에 도착하면 설정된 시간만큼 대기한 뒤 다음 포인트로 넘어갑니다.
/// </summary>
private bool HandlePatrol(
    Transform self,
    NavMeshAgent agent,
    EnemyStatus status,
    EnemyMemory memory,
    EnemyLocomotion locomotion,
    Action<bool> onWalkEvent,
    Action<int, int> onLookDirEvent)
{
    if (memory == null || !memory.HasPatrolRoute)
    {
        return false;
    }

    Transform patrolPoint = memory.GetCurrentPatrolPoint();
    if (patrolPoint == null)
    {
        return false;
```

```cs
        }

        if (!memory.HasPatrolDestination && !memory.TryCreatePatrolDestination(agent))
        {
            locomotion.SetIdle(agent, status, onWalkEvent);
            return true;
        }

        Vector3 patrolDestination = memory.PatrolDestination;
        if (locomotion.HasReachedDestination(self.position, patrolDestination, memory.GetPointReachDistance()))
        {
            locomotion.Stop(agent, onWalkEvent);
            status.SetNowState(EnemyStatus.EnemyState.Patrol);

            if (!memory.IsWaitingAtPatrolPoint)
            {
                memory.BeginPatrolWait(memory.GetRandomPatrolWaitTime());
                return true;
            }

            if (memory.HasCompletedPatrolWait())
            {
                memory.ClearPatrolWait();
                memory.CompleteWanderDestination();
                if (memory.ShouldAdvancePatrolPoint)
                {
                    memory.AdvanceToRandomNearbyPoint();
                }
            }

            return true;
        }

        memory.ClearPatrolWait();
        locomotion.MoveTo(
            self,
            agent,
            patrolDestination,
            status,
            EnemyStatus.EnemyState.Patrol,
            onWalkEvent,
            onLookDirEvent);
        return true;
    }
}

```
{% endraw %}
