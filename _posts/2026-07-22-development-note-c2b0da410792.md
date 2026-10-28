---
title: "2026-07-22_전체_스크립트_비교_정리"
date: 2026-07-22 12:00:00 +0900
categories: ["개발 메모", "CSharp"]
tags: ["Notion 이전", "CSharp"]
excerpt: "이 문서는 2026-07-22에 송예찬이 직접 수정한 C 스크립트 16개의 전문 비교 인덱스입니다. 각 하위 문서는 다음 순서로 구성합니다. 이전 스크립트 전체 변경 설명 현재 스크립트 전체 이전 전문: 파일이 오늘 처음 직접 수정되기 직전 커밋 기준 현재 전문: 오늘 최종 HEAD 3"
description: "이 문서는 2026-07-22에 송예찬이 직접 수정한 C 스크립트 16개의 전문 비교 인덱스입니다. 각 하위 문서는 다음 순서로 구성합니다. 이전 스크립트 전체 변경 설명 현재 스크립트 전체 이전 전문: 파일이 오늘 처음 직접 수정되기 직전 커밋 기준 현재 전문: 오늘 최종 HEAD 3"
published: true
migration_id: "3a536532580e811e905dc2b0da410792"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
이 문서는 2026-07-22에 송예찬이 직접 수정한 C# 스크립트 16개의 전문 비교 인덱스입니다.

각 하위 문서는 다음 순서로 구성합니다.

1. 이전 스크립트 전체
2. 변경 설명
3. 현재 스크립트 전체

- 이전 전문: 파일이 오늘 처음 직접 수정되기 직전 커밋 기준
- 현재 전문: 오늘 최종 HEAD <code>37063ec</code> 기준
- 변경 설명: 송예찬의 직접 커밋 <code>6196912</code>, <code>c32ccf5</code>, <code>37063ec</code>만 분리해 설명
- 참고: <code>GlobalEventBus.cs</code>의 전문 차이에는 직접 커밋 사이에 병합된 팀원 변경도 포함될 수 있으며, 해당 내용은 파일 문서에서 별도 표기합니다.

## 1. 입력과 UI 기반

- [GameManager.cs]({% endraw %}{% post_url 2026-07-22-development-note-d7db94a9f747 %}{% raw %})
- [InputManager.cs]({% endraw %}{% post_url 2026-07-22-development-note-e5a6668c46ee %}{% raw %})
- [SceneController.cs]({% endraw %}{% post_url 2026-07-22-development-note-d44ba6d35fa2 %}{% raw %})
- [UIManager.cs]({% endraw %}{% post_url 2026-07-22-development-note-ddc189004b95 %}{% raw %})
- [LocalInputReader.cs]({% endraw %}{% post_url 2026-07-22-development-note-fea7e3ac14f9 %}{% raw %})
- [GlobalEventBus.cs]({% endraw %}{% post_url 2026-07-22-development-note-fa22423555b6 %}{% raw %})

## 2. 인게임 메뉴와 인벤토리

- [GameUIPresenter.cs]({% endraw %}{% post_url 2026-07-22-development-note-c6d8ae853366 %}{% raw %})
- [InventoryPresenter.cs]({% endraw %}{% post_url 2026-07-22-development-note-cde2e4ad5e20 %}{% raw %})
- [InGameMenuUI.cs]({% endraw %}{% post_url 2026-07-22-development-note-f290e2f3ded2 %}{% raw %})
- [GameMenuUI.cs]({% endraw %}{% post_url 2026-07-22-development-note-d7393c6fca91 %}{% raw %})

## 3. 게임 포기 정산

- [Enums.cs]({% endraw %}{% post_url 2026-07-22-development-note-f684d7df3b73 %}{% raw %})
- [ResultManager.cs]({% endraw %}{% post_url 2026-07-22-development-note-e984ae642e6e %}{% raw %})
- [PlayerStatus.cs]({% endraw %}{% post_url 2026-07-22-development-note-c29e2e701f4e %}{% raw %})
- [NoticeLobbyUI.cs]({% endraw %}{% post_url 2026-07-22-development-note-e60d4da4122c %}{% raw %})
- [IResultService.cs]({% endraw %}{% post_url 2026-07-22-development-note-edd1d959ff5e %}{% raw %})

## 4. 튜토리얼 입력 정합성

- [TutorialManager.cs]({% endraw %}{% post_url 2026-07-22-development-note-cc0cea5b7f18 %}{% raw %})

[2026-07-22\_GameManager\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-d7db94a9f747 %}{% raw %})

[2026-07-22\_InputManager\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-e5a6668c46ee %}{% raw %})

[2026-07-22\_SceneController\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-d44ba6d35fa2 %}{% raw %})

[2026-07-22\_UIManager\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-ddc189004b95 %}{% raw %})

[2026-07-22\_GameUIPresenter\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-c6d8ae853366 %}{% raw %})

[2026-07-22\_InventoryPresenter\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-cde2e4ad5e20 %}{% raw %})

[2026-07-22\_LocalInputReader\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-fea7e3ac14f9 %}{% raw %})

[2026-07-22\_TutorialManager\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-cc0cea5b7f18 %}{% raw %})

[2026-07-22\_InGameMenuUI\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-f290e2f3ded2 %}{% raw %})

[2026-07-22\_GameMenuUI\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-d7393c6fca91 %}{% raw %})

[2026-07-22\_GlobalEventBus\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-fa22423555b6 %}{% raw %})

[2026-07-22\_Enums\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-f684d7df3b73 %}{% raw %})

[2026-07-22\_ResultManager\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-e984ae642e6e %}{% raw %})

[2026-07-22\_PlayerStatus\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-c29e2e701f4e %}{% raw %})

[2026-07-22\_NoticeLobbyUI\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-e60d4da4122c %}{% raw %})

[2026-07-22\_IResultService\_script\_compare]({% endraw %}{% post_url 2026-07-22-development-note-edd1d959ff5e %}{% raw %})
{% endraw %}
