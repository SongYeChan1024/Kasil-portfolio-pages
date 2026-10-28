---
title: "2026-07-20_전체_스크립트_비교_정리"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "이 문서는 2026-07-20에 직접 작성하거나 수정한 C 스크립트 24개의 전문 비교 인덱스입니다. 각 하위 문서는 반드시 다음 순서로 구성합니다. 이전 스크립트 전체 변경 설명 현재 스크립트 전체 신규 스크립트는 이전 코드가 없음을 명시하고 현재 전문을 기록합니다. 팀원의 이후 변경"
description: "이 문서는 2026-07-20에 직접 작성하거나 수정한 C 스크립트 24개의 전문 비교 인덱스입니다. 각 하위 문서는 반드시 다음 순서로 구성합니다. 이전 스크립트 전체 변경 설명 현재 스크립트 전체 신규 스크립트는 이전 코드가 없음을 명시하고 현재 전문을 기록합니다. 팀원의 이후 변경"
published: false
migration_id: "3a336532580e816296fcedd6e26f1413"
migration_status: "review_required"
migration_flags: ["publication_review"]
---

{% raw %}
이 문서는 2026-07-20에 직접 작성하거나 수정한 C# 스크립트 24개의 전문 비교 인덱스입니다.

각 하위 문서는 반드시 다음 순서로 구성합니다.

1. 이전 스크립트 전체
2. 변경 설명
3. 현재 스크립트 전체

신규 스크립트는 이전 코드가 없음을 명시하고 현재 전문을 기록합니다. 팀원의 이후 변경이 섞인 파일은 본인의 마지막 직접 커밋 상태를 현재본으로 사용합니다.

## 1. 입력·프리팹·VFX 복구

- [InputManager.cs]({% endraw %}{% post_url 2026-07-20-development-note-c497207fb72d %}{% raw %})
- [InventoryPresenter.cs]({% endraw %}{% post_url 2026-07-20-development-note-d75ca3244855 %}{% raw %})
- [PlayerCombatPresenter.cs]({% endraw %}{% post_url 2026-07-20-development-note-fdfa0043812d %}{% raw %})
- [QuickSlotPresenter.cs]({% endraw %}{% post_url 2026-07-20-development-note-c037b47815be %}{% raw %})
- [LocalInputReader.cs]({% endraw %}{% post_url 2026-07-20-development-note-e541ca3793a1 %}{% raw %})
- [PlayerInteraction.cs]({% endraw %}{% post_url 2026-07-20-development-note-df44c2bc04c4 %}{% raw %})
- [TutorialManager.cs]({% endraw %}{% post_url 2026-07-20-development-note-fc838768b19e %}{% raw %})
- [VFXRuntimePool.cs]({% endraw %}{% post_url 2026-07-20-development-note-d35545c76f08 %}{% raw %})
- [VFXService.cs]({% endraw %}{% post_url 2026-07-20-development-note-d4e00a52fd2f %}{% raw %})

## 2. 튜토리얼 조작 가이드 하이라이트

- [TutorialManager.cs]({% endraw %}{% post_url 2026-07-20-development-note-fc838768b19e %}{% raw %})
- [TutorialHighlightController.cs]({% endraw %}{% post_url 2026-07-20-development-note-e12dc63a199e %}{% raw %})
- [TutorialHighlightTarget.cs]({% endraw %}{% post_url 2026-07-20-development-note-cae6792a954f %}{% raw %})
- [TutorialHighlightPrefabSetup.cs]({% endraw %}{% post_url 2026-07-20-development-note-ed83144019a3 %}{% raw %})
- [TutorialPrefabBuilder.cs]({% endraw %}{% post_url 2026-07-20-development-note-e9ed5922fb05 %}{% raw %})

## 3. 인벤토리 장착 가능 슬롯 하이라이트

- [InventoryPresenter.cs]({% endraw %}{% post_url 2026-07-20-development-note-d75ca3244855 %}{% raw %})
- [InventoryItemPlacementPolicy.cs]({% endraw %}{% post_url 2026-07-20-development-note-ed768d5ea5e9 %}{% raw %})
- [PlayerInventory.cs]({% endraw %}{% post_url 2026-07-20-development-note-eeec80c2dedf %}{% raw %})
- [ArtifactEquipSlotUI.cs]({% endraw %}{% post_url 2026-07-20-development-note-cf3ccf8b8ade %}{% raw %})
- [InventoryDragFeedbackController.cs]({% endraw %}{% post_url 2026-07-20-development-note-c47e2dd67d33 %}{% raw %})
- [InventoryDropTargetFeedbackUI.cs]({% endraw %}{% post_url 2026-07-20-development-note-fa9989527518 %}{% raw %})
- [InventorySlotUI.cs]({% endraw %}{% post_url 2026-07-20-development-note-e10772270d9b %}{% raw %})
- [InventoryUI.cs]({% endraw %}{% post_url 2026-07-20-development-note-dd17e8a79f4b %}{% raw %})
- [QuickSlotUI.cs]({% endraw %}{% post_url 2026-07-20-development-note-d307ca0bb7b7 %}{% raw %})
- [InventoryDropFeedbackPrefabSetup.cs]({% endraw %}{% post_url 2026-07-20-development-note-ff0de2068319 %}{% raw %})

## 4. 플레이어 머즐 HDR·실시간 라이트

- [MuzzleFlashLight.cs]({% endraw %}{% post_url 2026-07-20-development-note-f57b0352da44 %}{% raw %})
- [PlayerWeapon.cs]({% endraw %}{% post_url 2026-07-20-development-note-e7f996ed24b6 %}{% raw %})

[2026-07-20\_InputManager\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-c497207fb72d %}{% raw %})

[2026-07-20\_InventoryPresenter\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-d75ca3244855 %}{% raw %})

[2026-07-20\_PlayerCombatPresenter\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-fdfa0043812d %}{% raw %})

[2026-07-20\_QuickSlotPresenter\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-c037b47815be %}{% raw %})

[2026-07-20\_LocalInputReader\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-e541ca3793a1 %}{% raw %})

[2026-07-20\_PlayerInteraction\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-df44c2bc04c4 %}{% raw %})

[2026-07-20\_TutorialManager\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-fc838768b19e %}{% raw %})

[2026-07-20\_VFXRuntimePool\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-d35545c76f08 %}{% raw %})

[2026-07-20\_VFXService\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-d4e00a52fd2f %}{% raw %})

[2026-07-20\_TutorialHighlightController\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-e12dc63a199e %}{% raw %})

[2026-07-20\_TutorialHighlightTarget\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-cae6792a954f %}{% raw %})

[2026-07-20\_TutorialHighlightPrefabSetup\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-ed83144019a3 %}{% raw %})

[2026-07-20\_TutorialPrefabBuilder\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-e9ed5922fb05 %}{% raw %})

[2026-07-20\_InventoryItemPlacementPolicy\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-ed768d5ea5e9 %}{% raw %})

[2026-07-20\_PlayerInventory\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-eeec80c2dedf %}{% raw %})

[2026-07-20\_ArtifactEquipSlotUI\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-cf3ccf8b8ade %}{% raw %})

[2026-07-20\_InventoryDragFeedbackController\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-c47e2dd67d33 %}{% raw %})

[2026-07-20\_InventoryDropTargetFeedbackUI\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-fa9989527518 %}{% raw %})

[2026-07-20\_InventorySlotUI\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-e10772270d9b %}{% raw %})

[2026-07-20\_InventoryUI\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-dd17e8a79f4b %}{% raw %})

[2026-07-20\_QuickSlotUI\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-d307ca0bb7b7 %}{% raw %})

[2026-07-20\_InventoryDropFeedbackPrefabSetup\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-ff0de2068319 %}{% raw %})

[2026-07-20\_MuzzleFlashLight\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-f57b0352da44 %}{% raw %})

[2026-07-20\_PlayerWeapon\_script\_compare]({% endraw %}{% post_url 2026-07-20-development-note-e7f996ed24b6 %}{% raw %})
{% endraw %}
