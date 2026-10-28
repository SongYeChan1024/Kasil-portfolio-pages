---
title: "2026-07-21_EnemyCombat_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyCombat.cs cs using System; using System.Collections; using UnityEngine; using UnityEngine.AI; "
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyCombat.cs cs using System; using System.Collections; using UnityEngine; using UnityEngine.AI; "
published: false
migration_id: "3a436532580e8164b5b4dd72732f8f83"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyCombat.cs</code>

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

    [SerializeField] private int[] AttackCue_AudioIDPool;              // 공격 시작 사운드 ID 풀
```

```cs
[SerializeField] private int[] firstSlash_AudioIDPool;             // 1타 사운드 ID 풀
[SerializeField] private int[] secondSlash_AudioIDPool;            // 2타 사운드 ID 풀

[NonSerialized] private float attackStartRangeSqr;                 // 공격 시작 거리 제곱값 캐시
[NonSerialized] private float attackHitRangeSqr;                   // 실제 타격 거리 제곱값 캐시
[NonSerialized] private float closeCombatAwarenessRangeSqr;        // 근접 타겟 유지 거리 제곱값 캐시
[NonSerialized] private float nextAttackAvailableTime;             // 다음 공격 가능 시각
[NonSerialized] private float currentSlashDamage;                  // 현재 공격 단계에서 적용할 피해량
[NonSerialized] private bool hasAppliedCurrentSlashDamage;         // 현재 타격 단계 피해 적용 여부
[NonSerialized] private float lastAttackFinishedTime = float.NegativeInfinity; // 마지막 공격 종료 시각

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
```

```cs
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
/// 공격이 끝난 직후 짧은 재정렬 시간 안에 있는지 확인합니다.
/// EnemyBrain이 이 시간 동안 복귀/차단 이동보다 플레이어 재추적을 우선하도록 사용합니다.
/// </summary>
public bool IsInPostAttackRepositionGrace(float graceDuration)
{
    return graceDuration > 0.0f && Time.time - lastAttackFinishedTime <= graceDuration;
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
```

```cs
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

// 사운드 재생 이벤트를 AudioManager에 전달하여 예고 지점에서 3D 오디오 재생
int cueAudioID = AttackCue_AudioIDPool[UnityEngine.Random.Range(0, AttackCue_AudioIDPool.Length)];
GlobalEventBus.OnPlay3DSoundRequested?.Invoke(cueAudioID, self.transform.position);

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
```

```cs
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

    // 사운드 재생 이벤트를 AudioManager에 전달하여 공격 이벤트 시작 지점에서 3D 오디오 재생
    int[] atkAudioPool = swingIndex switch
    {
        0 => firstSlash_AudioIDPool,
        1 => secondSlash_AudioIDPool,
        _ => firstSlash_AudioIDPool
    };
    int atkAudioID = atkAudioPool[UnityEngine.Random.Range(0, atkAudioPool.Length)];
    GlobalEventBus.OnPlay3DSoundRequested?.Invoke(atkAudioID, self.position);

    currentSlashDamage = swingDamage;
    hasAppliedCurrentSlashDamage = false;

    if (lungeDistance > 0.0f && lungeDuration > 0.0f)
    {
```

```cs
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
    Vector3 bodyOrigin = self != null ? self.position : origin;

    // HitRange가 몸 앞쪽에 배치된 적은 플레이어가 너무 가까이 붙었을 때
    // 몸 기준으로는 근접 상태지만 HitRange 기준으로는 오히려 범위 밖이 될 수 있습니다.
    // 기존 전방 판정은 유지하되, 초근접 상황에서는 몸 중심 기준 거리도 함께 허용합니다.
    bool isInsideHitOriginRange = EnemyMathUtility.GetPlanarSqrDistance(origin, target.position) <= attackHitRangeSqr;
    bool isInsideBodyRange = EnemyMathUtility.GetPlanarSqrDistance(bodyOrigin, target.position) <= attackHitRangeSqr;
    if (!isInsideHitOriginRange && !isInsideBodyRange)
    {
        return;
    }

    Vector3 damageCheckOrigin = isInsideHitOriginRange ? origin : bodyOrigin;
    if (IsAttackBlockedByObstacle(damageCheckOrigin, target.position))
    {
        return;
    }

    IEffectReceiver damageable = target.GetComponentInParent<IEffectReceiver>();
    if (damageable == null)
    {
        return;
    }

    damageable.TakeDamage(currentSlashDamage);
```

```cs
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
        lastAttackFinishedTime = Time.time;

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

## 2. 변경 설명

공격 시작 거리 판정을 다른 AI 분기에서도 동일하게 사용할 수 있도록 독립 메서드로 분리했습니다. 콤보가 끝난 시점부터 쿨다운을 계산할 수 있는 설정을 추가해 공격 종료 직후 추격과 재공격 조건이 충돌하는 흐름을 보완했습니다. 기존 공격 코루틴과 데미지 판정 자체는 유지합니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyCombat.cs</code>

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
    [SerializeField] private bool startCooldownAfterCombo = false;     // 기존 프리팹 호환을 유지하면서 콤보 종료 후부터 쿨다운을 셀지 여부

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

```

```cs
[SerializeField] private int[] AttackCue_AudioIDPool;              // 공격 시작 사운드 ID 풀
[SerializeField] private int[] firstSlash_AudioIDPool;             // 1타 사운드 ID 풀
[SerializeField] private int[] secondSlash_AudioIDPool;            // 2타 사운드 ID 풀

[NonSerialized] private float attackStartRangeSqr;                 // 공격 시작 거리 제곱값 캐시
[NonSerialized] private float attackHitRangeSqr;                   // 실제 타격 거리 제곱값 캐시
[NonSerialized] private float closeCombatAwarenessRangeSqr;        // 근접 타겟 유지 거리 제곱값 캐시
[NonSerialized] private float nextAttackAvailableTime;             // 다음 공격 가능 시각
[NonSerialized] private float currentSlashDamage;                  // 현재 공격 단계에서 적용할 피해량
[NonSerialized] private bool hasAppliedCurrentSlashDamage;         // 현재 타격 단계 피해 적용 여부
[NonSerialized] private float lastAttackFinishedTime = float.NegativeInfinity; // 마지막 공격 종료 시각

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
```

```cs
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
/// 공격 쿨다운과 무관하게 대상이 공격 시작 거리 안에 있는지만 확인합니다.
/// 추격 중인 적이 쿨다운 동안 플레이어 중심까지 파고들지 않도록 정지 판정에 사용합니다.
/// </summary>
public bool IsWithinAttackStartRange(float sqrDistToTarget)
{
    return sqrDistToTarget <= attackStartRangeSqr;
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
/// 공격이 끝난 직후 짧은 재정렬 시간 안에 있는지 확인합니다.
/// EnemyBrain이 이 시간 동안 복귀/차단 이동보다 플레이어 재추적을 우선하도록 사용합니다.
/// </summary>
public bool IsInPostAttackRepositionGrace(float graceDuration)
{
    return graceDuration > 0.0f && Time.time - lastAttackFinishedTime <= graceDuration;
}

/// <summary>
/// 공격 애니메이션은 한 번만 재생하고, 실제 1타/2타는 애니메이션 이벤트가 호출합니다.
/// </summary>
public IEnumerator RunCombo(
```

```cs
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

    if (!startCooldownAfterCombo)
    {
        nextAttackAvailableTime = Time.time + attackCooldown;
    }
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

    // 사운드 재생 이벤트를 AudioManager에 전달하여 예고 지점에서 3D 오디오 재생
    int cueAudioID = AttackCue_AudioIDPool[UnityEngine.Random.Range(0, AttackCue_AudioIDPool.Length)];
    GlobalEventBus.OnPlay3DSoundRequested?.Invoke(cueAudioID, self.transform.position);

    // 예고 동작 도중 타겟이 사망했을 수 있으므로 공격 애니메이션을 시작하기 직전에 다시 검사합니다.
    if (!EnemyPerception.IsTargetAvailable(target))
    {
```

```cs
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

    // 사운드 재생 이벤트를 AudioManager에 전달하여 공격 이벤트 시작 지점에서 3D 오디오 재생
    int[] atkAudioPool = swingIndex switch
    {
```

```cs
        0 => firstSlash_AudioIDPool,
        1 => secondSlash_AudioIDPool,
        _ => firstSlash_AudioIDPool
    };
    int atkAudioID = atkAudioPool[UnityEngine.Random.Range(0, atkAudioPool.Length)];
    GlobalEventBus.OnPlay3DSoundRequested?.Invoke(atkAudioID, self.position);

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
    Vector3 bodyOrigin = self != null ? self.position : origin;

    // HitRange가 몸 앞쪽에 배치된 적은 플레이어가 너무 가까이 붙었을 때
    // 몸 기준으로는 근접 상태지만 HitRange 기준으로는 오히려 범위 밖이 될 수 있습니다.
    // 기존 전방 판정은 유지하되, 초근접 상황에서는 몸 중심 기준 거리도 함께 허용합니다.
    bool isInsideHitOriginRange = EnemyMathUtility.GetPlanarSqrDistance(origin, target.position) <= attackHitRangeSqr;
    bool isInsideBodyRange = EnemyMathUtility.GetPlanarSqrDistance(bodyOrigin, target.position) <= attackHitRangeSqr;
    if (!isInsideHitOriginRange && !isInsideBodyRange)
    {
```

```cs
        return;
    }

    Vector3 damageCheckOrigin = isInsideHitOriginRange ? origin : bodyOrigin;
    if (IsAttackBlockedByObstacle(damageCheckOrigin, target.position))
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
    lastAttackFinishedTime = Time.time;

    if (startCooldownAfterCombo)
    {
        nextAttackAvailableTime = Time.time + attackCooldown;
    }

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
```

```cs
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
{% endraw %}
