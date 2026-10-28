---
title: "2026-07-23 전체 스크립트 비교 정리"
date: 2026-07-23 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "비교 기준 작성자 기준: SongYeChan1024 직접 커밋만 포함 대상 커밋: be4d82f — 에너미 소음 감지 및 추적 상실 탐색 로직 개선 비교 범위: 해당 커밋의 수정 C 5개 형식: 각 파일의 이전 전문 → 변경 설명 → 변경 후 전문 제외: 팀원 커밋, 병합 커밋, 씬·프"
description: "비교 기준 작성자 기준: SongYeChan1024 직접 커밋만 포함 대상 커밋: be4d82f — 에너미 소음 감지 및 추적 상실 탐색 로직 개선 비교 범위: 해당 커밋의 수정 C 5개 형식: 각 파일의 이전 전문 → 변경 설명 → 변경 후 전문 제외: 팀원 커밋, 병합 커밋, 씬·프"
published: true
migration_id: "3a636532580e81dd9b0dc86c8eea85e3"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
## 비교 기준

- 작성자 기준: SongYeChan1024 직접 커밋만 포함
- 대상 커밋: <code>be4d82f</code> — 에너미 소음 감지 및 추적 상실 탐색 로직 개선
- 비교 범위: 해당 커밋의 수정 C# 5개
- 형식: 각 파일의 이전 전문 → 변경 설명 → 변경 후 전문
- 제외: 팀원 커밋, 병합 커밋, 씬·프리팹 등 비스크립트 자산

## 비교 파일

1. <code>NoiseManager.cs</code>
2. <code>EnemyBrain.cs</code>
3. <code>EnemyNoiseListener.cs</code>
4. <code>EnemyPerception.cs</code>
5. <code>PlayerMovement.cs</code>

## Assets/02\_Scripts/Manager/GameSystem/NoiseManager.cs

### 이전 스크립트

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 게임 전체의 소음 요청을 받아 실제 소음 이벤트로 확정하고 브로드캐스트하는 중앙 관리자입니다.
/// 소리 종류별 기본 범위, 지속 시간, 우선순위를 한곳에서 관리합니다.
/// </summary>
public class NoiseManager : MonoBehaviour
{
    [Serializable]
    private struct NoiseTypeSetting
    {
        public NoiseType type;
        public float defaultRadius;
        public float defaultDuration;
        public int priority;
        public bool canInterruptChase;
        public Color debugColor;
    }

    public static NoiseManager Instance { get; private set; }

    [Header("Noise Debug")]
    [SerializeField] private bool createNoiseMarkers = true;
    [SerializeField] private NoiseSourceObject noiseSourcePrefab;

    [Header("Noise Settings")]
    [SerializeField] private List<NoiseTypeSetting> noiseSettings = new()
    {
        new NoiseTypeSetting { type = NoiseType.Walk, defaultRadius = 15.0f, defaultDuration = 0.5f, priority = 5, canInterruptChase = false, debugColor = new Color(0.25f, 0.7f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Run, defaultRadius = 20.0f, defaultDuration = 0.7f, priority = 10, canInterruptChase = false, debugColor = new Color(0.1f, 0.9f, 0.9f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Gunshot, defaultRadius = 40.0f, defaultDuration = 1.2f, priority = 30, canInterruptChase = false, debugColor = new Color(1.0f, 0.6f, 0.1f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.ChestOpen, defaultRadius = 30.0f, defaultDuration = 1.8f, priority = 40, canInterruptChase = true, debugColor = new Color(1.0f, 0.9f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Skill, defaultRadius = 12.0f, defaultDuration = 1.0f, priority = 35, canInterruptChase = false, debugColor = new Color(0.8f, 0.4f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.EnemyAlertCry, defaultRadius = 13.0f, defaultDuration = 1.2f, priority = 45, canInterruptChase = false, debugColor = new Color(1.0f, 0.2f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.HitReaction, defaultRadius = 5.0f, defaultDuration = 0.6f, priority = 15, canInterruptChase = false, debugColor = new Color(0.9f, 0.5f, 0.5f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.CombatImpact, defaultRadius = 8.0f, defaultDuration = 0.8f, priority = 20, canInterruptChase = false, debugColor = new Color(0.9f, 0.35f, 0.15f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Decoy, defaultRadius = 18.0f, defaultDuration = 2.5f, priority = 60, canInterruptChase = true, debugColor = new Color(0.4f, 1.0f, 0.35f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.LucidLeak, defaultRadius = 45.0f, defaultDuration = 3.0f, priority = 50, canInterruptChase = false, debugColor = new Color(0.85f, 0.15f, 0.2f, 1.0f) },
    };

    private readonly Dictionary<NoiseType, NoiseTypeSetting> cachedSettings = new();

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void EnsureInstance()
    {
        if (Instance != null)
        {
            return;
        }

        // 씬에 배치하지 않아도 노이즈 시스템이 항상 동작하도록 자동 생성합니다.
        GameObject noiseManagerObject = new("NoiseManager");
        DontDestroyOnLoad(noiseManagerObject);
        noiseManagerObject.AddComponent<NoiseManager>();
    }

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 NoiseManager 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
        CacheSettings();
    }

    private void OnEnable()
    {
        CacheSettings();
        GlobalEventBus.OnNoiseRequested += HandleNoiseRequested;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnNoiseRequested -= HandleNoiseRequested;
    }

    private void CacheSettings()
    {
        cachedSettings.Clear();

        for (int i = 0; i < noiseSettings.Count; i++)
        {
            cachedSettings[noiseSettings[i].type] = noiseSettings[i];
        }
    }

    private void HandleNoiseRequested(NoiseStimulus requestedStimulus)
    {
        NoiseStimulus resolvedStimulus = ResolveStimulus(requestedStimulus);
        NoiseSourceObject spawnedNoiseSource = null;

        if (createNoiseMarkers && resolvedStimulus.Duration > 0.0f)
        {
            spawnedNoiseSource = CreateNoiseSourceObject(resolvedStimulus);
        }

        if (spawnedNoiseSource != null)
        {
            // AI 가 실제 노이즈 오브젝트를 기준점으로 삼을 수 있게 앵커를 연결합니다.
            resolvedStimulus.Position = spawnedNoiseSource.transform.position;
            resolvedStimulus.AnchorTransform = spawnedNoiseSource.transform;
        }

        GlobalEventBus.OnNoiseEmitted?.Invoke(resolvedStimulus);
    }

    private NoiseStimulus ResolveStimulus(NoiseStimulus requestedStimulus)
    {
        NoiseTypeSetting setting = GetNoiseSetting(requestedStimulus.Type);

        float radius = requestedStimulus.Radius > 0.0f ? requestedStimulus.Radius : setting.defaultRadius;
        float duration = requestedStimulus.Duration > 0.0f ? requestedStimulus.Duration : setting.defaultDuration;
        int priority = requestedStimulus.Priority >= 0 ? requestedStimulus.Priority : setting.priority;
        bool canInterruptChase = requestedStimulus.CanInterruptChase || setting.canInterruptChase;

        return new NoiseStimulus(
            requestedStimulus.Type,
            requestedStimulus.Position,
            requestedStimulus.Source,
            radius,
            duration,
            canInterruptChase,
            priority,
            requestedStimulus.CreatedTime,
            requestedStimulus.AnchorTransform);
    }

    private NoiseTypeSetting GetNoiseSetting(NoiseType noiseType)
    {
        if (cachedSettings.TryGetValue(noiseType, out NoiseTypeSetting setting))
        {
            return setting;
        }

        return new NoiseTypeSetting
        {
            type = noiseType,
            defaultRadius = 8.0f,
            defaultDuration = 1.0f,
            priority = 0,
            canInterruptChase = false,
            debugColor = Color.white,
        };
    }

    private NoiseSourceObject CreateNoiseSourceObject(NoiseStimulus stimulus)
    {
        // 공용 프리팹이 연결되어 있으면 그 오브젝트를 생성하고,
        // 없으면 코드로 최소 구성 오브젝트를 만들어도 기능은 끊기지 않게 합니다.
        NoiseSourceObject spawnedNoiseSource = null;

        if (noiseSourcePrefab != null)
        {
            spawnedNoiseSource = Instantiate(noiseSourcePrefab, stimulus.Position, Quaternion.identity);
            spawnedNoiseSource.name = $"Noise_{stimulus.Type}";
        }
        else
        {
            GameObject noiseObject = new($"Noise_{stimulus.Type}");
            noiseObject.transform.SetPositionAndRotation(stimulus.Position, Quaternion.identity);
            spawnedNoiseSource = noiseObject.AddComponent<NoiseSourceObject>();
        }

        spawnedNoiseSource.Initialize(stimulus, GetNoiseSetting(stimulus.Type).debugColor);
        return spawnedNoiseSource;
    }
}
```

### 변경 설명

기본 소음 반경을 기획 밸런스에 맞춰 조정했습니다. Walk 15→1, Gunshot 40→20, ChestOpen 30→15, Skill 12→10, EnemyAlertCry 13→15, CombatImpact 8→10, Decoy 18→20으로 변경해 종류별 영향 범위를 정리했습니다.

### 변경 후 스크립트

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 게임 전체의 소음 요청을 받아 실제 소음 이벤트로 확정하고 브로드캐스트하는 중앙 관리자입니다.
/// 소리 종류별 기본 범위, 지속 시간, 우선순위를 한곳에서 관리합니다.
/// </summary>
public class NoiseManager : MonoBehaviour
{
    [Serializable]
    private struct NoiseTypeSetting
    {
        public NoiseType type;
        public float defaultRadius;
        public float defaultDuration;
        public int priority;
        public bool canInterruptChase;
        public Color debugColor;
    }

    public static NoiseManager Instance { get; private set; }

    [Header("Noise Debug")]
    [SerializeField] private bool createNoiseMarkers = true;
    [SerializeField] private NoiseSourceObject noiseSourcePrefab;

    [Header("Noise Settings")]
    [SerializeField] private List<NoiseTypeSetting> noiseSettings = new()
    {
        new NoiseTypeSetting { type = NoiseType.Walk, defaultRadius = 1.0f, defaultDuration = 0.5f, priority = 5, canInterruptChase = false, debugColor = new Color(0.25f, 0.7f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Run, defaultRadius = 20.0f, defaultDuration = 0.7f, priority = 10, canInterruptChase = false, debugColor = new Color(0.1f, 0.9f, 0.9f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Gunshot, defaultRadius = 20.0f, defaultDuration = 1.2f, priority = 30, canInterruptChase = false, debugColor = new Color(1.0f, 0.6f, 0.1f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.ChestOpen, defaultRadius = 15.0f, defaultDuration = 1.8f, priority = 40, canInterruptChase = true, debugColor = new Color(1.0f, 0.9f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Skill, defaultRadius = 10.0f, defaultDuration = 1.0f, priority = 35, canInterruptChase = false, debugColor = new Color(0.8f, 0.4f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.EnemyAlertCry, defaultRadius = 15.0f, defaultDuration = 1.2f, priority = 45, canInterruptChase = false, debugColor = new Color(1.0f, 0.2f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.HitReaction, defaultRadius = 5.0f, defaultDuration = 0.6f, priority = 15, canInterruptChase = false, debugColor = new Color(0.9f, 0.5f, 0.5f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.CombatImpact, defaultRadius = 10.0f, defaultDuration = 0.8f, priority = 20, canInterruptChase = false, debugColor = new Color(0.9f, 0.35f, 0.15f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Decoy, defaultRadius = 20.0f, defaultDuration = 2.5f, priority = 60, canInterruptChase = true, debugColor = new Color(0.4f, 1.0f, 0.35f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.LucidLeak, defaultRadius = 45.0f, defaultDuration = 3.0f, priority = 50, canInterruptChase = false, debugColor = new Color(0.85f, 0.15f, 0.2f, 1.0f) },
    };

    private readonly Dictionary<NoiseType, NoiseTypeSetting> cachedSettings = new();

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void EnsureInstance()
    {
        if (Instance != null)
        {
            return;
        }

        // 씬에 배치하지 않아도 노이즈 시스템이 항상 동작하도록 자동 생성합니다.
        GameObject noiseManagerObject = new("NoiseManager");
        DontDestroyOnLoad(noiseManagerObject);
        noiseManagerObject.AddComponent<NoiseManager>();
    }

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            // 같은 Manager 오브젝트에 다른 매니저 컴포넌트가 함께 붙어 있으므로 오브젝트 전체가 아니라 NoiseManager 컴포넌트만 제거합니다.
            Destroy(this);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
        CacheSettings();
    }

    private void OnEnable()
    {
        CacheSettings();
        GlobalEventBus.OnNoiseRequested += HandleNoiseRequested;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnNoiseRequested -= HandleNoiseRequested;
    }

    private void CacheSettings()
    {
        cachedSettings.Clear();

        for (int i = 0; i < noiseSettings.Count; i++)
        {
            cachedSettings[noiseSettings[i].type] = noiseSettings[i];
        }
    }

    private void HandleNoiseRequested(NoiseStimulus requestedStimulus)
    {
        NoiseStimulus resolvedStimulus = ResolveStimulus(requestedStimulus);
        NoiseSourceObject spawnedNoiseSource = null;

        if (createNoiseMarkers && resolvedStimulus.Duration > 0.0f)
        {
            spawnedNoiseSource = CreateNoiseSourceObject(resolvedStimulus);
        }

        if (spawnedNoiseSource != null)
        {
            // AI 가 실제 노이즈 오브젝트를 기준점으로 삼을 수 있게 앵커를 연결합니다.
            resolvedStimulus.Position = spawnedNoiseSource.transform.position;
            resolvedStimulus.AnchorTransform = spawnedNoiseSource.transform;
        }

        GlobalEventBus.OnNoiseEmitted?.Invoke(resolvedStimulus);
    }

    private NoiseStimulus ResolveStimulus(NoiseStimulus requestedStimulus)
    {
        NoiseTypeSetting setting = GetNoiseSetting(requestedStimulus.Type);

        float radius = requestedStimulus.Radius > 0.0f ? requestedStimulus.Radius : setting.defaultRadius;
        float duration = requestedStimulus.Duration > 0.0f ? requestedStimulus.Duration : setting.defaultDuration;
        int priority = requestedStimulus.Priority >= 0 ? requestedStimulus.Priority : setting.priority;
        bool canInterruptChase = requestedStimulus.CanInterruptChase || setting.canInterruptChase;

        return new NoiseStimulus(
            requestedStimulus.Type,
            requestedStimulus.Position,
            requestedStimulus.Source,
            radius,
            duration,
            canInterruptChase,
            priority,
            requestedStimulus.CreatedTime,
            requestedStimulus.AnchorTransform);
    }

    private NoiseTypeSetting GetNoiseSetting(NoiseType noiseType)
    {
        if (cachedSettings.TryGetValue(noiseType, out NoiseTypeSetting setting))
        {
            return setting;
        }

        return new NoiseTypeSetting
        {
            type = noiseType,
            defaultRadius = 8.0f,
            defaultDuration = 1.0f,
            priority = 0,
            canInterruptChase = false,
            debugColor = Color.white,
        };
    }

    private NoiseSourceObject CreateNoiseSourceObject(NoiseStimulus stimulus)
    {
        // 공용 프리팹이 연결되어 있으면 그 오브젝트를 생성하고,
        // 없으면 코드로 최소 구성 오브젝트를 만들어도 기능은 끊기지 않게 합니다.
        NoiseSourceObject spawnedNoiseSource = null;

        if (noiseSourcePrefab != null)
        {
            spawnedNoiseSource = Instantiate(noiseSourcePrefab, stimulus.Position, Quaternion.identity);
            spawnedNoiseSource.name = $"Noise_{stimulus.Type}";
        }
        else
        {
            GameObject noiseObject = new($"Noise_{stimulus.Type}");
            noiseObject.transform.SetPositionAndRotation(stimulus.Position, Quaternion.identity);
            spawnedNoiseSource = noiseObject.AddComponent<NoiseSourceObject>();
        }

        spawnedNoiseSource.Initialize(stimulus, GetNoiseSetting(stimulus.Type).debugColor);
        return spawnedNoiseSource;
    }
}
```

## Assets/02\_Scripts/System/Enemy/EnemyBrain.cs

### 이전 스크립트

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

### 변경 설명

추적 대상을 잃은 뒤 마지막 소음 앵커가 유효하면 즉시 대기하지 않고 소음 위치 탐색 상태로 전환하는 흐름을 추가했습니다. 앵커가 없거나 도달했으면 기존 대기 전환을 유지합니다.

### 변경 후 스크립트

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
    [SerializeField, Min(0f)] private float lostTargetSearchDuration = 3.0f;  // Time spent searching after losing the player
    [SerializeField, Min(0f)] private float chaseLeashDistance = 16f;        // 루트에서 이 거리까지 새 추적과 어그로 회복을 허용
    [SerializeField, Min(0f)] private float hardReturnDistance = 24f;        // 루트에서 이 거리를 넘으면 시야와 무관하게 즉시 복귀

    [Header("Chase Crowd Spacing")]
    [SerializeField] private bool enableDistributedApproach = false;                    // 플레이어 추격에만 개체별 접근 지점을 사용할지 여부
    [SerializeField, Min(0.1f)] private float distributedApproachRadius = 4.0f;          // 플레이어 중심에서 각 접근 지점까지의 거리
    [SerializeField, Min(0.1f)] private float distributedApproachActivationDistance = 10.0f; // 가까운 추격에서 접근 지점 분산을 시작할 거리
    [SerializeField, Range(2, 32)] private int distributedApproachSlotCount = 16;        // 플레이어 주변에 분산할 접근 지점 수
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
    [NonSerialized] private bool isSearchingLastKnownTarget;
    [NonSerialized] private float lostTargetSearchEndTime;
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
        aggroRecoveryPerSecond = Mathf.Max(0f, aggroRecoveryPerSecond);
        lostTargetSearchDuration = Mathf.Max(0f, lostTargetSearchDuration);
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
        isSearchingLastKnownTarget = false;
        lostTargetSearchEndTime = 0f;
    }

    /// <summary>
    /// 실제 피해를 받은 순간 플레이어를 전투 타겟으로 등록합니다.
    /// 디코이 이동 타겟은 별도로 보존하므로 디코이가 끝난 뒤 이 전투 타겟으로 자연스럽게 복귀합니다.
    /// </summary>
    public bool TryAcquireCombatTargetFromDamage(
        Transform self,
        Transform damageTarget,
        EnemyMemory memory,
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
            isSearchingLastKnownTarget = false;
            lostTargetSearchEndTime = 0f;
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
            if (!isSearchingLastKnownTarget)
            {
                isSearchingLastKnownTarget = true;
                lostTargetSearchEndTime = now + lostTargetSearchDuration;
                memory.ClearChasePlan();
            }

            if (now < lostTargetSearchEndTime)
            {
                locomotion.Stop(agent, onWalkEvent);
                locomotion.FacePosition(self, memory.LastKnownTargetPosition, onLookDirEvent);
                status.SetNowState(EnemyStatus.EnemyState.Investigate);
                return;
            }

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
        isSearchingLastKnownTarget = false;
        lostTargetSearchEndTime = 0f;
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
            isSearchingLastKnownTarget = false;
            lostTargetSearchEndTime = 0.0f;
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

## Assets/02\_Scripts/System/Enemy/EnemyNoiseListener.cs

### 이전 스크립트

```cs
using System;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 소음 자극을 조사 상태로 전환하는 모듈입니다.
/// 마지막으로 들은 위치와 조사 유지 시간을 기억하고, 필요하면 추적을 끊고 조사로 전환합니다.
/// </summary>
[Serializable]
public class EnemyNoiseListener
{
    [SerializeField] private float maxInvestigateMoveTime = 3.0f;            // 조사 지점에 도착하지 못해도 복귀로 넘기는 최대 이동 시간
    [SerializeField] private float investigateStopDistance = 1.0f;           // 조사 지점에 도착했다고 보는 거리
    [SerializeField] private float investigateDuration = 2.0f;               // 도착 후 주변을 살피는 시간
    [SerializeField] private float investigateNavMeshSampleDistance = 2.5f;  // 조사 위치를 NavMesh 위로 보정하는 반경

    [NonSerialized] private float investigateStopDistanceSqr;                // 도착 판정 거리 제곱 캐시
    [NonSerialized] private bool hasInvestigateTarget;                       // 현재 조사 목표가 있는지 여부
    [NonSerialized] private bool hasReachedInvestigatePoint;                 // 조사 위치까지 도착했는지 여부
    [NonSerialized] private Vector3 investigateTargetPosition;               // 조사할 월드 좌표
    [NonSerialized] private Transform investigateTargetAnchor;               // 소리 기준점이 움직이면 따라가기 위한 앵커
    [NonSerialized] private float investigateSearchEndTime;                  // 조사 종료 시각
    [NonSerialized] private float forcedInvestigationUntilTime;              // 강제 조사 유지 시각
    [NonSerialized] private int currentInvestigatePriority = -1;             // 현재 조사 대상 우선순위

    [NonSerialized] private float investigateMoveEndTime;                    // 조사 지점으로 이동을 포기하고 복귀로 넘길 시각

    public void OnValidate()
    {
        investigateStopDistance = Mathf.Max(0.1f, investigateStopDistance);
        investigateDuration = Mathf.Max(0.1f, investigateDuration);
        maxInvestigateMoveTime = Mathf.Max(0.1f, maxInvestigateMoveTime);
        investigateNavMeshSampleDistance = Mathf.Max(0.5f, investigateNavMeshSampleDistance);
        investigateStopDistanceSqr = investigateStopDistance * investigateStopDistance;
    }

    /// <summary>
    /// 강한 소리에 반응한 직후에는 즉시 다시 시야 대상을 줍지 않도록 잠시 막아 줍니다.
    /// </summary>
    public bool ShouldBlockSightReacquire()
    {
        return hasInvestigateTarget && Time.time < forcedInvestigationUntilTime;
    }

    /// <summary>
    /// 새 소음을 등록하고, 필요하면 현재 추적을 끊고 조사 상태로 전환합니다.
    /// </summary>
    public bool TryRegisterNoise(
        EnemyPerception perception,
        Transform self,
        NoiseStimulus stimulus,
        bool hasChaseTarget,
        EnemyStatus status,
        out bool interruptedChase)
    {
        interruptedChase = false;

        if (!perception.CanHear(self, stimulus))
        {
            return false;
        }

        if (hasChaseTarget && !stimulus.CanInterruptChase)
        {
            return false;
        }

        if (hasInvestigateTarget && !stimulus.CanInterruptChase && stimulus.Priority < currentInvestigatePriority)
        {
            return false;
        }

        if (stimulus.CanInterruptChase)
        {
            interruptedChase = true;
            status.SetIsAttacking(false);
            forcedInvestigationUntilTime = Time.time + Mathf.Max(investigateDuration, stimulus.Duration);
        }

        investigateTargetPosition = stimulus.Position;
        investigateTargetAnchor = stimulus.AnchorTransform;
        hasInvestigateTarget = true;
        hasReachedInvestigatePoint = false;
        investigateSearchEndTime = 0.0f;
        investigateMoveEndTime = Time.time + maxInvestigateMoveTime;
        currentInvestigatePriority = stimulus.Priority;
        return true;
    }

    /// <summary>
    /// 등록된 소리 위치로 이동하고, 도착 후 일정 시간 동안 조사 상태를 유지합니다.
    /// </summary>
    public bool Investigate(
        Transform self,
        NavMeshAgent agent,
        EnemyLocomotion locomotion,
        EnemyStatus status,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent)
    {
        if (!hasInvestigateTarget)
        {
            return false;
        }

        if (!hasReachedInvestigatePoint)
        {
            // 조사 지점까지 너무 오래 끌리면 도달 실패로 보고 조사 상태를 종료합니다.
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

            locomotion.MoveTo(
                self,
                agent,
                destination,
                status,
                EnemyStatus.EnemyState.Investigate,
                onWalkEvent,
                onLookDirEvent);
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

    /// <summary>
    /// 현재 조사 상태를 모두 초기화합니다.
    /// </summary>
    public void Clear()
    {
        hasInvestigateTarget = false;
        hasReachedInvestigatePoint = false;
        investigateTargetPosition = Vector3.zero;
        investigateTargetAnchor = null;
        investigateSearchEndTime = 0.0f;
        investigateMoveEndTime = 0.0f;
        forcedInvestigationUntilTime = 0.0f;
        currentInvestigatePriority = -1;
    }

    /// <summary>
    /// 소리 기준점이 움직이면 최신 위치를 따라가고, NavMesh 위 유효 좌표로 보정합니다.
    /// </summary>
    private Vector3 GetInvestigateDestination()
    {
        if (investigateTargetAnchor != null)
        {
            investigateTargetPosition = investigateTargetAnchor.position;
        }

        if (NavMesh.SamplePosition(
                investigateTargetPosition,
                out NavMeshHit hit,
                investigateNavMeshSampleDistance,
                NavMesh.AllAreas))
        {
            return hit.position;
        }

        return investigateTargetPosition;
    }
}
```

### 변경 설명

소음 반응 중 추적 상태를 중단할 수 있는지 확인할 때, 소음 앵커를 보존해 이후 탐색 전환이 실제 소음 위치를 기준으로 동작하도록 보완했습니다.

### 변경 후 스크립트

```cs
using System;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 소음 자극을 조사 상태로 전환하는 모듈입니다.
/// 마지막으로 들은 위치와 조사 유지 시간을 기억하고, 필요하면 추적을 끊고 조사로 전환합니다.
/// </summary>
[Serializable]
public class EnemyNoiseListener
{
    [SerializeField] private float maxInvestigateMoveTime = 5.0f;            // 조사 지점에 도착하지 못해도 복귀로 넘기는 최대 이동 시간
    [SerializeField] private float investigateStopDistance = 1.0f;           // 조사 지점에 도착했다고 보는 거리
    [SerializeField] private float investigateDuration = 3.0f;               // 도착 후 주변을 살피는 시간
    [SerializeField] private float investigateNavMeshSampleDistance = 2.5f;  // 조사 위치를 NavMesh 위로 보정하는 반경

    [NonSerialized] private float investigateStopDistanceSqr;                // 도착 판정 거리 제곱 캐시
    [NonSerialized] private bool hasInvestigateTarget;                       // 현재 조사 목표가 있는지 여부
    [NonSerialized] private bool hasReachedInvestigatePoint;                 // 조사 위치까지 도착했는지 여부
    [NonSerialized] private Vector3 investigateTargetPosition;               // 조사할 월드 좌표
    [NonSerialized] private Transform investigateTargetAnchor;               // 소리 기준점이 움직이면 따라가기 위한 앵커
    [NonSerialized] private float investigateSearchEndTime;                  // 조사 종료 시각
    [NonSerialized] private float forcedInvestigationUntilTime;              // 강제 조사 유지 시각
    [NonSerialized] private int currentInvestigatePriority = -1;             // 현재 조사 대상 우선순위

    [NonSerialized] private float investigateMoveEndTime;                    // 조사 지점으로 이동을 포기하고 복귀로 넘길 시각

    public void OnValidate()
    {
        investigateStopDistance = Mathf.Max(0.1f, investigateStopDistance);
        investigateDuration = Mathf.Max(0.1f, investigateDuration);
        maxInvestigateMoveTime = Mathf.Max(0.1f, maxInvestigateMoveTime);
        investigateNavMeshSampleDistance = Mathf.Max(0.5f, investigateNavMeshSampleDistance);
        investigateStopDistanceSqr = investigateStopDistance * investigateStopDistance;
    }

    /// <summary>
    /// 강한 소리에 반응한 직후에는 즉시 다시 시야 대상을 줍지 않도록 잠시 막아 줍니다.
    /// </summary>
    public bool ShouldBlockSightReacquire()
    {
        return hasInvestigateTarget && Time.time < forcedInvestigationUntilTime;
    }

    /// <summary>
    /// 새 소음을 등록하고, 필요하면 현재 추적을 끊고 조사 상태로 전환합니다.
    /// </summary>
    public bool TryRegisterNoise(
        EnemyPerception perception,
        Transform self,
        NoiseStimulus stimulus,
        bool hasChaseTarget,
        EnemyStatus status,
        out bool interruptedChase)
    {
        interruptedChase = false;

        if (!perception.CanHear(self, stimulus))
        {
            return false;
        }

        if (hasChaseTarget && !stimulus.CanInterruptChase)
        {
            return false;
        }

        if (hasInvestigateTarget && !stimulus.CanInterruptChase && stimulus.Priority < currentInvestigatePriority)
        {
            return false;
        }

        if (stimulus.CanInterruptChase)
        {
            interruptedChase = true;
            status.SetIsAttacking(false);
            forcedInvestigationUntilTime = Time.time + Mathf.Max(investigateDuration, stimulus.Duration);
        }

        investigateTargetPosition = stimulus.Position;
        investigateTargetAnchor = stimulus.AnchorTransform;
        hasInvestigateTarget = true;
        hasReachedInvestigatePoint = false;
        investigateSearchEndTime = 0.0f;
        investigateMoveEndTime = Time.time + maxInvestigateMoveTime;
        currentInvestigatePriority = stimulus.Priority;
        return true;
    }

    /// <summary>
    /// 등록된 소리 위치로 이동하고, 도착 후 일정 시간 동안 조사 상태를 유지합니다.
    /// </summary>
    public bool Investigate(
        Transform self,
        NavMeshAgent agent,
        EnemyLocomotion locomotion,
        EnemyStatus status,
        Action<bool> onWalkEvent,
        Action<int, int> onLookDirEvent)
    {
        if (!hasInvestigateTarget)
        {
            return false;
        }

        if (!hasReachedInvestigatePoint)
        {
            // 조사 지점까지 너무 오래 끌리면 도달 실패로 보고 조사 상태를 종료합니다.
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

            locomotion.MoveTo(
                self,
                agent,
                destination,
                status,
                EnemyStatus.EnemyState.Investigate,
                onWalkEvent,
                onLookDirEvent);
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

    /// <summary>
    /// 현재 조사 상태를 모두 초기화합니다.
    /// </summary>
    public void Clear()
    {
        hasInvestigateTarget = false;
        hasReachedInvestigatePoint = false;
        investigateTargetPosition = Vector3.zero;
        investigateTargetAnchor = null;
        investigateSearchEndTime = 0.0f;
        investigateMoveEndTime = 0.0f;
        forcedInvestigationUntilTime = 0.0f;
        currentInvestigatePriority = -1;
    }

    /// <summary>
    /// 소리 기준점이 움직이면 최신 위치를 따라가고, NavMesh 위 유효 좌표로 보정합니다.
    /// </summary>
    private Vector3 GetInvestigateDestination()
    {
        if (investigateTargetAnchor != null)
        {
            investigateTargetPosition = investigateTargetAnchor.position;
        }

        if (NavMesh.SamplePosition(
                investigateTargetPosition,
                out NavMeshHit hit,
                investigateNavMeshSampleDistance,
                NavMesh.AllAreas))
        {
            return hit.position;
        }

        return investigateTargetPosition;
    }
}
```

## Assets/02\_Scripts/System/Enemy/EnemyPerception.cs

### 이전 스크립트

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

        RaycastHit[] hits = Physics.RaycastAll(
            eyePosition,
            directionToTarget.normalized,
            targetDistance,
            ~0,
            QueryTriggerInteraction.Ignore);

        if (hits == null || hits.Length == 0)
        {
            return true;
        }

        RaycastHit nearestValidHit = default;
        bool hasValidHit = false;
        float nearestDistance = float.MaxValue;

        foreach (RaycastHit hit in hits)
        {
            Transform hitTransform = hit.transform;
            if (hitTransform == null)
            {
                continue;
            }

            // 시야 레이캐스트가 자기 자신의 콜라이더를 먼저 맞으면 근접 교전 중에도
            // 플레이어가 벽 뒤에 있는 것처럼 판단될 수 있으므로 자기 자신 계층은 무시합니다.
            if (hitTransform == self || hitTransform.IsChildOf(self))
            {
                continue;
            }

            if (hit.distance < nearestDistance)
            {
                nearestDistance = hit.distance;
                nearestValidHit = hit;
                hasValidHit = true;
            }
        }

        if (!hasValidHit)
        {
            return true;
        }

        Transform nearestTransform = nearestValidHit.transform;
        return nearestTransform == target || nearestTransform.IsChildOf(target);
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

### 변경 설명

청각 판정을 중심점 거리 비교에서 적 청각 반경과 소음 반경의 겹침 판정으로 변경했습니다. 또한 적 귀 위치와 소리 위치 사이의 Linecast 차폐 검사를 유지해 벽 너머 반응을 제한합니다.

### 변경 후 스크립트

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
    [SerializeField] private float awarenessRange = 15.0f;   // 이미 본 대상을 놓치지 않고 유지하는 거리
    [SerializeField] private float hearingRange = 17.5f;     // 소리를 들을 수 있는 최대 거리
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

        RaycastHit[] hits = Physics.RaycastAll(
            eyePosition,
            directionToTarget.normalized,
            targetDistance,
            ~0,
            QueryTriggerInteraction.Ignore);

        if (hits == null || hits.Length == 0)
        {
            return true;
        }

        RaycastHit nearestValidHit = default;
        bool hasValidHit = false;
        float nearestDistance = float.MaxValue;

        foreach (RaycastHit hit in hits)
        {
            Transform hitTransform = hit.transform;
            if (hitTransform == null)
            {
                continue;
            }

            // 시야 레이캐스트가 자기 자신의 콜라이더를 먼저 맞으면 근접 교전 중에도
            // 플레이어가 벽 뒤에 있는 것처럼 판단될 수 있으므로 자기 자신 계층은 무시합니다.
            if (hitTransform == self || hitTransform.IsChildOf(self))
            {
                continue;
            }

            if (hit.distance < nearestDistance)
            {
                nearestDistance = hit.distance;
                nearestValidHit = hit;
                hasValidHit = true;
            }
        }

        if (!hasValidHit)
        {
            return true;
        }

        Transform nearestTransform = nearestValidHit.transform;
        return nearestTransform == target || nearestTransform.IsChildOf(target);
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

        // Hear the noise when the enemy hearing radius overlaps the noise propagation radius.
        float effectiveRadius = hearingRange + Mathf.Max(0.0f, stimulus.Radius);
        if (effectiveRadius <= 0.0f)
        {
            return false;
        }

        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(self.position, stimulus.Position);
        if (sqrDistance > effectiveRadius * effectiveRadius)
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

## Assets/02\_Scripts/System/Player/PlayerMovement.cs

### 이전 스크립트

```cs
﻿using AnyPortrait;
using System.Collections;
/// <summary>
/// 플레이어의 이동과 커서 방향 회전을 처리하는 스크립트
/// </summary>
using UnityEngine;
using UnityEngine.InputSystem;
using static AnyPortrait.apAnimPlayUnit;

public class PlayerMovement : MonoBehaviour
{
    [Header("Player Movement Controll")]
    [SerializeField] private Rigidbody rb;
    [SerializeField] private Camera mainCamera;

    public Vector2 movementInput;                       // 플레이어의 이동 입력
    private bool sprintInput;                           // 플레이어의 달리기 입력
    private Vector2 currentMousePos;                    // 현재 마우스 화면 좌표

    [SerializeField] private float handleHeight = 1f;   // 총구 높이 (마우스 조준 기준 평면을 맞춤)

    private InputAction moveAction;                     // 플레이어 이동 이벤트 캐시
    private InputAction sprintAction;                   // 플레이어 달리기 이벤트 캐시
    private InputAction aimAction;                      // 마우스 조준 이벤트 캐시

    private readonly float isometricYAngle = +45.0f;    // 쿼터뷰 기준 이동 방향 보정
    public float moveSpeed;                             // 이동 속도
    public float rotationSpeed = 1000f;                 // 회전 속도
    private float artifactMoveSpeedRate;                // 아티팩트로 추가되는 이동 속도 증가율

    public float sprintSpeed;                           // 달리기 중 이동 속도
    public float sprintMP;                              // 달리기 중 초당 MP 소비

    public bool isEvading;                              // 구르기 상태 체크
    public float evadeSpeed;                            // 구르기 이동 속도
    public float evadeTime;                             // 구르기 동작 시간
    public float evadeMP;                               // 구르기 MP 소비
    public float evadeCooltime;                         // 구르기 쿨타임

    [Header("Collision Guard")]
    [SerializeField] private CapsuleCollider movementCollider; // 실제 몸통 이동 충돌에 사용할 CapsuleCollider
    [SerializeField] private LayerMask movementObstacleMask; // 이동/구르기 중 관통을 막을 벽 레이어
    [SerializeField] private float movementWallBuffer = 0.05f; // 벽 앞에서 멈추도록 남기는 여유 거리

    [Header("Movement Audio")]
    public int[] FootStep_AudioIDPool = null;           // 이동 사운드 ID 리스트
    public int[] InDoor_FootStep_AudioIDPool = null;    // 실내 이동 사운드 ID 리스트 (실외/실내 구분 가능한 경우 실내에서 사용)
    public int[] Evade_AudioIDPool = null;              // 구르기 사운드 ID 리스트
    public int[] Throw_AudioIDPool = null;              // 스킬 동작 사운드 ID 리스트

    private float lastFootstepTime;                     // 최근 이동 사운드 출력 시점
    public float FootStep_SoundTime = 10.0f;            // 이동 사운드 ID 출력 시간 기준 값

    [Header("Noise Settings")]
    // 발소리는 "플레이어 이동 입력"이 아니라 실제 이동 중일 때 일정 간격으로만 발생시킵니다.
    [SerializeField] private float walkNoiseRange = 15.0f;
    [SerializeField] private float runNoiseRange = 20.0f;
    [SerializeField] private float walkNoiseInterval = 0.55f;
    [SerializeField] private float runNoiseInterval = 0.3f;

    [Header("Player Animation Controll")]
    [SerializeField] private Animator animator;
    [SerializeField] private GameObject Body;

    [SerializeField] public apPortrait apPort;              // AnyPortrait 캐릭터 애니메이션 컨트롤러

    private float moveNoiseTimer;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        if (mainCamera == null)
        {
            mainCamera = Camera.main;
        }

        // 이동에 반드시 필요한 컴포넌트가 없으면 비활성화
        // Additive 씬 로드 타이밍상 Camera.main은 플레이어보다 늦게 잡힐 수 있으므로 카메라 누락만으로 이동을 막지 않습니다.
        if (rb == null || animator == null)
        {
            enabled = false;
            Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 실제 이동 충돌에 사용할 Trigger가 아닌 CapsuleCollider를 자동으로 찾습니다.
        if (movementCollider == null)
        {
            movementCollider = FindMovementCollider();
        }

        // 상호작용용 Trigger Collider가 아니라 실제 몸통 CapsuleCollider가 필요합니다.
        if (movementCollider == null)
        {
            Debug.LogError("PlayerMovement: Movement Collider에 Trigger가 아닌 CapsuleCollider를 연결해야 합니다.");
        }

        if (apPort != null)
        {
            apPort.enabled = true;
            if (apPort.gameObject != null) apPort.gameObject.SetActive(true);
        }

        lastFootstepTime = Time.time;
    }

    private void OnEnable()
    {
        if (GlobalEventBus.OnGetInputAction != null)
        {
            moveAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Move");
            if (moveAction != null)
            {
                moveAction.Enable();
                moveAction.performed += OnMoveInput;
                moveAction.canceled += OnMoveCanceled;
            }

            sprintAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Sprint");
            if (sprintAction != null)
            {
                sprintAction.Enable();
                sprintAction.performed += OnSprintInputPerformed;
                sprintAction.canceled += OnSprintInputCanceled;
            }

            aimAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Look");
            if (aimAction != null)
            {
                aimAction.Enable();
                aimAction.performed += OnAimInput;
                aimAction.canceled += OnAimInput;
            }
        }

        GlobalEventBus.SendCanSprint += PlayerSprint;
        GlobalEventBus.SendCannotSprint += PlayerSprint;
        GlobalEventBus.OnMainActiveSkillCasted += SkillAnimate;
        GlobalEventBus.OnHitAnimate += HitAnimate;
        GlobalEventBus.onPlayerDead += PlayerDie;
    }

    private void OnDisable()
    {
        if (moveAction != null)
        {
            moveAction.performed -= OnMoveInput;
            moveAction.canceled -= OnMoveCanceled;
            moveAction.Disable();
        }

        if (sprintAction != null)
        {
            sprintAction.performed -= OnSprintInputPerformed;
            sprintAction.canceled -= OnSprintInputCanceled;
            sprintAction.Disable();
        }

        if (aimAction != null)
        {
            aimAction.performed -= OnAimInput;
            aimAction.canceled -= OnAimInput;
            aimAction.Disable();
        }

        GlobalEventBus.SendCanSprint -= PlayerSprint;
        GlobalEventBus.SendCannotSprint -= PlayerSprint;
        GlobalEventBus.OnMainActiveSkillCasted -= SkillAnimate;
        GlobalEventBus.OnHitAnimate -= HitAnimate;
        GlobalEventBus.onPlayerDead -= PlayerDie;
        moveNoiseTimer = 0.0f;

        // 비활성화 시 입력 상태를 초기화하여
        // 재활성화 시 이전 입력 값이 남아 걷기 모션이 유지되는 것을 방지
        movementInput = Vector2.zero;
        sprintInput = false;
        if (animator != null)
        {
            animator.SetBool("IsMoving", false);
            animator.SetBool("IsSprint", false);
        }
    }

    private void FixedUpdate()
    {
        // 메인 카메라 연결이 끊겼다면 갱신
        if (mainCamera == null && Camera.main != null)
        {
            mainCamera = Camera.main;
        }

        MoveAndRotate();
    }

    public void initialize(CharacterData _charData)
    {
        // 기본 이동 속도 초기화
        moveSpeed = _charData.moveSpeed;

        // 달리기 속도 초기화
        sprintSpeed = _charData.sprintSpeed;

        // 달리기 중 초당 MP 소비 초기화
        sprintMP = _charData.sprintMana;

        // 구르기 이동 거리(속도 × 시간) 초기화
        evadeSpeed = _charData.evadeSpeed;
        evadeTime = _charData.evadeTime;

        // 구르기 MP 소비 초기화
        evadeMP = _charData.evadeMana;

        // 구르기 쿨타임 초기화
        evadeCooltime = _charData.evadeCooltime;

        artifactMoveSpeedRate = 0.0f;
        movementWallBuffer = Mathf.Max(0.0f, movementWallBuffer);
    }

    /// <summary>
    /// 아티팩트 장착 효과로 추가되는 이동 속도 증가율을 갱신합니다.
    /// 원본 moveSpeed/sprintSpeed를 직접 바꾸지 않고, 실제 이동 계산에서만 배율로 적용합니다.
    /// </summary>
    public void ApplyArtifactMoveSpeedBonus(float moveSpeedRate)
    {
        artifactMoveSpeedRate = Mathf.Max(0.0f, moveSpeedRate);
    }

    /* 플레이어 이동 입력 갱신 */
    private void OnMoveInput(InputAction.CallbackContext context) => movementInput = context.ReadValue<Vector2>();

    /* 플레이어 이동 입력 종료 */
    private void OnMoveCanceled(InputAction.CallbackContext context) => movementInput = Vector2.zero;

    /* 플레이어 달리기 입력 이벤트 */
    private void OnSprintInputPerformed(InputAction.CallbackContext context) => GlobalEventBus.OnSprintInput?.Invoke(true);
    private void OnSprintInputCanceled(InputAction.CallbackContext context) => GlobalEventBus.OnSprintInput?.Invoke(false);

    /* 플레이어 달리기 허용 상태 갱신 (PlayerStatus에서 수신) */
    private void PlayerSprint(bool sprint) => sprintInput = sprint;

    private void OnAimInput(InputAction.CallbackContext context) => UpdateMousePos(context.ReadValue<Vector2>());

    /* 마우스 화면 좌표 갱신 */
    private void UpdateMousePos(Vector2 _mousePos) => currentMousePos = _mousePos;

    /* 이동과 회전 처리 */
    private void MoveAndRotate()
    {
        Vector3 inputDir = new Vector3(movementInput.x, 0f, movementInput.y);
        Quaternion isoRotation = Quaternion.Euler(0f, isometricYAngle, 0f);
        Vector3 movement = (isoRotation * inputDir).normalized;

        float moveSpeedMultiplier = 1.0f + artifactMoveSpeedRate;
        float currentMoveSpeed = moveSpeed * moveSpeedMultiplier;
        float currentSprintSpeed = sprintSpeed * moveSpeedMultiplier;
        float finalMoveSpeed = isEvading ? evadeSpeed : (sprintInput ? currentSprintSpeed : currentMoveSpeed);

        // 걷기, 달리기, 구르기 모두 실제 몸통 CapsuleCollider로 이동 경로를 검사합니다.
        Vector3 desiredMoveDelta = movement * finalMoveSpeed * Time.fixedDeltaTime;
        Vector3 safeMoveDelta = ResolveMovementDelta(desiredMoveDelta);
        Vector3 targetPosition = rb.position + safeMoveDelta;

        // 달리기 중 MP 소비 이벤트 전달
        if (movement.sqrMagnitude > 0.001f && sprintInput)
        {
            GlobalEventBus.OnSprintManaConsume?.Invoke(sprintMP);
            GlobalEventBus.OnSprintInput?.Invoke(sprintInput);
        }

        rb.MovePosition(targetPosition);
        ClearHorizontalVelocity();
        EmitMovementNoise(movement.sqrMagnitude > 0.001f);

        // 이동 방향에 따라 바라보는 방향 회전
        if (movementInput.x > 0)
        {
            Body.transform.localScale = new Vector3(-1, 1, 1);
        }
        else if (movementInput.x < 0)
        {
            Body.transform.localScale = new Vector3(1, 1, 1);
        }

        // 위치 이동 중 정해진 시간 간격마다 이동 사운드를 재생
        if (movement.sqrMagnitude >= 0.1f) FootStepAudio();

        AimTowardsMouse();
        ImageTowardsMouse();
    }

    private void FootStepAudio()
    {
        float walkFootStepTime = FootStep_SoundTime / moveSpeed;      // 걷기 사운드 재생 간격(초)
        float sprintFootStepTime = FootStep_SoundTime / sprintSpeed;  // 달리기 사운드 재생 간격(초)

        // 달리기 중인지에 따라 사운드 재생 간격 선택
        float footstepPeriod = sprintInput ? sprintFootStepTime : walkFootStepTime;

        // 최근 사운드 재생 시점으로부터 재생 간격만큼 지났는지 확인
        if (Time.time < lastFootstepTime + footstepPeriod) return;

        // 사운드 재생 이벤트를 AudioManager에 전달하여 구르기를 실행한 지점에서 3D 오디오 재생
        int moveAudioID = FootStep_AudioIDPool[Random.Range(0, FootStep_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(moveAudioID, rb.gameObject.transform.position);

        // 최근 사운드 재생 시점 갱신
        lastFootstepTime = Time.time;
    }

    /// <summary>
    /// MovePosition 이후 Rigidbody에 남은 수평 속도를 정리합니다.
    /// 벽에 비비며 구른 뒤 입력을 떼었을 때 충돌 분리 속도 때문에 미끄러지는 현상을 줄입니다.
    /// </summary>
    private void ClearHorizontalVelocity()
    {
        Vector3 velocity = rb.velocity;
        velocity.x = 0.0f;
        velocity.z = 0.0f;
        rb.velocity = velocity;
        rb.angularVelocity = Vector3.zero;
    }

    /// <summary>
    /// 실제 이동용 CapsuleCollider만 사용해 벽 관통을 막고 벽면 슬라이딩을 계산합니다.
    /// 상호작용용 Trigger Collider는 이동 검사 형상에 포함하지 않습니다.
    /// </summary>
    private Vector3 ResolveMovementDelta(Vector3 desiredDelta)
    {
        desiredDelta.y = 0.0f;

        if (desiredDelta.sqrMagnitude <= 0.0001f)
        {
            return Vector3.zero;
        }

        if (movementCollider == null || ResolveMovementObstacleMask().value == 0)
        {
            return desiredDelta;
        }

        // 첫 이동 경로에 벽이 없으면 원래 이동량을 그대로 사용합니다.
        if (!TryCastMovement(desiredDelta, Vector3.zero, out RaycastHit firstHit))
        {
            return desiredDelta;
        }

        float desiredDistance = desiredDelta.magnitude;

        // 벽에 닿기 전까지 이동할 수 있는 거리를 계산합니다.
        float forwardDistance = Mathf.Clamp(
            firstHit.distance - movementWallBuffer,
            0.0f,
            desiredDistance
        );

        Vector3 forwardDelta = desiredDelta.normalized * forwardDistance;
        Vector3 remainingDelta = desiredDelta - forwardDelta;

        // 벽에 비스듬히 닿았을 때 남은 이동량을 벽면 방향으로 투영합니다.
        Vector3 slideDelta = Vector3.ProjectOnPlane(remainingDelta, firstHit.normal);
        slideDelta.y = 0.0f;

        if (slideDelta.sqrMagnitude <= 0.0001f)
        {
            return forwardDelta;
        }

        // 벽면을 따라 이동하는 중 다른 벽에 부딪히는지 다시 검사합니다.
        if (!TryCastMovement(slideDelta, forwardDelta, out RaycastHit slideHit))
        {
            return forwardDelta + slideDelta;
        }

        float slideDistance = Mathf.Clamp(
            slideHit.distance - movementWallBuffer,
            0.0f,
            slideDelta.magnitude
        );

        return forwardDelta + slideDelta.normalized * slideDistance;
    }

    /// <summary>
    /// 실제 몸통 CapsuleCollider 형상만 이동시켜 장애물과의 충돌을 검사합니다.
    /// 상호작용용 Trigger Collider는 검사 형상에 포함되지 않습니다.
    /// </summary>
    private bool TryCastMovement(
        Vector3 moveDelta,
        Vector3 startOffset,
        out RaycastHit hit)
    {
        hit = default;

        if (movementCollider == null || !movementCollider.enabled)
        {
            return false;
        }

        if (moveDelta.sqrMagnitude <= 0.0001f)
        {
            return false;
        }

        LayerMask obstacleMask = ResolveMovementObstacleMask();
        if (obstacleMask.value == 0)
        {
            return false;
        }

        GetMovementCapsule(
            out Vector3 point1,
            out Vector3 point2,
            out float radius
        );

        // 첫 충돌 지점까지 이동한 위치에서 두 번째 검사를 수행할 수 있도록 시작점을 보정합니다.
        point1 += startOffset;
        point2 += startOffset;

        Vector3 direction = moveDelta.normalized;
        float castDistance = moveDelta.magnitude + movementWallBuffer;

        return Physics.CapsuleCast(
            point1,
            point2,
            radius,
            direction,
            out hit,
            castDistance,
            obstacleMask,
            QueryTriggerInteraction.Ignore
        );
    }

    /// <summary>
    /// CapsuleCollider의 월드 좌표 기준 양 끝점과 반지름을 계산합니다.
    /// Collider의 Direction과 Transform Scale을 함께 반영합니다.
    /// </summary>
    private void GetMovementCapsule(
        out Vector3 point1,
        out Vector3 point2,
        out float radius)
    {
        Transform colliderTransform = movementCollider.transform;
        Vector3 lossyScale = colliderTransform.lossyScale;

        Vector3 axis;
        float heightScale;
        float radiusScale;

        switch (movementCollider.direction)
        {
            case 0:
                // CapsuleCollider의 길이 방향이 X축인 경우
                axis = colliderTransform.right;
                heightScale = Mathf.Abs(lossyScale.x);
                radiusScale = Mathf.Max(Mathf.Abs(lossyScale.y), Mathf.Abs(lossyScale.z));
                break;

            case 2:
                // CapsuleCollider의 길이 방향이 Z축인 경우
                axis = colliderTransform.forward;
                heightScale = Mathf.Abs(lossyScale.z);
                radiusScale = Mathf.Max(Mathf.Abs(lossyScale.x), Mathf.Abs(lossyScale.y));
                break;

            default:
                // CapsuleCollider의 길이 방향이 Y축인 경우
                axis = colliderTransform.up;
                heightScale = Mathf.Abs(lossyScale.y);
                radiusScale = Mathf.Max(Mathf.Abs(lossyScale.x), Mathf.Abs(lossyScale.z));
                break;
        }

        Vector3 center = colliderTransform.TransformPoint(movementCollider.center);
        radius = movementCollider.radius * radiusScale;

        float height = Mathf.Max(
            movementCollider.height * heightScale,
            radius * 2.0f
        );

        float halfSegment = Mathf.Max(0.0f, height * 0.5f - radius);
        Vector3 normalizedAxis = axis.normalized;

        point1 = center + normalizedAxis * halfSegment;
        point2 = center - normalizedAxis * halfSegment;
    }

    /// <summary>
    /// Trigger가 아닌 이동용 CapsuleCollider를 자동으로 찾습니다.
    /// </summary>
    private CapsuleCollider FindMovementCollider()
    {
        CapsuleCollider[] colliders = GetComponentsInChildren<CapsuleCollider>(true);

        for (int i = 0; i < colliders.Length; i++)
        {
            CapsuleCollider candidate = colliders[i];

            // 상호작용용 Trigger Collider는 이동 충돌 대상으로 사용하지 않습니다.
            if (candidate == null || candidate.isTrigger)
            {
                continue;
            }

            // 현재 플레이어 Rigidbody에 연결된 CapsuleCollider만 선택합니다.
            if (candidate.attachedRigidbody == rb)
            {
                return candidate;
            }
        }

        return null;
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 이동 차단 레이어로 사용합니다.
    /// </summary>
    private LayerMask ResolveMovementObstacleMask()
    {
        if (movementObstacleMask.value != 0)
        {
            return movementObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }

    private void EmitMovementNoise(bool isMoving)
    {
        if (!isMoving || isEvading)
        {
            moveNoiseTimer = 0.0f;
            return;
        }

        // 매 프레임 소음을 만들지 않고, 걷기/달리기 상태에 따라 간격을 두고 보냅니다.
        moveNoiseTimer -= Time.fixedDeltaTime;
        if (moveNoiseTimer > 0.0f)
        {
            return;
        }

        if (sprintInput)
        {
            NoiseSystem.Emit(NoiseType.Run, transform.position, gameObject, runNoiseRange);
            VFXService.Instance?.Play(GameplayVFXIds.PlayerFootstepRun, transform.position, transform.rotation);
            moveNoiseTimer = Mathf.Max(0.05f, runNoiseInterval);
            return;
        }

        NoiseSystem.Emit(NoiseType.Walk, transform.position, gameObject, walkNoiseRange);
        VFXService.Instance?.Play(GameplayVFXIds.PlayerFootstepWalk, transform.position, transform.rotation);
        moveNoiseTimer = Mathf.Max(0.05f, walkNoiseInterval);
    }

    /* 구르기 처리 */
    public void PlayerEvade()
    {
        isEvading = true;

        VFXService.Instance?.Play(GameplayVFXIds.PlayerEvade, transform.position, transform.rotation);

        // 구르기 입력을 애니메이터에 전달
        animator.SetTrigger("Evade");

        // 사운드 재생 이벤트를 AudioManager에 전달하여 구르기를 실행한 지점에서 3D 오디오 재생
        int EvadeAudioID = Evade_AudioIDPool[Random.Range(0, Evade_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(EvadeAudioID, rb.gameObject.transform.position);

        // 구르기 상태 종료는 코루틴으로 처리
        StartCoroutine(EvadeComplete());
    }

    /* 구르기 상태 종료 코루틴 */
    private IEnumerator EvadeComplete()
    {
        yield return new WaitForSeconds(evadeTime);
        isEvading = false;
    }

    /* 스킬 사용 애니메이션 트리거 */
    public void SkillAnimate()
    {
        animator.SetTrigger("UseSkill");

        // 사운드 재생 이벤트를 AudioManager에 전달하여 스킬을 사용한 지점에서 3D 오디오 재생
        int SkillAudioID = Throw_AudioIDPool[Random.Range(0, Throw_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(SkillAudioID, rb.gameObject.transform.position);
    }

    /* 피격 애니메이션 코루틴 */
    public void HitAnimate() => StartCoroutine(HitFaceAnimation());
    public IEnumerator HitFaceAnimation()
    {
        if (apPort != null)
        {
            // 히트 시 이벤트를 받아서 Hit_Face 변수를 1로 만듦
            apPort.SetControlParamFloat("Yuan_Hit_Face", 1);
            yield return new WaitForSeconds(0.75f);
            apPort.SetControlParamFloat("Yuan_Hit_Face", 0);
        }
    }

    /* 마우스 커서가 가리키는 월드 위치 계산 */
    private bool TryGetMouseWorldPoint(out Vector3 worldPoint)
    {
        if (mainCamera == null)
        {
            mainCamera = Camera.main;
        }

        if (mainCamera == null)
        {
            worldPoint = Vector3.zero;
            return false;
        }

        // 총구 높이만큼 보정하여 커서 위치 평면 설정
        Plane plane = new Plane(Vector3.up, transform.position + (Vector3.up * handleHeight));
        Ray ray = mainCamera.ScreenPointToRay(currentMousePos);

        if (plane.Raycast(ray, out float enter))
        {
            worldPoint = ray.GetPoint(enter);
            return true;
        }

        worldPoint = Vector3.zero;
        return false;
    }

    /* 항상 마우스 커서 방향을 바라보도록 실제 몸체 회전 */
    private void AimTowardsMouse()
    {
        // 마우스가 월드를 가리키지 않으면 리턴
        if (!TryGetMouseWorldPoint(out Vector3 worldPoint)) return;

        // (마우스 방향 - 자신의 위치)로 마우스 방향 벡터를 구하고, y축은 0으로 고정하여 바닥 평면 기준으로 계산
        Vector3 dir = worldPoint - transform.position;
        dir.y = 0f;

        // 마우스 방향 변화가 거의 없으면 리턴
        if (dir.sqrMagnitude < 0.001f) return;

        // 물리엔진을 이용해 캐릭터를 회전 (목표 회전 방향으로 보간된 현재 회전 방향 계산 및 적용)
        Quaternion targetRot = Quaternion.LookRotation(dir.normalized);
        Quaternion smoothRot = Quaternion.Slerp(rb.rotation, targetRot, rotationSpeed * Time.fixedDeltaTime);
        rb.MoveRotation(smoothRot);
    }

    /* 이미지가 마우스 커서 방향을 바라보도록 조정 */
    private void ImageTowardsMouse()
    {
        // 마우스가 월드를 가리키지 않으면 리턴
        if (!TryGetMouseWorldPoint(out Vector3 worldPoint)) return;

        // (마우스 방향 - 자신의 위치)로 마우스 방향 벡터를 구하고, y축은 0으로 고정하여 바닥 평면 기준으로 계산
        Vector3 dir = worldPoint - transform.position;
        dir.y = 0f;

        // 마우스 방향을 2D 애니메이터용 방향(상하좌우)으로 변환
        // 쿼터뷰의 이동 계산을 위해 곱했던 isometricYAngle(-45도)의 반대 각도(45도)를 곱하여 화면 기준의 방향을 구함
        Quaternion inverseIsoRotation = Quaternion.Euler(0f, -isometricYAngle, 0f);
        Vector3 aimVisualDir = inverseIsoRotation * dir.normalized;

        // 마우스 방향(aimVisualDir.x)에 따른 시각적 좌우 반전
        if (aimVisualDir.x > 0)
        {
            Body.transform.localScale = new Vector3(-1, 1, 1);
        }
        else if (aimVisualDir.x < 0)
        {
            Body.transform.localScale = new Vector3(1, 1, 1);
        }

        /// 애니 포트레이틑 파라미터 제어를 통한 세밀한 손의 회전(마우스를 향항 총구 조준) ///
        // 마우스 방향을 이용해 팔 회전 각도 계산
        if (apPort != null)
        {
            // 마우스가 캐릭터 기준 위쪽에 있을 때
            if (aimVisualDir.z > 0)
            {
                apPort.SetControlParamFloat("Yuan_B_AimY", -1 * Mathf.Lerp(-1f, 1f, aimVisualDir.z));
            }
            else
            {
                apPort.SetControlParamFloat("Yuan_AimY", Mathf.Lerp(-1f, 1f, Mathf.Abs(aimVisualDir.z)));
            }
        }

        /// 애니메이션 파라미터 ///
        // 키보드 입력이 있으면 true, 없으면 false
        bool isMoving = movementInput.sqrMagnitude > 0.01f;
        animator.SetBool("IsMoving", isMoving);

        int lookDir = 0;
        // Z값이 양수면 위(뒷모습), 음수면 아래(앞모습)
        lookDir = aimVisualDir.z > 0 ? 1 : 0;

        animator.SetInteger("LookDir", lookDir);

        // 달리기 입력이 있으면 true, 없으면 false
        animator.SetBool("IsSprint", sprintInput);
    }

    /* 플레이어 사망 시 이동 및 회전 비활성화 */
    private void PlayerDie(int playerID)
    {
        enabled = false;
        rb.velocity = Vector3.zero;
        animator.SetBool("IsMoving", false);
        animator.SetInteger("LookDir", 0);
        animator.SetTrigger("IsDead");
    }
}
```

### 변경 설명

플레이어 이동 소음 요청의 발생원 참조를 실제 플레이어 transform으로 정리했습니다. 적이 소음 앵커를 통해 탐색할 때 올바른 발생원을 참조하도록 하는 연결 보완입니다.

### 변경 후 스크립트

```cs
﻿using AnyPortrait;
using System.Collections;
/// <summary>
/// 플레이어의 이동과 커서 방향 회전을 처리하는 스크립트
/// </summary>
using UnityEngine;
using UnityEngine.InputSystem;
using static AnyPortrait.apAnimPlayUnit;

public class PlayerMovement : MonoBehaviour
{
    [Header("Player Movement Controll")]
    [SerializeField] private Rigidbody rb;
    [SerializeField] private Camera mainCamera;

    public Vector2 movementInput;                       // 플레이어의 이동 입력
    private bool sprintInput;                           // 플레이어의 달리기 입력
    private Vector2 currentMousePos;                    // 현재 마우스 화면 좌표

    [SerializeField] private float handleHeight = 1f;   // 총구 높이 (마우스 조준 기준 평면을 맞춤)

    private InputAction moveAction;                     // 플레이어 이동 이벤트 캐시
    private InputAction sprintAction;                   // 플레이어 달리기 이벤트 캐시
    private InputAction aimAction;                      // 마우스 조준 이벤트 캐시

    private readonly float isometricYAngle = +45.0f;    // 쿼터뷰 기준 이동 방향 보정
    public float moveSpeed;                             // 이동 속도
    public float rotationSpeed = 1000f;                 // 회전 속도
    private float artifactMoveSpeedRate;                // 아티팩트로 추가되는 이동 속도 증가율

    public float sprintSpeed;                           // 달리기 중 이동 속도
    public float sprintMP;                              // 달리기 중 초당 MP 소비

    public bool isEvading;                              // 구르기 상태 체크
    public float evadeSpeed;                            // 구르기 이동 속도
    public float evadeTime;                             // 구르기 동작 시간
    public float evadeMP;                               // 구르기 MP 소비
    public float evadeCooltime;                         // 구르기 쿨타임

    [Header("Collision Guard")]
    [SerializeField] private CapsuleCollider movementCollider; // 실제 몸통 이동 충돌에 사용할 CapsuleCollider
    [SerializeField] private LayerMask movementObstacleMask; // 이동/구르기 중 관통을 막을 벽 레이어
    [SerializeField] private float movementWallBuffer = 0.05f; // 벽 앞에서 멈추도록 남기는 여유 거리

    [Header("Movement Audio")]
    public int[] FootStep_AudioIDPool = null;           // 이동 사운드 ID 리스트
    public int[] InDoor_FootStep_AudioIDPool = null;    // 실내 이동 사운드 ID 리스트 (실외/실내 구분 가능한 경우 실내에서 사용)
    public int[] Evade_AudioIDPool = null;              // 구르기 사운드 ID 리스트
    public int[] Throw_AudioIDPool = null;              // 스킬 동작 사운드 ID 리스트

    private float lastFootstepTime;                     // 최근 이동 사운드 출력 시점
    public float FootStep_SoundTime = 10.0f;            // 이동 사운드 ID 출력 시간 기준 값

    [Header("Noise Settings")]
    // 발소리는 "플레이어 이동 입력"이 아니라 실제 이동 중일 때 일정 간격으로만 발생시킵니다.
    [SerializeField] private float walkNoiseRange = 1.0f;
    [SerializeField] private float runNoiseRange = 20.0f;
    [SerializeField] private float walkNoiseInterval = 0.55f;
    [SerializeField] private float runNoiseInterval = 0.3f;

    [Header("Player Animation Controll")]
    [SerializeField] private Animator animator;
    [SerializeField] private GameObject Body;

    [SerializeField] public apPortrait apPort;              // AnyPortrait 캐릭터 애니메이션 컨트롤러

    private float moveNoiseTimer;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        if (mainCamera == null)
        {
            mainCamera = Camera.main;
        }

        // 이동에 반드시 필요한 컴포넌트가 없으면 비활성화
        // Additive 씬 로드 타이밍상 Camera.main은 플레이어보다 늦게 잡힐 수 있으므로 카메라 누락만으로 이동을 막지 않습니다.
        if (rb == null || animator == null)
        {
            enabled = false;
            Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 실제 이동 충돌에 사용할 Trigger가 아닌 CapsuleCollider를 자동으로 찾습니다.
        if (movementCollider == null)
        {
            movementCollider = FindMovementCollider();
        }

        // 상호작용용 Trigger Collider가 아니라 실제 몸통 CapsuleCollider가 필요합니다.
        if (movementCollider == null)
        {
            Debug.LogError("PlayerMovement: Movement Collider에 Trigger가 아닌 CapsuleCollider를 연결해야 합니다.");
        }

        if (apPort != null)
        {
            apPort.enabled = true;
            if (apPort.gameObject != null) apPort.gameObject.SetActive(true);
        }

        lastFootstepTime = Time.time;
    }

    private void OnEnable()
    {
        if (GlobalEventBus.OnGetInputAction != null)
        {
            moveAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Move");
            if (moveAction != null)
            {
                moveAction.Enable();
                moveAction.performed += OnMoveInput;
                moveAction.canceled += OnMoveCanceled;
            }

            sprintAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Sprint");
            if (sprintAction != null)
            {
                sprintAction.Enable();
                sprintAction.performed += OnSprintInputPerformed;
                sprintAction.canceled += OnSprintInputCanceled;
            }

            aimAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Look");
            if (aimAction != null)
            {
                aimAction.Enable();
                aimAction.performed += OnAimInput;
                aimAction.canceled += OnAimInput;
            }
        }

        GlobalEventBus.SendCanSprint += PlayerSprint;
        GlobalEventBus.SendCannotSprint += PlayerSprint;
        GlobalEventBus.OnMainActiveSkillCasted += SkillAnimate;
        GlobalEventBus.OnHitAnimate += HitAnimate;
        GlobalEventBus.onPlayerDead += PlayerDie;
    }

    private void OnDisable()
    {
        if (moveAction != null)
        {
            moveAction.performed -= OnMoveInput;
            moveAction.canceled -= OnMoveCanceled;
            moveAction.Disable();
        }

        if (sprintAction != null)
        {
            sprintAction.performed -= OnSprintInputPerformed;
            sprintAction.canceled -= OnSprintInputCanceled;
            sprintAction.Disable();
        }

        if (aimAction != null)
        {
            aimAction.performed -= OnAimInput;
            aimAction.canceled -= OnAimInput;
            aimAction.Disable();
        }

        GlobalEventBus.SendCanSprint -= PlayerSprint;
        GlobalEventBus.SendCannotSprint -= PlayerSprint;
        GlobalEventBus.OnMainActiveSkillCasted -= SkillAnimate;
        GlobalEventBus.OnHitAnimate -= HitAnimate;
        GlobalEventBus.onPlayerDead -= PlayerDie;
        moveNoiseTimer = 0.0f;

        // 비활성화 시 입력 상태를 초기화하여
        // 재활성화 시 이전 입력 값이 남아 걷기 모션이 유지되는 것을 방지
        movementInput = Vector2.zero;
        sprintInput = false;
        if (animator != null)
        {
            animator.SetBool("IsMoving", false);
            animator.SetBool("IsSprint", false);
        }
    }

    private void FixedUpdate()
    {
        // 메인 카메라 연결이 끊겼다면 갱신
        if (mainCamera == null && Camera.main != null)
        {
            mainCamera = Camera.main;
        }

        MoveAndRotate();
    }

    public void initialize(CharacterData _charData)
    {
        // 기본 이동 속도 초기화
        moveSpeed = _charData.moveSpeed;

        // 달리기 속도 초기화
        sprintSpeed = _charData.sprintSpeed;

        // 달리기 중 초당 MP 소비 초기화
        sprintMP = _charData.sprintMana;

        // 구르기 이동 거리(속도 × 시간) 초기화
        evadeSpeed = _charData.evadeSpeed;
        evadeTime = _charData.evadeTime;

        // 구르기 MP 소비 초기화
        evadeMP = _charData.evadeMana;

        // 구르기 쿨타임 초기화
        evadeCooltime = _charData.evadeCooltime;

        artifactMoveSpeedRate = 0.0f;
        movementWallBuffer = Mathf.Max(0.0f, movementWallBuffer);
    }

    /// <summary>
    /// 아티팩트 장착 효과로 추가되는 이동 속도 증가율을 갱신합니다.
    /// 원본 moveSpeed/sprintSpeed를 직접 바꾸지 않고, 실제 이동 계산에서만 배율로 적용합니다.
    /// </summary>
    public void ApplyArtifactMoveSpeedBonus(float moveSpeedRate)
    {
        artifactMoveSpeedRate = Mathf.Max(0.0f, moveSpeedRate);
    }

    /* 플레이어 이동 입력 갱신 */
    private void OnMoveInput(InputAction.CallbackContext context) => movementInput = context.ReadValue<Vector2>();

    /* 플레이어 이동 입력 종료 */
    private void OnMoveCanceled(InputAction.CallbackContext context) => movementInput = Vector2.zero;

    /* 플레이어 달리기 입력 이벤트 */
    private void OnSprintInputPerformed(InputAction.CallbackContext context) => GlobalEventBus.OnSprintInput?.Invoke(true);
    private void OnSprintInputCanceled(InputAction.CallbackContext context) => GlobalEventBus.OnSprintInput?.Invoke(false);

    /* 플레이어 달리기 허용 상태 갱신 (PlayerStatus에서 수신) */
    private void PlayerSprint(bool sprint) => sprintInput = sprint;

    private void OnAimInput(InputAction.CallbackContext context) => UpdateMousePos(context.ReadValue<Vector2>());

    /* 마우스 화면 좌표 갱신 */
    private void UpdateMousePos(Vector2 _mousePos) => currentMousePos = _mousePos;

    /* 이동과 회전 처리 */
    private void MoveAndRotate()
    {
        Vector3 inputDir = new Vector3(movementInput.x, 0f, movementInput.y);
        Quaternion isoRotation = Quaternion.Euler(0f, isometricYAngle, 0f);
        Vector3 movement = (isoRotation * inputDir).normalized;

        float moveSpeedMultiplier = 1.0f + artifactMoveSpeedRate;
        float currentMoveSpeed = moveSpeed * moveSpeedMultiplier;
        float currentSprintSpeed = sprintSpeed * moveSpeedMultiplier;
        float finalMoveSpeed = isEvading ? evadeSpeed : (sprintInput ? currentSprintSpeed : currentMoveSpeed);

        // 걷기, 달리기, 구르기 모두 실제 몸통 CapsuleCollider로 이동 경로를 검사합니다.
        Vector3 desiredMoveDelta = movement * finalMoveSpeed * Time.fixedDeltaTime;
        Vector3 safeMoveDelta = ResolveMovementDelta(desiredMoveDelta);
        Vector3 targetPosition = rb.position + safeMoveDelta;

        // 달리기 중 MP 소비 이벤트 전달
        if (movement.sqrMagnitude > 0.001f && sprintInput)
        {
            GlobalEventBus.OnSprintManaConsume?.Invoke(sprintMP);
            GlobalEventBus.OnSprintInput?.Invoke(sprintInput);
        }

        rb.MovePosition(targetPosition);
        ClearHorizontalVelocity();
        EmitMovementNoise(movement.sqrMagnitude > 0.001f);

        // 이동 방향에 따라 바라보는 방향 회전
        if (movementInput.x > 0)
        {
            Body.transform.localScale = new Vector3(-1, 1, 1);
        }
        else if (movementInput.x < 0)
        {
            Body.transform.localScale = new Vector3(1, 1, 1);
        }

        // 위치 이동 중 정해진 시간 간격마다 이동 사운드를 재생
        if (movement.sqrMagnitude >= 0.1f) FootStepAudio();

        AimTowardsMouse();
        ImageTowardsMouse();
    }

    private void FootStepAudio()
    {
        float walkFootStepTime = FootStep_SoundTime / moveSpeed;      // 걷기 사운드 재생 간격(초)
        float sprintFootStepTime = FootStep_SoundTime / sprintSpeed;  // 달리기 사운드 재생 간격(초)

        // 달리기 중인지에 따라 사운드 재생 간격 선택
        float footstepPeriod = sprintInput ? sprintFootStepTime : walkFootStepTime;

        // 최근 사운드 재생 시점으로부터 재생 간격만큼 지났는지 확인
        if (Time.time < lastFootstepTime + footstepPeriod) return;

        // 사운드 재생 이벤트를 AudioManager에 전달하여 구르기를 실행한 지점에서 3D 오디오 재생
        int moveAudioID = FootStep_AudioIDPool[Random.Range(0, FootStep_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(moveAudioID, rb.gameObject.transform.position);

        // 최근 사운드 재생 시점 갱신
        lastFootstepTime = Time.time;
    }

    /// <summary>
    /// MovePosition 이후 Rigidbody에 남은 수평 속도를 정리합니다.
    /// 벽에 비비며 구른 뒤 입력을 떼었을 때 충돌 분리 속도 때문에 미끄러지는 현상을 줄입니다.
    /// </summary>
    private void ClearHorizontalVelocity()
    {
        Vector3 velocity = rb.velocity;
        velocity.x = 0.0f;
        velocity.z = 0.0f;
        rb.velocity = velocity;
        rb.angularVelocity = Vector3.zero;
    }

    /// <summary>
    /// 실제 이동용 CapsuleCollider만 사용해 벽 관통을 막고 벽면 슬라이딩을 계산합니다.
    /// 상호작용용 Trigger Collider는 이동 검사 형상에 포함하지 않습니다.
    /// </summary>
    private Vector3 ResolveMovementDelta(Vector3 desiredDelta)
    {
        desiredDelta.y = 0.0f;

        if (desiredDelta.sqrMagnitude <= 0.0001f)
        {
            return Vector3.zero;
        }

        if (movementCollider == null || ResolveMovementObstacleMask().value == 0)
        {
            return desiredDelta;
        }

        // 첫 이동 경로에 벽이 없으면 원래 이동량을 그대로 사용합니다.
        if (!TryCastMovement(desiredDelta, Vector3.zero, out RaycastHit firstHit))
        {
            return desiredDelta;
        }

        float desiredDistance = desiredDelta.magnitude;

        // 벽에 닿기 전까지 이동할 수 있는 거리를 계산합니다.
        float forwardDistance = Mathf.Clamp(
            firstHit.distance - movementWallBuffer,
            0.0f,
            desiredDistance
        );

        Vector3 forwardDelta = desiredDelta.normalized * forwardDistance;
        Vector3 remainingDelta = desiredDelta - forwardDelta;

        // 벽에 비스듬히 닿았을 때 남은 이동량을 벽면 방향으로 투영합니다.
        Vector3 slideDelta = Vector3.ProjectOnPlane(remainingDelta, firstHit.normal);
        slideDelta.y = 0.0f;

        if (slideDelta.sqrMagnitude <= 0.0001f)
        {
            return forwardDelta;
        }

        // 벽면을 따라 이동하는 중 다른 벽에 부딪히는지 다시 검사합니다.
        if (!TryCastMovement(slideDelta, forwardDelta, out RaycastHit slideHit))
        {
            return forwardDelta + slideDelta;
        }

        float slideDistance = Mathf.Clamp(
            slideHit.distance - movementWallBuffer,
            0.0f,
            slideDelta.magnitude
        );

        return forwardDelta + slideDelta.normalized * slideDistance;
    }

    /// <summary>
    /// 실제 몸통 CapsuleCollider 형상만 이동시켜 장애물과의 충돌을 검사합니다.
    /// 상호작용용 Trigger Collider는 검사 형상에 포함되지 않습니다.
    /// </summary>
    private bool TryCastMovement(
        Vector3 moveDelta,
        Vector3 startOffset,
        out RaycastHit hit)
    {
        hit = default;

        if (movementCollider == null || !movementCollider.enabled)
        {
            return false;
        }

        if (moveDelta.sqrMagnitude <= 0.0001f)
        {
            return false;
        }

        LayerMask obstacleMask = ResolveMovementObstacleMask();
        if (obstacleMask.value == 0)
        {
            return false;
        }

        GetMovementCapsule(
            out Vector3 point1,
            out Vector3 point2,
            out float radius
        );

        // 첫 충돌 지점까지 이동한 위치에서 두 번째 검사를 수행할 수 있도록 시작점을 보정합니다.
        point1 += startOffset;
        point2 += startOffset;

        Vector3 direction = moveDelta.normalized;
        float castDistance = moveDelta.magnitude + movementWallBuffer;

        return Physics.CapsuleCast(
            point1,
            point2,
            radius,
            direction,
            out hit,
            castDistance,
            obstacleMask,
            QueryTriggerInteraction.Ignore
        );
    }

    /// <summary>
    /// CapsuleCollider의 월드 좌표 기준 양 끝점과 반지름을 계산합니다.
    /// Collider의 Direction과 Transform Scale을 함께 반영합니다.
    /// </summary>
    private void GetMovementCapsule(
        out Vector3 point1,
        out Vector3 point2,
        out float radius)
    {
        Transform colliderTransform = movementCollider.transform;
        Vector3 lossyScale = colliderTransform.lossyScale;

        Vector3 axis;
        float heightScale;
        float radiusScale;

        switch (movementCollider.direction)
        {
            case 0:
                // CapsuleCollider의 길이 방향이 X축인 경우
                axis = colliderTransform.right;
                heightScale = Mathf.Abs(lossyScale.x);
                radiusScale = Mathf.Max(Mathf.Abs(lossyScale.y), Mathf.Abs(lossyScale.z));
                break;

            case 2:
                // CapsuleCollider의 길이 방향이 Z축인 경우
                axis = colliderTransform.forward;
                heightScale = Mathf.Abs(lossyScale.z);
                radiusScale = Mathf.Max(Mathf.Abs(lossyScale.x), Mathf.Abs(lossyScale.y));
                break;

            default:
                // CapsuleCollider의 길이 방향이 Y축인 경우
                axis = colliderTransform.up;
                heightScale = Mathf.Abs(lossyScale.y);
                radiusScale = Mathf.Max(Mathf.Abs(lossyScale.x), Mathf.Abs(lossyScale.z));
                break;
        }

        Vector3 center = colliderTransform.TransformPoint(movementCollider.center);
        radius = movementCollider.radius * radiusScale;

        float height = Mathf.Max(
            movementCollider.height * heightScale,
            radius * 2.0f
        );

        float halfSegment = Mathf.Max(0.0f, height * 0.5f - radius);
        Vector3 normalizedAxis = axis.normalized;

        point1 = center + normalizedAxis * halfSegment;
        point2 = center - normalizedAxis * halfSegment;
    }

    /// <summary>
    /// Trigger가 아닌 이동용 CapsuleCollider를 자동으로 찾습니다.
    /// </summary>
    private CapsuleCollider FindMovementCollider()
    {
        CapsuleCollider[] colliders = GetComponentsInChildren<CapsuleCollider>(true);

        for (int i = 0; i < colliders.Length; i++)
        {
            CapsuleCollider candidate = colliders[i];

            // 상호작용용 Trigger Collider는 이동 충돌 대상으로 사용하지 않습니다.
            if (candidate == null || candidate.isTrigger)
            {
                continue;
            }

            // 현재 플레이어 Rigidbody에 연결된 CapsuleCollider만 선택합니다.
            if (candidate.attachedRigidbody == rb)
            {
                return candidate;
            }
        }

        return null;
    }

    /// <summary>
    /// 인스펙터에서 따로 지정하지 않았으면 프로젝트의 Wall 레이어를 기본 이동 차단 레이어로 사용합니다.
    /// </summary>
    private LayerMask ResolveMovementObstacleMask()
    {
        if (movementObstacleMask.value != 0)
        {
            return movementObstacleMask;
        }

        int wallLayer = LayerMask.NameToLayer("Wall");
        return wallLayer >= 0 ? 1 << wallLayer : 0;
    }

    private void EmitMovementNoise(bool isMoving)
    {
        if (!isMoving || isEvading)
        {
            moveNoiseTimer = 0.0f;
            return;
        }

        // 매 프레임 소음을 만들지 않고, 걷기/달리기 상태에 따라 간격을 두고 보냅니다.
        moveNoiseTimer -= Time.fixedDeltaTime;
        if (moveNoiseTimer > 0.0f)
        {
            return;
        }

        if (sprintInput)
        {
            NoiseSystem.Emit(NoiseType.Run, transform.position, gameObject, runNoiseRange);
            VFXService.Instance?.Play(GameplayVFXIds.PlayerFootstepRun, transform.position, transform.rotation);
            moveNoiseTimer = Mathf.Max(0.05f, runNoiseInterval);
            return;
        }

        NoiseSystem.Emit(NoiseType.Walk, transform.position, gameObject, walkNoiseRange);
        VFXService.Instance?.Play(GameplayVFXIds.PlayerFootstepWalk, transform.position, transform.rotation);
        moveNoiseTimer = Mathf.Max(0.05f, walkNoiseInterval);
    }

    /* 구르기 처리 */
    public void PlayerEvade()
    {
        isEvading = true;

        VFXService.Instance?.Play(GameplayVFXIds.PlayerEvade, transform.position, transform.rotation);

        // 구르기 입력을 애니메이터에 전달
        animator.SetTrigger("Evade");

        // 사운드 재생 이벤트를 AudioManager에 전달하여 구르기를 실행한 지점에서 3D 오디오 재생
        int EvadeAudioID = Evade_AudioIDPool[Random.Range(0, Evade_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(EvadeAudioID, rb.gameObject.transform.position);

        // 구르기 상태 종료는 코루틴으로 처리
        StartCoroutine(EvadeComplete());
    }

    /* 구르기 상태 종료 코루틴 */
    private IEnumerator EvadeComplete()
    {
        yield return new WaitForSeconds(evadeTime);
        isEvading = false;
    }

    /* 스킬 사용 애니메이션 트리거 */
    public void SkillAnimate()
    {
        animator.SetTrigger("UseSkill");

        // 사운드 재생 이벤트를 AudioManager에 전달하여 스킬을 사용한 지점에서 3D 오디오 재생
        int SkillAudioID = Throw_AudioIDPool[Random.Range(0, Throw_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(SkillAudioID, rb.gameObject.transform.position);
    }

    /* 피격 애니메이션 코루틴 */
    public void HitAnimate() => StartCoroutine(HitFaceAnimation());
    public IEnumerator HitFaceAnimation()
    {
        if (apPort != null)
        {
            // 히트 시 이벤트를 받아서 Hit_Face 변수를 1로 만듦
            apPort.SetControlParamFloat("Yuan_Hit_Face", 1);
            yield return new WaitForSeconds(0.75f);
            apPort.SetControlParamFloat("Yuan_Hit_Face", 0);
        }
    }

    /* 마우스 커서가 가리키는 월드 위치 계산 */
    private bool TryGetMouseWorldPoint(out Vector3 worldPoint)
    {
        if (mainCamera == null)
        {
            mainCamera = Camera.main;
        }

        if (mainCamera == null)
        {
            worldPoint = Vector3.zero;
            return false;
        }

        // 총구 높이만큼 보정하여 커서 위치 평면 설정
        Plane plane = new Plane(Vector3.up, transform.position + (Vector3.up * handleHeight));
        Ray ray = mainCamera.ScreenPointToRay(currentMousePos);

        if (plane.Raycast(ray, out float enter))
        {
            worldPoint = ray.GetPoint(enter);
            return true;
        }

        worldPoint = Vector3.zero;
        return false;
    }

    /* 항상 마우스 커서 방향을 바라보도록 실제 몸체 회전 */
    private void AimTowardsMouse()
    {
        // 마우스가 월드를 가리키지 않으면 리턴
        if (!TryGetMouseWorldPoint(out Vector3 worldPoint)) return;

        // (마우스 방향 - 자신의 위치)로 마우스 방향 벡터를 구하고, y축은 0으로 고정하여 바닥 평면 기준으로 계산
        Vector3 dir = worldPoint - transform.position;
        dir.y = 0f;

        // 마우스 방향 변화가 거의 없으면 리턴
        if (dir.sqrMagnitude < 0.001f) return;

        // 물리엔진을 이용해 캐릭터를 회전 (목표 회전 방향으로 보간된 현재 회전 방향 계산 및 적용)
        Quaternion targetRot = Quaternion.LookRotation(dir.normalized);
        Quaternion smoothRot = Quaternion.Slerp(rb.rotation, targetRot, rotationSpeed * Time.fixedDeltaTime);
        rb.MoveRotation(smoothRot);
    }

    /* 이미지가 마우스 커서 방향을 바라보도록 조정 */
    private void ImageTowardsMouse()
    {
        // 마우스가 월드를 가리키지 않으면 리턴
        if (!TryGetMouseWorldPoint(out Vector3 worldPoint)) return;

        // (마우스 방향 - 자신의 위치)로 마우스 방향 벡터를 구하고, y축은 0으로 고정하여 바닥 평면 기준으로 계산
        Vector3 dir = worldPoint - transform.position;
        dir.y = 0f;

        // 마우스 방향을 2D 애니메이터용 방향(상하좌우)으로 변환
        // 쿼터뷰의 이동 계산을 위해 곱했던 isometricYAngle(-45도)의 반대 각도(45도)를 곱하여 화면 기준의 방향을 구함
        Quaternion inverseIsoRotation = Quaternion.Euler(0f, -isometricYAngle, 0f);
        Vector3 aimVisualDir = inverseIsoRotation * dir.normalized;

        // 마우스 방향(aimVisualDir.x)에 따른 시각적 좌우 반전
        if (aimVisualDir.x > 0)
        {
            Body.transform.localScale = new Vector3(-1, 1, 1);
        }
        else if (aimVisualDir.x < 0)
        {
            Body.transform.localScale = new Vector3(1, 1, 1);
        }

        /// 애니 포트레이틑 파라미터 제어를 통한 세밀한 손의 회전(마우스를 향항 총구 조준) ///
        // 마우스 방향을 이용해 팔 회전 각도 계산
        if (apPort != null)
        {
            // 마우스가 캐릭터 기준 위쪽에 있을 때
            if (aimVisualDir.z > 0)
            {
                apPort.SetControlParamFloat("Yuan_B_AimY", -1 * Mathf.Lerp(-1f, 1f, aimVisualDir.z));
            }
            else
            {
                apPort.SetControlParamFloat("Yuan_AimY", Mathf.Lerp(-1f, 1f, Mathf.Abs(aimVisualDir.z)));
            }
        }

        /// 애니메이션 파라미터 ///
        // 키보드 입력이 있으면 true, 없으면 false
        bool isMoving = movementInput.sqrMagnitude > 0.01f;
        animator.SetBool("IsMoving", isMoving);

        int lookDir = 0;
        // Z값이 양수면 위(뒷모습), 음수면 아래(앞모습)
        lookDir = aimVisualDir.z > 0 ? 1 : 0;

        animator.SetInteger("LookDir", lookDir);

        // 달리기 입력이 있으면 true, 없으면 false
        animator.SetBool("IsSprint", sprintInput);
    }

    /* 플레이어 사망 시 이동 및 회전 비활성화 */
    private void PlayerDie(int playerID)
    {
        enabled = false;
        rb.velocity = Vector3.zero;
        animator.SetBool("IsMoving", false);
        animator.SetInteger("LookDir", 0);
        animator.SetTrigger("IsDead");
    }
}
```
{% endraw %}
