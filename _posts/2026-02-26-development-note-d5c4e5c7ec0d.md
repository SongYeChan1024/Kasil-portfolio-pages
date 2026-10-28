---
title: "코딩 연습 2일차"
date: 2026-02-26 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "1부터 20까지 숫자 중에서 짝수만 출력하시오. cs for (int i = 1; i 3의 배수이면서 5의 배수인 숫자만 출력하시오. 힌트: if (조건 && 조건) 결과:오답 || → 하나라도 맞으면 출력 && → 둘 다 맞아야 출력 &&를 써야 정답 cs for (int i = 1;"
description: "1부터 20까지 숫자 중에서 짝수만 출력하시오. cs for (int i = 1; i 3의 배수이면서 5의 배수인 숫자만 출력하시오. 힌트: if (조건 && 조건) 결과:오답 || → 하나라도 맞으면 출력 && → 둘 다 맞아야 출력 &&를 써야 정답 cs for (int i = 1;"
published: true
migration_id: "35e36532580e818d9eb7d5c4e5c7ec0d"
migration_status: "published"
migration_flags: ["publication_review"]
---

{% raw %}
1부터 20까지 숫자 중에서 짝수만 출력하시오.

```cs
for (int i = 1; i <= 20; i++)
{
    if (i % 2 == 0)
    {
        Console.WriteLine(i);
    }
}
```

1부터 10까지 숫자의 합을 구하시오.


결과: 오답

풀이의 정답은 55였으나 이렇게 출력 하면 계산 과정까지 전부 출력됨


```cs
int sum = 0;
for (int i = 1; i <= 10; i++)
{
    sum += i;
    
    Console.WriteLine(sum);
}
```


정답:


```cs
int sum = 0;

for (int i = 1; i <= 10; i++)
{
    sum += i;
}

Console.WriteLine(sum);
```


1부터 30까지 중에서 <b>3의 배수이면서 5의 배수인 숫자만 출력하시오.</b>

힌트: if (조건 && 조건)


결과:오답

- <code>||</code> → 하나라도 맞으면 출력
- <code>&amp;&amp;</code> → 둘 다 맞아야 출력

&&를 써야 정답


```cs
for (int i = 1; i<= 30; i++)
{
    if(i % 3 == 0 || i % 5 == 0)
    {
    Console.WriteLine(i);
    }
}
```


정답:


```cs
for (int i = 1; i <= 30; i++)
{
    if (i % 15 == 0)
    {
        Console.WriteLine(i);
    }
}
```


```cs
for (int i = 1; i <= 30; i++)
{
    if (i % 3 == 0 && i % 5 == 0)
    {
        Console.WriteLine(i);
    }
}
```


2단부터 9단까지 전부 출력해라.


결과: 정답


```cs
for ( i = 1; i <= 9; i++)
{
    for (int n = 2; n <= 9; n++)
    {
        Console.WriteLine($"구구단!{i * n}");
    }
}
```


개선점:

```cs
for (int n = 2; n <= 9; n++)
{
    for (int i = 1; i <= 9; i++)
    {
        Console.WriteLine($"{n} x {i} = {n * i}");
    }

    Console.WriteLine(); // 단마다 한 줄 띄우기
}
```

<br />이건 <b>대칭 구조를 제거하는 방식</b>

```cs
for (int n = 1; n <= 9; n++)
{
    for (int i = n+1; i <= 9; i++)
    {
        Console.WriteLine($"{n} x {i} = {n * i}");
    }

    Console.WriteLine(); // 단마다 한 줄 띄우기
}
```

값

1 x 2 = 2<br />1 x 3 = 3<br />1 x 4 = 4<br />1 x 5 = 5<br />1 x 6 = 6<br />1 x 7 = 7<br />1 x 8 = 8<br />1 x 9 = 9

2 x 3 = 6<br />2 x 4 = 8<br />2 x 5 = 10<br />2 x 6 = 12<br />2 x 7 = 14<br />2 x 8 = 16<br />2 x 9 = 18

3 x 4 = 12<br />3 x 5 = 15<br />3 x 6 = 18<br />3 x 7 = 21<br />3 x 8 = 24<br />3 x 9 = 27

4 x 5 = 20<br />4 x 6 = 24<br />4 x 7 = 28<br />4 x 8 = 32<br />4 x 9 = 36

5 x 6 = 30<br />5 x 7 = 35<br />5 x 8 = 40<br />5 x 9 = 45

6 x 7 = 42<br />6 x 8 = 48<br />6 x 9 = 54

7 x 8 = 56<br />7 x 9 = 63

8 x 9 = 72

- 충돌 검사
- 팀 나누기
- 카드 두 장 뽑기
- 아이템 조합 검사
- 적과 적 사이 거리 계산

순서가 중요하지 않고

“한 번만 비교하면 되는 경우”에 사용

<table header-row="true">
<colgroup>
<col width="244.00000762939453" />
<col width="550.0000076293945" />
</colgroup>
<tr>
<td>
구조
</td>
<td>
의미
</td>
</tr>
<tr>
<td>
<code>for i = 1 ~ 9</code>
</td>
<td>
전체 반복
</td>
</tr>
<tr>
<td>
<code>for j = 1 ~ 9</code>
</td>
<td>
전부 다 비교
</td>
</tr>
<tr>
<td>
<code>for j = i + 1 ~ 9</code>
</td>
<td>
이미 한 건 제외
</td>
</tr>
</table>
{% endraw %}
