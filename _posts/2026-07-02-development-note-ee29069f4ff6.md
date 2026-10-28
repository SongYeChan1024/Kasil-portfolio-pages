---
title: "코드 변경사항 기록//0702"
date: 2026-07-02 12:00:00 +0900
categories: ["개발 메모", "웹 개발"]
tags: ["Notion 이전", "웹 개발"]
excerpt: "2026-07-02\\_enemy\\_noise\\_system\\_script\\_compare 2026-07- 02\\_enemy\\_noise\\_investigation\\_and\\_aggro 1. 작업 개요 오늘 작업은 적 AI에 청각 기반 조사 흐름을 추가하고, 기존 시야 기반 추적 구조와 "
description: "2026-07-02\\_enemy\\_noise\\_system\\_script\\_compare 2026-07- 02\\_enemy\\_noise\\_investigation\\_and\\_aggro 1. 작업 개요 오늘 작업은 적 AI에 청각 기반 조사 흐름을 추가하고, 기존 시야 기반 추적 구조와 "
published: false
migration_id: "39136532580e80b99667ee29069f4ff6"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-02\_enemy\_noise\_system\_script\_compare]({% endraw %}{% post_url 2026-07-02-development-note-c86f981b49f8 %}{% raw %})

# 2026-07-   02\_enemy\_noise\_investigation\_and\_aggro

## 1. 작업 개요

오늘 작업은 적 AI에 청각 기반 조사 흐름을 추가하고, 기존 시야 기반 추적 구조와 자연스럽게 연결하는 데 목적이 있다. 이전까지는 적이 플레이어를 직접 시야로 인식했을 때만 상태가 바뀌는 구조에 가까웠고, 플레이어 이동이나 상자 상호작용, 사격 같은 외부 자극을 듣고 해당 위치를 조사하는 흐름은 프로젝트 내에 공통 시스템으로 정리되어 있지 않았다.

이번 작업에서는 소음 데이터를 공통 형식으로 정의하고, 플레이어 및 상호작용 오브젝트에서 발생한 소음을 중앙에서 수집한 뒤, 적이 이를 받아 조사 상태로 전환하도록 구조를 정리했다. 동시에 한 번 인식한 플레이어는 시야각 밖으로 나가더라도 <code>awarenessRange</code> 안에 있는 동안 계속 추적하도록 보강했고, 이후 실제 SFX와도 연결할 수 있도록 소음 발생 위치를 표현하는 오브젝트 기반 앵커 구조까지 함께 마련했다.

## 2. 상세 작업 내용

### 2.1 노이즈 공통 데이터 및 브로드캐스트 구조 추가

이번 작업에서는 소음 이벤트를 개별 스크립트마다 제각각 처리하지 않고, 공통 시스템으로 받을 수 있도록 <code>NoiseType</code>, <code>NoiseStimulus</code>, <code>NoiseSystem</code>, <code>NoiseManager</code>, <code>GlobalEventBus</code>를 추가 및 확장했다.

<code>NoiseType</code>에는 걷기, 달리기, 총소리, 상자 열기, 스킬, 적 경보음, 피격 반응, 전투 충돌, 디코이 같은 소음 분류를 정의했다. <code>NoiseStimulus</code>는 소음 1건에 대한 실제 전달 단위로, 소음 종류, 위치, 반경, 지속 시간, 우선순위, 추적 강제 여부, 발생 주체, 생성 시간, 앵커 오브젝트 정보를 함께 담도록 구성했다.

<code>NoiseSystem.Emit(...)</code>은 개별 시스템이 소음을 발생시킬 때 호출하는 진입점 역할을 맡고, <code>GlobalEventBus</code>에는 <code>OnNoiseRequested</code>, <code>OnNoiseEmitted</code> 이벤트를 추가해 “소음 요청”과 “최종 확정된 소음”을 분리했다. <code>NoiseManager</code>는 이 요청을 받아 타입별 기본값을 보정하고, 실제 게임 로직에서 사용할 소음 이벤트로 확정한 뒤 모든 적 AI가 수신할 수 있도록 브로드캐스트하는 중앙 허브 역할로 정리했다.

또한 <code>NoiseManager</code>는 씬에 수동 배치하지 않아도 동작할 수 있도록 런타임 자동 생성 구조를 넣어, 이후 씬 구성이 바뀌더라도 노이즈 시스템 자체가 빠져서 작동이 멈추지 않도록 안전장치를 마련했다.

### 2.2 소음 발생 주체 스크립트 연동

소음을 실제로 발생시키는 주체는 우선 <code>PlayerMovement</code>, <code>PlayerWeapon</code>, <code>ItemBox</code> 세 군데를 기준으로 연결했다.

<code>PlayerMovement</code>에서는 이동 입력이 아니라 실제 이동 중일 때만 일정 간격으로 발소음을 발생시키도록 정리했다. 걷기와 달리기를 구분해 각기 다른 반경과 간격을 사용하도록 했고, 현재 테스트 기준 값은 걷기 반경 <code>15</code>, 달리기 반경 <code>20</code>으로 맞췄다. 이를 통해 매 프레임 과도한 소음 이벤트가 쌓이지 않도록 하면서도, 플레이 상태에 따라 적이 청각적으로 반응할 수 있는 기반을 만들었다.

<code>PlayerWeapon</code>에서는 총 발사 시 총구 위치 기준으로 <code>Gunshot</code> 소음을 발생시키도록 연결했다. 총소리는 현재 기본 반경 <code>40</code>으로 설정되어 있어, 시야로 직접 보지 못하더라도 비교적 넓은 영역의 적이 해당 방향을 조사할 수 있는 상태다.

<code>ItemBox</code>에서는 상자를 여는 상호작용 직후 <code>ChestOpen</code> 소음을 발생시키도록 연동했다. 상자 소리는 현재 반경 <code>30</code>, 우선순위 <code>40</code>, 강제 조사 가능 상태로 설정되어 있으며, 일반 발소리보다 높은 중요도의 자극으로 취급된다. 따라서 단순 발소리보다 적을 더 강하게 끌어낼 수 있도록 의도했다.

이 구조 덕분에 이후 플레이어 스킬, 적 괴성, 환경 파손, 함정 작동 같은 다른 시스템도 <code>NoiseSystem.Emit(...)</code>만 호출하면 동일한 흐름으로 쉽게 편입할 수 있는 상태가 되었다.

### 2.3 적 청각 조사 및 어그로 유지 로직 구현

적 AI 쪽에서는 <code>EnemyStatus</code>에 <code>Investigate</code> 상태를 추가하고, <code>EnemyMovement</code> 안에 청각 감지와 조사 흐름을 통합했다.

기존 시야 기반 구조 위에 <code>hearingRange</code>, <code>investigateStopDistance</code>, <code>investigateDuration</code>, <code>forcedInvestigationUntilTime</code>, <code>currentInvestigatePriority</code> 같은 값을 추가해, 적이 소리를 들었을 때 해당 위치로 이동하고 일정 시간 조사하는 흐름을 만들었다. 현재 적 기본값은 <code>sightLength 15</code>, <code>awarenessRange 20</code>, <code>hearingRange 40</code>, <code>sightAngle 120</code>, <code>attackLength 3</code>, <code>attackCooldown 2</code>, <code>checkInterval 0.2</code>로 정리되어 있다.

중요한 점은 이번 작업에서 시야와 청각이 서로 충돌하지 않도록 상태 전환 기준을 분리했다는 점이다. <code>EnemyMovement</code>는 먼저 시야 기준으로 플레이어를 찾고, 현재 추적 중인 플레이어가 <code>awarenessRange</code> 안에 있으면 시야각 밖으로 벗어나더라도 바로 추적을 끊지 않도록 유지한다. 따라서 이전처럼 “한 번 봤다가 시야 부채꼴 밖으로 나가면 즉시 인식이 풀리는” 문제가 줄어들도록 정리했다.

반대로 타겟이 없는 상태에서 청각 범위 안에 소음이 들어오면, 적은 <code>Investigate</code> 상태로 전환되어 마지막으로 들은 위치를 향해 이동한다. 이때 일반 소음 조사 중에 플레이어가 다시 시야에 들어오면 조사 타겟을 정리하고 즉시 플레이어 추적으로 전환되도록 되어 있다.

다만 현재 <code>ChestOpen</code>, <code>Decoy</code>처럼 <code>canInterruptChase = true</code>로 설정된 강제 조사형 소음은 일반 소음보다 더 강한 성격을 가지며, 일정 시간 동안은 시야로 플레이어가 들어와도 바로 재획득하지 않도록 <code>forcedInvestigationUntilTime</code>을 사용해 제어하고 있다. 즉 현재 구조는 “일반 소음은 조사 중 플레이어 발견 시 곧바로 추적 전환, 강제 조사형 소음은 잠시 소음 우선” 흐름으로 정리되어 있다.

또한 소음이 여러 개 겹칠 수 있는 상황을 대비해, 현재 조사 중인 소음보다 낮은 우선순위 자극은 덮어쓰지 않도록 했다. 현재 우선순위는 <code>Walk 5</code>, <code>Run 10</code>, <code>HitReaction 15</code>, <code>CombatImpact 20</code>, <code>Gunshot 30</code>, <code>Skill 35</code>, <code>ChestOpen 40</code>, <code>EnemyAlertCry 45</code>, <code>Decoy 60</code> 순으로 관리되고 있다.

### 2.4 소음 위치 앵커 및 조사 목적지 보정 구조 추가

이번 작업에서는 단순히 좌표만 기억하는 방식이 아니라, 실제 씬 위에 잠시 생성되는 <code>NoiseSourceObject</code>를 소음 위치 앵커로 삼는 구조도 함께 넣었다.

<code>NoiseManager</code>는 소음이 확정되면 <code>NoiseSourceObject</code>를 생성하고, 이 오브젝트의 <code>Transform</code>을 <code>NoiseStimulus</code>에 함께 실어 적 AI에 전달한다. <code>NoiseSourceObject</code>는 현재 디버그 및 앵커 역할이 중심이며, 오디오 소스를 붙여 둘 수 있도록 구성해 두었기 때문에 이후 실제 SFX 재생 지점으로도 확장할 수 있다.

<code>EnemyMovement</code>는 조사 중 이 앵커의 현재 위치를 참조하면서 목적지를 갱신하도록 되어 있다. 동시에 소음 위치가 상자 위, 오브젝트 내부, 바닥이 아닌 지점에 있어도 적이 경로를 잃지 않도록 <code>NavMesh.SamplePosition</code>을 통해 가장 가까운 유효 <code>NavMesh</code> 위치를 조사 목적지로 보정하도록 정리했다. 이를 통해 “소음 오브젝트는 생성되는데 적이 해당 위치로 이동하지 못하는” 상황을 줄이고, 실제 씬에서 더 안정적으로 조사 행동이 나오도록 보강했다.

### 2.5 기본값 및 테스트 반경 조정

이번 단계에서는 시스템 구현뿐 아니라 테스트 체감에 맞춘 기본값 조정도 함께 진행했다.

<code>NoiseManager</code>의 기본 반경은 현재 <code>Walk 15</code>, <code>Run 20</code>, <code>Gunshot 40</code>, <code>ChestOpen 30</code>으로 상향 조정한 상태다. 이전 값은 상대적으로 작아, 적의 <code>hearingRange</code>가 충분해도 실제 반응 반경이 소음 타입 반경에 의해 제한되면서 테스트 체감상 “분명 들릴 것 같은데 안 따라오는” 상황이 발생할 여지가 있었다.

현재 구조에서는 적의 실제 반응 반경이 <code>min(적 hearingRange, 소음 타입 반경)</code> 기준으로 계산되기 때문에, 청각 시스템 자체보다 타입별 반경값이 체감에 더 큰 영향을 줄 수 있다. 이를 보완하기 위해 이번 조정에서는 플레이 테스트 기준으로 먼저 넉넉한 수치로 올려, 적이 소음에 조사 반응을 하는 흐름을 확인하기 쉽도록 맞췄다.

또한 <code>DemoScene</code>에 이미 저장되어 있던 <code>NoiseManager</code> 직렬화 값과 상자 오브젝트들의 <code>openNoiseRange</code> 값도 함께 갱신해, 코드 기본값과 씬 저장값이 어긋나지 않도록 정리했다.

## 3. 구조 정리 및 반영 방향

이번 작업은 단순히 “상자 열면 적이 온다” 수준의 단발 구현이 아니라, 프로젝트 전체에서 재사용 가능한 소음 자극 계층을 만드는 방향으로 진행했다.

역할 분리는 다음과 같이 정리된다. <code>PlayerMovement</code>, <code>PlayerWeapon</code>, <code>ItemBox</code>는 소음을 발생시키는 주체이고, <code>NoiseSystem</code>은 공통 발행 인터페이스, <code>GlobalEventBus</code>는 이벤트 통로, <code>NoiseManager</code>는 소음 데이터 정규화 및 확정 처리, <code>NoiseSourceObject</code>는 씬상의 위치 앵커, <code>EnemyMovement</code>는 실제 청각 반응과 상태 전환 담당이다.

이 구조 덕분에 나중에 실제 사운드 매니저를 붙이거나, 적 울음소리와 환경 소음, 플레이어 스킬 소음을 추가할 때도 기존 적 AI 로직을 다시 뜯지 않고, 소음 발생 주체만 같은 규약으로 연결하면 된다. 또한 적 AI 입장에서도 “누가 냈는가”보다 “어떤 자극이 어느 위치에서 어떤 중요도로 발생했는가”를 기준으로 판단하도록 정리되어 있어, 확장 시 유지보수성이 좋은 편이다.

## 4. 검증 결과

현재 코드 기준으로는 <code>NoiseType</code>, <code>NoiseStimulus</code>, <code>NoiseSystem</code>, <code>NoiseManager</code>, <code>NoiseSourceObject</code>, <code>EnemyMovement</code>, <code>EnemyStatus</code>, <code>PlayerMovement</code>, <code>PlayerWeapon</code>, <code>ItemBox</code> 사이의 연결이 모두 반영된 상태를 확인했다. 또한 <code>NoiseManager</code>의 기본 반경값, <code>DemoScene</code> 저장값, 상자 소음 반경값까지 현재 테스트 수치에 맞게 정리되어 있다.

추가로 <code>Assembly-CSharp.csproj</code> 기준 <code>dotnet build</code>를 수행했을 때 컴파일 오류 없이 빌드가 통과하는 것을 확인했다. 다만 일부 기존 경고는 그대로 남아 있으며, 이는 이번 노이즈 시스템 변경으로 새롭게 발생한 컴파일 오류는 아니라는 점도 함께 확인했다.

반면 Unity 에디터 기준 실제 플레이 체감 검증은 아직 별도로 충분히 누적되지 않았다. 따라서 현재 반경값에서 적이 어느 거리부터 너무 민감하거나 둔하게 반응하는지, 상자 소음의 강제 조사 성격이 실제 전투 템포에 맞는지, 여러 적이 동시에 같은 소음을 조사할 때 자연스럽게 흩어지는지는 추가 플레이 테스트가 필요하다.

## 5. 결과 및 정리

이번 작업을 통해 적 AI는 기존 시야 기반 추적 구조에 더해, 공통 노이즈 시스템을 통해 외부 자극을 듣고 조사할 수 있는 단계까지 확장되었다. 단순히 발소리나 상자 상호작용을 개별 예외 처리한 것이 아니라, 모든 소음을 공통 데이터로 통합하고 적이 이를 받아 상태를 전환하도록 만든 것이 핵심이다.

동시에 한 번 인식한 플레이어를 <code>awarenessRange</code> 안에서 계속 추적하도록 보완해, 시야각과 추적 유지가 서로 분리된 인식 흐름도 정리했다. 그 결과 적은 이제 “직접 보이면 추적, 놓쳐도 인지 범위 안이면 계속 압박, 보이지 않아도 소리를 들으면 조사”하는 다층 구조를 갖추게 되었다.

또한 <code>NoiseSourceObject</code> 기반의 앵커 구조를 추가해 두었기 때문에, 이후 실제 오디오 재생 위치와 AI 조사 위치를 같은 오브젝트로 묶는 확장도 가능한 상태가 되었다. 즉 이번 작업은 단순 버그 수정이 아니라, 적 지각 시스템을 시각과 청각 양쪽으로 확장할 수 있는 기반을 세운 작업으로 보는 것이 맞다.

## 6. 후속 작업 계획

다음 단계에서는 먼저 Unity 플레이 테스트를 통해 현재 반경값과 조사 시간이 적절한지 조정할 필요가 있다. 특히 걷기 <code>15</code>, 달리기 <code>20</code>, 상자 <code>30</code>, 총소리 <code>40</code>이 실제 맵 크기와 전투 템포에 비해 과한지 부족한지 확인해야 한다.

또한 현재 <code>ChestOpen</code>이 강제 조사형 소음처럼 동작하고 있기 때문에, 상자 소음을 정말 디코이 계열로 유지할지, 아니면 조사 도중 플레이어를 보면 즉시 추적으로 전환되는 일반 조사형으로 바꿀지도 기획 기준에 맞춰 결정할 필요가 있다.

이후 확장 방향으로는 플레이어 스킬, 적 괴성, 환경 파괴, 피격 반응 등 다른 상황에도 동일한 소음 시스템을 붙이는 작업이 가능하다. 필요하다면 장기적으로는 <code>EnemyMovement</code> 안에 통합된 청각/시야 로직을 <code>EnemyBrain</code>, <code>Perception</code>, <code>Investigation</code> 같은 책임 단위로 분리해 더 큰 AI 구조로 확장하는 것도 고려할 수 있다.
{% endraw %}
