---
title: "DEBUG-PM-004"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "항목 내용 버그 ID QA-PM-004 / QA-PM-006 기능 에너미 공격 이동 / 플레이어 구르기 이동 / 벽 충돌 판정 발생 조건 에너미가 벽을 등진 플레이어를 향해 공격 또는 돌진하거나, 플레이어가 벽에 밀착한 상태에서 구르기를 사용 재현 방법 ① 플레이어가 벽을 등지고 대기 "
description: "항목 내용 버그 ID QA-PM-004 / QA-PM-006 기능 에너미 공격 이동 / 플레이어 구르기 이동 / 벽 충돌 판정 발생 조건 에너미가 벽을 등진 플레이어를 향해 공격 또는 돌진하거나, 플레이어가 벽에 밀착한 상태에서 구르기를 사용 재현 방법 ① 플레이어가 벽을 등지고 대기 "
published: false
migration_id: "4a936532580e838d906981906e6337be"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
<table header-row="true">
<colgroup>
<col />
<col width="1047.000015258789" />
</colgroup>
<tr>
<td>
항목
</td>
<td>
내용
</td>
</tr>
<tr>
<td>
버그 ID
</td>
<td>
QA-PM-004 / QA-PM-006
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
에너미 공격 이동 / 플레이어 구르기 이동 / 벽 충돌 판정
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
에너미가 벽을 등진 플레이어를 향해 공격 또는 돌진하거나, 플레이어가 벽에 밀착한 상태에서 구르기를 사용
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 플레이어가 벽을 등지고 대기 → ② 에너미가 공격/돌진 수행 → ③ 에너미가 벽을 넘어오는지 확인 / ① 플레이어를 벽에 밀착 → ② 벽 방향으로 구르기 사용 → ③ 플레이어가 벽을 통과하는지 확인
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
에너미 공격/돌진과 플레이어 구르기 모두 벽 Collider 또는 NavMesh 경계를 넘지 않아야 함
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
에너미가 공격/돌진 중 벽을 넘어오거나, 플레이어가 구르기 중 벽을 통과하는 현상 발생
</td>
</tr>
<tr>
<td>
우선순위
</td>
<td>
Critical
</td>
</tr>
<tr>
<td>
상태
</td>
<td>
수정 완료 / 추가 테스트 필요
</td>
</tr>
<tr>
<td>
원인
</td>
<td>
에너미 공격/돌진과 플레이어 구르기는 모두 짧은 시간에 위치가 크게 이동하는 액션이다. 이 과정에서 벽 너머 좌표가 이동 목적지로 잡히거나, 빠른 이동으로 인해 충돌 검사가 충분히 반영되지 않아 벽 관통이 발생했다.
</td>
</tr>
<tr>
<td>
수정 내용
</td>
<td>
에너미 공격 돌진은 NavMesh 경계와 Wall Collider를 검사해 안전 위치로 보정하도록 수정했다. 공격 판정 직전에도 에너미와 플레이어 사이에 벽이 있는지 검사해 벽 너머 데미지가 적용되지 않도록 처리했다. 플레이어 이동/구르기는 Rigidbody SweepTest를 사용해 이동 전 벽 충돌 여부를 확인하고, 벽이 있으면 벽 앞까지만 이동하도록 보정했다.
</td>
</tr>
<tr>
<td>
추가 확인
</td>
<td>
LevelDesignScene의 벽 및 벽 Collider 오브젝트 Layer가 <code>Wall</code>로 설정되어 있어야 한다. 에너미의 <code>Lunge Obstacle Mask</code>, <code>Attack Obstacle Mask</code>, 플레이어의 <code>Movement Obstacle Mask</code>도 <code>Wall</code>로 지정해야 한다. 문제가 남는 벽 구간은 Collider를 덧대어 보강한다.
</td>
</tr>
</table>
{% endraw %}
