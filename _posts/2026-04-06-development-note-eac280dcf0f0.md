---
title: "mos.A.I.c 사운드 시스템 구현도 및 가이드"
date: 2026-04-06 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "SoundManager를 중심으로 씬·플레이어·UI·오브젝트 사운드를 등록하고 사용하는 방법을 정리한 가이드다."
description: "SoundManager를 중심으로 씬·플레이어·UI·오브젝트 사운드를 등록하고 사용하는 방법을 정리한 가이드다."
published: true
migration_id: "35e36532580e812f8e69eac280dcf0f0"
migration_status: "published"
migration_flags: []
---

{% raw %}
# 사운드 시스템 사용 가이드

<details markdown="1">
<summary>1\. 개요</summary>

우리 프로젝트의 사운드는 <code>SoundManager</code>를 중심으로 관리한다.

배경음과 환경음은 <code>SoundProfile + SoundController</code>를 통해 씬 시작 시 자동 적용되며,

플레이어 사운드는 <code>PlayerSound</code>, UI 사운드는 <code>UISoundTrigger</code>, 오브젝트 상호작용 사운드는 <code>SoundTrigger</code>를 통해 재생된다.

즉, 역할은 아래처럼 나뉜다.

- 씬 기본 사운드: <code>SoundProfile + SoundController</code>
- 플레이어 사운드: <code>PlayerSound</code>
- UI 사운드: <code>UISoundTrigger</code>
- 오브젝트 상호작용 사운드: <code>SoundTrigger</code>
- 실제 재생: <code>SoundManager</code>

</details>

---

<details markdown="1">
<summary>2\. 핵심 스크립트 역할 정리</summary>

<details markdown="1">
<summary>SoundManager</summary>

프로젝트 전체 사운드 재생 담당.

관리하는 항목:

- BGM
- Ambient
- UI
- SFX
- 3D SFX

실제 오디오 클립은 <code>SoundManager</code> 인스펙터의 목록에 등록해야 한다.

<code>PlayBGM</code>, <code>PlayAmbient</code>, <code>PlayUI</code>, <code>PlaySFX</code>, <code>PlaySFX3D</code>로 재생한다.

</details>

<details markdown="1">
<summary>SoundProfile</summary>

씬별 사운드 설정 데이터.

설정 가능한 항목:

- 이 씬의 BGM
- 이 씬의 Ambient
- 플레이어 발걸음 사운드
- 플레이어 점프 사운드
- 플레이어 착지 사운드
- 플레이어 발걸음 2D/3D 여부
- 플레이어 사운드 볼륨

즉, “이 씬에서는 어떤 기본 사운드를 쓸지”를 저장하는 에셋이다.

</details>

<details markdown="1">
<summary>SoundController</summary>

씬 시작 시 <code>SoundProfile</code>을 읽어서 적용하는 스크립트.

하는 일:

- BGM 적용
- Ambient 적용
- 플레이어의 <code>PlayerSound</code>를 찾아 현재 씬 설정을 주입

즉, 씬에 들어왔을 때 <b>기본 사운드를 세팅하는 역할</b>이다.

</details>

<details markdown="1">
<summary>PlayerSound</summary>

플레이어 전용 사운드 담당.

현재 사용:

- 발걸음
- 점프
- 착지

플레이어 프리팹에 붙어 있으며,

씬 시작 시 <code>SoundController</code>가 <code>SoundProfile</code>의 값을 읽어 이 스크립트에 적용한다.

실제 점프/착지/이동 타이밍 감지는 <code>PlayerMovement</code>에서 하고, 재생은 <code>PlayerSound</code>가 맡는다.

</details>

<details markdown="1">
<summary>UISoundTrigger</summary>

UI 버튼용 사운드 스크립트.

사용 대상:

- 버튼 클릭음
- 버튼 호버음
- 확인 / 취소 / 닫기 버튼 등

버튼 오브젝트에 붙이고, 인스펙터에서 클릭음과 호버음을 지정해서 사용한다.

</details>

<details markdown="1">
<summary>SoundTrigger</summary>

오브젝트 상호작용용 사운드 스크립트.

사용 대상:

- 문 열림
- 포탈 통과
- 레버 작동
- 아이템 획득
- 퍼즐 성공 / 실패
- 특정 상호작용 연출

오브젝트에 붙이고, 적절한 시점에 <code>Play()</code>를 호출해서 사용한다.

</details>

</details>

---

<details markdown="1">
<summary>3\. 씬 기본 사운드 적용 방법 (SoundProfile + SoundController)</summary>

대상:

- 씬 BGM
- 씬 Ambient
- 플레이어 기본 발소리 / 점프 / 착지

작업 순서:

1. <code>SoundProfile</code> 에셋을 생성한다.
2. 해당 씬에서 사용할 BGM, Ambient, 플레이어 사운드를 설정한다.
3. 씬에 <code>SoundController</code> 오브젝트를 배치한다.
4. <code>SoundController</code>의 <code>profile</code> 칸에 만든 <code>SoundProfile</code>을 연결한다.

결과:

씬 시작 시 자동으로 배경음, 환경음, 플레이어 기본 사운드가 적용된다.

<code>SoundController</code>는 <code>Start()</code>에서 <code>ApplySceneSound()</code>와 <code>ApplyPlayerSound()</code>를 호출해 씬 사운드와 플레이어 사운드를 주입한다.

</details>

<details markdown="1">
<summary>4\. 플레이어 사운드 적용 방법 (PlayerSound)</summary>

대상:

- 발걸음
- 점프
- 착지

현재 구조:

- 플레이어 프리팹에 <code>PlayerSound</code>가 붙어 있어야 한다.
- <code>PlayerMovement</code>가 이동/점프/착지를 감지한다.
- 감지한 순간 <code>PlayerSound</code>를 호출한다.
  - <code>PlayerMovement</code>는 <code>HandleFootstep()</code>, <code>Jump()</code>, <code>HandleLandingSound()</code>에서 각각 발걸음, 점프, 착지를 처리하도록 정리되어 있다.

작업 순서:

1. 플레이어 프리팹에 <code>PlayerSound</code>를 붙인다.
2. 플레이어 프리팹에 <code>PlayerMovement</code>와 같이 들어가 있는지 확인한다.
3. 각 씬의 <code>SoundProfile</code>에서 플레이어 발걸음 / 점프 / 착지 사운드를 설정한다.
4. 씬 시작 시 <code>SoundController</code>가 <code>PlayerSound</code>를 찾아 프로필 값을 주입한다.

결과:

씬마다 다른 플레이어 발소리나 볼륨을 사용할 수 있다.

</details>

<details markdown="1">
<summary>5\. UI 사운드 적용 방법 (UISoundTrigger)</summary>

대상:

- 버튼 클릭
- 버튼 호버
- 확인 / 취소 / 닫기 UI

작업 순서:

1. UI 오브젝트에 <code>UISoundTrigger</code>를 붙인다.
2. 인스펙터에서 아래 항목을 설정한다.
   - <code>clickSound</code>
   - <code>hoverSound</code>
   - 필요 시 볼륨 배율
3. 버튼 클릭과 마우스 오버가 정상적으로 동작하는지 확인한다.

예시:

- 일반 버튼: <code>Click</code>, <code>Hover</code>
- 확인 버튼: <code>Confirm</code>
- 취소 버튼: <code>Cancel</code>
- 닫기 버튼: <code>Close</code>

결과:

해당 UI 오브젝트에서 클릭/호버 시 UI 사운드가 재생된다.

<code>SoundManager</code>는 <code>PlayUI(type, volumeScale)</code>로 UI 사운드를 재생하도록 되어 있다.

</details>

<details markdown="1">
<summary>6\. 오브젝트 상호작용 사운드 적용 방법 (SoundTrigger)</summary>

대상:

- 문
- 포탈
- 레버
- 아이템
- 퍼즐 오브젝트
- 특정 연출 오브젝트

작업 순서:

1. 해당 오브젝트에 <code>SoundTrigger</code>를 붙인다.
2. 인스펙터에서 아래 항목을 설정한다.
   - <code>sfxType</code>
   - 2D / 3D 여부
   - 볼륨
3. 오브젝트 로직에서 적절한 시점에 <code>Play()</code>를 호출한다.

결과:

상호작용 시 설정한 효과음이 재생된다.

</details>

---

<details markdown="1">
<summary>7\. 예시</summary>

<details markdown="1">
<summary>예시 1) 문 열림 사운드</summary>

구성:

- <code>DoorInteract</code>
- <code>SoundTrigger</code>

설정:

- <code>sfxType = Ep3_1_DoorOpen</code>
- 3D 사운드 사용

호출:

- 문이 실제로 열리는 시점에 <code>soundTrigger.Play()</code>

</details>

<details markdown="1">
<summary>예시 2) 포탈 통과 사운드</summary>

구성:

- <code>Portal</code>
- <code>SoundTrigger</code>

설정:

- <code>sfxType = PortalPass</code>
- 3D 사운드 사용

호출:

- 플레이어가 포탈을 통과하는 시점에 <code>soundTrigger.Play()</code>

</details>

<details markdown="1">
<summary>예시 3) 퍼즐 성공 / 실패 사운드</summary>

구성:

- 퍼즐 매니저
- 정답/오답 연출 오브젝트
- <code>SoundTrigger</code> 또는 직접 <code>SoundManager</code> 호출

설정 예시:

- 성공음: <code>Ep3_2_TileStepCorrect</code>
- 실패음: <code>Ep3_2_TileStepWrong</code>

호출:

- 정답 판정 시 성공음 재생
- 오답 판정 시 실패음 재생

</details>

<details markdown="1">
<summary>예시 4) 씬 시작 사운드</summary>

구성:

- <code>SoundController</code>
- <code>Episode1_SoundProfile</code>

설정:

- BGM = <code>Episode1_Village</code>
- Ambient = <code>Ep1_Village_Loop</code>
- PlayerFootstep = <code>Footstep_Ep1_Village</code>

결과:

- 씬 진입 시 자동으로 적용됨

</details>

</details>

---

<details markdown="1">
<summary>8\. 실제 작업 시 주의사항</summary>

<details markdown="1">
<summary>1\) Enum만 있다고 재생되지 않음</summary>

사운드는 반드시 <code>SoundManager</code> 인스펙터에 실제 클립이 등록되어 있어야 한다.

등록 위치:

- BGM Entries
- Ambient Entries
- UI Entries
- SFX Entries

<code>SoundManager</code>는 enum 타입을 기준으로 딕셔너리를 만들고, 등록되지 않은 타입은 경고를 띄우거나 재생하지 않는다.

</details>

<details markdown="1">
<summary>2\) <code>SoundTrigger</code>를 붙여도 자동 재생되지 않음</summary>

오브젝트에 <code>SoundTrigger</code>가 있어도, 오브젝트 로직에서 <code>Play()</code>를 호출해야 실제로 소리가 난다.

</details>

<details markdown="1">
<summary>3\) <code>UISoundTrigger</code>도 버튼에 붙여야 함</summary>

버튼이 있어도 <code>UISoundTrigger</code>가 없으면 UI 사운드는 자동으로 나지 않는다.

</details>

<details markdown="1">
<summary>4\) 플레이어 사운드는 프리팹 고정값이 아니라 씬에서 주입됨</summary>

플레이어 프리팹에 <code>PlayerSound</code>는 붙어 있지만,

실제로 어떤 발소리를 쓸지는 각 씬의 <code>SoundProfile</code>에서 결정된다.

</details>

<details markdown="1">
<summary>5\) <code>None</code>이면 재생되지 않음</summary>

BGM, Ambient, UI, SFX 모두 <code>None</code>으로 두면 재생되지 않는다.

<code>PlayBGM</code>과 <code>PlayAmbient</code>는 <code>None</code>이면 기존 재생을 정지하도록 되어 있다.

</details>

<details markdown="1">
<summary>6\) 클립 미등록 시 재생되지 않음</summary>

해당 enum 타입이 <code>SoundManager</code>에 등록되어 있지 않으면 재생되지 않는다.

사운드가 안 날 경우 가장 먼저 등록 여부를 확인한다.

<code>SoundManager</code>는 미등록 타입에 대해 경고 로그를 출력하도록 되어 있다.

</details>

</details>

<details markdown="1">
<summary>9\. 사운드 추가 체크리스트</summary>

새로운 사운드를 넣을 때는 아래 순서로 확인한다.

- enum 타입이 추가되어 있는가
- <code>SoundManager</code> 인스펙터에 실제 클립이 등록되어 있는가
- 씬 기본 사운드면 <code>SoundProfile</code>에 값이 설정되어 있는가
- 플레이어 사운드면 <code>SoundProfile</code>에 플레이어 값이 설정되어 있는가
- UI 사운드면 <code>UISoundTrigger</code>가 붙어 있는가
- 오브젝트 사운드면 <code>SoundTrigger</code>가 붙어 있는가
- 오브젝트 로직에서 <code>Play()</code>를 호출하고 있는가
- 볼륨 / 2D / 3D 설정이 맞는가
- 실행 시 실제로 정상 재생되는가

</details>

<details markdown="1">
<summary>10\. 사운드가 재생되지 않을 때 확인 순서</summary>

1. <code>SoundManager</code>에 해당 클립이 등록되어 있는지 확인
2. enum 타입이 올바르게 선택되어 있는지 확인
3. <code>SoundProfile</code>에 값이 들어가 있는지 확인
4. 오브젝트에 맞는 스크립트가 붙어 있는지 확인
5. <code>Play()</code> 호출 또는 UI 이벤트 연결이 되어 있는지 확인
6. <code>None</code>으로 설정되어 있지 않은지 확인
7. 볼륨이 너무 낮거나 3D 거리 설정 때문에 안 들리는 건 아닌지 확인

</details>

---

<details markdown="1">
<summary>11\. 현재 사운드 시스템 구조 요약</summary>

- <code>SoundManager</code><br />프로젝트 전체 사운드 재생 및 클립 등록 담당
- <code>SoundProfile</code><br />씬별 기본 사운드 설정 담당
- <code>SoundController</code><br />씬 시작 시 프로필 적용 담당
- <code>PlayerSound</code><br />플레이어 사운드 담당
- <code>UISoundTrigger</code><br />UI 사운드 담당
- <code>SoundTrigger</code><br />오브젝트 상호작용 사운드 담당

</details>

<details markdown="1">
<summary>12\. 한 줄 정리</summary>

씬 기본 사운드는 <code>SoundProfile + SoundController</code>,

플레이어는 <code>PlayerSound</code>,

UI는 <code>UISoundTrigger</code>,

오브젝트 상호작용은 <code>SoundTrigger</code>,

실제 클립 재생은 <code>SoundManager</code>가 담당한다.

</details>
{% endraw %}
