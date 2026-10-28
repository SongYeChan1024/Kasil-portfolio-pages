---
title: "2026-07-22_GameManager_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Manager/GameManager.cs cs /// /// 인게임 전반의 시스템을 관리하는 인스턴스 클래스 /// using UnityEngine; using UnityEngine.SceneManag"
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Manager/GameManager.cs cs /// /// 인게임 전반의 시스템을 관리하는 인스턴스 클래스 /// using UnityEngine; using UnityEngine.SceneManag"
published: true
migration_id: "3a536532580e81dea61dd7db94a9f747"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/Manager/GameManager.cs</code>

```cs
/// <summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
/// </summary>
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
    private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol", "DemoScene Additive", "DemoScene Tutorial" }; //인게임 세션으로 취급할 씬 목록

    // 저장 데이터 인터페이스
    private ICharDataRepository charRepo;               // 캐릭터 데이터 접근 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        // 인터페이스 구현부 연결
        charRepo = new SOCharacterRepository();
        itemRepo = new LocalJsonItemRepository();

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
        if(IsPlayScene(scene.name)) //인게임 세션 신에서 실행
        {
            EnsureRepositories();

            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            PlayerSaveDataSO saveDataSO = PlayerSaveDataSO.Instance;
            if (saveDataSO == null)
            {
                Debug.LogError("[GameManager] PlayerSaveDataSO를 찾지 못해 세션 초기화를 중단합니다.", this);
                return;
            }

            PlayerSaveData playerData = saveDataSO.LoadSaveData();
            if (playerData == null)
            {
                Debug.LogError("[GameManager] 플레이어 세이브 데이터를 불러오지 못해 세션 초기화를 중단합니다.", this);
                return;
            }

            _playerSaveData = playerData;
            CharacterData charData = charRepo.GetCharacterData(playerData.SelectCharID);
            if (charData == null)
            {
                Debug.LogError($"[GameManager] 선택된 캐릭터 데이터를 찾지 못해 플레이어를 스폰할 수 없습니다. TID={playerData.SelectCharID}", this);
                return;
            }

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

            PlayerArtifactEquipment artifactEquipment = FindObjectOfType<PlayerArtifactEquipment>();
            if (artifactEquipment != null)
            {
                artifactEquipment.RestoreFromSave(playerData, itemRepo);
                // 장착 중인 아티팩트를 시작 소지량에 합산하여 인벤토리 이동 시 새로 획득한 것으로 처리되는 것을 방지
                SessionDataSO.Instance.AddStartingArtifacts(artifactEquipment.equippedArtifacts);
            }

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
                SpawnManager.Instance.SpawnBoxes();
            }

            // 인게임 진입 시 조작 맵을 Player로 전환
            GlobalEventBus.OnSwitchInputMap?.Invoke("Player");

            UIManager.Instance.Open<GamePlayUI>();
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
    }

    private void EnsureRepositories()
    {
        charRepo ??= new SOCharacterRepository();
        itemRepo ??= new LocalJsonItemRepository();
    }

    /// <summary>
    /// 현재 로드된 씬이 인게임 세션 대상인지 판정합니다.
    /// 데모 씬과 패트롤 테스트 씬을 모두 같은 플레이 씬으로 취급하기 위한 보조 함수입니다.
    /// </summary>
    private bool IsPlayScene(string sceneName)
    {
        for (int i = 0; i < playScenes.Length; i++)
        {
            if (sceneName == playScenes[i])
            {
                return true;
            }
        }

        return false;
    }

    private void ResultTime(bool _extractionResult)
    {
        // 사망 후 후속 피격 등으로 종료 이벤트가 중복 발생해도 최초 플레이타임만 사용합니다.
        if (!timeTrack)
            return;

        //시간 기록을 중단하고 기록 고정
        timeTrack = false;
        //결과 계산 시작
        ResultManager.Instance.GameResult(_extractionResult, startTime);
    }
}
```

## 2. 변경 설명

<code>GamePlayUI</code>를 일반 팝업 스택이 아닌 <code>OpenRoot&lt;GamePlayUI&gt;()</code>로 열도록 변경했습니다. HUD를 항상 하단에 유지해 반복 ESC 입력이나 최상단 팝업 닫기 동작으로 게임 HUD가 비활성화되는 문제를 막습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/Manager/GameManager.cs</code>

```cs
/// <summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
/// </summary>
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
    private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol", "DemoScene Additive", "DemoScene Tutorial" }; //인게임 세션으로 취급할 씬 목록

    // 저장 데이터 인터페이스
    private ICharDataRepository charRepo;               // 캐릭터 데이터 접근 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        // 인터페이스 구현부 연결
        charRepo = new SOCharacterRepository();
        itemRepo = new LocalJsonItemRepository();

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
        if(IsPlayScene(scene.name)) //인게임 세션 신에서 실행
        {
            EnsureRepositories();

            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            PlayerSaveDataSO saveDataSO = PlayerSaveDataSO.Instance;
            if (saveDataSO == null)
            {
                Debug.LogError("[GameManager] PlayerSaveDataSO를 찾지 못해 세션 초기화를 중단합니다.", this);
                return;
            }

            PlayerSaveData playerData = saveDataSO.LoadSaveData();
            if (playerData == null)
            {
                Debug.LogError("[GameManager] 플레이어 세이브 데이터를 불러오지 못해 세션 초기화를 중단합니다.", this);
                return;
            }

            _playerSaveData = playerData;
            CharacterData charData = charRepo.GetCharacterData(playerData.SelectCharID);
            if (charData == null)
            {
                Debug.LogError($"[GameManager] 선택된 캐릭터 데이터를 찾지 못해 플레이어를 스폰할 수 없습니다. TID={playerData.SelectCharID}", this);
                return;
            }

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

            PlayerArtifactEquipment artifactEquipment = FindObjectOfType<PlayerArtifactEquipment>();
            if (artifactEquipment != null)
            {
                artifactEquipment.RestoreFromSave(playerData, itemRepo);
                // 장착 중인 아티팩트를 시작 소지량에 합산하여 인벤토리 이동 시 새로 획득한 것으로 처리되는 것을 방지
                SessionDataSO.Instance.AddStartingArtifacts(artifactEquipment.equippedArtifacts);
            }

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
                SpawnManager.Instance.SpawnBoxes();
            }

            // 인게임 진입 시 조작 맵을 Player로 전환
            GlobalEventBus.OnSwitchInputMap?.Invoke("Player");

            // 게임플레이 HUD는 ESC 팝업 스택에 포함하지 않아 최상단 닫기 대상이 되지 않게 합니다.
            UIManager.Instance.OpenRoot<GamePlayUI>();
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
    }

    private void EnsureRepositories()
    {
        charRepo ??= new SOCharacterRepository();
        itemRepo ??= new LocalJsonItemRepository();
    }

    /// <summary>
    /// 현재 로드된 씬이 인게임 세션 대상인지 판정합니다.
    /// 데모 씬과 패트롤 테스트 씬을 모두 같은 플레이 씬으로 취급하기 위한 보조 함수입니다.
    /// </summary>
    private bool IsPlayScene(string sceneName)
    {
        for (int i = 0; i < playScenes.Length; i++)
        {
            if (sceneName == playScenes[i])
            {
                return true;
            }
        }

        return false;
    }

    private void ResultTime(bool _extractionResult)
    {
        // 사망 후 후속 피격 등으로 종료 이벤트가 중복 발생해도 최초 플레이타임만 사용합니다.
        if (!timeTrack)
            return;

        //시간 기록을 중단하고 기록 고정
        timeTrack = false;
        //결과 계산 시작
        ResultManager.Instance.GameResult(_extractionResult, startTime);
    }
}
```
{% endraw %}
