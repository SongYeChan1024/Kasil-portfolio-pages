---
title: "2026-07-20_VFXService_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/System/VFX/VFXService.cs cs using System.Collections.Generic; using System.Threading.Tasks; using UnityEngine; "
description: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/System/VFX/VFXService.cs cs using System.Collections.Generic; using System.Threading.Tasks; using UnityEngine; "
published: true
migration_id: "3a336532580e811983aed4e00a52fd2f"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2f085c3^</code>
- 파일: <code>Assets/02_Scripts/System/VFX/VFXService.cs</code>

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
```

```cs
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
```

```cs
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
```

```cs
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

## 2. 변경 설명

VFX 반환 요청이 같은 프레임에 중복 처리되지 않도록 예약 Set을 추가했습니다. OnDisable 도중 직접 계층을 바꾸지 않고 LateUpdate에서 안전하게 부모와 풀 상태를 복원하여 활성화/비활성화 경고와 중복 큐 문제를 방지했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>2f085c3</code>
- 파일: <code>Assets/02_Scripts/System/VFX/VFXService.cs</code>

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
```

```cs
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
```

```cs
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
```

```cs
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

    private void LateUpdate()
    {
        if (isShuttingDown)
            return;

        // OnDisable 처리 중에는 계층을 바꾸지 않고, 활성화 전환이 끝난 뒤 안전하게 풀 루트로 복원합니다.
        foreach (VFXRuntimePool pool in pools.Values)
            pool.ProcessPendingReturns();
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
{% endraw %}
