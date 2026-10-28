---
title: "2026-07-20_PlayerCombatPresenter_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/Presenter/PlayerCombatPresenter.cs cs using UnityEngine; using UnityEngine.InputSystem; /// /// 플레이어의 전투 입력을 실제"
description: "1. 이전 스크립트 전체 기준: 2f085c3^ 파일: Assets/02_Scripts/Presenter/PlayerCombatPresenter.cs cs using UnityEngine; using UnityEngine.InputSystem; /// /// 플레이어의 전투 입력을 실제"
published: false
migration_id: "3a336532580e8160a6b1fdfa0043812d"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2f085c3^</code>
- 파일: <code>Assets/02_Scripts/Presenter/PlayerCombatPresenter.cs</code>

```cs
using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// 플레이어의 전투 입력을 실제 전투 시스템에 연결하는 Presenter입니다.
/// 기본 공격, 구르기, 액티브 스킬 사용 가능 여부를 검사하고 실행을 요청합니다.
/// </summary>
public class PlayerCombatPresenter : MonoBehaviour
{
    private PlayerWeapon playerWeapon;          // 플레이어가 장착한 무기 정보
    private PlayerStatus playerStatus;          // 플레이어 HP/MP/상태 정보

    private float skillTimer;                   // 스킬 사용 시 딜레이 타이머

    private ISkillRepository skillRepo;         // 스킬 데이터 저장소
    private ICharDataRepository charRepo;       // 캐릭터 데이터 저장소

    private float artifactFireSpeedRate;        // 아티팩트 공격 속도 증가율
    private float artifactFireMpDownRate;       // 아티팩트 공격 MP 소모 감소율
    private float nextAttackAvailableTime;      // 다음 기본 공격 가능 시각

    private InputAction evadeAction;            // 구르기 이벤트 캐시
    private InputAction skillAction;            // 스킬 이벤트 캐시
    private InputAction attackAction;           // 기본 공격 이벤트 캐시

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerStatus = GetComponent<PlayerStatus>();

        if (playerWeapon == null || playerStatus == null)
        {
            enabled = false;
            Debug.LogError("PlayerCombatPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 첫 실행 시에는 시간이 충분히 흘렀다고 판단하도록 음수 값 설정
        skillTimer = -9999f;

        skillRepo = new LocalJsonSkillRepository();
        charRepo = new SOCharacterRepository();
    }

    private void OnEnable()
    {
        if (GlobalEventBus.OnGetInputAction != null)
        {
            attackAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Attack");
            if (attackAction != null)
```

```cs
        {
            attackAction.Enable();
            attackAction.performed += OnAttackInput;
        }
        evadeAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Evade");
        if (evadeAction != null)
        {
            evadeAction.Enable();
            evadeAction.performed += OnEvadeInput;
        }

        skillAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "ActiveSkill");
        if (skillAction != null)
        {
            skillAction.Enable();
            skillAction.performed += OnSkillInput;
        }
    }
}

private void OnDisable()
{
    if (attackAction != null)
    {
        attackAction.performed -= OnAttackInput;
        attackAction.Disable();
    }

    if (evadeAction != null)
    {
        evadeAction.performed -= OnEvadeInput;
        evadeAction.Disable();
    }

    if (skillAction != null)
    {
        skillAction.performed -= OnSkillInput;
        skillAction.Disable();
    }
}

private void OnAttackInput(InputAction.CallbackContext context) => TryAttack();

private void TryAttack()
{
    if (playerStatus.nowState != PlayerStatus.livingState.idle)
        return;

    if (Time.time < nextAttackAvailableTime)
        return;

    float useMana = GetModifiedAttackManaCost();

    if (!playerWeapon.isEquipped || playerStatus.mpCurrent < useMana)
        return;

    playerWeapon.PlayerAttack();
    playerStatus.UseAttackMana(useMana);
    nextAttackAvailableTime = Time.time + GetModifiedFireInterval();
}
```

```cs
/// <summary>
/// 아티팩트 장착 효과로 추가되는 공격 속도/공격 MP 소모 보정값을 갱신합니다.
/// 무기 원본 fireRate/useMana는 보존하고, 공격 시점에 최종값만 계산해 사용합니다.
/// </summary>
public void ApplyArtifactCombatBonus(float fireSpeedRate, float fireMpDownRate)
{
    artifactFireSpeedRate = Mathf.Max(0.0f, fireSpeedRate);
    artifactFireMpDownRate = Mathf.Clamp01(fireMpDownRate);
}

private float GetModifiedAttackManaCost()
{
    if (!playerWeapon.isEquipped)
        return 0.0f;

    return playerWeapon.nowUseMana * (1.0f - artifactFireMpDownRate);
}

private float GetModifiedFireInterval()
{
    if (!playerWeapon.isEquipped)
        return 0.0f;

    float baseFireRate = Mathf.Max(0.0f, playerWeapon.nowFireRate);
    float speedMultiplier = 1.0f + artifactFireSpeedRate;
    return speedMultiplier > 0.0f ? baseFireRate / speedMultiplier : baseFireRate;
}

private void OnEvadeInput(InputAction.CallbackContext context) => TryEvade();

private void TryEvade()
{
    if (playerStatus.nowState != PlayerStatus.livingState.idle)
        return;

    if (playerStatus.mpCurrent < playerStatus.evadeMP)
        return;

    if (Time.time < playerStatus.lastEvadeTime + playerStatus.evadeCooltime)
        return;

    playerStatus.UseEvadeMana(playerStatus.evadeMP);
}

private void OnSkillInput(InputAction.CallbackContext context) => TrySkill();

private void TrySkill()
{
    /// 스킬 시전을 위한 조건들 확인 (플레이어 상태, 스킬 쿨타임, 마나량) ///

    // 플레이어 상태가 idle이 아니면 스킬을 사용할 수 없음
    if (playerStatus.nowState != PlayerStatus.livingState.idle) return;
```

```cs
    CharacterData charData = charRepo.GetCharacterData(PlayerSaveDataSO.Instance.currentData.SelectCharID);
    SkillData skill = skillRepo.GetSkillData(charData.skillNum);

    // 스킬 시전 딜레이 시간이 지나지 않았으면 스킬을 사용하지 않음
    if(Time.time-skillTimer < skill.skillCooltime) return;

    // 스킬 사용 시 마나 소모 요청
    bool success = GlobalEventBus.OnRequestManaConsume(skill.mpCost);
    if (!success)
        return;

    // 현재 마나가 스킬을 사용하기에 부족하다면 시전 취소
    if (!success) return;

    /// 시전을 위한 조건을 모두 통과, 스킬 시전 ///
    
    // 스킬을 시전한 현재 시점의 시간 등록
    skillTimer = Time.time;

    // 플레이어 스텟 정보를 넘겨줌
    CasterStatPayload payload = new CasterStatPayload();
    payload.attackPower = playerWeapon.nowAttackPower;

    // 마우스 위치에 따라 사거리 내 스킬 발사 지점을 지정함
    if(TryGetMouseWorldPosition(skill.fireRange, out Vector3 mousePos))
    {
        GlobalEventBus.OnMainActiveSkillCasted?.Invoke();
        SkillEffectProcessor.Instance.UseSkillEffect(skill, this.gameObject, payload, mousePos);
    }

    //쿨타임 시작 시점 이벤트를 게임플레이 UI에 전달하는 이벤트
    GlobalEventBus.OnPrintSkillCooltime?.Invoke(skill.skillCooltime);
}

/* 현재 마우스의 평면상의 위치*/
private bool TryGetMouseWorldPosition(float _range, out Vector3 worldPosition)
{
    Plane groundPlane = new Plane(Vector3.up, transform.position);
    Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);

    if (groundPlane.Raycast(ray, out float enter))
    {
        // 거리를 바탕으로 실제 충돌한 3D 좌표를 계산
        Vector3 hitPoint = ray.GetPoint(enter);

        // 플레이어와 마우스 포인터 사이의 거리를 계산
```

```cs
            float distance = Vector3.Distance(transform.position, hitPoint);

            // 마우스 위치가 지정된 사거리를 벗어났다면
            if (distance > _range)
            {
                // 플레이어 위치에서 마우스 방향으로 최고 사거리 지점을 계산
                Vector3 direction = (hitPoint - transform.position).normalized;
                worldPosition = transform.position + direction * _range;
            }
            else
            {
                // 사거리 내라면 그대로 반환
                worldPosition = hitPoint;
            }
            return true;
        }

        worldPosition = Vector3.zero;
        return false;
    }
}
```

## 2. 변경 설명

현재 Input Actions의 Fire 액션 이름에 맞춰 구독 정합성을 복구했습니다. 튜토리얼 안내나 인벤토리 UI가 입력을 점유하는 동안 공격과 스킬 실행을 차단하여 UI 확인 클릭이 발사로 이어지는 현상을 막았습니다. 이후 팀원 변경이 섞이지 않도록 현재본은 2f085c3 스냅샷을 사용했습니다.

## 3. 현재 스크립트 전체

- 기준: <code>2f085c3</code>
- 파일: <code>Assets/02_Scripts/Presenter/PlayerCombatPresenter.cs</code>

```cs
using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// 플레이어의 전투 입력을 실제 전투 시스템에 연결하는 Presenter입니다.
/// 기본 공격, 구르기, 액티브 스킬 사용 가능 여부를 검사하고 실행을 요청합니다.
/// </summary>
public class PlayerCombatPresenter : MonoBehaviour
{
    private PlayerWeapon playerWeapon;          // 플레이어가 장착한 무기 정보
    private PlayerStatus playerStatus;          // 플레이어 HP/MP/상태 정보
    private LocalInputReader localInputReader;  // 튜토리얼 및 인벤토리 입력 차단 상태

    private float skillTimer;                   // 스킬 사용 시 딜레이 타이머

    private ISkillRepository skillRepo;         // 스킬 데이터 저장소
    private ICharDataRepository charRepo;       // 캐릭터 데이터 저장소

    private float artifactFireSpeedRate;        // 아티팩트 공격 속도 증가율
    private float artifactFireMpDownRate;       // 아티팩트 공격 MP 소모 감소율
    private float nextAttackAvailableTime;      // 다음 기본 공격 가능 시각

    private InputAction evadeAction;            // 구르기 이벤트 캐시
    private InputAction skillAction;            // 스킬 이벤트 캐시
    private InputAction attackAction;           // 기본 공격 이벤트 캐시

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerStatus = GetComponent<PlayerStatus>();
        localInputReader = GetComponent<LocalInputReader>();

        if (playerWeapon == null || playerStatus == null || localInputReader == null)
        {
            enabled = false;
            Debug.LogError("PlayerCombatPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 첫 실행 시에는 시간이 충분히 흘렀다고 판단하도록 음수 값 설정
        skillTimer = -9999f;

        skillRepo = new LocalJsonSkillRepository();
        charRepo = new SOCharacterRepository();
    }

    private void OnEnable()
    {
```

```cs
    if (GlobalEventBus.OnGetInputAction != null)
    {
        attackAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Fire");
        if (attackAction != null)
        {
            attackAction.Enable();
            attackAction.performed += OnAttackInput;
        }
        evadeAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "Evade");
        if (evadeAction != null)
        {
            evadeAction.Enable();
            evadeAction.performed += OnEvadeInput;
        }

        skillAction = GlobalEventBus.OnGetInputAction.Invoke("Player", "ActiveSkill");
        if (skillAction != null)
        {
            skillAction.Enable();
            skillAction.performed += OnSkillInput;
        }
    }
}

private void OnDisable()
{
    if (attackAction != null)
    {
        attackAction.performed -= OnAttackInput;
        attackAction.Disable();
    }

    if (evadeAction != null)
    {
        evadeAction.performed -= OnEvadeInput;
        evadeAction.Disable();
    }

    if (skillAction != null)
    {
        skillAction.performed -= OnSkillInput;
        skillAction.Disable();
    }
}

private void OnAttackInput(InputAction.CallbackContext context) => TryAttack();

private void TryAttack()
{
    if (localInputReader.IsGameplayInputBlocked || localInputReader.IsInventoryOpen)
        return;

    if (playerStatus.nowState != PlayerStatus.livingState.idle)
        return;

    if (Time.time < nextAttackAvailableTime)
        return;
```

```cs
    float useMana = GetModifiedAttackManaCost();

    if (!playerWeapon.isEquipped || playerStatus.mpCurrent < useMana)
        return;

    playerWeapon.PlayerAttack();
    playerStatus.UseAttackMana(useMana);
    nextAttackAvailableTime = Time.time + GetModifiedFireInterval();
}

/// <summary>
/// 아티팩트 장착 효과로 추가되는 공격 속도/공격 MP 소모 보정값을 갱신합니다.
/// 무기 원본 fireRate/useMana는 보존하고, 공격 시점에 최종값만 계산해 사용합니다.
/// </summary>
public void ApplyArtifactCombatBonus(float fireSpeedRate, float fireMpDownRate)
{
    artifactFireSpeedRate = Mathf.Max(0.0f, fireSpeedRate);
    artifactFireMpDownRate = Mathf.Clamp01(fireMpDownRate);
}

private float GetModifiedAttackManaCost()
{
    if (!playerWeapon.isEquipped)
        return 0.0f;

    return playerWeapon.nowUseMana * (1.0f - artifactFireMpDownRate);
}

private float GetModifiedFireInterval()
{
    if (!playerWeapon.isEquipped)
        return 0.0f;

    float baseFireRate = Mathf.Max(0.0f, playerWeapon.nowFireRate);
    float speedMultiplier = 1.0f + artifactFireSpeedRate;
    return speedMultiplier > 0.0f ? baseFireRate / speedMultiplier : baseFireRate;
}

private void OnEvadeInput(InputAction.CallbackContext context) => TryEvade();

private void TryEvade()
{
    if (localInputReader.IsGameplayInputBlocked)
        return;

    if (playerStatus.nowState != PlayerStatus.livingState.idle)
        return;

    if (playerStatus.mpCurrent < playerStatus.evadeMP)
        return;

    if (Time.time < playerStatus.lastEvadeTime + playerStatus.evadeCooltime)
        return;
```

```cs
    playerStatus.UseEvadeMana(playerStatus.evadeMP);
}

private void OnSkillInput(InputAction.CallbackContext context) => TrySkill();

private void TrySkill()
{
    /// 스킬 시전을 위한 조건들 확인 (플레이어 상태, 스킬 쿨타임, 마나량) ///

    if (localInputReader.IsGameplayInputBlocked || localInputReader.IsInventoryOpen)
        return;

    // 플레이어 상태가 idle이 아니면 스킬을 사용할 수 없음
    if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

    CharacterData charData = charRepo.GetCharacterData(PlayerSaveDataSO.Instance.currentData.SelectCharID);
    SkillData skill = skillRepo.GetSkillData(charData.skillNum);

    // 스킬 시전 딜레이 시간이 지나지 않았으면 스킬을 사용하지 않음
    if(Time.time-skillTimer < skill.skillCooltime) return;

    // 스킬 사용 시 마나 소모 요청
    bool success = GlobalEventBus.OnRequestManaConsume(skill.mpCost);
    if (!success)
        return;

    // 현재 마나가 스킬을 사용하기에 부족하다면 시전 취소
    if (!success) return;

    /// 시전을 위한 조건을 모두 통과, 스킬 시전 ///
    
    // 스킬을 시전한 현재 시점의 시간 등록
    skillTimer = Time.time;

    // 플레이어 스텟 정보를 넘겨줌
    CasterStatPayload payload = new CasterStatPayload();
    payload.attackPower = playerWeapon.nowAttackPower;

    // 마우스 위치에 따라 사거리 내 스킬 발사 지점을 지정함
    if(TryGetMouseWorldPosition(skill.fireRange, out Vector3 mousePos))
    {
        GlobalEventBus.OnMainActiveSkillCasted?.Invoke();
        SkillEffectProcessor.Instance.UseSkillEffect(skill, this.gameObject, payload, mousePos);
    }

    //쿨타임 시작 시점 이벤트를 게임플레이 UI에 전달하는 이벤트
    GlobalEventBus.OnPrintSkillCooltime?.Invoke(skill.skillCooltime);
}

/* 현재 마우스의 평면상의 위치*/
```

```cs
    private bool TryGetMouseWorldPosition(float _range, out Vector3 worldPosition)
    {
        Plane groundPlane = new Plane(Vector3.up, transform.position);
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);

        if (groundPlane.Raycast(ray, out float enter))
        {
            // 거리를 바탕으로 실제 충돌한 3D 좌표를 계산
            Vector3 hitPoint = ray.GetPoint(enter);

            // 플레이어와 마우스 포인터 사이의 거리를 계산
            float distance = Vector3.Distance(transform.position, hitPoint);

            // 마우스 위치가 지정된 사거리를 벗어났다면
            if (distance > _range)
            {
                // 플레이어 위치에서 마우스 방향으로 최고 사거리 지점을 계산
                Vector3 direction = (hitPoint - transform.position).normalized;
                worldPosition = transform.position + direction * _range;
            }
            else
            {
                // 사거리 내라면 그대로 반환
                worldPosition = hitPoint;
            }
            return true;
        }

        worldPosition = Vector3.zero;
        return false;
    }
}
```
{% endraw %}
