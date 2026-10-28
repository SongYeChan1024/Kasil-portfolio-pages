---
title: "P0.5_꿈식자_에너미_연동_명세서_v1.0.0"
date: 2026-07-01 12:00:00 +0900
categories: ["개발 메모", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "P0.5 꿈식자 에너미 연동 명세서 (v1.0.1) \\ !IMPORTANT\\ 이 문서는 AI(Antigravity)가 작성한 초안입니다. 기획자/PM의 검토 및 승인 후 이 배너를 제거하면 ’확정 사양’으로 인정됩니다. --- 0. 기획 의도 (Design Intent) 목적 : 꿈식자"
description: "P0.5 꿈식자 에너미 연동 명세서 (v1.0.1) \\ !IMPORTANT\\ 이 문서는 AI(Antigravity)가 작성한 초안입니다. 기획자/PM의 검토 및 승인 후 이 배너를 제거하면 ’확정 사양’으로 인정됩니다. --- 0. 기획 의도 (Design Intent) 목적 : 꿈식자"
published: false
migration_id: "39036532580e8050a597d5af35954324"
migration_status: "review_required"
migration_flags: ["legacy_image_recovered", "publication_review"]
---

{% raw %}
# P0.5 꿈식자 에너미 연동 명세서 (v1.0.1)

> \[!IMPORTANT\]<br />이 문서는 AI(Antigravity)가 작성한 초안입니다.<br />기획자/PM의 검토 및 승인 후 이 배너를 제거하면 ’확정 사양’으로 인정됩니다.

---

## 0. 기획 의도 (Design Intent)

- <b>목적</b>: <code>꿈식자 에너미 AI 및 컨셉 기획서 (v1.0.1)</code>를 현재 프로젝트의 기본 에너미 구현에 실제로 연결하기 위해 필요한 기술 명세를 정의한다.
- <b>핵심 가치</b>: 기존의 단일 추적형 적 구조(<code>EnemyStatus</code>, <code>EnemyMovement</code>)를 모듈형 상태 머신 구조로 확장하여, <code>먹잇감 차단 이동</code>과 <code>루시드 낙인</code>까지 포함한 P0.5 사양을 구현 가능하게 만든다.

---

## 1. 개요 (Overview)

| 항목 | 내용 |
| --- | --- |
| 기능명 | 꿈식자 에너미 연동 명세 |
| 대상 빌드 | P0.5 프로토타입 |
| 우선순위 | P0.5 |
| 상태 | 검토 대기 |
| 연동 대상 | <code>Enemy.prefab</code>, <code>EnemyStatus</code>, <code>EnemyMovement</code>, <code>GlobalEventBus</code>, <code>PlayerWeapon</code>, <code>PlayerStatus</code>, <code>SpawnManager</code> 등 |

---

## 2. 상세 로직 및 프로세스 (Core Logic)

### 2.1 AI 상태 머신 플로우 (State Machine Flow)

```mermaid
flowchart TD
    Idle[Idle / Patrol] -->|직접 시야 감지 / 피격| AlertCry[AlertCry]
    Idle -->|소리 감지| Suspicious[Suspicious]
    Suspicious --> Investigate[Investigate]
    Investigate -->|직접 시야 감지| AlertCry
    Investigate -->|실패| Return[Return]

    AlertCry --> Chase[Chase]
    Chase -->|직접 시야 유지 + 대상 이동 속도 충족| InterceptMove[Intercept Move]
    InterceptMove --> Chase

    Chase -->|공격 거리 + 쿨타임 완료| AttackReady[AttackReady]
    AttackReady --> AttackSlash1[AttackSlash1]
    AttackSlash1 --> OnHitMark1[피격 시 Lucid Mark Stage 1]
    OnHitMark1 --> AttackSlash2[AttackSlash2]
    AttackSlash2 --> OnHitMark2[낙인 중 추가 피격 시 Stage 2 (의식 누출 위치 전달)]
    OnHitMark2 --> Recovery[Recovery]
    Recovery --> Chase

    Chase -->|시야 상실| ChaseMemory[ChaseMemory]
    ChaseMemory --> Search[Search]
    Search -->|재발견| Chase
    Search -->|실패| Return

    Chase -->|HP 50% 이하 최초 1회| Berserk[Berserk]
    Berserk --> Chase

    Chase -->|HP 0| Dead[Dead]
```

### 2.2 규칙 및 조건 (Rules & Conditions)

#### 2.2.1 감지 및 인지 규칙 (Perception Rules)

| 규칙 ID | 설명 |
| --- | --- |
| <code>PER-001</code> | 시야 거리, 시야각, 장애물 가림 조건을 모두 충족할 때만 직접 인지한다. |
| <code>PER-002</code> | 소리 감지는 즉시 추격이 아니라 <code>Suspicious -&gt; Investigate</code>로만 연결한다. |
| <code>PER-003</code> | 후방/측면이라도 <code>proximityAwarenessRange</code> 이내면 근접 기척을 인지할 수 있다. |

#### 2.2.2 먹잇감 차단 이동 규칙 (Intercept Rules)

| 규칙 ID | 설명 |
| --- | --- |
| <code>INT-001</code> | <code>Chase</code> 상태에서 직접 시야를 유지 중이고, 플레이어 이동 속도가 기준 이상일 때만 차단 이동 보정을 사용한다. |
| <code>INT-002</code> | 차단 이동 목표점은 <code>현재 위치 + 이동 벡터 * interceptPredictionTime</code> 기반으로 계산하되, 최대 오프셋 거리를 제한한다. |
| <code>INT-003</code> | 차단 이동은 짧은 미래 위치 예측만 허용하며, 조사 상태나 탐색 상태에서는 사용하지 않는다. |
| <code>INT-004</code> | 차단 이동은 예지처럼 보이지 않도록 갱신 주기와 보정량을 제한한다. |

#### 2.2.3 루시드 낙인 규칙 (Lucid Mark Rules)

| 규칙 ID | 설명 |
| --- | --- |
| <code>LMK-001</code> | 꿈식자의 공격에 피격된 플레이어는 <code>루시드 낙인 1단계</code> 상태가 된다. |
| <code>LMK-002</code> | 낙인 지속 중 추가 피격을 받으면 <code>루시드 낙인 2단계</code>로 강화되며, 2단계 지속 중 추가 피격을 받으면 <code>루시드 낙인 3단계</code>로 강화된다. |
| <code>LMK-003</code> | 낙인 지속 중에는 꿈식자가 플레이어를 더 오래 기억하며, 추격 해제가 어려워진다. |
| <code>LMK-004</code> | 2단계 강화 시 플레이어의 실시간 위치가 주변 미인지 꿈식자들에게 공유됩니다. 이 상태는 플레이어 시점에서는 완전 비가시적(VFX/UI 연출 없음)이며, 오직 꿈식자들의 내부 감각 필터에만 인식되는 영적 신호로 작동하여 적들을 플레이어 근처로 점진적 수색 유도한 뒤 직접 시야 확보 시 추격하게 만듭니다. |
| <code>LMK-005</code> | 루시드 낙인은 이동 속도 감소, 긴 경직, 상호작용 강제 취소를 발생시키지 않는다. |
| <code>LMK-006</code> | 낙인 적용 시 화면 외곽을 어둡게 하는 비네팅(Vignette) 효과가 단계별로 차등 인가(1단계: 0.25, 2단계: 0.50, 3단계: 0.75)되어, 손전등 범위 외의 주변 시인성을 크게 제한한다. |
| <code>LMK-007</code> | 3단계 진입 시 플레이어의 자아가 심하게 오염되어, 지속적인 불길한 이명 사운드 연출이 런타임에 오버레이 재생된다. |

#### 2.2.4 전투 규칙 (Combat Rules)

| 규칙 ID | 설명 |
| --- | --- |
| <code>ATK-001</code> | 각 꿈식자는 독립적인 공격 쿨타임을 가진다. |
| <code>ATK-002</code> | 1타/2타는 전조 후 직선 전진 공격으로 수행되며, 2타만 제한된 각도 보정이 가능하다. |
| <code>ATK-003</code> | 루시드 낙인 적용 판정은 꿈식자 공격의 실제 피격 성공 시에만 발생한다. |
| <code>BRK-001</code> | HP 50% 이하에서 광폭화는 개체별 1회만 발동한다. |

---

## 3. 데이터 명세 (Data Specification)

### 3.1 기본 및 추격 데이터

| 분류 | 변수명 | 타입 | 설명 |
| --- | --- | --- | --- |
| 스탯 | <code>maxHp</code> | <code>float</code> | 최대 체력 |
| 이동 | <code>normalMoveSpeed</code> | <code>float</code> | 기본 이동 속도 |
| 인지 | <code>sightRange</code> | <code>float</code> | 직접 시야 거리 |
| 인지 | <code>sightAngle</code> | <code>float</code> | 직접 시야 각도 |
| 인지 | <code>proximityAwarenessRange</code> | <code>float</code> | 근접 인지 반경 |
| 추격 | <code>chaseMemoryRange</code> | <code>float</code> | 추격 유지 거리 |
| 추격 | <code>leashRange</code> | <code>float</code> | 최대 추격 거리 |
| 추격 | <code>lostSightGraceTime</code> | <code>float</code> | 시야 상실 유예 시간 |
| 추격 | <code>searchDuration</code> | <code>float</code> | 마지막 위치 탐색 시간 |
| 추격 | <code>noiseMemoryAddTime</code> | <code>float</code> | 추가 소리 단서 시 연장 시간 |

### 3.2 먹잇감 차단 이동 데이터

| 분류 | 변수명 | 타입 | 설명 |
| --- | --- | --- | --- |
| 차단 이동 | <code>interceptPredictionTime</code> | <code>float</code> | 미래 위치 예측 시간 |
| 차단 이동 | <code>maxInterceptOffsetDistance</code> | <code>float</code> | 최대 차단 오프셋 거리 |
| 차단 이동 | <code>interceptMinTargetSpeed</code> | <code>float</code> | 적용 최소 대상 속도 |
| 차단 이동 | <code>interceptUpdateInterval</code> | <code>float</code> | 차단 이동 갱신 주기 |
| 차단 이동 | <code>useInterceptOnlyWhenVisible</code> | <code>bool</code> | 직접 시야 유지 중에만 사용 여부 |

### 3.3 루시드 낙인 데이터

낙인 \| <code>lucidMarkDuration</code> \| <code>float</code> \| 1단계 낙인 지속 시간 \|<br />낙인 \| <code>lucidMarkStage2Duration</code> \| <code>float</code> \| 2단계 낙인 지속 시간 \|<br />낙인 \| <code>lucidMarkStage3Duration</code> \| <code>float</code> \| 3단계 낙인 지속 시간 \|<br />낙인 \| <code>lucidMarkMemoryBonusTime</code> \| <code>float</code> \| 추격 기억 추가 시간 \|<br />낙인 \| <code>lucidMarkLeashBonusDistance</code> \| <code>float</code> \| 최대 추격 거리 추가값 \|<br />낙인 \| <code>lucidMarkVignetteIntensityStage1</code> \| <code>float</code> \| 1단계 외곽 비네팅 시야 차단 강도 (기본값: 0.25) \|<br />낙인 \| <code>lucidMarkVignetteIntensityStage2</code> \| <code>float</code> \| 2단계 외곽 비네팅 시야 차단 강도 (기본값: 0.50) \|<br />낙인 \| <code>lucidMarkVignetteIntensityStage3</code> \| <code>float</code> \| 3단계 외곽 비네팅 시야 차단 강도 (기본값: 0.75) \|<br />누출 \| <code>lucidLeakRange</code> \| <code>float</code> \| 플레이어의 실시간 위치가 공유되는 의식 누출 반경 (기본값: 8.0) \|

### 3.4 전투 및 광폭화 데이터

| 분류 | 변수명 | 타입 | 설명 |
| --- | --- | --- | --- |
| 공격 | <code>attackStartRange</code> | <code>float</code> | 공격 시작 거리 |
| 공격 | <code>attackCooldown</code> | <code>float</code> | 개체별 공격 쿨타임 |
| 공격 | <code>firstSlashDamage</code> | <code>float</code> | 1타 피해량 |
| 공격 | <code>secondSlashDamage</code> | <code>float</code> | 2타 피해량 |
| 공격 | <code>secondSlashTurnLimit</code> | <code>float</code> | 2타 방향 보정 한계 |
| 광폭 | <code>berserkHpThreshold</code> | <code>float</code> | 광폭화 발동 HP 비율 |

---

## 4. 연동 시스템 (Dependencies)

### 4.1 이벤트 시스템 및 소리 타입 명세 (<code>GlobalEventBus</code>)

```cs
public enum NoiseType
{
    Walk,
    Run,
    Gunshot,
    EnemyAlertCry,
    HitReaction,
    CombatImpact
}
```

#### 필수 연동 이벤트

| 이벤트명 | 발신 컴포넌트 | 수신 컴포넌트 | 페이로드 |
| --- | --- | --- | --- |
| <code>OnNoiseEmitted</code> | <code>PlayerMovement</code>, <code>PlayerWeapon</code>, <code>EnemyBrain</code> | <code>EnemyNoiseListener</code> | <code>Vector3 position, NoiseType type, float range, GameObject source</code> |
| <code>OnEnemyAlertCry</code> | <code>EnemyBrain</code> | 주변 <code>EnemyBrain</code> | <code>int enemyId, Vector3 position, Vector3 forward, float range</code> |
| <code>OnEnemyStateChanged</code> | <code>EnemyBrain</code> | <code>EnemyPresentation</code> | <code>int enemyId, EnemyAiState prev, EnemyAiState next</code> |
| <code>OnLucidMarkApplied</code> | <code>EnemyCombat</code> | <code>PlayerLucidMarkReceiver</code>, UI/VFX | <code>int playerId, int stage, float duration</code> |
| <code>OnLucidMarkUpgraded</code> | <code>EnemyCombat</code> | <code>PlayerLucidMarkReceiver</code>, UI/VFX | <code>int playerId, int stage, float duration</code> |
| <code>OnLucidLeakPositionShared</code> | <code>PlayerLucidMarkReceiver</code> | <code>EnemyBrain</code> (주변 적들) | <code>Vector3 playerPosition, float range</code> |

### 4.2 컴포넌트 책임 분리 명세

| 컴포넌트명 | 책임 범위 | 비고 |
| --- | --- | --- |
| <code>EnemyStatus</code> | HP, 사망, 광폭화 발동 조건 확인 | 기존 코드 확장 |
| <code>EnemyBrain</code> | FSM 상태 관리, 타이머, 차단 이동 사용 여부 판단 | 신규 생성 |
| <code>EnemyPerception</code> | 시야 범위, 시야각, 근접 인지 체크 | 신규 생성 |
| <code>EnemyNoiseListener</code> | <code>OnNoiseEmitted</code> 수신 및 조사 목표 갱신 | 신규 생성 |
| <code>EnemyChaseMemory</code> | 마지막 위치, 추격 유지/해제, 낙인 대상 보정 | 신규 생성 |
| <code>EnemyCombat</code> | 1타/2타 전조, 전진 공격, 루시드 낙인 적용 | 신규 생성 |
| <code>EnemyLocomotion</code> | NavMesh 이동, 회전, 차단 이동 목표점 접근 | 기존 <code>EnemyMovement</code> 축소 버전 |
| <code>EnemyPresentation</code> | 애니메이션, VFX, SFX 호출 | 신규 생성 |
| <code>PlayerLucidMarkReceiver</code> | 플레이어 낙인 단계 및 지속 시간 관리, 2단계 진입 시 의식 누출 위치 정보 전송 처리 | 신규 생성 |

### 4.3 런타임 식별자 바인딩 사양

- <b><code>ID-001</code></b>: 적 스폰 시 <code>GlobalRuntimeData.CountingEnemyData()</code> 반환 ID를 <code>EnemyStatus.objID</code> 및 <code>EntityIdentity.entityID</code>에 일관되게 바인딩한다.
- <b><code>ID-002</code></b>: 플레이어 루시드 낙인 대상 지정 시 플레이어 ID를 일관되게 사용한다.
- <b><code>ID-003</code></b>: UI와 디버그 시스템은 전달된 대상 ID가 일치할 때만 갱신한다.

---

## 5. UI/UX 및 프리팹 셋업

![첨부 자료](/assets/img/uploads/notion/b11abf1e6da147d6414a912cede5fae29cc565f30f429140f89ac6c4a664f3c1.jpg)

P0.5 꿈식자 에너미 전투 및 시야 가이드

### 5.1 프리팹 구성 필수 컴포넌트 (<code>Enemy.prefab</code>)

- <code>Animator</code>, <code>NavMeshAgent</code>, <code>Collider</code>
- <code>EnemyStatus</code>, <code>EnemyBrain</code>, <code>EnemyPerception</code>, <code>EnemyNoiseListener</code>, <code>EnemyChaseMemory</code>, <code>EnemyCombat</code>, <code>EnemyPresentation</code>, <code>EntityIdentity</code>
- <b>공격 기준점 Transform</b>
- <b>AudioSource</b>
- <b>전조용 Quad / Plane 프리팹</b>

### 5.2 플레이어 측 추가 권장 요소

- <code>PlayerLucidMarkReceiver</code>
- 낙인 1단계 / 2단계 표시용 VFX 또는 UI 힌트

---

## 6. 주의 사항 및 제약

- <b>차단 이동의 공정성</b>: 차단 이동은 플레이어의 현재 좌표를 완전히 무시하는 예지형 이동이 되어서는 안 된다.
- <b>루시드 낙인의 역할 제한</b>: 낙인은 조작권 박탈 디버프가 아니라 반복 피격 압박 요소여야 한다.
- <b>의식 누출의 역할 제한</b>: 루시드 의식 누출은 플레이어 시점에서는 완전 비가시적(VFX/UI 없음)이며 오직 에너미에게만 감지되는 순수 내부 시스템적 연동 사양입니다. 2단계 낙인 발동 시 주변 미인지 적들이 플레이어 위치로 점진적 수색 접근하도록 유도하는 규칙으로 작동합니다.
- <b>전조와 판정의 일치</b>: 전조 표시와 실제 공격 판정은 일치해야 한다.

---

## 7. QA 인수 기준 (Acceptance Criteria)

| ID | 인수 조건 |
| --- | --- |
| <code>QA-001</code> | 적은 시야 거리, 시야각, 장애물 가림 조건을 모두 충족할 때만 플레이어를 직접 감지한다. |
| <code>QA-002</code> | 먹잇감 차단 이동은 플레이어가 이동 중일 때만 짧게 작동하며, 과도한 예지처럼 보이지 않는다. |
| <code>QA-003</code> | 차단 이동 없이 단순 현재 위치만 추적하던 기존 체감보다 추격 품질이 개선된다. |
| <code>QA-004</code> | 꿈식자의 공격에 피격된 플레이어는 루시드 낙인 1단계를 부여받는다. |
| <code>QA-005</code> | 낙인 지속 중 추가 피격 시 2단계로 강화되고, 주변 적에게 실시간 위치를 지속 전송하는 의식 누출 상태가 활성화된다. |
| <code>QA-006</code> | 의식 누출 상태는 플레이어 시점에서 완전 비가시적(VFX/UI 없음)이며, 오직 에너미의 내부 로직에만 감지되어 적들을 플레이어 근처로 수색 유도하는지 확인한다. |
| <code>QA-007</code> | 루시드 낙인은 이동 속도 감소, 긴 경직, 상호작용 강제 취소를 발생시키지 않는다. |
| <code>QA-008</code> | 낙인 대상은 평소보다 더 오래 추격되며, 추격 해제가 어려워진다. |
| <code>QA-009</code> | 동적으로 스폰된 적과 플레이어 ID가 이벤트 및 UI에 일관되게 반영된다. |
| <code>QA-010</code> | 루시드 낙인 1단계, 2단계 및 3단계 중첩 시 화면 외곽 비네팅(어둠 왜곡) 강도가 설정 수치(0.25, 0.50, 0.75)에 맞게 실시간 연동되어 스크린 시인성이 감소하고, 3단계 진입 시 이명 사운드가 지속 출력되는지 확인한다. |

---

## 📜 Revision History

| 날짜 | 버전 | 내용 | 작성자 |
| --- | --- | --- | --- |
| 2026-07-01 | v1.0.0 | 꿈식자 에너미 연동 명세서 초판 작성 | 송예찬 |
| 2026-07-01 | v1.0.1 | 먹잇감 차단 이동 규칙 추가, 루시드 낙인 및 의식 누출 시스템 추가 | AI(Antigravity) |
{% endraw %}
