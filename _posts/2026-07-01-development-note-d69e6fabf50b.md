---
title: "P0.5_꿈식자_에너미_AI_및_콘셉트_기획서_v1.0.0"
date: 2026-07-01 12:00:00 +0900
categories: ["개발 메모", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "P0.5 꿈식자 에너미 AI 및 컨셉 기획서 (v1.0.1) \\ !IMPORTANT\\ 이 문서는 검토 및 승인 전 단계의 최종 초안입니다. 기획자/PM의 검토 및 승인 후 이 배너를 제거하면 P0.5 확정 사양으로 인정합니다. --- 0. 기획 의도 (Design Intent) 목적 :"
description: "P0.5 꿈식자 에너미 AI 및 컨셉 기획서 (v1.0.1) \\ !IMPORTANT\\ 이 문서는 검토 및 승인 전 단계의 최종 초안입니다. 기획자/PM의 검토 및 승인 후 이 배너를 제거하면 P0.5 확정 사양으로 인정합니다. --- 0. 기획 의도 (Design Intent) 목적 :"
published: true
migration_id: "39036532580e802e85cdd69e6fabf50b"
migration_status: "published"
migration_flags: ["legacy_image_recovered", "publication_review"]
---

{% raw %}
# P0.5 꿈식자 에너미 AI 및 콘셉트 기획서 (v1.0.1)

> \[!IMPORTANT\]<br />이 문서는 검토 및 승인 전 단계의 최종 초안입니다.<br />기획자/PM의 검토 및 승인 후 이 배너를 제거하면 P0.5 확정 사양으로 인정합니다.

---

## 0. 기획 의도 (Design Intent)

- <b>목적</b>: 《침몽도시: 루시드 다이버》의 P0.5 기본 에너미인 꿈식자의 콘셉트, AI 행동 구조, 감지 규칙, 전투 방식, 무리 반응 규칙을 정의하기 위한 기획서이다.
- <b>핵심 가치</b>: 꿈식자는 한 구역에 2\~3마리 배치되었을 때 소리, 탐색, 추격 기억, 먹잇감 차단 이동, 루시드 낙인을 통해 긴장감을 형성하는 기본 위협체다.
- <b>설계 방향</b>: 플레이어의 정확한 좌표를 즉시 공유하지 않고, 소리와 이상 상황에 반응해 위치를 탐색한다. 단, 일단 먹잇감으로 각인되면 단순 직선 추격이 아니라 짧은 예측 기반 차단 이동으로 압박감을 높인다.

---

## 1. 개요 (Overview)

| 항목 | 내용 |
| --- | --- |
| 기능명 | 꿈식자 에너미 AI 및 콘셉트 |
| 대상 빌드 | P0.5 프로토타입 |
| 담당자 | 기획: 송예찬 / 개발: 송예찬 |
| 우선순위 | P0.5 |
| 상태 | 검토 대기 |
| 에너미 수 | 기본 에너미 1종 |
| 핵심 시스템 | 좁은 직접 인지, 넓은 소리 반응, 먹잇감 각인, 먹잇감 차단 이동, 전진 2연격, 루시드 낙인, 광폭화 |

---

## 1.5 P0 대비 확장 및 변경 명세 (P0 vs P0.5 Comparison)

| 기능 분류 | P0 기준 사양 (기존) | P0.5 확장 사양 (현재) | 변경 사유 및 기획 의도 |
| --- | --- | --- | --- |
| <b>타깃 탐색 및 인지</b> | 정면 부채꼴 시야 직접 탐지만 존재 | 좁은 시야 직접 감지, 넓은 소리 감지, 근접 기척 인지 보정 | 스텔스와 탐색 플레이 압박 강화 |
| <b>추격 품질</b> | 플레이어 현재 위치를 단순 추적 | 먹잇감 차단 이동으로 짧은 미래 위치 예측 추격 | 적이 허공만 따라다니지 않게 하여 추격 압박 개선 |
| <b>피격 압박</b> | 대미지만 받고 종료 | 루시드 낙인 부여, 낙인 강화, 의식 누출 발동 (주변 적 유도) | 대미지를 과하게 올리지 않고도 “맞기 싫다”는 감정 형성 |
| <b>무리 반응 규칙</b> | 단독 또는 개별 반응 | 괴성, 소음, 의식 누출 (주변 적에게 실시간 위치 지속 전송) | 구역 단위의 위험 확산 유도 |
| <b>전투 패턴</b> | 공격 사거리 진입 시 즉시 1회성 제자리 공격 | 바닥 전조 후 직선 1타 및 방향 보정 2타 전진 연속 공격 | 회피와 반격 타이밍 제공 |

---

## 2. 상세 로직 및 프로세스 (Core Logic)

### 2.1 동작 플로우 (Flowchart)

```mermaid
flowchart TD
    Idle[Idle / Patrol<br/>대기 또는 배회] -->|플레이어 직접 시야 감지| Mark[먹잇감 각인]
    Idle -->|피해를 입음| Mark
    Idle -->|울음 / 전투음 / 발소리 감지| Suspicious[Suspicious<br/>이상 감지]

    Suspicious --> Investigate[Investigate<br/>소리 위치 또는 방향으로 이동]
    Investigate -->|플레이어 직접 발견| Mark
    Investigate -->|탐색 실패| Return[Return / Patrol<br/>복귀]

    Mark --> AlertCry[AlertCry<br/>괴성 발생]
    AlertCry --> Chase[Chase<br/>플레이어 추격]
    Chase --> Intercept[먹잇감 차단 이동<br/>짧은 미래 위치 예측]
    Intercept --> Chase

    Chase -->|공격 범위 진입<br/>개체별 쿨타임 완료| AttackReady[Attack Ready<br/>전진 2연격 준비]
    Chase -->|시야각 밖 이동| ChaseMemory[추격 기억 유지]
    ChaseMemory -->|거리 가까움 / 소리 단서 있음| Chase
    ChaseMemory -->|단서 상실 / 거리 이탈| Search[Search<br/>마지막 위치 탐색]

    Search -->|재발견| Chase
    Search -->|탐색 실패| Return

    AttackReady --> FirstTelegraph[1타 전조<br/>바닥 공격 범위 표시]
    FirstTelegraph --> FirstSlash[1타<br/>짧은 전진 + 왼쪽 할퀴기]
    FirstSlash --> LucidMark1[피격 시 루시드 낙인 1단계]
    LucidMark1 --> SecondTelegraph[2타 전조<br/>바닥 공격 범위 표시]
    SecondTelegraph --> SecondSlash[2타<br/>짧은 전진 + 오른쪽 할퀴기]
    SecondSlash --> LucidMark2[낙인 중 추가 피격 시<br/>루시드 낙인 2단계 발동<br/>(의식 누출로 주변 적 유도)]
    LucidMark2 --> Recovery[후딜레이]
    Recovery --> Chase

    Chase -->|체력 50% 이하<br/>최초 1회| Berserk[광폭화]
    Berserk --> Chase

    Chase -->|체력 0| Dead[Dead]
    Recovery -->|체력 0| Dead
```

### 2.2 규칙 및 조건 (Rules & Conditions)

#### 2.2.1 감지 및 인지 규칙 (Perception Rules)

- <b>직접 시야 감지</b>: 플레이어를 정확히 인지하여 <code>먹잇감 각인</code>을 활성화하는 조건으로, 감지 거리는 짧고 정면 기준 제한된 각도를 사용하며 Raycast로 벽 뒤 감지를 차단한다.
- <b>소리 감지</b>: 플레이어를 직접 추격하지 않고 이상 감지(<code>Suspicious</code>/<code>Investigate</code>) 상태로 전이시킨다. 소리의 성격에 따라 반응 범위가 달라지며, 플레이어의 좌표 대신 소리 발생지 좌표만을 제공하여 해당 방향을 탐색하게 한다.
- <b>근접 인지</b>: 플레이어가 꿈식자의 후방이나 측면에 있더라도 일정 근접 반경(<code>proximityAwarenessRange</code>) 이내에 진입하면 기척을 인지하여 적 주변을 돌며 어그로를 해제하는 꼼수를 차단한다.

#### 2.2.2 먹잇감 각인 및 추격 기억 규칙 (Target Locking & Chase Memory)

- <b>먹잇감 각인</b>: 플레이어 발견 또는 피해 시 대상이 각인되며, 일시적으로 시야를 벗어나거나 뒤쪽으로 돌아가더라도 즉시 추격이 해제되지 않는다.
- <b>추격 유지</b>: <code>추격 유지 거리 이내</code>, <code>마지막 위치 추적 중</code>, <code>추가 소리 단서 발생</code>, <code>근접 인지 범위 유지</code>, <code>지속 피해</code> 조건 중 하나라도 만족하면 추격을 지속한다.
- <b>추격 해제</b>: 일정 시간 직접 시야 상실, 추격 유지 거리 밖 이탈, 추가 소리 단서 부재, 마지막 위치 탐색 실패가 모두 누적되었을 때에만 추격을 해제하고 복귀한다.

#### 2.2.3 먹잇감 차단 이동 규칙 (Intercept Movement Rules)

- <b>기능 정의</b>: 꿈식자가 <code>Chase</code> 상태에서 플레이어의 현재 위치만 따라가지 않고, 플레이어의 최근 이동 방향과 속도를 바탕으로 짧은 미래 위치를 예측해 접근하는 AI 보정 기능이다.
- <b>목적</b>: 적이 플레이어의 현재 위치만 뒤늦게 따라가 허공을 맴도는 느낌을 줄이고, 추격의 품질과 압박감을 높인다.
- <b>적용 조건</b>: 직접 시야를 유지 중이고, 플레이어가 일정 속도 이상으로 이동 중일 때만 적용한다.
- <b>제한 조건</b>: 예측 시간은 짧게 제한하고, 예측 목표점의 최대 오프셋 거리를 제한한다. 조사 상태나 탐색 상태에서는 적용하지 않는다.
- <b>의도된 인상</b>: “앞을 막으러 들어온다”는 느낌을 주되, 예지 능력처럼 보이지 않을 정도의 보정만 허용한다.

#### 2.2.4 루시드 낙인 규칙 (Lucid Mark Rules)

- <b>기능 정의</b>: 꿈식자의 공격에 피격된 플레이어에게 일정 시간 동안 <code>루시드 낙인</code>을 부여하는 피격 디메리트 시스템이다.
- <b>목적</b>: 꿈식자의 대미지를 과하게 높이지 않고도, 플레이어가 “맞기 싫다”는 감정을 느끼게 만든다.
- <b>1단계 낙인</b>: 꿈식자의 공격에 피격된 플레이어는 <code>루시드 낙인 1단계</code> 상태가 된다. 낙인 지속 중에는 꿈식자가 플레이어를 더 오래 기억하며 추격 해제가 어려워진다. 또한, 플레이어의 의식이 흔들리기 시작하며 화면 외곽이 소폭 어두워지는 비네팅(Vignette) 효과가 적용된다.
- <b>2단계 강화</b>: 낙인 지속 중 추가 피격을 받으면 <code>루시드 낙인 2단계</code>로 강화된다.
- <b>루시드 의식 누출 (내부 시스템)</b>: 루시드 낙인이 2단계로 강화되면 지속 시간(<code>lucidMarkStage2Duration</code>) 동안 다이버의 무너진 정신체로부터 플레이어의 위치 신호가 계속해서 밖으로 새어 나가는 <code>의식 누출 (Consciousness Leak)</code> 상태가 활성화됩니다.
- <b>의식 누출 작동 방식</b>: 이 상태는 <b>플레이어 시점에서는 완전 비가시적</b>입니다. 맵 상에 어떠한 시각적 흔적(VFX), 파티클, 혹은 UI 표시도 남기지 않아 플레이어는 자신의 위치가 노출되고 있는지 직관적으로 알 수 없습니다. 오직 <b>꿈식자(에너미)의 내부 감각 시스템에만 감지되는 영적 신호(위치 비콘)</b>로 작동합니다. 반경 <code>lucidLeakRange</code> (8.0m) 내에 있는 미인지 꿈식자들은 이 신호에 끌려 플레이어의 실시간 위치를 향해 점진적으로 수색 접근(이동)하며, 가까이 다가와 직접 시야 내에 플레이어를 포착하는 순간 추격을 시작합니다.
- <b>외곽 시야 제한 (터널 시야)</b>: 낙인이 2단계로 누적 강화될수록 현실 유지 안정성이 저하되어 화면 외곽이 급격히 어두워지는 강한 비네팅 효과가 스크린에 오버레이된다. 손전등 빛이 비추는 정방 구역 외의 외곽 영역이 거의 칠흑처럼 차단되어, 측면 및 후방 사각지대에서 은밀히 다가오는 에너미나 위험 요소를 인지하기가 매우 까다로워진다.
- <b>비의도 효과 금지</b>: 루시드 낙인은 이동 속도 감소, 긴 경직, 상호작용 강제 취소를 발생시키지 않는다. 플레이어 조작권을 직접적으로 빼앗지 않는 대신, 시각 정보(시야 획득 범위)를 극도로 제한하여 압박감과 조심성을 극대화한다.

#### 2.2.5 전투 및 공격 규칙 (Combat Rules)

- <b>공격 쿨타임</b>: 군집 단위로 공격권을 공유하지 않으며, 각 개체별로 완전히 독립적인 쿨타임을 관리하고 범위 진입 시 시도한다.
- <b>전진 2연격 (기본 공격)</b>: 플레이어 방향으로 1타(왼쪽 할퀴기) 및 2타(오른쪽 할퀴기)를 각각 짧은 전진과 바닥 전조 범위를 표시하며 연속으로 수행한다.
- <b>호밍 금지 및 2타 보정 제한</b>: 공격이 시작되면 전조 표시 방향으로만 전진하며 플레이어 추적(호밍)은 차단된다. 단, 2타 시작 전 플레이어 위치에 맞춰 제한된 각도(최대 25도) 내에서 방향을 보정할 수 있다.
- <b>광폭화</b>: 체력이 50% 이하가 되면 개체별 최초 1회 발동하며, 이동 속도 증가, 전조 시간 단축, 전진 거리 증가, 후딜레이 감소 효과를 적용한다.

---

## 3. 데이터 명세 (Data Specification)

### 3.1 기본 스탯 및 감지 데이터

| 기획 명칭 | 변수명 | 타입 | 기본값 | 비고 |
| --- | --- | --- | --- | --- |
| 체력 | <code>maxHp</code> | <code>float</code> | 100.0 | 에너미 최대 체력 |
| 이동 속도 일반 | <code>normalMoveSpeed</code> | <code>float</code> | 3.2 | 플레이어보다 느리게 설정 |
| 이동 속도 광폭 | <code>berserkMoveSpeed</code> | <code>float</code> | 3.8 | 약 18% 증가 |
| 시야 감지 거리 | <code>sightRange</code> | <code>float</code> | 5.5 | 직접 인지 범위 |
| 시야 감지 각도 | <code>sightAngle</code> | <code>float</code> | 100.0 | 전방 기준 |
| 근접 인지 반경 | <code>proximityAwarenessRange</code> | <code>float</code> | 1.8 | 후방/측면 근접 보정 |
| 광폭화 체력 임계값 | <code>berserkHpThreshold</code> | <code>float</code> | 0.5 | 체력 50% 이하 |

### 3.2 소리 및 추격 기억 데이터

| 기획 명칭 | 변수명 | 타입 | 기본값 | 비고 |
| --- | --- | --- | --- | --- |
| 걷기 소리 감지 범위 | <code>walkNoiseRange</code> | <code>float</code> | 2.5 | 조용한 이동 |
| 달리기 소리 감지 범위 | <code>runNoiseRange</code> | <code>float</code> | 6.0 | 빠른 이동 |
| 총격 소리 감지 범위 | <code>gunNoiseRange</code> | <code>float</code> | 16.0 | 구역 단위 반응 |
| 괴성 전파 범위 | <code>alertCryRange</code> | <code>float</code> | 13.0 | 침식 울림 반경 |
| 소리 반응 딜레이 | <code>soundReactionDelay</code> | <code>float</code> | 0.4\~1.2 | 개체별 랜덤 적용 |
| 추격 유지 거리 | <code>chaseMemoryRange</code> | <code>float</code> | 11.0 | 시야각 밖이어도 추격 유지 |
| 최대 추격 거리 | <code>leashRange</code> | <code>float</code> | 17.0 | 이탈 시 복귀 판단 |
| 시야 상실 유예 시간 | <code>lostSightGraceTime</code> | <code>float</code> | 2.5 | 즉시 어그로 해제 방지 |
| 마지막 위치 탐색 시간 | <code>searchDuration</code> | <code>float</code> | 4.0 | 마지막 위치 주변 탐색 |
| 소리 기억 추가 시간 | <code>noiseMemoryAddTime</code> | <code>float</code> | 1.5 | 소리 단서 발생 시 연장 |

### 3.3 먹잇감 차단 이동 데이터

| 기획 명칭 | 변수명 | 타입 | 기본값 | 비고 |
| --- | --- | --- | --- | --- |
| 예측 시간 | <code>interceptPredictionTime</code> | <code>float</code> | 0.35 | 짧은 미래 위치 예측 시간 |
| 최대 차단 오프셋 거리 | <code>maxInterceptOffsetDistance</code> | <code>float</code> | 1.8 | 예측 위치의 최대 전방 보정 거리 |
| 적용 최소 속도 | <code>interceptMinTargetSpeed</code> | <code>float</code> | 1.5 | 플레이어가 이 속도 이상일 때만 적용 |
| 차단 갱신 주기 | <code>interceptUpdateInterval</code> | <code>float</code> | 0.2 | 예측 위치 갱신 주기 |
| 시야 중에만 사용 | <code>useInterceptOnlyWhenVisible</code> | <code>bool</code> | true | 직접 시야 유지 중에만 사용 |

### 3.4 루시드 낙인 데이터

| 기획 명칭 | 변수명 | 타입 | 기본값 | 비고 |
| --- | --- | --- | --- | --- |
| 1단계 낙인 지속 시간 | <code>lucidMarkDuration</code> | <code>float</code> | 6.0 | 첫 피격 후 유지 시간 |
| 2단계 낙인 지속 시간 | <code>lucidMarkStage2Duration</code> | <code>float</code> | 8.0 | 강화 시 유지 시간 |
| 3단계 낙인 지속 시간 | <code>lucidMarkStage3Duration</code> | <code>float</code> | 10.0 | 3단계 진입 시 유지 시간 |
| 낙인 추격 기억 추가 시간 | <code>lucidMarkMemoryBonusTime</code> | <code>float</code> | 2.0 | 낙인 대상 추격 유지 강화 |
| 낙인 최대 추격 거리 보너스 | <code>lucidMarkLeashBonusDistance</code> | <code>float</code> | 2.0 | 낙인 대상 이탈 허용 거리 증가 |
| 의식 누출 범위 | <code>lucidLeakRange</code> | <code>float</code> | 8.0 | 플레이어의 위치가 전달되는 의식 누출 반경 |
| 1단계 비네팅 강도 | <code>lucidMarkVignetteIntensityStage1</code> | <code>float</code> | 0.25 | 1단계 외곽 시야 제한 강도 (0.0\~1.0) |
| 2단계 비네팅 강도 | <code>lucidMarkVignetteIntensityStage2</code> | <code>float</code> | 0.50 | 2단계 외곽 시야 제한 강도 (0.0\~1.0) |
| 3단계 비네팅 강도 | <code>lucidMarkVignetteIntensityStage3</code> | <code>float</code> | 0.75 | 3단계 외곽 시야 제한 강도 (0.0\~1.0) |

### 3.5 전진 2연격 및 광폭화 데이터

| 기획 명칭 | 변수명 | 타입 | 기본값 | 비고 |
| --- | --- | --- | --- | --- |
| 공격 시작 거리 | <code>attackStartRange</code> | <code>float</code> | 2.3 | 공격 가능 거리 |
| 1타 전조 시간 | <code>firstSlashTelegraphTime</code> | <code>float</code> | 0.35 | 1타 바닥 전조 표시 시간 |
| 2타 전조 시간 | <code>secondSlashTelegraphTime</code> | <code>float</code> | 0.25 | 2타 바닥 전조 표시 시간 |
| 1타 전진 거리 | <code>firstSlashLungeDistance</code> | <code>float</code> | 1.0 | 1타 이동 거리 |
| 2타 전진 거리 | <code>secondSlashLungeDistance</code> | <code>float</code> | 1.2 | 2타 이동 거리 |
| 1타 공격 폭 | <code>firstSlashWidth</code> | <code>float</code> | 1.2 | 바닥 전조 및 판정 폭 |
| 2타 공격 폭 | <code>secondSlashWidth</code> | <code>float</code> | 1.2 | 바닥 전조 및 판정 폭 |
| 1타 피해량 | <code>firstSlashDamage</code> | <code>float</code> | 8.0 | 1타 피해 |
| 2타 피해량 | <code>secondSlashDamage</code> | <code>float</code> | 12.0 | 2타 피해 |
| 연격 간격 | <code>comboInterval</code> | <code>float</code> | 0.15 | 1타 후 2타까지 간격 |
| 공격 후딜레이 | <code>attackRecoveryTime</code> | <code>float</code> | 0.65 | 공격 종료 후 딜레이 |
| 2타 방향 보정 각도 | <code>secondSlashTurnLimit</code> | <code>float</code> | 25.0 | 2타 전 보정 가능 각도 |
| 공격 쿨타임 | <code>attackCooldown</code> | <code>float</code> | 1.2 | 개체별 관리 |

---

## 4. UI/UX 및 연출 사양 (Presentation Rules)

![첨부 자료](/assets/img/uploads/notion/b11abf1e6da147d6414a912cede5fae29cc565f30f429140f89ac6c4a664f3c1.jpg)

P0.5 꿈식자 에너미 전투 및 시야 가이드

| 상황 | 애니메이션 및 이펙트 연출 | 사운드 연출 |
| --- | --- | --- |
| <b>직접 발견</b> | 머리가 플레이어 방향으로 고정됨 | 날카로운 인지음 |
| <b>괴성 발생</b> | 몸을 펴고 파동 이펙트 방출 | 괴성 |
| <b>이상 감지</b> | 고개를 소리 방향으로 돌림 | 낮은 으르렁거림 |
| <b>탐색</b> | 느리게 걸으며 주변을 두리번거림 | 불규칙한 발소리 |
| <b>추격</b> | 자세를 낮추고 빠르게 이동 | 거친 호흡음 |
| <b>먹잇감 차단 이동</b> | 플레이어 진행 방향 쪽으로 파고드는 움직임 | 짧은 재가속 호흡 |
| <b>1단계 루시드 낙인</b> | 피격 부위에 짧은 붉은 왜곡 잔광 + 스크린 외곽 비네팅 연출 소폭 활성화 (0.25) | 얕은 파열음 |
| <b>2단계 루시드 낙인</b> | 붉은 낙인이 진해짐 + 스크린 외곽 비네팅 강도 증가 (0.50) | 더 날카로운 공명음 |
| <b>3단계 루시드 낙인</b> | 낙인이 극도로 활성화되어 스크린 외곽 대부분이 어두워짐 (0.75, 터널 시야) | 지속적인 불길한 이명 사운드 |
| <b>의식 누출 발동</b> | 밖으로 표출되는 연출 없음 (플레이어 비네팅만 강화) | (없음 - 주변 에너미의 접근 이동으로 연동 표현) |
| <b>광폭화</b> | 노이즈, 균열 발광, 몸 뒤틀림 | 날카로운 비명 |

### 4.1 설계 의도

- 먹잇감 차단 이동은 “너무 똑똑한 예지”가 아니라 “앞을 막으려 드는 포식자”처럼 보여야 한다.
- 루시드 낙인은 플레이어 조작권을 뺏지 않고, 반복 피격 시 전장 위험이 커진다는 감정을 주는 방향으로 연출한다.

---

## 5. 연동 시스템 (Dependencies)

| 연동 대상 | 관계 | 비고 |
| --- | --- | --- |
| <b>Enemy State Machine</b> | Idle, Patrol, Chase, Attack, Intercept 등 상태 관리 | 상태 관리 코어 시스템 |
| <b>Noise System</b> | 울음, 발소리, 전투음, 의식 누출 위치 정보 수신 처리 | Suspicious / Investigate 전환 연동 |
| <b>Damage System</b> | 피격, 사망 처리 및 낙인 적용 | 낙인/광폭화 발동 연동 |
| <b>Perception System</b> | 시야 감지, 근접 기척 감지 처리 | 최초 인지 및 재인지 판정 |
| <b>Chase Memory System</b> | 먹잇감 각인 및 추격 유지/해제 관리 | 낙인 대상 추격 강화 포함 |
| <b>Player Debuff System</b> | 루시드 낙인 단계 및 지속 시간 관리 | 신규 압박 시스템 |
| <b>VFX System</b> | 바닥 전조, 광폭화 출력 (의식 누출 VFX 없음) | 시인성 확보용 |
| <b>Sound Manager</b> | 상태별 사운드 재생 | 몰입감 확보용 |

---

## 6. 주의 사항 및 제약

- <b>차단 이동의 공정성</b>: 먹잇감 차단 이동은 플레이어 현재 위치를 완전히 무시하는 예지형 이동이 되어서는 안 되며, 짧은 시간의 제한된 예측 보정만 허용한다.
- <b>낙인 디메리트의 성격</b>: 루시드 낙인은 느려짐, 긴 경직, 상호작용 취소 같은 조작권 박탈 디버프로 확장하지 않는다.
- <b>의식 누출의 역할</b>: 의식 누출은 밖으로 시/청각적 이펙트를 드러내지 않는 순수 시스템적 연동 사양입니다. 2단계 낙인 지속 시간 동안 주변 적들이 플레이어의 위치를 향해 점진적으로 수색 접근하게 만들어 압박감을 주는 역할입니다.
- <b>공격 쿨타임 독립성</b>: 꿈식자는 군집 공유 쿨타임을 사용하지 않으며, 각 개체별로 완전히 독립적으로 쿨타임을 계산한다.
- <b>광폭화 보정의 밸런스</b>: 광폭화는 기본 속성 강화일 뿐 새로운 보스 기믹이 아니므로, 대응 불가능할 수준으로 오버스펙화되지 않게 통제한다.

---

## 7. 전투 및 탐색 시나리오 예시 (Examples)

### 7.1 먹잇감 차단 이동이 체감되는 경우

1. 플레이어가 꿈식자 A에게 발각된다.
2. 플레이어가 직선으로 도망가기 시작한다.
3. A는 플레이어의 현재 위치 뒤만 쫓지 않고, 최근 이동 방향을 기준으로 약간 앞선 위치를 향해 접근한다.
4. 플레이어는 단순 원형 러닝만으로 쉽게 따돌리기 어려워진다.

### 7.2 루시드 낙인 1단계

1. 플레이어가 꿈식자의 1타 공격에 맞는다.
2. 플레이어는 루시드 낙인 1단계 상태가 된다.
3. A는 평소보다 더 오래 플레이어를 기억하고 추격을 쉽게 풀지 않는다.

### 7.3 루시드 낙인 2단계 및 상흔

1. 낙인 지속 중 플레이어가 다시 꿈식자 공격에 맞는다.
2. 루시드 낙인이 2단계로 강화된다.
3. 플레이어에게 의식 누출 상태가 활성화된다 (외부 연출 없음).
4. 주변에 순찰 중이던 미인지 꿈식자 B, C가 전달받는 플레이어의 실시간 위치를 향해 다가오기 시작한다.
5. 플레이어와 가까워진 적들이 플레이어를 직접 시야에 담는 순간 추격을 개시한다.
6. 플레이어는 낙인이 풀릴 때까지 은신 상태여도 적들이 귀신같이 다가오는 극한의 압박을 받는다.

---

## 📜 Revision History

| 날짜 | 버전 | 내용 | 작성자 |
| --- | --- | --- | --- |
| 2026-07-01 | v1.0.0 | 꿈식자 에너미 AI 및 콘셉트 기획서 초안 작성 | 송예찬 |
| 2026-07-01 | v1.0.0 | 군집 공유 쿨타임 제거, 좁은 직접 인지/넓은 소리 감지 구조 추가, 먹잇감 각인 및 추격 기억 규칙 추가 | 송예찬 |
| 2026-07-01 | v1.0.1 | 먹잇감 차단 이동 추가, 루시드 낙인 시스템 추가, 의식 누출 기반 위치 공유 및 조사 압박 규칙 추가 | AI(Antigravity) |
{% endraw %}
