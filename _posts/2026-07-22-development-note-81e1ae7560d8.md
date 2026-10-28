---
title: "DEBUG-BETA-010"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "항목 내용 버그 ID QA-BETA-010 기능 게임 메뉴 발생 조건 게임 메뉴를 통해 로비 화면으로 복귀 시 재현 방법 ① 게임 시작 → ② 출격 → ③ ESC 버튼 입력 → ④ 로비로 돌아가기 선택 후 로비로 복귀 → ⑤ 창고에서 소지품 확인 기대 결과 게임 시작 전의 인벤토리 상태"
description: "항목 내용 버그 ID QA-BETA-010 기능 게임 메뉴 발생 조건 게임 메뉴를 통해 로비 화면으로 복귀 시 재현 방법 ① 게임 시작 → ② 출격 → ③ ESC 버튼 입력 → ④ 로비로 돌아가기 선택 후 로비로 복귀 → ⑤ 창고에서 소지품 확인 기대 결과 게임 시작 전의 인벤토리 상태"
published: true
migration_id: "6f936532580e8246890981e1ae7560d8"
migration_status: "published"
migration_flags: []
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
QA-BETA-010
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
게임 메뉴 
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
게임 메뉴를 통해 로비 화면으로 복귀 시
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 게임 시작 → ② 출격 → ③ ESC 버튼 입력 → ④ 로비로 돌아가기 선택 후 로비로 복귀 → ⑤ 창고에서 소지품 확인
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
게임 시작 전의 인벤토리 상태와 동일
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
게임 내의 변경사항 유지
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
없음
</td>
</tr>
</table>

## 디버깅 결과

| 항목 | 내용 |
| --- | --- |
| 원인 | \<code>NoticeLobbyUI\</code>가 관제실 이동 이벤트를 직접 호출해 기존 실패 정산 흐름을 우회했다. 이 때문에 인게임에서 획득하거나 변경한 아이템과 장착 정보가 그대로 저장되었다. |
| 수정 내용 | \<code>SessionEndReason.GameAbandon\</code>을 추가하고 관제실 복귀를 게임 포기 결과로 처리하도록 연결했다. 게임 포기 시 기존 실패 정산을 실행하여 소지 아이템, 장착 아티팩트, 퀵슬롯을 정리하고 결과 화면을 거쳐 로비로 이동하도록 변경했다. 확인창 문구에도 아이템 소실 경고를 추가했다. |
| 수정 파일 | \<code>Enums.cs\</code>, \<code>ResultManager.cs\</code>, \<code>IResultService.cs\</code>, \<code>NoticeLobbyUI.cs\</code>, \<code>PlayerStatus.cs\</code> |
| 수정 커밋 | \<code>c32ccf5\</code> |
| 검증 방법 | 아이템 획득·아티팩트 장착·퀵슬롯 등록 후 ESC 메뉴에서 관제실 복귀를 선택한다. 실패 결과 화면 출력과 로비 복귀 후 아이템 상태를 확인한다. |
| 상태 | 수정 완료 / 회귀 테스트 필요 |
{% endraw %}
