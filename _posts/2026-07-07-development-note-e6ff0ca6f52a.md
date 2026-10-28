---
title: "코드변경사항 기록//0707"
date: 2026-07-07 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 문서 개요 이 문서는 2026년 7월 7일 기준 진행한 Demo 씬 에너미 스폰 호환 , 먹잇감 차단 이동 구현 및 튜닝 , 루시드 낙인 2중첩 구조 구현 , 의식누출 흔적형 소음 시스템 추가 , 제한 시간 감소 이벤트 연동 작업을 스크립트 비교 형식으로 정리한 문서이다. 문서 형"
description: "1. 문서 개요 이 문서는 2026년 7월 7일 기준 진행한 Demo 씬 에너미 스폰 호환 , 먹잇감 차단 이동 구현 및 튜닝 , 루시드 낙인 2중첩 구조 구현 , 의식누출 흔적형 소음 시스템 추가 , 제한 시간 감소 이벤트 연동 작업을 스크립트 비교 형식으로 정리한 문서이다. 문서 형"
published: true
migration_id: "39636532580e8067b97de6ff0ca6f52a"
migration_status: "published"
migration_flags: ["local_code_link_unlinked", "publication_review"]
---

{% raw %}
## 1. 문서 개요

이 문서는 2026년 7월 7일 기준 진행한 <code>Demo 씬 에너미 스폰 호환</code>, <code>먹잇감 차단 이동 구현 및 튜닝</code>, <code>루시드 낙인 2중첩 구조 구현</code>, <code>의식누출 흔적형 소음 시스템 추가</code>, <code>제한 시간 감소 이벤트 연동</code> 작업을 스크립트 비교 형식으로 정리한 문서이다.

문서 형식은 <code>이전 구조 -&gt; 설명 -&gt; 수정된 구조</code> 순서를 따르며, 이번 작업에서 실제로 구조가 바뀐 핵심 지점만 발췌해 기록한다.

---

## 2. 스크립트별 비교

### 2.1 SpawnManager.cs


- 대상 경로: \SpawnManager.cs (line 1)\

#### 이전 구조

```cs
public void SpawnEnemy()
{
    if (enemySpawnPoints.Count == 0)
    {
        Debug.LogError("Enemy spawn source list is empty");
        return;
    }

    // 등록된 적 스폰 포인트를 기준으로 생성
}
```

#### 설명

기존 Demo 씬은 <code>EnemySpawnPointPool</code> 아래에 직접 배치된 스폰 포인트 구조를 사용하고 있었다.

반면 최근 적 AI 구조는 <code>EnemySpawnZone</code>과 순찰/조사/복귀 초기화 흐름을 함께 쓰는 방향으로 확장되었기 때문에, Demo 씬의 기존 포인트 구조를 런타임 스폰 소스로 충분히 인식하지 못하는 문제가 발생할 수 있었다.

그 결과 <code>Enemy spawn source list is empty</code> 오류가 발생했고, Demo 씬에서는 적 생성이 아예 시작되지 않았다.

이번 수정에서는 새 구조와 구 구조를 동시에 지원하도록 스폰 소스 재수집 함수를 추가했다.

#### 수정된 구조

```cs
private void RebuildEnemySpawnSources()
{
    enemySpawnZones.Clear();
    legacyEnemySpawnPoints.Clear();

    foreach (Transform child in enemySpawnPool.transform)
    {
        if (child.TryGetComponent(out EnemySpawnZone zone))
        {
            enemySpawnZones.Add(zone);
            continue;
        }

        if (child.GetComponent<EnemySpawnPoint>() != null || IsNamedSpawnPoint(child))
        {
            legacyEnemySpawnPoints.Add(child);
        }
    }
}

public void SpawnEnemy()
{
    RebuildEnemySpawnSources();

    if (enemySpawnZones.Count == 0 && legacyEnemySpawnPoints.Count == 0)
    {
        Debug.LogError("Enemy spawn source list is empty");
        return;
    }

    int spawnedEnemyCount = enemySpawnZones.Count > 0
        ? SpawnEnemiesFromZones()
        : SpawnEnemiesFromLegacyPoints();
}
```

---

### 2.2 EnemyMovement.cs

- 대상 경로: \EnemyMovement.cs (line 1)\

#### 이전 구조

```cs
// 플레이어 현재 위치를 기준으로 단순 추적
locomotion.MoveTo(agent, target.position, ...);
```

#### 설명

기존 구조는 적이 플레이어의 현재 위치만 따라가는 단순 추적에 가까웠다.

이 방식은 기본 추격은 가능하지만, 기획서에서 의도한 “먹잇감 차단 이동”처럼 플레이어의 이동 방향 앞을 끊어 들어가는 느낌이 약했다.

이번 수정에서는 <code>EnemyInterceptPlanner</code>를 추가해, 적과 플레이어 사이 거리, 플레이어 이동 속도, 예측 시간, 리드 거리 등을 기준으로 차단 이동 목적지를 계산하도록 구조를 분리했다.

즉, 추적 로직 안에 계산을 계속 끼워 넣는 대신, “차단 이동을 시도할지/말지”를 별도 모듈에서 판단하게 바꾼 것이다.

#### 수정된 구조

```cs
[SerializeField] private EnemyInterceptPlanner interceptPlanner = new EnemyInterceptPlanner();

if (interceptPlanner.TryPlanIntercept(self, currentTarget, memory, out Vector3 interceptDestination))
{
    chaseMoveMode = EnemyMemory.ChaseMoveMode.Intercept;
    locomotion.MoveTo(agent, interceptDestination, ...);
}
else
{
    chaseMoveMode = EnemyMemory.ChaseMoveMode.Direct;
    locomotion.MoveTo(agent, currentTarget.position, ...);
}
```

```cs
public class EnemyInterceptPlanner
{
    [SerializeField] private bool enableInterceptChase = true;
    [SerializeField] private float minInterceptDistance = 4.0f;
    [SerializeField] private float maxInterceptDistance = 18.0f;
    [SerializeField] private float predictionTime = 0.9f;
    [SerializeField] private float minInterceptAdvanceDistance = 0.75f;
}
```

---

### 2.3 PlayerStatus.cs

- 대상 경로: \PlayerStatus.cs (line 1)\

#### 이전 구조

```cs
public void TakeDamage(float dmg)
{
    hpCurrent -= dmg;

    if (hpCurrent <= 0)
    {
        // 사망 처리
    }
}
```

#### 설명

기존 플레이어 피격 구조는 HP 감소와 사망 처리 중심이었다.

하지만 이번 기획에서는 피격 시 <code>루시드 낙인</code>이 쌓이고, 2중첩부터는 <code>의식누출</code>이 시작되며, 매 피격마다 제한 시간 5초 감소가 적용되어야 했다.

또한 의식누출은 플레이어 주변 오라가 아니라, 플레이어가 지나간 경로에 흔적 오브젝트가 떨어지고 그 흔적이 자기 위치에서 소음을 내는 구조여야 했다.

그래서 <code>PlayerStatus</code> 내부에 <code>PlayerLucidMarkController</code>를 넣어, 피격 후처리 흐름을 HP 처리와 분리된 전용 컨트롤러가 맡도록 바꿨다.

#### 수정된 구조

```cs
[SerializeField] private PlayerLucidMarkController lucidMark = new PlayerLucidMarkController();

public void TakeDamage(float dmg)
{
    hpCurrent -= dmg;

    if (hpCurrent > 0.0f)
    {
        lucidMark.ApplyHit(transform, gameObject);
    }

    if (hpCurrent <= 0)
    {
        // 사망 처리
    }
}

private void FixedUpdate()
{
    lucidMark.Tick(transform, gameObject);
}
```

```cs
[Serializable]
public class PlayerLucidMarkController
{
    [SerializeField] private int maxStack = 2;
    [SerializeField] private float hitTimePenaltySeconds = 5.0f;
    [SerializeField] private float markDuration = 8.0f;
    [SerializeField] private float leakDuration = 8.0f;
    [SerializeField] private float traceSpawnDistance = 1.8f;

    public void ApplyHit(Transform owner, GameObject source) { ... }
    public void Tick(Transform owner, GameObject source) { ... }
}
```

---

### 2.4 TimeLimitController.cs + GlobalEventBus.cs

- 대상 경로: \TimeLimitController.cs (line 1)\
- 대상 경로: \GlobalEventBus.cs (line 1)\

#### 이전 구조

```cs
private void FixedUpdate()
{
    currentTimeLimit -= Time.fixedDeltaTime;
    // 타이머 UI 반영
}
```

#### 설명

기존 제한 시간 시스템은 시간이 자연스럽게 흐르면서 줄어드는 구조만 가지고 있었다.

즉, 전투나 상태이상 같은 외부 시스템이 “즉시 남은 시간을 깎아야 하는 상황”을 직접 요청할 수 있는 공용 진입점이 없었다.

이번 수정에서는 <code>GlobalEventBus.OnTimePenaltyRequested</code>를 추가하고, <code>TimeLimitController</code>가 이 이벤트를 구독해 즉시 시간 감소를 적용하도록 바꿨다.

이 구조 덕분에 루시드 낙인뿐 아니라 이후 다른 패널티 시스템도 같은 방식으로 확장할 수 있다.

#### 수정된 구조

```cs
public static Action<float> OnTimePenaltyRequested;
```

```cs
private void OnEnable()
{
    GlobalEventBus.OnTimePenaltyRequested += ApplyTimePenalty;
}

private void OnDisable()
{
    GlobalEventBus.OnTimePenaltyRequested -= ApplyTimePenalty;
}

public void ApplyTimePenalty(float penaltySeconds)
{
    currentTimeLimit = Mathf.Max(0.0f, currentTimeLimit - penaltySeconds);
    BroadcastCurrentTime();
    TryFinishByTimeout();
}
```

---

### 2.5 NoiseType.cs + NoiseManager.cs

- 대상 경로: \NoiseType.cs (line 1)\
- 대상 경로: \NoiseManager.cs (line 1)\

#### 이전 구조

```cs
public enum NoiseType
{
    Walk,
    Run,
    Gunshot
}
```

#### 설명

기존 소음 시스템은 걷기, 달리기, 총성과 같은 일반 소음만 전제로 하고 있었다.

하지만 이번 루시드 낙인 구조에서는 플레이어가 남긴 <code>의식누출 흔적</code>이 자기 위치에서 강한 조사 유도 소음을 발생시켜야 했다.

그래서 새 소음 타입 <code>LucidLeak</code>를 추가하고, 기본 반경/지속시간/우선순위를 <code>NoiseManager</code>에 등록했다.

#### 수정된 구조

```cs
public enum NoiseType
{
    Walk,
    Run,
    Gunshot,
    LucidLeak
}
```

```cs
new NoiseTypeSetting
{
    type = NoiseType.LucidLeak,
    defaultRadius = 45.0f,
    defaultDuration = 3.0f,
    priority = 50,
    canInterruptChase = false
},
```

---

### 2.6 LucidLeakTraceRuntime

- 대상 경로: \PlayerStatus.cs (line 508)\

#### 이전 구조

```cs
// 의식누출 전용 흔적 오브젝트 없음
```

#### 설명

기획상 의식누출은 플레이어를 따라다니는 범위 오라가 아니라, 플레이어가 이동하면서 “흘리고 지나간 흔적”이 그 자리에 남아 조사 유도를 만드는 구조여야 했다.

이번 수정에서는 흔적 오브젝트를 런타임에 생성하고, 그 오브젝트가 자기 위치에서 일정 주기로 <code>LucidLeak</code> 소음을 발생시키도록 만들었다.

즉, 기존 NoiseManager를 그대로 재사용하되, 소리의 발생 기준점을 플레이어 몸이 아니라 흔적 오브젝트로 옮긴 것이다.

#### 수정된 구조

```cs
GameObject traceObject = new($"LucidLeakTrace_{spawnedTraceCount}");
LucidLeakTraceRuntime traceRuntime = traceObject.AddComponent<LucidLeakTraceRuntime>();
traceRuntime.Initialize(...);
```

```cs
public class LucidLeakTraceRuntime : MonoBehaviour
{
    private IEnumerator PulseNoiseRoutine()
    {
        EmitLeakNoise();

        while (Time.time < destroyTime)
        {
            yield return new WaitForSeconds(noisePulseInterval);
            EmitLeakNoise();
        }
    }
}
```

---

### 2.7 테스트 수치 조정

- 대상 경로: \Enemy-DarkSpirit.prefab (line 1)\
- 대상 경로: \testCharacter.asset (line 1)\
- 대상 경로: \Player\_Yuan.prefab (line 1)\

#### 설명

먹잇감 차단 이동과 의식누출 테스트는 단순히 로직만 넣는다고 체감이 잘 보이지 않았다.

그래서 에너미 이동속도, NavMeshAgent 속도, 청각 범위와 함께 플레이어 이동속도, 질주속도, 회피속도도 테스트에 맞게 함께 조정했다.

이 작업은 구조 변경이라기보다, 새로 들어간 시스템이 플레이 감각상 제대로 드러나도록 만드는 밸런스 조정 성격이 강하다.

---

## 3. 구조 정리

이번 작업을 통해 책임은 대략 다음처럼 정리되었다.

- <code>SpawnManager</code>
  - Demo 씬/신규 씬을 가리지 않고 적 스폰 소스를 수집
  - 존 기반 스폰과 기존 포인트 기반 스폰을 함께 지원
- <code>EnemyMovement</code>
  - 추적 실행 담당
  - 직접 추적과 차단 이동을 상황에 따라 선택
- <code>EnemyInterceptPlanner</code>
  - 차단 이동 가능 여부와 예측 목적지 계산 담당
- <code>PlayerStatus</code>
  - 플레이어 체력 처리 담당
  - 루시드 낙인 컨트롤러 호출 진입점 제공
- <code>PlayerLucidMarkController</code>
  - 낙인 중첩, 지속시간, 흔적 생성 관리
- <code>LucidLeakTraceRuntime</code>
  - 흔적 오브젝트 자체의 소음 방출 처리
- <code>GlobalEventBus</code>
  - 시간 감소 요청 이벤트 전달
- <code>TimeLimitController</code>
  - 실제 남은 시간 감소 반영
- <code>NoiseManager</code>
  - 새 소음 타입 설정과 기본 반경/우선순위 관리

---

## 4. 검증 결과

현재 확인된 반영 결과는 다음과 같다.

- <code>dotnet build Assembly-CSharp.csproj</code> 기준으로 컴파일은 통과했다.
- Demo 씬 에너미 스폰 이슈는 기존 포인트 구조를 함께 읽도록 수정하는 방향으로 정리되었다.
- 먹잇감 차단 이동은 별도 예측 모듈을 통해 직접 추적과 분리되었다.
- 플레이어 피격 시 남은 시간이 5초씩 감소하도록 이벤트 연동이 추가되었다.
- 루시드 낙인은 최대 2중첩 구조로 반영되었다.
- 2중첩 상태에서는 플레이어 이동 경로에 의식누출 흔적 오브젝트가 생성되도록 구현되었다.
- 흔적 오브젝트는 자기 위치에서 <code>LucidLeak</code> 소음을 주기적으로 발생시키도록 구성되었다.

---

## 5. 결과 및 정리

이번 작업의 핵심은 크게 세 가지로 요약할 수 있다.

- Demo 씬처럼 구형 스폰포인트 구조를 쓰는 씬도 새로운 적 스폰/AI 초기화 구조와 호환되도록 정리한 것
- 적 추적을 단순 직선 추격에서 먹잇감 차단 이동이 가능한 구조로 확장한 것
- 플레이어 피격 패널티를 루시드 낙인, 시간 감소, 의식누출 흔적 소음으로 연결해 P0.5 기획에 맞는 흐름을 만든 것

즉, 이번 작업은 단순 버그 수정만이 아니라

<code>스폰 호환</code>, <code>추적 방식 확장</code>, <code>피격 패널티 시스템화</code>, <code>흔적형 소음 연동</code>

을 한 번에 정리한 기반 작업이라고 볼 수 있다.

---

## 6. 후속 작업 계획

다음 단계에서는 아래 항목을 이어서 보면 된다.

- 루시드 낙인 흔적의 시각 효과 프리팹 연결
- 의식누출 반경, 지속시간, 생성 간격 세부 튜닝
- 먹잇감 차단 이동의 예측 거리와 에너미 이동속도 추가 조정
- Demo 씬과 Patrol 씬의 실제 하이라키 연결 상태 최종 점검
- 낙인 디버그 표시나 UI 피드백 추가 여부 검토
{% endraw %}
