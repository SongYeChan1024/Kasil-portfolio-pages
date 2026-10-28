---
title: "코드 변경 사항 기록//0714"
date: 2026-07-14 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "2026-07-14\\_vfx\\_tutorial\\_script\\_compare 오늘 작업의 핵심은 인게임 VFX를 데이터 기반 카탈로그와 런타임 풀로 통합하고, 이벤트별 재생 연결과 풀 반환 안정화를 마친 뒤, 도로 중심의 독립 튜토리얼 씬과 재사용 가능한 팝업·트리거·NavMesh 설치"
description: "2026-07-14\\_vfx\\_tutorial\\_script\\_compare 오늘 작업의 핵심은 인게임 VFX를 데이터 기반 카탈로그와 런타임 풀로 통합하고, 이벤트별 재생 연결과 풀 반환 안정화를 마친 뒤, 도로 중심의 독립 튜토리얼 씬과 재사용 가능한 팝업·트리거·NavMesh 설치"
published: false
migration_id: "39d36532580e8116a5adcc1186b1ed1a"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
[2026-07-14\_vfx\_tutorial\_script\_compare]({% endraw %}{% post_url 2026-07-14-development-note-f691d1cb6b12 %}{% raw %})


오늘 작업의 핵심은 인게임 VFX를 데이터 기반 카탈로그와 런타임 풀로 통합하고, 이벤트별 재생 연결과 풀 반환 안정화를 마친 뒤, 도로 중심의 독립 튜토리얼 씬과 재사용 가능한 팝업·트리거·NavMesh 설치 도구를 구축한 것이다.


## 1. 오늘 작업 요약

<table fit-page-width="true" header-row="true">
<tr>
<td>
구분
</td>
<td>
기존 문제/목표
</td>
<td>
핵심 해결
</td>
</tr>
<tr>
<td>
VFX 데이터 구조
</td>
<td>
효과 호출과 프리팹 참조가 기능별로 흩어질 가능성
</td>
<td>
VFX ID, 카탈로그, 컨텍스트, 서비스 구조로 통합
</td>
</tr>
<tr>
<td>
VFX 오브젝트 풀링
</td>
<td>
반복 생성·삭제 비용과 효과 종료 시점 관리 필요
</td>
<td>
런타임 풀과 PooledVFX 수명·반환 흐름 구현
</td>
</tr>
<tr>
<td>
인게임 이벤트 연결
</td>
<td>
전투·상호작용·아이템·스킬 이벤트마다 VFX 연결 필요
</td>
<td>
GameplayVFXPresenter와 기존 시스템 호출부를 연결
</td>
</tr>
<tr>
<td>
풀 반환 오류
</td>
<td>
OnDisable 반환 과정에서 SetActive(false)가 중복 호출됨
</td>
<td>
비활성화와 대기열 등록 책임을 분리
</td>
</tr>
<tr>
<td>
VFX 카탈로그 튜닝
</td>
<td>
플레이 중 조정한 크기·수명·프리팹 값 보존 필요
</td>
<td>
확정된 카탈로그 직렬화 값을 에셋에 반영
</td>
</tr>
<tr>
<td>
튜토리얼 UI
</td>
<td>
콜라이더 접촉 시 설명 팝업과 일시정지 흐름 필요
</td>
<td>
카탈로그·매니저·팝업·트리거 프리팹 구성
</td>
</tr>
<tr>
<td>
튜토리얼 이벤트
</td>
<td>
상자·아이템·적 조우를 실제 인게임 이벤트와 연결 필요
</td>
<td>
튜토리얼 씬 전용 EventBridge와 배치 도구 추가
</td>
</tr>
<tr>
<td>
튜토리얼 NavMesh
</td>
<td>
복제 씬이 원본 NavMesh를 공유하거나 전체 맵이 베이크됨
</td>
<td>
도로 하위만 수집하는 씬 전용 Surface와 전용 베이크 에셋 생성
</td>
</tr>
</table>

## 2. 기록 범위와 비교 기준

이 문서는 2026년 7월 14일 사용자가 직접 요청해 구현·수정한 VFX 및 튜토리얼 작업만 대상으로 한다. 같은 날 저장소에 합쳐진 오디오, 시야각, 그래픽, 리팩터링 등 다른 작업자의 변경은 포함하지 않는다.

<table fit-page-width="true" header-row="true">
<tr>
<td>
작업
</td>
<td>
이전 기준
</td>
<td>
현재 기준
</td>
</tr>
<tr>
<td>
VFX 시스템
</td>
<td>
00489d3
</td>
<td>
5381ff4
</td>
</tr>
<tr>
<td>
튜토리얼 시스템
</td>
<td>
08f5d21
</td>
<td>
bdef1c6
</td>
</tr>
</table>


전체 스크립트 비교 문서는 각 파일을 이전 스크립트 전체 → 변경 설명 → 현재 스크립트 전체 순서로 기록한다. 신규 파일은 이전 버전이 없음을 명시한다.


## 3. VFX 시스템 구현

### 3-1. 데이터와 실행 계층

- GameplayVFXIds: 게임 로직이 사용하는 안정적인 VFX ID 상수 정의
- VFXCatalog: ID별 프리팹, 기본 크기, 회전, 수명, 풀 크기 등의 직렬화 설정
- VFXContext: 위치·회전·부모·스케일과 같은 1회 재생 문맥 전달
- VFXService: 카탈로그 조회와 재생 요청의 단일 진입점
- VFXRuntimePool: 프리팹별 대기열 생성, 대여, 반환 관리
- PooledVFX: 파티클 종료 감시와 안전한 풀 반환
- GameplayVFXPresenter: 전역 인게임 이벤트를 VFX 요청으로 변환

카탈로그는 ScriptableObject 설정 원본이고, 서비스는 카탈로그를 조회해 런타임 풀에서 인스턴스를 대여한 뒤 컨텍스트에 맞춰 재생한다. 효과가 끝나면 PooledVFX가 풀에 반환한다.

### 3-2. 인게임 이벤트 연결 범위

<table fit-page-width="true" header-row="true">
<tr>
<td>
영역
</td>
<td>
연결 대상
</td>
</tr>
<tr>
<td>
플레이어
</td>
<td>
이동, 회피, 피격, 사망, 무기 공격
</td>
</tr>
<tr>
<td>
에너미
</td>
<td>
피격, 공격, 사망
</td>
</tr>
<tr>
<td>
아이템
</td>
<td>
드롭, 습득, 상자 열기, 장착
</td>
</tr>
<tr>
<td>
환경
</td>
<td>
문 상호작용, 탈출 지점
</td>
</tr>
<tr>
<td>
스킬
</td>
<td>
유탄 투척, 프리즘 폭발, 디코이 발현
</td>
</tr>
</table>

유탄 계열은 투척체 → 폭발 → 디코이 발현의 서로 다른 의미와 수명을 가진 효과로 분리했다.

### 3-3. 풀 반환 오류 수정

OnDisable에서 풀 반환을 시작하면서 SetActive(false)를 다시 호출하면 이미 비활성화된 오브젝트를 재차 비활성화하는 흐름이 생긴다. 수정 후에는 다음 책임을 분리했다.

- 명시적 반환 요청: 필요한 경우 비활성화 수행
- OnDisable 경로: 대기열 등록과 부모 복원만 수행
- 반환 중 플래그: 같은 인스턴스의 중복 대기열 등록 방지
- 풀 종료/파괴 시점: 유효하지 않은 반환 요청 방어

## 4. 튜토리얼 시스템 구현

### 4-1. 런타임 구조

- TutorialMessageCatalog: 튜토리얼 ID와 제목·본문·정지 여부 관리
- TutorialPopup: TextMeshPro 텍스트, 확인 버튼, CanvasGroup 표시 제어
- TutorialManager: 중복 팝업 방지, 시간 정지·복원, 입력 맵 전환, 확인 입력 처리
- TutorialTrigger: 플레이어 진입 감지와 1회 실행
- TutorialEventBridge: 상자 열기와 에너미 피격 이벤트를 튜토리얼 메시지로 변환

기본 메시지 ID는 MOVE, INTERACT, ITEM, ATTACK, SKILL, ESCAPE로 구성했다.

### 4-2. 에디터 자동 구성 도구

- TutorialPrefabBuilder: 카탈로그, TutorialSystem, Trigger 프리팹과 기본 씬 배치 생성
- TutorialInteractionInstaller: 하이라키의 실제 스폰·상자·에너미·패트롤 위치를 찾아 트리거 배치
- TutorialNavMeshBuilder: TutorialScene에서 Road 하위만 수집하는 전용 NavMeshSurface 구성 및 베이크

실제 하이라키 좌표를 기준으로 설치한 주요 위치는 다음과 같다.

| 대상 | 기준 좌표 | 튜토리얼 트리거 좌표 |
| --- | --- | --- |
| PlayerSpawnPoint | (118.26, 0, 90.00) | Move (114.26, 1, 90.14) |
| BoxSpawnPointPool | (80.50, -1, 91.30) | Interact (84.50, 0, 91.16) |
| EnemySpawn/Patrol | (61.80, 0, 94.30) | Attack (66.74, 1, 93.51) |

### 4-3. 씬 격리와 NavMesh 복구

튜토리얼 변경이 다른 씬에 영향을 주지 않도록 TutorialScene 전용 NavMesh-TutorialNavMesh.asset을 사용한다. 복제 과정에서 공유되던 LevelDesignScene의 기존 NavMesh 에셋은 원래 GUID로 복구하고, 참조가 LevelDesignScene에만 남아 있음을 확인했다.

튜토리얼 씬은 기존 Additive 구성 원칙을 따른 콘텐츠 씬이다. 단독 실행보다는 공통 매니저·플레이어가 포함된 베이스 씬과 함께 로드해 검증해야 한다.

## 5. 변경 파일별 책임

<table fit-page-width="true" header-row="true">
<tr>
<td>
분류
</td>
<td>
스크립트
</td>
<td>
책임
</td>
</tr>
<tr>
<td>
VFX 신규
</td>
<td>
GameplayVFXIds, GameplayVFXPresenter, VFXCatalog, VFXContext, VFXService, VFXRuntimePool, PooledVFX
</td>
<td>
식별자, 설정, 이벤트 변환, 생성·재생·반환
</td>
</tr>
<tr>
<td>
VFX 연결
</td>
<td>
SkillEffectProcessor, SpawnManager, DoorInteractable, DropItem, EnemyMovement, EnemyStatus, ExitPoint, GrenadeProjectile, ItemBox, PlayerArtifactEquipment, PlayerInventory, PlayerMovement, PlayerStatus, PlayerWeapon
</td>
<td>
기존 게임 이벤트 지점에서 VFX 재생 요청
</td>
</tr>
<tr>
<td>
튜토리얼 런타임
</td>
<td>
TutorialMessageCatalog, TutorialPopup, TutorialManager, TutorialTrigger, TutorialEventBridge
</td>
<td>
메시지 데이터, UI, 시간·입력, 트리거·이벤트 연결
</td>
</tr>
<tr>
<td>
튜토리얼 에디터
</td>
<td>
TutorialPrefabBuilder, TutorialNavMeshBuilder, TutorialInteractionInstaller
</td>
<td>
프리팹 생성, 도로 NavMesh 베이크, 하이라키 기반 배치
</td>
</tr>
</table>

## 6. 에셋 및 프로젝트 설정 변경

- TutorialScene과 전용 NavMesh 베이크 에셋 생성
- TutorialSystem, TutorialTrigger 프리팹 생성
- TutorialMessageCatalog ScriptableObject 생성
- VFXCatalog ScriptableObject 설정값 반영
- Build Settings에 TutorialScene 등록
- Tutorial 레이어 추가
- LevelDesignScene NavMesh 참조와 원본 에셋 복구 확인

## 7. 검증 결과와 회귀 테스트

- dotnet build 기준 컴파일 오류 0개
- 기존 어셈블리 참조 경고 2개는 이번 변경과 무관
- 튜토리얼 NavMesh가 전용 에셋을 사용하고 LevelDesignScene 참조가 유지되는지 확인
- 최종 작업 트리 clean 확인

### Unity 플레이 모드 확인 항목

- [ ] 모든 VFX가 카탈로그의 프리팹·크기·수명 설정으로 재생되는지 확인
- [ ] 상자 열기와 장착 VFX가 종료 후 풀에 정상 반환되는지 확인
- [ ] 유탄 투척·폭발·디코이 VFX 순서와 위치 확인
- [ ] TutorialScene을 베이스 씬과 Additive로 로드해 팝업 표시 확인
- [ ] 팝업 정지 시 확인 입력 후 기존 timeScale과 입력 맵이 복원되는지 확인
- [ ] 이동·상자·공격 트리거가 하이라키 기준 위치에서 1회만 실행되는지 확인
- [ ] 튜토리얼 전용 NavMesh에서 에너미가 도로 밖으로 이탈하지 않는지 확인
- [ ] LevelDesignScene NavMesh가 기존처럼 정상 동작하는지 회귀 확인

## 8. 관련 커밋

```txt
feat: 데이터 기반 VFX 카탈로그 및 오브젝트 풀링 시스템 구현
fix: VFX 풀 반환 중 중복 비활성화 방지
feat: VFX 카탈로그 설정값 반영
feat: 튜토리얼 씬 기본 시스템 구현
```

## 9. 한 문장 복습

> VFX는 카탈로그와 풀을 중심으로 재생 책임을 통합하고, 튜토리얼은 데이터·팝업·트리거·이벤트·NavMesh를 씬 전용 구조로 분리해 다른 인게임 씬에 영향을 주지 않도록 구성했다.
{% endraw %}
