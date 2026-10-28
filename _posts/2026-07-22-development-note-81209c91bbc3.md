---
title: "DEBUG-CD-004"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "DEBUG-CD-004 Addressable Group 누락으로 인한 아이템 출력 불가 문제 1. 기본 정보 | 항목 | 내용 | | --- | --- | | 디버깅 ID | DEBUG-CD-004 | | 관련 버그 | | | 이슈명 | Addressable Group 누락으로 인한 아"
description: "DEBUG-CD-004 Addressable Group 누락으로 인한 아이템 출력 불가 문제 1. 기본 정보 | 항목 | 내용 | | --- | --- | | 디버깅 ID | DEBUG-CD-004 | | 관련 버그 | | | 이슈명 | Addressable Group 누락으로 인한 아"
published: false
migration_id: "30b36532580e8210864081209c91bbc3"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
# DEBUG-CD-004 Addressable Group 누락으로 인한 아이템 출력 불가 문제

## 1. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 디버깅 ID | DEBUG-CD-004 |
| 관련 버그 |  |
| 이슈명 | Addressable Group 누락으로 인한 아이템 출력 불가 문제 |
| 담당 기능 | Addressable |
| 발견자 | 우성혁 |
| 발견일 | 2026-07-10 |
| 발생 씬 | DemoScene |
| 상태 | 해결 완료 |
| 우선순위 | Critical |
| 원인 유형 | Addressable Group 세팅 누락 |

## 2. 문제 현상

Unity Editor에서 인게임 세션 플레이 중 아이템 박스와 상호작용하여 상자 UI 출력 시 Console에 에러 메시지가 출력되었다.

## 3. 원인 분석

Addressable 그룹 확인 결과 UI\_Icon\_Epic\_FrozenClockwork 아이템의 Addressable 체크가 해제되어 있는 상황이었음이 확인되었다.

## 4. 확인한 내용

| 확인 항목 | 결과 |
| --- | --- |
| Addressable Default Local Group 확인 | UI\_Icon\_Epic\_FrozenClockwork 이외의 아이템이 전부 등록되어 있음을 확인 |
| Addressable 체크 확인 | 체크 해제된 상태 |
| 최종 원인 | Addressable 체크 누락 |

## 5. 수정 방향

UI\_Icon\_Epic\_FrozenClockwork 아이템을 Project에서 선택하고, Addressable 토글의 체크를 활성화한다.

<p>
Addressable Name을 UI\_Icon\_Epic\_FrozenClockwork으로 수정한다. 
</p>

## 6. 검증 방법

| 검증 항목 | 기대 결과 |
| --- | --- |
| 아이템 상자 UI 출력 | Console Error 없이 정상 출력 |
| 아이템 상자에서 아이템 이동 | Console Error 없이 정상 이동 |

## 7. 회고

이전 개발 작업 중 병합 과정에서 Addressable Group의 병합 충돌로 인한 Addressable 중복 및 누락이 빈번히 발생한 바 있기에, 본 디버깅 과정을 병합 후 보정 작업의 중요성을 나타내는 에러 사례로 기록할 필요가 있다.
{% endraw %}
