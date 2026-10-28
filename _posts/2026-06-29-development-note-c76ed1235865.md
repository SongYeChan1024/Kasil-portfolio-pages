---
title: "2026-06-29_inventory_sortie_chest_compare"
date: 2026-06-29 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-06-29\\_inventory\\_sortie\\_chest\\_compare 2026-06-29 Inventory / Sortie / Chest Compare Previous version: b6598e9:path Current version: working tree Output "
description: "2026-06-29\\_inventory\\_sortie\\_chest\\_compare 2026-06-29 Inventory / Sortie / Chest Compare Previous version: b6598e9:path Current version: working tree Output "
published: false
migration_id: "38e36532580e80b0b0cfc76ed1235865"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
# 2026-06-29\_inventory\_sortie\_chest\_compare

# 2026-06-29 Inventory / Sortie / Chest Compare

Previous version: <code>b6598e9:path</code><br />Current version: working tree<br />Output encoding: UTF-8

## Assets/02\_Scripts/Manager/GameManager.cs

### Previous Script

```cs
///<summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
/// [26.06.24_강다영] playerPrefab, EnemyPrefab: 캐릭터 및 적 프리팹은 생성 시 결정되도록 바꿀 것
///</summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }


    // 인벤토리 기록에 관한 필드
    private PlayerSaveData _playerSaveData;             //인벤토리 기록이 저장된 플레이어 세이브 데이터
    // 플레이 타임 기록에 관한 필드
    private bool timeTrack = false;                     //플레이 시간 측정 중
    private float startTime;                            //플레이 시작 시점
    private readonly string playScene = "DemoScene";    //플레이 시간을 측정할 신
    //private ResultUI resultPanel;                       //결과 창 UI 캐시
    // 동조율 관련 코드
    public int linkRateLevel = 0;                       //동조율 상승 후 다이버와의 동조율 단계
    public int linkRateGain = 1;                        //세션 탈출 성공 시 가산되는 동조

    // 저장 데이터 인터페이스
    private ISaveRepository saveRepo;                                // 플레이어 데이터 저장 인터페이스
    public PlayerSaveData playerData { get; private set; }           // 실질적인 플레이어 데이터
    private ICharDataRepository charRepo;
    public CharacterData charData { get; private set; }

    private void Awake()
    {
        // 인스턴스 중복 방지
        if(Instance==null)
            Instance = this;

        saveRepo = new LocalSaveRepository();
        charRepo = new SOCharacterRepository();

        SceneManager.sceneLoaded += OnSceneLoaded;                  //신 로드 완료 시점에 실행하는 메소드 연결
        GlobalEventBus.OnEscapeRequest += ResultTime;               //탈출 판정 이벤트에 경과 시간 기록 메소드 연결
        //GlobalEventBus.OnReturnToLobby += CloseResultPanel;       //로비로 돌아가기 버튼에 결과 창 닫기 연결
    }

    private void OnDestroy()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        GlobalEventBus.OnEscapeRequest -= ResultTime;
        //GlobalEventBus.OnReturnToLobby -= CloseResultPanel;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if(scene.name == playScene) //인게임 세션 신에서 실행
        {
            startTime = Time.time;  //시작 시점 등록
            timeTrack = true;       //시간 기록 시작

            // 캐릭터 데이터 가져오기
            playerData = saveRepo.LoadSaveData();
            _playerSaveData = playerData;
            charData = charRepo.GetCharacterData(playerData.SelectCharID);

            // 플레이어 1회 생성
            if (SpawnManager.Instance != null)
            {
                SpawnManager.Instance.SpawnPlayer(charData);
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

    public void FindItem(int _tid, out int count, out ItemData data)
    {
        foreach (SaveSlotData slot in _playerSaveData.inventorySlots)
        {
            if (slot.TID == _tid)
            {
                count = slot.amount;
                data = DataManager.Instance.GetItemData(_tid);
                return;
            }
        }
        count = 0;
        data = null;
        return;
    }
}
```

### Modified Description

GameManager는 인게임 진입 시 플레이어 생성 이후 저장된 인벤토리와 퀵슬롯을 런타임 슬롯에 복원하도록 정리되었다. 이를 통해 출격 준비 UI에서 확정한 슬롯 구성이 다음 출격의 실제 인게임 상태와 이어지도록 연결했다.

### Current Script

```cs
///<summary>
/// 인게임 전반의 시스템을 관리하는 인스턴스 클래스
/// [26.06.24_강다영] playerPrefab, EnemyPrefab: 캐릭터 및 적 프리팹은 생성 시 결정되도록 바꿀 것
///</summary>
using System.Collections;
using System.Collections.Generic;
using Codice.Client.Commands.WkTree;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }


    // 인벤토리 기록에 관한 필드
    private PlayerSaveData _playerSaveData;             //인벤토리 기록이 저장된 플레이어 세이브 데이터
    // 플레이 타임 기록에 관한 필드
    private bool timeTrack = false;                     //플레이 시간 측정 중
    private float startTime;                            //플레이 시작 시점
    private readonly string playScene = "DemoScene";    //플레이 시간을 측정할 신
    //private ResultUI resultPanel;                       //결과 창 UI 캐시
    // 동조율 관련 코드
    public int linkRateLevel = 0;                       //동조율 상승 후 다이버와의 동조율 단계
    public int linkRateGain = 1;                        //세션 탈출 성공 시 가산되는 동조

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
        //GlobalEventBus.OnReturnToLobby += CloseResultPanel;       //로비로 돌아가기 버튼에 결과 창 닫기 연결
    }

    private void OnDestroy()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        GlobalEventBus.OnEscapeRequest -= ResultTime;
        //GlobalEventBus.OnReturnToLobby -= CloseResultPanel;
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

    public void FindItem(int _tid, out int count, out ItemData data)
    {
        foreach (SaveSlotData slot in _playerSaveData.inventorySlots)
        {
            if (slot.TID == _tid)
            {
                count = slot.amount;
                data = itemRepo.GetItemData(_tid);
                return;
            }
        }
        count = 0;
        data = null;
        return;
    }
}
```

## Assets/02\_Scripts/Manager/ResultManager.cs

### Previous Script

### Modified Description

ResultManager는 세션 종료 시 인벤토리 및 퀵슬롯 저장을 담당하는 구조를 유지하면서, 퀵슬롯 3칸 캐시와 재전송 흐름을 추가로 정리했다. 특히 3번째 슬롯의 TID, 아이콘, 개수를 별도로 캐시하고 QuickSlotLoad 이벤트로 다시 전달하도록 확장해 출격 준비 UI와 다음 출격 복원 흐름을 자연스럽게 이어지게 만들었다.

### Current Script

## Assets/02\_Scripts/Presenter/LobbyUIPresenter.cs

### Previous Script

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LobbyUIPresenter : MonoBehaviour
{
    UIManager uiManager;        // UI 메니저 인스턴스

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnOpenLobbyUI += OpenLobby;
        GlobalEventBus.OnOpenPrepareUI += OpenSortiePrepare;
        GlobalEventBus.OnOpenRecordUI += OpenDiverRecord;
        GlobalEventBus.OnOpenStorageUI += OpenStorageInventory;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnOpenLobbyUI += OpenLobby;
        GlobalEventBus.OnOpenPrepareUI -= OpenSortiePrepare;
        GlobalEventBus.OnOpenRecordUI -= OpenDiverRecord;
        GlobalEventBus.OnOpenStorageUI -= OpenStorageInventory;
    }

    private void Start()
    {
        uiManager = UIManager.Instance;
        OpenLobby();
    }

    /* 로비 UI 전환 */
    public void OpenLobby()
    {
        // 현재 열려있는 캔버스를 닫고 준비 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<LobbyMainUI>();
    }

    /* 준비 UI 전환 */
    public void OpenSortiePrepare()
    {
        // 현재 열려있는 캔버스를 닫고 준비 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<SortiePrepareUI>();
    }

    /* 기록 UI 전환 */
    public void OpenDiverRecord()
    {
        // 현재 열려있는 캔버스를 닫고 다음 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<DiverRecordUI>();
    }

    /* 창고 UI 전환 */
    public void OpenStorageInventory()
    {
        // 현재 열려있는 캔버스를 닫고 다음 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<StorageInventoryUI>();
    }
}
```

### Modified Description

LobbyUIPresenter는 로비 UI 전환 허브 역할을 유지하면서, 출격 준비 UI와 창고 UI, 기록 카드 팝업 호출 흐름이 현재 이벤트 구조와 맞게 정리되었다. 오늘 작업 범위에서는 출격 준비 및 개인 창고 UI 연결이 로비 전환 흐름 안에서 정상적으로 이어지도록 이벤트 구독 구성이 보강되었다.

### Current Script

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LobbyUIPresenter : MonoBehaviour
{
    UIManager uiManager;        // UI 메니저 인스턴스

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnOpenLobbyUI += OpenLobby;
        GlobalEventBus.OnOpenPrepareUI += OpenSortiePrepare;
        GlobalEventBus.OnOpenRecordUI += OpenDiverRecord;
        GlobalEventBus.OnOpenStorageUI += OpenStorageInventory;
        GlobalEventBus.OnOpenRecordCardPopUpUI += OpenRecordCardPopUp;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnOpenLobbyUI -= OpenLobby;
        GlobalEventBus.OnOpenPrepareUI -= OpenSortiePrepare;
        GlobalEventBus.OnOpenRecordUI -= OpenDiverRecord;
        GlobalEventBus.OnOpenStorageUI -= OpenStorageInventory;
        GlobalEventBus.OnOpenRecordCardPopUpUI -= OpenRecordCardPopUp;
    }

    private void Start()
    {
        uiManager = UIManager.Instance;
        OpenLobby();
    }

    /* 로비 UI 전환 */
    public void OpenLobby()
    {
        // 현재 열려있는 캔버스를 닫고 준비 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<LobbyMainUI>();
    }

    /* 준비 UI 전환 */
    public void OpenSortiePrepare()
    {
        // 현재 열려있는 캔버스를 닫고 준비 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<SortiePrepareUI>();
    }

    /* 기록 UI 전환 */
    public void OpenDiverRecord()
    {
        // 현재 열려있는 캔버스를 닫고 다음 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<DiverRecordUI>();
    }

    /* 창고 UI 전환 */
    public void OpenStorageInventory()
    {
        // 현재 열려있는 캔버스를 닫고 다음 UI로 전환
        uiManager.CloseNowUI();
        uiManager.Open<StorageInventoryUI>();
    }

    /* 기록 카드 팝업 UI 전환 */
    public void OpenRecordCardPopUp(string title, CharacterTID tid)
    {
        // 팝업은 뒤의 DiverRecordUI를 닫지 않고 위에만 올린다
        RecordCardPopUpUI popup = uiManager.Open<RecordCardPopUpUI>();

        // 기록 제목과 캐릭터 ID를 팝업에 전달한다
        popup.SetData(title, tid);
    }
}
```

## Assets/02\_Scripts/System/LocalSaveRepository.cs

### Previous Script

```cs
///<summary>
/// 세이브를 읽고 쓰는 클래스 (ISaveRepository 인터페이스 상속)
///</summary>
using UnityEngine;
using System.IO;

public class LocalSaveRepository : ISaveRepository
{
    private PlayerSaveData playerSaveData;

    private string saveFilePath;        // 저장 데이터 세이브 경로

    /* 생성 시 경로 지정 */
    public LocalSaveRepository()
    {
        saveFilePath = Path.Combine(Application.persistentDataPath, "SaveFile.json");
    }

    /* 플레이어 저장 데이터 불러오기 */
    public PlayerSaveData LoadSaveData()
    {
        if (File.Exists(saveFilePath))
        {
            // 지정 경로에서 저장 데이터 가져오기
            string json = File.ReadAllText(saveFilePath);
            playerSaveData = JsonUtility.FromJson<PlayerSaveData>(json);
            return playerSaveData;
        }
        else
        {
            // 세이브 파일이 없으면 새 데이터 생성
            SaveGameData();
            return playerSaveData;
        }
    }

    /* 게임 데이터 저장 */
    public void SaveGameData()
    {
        // 데이터가 존재하지 않는다면 새로 생성
        if (playerSaveData == null)
            playerSaveData = new PlayerSaveData();

        // 지정 경로에 데이터 저장
        string json = JsonUtility.ToJson(playerSaveData, true);
        File.WriteAllText(saveFilePath, json);
        Debug.Log("Game Saved");
    }

     /* 현재 캐릭터의 동조율 레벨 리턴 */
    public int GetLinkRateLevel()
    {
        // 리스트에서 TID가 SelectCharID와 일치하는 캐릭터 데이터를 찾음
        SaveCharacterData charData = playerSaveData.myCharacters.Find(x => x.TID == playerSaveData.SelectCharID);
        if (charData != null)
        {
            return charData.linkRateLevel;
        }
        else
        {
            Debug.LogWarning($"TID가 {playerSaveData.SelectCharID}인 캐릭터 데이터를 찾을 수 없습니다.");
            return 0;
        }
    }
}
```

### Modified Description

LocalSaveRepository는 저장 데이터 로드 및 저장 책임을 유지하면서, 오늘 정리된 출격 준비 UI와 개인 창고 UI가 같은 플레이어 세이브 데이터를 기준으로 동작할 수 있도록 현재 인터페이스 기반 구조와 맞물리게 사용되었다. 이를 통해 인벤토리, 퀵슬롯, 창고 데이터가 동일한 저장소를 통해 읽히고 갱신되는 흐름을 유지했다.

### Current Script

```cs
///<summary>
/// 세이브를 읽고 쓰는 클래스 (ISaveRepository 인터페이스 상속)
///</summary>
using System.IO;
using UnityEngine;

public class LocalSaveRepository : ISaveRepository
{
    private PlayerSaveData playerSaveData;

    private string saveFilePath;        // Local save file path

    /* Initialize save path */
    public LocalSaveRepository()
    {
        saveFilePath = Path.Combine(Application.persistentDataPath, "SaveFile.json");
    }

    /* Load player save data */
    public PlayerSaveData LoadSaveData()
    {
        if (File.Exists(saveFilePath))
        {
            string json = File.ReadAllText(saveFilePath);
            playerSaveData = JsonUtility.FromJson<PlayerSaveData>(json);
            return playerSaveData;
        }
        else
        {
            SaveGameData();
            return playerSaveData;
        }
    }

    /* Save the current cached save data */
    public void SaveGameData()
    {
        if (playerSaveData == null)
            playerSaveData = new PlayerSaveData();

        string json = JsonUtility.ToJson(playerSaveData, true);
        File.WriteAllText(saveFilePath, json);
        Debug.Log("Game Saved");
    }

    /* Save externally provided save data */
    public void SaveGameData(PlayerSaveData saveData)
    {
        playerSaveData = saveData ?? new PlayerSaveData();

        string json = JsonUtility.ToJson(playerSaveData, true);
        File.WriteAllText(saveFilePath, json);
        Debug.Log("Game Saved");
    }

    /* Return the selected character's link rate level */
    public int GetLinkRateLevel()
    {
        if (playerSaveData == null)
        {
            playerSaveData = LoadSaveData();
        }

        SaveCharacterData charData = playerSaveData.myCharacters.Find(x => x.TID == playerSaveData.SelectCharID);
        if (charData != null)
        {
            return charData.linkRateLevel;
        }
        else
        {
            Debug.LogWarning($"Character data for TID {playerSaveData.SelectCharID} was not found.");
            return 0;
        }
    }
}
```

## Assets/02\_Scripts/System/Player/PlayerInventory.cs

### Previous Script

```cs
///<summary>
/// 플레이어의 인벤토리 데이터와 내부의 슬롯, 아이템을 관리하는 클래스
///</summary>
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class PlayerInventory : MonoBehaviour
{
    public List<InventorySlotData> slots = new();
    public List<InventorySlotData> quickSlots = new();
    public int slotNum { get; private set; }
    public int quickSlotNum { get; private set; }

    // 특정 슬롯 UI를 갱신할 때 사용하는 이벤트
    public event Action<int> OnSlotChanged;

    // 어드레시블로 불러온 스프라이트 주소 가져오기
    private AsyncOperationHandle<Sprite> loadHandle;

    void Awake()
    {
        slotNum = 10;
        quickSlotNum = 3;

        // 모든 슬롯 데이터 초기화
        for (int i = 0; i < slotNum; i++)
        {
            slots.Add(new InventorySlotData(0, i, 0, null));
        }
        for (int i = 0; i < quickSlotNum; i++)
        {
            quickSlots.Add(new InventorySlotData(0, i, 0, null));
        }
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnSwapInventorySlot += SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot += AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot += SwapItemQuickSlot;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnSwapInventorySlot -= SwapSlotData;
        GlobalEventBus.OnDropItemQuickSlot -= AddItemToQuickslot;
        GlobalEventBus.OnSwapItemQuickSlot -= SwapItemQuickSlot;

        // 핸들이 유효하다면 (이미 로드된 상태라면)
        if (loadHandle.IsValid())
        {
            // 메모리에서 해당 스프라이트를 안전하게 해제
            Addressables.Release(loadHandle);
        }
    }

    /* 인벤토리에 아이템 추가 또는 더해짐 */
    /* 인벤토리에 아이템 추가 및 남는 수량 반환 */
    public int AddItem(ItemData _itemData, int _count)
    {
        if (_itemData == null) return 0;

        // 동일 아이템이 이미 있으면 먼저 해당 슬롯에 누적 시도
        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID == _itemData.TID && slots[i].amount < _itemData.itemMultiple)
            {
                // 현재 수량 + 추가 수량을 합친 뒤 최대 스택 수를 넘는지 계산
                int totalAmount = slots[i].amount + _count;

                // 슬롯에는 최대 스택 수까지만 저장
                slots[i].amount = totalAmount >= _itemData.itemMultiple ? _itemData.itemMultiple : totalAmount;

                // UI 갱신 이벤트 호출
                OnSlotChanged?.Invoke(i);

                // 초과 수량 반환
                int remain = totalAmount - _itemData.itemMultiple;
                return remain > 0 ? remain : 0;
            }
        }

        // 빈 슬롯이 있으면 새 슬롯에 아이템 추가
        for (int i = 0; i < slotNum; i++)
        {
            if (slots[i].TID == 0)
            {
                slots[i].TID = _itemData.TID;

                // 아이콘 로드
                LoadSprite(_itemData.icon, i);

                // 새 슬롯에도 최대 스택 수까지만 저장
                slots[i].amount = _count >= _itemData.itemMultiple ? _itemData.itemMultiple : _count;

                // UI 갱신 이벤트 호출
                OnSlotChanged?.Invoke(i);

                // 초과 수량 반환
                int remain = _count - _itemData.itemMultiple;
                return remain > 0 ? remain : 0;
            }
        }

        // 인벤토리가 가득 차서 넣지 못한 경우 남은 수량 그대로 반환
        Debug.Log("인벤토리가 가득차서 아이템을 주울 수 없습니다.");
        return _count;
    }

    /* 아이템의 아이콘 Addressable 주소 해석 및 스프라이트 이미지 가져오기 */
    private void LoadSprite(AssetReferenceSprite iconRef, int slotIndex)
    {
        loadHandle = Addressables.LoadAssetAsync<Sprite>(iconRef);

        loadHandle.Completed += (handle) =>
        {
            // 성공적으로 가져왔는지 확인
            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                // 로드된 아이콘을 슬롯 데이터에 반영
                slots[slotIndex].icon = handle.Result;

                // 아이콘이 준비된 시점에 UI를 한 번 더 갱신
                OnSlotChanged?.Invoke(slotIndex);
            }
            else
            {
                // 필요 시 에러 로그 추가 가능
                // Debug.LogError("스프라이트를 불러오는데 실패했습니다.");
            }
        };
    }

    public void UseItem(int slotIndex)
    {
        // 유효성 검사 (빈 슬롯이 아닌지)
        if (slots[slotIndex].TID == 0) return;

        // 갯수 차감
        slots[slotIndex].amount--;

        // 갯수가 0 이하라면 슬롯 초기화 (빈 슬롯으로 만들기)
        if (slots[slotIndex].amount <= 0)
        {
            slots[slotIndex].TID = 0;
            slots[slotIndex].amount = 0;
            slots[slotIndex].icon = null; // 필요시 명시적 null 처리
        }
    }

    /* 인벤토리 슬롯 데이터를 교환 */
    public void SwapSlotData(int _index1, int _index2)
    {
        /// ※추가: 해당 아이템이 동일한 아이템이라면 존재한다면 합산 가능한지 판정 후 합산 ///

        InventorySlotData slot1 = slots[_index1];
        InventorySlotData slot2 = slots[_index2];

        // 두 데이터 교환
        (slot1.TID, slot2.TID) = (slot2.TID, slot1.TID);
        (slot1.amount, slot2.amount) = (slot2.amount, slot1.amount);
        (slot1.icon, slot2.icon) = (slot2.icon, slot1.icon);

        // 변동사항 알림
        OnSlotChanged?.Invoke(_index1);
        OnSlotChanged?.Invoke(_index2);
    }

    /* 퀵슬롯에 아이템 추가 */
    public void AddItemToQuickslot(int _quickIndex, int _slotIndex)
    {
        InventorySlotData slot = slots[_slotIndex];
        InventorySlotData qSlot = quickSlots[_quickIndex];

        // 소모품이 아닐 경우에는 퀵슬롯에 등록하지 않음
        if(slot.TID<=300 || slot.TID>=400) return;

        // 이미 퀵슬롯에 있다면 기존의 퀵슬롯 내용을 삭제
        for (int i = 0; i < quickSlotNum; i++)
        {
            if(quickSlots[i].TID==slot.TID)
            {
                GlobalEventBus.OnQuickSlotChanged?.Invoke(i, null, 0);
            }
        }

        qSlot.TID = slot.TID;
        qSlot.amount = slot.amount;
        qSlot.icon = slot.icon;

        OnSlotChanged?.Invoke(_slotIndex);
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_quickIndex, qSlot.icon, qSlot.amount);
    }

    /* 퀵슬롯 아이템 사용 */
    public void UseQuickSlotItem(int _index)
    {
        if(quickSlots[_index]==null || _index>quickSlotNum) return;

        InventorySlotData slot = quickSlots[_index];
        // 아이템 사용으로 갯수 감소
        slot.amount--;
        // 사용에 따른 퀵슬롯 변화
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index, slot.icon, slot.amount);
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

        // 변동사항 알림
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index1, slot1.icon, slot1.amount);
        GlobalEventBus.OnQuickSlotChanged?.Invoke(_index2, slot2.icon, slot2.amount);
    }
}
```

### Modified Description

PlayerInventory는 이번 작업에서 가장 큰 폭으로 정리된 스크립트 중 하나로, 인벤토리와 퀵슬롯, 상자 이동, 바닥 드랍, 저장 복원 흐름이 모두 이 구조를 기준으로 다시 맞춰졌다. AddItem이 남은 수량을 반환하도록 보강되었고, 슬롯 단위 제어를 위한 여러 헬퍼 메서드가 추가되었다. 또한 각 슬롯이 itemData를 유지하도록 보완되어 상자 이동, UI 이름 출력, 드랍 생성, 저장 복원 과정에서 메타데이터 연결이 끊기지 않게 되었다.

### Current Script

## Assets/02\_Scripts/UI/Lobby/SortiePrepareUI.cs

### Previous Script

```cs
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class SortiePrepareUI : MonoBehaviour
{
    [Header("Buttons")]
    [SerializeField] private Button buttonBackTop;                  // 상단 왼쪽 뒤로가기 버튼
    [SerializeField] private Button buttonStartSortie;              // 출격 버튼

    [Header("Diver Info")]
    [SerializeField] private TextMeshProUGUI textDiverName;         // 다이버 이름
    [SerializeField] private TextMeshProUGUI textDiverRole;         //
    [SerializeField] private TextMeshProUGUI textLinkRate;          // 동조율

    [Header("Slot 1")]
    [SerializeField] private Image imageSlotIcon1;
    [SerializeField] private TextMeshProUGUI textSlotName1;
    [SerializeField] private TextMeshProUGUI textSlotCount1;
    public int slotTID1;        //1번 슬롯 아이템의 ID값 데이터를 받아옴
    public Sprite slotSprite1;  //1번 슬롯 아이템의 아이콘 스프라이트 데이터를 받아옴
    public int slotCount1;      //1번 슬롯 아이템의 개수 데이터를 받아옴

    [Header("Slot 2")]
    [SerializeField] private Image imageSlotIcon2;
    [SerializeField] private TextMeshProUGUI textSlotName2;
    [SerializeField] private TextMeshProUGUI textSlotCount2;
    public int slotTID2;        //2번 슬롯 아이템의 ID값 데이터를 받아옴
    public Sprite slotSprite2;  //2번 슬롯 아이템의 아이콘 스프라이트 데이터를 받아옴
    public int slotCount2;      //2번 슬롯 아이템의 개수 데이터를 받아옴

    [Header("Scene")]
    [SerializeField] private string gameSceneName = "GameScene";

    [Header("Temporary Test Data")]
    [SerializeField] private int testLinkRateLevel = 0;
    [SerializeField] private string testEquippedItemSlot1 = "";
    [SerializeField] private string testEquippedItemSlot2 = "";

    private void Awake()
    {
        // {뒤로가기 버튼 이벤트 등록}
        if (buttonBackTop == null || buttonStartSortie == null)
        {
            this.enabled = false;
            Debug.Log("필수 오브젝트가 등록되지 않았습니다");
            return;
        }

        buttonBackTop.onClick.AddListener(OnClickBack);
        buttonStartSortie.onClick.AddListener(OnClickStartSortie);
    }

    private void OnEnable()
    {
        // (퀵슬롯 데이터 업데이트 이벤트 등록)
        GlobalEventBus.QuickSlotLoad += UpdateQuickSlot;

        // 출격 준비 UI 오픈 이벤트 발생
        GlobalEventBus.PrepareUIOpen?.Invoke();

        // {출격 준비 UI가 열릴 때마다 표시 정보 갱신}
        Refresh();
    }

    private void OnDestroy()
    {
        // {오브젝트 파괴 시 뒤로가기 버튼 이벤트 해제}
        if (buttonBackTop == null || buttonStartSortie == null)
        {
            this.enabled = false;
            Debug.Log("필수 오브젝트가 등록되지 않았습니다");
            return;
        }

        buttonBackTop.onClick.RemoveListener(OnClickBack);
        buttonStartSortie.onClick.RemoveListener(OnClickStartSortie);
    }

    private void UpdateQuickSlot(int index, int tid, Sprite icon, int count)
    {
        if (!gameObject.activeInHierarchy) return;

        if (index == 0)
        {
            slotTID1 = tid;
            slotSprite1 = icon;
            slotCount1 = count;
        }
        else if (index == 1)
        {
            slotTID2 = tid;
            slotSprite2 = icon;
            slotCount2 = count;
        }

        Refresh();
    }

    public void Refresh()
    {
        // {P0 고정 다이버 정보 표시}
        if (textDiverName != null)
            textDiverName.text = "유안";

        if (textDiverRole != null)
            textDiverRole.text = "메인 다이버";

        if (textLinkRate != null)
            textLinkRate.text = $"동조율 Lv.{testLinkRateLevel}";

        // {소지품 슬롯 1번 표시}
        SetSlotUI(
            testEquippedItemSlot1,
            imageSlotIcon1,
            textSlotName1,
            textSlotCount1,
            "슬롯 1"
        );

        // {소지품 슬롯 2번 표시}
        SetSlotUI(
            testEquippedItemSlot2,
            imageSlotIcon2,
            textSlotName2,
            textSlotCount2,
            "슬롯 2"
        );
    }

    private void SetSlotUI(
        string itemId,
        Image slotIcon,
        TextMeshProUGUI slotName,
        TextMeshProUGUI slotCount,
        string emptySlotName
    )
    {
        // {아이템이 장착되지 않은 슬롯 표시}
        if (string.IsNullOrEmpty(itemId))
        {
            if (slotIcon != null)
                slotIcon.enabled = false;

            if (slotName != null)
                slotName.text = emptySlotName;

            if (slotCount != null)
                slotCount.text = "[비어있음]";

            return;
        }

        // {아이템이 장착된 슬롯 표시}
        if (slotIcon != null)
            slotIcon.enabled = true;

        if (slotName != null)
            slotName.text = GetItemDisplayName(itemId);

        if (slotCount != null)
            slotCount.text = "x1";
    }

    private string GetItemDisplayName(string itemId)
    {
        // {P0 공식 아이템 ID를 화면 표시명으로 변환}
        switch (itemId)
        {
            case "mana_stone":
                return "기묘한 사탕";

            case "potion":
                return "변질된 붕대";

            default:
                return "알 수 없음";
        }
    }

    private void OnClickStartSortie()
    {
        // {현재 Canvas 비활성화}
        gameObject.SetActive(false);

        // {출격 확정 시 GameScene으로 이동}
        SceneManager.LoadScene(gameSceneName);
    }

    private void OnClickBack()
    {
        // {로비 Canvas를 다시 활성화}
        GlobalEventBus.OnOpenLobbyUI?.Invoke();

        // {현재 Canvas 비활성화}
        gameObject.SetActive(false);
    }
}
```

### Modified Description

SortiePrepareUI는 기존 2칸 중심 표시 구조에서 3칸 퀵슬롯 표시 구조로 확장되었다. QuickSlotLoad 이벤트를 통해 전달받은 실제 슬롯 데이터를 바탕으로 각 칸의 아이템 이름, 아이콘, 수량을 출력하도록 정리했고, UI가 열릴 때 퀵슬롯 캐시 재전송을 요청하고 닫힐 때 구독을 해제하도록 보완해 반복 오픈 상황에서도 상태가 꼬이지 않도록 수정했다.

### Current Script

```cs
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class SortiePrepareUI : MonoBehaviour
{
    [Header("Buttons")]
    [SerializeField] private Button buttonBackTop;                  // 상단 왼쪽 뒤로가기 버튼
    [SerializeField] private Button buttonStartSortie;              // 출격 버튼
    [SerializeField] private Button buttonChangeFromStorage;        // {창고에서 변경 버튼}

    [Header("Diver Info")]
    [SerializeField] private TextMeshProUGUI textDiverName;         // 다이버 이름
    [SerializeField] private TextMeshProUGUI textDiverRole;         //
    [SerializeField] private TextMeshProUGUI textLinkRate;          // 동조율

    [Header("Slot 1")]
    [SerializeField] private Image imageSlotIcon1;
    [SerializeField] private TextMeshProUGUI textSlotName1;
    [SerializeField] private TextMeshProUGUI textSlotCount1;
    public int slotTID1;        //1번 슬롯 아이템의 ID값 데이터를 받아옴
    public Sprite slotSprite1;  //1번 슬롯 아이템의 아이콘 스프라이트 데이터를 받아옴
    public int slotCount1;      //1번 슬롯 아이템의 개수 데이터를 받아옴

    [Header("Slot 2")]
    [SerializeField] private Image imageSlotIcon2;
    [SerializeField] private TextMeshProUGUI textSlotName2;
    [SerializeField] private TextMeshProUGUI textSlotCount2;
    public int slotTID2;        //2번 슬롯 아이템의 ID값 데이터를 받아옴
    public Sprite slotSprite2;  //2번 슬롯 아이템의 아이콘 스프라이트 데이터를 받아옴
    public int slotCount2;      //2번 슬롯 아이템의 개수 데이터를 받아옴

    [Header("Slot 3")]
    [SerializeField] private Image imageSlotIcon3;
    [SerializeField] private TextMeshProUGUI textSlotName3;
    [SerializeField] private TextMeshProUGUI textSlotCount3;
    public int slotTID3;        //2번 슬롯 아이템의 ID값 데이터를 받아옴
    public Sprite slotSprite3;  //2번 슬롯 아이템의 아이콘 스프라이트 데이터를 받아옴
    public int slotCount3;      //2번 슬롯 아이템의 개수 데이터를 받아옴

    [Header("Scene")]
    [SerializeField] private string gameSceneName = "DemoScene";

    [Header("Temporary Test Data")]
    [SerializeField] private int testLinkRateLevel = 0;

    private void Awake()
    {
        // {뒤로가기 버튼 이벤트 등록}
        if (buttonBackTop == null || buttonStartSortie == null || buttonChangeFromStorage == null)
        {
            this.enabled = false;
            Debug.Log("필수 오브젝트가 등록되지 않았습니다");
            return;
        }

        buttonBackTop.onClick.AddListener(OnClickBack);
        buttonStartSortie.onClick.AddListener(OnClickStartSortie);
        buttonChangeFromStorage.onClick.AddListener(OnClickChangeFromStorage);
    }

    private void OnEnable()
    {
        // {퀵슬롯 캐시 재전송 요청}
        GlobalEventBus.OnRequestQuickSlotCache?.Invoke();
        // (퀵슬롯 데이터 업데이트 이벤트 등록)
        GlobalEventBus.QuickSlotLoad += UpdateQuickSlot;

        // 출격 준비 UI 오픈 이벤트 발생
        GlobalEventBus.PrepareUIOpen?.Invoke();

        // {출격 준비 UI가 열릴 때마다 표시 정보 갱신}
        Refresh();
    }

    private void OnDestroy()
    {
        // {오브젝트 파괴 시 뒤로가기 버튼 이벤트 해제}
        if (buttonBackTop == null || buttonStartSortie == null || buttonChangeFromStorage == null)
        {
            this.enabled = false;
            Debug.Log("필수 오브젝트가 등록되지 않았습니다");
            return;
        }

        buttonBackTop.onClick.RemoveListener(OnClickBack);
        buttonStartSortie.onClick.RemoveListener(OnClickStartSortie);
        buttonChangeFromStorage.onClick.RemoveListener(OnClickChangeFromStorage);
    }

    private void UpdateQuickSlot(int index, int tid, Sprite icon, int count)
    {
        if (!gameObject.activeInHierarchy) return;

        if (index == 0)
        {
            slotTID1 = tid;
            slotSprite1 = icon;
            slotCount1 = count;
        }
        else if (index == 1)
        {
            slotTID2 = tid;
            slotSprite2 = icon;
            slotCount2 = count;
        }
        else if (index == 2)
        {
            slotTID3 = tid;
            slotSprite3 = icon;
            slotCount3 = count;
        }

        Refresh();
    }

    private void OnDisable()
    {
        GlobalEventBus.QuickSlotLoad -= UpdateQuickSlot;
    }

    public void Refresh()
    {
        if (textDiverName != null) textDiverName.text = "유안";
        if (textDiverRole != null) textDiverRole.text = "메인 다이버";
        if (textLinkRate != null) textLinkRate.text = $"동조율 Lv.{testLinkRateLevel}";

        SetSlotUI(slotTID1, slotSprite1, slotCount1, imageSlotIcon1, textSlotName1, textSlotCount1, "슬롯 1");
        SetSlotUI(slotTID2, slotSprite2, slotCount2, imageSlotIcon2, textSlotName2, textSlotCount2, "슬롯 2");
        SetSlotUI(slotTID3, slotSprite3, slotCount3, imageSlotIcon3, textSlotName3, textSlotCount3, "슬롯 3");
    }

    private void SetSlotUI(int tid, Sprite icon, int count, Image slotIcon, TextMeshProUGUI slotName, TextMeshProUGUI slotCount, string emptySlotName)
    {
        if (tid == 0 || count <= 0)
        {
            if (slotIcon != null) slotIcon.enabled = false;
            if (slotName != null) slotName.text = emptySlotName;
            if (slotCount != null) slotCount.text = "[비어있음]";
            return;
        }

        if (slotIcon != null)
        {
            slotIcon.sprite = icon;
            slotIcon.enabled = icon != null;
        }

        ItemData itemData = GetItemDataByTID(tid);
        if (slotName != null) slotName.text = itemData != null ? itemData.itemName : $"TID {tid}";
        if (slotCount != null) slotCount.text = $"x{count}";
    }

    private ItemData GetItemDataByTID(int tid)
    {
        if (tid == 0) return null;

        ItemData[] itemDatas = Resources.LoadAll<ItemData>("ScriptableObjects/Item");
        foreach (ItemData itemData in itemDatas)
        {
            if (itemData != null && itemData.TID == tid)
            {
                return itemData;
            }
        }

        return null;
    }

    private void OnClickStartSortie()
    {
        // {현재 Canvas 비활성화}
        gameObject.SetActive(false);

        // {출격 확정 시 GameScene으로 이동}
        SceneManager.LoadScene(gameSceneName);
    }

    private void OnClickBack()
    {
        // {로비 Canvas를 다시 활성화}
        GlobalEventBus.OnOpenLobbyUI?.Invoke();

        // {현재 Canvas 비활성화}
        gameObject.SetActive(false);
    }

    private void OnClickChangeFromStorage()
    {
        // {창고 인벤토리 UI 열기 이벤트를 호출한다}
        GlobalEventBus.OnOpenStorageUI?.Invoke();
    }
}
```

## Assets/02\_Scripts/UI/Lobby/StorageInventoryUI.cs

### Previous Script

### Modified Description

StorageInventoryUI는 개인 창고, 인벤토리, 퀵슬롯을 하나의 UI 안에서 다루는 흐름을 현재 저장 구조 기준으로 유지하도록 정리되었다. 오늘 범위에서는 저장 데이터 로드와 저장, 슬롯 간 이동, 퀵슬롯 장착 상태 유지, 특정 아이템 수량 조회 같은 기능이 현재 브랜치 구조와 충돌하지 않도록 다시 맞춰졌고, 병합 이후 남아 있던 중복 메서드 충돌 흔적도 함께 정리되었다.

### Current Script

## Assets/02\_Scripts/Utils/GlobalEventBus.cs

### Previous Script

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
    public static Action OnInteractionInput;                        // 상호작용 버튼 입력
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
    public static Func<float, bool> OnRequestManaConsume;           // 플레이어 마나 소비 요청: Func<소모량, 성공여부>
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
    public static Action OnReturnToLobby;                           // 로비로 돌아가기 이벤트 발생
    public static Action<int, bool> OnSetRecordData;                // 탈출 판정으로 다이버 기록 데이터 변경 시: Action<newLinkRateLevel, newMemoryLogUnlocked>
    public static Action<IInteractable, int> OnItemBoxOpened;       // 상자와 상호작용하여 UI를 열었을 시: Action<열린 상자, 상호작용한 플레이어 ID>

    ///<summary>
    /// UI 관리 이벤트
    ///</summary>
    public static Action OnOpenLobbyUI;                             // 로비 UI 실행
    public static Action OnOpenPrepareUI;                           // 출격 준비 UI 오픈 (LobbyMainUI → LobbyPresenter)
    public static Action PrepareUIOpen;                             // 출격 준비 UI 오픈 (SortiePrepareUI → ResultManager)
    public static Action OnOpenRecordUI;                            // 다이버/기록 UI 오픈  (LobbyMainUI → LobbyPresenter)
    public static Action RecordUIOpen;                              // 다이버/기록 UI 오픈  (DiverRecordUI → ResultManager)
    public static Action OnOpenStorageUI;                           // 개인 창고 UI 오픈
    public static Action<int, bool, bool> RecordDataLoad;           // 다이버 개인 심상 기록 데이터 전달 : Action<newLinkRateLevel, newMemoryLogUnlocked, newHasNewMemoryLog>
    public static Action OnRecordRead;                              // 다이버 개인 심상 기록 읽음


}
```

### Modified Description

GlobalEventBus는 오늘 작업에서 새로 연결된 UI 및 인벤토리 흐름을 위해 이벤트 구성을 확장했다. 인벤토리 드랍존을 통한 바닥 버리기 요청, 출격 준비 UI의 퀵슬롯 캐시 재전송 요청, 퀵슬롯 데이터 재로드, 개인 창고 UI 오픈 같은 이벤트가 현재 시스템 간 결합도를 낮춘 상태로 연결되도록 보강되었다.

### Current Script

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
    public static Action OnInteractionInput;                        // 상호작용 버튼 입력
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
    public static Func<float, bool> OnRequestManaConsume;           // 플레이어 마나 소비 요청: Func<소모량, 성공여부>
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
    public static Action OnReturnToLobby;                           // 로비로 돌아가기 이벤트 발생
    public static Action<int, bool> OnSetRecordData;                // 탈출 판정으로 다이버 기록 데이터 변경 시: Action<newLinkRateLevel, newMemoryLogUnlocked>
    public static Action<IInteractable, int> OnItemBoxOpened;       // 상자와 상호작용하여 UI를 열었을 시: Action<열린 상자, 상호작용한 플레이어 ID>

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


}
```

## Assets/02\_Scripts/Define/Data/InventorySlotData.cs

### Previous Script

```cs

///<summary>
/// 인벤토리 슬롯 하나에 해당하는 데이터 구조에 대한 클래스입니다
/// 이후 프로그램의 확장이나 기능 추가에 따라 구조가 바뀔 수 있습니다
///</summary>
using UnityEngine;
using UnityEngine.UI;

[System.Serializable]
public class InventorySlotData
{
    public int TID;         // itemData의 TID와 매칭 (0이면 빈 칸)
    public int order;       // 인벤토리상의 순서
    public int amount;      // 현재 가지고 있는 수량
    public Sprite icon;     // 아이템 이미지

    // 생성자
    public InventorySlotData(int _id, int _order, int _amount, Sprite _icon)
    {
        TID = _id;
        order = _order;
        amount = _amount;
        icon = _icon;
    }
}
```

### Modified Description

InventorySlotData는 단순한 TID, 수량, 아이콘 저장 구조에서 벗어나 itemData 자체를 함께 유지하도록 보강되었다. 이를 통해 상자 이동, 드랍 생성, UI 표시, 저장 복원 시점에 매번 메타데이터를 다시 찾지 않아도 되는 구조가 되었고, 오늘 정리한 인벤토리와 상자, 드랍 흐름의 기반 데이터 역할을 맡게 되었다.

### Current Script

```cs

///<summary>
/// ?몃깽?좊━ ?щ’ ?섎굹???대떦?섎뒗 ?곗씠??援ъ“??????대옒?ㅼ엯?덈떎
/// ?댄썑 ?꾨줈洹몃옩???뺤옣?대굹 湲곕뒫 異붽????곕씪 援ъ“媛 諛붾????덉뒿?덈떎
///</summary>
using UnityEngine;
using UnityEngine.UI;

[System.Serializable]
public class InventorySlotData
{
    public int TID;         // itemData??TID? 留ㅼ묶 (0?대㈃ 鍮?移?
    public int order;       // ?몃깽?좊━?곸쓽 ?쒖꽌
    public int amount;      // ?꾩옱 媛吏怨??덈뒗 ?섎웾
    public Sprite icon;     // ?꾩씠???대?吏
    public ItemData itemData; // ?꾩씠???곗씠??

    // ?앹꽦??
    public InventorySlotData(int _id, int _order, int _amount, Sprite _icon, ItemData _itemData = null)
    {
        TID = _id;
        order = _order;
        amount = _amount;
        icon = _icon;
        itemData = _itemData;
    }
}
```

## Assets/02\_Scripts/Presenter/InventoryPresenter.cs

### Previous Script

```cs
///<summary>
/// 아이템과 인벤토리에 관한 모든 상호작용의 중재자 역할을 수행합니다.
/// 아이템 습득 시 상황에 따라 즉시 장착하거나 인벤토리에 수납합니다.
/// 인벤토리 UI와 상자 UI의 열기/닫기 흐름도 함께 관리합니다.
///</summary>
using UnityEngine;

public class InventoryPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerInventory playerInventory;            // 플레이어 인벤토리
    private LocalInputReader localInputReader;          // 플레이어 입력 처리
    private EntityIdentity identity;                    // 플레이어 고유 ID 참조

    // 컨테이너 상태 캐시
    private ItemBox currentBox;                         // 현재 열려 있는 상자
    private bool isChestOpen;                           // 상자 UI가 열려 있는지 여부
    private PlayerStatus playerStatus;                  // 플레이어 상태

    // UI 캐시
    private InventoryUI inventoryUI;                    // 인벤토리 UI 캐시
    private ResultUI resultUI;                          // 결과창 UI 캐시
    private ChestUI chestUI;                            // 상자 UI 캐시

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerInventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();
        identity = GetComponent<EntityIdentity>();
        playerStatus = GetComponent<PlayerStatus>();

        if (playerWeapon == null || playerInventory == null || playerStatus==null || localInputReader == null || identity == null)
        {
            this.enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    private void OnEnable()
    {
        // 바닥에서 아이템이 주어졌을 때 터지는 전역 이벤트를 구독합니다
        GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

        // 상자와 상호작용했을 때 열림 요청 이벤트를 구독합니다
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

        // 입력으로 인벤토리 열기 / 닫기 요청이 들어왔을 때 실행할 메서드를 구독합니다
        localInputReader.OnInventoryOpenRequested += OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested += CloseInventoryUI;

        // 인벤토리 데이터 변경 이벤트를 구독 합니다
        playerInventory.OnSlotChanged += HandleSlotChanged;

        // 게임 종료시 이벤트
        //GlobalEventBus.OnShowGameResult += OpenResultUI;
    }

    private void OnDisable()
    {
        // 메모리 누수 방지를 위한 구독 해제
        GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;

        localInputReader.OnInventoryOpenRequested -= OpenInventoryUI;
        localInputReader.OnInventoryCloseRequested -= CloseInventoryUI;

        playerInventory.OnSlotChanged -= HandleSlotChanged;

        //GlobalEventBus.OnShowGameResult -= OpenResultUI;
    }

    ///<summary>
    /// 인벤토리 UI에서 유저가 직접 장착 버튼을 누르는 경우 (인벤토리 구현 후 개발)
    ///</summary>
    // public void OnRequestEquipWeapon(string weaponTID)
    // {}

    /* 아이템 줍기 이벤트 신호를 받았을 때 자동 장착 혹은 인벤토리 수납 수행 */
    private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
    {
        // DataManager를 통해 ID로 아이템 원본 데이터를 찾음
        ItemData data = DataManager.Instance.GetItemData(pickedItemTID);
        if (data == null) return;

        // 주운 아이템을 인벤토리에 먼저 추가 후 하위 작업 진행(이후 구현)
        // TID 100대는 무기
        if (100 < pickedItemTID && pickedItemTID < 200)
        {
            // 만약 장착하고 있는 무기가 없다면 무기를 장착하고, 그렇지 않다면 인벤토리에 수납
            if (!playerWeapon.isEquipped)
            {
                WeaponItemData weaponData = data as WeaponItemData;
                if (weaponData != null)
                    playerWeapon.EquipWeapon(weaponData);
                else
                    Debug.LogError("무기가 아닌 아이템이 잘못된 TID를 가지고 있습니다.");
            }
            else
            {
                int throwItem = playerInventory.AddItem(data, count);

                /// ※ 버려지는 아이템에 대한 로직 추가 ///
            }
        }
        // TID 300대는 소모품
        else if (300 < pickedItemTID && pickedItemTID < 400)
        {
            playerInventory.AddItem(data, count);
        }
        // TID 400대는 파밍 아이템
        else if (400 < pickedItemTID && pickedItemTID < 500)
        {
            int throwItem = playerInventory.AddItem(data, count);

            /// ※ 버려지는 아이템에 대한 로직 추가 ///
        }
        // 그 외 아이템은 알 수 없는 아이템
        else
        {
            Debug.LogWarning("Unknown item TID: " + pickedItemTID);
        }

        // DataManager의 playerData 저장
        DataManager.Instance.SaveGame();
    }

    /* 상자와 상호작용 했을 때 상자 UI와 인벤토리 UI를 함께 오픈 */
    private void HandleItemBoxOpened(IInteractable interactable, int playerID)
    {
        // 다른 플레이어가 연 상자라면 무시
        if (identity.entityID != playerID)
            return;

        // 상호작용한 대상이 ItemBox가 아니면 무시
        ItemBox box = interactable as ItemBox;
        if (box == null)
            return;

        // 현재 열린 상자 상태 저장
        currentBox = box;
        isChestOpen = true;

        // 입력 액션맵을 UI 모드로 전환
        localInputReader.SwitchToUIMap();

        // 왼쪽 인벤토리 UI 오픈
        OpenInventoryUI();

        // 오른쪽 상자 UI 오픈 및 데이터 바인딩
        chestUI = UIManager.Instance.Open<ChestUI>();
        if (chestUI == null) return;

        // 상자 UI가 닫힐 때 현재 Presenter의 CloseContainerUI를 호출하도록 연결
        chestUI.Bind(box, playerInventory, CloseContainerUI);
    }

    /* 특정 칸의 인벤토리 슬롯이 바뀌었을 때 해당 칸을 갱신함 */
    private void HandleSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy) return;

        inventoryUI.UpdateSlot(index, playerInventory.slots[index]);
    }

    /* 인벤토리 UI 활성화 */
    public void OpenInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 창 조작을 수행하지 않음
        if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

        // 인벤토리 UI 활성화 및 UI 오브젝트 캐시 저장
        inventoryUI = UIManager.Instance.Open<InventoryUI>();
        if (inventoryUI == null) return;

        // 인벤토리 첫 실행시 슬롯 생성
        inventoryUI.CreatSlots(playerInventory.slotNum);

        // 인벤토리의 아이템 상태를 동기화
        for (int i = 0; i < playerInventory.slotNum; i++)
            inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
    }

    /* 인벤토리 UI 비활성화 */
    public void CloseInventoryUI()
    {
        // 플레이어 상태가 idle이 아니면 인벤토리 창 조작을 수행하지 않음
        if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

        // 상자 UI가 열려 있으면 인벤토리만 따로 닫지 않고 컨테이너 UI 전체를 닫음
        if (isChestOpen)
        {
            CloseContainerUI();
            return;
        }

        UIManager.Instance.Close<InventoryUI>();
        inventoryUI = null;

        // 일반 인벤토리를 닫았을 때는 다시 플레이 조작으로 복귀
        localInputReader.SwitchToPlayerMap();
    }

    /* 상자 UI와 인벤토리 UI를 함께 닫음 */
    public void CloseContainerUI()
    {
        // 현재 열려 있던 상자의 열림 상태 해제
        if (currentBox != null)
            currentBox.CloseBox();

        // 상자 UI와 인벤토리 UI를 함께 닫음
        UIManager.Instance.Close<ChestUI>();
        UIManager.Instance.Close<InventoryUI>();

        // 캐시 및 상태값 초기화
        chestUI = null;
        inventoryUI = null;
        currentBox = null;
        isChestOpen = false;

        // 입력 액션맵을 다시 플레이어 모드로 전환
        localInputReader.SwitchToPlayerMap();
    }

    private void OpenResultUI(bool _result)
    {
        Debug.Log("결과 창 패널을 출력합니다...");
        // UIManager에서 Canvas-ResultPanel을 받아와 실행
        resultUI = UIManager.Instance.Open<ResultUI>();

        if (resultUI == null) return;
        resultUI.UpdateResultUI(_result);
    }

    public int FindItemCount(int _tid)
    {
        foreach (InventorySlotData slot in playerInventory.slots)
        {
            if (slot.TID == _tid)
            {
                return slot.amount;
            }
        }
        return 0;
    }
}
```

### Modified Description

InventoryPresenter는 인벤토리 UI, 상자 UI, 바닥 아이템 픽업과 드랍을 중재하는 역할을 기준으로 다시 정리되었다. 바닥 아이템을 실제로 얼마나 주울 수 있었는지를 계산하는 TryPickUpItem이 추가되었고, 일반 인벤토리와 상자 UI 상태를 구분해 드랍존 사용 가능 여부와 입력 모드 전환을 나누었다. 또한 인벤토리 드랍 요청 이벤트를 받아 플레이어 앞에 아이템을 떨어뜨리는 흐름도 이 스크립트에 연결되었다.

### Current Script

## Assets/02\_Scripts/System/DropItem.cs

### Previous Script

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DropItem : MonoBehaviour, IInteractable
{
    public ItemData itemData;   // 드롭 아이템이 가지고 있는 아이템 데이터
    public int stackCount;      // 쌓여있는 갯수

    public bool Interact(int playerID)
    {
        // 이벤트 버스에 아이템 TID 전송
        GlobalEventBus.OnItemPickedUp?.Invoke(playerID, itemData.TID, stackCount);
        Destroy(gameObject);

        return true;    // 상호작용 성공, 상호작용 리스트에서 삭제 요청
    }
}
```

### Modified Description

DropItem은 오늘 버그 수정의 핵심 대상 중 하나였다. 기존에는 아이템 픽업 성공 여부와 무관하게 오브젝트를 즉시 삭제했지만, 현재는 플레이어의 실제 픽업 처리 결과를 확인한 뒤 전부 주웠을 때만 삭제하고, 일부만 주웠으면 남은 수량을 유지하며, 아예 못 주웠으면 바닥에 그대로 남도록 구조가 바뀌었다. 이로 인해 인벤토리가 가득 찼을 때 바닥 아이템이 증발하던 문제가 해결되었다.

### Current Script

```cs
using UnityEngine;

///<summary>
/// 諛붾떏???⑥뼱???덈뒗 ?꾩씠???ㅻ툕?앺듃.
/// ?뚮젅?댁뼱媛 ?곹샇?묒슜?섎㈃ ?ㅼ젣濡?二쇱슱 ???덈뒗 ?섎웾留??몃깽?좊━??諛섏쁺?쒕떎.
///</summary>
public class DropItem : MonoBehaviour, IInteractable
{
    public ItemData itemData;   // ?쒕엻 ?꾩씠?쒖씠 媛吏怨??덈뒗 ?ㅼ젣 ?꾩씠???곗씠??    public int stackCount;      // 諛붾떏???⑥븘 ?덈뒗 ?섎웾

    public bool Interact(int playerID)
    {
        if (itemData == null || stackCount <= 0)
        {
            Debug.LogWarning("DropItem: ?좏슚?섏? ?딆? ?쒕엻 ?꾩씠???곗씠?곗엯?덈떎.");
            return false;
        }

        if (!TryFindPicker(playerID, out MonoBehaviour pickupHandler))
        {
            Debug.LogWarning($"DropItem: playerID={playerID} ???대떦?섎뒗 ?쎌뾽 泥섎━ ??곸쓣 李얠? 紐삵뻽?듬땲??");
            return false;
        }

        int remain = InvokePickupHandler(pickupHandler);
        if (remain >= stackCount)
        {
            Debug.Log("?몃깽?좊━媛 媛??李⑥꽌 ?꾩씠?쒖쓣 二쇱슱 ???놁뒿?덈떎.");
            return false;
        }

        stackCount = remain;

        // ?꾨? 二쇱썱?쇰㈃ ?붾뱶 ?꾩씠?쒖쓣 ?쒓굅?쒕떎.
        if (stackCount <= 0)
        {
            Destroy(gameObject);
            return true;
        }

        // ?쇰?留?二쇱슫 寃쎌슦?먮뒗 諛붾떏???④꺼 ?붾떎.
        return false;
    }

    ///<summary>
    /// ?곹샇?묒슜???뚮젅?댁뼱 ID? ?쇱튂?섎뒗 ?쎌뾽 泥섎━ ??곸쓣 李얜뒗??
    ///</summary>
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

    ///<summary>
    /// PresenterAD瑜?吏곸젒 李몄“?섏? ?딄퀬 TryPickUpItem 硫붿꽌?쒕? ?몄텧?쒕떎.
    ///</summary>
    private int InvokePickupHandler(MonoBehaviour pickupHandler)
    {
        if (pickupHandler == null)
            return stackCount;

        var pickupMethod = pickupHandler.GetType().GetMethod("TryPickUpItem");
        if (pickupMethod == null)
        {
            Debug.LogWarning("DropItem: TryPickUpItem 硫붿꽌?쒕? 李얠? 紐삵뻽?듬땲??");
            return stackCount;
        }

        object result = pickupMethod.Invoke(pickupHandler, new object[] { itemData, stackCount });
        if (result is int remain)
            return remain;

        Debug.LogWarning("DropItem: TryPickUpItem 諛섑솚媛믪쓣 泥섎━?섏? 紐삵뻽?듬땲??");
        return stackCount;
    }
}
```

## Assets/02\_Scripts/System/ItemBox.cs

### Previous Script

### Modified Description

ItemBox는 상자 내부 데이터를 고정 슬롯 기반으로 관리하는 구조로 다시 정리되었다. 상자 안의 각 칸을 비우거나 수량을 줄이고, 같은 아이템은 스택 처리하고, 남은 수량은 그대로 유지하는 식의 부분 이동 구조가 구현되었으며, 상자가 비어도 UI가 즉시 닫히지 않고 플레이어가 직접 닫는 현재 흐름에 맞게 동작하도록 수정되었다.

### Current Script

## Assets/02\_Scripts/System/Player/LocalInputReader.cs

### Previous Script

```cs
///<summary>
/// 로컬 입력을 읽어서 글로벌 이벤트 버스에 전달하는 역할을 하는 클래스
/// 'Player input'에 등록되는 모든 메서드들이 정리되어 있습니다
///</summary>
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class LocalInputReader : MonoBehaviour
{
    // 참조 컴포넌트
    PlayerInput playerInput;
    public event Action OnInventoryOpenRequested;
    public event Action OnInventoryCloseRequested;

    private void Awake()
    {
        playerInput = GetComponentInParent<PlayerInput>();

        // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
        if(playerInput==null)
        {
            this.enabled = false;
            Debug.LogError("LocalInputReader: 필요한 컴포넌트가 없습니다.");
            return;
        }
    }

    // 플레이어의 입력을 받아 글로벌 이벤트 변수에 전달하는 함수들

    /* 플레이어 이동 입력 처리 */
    public void OnMove(InputAction.CallbackContext context)
    {
        Vector2 moveInput = context.ReadValue<Vector2>();

        GlobalEventBus.OnPlayerMove?.Invoke(moveInput);
    }

    /* 플레이어 공격 입력 처리 */
    public void OnAttack(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            GlobalEventBus.OnAttackInput?.Invoke();
        }
    }

    /* 플레이어 상호작용 입력 처리 */
    public void OnInteract(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            GlobalEventBus.OnInteractionInput?.Invoke();
        }
    }

    public void OnAimPosition(InputAction.CallbackContext context)
    {
        // 마우스의 2D 픽셀 좌표를 읽어서 이벤트 버스로 전송
        Vector2 mousePos = context.ReadValue<Vector2>();
        GlobalEventBus.OnMousePositionInput?.Invoke(mousePos);
    }

    public void OpenInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            SwitchToUIMap();
            OnInventoryOpenRequested?.Invoke();
        }
    }

    public void CloseInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            OnInventoryCloseRequested?.Invoke();
        }
    }

    public void OnUseQuickSlot(InputAction.CallbackContext context)
    {
        if(context.performed)
        {
            // Scale값을 float로 읽어옴
            float rawValue = context.ReadValue<float>();
            // int로 형변환 하여 인덱스로 사용
            int slotIndex = (int)rawValue;
            // 퀵슬롯 사용 요청
            GlobalEventBus.OnQuickSlotUseRequested?.Invoke(slotIndex);
        }
    }
    /* 액션맵을 UI 모드로 전환 */
    public void SwitchToUIMap()
    {
        playerInput.SwitchCurrentActionMap("UI");
    }

    /* 액션맵을 플레이어 모드로 전환 */
    public void SwitchToPlayerMap()
    {
        playerInput.SwitchCurrentActionMap("Player");
    }
}
```

### Modified Description

LocalInputReader는 인벤토리 오픈 상태를 별도로 관리하도록 보완되었다. 일반 인벤토리를 열었을 때 이동과 상호작용까지 모두 막히지 않도록 하고, 공격과 퀵슬롯 사용만 제한하며, 상자 UI를 열었을 때만 UI 액션맵으로 전환되도록 분리함으로써 인벤토리 조작과 플레이 조작의 충돌을 줄였다.

### Current Script

```cs
///<summary>
/// 濡쒖뺄 ?낅젰???쎌뼱??湲濡쒕쾶 ?대깽??踰꾩뒪???꾨떖?섎뒗 ??븷???섎뒗 ?대옒??
/// 'Player input'???깅줉?섎뒗 紐⑤뱺 硫붿꽌?쒕뱾???뺣━?섏뼱 ?덉뒿?덈떎
///</summary>
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class LocalInputReader : MonoBehaviour
{
    // 李몄“ 而댄룷?뚰듃
    PlayerInput playerInput;
    public event Action OnInventoryOpenRequested;
    public event Action OnInventoryCloseRequested;
    private bool isInventoryOpen;

    private void Awake()
    {
        playerInput = GetComponentInParent<PlayerInput>();

        // ?꾩닔 而댄룷?뚰듃媛 議댁옱?섏? ?딆쓣 ???ㅽ겕由쏀듃 鍮꾪솢?깊솕
        if(playerInput==null)
        {
            this.enabled = false;
            Debug.LogError("LocalInputReader: ?꾩슂??而댄룷?뚰듃媛 ?놁뒿?덈떎.");
            return;
        }
    }

    // ?뚮젅?댁뼱???낅젰??諛쏆븘 湲濡쒕쾶 ?대깽??蹂?섏뿉 ?꾨떖?섎뒗 ?⑥닔??

    /* ?뚮젅?댁뼱 ?대룞 ?낅젰 泥섎━ */
    public void OnMove(InputAction.CallbackContext context)
    {
        Vector2 moveInput = context.ReadValue<Vector2>();

        GlobalEventBus.OnPlayerMove?.Invoke(moveInput);
    }

    /* ?뚮젅?댁뼱 怨듦꺽 ?낅젰 泥섎━ */
    public void OnAttack(InputAction.CallbackContext context)
    {
        if (isInventoryOpen)
            return;

        if (context.performed)
        {
            GlobalEventBus.OnAttackInput?.Invoke();
        }
    }

    /* ?뚮젅?댁뼱 ?곹샇?묒슜 ?낅젰 泥섎━ */
    public void OnInteract(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            GlobalEventBus.OnInteractionInput?.Invoke();
        }
    }

    public void OnAimPosition(InputAction.CallbackContext context)
    {
        // 留덉슦?ㅼ쓽 2D ?쎌? 醫뚰몴瑜??쎌뼱???대깽??踰꾩뒪濡??꾩넚
        Vector2 mousePos = context.ReadValue<Vector2>();
        GlobalEventBus.OnMousePositionInput?.Invoke(mousePos);
    }

    public void OpenInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            if (isInventoryOpen)
                OnInventoryCloseRequested?.Invoke();
            else
                OnInventoryOpenRequested?.Invoke();
        }
    }

    public void CloseInventoryUI(InputAction.CallbackContext context)
    {
        if (context.performed)
        {
            OnInventoryCloseRequested?.Invoke();
        }
    }

    public void OnUseQuickSlot(InputAction.CallbackContext context)
    {
        if (isInventoryOpen)
            return;

        if(context.performed)
        {
            // Scale媛믪쓣 float濡??쎌뼱??
            float rawValue = context.ReadValue<float>();
            // int濡??뺣????섏뿬 ?몃뜳?ㅻ줈 ?ъ슜
            int slotIndex = (int)rawValue;
            // ?듭뒳濡??ъ슜 ?붿껌
            GlobalEventBus.OnQuickSlotUseRequested?.Invoke(slotIndex);
        }
    }
    /* ?≪뀡留듭쓣 UI 紐⑤뱶濡??꾪솚 */
    public void SwitchToUIMap()
    {
        playerInput.SwitchCurrentActionMap("UI");
    }

    /* ?≪뀡留듭쓣 ?뚮젅?댁뼱 紐⑤뱶濡??꾪솚 */
    public void SwitchToPlayerMap()
    {
        playerInput.SwitchCurrentActionMap("Player");
    }

    public void SetInventoryOpenState(bool isOpen)
    {
        isInventoryOpen = isOpen;
    }
}
```

## Assets/02\_Scripts/UI/Game/ChestSlotUI.cs

### Previous Script

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class ChestSlotUI : MonoBehaviour, IPointerClickHandler
{
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;

    private ChestUI chestUI;
    private int slotIndex;

    public void Initialize(ChestUI owner, int index)
    {
        chestUI = owner;
        slotIndex = index;
        UpdateSlot(0, null);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Right)
            chestUI.TryMoveToInventory(slotIndex);
    }
}
```

### Modified Description

ChestSlotUI는 고정 슬롯 기반 ChestUI 구조에 맞춰 상자 슬롯 하나의 표시와 입력 전달을 담당하도록 정리되었다. 상자 슬롯 더블클릭, 인벤토리 슬롯과의 드래그 앤 드랍, 상자와 인벤토리 간 부분 이동 흐름이 현재 ChestUI 구조와 자연스럽게 연결되도록 수정되었다.

### Current Script

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

///<summary>
/// 체스트 슬롯 1칸의 표시와 입력을 담당한다.
/// 우클릭으로 인벤토리 이동, 드래그 앤 드롭으로 슬롯 지정 이동을 처리한다.
///</summary>
public class ChestSlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    private ChestUI chestUI;
    private int slotIndex;
    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    public int SlotIndex => slotIndex;
    public ChestUI OwnerUI => chestUI;

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();

        // 프리팹에 수동 연결이 빠졌을 때를 대비해 같은 이름의 자식을 자동으로 찾는다.
        if (itemInfo == null)
            itemInfo = transform.Find("ItemInfo");

        if (itemInfo != null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
    }

    public void Initialize(ChestUI owner, int index)
    {
        chestUI = owner;
        slotIndex = index;
        UpdateSlot(0, null);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button == PointerEventData.InputButton.Right)
            chestUI.TryMoveToInventory(slotIndex);
    }

    public void OnBeginDrag(PointerEventData eventData)
    {
        if (mainCanvas == null || itemInfo == null || !itemImg.enabled)
            return;

        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;
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
    }

    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (droppedObj.TryGetComponent<InventorySlotUI>(out var inventorySlot))
            chestUI.TryMoveFromInventorySlot(inventorySlot.slotIndex, slotIndex);
    }
}
```

## Assets/02\_Scripts/UI/Game/ChestUI.cs

### Previous Script

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class ChestUI : MonoBehaviour
{
    [SerializeField] private Transform slotContainer;
    [SerializeField] private GameObject slotPrefab;
    [SerializeField] private List<GameObject> slotsObj = new();
    [SerializeField] private Button closeButton;

    private ItemBox itemBox;
    private PlayerInventory playerInventory;
    private Action onCloseRequested;

    private void Awake()
    {
        if (closeButton != null)
            closeButton.onClick.AddListener(CloseUI);
    }

    public void Bind(ItemBox box, PlayerInventory inventory, Action closeRequested = null)
    {
        itemBox = box;
        playerInventory = inventory;
        onCloseRequested = closeRequested;

        CreateSlots(itemBox.Items.Count);
        RefreshAll();
    }

    public void CreateSlots(int count)
    {
        foreach (var obj in slotsObj)
            Destroy(obj);

        slotsObj.Clear();

        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            ChestSlotUI slotUI = newSlot.GetComponent<ChestSlotUI>();
            slotUI.Initialize(this, i);
            slotsObj.Add(newSlot);
        }
    }

    public void RefreshAll()
    {
        for (int i = 0; i < slotsObj.Count; i++)
        {
            ChestSlotUI slotUI = slotsObj[i].GetComponent<ChestSlotUI>();
            BoxItemEntry entry = itemBox.GetItem(i);

            if (entry == null || entry.itemData == null)
                slotUI.UpdateSlot(0, null);
            else
                LoadSlotIcon(slotUI, entry);
        }
    }

    public void TryMoveToInventory(int slotIndex)
    {
        BoxItemEntry entry = itemBox.GetItem(slotIndex);
        if (entry == null || entry.itemData == null || entry.amount <= 0)
            return;

        int remain = playerInventory.AddItem(entry.itemData, entry.amount);
        int moved = entry.amount - remain;

        if (moved <= 0)
            return;

        itemBox.RemoveAmount(slotIndex, moved);

        CreateSlots(itemBox.Items.Count);
        RefreshAll();

        if (itemBox.IsEmpty())
            CloseUI();
    }

    public void CloseUI()
    {
        onCloseRequested?.Invoke();
    }

    private void LoadSlotIcon(ChestSlotUI slotUI, BoxItemEntry entry)
    {
        if (slotUI == null || entry == null || entry.itemData == null)
            return;

        AsyncOperationHandle<Sprite> handle = Addressables.LoadAssetAsync<Sprite>(entry.itemData.icon);
        handle.Completed += operation =>
        {
            if (slotUI == null)
                return;

            if (operation.Status == AsyncOperationStatus.Succeeded)
                slotUI.UpdateSlot(entry.amount, operation.Result);
            else
                slotUI.UpdateSlot(entry.amount, null);

            Addressables.Release(operation);
        };
    }
}
```

### Modified Description

ChestUI는 상자 데이터를 읽어 고정 개수 슬롯을 생성하고 갱신하는 구조로 다시 정리되었다. 상자에서 인벤토리로, 인벤토리에서 상자로 아이템을 이동할 때 전부 이동하지 못한 수량은 남겨 두도록 처리했으며, 상자 내용이 비어도 UI는 유지되고 닫기 처리는 Presenter 콜백을 통해 이뤄지도록 역할이 분리되었다.

### Current Script

```cs
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

///<summary>
/// 상자 UI를 관리하는 스크립트
/// 상자 슬롯은 고정 개수로 한 번만 생성하고,
/// 이후에는 슬롯 내용을 갱신하는 방식으로 동작한다.
///</summary>
public class ChestUI : MonoBehaviour
{
    [Header("Chest UI")]
    [SerializeField] private Transform slotContainer;           // 체스트 슬롯이 생성될 부모
    [SerializeField] private GameObject slotPrefab;             // 체스트 슬롯 프리팹
    [SerializeField] private List<GameObject> slotsObj = new(); // 생성된 슬롯 오브젝트 목록
    [SerializeField] private Button closeButton;                // 닫기 버튼

    private ItemBox itemBox;                                    // 현재 열려 있는 상자 데이터
    private PlayerInventory playerInventory;                    // 플레이어 인벤토리 참조
    private Action onCloseRequested;                            // 닫기 요청 콜백

    public static ChestUI ActiveUI { get; private set; }        // 현재 열려 있는 체스트 UI

    private void Awake()
    {
        if (closeButton != null)
            closeButton.onClick.AddListener(CloseUI);
    }

    private void OnDisable()
    {
        if (ActiveUI == this)
            ActiveUI = null;
    }

    private void OnDestroy()
    {
        if (closeButton != null)
            closeButton.onClick.RemoveListener(CloseUI);
    }

    ///<summary>
    /// 체스트 UI와 상자 데이터를 연결한다.
    /// 상자 슬롯 개수만큼 슬롯을 만들고, 내용을 갱신한다.
    ///</summary>
    public void Bind(ItemBox box, PlayerInventory inventory, Action closeRequested = null)
    {
        itemBox = box;
        playerInventory = inventory;
        onCloseRequested = closeRequested;
        ActiveUI = this;

        if (itemBox == null)
            return;

        // 고정 슬롯 개수 기준으로 슬롯 생성
        CreateSlots(itemBox.SlotCount);

        // 현재 상자 내용으로 슬롯 갱신
        RefreshAll();
    }

    ///<summary>
    /// 슬롯을 count개 생성한다.
    /// 이미 같은 개수로 만들어져 있으면 다시 만들지 않는다.
    ///</summary>
    public void CreateSlots(int count)
    {
        if (slotsObj.Count == count)
            return;

        // 기존 슬롯 제거
        for (int i = 0; i < slotsObj.Count; i++)
        {
            if (slotsObj[i] != null)
                Destroy(slotsObj[i]);
        }

        slotsObj.Clear();

        // 새 슬롯 생성
        for (int i = 0; i < count; i++)
        {
            GameObject newSlot = Instantiate(slotPrefab, slotContainer);
            ChestSlotUI slotUI = newSlot.GetComponent<ChestSlotUI>();

            if (slotUI != null)
                slotUI.Initialize(this, i);

            slotsObj.Add(newSlot);
        }
    }

    ///<summary>
    /// 모든 슬롯의 UI를 현재 상자 데이터 기준으로 갱신한다.
    ///</summary>
    public void RefreshAll()
    {
        if (itemBox == null)
            return;

        for (int i = 0; i < slotsObj.Count; i++)
        {
            RefreshSlot(i);
        }
    }

    ///<summary>
    /// 특정 슬롯 하나만 갱신한다.
    ///</summary>
    public void RefreshSlot(int slotIndex)
    {
        if (itemBox == null)
            return;

        if (slotIndex < 0 || slotIndex >= slotsObj.Count)
            return;

        ChestSlotUI slotUI = slotsObj[slotIndex].GetComponent<ChestSlotUI>();
        if (slotUI == null)
            return;

        BoxItemEntry entry = itemBox.GetItem(slotIndex);

        // 슬롯이 비어 있으면 빈 칸으로 갱신
        if (entry == null || entry.itemData == null || entry.amount <= 0)
        {
            slotUI.UpdateSlot(0, null);
            return;
        }

        // 아이콘이 필요한 슬롯이면 비동기로 불러와서 갱신
        LoadSlotIcon(slotUI, entry);
    }

    ///<summary>
    /// 체스트 슬롯의 아이템을 인벤토리로 옮긴다.
    /// 인벤토리에 다 못 들어간 수량은 상자에 남긴다.
    ///</summary>
    public void TryMoveToInventory(int slotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        BoxItemEntry entry = itemBox.GetItem(slotIndex);
        if (entry == null || entry.itemData == null || entry.amount <= 0)
            return;

        int remain = playerInventory.AddItem(entry.itemData, entry.amount);
        int movedAmount = entry.amount - remain;

        if (movedAmount <= 0)
            return;

        itemBox.RemoveAmount(slotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 체스트 슬롯의 아이템을 인벤토리의 특정 칸으로 옮긴다.
    /// 비어 있는 칸이거나 같은 아이템 스택일 때만 이동된다.
    ///</summary>
    public void TryMoveToInventorySlot(int chestSlotIndex, int inventorySlotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        BoxItemEntry entry = itemBox.GetItem(chestSlotIndex);
        if (entry == null || entry.itemData == null || entry.amount <= 0)
            return;

        int remain = playerInventory.TryAddToSlot(inventorySlotIndex, entry.itemData, entry.amount);
        int movedAmount = entry.amount - remain;

        if (movedAmount <= 0)
            return;

        itemBox.RemoveAmount(chestSlotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 인벤토리 슬롯의 아이템을 상자 안으로 옮긴다.
    /// 먼저 같은 아이템 스택을 채우고, 남는 수량은 빈 슬롯에 넣는다.
    ///</summary>
    public void TryMoveFromInventory(int inventorySlotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        InventorySlotData inventorySlot = playerInventory.GetSlot(inventorySlotIndex);
        if (inventorySlot == null || playerInventory.IsSlotEmpty(inventorySlotIndex))
            return;

        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);
        if (itemData == null)
            return;

        int remain = itemBox.TryAddItem(itemData, inventorySlot.amount);
        int movedAmount = inventorySlot.amount - remain;

        if (movedAmount <= 0)
            return;

        playerInventory.RemoveAmount(inventorySlotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 인벤토리 슬롯의 아이템을 상자의 특정 칸으로 옮긴다.
    /// 대상 칸이 비어 있거나 같은 아이템 스택일 때만 이동된다.
    ///</summary>
    public void TryMoveFromInventorySlot(int inventorySlotIndex, int chestSlotIndex)
    {
        if (itemBox == null || playerInventory == null)
            return;

        InventorySlotData inventorySlot = playerInventory.GetSlot(inventorySlotIndex);
        if (inventorySlot == null || playerInventory.IsSlotEmpty(inventorySlotIndex))
            return;

        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);
        if (itemData == null)
            return;

        int remain = itemBox.TryAddToSlot(chestSlotIndex, itemData, inventorySlot.amount);
        int movedAmount = inventorySlot.amount - remain;

        if (movedAmount <= 0)
            return;

        playerInventory.RemoveAmount(inventorySlotIndex, movedAmount);
        RefreshAll();
    }

    ///<summary>
    /// 상자 UI를 닫는다.
    /// 실제 닫기 처리는 Presenter 쪽 콜백에 맡긴다.
    ///</summary>
    public void CloseUI()
    {
        onCloseRequested?.Invoke();
    }

    ///<summary>
    /// 슬롯 아이콘을 Addressables로 불러와 갱신한다.
    ///</summary>
    private void LoadSlotIcon(ChestSlotUI slotUI, BoxItemEntry entry)
    {
        if (slotUI == null || entry == null || entry.itemData == null)
            return;

        AsyncOperationHandle<Sprite> handle = Addressables.LoadAssetAsync<Sprite>(entry.itemData.icon);

        handle.Completed += operation =>
        {
            if (slotUI == null)
                return;

            if (operation.Status == AsyncOperationStatus.Succeeded)
                slotUI.UpdateSlot(entry.amount, operation.Result);
            else
                slotUI.UpdateSlot(entry.amount, null);

            Addressables.Release(operation);
        };
    }
}
```

## Assets/02\_Scripts/UI/Game/InventoryDropZoneUI.cs

### Previous Script

```txt
신규 추가 스크립트로 이전 버전 없음
```

### Modified Description

InventoryDropZoneUI는 이번 작업에서 새로 추가된 스크립트로, 인벤토리 슬롯을 드래그해 바닥 버리기 영역에 놓았을 때 실제 드랍 요청 이벤트를 발생시키는 역할을 맡는다. 이를 통해 기존 슬롯 UI는 입력만 전달하고, 실제 월드 드랍 생성은 Presenter가 담당하는 느슨한 연결 구조를 만들었다.

### Current Script

```cs
using UnityEngine;
using UnityEngine.EventSystems;

///<summary>
/// 인벤토리 아이템을 바닥에 버릴 때 사용하는 드롭존 UI이다.
/// 인벤토리 슬롯이 이 영역에 드롭되면 Presenter 쪽으로 버리기 요청을 전달한다.
///</summary>
public class InventoryDropZoneUI : MonoBehaviour, IDropHandler
{
    public void OnDrop(PointerEventData eventData)
    {
        GameObject droppedObj = eventData.pointerDrag;
        if (droppedObj == null)
            return;

        if (!droppedObj.TryGetComponent<InventorySlotUI>(out var inventorySlot))
            return;

        GlobalEventBus.OnInventoryDropRequested?.Invoke(inventorySlot.slotIndex);
    }
}
```

## Assets/02\_Scripts/UI/Game/InventorySlotUI.cs

### Previous Script

```cs
///<summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
///</summary>
using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("슬롯 내 요소")]
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    public int slotIndex { get; set; }

    // 드래그 기능 관련 변수
    private CanvasGroup canvasGroup;
    private InventoryUI inventoryUI;
    private Canvas mainCanvas;
    public event Action<int, int> OnSlotDrop;             // 슬롯이 드롭 되었을 때 이벤트

    private void Awake()
    {
        mainCanvas = GetComponentInParent<Canvas>();
        inventoryUI = GetComponentInParent<InventoryUI>();

        if(mainCanvas==null || inventoryUI==null)
        {
            this.enabled = false;
            Debug.LogError("InventorySlotUI: 필요한 컴포넌트가 없습니다.");
            return;
        }

        if(itemInfo!=null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();
    }

    /* 슬롯 초기화 */
    public void Initialize(int index)
    {
        itemImg.enabled = false;
        itemStack.text = "";
        slotIndex = index;
    }

    /* 해당 슬롯의 UI를 변경하는 함수 (아이템 갯수, 스프라이트 이미지) */
    public void UpdateSlot(int _stack, Sprite _sprite)
    {
        // 들어있는 아이템이 없을 경우 빈 공간으로 초기화
        if(_stack==0 || _sprite==null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemStack.text = $"{_stack}";
        itemImg.sprite = _sprite;
        itemImg.enabled = true;
    }

    /* 드래그 시작 시 호출 */
    public void OnBeginDrag(PointerEventData eventData)
    {
        // 빈 슬롯이여서 옮길 아이콘이 없다면 드래그 취소
        if(itemInfo==null || !itemImg.enabled) return;

        // 캔버스 최상단으로 올려 가장 위에 보이게 함
        itemInfo.SetParent(mainCanvas.transform);
        itemInfo.SetAsLastSibling();

        // 아이콘의 마우스 방해 끄기
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = false;
    }

    /* 드래그 중 지속적으로 호출 */
    public void OnDrag(PointerEventData eventData)
    {
        itemInfo.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        // 아이콘의 마우스 방해 다시 켜기
        if (canvasGroup != null)
            canvasGroup.blocksRaycasts = true;

        // 만약 자식이 다른 슬롯에 드래그되지 못했다면 원위치로 복귀
        if (itemInfo.parent == mainCanvas.transform)
        {
            itemInfo.SetParent(this.transform);
            itemInfo.localPosition = Vector3.zero; // 한가운데로 정렬
        }
    }

    /* 자신의 위에 무언가 드롭 되었을 떄 호출 */
    public void OnDrop(PointerEventData eventData)
    {
        // 직전까지 유저가 드래그하던 오브젝트
        GameObject droppedObj = eventData.pointerDrag;

        if(droppedObj!=null)
        {
            if(droppedObj.TryGetComponent<InventorySlotUI>(out var originSlot))
            {
                if(originSlot == this) return;

                // 두 슬롯간에 교환이 있었음을 방송
                GlobalEventBus.OnSwapInventorySlot(slotIndex, originSlot.slotIndex);
            }
        }
    }
}
```

### Modified Description

InventorySlotUI는 드래그 시작과 종료 시 드랍존을 표시하고 숨기는 현재 인벤토리 드랍 흐름에 맞춰 보강되었다. 슬롯 인덱스와 표시 데이터는 유지하면서, 바닥 버리기 UI와 상자 및 인벤토리 이동 입력이 동시에 작동할 수 있도록 연결 지점이 정리되었다.

### Current Script

```cs
///<summary>
/// ?몃깽?좊━ ?щ’ 1移몄쓽 ?쒖떆? ?낅젰???대떦?쒕떎.
/// ?몃깽?좊━ ?щ’?쇰━???꾩튂 援먰솚, 泥댁뒪?몄????고겢由??대룞, ?쒕옒洹????쒕∼ ?대룞??泥섎━?쒕떎.
///</summary>
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    [Header("?щ’ UI ?붿냼")]
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;

    private InventoryUI inventoryUI;

    public int slotIndex { get; set; }

    private CanvasGroup canvasGroup;
    private Canvas mainCanvas;

    private void Awake()
    {

        inventoryUI = GetComponentInParent<InventoryUI>();
        mainCanvas = GetComponentInParent<Canvas>();

        // ?꾨━?뱀뿉 ?섎룞 ?곌껐??鍮좎죱???뚮? ?鍮꾪빐 媛숈? ?대쫫???먯떇???먮룞?쇰줈 李얜뒗??
        if (itemInfo == null)
            itemInfo = transform.Find("ItemInfo");

        if (itemInfo != null)
            canvasGroup = itemInfo.GetComponent<CanvasGroup>();

        if (mainCanvas == null)
        {
            enabled = false;
            Debug.LogError("InventorySlotUI: Canvas瑜?李얠쓣 ???놁뒿?덈떎.");
        }
    }

    public void Initialize(int index)
    {
        slotIndex = index;
        UpdateSlot(0, null);
    }

    public void UpdateSlot(int stack, Sprite sprite)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (eventData.button != PointerEventData.InputButton.Right)
            return;

        if (!itemImg.enabled)
            return;

        // 泥댁뒪?멸? ?대젮 ?덉쓣 ?뚮쭔 ?몃깽?좊━ -> 泥댁뒪???고겢由??대룞???덉슜?쒕떎.
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

## Assets/02\_Scripts/UI/Game/InventoryUI.cs

### Previous Script

```cs
///<summary>
/// 플레이어 UI 실행에 관련된 모든 작업을 수행합니다
/// 정보를 저장하지 않고 UI 출력에 대한 업데이트만 수행합니다
///</summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.AddressableAssets;

public class InventoryUI : MonoBehaviour
{
    [Header("Inventory UI")]
    [SerializeField] Transform slotContainer;               // 인벤토리 슬롯 목록 그리드
    [SerializeField] List<GameObject> slotsObj;              // 인벤토리 슬롯 오브젝트들
    [SerializeField] GameObject slotPrefab;                 // 슬롯 프리팹

    // 인벤토리 그리드 영역에 _count개의 슬롯을 생성
    public void CreatSlots(int _count)
    {
        if(slotsObj.Count==_count) return;

        // 리스트 내의 모든 슬롯 오브젝트 클리어
        slotsObj.Clear();
        // 지정된 갯수만큼 생성
        for (int i = 0; i < _count; i++)
        {
            // 새로운 슬롯 생성
            GameObject newSlot = Instantiate(slotPrefab, slotContainer.transform);
            newSlot.GetComponent<InventorySlotUI>().Initialize(i);
            slotsObj.Add(newSlot);
        }
    }

    public void UpdateSlot(int slotNum, InventorySlotData slotData)
    {
        var slotUI = slotsObj[slotNum].GetComponent<InventorySlotUI>();
        slotUI.UpdateSlot(slotData.amount, slotData.icon);
    }
}
```

### Modified Description

InventoryUI는 실제 데이터 저장보다는 슬롯 생성 및 화면 표시, 드랍존 표시 제어를 담당하는 구조로 다시 정리되었다. 인벤토리 상태에 따라 드랍존을 켜거나 끄고, 상자 UI가 열렸을 때는 드랍존을 막도록 보완해 일반 인벤토리와 컨테이너 UI의 동작이 섞이지 않게 만들었다.

### Current Script

```cs
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// ?뚮젅?댁뼱 ?몃깽?좊━ UI 異쒕젰留??대떦?쒕떎.
/// ?ㅼ젣 ?곗씠????μ? ?섏? ?딄퀬 ?щ’ ?앹꽦/媛깆떊怨??쒕∼議??쒖떆留?泥섎━?쒕떎.
///</summary>
public class InventoryUI : MonoBehaviour
{
    [Header("Inventory UI")]
    [SerializeField] private Transform slotContainer;
    [SerializeField] private List<GameObject> slotsObj = new();
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

    public void UpdateSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = slotsObj[slotNum].GetComponent<InventorySlotUI>();
        slotUI.UpdateSlot(slotData.amount, slotData.icon);
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

## Assets/02\_Scripts/UI/Game/PlayerStatusUI.cs

### Previous Script

```cs
///<summary>
/// 플레이어 체력 바 UI 업데이트 클래스
/// [26.06.16_강다영] 현재 플레이어가 한명임을 가정하고 코드가 작성 되었으므로 이후 멀티 환경에 맞게 변경 해야할 것
///</summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class PlayerStatusUI : MonoBehaviour
{
    [Header("플레이어 초상화 UI")]
    [SerializeField] Image playerImage;

    [Header("체력 UI")]
    [SerializeField] Image hpBar;
    [SerializeField] TMP_Text hpText;

    [Header("마나 UI")]
    [SerializeField] Image mpBar;
    [SerializeField] TMP_Text mpText;

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnPlayerHealthChanged += UpdateHealthBar;
        GlobalEventBus.OnPlayerManaChanged += UpdateManaBar;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnPlayerHealthChanged -= UpdateHealthBar;
        GlobalEventBus.OnPlayerManaChanged -= UpdateManaBar;
    }

    private void UpdateHealthBar(float _currentHp, float _maxHp)
    {
        hpBar.fillAmount = _currentHp/_maxHp;
        hpText.text = $"{_currentHp}/{_maxHp}";
    }

    private void UpdateManaBar(float _currentMp, float _maxMp)
    {
        mpBar.fillAmount = _currentMp/_maxMp;
        mpText.text = $"{_currentMp}/{_maxMp}";
    }
}
```

### Modified Description

PlayerStatusUI는 오늘 인벤토리와 상자 흐름의 핵심은 아니지만, 테스트 중 확인된 Invalid AABB 오류를 완화하기 위해 체력 및 마나 바의 fillAmount 계산을 안전하게 보정하는 방향으로 함께 정리되었다. 최대값이 0이거나 비정상 비율이 들어올 때 UI 계산이 깨지지 않도록 보호 로직이 추가되었다.

### Current Script

```cs
///<summary>
/// ?뚮젅?댁뼱 泥대젰 諛?UI ?낅뜲?댄듃 ?대옒??
/// [26.06.16_媛뺣떎?? ?꾩옱 ?뚮젅?댁뼱媛 ?쒕챸?꾩쓣 媛?뺥븯怨?肄붾뱶媛 ?묒꽦 ?섏뿀?쇰?濡??댄썑 硫???섍꼍??留욊쾶 蹂寃??댁빞??寃?
///</summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class PlayerStatusUI : MonoBehaviour
{
    [Header("?뚮젅?댁뼱 珥덉긽??UI")]
    [SerializeField] Image playerImage;

    [Header("泥대젰 UI")]
    [SerializeField] Image hpBar;
    [SerializeField] TMP_Text hpText;

    [Header("留덈굹 UI")]
    [SerializeField] Image mpBar;
    [SerializeField] TMP_Text mpText;

    private void OnEnable()
    {
        /// ?대깽??援щ룆 ///
        GlobalEventBus.OnPlayerHealthChanged += UpdateHealthBar;
        GlobalEventBus.OnPlayerManaChanged += UpdateManaBar;
    }

    private void OnDisable()
    {
        /// ?대깽??援щ룆 ?댁젣 ///
        GlobalEventBus.OnPlayerHealthChanged -= UpdateHealthBar;
        GlobalEventBus.OnPlayerManaChanged -= UpdateManaBar;
    }

    private void UpdateHealthBar(float _currentHp, float _maxHp)
    {
        hpBar.fillAmount = _maxHp > 0f ? Mathf.Clamp01(_currentHp / _maxHp) : 0f;
        hpText.text = $"{_currentHp}/{_maxHp}";
    }

    private void UpdateManaBar(float _currentMp, float _maxMp)
    {
        mpBar.fillAmount = _maxMp > 0f ? Mathf.Clamp01(_currentMp / _maxMp) : 0f;
        mpText.text = $"{_currentMp}/{_maxMp}";
    }
}
```
{% endraw %}
