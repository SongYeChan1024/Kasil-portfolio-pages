---
title: "DEBUG-CD-001"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "항목 내용 버그 ID QA-CD-001 기능 출격 소지품 퀵슬롯 출력 발생 조건 앱 실행 후 인게임 세션 첫 진입 전 로비 신 내부에서 발생 재현 방법 ① 앱 실행 → ② 창고/인벤토리 화면으로 이동하여 소비 기물 아이템을 퀵슬롯에 배치 → ③ 관제실 화면으로 이동 → ④ 출격 준비 화"
description: "항목 내용 버그 ID QA-CD-001 기능 출격 소지품 퀵슬롯 출력 발생 조건 앱 실행 후 인게임 세션 첫 진입 전 로비 신 내부에서 발생 재현 방법 ① 앱 실행 → ② 창고/인벤토리 화면으로 이동하여 소비 기물 아이템을 퀵슬롯에 배치 → ③ 관제실 화면으로 이동 → ④ 출격 준비 화"
published: false
migration_id: "73836532580e825a86940191c492ee8f"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
<table header-row="true">
<colgroup>
<col />
<col width="575.0000152587891" />
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
QA-CD-001
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
출격 소지품 퀵슬롯 출력
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
앱 실행 후 인게임 세션 첫 진입 전 로비 신 내부에서 발생
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 앱 실행 → ② 창고/인벤토리 화면으로 이동하여 소비 기물 아이템을 퀵슬롯에 배치 → ③ 관제실 화면으로 이동 → ④ 출격 준비 화면으로 이동
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
창고 화면에서 아이템을 배치한 퀵 슬롯이 출격 준비 화면의 출격 소지품 UI에 출력됨
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
출격 소지품 UI가 빈 칸으로 출력됨
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
첨부
</td>
<td>
스크린샷 2장 (창고에서 퀵슬롯 배치 → 출격 준비 화면)
</td>
</tr>
</table>

<table header-row="true">
<colgroup>
<col />
<col width="575.0000152587891" />
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
QA-CD-002
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
개인 심상 기억 잠금 해제
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
앱 실행 후 인게임 세션 첫 진입 전 로비 신 내부에서 발생
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 인게임 세션을 1회 이상 플레이하여 동조율 단계 Lv.1 이상인 상태로 앱 종료 → ② 앱을 다시 실행 → ③ 로비 신에서 다이버 기록 화면으로 이동
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
동조율 단계 Lv.1 이상에서 해금되는 기록 01이 터치 가능한 상태로 출력
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
동조율 단계 텍스트가 “동조율 Lv.0”으로 출력됨<br />기록 01이 잠김 상태로 출력됨
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
첨부
</td>
<td>
스크린샷 1장
</td>
</tr>
</table>

- CD-001
  <p>
  출격 소지품 UI의 초기화 시점을 결과 창에서 수행하고 있었기 때문에 발생한 문제
  </p>

  <p>
  → 출격 UI가 열리면 플레이어의 소지품에 따라 정보를 출력하도록 변경
  </p>
{% endraw %}
