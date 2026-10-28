---
title: "DEBUG-BETA-006"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "항목 내용 버그 ID QA-BETA-006 기능 게임 메뉴 팝업 발생 조건 각 화면 진입 시 재현 방법 ① 게임 시작 → ② 게임 메뉴(ESC) 실행 → ③ 다른 화면으로 이동 → ④ 로비로 복귀 후 게임 메뉴 실행 기대 결과 게임 메뉴 팝업이 떠 있지 않음 실제 결과 게임 메뉴 팝업이"
description: "항목 내용 버그 ID QA-BETA-006 기능 게임 메뉴 팝업 발생 조건 각 화면 진입 시 재현 방법 ① 게임 시작 → ② 게임 메뉴(ESC) 실행 → ③ 다른 화면으로 이동 → ④ 로비로 복귀 후 게임 메뉴 실행 기대 결과 게임 메뉴 팝업이 떠 있지 않음 실제 결과 게임 메뉴 팝업이"
published: false
migration_id: "f7536532580e83c0a0b3812b6528ac2f"
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
QA-BETA-006
</td>
</tr>
<tr>
<td>
기능
</td>
<td>
게임 메뉴 팝업
</td>
</tr>
<tr>
<td>
발생 조건
</td>
<td>
각 화면 진입 시
</td>
</tr>
<tr>
<td>
재현 방법
</td>
<td>
① 게임 시작 → ② 게임 메뉴(ESC) 실행 → ③ 다른 화면으로 이동 → ④ 로비로 복귀 후 게임 메뉴 실행
</td>
</tr>
<tr>
<td>
기대 결과
</td>
<td>
게임 메뉴 팝업이 떠 있지 않음
</td>
</tr>
<tr>
<td>
실제 결과
</td>
<td>
게임 메뉴 팝업이 떠 있으며, 팝업 띄우기/끄기 버튼 입력 시 UI가 중첩되면서 게임 메뉴 팝업이 종료되지 않고 잔존하는 문제 발생
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
첨부
</td>
<td>
이미지
</td>
</tr>
</table>

![첨부 자료](/assets/img/uploads/notion/3c25e5844e0b7ac9ce462ff6104195eac3b77cae0aea699b609f4f1d3f4d1a03.png)

## 디버깅 결과

| 항목 | 내용 |
| --- | --- |
| 원인 | 인게임 UI가 캐시된 활성 상태로 다음 씬까지 유지되었고, UI를 다시 열어도 기존 스택 위치가 갱신되지 않아 실제 화면 순서와 팝업 스택 순서가 달라졌다. |
| 수정 내용 | 활성 UI를 다시 열 때 기존 스택 항목을 제거한 뒤 최상단으로 재등록하도록 수정했다. 씬 전환 시 GamePlayUI, InventoryUI, ChestUI, InGameMenuUI, SettingUI 등 인게임 전용 UI를 일괄 비활성화하고 스택에서 제거하도록 보강했다. |
| 수정 파일 | \<code>UIManager.cs\</code>, \<code>GameUIPresenter.cs\</code>, \<code>SceneController.cs\</code> |
| 수정 커밋 | \<code>6196912\</code> |
| 검증 방법 | ESC 메뉴를 연 상태로 화면 이동 및 로비 복귀를 반복하고, 다음 화면에서 게임 메뉴가 잔존하거나 중첩되지 않는지 확인한다. |
| 상태 | 수정 완료 / 회귀 테스트 필요 |
{% endraw %}
