---
title: "2026-07-22_IResultService_script_compare"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "1. 이전 스크립트 전체 기준: dd3a3c0 파일: Assets/02_Scripts/Utils/Interface/IResultService.cs cs ﻿using UnityEngine; public interface IResultService //인게임 세션 플레이 결과 (성공 / 실"
description: "1. 이전 스크립트 전체 기준: dd3a3c0 파일: Assets/02_Scripts/Utils/Interface/IResultService.cs cs ﻿using UnityEngine; public interface IResultService //인게임 세션 플레이 결과 (성공 / 실"
published: true
migration_id: "3a536532580e819eaf66edd1d959ff5e"
migration_status: "published"
migration_flags: []
---

{% raw %}
## 1. 이전 스크립트 전체

- 기준: <code>dd3a3c0</code>
- 파일: <code>Assets/02_Scripts/Utils/Interface/IResultService.cs</code>

```cs
﻿using UnityEngine;
public interface IResultService  //인게임 세션 플레이 결과 (성공 / 실패) 시 처리를 관리하는 인터페이스.
{
    void Register(int playerID, Component playerComponent);     //playerID에 정해진 플레이어 컴포넌트를 등록
    void Unregister(int playerID);                              //playerID에서 컴포넌트 등록 해제
    void UnregisterIfOwner(int playerID, Component requester);  //plyaerID가 requester 자신인 경우에 등록 해제
    Component GetPlayerComponent(int playerID);                 //playerID에 등록된 컴포넌트를 참조
    void HandleEscapeStart(int playerID);                       //탈출 채널링 시작 시 처리
    void HandleEscapeGameover(int playerID);                    //강제 각성 시 처리
    void HandleEscapeIdle(int playerID);                        //탈출 취소 시 기본 상태로 돌아가는 처리
}
```

## 2. 변경 설명

메뉴에서 게임 포기를 확정했을 때 실패 정산을 요청하기 위한 <code>HandleGameAbandon()</code> 계약을 추가했습니다. UI는 구체적인 <code>ResultManager</code> 구현을 몰라도 서비스 인터페이스를 통해 세션 종료를 요청할 수 있습니다.

## 3. 현재 스크립트 전체

- 기준: <code>37063ec</code>
- 파일: <code>Assets/02_Scripts/Utils/Interface/IResultService.cs</code>

```cs
﻿using UnityEngine;
public interface IResultService  //인게임 세션 플레이 결과 (성공 / 실패) 시 처리를 관리하는 인터페이스.
{
    void Register(int playerID, Component playerComponent);     //playerID에 정해진 플레이어 컴포넌트를 등록
    void Unregister(int playerID);                              //playerID에서 컴포넌트 등록 해제
    void UnregisterIfOwner(int playerID, Component requester);  //plyaerID가 requester 자신인 경우에 등록 해제
    Component GetPlayerComponent(int playerID);                 //playerID에 등록된 컴포넌트를 참조
    void HandleEscapeStart(int playerID);                       //탈출 채널링 시작 시 처리
    void HandleEscapeGameover(int playerID);                    //강제 각성 시 처리
    void HandleEscapeIdle(int playerID);                        //탈출 취소 시 기본 상태로 돌아가는 처리
    void HandleGameAbandon();                                   //메뉴에서 게임 포기를 선택했을 때 실패 정산 요청
}
```
{% endraw %}
