---
title: "2026-07-14_vfx_tutorial_script_compare"
date: 2026-07-14 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 문서 개요 이 문서는 2026년 7월 14일 사용자가 직접 요청해 구현·수정한 VFX와 튜토리얼 스크립트만 대상으로 한다. 같은 날 다른 작업자가 수정한 코드는 포함하지 않는다. 구분 이전 기준 현재 기준 내용 VFX 시스템 00489d3 5381ff4 카탈로그·풀링·전체 인게임 "
description: "1. 문서 개요 이 문서는 2026년 7월 14일 사용자가 직접 요청해 구현·수정한 VFX와 튜토리얼 스크립트만 대상으로 한다. 같은 날 다른 작업자가 수정한 코드는 포함하지 않는다. 구분 이전 기준 현재 기준 내용 VFX 시스템 00489d3 5381ff4 카탈로그·풀링·전체 인게임 "
published: false
migration_id: "39d36532580e815ebb90f691d1cb6b12"
migration_status: "review_required"
migration_flags: ["local_code_link_unlinked", "publication_review"]
---

{% raw %}
## 1. 문서 개요

이 문서는 2026년 7월 14일 사용자가 직접 요청해 구현·수정한 VFX와 튜토리얼 스크립트만 대상으로 한다. 같은 날 다른 작업자가 수정한 코드는 포함하지 않는다.

<table fit-page-width="true" header-row="true">
<tr>
<td>
구분
</td>
<td>
이전 기준
</td>
<td>
현재 기준
</td>
<td>
내용
</td>
</tr>
<tr>
<td>
VFX 시스템
</td>
<td>
00489d3
</td>
<td>
5381ff4
</td>
<td>
카탈로그·풀링·전체 인게임 이벤트 연결 및 반환 오류 수정
</td>
</tr>
<tr>
<td>
튜토리얼 시스템
</td>
<td>
08f5d21
</td>
<td>
bdef1c6
</td>
<td>
팝업·트리거·이벤트·프리팹·씬 전용 NavMesh 구성
</td>
</tr>
</table>


각 파일은 이전 스크립트 전체 → 변경 이유와 동작 설명 → 현재 스크립트 전체 순서로 기록한다. 신규 파일은 이전 버전이 없다고 표시한다.


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
VFX 핵심 신규
</td>
<td>
GameplayVFXIds, GameplayVFXPresenter, PooledVFX, VFXCatalog, VFXContext, VFXRuntimePool, VFXService
</td>
</tr>
<tr>
<td>
VFX 이벤트 연결
</td>
<td>
SkillEffectProcessor, SpawnManager, DoorInteractable, DropItem, EnemyMovement, EnemyStatus, ExitPoint, GrenadeProjectile, ItemBox, PlayerArtifactEquipment, PlayerInventory, PlayerMovement, PlayerStatus, PlayerWeapon
</td>
</tr>
<tr>
<td>
튜토리얼 런타임 신규
</td>
<td>
TutorialMessageCatalog, TutorialPopup, TutorialManager, TutorialTrigger, TutorialEventBridge
</td>
</tr>
<tr>
<td>
튜토리얼 에디터 신규
</td>
<td>
TutorialPrefabBuilder, TutorialNavMeshBuilder, TutorialInteractionInstaller
</td>
</tr>
</table>

---

## 3. GameplayVFXIds.cs

### 3-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 3-2. 변경 설명

게임 로직이 문자열을 직접 흩어 쓰지 않도록 37개 VFX 식별자를 한곳에 모았다. 카탈로그 키와 호출부가 같은 상수를 사용해 오타와 이름 불일치를 줄인다.

### 3-3. 현재 스크립트 전체

```cs
/// <summary>
/// 코드에서 발생하는 고정 게임 이벤트와 VFXCatalog의 문자열 ID를 연결합니다.
/// 스킬처럼 Excel/JSON에 ID가 있는 콘텐츠는 이 목록에 추가하지 않고 데이터 값을 그대로 사용합니다.
/// </summary>
public static class GameplayVFXIds
{
    public const string PlayerSpawn = "VFX_Player_Spawn";
    public const string PlayerMuzzle = "VFX_Player_Muzzle";
    public const string BulletImpactEnemy = "VFX_Bullet_Impact_Enemy";
    public const string BulletImpactWorld = "VFX_Bullet_Impact_World";
    public const string PlayerHit = "VFX_Player_Hit";
    public const string PlayerDeath = "VFX_Player_Death";
    public const string PlayerEvade = "VFX_Player_Evade";
    public const string PlayerFootstepWalk = "VFX_Player_Footstep_Walk";
    public const string PlayerFootstepRun = "VFX_Player_Footstep_Run";
    public const string PlayerHeal = "VFX_Player_Heal";
    public const string PlayerManaGain = "VFX_Player_ManaGain";
    public const string ArtifactEquip = "VFX_Artifact_Equip";
    public const string ArtifactUnequip = "VFX_Artifact_Unequip";
    public const string LucidMark01 = "VFX_LucidMark_01";
    public const string LucidMark02 = "VFX_LucidMark_02";
    public const string LucidLeak = "VFX_LucidLeak";

    public const string EnemySpawn = "VFX_Enemy_Spawn";
    public const string EnemyDetected = "VFX_Enemy_Detected";
    public const string EnemyInvestigate = "VFX_Enemy_Investigate";
    public const string EnemyAttackTelegraph = "VFX_Enemy_AttackTelegraph";
    public const string EnemySlash01 = "VFX_Enemy_Slash_01";
    public const string EnemySlash02 = "VFX_Enemy_Slash_02";
    public const string EnemyHit = "VFX_Enemy_Hit";
    public const string EnemyDeath = "VFX_Enemy_Death";

    public const string ItemDrop = "VFX_Item_Drop";
    public const string ItemPickup = "VFX_Item_Pickup";
    public const string ChestOpen = "VFX_Chest_Open";
    public const string DoorOpen = "VFX_Door_Open";
    public const string DoorClose = "VFX_Door_Close";

    public const string EscapeChannel = "VFX_Escape_Channel";
    public const string EscapeCancel = "VFX_Escape_Cancel";
    public const string EscapeSuccess = "VFX_Escape_Success";
    public const string TimePenalty = "VFX_Time_Penalty";
    public const string TimeOver = "VFX_Time_Over";
}
```

---

## 4. GameplayVFXPresenter.cs

### 4-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 4-2. 변경 설명

전역 게임 이벤트를 구독해 각 이벤트를 위치와 방향이 포함된 VFXContext로 변환한다. 이벤트 구독과 해제를 한 쌍으로 관리하고, 씬의 개별 시스템이 VFX 풀 구현을 알지 못하게 한다.

### 4-3. 현재 스크립트 전체

```cs
using UnityEngine;

/// <summary>
/// 위치 정보가 있는 전역 게임 이벤트를 공통 VFX 서비스에 연결합니다.
/// 충돌 지점처럼 정밀한 좌표가 필요한 이벤트는 각 판정 스크립트에서 직접 요청합니다.
/// </summary>
public sealed class GameplayVFXPresenter : MonoBehaviour
{
    private Transform currentPlayer;

    private void OnEnable()
    {
        GlobalEventBus.OnPlayerSpawned += HandlePlayerSpawned;
        GlobalEventBus.OnTimePenaltyRequested += HandleTimePenalty;
        GlobalEventBus.OnTimeOver += HandleTimeOver;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnPlayerSpawned -= HandlePlayerSpawned;
        GlobalEventBus.OnTimePenaltyRequested -= HandleTimePenalty;
        GlobalEventBus.OnTimeOver -= HandleTimeOver;
    }

    private void HandlePlayerSpawned(GameObject player)
    {
        if (player == null)
            return;

        currentPlayer = player.transform;
        VFXService.Instance?.Play(GameplayVFXIds.PlayerSpawn, currentPlayer.position, currentPlayer.rotation);
    }

    private void HandleTimePenalty(float penaltySeconds)
    {
        if (penaltySeconds <= 0.0f || !TryGetPlayerPosition(out Vector3 position))
            return;

        VFXService.Instance?.Play(GameplayVFXIds.TimePenalty, position);
    }

    private void HandleTimeOver()
    {
        if (TryGetPlayerPosition(out Vector3 position))
            VFXService.Instance?.Play(GameplayVFXIds.TimeOver, position);
    }

    private bool TryGetPlayerPosition(out Vector3 position)
    {
        if (currentPlayer == null)
        {
            PlayerStatus playerStatus = FindFirstObjectByType<PlayerStatus>();
            currentPlayer = playerStatus != null ? playerStatus.transform : null;
        }

        position = currentPlayer != null ? currentPlayer.position : Vector3.zero;
        return currentPlayer != null;
    }
}
```

---

## 5. PooledVFX.cs

### 5-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 5-2. 변경 설명

파티클 재생 종료와 수명 제한을 감시해 인스턴스를 런타임 풀로 반환한다. 이후 수정에서 OnDisable 반환 시 SetActive(false)를 재호출하지 않고 대기열 등록과 부모 복원만 수행하도록 분리해 중복 비활성화 오류를 막았다.

### 5-3. 현재 스크립트 전체

```cs
using System.Collections;
using UnityEngine;

/// <summary>
/// 풀에서 대여된 VFX의 재생 상태와 자동 반환 시점을 관리합니다.
/// </summary>
public sealed class PooledVFX : MonoBehaviour
{
    private VFXRuntimePool owner;
    private ParticleSystem[] particles;
    private TrailRenderer[] trails;
    private Animator[] animators;
    private Coroutine returnRoutine;
    private bool isRented;

    private void Awake()
    {
        CacheComponents();
    }

    internal void Play(VFXRuntimePool pool, VFXCatalogEntry entry)
    {
        owner = pool;
        isRented = true;
        CacheComponents();

        if (returnRoutine != null)
            StopCoroutine(returnRoutine);

        foreach (TrailRenderer trail in trails)
            trail.Clear();

        foreach (Animator animator in animators)
        {
            animator.Rebind();
            animator.Update(0f);
        }

        foreach (ParticleSystem particle in particles)
        {
            particle.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            particle.Play(true);
        }

        switch (entry.ReturnType)
        {
            case VFXReturnType.ParticleStopped:
                returnRoutine = StartCoroutine(ReturnWhenParticlesStop(entry.Duration, entry.UseUnscaledTime));
                break;
            case VFXReturnType.Duration:
                returnRoutine = StartCoroutine(ReturnAfterDelay(entry.Duration, entry.UseUnscaledTime));
                break;
        }
    }

    /// <summary>
    /// 지속형 또는 Animation Event 기반 VFX를 명시적으로 풀에 반환합니다.
    /// </summary>
    public void Release()
    {
        ReleaseToPool(true);
    }

    /// <summary>
    /// 비활성화가 이미 진행 중이면 SetActive(false)를 반복하지 않고 풀 상태만 복원합니다.
    /// </summary>
    private void ReleaseToPool(bool deactivate)
    {
        if (!isRented)
            return;

        isRented = false;
        if (returnRoutine != null)
        {
            StopCoroutine(returnRoutine);
            returnRoutine = null;
        }

        owner?.Release(this, deactivate);
    }

    internal void DetachFromPool()
    {
        owner = null;
        isRented = false;
    }

    private void OnDisable()
    {
        // 부모 캐릭터가 비활성화돼 VFX도 함께 꺼진 경우 풀에서 유실되지 않도록 즉시 반환합니다.
        if (isRented)
            ReleaseToPool(false);
    }

    private void OnDestroy()
    {
        // 부착 대상과 함께 파괴된 인스턴스를 풀의 전체 개수에서 제거합니다.
        owner?.RemoveDestroyed(this);
    }

    private IEnumerator ReturnWhenParticlesStop(float fallbackDuration, bool useUnscaledTime)
    {
        // 파티클이 없는 애니메이션 프리팹은 설정된 시간으로 안전하게 반환합니다.
        if (particles.Length == 0)
        {
            yield return Wait(fallbackDuration, useUnscaledTime);
            Release();
            yield break;
        }

        yield return null;
        while (HasAliveParticle())
            yield return null;

        Release();
    }

    private IEnumerator ReturnAfterDelay(float duration, bool useUnscaledTime)
    {
        yield return Wait(duration, useUnscaledTime);
        Release();
    }

    private static object Wait(float duration, bool useUnscaledTime)
    {
        return useUnscaledTime
            ? new WaitForSecondsRealtime(duration)
            : new WaitForSeconds(duration);
    }

    private bool HasAliveParticle()
    {
        foreach (ParticleSystem particle in particles)
        {
            if (particle != null && particle.IsAlive(true))
                return true;
        }

        return false;
    }

    private void CacheComponents()
    {
        particles ??= GetComponentsInChildren<ParticleSystem>(true);
        trails ??= GetComponentsInChildren<TrailRenderer>(true);
        animators ??= GetComponentsInChildren<Animator>(true);
    }
}
```

---

## 6. VFXCatalog.cs

### 6-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 6-2. 변경 설명

VFX ID별 프리팹, 초기 풀 크기, 기본 수명, 위치·회전·스케일 보정값을 보관하는 ScriptableObject다. 중복 ID 검사와 런타임 조회 캐시로 데이터 설정과 실행 책임을 분리한다.

### 6-3. 현재 스크립트 전체

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;

/// <summary>
/// VFX가 재생되는 좌표 기준입니다.
/// 실제 VFX 종류는 enum이 아니라 Excel/JSON에서 전달되는 문자열 ID로 구분합니다.
/// </summary>
public enum VFXAttachType
{
    World,
    Parent
}

/// <summary>
/// 재생을 마친 VFX를 풀로 돌려보내는 조건입니다.
/// </summary>
public enum VFXReturnType
{
    ParticleStopped,
    Duration,
    Manual
}

/// <summary>
/// 문자열 VFX ID와 Addressable 프리팹 및 풀 설정을 연결합니다.
/// </summary>
[Serializable]
public sealed class VFXCatalogEntry
{
    [Tooltip("Excel/JSON에서 참조할 VFX ID입니다. 예: VFX_DarkSpirit_Hit")]
    [SerializeField] private string vfxId;

    [Tooltip("재생할 Addressable VFX 프리팹입니다.")]
    [SerializeField] private AssetReferenceGameObject prefabReference;

    [Header("Pool")]
    [Tooltip("인게임 진입 시 프리팹을 미리 로드하고 풀을 생성합니다.")]
    [SerializeField] private bool preload;
    [Min(0)] [SerializeField] private int initialPoolSize = 3;
    [Min(1)] [SerializeField] private int maxPoolSize = 10;

    [Header("Playback")]
    [SerializeField] private VFXAttachType attachType = VFXAttachType.World;
    [SerializeField] private VFXReturnType returnType = VFXReturnType.ParticleStopped;
    [Min(0.01f)] [SerializeField] private float duration = 1f;
    [SerializeField] private bool useUnscaledTime;
    [SerializeField] private Vector3 positionOffset;
    [SerializeField] private Vector3 rotationOffset;
    [Min(0.01f)] [SerializeField] private float scaleMultiplier = 1f;

    public string VfxId => vfxId;
    public AssetReferenceGameObject PrefabReference => prefabReference;
    public bool Preload => preload;
    public int InitialPoolSize => Mathf.Max(0, initialPoolSize);
    public int MaxPoolSize => Mathf.Max(1, maxPoolSize, initialPoolSize);
    public VFXAttachType AttachType => attachType;
    public VFXReturnType ReturnType => returnType;
    public float Duration => Mathf.Max(0.01f, duration);
    public bool UseUnscaledTime => useUnscaledTime;
    public Vector3 PositionOffset => positionOffset;
    public Quaternion RotationOffset => Quaternion.Euler(rotationOffset);
    public float ScaleMultiplier => Mathf.Max(0.01f, scaleMultiplier);
}

/// <summary>
/// VFX ID별 Addressable과 풀 설정을 보관하는 카탈로그입니다.
/// Assets/Resources/VFX/VFXCatalog 에셋에 사용자가 VFX 프리팹을 직접 연결합니다.
/// </summary>
[CreateAssetMenu(fileName = "VFXCatalog", menuName = "Lucid Diver/VFX/VFX Catalog")]
public sealed class VFXCatalog : ScriptableObject
{
    [SerializeField] private List<VFXCatalogEntry> entries = new List<VFXCatalogEntry>();

    private Dictionary<string, VFXCatalogEntry> entryById;

    public IReadOnlyList<VFXCatalogEntry> Entries => entries;

    /// <summary>
    /// JSON에서 받은 ID로 VFX 설정을 조회합니다.
    /// </summary>
    public bool TryGetEntry(string vfxId, out VFXCatalogEntry entry)
    {
        BuildLookupIfNeeded();
        return entryById.TryGetValue(vfxId ?? string.Empty, out entry);
    }

    private void OnEnable()
    {
        entryById = null;
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        entryById = null;
        HashSet<string> registeredIds = new HashSet<string>(StringComparer.Ordinal);

        foreach (VFXCatalogEntry entry in entries)
        {
            if (entry == null || string.IsNullOrWhiteSpace(entry.VfxId))
                continue;

            if (!registeredIds.Add(entry.VfxId))
                Debug.LogWarning($"[VFXCatalog] 중복된 VFX ID가 있습니다: {entry.VfxId}", this);
        }
    }
#endif

    private void BuildLookupIfNeeded()
    {
        if (entryById != null)
            return;

        entryById = new Dictionary<string, VFXCatalogEntry>(StringComparer.Ordinal);
        foreach (VFXCatalogEntry entry in entries)
        {
            if (entry == null || string.IsNullOrWhiteSpace(entry.VfxId))
                continue;

            if (entryById.ContainsKey(entry.VfxId))
            {
                Debug.LogWarning($"[VFXCatalog] 중복 ID는 첫 번째 설정을 사용합니다: {entry.VfxId}", this);
                continue;
            }

            entryById.Add(entry.VfxId, entry);
        }
    }
}
```

---

## 7. VFXContext.cs

### 7-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 7-2. 변경 설명

1회 재생에 필요한 위치, 회전, 부모 Transform, 추가 스케일을 값 객체로 전달한다. 기본 컨텍스트 생성 함수를 제공해 호출부의 반복 코드를 줄인다.

### 7-3. 현재 스크립트 전체

```cs
using UnityEngine;

/// <summary>
/// VFX 재생 위치와 선택적인 부모 Transform을 전달하는 값 객체입니다.
/// 게임 로직은 프리팹을 알 필요 없이 VFX ID와 이 정보만 전달합니다.
/// </summary>
public readonly struct VFXContext
{
    public Vector3 Position { get; }
    public Quaternion Rotation { get; }
    public Transform Parent { get; }

    private VFXContext(Vector3 position, Quaternion rotation, Transform parent)
    {
        Position = position;
        Rotation = rotation;
        Parent = parent;
    }

    public static VFXContext At(Vector3 position)
    {
        return new VFXContext(position, Quaternion.identity, null);
    }

    public static VFXContext At(Vector3 position, Quaternion rotation)
    {
        return new VFXContext(position, rotation, null);
    }

    public static VFXContext AttachedTo(Transform parent)
    {
        return new VFXContext(Vector3.zero, Quaternion.identity, parent);
    }

    public static VFXContext AttachedTo(Transform parent, Vector3 localPosition, Quaternion localRotation)
    {
        return new VFXContext(localPosition, localRotation, parent);
    }
}
```

---

## 8. VFXRuntimePool.cs

### 8-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 8-2. 변경 설명

프리팹별 대기열을 만들고 인스턴스를 대여·반환한다. 중복 반환을 HashSet으로 방어하며, OnDisable 경로에서는 활성 상태를 다시 바꾸지 않고 풀 부모 복원과 대기열 등록만 수행한다.

### 8-3. 현재 스크립트 전체

```cs
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 하나의 VFX ID에 해당하는 인스턴스만 관리하는 런타임 풀입니다.
/// </summary>
public sealed class VFXRuntimePool
{
    private readonly VFXCatalogEntry entry;
    private readonly GameObject prefab;
    private readonly Transform root;
    private readonly Queue<PooledVFX> available = new Queue<PooledVFX>();
    private readonly HashSet<PooledVFX> instances = new HashSet<PooledVFX>();

    public VFXRuntimePool(VFXCatalogEntry entry, GameObject prefab, Transform root)
    {
        this.entry = entry;
        this.prefab = prefab;
        this.root = root;

        for (int i = 0; i < entry.InitialPoolSize; i++)
            available.Enqueue(CreateInstance());
    }

    /// <summary>
    /// 비활성 인스턴스를 우선 사용하고, 최대 크기 전까지만 새 인스턴스를 생성합니다.
    /// </summary>
    public PooledVFX Rent(VFXContext context)
    {
        instances.RemoveWhere(candidate => candidate == null);

        PooledVFX instance = null;
        while (available.Count > 0 && instance == null)
            instance = available.Dequeue();

        if (instance == null && instances.Count < entry.MaxPoolSize)
            instance = CreateInstance();

        if (instance == null)
        {
            Debug.LogWarning($"[VFXPool] 최대 풀 크기에 도달해 재생을 건너뜁니다: {entry.VfxId}");
            return null;
        }

        Transform instanceTransform = instance.transform;
        if (entry.AttachType == VFXAttachType.Parent && context.Parent != null)
        {
            instanceTransform.SetParent(context.Parent, false);
            instanceTransform.localPosition = context.Position + entry.PositionOffset;
            instanceTransform.localRotation = context.Rotation * entry.RotationOffset;
        }
        else
        {
            instanceTransform.SetParent(null, false);
            instanceTransform.SetPositionAndRotation(
                context.Position + context.Rotation * entry.PositionOffset,
                context.Rotation * entry.RotationOffset);
        }

        instanceTransform.localScale = prefab.transform.localScale * entry.ScaleMultiplier;
        instance.gameObject.SetActive(true);
        instance.Play(this, entry);
        return instance;
    }

    /// <summary>
    /// 일반 반환은 오브젝트를 비활성화하고, OnDisable 경로는 중복 비활성화 없이 풀 상태만 복원합니다.
    /// </summary>
    internal void Release(PooledVFX instance, bool deactivate)
    {
        if (instance == null || !instances.Contains(instance))
            return;

        if (deactivate && instance.gameObject.activeSelf)
            instance.gameObject.SetActive(false);

        instance.transform.SetParent(root, false);
        available.Enqueue(instance);
    }

    internal void RemoveDestroyed(PooledVFX instance)
    {
        instances.Remove(instance);
    }

    public void Dispose()
    {
        foreach (PooledVFX instance in instances)
        {
            if (instance == null)
                continue;

            instance.DetachFromPool();
            Object.Destroy(instance.gameObject);
        }

        instances.Clear();
        available.Clear();
    }

    private PooledVFX CreateInstance()
    {
        GameObject created = Object.Instantiate(prefab, root);
        created.name = $"{prefab.name} [Pooled]";

        PooledVFX pooledVFX = created.GetComponent<PooledVFX>();
        if (pooledVFX == null)
            pooledVFX = created.AddComponent<PooledVFX>();

        created.SetActive(false);
        instances.Add(pooledVFX);
        return pooledVFX;
    }
}
```

---

## 9. VFXService.cs

### 9-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 9-2. 변경 설명

카탈로그 조회, 풀 준비, 컨텍스트 적용, 파티클 재생을 담당하는 단일 진입점이다. 호출자는 VFX ID와 재생 위치만 전달하고 생성·반환 방식에는 의존하지 않는다.

### 9-3. 현재 스크립트 전체

```cs
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

/// <summary>
/// VFX ID를 Addressable 프리팹과 연결하고 ID별 오브젝트 풀을 관리하는 공통 서비스입니다.
/// 게임 로직에서는 이 서비스에 ID와 재생 위치만 전달합니다.
/// </summary>
[DefaultExecutionOrder(-200)]
public sealed class VFXService : MonoBehaviour
{
    private const string CatalogResourcePath = "VFX/VFXCatalog";

    public static VFXService Instance { get; private set; }

    [SerializeField] private VFXCatalog catalog;

    private readonly Dictionary<string, AsyncOperationHandle<GameObject>> loadedHandles =
        new Dictionary<string, AsyncOperationHandle<GameObject>>();
    private readonly Dictionary<string, Task<VFXRuntimePool>> poolTasks =
        new Dictionary<string, Task<VFXRuntimePool>>();
    private readonly Dictionary<string, VFXRuntimePool> pools =
        new Dictionary<string, VFXRuntimePool>();

    private Transform poolRoot;
    private bool isShuttingDown;

    /// <summary>
    /// 별도 씬 설정 없이 Resources/VFX/VFXCatalog를 이용해 서비스를 자동 생성합니다.
    /// </summary>
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void Bootstrap()
    {
        if (Instance != null)
            return;

        VFXCatalog resourceCatalog = Resources.Load<VFXCatalog>(CatalogResourcePath);
        if (resourceCatalog == null)
        {
            Debug.LogWarning($"[VFXService] Resources/{CatalogResourcePath} 카탈로그를 찾을 수 없습니다.");
            return;
        }

        GameObject serviceObject = new GameObject("[VFXService]");
        serviceObject.SetActive(false);
        VFXService service = serviceObject.AddComponent<VFXService>();
        service.catalog = resourceCatalog;
        serviceObject.SetActive(true);
    }

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        GameObject rootObject = new GameObject("Pools");
        poolRoot = rootObject.transform;
        poolRoot.SetParent(transform, false);

        // 전역 이벤트 연결부도 서비스와 같은 생명주기로 유지합니다.
        if (GetComponent<GameplayVFXPresenter>() == null)
            gameObject.AddComponent<GameplayVFXPresenter>();
    }

    private void Start()
    {
        _ = PreloadAsync();
    }

    /// <summary>
    /// VFX를 월드 좌표에 재생합니다. 로드 중이어도 게임 진행을 막지 않습니다.
    /// </summary>
    public void Play(string vfxId, Vector3 position)
    {
        Play(vfxId, VFXContext.At(position));
    }

    public void Play(string vfxId, Vector3 position, Quaternion rotation)
    {
        Play(vfxId, VFXContext.At(position, rotation));
    }

    public void Play(string vfxId, VFXContext context)
    {
        if (string.IsNullOrWhiteSpace(vfxId) || isShuttingDown)
            return;

        _ = PlayAsync(vfxId, context);
    }

    /// <summary>
    /// 로드 완료와 실제 대여 결과를 기다려야 하는 연출에서 사용합니다.
    /// </summary>
    public async Task<PooledVFX> PlayAsync(string vfxId, VFXContext context)
    {
        VFXRuntimePool pool = await GetOrCreatePoolAsync(vfxId);
        if (pool == null || isShuttingDown)
            return null;

        return pool.Rent(context);
    }

    private async Task PreloadAsync()
    {
        if (catalog == null)
        {
            Debug.LogError("[VFXService] VFXCatalog가 연결되지 않았습니다.", this);
            return;
        }

        foreach (VFXCatalogEntry entry in catalog.Entries)
        {
            if (entry != null && entry.Preload && !string.IsNullOrWhiteSpace(entry.VfxId))
                await GetOrCreatePoolAsync(entry.VfxId);
        }
    }

    private Task<VFXRuntimePool> GetOrCreatePoolAsync(string vfxId)
    {
        if (pools.TryGetValue(vfxId, out VFXRuntimePool existingPool))
            return Task.FromResult(existingPool);

        if (poolTasks.TryGetValue(vfxId, out Task<VFXRuntimePool> existingTask))
            return existingTask;

        Task<VFXRuntimePool> createTask = CreatePoolAsync(vfxId);
        poolTasks.Add(vfxId, createTask);
        return createTask;
    }

    private async Task<VFXRuntimePool> CreatePoolAsync(string vfxId)
    {
        if (catalog == null || !catalog.TryGetEntry(vfxId, out VFXCatalogEntry entry))
        {
            Debug.LogWarning($"[VFXService] VFXCatalog에 등록되지 않은 ID입니다: {vfxId}");
            return null;
        }

        if (entry.PrefabReference == null || !entry.PrefabReference.RuntimeKeyIsValid())
        {
            Debug.LogWarning($"[VFXService] Addressable 프리팹이 연결되지 않았습니다: {vfxId}", catalog);
            return null;
        }

        AsyncOperationHandle<GameObject> handle =
            Addressables.LoadAssetAsync<GameObject>(entry.PrefabReference.RuntimeKey);
        loadedHandles[vfxId] = handle;
        await handle.Task;

        if (isShuttingDown)
            return null;

        if (handle.Status != AsyncOperationStatus.Succeeded || handle.Result == null)
        {
            Debug.LogError($"[VFXService] Addressable VFX 로드에 실패했습니다: {vfxId}");
            return null;
        }

        GameObject idRootObject = new GameObject(vfxId);
        idRootObject.transform.SetParent(poolRoot, false);

        VFXRuntimePool pool = new VFXRuntimePool(entry, handle.Result, idRootObject.transform);
        pools[vfxId] = pool;
        return pool;
    }

    private void OnDestroy()
    {
        if (Instance != this)
            return;

        isShuttingDown = true;
        foreach (VFXRuntimePool pool in pools.Values)
            pool.Dispose();

        foreach (AsyncOperationHandle<GameObject> handle in loadedHandles.Values)
        {
            if (handle.IsValid())
                Addressables.Release(handle);
        }

        pools.Clear();
        poolTasks.Clear();
        loadedHandles.Clear();
        Instance = null;
    }
}
```

---

## 10. SkillEffectProcessor.cs

### 10-1. 이전 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Threading.Tasks;

public class SkillEffectProcessor : MonoBehaviour
{
    public static SkillEffectProcessor Instance { get; private set; }

    private void Awake()
    {
        if(Instance==null)
            Instance = this;
    }

    public async void UseSkillEffect(SkillData _skill, GameObject _user, CasterStatPayload _stats, Vector3 targetPosition)
    {
        if(_skill.effects[0].areaType == AreaType.circle)
        {
            if (string.IsNullOrEmpty(_skill.skillPrefab))
            {
                Debug.LogError($"[{_skill.skillName}] 스킬의 프리팹 주소가 없습니다");
                return;
            }

            GameObject prefabToSpawn = await AddressableLoader.LoadAssetAsync<GameObject>(_skill.skillPrefab);

            if (prefabToSpawn != null)
            {
                // 3. 로드된 해당 스킬의 프리팹을 화면에 생성!
                GameObject spawnedObject = Instantiate(prefabToSpawn, _user.transform.position, Quaternion.identity);
                
                // 4. 생성된 투사체에게 데이터 전달
                GrenadeProjectile projectile = spawnedObject.GetComponent<GrenadeProjectile>();
                if (projectile != null)
                {
                    projectile.SetupAndThrow(_skill, _user, _stats, targetPosition);
                }
            }
        }
        else
        {
            
        }
    }


}
```

### 10-2. 변경 설명

스킬 처리 단계에서 프리즘 유탄 폭발과 이후 디코이 발현을 서로 다른 VFX ID로 재생하도록 연결했다. 데미지 판정과 시각 효과 호출을 같은 게임 이벤트 위치에 맞추되 VFX 생성 책임은 VFXService에 위임한다.

### 10-3. 현재 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Threading.Tasks;

public class SkillEffectProcessor : MonoBehaviour
{
    public static SkillEffectProcessor Instance { get; private set; }

    private void Awake()
    {
        if(Instance==null)
            Instance = this;
    }

    public async void UseSkillEffect(SkillData _skill, GameObject _user, CasterStatPayload _stats, Vector3 targetPosition)
    {
        // Excel/JSON의 activateVFX ID만 전달하고 프리팹 로드와 재사용은 VFXService에 맡깁니다.
        if (VFXService.Instance != null && !string.IsNullOrWhiteSpace(_skill.activateVFX))
            VFXService.Instance.Play(_skill.activateVFX, _user.transform.position, _user.transform.rotation);

        if(_skill.effects[0].areaType == AreaType.circle)
        {
            if (string.IsNullOrEmpty(_skill.skillPrefab))
            {
                Debug.LogError($"[{_skill.skillName}] 스킬의 프리팹 주소가 없습니다");
                return;
            }

            GameObject prefabToSpawn = await AddressableLoader.LoadAssetAsync<GameObject>(_skill.skillPrefab);

            if (prefabToSpawn != null)
            {
                // 3. 로드된 해당 스킬의 프리팹을 화면에 생성!
                GameObject spawnedObject = Instantiate(prefabToSpawn, _user.transform.position, Quaternion.identity);
                
                // 4. 생성된 투사체에게 데이터 전달
                GrenadeProjectile projectile = spawnedObject.GetComponent<GrenadeProjectile>();
                if (projectile != null)
                {
                    projectile.SetupAndThrow(_skill, _user, _stats, targetPosition);
                }
            }
        }
        else
        {
            
        }
    }


}
```

---

## 11. SpawnManager.cs

### 11-1. 이전 스크립트 전체

```cs
﻿using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class SpawnManager : MonoBehaviour
{
    public static SpawnManager Instance { get; private set; }

    [Header("엔티티 생성")]
    [SerializeField] private GameObject playerPrefab;
    [SerializeField] private GameObject EnemyPrefab;
    [SerializeField] private GameObject playerSpawnPool;
    [SerializeField] private GameObject enemySpawnPool;
    [SerializeField] private LevelBoxSpawner levelBoxSpawner;

    private readonly List<Transform> playerSpawnPoint = new();
    private readonly List<EnemySpawnZone> enemySpawnZones = new();
    private readonly List<Transform> legacyEnemySpawnPoints = new();
    private readonly List<Transform> zoneSpawnCandidates = new();

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private IItemDataRepository itemRepo;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }

        CollectPlayerSpawnPoints();
        RebuildEnemySpawnSources();

        if (levelBoxSpawner == null)
        {
            levelBoxSpawner = GetComponent<LevelBoxSpawner>();
        }

        itemRepo = new LocalJsonItemRepository();
    }

    /// <summary>
    /// 플레이어 스폰 포인트 캐시를 초기화합니다.
    /// 플레이어는 기존 구조를 유지하므로 단순히 자식 Transform만 읽어 옵니다.
    /// </summary>
    private void CollectPlayerSpawnPoints()
    {
        playerSpawnPoint.Clear();
        if (playerSpawnPool == null)
        {
            // LevelDesignTable에 추가한 풀을 태그로 찾아옴
            playerSpawnPool = GameObject.FindGameObjectWithTag("PlayerSpawnPool");
            if (playerSpawnPool == null)  return;
        }

        foreach (Transform point in playerSpawnPool.transform)
        {
            if (point != null)
            {
                playerSpawnPoint.Add(point);
            }
        }
    }

    /// <summary>
    /// 적 스폰 소스를 다시 읽습니다.
    /// 최종 구조인 EnemySpawnZone 방식과, 기존 직접 포인트 방식 둘 다 동시에 지원하기 위한 캐시 갱신 함수입니다.
    /// </summary>
    private void RebuildEnemySpawnSources()
    {
        enemySpawnZones.Clear();
        legacyEnemySpawnPoints.Clear();

        if (enemySpawnPool == null)
        {
            // LevelDesignTable에 추가한 풀을 태그로 찾아옴
            enemySpawnPool = GameObject.FindGameObjectWithTag("EnemySpawnPool");
            if (enemySpawnPool == null) return;
        }

        foreach (Transform child in enemySpawnPool.transform)
        {
            if (child == null)
            {
                continue;
            }

            if (child.TryGetComponent(out EnemySpawnZone zone))
            {
                enemySpawnZones.Add(zone);
                continue;
            }

            if (child.GetComponent<EnemySpawnPoint>() != null || IsNamedSpawnPoint(child))
            {
                legacyEnemySpawnPoints.Add(child);
            }
        }
    }

    public void SpawnPlayer(CharacterData charData)
    {
        if (playerSpawnPoint.Count == 0)
        {
            Debug.LogError("Player spawn point list is empty");
            return;
        }

        // 플레이어 스폰 포인트 중 무작위로 하나 선정
        int spawnNum = UnityEngine.Random.Range(0, playerSpawnPoint.Count);

        // 스폰 장소 오브젝트가 없을 경우 대비
        if (playerSpawnPoint[spawnNum] == null)
        {
            Debug.LogError("Player spawn point not found");
            return;
        }

        // 플레이어 오브젝트 생성
        Transform spawnPoint = playerSpawnPoint[spawnNum].transform;
        GameObject spawnedPlayer = Instantiate(playerPrefab, spawnPoint.position, spawnPoint.rotation);

        // 스폰된 오브젝트를 게임 신에 배치 (LoadScene 언로드 방어)
        SceneManager.MoveGameObjectToScene(spawnedPlayer, gameObject.scene);

        // 플레이어 오브젝트 세션 데이터에 등록
        GlobalRuntimeData.CountingPlayerData(spawnedPlayer);

        Debug.Log($"Player spawned at {spawnPoint.position} with ID: {spawnedPlayer.GetComponent<EntityIdentity>().entityID}");

        // 플레이어에게 세이브 데이터 넘겨주기
        if (charData != null)
        {
            if (spawnedPlayer.TryGetComponent<PlayerStatus>(out var status))
            {
                status.initialize(charData.hpMax, charData.manaMax, charData.manaRegen, charData.sprintMana, charData.sprintRecoverTime, charData.evadeMana, charData.evadeCooltime);
            }

            if (spawnedPlayer.TryGetComponent<PlayerMovement>(out var movement))
            {
                movement.initialize(charData.moveSpeed, charData.sprintSpeed, charData.sprintMana, charData.evadeSpeed, charData.evadeTime, charData.evadeMana, charData.evadeCooltime);
            }

            if (spawnedPlayer.TryGetComponent<PlayerWeapon>(out var weapon))
            {
                WeaponItemData weaponItemData = itemRepo.GetTypeItemData<WeaponItemData>(charData.weaponNum);
                weapon.initialize(weaponItemData);
            }
        }

        // 플레이어 스폰 여부 이벤트
        GlobalEventBus.OnPlayerSpawned?.Invoke(spawnedPlayer);
    }

    /// <summary>
    /// 적 스폰을 시작합니다.
    /// 존 기반 스폰 설정이 하나라도 있으면 존 기준으로 처리하고,
    /// 아직 구조를 옮기지 않은 씬은 기존 직접 포인트 방식으로 호환 처리합니다.
    /// </summary>
    public void SpawnEnemy()
    {
        // 적 프리팹이 연결되지 않았을 경우 대비
        if (EnemyPrefab == null)
        {
            Debug.LogError("Enemy prefab not found");
            return;
        }

        RebuildEnemySpawnSources();

        // 적 스폰 소스가 하나도 없을 경우 대비
        if (enemySpawnZones.Count == 0 && legacyEnemySpawnPoints.Count == 0)
        {
            Debug.LogError("Enemy spawn source list is empty");
            return;
        }

        int spawnedEnemyCount = enemySpawnZones.Count > 0
            ? SpawnEnemiesFromZones()
            : SpawnEnemiesFromLegacyPoints();

        if (spawnedEnemyCount <= 0)
        {
            Debug.LogWarning("SpawnManager: no enemies were spawned from the configured points.");
            return;
        }

        Debug.Log($"SpawnManager: spawned {spawnedEnemyCount} enemies.");
    }

    public void SpawnBoxes()
    {
        if (levelBoxSpawner == null)
        {
            Debug.LogWarning("SpawnManager: LevelBoxSpawner is not assigned.");
            return;
        }

        levelBoxSpawner.SpawnBoxes();
    }

    /// <summary>
    /// EnemySpawnZone을 기준으로 존별 스폰 수만큼 적을 생성합니다.
    /// 같은 존 안에서는 포인트가 중복 선택되지 않도록 후보 목록에서 제거하면서 뽑습니다.
    /// </summary>
    private int SpawnEnemiesFromZones()
    {
        int spawnedCount = 0;

        for (int zoneIndex = 0; zoneIndex < enemySpawnZones.Count; zoneIndex++)
        {
            EnemySpawnZone zone = enemySpawnZones[zoneIndex];
            if (zone == null || !zone.gameObject.activeInHierarchy)
            {
                continue;
            }

            zoneSpawnCandidates.Clear();
            zone.CollectSpawnPoints(zoneSpawnCandidates);

            int targetCount = zone.ResolveSpawnCount(zoneSpawnCandidates.Count);
            for (int i = 0; i < targetCount; i++)
            {
                int candidateIndex = UnityEngine.Random.Range(0, zoneSpawnCandidates.Count);
                Transform selectedPoint = zoneSpawnCandidates[candidateIndex];
                zoneSpawnCandidates.RemoveAt(candidateIndex);

                if (TrySpawnEnemyAtPoint(selectedPoint, zone))
                {
                    spawnedCount++;
                }
            }
        }

        return spawnedCount;
    }

    /// <summary>
    /// 기존처럼 직접 배치된 스폰 포인트를 모두 사용해 적을 생성합니다.
    /// 존 구조로 완전히 옮기기 전까지 씬을 깨지 않게 두기 위한 임시 호환 경로입니다.
    /// </summary>
    private int SpawnEnemiesFromLegacyPoints()
    {
        int spawnedCount = 0;

        for (int i = 0; i < legacyEnemySpawnPoints.Count; i++)
        {
            if (TrySpawnEnemyAtPoint(legacyEnemySpawnPoints[i], null))
            {
                spawnedCount++;
            }
        }

        return spawnedCount;
    }

    /// <summary>
    /// 선택된 스폰 포인트 한 곳에서 적을 한 마리 생성하고 순찰 정보를 주입합니다.
    /// 스폰 위치, 패트롤 루트, 시작 순찰 인덱스를 모두 여기서 결정합니다.
    /// </summary>
    private bool TrySpawnEnemyAtPoint(Transform pointTransform, EnemySpawnZone zone)
    {
        if (pointTransform == null)
        {
            return false;
        }

        if (!pointTransform.gameObject.activeInHierarchy)
        {
            return false;
        }

        EnemySpawnPoint spawnPointSettings = pointTransform.GetComponent<EnemySpawnPoint>();
        if (spawnPointSettings != null && !spawnPointSettings.EnabledForSpawn)
        {
            return false;
        }

        GameObject spawnedEnemy = Instantiate(EnemyPrefab, pointTransform.position, pointTransform.rotation);
        // 스폰된 오브젝트를 게임 신에 배치 (LoadScene 언로드 방어)
        SceneManager.MoveGameObjectToScene(spawnedEnemy, gameObject.scene);

        // 수정 이유:
        // 적 프리팹의 EntityIdentity는 프리팹 기본값이 그대로 복제되므로,
        // 여러 마리를 생성하면 같은 ID를 공유할 수 있습니다.
        // 스폰 직후 런타임 고유 번호를 다시 배정해서 적 개체별 UI/이벤트 식별이 섞이지 않게 만듭니다.
        AssignEnemyRuntimeIdentity(spawnedEnemy);

        EnemyPatrolRoute patrolRoute = spawnPointSettings != null
            ? spawnPointSettings.ResolvePatrolRoute(zone)
            : ResolvePatrolRouteByName(pointTransform, zone);

        int startPatrolIndex = spawnPointSettings != null
            ? spawnPointSettings.ResolveStartPatrolIndex(patrolRoute, pointTransform.position)
            : ResolveNearestPatrolIndex(patrolRoute, pointTransform.position);

        if (spawnedEnemy.TryGetComponent(out EnemyMovement movement))
        {
            movement.InitializeSpawnContext(pointTransform.position, patrolRoute, startPatrolIndex);
        }

        // 생성된 적 오브젝트를 런타임 데이터에 등록
        return true;
    }

    /// <summary>
    /// 이름 규칙상 Spawn_으로 시작하는지 확인합니다.
    /// 아직 EnemySpawnPoint 컴포넌트를 붙이지 않은 씬을 호환하기 위한 보조 규칙입니다.
    /// </summary>
    private static bool IsNamedSpawnPoint(Transform pointTransform)
    {
        // 새 구조의 Spawn_ 규칙과, 기존 DemoScene에서 쓰던 EnemySpawnPoint 이름을 함께 허용합니다.
        return pointTransform != null &&
            (pointTransform.name.StartsWith("Spawn_", StringComparison.OrdinalIgnoreCase) ||
             pointTransform.name.StartsWith("EnemySpawnPoint", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 스폰 포인트 개별 설정이 없을 때 이름 규칙과 존 기본 루트로 패트롤 경로를 찾습니다.
    /// Route_Lobby_A / Spawn_Lobby_A_01 같은 네이밍을 맞춰 둔 경우 자동 연결이 가능하게 해 줍니다.
    /// </summary>
    private static EnemyPatrolRoute ResolvePatrolRouteByName(Transform pointTransform, EnemySpawnZone zone)
    {
        if (zone != null && zone.DefaultPatrolRoute != null)
        {
            return zone.DefaultPatrolRoute;
        }

        if (pointTransform == null)
        {
            return null;
        }

        string routeName = InferRouteName(pointTransform.name);
        if (string.IsNullOrEmpty(routeName))
        {
            return null;
        }

        EnemyPatrolRoute[] routes = UnityEngine.Object.FindObjectsOfType<EnemyPatrolRoute>(true);
        for (int i = 0; i < routes.Length; i++)
        {
            if (routes[i] != null && string.Equals(routes[i].name, routeName, StringComparison.OrdinalIgnoreCase))
            {
                return routes[i];
            }
        }

        return null;
    }

    /// <summary>
    /// 루트가 있을 때 스폰 위치에서 가장 가까운 순찰 포인트 인덱스를 계산합니다.
    /// 별도 설정이 없으면 자연스럽게 가까운 포인트부터 순찰을 시작하게 하기 위한 기본 정책입니다.
    /// </summary>
    private static int ResolveNearestPatrolIndex(EnemyPatrolRoute patrolRoute, Vector3 spawnPosition)
    {
        return patrolRoute != null ? patrolRoute.GetClosestPointIndex(spawnPosition) : 0;
    }

    /// <summary>
    /// Spawn_Lobby_A_01 같은 이름에서 Route_Lobby_A 형태의 루트 이름을 추론합니다.
    /// 이름 기반 자동 연결이 필요한 경우에만 사용하는 보조 함수입니다.
    /// </summary>
    private static string InferRouteName(string spawnPointName)
    {
        const string spawnPrefix = "Spawn_";
        const string routePrefix = "Route_";

        if (string.IsNullOrEmpty(spawnPointName) ||
            !spawnPointName.StartsWith(spawnPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        int lastUnderscoreIndex = spawnPointName.LastIndexOf('_');
        if (lastUnderscoreIndex <= spawnPrefix.Length)
        {
            return string.Empty;
        }

        return routePrefix + spawnPointName.Substring(spawnPrefix.Length, lastUnderscoreIndex - spawnPrefix.Length);
    }

    /// <summary>
    /// 생성된 적에게 런타임 고유 번호를 부여합니다.
    /// EnemyStatus와 EntityIdentity를 함께 맞춰 주어, HP UI/사망 이벤트 식별이 섞이지 않게 합니다.
    /// </summary>
    private static void AssignEnemyRuntimeIdentity(GameObject spawnedEnemy)
    {
        if (spawnedEnemy == null)
        {
            return;
        }

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
}
```

### 11-2. 변경 설명

플레이어와 에너미 스폰 완료 지점에서 등장 VFX를 요청하도록 연결했다. 스폰 로직 자체는 유지하고, 생성된 실제 Transform을 컨텍스트로 전달한다.

### 11-3. 현재 스크립트 전체

```cs
﻿using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class SpawnManager : MonoBehaviour
{
    public static SpawnManager Instance { get; private set; }

    [Header("엔티티 생성")]
    [SerializeField] private GameObject playerPrefab;
    [SerializeField] private GameObject EnemyPrefab;
    [SerializeField] private GameObject playerSpawnPool;
    [SerializeField] private GameObject enemySpawnPool;
    [SerializeField] private LevelBoxSpawner levelBoxSpawner;

    private readonly List<Transform> playerSpawnPoint = new();
    private readonly List<EnemySpawnZone> enemySpawnZones = new();
    private readonly List<Transform> legacyEnemySpawnPoints = new();
    private readonly List<Transform> zoneSpawnCandidates = new();

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private IItemDataRepository itemRepo;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }

        CollectPlayerSpawnPoints();
        RebuildEnemySpawnSources();

        if (levelBoxSpawner == null)
        {
            levelBoxSpawner = GetComponent<LevelBoxSpawner>();
        }

        itemRepo = new LocalJsonItemRepository();
    }

    /// <summary>
    /// 플레이어 스폰 포인트 캐시를 초기화합니다.
    /// 플레이어는 기존 구조를 유지하므로 단순히 자식 Transform만 읽어 옵니다.
    /// </summary>
    private void CollectPlayerSpawnPoints()
    {
        playerSpawnPoint.Clear();
        if (playerSpawnPool == null)
        {
            // LevelDesignTable에 추가한 풀을 태그로 찾아옴
            playerSpawnPool = GameObject.FindGameObjectWithTag("PlayerSpawnPool");
            if (playerSpawnPool == null)  return;
        }

        foreach (Transform point in playerSpawnPool.transform)
        {
            if (point != null)
            {
                playerSpawnPoint.Add(point);
            }
        }
    }

    /// <summary>
    /// 적 스폰 소스를 다시 읽습니다.
    /// 최종 구조인 EnemySpawnZone 방식과, 기존 직접 포인트 방식 둘 다 동시에 지원하기 위한 캐시 갱신 함수입니다.
    /// </summary>
    private void RebuildEnemySpawnSources()
    {
        enemySpawnZones.Clear();
        legacyEnemySpawnPoints.Clear();

        if (enemySpawnPool == null)
        {
            // LevelDesignTable에 추가한 풀을 태그로 찾아옴
            enemySpawnPool = GameObject.FindGameObjectWithTag("EnemySpawnPool");
            if (enemySpawnPool == null) return;
        }

        foreach (Transform child in enemySpawnPool.transform)
        {
            if (child == null)
            {
                continue;
            }

            if (child.TryGetComponent(out EnemySpawnZone zone))
            {
                enemySpawnZones.Add(zone);
                continue;
            }

            if (child.GetComponent<EnemySpawnPoint>() != null || IsNamedSpawnPoint(child))
            {
                legacyEnemySpawnPoints.Add(child);
            }
        }
    }

    public void SpawnPlayer(CharacterData charData)
    {
        if (playerSpawnPoint.Count == 0)
        {
            Debug.LogError("Player spawn point list is empty");
            return;
        }

        // 플레이어 스폰 포인트 중 무작위로 하나 선정
        int spawnNum = UnityEngine.Random.Range(0, playerSpawnPoint.Count);

        // 스폰 장소 오브젝트가 없을 경우 대비
        if (playerSpawnPoint[spawnNum] == null)
        {
            Debug.LogError("Player spawn point not found");
            return;
        }

        // 플레이어 오브젝트 생성
        Transform spawnPoint = playerSpawnPoint[spawnNum].transform;
        GameObject spawnedPlayer = Instantiate(playerPrefab, spawnPoint.position, spawnPoint.rotation);

        // 스폰된 오브젝트를 게임 신에 배치 (LoadScene 언로드 방어)
        SceneManager.MoveGameObjectToScene(spawnedPlayer, gameObject.scene);

        // 플레이어 오브젝트 세션 데이터에 등록
        GlobalRuntimeData.CountingPlayerData(spawnedPlayer);

        Debug.Log($"Player spawned at {spawnPoint.position} with ID: {spawnedPlayer.GetComponent<EntityIdentity>().entityID}");

        // 플레이어에게 세이브 데이터 넘겨주기
        if (charData != null)
        {
            if (spawnedPlayer.TryGetComponent<PlayerStatus>(out var status))
            {
                status.initialize(charData.hpMax, charData.manaMax, charData.manaRegen, charData.sprintMana, charData.sprintRecoverTime, charData.evadeMana, charData.evadeCooltime);
            }

            if (spawnedPlayer.TryGetComponent<PlayerMovement>(out var movement))
            {
                movement.initialize(charData.moveSpeed, charData.sprintSpeed, charData.sprintMana, charData.evadeSpeed, charData.evadeTime, charData.evadeMana, charData.evadeCooltime);
            }

            if (spawnedPlayer.TryGetComponent<PlayerWeapon>(out var weapon))
            {
                WeaponItemData weaponItemData = itemRepo.GetTypeItemData<WeaponItemData>(charData.weaponNum);
                weapon.initialize(weaponItemData);
            }
        }

        // 플레이어 스폰 여부 이벤트
        GlobalEventBus.OnPlayerSpawned?.Invoke(spawnedPlayer);
    }

    /// <summary>
    /// 적 스폰을 시작합니다.
    /// 존 기반 스폰 설정이 하나라도 있으면 존 기준으로 처리하고,
    /// 아직 구조를 옮기지 않은 씬은 기존 직접 포인트 방식으로 호환 처리합니다.
    /// </summary>
    public void SpawnEnemy()
    {
        // 적 프리팹이 연결되지 않았을 경우 대비
        if (EnemyPrefab == null)
        {
            Debug.LogError("Enemy prefab not found");
            return;
        }

        RebuildEnemySpawnSources();

        // 적 스폰 소스가 하나도 없을 경우 대비
        if (enemySpawnZones.Count == 0 && legacyEnemySpawnPoints.Count == 0)
        {
            Debug.LogError("Enemy spawn source list is empty");
            return;
        }

        int spawnedEnemyCount = enemySpawnZones.Count > 0
            ? SpawnEnemiesFromZones()
            : SpawnEnemiesFromLegacyPoints();

        if (spawnedEnemyCount <= 0)
        {
            Debug.LogWarning("SpawnManager: no enemies were spawned from the configured points.");
            return;
        }

        Debug.Log($"SpawnManager: spawned {spawnedEnemyCount} enemies.");
    }

    public void SpawnBoxes()
    {
        if (levelBoxSpawner == null)
        {
            Debug.LogWarning("SpawnManager: LevelBoxSpawner is not assigned.");
            return;
        }

        levelBoxSpawner.SpawnBoxes();
    }

    /// <summary>
    /// EnemySpawnZone을 기준으로 존별 스폰 수만큼 적을 생성합니다.
    /// 같은 존 안에서는 포인트가 중복 선택되지 않도록 후보 목록에서 제거하면서 뽑습니다.
    /// </summary>
    private int SpawnEnemiesFromZones()
    {
        int spawnedCount = 0;

        for (int zoneIndex = 0; zoneIndex < enemySpawnZones.Count; zoneIndex++)
        {
            EnemySpawnZone zone = enemySpawnZones[zoneIndex];
            if (zone == null || !zone.gameObject.activeInHierarchy)
            {
                continue;
            }

            zoneSpawnCandidates.Clear();
            zone.CollectSpawnPoints(zoneSpawnCandidates);

            int targetCount = zone.ResolveSpawnCount(zoneSpawnCandidates.Count);
            for (int i = 0; i < targetCount; i++)
            {
                int candidateIndex = UnityEngine.Random.Range(0, zoneSpawnCandidates.Count);
                Transform selectedPoint = zoneSpawnCandidates[candidateIndex];
                zoneSpawnCandidates.RemoveAt(candidateIndex);

                if (TrySpawnEnemyAtPoint(selectedPoint, zone))
                {
                    spawnedCount++;
                }
            }
        }

        return spawnedCount;
    }

    /// <summary>
    /// 기존처럼 직접 배치된 스폰 포인트를 모두 사용해 적을 생성합니다.
    /// 존 구조로 완전히 옮기기 전까지 씬을 깨지 않게 두기 위한 임시 호환 경로입니다.
    /// </summary>
    private int SpawnEnemiesFromLegacyPoints()
    {
        int spawnedCount = 0;

        for (int i = 0; i < legacyEnemySpawnPoints.Count; i++)
        {
            if (TrySpawnEnemyAtPoint(legacyEnemySpawnPoints[i], null))
            {
                spawnedCount++;
            }
        }

        return spawnedCount;
    }

    /// <summary>
    /// 선택된 스폰 포인트 한 곳에서 적을 한 마리 생성하고 순찰 정보를 주입합니다.
    /// 스폰 위치, 패트롤 루트, 시작 순찰 인덱스를 모두 여기서 결정합니다.
    /// </summary>
    private bool TrySpawnEnemyAtPoint(Transform pointTransform, EnemySpawnZone zone)
    {
        if (pointTransform == null)
        {
            return false;
        }

        if (!pointTransform.gameObject.activeInHierarchy)
        {
            return false;
        }

        EnemySpawnPoint spawnPointSettings = pointTransform.GetComponent<EnemySpawnPoint>();
        if (spawnPointSettings != null && !spawnPointSettings.EnabledForSpawn)
        {
            return false;
        }

        GameObject spawnedEnemy = Instantiate(EnemyPrefab, pointTransform.position, pointTransform.rotation);
        // 스폰된 오브젝트를 게임 신에 배치 (LoadScene 언로드 방어)
        SceneManager.MoveGameObjectToScene(spawnedEnemy, gameObject.scene);

        // 수정 이유:
        // 적 프리팹의 EntityIdentity는 프리팹 기본값이 그대로 복제되므로,
        // 여러 마리를 생성하면 같은 ID를 공유할 수 있습니다.
        // 스폰 직후 런타임 고유 번호를 다시 배정해서 적 개체별 UI/이벤트 식별이 섞이지 않게 만듭니다.
        AssignEnemyRuntimeIdentity(spawnedEnemy);

        EnemyPatrolRoute patrolRoute = spawnPointSettings != null
            ? spawnPointSettings.ResolvePatrolRoute(zone)
            : ResolvePatrolRouteByName(pointTransform, zone);

        int startPatrolIndex = spawnPointSettings != null
            ? spawnPointSettings.ResolveStartPatrolIndex(patrolRoute, pointTransform.position)
            : ResolveNearestPatrolIndex(patrolRoute, pointTransform.position);

        if (spawnedEnemy.TryGetComponent(out EnemyMovement movement))
        {
            movement.InitializeSpawnContext(pointTransform.position, patrolRoute, startPatrolIndex);
        }

        VFXService.Instance?.Play(GameplayVFXIds.EnemySpawn, spawnedEnemy.transform.position, spawnedEnemy.transform.rotation);

        // 생성된 적 오브젝트를 런타임 데이터에 등록
        return true;
    }

    /// <summary>
    /// 이름 규칙상 Spawn_으로 시작하는지 확인합니다.
    /// 아직 EnemySpawnPoint 컴포넌트를 붙이지 않은 씬을 호환하기 위한 보조 규칙입니다.
    /// </summary>
    private static bool IsNamedSpawnPoint(Transform pointTransform)
    {
        // 새 구조의 Spawn_ 규칙과, 기존 DemoScene에서 쓰던 EnemySpawnPoint 이름을 함께 허용합니다.
        return pointTransform != null &&
            (pointTransform.name.StartsWith("Spawn_", StringComparison.OrdinalIgnoreCase) ||
             pointTransform.name.StartsWith("EnemySpawnPoint", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 스폰 포인트 개별 설정이 없을 때 이름 규칙과 존 기본 루트로 패트롤 경로를 찾습니다.
    /// Route_Lobby_A / Spawn_Lobby_A_01 같은 네이밍을 맞춰 둔 경우 자동 연결이 가능하게 해 줍니다.
    /// </summary>
    private static EnemyPatrolRoute ResolvePatrolRouteByName(Transform pointTransform, EnemySpawnZone zone)
    {
        if (zone != null && zone.DefaultPatrolRoute != null)
        {
            return zone.DefaultPatrolRoute;
        }

        if (pointTransform == null)
        {
            return null;
        }

        string routeName = InferRouteName(pointTransform.name);
        if (string.IsNullOrEmpty(routeName))
        {
            return null;
        }

        EnemyPatrolRoute[] routes = UnityEngine.Object.FindObjectsOfType<EnemyPatrolRoute>(true);
        for (int i = 0; i < routes.Length; i++)
        {
            if (routes[i] != null && string.Equals(routes[i].name, routeName, StringComparison.OrdinalIgnoreCase))
            {
                return routes[i];
            }
        }

        return null;
    }

    /// <summary>
    /// 루트가 있을 때 스폰 위치에서 가장 가까운 순찰 포인트 인덱스를 계산합니다.
    /// 별도 설정이 없으면 자연스럽게 가까운 포인트부터 순찰을 시작하게 하기 위한 기본 정책입니다.
    /// </summary>
    private static int ResolveNearestPatrolIndex(EnemyPatrolRoute patrolRoute, Vector3 spawnPosition)
    {
        return patrolRoute != null ? patrolRoute.GetClosestPointIndex(spawnPosition) : 0;
    }

    /// <summary>
    /// Spawn_Lobby_A_01 같은 이름에서 Route_Lobby_A 형태의 루트 이름을 추론합니다.
    /// 이름 기반 자동 연결이 필요한 경우에만 사용하는 보조 함수입니다.
    /// </summary>
    private static string InferRouteName(string spawnPointName)
    {
        const string spawnPrefix = "Spawn_";
        const string routePrefix = "Route_";

        if (string.IsNullOrEmpty(spawnPointName) ||
            !spawnPointName.StartsWith(spawnPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        int lastUnderscoreIndex = spawnPointName.LastIndexOf('_');
        if (lastUnderscoreIndex <= spawnPrefix.Length)
        {
            return string.Empty;
        }

        return routePrefix + spawnPointName.Substring(spawnPrefix.Length, lastUnderscoreIndex - spawnPrefix.Length);
    }

    /// <summary>
    /// 생성된 적에게 런타임 고유 번호를 부여합니다.
    /// EnemyStatus와 EntityIdentity를 함께 맞춰 주어, HP UI/사망 이벤트 식별이 섞이지 않게 합니다.
    /// </summary>
    private static void AssignEnemyRuntimeIdentity(GameObject spawnedEnemy)
    {
        if (spawnedEnemy == null)
        {
            return;
        }

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
}
```

---

## 12. DoorInteractable.cs

### 12-1. 이전 스크립트 전체

```cs
﻿using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DoorInteractable : MonoBehaviour
{
    [Header("Door")]
    [SerializeField] private Animator doorAnimator;
    [SerializeField] private string openParameterName = "IsOpen";
    [SerializeField] private bool canToggle = true;

    [Header("Interaction")]
    [SerializeField] private GameObject interactionGuideUI;

    private bool isPlayerInRange;
    private bool isOpen;

    private void Awake()
    {
        // Animator가 수동 연결되지 않았을 때 자식에서 자동으로 찾는다
        if (doorAnimator == null)
            doorAnimator = GetComponentInChildren<Animator>();

        // 상호작용 안내 UI는 시작 시 숨긴다
        if (interactionGuideUI != null)
            interactionGuideUI.SetActive(false);
    }

    private void Update()
    {
        // 플레이어가 상호작용 범위 안에 없으면 입력을 무시한다
        if (!isPlayerInRange)
            return;

        // F 키 입력 시 문 상호작용을 실행한다
        if (Input.GetKeyDown(KeyCode.F))
            Interact();
    }

    private void Interact()
    {
        // 토글이 불가능한 문은 한 번 열린 뒤 다시 동작하지 않게 한다
        if (!canToggle && isOpen)
            return;

        // 문 열림 상태를 반전한다
        isOpen = !isOpen;

        // Animator 파라미터를 변경해 문 애니메이션을 재생한다
        if (doorAnimator != null)
            doorAnimator.SetBool(openParameterName, isOpen);

        // 문이 열린 뒤 안내 UI를 숨긴다
        if (interactionGuideUI != null)
            interactionGuideUI.SetActive(!isOpen);
    }

    private void OnTriggerEnter(Collider other)
    {
        // 플레이어가 상호작용 범위에 들어왔는지 확인한다
        if (!other.CompareTag("Player"))
            return;

        isPlayerInRange = true;

        // 문이 닫혀 있거나 토글 가능한 경우 상호작용 안내 UI를 표시한다
        if (interactionGuideUI != null && (!isOpen || canToggle))
            interactionGuideUI.SetActive(true);
    }

    private void OnTriggerExit(Collider other)
    {
        // 플레이어가 상호작용 범위에서 나갔는지 확인한다
        if (!other.CompareTag("Player"))
            return;

        isPlayerInRange = false;

        // {범위 밖으로 나가면 상호작용 안내 UI를 숨긴다}
        if (interactionGuideUI != null)
            interactionGuideUI.SetActive(false);
    }
}
```

### 12-2. 변경 설명

문 상호작용 성공 지점에서 문 열림 VFX를 재생하도록 추가했다. 상호작용 조건과 문 상태 전환은 그대로 두고 성공한 경우에만 효과가 발생한다.

### 12-3. 현재 스크립트 전체

```cs
﻿using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DoorInteractable : MonoBehaviour
{
    [Header("Door")]
    [SerializeField] private Animator doorAnimator;
    [SerializeField] private string openParameterName = "IsOpen";
    [SerializeField] private bool canToggle = true;

    [Header("Interaction")]
    [SerializeField] private GameObject interactionGuideUI;

    private bool isPlayerInRange;
    private bool isOpen;

    private void Awake()
    {
        // Animator가 수동 연결되지 않았을 때 자식에서 자동으로 찾는다
        if (doorAnimator == null)
            doorAnimator = GetComponentInChildren<Animator>();

        // 상호작용 안내 UI는 시작 시 숨긴다
        if (interactionGuideUI != null)
            interactionGuideUI.SetActive(false);
    }

    private void Update()
    {
        // 플레이어가 상호작용 범위 안에 없으면 입력을 무시한다
        if (!isPlayerInRange)
            return;

        // F 키 입력 시 문 상호작용을 실행한다
        if (Input.GetKeyDown(KeyCode.F))
            Interact();
    }

    private void Interact()
    {
        // 토글이 불가능한 문은 한 번 열린 뒤 다시 동작하지 않게 한다
        if (!canToggle && isOpen)
            return;

        // 문 열림 상태를 반전한다
        isOpen = !isOpen;

        string doorVfxId = isOpen ? GameplayVFXIds.DoorOpen : GameplayVFXIds.DoorClose;
        VFXService.Instance?.Play(doorVfxId, transform.position, transform.rotation);

        // Animator 파라미터를 변경해 문 애니메이션을 재생한다
        if (doorAnimator != null)
            doorAnimator.SetBool(openParameterName, isOpen);

        // 문이 열린 뒤 안내 UI를 숨긴다
        if (interactionGuideUI != null)
            interactionGuideUI.SetActive(!isOpen);
    }

    private void OnTriggerEnter(Collider other)
    {
        // 플레이어가 상호작용 범위에 들어왔는지 확인한다
        if (!other.CompareTag("Player"))
            return;

        isPlayerInRange = true;

        // 문이 닫혀 있거나 토글 가능한 경우 상호작용 안내 UI를 표시한다
        if (interactionGuideUI != null && (!isOpen || canToggle))
            interactionGuideUI.SetActive(true);
    }

    private void OnTriggerExit(Collider other)
    {
        // 플레이어가 상호작용 범위에서 나갔는지 확인한다
        if (!other.CompareTag("Player"))
            return;

        isPlayerInRange = false;

        // {범위 밖으로 나가면 상호작용 안내 UI를 숨긴다}
        if (interactionGuideUI != null)
            interactionGuideUI.SetActive(false);
    }
}
```

---

## 13. DropItem.cs

### 13-1. 이전 스크립트 전체

```cs
﻿using System.Threading.Tasks;
using UnityEngine;

/// <summary>
/// 바닥에 떨어져 있는 아이템 오브젝트.
/// 플레이어가 상호작용하면 실제로 주울 수 있는 수량만 인벤토리에 반영한다.
/// </summary>
public class DropItem : MonoBehaviour, IInteractable
{
    public ItemData itemData;   // 드랍 아이템이 가지고 있는 실제 아이템 데이터
    public int stackCount;      // 바닥에 남아 있는 수량

    [SerializeField] private SpriteRenderer itemIconRenderer; // 공통 드랍 프리팹에서 아이템별 아이콘을 표시할 렌더러

    private void Awake()
    {
        ResolveIconRenderer();
    }

    private void OnValidate()
    {
        ResolveIconRenderer();
    }

    /// <summary>
    /// 인벤토리에서 버려진 아이템 데이터와 수량을 주입하고, 월드 표시 이미지를 갱신한다.
    /// </summary>
    public void Initialize(ItemData data, int count)
    {
        itemData = data;
        stackCount = count;

        _ = RefreshIconAsync();
    }

    public bool Interact(int playerID)
    {
        if (itemData == null || stackCount <= 0)
        {
            Debug.LogWarning("DropItem: 유효하지 않은 드랍 아이템 데이터입니다.");
            return false;
        }

        if (!TryFindPicker(playerID, out MonoBehaviour pickupHandler))
        {
            Debug.LogWarning($"DropItem: playerID={playerID} 에 해당하는 픽업 처리 대상을 찾지 못했습니다.");
            return false;
        }

        int remain = InvokePickupHandler(pickupHandler);
        if (remain >= stackCount)
        {
            Debug.Log("인벤토리가 가득 차서 아이템을 주울 수 없습니다.");
            return false;
        }

        stackCount = remain;

        // 전부 주웠으면 월드 아이템을 제거한다.
        if (stackCount <= 0)
        {
            Destroy(gameObject);
            return true;
        }

        // 일부만 주운 경우에는 바닥에 남겨 둔다.
        return false;
    }

    /// <summary>
    /// 프리팹 연결 누락을 줄이기 위해 자식 SpriteRenderer를 자동으로 찾는다.
    /// </summary>
    private void ResolveIconRenderer()
    {
        if (itemIconRenderer == null)
        {
            itemIconRenderer = GetComponentInChildren<SpriteRenderer>(true);
        }
    }

    /// <summary>
    /// JSON 아이템 데이터의 아이콘 주소를 읽어 공통 드랍 프리팹의 이미지를 아이템별로 교체한다.
    /// </summary>
    private async Task RefreshIconAsync()
    {
        ResolveIconRenderer();

        if (itemIconRenderer == null || itemData == null || string.IsNullOrEmpty(itemData.iconAddress))
        {
            return;
        }

        Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(itemData.iconAddress);
        if (loadedIcon == null)
        {
            return;
        }
        else
        {
            Debug.Log($"Sprite size: {loadedIcon.bounds.size.x} × {loadedIcon.bounds.size.y}");
        }

        // 이미지의 실제 크기에 비례한 비율로 유니티 유닛 단위에 맞게 축소해 출력되는 이미지의 크기를 일정하게 유지
        float iconMultiple = loadedIcon != null ? Mathf.Min(1 / loadedIcon.bounds.size.x, 1 / loadedIcon.bounds.size.y) : 1f;
        itemIconRenderer.transform.localScale = Vector3.one * iconMultiple;
        itemIconRenderer.sprite = loadedIcon;
    }

    /// <summary>
    /// 상호작용한 플레이어 ID와 일치하는 픽업 처리 대상을 찾는다.
    /// </summary>
    private bool TryFindPicker(int playerID, out MonoBehaviour pickupHandler)
    {
        EntityIdentity[] identities = FindObjectsOfType<EntityIdentity>();
        pickupHandler = null;

        for (int i = 0; i < identities.Length; i++)
        {
            if (identities[i] == null || identities[i].entityID != playerID)
                continue;

            pickupHandler = identities[i].GetComponent("InventoryPresenter") as MonoBehaviour;
            return pickupHandler != null;
        }

        return false;
    }

    /// <summary>
    /// PresenterAD를 직접 참조하지 않고 TryPickUpItem 메서드를 호출한다.
    /// </summary>
    private int InvokePickupHandler(MonoBehaviour pickupHandler)
    {
        if (pickupHandler == null)
            return stackCount;

        var pickupMethod = pickupHandler.GetType().GetMethod("TryPickUpItem");
        if (pickupMethod == null)
        {
            Debug.LogWarning("DropItem: TryPickUpItem 메서드를 찾지 못했습니다.");
            return stackCount;
        }

        object result = pickupMethod.Invoke(pickupHandler, new object[] { itemData, stackCount });
        if (result is int remain)
            return remain;

        Debug.LogWarning("DropItem: TryPickUpItem 반환값을 처리하지 못했습니다.");
        return stackCount;
    }
}
```

### 13-2. 변경 설명

월드 아이템 생성과 실제 획득 성공 시점에 드롭·획득 VFX를 연결했다. 아이템 데이터와 수량 처리에는 손대지 않고 결과가 확정된 지점에서만 효과를 호출한다.

### 13-3. 현재 스크립트 전체

```cs
﻿using System.Threading.Tasks;
using UnityEngine;

/// <summary>
/// 바닥에 떨어져 있는 아이템 오브젝트.
/// 플레이어가 상호작용하면 실제로 주울 수 있는 수량만 인벤토리에 반영한다.
/// </summary>
public class DropItem : MonoBehaviour, IInteractable
{
    public ItemData itemData;   // 드랍 아이템이 가지고 있는 실제 아이템 데이터
    public int stackCount;      // 바닥에 남아 있는 수량

    [SerializeField] private SpriteRenderer itemIconRenderer; // 공통 드랍 프리팹에서 아이템별 아이콘을 표시할 렌더러

    private void Awake()
    {
        ResolveIconRenderer();
    }

    private void OnValidate()
    {
        ResolveIconRenderer();
    }

    /// <summary>
    /// 인벤토리에서 버려진 아이템 데이터와 수량을 주입하고, 월드 표시 이미지를 갱신한다.
    /// </summary>
    public void Initialize(ItemData data, int count)
    {
        itemData = data;
        stackCount = count;

        _ = RefreshIconAsync();
    }

    public bool Interact(int playerID)
    {
        if (itemData == null || stackCount <= 0)
        {
            Debug.LogWarning("DropItem: 유효하지 않은 드랍 아이템 데이터입니다.");
            return false;
        }

        if (!TryFindPicker(playerID, out MonoBehaviour pickupHandler))
        {
            Debug.LogWarning($"DropItem: playerID={playerID} 에 해당하는 픽업 처리 대상을 찾지 못했습니다.");
            return false;
        }

        int previousCount = stackCount;
        int remain = InvokePickupHandler(pickupHandler);
        if (remain >= stackCount)
        {
            Debug.Log("인벤토리가 가득 차서 아이템을 주울 수 없습니다.");
            return false;
        }

        stackCount = remain;
        if (stackCount < previousCount)
            VFXService.Instance?.Play(GameplayVFXIds.ItemPickup, transform.position, transform.rotation);

        // 전부 주웠으면 월드 아이템을 제거한다.
        if (stackCount <= 0)
        {
            Destroy(gameObject);
            return true;
        }

        // 일부만 주운 경우에는 바닥에 남겨 둔다.
        return false;
    }

    /// <summary>
    /// 프리팹 연결 누락을 줄이기 위해 자식 SpriteRenderer를 자동으로 찾는다.
    /// </summary>
    private void ResolveIconRenderer()
    {
        if (itemIconRenderer == null)
        {
            itemIconRenderer = GetComponentInChildren<SpriteRenderer>(true);
        }
    }

    /// <summary>
    /// JSON 아이템 데이터의 아이콘 주소를 읽어 공통 드랍 프리팹의 이미지를 아이템별로 교체한다.
    /// </summary>
    private async Task RefreshIconAsync()
    {
        ResolveIconRenderer();

        if (itemIconRenderer == null || itemData == null || string.IsNullOrEmpty(itemData.iconAddress))
        {
            return;
        }

        Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(itemData.iconAddress);
        if (loadedIcon == null)
        {
            return;
        }
        else
        {
            Debug.Log($"Sprite size: {loadedIcon.bounds.size.x} × {loadedIcon.bounds.size.y}");
        }

        // 이미지의 실제 크기에 비례한 비율로 유니티 유닛 단위에 맞게 축소해 출력되는 이미지의 크기를 일정하게 유지
        float iconMultiple = loadedIcon != null ? Mathf.Min(1 / loadedIcon.bounds.size.x, 1 / loadedIcon.bounds.size.y) : 1f;
        itemIconRenderer.transform.localScale = Vector3.one * iconMultiple;
        itemIconRenderer.sprite = loadedIcon;
    }

    /// <summary>
    /// 상호작용한 플레이어 ID와 일치하는 픽업 처리 대상을 찾는다.
    /// </summary>
    private bool TryFindPicker(int playerID, out MonoBehaviour pickupHandler)
    {
        EntityIdentity[] identities = FindObjectsOfType<EntityIdentity>();
        pickupHandler = null;

        for (int i = 0; i < identities.Length; i++)
        {
            if (identities[i] == null || identities[i].entityID != playerID)
                continue;

            pickupHandler = identities[i].GetComponent("InventoryPresenter") as MonoBehaviour;
            return pickupHandler != null;
        }

        return false;
    }

    /// <summary>
    /// PresenterAD를 직접 참조하지 않고 TryPickUpItem 메서드를 호출한다.
    /// </summary>
    private int InvokePickupHandler(MonoBehaviour pickupHandler)
    {
        if (pickupHandler == null)
            return stackCount;

        var pickupMethod = pickupHandler.GetType().GetMethod("TryPickUpItem");
        if (pickupMethod == null)
        {
            Debug.LogWarning("DropItem: TryPickUpItem 메서드를 찾지 못했습니다.");
            return stackCount;
        }

        object result = pickupMethod.Invoke(pickupHandler, new object[] { itemData, stackCount });
        if (result is int remain)
            return remain;

        Debug.LogWarning("DropItem: TryPickUpItem 반환값을 처리하지 못했습니다.");
        return stackCount;
    }
}
```

---

## 14. EnemyMovement.cs

### 14-1. 이전 스크립트 전체

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

### 14-2. 변경 설명

에너미 공격 애니메이션 이벤트와 이동 상태에서 VFX 호출 진입점을 연결했다. 기존 AI 판단·이동 모듈 구조를 유지하면서 공격 또는 행동 시점의 위치와 방향만 서비스에 전달한다.

### 14-3. 현재 스크립트 전체

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
        boxCollider.enabled = false;

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

## 15. EnemyStatus.cs

### 15-1. 이전 스크립트 전체

```cs
using System;
using UnityEngine;

public class EnemyStatus : MonoBehaviour, IEffectReceiver
{
    // 이번 AI 고도화 작업 기준으로 순찰 상태와 복귀 상태를 추가합니다.
    public enum EnemyState
    {
        Idle,
        Patrol,
        Investigate,
        Return,
        Chase,
        Attack,
        Dead
    }

    public EnemyState nowState { get; private set; }    // 현재 적 상태
    public bool isAttacking { get; private set; }       // 공격 실행 중 여부

    public int objID = 0;                               // 각 적 개체를 구분하는 런타임 고유 번호
    public float hpMax;                                 // 최대 체력
    public float hpCurrent;                             // 현재 체력
    public float atkValue { get; private set; }         // 공격력
    public float defValue { get; private set; }         // 방어력

    public event Action OnLocalDeath;                   // 이 적 자신이 죽었을 때만 호출되는 로컬 사망 이벤트
    public event Action<float, float> OnLocalHealthChanged; // 이 적 자신에게 연결된 HP UI만 갱신하기 위한 로컬 체력 이벤트

    private EntityIdentity entityIdentity;              // 런타임 식별 번호를 함께 맞춰 줄 식별 컴포넌트

    public void SetIsAttacking(bool attacking)
    {
        isAttacking = attacking;
    }

    public void SetNowState(EnemyState state)
    {
        nowState = state;
    }

    private void Awake()
    {
        entityIdentity = GetComponent<EntityIdentity>();
        SyncRuntimeIdentity();

        nowState = EnemyState.Idle;

        // 현재 프로젝트에서는 기본 스탯을 여기서 초기화합니다.
        hpMax = 100.0f;
        hpCurrent = hpMax;
        atkValue = 10.0f;
        defValue = 0.0f;
    }

    private void Start()
    {
        SyncRuntimeIdentity();
        BroadcastHealthChanged();
    }

    public Faction EntityFaction => Faction.enemy;

    public void TakeDamage(float damage)
    {
        SyncRuntimeIdentity();

        hpCurrent = Mathf.Clamp(hpCurrent - damage, 0.0f, hpMax);
        BroadcastHealthChanged();

        if (hpCurrent <= 0.0f)
        {
            nowState = EnemyState.Dead;
            OnLocalDeath?.Invoke();
            GlobalEventBus.OnEnemyDead?.Invoke(objID);
        }
    }

    public event Action<Transform, float> OnAggroApplied;       // 강제 추적 타겟 지정 이벤트

    public void ApplyAggro(Transform target, float duration)
    {
        OnAggroApplied?.Invoke(target, duration);
    }

    /// <summary>
    /// SpawnManager가 적을 생성한 직후 런타임 고유 번호를 넣어 줄 때 호출합니다.
    /// EnemyStatus와 EntityIdentity가 같은 번호를 바라보도록 한 곳에서 함께 맞춥니다.
    /// </summary>
    public void SetRuntimeObjectId(int runtimeId)
    {
        objID = runtimeId;

        if (entityIdentity != null)
        {
            entityIdentity.SetupIdentity(runtimeId, Faction.enemy);
        }
    }

    /// <summary>
    /// 자기 자신에게 연결된 UI와, 디버그/시스템용 전역 이벤트를 함께 갱신합니다.
    /// 수정 이유:
    /// 기존에는 모든 적 UI가 같은 전역 체력 이벤트를 같이 받아서 한 마리가 맞아도 전부 갱신됐습니다.
    /// 그래서 개별 UI용 로컬 이벤트를 따로 두고, 전역 이벤트는 식별자와 함께 유지하도록 나눴습니다.
    /// </summary>
    private void BroadcastHealthChanged()
    {
        OnLocalHealthChanged?.Invoke(hpCurrent, hpMax);
        GlobalEventBus.OnEnemyHealthChanged?.Invoke(objID, hpCurrent, hpMax);
    }

    /// <summary>
    /// 런타임 번호가 아직 정해지지 않았다면 임시 고유 번호를 만들고,
    /// EntityIdentity와 EnemyStatus의 번호가 어긋나면 다시 동기화합니다.
    /// SpawnManager가 따로 번호를 주면 그 값을 최종 번호로 덮어씁니다.
    /// </summary>
    private void SyncRuntimeIdentity()
    {
        if (objID <= 0)
        {
            objID = GetInstanceID();
        }

        if (entityIdentity != null &&
            (entityIdentity.entityID != objID || entityIdentity.entityFaction != Faction.enemy))
        {
            entityIdentity.SetupIdentity(objID, Faction.enemy);
        }
    }

    public void HealthRecoverInst(float amount)
    {
        hpCurrent = Mathf.Clamp(hpCurrent + amount, 0.0f, hpMax);
        BroadcastHealthChanged();
    }

    public void ManaRecoverInst(float amount)
    {
        // 적 객체는 마나 시스템을 사용하지 않으므로 구현하지 않습니다.
    }
}
```

### 15-2. 변경 설명

에너미 피격과 사망이 확정되는 상태 변경 지점에 맞춰 피격·사망 VFX를 재생한다. HP 계산과 사망 처리는 기존 흐름을 보존한다.

### 15-3. 현재 스크립트 전체

```cs
using System;
using UnityEngine;

public class EnemyStatus : MonoBehaviour, IEffectReceiver
{
    // 이번 AI 고도화 작업 기준으로 순찰 상태와 복귀 상태를 추가합니다.
    public enum EnemyState
    {
        Idle,
        Patrol,
        Investigate,
        Return,
        Chase,
        Attack,
        Dead
    }

    public EnemyState nowState { get; private set; }    // 현재 적 상태
    public bool isAttacking { get; private set; }       // 공격 실행 중 여부

    public int objID = 0;                               // 각 적 개체를 구분하는 런타임 고유 번호
    public float hpMax;                                 // 최대 체력
    public float hpCurrent;                             // 현재 체력
    public float atkValue { get; private set; }         // 공격력
    public float defValue { get; private set; }         // 방어력

    public event Action OnLocalDeath;                   // 이 적 자신이 죽었을 때만 호출되는 로컬 사망 이벤트
    public event Action<float, float> OnLocalHealthChanged; // 이 적 자신에게 연결된 HP UI만 갱신하기 위한 로컬 체력 이벤트

    private EntityIdentity entityIdentity;              // 런타임 식별 번호를 함께 맞춰 줄 식별 컴포넌트

    public void SetIsAttacking(bool attacking)
    {
        isAttacking = attacking;
    }

    public void SetNowState(EnemyState state)
    {
        if (nowState == state)
            return;

        EnemyState previousState = nowState;
        nowState = state;

        // AI Tick마다 반복하지 않고 실제 상태 전환 순간에만 인식 계열 VFX를 재생합니다.
        switch (state)
        {
            case EnemyState.Chase:
                // 공격 직후 Chase 복귀는 새로운 발견이 아니므로 경고 VFX를 반복하지 않습니다.
                if (previousState != EnemyState.Attack)
                    VFXService.Instance?.Play(GameplayVFXIds.EnemyDetected, transform.position, transform.rotation);
                break;
            case EnemyState.Investigate:
                VFXService.Instance?.Play(GameplayVFXIds.EnemyInvestigate, transform.position, transform.rotation);
                break;
            case EnemyState.Attack:
                VFXService.Instance?.Play(GameplayVFXIds.EnemyAttackTelegraph, transform.position, transform.rotation);
                break;
        }
    }

    private void Awake()
    {
        entityIdentity = GetComponent<EntityIdentity>();
        SyncRuntimeIdentity();

        nowState = EnemyState.Idle;

        // 현재 프로젝트에서는 기본 스탯을 여기서 초기화합니다.
        hpMax = 100.0f;
        hpCurrent = hpMax;
        atkValue = 10.0f;
        defValue = 0.0f;
    }

    private void Start()
    {
        SyncRuntimeIdentity();
        BroadcastHealthChanged();
    }

    public Faction EntityFaction => Faction.enemy;

    public void TakeDamage(float damage)
    {
        if (nowState == EnemyState.Dead || damage <= 0.0f)
            return;

        SyncRuntimeIdentity();

        float previousHp = hpCurrent;
        hpCurrent = Mathf.Clamp(hpCurrent - damage, 0.0f, hpMax);
        BroadcastHealthChanged();

        if (hpCurrent <= 0.0f)
        {
            nowState = EnemyState.Dead;
            VFXService.Instance?.Play(GameplayVFXIds.EnemyDeath, transform.position, transform.rotation);
            OnLocalDeath?.Invoke();
            GlobalEventBus.OnEnemyDead?.Invoke(objID);
            return;
        }

        if (hpCurrent < previousHp)
            VFXService.Instance?.Play(GameplayVFXIds.EnemyHit, transform.position, transform.rotation);
    }

    public event Action<Transform, float> OnAggroApplied;       // 강제 추적 타겟 지정 이벤트

    public void ApplyAggro(Transform target, float duration)
    {
        OnAggroApplied?.Invoke(target, duration);
    }

    /// <summary>
    /// SpawnManager가 적을 생성한 직후 런타임 고유 번호를 넣어 줄 때 호출합니다.
    /// EnemyStatus와 EntityIdentity가 같은 번호를 바라보도록 한 곳에서 함께 맞춥니다.
    /// </summary>
    public void SetRuntimeObjectId(int runtimeId)
    {
        objID = runtimeId;

        if (entityIdentity != null)
        {
            entityIdentity.SetupIdentity(runtimeId, Faction.enemy);
        }
    }

    /// <summary>
    /// 자기 자신에게 연결된 UI와, 디버그/시스템용 전역 이벤트를 함께 갱신합니다.
    /// 수정 이유:
    /// 기존에는 모든 적 UI가 같은 전역 체력 이벤트를 같이 받아서 한 마리가 맞아도 전부 갱신됐습니다.
    /// 그래서 개별 UI용 로컬 이벤트를 따로 두고, 전역 이벤트는 식별자와 함께 유지하도록 나눴습니다.
    /// </summary>
    private void BroadcastHealthChanged()
    {
        OnLocalHealthChanged?.Invoke(hpCurrent, hpMax);
        GlobalEventBus.OnEnemyHealthChanged?.Invoke(objID, hpCurrent, hpMax);
    }

    /// <summary>
    /// 런타임 번호가 아직 정해지지 않았다면 임시 고유 번호를 만들고,
    /// EntityIdentity와 EnemyStatus의 번호가 어긋나면 다시 동기화합니다.
    /// SpawnManager가 따로 번호를 주면 그 값을 최종 번호로 덮어씁니다.
    /// </summary>
    private void SyncRuntimeIdentity()
    {
        if (objID <= 0)
        {
            objID = GetInstanceID();
        }

        if (entityIdentity != null &&
            (entityIdentity.entityID != objID || entityIdentity.entityFaction != Faction.enemy))
        {
            entityIdentity.SetupIdentity(objID, Faction.enemy);
        }
    }

    public void HealthRecoverInst(float amount)
    {
        hpCurrent = Mathf.Clamp(hpCurrent + amount, 0.0f, hpMax);
        BroadcastHealthChanged();
    }

    public void ManaRecoverInst(float amount)
    {
        // 적 객체는 마나 시스템을 사용하지 않으므로 구현하지 않습니다.
    }
}
```

---

## 16. ExitPoint.cs

### 16-1. 이전 스크립트 전체

```cs
﻿using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ExitPoint : MonoBehaviour, IInteractable
{
    private bool isEscaping = false;                    //탈출 코루틴 실행 중인지 판정
    [SerializeField] private GameObject timerCanvas;    //탈출 타이머 캔버스 (P0에서는 사용 안함)
    [SerializeField] private float escapeTime = 3.0f;   //탈출 채널링 시간 (즉시 탈출하려면 0초)
    private Coroutine escapeCoroutine;                  //탈출 채털링 코루틴
    public event Action<float> timerOn;                 //타이머 출력 이벤트 

    private void Awake()
    {
        ResolveTimerCanvasReference();

        // 초기 상태에서는 타이머 캔버스를 꺼둠
        SetTimerCanvasActive(false);
    }

    private void OnEnable()
    {
        // 탈출 중단 이벤트를 구독
        GlobalEventBus.OnEscapeFailure += EscapeFailure;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnEscapeFailure -= EscapeFailure;
    }

    public bool Interact(int playerID) 
    {
        Debug.Log($"player {playerID}가 탈출구와 상호작용 함");
        // 플레이어 상태가 idle이 아니면 탈출 판정을 시작하지 않음
        if (!PlayerStatus.IsPlayerIdle(playerID)) return false;
        // 이미 탈출 판정 중이면 탈출 판정을 중복해서 시작하지 않음
        if (isEscaping) return false;
        // 달리기 입력을 취소
        GlobalEventBus.SendCanSprint?.Invoke(false);
        // 탈출 타이머 시작
        escapeCoroutine = StartCoroutine(StartEscapeTimer(playerID));
        // 상호작용 성공, 상호작용 리스트에서 삭제 요청
        return false;
    }

    private IEnumerator StartEscapeTimer(int _playerID)  //채널링 후 탈출 성공 판정을 전달
    {
        //탈출 타이머 출력(P0에서는 사용 안함)
        Debug.Log("타이머 시작");
        SetTimerCanvasActive(true);

        if (timerCanvas != null)
        {
            timerOn?.Invoke(escapeTime);
        }

        //플레이어 상태를 escape로 변경하고 탈출 판정 시작
        ResultServiceLocator.Instance.HandleEscapeStart(_playerID);
        isEscaping = true;
        // 탈출 채널링 시간 동안 대기
        yield return new WaitForSeconds(escapeTime);
        
        // 채널링 종료 후 탈출 성공 판정 이벤트를 발송
        Debug.Log("타이머 종료");
        SetTimerCanvasActive(false);
        GlobalEventBus.OnEscapeRequest?.Invoke(true);
    }

    private void EscapeFailure(int _playerID)  //플레이어의 탈출 채널링 코루틴을 중단하는 판정을 전달
    {
        //플레이어 상태를 idle로 변경하고 탈출 판정 중단
        ResultServiceLocator.Instance.HandleEscapeIdle(_playerID);
        isEscaping = false;

        //탈출 타이머 출력 종료
        SetTimerCanvasActive(isEscaping);

        //채널링 코루틴을 중단
        if (escapeCoroutine != null)
        {
            StopCoroutine(escapeCoroutine);
            escapeCoroutine = null;
        }
    }

    private void ResolveTimerCanvasReference()
    {
        // 인스펙터 연결이 빠졌다면 자식 오브젝트에서 타이머 UI를 자동으로 탐색
        if (timerCanvas != null) return;

        EscapeTimer escapeTimer = GetComponentInChildren<EscapeTimer>(true);
        if (escapeTimer != null)
        {
            timerCanvas = escapeTimer.gameObject;
        }

        if (timerCanvas == null)
        {
            Debug.LogWarning($"{name} ExitPoint의 timerCanvas가 비어 있습니다. 타이머 UI 없이 탈출 기능만 동작합니다.", this);
        }
    }

    private void SetTimerCanvasActive(bool isActive)
    {
        // P0처럼 타이머 UI를 사용하지 않는 씬에서는 null 예외 없이 안전하게 넘어감
        if (timerCanvas == null) return;

        timerCanvas.SetActive(isActive);
    }
}
```

### 16-2. 변경 설명

탈출 상호작용과 채널링 결과에 맞는 VFX 호출을 추가했다. 탈출 성공 여부와 시간 처리 규칙은 유지하고 시각 피드백만 결합했다.

### 16-3. 현재 스크립트 전체

```cs
﻿using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ExitPoint : MonoBehaviour, IInteractable
{
    private bool isEscaping = false;                    //탈출 코루틴 실행 중인지 판정
    [SerializeField] private GameObject timerCanvas;    //탈출 타이머 캔버스 (P0에서는 사용 안함)
    [SerializeField] private float escapeTime = 3.0f;   //탈출 채널링 시간 (즉시 탈출하려면 0초)
    private Coroutine escapeCoroutine;                  //탈출 채털링 코루틴
    private PooledVFX activeEscapeVfx;                  //탈출 성공/취소까지 유지할 채널링 VFX
    private int escapeVfxRequestVersion;                //비동기 로드 중 취소된 요청을 구분하는 버전
    public event Action<float> timerOn;                 //타이머 출력 이벤트 

    private void Awake()
    {
        ResolveTimerCanvasReference();

        // 초기 상태에서는 타이머 캔버스를 꺼둠
        SetTimerCanvasActive(false);
    }

    private void OnEnable()
    {
        // 탈출 중단 이벤트를 구독
        GlobalEventBus.OnEscapeFailure += EscapeFailure;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnEscapeFailure -= EscapeFailure;
        EndEscapeChannelVfx();
    }

    public bool Interact(int playerID) 
    {
        Debug.Log($"player {playerID}가 탈출구와 상호작용 함");
        // 플레이어 상태가 idle이 아니면 탈출 판정을 시작하지 않음
        if (!PlayerStatus.IsPlayerIdle(playerID)) return false;
        // 이미 탈출 판정 중이면 탈출 판정을 중복해서 시작하지 않음
        if (isEscaping) return false;
        // 달리기 입력을 취소
        GlobalEventBus.SendCanSprint?.Invoke(false);
        // 탈출 타이머 시작
        escapeCoroutine = StartCoroutine(StartEscapeTimer(playerID));
        // 상호작용 성공, 상호작용 리스트에서 삭제 요청
        return false;
    }

    private IEnumerator StartEscapeTimer(int _playerID)  //채널링 후 탈출 성공 판정을 전달
    {
        //탈출 타이머 출력(P0에서는 사용 안함)
        Debug.Log("타이머 시작");
        SetTimerCanvasActive(true);

        if (timerCanvas != null)
        {
            timerOn?.Invoke(escapeTime);
        }

        //플레이어 상태를 escape로 변경하고 탈출 판정 시작
        ResultServiceLocator.Instance.HandleEscapeStart(_playerID);
        isEscaping = true;
        BeginEscapeChannelVfx();
        // 탈출 채널링 시간 동안 대기
        yield return new WaitForSeconds(escapeTime);
        
        // 채널링 종료 후 탈출 성공 판정 이벤트를 발송
        Debug.Log("타이머 종료");
        SetTimerCanvasActive(false);
        isEscaping = false;
        EndEscapeChannelVfx();
        VFXService.Instance?.Play(GameplayVFXIds.EscapeSuccess, transform.position, transform.rotation);
        GlobalEventBus.OnEscapeRequest?.Invoke(true);
    }

    private void EscapeFailure(int _playerID)  //플레이어의 탈출 채널링 코루틴을 중단하는 판정을 전달
    {
        if (!isEscaping)
            return;

        //플레이어 상태를 idle로 변경하고 탈출 판정 중단
        ResultServiceLocator.Instance.HandleEscapeIdle(_playerID);
        isEscaping = false;
        EndEscapeChannelVfx();
        VFXService.Instance?.Play(GameplayVFXIds.EscapeCancel, transform.position, transform.rotation);

        //탈출 타이머 출력 종료
        SetTimerCanvasActive(isEscaping);

        //채널링 코루틴을 중단
        if (escapeCoroutine != null)
        {
            StopCoroutine(escapeCoroutine);
            escapeCoroutine = null;
        }
    }

    /// <summary>
    /// Addressable 로드를 기다린 뒤 채널링이 여전히 진행 중일 때만 VFX 인스턴스를 유지합니다.
    /// </summary>
    private async void BeginEscapeChannelVfx()
    {
        VFXService service = VFXService.Instance;
        if (service == null)
            return;

        int requestVersion = ++escapeVfxRequestVersion;
        PooledVFX rentedVfx = await service.PlayAsync(
            GameplayVFXIds.EscapeChannel,
            VFXContext.At(transform.position, transform.rotation));

        if (this == null || !isEscaping || requestVersion != escapeVfxRequestVersion)
        {
            rentedVfx?.Release();
            return;
        }

        activeEscapeVfx = rentedVfx;
    }

    private void EndEscapeChannelVfx()
    {
        escapeVfxRequestVersion++;
        activeEscapeVfx?.Release();
        activeEscapeVfx = null;
    }

    private void ResolveTimerCanvasReference()
    {
        // 인스펙터 연결이 빠졌다면 자식 오브젝트에서 타이머 UI를 자동으로 탐색
        if (timerCanvas != null) return;

        EscapeTimer escapeTimer = GetComponentInChildren<EscapeTimer>(true);
        if (escapeTimer != null)
        {
            timerCanvas = escapeTimer.gameObject;
        }

        if (timerCanvas == null)
        {
            Debug.LogWarning($"{name} ExitPoint의 timerCanvas가 비어 있습니다. 타이머 UI 없이 탈출 기능만 동작합니다.", this);
        }
    }

    private void SetTimerCanvasActive(bool isActive)
    {
        // P0처럼 타이머 UI를 사용하지 않는 씬에서는 null 예외 없이 안전하게 넘어감
        if (timerCanvas == null) return;

        timerCanvas.SetActive(isActive);
    }
}
```

---

## 17. GrenadeProjectile.cs

### 17-1. 이전 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GrenadeProjectile : MonoBehaviour
{
    private SkillData skillData;
    private GameObject user;
    private CasterStatPayload playerstat;

    [Header("투척 연출 설정")]
    public float flightDuration = 0.5f; // 목적지까지 날아가는 데 걸리는 시간
    public float arcHeight = 3.0f;      // 포물선의 최대 높이

    public void SetupAndThrow(SkillData _skill, GameObject _skillUser, CasterStatPayload _stats, Vector3 _targetPosition)
    {
        skillData = _skill;
        user = _skillUser;
        playerstat = _stats;

        // 목표 지점으로 날아가는 물리 로직
        StartCoroutine(MoveToTarget(_targetPosition));
    }

    private IEnumerator MoveToTarget(Vector3 targetPosition)
    {
        Vector3 startPosition = transform.position;
        float elapsedTime = 0f;

        // flightDuration(0.5초) 동안 목적지를 향해 날아갑니다.
        while (elapsedTime < flightDuration)
        {
            elapsedTime += Time.deltaTime;
            
            // 0.0 ~ 1.0 사이의 진행률 (시간 비율)
            float percent = elapsedTime / flightDuration;

            // 1. 선형 이동 (시작점에서 목표점까지 직선 이동)
            Vector3 currentPos = Vector3.Lerp(startPosition, targetPosition, percent);

            // 2. 포물선 높이 계산 (Mathf.Sin을 사용해 0->1->0 으로 부드럽게 올라갔다 내려오는 곡선 생성)
            float heightOffset = Mathf.Sin(percent * Mathf.PI) * arcHeight;

            // 직선 이동 좌표에 높이를 더해 최종 좌표 적용
            currentPos.y += heightOffset;
            transform.position = currentPos;

            yield return null; // 다음 프레임까지 대기
        }

        // 임시로 목표 지점에 바로 도착했다고 가정
        transform.position = targetPosition;

        // 도착했으니 폭발 대기열 시작
        StartCoroutine(ExplosionSequence());
        yield return null;
    }

    private IEnumerator ExplosionSequence()
    {
        // 첫번째 스킬 효과의 딜레이를 가져와 대기
        float delay = skillData.effects.Count > 0 ? skillData.effects[0].effectDelay : 0.0f;
        yield return new WaitForSeconds(delay);

        // 모든 효과 중 가장 넓은 범위와 최대 어그로 지속 시간을 탐색
        float maxRadius = 0f;
        float maxDuration = 0f;
        foreach (var effect in skillData.effects)
        {
            if (effect.areaWidth > maxRadius) maxRadius = effect.areaWidth;
            if (effect.effectType == EffectType.aggro && effect.effectValue > maxDuration) maxDuration = effect.effectValue;
        }

        // 폭발 수행 및 범위 내 콜라이더 탐색
        Collider[] hitColliders = Physics.OverlapSphere(transform.position, maxRadius);

        // 이미 효과를 받은 대상을 기록하여 중복 타격을 방지
        HashSet<IEffectReceiver> hitReceivers = new HashSet<IEffectReceiver>();
        IEffectReceiver userReceiver = user != null ? user.GetComponent<IEffectReceiver>() : null;

        // 범위 내 콜라이더들에 대해 차례대로 이펙트 판정 수행
        foreach(Collider hit in hitColliders)
        {
            // 적의 콜라이더가 자식 오브젝트에 있을 수 있으므로 GetComponentInParent를 사용
            IEffectReceiver receiver = hit.GetComponentInParent<IEffectReceiver>();
            
            if (receiver != null && receiver != userReceiver && !hitReceivers.Contains(receiver))
            {
                hitReceivers.Add(receiver);
                
                // 실제 거리를 계산하여 범위 내에 있는지 효과별로 확인하도록 거리를 함께 전달
                MonoBehaviour receiverMono = receiver as MonoBehaviour;
                if (receiverMono != null)
                {
                    float distance = Vector3.Distance(transform.position, receiverMono.transform.position);
                    ApplySkillEffects(receiver, distance);
                }
            }
        }

        // 어그로 효과가 있다면 타겟으로 지정될 수 있도록 파괴를 지연시킵니다
        if (maxDuration > 0f)
        {
            MeshRenderer mesh = GetComponentInChildren<MeshRenderer>();
            yield return new WaitForSeconds(maxDuration);
        }

        Destroy(gameObject);
    }

    private void ApplySkillEffects(IEffectReceiver _receiver, float distance)
    {
        foreach(SkillEffect effect in skillData.effects)
        {
            // 해당 효과의 범위를 벗어났으면 무시
            if (distance > effect.areaWidth) continue;

            switch(effect.effectType)
            {
                case EffectType.damage:
                    _receiver.TakeDamage(playerstat.attackPower * effect.effectValue); 
                    break;
                case EffectType.aggro:
                    _receiver.ApplyAggro(this.transform, effect.effectValue);
                    break;
            }
        }
    }

    private void OnDrawGizmos()
    {
        if (skillData != null)
        {
            Gizmos.color = Color.red;
            float maxRadius = 0f;
            foreach (var effect in skillData.effects)
            {
                if (effect.areaWidth > maxRadius) maxRadius = effect.areaWidth;
            }
            Gizmos.DrawWireSphere(transform.position, maxRadius);
        }
    }
}
```

### 17-2. 변경 설명

유탄 투척체 생성, 일정 시간 후 프리즘 폭발, 후속 디코이 발현이라는 3단계를 각각 구분해 VFX를 연결했다. 하나의 긴 효과가 아니라 상태별 독립 효과로 나눠 수명과 위치를 개별 조절할 수 있다.

### 17-3. 현재 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GrenadeProjectile : MonoBehaviour
{
    private SkillData skillData;
    private GameObject user;
    private CasterStatPayload playerstat;

    [Header("투척 연출 설정")]
    public float flightDuration = 0.5f; // 목적지까지 날아가는 데 걸리는 시간
    public float arcHeight = 3.0f;      // 포물선의 최대 높이

    public void SetupAndThrow(SkillData _skill, GameObject _skillUser, CasterStatPayload _stats, Vector3 _targetPosition)
    {
        skillData = _skill;
        user = _skillUser;
        playerstat = _stats;

        // 목표 지점으로 날아가는 물리 로직
        StartCoroutine(MoveToTarget(_targetPosition));
    }

    private IEnumerator MoveToTarget(Vector3 targetPosition)
    {
        Vector3 startPosition = transform.position;
        float elapsedTime = 0f;

        // flightDuration(0.5초) 동안 목적지를 향해 날아갑니다.
        while (elapsedTime < flightDuration)
        {
            elapsedTime += Time.deltaTime;
            
            // 0.0 ~ 1.0 사이의 진행률 (시간 비율)
            float percent = elapsedTime / flightDuration;

            // 1. 선형 이동 (시작점에서 목표점까지 직선 이동)
            Vector3 currentPos = Vector3.Lerp(startPosition, targetPosition, percent);

            // 2. 포물선 높이 계산 (Mathf.Sin을 사용해 0->1->0 으로 부드럽게 올라갔다 내려오는 곡선 생성)
            float heightOffset = Mathf.Sin(percent * Mathf.PI) * arcHeight;

            // 직선 이동 좌표에 높이를 더해 최종 좌표 적용
            currentPos.y += heightOffset;
            transform.position = currentPos;

            yield return null; // 다음 프레임까지 대기
        }

        // 임시로 목표 지점에 바로 도착했다고 가정
        transform.position = targetPosition;

        // 도착했으니 폭발 대기열 시작
        StartCoroutine(ExplosionSequence());
        yield return null;
    }

    private IEnumerator ExplosionSequence()
    {
        // 첫번째 스킬 효과의 딜레이를 가져와 대기
        float delay = skillData.effects.Count > 0 ? skillData.effects[0].effectDelay : 0.0f;
        yield return new WaitForSeconds(delay);

        // 같은 폭발에 동일한 effectHitVFX ID가 여러 번 있어도 한 번만 재생합니다.
        if (VFXService.Instance != null)
        {
            HashSet<string> playedVfxIds = new HashSet<string>();
            foreach (SkillEffect effect in skillData.effects)
            {
                if (!string.IsNullOrWhiteSpace(effect.effectHitVFX) && playedVfxIds.Add(effect.effectHitVFX))
                    VFXService.Instance.Play(effect.effectHitVFX, transform.position, transform.rotation);
            }
        }

        // 모든 효과 중 가장 넓은 범위와 최대 어그로 지속 시간을 탐색
        float maxRadius = 0f;
        float maxDuration = 0f;
        foreach (var effect in skillData.effects)
        {
            if (effect.areaWidth > maxRadius) maxRadius = effect.areaWidth;
            if (effect.effectType == EffectType.aggro && effect.effectValue > maxDuration) maxDuration = effect.effectValue;
        }

        // 폭발 수행 및 범위 내 콜라이더 탐색
        Collider[] hitColliders = Physics.OverlapSphere(transform.position, maxRadius);

        // 이미 효과를 받은 대상을 기록하여 중복 타격을 방지
        HashSet<IEffectReceiver> hitReceivers = new HashSet<IEffectReceiver>();
        IEffectReceiver userReceiver = user != null ? user.GetComponent<IEffectReceiver>() : null;

        // 범위 내 콜라이더들에 대해 차례대로 이펙트 판정 수행
        foreach(Collider hit in hitColliders)
        {
            // 적의 콜라이더가 자식 오브젝트에 있을 수 있으므로 GetComponentInParent를 사용
            IEffectReceiver receiver = hit.GetComponentInParent<IEffectReceiver>();
            
            if (receiver != null && receiver != userReceiver && !hitReceivers.Contains(receiver))
            {
                hitReceivers.Add(receiver);
                
                // 실제 거리를 계산하여 범위 내에 있는지 효과별로 확인하도록 거리를 함께 전달
                MonoBehaviour receiverMono = receiver as MonoBehaviour;
                if (receiverMono != null)
                {
                    float distance = Vector3.Distance(transform.position, receiverMono.transform.position);
                    ApplySkillEffects(receiver, distance);
                }
            }
        }

        // 어그로 효과가 있다면 타겟으로 지정될 수 있도록 파괴를 지연시킵니다
        if (maxDuration > 0f)
        {
            MeshRenderer mesh = GetComponentInChildren<MeshRenderer>();
            yield return new WaitForSeconds(maxDuration);
        }

        Destroy(gameObject);
    }

    private void ApplySkillEffects(IEffectReceiver _receiver, float distance)
    {
        foreach(SkillEffect effect in skillData.effects)
        {
            // 해당 효과의 범위를 벗어났으면 무시
            if (distance > effect.areaWidth) continue;

            switch(effect.effectType)
            {
                case EffectType.damage:
                    _receiver.TakeDamage(playerstat.attackPower * effect.effectValue); 
                    break;
                case EffectType.aggro:
                    _receiver.ApplyAggro(this.transform, effect.effectValue);
                    break;
            }
        }
    }

    private void OnDrawGizmos()
    {
        if (skillData != null)
        {
            Gizmos.color = Color.red;
            float maxRadius = 0f;
            foreach (var effect in skillData.effects)
            {
                if (effect.areaWidth > maxRadius) maxRadius = effect.areaWidth;
            }
            Gizmos.DrawWireSphere(transform.position, maxRadius);
        }
    }
}
```

---

## 18. ItemBox.cs

### 18-1. 이전 스크립트 전체

```cs
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 플레이어가 상호작용할 수 있는 아이템 상자 클래스입니다.
/// 내부 아이템은 고정 슬롯 방식으로 관리하며,
/// 체스트 UI와 연결될 때 슬롯 인덱스가 유지되도록 설계합니다.
/// </summary>
public class ItemBox : MonoBehaviour, IInteractable
{
    [Header("Container Settings")]
    [SerializeField] private int slotCapacity = 8;                 // 상자가 가질 수 있는 최대 슬롯 수
    [SerializeField] private List<BoxItemEntry> items = new();     // 실제 슬롯 데이터 목록

    [Header("Random Loot Settings")]
    [SerializeField] private bool useRandomLoot = true;               // 시작 시 랜덤 아이템을 생성할지 여부
    [SerializeField] private int minCreateCount = 1;                  // 최소 생성 아이템 종류 수
    [SerializeField] private int maxCreateCount = 2;                  // 최대 생성 아이템 종류 수
    [SerializeField] private bool allowDuplicateLoot = false;         // 같은 후보 아이템의 중복 생성 허용 여부
    [SerializeField] private List<BoxLootOption> lootOptions = new(); // 랜덤 생성 후보 목록

    [Header("Category Loot Settings")]
    [SerializeField] private bool useCategoryLoot = true; // true면 카테고리 확률표를 사용하고, false면 기존 lootOptions를 사용합니다.
    [SerializeField] private List<BoxLootCategoryOption> categoryLootOptions = new()
    {
        new BoxLootCategoryOption
        {
            category = itemCategory.consume,
            weight = 60,
            minAmount = 1,
            maxAmount = 1,
            itemTids = new List<int> { 301, 302 }
        },
        new BoxLootCategoryOption
        {
            category = itemCategory.memory,
            weight = 30,
            minAmount = 1,
            maxAmount = 1,
            itemTids = new List<int> { 401 }
        },
        new BoxLootCategoryOption
        {
            category = itemCategory.artifact,
            weight = 10,
            minAmount = 1,
            maxAmount = 1
        }
    };

    [Header("Artifact Grade Loot Settings")]
    [SerializeField] private List<BoxArtifactLootOption> artifactLootOptions = new()
    {
        new BoxArtifactLootOption { grade = ItemGrade.normal, itemTid = 1001, weight = 55 },
        new BoxArtifactLootOption { grade = ItemGrade.uncommon, itemTid = 1002, weight = 25 },
        new BoxArtifactLootOption { grade = ItemGrade.rare, itemTid = 1003, weight = 12 },
        new BoxArtifactLootOption { grade = ItemGrade.epic, itemTid = 1004, weight = 6 },
        new BoxArtifactLootOption { grade = ItemGrade.legend, itemTid = 1005, weight = 2 }
    };

    [Header("Noise Settings")]
    // 상자를 열면 주변 적을 끌 수 있는 디코이성 소음을 함께 발생시킵니다.
    [SerializeField] private float openNoiseRange = 30.0f;
    [SerializeField] private float openNoiseDuration = 1.8f;

    private bool isOpened = false;                                    // 현재 다른 플레이어가 열어 둔 상태인지 여부
    private IItemDataRepository itemRepo;                              // TID 기반 랜덤 루트 생성을 위한 아이템 데이터 저장소

    /// <summary>
    /// 체스트 UI에서 읽어갈 슬롯 데이터 목록입니다.
    /// 항상 slotCapacity 개수에 맞춰 유지됩니다.
    /// </summary>
    public IReadOnlyList<BoxItemEntry> Items => items;

    /// <summary>
    /// 현재 상자가 가지는 슬롯 수를 반환합니다.
    /// </summary>
    public int SlotCount => items.Count;

    private void Awake()
    {
        itemRepo = new LocalJsonItemRepository();

        EnsureSlotCapacity();

        // 랜덤 루트 사용이 켜져 있고, 아직 상자가 비어 있다면 시작 시 아이템을 생성합니다.
        if (useRandomLoot && IsEmpty())
            GenerateRandomItems();
    }

    /// <summary>
    /// 인스펙터 우클릭 메뉴에서 랜덤 아이템 생성을 수동 실행합니다.
    /// 테스트용 기능이며 현재 슬롯 구조에 맞게 다시 생성합니다.
    /// </summary>
    [ContextMenu("Generate Random Items")]
    private void GenerateRandomItemsFromContextMenu()
    {
        GenerateRandomItems();
    }

    /// <summary>
    /// 플레이어가 상자와 상호작용했을 때 호출됩니다.
    /// 이미 다른 쪽에서 열려 있다면 무시하고,
    /// 처음 열리는 경우 체스트 UI 오픈 이벤트를 전달합니다.
    /// </summary>
    public bool Interact(int playerID)
    {
        if (isOpened)
            return false;

        isOpened = true;

        // Presenter가 이 이벤트를 받아 체스트 UI를 열고 데이터를 바인딩합니다.
        GlobalEventBus.OnItemBoxOpened?.Invoke(this, playerID);

        // 상자 오픈 소리는 일반 발소리보다 우선순위가 높고, 추적 중인 적도 끊어낼 수 있게 설정합니다.
        NoiseSystem.Emit(NoiseType.ChestOpen, transform.position, gameObject, openNoiseRange, openNoiseDuration, true, 40);

        // 현재 프로젝트 구조에서는 상호작용 후 별도 기본 동작을 막기 위해 false를 유지합니다.
        return false;
    }

    /// <summary>
    /// 특정 슬롯의 아이템 데이터를 반환합니다.
    /// 범위를 벗어나면 null을 반환합니다.
    /// </summary>
    public BoxItemEntry GetItem(int index)
    {
        if (index < 0 || index >= items.Count)
            return null;

        return items[index];
    }

    /// <summary>
    /// 특정 슬롯이 비어 있는지 확인합니다.
    /// 슬롯 자체가 없거나, itemData가 없거나, 수량이 0 이하이면 빈 슬롯으로 봅니다.
    /// </summary>
    public bool IsSlotEmpty(int index)
    {
        if (index < 0 || index >= items.Count)
            return true;

        BoxItemEntry entry = items[index];
        if (entry == null)
            return true;

        return entry.itemData == null || entry.amount <= 0;
    }

    /// <summary>
    /// 특정 슬롯을 빈 상태로 초기화합니다.
    /// 고정 슬롯 구조를 유지하기 위해 슬롯 자체는 삭제하지 않습니다.
    /// </summary>
    public void ClearSlot(int index)
    {
        if (index < 0 || index >= items.Count)
            return;

        if (items[index] == null)
            items[index] = CreateEmptyEntry();

        items[index].itemData = null;
        items[index].amount = 0;
    }

    /// <summary>
    /// 특정 슬롯의 수량을 차감합니다.
    /// 수량이 0 이하가 되면 슬롯을 제거하지 않고 빈 슬롯으로 초기화합니다.
    /// </summary>
    public void RemoveAmount(int index, int amount)
    {
        if (index < 0 || index >= items.Count)
            return;

        if (amount <= 0 || IsSlotEmpty(index))
            return;

        items[index].amount -= amount;

        if (items[index].amount <= 0)
            ClearSlot(index);
    }

    /// <summary>
    /// 상자 전체가 비어 있는지 확인합니다.
    /// 고정 슬롯 구조이므로 items.Count가 아니라 모든 슬롯이 비었는지를 검사합니다.
    /// </summary>
    public bool IsEmpty()
    {
        for (int i = 0; i < items.Count; i++)
        {
            if (!IsSlotEmpty(i))
                return false;
        }

        return true;
    }

    /// <summary>
    /// 체스트 UI가 닫힐 때 호출되어 상자의 열린 상태를 해제합니다.
    /// </summary>
    public void CloseBox()
    {
        isOpened = false;
    }

    /// <summary>
    /// 아이템을 상자 안에 넣고, 다 넣지 못한 남은 수량을 반환합니다.
    /// 먼저 같은 아이템 스택을 채우고, 남는 수량은 빈 슬롯에 넣습니다.
    /// </summary>
    public int TryAddItem(ItemData itemData, int count)
    {
        if (itemData == null || count <= 0)
            return count;

        int remain = count;

        // 1. 같은 아이템이 있는 슬롯에 먼저 누적
        for (int i = 0; i < items.Count; i++)
        {
            if (IsSlotEmpty(i))
                continue;

            if (items[i].itemData.TID != itemData.TID)
                continue;

            remain = TryAddToSlot(i, itemData, remain);

            if (remain <= 0)
                return 0;
        }

        // 2. 남은 수량을 빈 슬롯에 배치
        for (int i = 0; i < items.Count; i++)
        {
            if (!IsSlotEmpty(i))
                continue;

            remain = TryAddToSlot(i, itemData, remain);

            if (remain <= 0)
                return 0;
        }

        return remain;
    }

    /// <summary>
    /// 특정 슬롯 하나에 아이템을 넣고, 넣지 못한 남은 수량을 반환합니다.
    /// 비어 있는 슬롯이거나 같은 아이템 스택일 때만 실제로 추가됩니다.
    /// </summary>
    public int TryAddToSlot(int slotIndex, ItemData itemData, int count)
    {
        if (slotIndex < 0 || slotIndex >= items.Count)
            return count;

        if (itemData == null || count <= 0)
            return count;

        if (items[slotIndex] == null)
            items[slotIndex] = CreateEmptyEntry();

        BoxItemEntry slot = items[slotIndex];
        int maxStack = Mathf.Max(1, itemData.itemMultiple);

        // 빈 슬롯이면 새로 배치
        if (IsSlotEmpty(slotIndex))
        {
            int addAmount = Mathf.Min(count, maxStack);

            slot.itemData = itemData;
            slot.amount = addAmount;

            return count - addAmount;
        }

        // 다른 아이템이 들어 있으면 추가 불가
        if (slot.itemData.TID != itemData.TID)
            return count;

        // 같은 아이템이면 스택 가능한 만큼만 추가
        int canAdd = maxStack - slot.amount;

        if (canAdd <= 0)
            return count;

        int realAdd = Mathf.Min(count, canAdd);
        slot.amount += realAdd;

        return count - realAdd;
    }

    /// <summary>
    /// 랜덤 루트 후보 목록에서 아이템을 뽑아 상자 슬롯에 채웁니다.
    /// 현재 구조는 고정 슬롯 방식이므로 기존 슬롯을 모두 비운 뒤 다시 채웁니다.
    /// </summary>
    private void GenerateRandomItems()
    {
        EnsureSlotCapacity();

        int createMin = Mathf.Max(1, minCreateCount);
        int createMax = Mathf.Max(createMin, maxCreateCount);
        int createCount = Random.Range(createMin, createMax + 1);

        // 고정 슬롯 구조이므로 먼저 모든 슬롯을 비웁니다.
        ClearAllSlots();

        if (useCategoryLoot)
        {
            GenerateCategoryRandomItems(createCount);
            return;
        }

        // 유효한 후보만 따로 풀에 담습니다.
        List<BoxLootOption> pool = new List<BoxLootOption>();

        for (int i = 0; i < lootOptions.Count; i++)
        {
            if (lootOptions[i] == null || lootOptions[i].itemData == null)
                continue;

            pool.Add(lootOptions[i]);
        }

        if (pool.Count == 0)
            return;

        // 중복 불가일 때는 후보 수보다 많이 만들 수 없습니다.
        if (!allowDuplicateLoot)
            createCount = Mathf.Min(createCount, pool.Count);

        for (int i = 0; i < createCount; i++)
        {
            if (pool.Count == 0)
                break;

            BoxLootOption selectedOption = PickRandomOption(pool);

            if (selectedOption == null || selectedOption.itemData == null)
                continue;

            int minAmount = Mathf.Max(1, selectedOption.minAmount);
            int maxAmount = Mathf.Max(minAmount, selectedOption.maxAmount);
            int amount = Random.Range(minAmount, maxAmount + 1);

            // 고정 슬롯 방식에 맞게 슬롯에만 추가합니다.
            TryAddItem(selectedOption.itemData, amount);

            // 중복 생성이 꺼져 있으면 같은 후보를 풀에서 제거합니다.
            if (!allowDuplicateLoot)
                pool.Remove(selectedOption);
        }
    }

    /// <summary>
    /// 카테고리 확률표를 기준으로 아이템 종류를 먼저 뽑고, 해당 카테고리의 TID를 다시 뽑아 슬롯에 채웁니다.
    /// </summary>
    private void GenerateCategoryRandomItems(int createCount)
    {
        if (itemRepo == null)
            itemRepo = new LocalJsonItemRepository();

        List<int> createdTids = new List<int>();
        int createdCount = 0;
        int attemptCount = 0;
        int maxAttemptCount = Mathf.Max(1, createCount * 10);

        while (createdCount < createCount && attemptCount < maxAttemptCount)
        {
            attemptCount++;

            BoxLootCategoryOption selectedCategory = PickRandomCategoryOption();

            if (selectedCategory == null)
                return;

            int selectedTid = PickTidByCategory(selectedCategory);

            if (selectedTid == 0)
                continue;

            if (!allowDuplicateLoot && createdTids.Contains(selectedTid))
                continue;

            ItemData selectedItem = itemRepo.GetItemDataByID(selectedTid);

            if (selectedItem == null)
                continue;

            int minAmount = Mathf.Max(1, selectedCategory.minAmount);
            int maxAmount = Mathf.Max(minAmount, selectedCategory.maxAmount);
            int amount = Random.Range(minAmount, maxAmount + 1);

            TryAddItem(selectedItem, amount);
            createdTids.Add(selectedTid);
            createdCount++;
        }
    }

    /// <summary>
    /// consume/memory/artifact 같은 카테고리 후보를 weight 값 기준으로 선택합니다.
    /// </summary>
    private BoxLootCategoryOption PickRandomCategoryOption()
    {
        if (categoryLootOptions == null || categoryLootOptions.Count == 0)
            return null;

        int totalWeight = 0;

        for (int i = 0; i < categoryLootOptions.Count; i++)
        {
            if (categoryLootOptions[i] == null)
                continue;

            totalWeight += Mathf.Max(0, categoryLootOptions[i].weight);
        }

        if (totalWeight <= 0)
            return null;

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < categoryLootOptions.Count; i++)
        {
            if (categoryLootOptions[i] == null)
                continue;

            currentWeight += Mathf.Max(0, categoryLootOptions[i].weight);

            if (randomValue < currentWeight)
                return categoryLootOptions[i];
        }

        return null;
    }

    /// <summary>
    /// 선택된 카테고리 후보에서 실제 아이템 TID를 뽑습니다.
    /// 아티팩트는 등급 확률표를 한 번 더 거쳐 TID를 결정합니다.
    /// </summary>
    private int PickTidByCategory(BoxLootCategoryOption categoryOption)
    {
        if (categoryOption == null)
            return 0;

        if (categoryOption.category == itemCategory.artifact)
            return PickArtifactTidByGrade();

        return PickRandomTid(categoryOption.itemTids);
    }

    /// <summary>
    /// TID 후보 목록에서 같은 확률로 하나를 선택합니다.
    /// </summary>
    private int PickRandomTid(List<int> tids)
    {
        if (tids == null || tids.Count == 0)
            return 0;

        int index = Random.Range(0, tids.Count);
        return tids[index];
    }

    /// <summary>
    /// 아티팩트가 선택된 경우 등급별 weight를 기준으로 실제 아티팩트 TID를 선택합니다.
    /// </summary>
    private int PickArtifactTidByGrade()
    {
        if (artifactLootOptions == null || artifactLootOptions.Count == 0)
            return 0;

        int totalWeight = 0;

        for (int i = 0; i < artifactLootOptions.Count; i++)
        {
            if (artifactLootOptions[i] == null)
                continue;

            totalWeight += Mathf.Max(0, artifactLootOptions[i].weight);
        }

        if (totalWeight <= 0)
            return 0;

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < artifactLootOptions.Count; i++)
        {
            if (artifactLootOptions[i] == null)
                continue;

            currentWeight += Mathf.Max(0, artifactLootOptions[i].weight);

            if (randomValue < currentWeight)
                return artifactLootOptions[i].itemTid;
        }

        return 0;
    }

    /// <summary>
    /// 후보 목록에서 weight 값을 기준으로 랜덤 아이템 하나를 선택합니다.
    /// weight가 클수록 선택될 확률이 높습니다.
    /// </summary>
    private BoxLootOption PickRandomOption(List<BoxLootOption> options)
    {
        int totalWeight = 0;

        for (int i = 0; i < options.Count; i++)
        {
            totalWeight += Mathf.Max(1, options[i].weight);
        }

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < options.Count; i++)
        {
            currentWeight += Mathf.Max(1, options[i].weight);

            if (randomValue < currentWeight)
                return options[i];
        }

        // 예외 상황이더라도 마지막 후보를 반환해 null을 피합니다.
        return options[options.Count - 1];
    }

    /// <summary>
    /// 내부 슬롯 리스트를 slotCapacity 크기에 맞게 보정합니다.
    /// 부족하면 빈 슬롯을 추가하고, 넘치면 뒤에서부터 제거합니다.
    /// </summary>
    private void EnsureSlotCapacity()
    {
        if (slotCapacity < 1)
            slotCapacity = 1;

        if (items == null)
            items = new List<BoxItemEntry>();

        while (items.Count < slotCapacity)
        {
            items.Add(CreateEmptyEntry());
        }

        while (items.Count > slotCapacity)
        {
            items.RemoveAt(items.Count - 1);
        }

        for (int i = 0; i < items.Count; i++)
        {
            if (items[i] == null)
                items[i] = CreateEmptyEntry();
        }
    }

    /// <summary>
    /// 모든 슬롯을 빈 상태로 초기화합니다.
    /// 슬롯 개수 자체는 유지합니다.
    /// </summary>
    private void ClearAllSlots()
    {
        for (int i = 0; i < items.Count; i++)
        {
            ClearSlot(i);
        }
    }

    /// <summary>
    /// 비어 있는 슬롯 데이터를 하나 생성합니다.
    /// </summary>
    private BoxItemEntry CreateEmptyEntry()
    {
        return new BoxItemEntry
        {
            itemData = null,
            amount = 0
        };
    }
}
```

### 18-2. 변경 설명

상자 열기 성공 시점에 VFX를 요청하도록 연결했다. 중복 상호작용 방지와 아이템 UI 이벤트 순서는 그대로 유지한다.

### 18-3. 현재 스크립트 전체

```cs
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 플레이어가 상호작용할 수 있는 아이템 상자 클래스입니다.
/// 내부 아이템은 고정 슬롯 방식으로 관리하며,
/// 체스트 UI와 연결될 때 슬롯 인덱스가 유지되도록 설계합니다.
/// </summary>
public class ItemBox : MonoBehaviour, IInteractable
{
    [Header("Container Settings")]
    [SerializeField] private int slotCapacity = 8;                 // 상자가 가질 수 있는 최대 슬롯 수
    [SerializeField] private List<BoxItemEntry> items = new();     // 실제 슬롯 데이터 목록

    [Header("Random Loot Settings")]
    [SerializeField] private bool useRandomLoot = true;               // 시작 시 랜덤 아이템을 생성할지 여부
    [SerializeField] private int minCreateCount = 1;                  // 최소 생성 아이템 종류 수
    [SerializeField] private int maxCreateCount = 2;                  // 최대 생성 아이템 종류 수
    [SerializeField] private bool allowDuplicateLoot = false;         // 같은 후보 아이템의 중복 생성 허용 여부
    [SerializeField] private List<BoxLootOption> lootOptions = new(); // 랜덤 생성 후보 목록

    [Header("Category Loot Settings")]
    [SerializeField] private bool useCategoryLoot = true; // true면 카테고리 확률표를 사용하고, false면 기존 lootOptions를 사용합니다.
    [SerializeField] private List<BoxLootCategoryOption> categoryLootOptions = new()
    {
        new BoxLootCategoryOption
        {
            category = itemCategory.consume,
            weight = 60,
            minAmount = 1,
            maxAmount = 1,
            itemTids = new List<int> { 301, 302 }
        },
        new BoxLootCategoryOption
        {
            category = itemCategory.memory,
            weight = 30,
            minAmount = 1,
            maxAmount = 1,
            itemTids = new List<int> { 401 }
        },
        new BoxLootCategoryOption
        {
            category = itemCategory.artifact,
            weight = 10,
            minAmount = 1,
            maxAmount = 1
        }
    };

    [Header("Artifact Grade Loot Settings")]
    [SerializeField] private List<BoxArtifactLootOption> artifactLootOptions = new()
    {
        new BoxArtifactLootOption { grade = ItemGrade.normal, itemTid = 1001, weight = 55 },
        new BoxArtifactLootOption { grade = ItemGrade.uncommon, itemTid = 1002, weight = 25 },
        new BoxArtifactLootOption { grade = ItemGrade.rare, itemTid = 1003, weight = 12 },
        new BoxArtifactLootOption { grade = ItemGrade.epic, itemTid = 1004, weight = 6 },
        new BoxArtifactLootOption { grade = ItemGrade.legend, itemTid = 1005, weight = 2 }
    };

    [Header("Noise Settings")]
    // 상자를 열면 주변 적을 끌 수 있는 디코이성 소음을 함께 발생시킵니다.
    [SerializeField] private float openNoiseRange = 30.0f;
    [SerializeField] private float openNoiseDuration = 1.8f;

    private bool isOpened = false;                                    // 현재 다른 플레이어가 열어 둔 상태인지 여부
    private IItemDataRepository itemRepo;                              // TID 기반 랜덤 루트 생성을 위한 아이템 데이터 저장소

    /// <summary>
    /// 체스트 UI에서 읽어갈 슬롯 데이터 목록입니다.
    /// 항상 slotCapacity 개수에 맞춰 유지됩니다.
    /// </summary>
    public IReadOnlyList<BoxItemEntry> Items => items;

    /// <summary>
    /// 현재 상자가 가지는 슬롯 수를 반환합니다.
    /// </summary>
    public int SlotCount => items.Count;

    private void Awake()
    {
        itemRepo = new LocalJsonItemRepository();

        EnsureSlotCapacity();

        // 랜덤 루트 사용이 켜져 있고, 아직 상자가 비어 있다면 시작 시 아이템을 생성합니다.
        if (useRandomLoot && IsEmpty())
            GenerateRandomItems();
    }

    /// <summary>
    /// 인스펙터 우클릭 메뉴에서 랜덤 아이템 생성을 수동 실행합니다.
    /// 테스트용 기능이며 현재 슬롯 구조에 맞게 다시 생성합니다.
    /// </summary>
    [ContextMenu("Generate Random Items")]
    private void GenerateRandomItemsFromContextMenu()
    {
        GenerateRandomItems();
    }

    /// <summary>
    /// 플레이어가 상자와 상호작용했을 때 호출됩니다.
    /// 이미 다른 쪽에서 열려 있다면 무시하고,
    /// 처음 열리는 경우 체스트 UI 오픈 이벤트를 전달합니다.
    /// </summary>
    public bool Interact(int playerID)
    {
        if (isOpened)
            return false;

        isOpened = true;
        VFXService.Instance?.Play(GameplayVFXIds.ChestOpen, transform.position, transform.rotation);

        // Presenter가 이 이벤트를 받아 체스트 UI를 열고 데이터를 바인딩합니다.
        GlobalEventBus.OnItemBoxOpened?.Invoke(this, playerID);

        // 상자 오픈 소리는 일반 발소리보다 우선순위가 높고, 추적 중인 적도 끊어낼 수 있게 설정합니다.
        NoiseSystem.Emit(NoiseType.ChestOpen, transform.position, gameObject, openNoiseRange, openNoiseDuration, true, 40);

        // 현재 프로젝트 구조에서는 상호작용 후 별도 기본 동작을 막기 위해 false를 유지합니다.
        return false;
    }

    /// <summary>
    /// 특정 슬롯의 아이템 데이터를 반환합니다.
    /// 범위를 벗어나면 null을 반환합니다.
    /// </summary>
    public BoxItemEntry GetItem(int index)
    {
        if (index < 0 || index >= items.Count)
            return null;

        return items[index];
    }

    /// <summary>
    /// 특정 슬롯이 비어 있는지 확인합니다.
    /// 슬롯 자체가 없거나, itemData가 없거나, 수량이 0 이하이면 빈 슬롯으로 봅니다.
    /// </summary>
    public bool IsSlotEmpty(int index)
    {
        if (index < 0 || index >= items.Count)
            return true;

        BoxItemEntry entry = items[index];
        if (entry == null)
            return true;

        return entry.itemData == null || entry.amount <= 0;
    }

    /// <summary>
    /// 특정 슬롯을 빈 상태로 초기화합니다.
    /// 고정 슬롯 구조를 유지하기 위해 슬롯 자체는 삭제하지 않습니다.
    /// </summary>
    public void ClearSlot(int index)
    {
        if (index < 0 || index >= items.Count)
            return;

        if (items[index] == null)
            items[index] = CreateEmptyEntry();

        items[index].itemData = null;
        items[index].amount = 0;
    }

    /// <summary>
    /// 특정 슬롯의 수량을 차감합니다.
    /// 수량이 0 이하가 되면 슬롯을 제거하지 않고 빈 슬롯으로 초기화합니다.
    /// </summary>
    public void RemoveAmount(int index, int amount)
    {
        if (index < 0 || index >= items.Count)
            return;

        if (amount <= 0 || IsSlotEmpty(index))
            return;

        items[index].amount -= amount;

        if (items[index].amount <= 0)
            ClearSlot(index);
    }

    /// <summary>
    /// 상자 전체가 비어 있는지 확인합니다.
    /// 고정 슬롯 구조이므로 items.Count가 아니라 모든 슬롯이 비었는지를 검사합니다.
    /// </summary>
    public bool IsEmpty()
    {
        for (int i = 0; i < items.Count; i++)
        {
            if (!IsSlotEmpty(i))
                return false;
        }

        return true;
    }

    /// <summary>
    /// 체스트 UI가 닫힐 때 호출되어 상자의 열린 상태를 해제합니다.
    /// </summary>
    public void CloseBox()
    {
        isOpened = false;
    }

    /// <summary>
    /// 아이템을 상자 안에 넣고, 다 넣지 못한 남은 수량을 반환합니다.
    /// 먼저 같은 아이템 스택을 채우고, 남는 수량은 빈 슬롯에 넣습니다.
    /// </summary>
    public int TryAddItem(ItemData itemData, int count)
    {
        if (itemData == null || count <= 0)
            return count;

        int remain = count;

        // 1. 같은 아이템이 있는 슬롯에 먼저 누적
        for (int i = 0; i < items.Count; i++)
        {
            if (IsSlotEmpty(i))
                continue;

            if (items[i].itemData.TID != itemData.TID)
                continue;

            remain = TryAddToSlot(i, itemData, remain);

            if (remain <= 0)
                return 0;
        }

        // 2. 남은 수량을 빈 슬롯에 배치
        for (int i = 0; i < items.Count; i++)
        {
            if (!IsSlotEmpty(i))
                continue;

            remain = TryAddToSlot(i, itemData, remain);

            if (remain <= 0)
                return 0;
        }

        return remain;
    }

    /// <summary>
    /// 특정 슬롯 하나에 아이템을 넣고, 넣지 못한 남은 수량을 반환합니다.
    /// 비어 있는 슬롯이거나 같은 아이템 스택일 때만 실제로 추가됩니다.
    /// </summary>
    public int TryAddToSlot(int slotIndex, ItemData itemData, int count)
    {
        if (slotIndex < 0 || slotIndex >= items.Count)
            return count;

        if (itemData == null || count <= 0)
            return count;

        if (items[slotIndex] == null)
            items[slotIndex] = CreateEmptyEntry();

        BoxItemEntry slot = items[slotIndex];
        int maxStack = Mathf.Max(1, itemData.itemMultiple);

        // 빈 슬롯이면 새로 배치
        if (IsSlotEmpty(slotIndex))
        {
            int addAmount = Mathf.Min(count, maxStack);

            slot.itemData = itemData;
            slot.amount = addAmount;

            return count - addAmount;
        }

        // 다른 아이템이 들어 있으면 추가 불가
        if (slot.itemData.TID != itemData.TID)
            return count;

        // 같은 아이템이면 스택 가능한 만큼만 추가
        int canAdd = maxStack - slot.amount;

        if (canAdd <= 0)
            return count;

        int realAdd = Mathf.Min(count, canAdd);
        slot.amount += realAdd;

        return count - realAdd;
    }

    /// <summary>
    /// 랜덤 루트 후보 목록에서 아이템을 뽑아 상자 슬롯에 채웁니다.
    /// 현재 구조는 고정 슬롯 방식이므로 기존 슬롯을 모두 비운 뒤 다시 채웁니다.
    /// </summary>
    private void GenerateRandomItems()
    {
        EnsureSlotCapacity();

        int createMin = Mathf.Max(1, minCreateCount);
        int createMax = Mathf.Max(createMin, maxCreateCount);
        int createCount = Random.Range(createMin, createMax + 1);

        // 고정 슬롯 구조이므로 먼저 모든 슬롯을 비웁니다.
        ClearAllSlots();

        if (useCategoryLoot)
        {
            GenerateCategoryRandomItems(createCount);
            return;
        }

        // 유효한 후보만 따로 풀에 담습니다.
        List<BoxLootOption> pool = new List<BoxLootOption>();

        for (int i = 0; i < lootOptions.Count; i++)
        {
            if (lootOptions[i] == null || lootOptions[i].itemData == null)
                continue;

            pool.Add(lootOptions[i]);
        }

        if (pool.Count == 0)
            return;

        // 중복 불가일 때는 후보 수보다 많이 만들 수 없습니다.
        if (!allowDuplicateLoot)
            createCount = Mathf.Min(createCount, pool.Count);

        for (int i = 0; i < createCount; i++)
        {
            if (pool.Count == 0)
                break;

            BoxLootOption selectedOption = PickRandomOption(pool);

            if (selectedOption == null || selectedOption.itemData == null)
                continue;

            int minAmount = Mathf.Max(1, selectedOption.minAmount);
            int maxAmount = Mathf.Max(minAmount, selectedOption.maxAmount);
            int amount = Random.Range(minAmount, maxAmount + 1);

            // 고정 슬롯 방식에 맞게 슬롯에만 추가합니다.
            TryAddItem(selectedOption.itemData, amount);

            // 중복 생성이 꺼져 있으면 같은 후보를 풀에서 제거합니다.
            if (!allowDuplicateLoot)
                pool.Remove(selectedOption);
        }
    }

    /// <summary>
    /// 카테고리 확률표를 기준으로 아이템 종류를 먼저 뽑고, 해당 카테고리의 TID를 다시 뽑아 슬롯에 채웁니다.
    /// </summary>
    private void GenerateCategoryRandomItems(int createCount)
    {
        if (itemRepo == null)
            itemRepo = new LocalJsonItemRepository();

        List<int> createdTids = new List<int>();
        int createdCount = 0;
        int attemptCount = 0;
        int maxAttemptCount = Mathf.Max(1, createCount * 10);

        while (createdCount < createCount && attemptCount < maxAttemptCount)
        {
            attemptCount++;

            BoxLootCategoryOption selectedCategory = PickRandomCategoryOption();

            if (selectedCategory == null)
                return;

            int selectedTid = PickTidByCategory(selectedCategory);

            if (selectedTid == 0)
                continue;

            if (!allowDuplicateLoot && createdTids.Contains(selectedTid))
                continue;

            ItemData selectedItem = itemRepo.GetItemDataByID(selectedTid);

            if (selectedItem == null)
                continue;

            int minAmount = Mathf.Max(1, selectedCategory.minAmount);
            int maxAmount = Mathf.Max(minAmount, selectedCategory.maxAmount);
            int amount = Random.Range(minAmount, maxAmount + 1);

            TryAddItem(selectedItem, amount);
            createdTids.Add(selectedTid);
            createdCount++;
        }
    }

    /// <summary>
    /// consume/memory/artifact 같은 카테고리 후보를 weight 값 기준으로 선택합니다.
    /// </summary>
    private BoxLootCategoryOption PickRandomCategoryOption()
    {
        if (categoryLootOptions == null || categoryLootOptions.Count == 0)
            return null;

        int totalWeight = 0;

        for (int i = 0; i < categoryLootOptions.Count; i++)
        {
            if (categoryLootOptions[i] == null)
                continue;

            totalWeight += Mathf.Max(0, categoryLootOptions[i].weight);
        }

        if (totalWeight <= 0)
            return null;

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < categoryLootOptions.Count; i++)
        {
            if (categoryLootOptions[i] == null)
                continue;

            currentWeight += Mathf.Max(0, categoryLootOptions[i].weight);

            if (randomValue < currentWeight)
                return categoryLootOptions[i];
        }

        return null;
    }

    /// <summary>
    /// 선택된 카테고리 후보에서 실제 아이템 TID를 뽑습니다.
    /// 아티팩트는 등급 확률표를 한 번 더 거쳐 TID를 결정합니다.
    /// </summary>
    private int PickTidByCategory(BoxLootCategoryOption categoryOption)
    {
        if (categoryOption == null)
            return 0;

        if (categoryOption.category == itemCategory.artifact)
            return PickArtifactTidByGrade();

        return PickRandomTid(categoryOption.itemTids);
    }

    /// <summary>
    /// TID 후보 목록에서 같은 확률로 하나를 선택합니다.
    /// </summary>
    private int PickRandomTid(List<int> tids)
    {
        if (tids == null || tids.Count == 0)
            return 0;

        int index = Random.Range(0, tids.Count);
        return tids[index];
    }

    /// <summary>
    /// 아티팩트가 선택된 경우 등급별 weight를 기준으로 실제 아티팩트 TID를 선택합니다.
    /// </summary>
    private int PickArtifactTidByGrade()
    {
        if (artifactLootOptions == null || artifactLootOptions.Count == 0)
            return 0;

        int totalWeight = 0;

        for (int i = 0; i < artifactLootOptions.Count; i++)
        {
            if (artifactLootOptions[i] == null)
                continue;

            totalWeight += Mathf.Max(0, artifactLootOptions[i].weight);
        }

        if (totalWeight <= 0)
            return 0;

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < artifactLootOptions.Count; i++)
        {
            if (artifactLootOptions[i] == null)
                continue;

            currentWeight += Mathf.Max(0, artifactLootOptions[i].weight);

            if (randomValue < currentWeight)
                return artifactLootOptions[i].itemTid;
        }

        return 0;
    }

    /// <summary>
    /// 후보 목록에서 weight 값을 기준으로 랜덤 아이템 하나를 선택합니다.
    /// weight가 클수록 선택될 확률이 높습니다.
    /// </summary>
    private BoxLootOption PickRandomOption(List<BoxLootOption> options)
    {
        int totalWeight = 0;

        for (int i = 0; i < options.Count; i++)
        {
            totalWeight += Mathf.Max(1, options[i].weight);
        }

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        for (int i = 0; i < options.Count; i++)
        {
            currentWeight += Mathf.Max(1, options[i].weight);

            if (randomValue < currentWeight)
                return options[i];
        }

        // 예외 상황이더라도 마지막 후보를 반환해 null을 피합니다.
        return options[options.Count - 1];
    }

    /// <summary>
    /// 내부 슬롯 리스트를 slotCapacity 크기에 맞게 보정합니다.
    /// 부족하면 빈 슬롯을 추가하고, 넘치면 뒤에서부터 제거합니다.
    /// </summary>
    private void EnsureSlotCapacity()
    {
        if (slotCapacity < 1)
            slotCapacity = 1;

        if (items == null)
            items = new List<BoxItemEntry>();

        while (items.Count < slotCapacity)
        {
            items.Add(CreateEmptyEntry());
        }

        while (items.Count > slotCapacity)
        {
            items.RemoveAt(items.Count - 1);
        }

        for (int i = 0; i < items.Count; i++)
        {
            if (items[i] == null)
                items[i] = CreateEmptyEntry();
        }
    }

    /// <summary>
    /// 모든 슬롯을 빈 상태로 초기화합니다.
    /// 슬롯 개수 자체는 유지합니다.
    /// </summary>
    private void ClearAllSlots()
    {
        for (int i = 0; i < items.Count; i++)
        {
            ClearSlot(i);
        }
    }

    /// <summary>
    /// 비어 있는 슬롯 데이터를 하나 생성합니다.
    /// </summary>
    private BoxItemEntry CreateEmptyEntry()
    {
        return new BoxItemEntry
        {
            itemData = null,
            amount = 0
        };
    }
}
```

---

## 19. PlayerArtifactEquipment.cs

### 19-1. 이전 스크립트 전체

```cs
﻿using System;
using UnityEngine;

/// <summary>
/// 플레이어의 아티팩트 장착 상태를 관리합니다.
/// 인벤토리 데이터와 분리하여 장착 슬롯 3칸의 현재 아티팩트만 보관합니다.
/// </summary>
public class PlayerArtifactEquipment : MonoBehaviour
{
    [SerializeField] private int artifactSlotCount = 3; // 플레이어가 사용할 아티팩트 장착 슬롯 수

    public ArtifactItemData[] equippedArtifacts;       // 현재 장착 중인 아티팩트 목록

    public event Action<int, ArtifactItemData> OnArtifactSlotChanged; // 장착 슬롯 변경 알림

    private void Awake()
    {
        artifactSlotCount = Mathf.Max(1, artifactSlotCount);
        equippedArtifacts = new ArtifactItemData[artifactSlotCount];
    }

    public int SlotCount => equippedArtifacts != null ? equippedArtifacts.Length : artifactSlotCount;

    /// <summary>
    /// 지정한 장착 슬롯에 들어 있는 아티팩트 데이터를 반환합니다.
    /// </summary>
    public ArtifactItemData GetEquippedArtifact(int slotIndex)
    {
        if (!IsValidSlotIndex(slotIndex))
            return null;

        return equippedArtifacts[slotIndex];
    }

    /// <summary>
    /// 세이브 데이터에 저장된 아티팩트 장착 슬롯을 현재 런타임 장착 상태로 복원합니다.
    /// 아이템 원본 데이터는 JSON 아이템 저장소에서 TID 기준으로 다시 찾습니다.
    /// </summary>
    public void RestoreFromSave(PlayerSaveData saveData, IItemDataRepository itemRepository)
    {
        if (equippedArtifacts == null)
            equippedArtifacts = new ArtifactItemData[Mathf.Max(1, artifactSlotCount)];

        for (int i = 0; i < equippedArtifacts.Length; i++)
        {
            equippedArtifacts[i] = null;
            OnArtifactSlotChanged?.Invoke(i, null);
        }

        if (saveData == null || saveData.artifactSlots == null || itemRepository == null)
            return;

        foreach (SaveSlotData slotData in saveData.artifactSlots)
        {
            if (slotData == null || !IsValidSlotIndex(slotData.index) || slotData.TID == 0)
                continue;

            ArtifactItemData artifact = itemRepository.GetItemDataByID(slotData.TID) as ArtifactItemData;
            if (artifact == null)
                continue;

            equippedArtifacts[slotData.index] = artifact;
            OnArtifactSlotChanged?.Invoke(slotData.index, artifact);
        }
    }

    /// <summary>
    /// 현재 장착 중인 아티팩트를 세이브 데이터의 artifactSlots에 기록합니다.
    /// 인벤토리 슬롯에서 빠진 아티팩트가 탈출 정산 중 사라지지 않게 하기 위한 저장 동기화입니다.
    /// </summary>
    public void WriteToSave(PlayerSaveData saveData)
    {
        if (saveData == null)
            return;

        if (saveData.artifactSlots == null)
            saveData.artifactSlots = new System.Collections.Generic.List<SaveSlotData>();

        saveData.artifactSlots.Clear();

        if (equippedArtifacts == null)
            return;

        for (int i = 0; i < equippedArtifacts.Length; i++)
        {
            ArtifactItemData artifact = equippedArtifacts[i];
            if (artifact == null)
                continue;

            saveData.artifactSlots.Add(new SaveSlotData
            {
                index = i,
                TID = artifact.TID,
                amount = 1
            });
        }
    }

    /// <summary>
    /// 지정한 슬롯에 새 아티팩트를 장착하고, 기존 장착 아티팩트가 있으면 previousArtifact로 돌려줍니다.
    /// 실제 인벤토리 이동은 InventoryPresenter가 담당합니다.
    /// </summary>
    public bool EquipArtifact(int slotIndex, ArtifactItemData newArtifact, out ArtifactItemData previousArtifact)
    {
        previousArtifact = null;

        if (!IsValidSlotIndex(slotIndex) || newArtifact == null)
            return false;

        previousArtifact = equippedArtifacts[slotIndex];
        equippedArtifacts[slotIndex] = newArtifact;

        OnArtifactSlotChanged?.Invoke(slotIndex, newArtifact);
        return true;
    }

    /// <summary>
    /// 지정한 슬롯의 아티팩트를 해제하고, 해제된 데이터를 removedArtifact로 반환합니다.
    /// </summary>
    public bool UnequipArtifact(int slotIndex, out ArtifactItemData removedArtifact)
    {
        removedArtifact = null;

        if (!IsValidSlotIndex(slotIndex))
            return false;

        removedArtifact = equippedArtifacts[slotIndex];

        if (removedArtifact == null)
            return false;

        equippedArtifacts[slotIndex] = null;
        OnArtifactSlotChanged?.Invoke(slotIndex, null);
        return true;
    }

    /// <summary>
    /// 외부에서 잘못된 슬롯 번호로 접근하는 것을 막기 위한 공통 유효성 검사입니다.
    /// </summary>
    private bool IsValidSlotIndex(int slotIndex)
    {
        return equippedArtifacts != null && slotIndex >= 0 && slotIndex < equippedArtifacts.Length;
    }
}
```

### 19-2. 변경 설명

아티팩트 장착과 해제가 실제로 확정된 지점에 장착 계열 VFX를 연결했다. 슬롯 데이터 변경 이벤트와 저장 구조는 유지한다.

### 19-3. 현재 스크립트 전체

```cs
﻿using System;
using UnityEngine;

/// <summary>
/// 플레이어의 아티팩트 장착 상태를 관리합니다.
/// 인벤토리 데이터와 분리하여 장착 슬롯 3칸의 현재 아티팩트만 보관합니다.
/// </summary>
public class PlayerArtifactEquipment : MonoBehaviour
{
    [SerializeField] private int artifactSlotCount = 3; // 플레이어가 사용할 아티팩트 장착 슬롯 수

    public ArtifactItemData[] equippedArtifacts;       // 현재 장착 중인 아티팩트 목록

    public event Action<int, ArtifactItemData> OnArtifactSlotChanged; // 장착 슬롯 변경 알림

    private void Awake()
    {
        artifactSlotCount = Mathf.Max(1, artifactSlotCount);
        equippedArtifacts = new ArtifactItemData[artifactSlotCount];
    }

    public int SlotCount => equippedArtifacts != null ? equippedArtifacts.Length : artifactSlotCount;

    /// <summary>
    /// 지정한 장착 슬롯에 들어 있는 아티팩트 데이터를 반환합니다.
    /// </summary>
    public ArtifactItemData GetEquippedArtifact(int slotIndex)
    {
        if (!IsValidSlotIndex(slotIndex))
            return null;

        return equippedArtifacts[slotIndex];
    }

    /// <summary>
    /// 세이브 데이터에 저장된 아티팩트 장착 슬롯을 현재 런타임 장착 상태로 복원합니다.
    /// 아이템 원본 데이터는 JSON 아이템 저장소에서 TID 기준으로 다시 찾습니다.
    /// </summary>
    public void RestoreFromSave(PlayerSaveData saveData, IItemDataRepository itemRepository)
    {
        if (equippedArtifacts == null)
            equippedArtifacts = new ArtifactItemData[Mathf.Max(1, artifactSlotCount)];

        for (int i = 0; i < equippedArtifacts.Length; i++)
        {
            equippedArtifacts[i] = null;
            OnArtifactSlotChanged?.Invoke(i, null);
        }

        if (saveData == null || saveData.artifactSlots == null || itemRepository == null)
            return;

        foreach (SaveSlotData slotData in saveData.artifactSlots)
        {
            if (slotData == null || !IsValidSlotIndex(slotData.index) || slotData.TID == 0)
                continue;

            ArtifactItemData artifact = itemRepository.GetItemDataByID(slotData.TID) as ArtifactItemData;
            if (artifact == null)
                continue;

            equippedArtifacts[slotData.index] = artifact;
            OnArtifactSlotChanged?.Invoke(slotData.index, artifact);
        }
    }

    /// <summary>
    /// 현재 장착 중인 아티팩트를 세이브 데이터의 artifactSlots에 기록합니다.
    /// 인벤토리 슬롯에서 빠진 아티팩트가 탈출 정산 중 사라지지 않게 하기 위한 저장 동기화입니다.
    /// </summary>
    public void WriteToSave(PlayerSaveData saveData)
    {
        if (saveData == null)
            return;

        if (saveData.artifactSlots == null)
            saveData.artifactSlots = new System.Collections.Generic.List<SaveSlotData>();

        saveData.artifactSlots.Clear();

        if (equippedArtifacts == null)
            return;

        for (int i = 0; i < equippedArtifacts.Length; i++)
        {
            ArtifactItemData artifact = equippedArtifacts[i];
            if (artifact == null)
                continue;

            saveData.artifactSlots.Add(new SaveSlotData
            {
                index = i,
                TID = artifact.TID,
                amount = 1
            });
        }
    }

    /// <summary>
    /// 지정한 슬롯에 새 아티팩트를 장착하고, 기존 장착 아티팩트가 있으면 previousArtifact로 돌려줍니다.
    /// 실제 인벤토리 이동은 InventoryPresenter가 담당합니다.
    /// </summary>
    public bool EquipArtifact(int slotIndex, ArtifactItemData newArtifact, out ArtifactItemData previousArtifact)
    {
        previousArtifact = null;

        if (!IsValidSlotIndex(slotIndex) || newArtifact == null)
            return false;

        previousArtifact = equippedArtifacts[slotIndex];
        equippedArtifacts[slotIndex] = newArtifact;

        OnArtifactSlotChanged?.Invoke(slotIndex, newArtifact);
        VFXService.Instance?.Play(GameplayVFXIds.ArtifactEquip, transform.position, transform.rotation);
        return true;
    }

    /// <summary>
    /// 지정한 슬롯의 아티팩트를 해제하고, 해제된 데이터를 removedArtifact로 반환합니다.
    /// </summary>
    public bool UnequipArtifact(int slotIndex, out ArtifactItemData removedArtifact)
    {
        removedArtifact = null;

        if (!IsValidSlotIndex(slotIndex))
            return false;

        removedArtifact = equippedArtifacts[slotIndex];

        if (removedArtifact == null)
            return false;

        equippedArtifacts[slotIndex] = null;
        OnArtifactSlotChanged?.Invoke(slotIndex, null);
        VFXService.Instance?.Play(GameplayVFXIds.ArtifactUnequip, transform.position, transform.rotation);
        return true;
    }

    /// <summary>
    /// 외부에서 잘못된 슬롯 번호로 접근하는 것을 막기 위한 공통 유효성 검사입니다.
    /// </summary>
    private bool IsValidSlotIndex(int slotIndex)
    {
        return equippedArtifacts != null && slotIndex >= 0 && slotIndex < equippedArtifacts.Length;
    }
}
```

---

## 20. PlayerInventory.cs

### 20-1. 이전 스크립트 전체

```cs
/// <summary>
/// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스
/// </summary>
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

public class PlayerInventory : MonoBehaviour
{
    public List<InventorySlotData> slots = new();
    public List<InventorySlotData> quickSlots = new();
    public List<InventorySlotData> safeSlots = new();
    public List<InventorySlotData> anySlots = new();
    public int slotNum { get; private set; }
    public int quickSlotNum { get; private set; }
    public int safeSlotNum { get; private set; }

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private IItemDataRepository itemRepo;

    // 인벤토리 슬롯과 각성 보존 슬롯을 동시에 취급하는 경우에 AnySlots 헬퍼를 호출하여 사용
    public List<InventorySlotData> AnySlots => anySlots;

    // 특정 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSlotChanged;

    // 각성 보존 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSafeSlotChanged;

    // 아이템 드롭 시 생성 할 공통 드롭 아이템 오브젝트 프리팹
    [SerializeField] private GameObject itemPrefabRef;


    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;

        itemRepo = new LocalJsonItemRepository();
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;
    }

    /* 인벤토리 UI 초기화 */
    public void Initialize(int _slotNum, int _quickSlotNum, int _safeSlotNum)
    {
        slotNum = _slotNum;
        quickSlotNum = _quickSlotNum;
        safeSlotNum = _safeSlotNum; 
        
        // 모든 슬롯 (인벤토리, 퀵슬롯, 각성 보존 슬롯) 데이터 초기화
        for (int i = 0; i < _slotNum; i++)
        {
            slots.Add(new InventorySlotData(0, i, 0, null));
        }

        for (int j = 0; j < _safeSlotNum; j++)
        {
            safeSlots.Add(new InventorySlotData(0, j, 0, null));
        }

        RebuildAnySlots();

        for (int i = 0; i < _quickSlotNum; i++)
        {
            quickSlots.Add(new InventorySlotData(0, i, 0, null));
        }
    }

    // 인벤토리 슬롯과 각성 보존 슬롯을 병합해 anySlots 리스트 생성
    public void RebuildAnySlots()
    {
        anySlots.Clear();
        // 인벤토리 슬롯(우선순위 그대로)
        if (slots != null) anySlots.AddRange(slots);
        // 각성 보존 슬롯을 뒤에 추가
        if (safeSlots != null) anySlots.AddRange(safeSlots);
    }

    /* 인벤토리에 아이템 추가 및 남는 수량 반환 */
    public int AddItem(ItemData _itemData, int _count)
    {
        if (_itemData == null || _count <= 0) return _count;

        int remain = _count;

        // 1. 이미 인벤토리에 해당 아이템이 있는지 먼저 확인
        // (순서 관계 없이 모든 슬롯을 탐색)
        foreach (InventorySlotData slot in slots)
        {
            // 가득 차지 않은 슬롯에 각각 채움
            if (slot.TID == _itemData.TID)
            {
                // 동일 아이템이 있는 슬롯을 찾아 채움
                int beforeAmount = slot.amount;
                remain = TryAddToSlot(slot.order, _itemData, remain);

                // 획득 후 수량을 퀵슬롯에 반영
                if (beforeAmount != slot.amount)
                {
                    QuickSlotRenew(_itemData);
                }
            }
        }

        // 2. 인벤토리에 해당 아이템이 아예 없는 경우 빈 슬롯에 새롭게 추가
        // (모든 슬롯을 가득 채운 후 남은 아이템에 대해서도 동일한 처리를 실행)
        while (remain > 0)
        {
            //빈 슬롯을 찾았는지 확인
            bool foundEmptySlot = false;
            for (int i = 0; i < slotNum; i++)
            {
                // 이미 아이템이 있는 슬롯은 넘김
                if (!IsSlotEmpty(i)) continue;

                // 새 슬롯에 아이템을 추가
                int beforeAmount = slots[i].amount;
                remain = TryAddToSlot(i, _itemData, remain);
                foundEmptySlot = true;

                // 추가 후 총 보유 수량을 퀵슬롯에 반영
                if (beforeAmount != slots[i].amount)
                {
                    QuickSlotRenew(_itemData);
                }
            }

            // 빈 슬롯이 없으면 루프 탈출
            if (!foundEmptySlot) break;
        }

        // 3. 빈 슬롯을 찾을 수 없는 경우 처리 종료
        if (remain > 0)
        {
            Debug.Log("인벤토리가 가득차서 아이템을 주울 수 없습니다.");
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        return remain;
    }

    /* 특정 슬롯 하나에 아이템을 넣고 남은 수량 반환 */
    public int TryAddToSlot(int _slotIndex, ItemData _itemData, int _count)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return _count;
        if (_itemData == null || _count <= 0) return _count;

        InventorySlotData slot = anySlots[_slotIndex];
        int maxStack = Mathf.Max(1, _itemData.itemMultiple);

        // 빈 슬롯이면 새로 배치
        if (IsSlotEmpty(_slotIndex))
        {
            int addAmount = Mathf.Min(_count, maxStack);

            slot.TID = _itemData.TID;
            slot.amount = addAmount;
            slot.itemData = _itemData;

            // 아이콘 로드는 비동기로 백그라운드에서 진행 (LoadSprite 내부에서 UI 갱신을 알아서 수행)
            _ = LoadSprite(_itemData.iconAddress, _slotIndex);

            // 수량부터 먼저 반영
            OnSlotChanged?.Invoke(_slotIndex);

            return _count - addAmount;
        }

        // 다른 아이템이 들어 있으면 추가 불가
        if (slot.TID != _itemData.TID) return _count;

        // 같은 아이템인데 원본 데이터가 비어 있으면 다시 연결
        if (slot.itemData == null)
            slot.itemData = _itemData;

        int canAdd = maxStack - slot.amount;
        if (canAdd <= 0) return _count;

        int realAdd = Mathf.Min(_count, canAdd);
        slot.amount += realAdd;

        OnSlotChanged?.Invoke(_slotIndex);

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        // 남은 수량 반환
        return _count - realAdd;
    }

    /* 특정 슬롯 데이터 반환 */
    public InventorySlotData GetSlot(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
        return anySlots[_slotIndex];
    }

    /* 특정 슬롯의 원본 ItemData 반환 */
    public ItemData GetSlotItemData(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
        return anySlots[_slotIndex].itemData;
    }

    /* 특정 슬롯이 비어 있는지 확인 */
    public bool IsSlotEmpty(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return true;
        return anySlots[_slotIndex].TID == 0 || anySlots[_slotIndex].amount <= 0;
    }

    /* 특정 슬롯 수량 차감 */
    public void RemoveAmount(int _slotIndex, int _count)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;
        if (IsSlotEmpty(_slotIndex)) return;

        int tid = anySlots[_slotIndex].TID;
        anySlots[_slotIndex].amount -= _count;

        if (anySlots[_slotIndex].amount <= 0)
        {
            ClearSlot(_slotIndex);
            return;
        }

        OnSlotChanged?.Invoke(_slotIndex);
        SyncQuickSlotsByTID(tid);

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();
    }

    /* 특정 슬롯 완전 초기화 */
    public void ClearSlot(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;

        int tid = anySlots[_slotIndex].TID;
        anySlots[_slotIndex].TID = 0;
        anySlots[_slotIndex].amount = 0;
        anySlots[_slotIndex].icon = null;
        anySlots[_slotIndex].itemData = null;

        OnSlotChanged?.Invoke(_slotIndex);

        if (tid != 0)
        {
            SyncQuickSlotsByTID(tid);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();
    }

    /* 특정 슬롯 아이템을 월드에 드롭하고, 성공 시 후처리 콜백을 실행 */
    public void TryDropSlotToWorld(int _slotIndex, Vector3 dropPosition, Action onDropped = null)
    {
        InventorySlotData slot = GetSlot(_slotIndex);
        if (slot == null || IsSlotEmpty(_slotIndex))
            return;

        ItemData itemData = GetSlotItemData(_slotIndex);
        if (itemData == null)
            return;

        int dropCount = slot.amount;

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        GameObject dropObject = Instantiate(itemPrefabRef, dropPosition, Quaternion.identity);
        DropItem dropItem = dropObject.GetComponent<DropItem>();

        if (dropItem == null)
        {
            Debug.LogError($"생성된 프리팹에 DropItem 컴포넌트가 없습니다: {dropObject.name}");
            Destroy(dropObject);
            return;
        }

        dropItem.Initialize(itemData, dropCount);

        RemoveAmount(_slotIndex, dropCount);
        onDropped?.Invoke();
    }

    /* 획득한 아이템을 퀵슬롯에서 찾아 개수 변동 반영 */
    private void QuickSlotRenew(ItemData _itemData)
    {
        if (_itemData == null) return;
        SyncQuickSlotsByTID(_itemData.TID);
    }

    /* 특정 아이템 TID를 등록한 모든 퀵슬롯의 수량과 UI를 다시 동기화 */
    private void SyncQuickSlotsByTID(int tid)
    {
        if (tid == 0) return;

        int totalCount = GetInventoryItemCount(tid);

        for (int i = 0; i < quickSlotNum; i++)
        {
            InventorySlotData quickSlot = quickSlots[i];
            if (quickSlot.TID != tid) continue;

            quickSlot.amount = totalCount;

            // 등록은 유지하되 아이콘이 아직 없으면 다시 로드를 시도합니다.
            if (quickSlot.icon == null && quickSlot.itemData != null)
            {
                _ = LoadQuickSlotSprite(quickSlot.itemData.iconAddress, i);
                continue;
            }

            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, quickSlot.icon, quickSlot.amount);
        }
    }

    /* 아이템의 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
    private async Task LoadSprite(string iconRef, int slotIndex)
    {
        Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
        
        if (loadIcon == null)
        {
            // anySlots 헬퍼에서 먼저 기록 후 원본 슬롯에 각각 전달
            if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = null;

            if (slotIndex < slots.Count)
            {
                slots[slotIndex].icon = null;
                OnSlotChanged?.Invoke(slotIndex);
            }
            else
            {
                int safeIndex = slotIndex - slots.Count;
                if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = null;
                OnSafeSlotChanged?.Invoke(safeIndex);
            }
            return;
        }

        // 아이콘이 준비된 시점에 UI를 anySlots 헬퍼에서 갱신
        if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = loadIcon;

        // 로드된 아이콘을 각 슬롯 데이터에 반영
        if (slotIndex < slots.Count)
        {
            slots[slotIndex].icon = loadIcon;
            OnSlotChanged?.Invoke(slotIndex);
        }
        else
        {
            int safeIndex = slotIndex - slots.Count;
            if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = loadIcon;
            OnSafeSlotChanged?.Invoke(safeIndex);
        }
    }

    public void UseItem(int slotIndex)
    {
        // 유효성 검사 (빈 슬롯이 아닌지)
        if (IsSlotEmpty(slotIndex)) return;

        // 갯수 차감
        RemoveAmount(slotIndex, 1);
    }

    /* 인벤토리 슬롯 데이터를 교환 */
    public void SwapSlotData(int _index1, int _index2)
    {
        /// ※추가: 해당 아이템이 동일한 아이템이라면 존재한다면 합산 가능한지 판정 후 합산 ///

        InventorySlotData slot1 = anySlots[_index1];
        InventorySlotData slot2 = anySlots[_index2];

        // 두 데이터 교환
        (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
        (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
        (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
        (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

        // 변동사항 알림
        if (_index1 < slots.Count)
        {
            OnSlotChanged?.Invoke(_index1);
        }
        else
        {
            OnSafeSlotChanged?.Invoke(_index1 - slots.Count);
        }

        if (_index2 < slots.Count)
        {
            OnSlotChanged?.Invoke(_index2);
        }
        else
        {
            OnSafeSlotChanged?.Invoke(_index2 - slots.Count);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();
    }

    /* 퀵슬롯에 아이템 추가 */
    public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
    {
        // 퀵슬롯/인벤토리 인덱스 유효성 검사
        if (_quickIndex < 0 || _quickIndex >= quickSlotNum) return;
        if (_slotIndex < 0 || _slotIndex >= slotNum) return;

        InventorySlotData slot = slots[_slotIndex];

        // 소모품이 아닐 경우에는 퀵슬롯에 등록하지 않음
        if (slot.TID <= 300 || slot.TID >= 400) return;

        // 이미 다른 퀵슬롯에 있다면 기존 슬롯을 비움
        for (int i = 0; i < quickSlotNum; i++)
        {
            if (i == _quickIndex) continue;
            if (quickSlots[i].TID != slot.TID) continue;

            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }

        InventorySlotData qSlot = quickSlots[_quickIndex];
        qSlot.TID = slot.TID;
        qSlot.amount = GetInventoryItemCount(slot.TID);
        qSlot.icon = slot.icon;
        qSlot.itemData = slot.itemData;

        // 변동사항 알림
        OnSlotChanged?.Invoke(_slotIndex);

        if (qSlot.icon != null)
        {
            GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
        }
        else if (qSlot.itemData != null)
        {
            _ = LoadQuickSlotSprite(qSlot.itemData.iconAddress, _quickIndex);
        }
        else
        {
            GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, null, qSlot.amount);
        }
    }

    /* 퀵슬롯 아이템 사용 */
    public bool UseQuickSlotItem(int _index)
    {
        // 퀵슬롯 범위 및 데이터 유효성 검사
        if (_index < 0 || _index >= quickSlotNum) return false;

        InventorySlotData slot = quickSlots[_index];
        if (slot == null || slot.TID == 0 || slot.amount <= 0) return false;

        // 등록된 슬롯 정보는 유지하고, 실제 인벤토리 수량만 차감합니다.
        return ConsumeInventoryItemByTID(slot.TID);
    }

    /* 인벤토리에서 특정 TID 아이템의 총 수량 계산 */
    private int GetInventoryItemCount(int tid)
    {
        int count = 0;

        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID == tid)
            {
                count += slots[i].amount;
            }
        }

        return count;
    }

    /* 인벤토리에서 특정 TID 아이템 1개를 차감 */
    private bool ConsumeInventoryItemByTID(int tid)
    {
        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID != tid || slots[i].amount <= 0)
            {
                continue;
            }

            slots[i].amount--;

            if (slots[i].amount <= 0)
            {
                ClearSlot(i);
                return true;
            }

            // 수량 변화가 생긴 인벤토리 슬롯 UI를 갱신
            OnSlotChanged?.Invoke(i);
            SyncQuickSlotsByTID(tid);
            return true;
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        // 인벤토리에는 없지만 퀵슬롯에는 등록된 상태일 수 있으므로 한 번 더 정리합니다.
        SyncQuickSlotsByTID(tid);
        return false;
    }

    /* 퀵슬롯간에 아이템 교환 */
    private void SwapItemQuickSlot(int _index1, int _index2)
    {
        InventorySlotData slot1 = quickSlots[_index1];
        InventorySlotData slot2 = quickSlots[_index2];

        // 두 데이터 교환
        (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
        (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
        (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
        (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

        // 변동사항 알림
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
    }

    /* 저장된 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 런타임 슬롯에 복원 */
    public void RestoreFromSave(PlayerSaveData saveData)
    {
        if (saveData == null) return;

        // 현재 런타임 슬롯 데이터를 모두 초기화
        ClearRuntimeSlots();

        // 저장된 인벤토리 슬롯 데이터를 순서대로 복원
        foreach (var savedSlot in saveData.inventorySlots)
        {
            if (savedSlot.index < 0 || savedSlot.index >= slotNum) continue;

            slots[savedSlot.index].TID = savedSlot.TID;
            slots[savedSlot.index].amount = savedSlot.amount;

            ItemData itemData = GetItemDataByTID(savedSlot.TID);
            slots[savedSlot.index].itemData = itemData;

            if (itemData != null)
            {
                _ = LoadSprite(itemData.iconAddress, savedSlot.index);
            }

            OnSlotChanged?.Invoke(savedSlot.index);
        }

        // 저장된 각성 보존 슬롯 데이터를 순서대로 복원
        foreach (var savedSlot in saveData.safeSlots)
        {
            if (savedSlot.index < 0 || savedSlot.index >= safeSlotNum) continue;

            safeSlots[savedSlot.index].TID = savedSlot.TID;
            safeSlots[savedSlot.index].amount = savedSlot.amount;

            ItemData itemData = GetItemDataByTID(savedSlot.TID);
            safeSlots[savedSlot.index].itemData = itemData;

            if (itemData != null) _ = LoadSprite(itemData.iconAddress, savedSlot.index + slots.Count);

            OnSafeSlotChanged?.Invoke(savedSlot.index);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        // 저장된 퀵슬롯 TID를 기준으로 퀵슬롯 데이터를 복원
        for (int i = 0; i < quickSlotNum; i++)
        {
            int tid = i < saveData.quickSlots.Count ? saveData.quickSlots[i] : 0;

            if (tid == 0)
            {
                quickSlots[i].TID = 0;
                quickSlots[i].amount = 0;
                quickSlots[i].icon = null;
                quickSlots[i].itemData = null;
                GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
                continue;
            }

            quickSlots[i].TID = tid;
            quickSlots[i].amount = GetSavedItemCount(saveData, tid);

            ItemData itemData = GetItemDataByTID(tid);
            quickSlots[i].itemData = itemData;

            if (itemData != null)
            {
                _ = LoadQuickSlotSprite(itemData.iconAddress, i);
            }
        }
    }

    /* TID를 통해 저장소에서 아이템 데이터 찾기 */
    public ItemData GetItemDataByTID(int tid)
    {
        if (tid == 0) return null;

        return itemRepo.GetItemDataByID(tid);
    }

    /* 퀵슬롯 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
    private async Task LoadQuickSlotSprite(string iconRef, int quickIndex)
    {
        Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
        
        if (loadIcon == null)
        {
            quickSlots[quickIndex].icon = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, null, quickSlots[quickIndex].amount);
            return;
        }

        quickSlots[quickIndex].icon = loadIcon;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, loadIcon, quickSlots[quickIndex].amount);
    }

    /* 런타임 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 모두 초기화 */
    private void ClearRuntimeSlots()
    {
        for (int i = 0; i < slotNum; i++)
        {
            slots[i].TID = 0;
            slots[i].amount = 0;
            slots[i].icon = null;
            slots[i].itemData = null;
            OnSlotChanged?.Invoke(i);
        }

        for (int j = 0; j < safeSlotNum; j++)
        {
            safeSlots[j].TID = 0;
            safeSlots[j].amount = 0;
            safeSlots[j].icon = null;
            safeSlots[j].itemData = null;
            OnSafeSlotChanged?.Invoke(j);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        for (int i = 0; i < quickSlotNum; i++)
        {
            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }
    }

    /* 저장 데이터 기준 특정 TID 아이템 총 수량 계산 */
    private int GetSavedItemCount(PlayerSaveData saveData, int tid)
    {
        int count = 0;
        foreach (var slot in saveData.inventorySlots)
        {
            if (slot.TID == tid) count += slot.amount;
        }
        return count;
    }
}
```

### 20-2. 변경 설명

아이템 추가·이동·드롭 결과가 확정되는 인벤토리 경계에 VFX 호출을 연결했다. 수량 계산과 슬롯 정합성 로직은 변경하지 않는다.

### 20-3. 현재 스크립트 전체

```cs
/// <summary>
/// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스
/// </summary>
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

public class PlayerInventory : MonoBehaviour
{
    public List<InventorySlotData> slots = new();
    public List<InventorySlotData> quickSlots = new();
    public List<InventorySlotData> safeSlots = new();
    public List<InventorySlotData> anySlots = new();
    public int slotNum { get; private set; }
    public int quickSlotNum { get; private set; }
    public int safeSlotNum { get; private set; }

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private IItemDataRepository itemRepo;

    // 인벤토리 슬롯과 각성 보존 슬롯을 동시에 취급하는 경우에 AnySlots 헬퍼를 호출하여 사용
    public List<InventorySlotData> AnySlots => anySlots;

    // 특정 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSlotChanged;

    // 각성 보존 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSafeSlotChanged;

    // 아이템 드롭 시 생성 할 공통 드롭 아이템 오브젝트 프리팹
    [SerializeField] private GameObject itemPrefabRef;


    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;

        itemRepo = new LocalJsonItemRepository();
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;
    }

    /* 인벤토리 UI 초기화 */
    public void Initialize(int _slotNum, int _quickSlotNum, int _safeSlotNum)
    {
        slotNum = _slotNum;
        quickSlotNum = _quickSlotNum;
        safeSlotNum = _safeSlotNum; 
        
        // 모든 슬롯 (인벤토리, 퀵슬롯, 각성 보존 슬롯) 데이터 초기화
        for (int i = 0; i < _slotNum; i++)
        {
            slots.Add(new InventorySlotData(0, i, 0, null));
        }

        for (int j = 0; j < _safeSlotNum; j++)
        {
            safeSlots.Add(new InventorySlotData(0, j, 0, null));
        }

        RebuildAnySlots();

        for (int i = 0; i < _quickSlotNum; i++)
        {
            quickSlots.Add(new InventorySlotData(0, i, 0, null));
        }
    }

    // 인벤토리 슬롯과 각성 보존 슬롯을 병합해 anySlots 리스트 생성
    public void RebuildAnySlots()
    {
        anySlots.Clear();
        // 인벤토리 슬롯(우선순위 그대로)
        if (slots != null) anySlots.AddRange(slots);
        // 각성 보존 슬롯을 뒤에 추가
        if (safeSlots != null) anySlots.AddRange(safeSlots);
    }

    /* 인벤토리에 아이템 추가 및 남는 수량 반환 */
    public int AddItem(ItemData _itemData, int _count)
    {
        if (_itemData == null || _count <= 0) return _count;

        int remain = _count;

        // 1. 이미 인벤토리에 해당 아이템이 있는지 먼저 확인
        // (순서 관계 없이 모든 슬롯을 탐색)
        foreach (InventorySlotData slot in slots)
        {
            // 가득 차지 않은 슬롯에 각각 채움
            if (slot.TID == _itemData.TID)
            {
                // 동일 아이템이 있는 슬롯을 찾아 채움
                int beforeAmount = slot.amount;
                remain = TryAddToSlot(slot.order, _itemData, remain);

                // 획득 후 수량을 퀵슬롯에 반영
                if (beforeAmount != slot.amount)
                {
                    QuickSlotRenew(_itemData);
                }
            }
        }

        // 2. 인벤토리에 해당 아이템이 아예 없는 경우 빈 슬롯에 새롭게 추가
        // (모든 슬롯을 가득 채운 후 남은 아이템에 대해서도 동일한 처리를 실행)
        while (remain > 0)
        {
            //빈 슬롯을 찾았는지 확인
            bool foundEmptySlot = false;
            for (int i = 0; i < slotNum; i++)
            {
                // 이미 아이템이 있는 슬롯은 넘김
                if (!IsSlotEmpty(i)) continue;

                // 새 슬롯에 아이템을 추가
                int beforeAmount = slots[i].amount;
                remain = TryAddToSlot(i, _itemData, remain);
                foundEmptySlot = true;

                

                // 추가 후 총 보유 수량을 퀵슬롯에 반영
                if (beforeAmount != slots[i].amount)
                {
                    QuickSlotRenew(_itemData);
                }
            }

            // 빈 슬롯이 없으면 루프 탈출
            if (!foundEmptySlot) break;
        }

        // 3. 빈 슬롯을 찾을 수 없는 경우 처리 종료
        if (remain > 0)
        {
            Debug.Log("인벤토리가 가득차서 아이템을 주울 수 없습니다.");
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        return remain;
    }

    /* 특정 슬롯 하나에 아이템을 넣고 남은 수량 반환 */
    public int TryAddToSlot(int _slotIndex, ItemData _itemData, int _count)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return _count;
        if (_itemData == null || _count <= 0) return _count;

        InventorySlotData slot = anySlots[_slotIndex];
        int maxStack = Mathf.Max(1, _itemData.itemMultiple);

        // 빈 슬롯이면 새로 배치
        if (IsSlotEmpty(_slotIndex))
        {
            int addAmount = Mathf.Min(_count, maxStack);

            slot.TID = _itemData.TID;
            slot.amount = addAmount;
            slot.itemData = _itemData;

            // 아이콘 로드는 비동기로 백그라운드에서 진행 (LoadSprite 내부에서 UI 갱신을 알아서 수행)
            _ = LoadSprite(_itemData.iconAddress, _slotIndex);

            // 수량부터 먼저 반영
            OnSlotChanged?.Invoke(_slotIndex);

            return _count - addAmount;
        }

        // 다른 아이템이 들어 있으면 추가 불가
        if (slot.TID != _itemData.TID) return _count;

        // 같은 아이템인데 원본 데이터가 비어 있으면 다시 연결
        if (slot.itemData == null)
            slot.itemData = _itemData;

        int canAdd = maxStack - slot.amount;
        if (canAdd <= 0) return _count;

        int realAdd = Mathf.Min(_count, canAdd);
        slot.amount += realAdd;

        OnSlotChanged?.Invoke(_slotIndex);

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        // 남은 수량 반환
        return _count - realAdd;
    }

    /* 특정 슬롯 데이터 반환 */
    public InventorySlotData GetSlot(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
        return anySlots[_slotIndex];
    }

    /* 특정 슬롯의 원본 ItemData 반환 */
    public ItemData GetSlotItemData(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return null;
        return anySlots[_slotIndex].itemData;
    }

    /* 특정 슬롯이 비어 있는지 확인 */
    public bool IsSlotEmpty(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return true;
        return anySlots[_slotIndex].TID == 0 || anySlots[_slotIndex].amount <= 0;
    }

    /* 특정 슬롯 수량 차감 */
    public void RemoveAmount(int _slotIndex, int _count)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;
        if (IsSlotEmpty(_slotIndex)) return;

        int tid = anySlots[_slotIndex].TID;
        anySlots[_slotIndex].amount -= _count;

        if (anySlots[_slotIndex].amount <= 0)
        {
            ClearSlot(_slotIndex);
            return;
        }

        OnSlotChanged?.Invoke(_slotIndex);
        SyncQuickSlotsByTID(tid);

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();
    }

    /* 특정 슬롯 완전 초기화 */
    public void ClearSlot(int _slotIndex)
    {
        if (_slotIndex < 0 || _slotIndex >= anySlots.Count) return;

        int tid = anySlots[_slotIndex].TID;
        anySlots[_slotIndex].TID = 0;
        anySlots[_slotIndex].amount = 0;
        anySlots[_slotIndex].icon = null;
        anySlots[_slotIndex].itemData = null;

        OnSlotChanged?.Invoke(_slotIndex);

        if (tid != 0)
        {
            SyncQuickSlotsByTID(tid);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();
    }

    /* 특정 슬롯 아이템을 월드에 드롭하고, 성공 시 후처리 콜백을 실행 */
    public void TryDropSlotToWorld(int _slotIndex, Vector3 dropPosition, Action onDropped = null)
    {
        InventorySlotData slot = GetSlot(_slotIndex);
        if (slot == null || IsSlotEmpty(_slotIndex))
            return;

        ItemData itemData = GetSlotItemData(_slotIndex);
        if (itemData == null)
            return;

        int dropCount = slot.amount;

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        GameObject dropObject = Instantiate(itemPrefabRef, dropPosition, Quaternion.identity);
        DropItem dropItem = dropObject.GetComponent<DropItem>();

        if (dropItem == null)
        {
            Debug.LogError($"생성된 프리팹에 DropItem 컴포넌트가 없습니다: {dropObject.name}");
            Destroy(dropObject);
            return;
        }

        dropItem.Initialize(itemData, dropCount);

        VFXService.Instance?.Play(GameplayVFXIds.ItemDrop, dropPosition);

        RemoveAmount(_slotIndex, dropCount);

        onDropped?.Invoke();
    }

    /* 획득한 아이템을 퀵슬롯에서 찾아 개수 변동 반영 */
    private void QuickSlotRenew(ItemData _itemData)
    {
        if (_itemData == null) return;
        SyncQuickSlotsByTID(_itemData.TID);
    }

    /* 특정 아이템 TID를 등록한 모든 퀵슬롯의 수량과 UI를 다시 동기화 */
    private void SyncQuickSlotsByTID(int tid)
    {
        if (tid == 0) return;

        int totalCount = GetInventoryItemCount(tid);

        for (int i = 0; i < quickSlotNum; i++)
        {
            InventorySlotData quickSlot = quickSlots[i];
            if (quickSlot.TID != tid) continue;

            quickSlot.amount = totalCount;

            // 등록은 유지하되 아이콘이 아직 없으면 다시 로드를 시도합니다.
            if (quickSlot.icon == null && quickSlot.itemData != null)
            {
                _ = LoadQuickSlotSprite(quickSlot.itemData.iconAddress, i);
                continue;
            }

            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, quickSlot.icon, quickSlot.amount);
        }
    }

    /* 아이템의 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
    private async Task LoadSprite(string iconRef, int slotIndex)
    {
        Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
        
        if (loadIcon == null)
        {
            // anySlots 헬퍼에서 먼저 기록 후 원본 슬롯에 각각 전달
            if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = null;

            if (slotIndex < slots.Count)
            {
                slots[slotIndex].icon = null;
                OnSlotChanged?.Invoke(slotIndex);
            }
            else
            {
                int safeIndex = slotIndex - slots.Count;
                if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = null;
                OnSafeSlotChanged?.Invoke(safeIndex);
            }
            return;
        }

        // 아이콘이 준비된 시점에 UI를 anySlots 헬퍼에서 갱신
        if (slotIndex >= 0 && slotIndex < anySlots.Count) anySlots[slotIndex].icon = loadIcon;

        // 로드된 아이콘을 각 슬롯 데이터에 반영
        if (slotIndex < slots.Count)
        {
            slots[slotIndex].icon = loadIcon;
            OnSlotChanged?.Invoke(slotIndex);
        }
        else
        {
            int safeIndex = slotIndex - slots.Count;
            if (safeIndex >= 0 && safeIndex < safeSlots.Count) safeSlots[safeIndex].icon = loadIcon;
            OnSafeSlotChanged?.Invoke(safeIndex);
        }
    }

    public void UseItem(int slotIndex)
    {
        // 유효성 검사 (빈 슬롯이 아닌지)
        if (IsSlotEmpty(slotIndex)) return;

        // 갯수 차감
        RemoveAmount(slotIndex, 1);
    }

    /* 인벤토리 슬롯 데이터를 교환 */
    public void SwapSlotData(int _index1, int _index2)
    {
        /// ※추가: 해당 아이템이 동일한 아이템이라면 존재한다면 합산 가능한지 판정 후 합산 ///

        InventorySlotData slot1 = anySlots[_index1];
        InventorySlotData slot2 = anySlots[_index2];

        // 두 데이터 교환
        (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
        (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
        (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
        (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

        // 변동사항 알림
        if (_index1 < slots.Count)
        {
            OnSlotChanged?.Invoke(_index1);
        }
        else
        {
            OnSafeSlotChanged?.Invoke(_index1 - slots.Count);
        }

        if (_index2 < slots.Count)
        {
            OnSlotChanged?.Invoke(_index2);
        }
        else
        {
            OnSafeSlotChanged?.Invoke(_index2 - slots.Count);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();
    }

    /* 퀵슬롯에 아이템 추가 */
    public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
    {
        // 퀵슬롯/인벤토리 인덱스 유효성 검사
        if (_quickIndex < 0 || _quickIndex >= quickSlotNum) return;
        if (_slotIndex < 0 || _slotIndex >= slotNum) return;

        InventorySlotData slot = slots[_slotIndex];

        // 소모품이 아닐 경우에는 퀵슬롯에 등록하지 않음
        if (slot.TID <= 300 || slot.TID >= 400) return;

        // 이미 다른 퀵슬롯에 있다면 기존 슬롯을 비움
        for (int i = 0; i < quickSlotNum; i++)
        {
            if (i == _quickIndex) continue;
            if (quickSlots[i].TID != slot.TID) continue;

            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }

        InventorySlotData qSlot = quickSlots[_quickIndex];
        qSlot.TID = slot.TID;
        qSlot.amount = GetInventoryItemCount(slot.TID);
        qSlot.icon = slot.icon;
        qSlot.itemData = slot.itemData;

        // 변동사항 알림
        OnSlotChanged?.Invoke(_slotIndex);

        if (qSlot.icon != null)
        {
            GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
        }
        else if (qSlot.itemData != null)
        {
            _ = LoadQuickSlotSprite(qSlot.itemData.iconAddress, _quickIndex);
        }
        else
        {
            GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, null, qSlot.amount);
        }
    }

    /* 퀵슬롯 아이템 사용 */
    public bool UseQuickSlotItem(int _index)
    {
        // 퀵슬롯 범위 및 데이터 유효성 검사
        if (_index < 0 || _index >= quickSlotNum) return false;

        InventorySlotData slot = quickSlots[_index];
        if (slot == null || slot.TID == 0 || slot.amount <= 0) return false;

        // 등록된 슬롯 정보는 유지하고, 실제 인벤토리 수량만 차감합니다.
        return ConsumeInventoryItemByTID(slot.TID);
    }

    /* 인벤토리에서 특정 TID 아이템의 총 수량 계산 */
    private int GetInventoryItemCount(int tid)
    {
        int count = 0;

        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID == tid)
            {
                count += slots[i].amount;
            }
        }

        return count;
    }

    /* 인벤토리에서 특정 TID 아이템 1개를 차감 */
    private bool ConsumeInventoryItemByTID(int tid)
    {
        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID != tid || slots[i].amount <= 0)
            {
                continue;
            }

            slots[i].amount--;

            if (slots[i].amount <= 0)
            {
                ClearSlot(i);
                return true;
            }

            // 수량 변화가 생긴 인벤토리 슬롯 UI를 갱신
            OnSlotChanged?.Invoke(i);
            SyncQuickSlotsByTID(tid);
            return true;
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        // 인벤토리에는 없지만 퀵슬롯에는 등록된 상태일 수 있으므로 한 번 더 정리합니다.
        SyncQuickSlotsByTID(tid);
        return false;
    }

    /* 퀵슬롯간에 아이템 교환 */
    private void SwapItemQuickSlot(int _index1, int _index2)
    {
        InventorySlotData slot1 = quickSlots[_index1];
        InventorySlotData slot2 = quickSlots[_index2];

        // 두 데이터 교환
        (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
        (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
        (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);
        (slot1.itemData, slot2.itemData) = (slot2.itemData, slot1.itemData);

        // 변동사항 알림
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
    }

    /* 저장된 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 런타임 슬롯에 복원 */
    public void RestoreFromSave(PlayerSaveData saveData)
    {
        if (saveData == null) return;

        // 현재 런타임 슬롯 데이터를 모두 초기화
        ClearRuntimeSlots();

        // 저장된 인벤토리 슬롯 데이터를 순서대로 복원
        foreach (var savedSlot in saveData.inventorySlots)
        {
            if (savedSlot.index < 0 || savedSlot.index >= slotNum) continue;

            slots[savedSlot.index].TID = savedSlot.TID;
            slots[savedSlot.index].amount = savedSlot.amount;

            ItemData itemData = GetItemDataByTID(savedSlot.TID);
            slots[savedSlot.index].itemData = itemData;

            if (itemData != null)
            {
                _ = LoadSprite(itemData.iconAddress, savedSlot.index);
            }

            OnSlotChanged?.Invoke(savedSlot.index);
        }

        // 저장된 각성 보존 슬롯 데이터를 순서대로 복원
        foreach (var savedSlot in saveData.safeSlots)
        {
            if (savedSlot.index < 0 || savedSlot.index >= safeSlotNum) continue;

            safeSlots[savedSlot.index].TID = savedSlot.TID;
            safeSlots[savedSlot.index].amount = savedSlot.amount;

            ItemData itemData = GetItemDataByTID(savedSlot.TID);
            safeSlots[savedSlot.index].itemData = itemData;

            if (itemData != null) _ = LoadSprite(itemData.iconAddress, savedSlot.index + slots.Count);

            OnSafeSlotChanged?.Invoke(savedSlot.index);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        // 저장된 퀵슬롯 TID를 기준으로 퀵슬롯 데이터를 복원
        for (int i = 0; i < quickSlotNum; i++)
        {
            int tid = i < saveData.quickSlots.Count ? saveData.quickSlots[i] : 0;

            if (tid == 0)
            {
                quickSlots[i].TID = 0;
                quickSlots[i].amount = 0;
                quickSlots[i].icon = null;
                quickSlots[i].itemData = null;
                GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
                continue;
            }

            quickSlots[i].TID = tid;
            quickSlots[i].amount = GetSavedItemCount(saveData, tid);

            ItemData itemData = GetItemDataByTID(tid);
            quickSlots[i].itemData = itemData;

            if (itemData != null)
            {
                _ = LoadQuickSlotSprite(itemData.iconAddress, i);
            }
        }

        // 인벤토리 초기화 완료 후 시작 시점 스냅샷 저장
        SessionDataSO.Instance.SnapshotStartingInventory(anySlots);
    }

    /* TID를 통해 저장소에서 아이템 데이터 찾기 */
    public ItemData GetItemDataByTID(int tid)
    {
        if (tid == 0) return null;

        return itemRepo.GetItemDataByID(tid);
    }

    /* 퀵슬롯 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
    private async Task LoadQuickSlotSprite(string iconRef, int quickIndex)
    {
        Sprite loadIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconRef);
        
        if (loadIcon == null)
        {
            quickSlots[quickIndex].icon = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, null, quickSlots[quickIndex].amount);
            return;
        }

        quickSlots[quickIndex].icon = loadIcon;
        GlobalEventBus.OnQuickSlotChanged?.Invoke(quickIndex, loadIcon, quickSlots[quickIndex].amount);
    }

    /* 런타임 인벤토리/퀵슬롯/각성 보존 슬롯 데이터를 모두 초기화 */
    private void ClearRuntimeSlots()
    {
        for (int i = 0; i < slotNum; i++)
        {
            slots[i].TID = 0;
            slots[i].amount = 0;
            slots[i].icon = null;
            slots[i].itemData = null;
            OnSlotChanged?.Invoke(i);
        }

        for (int j = 0; j < safeSlotNum; j++)
        {
            safeSlots[j].TID = 0;
            safeSlots[j].amount = 0;
            safeSlots[j].icon = null;
            safeSlots[j].itemData = null;
            OnSafeSlotChanged?.Invoke(j);
        }

        // 인벤토리 및 각성 보존 슬롯 헬퍼 갱신
        RebuildAnySlots();

        for (int i = 0; i < quickSlotNum; i++)
        {
            quickSlots[i].TID = 0;
            quickSlots[i].amount = 0;
            quickSlots[i].icon = null;
            quickSlots[i].itemData = null;
            GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
        }
    }

    /* 저장 데이터 기준 특정 TID 아이템 총 수량 계산 */
    private int GetSavedItemCount(PlayerSaveData saveData, int tid)
    {
        int count = 0;
        foreach (var slot in saveData.inventorySlots)
        {
            if (slot.TID == tid) count += slot.amount;
        }
        return count;
    }
}
```

---

## 21. PlayerMovement.cs

### 21-1. 이전 스크립트 전체

```cs
﻿/// <summary>
/// 플레이어의 이동과 커서 방향 회전을 처리하는 스크립트
/// </summary>
using UnityEngine;
using AnyPortrait;
using System.Collections;

public class PlayerMovement : MonoBehaviour
{
    [Header("Player Movement Controll")]
    [SerializeField] private Rigidbody rb;
    [SerializeField] private Camera mainCamera;

    private Vector2 movementInput;                       // 플레이어의 이동 입력
    private bool sprintInput;                           // 플레이어의 달리기 입력
    private Vector2 currentMousePos;                    // 현재 마우스 화면 좌표

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
    [SerializeField] private LayerMask movementObstacleMask; // 이동/구르기 중 관통을 막을 벽 레이어
    [SerializeField] private float movementWallBuffer = 0.05f; // 벽 앞에서 멈추도록 남기는 여유 거리
    [SerializeField] private float evadeCornerProbeRadius = 0.25f; // 벽 모서리 관통을 막기 위한 보조 검사 반지름
    [SerializeField] private float evadeCornerProbeHeight = 0.5f; // 보조 검사를 시작할 플레이어 높이

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

        // 필수 컴포넌트가 없으면 비활성화
        if (rb == null || animator == null || mainCamera == null)
        {
            enabled = false;
            Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    private void OnEnable()
    {
        GlobalEventBus.OnPlayerMove += PlayerMove;
        GlobalEventBus.SendCanSprint += PlayerSprint;
        GlobalEventBus.SendCannotSprint += PlayerSprint;
        GlobalEventBus.OnMousePositionInput += UpdateMousePos;
        GlobalEventBus.OnMainActiveSkillCasted += SkillAnimate;
        GlobalEventBus.OnHitAnimate += HitAnimate;
        GlobalEventBus.onPlayerDead += PlayerDie;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnPlayerMove -= PlayerMove;
        GlobalEventBus.SendCanSprint -= PlayerSprint;
        GlobalEventBus.SendCannotSprint -= PlayerSprint;
        GlobalEventBus.OnMousePositionInput -= UpdateMousePos;
        GlobalEventBus.OnMainActiveSkillCasted -= SkillAnimate;
        GlobalEventBus.OnHitAnimate -= HitAnimate;
        GlobalEventBus.onPlayerDead -= PlayerDie;
        moveNoiseTimer = 0.0f;
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

    public void initialize(float _speed, float _sSpeed, float _sMana, float _eSpeed, float _eTime, float _eMana, float _eCooltime)
    {
        // 기본 이동 속도 초기화
        moveSpeed = _speed;

        // 달리기 속도 초기화
        sprintSpeed = _sSpeed;

        // 달리기 중 초당 MP 소비 초기화
        sprintMP = _sMana;

        // 구르기 이동 거리(속도 × 시간) 초기화
        evadeSpeed = _eSpeed;
        evadeTime = _eTime;

        // 구르기 MP 소비 초기화
        evadeMP = _eMana;

        // 구르기 쿨타임 초기화
        evadeCooltime = _eCooltime;

        artifactMoveSpeedRate = 0.0f;
        movementWallBuffer = Mathf.Max(0.0f, movementWallBuffer);
        evadeCornerProbeRadius = Mathf.Max(0.05f, evadeCornerProbeRadius);
        evadeCornerProbeHeight = Mathf.Max(0.0f, evadeCornerProbeHeight);
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
    private void PlayerMove(Vector2 input) => movementInput = input;

    /* 플레이어 달리기 입력 갱신 */
    private void PlayerSprint(bool sprint) => sprintInput = sprint;

    /* 마우스 화면 좌표 갱신 */
    private void UpdateMousePos(Vector2 pos) => currentMousePos = pos;

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
        Vector3 targetPosition = rb.position + movement * finalMoveSpeed * Time.fixedDeltaTime;
        if (isEvading)
        {
            targetPosition = GetSafeMovePosition(targetPosition);
        }

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

        AimTowardsMouse();
        ImageTowardsMouse();
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
    /// 구르기 이동 전에 Rigidbody가 실제로 지나갈 경로를 검사해 벽을 관통하지 않도록 목표 위치를 보정합니다.
    /// 일반 이동까지 막으면 문/벽 근처 상호작용 거리 진입이 어려워질 수 있으므로 회피 중에만 사용합니다.
    /// </summary>
    private Vector3 GetSafeMovePosition(Vector3 targetPosition)
    {
        Vector3 moveDelta = targetPosition - rb.position;
        moveDelta.y = 0.0f;

        if (moveDelta.sqrMagnitude <= 0.0001f)
        {
            return targetPosition;
        }

        LayerMask obstacleMask = ResolveMovementObstacleMask();
        if (obstacleMask.value == 0)
        {
            return targetPosition;
        }

        Vector3 direction = moveDelta.normalized;
        float distance = moveDelta.magnitude;

        if (rb.SweepTest(direction, out RaycastHit hit, distance, QueryTriggerInteraction.Ignore) &&
            ((1 << hit.collider.gameObject.layer) & obstacleMask.value) != 0)
        {
            float safeDistance = Mathf.Max(0.0f, hit.distance - movementWallBuffer);
            Vector3 safePosition = rb.position + direction * safeDistance;
            safePosition.y = rb.position.y;
            return safePosition;
        }

        if (Physics.SphereCast(
                rb.position + Vector3.up * evadeCornerProbeHeight,
                evadeCornerProbeRadius,
                direction,
                out RaycastHit cornerHit,
                distance,
                obstacleMask,
                QueryTriggerInteraction.Ignore))
        {
            float safeDistance = Mathf.Max(0.0f, cornerHit.distance - movementWallBuffer);
            Vector3 safePosition = rb.position + direction * safeDistance;
            safePosition.y = rb.position.y;
            return safePosition;
        }

        return targetPosition;
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
            moveNoiseTimer = Mathf.Max(0.05f, runNoiseInterval);
            return;
        }

        NoiseSystem.Emit(NoiseType.Walk, transform.position, gameObject, walkNoiseRange);
        moveNoiseTimer = Mathf.Max(0.05f, walkNoiseInterval);
    }

    /* 구르기 처리 */
    public void PlayerEvade()
    {
        isEvading = true;

        // 구르기 입력을 애니메이터에 전달
        animator.SetTrigger("Evade");

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
        Plane plane = new Plane(Vector3.up, transform.position);
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
            if(aimVisualDir.z > 0)
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

### 21-2. 변경 설명

이동과 회피의 실제 상태 전환 지점에서 발걸음·회피 VFX를 재생하도록 연결했다. 이동 입력, 물리 이동, 스태미나 규칙은 기존 책임을 유지한다.

### 21-3. 현재 스크립트 전체

```cs
﻿/// <summary>
/// 플레이어의 이동과 커서 방향 회전을 처리하는 스크립트
/// </summary>
using UnityEngine;
using AnyPortrait;
using System.Collections;

public class PlayerMovement : MonoBehaviour
{
    [Header("Player Movement Controll")]
    [SerializeField] private Rigidbody rb;
    [SerializeField] private Camera mainCamera;

    private Vector2 movementInput;                       // 플레이어의 이동 입력
    private bool sprintInput;                           // 플레이어의 달리기 입력
    private Vector2 currentMousePos;                    // 현재 마우스 화면 좌표

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
    [SerializeField] private LayerMask movementObstacleMask; // 이동/구르기 중 관통을 막을 벽 레이어
    [SerializeField] private float movementWallBuffer = 0.05f; // 벽 앞에서 멈추도록 남기는 여유 거리
    [SerializeField] private float evadeCornerProbeRadius = 0.25f; // 벽 모서리 관통을 막기 위한 보조 검사 반지름
    [SerializeField] private float evadeCornerProbeHeight = 0.5f; // 보조 검사를 시작할 플레이어 높이

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

        // 필수 컴포넌트가 없으면 비활성화
        if (rb == null || animator == null || mainCamera == null)
        {
            enabled = false;
            Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    private void OnEnable()
    {
        GlobalEventBus.OnPlayerMove += PlayerMove;
        GlobalEventBus.SendCanSprint += PlayerSprint;
        GlobalEventBus.SendCannotSprint += PlayerSprint;
        GlobalEventBus.OnMousePositionInput += UpdateMousePos;
        GlobalEventBus.OnMainActiveSkillCasted += SkillAnimate;
        GlobalEventBus.OnHitAnimate += HitAnimate;
        GlobalEventBus.onPlayerDead += PlayerDie;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnPlayerMove -= PlayerMove;
        GlobalEventBus.SendCanSprint -= PlayerSprint;
        GlobalEventBus.SendCannotSprint -= PlayerSprint;
        GlobalEventBus.OnMousePositionInput -= UpdateMousePos;
        GlobalEventBus.OnMainActiveSkillCasted -= SkillAnimate;
        GlobalEventBus.OnHitAnimate -= HitAnimate;
        GlobalEventBus.onPlayerDead -= PlayerDie;
        moveNoiseTimer = 0.0f;
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

    public void initialize(float _speed, float _sSpeed, float _sMana, float _eSpeed, float _eTime, float _eMana, float _eCooltime)
    {
        // 기본 이동 속도 초기화
        moveSpeed = _speed;

        // 달리기 속도 초기화
        sprintSpeed = _sSpeed;

        // 달리기 중 초당 MP 소비 초기화
        sprintMP = _sMana;

        // 구르기 이동 거리(속도 × 시간) 초기화
        evadeSpeed = _eSpeed;
        evadeTime = _eTime;

        // 구르기 MP 소비 초기화
        evadeMP = _eMana;

        // 구르기 쿨타임 초기화
        evadeCooltime = _eCooltime;

        artifactMoveSpeedRate = 0.0f;
        movementWallBuffer = Mathf.Max(0.0f, movementWallBuffer);
        evadeCornerProbeRadius = Mathf.Max(0.05f, evadeCornerProbeRadius);
        evadeCornerProbeHeight = Mathf.Max(0.0f, evadeCornerProbeHeight);
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
    private void PlayerMove(Vector2 input) => movementInput = input;

    /* 플레이어 달리기 입력 갱신 */
    private void PlayerSprint(bool sprint) => sprintInput = sprint;

    /* 마우스 화면 좌표 갱신 */
    private void UpdateMousePos(Vector2 pos) => currentMousePos = pos;

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
        Vector3 targetPosition = rb.position + movement * finalMoveSpeed * Time.fixedDeltaTime;
        if (isEvading)
        {
            targetPosition = GetSafeMovePosition(targetPosition);
        }

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

        AimTowardsMouse();
        ImageTowardsMouse();
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
    /// 구르기 이동 전에 Rigidbody가 실제로 지나갈 경로를 검사해 벽을 관통하지 않도록 목표 위치를 보정합니다.
    /// 일반 이동까지 막으면 문/벽 근처 상호작용 거리 진입이 어려워질 수 있으므로 회피 중에만 사용합니다.
    /// </summary>
    private Vector3 GetSafeMovePosition(Vector3 targetPosition)
    {
        Vector3 moveDelta = targetPosition - rb.position;
        moveDelta.y = 0.0f;

        if (moveDelta.sqrMagnitude <= 0.0001f)
        {
            return targetPosition;
        }

        LayerMask obstacleMask = ResolveMovementObstacleMask();
        if (obstacleMask.value == 0)
        {
            return targetPosition;
        }

        Vector3 direction = moveDelta.normalized;
        float distance = moveDelta.magnitude;

        if (rb.SweepTest(direction, out RaycastHit hit, distance, QueryTriggerInteraction.Ignore) &&
            ((1 << hit.collider.gameObject.layer) & obstacleMask.value) != 0)
        {
            float safeDistance = Mathf.Max(0.0f, hit.distance - movementWallBuffer);
            Vector3 safePosition = rb.position + direction * safeDistance;
            safePosition.y = rb.position.y;
            return safePosition;
        }

        if (Physics.SphereCast(
                rb.position + Vector3.up * evadeCornerProbeHeight,
                evadeCornerProbeRadius,
                direction,
                out RaycastHit cornerHit,
                distance,
                obstacleMask,
                QueryTriggerInteraction.Ignore))
        {
            float safeDistance = Mathf.Max(0.0f, cornerHit.distance - movementWallBuffer);
            Vector3 safePosition = rb.position + direction * safeDistance;
            safePosition.y = rb.position.y;
            return safePosition;
        }

        return targetPosition;
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
        Plane plane = new Plane(Vector3.up, transform.position);
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
            if(aimVisualDir.z > 0)
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

---

## 22. PlayerStatus.cs

### 22-1. 이전 스크립트 전체

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

### 22-2. 변경 설명

플레이어 피격과 사망이 확정될 때 상태에 맞는 VFX를 재생한다. HP와 세션 종료 방어 로직 이후에 호출해 무효 피해에는 효과가 발생하지 않도록 한다.

### 22-3. 현재 스크립트 전체

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

        // 치명타에서는 일반 피격 VFX 대신 사망 VFX만 재생해 두 연출이 겹치지 않게 합니다.
        string damageVfxId = hpCurrent <= 0.0f
            ? GameplayVFXIds.PlayerDeath
            : GameplayVFXIds.PlayerHit;
        VFXService.Instance?.Play(damageVfxId, transform.position, transform.rotation);

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
        float previousHp = hpCurrent;
        GetHp(_effectValue);
        if (hpCurrent > previousHp)
            VFXService.Instance?.Play(GameplayVFXIds.PlayerHeal, transform.position, transform.rotation);
    }

    private void GainMana(GameObject _target, float _effectValue)
    {
        // 대상이 내가 아니라면 리턴
        if (_target != this.gameObject) return;
        float previousMp = mpCurrent;
        GetMp(_effectValue);
        if (mpCurrent > previousMp)
            VFXService.Instance?.Play(GameplayVFXIds.PlayerManaGain, transform.position, transform.rotation);
    }

    /* 초상화 UI 업데이트 */
    private void UpdateFaceImage()
    {
        /// 플레이어 데이터 구조가 구축되면 연동하여 업데이트 할 것 ///
    }

    /* 아이템을 사용해 체력 회복 */
    public void HealthRecoverInst(float _amount)
    {
        float previousHp = hpCurrent;
        GetHp(_amount);
        if (hpCurrent > previousHp)
            VFXService.Instance?.Play(GameplayVFXIds.PlayerHeal, transform.position, transform.rotation);
    }

    /* 아이템을 사용해 마나 회복 */
    public void ManaRecoverInst(float _amount)
    {
        float previousMp = mpCurrent;
        GetMp(_amount);
        if (mpCurrent > previousMp)
            VFXService.Instance?.Play(GameplayVFXIds.PlayerManaGain, transform.position, transform.rotation);
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

        string markVfxId = currentStack >= leakRequiredStack
            ? GameplayVFXIds.LucidMark02
            : GameplayVFXIds.LucidMark01;
        VFXService.Instance?.Play(markVfxId, owner.position, owner.rotation);

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

        VFXService.Instance?.Play(GameplayVFXIds.LucidLeak, spawnPosition);
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
        // 공통 VFX 서비스가 활성화된 경우 Catalog의 VFX_LucidLeak을 사용합니다.
        // 기존 직렬화 프리팹은 서비스가 없는 테스트 환경의 폴백으로만 유지합니다.
        if (VFXService.Instance != null)
        {
            return;
        }

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

## 23. PlayerWeapon.cs

### 23-1. 이전 스크립트 전체

```cs
﻿using System.Collections;
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

### 23-2. 변경 설명

플레이어 무기 공격이 실제로 발사·공격 처리되는 시점에 무기 VFX를 연결했다. 공격 판정과 탄약·쿨타임 흐름은 유지하고 위치와 방향만 VFXService에 전달한다.

### 23-3. 현재 스크립트 전체

```cs
﻿using System.Collections;
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

        // 총구 위치와 방향을 기준으로 발사 VFX를 재생합니다.
        VFXService.Instance?.Play(GameplayVFXIds.PlayerMuzzle, firePoint.position, firePoint.rotation);

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
                VFXService.Instance?.Play(
                    GameplayVFXIds.BulletImpactEnemy,
                    shotHit.point,
                    Quaternion.LookRotation(shotHit.normal));
            }
            else
            {
                // 데미지 대상이 아닌 벽과 장애물은 월드 탄착 VFX로 구분합니다.
                VFXService.Instance?.Play(
                    GameplayVFXIds.BulletImpactWorld,
                    shotHit.point,
                    Quaternion.LookRotation(shotHit.normal));
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

---

## 24. TutorialMessageCatalog.cs

### 24-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 24-2. 변경 설명

튜토리얼 ID별 제목, 설명, 게임 정지 여부를 보관하는 ScriptableObject다. 런타임 딕셔너리를 만들고 중복 ID를 경고해 데이터 오류를 조기에 확인한다.

### 24-3. 현재 스크립트 전체

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 튜토리얼 ID와 화면에 표시할 문구 및 일시정지 설정을 보관합니다.
/// 씬과 분리된 ScriptableObject이므로 TutorialSystem 프리팹을 다른 씬으로 옮겨도 재사용할 수 있습니다.
/// </summary>
[CreateAssetMenu(fileName = "TutorialMessageCatalog", menuName = "Lucid Diver/Tutorial/Message Catalog")]
public sealed class TutorialMessageCatalog : ScriptableObject
{
    [SerializeField] private List<TutorialMessageEntry> entries = new List<TutorialMessageEntry>();

    private Dictionary<string, TutorialMessageEntry> entryById;

    public IReadOnlyList<TutorialMessageEntry> Entries => entries;

    public bool TryGetEntry(string tutorialId, out TutorialMessageEntry entry)
    {
        BuildLookupIfNeeded();
        return entryById.TryGetValue(tutorialId ?? string.Empty, out entry);
    }

    private void OnEnable()
    {
        entryById = null;
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        entryById = null;
        HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);

        foreach (TutorialMessageEntry entry in entries)
        {
            if (entry == null || string.IsNullOrWhiteSpace(entry.TutorialId))
                continue;

            if (!ids.Add(entry.TutorialId))
                Debug.LogWarning($"[TutorialCatalog] 중복된 튜토리얼 ID가 있습니다: {entry.TutorialId}", this);
        }
    }
#endif

    private void BuildLookupIfNeeded()
    {
        if (entryById != null)
            return;

        entryById = new Dictionary<string, TutorialMessageEntry>(StringComparer.Ordinal);
        foreach (TutorialMessageEntry entry in entries)
        {
            if (entry == null || string.IsNullOrWhiteSpace(entry.TutorialId) || entryById.ContainsKey(entry.TutorialId))
                continue;

            entryById.Add(entry.TutorialId, entry);
        }
    }
}

/// <summary>
/// 튜토리얼 팝업 한 단계에 필요한 표시 데이터입니다.
/// </summary>
[Serializable]
public sealed class TutorialMessageEntry
{
    [SerializeField] private string tutorialId;
    [SerializeField] private string title;
    [TextArea(2, 5)] [SerializeField] private string message;
    [SerializeField] private string confirmText = "확인";
    [SerializeField] private bool pauseGame = true;

    public string TutorialId => tutorialId;
    public string Title => title;
    public string Message => message;
    public string ConfirmText => string.IsNullOrWhiteSpace(confirmText) ? "확인" : confirmText;
    public bool PauseGame => pauseGame;
}
```

---

## 25. TutorialPopup.cs

### 25-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 25-2. 변경 설명

TextMeshPro 제목·본문과 확인 버튼을 바인딩하고 CanvasGroup으로 표시 상태를 제어한다. UI는 메시지를 그리는 책임만 가지며 시간과 입력 처리는 Manager에 맡긴다.

### 25-3. 현재 스크립트 전체

```cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 하나의 공통 패널에 튜토리얼 문구를 교체하여 표시합니다.
/// </summary>
public sealed class TutorialPopup : MonoBehaviour
{
    [SerializeField] private CanvasGroup canvasGroup;
    [SerializeField] private TMP_Text titleText;
    [SerializeField] private TMP_Text messageText;
    [SerializeField] private TMP_Text confirmText;
    [SerializeField] private Button confirmButton;

    private Action onConfirmed;

    private void Awake()
    {
        if (confirmButton != null)
            confirmButton.onClick.AddListener(Confirm);
    }

    public void Show(TutorialMessageEntry entry, Action confirmed)
    {
        if (entry == null)
            return;

        onConfirmed = confirmed;

        if (titleText != null)
            titleText.text = entry.Title;
        if (messageText != null)
            messageText.text = entry.Message;
        if (confirmText != null)
            confirmText.text = entry.ConfirmText;

        gameObject.SetActive(true);
        SetCanvasState(true);
    }

    public void Confirm()
    {
        if (!gameObject.activeSelf)
            return;

        Action callback = onConfirmed;
        HideImmediate();
        callback?.Invoke();
    }

    public void HideImmediate()
    {
        onConfirmed = null;
        SetCanvasState(false);
        gameObject.SetActive(false);
    }

    private void SetCanvasState(bool visible)
    {
        if (canvasGroup == null)
            return;

        canvasGroup.alpha = visible ? 1f : 0f;
        canvasGroup.interactable = visible;
        canvasGroup.blocksRaycasts = visible;
    }

    private void OnDestroy()
    {
        if (confirmButton != null)
            confirmButton.onClick.RemoveListener(Confirm);
    }
}
```

---

## 26. TutorialManager.cs

### 26-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 26-2. 변경 설명

카탈로그 조회, 중복 팝업 차단, timeScale 저장·복원, Player/UI 입력 맵 전환, 키보드·게임패드 확인 입력을 관리한다. 비활성화·파괴 시에도 정지 상태와 입력 상태를 정리한다.

### 26-3. 현재 스크립트 전체

```cs
using System;
using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// 튜토리얼 메시지 조회, 팝업 중복 방지, 입력 전환과 일시정지를 중앙에서 관리합니다.
/// </summary>
public sealed class TutorialManager : MonoBehaviour
{
    private const string CatalogResourcePath = "Tutorial/TutorialMessageCatalog";

    public static TutorialManager Instance { get; private set; }

    [SerializeField] private TutorialMessageCatalog catalog;
    [SerializeField] private TutorialPopup popup;

    private Action currentCompletion;
    private LocalInputReader inputReader;
    private float previousTimeScale = 1f;
    private bool isShowing;
    private bool pausedByTutorial;

    public bool IsShowing => isShowing;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        catalog ??= Resources.Load<TutorialMessageCatalog>(CatalogResourcePath);
        popup ??= GetComponentInChildren<TutorialPopup>(true);
        popup?.HideImmediate();
    }

    private void Update()
    {
        if (!isShowing || popup == null)
            return;

        bool keyboardConfirmed = Keyboard.current != null &&
            (Keyboard.current.enterKey.wasPressedThisFrame ||
             Keyboard.current.spaceKey.wasPressedThisFrame ||
             Keyboard.current.escapeKey.wasPressedThisFrame);
        bool gamepadConfirmed = Gamepad.current != null && Gamepad.current.buttonSouth.wasPressedThisFrame;

        if (keyboardConfirmed || gamepadConfirmed)
            popup.Confirm();
    }

    /// <summary>
    /// ID에 해당하는 팝업을 표시합니다. 이미 팝업이 열려 있으면 새 요청을 받지 않습니다.
    /// </summary>
    public bool Show(string tutorialId, Action completed = null)
    {
        if (isShowing || popup == null || catalog == null)
            return false;

        if (!catalog.TryGetEntry(tutorialId, out TutorialMessageEntry entry))
        {
            Debug.LogWarning($"[TutorialManager] 등록되지 않은 튜토리얼 ID입니다: {tutorialId}", this);
            return false;
        }

        isShowing = true;
        currentCompletion = completed;

        if (entry.PauseGame)
            PauseGameplay();

        popup.Show(entry, CompleteCurrent);
        return true;
    }

    private void CompleteCurrent()
    {
        if (!isShowing)
            return;

        isShowing = false;
        RestoreGameplay();

        Action completion = currentCompletion;
        currentCompletion = null;
        completion?.Invoke();
    }

    private void PauseGameplay()
    {
        previousTimeScale = Time.timeScale;
        Time.timeScale = 0f;
        pausedByTutorial = true;

        inputReader = FindFirstObjectByType<LocalInputReader>();
        inputReader?.SwitchToUIMap();
    }

    private void RestoreGameplay()
    {
        if (!pausedByTutorial)
            return;

        Time.timeScale = previousTimeScale;
        pausedByTutorial = false;

        if (inputReader != null)
            inputReader.SwitchToPlayerMap();
        inputReader = null;
    }

    private void OnDisable()
    {
        if (!isShowing)
            return;

        popup?.HideImmediate();
        isShowing = false;
        currentCompletion = null;
        RestoreGameplay();
    }

    private void OnDestroy()
    {
        RestoreGameplay();
        if (Instance == this)
            Instance = null;
    }
}
```

---

## 27. TutorialTrigger.cs

### 27-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 27-2. 변경 설명

BoxCollider 진입 시 플레이어를 태그와 핵심 컴포넌트로 확인하고 지정한 튜토리얼 ID를 요청한다. 1회 실행 옵션과 Scene 뷰 기즈모를 제공한다.

### 27-3. 현재 스크립트 전체

```cs
using UnityEngine;

/// <summary>
/// 플레이어가 콜라이더에 진입하면 지정한 튜토리얼 ID의 설명 팝업을 요청합니다.
/// </summary>
[RequireComponent(typeof(BoxCollider))]
public sealed class TutorialTrigger : MonoBehaviour
{
    [SerializeField] private string tutorialId = "TUTORIAL_MOVE_001";
    [SerializeField] private bool triggerOnce = true;

    private bool consumed;

    public string TutorialId => tutorialId;
    public bool IsConsumed => consumed;

    private void Reset()
    {
        BoxCollider trigger = GetComponent<BoxCollider>();
        trigger.isTrigger = true;
        trigger.size = new Vector3(4f, 2f, 1f);
    }

    private void OnTriggerEnter(Collider other)
    {
        if ((triggerOnce && consumed) || !IsPlayer(other))
            return;

        TutorialManager manager = TutorialManager.Instance ?? FindFirstObjectByType<TutorialManager>();
        if (manager != null && manager.Show(tutorialId))
            consumed = triggerOnce;
    }

    public void ResetTrigger()
    {
        consumed = false;
    }

    private static bool IsPlayer(Collider other)
    {
        return other != null &&
               (other.CompareTag("Player") ||
                other.GetComponentInParent<PlayerStatus>() != null ||
                other.GetComponentInParent<LocalInputReader>() != null);
    }

    private void OnDrawGizmos()
    {
        BoxCollider trigger = GetComponent<BoxCollider>();
        if (trigger == null)
            return;

        Gizmos.color = new Color(0.1f, 0.8f, 1f, 0.75f);
        Matrix4x4 previousMatrix = Gizmos.matrix;
        Gizmos.matrix = transform.localToWorldMatrix;
        Gizmos.DrawWireCube(trigger.center, trigger.size);
        Gizmos.matrix = previousMatrix;
    }
}
```

---

## 28. TutorialEventBridge.cs

### 28-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 28-2. 변경 설명

상자 열기와 에너미 체력 변경 전역 이벤트를 튜토리얼 메시지로 연결한다. TutorialScene의 TutorialSystem에만 배치해 다른 씬의 게임 흐름에는 영향을 주지 않는다.

### 28-3. 현재 스크립트 전체

```cs
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 본편 시스템의 글로벌 이벤트를 튜토리얼 팝업 요청으로 변환합니다.
/// TutorialScene에만 배치하여 다른 씬과 풀링 프리팹에는 영향을 주지 않습니다.
/// </summary>
public sealed class TutorialEventBridge : MonoBehaviour
{
    private const string ItemTutorialId = "TUTORIAL_ITEM_001";
    private const string SkillTutorialId = "TUTORIAL_SKILL_001";

    private readonly Queue<string> pendingTutorials = new Queue<string>();
    private readonly HashSet<string> requestedTutorials = new HashSet<string>();

    private void OnEnable()
    {
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;
        GlobalEventBus.OnEnemyHealthChanged += HandleEnemyHealthChanged;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;
        GlobalEventBus.OnEnemyHealthChanged -= HandleEnemyHealthChanged;
    }

    private void Update()
    {
        if (pendingTutorials.Count == 0)
            return;

        TutorialManager manager = TutorialManager.Instance;
        if (manager == null || manager.IsShowing)
            return;

        string tutorialId = pendingTutorials.Peek();
        if (manager.Show(tutorialId))
            pendingTutorials.Dequeue();
    }

    /// <summary>
    /// 상자를 실제로 열었을 때 아이템 이동 방법을 한 번만 안내합니다.
    /// </summary>
    private void HandleItemBoxOpened(IInteractable interactable, int playerId)
    {
        if (interactable is ItemBox)
            RequestOnce(ItemTutorialId);
    }

    /// <summary>
    /// 첫 공격이 적에게 적중하면 다음 실습인 액티브 스킬 사용법을 안내합니다.
    /// </summary>
    private void HandleEnemyHealthChanged(int enemyId, float currentHealth, float maxHealth)
    {
        if (maxHealth > 0f && currentHealth > 0f && currentHealth < maxHealth)
            RequestOnce(SkillTutorialId);
    }

    private void RequestOnce(string tutorialId)
    {
        if (!requestedTutorials.Add(tutorialId))
            return;

        pendingTutorials.Enqueue(tutorialId);
    }
}
```

---

## 29. TutorialPrefabBuilder.cs

### 29-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 29-2. 변경 설명

튜토리얼 메시지 카탈로그와 TutorialSystem·TutorialTrigger 프리팹을 생성하고 TutorialScene에 기본 오브젝트와 이동 트리거를 배치한다. Build Settings 등록도 자동화해 반복적인 수동 설정을 줄인다.

### 29-3. 현재 스크립트 전체

```cs
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// 튜토리얼 시스템과 트리거 프리팹을 생성하고 TutorialScene에 기본 이동 트리거를 배치합니다.
/// </summary>
public static class TutorialPrefabBuilder
{
    private const string PrefabFolder = "Assets/03_PreFabs/Tutorial";
    private const string SystemPrefabPath = PrefabFolder + "/TutorialSystem.prefab";
    private const string TriggerPrefabPath = PrefabFolder + "/TutorialTrigger.prefab";
    private const string CatalogFolder = "Assets/Resources/Tutorial";
    private const string CatalogPath = CatalogFolder + "/TutorialMessageCatalog.asset";
    private const string TutorialScenePath = "Assets/01_Scenes/TutorialScene.unity";

    [MenuItem("Tools/Lucid Diver/Tutorial/Build Tutorial Prefabs and Scene")]
    public static void BuildTutorialAssets()
    {
        EnsureFolder(PrefabFolder);
        EnsureFolder(CatalogFolder);

        TutorialMessageCatalog catalog = CreateCatalogIfNeeded();
        CreateSystemPrefab(catalog);
        CreateTriggerPrefab();
        PlacePrefabsInTutorialScene();
        AddTutorialSceneToBuildSettings();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        GameObject systemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
        Selection.activeObject = systemPrefab;
        EditorGUIUtility.PingObject(systemPrefab);
        Debug.Log("[TutorialBuilder] TutorialSystem/Trigger 프리팹과 TutorialScene 기본 배치를 완료했습니다.");
    }

    private static TutorialMessageCatalog CreateCatalogIfNeeded()
    {
        TutorialMessageCatalog catalog = AssetDatabase.LoadAssetAtPath<TutorialMessageCatalog>(CatalogPath);
        bool created = catalog == null;

        if (created)
        {
            catalog = ScriptableObject.CreateInstance<TutorialMessageCatalog>();
            AssetDatabase.CreateAsset(catalog, CatalogPath);
        }

        SerializedObject serializedCatalog = new SerializedObject(catalog);
        SerializedProperty entries = serializedCatalog.FindProperty("entries");
        if (entries.arraySize == 0)
        {
            AddCatalogEntry(entries, "TUTORIAL_MOVE_001", "이동", "WASD 키를 사용하여 캐릭터를 이동할 수 있습니다.", true);
            AddCatalogEntry(entries, "TUTORIAL_INTERACT_001", "상호작용", "상호작용 키를 눌러 주변 오브젝트를 조사할 수 있습니다.", true);
            AddCatalogEntry(entries, "TUTORIAL_ITEM_001", "아이템 획득", "아이템을 획득하고 인벤토리와 퀵슬롯에서 확인해 보세요.", true);
            AddCatalogEntry(entries, "TUTORIAL_ATTACK_001", "기본 공격", "조준한 방향으로 기본 공격을 사용해 훈련용 에너미를 공격하세요.", true);
            AddCatalogEntry(entries, "TUTORIAL_SKILL_001", "프리즘 유탄", "스킬 키를 눌러 프리즘 유탄을 투척할 수 있습니다.", true);
            AddCatalogEntry(entries, "TUTORIAL_ESCAPE_001", "탈출", "탈출 지점에서 상호작용하고 채널링이 끝날 때까지 기다리세요.", true);
            serializedCatalog.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(catalog);
        }

        return catalog;
    }

    private static void AddCatalogEntry(
        SerializedProperty entries,
        string tutorialId,
        string title,
        string message,
        bool pauseGame)
    {
        int index = entries.arraySize;
        entries.InsertArrayElementAtIndex(index);
        SerializedProperty entry = entries.GetArrayElementAtIndex(index);
        entry.FindPropertyRelative("tutorialId").stringValue = tutorialId;
        entry.FindPropertyRelative("title").stringValue = title;
        entry.FindPropertyRelative("message").stringValue = message;
        entry.FindPropertyRelative("confirmText").stringValue = "확인";
        entry.FindPropertyRelative("pauseGame").boolValue = pauseGame;
    }

    private static void CreateSystemPrefab(TutorialMessageCatalog catalog)
    {
        GameObject root = new GameObject("TutorialSystem");
        TutorialManager manager = root.AddComponent<TutorialManager>();

        GameObject canvasObject = new GameObject(
            "TutorialCanvas",
            typeof(RectTransform),
            typeof(Canvas),
            typeof(CanvasScaler),
            typeof(GraphicRaycaster));
        canvasObject.transform.SetParent(root.transform, false);
        Canvas canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.overrideSorting = true;
        canvas.sortingOrder = 5000;

        CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
        scaler.matchWidthOrHeight = 0.5f;

        GameObject panel = CreateUIObject("TutorialPopup", canvasObject.transform);
        RectTransform panelRect = panel.GetComponent<RectTransform>();
        panelRect.anchorMin = new Vector2(0.5f, 1f);
        panelRect.anchorMax = new Vector2(0.5f, 1f);
        panelRect.pivot = new Vector2(0.5f, 1f);
        panelRect.anchoredPosition = new Vector2(0f, -56f);
        panelRect.sizeDelta = new Vector2(920f, 230f);

        Image background = panel.AddComponent<Image>();
        background.color = new Color(0.055f, 0.035f, 0.12f, 0.94f);
        CanvasGroup canvasGroup = panel.AddComponent<CanvasGroup>();
        TutorialPopup popup = panel.AddComponent<TutorialPopup>();

        TMP_Text titleText = CreateText(
            "TitleText",
            panel.transform,
            new Vector2(0f, 0.68f),
            new Vector2(1f, 1f),
            new Vector2(28f, -10f),
            new Vector2(-28f, -12f),
            36f,
            FontStyles.Bold,
            TextAlignmentOptions.Center);
        titleText.text = "이동";
        titleText.color = new Color(0.72f, 0.58f, 1f, 1f);

        TMP_Text messageText = CreateText(
            "MessageText",
            panel.transform,
            new Vector2(0f, 0.28f),
            new Vector2(1f, 0.68f),
            new Vector2(42f, 0f),
            new Vector2(-42f, 0f),
            27f,
            FontStyles.Normal,
            TextAlignmentOptions.Center);
        messageText.text = "WASD 키를 사용하여 캐릭터를 이동할 수 있습니다.";
        messageText.color = Color.white;

        GameObject buttonObject = CreateUIObject("ConfirmButton", panel.transform);
        RectTransform buttonRect = buttonObject.GetComponent<RectTransform>();
        buttonRect.anchorMin = new Vector2(0.5f, 0f);
        buttonRect.anchorMax = new Vector2(0.5f, 0f);
        buttonRect.pivot = new Vector2(0.5f, 0f);
        buttonRect.anchoredPosition = new Vector2(0f, 18f);
        buttonRect.sizeDelta = new Vector2(180f, 52f);

        Image buttonImage = buttonObject.AddComponent<Image>();
        buttonImage.color = new Color(0.38f, 0.16f, 0.68f, 1f);
        Button button = buttonObject.AddComponent<Button>();
        ColorBlock colors = button.colors;
        colors.highlightedColor = new Color(0.52f, 0.27f, 0.84f, 1f);
        colors.pressedColor = new Color(0.28f, 0.1f, 0.52f, 1f);
        button.colors = colors;

        TMP_Text confirmText = CreateText(
            "ConfirmText",
            buttonObject.transform,
            Vector2.zero,
            Vector2.one,
            new Vector2(8f, 4f),
            new Vector2(-8f, -4f),
            23f,
            FontStyles.Bold,
            TextAlignmentOptions.Center);
        confirmText.text = "확인";

        SerializedObject popupObject = new SerializedObject(popup);
        SetObjectReference(popupObject, "canvasGroup", canvasGroup);
        SetObjectReference(popupObject, "titleText", titleText);
        SetObjectReference(popupObject, "messageText", messageText);
        SetObjectReference(popupObject, "confirmText", confirmText);
        SetObjectReference(popupObject, "confirmButton", button);
        popupObject.ApplyModifiedPropertiesWithoutUndo();

        SerializedObject managerObject = new SerializedObject(manager);
        SetObjectReference(managerObject, "catalog", catalog);
        SetObjectReference(managerObject, "popup", popup);
        managerObject.ApplyModifiedPropertiesWithoutUndo();

        SetLayerRecursively(canvasObject, LayerMask.NameToLayer("UI"));
        panel.SetActive(false);
        PrefabUtility.SaveAsPrefabAsset(root, SystemPrefabPath);
        Object.DestroyImmediate(root);
    }

    private static void CreateTriggerPrefab()
    {
        GameObject root = new GameObject("TutorialTrigger");
        BoxCollider collider = root.AddComponent<BoxCollider>();
        collider.isTrigger = true;
        collider.size = new Vector3(4f, 2f, 1f);
        TutorialTrigger trigger = root.AddComponent<TutorialTrigger>();

        SerializedObject triggerObject = new SerializedObject(trigger);
        triggerObject.FindProperty("tutorialId").stringValue = "TUTORIAL_MOVE_001";
        triggerObject.FindProperty("triggerOnce").boolValue = true;
        triggerObject.ApplyModifiedPropertiesWithoutUndo();

        PrefabUtility.SaveAsPrefabAsset(root, TriggerPrefabPath);
        Object.DestroyImmediate(root);
    }

    private static void PlacePrefabsInTutorialScene()
    {
        Scene scene = SceneManager.GetSceneByPath(TutorialScenePath);
        bool openedForBuild = !scene.IsValid() || !scene.isLoaded;
        if (openedForBuild)
            scene = EditorSceneManager.OpenScene(TutorialScenePath, OpenSceneMode.Additive);

        if (FindTransform(scene, "TutorialSystem") == null)
        {
            GameObject systemPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(SystemPrefabPath);
            PrefabUtility.InstantiatePrefab(systemPrefab, scene);
        }

        Transform triggerGroup = FindTransform(scene, "TutorialTriggers");
        if (triggerGroup == null)
        {
            GameObject groupObject = new GameObject("TutorialTriggers");
            SceneManager.MoveGameObjectToScene(groupObject, scene);
            triggerGroup = groupObject.transform;
        }

        if (FindTransform(scene, "Trigger_Move") == null)
        {
            GameObject triggerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(TriggerPrefabPath);
            GameObject triggerObject = (GameObject)PrefabUtility.InstantiatePrefab(triggerPrefab, triggerGroup);
            triggerObject.name = "Trigger_Move";

            Transform spawnPoint = FindTransform(scene, "PlayerSpawnPoint");
            triggerObject.transform.position = spawnPoint != null
                ? spawnPoint.position + spawnPoint.forward * 4f + Vector3.up
                : Vector3.up;
            triggerObject.transform.rotation = spawnPoint != null ? spawnPoint.rotation : Quaternion.identity;
        }

        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        if (openedForBuild)
            EditorSceneManager.CloseScene(scene, true);
    }

    private static TMP_Text CreateText(
        string name,
        Transform parent,
        Vector2 anchorMin,
        Vector2 anchorMax,
        Vector2 offsetMin,
        Vector2 offsetMax,
        float fontSize,
        FontStyles fontStyle,
        TextAlignmentOptions alignment)
    {
        GameObject textObject = CreateUIObject(name, parent);
        RectTransform rect = textObject.GetComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.offsetMin = offsetMin;
        rect.offsetMax = offsetMax;

        TextMeshProUGUI text = textObject.AddComponent<TextMeshProUGUI>();
        text.fontSize = fontSize;
        text.fontStyle = fontStyle;
        text.alignment = alignment;
        text.enableWordWrapping = true;
        text.raycastTarget = false;
        if (TMP_Settings.defaultFontAsset != null)
            text.font = TMP_Settings.defaultFontAsset;
        return text;
    }

    private static GameObject CreateUIObject(string name, Transform parent)
    {
        GameObject created = new GameObject(name, typeof(RectTransform));
        created.transform.SetParent(parent, false);
        return created;
    }

    private static void SetObjectReference(SerializedObject serializedObject, string propertyName, Object value)
    {
        serializedObject.FindProperty(propertyName).objectReferenceValue = value;
    }

    private static Transform FindTransform(Scene scene, string objectName)
    {
        foreach (GameObject root in scene.GetRootGameObjects())
        {
            Transform match = root.GetComponentsInChildren<Transform>(true)
                .FirstOrDefault(candidate => candidate.name == objectName);
            if (match != null)
                return match;
        }

        return null;
    }

    private static void AddTutorialSceneToBuildSettings()
    {
        List<EditorBuildSettingsScene> scenes = EditorBuildSettings.scenes.ToList();
        if (scenes.All(scene => scene.path != TutorialScenePath))
        {
            scenes.Add(new EditorBuildSettingsScene(TutorialScenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();
        }
    }

    private static void SetLayerRecursively(GameObject root, int layer)
    {
        if (layer < 0)
            return;

        root.layer = layer;
        foreach (Transform child in root.transform)
            SetLayerRecursively(child.gameObject, layer);
    }

    private static void EnsureFolder(string folderPath)
    {
        string[] parts = folderPath.Split('/');
        string current = parts[0];
        for (int i = 1; i < parts.Length; i++)
        {
            string next = current + "/" + parts[i];
            if (!AssetDatabase.IsValidFolder(next))
                AssetDatabase.CreateFolder(current, parts[i]);
            current = next;
        }
    }
}
```

---

## 30. TutorialNavMeshBuilder.cs

### 30-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 30-2. 변경 설명

TutorialScene에서 Road를 전용 TutorialNavMesh 루트 아래로 정리하고 CollectObjects.Children 방식으로 도로만 수집한다. 복제된 다른 NavMeshSurface를 튜토리얼 씬에서만 비활성화하고 `Unity.AI`.Navigation.Editor의 공식 비동기 베이크 경로로 전용 에셋을 만든다.

### 30-3. 현재 스크립트 전체

```cs
using System.Linq;
using Unity.AI.Navigation;
using Unity.AI.Navigation.Editor;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;

/// <summary>
/// TutorialScene의 도로 계층만 NavMesh 베이크 대상으로 분리합니다.
/// 씬을 다시 정리하더라도 같은 메뉴를 실행하면 동일한 설정으로 재베이크할 수 있습니다.
/// </summary>
public static class TutorialNavMeshBuilder
{
    private const string TutorialScenePath = "Assets/01_Scenes/TutorialScene.unity";

    private static Scene pendingScene;
    private static NavMeshSurface pendingSurface;
    private static bool closeSceneAfterBake;

    [MenuItem("Tools/Lucid Diver/Tutorial/Bake Tutorial Road NavMesh")]
    public static void BakeTutorialRoadNavMesh()
    {
        Scene scene = SceneManager.GetSceneByPath(TutorialScenePath);
        bool openedForBake = !scene.IsValid() || !scene.isLoaded;
        if (openedForBake)
            scene = EditorSceneManager.OpenScene(TutorialScenePath, OpenSceneMode.Additive);

        Transform roadRoot = FindTransform(scene, "Road");
        Transform navigationRoot = FindTransform(scene, "TutorialNavMesh");
        if (navigationRoot == null)
        {
            GameObject navigationObject = new GameObject("TutorialNavMesh");
            SceneManager.MoveGameObjectToScene(navigationObject, scene);
            navigationRoot = navigationObject.transform;
        }

        NavMeshSurface surface = navigationRoot.GetComponent<NavMeshSurface>();
        if (surface == null)
            surface = navigationRoot.gameObject.AddComponent<NavMeshSurface>();

        if (roadRoot == null)
        {
            if (openedForBake)
                EditorSceneManager.CloseScene(scene, true);

            Debug.LogError("[TutorialNavMesh] TutorialScene에서 Road 계층을 찾지 못했습니다.");
            return;
        }

        // Surface 아래에 Road를 두고 현재 계층만 수집해 다른 씬과 공용 레이어에 영향을 주지 않습니다.
        roadRoot.SetParent(surface.transform, true);

        // 복제한 도로 프리팹에 남아 있는 개별 Surface는 중복 NavMesh를 등록하므로 이 씬에서만 비활성화합니다.
        foreach (NavMeshSurface nestedSurface in roadRoot.GetComponentsInChildren<NavMeshSurface>(true))
        {
            nestedSurface.RemoveData();
            nestedSurface.enabled = false;
            EditorUtility.SetDirty(nestedSurface);
        }

        surface.collectObjects = CollectObjects.Children;
        surface.layerMask = ~0;
        surface.useGeometry = NavMeshCollectGeometry.RenderMeshes;
        surface.defaultArea = NavMesh.GetAreaFromName("Walkable");

        EditorUtility.SetDirty(surface);
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        pendingScene = scene;
        pendingSurface = surface;
        closeSceneAfterBake = openedForBake;
        EditorApplication.update -= FinishBakeWhenAssetIsReady;
        EditorApplication.update += FinishBakeWhenAssetIsReady;

        // Inspector의 Bake 버튼과 같은 경로를 사용해 TutorialScene 전용 NavMeshData 에셋을 만듭니다.
        NavMeshAssetManager.instance.StartBakingSurfaces(new Object[] { surface });
        Debug.Log("[TutorialNavMesh] TutorialScene 도로 NavMesh 베이크를 시작했습니다.");
    }

    private static void FinishBakeWhenAssetIsReady()
    {
        if (pendingSurface == null || pendingSurface.navMeshData == null)
            return;

        string assetPath = AssetDatabase.GetAssetPath(pendingSurface.navMeshData);
        if (string.IsNullOrEmpty(assetPath))
            return;

        EditorApplication.update -= FinishBakeWhenAssetIsReady;
        EditorUtility.SetDirty(pendingSurface);
        EditorSceneManager.MarkSceneDirty(pendingScene);
        EditorSceneManager.SaveScene(pendingScene);
        AssetDatabase.SaveAssets();

        Debug.Log($"[TutorialNavMesh] TutorialScene 도로 NavMesh 베이크를 완료했습니다: {assetPath}");

        if (closeSceneAfterBake && pendingScene.IsValid() && pendingScene.isLoaded)
            EditorSceneManager.CloseScene(pendingScene, true);

        pendingSurface = null;
        pendingScene = default;
        closeSceneAfterBake = false;
    }

    private static Transform FindTransform(Scene scene, string objectName)
    {
        foreach (GameObject root in scene.GetRootGameObjects())
        {
            Transform match = root.GetComponentsInChildren<Transform>(true)
                .FirstOrDefault(candidate => candidate.name == objectName);
            if (match != null)
                return match;
        }

        return null;
    }

}
```

---

## 31. TutorialInteractionInstaller.cs

### 31-1. 이전 스크립트 전체

```cs
// 신규 파일: 이전 구현 없음
```

### 31-2. 변경 설명

하이라키의 PlayerSpawnPoint, BoxSpawnPointPool, EnemySpawnPointPool, EnemyPatrolRoutePool을 찾아 실제 위치에 이동·상호작용·공격 트리거를 생성 또는 갱신한다. EventBridge도 TutorialSystem에만 연결하며 상자 UI와 입력 맵 충돌을 피하도록 아이템 안내는 게임을 정지하지 않는다.

### 31-3. 현재 스크립트 전체

```cs
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// TutorialScene에 남겨 둔 스폰 풀 위치를 기준으로 튜토리얼 트리거와 이벤트 브리지를 배치합니다.
/// </summary>
public static class TutorialInteractionInstaller
{
    private const string TutorialScenePath = "Assets/01_Scenes/TutorialScene.unity";
    private const string TriggerPrefabPath = "Assets/03_PreFabs/Tutorial/TutorialTrigger.prefab";
    private const string CatalogPath = "Assets/Resources/Tutorial/TutorialMessageCatalog.asset";

    [MenuItem("Tools/Lucid Diver/Tutorial/Install Tutorial Interactions")]
    public static void InstallTutorialInteractions()
    {
        Scene scene = SceneManager.GetSceneByPath(TutorialScenePath);
        bool openedForInstall = !scene.IsValid() || !scene.isLoaded;
        if (openedForInstall)
            scene = EditorSceneManager.OpenScene(TutorialScenePath, OpenSceneMode.Additive);

        Transform playerSpawn = FindTransform(scene, "PlayerSpawnPoint");
        Transform boxPool = FindTransform(scene, "BoxSpawnPointPool");
        Transform enemyPool = FindTransform(scene, "EnemySpawnPointPool");
        Transform patrolPool = FindTransform(scene, "EnemyPatrolRoutePool");
        Transform tutorialSystem = FindTransform(scene, "TutorialSystem");

        Transform boxPoint = FindFirstChildPoint(boxPool, "BoxSpawnPoint");
        Transform enemyPoint = FindFirstChildPoint(enemyPool, "Spawn_");
        Transform patrolRoute = FindFirstChildPoint(patrolPool, "Route_");

        if (playerSpawn == null || boxPoint == null || enemyPoint == null || patrolRoute == null || tutorialSystem == null)
        {
            Debug.LogError("[TutorialInstaller] 필요한 플레이어/상자/에너미/순찰 루트/TutorialSystem 오브젝트를 찾지 못했습니다.");
            if (openedForInstall)
                EditorSceneManager.CloseScene(scene, true);
            return;
        }

        if (tutorialSystem.GetComponent<TutorialEventBridge>() == null)
            tutorialSystem.gameObject.AddComponent<TutorialEventBridge>();

        Transform triggerGroup = FindTransform(scene, "TutorialTriggers");
        if (triggerGroup == null)
        {
            GameObject group = new GameObject("TutorialTriggers");
            SceneManager.MoveGameObjectToScene(group, scene);
            triggerGroup = group.transform;
        }

        Vector3 playerToBox = FlatDirection(playerSpawn.position, boxPoint.position, playerSpawn.forward);
        Vector3 boxToEnemy = FlatDirection(boxPoint.position, enemyPoint.position, playerToBox);

        ConfigureTrigger(scene, triggerGroup, "Trigger_Move", "TUTORIAL_MOVE_001",
            playerSpawn.position + playerToBox * 4f, playerToBox);
        ConfigureTrigger(scene, triggerGroup, "Trigger_Interact", "TUTORIAL_INTERACT_001",
            boxPoint.position - playerToBox * 4f, playerToBox);
        ConfigureTrigger(scene, triggerGroup, "Trigger_Attack", "TUTORIAL_ATTACK_001",
            enemyPoint.position - boxToEnemy * 5f, boxToEnemy);

        ConfigureItemTutorialMessage();

        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
        AssetDatabase.SaveAssets();

        Debug.Log(
            $"[TutorialInstaller] TutorialScene 연결 완료 - Box={GetPath(boxPoint)}, " +
            $"Enemy={GetPath(enemyPoint)}, Patrol={GetPath(patrolRoute)}");

        if (openedForInstall)
            EditorSceneManager.CloseScene(scene, true);
    }

    private static void ConfigureTrigger(
        Scene scene,
        Transform parent,
        string objectName,
        string tutorialId,
        Vector3 position,
        Vector3 forward)
    {
        Transform existing = FindTransform(scene, objectName);
        GameObject triggerObject;
        if (existing != null)
        {
            triggerObject = existing.gameObject;
            triggerObject.transform.SetParent(parent, true);
        }
        else
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(TriggerPrefabPath);
            triggerObject = prefab != null
                ? (GameObject)PrefabUtility.InstantiatePrefab(prefab, parent)
                : new GameObject(objectName, typeof(BoxCollider), typeof(TutorialTrigger));
            triggerObject.name = objectName;
            if (prefab == null)
                SceneManager.MoveGameObjectToScene(triggerObject, scene);
        }

        triggerObject.transform.position = new Vector3(position.x, position.y + 1f, position.z);
        triggerObject.transform.rotation = Quaternion.LookRotation(forward, Vector3.up);

        BoxCollider collider = triggerObject.GetComponent<BoxCollider>();
        collider.isTrigger = true;
        collider.size = new Vector3(4f, 2f, 1.5f);

        TutorialTrigger trigger = triggerObject.GetComponent<TutorialTrigger>();
        SerializedObject serializedTrigger = new SerializedObject(trigger);
        serializedTrigger.FindProperty("tutorialId").stringValue = tutorialId;
        serializedTrigger.FindProperty("triggerOnce").boolValue = true;
        serializedTrigger.ApplyModifiedPropertiesWithoutUndo();
        EditorUtility.SetDirty(triggerObject);
    }

    private static void ConfigureItemTutorialMessage()
    {
        TutorialMessageCatalog catalog = AssetDatabase.LoadAssetAtPath<TutorialMessageCatalog>(CatalogPath);
        if (catalog == null)
            return;

        SerializedObject serializedCatalog = new SerializedObject(catalog);
        SerializedProperty entries = serializedCatalog.FindProperty("entries");
        for (int index = 0; index < entries.arraySize; index++)
        {
            SerializedProperty entry = entries.GetArrayElementAtIndex(index);
            if (entry.FindPropertyRelative("tutorialId").stringValue != "TUTORIAL_ITEM_001")
                continue;

            entry.FindPropertyRelative("message").stringValue =
                "상자 슬롯의 아이템을 선택하여 인벤토리로 옮겨 보세요.";
            // Chest UI가 이미 UI 입력 맵을 사용하므로 이 안내는 입력 상태와 시간을 다시 바꾸지 않습니다.
            entry.FindPropertyRelative("pauseGame").boolValue = false;
            serializedCatalog.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(catalog);
            return;
        }
    }

    private static Vector3 FlatDirection(Vector3 from, Vector3 to, Vector3 fallback)
    {
        Vector3 direction = to - from;
        direction.y = 0f;
        if (direction.sqrMagnitude < 0.001f)
            return fallback.sqrMagnitude > 0.001f ? fallback.normalized : Vector3.forward;
        return direction.normalized;
    }

    private static Transform FindFirstChildPoint(Transform root, string namePart)
    {
        return root == null
            ? null
            : root.GetComponentsInChildren<Transform>(true)
                .FirstOrDefault(candidate => candidate != root && candidate.name.Contains(namePart));
    }

    private static Transform FindTransform(Scene scene, string objectName)
    {
        foreach (GameObject root in scene.GetRootGameObjects())
        {
            Transform match = root.GetComponentsInChildren<Transform>(true)
                .FirstOrDefault(candidate => candidate.name == objectName);
            if (match != null)
                return match;
        }
        return null;
    }

    private static string GetPath(Transform transform)
    {
        string path = transform.name;
        while (transform.parent != null)
        {
            transform = transform.parent;
            path = transform.name + "/" + path;
        }
        return path;
    }
}
```

---

## 32. 최종 학습 정리

<table fit-page-width="true" header-row="true">
<tr>
<td>
학습 포인트
</td>
<td>
적용 내용
</td>
</tr>
<tr>
<td>
데이터와 실행 분리
</td>
<td>
VFXCatalog와 TutorialMessageCatalog는 설정을 보관하고 Service·Manager가 실행을 담당
</td>
</tr>
<tr>
<td>
풀 생명주기
</td>
<td>
재생, 종료 감시, 비활성화, 대기열 등록의 책임을 분리해 중복 반환 방지
</td>
</tr>
<tr>
<td>
이벤트 어댑터
</td>
<td>
GameplayVFXPresenter와 TutorialEventBridge가 게임 이벤트를 표현 계층 요청으로 변환
</td>
</tr>
<tr>
<td>
씬 격리
</td>
<td>
TutorialScene 전용 EventBridge, 프리팹, 레이어, NavMesh 에셋으로 다른 씬 영향 최소화
</td>
</tr>
<tr>
<td>
에디터 자동화
</td>
<td>
실제 하이라키를 탐색해 프리팹·트리거·NavMesh를 반복 가능하게 설치
</td>
</tr>
<tr>
<td>
비교 기준 고정
</td>
<td>
작업 직전과 완료 커밋을 명시해 이후 합쳐진 다른 작업자의 코드를 제외
</td>
</tr>
</table>

> 코드를 읽을 때는 카탈로그가 무엇을 설정하고, 서비스와 매니저가 언제 실행하며, 풀과 씬 경계에서 상태가 어떻게 정리되는지 순서대로 확인한다.
{% endraw %}
