---
title: "코드 변경 사항 기록//0710"
date: 2026-07-10 12:00:00 +0900
categories: ["개발 메모", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "2026-07-10\\_wall\\_collision\\_debug\\_script\\_compare 2026-07-10 코드 변경 사항 기록 1. 문서 개요 이 문서는 2026년 7월 10일 기준으로 진행한 디버깅 및 코드 수정 내용을 정리한 기록이다. 오늘 작업의 핵심은 벽 관통 관련 버그 "
description: "2026-07-10\\_wall\\_collision\\_debug\\_script\\_compare 2026-07-10 코드 변경 사항 기록 1. 문서 개요 이 문서는 2026년 7월 10일 기준으로 진행한 디버깅 및 코드 수정 내용을 정리한 기록이다. 오늘 작업의 핵심은 벽 관통 관련 버그 "
published: true
migration_id: "39936532580e8062a067e113686230cc"
migration_status: "published"
migration_flags: []
---

{% raw %}
[2026-07-10\_wall\_collision\_debug\_script\_compare]({% endraw %}{% post_url 2026-07-10-development-note-d27e765ba804 %}{% raw %})

# 2026-07-10 코드 변경 사항 기록

## 1. 문서 개요

이 문서는 2026년 7월 10일 기준으로 진행한 디버깅 및 코드 수정 내용을 정리한 기록이다.

오늘 작업의 핵심은 벽 관통 관련 버그 수정과 충돌 판정 안정화였다.

주요 작업 범위는 다음과 같다.

| 구분 | 내용 |
| --- | --- |
| 에너미 공격/돌진 | 벽 너머 공격 판정 및 돌진 관통 방지 |
| 플레이어 이동 | 구르기 중 벽 모서리 관통 방지 |
| 플레이어 총격 | 벽 오브젝트 타격 시 null 참조 오류 수정 |
| Addressables | 에픽 아티팩트 아이콘 로드 누락 수정 |

## 2. 주요 수정 내용

### 2-1. 에너미 돌진 벽 관통 방지

에너미가 공격 돌진 중 벽을 넘어가는 문제가 있었다.

기존에는 돌진 목적지를 단순히 방향과 거리로 계산했기 때문에, 플레이어가 벽을 등지고 있거나 벽 근처에 있을 때 에너미가 벽 너머 좌표를 목적지로 잡을 수 있었다.

수정 후에는 돌진 전에 다음 검사를 추가했다.

| 검사 | 역할 |
| --- | --- |
| NavMesh.Raycast | 현재 위치에서 목적지까지 NavMesh 경로가 막히는지 확인 |
| Physics.SphereCast | Wall Collider와 실제 충돌하는지 확인 |
| Wall Buffer | 벽에 닿기 직전 위치로 목적지 보정 |

결과적으로 에너미 돌진은 벽 너머 좌표로 이동하지 않고, 벽 앞에서 멈추거나 안전한 위치로 보정되도록 수정했다.

수정 파일:

```txt
Assets/02_Scripts/System/Enemy/EnemyLocomotion.cs
```

### 2-2. 에너미 공격 판정 벽 차단 검사 추가

에너미가 벽 너머에 있는 플레이어에게 공격 판정을 넣을 가능성이 있었다.

이를 막기 위해 공격 대미지를 적용하기 직전에 에너미와 플레이어 사이에 벽이 있는지 검사하도록 수정했다.

| 기존 구조 | 수정 구조 |
| --- | --- |
| 공격 범위 안이면 대미지 적용 | 공격 범위 안이어도 벽이 있으면 대미지 차단 |

이제 공격 상태에 들어간 뒤 플레이어가 벽 뒤에 있더라도, 벽이 중간에 있으면 대미지가 들어가지 않는다.

수정 파일:

```txt
Assets/02_Scripts/System/Enemy/EnemyCombat.cs
```

### 2-3. 플레이어 구르기 벽 관통 방지

플레이어가 벽에 몸을 비비면서 구르기를 사용할 경우, 벽 모서리나 콜라이더 겹침 지점에서 벽을 통과하는 문제가 있었다.

처음에는 일반 이동 전체에 충돌 보정을 넣었지만, 이 경우 문 근처 이동과 상호작용까지 과하게 막히는 문제가 생겼다.

그래서 최종적으로는 구르기 중에만 충돌 보정을 적용하는 방식으로 수정했다.

| 보정 방식 | 역할 |
| --- | --- |
| Rigidbody SweepTest | 이동 방향 앞쪽의 벽 충돌을 미리 검사 |
| SphereCast | 모서리나 얇은 틈에서 발생하는 관통 보강 |
| 수평 속도 초기화 | 벽에 비빈 뒤 입력을 떼도 밀리는 현상 방지 |

수정 파일:

```txt
Assets/02_Scripts/System/Player/PlayerMovement.cs
```

### 2-4. 플레이어 총격 null 참조 오류 수정

플레이어가 총을 쐈을 때 벽이나 FenceCollider 같은 오브젝트를 맞추면, 해당 오브젝트에는 대미지를 받을 대상 컴포넌트가 없기 때문에 <code>target</code>이 null이 될 수 있었다.

대미지 적용 로직은 이미 null 체크가 되어 있었지만, 디버그 로그에서 <code>target.EntityFaction</code>을 바로 참조하면서 null 참조 오류가 발생했다.

수정 후에는 <code>target != null</code>일 때만 대상 정보를 로그로 출력하도록 변경했다.

수정 파일:

```txt
Assets/02_Scripts/System/Player/PlayerWeapon.cs
```

### 2-5. 에픽 아티팩트 아이콘 Addressables 누락 수정

에픽 아티팩트 아이콘 <code>UI_Icon_Epic_FrozenClockwork</code>가 JSON에는 등록되어 있었지만, Addressables 그룹에는 등록되지 않아 로드 오류가 발생했다.

Addressables Default Local Group에 해당 아이콘 엔트리를 추가해서 아이콘이 정상 로드되도록 수정했다.

수정 파일:

```txt
Assets/AddressableAssetsData/AssetGroups/Default Local Group.asset
```

## 3. 트러블 슈팅 정리

| 문제 | 원인 | 해결 |
| --- | --- | --- |
| 에너미가 공격 중 벽을 넘어감 | 돌진 목적지 계산 시 벽 차단 검사 부족 | NavMesh.Raycast, SphereCast 기반 목적지 보정 추가 |
| 벽 너머 공격 판정 가능성 | 공격 범위만 확인하고 벽 여부를 확인하지 않음 | 대미지 적용 직전 벽 Linecast 검사 추가 |
| 플레이어가 구르기로 벽을 통과함 | 빠른 이동 중 Collider 충돌 보정 부족 | 구르기 중 SweepTest/SphereCast 적용 |
| 벽에 비빈 뒤 입력 없이 밀림 | Rigidbody 잔여 수평 속도 유지 | 이동 후 수평 velocity 초기화 |
| 벽을 총으로 맞췄을 때 오류 | 벽에는 대미지 대상 컴포넌트가 없음 | null일 때 디버그 로그 접근 방지 |
| 에픽 아이콘 로드 실패 | Addressables 등록 누락 | 아이콘 Addressables 엔트리 추가 |

## 4. 최종 결과

오늘 수정으로 QA-PM-004, QA-PM-006 관련 벽 관통 문제가 완화되었다.

다만 벽 차단 로직이 정상 작동하려면 씬의 벽 오브젝트와 벽 Collider가 <code>Wall</code> 레이어로 설정되어 있어야 한다.

즉 코드 수정과 함께 레벨 디자인 씬의 벽 레이어 정리도 같이 필요하다.
{% endraw %}
