---
title: "2026-07-21_EnemyVisible_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyVisible.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; u"
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/System/Enemy/EnemyVisible.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; u"
published: true
migration_id: "3a436532580e818aab0fdc87c7c55d93"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyVisible.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using AnyPortrait;

public class EnemyVisible : MonoBehaviour
{
    [Tooltip("apPortrait가 포함된 시각 오브젝트 (혹은 자기 자신)")]
    [SerializeField] private GameObject spriteObject;

    private PlayerSight playerSight;            // 플레이어 시야 스크립트
    private Rigidbody rb;                       // 적 몸통 오브젝트
    private apPortrait portrait;                // 스프라이트 포트레이트
    private Renderer[] cachedRenderers;         // 스프라이트 렌더러
    private float visibleAnimationTime = 0.5f;  // 투명화 애니메이션 시간
    private float currentAlpha = 0f;            // 현재 투명도 값
    [SerializeField] private Canvas uiCanvas;   // 체력 바 캔버스

    private void Awake()
    {
        if (spriteObject == null) spriteObject = gameObject;

        // 플레이어 시야 스크립트를 찾는다
        playerSight = FindObjectOfType<PlayerSight>();

        rb = GetComponentInParent<Rigidbody>();
        portrait = GetComponentInChildren<apPortrait>();

        // 렌더러 캐시
        cachedRenderers = spriteObject.GetComponentsInChildren<Renderer>(includeInactive: true);
    }

    // 플레이어 시야 스크립트에 따라 렌더러 출력 상태 업데이트
    private void FixedUpdate()
    {
        UpdateVisibility();
    }

    private void UpdateVisibility()
    {
        if (playerSight == null || rb == null) return;
        bool visible = playerSight.IsTargetInSight(playerSight.transform, rb.transform);

        // apPortrait의 전체 투명도 값을 시야 노출 여부에 따라 점진적으로 변경
        float targetAlpha = visible ? 1f : 0f;
        currentAlpha = Mathf.MoveTowards(currentAlpha, targetAlpha, Time.deltaTime / visibleAnimationTime);
        if (portrait != null) 
        { 
            portrait.SetMeshAlphaAll(currentAlpha);
        }

        uiCanvas.enabled = visible;
    }
}

```

## 2. 변경 설명

다크 스피릿이 피해를 받으면 AnyPortrait의 개체별 2X Color를 밝은 보라색으로 전환한 뒤 짧게 원래 중립색으로 복원하는 플래시를 추가했습니다. 공유 머티리얼은 수정하지 않으며 현재 시야 알파를 매 프레임 다시 적용해 숨어 있던 적이 피격 순간 노출되는 문제를 방지합니다. 연속 피격과 비활성화 시 코루틴·색상도 안전하게 초기화합니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/System/Enemy/EnemyVisible.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using AnyPortrait;

public class EnemyVisible : MonoBehaviour
{
    private static readonly Color NeutralPortraitColor = new Color(0.5f, 0.5f, 0.5f, 1.0f);
    [Tooltip("apPortrait가 포함된 시각 오브젝트 (혹은 자기 자신)")]
    [SerializeField] private GameObject spriteObject;

    [Header("Hit Feedback")]
    [SerializeField] private bool enableHitFlash = false;                                  // 이 프리팹에서 피격 플래시를 사용할지 여부
    [SerializeField, Min(0.01f)] private float hitFlashDuration = 0.1f;                    // 밝아졌다가 원래 색으로 돌아오는 시간
    [SerializeField, ColorUsage(false, true)]
    private Color hitFlashColor = new Color(1.0f, 0.82f, 1.15f, 1.0f);                    // AnyPortrait 2X 색상 기준의 밝은 보라색

    private PlayerSight playerSight;            // 플레이어 시야 스크립트
    private Rigidbody rb;                       // 적 몸통 오브젝트
    private apPortrait portrait;                // 스프라이트 포트레이트
    private EnemyStatus enemyStatus;            // 이 적의 로컬 피격 이벤트를 제공하는 상태 컴포넌트
    private Renderer[] cachedRenderers;         // 스프라이트 렌더러
    private float visibleAnimationTime = 0.5f;  // 투명화 애니메이션 시간
    private float currentAlpha = 0f;            // 현재 투명도 값
    private Coroutine hitFlashRoutine;          // 피격 플래시 코루틴 핸들
    private bool hasActiveHitTint;               // 비활성화 시 기본색 복원이 필요한지 여부
    [SerializeField] private Canvas uiCanvas;   // 체력 바 캔버스

    private void Awake()
    {
        if (spriteObject == null) spriteObject = gameObject;

        // 플레이어 시야 스크립트를 찾는다
        playerSight = FindObjectOfType<PlayerSight>();

        rb = GetComponentInParent<Rigidbody>();
        portrait = GetComponentInChildren<apPortrait>();
        enemyStatus = GetComponentInParent<EnemyStatus>();

        // 렌더러 캐시
```

```cs
    cachedRenderers = spriteObject.GetComponentsInChildren<Renderer>(includeInactive: true);
}

private void OnValidate()
{
    hitFlashDuration = Mathf.Max(0.01f, hitFlashDuration);
}

private void OnEnable()
{
    if (enemyStatus != null)
    {
        enemyStatus.OnLocalDamaged += PlayHitFlash;
    }
}

private void OnDisable()
{
    if (enemyStatus != null)
    {
        enemyStatus.OnLocalDamaged -= PlayHitFlash;
    }

    if (hitFlashRoutine != null)
    {
        StopCoroutine(hitFlashRoutine);
        hitFlashRoutine = null;
    }

    if (hasActiveHitTint)
    {
        ApplyPortraitColor(NeutralPortraitColor);
        hasActiveHitTint = false;
    }
}

// 플레이어 시야 스크립트에 따라 렌더러 출력 상태 업데이트
private void FixedUpdate()
{
    UpdateVisibility();
}

private void UpdateVisibility()
{
    if (playerSight == null || rb == null) return;
    bool visible = playerSight.IsTargetInSight(playerSight.transform, rb.transform);

    // apPortrait의 전체 투명도 값을 시야 노출 여부에 따라 점진적으로 변경
    float targetAlpha = visible ? 1f : 0f;
    currentAlpha = Mathf.MoveTowards(currentAlpha, targetAlpha, Time.deltaTime / visibleAnimationTime);
    if (portrait != null) 
    { 
        portrait.SetMeshAlphaAll(currentAlpha);
    }

    uiCanvas.enabled = visible;
}

/// <summary>
/// 피격할 때마다 기존 플래시를 새로 시작해 즉시 밝아지는 반응을 유지합니다.
/// 공유 머티리얼을 수정하지 않고 이 적의 AnyPortrait 색상만 변경합니다.
/// </summary>
private void PlayHitFlash()
{
    if (!enableHitFlash || portrait == null)
    {
        return;
    }

    if (hitFlashRoutine != null)
    {
```

```cs
            StopCoroutine(hitFlashRoutine);
        }

        hitFlashRoutine = StartCoroutine(HitFlashRoutine());
    }

    private IEnumerator HitFlashRoutine()
    {
        hasActiveHitTint = true;
        ApplyPortraitColor(hitFlashColor);

        float elapsed = 0.0f;
        while (elapsed < hitFlashDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            float normalizedTime = Mathf.Clamp01(elapsed / hitFlashDuration);
            ApplyPortraitColor(Color.Lerp(hitFlashColor, NeutralPortraitColor, normalizedTime));
            yield return null;
        }

        ApplyPortraitColor(NeutralPortraitColor);
        hasActiveHitTint = false;
        hitFlashRoutine = null;
    }

    /// <summary>
    /// AnyPortrait 기본색은 흰색이 아니라 2X Color 기준 0.5입니다.
    /// 색상 변경 뒤 현재 시야 알파를 다시 적용해 숨어 있던 적이 한 프레임 노출되지 않게 합니다.
    /// </summary>
    private void ApplyPortraitColor(Color color)
    {
        if (portrait == null)
        {
            return;
        }

        color.a = currentAlpha;
        portrait.SetMeshColorAll(color);
        portrait.SetMeshAlphaAll(currentAlpha);
    }
}

```
{% endraw %}
