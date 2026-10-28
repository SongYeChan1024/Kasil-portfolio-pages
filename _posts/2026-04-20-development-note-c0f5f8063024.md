---
title: "사운드 구조 정리"
date: 2026-04-20 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "사운드 구조 정리 1. 우리 프로젝트의 현재 사운드 구조 우리 프로젝트의 사운드 시스템은 완전히 한 가지 방식이 아니라, 여러 방식이 섞여 있는 혼합 구조이다. 현재 핵심 사운드 관리자는 SoundManager이고, 전체 흐름은 다음과 같다. enum으로 사운드 종류를 나눈다. 인스펙터"
description: "사운드 구조 정리 1. 우리 프로젝트의 현재 사운드 구조 우리 프로젝트의 사운드 시스템은 완전히 한 가지 방식이 아니라, 여러 방식이 섞여 있는 혼합 구조이다. 현재 핵심 사운드 관리자는 SoundManager이고, 전체 흐름은 다음과 같다. enum으로 사운드 종류를 나눈다. 인스펙터"
published: false
migration_id: "35e36532580e81ed9c39c0f5f8063024"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
# <b>사운드 구조 정리</b>

## <b>1. 우리 프로젝트의 현재 사운드 구조</b>

우리 프로젝트의 사운드 시스템은 완전히 한 가지 방식이 아니라, 여러 방식이 섞여 있는 혼합 구조이다.

현재 핵심 사운드 관리자는 SoundManager이고, 전체 흐름은 다음과 같다.

1. enum으로 사운드 종류를 나눈다.
2. 인스펙터에서 List\&lt;Entry&gt; 형태로 사운드를 등록한다.
3. 게임 실행 시 이 리스트를 Dictionary로 변환해 사용한다.
4. 일부 씬 사운드는 switch(scene.name)로 직접 분기해서 재생한다.
5. 일부 특수 연출은 AudioClip을 직접 참조해서 사용한다.

즉, 현재 구조는 다음처럼 볼 수 있다.

- 사운드 종류 구분: enum
- 사운드 등록 방식: List
- 사운드 조회 방식: Dictionary
- 씬별 자동 재생 방식: switch-case
- 특수 연출 방식: AudioClip 직접 참조

한 줄로 정리하면,

<b>현재 구조는 "리스트 기반 등록 + 딕셔너리 기반 조회 + 일부 하드코딩 분기"가 섞인 혼합 구조</b>이다.

---

## <b>2. 현재 프로젝트에서 실제로 쓰는 구조</b>

### <b>중심 관리자</b>

- SoundManager
- BGM, Ambient, UI, SFX를 전부 관리한다.

### <b>사운드 종류 구분</b>

- BGMType
- AmbientType
- UIType
- SFXType

즉, 사운드를 문자열이 아니라 enum 이름으로 구분하고 있다.

예시:

<code>public enum SFXType
{
    None,
    Jump,
    Land,
    Ep3_1_DoorOpen,
    Ep3_2_TileStepCorrect
}</code>

### <b>인스펙터 등록 방식</b>

현재는 이런 식으로 리스트에 등록한다.

<code>[SerializeField] private List&lt;BGMEntry&gt; bgmEntries = new List&lt;BGMEntry&gt;();
[SerializeField] private List&lt;SFXEntry&gt; sfxEntries = new List&lt;SFXEntry&gt;();</code>

즉, 유니티 인스펙터에서 보기 편하게 List 형태로 사운드를 넣는다.

### <b>런타임 사용 방식</b>

게임 실행 후에는 리스트를 딕셔너리로 바꿔서 사용한다.

<code>private Dictionary&lt;BGMType, AudioClip&gt; bgmDict = new Dictionary&lt;BGMType, AudioClip&gt;();
private Dictionary&lt;SFXType, AudioClip[]&gt; sfxDict = new Dictionary&lt;SFXType, AudioClip[]&gt;();</code>

즉, 등록은 리스트지만 실제 사용은 딕셔너리이다.

### <b>씬별 자동 사운드</b>

이 부분은 아직 딕셔너리가 아니라 switch-case 구조다.

<code>switch (scene.name)
{
    case "Episode3_1": PlayBGM(BGMType.Episode3_1); break;
    case "Episode3_2": PlayBGM(BGMType.Episode3_2); break;
}</code>

### <b>직접 AudioClip 참조하는 부분</b>

일부 스크립트는 SoundManager를 거치지 않고 AudioClip을 직접 들고 있다.

예시:

- RhythmAudioManager
- AudioHint
- FinalPianoInteraction

즉, 프로젝트 전체가 100% 통일된 구조는 아니다.

---

## <b>3. 딕셔너리 구조란 무엇인가</b>

딕셔너리는 쉽게 말하면

<b>"키(Key)로 값을 바로 찾는 자료구조"</b> 이다.

예를 들면:

- Jump -> 점프 사운드
- Episode3\_2 -> 3-2 맵의 사운드 프로필
- Click -> UI 클릭 사운드

이런 식으로 연결해 두는 구조이다.

예시:

<code>Dictionary&lt;SFXType, AudioClip[]&gt; sfxDict;
Dictionary&lt;string, SoundProfile&gt; sceneSoundDict;</code>

리스트는 원하는 값을 찾으려면 하나씩 훑어봐야 하는 느낌이고,

딕셔너리는 키를 통해 바로 꺼내오는 느낌이다.

비유하면:

- 리스트: 이름표가 없는 서랍 여러 개를 열어보며 찾는 방식
- 딕셔너리: 라벨이 붙은 서랍에서 바로 꺼내는 방식

---

## <b>4. 현재 구조와 딕셔너리 구조의 차이</b>

### <b>현재 구조</b>

- 인스펙터 등록은 편하다.
- Unity에서 다루기 쉽다.
- 일부는 딕셔너리를 이미 사용하고 있다.
- 하지만 씬별 사운드처럼 switch-case가 남아 있다.
- 특수 사운드는 직접 AudioClip을 들고 있어 구조가 통일되지 않았다.

### <b>딕셔너리 구조</b>

- 키로 바로 찾을 수 있다.
- if, switch가 줄어든다.
- 씬 수가 늘어나도 코드가 덜 길어진다.
- 유지보수가 쉬워진다.
- 중복 로직을 줄일 수 있다.

---

## <b>5. 딕셔너리 구조로 바꾸면 어떻게 되는가</b>

현재 씬 사운드는 이런 식이다.

<code>switch (scene.name)
{
    case "Episode3_1": PlayBGM(BGMType.Episode3_1); break;
    case "Episode3_2": PlayBGM(BGMType.Episode3_2); break;
}</code>

딕셔너리 구조로 바꾸면 이런 식이 된다.

<code>private Dictionary&lt;string, SoundProfile&gt; sceneSoundDict;

if (sceneSoundDict.TryGetValue(scene.name, out SoundProfile profile))
{
    PlayBGM(profile.bgm);
    PlayAmbient(profile.ambient);
}</code>

즉,

기존에는 씬 이름이 늘어날 때마다 case를 계속 추가해야 했지만,

딕셔너리 구조에서는 데이터만 추가하면 된다.

---

## <b>6. 딕셔너리 구조로 바꾸면 좋은 점</b>

### <b>1. 코드가 짧아진다</b>

switch-case가 길게 늘어지지 않는다.

### <b>2. 유지보수가 쉬워진다</b>

새로운 씬이나 사운드를 추가할 때 수정할 곳이 줄어든다.

### <b>3. 구조가 명확해진다</b>

"이 키에 어떤 데이터가 연결되는지"가 분명해진다.

### <b>4. 확장성이 좋아진다</b>

에피소드, 퍼즐, UI가 늘어나도 구조를 크게 바꾸지 않아도 된다.

### <b>5. 중복을 줄일 수 있다</b>

씬별 사운드 설정을 코드 분기 대신 데이터로 관리할 수 있다.

---

## <b>7. 하지만 무조건 전부 딕셔너리로 바꿔야 하는 것은 아니다</b>

딕셔너리는 <b>키로 찾아야 하는 데이터</b>에 적합하다.

예를 들면:

- 씬 이름 -> 씬 사운드 설정
- SFX 타입 -> 효과음 배열
- UI 타입 -> UI 사운드

반대로, 이런 것은 딕셔너리보다 그냥 직접 참조가 더 자연스럽다.

- 리듬 퍼즐에서 사용하는 단일 음악
- 특정 오브젝트만 사용하는 힌트 사운드
- 컷씬 전용 단일 BGM

즉,

<b>공용 데이터는 딕셔너리</b>,

<b>개별 연출용 데이터는 직접 참조</b>

이렇게 나누는 것이 더 좋다.

---

## <b>8. 우리 프로젝트에서 리팩토링하면 좋은 부분</b>

### <b>가장 먼저 바꾸기 좋은 부분</b>

- SoundManager의 OnSceneLoaded()
- 현재는 switch(scene.name)로 하드코딩되어 있음
- 이 부분을 Dictionary\<string, SoundProfile> 구조로 바꾸면 좋음

### <b>이미 딕셔너리화가 잘 되어 있는 부분</b>

- BGMType -> AudioClip
- AmbientType -> AudioClip
- UIType -> AudioClip\[\]
- SFXType -> AudioClip\[\]

즉, 이 부분은 이미 방향이 좋다.

### <b>나중에 정리해도 되는 부분</b>

- FinalPianoInteraction의 musicA, musicB
- AudioHint의 단일 AudioClip
- RhythmAudioManager의 퍼즐 전용 곡

이 부분은 딕셔너리보다는 배열이나 직접 참조가 더 자연스럽다.

---

## <b>9. 결론</b>

현재 우리 프로젝트 사운드 구조는

<b>완전한 딕셔너리 구조는 아니고, 리스트 등록 + 딕셔너리 조회 + 일부 switch 하드코딩이 섞인 혼합 구조</b>이다.

딕셔너리 구조로 바꾸면 좋은 점은 다음과 같다.

- 코드가 짧아진다.
- 씬과 사운드가 많아져도 관리하기 쉽다.
- 하드코딩이 줄어든다.
- 확장성이 좋아진다.
- 유지보수가 쉬워진다.

다만 모든 사운드를 무조건 딕셔너리로 바꾸는 것은 아니라,

<b>공용 사운드 매핑은 딕셔너리</b>,

<b>특수 연출용 사운드는 직접 참조</b>

로 나누는 것이 가장 좋은 방향이다.
{% endraw %}
