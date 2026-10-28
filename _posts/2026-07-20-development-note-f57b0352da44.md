---
title: "2026-07-20_MuzzleFlashLight_script_compare"
date: 2026-07-20 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: bfd072d 파일: Assets/02_Scripts/System/Player/MuzzleFlashLight.cs 2. 변경 설명 발사 위치의 Point Light 하나를 재사용해 짧은 광량 피드백을 만드는 컴"
description: "1. 이전 스크립트 전체 신규 파일로 이전 스크립트가 없습니다. 생성 커밋: bfd072d 파일: Assets/02_Scripts/System/Player/MuzzleFlashLight.cs 2. 변경 설명 발사 위치의 Point Light 하나를 재사용해 짧은 광량 피드백을 만드는 컴"
published: false
migration_id: "3a336532580e814d86e8f57b0352da44"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

신규 파일로 이전 스크립트가 없습니다.

- 생성 커밋: <code>bfd072d</code>
- 파일: <code>Assets/02_Scripts/System/Player/MuzzleFlashLight.cs</code>

## 2. 변경 설명

발사 위치의 Point Light 하나를 재사용해 짧은 광량 피드백을 만드는 컴포넌트입니다. 발사 프레임에 peak 값을 보장하고, Time.timeScale이 0이어도 상태가 안정적으로 정리되도록 unscaledDeltaTime으로 감쇠합니다. Light는 대기 중 비활성화하고 발사 중에만 켜며, 프리팹 최종 오버라이드는 peakIntensity 50, range 2.5, flashDuration 0.055입니다.

## 3. 현재 스크립트 전체

- 기준: <code>bfd072d</code>
- 파일: <code>Assets/02_Scripts/System/Player/MuzzleFlashLight.cs</code>

```cs
using UnityEngine;

/// <summary>
/// 총구에 연결된 실시간 라이트를 발사 순간에만 짧게 켜서 머즐 플래시의 가시성을 보강합니다.
/// 매 발사마다 라이트를 생성하지 않고 하나의 컴포넌트를 재사용합니다.
/// </summary>
[DisallowMultipleComponent]
[RequireComponent(typeof(Light))]
public sealed class MuzzleFlashLight : MonoBehaviour
{
    [Header("Muzzle Light")]
    [SerializeField] private Light muzzleLight;                         // 발사 순간 켜지는 총구 라이트
    [SerializeField, Min(0.01f)] private float flashDuration = 0.055f;  // 라이트가 유지되는 시간
    [SerializeField, Min(0f)] private float peakIntensity = 8f;         // 발사 직후 최대 밝기
    [SerializeField] private bool fadeOut = true;                       // 유지 시간 동안 밝기를 줄일지 여부

    private float remainingTime;
    private int playedFrame = -1;

    private void Awake()
    {
        CacheLight();
        TurnOff();
    }

    private void OnEnable()
    {
        CacheLight();
        TurnOff();
    }

    private void Update()
    {
        if (remainingTime <= 0f || muzzleLight == null)
            return;

        // 발사한 프레임에는 최대 밝기가 최소 한 프레임 보이도록 감소 처리를 미룹니다.
        if (playedFrame == Time.frameCount)
            return;

        // 튜토리얼 일시정지 중에도 발사광이 화면에 고정되지 않도록 실제 시간을 사용합니다.
        remainingTime -= Time.unscaledDeltaTime;

        if (remainingTime <= 0f)
        {
            TurnOff();
            return;
        }

        if (fadeOut)
        {
            float normalizedTime = remainingTime / Mathf.Max(0.01f, flashDuration);
            muzzleLight.intensity = peakIntensity * Mathf.Clamp01(normalizedTime);
        }
    }

    private void OnDisable()
    {
        TurnOff();
    }

    /// <summary>
    /// 발사 시 호출하여 총구 라이트를 최대 밝기부터 다시 재생합니다.
```

```cs
    /// 연사 중 호출되면 현재 재생을 쌓지 않고 유지 시간만 처음부터 갱신합니다.
    /// </summary>
    public void PlayFlash()
    {
        // 컴포넌트를 의도적으로 끈 경우 라이트만 켜지는 상황을 막습니다.
        if (!isActiveAndEnabled)
            return;

        CacheLight();

        if (muzzleLight == null)
            return;

        playedFrame = Time.frameCount;
        remainingTime = Mathf.Max(0.01f, flashDuration);
        muzzleLight.intensity = peakIntensity;
        muzzleLight.enabled = true;
    }

    private void CacheLight()
    {
        if (muzzleLight == null)
            TryGetComponent(out muzzleLight);
    }

    private void TurnOff()
    {
        remainingTime = 0f;
        playedFrame = -1;

        if (muzzleLight == null)
            return;

        muzzleLight.intensity = 0f;
        muzzleLight.enabled = false;
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        CacheLight();
        flashDuration = Mathf.Max(0.01f, flashDuration);
        peakIntensity = Mathf.Max(0f, peakIntensity);
    }
#endif
}
```
{% endraw %}
