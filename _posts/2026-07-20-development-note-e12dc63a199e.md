---
title: "2026-07-20_TutorialHighlightController_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 9d7af9e 파일: Assets/02_Scripts/System/Tutorial/TutorialHighlightController.cs 2. 변경 설명 튜토리얼 가이드가 지정한 UI 또는 월드 대상의 화면 b"
description: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: 9d7af9e 파일: Assets/02_Scripts/System/Tutorial/TutorialHighlightController.cs 2. 변경 설명 튜토리얼 가이드가 지정한 UI 또는 월드 대상의 화면 b"
published: true
migration_id: "3a336532580e81c2ac55e12dc63a199e"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

신규 파일로 이전 스크립트가 없습니다.

- 생성 커밋: <code>9d7af9e</code>
- 파일: <code>Assets/02_Scripts/System/Tutorial/TutorialHighlightController.cs</code>

## 2. 변경 설명

튜토리얼 가이드가 지정한 UI 또는 월드 대상의 화면 bounds를 계산하고, 네 개의 암전 패널로 주변만 가리며 강조 프레임과 목표 안내 문구를 표시합니다. 시간 정지 중에도 보이도록 펄스와 전환은 unscaledTime으로 처리하고, 해상도와 Canvas 좌표계 변환을 한곳에서 관리합니다.

## 3. 현재 스크립트 전체

- 기준: <code>9d7af9e</code>
- 파일: <code>Assets/02_Scripts/System/Tutorial/TutorialHighlightController.cs</code>

```cs
using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

/// <summary>
/// TutorialCanvas에 배치된 암전 패널과 강조 프레임을 제어합니다.
/// 시각 요소는 프리팹/인스펙터에서 구성하고, 이 컴포넌트는 대상 위치 계산과 표시 상태만 담당합니다.
/// </summary>
public sealed class TutorialHighlightController : MonoBehaviour
{
    private static readonly char[] TargetIdSeparators = { '|', ',', ';' };

    [Header("캔버스")]
    [SerializeField] private Canvas highlightCanvas;
    [SerializeField] private RectTransform highlightLayer;

    [Header("주변 암전 패널")]
    [SerializeField] private GameObject dimRoot;
    [SerializeField] private RectTransform dimLeft;
    [SerializeField] private RectTransform dimRight;
    [SerializeField] private RectTransform dimTop;
    [SerializeField] private RectTransform dimBottom;

    [Header("강조 프레임")]
    [SerializeField] private RectTransform focusFrame;
    [SerializeField] private CanvasGroup focusFrameCanvasGroup;
    [SerializeField, Min(0f)] private float screenEdgeMargin = 8f;
    [SerializeField, Min(0f)] private float pulseSpeed = 1.6f;
    [SerializeField, Range(0f, 1f)] private float minimumPulseAlpha = 0.5f;

    [Header("목표 수행 중 안내 문구")]
    [SerializeField] private GameObject instructionRoot;
    [SerializeField] private TMP_Text instructionTitleText;
    [SerializeField] private TMP_Text instructionMessageText;

    private readonly HashSet<string> requestedTargetIds = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<TutorialHighlightTarget> resolvedTargets = new();
    private readonly Vector3[] worldCorners = new Vector3[4];

    private TutorialGuideData activeGuide;
    private bool hasHighlightRequest;
    private bool showDimPanels;
```

```cs
private bool targetsDirty;

/// <summary>
/// 데이터에 UI 또는 월드 하이라이트 ID가 지정되어 있는지 반환합니다.
/// </summary>
public bool HasHighlightRequest => hasHighlightRequest;

private void Awake()
{
    ResolveMissingReferences();
    HideVisuals();
}

private void OnEnable()
{
    TutorialHighlightTarget.ActiveTargetsChanged += HandleTargetsChanged;
    targetsDirty = true;
}

private void OnDisable()
{
    TutorialHighlightTarget.ActiveTargetsChanged -= HandleTargetsChanged;
    Hide();
}

private void LateUpdate()
{
    if (!hasHighlightRequest)
        return;

    if (targetsDirty)
        RefreshResolvedTargets();

    UpdateHighlightBounds();
    UpdatePulse();
}

/// <summary>
/// 현재 가이드의 하이라이트를 시작합니다.
/// </summary>
public bool Show(TutorialGuideData guide)
{
    activeGuide = guide;
    requestedTargetIds.Clear();

    if (guide != null)
    {
        AddTargetIds(guide.UIHighlightPosition);
        AddTargetIds(guide.HighlightEffectPosition);
    }

    hasHighlightRequest = requestedTargetIds.Count > 0;
    showDimPanels = hasHighlightRequest;
    targetsDirty = true;
    SetInstructionVisible(false);

    if (!hasHighlightRequest)
        HideHighlightVisuals();

    return hasHighlightRequest;
}

/// <summary>
/// 설명 팝업을 닫고 실제 조작을 시작할 때 암전은 제거하고 프레임과 목표 문구만 유지합니다.
/// </summary>
public void EnterObjectiveMode()
{
    showDimPanels = false;

    if (dimRoot != null)
        dimRoot.SetActive(false);

    if (activeGuide == null)
    {
```

```cs
        SetInstructionVisible(false);
        return;
    }

    if (instructionTitleText != null)
        instructionTitleText.text = activeGuide.ResolvedTitle;

    if (instructionMessageText != null)
        instructionMessageText.text = activeGuide.Message;

    SetInstructionVisible(true);
}

/// <summary>
/// 현재 하이라이트와 목표 문구를 모두 종료합니다.
/// </summary>
public void Hide()
{
    activeGuide = null;
    requestedTargetIds.Clear();
    resolvedTargets.Clear();
    hasHighlightRequest = false;
    showDimPanels = false;
    targetsDirty = false;
    HideVisuals();
}

private void HandleTargetsChanged()
{
    targetsDirty = true;
}

private void RefreshResolvedTargets()
{
    TutorialHighlightTarget.CollectActiveTargets(requestedTargetIds, resolvedTargets);
    targetsDirty = false;
}

private void UpdateHighlightBounds()
{
    if (highlightLayer == null || resolvedTargets.Count == 0)
    {
        HideHighlightVisuals();
        return;
    }

    bool hasBounds = false;
    Vector2 minimum = Vector2.zero;
    Vector2 maximum = Vector2.zero;

    foreach (TutorialHighlightTarget target in resolvedTargets)
    {
        if (target == null || !target.isActiveAndEnabled)
            continue;

        if (!TryGetTargetBounds(target, out Vector2 targetMinimum, out Vector2 targetMaximum))
            continue;

        if (!hasBounds)
        {
            minimum = targetMinimum;
            maximum = targetMaximum;
            hasBounds = true;
            continue;
```

```cs
        }

        minimum = Vector2.Min(minimum, targetMinimum);
        maximum = Vector2.Max(maximum, targetMaximum);
    }

    if (!hasBounds)
    {
        HideHighlightVisuals();
        return;
    }

    Rect layerRect = highlightLayer.rect;
    minimum.x = Mathf.Clamp(minimum.x, layerRect.xMin + screenEdgeMargin, layerRect.xMax - screenEdgeMargin);
    minimum.y = Mathf.Clamp(minimum.y, layerRect.yMin + screenEdgeMargin, layerRect.yMax - screenEdgeMargin);
    maximum.x = Mathf.Clamp(maximum.x, layerRect.xMin + screenEdgeMargin, layerRect.xMax - screenEdgeMargin);
    maximum.y = Mathf.Clamp(maximum.y, layerRect.yMin + screenEdgeMargin, layerRect.yMax - screenEdgeMargin);

    if (maximum.x <= minimum.x || maximum.y <= minimum.y)
    {
        HideHighlightVisuals();
        return;
    }

    Rect focusRect = Rect.MinMaxRect(minimum.x, minimum.y, maximum.x, maximum.y);
    ApplyFocusRect(focusRect, layerRect);
}

private bool TryGetTargetBounds(
    TutorialHighlightTarget target,
    out Vector2 minimum,
    out Vector2 maximum)
{
    minimum = Vector2.zero;
    maximum = Vector2.zero;

    if (target.Kind == TutorialHighlightTarget.TargetKind.UI)
        return TryGetUIBounds(target, out minimum, out maximum);

    return TryGetWorldBounds(target, out minimum, out maximum);
}

private bool TryGetUIBounds(
    TutorialHighlightTarget target,
    out Vector2 minimum,
    out Vector2 maximum)
{
    minimum = Vector2.zero;
    maximum = Vector2.zero;

    RectTransform targetRect = target.UITarget;
```

```cs
    if (targetRect == null || !targetRect.gameObject.activeInHierarchy)
        return false;

    Canvas targetCanvas = targetRect.GetComponentInParent<Canvas>();
    Camera targetCamera = targetCanvas != null && targetCanvas.renderMode != RenderMode.ScreenSpaceOverlay
        ? targetCanvas.worldCamera
        : null;

    targetRect.GetWorldCorners(worldCorners);
    bool initialized = false;

    for (int index = 0; index < worldCorners.Length; index++)
    {
        Vector2 screenPoint = RectTransformUtility.WorldToScreenPoint(targetCamera, worldCorners[index]);
        if (!TryScreenToHighlightLocal(screenPoint, out Vector2 localPoint))
            continue;

        if (!initialized)
        {
            minimum = localPoint;
            maximum = localPoint;
            initialized = true;
        }
        else
        {
            minimum = Vector2.Min(minimum, localPoint);
            maximum = Vector2.Max(maximum, localPoint);
        }
    }

    if (!initialized)
        return false;

    Vector2 padding = target.UIPadding;
    minimum -= padding;
    maximum += padding;
    return true;
}

private bool TryGetWorldBounds(
    TutorialHighlightTarget target,
    out Vector2 minimum,
    out Vector2 maximum)
{
    minimum = Vector2.zero;
    maximum = Vector2.zero;

    Transform worldTarget = target.WorldTarget;
    Camera worldCamera = target.WorldCamera;
    if (worldTarget == null || worldCamera == null || !worldTarget.gameObject.activeInHierarchy)
        return false;
```

```cs
    Vector3 screenPosition = worldCamera.WorldToScreenPoint(worldTarget.position + target.WorldOffset);
    if (screenPosition.z <= 0f)
        return false;

    Vector2 halfSize = target.WorldScreenSize * 0.5f;
    Vector2 screenMinimum = new(screenPosition.x - halfSize.x, screenPosition.y - halfSize.y);
    Vector2 screenMaximum = new(screenPosition.x + halfSize.x, screenPosition.y + halfSize.y);

    return TryScreenToHighlightLocal(screenMinimum, out minimum) &&
           TryScreenToHighlightLocal(screenMaximum, out maximum);
}

private bool TryScreenToHighlightLocal(Vector2 screenPoint, out Vector2 localPoint)
{
    Camera canvasCamera = highlightCanvas != null && highlightCanvas.renderMode != RenderMode.ScreenSpaceOverlay
        ? highlightCanvas.worldCamera
        : null;

    return RectTransformUtility.ScreenPointToLocalPointInRectangle(
        highlightLayer,
        screenPoint,
        canvasCamera,
        out localPoint);
}

private void ApplyFocusRect(Rect focusRect, Rect layerRect)
{
    SetRect(focusFrame, focusRect);
    SetRect(dimLeft, Rect.MinMaxRect(layerRect.xMin, layerRect.yMin, focusRect.xMin, layerRect.yMax));
    SetRect(dimRight, Rect.MinMaxRect(focusRect.xMax, layerRect.yMin, layerRect.xMax, layerRect.yMax));
    SetRect(dimTop, Rect.MinMaxRect(focusRect.xMin, focusRect.yMax, focusRect.xMax, layerRect.yMax));
    SetRect(dimBottom, Rect.MinMaxRect(focusRect.xMin, layerRect.yMin, focusRect.xMax, focusRect.yMin));

    if (focusFrame != null)
        focusFrame.gameObject.SetActive(true);

    if (dimRoot != null)
```

```cs
        dimRoot.SetActive(showDimPanels);
}

private void UpdatePulse()
{
    if (focusFrameCanvasGroup == null || focusFrame == null || !focusFrame.gameObject.activeSelf)
        return;

    float wave = (Mathf.Sin(Time.unscaledTime * pulseSpeed * Mathf.PI * 2f) + 1f) * 0.5f;
    focusFrameCanvasGroup.alpha = Mathf.Lerp(minimumPulseAlpha, 1f, wave);
}

private void AddTargetIds(string rawTargetIds)
{
    if (string.IsNullOrWhiteSpace(rawTargetIds))
        return;

    string trimmed = rawTargetIds.Trim();
    if (string.Equals(trimmed, "none", StringComparison.OrdinalIgnoreCase) || trimmed == "-")
        return;

    string[] ids = trimmed.Split(TargetIdSeparators, StringSplitOptions.RemoveEmptyEntries);
    foreach (string id in ids)
    {
        string normalizedId = id.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedId))
            requestedTargetIds.Add(normalizedId);
    }
}

private void ResolveMissingReferences()
{
    highlightLayer ??= transform as RectTransform;
    highlightCanvas ??= GetComponentInParent<Canvas>();

    if (focusFrame != null && focusFrameCanvasGroup == null)
        focusFrameCanvasGroup = focusFrame.GetComponent<CanvasGroup>();
}

private void HideVisuals()
{
    HideHighlightVisuals();
    SetInstructionVisible(false);
}

private void HideHighlightVisuals()
{
    if (dimRoot != null)
        dimRoot.SetActive(false);

    if (focusFrame != null)
        focusFrame.gameObject.SetActive(false);
}

private void SetInstructionVisible(bool visible)
{
```

```cs
        if (instructionRoot != null)
            instructionRoot.SetActive(visible);
    }

    private static void SetRect(RectTransform target, Rect rect)
    {
        if (target == null)
            return;

        target.anchorMin = new Vector2(0.5f, 0.5f);
        target.anchorMax = new Vector2(0.5f, 0.5f);
        target.pivot = new Vector2(0.5f, 0.5f);
        target.anchoredPosition = rect.center;
        target.sizeDelta = new Vector2(Mathf.Max(0f, rect.width), Mathf.Max(0f, rect.height));
    }
}
```
{% endraw %}
