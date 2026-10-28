---
title: "DEBUG-BETA-012"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "항목 내용 버그 ID QA-BETA-012 기능 창고 - 퀵슬롯 발생 조건 퀵슬롯에 장착되어 있는 아이템을 드래그 재현 방법 ① 게임 시작 → ② 창고 → ③ 퀵슬롯에 있는 아이템 드래그 기대 결과 슬롯 크기에 맞게 드래그 시작 실제 결과 슬롯 크기 보다 드래그 영역이 넓어서 엉뚱한 아"
description: "항목 내용 버그 ID QA-BETA-012 기능 창고 - 퀵슬롯 발생 조건 퀵슬롯에 장착되어 있는 아이템을 드래그 재현 방법 ① 게임 시작 → ② 창고 → ③ 퀵슬롯에 있는 아이템 드래그 기대 결과 슬롯 크기에 맞게 드래그 시작 실제 결과 슬롯 크기 보다 드래그 영역이 넓어서 엉뚱한 아"
published: false
migration_id: "0ad36532580e8284b4da01ea66640dda"
migration_status: "review_required"
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
QA-BETA-012
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
창고 - 퀵슬롯
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
퀵슬롯에 장착되어 있는 아이템을 드래그
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 게임 시작 → ② 창고 → ③ 퀵슬롯에 있는 아이템 드래그
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
슬롯 크기에 맞게 드래그 시작
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
슬롯 크기 보다 드래그 영역이 넓어서 엉뚱한 아이템이 드래그됨
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

![첨부 자료](/assets/img/uploads/notion/902e13e7a4c18e01f68f50052524cdd9144bb4942994eaf81508dece86476711.png)

퀵슬롯에 사용된 UI-InventorySlot의 Image-DragArea의 Rect Transform을 stretch x stretch 로 수정
{% endraw %}
