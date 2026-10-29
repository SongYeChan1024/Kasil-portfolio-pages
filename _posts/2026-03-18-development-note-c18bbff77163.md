---
title: "2026-03-18_팀 모으미_프로젝트 MosAIc 진행"
date: 2026-03-18 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "에피소드별 맵·연출 작업 상황을 공유하고 음표 이펙트의 페이드와 색상 적용 문제를 정리했다."
description: "에피소드별 맵·연출 작업 상황을 공유하고 음표 이펙트의 페이드와 색상 적용 문제를 정리했다."
published: true
migration_id: "35e36532580e8193914fc18bbff77163"
migration_status: "published"
migration_flags: ["publication_review", "source_citations_preserved_in_backup"]
---

{% raw %}
<b>팀 모으미 프로젝트 MosAIc 진행 회의</b> 2026-03-18

## 요약

### 작업 진행 사항

- 에피소드 2 작업 공간 마무리 후 그림 진입 시 씬 전환 기술 구현 및 UI 배치 예정 
- 스테이지 1의 얼음 미끄럼 포즈 구현 완료, 피드백 대기 중 
- 에피소드 4 퍼즐 맵 제작 진행 중 
- 기획서 정리 작업: 매니저 제출용 문서와 개발용 플레이 문서 작업 예정 
- 스테이지 3 레벨씬 제작 예정, 완료 후 퍼즐맵 작업으로 이어질 예정 

### 다음 단계

- 팀원들은 진행 중 전파할 내용이나 이슈 발생 시 바로 공유 

## 메모

<details markdown="1">
<summary>전체 받아쓰기 펼치기</summary>


노션 AI가 이 회의를 기록하고 있습니다.

저는 일단 에피소드 2 오늘 작업 공간 마무리한 다음에 그 그림에 들어갔을 때 씬 전환하는 기술을 구현하고 그 다음 UI 배치하는 걸 하려고 합니다.

좋습니다. 다른 분들은요, 혹시?

저는 스테이지 1의 얼음 미끄럼이라고 부르더라고요. 그 포즈를 일단 구현해놨습니다. 생각보다 간단해가지고 일단 완성까진 아닌데 해놓고 이제 피드백 받고 좀 더 수정하면 될 것 같아요 에?

그리고 저는

에피소드 4의 퍼즐 맵을 일단 제작을 하고 그 다음에 저희 문서 기획서를 정리를 해서 매니저님께 제출할 문서랑 저희가 개발할 플레이 문서를 계속 작업을 할 예정이고요.

저도 이제 스테이지 3 레벨씬 한번 제작을 해보려고 하고 있거든요 제작이 다 되면은 이제 퍼즐맵까지 아마 서걱저럭 할 것 같습니다.

진행하면 될 것 같고 따로 이제 뭐 그 전파할 내용이나 그런 거 있으면 바로바로 얘기해 주시면 됩니다 네 끝!


</details>

## 기본 정보

- 날짜: 2026-03-06
- 프로젝트:
- 작성자: 작성자

## 오늘 한 일(요약)

- 스테이지 3제작에 쓰일 에셋들 찾기
- 맵 레벨 제작 이후 여러 디테일에 쓰일 소품과 스카이박스 생성

## 구현한 것

<ul>
<li></li>
</ul>

## 배운 것(개념/정리)

- 배열을 선언하고 그걸 스폰 디스폰 하는 과정을 통해 플레이어 주위에 음표(노트)들을 생성해서 이펙트 표현
- 오선지 다리를 지날때 음표들을 파티클 시스템으로 떠오르게 해서 구현

## 이슈/버그

- 내용: 플레이어 주위에 오브젝트 풀링 방식을 사용해서 노트가 주위에 떠다니는 효과를 만들 때 만들어진 노트들이 투명해서 보시이 않는 문제 발생

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NoteVisuallizer : MonoBehaviour
{
    [Header("수명")]
    [SerializeField] private float lifeTime = 2f;

    [Header("이동")]
    [SerializeField] private float floatSpeedMin = 0.3f;
    [SerializeField] private float floatSpeedMax = 0.8f;

    [Header("크기")]
    [SerializeField] private float scaleMin = 0.7f;
    [SerializeField] private float scaleMax = 1.3f;

    [Header("회전")]
    [SerializeField] private float rotSpeedMin = -20f;
    [SerializeField] private float rotSpeedMax = 20f;

    [Header("랜덤 색상 후보")]
    [SerializeField] private Color[] colors;

    private float timer;
    private float floatSpeed;
    private float rotSpeed;

    private MeshRenderer meshRenderer;
    private Material Mat;
    private Color startColor;
    private Vector3 startScale;

    private void Start()
    {
        meshRenderer = GetComponent<MeshRenderer>();
    }
    private void OnEnable()
    {

        if (meshRenderer == null)
        {
            meshRenderer = GetComponent<MeshRenderer>();
        }
        if (meshRenderer != null)
        {
            Mat = meshRenderer.material;

        }

        timer = 0f;
        // 랜덤 크기 만들기
        float randomScale = Random.Range(scaleMin , scaleMax);
        startScale = Vector3.one * randomScale;
        transform.localScale = startScale;
        // 랜덤 속도
        floatSpeed = Random.Range(floatSpeedMin, floatSpeedMax);

        // 랜덤 회전
        rotSpeed = Random.Range(rotSpeedMin, rotSpeedMax);

        // 랜덤 색상
        if (Mat != null)
        {
            if (colors != null && colors.Length > 0)
            {
                startColor = colors[Random.Range(0, colors.Length)];
            }
            else
            {
                startColor = new Color(Random.value, Random.value, Random.value);
            }
            Mat.color = startColor;
        }
    }
    private void Update()
    {
        timer += Time.deltaTime;

        // 위로 이동
        transform.Translate(Vector3.up * floatSpeed * Time.deltaTime, Space.World);
        // 회전
        transform.Rotate(Vector3.forward * rotSpeed * Time.deltaTime, Space.World);
        // 투명도 감소
        if (Mat != null)
        {
            float t = Mathf.Clamp01(timer / lifeTime);
            float alpha = Mathf.Lerp(startColor.a, 0f, t);
            Color fadeColor = new Color(startColor.r, startColor.g, startColor.b, alpha);
            Mat.color = fadeColor;
        }

        // 수명 종료 시 비활성화
        if (timer >= lifeTime)
        {
            gameObject.SetActive(false);
        }
    }
}


```

- 원인/가설: <b>색 배열 안의 알파값</b>이 문제
- 해결/시도: 베이스 컬러를 사용하여서 문제 해결시도
- 다음 액션: 상세히 주석을 달고 알파 값을 1로 고정해서 색상이 제대로 나올 수 있도록 만들고 페이드 아웃 할 때 0으로 선형 보간하여 사라지게 만들었음

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// 음표 오브젝트가
// 1. 랜덤한 색을 갖고
// 2. 랜덤한 크기를 갖고
// 3. 위로 떠오르면서 회전하다가
// 4. 서서히 투명해진 뒤
// 5. 일정 시간이 지나면 비활성화되는 역할을 하는 스크립트
public class NoteVisuallizer : MonoBehaviour
{
    [Header("수명")]
    [SerializeField] private float lifeTime = 2f;
    // 음표가 화면에 살아있는 시간
    // 예: 2초면 생성 후 2초 동안 보이다가 사라짐

    [Header("이동")]
    [SerializeField] private float floatSpeedMin = 0.3f;
    [SerializeField] private float floatSpeedMax = 0.8f;
    // 음표가 위로 떠오르는 속도의 최소값 / 최대값
    // 매번 랜덤으로 정해서 음표마다 살짝 다르게 움직이게 함

    [Header("크기")]
    [SerializeField] private float scaleMin = 0.7f;
    [SerializeField] private float scaleMax = 1.3f;
    // 음표 크기의 최소값 / 최대값
    // 생성될 때마다 랜덤 크기를 적용해서 시각적으로 다양하게 보이게 함

    [Header("회전")]
    [SerializeField] private float rotSpeedMin = -20f;
    [SerializeField] private float rotSpeedMax = 20f;
    // 회전 속도의 최소값 / 최대값
    // 음수면 반대 방향, 양수면 정방향 회전
    // 0에 가까우면 거의 안 돌고, 값이 크면 더 빨리 회전함

    [Header("랜덤 색상 후보")]
    [SerializeField] private Color[] colors;
    // 인스펙터에서 넣어줄 색상 배열
    // 여기 넣어둔 색 중 하나를 랜덤으로 골라 음표에 적용함

    // 내부 계산용 변수들
    private float timer;
    // 현재 음표가 활성화된 뒤 얼마나 시간이 흘렀는지 저장하는 변수

    private float floatSpeed;
    // 이번 음표에 실제로 적용될 위로 떠오르는 속도

    private float rotSpeed;
    // 이번 음표에 실제로 적용될 회전 속도

    private MeshRenderer meshRenderer;
    // 이 오브젝트의 MeshRenderer 컴포넌트 참조
    // 실제로 화면에 보이는 재질(Material)을 다루기 위해 필요함

    private Material noteMat;
    // meshRenderer가 가지고 있는 머터리얼 참조
    // 여기의 색을 바꾸면 음표 색이 변함

    private Color startColor;
    // 이번 음표가 시작할 때 사용할 랜덤 색
    // FadeOut 할 때도 원래 색(R,G,B)은 유지하고 알파만 줄이기 위해 저장해 둠

    private void Awake()
    {
        // Awake는 오브젝트가 생성될 때 가장 먼저 호출되는 함수 중 하나
        // 보통 "컴포넌트 참조를 미리 가져오기"에 자주 사용함

        meshRenderer = GetComponent<MeshRenderer>();
        // 현재 오브젝트에 붙어 있는 MeshRenderer를 가져옴
        // 음표 프리팹이 루트 오브젝트에 MeshRenderer를 가지고 있으므로 이 방법 사용
    }

    private void OnEnable()
    {
        // OnEnable은 오브젝트가 활성화될 때마다 호출됨
        // 풀링 오브젝트처럼 SetActive(true)로 다시 켜질 때도 호출되므로
        // "초기화" 작업을 넣기에 아주 좋음

        if (meshRenderer == null)
        {
            // 혹시 Awake에서 참조를 못 가져왔을 경우를 대비한 안전장치
            meshRenderer = GetComponent<MeshRenderer>();
        }

        if (meshRenderer != null)
        {
            // renderer.material은 이 오브젝트 전용 머터리얼 인스턴스를 다루게 됨
            // 즉, 다른 음표와 색이 섞이지 않고 개별적으로 색을 바꿀 수 있음
            noteMat = meshRenderer.material;
        }

        // 시간이 처음부터 다시 흐르도록 타이머 초기화
        timer = 0f;

        // 랜덤한 크기를 생성
        float randomScale = Random.Range(scaleMin, scaleMax);

        // Vector3.one은 (1,1,1)
        // 여기에 randomScale을 곱하면 (랜덤값, 랜덤값, 랜덤값)
        // 즉 x,y,z가 같은 비율로 커지거나 작아지는 균일 스케일이 됨
        transform.localScale = Vector3.one * randomScale;

        // 위로 떠오르는 속도를 랜덤으로 결정
        floatSpeed = Random.Range(floatSpeedMin, floatSpeedMax);

        // 회전 속도도 랜덤으로 결정
        rotSpeed = Random.Range(rotSpeedMin, rotSpeedMax);

        // 색상도 매번 랜덤으로 다시 세팅
        SetRandomColor();
    }

    private void Update()
    {
        // Update는 매 프레임마다 호출됨
        // 이 안에서 시간 누적, 이동, 회전, 투명도 감소를 처리함

        timer += Time.deltaTime;
        // Time.deltaTime은 "지난 프레임부터 지금까지 흐른 시간"
        // 이 값을 누적하면 활성화된 뒤 총 경과 시간을 구할 수 있음

        // 위로 떠오르기
        transform.Translate(Vector3.up * floatSpeed * Time.deltaTime, Space.World);
        // Vector3.up = (0,1,0), 즉 월드 기준 위쪽 방향
        // floatSpeed 만큼 위로 이동
        // deltaTime을 곱해서 프레임 수와 관계없이 일정한 속도로 움직이게 함
        // Space.World는 월드 좌표 기준으로 움직인다는 뜻
        // 오브젝트가 회전해도 "항상 위쪽"으로 떠오르게 됨

        // 회전하기
        transform.Rotate(Vector3.forward * rotSpeed * Time.deltaTime, Space.World);
        // Vector3.forward = (0,0,1), 즉 z축 방향 회전
        // rotSpeed 만큼 계속 회전시킴
        // 음수면 반대 방향으로 회전

        // 시간이 지날수록 점점 투명해지도록 처리
        FadeOut();

        // 생명 시간이 끝났다면 오브젝트를 비활성화
        if (timer >= lifeTime)
        {
            gameObject.SetActive(false);
            // Destroy가 아니라 SetActive(false)를 쓰면
            // 오브젝트 풀링 구조에서 다시 재사용할 수 있음
        }
    }

    private void SetRandomColor()
    {
        // 머터리얼이 없으면 색을 바꿀 수 없으므로 종료
        if (noteMat == null) return;

        // 인스펙터에 색 배열이 정상적으로 들어있다면
        if (colors != null && colors.Length > 0)
        {
            // 배열 안에서 랜덤한 인덱스 하나를 골라 시작 색상으로 사용
            startColor = colors[Random.Range(0, colors.Length)];
        }
        else
        {
            // 만약 배열이 비어 있다면 완전 랜덤 색을 만들어 사용
            // Random.value는 0~1 사이의 실수값을 반환
            startColor = new Color(Random.value, Random.value, Random.value, 1f);
        }

        // 혹시 인스펙터에서 색의 알파값(A)이 0으로 들어가 있으면
        // 시작부터 안 보일 수 있으므로 알파는 강제로 1(불투명)로 고정
        startColor.a = 1f;

        // 실제 머터리얼에 색을 적용
        ApplyColor(startColor);

        // 디버그 확인용
        // 콘솔에서 어떤 색이 선택됐는지 확인 가능
        Debug.Log($"{gameObject.name} 선택된 색상: {startColor}");
    }

    private void FadeOut()
    {
        // 머터리얼이 없으면 아무것도 할 수 없으므로 종료
        if (noteMat == null) return;

        // 현재 시간이 전체 수명에서 얼마나 진행됐는지 0~1 사이 값으로 계산
        float t = Mathf.Clamp01(timer / lifeTime);
        // 예:
        // timer = 0 이면 t = 0
        // timer = lifeTime / 2 이면 t = 0.5
        // timer >= lifeTime 이면 t = 1

        // 알파값을 1 -> 0 으로 선형 보간
        float alpha = Mathf.Lerp(1f, 0f, t);
        // t가 0이면 alpha = 1 (완전히 보임)
        // t가 1이면 alpha = 0 (완전히 투명)

        // 원래의 RGB 색상은 유지하고 알파만 줄인 새 색상 생성
        Color fadeColor = new Color(startColor.r, startColor.g, startColor.b, alpha);

        // 머터리얼에 최종 색 적용
        ApplyColor(fadeColor);
    }

    private void ApplyColor(Color color)
    {
        // 머터리얼이 없으면 처리 불가
        if (noteMat == null) return;

        // URP 머터리얼은 보통 _BaseColor 프로퍼티를 사용함
        if (noteMat.HasProperty("_BaseColor"))
        {
            noteMat.SetColor("_BaseColor", color);
        }
        // 혹시 다른 셰이더를 쓴다면 _Color를 사용할 수도 있음
        else if (noteMat.HasProperty("_Color"))
        {
            noteMat.SetColor("_Color", color);
        }
        else
        {
            // 둘 다 없다면 해당 셰이더는 색상 프로퍼티 이름이 다른 것
            Debug.LogWarning($"{gameObject.name}의 머터리얼에서 색상 프로퍼티를 찾지 못했습니다.");
        }
    }
}
```

## 내일 할 일

- 맵 마저 제작
- 펴즐 요소들을 어떠헥 구현할지 시스템 정리
- 퍼즐에 대한 기본적인 원리 생성 이후 구현

## 참고 링크/자료

- 파티클 시스템에 콜라이더를 붙여서 플레이어가 지나갈때만 파티클이 나오도록 구현

![첨부 자료](/assets/img/uploads/notion/4ee66c27c0f0dc36dff7abea4db22cfec232b0c5b3fca14765e707f5b62416fb.png)

```cs
using UnityEngine;

public class PopNotes : MonoBehaviour
{
    [SerializeField] private ParticleSystem noteParticle;
    private BoxCollider boxCol;

    private void Start()
    {
        if (noteParticle == null)
            noteParticle = GetComponentInChildren<ParticleSystem>();

        if (noteParticle != null)
            noteParticle.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

        boxCol = GetComponent<BoxCollider>();
    }

    private void OnTriggerEnter(Collider col)
    {
        if (col.CompareTag("Player"))
        {
            if (noteParticle != null)
                noteParticle.Play();

            Debug.Log("플레이어 들어옴!");
        }
    }

    private void OnTriggerExit(Collider col)
    {
        if (col.CompareTag("Player"))
        {
            if (noteParticle != null)
                noteParticle.Stop(true, ParticleSystemStopBehavior.StopEmitting);

            Debug.Log("플레이어 나감!");
        }
    }
}
```

![첨부 자료](/assets/img/uploads/notion/1f24ddc5a07096c41bed540bc809ec2090bb0ab0d5a8feb1a8e433ab3659cd30.png)

![첨부 자료](/assets/img/uploads/notion/f3fcd6a912f2292b61aab89fa63bc3e905d6b48940dce26a5e3a90ec7586992e.png)

![첨부 자료](/assets/img/uploads/notion/62bd98546f195d790d982dc9e8314cf5edf18240cc5c8b020f09533c64ab9f70.png)

<details markdown="1">
<summary>첨부/스크린샷(선택)</summary>

<ul>
<li></li>
</ul>

</details>

<details markdown="1">
<summary>회고(선택)</summary>

- 잘한 점:
- 아쉬운 점:
- 내일 개선:

</details>
{% endraw %}
