---
title: "코드 변경 사항 기록//0723"
date: 2026-07-23 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "1. 한 줄 결론 2026-07-23에는 적이 소음을 인식한 뒤 추적 대상을 잃으면 소리 위치를 탐색하도록 보완하고, 소음 범위·청각 차폐·플레이어 이동 소음을 조정했습니다. 2. 기록 범위 작성자 기준: SongYeChan1024 직접 커밋만 포함 기준 커밋: be4d82f — 에너미"
description: "1. 한 줄 결론 2026-07-23에는 적이 소음을 인식한 뒤 추적 대상을 잃으면 소리 위치를 탐색하도록 보완하고, 소음 범위·청각 차폐·플레이어 이동 소음을 조정했습니다. 2. 기록 범위 작성자 기준: SongYeChan1024 직접 커밋만 포함 기준 커밋: be4d82f — 에너미"
published: false
migration_id: "3a636532580e814f9bfae12de7c282cc"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
## 1. 한 줄 결론

2026-07-23에는 적이 소음을 인식한 뒤 추적 대상을 잃으면 소리 위치를 탐색하도록 보완하고, 소음 범위·청각 차폐·플레이어 이동 소음을 조정했습니다.

## 2. 기록 범위

- 작성자 기준: SongYeChan1024 직접 커밋만 포함
- 기준 커밋: <code>be4d82f</code> — 에너미 소음 감지 및 추적 상실 탐색 로직 개선
- 기준 브랜치: 현재 <code>master</code>
- 포함 스크립트: 기존 C# 5개 수정
- 제외: 팀원 커밋, 병합 커밋, UI DOTween/Vignette, 심상 기록 이미지, 씬·프리팹 등 비스크립트 자산
- 로컬 미커밋 변경: 폰트 에셋과 ProBuilder 설정 2건. 본 기록에서 제외

## 3. 변경 요약

### 3-1. 소음 범위 밸런스

- 걷기, 달리기, 총성, 상자 열기, 스킬, 적 경보음, 전투 충격, 미끼 등의 기본 소음 반경을 조정했습니다.
- 소리의 영향 범위를 기획 밸런스에 맞게 재정리했습니다.

### 3-2. 적 청각과 차폐

- 적 청각은 적의 청각 범위와 소음 반경이 겹치는지로 판정합니다.
- 벽/장애물이 적 귀 위치와 소리 위치 사이에 있으면 Linecast로 청각 반응을 막습니다.

### 3-3. 추적 상실 뒤 탐색

- 적이 추적 대상을 잃으면 바로 대기하지 않고, 마지막으로 들은 소음 앵커 위치를 목표로 탐색 상태로 전환할 수 있게 했습니다.
- 소음 앵커가 없거나 유효하지 않으면 기존 대기 흐름을 유지합니다.

### 3-4. 플레이어 이동 소음

- 이동 소음 요청 시 플레이어의 실제 transform을 소음 발생원으로 전달하도록 정리했습니다.

## 4. 직접 수정한 스크립트

- <code>Assets/02_Scripts/Manager/GameSystem/NoiseManager.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyBrain.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyNoiseListener.cs</code>
- <code>Assets/02_Scripts/System/Enemy/EnemyPerception.cs</code>
- <code>Assets/02_Scripts/System/Player/PlayerMovement.cs</code>

## 5. 검증 메모

- Git 커밋과 파일 변경 범위를 정적으로 확인했습니다.
- Unity 컴파일, 씬 로드, 소음 감지/벽 차폐/탐색 전환의 플레이 모드 검증은 별도입니다.

## 6. 전체 스크립트 비교

아래 하위 문서에는 직접 수정한 5개 스크립트만, 이전 전문 → 변경 설명 → 변경 후 전문 순서로 기록합니다.

[2026-07-23 전체 스크립트 비교 정리]({% endraw %}{% post_url 2026-07-23-development-note-c86c8eea85e3 %}{% raw %})
{% endraw %}
