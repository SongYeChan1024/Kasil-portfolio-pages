---
title: "2026-07-21_Enums_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/Define/Enums.cs cs /// /// 게임 내 모든 Enum형을 관리합니다 /// // 캐릭터 종류 public enum UserType main, // 메인 다이버 support // 적 "
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/Define/Enums.cs cs /// /// 게임 내 모든 Enum형을 관리합니다 /// // 캐릭터 종류 public enum UserType main, // 메인 다이버 support // 적 "
published: true
migration_id: "3a436532580e8199af37c08fd40ff8cc"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/Define/Enums.cs</code>

```cs
/// <summary>
/// 게임 내 모든 Enum형을 관리합니다
/// </summary>

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
    empty,          // 빈 칸
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
```

```cs
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

public enum AudioType
{
    BGM,        //배경 사운드
    SFX,        //효과음
    UI,         //UI 사운드
    AMBIENT     //환경 사운드
}
```

## 2. 변경 설명

<code>itemCategory</code>의 각 항목에 0\~6의 명시적 직렬화 번호를 부여했습니다. 열거형 선언 순서가 나중에 바뀌더라도 기존 씬·프리팹·ScriptableObject에 저장된 카테고리 값이 다른 항목으로 밀리지 않도록 데이터 호환성을 고정한 변경입니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/Define/Enums.cs</code>

```cs
/// <summary>
/// 게임 내 모든 Enum형을 관리합니다
/// </summary>

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
    // 프리팹과 씬에 저장되는 enum 값이 항목 추가로 밀리지 않도록 번호를 명시적으로 고정합니다.
    empty = 0,      // 빈 칸
    idle = 1,       // 기타 아이템
    weapon = 2,     // 무장
    armor = 3,      // 방어구
    consume = 4,    // 소모품
    memory = 5,     // 기억 파편
    artifact = 6    // 장비형 아이템
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
```

```cs
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

public enum AudioType
{
    BGM,        //배경 사운드
    SFX,        //효과음
    UI,         //UI 사운드
    AMBIENT     //환경 사운드
}
```
{% endraw %}
