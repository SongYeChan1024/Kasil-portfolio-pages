---
title: "[After Seconds] 일일개발일지 — 플레이어 이동과 1인칭 시야 회전"
date: 2026-10-28 17:31:00 +0900
categories: [개발일지, After Seconds]
tags: [Unity, CSharp, InputSystem, Cinemachine, CharacterController, 의사코드]
description: "Player Input의 Unity Events를 Presenter와 연결하고, CharacterController 이동과 1인칭 시야 회전을 분리해 구현한 기록."
---

## 오늘 구현한 것

오늘은 After Seconds의 **키보드 이동과 마우스 시야 회전**을 연결했습니다. `Player Input`에서 입력을 받고, `PlayerPresenter`가 실제 이동과 회전 기능을 호출하도록 구성했습니다. 플레이 모드에서 직접 조작하며 정상 작동하는 것까지 확인했습니다.

개발 환경은 Unity **6000.4.0f1**, Input System **1.19.0**, Cinemachine **2.10.7**입니다.

![플레이어 더미와 CameraRoot, 스크립트 폴더가 보이는 실제 Unity 작업 화면](/assets/img/uploads/2026-10-28-after-seconds-unity-scene-clean.png)
_캡처는 편집 모드의 작업 화면입니다. 실제 조작 확인과 별도로 플레이어·CameraRoot·스크립트 구성을 기록했습니다._

| 구성 요소 | 구현한 역할 |
| --- | --- |
| Player Input | Move·Look 액션을 Invoke Unity Events로 전달 |
| PlayerPresenter | 입력값 보관, 시야 회전과 이동 요청 |
| PlayerMotor | CharacterController를 통한 수평 이동과 중력 처리 |
| PlayerLook | 플레이어 좌우 회전, CameraRoot 상하 회전과 각도 제한 |
| 설정 ScriptableObject | 이동 속도·중력·시야 감도·상하 각도 제한 보관 |
| Cinemachine | CameraRoot를 따라 실제 카메라 위치와 방향 적용 |

## 의사코드로 흐름을 정한 뒤 구현

기능을 바로 작성하기보다 필요한 정보, 초기화, 입력 이벤트, 매 프레임 처리, 비활성화 시 정리 순서로 의사코드를 적었습니다. 그다음 실제 C# 코드를 작성하고, 마지막으로 각 줄에 이해한 내용을 주석으로 달아 검토했습니다.

**의사코드 → 실제 구현 → 주석 작성과 검토**로 같은 코드를 세 번 살펴보는 방식입니다. 이번 글은 구현 내용을 중심으로 정리하고, 이 과정에서 배운 점은 [같은 날의 데일리 로그](/Kasil_DevLog/posts/daily-log-learning-through-pseudocode/)에 따로 적었습니다.

## Player Input과 Presenter 연결

`Player Input`의 Behavior는 **Invoke Unity Events**, Default Map은 **Player**로 설정했습니다. 이벤트는 플레이어에 붙은 Presenter의 함수에 연결합니다.

```text
Player Input
├─ Move → PlayerPresenter.OnMove
└─ Look → PlayerPresenter.OnLook

PlayerPresenter.Update
├─ PlayerLook.Rotate
└─ PlayerMotor.Move
```

`performed`에서는 이벤트의 `Vector2` 값을 읽어 보관하고, `canceled`에서는 입력값을 `(0, 0)`으로 돌립니다. Presenter가 비활성화되면 `OnDisable`에서 이동·시야 입력을 함께 초기화해 이전 입력이 남지 않도록 했습니다.

`Awake`에서는 Motor와 Look의 참조를 확보합니다. 인스펙터에서 연결하지 않았다면 같은 게임 오브젝트에서 찾고, 그래도 없으면 오류를 알린 뒤 Presenter를 비활성화하고 현재 초기화를 종료합니다.

이전에 작성했던 `PlayerInputSystem.cs`는 입력 액션을 직접 찾아 읽는 학습용 코드로 보관합니다. **현재 플레이어의 입력 경로는 Player Input 컴포넌트와 Presenter**입니다.

![OnLook 입력 처리와 Rotate 다음 Move 호출 순서에 주석을 단 Visual Studio 화면](/assets/img/uploads/2026-10-28-after-seconds-player-presenter-vs-clean.png)
_이벤트에서 받은 값을 보관하고, Update에서 회전과 이동을 요청하는 부분을 주석과 함께 다시 읽었습니다._

### 회전한 뒤 이동하도록 순서 수정

코드 리뷰에서 `Update`의 호출 순서를 정리했습니다.

```csharp
private void Update()
{
    playerLook.Rotate(lookInput);
    playerMotor.Move(moveInput, Time.deltaTime);
}
```

Motor는 플레이어의 현재 `transform.right`와 `transform.forward`로 이동 방향을 계산합니다. 이동부터 처리하면 방향을 돌리는 프레임에는 회전 전 방향으로 이동하므로, **회전 → 이동** 순서로 맞췄습니다.

이 순서는 실제 함수 호출로 결정합니다. asmdef의 AD 참조는 다른 어셈블리의 타입을 사용할 수 있게 하는 설정이며, `Awake`나 `Update`의 실행 순서를 정하는 기능은 아닙니다.

<details markdown="1">
<summary>PlayerPresenter.cs 전체 코드 펼치기</summary>

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerPresenter : MonoBehaviour
{
    #region 의사코드

    /*
    플레이어 입력을 이동과 시야 회전 기능에 연결하는 기능

    기억해둘 정보:
        PlayerMotor의 참조 — playerMotor
        PlayerLook의 참조 — playerLook
        현재 이동 입력값 — moveInput, 처음에는 (0, 0)
        현재 시야 입력값 — lookInput, 처음에는 (0, 0)

    초기화할 때 — Awake:
        인스펙터에서 연결한 PlayerMotor가 없다면:
            같은 게임 오브젝트에서 PlayerMotor를 찾아 보관한다

        그래도 PlayerMotor가 없다면:
            오류를 알리고 이 컴포넌트를 비활성화한다
            초기화를 중단한다

        인스펙터에서 연결한 PlayerLook이 없다면:
            같은 게임 오브젝트에서 PlayerLook을 찾아 보관한다

        그래도 PlayerLook이 없다면:
            오류를 알리고 이 컴포넌트를 비활성화한다
            초기화를 중단한다

    Move 입력 이벤트를 받으면 — OnMove:
        이 컴포넌트나 게임 오브젝트가 비활성화 상태라면:
            이번 이벤트 처리를 종료한다

        유효한 이동 입력이 발생하거나 입력값이 바뀌었다면 — performed:
            이벤트에서 2차원 입력값을 읽어 현재 이동 입력값으로 저장한다

        이동 입력이 취소되었다면 — canceled:
            현재 이동 입력값을 (0, 0)으로 바꾼다

    Look 입력 이벤트를 받으면 — OnLook:
        이 컴포넌트나 게임 오브젝트가 비활성화 상태라면:
            이번 이벤트 처리를 종료한다

        유효한 시야 입력이 발생하거나 입력값이 바뀌었다면 — performed:
            이벤트에서 2차원 입력값을 읽어 현재 시야 입력값으로 저장한다

        시야 입력이 취소되었다면 — canceled:
            현재 시야 입력값을 (0, 0)으로 바꾼다

    매 프레임 — Update:
        저장한 시야 입력값을 PlayerLook에 전달해 회전을 요청한다
            좌우 입력으로 플레이어 전체를 회전한다
            상하 입력으로 CameraRoot를 회전한다

        회전한 플레이어의 방향을 기준으로 이동하도록:
            저장한 이동 입력값과 이번 프레임의 경과 시간을
            PlayerMotor에 전달해 이동을 요청한다

        이동 입력이 (0, 0)이어도 중력 처리가 계속되도록
        이동 요청은 매 프레임 수행한다

    이 컴포넌트가 비활성화되면 — OnDisable:
        다시 활성화할 때 이전 입력값이 남지 않도록:
            현재 이동 입력값을 (0, 0)으로 초기화한다
            현재 시야 입력값을 (0, 0)으로 초기화한다
    */

    #endregion

    // 이동을 담당하는 Motor의 참조. 다른 클래스에서 직접 접근하지 못하도록 private으로 둔다.
    // SerializeField는 이 필드를 저장 대상으로 만들어 인스펙터에서 연결할 수 있게 한다.
    [SerializeField] private PlayerMotor playerMotor;

    [SerializeField] private PlayerLook playerLook; // 시야 회전을 담당하는 Look의 참조. 다른 클래스에서 직접 접근하지 못하도록 private으로 둔다.

    // 현재 시야 입력값을 보관한다. 처음에는 입력이 없는 (0, 0)으로 시작한다.
    // 비활성화 시 남아 있는 입력값을 지우는 처리는 이 Presenter의 OnDisable에서 수행한다.
    // PlayerLook이 초기화하는 pitchAngle은 입력값이 아니라 현재 상하 회전 각도이다.
    private Vector2 lookInput = Vector2.zero;

    // 현재 이동 입력을 보관한다. Vector2.zero는 이동 입력이 없는 (0, 0)이다.
    private Vector2 moveInput = Vector2.zero;

    // 동작을 시작하기 전에 필요한 참조 확보와 검증을 끝내기 위해
    // Start보다 앞선 초기화 단계인 Awake에서 처리한다.
    // 다른 컴포넌트의 Awake보다 먼저 실행된다는 뜻은 아니다.
    private void Awake()
    {
        if (playerMotor == null) // 인스펙터에서 연결한 Motor가 없다면 같은 오브젝트에서 찾는다.
        {
            playerMotor = GetComponent<PlayerMotor>(); // 찾은 컴포넌트의 참조를 보관한다.
        }

        if (playerMotor == null) // 같은 오브젝트에서도 Motor를 찾지 못했다면 갱신을 시작하지 않는다.
        {
            Debug.LogError("플레이어에 PlayerMotor 컴포넌트를 연결해야 합니다."); // 설정 누락을 알린다.
            // 이후 Update 호출을 막는다. 현재 실행 중인 함수를 즉시 끝내는 명령은 아니다.
            enabled = false;
            return; // Awake() 종료
        }

        if (playerLook == null) // 인스펙터에서 연결한 Look이 없다면 같은 오브젝트에서 찾는다.
        {
            playerLook = GetComponent<PlayerLook>(); // 찾은 컴포넌트의 참조를 보관한다.
        }

        if (playerLook == null) // 같은 오브젝트에서도 Look을 찾지 못했다면 갱신을 시작하지 않는다.
        {
            Debug.LogError("플레이어에 PlayerLook 컴포넌트를 연결해야 합니다."); // 설정 누락을 알린다.
            enabled = false; // 이후 Update 호출을 막는다. 현재 실행 중인 함수를 즉시 끝내는 명령은 아니다.
            return; // Awake() 종료
        }

    }

    // Player Input의 Move 입력을 처리하기 위해 만든 전용 함수.
    // context에서 이번 입력 이벤트의 상태와 값을 읽는다.
    public void OnMove(InputAction.CallbackContext context)
    {
        // 컴포넌트나 게임 오브젝트가 비활성화 상태라면 입력을 처리하지 않는다.
        if (!isActiveAndEnabled)
        {
            return; // 이번 OnMove 호출을 즉시 종료한다.
        }

        // 현재 Move 액션에서는 입력이 시작되거나 0이 아닌 입력값이 바뀔 때 발생한다.
        // 같은 입력을 유지하는 동안 매 프레임 발생하는 것은 아니다.
        if (context.performed)
        {
            moveInput = context.ReadValue<Vector2>(); // 이번 입력값을 복사해 다음 프레임에도 사용할 수 있게 보관한다.
        }
        // 키를 놓아 입력이 0으로 돌아오거나, 진행 중인 액션이 비활성화되는 등으로 취소된 경우.
        else if (context.canceled)
        {
            moveInput = Vector2.zero; // 이후 프레임에 수평 이동을 요청하지 않도록 입력을 초기화한다.
        }
    }

    public void OnLook(InputAction.CallbackContext context) // Player Input의 Look 입력을 처리하기 위해 만든 전용 함수.
                                                            // context에서 이번 입력 이벤트의 상태와 값을 읽는다.
    {
        if (!isActiveAndEnabled) // 컴포넌트나 게임 오브젝트가 비활성화 상태라면
        {
            return; // 종료
        }

        if (context.performed) // Look 액션에 유효한 입력이 발생하거나 입력값이 바뀌면
        {
            // 이벤트의 시야 입력값을 복사해 Update에서 사용할 수 있게 보관한다.
            // 실제 회전은 Update가 호출하는 PlayerLook.Rotate에서 수행한다.
            lookInput = context.ReadValue<Vector2>();
        }

        // 시야 입력값이 0으로 돌아오거나, 진행 중인 Look 액션이 비활성화되어 취소된 경우.
        else if (context.canceled)
        {
            lookInput = Vector2.zero; // 이후 프레임에 추가 회전량이 없도록 입력을 초기화한다.
        }
    }


    // 활성화된 동안 매 프레임 저장된 입력으로 시야 회전과 이동을 요청한다.
    // 성능은 변수 개수보다 매 프레임 실제로 수행하는 연산, 검색, 메모리 할당 등의 비용에 좌우된다.
    private void Update()
    {
        // 좌우 입력으로 플레이어 전체를, 상하 입력으로 CameraRoot를 먼저 회전한다.
        // Motor는 이번 프레임에 회전한 플레이어의 방향을 기준으로 이동한다.
        playerLook.Rotate(lookInput);

        // 경과 시간은 그대로 전달한다. 속도에 시간을 곱해 이동량으로 바꾸는 계산은 Motor가 담당한다.
        playerMotor.Move(moveInput, Time.deltaTime);
    }

    // 이 컴포넌트나 게임 오브젝트가 비활성화될 때 호출된다. 씬 언로드로 제거될 때도 호출된다.
    // 일시정지, 사망, 컷씬 자체가 호출 조건은 아니다. 그 처리에서 실제로 비활성화해야 호출된다.
    // canceled는 입력 액션의 취소를 처리하고, 이 함수는 컴포넌트가 꺼지는 시점의 정리를 담당한다.
    private void OnDisable()
    {
        moveInput = Vector2.zero; // 재활성화할 때 이전 입력이 남지 않도록 초기화한다.
        lookInput = Vector2.zero; // 재활성화할 때 이전 입력이 남지 않도록 초기화한다.
    }
}
```

</details>

## PlayerLook으로 좌우·상하 회전 분리

```text
Player_Dummy_V0.1    ← 좌우 회전: 월드 Y축
├─ VisualRoot
└─ CameraRoot       ← 상하 회전: 로컬 X축
```

좌우 입력에는 감도를 곱해 플레이어 전체를 회전시킵니다. 상하 입력은 `pitchAngle`에 누적하고 `Mathf.Clamp`로 각도를 제한한 뒤, `Quaternion.Euler`를 이용해 CameraRoot의 로컬 회전에 적용합니다.

플레이어 루트를 위아래로 기울이지 않으므로 수평 이동 방향에 상하 기울기가 섞이지 않습니다. 현재 CameraRoot의 시작 로컬 회전은 `(0, 0, 0)`이며, 누적 상하 각도도 0도로 초기화합니다.

이번 회전 구현은 **마우스 이동량 기준**입니다. 마우스 `delta`는 이미 이동한 양이라 감도를 곱해 회전량을 구하고, `Time.deltaTime`을 추가로 곱하지 않습니다. 게임패드 스틱은 회전 속도와 경과 시간을 기준으로 처리해야 하므로 별도 확장 대상으로 남겼습니다.

![감도 계산, 플레이어 Y축 회전, 상하 각도 제한을 주석으로 설명한 PlayerLook 코드](/assets/img/uploads/2026-10-28-after-seconds-player-look-vs-clean.png)
_실제 작성한 PlayerLook 코드와 이해를 확인하기 위해 단 주석입니다._

현재 시야 설정 에셋에는 아래 테스트 값을 입력했습니다. 확정한 조작감이 아니라 직접 움직여 보며 조정할 시작 값입니다.

| 설정 | 테스트 값 |
| --- | ---: |
| Horizontal Sensitivity | 0.1 |
| Vertical Sensitivity | 0.1 |
| Min Pitch | -80 |
| Max Pitch | 80 |

<details markdown="1">
<summary>PlayerLook.cs 전체 코드 펼치기</summary>

```csharp
using UnityEngine;

public class PlayerLook : MonoBehaviour
{
    #region 의사코드

    /*
    플레이어의 시야를 회전시키는 기능

기억해둘 정보:
    CameraRoot의 참조
    시야 설정의 참조
        좌우 마우스 감도
        상하 마우스 감도
        위아래로 볼 수 있는 최소·최대 각도

    현재 상하 회전 각도 — 처음에는 0도

초기화할 때:
    CameraRoot와 시야 설정이 연결되어 있는지 확인한다

    필요한 참조가 없다면:
        설정 오류를 알린다
        이 컴포넌트를 비활성화하고 초기화를 중단한다

시야 회전을 요청받으면:
    이 컴포넌트가 비활성화 상태라면:
        처리를 종료한다

    입력값의 X에 좌우 감도를 곱한다
    계산한 각도만큼 플레이어 전체를 Y축으로 회전시킨다

    입력값의 Y에 상하 감도를 곱한다
    계산한 각도를 현재 상하 회전 각도에서 뺀다
        마우스를 위로 움직이면 위를 바라보게 한다

    현재 상하 회전 각도를 최소·최대 각도 사이로 제한한다

    CameraRoot의 로컬 회전을 다음처럼 설정한다:
        X: 제한한 상하 회전 각도
        Y: 0도
        Z: 0도
    */

    #endregion

    [SerializeField] private Transform cameraRoot; // 상하 회전에 사용할 CameraRoot의 Transform 참조
    [SerializeField] private PlayerLookSettings settings; //PlayerLookSettings의 설정값 참조

    private float pitchAngle; // 현재 상하 회전 각도

    private void Awake()
    {
        if (cameraRoot == null || settings == null) // CameraRoot와 Settings 중 하나라도 연결되지 않았다면
        {
            Debug.LogError("PlayerLook의 CameraRoot와 Settings를 연결해 주세요.", this); // 설정 누락을 알린다

            enabled = false; // 이 컴포넌트를 비활성화한다. 현재 Awake의 실행을 끝내는 명령은 아니다.

            return; // 현재 Awake의 실행을 종료해 나머지 초기화를 중단한다.

        }

        pitchAngle = 0f; //현재 상하 회전 각도를 0도로 초기화한다

    }

    public void Rotate(Vector2 lookInput) // 마우스로 시야 회전 값이 들어올 때 이 함수를 호출한다.
    {
        if (!isActiveAndEnabled) // 이 컴포넌트가 비활성화 상태라면 (일종의 예외처리)
        {
            return; // 종료
        }
        float horizontalAngle = lookInput.x * settings.HorizontalSensitivity; // 입력값의 X에 좌우 감도를 곱한다, 쉽게 풀어서 말하면 마우스가 움직인 만큼의 좌우 회전 값을 계산한다.

        float verticalAngle = lookInput.y * settings.VerticalSensitivity;// 입력값의 Y에 상하 감도를 곱한다, 쉽게 풀어서 말하면 마우스가 움직인 만큼의 상하 회전 값을 계산한다.

        transform.Rotate(Vector3.up, horizontalAngle, Space.World); // 계산한 각도만큼 플레이어 전체를 Y축으로 회전시킨다

        pitchAngle -= verticalAngle; // 계산한 각도를 현재 상하 회전 각도에서 뺀다, 마우스를 위로 움직이면 위를 바라보게 한다, 플레이어의 입력이 반대로 작용하지 않게 해주는 기능.

        pitchAngle = Mathf.Clamp(pitchAngle, settings.MinPitch, settings.MaxPitch); // 현재 상하 회전각도의 제한이 없기 때문에
                                                                                    // 세팅에서 정한 값 만큼으로 제한하기 위해서 Mathf.Clamp() 함수를 사용한다.
                                                                                    // 현재 상하 회전 각도를 최소·최대 각도 사이로 제한한다.

        cameraRoot.localRotation = Quaternion.Euler(pitchAngle, 0f, 0f); // CameraRoot의 로컬 회전을 다음처럼 설정한다: X: 제한한 상하 회전 각도, Y: 0도, Z: 0도

    }


}
```

</details>

<details markdown="1">
<summary>PlayerLookSettings.cs 전체 코드 펼치기</summary>

```csharp
using UnityEngine;

[CreateAssetMenu(
    fileName = "PlayerLookSettings",
    menuName = "After Seconds/Player Look Settings")]
public class PlayerLookSettings : ScriptableObject
{
    [SerializeField, Min(0f)] private float horizontalSensitivity;
    [SerializeField, Min(0f)] private float verticalSensitivity;

    [SerializeField, Range(-89f, 0f)] private float minPitch;
    [SerializeField, Range(0f, 89f)] private float maxPitch;

    public float HorizontalSensitivity => horizontalSensitivity;
    public float VerticalSensitivity => verticalSensitivity;

    public float MinPitch => minPitch;
    public float MaxPitch => maxPitch;
}
```

</details>

## PlayerMotor의 이동과 중력

Motor는 이동 입력의 길이를 최대 1로 제한하고, 플레이어의 오른쪽·앞쪽 방향을 합쳐 수평 이동 방향을 구합니다. 여기에 설정 에셋의 이동 속도를 곱하고, 따로 누적한 수직 속도를 합쳐 이동량을 계산합니다.

`CharacterController.Move`에는 **이번 프레임에 이동할 거리**를 전달합니다. 이 함수가 중력을 자동 적용하지 않으므로, 수직 속도에 중력 가속도와 경과 시간을 반영하는 처리를 Motor에 작성했습니다.

이동 입력이 `(0, 0)`이어도 `Move` 요청을 매 프레임 유지합니다. 키를 누르지 않아도 중력 처리가 계속되어야 하기 때문입니다. 이동 속도는 4.6m/s, 중력 가속도 크기는 20m/s²이며 설정 에셋에서 관리합니다. 접지 유지용 수직 속도 `-2m/s`는 초기 테스트용 값입니다.

<details markdown="1">
<summary>PlayerMotor.cs 전체 코드 펼치기</summary>

```csharp
using UnityEngine;

#region 의사코드

/*
플레이어를 이동시키는 기능

기억해둘 정보:
    CharacterController의 참조
    설정에서 받은 이동 속도
    중력 가속도 ? 아래 방향이므로 음수
    현재 수직 속도
    바닥 접지를 유지하기 위한 작은 하강 속도

초기화할 때:
    플레이어의 CharacterController를 찾아 보관한다
    현재 수직 속도를 0으로 설정한다

한 프레임의 이동을 요청받으면:
    이동 입력과 경과 시간을 전달받는다

    이동 입력의 길이를 최대 1로 제한한다

    플레이어의 오른쪽 방향에 좌우 입력을 반영한다
    플레이어의 앞쪽 방향에 전후 입력을 반영한다
    두 방향을 합쳐 수평 이동 방향을 구한다

    수평 이동 방향에 이동 속도를 곱해 수평 속도를 구한다

    직전 이동에서 바닥에 닿았고, 현재 하강 중이라면:
        수직 속도를 접지 유지용 하강 속도로 조정한다

    수직 속도에 "중력 가속도 × 경과 시간"을 더한다

    수평 속도와 수직 속도를 합친다
    합친 속도에 경과 시간을 곱해 이번 이동량을 구한다

    CharacterController에 이번 이동량을 전달한다
*/

#endregion
[RequireComponent(typeof(CharacterController))]
public class PlayerMotor : MonoBehaviour
{
    [SerializeField] private PlayerMotorSettings settings;

    private CharacterController characterController;
    private float verticalVelocity;

    private void Awake()
    {
        characterController = GetComponent<CharacterController>();
        verticalVelocity = 0f;

        if (settings == null)
        {
            Debug.LogError("PlayerMotor의 Settings에 이동 설정 에셋을 연결해주세요.", this);
            enabled = false;
        }
    }

    public void Move(Vector2 moveInput, float deltaTime)
    {
        if (!isActiveAndEnabled || !characterController.enabled || deltaTime <= 0f)
        {
            return;
        }

        Vector2 limitedInput = Vector2.ClampMagnitude(moveInput, 1f);
        Vector3 moveDirection = transform.right * limitedInput.x
            + transform.forward * limitedInput.y;
        Vector3 horizontalVelocity = moveDirection * settings.MoveSpeed;

        if (characterController.isGrounded && verticalVelocity < 0f)
        {
            verticalVelocity = settings.GroundedVerticalSpeed;
        }

        verticalVelocity += settings.GravityAcceleration * deltaTime;

        Vector3 velocity = horizontalVelocity + Vector3.up * verticalVelocity;
        characterController.Move(velocity * deltaTime);
    }
}
```

</details>

<details markdown="1">
<summary>PlayerMotorSettings.cs 전체 코드 펼치기</summary>

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "PlayerMotorSettings", menuName = "After Seconds/Player Motor Settings")]
public class PlayerMotorSettings : ScriptableObject
{
    [SerializeField, Min(0f)] private float moveSpeed;
    [SerializeField, Min(0f)] private float gravity;

    [Tooltip("접지 유지를 위한 하강 속도입니다. 초기 테스트용 가안입니다.")]
    [SerializeField] private float groundedVerticalSpeed;

    public float MoveSpeed => moveSpeed;
    public float GravityAcceleration => -gravity;
    public float GroundedVerticalSpeed => groundedVerticalSpeed;
}
```

</details>

## Cinemachine 1인칭 카메라 설정

설치된 Cinemachine 2.10.7의 `Virtual Camera`를 사용했습니다. Main Camera의 Brain이 버추얼 카메라의 결과를 적용하고, 버추얼 카메라는 플레이어 아래의 CameraRoot를 따라옵니다.

| 항목 | 확인한 설정 |
| --- | --- |
| CameraRoot 로컬 위치 | `(0, 1.73, 0.1)` |
| Virtual Camera | `CM_Player_1st` |
| Follow / Look At | CameraRoot / None |
| Body | Hard Lock To Target |
| Aim | Same As Follow Target |
| Damping | 위치·회전 모두 0 |
| Field of View / Near Clip | 60 / 0.05 |
| Brain Update Method | Smart Update |

PlayerLook은 Main Camera를 직접 회전시키지 않습니다. 플레이어와 CameraRoot를 회전시키면 Cinemachine이 그 위치와 방향을 실제 카메라에 적용합니다. 눈높이와 시야각은 모델과 연출을 붙이면서 다시 조정할 수 있습니다.

## 한글 주석과 인코딩 정리

학원과 집에서 같은 코드를 읽을 수 있도록 파일 인코딩도 확인했습니다. `PlayerInputSystem.cs`만 CP949로 저장되어 있어 UTF-8로 읽으면 한글 주석이 깨져 보였습니다.

원래 인코딩인 CP949로 읽어 한글이 정상인 것을 확인한 뒤, **문자 내용을 보존해 UTF-8 BOM으로 변환**했습니다. 프로젝트의 `.editorconfig`에는 C# 파일의 저장 인코딩을 지정했습니다.

```ini
[*.cs]
charset = utf-8-bom
```

BOM은 인코딩을 식별하도록 파일 앞에 붙이는 표시입니다. Unity에서 항상 필수인 것은 아니며, 이번에는 편집기가 인코딩을 명확히 인식하도록 사용했습니다. `.editorconfig`를 지원하는 편집기에서는 프로젝트 규칙을 참고해 저장합니다.

화면에서만 잘못 보이는 상태와 이미 깨진 문자가 저장된 상태는 다릅니다. 정상 표시를 확인하기 전에 덮어쓰지 않고, 원래 인코딩으로 읽거나 정상 Git 기록에서 복구해야 합니다.

## 확인한 결과

- 플레이어의 키보드 이동과 마우스 시야 회전을 직접 조작해 정상 작동을 확인했습니다.
- CLI로 Move → OnMove, Look → OnLook 연결과 PlayerLook·설정 에셋 연결을 확인했습니다.
- Unity의 컴파일 실패 상태는 false, 현재 Console 오류·경고는 0개였습니다.
- Unity가 `PlayerInputSystem.cs`를 읽은 결과에서도 한글 의사코드와 주석이 정상이며 유니코드 대체 문자(U+FFFD)가 없는 것을 확인했습니다.
- 집 PC에서 이어갈 수 있도록 프로젝트 README에 Unity CLI 설치, 로그인, Pipeline 연결과 조회 명령을 추가했습니다.

이번 확인은 직접 조작과 컴파일·설정 조회를 기준으로 했습니다. 자동화한 게임플레이 테스트를 작성한 것은 아닙니다. 위 코드 블록은 오늘 저장된 소스를 기준으로 하며, 스크린샷은 실제 Visual Studio와 Unity 창을 캡처했습니다. 게시용 이미지에서는 마우스 포인터와 강조 표시만 정리하고 코드·주석 영역은 원본 그대로 유지했습니다.

## 다음 작업 — 2026년 10월 29일 예정

오늘 만든 이동·시야 회전을 기반으로 다음 기능을 이어갈 예정입니다.

1. **애니메이션 연결:** 사용할 모델의 리그와 클립을 확인하고 플레이어 동작에 연결합니다.
2. **점프:** 접지 상태를 확인해 점프를 시작하고 기존 중력 처리와 연결합니다.
3. **스프린트:** 입력에 따라 이동 속도를 전환하고 설정값을 분리합니다.
4. **상호작용:** 입력을 받아 대상 판별과 기능 호출을 연결하는 기본 흐름을 만듭니다.

이 네 가지는 오늘 구현한 기능이 아니라 다음 작업 계획입니다. 다음에도 의사코드로 흐름을 먼저 적고, 구현 후 직접 주석을 달아 이해한 내용이 맞는지 확인하려고 합니다.
