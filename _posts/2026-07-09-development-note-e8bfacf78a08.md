---
title: "코드 변경 사항 기록//0709"
date: 2026-07-09 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "2026-07-09\\_script\\_full\\_compare 2026-07-09 코드 변경 사항 기록 1. 문서 개요 이 문서는 2026년 7월 9일 알파 버전 시연 준비 과정에서 진행한 주요 코드 변경 사항과 디버깅 내용을 정리한 기록이다. 오늘 작업의 핵심은 아티팩트 장착 효과 적용"
description: "2026-07-09\\_script\\_full\\_compare 2026-07-09 코드 변경 사항 기록 1. 문서 개요 이 문서는 2026년 7월 9일 알파 버전 시연 준비 과정에서 진행한 주요 코드 변경 사항과 디버깅 내용을 정리한 기록이다. 오늘 작업의 핵심은 아티팩트 장착 효과 적용"
published: false
migration_id: "39836532580e804db00be8bfacf78a08"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-09\_script\_full\_compare]({% endraw %}{% post_url 2026-07-09-development-note-d7cc8e563411 %}{% raw %})

# 2026-07-09 코드 변경 사항 기록

## 1. 문서 개요

이 문서는 2026년 7월 9일 알파 버전 시연 준비 과정에서 진행한 주요 코드 변경 사항과 디버깅 내용을 정리한 기록이다.

오늘 작업의 핵심은 <b>아티팩트 장착 효과 적용</b>, <b>아이템 툴팁 UI 개선</b>, <b>Addressables 중복 GUID 오류 해결</b>, <b>알파 시연 전 빌드 안정화</b>이다.

---

## 2. 아티팩트 장착 효과 적용

### 변경 목적

기존에는 아티팩트를 장착할 수는 있었지만, 장착된 아티팩트의 효과가 실제 플레이어 스탯이나 게임 시스템에 반영되는 구조가 부족했다.

### 주요 변경 사항

- <code>PlayerArtifactEffectController</code> 추가
- 장착 중인 아티팩트 효과를 합산해 각 시스템에 전달
- 원본 스탯을 직접 수정하지 않고, 아티팩트 보정값만 따로 적용
- 장착/해제 시 효과를 다시 계산하여 중복 누적 방지

### 적용된 효과

| 효과 타입 | 적용 대상 | 설명 |
| --- | --- | --- |
| <code>hpRegen</code> | <code>PlayerStatus</code> | 초당 HP 회복량 증가 |
| <code>mpRegen</code> | <code>PlayerStatus</code> | 초당 MP 회복량 증가 |
| <code>moveSpeedUp</code> | <code>PlayerMovement</code> | 걷기/달리기 이동 속도 증가 |
| <code>timeLimitSpeed</code> | <code>TimeLimitController</code> | 제한 시간 감소 속도 완화 |
| <code>fireSpeedUp</code> | <code>PlayerCombatPresenter</code> | 기본 공격 간격 감소 |
| <code>fireMPDown</code> | <code>PlayerCombatPresenter</code> | 기본 공격 MP 소모량 감소 |

### 변경 결과

아티팩트가 단순 장착 아이템이 아니라 실제 플레이에 영향을 주는 장비 시스템으로 연결되었다.

---

## 3. 아이템 툴팁 UI 구현 및 수정

### 변경 목적

인벤토리, 상자, 아티팩트 장비 슬롯에서 아이템 정보를 확인할 수 있도록 툴팁 UI를 구현했다.

### 주요 변경 사항

- <code>ItemTooltipUI</code> 추가
- 슬롯 호버 시 아이템 이름, 등급, 종류, 설명, 효과, 판매가, 최대 중첩 수 표시
- 인벤토리 슬롯, 상자 슬롯, 아티팩트 장비 슬롯에서 툴팁 호출 가능하도록 연결
- 결과창 각성 보존 슬롯에서 잘못된 인벤토리 인덱스를 참조하던 문제 수정

### 추가 디버깅

툴팁 위치가 PC 환경에 따라 다르게 표시되는 문제가 있었다.

### 원인

툴팁 위치를 UI 좌표계가 아닌 <code>transform.position</code>으로 적용하고 있어, 해상도와 Canvas Scaler 설정에 따라 위치가 다르게 환산되었다.

### 수정

- <code>TooltipPanel</code> 참조를 <code>RectTransform</code>으로 변경
- 위치 적용 방식을 <code>transform.position</code>에서 <code>anchoredPosition</code>으로 변경

### 변경 결과

툴팁 위치가 Canvas 내부 UI 좌표 기준으로 적용되어, 해상도나 Game View 크기에 덜 흔들리도록 개선되었다.

---

## 4. Addressables 중복 GUID 오류 수정

### 발생 문제

Unity 실행 시 다음 오류가 반복 발생했다.

```txt
ArgumentException: An item with the same key has already been added.
```

### 원인

<code>Default Local Group.asset</code> 안에 같은 Addressables GUID가 여러 번 등록되어 있었다.

### 주요 중복 대상

- 아티팩트 아이콘 이미지
- 테스트 드롭 프리팹
- 일부 UI/아이템 리소스

### 수정 내용

- 실제 에셋 파일은 삭제하지 않음
- Addressables 그룹 안의 중복 등록 엔트리만 제거
- 동일 GUID는 최신 엔트리 1개만 남기도록 정리

### 변경 결과

Addressables 초기화 과정에서 발생하던 Dictionary 중복 key 오류를 해결했다.

---

## 5. 탈출 실패 시 아티팩트 소멸 처리

### 변경 목적

탈출 실패 또는 강제 각성 시 일반 인벤토리 아이템뿐 아니라 장착 중인 아티팩트도 세션 결과에 맞게 처리되어야 했다.

### 주요 변경 사항

- <code>ResultManager</code>에서 아티팩트 장착 상태를 함께 정산하도록 수정
- 탈출 실패 시 장착 중인 아티팩트도 소멸 처리
- <code>PlayerArtifactEquipment</code> 접근 구조 일부 정리

### 변경 결과

아티팩트를 장착한 채로 세션을 종료했을 때, 결과 처리 규칙과 실제 아이템 보존/소멸 흐름이 맞게 되었다.

---

## 6. 알파 시연 전 UI 및 씬 안정화

### 주요 변경 사항

- 게임 시작 시 불러오는 씬 연결 수정
- 로비 UI 및 결과창 UI 변경 사항 반영
- 아이템/아티팩트 아이콘 리소스 경로 정리
- Addressables 경로 문제 수정
- 알파 빌드 전 UI 프리팹 변경 사항 반영

### 변경 결과

알파 시연용 빌드에서 필요한 UI와 리소스 참조 흐름을 정리했다.
{% endraw %}
