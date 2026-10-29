---
title: "오늘 할일"
date: 2026-03-30 12:00:00 +0900
categories: ["개발 메모", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "에피소드 3의 로비와 3-3 씬을 나눌 기준과 핵심 연출 흐름을 확정하기 위한 작업 계획이다."
description: "에피소드 3의 로비와 3-3 씬을 나눌 기준과 핵심 연출 흐름을 확정하기 위한 작업 계획이다."
published: true
migration_id: "35e36532580e818b898cfaead9b37bfd"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
## 기본 정보

- 날짜: 2026-03-30
- 프로젝트: moz.A.I.c
- 작성자: 작성자

## 오늘 할 일(우선순위)

- 3-0(로비) 씬 / 3-3 씬 분리 기준 확정
  - 같은 맵 디자인을 공유하되, 씬별 기능(상호작용/트리거/연출/상태표시) 차이를 목록으로 정리
- 3-3 씬 핵심 연출 루프 1차 고정
  - 진입 → (선택) 조사 → 피아노 존 진입 → 컷신/대화 트리거 → 종료/전환
  - 트리거 위치(피아노 바로 앞 vs 조금 앞) 결론 내기
- 3-0 로비 씬 기능 정의(최소 스펙)
  - 플레이어가 ‘다음 행동’을 선택/이해할 수 있는 요소(간단 상호작용 또는 상태 표시) 정리
- 3-3 맵 디테일 보강 1차 패스
  - 시야 차단(복도/코너) + 피아노 중심성(조명/러그/동선) + 구역 간 밀도 균형 점검

## 대화툴/데이터 테이블(병행, 가능하면)

- <code>FreeTextInput</code> 결과(intent/scoreDelta/addTags/nextDialogueId) → <code>Condition</code>/<code>Event</code> 연결 규칙 1페이지로 확정
- Event 파라미터 구조 결정
  - paramA/B/C 유지 vs key-value vs JSON payload 중 팀 기준 선택

## 오늘 끝내면 좋은 산출물

- 3-0/3-3 씬별 기능 차이 체크리스트(한 페이지)
- 3-3 진입\~종료 플로우 1장(텍스트로도 OK)

## 참고

- [관련 기록]({% endraw %}{% post_url 2026-03-26-development-note-c65375aed66c %}{% raw %}) (3-3 맵 기획서)
- [관련 기록]({% endraw %}{% post_url 2026-03-25-development-note-cc2915b726e5 %}{% raw %}) (대화/나레이션 툴 기획서)
{% endraw %}
