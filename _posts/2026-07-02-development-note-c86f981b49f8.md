---
title: "2026-07-02_enemy_noise_system_script_compare"
date: 2026-07-02 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-02\\_enemy\\_noise\\_system\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 2일 기준으로 정리한 에너미 노이즈 시스템 관련 스크립트 비교 문서다. 각 항목은 원본 스크립트 -> 설명 -> 수정된 스크립트 순서로 구성했고, 원본 스"
description: "2026-07-02\\_enemy\\_noise\\_system\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 2일 기준으로 정리한 에너미 노이즈 시스템 관련 스크립트 비교 문서다. 각 항목은 원본 스크립트 -> 설명 -> 수정된 스크립트 순서로 구성했고, 원본 스"
published: true
migration_id: "39136532580e803ba5abc86f981b49f8"
migration_status: "published"
migration_flags: ["local_code_link_unlinked", "publication_review"]
---

{% raw %}
# 2026-07-02\_enemy\_noise\_system\_script\_compare

## 1. 문서 개요

이 문서는 2026년 7월 2일 기준으로 정리한 에너미 노이즈 시스템 관련 스크립트 비교 문서다. 각 항목은 <code>원본 스크립트 -&gt; 설명 -&gt; 수정된 스크립트</code> 순서로 구성했고, 원본 스크립트는 현재 브랜치의 <code>HEAD</code> 기준 파일을 사용했다.

<code>HEAD</code>에 존재하지 않는 파일은 이번 작업에서 새로 추가된 파일이므로 원본 영역에 별도로 표기했다. 수정된 스크립트는 현재 프로젝트에 들어 있는 최신 내용 기준으로 정리했다.

## 2. 스크립트별 비교

### 2.1 NoiseType.cs

원본 경로: <code>Assets/02_Scripts/Define/NoiseType.cs</code>

#### 원본 스크립트

```cs
///<summary>
/// 적 AI가 구분할 수 있는 소음 종류입니다.
/// "어떤 행동에서 발생한 소리인가"를 표현하는 분류값으로만 사용합니다.
///</summary>
public enum NoiseType
{
    Walk,
    Run,
    Gunshot,
    ChestOpen,
    Skill,
    EnemyAlertCry,
    HitReaction,
    CombatImpact,
    Decoy
}
```

#### 설명

에너미 AI가 구분해서 처리할 소음 종류를 enum으로 정의하는 파일이다. 걷기, 달리기, 총성, 상호작용 같은 노이즈 타입을 코드 전역에서 같은 기준으로 참조할 수 있게 만든다.

#### 수정된 스크립트

```cs
///<summary>
/// 적 AI가 구분할 수 있는 소음 종류입니다.
/// "어떤 행동에서 발생한 소리인가"를 표현하는 분류값으로만 사용합니다.
///</summary>
public enum NoiseType
{
    Walk,
    Run,
    Gunshot,
    ChestOpen,
    Skill,
    EnemyAlertCry,
    HitReaction,
    CombatImpact,
    Decoy
}
```

### 2.2 NoiseStimulus.cs

원본 경로: <code>Assets/02_Scripts/Define/Data/NoiseStimulus.cs</code>

#### 원본 스크립트

```cs
using UnityEngine;

[System.Serializable]
public struct NoiseStimulus
{
    // 이번에 실제로 발생한 소음 1건의 런타임 데이터입니다.
    public NoiseType Type;
    public Vector3 Position;
    public float Radius;
    public float Duration;
    public int Priority;
    public bool CanInterruptChase;
    public float CreatedTime;
    public GameObject Source;
    public Transform AnchorTransform;

    public NoiseStimulus(
        NoiseType type,
        Vector3 position,
        GameObject source,
        float radius = -1.0f,
        float duration = -1.0f,
        bool canInterruptChase = false,
        int priority = -1,
        float createdTime = -1.0f,
        Transform anchorTransform = null)
    {
        Type = type;
        Position = position;
        Radius = radius;
        Duration = duration;
        Priority = priority;
        CanInterruptChase = canInterruptChase;
        CreatedTime = createdTime >= 0.0f ? createdTime : Time.time;
        Source = source;
        AnchorTransform = anchorTransform;
    }
}
```

#### 설명

실제로 발생한 소음 1건을 표현하는 데이터 구조다. 소음 타입, 발생 위치, 반경, 발생 주체, 우선순위, 생성 시각 같은 값을 한 번에 묶어서 에너미와 매니저가 동일한 데이터로 소통하게 한다.

#### 수정된 스크립트

```cs
using UnityEngine;

[System.Serializable]
public struct NoiseStimulus
{
    // 이번에 실제로 발생한 소음 1건의 런타임 데이터입니다.
    public NoiseType Type;
    public Vector3 Position;
    public float Radius;
    public float Duration;
    public int Priority;
    public bool CanInterruptChase;
    public float CreatedTime;
    public GameObject Source;
    public Transform AnchorTransform;

    public NoiseStimulus(
        NoiseType type,
        Vector3 position,
        GameObject source,
        float radius = -1.0f,
        float duration = -1.0f,
        bool canInterruptChase = false,
        int priority = -1,
        float createdTime = -1.0f,
        Transform anchorTransform = null)
    {
        Type = type;
        Position = position;
        Radius = radius;
        Duration = duration;
        Priority = priority;
        CanInterruptChase = canInterruptChase;
        CreatedTime = createdTime >= 0.0f ? createdTime : Time.time;
        Source = source;
        AnchorTransform = anchorTransform;
    }
}
```

### 2.3 NoiseSystem.cs

원본 경로: <code>Assets/02_Scripts/Utils/NoiseSystem.cs</code>

#### 원본 스크립트

```cs
using UnityEngine;

///<summary>
/// 게임 플레이 코드가 소음을 발생시킬 때 사용하는 공용 진입점입니다.
/// 실제 처리와 브로드캐스트는 NoiseManager가 담당합니다.
///</summary>
public static class NoiseSystem
{
    ///<summary>
    /// 특정 위치에서 소음을 발생시켜 달라고 노이즈 매니저에 요청합니다.
    /// radius / duration / priority를 음수로 넘기면 NoiseManager의 기본값을 사용합니다.
    ///</summary>
    public static void Emit(
        NoiseType type,
        Vector3 position,
        GameObject source = null,
        float radius = -1.0f,
        float duration = -1.0f,
        bool canInterruptChase = false,
        int priority = -1)
    {
        GlobalEventBus.OnNoiseRequested?.Invoke(new NoiseStimulus(
            type,
            position,
            source,
            radius,
            duration,
            canInterruptChase,
            priority,
            Time.time));
    }
}
```

#### 설명

게임 코드 어디서든 일관된 방식으로 소음을 요청할 수 있도록 만든 유틸리티 계층이다. 호출부에서 복잡한 내부 처리나 이벤트 구조를 몰라도 노이즈를 발생시킬 수 있게 연결해 준다.

#### 수정된 스크립트

```cs
using UnityEngine;

///<summary>
/// 게임 플레이 코드가 소음을 발생시킬 때 사용하는 공용 진입점입니다.
/// 실제 처리와 브로드캐스트는 NoiseManager가 담당합니다.
///</summary>
public static class NoiseSystem
{
    ///<summary>
    /// 특정 위치에서 소음을 발생시켜 달라고 노이즈 매니저에 요청합니다.
    /// radius / duration / priority를 음수로 넘기면 NoiseManager의 기본값을 사용합니다.
    ///</summary>
    public static void Emit(
        NoiseType type,
        Vector3 position,
        GameObject source = null,
        float radius = -1.0f,
        float duration = -1.0f,
        bool canInterruptChase = false,
        int priority = -1)
    {
        GlobalEventBus.OnNoiseRequested?.Invoke(new NoiseStimulus(
            type,
            position,
            source,
            radius,
            duration,
            canInterruptChase,
            priority,
            Time.time));
    }
}
```

### 2.4 GlobalEventBus.cs

원본 경로: <code>Assets/02_Scripts/Utils/GlobalEventBus.cs</code>

#### 원본 스크립트

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
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
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

#### 설명

프로젝트 전역 이벤트 허브에 노이즈 요청과 노이즈 발생 이벤트를 추가한 파일이다. 플레이어, 상자, 무기, 에너미, 매니저가 서로 직접 의존하지 않고도 소음 정보를 주고받을 수 있게 만든다.

#### 수정된 스크립트

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
    public static Action<int, float, float> OnEnemyHealthChanged;   // 적의 체력 변동: Action<고유 번호, 현재 체력, 전체 체력>
    public static Action<int> OnEnemyDead;                          // 적의 사망 여부: Action<고유 번호>

    ///<summary>
    /// 게임 시스템 관련 이벤트
    ///</summary>
    public static Action<bool> OnEscapeRequest;                     // 탈출 판정 발생 시: Action<탈출 성공 여부>
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

### 2.5 NoiseManager.cs

원본 경로: <code>Assets/02_Scripts/Manager/NoiseManager.cs</code>

#### 원본 스크립트

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 게임 전체의 소음 요청을 받아 실제 소음 이벤트로 확정하고 브로드캐스트하는 중앙 관리자입니다.
/// 소리 종류별 기본 범위, 지속 시간, 우선순위를 한곳에서 관리합니다.
///</summary>
public class NoiseManager : MonoBehaviour
{
    [Serializable]
    private struct NoiseTypeSetting
    {
        public NoiseType type;
        public float defaultRadius;
        public float defaultDuration;
        public int priority;
        public bool canInterruptChase;
        public Color debugColor;
    }

    public static NoiseManager Instance { get; private set; }

    [Header("Noise Debug")]
    [SerializeField] private bool createNoiseMarkers = true;
    [SerializeField] private NoiseSourceObject noiseSourcePrefab;

    [Header("Noise Settings")]
    [SerializeField] private List<NoiseTypeSetting> noiseSettings = new()
    {
        new NoiseTypeSetting { type = NoiseType.Walk, defaultRadius = 15.0f, defaultDuration = 0.5f, priority = 5, canInterruptChase = false, debugColor = new Color(0.25f, 0.7f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Run, defaultRadius = 20.0f, defaultDuration = 0.7f, priority = 10, canInterruptChase = false, debugColor = new Color(0.1f, 0.9f, 0.9f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Gunshot, defaultRadius = 40.0f, defaultDuration = 1.2f, priority = 30, canInterruptChase = false, debugColor = new Color(1.0f, 0.6f, 0.1f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.ChestOpen, defaultRadius = 30.0f, defaultDuration = 1.8f, priority = 40, canInterruptChase = true, debugColor = new Color(1.0f, 0.9f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Skill, defaultRadius = 12.0f, defaultDuration = 1.0f, priority = 35, canInterruptChase = false, debugColor = new Color(0.8f, 0.4f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.EnemyAlertCry, defaultRadius = 13.0f, defaultDuration = 1.2f, priority = 45, canInterruptChase = false, debugColor = new Color(1.0f, 0.2f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.HitReaction, defaultRadius = 5.0f, defaultDuration = 0.6f, priority = 15, canInterruptChase = false, debugColor = new Color(0.9f, 0.5f, 0.5f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.CombatImpact, defaultRadius = 8.0f, defaultDuration = 0.8f, priority = 20, canInterruptChase = false, debugColor = new Color(0.9f, 0.35f, 0.15f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Decoy, defaultRadius = 18.0f, defaultDuration = 2.5f, priority = 60, canInterruptChase = true, debugColor = new Color(0.4f, 1.0f, 0.35f, 1.0f) },
    };

    private readonly Dictionary<NoiseType, NoiseTypeSetting> cachedSettings = new();

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void EnsureInstance()
    {
        if (Instance != null)
        {
            return;
        }

        // 씬에 배치하지 않아도 노이즈 시스템이 항상 동작하도록 자동 생성합니다.
        GameObject noiseManagerObject = new("NoiseManager");
        DontDestroyOnLoad(noiseManagerObject);
        noiseManagerObject.AddComponent<NoiseManager>();
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
        CacheSettings();
    }

    private void OnEnable()
    {
        CacheSettings();
        GlobalEventBus.OnNoiseRequested += HandleNoiseRequested;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnNoiseRequested -= HandleNoiseRequested;
    }

    private void CacheSettings()
    {
        cachedSettings.Clear();

        for (int i = 0; i < noiseSettings.Count; i++)
        {
            cachedSettings[noiseSettings[i].type] = noiseSettings[i];
        }
    }

    private void HandleNoiseRequested(NoiseStimulus requestedStimulus)
    {
        NoiseStimulus resolvedStimulus = ResolveStimulus(requestedStimulus);
        NoiseSourceObject spawnedNoiseSource = null;

        if (createNoiseMarkers && resolvedStimulus.Duration > 0.0f)
        {
            spawnedNoiseSource = CreateNoiseSourceObject(resolvedStimulus);
        }

        if (spawnedNoiseSource != null)
        {
            // AI 가 실제 노이즈 오브젝트를 기준점으로 삼을 수 있게 앵커를 연결합니다.
            resolvedStimulus.Position = spawnedNoiseSource.transform.position;
            resolvedStimulus.AnchorTransform = spawnedNoiseSource.transform;
        }

        GlobalEventBus.OnNoiseEmitted?.Invoke(resolvedStimulus);
    }

    private NoiseStimulus ResolveStimulus(NoiseStimulus requestedStimulus)
    {
        NoiseTypeSetting setting = GetNoiseSetting(requestedStimulus.Type);

        float radius = requestedStimulus.Radius > 0.0f ? requestedStimulus.Radius : setting.defaultRadius;
        float duration = requestedStimulus.Duration > 0.0f ? requestedStimulus.Duration : setting.defaultDuration;
        int priority = requestedStimulus.Priority >= 0 ? requestedStimulus.Priority : setting.priority;
        bool canInterruptChase = requestedStimulus.CanInterruptChase || setting.canInterruptChase;

        return new NoiseStimulus(
            requestedStimulus.Type,
            requestedStimulus.Position,
            requestedStimulus.Source,
            radius,
            duration,
            canInterruptChase,
            priority,
            requestedStimulus.CreatedTime,
            requestedStimulus.AnchorTransform);
    }

    private NoiseTypeSetting GetNoiseSetting(NoiseType noiseType)
    {
        if (cachedSettings.TryGetValue(noiseType, out NoiseTypeSetting setting))
        {
            return setting;
        }

        return new NoiseTypeSetting
        {
            type = noiseType,
            defaultRadius = 8.0f,
            defaultDuration = 1.0f,
            priority = 0,
            canInterruptChase = false,
            debugColor = Color.white,
        };
    }

    private NoiseSourceObject CreateNoiseSourceObject(NoiseStimulus stimulus)
    {
        // 공용 프리팹이 연결되어 있으면 그 오브젝트를 생성하고,
        // 없으면 코드로 최소 구성 오브젝트를 만들어도 기능은 끊기지 않게 합니다.
        NoiseSourceObject spawnedNoiseSource = null;

        if (noiseSourcePrefab != null)
        {
            spawnedNoiseSource = Instantiate(noiseSourcePrefab, stimulus.Position, Quaternion.identity);
            spawnedNoiseSource.name = $"Noise_{stimulus.Type}";
        }
        else
        {
            GameObject noiseObject = new($"Noise_{stimulus.Type}");
            noiseObject.transform.SetPositionAndRotation(stimulus.Position, Quaternion.identity);
            spawnedNoiseSource = noiseObject.AddComponent<NoiseSourceObject>();
        }

        spawnedNoiseSource.Initialize(stimulus, GetNoiseSetting(stimulus.Type).debugColor);
        return spawnedNoiseSource;
    }
}
```

#### 설명

노이즈 시스템의 실제 관리자 역할을 담당한다. 요청된 소음을 기본값과 타입 설정으로 보정하고, 필요하면 월드상의 노이즈 오브젝트를 생성한 뒤 최종 소음 정보를 에너미들에게 전파한다.

#### 수정된 스크립트

```cs
using System;
using System.Collections.Generic;
using UnityEngine;

///<summary>
/// 게임 전체의 소음 요청을 받아 실제 소음 이벤트로 확정하고 브로드캐스트하는 중앙 관리자입니다.
/// 소리 종류별 기본 범위, 지속 시간, 우선순위를 한곳에서 관리합니다.
///</summary>
public class NoiseManager : MonoBehaviour
{
    [Serializable]
    private struct NoiseTypeSetting
    {
        public NoiseType type;
        public float defaultRadius;
        public float defaultDuration;
        public int priority;
        public bool canInterruptChase;
        public Color debugColor;
    }

    public static NoiseManager Instance { get; private set; }

    [Header("Noise Debug")]
    [SerializeField] private bool createNoiseMarkers = true;
    [SerializeField] private NoiseSourceObject noiseSourcePrefab;

    [Header("Noise Settings")]
    [SerializeField] private List<NoiseTypeSetting> noiseSettings = new()
    {
        new NoiseTypeSetting { type = NoiseType.Walk, defaultRadius = 15.0f, defaultDuration = 0.5f, priority = 5, canInterruptChase = false, debugColor = new Color(0.25f, 0.7f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Run, defaultRadius = 20.0f, defaultDuration = 0.7f, priority = 10, canInterruptChase = false, debugColor = new Color(0.1f, 0.9f, 0.9f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Gunshot, defaultRadius = 40.0f, defaultDuration = 1.2f, priority = 30, canInterruptChase = false, debugColor = new Color(1.0f, 0.6f, 0.1f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.ChestOpen, defaultRadius = 30.0f, defaultDuration = 1.8f, priority = 40, canInterruptChase = true, debugColor = new Color(1.0f, 0.9f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Skill, defaultRadius = 12.0f, defaultDuration = 1.0f, priority = 35, canInterruptChase = false, debugColor = new Color(0.8f, 0.4f, 1.0f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.EnemyAlertCry, defaultRadius = 13.0f, defaultDuration = 1.2f, priority = 45, canInterruptChase = false, debugColor = new Color(1.0f, 0.2f, 0.2f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.HitReaction, defaultRadius = 5.0f, defaultDuration = 0.6f, priority = 15, canInterruptChase = false, debugColor = new Color(0.9f, 0.5f, 0.5f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.CombatImpact, defaultRadius = 8.0f, defaultDuration = 0.8f, priority = 20, canInterruptChase = false, debugColor = new Color(0.9f, 0.35f, 0.15f, 1.0f) },
        new NoiseTypeSetting { type = NoiseType.Decoy, defaultRadius = 18.0f, defaultDuration = 2.5f, priority = 60, canInterruptChase = true, debugColor = new Color(0.4f, 1.0f, 0.35f, 1.0f) },
    };

    private readonly Dictionary<NoiseType, NoiseTypeSetting> cachedSettings = new();

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void EnsureInstance()
    {
        if (Instance != null)
        {
            return;
        }

        // 씬에 배치하지 않아도 노이즈 시스템이 항상 동작하도록 자동 생성합니다.
        GameObject noiseManagerObject = new("NoiseManager");
        DontDestroyOnLoad(noiseManagerObject);
        noiseManagerObject.AddComponent<NoiseManager>();
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
        CacheSettings();
    }

    private void OnEnable()
    {
        CacheSettings();
        GlobalEventBus.OnNoiseRequested += HandleNoiseRequested;
    }

    private void OnDisable()
    {
        GlobalEventBus.OnNoiseRequested -= HandleNoiseRequested;
    }

    private void CacheSettings()
    {
        cachedSettings.Clear();

        for (int i = 0; i < noiseSettings.Count; i++)
        {
            cachedSettings[noiseSettings[i].type] = noiseSettings[i];
        }
    }

    private void HandleNoiseRequested(NoiseStimulus requestedStimulus)
    {
        NoiseStimulus resolvedStimulus = ResolveStimulus(requestedStimulus);
        NoiseSourceObject spawnedNoiseSource = null;

        if (createNoiseMarkers && resolvedStimulus.Duration > 0.0f)
        {
            spawnedNoiseSource = CreateNoiseSourceObject(resolvedStimulus);
        }

        if (spawnedNoiseSource != null)
        {
            // AI 가 실제 노이즈 오브젝트를 기준점으로 삼을 수 있게 앵커를 연결합니다.
            resolvedStimulus.Position = spawnedNoiseSource.transform.position;
            resolvedStimulus.AnchorTransform = spawnedNoiseSource.transform;
        }

        GlobalEventBus.OnNoiseEmitted?.Invoke(resolvedStimulus);
    }

    private NoiseStimulus ResolveStimulus(NoiseStimulus requestedStimulus)
    {
        NoiseTypeSetting setting = GetNoiseSetting(requestedStimulus.Type);

        float radius = requestedStimulus.Radius > 0.0f ? requestedStimulus.Radius : setting.defaultRadius;
        float duration = requestedStimulus.Duration > 0.0f ? requestedStimulus.Duration : setting.defaultDuration;
        int priority = requestedStimulus.Priority >= 0 ? requestedStimulus.Priority : setting.priority;
        bool canInterruptChase = requestedStimulus.CanInterruptChase || setting.canInterruptChase;

        return new NoiseStimulus(
            requestedStimulus.Type,
            requestedStimulus.Position,
            requestedStimulus.Source,
            radius,
            duration,
            canInterruptChase,
            priority,
            requestedStimulus.CreatedTime,
            requestedStimulus.AnchorTransform);
    }

    private NoiseTypeSetting GetNoiseSetting(NoiseType noiseType)
    {
        if (cachedSettings.TryGetValue(noiseType, out NoiseTypeSetting setting))
        {
            return setting;
        }

        return new NoiseTypeSetting
        {
            type = noiseType,
            defaultRadius = 8.0f,
            defaultDuration = 1.0f,
            priority = 0,
            canInterruptChase = false,
            debugColor = Color.white,
        };
    }

    private NoiseSourceObject CreateNoiseSourceObject(NoiseStimulus stimulus)
    {
        // 공용 프리팹이 연결되어 있으면 그 오브젝트를 생성하고,
        // 없으면 코드로 최소 구성 오브젝트를 만들어도 기능은 끊기지 않게 합니다.
        NoiseSourceObject spawnedNoiseSource = null;

        if (noiseSourcePrefab != null)
        {
            spawnedNoiseSource = Instantiate(noiseSourcePrefab, stimulus.Position, Quaternion.identity);
            spawnedNoiseSource.name = $"Noise_{stimulus.Type}";
        }
        else
        {
            GameObject noiseObject = new($"Noise_{stimulus.Type}");
            noiseObject.transform.SetPositionAndRotation(stimulus.Position, Quaternion.identity);
            spawnedNoiseSource = noiseObject.AddComponent<NoiseSourceObject>();
        }

        spawnedNoiseSource.Initialize(stimulus, GetNoiseSetting(stimulus.Type).debugColor);
        return spawnedNoiseSource;
    }
}
```

### 2.6 NoiseSourceObject.cs

원본 경로: <code>Assets/02_Scripts/System/Noise/NoiseSourceObject.cs</code>

#### 원본 스크립트

```cs
using UnityEngine;

///<summary>
/// 런타임에 잠깐 생성되어 "소리가 여기서 났다"는 기준점을 제공하는 오브젝트입니다.
/// 적 AI는 이 오브젝트의 위치를 조사 대상으로 삼을 수 있고,
/// 이후 SoundManager를 붙이면 같은 위치에서 실제 SFX를 재생하는 용도로도 확장할 수 있습니다.
///</summary>
public class NoiseSourceObject : MonoBehaviour
{
    [Header("Optional Components")]
    [SerializeField] private AudioSource audioSource;

    [Header("Debug")]
    [SerializeField] private bool drawDebugRadius = true;

    private NoiseStimulus stimulus;
    private Color debugColor = Color.white;

    public NoiseStimulus Stimulus => stimulus;
    public AudioSource CachedAudioSource => audioSource;

    private void Awake()
    {
        if (audioSource == null)
        {
            audioSource = GetComponent<AudioSource>();
        }
    }

    ///<summary>
    /// 노이즈 매니저가 확정한 소음 데이터를 이 오브젝트에 주입합니다.
    ///</summary>
    public void Initialize(NoiseStimulus newStimulus, Color newDebugColor)
    {
        stimulus = newStimulus;
        debugColor = newDebugColor;

        transform.position = stimulus.Position;

        // 현재는 실제 SFX를 자동 재생하지 않지만, AudioSource는 이후 확장 포인트로 유지합니다.
        Destroy(gameObject, Mathf.Max(0.05f, stimulus.Duration));
    }

    private void OnDrawGizmos()
    {
        if (!drawDebugRadius || stimulus.Radius <= 0.0f)
        {
            return;
        }

        Gizmos.color = debugColor;
        Gizmos.DrawWireSphere(transform.position, stimulus.Radius);
    }
}
```

#### 설명

씬 안에 잠깐 생성되는 노이즈 소스 오브젝트의 동작을 담당한다. 소음이 발생한 지점에 잠시 남아 시각적·논리적 기준점이 되며, 추후 실제 SFX나 디버그 확장과도 연결하기 쉬운 구조를 만든다.

#### 수정된 스크립트

```cs
using UnityEngine;

///<summary>
/// 런타임에 잠깐 생성되어 "소리가 여기서 났다"는 기준점을 제공하는 오브젝트입니다.
/// 적 AI는 이 오브젝트의 위치를 조사 대상으로 삼을 수 있고,
/// 이후 SoundManager를 붙이면 같은 위치에서 실제 SFX를 재생하는 용도로도 확장할 수 있습니다.
///</summary>
public class NoiseSourceObject : MonoBehaviour
{
    [Header("Optional Components")]
    [SerializeField] private AudioSource audioSource;

    [Header("Debug")]
    [SerializeField] private bool drawDebugRadius = true;

    private NoiseStimulus stimulus;
    private Color debugColor = Color.white;

    public NoiseStimulus Stimulus => stimulus;
    public AudioSource CachedAudioSource => audioSource;

    private void Awake()
    {
        if (audioSource == null)
        {
            audioSource = GetComponent<AudioSource>();
        }
    }

    ///<summary>
    /// 노이즈 매니저가 확정한 소음 데이터를 이 오브젝트에 주입합니다.
    ///</summary>
    public void Initialize(NoiseStimulus newStimulus, Color newDebugColor)
    {
        stimulus = newStimulus;
        debugColor = newDebugColor;

        transform.position = stimulus.Position;

        // 현재는 실제 SFX를 자동 재생하지 않지만, AudioSource는 이후 확장 포인트로 유지합니다.
        Destroy(gameObject, Mathf.Max(0.05f, stimulus.Duration));
    }

    private void OnDrawGizmos()
    {
        if (!drawDebugRadius || stimulus.Radius <= 0.0f)
        {
            return;
        }

        Gizmos.color = debugColor;
        Gizmos.DrawWireSphere(transform.position, stimulus.Radius);
    }
}
```

### 2.7 PlayerMovement.cs

원본 경로: <code>Assets/02_Scripts/System/Player/PlayerMovement.cs</code>

#### 원본 스크립트

#### 설명

플레이어 이동 상태에 따라 걷기 소음과 달리기 소음을 주기적으로 발생시키도록 확장한 파일이다. 플레이어가 눈에 보이지 않아도 에너미가 발소리를 듣고 반응할 수 있는 기반을 만든다.

#### 수정된 스크립트

### 2.8 PlayerWeapon.cs

원본 경로: <code>Assets/02_Scripts/System/Player/PlayerWeapon.cs</code>

#### 원본 스크립트

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

            IDamageable target = shotHit.collider.GetComponentInParent<IDamageable>();

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
        if(!weaponData.itemPrefabRef.RuntimeKeyIsValid()) return;
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

#### 설명

플레이어가 무기를 사용할 때 총성과 같은 강한 소음을 발생시키도록 연결한 파일이다. 전투 상황에서 시야 밖 에너미도 사격 위치를 조사하러 올 수 있게 만드는 핵심 지점이다.

#### 수정된 스크립트

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

            IDamageable target = shotHit.collider.GetComponentInParent<IDamageable>();

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
        if(!weaponData.itemPrefabRef.RuntimeKeyIsValid()) return;
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

### 2.9 ItemBox.cs

원본 경로: <code>Assets/02_Scripts/System/ItemBox.cs</code>

#### 원본 스크립트

#### 설명

상자나 상호작용 오브젝트를 열 때 소음이 발생하도록 확장한 파일이다. 단순 루팅 상호작용도 에너미 어그로와 연결되도록 만들어 잠입 플레이와 위험 관리 요소를 강화한다.

#### 수정된 스크립트

### 2.10 EnemyStatus.cs

원본 경로: <code>Assets/02_Scripts/System/Enemy/EnemyStatus.cs</code>

#### 원본 스크립트

```cs
using System;
using UnityEngine;

public class EnemyStatus : MonoBehaviour, IDamageable
{
    // 이번 노이즈 시스템 작업으로 "소리를 듣고 조사하는 상태"를 추가합니다.
    public enum EnemyState
    {
        Idle,
        Investigate,
        Chase,
        Attack,
        Dead
    }

    public EnemyState nowState { get; private set; }    // 현재 적 상태
    public bool isAttacking { get; private set; }       // 공격 수행 여부

    public int objID = 0;                               // 적 개체 식별용 ID
    public float hpMax;                                 // 최대 체력
    public float hpCurrent;                             // 현재 체력
    public float atkValue  { get; private set; }        // 공격력
    public float defValue { get; private set; }         // 방어력

    public event Action OnLocalDeath;                   // 이 적이 죽었을 때만 알리는 로컬 이벤트

    public void SetIsAttacking(bool attacking)
    {
        isAttacking = attacking;
    }

    public void SetNowState(EnemyState state)
    {
        nowState = state;
    }

    private void Awake()
    {
        nowState = EnemyState.Idle;

        // 현재 프로젝트에서는 기본 스탯을 여기서 초기화합니다.
        hpMax = 100.0f;
        hpCurrent = hpMax;
        atkValue = 10.0f;
        defValue = 0.0f;
    }

    private void Start()
    {
        UpdateHp();
    }

    private void UpdateHp()
    {
        // UI와 디버그 로직이 현재 체력을 받을 수 있도록 이벤트를 보냅니다.
        GlobalEventBus.OnEnemyHealthChanged?.Invoke(0, hpCurrent, hpMax);
    }

    public Faction EntityFaction => Faction.enemy;

    public void TakeDamage(float damage)
    {
        hpCurrent = Mathf.Clamp(hpCurrent - damage, 0.0f, hpMax);
        GlobalEventBus.OnEnemyHealthChanged?.Invoke(objID, hpCurrent, hpMax);

        if (hpCurrent <= 0.0f)
        {
            nowState = EnemyState.Dead;
            OnLocalDeath?.Invoke();
            GlobalEventBus.OnEnemyDead?.Invoke(objID);
        }
    }
}
```

#### 설명

에너미 FSM 상태 정의에 Investigate 상태를 추가한 파일이다. 시야 인식 전투 상태와 별개로, 소리가 난 위치를 확인하러 가는 중간 행동 단계를 명확하게 분리해 준다.

#### 수정된 스크립트

```cs
using System;
using UnityEngine;

public class EnemyStatus : MonoBehaviour, IDamageable
{
    // 이번 노이즈 시스템 작업으로 "소리를 듣고 조사하는 상태"를 추가합니다.
    public enum EnemyState
    {
        Idle,
        Investigate,
        Chase,
        Attack,
        Dead
    }

    public EnemyState nowState { get; private set; }    // 현재 적 상태
    public bool isAttacking { get; private set; }       // 공격 수행 여부

    public int objID = 0;                               // 적 개체 식별용 ID
    public float hpMax;                                 // 최대 체력
    public float hpCurrent;                             // 현재 체력
    public float atkValue  { get; private set; }        // 공격력
    public float defValue { get; private set; }         // 방어력

    public event Action OnLocalDeath;                   // 이 적이 죽었을 때만 알리는 로컬 이벤트

    public void SetIsAttacking(bool attacking)
    {
        isAttacking = attacking;
    }

    public void SetNowState(EnemyState state)
    {
        nowState = state;
    }

    private void Awake()
    {
        nowState = EnemyState.Idle;

        // 현재 프로젝트에서는 기본 스탯을 여기서 초기화합니다.
        hpMax = 100.0f;
        hpCurrent = hpMax;
        atkValue = 10.0f;
        defValue = 0.0f;
    }

    private void Start()
    {
        UpdateHp();
    }

    private void UpdateHp()
    {
        // UI와 디버그 로직이 현재 체력을 받을 수 있도록 이벤트를 보냅니다.
        GlobalEventBus.OnEnemyHealthChanged?.Invoke(0, hpCurrent, hpMax);
    }

    public Faction EntityFaction => Faction.enemy;

    public void TakeDamage(float damage)
    {
        hpCurrent = Mathf.Clamp(hpCurrent - damage, 0.0f, hpMax);
        GlobalEventBus.OnEnemyHealthChanged?.Invoke(objID, hpCurrent, hpMax);

        if (hpCurrent <= 0.0f)
        {
            nowState = EnemyState.Dead;
            OnLocalDeath?.Invoke();
            GlobalEventBus.OnEnemyDead?.Invoke(objID);
        }
    }
}
```

### 2.11 EnemyMovement.cs

원본 경로: <code>Assets/02_Scripts/System/Enemy/EnemyMovement.cs</code>

#### 원본 스크립트

#### 설명

이번 작업의 핵심 로직이 들어 있는 파일이다. 시야 기반 추적 위에 청각 기반 조사 로직, 어그로 유지 범위, 소음 우선순위 판단, 조사 지점 이동을 얹어서 적이 더 자연스럽게 반응하도록 만든다.

#### 수정된 스크립트

### 2.12 VisionGizmo.cs

원본 경로: <code>Assets/02_Scripts/System/VisionGizmo.cs</code>

#### 원본 스크립트

```cs
using UnityEngine;
using UnityEngine.Serialization;

public class VisionGizmo : MonoBehaviour
{
    private enum GizmoDrawMode
    {
        SelectedOnly,
        Always
    }

    [Header("Draw Mode")]
    [SerializeField] private GizmoDrawMode drawMode = GizmoDrawMode.SelectedOnly;

    [Header("Gizmo Option")]
    [FormerlySerializedAs("drawSightRadius")]
    [SerializeField] private bool drawAwarenessRadius = true;
    [SerializeField] private bool drawHearingRadius = true;
    [SerializeField] private bool drawTargetLine = true;
    [SerializeField] private int arcSegmentCount = 24;

    [Header("Gizmo Color")]
    [FormerlySerializedAs("radiusColor")]
    [SerializeField] private Color awarenessRadiusColor = Color.white;
    [SerializeField] private Color hearingRadiusColor = new Color(1.0f, 0.55f, 0.0f, 1.0f);
    [SerializeField] private Color forwardColor = Color.yellow;
    [SerializeField] private Color boundaryColor = Color.cyan;
    [SerializeField] private Color arcColor = Color.red;
    [SerializeField] private Color targetLineColor = Color.green;

    private EnemyMovement enemyMovement;

    private EnemyMovement VisionSource
    {
        get
        {
            if (enemyMovement == null)
            {
                enemyMovement = GetComponent<EnemyMovement>();
            }

            return enemyMovement;
        }
    }

    private void OnDrawGizmos()
    {
        if (drawMode != GizmoDrawMode.Always)
        {
            return;
        }

        DrawVisionGizmo();
    }

    private void OnDrawGizmosSelected()
    {
        if (drawMode != GizmoDrawMode.SelectedOnly)
        {
            return;
        }

        DrawVisionGizmo();
    }

    private void DrawVisionGizmo()
    {
        EnemyMovement source = VisionSource;
        if (source == null)
        {
            return;
        }

        Vector3 eyePosition = transform.position + Vector3.up * source.EyeHeight;

        Vector3 flatForward = transform.forward;
        flatForward.y = 0.0f;

        if (flatForward.sqrMagnitude <= 0.001f)
        {
            flatForward = Vector3.forward;
        }

        flatForward.Normalize();

        float halfAngle = source.SightAngle * 0.5f;
        float sightLength = source.SightLength;

        Vector3 leftDirection = Quaternion.Euler(0.0f, -halfAngle, 0.0f) * flatForward;
        Vector3 rightDirection = Quaternion.Euler(0.0f, halfAngle, 0.0f) * flatForward;

        if (drawHearingRadius)
        {
            Gizmos.color = hearingRadiusColor;
            Gizmos.DrawWireSphere(transform.position, source.HearingRange);
        }

        if (drawAwarenessRadius)
        {
            Gizmos.color = awarenessRadiusColor;
            Gizmos.DrawWireSphere(transform.position, source.AwarenessRange);
        }

        Gizmos.color = forwardColor;
        Gizmos.DrawLine(eyePosition, eyePosition + flatForward * sightLength);

        Gizmos.color = boundaryColor;
        Gizmos.DrawLine(eyePosition, eyePosition + leftDirection * sightLength);
        Gizmos.DrawLine(eyePosition, eyePosition + rightDirection * sightLength);

        DrawVisionArc(eyePosition, flatForward, sightLength, source.SightAngle);

        if (drawTargetLine && Application.isPlaying && source.CurrentTarget != null)
        {
            Gizmos.color = targetLineColor;
            Gizmos.DrawLine(eyePosition, source.CurrentTarget.position + Vector3.up * source.EyeHeight);
        }
    }

    private void DrawVisionArc(Vector3 origin, Vector3 forward, float radius, float angle)
    {
        int segmentCount = Mathf.Max(3, arcSegmentCount);
        float startAngle = -angle * 0.5f;
        float endAngle = angle * 0.5f;

        Gizmos.color = arcColor;

        Vector3 previousPoint = origin + (Quaternion.Euler(0.0f, startAngle, 0.0f) * forward) * radius;

        for (int i = 1; i <= segmentCount; i++)
        {
            float t = (float)i / segmentCount;
            float currentAngle = Mathf.Lerp(startAngle, endAngle, t);
            Vector3 currentPoint = origin + (Quaternion.Euler(0.0f, currentAngle, 0.0f) * forward) * radius;

            Gizmos.DrawLine(previousPoint, currentPoint);
            previousPoint = currentPoint;
        }
    }
}
```

#### 설명

Scene 뷰에서 에너미의 시야, 인지 범위, 청각 범위를 디버그로 확인할 수 있게 만든 파일이다. 디자이너와 프로그래머가 수치 조정 결과를 바로 눈으로 확인할 수 있도록 돕는다.

#### 수정된 스크립트

```cs
using UnityEngine;
using UnityEngine.Serialization;

public class VisionGizmo : MonoBehaviour
{
    private enum GizmoDrawMode
    {
        SelectedOnly,
        Always
    }

    [Header("Draw Mode")]
    [SerializeField] private GizmoDrawMode drawMode = GizmoDrawMode.SelectedOnly;

    [Header("Gizmo Option")]
    [FormerlySerializedAs("drawSightRadius")]
    [SerializeField] private bool drawAwarenessRadius = true;
    [SerializeField] private bool drawHearingRadius = true;
    [SerializeField] private bool drawTargetLine = true;
    [SerializeField] private int arcSegmentCount = 24;

    [Header("Gizmo Color")]
    [FormerlySerializedAs("radiusColor")]
    [SerializeField] private Color awarenessRadiusColor = Color.white;
    [SerializeField] private Color hearingRadiusColor = new Color(1.0f, 0.55f, 0.0f, 1.0f);
    [SerializeField] private Color forwardColor = Color.yellow;
    [SerializeField] private Color boundaryColor = Color.cyan;
    [SerializeField] private Color arcColor = Color.red;
    [SerializeField] private Color targetLineColor = Color.green;

    private EnemyMovement enemyMovement;

    private EnemyMovement VisionSource
    {
        get
        {
            if (enemyMovement == null)
            {
                enemyMovement = GetComponent<EnemyMovement>();
            }

            return enemyMovement;
        }
    }

    private void OnDrawGizmos()
    {
        if (drawMode != GizmoDrawMode.Always)
        {
            return;
        }

        DrawVisionGizmo();
    }

    private void OnDrawGizmosSelected()
    {
        if (drawMode != GizmoDrawMode.SelectedOnly)
        {
            return;
        }

        DrawVisionGizmo();
    }

    private void DrawVisionGizmo()
    {
        EnemyMovement source = VisionSource;
        if (source == null)
        {
            return;
        }

        Vector3 eyePosition = transform.position + Vector3.up * source.EyeHeight;

        Vector3 flatForward = transform.forward;
        flatForward.y = 0.0f;

        if (flatForward.sqrMagnitude <= 0.001f)
        {
            flatForward = Vector3.forward;
        }

        flatForward.Normalize();

        float halfAngle = source.SightAngle * 0.5f;
        float sightLength = source.SightLength;

        Vector3 leftDirection = Quaternion.Euler(0.0f, -halfAngle, 0.0f) * flatForward;
        Vector3 rightDirection = Quaternion.Euler(0.0f, halfAngle, 0.0f) * flatForward;

        if (drawHearingRadius)
        {
            Gizmos.color = hearingRadiusColor;
            Gizmos.DrawWireSphere(transform.position, source.HearingRange);
        }

        if (drawAwarenessRadius)
        {
            Gizmos.color = awarenessRadiusColor;
            Gizmos.DrawWireSphere(transform.position, source.AwarenessRange);
        }

        Gizmos.color = forwardColor;
        Gizmos.DrawLine(eyePosition, eyePosition + flatForward * sightLength);

        Gizmos.color = boundaryColor;
        Gizmos.DrawLine(eyePosition, eyePosition + leftDirection * sightLength);
        Gizmos.DrawLine(eyePosition, eyePosition + rightDirection * sightLength);

        DrawVisionArc(eyePosition, flatForward, sightLength, source.SightAngle);

        if (drawTargetLine && Application.isPlaying && source.CurrentTarget != null)
        {
            Gizmos.color = targetLineColor;
            Gizmos.DrawLine(eyePosition, source.CurrentTarget.position + Vector3.up * source.EyeHeight);
        }
    }

    private void DrawVisionArc(Vector3 origin, Vector3 forward, float radius, float angle)
    {
        int segmentCount = Mathf.Max(3, arcSegmentCount);
        float startAngle = -angle * 0.5f;
        float endAngle = angle * 0.5f;

        Gizmos.color = arcColor;

        Vector3 previousPoint = origin + (Quaternion.Euler(0.0f, startAngle, 0.0f) * forward) * radius;

        for (int i = 1; i <= segmentCount; i++)
        {
            float t = (float)i / segmentCount;
            float currentAngle = Mathf.Lerp(startAngle, endAngle, t);
            Vector3 currentPoint = origin + (Quaternion.Euler(0.0f, currentAngle, 0.0f) * forward) * radius;

            Gizmos.DrawLine(previousPoint, currentPoint);
            previousPoint = currentPoint;
        }
    }
}
```
{% endraw %}
