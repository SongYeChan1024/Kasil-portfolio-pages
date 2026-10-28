---
title: "2026-07-21_InventoryItemPlacementPolicy_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "1. 이전 스크립트 전체 기준: 2a81ecc 파일: Assets/02_Scripts/Define/InventoryItemPlacementPolicy.cs cs /// /// 인벤토리 아이템을 배치할 수 있는 장착 대상 종류입니다. /// UI 표시와 실제 데이터 처리에서 같은 값을 사"
description: "1. 이전 스크립트 전체 기준: 2a81ecc 파일: Assets/02_Scripts/Define/InventoryItemPlacementPolicy.cs cs /// /// 인벤토리 아이템을 배치할 수 있는 장착 대상 종류입니다. /// UI 표시와 실제 데이터 처리에서 같은 값을 사"
published: false
migration_id: "3a436532580e817491a8de1ece945858"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/Define/InventoryItemPlacementPolicy.cs</code>

```cs
/// <summary>
/// 인벤토리 아이템을 배치할 수 있는 장착 대상 종류입니다.
/// UI 표시와 실제 데이터 처리에서 같은 값을 사용합니다.
/// </summary>
public enum InventoryDropTargetType
{
    QuickSlot,
    ArtifactSlot
}

/// <summary>
/// 아이템 데이터와 장착 대상의 조합이 유효한지 판단하는 공통 규칙입니다.
/// 드롭 하이라이트와 실제 장착 로직이 서로 다른 결과를 내지 않도록 한곳에서 관리합니다.
/// </summary>
public static class InventoryItemPlacementPolicy
{
    public static bool CanPlace(ItemData itemData, InventoryDropTargetType targetType)
    {
        if (itemData == null)
            return false;

        return targetType switch
        {
            InventoryDropTargetType.QuickSlot =>
                itemData is ConsumeItemData && itemData.category == itemCategory.consume,
            InventoryDropTargetType.ArtifactSlot =>
                itemData is ArtifactItemData && itemData.category == itemCategory.artifact,
            _ => false
        };
    }

    /// <summary>
    /// 이전 저장 데이터처럼 ItemData 참조가 비어 있는 퀵슬롯 후보는 기존 TID 규칙으로만 보완합니다.
    /// 아티팩트는 실제 장착에 ArtifactItemData가 필요하므로 TID만으로 허용하지 않습니다.
    /// </summary>
    public static bool CanPlace(ItemData itemData, int tid, InventoryDropTargetType targetType)
    {
        if (itemData != null)
            return CanPlace(itemData, targetType);

        return targetType == InventoryDropTargetType.QuickSlot && tid > 300 && tid < 400;
    }
}

```

## 2. 변경 설명

기존 <code>QuickSlot = 0</code>, <code>ArtifactSlot = 1</code> 값을 명시해 직렬화 호환성을 유지하면서 피드백 식별용 <code>InventorySlot = 2</code>, <code>ChestSlot = 3</code>을 추가했습니다. 새 값은 실제 아이템 배치 규칙을 바꾸기 위한 것이 아니라, 같은 하이라이트 컴포넌트를 인벤토리와 상자 슬롯에서도 구분해 재사용하기 위한 메타데이터입니다.

## 3. 현재 스크립트 전체

- 기준: <code>c92a983</code>
- 파일: <code>Assets/02_Scripts/Define/InventoryItemPlacementPolicy.cs</code>

```cs
/// <summary>
/// 인벤토리 아이템을 배치할 수 있는 장착 대상 종류입니다.
/// UI 표시와 실제 데이터 처리에서 같은 값을 사용합니다.
/// </summary>
public enum InventoryDropTargetType
{
    QuickSlot = 0,
    ArtifactSlot = 1,
    InventorySlot = 2,
    ChestSlot = 3
}

/// <summary>
/// 아이템 데이터와 장착 대상의 조합이 유효한지 판단하는 공통 규칙입니다.
/// 드롭 하이라이트와 실제 장착 로직이 서로 다른 결과를 내지 않도록 한곳에서 관리합니다.
/// </summary>
public static class InventoryItemPlacementPolicy
{
    public static bool CanPlace(ItemData itemData, InventoryDropTargetType targetType)
    {
        if (itemData == null)
            return false;

        return targetType switch
        {
            InventoryDropTargetType.QuickSlot =>
                itemData is ConsumeItemData && itemData.category == itemCategory.consume,
            InventoryDropTargetType.ArtifactSlot =>
                itemData is ArtifactItemData && itemData.category == itemCategory.artifact,
            _ => false
        };
    }

    /// <summary>
    /// 이전 저장 데이터처럼 ItemData 참조가 비어 있는 퀵슬롯 후보는 기존 TID 규칙으로만 보완합니다.
    /// 아티팩트는 실제 장착에 ArtifactItemData가 필요하므로 TID만으로 허용하지 않습니다.
    /// </summary>
    public static bool CanPlace(ItemData itemData, int tid, InventoryDropTargetType targetType)
    {
        if (itemData != null)
            return CanPlace(itemData, targetType);

        return targetType == InventoryDropTargetType.QuickSlot && tid > 300 && tid < 400;
    }
}

```
{% endraw %}
