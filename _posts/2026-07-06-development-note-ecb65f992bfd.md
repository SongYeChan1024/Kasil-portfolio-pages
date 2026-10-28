---
title: "코드변경사항 기록//0706"
date: 2026-07-06 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "2026-07-06\\_enemy\\_patrol\\_return\\_scene\\_fix\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 6일 기준 진행한 패트롤 테스트 씬 연동 , 적 감지/체력 UI 오류 수정 , 조사-복귀 로직 개선 , 이탈 지점 기준 복귀 구조화"
description: "2026-07-06\\_enemy\\_patrol\\_return\\_scene\\_fix\\_script\\_compare 1. 문서 개요 이 문서는 2026년 7월 6일 기준 진행한 패트롤 테스트 씬 연동 , 적 감지/체력 UI 오류 수정 , 조사-복귀 로직 개선 , 이탈 지점 기준 복귀 구조화"
published: false
migration_id: "39536532580e8021bf61ecb65f992bfd"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-06\_enemy\_patrol\_return\_scene\_fix\_script\_compare]({% endraw %}{% post_url 2026-07-06-development-note-ce98209b86ab %}{% raw %})

## 1. 문서 개요

이 문서는 2026년 7월 6일 기준 진행한 <code>패트롤 테스트 씬 연동</code>, <code>적 감지/체력 UI 오류 수정</code>, <code>조사-복귀 로직 개선</code>, <code>이탈 지점 기준 복귀 구조화</code>, <code>씬 연결 이슈 대응</code> 작업 내용을 정리한 기록 문서이다.

이번 작업의 목적은 다음과 같았다.

첫째, <code>DemoScene Patrol</code> 씬도 기존 <code>DemoScene</code>과 동일한 인게임 세션으로 인식되도록 정리해, 플레이어 스폰과 적 스폰, 테스트 플레이가 정상적으로 이어지게 만드는 것이었다.

둘째, 적 AI 쪽에서 실제 플레이 감각을 해치던 문제를 수정하는 것이었다. 여기에는 <code>벽 너머 소리에도 반응하는 문제</code>, <code>한 적이 맞으면 모든 적 HP UI가 같이 깎여 보이는 문제</code>, <code>조사 상태가 끝나지 않아 복귀가 지연되는 문제</code>, <code>복귀 시 같은 지점으로 몰리는 문제</code>가 포함되었다.

셋째, 단순히 증상만 막는 것이 아니라 이후 확장이 가능하도록 <code>감지</code>, <code>조사</code>, <code>복귀</code>, <code>개체 식별</code>, <code>UI 갱신</code>의 책임을 조금 더 명확하게 나누는 방향으로 구조를 정리하는 것이었다.

---

## 2. 상세 작업 내용

### 2.1 패트롤 테스트 씬을 인게임 세션으로 연동

기존 <code>GameManager</code>는 <code>DemoScene</code>만 플레이 씬으로 인식하고 있었기 때문에, <code>DemoScene Patrol</code>에서는 씬이 로드되어도 플레이어 스폰과 적 스폰 시작 흐름이 타지 않는 문제가 있었다.

이번 작업에서는 <code>GameManager</code> 내부의 단일 <code>playScene</code> 문자열 구조를 <code>playScenes</code> 배열 구조로 바꾸고, <code>IsPlayScene(string sceneName)</code> 보조 함수를 추가해 <code>DemoScene</code>, <code>DemoScene Patrol</code> 두 씬을 모두 인게임 세션으로 취급하도록 수정했다.

이 변경으로 패트롤 테스트 씬에서도 기존 플레이 흐름을 그대로 사용할 수 있게 되었고, 별도의 임시 테스트 분기 없이도 동일한 진입 구조를 유지할 수 있게 되었다.

### 2.2 적 개체 식별과 HP UI 동기화 문제 수정

기존 구조에서는 적이 스폰될 때 프리팹의 <code>EntityIdentity</code> 값이 그대로 복제될 수 있었고, HP UI 역시 전역 이벤트를 모든 적 UI가 함께 구독하고 있었다. 이 때문에 한 적이 피해를 받아도 다른 적들의 UI까지 같이 갱신되는 문제가 발생했다.

이를 해결하기 위해 <code>SpawnManager</code>에서 적 생성 직후 런타임 고유 ID를 다시 부여하는 <code>AssignEnemyRuntimeIdentity()</code> 흐름을 추가했다. 동시에 <code>EnemyStatus</code>에는 <code>OnLocalHealthChanged</code> 이벤트와 <code>SetRuntimeObjectId()</code> / <code>SyncRuntimeIdentity()</code> 로직을 넣어, 각 적 개체가 자기 자신의 상태와 식별 번호를 안정적으로 유지하도록 정리했다.

<code>EnemyHealthUI</code>는 더 이상 <code>GlobalEventBus.OnEnemyHealthChanged</code>를 직접 구독하지 않고, 자기 부모의 <code>EnemyStatus.OnLocalHealthChanged</code>만 구독하도록 변경했다. 이로 인해 적 HP UI가 개체별로 분리되어, 이제는 맞은 적의 UI만 갱신되도록 구조가 정리되었다.

### 2.3 벽 너머에서도 소리에 반응하던 문제 수정

기존 <code>EnemyPerception</code>의 청각 판정은 사실상 거리 기반이었다. 즉, 소리 반경 안에만 들어오면 벽이 사이에 있어도 적이 그대로 조사 상태로 들어갈 수 있었다.

이번 작업에서는 <code>EnemyPerception</code>에 <code>requireLineOfHearing</code>, <code>hearingObstacleMask</code>, <code>soundSampleHeight</code>를 추가하고, <code>CanHear()</code> 내부에 <code>Physics.Linecast</code> 기반의 차단 판정을 넣었다. 이로써 적의 귀 위치와 소리 위치 사이에 벽 레이어가 존재하면 소리를 듣지 못하도록 보정했다.

또한 인스펙터에서 장애물 마스크가 비어 있을 경우를 대비해, 프로젝트의 <code>Wall</code> 레이어를 기본 차단 레이어로 사용하는 보정 로직도 함께 넣었다. 덕분에 프리팹을 전부 다시 세팅하지 않아도 기본적인 벽 차단 판정이 먼저 동작할 수 있게 되었다.

### 2.4 조사 상태가 끝나지 않아 복귀하지 않던 문제 수정

기존 <code>EnemyNoiseListener</code> 구조에서는 적이 조사 지점에 실제로 도착해야만 <code>investigateDuration</code> 대기 타이머가 시작되었다. 따라서 조사 지점까지 도달하지 못하면 조사 상태가 길게 유지되고, 결과적으로 복귀 로직도 늦어지는 문제가 있었다.

이를 해결하기 위해 <code>EnemyNoiseListener</code>에 <code>maxInvestigateMoveTime</code>과 <code>investigateMoveEndTime</code>을 추가했다. 이제 적은 조사 지점에 도달하지 못하더라도, 일정 시간 이상 조사 이동이 지속되면 조사 상태를 종료하고 복귀 로직으로 넘겨진다.

즉, 조사 로직이 이제 두 단계로 나뉘었다.

- 조사 지점까지 이동을 시도하는 제한 시간
- 도착 후 제자리에서 주변을 살피는 조사 대기 시간

이 구조를 통해 조사 실패 시에도 AI가 무기한 같은 흐름에 머물지 않고, 다시 순찰 루프로 돌아갈 수 있게 되었다.

### 2.5 복귀 시 같은 포인트로 몰리던 문제 수정

기존 복귀 구조에서 적은 <code>현재 patrolIndex가 가리키는 순찰 포인트</code>로 복귀하고 있었다. 이 방식은 여러 적이 같은 순찰 루트나 같은 인덱스를 공유할 경우, 어그로가 풀린 뒤 모두 같은 포인트로 모이는 현상을 만들었다.

이번 작업에서는 복귀 기준을 <code>공유된 순찰 포인트</code>에서 <code>순찰에서 이탈한 시작 지점</code>으로 변경했다.

이를 위해 <code>EnemyMemory</code>에 다음 정보를 추가했다.

- <code>hasReturnAnchor</code>
- <code>returnAnchorPosition</code>
- <code>returnPatrolIndex</code>

<code>EnemyBrain</code>은 플레이어를 처음 다시 보거나, <code>EnemyMovement</code>가 소리에 처음 반응할 때 <code>CaptureReturnAnchor()</code>를 호출해 “순찰에서 처음 벗어난 위치”와 “당시 순찰 인덱스”를 저장하도록 수정되었다.

이후 복귀 단계에서는 <code>GetCurrentPatrolPoint()</code> 대신 <code>ReturnAnchorPosition</code>을 목적지로 사용하고, 복귀 완료 시 <code>CompleteReturnToPatrol()</code>을 통해 이탈 직전의 <code>returnPatrolIndex</code>를 복원한 뒤 기본 순찰 흐름으로 다시 이어가도록 정리했다.

이로써 적이 모두 같은 순찰 포인트로 뭉치는 것이 아니라, 각자 이탈했던 자리로 돌아온 뒤 자연스럽게 자기 순찰을 재개하는 구조가 되었다.

### 2.6 ExitPoint 타이머 UI 누락 이슈 대응

씬 병합 과정에서 <code>ExitPoint.timerCanvas</code> 참조가 빠지면 <code>UnassignedReferenceException</code>이 발생할 수 있었다. 특히 패트롤 테스트 씬처럼 씬 오브젝트 연결이 잦은 환경에서는 이 문제가 자주 드러날 가능성이 있었다.

이번 작업에서는 <code>ExitPoint</code>에 <code>ResolveTimerCanvasReference()</code>와 <code>SetTimerCanvasActive()</code> 보조 흐름을 넣어, 자식 <code>EscapeTimer</code>를 자동 탐색하고 null-safe 방식으로 타이머 UI를 제어하도록 보완했다.

이 수정은 P0.5 이전 테스트 단계에서 씬 연결 누락 때문에 플레이가 막히는 상황을 줄이기 위한 보정 성격이 강하며, 이후 정식 씬에서는 여전히 인스펙터 연결을 명시적으로 맞추는 것이 바람직하다.

### 2.7 프리팹과 테스트 수치 조정

<code>Enemy-DarkSpirit.prefab</code> 쪽에서는 청각/시야/이동 속도와 조사 이동 시간 관련 값이 현재 테스트 구조에 맞게 조정되었다.

주요 조정 방향은 다음과 같다.

- <code>awarenessRange</code> 축소
- <code>hearingRange</code> 축소
- <code>sightAngle</code> 축소
- <code>moveSpeed</code> 조정
- <code>maxInvestigateMoveTime</code> 추가
- 청각 차단 관련 옵션 추가

또한 <code>testCharacter.asset</code>의 이동 관련 수치도 현재 패트롤/전투 테스트 체감에 맞춰 함께 조정되었다.

---

## 3. 구조 정리 및 반영 방향

이번 작업을 통해 적 AI 관련 흐름은 이전보다 다음과 같이 역할이 분리되었다.

- <code>GameManager</code>
  - 어떤 씬을 실제 플레이 세션으로 취급할지 결정
- <code>SpawnManager</code>
  - 플레이어/적 스폰 시작
  - 적 런타임 고유 ID 부여
- <code>EnemyPerception</code>
  - 시야 판정
  - 청각 판정
  - 벽 차단 포함 청각 보정
- <code>EnemyNoiseListener</code>
  - 조사 타깃 등록
  - 조사 유지 시간
  - 조사 이동 제한 시간
- <code>EnemyMemory</code>
  - 순찰 루트와 현재 인덱스 저장
  - 복귀 필요 여부 저장
  - 이탈 시작 지점과 복귀 인덱스 저장
- <code>EnemyBrain</code>
  - 추적, 조사, 복귀, 순찰 상태 전이 결정
- <code>EnemyStatus</code>
  - 체력, 사망, 런타임 식별자 유지
  - 개별 HP UI용 로컬 이벤트 발행
- <code>EnemyHealthUI</code>
  - 자기 부모 적 상태만 구독해 UI 갱신

이 구조의 핵심은 “복귀 기준점”, “조사 종료 조건”, “UI 개체 식별” 같은 문제를 각각 해당 책임 위치에서 해결하도록 바꿨다는 점이다. 즉, <code>EnemyBrain</code> 하나에 규칙을 계속 누적하는 방식보다, 기억은 <code>EnemyMemory</code>, 조사 시간은 <code>EnemyNoiseListener</code>, 감지는 <code>EnemyPerception</code>이 맡도록 역할 경계를 조금 더 명확하게 만든 것이다.

---

## 4. 검증 결과

현재 확인된 반영 결과는 다음과 같다.

- <code>dotnet build Assembly-CSharp.csproj</code> 기준으로 빌드는 <code>오류 0</code>으로 통과했다.
- 기존 경고는 일부 남아 있으나, 이번 수정으로 인한 신규 컴파일 오류는 확인되지 않았다.
- <code>DemoScene Patrol</code> 씬을 인게임 세션으로 인식하도록 한 변경은 코드상 반영되었다.
- 적 HP UI는 개별 <code>EnemyStatus</code> 로컬 이벤트 기반으로 갱신되도록 구조가 바뀌었다.
- 청각 판정은 거리뿐 아니라 벽 차단 여부까지 확인하도록 수정되었다.
- 조사 지점에 도달하지 못해도 일정 시간 후 복귀 흐름으로 넘어가도록 수정되었다.
- 복귀 목적지가 공유 순찰 포인트가 아니라 이탈 시작 지점으로 바뀌었다.

다만 실제 Unity 플레이 기준의 체감 검증은 추가로 필요하다. 특히 다음 항목은 플레이 테스트를 통해 계속 조정해야 한다.

- 조사 이동 제한 시간 체감
- 복귀 지점 도착 후 순찰 재개 타이밍
- 벽 차단 청각이 실제 맵 레이어 구조와 잘 맞는지 여부
- 패트롤 씬에서 각 적의 루트 배치와 복귀 동선 자연스러움

---

## 5. 결과 및 정리

이번 작업의 핵심 성과는 단순한 버그 제거를 넘어, 패트롤 테스트 씬과 적 AI 운용 구조를 실제 게임 흐름에 더 가깝게 정리했다는 점이다.

이번에 해결한 주요 트러블 이슈는 다음과 같이 정리할 수 있다.

- <code>DemoScene Patrol</code>에서 플레이어가 스폰되지 않던 문제
  <p>
  원인: <code>GameManager</code>가 <code>DemoScene</code>만 플레이 씬으로 인식
  </p>

  <p>
  해결: 플레이 씬 판정 함수를 추가해 패트롤 씬도 인게임 세션으로 처리
  </p>
- 벽 너머 총성/노이즈에도 적이 반응하던 문제
  <p>
  원인: 청각 판정이 거리 기반만 사용
  </p>

  <p>
  해결: <code>Linecast</code> 기반 벽 차단 판정 추가
  </p>
- 한 적이 맞으면 모든 적 HP UI가 같이 갱신되던 문제
  <p>
  원인: 모든 UI가 같은 전역 체력 이벤트를 공동 구독
  </p>

  <p>
  해결: <code>EnemyStatus</code> 로컬 이벤트 기반으로 분리
  </p>
- 조사 지점에 못 가면 복귀가 늦어지던 문제
  <p>
  원인: 조사 대기 타이머가 “도착 후”에만 시작
  </p>

  <p>
  해결: 조사 이동 제한 시간 추가
  </p>
- 어그로가 풀리면 적이 한 지점에 뭉치던 문제
  <p>
  원인: 복귀 목적지가 공유 순찰 포인트였음
  </p>

  <p>
  해결: 순찰 이탈 시작 지점을 복귀 앵커로 저장하도록 구조 변경
  </p>
- <code>ExitPoint.timerCanvas</code> 누락 시 예외가 발생하던 문제
  <p>
  원인: 씬 연결 누락에 대한 방어 로직 부재
  </p>

  <p>
  해결: 자동 탐색 및 null-safe 보조 로직 추가
  </p>

즉, 이번 작업은 “패트롤 테스트 씬을 실제 테스트 가능한 상태로 만들고”, “적 AI의 조사-복귀 흐름을 더 자연스럽게 바꾸고”, “개체별 UI 및 감지 판정을 실제 의도에 맞게 정리한 작업”으로 요약할 수 있다.

---

## 6. 후속 작업 계획

다음 단계에서는 현재 정리된 구조를 기준으로 실제 플레이 체감을 다듬는 작업이 필요하다.

- <code>Return</code> 상태를 시각적으로 구분할지 여부 결정
- 복귀 후 잠깐 멈출지, 바로 순찰을 이어갈지 세부 연출 조정
- <code>stuck</code> 판정 추가 여부 검토
- 패트롤 루트와 스폰 포인트 배치가 실제 복귀 흐름과 잘 맞는지 씬 단위 점검
- <code>Wall</code> 레이어 외 추가 차단 레이어가 필요한지 확인
- <code>ExitPoint</code> 타이머 UI를 P0.5 기준 필수 연결로 되돌릴지, 현재 보정 구조를 유지할지 결정
- 이후 <code>먹잇감 차단 이동</code>, <code>루시드 낙인</code>, <code>순찰 고도화</code> 작업을 현재 메모리/브레인 구조 위에서 확장

---

# 2026-07-06\_enemy\_patrol\_return\_scene\_troubleshooting\_restructured

## 1. 문서 개요

이 문서는 2026년 7월 6일 기준 진행한 <code>패트롤 테스트 씬 연동</code>, <code>적 감지/복귀 로직 개선</code>, <code>적 HP UI 개체 분리</code>, <code>벽 차단 청각 보정</code>, <code>ExitPoint 타이머 예외 대응</code> 작업을

<code>이전 구조 -&gt; 문제점 -&gt; 수정 구조 -&gt; 해결 결과</code> 순서로 다시 정리한 문서이다.

이번 재정리의 목적은 “무엇을 왜 바꿨는지”를 코드 구조 기준으로 더 명확히 남기는 데 있다.

---

## 2. 항목별 재정리

### 2.1 패트롤 테스트 씬 인게임 세션 연동

<b>이전 구조</b>

<code>GameManager</code>는 <code>DemoScene</code>만 플레이 씬으로 인식하고 있었다.

즉, 인게임 진입 조건이 사실상 단일 씬 이름 비교에 묶여 있었다.

<b>문제점</b>

<code>DemoScene Patrol</code>에서는 씬이 로드되어도 플레이어 스폰, 적 스폰, 테스트 플레이 시작 흐름이 정상적으로 실행되지 않았다.

코드는 살아 있었지만, “이 씬도 실제 플레이 씬인가?”라는 판정에서 빠지고 있었던 것이다.

<b>수정 구조</b>

<code>playScene</code> 단일 문자열 구조를 <code>playScenes</code> 배열 구조로 바꾸고, <code>IsPlayScene(string sceneName)</code> 보조 함수를 추가했다.

이제 <code>DemoScene</code>, <code>DemoScene Patrol</code> 두 씬을 모두 동일한 인게임 세션으로 처리한다.

<b>해결 결과</b>

패트롤 테스트 씬에서도 기존 게임 시작 흐름이 그대로 동작할 수 있게 되었고, 별도 테스트용 임시 분기 없이도 플레이어/적 스폰 구조를 유지할 수 있게 되었다.

---

### 2.2 적 HP UI와 적 개체 식별 동기화

<b>이전 구조</b>

적 HP UI는 전역 이벤트를 여러 적 UI가 함께 구독하는 구조였다.

또한 적 스폰 시 프리팹 식별 값이 그대로 복제될 수 있어 개체별 식별이 완전히 분리되지 않을 가능성이 있었다.

<b>문제점</b>

한 적이 맞아도 다른 적 HP UI까지 같이 갱신되는 문제가 발생했다.

즉, 체력 값 자체보다 “누가 맞았는지”를 구분하는 식별 흐름이 약했다.

<b>수정 구조</b>

<code>SpawnManager</code>에서 적 생성 직후 런타임 고유 ID를 다시 부여하도록 수정했다.

<code>EnemyStatus</code>에는 <code>OnLocalHealthChanged</code>, <code>SetRuntimeObjectId()</code>, <code>SyncRuntimeIdentity()</code>를 추가했고, <code>EnemyHealthUI</code>는 전역 이벤트 대신 자기 부모 <code>EnemyStatus</code>의 로컬 이벤트만 구독하도록 바꿨다.

<b>해결 결과</b>

이제 각 적은 자기 고유 ID를 가지며, HP UI도 자기 자신에게 연결된 체력 이벤트만 반영한다.

따라서 한 적이 맞았을 때 그 적의 UI만 정상적으로 갱신되는 구조가 되었다.

---

### 2.3 벽 너머 소리 감지 문제

<b>이전 구조</b>

<code>EnemyPerception</code>의 청각 판정은 거의 거리 중심이었다.

소리 반경 안에만 들어오면 적이 조사 상태로 반응할 수 있었다.

<b>문제점</b>

벽 너머 총성이나 노이즈 오브젝트에도 적이 그대로 반응했다.

즉, 실제 공간 차단이 있는데도 청각 로직은 그것을 고려하지 못했다.

<b>수정 구조</b>

<code>EnemyPerception</code>에 <code>requireLineOfHearing</code>, <code>hearingObstacleMask</code>, <code>soundSampleHeight</code>를 추가했다.

<code>CanHear()</code> 내부에는 <code>Physics.Linecast</code> 기반 차단 판정을 넣었고, 마스크가 비어 있으면 <code>Wall</code> 레이어를 기본 차단물로 사용하는 보정도 추가했다.

<b>해결 결과</b>

이제 적은 소리가 가까워도 벽이 사이에 있으면 무조건 듣는 것이 아니라, 차단 판정을 통과한 경우에만 조사 상태로 진입한다.

기존 거리 기반 청각에서 “거리 + 공간 차단” 구조로 개선되었다.

---

### 2.4 조사 상태가 끝나지 않아 복귀가 지연되던 문제

<b>이전 구조</b>

적은 조사 지점에 도착해야만 <code>investigateDuration</code> 대기 시간이 시작되었다.

즉, 조사 로직의 종료 조건이 “도착 후 대기 종료” 하나에 강하게 묶여 있었다.

<b>문제점</b>

조사 지점까지 못 가면 조사 상태가 길게 유지될 수 있었고, 그만큼 복귀 로직도 늦어졌다.

플레이어 입장에서는 “조사는 하는데 복귀를 안 하는 것처럼 보이는” 상황이 만들어졌다.

<b>수정 구조</b>

<code>EnemyNoiseListener</code>에 <code>maxInvestigateMoveTime</code>과 <code>investigateMoveEndTime</code>을 추가해, 조사 지점으로 이동하는 시간 자체에 제한을 두었다.

즉, 조사 흐름을 <code>도착 전 이동 제한 시간</code>과 <code>도착 후 조사 대기 시간</code> 두 단계로 분리했다.

<b>해결 결과</b>

적이 조사 지점에 도착하지 못해도 일정 시간이 지나면 조사 상태를 종료하고 복귀 흐름으로 넘어간다.

이제 조사 실패가 무기한 끌리지 않고, 순찰 AI가 다시 정상 루프로 돌아올 수 있게 되었다.

---

### 2.5 적이 복귀할 때 같은 지점으로 뭉치던 문제

<b>이전 구조</b>

복귀 목적지는 <code>현재 patrolIndex가 가리키는 순찰 포인트</code>였다.

즉, 복귀 기준이 개별 적의 이탈 위치가 아니라 공유된 순찰 루트 포인트였다.

<b>문제점</b>

여러 적이 같은 루트나 같은 순찰 인덱스를 공유하면, 어그로가 풀린 뒤 모두 같은 지점으로 돌아와 뭉치는 현상이 발생했다.

이것은 복귀 기준이 “공유 포인트”이기 때문에 생기는 구조적 문제였다.

<b>수정 구조</b>

<code>EnemyMemory</code>에 <code>hasReturnAnchor</code>, <code>returnAnchorPosition</code>, <code>returnPatrolIndex</code>를 추가했다.

적이 플레이어를 처음 인식하거나 소리에 처음 반응하는 순간 <code>CaptureReturnAnchor()</code>로 이탈 시작 위치와 당시 순찰 인덱스를 저장하고,

복귀 시에는 <code>GetCurrentPatrolPoint()</code>가 아니라 <code>ReturnAnchorPosition</code>으로 돌아가도록 <code>EnemyBrain</code>을 수정했다.

복귀 완료 시에는 <code>CompleteReturnToPatrol()</code>로 저장된 순찰 인덱스를 복원한다.

<b>해결 결과</b>

이제 적은 공유된 순찰 포인트가 아니라, 각자 순찰에서 벗어났던 시작 지점으로 복귀한다.

그 후 이탈 직전 순찰 인덱스를 기준으로 다시 순찰을 이어가기 때문에, 이전보다 훨씬 자연스럽고 덜 뭉치는 복귀 흐름이 만들어졌다.

---

### 2.6 플레이어를 다시 봤을 때 복귀 기준점이 사라지던 문제

<b>이전 구조</b>

적이 플레이어를 다시 발견하면 조사/복귀 흐름을 정리하면서 <code>ClearReturnToPatrol()</code>도 같이 호출되었다.

<b>문제점</b>

복귀 자체는 필요했지만, 복귀 기준점까지 같이 지워지면서 “나중에 어디로 돌아가야 하는가”에 대한 정보가 사라질 수 있었다.

즉, 추적 재진입과 복귀 기준점 초기화가 너무 강하게 묶여 있었다.

<b>수정 구조</b>

플레이어를 다시 발견했을 때는 조사 상태만 정리하고, 복귀 기준점은 유지하도록 <code>EnemyBrain</code> 흐름을 조정했다.

또한 “처음 이탈했을 때만” 복귀 기준점을 저장하도록 해 여러 번 덮어쓰지 않게 했다.

<b>해결 결과</b>

적은 추적을 여러 번 반복하더라도, 첫 이탈 지점을 기준으로 안정적으로 복귀할 수 있게 되었다.

복귀 흐름이 더 일관되고 예측 가능해졌다.

---

### 2.7 ExitPoint 타이머 UI 누락 예외

<b>이전 구조</b>

<code>ExitPoint.timerCanvas</code>는 인스펙터에서 반드시 연결되어 있다는 전제로 동작하고 있었다.

<b>문제점</b>

씬 병합이나 테스트 씬 구성 중 참조가 빠지면 <code>UnassignedReferenceException</code>이 발생했다.

이 경우 탈출 타이머 기능이 아니라, 참조 누락 자체가 플레이를 막는 문제가 되었다.

<b>수정 구조</b>

<code>ExitPoint</code>에 <code>ResolveTimerCanvasReference()</code>와 <code>SetTimerCanvasActive()</code>를 추가해,

자식 오브젝트에서 타이머 UI를 자동 탐색하고 null-safe 방식으로 활성화/비활성화를 처리하도록 보완했다.

<b>해결 결과</b>

씬 연결이 일부 빠진 테스트 상황에서도 즉시 예외가 터지지 않고, 참조 보정 또는 안전한 무시가 가능해졌다.

특히 P0.5 테스트 단계에서 씬 연결 누락 때문에 플레이가 완전히 막히는 문제를 줄일 수 있었다.

---

## 3. 최종 정리

이번 작업은 단순한 버그 수정이 아니라, 적 AI의 핵심 흐름을 다음처럼 다시 정리한 작업이었다.

- 씬 진입 판정은 <code>GameManager</code>
- 개체별 스폰 식별은 <code>SpawnManager</code>
- 시야/청각 감지는 <code>EnemyPerception</code>
- 조사 시간 관리는 <code>EnemyNoiseListener</code>
- 순찰 기억과 복귀 기준점은 <code>EnemyMemory</code>
- 상태 전이는 <code>EnemyBrain</code>
- 체력/사망/개체 이벤트는 <code>EnemyStatus</code>
- UI 반영은 <code>EnemyHealthUI</code>

즉, 오늘 작업의 핵심은

“테스트 씬을 실제 플레이 가능한 상태로 맞추고”,

“적 감지와 UI를 개체별로 분리하고”,

“복귀를 공유 포인트가 아닌 개별 이탈 지점 기준으로 바꿔 자연스럽게 만든 것”

으로 정리할 수 있다.
{% endraw %}
