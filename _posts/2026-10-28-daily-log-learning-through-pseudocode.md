---
title: "[데일리 로그] 같은 코드를 세 번 읽으며 기본기를 쌓다"
date: 2026-10-28 17:30:00 +0900
categories: [데일리 로그]
tags: [Unity, CSharp, 의사코드, 학습기록]
---

오늘은 After Seconds의 플레이어 이동과 1인칭 카메라를 연결했다. 직접 움직이고 마우스로 시점을 돌리는 것까지 확인하니, 앞으로 게임 기능을 붙여 나갈 출발점이 생겼다.

이번에는 바로 코드를 쓰지 않았다. 먼저 **의사코드로 필요한 정보와 처리 순서를 정리하고, 실제 C# 코드로 옮긴 뒤, 각 줄에 내가 이해한 내용을 주석으로 적고 검토했다.** 같은 코드를 세 번 살펴보는 방식이다. 한 번에 이해했다고 넘겼을 부분도 주석으로 설명하려고 하니 다시 생각하게 됐다. 시간이 조금 더 걸려도 이렇게 기본기를 쌓아 가는 방식이 좋다.

![Visual Studio에서 PlayerPresenter의 입력·이동·시야 회전 연결 의사코드를 정리한 화면](/Kasil_DevLog/assets/img/uploads/2026-10-28-after-seconds-pseudocode-vs.jpg)
_코드를 쓰기 전에 필요한 참조와 시야 회전의 처리 순서를 문장으로 정리했다._

입력을 받는 것과 실제로 움직이는 것을 나눠 보면서 역할도 조금씩 구분됐다. Player Input의 Invoke Unity Events로 입력을 전달하고, Presenter가 연결하고, Motor가 이동을 처리한다. 시야 회전은 PlayerLook이 맡는다. 기능이 작을 때부터 누가 무엇을 담당하는지 생각해 보는 연습이 됐다.

카메라도 좌우와 위아래 회전을 나눠 생각하니 이해하기 쉬웠다. 좌우로 볼 때는 플레이어 전체를 돌리고, 위아래로 볼 때는 CameraRoot만 돌린다. 상하 각도를 제한하는 `Mathf.Clamp`도 단순히 외울 함수가 아니라, 시야가 계속 뒤집히지 않게 하는 처리로 연결해서 볼 수 있었다. 이동량에는 `Time.deltaTime`을 곱하지만, 이미 마우스가 움직인 양을 나타내는 delta에는 같은 방식으로 곱하지 않는다는 차이도 확인했다.

![Visual Studio에서 PlayerLook의 실제 회전 코드와 직접 작성한 주석을 확인하는 화면](/Kasil_DevLog/assets/img/uploads/2026-10-28-after-seconds-player-look-vs.jpg)
_실제 코드로 옮긴 뒤에는 각 줄이 하는 일을 내 말로 적고 다시 확인했다._

<details markdown="1">
<summary>오늘 살펴본 PlayerLook.Rotate 코드 펼치기</summary>

현재 작성한 함수에서 주석을 생략한 부분이다. 입력값을 바로 회전에 넣는 것이 아니라 감도를 반영하고, 상하 각도는 따로 보관하면서 제한한다는 흐름을 읽어 봤다.

```csharp
public void Rotate(Vector2 lookInput)
{
    if (!isActiveAndEnabled)
    {
        return;
    }

    float horizontalAngle = lookInput.x * settings.HorizontalSensitivity;
    float verticalAngle = lookInput.y * settings.VerticalSensitivity;

    transform.Rotate(Vector3.up, horizontalAngle, Space.World);

    pitchAngle -= verticalAngle;
    pitchAngle = Mathf.Clamp(pitchAngle, settings.MinPitch, settings.MaxPitch);

    cameraRoot.localRotation = Quaternion.Euler(pitchAngle, 0f, 0f);
}
```

설정 과정과 전체 소스는 함께 작성한 [After Seconds 일일개발일지](/Kasil_DevLog/posts/after-seconds-first-person-player-controller/)에 정리했다.

</details>

알고 있다고 생각했던 부분도 다시 확인했다. `Awake`에 적었다고 다른 컴포넌트보다 반드시 먼저 실행되는 것은 아니고, AD의 참조 관계도 실행 순서를 정해 주는 것은 아니었다. 입력이 취소되는 `canceled`와 컴포넌트가 꺼지는 `OnDisable`도 결과가 비슷해 보여도 필요한 상황이 달랐다. 주석을 직접 적지 않았다면 이런 차이를 그냥 넘겼을 것 같다.

UTF-8과 CP949처럼 코드 바깥의 문자 인코딩도 확인해야 한다는 걸 배웠다. 기능이 동작하는지만 보는 것에서 조금 더 나아가, 코드와 주석이 제대로 읽히는지도 살펴보게 됐다.

내일인 **10월 29일에는 애니메이션 연결과 점프, 스프린트(달리기), 상호작용**을 이어서 작업하려고 한다. 이 기능들은 아직 오늘 구현한 내용이 아니다. 다음에도 의사코드로 먼저 풀어 보고, 실제로 작성한 코드와 내가 단 주석까지 설명할 수 있는지 확인하면서 만들어 가려고 한다.
