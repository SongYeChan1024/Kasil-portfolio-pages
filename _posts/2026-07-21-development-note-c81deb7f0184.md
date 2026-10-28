---
title: "2026-07-21_EnemyPresenter_script_compare"
date: 2026-07-21 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/Presenter/EnemyPresenter.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; pu"
description: "1. 이전 스크립트 전체 기준: 0bd90d1 파일: Assets/02_Scripts/Presenter/EnemyPresenter.cs cs using System.Collections; using System.Collections.Generic; using UnityEngine; pu"
published: true
migration_id: "3a436532580e81cfb8fbc81deb7f0184"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>0bd90d1</code>
- 파일: <code>Assets/02_Scripts/Presenter/EnemyPresenter.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnemyPresenter : MonoBehaviour
{
    [Header("필수 컴포넌트")]
    [SerializeField] private EnemyMovement movement;     // 움직임
    [SerializeField] private EnemyAnimator animator;     // 애니메이션
    [SerializeField] private EnemyStatus status;         // 상태 관리

    private void Awake()
    {
        // 필수 컴포넌트 초기화
        movement = GetComponent<EnemyMovement>();
        animator = GetComponentInChildren<EnemyAnimator>();
        status = GetComponent<EnemyStatus>();
        if (movement == null || animator == null || status == null)
        {
            enabled = false;
            Debug.LogError("EnemyPresenter: required components are missing.");
            return;
        }
    }

    private void OnEnable()
    {
        // 이벤트 구독
        movement.OnWalkEvent += animator.PlayWalk;
        movement.OnAttackEvent += animator.PlayAttack;
        movement.OnDeathEvent += animator.PlayDeath;
        movement.OnLookDirEvent += animator.PlayLookDir;

        animator.OnAttackSwing += movement.HandleAttackSwing;
    }

    private void OnDisable()
    {
        // 구독 해제
        movement.OnWalkEvent -= animator.PlayWalk;
        movement.OnAttackEvent -= animator.PlayAttack;
        movement.OnDeathEvent -= animator.PlayDeath;
        movement.OnLookDirEvent -= animator.PlayLookDir;

        animator.OnAttackSwing -= movement.HandleAttackSwing;
    }
}

```

## 2. 변경 설명

<code>EnemyMovement</code>가 요청하는 피격 히트 스톱 이벤트를 <code>EnemyAnimator</code>에 연결하고 해제하도록 Presenter의 구독 생명주기를 확장했습니다. 이동·전투 상태를 직접 변경하지 않고 표현 계층으로 정지 시간만 전달하므로 기존 공격 상태 머신과 역할을 분리합니다.

## 3. 현재 스크립트 전체

- 기준: <code>2a81ecc</code>
- 파일: <code>Assets/02_Scripts/Presenter/EnemyPresenter.cs</code>

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnemyPresenter : MonoBehaviour
{
    [Header("필수 컴포넌트")]
    [SerializeField] private EnemyMovement movement;     // 움직임
    [SerializeField] private EnemyAnimator animator;     // 애니메이션
    [SerializeField] private EnemyStatus status;         // 상태 관리

    private void Awake()
    {
        // 필수 컴포넌트 초기화
        movement = GetComponent<EnemyMovement>();
        animator = GetComponentInChildren<EnemyAnimator>();
        status = GetComponent<EnemyStatus>();
        if (movement == null || animator == null || status == null)
        {
            enabled = false;
            Debug.LogError("EnemyPresenter: required components are missing.");
            return;
        }
    }

    private void OnEnable()
    {
        // 이벤트 구독
        movement.OnWalkEvent += animator.PlayWalk;
        movement.OnAttackEvent += animator.PlayAttack;
        movement.OnDeathEvent += animator.PlayDeath;
        movement.OnLookDirEvent += animator.PlayLookDir;
        movement.OnHitStopEvent += animator.PlayHitStop;

        animator.OnAttackSwing += movement.HandleAttackSwing;
    }

    private void OnDisable()
    {
        // 구독 해제
        movement.OnWalkEvent -= animator.PlayWalk;
        movement.OnAttackEvent -= animator.PlayAttack;
        movement.OnDeathEvent -= animator.PlayDeath;
        movement.OnLookDirEvent -= animator.PlayLookDir;
        movement.OnHitStopEvent -= animator.PlayHitStop;

        animator.OnAttackSwing -= movement.HandleAttackSwing;
    }
}

```
{% endraw %}
