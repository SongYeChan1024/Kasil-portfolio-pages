---
title: "2026-06-26_enemy_vision_compare"
date: 2026-06-26 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-06-26 Enemy Vision Compare Previous version: 23ab6ad:path Current version: working tree Output encoding: UTF-8 Assets/02\\_Scripts/System/Enemy/EnemyMovemen"
description: "2026-06-26 Enemy Vision Compare Previous version: 23ab6ad:path Current version: working tree Output encoding: UTF-8 Assets/02\\_Scripts/System/Enemy/EnemyMovemen"
published: false
migration_id: "38b36532580e80b3b5d5fe24037cd279"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
# 2026-06-26 Enemy Vision Compare

Previous version: <code>23ab6ad:path</code><br />Current version: working tree<br />Output encoding: UTF-8

## Assets/02\_Scripts/System/Enemy/EnemyMovement.cs

### Previous Script

```cs
///<summary>
/// 적의 움직임과 상태에 따른 애니메이션을 관리하는 스크립트
///</summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

public class EnemyMovement : MonoBehaviour
{
    [Header("Enemy Movement Controll")]
    [SerializeField] private float moveSpeed;                       // 이동 속도
    private float sightLength;                                      // 시야 거리
    private float sightAngle;                                       // 시야 각도

    /// 플레이어 위치 추적 계산 및 이를 최적화 하기 위한 변수 입니다 ///
    private Transform targetPlayer;                                 // 추적하는 플레이어
    private float sightLengthSqr;                                   // 시야 거리의 제곱 값
    private WaitForSeconds checkingTime = new WaitForSeconds(0.2f); // 상태 확인 주기 시간

    [Header("Enemy Attack")]
    private float attackLength;                                     // 공격 사거리
    private float attackLengthSqr;                                  // 공격 사거리의 제곱 값
    private float attackCooldown;                                   // 공격 쿨타임

    [Header("Enemy Animation Controll")]
    private Animator animator;

    [Header("Componemt")]
    private EnemyStatus myStatus;
    private NavMeshAgent navAgent;

    void Awake()
    {
        animator = GetComponent<Animator>();
        navAgent = GetComponent<NavMeshAgent>();
        myStatus = GetComponent<EnemyStatus>();

        // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
        if(animator==null || myStatus==null)
        {
            this.enabled = false;
            Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 플레이어 추적 및 거리계산 관련 값 지정
        targetPlayer = null;
        sightLength = 7;
        sightLengthSqr = sightLength * sightLength;
        attackLength = 3;
        attackLengthSqr = attackLength * attackLength;
        attackCooldown = 2.0f;

        moveSpeed = 3;
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        myStatus.OnLocalDeath += Die;
        StartCoroutine(CheckRoutine());
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        myStatus.OnLocalDeath -= Die;
    }

    /* 현재 상태 확인 */
    private IEnumerator CheckRoutine()
    {
        while(myStatus.nowState != EnemyStatus.EnemyState.Dead)
        {
            UpdateTarget();
            ChaseTarget();
            yield return checkingTime;
        }
    }

    /* 현재 플레이어들의 위치와 자신의 위치를 계산하고 인식 범위 내에 있는지 확인합니다 */
    private void UpdateTarget()
    {
        // 가장 가까운 타겟의 (제곱된)위치를 저장하여 누가 더 가까운지 판정합니다
        float moreCloser = sightLengthSqr;
        Transform bestTarget = null;

        // 현재 존재하는 모든 플레이어들 중 적에게 가장 가까운 대상을 추적합니다
        foreach(GameObject player in GlobalRuntimeData.ActivePlayers)
        {
            if(player==null) continue;

            // 나(적)과 상대(플레이어) 사이의 거리 제곱을 계산하여 시야반경 내에 있는지 확인
            float sqrDist = (transform.position - player.transform.position).sqrMagnitude;
            if(sqrDist > sightLengthSqr) continue;

            if(sqrDist<moreCloser)
            {
                moreCloser = sqrDist;
                bestTarget = player.transform;
            }
        }
        // 가장 가까운 사람을 타겟으로 지정합니다
        targetPlayer = bestTarget;
    }

    /* 거리 계산을 통한 추적 및 공격 상태 지정 */
    private void ChaseTarget()
    {
        if(targetPlayer==null)
        {
            myStatus.SetNowState(EnemyStatus.EnemyState.Idle);
            animator.SetBool("isWalk", false);
            targetPlayer = null;
            navAgent.ResetPath();
            return;
        }

        // 적과 플레이어 사이 거리 계산
        float sqrDistToTarget = (transform.position - targetPlayer.position).sqrMagnitude;
        // 공격 사거리 안에 있을 경우 공격
        if(attackLengthSqr >= sqrDistToTarget)
        {
            StartCoroutine(Attack());
        }
        // 공격 사거리 밖이지만 시야 안에 있을 경우 추적
        else if(sqrDistToTarget <= sightLengthSqr)
        {
            navAgent.SetDestination(targetPlayer.position);
            myStatus.SetNowState(EnemyStatus.EnemyState.Chase);
            animator.SetBool("isWalk", true);
        }
    }

    public void Die()
    {
        StopAllCoroutines();
        animator.SetTrigger("isDead");
        Destroy(gameObject, 3.0f);
    }

    private IEnumerator Attack()
    {
        // 공격 상태 돌입 및 이동 정지
        myStatus.SetNowState(EnemyStatus.EnemyState.Attack);
        myStatus.SetIsAttacking(true);

        navAgent.isStopped = true;          // 적 이동 정지
        navAgent.velocity = Vector3.zero;   // 관성에 의한 이동 방지

        // 플레이어 방향으로 몸체 회전
        transform.LookAt(new Vector3(targetPlayer.position.x, transform.position.y, targetPlayer.position.z));

        // 애니메이션 실행
        animator.SetTrigger("isAttack");

        // 공격 수행 및 공격 쿨타임만큼 대기
        yield return new WaitForSeconds(attackCooldown);

        // 공격 수행 후 다음 행동 실행
        myStatus.SetIsAttacking(false);
        navAgent.isStopped = false;
    }

    public void isPlayerTakeDamage()
    {
        // 공격 중 플레이어가 범위를 벗어났을 경우 피격당하지 않음
        if(targetPlayer==null) return;
        float sqrDistToTarget = (transform.position - targetPlayer.position).sqrMagnitude;

        // 공격 성공 여부 판정 시 타겟이 범위 내에 있을 경우
        if(attackLengthSqr >= sqrDistToTarget)
        {
            targetPlayer.GetComponentInParent<IDamageable>().TakeDamage(myStatus.atkValue);
        }
    }
}
```

### Modified Description

기존 <code>EnemyMovement</code>는 적의 감지 범위를 단순 원형 반경으로만 처리하고 있었다. 즉 플레이어가 적과 충분히 가까우면 방향과 상관없이 바로 인식했고, 벽이나 장애물 뒤에 있어도 거리만 맞으면 추적 대상으로 잡힐 수 있는 구조였다.

현재 구조에서는 시야 판정을 <code>거리 + 전방 시야각 + 벽 가림</code> 순서로 처리하도록 바꾸었다. 먼저 기존처럼 거리 제곱값으로 1차 필터를 거친 뒤, <code>IsTargetInSight()</code>를 통해 적의 정면 방향을 기준으로 플레이어가 부채꼴 시야각 안에 있는지 확인하게 했다. 이후 <code>Physics.Raycast</code>를 이용해 플레이어보다 먼저 벽이나 다른 오브젝트를 맞는 경우 인식하지 않도록 시야 차단 판정도 추가했다.

또한 추적과 공격 상태 전환을 조금 더 안정적으로 다듬었다. 공격 중복 실행을 막기 위해 <code>isAttacking</code> 상태를 먼저 확인하도록 했고, 공격 후에는 <code>NavMeshAgent</code>가 다시 추적 상태로 자연스럽게 이어질 수 있도록 <code>isStopped</code>와 <code>ResetPath()</code> 흐름을 정리했다. 여기에 <code>VisionGizmo</code>가 같은 데이터를 읽어갈 수 있도록 <code>SightLength</code>, <code>SightAngle</code>, <code>EyeHeight</code>, <code>CurrentTarget</code> 프로퍼티도 추가했다.

### Current Script

```cs
///<summary>
/// 적의 이동과 상태에 따른 애니메이션을 관리하는 스크립트
/// 거리 기반 탐지에 더해, 적이 바라보는 방향 기준의 부채꼴 시야 판정을 사용합니다.
///</summary>
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

public class EnemyMovement : MonoBehaviour
{
    [Header("Enemy Movement Controll")]
    [SerializeField] private float moveSpeed = 3.0f;              // 이동 속도
    [SerializeField] private float sightLength = 7.0f;            // 시야 거리
    [SerializeField] private float sightAngle = 120.0f;           // 시야 전체 각도
    [SerializeField] private float eyeHeight = 1.4f;              // 시야 판정 시작 높이

    // 플레이어 탐지 계산용 캐시값
    private Transform targetPlayer;                               // 현재 추적 중인 플레이어
    private float sightLengthSqr;                                 // 시야 거리의 제곱값
    private float halfSightAngle;                                 // 시야 반각
    private WaitForSeconds checkingTime = new WaitForSeconds(0.2f); // 상태 확인 주기

    [Header("Enemy Attack")]
    private float attackLength;                                   // 공격 거리
    private float attackLengthSqr;                                // 공격 거리의 제곱값
    private float attackCooldown;                                 // 공격 쿨타임

    [Header("Enemy Animation Controll")]
    private Animator animator;

    [Header("Componemt")]
    private EnemyStatus myStatus;
    private NavMeshAgent navAgent;

    // VisionGizmo가 읽어갈 시야 정보입니다.
    public float SightLength => sightLength;          // 시야 거리
    public float SightAngle => sightAngle;            // 시야 전체 각도
    public float EyeHeight => eyeHeight;              // 시야 판정 시작 높이
    public Transform CurrentTarget => targetPlayer;   // 현재 인식 중인 타겟

    void Awake()
    {
        animator = GetComponent<Animator>();
        navAgent = GetComponent<NavMeshAgent>();
        myStatus = GetComponent<EnemyStatus>();

        // 필수 컴포넌트가 하나라도 없으면 동작할 수 없다.
        if (animator == null || myStatus == null || navAgent == null)
        {
            enabled = false;
            Debug.LogError("EnemyMovement: 필요한 컴포넌트가 없습니다.");
            return;
        }

        targetPlayer = null;
        sightLengthSqr = sightLength * sightLength;
        halfSightAngle = sightAngle * 0.5f;

        attackLength = 3.0f;
        attackLengthSqr = attackLength * attackLength;
        attackCooldown = 2.0f;

        // NavMeshAgent가 인스펙터 속도값을 실제 이동에 사용하도록 맞춘다.
        navAgent.speed = moveSpeed;
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        myStatus.OnLocalDeath += Die;
        StartCoroutine(CheckRoutine());
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        myStatus.OnLocalDeath -= Die;
    }

    /* 현재 상태를 주기적으로 점검 */
    private IEnumerator CheckRoutine()
    {
        while (myStatus.nowState != EnemyStatus.EnemyState.Dead)
        {
            UpdateTarget();
            ChaseTarget();
            yield return checkingTime;
        }
    }

    /* 시야 거리와 시야각, 벽 가림 조건을 모두 통과한 가장 가까운 플레이어를 추적 대상으로 지정 */
    private void UpdateTarget()
    {
        float moreCloser = sightLengthSqr;
        Transform bestTarget = null;

        foreach (GameObject player in GlobalRuntimeData.ActivePlayers)
        {
            if (player == null)
                continue;

            // 1차로 거리 안에 들어왔는지 확인한다.
            float sqrDist = (transform.position - player.transform.position).sqrMagnitude;
            if (sqrDist > sightLengthSqr)
                continue;

            // 거리 안에 있어도 시야각 밖이거나 벽에 가려져 있으면 인식하지 않는다.
            if (!IsTargetInSight(player.transform))
                continue;

            if (sqrDist < moreCloser)
            {
                moreCloser = sqrDist;
                bestTarget = player.transform;
            }
        }

        targetPlayer = bestTarget;
    }

    /* 대상이 적의 전방 부채꼴 시야 안에 있고, 벽에 가려져 있지 않은지 확인 */
    private bool IsTargetInSight(Transform target)
    {
        if (target == null)
            return false;

        // 수평 기준 시야각 판정을 위해 y값을 제거한 방향을 만든다.
        Vector3 flatForward = transform.forward;
        flatForward.y = 0.0f;

        Vector3 flatDirectionToTarget = target.position - transform.position;
        flatDirectionToTarget.y = 0.0f;

        // 거의 같은 위치라면 각도 계산 없이 시야 안으로 본다.
        if (flatDirectionToTarget.sqrMagnitude <= 0.001f)
            return true;

        // 적의 정면 기준으로 시야 반각 안에 들어왔는지 확인한다.
        float angleToTarget = Vector3.Angle(flatForward.normalized, flatDirectionToTarget.normalized);
        if (angleToTarget > halfSightAngle)
            return false;

        // 이제 실제로 벽에 가려져 있는지 레이캐스트로 확인한다.
        Vector3 eyePosition = transform.position + Vector3.up * eyeHeight;
        Vector3 targetPosition = target.position + Vector3.up * eyeHeight;
        Vector3 directionToTarget = targetPosition - eyePosition;

        float targetDistance = directionToTarget.magnitude;
        if (targetDistance <= 0.001f)
            return true;

        // 플레이어보다 먼저 다른 콜라이더를 맞으면 시야가 막힌 것으로 본다.
        if (Physics.Raycast(eyePosition, directionToTarget.normalized, out RaycastHit hit, targetDistance, ~0, QueryTriggerInteraction.Ignore))
        {
            // 첫 번째로 맞은 대상이 플레이어 본체 또는 플레이어 자식 오브젝트면 정상 인식이다.
            if (hit.transform == target || hit.transform.IsChildOf(target))
                return true;

            // 플레이어보다 먼저 벽이나 다른 오브젝트를 맞았으면 인식 실패다.
            return false;
        }

        return false;
    }

    /* 거리 계산을 통한 추적 및 공격 상태 지정 */
    private void ChaseTarget()
    {
        if (targetPlayer == null)
        {
            myStatus.SetNowState(EnemyStatus.EnemyState.Idle);
            myStatus.SetIsAttacking(false);
            animator.SetBool("isWalk", false);
            targetPlayer = null;
            navAgent.isStopped = false;
            navAgent.ResetPath();
            return;
        }

        float sqrDistToTarget = (transform.position - targetPlayer.position).sqrMagnitude;

        // 이미 공격 중이면 공격 코루틴이 끝날 때까지 중복 실행하지 않는다.
        if (myStatus.isAttacking)
            return;

        // 공격 거리 안에 있으면 공격 상태로 전환한다.
        if (attackLengthSqr >= sqrDistToTarget)
        {
            animator.SetBool("isWalk", false);
            StartCoroutine(Attack());
        }
        // 공격 거리는 아니지만 시야 거리 안이면 추적한다.
        else if (sqrDistToTarget <= sightLengthSqr)
        {
            navAgent.isStopped = false;
            navAgent.SetDestination(targetPlayer.position);
            myStatus.SetNowState(EnemyStatus.EnemyState.Chase);
            animator.SetBool("isWalk", true);
        }
    }

    public void Die()
    {
        StopAllCoroutines();
        animator.SetTrigger("isDead");
        Destroy(gameObject, 3.0f);
    }

    private IEnumerator Attack()
    {
        // 공격 시작 시 타겟이 사라졌으면 공격을 취소한다.
        if (targetPlayer == null)
            yield break;

        // 공격 상태 진입 및 이동 정지
        myStatus.SetNowState(EnemyStatus.EnemyState.Attack);
        myStatus.SetIsAttacking(true);

        navAgent.isStopped = true;
        navAgent.velocity = Vector3.zero;
        navAgent.ResetPath();

        // 플레이어 방향으로 몸을 돌린다.
        transform.LookAt(new Vector3(targetPlayer.position.x, transform.position.y, targetPlayer.position.z));

        animator.SetTrigger("isAttack");

        // 공격 실행 후 쿨타임만큼 대기
        yield return new WaitForSeconds(attackCooldown);

        myStatus.SetIsAttacking(false);
        navAgent.isStopped = false;
    }

    public void isPlayerTakeDamage()
    {
        // 공격 중 플레이어가 범위를 벗어났으면 피해를 주지 않는다.
        if (targetPlayer == null)
            return;

        float sqrDistToTarget = (transform.position - targetPlayer.position).sqrMagnitude;

        if (attackLengthSqr >= sqrDistToTarget)
        {
            targetPlayer.GetComponentInParent<IDamageable>().TakeDamage(myStatus.atkValue);
        }
    }
}
```

## Assets/02\_Scripts/System/VisionGizmo.cs

### Previous Script

```txt
신규 추가 스크립트로 이전 버전 없음
```

### Modified Description

<code>VisionGizmo</code>는 이번 작업에서 새로 추가된 디버그 전용 스크립트다. 적 모델이 평면 기반이라 실제 정면 방향과 시야 범위를 게임씬 밖에서 확인하기 어려운 문제를 해결하기 위해 만들었다. 이 스크립트는 <code>EnemyMovement</code>가 가진 시야 거리, 시야각, 눈높이, 현재 타겟 데이터를 읽어와서 Scene 뷰에 시야 반경, 정면 방향, 좌우 시야 경계, 부채꼴 외곽선, 타겟 연결선을 그린다.

처음에는 선택된 오브젝트만 보이게 하려 했지만, 테스트 중에는 모든 적의 시야를 동시에 보고 싶을 수 있어서 <code>SelectedOnly</code>와 <code>Always</code> 두 가지 표시 방식을 인스펙터에서 선택할 수 있게 정리했다. 즉 이 스크립트는 실제 적 AI 동작을 바꾸지 않고, 현재 적 시야 구조를 에디터에서 안전하게 시각화하는 역할만 담당한다.

### Current Script

```cs
///<summary>
/// 시야 범위를 Scene 뷰에서 확인하기 위한 디버그용 기즈모 스크립트
/// 현재는 EnemyMovement의 시야 데이터를 읽어서 표시합니다.
///</summary>
using UnityEngine;

public class VisionGizmo : MonoBehaviour
{
    private enum GizmoDrawMode
    {
        SelectedOnly,   // 오브젝트를 선택했을 때만 표시
        Always          // 항상 표시
    }

    [Header("Draw Mode")]
    [SerializeField] private GizmoDrawMode drawMode = GizmoDrawMode.SelectedOnly; // 기즈모 표시 방식

    [Header("Gizmo Option")]
    [SerializeField] private bool drawSightRadius = true;     // 시야 반경 원 표시 여부
    [SerializeField] private bool drawTargetLine = true;      // 현재 타겟까지 선 표시 여부
    [SerializeField] private int arcSegmentCount = 24;        // 부채꼴 곡선을 몇 개 선분으로 나눌지

    [Header("Gizmo Color")]
    [SerializeField] private Color radiusColor = Color.yellow;    // 시야 반경 색
    [SerializeField] private Color forwardColor = Color.red;      // 정면 방향 색
    [SerializeField] private Color boundaryColor = Color.cyan;    // 시야 좌우 경계선 색
    [SerializeField] private Color arcColor = Color.yellow;       // 부채꼴 외곽선 색
    [SerializeField] private Color targetLineColor = Color.green; // 현재 타겟 연결선 색

    private EnemyMovement enemyMovement; // 같은 오브젝트의 EnemyMovement 참조

    private EnemyMovement VisionSource
    {
        get
        {
            if (enemyMovement == null)
                enemyMovement = GetComponent<EnemyMovement>();

            return enemyMovement;
        }
    }

    private void OnDrawGizmos()
    {
        if (drawMode != GizmoDrawMode.Always)
            return;

        DrawVisionGizmo();
    }

    private void OnDrawGizmosSelected()
    {
        if (drawMode != GizmoDrawMode.SelectedOnly)
            return;

        DrawVisionGizmo();
    }

    ///<summary>
    /// 현재 설정된 시야 정보를 기준으로 기즈모를 그립니다.
    ///</summary>
    private void DrawVisionGizmo()
    {
        EnemyMovement source = VisionSource;
        if (source == null)
            return;

        // 시야 판정을 시작하는 눈높이 위치
        Vector3 eyePosition = transform.position + Vector3.up * source.EyeHeight;

        // 정면 방향을 수평 기준으로 정리
        Vector3 flatForward = transform.forward;
        flatForward.y = 0.0f;

        // 정면 방향이 거의 0이면 기본 전방값 사용
        if (flatForward.sqrMagnitude <= 0.001f)
            flatForward = Vector3.forward;

        flatForward.Normalize();

        float halfAngle = source.SightAngle * 0.5f;
        float sightLength = source.SightLength;

        // 좌우 시야 경계 방향 계산
        Vector3 leftDirection = Quaternion.Euler(0.0f, -halfAngle, 0.0f) * flatForward;
        Vector3 rightDirection = Quaternion.Euler(0.0f, halfAngle, 0.0f) * flatForward;

        // 시야 반경 원 표시
        if (drawSightRadius)
        {
            Gizmos.color = radiusColor;
            Gizmos.DrawWireSphere(transform.position, sightLength);
        }

        // 정면 방향 표시
        Gizmos.color = forwardColor;
        Gizmos.DrawLine(eyePosition, eyePosition + flatForward * sightLength);

        // 좌우 시야 경계선 표시
        Gizmos.color = boundaryColor;
        Gizmos.DrawLine(eyePosition, eyePosition + leftDirection * sightLength);
        Gizmos.DrawLine(eyePosition, eyePosition + rightDirection * sightLength);

        // 부채꼴 외곽선 표시
        DrawVisionArc(eyePosition, flatForward, sightLength, source.SightAngle);

        // 플레이 중 현재 타겟을 인식하고 있으면 타겟까지 선 표시
        if (drawTargetLine && Application.isPlaying && source.CurrentTarget != null)
        {
            Gizmos.color = targetLineColor;
            Gizmos.DrawLine(eyePosition, source.CurrentTarget.position + Vector3.up * source.EyeHeight);
        }
    }

    ///<summary>
    /// 부채꼴 외곽선을 여러 개의 선분으로 나누어 그립니다.
    ///</summary>
    private void DrawVisionArc(Vector3 origin, Vector3 forward, float radius, float angle)
    {
        int segmentCount = Mathf.Max(3, arcSegmentCount);
        float startAngle = -angle * 0.5f;
        float endAngle = angle * 0.5f;

        Gizmos.color = arcColor;

        Vector3 previousPoint = origin + (Quaternion.Euler(0.0f, startAngle, 0.0f) * forward) * radius;

        for (int i = 1; i <= segmentCount; i++)
        {
            float t = (float)i / segmentCount;
            float currentAngle = Mathf.Lerp(startAngle, endAngle, t);

            Vector3 currentPoint = origin + (Quaternion.Euler(0.0f, currentAngle, 0.0f) * forward) * radius;

            Gizmos.DrawLine(previousPoint, currentPoint);
            previousPoint = currentPoint;
        }
    }
}
```
{% endraw %}
