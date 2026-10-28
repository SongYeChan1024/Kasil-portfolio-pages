---
title: "| Unity Runner 게임 기획서"
date: 2026-03-06 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "작성일: 2026-03-05 최종 업데이트: 2026-03-05 문서 유형: 게임 기획서 (실습) 게임명: Unity Runner 진행 로그(데일리) 아래 데일리 로그에서 날짜별 진행 과정을 확인 관련 기록03/05 데일리 로그 | Unity Runner 2026-03-06\\_데일리 로"
description: "작성일: 2026-03-05 최종 업데이트: 2026-03-05 문서 유형: 게임 기획서 (실습) 게임명: Unity Runner 진행 로그(데일리) 아래 데일리 로그에서 날짜별 진행 과정을 확인 관련 기록03/05 데일리 로그 | Unity Runner 2026-03-06\\_데일리 로"
published: false
migration_id: "35e36532580e81a29669deb24622f29f"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
작성일: 2026-03-05

최종 업데이트: 2026-03-05

문서 유형: 게임 기획서 (실습)

게임명: Unity Runner

## 진행 로그(데일리)


<details markdown="1">
<summary>아래 데일리 로그에서 날짜별 진행 과정을 확인</summary>


[관련 기록]({% endraw %}{% post_url 2026-03-06-daily-log-d74a74e36422 %}{% raw %})03/05 데일리 로그 | Unity Runner&lt;/mention&gt;

[2026-03-06\_데일리 로그]({% endraw %}{% post_url 2026-03-06-daily-log-ff078183ed67 %}{% raw %})


</details>


---

## 1. 목표

- 엘리스 수업 강의를 토대로 2D 러너 게임을 제작하고, 구현 중 문제점을 파악/수정한다.

## 2. 핵심 미션(플레이 목표)

- 계속 뛰면서 발판 사이를 점프해 낭떠러지로 떨어지지 않고 오래 살아남는다.

## 3. 주요 기능(요구사항)

### 3.1 스테이지/발판 생성

- 발판을 무한 생성한다.
- 발판 간격과 높이는 랜덤으로 생성한다.
- 오브젝트 풀링 기반으로 발판을 재사용한다(초기 N개 생성 → 비활성/재배치 반복).

### 3.2 장애물 생성

- 각 발판 위에 1\~3개의 장애물이 일정 확률로 생성 및 배치되도록 한다.
- 장애물은 랜덤 확률로 생성한다(예: 1/3 확률).

### 3.3 점수 시스템

- 캐릭터가 새로운 발판에 착지할 때마다 점수가 추가되고 UI에 즉시 갱신된다.
- 게임 오버 시 점수 UI는 비활성화하거나 결과 UI로 전환한다.

### 3.4 조작(입력)

- 입력 시스템은 Unity New Input System 기반으로 구성한다.
- 점프: Fire 액션(마우스 왼쪽 버튼/모바일 터치 등으로 바인딩)
- 사망 후 게임 재시작: Fire 액션으로 재시작(초기에는 임시로 마우스 클릭 처리 가능)
- (선택) 이단 점프/차지 점프는 후순위 확장 기능으로 둔다.

### 3.5 UI

- 점수(Score) 텍스트: 상단 중앙 고정, 가독성(Outline 등) 확보
- 게임 오버 UI: Game Over / Jump to Start 등, 게임 오버 시에만 표시
- Canvas Scaler는 Scale With Screen Size 기반으로 세팅하고 Reference Resolution은 640x360(모바일 16:9/16:10 기준)을 사용한다.

### 3.6 게임 매니저/게임 흐름

- GameManager 싱글톤으로 점수/게임오버 상태를 관리한다.
- 플레이어 사망 시 GameManager가 게임 오버 상태로 전환하고, 스크롤/오브젝트 이동을 정지한다.
- 재시작은 현재 씬을 다시 로드하여 처리한다.

### 3.7 캐릭터 애니메이션

- 플레이어 캐릭터에 애니메이션을 적용한다.
- 상황에 따라 뛰기/점프/사망 애니메이션이 재생되도록 한다.
- SpriteAtlas를 적용한다.

## 4. 게임 흐름(최신)

- 시작: "Jump to Start"(또는 Start 안내) 표시 → 입력(Fire) 시 게임 시작
- 진행: 배경/발판이 좌측으로 스크롤, 플레이어는 점프하여 발판을 이동하며 점수 누적
- 실패(게임 오버): 플레이어 사망 또는 발판/낭떠러지 조건 충족 시 게임 오버
  - GameManager가 isGameOver = true로 전환
  - 스크롤링 오브젝트 정지
  - Game Over UI 표시, 점수 UI는 숨김 또는 결과 표시로 전환
- 재시작: 입력(Fire) 시 현재 씬 Reload

## 5. 구현 메모(기술 결정)

- UI 스케일: Canvas Scaler = Scale With Screen Size, Reference Resolution = 640x360
- 입력: New Input System, Fire 액션 → OnFire로 처리(Send Message 방식 포함)
- 발판 생성: 오브젝트 풀링(미리 3개 배치 후 timeBetSpawn 간격으로 X=20 위치에 재배치, Y는 minY\~maxY 랜덤)
- 배경: Sky 무한 반복 스크롤(리팩터링 예정)
- 상태관리: GameManager 싱글톤(캐주얼 프로젝트에서는 DontDestroyOnLoad는 필요 시만)

[03/05 데일리 로그 \| Unity Runner]({% endraw %}{% post_url 2026-03-06-daily-log-d74a74e36422 %}{% raw %})
{% endraw %}
