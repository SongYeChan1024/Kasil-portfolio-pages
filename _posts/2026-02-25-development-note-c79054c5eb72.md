---
title: "코딩 연습"
date: 2026-02-25 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "문제: 1부터 10까지 중 3의 배수만 출력해라. cs for(int i = 1; i / : 나누기(몫) : 나머지(배수 판정용) 배수 판정은 거의 무조건 라고 생각해라 1부터 10까지의 합 구하기 (정답 55) 힌트 sum 이라는 변수를 하나 만들고 (처음엔 0) for문 돌면서 su"
description: "문제: 1부터 10까지 중 3의 배수만 출력해라. cs for(int i = 1; i / : 나누기(몫) : 나머지(배수 판정용) 배수 판정은 거의 무조건 라고 생각해라 1부터 10까지의 합 구하기 (정답 55) 힌트 sum 이라는 변수를 하나 만들고 (처음엔 0) for문 돌면서 su"
published: true
migration_id: "35e36532580e817e86f5c79054c5eb72"
migration_status: "published"
migration_flags: []
---

{% raw %}
문제:

> 1부터 10까지 중 3의 배수만 출력해라.

```cs
for(int i = 1; i <= 10; i++)
{
    if (i % 3 == 0)
    {
    Console.WriteLine(i);
    }
}
```

- <code>/</code> : 나누기(몫)
- <code>%</code> : 나머지(배수 판정용)

배수 판정은 거의 무조건 <code>%</code>라고 생각해라

1부터 10까지의 합 구하기 (정답 55)

힌트

- <code>sum</code>이라는 변수를 하나 만들고 (처음엔 0)
- for문 돌면서 <code>sum</code>에 <code>i</code>를 계속 더해
- 마지막에 <code>sum</code> 출력

오답

```cs
int sum = 0;
for (int i = sum+1; i <= 10; i++)
{
    Console.WriteLine(i);
}
```

정답

```cs
int sum = 0;

for (int i = 1; i <= 10; i++)
{
    sum += i;   // sum = sum + i;
}

Console.WriteLine(sum);
```

흐름 이해하기

i 는 이렇게 변함

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

sum은 이렇게 변화

0

0+1 = 1

1+2 = 3

3+3 = 6

6+4 = 10

...

→ 최종 55

중요 개념 정리

sum += i; = sum = sum + i;


> 1부터 10까지 중 <b>짝수만 더해서 합 구하기</b>

힌트:

```txt
if (i % 2 == 0)
```

풀이: 오답, i%2 != 0 을 써야 하고 return; 을 쓰면 멈추기 때문에 continue; 를 써야 한다

```cs
int sum = 0;
for (i = 1; i <= 10; i++)
{
    if (i % 2 == 0) return;
    
    sum += i;
    
    Console.WriteLine(sum);
}
```

정답:

“짝수만 더하기” 정답 코드 (1\~10 짝수 합 = 30)

```cs
int sum = 0;

for (int i = 1; i <= 10; i++)
{
    if (i % 2 != 0) continue; // 홀수면 건너뛰기

    sum += i;
}

Console.WriteLine(sum);
```

또는 조건을 반대로 (더 직관적)

```cs
int sum = 0;

for (int i = 1; i <= 10; i++)
{
    if (i % 2 == 0)
    {
        sum += i;
    }
}

Console.WriteLine(sum);
```

개념 정리

- <code>return;</code> : 함수 전체를 끝냄 (게임으로 치면 “메인 메뉴로 강제 퇴장”)
- <code>continue;</code> : 이번 턴만 스킵하고 다음 반복으로 감


문제: 1\~100 중 7의 배수 합 구하기

풀이: 정답

```cs
int sum = 0;
for (int i = 1; i <= 100; i++)
{
    if (i % 7 == 0)
    {
        sum += i;
    }
}
Console.WriteLine(sum);
```
{% endraw %}
