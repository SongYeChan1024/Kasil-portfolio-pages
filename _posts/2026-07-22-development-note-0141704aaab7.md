---
title: "DEBUG-TD-004"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "1. 기본 정보 | 항목 | 내용 | | --- | --- | | 디버깅 ID | DEBUG-TD-004 | | 관련 버그 | | | 이슈명 | 플레이어의 총알 Ray가 적에게 도착했으나 실제 TakeDamage 판정을 발동시키지 않는 경우가 간헐적으로 발생하는 현상 | | 담당 기능 "
description: "1. 기본 정보 | 항목 | 내용 | | --- | --- | | 디버깅 ID | DEBUG-TD-004 | | 관련 버그 | | | 이슈명 | 플레이어의 총알 Ray가 적에게 도착했으나 실제 TakeDamage 판정을 발동시키지 않는 경우가 간헐적으로 발생하는 현상 | | 담당 기능 "
published: true
migration_id: "d3136532580e83519cdf0141704aaab7"
migration_status: "published"
migration_flags: ["local_code_link_unlinked"]
---

{% raw %}
## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 디버깅 ID | DEBUG-TD-004 |
| 관련 버그 |  |
| 이슈명 | 플레이어의 총알 Ray가 적에게 도착했으나 실제 TakeDamage 판정을 발동시키지 않는 경우가 간헐적으로 발생하는 현상 |
| 담당 기능 | 플레이어 공격 |
| 발견자 | 강다영 |
| 발견일 | 2026-07-10 |
| 발생 씬 | DemoScene |
| 상태 | 해결 완료 |
| 우선순위 | Critical |
| 원인 유형 | 공격 Raycast가 ‘조준’ → ‘발사’의 2단계로 이루어져 있는 구조에서 조준 Ray와 발사 Ray의 좌표 값 시차 |

## 2. 문제 현상

인게임 세션 플레이 중 플레이어가 적을 향해 기본 공격을 발사했을 때, 발사한 기본 공격의 Shot Trace가 적 캐릭터에게 명중한 상황에서도 명중 판정에 의한 적 HP 감소가 발생하지 않는 상황이 확인되었다.<br />(히트 판정이 발생하지 않은 경우 Shot Trace가 Miss Trace Color=빨간색으로 출력됨)

## 3. 원인 분석

이번 프로젝트에서 플레이어의 기본 공격 메소드는

1. aimOrigin 지점에서 마우스 커서 방향으로 배치된 firePoint 정면 방향을 향해 1차 Raycast를 실행한다.
2. 1차 RayCast가 hitMask에 해당하는 LayerMask에 속한 적 Collider에 히트하면 히트한 지점을 targetPoint로 지정한다.
3. muzzleOrigin 지점에서 targetPoint 방향으로 2차 Raycast를 실행할 shotDirection을 구한다.
4. muzzleOrigin이 벽 collider과 겹치는 상황에 대비해 약간 뒤쪽에 safeShotOrigin을 살정하고, safeShotOrigin 지점에서 shotDirection 방향으로 2차 Raycast를 실행한다.
5. 2차 Raycast가 hitMask에 해당하는 LayerMask에 속한 적 Collider에 히트하면 히트한 적에게 TakeDamage 메소드를 전달해 HP를 감소시킨다.

의 순서로 진행되는데, 이때 2차 Raycast의 길이가 <code>targetPoint와 muzzleOrigin 사이의 거리</code> + <code>4. 에서 safeShotOrigin을 설정하기 위해 muzzleOrigin에서 뒤로 떨어뜨린 안전 거리</code>만큼으로 정해진다.

여기서 <code>aimOrigin = transform.position + Vector3.up * aimOriginHeight</code>, <code>muzzleOrigin = firePoint.position</code>으로 서로 다른 위치를 지정하고 있어, 1차 Raycast에서 히트한 targetPoint와 2차 Raycast의 끝 지점이 일치하지 않을 수 있다.

## 4. 확인한 내용

| 확인 항목 | 결과 |
| --- | --- |
| Collider 구조 확인 | EnemyStatus 컴포넌트가 있는 Enemy-DarkSpirit 루트 오브젝트가 실제 히트 판정 콜라이더가 있는 body 오브젝트의 부모 오브젝트로 연결됨 |
| 히트 콜라이더 설정 확인 | isTrigger = false<br />Layer = Enemy |
| Debug.Log(`shotHit.collider.name`) 체크 | 미스 발생 시 출력되지 않음 |
| bool aimHitSuccess = Physics.Raycast(aimOrigin, aimDirection, out RaycastHit aimHit, weaponData.fireRange, hitMask, QueryTriggerInteraction.Ignore);<br />Debug.Log(\$"\[AIM\] hit=\{aimHitSuccess\}, point=\{(aimHitSuccess ? aimHit.point.ToString() : "N/A")\}, targetPoint=\{targetPoint\}");<br />체크 | \[AIM\] hit=True, point=(8.75, 1.00, 4.96), targetPoint=(8.75, 1.00, 4.96)<br />→ 1차 Raycast는 정확하게 히트하고 있음 |
| bool shotHitSuccess = Physics.Raycast(safeShotOrigin, shotDirection, out RaycastHit shotHit, safeShotDistance, hitMask, QueryTriggerInteraction.Ignore);<br />Debug.Log(\$"\[SHOT\] hit=\{shotHitSuccess\}, origin=\{safeShotOrigin\}, dir=\{shotDirection\}, dist=\{safeShotDistance\}, targetPoint=\{targetPoint\}");<br />추가 체크 | \[AIM\] hit=True, point=(10.89, 1.00, 7.75), targetPoint=(10.89, 1.00, 7.75)<br />및<br />\[SHOT\] hit=False, origin=(4.04, 1.00, 7.01), dir=(0.99, 0.00, 0.11), dist=6.887317, targetPoint=(10.89, 1.00, 7.75)<br />→ 1차 Raycast와 2차 Raycast의 입사각 차이가 확인됨 |
| 최종 원인 | 1차 Raycast와 2차 Raycast의 발사 지점 차이로 인해 2차 Raycast가 적 Collider에 히트하지 못함 |

## 5. 수정 방향

<p>
1차 Raycast에서 히트한 지점을 향해 2차 Raycast를 발사할 경우, 1차 Raycast에서 반환받은 플레이어와 적 사이의 거리보다 약간 더 길게 2차 Raycast를 발사하도록 Ray 최대 길이 보정을 실시해준다. 
</p>

## 6. 검증 방법

| 검증 항목 | 기대 결과 |
| --- | --- |
| 수정 후 허공에 발사 | 설정한 보정 값만큼 1차 Raycast보다 2차 Raycast가 더 길게 진행됨 |
| 수정 후 적 캐릭터에 발사 | 2차 Raycast도 항상 1차 Raycast에서 히트한 적 Collider에 히트함 |

## 7. 회고

조준 시선과 발사 시 총알이 진행하는 궤적의 시작 지점 및 방향 차이는 실제 총기에서도 고려해야 하는 요소로, 게임 개발 시에 어떤 방식으로 해당 보정을 실행하는 것이 현실성이나 게임성 면에서 더 적합한지는 추가로 고려해야 할 것으로 보인다.
{% endraw %}
