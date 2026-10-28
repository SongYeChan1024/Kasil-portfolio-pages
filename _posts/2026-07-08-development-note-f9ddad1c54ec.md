---
title: "2026-07-08_artifact_script_full_compare"
date: 2026-07-08 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "2026-07-08\\_artifact\\_script\\_full\\_compare 1. 문서 개요 이 문서는 7aca9f9 아티팩트 장착 및 루팅 흐름 구현 커밋을 기준으로, 오늘 수정되거나 추가된 C 스크립트의 전체 내용을 비교하기 위한 리뷰 문서입니다. 각 항목은 이전 전체 스크립트 -"
description: "2026-07-08\\_artifact\\_script\\_full\\_compare 1. 문서 개요 이 문서는 7aca9f9 아티팩트 장착 및 루팅 흐름 구현 커밋을 기준으로, 오늘 수정되거나 추가된 C 스크립트의 전체 내용을 비교하기 위한 리뷰 문서입니다. 각 항목은 이전 전체 스크립트 -"
published: true
migration_id: "39736532580e8011b349f9ddad1c54ec"
migration_status: "published"
migration_flags: []
---

{% raw %}
# 2026-07-08\_artifact\_script\_full\_compare

## 1. 문서 개요

이 문서는 <code>7aca9f9 아티팩트 장착 및 루팅 흐름 구현</code> 커밋을 기준으로, 오늘 수정되거나 추가된 C# 스크립트의 전체 내용을 비교하기 위한 리뷰 문서입니다.<br />각 항목은 <code>이전 전체 스크립트 -&gt; 설명 -&gt; 바뀐 전체 스크립트</code> 순서로 정리했습니다.

## 2. 비교 대상 스크립트

- <code>Assets/02_Scripts/Define/Data/Item/ArtifactEquipEffect.cs</code>
- <code>Assets/02_Scripts/Define/Data/Item/ArtifactItemData.cs</code>
- <code>Assets/02_Scripts/Define/Data/PlayerSaveData.cs</code>
- <code>Assets/02_Scripts/Define/Enums.cs</code>
- <code>Assets/02_Scripts/Manager/GameManager.cs</code>
- <code>Assets/02_Scripts/Manager/Manager/ResultManager.cs</code>
- <code>Assets/02_Scripts/Presenter/InventoryPresenter.cs</code>
- <code>Assets/02_Scripts/System/BoxArtifactLootOption.cs</code>
- <code>Assets/02_Scripts/System/BoxLootCategoryOption.cs</code>
- <code>Assets/02_Scripts/System/ItemBox.cs</code>
- <code>Assets/02_Scripts/System/Player/PlayerArtifactEquipment.cs</code>
- <code>Assets/02_Scripts/System/Repository/LocalJsonItemRepository.cs</code>
- <code>Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs</code>
- <code>Assets/02_Scripts/UI/Game/InventorySlotUI.cs</code>
- <code>Assets/02_Scripts/UI/Game/InventoryUI.cs</code>
- <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>

## 3.1 <code>Assets/02_Scripts/Define/Data/Item/ArtifactEquipEffect.cs</code>

### 이전 전체 스크립트

```txt
이전 스크립트 없음. 이번 작업에서 새로 추가된 파일입니다.
```

### 설명

아티팩트 하나가 가질 수 있는 장착 효과 1개를 표현하기 위해 새로 추가한 데이터 클래스입니다. 효과 타입과 수치 값을 분리해 저장하여, 한 아티팩트에 여러 효과를 리스트로 붙일 수 있게 했습니다.

### 바뀐 전체 스크립트

```cs
using UnityEngine;

///<summary>
/// 아티팩트 장착 시 적용될 효과 1개에 대한 데이터입니다.
/// 하나의 아티팩트가 여러 효과를 가질 수 있으므로 ArtifactItemData에서 리스트로 보관합니다.
///</summary>
[System.Serializable]
public class ArtifactEquipEffect
{
    public ArtifactEffectType effectType; // 장착 시 적용할 효과 종류
    public float effectValue;             // 효과 수치
}
```

## 3.2 <code>Assets/02_Scripts/Define/Data/Item/ArtifactItemData.cs</code>

### 이전 전체 스크립트

```txt
이전 스크립트 없음. 이번 작업에서 새로 추가된 파일입니다.
```

### 설명

기존 ItemData를 상속하는 아티팩트 전용 아이템 데이터입니다. 플레이버 텍스트, 아티팩트 분류, 장착 효과 목록, 판매가를 보관합니다.

### 바뀐 전체 스크립트

```cs
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 아티팩트 아이템 전용 데이터입니다.
/// 기본 아이템 정보는 ItemData를 사용하고, 장착 분류와 장착 효과 목록만 추가로 보관합니다.
///</summary>
[CreateAssetMenu(fileName = "New Artifact", menuName = "GameData/Item/Artifact")]
public class ArtifactItemData : ItemData
{
    [Header("아티팩트 아이템 정보")]
    public string itemFlavorText;                         // 플레이버 텍스트
    public ArtifactCategory artifactCategory;              // 아티팩트 분류
    public List<ArtifactEquipEffect> equipEffects = new(); // 장착 효과 목록
    public int sellValue;                                  // 판매 가격
}
```

## 3.3 <code>Assets/02_Scripts/Define/Data/PlayerSaveData.cs</code>

### 이전 전체 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class PlayerSaveData
{
    // 캐릭터 데이터
    public List<SaveCharacterData> myCharacters = new();    // 보유 캐릭터 리스트
    public int SelectCharID;                                // 선택한 캐릭터 ID

    // 아이템 데이터
    public List<SaveSlotData> storageSlots = new();         // 창고
    public List<SaveSlotData> inventorySlots = new();       // 인벤토리
    public List<SaveSlotData> safeSlots = new();            // 각성 보존 슬롯
    public List<int> quickSlots = new();                    // 퀵슬롯 (아이템 코드만 기억하고 인벤토리에서 갯수를 셈)
    public int storageSlotNum;                              // 창고 최대 슬롯 수
    public int invenSlotNum;                                // 인벤토리 최대 슬롯 수
    public int safeSlotNum;                                 // 각성 보존 슬롯 수
    public int quickSlotsNum;                               // 퀵슬롯 최대 슬롯 수


    /* 세이브 데이터 첫 생성 시 초기화 */
    public PlayerSaveData()
    {
        // 첫 캐릭터 유안 지급
        SaveCharacterData charData = new();
        charData.TID = 101;
        charData.linkRateLevel = 0;
        charData.TotallinkRateValue = 0;
        myCharacters.Add(charData);

        // 유안 기본 선택
        SelectCharID = 101;

        // 인벤토리 및 창고 슬롯 갯수 지정
        invenSlotNum = 16;
        storageSlotNum = 16;
        safeSlotNum = 4;
        quickSlotsNum = 3;
    }
}

[System.Serializable]
public class SaveSlotData
{
    public int index;   // 슬롯 위치
    public int TID;     // 아이템 고유 번호
    public int amount;  // 수량
}

[System.Serializable]
public class SaveCharacterData
{
    public int TID;                     // 캐릭터 고유 번호
    public int linkRateLevel;           // 각 플레이어 캐릭터 동조율 단계 값
    public float TotallinkRateValue;    // 동조율 단계 값을 달성하기 위해 누적해야 하는 총 동조율 값
}
```

### 설명

플레이어 세이브 데이터에 아티팩트 장착 슬롯 저장 리스트를 추가했습니다. 장착 중인 아티팩트는 인벤토리 슬롯에서 빠지기 때문에 별도 저장 공간이 필요했습니다.

### 바뀐 전체 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class PlayerSaveData
{
    // 캐릭터 데이터
    public List<SaveCharacterData> myCharacters = new();    // 보유 캐릭터 리스트
    public int SelectCharID;                                // 선택한 캐릭터 ID

    // 아이템 데이터
    public List<SaveSlotData> storageSlots = new();         // 창고
    public List<SaveSlotData> inventorySlots = new();       // 인벤토리
    public List<SaveSlotData> safeSlots = new();            // 각성 보존 슬롯
    public List<SaveSlotData> artifactSlots = new();        // 아티팩트 장착 슬롯
    public List<int> quickSlots = new();                    // 퀵슬롯 (아이템 코드만 기억하고 인벤토리에서 갯수를 셈)
    public int storageSlotNum;                              // 창고 최대 슬롯 수
    public int invenSlotNum;                                // 인벤토리 최대 슬롯 수
    public int safeSlotNum;                                 // 각성 보존 슬롯 수
    public int quickSlotsNum;                               // 퀵슬롯 최대 슬롯 수


    /* 세이브 데이터 첫 생성 시 초기화 */
    public PlayerSaveData()
    {
        // 첫 캐릭터 유안 지급
        SaveCharacterData charData = new();
        charData.TID = 101;
        charData.linkRateLevel = 0;
        charData.TotallinkRateValue = 0;
        myCharacters.Add(charData);

        // 유안 기본 선택
        SelectCharID = 101;

        // 인벤토리 및 창고 슬롯 갯수 지정
        invenSlotNum = 16;
        storageSlotNum = 16;
        safeSlotNum = 4;
        quickSlotsNum = 3;
    }
}

[System.Serializable]
public class SaveSlotData
{
    public int index;   // 슬롯 위치
    public int TID;     // 아이템 고유 번호
    public int amount;  // 수량
}

[System.Serializable]
public class SaveCharacterData
{
    public int TID;                     // 캐릭터 고유 번호
    public int linkRateLevel;           // 각 플레이어 캐릭터 동조율 단계 값
    public float TotallinkRateValue;    // 동조율 단계 값을 달성하기 위해 누적해야 하는 총 동조율 값
}
```

## 3.4 <code>Assets/02_Scripts/Define/Enums.cs</code>

### 이전 전체 스크립트

```cs
///<summary>
/// 게임 내 모든 Enum형을 관리합니다
///</summary>

// 캐릭터 종류
public enum UserType
{
    main,           // 메인 다이버
    support         // 적
}

// 피해를 받는 대상이 될 수 있는 것 타입
public enum Faction
{
    player,     // 플래이어
    enemy,      // 적
    neutral     // 그 외
}

// 아이템 카테고리
public enum itemCategory
{
    idle,           // 기타 아이템
    weapon,         // 무장
    armor,          // 방어구
    consume,        // 소모품
    memory          // 기억 파편
}

// 아이템 사용 방법 종류
public enum AreaType
{
    target,             // 사용자가 대상을 선택
    circle_zone,        // 효과가 발동할 원형 구역의 중심 지점을 선택
    raycast,            // 사용 처리 판정 ray를 발사할 방향을 선택
    rectangle           // rectangle
}

// 아이템 효과 적용 대상
public enum EffectTarget
{
    self,               // 플레이어 자신
    enemy               // 적 캐릭터
}

// 아이템&스킬 효과 종류
public enum EffectType
{
    // 플레이어 & 적 공통 사용
    none,                   // 효과 할당되지 않음 (오류)
    healHP,                 // 체력 즉시 회복
    healMP,                 // 마나 즉시 회복
    damage,                 // 일정량의 피해를 입음

    // 플레이어가 받는 효과
    leap,
    knockback,
    parry,

    // 적이 받는 효과
    vision                  // 자신의 위치를 드러냄
}

public enum DialogueType
{
    lobbyEnter,         // 관제실 화면 진입 시
    storyOpen,          // 개방된 심상 기록
    worldEnter,         // 인게임 세션 진입 시 말풍선 툴팁
    enemyEncounter,     // 인게임에서 적 캐릭터 발견 시 말풍선 툴팁
    hitAttack,          // 인게임에서 적 공격에 피격 시 말풍선 툴팁
    getMemory,          // 인게임에서 기억 파편 획득 시 말풍선 툴팁
    getConsume,         // 인게임에서 소비 기물 획득 시 말풍선 툴팁
    escapeSuccess,      // 탈출 성공 시
    escapeFailed        // 탈출 실패 시
}

/* 캐릭터 고유 번호 */
public enum CharacterTID
{
    Yuan = 101          // 유안
}

public enum ItemGrade
{
    empty = 0,     //빈 칸 (default)
    normal = 1,    //일반 등급
    uncommon = 2,  //고급 등급
    rare = 3,      //희귀 등급
    epic = 4,      //서사 등급
    legend = 5     //전설 등급
}
```

### 설명

아이템 카테고리에 artifact를 추가하고, 아티팩트 분류와 효과 타입 enum을 추가했습니다. JSON 문자열을 안전하게 enum으로 파싱하기 위한 기반입니다.

### 바뀐 전체 스크립트

```cs
///<summary>
/// 게임 내 모든 Enum형을 관리합니다
///</summary>

// 캐릭터 종류
public enum UserType
{
    main,           // 메인 다이버
    support         // 적
}

// 피해를 받는 대상이 될 수 있는 것 타입
public enum Faction
{
    player,     // 플래이어
    enemy,      // 적
    neutral     // 그 외
}

// 아이템 카테고리
public enum itemCategory
{
    idle,           // 기타 아이템
    weapon,         // 무장
    armor,          // 방어구
    consume,        // 소모품
    memory,         // 기억 파편
    artifact        // 장비형 아이템
}

// 아이템 사용 방법 종류
public enum AreaType
{
    target,             // 사용자가 대상을 선택
    circle_zone,        // 효과가 발동할 원형 구역의 중심 지점을 선택
    raycast,            // 사용 처리 판정 ray를 발사할 방향을 선택
    rectangle           // rectangle
}

// 아이템 효과 적용 대상
public enum EffectTarget
{
    self,               // 플레이어 자신
    enemy               // 적 캐릭터
}

// 아이템&스킬 효과 종류
public enum EffectType
{
    // 플레이어 & 적 공통 사용
    none,                   // 효과 할당되지 않음 (오류)
    healHP,                 // 체력 즉시 회복
    healMP,                 // 마나 즉시 회복
    damage,                 // 일정량의 피해를 입음

    // 플레이어가 받는 효과
    leap,
    knockback,
    parry,

    // 적이 받는 효과
    vision                  // 자신의 위치를 드러냄
}

public enum DialogueType
{
    lobbyEnter,         // 관제실 화면 진입 시
    storyOpen,          // 개방된 심상 기록
    worldEnter,         // 인게임 세션 진입 시 말풍선 툴팁
    enemyEncounter,     // 인게임에서 적 캐릭터 발견 시 말풍선 툴팁
    hitAttack,          // 인게임에서 적 공격에 피격 시 말풍선 툴팁
    getMemory,          // 인게임에서 기억 파편 획득 시 말풍선 툴팁
    getConsume,         // 인게임에서 소비 기물 획득 시 말풍선 툴팁
    escapeSuccess,      // 탈출 성공 시
    escapeFailed        // 탈출 실패 시
}

/* 캐릭터 고유 번호 */
public enum CharacterTID
{
    Yuan = 101          // 유안
}

public enum ItemGrade
{
    empty = 0,     //빈 칸 (default)
    normal = 1,    //일반 등급
    uncommon = 2,  //고급 등급
    rare = 3,      //희귀 등급
    epic = 4,      //서사 등급
    legend = 5     //전설 등급
}

public enum ArtifactCategory
{
    None, // 기본값
    HP_Related, // 체력 관련
    MP_Related, // 마나 관련
    Mobility, // 이동 관련
    TimeLimit, // 시간 제한 관련
    Combat // 전투 관련
}

public enum ArtifactEffectType
{
    none, // 효과 없음
    hpRegen, // 체력 회복
    mpRegen, // 마나 회복
    moveSpeedUp, // 이동 속도 증가
    timeLimitSpeed, // 시간 제한 속도 증가
    fireSpeedUp, // 공격 속도 증가
    fireMPDown // 공격 시 마나 소모 감소
}
```

## 3.5 <code>Assets/02_Scripts/Manager/GameManager.cs</code>

### 이전 전체 스크립트

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
    private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol", "DemoScene Additive" }; //인게임 세션으로 취급할 씬 목록

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

            UIManager.Instance.Open<GamePlayUI>();
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
    }

    ///<summary>
    /// 현재 로드된 씬이 인게임 세션 대상인지 판정합니다.
    /// 데모 씬과 패트롤 테스트 씬을 모두 같은 플레이 씬으로 취급하기 위한 보조 함수입니다.
    ///</summary>
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
        //시간 기록을 중단하고 기록 고정
        timeTrack = false;
        //결과 계산 시작
        ResultManager.Instance.GameResult(_extractionResult, startTime);
    }
}
```

### 설명

인게임 씬 로드 후 인벤토리 복원에 이어 아티팩트 장착 상태도 세이브 데이터에서 복원하도록 연결했습니다.

### 바뀐 전체 스크립트

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
    private readonly string[] playScenes = { "DemoScene", "DemoScene Patrol", "DemoScene Additive" }; //인게임 세션으로 취급할 씬 목록

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

            PlayerArtifactEquipment artifactEquipment = FindObjectOfType<PlayerArtifactEquipment>();
            if (artifactEquipment != null)
            {
                artifactEquipment.RestoreFromSave(playerData, itemRepo);
            }

            // 적 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnEnemy();
                SpawnManager.Instance.SpawnBoxes();
            }

            UIManager.Instance.Open<GamePlayUI>();
        }
        else
        {
            timeTrack = false;     //인게임 세션 신을 벗어나면 시간 기록 중단
        }
    }

    ///<summary>
    /// 현재 로드된 씬이 인게임 세션 대상인지 판정합니다.
    /// 데모 씬과 패트롤 테스트 씬을 모두 같은 플레이 씬으로 취급하기 위한 보조 함수입니다.
    ///</summary>
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
        //시간 기록을 중단하고 기록 고정
        timeTrack = false;
        //결과 계산 시작
        ResultManager.Instance.GameResult(_extractionResult, startTime);
    }
}
```

## 3.6 <code>Assets/02_Scripts/Manager/Manager/ResultManager.cs</code>

### 이전 전체 스크립트

### 설명

탈출 정산 시 인벤토리/각성 보존/퀵슬롯뿐 아니라 현재 장착 중인 아티팩트도 세이브 데이터에 기록하도록 수정했습니다.

### 바뀐 전체 스크립트

## 3.7 <code>Assets/02_Scripts/Presenter/InventoryPresenter.cs</code>

### 이전 전체 스크립트

### 설명

아티팩트 획득, 장착 요청, 해제 요청을 인벤토리 데이터와 장착 데이터 사이에서 중재하도록 확장했습니다.

### 바뀐 전체 스크립트

## 3.8 <code>Assets/02_Scripts/System/BoxArtifactLootOption.cs</code>

### 이전 전체 스크립트

```txt
이전 스크립트 없음. 이번 작업에서 새로 추가된 파일입니다.
```

### 설명

아이템 박스에서 아티팩트 등급별 후보와 가중치를 인스펙터에서 설정하기 위한 옵션 클래스입니다.

### 바뀐 전체 스크립트

```cs
///<summary>
/// 아이템 박스에서 아티팩트 카테고리가 선택된 뒤 등급별로 다시 판정할 후보입니다.
/// 현재 P0.5에서는 등급당 아티팩트 1종을 TID로 연결합니다.
///</summary>
[System.Serializable]
public class BoxArtifactLootOption
{
    public ItemGrade grade = ItemGrade.normal; // 아티팩트 등급 구분
    public int itemTid = 1001;                 // 해당 등급에 대응하는 아티팩트 TID
    public int weight = 1;                     // 등급 선택 가중치
}
```

## 3.9 <code>Assets/02_Scripts/System/BoxLootCategoryOption.cs</code>

### 이전 전체 스크립트

```txt
이전 스크립트 없음. 이번 작업에서 새로 추가된 파일입니다.
```

### 설명

아이템 박스에서 consume/memory/artifact 같은 카테고리를 가중치로 선택하기 위한 옵션 클래스입니다.

### 바뀐 전체 스크립트

```cs
using System.Collections.Generic;

///<summary>
/// 아이템 박스가 랜덤 보상을 만들 때 먼저 선택할 아이템 카테고리 후보입니다.
/// 카테고리 가중치와 해당 카테고리에서 뽑을 아이템 TID 목록을 인스펙터에서 관리합니다.
///</summary>
[System.Serializable]
public class BoxLootCategoryOption
{
    public itemCategory category = itemCategory.consume; // 먼저 판정할 아이템 카테고리
    public int weight = 1;                               // 카테고리 선택 가중치
    public int minAmount = 1;                            // 해당 카테고리 아이템 최소 수량
    public int maxAmount = 1;                            // 해당 카테고리 아이템 최대 수량
    public List<int> itemTids = new();                   // 이 카테고리에서 랜덤 선택할 아이템 TID 목록
}
```

## 3.10 <code>Assets/02_Scripts/System/ItemBox.cs</code>

### 이전 전체 스크립트

### 설명

기존 고정 후보 루팅에 더해 카테고리 확률 루팅과 아티팩트 등급별 루팅을 지원하도록 확장했습니다.

### 바뀐 전체 스크립트

## 3.11 <code>Assets/02_Scripts/System/Player/PlayerArtifactEquipment.cs</code>

### 이전 전체 스크립트

```txt
이전 스크립트 없음. 이번 작업에서 새로 추가된 파일입니다.
```

### 설명

플레이어의 아티팩트 장착 슬롯 상태를 인벤토리와 분리해 관리하는 새 컴포넌트입니다. 장착/해제/저장/복원을 담당합니다.

### 바뀐 전체 스크립트

```cs
using System;
using UnityEngine;

///<summary>
/// 플레이어의 아티팩트 장착 상태를 관리합니다.
/// 인벤토리 데이터와 분리하여 장착 슬롯 3칸의 현재 아티팩트만 보관합니다.
///</summary>
public class PlayerArtifactEquipment : MonoBehaviour
{
    [SerializeField] private int artifactSlotCount = 3; // 플레이어가 사용할 아티팩트 장착 슬롯 수

    private ArtifactItemData[] equippedArtifacts;       // 현재 장착 중인 아티팩트 목록

    public event Action<int, ArtifactItemData> OnArtifactSlotChanged; // 장착 슬롯 변경 알림

    private void Awake()
    {
        artifactSlotCount = Mathf.Max(1, artifactSlotCount);
        equippedArtifacts = new ArtifactItemData[artifactSlotCount];
    }

    public int SlotCount => equippedArtifacts != null ? equippedArtifacts.Length : artifactSlotCount;

    ///<summary>
    /// 지정한 장착 슬롯에 들어 있는 아티팩트 데이터를 반환합니다.
    ///</summary>
    public ArtifactItemData GetEquippedArtifact(int slotIndex)
    {
        if (!IsValidSlotIndex(slotIndex))
            return null;

        return equippedArtifacts[slotIndex];
    }

    ///<summary>
    /// 세이브 데이터에 저장된 아티팩트 장착 슬롯을 현재 런타임 장착 상태로 복원합니다.
    /// 아이템 원본 데이터는 JSON 아이템 저장소에서 TID 기준으로 다시 찾습니다.
    ///</summary>
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

    ///<summary>
    /// 현재 장착 중인 아티팩트를 세이브 데이터의 artifactSlots에 기록합니다.
    /// 인벤토리 슬롯에서 빠진 아티팩트가 탈출 정산 중 사라지지 않게 하기 위한 저장 동기화입니다.
    ///</summary>
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

    ///<summary>
    /// 지정한 슬롯에 새 아티팩트를 장착하고, 기존 장착 아티팩트가 있으면 previousArtifact로 돌려줍니다.
    /// 실제 인벤토리 이동은 InventoryPresenter가 담당합니다.
    ///</summary>
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

    ///<summary>
    /// 지정한 슬롯의 아티팩트를 해제하고, 해제된 데이터를 removedArtifact로 반환합니다.
    ///</summary>
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

    ///<summary>
    /// 외부에서 잘못된 슬롯 번호로 접근하는 것을 막기 위한 공통 유효성 검사입니다.
    ///</summary>
    private bool IsValidSlotIndex(int slotIndex)
    {
        return equippedArtifacts != null && slotIndex >= 0 && slotIndex < equippedArtifacts.Length;
    }
}
```

## 3.12 <code>Assets/02_Scripts/System/Repository/LocalJsonItemRepository.cs</code>

### 이전 전체 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

// JSON 데이터를 그대로 받아낼 1차원 평면 클래스
[System.Serializable]
public class FlatItemData
{
    // 공통 정보
    public int itemTID;
    public string itemName;
    public string desc;
    public string category; // Enum 대신 문자열로 먼저 받습니다.
    public int itemMultiple;
    public string itemGrade;
    public string icon;

    // 무기(Weapon) 전용 정보
    public float FireRate;
    public float FireRange;
    public float AtkValue;
    public float dreamBarrierBreakValue;
    public float useMana;

    // 소비(Consume) 전용 정보[cite: 6]
    public string useType;
    public float useRange;
    public float useDelay;
    public float useValue;
    public string useTarget;
    public string effectType;

    // 기억 조각(Memory) 전용 정보[cite: 6]
    public string userType;
    public int charID;
    public int linkRateGain;
}

public class LocalJsonItemRepository : IItemDataRepository
{
    private Dictionary<int, ItemData> itemDatabase = new ();

    public LocalJsonItemRepository()
    {
        LoadGameData();
    }

    public void LoadGameData()
    {
        TextAsset jsonAsset = Resources.Load<TextAsset>("JSON/Item");

        if(jsonAsset==null)
        {
            Debug.Log("아이템 데이터 JSON 파일을 찾을 수 없습니다.");
            return;
        }

        List<FlatItemData> flatDataList = JsonConvert.DeserializeObject<List<FlatItemData>>(jsonAsset.text);

        foreach(var data in flatDataList)
        {
            if(!System.Enum.TryParse(data.category, out itemCategory parsedCategory))
            {
                Debug.Log("알 수 없는 카테고리입니다.");
                continue;
            }

            if(!System.Enum.TryParse(data.itemGrade, out ItemGrade parsedGrade))
            {
                Debug.Log("알 수 없는 등급입니다.");
                parsedGrade = ItemGrade.empty;
            }

            switch(data.category.ToLower())
            {
                case "weapon":
                    WeaponItemData weapon = ScriptableObject.CreateInstance<WeaponItemData>();
                    SetCommonData(weapon, data, parsedCategory, parsedGrade);

                    // 무기 전용 속성 할당[cite: 6]
                    weapon.fireRate = data.FireRate;
                    weapon.fireRange = data.FireRange;
                    weapon.AtkValue = data.AtkValue;
                    weapon.dreamBarrierBreakValue = data.dreamBarrierBreakValue;
                    weapon.useMana = data.useMana;

                    itemDatabase[weapon.TID] = weapon;
                    break;

                case "consume":
                    ConsumeItemData consume = ScriptableObject.CreateInstance<ConsumeItemData>();
                    SetCommonData(consume, data, parsedCategory, parsedGrade);

                    // 소비 전용 속성 할당
                    if (System.Enum.TryParse(data.useType, out AreaType areaType))
                        consume.useType = areaType;

                    consume.useRange = data.useRange;
                    consume.useDelay = data.useDelay;
                    consume.useValue = data.useValue;

                    // Enum 속성 변환
                    consume.useEffect = new List<ItemEffect>();

                    EffectTarget finalTarget = EffectTarget.self;
                    if (!string.IsNullOrEmpty(data.useTarget) && !System.Enum.TryParse(data.useTarget, true, out finalTarget))
                    {
                        Debug.Log($"알 수 없는 카테고리입니다: {consume.itemName}");
                        continue;
                    }
                    EffectType finalType = EffectType.none;
                    if (!string.IsNullOrEmpty(data.effectType) && !System.Enum.TryParse(data.effectType, true, out finalType))
                    {
                        Debug.Log($"알 수 없는 카테고리입니다: {consume.itemName}");
                        continue;
                    }

                    consume.useEffect.Add(new ItemEffect
                        {
                            effectTarget = finalTarget,
                            effectType = finalType,
                            effectRange = consume.useRange,
                            effectValue = consume.useValue
                        });

                    itemDatabase[consume.TID] = consume;
                    break;

                case "memory":
                    MemoryPieceitemData memory = ScriptableObject.CreateInstance<MemoryPieceitemData>();
                    SetCommonData(memory, data, parsedCategory, parsedGrade);

                    // 기억 조각 전용 속성 할당
                    if(!System.Enum.TryParse(data.userType, out UserType parsedUserType))
                    {
                        Debug.Log("알 수 없는 카테고리입니다.");
                        continue;
                    }

                    memory.userType = parsedUserType;
                    memory.charID = data.charID;
                    memory.linkRateGain = data.linkRateGain;

                    itemDatabase[memory.TID] = memory;
                    break;

                default:
                    Debug.LogWarning($"[{data.itemTID}] 지원하지 않는 아이템 타입입니다: {data.category}");
                    break;
            }
        }
    }

    // 반복되는 공통 속성 할당을 위한 헬퍼 함수
    private void SetCommonData(ItemData item, FlatItemData data, itemCategory cat, ItemGrade grade)
    {
        item.TID = data.itemTID;
        item.itemName = data.itemName;
        item.desc = data.desc;
        item.category = cat;
        item.itemMultiple = data.itemMultiple;
        item.iconAddress = data.icon;
        item.itemGrade = grade;
    }

    /* ID를 이용해 아이템의 기본 데이터를 가져옴 */
    public ItemData GetItemDataByID(int itemID)
    {
        if(itemDatabase.TryGetValue(itemID, out ItemData item))
        {
            return item;
        }
        Debug.LogError($"{itemID}번 아이템을 데이터베이스에서 찾을 수 없었습니다");
        return null;
    }

    /* ID를 이용해 특정 자식 클래스 타입으로 캐스팅하여 가져옴 */
    public T GetTypeItemData<T>(int itemID) where T: ItemData
    {
        // ID가 동일한 아이템 데이터를 가져옴
        ItemData item = GetItemDataByID(itemID);
        // 데이터를 얻지 못했을 경우
        if(item==null) return null;

        // 가져온 아이템이 요청한 타입과 일치한다면 변환하여 반환
        if(item is T typedItem)
        {
            return typedItem;
        }

        // 타입이 일치하지 않을 경우 null 리턴
        Debug.LogWarning($"ID {itemID} 아이템은 {typeof(T).Name} 타입이 아닙니다. (실제 타입: {item.GetType().Name})");
        return null;
    }
}
```

### 설명

JSON 아이템 데이터에서 artifact 카테고리를 읽어 ArtifactItemData로 생성하고, 장착 효과 목록을 구성하도록 수정했습니다.

### 바뀐 전체 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

// JSON 데이터를 그대로 받아낼 1차원 평면 클래스
[System.Serializable]
public class FlatItemData
{
    // 공통 정보
    public int itemTID;
    public string itemName;
    public string desc;
    public string category; // Enum 대신 문자열로 먼저 받습니다.
    public int itemMultiple;
    public string itemGrade;
    public string icon;

    // 무기(Weapon) 전용 정보
    public float FireRate;
    public float FireRange;
    public float AtkValue;
    public float dreamBarrierBreakValue;
    public float useMana;

    // 소비(Consume) 전용 정보
    public string useType;
    public float useRange;
    public float useDelay;
    public float useValue;
    public string useTarget;
    public string effectType;

    // 기억 조각(Memory) 전용 정보
    public string userType;
    public int charID;
    public int linkRateGain;

    // 아티팩트(Artifact) 전용 정보
    public string itemFlavorText;
    public string artifactCategory;
    public string equipEffectType_0;
    public float equipEffectValue_0;
    public string equipEffectType_1;
    public float equipEffectValue_1;
    public int sellValue;
}

public class LocalJsonItemRepository : IItemDataRepository
{
    private Dictionary<int, ItemData> itemDatabase = new ();

    public LocalJsonItemRepository()
    {
        LoadGameData();
    }

    public void LoadGameData()
    {
        TextAsset jsonAsset = Resources.Load<TextAsset>("JSON/Item");

        if(jsonAsset==null)
        {
            Debug.Log("아이템 데이터 JSON 파일을 찾을 수 없습니다.");
            return;
        }

        List<FlatItemData> flatDataList = JsonConvert.DeserializeObject<List<FlatItemData>>(jsonAsset.text);

        foreach(var data in flatDataList)
        {
            if(!System.Enum.TryParse(data.category, out itemCategory parsedCategory))
            {
                Debug.Log("알 수 없는 카테고리입니다.");
                continue;
            }

            if(!System.Enum.TryParse(data.itemGrade, out ItemGrade parsedGrade))
            {
                Debug.Log("알 수 없는 등급입니다.");
                parsedGrade = ItemGrade.empty;
            }

            switch(data.category.ToLower())
            {
                case "weapon":
                    WeaponItemData weapon = ScriptableObject.CreateInstance<WeaponItemData>();
                    SetCommonData(weapon, data, parsedCategory, parsedGrade);

                    // 무기 전용 속성 할당[cite: 6]
                    weapon.fireRate = data.FireRate;
                    weapon.fireRange = data.FireRange;
                    weapon.AtkValue = data.AtkValue;
                    weapon.dreamBarrierBreakValue = data.dreamBarrierBreakValue;
                    weapon.useMana = data.useMana;

                    itemDatabase[weapon.TID] = weapon;
                    break;

                case "consume":
                    ConsumeItemData consume = ScriptableObject.CreateInstance<ConsumeItemData>();
                    SetCommonData(consume, data, parsedCategory, parsedGrade);

                    // 소비 전용 속성 할당
                    if (System.Enum.TryParse(data.useType, out AreaType areaType))
                        consume.useType = areaType;

                    consume.useRange = data.useRange;
                    consume.useDelay = data.useDelay;
                    consume.useValue = data.useValue;

                    // Enum 속성 변환
                    consume.useEffect = new List<ItemEffect>();

                    EffectTarget finalTarget = EffectTarget.self;
                    if (!string.IsNullOrEmpty(data.useTarget) && !System.Enum.TryParse(data.useTarget, true, out finalTarget))
                    {
                        Debug.Log($"알 수 없는 카테고리입니다: {consume.itemName}");
                        continue;
                    }
                    EffectType finalType = EffectType.none;
                    if (!string.IsNullOrEmpty(data.effectType) && !System.Enum.TryParse(data.effectType, true, out finalType))
                    {
                        Debug.Log($"알 수 없는 카테고리입니다: {consume.itemName}");
                        continue;
                    }

                    consume.useEffect.Add(new ItemEffect
                        {
                            effectTarget = finalTarget,
                            effectType = finalType,
                            effectRange = consume.useRange,
                            effectValue = consume.useValue
                        });

                    itemDatabase[consume.TID] = consume;
                    break;

                case "memory":
                    MemoryPieceitemData memory = ScriptableObject.CreateInstance<MemoryPieceitemData>();
                    SetCommonData(memory, data, parsedCategory, parsedGrade);

                    // 기억 조각 전용 속성 할당
                    if(!System.Enum.TryParse(data.userType, out UserType parsedUserType))
                    {
                        Debug.Log("알 수 없는 카테고리입니다.");
                        continue;
                    }

                    memory.userType = parsedUserType;
                    memory.charID = data.charID;
                    memory.linkRateGain = data.linkRateGain;

                    itemDatabase[memory.TID] = memory;
                    break;

                case "artifact":
                    ArtifactItemData artifact = ScriptableObject.CreateInstance<ArtifactItemData>();
                    SetCommonData(artifact, data, parsedCategory, parsedGrade);

                    artifact.itemFlavorText = data.itemFlavorText;
                    artifact.sellValue = data.sellValue;

                    // JSON 문자열로 들어온 아티팩트 카테고리를 enum 값으로 변환한다.
                    if (!System.Enum.TryParse(data.artifactCategory, out ArtifactCategory artifactCategory))
                    {
                        Debug.LogWarning($"알 수 없는 아티팩트 카테고리입니다: {data.itemName}");
                        artifactCategory = ArtifactCategory.None;
                    }

                    artifact.artifactCategory = artifactCategory;
                    artifact.equipEffects = new List<ArtifactEquipEffect>();

                    // 첫 번째 장착 효과는 모든 아티팩트가 기본으로 가진다.
                    if (!string.IsNullOrEmpty(data.equipEffectType_0) &&
                        System.Enum.TryParse(data.equipEffectType_0, out ArtifactEffectType effectType0))
                    {
                        artifact.equipEffects.Add(new ArtifactEquipEffect
                        {
                            effectType = effectType0,
                            effectValue = data.equipEffectValue_0
                        });
                    }
                    else
                    {
                        Debug.LogWarning($"아티팩트 효과 정보가 없습니다: {data.itemName}");
                    }

                    // 두 번째 장착 효과는 레전드 아티팩트처럼 추가 효과가 있을 때만 등록한다.
                    if (!string.IsNullOrEmpty(data.equipEffectType_1) &&
                        System.Enum.TryParse(data.equipEffectType_1, out ArtifactEffectType effectType1))
                    {
                        artifact.equipEffects.Add(new ArtifactEquipEffect
                        {
                            effectType = effectType1,
                            effectValue = data.equipEffectValue_1
                        });
                    }

                    itemDatabase[artifact.TID] = artifact;
                    break;

                default:
                    Debug.LogWarning($"[{data.itemTID}] 지원하지 않는 아이템 타입입니다: {data.category}");
                    break;
            }
        }
    }

    // 반복되는 공통 속성 할당을 위한 헬퍼 함수
    private void SetCommonData(ItemData item, FlatItemData data, itemCategory cat, ItemGrade grade)
    {
        item.TID = data.itemTID;
        item.itemName = data.itemName;
        item.desc = data.desc;
        item.category = cat;
        item.itemMultiple = data.itemMultiple;
        item.iconAddress = data.icon;
        item.itemGrade = grade;
    }

    /* ID를 이용해 아이템의 기본 데이터를 가져옴 */
    public ItemData GetItemDataByID(int itemID)
    {
        if(itemDatabase.TryGetValue(itemID, out ItemData item))
        {
            return item;
        }
        Debug.LogError($"{itemID}번 아이템을 데이터베이스에서 찾을 수 없었습니다");
        return null;
    }

    /* ID를 이용해 특정 자식 클래스 타입으로 캐스팅하여 가져옴 */
    public T GetTypeItemData<T>(int itemID) where T: ItemData
    {
        // ID가 동일한 아이템 데이터를 가져옴
        ItemData item = GetItemDataByID(itemID);
        // 데이터를 얻지 못했을 경우
        if(item==null) return null;

        // 가져온 아이템이 요청한 타입과 일치한다면 변환하여 반환
        if(item is T typedItem)
        {
            return typedItem;
        }

        // 타입이 일치하지 않을 경우 null 리턴
        Debug.LogWarning($"ID {itemID} 아이템은 {typeof(T).Name} 타입이 아닙니다. (실제 타입: {item.GetType().Name})");
        return null;
    }
}
```

## 3.13 <code>Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs</code>

### 이전 전체 스크립트

```txt
이전 스크립트 없음. 이번 작업에서 새로 추가된 파일입니다.
```

### 설명

인벤토리 UI의 아티팩트 장착 슬롯 한 칸을 담당하는 새 UI 스크립트입니다. 장착 표시, 레어리티 프레임, 드롭 장착, 더블클릭/드래그 해제를 처리합니다.

### 바뀐 전체 스크립트

```cs
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

///<summary>
/// 인벤토리 UI 안의 아티팩트 장착 슬롯 1칸을 담당합니다.
/// 직접 인벤토리 데이터를 수정하지 않고, 이벤트를 통해 Presenter에 장착/해제를 요청합니다.
///</summary>
public class ArtifactEquipSlotUI : MonoBehaviour, IDropHandler, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler
{
    [Header("장착 슬롯 설정")]
    [SerializeField] private int equipSlotIndex; // 0, 1, 2 중 이 UI가 담당하는 장착 슬롯 번호

    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage;   // 빈 장비칸 기본 이미지
    [SerializeField] private Image rarityFrameImage; // 장착된 아티팩트 등급별 슬롯 이미지
    [SerializeField] private Image itemImage;        // 장착된 아티팩트 아이콘 표시 이미지
    [SerializeField] private TMP_Text itemStack;     // 장착 수량 표시용 텍스트. 아티팩트는 1개만 표시합니다.

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    private ArtifactItemData currentArtifact; // 현재 UI에 표시 중인 아티팩트. 빈 슬롯 드래그를 막기 위해 캐시합니다.
    private Canvas mainCanvas;                // 드래그 중 아이콘을 최상단 Canvas로 올릴 때 사용합니다.
    private Transform originalItemParent;     // 드래그 종료 후 아이콘을 원래 장비 슬롯으로 되돌릴 때 사용합니다.

    public int EquipSlotIndex => equipSlotIndex;

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();

        // 인스펙터 연결이 빠져도 프리팹 자식 이름이 유지되면 자동으로 복구합니다.
        // 단, 아이콘/등급 프레임처럼 역할이 분리된 이미지 이름만 찾습니다.
        if (slotFrameImage == null)
            slotFrameImage = FindChildImage("Image-Background");

        if (rarityFrameImage == null)
            rarityFrameImage = FindChildImage("Image-RarityFrame");

        if (itemImage == null)
            itemImage = FindChildImage("Image-EquipItemImage");

        // 빈 장비칸은 아이콘 이미지가 꺼져 있기 때문에 EventSystem이 드롭 대상을 찾지 못할 수 있습니다.
        // 배경 이미지를 Raycast Target으로 켜서 빈 슬롯에도 인벤토리 아이템을 드롭할 수 있게 합니다.
        if (slotFrameImage != null)
            slotFrameImage.raycastTarget = true;

        UpdateSlot(null);
    }

    ///<summary>
    /// 장착 슬롯에 표시할 아티팩트 아이콘, 수량, 등급 프레임을 갱신합니다.
    ///</summary>
    public void UpdateSlot(ArtifactItemData artifact)
    {
        currentArtifact = artifact;

        if (artifact == null)
        {
            if (itemImage != null)
            {
                itemImage.enabled = false;
                itemImage.sprite = null;
            }

            if (itemStack != null)
                itemStack.text = "";

            ApplySlotFrame(ItemGrade.empty);
            return;
        }

        if (itemImage != null)
        {
            itemImage.enabled = true;
            itemImage.sprite = null;
        }

        if (itemStack != null)
            itemStack.text = "1";

        ApplySlotFrame(artifact.itemGrade);
        _ = LoadIconAsync(artifact.iconAddress);
    }

    ///<summary>
    /// 장착된 아티팩트 등급에 맞춰 장비칸 프레임을 갱신합니다.
    /// 빈 슬롯은 기본 배경만 표시하고, 아이템이 있으면 등급 프레임을 추가로 표시합니다.
    ///</summary>
    private void ApplySlotFrame(ItemGrade grade)
    {
        if (slotFrameImage != null && emptySlotSprite != null)
            slotFrameImage.sprite = emptySlotSprite;

        if (rarityFrameImage == null)
            return;

        if (grade == ItemGrade.empty)
        {
            rarityFrameImage.enabled = false;
            rarityFrameImage.sprite = null;
            return;
        }

        rarityFrameImage.enabled = true;
        rarityFrameImage.color = Color.white;
        rarityFrameImage.sprite = GetSlotFrameSprite(grade);
    }

    ///<summary>
    /// 아이템 등급에 대응되는 슬롯 프레임 스프라이트를 반환합니다.
    /// 일부 등급 이미지가 비어 있어도 바로 깨지지 않도록 낮은 등급 이미지로 대체합니다.
    ///</summary>
    private Sprite GetSlotFrameSprite(ItemGrade grade)
    {
        return grade switch
        {
            ItemGrade.normal => normalSlotSprite != null ? normalSlotSprite : emptySlotSprite,
            ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
            ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
            ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
            ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
            _ => emptySlotSprite
        };
    }

    ///<summary>
    /// 아티팩트 데이터의 Addressable 주소로 아이콘을 비동기 로드합니다.
    ///</summary>
    private async System.Threading.Tasks.Task LoadIconAsync(string iconAddress)
    {
        if (string.IsNullOrEmpty(iconAddress) || itemImage == null)
            return;

        Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(iconAddress);

        if (loadedIcon == null)
            return;

        itemImage.enabled = true;
        itemImage.sprite = loadedIcon;
    }

    ///<summary>
    /// 장비 슬롯 하위의 특정 이름을 가진 Image를 찾습니다.
    /// 루트 슬롯 Image를 잘못 잡으면 클릭/드롭 판정이 흔들릴 수 있어 자식 이름을 기준으로만 찾습니다.
    ///</summary>
    private Image FindChildImage(string childName)
    {
        Transform imageTransform = transform.Find(childName);

        if (imageTransform != null && imageTransform.TryGetComponent(out Image foundImage))
            return foundImage;

        Debug.LogWarning($"{name}: {childName}를 찾을 수 없습니다. ArtifactEquipSlotUI의 UI 참조를 인스펙터에서 연결해주세요.");
        return null;
    }

    ///<summary>
    /// 장착 중인 아티팩트가 있을 때만 드래그를 시작합니다.
    /// 드래그 중에는 아이콘 Raycast를 꺼서 아래 인벤토리 슬롯의 OnDrop이 받을 수 있게 합니다.
    ///</summary>
    public void OnBeginDrag(PointerEventData eventData)
    {
        if (currentArtifact == null || itemImage == null || !itemImage.enabled)
            return;

        originalItemParent = itemImage.transform.parent;

        if (mainCanvas != null)
        {
            itemImage.transform.SetParent(mainCanvas.transform);
            itemImage.transform.SetAsLastSibling();
        }

        itemImage.raycastTarget = false;
    }

    ///<summary>
    /// 드래그 중 아이콘을 마우스 위치에 따라 이동시켜 장비칸에서 빼는 느낌을 줍니다.
    ///</summary>
    public void OnDrag(PointerEventData eventData)
    {
        if (currentArtifact == null || itemImage == null)
            return;

        itemImage.transform.position = eventData.position;
    }

    ///<summary>
    /// 드래그가 끝나면 아이콘을 장비 슬롯 원래 위치로 되돌립니다.
    /// 실제 해제 여부는 드롭을 받은 인벤토리 슬롯이 Presenter에 요청합니다.
    ///</summary>
    public void OnEndDrag(PointerEventData eventData)
    {
        if (itemImage == null)
            return;

        itemImage.raycastTarget = true;

        if (originalItemParent != null)
        {
            itemImage.transform.SetParent(originalItemParent);
            itemImage.transform.localPosition = Vector3.zero;
        }

        originalItemParent = null;
    }

    ///<summary>
    /// 인벤토리 슬롯을 장착 슬롯 위에 드롭하면 장착 요청 이벤트를 발생시킵니다.
    /// 실제 장착 가능 여부와 데이터 이동은 InventoryPresenter가 판단합니다.
    ///</summary>
    public void OnDrop(PointerEventData eventData)
    {
        if (eventData.pointerDrag == null)
            return;

        if (eventData.pointerDrag.TryGetComponent<InventorySlotUI>(out InventorySlotUI inventorySlot))
        {
            GlobalEventBus.OnArtifactEquipRequested?.Invoke(equipSlotIndex, inventorySlot.slotIndex);
        }
    }

    ///<summary>
    /// 장착 슬롯을 왼쪽 더블클릭하면 현재 장착된 아티팩트 해제를 요청합니다.
    /// 우클릭 해제는 사용하지 않고, 더블클릭/드래그 앤 드롭 흐름으로 통일합니다.
    ///</summary>
    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button != PointerEventData.InputButton.Left || eventData.clickCount < 2)
            return;

        GlobalEventBus.OnArtifactUnequipRequested?.Invoke(equipSlotIndex);
    }
}
```

## 3.14 <code>Assets/02_Scripts/UI/Game/InventorySlotUI.cs</code>

### 이전 전체 스크립트

```cs
///<summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
/// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다.
/// 인벤토리 슬롯끼리의 위치 교환, 체스트와의 우클릭 이동, 드래그 앤 드롭 이동을 처리한다.
///</summary>
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage; // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage; // 등급별 슬롯 이미지
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    private InventoryUI inventoryUI;

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    private void Awake()
    {

        inventoryUI = GetComponentInParent<InventoryUI>();
        mainCanvas = GetComponentInParent<Canvas>();

        // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
        if (slotFrameImage == null)
            slotFrameImage = GetComponent<Image>();

        if (itemInfo == null)
            itemInfo = transform.Find("ItemInfo");

        if (itemInfo != null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();

        if (mainCanvas == null)
        {
            enabled = false;
            Debug.LogError("InventorySlotUI: Canvas를 찾을 수 없습니다.");
        }
    }

    public void Initialize(int index)
    {
        slotIndex = index;
        UpdateSlot(0, null, ItemGrade.empty);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        UpdateSlot(stack, sprite, ItemGrade.empty);
    }

    public void UpdateSlot(int stack, Sprite sprite, ItemGrade grade)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            ApplySlotFrame(ItemGrade.empty);
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
        ApplySlotFrame(grade);
    }

    ///<summary>
    /// 엑셀/JSON에서 넘어온 아이템 등급에 맞춰 슬롯 배경 이미지를 교체한다.
    ///</summary>
    /// 빈 슬롯
    ///-> slotFrameImage = emptySlotSprite
    ///-> rarityFrameImage 숨김
    ///-> itemImg 숨김

    ///아이템 있음
    ///-> slotFrameImage = emptySlotSprite 그대로 유지
    ///-> rarityFrameImage = 등급별 Sprite
    ///-> rarityFrameImage 표시
    ///-> itemImg 표시
    private void ApplySlotFrame(ItemGrade grade)
    {
        if (slotFrameImage != null)
        {
            slotFrameImage.sprite = emptySlotSprite;
        }

        if (rarityFrameImage == null)
            return;

        if (grade == ItemGrade.empty)
        {
            rarityFrameImage.enabled = false;
            rarityFrameImage.sprite = null;
            return;
        }

        rarityFrameImage.enabled = true;
        rarityFrameImage.color = Color.white;
        rarityFrameImage.sprite = GetSlotFrameSprite(grade);
    }

    private Sprite GetSlotFrameSprite(ItemGrade grade)
    {
        return grade switch
        {
            ItemGrade.normal => normalSlotSprite != null ? normalSlotSprite : emptySlotSprite,
            ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
            ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
            ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
            ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
            _ => emptySlotSprite
        };
    }

    // 왼쪽 버튼 더블클릭으로 인벤토리 이동을 처리
    public void OnPointerClick(PointerEventData eventData)
    {
        // 왼쪽 버튼 클릭이 아니면 처리하지 않기
        if (eventData.button != PointerEventData.InputButton.Left)
        {
            return;
        }

        // 1번만 클릭한 경우에는 처리하지 않기
        if (eventData.clickCount < 2)
        {
            return;
        }

        if (!itemImg.enabled)
        {
            return;
        }

        // 체스트가 열려 있을 때만 인벤토리 -> 체스트 이동을 허용한다.
        if (ChestUI.ActiveUI != null)
            ChestUI.ActiveUI.TryMoveFromInventory(slotIndex);
    }

    public void OnBeginDrag(PointerEventData eventData)
    {
        if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
            return;

        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;
        inventoryUI?.ShowDropZone();
    }

    public void OnDrag(PointerEventData eventData)
    {
        if (itemInfo == null)
            return;

        itemInfo.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = true;

        if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
        {
            itemInfo.SetParent(transform);
            itemInfo.localPosition = Vector3.zero;
        }
        inventoryUI?.HideDropZone();
    }

    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (droppedObj.TryGetComponent<InventorySlotUI>(out var originSlot))
        {
            if (originSlot == this)
                return;

            GlobalEventBus.OnSwapInventorySlot?.Invoke(slotIndex, originSlot.slotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<ChestSlotUI>(out var chestSlot))
        {
            if (chestSlot.OwnerUI == null)
                return;

            chestSlot.OwnerUI.TryMoveToInventorySlot(chestSlot.SlotIndex, slotIndex);
        }
    }
}
```

### 설명

일반 인벤토리 슬롯이 장비칸에서 드래그된 아티팩트를 받을 수 있도록 해제 요청 분기를 추가했습니다.

### 바뀐 전체 스크립트

```cs
///<summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
/// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다.
/// 인벤토리 슬롯끼리의 위치 교환, 체스트와의 우클릭 이동, 드래그 앤 드롭 이동을 처리한다.
///</summary>
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage; // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage; // 등급별 슬롯 이미지
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    [Header("등급별 슬롯 이미지")]
    [SerializeField] private Sprite emptySlotSprite;
    [SerializeField] private Sprite normalSlotSprite;
    [SerializeField] private Sprite uncommonSlotSprite;
    [SerializeField] private Sprite rareSlotSprite;
    [SerializeField] private Sprite epicSlotSprite;
    [SerializeField] private Sprite legendSlotSprite;

    private InventoryUI inventoryUI;

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    private void Awake()
    {

        inventoryUI = GetComponentInParent<InventoryUI>();
        mainCanvas = GetComponentInParent<Canvas>();

        // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
        if (slotFrameImage == null)
            slotFrameImage = GetComponent<Image>();

        if (itemInfo == null)
            itemInfo = transform.Find("ItemInfo");

        if (itemInfo != null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();

        if (mainCanvas == null)
        {
            enabled = false;
            Debug.LogError("InventorySlotUI: Canvas를 찾을 수 없습니다.");
        }
    }

    public void Initialize(int index)
    {
        slotIndex = index;
        UpdateSlot(0, null, ItemGrade.empty);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        UpdateSlot(stack, sprite, ItemGrade.empty);
    }

    public void UpdateSlot(int stack, Sprite sprite, ItemGrade grade)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            ApplySlotFrame(ItemGrade.empty);
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
        ApplySlotFrame(grade);
    }

    ///<summary>
    /// 엑셀/JSON에서 넘어온 아이템 등급에 맞춰 슬롯 배경 이미지를 교체한다.
    ///</summary>
    /// 빈 슬롯
    ///-> slotFrameImage = emptySlotSprite
    ///-> rarityFrameImage 숨김
    ///-> itemImg 숨김

    ///아이템 있음
    ///-> slotFrameImage = emptySlotSprite 그대로 유지
    ///-> rarityFrameImage = 등급별 Sprite
    ///-> rarityFrameImage 표시
    ///-> itemImg 표시
    private void ApplySlotFrame(ItemGrade grade)
    {
        if (slotFrameImage != null)
        {
            slotFrameImage.sprite = emptySlotSprite;
        }

        if (rarityFrameImage == null)
            return;

        if (grade == ItemGrade.empty)
        {
            rarityFrameImage.enabled = false;
            rarityFrameImage.sprite = null;
            return;
        }

        rarityFrameImage.enabled = true;
        rarityFrameImage.color = Color.white;
        rarityFrameImage.sprite = GetSlotFrameSprite(grade);
    }

    private Sprite GetSlotFrameSprite(ItemGrade grade)
    {
        return grade switch
        {
            ItemGrade.normal => normalSlotSprite != null ? normalSlotSprite : emptySlotSprite,
            ItemGrade.uncommon => uncommonSlotSprite != null ? uncommonSlotSprite : normalSlotSprite,
            ItemGrade.rare => rareSlotSprite != null ? rareSlotSprite : normalSlotSprite,
            ItemGrade.epic => epicSlotSprite != null ? epicSlotSprite : rareSlotSprite,
            ItemGrade.legend => legendSlotSprite != null ? legendSlotSprite : epicSlotSprite,
            _ => emptySlotSprite
        };
    }

    // 왼쪽 버튼 더블클릭으로 인벤토리 이동을 처리
    public void OnPointerClick(PointerEventData eventData)
    {
        // 왼쪽 버튼 클릭이 아니면 처리하지 않기
        if (eventData.button != PointerEventData.InputButton.Left)
        {
            return;
        }

        // 1번만 클릭한 경우에는 처리하지 않기
        if (eventData.clickCount < 2)
        {
            return;
        }

        if (!itemImg.enabled)
        {
            return;
        }

        // 체스트가 열려 있을 때만 인벤토리 -> 체스트 이동을 허용한다.
        if (ChestUI.ActiveUI != null)
            ChestUI.ActiveUI.TryMoveFromInventory(slotIndex);
    }

    public void OnBeginDrag(PointerEventData eventData)
    {
        if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
            return;

        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;
        inventoryUI?.ShowDropZone();
    }

    public void OnDrag(PointerEventData eventData)
    {
        if (itemInfo == null)
            return;

        itemInfo.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = true;

        if (mainCanvas != null && itemInfo != null && itemInfo.parent == mainCanvas.transform)
        {
            itemInfo.SetParent(transform);
            itemInfo.localPosition = Vector3.zero;
        }
        inventoryUI?.HideDropZone();
    }

    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (droppedObj.TryGetComponent<InventorySlotUI>(out var originSlot))
        {
            if (originSlot == this)
                return;

            GlobalEventBus.OnSwapInventorySlot?.Invoke(slotIndex, originSlot.slotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<ArtifactEquipSlotUI>(out var artifactSlot))
        {
            // 장착 슬롯에서 일반 인벤토리 슬롯으로 드롭하면 해제를 요청합니다.
            // 실제로 인벤토리에 들어갈 공간이 있는지는 InventoryPresenter가 판단합니다.
            GlobalEventBus.OnArtifactUnequipRequested?.Invoke(artifactSlot.EquipSlotIndex);
            return;
        }

        if (droppedObj.TryGetComponent<ChestSlotUI>(out var chestSlot))
        {
            if (chestSlot.OwnerUI == null)
                return;

            chestSlot.OwnerUI.TryMoveToInventorySlot(chestSlot.SlotIndex, slotIndex);
        }
    }
}
```

## 3.15 <code>Assets/02_Scripts/UI/Game/InventoryUI.cs</code>

### 이전 전체 스크립트

```cs
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 플레이어 인벤토리 UI 출력만 담당한다.
/// 실제 데이터 저장은 하지 않고 슬롯 생성/갱신과 드롭존 표시만 처리한다.
///</summary>
public class InventoryUI : MonoBehaviour
{
    [Header("Inventory UI")]
    [SerializeField] private Transform slotContainer;
    [SerializeField] private Transform safeSlotContainer;
    [SerializeField] private List<GameObject> slotsObj = new();
    [SerializeField] private List<GameObject> safeSlotsObj = new();
    [SerializeField] private GameObject slotPrefab;

    [Header("Drop Zone UI")]
    [SerializeField] private InventoryDropZoneUI dropZone;

    private CanvasGroup dropZoneCanvasGroup;
    private bool canUseDropZone = true;

    private void Awake()
    {
        if (dropZone == null)
            dropZone = GetComponentInChildren<InventoryDropZoneUI>(true);

        if (dropZone != null)
            dropZoneCanvasGroup = dropZone.GetComponent<CanvasGroup>();

        HideDropZone();
    }

    public void CreatSlots(int count)
    {
        if (slotsObj.Count == count)
            return;

        for (int i = 0; i < slotsObj.Count; i++)
        {
            if (slotsObj[i] != null)
                Destroy(slotsObj[i]);
        }

        slotsObj.Clear();

        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(i);

            slotsObj.Add(newSlot);
        }
    }

    // 각성 보존 슬롯 생성
    public void CreateSafeSlots(int count, int slotIndexOffset)
    {
        if (safeSlotsObj.Count == count)
            return;

        for (int j = 0; j < safeSlotsObj.Count; j++)
        {
            if (safeSlotsObj[j] != null)
                Destroy(safeSlotsObj[j]);
        }

        safeSlotsObj.Clear();

        int invenCnt = slotsObj.Count;

        for (int j = 0; j < count; j++)
        {
            GameObject newSlot = Instantiate(slotPrefab, safeSlotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(j + invenCnt);

            safeSlotsObj.Add(newSlot);
        }
    }

    public void UpdateSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = slotsObj[slotNum].GetComponent<InventorySlotUI>();
        ItemGrade grade = slotData.itemData != null ? slotData.itemData.itemGrade : ItemGrade.empty;
        slotUI.UpdateSlot(slotData.amount, slotData.icon, grade);
    }

    public void UpdateSafeSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = safeSlotsObj[slotNum].GetComponent<InventorySlotUI>();
        ItemGrade grade = slotData.itemData != null ? slotData.itemData.itemGrade : ItemGrade.empty;
        slotUI.UpdateSlot(slotData.amount, slotData.icon, grade);
    }

    public void SetDropZoneAvailable(bool available)
    {
        canUseDropZone = available;

        if (!canUseDropZone)
            HideDropZone();
    }

    public void ShowDropZone()
    {
        if (!canUseDropZone || dropZoneCanvasGroup == null)
            return;

        dropZoneCanvasGroup.alpha = 1f;
        dropZoneCanvasGroup.blocksRaycasts = true;
        dropZoneCanvasGroup.interactable = true;
    }

    public void HideDropZone()
    {
        if (dropZoneCanvasGroup == null)
            return;

        dropZoneCanvasGroup.alpha = 0f;
        dropZoneCanvasGroup.blocksRaycasts = false;
        dropZoneCanvasGroup.interactable = false;
    }
}
```

### 설명

인벤토리 UI가 아티팩트 장착 슬롯 목록을 알고, 장착 상태 변경 시 해당 슬롯 UI를 갱신하도록 확장했습니다.

### 바뀐 전체 스크립트

```cs
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 플레이어 인벤토리 UI 출력만 담당한다.
/// 실제 데이터 저장은 하지 않고 슬롯 생성/갱신과 드롭존 표시만 처리한다.
///</summary>
public class InventoryUI : MonoBehaviour
{
    [Header("Inventory UI")]
    [SerializeField] private Transform slotContainer;
    [SerializeField] private Transform safeSlotContainer;
    [SerializeField] private List<GameObject> slotsObj = new();
    [SerializeField] private List<GameObject> safeSlotsObj = new();
    [SerializeField] private GameObject slotPrefab;

    [Header("Drop Zone UI")]
    [SerializeField] private InventoryDropZoneUI dropZone;

    [Header("Artifact Equip UI")]
    [SerializeField] private ArtifactEquipSlotUI[] artifactEquipSlots; // 인벤토리 상단의 아티팩트 장착 슬롯 UI 목록

    private CanvasGroup dropZoneCanvasGroup;
    private bool canUseDropZone = true;

    private void Awake()
    {
        if (dropZone == null)
            dropZone = GetComponentInChildren<InventoryDropZoneUI>(true);

        if (dropZone != null)
            dropZoneCanvasGroup = dropZone.GetComponent<CanvasGroup>();

        HideDropZone();
    }

    public void CreatSlots(int count)
    {
        if (slotsObj.Count == count)
            return;

        for (int i = 0; i < slotsObj.Count; i++)
        {
            if (slotsObj[i] != null)
                Destroy(slotsObj[i]);
        }

        slotsObj.Clear();

        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(i);

            slotsObj.Add(newSlot);
        }
    }

    // 각성 보존 슬롯 생성
    public void CreateSafeSlots(int count, int slotIndexOffset)
    {
        if (safeSlotsObj.Count == count)
            return;

        for (int j = 0; j < safeSlotsObj.Count; j++)
        {
            if (safeSlotsObj[j] != null)
                Destroy(safeSlotsObj[j]);
        }

        safeSlotsObj.Clear();

        int invenCnt = slotsObj.Count;

        for (int j = 0; j < count; j++)
        {
            GameObject newSlot = Instantiate(slotPrefab, safeSlotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(j + invenCnt);

            safeSlotsObj.Add(newSlot);
        }
    }

    public void UpdateSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = slotsObj[slotNum].GetComponent<InventorySlotUI>();
        ItemGrade grade = slotData.itemData != null ? slotData.itemData.itemGrade : ItemGrade.empty;
        slotUI.UpdateSlot(slotData.amount, slotData.icon, grade);
    }

    public void UpdateSafeSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = safeSlotsObj[slotNum].GetComponent<InventorySlotUI>();
        ItemGrade grade = slotData.itemData != null ? slotData.itemData.itemGrade : ItemGrade.empty;
        slotUI.UpdateSlot(slotData.amount, slotData.icon, grade);
    }

    public void SetDropZoneAvailable(bool available)
    {
        canUseDropZone = available;

        if (!canUseDropZone)
            HideDropZone();
    }

    public void ShowDropZone()
    {
        if (!canUseDropZone || dropZoneCanvasGroup == null)
            return;

        dropZoneCanvasGroup.alpha = 1f;
        dropZoneCanvasGroup.blocksRaycasts = true;
        dropZoneCanvasGroup.interactable = true;
    }

    public void HideDropZone()
    {
        if (dropZoneCanvasGroup == null)
            return;

        dropZoneCanvasGroup.alpha = 0f;
        dropZoneCanvasGroup.blocksRaycasts = false;
        dropZoneCanvasGroup.interactable = false;
    }

    public void UpdateArtifactSlot(int slotIndex, ArtifactItemData artifact)
    {
        if (artifactEquipSlots == null || slotIndex < 0 || slotIndex >= artifactEquipSlots.Length)
            return;

        if (artifactEquipSlots[slotIndex] == null)
            return;

        artifactEquipSlots[slotIndex].UpdateSlot(artifact);
    }

    ///<summary>
    /// 인벤토리를 열 때 현재 플레이어가 장착 중인 아티팩트 상태를 장착 슬롯 UI에 반영합니다.
    ///</summary>
    public void UpdateArtifactSlots(PlayerArtifactEquipment equipment)
    {
        if (equipment == null || artifactEquipSlots == null)
            return;

        for (int i = 0; i < artifactEquipSlots.Length; i++)
        {
            UpdateArtifactSlot(i, equipment.GetEquippedArtifact(i));
        }
    }
}
```

## 3.16 <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>

### 이전 전체 스크립트

```cs
///<summary>
/// 글로벌 이벤트 버스 클래스
/// 게임 내에서 발생하는 다양한 이벤트를 중앙에서 관리하고 전달하는 역할을 합니다.
///</summary>
using System;
using UnityEngine;

public class GlobalEventBus
{
    ///<summary>
    /// 플레이어 입력 관련 이벤트
    ///</summary>

    /// 플레이어 행동에 의한 이벤트 ///
    public static Action<Vector2> OnPlayerMove;                     // 플레이어 이동 버튼 입력: Action<이동 버튼 입력 벡터>
    public static Action OnAttackInput;                             // 공격 버튼 입력
    public static Action OnMainActiveSkillRequested;                // 다이버 액티브 스킬 버튼 입력
    public static Action OnInteractionInput;                        // 상호작용 버튼 입력
    public static Action<bool> OnSprintInput;                       // 달리기 버튼 입력: Action<isSprint>
    public static Action<bool> SendCanSprint;                       // 달리기 여부 계산 전달: Action<canSprint>
    public static Action<bool> SendCannotSprint;                    // 마나 소진으로 달리기 불가 상태 전달: Action<cannotSprint>
    public static Action OnEvadeRequested;                          // 구르기 버튼 입력
    public static Action<Vector2> OnMousePositionInput;             // 마우스의 현재 화면 좌표 전달: Action<화면 상의 좌표>
    public static Action<GameObject> OnPlayerSpawned;               // 플레이어 생성 시 위치 정보 전달: Action<플레이어의 Transform>
    public static Action<Transform> OnPlayerDespawned;              // 플레이어 제거 시 위치 정보 전달: Action<플레이어의 Transform>

    ///<summary>
    /// 아이템 상호작용 이벤트
    ///</summary>
    public static Action<int, int, int> OnItemPickedUp;             // 아아템을 주웠을 시: Action<플레이어 식별자 코드, 아이템 코드, 아이템 갯수>
    public static Action<int, Sprite, int> OnQuickSlotChanged;      // 퀵슬롯 정보가 변경되었을 시: Action<퀵슬롯 번호, 이미지, 갯수>
    public static Action<int> OnQuickSlotUseRequested;              // 특정 퀵슬롯 번호가 눌렷을 시: Action<퀵슬롯 번호>
    public static Action<int, int> OnSwapInventorySlot;             // 인벤토리 슬롯이 바뀌었을 시: Action<1번 슬롯 번호, 2번 슬롯 번호>
    public static Action<int> OnInventoryDropRequested;             // 인벤토리 아이템을 바닥에 버리기 요청할 시: Action<인벤토리 슬롯 번호>
    public static Action<int, int> OnDropItemQuickSlot;             // 인벤토리에서 퀵슬롯에 아이템을 드래그 앤 드롭 할 시: Action<퀵슬롯 번호, 인벤토리 번호> | 인벤토리->퀵슬롯
    public static Action<int, int> OnSwapItemQuickSlot;             // 퀵슬롯에서 퀵슬롯으로 아이템을 드래그 앤 드롭 할 시: Action<1번 퀵슬롯 번호, 2번 퀵슬롯 번호)> | 2번슬롯->1번슬롯
    public static Action<int, int, Sprite, int> QuickSlotLoad;      // 퀵슬롯 데이터 불러오기 시: Action<퀵슬롯 번호, 아이템 TID, 아이템 아이콘, 아이템 개수)>

    ///<summary>
    /// 아이템 효과 이벤트
    ///</summary>
    public static Action<GameObject, float> OnHealRequested;        // 체력 회복 효과: Action<대상, 값>
    public static Action<GameObject, float> OnGainManaRequested;    // 마나 회복 효과: Action<대상, 값>

    ///<summary>
    /// 전투 관련 이벤트
    ///</summary>
    public static Action<float, float> OnPlayerHealthChanged;       // 플레이어 체력 변동: Action<현재 체력, 전체 체력>
    public static Action<int> onPlayerDead;                         // 플레이어 사망 여부: Action<고유 번호>
    public static Action<float, float> OnPlayerManaChanged;         // 플레이어 마나 변동: Action<현재 마나, 전체 마나>
    public static Action<float> OnSprintManaConsume;                // 플레이어 달리기 시 마나 소비: Action<소모량>
    public static Func<float, bool> OnRequestManaConsume;           // 플레이어 마나 소비 요청: Func<소모량, 성공여부>
    public static Action<float> OnTimePenaltyRequested;             // 루시드 낙인 등으로 남은 제한 시간 감소 요청: Action<감소 초>
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>
    public static Action<float> OnTimerChanged;                     // 남은 제한 시간 변동: Action<남은 시간>
    public static Action OnHitAnimate;                              // 플레이어 피격 애니메이션 발생

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
    public static Action<int> OnEscapeFailure;                      // 탈출 취소 판정 발생: Action<플레이어 ID>
    public static Action OnTimeOver;                                // 제한 시간 종료 시
    public static Action OnReturnToLobby;                           // 로비로 돌아가기 이벤트 발생
    public static Action<IInteractable, int> OnItemBoxOpened;       // 상자와 상호작용하여 UI를 열었을 시: Action<열린 상자, 상호작용한 플레이어 ID>
    public static Action<NoiseStimulus> OnNoiseRequested;           // 노이즈 시스템에 소음 발생을 요청: Action<요청된 소음 데이터>
    public static Action<NoiseStimulus> OnNoiseEmitted;             // 노이즈 매니저가 실제 처리한 소음 전달: Action<확정된 소음 데이터>

    ///<summary>
    /// UI 관리 이벤트
    ///</summary>
    public static Action OnOpenLobbyUI;                                     // 로비 UI 실행
    public static Action OnRequestQuickSlotCache;                           // 출격 준비 UI에서 퀵슬롯 캐시 재전송 요청
    public static Action OnOpenPrepareUI;                                   // 출격 준비 UI 오픈 (LobbyMainUI → LobbyPresenter)
    public static Action PrepareUIOpen;                                     // 출격 준비 UI 오픈 (SortiePrepareUI → ResultManager)
    public static Action OnOpenRecordUI;                                    // 다이버/기록 UI 오픈  (LobbyMainUI → LobbyPresenter)
    public static Action RecordUIOpen;                                      // 다이버/기록 UI 오픈  (DiverRecordUI → ResultManager)
    public static Action OnOpenStorageUI;                                   // 개인 창고 UI 오픈
    public static Action<string, CharacterTID> OnOpenRecordCardPopUpUI;     // 기록 카드 팝업 열기 요청: Action<기록 제목, 기록을 열 캐릭터의 ID>
    public static Action<int, bool, bool> RecordDataLoad;                   // 다이버 개인 심상 기록 데이터 전달 : Action<newLinkRateLevel, newMemoryLogUnlocked, newHasNewMemoryLog>
    public static Action OnRecordRead;                                      // 다이버 개인 심상 기록 읽음

    ///<summary>
    /// 씬 전환 이벤트
    ///</summary>
    public static Action OnGoToLobbyScene;                                  // 로비 씬으로 이동
    public static Action OnGoToGameScene;                                   // 게임 씬으로 이동
}
```

### 설명

아티팩트 장착 요청과 해제 요청 이벤트를 추가해 UI와 Presenter가 직접 의존하지 않고 통신하도록 했습니다.

### 바뀐 전체 스크립트

```cs
///<summary>
/// 글로벌 이벤트 버스 클래스
/// 게임 내에서 발생하는 다양한 이벤트를 중앙에서 관리하고 전달하는 역할을 합니다.
///</summary>
using System;
using UnityEngine;

public class GlobalEventBus
{
    ///<summary>
    /// 플레이어 입력 관련 이벤트
    ///</summary>

    /// 플레이어 행동에 의한 이벤트 ///
    public static Action<Vector2> OnPlayerMove;                     // 플레이어 이동 버튼 입력: Action<이동 버튼 입력 벡터>
    public static Action OnAttackInput;                             // 공격 버튼 입력
    public static Action OnMainActiveSkillRequested;                // 다이버 액티브 스킬 버튼 입력
    public static Action OnInteractionInput;                        // 상호작용 버튼 입력
    public static Action<bool> OnSprintInput;                       // 달리기 버튼 입력: Action<isSprint>
    public static Action<bool> SendCanSprint;                       // 달리기 여부 계산 전달: Action<canSprint>
    public static Action<bool> SendCannotSprint;                    // 마나 소진으로 달리기 불가 상태 전달: Action<cannotSprint>
    public static Action OnEvadeRequested;                          // 구르기 버튼 입력
    public static Action<Vector2> OnMousePositionInput;             // 마우스의 현재 화면 좌표 전달: Action<화면 상의 좌표>
    public static Action<GameObject> OnPlayerSpawned;               // 플레이어 생성 시 위치 정보 전달: Action<플레이어의 Transform>
    public static Action<Transform> OnPlayerDespawned;              // 플레이어 제거 시 위치 정보 전달: Action<플레이어의 Transform>

    ///<summary>
    /// 아이템 상호작용 이벤트
    ///</summary>
    public static Action<int, int, int> OnItemPickedUp;             // 아아템을 주웠을 시: Action<플레이어 식별자 코드, 아이템 코드, 아이템 갯수>
    public static Action<int, Sprite, int> OnQuickSlotChanged;      // 퀵슬롯 정보가 변경되었을 시: Action<퀵슬롯 번호, 이미지, 갯수>
    public static Action<int> OnQuickSlotUseRequested;              // 특정 퀵슬롯 번호가 눌렷을 시: Action<퀵슬롯 번호>
    public static Action<int, int> OnSwapInventorySlot;             // 인벤토리 슬롯이 바뀌었을 시: Action<1번 슬롯 번호, 2번 슬롯 번호>
    public static Action<int> OnInventoryDropRequested;             // 인벤토리 아이템을 바닥에 버리기 요청할 시: Action<인벤토리 슬롯 번호>
    public static Action<int, int> OnDropItemQuickSlot;             // 인벤토리에서 퀵슬롯에 아이템을 드래그 앤 드롭 할 시: Action<퀵슬롯 번호, 인벤토리 번호> | 인벤토리->퀵슬롯
    public static Action<int, int> OnSwapItemQuickSlot;             // 퀵슬롯에서 퀵슬롯으로 아이템을 드래그 앤 드롭 할 시: Action<1번 퀵슬롯 번호, 2번 퀵슬롯 번호)> | 2번슬롯->1번슬롯
    public static Action<int, int, Sprite, int> QuickSlotLoad;      // 퀵슬롯 데이터 불러오기 시: Action<퀵슬롯 번호, 아이템 TID, 아이템 아이콘, 아이템 개수)>
    public static Action<int, int> OnArtifactEquipRequested;     // 아티팩트 장착 요청: Action<장착 슬롯 번호, 인벤토리 슬롯 번호>
    public static Action<int> OnArtifactUnequipRequested;        // 아티팩트 해제 요청: Action<장착 슬롯 번호>

    ///<summary>
    /// 아이템 효과 이벤트
    ///</summary>
    public static Action<GameObject, float> OnHealRequested;        // 체력 회복 효과: Action<대상, 값>
    public static Action<GameObject, float> OnGainManaRequested;    // 마나 회복 효과: Action<대상, 값>

    ///<summary>
    /// 전투 관련 이벤트
    ///</summary>
    public static Action<float, float> OnPlayerHealthChanged;       // 플레이어 체력 변동: Action<현재 체력, 전체 체력>
    public static Action<int> onPlayerDead;                         // 플레이어 사망 여부: Action<고유 번호>
    public static Action<float, float> OnPlayerManaChanged;         // 플레이어 마나 변동: Action<현재 마나, 전체 마나>
    public static Action<float> OnSprintManaConsume;                // 플레이어 달리기 시 마나 소비: Action<소모량>
    public static Func<float, bool> OnRequestManaConsume;           // 플레이어 마나 소비 요청: Func<소모량, 성공여부>
    public static Action<float> OnTimePenaltyRequested;             // 루시드 낙인 등으로 남은 제한 시간 감소 요청: Action<감소 초>
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>
    public static Action<float> OnTimerChanged;                     // 남은 제한 시간 변동: Action<남은 시간>
    public static Action OnHitAnimate;                              // 플레이어 피격 애니메이션 발생

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
    public static Action<int> OnEscapeFailure;                      // 탈출 취소 판정 발생: Action<플레이어 ID>
    public static Action OnTimeOver;                                // 제한 시간 종료 시
    public static Action OnReturnToLobby;                           // 로비로 돌아가기 이벤트 발생
    public static Action<IInteractable, int> OnItemBoxOpened;       // 상자와 상호작용하여 UI를 열었을 시: Action<열린 상자, 상호작용한 플레이어 ID>
    public static Action<NoiseStimulus> OnNoiseRequested;           // 노이즈 시스템에 소음 발생을 요청: Action<요청된 소음 데이터>
    public static Action<NoiseStimulus> OnNoiseEmitted;             // 노이즈 매니저가 실제 처리한 소음 전달: Action<확정된 소음 데이터>

    ///<summary>
    /// UI 관리 이벤트
    ///</summary>
    public static Action OnOpenLobbyUI;                                     // 로비 UI 실행
    public static Action OnRequestQuickSlotCache;                           // 출격 준비 UI에서 퀵슬롯 캐시 재전송 요청
    public static Action OnOpenPrepareUI;                                   // 출격 준비 UI 오픈 (LobbyMainUI → LobbyPresenter)
    public static Action PrepareUIOpen;                                     // 출격 준비 UI 오픈 (SortiePrepareUI → ResultManager)
    public static Action OnOpenRecordUI;                                    // 다이버/기록 UI 오픈  (LobbyMainUI → LobbyPresenter)
    public static Action RecordUIOpen;                                      // 다이버/기록 UI 오픈  (DiverRecordUI → ResultManager)
    public static Action OnOpenStorageUI;                                   // 개인 창고 UI 오픈
    public static Action<string, CharacterTID> OnOpenRecordCardPopUpUI;     // 기록 카드 팝업 열기 요청: Action<기록 제목, 기록을 열 캐릭터의 ID>
    public static Action<int, bool, bool> RecordDataLoad;                   // 다이버 개인 심상 기록 데이터 전달 : Action<newLinkRateLevel, newMemoryLogUnlocked, newHasNewMemoryLog>
    public static Action OnRecordRead;                                      // 다이버 개인 심상 기록 읽음

    ///<summary>
    /// 씬 전환 이벤트
    ///</summary>
    public static Action OnGoToLobbyScene;                                  // 로비 씬으로 이동
    public static Action OnGoToGameScene;                                   // 게임 씬으로 이동
}
```
{% endraw %}
