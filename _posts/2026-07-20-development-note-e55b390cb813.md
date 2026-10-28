---
title: "코드 변경 사항 기록//0720"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "2026-07-20\\_전체\\_스크립트\\_비교\\_정리 1. 한 줄 결론 2026-07-20에는 병합 후 유실된 입력·프리팹·VFX 참조를 복구하고, 튜토리얼 조작 가이드와 인벤토리 장착 가능 슬롯의 하이라이트를 추가했으며, 플레이어 사격 머즐에 HDR VFX와 짧은 실시간 라이트 피드백을"
description: "2026-07-20\\_전체\\_스크립트\\_비교\\_정리 1. 한 줄 결론 2026-07-20에는 병합 후 유실된 입력·프리팹·VFX 참조를 복구하고, 튜토리얼 조작 가이드와 인벤토리 장착 가능 슬롯의 하이라이트를 추가했으며, 플레이어 사격 머즐에 HDR VFX와 짧은 실시간 라이트 피드백을"
published: true
migration_id: "3a336532580e819eb514e55b390cb813"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
[2026-07-20\_전체\_스크립트\_비교\_정리]({% endraw %}{% post_url 2026-07-20-development-note-edd6e26f1413 %}{% raw %})

## 1. 한 줄 결론

2026-07-20에는 병합 후 유실된 입력·프리팹·VFX 참조를 복구하고, 튜토리얼 조작 가이드와 인벤토리 장착 가능 슬롯의 하이라이트를 추가했으며, 플레이어 사격 머즐에 HDR VFX와 짧은 실시간 라이트 피드백을 결합했습니다.

## 2. 기록 범위

- 작성 기준: 송예찬이 직접 작성하거나 수정한 커밋만 포함
- 기준 날짜: 2026-07-20
- 기준 브랜치: Release-0.3.3
- 포함 커밋: <code>2f085c3</code>, <code>9d7af9e</code>, <code>6e5f262</code>, <code>bfd072d</code>, <code>3ef5a15</code>
- 제외 범위: 팀원 커밋, 병합 커밋, 논의·점검만 진행하고 코드로 구현하지 않은 에너미 피격/겹침/드롭 보상
- 비교 기준: 각 스크립트를 오늘 처음 수정하기 직전 상태와 오늘 마지막으로 직접 수정한 커밋 상태로 비교
- 주의: 이후 팀원 수정이 섞인 파일은 현재 HEAD가 아니라 본인의 마지막 직접 커밋 스냅샷을 사용

## 3. 직접 작성한 커밋

| 커밋 | 유형 | 내용 |
| --- | --- | --- |
| <code>2f085c3</code> | fix | 병합 후 유실된 입력·프리팹·VFX 복구 |
| <code>9d7af9e</code> | feat | 튜토리얼 조작 가이드 하이라이트 시스템 구현 |
| <code>6e5f262</code> | feat | 인벤토리 장착 가능 슬롯 하이라이트 추가 |
| <code>bfd072d</code> | feat | 플레이어 사격 머즐 플래시 HDR 피드백 강화 |
| <code>3ef5a15</code> | feat | 머즐 실시간 라이트 최종 세팅 반영 |

## 4. 코드 변경 사항

### 4-1. 입력·프리팹·VFX 참조 복구

- <code>InputManager</code>가 비활성 또는 미준비 상태인 <code>PlayerInput</code>을 안전하게 처리하도록 맵·액션 조회를 보강했습니다.
- <code>LocalInputReader</code>의 입력 차단 상태와 중앙 <code>InputManager</code> 경유 맵 전환을 복구하고, 필요할 때만 안전한 fallback을 사용하도록 정리했습니다.
- 공격, 상호작용, 퀵슬롯 입력 이름과 구독 흐름을 현재 Input Actions 구조에 맞췄습니다.
- 튜토리얼·인벤토리 UI가 열린 동안 공격·스킬·퀵슬롯 입력이 새지 않도록 차단하고, 튜토리얼 확인 클릭 직후 2프레임 동안 입력 복귀를 늦춰 클릭 관통을 막았습니다.
- VFX 풀은 <code>OnDisable</code> 중 중복 반환, 같은 오브젝트의 중복 큐 등록, 활성화 상태 충돌을 방지하도록 반환 예약과 부모 복원을 분리했습니다.
- <code>UI-InventorySlot.prefab</code>의 드래그 영역과 <code>LocalInputReader</code> 스크립트 GUID 참조를 복구했습니다.

### 4-2. 튜토리얼 조작 가이드 하이라이트

- JSON 가이드의 <code>UIHighlightPosition</code>, <code>HighlightEffectPosition</code> 값을 기반으로 UI 또는 월드 대상을 강조하도록 연결했습니다.
- ID 기반 대상 레지스트리, 4분할 암전 패널, 강조 프레임, <code>unscaledTime</code> 기반 펄스, 목표 안내 문구를 추가했습니다.
- 가이드 시작·종료와 Objective 모드 전환에 맞춰 하이라이트를 표시하고 정리하도록 <code>TutorialManager</code>에 생명주기를 연결했습니다.
- 기존 Canvas와 RectTransform을 런타임 코드가 강제로 덮지 않도록, 에디터 동기화 도구는 기존 인스펙터 값을 보존하면서 필요한 참조만 설치하도록 구성했습니다.
- <code>TutorialSystem</code>, 상자 UI, Game UI, Inventory UI, ItemTooltip UI 프리팹에 하이라이트 대상을 연결했습니다.
- <code>IntroScene</code>의 튜토리얼 사용 토글 변경은 테스트용 설정으로 분리하여 기록합니다.

### 4-3. 인벤토리 장착 가능 슬롯 하이라이트

- 소비 아이템은 퀵슬롯, 아티팩트는 아티팩트 장착 슬롯에만 놓을 수 있도록 공통 배치 정책을 분리했습니다.
- 드래그 중 실제로 드롭 가능한 슬롯만 밝아지고 옅은 흰색 테두리가 펄스하도록 피드백 컨트롤러와 슬롯 UI를 추가했습니다.
- 슬롯의 시각 강조와 실제 드롭 검증이 서로 다른 규칙을 쓰지 않도록 <code>PlayerInventory</code>, <code>ArtifactEquipSlotUI</code>, <code>QuickSlotUI</code>, <code>InventoryPresenter</code>가 같은 정책을 사용하게 했습니다.
- 드래그 종료, UI 닫기, 취소 시 남은 강조가 모두 초기화되도록 정리했습니다.
- Canvas 계층과 참조 설치는 에디터 도구가 기존 UI 값을 보존하며 수행하도록 만들었습니다.

### 4-4. 플레이어 머즐 HDR·실시간 라이트

- <code>PlayerWeapon</code> 발사 시 기존 <code>VFX_Player_Muzzle</code>과 재사용 가능한 <code>MuzzleFlashLight</code>를 함께 호출하도록 연결했습니다.
- 공유 ThirdParty 원본을 수정하지 않고 전용 <code>VFX_Player_Muzzle_HDR.prefab</code>을 만들었습니다.
- HDR Custom Data의 중심 발광값은 6, 외곽 발광값은 3.5로 조정했습니다.
- VFX 카탈로그의 머즐 엔트리를 전용 프리팹으로 교체하고 Addressables 주소를 추가했습니다.
- <code>Player_Yuan/FirePos</code>에 실시간 Point Light와 컨트롤러를 연결했습니다.
- 최종 라이트 값은 <code>peakIntensity = 50</code>, <code>range = 2.5</code>, <code>flashDuration = 0.055</code>, 그림자 비활성화이며, 대기 중에는 Light를 꺼 두고 발사 순간에만 켭니다.
- <code>MuzzleFlashLight</code>는 매 발사마다 새 Light를 만들지 않고 하나를 재사용하며, <code>unscaledTime</code>으로 짧게 감쇠합니다.

## 5. 직접 수정한 스크립트

- 입력·복구: 9개
- 튜토리얼 하이라이트: 4개 추가 대상과 공통 수정 스크립트
- 인벤토리 하이라이트: 9개 추가 대상과 공통 수정 스크립트
- 머즐 피드백: 2개
- 중복 파일을 합친 전체 비교 대상: 24개
- 신규 C# 스크립트: 8개
- 기존 C# 수정: 16개

## 6. 직접 수정한 비스크립트 자산

- <code>Assets/03_PreFabs/UI/UI-InventorySlot.prefab</code>
- <code>Assets/03_PreFabs/Tutorial/TutorialSystem.prefab</code>
- <code>Assets/03_PreFabs/UI/Canvas-ChestUI.prefab</code>
- <code>Assets/03_PreFabs/UI/Canvas-GameUI.prefab</code>
- <code>Assets/03_PreFabs/UI/Canvas-InventoryUI.prefab</code>
- <code>Assets/03_PreFabs/UI/Canvas-ItemTooltipUI.prefab</code>
- <code>Assets/03_PreFabs/Characters/Player_Yuan.prefab</code>
- <code>Assets/03_PreFabs/System/VFX_Player_Muzzle_HDR.prefab</code>
- <code>Assets/Resources/VFX/VFXCatalog.asset</code>
- <code>Assets/AddressableAssetsData/AssetGroups/Default Local Group.asset</code>
- <code>Assets/01_Scenes/IntroScene.unity</code>
- <code>Assets/01_Scenes/TutorialScene.unity</code>

## 7. 전체 스크립트 비교 정리

[2026-07-20 전체 스크립트 비교 정리]({% endraw %}{% post_url 2026-07-20-development-note-edd6e26f1413 %}{% raw %})

- 전체 24개 C# 스크립트
- 각 스크립트별 <code>이전 스크립트 전체 → 변경 설명 → 현재 스크립트 전체</code> 순서
- 신규 파일은 이전 구현 없음으로 표기
- 개인 직접 커밋 스냅샷을 기준으로 전문 수록

## 8. 검증 결과

- Git 작업 트리 clean 확인
- 직접 작성한 5개 커밋과 팀원·병합 커밋 분리 확인
- 신규 머즐 VFX 프리팹 meta 파서 오류 복구 후 Unity Import 성공 확인
- <code>SystemAD.csproj</code> MSBuild 컴파일 오류 0 확인
- 기존 경고는 중복 using 및 미사용 이벤트로, 이번 작업의 신규 컴파일 오류가 아님
- 플레이 테스트에서 인벤토리 유효 슬롯 하이라이트와 머즐 VFX·라이트 출력 확인

## 9. 후속 확인 사항

- 튜토리얼 하이라이트는 해상도와 Canvas Scaler 변화에서 대상 위치가 유지되는지 확인
- 인벤토리 하이라이트는 드래그 취소·UI 강제 종료·잘못된 슬롯 드롭에서 잔상이 남지 않는지 확인
- 머즐 피드백은 인게임/튜토리얼, 실내/실외, Bloom·픽셀화 환경에서 과노출과 가시성을 비교
- 에너미 피격 피드백, 에너미 겹침 완화, 처치 시 확률 상자 드롭은 다음 구현 범위로 별도 관리
{% endraw %}
