---
title: "코드 변경 사항 기록"
date: 2026-06-23 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "플레이어가 항상 마우스 커서를 바라보도록 회전 구조를 바꾸고, 관련 코드 변경 이유와 동작을 정리했다."
description: "플레이어가 항상 마우스 커서를 바라보도록 회전 구조를 바꾸고, 관련 코드 변경 이유와 동작을 정리했다."
published: true
migration_id: "38836532580e80db8cd8e09713a7f453"
migration_status: "published"
migration_flags: ["local_code_link_unlinked"]
---

{% raw %}
```cs
/// <summary>
/// 플레이어의 이동을 처리하는 스크립트
/// </summary>
using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
[Header("Player Movement Controll")]
[SerializeField] private Rigidbody rb;
[SerializeField] private Camera mainCamera;
private Vector2 movementInput;                      // 플레이어의 움직임 입력
private readonly float isometricYAngle = -45.0f;    // 카메라가 보는 각도에 맞춰 플레이어 이동 방향 보정 (45도)
public float moveSpeed = 7f;                        // 움직임 속도
public float rotationSpeed = 10f;                   // 회전 속도
[Header("Player Attack Movement Controll")]
private Vector2 currentMousePos;                    // 현재 2차원상의 마우스 위치
//private float attackFocusTimer = 0f;                // 공격에 집중하는 시간 타이머
private readonly float attackFocusDuration = 0.5f;  // 공격에 집중하는 시간 딜레이 (마우스를 바라보는 시간)

[Header("Player Animation Controll")]
private Animator animator;

private void Awake()
{
    rb = GetComponent<Rigidbody>();
    animator = GetComponent<Animator>();

    // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
    if(rb==null || animator==null)
    {
        this.enabled = false;
        Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
        return;
    }
}

private void OnEnable()
{
    /// 이벤트 구독 ///
    GlobalEventBus.OnPlayerMove += PlayerMove;
    GlobalEventBus.OnAttackInput += OnAttack;
    GlobalEventBus.OnMousePositionInput += UpdateMousePos;
}

private void OnDisable()
{
    /// 이벤트 구독 해제 ///
    GlobalEventBus.OnPlayerMove -= PlayerMove;
    GlobalEventBus.OnAttackInput -= OnAttack;
    GlobalEventBus.OnMousePositionInput -= UpdateMousePos;
}

/* 플레이어 이동 값을 받아 전달 */
private void PlayerMove(Vector2 input) => movementInput = input;
/* 마우스 위치값을 받아 전달 */
private void UpdateMousePos(Vector2 pos) => currentMousePos = pos;
/* 공격 시 타이머를 가동시켜 회전 우선순위 전환 */
private void OnAttack()
{
    attackFocusTimer = attackFocusDuration;
}

private void FixedUpdate()
{
    GetMove();
}

/* 플레이어 이동 및 회전 처리 */
private void GetMove()
{
    /// 이동 처리 ///
    // input system의 입력 값으로 평면상의 기본 벡터 생성
    Vector3 inputDir = new Vector3(movementInput.x, 0f, movementInput.y);
    // Y축을 기준으로 일정 각도 회전하는 수학적 행렬(Quaternion) 생성
    Quaternion isoRotation = Quaternion.Euler(0f, isometricYAngle, 0f);
    // 기본 입력 벡터를 일정 각도 회전시켜 쿼터뷰 화면에 맞게 보정
    // 주의: 반드시 Quaternion이 앞에 와야 합니다.
    Vector3 movement = isoRotation * inputDir;
    // 벡터 길이 정규화
    movement = movement.normalized;

    // 물리 엔진을 이용해 최종 이동
    Vector3 targetPosition = rb.position + movement * moveSpeed * Time.fixedDeltaTime;
    rb.MovePosition(targetPosition);

    /// 회전 처리 ///
    // 공격 시의 회전을 우선 순위로 처리
    if(attackFocusTimer > 0)
    {
        attackFocusTimer -= Time.fixedDeltaTime;
        AimTowardsMouse();
    }
    // 이후 이동 시 회전에 대한 로직 처리
    else if(movement != Vector3.zero)
    {
        // 이동하고자 하는 방향을 바라보는 목표 회전 각도를 계산
        Quaternion targetRotation = Quaternion.LookRotation(movement);
        // 목표 각도까지 부드럽게 보간(Slerp)
        Quaternion smoothRotation = Quaternion.Slerp(rb.rotation, targetRotation, rotationSpeed * Time.fixedDeltaTime);
        // 물리 엔진을 이용해 최종적으로 회전을 적용
        rb.MoveRotation(smoothRotation);
    }
}
private bool TryGetMouseWorldPoint(out Vector3 worldPoint)
{
    Plane plane = new Plane(Vector3.up, transform.position);
    Ray ray = mainCamera.ScreenPointToRay(currentMousePos);

    if (plane.Raycast(ray, out float enter))
    {
        worldPoint = ray.GetPoint(enter);
        return true;
    }

    worldPoint = Vector3.zero;
    return false;
}

private void AimTowardsMouse()
{
    if (!TryGetMouseWorldPoint(out Vector3 worldPoint)) return;

    Vector3 dir = worldPoint - transform.position;
    dir.y = 0f;
    if (dir.sqrMagnitude < 0.001f) return;

    Quaternion targetRot = Quaternion.LookRotation(dir.normalized);
    rb.MoveRotation(Quaternion.Slerp(rb.rotation, targetRot, rotationSpeed * Time.fixedDeltaTime));
}
/*private void AimTowardsMouse()
{
    Plane playerPlane = new Plane(Vector3.up, transform.position);
    Ray ray = mainCamera.ScreenPointToRay(currentMousePos);

    if(playerPlane.Raycast(ray, out float hit))
    {
        Vector3 hitPosition = ray.GetPoint(hit);
        Vector3 aimDirection = hitPosition - transform.position;
        aimDirection.y = 0f;

        if (aimDirection.sqrMagnitude > 0.01f)
        {
            Quaternion targetRotation = Quaternion.LookRotation(aimDirection);
            rb.MoveRotation(Quaternion.Slerp(rb.rotation, targetRotation, rotationSpeed * Time.fixedDeltaTime));
        }
    }
}*/
}
```

<b>핵심 변화</b>

우리가 바꾼 방향은 “공격할 때만 커서를 보는 플레이어”에서 “항상 커서를 보는 플레이어”로 바꾼 것이다. 기준 파일은 \PlayerMovement.cs\이다.

이전 구조:

- 이동은 항상 됨
- 회전은 평소엔 <code>이동 방향</code>을 봄
- 공격 입력이 들어온 뒤 <code>0.5초</code> 동안만 <code>마우스 방향</code>을 봄
- 그래서 발사 직전엔 커서를 봐도, 평소엔 캐릭터가 이동 방향으로 돌아감

우리가 바꾼 구조는 이것이다.

- 이동은 그대로 유지
- 회전 기준만 <code>항상 마우스 커서 방향</code>으로 통일
- <code>OnAttack()</code>, <code>attackFocusTimer</code>, <code>attackFocusDuration</code> 같은 “공격 시 회전 우선순위” 개념 제거
- 이동 방향 회전 분기도 제거

즉, 회전 로직을 단순화 했다.

“지금 커서가 가리키는 위치를 본다” 하나만 남긴 것.

---

<b>어디를 어떻게 고쳤는지</b>

1. 공격 전용 회전 로직을 없앰.
   <p>
   기존에는 공격 입력을 받으면 <code>attackFocusTimer</code>를 켜고, 그 시간 동안만 <code>AimTowardsMouse()</code>를 실행했는데, 이 부분이 없어짐.
   </p>
2. 이벤트 구독도 단순해짐.
   <p>
   이제 <code>OnAttackInput</code>은 <code>PlayerMovement</code>에서 안 받아도 됨.
   </p>

   <p>
   남는 건:
   </p>

   - <code>OnPlayerMove</code>
   - <code>OnMousePositionInput</code>
3. 회전 분기를 없앰.기존엔 대충 이런 구조

```txt
if (attackFocusTimer > 0)
{
    AimTowardsMouse();
}
else if (movement != Vector3.zero)
{
    이동 방향 회전
}
```

이걸 이렇게 바꾸는 것.

```txt
이동 처리
AimTowardsMouse();
```

즉, 이동과 회전을 따로 경쟁시키지 않고,

이동은 이동대로 하고 회전은 무조건 커서 기준으로 감

---

<b>움직임이 어떻게 동작하는지</b>

이 스크립트는 실제로 2가지 일을 함

1. 이동
2. 회전

이동은 이렇게 됨

- 입력 <code>WASD</code>를 <code>Vector2</code>로 받음
- 그걸 <code>Vector3(x, 0, z)</code>로 바꿈
- <code>45도</code> 쿼터뷰 보정값을 곱해서 카메라 시점에 맞는 방향으로 변환
- <code>normalized</code> 해서 대각선 이동이 더 빨라지지 않게 막음
- <code>Rigidbody.MovePosition()</code>으로 실제 이동

즉, <code>W</code>를 누르면 월드 북쪽으로 가는 게 아니라,

지금 카메라 쿼터뷰 기준 “위쪽”으로 가게 보정하는 방식.

회전은 이렇게 됨

- 마우스는 2D 화면 좌표라서 바로 월드 방향이 아님
- 그래서 <code>mainCamera.ScreenPointToRay(currentMousePos)</code>로 카메라에서 마우스를 통과하는 광선을 만듦
- 플레이어 높이에 수평인 가상의 바닥 평면을 하나 만듦
- 그 광선이 그 평면과 만나는 지점을 구함
- <code>플레이어 위치 -&gt; 그 지점</code> 방향 벡터를 만듦
- <code>y</code>를 0으로 만들어서 위아래 기울지 않게 함
- <code>Quaternion.LookRotation()</code>으로 목표 회전 계산
- <code>Quaternion.Slerp()</code>로 부드럽게 회전
- <code>Rigidbody.MoveRotation()</code>으로 적용

이 방식의 장점은 명확함

- 커서가 가리키는 쪽을 항상 봄
- 총구 방향과 플레이어 시선 방향을 맞추기 쉬움
- 히트스캔이든 투사체든 둘 다 연결하기 편함

```txt
/// <summary>
/// 플레이어의 이동과 커서 방향 회전을 처리하는 스크립트
/// </summary>
using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
[Header("Player Movement Controll")]
[SerializeField] private Rigidbody rb;
[SerializeField] private Camera mainCamera;
private Vector2 movementInput;                       // 플레이어의 이동 입력
private Vector2 currentMousePos;                    // 현재 마우스 화면 좌표

private readonly float isometricYAngle = -45.0f;    // 쿼터뷰 기준 이동 방향 보정
public float moveSpeed = 7f;                        // 이동 속도
public float rotationSpeed = 10f;                   // 회전 속도

[Header("Player Animation Controll")]
private Animator animator;

private void Awake()
{
    rb = GetComponent<Rigidbody>();
    animator = GetComponent<Animator>();

    // 필수 컴포넌트가 없으면 비활성화
    if (rb == null || animator == null || mainCamera == null)
    {
        enabled = false;
        Debug.LogError("PlayerMovement: 필요한 컴포넌트가 없습니다.");
        return;
    }
}

private void OnEnable()
{
    GlobalEventBus.OnPlayerMove += PlayerMove;
    GlobalEventBus.OnMousePositionInput += UpdateMousePos;
}

private void OnDisable()
{
    GlobalEventBus.OnPlayerMove -= PlayerMove;
    GlobalEventBus.OnMousePositionInput -= UpdateMousePos;
}

private void FixedUpdate()
{
    MoveAndRotate();
}

/* 플레이어 이동 입력 갱신 */
private void PlayerMove(Vector2 input) => movementInput = input;

/* 마우스 화면 좌표 갱신 */
private void UpdateMousePos(Vector2 pos) => currentMousePos = pos;

/* 이동과 회전 처리 */
private void MoveAndRotate()
{
    Vector3 inputDir = new Vector3(movementInput.x, 0f, movementInput.y);
    Quaternion isoRotation = Quaternion.Euler(0f, isometricYAngle, 0f);
    Vector3 movement = (isoRotation * inputDir).normalized;

    Vector3 targetPosition = rb.position + movement * moveSpeed * Time.fixedDeltaTime;
    rb.MovePosition(targetPosition);

    AimTowardsMouse();
}

/* 마우스 커서가 가리키는 월드 위치 계산 */
private bool TryGetMouseWorldPoint(out Vector3 worldPoint)
{
    Plane plane = new Plane(Vector3.up, transform.position);
    Ray ray = mainCamera.ScreenPointToRay(currentMousePos);

    if (plane.Raycast(ray, out float enter))
    {
        worldPoint = ray.GetPoint(enter);
        return true;
    }

    worldPoint = Vector3.zero;
    return false;
}

/* 항상 마우스 커서 방향을 바라보도록 회전 */
private void AimTowardsMouse()
{
    if (!TryGetMouseWorldPoint(out Vector3 worldPoint))
        return;

    Vector3 dir = worldPoint - transform.position;
    dir.y = 0f;

    if (dir.sqrMagnitude < 0.001f)
        return;

    Quaternion targetRot = Quaternion.LookRotation(dir.normalized);
    Quaternion smoothRot = Quaternion.Slerp(rb.rotation, targetRot, rotationSpeed * Time.fixedDeltaTime);
    rb.MoveRotation(smoothRot);
}
}
```

무기 총알 발사 히트스캔으로 구현

```txt
/// <summary>
/// 플레이어의 무기 장착 및 공격 실행에 대한 스크립트
/// </summary>
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class PlayerWeapon : MonoBehaviour
{
[Header("Equip Weapon")]
[SerializeField] private WeaponItemData weaponData;     // 장착된 무기의 데이터
[SerializeField] private Transform handPos;             // 무기가 장착되는 손 위치
[SerializeField] private Transform firePoint;           // 총알이 발사되는 위치
public bool isEquipped => weaponData != null;           // 무기가 장착되어 있는지 여부
public float nowUseMana => weaponData.useMana;          // 현재 무기가 소모하는 마나량
private GameObject currentWeaponInstance;               // 현재 장착 중인 무기 오브젝트
// 임시로 무기 데이터를 설정하기 위한 프리팹 참조
public GameObject weaponPrefab;
public GameObject bulletPrefab;
public GameObject bulletPool;


private void Awake()
{
    weaponData = null;    // 무기가 장착되어 있지 않음
}

/* 플레이어 공격 처리 */
public void PlayerAttack()
{
    // 공격 신호 시 총알 발사
    // 이후 무기에 따른 공격 패턴의 분리, 발사체 및 이펙트 생성 시 오브젝트 풀링 적용
    GameObject currentBulletObject = Instantiate(bulletPrefab, handPos.transform.position, handPos.transform.rotation, bulletPool.transform);
    // 무기의 스텟에 따라 발사체의 스텟 전달
    ProjectileSystem bulletSystem = currentBulletObject.GetComponent<ProjectileSystem>();
    if(bulletSystem!=null)
    {
        bulletSystem.Setup(weaponData.AtkValue, Faction.player, weaponData.fireRange, weaponData.fireRange);
    }
}

public void EquipWeapon(WeaponItemData weaponItemData)
{
    // weaponItemData를 통해 무기 데이터를 불러옴
    weaponData = weaponItemData;

    // 무기 프리팹 주소가 비어 있을 시 실패
    if(!weaponData.itemPrefabRef.RuntimeKeyIsValid()) return;
    // Addressble을 통해 비동기로 무기를 소환, 손 위치에 부착함
    Addressables.InstantiateAsync(weaponData.itemPrefabRef, handPos).Completed += OnWeaponLoaded;
}

/* Addressables을 통한 로딩 완료 시 실행되는 콜백 함수 */
private void OnWeaponLoaded(AsyncOperationHandle<GameObject> handle)
{
    // 데이터 로딩에 성공 했다면 생성된 무기 오브젝트를 저장하고 장착 상태로 전환
    if(handle.Status == AsyncOperationStatus.Succeeded)
    {
        // 로딩에 성공했다면, 생성된 무기 오브젝트를 변수에 저장하고 장착 상태를 켭니다.
        currentWeaponInstance = handle.Result;

        // 프리팹의 로컬 위치와 회전을 0으로 맞춰서 정렬
        currentWeaponInstance.transform.localPosition = Vector3.zero;
        currentWeaponInstance.transform.localRotation = Quaternion.identity;
    }
    else
    {
        Debug.LogError("무기 장착에 실패했습니다.");
    }
}
}
```

<b>전체 역할</b>

이 스크립트는 크게 4개 맡고 있음.

- 무기 데이터 들고 있기
- 무기 모델 장착하기
- 총 발사 판정하기
- 발사 궤적을 잠깐 보여주기

즉 지금 <code>PlayerWeapon</code>은 “총알 프리팹을 날리는 스크립트”가 아니라, “무기 장착 + 히트스캔 판정 + 궤적 연출” 스크립트가 됨.

<b>필드가 의미하는 것</b>

- <code>weaponData</code>현재 장착한 무기 데이터임. 공격력, 사거리, 마나 소모량 같은 값이 여기 들어있음.
- <code>handPos</code>무기 모델이 붙는 위치임.
- <code>firePoint</code>실제 발사 시작점임. 레이캐스트 시작도 여기서 함.
- <code>hitMask</code>어떤 레이어를 맞출지 정하는 마스크임. 보통 <code>Enemy</code>, <code>Wall</code> 넣으면 됨.
- <code>showShotTrace</code>궤적 보일지 말지 인스펙터에서 켜고 끄는 토글임.
- <code>shotTraceRenderer</code>선을 그리는 <code>LineRenderer</code> 참조임.
- <code>shotTraceDuration</code>궤적이 몇 초 동안 보일지 정하는 값임.
- <code>hitTraceColor</code>뭔가 맞았을 때 궤적 색. 지금 흰색임.
- <code>missTraceColor</code>아무것도 안 맞았을 때 궤적 색. 지금 빨간색임.

<b>Awake / OnDisable</b>

여기서 하는 일은 초기화랑 정리임.

- <code>weaponData = null</code>시작할 때 무기 안 든 상태로 시작함.
- <code>shotTraceWait = new WaitForSeconds(shotTraceDuration)</code>이게 이번에 추가한 캐싱 부분임. 매번 새로 <code>WaitForSeconds</code> 만들지 않고 한 번 만들어서 재사용함.
- <code>HideShotTrace()</code>시작할 때 선이 켜져 있지 않게 정리함.
- <code>OnDisable()</code>코루틴이 돌고 있으면 끊고, 선도 꺼버림.

즉 궤적 관련 찌꺼기가 남지 않게 해둔 거임.

<b>공격 처리</b>

핵심은 \PlayerWeapon.cs (line 46)\ <code>PlayerAttack()</code>임.

흐름은 이거임.

- <code>weaponData</code>나 <code>firePoint</code> 없으면 바로 종료
- <code>origin = firePoint.position</code>
- <code>direction = firePoint.forward</code>
- 일단 기본 끝점은 <code>최대 사거리 끝</code>으로 잡음
- 기본 색은 <code>빗나감 색(빨강)</code>으로 잡음
- <code>Physics.Raycast()</code> 쏨
- 맞았으면
  - 끝점을 <code>hit.point</code>로 바꿈
  - 색을 <code>hitTraceColor(흰색)</code>로 바꿈
  - <code>IDamageable</code> 찾음
  - 적 진영이면 <code>TakeDamage(weaponData.AtkValue)</code> 호출
- 마지막에 <code>ShowShotTrace(origin, endPoint, traceColor)</code> 호출

중요한 점은 지금 판정이 “즉시” 들어간다는 거임.

총알이 날아가서 나중에 맞는 방식이 아니라, 클릭한 그 순간 맞았는지 계산 끝남.

<b>장착 처리</b>

이 부분은 무기 바꿀 때 처리임.

- 새 무기 데이터가 없으면 종료
- 이미 장착된 무기 모델 있으면 <code>Destroy</code>
- 새 <code>weaponData</code> 저장
- Addressables 경로 유효하면 <code>InstantiateAsync</code>
- \PlayerWeapon.cs (line 91)\ <code>OnWeaponLoaded()</code>에서 모델 받아서 <code>handPos</code> 기준 <code>localPosition = 0</code>, <code>localRotation = 0</code>으로 정렬

즉 인벤토리에서 무기를 주웠을 때, 데이터만 바꾸는 게 아니라 손에 보이는 모델까지 같이 붙이는 구조임.

<b>궤적 표시 처리</b>

이 부분은 전부 시각 효과용임.

- <code>ShowShotTrace()</code>
  - <code>showShotTrace == false</code>면 아무것도 안 함
  - <code>LineRenderer</code> 없으면 아무것도 안 함
  - 선의 시작점/끝점 넣음
  - 색 넣음
  - 선 켬
  - 이전에 돌던 숨김 코루틴 있으면 끊음
  - 새 숨김 코루틴 시작
- <code>HideShotTraceAfterDelay()</code>
  - <code>yield return shotTraceWait</code>
  - 기다린 뒤 선 끔
- <code>HideShotTrace()</code>
  - <code>LineRenderer.enabled = false</code>

즉 레이캐스트는 안 보이니까, 그 결과를 <code>LineRenderer</code>로 잠깐 눈에 보이게 만든 거임.

<b>색 규칙</b>

지금 기준 색 규칙은 이거임.

- 뭔가 맞음 = 흰색
- 아무것도 안 맞음 = 빨간색

주의할 점 하나 있음.

- 여기서 “맞음”은 <code>hitMask</code>에 걸린 뭔가를 맞았다는 뜻임
- 그래서 <code>Wall</code>도 <code>hitMask</code>에 있으면 벽에 맞아도 흰색으로 보임

만약 나중에

- 적 맞음 흰색
- 벽 맞음 노란색
- 완전 빗나감 빨간색

이렇게 더 세분화하고 싶으면 <code>IDamageable</code>인지 아닌지로 색 분기 한 번 더 넣으면 됨.

<b>왜 PlayerMovement랑 잘 이어지냐</b>

이 스크립트가 잘 돌아가는 전제는 \PlayerMovement.cs\에서 플레이어가 항상 커서를 본다는 점임.

그 덕분에 <code>PlayerWeapon</code>은 커서를 다시 계산할 필요가 없음.

그냥 <code>firePoint.forward</code>만 써도 커서 방향으로 쏘는 거랑 같아짐.

즉 연결은 이렇게 됨.

- <code>PlayerMovement</code>가 몸 방향을 커서에 맞춤
- <code>FirePos</code>가 그 방향을 따라감
- <code>PlayerWeapon</code>이 <code>firePoint.forward</code>로 레이캐스트 쏨

```txt
using System.Collections;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class PlayerWeapon : MonoBehaviour
{
[Header("Equip Weapon")]
[SerializeField] private WeaponItemData weaponData;
[SerializeField] private Transform handPos;
[SerializeField] private Transform firePoint;
[SerializeField] private LayerMask hitMask;
[Header("Shot Trace Visual")]
[SerializeField] private bool showShotTrace = true;
[SerializeField] private LineRenderer shotTraceRenderer;
[SerializeField] private float shotTraceDuration = 0.08f;
[SerializeField] private Color hitTraceColor = Color.white;
[SerializeField] private Color missTraceColor = Color.red;

public bool isEquipped => weaponData != null;
public float nowUseMana => weaponData.useMana;

private GameObject currentWeaponInstance;
private Coroutine shotTraceCoroutine;
private WaitForSeconds shotTraceWait;

private void Awake()
{
    weaponData = null;
    shotTraceWait = new WaitForSeconds(shotTraceDuration);
    HideShotTrace();
}

private void OnDisable()
{
    if (shotTraceCoroutine != null)
    {
        StopCoroutine(shotTraceCoroutine);
        shotTraceCoroutine = null;
    }

    HideShotTrace();
}

public void PlayerAttack()
{
    if (weaponData == null || firePoint == null)
        return;

    Vector3 origin = firePoint.position;
    Vector3 direction = firePoint.forward;
    Vector3 endPoint = origin + direction * weaponData.fireRange;
    Color traceColor = missTraceColor;

    if (Physics.Raycast(origin, direction, out RaycastHit hit, weaponData.fireRange, hitMask, QueryTriggerInteraction.Ignore))
    {
        endPoint = hit.point;
        traceColor = hitTraceColor;

        IDamageable target = hit.collider.GetComponentInParent<IDamageable>();

        if (target != null && target.EntityFaction != Faction.player)
        {
            target.TakeDamage(weaponData.AtkValue);
        }
    }

    ShowShotTrace(origin, endPoint, traceColor);
}

public void EquipWeapon(WeaponItemData weaponItemData)
{
    if (weaponItemData == null)
        return;

    if (currentWeaponInstance != null)
    {
        Destroy(currentWeaponInstance);
        currentWeaponInstance = null;
    }

    weaponData = weaponItemData;

    if (!weaponData.itemPrefabRef.RuntimeKeyIsValid())
        return;

    Addressables.InstantiateAsync(weaponData.itemPrefabRef, handPos).Completed += OnWeaponLoaded;
}

private void OnWeaponLoaded(AsyncOperationHandle<GameObject> handle)
{
    if (handle.Status == AsyncOperationStatus.Succeeded)
    {
        currentWeaponInstance = handle.Result;
        currentWeaponInstance.transform.localPosition = Vector3.zero;
        currentWeaponInstance.transform.localRotation = Quaternion.identity;
    }
    else
    {
        Debug.LogError("무기 장착에 실패했습니다.");
    }
}

private void ShowShotTrace(Vector3 start, Vector3 end, Color traceColor)
{
    if (!showShotTrace || shotTraceRenderer == null)
        return;

    shotTraceRenderer.positionCount = 2;
    shotTraceRenderer.SetPosition(0, start);
    shotTraceRenderer.SetPosition(1, end);
    shotTraceRenderer.startColor = traceColor;
    shotTraceRenderer.endColor = traceColor;
    shotTraceRenderer.enabled = true;

    if (shotTraceCoroutine != null)
        StopCoroutine(shotTraceCoroutine);

    shotTraceCoroutine = StartCoroutine(HideShotTraceAfterDelay());
}

private IEnumerator HideShotTraceAfterDelay()
{
    yield return shotTraceWait;
    HideShotTrace();
    shotTraceCoroutine = null;
}

private void HideShotTrace()
{
    if (shotTraceRenderer != null)
        shotTraceRenderer.enabled = false;
}
}
```

캐릭터 상자와 상호작용을 할 때  상호작용이 가능하다는 아이콘이 뜨도록 스크립트를 조정하고 구현하기원본

```txt
using System;
using System.Collections.Generic;
using UnityEngine;

public class PlayerInteraction : MonoBehaviour
{
private List<IInteractable> nearbyInteractables = new List<IInteractable>();        // 플레이어 근처의 상호작용 가능한 (IInteractable) 오브젝트 리스트
// 참조 컴포넌트
private EntityIdentity identity;

private void Awake()
{
    identity = GetComponentInParent<EntityIdentity>();

    // 필수 컴포넌트가 존재하지 않을 시 스크립트 비활성화
    if(identity==null)
    {
        this.enabled = false;
        Debug.LogError("PlayerInteraction: 필요한 컴포넌트가 없습니다.");
        return;
    }
}

private void OnEnable()
{
    /// 이벤트 구독 ///
    GlobalEventBus.OnInteractionInput += GetInteraction;
}

private void OnDisable()
{
    /// 이벤트 구독 해제 ///
    GlobalEventBus.OnInteractionInput -= GetInteraction;
}

private void OnTriggerEnter(Collider other)
{
    // 충돌한 객체가 IInteractable을 구현하는지 확인
    IInteractable interactable = other.GetComponent<IInteractable>();
    if (interactable != null)
    {
        // 상호작용 가능한 오브젝트일 경우 리스트에 추가
        Debug.Log("Interactable detected: " + other.gameObject.name);
        nearbyInteractables.Add(interactable);
    }
}

private void OnTriggerExit(Collider other)
{
    // 충돌이 끝난 객체가 IInteractable을 구현하는지 확인
    IInteractable interactable = other.GetComponent<IInteractable>();
    if (interactable != null)
    {
        // 상호작용 가능 객체가 영역을 벗어나면 리스트에서 제거
        nearbyInteractables.Remove(interactable);
    }
}

/* 무언가와 상호작용 시 */
private void GetInteraction()
{
    Debug.Log("인터렉션 입력이 실행됩니다. 근처의 상호작용 가능한 요소: " + nearbyInteractables.Count);
    // 상호작용 상대에 따른 처리
    if(nearbyInteractables.Count > 0)
    {
        // 현재는 우선 순위를 따지지 않고 리스트의 첫번째 요소 선택
        IInteractable target = nearbyInteractables[0];
        // 대상에게 상호작용 실행
        bool shouldRemove = target.Interact(identity.entityID);

        // 상호작용 후 제거 될 대상(아이템 등)이라면 리스트에서 제거
        if (shouldRemove)
        {
            nearbyInteractables.Remove(target);
        }
    }

}
}
```

상호작용 하는 아이템 박스 스크립트

```txt
using UnityEngine;

/// <summary>
/// 플레이어가 상호작용했을 때 랜덤한 아이템 드랍을 생성하는 상자 스크립트
/// 드랍 프리팹을 배열로 받아 동일한 확률로 하나를 선택함
/// </summary>
public class ItemBox : MonoBehaviour, IInteractable
{
[Header("Drop Settings")]
[SerializeField] private GameObject[] dropPrefabs;    // 랜덤 드랍 후보 프리팹 목록
[SerializeField] private Transform dropPoint;         // 아이템이 생성될 위치
private bool isOpened = false;                        // 한 번 열린 상자는 다시 열리지 않도록 체크

/// <summary>
/// 플레이어가 상자와 상호작용하면 호출됨
/// 3개의 드랍 후보 중 하나를 랜덤 생성하고 상자는 제거됨
/// </summary>
public bool Interact(int playerID)
{
    // 이미 열린 상자는 다시 처리하지 않음
    if (isOpened)
        return false;

    // 드랍 프리팹이 연결되지 않았으면 종료
    if (dropPrefabs == null || dropPrefabs.Length == 0)
    {
        Debug.LogWarning("ItemBox: 드랍 프리팹이 설정되지 않았음.", this);
        return false;
    }

    // 배열 길이 기준으로 랜덤 인덱스를 뽑기 때문에
    // 3개를 넣으면 1:1:1 비율로 랜덤 드랍이 됨
    int randomIndex = Random.Range(0, dropPrefabs.Length);
    GameObject selectedDropPrefab = dropPrefabs[randomIndex];

    if (selectedDropPrefab == null)
    {
        Debug.LogWarning("ItemBox: 비어 있는 드랍 프리팹 슬롯이 있음.", this);
        return false;
    }

    // dropPoint가 있으면 그 위치에 생성하고
    // 없으면 상자 위쪽으로 살짝 띄워서 생성
    Vector3 spawnPosition = dropPoint != null
        ? dropPoint.position
        : transform.position + Vector3.up * 0.75f;

    Quaternion spawnRotation = selectedDropPrefab.transform.rotation;

    Instantiate(selectedDropPrefab, spawnPosition, spawnRotation);

    isOpened = true;
    Debug.Log("상자를 열었고 아이템을 드랍함: " + selectedDropPrefab.name);

    // 상자는 한 번 사용 후 제거
    Destroy(gameObject);
    return true;
}
}
```

아이템 박스와 상호작용이 가능할 때 UI를 띄울 스크립트

```txt
using UnityEngine;

/// <summary>
/// 상호작용 프롬프트 UI를 켜고 끄는 전용 스크립트
/// ItemBox 같은 상호작용 오브젝트의 루트에 붙이고
/// 실제로 보여줄 UI 오브젝트를 promptRoot로 연결해서 사용함
/// </summary>
public class InteractionPromptUI : MonoBehaviour
{
[SerializeField] private GameObject promptRoot;   // 월드 스페이스 UI 루트 오브젝트
private void Awake()
{
    // 시작 시에는 프롬프트를 꺼둠
    if (promptRoot == null)
    {
        Debug.LogWarning("InteractionPromptUI: promptRoot가 연결되지 않았음.", this);
        return;
    }

    promptRoot.SetActive(false);
}

/// <summary>
/// 플레이어가 상호작용 범위 안에 들어왔을 때 프롬프트 표시
/// </summary>
public void Show()
{
    if (promptRoot != null)
    {
        promptRoot.SetActive(true);
    }
}

/// <summary>
/// 플레이어가 상호작용 범위 밖으로 나갔을 때 프롬프트 숨김
/// </summary>
public void Hide()
{
    if (promptRoot != null)
    {
        promptRoot.SetActive(false);
    }
}
}
```
{% endraw %}
