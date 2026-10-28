---
title: "2026-07-22_InventoryPresenter_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Presenter/InventoryPresenter.cs cs /// /// 아이템과 인벤토리에 관한 상호작용을 중재하는 Presenter. /// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI"
description: "1. 이전 스크립트 전체 기준: b88e064 파일: Assets/02_Scripts/Presenter/InventoryPresenter.cs cs /// /// 아이템과 인벤토리에 관한 상호작용을 중재하는 Presenter. /// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI"
published: false
migration_id: "3a536532580e8142aafccde2e4ad5e20"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>b88e064</code>
- 파일: <code>Assets/02_Scripts/Presenter/InventoryPresenter.cs</code>

```cs
/// <summary>
/// 아이템과 인벤토리에 관한 상호작용을 중재하는 Presenter.
/// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI 연결, 월드 드랍을 담당한다.
/// </summary>
using UnityEngine;
using UnityEngine.InputSystem;

public class InventoryPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerInventory playerInventory;            // 플레이어 인벤토리
    private LocalInputReader localInputReader;          // 플레이어 입력 처리
    private EntityIdentity identity;                    // 플레이어 고유 ID

    // 컨테이너 상태 캐시
    private ItemBox currentBox;                         // 현재 열려 있는 상자
    private bool isChestOpen;                           // 상자 UI가 열려 있는지 여부
    private const float dropForwardDistance = 1.0f;     // 아이템을 플레이어 앞에 떨어뜨릴 거리
    private const float dropUpOffset = 0.3f;            // 바닥 겹침 방지용 높이 보정
    private PlayerStatus playerStatus;                  // 플레이어 상태

    // UI 캐시
    private InventoryUI inventoryUI;                    // 인벤토리 UI 캐시
    private ResultUI resultUI;                          // 결과 UI 캐시
    private ChestUI chestUI;                            // 상자 UI 캐시
    private ItemTooltipUI itemTooltipUI;                // 툴팁 UI 캐시

    // 저장 데이터 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    // 아티팩트 장착 상태 관리
    private PlayerArtifactEquipment playerArtifactEquipment;       // 플레이어 아티팩트 장착 상태

    private InputAction inventoryAction;                // 인벤토리 이벤트 캐시
    private InputAction uiInventoryAction;              // UI 액션맵의 인벤토리 닫기 이벤트 캐시

    // 인벤토리 열기 SFX ID
    [SerializeField] private int inventoryOpenAudioID = 10703;

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerInventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();
        identity = GetComponent<EntityIdentity>();
        playerStatus = GetComponent<PlayerStatus>();
        playerArtifactEquipment = GetComponent<PlayerArtifactEquipment>();

        if (playerWeapon == null || playerInventory == null || playerStatus == null ||
            localInputReader == null || identity == null || playerArtifactEquipment == null)
        {
            enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 인터페이스 구현부 연결
        itemRepo = new LocalJsonItemRepository();

        // 인벤토리 슬롯 초기화
        PlayerSaveData playerData = PlayerSaveDataSO.Instance.currentData;
        playerInventory.Initialize(playerData.invenSlotNum, playerData.quickSlotsNum, playerData.safeSlotNum);
    }

    private void OnEnable()
    {
        // 바닥 아이템을 주웠을 때 발생하는 이벤트를 구독한다.
        GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

        // 상자와 상호작용했을 때 상자 UI를 여는 이벤트를 구독한다.
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

        // 인벤토리 액션을 구독하여 직접 토글을 처리한다.
        if (GlobalEventBus.OnGetInputAction != null)
        {
            inventoryAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Inventory");
            if (inventoryAction != null)
            {
                inventoryAction.Enable();
                inventoryAction.performed += OnInventoryInput;
            }

            // 상자를 열어 UI 액션맵으로 전환된 뒤에도 같은 입력으로 컨테이너를 닫을 수 있게 구독합니다.
            uiInventoryAction = GlobalEventBus.OnGetInputAction.Invoke("UI", "Inventory");
            if (uiInventoryAction != null)
            {
                uiInventoryAction.performed += OnUIInventoryInput;
            }
        }

        // 인벤토리 및 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI를 갱신한다.
        playerInventory.OnSlotChanged += HandleSlotChanged;
        playerInventory.OnSafeSlotChanged += HandleSafeSlotChanged;

        // 인벤토리 드랍존으로 버리기 요청이 들어오면 월드 드랍으로 처리한다.
        GlobalEventBus.OnInventoryDropRequested += HandleInventoryDropRequested;

        // 아티팩트 장착/해제 요청 이벤트를 구독한다.
        GlobalEventBus.OnArtifactEquipRequested += HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested += HandleArtifactUnequipRequested;
        playerArtifactEquipment.OnArtifactSlotChanged += HandleArtifactSlotChanged;

        // 아이템 툴팁 UI 열기/닫기 요청이 들어오면 Presenter가 처리한다.
        GlobalEventBus.OnTooltipUIOpen += OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose += CloseTooltipUI;

        // 사망 또는 탈출 확정 시 열려 있는 인벤토리 계열 UI를 즉시 정리한다.
        GlobalEventBus.OnEscapeRequest += HandleSessionEnded;
    }

    private void OnDisable()
    {
        // 메모리 누수 방지를 위한 구독 해제
        GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;

        if (inventoryAction != null)
        {
            inventoryAction.performed -= OnInventoryInput;
            inventoryAction.Disable();
        }

        if (uiInventoryAction != null)
        {
            uiInventoryAction.performed -= OnUIInventoryInput;
        }

        playerInventory.OnSlotChanged -= HandleSlotChanged;
        playerInventory.OnSafeSlotChanged -= HandleSafeSlotChanged;

        GlobalEventBus.OnInventoryDropRequested -= HandleInventoryDropRequested;

        GlobalEventBus.OnArtifactEquipRequested -= HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested -= HandleArtifactUnequipRequested;

        GlobalEventBus.OnTooltipUIOpen -= OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose -= CloseTooltipUI;
        GlobalEventBus.OnEscapeRequest -= HandleSessionEnded;

        if (playerArtifactEquipment != null)
            playerArtifactEquipment.OnArtifactSlotChanged -= HandleArtifactSlotChanged;
    }

    /// <summary>
    /// 기존 이벤트 기반 아이템 습득 진입점.
    /// 현재 플레이어가 실제 수령한 수량만 처리하도록 TryPickUpItem으로 위임한다.
    /// </summary>
    private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
    {
        if (identity.entityID != pickerID)
            return;

        ItemData data = itemRepo.GetItemDataByID(pickedItemTID);
        if (data == null)
            return;

        TryPickUpItem(data, count);
    }

    /// <summary>
    /// 아이템을 실제로 얼마나 주울 수 있었는지 계산하고,
    /// 받지 못한 남은 수량을 반환한다.
    /// </summary>
    public int TryPickUpItem(ItemData data, int count)
    {
        if (data == null || count <= 0)
            return count;

        int remain = count;
        int pickedItemTID = data.TID;

        // TID 100대는 무기
        if (100 < pickedItemTID && pickedItemTID < 200)
        {
            // 무기가 비어 있으면 첫 1개는 바로 장착한다.
            if (!playerWeapon.isEquipped)
            {
                WeaponItemData weaponData = data as WeaponItemData;
                if (weaponData != null)
                {
                    playerWeapon.EquipWeapon(weaponData);
                    remain = Mathf.Max(0, remain - 1);
                }
                else
                {
                    Debug.LogError("무기가 아닌 아이템이 무기 TID를 가지고 있습니다.");
                    return count;
                }
            }

            // 남은 수량이 있으면 인벤토리에 수납한다.
            if (remain > 0)
                remain = playerInventory.AddItem(data, remain);
        }
        // TID 300대는 소모품
        else if (300 < pickedItemTID && pickedItemTID < 400)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 400대는 특수 아이템
        else if (400 < pickedItemTID && pickedItemTID < 500)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 1000대는 아티팩트
        else if (1000 <= pickedItemTID && pickedItemTID < 1100)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        else
        {
            Debug.LogWarning("Unknown item TID: " + pickedItemTID);
            return count;
        }

        // 아이템 획득 직후에는 저장하지 않는다
        // 획득 아이템은 GameScene의 PlayerInventory에만 보관하고, 결과 정산 시 ResultManager가 저장한다
        // if (remain < count)
        //     DataManager.Instance.SaveGame();

        return remain;
    }

    /* 상자와 상호작용했을 때 상자 UI와 인벤토리 UI를 함께 연다 */
    private void HandleItemBoxOpened(IInteractable interactable, int playerID)
    {
        // 다른 플레이어가 연 상자면 무시한다.
        if (identity.entityID != playerID)
            return;

        // 탈출 채널링 중이거나 세션 종료가 확정된 뒤에는 새 컨테이너 UI를 열지 않는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle || playerStatus.IsSessionEnded)
            return;

        // 대상이 ItemBox가 아니면 무시한다.
        ItemBox box = interactable as ItemBox;
        if (box == null)
            return;

        // 현재 연 상자 상태를 기록한다.
        currentBox = box;
        isChestOpen = true;

        // 상자 UI를 여는 동안 입력 맵을 UI 모드로 전환한다.
        localInputReader.SwitchToUIMap();
        // 마우스 잠금을 해제
        GlobalEventBus.OnMouseLocked?.Invoke(false);

        // 인벤토리 UI를 먼저 연다.
        OpenInventoryUI();

        // 상자 UI를 열고 데이터와 바인딩한다.
        chestUI = UIManager.Instance.Open<ChestUI>();
        if (chestUI == null) return;

        chestUI.Bind(box, playerInventory, CloseContainerUI);
    }

    /// <summary>
    /// 특정 인벤토리 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSlot(index, playerInventory.anySlots[index]);
    }

    /// <summary>
    /// 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSafeSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSafeSlot(index, playerInventory.safeSlots[index]);
    }

    private void OnInventoryInput(InputAction.CallbackContext context)
    {
        if (inventoryUI != null && inventoryUI.gameObject.activeInHierarchy)
            CloseInventoryUI();
        else
            OpenInventoryUI();
    }

    // UI 액션맵은 이미 열린 인벤토리 또는 상자를 닫는 용도로만 사용합니다.
    // 튜토리얼 팝업처럼 다른 이유로 UI 맵이 활성화됐을 때 인벤토리가 새로 열리는 것을 방지합니다.
    private void OnUIInventoryInput(InputAction.CallbackContext context)
    {
        if (isChestOpen || (inventoryUI != null && inventoryUI.gameObject.activeInHierarchy))
            CloseInventoryUI();
    }

    /// <summary>
    /// 인벤토리 UI를 연다.
    /// 일반 인벤토리일 때만 드랍존을 사용 가능하게 둔다.
    /// </summary>
    public void OpenInventoryUI()
    {
        GlobalEventBus.OnMouseLocked?.Invoke(false);

        // 플레이어 상태가 idle이 아니면 인벤토리 조작을 막는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle || playerStatus.IsSessionEnded)
            return;

        UIManager uiManager = UIManager.Instance;
        if (uiManager == null)
        {
            Debug.LogError("InventoryPresenter: UIManager가 준비되지 않아 인벤토리 UI를 열 수 없습니다.");
            return;
        }

        inventoryUI = uiManager.Open<InventoryUI>();
        if (inventoryUI == null)
            return;

        localInputReader.SetInventoryOpenState(true);

        // 상자 UI가 열려 있을 때는 드랍존을 비활성화한다.
        inventoryUI.SetDropZoneAvailable(!isChestOpen);

        // 슬롯 개수에 맞춰 인벤토리 및 각성 보존 슬롯 UI를 생성한다.
        inventoryUI.CreatSlots(playerInventory.slots.Count);
        inventoryUI.CreateSafeSlots(playerInventory.safeSlots.Count, playerInventory.slotNum);

        // 현재 인벤토리 데이터를 슬롯 UI에 반영한다.
        for (int i = 0; i < playerInventory.slotNum; i++)
            inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
        for (int k = 0; k < playerInventory.safeSlotNum; k++)
            inventoryUI.UpdateSafeSlot(k, playerInventory.safeSlots[k]);

        inventoryUI.quickSlot.SyncFromInventory(playerInventory);
        inventoryUI.UpdateArtifactSlots(playerArtifactEquipment);

        // 인벤토리 열기 SFX를 출력한다.
        GlobalEventBus.OnPlay2DSoundRequested?.Invoke(inventoryOpenAudioID);

        // 일반 인벤토리는 Player 액션맵을 유지한다.
    }

    /// <summary>
    /// 인벤토리 UI를 닫는다.
    /// 상자 UI나 툴팁 UI가 열려 있으면 컨테이너 UI 전체를 함께 닫는다.
    /// </summary>
    public void CloseInventoryUI()
    {
        // 상자 UI가 열려 있으면 컨테이너 UI 전체를 닫는다.
        if (isChestOpen)
        {
            CloseContainerUI(!playerStatus.IsSessionEnded);
            return;
        }

        // 툴팁 UI가 열려 있으면 닫아준다.
        UIManager.Instance.Close<ItemTooltipUI>();

        // InventoryUI가 비활성화(OnDisable) 되기 직전에 안전하게 자식들을 원래 위치로 되돌림
        if (inventoryUI != null)
        {
            inventoryUI.ResetAllSlotsDragState();
        }

        UIManager.Instance.Close<InventoryUI>();
        inventoryUI = null;
        localInputReader.SetInventoryOpenState(false);

        // 일반 플레이 중에 닫은 경우에만 플레이어 입력으로 복귀한다.
        if (!playerStatus.IsSessionEnded)
            localInputReader.SwitchToPlayerMap();

        GlobalEventBus.OnMouseLocked?.Invoke(true);
    }

    /// <summary>
    /// 아이템 툴팁 UI를 연다.
    /// </summary>
    public void OpenTooltipUI(SlotType slot, int slotIndex)
    {
        // 종료 처리와 동시에 남아 있던 UI 이벤트가 실행되어 툴팁을 다시 여는 것을 막는다.
        if (playerStatus.IsSessionEnded)
            return;

        // 툴팁 UI의 출력 위치를 isOpenFromInventory 변수로 전달
        itemTooltipUI = UIManager.Instance.Open<ItemTooltipUI>();
        bool isFromInventory = (slot == SlotType.inventory || slot == SlotType.artifact || slot == SlotType.safe);
        itemTooltipUI.isFromInventory = isFromInventory;
        // slotIndex를 참조하여 아이템 데이터를 불러온다.
        ItemData _item;

        switch (slot)
        {
            case SlotType.inventory:  // 인벤토리 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex);
                    break;
                }
            case SlotType.chest:  // 상자 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    // 현재 캐시된 chestUI 우선, 없으면 ActiveUI 사용
                    ChestUI activeChestUI = chestUI ?? ChestUI.ActiveUI;
                    if (activeChestUI != null)
                        _item = activeChestUI.GetItemDataAt(slotIndex);
                    else
                        _item = null;

                    break;
                }
            case SlotType.artifact:  // 장비 장착 칸 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerArtifactEquipment.GetEquippedArtifact(slotIndex);
                    break;
                }
            case SlotType.safe:  // 각성 보존 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex + playerInventory.slots.Count);
                    break;
                }
            default:  // 기본값으로 null 처리
                {
                    _item = null;
                    break;
                }
        }

        // 슬롯에 저장된 아이템 데이터가 null이 아니면 UI 출력을 갱신
        if (_item != null)
        {
            itemTooltipUI.RefreshData(isFromInventory, _item);
        }
        else  // 슬롯의 아이템 데이터가 null이면 슬롯 UI를 닫음
        {
            UIManager.Instance.Close<ItemTooltipUI>();
        }
    }

    /// <summary>
    /// 아이템 툴팁 UI를 닫는다.
    /// </summary>
    public void CloseTooltipUI()
    {
        UIManager.Instance.Close<ItemTooltipUI>();
        itemTooltipUI = null;
    }

    /// <summary>
    /// 상자 UI와 인벤토리 UI, 아이템 툴팁 UI를 함께 닫는다.
    /// </summary>
    public void CloseContainerUI()
    {
        CloseContainerUI(true);
    }

    /// <summary>
    /// 컨테이너 UI를 닫고, 일반 플레이 중에만 Player 액션맵으로 복귀합니다.
    /// 세션 종료 처리에서는 결과 UI 입력을 방해하지 않도록 액션맵을 되돌리지 않습니다.
    /// </summary>
    private void CloseContainerUI(bool restorePlayerInput)
    {
        // 현재 열려 있던 상자의 열린 상태를 해제한다.
        if (currentBox != null)
            currentBox.CloseBox();

        // 비활성화 되기 전 드래그 중인 슬롯 안전하게 복구
        if (inventoryUI != null)
        {
            inventoryUI.ResetAllSlotsDragState();
        }

        UIManager.Instance.Close<ChestUI>();
        UIManager.Instance.Close<InventoryUI>();
        UIManager.Instance.Close<ItemTooltipUI>();

        // 캐시와 상태를 초기화한다.
        chestUI = null;
        inventoryUI = null;
        currentBox = null;
        isChestOpen = false;
        localInputReader.SetInventoryOpenState(false);

        // 일반적인 닫기 요청에서만 입력 맵을 다시 플레이어 모드로 전환하고 마우스를 가둔다.
        if (restorePlayerInput)
        {
            localInputReader.SwitchToPlayerMap();
            GlobalEventBus.OnMouseLocked?.Invoke(true);
        }
    }

    /// <summary>
    /// 사망 또는 탈출 확정 시 인벤토리, 상자, 툴팁을 강제로 닫고 입력 상태를 초기화합니다.
    /// </summary>
    private void HandleSessionEnded(bool extractionResult)
    {
        CloseContainerUI(false);
        localInputReader.enabled = false;
    }

    private void OpenResultUI(bool _result)
    {
        Debug.Log("결과 창을 출력합니다.");

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

    private void HandleInventoryDropRequested(int slotIndex)
    {
        if (isChestOpen)
            return;

        Vector3 dropPosition = transform.position
            + transform.forward * dropForwardDistance
            + Vector3.up * dropUpOffset;

        //playerInventory.TryDropSlotToWorld(slotIndex, dropPosition, () => DataManager.Instance.SaveGame());
        // {인게임 드롭 후에는 즉시 저장하지 않는다}
        // {최종 저장은 결과 정산 시점에 처리한다}
        playerInventory.TryDropSlotToWorld(slotIndex, dropPosition);
    }

    private void HandleArtifactEquipRequested(int equipSlotIndex, int inventorySlotIndex)
    {
        // UI는 슬롯 번호만 전달하고, Presenter가 실제 아이템 타입과 장착 가능 여부를 검증한다.
        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);

        if (!InventoryItemPlacementPolicy.CanPlace(itemData, InventoryDropTargetType.ArtifactSlot))
        {
            Debug.LogWarning("아티팩트 아이템만 장착할 수 있습니다.");
            return;
        }

        ArtifactItemData artifactData = itemData as ArtifactItemData;
        if (artifactData == null)
            return;

        if (!playerArtifactEquipment.EquipArtifact(equipSlotIndex, artifactData, out ArtifactItemData previousArtifact))
            return;

        // 새 아티팩트는 인벤토리에서 빠지고, 기존 장착 아티팩트가 있으면 같은 인벤토리 슬롯으로 돌려보낸다.
        // 이렇게 하면 인벤토리가 가득 찬 상태에서도 장착 교체가 가능하다.
        playerInventory.ClearSlot(inventorySlotIndex);

        if (previousArtifact != null)
        {
            playerInventory.TryAddToSlot(inventorySlotIndex, previousArtifact, 1);
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, artifactData);
    }

    private void HandleArtifactUnequipRequested(int equipSlotIndex)
    {
        // 해제는 먼저 장착 슬롯에서 빼 본 뒤, 인벤토리에 넣을 수 없으면 다시 장착 상태로 복구한다.
        if (!playerArtifactEquipment.UnequipArtifact(equipSlotIndex, out ArtifactItemData removedArtifact))
            return;

        int remain = playerInventory.AddItem(removedArtifact, 1);

        if (remain > 0)
        {
            playerArtifactEquipment.EquipArtifact(equipSlotIndex, removedArtifact, out _);
            Debug.Log("인벤토리가 가득 차서 아티팩트를 해제할 수 없습니다.");
            return;
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, null);
    }

    private void HandleArtifactSlotChanged(int slotIndex, ArtifactItemData artifact)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        // 장착 상태가 바뀐 슬롯만 갱신하여 인벤토리 UI 전체 재생성을 피한다.
        inventoryUI.UpdateArtifactSlot(slotIndex, artifact);
    }
}
```

## 2. 변경 설명

게임플레이 입력이 다른 시스템에 의해 차단되었거나 ESC 메뉴 계열 팝업이 열려 있을 때 Tab/F 입력으로 인벤토리 상태가 바뀌지 않도록 막았습니다. UI를 닫을 때 다른 입력 차단 소유자가 남아 있으면 Player 맵과 커서를 강제 복구하지 않으며, 이후 <code>OnRequestCloseInventoryUI</code> 이벤트로 인벤토리·상자·툴팁을 한 묶음으로 닫는 ESC 우선순위를 연결했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/Presenter/InventoryPresenter.cs</code>

```cs
/// <summary>
/// 아이템과 인벤토리에 관한 상호작용을 중재하는 Presenter.
/// 아이템 습득, 인벤토리 UI 열기/닫기, 체스트 UI 연결, 월드 드랍을 담당한다.
/// </summary>
using UnityEngine;
using UnityEngine.InputSystem;

public class InventoryPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerInventory playerInventory;            // 플레이어 인벤토리
    private LocalInputReader localInputReader;          // 플레이어 입력 처리
    private EntityIdentity identity;                    // 플레이어 고유 ID

    // 컨테이너 상태 캐시
    private ItemBox currentBox;                         // 현재 열려 있는 상자
    private bool isChestOpen;                           // 상자 UI가 열려 있는지 여부
    private const float dropForwardDistance = 1.0f;     // 아이템을 플레이어 앞에 떨어뜨릴 거리
    private const float dropUpOffset = 0.3f;            // 바닥 겹침 방지용 높이 보정
    private PlayerStatus playerStatus;                  // 플레이어 상태

    // UI 캐시
    private InventoryUI inventoryUI;                    // 인벤토리 UI 캐시
    private ResultUI resultUI;                          // 결과 UI 캐시
    private ChestUI chestUI;                            // 상자 UI 캐시
    private ItemTooltipUI itemTooltipUI;                // 툴팁 UI 캐시

    // 저장 데이터 인터페이스
    private IItemDataRepository itemRepo;               // 아이템 데이터 접근 인터페이스

    // 아티팩트 장착 상태 관리
    private PlayerArtifactEquipment playerArtifactEquipment;       // 플레이어 아티팩트 장착 상태

    private InputAction inventoryAction;                // 인벤토리 이벤트 캐시
    private InputAction uiInventoryAction;              // UI 액션맵의 인벤토리 닫기 이벤트 캐시

    // 인벤토리 열기 SFX ID
    [SerializeField] private int inventoryOpenAudioID = 10703;

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerInventory = GetComponent<PlayerInventory>();
        localInputReader = GetComponent<LocalInputReader>();
        identity = GetComponent<EntityIdentity>();
        playerStatus = GetComponent<PlayerStatus>();
        playerArtifactEquipment = GetComponent<PlayerArtifactEquipment>();

        if (playerWeapon == null || playerInventory == null || playerStatus == null ||
            localInputReader == null || identity == null || playerArtifactEquipment == null)
        {
            enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 인터페이스 구현부 연결
        itemRepo = new LocalJsonItemRepository();

        // 인벤토리 슬롯 초기화
        PlayerSaveData playerData = PlayerSaveDataSO.Instance.currentData;
        playerInventory.Initialize(playerData.invenSlotNum, playerData.quickSlotsNum, playerData.safeSlotNum);
    }

    private void OnEnable()
    {
        // 바닥 아이템을 주웠을 때 발생하는 이벤트를 구독한다.
        GlobalEventBus.OnItemPickedUp += HandleItemPickUp;

        // 상자와 상호작용했을 때 상자 UI를 여는 이벤트를 구독한다.
        GlobalEventBus.OnItemBoxOpened += HandleItemBoxOpened;

        // 인벤토리 액션을 구독하여 직접 토글을 처리한다.
        if (GlobalEventBus.OnGetInputAction != null)
        {
            inventoryAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Inventory");
            if (inventoryAction != null)
            {
                inventoryAction.Enable();
                inventoryAction.performed += OnInventoryInput;
            }

            // 상자를 열어 UI 액션맵으로 전환된 뒤에도 같은 입력으로 컨테이너를 닫을 수 있게 구독합니다.
            uiInventoryAction = GlobalEventBus.OnGetInputAction.Invoke("UI", "Inventory");
            if (uiInventoryAction != null)
            {
                uiInventoryAction.performed += OnUIInventoryInput;
            }
        }

        // 인벤토리 및 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI를 갱신한다.
        playerInventory.OnSlotChanged += HandleSlotChanged;
        playerInventory.OnSafeSlotChanged += HandleSafeSlotChanged;

        // 인벤토리 드랍존으로 버리기 요청이 들어오면 월드 드랍으로 처리한다.
        GlobalEventBus.OnInventoryDropRequested += HandleInventoryDropRequested;

        // 아티팩트 장착/해제 요청 이벤트를 구독한다.
        GlobalEventBus.OnArtifactEquipRequested += HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested += HandleArtifactUnequipRequested;
        playerArtifactEquipment.OnArtifactSlotChanged += HandleArtifactSlotChanged;

        // 아이템 툴팁 UI 열기/닫기 요청이 들어오면 Presenter가 처리한다.
        GlobalEventBus.OnTooltipUIOpen += OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose += CloseTooltipUI;

        // ESC 뒤로가기 요청이 들어오면 인벤토리, 상자, 툴팁을 하나의 UI 묶음으로 닫는다.
        GlobalEventBus.OnRequestCloseInventoryUI += CloseInventoryUI;

        // 사망 또는 탈출 확정 시 열려 있는 인벤토리 계열 UI를 즉시 정리한다.
        GlobalEventBus.OnEscapeRequest += HandleSessionEnded;
    }

    private void OnDisable()
    {
        // 메모리 누수 방지를 위한 구독 해제
        GlobalEventBus.OnItemPickedUp -= HandleItemPickUp;
        GlobalEventBus.OnItemBoxOpened -= HandleItemBoxOpened;

        if (inventoryAction != null)
        {
            inventoryAction.performed -= OnInventoryInput;
            inventoryAction.Disable();
        }

        if (uiInventoryAction != null)
        {
            uiInventoryAction.performed -= OnUIInventoryInput;
        }

        playerInventory.OnSlotChanged -= HandleSlotChanged;
        playerInventory.OnSafeSlotChanged -= HandleSafeSlotChanged;

        GlobalEventBus.OnInventoryDropRequested -= HandleInventoryDropRequested;

        GlobalEventBus.OnArtifactEquipRequested -= HandleArtifactEquipRequested;
        GlobalEventBus.OnArtifactUnequipRequested -= HandleArtifactUnequipRequested;

        GlobalEventBus.OnTooltipUIOpen -= OpenTooltipUI;
        GlobalEventBus.OnTooltipUIClose -= CloseTooltipUI;
        GlobalEventBus.OnRequestCloseInventoryUI -= CloseInventoryUI;
        GlobalEventBus.OnEscapeRequest -= HandleSessionEnded;

        if (playerArtifactEquipment != null)
            playerArtifactEquipment.OnArtifactSlotChanged -= HandleArtifactSlotChanged;
    }

    /// <summary>
    /// 기존 이벤트 기반 아이템 습득 진입점.
    /// 현재 플레이어가 실제 수령한 수량만 처리하도록 TryPickUpItem으로 위임한다.
    /// </summary>
    private void HandleItemPickUp(int pickerID, int pickedItemTID, int count)
    {
        if (identity.entityID != pickerID)
            return;

        ItemData data = itemRepo.GetItemDataByID(pickedItemTID);
        if (data == null)
            return;

        TryPickUpItem(data, count);
    }

    /// <summary>
    /// 아이템을 실제로 얼마나 주울 수 있었는지 계산하고,
    /// 받지 못한 남은 수량을 반환한다.
    /// </summary>
    public int TryPickUpItem(ItemData data, int count)
    {
        if (data == null || count <= 0)
            return count;

        int remain = count;
        int pickedItemTID = data.TID;

        // TID 100대는 무기
        if (100 < pickedItemTID && pickedItemTID < 200)
        {
            // 무기가 비어 있으면 첫 1개는 바로 장착한다.
            if (!playerWeapon.isEquipped)
            {
                WeaponItemData weaponData = data as WeaponItemData;
                if (weaponData != null)
                {
                    playerWeapon.EquipWeapon(weaponData);
                    remain = Mathf.Max(0, remain - 1);
                }
                else
                {
                    Debug.LogError("무기가 아닌 아이템이 무기 TID를 가지고 있습니다.");
                    return count;
                }
            }

            // 남은 수량이 있으면 인벤토리에 수납한다.
            if (remain > 0)
                remain = playerInventory.AddItem(data, remain);
        }
        // TID 300대는 소모품
        else if (300 < pickedItemTID && pickedItemTID < 400)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 400대는 특수 아이템
        else if (400 < pickedItemTID && pickedItemTID < 500)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        // TID 1000대는 아티팩트
        else if (1000 <= pickedItemTID && pickedItemTID < 1100)
        {
            remain = playerInventory.AddItem(data, remain);
        }
        else
        {
            Debug.LogWarning("Unknown item TID: " + pickedItemTID);
            return count;
        }

        // 아이템 획득 직후에는 저장하지 않는다
        // 획득 아이템은 GameScene의 PlayerInventory에만 보관하고, 결과 정산 시 ResultManager가 저장한다
        // if (remain < count)
        //     DataManager.Instance.SaveGame();

        return remain;
    }

    /* 상자와 상호작용했을 때 상자 UI와 인벤토리 UI를 함께 연다 */
    private void HandleItemBoxOpened(IInteractable interactable, int playerID)
    {
        // 다른 플레이어가 연 상자면 무시한다.
        if (identity.entityID != playerID)
            return;

        // 탈출 채널링 중이거나 세션 종료가 확정된 뒤에는 새 컨테이너 UI를 열지 않는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle || playerStatus.IsSessionEnded)
            return;

        // 대상이 ItemBox가 아니면 무시한다.
        ItemBox box = interactable as ItemBox;
        if (box == null)
            return;

        // 현재 연 상자 상태를 기록한다.
        currentBox = box;
        isChestOpen = true;

        // 상자 UI를 여는 동안 입력 맵을 UI 모드로 전환한다.
        localInputReader.SwitchToUIMap();
        // 마우스 잠금을 해제
        GlobalEventBus.OnMouseLocked?.Invoke(false);

        // 인벤토리 UI를 먼저 연다.
        OpenInventoryUI();

        // 상자 UI를 열고 데이터와 바인딩한다.
        chestUI = UIManager.Instance.Open<ChestUI>();
        if (chestUI == null) return;

        chestUI.Bind(box, playerInventory, CloseContainerUI);
    }

    /// <summary>
    /// 특정 인벤토리 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSlot(index, playerInventory.anySlots[index]);
    }

    /// <summary>
    /// 각성 보존 슬롯 데이터가 바뀌면 해당 슬롯 UI만 갱신한다.
    /// </summary>
    private void HandleSafeSlotChanged(int index)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        inventoryUI.UpdateSafeSlot(index, playerInventory.safeSlots[index]);
    }

    private void OnInventoryInput(InputAction.CallbackContext context)
    {
        if (localInputReader.IsGameplayInputBlocked || IsGameplayMenuModalOpen())
            return;
        if (inventoryUI != null && inventoryUI.gameObject.activeInHierarchy)
            CloseInventoryUI();
        else
            OpenInventoryUI();
    }

    // UI 액션맵은 이미 열린 인벤토리 또는 상자를 닫는 용도로만 사용합니다.
    // 튜토리얼 팝업처럼 다른 이유로 UI 맵이 활성화됐을 때 인벤토리가 새로 열리는 것을 방지합니다.
    private void OnUIInventoryInput(InputAction.CallbackContext context)
    {
        if (localInputReader.IsGameplayInputBlocked || IsGameplayMenuModalOpen())
            return;
        if (isChestOpen || (inventoryUI != null && inventoryUI.gameObject.activeInHierarchy))
            CloseInventoryUI();
    }

    /// <summary>
    /// ESC 메뉴와 그 하위 팝업이 열려 있으면 Tab/F 입력이 인벤토리 상태를 바꾸지 못하게 합니다.
    /// </summary>
    private bool IsGameplayMenuModalOpen()
    {
        UIManager manager = UIManager.Instance;
        return manager != null &&
               (manager.IsOpen<InGameMenuUI>() ||
                manager.IsOpen<SettingUI>() ||
                manager.IsOpen<NoticeLobbyUI>());
    }

    /// <summary>
    /// 인벤토리 UI를 연다.
    /// 일반 인벤토리일 때만 드랍존을 사용 가능하게 둔다.
    /// </summary>
    public void OpenInventoryUI()
    {
        if (localInputReader.IsGameplayInputBlocked || IsGameplayMenuModalOpen())
            return;
        GlobalEventBus.OnMouseLocked?.Invoke(false);

        // 플레이어 상태가 idle이 아니면 인벤토리 조작을 막는다.
        if (playerStatus.nowState != PlayerStatus.livingState.idle || playerStatus.IsSessionEnded)
            return;

        UIManager uiManager = UIManager.Instance;
        if (uiManager == null)
        {
            Debug.LogError("InventoryPresenter: UIManager가 준비되지 않아 인벤토리 UI를 열 수 없습니다.");
            return;
        }

        inventoryUI = uiManager.Open<InventoryUI>();
        if (inventoryUI == null)
            return;

        localInputReader.SetInventoryOpenState(true);

        // 상자 UI가 열려 있을 때는 드랍존을 비활성화한다.
        inventoryUI.SetDropZoneAvailable(!isChestOpen);

        // 슬롯 개수에 맞춰 인벤토리 및 각성 보존 슬롯 UI를 생성한다.
        inventoryUI.CreatSlots(playerInventory.slots.Count);
        inventoryUI.CreateSafeSlots(playerInventory.safeSlots.Count, playerInventory.slotNum);

        // 현재 인벤토리 데이터를 슬롯 UI에 반영한다.
        for (int i = 0; i < playerInventory.slotNum; i++)
            inventoryUI.UpdateSlot(i, playerInventory.slots[i]);
        for (int k = 0; k < playerInventory.safeSlotNum; k++)
            inventoryUI.UpdateSafeSlot(k, playerInventory.safeSlots[k]);

        inventoryUI.quickSlot.SyncFromInventory(playerInventory);
        inventoryUI.UpdateArtifactSlots(playerArtifactEquipment);

        // 인벤토리 열기 SFX를 출력한다.
        GlobalEventBus.OnPlay2DSoundRequested?.Invoke(inventoryOpenAudioID);

        // 일반 인벤토리는 Player 액션맵을 유지한다.
    }

    /// <summary>
    /// 인벤토리 UI를 닫는다.
    /// 상자 UI나 툴팁 UI가 열려 있으면 컨테이너 UI 전체를 함께 닫는다.
    /// </summary>
    public void CloseInventoryUI()
    {
        // 상자 UI가 열려 있으면 컨테이너 UI 전체를 닫는다.
        if (isChestOpen)
        {
            CloseContainerUI(!playerStatus.IsSessionEnded);
            return;
        }

        // 툴팁 UI가 열려 있으면 닫아준다.
        UIManager.Instance.Close<ItemTooltipUI>();

        // InventoryUI가 비활성화(OnDisable) 되기 직전에 안전하게 자식들을 원래 위치로 되돌림
        if (inventoryUI != null)
        {
            inventoryUI.ResetAllSlotsDragState();
        }

        UIManager.Instance.Close<InventoryUI>();
        inventoryUI = null;
        localInputReader.SetInventoryOpenState(false);

        // 다른 UI가 입력 차단을 유지하지 않는 일반 플레이 중에만 Player 맵과 커서를 복구합니다.
        if (!playerStatus.IsSessionEnded && !localInputReader.IsGameplayInputBlocked)
        {
            localInputReader.SwitchToPlayerMap();
            GlobalEventBus.OnMouseLocked?.Invoke(true);
        }
    }

    /// <summary>
    /// 아이템 툴팁 UI를 연다.
    /// </summary>
    public void OpenTooltipUI(SlotType slot, int slotIndex)
    {
        // 종료 처리와 동시에 남아 있던 UI 이벤트가 실행되어 툴팁을 다시 여는 것을 막는다.
        if (playerStatus.IsSessionEnded)
            return;

        // 툴팁 UI의 출력 위치를 isOpenFromInventory 변수로 전달
        itemTooltipUI = UIManager.Instance.Open<ItemTooltipUI>();
        bool isFromInventory = (slot == SlotType.inventory || slot == SlotType.artifact || slot == SlotType.safe);
        itemTooltipUI.isFromInventory = isFromInventory;
        // slotIndex를 참조하여 아이템 데이터를 불러온다.
        ItemData _item;

        switch (slot)
        {
            case SlotType.inventory:  // 인벤토리 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex);
                    break;
                }
            case SlotType.chest:  // 상자 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    // 현재 캐시된 chestUI 우선, 없으면 ActiveUI 사용
                    ChestUI activeChestUI = chestUI ?? ChestUI.ActiveUI;
                    if (activeChestUI != null)
                        _item = activeChestUI.GetItemDataAt(slotIndex);
                    else
                        _item = null;

                    break;
                }
            case SlotType.artifact:  // 장비 장착 칸 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerArtifactEquipment.GetEquippedArtifact(slotIndex);
                    break;
                }
            case SlotType.safe:  // 각성 보존 슬롯 index를 참조해 아이템 데이터를 전달
                {
                    _item = playerInventory.GetSlotItemData(slotIndex + playerInventory.slots.Count);
                    break;
                }
            default:  // 기본값으로 null 처리
                {
                    _item = null;
                    break;
                }
        }

        // 슬롯에 저장된 아이템 데이터가 null이 아니면 UI 출력을 갱신
        if (_item != null)
        {
            itemTooltipUI.RefreshData(isFromInventory, _item);
        }
        else  // 슬롯의 아이템 데이터가 null이면 슬롯 UI를 닫음
        {
            UIManager.Instance.Close<ItemTooltipUI>();
        }
    }

    /// <summary>
    /// 아이템 툴팁 UI를 닫는다.
    /// </summary>
    public void CloseTooltipUI()
    {
        UIManager.Instance.Close<ItemTooltipUI>();
        itemTooltipUI = null;
    }

    /// <summary>
    /// 상자 UI와 인벤토리 UI, 아이템 툴팁 UI를 함께 닫는다.
    /// </summary>
    public void CloseContainerUI()
    {
        CloseContainerUI(true);
    }

    /// <summary>
    /// 컨테이너 UI를 닫고, 일반 플레이 중에만 Player 액션맵으로 복귀합니다.
    /// 세션 종료 처리에서는 결과 UI 입력을 방해하지 않도록 액션맵을 되돌리지 않습니다.
    /// </summary>
    private void CloseContainerUI(bool restorePlayerInput)
    {
        // 현재 열려 있던 상자의 열린 상태를 해제한다.
        if (currentBox != null)
            currentBox.CloseBox();

        // 비활성화 되기 전 드래그 중인 슬롯 안전하게 복구
        if (inventoryUI != null)
        {
            inventoryUI.ResetAllSlotsDragState();
        }

        UIManager.Instance.Close<ChestUI>();
        UIManager.Instance.Close<InventoryUI>();
        UIManager.Instance.Close<ItemTooltipUI>();

        // 캐시와 상태를 초기화한다.
        chestUI = null;
        inventoryUI = null;
        currentBox = null;
        isChestOpen = false;
        localInputReader.SetInventoryOpenState(false);

        // 일반적인 닫기 요청에서만 입력 맵을 다시 플레이어 모드로 전환하고 마우스를 가둔다.
        if (restorePlayerInput && !localInputReader.IsGameplayInputBlocked)
        {
            localInputReader.SwitchToPlayerMap();
            GlobalEventBus.OnMouseLocked?.Invoke(true);
        }
    }

    /// <summary>
    /// 사망 또는 탈출 확정 시 인벤토리, 상자, 툴팁을 강제로 닫고 입력 상태를 초기화합니다.
    /// </summary>
    private void HandleSessionEnded(bool extractionResult)
    {
        CloseContainerUI(false);
        localInputReader.enabled = false;
    }

    private void OpenResultUI(bool _result)
    {
        Debug.Log("결과 창을 출력합니다.");

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

    private void HandleInventoryDropRequested(int slotIndex)
    {
        if (isChestOpen)
            return;

        Vector3 dropPosition = transform.position
            + transform.forward * dropForwardDistance
            + Vector3.up * dropUpOffset;

        //playerInventory.TryDropSlotToWorld(slotIndex, dropPosition, () => DataManager.Instance.SaveGame());
        // {인게임 드롭 후에는 즉시 저장하지 않는다}
        // {최종 저장은 결과 정산 시점에 처리한다}
        playerInventory.TryDropSlotToWorld(slotIndex, dropPosition);
    }

    private void HandleArtifactEquipRequested(int equipSlotIndex, int inventorySlotIndex)
    {
        // UI는 슬롯 번호만 전달하고, Presenter가 실제 아이템 타입과 장착 가능 여부를 검증한다.
        ItemData itemData = playerInventory.GetSlotItemData(inventorySlotIndex);

        if (!InventoryItemPlacementPolicy.CanPlace(itemData, InventoryDropTargetType.ArtifactSlot))
        {
            Debug.LogWarning("아티팩트 아이템만 장착할 수 있습니다.");
            return;
        }

        ArtifactItemData artifactData = itemData as ArtifactItemData;
        if (artifactData == null)
            return;

        if (!playerArtifactEquipment.EquipArtifact(equipSlotIndex, artifactData, out ArtifactItemData previousArtifact))
            return;

        // 새 아티팩트는 인벤토리에서 빠지고, 기존 장착 아티팩트가 있으면 같은 인벤토리 슬롯으로 돌려보낸다.
        // 이렇게 하면 인벤토리가 가득 찬 상태에서도 장착 교체가 가능하다.
        playerInventory.ClearSlot(inventorySlotIndex);

        if (previousArtifact != null)
        {
            playerInventory.TryAddToSlot(inventorySlotIndex, previousArtifact, 1);
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, artifactData);
    }

    private void HandleArtifactUnequipRequested(int equipSlotIndex)
    {
        // 해제는 먼저 장착 슬롯에서 빼 본 뒤, 인벤토리에 넣을 수 없으면 다시 장착 상태로 복구한다.
        if (!playerArtifactEquipment.UnequipArtifact(equipSlotIndex, out ArtifactItemData removedArtifact))
            return;

        int remain = playerInventory.AddItem(removedArtifact, 1);

        if (remain > 0)
        {
            playerArtifactEquipment.EquipArtifact(equipSlotIndex, removedArtifact, out _);
            Debug.Log("인벤토리가 가득 차서 아티팩트를 해제할 수 없습니다.");
            return;
        }

        inventoryUI?.UpdateArtifactSlot(equipSlotIndex, null);
    }

    private void HandleArtifactSlotChanged(int slotIndex, ArtifactItemData artifact)
    {
        if (inventoryUI == null || !inventoryUI.gameObject.activeInHierarchy)
            return;

        // 장착 상태가 바뀐 슬롯만 갱신하여 인벤토리 UI 전체 재생성을 피한다.
        inventoryUI.UpdateArtifactSlot(slotIndex, artifact);
    }
}
```
{% endraw %}
