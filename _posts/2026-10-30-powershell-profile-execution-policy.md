---
title: "[PowerShell] 시작 스크립트가 안 돌 때 — 실행 정책과 명령어 따로 만들기"
date: 2026-10-30 10:00:00 +0900
categories: ["에이전트 사용"]
tags: ["PowerShell", "Windows", "Claude Code", "환경 설정"]
---

PowerShell 창을 열면 Claude Code가 바로 켜지도록 시작 스크립트(프로필)를 적어 두었는데, 창을 열어도 아무 일도 일어나지 않았다. 원인과 우회 방법을 정리해 둔다.

## 시작 스크립트(프로필)

PowerShell은 창을 열 때 `$PROFILE` 경로의 스크립트를 실행한다. Windows PowerShell 5.1 기준 경로는 다음과 같다.

```
C:\Users\<사용자>\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
```

여기에 적어 둔 내용은 이렇다. 스크립트로 실행되는 PowerShell이나 Claude Code 안에서 열리는 셸에서는 켜지지 않게 조건을 걸었다.

```powershell
$isScripted = [Environment]::GetCommandLineArgs() | Where-Object { $_ -match '^-(NonI|Com|c$|File|f$|Enc|e$)' }
if (-not $env:CLAUDECODE -and $Host.Name -eq 'ConsoleHost' -and -not $isScripted) {
    claude
}
```

## 안 켜진 이유: 실행 정책

```powershell
Get-ExecutionPolicy -List
```

확인해 보니 `CurrentUser`, `LocalMachine`이 모두 `Undefined`였다. 이러면 Windows 데스크톱의 기본값인 **Restricted**가 적용되고, 프로필을 포함한 모든 `.ps1` 스크립트가 실행되지 않는다. 스크립트 내용이 맞아도 파일 자체를 읽지 않는 것이다.

해결하려면 내 계정에만 `RemoteSigned`를 걸면 된다. 관리자 권한은 필요 없다.

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

`RemoteSigned`는 내 PC에서 만든 스크립트는 실행하고, 인터넷에서 받은 스크립트는 서명이 있어야 실행한다.

## 덤: 한글 주석이 깨지는 문제

Windows PowerShell 5.1은 BOM이 없는 UTF-8 파일을 시스템 코드페이지(CP949)로 읽는다. 그래서 프로필의 한글 주석이 깨져 보였다. 파일을 **BOM이 있는 UTF-8**로 저장하면 된다.

```powershell
[IO.File]::WriteAllText($PROFILE, $content, (New-Object System.Text.UTF8Encoding $true))
```

## 실행 정책을 안 바꾸고 쓰는 방법: `.cmd` 명령어

`.cmd`, `.bat` 파일은 PowerShell 실행 정책의 영향을 받지 않는다. 그래서 PATH에 들어 있는 폴더에 `.cmd` 파일을 하나 두면, 파일 이름이 곧 명령어가 된다.

`claude.exe`가 있는 `C:\Users\<사용자>\.local\bin`이 이미 PATH에 있어서, 같은 폴더에 `on.cmd`를 만들었다.

```bat
@echo off
claude %*
```

- `%*`는 뒤에 붙인 인자를 그대로 넘긴다. 그래서 `on -c`(마지막 대화 이어서), `on -r`(대화 목록에서 고르기)도 그대로 된다.
- Windows 명령어는 대소문자를 구분하지 않아서 `ON`으로 입력해도 된다.
- 이름을 정하기 전에 `Get-Command on`으로 같은 이름의 명령어가 없는지 먼저 확인했다.

## 정리

- 프로필이 안 돌면 스크립트 내용보다 **실행 정책**부터 확인한다.
- 실행 정책을 건드리기 어려우면 PATH 폴더에 `.cmd` 파일을 두는 방법이 간단하다.
- 5.1에서 한글이 들어간 `.ps1`은 BOM 있는 UTF-8로 저장한다.
