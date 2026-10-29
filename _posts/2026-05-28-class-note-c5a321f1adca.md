---
title: "2D 실습 프로젝트 기획서"
date: 2026-05-28 12:00:00 +0900
categories: ["수업 노트", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "가로로 이동하며 눈을 피하는 2D 게임의 체력·피격·게임 오버 규칙과 Firebase 데이터 저장 항목을 정리했다."
description: "가로로 이동하며 눈을 피하는 2D 게임의 체력·피격·게임 오버 규칙과 Firebase 데이터 저장 항목을 정리했다."
published: true
migration_id: "36e36532580e801ba570c5a321f1adca"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 게임 프로젝트 설계: 눈 피하기

- 플레이어는 가로로 이동하며 위에서 떨어지는 눈을 피한다.
- 체력은 100이다.
- 눈을 한 번 맞을 때 피해량은 20이다.
- 5번 맞으면 게임 오버가 된다.

## 데이터 저장

데이터베이스는 Firebase를 사용한다.

- 게임 재화: 코인, 돈
- 게임 점수(Score)
- 플레이어 종류: 5~6종류
{% endraw %}
