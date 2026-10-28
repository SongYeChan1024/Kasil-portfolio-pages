---
title: "2026-07-21_SpawnManager_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/Manager/GameSystem/SpawnManager.cs cs using System; using System.Collections.Generic; using UnityEngine; using U"
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/Manager/GameSystem/SpawnManager.cs cs using System; using System.Collections.Generic; using UnityEngine; using U"
published: false
migration_id: "3a436532580e8120afd2e8e1e8276eaf"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/Manager/GameSystem/SpawnManager.cs</code>

```cs
using System;
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
    private void CollectPlayerSpawnPoints(bool forceRefresh = false)
    {
        playerSpawnPoint.Clear();
        if (forceRefresh)
        {
            playerSpawnPool = null;
        }

        if (playerSpawnPool == null || !playerSpawnPool.activeInHierarchy)
        {
            // LevelDesignTable에 추가한 풀을 태그로 찾아옴
            playerSpawnPool = FindSpawnPoolWithChildren("PlayerSpawnPool");
            if (playerSpawnPool == null)  return;
```

```cs
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
/// 같은 태그의 스폰 풀이 여러 씬에 동시에 존재할 수 있으므로,
/// 실제 자식 스폰 포인트를 가진 활성 풀을 우선 선택합니다.
/// </summary>
private static GameObject FindSpawnPoolWithChildren(string tag)
{
    GameObject[] candidates = GameObject.FindGameObjectsWithTag(tag);
    for (int i = 0; i < candidates.Length; i++)
    {
        GameObject candidate = candidates[i];
        if (candidate != null && candidate.activeInHierarchy && candidate.transform.childCount > 0)
        {
            return candidate;
        }
    }

    return candidates.Length > 0 ? candidates[0] : null;
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
```

```cs
            legacyEnemySpawnPoints.Add(child);
        }
    }
}

public void SpawnPlayer(CharacterData charData)
{
    // Additive 씬을 동시에 로드하면 SpawnManager.Awake()가 레벨 씬의 PlayerSpawnPointPool보다 먼저 실행될 수 있습니다.
    // 실제 플레이어 생성 직전에 기존 캐시를 버리고 다시 수집해서 튜토리얼/인게임 레벨 씬의 스폰 포인트를 안정적으로 참조합니다.
    CollectPlayerSpawnPoints(true);

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
    Vector3 spawnPosition = spawnPoint.position;
    Quaternion spawnRotation = spawnPoint.rotation;
    GameObject spawnedPlayer = Instantiate(playerPrefab, spawnPosition, spawnRotation);

    // 스폰된 오브젝트를 게임 신에 배치 (LoadScene 언로드 방어)
    SceneManager.MoveGameObjectToScene(spawnedPlayer, gameObject.scene);

    // 씬 이동/리지드바디 초기화 과정에서 위치가 원점으로 되돌아가는 상황을 방지하기 위해 생성 좌표를 한 번 더 확정합니다.
    spawnedPlayer.transform.SetPositionAndRotation(spawnPosition, spawnRotation);
    if (spawnedPlayer.TryGetComponent(out Rigidbody spawnedRigidbody))
    {
        spawnedRigidbody.position = spawnPosition;
        spawnedRigidbody.rotation = spawnRotation;
        spawnedRigidbody.velocity = Vector3.zero;
        spawnedRigidbody.angularVelocity = Vector3.zero;
    }

    // 플레이어 오브젝트 세션 데이터에 등록
    GlobalRuntimeData.CountingPlayerData(spawnedPlayer);
```

```cs

    Debug.Log($"Player spawned at {spawnPosition} from {spawnPoint.name} / actual: {spawnedPlayer.transform.position} with ID: {spawnedPlayer.GetComponent<EntityIdentity>().entityID}");

    // 플레이어에게 세이브 데이터 넘겨주기
    if (charData != null)
    {
        if (spawnedPlayer.TryGetComponent<PlayerStatus>(out var status))
        {
            status.initialize(charData);
        }

        if (spawnedPlayer.TryGetComponent<PlayerMovement>(out var movement))
        {
            movement.initialize(charData);
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
```

```cs
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
```

```cs
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
```

```cs
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
```

```cs
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

```

```cs
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

## 2. 변경 설명

씬별 에너미 처치 상자 사용 여부, 전용 프리팹, 드롭 확률, NavMesh 보정 거리를 인스펙터 값으로 추가했습니다. 스폰된 각 에너미의 <code>OnLocalDeath</code>를 한 번만 구독하고 확률 판정을 통과하면 사망 위치를 NavMesh 지면에 보정한 뒤 같은 씬에 전용 상자를 생성합니다. 전역 사망 이벤트 대신 개체 로컬 이벤트를 사용해 위치 혼선과 중복 드롭을 방지합니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/Manager/GameSystem/SpawnManager.cs</code>

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
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

    [Header("에너미 처치 상자 드롭")]
    [SerializeField] private bool enableEnemyBoxDrop = true;                          // 현재 씬에서 에너미 처치 상자를 사용할지 여부
    [SerializeField] private GameObject enemyBoxPrefab;                               // 에너미가 처치됐을 때 생성할 전용 상자 프리팹
    [SerializeField, Range(0.0f, 1.0f)] private float enemyBoxDropChance = 0.2f;       // 에너미 한 마리당 상자 생성 확률
    [SerializeField, Min(0.0f)] private float enemyBoxNavMeshSampleDistance = 2.0f;    // 사망 위치를 이동 가능한 지면으로 보정할 탐색 거리

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
```

```cs
/// 플레이어는 기존 구조를 유지하므로 단순히 자식 Transform만 읽어 옵니다.
/// </summary>
private void CollectPlayerSpawnPoints(bool forceRefresh = false)
{
    playerSpawnPoint.Clear();
    if (forceRefresh)
    {
        playerSpawnPool = null;
    }

    if (playerSpawnPool == null || !playerSpawnPool.activeInHierarchy)
    {
        // LevelDesignTable에 추가한 풀을 태그로 찾아옴
        playerSpawnPool = FindSpawnPoolWithChildren("PlayerSpawnPool");
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
/// 같은 태그의 스폰 풀이 여러 씬에 동시에 존재할 수 있으므로,
/// 실제 자식 스폰 포인트를 가진 활성 풀을 우선 선택합니다.
/// </summary>
private static GameObject FindSpawnPoolWithChildren(string tag)
{
    GameObject[] candidates = GameObject.FindGameObjectsWithTag(tag);
    for (int i = 0; i < candidates.Length; i++)
    {
        GameObject candidate = candidates[i];
        if (candidate != null && candidate.activeInHierarchy && candidate.transform.childCount > 0)
        {
            return candidate;
        }
    }

    return candidates.Length > 0 ? candidates[0] : null;
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
```

```cs
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
    // Additive 씬을 동시에 로드하면 SpawnManager.Awake()가 레벨 씬의 PlayerSpawnPointPool보다 먼저 실행될 수 있습니다.
    // 실제 플레이어 생성 직전에 기존 캐시를 버리고 다시 수집해서 튜토리얼/인게임 레벨 씬의 스폰 포인트를 안정적으로 참조합니다.
    CollectPlayerSpawnPoints(true);

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
    Vector3 spawnPosition = spawnPoint.position;
    Quaternion spawnRotation = spawnPoint.rotation;
    GameObject spawnedPlayer = Instantiate(playerPrefab, spawnPosition, spawnRotation);

    // 스폰된 오브젝트를 게임 신에 배치 (LoadScene 언로드 방어)
    SceneManager.MoveGameObjectToScene(spawnedPlayer, gameObject.scene);

    // 씬 이동/리지드바디 초기화 과정에서 위치가 원점으로 되돌아가는 상황을 방지하기 위해 생성 좌표를 한 번 더 확정합니다.
```

```cs
    spawnedPlayer.transform.SetPositionAndRotation(spawnPosition, spawnRotation);
    if (spawnedPlayer.TryGetComponent(out Rigidbody spawnedRigidbody))
    {
        spawnedRigidbody.position = spawnPosition;
        spawnedRigidbody.rotation = spawnRotation;
        spawnedRigidbody.velocity = Vector3.zero;
        spawnedRigidbody.angularVelocity = Vector3.zero;
    }

    // 플레이어 오브젝트 세션 데이터에 등록
    GlobalRuntimeData.CountingPlayerData(spawnedPlayer);

    Debug.Log($"Player spawned at {spawnPosition} from {spawnPoint.name} / actual: {spawnedPlayer.transform.position} with ID: {spawnedPlayer.GetComponent<EntityIdentity>().entityID}");

    // 플레이어에게 세이브 데이터 넘겨주기
    if (charData != null)
    {
        if (spawnedPlayer.TryGetComponent<PlayerStatus>(out var status))
        {
            status.initialize(charData);
        }

        if (spawnedPlayer.TryGetComponent<PlayerMovement>(out var movement))
        {
            movement.initialize(charData);
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

```

```cs
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
```

```cs
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
```

```cs
    AssignEnemyRuntimeIdentity(spawnedEnemy);

    // 이 씬에서 에너미 상자 드롭을 사용하는 경우 해당 개체의 로컬 사망 이벤트에 1회 처리기를 연결합니다.
    RegisterEnemyBoxDrop(spawnedEnemy);

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
/// 스폰된 적의 로컬 사망 이벤트에 현재 씬 전용 상자 드롭 처리를 연결합니다.
/// 전역 사망 이벤트를 사용하지 않아 다른 적의 위치나 중복 구독과 섞이지 않게 합니다.
/// </summary>
private void RegisterEnemyBoxDrop(GameObject spawnedEnemy)
{
    if (!enableEnemyBoxDrop || enemyBoxPrefab == null || spawnedEnemy == null)
        return;

    if (!spawnedEnemy.TryGetComponent(out EnemyStatus enemyStatus))
        return;

    bool dropResolved = false;
    Transform enemyTransform = spawnedEnemy.transform;
    Scene enemyScene = spawnedEnemy.scene;

    enemyStatus.OnLocalDeath += () =>
    {
        if (dropResolved)
            return;

        dropResolved = true;
        float dropChance = Mathf.Clamp01(enemyBoxDropChance);

```

```cs
        if (dropChance <= 0.0f || UnityEngine.Random.value >= dropChance)
            return;

        // Destroy는 프레임 종료 시 적용되므로 로컬 사망 이벤트 안에서 마지막 위치를 안전하게 읽을 수 있습니다.
        if (enemyTransform == null)
            return;

        SpawnEnemyBox(enemyTransform.position, enemyScene);
    };
}

/// <summary>
/// 에너미 사망 위치를 NavMesh 지면에 보정한 뒤 전용 상자를 같은 씬에 생성합니다.
/// </summary>
private void SpawnEnemyBox(Vector3 deathPosition, Scene enemyScene)
{
    Vector3 spawnPosition = deathPosition;
    float sampleDistance = Mathf.Max(0.0f, enemyBoxNavMeshSampleDistance);

    if (sampleDistance > 0.0f &&
        NavMesh.SamplePosition(deathPosition, out NavMeshHit navHit, sampleDistance, NavMesh.AllAreas))
    {
        spawnPosition = navHit.position;
    }

    GameObject spawnedBox = Instantiate(enemyBoxPrefab, spawnPosition, Quaternion.identity);

    if (enemyScene.IsValid() && enemyScene.isLoaded)
    {
        SceneManager.MoveGameObjectToScene(spawnedBox, enemyScene);
    }
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
```

```cs
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
```

```cs
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
{% endraw %}
