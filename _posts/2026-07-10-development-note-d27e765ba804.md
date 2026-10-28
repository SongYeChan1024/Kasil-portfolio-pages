---
title: "2026-07-10_wall_collision_debug_script_compare"
date: 2026-07-10 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-10\\_wall\\_collision\\_debug\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 10일 진행한 벽 관통 및 충돌 판정 디버깅 작업을 기준으로, 수정 전 스크립트 전체와 수정 후 스크립트 전체를 비교하기 위해 작성했다. | 기준 | "
description: "2026-07-10\\_wall\\_collision\\_debug\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 10일 진행한 벽 관통 및 충돌 판정 디버깅 작업을 기준으로, 수정 전 스크립트 전체와 수정 후 스크립트 전체를 비교하기 위해 작성했다. | 기준 | "
published: true
migration_id: "39936532580e8044bb76d27e765ba804"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
# 2026-07-10\_wall\_collision\_debug\_script\_compare

## 1. 문서 개요

이 문서는 2026년 7월 10일 진행한 벽 관통 및 충돌 판정 디버깅 작업을 기준으로, 수정 전 스크립트 전체와 수정 후 스크립트 전체를 비교하기 위해 작성했다.

| 기준 | 내용 |
| --- | --- |
| 이전 코드 기준 | 51ad0c4 |
| 현재 코드 기준 | ba742c8 |
| 주요 수정 범위 | 에너미 돌진, 에너미 공격 판정, 플레이어 구르기, 플레이어 총격 로그 오류 |

## 2. 변경 요약

| 스크립트 | 변경 목적 |
| --- | --- |
| EnemyLocomotion.cs | 에너미 돌진 중 벽 관통 방지 |
| EnemyCombat.cs | 벽 너머 공격 데미지 차단 |
| PlayerMovement.cs | 구르기 중 벽 관통 및 잔여 속도 밀림 방지 |
| PlayerWeapon.cs | 벽 타격 시 null 참조 로그 오류 방지 |
| Default Local Group.asset | 에픽 아티팩트 아이콘 Addressables 누락 등록 |

## 3. EnemyLocomotion.cs

### 3-1. 이전 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// 적의 실제 몸 움직임을 담당하는 모듈입니다.
/// 일반 이동, 정지, 방향 전환, 공격 중 짧은 돌진까지 처리합니다.
///</summary>
[Serializable]
public class EnemyLocomotion
{
    [SerializeField] private float moveSpeed = 4.0f;     // 기본 추적 및 순찰 이동 속도

    // 플레이어와 같은 쿼터뷰 기준으로 적의 시각 방향을 판정하기 위한 보정 각도입니다.
    // 월드 forward를 그대로 쓰면 화면에서 보이는 좌우/상하와 어긋날 수 있어 애니메이션 동기화에 사용합니다.
    private const float VisualDirectionAngle = 45.0f;

    public void OnValidate()
    {
        moveSpeed = Mathf.Max(0.1f, moveSpeed);
    }

    ///<summary>
    /// NavMeshAgent 초기 속도를 설정합니다.
    /// EnemyMovement의 Awake에서 한 번 호출해 기본 이동 속도를 맞춥니다.
    ///</summary>
    public void Initialize(NavMeshAgent agent)
    {
        if (agent != null)
        {
            agent.speed = moveSpeed;
        }
    }

    ///<summary>
    /// 현재 위치가 목표 위치에 충분히 가까운지 평면 거리 기준으로 판정합니다.
    /// 높이 차이 때문에 순찰 포인트 도착 판정이 흔들리지 않도록 Y축은 무시합니다.
    ///</summary>
    public bool HasReachedDestination(Vector3 currentPosition, Vector3 destination, float stopDistance)
    {
        float reachDistance = Mathf.Max(0.05f, stopDistance);
        return EnemyMathUtility.GetPlanarSqrDistance(currentPosition, destination) <= reachDistance * reachDistance;
    }

    ///<summary>
    /// 목적지를 향해 이동시키고 걷기/방향 애니메이션 이벤트를 갱신합니다.
    /// Chase, Patrol, Investigate, Return처럼 이동이 필요한 상태에서 공용으로 사용합니다.
    ///</summary>
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

    ///<summary>
    /// 현재 이동을 즉시 멈추고 걷기 애니메이션도 끕니다.
    /// 포인트 도착, 공격 시작, 조사 대기처럼 제자리 상태로 전환할 때 사용합니다.
    ///</summary>
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

    ///<summary>
    /// 이동과 공격 상태를 모두 끄고 대기 상태로 돌립니다.
    /// 추적 대상이 없고 조사나 순찰도 없는 상황에서 사용하는 기본 정리 함수입니다.
    ///</summary>
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

    ///<summary>
    /// 목표 위치를 즉시 바라보도록 회전시키고 방향 애니메이션 값을 갱신합니다.
    /// 공격 직전, 이동 방향 전환, 조사 방향 보정 같은 곳에서 공용으로 사용합니다.
    ///</summary>
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

    ///<summary>
    /// 2타 직전에는 목표를 완전히 꺾지 않고, 지정한 각도까지만 보정합니다.
    /// 빠르게 방향이 꺾여 보이는 문제를 줄이기 위한 전투 전용 회전 함수입니다.
    ///</summary>
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

    ///<summary>
    /// 공격 연출용 짧은 전진 돌진을 수행하고, 끝난 뒤 NavMeshAgent 위치를 다시 맞춥니다.
    /// 2연격 각 스윙에 맞춰 짧게 미는 느낌을 주기 위한 함수입니다.
    ///</summary>
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

    ///<summary>
    /// 현재 바라보는 월드 방향을 애니메이터가 사용하는 lookDir/lookRight 값으로 변환합니다.
    /// 쿼터니언 y값을 직접 쓰지 않고 self.forward를 쿼터뷰 화면 기준으로 보정해서
    /// 실제 적이 바라보는 방향과 스프라이트 애니메이션 방향이 어긋나지 않도록 맞춰줍니다.
    ///</summary>
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

### 3-2. 설명

에너미 공격 돌진 중 벽을 넘어가는 문제를 막기 위해 돌진 목적지를 NavMesh와 Wall Collider 기준으로 보정했다. 기존에는 돌진 방향과 거리만으로 목적지를 계산했기 때문에 벽 너머 좌표가 목적지로 잡힐 수 있었다. 수정 후에는 NavMesh.Raycast와 Physics.SphereCast를 이용해 막힌 지점을 확인하고, 벽 앞 버퍼 위치로 목적지를 보정한다.

### 3-3. 바뀐 스크립트 전체

## 3. EnemyCombat.cs

### 3-1. 이전 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// 적의 전투 흐름을 담당하는 모듈입니다.
/// 공격 시작 가능 여부, 2연격 타이밍, 타격 거리, 데미지 적용을 한 곳에서 관리합니다.
///</summary>
[Serializable]
public class EnemyCombat
{
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

    ///<summary>
    /// 현재 대상과의 거리, 쿨다운 기준으로 공격 시작 가능 여부를 판정합니다.
    ///</summary>
    public bool CanStartAttack(float sqrDistToTarget)
    {
        return Time.time >= nextAttackAvailableTime && sqrDistToTarget <= attackStartRangeSqr;
    }

    ///<summary>
    /// 공격 애니메이션은 한 번만 재생하고, 실제 1타/2타는 애니메이션 이벤트가 호출합니다.
    ///</summary>
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

    ///<summary>
    /// 애니메이션 이벤트로 들어온 스윙 번호에 따라 돌진 거리와 데미지를 분리 적용합니다.
    /// 이벤트 시점은 "팔이 나가기 직전"에 두는 편이 자연스럽습니다.
    ///</summary>
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

    ///<summary>
    /// 현재 열린 타격 단계에 맞춰 데미지를 한 번만 적용합니다.
    ///</summary>
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

        IEffectReceiver damageable = target.GetComponentInParent<IEffectReceiver>();
        if (damageable == null)
        {
            return;
        }

        damageable.TakeDamage(currentSlashDamage);
        hasAppliedCurrentSlashDamage = true;
    }

    ///<summary>
    /// 현재 공격 단계에서 남아 있던 런타임 상태를 정리합니다.
    ///</summary>
    public void ClearRuntimeState()
    {
        currentSlashDamage = 0.0f;
        hasAppliedCurrentSlashDamage = false;
    }
}
```

### 3-2. 설명

에너미 공격 판정이 벽 너머 플레이어에게 들어갈 수 있는 문제를 막기 위해 데미지 적용 직전에 벽 차단 검사를 추가했다. 기존에는 공격 범위와 타겟 여부 중심으로 데미지를 적용했지만, 수정 후에는 공격자와 타겟 사이에 Wall Collider가 있으면 데미지를 적용하지 않는다.

### 3-3. 바뀐 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// ?곸쓽 ?꾪닾 ?먮쫫???대떦?섎뒗 紐⑤뱢?낅땲??
/// 怨듦꺽 ?쒖옉 媛???щ?, 2?곌꺽 ??대컢, ?寃?嫄곕━, ?곕?吏 ?곸슜????怨녹뿉??愿由ы빀?덈떎.
///</summary>
[Serializable]
public class EnemyCombat
{
    [SerializeField] private LayerMask attackObstacleMask;             // 怨듦꺽 ?먯젙??留됰뒗 踰??μ븷臾??덉씠??
    [SerializeField] private float attackStartRange = 3.0f;            // 怨듦꺽 肄붾（?댁쓣 ?쒖옉?????덈뒗 嫄곕━
    [SerializeField] private float attackHitRange = 1.2f;              // ?ㅼ젣 ?곕?吏媛 ?ㅼ뼱媛??洹쇱젒 ?먯젙 嫄곕━
    [SerializeField] private float attackCooldown = 2.0f;              // ??踰덉쓽 肄ㅻ낫 ???ㅼ떆 怨듦꺽 媛?ν븳 ?쒓컙

    [SerializeField] private float firstSlashTelegraphTime = 0.35f;    // 怨듦꺽 ?좊땲硫붿씠?섏쓣 ?쒖옉?섍린 ???좊뵜 ?쒓컙
    [SerializeField] private float attackAnimationDuration = 1.3333f;  // 怨듦꺽 ?좊땲硫붿씠??1???꾩껜 湲몄씠
    [SerializeField] private float attackRecoveryTime = 0.65f;         // 2? 醫낅즺 ???뚮났 ?쒓컙

    [SerializeField] private float firstSlashLungeDistance = 1.0f;     // 1? ?뚯쭊 嫄곕━
    [SerializeField] private float secondSlashLungeDistance = 1.2f;    // 2? ?뚯쭊 嫄곕━
    [SerializeField] private float firstSlashLungeDuration = 0.15f;    // 1? ?뚯쭊 ?쒓컙
    [SerializeField] private float secondSlashLungeDuration = 0.18f;   // 2? ?뚯쭊 ?쒓컙

    [SerializeField] private float firstSlashDamage = 8.0f;            // 1? ?쇳빐??
    [SerializeField] private float secondSlashDamage = 12.0f;          // 2? ?쇳빐??
    [SerializeField] private float secondSlashTurnLimit = 25.0f;       // 2? 吏곸쟾 蹂댁젙 媛?ν븳 理쒕? ?뚯쟾 媛곷룄

    [NonSerialized] private float attackStartRangeSqr;                 // 怨듦꺽 ?쒖옉 嫄곕━ ?쒓낢媛?罹먯떆
    [NonSerialized] private float attackHitRangeSqr;                   // ?ㅼ젣 ?寃?嫄곕━ ?쒓낢媛?罹먯떆
    [NonSerialized] private float nextAttackAvailableTime;             // ?ㅼ쓬 怨듦꺽 媛???쒓컖
    [NonSerialized] private float currentSlashDamage;                  // ?꾩옱 怨듦꺽 ?④퀎?먯꽌 ?곸슜???쇳빐??
    [NonSerialized] private bool hasAppliedCurrentSlashDamage;         // ?꾩옱 ?寃??④퀎 ?쇳빐 ?곸슜 ?щ?

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

    ///<summary>
    /// ?꾩옱 ??곴낵??嫄곕━, 荑⑤떎??湲곗??쇰줈 怨듦꺽 ?쒖옉 媛???щ?瑜??먯젙?⑸땲??
    ///</summary>
    public bool CanStartAttack(float sqrDistToTarget)
    {
        return Time.time >= nextAttackAvailableTime && sqrDistToTarget <= attackStartRangeSqr;
    }

    ///<summary>
    /// 怨듦꺽 ?좊땲硫붿씠?섏? ??踰덈쭔 ?ъ깮?섍퀬, ?ㅼ젣 1?/2????좊땲硫붿씠???대깽?멸? ?몄텧?⑸땲??
    ///</summary>
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

    ///<summary>
    /// ?좊땲硫붿씠???대깽?몃줈 ?ㅼ뼱???ㅼ쐷 踰덊샇???곕씪 ?뚯쭊 嫄곕━? ?곕?吏瑜?遺꾨━ ?곸슜?⑸땲??
    /// ?대깽???쒖젏? "?붿씠 ?섍?湲?吏곸쟾"???먮뒗 ?몄씠 ?먯뿰?ㅻ읇?듬땲??
    ///</summary>
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

    ///<summary>
    /// ?꾩옱 ?대┛ ?寃??④퀎??留욎떠 ?곕?吏瑜???踰덈쭔 ?곸슜?⑸땲??
    ///</summary>
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

    ///<summary>
    /// ?꾩옱 怨듦꺽 ?④퀎?먯꽌 ?⑥븘 ?덈뜕 ?고????곹깭瑜??뺣━?⑸땲??
    ///</summary>
    public void ClearRuntimeState()
    {
        currentSlashDamage = 0.0f;
        hasAppliedCurrentSlashDamage = false;
    }

    ///<summary>
    /// 怨듦꺽 ?곹깭???ㅼ뼱媛?????곸씠 踰??ㅻ줈 ?대룞??寃쎌슦 ?곕?吏媛 ?곸슜?섏? ?딅룄濡?寃?ы빀?덈떎.
    ///</summary>
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

    ///<summary>
    /// ?몄뒪?숉꽣?먯꽌 ?곕줈 吏?뺥븯吏 ?딆븯?쇰㈃ ?꾨줈?앺듃??Wall ?덉씠?대? 湲곕낯 怨듦꺽 李⑤떒 ?덉씠?대줈 ?ъ슜?⑸땲??
    ///</summary>
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

## 3. PlayerMovement.cs

### 3-1. 이전 스크립트 전체

### 3-2. 설명

플레이어가 벽에 몸을 비비면서 구르기를 사용할 때 벽 모서리나 얇은 충돌 틈을 통과하는 문제를 줄이기 위해 구르기 중에만 SweepTest와 SphereCast 기반 보정을 적용했다. 일반 이동까지 막으면 문 상호작용과 이동감이 과하게 제한되므로, 최종 구조는 회피 이동 중에만 벽 관통 방어를 수행한다. 또한 벽에 비빈 뒤 입력을 떼도 잔여 속도로 밀리는 현상을 막기 위해 이동 직후 수평 속도를 초기화한다.

### 3-3. 바뀐 스크립트 전체

## 3. PlayerWeapon.cs

### 3-1. 이전 스크립트 전체

```cs
using System.Collections;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using AnyPortrait;

public class PlayerWeapon : MonoBehaviour
{
    [Header("Equip Weapon")]
    [SerializeField] private WeaponItemData weaponData;                 // 무기 데이터
    [SerializeField] private Transform firePoint;                       // 발사 지점
    [SerializeField] private LayerMask hitMask;                         // 피격 대상 레이어 마스크

    [Header("Shot Trace Visual")]
    [SerializeField] private bool showShotTrace = true;                 // 궤적 보이기 여부
    [SerializeField] private LineRenderer shotTraceRenderer;            // 궤적 렌더러
    [SerializeField] private float shotTraceDuration = 0.3f;           // 궤적이 보이는 시간
    [SerializeField] private Color hitTraceColor = Color.white;         // 적중 했을 시 궤적 색상
    [SerializeField] private Color missTraceColor = Color.red;          // 적중하지 않을 시 궤적 색상

    public bool isEquipped => weaponData != null;                       // 무기 장착 여부
    public float nowUseMana => weaponData.useMana;                      // 현재 무기의 마나 사용량
    public float nowAttackPower => weaponData.AtkValue;                 // 무기의 공격력
    public float nowFireRate => weaponData.fireRate;                    // 현재 무기의 기본 발사 간격

    private GameObject currentWeaponInstance;                           // 현재 무기 인스턴스
    private Coroutine shotTraceCoroutine;                               // 궤적 출력 코루틴
    private WaitForSeconds shotTraceWait;                               // 궤적 출력 코루틴 WS

    [Header("Aim")]
    [SerializeField] private float aimOriginHeight = 1.0f;        // 1차 조준 레이를 쏠 높이
    [SerializeField] private float muzzleBackstepDistance = 0.3f; // 총구가 벽 안에 들어갔을 때 시작점을 뒤로 물릴 거리

    [SerializeField] public apPortrait apPort;

    private void Awake()
    {
        weaponData = null;
        shotTraceWait = new WaitForSeconds(shotTraceDuration);
        HideShotTrace();
    }

    private void OnDisable()
    {
        if (shotTraceCoroutine != null)
        {
            StopCoroutine(shotTraceCoroutine);
            shotTraceCoroutine = null;
        }

        HideShotTrace();
    }

    public void initialize(WeaponItemData _weapon)
    {
        weaponData = _weapon;
    }

    public void PlayerAttack()
    {
        if (weaponData == null || firePoint == null)
            return;

        apPort.SetControlParamFloat("Yuan_Recoil", 1.0f);
        apPort.SetControlParamFloat("Yuan_B_Recoil", 1.0f);
        StartCoroutine(PlayRecoilAnimation(0.5f, "Yuan_Recoil"));
        StartCoroutine(PlayRecoilAnimation(0.5f, "Yuan_B_Recoil"));

        Vector3 muzzleOrigin = firePoint.position;
        Vector3 aimOrigin = transform.position + Vector3.up * aimOriginHeight;
        Vector3 aimDirection = firePoint.forward;

        // 1차: 먼저 "어디를 겨누고 있는지"를 구한다.
        Vector3 targetPoint = aimOrigin + aimDirection * weaponData.fireRange;

        if (Physics.Raycast(
            aimOrigin,
            aimDirection,
            out RaycastHit aimHit,
            weaponData.fireRange,
            hitMask,
            QueryTriggerInteraction.Ignore))
        {
            targetPoint = aimHit.point;
        }

        // 2차: 총구에서 targetPoint까지 실제 발사 판정을 한다.
        Vector3 shotVector = targetPoint - muzzleOrigin;
        float shotDistance = shotVector.magnitude;

        if (shotDistance <= 0.001f)
            return;

        Vector3 shotDirection = shotVector / shotDistance;

        // 총구가 벽 안에 들어간 상황을 완화하려고 시작점을 약간 뒤로 민다.
        Vector3 safeShotOrigin = muzzleOrigin - shotDirection * muzzleBackstepDistance;
        float safeShotDistance = shotDistance + muzzleBackstepDistance;

        Vector3 endPoint = targetPoint;
        Color traceColor = missTraceColor;

        if (Physics.Raycast(
            safeShotOrigin,
            shotDirection,
            out RaycastHit shotHit,
            safeShotDistance,
            hitMask,
            QueryTriggerInteraction.Ignore))
        {
            endPoint = shotHit.point;

            IEffectReceiver target = shotHit.collider.GetComponentInParent<IEffectReceiver>();

            // 실제로 데미지를 줄 수 있는 적을 맞았을 때만 흰색으로 바꾸고 피해를 준다.
            if (target != null && target.EntityFaction != Faction.player)
            {
                traceColor = hitTraceColor;
                target.TakeDamage(weaponData.AtkValue);
            }
        }

        // 궤적은 여전히 총구에서 시작해 보이게 한다.
        ShowShotTrace(muzzleOrigin, endPoint, traceColor);

        // 실제 오디오 재생과 별개로, AI는 이 총소리 이벤트를 통해 위치를 조사합니다.
        NoiseSystem.Emit(NoiseType.Gunshot, muzzleOrigin, gameObject);
    }

    // 리코일 애니메이션 출력
    public IEnumerator PlayRecoilAnimation(float recoilDuration, string controlParamName)
    {
        float elapsedTime = 0f;
        // 시간에 비례하여 리코일 애니메이션을 천천히 복구
        while (elapsedTime < recoilDuration)
        {
            elapsedTime += Time.deltaTime;
            float normalizedTime = Mathf.Clamp01(elapsedTime / recoilDuration);
            apPort.SetControlParamFloat(controlParamName, 1.0f - normalizedTime);
            yield return null;
        }
        apPort.SetControlParamFloat(controlParamName, 0f);
    }

    public void EquipWeapon(WeaponItemData weaponItemData)
    {
        if (weaponItemData == null)
            return;

        if (currentWeaponInstance != null)
        {
            Destroy(currentWeaponInstance);
            currentWeaponInstance = null;
        }

        weaponData = weaponItemData;

        // 무기 프리팹 주소가 비어 있을 시 실패
        //if(!weaponData.itemPrefabRef.RuntimeKeyIsValid()) return;
        // Addressble을 통해 비동기로 무기를 소환, 손 위치에 부착함
        // 2D 캐릭터를 사용하기 때문에 3D 무기 장착 코드는 사용하지 않습니다
        // Addressables.InstantiateAsync(weaponData.itemPrefabRef, handPos).Completed += OnWeaponLoaded;
    }

    private void OnWeaponLoaded(AsyncOperationHandle<GameObject> handle)
    {
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            currentWeaponInstance = handle.Result;
            currentWeaponInstance.transform.localPosition = Vector3.zero;
            currentWeaponInstance.transform.localRotation = Quaternion.identity;
        }
        else
        {
            Debug.LogError("무기 장착에 실패했습니다.");
        }
    }

    private void ShowShotTrace(Vector3 start, Vector3 end, Color traceColor)
    {
        if (!showShotTrace || shotTraceRenderer == null)
            return;

        shotTraceRenderer.positionCount = 2;
        shotTraceRenderer.SetPosition(0, start);
        shotTraceRenderer.SetPosition(1, end);
        shotTraceRenderer.startColor = traceColor;
        shotTraceRenderer.endColor = traceColor;
        shotTraceRenderer.enabled = true;

        if (shotTraceCoroutine != null)
            StopCoroutine(shotTraceCoroutine);

        shotTraceCoroutine = StartCoroutine(HideShotTraceAfterDelay());
    }

    private IEnumerator HideShotTraceAfterDelay()
    {
        yield return shotTraceWait;
        HideShotTrace();
        shotTraceCoroutine = null;
    }

    private void HideShotTrace()
    {
        if (shotTraceRenderer != null)
            shotTraceRenderer.enabled = false;
    }
}
```

### 3-2. 설명

플레이어 총격이 벽이나 FenceCollider 같은 비전투 오브젝트를 맞췄을 때 target이 null인 상태에서 디버그 로그가 target.EntityFaction을 참조해 NullReference가 발생하던 문제를 수정했다. 데미지 로직은 이미 null 체크가 있었으므로, 로그 출력도 target이 있을 때만 실행되도록 최소 수정했다.

### 3-3. 바뀐 스크립트 전체

```cs
using System.Collections;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using AnyPortrait;

public class PlayerWeapon : MonoBehaviour
{
    [Header("Equip Weapon")]
    [SerializeField] private WeaponItemData weaponData;                 // 무기 데이터
    [SerializeField] private Transform firePoint;                       // 발사 지점
    [SerializeField] private LayerMask hitMask;                         // 피격 대상 레이어 마스크

    [Header("Shot Trace Visual")]
    [SerializeField] private bool showShotTrace = true;                 // 궤적 보이기 여부
    [SerializeField] private LineRenderer shotTraceRenderer;            // 궤적 렌더러
    [SerializeField] private float shotTraceDuration = 0.3f;           // 궤적이 보이는 시간
    [SerializeField] private Color hitTraceColor = Color.white;         // 적중 했을 시 궤적 색상
    [SerializeField] private Color missTraceColor = Color.red;          // 적중하지 않을 시 궤적 색상

    public bool isEquipped => weaponData != null;                       // 무기 장착 여부
    public float nowUseMana => weaponData.useMana;                      // 현재 무기의 마나 사용량
    public float nowAttackPower => weaponData.AtkValue;                 // 무기의 공격력
    public float nowFireRate => weaponData.fireRate;                    // 현재 무기의 기본 발사 간격

    private GameObject currentWeaponInstance;                           // 현재 무기 인스턴스
    private Coroutine shotTraceCoroutine;                               // 궤적 출력 코루틴
    private WaitForSeconds shotTraceWait;                               // 궤적 출력 코루틴 WS

    [Header("Aim")]
    [SerializeField] private float aimOriginHeight = 1.0f;              // 1차 조준 레이를 쏠 높이
    [SerializeField] private float muzzleBackstepDistance = 0.3f;       // 총구가 벽 안에 들어갔을 때 시작점을 뒤로 물릴 거리
    [SerializeField] private float aimSuccessParallex = 0.1f;           // 1차 조준 레이가 적에게 명중 시 적 body 내부를 조준하기 위한 보정 거리

    [SerializeField] public apPortrait apPort;

    private void Awake()
    {
        weaponData = null;
        shotTraceWait = new WaitForSeconds(shotTraceDuration);
        HideShotTrace();
    }

    private void OnDisable()
    {
        if (shotTraceCoroutine != null)
        {
            StopCoroutine(shotTraceCoroutine);
            shotTraceCoroutine = null;
        }

        HideShotTrace();
    }

    public void initialize(WeaponItemData _weapon)
    {
        weaponData = _weapon;
    }

    public void PlayerAttack()
    {
        if (weaponData == null || firePoint == null)
            return;

        apPort.SetControlParamFloat("Yuan_Recoil", 1.0f);
        apPort.SetControlParamFloat("Yuan_B_Recoil", 1.0f);
        StartCoroutine(PlayRecoilAnimation(0.5f, "Yuan_Recoil"));
        StartCoroutine(PlayRecoilAnimation(0.5f, "Yuan_B_Recoil"));

        Vector3 muzzleOrigin = firePoint.position;
        Vector3 aimOrigin = transform.position + Vector3.up * aimOriginHeight;
        Vector3 aimDirection = firePoint.forward;

        // 1차: 먼저 "어디를 겨누고 있는지"를 구한다.
        Vector3 targetPoint = aimOrigin + aimDirection * weaponData.fireRange;

        if (Physics.Raycast(
            aimOrigin,
            aimDirection,
            out RaycastHit aimHit,
            weaponData.fireRange,
            hitMask,
            QueryTriggerInteraction.Ignore))
        {
            // 표면 히트 지점보다 약간 안쪽을 조준한다.
            targetPoint = aimHit.point - aimHit.normal * aimSuccessParallex;
        }

        // 2차: 총구에서 targetPoint까지 실제 발사 판정을 한다.
        Vector3 shotVector = targetPoint - muzzleOrigin;
        float shotDistance = shotVector.magnitude;

        if (shotDistance <= 0.001f)
            return;

        Vector3 shotDirection = shotVector / shotDistance;

        // 총구가 벽 안에 들어간 상황을 완화하려고 시작점을 약간 뒤로 민다.
        Vector3 safeShotOrigin = muzzleOrigin - shotDirection * muzzleBackstepDistance;
        float safeShotDistance = shotDistance + muzzleBackstepDistance;

        Vector3 endPoint = targetPoint;
        Color traceColor = missTraceColor;

        if (Physics.Raycast(
            safeShotOrigin,
            shotDirection,
            out RaycastHit shotHit,
            safeShotDistance,
            hitMask,
            QueryTriggerInteraction.Ignore))
        {
            endPoint = shotHit.point;

            IEffectReceiver target = shotHit.collider.GetComponentInParent<IEffectReceiver>();

            // 실제로 데미지를 줄 수 있는 적을 맞았을 때만 흰색으로 바꾸고 피해를 준다.
            if (target != null && target.EntityFaction != Faction.player)
            {
                traceColor = hitTraceColor;
                target.TakeDamage(weaponData.AtkValue);
            }

            // 디버그 출력
            Debug.Log($"{shotHit.collider.name}, {target}");
            if (target != null)
            {
                Debug.Log($"target faction: {target.EntityFaction}, hit? {target.EntityFaction != Faction.player}");
            }
        }

        // 1차 조준 vs 2차 히트 포인트 판정 디버그 레이
        bool aimHitSuccess = Physics.Raycast(aimOrigin, aimDirection, out aimHit, weaponData.fireRange, hitMask, QueryTriggerInteraction.Ignore);
        Debug.Log($"[AIM] hit={aimHitSuccess}, point={(aimHitSuccess ? aimHit.point.ToString() : "N/A")}, targetPoint={targetPoint}");
        Debug.DrawLine(aimOrigin, targetPoint, Color.yellow, 2f);      // 1차 조준 레이

        bool shotHitSuccess = Physics.Raycast(safeShotOrigin, shotDirection, out shotHit, safeShotDistance, hitMask, QueryTriggerInteraction.Ignore);
        Debug.Log($"[SHOT] hit={shotHitSuccess}, origin={safeShotOrigin}, dir={shotDirection}, dist={safeShotDistance}, targetPoint={targetPoint}");
        Debug.DrawLine(safeShotOrigin, safeShotOrigin + shotDirection * safeShotDistance, Color.red, 2f); // 2차 발사 레이

        // 궤적은 여전히 총구에서 시작해 보이게 한다.
        ShowShotTrace(muzzleOrigin, endPoint, traceColor);

        // 실제 오디오 재생과 별개로, AI는 이 총소리 이벤트를 통해 위치를 조사합니다.
        NoiseSystem.Emit(NoiseType.Gunshot, muzzleOrigin, gameObject);

    }

    // 리코일 애니메이션 출력
    public IEnumerator PlayRecoilAnimation(float recoilDuration, string controlParamName)
    {
        float elapsedTime = 0f;
        // 시간에 비례하여 리코일 애니메이션을 천천히 복구
        while (elapsedTime < recoilDuration)
        {
            elapsedTime += Time.deltaTime;
            float normalizedTime = Mathf.Clamp01(elapsedTime / recoilDuration);
            apPort.SetControlParamFloat(controlParamName, 1.0f - normalizedTime);
            yield return null;
        }
        apPort.SetControlParamFloat(controlParamName, 0f);
    }

    public void EquipWeapon(WeaponItemData weaponItemData)
    {
        if (weaponItemData == null)
            return;

        if (currentWeaponInstance != null)
        {
            Destroy(currentWeaponInstance);
            currentWeaponInstance = null;
        }

        weaponData = weaponItemData;

        // 무기 프리팹 주소가 비어 있을 시 실패
        //if(!weaponData.itemPrefabRef.RuntimeKeyIsValid()) return;
        // Addressble을 통해 비동기로 무기를 소환, 손 위치에 부착함
        // 2D 캐릭터를 사용하기 때문에 3D 무기 장착 코드는 사용하지 않습니다
        // Addressables.InstantiateAsync(weaponData.itemPrefabRef, handPos).Completed += OnWeaponLoaded;
    }

    private void OnWeaponLoaded(AsyncOperationHandle<GameObject> handle)
    {
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            currentWeaponInstance = handle.Result;
            currentWeaponInstance.transform.localPosition = Vector3.zero;
            currentWeaponInstance.transform.localRotation = Quaternion.identity;
        }
        else
        {
            Debug.LogError("무기 장착에 실패했습니다.");
        }
    }

    private void ShowShotTrace(Vector3 start, Vector3 end, Color traceColor)
    {
        if (!showShotTrace || shotTraceRenderer == null)
            return;

        shotTraceRenderer.positionCount = 2;
        shotTraceRenderer.SetPosition(0, start);
        shotTraceRenderer.SetPosition(1, end);
        shotTraceRenderer.startColor = traceColor;
        shotTraceRenderer.endColor = traceColor;
        shotTraceRenderer.enabled = true;

        if (shotTraceCoroutine != null)
            StopCoroutine(shotTraceCoroutine);

        shotTraceCoroutine = StartCoroutine(HideShotTraceAfterDelay());
    }

    private IEnumerator HideShotTraceAfterDelay()
    {
        yield return shotTraceWait;
        HideShotTrace();
        shotTraceCoroutine = null;
    }

    private void HideShotTrace()
    {
        if (shotTraceRenderer != null)
            shotTraceRenderer.enabled = false;
    }
}
```

## 4. Addressables 변경 설명

<code>Assets/AddressableAssetsData/AssetGroups/Default Local Group.asset</code>에는 <code>UI_Icon_Epic_FrozenClockwork</code> 아이콘 엔트리를 추가했다.

이 변경은 스크립트 코드가 아니라 Addressables 설정 에셋 변경이다. JSON 아이템 데이터에는 에픽 아티팩트 아이콘 키가 들어가 있었지만 Addressables 그룹에 해당 키가 등록되어 있지 않아 로드 실패가 발생했다. 따라서 누락된 아이콘을 Default Local Group에 등록해 런타임 로드가 가능하도록 수정했다.

## 5. 최종 정리

이번 수정은 벽을 통과하는 현상을 단순히 한 곳에서 막는 방식이 아니라, 문제가 발생하는 단계별로 방어선을 나눈 것이 핵심이다.

| 단계 | 방어 방식 |
| --- | --- |
| 이동 전 | 목적지까지 이동 가능한지 검사 |
| 이동 중 | SweepTest/SphereCast로 충돌 예상 지점 보정 |
| 공격 직전 | 벽이 있으면 데미지 적용 차단 |
| 로그 출력 | null 대상 접근 방지 |
| 리소스 로드 | Addressables 누락 키 등록 |

추가로, 이 코드가 정상적으로 작동하려면 씬의 벽 오브젝트와 벽 Collider가 <code>Wall</code> 레이어로 설정되어 있어야 한다.
{% endraw %}
