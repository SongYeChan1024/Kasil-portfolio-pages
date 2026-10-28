---
title: "2026-06-30_enemy_vision_occlusion_compare"
date: 2026-06-30 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-06-30\\_enemy\\_vision\\_occlusion\\_compare 2026-06-30 Enemy / Vision / Occlusion Compare Previous version: 7b512a6^:path for restored files, none for newly a"
description: "2026-06-30\\_enemy\\_vision\\_occlusion\\_compare 2026-06-30 Enemy / Vision / Occlusion Compare Previous version: 7b512a6^:path for restored files, none for newly a"
published: true
migration_id: "38f36532580e80a38c79fec3f9c7a1d9"
migration_status: "published"
migration_flags: []
---

{% raw %}
# 2026-06-30\_enemy\_vision\_occlusion\_compare

# 2026-06-30 Enemy / Vision / Occlusion Compare

Previous version: <code>7b512a6^:path</code> for restored files, <code>none</code> for newly added files

Current version: working tree

Output encoding: UTF-8

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

        foreach (GameObject player in GlobalRuntimeData.GetPlayerList().Values)
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

기존 <code>EnemyMovement</code>는 사실상 거리 기반으로만 타겟을 고르고 바로 추적하는 구조였기 때문에, 적이 어떤 방향을 보고 있는지와 벽 뒤에 있는 플레이어를 실제로 가려서 놓치는지까지는 반영하지 못했다. 이번 정리에서는 예전에 사용했던 시야각 기반 인식 흐름을 현재 프로젝트 구조에 맞게 다시 복원하면서, 시야 거리, 시야각, 눈높이, 공격 거리, 공격 쿨다운, 탐색 주기를 인스펙터 값으로 다시 노출했다.

또한 타겟 탐색 시 <code>GlobalRuntimeData.GetPlayerList().Values</code>를 순회하며 가장 가까운 플레이어를 찾되, 단순 거리만 보지 않고 <code>IsTargetInSight()</code>에서 수평 시야각 판정과 레이캐스트 기반 차폐 판정을 함께 통과한 대상만 인식하도록 바꿨다. 이 과정에서 공격 중복 시작 방지, <code>NavMeshAgent</code> 정지/복귀 처리, <code>VisionGizmo</code>가 읽어갈 공개 프로퍼티도 함께 정리해 적 AI 고도화와 시야 가시화가 같은 데이터 흐름을 쓰도록 맞췄다.

### Current Script

## Assets/02\_Scripts/System/VisionGizmo.cs

### Previous Script

```txt
신규 추가 스크립트로 이전 버전 없음
```

### Modified Description

<code>VisionGizmo</code>는 이번 작업에서 새로 추가된 디버그 전용 스크립트다. 기존 구조에서는 적의 실제 시야 범위를 Scene 뷰에서 직접 확인할 수 있는 도구가 없어서, 시야각을 조정해도 결과를 눈으로 검증하기 어려웠다. 이번에는 <code>EnemyMovement</code>의 시야 거리, 시야각, 눈높이, 현재 타겟 정보를 그대로 읽어와 반경 원, 전방선, 좌우 경계선, 부채꼴 호, 현재 타겟 연결선을 그리도록 구성했다.

이 스크립트를 별도 클래스로 분리해 둔 덕분에 적 AI 로직과 디버그 표시는 서로 역할이 섞이지 않으며, 디자이너나 기획자가 Scene 뷰에서 시야 범위를 조정해 볼 때도 실제 판정에 가까운 기준을 그대로 확인할 수 있게 되었다.

### Current Script

```cs
///<summary>
/// 적의 시야 범위를 Scene 뷰에서 확인하기 위한 디버그 기즈모 스크립트입니다.
/// EnemyMovement가 가진 시야 거리와 시야각 정보를 읽어와 가시화합니다.
///</summary>
using UnityEngine;

public class VisionGizmo : MonoBehaviour
{
    private enum GizmoDrawMode
    {
        SelectedOnly,   // 오브젝트를 선택했을 때만 표시
        Always          // Scene 뷰에서 항상 표시
    }

    [Header("Draw Mode")]
    [SerializeField] private GizmoDrawMode drawMode = GizmoDrawMode.SelectedOnly; // 기즈모 표시 방식

    [Header("Gizmo Option")]
    [SerializeField] private bool drawSightRadius = true;     // 시야 반경 원 표시 여부
    [SerializeField] private bool drawTargetLine = true;      // 현재 타겟까지의 선 표시 여부
    [SerializeField] private int arcSegmentCount = 24;        // 부채꼴 외곽선을 얼마나 촘촘히 그릴지 결정

    [Header("Gizmo Color")]
    [SerializeField] private Color radiusColor = Color.white;    // 시야 반경 원 색상
    [SerializeField] private Color forwardColor = Color.yellow;      // 정면 방향선 색상
    [SerializeField] private Color boundaryColor = Color.cyan;    // 좌우 시야 경계선 색상
    [SerializeField] private Color arcColor = Color.red;       // 부채꼴 외곽선 색상
    [SerializeField] private Color targetLineColor = Color.green; // 현재 타겟 연결선 색상

    private EnemyMovement enemyMovement;

    private EnemyMovement VisionSource
    {
        get
        {
            if (enemyMovement == null)
            {
                enemyMovement = GetComponent<EnemyMovement>();
            }

            return enemyMovement;
        }
    }

    private void OnDrawGizmos()
    {
        if (drawMode != GizmoDrawMode.Always)
        {
            return;
        }

        DrawVisionGizmo();
    }

    private void OnDrawGizmosSelected()
    {
        if (drawMode != GizmoDrawMode.SelectedOnly)
        {
            return;
        }

        DrawVisionGizmo();
    }

    ///<summary>
    /// 적의 현재 시야 범위를 반경, 경계선, 부채꼴 외곽선으로 그립니다.
    ///</summary>
    private void DrawVisionGizmo()
    {
        EnemyMovement source = VisionSource;
        if (source == null)
        {
            return;
        }

        Vector3 eyePosition = transform.position + Vector3.up * source.EyeHeight;

        Vector3 flatForward = transform.forward;
        flatForward.y = 0.0f;

        // 정면 벡터 길이가 0에 가까우면 기본값으로 보정합니다.
        if (flatForward.sqrMagnitude <= 0.001f)
        {
            flatForward = Vector3.forward;
        }

        flatForward.Normalize();

        float halfAngle = source.SightAngle * 0.5f;
        float sightLength = source.SightLength;

        Vector3 leftDirection = Quaternion.Euler(0.0f, -halfAngle, 0.0f) * flatForward;
        Vector3 rightDirection = Quaternion.Euler(0.0f, halfAngle, 0.0f) * flatForward;

        if (drawSightRadius)
        {
            Gizmos.color = radiusColor;
            Gizmos.DrawWireSphere(transform.position, sightLength);
        }

        Gizmos.color = forwardColor;
        Gizmos.DrawLine(eyePosition, eyePosition + flatForward * sightLength);

        Gizmos.color = boundaryColor;
        Gizmos.DrawLine(eyePosition, eyePosition + leftDirection * sightLength);
        Gizmos.DrawLine(eyePosition, eyePosition + rightDirection * sightLength);

        DrawVisionArc(eyePosition, flatForward, sightLength, source.SightAngle);

        // 플레이 중에 실제 타겟을 인식하고 있다면 타겟 연결선도 함께 그려 줍니다.
        if (drawTargetLine && Application.isPlaying && source.CurrentTarget != null)
        {
            Gizmos.color = targetLineColor;
            Gizmos.DrawLine(eyePosition, source.CurrentTarget.position + Vector3.up * source.EyeHeight);
        }
    }

    ///<summary>
    /// 시야 부채꼴의 외곽선을 여러 개의 선분으로 나누어 그립니다.
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

## Assets/02\_Scripts/Utils/FadableOccluder.cs

### Previous Script

```txt
신규 추가 스크립트로 이전 버전 없음
```

### Modified Description

<code>FadableOccluder</code>는 플레이어와 카메라 사이를 가리는 벽이나 오브젝트를 반투명 처리하기 위해 이번에 새로 추가한 스크립트다. 기존에는 가림 대상 오브젝트가 생겨도 단순히 화면을 막는 상태로 남았지만, 이번 정리에서는 렌더러를 수집하고 <code>MaterialPropertyBlock</code>으로 알파 값을 제어해, 특정 오브젝트만 자연스럽게 페이드 아웃/인 할 수 있도록 만들었다.

재질 자체를 직접 복제하거나 매 프레임 머티리얼 인스턴스를 바꾸는 방식이 아니라 <code>_BaseColor</code>와 <code>_Color</code>를 모두 다루는 속성 블록 방식을 택해, 현재 프로젝트의 URP Lit 계열과 기본 셰이더 계열 양쪽에 비교적 안정적으로 대응하도록 정리한 점이 핵심이다.

### Current Script

```cs
using UnityEngine;

public class FadableOccluder : MonoBehaviour
{
    [SerializeField] private Renderer[] renderers;

    [Range(0f, 1f)]
    [SerializeField] private float normalAlpha = 1f;

    [Range(0f, 1f)]
    [SerializeField] private float fadedAlpha = 0.25f;

    [SerializeField] private float fadeSpeed = 8f;

    private float targetAlpha;
    private float currentAlpha;

    private MaterialPropertyBlock propertyBlock;

    private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
    private static readonly int ColorId = Shader.PropertyToID("_Color");

    private void Awake()
    {
        if (renderers == null || renderers.Length == 0)
        {
            renderers = GetComponentsInChildren<Renderer>();
        }

        propertyBlock = new MaterialPropertyBlock();

        targetAlpha = normalAlpha;
        currentAlpha = normalAlpha;
    }

    private void Update()
    {
        currentAlpha = Mathf.Lerp(
            currentAlpha,
            targetAlpha,
            Time.deltaTime * fadeSpeed
        );

        ApplyAlpha(currentAlpha);
    }

    public void FadeOut()
    {
        targetAlpha = fadedAlpha;
    }

    public void FadeIn()
    {
        targetAlpha = normalAlpha;
    }

    private void ApplyAlpha(float alpha)
    {
        foreach (Renderer targetRenderer in renderers)
        {
            if (targetRenderer == null)
                continue;

            targetRenderer.GetPropertyBlock(propertyBlock);

            Color baseColor = Color.white;

            if (targetRenderer.sharedMaterial != null)
            {
                if (targetRenderer.sharedMaterial.HasProperty(BaseColorId))
                {
                    baseColor = targetRenderer.sharedMaterial.GetColor(BaseColorId);
                }
                else if (targetRenderer.sharedMaterial.HasProperty(ColorId))
                {
                    baseColor = targetRenderer.sharedMaterial.GetColor(ColorId);
                }
            }

            baseColor.a = alpha;

            // URP Lit
            propertyBlock.SetColor(BaseColorId, baseColor);

            // Built-in Standard Shader 계열 대응
            propertyBlock.SetColor(ColorId, baseColor);

            targetRenderer.SetPropertyBlock(propertyBlock);
        }
    }
}
```

## Assets/02\_Scripts/Utils/PlayerOcclusionFader.cs

### Previous Script

```txt
신규 추가 스크립트로 이전 버전 없음
```

### Modified Description

<code>PlayerOcclusionFader</code>는 카메라와 플레이어 사이에 있는 오브젝트를 감지해, <code>FadableOccluder</code>가 붙은 대상만 선별적으로 반투명 처리하는 시스템 진입점이다. 기존 구조에는 이런 흐름이 아예 없었기 때문에, 플레이어가 벽 뒤에 가리면 그대로 시야에서 사라지는 문제가 있었다.

이번 스크립트에서는 <code>LateUpdate()</code>에서 카메라 위치와 플레이어 상단 위치 사이로 <code>Physics.RaycastAll</code>을 쏘고, 현재 프레임에 가림 대상으로 잡힌 오브젝트는 <code>FadeOut()</code>, 이전 프레임에는 가렸지만 현재는 빠진 오브젝트는 <code>FadeIn()</code>하도록 정리했다. 이를 통해 여러 오클루더가 동시에 걸리는 상황도 <code>HashSet</code> 기반으로 중복 없이 안정적으로 관리할 수 있게 되었다.

### Current Script

```cs
using System.Collections.Generic;
using UnityEngine;

public class PlayerOcclusionFader : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private Transform player;
    [SerializeField] private Camera mainCamera;

    [Header("Detection")]
    [SerializeField] private LayerMask occluderLayer;
    [SerializeField] private float playerHeightOffset = 1.0f;

    private readonly HashSet<FadableOccluder> currentOccluders = new HashSet<FadableOccluder>();
    private readonly HashSet<FadableOccluder> previousOccluders = new HashSet<FadableOccluder>();

    private void LateUpdate()
    {
        if (player == null || mainCamera == null)
            return;

        previousOccluders.Clear();

        foreach (FadableOccluder occluder in currentOccluders)
        {
            previousOccluders.Add(occluder);
        }

        currentOccluders.Clear();

        Vector3 cameraPosition = mainCamera.transform.position;
        Vector3 playerTargetPosition = player.position + Vector3.up * playerHeightOffset;

        Vector3 direction = playerTargetPosition - cameraPosition;
        float distance = direction.magnitude;

        RaycastHit[] hits = Physics.RaycastAll(
            cameraPosition,
            direction.normalized,
            distance,
            occluderLayer
        );

        foreach (RaycastHit hit in hits)
        {
            FadableOccluder occluder = hit.collider.GetComponentInParent<FadableOccluder>();

            if (occluder == null)
                continue;

            currentOccluders.Add(occluder);
            occluder.FadeOut();
        }

        foreach (FadableOccluder occluder in previousOccluders)
        {
            if (!currentOccluders.Contains(occluder))
            {
                occluder.FadeIn();
            }
        }
    }
}
```
{% endraw %}
