---
title: "DEBUG-PM-003"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "항목 내용 버그 ID QA-PM-003 기능 다크 스피릿 추격 / 복귀 / 랜덤 순찰 AI 우선순위 Major 상태 코드 수정 완료 / 플레이 모드 회귀 테스트 필요 발생 조건 플레이어를 감지한 다크 스피릿이 자기 패트롤 루트에서 멀리 벗어남 기존 문제 시야가 유지되면 활동 범위를 벗어"
description: "항목 내용 버그 ID QA-PM-003 기능 다크 스피릿 추격 / 복귀 / 랜덤 순찰 AI 우선순위 Major 상태 코드 수정 완료 / 플레이 모드 회귀 테스트 필요 발생 조건 플레이어를 감지한 다크 스피릿이 자기 패트롤 루트에서 멀리 벗어남 기존 문제 시야가 유지되면 활동 범위를 벗어"
published: false
migration_id: "b4336532580e83f18722814fbb9d5a3f"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
<table header-row="true">
<colgroup>
<col />
<col width="922" />
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
QA-PM-003
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
다크 스피릿 추격 / 복귀 / 랜덤 순찰 AI
</td>
</tr>
<tr>
<td>
우선순위
</td>
<td>
Major
</td>
</tr>
<tr>
<td>
상태
</td>
<td>
코드 수정 완료 / 플레이 모드 회귀 테스트 필요
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
플레이어를 감지한 다크 스피릿이 자기 패트롤 루트에서 멀리 벗어남
</td>
</tr>
<tr>
<td>
기존 문제
</td>
<td>
시야가 유지되면 활동 범위를 벗어나도 추적이 계속됨. 추적 종료 후 기존 순찰 루트로 정상 복귀하지 않거나 다른 에너미와 루트가 겹침
</td>
</tr>
<tr>
<td>
원인
</td>
<td>
추적 제한 거리가 실질적인 해제 조건으로 동작하지 않았으며, 에너미별 스폰 포인트와 패트롤 루트 연결 및 좌표가 일치하지 않았음
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
추적 허용 범위를 벗어나면 어그로가 감소하고, 최대 활동 범위를 넘으면 즉시 추적을 중단한 뒤 자기 루트의 가장 가까운 포인트로 복귀
</td>
</tr>
<tr>
<td>
수정 결과
</td>
<td>
추적 허용 16m, 완충 구간 16\~24m, 강제 복귀 24m 구조 적용
</td>
</tr>
<tr>
<td>
복귀 방식
</td>
<td>
에너미 및 플레이어와 가장 가까운 자기 패트롤 포인트를 기준으로 거리 계산 후 복귀
</td>
</tr>
<tr>
<td>
순찰 방식
</td>
<td>
NavMesh에서 도달 가능한 위치를 선택해 패트롤 포인트 주변을 랜덤 배회
</td>
</tr>
<tr>
<td>
스폰 구성
</td>
<td>
내부 및 외곽 스폰 포인트 14개를 각 전용 패트롤 루트에 연결
</td>
</tr>
<tr>
<td>
감지 밸런스
</td>
<td>
시야 8m, 추적 인지 12m, 청각 20m, 벽에 의한 청각 차단 적용
</td>
</tr>
<tr>
<td>
연관 수정
</td>
<td>
실제 NavMesh 이동 벡터와 애니메이션 방향 동기화, 좌우 플립 및 정면·뒷면 방향값 수정
</td>
</tr>
<tr>
<td>
수정 씬
</td>
<td>
LevelDesignScene / LevelDesignScene Additive
</td>
</tr>
<tr>
<td>
검증 결과
</td>
<td>
C# 빌드 오류 0개, 직렬화 형식 검사 통과
</td>
</tr>
<tr>
<td>
커밋
</td>
<td>
<code>fix: 다크 스피릿 순찰·추적 AI 재설계 및 애니메이션 방향 수정</code>
</td>
</tr>
</table>
{% endraw %}
