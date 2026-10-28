---
title: "2026-07-20_InventoryDragFeedbackController_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 6e5f262 파일: Assets/02_Scripts/UI/Game/InventoryDragFeedbackController.cs 2. 변경 설명 현재 드래그 중인 아이템을 기준으로 유효한 드롭 대상 그룹만 찾"
description: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 6e5f262 파일: Assets/02_Scripts/UI/Game/InventoryDragFeedbackController.cs 2. 변경 설명 현재 드래그 중인 아이템을 기준으로 유효한 드롭 대상 그룹만 찾"
published: false
migration_id: "3a336532580e814a96f4c47e2dd67d33"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

신규 파일로 이전 스크립트가 없습니다.

- 생성 커밋: <code>6e5f262</code>
- 파일: <code>Assets/02_Scripts/UI/Game/InventoryDragFeedbackController.cs</code>

## 2. 변경 설명

현재 드래그 중인 아이템을 기준으로 유효한 드롭 대상 그룹만 찾아 강조하는 중앙 컨트롤러입니다. 드래그 시작, 정상 종료, 취소, UI 강제 종료 시 모든 대상의 표시를 일괄 정리합니다.

## 3. 현재 스크립트 전체

- 기준: <code>6e5f262</code>
- 파일: <code>Assets/02_Scripts/UI/Game/InventoryDragFeedbackController.cs</code>

```cs
using UnityEngine;

/// <summary>
/// 인벤토리 아이템 드래그 중 유효한 퀵슬롯과 아티팩트 슬롯의 피드백을 한곳에서 제어합니다.
/// 실제 색상과 테두리 이미지는 Canvas 프리팹에서 설정하고 이 컴포넌트는 표시 여부만 결정합니다.
/// </summary>
[DisallowMultipleComponent]
public sealed class InventoryDragFeedbackController : MonoBehaviour
{
    [Header("소모품 장착 대상")]
    [SerializeField] private InventoryDropTargetFeedbackUI[] quickSlotTargets;

    [Header("아티팩트 장착 대상")]
    [SerializeField] private InventoryDropTargetFeedbackUI[] artifactSlotTargets;

    private void Awake()
    {
        HideAll(true);
    }

    private void OnDisable()
    {
        HideAll(true);
    }

    /// <summary>
    /// 드래그를 시작한 인벤토리 슬롯의 아이템을 기준으로 유효한 목적지만 표시합니다.
    /// </summary>
    public void ShowFor(InventorySlotUI sourceSlot)
    {
        if (sourceSlot == null)
        {
            HideAll();
            return;
        }

        ItemData itemData = sourceSlot.CurrentItemData;
        bool canUseQuickSlot = sourceSlot.CanAssignToQuickSlot
            && InventoryItemPlacementPolicy.CanPlace(
                itemData,
                sourceSlot.CurrentItemTid,
                InventoryDropTargetType.QuickSlot);
        bool canUseArtifactSlot = InventoryItemPlacementPolicy.CanPlace(
            itemData,
            InventoryDropTargetType.ArtifactSlot);

        SetTargets(quickSlotTargets, canUseQuickSlot);
        SetTargets(artifactSlotTargets, canUseArtifactSlot);
    }

    /// <summary>
    /// 모든 장착 대상 피드백을 숨깁니다. 강제 초기화 시에는 페이드 없이 즉시 제거합니다.
    /// </summary>
    public void HideAll(bool immediate = false)
    {
        HideTargets(quickSlotTargets, immediate);
        HideTargets(artifactSlotTargets, immediate);
    }
```

```cs
    private static void SetTargets(InventoryDropTargetFeedbackUI[] targets, bool available)
    {
        if (targets == null)
            return;

        foreach (InventoryDropTargetFeedbackUI target in targets)
        {
            if (target != null)
                target.SetAvailable(available);
        }
    }

    private static void HideTargets(InventoryDropTargetFeedbackUI[] targets, bool immediate)
    {
        if (targets == null)
            return;

        foreach (InventoryDropTargetFeedbackUI target in targets)
        {
            if (target == null)
                continue;

            if (immediate)
                target.HideImmediate();
            else
                target.SetAvailable(false);
        }
    }
}
```
{% endraw %}
