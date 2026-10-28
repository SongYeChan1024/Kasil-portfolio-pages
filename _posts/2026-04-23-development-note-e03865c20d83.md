---
title: "체스리스트"
date: 2026-04-23 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "Ep3\\_2Manager.cs (line 39) 기준으로 useTopDownRhythmPuzzle는 켜져 있어. Ep3\\_2\\_Scene.unity (line 3091)에 Ep3\\_2TopDownRhythmPuzzle 컴포넌트도 이미 붙여뒀어. startPuzzleController와 "
description: "Ep3\\_2Manager.cs (line 39) 기준으로 useTopDownRhythmPuzzle는 켜져 있어. Ep3\\_2\\_Scene.unity (line 3091)에 Ep3\\_2TopDownRhythmPuzzle 컴포넌트도 이미 붙여뒀어. startPuzzleController와 "
published: true
migration_id: "35e36532580e810c90f2e03865c20d83"
migration_status: "published"
migration_flags: []
---

{% raw %}
- [ ] Ep3\_2Manager.cs (line 39) 기준으로 useTopDownRhythmPuzzle는 켜져 있어.
- [ ] Ep3\_2\_Scene.unity (line 3091)에 Ep3\_2TopDownRhythmPuzzle 컴포넌트도 이미 붙여뒀어.
- [ ] startPuzzleController와 puzzleReferenceTransform도 메트로놈 기준으로 연결돼 있어.

## 이제 씬에서 해야 할 체크리스트

- [ ] Metronome 오브젝트 아래에 빈 오브젝트 2개를 만들어.
- [ ] 이름은 JudgeCenterAnchor, PlayerHoldPoint로 두면 돼.
- [ ] JudgeCenterAnchor 추천 로컬 위치: (0, 0.5, 8)
- [ ] PlayerHoldPoint 추천 로컬 위치: (0, 0.2, 4)
- [ ] 둘 다 로컬 회전은 (0, 0, 0)으로 두면 돼.
- [ ] Ep3-2Manager 오브젝트를 선택해서 Ep3\_2TopDownRhythmPuzzle 컴포넌트를 연다.
- [ ] judgeCenterAnchor 슬롯에 방금 만든 JudgeCenterAnchor를 넣는다.
- [ ] playerHoldPoint 슬롯에 PlayerHoldPoint를 넣는다.

## 프리팹 세팅

- [ ] noteVisualPrefab 하나 필요해.
- [ ] 가장 쉬운 건 기존 발판 복제본을 쓰는 거야.
- [ ] 노트용 프리팹 후보 정하기:
  - [ ] Platform\_Small\_B.prefab
  - [ ] Platform\_Small\_G.prefab
  - [ ] Platform\_Small\_P.prefab
- [ ] lanePadPrefab은 판정 바닥용이라 조금 더 큰 게 좋아.
- [ ] 레인 패드 프리팹 후보 정하기:
  - [ ] Platform\_B.prefab
  - [ ] Platform\_Big\_B.prefab
- [ ] 프리팹은 그대로 넣어도 돼. 노트 생성 시 콜라이더는 코드에서 꺼줘.

## 추천 인스펙터 값

- [ ] laneSpacing = 3
- [ ] laneForwardSpacing = 2.6
- [ ] noteTravelDistance = 22
- [ ] cameraHeight = 22
- [ ] cameraDistance = 2.5

## 테스트 순서

- [ ] 3-2 씬 실행
- [ ] 메트로놈 상호작용
- [ ] 플레이어가 PlayerHoldPoint로 이동하는지 확인
- [ ] 카메라가 탑다운으로 바뀌는지 확인
- [ ] A/W/S/D 4레인 패드가 제대로 보이는지 확인
- [ ] 노트가 한 번에 하나씩 내려오는지 확인

## 지금 바로 다음으로 하면 좋은 것

- [ ] 노트용 프리팹 1개 만들기
- [ ] 레인 패드용 프리팹 1개 정하기
- [ ] 앵커 2개 배치하기
{% endraw %}
