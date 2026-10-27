---
title: "[Unity] URP 라이트 베이크 실습 프로젝트 보관"
date: 2026-10-27 12:04:00 +0900
categories: [개발일지, Unity 실습]
tags: [Unity, URP, Lightmap, 라이트베이크, 실습프로젝트]
---

라이트 베이크와 후처리 실습에 사용한 프로젝트 전체를 나중에 다시 열어볼 수 있도록 보관했다. 에셋만 약 949MB이고 영상 하나가 약 299MB라, 블로그 파일 이력에 직접 추가하는 대신 **같은 GitHub 저장소의 Release에 프로젝트 ZIP을 첨부**했다. 블로그에서 프로젝트를 내려받아 Unity Hub로 열 수 있다.

## 프로젝트 다운로드

- [실습 프로젝트 Release](https://github.com/SongYeChan1024/Kasil-portfolio-pages/releases/tag/unity-lightbake-practice-2026-10-27)
- [Unity 프로젝트 ZIP](https://github.com/SongYeChan1024/Kasil-portfolio-pages/releases/download/unity-lightbake-practice-2026-10-27/Unity-URP-LightBake-Practice-2026-10-27.zip)
- [ZIP SHA-256 체크섬](https://github.com/SongYeChan1024/Kasil-portfolio-pages/releases/download/unity-lightbake-practice-2026-10-27/Unity-URP-LightBake-Practice-2026-10-27.zip.sha256)

ZIP 크기는 약 **852MB**이다. 압축 내부의 파일 1,664개를 다시 읽어 포함 파일 목록에 기록한 SHA-256과 모두 일치하는 것을 확인했다.

이 파일은 **2026-10-27 시점의 스냅샷**이다. 이후 현재 작업 폴더의 변경이 자동으로 동기화되지는 않는다.

## 여는 방법

1. ZIP을 내려받아 완전히 압축 해제한다.
2. Unity Hub에서 `README.md`, `Assets`, `Packages`, `ProjectSettings`가 있는 `Unity-URP-LightBake-Practice` 폴더를 프로젝트로 추가한다.
3. **Unity 6000.4.0f1**로 연다. 프로젝트에 기록된 URP 버전은 **17.6.0**이다.
4. 첫 실행에서 패키지 설치와 Library 재생성이 끝날 때까지 기다린다. 인터넷 연결이 필요할 수 있다.
5. `Assets/Furniture_ges1/Scenes/URP_Sample_01.unity`를 열어 실습을 시작한다.

추가로 `Assets/Furniture_ges1/Scenes/scene.unity`, `Assets/LabStudio/Scenes/VR Gallery.unity`, `Assets/LabStudio/Scenes/VR_Gallery_01.unity`도 포함했다.

## 포함한 파일과 제외한 파일

`Assets` 전체와 `.meta`, `Packages`, `ProjectSettings`를 포함했다. 씬·스크립트·모델·머티리얼·텍스처·영상·볼륨 프로필과 기존 라이트맵도 보존했다. `Library`, `Temp`, `Logs`, `UserSettings`, IDE 생성 파일과 이번 작업의 `Exports` 폴더는 제외했다. 이 파일들은 원본 프로젝트 용량과 Git 기록을 불필요하게 키우므로 보관 대상에서 뺐다.

원본 Build Settings에는 존재하지 않는 `SampleScene.unity`가 등록되어 있었다. 보관 복사본에서는 실제 `URP_Sample_01.unity` 경로와 GUID로 교체했다. 현재 실습 중인 원본 프로젝트는 수정하지 않았다.

ZIP 안에는 실행 안내 `README.md`, 이후 별도 Git 저장소로 관리할 때 쓸 `.gitignore`, 포함 파일 목록과 SHA-256을 기록한 `PACKAGING-MANIFEST.json`도 넣었다. 이 ZIP 자체에 Git 변경 이력은 포함되어 있지 않다.

## 후처리 템플릿과 검증 범위

이 ZIP은 전체 프로젝트의 보관본이므로 원본 프로필에 있던 누락 참조도 그대로 남아 있다. 기본 템플릿에 쓸 때는 별도로 만든 [정리된 후처리 프로필 패키지]({{ '/posts/unity-urp-volume-profile-library/' | relative_url }})를 사용하면 된다. 해당 패키지는 새 GUID와 별도 폴더를 사용하므로 이 실습 프로젝트에도 추가로 가져올 수 있다.

복사한 파일의 SHA-256과 ZIP 구성을 확인했다. 전체 프로젝트의 신규 임포트·플레이·빌드와 모든 씬의 렌더링 결과를 검증한 배포본은 아니다. 실습 재개를 위한 프로젝트 스냅샷으로 보관한다.

기존 외부 에셋의 권리는 각 제작자에게 있으며, 이 글이나 프로젝트 스냅샷이 별도의 사용·재배포 라이선스를 부여하지는 않는다.
