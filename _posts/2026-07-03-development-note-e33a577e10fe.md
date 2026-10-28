---
title: "2026-07-03_box_spawn_enemy_combo_script_compare"
date: 2026-07-03 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-03\\_box\\_spawn\\_enemy\\_combo\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 3일 기준으로 진행한 작업 중, 아이템 박스 랜덤 스폰 시스템 추가와 에너미 AI 구조 분리 및 2연격 구현에 관련된 스크립트 변경 사항을 비교 정"
description: "2026-07-03\\_box\\_spawn\\_enemy\\_combo\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 3일 기준으로 진행한 작업 중, 아이템 박스 랜덤 스폰 시스템 추가와 에너미 AI 구조 분리 및 2연격 구현에 관련된 스크립트 변경 사항을 비교 정"
published: false
migration_id: "39236532580e8047aa5de33a577e10fe"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
# 2026-07-03\_box\_spawn\_enemy\_combo\_script\_compare

## 1. 문서 개요

이 문서는 2026년 7월 3일 기준으로 진행한 작업 중, 아이템 박스 랜덤 스폰 시스템 추가와 에너미 AI 구조 분리 및 2연격 구현에 관련된 스크립트 변경 사항을 비교 정리한 문서입니다.<br />문서 형식은 스크립트별로 이전 버전 전체, 변경 의도 설명, 수정된 버전 전체를 순서대로 기록하는 방식으로 맞췄습니다.<br />아이템 박스 스폰 파트는 <code>e2b29a7</code> 커밋 직전 상태를 기준으로 비교했고, 에너미 구조화 및 2연격 파트는 <code>be56d1b</code> 커밋 직전 상태를 기준으로 비교했습니다.

## 2. 스크립트별 비교

### 2.1 BoxSpawnPoint.cs

- 대상 경로: <code>Assets/02_Scripts/Manager/BoxSpawnPoint.cs</code>
- 비교 기준: <code>e2b29a7^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>BoxSpawnPoint</code>는 개별 스폰 포인트 단위의 설정을 담당합니다. 포인트 자체를 이번 게임에서 사용할지(<code>enabledForSpawn</code>)와 같은 존 안에서 상대적으로 얼마나 자주 뽑힐지(<code>pointWeight</code>)를 분리해서 관리하도록 만들었습니다. 이 구조 덕분에 레벨 디자이너는 하이라키에서 포인트를 직접 배치하고, 특정 자리만 비활성화하거나 더 잘 나오게 조절할 수 있습니다.

#### 수정된 스크립트 전체

```cs
using UnityEngine;

///<summary>
/// 박스가 실제로 생성될 수 있는 개별 스폰 위치입니다.
/// 존 내부에서 이 포인트가 선택될 확률 가중치와 사용 여부를 설정합니다.
///</summary>
[DisallowMultipleComponent]
public class BoxSpawnPoint : MonoBehaviour
{
    [SerializeField] private bool enabledForSpawn = true;      // 이 포인트를 랜덤 스폰 후보에 포함할지 여부
    [SerializeField, Min(0f)] private float pointWeight = 1f;  // 같은 존 안에서 선택될 확률 가중치

    public bool EnabledForSpawn => enabledForSpawn;
    public float PointWeight => pointWeight;
}
```

### 2.2 BoxSpawnZone.cs

- 대상 경로: <code>Assets/02_Scripts/Manager/BoxSpawnZone.cs</code>
- 비교 기준: <code>e2b29a7^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>BoxSpawnZone</code>는 존 단위 규칙을 들고 있는 설정 컴포넌트입니다. 보장 스폰 수(<code>guaranteedSpawnCount</code>)로 “이 구역은 무조건 몇 개는 나온다”를 정의하고, <code>maxSpawnCount</code>로 존별 상한을 둡니다. 그 뒤 <code>randomWeight</code>와 <code>densityMultiplier</code>를 이용해 추가 박스를 랜덤 분배할 때 어떤 존이 더 잘 뽑힐지 조절하도록 만들었고, 실제 포인트 개수보다 값이 커지는 문제는 <code>ResolveMaxSpawnCount()</code>에서 자동으로 보정합니다.

#### 수정된 스크립트 전체

```cs
using UnityEngine;

///<summary>
/// 박스 스폰 존의 규칙을 담는 컴포넌트입니다.
/// 최소 보장 수량, 최대 수량, 추가 랜덤 분배 가중치를 인스펙터에서 조절합니다.
///</summary>
[DisallowMultipleComponent]
public class BoxSpawnZone : MonoBehaviour
{
    [Header("Guaranteed Spawn")]
    [SerializeField, Min(0)] private int guaranteedSpawnCount = 0;  // 이 존에 무조건 먼저 생성할 최소 박스 수
    [SerializeField, Min(0)] private int maxSpawnCount = 0;         // 이 존에 허용할 최대 박스 수

    [Header("Random Distribution")]
    [SerializeField] private bool allowRandomSpawn = true;          // 보장 수량 이후 추가 랜덤 배치를 허용할지 여부
    [SerializeField, Min(0f)] private float randomWeight = 1f;      // 추가 배치 시 존 선택 기본 가중치
    [SerializeField, Min(0f)] private float densityMultiplier = 1f; // 존별 밀도 보정값

    [Header("Point Scan")]
    [SerializeField] private bool includeInactivePoints = false;    // 비활성화된 포인트까지 스캔할지 여부

    public int GuaranteedSpawnCount => guaranteedSpawnCount;
    public bool AllowRandomSpawn => allowRandomSpawn;
    public float RandomWeight => randomWeight;
    public float DensityMultiplier => densityMultiplier;
    public bool IncludeInactivePoints => includeInactivePoints;

    ///<summary>
    /// 존 안에 실제로 존재하는 포인트 수를 기준으로 최대 스폰 가능 개수를 보정합니다.
    /// maxSpawnCount가 0 이하라면 포인트 수 전체를 최대치로 사용합니다.
    ///</summary>
    public int ResolveMaxSpawnCount(int pointCount)
    {
        if (maxSpawnCount <= 0)
        {
            return Mathf.Max(0, pointCount);
        }

        return Mathf.Clamp(maxSpawnCount, 0, Mathf.Max(0, pointCount));
    }
}
```

### 2.3 LevelBoxSpawner.cs

- 대상 경로: <code>Assets/02_Scripts/Manager/LevelBoxSpawner.cs</code>
- 비교 기준: <code>e2b29a7^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>LevelBoxSpawner</code>는 이번 상자 랜덤 스폰 시스템의 핵심입니다. <code>BoxSpawnPointPool</code> 하위 존들을 스캔해서 런타임 데이터로 바꾸고, 먼저 각 존의 보장 수량을 채운 다음 남은 수량만 가중치 기반 랜덤으로 배분합니다. 또한 추가 스폰 수를 밀도 비율, 고정 개수, 전체 범위 랜덤 중 하나로 계산할 수 있게 분리했고, 중복 포인트 사용 방지, 이전 생성 상자 정리, 고정 시드 테스트까지 한 곳에서 처리하도록 만들었습니다.

#### 수정된 스크립트 전체

### 2.4 SpawnManager.cs

- 대상 경로: <code>Assets/02_Scripts/Manager/SpawnManager.cs</code>
- 비교 기준: <code>e2b29a7^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SpawnManager : MonoBehaviour
{
    public static SpawnManager Instance { get; private set; }

    [Header("엔티티 생성")]
    [SerializeField] private GameObject playerPrefab;
    [SerializeField] private GameObject EnemyPrefab;
    [SerializeField] private GameObject playerSpawnPool;
    [SerializeField] private GameObject enemySpawnPool;
    private List<Transform> playerSpawnPoint = new();
    private List<Transform> enemySpawnPoint = new();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }

        // 플레이어와 적 스폰지점 불러오기
        if (playerSpawnPool != null)
        {
            foreach (Transform point in playerSpawnPool.transform)
            {
                playerSpawnPoint.Add(point);
            }
        }
        if (enemySpawnPool != null)
        {
            foreach (Transform point in enemySpawnPool.transform)
            {
                enemySpawnPoint.Add(point);
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
        int spawnNum = Random.Range(0, playerSpawnPoint.Count);

        // 스폰 장소 오브젝트가 없을 경우 대비
        if (playerSpawnPoint[spawnNum] == null)
        {
            Debug.LogError("Player spawn point not found");
            return;
        }
        // 플레이어 오브젝트 생성
        Transform spawnPoint = playerSpawnPoint[spawnNum].transform;
        GameObject spawnedPlayer = Instantiate(playerPrefab, spawnPoint.position, spawnPoint.rotation);

        // 플레이어 오브젝트 세션 데이터에 등록
        GlobalRuntimeData.CountingPlayerData(spawnedPlayer);

        Debug.Log($"Player spawned at {spawnPoint.position} with ID: {spawnedPlayer.GetComponent<EntityIdentity>().entityID}");

        // 플레이어에게 세이브 데이터 넘겨주기
        if (charData != null)
        {
            if(spawnedPlayer.TryGetComponent<PlayerStatus>(out var status))
            {
                status.initialize(charData.hpMax, charData.manaMax, charData.manaRegen, charData.sprintMana, charData.sprintRecoverTime, charData.evadeMana, charData.evadeCooltime);
            }
            if(spawnedPlayer.TryGetComponent<PlayerMovement>(out var movement))
            {
                movement.initialize(charData.moveSpeed, charData.sprintSpeed, charData.sprintMana, charData.evadeSpeed, charData.evadeTime, charData.evadeMana, charData.evadeCooltime);
            }
        }

        // 플레이어 스폰 여부 이벤트
        GlobalEventBus.OnPlayerSpawned?.Invoke(spawnedPlayer);
    }

    public void SpawnEnemy()
    {
        // 적 프리팹이 연결되지 않았을 경우 대비
        if (EnemyPrefab == null)
        {
            Debug.LogError("Enemy prefab not found");
            return;
        }

        // 적 스폰 포인트가 하나도 없을 경우 대비
        if (enemySpawnPoint.Count == 0)
        {
            Debug.LogError("Enemy spawn point list is empty");
            return;
        }

        // 적 스폰 포인트 중 무작위로 하나 선정
        // 플레이어 스폰 방식과 동일한 구조로 맞춘다.
        int spawnNum = Random.Range(0, enemySpawnPoint.Count);

        // 스폰 장소 오브젝트가 없을 경우 대비
        if (enemySpawnPoint[spawnNum] == null)
        {
            Debug.LogError("Enemy spawn point not found");
            return;
        }

        // 적 오브젝트 생성
        Transform spawnPoint = enemySpawnPoint[spawnNum].transform;
        GameObject spawnedEnemy = Instantiate(EnemyPrefab, spawnPoint.position, spawnPoint.rotation);

        // 생성된 적 오브젝트를 런타임 데이터에 등록
        GlobalRuntimeData.CountingEnemyData(spawnedEnemy);
    }
}
```

#### 설명

기존 <code>SpawnManager</code>는 플레이어와 적만 생성했는데, 이번 작업에서는 레벨 상자 스폰도 같은 진입점에서 시작하도록 확장했습니다. <code>LevelBoxSpawner</code> 참조를 받아 두고 <code>SpawnBoxes()</code>를 노출함으로써, 실제 스폰 로직은 별도 전용 클래스로 분리하면서도 “게임 시작 시 무엇을 스폰할지”라는 시작 책임은 기존 매니저에 그대로 유지했습니다.

#### 수정된 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SpawnManager : MonoBehaviour
{
    public static SpawnManager Instance { get; private set; }

    [Header("엔티티 생성")]
    [SerializeField] private GameObject playerPrefab;
    [SerializeField] private GameObject EnemyPrefab;
    [SerializeField] private GameObject playerSpawnPool;
    [SerializeField] private GameObject enemySpawnPool;
    [SerializeField] private LevelBoxSpawner levelBoxSpawner;
    private List<Transform> playerSpawnPoint = new();
    private List<Transform> enemySpawnPoint = new();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }

        // 플레이어와 적 스폰지점 불러오기
        if (playerSpawnPool != null)
        {
            foreach (Transform point in playerSpawnPool.transform)
            {
                playerSpawnPoint.Add(point);
            }
        }
        if (enemySpawnPool != null)
        {
            foreach (Transform point in enemySpawnPool.transform)
            {
                enemySpawnPoint.Add(point);
            }
        }

        if (levelBoxSpawner == null)
        {
            levelBoxSpawner = GetComponent<LevelBoxSpawner>();
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
        int spawnNum = Random.Range(0, playerSpawnPoint.Count);

        // 스폰 장소 오브젝트가 없을 경우 대비
        if (playerSpawnPoint[spawnNum] == null)
        {
            Debug.LogError("Player spawn point not found");
            return;
        }
        // 플레이어 오브젝트 생성
        Transform spawnPoint = playerSpawnPoint[spawnNum].transform;
        GameObject spawnedPlayer = Instantiate(playerPrefab, spawnPoint.position, spawnPoint.rotation);

        // 플레이어 오브젝트 세션 데이터에 등록
        GlobalRuntimeData.CountingPlayerData(spawnedPlayer);

        Debug.Log($"Player spawned at {spawnPoint.position} with ID: {spawnedPlayer.GetComponent<EntityIdentity>().entityID}");

        // 플레이어에게 세이브 데이터 넘겨주기
        if (charData != null)
        {
            if(spawnedPlayer.TryGetComponent<PlayerStatus>(out var status))
            {
                status.initialize(charData.hpMax, charData.manaMax, charData.manaRegen, charData.sprintMana, charData.sprintRecoverTime, charData.evadeMana, charData.evadeCooltime);
            }
            if(spawnedPlayer.TryGetComponent<PlayerMovement>(out var movement))
            {
                movement.initialize(charData.moveSpeed, charData.sprintSpeed, charData.sprintMana, charData.evadeSpeed, charData.evadeTime, charData.evadeMana, charData.evadeCooltime);
            }
        }

        // 플레이어 스폰 여부 이벤트
        GlobalEventBus.OnPlayerSpawned?.Invoke(spawnedPlayer);
    }

    public void SpawnEnemy()
    {
        // 적 프리팹이 연결되지 않았을 경우 대비
        if (EnemyPrefab == null)
        {
            Debug.LogError("Enemy prefab not found");
            return;
        }

        // 적 스폰 포인트가 하나도 없을 경우 대비
        if (enemySpawnPoint.Count == 0)
        {
            Debug.LogError("Enemy spawn point list is empty");
            return;
        }

        // 적 스폰 포인트 중 무작위로 하나 선정
        // 플레이어 스폰 방식과 동일한 구조로 맞춘다.
        int spawnNum = Random.Range(0, enemySpawnPoint.Count);

        // 스폰 장소 오브젝트가 없을 경우 대비
        if (enemySpawnPoint[spawnNum] == null)
        {
            Debug.LogError("Enemy spawn point not found");
            return;
        }

        // 적 오브젝트 생성
        Transform spawnPoint = enemySpawnPoint[spawnNum].transform;
        GameObject spawnedEnemy = Instantiate(EnemyPrefab, spawnPoint.position, spawnPoint.rotation);

        // 생성된 적 오브젝트를 런타임 데이터에 등록
        GlobalRuntimeData.CountingEnemyData(spawnedEnemy);
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
}
```

### 2.5 GameManager.cs

- 대상 경로: <code>Assets/02_Scripts/Manager/GameManager.cs</code>
- 비교 기준: <code>e2b29a7^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
///<summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
///</summary>
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
    private readonly string playScene = "DemoScene";    //플레이 시간을 측정할 신

    // 저장 데이터 인터페이스
    private ISaveRepository saveRepo;                   // 플레이어 데이터 접근 인터페이스
    private ICharDataRepository charRepo;               // 캐릭터 데이터 접근 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        // 인터페이스 구현부 연결
        saveRepo = new LocalSaveRepository();
        charRepo = new SOCharacterRepository();
        itemRepo = new SOItemRepository();

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
        if(scene.name == playScene) //인게임 세션 신에서 실행
        {
            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            PlayerSaveData playerData = saveRepo.LoadSaveData();
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

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
            }
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
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

#### 설명

<code>GameManager</code>에서는 실제 플레이 씬이 로드된 직후 한 번만 박스를 생성하도록 연결했습니다. 플레이어 스폰, 인벤토리 복원, 적 스폰 흐름 뒤에 <code>SpawnManager.Instance.SpawnBoxes()</code>를 호출해서 이번 상자 랜덤 배치가 “게임 시작 시 1회 결정”이라는 현재 기획 의도와 맞도록 만들었습니다.

#### 수정된 스크립트 전체

```cs
///<summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
///</summary>
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
    private readonly string playScene = "DemoScene";    //플레이 시간을 측정할 신

    // 저장 데이터 인터페이스
    private ISaveRepository saveRepo;                   // 플레이어 데이터 접근 인터페이스
    private ICharDataRepository charRepo;               // 캐릭터 데이터 접근 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        // 인터페이스 구현부 연결
        saveRepo = new LocalSaveRepository();
        charRepo = new SOCharacterRepository();
        itemRepo = new SOItemRepository();

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
        if(scene.name == playScene) //인게임 세션 신에서 실행
        {
            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            PlayerSaveData playerData = saveRepo.LoadSaveData();
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

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
                SpawnManager.Instance.SpawnBoxes();
            }
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
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

### 2.6 EnemyMovement.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyMovement.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

#### 설명

기존 <code>EnemyMovement</code>는 시야 판정, 소리 조사, 추적, 공격, 데미지 판정까지 모두 한 클래스 안에 몰려 있었습니다. 수정 후에는 이 스크립트를 실제 MonoBehaviour 진입점으로 남기고, 판단은 <code>EnemyBrain</code>, 감지는 <code>EnemyPerception</code>, 소리 조사는 <code>EnemyNoiseListener</code>, 이동은 <code>EnemyLocomotion</code>, 전투는 <code>EnemyCombat</code>에 넘기도록 재구성했습니다. 또한 애니메이션 이벤트에서 들어오는 1타/2타 스윙을 <code>HandleAttackSwing()</code>으로 받아 각 타격을 분리 처리하도록 바뀌었습니다.

#### 수정된 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// 적 프리팹에 실제로 붙어 있는 호스트 스크립트입니다.
/// 기존 프리팹 연결은 유지하면서, 내부 판단/감지/이동/전투 책임을
/// 각 보조 모듈에 위임하는 진입점 역할을 맡습니다.
///</summary>
public class EnemyMovement : MonoBehaviour
{
    [Header("Enemy AI Modules")]
    [SerializeField] private EnemyBrain brain = new EnemyBrain();                   // 상위 의사결정 담당
    [SerializeField] private EnemyPerception perception = new EnemyPerception();    // 시야/청각 감지 담당
    [SerializeField] private EnemyNoiseListener noiseListener = new EnemyNoiseListener(); // 조사 상태와 소음 반응 담당
    [SerializeField] private EnemyLocomotion locomotion = new EnemyLocomotion();    // 이동, 방향 전환, 돌진 담당
    [SerializeField] private EnemyCombat combat = new EnemyCombat();                // 공격 판정과 2연격 담당

    [Header("Attack Anchor")]
    [SerializeField] private Transform attackOrigin;                                // 실제 근접 타격 거리 계산의 기준점

    [Header("Required Components")]
    private EnemyStatus myStatus;                                                   // 상태/스탯 보유 컴포넌트
    private NavMeshAgent navAgent;                                                  // 네비게이션 이동 컴포넌트

    public float SightLength => perception.SightRange;
    public float AwarenessRange => perception.AwarenessRange;
    public float HearingRange => perception.HearingRange;
    public float SightAngle => perception.SightAngle;
    public float EyeHeight => perception.EyeHeight;
    public Transform CurrentTarget => brain.CurrentTarget;

    public event Action<bool> OnWalkEvent;                                          // 걷기 애니메이션 갱신 이벤트
    public event Action OnAttackEvent;                                              // 공격 애니메이션 재생 이벤트
    public event Action OnDeathEvent;                                               // 사망 애니메이션 재생 이벤트
    public event Action<int, int> OnLookDirEvent;                                   // 방향 애니메이션 갱신 이벤트

    private void Awake()
    {
        EnsureModules();

        navAgent = GetComponent<NavMeshAgent>();
        myStatus = GetComponent<EnemyStatus>();

        if (navAgent == null || myStatus == null)
        {
            enabled = false;
            Debug.LogError("EnemyMovement: required components are missing.");
            return;
        }

        // 공격 기준점은 프리팹에서 수동 지정하지 않아도 body/HitRange를 우선 탐색합니다.
        ResolveAttackOrigin();

        brain.OnValidate();
        perception.OnValidate();
        noiseListener.OnValidate();
        locomotion.OnValidate();
        locomotion.Initialize(navAgent);
        combat.OnValidate();
    }

    private void OnValidate()
    {
        EnsureModules();

        brain.OnValidate();
        perception.OnValidate();
        noiseListener.OnValidate();
        locomotion.OnValidate();
        combat.OnValidate();

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
        GlobalEventBus.OnNoiseEmitted += HandleNoiseEmitted;
        StartCoroutine(CheckRoutine());
    }

    private void OnDisable()
    {
        if (myStatus == null)
        {
            return;
        }

        myStatus.OnLocalDeath -= Die;
        GlobalEventBus.OnNoiseEmitted -= HandleNoiseEmitted;
    }

    ///<summary>
    /// 일정 주기마다 브레인에게 "지금 무엇을 해야 하는지" 판단을 맡깁니다.
    ///</summary>
    private IEnumerator CheckRoutine()
    {
        while (myStatus.nowState != EnemyStatus.EnemyState.Dead)
        {
            brain.Tick(
                this,
                transform,
                myStatus,
                navAgent,
                perception,
                noiseListener,
                locomotion,
                combat,
                RaiseWalkEvent,
                RaiseLookDirEvent,
                RaiseAttackEvent);

            yield return brain.GetCheckDelay();
        }
    }

    ///<summary>
    /// 외부에서 발생한 소음 자극을 받아 조사 상태로 전환할지 판단합니다.
    ///</summary>
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

        if (noiseListener.TryRegisterNoise(
                perception,
                transform.position,
                stimulus,
                brain.HasTarget,
                myStatus,
                out bool interruptedChase) &&
            interruptedChase)
        {
            // 추적이 끊기는 강한 소음이면 현재 타겟을 비우고 조사로 넘깁니다.
            brain.ClearTarget();
        }
    }

    ///<summary>
    /// 적 사망 시 AI 루프를 멈추고 프레젠테이션 이벤트를 전달합니다.
    ///</summary>
    public void Die()
    {
        StopAllCoroutines();
        combat.ClearRuntimeState();
        OnDeathEvent?.Invoke();
        Destroy(gameObject, 3.0f);
    }

    ///<summary>
    /// 공격 애니메이션의 각 스윙 이벤트를 받아 해당 단계의 돌진과 피해를 실행합니다.
    ///</summary>
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

    ///<summary>
    /// 인스펙터 직렬화가 비어 있을 때 기본 모듈 인스턴스를 다시 채웁니다.
    ///</summary>
    private void EnsureModules()
    {
        brain ??= new EnemyBrain();
        perception ??= new EnemyPerception();
        noiseListener ??= new EnemyNoiseListener();
        locomotion ??= new EnemyLocomotion();
        combat ??= new EnemyCombat();
    }

    ///<summary>
    /// 공격 판정 기준점이 비어 있으면 프리팹 내부의 HitRange를 자동 탐색합니다.
    ///</summary>
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
```

### 2.7 EnemyAnimator.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyAnimator.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
using System;
using UnityEngine;

public class EnemyAnimator : MonoBehaviour
{
    // 필수 컴포넌트
    [SerializeField] private Animator animator;
    [SerializeField] private GameObject spriteObject;

    // 애니메이션 파라미터 해시
    private readonly int isWalkHash = Animator.StringToHash("isWalking");
    private readonly int isAttackHash = Animator.StringToHash("isAttack");
    private readonly int isDeadHash = Animator.StringToHash("isDead");
    private readonly int lookDirHash = Animator.StringToHash("LookDir");

    // 지역 이벤트
    public event Action OnGetAttack;

    private void Awake()
    {
        animator = GetComponent<Animator>();

        if (animator == null)
        {
            enabled = false;
            Debug.LogError("EnemyAnimator: 필수 컴포넌트가 존재하지 않습니다");
            return;
        }
    }

    /* 적 이동 애니메이션 */
    public void PlayWalk(bool isWalking)
    {
        animator.SetBool(isWalkHash, isWalking);
    }

    /* 적 공격 애니메이션 */
    public void PlayAttack()
    {
        animator.SetTrigger(isAttackHash);
    }

    /* 적 사망 애니메이션 */
    public void PlayDeath()
    {
        animator.SetTrigger(isDeadHash);
    }

    /* 적 움직임에 따른 바라보는 방향 애니메이션 */
    public void PlayLookDir(int lookDir, int lookRight)
    {
        animator.SetInteger(lookDirHash, lookDir);
        spriteObject.transform.localScale = new Vector3(lookRight, 1, 1);
    }

    /* 공격 타이밍에 플레이어가 여전히 사거리 안에 있을 때만 피해를 적용합니다 */
    public void GetAttack()
    {
        OnGetAttack?.Invoke();
    }
}
```

#### 설명

기존에는 공격 애니메이션 이벤트가 <code>GetAttack()</code> 한 번뿐이어서 단일 타격만 처리할 수 있었습니다. 수정 후에는 <code>OnAttackSwing(int)</code> 이벤트를 두고 <code>GetAttack1()</code>, <code>GetAttack2()</code>로 1타와 2타를 구분해 전달하도록 바꿨습니다. 덕분에 한 개의 공격 애니메이션 안에서도 각 팔 스윙 타이밍마다 다른 돌진 거리와 판정을 연결할 수 있게 되었고, 기존 이벤트가 남아 있어도 에러가 나지 않도록 빈 <code>GetAttack()</code>도 유지했습니다.

#### 수정된 스크립트 전체

```cs
using System;
using UnityEngine;

public class EnemyAnimator : MonoBehaviour
{
    // 필수 컴포넌트
    [SerializeField] private Animator animator;
    [SerializeField] private GameObject spriteObject;

    // 애니메이션 파라미터 해시
    private readonly int isWalkHash = Animator.StringToHash("isWalking");
    private readonly int isAttackHash = Animator.StringToHash("isAttack");
    private readonly int isDeadHash = Animator.StringToHash("isDead");
    private readonly int lookDirHash = Animator.StringToHash("LookDir");

    // 지역 이벤트
    public event Action<int> OnAttackSwing;

    private void Awake()
    {
        animator = GetComponent<Animator>();

        if (animator == null)
        {
            enabled = false;
            Debug.LogError("EnemyAnimator: 필수 컴포넌트가 존재하지 않습니다");
            return;
        }
    }

    /* 이동 애니메이션 */
    public void PlayWalk(bool isWalking)
    {
        animator.SetBool(isWalkHash, isWalking);
    }

    /* 공격 애니메이션 */
    public void PlayAttack()
    {
        animator.SetTrigger(isAttackHash);
    }

    /* 사망 애니메이션 */
    public void PlayDeath()
    {
        animator.SetTrigger(isDeadHash);
    }

    /* 적의 움직임에 따른 바라보는 방향 애니메이션 */
    public void PlayLookDir(int lookDir, int lookRight)
    {
        animator.SetInteger(lookDirHash, lookDir);
        spriteObject.transform.localScale = new Vector3(lookRight, 1, 1);
    }

    /* 첫 번째 스윙 타이밍에 호출되는 애니메이션 이벤트 */
    public void GetAttack1()
    {
        OnAttackSwing?.Invoke(0);
    }

    /* 두 번째 스윙 타이밍에 호출되는 애니메이션 이벤트 */
    public void GetAttack2()
    {
        OnAttackSwing?.Invoke(1);
    }

    /* 기존 단일 이벤트와의 충돌을 막기 위해 남겨두는 빈 메서드 */
    public void GetAttack()
    {
    }
}
```

### 2.8 EnemyPresenter.cs

- 대상 경로: <code>Assets/02_Scripts/Presenter/EnemyPresenter.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnemyPresenter : MonoBehaviour
{
    [Header("필수 컴포넌트")]
    [SerializeField] private EnemyMovement movement;     // 움직임
    [SerializeField] private EnemyAnimator animator;     // 애니메이션
    [SerializeField] private EnemyStatus status;         // 상태 관리

    private void Awake()
    {
        // 필수 컴포넌트 초기화
        movement = GetComponent<EnemyMovement>();
        animator = GetComponentInChildren<EnemyAnimator>();
        status = GetComponent<EnemyStatus>();
        if (movement == null || animator == null || status == null)
        {
            enabled = false;
            Debug.LogError("EnemyPresenter: required components are missing.");
            return;
        }
    }

    private void OnEnable()
    {
        // 이벤트 구독
        movement.OnWalkEvent += animator.PlayWalk;
        movement.OnAttackEvent += animator.PlayAttack;
        movement.OnDeathEvent += animator.PlayDeath;
        movement.OnLookDirEvent += animator.PlayLookDir;

        animator.OnGetAttack += movement.CheckAndApplyDamage;
    }

    private void OnDisable()
    {
        // 구독 해제
        movement.OnWalkEvent -= animator.PlayWalk;
        movement.OnAttackEvent -= animator.PlayAttack;
        movement.OnDeathEvent -= animator.PlayDeath;
        movement.OnLookDirEvent -= animator.PlayLookDir;

        animator.OnGetAttack -= movement.CheckAndApplyDamage;
    }
}
```

#### 설명

<code>EnemyPresenter</code>는 여전히 Movement와 Animator를 연결하는 접착 계층 역할을 맡지만, 공격 이벤트 연결 방식이 바뀌었습니다. 이전에는 애니메이터의 단일 <code>OnGetAttack</code>를 <code>CheckAndApplyDamage()</code>에 바로 연결했다면, 지금은 <code>OnAttackSwing</code>을 <code>HandleAttackSwing()</code>에 연결해서 애니메이션 이벤트가 “데미지 직접 적용”이 아니라 “몇 번째 스윙인지 통지”만 하도록 바뀌었습니다.

#### 수정된 스크립트 전체

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnemyPresenter : MonoBehaviour
{
    [Header("필수 컴포넌트")]
    [SerializeField] private EnemyMovement movement;     // 움직임
    [SerializeField] private EnemyAnimator animator;     // 애니메이션
    [SerializeField] private EnemyStatus status;         // 상태 관리

    private void Awake()
    {
        // 필수 컴포넌트 초기화
        movement = GetComponent<EnemyMovement>();
        animator = GetComponentInChildren<EnemyAnimator>();
        status = GetComponent<EnemyStatus>();
        if (movement == null || animator == null || status == null)
        {
            enabled = false;
            Debug.LogError("EnemyPresenter: required components are missing.");
            return;
        }
    }

    private void OnEnable()
    {
        // 이벤트 구독
        movement.OnWalkEvent += animator.PlayWalk;
        movement.OnAttackEvent += animator.PlayAttack;
        movement.OnDeathEvent += animator.PlayDeath;
        movement.OnLookDirEvent += animator.PlayLookDir;

        animator.OnAttackSwing += movement.HandleAttackSwing;
    }

    private void OnDisable()
    {
        // 구독 해제
        movement.OnWalkEvent -= animator.PlayWalk;
        movement.OnAttackEvent -= animator.PlayAttack;
        movement.OnDeathEvent -= animator.PlayDeath;
        movement.OnLookDirEvent -= animator.PlayLookDir;

        animator.OnAttackSwing -= movement.HandleAttackSwing;
    }
}
```

### 2.9 EnemyBrain.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyBrain.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>EnemyBrain</code>은 상위 의사결정 전용 모듈입니다. 현재 타겟을 유지할지, 새 타겟을 볼지, 소리 조사로 넘어갈지, 추적할지, 공격을 시작할지를 한 곳에서 판단합니다. 즉 “무엇을 할지”를 정하는 계층을 따로 빼서, 나중에 순찰이나 루시드 낙인 같은 상태가 추가되더라도 의사결정만 확장할 수 있는 기반을 만든 것입니다.

#### 수정된 스크립트 전체

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// 적 AI의 상위 의사결정 계층입니다.
/// 감지 결과와 현재 상태를 바탕으로 대기, 조사, 추적, 공격 중 무엇을 할지 결정합니다.
///</summary>
[Serializable]
public class EnemyBrain
{
    [SerializeField] private float checkInterval = 0.2f;     // AI 판단 주기

    [NonSerialized] private WaitForSeconds checkingDelay;     // 판단 루프 재사용용 대기 객체
    [NonSerialized] private Transform currentTarget;          // 현재 추적 중인 플레이어

    public Transform CurrentTarget => currentTarget;
    public bool HasTarget => currentTarget != null;

    public void OnValidate()
    {
        checkInterval = Mathf.Max(0.05f, checkInterval);
        checkingDelay = new WaitForSeconds(checkInterval);
    }

    ///<summary>
    /// 판단 루프에서 재사용할 WaitForSeconds를 반환합니다.
    ///</summary>
    public WaitForSeconds GetCheckDelay()
    {
        if (checkingDelay == null)
        {
            checkingDelay = new WaitForSeconds(checkInterval);
        }

        return checkingDelay;
    }

    ///<summary>
    /// 현재 추적 대상을 강제로 비웁니다.
    ///</summary>
    public void ClearTarget()
    {
        currentTarget = null;
    }

    ///<summary>
    /// 현재 감지 결과를 바탕으로 적의 다음 행동을 결정합니다.
    ///</summary>
    public void Tick(
        MonoBehaviour host, // 코루틴을 실행할 MonoBehaviour
        Transform self, // 적 자신의 Transform
        EnemyStatus status, // 적의 상태 정보
        NavMeshAgent agent, // 적의 NavMeshAgent
        EnemyPerception perception, // 적의 시야 감지
        EnemyNoiseListener noiseListener, // 적의 소리 감지
        EnemyLocomotion locomotion, // 적의 이동 처리
        EnemyCombat combat, // 적의 전투 처리
        Action<bool> onWalkEvent, // 이동 시작/종료 이벤트
        Action<int, int> onLookDirEvent, // 시선 방향 변경 이벤트
        Action onAttackEvent) // 공격 시작 이벤트
    {
        RefreshTarget(self, perception, noiseListener, GlobalRuntimeData.GetPlayerList().Values);

        if (currentTarget == null)
        {
            if (noiseListener.Investigate(self, agent, locomotion, status, onWalkEvent, onLookDirEvent))
            {
                return;
            }

            locomotion.SetIdle(agent, status, onWalkEvent);
            return;
        }

        // 플레이어를 다시 확보했으면 조사 상태는 종료합니다.
        noiseListener.Clear();

        if (status.isAttacking)
        {
            return;
        }

        float sqrDistToTarget = EnemyMathUtility.GetPlanarSqrDistance(self.position, currentTarget.position);
        if (combat.CanStartAttack(sqrDistToTarget))
        {
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
            locomotion.MoveTo(
                self,
                agent,
                currentTarget.position,
                status,
                EnemyStatus.EnemyState.Chase,
                onWalkEvent,
                onLookDirEvent);
            return;
        }

        currentTarget = null;
        locomotion.SetIdle(agent, status, onWalkEvent);
    }

    ///<summary>
    /// 기존 타겟을 유지할 수 있는지 확인하고, 아니면 새로 시야 내 대상을 찾습니다.
    ///</summary>
    private void RefreshTarget(
        Transform self,
        EnemyPerception perception,
        EnemyNoiseListener noiseListener,
        ICollection<GameObject> players)
    {
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
            noiseListener.Clear();
        }
    }
}
```

### 2.10 EnemyPerception.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyPerception.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>EnemyPerception</code>은 시야와 청각 계산을 담당합니다. 시야 거리, 어그로 유지 거리, 청각 범위, 시야각, 레이캐스트 기반 가림 판정까지 모두 이쪽으로 분리했습니다. 덕분에 브레인은 순수하게 판단만 하고, 감지 규칙이 바뀌더라도 이동/전투 코드와 섞이지 않게 되었습니다.

#### 수정된 스크립트 전체

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 적의 감지 능력을 담당하는 모듈입니다.
/// 시야 범위, 인지 유지 범위, 청각 범위를 각각 분리해 관리합니다.
///</summary>
[Serializable]
public class EnemyPerception
{
    [SerializeField] private float sightRange = 10.0f;       // 최초 발견이 가능한 시야 거리
    [SerializeField] private float awarenessRange = 20.0f;   // 한 번 인지한 뒤 놓치지 않는 유지 거리
    [SerializeField] private float hearingRange = 40.0f;     // 들을 수 있는 최대 거리
    [SerializeField] private float sightAngle = 120.0f;      // 시야각
    [SerializeField] private float eyeHeight = 1.4f;         // 레이캐스트 시선 높이

    [NonSerialized] private float sightRangeSqr;             // 시야 거리 제곱값 캐시
    [NonSerialized] private float awarenessRangeSqr;         // 인지 유지 거리 제곱값 캐시
    [NonSerialized] private float hearingRangeSqr;           // 청각 거리 제곱값 캐시
    [NonSerialized] private float halfSightAngle;            // 반 시야각 캐시

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

        sightRangeSqr = sightRange * sightRange;
        awarenessRangeSqr = awarenessRange * awarenessRange;
        hearingRangeSqr = hearingRange * hearingRange;
        halfSightAngle = sightAngle * 0.5f;
    }

    ///<summary>
    /// 현재 시야에 들어온 플레이어 중 가장 가까운 대상을 반환합니다.
    ///</summary>
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

    ///<summary>
    /// 이미 인지한 대상을 아직 놓치지 않았는지 거리 기준으로 확인합니다.
    ///</summary>
    public bool CanKeepAwareness(Vector3 selfPosition, Transform target)
    {
        if (target == null)
        {
            return false;
        }

        return EnemyMathUtility.GetPlanarSqrDistance(selfPosition, target.position) <= awarenessRangeSqr;
    }

    ///<summary>
    /// 전달된 소음 자극이 청각 범위 안에 들어오는지 확인합니다.
    ///</summary>
    public bool CanHear(Vector3 selfPosition, NoiseStimulus stimulus)
    {
        float effectiveRadius = Mathf.Min(hearingRange, Mathf.Max(0.0f, stimulus.Radius));
        if (effectiveRadius <= 0.0f)
        {
            return false;
        }

        float sqrDistance = EnemyMathUtility.GetPlanarSqrDistance(selfPosition, stimulus.Position);
        return sqrDistance <= hearingRangeSqr && sqrDistance <= effectiveRadius * effectiveRadius;
    }

    ///<summary>
    /// 시야각과 레이캐스트 차폐를 함께 검사해 실제로 보이는 대상인지 판정합니다.
    ///</summary>
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
}
```

### 2.11 EnemyNoiseListener.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyNoiseListener.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>EnemyNoiseListener</code>는 소리 조사 상태의 런타임 데이터를 보관하고 처리하는 모듈입니다. 마지막으로 들은 위치, 조사 종료 시간, 우선순위, 추적 차단 가능 여부를 기억하고, 필요하면 추적을 끊고 조사 상태로 넘어가게 만듭니다. 기존 <code>EnemyMovement</code> 안에 섞여 있던 노이즈 조사 흐름을 별도 클래스로 떼어낸 셈입니다.

#### 수정된 스크립트 전체

```cs
using System;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// 소음 자극을 조사 상태로 변환하는 모듈입니다.
/// 마지막으로 들은 위치와 조사 유지 시간을 기억하고, 필요하면 추적을 끊고 조사로 전환합니다.
///</summary>
[Serializable]
public class EnemyNoiseListener
{
    [SerializeField] private float investigateStopDistance = 1.0f;           // 조사 지점에 도착했다고 보는 거리
    [SerializeField] private float investigateDuration = 2.0f;               // 도착 후 주변을 살피는 시간
    [SerializeField] private float investigateNavMeshSampleDistance = 2.5f;  // 유효한 NavMesh 위치 보정 반경

    [NonSerialized] private float investigateStopDistanceSqr;                // 도착 판정용 제곱 거리
    [NonSerialized] private bool hasInvestigateTarget;                       // 현재 조사 대상이 있는지 여부
    [NonSerialized] private bool hasReachedInvestigatePoint;                 // 조사 위치까지 도착했는지 여부
    [NonSerialized] private Vector3 investigateTargetPosition;               // 조사할 월드 좌표
    [NonSerialized] private Transform investigateTargetAnchor;               // 움직이는 소음 기준점이 있으면 그 Transform
    [NonSerialized] private float investigateSearchEndTime;                  // 조사 종료 시각
    [NonSerialized] private float forcedInvestigationUntilTime;              // 강제 조사 유지 시각
    [NonSerialized] private int currentInvestigatePriority = -1;             // 현재 조사 대상 우선순위

    public void OnValidate()
    {
        investigateStopDistance = Mathf.Max(0.1f, investigateStopDistance);
        investigateDuration = Mathf.Max(0.1f, investigateDuration);
        investigateNavMeshSampleDistance = Mathf.Max(0.5f, investigateNavMeshSampleDistance);
        investigateStopDistanceSqr = investigateStopDistance * investigateStopDistance;
    }

    ///<summary>
    /// 강한 소음에 반응한 직후에는 즉시 다시 시야 타겟을 잡지 않도록 잠시 막아 둡니다.
    ///</summary>
    public bool ShouldBlockSightReacquire()
    {
        return hasInvestigateTarget && Time.time < forcedInvestigationUntilTime;
    }

    ///<summary>
    /// 새 소음 자극을 등록하고, 필요하면 현재 추적을 끊고 조사 상태로 전환합니다.
    ///</summary>
    public bool TryRegisterNoise(
        EnemyPerception perception,
        Vector3 selfPosition,
        NoiseStimulus stimulus,
        bool hasChaseTarget,
        EnemyStatus status,
        out bool interruptedChase)
    {
        interruptedChase = false;

        if (!perception.CanHear(selfPosition, stimulus))
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
        currentInvestigatePriority = stimulus.Priority;
        return true;
    }

    ///<summary>
    /// 등록된 소음 위치로 이동하고, 도착 후에는 짧게 조사 상태를 유지합니다.
    ///</summary>
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

    ///<summary>
    /// 현재 조사 상태를 모두 초기화합니다.
    ///</summary>
    public void Clear()
    {
        hasInvestigateTarget = false;
        hasReachedInvestigatePoint = false;
        investigateTargetPosition = Vector3.zero;
        investigateTargetAnchor = null;
        investigateSearchEndTime = 0.0f;
        forcedInvestigationUntilTime = 0.0f;
        currentInvestigatePriority = -1;
    }

    ///<summary>
    /// 움직이는 기준점이 있으면 최신 위치를 따라가고, NavMesh 위의 유효한 좌표로 보정합니다.
    ///</summary>
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

### 2.12 EnemyLocomotion.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyLocomotion.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>EnemyLocomotion</code>은 실제 이동과 방향 전환을 전담합니다. 추적 이동, 정지, 대기 복귀, 목표 바라보기, 2타 직전 제한 회전, 짧은 돌진(<code>PerformLunge</code>)까지 모두 이 모듈로 모았습니다. 이렇게 분리해 두면 나중에 돌진 이동을 다른 패턴 공격에서도 재사용할 수 있고, 이동 방식만 따로 튜닝하기도 쉬워집니다.

#### 수정된 스크립트 전체

```cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

///<summary>
/// 적의 실제 몸 움직임을 담당하는 모듈입니다.
/// 일반 이동, 정지, 방향 전환, 공격 중 짧은 돌진을 여기서 처리합니다.
///</summary>
[Serializable]
public class EnemyLocomotion
{
    [SerializeField] private float moveSpeed = 3.0f;     // 기본 추적 이동 속도

    public void OnValidate()
    {
        moveSpeed = Mathf.Max(0.1f, moveSpeed);
    }

    ///<summary>
    /// NavMeshAgent 초기 속도를 설정합니다.
    ///</summary>
    public void Initialize(NavMeshAgent agent)
    {
        if (agent != null)
        {
            agent.speed = moveSpeed;
        }
    }

    ///<summary>
    /// 목적지를 향해 이동시키고, 걷기/방향 애니메이션 이벤트를 갱신합니다.
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
    /// 현재 이동을 즉시 멈추고 애니메이션도 정지 상태로 전환합니다.
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
    /// 이동과 공격 상태를 모두 풀고 대기 상태로 돌립니다.
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
    /// 2타 직전에는 목표를 완전히 꺾지 않고, 지정된 각도까지만 보정합니다.
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
    /// 공격 연출용 짧은 전진 돌진을 수행하고, 끝난 뒤 NavMeshAgent 위치를 동기화합니다.
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
    /// 현재 회전값을 기존 애니메이터가 쓰는 lookDir/lookRight 값으로 변환합니다.
    ///</summary>
    private void UpdateLookDirection(Transform self, Action<int, int> onLookDirEvent)
    {
        int lookUp = self.rotation.y > 0.0f ? 0 : 1;
        int lookRight = Mathf.Abs(self.rotation.y) < 0.5f ? -1 : 1;
        onLookDirEvent?.Invoke(lookUp, lookRight);
    }
}
```

### 2.13 EnemyCombat.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyCombat.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>EnemyCombat</code>은 이번 2연격 기반을 만드는 핵심 모듈입니다. 공격 시작 가능 거리, 공격 쿨다운, 선딜, 애니메이션 전체 길이, 회복 시간, 1타/2타별 돌진 거리와 시간, 1타/2타별 데미지를 전부 이곳에서 관리합니다. <code>RunCombo()</code>는 공격 애니메이션을 한 번 재생하고, 실제 타격은 애니메이션 이벤트로 들어온 <code>ExecuteSwing()</code>이 처리하기 때문에 “애니메이션 1회 + 스윙 2회” 구조를 자연스럽게 만들 수 있습니다.

#### 수정된 스크립트 전체

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

        IDamageable damageable = target.GetComponentInParent<IDamageable>();
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

### 2.14 EnemyMathUtility.cs

- 대상 경로: <code>Assets/02_Scripts/System/Enemy/EnemyMathUtility.cs</code>
- 비교 기준: <code>be56d1b^</code> -> <code>HEAD</code>

#### 이전 스크립트 전체

```cs
이 파일은 이번 작업에서 새로 추가되어 이전 스크립트가 없습니다.
```

#### 설명

<code>EnemyMathUtility</code>는 여러 모듈에서 반복하던 평면 거리 계산을 공용 함수로 뺀 유틸리티입니다. Y축 차이를 무시한 거리/방향 계산을 한 곳에 두어서 코드 중복을 줄이고, 추적 거리 판정이나 타격 거리 판정의 기준이 서로 어긋나지 않게 정리했습니다.

#### 수정된 스크립트 전체

```cs
using UnityEngine;

///<summary>
/// 적 AI 모듈에서 공통으로 쓰는 평면 계산 유틸리티입니다.
/// Y축 높이 차이를 제외한 거리/방향 계산을 단순화합니다.
///</summary>
public static class EnemyMathUtility
{
    ///<summary>
    /// Y축을 제외한 평면 거리의 제곱값을 반환합니다.
    ///</summary>
    public static float GetPlanarSqrDistance(Vector3 from, Vector3 to)
    {
        Vector3 delta = to - from;
        delta.y = 0.0f;
        return delta.sqrMagnitude;
    }

    ///<summary>
    /// Y축을 제외한 평면 방향 벡터를 반환합니다.
    ///</summary>
    public static Vector3 GetFlatDirection(Vector3 from, Vector3 to)
    {
        Vector3 direction = to - from;
        direction.y = 0.0f;
        return direction;
    }
}
```
{% endraw %}
