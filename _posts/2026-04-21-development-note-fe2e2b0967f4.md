---
title: "사운드 매니저 딕셔너리 구조 리팩토링 정리"
date: 2026-04-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "씬 이름을 키로 SoundProfile을 조회하도록 바꾸고 씬 사운드 적용을 SoundManager로 모은 과정을 정리했다."
description: "씬 이름을 키로 SoundProfile을 조회하도록 바꾸고 씬 사운드 적용을 SoundManager로 모은 과정을 정리했다."
published: true
migration_id: "35e36532580e81c68f42fe2e2b0967f4"
migration_status: "published"
migration_flags: []
---

{% raw %}
## <b>1. 리팩토링 목표</b>

기존에는 씬이 바뀔 때마다 SoundManager 안에서 switch(scene.name)로 어떤 사운드를 재생할지 직접 분기했다.

이번 리팩토링의 목표는 이 구조를 <b>씬 이름을 키로 SoundProfile을 찾는 딕셔너리 구조</b>로 바꾸는 것이었다.

즉,

- 이전: 코드가 씬 이름을 보고 직접 분기
- 이후: 씬 이름으로 프로필을 찾아서 적용

---

## <b>2. 리팩토링 전 구조</b>

### <b>구조</b>

- SoundManager가 씬 로드 시 switch(scene.name) 실행
- 씬 이름마다 PlayBGM(), PlayAmbient()를 직접 호출
- 일부 씬은 SoundController가 별도로 SoundProfile을 적용
- 엔딩 씬도 SoundController 오브젝트를 따로 두고 사운드를 바꾸는 방식

### <b>예전 방식의 흐름</b>

<code>씬 로드
-&gt; SoundManager.OnSceneLoaded()
-&gt; switch(scene.name)
-&gt; 해당 case에서 PlayBGM / PlayAmbient 호출</code>

### <b>문제점</b>

- 씬이 늘어날수록 case가 계속 늘어남
- 씬 사운드 정보가 코드 안에 하드코딩됨
- SoundManager와 SoundController가 역할을 나눠 가져서 책임이 겹침
- 유지보수 시 어디를 수정해야 하는지 헷갈릴 수 있음

---

## <b>3. 리팩토링 후 구조</b>

### <b>핵심 구조</b>

- SoundProfile: 씬 사운드 설정을 저장하는 ScriptableObject
- SceneSoundEntry: 씬 이름과 SoundProfile을 연결하는 데이터
- sceneSoundDict: Dictionary\<string, SoundProfile>
- SoundManager: 딕셔너리에서 프로필을 찾아 실제 사운드를 적용
- SoundController: 제거

### <b>현재 구조의 흐름</b>

<code>씬 로드
-&gt; SoundManager.OnSceneLoaded()
-&gt; sceneSoundDict에서 scene.name으로 SoundProfile 조회
-&gt; SoundManager.ApplySoundProfile(profile)
-&gt; BGM / Ambient / PlayerSound 적용</code>

---

## <b>4. 각 요소의 역할</b>

### <b>1. SoundProfile</b>

역할: 씬에서 사용할 사운드 설정을 저장하는 데이터 에셋

포함되는 정보 예시:

- 어떤 BGM을 재생할지
- 어떤 Ambient를 재생할지
- 루프 여부
- 플레이어 발소리/점프/착지 사운드 타입

중요한 점:

- SoundProfile은 재생을 하지 않는다
- 설정만 저장한다

즉,

- SoundProfile = 설정표
- SoundManager = 실제 재생기

---

### <b>2. SceneSoundEntry</b>

역할: 씬 이름과 SoundProfile을 연결하는 데이터 한 줄

예시:

- Ep3\_1\_Scene -> Ep3\_1\_SoundProfile
- Ep3\_2\_Scene -> Ep3\_2\_SoundProfile

즉,

씬 이름 하나와 프로필 하나를 짝지어 두는 구조다.

---

### <b>3. sceneSoundDict</b>

역할: 씬 이름으로 SoundProfile을 빠르게 찾기 위한 딕셔너리

형태:

<code>Dictionary&lt;string, SoundProfile&gt;</code>

의미:

- key = 씬 이름
- value = 그 씬에서 사용할 프로필

---

### <b>4. SoundManager</b>

역할: 딕셔너리에서 프로필을 찾고 실제로 사운드를 적용하는 중심 관리자

현재 맡는 일:

- 씬 로드 감지
- sceneSoundDict 조회
- ApplySoundProfile() 실행
- BGM / Ambient / PlayerSound 적용

즉,

이제 씬 사운드의 중심 책임은 SoundManager 하나로 모였다.

---

## <b>5. 왜 딕셔너리 구조로 바꿨는가</b>

### <b>이전 switch 구조</b>

<code>switch (scene.name)
{
    case "Ep3_1_Scene":
        PlayBGM(...);
        break;
}</code>

### <b>현재 dictionary 구조</b>

<code>if (sceneSoundDict.TryGetValue(scene.name, out SoundProfile profile))
{
    ApplySoundProfile(profile);
}</code>

### <b>딕셔너리 구조의 장점</b>

- 코드가 짧아진다
- 새 씬이 추가되어도 case를 늘리지 않아도 된다
- 씬 사운드 설정이 코드가 아니라 데이터로 관리된다
- 유지보수가 쉬워진다
- 구조가 더 명확해진다

---

## <b>6. Unity에서 실제로 적용한 방식</b>

Unity는 Dictionary를 인스펙터에서 직접 다루기 불편하다.

그래서 이번 구조는 아래처럼 만들었다.

### <b>인스펙터 등록 방식</b>

- List\&lt;SceneSoundEntry&gt;로 씬 이름과 프로필을 등록

### <b>런타임 사용 방식</b>

- Awake()에서 리스트를 sceneSoundDict로 변환
- 이후에는 딕셔너리로만 조회

즉,

- 등록: List
- 사용: Dictionary

이 구조가 Unity에서는 가장 실용적이다.

---

## <b>7. 이번 리팩토링에서 실제로 바뀐 점</b>

### <b>1. SoundManager가 씬 사운드 자동 적용을 전담하게 됨</b>

- switch(scene.name) 제거
- sceneSoundDict 기반 조회로 변경

### <b>2. SoundProfile 중심 구조로 정리됨</b>

- 씬별 사운드 설정을 프로필 에셋으로 관리
- 코드보다 데이터 중심 구조가 됨

### <b>3. SoundController 제거</b>

- 씬마다 따로 있던 SoundController 프리팹 제거
- SoundController.cs 삭제
- 씬 안의 SoundCtrl\_Normal, SoundCtrl\_True 같은 오브젝트도 제거

### <b>4. 엔딩 씬도 같은 구조로 통일</b>

- EndingManager가 SoundProfile을 직접 적용
- 별도 SoundController 없이 처리

---

## <b>8. 리팩토링 후 구조의 장점</b>

### <b>구조적 장점</b>

- 씬 사운드 책임이 한 곳으로 모임
- 사운드 시스템이 더 일관적임
- 중복 구조가 사라짐

### <b>유지보수 장점</b>

- 씬 추가 시 SoundProfile만 연결하면 됨
- 코드 수정량이 줄어듦
- 기획 변경 대응이 쉬움

### <b>확장성 장점</b>

- 에피소드가 늘어나도 구조를 그대로 유지 가능
- 씬별 사운드 설정을 에셋 단위로 관리 가능

---

## <b>9. 최종 구조 한 줄 정리</b>

기존에는

<b>씬 이름을 코드에서 switch로 분기해서 사운드를 재생하는 구조</b>였고,

리팩토링 후에는

<b>씬 이름을 키로 딕셔너리에서 SoundProfile을 찾아 SoundManager가 적용하는 구조</b>가 되었다.

---

## <b>10. 핵심 요약</b>

<b>이번 리팩토링은 switch(scene.name) 기반 씬 사운드 재생을 Dictionary\<string, SoundProfile> 기반 구조로 바꾸고, SoundController를 제거하여 씬 사운드 책임을 SoundManager로 일원화한 작업이다.</b>
{% endraw %}
