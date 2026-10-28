---
title: "DEBUG-BETA-015"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "항목 내용 버그 ID QA-BETA-015 기능 튜토리얼 / 아이템 상자 / 인벤토리 UI 발생 조건 튜토리얼 아이템 상자를 열어 다음 일시정지 안내가 출력될 때 재현 방법 ① 튜토리얼 아이템 구간 진입 → ② 상자와 상호작용 → ③ 상자 UI와 인벤토리 UI 출력 상태 확인 기대 결과"
description: "항목 내용 버그 ID QA-BETA-015 기능 튜토리얼 / 아이템 상자 / 인벤토리 UI 발생 조건 튜토리얼 아이템 상자를 열어 다음 일시정지 안내가 출력될 때 재현 방법 ① 튜토리얼 아이템 구간 진입 → ② 상자와 상호작용 → ③ 상자 UI와 인벤토리 UI 출력 상태 확인 기대 결과"
published: true
migration_id: "3a536532580e81d7b902f38ff9d20fcd"
migration_status: "published"
migration_flags: []
---

{% raw %}
<table header-row="true">
<colgroup>
<col />
<col width="873" />
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
QA-BETA-015
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
튜토리얼 / 아이템 상자 / 인벤토리 UI
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
튜토리얼 아이템 상자를 열어 다음 일시정지 안내가 출력될 때
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 튜토리얼 아이템 구간 진입 → ② 상자와 상호작용 → ③ 상자 UI와 인벤토리 UI 출력 상태 확인
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
상자 UI와 인벤토리 UI가 함께 열리고, 이후 튜토리얼 안내가 출력되며 플레이 조작이 차단된다.
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
상자 UI만 열리고 인벤토리 UI는 출력되지 않는다.
</td>
</tr>
<tr>
<td>
영향 범위
</td>
<td>
튜토리얼 아이템 확인 및 인벤토리 이동 안내 진행이 불가능해질 수 있다.
</td>
</tr>
<tr>
<td>
원인
</td>
<td>
\<code>OnItemBoxOpened\</code> 이벤트에서 튜토리얼이 먼저 다음 안내를 열어 입력 차단을 적용했다. 이후 인벤토리 열기 요청이 \<code>IsGameplayInputBlocked\</code> 검사에서 중단되었다. 상자 UI에는 같은 검사가 없어 상자 UI만 출력되었다.
</td>
</tr>
<tr>
<td>
수정 내용
</td>
<td>
상자 오픈 튜토리얼 이벤트를 한 프레임 지연하여 인벤토리와 상자 UI가 먼저 생성되도록 변경했다. 중복 이벤트를 방지하고, 마지막 안내 종료 후에도 인벤토리가 열려 있으면 UI 입력 맵과 커서를 유지하도록 보강했다.
</td>
</tr>
<tr>
<td>
수정 파일
</td>
<td>
\<code>TutorialManager.cs\</code>
</td>
</tr>
<tr>
<td>
수정 커밋
</td>
<td>
\<code>37063ec\</code>
</td>
</tr>
<tr>
<td>
검증 방법
</td>
<td>
상자·인벤토리 UI 동시 출력, 안내 중 조작 차단, 마지막 안내 후 인벤토리 조작, 상자 종료 후 플레이어 입력 복구를 확인한다.
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
수정 완료 / 회귀 테스트 필요
</td>
</tr>
</table>
{% endraw %}
