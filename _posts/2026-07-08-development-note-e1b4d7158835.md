---
title: "코드변경사항 기록//0708"
date: 2026-07-08 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "2026-07-08\\_artifact\\_script\\_full\\_compare 2026-07-08\\_artifact\\_inventory\\_equipment\\_code\\_review 1. 문서 개요 이 문서는 2026년 7월 8일 기준으로 진행한 아티팩트 아이템 루팅 및 장착 시스템 구현"
description: "2026-07-08\\_artifact\\_script\\_full\\_compare 2026-07-08\\_artifact\\_inventory\\_equipment\\_code\\_review 1. 문서 개요 이 문서는 2026년 7월 8일 기준으로 진행한 아티팩트 아이템 루팅 및 장착 시스템 구현"
published: false
migration_id: "39736532580e80d9a293e1b4d7158835"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
[2026-07-08\_artifact\_script\_full\_compare]({% endraw %}{% post_url 2026-07-08-development-note-f9ddad1c54ec %}{% raw %})

# 2026-07-08\_artifact\_inventory\_equipment\_code\_review

## 1. 문서 개요

이 문서는 2026년 7월 8일 기준으로 진행한 <b>아티팩트 아이템 루팅 및 장착 시스템 구현 작업</b>을 정리한 개발 기록이다.

오늘 작업의 핵심은 기존 인벤토리 시스템에 <b>아티팩트 아이템 타입을 추가</b>하고, 아이템 박스에서 아티팩트가 등장하며, 인벤토리에서 장착 슬롯으로 이동하고, 장착 상태가 탈출 후에도 보존되도록 만드는 것이었다.

## 2. 오늘 작업한 주요 기능

### 2.1 아티팩트 아이템 데이터 추가

기존 아이템은 주로 무기, 소모품, 기억 조각 중심으로 처리되고 있었다.

아티팩트는 새 아이템 타입이므로 <code>itemCategory</code>에 <code>artifact</code>를 추가했고, 아티팩트 전용 데이터 구조를 따로 만들었다.

추가된 구조:

```txt
public class ArtifactItemData : ItemData
{
    public string itemFlavorText;
    public ArtifactCategory artifactCategory;
    public List<ArtifactEquipEffect> equipEffects = new();
    public int sellValue;
}
```

아티팩트 효과는 하나의 아이템이 여러 효과를 가질 수 있으므로 별도 클래스로 분리했다.

```txt
public class ArtifactEquipEffect
{
    public ArtifactEffectType effectType;
    public float effectValue;
}
```

이렇게 나눈 이유는 아티팩트가 단순 소비 아이템이 아니라, 장착 중 지속 효과를 가지는 아이템이기 때문이다. 이후 <code>hpRegen</code>, <code>mpRegen</code>, <code>moveSpeedUp</code>, <code>fireSpeedUp</code> 같은 효과를 확장하기 쉽게 하기 위한 기반 작업이다.

## 3. JSON 로드 구조 수정

<code>LocalJsonItemRepository</code>에서 <code>category == artifact</code>인 데이터를 읽을 수 있도록 수정했다.

기존에는 무기, 소모품, 기억 아이템 중심으로만 분기되어 있었기 때문에, 아티팩트 데이터를 JSON에 넣어도 실제 게임 데이터로 생성되지 않았다.

수정 후에는 다음 정보를 읽는다.

```txt
itemFlavorText
artifactCategory
equipEffectType_0
equipEffectValue_0
equipEffectType_1
equipEffectValue_1
sellValue
```

<code>_0</code>, <code>_1</code> 구조는 아티팩트 하나가 최대 2개의 장착 효과를 가질 수 있게 하기 위한 구조다. 현재는 1개 효과만 쓰는 아이템도 있지만, 전설 등급 아티팩트처럼 2개 효과를 가진 아이템을 처리하기 위해 유지했다.

## 4. 아이템 박스 루팅 구조 수정

기존 아이템 박스는 정해진 아이템 후보 중 하나를 뽑는 방식이었다.

오늘 수정으로 아이템 박스에 카테고리 확률 구조를 추가했다.

현재 기본 확률:

```txt
소모품: 60%
기억조각: 30%
아티팩트: 10%
```

아티팩트가 선택되면 다시 등급별 가중치를 기준으로 아티팩트 TID를 선택한다.

```txt
normal: 1001
uncommon: 1002
rare: 1003
epic: 1004
legend: 1005
```

이렇게 만든 이유는 나중에 구역별 루팅 확률을 다르게 만들기 쉽기 때문이다. 지금은 기본값만 사용하지만, 이후 창고 구역, 일반 구역, 위험 구역마다 <code>categoryLootOptions</code>와 <code>artifactLootOptions</code> 값을 다르게 조정할 수 있다.

## 5. 인벤토리 획득 흐름 수정

<code>InventoryPresenter.TryPickUpItem()</code>에서 아티팩트 TID 범위를 인식하도록 수정했다.

기존에는 100대 무기, 300대 소모품, 400대 특수 아이템만 처리했다.

수정 후에는 1000번대 아티팩트를 인벤토리에 넣을 수 있다.

```txt
else if (1000 <= pickedItemTID && pickedItemTID < 1100)
{
    remain = playerInventory.AddItem(data, remain);
}
```

이 수정이 없으면 아티팩트가 월드에 생성되거나 상자에서 나와도, 플레이어 인벤토리에 정상적으로 들어가지 않는다.

## 6. 아티팩트 장착 상태 관리 추가

<code>PlayerArtifactEquipment</code> 스크립트를 추가했다.

이 스크립트는 인벤토리와 분리해서, 현재 플레이어가 장착 중인 아티팩트만 관리한다.

주요 역할:

```txt
- 장착 슬롯 개수 관리
- 특정 슬롯에 아티팩트 장착
- 특정 슬롯에서 아티팩트 해제
- 장착 슬롯 변경 이벤트 발생
- 세이브 데이터로부터 장착 상태 복원
- 탈출 정산 시 장착 상태 저장
```

인벤토리 데이터에 장착 아티팩트를 그대로 넣지 않고 별도 장착 상태로 분리한 이유는, “보유 중인 아이템”과 “장착 중인 아이템”의 책임이 다르기 때문이다.

## 7. 장착 UI 추가 및 수정

<code>ArtifactEquipSlotUI</code>를 추가해서 인벤토리 UI 상단의 아티팩트 장착 슬롯을 관리하게 했다.

주요 기능:

```txt
- 인벤토리 슬롯을 장착 슬롯에 드롭하면 장착 요청
- 장착된 아티팩트 아이콘 표시
- 아이템 등급에 따른 슬롯 프레임 표시
- 빈 슬롯일 때 기본 슬롯 이미지 표시
- 더블클릭으로 장착 해제
- 장비칸에서 인벤토리 슬롯으로 드래그 앤 드롭 해제
```

장착 슬롯은 일반 인벤토리 슬롯처럼 다음 구조를 사용한다.

```txt
Image-Background
Image-RarityFrame
Image-EquipItemImage
```

이 구조를 사용한 이유는 빈 슬롯 이미지, 등급별 프레임, 아이템 아이콘이 서로 겹쳐도 제어하기 쉽기 때문이다.

## 8. 장착 해제 UX 수정

처음에는 우클릭으로 해제하도록 만들었지만, 최종적으로는 다음 방식으로 바꿨다.

```txt
- 왼쪽 더블클릭으로 해제
- 장착 슬롯에서 인벤토리 슬롯으로 드래그 앤 드롭하여 해제
```

우클릭을 제거한 이유는 현재 인벤토리 조작 흐름과 맞지 않고, 사용자가 기대하는 조작이 더블클릭/드래그 방식에 가까웠기 때문이다.

<code>ArtifactEquipSlotUI</code>는 드래그 시작점이 되고, <code>InventorySlotUI</code>는 장비칸에서 드롭된 아티팩트를 받아 해제 이벤트를 발생시킨다.

## 9. 탈출 시 아티팩트 증발 문제 해결

문제:

장착한 상태로 탈출하면 아티팩트가 사라졌다.

원인:

기존 저장 구조는 다음만 저장했다.

```txt
inventorySlots
safeSlots
quickSlots
```

하지만 장착 중인 아티팩트는 인벤토리 슬롯에서 빠져 있고, 별도의 저장 리스트도 없었다. 그래서 탈출 정산 시 저장 대상에 포함되지 않아 증발했다.

수정:

<code>PlayerSaveData</code>에 <code>artifactSlots</code>를 추가했다.

```txt
public List<SaveSlotData> artifactSlots = new();
```

그리고 <code>ResultManager.InventorySync()</code>에서 현재 장착 중인 아티팩트를 저장하도록 했다.

<code>GameManager.OnSceneLoaded()</code>에서는 저장된 <code>artifactSlots</code>를 읽어 다시 <code>PlayerArtifactEquipment</code>에 복원하도록 연결했다.

## 10. 오늘 해결한 문제 정리

```txt
문제 1: 아티팩트가 아이템 데이터로 로드되지 않음
해결: LocalJsonItemRepository에 artifact 분기 추가
```

```txt
문제 2: 아이템 박스에서 아티팩트를 뽑을 수 없음
해결: ItemBox에 카테고리 확률 루팅과 아티팩트 등급별 루팅 추가
```

```txt
문제 3: 장착 슬롯 UI가 일부 칸만 이미지가 적용됨
해결: Canvas-InventoryUI 프리팹의 세 장착 슬롯 모두에 등급별 슬롯 이미지 연결
```

```txt
문제 4: 장착 슬롯의 레어리티 프레임이 제대로 표시되지 않음
해결: ArtifactEquipSlotUI에서 artifact.itemGrade 기준으로 프레임 갱신
```

```txt
문제 5: 장착한 아티팩트를 다시 뺄 수 없음
해결: 더블클릭 해제와 드래그 앤 드롭 해제 추가
```

```txt
문제 6: 장착 상태로 탈출하면 아티팩트가 사라짐
해결: PlayerSaveData에 artifactSlots 추가 후 저장/복원 연결
```

## 11. 다음에 이어서 할 작업

다음 단계에서는 아티팩트가 단순히 장착만 되는 것이 아니라, 실제 플레이어 능력치에 영향을 주도록 만들어야 한다.

우선순위는 다음과 같다.

```txt
1. hpRegen 효과 실제 적용
2. mpRegen 효과 실제 적용
3. moveSpeedUp 효과 실제 적용
4. fireSpeedUp / fireMPDown 효과 적용
5. 장착 효과 중복 계산 규칙 정리
6. 로비/창고/출격 준비 UI에서도 아티팩트 장착 상태를 보여줄지 결정
```

오늘 작업은 “아티팩트가 게임 안에 존재하고, 획득되고, 장착되고, 저장되는 기반”을 만든 단계다.

아직 효과 적용은 남아 있지만, 이제 아티팩트 시스템의 기본 뼈대는 연결된 상태라고 볼 수 있다.

오후 8:25
{% endraw %}
