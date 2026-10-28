---
title: "에너미 AI 수정안"
date: 2026-07-10 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 수정 목표 | 버그 ID | 문제 | 원인 후보 | | --- | --- | --- | | QA-PM-003 | 에너미가 평소 루트에서 벗어난 뒤 오래 추격함 | 추격 제한 범위, 어그로 감소, 복귀 조건 부족 | | QA-PM-004 | 플레이어가 벽을 등지고 있을 때 에너미가 "
description: "1. 수정 목표 | 버그 ID | 문제 | 원인 후보 | | --- | --- | --- | | QA-PM-003 | 에너미가 평소 루트에서 벗어난 뒤 오래 추격함 | 추격 제한 범위, 어그로 감소, 복귀 조건 부족 | | QA-PM-004 | 플레이어가 벽을 등지고 있을 때 에너미가 "
published: true
migration_id: "39936532580e80a1880ec052a274cc20"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 수정 목표

| 버그 ID | 문제 | 원인 후보 |
| --- | --- | --- |
| QA-PM-003 | 에너미가 평소 루트에서 벗어난 뒤 오래 추격함 | 추격 제한 범위, 어그로 감소, 복귀 조건 부족 |
| QA-PM-004 | 플레이어가 벽을 등지고 있을 때 에너미가 공격/돌진 중 벽을 넘어옴 | 공격 돌진 이동이 NavMesh/벽 충돌 검사를 충분히 거치지 않음 |
| QA-PM-005 | 몬스터 처치 이후 다른 몬스터가 더 이상 공격하지 않는 현상 | 사망 이벤트, 공격 상태 플래그, 타겟 유지 로직 꼬임 가능성 |

## 2. 목표 AI 흐름

```txt
순찰 Patrol
  ↓ 플레이어 발견 또는 소음 조사
조사 Investigate
  ↓ 플레이어 직접 인식
추격 Chase
  ↓ 공격 범위 진입
공격 Attack
  ↓ 시야 끊김 / 거리 초과 / 활동 범위 이탈 / 어그로 감소
복귀 Return
  ↓ 자기 순찰 루트 도착
순찰 Patrol
```

한 번 감지하면 너무 오래 따라가는 구조   → 감지했더라도 자기 활동 구역을 벗어나면 추격을 중단하고 복귀하는 구조 가 목표

## 3. 추가할 핵심 개념

| 이름 | 역할 |
| --- | --- |
| <code>homePosition</code> | 에너미가 기준으로 삼는 스폰 위치 또는 순찰 루트 중심 |
| <code>leashRadius</code> | 에너미가 추격할 수 있는 최대 활동 반경 |
| <code>aggroValue</code> | 현재 어그로 유지 수치 |
| <code>maxAggroValue</code> | 어그로 최대치 |
| <code>aggroDecayPerSecond</code> | 시야가 끊겼을 때 초당 감소하는 어그로 |
| <code>returnTarget</code> | 복귀할 위치. 자기 순찰 루트의 가장 가까운 지점 |
| <code>attackDashCheckDistance</code> | 공격 돌진 전 벽/경계 검사를 수행할 거리 |
| <code>attackDashWallBuffer</code> | 벽에 너무 붙지 않게 남기는 최소 거리 |

## 4. 상태별 수정 방향

| 상태 | 수정 방향 |
| --- | --- |
| <code>Patrol</code> | 기존 순찰 유지. 감지 성공 시 조사 또는 추격으로 전환 |
| <code>Investigate</code> | 조사 지점까지 이동하되, 일정 시간 안에 도착하지 못하면 복귀 |
| <code>Chase</code> | 시야, 거리, 활동 반경, 어그로 수치를 계속 검사 |
| <code>Attack</code> | 공격 시작 전과 돌진 중 벽/경계 검사를 수행 |
| <code>Return</code> | 공통 지점이 아니라 자기 순찰 루트의 가장 가까운 웨이포인트로 복귀 |

## 5. QA-PM-003 추격 제한 로직

에너미가 플레이어를 끝없이 따라오지 않도록 <code>leashRadius</code>를 둔다.

```txt
bool IsOutsideLeash(Vector3 currentPosition)
{
    return Vector3.Distance(currentPosition, homePosition) > leashRadius;
}
```

추격 중에는 아래 조건을 검사한다.

```txt
if (IsOutsideLeash(transform.position))
{
    ClearTarget();
    ChangeState(EnemyState.Return);
}
```

권장 흐름은 다음과 같다.

```txt
플레이어가 보임
→ 어그로 최대치 유지

플레이어가 안 보임
→ 어그로가 서서히 감소

활동 반경을 벗어남
→ 즉시 복귀

어그로가 0 이하
→ 복귀
```

의사 코드는 이렇게 잡는다.

```txt
void UpdateChaseAggro()
{
    if (IsOutsideLeash(transform.position))
    {
        ClearTarget();
        ChangeState(EnemyState.Return);
        return;
    }

    if (CanSeePlayer())
    {
        aggroValue = maxAggroValue;
        return;
    }

    aggroValue -= aggroDecayPerSecond * Time.deltaTime;

    if (aggroValue <= 0.0f)
    {
        ClearTarget();
        ChangeState(EnemyState.Return);
    }
}
```

<p>
 일정 거리 이상 끌고 나가면 어그로가 풀리고 원래 루트로 돌아가는 느낌으로 구현
</p>

## 6. QA-PM-003 복귀 위치 개선

복귀 위치  재 정립

```txt
Transform GetNearestPatrolPoint()
{
    Transform nearest = null;
    float nearestDistance = float.MaxValue;

    foreach (Transform point in patrolPoints)
    {
        float distance = Vector3.Distance(transform.position, point.position);

        if (distance < nearestDistance)
        {
            nearestDistance = distance;
            nearest = point;
        }
    }

    return nearest;
}
```

| 장점 | 설명 |
| --- | --- |
| 에너미 뭉침 방지 | 모든 에너미가 같은 위치로 돌아가지 않음 |
| 순찰 흐름 유지 | 복귀 후 자연스럽게 기존 루트 순찰 재개 가능 |
| 레벨 확장에 유리 | 에너미마다 다른 루트를 가져도 동일한 구조 사용 가능 |

## 7. QA-PM-004 공격/돌진 벽 관통 방지

플레이어가 벽을 등지고 있을 때  돌진 공격 전에 경로 검사 필요

```txt
돌진 방향 계산
→ 목표 위치 계산
→ 현재 위치에서 목표 위치까지 NavMesh.Raycast 검사
→ 막혀 있으면 벽 앞까지만 이동
→ NavMesh.SamplePosition으로 최종 위치 보정
→ 돌진 이동 실행
```

```txt
Vector3 GetSafeAttackDashDestination(Vector3 start, Vector3 desiredEnd)
{
    if (NavMesh.Raycast(start, desiredEnd, out NavMeshHit hit, NavMesh.AllAreas))
    {
        Vector3 safeDirection = (hit.position - start).normalized;
        return hit.position - safeDirection * attackDashWallBuffer;
    }

    if (NavMesh.SamplePosition(desiredEnd, out NavMeshHit sampleHit, 1.0f, NavMesh.AllAreas))
    {
        return sampleHit.position;
    }

    return start;
}
```

공격 돌진 실행 전에는 최종 목적지를 이 함수로 보정

```txt
Vector3 desiredEnd = transform.position + attackDirection * dashDistance;
Vector3 safeEnd = GetSafeAttackDashDestination(transform.position, desiredEnd);

MoveDashTo(safeEnd);
```

이렇게 할 시 공격 돌진이 벽 너머 좌표를 목적지로 잡더라도, 실제 이동은 NavMesh 경계 안에서만 이루어짐

## 8. QA-PM-004 공격 판정 추가 검증

벽을 넘는 이동뿐 아니라 공격 판정도 확인 필요

```txt
플레이어가 공격 범위 안에 있음
+ 에너미와 플레이어 사이가 막혀 있지 않음
= 공격 판정 적용
```

의사 코드

```txt
if (IsInAttackRange() && CanSeePlayer())
{
    ApplyDamage();
}
```

공격 상태에 이미 들어간 뒤 플레이어가 벽 뒤로 숨은 경우를 방지하는 안전장치 설정

## 9. QA-PM-005 몬스터 처치 후 공격 중단 문제

추가 확인 필요

| 확인 항목 | 설명 |
| --- | --- |
| <code>nowState</code> | 남은 에너미가 어떤 상태에 머물러 있는지 확인 |
| <code>isAttacking</code> | 공격 중 플래그가 true로 고정되었는지 확인 |
| <code>CurrentTarget</code> | 타겟이 null로 사라졌는지 확인 |
| <code>nextAttackAvailableTime</code> | 공격 쿨타임이 비정상적으로 길게 잡혔는지 확인 |
| Animator Trigger | 공격 애니메이션 트리거가 호출되는지 확인 |
| Death Event | 한 에너미 사망 이벤트가 다른 에너미에게 영향을 주는지 확인 |

수정 방향은 원인별로 상이

| 원인 | 수정 방향 |
| --- | --- |
| <code>isAttacking</code>이 true로 고정 | 공격 종료, 피격, 사망, 상태 전환 시 <code>SetIsAttacking(false)</code> 보장 |
| <code>CurrentTarget</code>이 사라짐 | 살아있는 플레이어를 다시 탐색하도록 보정 |
| 공격 쿨타임 꼬임 | 공격 시작/종료 시점의 쿨타임 갱신 위치 재검토 |
| 사망 이벤트 전파 문제 | 사망 처리가 해당 에너미 인스턴스에만 적용되도록 수정 |
| Animator 이벤트 누락 | 공격 이벤트와 프레젠터 연결 상태 확인 |

재현 이후 수정 방식 결정 필요

## 10. 우선 구현 순서

1. <code>QA-PM-004</code> 공격 돌진 목적지에 NavMesh 안전 보정 추가
2. <code>QA-PM-004</code> 공격 판정 직전 벽 차단 검사 추가
3. <code>QA-PM-003</code> 에너미별 <code>leashRadius</code>, <code>aggroValue</code> 추가
4. <code>QA-PM-003</code> Chase 상태에서 활동 범위 이탈 시 Return 전환
5. <code>QA-PM-003</code> 시야가 끊겼을 때 어그로 감소 로직 추가
6. <code>QA-PM-003</code> Return 목표를 가장 가까운 순찰 포인트로 설정
7. <code>QA-PM-005</code> 공격 중단 문제 재현 로그 추가
8. <code>QA-PM-005</code> 로그 결과에 따라 상태 플래그 또는 이벤트 연결 최소 수정

## 11. 기대 결과

| 기존 문제 | 수정 후 기대 결과 |
| --- | --- |
| 에너미가 끝없이 추격함 | 활동 반경 또는 어그로 감소로 복귀 |
| 순찰 루트에서 벗어난 뒤 복귀하지 않음 | 자기 루트의 가까운 포인트로 복귀 |
| 플레이어가 벽을 등지고 있을 때 에너미가 벽을 넘어옴 | 공격 돌진 목적지가 NavMesh 안쪽으로 보정됨 |
| 공격 상태 중 벽 너머 판정 가능성 | 공격 판정 직전 벽 차단 검사로 방지 |
| 몬스터 처치 후 공격 중단 | 로그 기반으로 원인 확인 후 상태/이벤트 꼬임 수정 |

## 12. 최종 정리

| 핵심 | 설명 |
| --- | --- |
| 추격 제한 | 에너미가 자기 활동 범위를 벗어나면 추격을 중단하고 복귀 |
| 안전한 공격 이동 | 공격 돌진이 벽 또는 NavMesh 경계를 넘지 않도록 목적지 보정 |
| 상태 디버깅 | 몬스터 처치 후 공격 중단 문제는 로그로 원인을 확인한 뒤 최소 수정 |
{% endraw %}
