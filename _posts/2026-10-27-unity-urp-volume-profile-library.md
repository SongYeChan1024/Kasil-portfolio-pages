---
title: "[Unity] 템플릿용 URP 후처리 볼륨 프로필 보관"
date: 2026-10-27 11:33:00 +0900
categories: [개발일지, Unity 템플릿]
tags: [Unity, URP, Volume, 후처리, 템플릿]
---

새 프로젝트의 기본 템플릿을 만들 때 재사용하려고 LightBake 프로젝트의 Volume Profile을 모았다. 프로필은 이미 `.asset`으로 저장되어 있어, 설정값과 하위 Volume Component를 그대로 보존하고 참조하는 LUT·텍스처와 `.meta`를 함께 패키지로 묶었다.

## 다운로드

- [템플릿용 정리 버전 다운로드 — 권장]({{ '/assets/downloads/unity-volume-profiles/URP-VolumeProfiles-Template.unitypackage' | relative_url }})
- [정리 내역과 새 GUID 목록]({{ '/assets/downloads/unity-volume-profiles/template-manifest.json' | relative_url }})
- [프로필 패키지 다운로드]({{ '/assets/downloads/unity-volume-profiles/URP-VolumeProfiles.unitypackage' | relative_url }})
- [에셋 목록·GUID·SHA-256·누락 참조 목록]({{ '/assets/downloads/unity-volume-profiles/manifest.json' | relative_url }})

기준 환경은 프로젝트 파일에 기록된 **Unity 6000.4.0f1 / URP 17.6.0**이다. 폴더 이름의 Unity6.6과 달리 실제 버전 기록은 6000.4.0f1이다. 다른 버전에서는 호환성을 확인해야 한다.

패키지에는 **프로필 37개, 참조 텍스처 26개로 총 63개 에셋**이 들어 있다. Unity/URP 자체 스크립트는 포함하지 않았으므로 대상 프로젝트에 URP가 필요하다. 원본 폴더 경로와 GUID를 유지했다.

## 정리 버전을 템플릿에 바로 적용하기

정리 버전은 **프로필 37개 + 텍스처 26개 + Global Volume 프리팹 1개**로 구성했다. 모든 에셋에 새 GUID를 부여하고 `Assets/TemplateVolumeProfiles` 아래에 넣었다. 원본 보관 패키지와 함께 가져와도 같은 GUID로 원본을 덮어쓰지 않는다.

1. URP 프로젝트에서 `Assets > Import Package > Custom Package`로 **URP-VolumeProfiles-Template.unitypackage**를 가져온다.
2. `Assets/TemplateVolumeProfiles/Prefabs/TemplateGlobalVolume.prefab`을 씬에 드래그한다. 정리한 `DefaultVolumeProfile`이 이미 연결되어 있으며 Global, Weight 1, Priority 0, Default 레이어로 설정되어 있다.
3. 카메라의 Post Processing을 켜고 Volume Layer Mask에 Default 레이어를 포함한다. 기존 Global Volume이 있다면 동시에 적용되어 효과가 중첩되는지 확인한다.
4. 다른 분위기를 원하면 같은 폴더 아래의 `URP Profile` 또는 `URP Post/v4/Profiles`에서 다른 프로필을 Volume의 Profile에 연결한다.
5. 씬을 저장해 템플릿에 포함한다. 기본 프로필은 URP의 전체 기본값을 교체하는 설정이 아니라, 이 프리팹에서 사용하는 프로필이다.

정리한 내용은 다음과 같다.

- `DefaultVolumeProfile`: 구현 파일이 없는 커스텀 컴포넌트 4개와 `m_Script: {fileID: 0}` 상태의 Unity Editor 테스트 컴포넌트 5개를 제거했다. 컴포넌트 목록의 fileID 참조도 함께 정리했다.
- `Movie_Profile 6_Black`: 구현 파일이 없는 `VolumetricFogVolumeComponent`를 제거했다.
- `Day_Post Profile`: Bloom Dirt Texture를 None으로, Dirt Intensity를 0으로 설정했다. 두 항목의 오버라이드는 유지해 다른 낮은 우선순위 Volume에서 Dirt 설정이 섞여 들어오는 것을 막았다. 일반 Bloom 설정은 유지했다.
- 그 밖의 프로필 효과 값과 텍스처 내용은 유지했다. 패키지 내부의 프로필·텍스처 참조는 새 GUID로 연결했다.

없는 커스텀 효과는 제거했으므로 해당 효과까지 복원한 버전은 아니다. 프리셋별 색감과 조명 결과는 대상 씬에서 확인해야 한다.

별도 Unity 6000.4.0f1 / URP 17.6.0 프로젝트에서 정리 버전의 **프로필 37개와 컴포넌트 258개**를 실제 로드해 누락 컴포넌트·오브젝트 참조가 없는 것을 확인했다. Bloom Dirt 비활성화와 Global Volume 프리팹 연결 검사도 통과했다. 패키지를 풀어 내부 64개 에셋의 해시와 경로를 확인했으며, 원본 63개 파일이 변경되지 않은 것도 확인했다. 이 검증은 화면 렌더링 비교를 포함하지 않는다.

- [Unity 검증 결과]({{ '/assets/downloads/unity-volume-profiles/unity-validation.txt' | relative_url }})

## 원본 보관본을 템플릿에 적용하기

1. URP 프로젝트에서 `Assets > Import Package > Custom Package`로 다운로드한 파일을 가져온다. 기존 프로젝트에 같은 경로나 GUID의 에셋이 있다면 먼저 백업하고 Import 목록을 확인한다.
2. `Assets/Settings/URP Profile` 또는 `Assets/Settings/URP Post/v4/Profiles`에서 프로필을 선택한다.
3. 템플릿에 사용할 프로필은 Unity Project 창에서 복제해 별도 폴더에 둔다. 복제하면 독립된 GUID가 생겨 보관본과 분리해서 편집할 수 있다.
4. 씬에 Global Volume을 만들고 Profile에 복제본을 연결한다. Weight는 1로 두고 카메라의 Volume Layer Mask에 Volume 오브젝트의 레이어를 포함한다.
5. 카메라의 Post Processing을 켠다. 사용 중인 URP Renderer의 후처리 설정도 확인한다.
6. Bloom, 노출, 색 보정 등을 확인한 뒤 템플릿 씬과 함께 저장한다. 같은 프로필도 조명, HDR, 톤 매핑, 카메라 설정에 따라 결과가 달라진다.

`URP_InteriorProfile`, `SampleSceneProfile`, `HighQualityProfile 1`, `HighQualityProfile 2`는 기본 후보로 살펴볼 수 있다. 나머지는 영화풍·공포·색감 등 이름별 프리셋이며, 실제 화면을 비교해서 용도에 맞는 것을 선택한다. 아직 새 프로젝트에서 임포트하거나 렌더링을 비교 검증하지는 않았다.

## 원본에서 발견한 누락 참조

이번 보관은 원본 설정을 수정하지 않은 스냅샷이다. 아래 참조는 원본 프로젝트에도 파일이 없어 패키지로 복원할 수 없다.

| 프로필 | 없는 참조 | 재사용 시 확인 |
| --- | --- | --- |
| DefaultVolumeProfile | OutlineVolumeComponent, TestAnimationCurveVolumeComponent, OasisFogVolumeComponent, TestVolume의 스크립트 4개 | 필요한 원본 구현을 복원하거나, 복제본에서 Missing 컴포넌트를 정리 |
| Movie_Profile 6_Black | VolumetricFogVolumeComponent 스크립트 | 해당 효과 구현을 복원하거나 복제본에서 제거 |
| Day_Post Profile | Bloom의 dirtTexture | 원하는 Dirt Texture를 다시 지정하거나 해당 오버라이드를 해제 |

`DefaultVolumeProfile`을 그대로 기본 템플릿으로 지정하기 전에는 누락 컴포넌트를 정리해야 한다. 위 3개 프로필 이외의 34개에서는 파일 GUID 검사상 누락 참조가 발견되지 않았다. 이 검사는 시각적 결과나 Unity 임포트 성공까지 보장하지 않는다.

## 보관 검증

패키지 내부의 프로필·텍스처와 `.meta`가 원본과 일치하는지, 경로와 GUID가 유지되는지 확인했다. 상세 목록은 manifest에 남겼다. 에셋의 기존 권리는 원 제작자에게 있으며, 이 보관 글이 별도의 재배포 라이선스를 부여하지는 않는다.
