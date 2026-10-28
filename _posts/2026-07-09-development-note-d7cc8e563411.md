---
title: "2026-07-09_script_full_compare"
date: 2026-07-09 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "2026-07-09\\_script\\_full\\_compare 1. 문서 개요 이 문서는 2026년 7월 9일 알파 시연 준비 과정에서 변경된 주요 C 스크립트를 이전 스크립트 -> 변경 설명 -> 현재 스크립트 순서로 비교하기 위한 기록입니다. 비교 기준 이전 커밋: d7ffbe3 현재"
description: "2026-07-09\\_script\\_full\\_compare 1. 문서 개요 이 문서는 2026년 7월 9일 알파 시연 준비 과정에서 변경된 주요 C 스크립트를 이전 스크립트 -> 변경 설명 -> 현재 스크립트 순서로 비교하기 위한 기록입니다. 비교 기준 이전 커밋: d7ffbe3 현재"
published: false
migration_id: "39836532580e800591d6d7cc8e563411"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
# 2026-07-09\_script\_full\_compare

## 1. 문서 개요

이 문서는 2026년 7월 9일 알파 시연 준비 과정에서 변경된 주요 C# 스크립트를 <code>이전 스크립트 -&gt; 변경 설명 -&gt; 현재 스크립트</code> 순서로 비교하기 위한 기록입니다.

- 비교 기준 이전 커밋: <code>d7ffbe3</code>
- 현재 기준: 현재 워크스페이스 파일
- 제외 대상: Unity 씬, 프리팹, Addressables YAML, meta 파일 등 비스크립트 에셋

---

## 1. <code>Assets/02_Scripts/Presenter/PlayerArtifactEffectController.cs</code>

### 이전 스크립트

```cs
_이전 버전 없음: 해당 시점에는 이 스크립트가 존재하지 않았습니다._
```

### 변경 설명

새로 추가된 아티팩트 효과 적용 컨트롤러입니다. 장착 중인 아티팩트 효과를 합산하고, HP/MP 회복, 이동 속도, 공격 보정, 시간 제한 감소 배율을 각 시스템에 전달합니다.

### 현재 스크립트

```cs
using UnityEngine;

///<summary>
/// ?꾩옱 ?μ갑 以묒씤 ?꾪떚?⑺듃 ?④낵瑜??⑹궛?섏뿬 ?뚮젅?댁뼱 愿???쒖뒪?쒖뿉 ?꾨떖?⑸땲??
/// ?먮낯 ?ㅽ꺈??吏곸젒 ??뼱?곗? ?딄퀬, 媛??쒖뒪?쒖쓽 ?꾪떚?⑺듃 蹂댁젙媛믩쭔 媛깆떊?⑸땲??
///</summary>
public class PlayerArtifactEffectController : MonoBehaviour
{
    private PlayerArtifactEquipment artifactEquipment;   // ?꾩옱 ?μ갑 以묒씤 ?꾪떚?⑺듃 紐⑸줉
    private PlayerStatus playerStatus;                   // HP/MP ?뚮났 蹂댁젙 ?곸슜 ???
    private PlayerMovement playerMovement;               // ?대룞 ?띾룄 蹂댁젙 ?곸슜 ???
    private PlayerCombatPresenter combatPresenter;       // 怨듦꺽 ?띾룄/怨듦꺽 MP 蹂댁젙 ?곸슜 ???
    private TimeLimitController timeLimitController;     // ?쒗븳 ?쒓컙 媛먯냼 ?띾룄 蹂댁젙 ?곸슜 ???

    private void Awake()
    {
        artifactEquipment = GetComponent<PlayerArtifactEquipment>();
        playerStatus = GetComponent<PlayerStatus>();
        playerMovement = GetComponent<PlayerMovement>();
        combatPresenter = GetComponent<PlayerCombatPresenter>();
    }

    private void OnEnable()
    {
        if (artifactEquipment != null)
            artifactEquipment.OnArtifactSlotChanged += HandleArtifactSlotChanged;
    }

    private void Start()
    {
        // ?몄씠釉?濡쒕뱶 吏곹썑 ?대? 蹂듭썝???μ갑 ?곹깭媛 ?덉쓣 ???덉쑝誘濡??쒖옉 ????踰??꾩껜 怨꾩궛?⑸땲??
        RecalculateAndApplyEffects();
    }

    private void OnDisable()
    {
        if (artifactEquipment != null)
            artifactEquipment.OnArtifactSlotChanged -= HandleArtifactSlotChanged;
    }

    private void HandleArtifactSlotChanged(int slotIndex, ArtifactItemData artifact)
    {
        RecalculateAndApplyEffects();
    }

    ///<summary>
    /// ?μ갑 以묒씤 紐⑤뱺 ?꾪떚?⑺듃 ?④낵瑜??ㅼ떆 ?⑹궛?⑸땲??
    /// ?꾩쟻 ?ㅼ감瑜?留됯린 ?꾪빐 ?댁쟾 蹂댁젙媛믪뿉 ?뷀븯吏 ?딄퀬, 留ㅻ쾲 0遺???꾩껜瑜??ш퀎?고빀?덈떎.
    ///</summary>
    private void RecalculateAndApplyEffects()
    {
        float hpRegenBonus = 0.0f;
        float mpRegenBonus = 0.0f;
        float moveSpeedRate = 0.0f;
        float fireSpeedRate = 0.0f;
        float fireMpDownRate = 0.0f;
        float timeLimitSpeedMultiplier = 1.0f;

        if (artifactEquipment != null)
        {
            for (int i = 0; i < artifactEquipment.SlotCount; i++)
            {
                ArtifactItemData artifact = artifactEquipment.GetEquippedArtifact(i);
                if (artifact == null || artifact.equipEffects == null)
                    continue;

                for (int j = 0; j < artifact.equipEffects.Count; j++)
                {
                    ArtifactEquipEffect effect = artifact.equipEffects[j];
                    if (effect == null)
                        continue;

                    ApplyEffectValue(
                        effect,
                        ref hpRegenBonus,
                        ref mpRegenBonus,
                        ref moveSpeedRate,
                        ref fireSpeedRate,
                        ref fireMpDownRate,
                        ref timeLimitSpeedMultiplier);
                }
            }
        }

        playerStatus?.ApplyArtifactStatusBonus(hpRegenBonus, mpRegenBonus);
        playerMovement?.ApplyArtifactMoveSpeedBonus(moveSpeedRate);
        combatPresenter?.ApplyArtifactCombatBonus(fireSpeedRate, fireMpDownRate);

        // TimeLimitController???뚮젅?댁뼱 ?꾨━?뱀씠 ?꾨땲?????쒖뒪???ㅻ툕?앺듃???덉쑝誘濡??꾩슂????李얠븘???곸슜?⑸땲??
        if (timeLimitController == null)
            timeLimitController = FindObjectOfType<TimeLimitController>();

        timeLimitController?.ApplyArtifactTimeLimitSpeedMultiplier(timeLimitSpeedMultiplier);
    }

    private void ApplyEffectValue(
        ArtifactEquipEffect effect,
        ref float hpRegenBonus,
        ref float mpRegenBonus,
        ref float moveSpeedRate,
        ref float fireSpeedRate,
        ref float fireMpDownRate,
        ref float timeLimitSpeedMultiplier)
    {
        switch (effect.effectType)
        {
            case ArtifactEffectType.hpRegen:
                hpRegenBonus += Mathf.Max(0.0f, effect.effectValue);
                break;

            case ArtifactEffectType.mpRegen:
                mpRegenBonus += Mathf.Max(0.0f, effect.effectValue);
                break;

            case ArtifactEffectType.moveSpeedUp:
                moveSpeedRate += Mathf.Max(0.0f, effect.effectValue);
                break;

            case ArtifactEffectType.fireSpeedUp:
                fireSpeedRate += Mathf.Max(0.0f, effect.effectValue);
                break;

            case ArtifactEffectType.fireMPDown:
                fireMpDownRate += Mathf.Max(0.0f, effect.effectValue);
                break;

            case ArtifactEffectType.timeLimitSpeed:
                // timeLimitSpeed??0.6泥섎읆 "理쒖쥌 ?쒓컙 媛먯냼 諛곗쑉"??媛源뚯슫 媛믪엯?덈떎.
                // ?щ윭 媛쒓? ?μ갑?섎㈃ 媛?諛곗쑉??怨깊빐 以묒꺽 ?곸슜?⑸땲??
                if (effect.effectValue > 0.0f)
                    timeLimitSpeedMultiplier *= effect.effectValue;
                break;
        }
    }
}
```

---

## 2. <code>Assets/02_Scripts/Manager/TimeLimitController.cs</code>

### 이전 스크립트

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class TimeLimitController : MonoBehaviour
{
    public float timeLimit = 600.0f;        //세션별 시간 제한 (초 단위로 입력)
    public float currentTimeLimit;          //현재 남은 제한 시간
    public float timeLimitSpeed = 1.0f;     //플레이 시간 제한 배율 (기본 1.0배)
    public float timeLimitAccel = 1.0f;     //가속 구역으로 인한 플레이 시간 제한 가속 (기본 1.0배)
    private bool timeFlow;                  //제한 시간 진행 스위치

    private void Awake()
    {
        currentTimeLimit = timeLimit;   //남은 제한 시간 초기화
        timeFlow = true;
    }

    private void OnEnable()
    {
        GlobalEventBus.OnTimePenaltyRequested += ApplyTimePenalty;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnTimePenaltyRequested -= ApplyTimePenalty;
    }

    private void FixedUpdate()
    {
        if (!timeFlow) return;

        // 시간 제한 가속 배율에 따라 실시간으로 남은 시간 감소
        currentTimeLimit -= timeLimitSpeed * Time.fixedDeltaTime * timeLimitAccel;

        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    ///<summary>
    /// 낙인 같은 외부 패널티가 들어오면 남은 시간을 즉시 차감합니다.
    /// 시간 제한 값은 이 컨트롤러만 소유하도록 유지해 다른 시스템이 직접 currentTimeLimit을 건드리지 않게 합니다.
    ///</summary>
    public void ApplyTimePenalty(float penaltySeconds)
    {
        if (!timeFlow || penaltySeconds <= 0.0f)
        {
            return;
        }

        currentTimeLimit = Mathf.Max(0.0f, currentTimeLimit - penaltySeconds);
        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    private void BroadcastCurrentTime()
    {
        // 타이머 UI에 남은 제한 시간을 전달하는 이벤트
        GlobalEventBus.OnTimerChanged?.Invoke(currentTimeLimit);
    }

    private void TryFinishByTimeout()
    {
        // 남은 시간 제한 값이 0이 되면 탈출 실패로 게임 종료
        if (currentTimeLimit > 0.0f || !timeFlow)
        {
            return;
        }

        timeFlow = false;
        GlobalEventBus.OnTimeOver?.Invoke();
    }
}
```

### 변경 설명

아티팩트의 timeLimitSpeed 효과를 반영하기 위해 시간 감소 배율 보정값을 추가했습니다. 원본 시간 감소 속도는 유지하고 최종 감소량 계산에 아티팩트 배율만 곱합니다.

### 현재 스크립트

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class TimeLimitController : MonoBehaviour
{
    public float timeLimit = 600.0f;        //세션별 시간 제한 (초 단위로 입력)
    public float currentTimeLimit;          //현재 남은 제한 시간
    public float timeLimitSpeed = 1.0f;     //플레이 시간 제한 배율 (기본 1.0배)
    public float timeLimitAccel = 1.0f;     //가속 구역으로 인한 플레이 시간 제한 가속 (기본 1.0배)
    private float artifactTimeLimitSpeedMultiplier = 1.0f; // 아티팩트로 적용되는 시간 감소 속도 배율
    private bool timeFlow;                  //제한 시간 진행 스위치

    private void Awake()
    {
        currentTimeLimit = timeLimit;   //남은 제한 시간 초기화
        timeFlow = true;
    }

    private void OnEnable()
    {
        GlobalEventBus.OnTimePenaltyRequested += ApplyTimePenalty;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnTimePenaltyRequested -= ApplyTimePenalty;
    }

    private void FixedUpdate()
    {
        if (!timeFlow) return;

        // 시간 제한 가속 배율에 따라 실시간으로 남은 시간 감소
        currentTimeLimit -= timeLimitSpeed * artifactTimeLimitSpeedMultiplier * Time.fixedDeltaTime * timeLimitAccel;

        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    ///<summary>
    /// 낙인 같은 외부 패널티가 들어오면 남은 시간을 즉시 차감합니다.
    /// 시간 제한 값은 이 컨트롤러만 소유하도록 유지해 다른 시스템이 직접 currentTimeLimit을 건드리지 않게 합니다.
    ///</summary>
    public void ApplyTimePenalty(float penaltySeconds)
    {
        if (!timeFlow || penaltySeconds <= 0.0f)
        {
            return;
        }

        currentTimeLimit = Mathf.Max(0.0f, currentTimeLimit - penaltySeconds);
        BroadcastCurrentTime();
        TryFinishByTimeout();
    }

    ///<summary>
    /// 아티팩트 장착 효과로 제한 시간 감소 속도 배율을 갱신합니다.
    /// 예: 0.6이면 기존 시간 감소 속도의 60%만 적용되어 시간 제한이 더 천천히 줄어듭니다.
    ///</summary>
    public void ApplyArtifactTimeLimitSpeedMultiplier(float multiplier)
    {
        artifactTimeLimitSpeedMultiplier = Mathf.Max(0.0f, multiplier);
    }

    private void BroadcastCurrentTime()
    {
        // 타이머 UI에 남은 제한 시간을 전달하는 이벤트
        GlobalEventBus.OnTimerChanged?.Invoke(currentTimeLimit);
    }

    private void TryFinishByTimeout()
    {
        // 남은 시간 제한 값이 0이 되면 탈출 실패로 게임 종료
        if (currentTimeLimit > 0.0f || !timeFlow)
        {
            return;
        }

        timeFlow = false;
        GlobalEventBus.OnTimeOver?.Invoke();
    }
}
```

---

## 3. <code>Assets/02_Scripts/Presenter/PlayerCombatPresenter.cs</code>

### 이전 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerCombatPresenter : MonoBehaviour
{
    // 게임 데이터 스크립트 참조
    private PlayerWeapon playerWeapon;                  // 플레이어 무기
    private PlayerStatus playerStatus;                  // 플레이어 상태

    private float skillTimer;                           // 스킬 사용 시 딜레이 타이머

    // JSON 데이터 저장소 접근용 리포지토리 인스턴스
    private ISkillRepository skillRepo;
    private ICharDataRepository charRepo;

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerStatus = GetComponent<PlayerStatus>();

        if(playerWeapon==null || playerStatus==null)
        {
            this.enabled = false;
            Debug.LogError("InventoryPresenter: 필요한 컴포넌트가 없습니다.");
            return;
        }

        // 첫 실행 시에는 시간이 충분히 흘렀다고 판단하도록 음수 값 설정
        skillTimer = -9999f;

        skillRepo = new LocalJsonSkillRepository();
        charRepo = new SOCharacterRepository();
    }

    private void OnEnable()
    {
        /// 이벤트 구독 ///
        GlobalEventBus.OnAttackInput += TryAttack;
        GlobalEventBus.OnEvadeRequested += TryEvade;
        GlobalEventBus.OnMainActiveSkillRequested += TrySkill;
    }

    private void OnDisable()
    {
        /// 이벤트 구독 해제 ///
        GlobalEventBus.OnAttackInput -= TryAttack;
        GlobalEventBus.OnEvadeRequested -= TryEvade;
        GlobalEventBus.OnMainActiveSkillRequested -= TrySkill;
    }

    private void TryAttack()
    {
        // 플레이어 상태가 idle이 아니면 공격을 수행하지 않음
        if (playerStatus.nowState != PlayerStatus.livingState.idle)
            return;

        // 무기를 가지고 있지 않거나 현재 마나가 소비 할 마나보다 부족하다면 공격하지 않음
        if(!playerWeapon.isEquipped || playerStatus.mpCurrent<playerWeapon.nowUseMana)
            return;

        playerWeapon.PlayerAttack();
        playerStatus.UseAttackMana(playerWeapon.nowUseMana);
    }

    private void TryEvade()
    {
        // 플레이어 상태가 idle이 아니면 구르기를 수행하지 않음
        if (playerStatus.nowState != PlayerStatus.livingState.idle)
            return;

        // 현재 마나가 소비할 마나보다 부족하다면 구르기 불가
        if (playerStatus.mpCurrent < playerStatus.evadeMP)
            return;

        // 최근 구르기 사용 후 쿨타임이 경과하지 않았다면 구르기 불가
        if (Time.time < playerStatus.lastEvadeTime + playerStatus.evadeCooltime)
            return;

        playerStatus.UseEvadeMana(playerStatus.evadeMP);
    }

    private void TrySkill()
    {
        /// 스킬 시전을 위한 조건들 확인 (플레이어 상태, 스킬 쿨타임, 마나량) ///

        // 플레이어 상태가 idle이 아니면 스킬을 사용할 수 없음
        if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

        // 해당 캐릭터의 고유 스킬을 사용하게 함
        CharacterData charData = charRepo.GetCharacterData(DataManager.Instance.playerData.SelectCharID);
        var skill = skillRepo.GetSkillData(charData.skillNum);

        // 스킬 시전 딜레이 시간이 지나지 않았으면 스킬을 사용하지 않음
        if(Time.time-skillTimer < skill.skillCooltime) return;

        // 스킬 사용 시 마나 소모 요청
        bool success = GlobalEventBus.OnRequestManaConsume(skill.mpCost);

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
    }

    /* 현재 마우스의 평면상의 위치*/
    private bool TryGetMouseWorldPosition(float _range, out Vector3 worldPosition)
    {
        // 가상의 평면 생성
        Plane groundPlane = new Plane(Vector3.up, transform.position);

        // 카메라에서 마우스 커서 위치를 향해 쏘는 광선(Ray) 생성
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);

        // 광선이 평면과 부딪혔는지 검사
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
        // 평면과 만나지 않았을 경우
        worldPosition = Vector3.zero;
        return false;
    }
}
```

### 변경 설명

아티팩트의 fireSpeedUp, fireMPDown 효과를 반영하기 위해 기본 공격 가능 시간과 MP 소모량 계산을 Presenter에서 보정하도록 수정했습니다.

### 현재 스크립트

```cs
using UnityEngine;

///<summary>
/// ?뚮젅?댁뼱???꾪닾 ?낅젰???ㅼ젣 ?꾪닾 ?쒖뒪?쒖뿉 ?곌껐?섎뒗 Presenter?낅땲??
/// 湲곕낯 怨듦꺽, 援щⅤ湲? ?≫떚釉??ㅽ궗 ?ъ슜 媛???щ?瑜?寃?ы븯怨??ㅽ뻾???붿껌?⑸땲??
///</summary>
public class PlayerCombatPresenter : MonoBehaviour
{
    private PlayerWeapon playerWeapon;          // ?뚮젅?댁뼱媛 ?μ갑??臾닿린 ?뺣낫
    private PlayerStatus playerStatus;          // ?뚮젅?댁뼱 HP/MP/?곹깭 ?뺣낫

    private float skillTimer;                   // ?ㅽ궗 ?ъ슜 ???쒕젅????대㉧

    private ISkillRepository skillRepo;         // ?ㅽ궗 ?곗씠????μ냼
    private ICharDataRepository charRepo;       // 罹먮┃???곗씠????μ냼

    private float artifactFireSpeedRate;        // ?꾪떚?⑺듃 怨듦꺽 ?띾룄 利앷???
    private float artifactFireMpDownRate;       // ?꾪떚?⑺듃 怨듦꺽 MP ?뚮え 媛먯냼??
    private float nextAttackAvailableTime;      // ?ㅼ쓬 湲곕낯 怨듦꺽 媛???쒓컖

    private void Awake()
    {
        playerWeapon = GetComponent<PlayerWeapon>();
        playerStatus = GetComponent<PlayerStatus>();

        if (playerWeapon == null || playerStatus == null)
        {
            enabled = false;
            Debug.LogError("PlayerCombatPresenter: ?꾩슂??而댄룷?뚰듃媛 ?놁뒿?덈떎.");
            return;
        }

        // 泥??ㅽ뻾 ?쒖뿉???쒓컙??異⑸텇???섎??ㅺ퀬 ?먮떒?섎룄濡??뚯닔 媛??ㅼ젙
        skillTimer = -9999f;

        skillRepo = new LocalJsonSkillRepository();
        charRepo = new SOCharacterRepository();
    }

    private void OnEnable()
    {
        GlobalEventBus.OnAttackInput += TryAttack;
        GlobalEventBus.OnEvadeRequested += TryEvade;
        GlobalEventBus.OnMainActiveSkillRequested += TrySkill;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnAttackInput -= TryAttack;
        GlobalEventBus.OnEvadeRequested -= TryEvade;
        GlobalEventBus.OnMainActiveSkillRequested -= TrySkill;
    }

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

    ///<summary>
    /// ?꾪떚?⑺듃 ?μ갑 ?④낵濡?異붽??섎뒗 怨듦꺽 ?띾룄/怨듦꺽 MP ?뚮え 蹂댁젙媛믪쓣 媛깆떊?⑸땲??
    /// 臾닿린 ?먮낯 fireRate/useMana??蹂댁〈?섍퀬, 怨듦꺽 ?쒖젏??理쒖쥌媛믩쭔 怨꾩궛???ъ슜?⑸땲??
    ///</summary>
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

    private void TrySkill()
    {
        /// ?ㅽ궗 ?쒖쟾???꾪븳 議곌굔???뺤씤 (?뚮젅?댁뼱 ?곹깭, ?ㅽ궗 荑⑦??? 留덈굹?? ///

        // ?뚮젅?댁뼱 ?곹깭媛 idle???꾨땲硫??ㅽ궗???ъ슜?????놁쓬
        if (playerStatus.nowState != PlayerStatus.livingState.idle) return;

        CharacterData charData = charRepo.GetCharacterData(DataManager.Instance.playerData.SelectCharID);
        SkillData skill = skillRepo.GetSkillData(charData.skillNum);

        // ?ㅽ궗 ?쒖쟾 ?쒕젅???쒓컙??吏?섏? ?딆븯?쇰㈃ ?ㅽ궗???ъ슜?섏? ?딆쓬
        if(Time.time-skillTimer < skill.skillCooltime) return;

        // ?ㅽ궗 ?ъ슜 ??留덈굹 ?뚮え ?붿껌
        bool success = GlobalEventBus.OnRequestManaConsume(skill.mpCost);
        if (!success)
            return;

        // ?꾩옱 留덈굹媛 ?ㅽ궗???ъ슜?섍린??遺議깊븯?ㅻ㈃ ?쒖쟾 痍⑥냼
        if (!success) return;

        /// ?쒖쟾???꾪븳 議곌굔??紐⑤몢 ?듦낵, ?ㅽ궗 ?쒖쟾 ///

        // ?ㅽ궗???쒖쟾???꾩옱 ?쒖젏???쒓컙 ?깅줉
        skillTimer = Time.time;

        // ?뚮젅?댁뼱 ?ㅽ뀩 ?뺣낫瑜??섍꺼以?
        CasterStatPayload payload = new CasterStatPayload();
        payload.attackPower = playerWeapon.nowAttackPower;

        // 留덉슦???꾩튂???곕씪 ?ш굅由????ㅽ궗 諛쒖궗 吏?먯쓣 吏?뺥븿
        if(TryGetMouseWorldPosition(skill.fireRange, out Vector3 mousePos))
        {
            GlobalEventBus.OnMainActiveSkillCasted?.Invoke();
            SkillEffectProcessor.Instance.UseSkillEffect(skill, this.gameObject, payload, mousePos);
        }
    }

    /* ?꾩옱 留덉슦?ㅼ쓽 ?됰㈃?곸쓽 ?꾩튂*/
    private bool TryGetMouseWorldPosition(float _range, out Vector3 worldPosition)
    {
        Plane groundPlane = new Plane(Vector3.up, transform.position);
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);

        if (groundPlane.Raycast(ray, out float enter))
        {
            // 嫄곕━瑜?諛뷀깢?쇰줈 ?ㅼ젣 異⑸룎??3D 醫뚰몴瑜?怨꾩궛
            Vector3 hitPoint = ray.GetPoint(enter);

            // ?뚮젅?댁뼱? 留덉슦???ъ씤???ъ씠??嫄곕━瑜?怨꾩궛
            float distance = Vector3.Distance(transform.position, hitPoint);

            // 留덉슦???꾩튂媛 吏?뺣맂 ?ш굅由щ? 踰쀬뼱?щ떎硫?
            if (distance > _range)
            {
                // ?뚮젅?댁뼱 ?꾩튂?먯꽌 留덉슦??諛⑺뼢?쇰줈 理쒓퀬 ?ш굅由?吏?먯쓣 怨꾩궛
                Vector3 direction = (hitPoint - transform.position).normalized;
                worldPosition = transform.position + direction * _range;
            }
            else
            {
                // ?ш굅由??대씪硫?洹몃?濡?諛섑솚
                worldPosition = hitPoint;
            }
            return true;
        }

        worldPosition = Vector3.zero;
        return false;
    }
}
```

---

## 4. <code>Assets/02_Scripts/System/Player/PlayerMovement.cs</code>

### 이전 스크립트

### 변경 설명

moveSpeedUp 효과를 반영하기 위해 이동 속도 보정값을 추가했습니다. 원본 moveSpeed/sprintSpeed는 유지하고 실제 이동 계산 시 배율만 적용합니다.

### 현재 스크립트

---

## 5. <code>Assets/02_Scripts/System/Player/PlayerStatus.cs</code>

### 이전 스크립트

### 변경 설명

hpRegen, mpRegen 효과를 반영하기 위해 초당 회복 루틴에 아티팩트 보정값을 추가했습니다.

### 현재 스크립트

---

## 6. <code>Assets/02_Scripts/System/Player/PlayerWeapon.cs</code>

### 이전 스크립트

```cs
using System.Collections;
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

    private GameObject currentWeaponInstance;                           // 현재 무기 인스턴스
    private Coroutine shotTraceCoroutine;                               // 궤적 출력 코루틴
    private WaitForSeconds shotTraceWait;                               // 궤적 출력 코루틴 WS

    [Header("Aim")]
    [SerializeField] private float aimOriginHeight = 1.0f;        // 1차 조준 레이를 쏠 높이
    [SerializeField] private float muzzleBackstepDistance = 0.3f; // 총구가 벽 안에 들어갔을 때 시작점을 뒤로 물릴 거리

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
            targetPoint = aimHit.point;
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
        }

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

### 변경 설명

공격 속도 보정 계산을 위해 현재 무기의 기본 fireRate를 외부에서 읽을 수 있는 getter를 추가했습니다.

### 현재 스크립트

```cs
using System.Collections;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using AnyPortrait;

public class PlayerWeapon : MonoBehaviour
{
    [Header("Equip Weapon")]
    [SerializeField] private WeaponItemData weaponData;                 // 臾닿린 ?곗씠??
    [SerializeField] private Transform firePoint;                       // 諛쒖궗 吏??
    [SerializeField] private LayerMask hitMask;                         // ?쇨꺽 ????덉씠??留덉뒪??

    [Header("Shot Trace Visual")]
    [SerializeField] private bool showShotTrace = true;                 // 沅ㅼ쟻 蹂댁씠湲??щ?
    [SerializeField] private LineRenderer shotTraceRenderer;            // 沅ㅼ쟻 ?뚮뜑??
    [SerializeField] private float shotTraceDuration = 0.3f;           // 沅ㅼ쟻??蹂댁씠???쒓컙
    [SerializeField] private Color hitTraceColor = Color.white;         // ?곸쨷 ?덉쓣 ??沅ㅼ쟻 ?됱긽
    [SerializeField] private Color missTraceColor = Color.red;          // ?곸쨷?섏? ?딆쓣 ??沅ㅼ쟻 ?됱긽

    public bool isEquipped => weaponData != null;                       // 臾닿린 ?μ갑 ?щ?
    public float nowUseMana => weaponData.useMana;                      // ?꾩옱 臾닿린??留덈굹 ?ъ슜??
    public float nowAttackPower => weaponData.AtkValue;                 // 臾닿린??怨듦꺽??
    public float nowFireRate => weaponData.fireRate;                    // ?꾩옱 臾닿린??湲곕낯 諛쒖궗 媛꾧꺽

    private GameObject currentWeaponInstance;                           // ?꾩옱 臾닿린 ?몄뒪?댁뒪
    private Coroutine shotTraceCoroutine;                               // 沅ㅼ쟻 異쒕젰 肄붾（??
    private WaitForSeconds shotTraceWait;                               // 沅ㅼ쟻 異쒕젰 肄붾（??WS

    [Header("Aim")]
    [SerializeField] private float aimOriginHeight = 1.0f;        // 1李?議곗? ?덉씠瑜????믪씠
    [SerializeField] private float muzzleBackstepDistance = 0.3f; // 珥앷뎄媛 踰??덉뿉 ?ㅼ뼱媛붿쓣 ???쒖옉?먯쓣 ?ㅻ줈 臾쇰┫ 嫄곕━

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

        // 1李? 癒쇱? "?대뵒瑜?寃⑤늻怨??덈뒗吏"瑜?援ы븳??
        Vector3 targetPoint = aimOrigin + aimDirection * weaponData.fireRange;

        if (Physics.Raycast(
            aimOrigin,
            aimDirection,
            out RaycastHit aimHit,
            weaponData.fireRange,
            hitMask,
            QueryTriggerInteraction.Ignore))
        {
            targetPoint = aimHit.point;
        }

        // 2李? 珥앷뎄?먯꽌 targetPoint源뚯? ?ㅼ젣 諛쒖궗 ?먯젙???쒕떎.
        Vector3 shotVector = targetPoint - muzzleOrigin;
        float shotDistance = shotVector.magnitude;

        if (shotDistance <= 0.001f)
            return;

        Vector3 shotDirection = shotVector / shotDistance;

        // 珥앷뎄媛 踰??덉뿉 ?ㅼ뼱媛??곹솴???꾪솕?섎젮怨??쒖옉?먯쓣 ?쎄컙 ?ㅻ줈 誘쇰떎.
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

            // ?ㅼ젣濡??곕?吏瑜?以????덈뒗 ?곸쓣 留욎븯???뚮쭔 ?곗깋?쇰줈 諛붽씀怨??쇳빐瑜?以??
            if (target != null && target.EntityFaction != Faction.player)
            {
                traceColor = hitTraceColor;
                target.TakeDamage(weaponData.AtkValue);
            }
        }

        // 沅ㅼ쟻? ?ъ쟾??珥앷뎄?먯꽌 ?쒖옉??蹂댁씠寃??쒕떎.
        ShowShotTrace(muzzleOrigin, endPoint, traceColor);

        // ?ㅼ젣 ?ㅻ뵒???ъ깮怨?蹂꾧컻濡? AI????珥앹냼由??대깽?몃? ?듯빐 ?꾩튂瑜?議곗궗?⑸땲??
        NoiseSystem.Emit(NoiseType.Gunshot, muzzleOrigin, gameObject);
    }

    // 由ъ퐫???좊땲硫붿씠??異쒕젰
    public IEnumerator PlayRecoilAnimation(float recoilDuration, string controlParamName)
    {
        float elapsedTime = 0f;
        // ?쒓컙??鍮꾨??섏뿬 由ъ퐫???좊땲硫붿씠?섏쓣 泥쒖쿇??蹂듦뎄
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

        // 臾닿린 ?꾨━??二쇱냼媛 鍮꾩뼱 ?덉쓣 ???ㅽ뙣
        //if(!weaponData.itemPrefabRef.RuntimeKeyIsValid()) return;
        // Addressble???듯빐 鍮꾨룞湲곕줈 臾닿린瑜??뚰솚, ???꾩튂??遺李⑺븿
        // 2D 罹먮┃?곕? ?ъ슜?섍린 ?뚮Ц??3D 臾닿린 ?μ갑 肄붾뱶???ъ슜?섏? ?딆뒿?덈떎
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
            Debug.LogError("臾닿린 ?μ갑???ㅽ뙣?덉뒿?덈떎.");
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

## 7. <code>Assets/02_Scripts/UI/Game/ItemTooltipUI.cs</code>

### 이전 스크립트

```cs
_이전 버전 없음: 해당 시점에는 이 스크립트가 존재하지 않았습니다._
```

### 변경 설명

아이템 툴팁 UI를 구현하고, 이후 툴팁 위치 적용 방식을 transform.position에서 RectTransform.anchoredPosition으로 수정했습니다.

### 현재 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using TMPro;
using Unity.Android.Types;
using UnityEditor.Experimental;
using UnityEngine;
using UnityEngine.UI;

public class ItemTooltipUI : MonoBehaviour
{
    [Header("UI 배치")]
    [SerializeField] private RectTransform tooltipPanel; // 툴팁 창 위치
    [SerializeField] private TMP_Text textName;         // 아이템 이름 표시
    [SerializeField] private TMP_Text textType;         // 등급 / 종류 표시
    [SerializeField] private TMP_Text textEffect;       // 효과 수치 및 설명 출력 공간
    [SerializeField] private TMP_Text textFlavor;       // 플레이버 텍스트 출력 공간
    [SerializeField] private TMP_Text textPrice;        // 판매 가치 표시
    [SerializeField] private TMP_Text textMultiple;     // 중첩 한도 표시

    // 출력할 데이터
    public int currentItemTID;                  //선택한 슬롯에 장착된 아이템의 TID
    private string currentItemName;             //아이템 이름
    private ItemGrade currentItemGrade;         //아이템 등급
    private itemCategory currentItemCategory;   //아이템 종류
    private string currentItemMainEffect;       //아이템 효과 텍스트
    private string currentItemDesc;             //아이템 설명 텍스트
    private string currentItemFlavor;           //아이템 플레이버 텍스트
    private int currentItemPrice;               //아이템 판매가
    private int currentItemMultiple;            //아이템 최대 중첩 개수

    private LocalJsonItemRepository itemRepo;   //아이템 데이터 리포지토리

    // 툴팁 창을 출력할 위치 좌표
    public bool isFromInventory = true;                                         //인벤토리 슬롯에 호버 중인지 체크 (false = 상자 슬롯에 호버)
    private Vector2 panelPositionFromInventory = new Vector2(1100, 400);        //인벤토리 슬롯에 호버 시 출력하는 위치
    private Vector2 panelPositionFromChest = new Vector2(700, 400);             //상자 슬롯에 호버 시 출력하는 위치

    // 아이템 이름 색상
    private Color normalColor   = new(1.00f, 1.00f, 1.00f);
    private Color uncommonColor = new(0.12f, 1.00f, 0.00f);
    private Color rareColor     = new(0.00f, 0.44f, 0.88f);
    private Color epicColor     = new(0.64f, 0.21f, 0.93f);
    private Color legendColor   = new(1.00f, 0.50f, 0.00f);

    private void Awake()
    {
        itemRepo = new LocalJsonItemRepository();
        RefreshTooltip();
    }

    // 툴팁에 출력할 데이터를 입력
    public void RefreshData(bool hoverFrom, ItemData item)
    {
        // 포인터를 호버한 슬롯이 인벤토리인지 체크
        isFromInventory = hoverFrom;

        if (item != null)
        {
            // 아이템 데이터를 받아와 데이터를 갱신
            currentItemName = item.itemName;
            currentItemGrade = item.itemGrade;
            currentItemCategory = item.category;
            currentItemDesc = item.desc;
            currentItemMultiple = item.itemMultiple;

            // 아이템 카테고리에 따라 효과 텍스트를 출력하는 메소드
            RefreshItemEffect(item);

            // ItemData에 판매가 값이 정해질 때까지 임시로 값을 지정해 출력
            currentItemPrice = item.itemGrade switch
            {
                ItemGrade.normal => 500,
                ItemGrade.uncommon => 1200,
                ItemGrade.rare => 3000,
                ItemGrade.epic => 6000,
                ItemGrade.legend => 12000,
                _ => 0
            };
        }
        // 툴팁 출력을 갱신
        RefreshTooltip();
    }

    // 아이템 카테고리별 세부 데이터를 불러와 효과 텍스트를 출력
    private void RefreshItemEffect(ItemData item)
    {
        switch (item.category)
        {
            case itemCategory.artifact:
                {
                    ArtifactItemData artifact = (ArtifactItemData)item;
                    // 효과 리스트를 출력하기 전 텍스트 초기화
                    currentItemMainEffect = "";
                    currentItemFlavor = artifact.itemFlavorText;
                    break;
                }
            case itemCategory.consume:
                {
                    ConsumeItemData consume = (ConsumeItemData)item;
                    // 효과 리스트를 출력하기 전 텍스트 초기화
                    currentItemMainEffect = "";
                    string addMainEffect = null;
                    foreach (ItemEffect _effect in consume.useEffect)
                    {
                        switch (_effect.effectType)
                        {
                            case EffectType.healHP:
                                {
                                    addMainEffect = $"{_effect.effectTarget}의 현재 HP를 {_effect.effectValue} 회복\n";
                                    break;
                                }
                            case EffectType.healMP:
                                {
                                    addMainEffect = $"{_effect.effectTarget}의 현재 MP를 {_effect.effectValue} 회복\n";
                                    break;
                                }
                        }
                        currentItemMainEffect += addMainEffect;
                    }
                    currentItemFlavor = " ";
                    break;
                }
            case itemCategory.memory:
                {
                    MemoryPieceitemData piece = (MemoryPieceitemData)item;
                    currentItemMainEffect = $"{piece.userType.ToString()}의 동조율 +{piece.linkRateGain}";
                    currentItemFlavor = " ";
                    break;
                }
            default:
                {
                    currentItemMainEffect = " ";
                    currentItemFlavor = " ";
                    break;
                }
        }
    }

    public void RefreshTooltip()
    {
        // 포인터를 호버한 슬롯에 따라 출력 위치를 변경
        if (tooltipPanel != null)
            tooltipPanel.anchoredPosition = isFromInventory ? panelPositionFromInventory : panelPositionFromChest;

        // 아이템 이름 텍스트와 등급별 색상을 출력
        textName.text = currentItemName;
        textName.color = currentItemGrade switch
        {
            ItemGrade.normal    => normalColor,
            ItemGrade.uncommon  => uncommonColor,
            ItemGrade.rare      => rareColor,
            ItemGrade.epic      => epicColor,
            ItemGrade.legend    => legendColor,
            _                   => Color.white
        };

        //아이템 등급과 종류를 출력
        textType.text = $"[ {currentItemGrade.ToString()} - {currentItemCategory.ToString()}]";

        //아이템 효과와 플레이버 텍스트를 출력
        textEffect.text = $"<color=#64F064>{currentItemMainEffect}</color>\n{currentItemDesc}";
        textFlavor.text = currentItemFlavor;

        //아이템 판매가와 최대 중첩 개수를 출력
        textPrice.text = $"판매가: {currentItemPrice}";
        textMultiple.text = $"최대 중첩: {currentItemMultiple}개";
    }
}
```

---

## 8. <code>Assets/02_Scripts/Manager/Manager/ResultManager.cs</code>

### 이전 스크립트

### 변경 설명

탈출 실패 또는 강제 각성 시 장착 중인 아티팩트도 결과 정산 규칙에 맞게 처리되도록 수정했습니다.

### 현재 스크립트

---

## 9. <code>Assets/02_Scripts/System/Player/PlayerArtifactEquipment.cs</code>

### 이전 스크립트

```cs
_이전 버전 없음: 해당 시점에는 이 스크립트가 존재하지 않았습니다._
```

### 변경 설명

아티팩트 장착 상태 접근 및 결과 정산 연동을 위해 필요한 최소 수정이 들어갔습니다.

### 현재 스크립트

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

    public ArtifactItemData[] equippedArtifacts;       // 현재 장착 중인 아티팩트 목록

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

---

## 10. <code>Assets/02_Scripts/Presenter/InventoryPresenter.cs</code>

### 이전 스크립트

### 변경 설명

인벤토리/상자/아티팩트 슬롯의 툴팁 열기 요청을 받아 실제 ItemTooltipUI에 아이템 데이터를 전달하도록 수정했습니다.

### 현재 스크립트

---

## 11. <code>Assets/02_Scripts/UI/Game/InventorySlotUI.cs</code>

### 이전 스크립트

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

### 변경 설명

인벤토리 슬롯에서 툴팁 출력, 드래그/드롭, 결과창 슬롯 타입 구분이 가능하도록 수정했습니다.

### 현재 스크립트

```cs
///<summary>
/// 아이템 슬롯 하나의 역할을 수행합니다
/// 인벤토리 슬롯 1칸의 표시와 입력을 담당한다.
/// 인벤토리 슬롯끼리의 위치 교환, 체스트와의 우클릭 이동, 드래그 앤 드롭 이동, 포인터 호버로 툴팁 출력을 처리한다.
///</summary>
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("슬롯 UI 요소")]
    [SerializeField] private Image slotFrameImage; // 기본 빈 슬롯 이미지
    [SerializeField] private Image rarityFrameImage; // 등급별 슬롯 이미지
    [SerializeField] private Image itemImg;
    [SerializeField] private TMP_Text itemStack;
    [SerializeField] private Transform itemInfo;
    [SerializeField] private SlotType slotType;     //슬롯 종류

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
        UpdateSlot(0, null, ItemGrade.empty, SlotType.empty);
    }

    public void UpdateSlot(int stack, Sprite sprite, SlotType _type = SlotType.inventory)
    {
        UpdateSlot(stack, sprite, ItemGrade.empty, _type);
    }

    public void UpdateSlot(int stack, Sprite sprite, ItemGrade grade, SlotType _type)
    {
        if (stack <= 0 || sprite == null)
        {
            itemImg.enabled = false;
            itemStack.text = "";
            slotType = SlotType.empty;
            ApplySlotFrame(ItemGrade.empty);
            return;
        }

        itemImg.enabled = true;
        itemImg.sprite = sprite;
        itemStack.text = stack.ToString();
        slotType = _type;
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

    public void OnPointerEnter(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(slotType, slotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```

---

## 12. <code>Assets/02_Scripts/UI/Game/ArtifactEquipSlotUI.cs</code>

### 이전 스크립트

```cs
_이전 버전 없음: 해당 시점에는 이 스크립트가 존재하지 않았습니다._
```

### 변경 설명

아티팩트 장비 슬롯에서도 툴팁을 표시할 수 있도록 포인터 진입/이탈 이벤트를 연결했습니다.

### 현재 스크립트

```cs
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

///<summary>
/// 인벤토리 UI 안의 아티팩트 장착 슬롯 1칸을 담당합니다.
/// 직접 인벤토리 데이터를 수정하지 않고, 이벤트를 통해 Presenter에 장착/해제를 요청합니다.
///</summary>
public class ArtifactEquipSlotUI : MonoBehaviour, IDropHandler, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IPointerEnterHandler, IPointerExitHandler
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

    public void OnPointerEnter(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(SlotType.artifact, equipSlotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```

---

## 13. <code>Assets/02_Scripts/UI/Game/ChestSlotUI.cs</code>

### 이전 스크립트

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

///<summary>
/// 체스트 슬롯 1칸의 표시와 입력을 담당한다.
/// 더블클릭으로 인벤토리 이동, 드래그 앤 드롭으로 슬롯 지정 이동을 처리한다.
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

        // 상자 UI에서 인벤토리로 이동 처리를 실행
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

### 변경 설명

상자 슬롯에서도 아이템 툴팁을 표시할 수 있도록 포인터 이벤트와 슬롯 인덱스 전달을 연결했습니다.

### 현재 스크립트

```cs
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

///<summary>
/// 체스트 슬롯 1칸의 표시와 입력을 담당한다.
/// 더블클릭으로 인벤토리 이동, 드래그 앤 드롭으로 슬롯 지정 이동, 포인터 호버로 툴팁 출력을 처리한다.
///</summary>
public class ChestSlotUI : MonoBehaviour, IPointerClickHandler, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler, IPointerEnterHandler, IPointerExitHandler
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

        // 상자 UI에서 인벤토리로 이동 처리를 실행
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

    public void OnPointerEnter(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에 들어오면 아이템 데이터를 읽는다
        GlobalEventBus.OnTooltipUIOpen?.Invoke(SlotType.chest, slotIndex);
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        //포인터가 슬롯 UI에서 빠져나가면 슬롯 UI를 닫는다
        GlobalEventBus.OnTooltipUIClose?.Invoke();
    }
}
```

---

## 14. <code>Assets/02_Scripts/UI/Game/ChestUI.cs</code>

### 이전 스크립트

### 변경 설명

상자 UI 슬롯의 아이템 데이터 조회를 지원해 툴팁이 상자 아이템 정보를 읽을 수 있도록 수정했습니다.

### 현재 스크립트

---

## 15. <code>Assets/02_Scripts/UI/Game/InventoryUI.cs</code>

### 이전 스크립트

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

### 변경 설명

인벤토리 및 결과창 UI의 슬롯 갱신 흐름에서 툴팁/슬롯 타입 연동이 맞도록 수정했습니다.

### 현재 스크립트

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
        slotUI.UpdateSlot(slotData.amount, slotData.icon, grade, SlotType.inventory);
    }

    public void UpdateSafeSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = safeSlotsObj[slotNum].GetComponent<InventorySlotUI>();
        ItemGrade grade = slotData.itemData != null ? slotData.itemData.itemGrade : ItemGrade.empty;
        slotUI.UpdateSlot(slotData.amount, slotData.icon, grade, SlotType.inventory);
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

---

## 16. <code>Assets/02_Scripts/UI/ResultUI.cs</code>

### 이전 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Threading.Tasks;

public class ResultUI : MonoBehaviour
{
    [Header("변수 리스트")]
    public bool extractionResult;               //세션 종료 성패 결과 (`SUCCESS` / `FAILED`)
    public float playTime;                      //세션 내에서 탈출 성공 혹은 사망 시점까지의 기록 시간
    public int memoryFragmentCount;             //이번 세션에서 플레이어가 안전하게 회수한 기억 파편 수
    public int prevLinkRateLevel = 0;           //동조율 상승 전 다이버와의 동조율 단계
    public int linkRateLevel = 0;               //동조율 상승 후 다이버와의 동조율 단계
    public int linkRateGain = 1;                //세션 탈출 성공 시 가산되는 동조율 단계 증가치
    public bool linkRateUp = false;             //동조율 단계가 증가했는지 여부 체크
    public bool memoryLogUnlocked = false;      //개인 심상 기록 01의 해금 여부 플래그 (기본 false, 탈출 성공 시 기억 파편 수가 1개 이상이면 true)
    public int manaStoneCount;                  //이번 세션에서 플레이어가 파밍하여 탈출 성공한 기묘한 사탕 개수
    public int potionCount;                     //이번 세션에서 플레이어가 파밍하여 탈출 성공한 변질된 붕대 개수
    public string returnDialogueID;             //세션 종료 판정에 따라 로비 복귀 시 출력해야 할 귀환 대사 ID
    public int enemyKillCount;                  //이번 세션에서 플레이어가 처치한 적 개체의 누적 수.
    public string _lobbySceneName;              //로비로 돌아가기 처리 시 돌아가는 신 이름
    public ItemData potionData;                 //변질된 붕대 아이템 데이터
    public ItemData manaStoneData;              //기묘한 사탕 아이템 데이터
    public ItemData memoryFragmentData;         //기억 파편 아이템 데이터
    public int invenSlotsCount;                //인벤토리 슬롯 개수 (각성 보존 슬롯 인덱스 값 보정)

    [Header("UI 컴포넌트")]
    public Image image_Banner;                      //탈출 신 패널 타이틀 이미지
    public TMP_Text text_playTime;                  //플레이 시간 텍스트
    public TMP_Text text_enemyKillCount;            //적 처치 수 텍스트
    public Image image_memoryFragmentIcon;          //기억 파편 아이콘 이미지
    public TMP_Text text_getMemoryFragment;         //기억 파편 획득 텍스트
    public TMP_Text text_linkRate;                  //동조율 상승 텍스트
    public TMP_Text text_memoryLogUnlocked;         //심상 기록 해금 텍스트
    public Image image_manaStoneIcon;               //기묘한 사탕 아이콘 이미지
    public TMP_Text text_manaStoneCount;            //기묘한 사탕 획득 텍스트
    public Image image_potionIcon;                  //변질된 붕대 아이콘 이미지
    public TMP_Text text_potionCount;               //변질된 붕대 획득 텍스트
    public Image image_manaStoneLost;               //탈출 실패 시 기묘한 사탕 유실 이펙트 이미지
    public Image image_potionLost;                  //탈출 실패 시 변질된 붕대 유실 이펙트 이미지
    public TMP_Text text_returnDialogue;            //귀환 대사 텍스트
    public Transform safeSlotContainer;             //각성 보존 슬롯 출력 콘테이너
    public List<GameObject> safeSlotsObj = new();   //각성 보존 슬롯 리스트

    [Header("UI 리소스")]
    public Sprite Banner_Success;   //탈출 성공 시 패널 타이틀 스프라이트
    public Sprite Banner_Failed;    //강제 각성(탈출 실패) 시 패널 타이틀 스프라이트
    public GameObject slotPrefab;   //각성 보존 슬롯 칸 프리팹


    private void OnEnable()
    {
        RefreshResult();
    }

    public void UpdateResultUI(bool _result)
    {
        extractionResult = _result;
        /// ResultManager에서 데이터 베이스로부터 찾아 대입할 것이기 때문에 주석처리
        //potionCount = FindItemCount(301);
        //manaStoneCount = FindItemCount(302);
        //memoryFragmentCount = FindItemCount(401);
        RefreshResult();
    }

    /* 결과 창 패널의 출력 데이터 갱신 메소드 */
    public void RefreshResult()
    {
        //이미지 배너를 세션 성패 결과에 따라 탈출 성공 시 / 강제 각성 시로 나누어 출력
        if (image_Banner != null) image_Banner.sprite = extractionResult ? Banner_Success : Banner_Failed;
        PrintTime(playTime);  //플레이 시간 텍스트를 출력하는 메소드
        //적 처치 수 카운트를 출력
        if (text_enemyKillCount != null) text_enemyKillCount.text = $"Kills: {enemyKillCount}";
        MemoryFragmentUse();  //기억 파편을 사용하여 캐릭터 동조율 상승 처리를 실행하는 메소드
        InventoryUpdate();  //인벤토리에 파밍한 마나석과 회복약을 창고에 누적하는 메소드
        //말풍선에 귀환 대사를 출력하는 메소드
        if (text_returnDialogue != null) text_returnDialogue.text = Dialogue_Return();

        PrintItemIcons();  // 아이템 아이콘을 호출
    }

    private void PrintItemIcons()  // 아이템 아이콘 스프라이트 가져오기 메소드
    {
        _ = LoadSpriteAsync(potionData, image_potionIcon);
        _ = LoadSpriteAsync(manaStoneData, image_manaStoneIcon);
        _ = LoadSpriteAsync(memoryFragmentData, image_memoryFragmentIcon);
    }

    private async Task LoadSpriteAsync(ItemData _data, Image _image)
    {
        if (_data == null || _image == null) return;  // null 체크
        if (string.IsNullOrEmpty(_data.iconAddress)) return;

        Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(_data.iconAddress);

        if (loadedIcon != null && _image != null)
        {
            _image.sprite = loadedIcon;
        }
    }

    private void PrintTime(float playTime)  //플레이 시간 텍스트를 mm:ss 단위로 출력하는 메소드
    {
        int playTime_Min = (int)(playTime / 60);  //분 단위 값 추출
        int playTime_Sec = (int)(playTime % 60);  //초 단위 값 추출
        text_playTime.text = $"Play Time: {playTime_Min:00}:{playTime_Sec:00}";  // mm:ss 단위로 출력
    }

    private void MemoryFragmentUse()  //탈출 성공 여부에 따라 기억 파편 사용 처리 텍스트를 출력하는 메소드
    {
        //기억 파편 사용 텍스트 출력 (성공 시 사용 / 실패 시 유실)
        text_getMemoryFragment.text = extractionResult
            ? $"기억 파편 × {memoryFragmentCount}\n자동 사용"
            : $"기억 파편 유실\n(0개 사용)";
        //동조율 레벨 업 텍스트 출력 ( "기억 파편 사용 AND 탈출 성공" 시 동조율 단계 상승)
        text_linkRate.text = linkRateUp
            ? $"동조율 Lv.{prevLinkRateLevel} → <color=#80ff00>Lv.{linkRateLevel}</color>"
            : $"동조율 변화 없음\n(Lv.{prevLinkRateLevel} 유지)";
        //개인 심상 기록 해금 텍스트 출력
        text_memoryLogUnlocked.text = memoryLogUnlocked
            ? $"개인 심상 기록 01 해금"
            : $"개인 심상 기록 해금 <color=#ff0000>실패</color>";
    }

    private void InventoryUpdate()  //인벤토리에 파밍한 마나석과 회복약을 창고에 누적하는 메소드
    {
        if (extractionResult)  //탈출 성공 (extractionResult == true) 시 처리
        {
            // 기묘한 사탕, 변질된 붕대 창고 저장 텍스트 출력
            text_manaStoneCount.text = $"기묘한 사탕 ×{manaStoneCount}\n창고 저장";
            text_potionCount.text = $"변질된 붕대 ×{potionCount}\n창고 저장";
        }
        else  //강제 각성 (extractionResult == false) 시 처리
        {
            // 기묘한 사탕, 변질된 붕대 유실 텍스트 출력
            text_manaStoneCount.text = $"기묘한 사탕 <color=#ff0000>전체 유실</color>\n(0개 저장)";
            text_potionCount.text = $"변질된 붕대 <color=#ff0000>전체 유실</color>\n(0개 저장)";
        }
        // 탈출 실패 시 인벤토리 아이템 유실 이펙트 이미지를 출력 (탈출 성공 시에는 출력하지 않음)
        image_manaStoneLost.enabled = !extractionResult;
        image_potionLost.enabled = !extractionResult;
    }

    public void CreateSafeSlots(int count)  // 각성 보존 슬롯 생성
    {
        if (safeSlotsObj.Count == count)
            return;

        for (int j = 0; j < safeSlotsObj.Count; j++)
        {
            if (safeSlotsObj[j] != null)
                Destroy(safeSlotsObj[j]);
        }

        safeSlotsObj.Clear();

        for (int j = 0; j < count; j++)
        {
            GameObject newSlot = Instantiate(slotPrefab, safeSlotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(j + invenSlotsCount);

            safeSlotsObj.Add(newSlot);
        }
    }

    // 각성 보존 슬롯 데이터 업데이트
    public void UpdateSafeSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = safeSlotsObj[slotNum].GetComponent<InventorySlotUI>();
        slotUI.UpdateSlot(slotData.amount, slotData.icon);
    }

    private string Dialogue_Return()  //결과 창 말풍선 대사를 DB에서 추출해 출력하는 메소드
    {
        return returnDialogueID;  //DB 구조 확인 전 임시로 ID 값을 출력
    }

    public void OnReturnLobbyClick()  //로비로 돌아가기 버튼 터치 동작
    {
        // 로비로 돌아가기 이벤트를 호출
        GlobalEventBus.OnReturnToLobby?.Invoke();
        // LobbyScene으로 이동하기
        GlobalEventBus.OnGoToLobbyScene?.Invoke();
    }
}
```

### 변경 설명

결과창 각성 보존 슬롯에서 잘못된 인벤토리 슬롯 인덱스를 참조하던 문제를 수정했습니다.

### 현재 스크립트

```cs
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Threading.Tasks;

public class ResultUI : MonoBehaviour
{
    [Header("변수 리스트")]
    public bool extractionResult;               //세션 종료 성패 결과 (`SUCCESS` / `FAILED`)
    public float playTime;                      //세션 내에서 탈출 성공 혹은 사망 시점까지의 기록 시간
    public int memoryFragmentCount;             //이번 세션에서 플레이어가 안전하게 회수한 기억 파편 수
    public int prevLinkRateLevel = 0;           //동조율 상승 전 다이버와의 동조율 단계
    public int linkRateLevel = 0;               //동조율 상승 후 다이버와의 동조율 단계
    public int linkRateGain = 1;                //세션 탈출 성공 시 가산되는 동조율 단계 증가치
    public bool linkRateUp = false;             //동조율 단계가 증가했는지 여부 체크
    public bool memoryLogUnlocked = false;      //개인 심상 기록 01의 해금 여부 플래그 (기본 false, 탈출 성공 시 기억 파편 수가 1개 이상이면 true)
    public int manaStoneCount;                  //이번 세션에서 플레이어가 파밍하여 탈출 성공한 기묘한 사탕 개수
    public int potionCount;                     //이번 세션에서 플레이어가 파밍하여 탈출 성공한 변질된 붕대 개수
    public string returnDialogueID;             //세션 종료 판정에 따라 로비 복귀 시 출력해야 할 귀환 대사 ID
    public int enemyKillCount;                  //이번 세션에서 플레이어가 처치한 적 개체의 누적 수.
    public string _lobbySceneName;              //로비로 돌아가기 처리 시 돌아가는 신 이름
    public ItemData potionData;                 //변질된 붕대 아이템 데이터
    public ItemData manaStoneData;              //기묘한 사탕 아이템 데이터
    public ItemData memoryFragmentData;         //기억 파편 아이템 데이터
    public int invenSlotsCount;                //인벤토리 슬롯 개수 (각성 보존 슬롯 인덱스 값 보정)

    [Header("UI 컴포넌트")]
    public Image image_Banner;                      //탈출 신 패널 타이틀 이미지
    public TMP_Text text_playTime;                  //플레이 시간 텍스트
    public TMP_Text text_enemyKillCount;            //적 처치 수 텍스트
    public Image image_memoryFragmentIcon;          //기억 파편 아이콘 이미지
    public TMP_Text text_getMemoryFragment;         //기억 파편 획득 텍스트
    public TMP_Text text_linkRate;                  //동조율 상승 텍스트
    public TMP_Text text_memoryLogUnlocked;         //심상 기록 해금 텍스트
    public Image image_manaStoneIcon;               //기묘한 사탕 아이콘 이미지
    public TMP_Text text_manaStoneCount;            //기묘한 사탕 획득 텍스트
    public Image image_potionIcon;                  //변질된 붕대 아이콘 이미지
    public TMP_Text text_potionCount;               //변질된 붕대 획득 텍스트
    public Image image_manaStoneLost;               //탈출 실패 시 기묘한 사탕 유실 이펙트 이미지
    public Image image_potionLost;                  //탈출 실패 시 변질된 붕대 유실 이펙트 이미지
    public TMP_Text text_returnDialogue;            //귀환 대사 텍스트
    public Transform safeSlotContainer;             //각성 보존 슬롯 출력 콘테이너
    public List<GameObject> safeSlotsObj = new();   //각성 보존 슬롯 리스트

    [Header("UI 리소스")]
    public Sprite Banner_Success;   //탈출 성공 시 패널 타이틀 스프라이트
    public Sprite Banner_Failed;    //강제 각성(탈출 실패) 시 패널 타이틀 스프라이트
    public GameObject slotPrefab;   //각성 보존 슬롯 칸 프리팹


    private void OnEnable()
    {
        RefreshResult();
    }

    public void UpdateResultUI(bool _result)
    {
        extractionResult = _result;
        /// ResultManager에서 데이터 베이스로부터 찾아 대입할 것이기 때문에 주석처리
        //potionCount = FindItemCount(301);
        //manaStoneCount = FindItemCount(302);
        //memoryFragmentCount = FindItemCount(401);
        RefreshResult();
    }

    /* 결과 창 패널의 출력 데이터 갱신 메소드 */
    public void RefreshResult()
    {
        //이미지 배너를 세션 성패 결과에 따라 탈출 성공 시 / 강제 각성 시로 나누어 출력
        if (image_Banner != null) image_Banner.sprite = extractionResult ? Banner_Success : Banner_Failed;
        PrintTime(playTime);  //플레이 시간 텍스트를 출력하는 메소드
        //적 처치 수 카운트를 출력
        if (text_enemyKillCount != null) text_enemyKillCount.text = $"Kills: {enemyKillCount}";
        MemoryFragmentUse();  //기억 파편을 사용하여 캐릭터 동조율 상승 처리를 실행하는 메소드
        InventoryUpdate();  //인벤토리에 파밍한 마나석과 회복약을 창고에 누적하는 메소드
        //말풍선에 귀환 대사를 출력하는 메소드
        if (text_returnDialogue != null) text_returnDialogue.text = Dialogue_Return();

        PrintItemIcons();  // 아이템 아이콘을 호출
    }

    private void PrintItemIcons()  // 아이템 아이콘 스프라이트 가져오기 메소드
    {
        _ = LoadSpriteAsync(potionData, image_potionIcon);
        _ = LoadSpriteAsync(manaStoneData, image_manaStoneIcon);
        _ = LoadSpriteAsync(memoryFragmentData, image_memoryFragmentIcon);
    }

    private async Task LoadSpriteAsync(ItemData _data, Image _image)
    {
        if (_data == null || _image == null) return;  // null 체크
        if (string.IsNullOrEmpty(_data.iconAddress)) return;

        Sprite loadedIcon = await AddressableLoader.LoadAssetAsync<Sprite>(_data.iconAddress);

        if (loadedIcon != null && _image != null)
        {
            _image.sprite = loadedIcon;
        }
    }

    private void PrintTime(float playTime)  //플레이 시간 텍스트를 mm:ss 단위로 출력하는 메소드
    {
        int playTime_Min = (int)(playTime / 60);  //분 단위 값 추출
        int playTime_Sec = (int)(playTime % 60);  //초 단위 값 추출
        text_playTime.text = $"Play Time: {playTime_Min:00}:{playTime_Sec:00}";  // mm:ss 단위로 출력
    }

    private void MemoryFragmentUse()  //탈출 성공 여부에 따라 기억 파편 사용 처리 텍스트를 출력하는 메소드
    {
        //기억 파편 사용 텍스트 출력 (성공 시 사용 / 실패 시 유실)
        text_getMemoryFragment.text = extractionResult
            ? $"기억 파편 × {memoryFragmentCount}\n자동 사용"
            : $"기억 파편 유실\n(0개 사용)";
        //동조율 레벨 업 텍스트 출력 ( "기억 파편 사용 AND 탈출 성공" 시 동조율 단계 상승)
        text_linkRate.text = linkRateUp
            ? $"동조율 Lv.{prevLinkRateLevel} → <color=#80ff00>Lv.{linkRateLevel}</color>"
            : $"동조율 변화 없음\n(Lv.{prevLinkRateLevel} 유지)";
        //개인 심상 기록 해금 텍스트 출력
        text_memoryLogUnlocked.text = memoryLogUnlocked
            ? $"개인 심상 기록 01 해금"
            : $"개인 심상 기록 해금 <color=#ff0000>실패</color>";
    }

    private void InventoryUpdate()  //인벤토리에 파밍한 마나석과 회복약을 창고에 누적하는 메소드
    {
        if (extractionResult)  //탈출 성공 (extractionResult == true) 시 처리
        {
            // 기묘한 사탕, 변질된 붕대 창고 저장 텍스트 출력
            text_manaStoneCount.text = $"기묘한 사탕 ×{manaStoneCount}\n창고 저장";
            text_potionCount.text = $"변질된 붕대 ×{potionCount}\n창고 저장";
        }
        else  //강제 각성 (extractionResult == false) 시 처리
        {
            // 기묘한 사탕, 변질된 붕대 유실 텍스트 출력
            text_manaStoneCount.text = $"기묘한 사탕 <color=#ff0000>전체 유실</color>\n(0개 저장)";
            text_potionCount.text = $"변질된 붕대 <color=#ff0000>전체 유실</color>\n(0개 저장)";
        }
        // 탈출 실패 시 인벤토리 아이템 유실 이펙트 이미지를 출력 (탈출 성공 시에는 출력하지 않음)
        image_manaStoneLost.enabled = !extractionResult;
        image_potionLost.enabled = !extractionResult;
    }

    public void CreateSafeSlots(int count)  // 각성 보존 슬롯 생성
    {
        if (safeSlotsObj.Count == count)
            return;

        for (int j = 0; j < safeSlotsObj.Count; j++)
        {
            if (safeSlotsObj[j] != null)
                Destroy(safeSlotsObj[j]);
        }

        safeSlotsObj.Clear();

        for (int j = 0; j < count; j++)
        {
            GameObject newSlot = Instantiate(slotPrefab, safeSlotContainer);
            InventorySlotUI slotUI = newSlot.GetComponent<InventorySlotUI>();

            if (slotUI != null)
                slotUI.Initialize(j + invenSlotsCount);

            safeSlotsObj.Add(newSlot);
        }
    }

    // 각성 보존 슬롯 데이터 업데이트
    public void UpdateSafeSlot(int slotNum, InventorySlotData slotData)
    {
        InventorySlotUI slotUI = safeSlotsObj[slotNum].GetComponent<InventorySlotUI>();
        slotUI.UpdateSlot(slotData.amount, slotData.icon, SlotType.safe);
    }

    private string Dialogue_Return()  //결과 창 말풍선 대사를 DB에서 추출해 출력하는 메소드
    {
        return returnDialogueID;  //DB 구조 확인 전 임시로 ID 값을 출력
    }

    public void OnReturnLobbyClick()  //로비로 돌아가기 버튼 터치 동작
    {
        // 로비로 돌아가기 이벤트를 호출
        GlobalEventBus.OnReturnToLobby?.Invoke();
        // LobbyScene으로 이동하기
        GlobalEventBus.OnGoToLobbyScene?.Invoke();
    }
}
```

---

## 17. <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>

### 이전 스크립트

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
    public static Action OnMainActiveSkillCasted;                   // 다이버 액티브 스킬 사용 성공 시
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

### 변경 설명

툴팁 UI 열기/닫기 요청을 전역 이벤트로 전달하기 위한 이벤트 정의를 추가했습니다.

### 현재 스크립트

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
    public static Action OnMainActiveSkillCasted;                   // 다이버 액티브 스킬 사용 성공 시
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
    public static Action<SlotType, int> OnTooltipUIOpen;                    // 아이템 툴팁 UI를 출력: Action<슬롯 종류, itemIndex>
    public static Action OnTooltipUIClose;                                  // 아이템 툴팁 UI를 닫음

    ///<summary>
    /// 씬 전환 이벤트
    ///</summary>
    public static Action OnGoToLobbyScene;                                  // 로비 씬으로 이동
    public static Action OnGoToGameScene;                                   // 게임 씬으로 이동
}
```

---

## 18. <code>Assets/02_Scripts/Define/Enums.cs</code>

### 이전 스크립트

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
    none,               // 사용되지 않음
    opponent,           // 단일 대상
    rectangle,          // 직사각형 범위
    arc,                // 부채꼴 범위
    circle              // 원형 구역의 중심 지점을 선택
}

// 아이템 효과 적용 대상
public enum EffectTarget
{
    none,               // 사용되지 않음
    self,               // 플레이어 자신
    ally,               // 시전자의 아군
    opponent            // 적 캐릭터
}

// 효과 사용 시 대상 지정 방식
public enum EffectTargetType
{
    @object,            // 타겟팅 스킬
    cursorPoint,        // 사거리 조절 가능 논타겟팅 스킬
    maxRange            // 사거리 조절 불가능 논타겟팅 스킬
}

// 아이템&스킬 효과 종류
public enum EffectType
{
    // 플레이어 & 적 공통 사용
    none,                   // 효과 할당되지 않음
    healHP,                 // 체력 즉시 회복
    healMP,                 // 마나 즉시 회복
    damage,                 // 일정량의 피해를 입음

    // 플레이어가 받는 효과
    leap,
    knockback,
    parry,

    // 적이 받는 효과
    vision,                 // 자신의 위치를 드러냄
    aggro                   // 적이 추적 대상을 해당 개체로 우선 지정함
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

### 변경 설명

툴팁 요청 시 슬롯의 출처를 구분하기 위한 SlotType 값을 추가/확장했습니다.

### 현재 스크립트

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
    none,               // 사용되지 않음
    opponent,           // 단일 대상
    rectangle,          // 직사각형 범위
    arc,                // 부채꼴 범위
    circle              // 원형 구역의 중심 지점을 선택
}

// 아이템 효과 적용 대상
public enum EffectTarget
{
    none,               // 사용되지 않음
    self,               // 플레이어 자신
    ally,               // 시전자의 아군
    opponent            // 적 캐릭터
}

// 효과 사용 시 대상 지정 방식
public enum EffectTargetType
{
    @object,            // 타겟팅 스킬
    cursorPoint,        // 사거리 조절 가능 논타겟팅 스킬
    maxRange            // 사거리 조절 불가능 논타겟팅 스킬
}

// 아이템&스킬 효과 종류
public enum EffectType
{
    // 플레이어 & 적 공통 사용
    none,                   // 효과 할당되지 않음
    healHP,                 // 체력 즉시 회복
    healMP,                 // 마나 즉시 회복
    damage,                 // 일정량의 피해를 입음

    // 플레이어가 받는 효과
    leap,
    knockback,
    parry,

    // 적이 받는 효과
    vision,                 // 자신의 위치를 드러냄
    aggro                   // 적이 추적 대상을 해당 개체로 우선 지정함
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

public enum SlotType
{
    empty,      //빈 칸
    inventory,  //인벤토리 슬롯
    chest,      //상자 아이템 슬롯
    artifact,   //장비 장착 슬롯
    safe        //각성 보존 슬롯
}
```

---
{% endraw %}
