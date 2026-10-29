---
title: "2026-07-13_enemy_ai_session_end_script_compare"
date: 2026-07-13 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 문서 개요 이 문서는 2026년 7월 13일 사용자가 직접 요청해 수정한 다크 스피릿 AI와 게임 종료 상태 처리 스크립트만 대상으로 한다. 같은 날 다른 작업자가 수정한 코드는 포함하지 않는다. 구분 기준 커밋 내용 AI 수정 이전 ba742c8 QA-PM-003 재설계 직전 종"
description: "1. 문서 개요 이 문서는 2026년 7월 13일 사용자가 직접 요청해 수정한 다크 스피릿 AI와 게임 종료 상태 처리 스크립트만 대상으로 한다. 같은 날 다른 작업자가 수정한 코드는 포함하지 않는다. 구분 기준 커밋 내용 AI 수정 이전 ba742c8 QA-PM-003 재설계 직전 종"
published: true
migration_id: "39c36532580e81e78388c34373da5123"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 문서 개요

이 문서는 2026년 7월 13일 사용자가 직접 요청해 수정한 다크 스피릿 AI와 게임 종료 상태 처리 스크립트만 대상으로 한다. 같은 날 다른 작업자가 수정한 코드는 포함하지 않는다.

<table fit-page-width="true" header-row="true">
<tr>
<td>
구분
</td>
<td>
기준 커밋
</td>
<td>
내용
</td>
</tr>
<tr>
<td>
AI 수정 이전
</td>
<td>
ba742c8
</td>
<td>
QA-PM-003 재설계 직전
</td>
</tr>
<tr>
<td>
종료 상태 수정 이전
</td>
<td>
fe1c6a0
</td>
<td>
피격·시간·UI 종료 방어 적용 직전
</td>
</tr>
<tr>
<td>
현재 코드
</td>
<td>
15baf92
</td>
<td>
오늘 요청한 두 작업이 모두 반영된 버전
</td>
</tr>
</table>

각 파일은 이전 스크립트 전체 → 변경 이유와 동작 설명 → 현재 스크립트 전체 순서로 기록했다. 신규 파일은 이전 버전이 없다고 표시했다.

## 2. 기록 대상 스크립트

<table fit-page-width="true" header-row="true">
<tr>
<td>
분류
</td>
<td>
스크립트
</td>
</tr>
<tr>
<td>
순찰·추적 AI
</td>
<td>
EnemyBrain, EnemyLocomotion, EnemyMemory, EnemyMovement, EnemyPatrolPoint, EnemyPatrolRoute, EnemyPerception
</td>
</tr>
<tr>
<td>
근접 공격·사망 타깃
</td>
<td>
EnemyCombat, PlayerStatus
</td>
</tr>
<tr>
<td>
게임 종료 처리
</td>
<td>
TimeLimitController, GameManager, InventoryPresenter
</td>
</tr>
</table>

---

## 3. EnemyBrain.cs

### 3-1. 이전 스크립트 전체

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
    [SerializeField] private float checkInterval = 0.2f;     // AI 판단 주기

    [NonSerialized] private WaitForSeconds checkingDelay;     // 판단 루프에서 재사용할 대기 객체
    [NonSerialized] private Transform currentTarget;          // 현재 추적 중인 플레이어
    [NonSerialized] private Transform aggroTarget;            // 강제 우선 추적 대상 (어그로)
    [NonSerialized] private float aggroEndTime;               // 강제 추적 종료 시간

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
        RefreshTarget(self, perception, noiseListener, memory, GlobalRuntimeData.GetPlayerList().Values);

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
        memory.UpdateTargetTracking(currentTarget);

        if (status.isAttacking)
        {
            memory.ClearChasePlan();
            return;
        }

        float sqrDistToTarget = EnemyMathUtility.GetPlanarSqrDistance(self.position, currentTarget.position);
        if (combat.CanStartAttack(sqrDistToTarget))
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

        if (perception.CanKeepAwareness(self.position, currentTarget))
        {
            Vector3 chaseDestination = currentTarget.position;
            EnemyMemory.ChaseMoveMode chaseMoveMode = EnemyMemory.ChaseMoveMode.Direct;

            if (interceptPlanner != null &&
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

        currentTarget = null;
        memory.ClearTargetTracking();
        memory.ClearChasePlan();
        memory.MarkNeedsReturnToPatrol();
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
        bool hadTarget = currentTarget != null;

        // 1. 어그로 타겟이 유효한 경우 최우선 타겟으로 덮어씌움
        if (aggroTarget != null)
        {
            if (Time.time < aggroEndTime)
            {
                currentTarget = aggroTarget;
                if (!hadTarget)
                {
                    memory.CaptureReturnAnchor(self.position);
                }
                noiseListener.Clear();
                memory.ClearPatrolWait();
                return;
            }
            else
            {
                aggroTarget = null; // 지속 시간 종료 또는 타겟 파괴
            }
        }

        if (noiseListener.ShouldBlockSightReacquire())
        {
            currentTarget = null;
            return;
        }

        if (currentTarget != null && perception.CanKeepAwareness(self.position, currentTarget))
        {
            return;
        }

        currentTarget = perception.FindVisibleTarget(self, players);
        if (currentTarget != null)
        {
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
        }

        if (locomotion.HasReachedDestination(self.position, patrolPoint.position, memory.GetPointReachDistance()))
        {
            locomotion.Stop(agent, onWalkEvent);
            status.SetNowState(EnemyStatus.EnemyState.Patrol);

            if (!memory.IsWaitingAtPatrolPoint)
            {
                memory.BeginPatrolWait();

                if (memory.HasCompletedPatrolWait())
                {
                    memory.AdvancePatrolIndex();
                }

                return true;
            }

            if (memory.HasCompletedPatrolWait())
            {
                memory.ClearPatrolWait();
                memory.AdvancePatrolIndex();
            }

            return true;
        }

        memory.ClearPatrolWait();
        locomotion.MoveTo(
            self,
            agent,
            patrolPoint.position,
            status,
            EnemyStatus.EnemyState.Patrol,
            onWalkEvent,
            onLookDirEvent);
        return true;
    }
}
```

### 3-2. 설명

에너미 의사결정의 중심 모듈이다. 기존의 단순 타깃 유지 흐름을 자기 패트롤 루트 기준의 추적 허용 구간, 완충 구간, 강제 복귀 구간으로 분리했다. 시야 상실 시 어그로가 단계적으로 감소하고, 추적 종료 후에는 자기 루트의 가까운 지점으로 복귀한다. 근접 교전 중 플레이어가 시야각 바깥으로 잠깐 이동해도 실제 장애물이 없다면 공격 흐름을 유지하도록 했으며, 사망하거나 탈출한 타깃은 즉시 해제하고 다른 생존 플레이어를 다시 탐색한다.

### 3-3. 현재 스크립트 전체

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
    [SerializeField] private float checkInterval = 0.2f;     // AI 판단 주기

    [Header("Chase Aggro And Leash")]
    [SerializeField, Min(1f)] private float maxAggro = 100f;                  // 추적을 완전히 유지하는 최대 어그로
    [SerializeField, Min(0f)] private float sightLossGraceTime = 1f;         // 시야가 끊겨도 어그로 감소를 유예하는 시간
    [SerializeField, Min(0f)] private float aggroDecayPerSecond = 25f;       // 일반 추적 구간에서 초당 감소하는 어그로
    [SerializeField, Min(0f)] private float aggroRecoveryPerSecond = 50f;    // 추적 허용 구간에서 타겟을 볼 때 초당 회복하는 어그로
    [SerializeField, Min(0f)] private float chaseLeashDistance = 16f;        // 루트에서 이 거리까지 새 추적과 어그로 회복을 허용
    [SerializeField, Min(0f)] private float hardReturnDistance = 24f;        // 루트에서 이 거리를 넘으면 시야와 무관하게 즉시 복귀

    [NonSerialized] private WaitForSeconds checkingDelay;     // 판단 루프에서 재사용할 대기 객체
    [NonSerialized] private Transform currentTarget;          // 현재 추적 중인 플레이어
    [NonSerialized] private Transform aggroTarget;            // 강제 우선 추적 대상 (어그로)
    [NonSerialized] private float aggroEndTime;               // 강제 추적 종료 시간
    [NonSerialized] private float currentAggro;                    // 현재 추적 유지에 남아 있는 어그로
    [NonSerialized] private float sightLostStartTime = -1f;        // 시야가 최초로 끊긴 시각
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

        // 에너미 또는 타겟이 활동 한계를 넘으면 남은 어그로와 시야를 무시하고 즉시 복귀합니다.
        if (memory.HasPatrolRoute && farthestRouteDistance > hardReturnDistance)
        {
            StopChaseAndReturn(self.position, agent, status, memory, locomotion, onWalkEvent);
            return;
        }

        bool isInsideChaseArea = !memory.HasPatrolRoute || farthestRouteDistance <= chaseLeashDistance;
        float sqrDistToTarget = EnemyMathUtility.GetPlanarSqrDistance(self.position, currentTarget.position);
        bool canSeeTarget = perception.CanSeeTrackedTarget(self, currentTarget);
        bool canMaintainCloseCombatTarget =
            isInsideChaseArea &&
            combat.IsWithinCloseCombatAwareness(sqrDistToTarget) &&
            perception.HasClearLineOfSight(self, currentTarget);
        bool hasTargetAwareness = canSeeTarget || canMaintainCloseCombatTarget;

        if (hasTargetAwareness && isInsideChaseArea)
        {
            memory.UpdateTargetTracking(currentTarget);
            sightLostStartTime = -1f;
            currentAggro = Mathf.Min(maxAggro, currentAggro + aggroRecoveryPerSecond * tickDelta);

            // 근접 교전에서는 이동 속도가 거의 0이어도 플레이어를 향해 회전해
            // 원형 이동 중 공격 시야가 영구적으로 끊기지 않게 합니다.
            if (canMaintainCloseCombatTarget)
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

            if (canSeeTarget && isInsideChaseArea && interceptPlanner != null &&
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

        // 강제 어그로도 추적 허용 구간을 벗어나면 갱신하지 않아 활동 반경 제한을 우회하지 못하게 합니다.
        if (aggroTarget != null)
        {
            if (Time.time < aggroEndTime && IsInsideChaseArea(memory, self.position, aggroTarget.position))
            {
                currentTarget = aggroTarget;
                currentAggro = maxAggro;
                if (!hadTarget)
                {
                    memory.CaptureReturnAnchor(self.position);
                }
                noiseListener.Clear();
                memory.ClearPatrolWait();
                return;
            }
            else
            {
                aggroTarget = null; // 지속 시간 종료 또는 타겟 파괴
            }
        }

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

---

## 4. EnemyLocomotion.cs

### 4-1. 이전 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적의 실제 몸 움직임을 담당하는 모듈입니다.
/// 일반 이동, 정지, 방향 전환, 공격 중 짧은 돌진까지 처리합니다.
/// </summary>
[Serializable]
public class EnemyLocomotion
{
    [SerializeField] private float moveSpeed = 4.0f;     // 기본 추적 및 순찰 이동 속도

    // 플레이어와 같은 쿼터뷰 기준으로 적의 시각 방향을 판정하기 위한 보정 각도입니다.
    // 월드 forward를 그대로 쓰면 화면에서 보이는 좌우/상하와 어긋날 수 있어 애니메이션 동기화에 사용합니다.
    [SerializeField] private LayerMask lungeObstacleMask; // 공격 돌진을 막는 벽/장애물 레이어
    [SerializeField] private float lungeWallBuffer = 0.15f; // 벽 앞에서 멈추도록 남기는 여유 거리
    [SerializeField] private float lungeCollisionRadius = 0.35f; // 돌진 경로를 검사할 때 사용할 반지름

    private const float VisualDirectionAngle = 45.0f;

    public void OnValidate()
    {
        moveSpeed = Mathf.Max(0.1f, moveSpeed);
        lungeWallBuffer = Mathf.Max(0.0f, lungeWallBuffer);
        lungeCollisionRadius = Mathf.Max(0.05f, lungeCollisionRadius);
    }

    /// <summary>
    /// NavMeshAgent 초기 속도를 설정합니다.
    /// EnemyMovement의 Awake에서 한 번 호출해 기본 이동 속도를 맞춥니다.
    /// </summary>
    public void Initialize(NavMeshAgent agent)
    {
        if (agent != null)
        {
            agent.speed = moveSpeed;
        }
    }

    /// <summary>
    /// 현재 위치가 목표 위치에 충분히 가까운지 평면 거리 기준으로 판정합니다.
    /// 높이 차이 때문에 순찰 포인트 도착 판정이 흔들리지 않도록 Y축은 무시합니다.
    /// </summary>
    public bool HasReachedDestination(Vector3 currentPosition, Vector3 destination, float stopDistance)
    {
        float reachDistance = Mathf.Max(0.05f, stopDistance);
        return EnemyMathUtility.GetPlanarSqrDistance(currentPosition, destination) <= reachDistance * reachDistance;
    }

    /// <summary>
    /// 목적지를 향해 이동시키고 걷기/방향 애니메이션 이벤트를 갱신합니다.
    /// Chase, Patrol, Investigate, Return처럼 이동이 필요한 상태에서 공용으로 사용합니다.
    /// </summary>
    public void MoveTo(
        Transform self,
        NavMeshAgent agent,
        Vector3 destination,
        EnemyStatus status,
        EnemyStatus.EnemyState moveState,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent)
    {
        if (agent == null)
        {
            return;
        }

        agent.speed = moveSpeed;
        agent.isStopped = false;
        agent.SetDestination(destination);
        status.SetNowState(moveState);
        onWalkEvent?.Invoke(true);
        FacePosition(self, destination, onLookDirEvent);
    }

    /// <summary>
    /// 현재 이동을 즉시 멈추고 걷기 애니메이션도 끕니다.
    /// 포인트 도착, 공격 시작, 조사 대기처럼 제자리 상태로 전환할 때 사용합니다.
    /// </summary>
    public void Stop(NavMeshAgent agent, Action<bool> onWalkEvent)
    {
        if (agent == null)
        {
            return;
        }

        agent.isStopped = true;
        agent.velocity = Vector3.zero;
        agent.ResetPath();
        onWalkEvent?.Invoke(false);
    }

    /// <summary>
    /// 이동과 공격 상태를 모두 끄고 대기 상태로 돌립니다.
    /// 추적 대상이 없고 조사나 순찰도 없는 상황에서 사용하는 기본 정리 함수입니다.
    /// </summary>
    public void SetIdle(NavMeshAgent agent, EnemyStatus status, Action<bool> onWalkEvent)
    {
        status.SetNowState(EnemyStatus.EnemyState.Idle);
        status.SetIsAttacking(false);

        if (agent != null)
        {
            agent.isStopped = false;
            agent.ResetPath();
        }

        onWalkEvent?.Invoke(false);
    }

    /// <summary>
    /// 목표 위치를 즉시 바라보도록 회전시키고 방향 애니메이션 값을 갱신합니다.
    /// 공격 직전, 이동 방향 전환, 조사 방향 보정 같은 곳에서 공용으로 사용합니다.
    /// </summary>
    public void FacePosition(Transform self, Vector3 targetPosition, Action<int, int> onLookDirEvent)
    {
        Vector3 lookTarget = new Vector3(targetPosition.x, self.position.y, targetPosition.z);
        if ((lookTarget - self.position).sqrMagnitude <= 0.001f)
        {
            return;
        }

        self.LookAt(lookTarget);
        UpdateLookDirection(self, onLookDirEvent);
    }

    /// <summary>
    /// 2타 직전에는 목표를 완전히 꺾지 않고, 지정한 각도까지만 보정합니다.
    /// 빠르게 방향이 꺾여 보이는 문제를 줄이기 위한 전투 전용 회전 함수입니다.
    /// </summary>
    public void FacePositionLimited(Transform self, Vector3 targetPosition, float maxTurnAngle, Action<int, int> onLookDirEvent)
    {
        Vector3 currentForward = self.forward;
        currentForward.y = 0.0f;

        Vector3 targetDirection = EnemyMathUtility.GetFlatDirection(self.position, targetPosition);
        if (currentForward.sqrMagnitude <= 0.001f || targetDirection.sqrMagnitude <= 0.001f)
        {
            return;
        }

        Vector3 limitedForward = Vector3.RotateTowards(
            currentForward.normalized,
            targetDirection.normalized,
            Mathf.Deg2Rad * Mathf.Max(0.0f, maxTurnAngle),
            0.0f);

        self.rotation = Quaternion.LookRotation(limitedForward, Vector3.up);
        UpdateLookDirection(self, onLookDirEvent);
    }

    /// <summary>
    /// 공격 연출용 짧은 전진 돌진을 수행하고, 끝난 뒤 NavMeshAgent 위치를 다시 맞춥니다.
    /// 2연격 각 스윙에 맞춰 짧게 미는 느낌을 주기 위한 함수입니다.
    /// </summary>
    public IEnumerator PerformLunge(Transform self, NavMeshAgent agent, float distance, float duration)
    {
        if (distance <= 0.0f || duration <= 0.0f)
        {
            yield break;
        }

        Vector3 flatForward = self.forward;
        flatForward.y = 0.0f;

        if (flatForward.sqrMagnitude <= 0.001f)
        {
            yield break;
        }

        flatForward.Normalize();

        Vector3 start = self.position;
        Vector3 end = start + flatForward * distance;
        end.y = start.y;

        end = GetSafeLungeDestination(start, end, distance);

        if (NavMesh.SamplePosition(end, out NavMeshHit hit, Mathf.Max(0.2f, distance), NavMesh.AllAreas))
        {
            end = hit.position;
            end.y = start.y;
        }

        bool previousUpdatePosition = false;
        if (agent != null)
        {
            previousUpdatePosition = agent.updatePosition;
            agent.isStopped = true;
            agent.updatePosition = false;
            agent.velocity = Vector3.zero;
            agent.ResetPath();
        }

        float elapsed = 0.0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / duration);
            self.position = Vector3.Lerp(start, end, t);
            yield return null;
        }

        self.position = end;

        if (agent != null)
        {
            agent.Warp(self.position);
            agent.updatePosition = previousUpdatePosition;
        }
    }

    /// <summary>
    /// 공격 돌진 목적지가 벽 또는 NavMesh 경계를 넘지 않도록 최종 이동 위치를 보정합니다.
    /// NavMesh 경계와 실제 Wall Collider를 함께 검사해 벽 너머로 Lerp 이동되는 상황을 막습니다.
    /// </summary>
    private Vector3 GetSafeLungeDestination(Vector3 start, Vector3 desiredEnd, float distance)
    {
        Vector3 safeEnd = desiredEnd;

        if (NavMesh.Raycast(start, desiredEnd, out NavMeshHit navHit, NavMesh.AllAreas))
        {
            safeEnd = GetBufferedPoint(start, navHit.position);
        }

        LayerMask obstacleMask = ResolveLungeObstacleMask();
        if (obstacleMask.value == 0)
        {
            return safeEnd;
        }

        Vector3 direction = safeEnd - start;
        direction.y = 0.0f;

        float castDistance = Mathf.Min(distance, direction.magnitude);
        if (castDistance <= 0.001f)
        {
            return safeEnd;
        }

        Vector3 castOrigin = start + Vector3.up * lungeCollisionRadius;
        if (Physics.SphereCast(
                castOrigin,
                lungeCollisionRadius,
                direction.normalized,
                out RaycastHit wallHit,
                castDistance,
                obstacleMask,
                QueryTriggerInteraction.Ignore))
        {
            safeEnd = start + direction.normalized * Mathf.Max(0.0f, wallHit.distance - lungeWallBuffer);
            safeEnd.y = start.y;
        }

        return safeEnd;
    }

    private Vector3 GetBufferedPoint(Vector3 start, Vector3 hitPosition)
    {
        Vector3 direction = hitPosition - start;
        direction.y = 0.0f;

        if (direction.sqrMagnitude <= 0.001f)
        {
            return start;
        }

        Vector3 bufferedPoint = hitPosition - direction.normalized * lungeWallBuffer;
        bufferedPoint.y = start.y;
        return bufferedPoint;
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 돌진 차단 레이어로 사용합니다.
    /// </summary>
    private LayerMask ResolveLungeObstacleMask()
    {
        if (lungeObstacleMask.value != 0)
        {
            return lungeObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }

    /// <summary>
    /// 현재 바라보는 월드 방향을 애니메이터가 사용하는 lookDir/lookRight 값으로 변환합니다.
    /// 쿼터니언 y값을 직접 쓰지 않고 self.forward를 쿼터뷰 화면 기준으로 보정해서
    /// 실제 적이 바라보는 방향과 스프라이트 애니메이션 방향이 어긋나지 않도록 맞춰줍니다.
    /// </summary>
    private void UpdateLookDirection(Transform self, Action<int, int> onLookDirEvent)
    {
        Vector3 flatForward = self.forward;
        flatForward.y = 0.0f;

        if (flatForward.sqrMagnitude <= 0.001f)
        {
            return;
        }

        Quaternion visualRotation = Quaternion.Euler(0.0f, VisualDirectionAngle, 0.0f);
        Vector3 visualForward = visualRotation * flatForward.normalized;

        int lookUp = visualForward.z > 0.0f ? 1 : 0;
        int lookRight = visualForward.x > 0.0f ? -1 : 1;
        onLookDirEvent?.Invoke(lookUp, lookRight);
    }
}
```

### 4-2. 설명

NavMeshAgent의 이동과 방향 표현을 담당한다. AI가 계산한 목적지 방향이 아니라 NavMeshAgent의 실제 이동 벡터를 매 프레임 애니메이션 값으로 변환하도록 변경했다. 장애물 회피와 코너 이동 중에도 이동 방향과 스프라이트 방향이 일치하며, 좌우 플립과 상하 정면·후면 방향값도 다크 스피릿 이미지 기준으로 보정했다. 공격 선딜 중 제한 회전과 기존 돌진 이동도 같은 방향 갱신 규칙을 사용한다.

### 4-3. 현재 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적의 실제 몸 움직임을 담당하는 모듈입니다.
/// 일반 이동, 정지, 방향 전환, 공격 중 짧은 돌진까지 처리합니다.
/// </summary>
[Serializable]
public class EnemyLocomotion
{
    [SerializeField] private float moveSpeed = 4.0f;     // 기본 추적 및 순찰 이동 속도

    [Header("Movement Animation Sync")]
    [SerializeField] private float visualDirectionAngle = 45.0f;      // 월드 이동 방향을 쿼터뷰 화면 방향으로 변환할 보정 각도
    [SerializeField, Min(0.01f)] private float movingSpeedThreshold = 0.05f; // 실제 걷기 애니메이션을 켤 최소 이동 속도

    [SerializeField] private LayerMask lungeObstacleMask; // 공격 돌진을 막는 벽/장애물 레이어
    [SerializeField] private float lungeWallBuffer = 0.15f; // 벽 앞에서 멈추도록 남기는 여유 거리
    [SerializeField] private float lungeCollisionRadius = 0.35f; // 돌진 경로를 검사할 때 사용할 반지름

    public void OnValidate()
    {
        moveSpeed = Mathf.Max(0.1f, moveSpeed);
        movingSpeedThreshold = Mathf.Max(0.01f, movingSpeedThreshold);
        lungeWallBuffer = Mathf.Max(0.0f, lungeWallBuffer);
        lungeCollisionRadius = Mathf.Max(0.05f, lungeCollisionRadius);
    }

    /// <summary>
    /// NavMeshAgent 초기 속도를 설정합니다.
    /// EnemyMovement의 Awake에서 한 번 호출해 기본 이동 속도를 맞춥니다.
    /// </summary>
    public void Initialize(NavMeshAgent agent)
    {
        if (agent != null)
        {
            agent.speed = moveSpeed;
            // 루트 회전과 스프라이트 방향을 같은 실제 이동 벡터로 갱신하기 위해
            // NavMeshAgent의 자동 회전 대신 SyncMovementAnimation에서 회전을 단일 관리합니다.
            agent.updateRotation = false;
        }
    }

    /// <summary>
    /// 현재 위치가 목표 위치에 충분히 가까운지 평면 거리 기준으로 판정합니다.
    /// 높이 차이 때문에 순찰 포인트 도착 판정이 흔들리지 않도록 Y축은 무시합니다.
    /// </summary>
    public bool HasReachedDestination(Vector3 currentPosition, Vector3 destination, float stopDistance)
    {
        float reachDistance = Mathf.Max(0.05f, stopDistance);
        return EnemyMathUtility.GetPlanarSqrDistance(currentPosition, destination) <= reachDistance * reachDistance;
    }

    /// <summary>
    /// 목적지를 향해 이동시키고 걷기/방향 애니메이션 이벤트를 갱신합니다.
    /// Chase, Patrol, Investigate, Return처럼 이동이 필요한 상태에서 공용으로 사용합니다.
    /// </summary>
    public void MoveTo(
        Transform self,
        NavMeshAgent agent,
        Vector3 destination,
        EnemyStatus status,
        EnemyStatus.EnemyState moveState,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent)
    {
        if (agent == null)
        {
            return;
        }

        agent.speed = moveSpeed;
        agent.isStopped = false;
        agent.SetDestination(destination);
        status.SetNowState(moveState);
        // 걷기 여부와 방향은 목적지가 아니라 매 프레임 실제 NavMesh 이동 벡터로 갱신합니다.
    }

    /// <summary>
    /// NavMeshAgent의 실제 속도와 경로 진행 방향을 걷기 및 방향 애니메이션에 동기화합니다.
    /// 장애물 회피나 코너 이동 시 최종 목적지가 아닌 현재 경로 방향을 사용해 문워크 현상을 방지합니다.
    /// </summary>
    public void SyncMovementAnimation(
        Transform self,
        NavMeshAgent agent,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent)
    {
        if (self == null || agent == null || !agent.enabled || !agent.isOnNavMesh)
        {
            onWalkEvent?.Invoke(false);
            return;
        }

        Vector3 actualVelocity = agent.velocity;
        actualVelocity.y = 0.0f;

        float thresholdSqr = movingSpeedThreshold * movingSpeedThreshold;
        bool isMoving = !agent.isStopped && actualVelocity.sqrMagnitude > thresholdSqr;
        onWalkEvent?.Invoke(isMoving);

        if (!isMoving)
        {
            return;
        }

        // desiredVelocity는 회피와 다음 코너가 반영된 진행 방향입니다.
        // 경로 계산 직후 값이 아직 없으면 실제 속도를 사용해 방향 갱신이 끊기지 않게 합니다.
        Vector3 movementDirection = agent.desiredVelocity;
        movementDirection.y = 0.0f;
        if (movementDirection.sqrMagnitude <= thresholdSqr)
        {
            movementDirection = actualVelocity;
        }

        movementDirection.Normalize();
        self.rotation = Quaternion.LookRotation(movementDirection, Vector3.up);
        UpdateLookDirection(movementDirection, onLookDirEvent);
    }

    /// <summary>
    /// 현재 이동을 즉시 멈추고 걷기 애니메이션도 끕니다.
    /// 포인트 도착, 공격 시작, 조사 대기처럼 제자리 상태로 전환할 때 사용합니다.
    /// </summary>
    public void Stop(NavMeshAgent agent, Action<bool> onWalkEvent)
    {
        if (agent == null)
        {
            return;
        }

        agent.isStopped = true;
        agent.velocity = Vector3.zero;
        agent.ResetPath();
        onWalkEvent?.Invoke(false);
    }

    /// <summary>
    /// 이동과 공격 상태를 모두 끄고 대기 상태로 돌립니다.
    /// 추적 대상이 없고 조사나 순찰도 없는 상황에서 사용하는 기본 정리 함수입니다.
    /// </summary>
    public void SetIdle(NavMeshAgent agent, EnemyStatus status, Action<bool> onWalkEvent)
    {
        status.SetNowState(EnemyStatus.EnemyState.Idle);
        status.SetIsAttacking(false);

        if (agent != null)
        {
            agent.isStopped = false;
            agent.ResetPath();
        }

        onWalkEvent?.Invoke(false);
    }

    /// <summary>
    /// 목표 위치를 즉시 바라보도록 회전시키고 방향 애니메이션 값을 갱신합니다.
    /// 공격 직전, 이동 방향 전환, 조사 방향 보정 같은 곳에서 공용으로 사용합니다.
    /// </summary>
    public void FacePosition(Transform self, Vector3 targetPosition, Action<int, int> onLookDirEvent)
    {
        Vector3 lookTarget = new Vector3(targetPosition.x, self.position.y, targetPosition.z);
        if ((lookTarget - self.position).sqrMagnitude <= 0.001f)
        {
            return;
        }

        self.LookAt(lookTarget);
        UpdateLookDirection(self.forward, onLookDirEvent);
    }

    /// <summary>
    /// 2타 직전에는 목표를 완전히 꺾지 않고, 지정한 각도까지만 보정합니다.
    /// 빠르게 방향이 꺾여 보이는 문제를 줄이기 위한 전투 전용 회전 함수입니다.
    /// </summary>
    public void FacePositionLimited(Transform self, Vector3 targetPosition, float maxTurnAngle, Action<int, int> onLookDirEvent)
    {
        Vector3 currentForward = self.forward;
        currentForward.y = 0.0f;

        Vector3 targetDirection = EnemyMathUtility.GetFlatDirection(self.position, targetPosition);
        if (currentForward.sqrMagnitude <= 0.001f || targetDirection.sqrMagnitude <= 0.001f)
        {
            return;
        }

        Vector3 limitedForward = Vector3.RotateTowards(
            currentForward.normalized,
            targetDirection.normalized,
            Mathf.Deg2Rad * Mathf.Max(0.0f, maxTurnAngle),
            0.0f);

        self.rotation = Quaternion.LookRotation(limitedForward, Vector3.up);
        UpdateLookDirection(limitedForward, onLookDirEvent);
    }

    /// <summary>
    /// 공격 연출용 짧은 전진 돌진을 수행하고, 끝난 뒤 NavMeshAgent 위치를 다시 맞춥니다.
    /// 2연격 각 스윙에 맞춰 짧게 미는 느낌을 주기 위한 함수입니다.
    /// </summary>
    public IEnumerator PerformLunge(Transform self, NavMeshAgent agent, float distance, float duration)
    {
        if (distance <= 0.0f || duration <= 0.0f)
        {
            yield break;
        }

        Vector3 flatForward = self.forward;
        flatForward.y = 0.0f;

        if (flatForward.sqrMagnitude <= 0.001f)
        {
            yield break;
        }

        flatForward.Normalize();

        Vector3 start = self.position;
        Vector3 end = start + flatForward * distance;
        end.y = start.y;

        end = GetSafeLungeDestination(start, end, distance);

        if (NavMesh.SamplePosition(end, out NavMeshHit hit, Mathf.Max(0.2f, distance), NavMesh.AllAreas))
        {
            end = hit.position;
            end.y = start.y;
        }

        bool previousUpdatePosition = false;
        if (agent != null)
        {
            previousUpdatePosition = agent.updatePosition;
            agent.isStopped = true;
            agent.updatePosition = false;
            agent.velocity = Vector3.zero;
            agent.ResetPath();
        }

        float elapsed = 0.0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / duration);
            self.position = Vector3.Lerp(start, end, t);
            yield return null;
        }

        self.position = end;

        if (agent != null)
        {
            agent.Warp(self.position);
            agent.updatePosition = previousUpdatePosition;
        }
    }

    /// <summary>
    /// 공격 돌진 목적지가 벽 또는 NavMesh 경계를 넘지 않도록 최종 이동 위치를 보정합니다.
    /// NavMesh 경계와 실제 Wall Collider를 함께 검사해 벽 너머로 Lerp 이동되는 상황을 막습니다.
    /// </summary>
    private Vector3 GetSafeLungeDestination(Vector3 start, Vector3 desiredEnd, float distance)
    {
        Vector3 safeEnd = desiredEnd;

        if (NavMesh.Raycast(start, desiredEnd, out NavMeshHit navHit, NavMesh.AllAreas))
        {
            safeEnd = GetBufferedPoint(start, navHit.position);
        }

        LayerMask obstacleMask = ResolveLungeObstacleMask();
        if (obstacleMask.value == 0)
        {
            return safeEnd;
        }

        Vector3 direction = safeEnd - start;
        direction.y = 0.0f;

        float castDistance = Mathf.Min(distance, direction.magnitude);
        if (castDistance <= 0.001f)
        {
            return safeEnd;
        }

        Vector3 castOrigin = start + Vector3.up * lungeCollisionRadius;
        if (Physics.SphereCast(
                castOrigin,
                lungeCollisionRadius,
                direction.normalized,
                out RaycastHit wallHit,
                castDistance,
                obstacleMask,
                QueryTriggerInteraction.Ignore))
        {
            safeEnd = start + direction.normalized * Mathf.Max(0.0f, wallHit.distance - lungeWallBuffer);
            safeEnd.y = start.y;
        }

        return safeEnd;
    }

    private Vector3 GetBufferedPoint(Vector3 start, Vector3 hitPosition)
    {
        Vector3 direction = hitPosition - start;
        direction.y = 0.0f;

        if (direction.sqrMagnitude <= 0.001f)
        {
            return start;
        }

        Vector3 bufferedPoint = hitPosition - direction.normalized * lungeWallBuffer;
        bufferedPoint.y = start.y;
        return bufferedPoint;
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 돌진 차단 레이어로 사용합니다.
    /// </summary>
    private LayerMask ResolveLungeObstacleMask()
    {
        if (lungeObstacleMask.value != 0)
        {
            return lungeObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }

    /// <summary>
    /// 현재 바라보는 월드 방향을 애니메이터가 사용하는 lookDir/lookRight 값으로 변환합니다.
    /// 쿼터니언 y값을 직접 쓰지 않고 self.forward를 쿼터뷰 화면 기준으로 보정해서
    /// 실제 적이 바라보는 방향과 스프라이트 애니메이션 방향이 어긋나지 않도록 맞춰줍니다.
    /// </summary>
    private void UpdateLookDirection(Vector3 worldDirection, Action<int, int> onLookDirEvent)
    {
        Vector3 flatForward = worldDirection;
        flatForward.y = 0.0f;

        if (flatForward.sqrMagnitude <= 0.001f)
        {
            return;
        }

        Quaternion visualRotation = Quaternion.Euler(0.0f, visualDirectionAngle, 0.0f);
        Vector3 visualForward = visualRotation * flatForward.normalized;

        // Animator의 LookDir는 0이 뒷모습, 1이 눈이 보이는 정면 클립입니다.
        // 화면 아래쪽 이동에서는 정면, 위쪽 이동에서는 뒷모습이 선택되도록 Z 부호를 변환합니다.
        int lookDir = visualForward.z > 0.0f ? 0 : 1;
        // 다크 스피릿 원본 스프라이트는 localScale.x가 1일 때 오른쪽을 바라봅니다.
        // 화면 이동 방향의 X 부호를 그대로 스케일에 전달해 좌우 문워크를 방지합니다.
        int horizontalScale = visualForward.x > 0.0f ? 1 : -1;
        onLookDirEvent?.Invoke(lookDir, horizontalScale);
    }
}
```

---

## 5. EnemyMemory.cs

### 5-1. 이전 스크립트 전체

```cs
using System;
using UnityEngine;

/// <summary>
/// 적 AI가 순찰과 추적 중에 기억해야 하는 런타임 상태를 보관합니다.
/// 순찰 루트, 복귀 기준점, 플레이어 최근 이동 샘플, 현재 추적 방식까지 한곳에서 관리합니다.
/// </summary>
[Serializable]
public class EnemyMemory
{
    public enum ChaseMoveMode
    {
        Direct,
        Intercept
    }

    [SerializeField] private Vector3 homePosition;                    // 적이 처음 스폰된 기준 위치
    [SerializeField] private EnemyPatrolRoute patrolRoute;            // 현재 연결된 순찰 루트
    [SerializeField, Min(0)] private int patrolIndex;                 // 현재 향하고 있는 순찰 포인트 인덱스
    [SerializeField] private bool needsReturnToPatrol;                // 조사/추적 종료 후 순찰로 복귀해야 하는지 여부
    [SerializeField] private bool isWaitingAtPatrolPoint;             // 순찰 포인트에 도착해 대기 중인지 여부
    [SerializeField] private float patrolWaitUntilTime;               // 순찰 포인트 대기가 끝나는 시각
    [SerializeField] private bool hasReturnAnchor;                    // 순찰에서 이탈한 기준점을 이미 기록했는지 여부
    [SerializeField] private Vector3 returnAnchorPosition;            // 복귀해야 할 순찰 이탈 시작 위치
    [SerializeField, Min(0)] private int returnPatrolIndex;           // 복귀 후 다시 이어갈 순찰 포인트 인덱스

    [Header("Target Tracking")]
    [SerializeField] private Vector3 lastKnownTargetPosition;         // 최근에 관측한 플레이어 위치
    [SerializeField] private Vector3 estimatedTargetVelocity;         // 최근 샘플 차이로 추정한 플레이어 이동 속도
    [SerializeField] private float lastTargetSampleTime;              // 마지막 위치 샘플 시각
    [SerializeField] private bool hasTargetMotionSample;              // 두 번 이상 샘플링해 속도 추정이 가능한지 여부
    [SerializeField] private int trackedTargetInstanceId;             // 현재 추적 중인 타겟 인스턴스 ID
    [SerializeField] private ChaseMoveMode currentChaseMoveMode;      // 현재 추적이 직선 추적인지 차단 추적인지
    [SerializeField] private Vector3 currentChaseDestination;         // 현재 프레임에 목표로 삼은 추적 목적지

    public Vector3 HomePosition => homePosition;
    public int PatrolIndex => patrolIndex;
    public bool NeedsReturnToPatrol => needsReturnToPatrol;
    public bool IsWaitingAtPatrolPoint => isWaitingAtPatrolPoint;
    public bool HasPatrolRoute => patrolRoute != null && patrolRoute.GetPointCount() > 0;
    public bool HasReturnAnchor => hasReturnAnchor;
    public Vector3 ReturnAnchorPosition => hasReturnAnchor ? returnAnchorPosition : homePosition;
    public Vector3 LastKnownTargetPosition => lastKnownTargetPosition;
    public Vector3 EstimatedTargetVelocity => estimatedTargetVelocity;
    public bool HasTargetMotionSample => hasTargetMotionSample;
    public ChaseMoveMode CurrentChaseMoveMode => currentChaseMoveMode;
    public Vector3 CurrentChaseDestination => currentChaseDestination;

    /// <summary>
    /// 스폰 직후 순찰과 추적 관련 초기 상태를 설정합니다.
    /// 순찰 루트가 없더라도 홈 위치와 추적 메모리는 초기화해 이후 상태 전환이 꼬이지 않도록 맞춥니다.
    /// </summary>
    public void InitializePatrol(Vector3 spawnPosition, EnemyPatrolRoute route, int startPatrolIndex)
    {
        homePosition = spawnPosition;
        patrolRoute = route;
        patrolIndex = 0;
        needsReturnToPatrol = false;
        isWaitingAtPatrolPoint = false;
        patrolWaitUntilTime = 0.0f;
        hasReturnAnchor = false;
        returnAnchorPosition = spawnPosition;
        returnPatrolIndex = 0;

        ClearTargetTracking();
        ClearChasePlan();
        currentChaseDestination = spawnPosition;

        if (!HasPatrolRoute)
        {
            return;
        }

        patrolIndex = Mathf.Clamp(startPatrolIndex, 0, patrolRoute.GetPointCount() - 1);
        returnPatrolIndex = patrolIndex;
    }

    /// <summary>
    /// 현재 순찰 인덱스의 포인트를 반환합니다.
    /// </summary>
    public Transform GetCurrentPatrolPoint()
    {
        if (!HasPatrolRoute)
        {
            return null;
        }

        return patrolRoute.GetPoint(patrolIndex);
    }

    /// <summary>
    /// 현재 루트가 사용하는 포인트 도착 판정 거리를 반환합니다.
    /// </summary>
    public float GetPointReachDistance()
    {
        return patrolRoute != null ? patrolRoute.PointReachDistance : 0.5f;
    }

    /// <summary>
    /// 현재 루트가 사용하는 포인트 대기 시간을 반환합니다.
    /// </summary>
    public float GetWaitTimeAtPoint()
    {
        return patrolRoute != null ? patrolRoute.WaitTimeAtPoint : 0.0f;
    }

    /// <summary>
    /// 적이 순찰 루트에서 처음 벗어나는 시점의 위치와 순찰 인덱스를 저장합니다.
    /// 이미 이탈 기준점을 저장한 상태라면 기존 값을 유지해 복귀 기준점이 흔들리지 않게 합니다.
    /// </summary>
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

    /// <summary>
    /// 조사나 추적이 끝난 뒤 순찰 루트로 복귀해야 한다는 플래그를 기록합니다.
    /// 복귀 시작 시 순찰 포인트 대기는 다시 계산해야 하므로 대기 상태도 함께 초기화합니다.
    /// </summary>
    public void MarkNeedsReturnToPatrol()
    {
        if (!HasPatrolRoute)
        {
            return;
        }

        needsReturnToPatrol = true;
        ClearPatrolWait();
    }

    /// <summary>
    /// 복귀 관련 플래그와 기준점을 모두 초기화합니다.
    /// </summary>
    public void ClearReturnToPatrol()
    {
        needsReturnToPatrol = false;
        hasReturnAnchor = false;
        returnAnchorPosition = homePosition;
        returnPatrolIndex = patrolIndex;
    }

    /// <summary>
    /// 복귀 목적지까지 도달한 뒤 원래 순찰 흐름을 다시 이어갈 수 있도록 정리합니다.
    /// 이탈 직전에 바라보던 순찰 인덱스를 복원하고, 복귀 관련 플래그와 대기 상태를 함께 비웁니다.
    /// </summary>
    public void CompleteReturnToPatrol()
    {
        if (HasPatrolRoute)
        {
            patrolIndex = Mathf.Clamp(returnPatrolIndex, 0, patrolRoute.GetPointCount() - 1);
        }

        ClearPatrolWait();
        ClearReturnToPatrol();
    }

    /// <summary>
    /// 현재 순찰 포인트에서의 대기 타이머를 시작합니다.
    /// 루트 설정상 대기 시간이 0이면 즉시 다음 포인트로 넘어갈 수 있도록 대기 상태를 만들지 않습니다.
    /// </summary>
    public void BeginPatrolWait()
    {
        float waitDuration = GetWaitTimeAtPoint();
        if (waitDuration <= 0.0f)
        {
            isWaitingAtPatrolPoint = false;
            patrolWaitUntilTime = 0.0f;
            return;
        }

        isWaitingAtPatrolPoint = true;
        patrolWaitUntilTime = Time.time + waitDuration;
    }

    /// <summary>
    /// 현재 순찰 포인트 대기 시간이 끝났는지 확인합니다.
    /// </summary>
    public bool HasCompletedPatrolWait()
    {
        return !isWaitingAtPatrolPoint || Time.time >= patrolWaitUntilTime;
    }

    /// <summary>
    /// 순찰 포인트 대기 상태를 초기화합니다.
    /// 조사 진입, 복귀 시작, 추적 전환 시 대기 타이머가 남아 있지 않도록 맞춰줍니다.
    /// </summary>
    public void ClearPatrolWait()
    {
        isWaitingAtPatrolPoint = false;
        patrolWaitUntilTime = 0.0f;
    }

    /// <summary>
    /// 다음 순찰 포인트 인덱스로 이동합니다.
    /// 실제 다음 인덱스 규칙은 루트가 관리하고, 메모리는 결과만 반영합니다.
    /// </summary>
    public void AdvancePatrolIndex()
    {
        if (!HasPatrolRoute)
        {
            patrolIndex = 0;
            return;
        }

        patrolIndex = patrolRoute.GetNextIndex(patrolIndex);
        if (patrolIndex < 0)
        {
            patrolIndex = 0;
        }
    }

    /// <summary>
    /// 현재 추적 중인 타겟의 위치 샘플을 갱신합니다.
    /// 같은 타겟을 두 번 이상 샘플링한 뒤부터는 최근 위치 차이로 이동 속도를 추정해 차단 이동 계산에 사용합니다.
    /// </summary>
    public void UpdateTargetTracking(Transform target)
    {
        if (target == null)
        {
            ClearTargetTracking();
            return;
        }

        int targetInstanceId = target.GetInstanceID();
        if (trackedTargetInstanceId != targetInstanceId)
        {
            BeginTargetTracking(target);
            return;
        }

        float now = Time.time;
        float deltaTime = now - lastTargetSampleTime;
        if (deltaTime <= 0.0001f)
        {
            return;
        }

        Vector3 currentPosition = target.position;
        estimatedTargetVelocity = EnemyMathUtility.GetFlatDirection(lastKnownTargetPosition, currentPosition) / deltaTime;
        lastKnownTargetPosition = currentPosition;
        lastTargetSampleTime = now;
        hasTargetMotionSample = true;
    }

    /// <summary>
    /// 새 타겟을 추적하기 시작할 때 첫 샘플을 기록합니다.
    /// 첫 샘플만으로는 속도를 알 수 없으므로 차단 이동은 다음 갱신부터 활성화됩니다.
    /// </summary>
    private void BeginTargetTracking(Transform target)
    {
        trackedTargetInstanceId = target.GetInstanceID();
        lastKnownTargetPosition = target.position;
        estimatedTargetVelocity = Vector3.zero;
        lastTargetSampleTime = Time.time;
        hasTargetMotionSample = false;
    }

    /// <summary>
    /// 플레이어 추적 샘플을 모두 초기화합니다.
    /// 타겟을 잃거나 조사 상태로 전환될 때 이전 샘플이 다음 추적에 섞이지 않도록 비웁니다.
    /// </summary>
    public void ClearTargetTracking()
    {
        trackedTargetInstanceId = 0;
        lastKnownTargetPosition = Vector3.zero;
        estimatedTargetVelocity = Vector3.zero;
        lastTargetSampleTime = 0.0f;
        hasTargetMotionSample = false;
    }

    /// <summary>
    /// 이번 프레임 추적이 직선 추적인지 차단 추적인지와 목적지를 기록합니다.
    /// 인스펙터에서 현재 추적 의도를 바로 확인할 수 있도록 디버그용으로도 사용합니다.
    /// </summary>
    public void SetChasePlan(ChaseMoveMode chaseMoveMode, Vector3 destination)
    {
        currentChaseMoveMode = chaseMoveMode;
        currentChaseDestination = destination;
    }

    /// <summary>
    /// 현재 추적 계획 표시를 초기화합니다.
    /// 추적이 끝났거나 공격 상태로 넘어가 더 이상 이동 목적지를 유지하지 않을 때 사용합니다.
    /// </summary>
    public void ClearChasePlan()
    {
        currentChaseMoveMode = ChaseMoveMode.Direct;
        currentChaseDestination = Vector3.zero;
    }
}
```

### 5-2. 설명

순찰, 추적, 복귀에 필요한 런타임 기억을 보관한다. 스폰된 에너미가 자기 패트롤 루트와 시작 인덱스를 기억하도록 확장했으며, 현재 위치에서 가장 가까운 자기 패트롤 포인트를 계산할 수 있게 했다. 마지막으로 본 타깃 위치, 타깃 이동 샘플, 추적 계획, 복귀 필요 상태를 분리해 Brain이 상태별로 필요한 정보만 사용하도록 정리했다.

### 5-3. 현재 스크립트 전체

```cs
using System;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적 AI가 순찰과 추적 중에 기억해야 하는 런타임 상태를 보관합니다.
/// 순찰 루트, 복귀 기준점, 플레이어 최근 이동 샘플, 현재 추적 방식까지 한곳에서 관리합니다.
/// </summary>
[Serializable]
public class EnemyMemory
{
    public enum ChaseMoveMode
    {
        Direct,
        Intercept
    }

    [SerializeField] private Vector3 homePosition;                    // 적이 처음 스폰된 기준 위치
    [SerializeField] private EnemyPatrolRoute patrolRoute;            // 현재 연결된 순찰 루트
    [SerializeField, Min(0)] private int patrolIndex;                 // 현재 향하고 있는 순찰 포인트 인덱스
    [SerializeField] private bool needsReturnToPatrol;                // 조사/추적 종료 후 순찰로 복귀해야 하는지 여부
    [SerializeField] private bool isWaitingAtPatrolPoint;             // 순찰 포인트에 도착해 대기 중인지 여부
    [SerializeField] private float patrolWaitUntilTime;               // 순찰 포인트 대기가 끝나는 시각
    [SerializeField] private bool hasReturnAnchor;                    // 순찰에서 이탈한 기준점을 이미 기록했는지 여부
    [SerializeField] private Vector3 returnAnchorPosition;            // 복귀해야 할 순찰 이탈 시작 위치
    [SerializeField, Min(0)] private int returnPatrolIndex;           // 복귀 후 다시 이어갈 순찰 포인트 인덱스

    [Header("Target Tracking")]
    [SerializeField] private Vector3 lastKnownTargetPosition;         // 최근에 관측한 플레이어 위치
    [SerializeField] private Vector3 estimatedTargetVelocity;         // 최근 샘플 차이로 추정한 플레이어 이동 속도
    [SerializeField] private float lastTargetSampleTime;              // 마지막 위치 샘플 시각
    [SerializeField] private bool hasTargetMotionSample;              // 두 번 이상 샘플링해 속도 추정이 가능한지 여부
    [SerializeField] private int trackedTargetInstanceId;             // 현재 추적 중인 타겟 인스턴스 ID
    [SerializeField] private ChaseMoveMode currentChaseMoveMode;      // 현재 추적이 직선 추적인지 차단 추적인지
    [SerializeField] private Vector3 currentChaseDestination;         // 현재 프레임에 목표로 삼은 추적 목적지

    [Header("Random Patrol")]
    [SerializeField] private bool hasPatrolDestination;       // 현재 랜덤 배회 목적지가 만들어졌는지 여부
    [SerializeField] private Vector3 patrolDestination;       // NavMesh 위에서 선택된 현재 배회 목적지
    [SerializeField] private int remainingWanderCount;        // 다음 패트롤 포인트로 넘어가기 전 남은 배회 횟수

    public Vector3 HomePosition => homePosition;
    public int PatrolIndex => patrolIndex;
    public bool NeedsReturnToPatrol => needsReturnToPatrol;
    public bool IsWaitingAtPatrolPoint => isWaitingAtPatrolPoint;
    public bool HasPatrolRoute => patrolRoute != null && patrolRoute.GetPointCount() > 0;
    public bool HasReturnAnchor => hasReturnAnchor;
    public Vector3 ReturnAnchorPosition => hasReturnAnchor ? returnAnchorPosition : homePosition;
    public Vector3 LastKnownTargetPosition => lastKnownTargetPosition;
    public Vector3 EstimatedTargetVelocity => estimatedTargetVelocity;
    public bool HasTargetMotionSample => hasTargetMotionSample;
    public ChaseMoveMode CurrentChaseMoveMode => currentChaseMoveMode;
    public Vector3 CurrentChaseDestination => currentChaseDestination;
    public bool HasPatrolDestination => hasPatrolDestination;
    public Vector3 PatrolDestination => patrolDestination;

    /// <summary>
    /// 스폰 직후 순찰과 추적 관련 초기 상태를 설정합니다.
    /// 순찰 루트가 없더라도 홈 위치와 추적 메모리는 초기화해 이후 상태 전환이 꼬이지 않도록 맞춥니다.
    /// </summary>
    public void InitializePatrol(Vector3 spawnPosition, EnemyPatrolRoute route, int startPatrolIndex)
    {
        homePosition = spawnPosition;
        patrolRoute = route;
        patrolIndex = 0;
        needsReturnToPatrol = false;
        isWaitingAtPatrolPoint = false;
        patrolWaitUntilTime = 0.0f;
        hasReturnAnchor = false;
        returnAnchorPosition = spawnPosition;
        returnPatrolIndex = 0;

        ClearTargetTracking();
        ClearChasePlan();
        currentChaseDestination = spawnPosition;
        ClearRandomPatrol();

        if (!HasPatrolRoute)
        {
            return;
        }

        patrolIndex = Mathf.Clamp(startPatrolIndex, 0, patrolRoute.GetPointCount() - 1);
        returnPatrolIndex = patrolIndex;
    }

    /// <summary>
    /// 현재 순찰 인덱스의 포인트를 반환합니다.
    /// </summary>
    public Transform GetCurrentPatrolPoint()
    {
        if (!HasPatrolRoute)
        {
            return null;
        }

        return patrolRoute.GetPoint(patrolIndex);
    }

    /// <summary>
    /// 현재 루트가 사용하는 포인트 도착 판정 거리를 반환합니다.
    /// </summary>
    public float GetPointReachDistance()
    {
        return patrolRoute != null ? patrolRoute.PointReachDistance : 0.5f;
    }

    /// <summary>
    /// 현재 루트가 사용하는 포인트 대기 시간을 반환합니다.
    /// </summary>
    public float GetWaitTimeAtPoint()
    {
        return patrolRoute != null ? patrolRoute.WaitTimeAtPoint : 0.0f;
    }

    /// <summary>
    /// 전달된 위치에서 현재 루트의 가장 가까운 활성 패트롤 포인트까지 평면 거리를 반환합니다.
    /// 추적 허용 반경과 강제 복귀 반경을 같은 루트 기준으로 계산할 때 사용합니다.
    /// </summary>
    public float GetClosestPatrolPointDistance(Vector3 position)
    {
        return HasPatrolRoute ? patrolRoute.GetClosestPointDistance(position) : float.MaxValue;
    }

    /// <summary>
    /// 전달된 위치에서 가장 가까운 패트롤 포인트를 복귀 지점으로 선택합니다.
    /// 기존 랜덤 배회 목적지는 새 복귀 지점과 충돌하지 않도록 함께 초기화합니다.
    /// </summary>
    public void SelectClosestPatrolPoint(Vector3 position)
    {
        if (!HasPatrolRoute)
        {
            return;
        }

        patrolIndex = patrolRoute.GetClosestPointIndex(position);
        returnPatrolIndex = patrolIndex;
        Transform point = patrolRoute.GetPoint(patrolIndex);
        if (point != null)
        {
            hasReturnAnchor = true;
            returnAnchorPosition = point.position;
        }

        ClearRandomPatrol();
    }

    /// <summary>
    /// 현재 포인트에서 수행할 랜덤 배회 횟수가 없을 때 루트 설정으로 새 횟수를 생성합니다.
    /// </summary>
    public void EnsureWanderCount()
    {
        if (remainingWanderCount <= 0 && HasPatrolRoute)
        {
            remainingWanderCount = patrolRoute.GetRandomWanderCount(patrolIndex);
        }
    }

    /// <summary>
    /// 현재 패트롤 포인트 주변의 도달 가능한 NavMesh 위치를 새 배회 목적지로 선택합니다.
    /// 유효한 목적지를 찾지 못하면 false를 반환해 에너미가 안전하게 대기하도록 합니다.
    /// </summary>
    public bool TryCreatePatrolDestination(NavMeshAgent agent)
    {
        EnsureWanderCount();
        if (!HasPatrolRoute || !patrolRoute.TryGetRandomWanderDestination(patrolIndex, agent, out Vector3 destination))
        {
            return false;
        }

        patrolDestination = destination;
        hasPatrolDestination = true;
        return true;
    }

    /// <summary>
    /// 현재 패트롤 포인트의 개별 설정 또는 루트 기본값에서 랜덤 대기 시간을 반환합니다.
    /// </summary>
    public float GetRandomPatrolWaitTime()
    {
        return HasPatrolRoute ? patrolRoute.GetRandomWaitTime(patrolIndex) : 0f;
    }

    /// <summary>
    /// 현재 배회 목적지 도착을 완료 처리하고 남은 배회 횟수를 하나 차감합니다.
    /// </summary>
    public void CompleteWanderDestination()
    {
        hasPatrolDestination = false;
        remainingWanderCount = Mathf.Max(0, remainingWanderCount - 1);
    }

    /// <summary>
    /// 현재 포인트에서 계획한 배회를 모두 마쳐 다음 패트롤 포인트를 선택해야 하는지 나타냅니다.
    /// </summary>
    public bool ShouldAdvancePatrolPoint => remainingWanderCount <= 0;

    /// <summary>
    /// 현재 포인트와 가까운 후보 중 하나를 무작위로 골라 다음 패트롤 포인트로 전환합니다.
    /// </summary>
    public void AdvanceToRandomNearbyPoint()
    {
        if (!HasPatrolRoute)
        {
            return;
        }

        patrolIndex = patrolRoute.GetRandomNearbyPointIndex(patrolIndex);
        remainingWanderCount = 0;
        hasPatrolDestination = false;
    }

    /// <summary>
    /// 생성된 랜덤 목적지와 남은 배회 횟수를 모두 초기화합니다.
    /// 추적 시작, 복귀 지점 변경, 스폰 초기화 시 이전 배회 상태가 남지 않게 합니다.
    /// </summary>
    public void ClearRandomPatrol()
    {
        hasPatrolDestination = false;
        patrolDestination = Vector3.zero;
        remainingWanderCount = 0;
    }

    /// <summary>
    /// 적이 순찰 루트에서 처음 벗어나는 시점의 위치와 순찰 인덱스를 저장합니다.
    /// 이미 이탈 기준점을 저장한 상태라면 기존 값을 유지해 복귀 기준점이 흔들리지 않게 합니다.
    /// </summary>
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

    /// <summary>
    /// 조사나 추적이 끝난 뒤 순찰 루트로 복귀해야 한다는 플래그를 기록합니다.
    /// 복귀 시작 시 순찰 포인트 대기는 다시 계산해야 하므로 대기 상태도 함께 초기화합니다.
    /// </summary>
    public void MarkNeedsReturnToPatrol()
    {
        if (!HasPatrolRoute)
        {
            return;
        }

        needsReturnToPatrol = true;
        ClearPatrolWait();
    }

    /// <summary>
    /// 현재 위치에서 가장 가까운 패트롤 포인트를 선택하고 순찰 복귀 상태로 전환합니다.
    /// </summary>
    public void MarkNeedsReturnToPatrol(Vector3 currentPosition)
    {
        if (!HasPatrolRoute)
        {
            return;
        }

        SelectClosestPatrolPoint(currentPosition);
        needsReturnToPatrol = true;
        ClearPatrolWait();
    }

    /// <summary>
    /// 복귀 관련 플래그와 기준점을 모두 초기화합니다.
    /// </summary>
    public void ClearReturnToPatrol()
    {
        needsReturnToPatrol = false;
        hasReturnAnchor = false;
        returnAnchorPosition = homePosition;
        returnPatrolIndex = patrolIndex;
    }

    /// <summary>
    /// 복귀 목적지까지 도달한 뒤 원래 순찰 흐름을 다시 이어갈 수 있도록 정리합니다.
    /// 이탈 직전에 바라보던 순찰 인덱스를 복원하고, 복귀 관련 플래그와 대기 상태를 함께 비웁니다.
    /// </summary>
    public void CompleteReturnToPatrol()
    {
        if (HasPatrolRoute)
        {
            patrolIndex = Mathf.Clamp(returnPatrolIndex, 0, patrolRoute.GetPointCount() - 1);
        }

        ClearPatrolWait();
        ClearReturnToPatrol();
    }

    /// <summary>
    /// 현재 순찰 포인트에서의 대기 타이머를 시작합니다.
    /// 루트 설정상 대기 시간이 0이면 즉시 다음 포인트로 넘어갈 수 있도록 대기 상태를 만들지 않습니다.
    /// </summary>
    public void BeginPatrolWait()
    {
        float waitDuration = GetWaitTimeAtPoint();
        if (waitDuration <= 0.0f)
        {
            isWaitingAtPatrolPoint = false;
            patrolWaitUntilTime = 0.0f;
            return;
        }

        isWaitingAtPatrolPoint = true;
        patrolWaitUntilTime = Time.time + waitDuration;
    }

    /// <summary>
    /// 랜덤으로 결정된 시간만큼 현재 배회 목적지에서 대기합니다.
    /// 0 이하의 시간이 전달되면 대기 상태를 만들지 않습니다.
    /// </summary>
    public void BeginPatrolWait(float waitDuration)
    {
        if (waitDuration <= 0.0f)
        {
            isWaitingAtPatrolPoint = false;
            patrolWaitUntilTime = 0.0f;
            return;
        }

        isWaitingAtPatrolPoint = true;
        patrolWaitUntilTime = Time.time + waitDuration;
    }

    /// <summary>
    /// 현재 순찰 포인트 대기 시간이 끝났는지 확인합니다.
    /// </summary>
    public bool HasCompletedPatrolWait()
    {
        return !isWaitingAtPatrolPoint || Time.time >= patrolWaitUntilTime;
    }

    /// <summary>
    /// 순찰 포인트 대기 상태를 초기화합니다.
    /// 조사 진입, 복귀 시작, 추적 전환 시 대기 타이머가 남아 있지 않도록 맞춰줍니다.
    /// </summary>
    public void ClearPatrolWait()
    {
        isWaitingAtPatrolPoint = false;
        patrolWaitUntilTime = 0.0f;
    }

    /// <summary>
    /// 다음 순찰 포인트 인덱스로 이동합니다.
    /// 실제 다음 인덱스 규칙은 루트가 관리하고, 메모리는 결과만 반영합니다.
    /// </summary>
    public void AdvancePatrolIndex()
    {
        if (!HasPatrolRoute)
        {
            patrolIndex = 0;
            return;
        }

        patrolIndex = patrolRoute.GetNextIndex(patrolIndex);
        if (patrolIndex < 0)
        {
            patrolIndex = 0;
        }
    }

    /// <summary>
    /// 현재 추적 중인 타겟의 위치 샘플을 갱신합니다.
    /// 같은 타겟을 두 번 이상 샘플링한 뒤부터는 최근 위치 차이로 이동 속도를 추정해 차단 이동 계산에 사용합니다.
    /// </summary>
    public void UpdateTargetTracking(Transform target)
    {
        if (target == null)
        {
            ClearTargetTracking();
            return;
        }

        int targetInstanceId = target.GetInstanceID();
        if (trackedTargetInstanceId != targetInstanceId)
        {
            BeginTargetTracking(target);
            return;
        }

        float now = Time.time;
        float deltaTime = now - lastTargetSampleTime;
        if (deltaTime <= 0.0001f)
        {
            return;
        }

        Vector3 currentPosition = target.position;
        estimatedTargetVelocity = EnemyMathUtility.GetFlatDirection(lastKnownTargetPosition, currentPosition) / deltaTime;
        lastKnownTargetPosition = currentPosition;
        lastTargetSampleTime = now;
        hasTargetMotionSample = true;
    }

    /// <summary>
    /// 새 타겟을 추적하기 시작할 때 첫 샘플을 기록합니다.
    /// 첫 샘플만으로는 속도를 알 수 없으므로 차단 이동은 다음 갱신부터 활성화됩니다.
    /// </summary>
    private void BeginTargetTracking(Transform target)
    {
        trackedTargetInstanceId = target.GetInstanceID();
        lastKnownTargetPosition = target.position;
        estimatedTargetVelocity = Vector3.zero;
        lastTargetSampleTime = Time.time;
        hasTargetMotionSample = false;
    }

    /// <summary>
    /// 플레이어 추적 샘플을 모두 초기화합니다.
    /// 타겟을 잃거나 조사 상태로 전환될 때 이전 샘플이 다음 추적에 섞이지 않도록 비웁니다.
    /// </summary>
    public void ClearTargetTracking()
    {
        trackedTargetInstanceId = 0;
        lastKnownTargetPosition = Vector3.zero;
        estimatedTargetVelocity = Vector3.zero;
        lastTargetSampleTime = 0.0f;
        hasTargetMotionSample = false;
    }

    /// <summary>
    /// 이번 프레임 추적이 직선 추적인지 차단 추적인지와 목적지를 기록합니다.
    /// 인스펙터에서 현재 추적 의도를 바로 확인할 수 있도록 디버그용으로도 사용합니다.
    /// </summary>
    public void SetChasePlan(ChaseMoveMode chaseMoveMode, Vector3 destination)
    {
        currentChaseMoveMode = chaseMoveMode;
        currentChaseDestination = destination;
    }

    /// <summary>
    /// 현재 추적 계획 표시를 초기화합니다.
    /// 추적이 끝났거나 공격 상태로 넘어가 더 이상 이동 목적지를 유지하지 않을 때 사용합니다.
    /// </summary>
    public void ClearChasePlan()
    {
        currentChaseMoveMode = ChaseMoveMode.Direct;
        currentChaseDestination = Vector3.zero;
    }
}
```

---

## 6. EnemyMovement.cs

### 6-1. 이전 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적 프리팹에 실제로 붙는 메인 AI 스크립트입니다.
/// 브레인, 기억, 감지, 이동, 전투 모듈을 묶고 스폰 직후 전달받은 순찰 정보까지 초기화합니다.
/// </summary>
public class EnemyMovement : MonoBehaviour
{
    [Header("Enemy AI Modules")]
    [SerializeField] private EnemyBrain brain = new EnemyBrain();                         // 상위 의사결정 모듈
    [SerializeField] private EnemyMemory memory = new EnemyMemory();                      // 순찰/복귀/추적 기억 모듈
    [SerializeField] private EnemyPerception perception = new EnemyPerception();          // 시야/청각 감지 모듈
    [SerializeField] private EnemyNoiseListener noiseListener = new EnemyNoiseListener(); // 소리 조사 모듈
    [SerializeField] private EnemyLocomotion locomotion = new EnemyLocomotion();          // 이동/회전/돌진 모듈
    [SerializeField] private EnemyCombat combat = new EnemyCombat();                      // 공격/2연격 모듈
    [SerializeField] private EnemyInterceptPlanner interceptPlanner = new EnemyInterceptPlanner(); // 먹잇감 차단 이동 예측 모듈

    [Header("Attack Anchor")]
    [SerializeField] private Transform attackOrigin;                                      // 실제 근접 판정 거리 계산 기준 위치

    [Header("Required Components")]
    private EnemyStatus myStatus;                                                         // 상태/스탯 컴포넌트
    private NavMeshAgent navAgent;                                                        // 이동용 NavMeshAgent
    private Coroutine aiRoutine;                                                          // AI 판단 루프 코루틴 핸들
    private BoxCollider collider;                                                         // 충돌 판정 콜라이더

    public float SightLength => perception.SightRange;
    public float AwarenessRange => perception.AwarenessRange;
    public float HearingRange => perception.HearingRange;
    public float SightAngle => perception.SightAngle;
    public float EyeHeight => perception.EyeHeight;
    public Transform CurrentTarget => brain.CurrentTarget;

    public event Action<bool> OnWalkEvent;                                                // 걷기 애니메이션 갱신 이벤트
    public event Action OnAttackEvent;                                                    // 공격 애니메이션 시작 이벤트
    public event Action OnDeathEvent;                                                     // 사망 애니메이션 시작 이벤트
    public event Action<int, int> OnLookDirEvent;                                         // 방향 애니메이션 갱신 이벤트

    private void Awake()
    {
        EnsureModules();

        navAgent = GetComponent<NavMeshAgent>();
        myStatus = GetComponent<EnemyStatus>();
        collider = GetComponentInChildren<BoxCollider>();

        if (navAgent == null || myStatus == null || collider == null)
        {
            enabled = false;
            Debug.LogError("EnemyMovement: required components are missing.");
            return;
        }

        // 공격 기준점이 별도로 연결되지 않았으면 body/HitRange를 우선 탐색합니다.
        ResolveAttackOrigin();

        brain.OnValidate();
        perception.OnValidate();
        noiseListener.OnValidate();
        locomotion.OnValidate();
        locomotion.Initialize(navAgent);
        combat.OnValidate();
        interceptPlanner.OnValidate();
    }

    private void OnValidate()
    {
        EnsureModules();

        brain.OnValidate();
        perception.OnValidate();
        noiseListener.OnValidate();
        locomotion.OnValidate();
        combat.OnValidate();
        interceptPlanner.OnValidate();

        if (attackOrigin == null)
        {
            ResolveAttackOrigin();
        }
    }

    private void OnEnable()
    {
        if (myStatus == null)
        {
            return;
        }

        myStatus.OnLocalDeath += Die;
        myStatus.OnAggroApplied += HandleAggroApplied;
        GlobalEventBus.OnNoiseEmitted += HandleNoiseEmitted;
    }

    private void Start()
    {
        if (myStatus == null)
        {
            return;
        }

        aiRoutine = StartCoroutine(CheckRoutine());
    }

    private void OnDisable()
    {
        if (myStatus == null)
        {
            return;
        }

        myStatus.OnLocalDeath -= Die;
        myStatus.OnAggroApplied -= HandleAggroApplied;
        GlobalEventBus.OnNoiseEmitted -= HandleNoiseEmitted;

        if (aiRoutine != null)
        {
            StopCoroutine(aiRoutine);
            aiRoutine = null;
        }
    }

    private void HandleAggroApplied(Transform target, float duration)
    {
        brain.ApplyAggro(target, duration);
    }

    /// <summary>
    /// 일정 주기마다 브레인에게 지금 어떤 행동을 해야 하는지 판단을 맡깁니다.
    /// 실제 상태 전환 로직은 EnemyBrain이 담당하고, 이 스크립트는 루프 진입점 역할만 합니다.
    /// </summary>
    private IEnumerator CheckRoutine()
    {
        while (myStatus.nowState != EnemyStatus.EnemyState.Dead)
        {
            brain.Tick(
                this,
                transform,
                myStatus,
                navAgent,
                memory,
                perception,
                noiseListener,
                locomotion,
                combat,
                interceptPlanner,
                RaiseWalkEvent,
                RaiseLookDirEvent,
                RaiseAttackEvent);

            yield return brain.GetCheckDelay();
        }

        aiRoutine = null;
    }

    /// <summary>
    /// 맵 어디선가 발생한 소리 이벤트를 받아 조사 상태로 전환할지 판단합니다.
    /// 조사로 전환되면 추적 타겟 기억과 현재 추적 목적지도 함께 비워 이전 추적 흔적이 남지 않게 합니다.
    /// </summary>
    private void HandleNoiseEmitted(NoiseStimulus stimulus)
    {
        if (!enabled || myStatus == null || myStatus.nowState == EnemyStatus.EnemyState.Dead)
        {
            return;
        }

        if (stimulus.Source == gameObject)
        {
            return;
        }

        bool hasRegisteredNoise = noiseListener.TryRegisterNoise(
            perception,
            transform,
            stimulus,
            brain.HasTarget,
            myStatus,
            out bool interruptedChase);

        if (hasRegisteredNoise && interruptedChase)
        {
            // 강한 소리에 추적이 끊긴 경우 기존 타겟과 추적 계획을 함께 비워 조사 상태가 우선되도록 합니다.
            brain.ClearTarget();
            memory.ClearTargetTracking();
            memory.ClearChasePlan();
        }

        if (hasRegisteredNoise)
        {
            // 여러 번 소리를 들어도 첫 이탈 지점을 유지해 복귀 시 같은 기준점으로 돌아가게 합니다.
            memory.CaptureReturnAnchor(transform.position);
            memory.MarkNeedsReturnToPatrol();
        }
    }

    /// <summary>
    /// 적이 죽으면 AI 루프를 멈추고 프레젠테이션 이벤트를 전달합니다.
    /// 진행 중이던 추적/공격 런타임 상태도 함께 정리합니다.
    /// </summary>
    public void Die()
    {
        StopAllCoroutines();
        aiRoutine = null;

        memory.ClearTargetTracking();
        memory.ClearChasePlan();
        
        combat.ClearRuntimeState();
        OnDeathEvent?.Invoke();

        navAgent.enabled = false;
        collider.enabled = false;

        Destroy(gameObject, 3.0f);
    }

    /// <summary>
    /// 스폰 직후 전달받은 순찰 루트와 시작 인덱스를 메모리에 기록합니다.
    /// SpawnManager가 적 생성 직후 한 번 호출하는 초기 진입점입니다.
    /// </summary>
    public void InitializeSpawnContext(Vector3 spawnPosition, EnemyPatrolRoute patrolRoute, int startPatrolIndex)
    {
        memory.InitializePatrol(spawnPosition, patrolRoute, startPatrolIndex);
    }

    /// <summary>
    /// 공격 애니메이션의 각 스윙 이벤트를 받아 해당 단계의 돌진과 공격 판정을 실행합니다.
    /// 2연격 구조를 애니메이션 이벤트 기준으로 분리하기 위한 진입점입니다.
    /// </summary>
    public void HandleAttackSwing(int swingIndex)
    {
        if (!enabled || myStatus == null || myStatus.nowState == EnemyStatus.EnemyState.Dead)
        {
            return;
        }

        StartCoroutine(combat.ExecuteSwing(
            transform,
            brain.CurrentTarget,
            attackOrigin != null ? attackOrigin : transform,
            navAgent,
            locomotion,
            RaiseLookDirEvent,
            swingIndex));
    }

    private void RaiseWalkEvent(bool isWalking)
    {
        OnWalkEvent?.Invoke(isWalking);
    }

    private void RaiseAttackEvent()
    {
        OnAttackEvent?.Invoke();
    }

    private void RaiseLookDirEvent(int lookDir, int lookRight)
    {
        OnLookDirEvent?.Invoke(lookDir, lookRight);
    }

    /// <summary>
    /// 인스펙터 직렬화 값이 비어 있을 때 기본 모듈 인스턴스를 다시 채워 넣습니다.
    /// 프리팹 재연결이나 스크립트 리로드 후 참조가 비는 상황을 방어하기 위한 함수입니다.
    /// </summary>
    private void EnsureModules()
    {
        brain ??= new EnemyBrain();
        memory ??= new EnemyMemory();
        perception ??= new EnemyPerception();
        noiseListener ??= new EnemyNoiseListener();
        locomotion ??= new EnemyLocomotion();
        combat ??= new EnemyCombat();
        interceptPlanner ??= new EnemyInterceptPlanner();
    }

    /// <summary>
    /// 공격 판정 기준점이 비어 있으면 프리팹 내부에서 body/HitRange를 자동 탐색합니다.
    /// 수동 지정이 없어도 기본 구조만 맞으면 바로 동작하게 하기 위한 보조 함수입니다.
    /// </summary>
    private void ResolveAttackOrigin()
    {
        if (attackOrigin != null)
        {
            return;
        }

        Transform body = transform.Find("body");
        if (body != null)
        {
            Transform hitRange = body.Find("HitRange");
            if (hitRange != null)
            {
                attackOrigin = hitRange;
                return;
            }
        }

        Transform directHitRange = transform.Find("HitRange");
        attackOrigin = directHitRange != null ? directHitRange : transform;
    }
}

/// <summary>
/// 적이 단순히 뒤를 쫓는 대신 플레이어 이동 방향 앞쪽을 선점하도록 예측 목적지를 계산하는 모듈입니다.
/// 실제 이동은 EnemyLocomotion이 담당하고, 이 모듈은 차단 이동을 시도할지와 목적지를 어디로 잡을지만 결정합니다.
/// </summary>
[Serializable]
public class EnemyInterceptPlanner
{
    [SerializeField] private bool enableInterceptChase = true;            // 차단 이동 사용 여부
    [SerializeField] private float minInterceptDistance = 4.0f;           // 너무 가까우면 차단 대신 바로 추적/공격으로 전환
    [SerializeField] private float maxInterceptDistance = 18.0f;          // 너무 멀면 예측 오차가 커져 차단을 시도하지 않음
    [SerializeField] private float minTargetMoveSpeed = 0.8f;             // 플레이어가 이 속도 이상으로 움직일 때만 차단 이동 시도
    [SerializeField] private float predictionTime = 0.9f;                 // 현재 속도를 몇 초 앞까지 예측할지
    [SerializeField] private float minLeadDistance = 1.8f;                // 최소 선점 거리
    [SerializeField] private float maxLeadDistance = 6.5f;                // 최대 선점 거리
    [SerializeField] private float awayDotThreshold = 0.0f;               // 플레이어가 적 정면 기준 어느 정도 바깥으로 움직여야 차단할지
    [SerializeField] private float interceptNavMeshSampleDistance = 2.5f; // 예측 지점을 NavMesh 위로 보정하는 반경
    [SerializeField] private float minInterceptAdvanceDistance = 0.75f;   // 현재 위치보다 앞을 자르는 느낌이 날 최소 차이

    public void OnValidate()
    {
        minInterceptDistance = Mathf.Max(0.0f, minInterceptDistance);
        maxInterceptDistance = Mathf.Max(minInterceptDistance, maxInterceptDistance);
        minTargetMoveSpeed = Mathf.Max(0.0f, minTargetMoveSpeed);
        predictionTime = Mathf.Max(0.05f, predictionTime);
        minLeadDistance = Mathf.Max(0.0f, minLeadDistance);
        maxLeadDistance = Mathf.Max(minLeadDistance, maxLeadDistance);
        awayDotThreshold = Mathf.Clamp(awayDotThreshold, -1.0f, 1.0f);
        interceptNavMeshSampleDistance = Mathf.Max(0.2f, interceptNavMeshSampleDistance);
        minInterceptAdvanceDistance = Mathf.Max(0.1f, minInterceptAdvanceDistance);
    }

    /// <summary>
    /// 현재 플레이어 이동 방향을 바탕으로 차단 이동 목적지를 계산합니다.
    /// 차단 가치가 없거나 예측점이 유효하지 않으면 false를 반환하고, 호출부는 기존 직선 추적으로 폴백합니다.
    /// </summary>
    public bool TryPlanIntercept(
        Transform self,
        Transform target,
        EnemyMemory memory,
        out Vector3 interceptDestination)
    {
        interceptDestination = target != null ? target.position : Vector3.zero;

        if (!enableInterceptChase || self == null || target == null || memory == null || !memory.HasTargetMotionSample)
        {
            return false;
        }

        Vector3 flatVelocity = memory.EstimatedTargetVelocity;
        flatVelocity.y = 0.0f;

        float targetMoveSpeed = flatVelocity.magnitude;
        if (targetMoveSpeed < minTargetMoveSpeed)
        {
            return false;
        }

        Vector3 toTarget = EnemyMathUtility.GetFlatDirection(self.position, target.position);
        float distanceToTarget = toTarget.magnitude;
        if (distanceToTarget <= 0.001f ||
            distanceToTarget < minInterceptDistance ||
            distanceToTarget > maxInterceptDistance)
        {
            return false;
        }

        Vector3 targetMoveDir = flatVelocity / targetMoveSpeed;
        float moveDot = Vector3.Dot(targetMoveDir, toTarget / distanceToTarget);
        if (moveDot < awayDotThreshold)
        {
            return false;
        }

        float leadDistance = Mathf.Clamp(targetMoveSpeed * predictionTime, minLeadDistance, maxLeadDistance);
        Vector3 predictedPosition = target.position + targetMoveDir * leadDistance;
        predictedPosition.y = target.position.y;

        float minAdvanceDistanceSqr = minInterceptAdvanceDistance * minInterceptAdvanceDistance;
        if (EnemyMathUtility.GetPlanarSqrDistance(predictedPosition, target.position) < minAdvanceDistanceSqr)
        {
            return false;
        }

        if (NavMesh.SamplePosition(predictedPosition, out NavMeshHit hit, interceptNavMeshSampleDistance, NavMesh.AllAreas))
        {
            predictedPosition = hit.position;
        }

        if (EnemyMathUtility.GetPlanarSqrDistance(predictedPosition, target.position) < minAdvanceDistanceSqr)
        {
            return false;
        }

        if (EnemyMathUtility.GetPlanarSqrDistance(self.position, predictedPosition) <= 0.01f)
        {
            return false;
        }

        interceptDestination = predictedPosition;
        return true;
    }
}
```

### 6-2. 설명

EnemyBrain, Memory, Perception, Locomotion, Combat을 연결하는 메인 MonoBehaviour다. 스폰 시 패트롤 루트와 시작 인덱스를 전달받는 초기화 진입점을 추가했고, 실제 이동 벡터 기반 애니메이션 동기화를 Update에서 수행하도록 분리했다. 공격 애니메이션 이벤트가 늦게 들어오더라도 현재 타깃이 사망 또는 탈출 상태라면 스윙 코루틴을 시작하지 않도록 방어했다.

### 6-3. 현재 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적 프리팹에 실제로 붙는 메인 AI 스크립트입니다.
/// 브레인, 기억, 감지, 이동, 전투 모듈을 묶고 스폰 직후 전달받은 순찰 정보까지 초기화합니다.
/// </summary>
public class EnemyMovement : MonoBehaviour
{
    [Header("Enemy AI Modules")]
    [SerializeField] private EnemyBrain brain = new EnemyBrain();                         // 상위 의사결정 모듈
    [SerializeField] private EnemyMemory memory = new EnemyMemory();                      // 순찰/복귀/추적 기억 모듈
    [SerializeField] private EnemyPerception perception = new EnemyPerception();          // 시야/청각 감지 모듈
    [SerializeField] private EnemyNoiseListener noiseListener = new EnemyNoiseListener(); // 소리 조사 모듈
    [SerializeField] private EnemyLocomotion locomotion = new EnemyLocomotion();          // 이동/회전/돌진 모듈
    [SerializeField] private EnemyCombat combat = new EnemyCombat();                      // 공격/2연격 모듈
    [SerializeField] private EnemyInterceptPlanner interceptPlanner = new EnemyInterceptPlanner(); // 먹잇감 차단 이동 예측 모듈

    [Header("Attack Anchor")]
    [SerializeField] private Transform attackOrigin;                                      // 실제 근접 판정 거리 계산 기준 위치

    [Header("Required Components")]
    private EnemyStatus myStatus;                                                         // 상태/스탯 컴포넌트
    private NavMeshAgent navAgent;                                                        // 이동용 NavMeshAgent
    private Coroutine aiRoutine;                                                          // AI 판단 루프 코루틴 핸들
    private BoxCollider collider;                                                         // 충돌 판정 콜라이더

    public float SightLength => perception.SightRange;
    public float AwarenessRange => perception.AwarenessRange;
    public float HearingRange => perception.HearingRange;
    public float SightAngle => perception.SightAngle;
    public float EyeHeight => perception.EyeHeight;
    public Transform CurrentTarget => brain.CurrentTarget;

    public event Action<bool> OnWalkEvent;                                                // 걷기 애니메이션 갱신 이벤트
    public event Action OnAttackEvent;                                                    // 공격 애니메이션 시작 이벤트
    public event Action OnDeathEvent;                                                     // 사망 애니메이션 시작 이벤트
    public event Action<int, int> OnLookDirEvent;                                         // 방향 애니메이션 갱신 이벤트

    private void Awake()
    {
        EnsureModules();

        navAgent = GetComponent<NavMeshAgent>();
        myStatus = GetComponent<EnemyStatus>();
        collider = GetComponentInChildren<BoxCollider>();

        if (navAgent == null || myStatus == null || collider == null)
        {
            enabled = false;
            Debug.LogError("EnemyMovement: required components are missing.");
            return;
        }

        // 공격 기준점이 별도로 연결되지 않았으면 body/HitRange를 우선 탐색합니다.
        ResolveAttackOrigin();

        brain.OnValidate();
        perception.OnValidate();
        noiseListener.OnValidate();
        locomotion.OnValidate();
        locomotion.Initialize(navAgent);
        combat.OnValidate();
        interceptPlanner.OnValidate();
    }

    private void OnValidate()
    {
        EnsureModules();

        brain.OnValidate();
        perception.OnValidate();
        noiseListener.OnValidate();
        locomotion.OnValidate();
        combat.OnValidate();
        interceptPlanner.OnValidate();

        if (attackOrigin == null)
        {
            ResolveAttackOrigin();
        }
    }

    private void OnEnable()
    {
        if (myStatus == null)
        {
            return;
        }

        myStatus.OnLocalDeath += Die;
        myStatus.OnAggroApplied += HandleAggroApplied;
        GlobalEventBus.OnNoiseEmitted += HandleNoiseEmitted;
    }

    private void Start()
    {
        if (myStatus == null)
        {
            return;
        }

        aiRoutine = StartCoroutine(CheckRoutine());
    }

    /// <summary>
    /// NavMeshAgent가 실제로 이동한 방향과 속도를 매 프레임 애니메이터에 전달합니다.
    /// AI 판단 주기와 분리해 코너 및 장애물 회피 중에도 스프라이트 방향이 이동과 어긋나지 않게 합니다.
    /// </summary>
    private void Update()
    {
        if (myStatus == null || myStatus.nowState == EnemyStatus.EnemyState.Dead)
        {
            return;
        }

        locomotion.SyncMovementAnimation(
            transform,
            navAgent,
            RaiseWalkEvent,
            RaiseLookDirEvent);
    }

    private void OnDisable()
    {
        if (myStatus == null)
        {
            return;
        }

        myStatus.OnLocalDeath -= Die;
        myStatus.OnAggroApplied -= HandleAggroApplied;
        GlobalEventBus.OnNoiseEmitted -= HandleNoiseEmitted;

        if (aiRoutine != null)
        {
            StopCoroutine(aiRoutine);
            aiRoutine = null;
        }
    }

    private void HandleAggroApplied(Transform target, float duration)
    {
        brain.ApplyAggro(target, duration);
    }

    /// <summary>
    /// 일정 주기마다 브레인에게 지금 어떤 행동을 해야 하는지 판단을 맡깁니다.
    /// 실제 상태 전환 로직은 EnemyBrain이 담당하고, 이 스크립트는 루프 진입점 역할만 합니다.
    /// </summary>
    private IEnumerator CheckRoutine()
    {
        while (myStatus.nowState != EnemyStatus.EnemyState.Dead)
        {
            brain.Tick(
                this,
                transform,
                myStatus,
                navAgent,
                memory,
                perception,
                noiseListener,
                locomotion,
                combat,
                interceptPlanner,
                RaiseWalkEvent,
                RaiseLookDirEvent,
                RaiseAttackEvent);

            yield return brain.GetCheckDelay();
        }

        aiRoutine = null;
    }

    /// <summary>
    /// 맵 어디선가 발생한 소리 이벤트를 받아 조사 상태로 전환할지 판단합니다.
    /// 조사로 전환되면 추적 타겟 기억과 현재 추적 목적지도 함께 비워 이전 추적 흔적이 남지 않게 합니다.
    /// </summary>
    private void HandleNoiseEmitted(NoiseStimulus stimulus)
    {
        if (!enabled || myStatus == null || myStatus.nowState == EnemyStatus.EnemyState.Dead)
        {
            return;
        }

        if (stimulus.Source == gameObject)
        {
            return;
        }

        bool hasRegisteredNoise = noiseListener.TryRegisterNoise(
            perception,
            transform,
            stimulus,
            brain.HasTarget,
            myStatus,
            out bool interruptedChase);

        if (hasRegisteredNoise && interruptedChase)
        {
            // 강한 소리에 추적이 끊긴 경우 기존 타겟과 추적 계획을 함께 비워 조사 상태가 우선되도록 합니다.
            brain.ClearTarget();
            memory.ClearTargetTracking();
            memory.ClearChasePlan();
        }

        if (hasRegisteredNoise)
        {
            // 여러 번 소리를 들어도 첫 이탈 지점을 유지해 복귀 시 같은 기준점으로 돌아가게 합니다.
            memory.MarkNeedsReturnToPatrol(transform.position);
        }
    }

    /// <summary>
    /// 적이 죽으면 AI 루프를 멈추고 프레젠테이션 이벤트를 전달합니다.
    /// 진행 중이던 추적/공격 런타임 상태도 함께 정리합니다.
    /// </summary>
    public void Die()
    {
        StopAllCoroutines();
        aiRoutine = null;

        memory.ClearTargetTracking();
        memory.ClearChasePlan();
        
        combat.ClearRuntimeState();
        OnDeathEvent?.Invoke();

        navAgent.enabled = false;
        collider.enabled = false;

        Destroy(gameObject, 3.0f);
    }

    /// <summary>
    /// 스폰 직후 전달받은 순찰 루트와 시작 인덱스를 메모리에 기록합니다.
    /// SpawnManager가 적 생성 직후 한 번 호출하는 초기 진입점입니다.
    /// </summary>
    public void InitializeSpawnContext(Vector3 spawnPosition, EnemyPatrolRoute patrolRoute, int startPatrolIndex)
    {
        memory.InitializePatrol(spawnPosition, patrolRoute, startPatrolIndex);
    }

    /// <summary>
    /// 공격 애니메이션의 각 스윙 이벤트를 받아 해당 단계의 돌진과 공격 판정을 실행합니다.
    /// 2연격 구조를 애니메이션 이벤트 기준으로 분리하기 위한 진입점입니다.
    /// </summary>
    public void HandleAttackSwing(int swingIndex)
    {
        if (!enabled || myStatus == null || myStatus.nowState == EnemyStatus.EnemyState.Dead)
        {
            return;
        }

        // 애니메이션 이벤트가 늦게 도착해도 사망하거나 탈출한 이전 타겟을 향한 스윙은 시작하지 않습니다.
        if (!EnemyPerception.IsTargetAvailable(brain.CurrentTarget))
        {
            return;
        }

        StartCoroutine(combat.ExecuteSwing(
            transform,
            brain.CurrentTarget,
            attackOrigin != null ? attackOrigin : transform,
            navAgent,
            locomotion,
            RaiseLookDirEvent,
            swingIndex));
    }

    private void RaiseWalkEvent(bool isWalking)
    {
        OnWalkEvent?.Invoke(isWalking);
    }

    private void RaiseAttackEvent()
    {
        OnAttackEvent?.Invoke();
    }

    private void RaiseLookDirEvent(int lookDir, int lookRight)
    {
        OnLookDirEvent?.Invoke(lookDir, lookRight);
    }

    /// <summary>
    /// 인스펙터 직렬화 값이 비어 있을 때 기본 모듈 인스턴스를 다시 채워 넣습니다.
    /// 프리팹 재연결이나 스크립트 리로드 후 참조가 비는 상황을 방어하기 위한 함수입니다.
    /// </summary>
    private void EnsureModules()
    {
        brain ??= new EnemyBrain();
        memory ??= new EnemyMemory();
        perception ??= new EnemyPerception();
        noiseListener ??= new EnemyNoiseListener();
        locomotion ??= new EnemyLocomotion();
        combat ??= new EnemyCombat();
        interceptPlanner ??= new EnemyInterceptPlanner();
    }

    /// <summary>
    /// 공격 판정 기준점이 비어 있으면 프리팹 내부에서 body/HitRange를 자동 탐색합니다.
    /// 수동 지정이 없어도 기본 구조만 맞으면 바로 동작하게 하기 위한 보조 함수입니다.
    /// </summary>
    private void ResolveAttackOrigin()
    {
        if (attackOrigin != null)
        {
            return;
        }

        Transform body = transform.Find("body");
        if (body != null)
        {
            Transform hitRange = body.Find("HitRange");
            if (hitRange != null)
            {
                attackOrigin = hitRange;
                return;
            }
        }

        Transform directHitRange = transform.Find("HitRange");
        attackOrigin = directHitRange != null ? directHitRange : transform;
    }
}

/// <summary>
/// 적이 단순히 뒤를 쫓는 대신 플레이어 이동 방향 앞쪽을 선점하도록 예측 목적지를 계산하는 모듈입니다.
/// 실제 이동은 EnemyLocomotion이 담당하고, 이 모듈은 차단 이동을 시도할지와 목적지를 어디로 잡을지만 결정합니다.
/// </summary>
[Serializable]
public class EnemyInterceptPlanner
{
    [SerializeField] private bool enableInterceptChase = true;            // 차단 이동 사용 여부
    [SerializeField] private float minInterceptDistance = 4.0f;           // 너무 가까우면 차단 대신 바로 추적/공격으로 전환
    [SerializeField] private float maxInterceptDistance = 18.0f;          // 너무 멀면 예측 오차가 커져 차단을 시도하지 않음
    [SerializeField] private float minTargetMoveSpeed = 0.8f;             // 플레이어가 이 속도 이상으로 움직일 때만 차단 이동 시도
    [SerializeField] private float predictionTime = 0.9f;                 // 현재 속도를 몇 초 앞까지 예측할지
    [SerializeField] private float minLeadDistance = 1.8f;                // 최소 선점 거리
    [SerializeField] private float maxLeadDistance = 6.5f;                // 최대 선점 거리
    [SerializeField] private float awayDotThreshold = 0.0f;               // 플레이어가 적 정면 기준 어느 정도 바깥으로 움직여야 차단할지
    [SerializeField] private float interceptNavMeshSampleDistance = 2.5f; // 예측 지점을 NavMesh 위로 보정하는 반경
    [SerializeField] private float minInterceptAdvanceDistance = 0.75f;   // 현재 위치보다 앞을 자르는 느낌이 날 최소 차이

    public void OnValidate()
    {
        minInterceptDistance = Mathf.Max(0.0f, minInterceptDistance);
        maxInterceptDistance = Mathf.Max(minInterceptDistance, maxInterceptDistance);
        minTargetMoveSpeed = Mathf.Max(0.0f, minTargetMoveSpeed);
        predictionTime = Mathf.Max(0.05f, predictionTime);
        minLeadDistance = Mathf.Max(0.0f, minLeadDistance);
        maxLeadDistance = Mathf.Max(minLeadDistance, maxLeadDistance);
        awayDotThreshold = Mathf.Clamp(awayDotThreshold, -1.0f, 1.0f);
        interceptNavMeshSampleDistance = Mathf.Max(0.2f, interceptNavMeshSampleDistance);
        minInterceptAdvanceDistance = Mathf.Max(0.1f, minInterceptAdvanceDistance);
    }

    /// <summary>
    /// 현재 플레이어 이동 방향을 바탕으로 차단 이동 목적지를 계산합니다.
    /// 차단 가치가 없거나 예측점이 유효하지 않으면 false를 반환하고, 호출부는 기존 직선 추적으로 폴백합니다.
    /// </summary>
    public bool TryPlanIntercept(
        Transform self,
        Transform target,
        EnemyMemory memory,
        out Vector3 interceptDestination)
    {
        interceptDestination = target != null ? target.position : Vector3.zero;

        if (!enableInterceptChase || self == null || target == null || memory == null || !memory.HasTargetMotionSample)
        {
            return false;
        }

        Vector3 flatVelocity = memory.EstimatedTargetVelocity;
        flatVelocity.y = 0.0f;

        float targetMoveSpeed = flatVelocity.magnitude;
        if (targetMoveSpeed < minTargetMoveSpeed)
        {
            return false;
        }

        Vector3 toTarget = EnemyMathUtility.GetFlatDirection(self.position, target.position);
        float distanceToTarget = toTarget.magnitude;
        if (distanceToTarget <= 0.001f ||
            distanceToTarget < minInterceptDistance ||
            distanceToTarget > maxInterceptDistance)
        {
            return false;
        }

        Vector3 targetMoveDir = flatVelocity / targetMoveSpeed;
        float moveDot = Vector3.Dot(targetMoveDir, toTarget / distanceToTarget);
        if (moveDot < awayDotThreshold)
        {
            return false;
        }

        float leadDistance = Mathf.Clamp(targetMoveSpeed * predictionTime, minLeadDistance, maxLeadDistance);
        Vector3 predictedPosition = target.position + targetMoveDir * leadDistance;
        predictedPosition.y = target.position.y;

        float minAdvanceDistanceSqr = minInterceptAdvanceDistance * minInterceptAdvanceDistance;
        if (EnemyMathUtility.GetPlanarSqrDistance(predictedPosition, target.position) < minAdvanceDistanceSqr)
        {
            return false;
        }

        if (NavMesh.SamplePosition(predictedPosition, out NavMeshHit hit, interceptNavMeshSampleDistance, NavMesh.AllAreas))
        {
            predictedPosition = hit.position;
        }

        if (EnemyMathUtility.GetPlanarSqrDistance(predictedPosition, target.position) < minAdvanceDistanceSqr)
        {
            return false;
        }

        if (EnemyMathUtility.GetPlanarSqrDistance(self.position, predictedPosition) <= 0.01f)
        {
            return false;
        }

        interceptDestination = predictedPosition;
        return true;
    }
}
```

---

## 7. EnemyPatrolPoint.cs

### 7-1. 이전 스크립트 전체

```cs
// 신규 파일이므로 이전 스크립트가 없습니다.
```

### 7-2. 설명

오늘 새로 추가한 순찰 포인트 데이터 컴포넌트다. 패트롤 지점을 단순 Transform 목록으로만 다루지 않고, 지점별 배회 반경과 대기 시간 같은 설정을 가질 수 있게 한다. 이를 통해 같은 루트 안에서도 에너미마다 정확히 같은 좌표를 밟지 않고 포인트 주변을 자연스럽게 배회할 수 있다.

### 7-3. 현재 스크립트 전체

```cs
using UnityEngine;

/// <summary>
/// 개별 순찰 포인트 주변의 랜덤 배회 범위와 체류 방식을 설정합니다.
/// 컴포넌트가 없는 기존 포인트는 EnemyPatrolRoute의 기본값을 사용합니다.
/// </summary>
[DisallowMultipleComponent]
public class EnemyPatrolPoint : MonoBehaviour
{
    [SerializeField, Min(0.0f)] private float wanderRadius = 3.0f;   // 이 포인트를 중심으로 NavMesh 목적지를 뽑을 반경
    [SerializeField, Min(1)] private int minWanderCount = 1;        // 다음 포인트로 넘어가기 전 최소 배회 횟수
    [SerializeField, Min(1)] private int maxWanderCount = 3;        // 다음 포인트로 넘어가기 전 최대 배회 횟수
    [SerializeField, Min(0.0f)] private float minWaitTime = 0.5f;   // 배회 목적지 도착 후 최소 체류 시간
    [SerializeField, Min(0.0f)] private float maxWaitTime = 2.5f;   // 배회 목적지 도착 후 최대 체류 시간

    public float WanderRadius => wanderRadius;
    public int MinWanderCount => minWanderCount;
    public int MaxWanderCount => maxWanderCount;
    public float MinWaitTime => minWaitTime;
    public float MaxWaitTime => maxWaitTime;

    private void OnValidate()
    {
        wanderRadius = Mathf.Max(0.0f, wanderRadius);
        minWanderCount = Mathf.Max(1, minWanderCount);
        maxWanderCount = Mathf.Max(minWanderCount, maxWanderCount);
        minWaitTime = Mathf.Max(0.0f, minWaitTime);
        maxWaitTime = Mathf.Max(minWaitTime, maxWaitTime);
    }
}
```

---

## 8. EnemyPatrolRoute.cs

### 8-1. 이전 스크립트 전체

```cs
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 하나의 적 순찰 경로를 담는 컴포넌트입니다.
/// 자식 오브젝트를 위에서 아래 순서대로 읽어 순찰 포인트로 사용합니다.
/// </summary>
[DisallowMultipleComponent]
public class EnemyPatrolRoute : MonoBehaviour
{
    [Header("Patrol Route")]
    [SerializeField] private bool loop = true;                    // 마지막 포인트 뒤에 다시 처음 포인트로 돌아갈지 여부
    [SerializeField, Min(0f)] private float waitTimeAtPoint = 1f; // 각 순찰 포인트 도착 후 머무를 시간
    [SerializeField, Min(0.1f)] private float pointReachDistance = 0.5f; // 포인트 도착 판정 거리
    [SerializeField] private bool includeInactivePoints = false;  // 비활성 포인트까지 경로에 포함할지 여부

    private readonly List<Transform> cachedPoints = new();
    private bool cacheDirty = true;

    public bool Loop => loop;
    public float WaitTimeAtPoint => waitTimeAtPoint;
    public float PointReachDistance => pointReachDistance;

    private void Awake()
    {
        RebuildCache();
    }

    private void OnValidate()
    {
        waitTimeAtPoint = Mathf.Max(0f, waitTimeAtPoint);
        pointReachDistance = Mathf.Max(0.1f, pointReachDistance);
        cacheDirty = true;
        RebuildCache();
    }

    private void OnTransformChildrenChanged()
    {
        cacheDirty = true;
    }

    /// <summary>
    /// 현재 경로에 등록된 순찰 포인트 수를 반환합니다.
    /// </summary>
    public int GetPointCount()
    {
        EnsureCache();
        return cachedPoints.Count;
    }

    /// <summary>
    /// 지정한 인덱스의 순찰 포인트를 반환합니다.
    /// 인덱스가 범위를 벗어나면 유효 범위 안으로 보정합니다.
    /// </summary>
    public Transform GetPoint(int index)
    {
        EnsureCache();
        if (cachedPoints.Count == 0)
        {
            return null;
        }

        index = Mathf.Clamp(index, 0, cachedPoints.Count - 1);
        return cachedPoints[index];
    }

    /// <summary>
    /// 스폰 위치에서 가장 가까운 순찰 포인트 인덱스를 계산합니다.
    /// 적이 경로 중간에서 시작하더라도 자연스럽게 가장 가까운 지점부터 돌게 만들기 위한 함수입니다.
    /// </summary>
    public int GetClosestPointIndex(Vector3 position)
    {
        EnsureCache();
        if (cachedPoints.Count == 0)
        {
            return 0;
        }

        int bestIndex = 0;
        float bestDistance = float.MaxValue;

        for (int i = 0; i < cachedPoints.Count; i++)
        {
            Transform point = cachedPoints[i];
            if (point == null)
            {
                continue;
            }

            float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(position, point.position);
            if (sqrDistance < bestDistance)
            {
                bestDistance = sqrDistance;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    /// <summary>
    /// 현재 순찰 포인트 기준 다음 포인트 인덱스를 반환합니다.
    /// loop가 켜져 있으면 마지막 다음에 처음으로 돌아가고,
    /// 꺼져 있으면 마지막 포인트에 머물도록 처리합니다.
    /// </summary>
    public int GetNextIndex(int currentIndex)
    {
        EnsureCache();
        if (cachedPoints.Count == 0)
        {
            return -1;
        }

        if (cachedPoints.Count == 1)
        {
            return 0;
        }

        int nextIndex = currentIndex + 1;
        if (loop)
        {
            return nextIndex % cachedPoints.Count;
        }

        return Mathf.Clamp(nextIndex, 0, cachedPoints.Count - 1);
    }

    /// <summary>
    /// 자식 포인트 캐시가 오래되었을 때만 다시 빌드합니다.
    /// 순찰 중 매 프레임 GetComponents 계열을 호출하지 않기 위한 캐시 처리입니다.
    /// </summary>
    private void EnsureCache()
    {
        if (!cacheDirty)
        {
            return;
        }

        RebuildCache();
    }

    /// <summary>
    /// 현재 자식 오브젝트 목록을 읽어 순찰 포인트 캐시를 다시 구성합니다.
    /// </summary>
    private void RebuildCache()
    {
        cacheDirty = false;
        cachedPoints.Clear();

        foreach (Transform child in transform)
        {
            if (child == null)
            {
                continue;
            }

            if (!includeInactivePoints && !child.gameObject.activeInHierarchy)
            {
                continue;
            }

            cachedPoints.Add(child);
        }
    }
}
```

### 8-2. 설명

여러 순찰 포인트를 하나의 에너미 활동 영역으로 관리한다. 포인트 인덱스, 지점별 랜덤 배회 목적지, 가장 가까운 포인트 검색, NavMesh 위 목적지 보정 기능을 추가했다. 순찰 포인트를 순번대로만 따라가는 구조에서 벗어나되, 에너미가 자기에게 지정된 루트 밖의 다른 구역으로 이동하지 않도록 루트 단위 경계를 유지한다.

### 8-3. 현재 스크립트 전체

```cs
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 하나의 적 순찰 경로를 담는 컴포넌트입니다.
/// 자식 오브젝트를 위에서 아래 순서대로 읽어 순찰 포인트로 사용합니다.
/// </summary>
[DisallowMultipleComponent]
public class EnemyPatrolRoute : MonoBehaviour
{
    [Header("Patrol Route")]
    [SerializeField] private bool loop = true;                    // 마지막 포인트 뒤에 다시 처음 포인트로 돌아갈지 여부
    [SerializeField, Min(0f)] private float waitTimeAtPoint = 1f; // 각 순찰 포인트 도착 후 머무를 시간
    [SerializeField, Min(0.1f)] private float pointReachDistance = 0.5f; // 포인트 도착 판정 거리
    [SerializeField] private bool includeInactivePoints = false;  // 비활성 포인트까지 경로에 포함할지 여부

    [Header("Random Wander")]
    [SerializeField, Min(0f)] private float defaultWanderRadius = 3f;       // 개별 설정이 없을 때 포인트 주변 배회 반경
    [SerializeField, Min(1)] private int defaultMinWanderCount = 1;        // 다음 포인트 전환 전 최소 배회 횟수
    [SerializeField, Min(1)] private int defaultMaxWanderCount = 3;        // 다음 포인트 전환 전 최대 배회 횟수
    [SerializeField, Min(0f)] private float defaultMinWaitTime = 0.5f;     // 배회 목적지 도착 후 최소 대기 시간
    [SerializeField, Min(0f)] private float defaultMaxWaitTime = 2.5f;     // 배회 목적지 도착 후 최대 대기 시간
    [SerializeField, Min(0.1f)] private float nearbyPointDistance = 12f;  // 무작위 다음 포인트 후보로 인정할 최대 거리
    [SerializeField, Min(1)] private int randomSampleAttempts = 10;       // NavMesh 배회 목적지 탐색 재시도 횟수
    [SerializeField, Min(0.1f)] private float navMeshSampleDistance = 2f; // 후보 위치를 NavMesh에 투영할 허용 거리

    private readonly List<Transform> cachedPoints = new();
    private bool cacheDirty = true;

    public bool Loop => loop;
    public float WaitTimeAtPoint => waitTimeAtPoint;
    public float PointReachDistance => pointReachDistance;

    private void Awake()
    {
        RebuildCache();
    }

    private void OnValidate()
    {
        waitTimeAtPoint = Mathf.Max(0f, waitTimeAtPoint);
        pointReachDistance = Mathf.Max(0.1f, pointReachDistance);
        defaultWanderRadius = Mathf.Max(0f, defaultWanderRadius);
        defaultMinWanderCount = Mathf.Max(1, defaultMinWanderCount);
        defaultMaxWanderCount = Mathf.Max(defaultMinWanderCount, defaultMaxWanderCount);
        defaultMinWaitTime = Mathf.Max(0f, defaultMinWaitTime);
        defaultMaxWaitTime = Mathf.Max(defaultMinWaitTime, defaultMaxWaitTime);
        nearbyPointDistance = Mathf.Max(0.1f, nearbyPointDistance);
        randomSampleAttempts = Mathf.Max(1, randomSampleAttempts);
        navMeshSampleDistance = Mathf.Max(0.1f, navMeshSampleDistance);
        cacheDirty = true;
        RebuildCache();
    }

    private void OnTransformChildrenChanged()
    {
        cacheDirty = true;
    }

    /// <summary>
    /// 현재 경로에 등록된 순찰 포인트 수를 반환합니다.
    /// </summary>
    public int GetPointCount()
    {
        EnsureCache();
        return cachedPoints.Count;
    }

    /// <summary>
    /// 지정한 인덱스의 순찰 포인트를 반환합니다.
    /// 인덱스가 범위를 벗어나면 유효 범위 안으로 보정합니다.
    /// </summary>
    public Transform GetPoint(int index)
    {
        EnsureCache();
        if (cachedPoints.Count == 0)
        {
            return null;
        }

        index = Mathf.Clamp(index, 0, cachedPoints.Count - 1);
        return cachedPoints[index];
    }

    /// <summary>
    /// 스폰 위치에서 가장 가까운 순찰 포인트 인덱스를 계산합니다.
    /// 적이 경로 중간에서 시작하더라도 자연스럽게 가장 가까운 지점부터 돌게 만들기 위한 함수입니다.
    /// </summary>
    public int GetClosestPointIndex(Vector3 position)
    {
        EnsureCache();
        if (cachedPoints.Count == 0)
        {
            return 0;
        }

        int bestIndex = 0;
        float bestDistance = float.MaxValue;

        for (int i = 0; i < cachedPoints.Count; i++)
        {
            Transform point = cachedPoints[i];
            if (point == null)
            {
                continue;
            }

            float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(position, point.position);
            if (sqrDistance < bestDistance)
            {
                bestDistance = sqrDistance;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    /// <summary>
    /// 현재 순찰 포인트 기준 다음 포인트 인덱스를 반환합니다.
    /// loop가 켜져 있으면 마지막 다음에 처음으로 돌아가고,
    /// 꺼져 있으면 마지막 포인트에 머물도록 처리합니다.
    /// </summary>
    public int GetNextIndex(int currentIndex)
    {
        EnsureCache();
        if (cachedPoints.Count == 0)
        {
            return -1;
        }

        if (cachedPoints.Count == 1)
        {
            return 0;
        }

        int nextIndex = currentIndex + 1;
        if (loop)
        {
            return nextIndex % cachedPoints.Count;
        }

        return Mathf.Clamp(nextIndex, 0, cachedPoints.Count - 1);
    }

    /// <summary>
    /// 전달된 위치에서 가장 가까운 활성 패트롤 포인트까지 평면 거리를 반환합니다.
    /// </summary>
    public float GetClosestPointDistance(Vector3 position)
    {
        Transform point = GetPoint(GetClosestPointIndex(position));
        return point == null
            ? float.MaxValue
            : Mathf.Sqrt(EnemyMathUtility.GetPlanarSqrDistance(position, point.position));
    }

    /// <summary>
    /// 지정한 포인트의 개별 설정 또는 루트 기본값으로 랜덤 배회 횟수를 생성합니다.
    /// </summary>
    public int GetRandomWanderCount(int pointIndex)
    {
        EnemyPatrolPoint settings = GetPointSettings(pointIndex);
        int min = settings != null ? settings.MinWanderCount : defaultMinWanderCount;
        int max = settings != null ? settings.MaxWanderCount : defaultMaxWanderCount;
        return Random.Range(min, max + 1);
    }

    /// <summary>
    /// 지정한 포인트의 개별 설정 또는 루트 기본값으로 랜덤 대기 시간을 생성합니다.
    /// </summary>
    public float GetRandomWaitTime(int pointIndex)
    {
        EnemyPatrolPoint settings = GetPointSettings(pointIndex);
        float min = settings != null ? settings.MinWaitTime : defaultMinWaitTime;
        float max = settings != null ? settings.MaxWaitTime : defaultMaxWaitTime;
        return Random.Range(min, max);
    }

    /// <summary>
    /// 지정한 포인트 주변에서 현재 에이전트가 완전한 경로로 도달할 수 있는 NavMesh 목적지를 찾습니다.
    /// </summary>
    public bool TryGetRandomWanderDestination(int pointIndex, NavMeshAgent agent, out Vector3 destination)
    {
        Transform point = GetPoint(pointIndex);
        destination = point != null ? point.position : transform.position;
        if (point == null || agent == null || !agent.isOnNavMesh)
        {
            return false;
        }

        EnemyPatrolPoint settings = point.GetComponent<EnemyPatrolPoint>();
        float radius = settings != null ? settings.WanderRadius : defaultWanderRadius;
        NavMeshPath path = new NavMeshPath();

        for (int i = 0; i < randomSampleAttempts; i++)
        {
            Vector2 offset = Random.insideUnitCircle * radius;
            Vector3 candidate = point.position + new Vector3(offset.x, 0f, offset.y);
            if (!NavMesh.SamplePosition(candidate, out NavMeshHit hit, navMeshSampleDistance, agent.areaMask))
            {
                continue;
            }

            if (agent.CalculatePath(hit.position, path) && path.status == NavMeshPathStatus.PathComplete)
            {
                destination = hit.position;
                return true;
            }
        }

        return NavMesh.SamplePosition(point.position, out NavMeshHit fallback, navMeshSampleDistance, agent.areaMask)
            && SetFallbackDestination(fallback.position, out destination);
    }

    /// <summary>
    /// 현재 포인트를 제외한 가까운 포인트 중 다음 목적지를 무작위로 선택합니다.
    /// 가까운 후보가 없으면 기존 순차 이동 규칙으로 대체합니다.
    /// </summary>
    public int GetRandomNearbyPointIndex(int currentIndex)
    {
        EnsureCache();
        if (cachedPoints.Count <= 1)
        {
            return Mathf.Clamp(currentIndex, 0, Mathf.Max(0, cachedPoints.Count - 1));
        }

        Transform current = GetPoint(currentIndex);
        List<int> candidates = new List<int>();
        float maxDistanceSqr = nearbyPointDistance * nearbyPointDistance;
        for (int i = 0; i < cachedPoints.Count; i++)
        {
            if (i == currentIndex || cachedPoints[i] == null)
            {
                continue;
            }

            if (current == null || EnemyMathUtility.GetPlanarSqrDistance(current.position, cachedPoints[i].position) <= maxDistanceSqr)
            {
                candidates.Add(i);
            }
        }

        return candidates.Count > 0
            ? candidates[Random.Range(0, candidates.Count)]
            : GetNextIndex(currentIndex);
    }

    /// <summary>
    /// 지정한 포인트에 연결된 개별 랜덤 배회 설정을 반환합니다.
    /// </summary>
    private EnemyPatrolPoint GetPointSettings(int pointIndex)
    {
        Transform point = GetPoint(pointIndex);
        return point != null ? point.GetComponent<EnemyPatrolPoint>() : null;
    }

    /// <summary>
    /// NavMesh에 투영된 대체 위치를 목적지로 반환합니다.
    /// </summary>
    private static bool SetFallbackDestination(Vector3 fallback, out Vector3 destination)
    {
        destination = fallback;
        return true;
    }

    /// <summary>
    /// 자식 포인트 캐시가 오래되었을 때만 다시 빌드합니다.
    /// 순찰 중 매 프레임 GetComponents 계열을 호출하지 않기 위한 캐시 처리입니다.
    /// </summary>
    private void EnsureCache()
    {
        if (!cacheDirty)
        {
            return;
        }

        RebuildCache();
    }

    /// <summary>
    /// 현재 자식 오브젝트 목록을 읽어 순찰 포인트 캐시를 다시 구성합니다.
    /// </summary>
    private void RebuildCache()
    {
        cacheDirty = false;
        cachedPoints.Clear();

        foreach (Transform child in transform)
        {
            if (child == null)
            {
                continue;
            }

            if (!includeInactivePoints && !child.gameObject.activeInHierarchy)
            {
                continue;
            }

            cachedPoints.Add(child);
        }
    }
}
```

---

## 9. EnemyPerception.cs

### 9-1. 이전 스크립트 전체

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 적의 감지 능력을 담당하는 모듈입니다.
/// 시야 범위, 추적 유지 범위, 청각 범위를 분리해서 관리합니다.
/// </summary>
[Serializable]
public class EnemyPerception
{
    [SerializeField] private float sightRange = 10.0f;       // 시야로 플레이어를 새로 발견할 수 있는 거리
    [SerializeField] private float awarenessRange = 20.0f;   // 이미 본 대상을 놓치지 않고 유지하는 거리
    [SerializeField] private float hearingRange = 40.0f;     // 소리를 들을 수 있는 최대 거리
    [SerializeField] private float sightAngle = 120.0f;      // 시야각
    [SerializeField] private float eyeHeight = 1.4f;         // 시야/청각 판정 시작 높이

    [Header("Hearing")]
    [SerializeField] private bool requireLineOfHearing = true; // 벽이 끼어 있으면 청각 반응을 막을지 여부
    [SerializeField] private LayerMask hearingObstacleMask;    // 소리를 막는 벽/장애물 레이어
    [SerializeField] private float soundSampleHeight = 1.2f;   // 소리 위치를 판정할 때 사용할 기준 높이

    [NonSerialized] private float sightRangeSqr;               // 시야 거리 제곱 캐시
    [NonSerialized] private float awarenessRangeSqr;           // 인지 유지 거리 제곱 캐시
    [NonSerialized] private float hearingRangeSqr;             // 청각 거리 제곱 캐시
    [NonSerialized] private float halfSightAngle;              // 반 시야각 캐시

    public float SightRange => sightRange;
    public float AwarenessRange => awarenessRange;
    public float HearingRange => hearingRange;
    public float SightAngle => sightAngle;
    public float EyeHeight => eyeHeight;

    public void OnValidate()
    {
        sightRange = Mathf.Max(0.0f, sightRange);
        awarenessRange = Mathf.Max(sightRange, awarenessRange);
        hearingRange = Mathf.Max(awarenessRange, hearingRange);
        sightAngle = Mathf.Clamp(sightAngle, 0.0f, 360.0f);
        eyeHeight = Mathf.Max(0.0f, eyeHeight);
        soundSampleHeight = Mathf.Max(0.0f, soundSampleHeight);

        sightRangeSqr = sightRange * sightRange;
        awarenessRangeSqr = awarenessRange * awarenessRange;
        hearingRangeSqr = hearingRange * hearingRange;
        halfSightAngle = sightAngle * 0.5f;
    }

    /// <summary>
    /// 현재 시야에 들어온 플레이어 중 가장 가까운 대상을 반환합니다.
    /// </summary>
    public Transform FindVisibleTarget(Transform self, ICollection<GameObject> players)
    {
        float closestDistance = float.MaxValue;
        Transform bestTarget = null;

        foreach (GameObject player in players)
        {
            if (player == null)
            {
                continue;
            }

            float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, player.transform.position);
            if (sqrDistance > sightRangeSqr)
            {
                continue;
            }

            if (!IsTargetInSight(self, player.transform))
            {
                continue;
            }

            if (sqrDistance < closestDistance)
            {
                closestDistance = sqrDistance;
                bestTarget = player.transform;
            }
        }

        return bestTarget;
    }

    /// <summary>
    /// 이미 인지한 대상을 아직 놓치지 않았는지 거리 기준으로 확인합니다.
    /// </summary>
    public bool CanKeepAwareness(Vector3 selfPosition, Transform target)
    {
        if (target == null)
        {
            return false;
        }

        return EnemyMathUtility.GetPlanarSqrDistance(selfPosition, target.position) <= awarenessRangeSqr;
    }

    /// <summary>
    /// 전달된 소리가 청각 범위 안에 있고, 필요하면 벽 차단 판정까지 통과하는지 확인합니다.
    /// </summary>
    public bool CanHear(Transform self, NoiseStimulus stimulus)
    {
        if (self == null)
        {
            return false;
        }

        float effectiveRadius = Mathf.Min(hearingRange, Mathf.Max(0.0f, stimulus.Radius));
        if (effectiveRadius <= 0.0f)
        {
            return false;
        }

        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, stimulus.Position);
        if (sqrDistance > hearingRangeSqr || sqrDistance > effectiveRadius * effectiveRadius)
        {
            return false;
        }

        // 수정 이유:
        // 기존에는 거리만 맞으면 소리를 들은 것으로 처리해서,
        // 벽 너머 총성이나 노이즈 오브젝트에도 적이 그대로 반응했습니다.
        // 이제는 적의 귀 위치와 소리 위치 사이에 차단물이 있으면 청각 반응을 막습니다.
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

    /// <summary>
    /// 시야각과 레이캐스트 차폐를 함께 검사해 실제로 보이는 대상인지 판정합니다.
    /// </summary>
    private bool IsTargetInSight(Transform self, Transform target)
    {
        if (target == null)
        {
            return false;
        }

        Vector3 flatForward = self.forward;
        flatForward.y = 0.0f;

        Vector3 flatDirectionToTarget = target.position - self.position;
        flatDirectionToTarget.y = 0.0f;

        if (flatDirectionToTarget.sqrMagnitude <= 0.001f)
        {
            return true;
        }

        float angleToTarget = Vector3.Angle(flatForward.normalized, flatDirectionToTarget.normalized);
        if (angleToTarget > halfSightAngle)
        {
            return false;
        }

        Vector3 eyePosition = self.position + Vector3.up * eyeHeight;
        Vector3 targetPosition = target.position + Vector3.up * eyeHeight;
        Vector3 directionToTarget = targetPosition - eyePosition;
        float targetDistance = directionToTarget.magnitude;

        if (targetDistance <= 0.001f)
        {
            return true;
        }

        if (Physics.Raycast(
                eyePosition,
                directionToTarget.normalized,
                out RaycastHit hit,
                targetDistance,
                ~0,
                QueryTriggerInteraction.Ignore))
        {
            return hit.transform == target || hit.transform.IsChildOf(target);
        }

        return false;
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 청각 차단물로 사용합니다.
    /// 기존 프리팹을 바로 다시 저장하지 않아도 벽 차단 로직이 우선 동작하도록 하기 위한 보정입니다.
    /// </summary>
    private LayerMask ResolveHearingObstacleMask()
    {
        if (hearingObstacleMask.value != 0)
        {
            return hearingObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }
}
```

### 9-2. 설명

시야, 청각, 장애물, 타깃 유효성 판정을 담당한다. 최초 감지 거리와 이미 인지한 대상의 유지 거리를 분리하고, 시야각을 제외한 실제 장애물 Line of Sight 검사를 추가했다. 청각은 가까운 에너미만 반응하고 벽을 통과한 소리를 제한할 수 있도록 정리했다. PlayerStatus가 있는 대상은 CanBeTargeted를 검사해 사망하거나 탈출한 플레이어를 신규 감지와 추적 유지 대상에서 제외한다.

### 9-3. 현재 스크립트 전체

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 적의 감지 능력을 담당하는 모듈입니다.
/// 시야 범위, 추적 유지 범위, 청각 범위를 분리해서 관리합니다.
/// </summary>
[Serializable]
public class EnemyPerception
{
    [SerializeField] private float sightRange = 10.0f;       // 시야로 플레이어를 새로 발견할 수 있는 거리
    [SerializeField] private float awarenessRange = 20.0f;   // 이미 본 대상을 놓치지 않고 유지하는 거리
    [SerializeField] private float hearingRange = 40.0f;     // 소리를 들을 수 있는 최대 거리
    [SerializeField] private float sightAngle = 120.0f;      // 시야각
    [SerializeField] private float eyeHeight = 1.4f;         // 시야/청각 판정 시작 높이

    [Header("Hearing")]
    [SerializeField] private bool requireLineOfHearing = true; // 벽이 끼어 있으면 청각 반응을 막을지 여부
    [SerializeField] private LayerMask hearingObstacleMask;    // 소리를 막는 벽/장애물 레이어
    [SerializeField] private float soundSampleHeight = 1.2f;   // 소리 위치를 판정할 때 사용할 기준 높이

    [NonSerialized] private float sightRangeSqr;               // 시야 거리 제곱 캐시
    [NonSerialized] private float awarenessRangeSqr;           // 인지 유지 거리 제곱 캐시
    [NonSerialized] private float hearingRangeSqr;             // 청각 거리 제곱 캐시
    [NonSerialized] private float halfSightAngle;              // 반 시야각 캐시

    public float SightRange => sightRange;
    public float AwarenessRange => awarenessRange;
    public float HearingRange => hearingRange;
    public float SightAngle => sightAngle;
    public float EyeHeight => eyeHeight;

    public void OnValidate()
    {
        sightRange = Mathf.Max(0.0f, sightRange);
        awarenessRange = Mathf.Max(sightRange, awarenessRange);
        hearingRange = Mathf.Max(awarenessRange, hearingRange);
        sightAngle = Mathf.Clamp(sightAngle, 0.0f, 360.0f);
        eyeHeight = Mathf.Max(0.0f, eyeHeight);
        soundSampleHeight = Mathf.Max(0.0f, soundSampleHeight);

        sightRangeSqr = sightRange * sightRange;
        awarenessRangeSqr = awarenessRange * awarenessRange;
        hearingRangeSqr = hearingRange * hearingRange;
        halfSightAngle = sightAngle * 0.5f;
    }

    /// <summary>
    /// 현재 시야에 들어온 플레이어 중 가장 가까운 대상을 반환합니다.
    /// </summary>
    public Transform FindVisibleTarget(Transform self, ICollection<GameObject> players)
    {
        float closestDistance = float.MaxValue;
        Transform bestTarget = null;

        foreach (GameObject player in players)
        {
            if (player == null)
            {
                continue;
            }

            // 사망하거나 탈출이 확정된 플레이어는 새 감지 대상으로 선택하지 않습니다.
            if (!IsTargetAvailable(player.transform))
            {
                continue;
            }

            float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, player.transform.position);
            if (sqrDistance > sightRangeSqr)
            {
                continue;
            }

            if (!IsTargetInSight(self, player.transform))
            {
                continue;
            }

            if (sqrDistance < closestDistance)
            {
                closestDistance = sqrDistance;
                bestTarget = player.transform;
            }
        }

        return bestTarget;
    }

    /// <summary>
    /// 이미 인지한 대상을 아직 놓치지 않았는지 거리 기준으로 확인합니다.
    /// </summary>
    public bool CanKeepAwareness(Vector3 selfPosition, Transform target)
    {
        if (!IsTargetAvailable(target))
        {
            return false;
        }

        return EnemyMathUtility.GetPlanarSqrDistance(selfPosition, target.position) <= awarenessRangeSqr;
    }

    /// <summary>
    /// 현재 타겟이 최초 감지 거리, 시야각, 장애물 판정을 모두 통과하는지 확인합니다.
    /// 추적 중인 타겟의 시야 상실 여부를 어그로와 분리해서 계산할 때 사용합니다.
    /// </summary>
    public bool CanSeeTarget(Transform self, Transform target)
    {
        return CanSeeTargetWithinRange(self, target, sightRangeSqr);
    }

    /// <summary>
    /// 이미 발견한 타겟은 최초 발견 거리보다 넓은 인지 유지 거리 안에서 시야를 판정합니다.
    /// 장애물과 시야각 판정은 그대로 적용되므로 벽 뒤 위치를 계속 아는 현상은 방지합니다.
    /// </summary>
    public bool CanSeeTrackedTarget(Transform self, Transform target)
    {
        return CanSeeTargetWithinRange(self, target, awarenessRangeSqr);
    }

    /// <summary>
    /// 시야각을 제외하고 에너미와 타겟 사이에 실제 장애물이 있는지만 확인합니다.
    /// 이미 교전 중인 플레이어가 근접해서 주위를 돌 때 타겟 유지 여부를 판정하는 데 사용합니다.
    /// </summary>
    public bool HasClearLineOfSight(Transform self, Transform target)
    {
        if (self == null || !IsTargetAvailable(target))
        {
            return false;
        }

        Vector3 eyePosition = self.position + Vector3.up * eyeHeight;
        Vector3 targetPosition = target.position + Vector3.up * eyeHeight;
        Vector3 directionToTarget = targetPosition - eyePosition;
        float targetDistance = directionToTarget.magnitude;

        if (targetDistance <= 0.001f)
        {
            return true;
        }

        if (!Physics.Raycast(
                eyePosition,
                directionToTarget.normalized,
                out RaycastHit hit,
                targetDistance,
                ~0,
                QueryTriggerInteraction.Ignore))
        {
            return true;
        }

        return hit.transform == target || hit.transform.IsChildOf(target);
    }

    /// <summary>
    /// 지정된 거리 제곱값 안에서 시야각과 장애물 판정을 함께 수행합니다.
    /// 최초 감지와 추적 유지 판정이 동일한 시야 규칙을 공유하도록 만든 내부 공통 함수입니다.
    /// </summary>
    private bool CanSeeTargetWithinRange(Transform self, Transform target, float rangeSqr)
    {
        if (self == null || !IsTargetAvailable(target))
        {
            return false;
        }

        if (EnemyMathUtility.GetPlanarSqrDistance(self.position, target.position) > rangeSqr)
        {
            return false;
        }

        return IsTargetInSight(self, target);
    }

    /// <summary>
    /// 전달된 소리가 청각 범위 안에 있고, 필요하면 벽 차단 판정까지 통과하는지 확인합니다.
    /// </summary>
    public bool CanHear(Transform self, NoiseStimulus stimulus)
    {
        if (self == null)
        {
            return false;
        }

        float effectiveRadius = Mathf.Min(hearingRange, Mathf.Max(0.0f, stimulus.Radius));
        if (effectiveRadius <= 0.0f)
        {
            return false;
        }

        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, stimulus.Position);
        if (sqrDistance > hearingRangeSqr || sqrDistance > effectiveRadius * effectiveRadius)
        {
            return false;
        }

        // 수정 이유:
        // 기존에는 거리만 맞으면 소리를 들은 것으로 처리해서,
        // 벽 너머 총성이나 노이즈 오브젝트에도 적이 그대로 반응했습니다.
        // 이제는 적의 귀 위치와 소리 위치 사이에 차단물이 있으면 청각 반응을 막습니다.
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

    /// <summary>
    /// 시야각과 레이캐스트 차폐를 함께 검사해 실제로 보이는 대상인지 판정합니다.
    /// </summary>
    private bool IsTargetInSight(Transform self, Transform target)
    {
        if (!IsTargetAvailable(target))
        {
            return false;
        }

        Vector3 flatForward = self.forward;
        flatForward.y = 0.0f;

        Vector3 flatDirectionToTarget = target.position - self.position;
        flatDirectionToTarget.y = 0.0f;

        if (flatDirectionToTarget.sqrMagnitude <= 0.001f)
        {
            return true;
        }

        float angleToTarget = Vector3.Angle(flatForward.normalized, flatDirectionToTarget.normalized);
        if (angleToTarget > halfSightAngle)
        {
            return false;
        }

        return HasClearLineOfSight(self, target);
    }

    /// <summary>
    /// 타겟 오브젝트가 현재 에너미에게 유효한 대상인지 공통으로 판정합니다.
    /// PlayerStatus가 있는 대상은 생존/세션 상태를 검사하고, 소음 미끼 같은 비플레이어 강제 어그로 대상은 기존 동작을 유지합니다.
    /// </summary>
    public static bool IsTargetAvailable(Transform target)
    {
        if (target == null)
        {
            return false;
        }

        PlayerStatus playerStatus = target.GetComponentInParent<PlayerStatus>();
        return playerStatus == null || playerStatus.CanBeTargeted;
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 청각 차단물로 사용합니다.
    /// 기존 프리팹을 바로 다시 저장하지 않아도 벽 차단 로직이 우선 동작하도록 하기 위한 보정입니다.
    /// </summary>
    private LayerMask ResolveHearingObstacleMask()
    {
        if (hearingObstacleMask.value != 0)
        {
            return hearingObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }
}
```

---

## 10. EnemyCombat.cs

### 10-1. 이전 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적의 전투 흐름을 담당하는 모듈입니다.
/// 공격 시작 가능 여부, 2연격 타이밍, 타격 거리, 데미지 적용을 한 곳에서 관리합니다.
/// </summary>
[Serializable]
public class EnemyCombat
{
    [SerializeField] private LayerMask attackObstacleMask;             // 공격 판정을 막는 벽/장애물 레이어

    [SerializeField] private float attackStartRange = 3.0f;            // 공격 코루틴을 시작할 수 있는 거리
    [SerializeField] private float attackHitRange = 1.2f;              // 실제 데미지가 들어가는 근접 판정 거리
    [SerializeField] private float attackCooldown = 2.0f;              // 한 번의 콤보 후 다시 공격 가능한 시간

    [SerializeField] private float firstSlashTelegraphTime = 0.35f;    // 공격 애니메이션을 시작하기 전 선딜 시간
    [SerializeField] private float attackAnimationDuration = 1.3333f;  // 공격 애니메이션 1회 전체 길이
    [SerializeField] private float attackRecoveryTime = 0.65f;         // 2타 종료 후 회복 시간

    [SerializeField] private float firstSlashLungeDistance = 1.0f;     // 1타 돌진 거리
    [SerializeField] private float secondSlashLungeDistance = 1.2f;    // 2타 돌진 거리
    [SerializeField] private float firstSlashLungeDuration = 0.15f;    // 1타 돌진 시간
    [SerializeField] private float secondSlashLungeDuration = 0.18f;   // 2타 돌진 시간

    [SerializeField] private float firstSlashDamage = 8.0f;            // 1타 피해량
    [SerializeField] private float secondSlashDamage = 12.0f;          // 2타 피해량
    [SerializeField] private float secondSlashTurnLimit = 25.0f;       // 2타 직전 보정 가능한 최대 회전 각도

    [NonSerialized] private float attackStartRangeSqr;                 // 공격 시작 거리 제곱값 캐시
    [NonSerialized] private float attackHitRangeSqr;                   // 실제 타격 거리 제곱값 캐시
    [NonSerialized] private float nextAttackAvailableTime;             // 다음 공격 가능 시각
    [NonSerialized] private float currentSlashDamage;                  // 현재 공격 단계에서 적용할 피해량
    [NonSerialized] private bool hasAppliedCurrentSlashDamage;         // 현재 타격 단계 피해 적용 여부

    public void OnValidate()
    {
        attackStartRange = Mathf.Max(0.1f, attackStartRange);
        attackHitRange = Mathf.Max(0.1f, attackHitRange);
        attackCooldown = Mathf.Max(0.0f, attackCooldown);
        firstSlashTelegraphTime = Mathf.Max(0.0f, firstSlashTelegraphTime);
        attackAnimationDuration = Mathf.Max(0.1f, attackAnimationDuration);
        attackRecoveryTime = Mathf.Max(0.0f, attackRecoveryTime);
        firstSlashLungeDistance = Mathf.Max(0.0f, firstSlashLungeDistance);
        secondSlashLungeDistance = Mathf.Max(0.0f, secondSlashLungeDistance);
        firstSlashLungeDuration = Mathf.Max(0.0f, firstSlashLungeDuration);
        secondSlashLungeDuration = Mathf.Max(0.0f, secondSlashLungeDuration);
        firstSlashDamage = Mathf.Max(0.0f, firstSlashDamage);
        secondSlashDamage = Mathf.Max(0.0f, secondSlashDamage);
        secondSlashTurnLimit = Mathf.Clamp(secondSlashTurnLimit, 0.0f, 180.0f);

        attackStartRangeSqr = attackStartRange * attackStartRange;
        attackHitRangeSqr = attackHitRange * attackHitRange;
    }

    /// <summary>
    /// 현재 대상과의 거리, 쿨다운 기준으로 공격 시작 가능 여부를 판정합니다.
    /// </summary>
    public bool CanStartAttack(float sqrDistToTarget)
    {
        return Time.time >= nextAttackAvailableTime && sqrDistToTarget <= attackStartRangeSqr;
    }

    /// <summary>
    /// 공격 애니메이션은 한 번만 재생하고, 실제 1타/2타는 애니메이션 이벤트가 호출합니다.
    /// </summary>
    public IEnumerator RunCombo(
        Transform self,
        Transform target,
        NavMeshAgent agent,
        EnemyStatus status,
        EnemyLocomotion locomotion,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent,
        Action onAttackEvent)
    {
        if (target == null)
        {
            yield break;
        }

        nextAttackAvailableTime = Time.time + attackCooldown;
        status.SetNowState(EnemyStatus.EnemyState.Attack);
        status.SetIsAttacking(true);

        locomotion.Stop(agent, onWalkEvent);
        locomotion.FacePosition(self, target.position, onLookDirEvent);
        ClearRuntimeState();

        if (firstSlashTelegraphTime > 0.0f)
        {
            yield return new WaitForSeconds(firstSlashTelegraphTime);
        }

        onAttackEvent?.Invoke();

        float comboRecovery = attackAnimationDuration + attackRecoveryTime;
        if (comboRecovery > 0.0f)
        {
            yield return new WaitForSeconds(comboRecovery);
        }

        ClearRuntimeState();
        status.SetIsAttacking(false);

        if (agent != null)
        {
            agent.isStopped = false;
        }
    }

    /// <summary>
    /// 애니메이션 이벤트로 들어온 스윙 번호에 따라 돌진 거리와 데미지를 분리 적용합니다.
    /// 이벤트 시점은 "팔이 나가기 직전"에 두는 편이 자연스럽습니다.
    /// </summary>
    public IEnumerator ExecuteSwing(
        Transform self,
        Transform target,
        Transform attackOrigin,
        NavMeshAgent agent,
        EnemyLocomotion locomotion,
        Action<int, int> onLookDirEvent,
        int swingIndex)
    {
        if (self == null || target == null)
        {
            yield break;
        }

        float swingDamage = swingIndex == 0 ? firstSlashDamage : secondSlashDamage;
        float lungeDistance = swingIndex == 0 ? firstSlashLungeDistance : secondSlashLungeDistance;
        float lungeDuration = swingIndex == 0 ? firstSlashLungeDuration : secondSlashLungeDuration;

        if (swingIndex > 0)
        {
            locomotion.FacePositionLimited(self, target.position, secondSlashTurnLimit, onLookDirEvent);
        }

        currentSlashDamage = swingDamage;
        hasAppliedCurrentSlashDamage = false;

        if (lungeDistance > 0.0f && lungeDuration > 0.0f)
        {
            yield return locomotion.PerformLunge(self, agent, lungeDistance, lungeDuration);
        }

        TryApplyCurrentSlashDamage(self, target, attackOrigin);
    }

    /// <summary>
    /// 현재 열린 타격 단계에 맞춰 데미지를 한 번만 적용합니다.
    /// </summary>
    public void TryApplyCurrentSlashDamage(Transform self, Transform target, Transform attackOrigin)
    {
        if (hasAppliedCurrentSlashDamage || currentSlashDamage <= 0.0f || target == null)
        {
            return;
        }

        Vector3 origin = attackOrigin != null ? attackOrigin.position : self.position;
        if (EnemyMathUtility.GetPlanarSqrDistance(origin, target.position) > attackHitRangeSqr)
        {
            return;
        }

        if (IsAttackBlockedByObstacle(origin, target.position))
        {
            return;
        }

        IEffectReceiver damageable = target.GetComponentInParent<IEffectReceiver>();
        if (damageable == null)
        {
            return;
        }

        damageable.TakeDamage(currentSlashDamage);
        hasAppliedCurrentSlashDamage = true;
    }

    /// <summary>
    /// 현재 공격 단계에서 남아 있던 런타임 상태를 정리합니다.
    /// </summary>
    public void ClearRuntimeState()
    {
        currentSlashDamage = 0.0f;
        hasAppliedCurrentSlashDamage = false;
    }

    /// <summary>
    /// 공격 상태에 들어간 뒤 대상이 벽 뒤로 이동한 경우 데미지가 적용되지 않도록 검사합니다.
    /// </summary>
    private bool IsAttackBlockedByObstacle(Vector3 origin, Vector3 targetPosition)
    {
        LayerMask obstacleMask = ResolveAttackObstacleMask();
        if (obstacleMask.value == 0)
        {
            return false;
        }

        Vector3 start = origin + Vector3.up * 0.5f;
        Vector3 end = targetPosition + Vector3.up * 0.5f;

        return Physics.Linecast(
            start,
            end,
            obstacleMask,
            QueryTriggerInteraction.Ignore);
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 공격 차단 레이어로 사용합니다.
    /// </summary>
    private LayerMask ResolveAttackObstacleMask()
    {
        if (attackObstacleMask.value != 0)
        {
            return attackObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }
}
```

### 10-2. 설명

공격 시작, 선딜 회전, 애니메이션 스윙, 실제 피해 적용을 담당한다. 근접 교전 유지 거리와 선딜 중 회전 속도를 추가해 플레이어가 에너미 주위를 돌 때 공격이 끊기는 현상을 완화했다. 공격 선딜, 공격 애니메이션, 돌진 후, 실제 피해 직전에 타깃 유효성을 반복 검사하며, 타깃이 사망하거나 탈출하면 남은 콤보를 취소하고 공격 상태와 NavMeshAgent를 정상 복구한다.

### 10-3. 현재 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 적의 전투 흐름을 담당하는 모듈입니다.
/// 공격 시작 가능 여부, 2연격 타이밍, 타격 거리, 데미지 적용을 한 곳에서 관리합니다.
/// </summary>
[Serializable]
public class EnemyCombat
{
    [SerializeField] private LayerMask attackObstacleMask;             // 공격 판정을 막는 벽/장애물 레이어

    [SerializeField] private float attackStartRange = 3.0f;            // 공격 코루틴을 시작할 수 있는 거리
    [SerializeField] private float attackHitRange = 1.2f;              // 실제 데미지가 들어가는 근접 판정 거리
    [SerializeField] private float closeCombatAwarenessRange = 6.0f;   // 교전 후 시야각 없이 타겟을 유지할 근접 거리
    [SerializeField] private float attackCooldown = 2.0f;              // 한 번의 콤보 후 다시 공격 가능한 시간

    [SerializeField] private float firstSlashTelegraphTime = 0.35f;    // 공격 애니메이션을 시작하기 전 선딜 시간
    [SerializeField] private float telegraphTurnSpeed = 360.0f;        // 선딜 중 플레이어를 따라 회전할 초당 최대 각도
    [SerializeField] private float attackAnimationDuration = 1.3333f;  // 공격 애니메이션 1회 전체 길이
    [SerializeField] private float attackRecoveryTime = 0.65f;         // 2타 종료 후 회복 시간

    [SerializeField] private float firstSlashLungeDistance = 1.0f;     // 1타 돌진 거리
    [SerializeField] private float secondSlashLungeDistance = 1.2f;    // 2타 돌진 거리
    [SerializeField] private float firstSlashLungeDuration = 0.15f;    // 1타 돌진 시간
    [SerializeField] private float secondSlashLungeDuration = 0.18f;   // 2타 돌진 시간

    [SerializeField] private float firstSlashDamage = 8.0f;            // 1타 피해량
    [SerializeField] private float secondSlashDamage = 12.0f;          // 2타 피해량
    [SerializeField] private float secondSlashTurnLimit = 25.0f;       // 2타 직전 보정 가능한 최대 회전 각도

    [NonSerialized] private float attackStartRangeSqr;                 // 공격 시작 거리 제곱값 캐시
    [NonSerialized] private float attackHitRangeSqr;                   // 실제 타격 거리 제곱값 캐시
    [NonSerialized] private float closeCombatAwarenessRangeSqr;        // 근접 타겟 유지 거리 제곱값 캐시
    [NonSerialized] private float nextAttackAvailableTime;             // 다음 공격 가능 시각
    [NonSerialized] private float currentSlashDamage;                  // 현재 공격 단계에서 적용할 피해량
    [NonSerialized] private bool hasAppliedCurrentSlashDamage;         // 현재 타격 단계 피해 적용 여부

    public void OnValidate()
    {
        attackStartRange = Mathf.Max(0.1f, attackStartRange);
        attackHitRange = Mathf.Max(0.1f, attackHitRange);
        closeCombatAwarenessRange = Mathf.Max(attackStartRange, closeCombatAwarenessRange);
        attackCooldown = Mathf.Max(0.0f, attackCooldown);
        firstSlashTelegraphTime = Mathf.Max(0.0f, firstSlashTelegraphTime);
        telegraphTurnSpeed = Mathf.Max(0.0f, telegraphTurnSpeed);
        attackAnimationDuration = Mathf.Max(0.1f, attackAnimationDuration);
        attackRecoveryTime = Mathf.Max(0.0f, attackRecoveryTime);
        firstSlashLungeDistance = Mathf.Max(0.0f, firstSlashLungeDistance);
        secondSlashLungeDistance = Mathf.Max(0.0f, secondSlashLungeDistance);
        firstSlashLungeDuration = Mathf.Max(0.0f, firstSlashLungeDuration);
        secondSlashLungeDuration = Mathf.Max(0.0f, secondSlashLungeDuration);
        firstSlashDamage = Mathf.Max(0.0f, firstSlashDamage);
        secondSlashDamage = Mathf.Max(0.0f, secondSlashDamage);
        secondSlashTurnLimit = Mathf.Clamp(secondSlashTurnLimit, 0.0f, 180.0f);

        attackStartRangeSqr = attackStartRange * attackStartRange;
        attackHitRangeSqr = attackHitRange * attackHitRange;
        closeCombatAwarenessRangeSqr = closeCombatAwarenessRange * closeCombatAwarenessRange;
    }

    /// <summary>
    /// 현재 대상과의 거리, 쿨다운 기준으로 공격 시작 가능 여부를 판정합니다.
    /// </summary>
    public bool CanStartAttack(float sqrDistToTarget)
    {
        return Time.time >= nextAttackAvailableTime && sqrDistToTarget <= attackStartRangeSqr;
    }

    /// <summary>
    /// 이미 교전 중인 타겟을 시야각과 무관하게 유지할 수 있는 근접 거리인지 확인합니다.
    /// 최초 감지에는 사용하지 않으며, 플레이어가 에너미 주위를 돌 때 전투가 끊기는 현상만 방지합니다.
    /// </summary>
    public bool IsWithinCloseCombatAwareness(float sqrDistToTarget)
    {
        return sqrDistToTarget <= closeCombatAwarenessRangeSqr;
    }

    /// <summary>
    /// 공격 애니메이션은 한 번만 재생하고, 실제 1타/2타는 애니메이션 이벤트가 호출합니다.
    /// </summary>
    public IEnumerator RunCombo(
        Transform self,
        Transform target,
        NavMeshAgent agent,
        EnemyStatus status,
        EnemyLocomotion locomotion,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent,
        Action onAttackEvent)
    {
        if (!EnemyPerception.IsTargetAvailable(target))
        {
            yield break;
        }

        nextAttackAvailableTime = Time.time + attackCooldown;
        status.SetNowState(EnemyStatus.EnemyState.Attack);
        status.SetIsAttacking(true);

        locomotion.Stop(agent, onWalkEvent);
        locomotion.FacePosition(self, target.position, onLookDirEvent);
        ClearRuntimeState();

        if (firstSlashTelegraphTime > 0.0f)
        {
            float elapsed = 0.0f;
            while (elapsed < firstSlashTelegraphTime)
            {
                if (!EnemyPerception.IsTargetAvailable(target))
                {
                    FinishAttack(agent, status);
                    yield break;
                }

                elapsed += Time.deltaTime;
                locomotion.FacePositionLimited(
                    self,
                    target.position,
                    telegraphTurnSpeed * Time.deltaTime,
                    onLookDirEvent);
                yield return null;
            }
        }

        // 예고 동작 도중 타겟이 사망했을 수 있으므로 공격 애니메이션을 시작하기 직전에 다시 검사합니다.
        if (!EnemyPerception.IsTargetAvailable(target))
        {
            FinishAttack(agent, status);
            yield break;
        }

        onAttackEvent?.Invoke();

        float comboRecovery = attackAnimationDuration + attackRecoveryTime;
        if (comboRecovery > 0.0f)
        {
            float elapsed = 0.0f;
            while (elapsed < comboRecovery)
            {
                // 공격 애니메이션 도중 타겟이 사망하면 남은 콤보를 즉시 취소합니다.
                if (!EnemyPerception.IsTargetAvailable(target))
                {
                    FinishAttack(agent, status);
                    yield break;
                }

                elapsed += Time.deltaTime;
                yield return null;
            }
        }

        FinishAttack(agent, status);
    }

    /// <summary>
    /// 애니메이션 이벤트로 들어온 스윙 번호에 따라 돌진 거리와 데미지를 분리 적용합니다.
    /// 이벤트 시점은 "팔이 나가기 직전"에 두는 편이 자연스럽습니다.
    /// </summary>
    public IEnumerator ExecuteSwing(
        Transform self,
        Transform target,
        Transform attackOrigin,
        NavMeshAgent agent,
        EnemyLocomotion locomotion,
        Action<int, int> onLookDirEvent,
        int swingIndex)
    {
        if (self == null || !EnemyPerception.IsTargetAvailable(target))
        {
            yield break;
        }

        float swingDamage = swingIndex == 0 ? firstSlashDamage : secondSlashDamage;
        float lungeDistance = swingIndex == 0 ? firstSlashLungeDistance : secondSlashLungeDistance;
        float lungeDuration = swingIndex == 0 ? firstSlashLungeDuration : secondSlashLungeDuration;

        if (swingIndex > 0)
        {
            locomotion.FacePositionLimited(self, target.position, secondSlashTurnLimit, onLookDirEvent);
        }

        currentSlashDamage = swingDamage;
        hasAppliedCurrentSlashDamage = false;

        if (lungeDistance > 0.0f && lungeDuration > 0.0f)
        {
            yield return locomotion.PerformLunge(self, agent, lungeDistance, lungeDuration);
        }

        // 돌진 중 타겟이 사망하거나 탈출했다면 실제 피해 판정을 실행하지 않습니다.
        if (!EnemyPerception.IsTargetAvailable(target))
        {
            yield break;
        }

        TryApplyCurrentSlashDamage(self, target, attackOrigin);
    }

    /// <summary>
    /// 현재 열린 타격 단계에 맞춰 데미지를 한 번만 적용합니다.
    /// </summary>
    public void TryApplyCurrentSlashDamage(Transform self, Transform target, Transform attackOrigin)
    {
        if (hasAppliedCurrentSlashDamage || currentSlashDamage <= 0.0f || !EnemyPerception.IsTargetAvailable(target))
        {
            return;
        }

        Vector3 origin = attackOrigin != null ? attackOrigin.position : self.position;
        if (EnemyMathUtility.GetPlanarSqrDistance(origin, target.position) > attackHitRangeSqr)
        {
            return;
        }

        if (IsAttackBlockedByObstacle(origin, target.position))
        {
            return;
        }

        IEffectReceiver damageable = target.GetComponentInParent<IEffectReceiver>();
        if (damageable == null)
        {
            return;
        }

        damageable.TakeDamage(currentSlashDamage);
        hasAppliedCurrentSlashDamage = true;
    }

    /// <summary>
    /// 현재 공격 단계에서 남아 있던 런타임 상태를 정리합니다.
    /// </summary>
    public void ClearRuntimeState()
    {
        currentSlashDamage = 0.0f;
        hasAppliedCurrentSlashDamage = false;
    }

    /// <summary>
    /// 공격 종료와 중도 취소가 같은 정리 절차를 사용하도록 런타임 상태와 NavMeshAgent를 복구합니다.
    /// </summary>
    private void FinishAttack(NavMeshAgent agent, EnemyStatus status)
    {
        ClearRuntimeState();

        if (status != null)
        {
            status.SetIsAttacking(false);
        }

        if (agent != null && agent.enabled)
        {
            agent.isStopped = false;
        }
    }

    /// <summary>
    /// 공격 상태에 들어간 뒤 대상이 벽 뒤로 이동한 경우 데미지가 적용되지 않도록 검사합니다.
    /// </summary>
    private bool IsAttackBlockedByObstacle(Vector3 origin, Vector3 targetPosition)
    {
        LayerMask obstacleMask = ResolveAttackObstacleMask();
        if (obstacleMask.value == 0)
        {
            return false;
        }

        Vector3 start = origin + Vector3.up * 0.5f;
        Vector3 end = targetPosition + Vector3.up * 0.5f;

        return Physics.Linecast(
            start,
            end,
            obstacleMask,
            QueryTriggerInteraction.Ignore);
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 공격 차단 레이어로 사용합니다.
    /// </summary>
    private LayerMask ResolveAttackObstacleMask()
    {
        if (attackObstacleMask.value != 0)
        {
            return attackObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }
}
```

---

## 11. PlayerStatus.cs

### 11-1. 이전 스크립트 전체

```cs

/// <summary>
/// 플레이어의 상태를 관리하는 스크립트
/// [26.06.16_강다영] 플레이어의 기본적인 스텟의 변화가 서로 다른 씬에서 일어날 상황에 대비해 기본값 초기화를 Awake에서 수행함. 추후 변동 가능
/// </summary>
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerStatus : MonoBehaviour, IEffectReceiver
{
    // 플레이어 상태
    public enum livingState { idle, escape, gameover }      // 플레이어가 가질 수 있는 상태의 종류
    public livingState nowState { get; private set; }       // 현재 플레이어
    public void SetPlayerState(livingState _state) => nowState = _state;
    public bool isReloading { get; private set; }           // 재장전 실행 중 여부
    public bool canSprint { get; private set; }             // 달리기 실행 가능 여부
    public bool cannotSprint;                               // 마나 소진 시 달리기 실행 불가 상태
    public float sprintRecoverTime;                         // 달리기 실행 불가 회복 시간
    public float evadeCooltime;                             // 구르기 쿨타임
    public float lastEvadeTime;                             // 최근 구르기 실행 시점

    int playerID;                                           // 플레이어 고유 번호

    // 플레이어 체력
    public float hpMax;                                     // 전체 체력
    public float hpCurrent;                                 // 현재 체력

    // 플레이어 마나
    public float mpMax;                                     // 마나 최대값
    public float mpCurrent { get; private set; }            // 현재 마나
    public float manaRegen;                                 // 초당 마나 회복량
    public float sprintMP;                                  // 달리기 중 초당 마나 소비량
    public float evadeMP;                                   // 구르기 시 마나 소비량

    private float artifactHpRegenBonus;                     // 아티팩트로 추가되는 초당 체력 회복량
    private float artifactMpRegenBonus;                     // 아티팩트로 추가되는 초당 마나 회복량

    [Header("Lucid Mark")]
    [SerializeField] private PlayerLucidMarkController lucidMark = new PlayerLucidMarkController();

    private LocalInputReader _input;                        // 플레이어 인게임 조작 입력
    private PlayerMovement _movement;                       // 플레이어 이동 조작

    private void OnValidate()
    {
        lucidMark?.OnValidate();
    }

    void Awake()
    {
        // EntityIdentity에서 플레이어 고유 번호를 가져옴
        playerID = GetComponent<EntityIdentity>().entityID;
        // 플레이어의 조작 관련 컴포넌트를 가져옴
        _input = GetComponent<LocalInputReader>();
        _movement = GetComponent<PlayerMovement>();
        lucidMark?.OnValidate();
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnGainManaRequested += GainMana;
        GlobalEventBus.OnHealRequested += HealingHealth;
        GlobalEventBus.OnSprintInput += CanSprint;
        GlobalEventBus.OnSprintManaConsume += UseSprintMana;
        GlobalEventBus.OnRequestManaConsume += RequestUseMana;
        GlobalEventBus.OnTimeOver += TimeOver;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnGainManaRequested -= GainMana;
        GlobalEventBus.OnHealRequested -= HealingHealth;
        GlobalEventBus.OnSprintInput -= CanSprint;
        GlobalEventBus.OnSprintManaConsume -= UseSprintMana;
        GlobalEventBus.OnRequestManaConsume -= RequestUseMana;
        GlobalEventBus.OnTimeOver -= TimeOver;

        // 플레이어가 비활성화되면 새 흔적 생성만 멈추고,
        // 이미 바닥에 떨어진 의식누출 흔적은 각자 수명만큼 남아 적을 유도합니다.
        lucidMark?.StopLeakEmission();
    }

    void Start()
    {
        ResultServiceLocator.Instance.Register(playerID, this);

        // UI 초기 업데이트
        UpdateHp();
        UpdateMp();

        // 초당 마나 소모 코루틴 시작
        StartCoroutine(HealingManaPerSeconds());
    }

    void FixedUpdate()  //현재 상태를 확인하여 입력 동작 여부를 체크
    {
        // 플레이어 상태가 idle인 경우에 입력 동작을 처리함
        bool canInput = (nowState == livingState.idle);
        if (_input != null) _input.enabled = canInput;
        if (_movement != null) _movement.enabled = canInput;

        // 루시드 낙인 유지 시간, 2중첩 의식누출 시간, 이동 경로 흔적 생성을 공통 틱에서 갱신합니다.
        lucidMark?.Tick(transform, gameObject);
    }

    #region Status Management
    /* 플레이어 상태 및 스텟 초기화 */
    public void initialize(float _hp, float _mp, float _regen, float _sMP, float _sTime, float _eMana, float _eCooltime)
    {
        nowState = livingState.idle;

        hpMax = _hp;
        hpCurrent = hpMax;
        mpMax = _mp;
        mpCurrent = mpMax;
        manaRegen = _regen;
        artifactHpRegenBonus = 0.0f;
        artifactMpRegenBonus = 0.0f;
        sprintMP = _sMP;
        cannotSprint = false;
        sprintRecoverTime = _sTime;
        evadeMP = _eMana;
        evadeCooltime = _eCooltime;
        lastEvadeTime = Time.time;

        // 새 스폰마다 낙인 상태를 초기화해 이전 런타임 정보가 남지 않게 합니다.
        lucidMark?.ResetRuntime(transform);
    }

    /* 피격 시 자신의 타입을 반환 */
    public Faction EntityFaction => Faction.player;

    /* 체력 UI 업데이트 */
    private void UpdateHp()
    {
        GlobalEventBus.OnPlayerHealthChanged?.Invoke(hpCurrent, hpMax);
    }

    /* 마나 UI 업데이트 */
    private void UpdateMp()
    {
        GlobalEventBus.OnPlayerManaChanged?.Invoke(mpCurrent, mpMax);
    }

#region 플레이어 상태 변화 및 수치 조절에 사용되는 메소드
    /* 체력 변화 */
    private void GetHp(float _val)
    {
        hpCurrent = Mathf.Clamp(hpCurrent + _val, 0, hpMax);
        UpdateHp();
        // 플레이어 체력이 0이 되었을 때 idle 상태이면 사망 처리 이벤트 및 게임오버 메소드를 발동
        if (hpCurrent <= 0 && nowState == livingState.idle)
        {
            GlobalEventBus.onPlayerDead?.Invoke(playerID);
            GameOver(playerID);
        }
    }

    /* 마나 변화 */
    private void GetMp(float _val)
    {
        mpCurrent = Mathf.Clamp(mpCurrent + _val, 0, mpMax);
        UpdateMp();
    }
#endregion

    /* 제한 시간 종료 이벤트에 게임 오버 처리를 연결 */
    public void TimeOver()
    {
        _movement.enabled = false;
        GameOver(playerID);
    }

    /* 게임 오버 처리 */
    public void GameOver(int _playerID)
    {
        // 플레이어 상태를 gameover로 변경
        SetPlayerState(livingState.gameover);
        // 코루틴 정지
        StopAllCoroutines();
        // 탈출 실패 판정 이벤트를 전송
        GlobalEventBus.OnEscapeRequest?.Invoke(false);
        // 스크립트 비활성화
        enabled = false;
    }

    // 플레이어가 idle 상태인지 확인
    public static bool IsPlayerIdle(int playerID)
    {
        var svc = ResultServiceLocator.Instance;
        // ResltServiceLocator가 제대로 로드되었는지 체크
        if (svc == null)
        {
            Debug.LogWarning($"IsPlayerIdle: ResultServiceLocator.Instance {svc} is null");
            return false;
        }
        else
        {
            Debug.Log($"IsPlayerIdle: ResultServiceLocator.Instance {svc} is loaded");
        }

        var comp = svc.GetPlayerComponent(playerID) as PlayerStatus;
        if (comp == null)
        {
            Debug.LogWarning($"PlayerStatus를 찾을 수 없습니다. playerID: {playerID}");
            return false;
        }
        return comp.nowState == livingState.idle;
    }

    /* 현재 달리기 가능한 상태인지 체크 */
    public void CanSprint(bool _isSprint)
    {
        // 현재 보유 마나가 1초당 달리기 시 소비 마나 이상인지 체크
        bool canSprint_Mana = mpCurrent >= sprintMP;
        // 달리기 동작 여부 최종 계산 후 달리기 이벤트 전송
        // (isSprint 입력 && 보유 마나가 1초당 소비 마나 이상 && 달리기 불가 상태 아님)
        canSprint = _isSprint && canSprint_Mana && !cannotSprint;
        GlobalEventBus.SendCanSprint?.Invoke(canSprint);
    }
    #endregion

    /* 피해 입을 시 체력 감소 처리 */
    public void TakeDamage(float dmg)
    {
        // 구르기 도중에는 플레이어가 피해를 받아 HP가 감소하지 않음
        if (_movement != null && _movement.isEvading) return;

        GetHp(-dmg);

        // 루시드 낙인은 "실제 피해를 입은 피격"에만 반응합니다.
        // 생존해 있다면 중첩, 시간 감소, 의식누출 시작/갱신을 여기서 처리합니다.
        if (hpCurrent > 0.0f)
        {
            lucidMark?.ApplyHit(transform, gameObject);
        }
        // 피해 입을 시 애니메이션 재생 이벤트
        GlobalEventBus.OnHitAnimate?.Invoke();
        // 피해 입을 시 탈출 실패 처리
        GlobalEventBus.OnEscapeFailure?.Invoke(playerID);
    }

    /* 공격 시 마나 사용 */
    public void UseAttackMana(float _useMana)
    {
        GetMp(-_useMana);
    }

    /// <summary>
    /// 아티팩트 장착 효과로 추가되는 HP/MP 회복 보정값을 갱신합니다.
    /// 원본 manaRegen은 캐릭터 기본값으로 유지하고, 회복 틱에서 보정값만 더해 사용합니다.
    /// </summary>
    public void ApplyArtifactStatusBonus(float hpRegenBonus, float mpRegenBonus)
    {
        artifactHpRegenBonus = Mathf.Max(0.0f, hpRegenBonus);
        artifactMpRegenBonus = Mathf.Max(0.0f, mpRegenBonus);
    }

    /* 달리기 중 시간당 마나 사용 */
    public void UseSprintMana(float _useMana)
    {
        GetMp(-_useMana * Time.fixedDeltaTime);

        // 마나 소비 후 보유 마나가 1초당 달리기 시 소비 마나 미만이 되면 달리기 불가 상태 전송 후 달리기 중단
        if (mpCurrent < sprintMP)
        {
            cannotSprint = true;
            GlobalEventBus.SendCannotSprint?.Invoke(cannotSprint);
            StartCoroutine(SprintRecover());
            return;
        }
    }

    /* 달리기 불가 상태 회복 코루틴*/
    private IEnumerator SprintRecover()
    {
        // 달리기 회복 시간 동안 대기 후 달리기 불가 상태를 해제
        yield return new WaitForSeconds(sprintRecoverTime);
        cannotSprint = false;
        GlobalEventBus.SendCannotSprint?.Invoke(cannotSprint);
    }

    /* 마나 사용 후 구르기 실행 */
    public void UseEvadeMana(float _useMana)
    {
        GetMp(-_useMana);
        _movement.PlayerEvade();
        lastEvadeTime = Time.time;
    }

    /* 초당 마나 회복 코루틴 */
    private IEnumerator HealingManaPerSeconds()
    {
        while (nowState != livingState.gameover)
        {
            if (artifactHpRegenBonus > 0.0f)
                GetHp(artifactHpRegenBonus);

            GetMp(manaRegen + artifactMpRegenBonus);
            yield return new WaitForSeconds(1.0f);
        }
    }

    private void HealingHealth(GameObject _target, float _effectValue)
    {
        // 대상이 내가 아니라면 리턴
        if (_target != this.gameObject) return;
        GetHp(_effectValue);
    }

    private void GainMana(GameObject _target, float _effectValue)
    {
        // 대상이 내가 아니라면 리턴
        if (_target != this.gameObject) return;
        GetMp(_effectValue);
    }

    /* 초상화 UI 업데이트 */
    private void UpdateFaceImage()
    {
        /// 플레이어 데이터 구조가 구축되면 연동하여 업데이트 할 것 ///
    }

    /* 아이템을 사용해 체력 회복 */
    public void HealthRecoverInst(float _amount)
    {
        GetHp(_amount);
    }

    /* 아이템을 사용해 마나 회복 */
    public void ManaRecoverInst(float _amount)
    {
        GetMp(_amount);
    }

    public bool RequestUseMana(float _useMana)
    {
        // 소모값에 비해 마나량이 부족할 시
        if(mpCurrent<_useMana)
        {
            return false;
        }
        // 마나가 충분하다면 소모 후 성공 여부를 리턴
        else
        {
            GetMp(-_useMana);
            return true;
        }
    }

    public void ApplyAggro(UnityEngine.Transform target, float duration)
    {
        // 플레이어는 타겟 강제 추적(어그로) 효과를 받지 않으므로 무시합니다.
    }
}

/// <summary>
/// 플레이어에게 쌓이는 루시드 낙인을 관리하는 런타임 모듈입니다.
/// 피격 중첩, 남은 시간 감소, 2중첩 시 의식누출 흔적 생성 시작/종료를 한곳에서 처리합니다.
/// </summary>
[Serializable]
public class PlayerLucidMarkController
{
    [Header("Mark Settings")]
    [SerializeField, Min(1)] private int maxStack = 2;                   // 루시드 낙인 최대 중첩 수
    [SerializeField, Min(1)] private int leakRequiredStack = 2;          // 의식누출이 시작되는 최소 중첩 수
    [SerializeField] private float hitTimePenaltySeconds = 5.0f;         // 피격 1회당 고정으로 감소시킬 남은 제한 시간
    [SerializeField] private float markDuration = 8.0f;                  // 낙인 중첩이 유지되는 기본 시간
    [SerializeField] private float leakDuration = 8.0f;                  // 2중첩 의식누출이 유지되는 기본 시간

    [Header("Leak Trace Settings")]
    [SerializeField] private float traceSpawnDistance = 1.8f;            // 마지막 흔적에서 이 거리 이상 이동했을 때 새 흔적 생성
    [SerializeField] private float traceSpawnMinInterval = 0.25f;        // 흔적이 너무 촘촘히 찍히지 않도록 막는 최소 간격
    [SerializeField] private float traceLifeTime = 4.0f;                 // 바닥에 남은 의식누출 흔적 오브젝트의 수명
    [SerializeField] private float traceNoisePulseInterval = 1.0f;       // 흔적이 자기 자리에서 소음을 다시 뿜는 간격
    [SerializeField] private float traceNoiseRadius = 45.0f;             // 흔적이 적을 유인하는 소음 반경
    [SerializeField] private float traceNoiseDuration = 3.0f;            // 흔적이 방출한 소음을 조사 대상으로 유지하는 시간
    [SerializeField] private int traceNoisePriority = 50;                // 흔적 소음 우선순위 (총성보다 높은 강한 유인용)
    [SerializeField] private bool traceCanInterruptChase = false;        // 현재 추적을 끊고 흔적을 조사하게 만들지 여부
    [SerializeField] private GameObject traceVisualPrefab;               // 바닥 흔적 데칼/VFX를 따로 붙이고 싶을 때 사용할 선택 프리팹
    [SerializeField] private Vector3 traceVisualLocalOffset = new Vector3(0.0f, 0.05f, 0.0f); // 시각 프리팹 위치 보정
    [SerializeField] private Vector3 traceVisualLocalScale = Vector3.one;                      // 시각 프리팹 크기 보정
    [SerializeField] private Color traceDebugColor = new Color(0.85f, 0.15f, 0.2f, 1.0f);    // Scene Gizmo 확인용 색상

    [Header("Runtime Debug")]
    [SerializeField] private int currentStack;                           // 현재 낙인 중첩
    [SerializeField] private bool isLeakEmissionActive;                  // 현재 새 누출 흔적 생성이 활성화되어 있는지 여부
    [SerializeField] private float markExpireTime;                       // 낙인 중첩이 만료되는 시각
    [SerializeField] private float leakExpireTime;                       // 의식누출 생성 상태가 만료되는 시각
    [SerializeField] private Vector3 lastTraceSpawnPosition;             // 마지막으로 흔적을 생성한 위치
    [SerializeField] private float lastTraceSpawnTime;                   // 마지막 흔적 생성 시각
    [SerializeField] private bool hasLastTraceSpawnPosition;             // 마지막 흔적 위치가 유효한지 여부
    [SerializeField] private int spawnedTraceCount;                      // 현재까지 생성한 흔적 개수 (디버그용)

    public void OnValidate()
    {
        maxStack = Mathf.Max(1, maxStack);
        leakRequiredStack = Mathf.Clamp(leakRequiredStack, 1, maxStack);
        hitTimePenaltySeconds = Mathf.Max(0.0f, hitTimePenaltySeconds);
        markDuration = Mathf.Max(0.1f, markDuration);
        leakDuration = Mathf.Max(0.1f, leakDuration);
        traceSpawnDistance = Mathf.Max(0.1f, traceSpawnDistance);
        traceSpawnMinInterval = Mathf.Max(0.05f, traceSpawnMinInterval);
        traceLifeTime = Mathf.Max(0.1f, traceLifeTime);
        traceNoisePulseInterval = Mathf.Max(0.1f, traceNoisePulseInterval);
        traceNoiseRadius = Mathf.Max(0.1f, traceNoiseRadius);
        traceNoiseDuration = Mathf.Max(0.1f, traceNoiseDuration);
    }

    /// <summary>
    /// 플레이어 스폰 직후 낙인 런타임 상태를 초기화합니다.
    /// 이전 전투에서 남아 있던 중첩/누출 시간이 다음 스폰으로 넘어가지 않게 막습니다.
    /// </summary>
    public void ResetRuntime(Transform owner)
    {
        currentStack = 0;
        isLeakEmissionActive = false;
        markExpireTime = 0.0f;
        leakExpireTime = 0.0f;
        lastTraceSpawnTime = 0.0f;
        hasLastTraceSpawnPosition = false;
        spawnedTraceCount = 0;

        if (owner != null)
        {
            lastTraceSpawnPosition = owner.position;
        }
    }

    /// <summary>
    /// 플레이어가 활성화된 동안 낙인 유지 시간과 의식누출 흔적 생성을 업데이트합니다.
    /// 2중첩 상태에서는 일정 거리마다 바닥에 새 흔적 오브젝트를 남깁니다.
    /// </summary>
    public void Tick(Transform owner, GameObject source)
    {
        if (currentStack <= 0)
        {
            return;
        }

        if (Time.time >= markExpireTime)
        {
            ClearMarkRuntime();
            return;
        }

        if (!isLeakEmissionActive || currentStack < leakRequiredStack)
        {
            return;
        }

        if (Time.time >= leakExpireTime)
        {
            StopLeakEmission();
            return;
        }

        TrySpawnTrace(owner, source, false);
    }

    /// <summary>
    /// 플레이어가 피격될 때마다 낙인 중첩과 시간을 갱신합니다.
    /// 2중첩에 도달하면 의식누출 흔적 생성을 시작하고,
    /// 이미 2중첩이면 새 중첩은 추가하지 않고 유지 시간만 갱신합니다.
    /// </summary>
    public void ApplyHit(Transform owner, GameObject source)
    {
        if (hitTimePenaltySeconds > 0.0f)
        {
            GlobalEventBus.OnTimePenaltyRequested?.Invoke(hitTimePenaltySeconds);
        }

        currentStack = Mathf.Min(currentStack + 1, maxStack);
        markExpireTime = Time.time + markDuration;

        if (currentStack < leakRequiredStack)
        {
            return;
        }

        leakExpireTime = Time.time + leakDuration;
        isLeakEmissionActive = true;

        // 2중첩 진입 시점이나 2중첩 상태 재피격 시점에도 현재 자리에서 흔적 하나를 즉시 떨궈,
        // "맞은 위치부터 누출이 시작된다"는 체감을 주도록 만듭니다.
        TrySpawnTrace(owner, source, true);
    }

    /// <summary>
    /// 플레이어 비활성화나 2중첩 종료 시 새 흔적 생성만 중단합니다.
    /// 이미 바닥에 떨어진 흔적은 각자 수명이 끝날 때까지 남아 적을 유도합니다.
    /// </summary>
    public void StopLeakEmission()
    {
        isLeakEmissionActive = false;
        leakExpireTime = 0.0f;
        hasLastTraceSpawnPosition = false;
        lastTraceSpawnTime = 0.0f;
    }

    private void ClearMarkRuntime()
    {
        currentStack = 0;
        markExpireTime = 0.0f;
        StopLeakEmission();
    }

    private void TrySpawnTrace(Transform owner, GameObject source, bool forceSpawn)
    {
        if (owner == null || !isLeakEmissionActive)
        {
            return;
        }

        Vector3 spawnPosition = owner.position;

        if (!forceSpawn)
        {
            if (Time.time < lastTraceSpawnTime + traceSpawnMinInterval)
            {
                return;
            }

            float spawnDistanceSqr = traceSpawnDistance * traceSpawnDistance;
            if (hasLastTraceSpawnPosition &&
                GetPlanarSqrDistance(spawnPosition, lastTraceSpawnPosition) < spawnDistanceSqr)
            {
                return;
            }
        }

        SpawnTraceObject(spawnPosition, source);
        lastTraceSpawnPosition = spawnPosition;
        lastTraceSpawnTime = Time.time;
        hasLastTraceSpawnPosition = true;
    }

    private void SpawnTraceObject(Vector3 spawnPosition, GameObject source)
    {
        spawnedTraceCount++;

        GameObject traceObject = new($"LucidLeakTrace_{spawnedTraceCount}");
        traceObject.transform.SetPositionAndRotation(spawnPosition, Quaternion.identity);

        LucidLeakTraceRuntime traceRuntime = traceObject.AddComponent<LucidLeakTraceRuntime>();
        traceRuntime.Initialize(
            source,
            traceLifeTime,
            traceNoisePulseInterval,
            traceNoiseRadius,
            traceNoiseDuration,
            traceNoisePriority,
            traceCanInterruptChase,
            traceVisualPrefab,
            traceVisualLocalOffset,
            traceVisualLocalScale,
            traceDebugColor);
    }

    private static float GetPlanarSqrDistance(Vector3 a, Vector3 b)
    {
        float deltaX = a.x - b.x;
        float deltaZ = a.z - b.z;
        return deltaX * deltaX + deltaZ * deltaZ;
    }
}

/// <summary>
/// 루시드 의식누출 흔적 1개를 나타내는 런타임 오브젝트입니다.
/// 생성된 자리에 남아 일정 시간 동안 반복적으로 소음을 방출해,
/// 적이 플레이어 본체가 아니라 지나간 흔적을 따라 조사하도록 만듭니다.
/// </summary>
public class LucidLeakTraceRuntime : MonoBehaviour
{
    [SerializeField] private bool drawDebugRadius = true;               // Scene Gizmo로 유인 범위를 표시할지 여부

    private GameObject sourceObject;                                    // 이 누출이 어떤 플레이어에게서 떨어졌는지 기록
    private float lifeTime;                                             // 흔적 오브젝트 전체 수명
    private float noisePulseInterval;                                   // 소음 재방출 간격
    private float noiseRadius;                                          // 소음 유인 반경
    private float noiseDuration;                                        // 각 소음 펄스가 유지되는 시간
    private int noisePriority;                                          // 현재 조사 중인 다른 약한 소음을 덮어쓸 우선순위
    private bool canInterruptChase;                                     // 적의 현재 추적을 끊을지 여부
    private GameObject traceVisualPrefab;                               // 선택적으로 붙일 데칼/VFX 프리팹
    private Vector3 traceVisualLocalOffset;                             // 시각 프리팹 위치 보정
    private Vector3 traceVisualLocalScale;                              // 시각 프리팹 크기 보정
    private Color debugColor = Color.red;                               // Scene Gizmo 색상
    private GameObject spawnedVisual;                                   // 현재 생성된 시각 프리팹 인스턴스

    /// <summary>
    /// 런타임 생성 직후 누출 흔적의 동작 데이터를 주입합니다.
    /// Awake/Start를 기다리지 않고 바로 초기 펄스를 시작할 수 있게 수동 초기화 방식을 사용합니다.
    /// </summary>
    public void Initialize(
        GameObject newSourceObject,
        float newLifeTime,
        float newNoisePulseInterval,
        float newNoiseRadius,
        float newNoiseDuration,
        int newNoisePriority,
        bool newCanInterruptChase,
        GameObject newTraceVisualPrefab,
        Vector3 newTraceVisualLocalOffset,
        Vector3 newTraceVisualLocalScale,
        Color newDebugColor)
    {
        sourceObject = newSourceObject;
        lifeTime = Mathf.Max(0.1f, newLifeTime);
        noisePulseInterval = Mathf.Max(0.1f, newNoisePulseInterval);
        noiseRadius = Mathf.Max(0.1f, newNoiseRadius);
        noiseDuration = Mathf.Max(0.1f, newNoiseDuration);
        noisePriority = newNoisePriority;
        canInterruptChase = newCanInterruptChase;
        traceVisualPrefab = newTraceVisualPrefab;
        traceVisualLocalOffset = newTraceVisualLocalOffset;
        traceVisualLocalScale = newTraceVisualLocalScale;
        debugColor = newDebugColor;

        AttachVisualIfNeeded();
        StartCoroutine(PulseNoiseRoutine());
        Destroy(gameObject, lifeTime);
    }

    private IEnumerator PulseNoiseRoutine()
    {
        float endTime = Time.time + lifeTime;

        // 첫 흔적은 생성 즉시 한 번 소음을 내보내 "맞은 자리에서 누출이 시작된다"는 감각을 줍니다.
        EmitLeakNoise();

        while (Time.time < endTime)
        {
            yield return new WaitForSeconds(noisePulseInterval);

            if (this == null)
            {
                yield break;
            }

            EmitLeakNoise();
        }
    }

    private void EmitLeakNoise()
    {
        // 일반 소음은 NoiseManager가 임시 오브젝트를 만들어 기준점을 잡지만,
        // 의식누출은 "바닥에 남은 흔적 그 자체"가 소음원이어야 하므로
        // 이 런타임 오브젝트를 AnchorTransform으로 직접 브로드캐스트합니다.
        GlobalEventBus.OnNoiseEmitted?.Invoke(new NoiseStimulus(
            NoiseType.LucidLeak,
            transform.position,
            sourceObject != null ? sourceObject : gameObject,
            noiseRadius,
            noiseDuration,
            canInterruptChase,
            noisePriority,
            Time.time,
            transform));
    }

    private void AttachVisualIfNeeded()
    {
        if (traceVisualPrefab == null)
        {
            return;
        }

        spawnedVisual = Instantiate(traceVisualPrefab, transform);
        spawnedVisual.transform.localPosition = traceVisualLocalOffset;
        spawnedVisual.transform.localRotation = Quaternion.identity;
        spawnedVisual.transform.localScale = traceVisualLocalScale;
    }

    private void OnDestroy()
    {
        if (spawnedVisual != null)
        {
            Destroy(spawnedVisual);
        }
    }

    private void OnDrawGizmos()
    {
        if (!drawDebugRadius || noiseRadius <= 0.0f)
        {
            return;
        }

        Gizmos.color = debugColor;
        Gizmos.DrawWireSphere(transform.position, noiseRadius);
    }
}
```

### 11-2. 설명

플레이어 생존 상태와 피격 처리를 관리한다. 사망 또는 탈출 확정 여부를 나타내는 IsSessionEnded와 에너미가 타깃으로 선택할 수 있는지 나타내는 CanBeTargeted를 추가했다. 종료 이후 TakeDamage가 호출되더라도 HP, 피격 애니메이션, 루시드 낙인, 시간 패널티, 탈출 실패 이벤트가 다시 실행되지 않는다. 종료 이벤트가 발생한 즉시 입력과 이동도 함께 비활성화한다.

### 11-3. 현재 스크립트 전체

```cs

/// <summary>
/// 플레이어의 상태를 관리하는 스크립트
/// [26.06.16_강다영] 플레이어의 기본적인 스텟의 변화가 서로 다른 씬에서 일어날 상황에 대비해 기본값 초기화를 Awake에서 수행함. 추후 변동 가능
/// </summary>
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerStatus : MonoBehaviour, IEffectReceiver
{
    // 플레이어 상태
    public enum livingState { idle, escape, gameover }      // 플레이어가 가질 수 있는 상태의 종류
    public livingState nowState { get; private set; }       // 현재 플레이어
    public bool IsSessionEnded { get; private set; }        // 사망 또는 탈출 결과가 확정된 세션 종료 상태
    public bool CanBeTargeted => !IsSessionEnded && nowState != livingState.gameover && hpCurrent > 0.0f; // 에너미가 유효한 전투 대상으로 선택할 수 있는지 여부
    public void SetPlayerState(livingState _state) => nowState = _state;
    public bool isReloading { get; private set; }           // 재장전 실행 중 여부
    public bool canSprint { get; private set; }             // 달리기 실행 가능 여부
    public bool cannotSprint;                               // 마나 소진 시 달리기 실행 불가 상태
    public float sprintRecoverTime;                         // 달리기 실행 불가 회복 시간
    public float evadeCooltime;                             // 구르기 쿨타임
    public float lastEvadeTime;                             // 최근 구르기 실행 시점

    int playerID;                                           // 플레이어 고유 번호

    // 플레이어 체력
    public float hpMax;                                     // 전체 체력
    public float hpCurrent;                                 // 현재 체력

    // 플레이어 마나
    public float mpMax;                                     // 마나 최대값
    public float mpCurrent { get; private set; }            // 현재 마나
    public float manaRegen;                                 // 초당 마나 회복량
    public float sprintMP;                                  // 달리기 중 초당 마나 소비량
    public float evadeMP;                                   // 구르기 시 마나 소비량

    private float artifactHpRegenBonus;                     // 아티팩트로 추가되는 초당 체력 회복량
    private float artifactMpRegenBonus;                     // 아티팩트로 추가되는 초당 마나 회복량

    [Header("Lucid Mark")]
    [SerializeField] private PlayerLucidMarkController lucidMark = new PlayerLucidMarkController();

    private LocalInputReader _input;                        // 플레이어 인게임 조작 입력
    private PlayerMovement _movement;                       // 플레이어 이동 조작

    private void OnValidate()
    {
        lucidMark?.OnValidate();
    }

    void Awake()
    {
        // EntityIdentity에서 플레이어 고유 번호를 가져옴
        playerID = GetComponent<EntityIdentity>().entityID;
        // 플레이어의 조작 관련 컴포넌트를 가져옴
        _input = GetComponent<LocalInputReader>();
        _movement = GetComponent<PlayerMovement>();
        lucidMark?.OnValidate();
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnGainManaRequested += GainMana;
        GlobalEventBus.OnHealRequested += HealingHealth;
        GlobalEventBus.OnSprintInput += CanSprint;
        GlobalEventBus.OnSprintManaConsume += UseSprintMana;
        GlobalEventBus.OnRequestManaConsume += RequestUseMana;
        GlobalEventBus.OnTimeOver += TimeOver;
        GlobalEventBus.OnEscapeRequest += HandleSessionEnded;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnGainManaRequested -= GainMana;
        GlobalEventBus.OnHealRequested -= HealingHealth;
        GlobalEventBus.OnSprintInput -= CanSprint;
        GlobalEventBus.OnSprintManaConsume -= UseSprintMana;
        GlobalEventBus.OnRequestManaConsume -= RequestUseMana;
        GlobalEventBus.OnTimeOver -= TimeOver;
        GlobalEventBus.OnEscapeRequest -= HandleSessionEnded;

        // 플레이어가 비활성화되면 새 흔적 생성만 멈추고,
        // 이미 바닥에 떨어진 의식누출 흔적은 각자 수명만큼 남아 적을 유도합니다.
        lucidMark?.StopLeakEmission();
    }

    void Start()
    {
        ResultServiceLocator.Instance.Register(playerID, this);

        // UI 초기 업데이트
        UpdateHp();
        UpdateMp();

        // 초당 마나 소모 코루틴 시작
        StartCoroutine(HealingManaPerSeconds());
    }

    void FixedUpdate()  //현재 상태를 확인하여 입력 동작 여부를 체크
    {
        // 플레이어 상태가 idle인 경우에 입력 동작을 처리함
        bool canInput = (nowState == livingState.idle);
        if (_input != null) _input.enabled = canInput;
        if (_movement != null) _movement.enabled = canInput;

        // 루시드 낙인 유지 시간, 2중첩 의식누출 시간, 이동 경로 흔적 생성을 공통 틱에서 갱신합니다.
        lucidMark?.Tick(transform, gameObject);
    }

    #region Status Management
    /* 플레이어 상태 및 스텟 초기화 */
    public void initialize(float _hp, float _mp, float _regen, float _sMP, float _sTime, float _eMana, float _eCooltime)
    {
        nowState = livingState.idle;
        IsSessionEnded = false;

        hpMax = _hp;
        hpCurrent = hpMax;
        mpMax = _mp;
        mpCurrent = mpMax;
        manaRegen = _regen;
        artifactHpRegenBonus = 0.0f;
        artifactMpRegenBonus = 0.0f;
        sprintMP = _sMP;
        cannotSprint = false;
        sprintRecoverTime = _sTime;
        evadeMP = _eMana;
        evadeCooltime = _eCooltime;
        lastEvadeTime = Time.time;

        // 새 스폰마다 낙인 상태를 초기화해 이전 런타임 정보가 남지 않게 합니다.
        lucidMark?.ResetRuntime(transform);
    }

    /* 피격 시 자신의 타입을 반환 */
    public Faction EntityFaction => Faction.player;

    /* 체력 UI 업데이트 */
    private void UpdateHp()
    {
        GlobalEventBus.OnPlayerHealthChanged?.Invoke(hpCurrent, hpMax);
    }

    /* 마나 UI 업데이트 */
    private void UpdateMp()
    {
        GlobalEventBus.OnPlayerManaChanged?.Invoke(mpCurrent, mpMax);
    }

#region 플레이어 상태 변화 및 수치 조절에 사용되는 메소드
    /* 체력 변화 */
    private void GetHp(float _val)
    {
        hpCurrent = Mathf.Clamp(hpCurrent + _val, 0, hpMax);
        UpdateHp();
        // 플레이어 체력이 0이 되었을 때 idle 상태이면 사망 처리 이벤트 및 게임오버 메소드를 발동
        if (hpCurrent <= 0 && nowState == livingState.idle)
        {
            GlobalEventBus.onPlayerDead?.Invoke(playerID);
            GameOver(playerID);
        }
    }

    /* 마나 변화 */
    private void GetMp(float _val)
    {
        mpCurrent = Mathf.Clamp(mpCurrent + _val, 0, mpMax);
        UpdateMp();
    }
#endregion

    /* 제한 시간 종료 이벤트에 게임 오버 처리를 연결 */
    public void TimeOver()
    {
        _movement.enabled = false;
        GameOver(playerID);
    }

    /* 게임 오버 처리 */
    public void GameOver(int _playerID)
    {
        // 이미 종료된 세션에서 피격이나 종료 이벤트가 다시 들어와도 결과 정산을 반복하지 않습니다.
        if (IsSessionEnded || nowState == livingState.gameover)
            return;

        // 플레이어 상태를 gameover로 변경
        SetPlayerState(livingState.gameover);
        // 코루틴 정지
        StopAllCoroutines();
        // 탈출 실패 판정 이벤트를 전송
        GlobalEventBus.OnEscapeRequest?.Invoke(false);
        // 스크립트 비활성화
        enabled = false;
    }

    /// <summary>
    /// 사망 또는 탈출 성공이 확정된 즉시 플레이어의 전투 및 입력 처리를 잠급니다.
    /// 탈출 채널링 중에는 이 이벤트가 아직 발생하지 않으므로 피격에 의한 탈출 취소는 유지됩니다.
    /// </summary>
    private void HandleSessionEnded(bool extractionResult)
    {
        IsSessionEnded = true;

        if (_input != null)
            _input.enabled = false;

        if (_movement != null)
            _movement.enabled = false;
    }

    // 플레이어가 idle 상태인지 확인
    public static bool IsPlayerIdle(int playerID)
    {
        var svc = ResultServiceLocator.Instance;
        // ResltServiceLocator가 제대로 로드되었는지 체크
        if (svc == null)
        {
            Debug.LogWarning($"IsPlayerIdle: ResultServiceLocator.Instance {svc} is null");
            return false;
        }
        else
        {
            Debug.Log($"IsPlayerIdle: ResultServiceLocator.Instance {svc} is loaded");
        }

        var comp = svc.GetPlayerComponent(playerID) as PlayerStatus;
        if (comp == null)
        {
            Debug.LogWarning($"PlayerStatus를 찾을 수 없습니다. playerID: {playerID}");
            return false;
        }
        return comp.nowState == livingState.idle;
    }

    /* 현재 달리기 가능한 상태인지 체크 */
    public void CanSprint(bool _isSprint)
    {
        // 현재 보유 마나가 1초당 달리기 시 소비 마나 이상인지 체크
        bool canSprint_Mana = mpCurrent >= sprintMP;
        // 달리기 동작 여부 최종 계산 후 달리기 이벤트 전송
        // (isSprint 입력 && 보유 마나가 1초당 소비 마나 이상 && 달리기 불가 상태 아님)
        canSprint = _isSprint && canSprint_Mana && !cannotSprint;
        GlobalEventBus.SendCanSprint?.Invoke(canSprint);
    }
    #endregion

    /* 피해 입을 시 체력 감소 처리 */
    public void TakeDamage(float dmg)
    {
        // 종료 결과가 확정됐거나 이미 사망한 플레이어에게 들어오는 후속 공격은 모두 무시합니다.
        // 이를 통해 HP, 피격 애니메이션, 시간 패널티와 플레이타임 재정산이 다시 발생하지 않게 합니다.
        if (IsSessionEnded || nowState == livingState.gameover || hpCurrent <= 0.0f)
            return;

        // 구르기 도중에는 플레이어가 피해를 받아 HP가 감소하지 않음
        if (_movement != null && _movement.isEvading) return;

        GetHp(-dmg);

        // 루시드 낙인은 "실제 피해를 입은 피격"에만 반응합니다.
        // 생존해 있다면 중첩, 시간 감소, 의식누출 시작/갱신을 여기서 처리합니다.
        if (hpCurrent > 0.0f)
        {
            lucidMark?.ApplyHit(transform, gameObject);
        }
        // 피해 입을 시 애니메이션 재생 이벤트
        GlobalEventBus.OnHitAnimate?.Invoke();
        // 피해 입을 시 탈출 실패 처리
        GlobalEventBus.OnEscapeFailure?.Invoke(playerID);
    }

    /* 공격 시 마나 사용 */
    public void UseAttackMana(float _useMana)
    {
        GetMp(-_useMana);
    }

    /// <summary>
    /// 아티팩트 장착 효과로 추가되는 HP/MP 회복 보정값을 갱신합니다.
    /// 원본 manaRegen은 캐릭터 기본값으로 유지하고, 회복 틱에서 보정값만 더해 사용합니다.
    /// </summary>
    public void ApplyArtifactStatusBonus(float hpRegenBonus, float mpRegenBonus)
    {
        artifactHpRegenBonus = Mathf.Max(0.0f, hpRegenBonus);
        artifactMpRegenBonus = Mathf.Max(0.0f, mpRegenBonus);
    }

    /* 달리기 중 시간당 마나 사용 */
    public void UseSprintMana(float _useMana)
    {
        GetMp(-_useMana * Time.fixedDeltaTime);

        // 마나 소비 후 보유 마나가 1초당 달리기 시 소비 마나 미만이 되면 달리기 불가 상태 전송 후 달리기 중단
        if (mpCurrent < sprintMP)
        {
            cannotSprint = true;
            GlobalEventBus.SendCannotSprint?.Invoke(cannotSprint);
            StartCoroutine(SprintRecover());
            return;
        }
    }

    /* 달리기 불가 상태 회복 코루틴*/
    private IEnumerator SprintRecover()
    {
        // 달리기 회복 시간 동안 대기 후 달리기 불가 상태를 해제
        yield return new WaitForSeconds(sprintRecoverTime);
        cannotSprint = false;
        GlobalEventBus.SendCannotSprint?.Invoke(cannotSprint);
    }

    /* 마나 사용 후 구르기 실행 */
    public void UseEvadeMana(float _useMana)
    {
        GetMp(-_useMana);
        _movement.PlayerEvade();
        lastEvadeTime = Time.time;
    }

    /* 초당 마나 회복 코루틴 */
    private IEnumerator HealingManaPerSeconds()
    {
        while (nowState != livingState.gameover)
        {
            if (artifactHpRegenBonus > 0.0f)
                GetHp(artifactHpRegenBonus);

            GetMp(manaRegen + artifactMpRegenBonus);
            yield return new WaitForSeconds(1.0f);
        }
    }

    private void HealingHealth(GameObject _target, float _effectValue)
    {
        // 대상이 내가 아니라면 리턴
        if (_target != this.gameObject) return;
        GetHp(_effectValue);
    }

    private void GainMana(GameObject _target, float _effectValue)
    {
        // 대상이 내가 아니라면 리턴
        if (_target != this.gameObject) return;
        GetMp(_effectValue);
    }

    /* 초상화 UI 업데이트 */
    private void UpdateFaceImage()
    {
        /// 플레이어 데이터 구조가 구축되면 연동하여 업데이트 할 것 ///
    }

    /* 아이템을 사용해 체력 회복 */
    public void HealthRecoverInst(float _amount)
    {
        GetHp(_amount);
    }

    /* 아이템을 사용해 마나 회복 */
    public void ManaRecoverInst(float _amount)
    {
        GetMp(_amount);
    }

    public bool RequestUseMana(float _useMana)
    {
        // 소모값에 비해 마나량이 부족할 시
        if(mpCurrent<_useMana)
        {
            return false;
        }
        // 마나가 충분하다면 소모 후 성공 여부를 리턴
        else
        {
            GetMp(-_useMana);
            return true;
        }
    }

    public void ApplyAggro(UnityEngine.Transform target, float duration)
    {
        // 플레이어는 타겟 강제 추적(어그로) 효과를 받지 않으므로 무시합니다.
    }
}

/// <summary>
/// 플레이어에게 쌓이는 루시드 낙인을 관리하는 런타임 모듈입니다.
/// 피격 중첩, 남은 시간 감소, 2중첩 시 의식누출 흔적 생성 시작/종료를 한곳에서 처리합니다.
/// </summary>
[Serializable]
public class PlayerLucidMarkController
{
    [Header("Mark Settings")]
    [SerializeField, Min(1)] private int maxStack = 2;                   // 루시드 낙인 최대 중첩 수
    [SerializeField, Min(1)] private int leakRequiredStack = 2;          // 의식누출이 시작되는 최소 중첩 수
    [SerializeField] private float hitTimePenaltySeconds = 5.0f;         // 피격 1회당 고정으로 감소시킬 남은 제한 시간
    [SerializeField] private float markDuration = 8.0f;                  // 낙인 중첩이 유지되는 기본 시간
    [SerializeField] private float leakDuration = 8.0f;                  // 2중첩 의식누출이 유지되는 기본 시간

    [Header("Leak Trace Settings")]
    [SerializeField] private float traceSpawnDistance = 1.8f;            // 마지막 흔적에서 이 거리 이상 이동했을 때 새 흔적 생성
    [SerializeField] private float traceSpawnMinInterval = 0.25f;        // 흔적이 너무 촘촘히 찍히지 않도록 막는 최소 간격
    [SerializeField] private float traceLifeTime = 4.0f;                 // 바닥에 남은 의식누출 흔적 오브젝트의 수명
    [SerializeField] private float traceNoisePulseInterval = 1.0f;       // 흔적이 자기 자리에서 소음을 다시 뿜는 간격
    [SerializeField] private float traceNoiseRadius = 45.0f;             // 흔적이 적을 유인하는 소음 반경
    [SerializeField] private float traceNoiseDuration = 3.0f;            // 흔적이 방출한 소음을 조사 대상으로 유지하는 시간
    [SerializeField] private int traceNoisePriority = 50;                // 흔적 소음 우선순위 (총성보다 높은 강한 유인용)
    [SerializeField] private bool traceCanInterruptChase = false;        // 현재 추적을 끊고 흔적을 조사하게 만들지 여부
    [SerializeField] private GameObject traceVisualPrefab;               // 바닥 흔적 데칼/VFX를 따로 붙이고 싶을 때 사용할 선택 프리팹
    [SerializeField] private Vector3 traceVisualLocalOffset = new Vector3(0.0f, 0.05f, 0.0f); // 시각 프리팹 위치 보정
    [SerializeField] private Vector3 traceVisualLocalScale = Vector3.one;                      // 시각 프리팹 크기 보정
    [SerializeField] private Color traceDebugColor = new Color(0.85f, 0.15f, 0.2f, 1.0f);    // Scene Gizmo 확인용 색상

    [Header("Runtime Debug")]
    [SerializeField] private int currentStack;                           // 현재 낙인 중첩
    [SerializeField] private bool isLeakEmissionActive;                  // 현재 새 누출 흔적 생성이 활성화되어 있는지 여부
    [SerializeField] private float markExpireTime;                       // 낙인 중첩이 만료되는 시각
    [SerializeField] private float leakExpireTime;                       // 의식누출 생성 상태가 만료되는 시각
    [SerializeField] private Vector3 lastTraceSpawnPosition;             // 마지막으로 흔적을 생성한 위치
    [SerializeField] private float lastTraceSpawnTime;                   // 마지막 흔적 생성 시각
    [SerializeField] private bool hasLastTraceSpawnPosition;             // 마지막 흔적 위치가 유효한지 여부
    [SerializeField] private int spawnedTraceCount;                      // 현재까지 생성한 흔적 개수 (디버그용)

    public void OnValidate()
    {
        maxStack = Mathf.Max(1, maxStack);
        leakRequiredStack = Mathf.Clamp(leakRequiredStack, 1, maxStack);
        hitTimePenaltySeconds = Mathf.Max(0.0f, hitTimePenaltySeconds);
        markDuration = Mathf.Max(0.1f, markDuration);
        leakDuration = Mathf.Max(0.1f, leakDuration);
        traceSpawnDistance = Mathf.Max(0.1f, traceSpawnDistance);
        traceSpawnMinInterval = Mathf.Max(0.05f, traceSpawnMinInterval);
        traceLifeTime = Mathf.Max(0.1f, traceLifeTime);
        traceNoisePulseInterval = Mathf.Max(0.1f, traceNoisePulseInterval);
        traceNoiseRadius = Mathf.Max(0.1f, traceNoiseRadius);
        traceNoiseDuration = Mathf.Max(0.1f, traceNoiseDuration);
    }

    /// <summary>
    /// 플레이어 스폰 직후 낙인 런타임 상태를 초기화합니다.
    /// 이전 전투에서 남아 있던 중첩/누출 시간이 다음 스폰으로 넘어가지 않게 막습니다.
    /// </summary>
    public void ResetRuntime(Transform owner)
    {
        currentStack = 0;
        isLeakEmissionActive = false;
        markExpireTime = 0.0f;
        leakExpireTime = 0.0f;
        lastTraceSpawnTime = 0.0f;
        hasLastTraceSpawnPosition = false;
        spawnedTraceCount = 0;

        if (owner != null)
        {
            lastTraceSpawnPosition = owner.position;
        }
    }

    /// <summary>
    /// 플레이어가 활성화된 동안 낙인 유지 시간과 의식누출 흔적 생성을 업데이트합니다.
    /// 2중첩 상태에서는 일정 거리마다 바닥에 새 흔적 오브젝트를 남깁니다.
    /// </summary>
    public void Tick(Transform owner, GameObject source)
    {
        if (currentStack <= 0)
        {
            return;
        }

        if (Time.time >= markExpireTime)
        {
            ClearMarkRuntime();
            return;
        }

        if (!isLeakEmissionActive || currentStack < leakRequiredStack)
        {
            return;
        }

        if (Time.time >= leakExpireTime)
        {
            StopLeakEmission();
            return;
        }

        TrySpawnTrace(owner, source, false);
    }

    /// <summary>
    /// 플레이어가 피격될 때마다 낙인 중첩과 시간을 갱신합니다.
    /// 2중첩에 도달하면 의식누출 흔적 생성을 시작하고,
    /// 이미 2중첩이면 새 중첩은 추가하지 않고 유지 시간만 갱신합니다.
    /// </summary>
    public void ApplyHit(Transform owner, GameObject source)
    {
        if (hitTimePenaltySeconds > 0.0f)
        {
            GlobalEventBus.OnTimePenaltyRequested?.Invoke(hitTimePenaltySeconds);
        }

        currentStack = Mathf.Min(currentStack + 1, maxStack);
        markExpireTime = Time.time + markDuration;

        if (currentStack < leakRequiredStack)
        {
            return;
        }

        leakExpireTime = Time.time + leakDuration;
        isLeakEmissionActive = true;

        // 2중첩 진입 시점이나 2중첩 상태 재피격 시점에도 현재 자리에서 흔적 하나를 즉시 떨궈,
        // "맞은 위치부터 누출이 시작된다"는 체감을 주도록 만듭니다.
        TrySpawnTrace(owner, source, true);
    }

    /// <summary>
    /// 플레이어 비활성화나 2중첩 종료 시 새 흔적 생성만 중단합니다.
    /// 이미 바닥에 떨어진 흔적은 각자 수명이 끝날 때까지 남아 적을 유도합니다.
    /// </summary>
    public void StopLeakEmission()
    {
        isLeakEmissionActive = false;
        leakExpireTime = 0.0f;
        hasLastTraceSpawnPosition = false;
        lastTraceSpawnTime = 0.0f;
    }

    private void ClearMarkRuntime()
    {
        currentStack = 0;
        markExpireTime = 0.0f;
        StopLeakEmission();
    }

    private void TrySpawnTrace(Transform owner, GameObject source, bool forceSpawn)
    {
        if (owner == null || !isLeakEmissionActive)
        {
            return;
        }

        Vector3 spawnPosition = owner.position;

        if (!forceSpawn)
        {
            if (Time.time < lastTraceSpawnTime + traceSpawnMinInterval)
            {
                return;
            }

            float spawnDistanceSqr = traceSpawnDistance * traceSpawnDistance;
            if (hasLastTraceSpawnPosition &&
                GetPlanarSqrDistance(spawnPosition, lastTraceSpawnPosition) < spawnDistanceSqr)
            {
                return;
            }
        }

        SpawnTraceObject(spawnPosition, source);
        lastTraceSpawnPosition = spawnPosition;
        lastTraceSpawnTime = Time.time;
        hasLastTraceSpawnPosition = true;
    }

    private void SpawnTraceObject(Vector3 spawnPosition, GameObject source)
    {
        spawnedTraceCount++;

        GameObject traceObject = new($"LucidLeakTrace_{spawnedTraceCount}");
        traceObject.transform.SetPositionAndRotation(spawnPosition, Quaternion.identity);

        LucidLeakTraceRuntime traceRuntime = traceObject.AddComponent<LucidLeakTraceRuntime>();
        traceRuntime.Initialize(
            source,
            traceLifeTime,
            traceNoisePulseInterval,
            traceNoiseRadius,
            traceNoiseDuration,
            traceNoisePriority,
            traceCanInterruptChase,
            traceVisualPrefab,
            traceVisualLocalOffset,
            traceVisualLocalScale,
            traceDebugColor);
    }

    private static float GetPlanarSqrDistance(Vector3 a, Vector3 b)
    {
        float deltaX = a.x - b.x;
        float deltaZ = a.z - b.z;
        return deltaX * deltaX + deltaZ * deltaZ;
    }
}

/// <summary>
/// 루시드 의식누출 흔적 1개를 나타내는 런타임 오브젝트입니다.
/// 생성된 자리에 남아 일정 시간 동안 반복적으로 소음을 방출해,
/// 적이 플레이어 본체가 아니라 지나간 흔적을 따라 조사하도록 만듭니다.
/// </summary>
public class LucidLeakTraceRuntime : MonoBehaviour
{
    [SerializeField] private bool drawDebugRadius = true;               // Scene Gizmo로 유인 범위를 표시할지 여부

    private GameObject sourceObject;                                    // 이 누출이 어떤 플레이어에게서 떨어졌는지 기록
    private float lifeTime;                                             // 흔적 오브젝트 전체 수명
    private float noisePulseInterval;                                   // 소음 재방출 간격
    private float noiseRadius;                                          // 소음 유인 반경
    private float noiseDuration;                                        // 각 소음 펄스가 유지되는 시간
    private int noisePriority;                                          // 현재 조사 중인 다른 약한 소음을 덮어쓸 우선순위
    private bool canInterruptChase;                                     // 적의 현재 추적을 끊을지 여부
    private GameObject traceVisualPrefab;                               // 선택적으로 붙일 데칼/VFX 프리팹
    private Vector3 traceVisualLocalOffset;                             // 시각 프리팹 위치 보정
    private Vector3 traceVisualLocalScale;                              // 시각 프리팹 크기 보정
    private Color debugColor = Color.red;                               // Scene Gizmo 색상
    private GameObject spawnedVisual;                                   // 현재 생성된 시각 프리팹 인스턴스

    /// <summary>
    /// 런타임 생성 직후 누출 흔적의 동작 데이터를 주입합니다.
    /// Awake/Start를 기다리지 않고 바로 초기 펄스를 시작할 수 있게 수동 초기화 방식을 사용합니다.
    /// </summary>
    public void Initialize(
        GameObject newSourceObject,
        float newLifeTime,
        float newNoisePulseInterval,
        float newNoiseRadius,
        float newNoiseDuration,
        int newNoisePriority,
        bool newCanInterruptChase,
        GameObject newTraceVisualPrefab,
        Vector3 newTraceVisualLocalOffset,
        Vector3 newTraceVisualLocalScale,
        Color newDebugColor)
    {
        sourceObject = newSourceObject;
        lifeTime = Mathf.Max(0.1f, newLifeTime);
        noisePulseInterval = Mathf.Max(0.1f, newNoisePulseInterval);
        noiseRadius = Mathf.Max(0.1f, newNoiseRadius);
        noiseDuration = Mathf.Max(0.1f, newNoiseDuration);
        noisePriority = newNoisePriority;
        canInterruptChase = newCanInterruptChase;
        traceVisualPrefab = newTraceVisualPrefab;
        traceVisualLocalOffset = newTraceVisualLocalOffset;
        traceVisualLocalScale = newTraceVisualLocalScale;
        debugColor = newDebugColor;

        AttachVisualIfNeeded();
        StartCoroutine(PulseNoiseRoutine());
        Destroy(gameObject, lifeTime);
    }

    private IEnumerator PulseNoiseRoutine()
    {
        float endTime = Time.time + lifeTime;

        // 첫 흔적은 생성 즉시 한 번 소음을 내보내 "맞은 자리에서 누출이 시작된다"는 감각을 줍니다.
        EmitLeakNoise();

        while (Time.time < endTime)
        {
            yield return new WaitForSeconds(noisePulseInterval);

            if (this == null)
            {
                yield break;
            }

            EmitLeakNoise();
        }
    }

    private void EmitLeakNoise()
    {
        // 일반 소음은 NoiseManager가 임시 오브젝트를 만들어 기준점을 잡지만,
        // 의식누출은 "바닥에 남은 흔적 그 자체"가 소음원이어야 하므로
        // 이 런타임 오브젝트를 AnchorTransform으로 직접 브로드캐스트합니다.
        GlobalEventBus.OnNoiseEmitted?.Invoke(new NoiseStimulus(
            NoiseType.LucidLeak,
            transform.position,
            sourceObject != null ? sourceObject : gameObject,
            noiseRadius,
            noiseDuration,
            canInterruptChase,
            noisePriority,
            Time.time,
            transform));
    }

    private void AttachVisualIfNeeded()
    {
        if (traceVisualPrefab == null)
        {
            return;
        }

        spawnedVisual = Instantiate(traceVisualPrefab, transform);
        spawnedVisual.transform.localPosition = traceVisualLocalOffset;
        spawnedVisual.transform.localRotation = Quaternion.identity;
        spawnedVisual.transform.localScale = traceVisualLocalScale;
    }

    private void OnDestroy()
    {
        if (spawnedVisual != null)
        {
            Destroy(spawnedVisual);
        }
    }

    private void OnDrawGizmos()
    {
        if (!drawDebugRadius || noiseRadius <= 0.0f)
        {
            return;
        }

        Gizmos.color = debugColor;
        Gizmos.DrawWireSphere(transform.position, noiseRadius);
    }
}
```

---

## 12. TimeLimitController.cs

### 12-1. 이전 스크립트 전체

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class TimeLimitController : MonoBehaviour
{
    public float timeLimit = 600.0f;        //세션별 시간 제한 (초 단위로 입력)
    public float currentTimeLimit;          //현재 남은 제한 시간
    public float timeLimitSpeed = 1.0f;     //플레이 시간 제한 배율 (기본 1.0배)
    public float timeLimitAccel = 1.0f;     //가속 구역으로 인한 플레이 시간 제한 가속 (기본 1.0배)
    private float artifactTimeLimitSpeedMultiplier = 1.0f; // 아티팩트로 적용되는 시간 감소 속도 배율
    private bool timeFlow;                  //제한 시간 진행 스위치

    private void Awake()
    {
        currentTimeLimit = timeLimit;   //남은 제한 시간 초기화
        timeFlow = true;
    }

    private void OnEnable()
    {
        GlobalEventBus.OnTimePenaltyRequested += ApplyTimePenalty;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnTimePenaltyRequested -= ApplyTimePenalty;
    }

    private void FixedUpdate()
    {
        if (!timeFlow) return;

        // 시간 제한 가속 배율에 따라 실시간으로 남은 시간 감소
        currentTimeLimit -= timeLimitSpeed * artifactTimeLimitSpeedMultiplier * Time.fixedDeltaTime * timeLimitAccel;

        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    /// <summary>
    /// 낙인 같은 외부 패널티가 들어오면 남은 시간을 즉시 차감합니다.
    /// 시간 제한 값은 이 컨트롤러만 소유하도록 유지해 다른 시스템이 직접 currentTimeLimit을 건드리지 않게 합니다.
    /// </summary>
    public void ApplyTimePenalty(float penaltySeconds)
    {
        if (!timeFlow || penaltySeconds <= 0.0f)
        {
            return;
        }

        currentTimeLimit = Mathf.Max(0.0f, currentTimeLimit - penaltySeconds);
        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    /// <summary>
    /// 아티팩트 장착 효과로 제한 시간 감소 속도 배율을 갱신합니다.
    /// 예: 0.6이면 기존 시간 감소 속도의 60%만 적용되어 시간 제한이 더 천천히 줄어듭니다.
    /// </summary>
    public void ApplyArtifactTimeLimitSpeedMultiplier(float multiplier)
    {
        artifactTimeLimitSpeedMultiplier = Mathf.Max(0.0f, multiplier);
    }

    private void BroadcastCurrentTime()
    {
        // 타이머 UI에 남은 제한 시간을 전달하는 이벤트
        GlobalEventBus.OnTimerChanged?.Invoke(currentTimeLimit);
    }

    private void TryFinishByTimeout()
    {
        // 남은 시간 제한 값이 0이 되면 탈출 실패로 게임 종료 
        if (currentTimeLimit > 0.0f || !timeFlow)
        {
            return;
        }

        timeFlow = false;
        GlobalEventBus.OnTimeOver?.Invoke();
    }
}
```

### 12-2. 설명

남은 제한시간의 단일 소유자다. OnEscapeRequest를 구독해 사망 또는 탈출이 확정되면 timeFlow를 즉시 false로 바꾼다. 기존 ApplyTimePenalty의 timeFlow 검사를 그대로 활용하므로 종료 이후 기본 시간 흐름과 피격을 포함한 외부 시간 패널티가 모두 차단된다.

### 12-3. 현재 스크립트 전체

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class TimeLimitController : MonoBehaviour
{
    public float timeLimit = 600.0f;        //세션별 시간 제한 (초 단위로 입력)
    public float currentTimeLimit;          //현재 남은 제한 시간
    public float timeLimitSpeed = 1.0f;     //플레이 시간 제한 배율 (기본 1.0배)
    public float timeLimitAccel = 1.0f;     //가속 구역으로 인한 플레이 시간 제한 가속 (기본 1.0배)
    private float artifactTimeLimitSpeedMultiplier = 1.0f; // 아티팩트로 적용되는 시간 감소 속도 배율
    private bool timeFlow;                  //제한 시간 진행 스위치

    private void Awake()
    {
        currentTimeLimit = timeLimit;   //남은 제한 시간 초기화
        timeFlow = true;
    }

    private void OnEnable()
    {
        GlobalEventBus.OnTimePenaltyRequested += ApplyTimePenalty;
        GlobalEventBus.OnEscapeRequest += StopTimeFlow;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnTimePenaltyRequested -= ApplyTimePenalty;
        GlobalEventBus.OnEscapeRequest -= StopTimeFlow;
    }

    private void FixedUpdate()
    {
        if (!timeFlow) return;

        // 시간 제한 가속 배율에 따라 실시간으로 남은 시간 감소
        currentTimeLimit -= timeLimitSpeed * artifactTimeLimitSpeedMultiplier * Time.fixedDeltaTime * timeLimitAccel;

        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    /// <summary>
    /// 낙인 같은 외부 패널티가 들어오면 남은 시간을 즉시 차감합니다.
    /// 시간 제한 값은 이 컨트롤러만 소유하도록 유지해 다른 시스템이 직접 currentTimeLimit을 건드리지 않게 합니다.
    /// </summary>
    public void ApplyTimePenalty(float penaltySeconds)
    {
        if (!timeFlow || penaltySeconds <= 0.0f)
        {
            return;
        }

        currentTimeLimit = Mathf.Max(0.0f, currentTimeLimit - penaltySeconds);
        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    /// <summary>
    /// 사망 또는 탈출이 확정되면 제한 시간 진행과 이후의 모든 시간 패널티를 중단합니다.
    /// 성공 여부와 관계없이 세션이 끝난 시점부터 남은 시간은 고정되어야 합니다.
    /// </summary>
    private void StopTimeFlow(bool extractionResult)
    {
        timeFlow = false;
    }

    /// <summary>
    /// 아티팩트 장착 효과로 제한 시간 감소 속도 배율을 갱신합니다.
    /// 예: 0.6이면 기존 시간 감소 속도의 60%만 적용되어 시간 제한이 더 천천히 줄어듭니다.
    /// </summary>
    public void ApplyArtifactTimeLimitSpeedMultiplier(float multiplier)
    {
        artifactTimeLimitSpeedMultiplier = Mathf.Max(0.0f, multiplier);
    }

    private void BroadcastCurrentTime()
    {
        // 타이머 UI에 남은 제한 시간을 전달하는 이벤트
        GlobalEventBus.OnTimerChanged?.Invoke(currentTimeLimit);
    }

    private void TryFinishByTimeout()
    {
        // 남은 시간 제한 값이 0이 되면 탈출 실패로 게임 종료 
        if (currentTimeLimit > 0.0f || !timeFlow)
        {
            return;
        }

        timeFlow = false;
        GlobalEventBus.OnTimeOver?.Invoke();
    }
}
```

---

## 13. GameManager.cs

### 13-1. 이전 스크립트 전체

```cs
/// <summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
/// </summary>
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    // 인스턴스
    public static GameManager Instance { get; private set; }
    
    // 인벤토리 기록에 관한 필드
    private PlayerSaveData _playerSaveData;             //인벤토리 기록이 저장된 플레이어 세이브 데이터
    // 플레이 타임 기록에 관한 필드
    private bool timeTrack = false;                     //플레이 시간 측정 중
    private float startTime;                            //플레이 시작 시점
    private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol", "DemoScene Additive" }; //인게임 세션으로 취급할 씬 목록

    // 저장 데이터 인터페이스
    private ICharDataRepository charRepo;               // 캐릭터 데이터 접근 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        // 인터페이스 구현부 연결
        charRepo = new SOCharacterRepository();
        itemRepo = new LocalJsonItemRepository();

        SceneManager.sceneLoaded += OnSceneLoaded;                  //신 로드 완료 시점에 실행하는 메소드 연결
        GlobalEventBus.OnEscapeRequest += ResultTime;               //탈출 판정 이벤트에 경과 시간 기록 메소드 연결
    }

    private void OnDestroy()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        GlobalEventBus.OnEscapeRequest -= ResultTime;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if(IsPlayScene(scene.name)) //인게임 세션 신에서 실행
        {
            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            PlayerSaveData playerData = PlayerSaveDataSO.Instance.currentData;
            _playerSaveData = playerData;
            CharacterData charData = charRepo.GetCharacterData(playerData.SelectCharID);

            // 플레이어 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnPlayer(charData);
            }

            PlayerInventory playerInventory = FindObjectOfType<PlayerInventory>();
            if (playerInventory != null)
            {
                playerInventory.RestoreFromSave(playerData);
            }

            PlayerArtifactEquipment artifactEquipment = FindObjectOfType<PlayerArtifactEquipment>();
            if (artifactEquipment != null)
            {
                artifactEquipment.RestoreFromSave(playerData, itemRepo);
            }

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
                SpawnManager.Instance.SpawnBoxes();
            }

            UIManager.Instance.Open<GamePlayUI>();
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
    }

    /// <summary>
    /// 현재 로드된 씬이 인게임 세션 대상인지 판정합니다.
    /// 데모 씬과 패트롤 테스트 씬을 모두 같은 플레이 씬으로 취급하기 위한 보조 함수입니다.
    /// </summary>
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

    private void ResultTime(bool _extractionResult)
    {
        //시간 기록을 중단하고 기록 고정
        timeTrack = false;
        //결과 계산 시작
        ResultManager.Instance.GameResult(_extractionResult, startTime);
    }
}
```

### 13-2. 설명

플레이타임 측정과 결과 정산 진입점을 관리한다. ResultTime에서 timeTrack이 이미 false라면 즉시 반환하도록 중복 방어를 추가했다. 종료 이후 후속 피격이나 다른 경로에서 종료 이벤트가 다시 발생해도 최초 사망 또는 탈출 시점의 플레이타임을 유지하고 ResultManager.GameResult를 반복 호출하지 않는다.

### 13-3. 현재 스크립트 전체

```cs
/// <summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
/// </summary>
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    // 인스턴스
    public static GameManager Instance { get; private set; }
    
    // 인벤토리 기록에 관한 필드
    private PlayerSaveData _playerSaveData;             //인벤토리 기록이 저장된 플레이어 세이브 데이터
    // 플레이 타임 기록에 관한 필드
    private bool timeTrack = false;                     //플레이 시간 측정 중
    private float startTime;                            //플레이 시작 시점
    private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol", "DemoScene Additive" }; //인게임 세션으로 취급할 씬 목록

    // 저장 데이터 인터페이스
    private ICharDataRepository charRepo;               // 캐릭터 데이터 접근 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        // 인터페이스 구현부 연결
        charRepo = new SOCharacterRepository();
        itemRepo = new LocalJsonItemRepository();

        SceneManager.sceneLoaded += OnSceneLoaded;                  //신 로드 완료 시점에 실행하는 메소드 연결
        GlobalEventBus.OnEscapeRequest += ResultTime;               //탈출 판정 이벤트에 경과 시간 기록 메소드 연결
    }

    private void OnDestroy()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        GlobalEventBus.OnEscapeRequest -= ResultTime;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if(IsPlayScene(scene.name)) //인게임 세션 신에서 실행
        {
            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            PlayerSaveData playerData = PlayerSaveDataSO.Instance.currentData;
            _playerSaveData = playerData;
            CharacterData charData = charRepo.GetCharacterData(playerData.SelectCharID);

            // 플레이어 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnPlayer(charData);
            }

            PlayerInventory playerInventory = FindObjectOfType<PlayerInventory>();
            if (playerInventory != null)
            {
                playerInventory.RestoreFromSave(playerData);
            }

            PlayerArtifactEquipment artifactEquipment = FindObjectOfType<PlayerArtifactEquipment>();
            if (artifactEquipment != null)
            {
                artifactEquipment.RestoreFromSave(playerData, itemRepo);
            }

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
                SpawnManager.Instance.SpawnBoxes();
            }

            UIManager.Instance.Open<GamePlayUI>();
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
    }

    /// <summary>
    /// 현재 로드된 씬이 인게임 세션 대상인지 판정합니다.
    /// 데모 씬과 패트롤 테스트 씬을 모두 같은 플레이 씬으로 취급하기 위한 보조 함수입니다.
    /// </summary>
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

    private void ResultTime(bool _extractionResult)
    {
        // 사망 후 후속 피격 등으로 종료 이벤트가 중복 발생해도 최초 플레이타임만 사용합니다.
        if (!timeTrack)
            return;

        //시간 기록을 중단하고 기록 고정
        timeTrack = false;
        //결과 계산 시작
        ResultManager.Instance.GameResult(_extractionResult, startTime);
    }
}
```

---

## 14. InventoryPresenter.cs

### 14-1. 이전 스크립트 전체

```cs
/// <summary>
/// 아이템과 인벤토리에 관한 상호작용을 중재하는 Presenter.
/// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI 연결, 월드 드랍을 담당한다.
/// </summary>
using UnityEngine;

public class InventoryPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerInventory playerInventory;            // 플레이어 인벤토리
    private LocalInputReader localInputReader;          // 플레이어 입력 처리
    private EntityIdentity identity;                    // 플레이어 고유 ID

    // 컨테이너 상태 캐시
    private ItemBox currentBox;                         // 현재 열려 있는 상자
    private bool isChestOpen;                           // 상자 UI가 열려 있는지 여부
    private const float dropForwardDistance = 1.0f;     // 아이템을 플레이어 앞에 떨어뜨릴 거리
    private const float dropUpOffset = 0.3f;            // 바닥 겹침 방지용 높이 보정
    private PlayerStatus playerStatus;                  // 플레이어 상태

    // UI 캐시
    private InventoryUI inventoryUI;                    // 인벤토리 UI 캐시
    private ResultUI resultUI;                          // 결과 UI 캐시
    private ChestUI chestUI;                            // 상자 UI 캐시
    private ItemTooltipUI itemTooltipUI;                // 툴팁 UI 캐시

    // 저장 데이터 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    // 아티팩트 장착 상태 관리
    private PlayerArtifactEquipment playerArtifactEquipment;       // 플레이어 아티팩트 장착 상태

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerInventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();
        identity = GetComponent<EntityIdentity>();
        playerStatus = GetComponent<PlayerStatus>();
        playerArtifactEquipment = GetComponent<PlayerArtifactEquipment>();

        if (playerWeapon == null || playerInventory == null || playerStatus == null ||
            localInputReader == null || identity == null || playerArtifactEquipment == null)
        {
            enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 인터페이스 구현부 연결
        itemRepo = new LocalJsonItemRepository();

        // 인벤토리 슬롯 초기화
        PlayerSaveData playerData = PlayerSaveDataSO.Instance.currentData;
        playerInventory.Initialize(playerData.invenSlotNum, playerData.quickSlotsNum, playerData.safeSlotNum);
    }

    private void OnEnable()
    {
        // 바닥 아이템을 주웠을 때 발생하는 이벤트를 구독한다.
        GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

        // 상자와 상호작용했을 때 상자 UI를 여는 이벤트를 구독한다.
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

        // 입력으로 인벤토리 열기/닫기 요청이 들어오면 Presenter가 처리한다.
        localInputReader.OnInventoryOpenRequested += OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested += CloseInventoryUI;

        // 인벤토리 및 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI를 갱신한다.
        playerInventory.OnSlotChanged += HandleSlotChanged;
        playerInventory.OnSafeSlotChanged += HandleSafeSlotChanged;

        // 인벤토리 드랍존으로 버리기 요청이 들어오면 월드 드랍으로 처리한다.
        GlobalEventBus.OnInventoryDropRequested += HandleInventoryDropRequested;

        // 아티팩트 장착/해제 요청 이벤트를 구독한다.
        GlobalEventBus.OnArtifactEquipRequested += HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested += HandleArtifactUnequipRequested;
        playerArtifactEquipment.OnArtifactSlotChanged += HandleArtifactSlotChanged;

        // 아이템 툴팁 UI 열기/닫기 요청이 들어오면 Presenter가 처리한다.
        GlobalEventBus.OnTooltipUIOpen += OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose += CloseTooltipUI;
    }

    private void OnDisable()
    {
        // 메모리 누수 방지를 위한 구독 해제
        GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;

        localInputReader.OnInventoryOpenRequested -= OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested -= CloseInventoryUI;

        playerInventory.OnSlotChanged -= HandleSlotChanged;
        playerInventory.OnSafeSlotChanged -= HandleSafeSlotChanged;

        GlobalEventBus.OnInventoryDropRequested -= HandleInventoryDropRequested;

        GlobalEventBus.OnArtifactEquipRequested -= HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested -= HandleArtifactUnequipRequested;

        GlobalEventBus.OnTooltipUIOpen -= OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose -= CloseTooltipUI;

        if (playerArtifactEquipment != null)
            playerArtifactEquipment.OnArtifactSlotChanged -= HandleArtifactSlotChanged;
    }

    /// <summary>
    /// 기존 이벤트 기반 아이템 습득 진입점.
    /// 현재 플레이어가 실제 수령한 수량만 처리하도록 TryPickUpItem으로 위임한다.
    /// </summary>
    private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
    {
        if (identity.entityID != pickerID)
            return;

        ItemData data = itemRepo.GetItemDataByID(pickedItemTID);
        if (data == null)
            return;

        TryPickUpItem(data, count);
    }

    /// <summary>
    /// 아이템을 실제로 얼마나 주울 수 있었는지 계산하고,
    /// 받지 못한 남은 수량을 반환한다.
    /// </summary>
    public int TryPickUpItem(ItemData data, int count)
    {
        if (data == null || count <= 0)
            return count;

        int remain = count;
        int pickedItemTID = data.TID;

        // TID 100대는 무기
        if (100 < pickedItemTID && pickedItemTID < 200)
        {
            // 무기가 비어 있으면 첫 1개는 바로 장착한다.
            if (!playerWeapon.isEquipped)
            {
                WeaponItemData weaponData = data as WeaponItemData;
                if (weaponData != null)
                {
                    playerWeapon.EquipWeapon(weaponData);
                    remain = Mathf.Max(0, remain - 1);
                }
                else
                {
                    Debug.LogError("무기가 아닌 아이템이 무기 TID를 가지고 있습니다.");
                    return count;
                }
            }

            // 남은 수량이 있으면 인벤토리에 수납한다.
            if (remain > 0)
                remain = playerInventory.AddItem(data, remain);
        }
        // TID 300대는 소모품
        else if (300 < pickedItemTID && pickedItemTID < 400)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 400대는 특수 아이템
        else if (400 < pickedItemTID && pickedItemTID < 500)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 1000대는 아티팩트
        else if (1000 <= pickedItemTID && pickedItemTID < 1100)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        else
        {
            Debug.LogWarning("Unknown item TID: " + pickedItemTID);
            return count;
        }

        // 아이템 획득 직후에는 저장하지 않는다
        // 획득 아이템은 GameScene의 PlayerInventory에만 보관하고, 결과 정산 시 ResultManager가 저장한다
        // if (remain < count)
        //     DataManager.Instance.SaveGame();

        return remain;
    }

    /* 상자와 상호작용했을 때 상자 UI와 인벤토리 UI를 함께 연다 */
    private void HandleItemBoxOpened(IInteractable interactable, int playerID)
    {
        // 다른 플레이어가 연 상자면 무시한다.
        if (identity.entityID != playerID)
            return;

        // 대상이 ItemBox가 아니면 무시한다.
        ItemBox box = interactable as ItemBox;
        if (box == null)
            return;

        // 현재 연 상자 상태를 기록한다.
        currentBox = box;
        isChestOpen = true;

        // 상자 UI를 여는 동안 입력 맵을 UI 모드로 전환한다.
        localInputReader.SwitchToUIMap();

        // 인벤토리 UI를 먼저 연다.
        OpenInventoryUI();

        // 상자 UI를 열고 데이터와 바인딩한다.
        chestUI = UIManager.Instance.Open<ChestUI>();
        if (chestUI == null) return;

        chestUI.Bind(box, playerInventory, CloseContainerUI);
    }

    /// <summary>
    /// 특정 인벤토리 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSlot(index, playerInventory.anySlots[index]);
    }

    /// <summary>
    /// 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSafeSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSafeSlot(index, playerInventory.safeSlots[index]);
    }

    /// <summary>
    /// 인벤토리 UI를 연다.
    /// 일반 인벤토리일 때만 드랍존을 사용 가능하게 둔다.
    /// </summary>
    public void OpenInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 조작을 막는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle)
            return;

        inventoryUI = UIManager.Instance.Open<InventoryUI>();
        if (inventoryUI == null)
            return;

        localInputReader.SetInventoryOpenState(true);

        // 상자 UI가 열려 있을 때는 드랍존을 비활성화한다.
        inventoryUI.SetDropZoneAvailable(!isChestOpen);

        // 슬롯 개수에 맞춰 인벤토리 및 각성 보존 슬롯 UI를 생성한다.
        inventoryUI.CreatSlots(playerInventory.slots.Count);
        inventoryUI.CreateSafeSlots(playerInventory.safeSlots.Count, playerInventory.slotNum);

        // 현재 인벤토리 데이터를 슬롯 UI에 반영한다.
        for (int i = 0; i < playerInventory.slotNum; i++)
            inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
        for (int k = 0; k < playerInventory.safeSlotNum; k++)
            inventoryUI.UpdateSafeSlot(k, playerInventory.safeSlots[k]);

        inventoryUI.UpdateArtifactSlots(playerArtifactEquipment);

        // 일반 인벤토리는 Player 액션맵을 유지한다.
    }

    /// <summary>
    /// 인벤토리 UI를 닫는다.
    /// 상자 UI나 툴팁 UI가 열려 있으면 컨테이너 UI 전체를 함께 닫는다.
    /// </summary>
    public void CloseInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 조작을 막는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle)
            return;

        // 상자 UI가 열려 있으면 컨테이너 UI 전체를 닫는다.
        if (isChestOpen)
        {
            CloseContainerUI();
            return;
        }

        // 툴팁 UI가 열려 있으면 닫아준다.
        UIManager.Instance.Close<ItemTooltipUI>();

        UIManager.Instance.Close<InventoryUI>();
        inventoryUI = null;
        localInputReader.SetInventoryOpenState(false);

        // 일반 인벤토리를 닫으면 플레이어 입력으로 복귀한다.
        localInputReader.SwitchToPlayerMap();
    }

    /// <summary>
    /// 아이템 툴팁 UI를 연다.
    /// </summary>
    public void OpenTooltipUI(SlotType slot, int slotIndex)
    {
        // 툴팁 UI의 출력 위치를 isOpenFromInventory 변수로 전달
        itemTooltipUI = UIManager.Instance.Open<ItemTooltipUI>();
        bool isFromInventory = (slot == SlotType.inventory || slot == SlotType.artifact || slot == SlotType.safe);
        itemTooltipUI.isFromInventory = isFromInventory;
        // slotIndex를 참조하여 아이템 데이터를 불러온다.
        ItemData _item;

        switch (slot)
        {
            case SlotType.inventory:  // 인벤토리 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex);
                    break;
                }
            case SlotType.chest:  // 상자 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    // 현재 캐시된 chestUI 우선, 없으면 ActiveUI 사용
                    ChestUI activeChestUI = chestUI ?? ChestUI.ActiveUI;
                    if (activeChestUI != null)
                        _item = activeChestUI.GetItemDataAt(slotIndex);
                    else
                        _item = null;

                    break;
                }
            case SlotType.artifact:  // 장비 장착 칸 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerArtifactEquipment.GetEquippedArtifact(slotIndex);
                    break;
                }
            case SlotType.safe:  // 각성 보존 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex + playerInventory.slots.Count);
                    break;
                }
            default:  // 기본값으로 null 처리
                {
                    _item = null;
                    break;
                }
        }

        // 슬롯에 저장된 아이템 데이터가 null이 아니면 UI 출력을 갱신
        if (_item != null)
        {
            itemTooltipUI.RefreshData(isFromInventory, _item);
        }
        else  // 슬롯의 아이템 데이터가 null이면 슬롯 UI를 닫음
        {
            UIManager.Instance.Close<ItemTooltipUI>();
        }
    }

    /// <summary>
    /// 아이템 툴팁 UI를 닫는다.
    /// </summary>
    public void CloseTooltipUI()
    {
        UIManager.Instance.Close<ItemTooltipUI>();
        itemTooltipUI = null;
    }

    /// <summary>
    /// 상자 UI와 인벤토리 UI, 아이템 툴팁 UI를 함께 닫는다.
    /// </summary>
    public void CloseContainerUI()
    {
        // 현재 열려 있던 상자의 열린 상태를 해제한다.
        if (currentBox != null)
            currentBox.CloseBox();

        UIManager.Instance.Close<ChestUI>();
        UIManager.Instance.Close<InventoryUI>();
        UIManager.Instance.Close<ItemTooltipUI>();

        // 캐시와 상태를 초기화한다.
        chestUI = null;
        inventoryUI = null;
        currentBox = null;
        isChestOpen = false;
        localInputReader.SetInventoryOpenState(false);

        // 입력 맵을 다시 플레이어 모드로 전환한다.
        localInputReader.SwitchToPlayerMap();
    }

    private void OpenResultUI(bool _result)
    {
        Debug.Log("결과 창을 출력합니다.");

        resultUI = UIManager.Instance.Open<ResultUI>();

        if (resultUI == null) return;
        resultUI.UpdateResultUI(_result);
    }

    public int FindItemCount(int _tid)
    {
        foreach (InventorySlotData slot in playerInventory.slots)
        {
            if (slot.TID == _tid)
            {
                return slot.amount;
            }
        }
        return 0;
    }

    private void HandleInventoryDropRequested(int slotIndex)
    {
        if (isChestOpen)
            return;

        Vector3 dropPosition = transform.position
            + transform.forward * dropForwardDistance
            + Vector3.up * dropUpOffset;

        //playerInventory.TryDropSlotToWorld(slotIndex, dropPosition, () => DataManager.Instance.SaveGame());
        // {인게임 드롭 후에는 즉시 저장하지 않는다}
        // {최종 저장은 결과 정산 시점에 처리한다}
        playerInventory.TryDropSlotToWorld(slotIndex, dropPosition);
    }

    private void HandleArtifactEquipRequested(int equipSlotIndex, int inventorySlotIndex)
    {
        // UI는 슬롯 번호만 전달하고, Presenter가 실제 아이템 타입과 장착 가능 여부를 검증한다.
        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);
        ArtifactItemData artifactData = itemData as ArtifactItemData;

        if (artifactData == null)
        {
            Debug.LogWarning("아티팩트 아이템만 장착할 수 있습니다.");
            return;
        }

        if (!playerArtifactEquipment.EquipArtifact(equipSlotIndex, artifactData, out ArtifactItemData previousArtifact))
            return;

        // 새 아티팩트는 인벤토리에서 빠지고, 기존 장착 아티팩트가 있으면 같은 인벤토리 슬롯으로 돌려보낸다.
        // 이렇게 하면 인벤토리가 가득 찬 상태에서도 장착 교체가 가능하다.
        playerInventory.ClearSlot(inventorySlotIndex);

        if (previousArtifact != null)
        {
            playerInventory.TryAddToSlot(inventorySlotIndex, previousArtifact, 1);
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, artifactData);
    }

    private void HandleArtifactUnequipRequested(int equipSlotIndex)
    {
        // 해제는 먼저 장착 슬롯에서 빼 본 뒤, 인벤토리에 넣을 수 없으면 다시 장착 상태로 복구한다.
        if (!playerArtifactEquipment.UnequipArtifact(equipSlotIndex, out ArtifactItemData removedArtifact))
            return;

        int remain = playerInventory.AddItem(removedArtifact, 1);

        if (remain > 0)
        {
            playerArtifactEquipment.EquipArtifact(equipSlotIndex, removedArtifact, out _);
            Debug.Log("인벤토리가 가득 차서 아티팩트를 해제할 수 없습니다.");
            return;
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, null);
    }

    private void HandleArtifactSlotChanged(int slotIndex, ArtifactItemData artifact)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        // 장착 상태가 바뀐 슬롯만 갱신하여 인벤토리 UI 전체 재생성을 피한다.
        inventoryUI.UpdateArtifactSlot(slotIndex, artifact);
    }
}
```

### 14-2. 설명

인벤토리, 상자, 툴팁 UI의 열기와 닫기를 중재한다. 일반 인벤토리뿐 아니라 상자 상호작용 진입점에서도 플레이어 상태와 세션 종료 여부를 검사한다. 종료 이벤트를 받으면 열려 있는 인벤토리, 상자, 툴팁을 강제로 닫고 입력을 비활성화한다. 시스템 강제 닫기에서는 Player 액션맵으로 되돌리지 않아 결과 UI 입력과 충돌하지 않도록 일반 닫기와 종료 닫기를 분리했다.

### 14-3. 현재 스크립트 전체

```cs
/// <summary>
/// 아이템과 인벤토리에 관한 상호작용을 중재하는 Presenter.
/// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI 연결, 월드 드랍을 담당한다.
/// </summary>
using UnityEngine;

public class InventoryPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerInventory playerInventory;            // 플레이어 인벤토리
    private LocalInputReader localInputReader;          // 플레이어 입력 처리
    private EntityIdentity identity;                    // 플레이어 고유 ID

    // 컨테이너 상태 캐시
    private ItemBox currentBox;                         // 현재 열려 있는 상자
    private bool isChestOpen;                           // 상자 UI가 열려 있는지 여부
    private const float dropForwardDistance = 1.0f;     // 아이템을 플레이어 앞에 떨어뜨릴 거리
    private const float dropUpOffset = 0.3f;            // 바닥 겹침 방지용 높이 보정
    private PlayerStatus playerStatus;                  // 플레이어 상태

    // UI 캐시
    private InventoryUI inventoryUI;                    // 인벤토리 UI 캐시
    private ResultUI resultUI;                          // 결과 UI 캐시
    private ChestUI chestUI;                            // 상자 UI 캐시
    private ItemTooltipUI itemTooltipUI;                // 툴팁 UI 캐시

    // 저장 데이터 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    // 아티팩트 장착 상태 관리
    private PlayerArtifactEquipment playerArtifactEquipment;       // 플레이어 아티팩트 장착 상태

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerInventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();
        identity = GetComponent<EntityIdentity>();
        playerStatus = GetComponent<PlayerStatus>();
        playerArtifactEquipment = GetComponent<PlayerArtifactEquipment>();

        if (playerWeapon == null || playerInventory == null || playerStatus == null ||
            localInputReader == null || identity == null || playerArtifactEquipment == null)
        {
            enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 인터페이스 구현부 연결
        itemRepo = new LocalJsonItemRepository();

        // 인벤토리 슬롯 초기화
        PlayerSaveData playerData = PlayerSaveDataSO.Instance.currentData;
        playerInventory.Initialize(playerData.invenSlotNum, playerData.quickSlotsNum, playerData.safeSlotNum);
    }

    private void OnEnable()
    {
        // 바닥 아이템을 주웠을 때 발생하는 이벤트를 구독한다.
        GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

        // 상자와 상호작용했을 때 상자 UI를 여는 이벤트를 구독한다.
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

        // 입력으로 인벤토리 열기/닫기 요청이 들어오면 Presenter가 처리한다.
        localInputReader.OnInventoryOpenRequested += OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested += CloseInventoryUI;

        // 인벤토리 및 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI를 갱신한다.
        playerInventory.OnSlotChanged += HandleSlotChanged;
        playerInventory.OnSafeSlotChanged += HandleSafeSlotChanged;

        // 인벤토리 드랍존으로 버리기 요청이 들어오면 월드 드랍으로 처리한다.
        GlobalEventBus.OnInventoryDropRequested += HandleInventoryDropRequested;

        // 아티팩트 장착/해제 요청 이벤트를 구독한다.
        GlobalEventBus.OnArtifactEquipRequested += HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested += HandleArtifactUnequipRequested;
        playerArtifactEquipment.OnArtifactSlotChanged += HandleArtifactSlotChanged;

        // 아이템 툴팁 UI 열기/닫기 요청이 들어오면 Presenter가 처리한다.
        GlobalEventBus.OnTooltipUIOpen += OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose += CloseTooltipUI;

        // 사망 또는 탈출 확정 시 열려 있는 인벤토리 계열 UI를 즉시 정리한다.
        GlobalEventBus.OnEscapeRequest += HandleSessionEnded;
    }

    private void OnDisable()
    {
        // 메모리 누수 방지를 위한 구독 해제
        GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;

        localInputReader.OnInventoryOpenRequested -= OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested -= CloseInventoryUI;

        playerInventory.OnSlotChanged -= HandleSlotChanged;
        playerInventory.OnSafeSlotChanged -= HandleSafeSlotChanged;

        GlobalEventBus.OnInventoryDropRequested -= HandleInventoryDropRequested;

        GlobalEventBus.OnArtifactEquipRequested -= HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested -= HandleArtifactUnequipRequested;

        GlobalEventBus.OnTooltipUIOpen -= OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose -= CloseTooltipUI;
        GlobalEventBus.OnEscapeRequest -= HandleSessionEnded;

        if (playerArtifactEquipment != null)
            playerArtifactEquipment.OnArtifactSlotChanged -= HandleArtifactSlotChanged;
    }

    /// <summary>
    /// 기존 이벤트 기반 아이템 습득 진입점.
    /// 현재 플레이어가 실제 수령한 수량만 처리하도록 TryPickUpItem으로 위임한다.
    /// </summary>
    private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
    {
        if (identity.entityID != pickerID)
            return;

        ItemData data = itemRepo.GetItemDataByID(pickedItemTID);
        if (data == null)
            return;

        TryPickUpItem(data, count);
    }

    /// <summary>
    /// 아이템을 실제로 얼마나 주울 수 있었는지 계산하고,
    /// 받지 못한 남은 수량을 반환한다.
    /// </summary>
    public int TryPickUpItem(ItemData data, int count)
    {
        if (data == null || count <= 0)
            return count;

        int remain = count;
        int pickedItemTID = data.TID;

        // TID 100대는 무기
        if (100 < pickedItemTID && pickedItemTID < 200)
        {
            // 무기가 비어 있으면 첫 1개는 바로 장착한다.
            if (!playerWeapon.isEquipped)
            {
                WeaponItemData weaponData = data as WeaponItemData;
                if (weaponData != null)
                {
                    playerWeapon.EquipWeapon(weaponData);
                    remain = Mathf.Max(0, remain - 1);
                }
                else
                {
                    Debug.LogError("무기가 아닌 아이템이 무기 TID를 가지고 있습니다.");
                    return count;
                }
            }

            // 남은 수량이 있으면 인벤토리에 수납한다.
            if (remain > 0)
                remain = playerInventory.AddItem(data, remain);
        }
        // TID 300대는 소모품
        else if (300 < pickedItemTID && pickedItemTID < 400)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 400대는 특수 아이템
        else if (400 < pickedItemTID && pickedItemTID < 500)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 1000대는 아티팩트
        else if (1000 <= pickedItemTID && pickedItemTID < 1100)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        else
        {
            Debug.LogWarning("Unknown item TID: " + pickedItemTID);
            return count;
        }

        // 아이템 획득 직후에는 저장하지 않는다
        // 획득 아이템은 GameScene의 PlayerInventory에만 보관하고, 결과 정산 시 ResultManager가 저장한다
        // if (remain < count)
        //     DataManager.Instance.SaveGame();

        return remain;
    }

    /* 상자와 상호작용했을 때 상자 UI와 인벤토리 UI를 함께 연다 */
    private void HandleItemBoxOpened(IInteractable interactable, int playerID)
    {
        // 다른 플레이어가 연 상자면 무시한다.
        if (identity.entityID != playerID)
            return;

        // 탈출 채널링 중이거나 세션 종료가 확정된 뒤에는 새 컨테이너 UI를 열지 않는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle || playerStatus.IsSessionEnded)
            return;

        // 대상이 ItemBox가 아니면 무시한다.
        ItemBox box = interactable as ItemBox;
        if (box == null)
            return;

        // 현재 연 상자 상태를 기록한다.
        currentBox = box;
        isChestOpen = true;

        // 상자 UI를 여는 동안 입력 맵을 UI 모드로 전환한다.
        localInputReader.SwitchToUIMap();

        // 인벤토리 UI를 먼저 연다.
        OpenInventoryUI();

        // 상자 UI를 열고 데이터와 바인딩한다.
        chestUI = UIManager.Instance.Open<ChestUI>();
        if (chestUI == null) return;

        chestUI.Bind(box, playerInventory, CloseContainerUI);
    }

    /// <summary>
    /// 특정 인벤토리 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSlot(index, playerInventory.anySlots[index]);
    }

    /// <summary>
    /// 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSafeSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSafeSlot(index, playerInventory.safeSlots[index]);
    }

    /// <summary>
    /// 인벤토리 UI를 연다.
    /// 일반 인벤토리일 때만 드랍존을 사용 가능하게 둔다.
    /// </summary>
    public void OpenInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 조작을 막는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle || playerStatus.IsSessionEnded)
            return;

        inventoryUI = UIManager.Instance.Open<InventoryUI>();
        if (inventoryUI == null)
            return;

        localInputReader.SetInventoryOpenState(true);

        // 상자 UI가 열려 있을 때는 드랍존을 비활성화한다.
        inventoryUI.SetDropZoneAvailable(!isChestOpen);

        // 슬롯 개수에 맞춰 인벤토리 및 각성 보존 슬롯 UI를 생성한다.
        inventoryUI.CreatSlots(playerInventory.slots.Count);
        inventoryUI.CreateSafeSlots(playerInventory.safeSlots.Count, playerInventory.slotNum);

        // 현재 인벤토리 데이터를 슬롯 UI에 반영한다.
        for (int i = 0; i < playerInventory.slotNum; i++)
            inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
        for (int k = 0; k < playerInventory.safeSlotNum; k++)
            inventoryUI.UpdateSafeSlot(k, playerInventory.safeSlots[k]);

        inventoryUI.UpdateArtifactSlots(playerArtifactEquipment);

        // 일반 인벤토리는 Player 액션맵을 유지한다.
    }

    /// <summary>
    /// 인벤토리 UI를 닫는다.
    /// 상자 UI나 툴팁 UI가 열려 있으면 컨테이너 UI 전체를 함께 닫는다.
    /// </summary>
    public void CloseInventoryUI()
    {
        // 상자 UI가 열려 있으면 컨테이너 UI 전체를 닫는다.
        if (isChestOpen)
        {
            CloseContainerUI(!playerStatus.IsSessionEnded);
            return;
        }

        // 툴팁 UI가 열려 있으면 닫아준다.
        UIManager.Instance.Close<ItemTooltipUI>();

        UIManager.Instance.Close<InventoryUI>();
        inventoryUI = null;
        localInputReader.SetInventoryOpenState(false);

        // 일반 플레이 중에 닫은 경우에만 플레이어 입력으로 복귀한다.
        if (!playerStatus.IsSessionEnded)
            localInputReader.SwitchToPlayerMap();
    }

    /// <summary>
    /// 아이템 툴팁 UI를 연다.
    /// </summary>
    public void OpenTooltipUI(SlotType slot, int slotIndex)
    {
        // 종료 처리와 동시에 남아 있던 UI 이벤트가 실행되어 툴팁을 다시 여는 것을 막는다.
        if (playerStatus.IsSessionEnded)
            return;

        // 툴팁 UI의 출력 위치를 isOpenFromInventory 변수로 전달
        itemTooltipUI = UIManager.Instance.Open<ItemTooltipUI>();
        bool isFromInventory = (slot == SlotType.inventory || slot == SlotType.artifact || slot == SlotType.safe);
        itemTooltipUI.isFromInventory = isFromInventory;
        // slotIndex를 참조하여 아이템 데이터를 불러온다.
        ItemData _item;

        switch (slot)
        {
            case SlotType.inventory:  // 인벤토리 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex);
                    break;
                }
            case SlotType.chest:  // 상자 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    // 현재 캐시된 chestUI 우선, 없으면 ActiveUI 사용
                    ChestUI activeChestUI = chestUI ?? ChestUI.ActiveUI;
                    if (activeChestUI != null)
                        _item = activeChestUI.GetItemDataAt(slotIndex);
                    else
                        _item = null;

                    break;
                }
            case SlotType.artifact:  // 장비 장착 칸 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerArtifactEquipment.GetEquippedArtifact(slotIndex);
                    break;
                }
            case SlotType.safe:  // 각성 보존 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex + playerInventory.slots.Count);
                    break;
                }
            default:  // 기본값으로 null 처리
                {
                    _item = null;
                    break;
                }
        }

        // 슬롯에 저장된 아이템 데이터가 null이 아니면 UI 출력을 갱신
        if (_item != null)
        {
            itemTooltipUI.RefreshData(isFromInventory, _item);
        }
        else  // 슬롯의 아이템 데이터가 null이면 슬롯 UI를 닫음
        {
            UIManager.Instance.Close<ItemTooltipUI>();
        }
    }

    /// <summary>
    /// 아이템 툴팁 UI를 닫는다.
    /// </summary>
    public void CloseTooltipUI()
    {
        UIManager.Instance.Close<ItemTooltipUI>();
        itemTooltipUI = null;
    }

    /// <summary>
    /// 상자 UI와 인벤토리 UI, 아이템 툴팁 UI를 함께 닫는다.
    /// </summary>
    public void CloseContainerUI()
    {
        CloseContainerUI(true);
    }

    /// <summary>
    /// 컨테이너 UI를 닫고, 일반 플레이 중에만 Player 액션맵으로 복귀합니다.
    /// 세션 종료 처리에서는 결과 UI 입력을 방해하지 않도록 액션맵을 되돌리지 않습니다.
    /// </summary>
    private void CloseContainerUI(bool restorePlayerInput)
    {
        // 현재 열려 있던 상자의 열린 상태를 해제한다.
        if (currentBox != null)
            currentBox.CloseBox();

        UIManager.Instance.Close<ChestUI>();
        UIManager.Instance.Close<InventoryUI>();
        UIManager.Instance.Close<ItemTooltipUI>();

        // 캐시와 상태를 초기화한다.
        chestUI = null;
        inventoryUI = null;
        currentBox = null;
        isChestOpen = false;
        localInputReader.SetInventoryOpenState(false);

        // 일반적인 닫기 요청에서만 입력 맵을 다시 플레이어 모드로 전환한다.
        if (restorePlayerInput)
            localInputReader.SwitchToPlayerMap();
    }

    /// <summary>
    /// 사망 또는 탈출 확정 시 인벤토리, 상자, 툴팁을 강제로 닫고 입력 상태를 초기화합니다.
    /// </summary>
    private void HandleSessionEnded(bool extractionResult)
    {
        CloseContainerUI(false);
        localInputReader.enabled = false;
    }

    private void OpenResultUI(bool _result)
    {
        Debug.Log("결과 창을 출력합니다.");

        resultUI = UIManager.Instance.Open<ResultUI>();

        if (resultUI == null) return;
        resultUI.UpdateResultUI(_result);
    }

    public int FindItemCount(int _tid)
    {
        foreach (InventorySlotData slot in playerInventory.slots)
        {
            if (slot.TID == _tid)
            {
                return slot.amount;
            }
        }
        return 0;
    }

    private void HandleInventoryDropRequested(int slotIndex)
    {
        if (isChestOpen)
            return;

        Vector3 dropPosition = transform.position
            + transform.forward * dropForwardDistance
            + Vector3.up * dropUpOffset;

        //playerInventory.TryDropSlotToWorld(slotIndex, dropPosition, () => DataManager.Instance.SaveGame());
        // {인게임 드롭 후에는 즉시 저장하지 않는다}
        // {최종 저장은 결과 정산 시점에 처리한다}
        playerInventory.TryDropSlotToWorld(slotIndex, dropPosition);
    }

    private void HandleArtifactEquipRequested(int equipSlotIndex, int inventorySlotIndex)
    {
        // UI는 슬롯 번호만 전달하고, Presenter가 실제 아이템 타입과 장착 가능 여부를 검증한다.
        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);
        ArtifactItemData artifactData = itemData as ArtifactItemData;

        if (artifactData == null)
        {
            Debug.LogWarning("아티팩트 아이템만 장착할 수 있습니다.");
            return;
        }

        if (!playerArtifactEquipment.EquipArtifact(equipSlotIndex, artifactData, out ArtifactItemData previousArtifact))
            return;

        // 새 아티팩트는 인벤토리에서 빠지고, 기존 장착 아티팩트가 있으면 같은 인벤토리 슬롯으로 돌려보낸다.
        // 이렇게 하면 인벤토리가 가득 찬 상태에서도 장착 교체가 가능하다.
        playerInventory.ClearSlot(inventorySlotIndex);

        if (previousArtifact != null)
        {
            playerInventory.TryAddToSlot(inventorySlotIndex, previousArtifact, 1);
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, artifactData);
    }

    private void HandleArtifactUnequipRequested(int equipSlotIndex)
    {
        // 해제는 먼저 장착 슬롯에서 빼 본 뒤, 인벤토리에 넣을 수 없으면 다시 장착 상태로 복구한다.
        if (!playerArtifactEquipment.UnequipArtifact(equipSlotIndex, out ArtifactItemData removedArtifact))
            return;

        int remain = playerInventory.AddItem(removedArtifact, 1);

        if (remain > 0)
        {
            playerArtifactEquipment.EquipArtifact(equipSlotIndex, removedArtifact, out _);
            Debug.Log("인벤토리가 가득 차서 아티팩트를 해제할 수 없습니다.");
            return;
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, null);
    }

    private void HandleArtifactSlotChanged(int slotIndex, ArtifactItemData artifact)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        // 장착 상태가 바뀐 슬롯만 갱신하여 인벤토리 UI 전체 재생성을 피한다.
        inventoryUI.UpdateArtifactSlot(slotIndex, artifact);
    }
}
```

---

## 15. 최종 학습 정리

| 학습 포인트 | 적용 내용 |
| --- | --- |
| 상태 경계 | 추적과 복귀 사이에 완충 구간을 두어 상태 반복 전환을 방지 |
| 공통 판정 | CanBeTargeted와 IsTargetAvailable을 감지·추적·공격에서 재사용 |
| 진입점 방어 | TakeDamage, ApplyTimePenalty, UI 열기, 실제 공격 직전에 종료 상태 검사 |
| 책임 분리 | Brain은 판단, Memory는 기억, Perception은 감지, Combat은 공격, Locomotion은 이동 담당 |
| 중복 처리 방지 | 플레이타임과 결과 정산은 최초 종료 이벤트에서만 실행 |

> 코드를 읽을 때는 무엇이 바뀌었는지만 보지 말고, 어떤 상태에서 이 함수가 호출되며 어느 진입점에서 잘못된 흐름을 차단하는지를 함께 확인한다.
{% endraw %}
