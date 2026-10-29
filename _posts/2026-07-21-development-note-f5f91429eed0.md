---
title: "2026-07-21_EnemyMovement_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyMovement.cs cs using System; using System.Collections; using UnityEngine; using UnityEngine.AI"
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyMovement.cs cs using System; using System.Collections; using UnityEngine; using UnityEngine.AI"
published: true
migration_id: "3a436532580e812d982ef5f91429eed0"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyMovement.cs</code>

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
    private BoxCollider boxCollider;                                                      // 충돌 판정 콜라이더

    [SerializeField] private int[] dissolve_AudioIDPool;                                  // 사망 사운드 ID 풀

    public float SightLength => perception.SightRange;
```

```cs
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
    boxCollider = GetComponentInChildren<BoxCollider>();

    if (navAgent == null || myStatus == null || boxCollider == null)
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
    memory.SetOwner(transform);
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

```

```cs
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
```

```cs
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

```

```cs
    memory.ClearTargetTracking();
    memory.ClearChasePlan();
    
    combat.ClearRuntimeState();
    OnDeathEvent?.Invoke();

    navAgent.enabled = false;
    boxCollider.enabled = false;

    // 사운드 재생 이벤트를 AudioManager에 전달하여 사망 지점에서 3D 오디오 재생
    int dieAudioID = dissolve_AudioIDPool[UnityEngine.Random.Range(0, dissolve_AudioIDPool.Length)];
    GlobalEventBus.OnPlay3DSoundRequested?.Invoke(dieAudioID, gameObject.transform.position);

    Destroy(gameObject, 0.0f);
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

    Transform swingOrigin = attackOrigin != null ? attackOrigin : transform;
    string slashVfxId = swingIndex == 0
        ? GameplayVFXIds.EnemySlash01
        : GameplayVFXIds.EnemySlash02;
    VFXService.Instance?.Play(slashVfxId, swingOrigin.position, transform.rotation);

    StartCoroutine(combat.ExecuteSwing(
        transform,
        brain.CurrentTarget,
        swingOrigin,
```

```cs
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
```

```cs
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
```

```cs
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
```

```cs
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

## 2. 변경 설명

개체 로컬 피해 이벤트를 받아 피격 반응을 조정하는 중심 로직을 추가했습니다. 일반 행동 중에는 NavMeshAgent와 AI 목적지 갱신을 잠시 보류하고, 공격 중에는 공격 상태·콤보·돌진을 유지한 채 애니메이션 히트 스톱만 요청합니다. 연속 경직 쿨다운과 비활성화 복구를 포함하며, 피격 시 가장 가까운 유효 플레이어를 전투 타깃으로 전달합니다. 개체 고유값 기반으로 <code>avoidancePriority</code>를 분산해 같은 우선순위로 밀집하는 현상도 완화합니다. 코드 기본값과 별도로 다크 스피릿 프리팹에는 실제 경직·히트 스톱 수치가 직렬화되어 있습니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyMovement.cs</code>

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

    [Header("Hit Feedback")]
    [SerializeField] private bool enableHitStagger = false;                               // 이 프리팹에서 피격 미세 경직을 사용할지 여부
    [SerializeField, Min(0.01f)] private float hitStaggerDuration = 0.08f;                 // 일반 행동 중 피격 경직 시간
    [SerializeField, Min(0.01f)] private float attackHitStopDuration = 0.04f;              // 공격을 끊지 않고 애니메이션만 잠그는 시간
    [SerializeField, Min(0.0f)] private float hitStaggerCooldown = 0.25f;                  // 연속 피격으로 무한 경직되는 것을 막는 재적용 간격
```

```cs
[SerializeField] private bool recognizePlayerOnHit = false;                           // 피격 시 가장 가까운 유효 플레이어를 전투 타겟으로 즉시 등록할지 여부

[Header("Crowd Avoidance")]
[SerializeField] private bool varyAvoidancePriority = false;                          // 스폰 개체마다 회피 우선순위를 분산할지 여부
[SerializeField, Range(0, 99)] private int avoidancePriorityMin = 40;                  // 런타임 회피 우선순위 최솟값
[SerializeField, Range(0, 99)] private int avoidancePriorityMax = 60;                  // 런타임 회피 우선순위 최댓값

[Header("Required Components")]
private EnemyStatus myStatus;                                                         // 상태/스탯 컴포넌트
private NavMeshAgent navAgent;                                                        // 이동용 NavMeshAgent
private Coroutine aiRoutine;                                                          // AI 판단 루프 코루틴 핸들
private BoxCollider boxCollider;                                                      // 충돌 판정 콜라이더
private Coroutine hitStaggerRoutine;                                                  // 이동 경직 코루틴 핸들
private bool isMovementHitStaggered;                                                  // 현재 이동과 AI 목적지 갱신을 보류 중인지 여부
private bool wasAgentStoppedBeforeHitStagger;                                         // 경직 전 NavMeshAgent 정지 상태
private float nextHitStaggerAllowedTime;                                              // 다음 경직을 허용할 비스케일 시간

[SerializeField] private int[] dissolve_AudioIDPool;                                  // 사망 사운드 ID 풀

public float SightLength => perception.SightRange;
public float AwarenessRange => perception.AwarenessRange;
public float HearingRange => perception.HearingRange;
public float SightAngle => perception.SightAngle;
```

```cs
public float EyeHeight => perception.EyeHeight;
public Transform CurrentTarget => brain.CurrentTarget;

public event Action<bool> OnWalkEvent;                                                // 걷기 애니메이션 갱신 이벤트
public event Action OnAttackEvent;                                                    // 공격 애니메이션 시작 이벤트
public event Action OnDeathEvent;                                                     // 사망 애니메이션 시작 이벤트
public event Action<int, int> OnLookDirEvent;                                         // 방향 애니메이션 갱신 이벤트
public event Action<float> OnHitStopEvent;                                            // 애니메이터에 전달할 피격 정지 시간

private void Awake()
{
    EnsureModules();

    navAgent = GetComponent<NavMeshAgent>();
    myStatus = GetComponent<EnemyStatus>();
    boxCollider = GetComponentInChildren<BoxCollider>();

    if (navAgent == null || myStatus == null || boxCollider == null)
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
    memory.SetOwner(transform);
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
    hitStaggerDuration = Mathf.Max(0.01f, hitStaggerDuration);
```

```cs
    attackHitStopDuration = Mathf.Clamp(attackHitStopDuration, 0.01f, hitStaggerDuration);
    hitStaggerCooldown = Mathf.Max(0.0f, hitStaggerCooldown);
    avoidancePriorityMin = Mathf.Clamp(avoidancePriorityMin, 0, 99);
    avoidancePriorityMax = Mathf.Clamp(avoidancePriorityMax, avoidancePriorityMin, 99);

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
    myStatus.OnLocalDamaged += HandleLocalDamaged;
    myStatus.OnAggroApplied += HandleAggroApplied;
    GlobalEventBus.OnNoiseEmitted += HandleNoiseEmitted;
    nextHitStaggerAllowedTime = 0.0f;
}

private void Start()
{
    if (myStatus == null)
    {
        return;
    }

    ApplyAvoidancePriorityVariation();

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
    CancelHitStagger();

    if (myStatus == null)
    {
        return;
    }

    myStatus.OnLocalDeath -= Die;
    myStatus.OnLocalDamaged -= HandleLocalDamaged;
    myStatus.OnAggroApplied -= HandleAggroApplied;
```

```cs
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
/// 피해가 확정되면 짧은 애니메이션 히트 스톱을 요청합니다.
/// 일반 행동 중에는 이동도 잠시 멈추지만, 공격 중에는 공격 상태와 콤보 코루틴을 유지합니다.
/// </summary>
private void HandleLocalDamaged()
{
    TryRecognizePlayerOnHit();

    if (!enableHitStagger ||
        myStatus == null ||
        myStatus.nowState == EnemyStatus.EnemyState.Dead ||
        Time.unscaledTime < nextHitStaggerAllowedTime)
    {
        return;
    }

    nextHitStaggerAllowedTime = Time.unscaledTime + hitStaggerCooldown;

    bool isAttacking = myStatus.isAttacking;
    OnHitStopEvent?.Invoke(isAttacking ? attackHitStopDuration : hitStaggerDuration);

    // 공격 중에는 애니메이션만 0.04초 멈추고 공격 판정과 돌진 흐름은 그대로 이어갑니다.
    if (isAttacking || navAgent == null || !navAgent.enabled || !navAgent.isOnNavMesh)
    {
        return;
    }

    if (hitStaggerRoutine != null)
    {
        StopCoroutine(hitStaggerRoutine);
        RestoreHitStaggerState();
    }

    hitStaggerRoutine = StartCoroutine(PlayHitStagger());
}

/// <summary>
/// 경직 시간 동안 NavMeshAgent 이동과 AI 목적지 갱신만 보류합니다.
/// 추적 타겟, 어그로, 순찰/복귀 상태는 변경하지 않아 종료 후 기존 행동을 그대로 이어갑니다.
/// </summary>
private IEnumerator PlayHitStagger()
{
    wasAgentStoppedBeforeHitStagger = navAgent.isStopped;
    isMovementHitStaggered = true;
    navAgent.isStopped = true;
    RaiseWalkEvent(false);

    float elapsed = 0.0f;
```

```cs
    while (elapsed < hitStaggerDuration &&
           myStatus != null &&
           myStatus.nowState != EnemyStatus.EnemyState.Dead)
    {
        elapsed += Time.unscaledDeltaTime;
        yield return null;
    }

    RestoreHitStaggerState();
    hitStaggerRoutine = null;
}

/// <summary>
/// 오브젝트 비활성화나 재사용 전에 남아 있는 이동 경직 상태를 안전하게 정리합니다.
/// </summary>
private void CancelHitStagger()
{
    if (hitStaggerRoutine != null)
    {
        StopCoroutine(hitStaggerRoutine);
        hitStaggerRoutine = null;
    }

    RestoreHitStaggerState();
}

private void RestoreHitStaggerState()
{
    if (!isMovementHitStaggered)
    {
        return;
    }

    isMovementHitStaggered = false;

    if (navAgent != null && navAgent.enabled && navAgent.isOnNavMesh)
    {
        navAgent.isStopped = wasAgentStoppedBeforeHitStagger;
    }
}

/// <summary>
/// 피해 이벤트에는 공격자 정보가 없으므로 현재 유효한 플레이어 중 가장 가까운 대상을 찾습니다.
/// 디코이 이동 타겟은 건드리지 않고 전투 타겟만 등록해 디코이 종료 후 플레이어 추적이 이어지게 합니다.
/// </summary>
private void TryRecognizePlayerOnHit()
{
    if (!recognizePlayerOnHit || brain == null || myStatus == null ||
        myStatus.nowState == EnemyStatus.EnemyState.Dead)
    {
        return;
    }

    var players = GlobalRuntimeData.GetPlayerList();
    if (players == null || players.Count == 0)
    {
        return;
    }

    Transform nearestPlayer = null;
    float nearestSqrDistance = float.PositiveInfinity;

    foreach (GameObject player in players.Values)
    {
        if (player == null || !EnemyPerception.IsTargetAvailable(player.transform))
        {
```

```cs
            continue;
        }

        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(transform.position, player.transform.position);
        if (sqrDistance >= nearestSqrDistance)
        {
            continue;
        }

        nearestSqrDistance = sqrDistance;
        nearestPlayer = player.transform;
    }

    if (nearestPlayer == null)
    {
        return;
    }

    bool acquiredTarget = brain.TryAcquireCombatTargetFromDamage(
        transform,
        nearestPlayer,
        memory,
        noiseListener);

    // 공격 코루틴은 유지하고, 비공격 상태에서만 추적 상태 표시를 즉시 갱신합니다.
    if (acquiredTarget && !myStatus.isAttacking)
    {
        myStatus.SetNowState(EnemyStatus.EnemyState.Chase);
    }
}

/// <summary>
/// 런타임 고유 번호를 기준으로 회피 우선순위를 분산합니다.
/// 전역 랜덤값을 사용하지 않아 재생 순서와 무관하게 각 개체가 안정적인 값을 유지합니다.
/// </summary>
private void ApplyAvoidancePriorityVariation()
{
    if (!varyAvoidancePriority || navAgent == null)
    {
        return;
    }

    int minPriority = Mathf.Clamp(avoidancePriorityMin, 0, 99);
    int maxPriority = Mathf.Clamp(avoidancePriorityMax, minPriority, 99);
    int priorityCount = maxPriority - minPriority + 1;
    int identitySeed = myStatus != null ? myStatus.objID : GetInstanceID();
    int positiveSeed = identitySeed & int.MaxValue;
    int priorityOffset = (int)(((long)positiveSeed * 11L) % priorityCount);

    navAgent.avoidancePriority = minPriority + priorityOffset;
}

/// <summary>
/// 일정 주기마다 브레인에게 지금 어떤 행동을 해야 하는지 판단을 맡깁니다.
/// 실제 상태 전환 로직은 EnemyBrain이 담당하고, 이 스크립트는 루프 진입점 역할만 합니다.
/// </summary>
private IEnumerator CheckRoutine()
{
```

```cs
    while (myStatus.nowState != EnemyStatus.EnemyState.Dead)
    {
        // 경직 중 목적지가 다시 갱신되면 NavMeshAgent가 즉시 재출발하므로 다음 판단 주기까지 기다립니다.
        if (isMovementHitStaggered)
        {
            yield return brain.GetCheckDelay();
            continue;
        }

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
```

```cs
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
    boxCollider.enabled = false;

    // 사운드 재생 이벤트를 AudioManager에 전달하여 사망 지점에서 3D 오디오 재생
    int dieAudioID = dissolve_AudioIDPool[UnityEngine.Random.Range(0, dissolve_AudioIDPool.Length)];
    GlobalEventBus.OnPlay3DSoundRequested?.Invoke(dieAudioID, gameObject.transform.position);

    Destroy(gameObject, 0.0f);
}

/// <summary>
/// 스폰 직후 전달받은 순찰 루트와 시작 인덱스를 메모리에 기록합니다.
/// SpawnManager가 적 생성 직후 한 번 호출하는 초기 진입점입니다.
/// </summary>
public void InitializeSpawnContext(Vector3 spawnPosition, EnemyPatrolRoute patrolRoute, int startPatrolIndex)
{
    memory.InitializePatrol(spawnPosition, patrolRoute, startPatrolIndex);
    ApplyAvoidancePriorityVariation();
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

```

```cs
    Transform swingOrigin = attackOrigin != null ? attackOrigin : transform;
    string slashVfxId = swingIndex == 0
        ? GameplayVFXIds.EnemySlash01
        : GameplayVFXIds.EnemySlash02;
    VFXService.Instance?.Play(slashVfxId, swingOrigin.position, transform.rotation);

    StartCoroutine(combat.ExecuteSwing(
        transform,
        brain.CurrentTarget,
        swingOrigin,
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
```

```cs
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
```

```cs
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

```

```cs
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
{% endraw %}
