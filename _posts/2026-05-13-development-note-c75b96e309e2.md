---
title: "챕터테스트"
date: 2026-05-13 12:00:00 +0900
categories: ["개발 메모", "학습 기록"]
tags: ["Notion 이전", "학습 기록"]
excerpt: "1. 겹치는 구간의 길이 구하기 주석 포함 코드 cs usingSystem; publicclassSolution publicstaticintsolution(stringa,stringb) // 첫 번째 선분 문자열을 중심점과 길이로 분리 int lineA=ParseLine(a); // 두"
description: "1. 겹치는 구간의 길이 구하기 주석 포함 코드 cs usingSystem; publicclassSolution publicstaticintsolution(stringa,stringb) // 첫 번째 선분 문자열을 중심점과 길이로 분리 int lineA=ParseLine(a); // 두"
published: false
migration_id: "35f36532580e80588d54c75b96e309e2"
migration_status: "review_required"
migration_flags: []
---

{% raw %}
# 1. 겹치는 구간의 길이 구하기

## 주석 포함 코드

```cs
usingSystem;

publicclassSolution
{
publicstaticintsolution(stringa,stringb)
    {
// 첫 번째 선분 문자열을 중심점과 길이로 분리
int[]lineA=ParseLine(a);

// 두 번째 선분 문자열을 중심점과 길이로 분리
int[]lineB=ParseLine(b);

intcenterA=lineA[0];// 첫 번째 선분의 중심점
intlengthA=lineA[1];// 첫 번째 선분의 길이

intcenterB=lineB[0];// 두 번째 선분의 중심점
intlengthB=lineB[1];// 두 번째 선분의 길이

/*
* 원래 선분의 시작점과 끝점은 다음처럼 구할 수 있다.
* 시작점 = 중심점 - 길이 / 2
* 끝점 = 중심점 + 길이 / 2
*
* 하지만 길이를 2로 나누면 소수점이 생길 수 있으므로,
* 모든 좌표를 2배로 계산한다.
*/
intstartA=centerA*2-lengthA;
intendA=centerA*2+lengthA;

intstartB=centerB*2-lengthB;
intendB=centerB*2+lengthB;

/*
* 겹치는 구간의 시작점은 두 시작점 중 더 큰 값이다.
* 겹치는 구간의 끝점은 두 끝점 중 더 작은 값이다.
*/
intoverlapStart=Math.Max(startA,startB);
intoverlapEnd=Math.Min(endA,endB);

// 겹치는 구간이 없으면 0을 반환한다.
if (overlapEnd<=overlapStart)
        {
return0;
        }

/*
* 좌표를 2배로 계산했으므로,
* 마지막에 다시 2로 나누어 실제 길이를 구한다.
*/
return (overlapEnd-overlapStart)/2;
    }

privatestaticint[]ParseLine(stringinput)
    {
// "(2,4)" 형태에서 괄호 제거
input=input.Replace("(","").Replace(")","");

// "2,4"를 쉼표 기준으로 나누기
string[]parts=input.Split(',');

intcenter=int.Parse(parts[0]);// 중심점
intlength=int.Parse(parts[1]);// 길이

returnnewint[] {center,length };
    }
}
```

## 풀이 설명

이 문제는 선분이 <b>중심점과 길이</b>로 주어지기 때문에, 먼저 각 선분을 <b>시작점과 끝점</b>으로 바꿔야 한다.

예를 들어 <code>(2,4)</code>는 중심점이 <code>2</code>, 길이가 <code>4</code>인 선분이다.

```txt
시작점 = 2 - 4 / 2 = 0
끝점 = 2 + 4 / 2 = 4
```

즉 이 선분은 <code>0</code>부터 <code>4</code>까지의 구간을 가진다.

두 선분의 겹치는 부분을 구하려면, 두 선분 중 <b>더 늦게 시작하는 지점</b>과 <b>더 빨리 끝나는 지점</b>을 찾으면 된다.

```txt
intoverlapStart=Math.Max(startA,startB);
intoverlapEnd=Math.Min(endA,endB);
```

만약 <code>overlapEnd</code>가 <code>overlapStart</code>보다 작거나 같다면 두 선분은 겹치지 않는 것이므로 <code>0</code>을 반환한다.

겹친다면 <code>overlapEnd - overlapStart</code>가 겹치는 구간의 길이가 된다.

이 코드에서는 소수점 계산을 피하기 위해 좌표를 2배로 계산했기 때문에, 마지막에 다시 <code>2</code>로 나누어 실제 길이를 반환한다.

---

# 2. 헬로빗 당근 탐지

## 주석 포함 코드

```cs
usingSystem;

publicclassSolution
{
publicstaticstringsolution(stringa,intb)
    {
/*
* a는 "O X X O O O O O O O" 같은 문자열이다.
* 공백을 기준으로 나누면 각 칸의 상태를 배열로 저장할 수 있다.
*/
string[]road=a.Split(' ');

intleftCount=0;// 토끼 기준 왼쪽 당근 개수
intrightCount=0;// 토끼 기준 오른쪽 당근 개수

/*
* b는 토끼가 떨어진 위치이다.
* 인덱스는 0부터 시작하므로,
* 0번부터 b - 1번까지가 왼쪽 구간이다.
*/
for (inti=0;i<b;i++)
        {
// 문제에서 O는 당근이 있다는 뜻이다.
if (road[i]=="O")
            {
leftCount++;
            }
        }

/*
* b 위치는 토끼가 있는 자리이므로 제외한다.
* b + 1번부터 마지막까지가 오른쪽 구간이다.
*/
for (inti=b+1;i<road.Length;i++)
        {
// 오른쪽 구간에서 당근 개수 세기
if (road[i]=="O")
            {
rightCount++;
            }
        }

// 왼쪽 당근이 더 많으면 "왼쪽" 반환
if (leftCount>rightCount)
        {
return"왼쪽";
        }
// 오른쪽 당근이 더 많으면 "오른쪽" 반환
elseif (rightCount>leftCount)
        {
return"오른쪽";
        }
// 양쪽 당근 개수가 같으면 "동일" 반환
else
        {
return"동일";
        }
    }
}
```

## 풀이 설명

이 문제는 토끼가 떨어진 위치를 기준으로 <b>왼쪽에 있는 당근 개수</b>와 <b>오른쪽에 있는 당근 개수</b>를 비교하는 문제이다.

길의 상태는 문자열로 주어진다.

```txt
O X X O O O O O O O
```

여기서 <code>O</code>는 당근이 있는 칸이고, <code>X</code>는 당근이 없는 칸이다.

먼저 문자열을 공백 기준으로 나누어 배열로 만든다.

```txt
string[]road=a.Split(' ');
```

그 다음 토끼 위치 <code>b</code>를 기준으로 왼쪽과 오른쪽을 나누어 계산한다.

예를 들어 입력이 다음과 같다고 하면,

```txt
O X X O O O O O O O 4
```

토끼 위치는 인덱스 <code>4</code>이다.

```txt
인덱스: 0 1 2 3 4 5 6 7 8 9
상태:   O X X O O O O O O O
```

토끼 기준 왼쪽은 <code>0</code>번부터 <code>3</code>번까지이다.

```txt
왼쪽: O X X O
당근 개수: 2개
```

토끼 기준 오른쪽은 <code>5</code>번부터 <code>9</code>번까지이다.

```txt
오른쪽: O O O O O
당근 개수: 5개
```

오른쪽 당근이 더 많으므로 결과는 다음과 같다.

```txt
오른쪽
```

이 문제에서 특히 주의할 점은 당근 표시가 숫자 <code>0</code>이 아니라 \*\*알파벳 대문자 <code>O</code>\*\*라는 점이다.

```txt
road[i]=="O"
```

숫자 <code>0</code>으로 비교하면 당근을 제대로 세지 못해서 결과가 <code>"동일"</code>로 나올 수 있다.
{% endraw %}
