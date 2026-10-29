---
title: "[After Seconds] 일일개발일지 — 플레이어 리깅과 걷기 애니메이션 연결"
date: 2026-10-29 18:00:00 +0900
categories: [개발일지, After Seconds]
tags: [Unity, CSharp, Animator, 리깅, 애니메이션, 의사코드]
description: "플레이어 더미의 하체 리깅을 보정하고 입력과 Animator를 연결한 기록. Root Motion 회전 오차와 걷기 높이·속도·반복 구간 문제를 확인하고 수정했다."
---

## 오늘 구현한 것

오늘은 After Seconds의 플레이어 더미를 **리깅된 V0.3 모델로 교체하고, 이동 입력에 따라 대기와 걷기 애니메이션이 전환되도록 연결**했습니다. 연결 후에는 모델이 바닥에 묻히거나 뜨는 문제, 카메라와 몸의 방향이 어긋나는 문제, 모션이 멈췄는데 캐릭터는 계속 이동하는 문제를 순서대로 확인했습니다.

| 작업 | 현재 상태 |
| --- | --- |
| 플레이어 리깅 | 하체 관절과 스킨 인덱스를 보정한 V0.3 모델 반입 |
| 애니메이션 에셋 | 대기·걷기·달리기·점프·착지·줍기 6종 반입 및 Controller의 Motion 연결 |
| 입력 연동 | `PlayerPresenter` → `PlayerAnimationSystem` → Animator의 `IsMoving` |
| 회전 오차 | Apply Root Motion을 꺼서 모델에 추가 회전이 쌓이는 현상 해결 |
| 걷기 반복 | 출발·정지 구간을 제외하고 한 보행 주기로 설정 |
| 걷기 속도 | 실제 이동 속도와 발놀림을 비교해 테스트값 조정 |

6종의 동작 에셋을 준비했지만, **오늘 게임 입력과 연결해 확인한 범위는 대기와 걷기**입니다. 점프·스프린트·상호작용 기능은 다음 구현 대상으로 남겨 두었습니다.

![출발·정지 구간을 제외하고 반복하도록 수정한 플레이어 걷기](/assets/img/uploads/2026-10-29-after-seconds-walk-loop.gif)
_수정한 모델과 클립을 별도 Unity PreviewScene에서 제자리로 렌더한 미리보기입니다. 현재 Walk State의 재생 속도 1.5배에 맞췄으며, 실제 이동과 접지는 별도의 Play Mode 검수로 확인했습니다._

## 골반이 무너지는 리깅부터 확인

기존 더미에 걷기를 적용했을 때 골반과 하체가 무너지는 모습이 보였습니다. 기존 AI 리그에서는 고관절 역할의 `UpLeg`가 골반 중앙에 겹쳐 있었고, 다리 관절의 이름과 실제 위치도 한 단계씩 어긋나 있었습니다.

마커 리깅으로 하체를 확인할 수는 있었지만 손가락 본이 빠지는 문제가 있었습니다. 이후 손 상호작용에 사용할 가능성을 고려해, 손가락 본이 있는 리그를 바탕으로 하체를 보정한 V0.3을 준비했습니다.

이 과정에서 관절 배치 외에 **본 순서와 스킨 인덱스의 불일치**도 확인했습니다. 편집 후 출력된 파일에서 본의 순서가 달라졌는데 정점이 참조하는 본 인덱스가 그에 맞게 바뀌지 않아, 정점 4,121개가 잘못된 본의 영향을 받고 있었습니다. 본의 역할을 기준으로 스킨 인덱스를 다시 연결해 변형을 복구했습니다.

![본 순서와 스킨 인덱스가 어긋난 출력본과 인덱스를 보정한 결과 비교](/assets/img/uploads/2026-10-29-after-seconds-rig-skin-repair.jpg)
_위는 편집 후 출력본, 아래는 스킨 인덱스를 보정한 결과입니다. 같은 골격과 동작을 사용해 여러 시점의 변형을 비교한 검수 렌더입니다._

최종 모델은 **본 53개, 그중 손가락 본 30개**를 유지했습니다. 다만 본이 있다는 것만으로 손 쥐기나 독립적인 발가락 움직임이 완성되는 것은 아닙니다. 이 부분은 이후 상호작용을 만들면서 추가로 확인해야 합니다.

Humanoid Avatar의 유효성 검사와 실제 모델의 변형 확인도 함께 진행했습니다. Avatar가 유효해도 관절 배치나 스킨이 잘못되면 눈에 보이는 동작은 무너질 수 있었습니다.

## 모델과 애니메이션 리소스 정리

새 모델과 동작을 기존 파일과 구분해 보관하고, 기준 모델과 Animator 구성 리소스의 위치도 정리했습니다.

```text
Assets/Afrer_Seconds/
├─ 05.Model/Player/Rigged/Models/
│  └─ PlayerDummy_Rigged_V0.3.fbx
└─ 07.Animator/Player/
   ├─ Clips/Rigged_V0.3/
   │  ├─ Player_Idle.fbx
   │  ├─ Player_Walk.fbx
   │  ├─ Player_Run.fbx
   │  ├─ Player_Jump.fbx
   │  ├─ Player_Land.fbx
   │  └─ Player_Pickup.fbx
   └─ Controllers/
      └─ Player_Animator.controller
```

플레이어의 `VisualRoot` 아래 외형을 V0.3 모델로 교체하고, 새 Avatar와 기존 Animator Controller를 연결했습니다. Controller에 있던 상태 6개의 Motion도 새 동작으로 연결했습니다. 상태와 클립을 연결하는 작업과 실제 점프·달리기·상호작용 로직을 구현하는 작업은 구분해서 진행했습니다.

![V0.3 모델에 적용한 대기·걷기·달리기·점프·착지·줍기 후보의 정면과 측면](/assets/img/uploads/2026-10-29-after-seconds-animation-candidates.jpg)
_반입한 동작 후보들의 지정 시점 검수 렌더입니다. 각 포즈는 확인하기 편하게 따로 배치했으며, 모두 게임 기능으로 완성됐다는 의미는 아닙니다._

## 입력과 Animator 연결

이번에도 먼저 의사코드로 필요한 정보와 처리 순서를 적고, 실제 코드로 옮긴 뒤 주석을 달아 이해한 내용을 확인했습니다. **의사코드 → 실제 구현 → 주석 작성과 검토**로 같은 기능을 세 번 읽는 방식을 이어갔습니다.

새로 작성한 `PlayerAnimationSystem`은 Animator의 이동 상태를 바꾸는 역할을 맡습니다. 이동 입력이 있는지 판단하는 쪽은 Presenter이고, AnimationSystem은 전달받은 값을 Animator에 반영합니다.

```text
Player Input의 Move 이벤트
    ↓
PlayerPresenter가 이동 입력값 보관
    ↓
Update에서 입력 유무 판단
    ↓
PlayerAnimationSystem.isMove(true / false)
    ↓
Animator의 IsMoving 갱신 → 대기·걷기 전환
```

Presenter의 매 프레임 처리에는 다음 호출을 추가했습니다.

```csharp
private void Update()
{
    playerLook.Rotate(lookInput);
    playerMotor.Move(moveInput, Time.deltaTime);

    playerAnimationSystem.isMove(moveInput != Vector2.zero);
}
```

`moveInput != Vector2.zero`라는 비교 결과 자체가 `bool`이어서 그대로 전달할 수 있습니다. 현재는 실제 이동 거리가 아닌 **이동 입력의 유무**를 기준으로 하므로, 벽에 막혀도 이동 키를 누르면 걷기 상태가 됩니다.

Animator는 플레이어 부모가 아닌 `VisualRoot` 아래 모델에 있으므로, `PlayerAnimationSystem`의 인스펙터 필드에 해당 Animator를 연결했습니다. 같은 오브젝트만 찾는 `GetComponent<Animator>()`로는 자식의 Animator를 찾지 못한다는 점도 확인했습니다.

<details markdown="1">
<summary>직접 작성한 PlayerAnimationSystem 코드와 의사코드 펼치기</summary>

아래는 오늘 저장한 학습용 소스입니다. 메서드 이름 `isMove`도 현재 프로젝트에서 사용하는 이름을 유지했습니다.

```csharp
using UnityEngine;

public class PlayerAnimationSystem : MonoBehaviour
{
    #region 의사코드

    /*
    플레이어의 이동 애니메이션 상태를 전달하는 기능

    기억해둘 정보:
        새 V0.3 모델의 Animator 참조 — animator

    초기화할 때 — Awake:
        인스펙터에 Animator가 연결되어 있지 않다면:
            오류를 알린다
            이 컴포넌트를 비활성화한다
            초기화를 종료한다

        Animator의 "IsMoving"을 false로 초기화한다

    이동 상태를 전달받으면 — isMove:
        이 컴포넌트나 게임 오브젝트가 비활성화 상태라면:
            이번 요청 처리를 종료한다

        전달받은 이동 여부를
        Animator의 "IsMoving" 값으로 설정한다

    이 컴포넌트가 비활성화되면 — OnDisable:
        Animator가 연결되어 있다면:
            "IsMoving"을 false로 초기화한다
    */

    #endregion
    [SerializeField] private Animator animator; // 애니메이터 컴포넌트 참조

    private void Awake() //어웨이크
    {
        if (animator == null) //애니메이터가 없으면
        {
            animator = GetComponent<Animator>(); // 같은 오브젝트의 컴포넌트에서 Animator를 찾는다
                                                 // 근데 자식 오브젝트라서 못찾긴 한다
        }

        if (animator == null) // 그래도 애니메이터가 없으면
        {
            Debug.LogError("플레이어에 Animator 컴포넌트를 연결해야 합니다."); // 오류를 알림
            enabled = false; // 비활성화
            return; // 종료
        }
        animator.SetBool("IsMoving", false); // 애니메이터의 "IsMoving"을 false로 초기화
    }

    public void isMove(bool isMoving) // 키입력이 되서 이동 상태를 전달 받으면 실행되는 함수
    {
        if (!isActiveAndEnabled) // 이 컴포넌트나 게임 오브젝트가 비활성화 상태라면
        {
            return; // 이번 요청 처리를 종료
        }
        animator.SetBool("IsMoving", isMoving); // 전달받은 이동 여부를 Animator의 "IsMoving" 값으로 설정
    }

    private void OnDisable() // 이 컴포넌트가 비활성화되면
    {
        if (animator != null) // Animator가 연결되어 있다면
        {
            animator.SetBool("IsMoving", false); // "IsMoving"을 false로 초기화
        }
    }

}
```

</details>

Presenter가 꺼질 때는 저장한 입력을 초기화하고 `isMove(false)`를 요청합니다. AnimationSystem 자체가 꺼질 때도 `OnDisable`에서 `IsMoving`을 false로 돌려, 다시 활성화했을 때 이전 걷기 상태가 남지 않도록 했습니다.

## 카메라와 모델의 방향이 달라진 이유

걷는 동안 카메라를 돌리자 모델이 옆으로 꺾이고, 조작할수록 카메라와 몸의 방향 차이가 커지는 현상이 있었습니다.

현재 구조에서 좌우 회전은 `PlayerLook`이 부모 플레이어를 돌려 처리합니다. 카메라는 그 아래 `CameraRoot`의 회전을 따라갑니다. 그런데 모델의 Animator에 **Apply Root Motion이 켜져 있어 자식 모델에 추가 회전이 적용**되고 있었습니다.

모델 Animator의 Apply Root Motion을 끈 뒤 회전이 맞는 것을 확인했습니다. 이번 구조에서는 실제 이동은 `PlayerMotor`, 시야 회전은 `PlayerLook`이 맡도록 정리했습니다.

## 발 높이와 실제 이동 속도 맞추기

대기와 걷기 클립은 원래 발 높이가 달랐습니다. 모델의 Position Y만 올리면 한 상태는 맞아도 다른 상태에서는 발이 뜰 수 있어서, 걷기 클립의 높이 설정을 따로 보정했습니다.

재생 속도와 이동 속도도 독립적이었습니다. Animator State의 `Speed`를 바꿔도 `PlayerMotor`의 이동 속도가 자동으로 맞춰지지는 않았습니다.

이번 걷기는 제자리 동작이라 원점의 이동 거리로 보행 속도를 구하기 어려웠습니다. 발이 낮게 유지되며 뒤로 밀리는 구간의 속도와 모델 크기·재생 배율을 참고해, 실제 이동 속도를 **4.6m/s에서 1.5m/s**로 조정했습니다. Walk State의 **Speed 1.5**는 유지했습니다. 이 수치는 현재 더미와 클립을 위한 테스트값입니다.

## 걷다가 모션만 멈추는 문제

높이와 속도를 맞춘 뒤에도 걷는 도중 발이 멈췄는데 캐릭터는 계속 이동하는 문제가 남았습니다. 확인해 보니 약 7.5초의 원본 시퀀스에 **출발 대기와 정지 동작까지 포함**되어 있었습니다. Loop Time만 켜면 그 구간도 함께 반복됩니다.

계속 걷는 부분에서 시작과 끝 자세가 가까운 한 보행 주기를 골랐습니다. 원본 FBX는 보관하고, Unity importer에서 사용할 범위만 줄였습니다.

| 항목 | 최종 테스트 설정 |
| --- | --- |
| 사용 프레임 | 124~160, 30fps |
| 클립 길이 | 약 1.2초 |
| Loop Time / Loop Pose | 켬 / 켬 |
| Root Transform Position (Y) Offset | 0.227 |
| Walk State Speed | 1.5배 |
| 실제 반복 주기 | 약 0.8초 |
| PlayerMotor 이동 속도 | 1.5m/s |
| Apply Root Motion | 끔 |

처음 맞췄던 높이 Offset은 0.164였지만, 구간을 자른 뒤 높이 기준이 달라져 **0.227로 다시 보정**했습니다. 이 Offset을 그대로 월드 좌표의 미터 값으로 보는 것은 피하고, 현재 모델과 클립의 결과를 확인하며 조정했습니다.

이번에는 지정한 한 시점만 확인하는 데서 끝내지 않고, 실제로 여러 주기를 연속 재생해 출발·정지 구간이 다시 나타나지 않는지 확인했습니다.

## 확인한 결과와 남은 작업

- 실제 Play Mode에서 약 **3.30초 동안 4.13회** 걷기 주기를 반복했습니다.
- CharacterController는 측정 **51회 모두 접지 상태**였습니다.
- 수평 이동 속도는 약 **1.50m/s**, 모델에 추가된 로컬 Y축 회전은 **0도**였습니다.
- 발바닥에 해당하는 렌더 메시 최저점은 지면 기준 약 **−1.6~+4.5cm**였습니다.
- 최종 확인 시 Unity의 컴파일 실패 상태는 false였고 Console 오류·경고는 0개였습니다.

CharacterController의 접지와 눈에 보이는 발바닥의 완전한 고정은 다른 문제였습니다. 큰 높이 차이와 중간 정지 현상은 줄였지만, 미세한 발 높이 변화와 미끄러짐, 상태 전환의 자연스러움은 계속 확인해야 합니다.

다음에는 **점프·스프린트·상호작용**의 의사코드와 구현을 이어갈 예정입니다. 준비한 동작 에셋을 실제 상태에 맞게 재생하도록 연결하고, 아직 정리하지 않은 Run·Land·Pickup의 전이 조건도 기능을 구현하는 순서에 맞춰 검토하려고 합니다.

이전 작업은 [플레이어 이동과 1인칭 시야 회전 일지]({% post_url 2026-10-28-after-seconds-first-person-player-controller %})에 정리했습니다.
