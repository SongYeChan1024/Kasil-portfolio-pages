---
title: "2026-07-22_PlayerStatus_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: dd3a3c0 파일: Assets/02_Scripts/System/Player/PlayerStatus.cs cs ﻿ /// /// 플레이어의 상태를 관리하는 스크립트 /// 26.06.16_강다영 플레이어의 기본적인 스텟의 변화가 서로 다른 씬에서 일어날"
description: "1. 이전 스크립트 전체 기준: dd3a3c0 파일: Assets/02_Scripts/System/Player/PlayerStatus.cs cs ﻿ /// /// 플레이어의 상태를 관리하는 스크립트 /// 26.06.16_강다영 플레이어의 기본적인 스텟의 변화가 서로 다른 씬에서 일어날"
published: true
migration_id: "3a536532580e81969441c29e2e701f4e"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>dd3a3c0</code>
- 파일: <code>Assets/02_Scripts/System/Player/PlayerStatus.cs</code>

```cs
﻿
/// <summary>
/// 플레이어의 상태를 관리하는 스크립트
/// [26.06.16_강다영] 플레이어의 기본적인 스텟의 변화가 서로 다른 씬에서 일어날 상황에 대비해 기본값 초기화를 Awake에서 수행함. 추후 변동 가능
/// </summary>
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem.HID;
using UnityEngine.SceneManagement;

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
    private const float TutorialMinimumHp = 1.0f;            // 튜토리얼에서는 사망 대신 유지할 최소 체력

    // 사운드 연출
    public int[] Hit_AudioIDPool = null;                    // 플레이어 피격 사운드 ID 리스트

    // 환경음 ID
    private int defaultTimeAudioID = 10306;     //기본 사운드
    private int lowTimeAudioID_1 = 10301;       //1차 사운드: 제한 시간 50% 이상 경과
    private int lowTimeAudioID_2 = 10302;       //2차 사운드: 제한 시간 80% 이상 경과
    private int lowHPAudio_ID = 10304;          //체력 낮음 사운드

    //제한 시간 루프 사운드 재생 시점
    private float lowTimeTirggerRatio_1 = 0.5f;  //1차 사운드: 50% 이상 경과
    private float lowTimeTirggerRatio_2 = 0.2f;  //2차 사운드: 80% 이상 경과


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
        GlobalEventBus.OnTimerRatioChanged += PlayAmbientSound;
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
        GlobalEventBus.OnTimerRatioChanged -= PlayAmbientSound;

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
    public void initialize(CharacterData _charData)
    {
        nowState = livingState.idle;
        IsSessionEnded = false;

        hpMax = _charData.hpMax;
        hpCurrent = hpMax;
        mpMax = _charData.manaMax;
        mpCurrent = mpMax;
        manaRegen = _charData.manaRegen;
        artifactHpRegenBonus = 0.0f;
        artifactMpRegenBonus = 0.0f;
        sprintMP = _charData.sprintMana;
        cannotSprint = false;
        sprintRecoverTime = _charData.sprintRecoverTime;
        evadeMP = _charData.evadeMana;
        evadeCooltime = _charData.evadeCooltime;
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

            // 게임오버 사운드 이펙트를 출력
            GlobalEventBus.OnPlay2DSoundRequested?.Invoke(10305);
            GameOver(playerID);
        }
    }

    /* 플레이어 체력과 남은 제한 시간에 따라 Ambient 사운드 재생 */
    private void PlayAmbientSound(float timerRatio)
    {
        // 플레이어 체력이 50% 이상이고 idle 상태이면 남은 시간에 따른 사운드 루프를 출력
        if (hpCurrent >= 0.5 * hpMax)
        {
            if (timerRatio < lowTimeTirggerRatio_2)  GlobalEventBus.OnPlay2DSoundRequested?.Invoke(lowTimeAudioID_2);
            else if (timerRatio < lowTimeTirggerRatio_1) GlobalEventBus.OnPlay2DSoundRequested?.Invoke(lowTimeAudioID_1);
            else GlobalEventBus.OnPlay2DSoundRequested?.Invoke(defaultTimeAudioID);
        }
        // 플레이어 체력이 50% 이하이고 idle 상태이면 ambient 사운드 루프 출력
        else if (hpCurrent < 0.5 * hpMax && nowState == livingState.idle)
        {
            GlobalEventBus.OnPlay2DSoundRequested?.Invoke(lowHPAudio_ID);
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

        if (ShouldPreventTutorialDeath(dmg))
        {
            PreventTutorialDeath();
            return;
        }

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
        // 피해 입을 시 사운드 재생 이벤트
        int hitID = Hit_AudioIDPool[UnityEngine.Random.Range(0, Hit_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(hitID,transform.position);
        // 피해 입을 시 탈출 실패 처리
        GlobalEventBus.OnEscapeFailure?.Invoke(playerID);
    }

    /// <summary>
    /// 튜토리얼 씬에서는 전투 실습 중 사망으로 로비에 돌아가지 않도록 치명 피해만 차단합니다.
    /// 일반 인게임 씬에서는 기존 사망/결과 처리 흐름을 그대로 사용합니다.
    /// </summary>
    private bool ShouldPreventTutorialDeath(float damage)
    {
        return IsTutorialSceneActive() && hpCurrent - damage <= 0.0f;
    }

    /// <summary>
    /// 튜토리얼 사망 방지 처리입니다.
    /// HP를 1로 고정하고 피격 피드백과 튜토리얼 안내 이벤트만 발생시킵니다.
    /// </summary>
    private void PreventTutorialDeath()
    {
        hpCurrent = Mathf.Clamp(TutorialMinimumHp, 0.0f, hpMax);
        UpdateHp();

        VFXService.Instance?.Play(GameplayVFXIds.PlayerHit, transform.position, transform.rotation);
        GlobalEventBus.OnHitAnimate?.Invoke();

        int hitID = Hit_AudioIDPool[UnityEngine.Random.Range(0, Hit_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(hitID, transform.position);

        TutorialManager.Instance?.ShowTutorialDeathPreventedRadio();
    }

    /// <summary>
    /// 튜토리얼은 기본 씬과 Additive 씬이 함께 로드되므로 TutorialScene 로드 여부로 판정합니다.
    /// </summary>
    private static bool IsTutorialSceneActive()
    {
        return SceneManager.GetSceneByName("TutorialScene").isLoaded;
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
            GlobalEventBus.OnPrintSprintCooltime?.Invoke(sprintRecoverTime);  //쿨타임 시작 시점 이벤트를 게임플레이 UI에 전달하는 이벤트
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
        // 방향 키 입력이 전달되지 않는 동안에는 구르기를 처리하지 않음
        if (_movement.movementInput.sqrMagnitude <= 0.001f) return;

        GetMp(-_useMana);
        _movement.PlayerEvade();
        lastEvadeTime = Time.time;
        GlobalEventBus.OnPrintEvadeCooltime?.Invoke(evadeCooltime);  //쿨타임 시작 시점 이벤트를 게임플레이 UI에 전달하는 이벤트
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

## 2. 변경 설명

<code>FixedUpdate()</code>에서 플레이어 입력과 이동을 다시 켜는 조건에 <code>!IsSessionEnded</code>를 추가했습니다. 게임 포기·사망·탈출이 확정된 뒤 상태 갱신 순서 때문에 입력이나 이동 컴포넌트가 재활성화되는 것을 막습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/System/Player/PlayerStatus.cs</code>

```cs
﻿
/// <summary>
/// 플레이어의 상태를 관리하는 스크립트
/// [26.06.16_강다영] 플레이어의 기본적인 스텟의 변화가 서로 다른 씬에서 일어날 상황에 대비해 기본값 초기화를 Awake에서 수행함. 추후 변동 가능
/// </summary>
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem.HID;
using UnityEngine.SceneManagement;

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
    private const float TutorialMinimumHp = 1.0f;            // 튜토리얼에서는 사망 대신 유지할 최소 체력

    // 사운드 연출
    public int[] Hit_AudioIDPool = null;                    // 플레이어 피격 사운드 ID 리스트

    // 환경음 ID
    private int defaultTimeAudioID = 10306;     //기본 사운드
    private int lowTimeAudioID_1 = 10301;       //1차 사운드: 제한 시간 50% 이상 경과
    private int lowTimeAudioID_2 = 10302;       //2차 사운드: 제한 시간 80% 이상 경과
    private int lowHPAudio_ID = 10304;          //체력 낮음 사운드

    //제한 시간 루프 사운드 재생 시점
    private float lowTimeTirggerRatio_1 = 0.5f;  //1차 사운드: 50% 이상 경과
    private float lowTimeTirggerRatio_2 = 0.2f;  //2차 사운드: 80% 이상 경과


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
        GlobalEventBus.OnTimerRatioChanged += PlayAmbientSound;
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
        GlobalEventBus.OnTimerRatioChanged -= PlayAmbientSound;

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
        // 세션 종료가 확정된 뒤에는 상태 갱신 순서와 관계없이 입력과 이동을 다시 켜지 않습니다.
        bool canInput = !IsSessionEnded && nowState == livingState.idle;
        if (_input != null) _input.enabled = canInput;
        if (_movement != null) _movement.enabled = canInput;

        // 루시드 낙인 유지 시간, 2중첩 의식누출 시간, 이동 경로 흔적 생성을 공통 틱에서 갱신합니다.
        lucidMark?.Tick(transform, gameObject);
    }

    #region Status Management
    /* 플레이어 상태 및 스텟 초기화 */
    public void initialize(CharacterData _charData)
    {
        nowState = livingState.idle;
        IsSessionEnded = false;

        hpMax = _charData.hpMax;
        hpCurrent = hpMax;
        mpMax = _charData.manaMax;
        mpCurrent = mpMax;
        manaRegen = _charData.manaRegen;
        artifactHpRegenBonus = 0.0f;
        artifactMpRegenBonus = 0.0f;
        sprintMP = _charData.sprintMana;
        cannotSprint = false;
        sprintRecoverTime = _charData.sprintRecoverTime;
        evadeMP = _charData.evadeMana;
        evadeCooltime = _charData.evadeCooltime;
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

            // 게임오버 사운드 이펙트를 출력
            GlobalEventBus.OnPlay2DSoundRequested?.Invoke(10305);
            GameOver(playerID);
        }
    }

    /* 플레이어 체력과 남은 제한 시간에 따라 Ambient 사운드 재생 */
    private void PlayAmbientSound(float timerRatio)
    {
        // 플레이어 체력이 50% 이상이고 idle 상태이면 남은 시간에 따른 사운드 루프를 출력
        if (hpCurrent >= 0.5 * hpMax)
        {
            if (timerRatio < lowTimeTirggerRatio_2)  GlobalEventBus.OnPlay2DSoundRequested?.Invoke(lowTimeAudioID_2);
            else if (timerRatio < lowTimeTirggerRatio_1) GlobalEventBus.OnPlay2DSoundRequested?.Invoke(lowTimeAudioID_1);
            else GlobalEventBus.OnPlay2DSoundRequested?.Invoke(defaultTimeAudioID);
        }
        // 플레이어 체력이 50% 이하이고 idle 상태이면 ambient 사운드 루프 출력
        else if (hpCurrent < 0.5 * hpMax && nowState == livingState.idle)
        {
            GlobalEventBus.OnPlay2DSoundRequested?.Invoke(lowHPAudio_ID);
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

        if (ShouldPreventTutorialDeath(dmg))
        {
            PreventTutorialDeath();
            return;
        }

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
        // 피해 입을 시 사운드 재생 이벤트
        int hitID = Hit_AudioIDPool[UnityEngine.Random.Range(0, Hit_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(hitID,transform.position);
        // 피해 입을 시 탈출 실패 처리
        GlobalEventBus.OnEscapeFailure?.Invoke(playerID);
    }

    /// <summary>
    /// 튜토리얼 씬에서는 전투 실습 중 사망으로 로비에 돌아가지 않도록 치명 피해만 차단합니다.
    /// 일반 인게임 씬에서는 기존 사망/결과 처리 흐름을 그대로 사용합니다.
    /// </summary>
    private bool ShouldPreventTutorialDeath(float damage)
    {
        return IsTutorialSceneActive() && hpCurrent - damage <= 0.0f;
    }

    /// <summary>
    /// 튜토리얼 사망 방지 처리입니다.
    /// HP를 1로 고정하고 피격 피드백과 튜토리얼 안내 이벤트만 발생시킵니다.
    /// </summary>
    private void PreventTutorialDeath()
    {
        hpCurrent = Mathf.Clamp(TutorialMinimumHp, 0.0f, hpMax);
        UpdateHp();

        VFXService.Instance?.Play(GameplayVFXIds.PlayerHit, transform.position, transform.rotation);
        GlobalEventBus.OnHitAnimate?.Invoke();

        int hitID = Hit_AudioIDPool[UnityEngine.Random.Range(0, Hit_AudioIDPool.Length)];
        GlobalEventBus.OnPlay3DSoundRequested?.Invoke(hitID, transform.position);

        TutorialManager.Instance?.ShowTutorialDeathPreventedRadio();
    }

    /// <summary>
    /// 튜토리얼은 기본 씬과 Additive 씬이 함께 로드되므로 TutorialScene 로드 여부로 판정합니다.
    /// </summary>
    private static bool IsTutorialSceneActive()
    {
        return SceneManager.GetSceneByName("TutorialScene").isLoaded;
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
            GlobalEventBus.OnPrintSprintCooltime?.Invoke(sprintRecoverTime);  //쿨타임 시작 시점 이벤트를 게임플레이 UI에 전달하는 이벤트
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
        // 방향 키 입력이 전달되지 않는 동안에는 구르기를 처리하지 않음
        if (_movement.movementInput.sqrMagnitude <= 0.001f) return;

        GetMp(-_useMana);
        _movement.PlayerEvade();
        lastEvadeTime = Time.time;
        GlobalEventBus.OnPrintEvadeCooltime?.Invoke(evadeCooltime);  //쿨타임 시작 시점 이벤트를 게임플레이 UI에 전달하는 이벤트
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
{% endraw %}
