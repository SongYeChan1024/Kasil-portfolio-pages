---
title: "2026-07-15_tutorial_scene_flow_code_analysis"
date: 2026-07-15 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "이 문서는 2026-07-15 튜토리얼 씬 구축 작업에서 변경된 주요 코드의 역할과 흐름을 학습용으로 정리한 전체 코드 분석 문서이다. 각 항목은 이전 구조 → 변경 이유 → 현재 구조 → 확인 포인트 순서로 기록한다. 1. 전체 아키텍처 요약 이번 튜토리얼 시스템은 크게 네 층으로 나"
description: "이 문서는 2026-07-15 튜토리얼 씬 구축 작업에서 변경된 주요 코드의 역할과 흐름을 학습용으로 정리한 전체 코드 분석 문서이다. 각 항목은 이전 구조 → 변경 이유 → 현재 구조 → 확인 포인트 순서로 기록한다. 1. 전체 아키텍처 요약 이번 튜토리얼 시스템은 크게 네 층으로 나"
published: true
migration_id: "39e36532580e8153aaa8ef91da36f944"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
이 문서는 2026-07-15 튜토리얼 씬 구축 작업에서 변경된 주요 코드의 역할과 흐름을 학습용으로 정리한 전체 코드 분석 문서이다. 각 항목은 이전 구조 → 변경 이유 → 현재 구조 → 확인 포인트 순서로 기록한다.


# 1. 전체 아키텍처 요약

이번 튜토리얼 시스템은 크게 네 층으로 나뉜다.

```txt
IntroSceneController
→ SceneController
→ TutorialScene + DemoScene Tutorial Additive
→ TutorialManager
→ TutorialGuide.json / TutorialTrigger / GlobalEventBus
→ TutorialPopup
```

- <code>IntroSceneController</code>는 튜토리얼에 들어갈지 결정한다.
- <code>SceneController</code>는 튜토리얼 메인 씬과 Additive 씬을 로드한다.
- <code>TutorialManager</code>는 튜토리얼 데이터, 조건, 팝업 출력, 이벤트 흐름을 중앙에서 관리한다.
- <code>TutorialGuide.json</code>은 안내 문구와 열림/클리어 조건을 가진다.
- <code>TutorialTrigger</code>는 콜라이더 진입을 튜토리얼 조건으로 전달한다.
- <code>TutorialEventBridge</code>와 <code>TutorialManager</code>의 이벤트 구독은 상자 열림, 적 처치, 탈출 성공 같은 이벤트형 조건을 연결한다.
- <code>TutorialPopup</code>은 실제 메시지 UI를 표시한다.

# 2. 핵심 흐름

## 2.1 최초 진입 흐름

```txt
IntroSceneController.StartLobbySceneTransition()
→ ShouldEnterTutorialScene()
→ useTutorialScene 확인
→ SaveFile.json의 isTutorialCompleted 확인
→ 튜토리얼 필요 시 SceneController.GoToTutorialScene()
→ TutorialScene + DemoScene Tutorial 로드
```

## 2.2 콜라이더 안내 흐름

```txt
Player enters TutorialTrigger
→ TutorialTrigger.OnTriggerEnter()
→ TutorialManager.NotifyTriggerEnter(triggerValue)
→ TutorialGuide.json에서 OpenConditionType/Value 매칭
→ TutorialPopup.Show()
```

## 2.3 상자 이벤트 안내 흐름

```txt
Player opens ItemBox
→ GlobalEventBus.OnItemBoxOpened
→ TutorialManager.HandleItemBoxOpened()
→ NotifyEvent("ItemBoxOpened")
→ 현재 안내 클리어 또는 다음 안내 오픈
```

## 2.4 탈출 완료 흐름

```txt
ExitPoint escape success
→ GlobalEventBus.OnEscapeRequest(true)
→ ResultManager / ResultUI 기존 결과창 흐름 실행
→ TutorialManager.MarkTutorialCompleted()
→ isTutorialCompleted 저장
→ ResultUI 버튼 클릭 시 로비 이동
```

# 3. 파일별 분석

## 3.1 TutorialManager.cs

### 이전 구조

- <code>TutorialMessageCatalog</code> ScriptableObject에서 ID 기반으로 메시지를 찾아 띄우는 단순 구조였다.
- 팝업 중복 방지와 입력 전환, 일시정지 정도만 담당했다.
- 콜라이더, 상자 열림, 적 처치, 탈출 성공 같은 조건 흐름은 데이터 기반으로 처리하기 어려웠다.

### 변경 이유

튜토리얼이 단순 메시지 팝업이 아니라 단계별 진행 조건을 가져야 했기 때문이다. 특히 다음 조건들이 필요했다.

- 특정 콜라이더 진입 시 안내 시작
- 이전 안내를 닫으면 다음 안내 표시
- 상자 UI가 열리면 상자 내부 설명 표시
- 탈출 성공 시 튜토리얼 완료 저장
- 결과창 흐름은 기존 인게임과 동일하게 유지

### 현재 구조

- <code>LocalJsonTutorialGuideRepository</code>로 <code>TutorialGuide.json</code>을 로드한다.
- <code>guideById</code>에 <code>TID</code> 기준으로 안내 데이터를 캐싱한다.
- <code>openedGuideIds</code>로 이미 출력된 안내를 중복 방지한다.
- <code>pendingGuides</code>로 팝업 표시 중 들어온 다음 안내를 큐에 넣는다.
- <code>NotifyTriggerEnter()</code>로 콜라이더 조건을 받는다.
- <code>NotifyEvent()</code>로 상자 열림, 적 사망, 탈출 성공 같은 이벤트 조건을 받는다.
- <code>TryOpenByCondition()</code>이 데이터의 <code>OpenConditionType</code>, <code>OpenConditionValue</code>와 실제 조건을 비교한다.
- <code>TryClearCurrent()</code>가 <code>ClearConditionType</code>, <code>ClearConditionValue</code>에 따라 현재 안내를 종료한다.
- <code>MarkTutorialCompleted()</code>는 튜토리얼 완료 여부만 저장하고, 로비 이동은 하지 않는다.

### 확인 포인트

- <code>OnEscapeRequest(true)</code>에서 로비 이동을 직접 호출하면 안 된다.
- <code>isTutorialCompleted</code> 저장과 로비 이동은 분리되어야 한다.
- <code>NextGuideID</code>와 <code>PrevGuideClosed</code> 조건을 동시에 사용할 경우 중복 오픈 가능성을 확인해야 한다.

## 3.2 TutorialGuideData.cs

### 이전 구조

- 튜토리얼 안내를 표현하는 JSON 전용 데이터 모델이 없었다.
- 기존 카탈로그 엔트리는 ScriptableObject 전용 구조에 가까웠다.

### 변경 이유

ExcelToJson 또는 JSON 데이터에서 튜토리얼 행을 그대로 읽기 위한 DTO가 필요했다.

### 현재 구조

<code>tutorialGuideData</code>는 다음 책임을 가진다.

- 튜토리얼 ID: <code>TID</code>
- 단계 번호: <code>TutorialStep</code>
- 단계 내 순서: <code>TutorialGuideOrder</code>
- 열림 조건: <code>OpenConditionType</code>, <code>OpenConditionValue</code>
- 클리어 조건: <code>ClearConditionType</code>, <code>ClearConditionValue</code>
- 출력 텍스트: <code>TutorialGuideText</code>
- 하이라이트 위치: <code>UIHighlightPosition</code>, <code>HighlightEffectPosition</code>
- 다음 안내 ID: <code>NextGuideID</code>
- 팝업 호환 프로퍼티: <code>TutorialId</code>, <code>Message</code>

### 확인 포인트

- JSON 필드명과 C# 필드명이 일치해야 한다.
- 기획자가 엑셀에서 컬럼명을 바꾸면 역직렬화가 깨질 수 있다.

## 3.3 TutorialConditionTypes.cs

### 이전 구조

- 조건 문자열이 코드 여러 곳에 흩어질 가능성이 있었다.

### 변경 이유

튜토리얼 조건은 문자열 기반으로 JSON과 코드가 맞물리므로, 상수화가 필요했다.

### 현재 구조

- <code>SceneLoaded</code>
- <code>TriggerEnter</code>
- <code>PrevGuideClosed</code>
- <code>NextButton</code>
- <code>Event</code>
- <code>Duration</code>
- 이벤트명: <code>ItemBoxOpened</code>, <code>EnemyDead</code>, <code>EscapeSucceeded</code>, <code>EscapeFailed</code>, <code>MainActiveSkillCasted</code>

### 확인 포인트

- JSON에서 사용하는 문자열과 상수명이 어긋나면 안내가 뜨지 않는다.
- <code>prevGuideEnd</code>, <code>triggerEnter</code> 같은 약식 명칭은 <code>TutorialManager.NormalizeConditionType()</code>에서 보정한다.

## 3.4 LocalJsonTutorialGuideRepository.cs

### 이전 구조

- 튜토리얼 전용 JSON 로더가 없었다.

### 변경 이유

<code>Resources/JSON/TutorialGuide.json</code>을 읽어 튜토리얼 안내 데이터 리스트로 변환해야 했다.

### 현재 구조

- <code>Resources.Load&lt;TextAsset&gt;("JSON/TutorialGuide")</code>로 JSON을 읽는다.
- <code>JsonConvert.DeserializeObject&lt;List&lt;TutorialGuideData&gt;&gt;()</code>로 리스트를 만든다.
- 파일이 없거나 파싱 결과가 null이면 빈 리스트를 반환한다.

### 확인 포인트

- JSON 파일은 반드시 <code>Assets/Resources/JSON/TutorialGuide.json</code>에 있어야 한다.
- Addressables가 아니라 Resources 경로를 사용한다.

## 3.5 TutorialTrigger.cs

### 이전 구조

- 트리거가 직접 <code>fallbackTutorialId</code> 또는 특정 메시지 ID를 열 가능성이 컸다.

### 변경 이유

이제 트리거는 특정 메시지 ID를 직접 열기보다, <code>TutorialGuide.json</code>의 조건값을 발생시키는 역할이어야 한다.

### 현재 구조

- <code>triggerValue</code>를 가진다.
- 플레이어가 진입하면 <code>TutorialManager.NotifyTriggerEnter(triggerValue)</code>를 호출한다.
- JSON 조건에서 해당 값과 매칭되는 안내가 열린다.
- fallback ID는 기존 호환을 위해 유지한다.

### 확인 포인트

- 씬 트리거의 <code>triggerValue</code>와 JSON의 <code>OpenConditionValue</code>가 정확히 일치해야 한다.
- 5번 단계는 콜라이더가 아니라 상자 열림 이벤트이므로 <code>TutorialTrigger</code>가 담당하지 않는다.

## 3.6 TutorialPopup.cs

### 이전 구조

- ScriptableObject 엔트리 기반 메시지 표시 중심이었다.

### 변경 이유

JSON 데이터인 <code>TutorialGuideData</code>도 같은 팝업 UI로 표시해야 했다.

### 현재 구조

- 기존 <code>TutorialMessageEntry</code> 표시 메서드를 유지한다.
- 새로 <code>TutorialGuideData</code> 표시 메서드를 지원한다.
- 제목, 메시지, 확인 버튼 텍스트를 JSON 데이터에서 받아 표시한다.

### 확인 포인트

- 한글이 깨져 보이면 TMP 폰트 에셋과 머티리얼 연결을 먼저 확인한다.
- JSON 파일은 UTF-8로 유지해야 한다.

## 3.7 TutorialEventBridge.cs

### 이전 구조

- 이벤트 브릿지가 없거나, 이벤트 전달 책임이 명확하지 않았다.

### 변경 이유

상자 열림, 적 사망, 탈출 성공처럼 콜라이더가 아닌 조건을 튜토리얼 시스템에 전달할 경로가 필요했다.

### 현재 구조

- <code>GlobalEventBus.OnItemBoxOpened</code>
- <code>GlobalEventBus.OnEnemyDead</code>
- <code>GlobalEventBus.OnEscapeRequest</code>
- <code>GlobalEventBus.OnMainActiveSkillCasted</code>

위 이벤트를 받아 <code>TutorialManager.NotifyEvent()</code>로 전달한다.

### 확인 포인트

- <code>TutorialManager</code>도 이벤트를 직접 구독하므로, 브릿지 중복 구독 여부를 주의해야 한다.
- 중복 이벤트로 같은 안내가 두 번 열리지 않도록 <code>openedGuideIds</code>가 방어한다.

## 3.8 TutorialCompletionTrigger.cs

### 이전 구조

- 마지막 지점에 닿으면 튜토리얼 완료 저장 후 바로 로비로 이동하는 구조였다.

### 변경 이유

튜토리얼 탈출도 인게임 탈출과 동일하게 결과창을 먼저 보여야 했다.

### 현재 구조

- 튜토리얼 완료 상태만 저장한다.
- 로비 이동은 <code>ResultUI</code>의 로비 버튼 클릭 흐름에 맡긴다.

### 확인 포인트

- 이 트리거가 씬에 남아 있어도 로비 직접 이동을 하지 않아야 한다.
- 실제 탈출은 <code>ExitPoint</code>가 담당한다.

## 3.9 IntroSceneController.cs

### 이전 구조

- 인트로에서 바로 로비로 갈지, 튜토리얼로 갈지 제어하는 <code>useTutorialScene</code>만 있었다.

### 변경 이유

개발 중에는 튜토리얼 완료값이 저장되면 다시 튜토리얼을 보기 어려웠다. 세이브 전체 삭제 없이 완료 플래그만 리셋하는 옵션이 필요했다.

### 현재 구조

- <code>useTutorialScene</code>: 튜토리얼 씬 진입 기능 사용 여부
- <code>resetTutorialCompletedOnIntro</code>: 인트로 진입 시 <code>isTutorialCompleted</code>만 false로 되돌릴지 여부
- <code>ShouldEnterTutorialScene()</code>: <code>SaveFile.json</code>의 완료 여부를 읽어 튜토리얼 진입 여부 결정

### 확인 포인트

- <code>resetTutorialCompletedOnIntro</code>는 개발 테스트용이다.
- 빌드 또는 일반 테스트 전에는 false로 꺼야 한다.

## 3.10 ExitPoint.cs

### 이전 구조

- 탈출 시작/성공/취소 과정에서 오디오 배열이 비어 있으면 예외가 날 수 있었다.

### 변경 이유

튜토리얼 씬은 리소스가 제한적이어서 일부 오디오 ID 배열이 비어 있을 수 있다. 튜토리얼 테스트 중 탈출 흐름이 오디오 예외로 끊기지 않게 해야 했다.

### 현재 구조

- 오디오 ID 배열이 null 또는 empty일 때 안전하게 무시한다.
- 탈출 성공 이벤트는 기존대로 <code>OnEscapeRequest(true)</code>를 발생시킨다.

### 확인 포인트

- 튜토리얼 씬에 오디오가 덜 연결되어 있어도 탈출 로직은 진행되어야 한다.
- 인게임 씬에서는 기존 오디오가 정상 재생되는지 별도 확인이 필요하다.

## 3.11 EscapeTimer.cs

### 이전 구조

- 부모 <code>ExitPoint</code> 참조가 없을 때 OnEnable/OnDisable 흐름에서 NullReference가 발생할 수 있었다.

### 변경 이유

튜토리얼 씬 구성 중 일부 오브젝트 구조가 인게임과 다를 수 있어 참조 방어가 필요했다.

### 현재 구조

- 부모 <code>ExitPoint</code>가 없으면 이벤트 연결/해제를 시도하지 않는다.

### 확인 포인트

- 튜토리얼 씬 단독 배치에서도 예외가 없어야 한다.
- 인게임 포탈 UI 게이지는 기존처럼 동작해야 한다.

# 4. 데이터 분석: TutorialGuide.json

## 4.1 데이터 책임

<code>TutorialGuide.json</code>은 튜토리얼의 기획 데이터다. 코드가 아니라 데이터로 다음 항목을 결정한다.

- 어떤 문구가 뜨는가
- 어떤 조건에서 뜨는가
- 어떤 조건에서 닫히는가
- 다음 안내가 무엇인가
- UI 또는 월드 하이라이트 위치가 어디인가

## 4.2 단계 구조

```txt
101~103: 이동 기본
201~204: 전투 조작 사전 안내
205: 전투 실습
301~302: 상자 접근 / 상자 열기
303~306: 상자 내부 아이템 / 아티팩트 설명
401~402: 포탈 / 탈출
```

## 4.3 주의점

- <code>OpenConditionValue</code>는 씬 오브젝트 이름이 아니라 조건 문자열이다.
- 콜라이더 트리거의 <code>triggerValue</code>와 JSON의 <code>OpenConditionValue</code>가 맞아야 한다.
- 상자 내부 설명은 <code>ItemBoxOpened</code> 이벤트 이후에 이어진다.

# 5. 씬 구성 분석

## 5.1 TutorialScene

- 도로 중심의 튜토리얼 전용 레벨이다.
- 불필요한 맵 리소스를 줄이고 튜토리얼 동선에 필요한 오브젝트만 남겼다.
- <code>TutorialTriggers</code> 아래에 1, 2, 3, 4, 6번 트리거가 있다.
- 5번은 물리 콜라이더가 아니라 상자 열림 이벤트 단계다.

## 5.2 DemoScene Tutorial

- 인게임의 공통 시스템을 튜토리얼 전용으로 Additive 로드하기 위한 씬이다.
- 플레이어, 카메라, UI, 매니저 구조를 튜토리얼에서 사용할 수 있게 한다.
- 기존 인게임 Additive 씬을 직접 공유하지 않아 일반 인게임 세팅과 섞이는 위험을 줄인다.

# 6. 오늘 작업에서 기억해야 할 설계 원칙

1. 튜토리얼은 별도 씬에서 완결되지만, 플레이어/카메라/UI/매니저는 Additive 구조를 재사용한다.
2. 튜토리얼 문구와 조건은 JSON 데이터로 관리한다.
3. 위치 도달은 콜라이더, 실제 행동 완료는 이벤트로 처리한다.
4. 튜토리얼 완료 저장과 로비 이동은 분리한다.
5. 결과창 흐름은 인게임과 동일하게 유지한다.
6. 개발 테스트용 플래그는 빌드 전 반드시 꺼야 한다.

# 7. 베타 병합 관련 주의 기록

베타 브랜치에서 튜토리얼 구현이 이미 머지된 뒤, 로컬에 대량 삭제/되돌림 diff가 생겼다. 이 상태는 정상 패치가 아니라 최신 구현을 이전 상태로 되돌릴 위험이 있는 변경이었다.

확인해야 할 명령:

```bash
git status --short --branch
git diff --stat
git diff --cached --stat
```

특히 다음 파일이 삭제로 보이면 위험 신호다.

```txt
Assets/Resources/JSON/TutorialGuide.json
Assets/02_Scripts/System/Tutorial/TutorialGuideData.cs
Assets/02_Scripts/System/Tutorial/TutorialConditionTypes.cs
Assets/02_Scripts/System/Repository/LocalJsonTutorialGuideRepository.cs
```

# 8. 다음 작업 제안

- 튜토리얼 문구 최종 검수
- 1\~6단계 실제 플레이 동선 검수
- 전투 실습 조건을 단순 확인 버튼으로 둘지, 적 처치 이벤트로 둘지 결정
- 상자 내부 설명에서 실제 아이템 이동 완료 이벤트를 추가할지 검토
- 빌드 전 <code>resetTutorialCompletedOnIntro</code> false 확인
- 베타 브랜치에서 의도하지 않은 되돌림 diff가 없는지 확인
{% endraw %}
