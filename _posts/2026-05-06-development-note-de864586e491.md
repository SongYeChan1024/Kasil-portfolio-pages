---
title: "26-05-06"
date: 2026-05-06 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "Unity VR 환경 설정 및 Ray Interactor 실습 요약 오늘 수업 핵심 요약 Unity에서 VR 개발 환경 을 처음부터 설정하는 전체 과정을 배웠습니다. OpenXR 표준 프로토콜과 XR Interaction Toolkit 을 설치하여 VR 하드웨어와 통신하고 사용자 입력을"
description: "Unity VR 환경 설정 및 Ray Interactor 실습 요약 오늘 수업 핵심 요약 Unity에서 VR 개발 환경 을 처음부터 설정하는 전체 과정을 배웠습니다. OpenXR 표준 프로토콜과 XR Interaction Toolkit 을 설치하여 VR 하드웨어와 통신하고 사용자 입력을"
published: false
migration_id: "35e36532580e81d3b6d3de864586e491"
migration_status: "review_required"
migration_flags: ["publication_review", "source_citations_preserved_in_backup"]
---

{% raw %}
<b>Unity VR 환경 설정 및 Ray Interactor 실습</b> 


## 요약


### 오늘 수업 핵심 요약

- Unity에서 <b>VR 개발 환경</b>을 처음부터 설정하는 전체 과정을 배웠습니다.
- <b>OpenXR</b> 표준 프로토콜과 <b>XR Interaction Toolkit</b>을 설치하여 VR 하드웨어와 통신하고 사용자 입력을 받을 수 있도록 설정했습니다.
- <b>Ray Interactor</b>를 사용하여 VR 컨트롤러에서 광선을 발사하고 오브젝트와 상호작용하는 기본 메커니즘을 구현했습니다.
- VR 기기 없이도 <b>XR Device Simulator</b>를 활용하여 PC에서 VR 환경을 테스트하는 방법을 실습했습니다.
- 실제 게임 오브젝트(큐브)에 간단한 <b>상호작용 이벤트</b>를 연결하여 Ray가 닿았을 때 색상이 변경되도록 구현했습니다.

---

### 주요 개념 정리

- <b>OpenXR</b>
  - 설명: VR/AR 하드웨어와 통신하기 위한 표준 프로토콜
  - 예시: Meta Quest, Oculus 등 다양한 VR 기기와 연결
  - 사용되는 상황: VR 기기 연결이 필요한 모든 Unity VR 프로젝트
  - 헷갈릴 수 있는 점: 하드웨어 연결을 담당하는 것이지, 사용자 입력 처리는 XR Interaction Toolkit에서 담당함
- <b>XR Interaction Toolkit</b>
  - 설명: VR에서 사용자 입력을 받고 상호작용을 처리하는 Unity 패키지
  - 예시: 컨트롤러 조이스틱, 그립, 트리거 버튼 입력 처리
  - 사용되는 상황: VR 사용자 입력과 오브젝트 상호작용이 필요할 때
  - 헷갈릴 수 있는 점: OpenXR과 함께 사용해야 하며, 둘은 별개의 역할을 수행함
- <b>Starter Assets</b>
  - 설명: XR Interaction Toolkit에서 제공하는 샘플 에셋으로, 컨트롤러 프리팹과 입력 키맵을 포함
  - 예시: XR Origin 프리팹, Controller 프리팹, Input Action 설정
  - 사용되는 상황: 처음부터 입력 키맵을 만들지 않고 기본 설정을 활용할 때
  - 중요: 이것을 가져오지 않으면 컨트롤러 입력 키 값을 직접 만들어야 하는데 매우 어려움
- <b>Tracked Pose Driver</b>
  - 설명: VR 컨트롤러와 HMD의 실제 위치와 회전을 Unity 오브젝트에 반영하는 컴포넌트
  - 예시: Left Controller의 Position과 Rotation 추적
  - 사용되는 상황: VR 컨트롤러나 헤드셋의 물리적 움직임을 게임 내에서 반영할 때
  - 헷갈릴 수 있는 점: Input System과 연결해야 제대로 동작함
- <b>Interactor vs Interactable</b>
  - 설명: Interactor는 상호작용을 시작하는 주체(조종자), Interactable은 상호작용을 받는 대상(조종당하는 것)
  - 예시: Ray Interactor(컨트롤러) → Interactable(큐브)
  - 사용되는 상황: VR에서 오브젝트 간 상호작용을 설정할 때
  - 헷갈릴 수 있는 점: 둘은 항상 쌍으로 동작하며, 한쪽만 설정하면 작동하지 않음

| Interactor 종류 | 설명 |
| --- | --- |
| XR Ray Interactor | 멀리서 광선을 발사하는 방식 |
| XR Direct Interactor | 가까이 있는 오브젝트를 손으로 직 |
| Near-Far Interactor | 가까이는 손 |
| Poke Interactor | 찌르기 동작 |
| Gaze Interactor | 시선(HMD 카메라)으로 처리 |

---

### 수업 흐름별 정리

### 1. Unity 프로젝트 생성

- 설명: Unity Hub에서 새로운 VR 프로젝트 생성
- Unity 버전: 6.x LTS (UTS 버전)
- 템플릿: Universal 3D
- 프로젝트 이름: VR\_Test (또는 원하는 이름)
- 경로 설정: C:MyGitHubUnityVRProject 등
- 중요: Unity Version Control(UVC) 또는 GitHub 연동 가능

### 2. XR Plugin Management 설치

- 설명: VR 하드웨어와 통신하기 위한 OpenXR 플러그인 설치
- 메뉴 경로: <code>Edit &gt; Project Settings &gt; XR Plug-in Management</code>
- PC/Mac 플랫폼에서 OpenXR 체크
- Android 플랫폼에서도 OpenXR 체크 (Android VR 서비스 시)
- iOS 플랫폼에서는 Apple ARKit 체크 (선택사항)
- 중요: 체크 후 경고가 뜨지만 나중에 수정 가능

### 3. Profile 설정

- 설명: VR 기기별 프로파일 지정
- PC/Mac에서 설정: Oculus Touch Controller, Meta Quest
- Android에서도 동일하게 설정
- 프로파일을 지정하지 않으면 경고가 남음
- <code>Project Validation</code>에서 <code>Fix All</code> 클릭하여 자동 수정

### 4. XR Interaction Toolkit 설치

- 설명: 사용자 입력을 받기 위한 패키지 설치
- 메뉴 경로: <code>Window &gt; Package Manager</code>
- Unity Registry에서 검색: "xr"
- XR Interaction Toolkit 설치
- Starter Assets 샘플 Import (매우 중요)
- XR Device Simulator 샘플 Import (테스트용)

### 5. Starter Assets Import 후 설정

- Starter Assets Import 후 자동으로 팝업 표시
- <code>Fix All</code> 버튼 클릭하여 자동 설정 적용
- PC, Android, iOS 각 플랫폼에서 <code>Fix All</code> 실행
- 경고가 모두 사라질 때까지 반복

### 6. Unity MCP 연동 (선택사항)

- 설명: Model Context Protocol을 Unity에 연동하여 AI 지원 활용
- GitHub URL 복사: [https://github.com/CoplayDev/coplay-unity-plugin.git](https://github.com/CoplayDev/coplay-unity-plugin.git)
- 메뉴 경로: <code>Window &gt; Package Manager &gt; + &gt; Install package from git URL</code>
- URL 붙여넣기 후 설치
- Coplay 윈도우에서 Google 로그인하여 연동

### 7. XR Origin 설치

- 설명: VR 환경의 기본 프리팹 배치
- Hierarchy에서 마우스 우클릭 > XR > XR Origin (VR)
- 자동으로 Main Camera, Left/Right Controller 포함됨
- 기존 Main Camera는 삭제 가능

### 8. Controller 설정

- XR Interaction Toolkit > Starter Assets > Presets에서 프리팹 확인
- XR Origin 하위에 Left Controller, Right Controller 존재
- 각 컨트롤러에는 Controller Animator 스크립트가 이미 설정되어 있음

### 9. Tracked Pose Driver 설정

- Left Controller에 Tracked Pose Driver Input System 추가
- User Reference: XR HMD > Left Hand > Position, Rotation 선택
- Right Controller에도 동일하게 설정
- 중요: Tracked Pose Driver를 설정하지 않으면 컨트롤러가 동작하지 않음

### 10. Input Action 연결

- XR Interaction Manager 확인 (이미 설정되어 있음)
- XR > Default Input Actions 확인
- 모든 키 값이 사전 설정되어 있음 (Starter Assets 덕분)

### 11. XR Device Simulator 설정

- Package Manager > XR Interaction Toolkit > Samples > XR Device Simulator Import
- Hierarchy에 XR Device Simulator 프리팹 배치
- VR 기기 없이 PC에서 테스트 가능
- 키 조작: WASD (이동), U (HMD 조작), T/Y (컨트롤러 조작), G (그립/트리거)

### 12. Controller 회전 수정

- 플레이 시 컨트롤러가 반대로 돌아가 있는 경우
- Left/Right Controller 선택
- Y 값을 180으로 설정하여 정면 방향 조정

### 13. Mock Runtime 설정 (선택사항)

- <code>Edit &gt; Project Settings &gt; XR Plug-in Management</code>
- Mock Runtime 체크하면 실제 VR 환경처럼 테스트 가능
- VR 기기가 없을 때는 체크 해제가 편리함

### 14. Ray Interactor 생성

- Right Controller 하위에 빈 오브젝트 생성: XRRay
- Add Component > XR Ray Interactor
- Scene View에서 광선이 보임 (Game View에서는 기본적으로 안 보임)
- 플레이 시 Y 키를 눌러 컨트롤러를 움직이면 Ray가 움직임

### 15. 테스트용 Cube 생성 및 상호작용 설정

- Hierarchy > 3D Object > Cube 생성
- Cube를 정면에 보이도록 위치 조정
- Cube에 Add Component > XR Simple Interactable
- Interactable Events에서 Hover 이벤트 설정 가능

### 16. 색상 변경 스크립트 작성

- Scripts 폴더 생성
- MonoBehaviour Script 생성: ColorChange
- 스크립트에 색상 변경 로직 작성 (렌더러 머티리얼 색상을 랜덤으로 변경)
- Cube에 ColorChange 스크립트 추가

### 17. 이벤트 연결 및 테스트

- Cube의 XR Simple Interactable > Hover Entered 이벤트에 ColorChange 함수 연결
- 플레이 모드에서 Ray가 Cube에 닿으면 색상 변경 확인 예정

---

### 실습 / 작업 순서

1. Unity Hub에서 Universal 3D 프로젝트 생성 (Unity 6.x LTS)
2. <code>Edit &gt; Project Settings &gt; XR Plug-in Management</code> 에서 OpenXR 체크
3. <code>Window &gt; Package Manager</code> 이동
4. Unity Registry에서 XR Interaction Toolkit 검색 후 설치
5. Samples 탭에서 Starter Assets > Import
6. Samples 탭에서 XR Device Simulator > Import
7. 자동 팝업에서 <code>Fix All</code> 클릭 (PC, Android, iOS 각각)
8. <code>Edit &gt; Project Settings &gt; XR Plug-in Management &gt; OpenXR</code>에서 Profile 설정 (Oculus Touch, Meta Quest)
9. Hierarchy > 우클릭 > XR > XR Origin (VR) 생성
10. Left Controller에 Tracked Pose Driver Input System 추가, User Reference를 Left Hand Position/Rotation으로 설정
11. Right Controller에도 동일하게 Tracked Pose Driver 설정
12. Hierarchy에 XR Device Simulator 프리팹 추가
13. Play 모드에서 테스트 (컨트롤러 반대 방향 시 Y값 180 조정)
14. Right Controller 하위에 빈 오브젝트 생성 (XRRay), XR Ray Interactor 컴포넌트 추가
15. Hierarchy에 Cube 생성, 정면에 배치
16. Scripts 폴더 생성, ColorChange 스크립트 작성 및 Cube에 추가
17. Cube에 XR Simple Interactable 추가
18. Hover Entered 이벤트에 ColorChange 함수 연결

---

### 코드 / 설정 / 컴포넌트 정리

| 항목 | 내용 |
| --- | --- |
| 패키지 | XR Plug-in Management, XR Interaction Toolkit, OpenXR Plugin |
| 샘플 |  |
| 컴포넌트 | Tracked Pose Driver Input System, XR Ray Interactor, XR Simple Interactable |
| 프리팹 |  |
| Input Actions | XR Default Input Actions |
| Profile | Oculus Touch Controller, Meta Quest |

---

### 예시와 활용 사례

- <b>예시 1: Ray Interactor로 멀리 있는 오브젝트 선택</b>
  - 상황: 플레이어가 멀리 떨어진 버튼이나 아이템을 선택해야 할 때
  - 설명: XR Ray Interactor를 사용하여 광선을 발사하고 오브젝트와 상호작용
  - 왜 이 예시를 사용했는지: VR에서 가장 기본적이고 자주 사용되는 상호작용 방식
- <b>예시 2: Near-Far Interactor의 활용</b>
  - 상황: 가까운 오브젝트는 손으로 직접 잡고, 먼 오브젝트는 Ray로 선택
  - 설명: 거리에 따라 자동으로 상호작용 방식이 전환됨
  - 왜 이 예시를 사용했는지: 플레이어 경험을 자연스럽게 만들기 위해
- <b>예시 3: Gaze Interactor 시선 추적</b>
  - 상황: 손 컨트롤러가 아닌 HMD 시선으로 UI 조작
  - 설명: 카메라(시선)로 상호작용 처리
  - 왜 이 예시를 사용했는지: 컨트롤러 없이도 상호작용이 가능한 경우

---

### 헷갈릴 수 있는 부분

- <b>헷갈리는 개념</b>: OpenXR vs XR Interaction Toolkit
- <b>헷갈리는 이유</b>: 둘 다 "XR"이 들어가고 함께 설치하기 때문
- <b>구분 방법</b>: OpenXR은 하드웨어 연결(통신 프로토콜), XR Interaction Toolkit은 사용자 입력 처리
- <b>헷갈리는 개념</b>: Interactor vs Interactable
- <b>헷갈리는 이유</b>: 이름이 비슷하고 항상 같이 사용됨
- <b>구분 방법</b>: Interactor는 조종하는 주체(컨트롤러), Interactable은 조종당하는 대상(오브젝트)
- <b>헷갈리는 개념</b>: Tracked Pose Driver를 설정했는데도 컨트롤러가 안 움직임
- <b>헷갈리는 이유</b>: Input Action 연결이 누락되었을 수 있음
- <b>구분 방법</b>: XR Interaction Manager와 XR Default Input Actions이 제대로 연결되어 있는지 확인
- <b>헷갈리는 개념</b>: Scene View에서는 Ray가 보이는데 Game View에서는 안 보임
- <b>헷갈리는 이유</b>: 기본적으로 Game View에서는 Ray가 렌더링되지 않음
- <b>구분 방법</b>: Gizmos 버튼을 켜거나, 별도로 Line Renderer를 추가하여 시각화 가능

---

### 질문할 내용

- [ ] Starter Assets를 Import하지 않고 직접 Input Action을 만드는 방법은?
- [ ] Near-Far Interactor를 실제로 테스트해보고 Ray Interactor와 차이점 확인
- [ ] Poke Interactor는 어떤 상황에서 유용한지 실습 필요
- [ ] Mock Runtime 설정 시 실제 VR 기기 연결과 어떤 차이가 있는지 확인
- [ ] Left Controller에도 Ray Interactor를 추가하는 방법 실습 필요
- [ ] Game View에서 Ray를 시각적으로 보이게 하는 방법 확인

---

### 복습 체크리스트

- [ ] Unity에서 VR 프로젝트를 처음부터 설정할 수 있다
- [ ] OpenXR과 XR Interaction Toolkit의 역할 차이를 설명할 수 있다
- [ ] Starter Assets를 Import하는 이유와 중요성을 이해했다
- [ ] Tracked Pose Driver와 Input Action의 연결 방법을 알고 있다
- [ ] XR Device Simulator로 VR 환경을 테스트할 수 있다
- [ ] Ray Interactor와 Interactable의 관계를 이해하고 설정할 수 있다
- [ ] 다양한 Interactor 종류(Ray, Direct, Near-Far, Poke, Gaze)를 구분할 수 있다
- [ ] 컨트롤러 방향이 잘못되었을 때 Y값 180 조정 방법을 알고 있다


## 메모


<details markdown="1">
<summary>전체 받아쓰기 펼치기</summary>


자 그러면 이제 수업을 시작하도록 하겠습니다. 어제 연휴 잘 보내셨죠? 어제 어린이날이었는데 잘 보내셨죠?

이제 VR 수업을 하도록 하겠습니다 VR 수업은 별게 없어요 그죠? 그 지원하는 것은 그대로 쓰시면 됩니다. 교수님들 알겠죠? 그러니까 어떤 구성으로 이루어졌다고 어떤 구성으로 이루어졌고 어떻게 이제 우리가 잘 활용하느냐 메타에서 지원하는 것들을 잘 활용하느냐 이것밖에 없습니다. 지난 기억을 더 남기 위해서 이렇게 한번 해보겠습니다. 이렇게 새로운 프로젝트를 만들어 볼게요. 자 그러면 유니티 허브를 더블클릭 하겠습니다

됐나요? 자 그래서 1트허브를 내셨나요? 어? 두분이 안오신거같애 2분, 3분, 4분, 5분

자 됐죠? 자 그럼 새로운 프로젝트를 만들어서 기억을 더듬어서 또 우리 올해 나오니까 또 그죠? 자 그러면 새로운 프로젝트를 한번 열어보도록 하겠습니다

자 됐죠 새로운 프로젝트를 여시고 자 위버샷 3d 당연히 뭐 6점대

당연히 ATS버전 6점대를 선택해 주시면 되겠구요. 그 다음에 위버샷 3D 이렇게 하신 다음에 프로젝트 이름을 정해보겠습니다.

됐나요? 자 그러면 이렇게 하겠습니다. VR

자, 테스트입니다.

여러분이 마음대로 하세요. 저는 이렇게 찍겠습니다. 이렇게 하도록 하겠습니다. 됐죠?

자 요렇게 하시고 저는 이렇게 하시고 그 다음에 뭐 여기 여기서 뭐 정로를 설정해 주시면 되겠죠. C드라이브에 마이 기터브이 하겠습니다. 자 그런 다음에 기터브이 하셔도 되고

유니티프로젝트 안그러면 여기다가 VR프로젝트 유니티 VR프로젝트 따로 만들어서 하실래요? 차별을 하기 위해서


VR 프로젝트죠?

이렇게 따로 만들어서 이렇게 홀더 선택 이렇게 하셔도 되구요. 알겠죠? 그 다음에 set-source-geo.github을 할수도 있죠. unity-version.txt로 올릴수도 있죠. 이렇게 하는 개발자도 있죠.

uvc 그죠 그래서 uvc 로 하시는 개발자도 많이 많이 여러분은 github 으로 많이 이런 공간을 또 따로 마련해 줍니다. 유니티 버전 컨트롤러 UVC 서버 위치가 있죠. 저는 japan으로 해놨습니다. 아이시아, 노스트, 웨스트, 노스트 이스트, 재팬 이렇게 해놓으면 나만의 기타버튼을 올릴 수 있는 공간이 생기죠. 자 됐고 Universal 3D 프로젝트 생성할까요?

시간이 좀 걸리죠? 기다려보도록 하겠습니다. 시간이 좀 많이 걸립니다.

시청해주셔서 감사합니다!

오우 시간이 많이 걸리네요 그쵸? 이날 봄에 보도록 하겠습니다.

자 다 됐습니까 그럼 이제 기획을 되살려서 VR 환경을 구성해야겠죠 저번에 한거라서 빨리 하겠습니다 자 여기 갑니다 대리 프로젝트 세팅 빨리 하겠습니다 오픈XR을 받아야 되죠. 그러니까 표준 프로토콜, 통신을 하기 위한 하드웨어 표준 프로토콜 자 그래서 어디 가야됩니까 여기 이제 들어가서 xr-plugin-management 있죠 xr-plugin-management 클릭! 그 다음에 히트콜! xr-plugin-management

자 됐죠? 여기까지 나오셨죠? 그려봅시다

그쵸?

윤대식 레이슨이 아직 안 열렸어요.

저 좀 기다리겠습니다.

아직 열리는 중입니까?

자 그러면 봅시다 클릭하시면 천천히 가겠습니다 여기 xr 플러그인 매니지먼트 모셔가지고 오픈XR 그죠? 하드웨어 표준중심이죠 하드웨어

VR연결이라고 생각하시면 되요. 기기연결이라고 생각하시면 되요 오픈XR은 뭐 기기연결이라고 생각하시면 되요

자 됐죠? 됐습니까? 자 여기 또 뭐가 뜬다고요? 경고가 뜨는걸 확인하셨죠? 체크했더니 무시하시고 나중에 다 고치면 됩니다. 지금은 무시하셔도 됩니다. 그 다음에 뭐 안드로이드도 하고 싶다.

엑셀 플러그인 매니멘트에서

자 여기에서 뭐를 체크했어요? PC에서는 OpenXR 선택했죠? PC, MAC에서는 OpenXR 선택했고 뭐하고 싶다면 핸드로이드 플랫폼에서도 VR을 활용하고 싶다면 OpenXR 체크하시면 되겠죠. 근데 뭐 더 있어요. 구글 AR 코어도 있고, 목 HMD 이런 것도 있죠. 자, 오늘 저번에 얘기했고. 그 다음에 뭐 나는 뭐 아이오이스도 하고 싶다

iOS 에서도 하고싶다고 한다면 애플 AR 키트 이런거 뭐 설치 클리어 해 주셔도 되겠죠

뭐 설치 안하시면 상관없는데 뭐...

플랫폼을 넓게 쓸라입니다. 작업하다가 하시다가 VR 콘텐츠 제작하시다가 갑자기 핸드로이드하고 iOS도 서비스해야 된다 미리 체크해둔 게 낫죠.

제가 기다리라는 그림이 있습니다.

자 어떻습니까 체크 그 다음에 오픈해서 체크

그 다음에 PC나 맥버전에서는 체크, 안드로이드에서는 체크 OpenSR 체크 그 다음에 iOS는 뭐? Apple ARKit 체크 이렇게 해 주시면 되겠네요 그쵸?

이렇게 다 해주셨다면

자 아직 설치가 다 안되서

여기에 가니까 어때요? 이 밑에 뭐가 생겼나요? XR 플러그인 매니지먼트 애플 AR 키트 생겼죠? 4프로 XR 생겼어요? 그 다음에 프로젝트 VALIDATION 하니까 경고가 또 있네요. 경고가 또 있죠.

전부가 됐죠

뭐 또 있죠 그죠 또 있지만 아직 우리의 답 받지는 않아서 자 끄겠습니다 괜찮습니다 여기서 막 꺼버리겠습니다

됐죠? 이번엔 뭘 받아야됩니까? 자 인도 가서 내놓으셨어요? 자 내려가셔서 프로젝트 패키지 매니저로 가겠습니다 그래서 패키지 매니저

자 됐죠

자 여기 가신 다음에 유니티 레지스트링 가겠습니다.

루니티 레지스트라이죠? 레지스트리가 아니고 레지스트라잇 루니티 레지스트라잇 보셨어요? 여기다가 그냥 쳐보겠습니다. xr이라고 쳐봅시다. xr이라고 검색을 했다니 여러가지가 있는거죠. 우리는 여기서 뭐 xlflow인 매니지먼트는 설치가 되어있습니다. 무엇든지 이미 설치되어있죠. 그 다음에 OpenXR도 이렇게 설치가 되어있었죠. 그죠? 이 두개를 한번에 설치하기 위해서 아까처럼 했던거에요. 그렇죠? XR 플러그인 매니지먼트하고 오픈 XR 플러그인을 동시에 설치하기 위해서 아까 그렇게 했던거고

오버 넥서라, 표준통신이죠. VR끼리 기기가 연결되기 위한 표준통신 하드웨어라고 생각하시면 되겠고 그 다음에 여기 갑니다 이제. XR Interaction Toolkit. 유저의 입력, VR의 입력을 받으려면 그죠? 문자의 이메일로 받을려면 엑셀 인터넷 시스템은 풀빗이죠? 자, 인스토어로 하겠습니다.

자, 좀 기다리겠습니다.

자, 설치가 되었죠? 자, 이렇게 뜨네요. 자, 됐습니까? 자, 프리미엄 끄고

끝이 아니고 어디 가라 했어요. 제가 여기서 어디 가라 했어요. 얘를 가져와야죠. 샘플에 가서 뭐를 가져온다? 중요하죠 스타트 에셋 임포트 하시면 되겠죠 왜 합니까 스타트 에셋을 왜 가져와야 돼요 이거 안가져오면 어때요 우리가 뭐라고 해야 할까요? 인플루엑션 웨이러마켓 키를 직접 만들어야 되죠 킷값을 힘들죠 제가 이렇게 발전되기 전에 5-6년 전에 제가 직접 만들어봤는데 진짜 노가답니다. 일일이 맞춰가지고 키를 하나 만드는게... 그죠? 자, 그래서 3차에 걸렸던 걸로 기억하는데 그죠? 자, 스타트! 셋!

자 됐죠?

자 됐습니까?

자 어땠죠? 밑으로 내려가겠습니다.

이렇게 하니까 여기가 떠요. 자동으로 이렇게 뜨죠. 그럼 뭐 어떻게 하라고 그랬어요? Fix All 누르시면 된다고 제가 말씀드렸습니다.

끝이아닙니다. 좋았어요. 좋은 것 같죠? 안드로이드에서 픽스홀 눌러도 좋은 것 같습니다. 아이오셀 가서 픽셀 로드 오픈인거 같다 이거 그죠?


자 그러면 여기로 가겠습니다 그래서 여기 이제 그 pc 맥 버전하고 이거 쓰니까 경고가 하나 남아있네 이게 왜 경고가 하나 남아있을까 프로파일을 지정하지 않았죠 프로파일 기억나십니까? 자, 그래서 어떻게 해주셔야 돼요? 프로파일을 진행해주겠습니다. 클릭! 오픈XR 클릭! 어떻게 해줍니다? 여기 안드로이드죠? openxr-create 여기 안드로이드죠? 자 프로파일을 진행해주겠습니다. 우리는 뭐 이것만 하면 되겠습니다. 도플레스

다음에는 메타 캐스트, 이거 세 개만 할게요. 많이 할 필요도 없을 것 같아요. 이거 세 개만.

안드로이드 sb 걸이 어디가서 pc에 가서 지정해 줘야 되겠죠 pc에 가서 profile

그 다음에 어... 메타... 메타... 됐어요? 이 3개. 포크리스트 캐스트. 됐어요? 됐습니까? 그 밑에 프로젝트 발리디에이션 하나 됐죠? 뭐가 사라졌어요. 경고가 하나도 없네. 1도 안 봅시다.

여기도 경고가 하나도 없죠? 됐죠? 그 다음에 여기도

픽스 눌러줄게요

뺏겼어. 다 사라졌네. 맞죠?

됐습니까. 알아서 오류를 고쳐줍니다. 충돌을 할 수 있잖아요. 서로 충돌을 할 수 있죠. 그래서 충돌을 할 수 있는 거를 얘가 직접 고쳐줍니다. 픽스가 고치다 수리하다 이런 뜻도 있잖아요. 맞죠? 그쵸? 자, 다 됐나요?

자, 다 되었죠? 자, 끄고 자, 설치가 그러면 다 끝났네. 맞죠? 세팅이 다 끝났어요 마지막으로

자, 여기가 보도록 하겠습니다. 마지막으로

아 마지막이 낫다 자 제가 올려 드릴게요

유니티 mcp 연결이죠

모델 컨셉도 프로테크리죠

자 월학년이라도 재미나이 플래시학년이라도 재미났게요 여러분 또 프로 가위바위보 안하신 분도 많을 것 같아서 그냥 프로가 얼마입니까? 구글 AI 프로가 2만 5천원인가? 맞죠? 근데 통신사에서 결제하면 좀 싸던데

통사에 결제하니까 저는 이제 2만 9천 원이 아니고 만 5천 원에 그죠? 만 5천 원에 LG유플러스 유독서비스 유튜브에 나오죠 같이 가요 하면 동심사 결제할때 2만9천원을 내는게 아니고 이제 한 1만 5천원? 아 1만 9천원 VIP면 1만 5천원 그죠? 그렇게 이제 내고 저는 구글 AI 프로 가입이 되겠습니다. 알겠죠? 가입 되겠습니다. 뭐 때문에 하나요? 제가 뭐 때문에 하나요? 코드의 도움보다는 계획서, 계획서 잘 쓰더라구요 계획서를, 그죠? 계획서를 잘 쓰고 또

아시죠? 구글 바나나 프로 이미지 같은 것도 있고 써보셔서 아실 겁니다 mpc에 연동할 수 있어요. 알겠죠? 자, 그러면 얘를 복사 해드리고

여기죠

윈도우 가서 패키지 매니저 패키지 매니저 됐어요 자 그렇게 하신 다음에 클릭 윈티드 매니저 스크롤

install-packet-from-git-url

그 다음에 컨트롤 V 엔터 치시면 설치가 되죠.

자, 설치가 전환 다 되었습니다.

고고효

끝나요. 제가 크게 하겠습니다.

됐죠? 자 그러면 여기 core-play라고 생겼나요? 여기 core-play 생겼죠?

자 그래서 core-play라고 생겼고 toggle-window를 눌렀습니다.

가끔 이것밖에 없어요. 제일 간단합니다 제가. 밑에 mcp 종류중에 제일 간단하더라구요. 간단하게 쓸 수 있습니다. 어떤거는 포토자코, 포토보노 때문에 막 이해가 못되고 막 접속도 안되고 하다 끊기고 그런 MCP도 있어요. 알겠죠? 그래서 이해가 제일 편합니다. 그래서 커브 윈도우를 누르겠습니다. 눌렀나요? 누르면 이렇게 뜨죠?

그쵸? 그러면 뭐 하시면 되겠어요? 다운로드 다운로드 depend 하시면 자 화이팅 하겠습니다

누르시면 구글로 계속 이어가세요 저는 구글로 되겠습니다

자, 끄겠습니다.

할 때 저는 이렇게 간단하지만 할 때 뭐 통화키 얘기하고 그러거든요. 처음에는 통화키 전에 구글 통화키 말씀드렸죠.

됐어요 연동이 됐네요 그죠 됐습니까 그러면 mcp 한테 명령을 한번 내려볼까요

자 여기다가 자 적어보겠습니다. vr 안녕

설정을 위한

설치를 마크다운.md 파일로

이렇게 되었습니다. 별건 아니고

저는 요렇게 했다 이말이죠 프로포터로 요렇게 적었다

채팅창에 올렸죠?

마크다운으로 엔터를 칩니다.

그럼 이제 얘가 말하러 갈게요.

루트 파일에 기록을 해놓습니다.

자 기록하는건 냅두고 시간이 있으니까 알아서 얘가 기록할 때까지 기다릴 수는 없잖아 맞죠? 그래서 얘는 얘대로 일을 하긴 했다고 옆으로 빼버리세요 그럼 알아서는 질 그...

기록을 합니다. 아시겠죠? 제가 밖으로 빼고 제가 이렇게 하고 밑으로 내려놓을거에요.


자, 하는 중이죠. 냅두고 자, 냅두고요. 우리는 얘를...

플러스 누르겠습니다

XR이 있죠. 뭐가 더 추가가 됐어요? AR 디버그 메뉴 이런것도 있죠. 이런거는 AR을 하기위한 것입니다. 이제 저쪽으로 향해 가겠습니다. 맨 밑에 XR 오리지널 VR이 있어요 있습니까? 자 클리어 하겠습니다

됐죠?

아 저는 다 됐습니다, 벌써.

그쵸?

그냥 설치 순서를 기록해줘야 할 것 같아요.

그렇게 쭈욱 만들어주죠

자 만들어준 다음에 write to file 눌러주시면 생깁니다. 알겠죠? 자, 그래서

엔디파일이 생길거에요. 알겠죠? 그래서 생길거고. 그러면

자 그래서 밑에 뭐가 나오나요? successfull이라고는 없죠?

we are on the verses of guide.md

끝났어요.

밑에 짤은 떴습니다.

자 그래서 만들어졌는지 한 번 볼까요?

어디가 슬퍼


그럼 안녕

여기에 기록이 되어있을겁니다. 여깄네. 여기 로또에 기록하죠. 여기 svr setup guide 맞죠? 있습니까?

그런 다음에 마우스로 진짜 열기 하시면 뭐 비주얼 스튜디오로 열 수도 있고 비주얼 코드로도 열 수가 있죠. 이렇게 열었더니 문서를 만들어주네요 문서가 만들어진네 하나씩 만들어주죠

됐어요? 자 그러면 될까요 그거?

저는 이 명령을 한번 내려보겠습니다. 노션에 올려줘라고 할게요. 그냥. 근데 제가 조건이 있죠. 노션을 어떻게 만들어야 할지.

구글로로구인되게 만들었어요 그죠? 그러면 알아서 통화키를 가져오더라고 알겠어요 자

그래서...

이 명령을 한번 내려보도록 하겠습니다.

제가 링크를 한번 내려놓을께요. 자 VR 언더바 가이드죠.

오늘도 영상 봐주셔서 감사합니다. 다음 영상에서 만나요!


뭐 타이틀이요, 타이틀.

설치해 주시라고

이렇게 프로포즈를 찍었습니다.

자 그래서 미니언레를 보겠습니다.

그럼 이제 명령을 내리기로 하겠습니다.

자 그래서 리플레이스 아예

그럼 이제 올립니다 그죠? 이건 나중에 확인해보시면 되겠고 알겠죠?

자 됐어요 자 됐고 자 얘기를 합시다 이거는 뭐 나중에 확인해보면 되구요

그런데 혹시 여기를 봅시다 보여드리자

제가 노션을 해봤다고 합니다, 노션.

로그인 할께요

누굴 외동으로 보고 있나요?

인정으로 로그인 한거죠?

자 그래서 여기 보시면 여러가지가 있는데

요렇게 있죠

사실은 클로드에서 할때는 여기서 어떻게 해야될까요?

클라우드에서 할 때는 어떻게 해줘야 되죠? 연결을 해줘야 되죠.

연결을 해주셔야 됩니다. 그래서 여기도 통화키가 있고 그렇습니다. 잘 찾아보세요. 그죠? 그래서 근데 이제 저는 이제 구글 로그인이 안되시는 분이 계실 것 같아서 굳이 얘기하자면

자 그래서 저는 이렇게 쭉 만들어져 있어요 자 이렇게 벌렵고 여기보시면 클레이, 여기죠. 여기를 클릭하시면 이렇게 쭉 나오죠. 그래서 여기서 이제 그 그러셔서 셋팅을 하시면 되는데 저는 이미 셋팅이 워낙 잘 되어있다 보니까 이런데 자 내리시면 잘 알아보세요, 여러분.

이렇게 이제 하고 있죠. 자 그래서 뷰. 자 됐다고 나오네요 그죠? 자 자 만들어지셨는지 확인해보겠습니다.

자, 만들어졌네요 저는 만들어졌습니다.

자 여기보시면 이제

통화키는 이렇게 가시면 되겠죠. 통화키는 이렇게 이제 보여드릴께요. 만약에 VR 아니라면


자 됐죠?

자, 그니까 구글로 로그인 설정이 안되시는 분을 위해서 이렇게 이제...

말씀을 드리는거죠. 됐어요.

모션 API 키가 그렇다는 것이고 저는 이제 그... 이렇게 이제

만들어졌죠 자 그러면 봅시다 자 여기다 한 번씩 칠수할 때가 있어서 자 노션에 올렸니 물어볼까요

때려 놨네. 아이고. 때려 놨네.

노션 AI가 이 회의를 기록하고 있습니다.

자동으로 올려주는데 설정이 불편해서 그렇습니다. 그럼 나중에 또 할게요. 알겠죠? 그래서 여기보시면 클릭 여기서 이제 뭐 하셔야 돼요 내려서 나중에 노션에 올릴 때는 한꺼번에 풀리는 거니까 제가 오늘 이렇게 계록만 해 주겠습니다. 엔딩 파이브에. 알겠죠? 자, 일단 플레이.

됐죠? 자 펼치고 자 뭘 올렸어요? 여기 보시면 스타터가 있었죠?

스타터 에셋 펼치겠습니다. 프리팹 있나요? 프리팹 있죠? 자, 뭐로 올립니까? 프리패브에 보니까 컨트롤러가 있고 그 다음에 뭐 엑셀 컨트롤러 레프트 카메론 포셋

밑에 그 다음에 Right 이렇게 오르겠습니다.

올려놔요

내역도 올렸죠? 자 됐습니까?


됐나요? 자 그래서 이렇게 이제 올렸고 그 다음에 밑으로 내립니다. 컨트롤러가 이렇게 있죠. 저번에 하신대로, 저번에 하신대로 여긴 뭐가있죠? 컨트롤러가 있습니다. 컨트롤러, 확인하셨죠? 자 그런 다음에 여긴 뭐가있습니까? 끝!

컨트롤러 애니메이터가 있고 라이트가 있고 래프트가 있죠 자 그러면 우리 저번 시간에 배운 대로 여기도 이제 뭐 넣어야 되나요 자 여기 얘는 있죠

여기를 누르시면

조이스틱 움직이고 그립을 하고 트리거 를 누를 수 있게 엑셀컨트롤 래프트에서 V를 추가해 줍니다. 얘는 자동으로 잡아주니까 여기다가 쇼갑시다 자 트랙허드

트랙커드 포지, 임프시스템이 있죠 트랙커드 포지 드라이버 임프시스템

잘못놨다 이거 아니죠?

야, 손이 삐그댔네. 얘죠, 얘죠. 트랙허드 포즈, 드라이버 힘 푸쉬 템. 맞나요? 자, 그렇게 해서 어떻게 했어요? 클릭 유저 레퍼런스 유저 레퍼런스 유저 레퍼런스 하셔가지고 어떻게 했어요? 클릭 여기가 어디인가요? 레프터죠 자 적어보겠습니다 xre

레프트 쭉 내리겠습니다. 포지션이 있죠.

맞아요. 그 다음에 로테이션이네. 자, 빨리 합시다. 쭉 내리시면 로테이션 있죠? 그 다음에 얘도 클릭 XRD


그러면 어디에든 자 어디에든 하시면 됩니까 라이트에도 해줘야죠 라이트헤드 맞죠? 자 라이트헤드 해줍시다 자 그러면 10분간 쉬었다가 마저 하도록 하겠습니다 10분간 쉬겠습니다

시청해주셔서 감사합니다!

자 수업을 시작하도록 하겠습니다 제가 올려드렸는데 노션풍합키 그 다음에 페이지 업로드 새페이지 만든다음에 url 주소있죠 너만 좋으면 알아서 올려줍니다 알겠어요? 알겠습니까? 그럼 나중에 한번 해보도록 하겠습니다 자동 업로드 되려면 금방 엔디파이 맞는거 있죠? VR 가이드 설정 마크다운 클릭 로션 통화키 세 페이지 만든 다음에 업로드할 로션 페이지 링크만 얘한테 주면 얘가 자동으로 올려줘요. 알겠어요? 알겠습니다. 그리고 업로드 할 때 노션페이지 상단에 더보기를 누르고 연결 추가 해주시면 됩니다.

이것은 나중에 한번 진행해 보도록 하겠습니다 같이 알겠어요 중간중간 어느정도 만들어졌을때 같이 노션을 같이 올려 보도록 하겠습니다 자, 됐고. 됐죠?

자 이번에는 어디 가야 되겠어요? 라이트 가야 되겠죠? 자 레프트 갔고 이번에는 라이트 입니다. 클릭-드라이브-트래크드-포즈-드라이브-이퀘시트 똑같죠?

유저 레퍼런스 버전이 틀려서 이런게 안나오는 분도 계실겁니다. 저랑 버전이 틀려서 근데 이제 메뉴는 나오니까 클릭하시면 됩니다.

그리고 왜요? 라이트죠. 백사리.


됐습니까? 자 이거는 내려놓도록 하겠습니다.

이렇게 설정이 되었습니까? 됐죠?

이렇게 설정이 되었다면 아무리 트래커드 포즈 드라이브 잉크 시스템을 넣지 않으면 예를 하지 않으면 꽝, 말짱꽝이죠. 자, 인프로젝션 매니저 있죠? 펼치겠습니다.

자 그래서 펼치면 여기있어요 아 이미 들어가있네 엑스라이트 볼트 여쭤봅시다

자, 그래서

됐습니까?

여기 xre-default-input 액션을 살펴보도록 하겠습니다. 여기죠. 옙니다.

불을 다 해놨어요. 여기를 클릭

키값을 다 설정해놨죠. 그죠? 됐습니까? 이렇게 키값을 다 설정을 해놨습니다. 그렇죠? 얘랑 연결을 하셔야 됩니다.

자 됐습니까?

자 됐죠?

그래서 롤을 올려줘야 됩니까? 정상적으로 동작하는지 알아보도록 하겠습니다.

여기죠? 쭉 내리시면

샘플 디바이스 있죠? 때려 올리시면 되겠네요. 어? 안가져왔나? 제가 안가져간거 같아요. 다시. 자, 패키지 매니저.

위트 레지스 트라이 그래 안가져온거 같네 그치 그래서 따뜻한 에센스 가져왔고

XR 디바이스 시뮬레이터를 가져와야 되죠? XR 디바이스 시뮬레이터를 가져와서 임포트 하겠습니다.

자 됐죠?


자 들어갔죠 그래서 잘 되는지 한번 봅시다 자 그래서 여기 밑에 내리시면 xr 디바이스 시뮬레이터가 있고 엑셀 디바이스 시뮬레이터를 꺼내서 올릴께요. 됐나요? 자, 잘되는지 봅시다. 자, 그래서 자 플레이를 한번 눌러보세요 자 되는지 각자 확인하십시오 플레이를 해서 각자 확인하십시오

자 이게 돌아가있죠 돌아가있으면 어떻게 하라그랬어야 했는데 돌아가있네 우리 이거 y, w, a, s, d 되잖아요 그렇죠? 돌아가있죠. 돌아가있으면 제가 어떻게 하라그랬나요?

유니버셜 컨트롤러 선택

불닭 선택하신 상태에서 Y를 180로 하겠습니다.

됐어요?

자 유니버셜 컨트롤러 클릭 둘다 선택하시면 됩니다 뭐? Y값을

180 됐죠?

자 그래서 다시 플레이를 하시면 어떻습니까

네, 제대로 됐네. 자, 됐죠? 자, 그래서 P 누르시면 되죠? WASD U를 누르시면 HMD가 되죠. T나 Y를 누르시면 컨트롤러가 됩니다. 맞죠? 오늘 뭐 아쉬울거에요 자 됐어요 자 그래서 Y 누르시고 뭐 R 누르시면 이렇게 되죠 키를 누르시고 Y를 누르시면 이렇게 됩니다. 그리고 키는 우리가 다 알아야 될 것 같아요. 알겠죠? 여기까지 안 되신 분?

여기까지 안내신거에요? 얘기해주세요 윤대식 베이선이 된날 기다려릴까요?

운택시 레이선이 여기까지 됐어요. 여기까지가 지난 시간까지 되었네요.

자 윤대식 레이선이 됐나요?


그래서


자 우리가 배울게 오늘은 배울게 옙니다 오늘 배울거는 옙니다 자, 설명을 드리자면 자, 이게 좀...

오늘 배워볼 게 크리에이티브

시청해주셔서 감사합니다.

그 다음에 큰 주제만 얘기할게요. 두 번째, 로커모션 프로바이더 봐주셔서 너무너무 감사드리고, 안녕!

텔레포트죠?

자 시간이 되면 클라이밍 올라가려는거 됐습니까 자 요런것들을 한번 배워보도록 하겠습니다. 여기까지. 알겠죠? 자 그래서 큰 제목이니까 이렇게 기억하시고 여기까지 안되신 분 있나요?

여기까지 안될수도 있네.

없죠?

야 그래서

자, 없을 것 같아요. 자, 그래서

여기까지 안내신분

여기까지 안되신건 없죠? 자 그러면 이렇게 하고 LOVE ME

자, 여기다 이제 유니티 NPC한테 용량을 한번 내려볼게요. 우리 얘였잖아요. 이름이 뭐였죠? 다음 영상에서 뵙겠습니다. 안녕히계세요.

됬습니까? vr setup 파일이 있죠? handy 파일이 이렇게 적혀져 있죠?

자 여기다가 뭐 맥련을 한번 내려볼까요?

요렇게 했습니다 그냥. 모르겠죠?

자, 이렇게 했습니다.

별건 아니고

잠깐만요. 자 그래서 이렇게 치겠습니다. 휴가를 할까요? 알겠죠? 그건 나중에 또 알아보고. 자 윤덱실레이서님이 대기는 했는데 HMD 컨트롤러 같이 U하고 같이 잘 눌러야된다


저는 다시 한 번 불러야겠네요.

버튼을 눌러주면 알아서 만들어집니다.

그래서 마우스만, 마우스만 얻어요.

이렇게 뷰를 그냥 마우스만 움직여도 되죠.

그쵸? 그 다음에 T!

Don't worry. 이렇게 되지 않나요? 이렇게 돼야 되는데. 됐습니까?

자 윤덱시베이스님 혹시 이거 하셨어요?

자 됐죠? 들어갔느냐 봅시다.

자 여기서 마우스버튼 쇼잉 익스플로러 가서 VR 셋업 가이드가 추가됐나요?

그쵸? 답답해지죠? 그쵸?

좋은 내용이잖아.

엑셀 디바이스 시뮬레이터, 그 다음에 뭐 받은거, 위에 샘플, 샘플에 가서 그쵸? 뭘 받은거고. 어떻게 한달간 스타더 에셋 받은거고. 스타더 에셋 또 스타던거고. XR 디바이스로 시뮬레이션.

테스트한것을 엔비파이어 다 만들어 주네요 그죠? 알겠죠? 자 됐어요

자 그러면 보겠습니다

됐습니까? 자, 내립니다.

끌까요? 나중에 어느정도 만들어지면 나중에 통화키 같이 올려봅시다. 알겠죠? 끄고 자 됐죠 그러면 보도록 하겠습니다 이제 메일을 한번 해 보도록 하겠습니다

그래서 저번 시간에 이제 설정한게 있었죠 여기 EDIT 이렇게 하겠습니다 EDIT 프로젝트 세팅

자 엑셀 플러그인 매니지먼트 엑셀 플러그인 매니지먼트 런타인은 셰이딩하는것처럼 런타인디걸로 체크하면 됩니다. 실제 환경에서 테스트하는 것처럼 된다고 제가 말씀을 드렸습니다. 됐나요? 자 그래서

project-settings-open-xr-mock-runtime-debug 체크하시고 끄고 플레이를 다시 한번 눌러보겠습니다.

제가 눌러보시면

압박했달라 캐리죠

자, 테스트로

자 됐으니까 요거는 뭐 끄겠습니다 이렇게 나중에 이제 하시면 됩니다 그거는 이제 테스트 했을때 배우시면 되고. 지금은 그렇게 했습니다.

여러분 vr기기가 없기 때문에 이렇게 테스트하는게 편하실거에요

눌러진다는거. T나 Y를 눌렀을때, G를 눌렀을때 눌러지죠. 그 다음에 마우스 왼쪽부터 누르면 트리거 버튼이 눌러지고 W, A, S, B M, B M, B 이렇게 눌러집니다. G 됐죠?

자, 끄겠습니다. 여기까지는 우리가 저희가 했습니다. 자, 그래서 더 보도록 하겠습니다.


큐브를 하나 만들어 놓을 거에요 레이를 먼저 해보도록 하겠습니다 로우터 레이 로우터

레이죠 레이 자 레이는 뭐 유니티에서 강성 쏴서 뭐 그죠? 하는건 말이 세밭이기 때문에. 내려가겠습니다. 레이에 대한 신경을 사지 않겠습니다.

됐습니까? 자, 그렇게 됐고 자, 그런 다음에 자, 여기에 가겠습니다. 자, 그리고 그냥 이제

자 그러면 여기에다가 마우스로 누르겠습니다. 됐나요? 3D 오브젝트에 가시는 것 같아요. 큐브가 있죠. 큐브가 있으니까 플레이 하겠습니다.

피부를 만들었나요? 피부를 만들지 않습니다.


됐습니까? 자 이렇게 해서 저정말 좀 할까요? 가운데 주먹으로 가운데 주먹으로 가까이 있지만 가운데쪽으로 오겠습니다.

요정도는 좀 하겠습니다. 큐브 위치는 저랑 비슷하게 하시면 될 것 같아요. 큐브를 하나 만들고 위치는 이렇게 했습니다 이렇게 이제 설정을 해 놓으시면 되고 그래서 플레이를 했을 때 딱 정면에 보이게끔 부탁드리겠습니다.

정면에 보이죠? 됐습니까? 정면에 보입니다. W를 누르니깐 이렇게 이렇게 이렇게 이렇게 이렇게 이렇게 이렇게 이렇게 이렇게 가즈아! w-a-s-p 가즈아 이렇게 할 수가 있다 가즈아 근데 아직 우리는 이건 안했어요. P눌러서 원래는 어떻게 해야 돼요? WASD해야 가야 되는 거죠. 그거는 아직 안했습니다. 저희는. 그쵸? 착각하시면 안돼요 자 됐죠? 자 그러면 여기에 갑니다 여기가시냐면 자 오른쪽에 나와보겠습니다 라이트웨이

아까도 계속 얘기했지만 여기에서 컨트롤러 애니메이터 스크립트가 이미 설정이 되어있습니다. 길이 키가 다 이렇게 플로어 아디어스 리포터 값으로 알겠죠 그래서 그렇다는 것을 아시고 자 그래서 여기다가 이제 여기다가 빛나어 오브젝트를 하나 만들어서 레이 인트랙트를 만들어 보도록 하겠습니다 그러거든요. 자 자 그래서 이제

근데 뭐 여기보니까 여기를 놓아보세요

여기다가 Interact 를 한번 써볼까요? 여기다가 Add Component 를 넣으시고 Interact 를 쓰고 넣어봅시다.


자 인터랙터 여기 있습니까 굉장히 많은 인터랙터가 보이죠 그죠 그런데 우리가 이제 알아야 될 것은 이 트랙터가 기니까 우리가 알아야 할게 그 리얼, 리얼파 이 트랙터가 있죠. 그쵸? 그래서 또 여기 보니까 뭐가 있다. 인터랙터 보니까 뭐 니어, 니어, 파, 인터랙터 이렇게 보이시죠? 그 다음에 포크, 포크는 찌르기죠. 포크는 시르비, 그 다음에 인터렉터 다이렉트, 포크, 레이 이렇게 쭉 있습니다. 있습니까? 확인하셨죠? 자 그러면 이렇게 있는데 다양한 뭐 이렇게 인터랙트가 있습니다 자 그러면

자주 사용하는 것만 설명드리면 니얼파이트렉터 있죠? 얘는, 그, 그 할 때 씁니다. 가까이, 가까이 있는 오젝트는 손으로 잡고, 멀리 있는 오젝트는 뭐, 메인 트랙터 동일하게 방선을 반사합니다. 다시 한번 얘기할께요. 소금좀 알아둡시다. Near파 트랙터는 뭐다? 가까이 있는 object는 손으로 잡고요. 멀리 있는 object는 뭐? Rain 트랙터는 동일하게. 광선을 발사합니다. 그게 리얼 파악 인트랙트구요. 그 다음에 또 설명하자면 에이전에이


그쵸? 그니까 어떤 특정 옵젝트를 파기술을 진행했을 때, 이어팔 같은 경우는 가까이 가는 그 옵젝트를 그래브로 집을 수가 있죠 그쵸 그게 리얼팔 됐습니까 자 그리고 자 그 다음에 A같은거는 그냥 멀리서 강성소는 역할을 수행하는거죠 여기 보시면 뭐 자 레이. 레이가 있죠. 레이는 뭐 레이같은 경우에는 멀리서 강전 쏘는 역할을, 역할밖에 수행하지 못해요. 그죠? 레이 같은 경우는 그냥 멀리서 강성소는 역할밖에 수용하진 못하지만 얘는 지금 어때요? 가까이 가거나 그죠. 혹은 멀리 있을 때 다른 상유장을 일으킬 수 있는 거죠. 그렇게 기여하시면 되겠고

그 다음에 포크같은거는 찌르기. 누르시면 포크가 있죠. 찌르기. 어떤 게임 같은 경우는 찌르기 동작이 있을 수 있죠. 그래서 포크는 찌르기라고 생각하시면 되겠고 자 그래서 그거는 나중에 뭐 테스트 한번 해보도록 하구요 여러가지가 이렇게 나와있습니다 자 그러면 자 다이렉트는 강선이 아니죠 여기 보시면 뭐

여기 보시면 Direct는 강선이 아닙니다. XR Direct Interact 얘는 메인 시스템이 아니고 가까이 있는 옵젝트를 손으로 잡을 때 많이 사용하는 기능입니다.

그리고 또 뭐가 있냐면 게이지 있죠. 시선 따라. 손에 있는 양성 컨트롤로 처리하는게 아닌 HMD 카메라로 처리하는게 상호장악이 일으키는게 게이즈 입니다. 게이즈는 시선 처리할때 시선으로 상호장악이 일으킬 때 그렇게 생각하시면 되겠습니다 자 그래서 셀렉터 같은 기능에 트리거 할 때만이야 합니다 그리고 뭐 가장 많이 쓰는거는 레이하고 near par 정도만 많이 그 다음에 near par 정도하고 direction, direct, xrdirect, interact 이것만 좀 기억해 주세요.

게임의 특징에 따라서 포크도 많이 사용하고 있습니다. 자 그러면 우리가 여기에 가장 많이 사용하는 레일을 한번 사용해 볼 건데 여기에서 우리가 뭘 할 수 있어? 레이 xr 레이 해서 여기다 직접 그죠 뭐 XLA인터랙트에서 여기다 설치를 할 수 있을텐데 우리는 따로 따로 어때요 변화를 하겠습니다 자 그러면 그래서 빈 Object를 만들겠습니다.

자 여기다가 오른쪽이죠 라이트에다가

라이트죠? 이건 컨트롤 로고 자 그럼 여기다 클릭 마우스 오른쪽 버튼 빈 오젝트를 하나 만들겠습니다. Create Empty

자 일단 치겠습니다. 자 됐습니까? xrray라고 하신 다음에 자 여기에다가 XR에 인트랙터를 달겠습니다. 클릭 XR 인트랙터


이렇게 안 보이시는 분. 그래서 이게 다입니다. xr-ray-interactor 컴퍼넌터를 설치한게 다입니다. 아시겠죠 자 그래서 이거면 됐죠 그래서 어떤 차이가 있습니까 있고 없고 이 차이 얘를 없애면 어때요 무섭거나 해를 없애면 이므 칸판을 닫으시면 광선이 사라지죠. 그죠? 그래서 익사인프렉트를 설치하면 이렇게 광선이 보이게 됩니다. 자 그래서 신비유를 봐주시면 되겠네요 신비유. 알겠죠? 자 그래서

됐습니까?

자 됐어요. 그래서 엑셀레이를 더블클릭을 하시면 이렇게 선이 이제 움직이는게 보이시죠? 게임 뷰에서는 안보이죠? 당연히. 팀 뷰에서는 보이지만, 당연히 뭐. 게임 뷰에서는 보이지 않습니다. 자, 그래서 우리가 이거 가지고 레인 처리를 할 수 있습니다. 그래서 어떤 대의 처리를 할 수 있는지 봅시다.

짱!

그래서 플레이 해봐야 보이지 않죠. 플레이 해봐야 보이지 않습니다. 상호작용을 해야되는데 그죠? 자 그러면 자 그래서

일단 플레이를 한번 해보시죠.

그래서 Y를 누르시고 이렇게 움직이면 되요. 레이가 이렇게 움직이죠. 레이가 이렇게 움직입니다. 됐어요? 이렇게 움직이는게 보이시죠? 자 됐나요?

보이실겁니다. 그래서 이렇게 이제 달라지는게 보일겁니다. 그러면 봅시다.

자 됐죠? 자 그래서 이제 이렇게 보이신다는 것을 제가 말씀드린 것이고 자 그래서

요거를 이제 감지를 하겠죠. 요거를 이제 감지를 하겠죠. 알겠어요? 그래서 오른쪽만 달았습니다. 그죠? 그런데 뭐 여기 기즈모를 껐다가 안 보인다 하시는 분이 계실까봐요. 기즈모를 껐다가 껐다가 보이죠? 여기입니다 여기. 혹시 안 보인다는 분이 계실까봐요. 여기있죠? 끝에 토글 비즈빌리티 버그 기준 그죠?

기즈모를 켰다 켰다 하면서 보시면 이렇게 보입니다. 그래서 게임에서는 방선이 보이지 않을거에요. 보이게 만들게 할 수도 있고. 됐죠? 자 그러면 봅시다. 자 이번에는 이렇게 한번 해보도록 하겠습니다.


자 그래서 이제


신비위에는 보이지 않는다. 그 말인거죠.

여기에 닿았을때 뭔가가 상호작용을 할수있게 그렇게 한번 해보도록 하겠습니다. 레이가 큐브를 검지하면 상호작용이 일으킬수도 있습니다. 한번 해보도록 하겠습니다.

자 그러면 봅시다

레이랑 부딪혀야 되겠죠. 레이랑 큐브랑 충돌했을때 상호작용이 일어나야 되겠죠.

자, 그래서 끄도록 하겠습니다.

자 그럼 이제 스크립트를 하나 만들어 보도록 하겠습니다.

자 마우스 오른쪽부터는 create 폴더

스크립트라는 툴을 하나 만들어주세요. 이렇게 만드셨어요. 스크립트라는 툴을 하나 만들어주시고 스크립트를 하나 만들어줬죠. 근데 이제 우리가 2022버전 쓰신 분이 많은데 자 그래서 요렇게 이제 그 하시면 될 것 같아요. 자 그래서

시청해주셔서 감사합니다.

스크립트에서 마우스 오른쪽 버튼을 클릭하시면 스크립트가 사라지고 6점대에서 뭐라고 되어있어요? 모노베이비의 스크립트라고 되어있죠. 그래서 플레이가 있어요. 그래서 간단하게 칼라 체인지 라고 할까요.

자 됐습니까?

자 그래서 이 ColorChange라는 스크립트를 하나 만들어 보도록 하겠습니다

안녕

열어보도록 하겠습니다. 시간이 걸리네요.

kshapscript는 지금 뭐로 바뀌었습니까? mono-vbscript로 바뀌었다는거고, 자 열어보도록 하겠습니다.

비지얼 스튜디오로 열든, 비지얼 코드로 열든 상관없어요. 컷셀 열든 상관은 크게 없습니다. 그러면 이제 굉장히 간단한 것만 넣어 보도록 할게요.

자, 축하합니다.


자, 포인트


첸지

맨들어라고 써져있는데 esc키를 누르지 맨들어라고 써져있어


이렇게 마저 해보도록 하겠습니다. 결자가 맞는지 모르겠네. 그렇게 만들어 주셨습니까? 그래서 레이가 닿았을때 색깔이 변경되게, 큐브 색상으로 변경되게 저렇게 한번 해보도록 할게요.

포도색상은 색상이 랜덤하게 표현되게 하겠습니다. 자 그러면 바이

이렇게 컴퍼넌트 렌드로

이렇게 찍으셨어요? 이렇게 찍으셨으면 렌더러 마테리얼


자 노트뉴을 큰일나죠


개인기겠네. 랜덤 컬러

자 이렇게만 해보도록 하겠습니다.

자 이것만 있으면 됩니다. 자 됐고 자 그래서 뭐 빌드 하시고

시청해주셔서 감사합니다.

얘를 큐브에 넣어 보도록 하겠습니다

자..필드 하신다음에.. 자 내립니다.

최고의 플레임을

엘리베이터를 누르셨어요.

자, 그러면... 자, 그래서...

그래서 콜라이드만 갖고 있으면 레이 시스템은 충돌이 다 간지하죠. 자 그러면

그쵸? 자 그래서 이렇게 됐다는거지 그러면 어디서 충돌건대 할까요? 당연히 여기죠 여기에서 방탄 쏘는걸로 충동을 감지하겠죠. 자 그래서 광선을 쏘는 작업은 만들고 있고 자 그래서


인터랙티브를 쳐보도록 하겠습니다.

여기다가 클릭

근데 인터렉터블 종류가 여러가지가 있죠

자, 이어드리겠습니다.

자 그래서 여기로 보시면

자, 쳐 보도록 하겠습니다.

자 인터렉트를 인트로

여기 있죠?

이렇게 쭈욱이 튀는데 인터랙터를... 자 그래서 우리는

자, 얘를 선택하도록 하겠습니다.

클릭, 엑사일, 엑사일 이라고 하시고 심플 이라고 하셔도 됩니다.

심플 인터렉터블을 찾아보겠습니다. 여기있네. 됐어요? 인터렉터블 인터랙터는 조종자고 인터랙터 불은 조종당하는거 그렇게 구분하시면 되겠네요. 자 그래서 Interact는 조종하는 대상 object 조종하는 대상이고 조종하는 것이고, 조종당하는 것은 뭐예요? 인터렉터블이죠. 자, 됐나요? 그러면 이 밑에 내려가 보겠습니다. 밑에가 인터렉터블 이벤트. 여기 보니까 이벤트 각주가 있습니다. 이벤트를 넣는 방식과 동일한 방식이죠. 그래서 여기다 펼쳐보도록 하겠습니다.

자 그래서 인터랙티브 쭉 내려가니까 뭐 할게 너무 많은데 자 그래서 나중에 한 분씩 다 설명해 드리도록 하겠습니다 후보하고 뭐 이런건 다 아실테고, 퍼스트, 라스트, 후보, 그쵸? 나갔을때, 엑시티는 뭐, 엑시티는 뭐? 빠져나갔을때 이런거 잖아요. 그죠? 자 그래서 요런게 있고 그 다음에 뭐 여러 종류가 이렇게 있습니다. 자 그래서 포커스가 있고 라스트 포커스, 액티베이팅, 요렇게 자 하나씩 한 개씩 다 설명해 보도록 할게요 나중에 자 그러면 봅시다 자 그래서 뭐 셀렉터도 있는지 찾아 봅시다

셀렉터도 있네. First Last 셀렉터 그죠? 선택했을때, 잡았을때 그죠? 그렇습니까 이런것도 다 있습니다. 자 그래서 퍼스트 라스트 포커스도 있고 일반 포커스가 있는 것도 확인할 수가 있어요 그죠. 자 그러면 first, last, focus에 한번 넣어보도록 하겠습니다. 이벤트를 넣어줄 수가 있죠. 음 그래서 우리가 이제 그 요구를 이제 만들어줄 수가 있습니다 자 그러면

자

자, 여기도 한번 넣어볼까요? 포커도 넣어줄 수 있어요. 빈 오젝트가 하나만 들어서

뭐라고 하시냐면 포크레이라고 할게요. 포크는 찌르기로 했죠.

포크라고 칠까요? XR

xr, fork, p, o, k, e fork인터렉터 있죠? 그래서 포크리프트 렉터에도 넣어줬습니다. 이런식으로 넣어줄수가 있습니다. 됐죠? 자 그러면 보도록 하겠습니다. 그래서 굉장히 많은 인트랙트가 존재하는데 그래서 큐브에 다시 와서 그래서 퍼스트 라스트 후보 그걸 살펴보도록 하겠습니다. first, last 후보 있습니까? 자 그러면 여기다가 이제 이벤트를 만들어 보도록 하겠습니다. 후보, 후보 입력을 이제 받게 되는 거죠. 자 그래서 됐습니까? 자 그래서 미리 플러스를 눌러 놓을까요?

미리 브러쉬를 눌러서

이렇게 이제 해주시면 되겠네요. 자 됐습니까? 자 나중에 밑에 내려가시면 또 셀렉터도 많이 쓰거든요. 셀렉터도 찾아보세요. 그것도 많이 쓰니까 같이 알아둬 주십시오.

자 그래서 이 부분입니다. 저희가 할 부분은 director-event 입니다. 그죠? 자 그래서 택시들은 나갔을때고. 그죠? 자 그래서 그렇게 된다는 걸 말씀드리겠습니다. 자 그러면

됐습니까? 자 그래서 색깔이 변하는지 우리가 나중에 한번 알아보도록 하겠습니다. 자 그러면 일단은 49번이니까 요렇게만 해보겠습니다. 여기를 셀렉터 있죠 셀렉터 여기를 클릭 그렇게만 해놓겠습니다 나중에 넣어서 다 할거라서 알겠죠? 자, 그러면 49분이네요. 자, 그러면 그러면 49분이에요. 자, 10분 가까이... 아, 점심시간이죠? 점심 식사하고 1시에 뵙도록 하겠습니다. 식사만 시켜 주십시오.


유튜브 친구들 반갑습니다 엔코르입니다 오늘 영상은요 2화 영상 가지고 왔습니다 이미 이 내용 관련해 가지고 다른 크리에이터 분들 영상 많이 보셨을 거에요 저도 똑같은 얘기를 하긴 할 건데 조금 더 디테일하게 할 겁니다 그래서 제가 약간 과장해서 말씀드리면 오늘 영상만 끝까지 보시고 머릿속에 넣어 놓으시면 앞으로 2화 안에서 파티 조합하는 거 그냥 여러분들이 알아서 다 제가 오늘 말씀드리는 거는 얘랑 얘를 써라 이렇게 이렇게 조합해라 이런 정답지를 만들어 드리는 게 아니라 콕티 조합을 어떻게 해야 되는지 이 이론을 말씀드릴 겁니다 그래서 오늘 영상에서는 전투 영상 이런 거 없어요 이론에 대해서 말씀드릴 거고 이 내용만 차분히 잘 따라와 주시면 너무 좋을 것 같습니다 바로 시작해 볼게요 오른쪽에 있는 사이클 저거 많이들 보셨죠 이완이 가지고 있는 폭성 사이클이에요 이거를 일단 처음에는 머릿속에 넣어놔야 됩니다

이 12시부터 시작해가지고 1시, 5시, 6시, 7시, 11시에 있는 이 속성들 빛, 령, 주, 암, 혼, 상 요거는 외워줘야 된다. 이것조차 외우기 싫다.

</details>


<b>Unity VR Ray Interactor 이벤트 및 Locomotion 설정</b> 2026-05-06


## 요약


### 오늘 수업 핵심 요약

- <b>Ray Interactor의 이벤트 시스템</b>(Hover, Select, Activate)을 활용하여 VR에서 오브젝트와 상호작용하는 방법을 배웠습니다.
- <b>XR Interactor Line Visual</b>을 추가하여 Ray를 시각적으로 표현하고, Line Renderer를 통해 색상과 그라디언트를 커스터마이징하는 방법을 실습했습니다.
- <b>Locomotion System</b>의 핵심인 이동(Move)과 회전(Turn) 기능을 Dynamic Move Provider와 Snap Turn Provider를 사용하여 구현했습니다.
- VR 게임의 표준 컨트롤 방식인 <b>왼손 조이스틱으로 이동, 오른손 조이스틱으로 회전</b>하는 설정을 완성했습니다.
- <b>Teleportation Provider</b>를 설정하고 텔레포트 기능을 구현하기 위한 기초 작업을 시작했습니다.

---

### 주요 개념 정리

- <b>Interactor Events</b>
  - 설명: Ray Interactor에서 발생하는 상호작용 이벤트로, Hover, Select, Activate 등이 있음
  - 예시: Hover Entered (Ray가 오브젝트에 닿았을 때), Hover Exited (Ray가 오브젝트를 벗어났을 때)
  - 사용되는 상황: 오브젝트 하이라이트, UI 버튼 상호작용, 오브젝트 선택 및 조작
  - 헷갈릴 수 있는 점: 각 이벤트가 언제 발생하는지 구분 필요
- <b>Hover vs Select vs Activate</b>
  - Hover: Ray가 오브젝트에 닿거나 떨어질 때 발생 (색상 변경, UI 표시에 사용)
  - Select: Grab 버튼을 눌러 오브젝트를 잡는 순간 발생 (오브젝트 선택)
  - Activate: 오브젝트를 선택한 상태에서 추가 입력(트리거 등)을 줄 때 발생 (총 쏘기, 전등 켜기 등)
- <b>XR Interactor Line Visual</b>
  - 설명: Ray Interactor에 시각적 라인을 추가하는 컴포넌트
  - 예시: Ray에 색상을 입히거나 그라디언트 효과를 적용
  - 사용되는 상황: 플레이어가 Ray의 방향과 길이를 시각적으로 확인할 수 있도록 할 때
  - 헷갈릴 수 있는 점: Line Renderer의 Material 설정이 Default Line으로 되어야 색상이 제대로 적용됨
- <b>Locomotion System</b>
  - 설명: VR에서 이동, 회전, 텔레포트 등의 동작을 통합 관리하는 시스템
  - 예시: 조이스틱으로 이동, 회전, 텔레포트로 순간이동
  - 사용되는 상황: VR 게임에서 플레이어 이동이 필요한 모든 상황
  - 중요: Locomotion은 "이동"이나 "보행"을 의미하며, 이동 관련 기능을 중재하는 역할
- <b>Locomotion Mediator</b>
  - 설명: 여러 이동 방식(Move, Turn, Teleport)을 중재하고 우선순위를 관리하는 컴포넌트
  - 예시: 왼손과 오른손 조이스틱을 동시에 누를 때 어느 입력을 우선 처리할지 결정
  - 사용되는 상황: 여러 Locomotion Provider가 동시에 작동할 가능성이 있을 때
  - 헷갈릴 수 있는 점: Mediator는 중재자 역할로, 각 Provider에 우선순위(Transformation Priority)를 부여함
- <b>Dynamic Move Provider</b>
  - 설명: VR에서 조이스틱을 이용한 이동을 처리하는 컴포넌트
  - 예시: 왼손 조이스틱으로 WASD 이동
  - 사용되는 상황: 플레이어가 물리적으로 이동하지 않고 조이스틱으로 이동할 때
  - 헷갈릴 수 있는 점: Left Hand Move Input과 Right Hand Move Input을 각각 설정해야 함
- <b>Snap Turn Provider vs Continuous Turn Provider</b>
  - Snap Turn: 45도씩 딱딱 끊어서 회전 (VR 멀미 감소)
  - Continuous Turn: 연속적으로 부드럽게 회전 (자연스럽지만 어지러움 유발 가능)
  - 사용되는 상황: Snap Turn이 일반적으로 많이 사용됨
  - 헷갈릴 수 있는 점: 대부분의 VR 게임은 멀미 방지를 위해 Snap Turn을 기본으로 사용함

| 이벤트 종류 |  |
| --- | --- |
| Hover Entered | Ray가 오브젝트에 처음 닿았을 때 |
| Hover Exited | Ray가 오브젝트를 벗어났을 때 |
| Select Entered | Grab 버튼을 눌러 선 |
| Activate | 선택 상태에서 추가 입력 시 |

---

### 수업 흐름별 정리

### 1. Hover Event와 Activate Event 연결

- 설명: Cube에 XR Simple Interactable을 추가하고, Hover Entered 이벤트에 ColorChange 함수를 연결
- 예시: Ray가 Cube에 닿으면 색상이 랜덤으로 변경됨
- 중요한 이유: Ray Interactor의 기본 이벤트 시스템을 이해하고 활용하는 첫 단계

### 2. XR Interactor Line Visual 추가

- 설명: XR Ray에 Line Visual 컴포넌트를 추가하여 Ray를 시각적으로 표현
- 예시: Scene View에서는 보이지만 Game View에서는 기본적으로 보이지 않음
- 중요한 이유: 플레이어가 Ray의 방향을 확인할 수 있도록 시각 피드백 제공

### 3. Line Renderer 커스터마이징

- 설명: Line Renderer의 Color, Gradient, Width 등을 조정하여 Ray 모양 변경
- 예시: 그라디언트를 적용하여 Ray 시작점과 끝점의 색상을 다르게 설정
- 중요: Material을 Default Line으로 설정해야 색상이 제대로 적용됨

### 4. Allow Hover to Activate 설정

- 설명: Keep Selected Target Valid와 Allow Hover to Activate를 체크하여 Hover 상태에서 Activate 처리 가능하도록 설정
- 예시: Ray가 오브젝트에 닿은 상태에서 트리거를 눌러 추가 동작 실행
- 중요한 이유: Hover와 Activate를 함께 사용하려면 반드시 설정 필요

### 5. Activate Input 설정

- 설명: XR Ray Interactor의 Input Configuration에서 Activate Input과 Activate Value를 설정
- 메뉴 경로: <code>XRI Right Interaction &gt; Activate</code>, <code>XRI Right Interaction &gt; Activate Value</code>
- 중요한 이유: Input 설정이 없으면 Activate 이벤트가 발생하지 않음

### 6. Locomotion 기본 구조 설정

- 설명: 빈 오브젝트를 생성하고 Locomotion Mediator를 추가 (XR Body Transformer 자동 추가됨)
- 예시: Locomotion 하위에 Move, Turn, Teleportation 등을 구성
- 중요한 이유: Locomotion Mediator가 여러 이동 방식을 중재하는 역할 수행

### 7. Dynamic Move Provider 설정

- 설명: Move 오브젝트에 Dynamic Move Provider를 추가하고 입력 설정
- Forward Source: Main Camera
- Head Transform: Main Camera
- Left Hand Move Input: XRI Left Locomotion Move
- Right Hand Move Input: XRI Right Locomotion Move
- 중요: Transformation Priority를 3으로 설정

### 8. Snap Turn Provider 설정

- 설명: Turn 오브젝트에 Snap Turn Provider를 추가하고 회전 각도를 45도로 설정
- Left Hand Turn Input: XRI Left Locomotion Turn
- Right Hand Turn Input: XRI Right Locomotion Snap Turn
- 중요: Transformation Priority를 1로 설정 (Turn이 가장 우선)

### 9. 왼손 이동, 오른손 회전 설정

- 설명: 일반적인 VR 게임 방식대로 왼손은 이동만, 오른손은 회전만 담당하도록 설정
- 방법: Move에서 Right Hand Move Input 제거, Turn에서 Left Hand Turn Input 제거
- 중요한 이유: 왼손은 이동, 오른손은 회전이 VR 게임의 표준 컨트롤 방식

### 10. Teleportation Provider 준비

- 설명: Teleportation 오브젝트를 생성하고 Teleportation Provider 추가
- 중요: Teleportation을 하려면 Teleportation Area와 Teleportation Anchor가 필요함

---

### 실습 / 작업 순서

1. Cube의 XR Simple Interactable에서 Hover Entered 이벤트에 ColorChange 함수 연결
2. XR Ray에 XR Interactor Line Visual 컴포넌트 추가
3. Line Renderer의 Material을 Default Line으로 변경하여 색상 적용
4. Line Renderer에서 Color Gradient와 Width Curve를 조정하여 Ray 모양 커스터마이징
5. XR Ray Interactor에서 Keep Selected Target Valid와 Allow Hover to Activate 체크
6. Input Configuration에서 Activate Input을 XRI Right Interaction Activate로 설정
7. 빈 오브젝트 생성 후 이름을 Locomotion으로 변경, Locomotion Mediator 추가
8. Locomotion 하위에 Move 오브젝트 생성, Dynamic Move Provider 추가
9. Move의 Forward Source와 Head Transform을 Main Camera로 설정
10. Left Hand Move Input을 XRI Left Locomotion Move로, Right Hand Move Input을 XRI Right Locomotion Move로 설정
11. Locomotion 하위에 Turn 오브젝트 생성, Snap Turn Provider 추가
12. Left Hand Turn Input을 XRI Left Locomotion Turn으로, Right Hand Turn Input을 XRI Right Locomotion Snap Turn으로 설정
13. Transformation Priority 설정: Turn = 1, Teleportation = 2, Move = 3
14. 왼손 이동, 오른손 회전으로 변경: Move에서 Right Hand 제거, Turn에서 Left Hand 제거
15. 바닥 Plane 생성 후 Scale을 (5, 1, 5)로 설정하여 이동 테스트 공간 마련
16. Play 모드에서 T 키로 왼손 조이스틱, Y 키로 오른손 조이스틱 조작하여 이동 및 회전 테스트

---

### 코드 / 설정 / 컴포넌트 정리

| 항목 |  |
| --- | --- |
| 컴포넌트 | XR Interactor Line Visual |
| 컴포넌트 | Line Renderer |
| 컴포넌트 | Locomotion Mediator |
| 컴포넌트 | Dynamic Move Provider |
| 컴포넌트 | Snap Turn Provider |
| 컴포넌트 | Continuous Turn Provider |
| 컴포넌트 | Teleportation Provider |
| Input Actions | XRI Left/Right Interaction Activate |
| Input Actions | XRI Left/Right Locomotion Move |
| Input Actions | XRI Left/Right Locomotion Turn |
| 설정값 | Turn Amount (Snap Turn) |
| 설정값 | Transformation Priority |
| Material | Default Line |

---

### 예시와 활용 사례

- <b>예시 1: Hover 상태에서 Activate 처리</b>
  - 상황: Ray가 오브젝트에 닿은 상태에서 트리거를 눌러 추가 동작 실행
  - 설명: Keep Selected Target Valid와 Allow Hover to Activate를 체크
  - 왜 이 예시를 사용했는지: Grab 없이 Ray만으로도 오브젝트를 조작할 수 있도록 하기 위해
- <b>예시 2: Line Renderer 그라디언트 설정</b>
  - 상황: Ray의 시작점과 끝점에 다른 색상을 적용하여 시각적 효과 강화
  - 설명: Color Gradient에서 여러 지점에 색상을 추가하고, Width Curve로 두께 조정
  - 왜 이 예시를 사용했는지: Ray를 더 명확하고 아름답게 표현하기 위해
- <b>예시 3: 왼손 이동, 오른손 회전 분리</b>
  - 상황: VR 게임의 표준 컨트롤 방식 적용
  - 설명: 왼손 조이스틱은 WASD 이동만, 오른손 조이스틱은 회전만 담당
  - 왜 이 예시를 사용했는지: 오른손으로 공격 등 다른 동작을 수행할 수 있도록 하기 위해

---

### 헷갈릴 수 있는 부분

- <b>헷갈리는 개념</b>: Line Renderer의 Material 설정
- <b>헷갈리는 이유</b>: 기본적으로 Unlit Material이 설정되어 있어 색상이 제대로 표시되지 않음
- <b>구분 방법</b>: Material을 Default Line으로 변경해야 색상과 그라디언트가 정상 적용됨
- <b>헷갈리는 개념</b>: Activate Input을 설정했는데도 Activate 이벤트가 발생하지 않음
- <b>헷갈리는 이유</b>: Allow Hover to Activate가 체크되지 않았을 수 있음
- <b>구분 방법</b>: Selection Configuration에서 Keep Selected Target Valid와 Allow Hover to Activate를 모두 체크
- <b>헷갈리는 개념</b>: Transformation Priority 설정
- <b>헷갈리는 이유</b>: 숫자가 낮을수록 우선순위가 높은지, 높을수록 우선순위가 높은지 헷갈림
- <b>구분 방법</b>: Turn=1, Teleportation=2, Move=3으로 설정 (Turn이 가장 우선)
- <b>헷갈리는 개념</b>: 양손 조이스틱으로 이동 시 반대 방향으로 움직임
- <b>헷갈리는 이유</b>: 컨트롤러의 Y 회전값이 잘못 설정되었을 수 있음
- <b>구분 방법</b>: Left/Right Controller의 Y값을 180으로 조정하거나 Camera Offset의 회전 확인
- <b>헷갈리는 개념</b>: Snap Turn vs Continuous Turn
- <b>헷갈리는 이유</b>: 둘 다 회전 기능이지만 사용 목적이 다름
- <b>구분 방법</b>: Snap Turn은 45도씩 끊어서 회전하여 멀미 방지, Continuous Turn은 부드럽게 회전하지만 어지러움 유발 가능. 대부분의 VR 게임은 Snap Turn 사용

---

### 질문할 내용

- [ ] Line Renderer에서 Unnecessary Material 대신 Default Line을 사용해야 하는 정확한 이유는?
- [ ] Continuous Turn Provider를 사용할 때 멀미를 줄이는 다른 방법은?
- [ ] Transformation Priority 값을 어떤 기준으로 설정해야 하는지?
- [ ] Teleportation Area와 Teleportation Anchor의 차이점과 사용법은?
- [ ] 왼손잡이 사용자를 위한 컨트롤 옵션 변경 방법을 어떻게 구현해야 하는지?
- [ ] 손 모델링으로 컨트롤러를 대체하는 방법은?

---

### 복습 체크리스트

- [ ] Hover, Select, Activate 이벤트의 차이점을 설명할 수 있다
- [ ] XR Interactor Line Visual을 추가하고 Line Renderer를 커스터마이징할 수 있다
- [ ] Allow Hover to Activate 설정의 의미와 사용 방법을 이해했다
- [ ] Activate Input을 올바르게 설정할 수 있다
- [ ] Locomotion Mediator의 역할과 중요성을 이해했다
- [ ] Dynamic Move Provider를 설정하고 이동 기능을 구현할 수 있다
- [ ] Snap Turn Provider와 Continuous Turn Provider의 차이를 설명할 수 있다
- [ ] Transformation Priority를 올바르게 설정할 수 있다
- [ ] 왼손 이동, 오른손 회전 방식이 VR 게임 표준인 이유를 이해했다
- [ ] Line Renderer Material을 Default Line으로 설정해야 하는 이유를 알고 있다


## 메모


### 문제 1. Locomotion Provider의 역할 및 구조

<code>Locomotion System</code> 또는 Unity 6 기준의 <code>Locomotion Mediator</code>는 XR Origin의 위치 이동과 회전 같은 이동 처리를 통합적으로 관리한다. 여러 입력이 동시에 들어왔을 때 Move, Turn, Teleportation 같은 여러 Provider가 XR Origin을 동시에 제어하지 않도록 중재하며, 각 Provider가 안전하게 이동 요청을 수행할 수 있도록 관리한다.

<code>Locomotion Provider</code>는 XR 환경에서 사용자의 이동, 회전, 순간이동 같은 이동 동작을 처리하는 컴포넌트이다. Move Provider는 입력을 받아 이동 방향을 계산하고, Turn Provider는 입력을 받아 회전 값을 계산한다. Unity 6 구조에서는 각 Provider가 계산한 이동 또는 회전 변환을 Locomotion Mediator를 통해 XR Body Transformer에 전달하고, XR Body Transformer가 XR Origin에 실제 변환을 적용한다.

Action-based 이동 방식에서는 컨트롤러 입력을 직접 코드로 처리하는 것이 아니라, Input Action을 Move Provider와 Turn Provider에 연결하여 이동과 회전 입력을 처리한다.

```txt
Input Action
↓
Move Provider / Turn Provider
↓
Locomotion System 또는 Locomotion Mediator
↓
XR Body Transformer / XR Origin
↓
실제 이동 또는 회전 적용
```

---

### 문제 2. 컨트롤러별 이동 및 회전 할당

### Left: Move / Right: Turn

왼쪽 컨트롤러로 이동하고 오른쪽 컨트롤러로 회전하도록 설정하려면, <code>Continuous Move Provider</code>에는 왼손 Move Action만 연결하고, <code>Snap Turn Provider</code> 또는 <code>Continuous Turn Provider</code>에는 오른손 Turn Action만 연결해야 한다.

설정 절차는 다음과 같다.

```txt
1. XR Origin 또는 Locomotion 오브젝트를 선택한다.
2. Continuous Move Provider를 추가한다.
3. Left Hand Move Input 또는 Move Action에 왼쪽 컨트롤러의 Move Action을 연결한다.
4. Right Hand Move Input은 비워두거나 사용하지 않는다.
5. Snap Turn Provider 또는 Continuous Turn Provider를 추가한다.
6. Snap Turn을 사용할 경우 Right Hand Snap Turn Input에 오른쪽 컨트롤러의 Turn Action을 연결한다.
7. Continuous Turn을 사용할 경우 Right Hand Turn Input에 오른쪽 컨트롤러의 Turn Action을 연결한다.
8. Left Hand Turn Input은 비워두거나 사용하지 않는다.
9. Input Action Manager에 XRI Default Input Actions가 등록되어 있는지 확인한다.
```

Move와 Turn 입력은 보통 <code>Value</code> 타입의 <code>Vector2</code> 입력 액션을 사용한다.

---

### 문제 3. Teleportation Area vs Teleportation Anchor

<b>Teleportation Area</b>는 Area 어디든 Ray가 닿는 지점으로 자유롭게 텔레포트할 수 있게 해주는 컴포넌트이다.

예를 들어 바닥 전체를 자유롭게 돌아다니는 이동을 만들 때 적합하다.

<b>Teleportation Anchor</b>는 정해진 한 지점, 즉 앵커의 위치와 방향으로 정확히 정렬되어 텔레포트하게 해주는 컴포넌트이다.

예를 들어 순간이동 패드처럼 정확히 서야 하는 자리나, 방향까지 맞춰야 하는 지점에 적합하다.

```txt
Teleportation Area
- Ray가 닿은 표면의 위치로 자유롭게 이동
- 바닥 전체, 넓은 이동 구역에 적합

Teleportation Anchor
- 정해진 위치와 방향으로 정확히 이동
- 순간이동 패드, 문 앞, 특정 연출 위치에 적합
```

---

### 문제 4. Snap Turn과 Continuous Turn의 UX 차이

<code>Snap Turn</code>은 할당된 각도로 딱딱 끊어서 회전하는 방식이다. 예를 들어 스틱을 좌우로 입력하면 30도나 45도처럼 정해진 각도만큼 즉시 회전한다.

<code>Continuous Turn</code>은 입력이 지속되는 동안 부드럽게 계속 회전하는 방식이다.

VR에서는 사용자의 몸은 실제로 회전하지 않는데 시점만 계속 회전하면 감각 불일치가 발생해 VR 멀미를 유발할 수 있다. 그래서 일반적인 상황에서는 시점 회전을 짧게 끊어서 처리하는 Snap Turn이 Continuous Turn보다 더 권장된다.

---

### 문제 5. Snap Volume의 동작 원리와 설정

<code>Snap Volume</code>은 Ray가 볼륨 안의 Trigger Collider에 닿았을 때, 정확하게 대상 위치를 조준할 수 있도록 도와주는 조준 보정 컴포넌트이다. Snap Volume은 텔레포트 자체를 실행하는 것이 아니라, Ray Interactor가 Teleportation Area 또는 Teleportation Anchor 같은 상호작용 대상에 더 쉽게 맞도록 도와주는 역할을 한다.

실제 텔레포트 이동은 <code>Teleportation Provider</code>와 <code>Teleportation Area</code> 또는 <code>Teleportation Anchor</code>가 처리한다.

구현에 필요한 설정은 다음과 같다.

```txt
1. XR Origin에 Locomotion Mediator와 XR Body Transformer를 설정한다.
2. Teleportation Provider를 추가한다.
3. 텔레포트 대상 오브젝트에 Teleportation Area 또는 Teleportation Anchor를 추가한다.
4. 대상 오브젝트 또는 자식 오브젝트에 XR Interactable Snap Volume을 추가한다.
5. Snap Volume에는 Trigger Collider를 설정한다.
6. XR Ray Interactor에서 Raycast Snap Volume Interaction을 Collide로 설정한다.
7. XR Interactor Line Visual의 Snap Endpoint If Available을 켠다.
8. Teleportation Anchor와 함께 사용할 때는 Disable Snap Collider When Selected를 false로 둔다.
```

이렇게 하면 사용자가 쏜 Ray가 Snap Volume 안으로 들어왔을 때, Ray의 끝점이 대상 쪽으로 보정되어 더 안정적으로 조준하고 텔레포트할 수 있다.


<details markdown="1">
<summary>전체 받아쓰기 펼치기</summary>


Notion AI가 이 회의를 기록하고 있습니다.

자 그럼 이제 수업을 시작하도록 하겠습니다 점심 맛있게 드셨죠? 자 보도록 하겠습니다 그래서 큐브에 들어가서 플레이 하겠습니다.

클릭하셨나요? 큐브에 가셔서 클릭 자 그러면 여기 쭉 내리시면 xrv가 여기다가 simple xr-simple-interactable를 넣었잖아요. 그렇죠? 내립니다. 내리니까 여기다가 이렇게 하겠습니다. 후보 있죠, 후보. 여기다가 큐브를 넣습니다.

후보에다가 큐브를 이렇게 넣으세요 넣으신 다음에 클릭 컬러 체인지 보이십니까 컬러 체인지가 스크립트잖아요 이름을 뭐라고 했죠? change-renderer-clar? 했어요? 클릭하겠습니다. 됐나요? 그래서 제가 플레이를 한번 플레이를 한번 해보도록 하겠습니다.

플레이를 했죠. 오른쪽에 레이가 있으니까 y 를 누르신 다음에 어때요? 색깔이 변하죠? 마이를 누르시고 그죠 색깔이 변합니까

됐죠?

그쵸? 색깔이 잘 되나오고 있네. 됐습니까? 그래서 여기로 보시면 예전에는 여기서 볼까요?

엑셀레이 플레이 하신 상태에서 엑셀레이를 클릭하셔서 여기다 갖다 대면

됐습니까? 됐나요? 되나죠?

혹시 안되시는 분?

혹시 안되시는 분? 없죠?

아빠! 없죠?

반대신 뭘 있나요?

아 요거를 올려드릴까요?

디스코드를 올리겠습니다.

자 디스코드에 올릴게요

실시간 강의실에 올리겠습니다.


실시간 강의실에 올렸습니다.

잘 됐죠?

됐나요?

자, 다쳤어요.

자 그래서 플레이를 하시고 다시 해보시면 됩니다. 이렇게

엑셀 레이블을 클릭합니다. 됐죠? 그래서 이렇게 요! 잘되고 있네 잘되고 있죠?

자 됐나요? 안되신 분 없죠? 자 안되신 분 없죠? 자 그럼 이번에는 예를 한번 넣어 보도록 하겠습니다. 뭐를 넣어 보냐면 엑살레이에 라인 비주얼을 한번 넣어 보도록 하겠습니다. 보시죠. 라인 비주얼을 한번 올려보도록 하겠습니다.

엑셀레이 클릭

엑셀 레이를 클릭 여기에서가 head component로 하신 다음에 자 개를 올려보도록 엑셀 인트랙트 라인 비주얼 엑소엘 인터렉트 플라잉 라인 비쥬얼 있죠? XR인트랙터 라인 비쥬얼 있습니까? 보이죠? 라인 비쥬얼

자 그래서 얘를 올립시다

됐나요?

자 그렇게 하시고 플레이를 한번 해보시죠. 라인이 보이시는지. 자 그래서 플레이를 한번 해보도록 하겠습니다.

보이죠?

굿바이

색깔이 보입니까?

이렇게 보이시죠?

라인 비쥬얼. 자 근데 보이긴 보이는데 이상하죠. 여기에서 깨진 것 같아요 라인 비쥬얼 하시면 쭈욱 내리시면 뭐가 있냐면 모텔요를 찾아보세요 모텔요

트리는 찾아봅시다.

그래서 칼라를 제작해주시면 되겠죠.

자 그래서 라인 랜더가 있죠 윈위에 라인 랜더가 있으니까 얘도 이렇게 해줍시다. 이렇게 드러블 크림을 하셔가지고 이렇게만 해줄까요? 그런식으로 라인 비주얼을 이렇게 언제든지 조정 가능하니까 이런식으로 하면 될꺼야 그 다음에 밑으로 내려서 보시면 모터리얼이 있어요 모터리얼이 빠졌네 라인 렌더러가 있죠? 어디? 여기 라인 렌더러 여기를 좀 고치고 그 다음 밑으로 쭉 내려서 보시면 트랩이였죠. 클리어 하겠습니다. 자 그래서 뭐 요런거 한번 넣어볼까요. 마음에 드는거 있으면 넣으세요.


자, 그래서 마음에 드는게 있으면 넣으시면 되겠네요. 그럼 White를 넣겠습니다.

색깔이 이상한게 이상하네요. 화이트나 릿 화이트 같은거 그런거 넣어보도록 하겠습니다.


그래서

이렇게 이렇게 넣어 주시면 되겠네요 그죠 default-line 아까랑 디퓨저가 들어가 있었나봐요. 그죠? 이렇게 넣어주시면 되겠어요. 그래서 플레이를 한번 해보시면 라인이 좀 다를겁니다.

그래서 플레이를 보시면 이게 달라졌죠? 그죠? 자 그래서 오아이 잘라줬죠 도티리를 변명하시면 되구요 됐죠 뭐 새달같은거 뭐 그라디엔트로 하고싶다 굳이 라고 하시면 라인 렌더를 해보셔야 합니다. 클립 이런것들이 있잖아요. 그쵸? 이런것들을 클릭하셔서 이렇게 이런거 있죠? 여기 눌러주시면 요런게 있죠? 요런거를 커브를 표시해놓을게요 같아요


이렇게 커브를 주시고 그 다음에 라인 위드 웃기죠? 이렇게 조정해주시고 색깔도 조정해주시면 되겠네요. 그라디엔드 잘려있네요. 됐어요. 여기있어요.

시청해주셔서 감사합니다.

이렇게 음량을 주신다던지 하시면 될 것 같아요. 여기다가 색깔을 이렇게 넣어주셔서 이런식으로 해주셔도 될 것 같습니다. 그쵸?

그 다음에 뭐 얘도 그런식으로 되있습니까? 그래 그러면 중간쯤 와서 색깔을 다른걸로 파란색으로

자 됐죠?

자 됐죠?

리듬을 좀 굵게 하겠습니다. 라임랜드로 해서 리듬을 좀 굵게 하겠습니다.

자 됐죠?

시청해주셔서 감사합니다.

됐죠. 그래서 색깔은 여기서 컬러가 흰색으로 되어있는데 다른 색으로 이렇게 키우시면 됩니다. 제가 그래서 이런 느낌 와서 이런 색이 된다던지 이런 식으로

이렇게 배경을 할 수가 있는거죠

됐죠?

안녕

자 됐죠. 이렇게 하시면 될 것 같아요. 됐나요? 그래서 안되신 분 없죠?

자 안되신 분은 없으시라고 생각이 들고 됐죠?

자 그러면 봅시다

그러면 제가 이제 호롬쪽에 만들었잖아요

자 됐습니까 그럼 여기 왼쪽이 저 레프트 여러분 똑같이 한번 만들어보세요 어디에다가 레프터에다가 XRA 똑같이 만들어서 한번 해보세요 알겠죠 복구다 하지 마세요 복구다 하시면 안 되죠

자 오른쪽에 만들었으니 왼쪽은 여러분이 한번 만들어보세요 아 컨트롤 D 눌러서 붙일래요 그렇게 하시면 안되죠

자 한번 해보세요

자 다 하셨죠?

아셨죠 자 이렇게 하셔야 돼요 어 이제 색깔이 안 변하시는 분은 요걸 선택하세요 색깔이 안 변한다 나는 여기서 열심히 고쳤는데 여기서 고치고 그 다음에 또 여기서도 XR인터랙트 라인 비주얼에서 열심히 고쳤는데 아 색깔이 안 변하더라 그게 왜 그러냐면 여기서 엘을 선택하잖아 Material을 Unnecessary로 하지말고 Default Line으로 하시면 되겠습니다. Unnecessary로 하지마세요.


이렇게 디폴트 라인으로 하시면 색깔이 그대로 잘 적용됩니다. 자 플레이를 했을 때

자 됐죠 색깔이 잘 정리되죠 저는 잘 정리되었습니다 됐어요

됐어요? 자 와인

됐죠?

자, 안대신 분은 없죠? 안대신 분은... 목소리라 생각하고...

됐죠 자 그래서 이렇게 색깔을 이렇게 주었다 이 말이죠 자 그러면 자

끝!

자 그러면 여기 로고를 대해서 좀 얘기를 좀 해봅시다. XR-Ray에다가 라인 비교를 해봅시다. XR인터랙터를 달았는데 우리 아까 그 하지마세요 여기 뭐 인터랙터라고 치면 XR


인터렉터라고 치면 게이지도 있고 그래프도 있고 바이렉터도 있고 여기 쭉 있었잖아요. 그죠? 스냅도 있고 여러가지가 있어요. 그죠? 포크도 있었고, 우리가 지금 선택한건 레이 인트랙터를 선택한거죠. 그 다음에 큐브에는 엑사이 심플 인트랙터를 선택한거에요. 그래서 요 종류에 대해서 좀 알아보고, 옵션에 대해서. 자 그러면 여기부터 보겠습니다. 여기부터 살펴보겠습니다. 그래서 여기 오라고 하겠습니다.

응. 자. 이겨. 이겨.

자 후보의 이벤트 XRA에 뭐가 있어요 이벤트들이 있어요 제가 뭘 설명하냐면 여기 있죠 XRA xrray에 보시면 xrray인트랙터가 있고 그 밑에 보시면 뭐 있어요? 얘네들이죠. 인트랙터 이벤트 인터랙틱 이벤트에는 후보가 있고 뭐 셀렉트가 있고 여러가지가 있잖아요 그죠 요기에 대해서 옵션에 대해서 설명을 좀 하도록 하겠습니다 자 여기 보시면

그래서 보도록 하겠습니다. 자, 후보 이벤트. 그래서 레이에 물체가 닿거나 떨어질 때 발생하는 이벤트. 색상 변경이나 UR 표시때 많이 사용하겠죠. 그죠? 자 그래서 후보 엔터드가 있었는데 자 그래서 a가 interactive 문제를 처음 닫았을 때 이래 발생 그 다음에 exit, a가 문제를 벗어났을 때 발생 됐습니까? 그 다음에 UI 후거 센서도 UI 후거 엑시티도 자 그래서 어 일반 문체가 아닌 유니티, UI, 캔버스 요소에 레이가 닿거나 벗어나지 발생합니다. 그래서 vrui 만들때 버튼의 하이라이트 성표를 제어하기에 좋습니다. 이때 많이 쓰입니다.

요아이에서도 굉장히 많이 써봤죠. 우리 그 샘플 씬에 가서 써봤죠. 메뉴 딱 누르니까 메뉴가 많아가지고 위아래로 막 옵션 방 움직이고 스크롤 방 움직이고 5월에는 많이 씁니다. 셀렉터 셀렉터는 위에 많이 쓰이나면 그랩버튼 사용자가 그랩버튼이라 설정된 트리거를 눌러서 물체를 잡는다. 그래픽 버튼이나 설정된 트리거를 눌러서 물체를 잡는다. 그래서 물체를 잡는 순간 셀렉터가 된다. 이벤트가 발생한다는거죠. 셀렉트 캔슬드 시템이나 코드의 관계를 선택이 취소되었을때 물체가 너무 멀어져 자동으로 놔두기 때문에 그 다음에 Activate 가 있는데 이것은 알아둡시다.

후버, 셀렉트, 액티베이트는 꼭 알아두셔야 해요. 액티베이트는 물체를 선택한 상태에서 추가적인 입력을 들었을 때, 잡은 상태에서, 그죠? 물체를 선택한 상태에서 추가적인 입력을 들었을 때까지 하다. 예를 들어서 뭐 총을 잡고 있는 상태에서 방아쇠를 당깁니다. 그러면 두 개가 쓰이겠네요. 그립, 그죠? 권총을 그립, 그랩, 그랩하고 나서 총을 그랩하고 나서 트리거를 눌렀을 때 이때는 막 액티베이터죠. 그러니까 물체를 선택한 상태에서 추가적인 인잉을

추가적인 힘력을 주었을 때까지 총을 잡고 있는 상태에서 방향키를 당기는 동작 아시죠? 그거는 알아둡시다. 그 다음 액티베이티는 뭐, 선택한 상태에서 액티베이티가 들어올 때 디액티베이팅은 입력을 멈췄을때, 그립버트로 다시 그립을 쥐고 있으면 총이 잡혀요. 앞에 있게끔 놓으면 떨어지겠죠 놓으면 그립버튼을 놓으면 그립버튼을 떼면 총이 떨어지겠죠 맞죠

자 그래서 뭐 이거는 자동으로 있는거니까 그냥 넘어갑시다 자 그래서 요렇게 봅시다 후보 정보재는 물체에 의해 이름표 등이 매의 색상되는 금방한거 후보는 알겠죠? 그 다음에 셀렉터는 물건을 짓고 문 손잡이 잡기 이런거 할 때 알겠죠? 그 다음에 액티베이트는 뭐다? 총 쏘기, 전등 켜기, 스프레이 뿌리기 스프레이 뿌리기 할때도 마찬가지입니다. 스프레이를 잡으려면 그립 버튼을 눌러야 하고 트릭버튼을 눌러야 스프레이가 나가겠죠 그런거 할때 이런거 기억합시다 청소기 스프레이 뿌리기 전전케기 할때 그죠?

그래서 성능체적할때 레이가 매 프레임마다 물체를 검사하므로 who가 entered에서 너무 무거운 오딩을 실행하므로 프레임 드랍이 발생할 수 있습니다. 프레임이 뻗어버리죠. 프레임이 뻗어버려요. 여기서 실시간으로 계속 모협을 감지하고 있어요. 인체를 막 검사하고 있기 때문에 후보 엔터디에서 너무 무거운 로직을 실행하면 브레이크 드라이브가 생길 수 있습니다. 그래서 가급적 가벼운 시각 위주로 대체한다 그랬어요? 그래서 뭐 없이도 했어요 뭐 없이도 코드가 들어간게 뭐 밖에 없어요 우리 코드

이거밖에 없잖아 우리 뭐 코드 넣은 거 뭐 있습니까 얘 밖에 없었죠 코드 넣은 거 얘 밖에 없었잖아 맞죠 맞죠? 맞죠? 됐습니까? 됐나요? 나중에 한번 해보겠습니다 나는 이렇게 하고 싶다. 지금은 어때요? 지금은 랜덤으로 변하는데 나는 꼭 이렇게 하고 싶어. 뭐 후보되었을 때 노란색, 밖으로. 후보가 안됐을때는 뭐 후보 엑시트가 되었을때는 뭐 노란색으로 하고싶다 빨간색으로 하고싶다 그럴수 있잖아요 후보가 되었을때는 빨간색, 후보 엑시티가 되었을때는 노란색으로 가고싶다. 그럴수도 있죠. 그렇게 할수도 있죠. 그렇게 할때는 또 다른걸 쓰겠습니다. 이벤트 함수가 있어요.

알겠어요. 이벤트 안쓰고 있습니다. 자, 그렇게 이제 하시면 될 것 같아요. 자, 됐습니까? 자 요렇게 이제 우리가 아 됐습니다 자 그러면 봅시다 그러면 자

자


밑으로 쭈욱 내리겠습니다

비어있죠 이런거 트랜슬레이터 인풋 이런거 비어있죠 디렉셔널 인풋 스케일 톤 이런거 다 비어있죠 그대로 보시고 밑으로 쭉 내리시면 selection configuration이 있죠. 있습니까?

KEEP SELECTED, TARGET VALID, CHECK DATE

만약에 이게 비활성화 되어있다면 이게 keep 이게 뭐라고 되어있어요? keep selected target valid 라고 되어있어요 체크되어 있어야됩니다. 이게 비활성화 되어 있으며 말 그대로 후보가 되어있다면 액티베이터 할 수 있게끔 처리를 해줘야 됩니다 후보가 되어있으면 다른 동작을 할 수 있도록 액티베이터 할 수 있게끔 처리가 되어있는 문제가 있죠.

자, 후보 한 상태에서

그죠?

자, 후반 상태에서 액티베이트 버튼을 눌렀을때 어떤식으로 할일이 될거냐는 문제죠. 그걸로 한번 해보도록 하겠습니다. 자 그래서 자 똑같습니다 칼라에 가겠습니다 칼라에 가셨어요? 칼라에 가셨어 아 얘는 치울게요 헷갈리니까 얘는 치우겠어 얘는 이렇게 합시다

지울게요. 얘는 지울게요. 라스트후보. 퍼스트후보. 라스트후보는 지울게요. 헷갈리니까. 지우고 밑으로 쭉 내려갑니다. 자 액티베이트 가겠습니다. 액티베이트 쭉 내려가고 액티베이트 찾으셨어요? 밑에 있나? 아 여기있네. 액티베이트 엑티베이트 이벤트 아그바즈라고 있어요 아그바즈를 매기면 됩니다 자 그래서 여기다가 머리를 넣고 똑같이 큐브를 넣겠습니다 플러스 누르고 플러스 누르신 다음에 큐브를 누르세요

됐습니까? 자, 그런 다음에 똑같습니다. 클릭 컬러 체인지 컬러가 있죠. 예를 들면 되겠죠.

자 됐어요. 이렇게 하셨어요.


그래서 레이에 가겠습니다. 레이에 가셔서 자, 여기 보도록 하겠습니다.

시청해주셔서 감사합니다. configuration이 있고 그 밑에 뭐 selection configuration이 있죠 자 그래서 자, 여기서 아까 뭐, 옐로우 후보 액티베이트

활성화 시켜주시면 되죠. 체크되어 있죠.

체크하시고 그런다음에

그리고 hover to selector 체크해제 하시고 yellow hover to activator 체크해제 후보드2 셀렉터 체크되어 있죠. 이게 비활성 상태로 그 후보드2 셀렉터를 활성화 시켜서 셀렉트를 시켜주면 액티베이트 처리가 되거든요 그죠 그래서 근데 그거는 나중에 하고 일단 요걸로 처리하겠습니다 얘를 됐어요. 체크해제하고 다시 체크했습니다. 자 그래서 요걸로 처리하겠습니다. 플레이를 한번 해보시죠.

자 그래서 플레이를 해봐야 지금 아직도 이제 뭐를 동작하지 않을까요 플레이 버튼 플레이 버튼

구버가 된 상태에서 마우스 왼쪽 버튼을 누르면 됩니다. Y를 누르신다면 이렇게 눌러도 되요. 그... 뭐... 그... 되진 않아요. 알겠어요? 그래서... 그래서 분명히 후보가 된 상태라면 액티베이터를 할 수 있게끔 처리가 되어 있는데 그죠? 안 된 이유는 여기 옵니다.


자 여기입니다. 조금만 내리시면 아까 여기였죠. 자 이 부분. 인풋 컨피규레이션이 있습니다.

여기네 여기네. 보이셥니까? 자 그래서 input configuration 이 보이시고 그래서 비어있죠 인풋 컨피규레이션이 비어있습니다 자 그러면 보겠습니다 음 그래서 여기 보시면 두가지가 있어요. 셀렉터 인풋, 액티베이터 인풋. 두가지가 있죠. 자 그래서 셀렉터냐 액티베이터를 셀렉터나 액티베이터를 어떻게 할 수 있을거냐 라고 하신다면 자 보겠습니다 여기 이제 레퍼런스가 있죠 이렇게 자 그래서 그래서 여기에다가 정리를 한번 해 주겠습니다.

엑티베이터 인풋이죠. 여기다 클릭 자 뭐라고 하시냐면 엑사리 라이트라 워즈

xri-light라고 적을거에요. 그럼 쭉 내려보시면 뭐가 있나요? 라이트 인터렉션 이라고 있습니다. 쭉 내리겠습니다.

Activate를 찾아보세요. Light Interaction

저희 트로이처리 어디있지?

위에 있나요? 저기에서 인터랙션

셀렉터 있고 액티베이터를 찾아봅시다

엑시리 라이트 인터랙션 액티베이트라고 있어요. 액티베이트 인풋

됐습니까? 예를 선택하겠습니다. 자, 됐어요!

됐나요? 자, 뭐를 선택했다 다시 한번 말씀드립니다. XRE RUIGEN

자, 이제 좀 내려가보시면 인터랙션, 셀렉터가 있었고 조금만 위로 올라가면 뭐가 있다. 액티베이터가 있죠, 이렇게. 액티베이트 엑사 라이트 인트랙션 액티베이트 이렇게 선택해주시면 되겠습니다. 됐어요?

자 그러면 밑에도

자, VALUE도 넣어 보겠습니다.

쏘리

엑티베이트 밸리버 있습니다. 해를 선택하겠습니다

끝나요?

이 두가지를 Interaction에 Activate Value 두가지를 넣었습니다.

다시 한번 실험을 해보도록 하겠습니다 한번 해보시죠 여러분도

자, 됐습니까? 플레이 한번 해보도록 하겠습니다.

자 됐죠? 자 그래서

얘 누르시면 어때요? 변하죠?

아 Y 누르시고 Y 누르신 다음에 이렇게 누르시면 변하죠. 다시 Y 누르신 다음에 뭐

왼쪽 마우스 버튼 그쵸? Y 누르시고 왼쪽 마우스 버튼 누르시면 변하죠 안되신 분

안되신 말인가요?

없죠? 없죠? 그러면 오른쪽에도 똑같이 한번 해보세요 오른쪽에 했으니까 왼쪽에도 똑같이 한번 해보세요

자 어떻게 했다? 어떻게 했다? 자 엑셀 레이에서 오른쪽에 하셔서 이렇게 하시면 되요 쭉 가시면 되죠.

여기서 뭐를 체크했다 keep selected target valid을 체크되어 있고 arrow hover를 액티베이트 체크하셔야 되죠. 왜 체크합니까? 뭐 하신 상태에서, 후보가 된 상태에서 액티비티가 다른 걸 할 수 있겠지. 커버가 된 상태에서 다운로드 할 수 있게 액티베이트가 뭔지 알겠죠? 액티베이트가 뭡니까? 아까 얘기했잖아요 총 들고 있을 때 그랩이 일어났을 때 뭐든 할 수 있게 트리거를 누를 수 있게 다른 동작도 할 수 있게 지금 후보가 된 상태에서 후보가 된 상태에서 내가 다른 처리를 할 수 있게 체크했어요

자 그런 다음에 체크하신 다음에 어떻게 했나요 저기 클릭 쭈욱 내려가셔서 여기다가 input.configuration에서 write, activate, activate value, write interaction, activate. 그죠? Interaction Activate Value 두가지를 넣었죠. 그러니까 됐어요. 그러면 외쪽은 여러분이 한번 해보세요. 시청해주셔서 감사합니다.

홀로라이브 역사상 최악의 버티버 이제는 명실상부 일본 버티버 업계를 대표하는 기업이 된 홀로라이브 하지만 그런 홀로라이브도 처음부터 다 순조로웠던 건 아니었나? 그 중에서도 특히 초창기 홀로라이브에 있어 흑역사라고 할 수 있는 사건이 하나 있었습니다. 바로 히토미 크리스 대명사건입니다. 히토미 크리스, 그녀는 원래대로라면 홀로라이브의 1기생으로 데뷔할 것이보였습니다. 2018년 6월 3일 첫 방송 이후 고작 하루도 지나지 않아 다음 날부터 활동 준비를 못 하고 이후 26일 커버사의 SNS에 그녀와의 계약이 전면 해지되었다는 공기가 올라오면서 히토미 크리스의 계정은 완전히 사라지게 됩니다

당시 커버가 이같은 조치를 취시한 데에는 다 이유가 있었죠. 실은 그녀가 과거의 미성년자의 신분으로 농주, 공갈 그리고 심지어 원조 조직까지 했었다는 사실이 밝혀졌기 때문에 그렇게 히토미 크리스는 홀로 라이브에서 완전히 제출당한 뒤 유튜브, 트위터, 계약해지 공지까지 모두 비극...

자, 다 하셨죠?

자, 다 하셨죠? 자, 됐습니까? 자, 그래서...

자 이거를 안하고 하면 뭔가 애호시 했겠지만 만약에 얘기를 엘로우 후보드 액티베이터를 체크했다면 헤디하고 하시면 당연히 안되죠 그쵸? 그쵸?

방명이 안되고 있습니다.

자 당연히 그래서 뭐를 체크하라 얘를 체크해야 되죠. 옐로우 후보드 인티베이터 오늘 좀 해봅시다. 어쩔 수 없어야 되죠? 해봅시다. 메뉴를. A한테 이런걸 물어보면... 잘 모르더라구요. 틀리게 할께요. 알겠어요. 아직은. 알겠죠. 변화하시면서. 알겠죠. 자, 그 다음에 밑으로 내려가셔서 또 캐스팅을 드리겠습니다.

그쵸? 자, 그랬다는 것을 알아둡시다. 됐어요? 자, 됐죠? 그럼 여러분은 여기 그... 그쪽에다가도 메일을 붙여서 하셨죠 자 그래서 우리가 우리가 한 거는 뭐밖에 없어요 오늘 한 거는 포크레인을 지읍시다 나중에 같이 한번 해보시고 컴플레이션 채워보시고 xray에 뭐 있어요? 여기다 xray인터렉터를 달고 XR인터랙터 라인 비쥬얼을 했더니 라인 엔더가 같이 생겼죠 여기다가 무슨 컵하는 줄 알 수가 있어요. XR인트랙트와 라인 비주얼을 가져왔더니 라인 비주얼이 따로 생겼고

여기에서 뭐를 넣을까요? 꾸밀려면 뒤를 이렇게 넣어주시면 되고 여기도 그렇게 그쵸? 해주시면 되고요 그 다음에 뭐죠?

그 다음에 여기 보시면 XR 인트랙트 라인 비주얼 색깔을 이렇게 조정해주고 그라디언으로 멋지게 하고 싶으면 하시면 됩니다. 아시겠죠? 그 다음에 중요한 거 뭐였어요? 후보가 된 상태에서 액티베이터를 처리하고 싶다. 다른 처리를 하고 싶다 마우스 왼쪽 버튼 눌러서 그 처리하고 싶다 트리거죠 트리거. 트리거를 하고 싶다 라고 있을때는 좋겠습니다. 여기가 더... 여기 같죠? 자, 여기 국내기심이야. 국내기심에 이벤트가 있었죠. 이벤트에다가... 여러가지 설정을 했습니다. 다 여기죠. 여기죠. 여기서 클릭. 이제 X-ray 트랙터.

그래서 뭘 하라고 했어요? hello-huboard-activate 체크 밑으로 내려서 input activate 하고 activate value를 넣어주시라 알겠죠? 자 그러면 10분간 쉬었다가 하도록 하겠습니다 10분간 쉬겠습니다

자 그럼 이제 수업을 지나가도록 하겠습니다 자 이때까지 했는데 못따라오신 분 있습니까 안되신 분

자, 우리 뭐 이때까지 레이를 했는데 뭐 레이를 하고 레이가 후보가 된 상태에서 뭐 액티베이트 액티베이터 위쪽 마우스 버튼이나 클릭버튼 눌러서 색상 변경하는것까지 같이 했죠 했는데 우리 코드 딱 뭐 적었어요. 스크립트 하나 딱 적었죠. 그 스크립트에 함수 하나만 만들었어요. 알겠죠? 자 그래서 거의 이런식으로 개발, 느낌 아시겠습니까? 이런식으로 개발하시면 되요. 알겠죠 그래서 그 전에는 초창기에는 개발자가 일일이 다 만들고 있는데 아닙니다 거의 다 지원합니다

여러분이 거의 다 지원하고 필요한 코드만 몇 개만 딱 작성하면 웬만한 프로젝트를 뚝딱뚝딱 만들 수 있어요. 알겠죠? 자 이런식이니까 됐고 혹시 윤대식 레이서님 아직 안됐어요 잘 따라 하셨나요? 걱정이 되서 자 윤대식 레이서님 잘 따라 하셨나요? 제가 걱정이 돼서 물어봅니다.

잘 따라 하셨죠? 예. 자 됐고. 자 그럼 이제 로커모션에 대해서 한번 해보도록 하겠습니다. 로커모션. 자 로커모션이요 자 알죠? 자 로커모션 뭡니까? 예죠?

자 로커모션 요걸로 하도록 하겠습니다 로커모션 자 그래서 자 일단 하면서 말씀드리구요. 동작 합친거죠. 회전하고

여러분 그 이제 그 군무라는 말 아십니까? 춤추는 동작은 어때요? 각성해져 있죠? 대전하거나 뭐... 이동하거나 그런걸 다 합친것을 정해진 동작, 군무 뭐 그런 뜻으로 번역되기도 하더라구요 포크모션 자 동작을 한번 해보고 일단 하면서 한번 해보도록 하겠습니다 자 내리고 자 그러면 봅시다 저 여기를 클리어 하겠습니다 자, 빈 오브젝트를 만들겠습니다. 자, 그래서 클릭

여기다가 클릭 마우스로 인어 웨이크를 만들게요 로커모션 이라고 하겠습니다 로커모션 그래서 로커모션이라고 했습니다

자, 됐어요. 이렇게 만드셨나요?

여기다 채워버려요

루퍼모션으로 메뉴가 잘 바뀝니다 루퍼모션 미니언트 하셨어요? 자 그래서 로코모션 클릭 자 그래서 로코모션 미디어쳐 설치를 했더니 뭐 엑셀 바디 트랜스포머도 같이 따라왔습니다. 자 됐어요. 로커모션 메디에이터를 넣어주면 자동으로 엑셀바디 트랜포머가 생깁니다. 라고 기억하시면 되겠구요 자 됐습니까 그렇죠 이 컴버는 같이 딸려오는 거죠 자 그러면 메디에이터는 무슨 뜻이냐면 중재자라는 뜻입니다. 중재자. 메디에이터는 뭐? 다른 말로는 뭐? 중재자. 이런 뜻이에요. 그죠?

이동이나 보행, 이런뜻이고 로커모션 뜻이 뭐예요? 이동, 보행, 뭐 이런 뜻이에요. 이런 뜻이고, 그래서 이동과 관련된 이동과 관련된 기능들을 중지해준다 이런 뜻입니다. 메디에이트는 자 그런 뜻이고 자 그러면 로커모션 안에도 여러가지가 있죠. 자 그러면 여기에다가 클리어 하겠습니다.


자 무브라고 만드셨나요? 어우 슬러시가 왜저래 못하났죠? 자 됐습니까? 자 요렇게 하시고 이 무브만 할거라서 회전하고 무브를 따로 빼겠습니다 자 그래서 여기다가 자 여기다가 클릭 다이나믹 프로바이더라고 하겠습니다. 들어갔죠?

자 Dynamic Move Provider 들어갔나요? 자 그래서

자 그래서 여러가지 기능들이 포함되어 있죠 자 그렇는데


레이인테릭터나 심플인테릭터를 이렇게 했잖아요. 레이인테릭터도 그래프인테릭터 아니면 다이렉트인테릭터 이런식으로 포크인테릭터 이렇게 쓸수가 있죠. 자 그래서 여러가지 방법이 있는데 그러면 우리는 여기서 예를 쓰겠습니다 자 다이나믹 moveProvider를 쓰겠습니다. 자 다른 메뉴도 뭐가 있는지 살펴봅시다. 다이나미라고 했죠? 다이나미만 잘 모르겠어요. 다이나미를 잘 모르겠어요. 이렇게 해서 메인 룰을 다이나믹 프로바이더 우리가 썼습니다. 자 그러면 이미 여기 뭐가 있어요. 요렇게 있죠.

왼손의 움직임은 이쁘다고, 오른손의 움직임은 이쁘다고 이렇게 있습니다. 자 그러면 이렇게 이제 다른 것을 아시고 자 그러면

엑셀 컨트롤러 롸이트 여기가시면 컨트롤러가 이렇게 있는데 이렇게 컨트롤러가 있죠. 자 그래서 여기 이제 WASD로 이동해야되겠죠? 됐죠? 자 그래서 이렇게 나누어져 있습니다. 그래서

나눠져있죠. 라이트가 있고, 라이트는 A가 달려있고, 레프트, 레프트 누른 다음에 이어폰 좀 껴볼까요?

이렇게 빼도 나중에는 같이 합쳐질거에요 알겠죠? 빼도 손에 들어오게 딱 됩니다 자 이렇게 빼겠습니다 라이트 됐습니까 자 그래서 레프트로 오겠습니다 보통 vr 게임에서는 레프트에 있는 조이스틱으로 왼손에 있는 조이스틱으로 WASD를 많이 구입을 합니다. 자 그래서 보통은 어떻게 한다 우리가 VR게임에서는 뭐 왼쪽 컨트롤러에 보이스틱을 이용해서

움직인다 라고 생각하시면 되겠습니다. 자 그러면 왼쪽 컨트롤러, 오른쪽 컨트롤러가 있는데 자 그러면 여기 오겠습니다. 자 그러면 왼쪽 컨트롤을 이용해서 우리가 움직일 것이다 라고 했죠? 그러면 여기 옵니다. 노크모션에 오셔서 무브에 오겠습니다. 여기에는 이미 뭐가 있어요. 다이렉트 다이나믹 무브 프로바이더가 있죠. 자 이 움직임을 담당하는거죠. 이 프로바이더가 자 그래서 얘를 이제 전달해줄건데 자 그러면 보도록 하겠습니다. 자 그래서 자 그래서

자 그래서

여러가지를 하실수가 있죠

두개를 넣어 주겠습니다. 또 커머션을 끌어서 여기다 넣어 주겠습니다.

됐죠? 다시 우우를 선택 로커모션을 끌어서 이렇게 넣어주세요 로커모션 자 로커모션 메디에이터가 들어갔습니다. 이 로커모션을 넣어줄거고 나중에 뭐 여러분이 커스터마이징 할 때도 이렇게 요게 이제 될겁니다 자 그러면 여기다가 하나 크립 하나 더 만들고 로테이트를 하나 만들어 볼게요 마우스로 피해나오지 않게 자, Rotate 라고 하죠

롯데이터 센터 됐습니까? 아! 롯드라우저 모테이터라고 적겠습니다.

트위터라고 적었죠? 적으신 다음에 턴이라고 적어볼게요

턴이라고 적으시면

이름을 이렇게 적어봅시다. 일단 해보죠. 대표 이건 오티티라든지, 아니 텔레포트라든지. 끝까지 시청해 주셔서 감사합니다.

탈락! 자 됐죠? 자 그런 다음에 자 그래서


텔레포트로 하반신을 움직이는 것은 굉장히 까다로워서 일단은 이렇게

그래서 메타 캐스트, 오플릿 캐스트는 경우에도 MCMD 양손에 있는 컨트롤 이렇게 세가지 기기로 동작하는 겁니다. 그래서 하반신을 따로 움직일 수가 있는거죠. 그렇게 이제 하반신을 직접 움직이는 거에요 그렇게 대중화되어 있지는 않습니다 자 그래서 나중에 뭐 우리가 하반신을 직접 움직여서 직접 가는 걸로 해서 하는 게임은 말이 없어요. 생각보다 직접 움직임이 직접 내가 움직여야 되는 게임은 없습니다. 거의 대부분이요. 텔레포트 기능을 많이 사용합니다. 무슨 말인지 알겠죠? 오픈XR, 인테릭스 툴킥 같은 경우에도 텔레포트에 대한 기능이

기능을 많이 쓰고 있죠. 굉장히 손쉽게 할 수 있게끔 텔레포테이션에서 Provider가 따로 있습니다. 자 그러면 텔레포트 클리어 하겠습니다. 여기다가 Add Component 하겠습니다. 텔레포테이션 Provider라고 적어볼까요? 텔레포테이션 프로바이터 있습니까? 이렇게 나왔어요. 그렇나요? 얘도 로커모션을 넣어주시면 되겠죠

음 아 텔레포트를 하나 넣어주고 여기 요 밑에다가 턴을 하나 넣어주겠습니다 빛나고잭트 턴

끝까지 시청해 주셔서 감사합니다.

여기는 얘를 넣어주세요. teleportation provider를 넣어주셨고 turn에다가는 얘를 넣어주세요. snap turn provider

스냅턴 프로바이더를 예로 넣겠습니다.

됐어요? 자 이렇게 이제 넣어 주셨나요? 자 그래서 빈 오덱트 만들고 여기다 다이나믹 프로바이더를 넣어 주신 후 워커모션을 걸어서 텔레패션 프로바이더, 스냅턴 프로바이더 이렇게 넣었죠. 이렇게 해놨는데

자 됐죠?


자 중재자 역할을 이렇게 하는 거죠 그래서 뭐 이동 로직이나 그죠 VR기기에서 이동을 한번에 동시다 발전으로 실행을 예를 들어서 컨트롤러는 이미 두개인데 저희가 조이스틱을 두가지 전부 다 누를때도 있죠 이럴때도 여러 이동관련메소드 같이 적정하게 되면 그렇죠? 로커머신 기준에서 굉장히 헷갈리죠? 그래서 하나만, 왼손만 움직이도록 하겠습니다. 그렇죠? 자 그래서 여러분 안녕

자 어느걸 먼저 실행시킬꺼냐 이런 문제점이 있는데 자 그래서


그래서 우승순위를 지정할 수 있어요. 자 그래서 이렇게 하겠습니다. 트랜스포메이션 프리오리티가 있죠. 뭐가 먼저 될건지. 동시다가 움직일 때 기준이 있어야 되겠죠. 서로 같이 하려고 하면 헷갈리니까 그래서 순위를 정해도 얘는 3이라고 하겠습니다 3으로 진영을 하시고

그쵸 그 다음에 텔레포트는

그래서

이 상황이라면 뭐... 너만 한다

자 이 상황에는 프리올티가 이동에 관련된 순서를 포함하죠

그쵸? 그래서

자, 턴은 1으로 가겠습니다. 턴은 1. 이게 나을 것 같군. 그 다음에 헬리콥터는 2.

됐죠? 소설을 어떻게 정할까? 소설은 프리오리티 트랜스 포메이션은 프리오리티를 1위 텔레포트는 2, 그 다음에 move는 3 이렇게 지정했습니다

다 됐죠?

자 요렇게 진행했고

자, 이렇게 지정했습니다.

자 됐죠 그러면 일단 바닥을 깔고 갈게요 얘는 일단 이렇게 합시다 바닥을 깔고 갑시다 마우스 오른쪽부터 누를께요 3D 오브젝트 가서 전에 한번 했죠 플레인을 하겠습니다. 3D 오브젝트

회의 바닥 하나 만들었습니다 크게 하죠 굵직굵직하게 자 레이블 롤하고 있어, 롤.

라고 하시고 자 스케일 5 x는 5 z도 5정도 됐습니까? 그래서 이제 이동하는게 보여야 되겠죠?

자 됐고 지금 뭐 플레이에서 WASD 눌러도 안되죠 그죠 그래서 자 얘기합니다. 무브에 가셔가지고 자 얘기합니다. 일단은 우리가 신경 쓸거는 뭐다? 무브니까. 텔레포트하고 턴은 일단 꺼줍시다. 배그포트하고 턴은 꺼줄께요 우리 이따가 무브를 먼저 해야하니까 알겠죠 자 그래서 일단 허벅지를 먼저 이렇게 해주고 됐어요. 그렇게 하신 다음에 XR인트랙트 툴킷에서 우리가 왼쪽으로 컨트롤러 움직이게끔 하겠습니다. 여기다 밀어넣어 줘야 하는데 저기를 보세요 여기 여기 보니까 뭐가 비었습니까? 무브에 비은거 있죠?

웨프트 컨트롤러 트랜스폼, 라이트 컨트롤러 트랜스폼, 위에 있는거 있죠. 그 다음에 뭐 위에 보니까 소스, 포워드 소스 이런것도 비어있죠. 그 다음에 레프트 핸드 무브 인프, 라이트 핸드 무브 인프 이런것들이 막 비어있습니다. 됐습니까? 자 그러면 요렇게 한번 해 보도록 하겠습니다.


이렇게 한번 해볼게요. Forward Source는 메인 카메라로 하겠습니다.

끓여서 가져오겠습니다.

예전에는 위에 있는 메인카메라가 아니고 위에 있는 메인카메라가 아니고

컴퓨터 플래스 누르고 여기 이제 무브에 가서 여기 있는 메인카메라를 여기다가 넣습니다. 포워드 소스 넣으셨어요? 자 이렇게 넣으셨고 그 다음에 자 여기보시면 이제 어

핸드 트랜스폼이, 핸드 트랜스폼 있죠? 핸드 트랜스폼 있죠? 얘도 예를 들어서 보여주십시오.

끝내요?

자 그래서 헤드트렌드 폰도 몰랐다 이 카메라를 이렇게 놨습니다 됐죠? 구독! 포워드 소스도 물을 넣었죠? 링카메라를 이렇게 넣었죠? 됐습니까? 자, 이렇게 하셨으면

자 됐고 밑에 무브 다이렉션 있죠? 무브 다이렉션 있습니까? 자 그러면 얘를 넣어주세요 얘를 깔아서 넣으세요 엑셀 컨트롤 랩2

엑셀 컨트롤 라이트 를 눌러주겠습니다.

됐습니까? 이렇게 나왔나요?

자 넣어주셨어요. 자 그렇게 하신 다음에 자


자 그래서

자, 얘를 한번 찾아 봅시다.

여기다가 자 레프트 좋나요? 자 무브 찾아보세요 레프트 인터랙션 무브

이렇게 할까? 얘는 이렇게 튜림이 되죠? 그래서 뭐를 찾냐? 레프트 로코 모션을 찾아보세요. 있나요? 여기 보니까 Move가 있나요? X, R, I, Left Locomotion Move

그쵸?

됐습니까?

자 그러면 라이트도 같이 한번 넣어봅시다. 라이트도 넣어봅시다. 라이트죠. 라이프를 채워보겠습니다. 그래서 똑같습니다. Interaction, Locomotion

로커모션 무브가 있죠. XID 라이트 로커모션 무브, 되셨나요?

자 되셨어요 자 됐고


0으로 다시 고쳤어요. 얘는 뭐 무브 밖에 없으니까. 얘가 제일 먼저 되어야 되겠죠. 0 되셨어요.

자 하신다음에 자 하셨죠? 플레이해서 한번 해보세요

플레이해서 한번 해보십시오. 제가 얘기 안해도.

되는지 한번 볼께요.

왼쪽이죠 왼쪽 T를 눌러서

자 키를 올리겠습니다.

됐어요? 자, W. 되죠? 합니까? 안되는 분?

안되는 물 없죠?

자 됐죠? 혹시 안되시는 분 계신가요?

혹시 안되시는 분?

높죠? 높죠? 그러면 됐습니다. 됐습니다. 자 그래서 이제 move를 우리가 했습니다. 그죠?

그래서 왼쪽 컨트롤러에서 왼쪽에서 T를 누르신 다음에 WASD를 누르시면 어때요? 이렇게 이제 그 이동하죠. 자 됐습니까. 그래서 move는 조이스틱을 통해서 움직이면 되시구요. 자 됐습니까? 됐습니까? 근데 뭐 이런 분 있죠?

자 우리 하나 더 얘기해야 되겠습니다. 하나 더 얘기할게 있습니다. 나중에는 여러분이 프로젝트 제작할 때는 어떻게 해요? 옵션을 지정해 줘야 된다. 몇 손으로도 될 수 있게, 어느 손으로도 될 수 있게. 옵션을 지정해 줘야 되겠죠. 어떤 사람은 왼손잡이고 어떤 사람은 오른손잡이잖아요. 맞죠? 우리가 왼손으로 이동한다고 했지만 다 그렇게 하면 안되죠. 어떻게 지정해줘야 돼? 메뉴를 고를 수 있게 해서 왼손으로 대게 그죠? 안그러면 오른손으로 대게 알겠어요? 흙이동화기. 알겠죠? 그거는 뭐 나중에 프로젝트 할 때 하시고요. 뭐 당연히 이쁘면 쓰면 되죠. 불 변수 하나 만들어서. 그죠?

당연히 뭐 그렇게 해 주시면 될 것 같고 됐나요? 자 그래서 이제

짱!

그런데 문제가 있어요. 어떤 문제가 있냐면 제가 보겠습니다. 플레이를 했죠.

어떤 문제가 있느냐 하면 플레이를 해보도록 하겠습니다.

당연히 T눌러서 W, A, S, D 이동하는건 필요한데 이번엔 Y를 하면 되죠. 어? 움직이죠? 근데 A눌러도 막 움직이지 않아요. A눌러도, D눌러도 그쵸? 막 K눌러도 D눌러도 움직이고 있죠 오른쪽으로만 자 A를 눌렀는데 오른쪽 이동, D를 눌렀는데 왼쪽 이동하고 있죠. 됐습니까?

자 그래서

그죠? 자 그래서 여기서 어떤 문제가 생기니까 테이블을 누르니까 왼쪽으로 자 그리고 테이블을 누르니까 오른쪽으로 이동하고 테이블을 누르니까 이동하고 있죠. 그죠? 그죠? 그럼 이제 뭐, 왼손만 대기하고 싶다 이러면 이제 물론 뭐, 왼손만 대기하고 싶다 이러면 여기서 뭐를 끌어낸대요. 대기를 끌어버린대요. 그죠? 여기 라이트 로커모션을 끊어버리면 됩니다. 물론 그렇게 할 수도 있죠. 자 그러면 내일은 뭐 지우셔도 됩니다. 자, 그런데

돌아갔는지 한 번 봅시다. 돌아가지는 않았죠. 어, 제대로 됐네. 제대로 됐죠. 거꾸로 되는 분은 없죠 혹시? 혹시나 말씀드리는 거예요. 거꾸로 되는 분이 있으면 안 된다는 거. 제가 여기서 말씀드리는 건 뭐냐면 여기서 말씀드리고 싶은 것은 예를 들어 거꾸로 되면 안된다는 것입니다. 오른손으로 된다고 치더라도 Y를 넣어서 왼쪽은 A를 눌렀는데, 왼쪽은 D를 눌렀는데... A를 넣는데, B를 넣는데, 반대 방향을 이용하면 안되죠. 그것때문에 말씀드린거에요 알겠어요? 알겠습니까? 자 그래서 그렇게 되있는 분은 고치시면 되죠 어떻게 고쳤어요?

아까 얘기했지만 여기 180 이 두개 선택해서 거꾸로 되신분은 뭐 여기 유니버셜 컨트롤러 유니버셜 컨트롤러 둘다 선택해서 y를 180 이렇게 해주시면 되겠습니다 예 안그러면 또 카메라 오프셋이 돌아갔을수도 있죠 얘가 막 그죠? 얘가 180도 이렇게 서재에 있을 수도 있습니다. 돌아갈 수도 있으니까 주의를 하시고 그죠? 자 그래서 자, 됐습니까? 자, 그래서 이제 move는 이렇게 이제 끝이 난 것 같습니다. 자, 됐죠? 그런데 제가 이렇게 말씀드렸잖아요.

어떻게 말씀드렸나요 그 나중에는 어떻게 한다 손모양 모델링으로 하겠다 지금 컨트롤러로 움직이고 있지만 나중에는 어때요 손모양 모델링을 여러분한테 드리면 그걸로 이제 손으로 움직여야 되겠죠. 저는 나중에 곧 하겠습니다. 알겠어요? 자 됐고 Move는 이런식으로 하시면 될 것 같구요. 자 그래서 WASD가 잘 가고 있죠. 자 그래서 뭐 그죠 방향대로 다 움직이고 있습니다 자 그래서 아 나는 뭐 왼손으로만 하고 싶어 이러면 어떻게 하면 되겠습니까? 왼손으로만 하고 싶다면 제가 아까 뭐라고 얘기했나요? 우부에서 뭐를 끊어버리라? 라이트를 끊어버리라? 라이트를 지워버리라? 그러면 왼손만으로

네 움직이게 되겠죠. 그거는 뭐 그렇게 해주시면 되고 지금은 뭐 양쪽 다 움직이게 그렇겠습니다. 그죠?

자 됐습니까? 자 그래서 그렇게 이제 그...

이 기준으로 해보시면 되겠습니다. 자 그러면 턴에 가겠습니다. 턴을 켤까요? 텔레포트는 끄고, 텔레포트는 끄고, 턴을 켜겠습니다. 색깔이 스냅, 턴, 프로바이더가 있죠. 자, 그래서 스냅, 턴.

감기

continuous-turn-provider

그쵸? 차이가 있어요 어떤 차이냐면 자! 스냅턴 프로와이드는 뭐? 여기 뭐라고 되어있어요? 45라고 되어있죠. 45도씩 턴하는거고 continuous turn provider는 뭐 계속 계속 한바퀴 도는거죠? 이어진다. Continuous가 연속적인 뜻이잖아요. 연속적으로 돌 때는 Continuous Time Provider 하고 Snap Time Provider는 조이스틱으로 회전할때 45도씩 딱딱 회전하게 이렇게 되어있습니다. 근데 일반적으로는 스냅은 안쓰고 대중적으로는 스냅은 프로바이더만 써요 알겠죠?

부드러운 회전을 원할때는 컨티뉴스턴 프로바이드를 쓰시면 되겠죠 한번 누르면 바로 회전되는 그런식으로 처리하게 되는데 근데 문제는 Continuous Time Provider를 하니까 어지러움을 호소하는 사람들이 꽤 있습니다. 그래서 스냅톤으로 많이 합니다. 알겠죠? 그죠? 스모이밀 때문에... 프로바이더보다는 게임에서 실제로 스냅캉 프로바이더를 많이 쓴다는 것을 우리가 알 수 있습니다. 스냅톤 프로바이더를 쓰겠습니다. 자 그러면 얘는 치울까요? 부드럽게 회전합니다. 끊임없이 부드럽게 회전한다.

continuous-time-provider 그 다음에 딱딱 45도씩 일어난다 snap-time-provider를 쓰시면 되겠습니다. 그럼 얘는 지우겠습니다. 자, 버려지우자. continuous.provide="true", 이모컴포넌트 하겠습니다. 지웠습니까? 그렇게 하신 다음에 메디에이트가 있죠. 메디에이터. 중재자. 자 요렇게 있었고, 그 다음에 그죠? 자 그래서


45도 0.5 이렇게 되어있죠 자 그래서 여기다가 한번 넣어주자

짜라란

고맙습니다.

그래서 여기다가 얘를 넣어보겠습니다. 클릭! 여기죠!

여깁니다. 여기에서 턴, 여기에서 클릭, 자 얘를 좀 줄일까요? 자 적어 보도록 하겠습니다 레프트죠 로커모션 턴을 찾아보세요

워커모션 턴 레저 턴 자

자 됐어요. 그 다음에 하나 더 올리겠습니다.

자 라이트로 할까? 라이트로 합시다 제가 실제 실수할 뿐입니다. 백설왕이시니까

고코모션 스냅 턴으로 업그레이드됩니다.

됐죠? 자, 레프트에는 레프트를 뭐예요? 그냥 턴했고 레프트에는 레프트, 핸드, 턴, 2, 3, 4, 5 엑스라이트 로커모션 턴을 눌렀고 그죠? 라이트 핸드폰을 눌렀어요. 엑스라이트 라이트 로커모션 스냅을 눌렀어요. 자 이렇게 넣었다는 것입니다.


자

얘를 순서로 0으로 하겠습니다. 필드에 있나요? 아, 예. 편해가지고. 데스 포메이션 프로에서 0으로 하겠습니다. 됐죠? 플레이를 한번 해보세요 자, 그래서 됐습니까? 움직여 보세요

자 그래서 플레이를 하겠습니다.


그쵸? 회전하죠!

회전합니까?

회전하고 있습니다. 자 Y 눌러서

자, 회전하고 있죠.

자 그래서 이런식으로 누르게되면 이동과 동시에 회전도 하면 이동과 동시에 이동과 동시에

1등 가고 2킬 해줘 해줘

자 됐습니까? 자 안되신 분?

여기까지 얘기 안 되신 분 있나요?

여기까지 안되신 분?

이어폰과 동시에 해결을 해야한다는 것이죠. 그죠? 저는 잘되고 있습니다. 내신부는 복습하고

자 됐어요. 이동과 동시에 회전. 회전. 잘 되고 있습니다. 자 됐어요. 그래서 중요한 것은 뭡니까요? 레프트에서의 턴 그냥 턴을 하고 라이트에서는 뭐 스냅트를 한다는 것이죠. 그죠? 스냅트는 뭐 딱딱 뭐 그죠? 45도 시에 개전 자 됐습니까? 자 됐습니까? 자 그래서 됐구요 자 그 다음에

응.

자 그러니까 오른쪽으로만 움직이게 그렇게 한번 해보도록 오른쪽으로

시청해주셔서 감사합니다!

그래서 오른쪽 컨트롤러에서 움직이고 그러니까 보통 VR게임은 왼쪽 컨트롤러에서 이동하고 오른쪽 컨트롤러에서 회전하고 그렇습니다. 다시한번 얘기하겠습니다

왼쪽 컨트롤러에서는

보통 그래서 오른쪽 컨트롤러에 의해서는 회전!

자, 보통 요렇게 많이 합니다. 그죠? 보통 그렇게 많이 하는데, 취향에 따라 다... 다릅니다. 제가 최악의 딸이라고 보시면 되겠는데 그러니까 뭐 제 마음대로 한 건 아니고 VR 게임에서 다 그렇게 하고 있습니다. 제가 교칭을 잘하는게 아니라. 알겠죠? 자 그래서 자 그래서 그렇게 한번 변경해 보도록 하겠습니다. 자 자 그래서 어떻게 할거다. 왼쪽으로는 왼쪽 포토로에서 이동, 오른쪽 포토로에서 대전, 이런식으로 자 그러면 오른쪽으로 공격하는 경우도 상당히 있고 그래서

왼쪽으로 이동하면서 오른쪽으로 회전 이렇게 이제 구성을 많이 되어 있습니다 자 그래서 왜냐하면 오른손은 거의 공격을 하니깐 자 그래서

짠!

자 그러면 요렇게 하겠습니다 자 내립니다 아까처럼 요렇게 해주시면 되죠 자 브금

버는 치워버려 라이트핸드 있죠? 라이트핸드 치워버려 엘리트

없애버렸죠? right-hand-move-input-delete 해버렸습니다

자 됐죠? 자 그렇게 해버렸고 그 다음 턴!

턴은 뭐하시면 되겠어요? 애프터를 지우면 되겠죠

자 레프트를 치웁시다. 클릭 이번에 이렇게 해서 딜리터 할 수도 있지만 이름으로 해서 난 넌 이렇게 하겠습니다. 됐죠? 자 그래서 플레이를 한번 해보시면 되겠네요 자 한번 해보세요

그래서 플레이를 했을때

T로 이동 됐어요 T로 이동하고 Y로 이젠 됐어요

안녕

자 요렇게 하겠습니다 가면서 합니다 가면서 자 가면서 y

감에서 사기가 좀 힘들거 같아요 이제 잽싸게 누르면 됩니다 잽싸게 누르면 끝났습니다 자 그래서 그죠? 자 그래서 요것만 확인하세요 우리가 이제 키보드에서 확인하기가 그렇게 쉽지는 않아서 어떻게 해보시면 될 것 같아요 그렇게 쉽지는 않아서 어떻게 해보시면 되겠어요 자 그래서 여기서 T를 눌러서 이동을 하는게 맞죠 그 다음에 Y를 눌러서 A를 누르면 해저만 하죠 이렇게 하는지만 하나 둘 셋 하겠습니다 했죠? 여기까지 안되신 분 없죠?

자 그래서

자 그래서 요것도 추가 합시다 턴 여기서 이렇게 합시다 클릭


스턴, 프로바이드 이렇게 할까요? 컨티뉴스, 스턴, 프로바이드 이렇게 한다고 보도록 하죠. 그러면 모두 할 수 있도록 오른손에서 스냅 턴 만들잖아요. 연속으로 회전도 가능하게 자 그래서 이렇게 합시다 노크모션 끊어서 넣고

자 로커모션 뭐입니까? 끌어서 어디에 턴을 선택한 다음에 그거를 컨티뉴스 턴 프로바이드를 넣고 그런 다음 로커모션을 이렇게 넣어주세요. 됐나요? 그렇게 해주신 다음에 고구마 넣어주시면 되겠네요

여기다가 클릭! 라이터죠?

여기다가 턴, 턴 만들어줍시다. 그러면 뭐

피쳐로코모션

라이트, 스냅탄이 아니고 그냥 탄, 있죠? 있습니까? 이렇게 넣어주시면 되겠네요.

자 됐죠 그래서 테스트 한번 해보고 싶으시겠습니다

자 그래서 플레이

플레이 한번 해보겠습니다.

자, 됐죠? 요것만 확인하겠습니다. 와인 넣어서 되는지 확인하겠습니다. 되죠?

눌렀다 뗐다 바로 하면 스냅이 되고 계속 누르고 있으면 커팅이 유효수가 되는거죠 아시겠죠? 자, 그러면 10분간 쉬었다가 하도록 하겠습니다. 10분 쉬겠습니다.

자녀 얘기나 이혼 사유를 미리 출연자에게 알려주면 혹시라도 충격받을까봐 남자 출연자를 위해 알려주지 않았다고 와 진짜 친절하신데? 너네 진짜 뭔가 잘못 만들어진 것 같은데

시청해주셔서 감사합니다

복싱선수 카넬로는 21년간 70원 넘는 경기입니다. 복싱선수 카넬로는 21년간 70원 넘는 경기입니다.

랭더 불멍뒤조도 I keep it real 존가돈 안되면 매라도 벌어 직업 사채껴 난 일리니 모두 깨끗한 청란을 보고 사 떼지도 찔러 난 양심이 성감돼 억질러진 물란조아 담아도 쏟아 만들어 너네 싸그리다 쓸어버린 쓰나미를 패밀리 김출 Get the fuck out 지중회사처럼 번창 필터링 없이 바로 역장 대화 효과 하나마자 엄청 누가라고 나만하면 눈치 존가고 맘대로 마치게 이 축제 난 전세계 유일무이 마치 항공물질 내가 두려운 건 오직 일진 빛

레드 레드 오케이 그대로 하면 돼 옐로우 그린

야, 이 개X끼야! I can fly!

아니 그냥 아이킥 플라이하면 나는 그렇게 다 맞히고 뭔 개소리야 총 알려줬어 렛츠기릿

오빠 천천히 주유소에서 잠깐만 멈춰봐봐 왜? 오빠 운전한다고 고생했는데 내가 기름 만땅 넣어줄게 아파? 응 나 아까 아파서 병원도 갔다 왔고 약국도 갔다 왔어. 나 약 먹고 푹 쉬면 싹 나아질 것 같아. 오빠 우리 오늘 PC방 가서 각자 하고 싶은 거 하면서 놀까? 어? 어! 좋지! 나 PMS 기간이라 예민한 거 다 끝나면 연락할게. 사랑해! 오빠 오늘 마지막 날이라고 친구들이랑 레이드 돈다고 하지 않았어? 어 맞다 맞다 전 남친 전화왔어 돈까스? 오빠 차기 주유소에서 잠깐만 멈춰봐봐 왜? 오빠 운전한다고 고생했는데 내가 기름 만땅 넣어줄게

아파?

응, 나 아까 아파서 병원도 갔다 왔고 약국도 갔다 왔어. 나 약 먹고 푹 쉬면 싹 나아질 것 같아. 오빠, 우리 오늘 피스...

오만한 운영 심심하면 무점 겸 통통 속이 비어버린 컨텐츠 과도한 BM 무너진 밸런스 유저끼리 갈라치기가 시작돼 이래도 안 접어

13년동안 5천만원 안갚아서 놀란던 여배우 바로 이정은 근데 평소에 생활연기랑 알바연기 같은거 완전 이정은은 잘해서 돈만은 벌었을텐데 왜 5천만원 안갚았어요 돈이 있어야 갚죠 실제로 이정은은 40살이 될때까지 식당 서빙을 하거나 녹즙을 팔고 다녔음 그래서 알바연기를 그렇게 잘했던 건데 알바를 할수 밖에 없었던 이유는 카메라 공포증때문에 평생을 NG내며 대사를 한마디도 못 외웠던 거였어. 그러다 슬슬 영화 연출이라도 하려고 동료 연예인들에게 5천만 원을 빌렸지만 바로 폭망했고 또 알바를 전전하다가 49살에 되었을 때 우연치 않게 어떤 스릴러 영화에 캐스팅되었는데 내 귀여운 얼굴이 공포스러울 수 있을까? 하지만 걱정과 달리 영화의 신스틸러가 되며 무려 13년 만에 5천만 원을 결국 갚았다는데 그 영화의 정체는 다들 알다시피 황금정료상을 수상한 기생충이었다.

13년동안 5천만원 안갚아서 놀란던 여배우? 바로 이정은! 근데 평소에 생활연기랑 알바연기같은거 완전 이정은은 잘해서

블랙로드의 빈두덕

한 경험 아니잖아요. 저는 그렇게 접근할 뻔 했죠. 저는 그래서 그게 좋았어요. 접근 시작하도록 하겠습니다. 좀 깨끗했으면 좋겠는데. 자 그래서 이제 우리가 무브하고 턴을 했고 턴은 어떻게 했어요? 트랜스포메이션 프로젝트 0이고 얘도 0이죠. 둘다 0입니다. 그 다음에 뭐... 얘를 꺼도 되죠. 보통은 스냅으로 다 합니다. 알겠어요? 스냅으로 많이 하는데 필요에 따라서 들어갈 수가 있겠죠. 그러면 나중에 이렇게 활성화시켜 얘는 꺼버리고 활성화시켜 버리면 되겠죠 알겠죠? 그거는 뭐 나중에 프로젝트 할 때 그렇게 하시면 되겠습니다. 아시겠죠?

필요에 따라서 이렇게 얘는 꺼둔 상태로 하시고 스냅톤으로 하시다가 얘가 필요하면 얘는 끄고 얘는 켜고 하는 식으로 고생해도 됩니다 나중에 알겠죠? 그럼 나중에 뭐 우리 게임 만들때 한번 해보도록 하겠습니다 VR로 게임 하나 만들때 알겠죠? 자 그러면 지금은 스냅칸만 이렇게 해주도록 하겠습니다. 자 됐죠. 그렇게 됐구요. 그렇게 됐습니까 그러면 텔레포트를 한번 해보도록 하겠습니다. 우리 끝난게 뭐죠? 레이 끝났고

그쵸, 회의 끝났고, 그 다음에 뭐...

레이크가 끝났고 무브가 끝났죠, 무브가. 그리고 커모션. 그랩해서 이제...

이거 다 포함되어 있지?

다 초번데이 되죠? 그렇게 하는건가? 자, 데이 끝났고 또 코모션 프로바이더 끝났고 이번에는 뭐? 그래서 여기서 뭐 move 하고 턴을 했죠 여기서는 뭐 move를 하고 칸을 했죠. 칸은 또 어떻게 나온다? 스냅턴이 있고. 스냅턴 커팅이요소는 난다. 라고 생각하시면 되겠습니다. 후보는 이동, 회전. 그렇게 하고 이제 텔레포테이션을 한번 해보도록 하겠습니다 텔레포테이션 자 그리고 텔레포테이션을 하고 클라임까지 클라이밍 클라이링까지 한번 해보도록 하겠습니다.

자 그래서 이제 텔레포트를 한번 배워보도록 할텐데


자 그래서

제가 텔레포트 할 때 벗어나는 경우가 있거든요. 그래서 VR을 쓰고 하시는 분들은 어때요? 미리 합니까? 그 치자마자 어디까지 경계면을 경계를 해서 어디까지 유지했는지 지점하잖아요. 그쵸? 자 그래서 텔레포.. 텔레포테이션 도모? 로컷 모션 중에 하나입니다. 텔레포트 도모 텔레포테이션도 노코모션 중에 하나니까 한번 해보도록 하겠습니다. 그래서 자 그래서 텔레포트 있죠

저 히칼렛... 히칼렛... 했습니까? 제가 그랬었나?

자 그래서 이렇게 해주시면 되겠습니다.

뭐가 안 겹치게 해야 할 것 같습니까? 헬리콥터 할 때 무브는 안되는게 되겠지. 동시에 되면 안되잖아요. 무브도 되고 텔레파토도 되면 헷갈리죠. 헷갈리게 되어서 뭘 해야 될지도 모르고 그래서 텔레포트 할때는 무브를 잠기시키고 다시 켜는걸로 그렇게 합시다 자 그럼 텔레포트 텔레포테이션이라고 할까? 텔레포트 라고 하지 말고 텔레포테이션

컴퓨터 치겠습니다. 자 됐죠?

자, 그렇게 하시고 그 다음에

자 그래서 텔레포테이션 프로바이더는 이미 되어있죠. 그래서 프로바이더를 넣어주셔야 되겠죠. 여기다가 노크모션, 미디어터, 미디어터, 미디어터, 여기서 노크모션을 풀어서 여기다 넣어주세요. 연결만 해주시면 되고 아까 한 작업이랑 거의 비슷합니다 근데 이제 텔레포트 로테이션을 할 때 맥까지 유의할게 있습니다. 그죠? 자 그래서

텔레포테이션 에어리어를 넣어주셔야되요. 그죠? 자 그래서 뭐를 넣어줘야된다?

여기서 적어봅시다. teleportation을 하려면 뭐가 있어야 합니다.


시청해주셔서 감사합니다. 텔레포테이션... 펜카가 있어야 됩니다. 두가지가 있어야 됩니다.

엑소

자 텔레포텐션을 하기 위해서는 뭐 텔레포텐션 이거 이거 있어야되고 탱커가 있어야되요

그러면 이렇게 하겠습니다. 텔레포트 스테이션, 테러리온, 우리가 뭐라고 했어요?

플로우라고 했죠.

플레임tv에 구독&좋아요 부탁드립니다!

됐습니까?

그러면

텔레포텐션을 하기위해서는 텔레포텐션 에어리가 있어야하고 텔레포텐션 잉크가 있어야하는데 에어리를 지점할게요. 공간이죠 공간 플로우로 가겠습니다. 내립니다. 내리고 플레임에 가겠습니다. 가셨나요? 여기 클래프 포테이션 에어리 를 넣겠습니다.

텔레피션 테어리어 좋았나요? 좋았습니까?


거의 비슷하죠? 아까 인터넷채널 화면과 거의 비슷합니다.

자 콜라이더에는 얘를 넣어 보도록 하겠습니다. 소울을 끌어서 넣어버리자

아, 안 되는구나. 1

여기다가 막 폴라이더에다가 여기다 1이라고 적었죠? 여기 누르셔도 됩니다. 센터 치니까 자 플로우를 걸어서 여기다가 넣어보도록 하겠습니다 들었나요?

자 들어갔죠? 근데 얘가 이제 그 플레인이 뭐로 되어있어요? 메쉬 랜프라이드로 되어있으니까 매쉬콜라이저는 충돌감지를 잘 못하는 경우가 있다고 제가 그래서 컴백스로 하시면 될 것 같아요. 일단은 대놓고 잘 안되면 누릅시다 잘 안되면 웬만하면 감지하는데 빠르게 지나가면 안되요 텔레포트가 너무 빠르면 충돌 감지를 못하죠 나중에 잘 안되면 체크하세요. 알겠어요? 알겠죠? 자 그러면 봅시다. 플로우에 가서 여기 다시 돌아가서 테레포테이션 다시 돌아가서 여기서 이제 그 테레포테이션 테러리어를 우리가 넣어준 상태고

플로우를 풀어서 여기다 넣어주세요. 됐습니까. 자 이렇게 그대로 넣어주시고

자, 그다음에

자, 레이로 가겠습니다. 레이로 풍돌감지에 대해서 자, 레이로 가겠습니다. 레이로 갔더니 자 이렇게 이제 a가 되어있고 라이트로 되어있죠 라이트로 그죠? 자 그래서 라이트가 이렇게 되어있습니다. 자 그래서 쭉 내려서 가시면

여기 오셨죠?

레이는 좀 꺼두겠습니다. 얘는 지금 얘하고 같이 있으면 안되요.

얘하고 같이 쓰면 충돌나니까 이렇게 해서 얘를 꺼둡시다 XR 레입을 꺼둡시다 됐어요 X-Ray를 꺼뒀죠. 그렇게 하신 다음에 빈 오브젝트를 만들겠습니다.

수고하셨습니다.

자, 그런 다음에

자 그러면 라이트에 가서

여기까지 해보죠. 라이터에서 텔레포트 기능까지 같이 자 오른쪽이 뭐하고 있어요? 턴을 하고 있죠 턴 오른쪽은 뭐 턴을 하고 있죠 자 그래서 여기 보시면 무브에서는 이렇게 하고 있어요 오른쪽은 턴을 담당하고 텔레포트도 같이 담당해 주도록 하겠습니다. 자 됐죠? 자 그렇게 됐고 그러면 여기에서

자 그러면 라이트에서 하나 만들어보도록 하겠습니다. 왜냐하면 A를 이용해서 뭐만 했으면 좋을까요? 레일을 발사해서 충돌하는지 안하는지 그거만 했잖아요 색깔 변경하고 그거밖에 안했잖아요 근데 보통은 어떻게 한다? 메일을 이용해서, 텔레포터를 많이 이용해서 근데 이제 지금 이거 지금 이거 이거 한거하고 텔레포터 같이 해버리면 총놀라니까 잠시 꺼둔거죠 골든무브에서 클릭하여 마우스워치 버튼 빈 옵젝트를 만들겠습니다.

만드셨나요? 텔레포트 인테렉트로 하겠습니다. 텔레포트 인테렉트로

자, 됐죠? 텔레포트 인트랙터 자, 그래서

XLR, 텔레포트, 인터랙트 클릭, 치우고

xrlay라고 쳤더니 xrlay-crypto 예죠?

자 됐습니까? 자 그래서 기회를 그대로 넣어주겠습니다.

그다음에 라인 비주얼을 다뤄야 되겠죠? 라인 비주얼 엑셀

xr-interactor-line-visual 이거 같이 넣어주시면 되겠죠 그러면 뭐 똑같이 생긴다? 라인 랜더로 똑같이 생깁니다. 아까 배운거구요. 이렇게 했습니까? 자 이런식으로 넣어줬고 라인 비주얼 까지 이렇게 생겼습니다. 자 그래서 그레이

라인 비쥬얼 크리에이트 여기서 이렇게 클릭해서 이렇게 당길까요?

그 다음에 호텔을 가야 되겠죠

롤 그대로 하겠습니다.

그래서 뭐 똑같이

하심이 내리네요. 그래서 여기서 디폴트 라인 하셨고 내리고 그 다음에 엑사이 트랙트 라인 비교를 해서

얘도 그레이 뭐 요렇게 할까요? 그레이 하시는거 아니에요? 파란색 요렇게 되게

시청해주셔서 감사합니다!

이렇게 이제 색상도 푸른색으로 그려보도록 하겠습니다.

자 됐죠? 나머지는 그대로 할게요 자 이렇게 100백만 한 번 더 보여 드릴게요

그라데이션 쪽으로 넣어봅시다 그럼. 색깔은 그대로 그라데이션 쪽으로 넣어봅시다. 얘는 흰색이 되겠군.


다음에 만나요

이렇게 작업하도록 하겠습니다.

얘도 앞쪽만 인쇄

됐죠? 여기서 이후로 그만 해보도록 하겠습니다.

자, 됐구요. 다 됐으면 여기 옵니다. 로우! 로우 오셨어요. 플로어링은 뭐가있죠? 텔레포테이션 테러리가 있습니다. 그래서 텔레포테이션, 구역이죠 구역.

인트랙션 레이어 마스크가 있습니까? 클릭해서 에드 레이어

펼치겠습니다 밑에다가 텔레포트 되어있어요 텔레포트 되어있네

자 이렇게 되어있습니다.

수고하셨습니다.

그럼 여기 와서 보여주시면 되겠습니다.

텔레포트 이렇게 해주시면 되겠죠. everything. nothing. everything 하셔도 되긴 되는데 텔레포트 하시고

끝!

텔레포트 텔레포트 라고 이렇게 해 주셨죠 그러면 텔레포트 에이션 에어리어 에 클레오포트를 넣어주시고

그죠? 자, 그 다음에

자, 이야기 가보도록 하겠습니다. 텔레포트, 텔레포트, 아이고 잘못 적었는데, 텔레포트죠. 잘못 적었네요.


이렇게 했습니다.

자 됐죠

레이어마스크를 찾아봅시다. 엑셀레이 레프터 있습니까? 인테렉션 레이어마스크 뭐? 어디에만 받는하게 텔레포트 텔레포트만 받는하게 자 됐죠

어떻습니까?

그쵸? 자 그 다음에 핸드 니스는 뭐 핸디드 니스는 라이터로 합시다 샌디드니스 그니까 우리가 뭐에요 라이트에서 회전과 퇴원 그렇게 안나오겠잖아요 됐습니까 자 요렇게만 하시고 자 밑으로 쭈욱 내려갑니다 밑으로 쭈욱 내려가시면 여러가지가 있는데 이따가 뵙겠습니다.

그대로 한번 실행시켜 볼까요? 그대로 한번 해보도록 하겠습니다.

자 실행만 시켜보겠습니다.

바닥을 찍으세요 오른쪽

자 플레이를 하셨습니까?

자 와이 색깔이 변하죠?

그죠? 바깥에 있을 때하고 안에 있을 때하고 색깔이 다르죠? 그죠?

자 그래서 여기서 찍어서 딱 이동하게 그렇게 해야되겠죠. 됐습니까? 자 그렇게 이제 됐다는 것을 웨이가 이제 반응하고 있는 것을 이제 봤죠. 여기서는 뭐 눌러보면 아무런 변화가 없어요 아무런 변화가 없어요 이젠 뭐 더블도 누르면 변화가 없습니다

왜 이렇게 된건지 확인을 해보도록 하겠습니다. 자 보도록 하겠습니다. 흠 자

자, 끄고 자, 그럼 얘기가 오겠습니다.

자 어디가시냐면

자 몬스터부터 한번 변경을 해보도록 하겠습니다. 플랫폼트 인트랙터 쭉 내려가시면 자 레이캐스트 컨피규레이션 라인 타입이 있죠. project curve 라고 바꿔 보겠습니다. Projectile Code

라인 타입을 프로젝트 타입으로 바꿨습니까?

자 그래서

벨로시티도 16 이렇게 되어있어요 그대로 두고 한번 써보겠습니다 그런 상태에서 다시 플레이를 한번 눌러보도록 하겠습니다.

자 플레이를 한번 해볼게요.

플레이 버튼을 눌러보시면

자 됐죠? 굽어졌죠 이렇게? 그쵸? 와이

굽어졌죠 이렇게 그죠? 더블 눌러도 아무런 변화는 없습니다 됐죠?

자 그래서 이렇게 이제 라인이 달라졌죠 포물선을 그리는 걸 발견할 수 있습니다 이렇게 포물선을 그리죠 자 됐습니까

그래서 라인이 달라졌고 약간의 풍선을 그리는 것을 알 수 있습니다. 풍선을 그리는 라인으로 하셔야 되겠죠. 스테이트가 아니고 텔레파토로 해야합니다.

벨로시티를 10으로 바꿀까요 클릭 여기 보시면 쭉 내려가시면 벨로시티가 16으로 되어있어요 10으로 바꾸겠습니다 7을 10으로 변경하고 플레이를 다시 한번 해보시면 어떻습니까? 바이!

라인이 많이 달라졌을 겁니다.

자 다시 갈게요 끝난김에 뭐 별거 한것도 없는데


자, Y, T. 됐어요. 이렇게. 자, 됐습니까? 이렇게 이제 후보 지름으로 볼 수 있죠 자 됐습니까 그러면 이제 여기 갑니다 텔레포트 드래프트가 다시 올라오고 있어요.

칼레포트 언더바이크래프트 보셨나요 뭔가 보이게 하고 싶다 밑으로 쭈욱 내립니다 레티클 찾으셨습니까?

아 여기있네 여기 아니고


레티클 켜지셨어요? 텔레포트 언더바인터랙터에서 쭉 내리시면 XR인터랙터 라인 비주얼 쭉 내려가시면 레디클이 있죠. 있습니까? 그래서 레트클이 존재합니다. 자 그래서 우리는 여기에서 보이도록 한번 해보도록 하겠습니다. 자 그래서

뿌우우우우

자 여기 가볼까요 여기 reticle 에서 prepep 가겠습니다 샘플 prepep

메티클을 찾아보세요. 아 텔레포트 찾아보세요. 그러면 이제 여러가지가 있죠.

요렇게 생긴게 있고 요렇게 생긴게 있고 요렇게 생긴게 있습니다 자 그래서 골라서 넣어주시면 되겠네요 자 그래서

자, 저는 얘를 넣겠습니다. 응? 저는 얘를 넣겠습니다. 불을 넣어보죠. 헬리콥터 에티컬이 비어있죠, 텔레포트 텔레포트가 에티컬이 비어있죠, 그거를 비어있죠 뭐 에러, 클라임 텔레포트 에어리오 예를 한번 넣어볼께요 뭐 그죠 뭐 취향에 따라서 아무거나 넣어도 되요

그냥 넣어보시면 되겠네요. 그쵸? 그러면 뭐 Direction 탭 네티크를 어떻게 해야되나? 됐습니까? 그렇게 하신 다음에

진짜 블록킹도 안나옵니다. 여기다가 보여드리겠습니다. 블록킹 트래프트 플래닉 안됐을때

됐나요? 자 그래서 매틱을 넣고 디렉셔널 텔레포트 매틱을 이렇게 넣고 그 다음에 블록 레티끌, 블록킹 테라프트 레티끌을 이렇게 넣고 그죠? 자 그래서 이제 플레이를 한번 해보세요

자 플레이를 한번 해보시면 자 무슨 말인지 아실거에요

자 됐죠? 나오죠 이렇게? 나옵니까?

자, 나오지요.

안녕

자, 안녕히 계세요.

자, 어떻습니까?

다시 플레이를 눌러보면 좋습니다.

자, 됐어요. 자, W를 누르게. 자, Y를 설정하신 다음에 Y를 설정하셨지, W를 누르게.

이렇게 되는것을 확인할수 있습니다.

다음에 만나요

그래서 우리가 어떻게 할 거다? 선택되어 있는 상태에서 W를 누르면 텔레포트가 되게 그렇게 한번 해보도록 하겠습니다.

자 그러면 여기 갑니다 텔레포트 인트랙터 보셨죠

자 여기에서 어디를 가시냐면 여기 옵니다

자 여기죠. XR 레이 인트랙터. 이 부분이죠. 이 부분에 오셔가지고

이제 내 위치가 셀렉트 되어야되죠

그쵸? 자 그래서

자 그래서 이제 이 오브젝트가 잘 나오고 있죠 자 됐어요 지금은 어때요? 그냥 위치가 레이에 들어왔다는 것만 알려주죠 그래서 저희가 이것을 셀렉트로 처리를 해줘야 합니다 다시 한번 얘기할께요 다시 한번 얘기하면 플레이를 했을 때

텔레포트가 될려면 일단은 Y를 누르시고

레이가 되는 상태죠. 여기서 이제 셀렉트 처리를 해줘야 되겠죠. W를 눌렀을때. 레이만 지금 감지되고 있는 상태입니다. 그래서 이렇게 해주시면 될 것 같네요 자 그래서 어디로 가느냐 자 input 여기입니다 xrlay인터랙터 밑으로 쭉 내리시면 인풋 컨피규어레이션이 보이시죠

자, 그죠? 여기를... 어느 쪽에 있냐면... Selection Configuration 밑에 아 여기네 여깁니다 Selection Configuration 밑에 Input Configuration이 있죠 그래서 셀렉터 됐다는 걸 알려줘야 됩니다 그죠 그죠 그래서 무언가를 클릭해서 셀렉터를 하지 않았어요 자 그래서 그래서 이렇게 해주시면 될 것 같네요.

그래서 여기 셀렉터 인풋 있죠. 인풋 컨피규레이션에서 셀렉터 인풋 있죠. 얘를 클립

자...뿌리고 자 뭐를 차냐면 어... XR 라이트

하이파이브 하이파이브

쭉 내려가시면 로커모션을 찾아보세요

아 텔레포트 모드가 있습니까 엑셀라이트 로커모션 텔레포트 모드 있습니까 걔를 선택하세요 얘도 얘죠

됐습니까 뭔가 이제 셀렉트가 되지 않아서 선택이 되지 않아서 그렇습니다 다 빼셨어요 자 되셨나요? 자 셀렉터 중요합니다 이거 셀렉터 그쵸?

그 다음에 하나 더 넣겠습니다


라이트죠, 라이트로 치겠습니다.

밑으로 쭉 내리시면

아까 로커모션 있었죠? 테레포트 모드 캔슬. 아까 뭐 선택했어요? XR-I 라이트 로커모션 테레포트 모드 캔슬을 선택하였습니다. 아까는 모드로 선택했는데 텔레포트 모드로 선택했는데 지금은 텔레포트 모드 캔슬을 선택하겠습니다. 되셨죠?

끝났어요?

그러면 여기도 Activate로 가겠습니다.

그 클릭 요 밑에 xri 라이트라고 있습니다. 자 인터넷 채널 찾아보세요

Interaction 이라고 있습니까? Interaction 다음에 Activate를 찾아보죠.

여기네

됐습니까? 그 다음에 클릭 메뉴를 찾아보겠습니다.

밑으로 쭉 내리겠습니다. 줄일까?

아 이거 너무 많아 자 택시야 라이트로 자 됐어요? 자 그래서 그 인터랙션 액티베이트 벨류 됐어요? 이렇게 선택하면 되겠네요

됐죠

그래서 라이트 텔레포트 모드, 라이트 로커모션 텔레포트 모드 캔슬, 그 다음에 라이트 트랙션 애티메이트 라이트 인터넷 채널 키워드 이렇게 넣어주시면 되겠네요 그쵸?

어 됐어요

자 그러면 플레이해서 한번 해보시죠 잘 될겁니다 저는 아까 하기였습니다

자, 플레이 한번 해보겠습니다.

자 됐죠? Y, W, 6이죠?

안녕

요렇게 하고 서브 가자라인 맞죠? 맞죠? 가자라인 붙여도 되네요 그죠?

멀리있는곳에 하시면 이동이 됩니다. 다시한번 얘기해드리겠습니다. 플레이를 했을때 신 남인을 보세요. 신 남인을 보세요.

게임 많이 해서 보면 움직이는 것 같지도 않아서

진짜 쎘죠? 진짜 쎘네 그래서 Y 올리 저 멀리를 제가하신다음에 해볼려고 했죠? 저 멀리있는 부분을

됐어요?

됐습니까? 욕하지 않으신 분은 없죠?

자 여기까지 안되신 분 있나요? 여기까지 안되신 분? 없죠? 그죠? 자... 그래서 메뉴 위치만 잘 아시면 되겠습니다. 알겠죠? 물론 뭐 코드를 짜야, 상황에 따라서 코드를 짜야 되는 경우도 있지만 그 이유는 거의 거저먹기죠. 맞습니까? 그죠? 상황에 따라서 그죠? 코드를 짜야되는 부분, 응용해서 짜야되는 부분이 있긴 하지만 거의 어때요? 지원하는 편이죠. 지원해서 우리가 그대로 쓰시면 되겠습니다. 무슨 말인지 알겠죠? 그죠? 자 요렇게 이제 그 고인을 우리가 어디까지? 텔레포트까지

우연을 했습니다. 그죠? 잘되고 있죠?

됐어요

그 다음에 뭐 밖에서 하면 안되죠 당연히 텔레포트를 벗어나면 당연히 안되죠 그죠

그래서 텔레포트가 잘되고 있다는 것을 보여드렸습니다.

자 됐죠

자 그렇게 됐고 그 다음에 얘기해 보겠습니다. 큐브 있죠 큐브. 큐브를 한다고. 그로우죠 그로우. 살짝 줄일까요? 자 이렇게 한 번 해보겠습니다. 롤을 클릭 제가 반으로 좀 줄이겠습니다. 엑스를

스케일이죠. 자 2.5로 줄이겠습니다.

플로우를 X를 스케일해서 2.5로 줄였습니다 컨트롤 D 옆으로 뺄까요

옆으로 뺐죠? 자 그러면 그대로 하고 그 다음에 보시면 메시 렌더로 가서 여기에 넣어 보도록 하겠습니다 매쉬랜드로 클리어

그렇게 있죠? 자 그래서

자 이렇게 색깔있는걸 넣어보도록 하겠습니다.

달라졌죠?

여기서는 레드키를 잘 보이죠. 그래서 Y를 누르신 다음에 W를 누르면 제가 잘 가는데 여긴 어때요? 안 보이죠?

그죠? 반응을 안하죠 아 얘를 꺼야되겠네 뭐를 꺼야돼? 요.. 요기요기 복부당기죠 그래 뭐를 꺼버리면 클럽트 에어리어를 꺼버리면 그죠?


치즈 토핑을 통으로 뜯어내서 어깨 감자에다가 올려가지고 이게 바로 감자 프라이거든요? 감자를 찢어 넣어서 치즈만 묻혀주면 완성이 됩니다. 바로 섭방했죠? 저희 집 점심은 뭐니뭐니 해도 한국의 밥집 아니겠습니까? 여기서는 메디컬이 표시되지만 저쪽은 좀... 메디컬이 안보이죠? 감기도 못하죠? 알겠죠? 그렇다는 것을 기억합시다

그러니까 텔레포트 에어리어 공간에 들지 않으면 레드크리에이터가 안보이죠 자 됐습니까

렛츠미 컴퓨터 크리에이터

자 요렇게 합시다

뜨거워

텔레포테이션이라고 하죠.

자 어떻습니까 그래서 얘를 꺼내서 밑으로 넣어보도록 하겠습니다.

끝!

됐습니까?

그래서 이렇게 합시다


자, 이름을 이렇게 바꿔줬습니다. 자, 됐죠? 자, 그러면...

이제 뭐를 해야되냐면 앵크를 해야됩니다. 우리가 뭐를 안했어요.

세월일은 우리가 했죠 세월일은 했지만 우리는 늘어나지 않았어요 그래픽 포테이션 잉크는 아직 하지 않았습니다 알겠죠 일단 앵커를 하나 만들고 48분이니까 앵커를 하나 만들고 10분을 쉬겠습니다. 일단 만들기만 만들어 놓을게요.

자 여기다가

마우스 오른쪽도 빛나 오젝트로 만들겠습니다. 앵커라고 할까요?

자 됐죠? 펜커를 하나 만들어주고

자 실린더를 하나만 만들어 보겠습니다. 3DOZ

실린더라고 있어요. 실린더. 이렇게 만들어 놓기만 만들어 놓겠습니다. 자 됐죠. 자 그러면 10분만 쉬었다 가도록 하겠습니다. 10분만 쉬겠습니다. 10분만 쉬겠습니다.

3살인데? 오렌지 향 나, 오렌지 향. 예스, 노우! 노우! 예스, 노우! 예스! 뭐야, 엄청 불안해 소리가.

자 들어간다 뭐야? 변기통 소리 나는데? 예쓰 노우 예쓰 예쓰? 어 뭔데? 오오오오오오오오오오오오오오오오오오오

너무 궁금해 진짜 자 이제 눈 떠 너무 이상한데?

이제 마셔봐 뭔가 마시기 싫은데 궁금해 마셔볼게 엄청 맛있는데? 예스 노 콜라 아니면 사이다 예스 노 예스 노 맛있는 냄새가 나는데? 예스 노 들어간다 뭔데? 아무 소리도 안 들리는데? 예스 노 예스! 어? 또 탄산인데? 오렌지 향 나 오렌지 향 예스 노 노! 예스 노 예스! 뭐야 엄청 불안해 소리가 들어간다 뭐야? 변기통 소리 나는데? 예스 노 예스! 예스? 어! 어? 너무 궁금해 진짜 자 이제 눈 떠 너무 이상한데? 자 이제 마셔봐 뭔가 마시기 싫은데 궁금해

마셔볼게. 오! 엄청 맛있는데? 예스, 노! 예스! 오! 콜라 아니면 사이다, 맞지? 예스, 노! 노! 예스, 노! 예스! 오! 멋있는 냄새가 나는데? 예스 노우! 예스! 들어간다. 뭔데? 아무 소리도 안 들리는데? 예스 노우! 예스! 어? 뭔 탄산인데? 오렌지 향 나, 오렌지 향. 예스, 노우! 노우! 예스, 노우! 예스! 뭐야, 엄청 불안해, 소리가. 자, 들어간다. 뭐야? 연기통 소리가 나는데? 예스, 노우! 예스! 예스? 어. 뭔데? 오? 오!

아 너무 궁금해 진짜 자 이제 눈떠 색깔 너무 이상한데? 자 이제 마셔봐 아 뭔가 마시기 싫은데 궁금해 마셔볼게 엄청 맛있는데? 예스 노 콜라 아님 사이다다 맞지? 예스 노

멋있는 냄새가 나는데? 예쓰 노우! 예쓰! 죄송합니다. 뭔데? 아무 소리도 안 들리는데? 예쓰 노우! 예쓰! 어? 또 탄생!

오렌지향 나 오렌지향 예스 노우 노우 예스 노우 예스 뭐야 엄청 불안해 소리가 자 들어간다 뭐야 변기통 소리 나는데 예스 노우 예스 예스? 어 비슷한데?

너무 궁금해 진짜 자 이제 눈 떠 색깔 너무 이상한데?

마시기 싫은데 궁금해. 마셔볼게. 엄청 맛있는데? 콜라 아니면 사이다인가? 맞지? 멋있는 냄새 나는데? 뭐야? 아무 소리도 안 들리는데? 예스 노우! 예스! 오! 또 탄산인데? 오렌지 향 나 오렌지 향 예스 노우! 노우! 예스 노우! 예스! 뭐야 엄청 불안해 소리가 자 들어간다 뭐야? 변기통 소리 나는데? 예스 노우! 예스! 예스? 어! 뭔데? 오!

이제 눈 떠 너무 이상한데? 이제 마셔봐 뭔가 마시기 싫은데 궁금해 마셔볼게 어? 엄청 맛있는데? 예스! 노우! 예스! 노우! 콜라 아니면 사이다다 맞지? 예스! 노우! 노우! 예스! 노우! 예스! 오! 멋있는 냄새 나! 예쓰 노우! 예쓰! 들어간다? 뭔데? 아무 소리도 안 들리는데? 예쓰 노우! 예쓰! 어? 또 탄산인데? 오렌지 향 나 오렌지 향 예쓰 노우! 노우! 예쓰 노우! 예쓰! 뭐야 엄청 불안해 소리가 자 들어간다? 뭐야? 변기통 소리 나는데? 예쓰 노우! 예쓰! 예쓰? 어! 뭔데? 어? 어? 어? 어? 어? 어?

너무 궁금해 진짜! 자 이제 눈 떠! 색깔 너무 이상한데? 자 이제 마셔봐! 아 뭔가 마시기 싫은데 궁금해 마셔볼게! 어? 엄청 맛있는데? 예스! 노우! 예스! 오! 콜라 아님 사이다다 맞지? 예스! 노우! 노우! 예스! 노우! 노우! 예스! 오! 멋있는 노래! 냄새 나는데? 예쓰 노! 예쓰! 들어간다. 뭔데? 아무 소리도 안 들리는데?

예스 노우 예스 오? 또 탄산인데? 오렌지 오렌지향 나 오렌지향 예스 노우 노우 예스 노우 예스 뭐야 엄청 불안해 소리가 자 들어간다 뭐야? 변기통 소리 나는데? 예스 노우 예스 예스? 어 오? 오오오 오오오 너무 궁금해 진짜 자, 이제 눈 떠! 색깔 너무 이상한데? 우와! 자, 이제 마셔봐. 아, 뭔가 마시기 싫은데 궁금해. 마셔볼게. 엄청 맛있는데? 예스, 노! 예스! 콜라 아니면 사이다. 맞지? 예스 노우! 노우! 예스 노우! 예스! 오! 멋있는 냄새가 나는데? 예스 노우! 예스! 죄송합니다. 뭔데?

안 들리는데? 예스 노 예스! 오! 노탄산인데? 오렌지향 나 오렌지향 예스 노 노! 예스 노 예스! 뭐야 엄청 불안해 소리가 자 들어간다 뭐야? 변기통 소리 나는데? 예스 노 예스! 예스? 어! 뭔데? 오!

너무 궁금해 진짜! 자 이제 눈 떠! 색깔 너무 이상한데? 뭐야? 자 이제 마셔봐. 뭔가 마시기 싫은데 궁금해. 마셔볼게. 어? 엄청 맛있는데? 예스! 노우! 예스! 어? 콜라 아님 사이다! 나 맞지? 예스! 노우! 노우! 예스! 노우! 예스! 오! 멋있는 냄새가 나는데? 예스! 노우! 예스! 들어간다. 뭔데? 아무 소리도 안 들리는데? 예스 노우. 예스! 어? 어? 탄산인데? 오렌지 향 나, 오렌지 향. 예스 노우. 노우! 예스 노우. 예스! 뭐야? 엄청 불안해 소리가. 자 들어간다. 뭐야?

변기통 소리 나는데? 예스 노우! 예스! 예스? 어! 뭔데? 오? 오! 오! 오! 아 너무 궁금해 진짜! 자 이제 눈 떠! 너무 이상한데? 이제 마셔봐봐 뭔가 마시기 싫은데 궁금해 마셔볼게 엄청 맛있는데? 예스 노 콜라 아니면 사이다다 맞지? 예스 노 예스 맛있는 냄새가 나는데? 예스 노 뭔데? 예스 노

자 그러면 이제 수업을 시작하도록 하겠습니다.

자

자 그러면 여기 보겠습니다. 여기다가 뭐 넣었어요? 탱커 넣었어요? 탱커를 넣고 실린더 넣었죠? 자 앵커를 넣고 실린더 앵커 위치는 여기다 놓습니다 경계선 요정도

경계선이 이쪽이 됐어요. 여기와 여기 사이. 경계선. 그러니까 이쪽은 텔레포트 에어리가 돼. 에어리우가 되고 뭐였나?

그래서 여기다가 교통체에 두고, 끌어서 여기다가 배치를 했고 그 다음에 크기도 이렇게 변경을 했습니다


위치도 이렇게 1인데 y만 0.3로 했습니다. 1, 1, 0.3 됐어요. 그래서 탱커 탱커의 위치를 여기다 두고 그 다음에 밑에 실린드는 크기는 어떻게 했다 1 0.3 1 됐죠 이렇게 하셨어요 이렇게 하신 다음에

여기에다가 텔레포테이션 탱크라고 합니다

여기다가 뭐를 넣죠? 텔레포테이션 앵커 컴포넌트를 만드세요 클릭 텔레포텐션 앵커 라는 컴포넌트를 줍니다. 좋죠? 주신 다음에 얘를 뭘로 하죠? 탈락 랍핑하시면 안되고 탈락 됐죠? 되셨어요? 자 그 다음에 여기는 플라스틱 버튼을 눌러서 플라이더 버튼을 눌러서 이렇게 붙이세요.

자 붙였죠? 그러면은 여기에다가 클릭 텔레포트 인트랙터 여기에는 텔레포트가 들어갔죠. 마스크가 들어갔고. 그 다음에 라이트 이렇게 되어있죠? 했습니까? 자 플레이를 한번 해보겠습니다. 플레이를 했을 때 한번 봅시다


근처에 갔을때 봅시다. 여기는 이제 뭐가 사라져요. 레티끌이 사라지죠. 하지만 여기다 갖다 대니까 댓글이 나오죠?

맞죠? 된다는 얘기네 됐어요 여기까지 하셨어요 여기에는 레트킬이 안나오지만 매틱클이 나오죠? 매틱클 그죠?

여기까지 하셨죠

여기까지 하셨나요?

자 그래서 이제 여기까지 하셨고

자 그래서

자 요렇게 되셨고 그 다음에

자 위너 오리지널을 하나 만들겠습니다 마우스 오른쪽 버튼 빈 오브젝트 자 만드셨죠? 스냅 볼륨이라고 하죠? 스냅 볼륨

자 스냅 볼륨을 넣어주시고

자 그 다음에 여기다가 얘를 올려주겠습니다. snap-volume-click

엑셀 인트랙터 스냅 볼륨

이게 트랙터죠

유트랙터블이죠? 아 죄송합니다 유트랙터블

자, 인터렉트로

여기서 찾아봅시다. 인터렉터블

있네 자 엑사인터랙티브 스냅볼륨 아이고 찾기 어렵네 됐죠

됐습니까? 스냅볼륨이라는 기능을 한번 구현해 보겠습니다. 알겠죠? 됐습니까? 그래서 끌어서 스냅 볼륨이라는걸 구현을 해보도록 하겠습니다. 이렇게 하겠습니다.

박스 콜라이드를 넣어줍니다.

박스 콜라이더 넣어 주십시오.


이렇게 이제 베이킹을 하겠습니다. 됐죠? 끝

스냅은 어떤것을 셀렉트 해준게 아닙니다.

그러니까 이것입니다. 이것 좀 스네어를 해야 겠다. 스네어.

스냅볼륨 설명해주세요

오늘도 영상 봐주셔서 감사합니다.

설명좀 할게요

시청해주셔서 감사합니다.

자 됐어요. 그래서 스냅을 누르면 되죠. 물건을 특정 영역에 가까이 가져가면 자동으로 그 위치를 회전해 막혀요. 딱 붙도록 유도해주는 스냅 가이드 역량입니다. 자 그래서 그 앞에 텔레포트를 했을 때 그 앞에 버전에서 텔레포트를 했을 때 텔레포트가 되면 위치나 회전이 이상하게 되어있거나 그런 경우에 좀 깨있었거든요. 그래서 그걸 고치기 위해서 이제 만들어졌습니다. 그 전에는 어때요? 텔레포트가 되긴 됐는데 내가 원하는 위치에 내가 원하는 위치에, 내가 원하는 회전 방향으로 되진 않았어요. 딱! 부드럽게 딱! 이렇게 해주는게 뭐.

snap volume 입니다. 자 그러면 내리겠습니다. 자 그래서

수고하셨습니다.

그럼 우리 여기다가 박스 콜라이드를 만들어 줬잖아요 그죠? 그래서 박스 콜라이드를 만들어 줬으니까 요걸 좀 키우겠습니다

위안에 딱 넣도록 살짝 내릴거에요

이 정도면 됐네.

이정도면 됐죠? 이정도로 하겠습니다. 위치는 이렇게 따로 잡을 필요는 없습니다. 여기를 그리겠더니 됐죠? 자 이정도 팝스콜라이드를 만들고

자 됐어요? 자 그렇게 하신 다음에

자 그 다음에 스냅 볼륨에서 박스 콜라이드를 끌어서 여기로 붙여 놓으세요. 됐습니까?

자 그래서 되는지 한번 봅시다 플레이를 한번 해보시죠

자 플레이 한번 해볼께요

자, 됐죠? 자, 와이프

그래서... 됐죠? 안되신 분? 저는 잘 되었습니다. 끝

플레임tv에 구독&좋아요 부탁드립니다!

자 됐죠?

자 됐죠. Y를 누르시고. 이렇게 하니깐 이제 특히 나오죠. 그래서 W를 누르시고. 자, 됐대요. 필레포토같이 망하게 됐죠. 됐습니까? 안되신 분 있나요?

반대의 심문 없죠?

자 그래서 안되신 분들은 박스 콜라이너를 좀 조정해 주시면 되겠습니다. 위치를 좀 조정해 주시면 되겠습니다.

자 그래서 그죠? 자 이렇게 이제 그 딱 붙는걸 알 수 있습니다. 자 됐죠?

자, 그래서 그렇게 됐다는 걸 제가 말씀드리겠습니다. 자, 안되신 분 있나요?

자 저는 잘 되었습니다. 안되신 분? 없죠? 그래서 빈 오브젝트를 만든다는거죠. XR인터랙티브 스냅 볼륨을 넣어준거죠. 그래서 박스 콜라이더를 여기다 넣어주고 봤죠? 됐습니까?

같은 프로젝트에 넣으셔도 상관없습니다. 저는 따로 따로 구분했는데 같은 프로젝트에 넣으셔도 상관없어요. 같은 오브젝트에 넣으셔도 상관없습니다 알겠죠 그리고 앵커 앵커에는 뭐 텔레포테이션 앵커 를 넣고 텔레포트

이렇게 해줬죠 자 됐습니까? 됐습니까? 안되신 분? 안되신 분 얘기하세요

자 안되신분 얘기하시기 바랍니다 없어요 안되신분 없죠

안되신분 없죠?

자 그러면 이렇게 하겠습니다

그래서 우리가 배운 범위가 뭐에요? 트랙터, 레이, 복귀모션, 프로바이더 move, tongue, snap, tongue, continuous, teleportation, teleportation carrier, snap volume 까지 우리가 이제 했습니다. 그쵸? 자 됐습니까? 자 그럼 이렇게 합시다 자 저장하세요 저장

그럼 새해 복 많이 받으세요


시청해주셔서 감사합니다.

자, 때립니다. 때립니다.

끝냈습니다.

갑니다.

자, 됐죠? 그러면...


이렇게 한번 해보도록 하겠습니다.

뭐라 할거냐면

자 됐죠?

자, 이렇게 하겠습니다.

쪽지시험을 5문제를 보겠습니다.

ㄷㄷㄷㄷㄷㄷㄷㄷ

그 다음에 두번째 자 우리 만든게 뭐에요? 웨이

좋은 거 했죠?

그죠? 로커모션, 뭐라고? 로커모션


봅시다.

자, 이렇게 했는데 요거 있죠?

요거를 여러분이 똑같이 실습해서 만듭니다. 새로운 프로젝트를 열어서 이거

잠깐만요

끝!

</details>


<b>문제 1. Locomotion Provider의 역할 및 구조</b>

<b>XR Interaction Toolkit에서 Locomotion Provider 컴포넌트의 핵심적인 역할은 무엇이며,</b>

<b>Action-based 이동 방식에서 이동(Move)과 회전(Turn)을 구현하기</b>

<b>위해 Locomotion System과 각 Provider(Move, Turn) 간의 관계를 설명하시오.</b>

<b>Locomotion System(Locomotion Mediator)는 XR Origin 의 위치와 회전 같은 이동을 통합 관리한다.<br />예를 들어 각 입력이 한번에 입력 되었을 때 중재하는 역할을 해서 동시에 여러 Provider가 XR Origin을 제어 하지 않도록 한다.</b>

<code>Locomotion Provider</code>는 XR 환경에서 사용자의 이동, 회전, 순간이동 같은 <b>이동 동작을 실제 XR Origin에 적용하기 위한 컴포넌트이다.<br /></b>Move와 Turn은 입력을 받아서 실제로 XROrigin의 위치와 회전을 바꾸기 위한 것이다


<b>문제 2. 컨트롤러별 이동 및 회전 할당 (Left: Move / Right: Turn)</b>

<b>왼쪽 컨트롤러는 지속적 이동(Continuous Move)을 담당하고,</b>

<b>오른쪽 컨트롤러는 회전(Snap 또는 Continuous Turn)을 담당하도록 분리하여 설정하려고 합니다.</b>

<b>이를 위해 XR Origin 하위의 각 Provider 컴포넌트에서 XY Action 혹은 Input Action Reference를 어떻게 할당해야 하는지</b>

<b>그 절차를 서술하시오.</b>

<br />왼쪽 컨트롤러로 이동하고 오른쪽 컨트롤러로 회전하도록 설정하려면, Move Provider에는 <b>왼손 Move Action</b>만 연결하고, Turn Provider에는 <b>오른손 Turn Action</b>만 연결해야 한다.<br /><br />

<b>문제 3. Teleportation Area vs Teleportation Anchor</b>

<b>Teleportation Area와 Teleportation Anchor의 기능적 차이점을 비교하여 설명하시오.</b>

<b>특히, 사용자가 바닥 전체를 자유롭게 이동하게 할 때와 특정 지점(예: 순간이동 패드)으로</b>

<b>정확히 정렬시켜 이동시켜야 할 때 각각 어떤 컴포넌트를 사용하는 것이 적합한지 기술하시오.</b>

<b>Teleportation Area</b>

Area 어디든 레이가 닿는 지점으로 <b>자유롭게</b> 텔레포트

예: 바닥 전체를 돌아다니는 이동

<b>Teleportation Anchor</b>

정해진 한 지점(앵커 위치/방향)으로 <b>정확히 정렬</b>되어 텔레포트

예: 순간이동 패드처럼 정확히 서야 하는 자리(방향까지 맞추고 싶을 때)


<b>문제 4. Snap Turn과 Continuous Turn의 UX 차이</b>

<b>사용자의 시점을 회전시킬 때 사용하는 Snap Turn과 Continuous Turn의 동작 방식 차이를 설명하고,</b>

<b>VR 멀미(Motion Sickness)를 방지하기 위해 일반적인 상황에서 Snap Turn이</b>

<b>더 권장되는 이유를 서술하시오.</b>

<b>Snap Turn은 할당된 각도로 딱딱 끊어서 회전하게 되고 Continuous Turn 은 입력이 지속되는 동안 부드럽게 회전한다.<br /> Continuous Turn은 시점이 계속 회전 하면서 VR멀미를 유발할 가능성이 크기 때문에 Snap Turn이 더 권장 된다.</b>


<b>문제 5. Snap Volume의 동작 원리와 설정</b>

<b>유니티 6 XR에서 Snap Volume 기능을 사용할 때,</b>

<b>사용자가 쏜 Ray가 볼륨 내로 진입했을 때 발생하는 상호작용의 특징을 설명하고,</b>

<b>이를 구현하기 위해 Teleportation Provider와 상호작용하는 객체에 필요한 설정 사항을 요약하여 기술하시오.</b>

<b>Snap Volume은 Ray가 볼륨안의 콜라이더에 닿았을 때 정확하게 그 자리에 조준 할 수 있도록 도와 주는 조준 보정 컴포넌트 이다.<br /></b>

XR Ray Interactor에서 Raycast Snap Volume Interaction을 Collide로 설정해야 하고<br />Line Visual의 Snap Endpoint If Available을 켜야 한다.<br />Teleportation Anchor와 쓸 때는 Disable Snap Collider When Selected를 false로 둔다.
{% endraw %}
