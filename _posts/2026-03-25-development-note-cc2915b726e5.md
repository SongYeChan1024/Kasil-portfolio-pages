---
title: "대화/나레이션 툴 기획서"
date: 2026-03-25 12:00:00 +0900
categories: ["개발 메모", "게임 기획"]
tags: ["Notion 이전", "게임 기획"]
excerpt: "상단: 기획서 버전 관리 표 원본 첨부: 프로젝트_mos.A.I.c_대화툴_데이터테이블_초안.xlsx (별도 로컬 보관) | 버전 | 날짜 | 작성자 | 수정 내용 | 비고 | | --- | --- | --- | --- | --- | | v0.1 | 2026-03-25 | 카실 | 대화"
description: "상단: 기획서 버전 관리 표 원본 첨부: 프로젝트_mos.A.I.c_대화툴_데이터테이블_초안.xlsx (별도 로컬 보관) | 버전 | 날짜 | 작성자 | 수정 내용 | 비고 | | --- | --- | --- | --- | --- | | v0.1 | 2026-03-25 | 카실 | 대화"
published: true
migration_id: "35e36532580e81b39000cc2915b726e5"
migration_status: "published"
migration_flags: ["private_attachment_preserved"]
---

{% raw %}
## 상단: 기획서 버전 관리 표

> 원본 첨부: 프로젝트_mos.A.I.c_대화툴_데이터테이블_초안.xlsx (별도 로컬 보관)

| 버전 | 날짜 | 작성자 | 수정 내용 | 비고 |
| --- | --- | --- | --- | --- |
| v0.1 | 2026-03-25 | 카실 | 대화/나레이션 툴 초안 작성 | 고정 대사 중심 |
| v0.2 | 2026-03-26 | 카실 | AI NPC 연동 구조 추가 | 하이브리드형 |
| v0.3 | 미정 |  | UI/데이터 구조 구체화 | 구현 전 정리 |
| v1.0 | 미정 |  | 1차 구현 확정본 | 실제 제작 기준 |

---

## 데이터 테이블 스키마(초안)

목표: 특정 에피소드에 종속되지 않고, 프로젝트 전반에서 “고정 대사 + 입력/조건 + 이벤트 + (선택) AI”를 <b>데이터만으로</b> 운영 가능하게.

---

## 최종 추천 테이블 목록(초안)

### A. 공용 핵심 테이블

1. <code>VariableFlag</code>
2. <code>Dialogue</code>
3. <code>FreeTextInput</code>
4. <code>Condition</code>
5. <code>Event</code>
6. <code>SceneContext</code>
7. <code>NPCProfile</code>
8. <code>AIPromptRule</code>
9. <code>AIFallback</code>

### B. 엔딩/판정 테이블

1. <code>EndingRule</code>
2. <code>EndingStatePackage</code>
3. <code>MemoryTag</code>
4. <code>ScoreAxisRule</code>

### C. 성격/힌트 생성 테이블

1. <code>NPCPersonalityCore</code>
2. <code>PersonalityKeywordMap</code>
3. <code>NPCPersonalityBuild</code>
4. <code>HintTimingRule</code>
5. <code>HintStyleRule</code>

이 구성이 좋은 이유

- 하이브리드 대화툴(고정 대사 + 입력/조건 + 이벤트 + 선택적 AI) 구조는 유지
- 엔딩 판정(기억 재구성률/태그 기반)과 성격 키워드 기반 AI 힌트 생성을 “규칙 층”으로 분리

---

## 테이블별 초안(필드)

### 1) <code>VariableFlag</code>

조건식/점수/상태값/엔딩 패키지에서 참조할 공용 변수 사전.

- <code>varKey</code> (string, PK): 예) <code>memory_reconstruction_rate</code>
- <code>displayName</code> (string): 표시 이름
- <code>valueType</code> (enum): <code>Int</code> / <code>Bool</code> / <code>String</code> / <code>TagSet</code> / <code>Enum</code>
- <code>scope</code> (enum): <code>Global</code> / <code>Chapter</code> / <code>Scene</code> / <code>Runtime</code>
- <code>defaultValue</code> (string)
- <code>description</code> (string)
- <code>usedIn</code> (string): 참조 테이블 메모(예: <code>EndingRule</code>, <code>EndingStatePackage</code>)

추천 최소 키(초기)

- <code>memory_reconstruction_rate</code>
- <code>relationship_reconstruction_score</code>
- <code>puzzle_reconstruction_score</code>
- <code>emotional_reconstruction_score</code>
- <code>puzzle_stability</code>
- <code>npc_bond_level</code>
- <code>final_merge_state</code>
- <code>ending_type</code>
- <code>missed_memory_tags</code>

### 2) <code>MemoryTag</code>

핵심 기억 태그 정의 테이블.

- <code>tagId</code> (string, PK): 예) <code>unfinished_confession</code>
- <code>category</code> (enum): <code>Girl</code> / <code>Painter</code> / <code>Musician</code> / <code>CoreSelf</code>
- <code>displayName</code> (string)
- <code>importance</code> (enum): <code>Core</code> / <code>Major</code> / <code>Minor</code>
- <code>description</code> (string)
- <code>requiredForTrueEnding</code> (bool)
- <code>relatedNpcId</code> (string, FK → <code>NPCProfile</code>)

추천 초기 태그(초기)

- <code>shared_childhood</code>
- <code>star_promise</code>
- <code>shared_dream</code>
- <code>co_creation</code>
- <code>unfinished_confession</code>
- <code>lover_memory</code>
- <code>self_voice</code>
- <code>split_self</code>

### 3) <code>ScoreAxisRule</code>

총점 100점(또는 프로젝트 합의 점수)을 어떤 축으로 계산하는지 정의하는 규칙표.

- <code>axisId</code> (string, PK): 예) <code>AxisRelation</code>
- <code>axisName</code> (string)
- <code>maxScore</code> (int)
- <code>description</code> (string)
- <code>calculationNote</code> (string)
- <code>relatedVars</code> (string): 관련 변수 키 목록 메모

추천 축(초기)

- 관계 재구성 40
- 퍼즐 재구성 35
- 감정 재구성 25

### 4) <code>EndingRule</code>

최종 엔딩 판정 규칙(점수 + 필수 태그).

- <code>ruleId</code> (string, PK): 예) <code>EndTrue01</code>
- <code>endingType</code> (bool): <code>True</code> / <code>Normal</code>
- <code>minReconstructionRate</code> (int)
- <code>requiredTags</code> (string): 필수 태그 목록(예: <code>shared_childhood;unfinished_confession;self_voice</code>)
- <code>requiredFlags</code> (string): 필수 플래그 목록
- <code>failDowngradeTo</code> (enum): <code>Normal</code>
- <code>outputEndingStateId</code> (string, FK → <code>EndingStatePackage</code>)
- <code>notes</code> (string)

### 5) <code>EndingStatePackage</code>

엔딩 결과를 AI/연출 시스템에 전달할 상태값 묶음.

- <code>packageId</code> (string, PK)
- <code>endingType</code> (bool): <code>True</code> / <code>Normal</code>
- <code>memoryReconstructionRate</code> (int)
- <code>missedMemoryTags</code> (string)
- <code>npcBondLevel</code> (enum): <code>Low</code> / <code>Medium</code> / <code>High</code>
- <code>puzzleStability</code> (enum): <code>Low</code> / <code>Mid</code> / <code>High</code>
- <code>emotionalRecoveryState</code> (enum): <code>Partial</code> / <code>Complete</code>
- <code>finalMergeState</code> (enum): <code>IncompleteMerge</code> / <code>CompleteMerge</code>
- <code>aiTonePreset</code> (string)
- <code>cutscenePreset</code> (string)

핵심 원칙

- AI에게 “진엔딩 써줘”가 아니라, 위 상태값을 넘겨서 작성하게 한다.

### 6) <code>NPCProfile</code>

NPC의 고정 설정.

- <code>npcId</code> (string, PK)
- <code>displayName</code> (string)
- <code>roleType</code> (enum): <code>Girl</code> / <code>Painter</code> / <code>Musician</code> / <code>CoreSelf</code>
- <code>fixedCoreTraits</code> (string)
- <code>baseRelationship</code> (string)
- <code>allowedTopics</code> (string)
- <code>bannedTopics</code> (string)
- <code>portraitSetId</code> (string)
- <code>defaultTone</code> (string)

### 7) <code>NPCPersonalityCore</code>

NPC별 고정 코어 성격 정의.

- <code>npcId</code> (string, PK)
- <code>coreTrait</code> (string)
- <code>description</code> (string)
- <code>lockWeight</code> (int)

### 8) <code>PersonalityKeywordMap</code>

성격 키워드 → 파라미터 영향치 매핑표.

- <code>keywordId</code> (string, PK)
- <code>keywordName</code> (string)
- <code>keywordGroup</code> (enum): <code>Emotion</code> / <code>Relationship</code> / <code>Puzzle</code>
- <code>targetChapter</code> (enum): <code>Common</code> / <code>Chapter1</code> / <code>Chapter2</code> / <code>Chapter3</code> / <code>Chapter4</code>
- <code>hintFrequencyDelta</code> (int)
- <code>hintDirectnessDelta</code> (int)
- <code>initiativeDelta</code> (int)
- <code>comfortDelta</code> (int)
- <code>emotionalExpressionDelta</code> (int)
- <code>memoryStyle</code> (enum): <code>Scene</code> / <code>Emotion</code> / <code>Structure</code> / <code>Flow</code> / <code>Intuition</code>
- <code>speechNote</code> (string)

### 9) <code>NPCPersonalityBuild</code>

NPC에 적용할 키워드 조합(빌드)과 계산 결과.

- <code>buildId</code> (string, PK)
- <code>npcId</code> (string, FK → <code>NPCProfile</code>)
- <code>coreTrait</code> (string)
- <code>emotionKeywordId</code> (string)
- <code>relationshipKeywordId</code> (string)
- <code>puzzleKeywordId</code> (string)
- <code>finalHintFrequency</code> (int)
- <code>finalHintDirectness</code> (int)
- <code>finalInitiative</code> (int)
- <code>finalComfort</code> (int)
- <code>finalEmotionalExpression</code> (int)
- <code>finalMemoryStyle</code> (enum)

### 10) <code>HintTimingRule</code>

정체 시간/실패 횟수에 따라 힌트 개입을 어떻게 보정할지 정의.

- <code>ruleId</code> (string, PK)
- <code>npcId</code> (string, FK → <code>NPCProfile</code>)
- <code>stuckTimeSec</code> (int)
- <code>failCountThreshold</code> (int)
- <code>directnessBonus</code> (int)
- <code>initiativeBonus</code> (int)
- <code>minimumFunctionalHint</code> (bool)
- <code>notes</code> (string)

### 11) <code>HintStyleRule</code>

직설도 단계별 문장 스타일 가이드.

- <code>styleId</code> (string, PK)
- <code>directnessLevel</code> (int)
- <code>styleDescription</code> (string)
- <code>examplePattern</code> (string)
- <code>useForAi</code> (bool)

### 12) <code>AIPromptRule</code>

AI 입력 조합 규칙(어떤 컨텍스트를 묶어서 보내는지).

- <code>aiRuleId</code> (string, PK)
- <code>useSceneContext</code> (bool)
- <code>useNpcProfile</code> (bool)
- <code>usePersonalityBuild</code> (bool)
- <code>useEndingStatePackage</code> (bool)
- <code>maxSentenceCount</code> (int)
- <code>bannedOutputTone</code> (string)
- <code>outputFormat</code> (enum): <code>Json</code> / <code>PlainText</code>
- <code>fallbackId</code> (string, FK → <code>AIFallback</code>)

### A. 공통 전제: 변수/플래그 정의 테이블이 먼저 필요

대화 조건/엔딩 분기에서 참조하는 값들은 ‘문자열 키’로 통일하고, 타입/설명을 한 곳에서 관리한다.

#### 0) Variable/Flag Definition Table (추가, 필수)

용도: 조건(Condition)과 엔딩 룰이 참조할 변수들의 사전

권장 컬럼

- <code>varKey</code> (PK): 예) <code>score_3_1</code>, <code>score_3_2</code>, <code>memoryCount</code>, <code>trust_musician</code>, <code>hintUsed_3_2</code>, <code>missCount_3_2</code>
- <code>displayName</code>: 인스펙터/툴에서 보여줄 이름
- <code>type</code>: int / float / bool / string / enum
- <code>scope</code>: runtime / save / session
- <code>defaultValue</code>
- <code>description</code>

프로젝트 공용 varKey 예시(권장)

- <code>chapterScoreA</code> (0\~100) / <code>chapterScoreB</code> (0\~100) 같은 장/구간별 점수
- <code>memoryTags</code> (string set 처럼 쓰거나, 태그별 bool로 분해)
- <code>miniEndingTier</code> (enum: <code>ClearSharp</code>, <code>ClearHazy</code>)  ← 구간별 미니 엔딩/마감 연출에 사용
- <code>endingType</code> (enum: <code>True</code>, <code>Normal</code>)  ← 최종 엔딩과 연결 시

---

### B. 대사/나레이션/선택지

#### 1) Dialogue Table (대사 본문)

권장 컬럼

- <code>dialogueId</code> (PK)
- <code>sceneId</code> (FK)
- <code>speakerId</code> (FK, optional: 나레이션이면 비움)
- <code>dialogueType</code> (enum): <code>Dialogue</code> / <code>Narration</code> / <code>System</code>
- <code>text</code> (본문)
- <code>voiceKey</code> (optional)
- <code>portraitKey</code> (optional)
- <code>nextDialogueId</code> (FK, optional)
- <code>choiceGroupId</code> (FK, optional)
- <code>conditionGroupId</code> (FK, optional)
- <code>eventGroupId</code> (FK, optional)
- <code>aiMode</code> (enum): <code>Off</code> / <code>AiAppend</code> / <code>AiRewrite</code>
- <code>aiRuleId</code> (FK, optional)
- <code>fallbackId</code> (FK, optional)

설계 메모

- Narration Table을 따로 두지 않고 <code>dialogueType</code>으로 통합하면 운영이 단순해짐(추천).

#### 2) Dialogue Choice Table (선택지 분기)

우리가 만들 방향: 객관식 선택지가 아니라 <b>플레이어가 텍스트를 직접 입력</b>(주관식)하고, 시스템/AI가 입력을 해석해 다음 흐름을 결정한다.

권장 컬럼(대체안: Player Free-Text Input Table)

- <code>inputId</code> (PK)
- <code>sceneId</code> (FK)
- <code>promptText</code> (플레이어에게 보여줄 질문/유도 문장)
- <code>inputMode</code> (enum): <code>FreeText</code> / <code>ShortText</code> (길이 제한 유무)
- <code>maxChars</code> (optional)
- <code>submitLabel</code> (예: “말하기”, “입력”) (optional)
- <code>aiInterpretRuleId</code> (FK → AI Prompt Rule)
- <code>fallbackId</code> (FK → AI Fallback)
- <code>onSubmit_eventGroupId</code> (optional)

입력 처리 결과(권장)

- 입력을 그대로 UI에 표시(플레이어 발화)
- AI/시스템이 아래 중 일부를 산출해 상태값을 갱신
  - <code>intentKey</code> (의도 분류)
  - <code>scoreDelta_3_1</code> / <code>scoreDelta_3_2</code> (선택)
  - <code>addTags</code> (선택)
  - <code>nextDialogueId</code> (다음 흐름)

#### 3) Dialogue Condition Table (조건 분기)

권장 컬럼

- <code>conditionGroupId</code> (PK)
- <code>conditionId</code> (PK-2)
- <code>target</code> (enum): DialogueShow / InputShow / NextOverride / EventEnable
- <code>varKey</code> (FK → Variable Definition)
- <code>op</code> (enum): <code>==</code>, <code>!=</code>, <code>&gt;</code>, <code>&gt;=</code>, <code>&lt;</code>, <code>&lt;=</code>, <code>contains</code>, <code>notContains</code>
- <code>value</code> (string로 저장하되 type에 따라 파싱)
- <code>onTrue_nextDialogueId</code> (optional)
- <code>onFalse_nextDialogueId</code> (optional)

운영 팁

- “다음 대사 override”를 Condition으로 처리하면, 엔딩/미니엔딩 분기가 자연스럽게 대화 흐름에 녹음.

#### 4) Dialogue Event Table (컷신/사운드/플래그 연동)

권장 컬럼

- <code>eventGroupId</code> (PK)
- <code>eventId</code> (PK-2)
- <code>timing</code> (enum): OnEnter / OnLineStart / OnLineEnd / OnExit
- <code>eventType</code> (enum): SetFlag / AddScore / PlaySfx / PlayBgm / Camera / Timeline / LoadScene / SpawnVfx
- <code>paramA</code>, <code>paramB</code>, <code>paramC</code> (가변 파라미터)

예시

- SetFlag: (<code>varKey</code>, <code>value</code>)
- PlayBgm: (<code>bgmKey</code>, <code>fadeSec</code>)
- Timeline: (<code>timelineKey</code>)

---

### C. NPC/장면 컨텍스트

#### 5) NPC Profile Table (NPC 기본 설정)

권장 컬럼

- <code>speakerId</code> (PK)
- <code>displayName</code>
- <code>role</code> (enum): Player / NPC / AI\_NPC
- <code>personaTags</code> (string array)
- <code>toneGuide</code> (짧은 문장)
- <code>forbiddenTopics</code> (string array)
- <code>defaultPortraitKey</code>

#### 6) NPC State Table (권장: ‘정적 정의’ 중심)

런타임 값은 세이브/런타임 데이터로 두고, 테이블에는 “상태 단계 정의”만 둔다.

권장 컬럼

- <code>speakerId</code> (FK)
- <code>stateId</code> (PK-2)
- <code>stateName</code> (예: Calm / Hurt / Resolved)
- <code>enterConditionGroupId</code> (optional)
- <code>aiRuleId</code> (optional)

#### 7) Scene Context Table (장면 분위기/금지 정보)

AI 안정성을 위해 가장 중요.

권장 컬럼

- <code>sceneId</code> (PK)
- <code>sceneName</code>
- <code>time/space</code> (짧게)
- <code>toneKeywords</code> (예: quiet, bittersweet, lingering)
- <code>allowedInfo</code> (이 장면에서 언급 가능한 정보)
- <code>forbiddenInfo</code> (스포일러/세계관 위반 금지)
- <code>maxAiLength</code> (예: 1\~2문장)
- <code>isMajorCutscene</code> (bool): true면 AI 금지

---

### D. AI 규칙/대체

#### 8) AI Prompt Rule Table (AI 생성 규칙)

권장 컬럼

- <code>aiRuleId</code> (PK)
- <code>ruleName</code>
- <code>useWhen</code> (짧은 설명)
- <code>systemStyle</code> (말투/길이/금지사항)
- <code>requiredInputs</code> (예: sceneId, speakerId, varKeys)
- <code>outputFormat</code> (예: plain text / json)

권장 출력 포맷(단순)

- AI는 “대사 1\~2문장”만 생성
- 선택지 생성 대신, <b>플레이어 입력(주관식)을 해석</b>해서 intent/점수/태그/다음 흐름을 돌려주는 룰을 포함

권장 outputFormat 예시

- <code>json</code>
  - <code>aiLine</code> (AI가 말할 문장, 1\~2문장)
  - <code>intentKey</code> (예: listen / comfort / confront / leave)
  - <code>scoreDelta_3_1</code> / <code>scoreDelta_3_2</code> (optional)
  - <code>addTags</code> (optional)
  - <code>nextDialogueId</code> (optional)

#### 9) AI Fallback Table (AI 실패 대체)

권장 컬럼

- <code>fallbackId</code> (PK)
- <code>fallbackText</code>
- <code>nextDialogueId</code> (optional)
- <code>eventGroupId</code> (optional)

---

### E. 엔딩/미니엔딩(프로젝트 공용)

#### 10) Mini Ending Rule Table (추가, 강력 추천)

특정 구간/챕터에서 사용할 “점수 기반 미니 엔딩(또는 마감 연출)” 규칙을 대화 시스템과 분리해서 관리.

권장 컬럼

- <code>ruleId</code> (PK)
- <code>tier</code> (enum): <code>ClearSharp</code> / <code>ClearHazy</code>
- <code>minScoreA</code>
- <code>minScoreB</code>
- <code>requiredTags</code> (string array)
- <code>missingTagDowngradeTo</code> (optional)
- <code>result_setVarKey</code> (예: <code>miniEndingTier</code>)
- <code>result_value</code>

미니 엔딩 → 대사 연결 방식(권장)

- 룰 계산 결과로 <code>miniEndingTier</code>를 세팅
- Condition Table에서 <code>miniEndingTier</code>에 따라 다음 대사/나레이션/컷신을 갈아끼움

#### 11) Ending State Package Table (선택, 나중 확장)

\<진엔딩/노멀 엔딩 판정 및 AI 대사 규칙> 문서처럼 “상태값 패키지”를 AI에 전달하려면, 어떤 키를 묶어서 전달할지 정의가 필요.

- <code>packageId</code>
- <code>keys</code> (varKey list)
- <code>description</code>

---

데이터 테이블 목록

<table header-row="true">
<colgroup>
<col />
<col />
<col />
<col width="214.00000762939453" />
</colgroup>
<tr>
<td>
우선순위
</td>
<td>
테이블명
</td>
<td>
목적
</td>
<td>
자료
</td>
</tr>
<tr>
<td>
1
</td>
<td>
Dialogue Table
</td>
<td>
대사 본문
</td>
<td></td>
</tr>
<tr>
<td>
1
</td>
<td>
Player Free-Text Input Table
</td>
<td>
플레이어 텍스트 입력(주관식) + AI 해석
</td>
<td></td>
</tr>
<tr>
<td>
1
</td>
<td>
Dialogue Condition Table
</td>
<td>
조건 분기
</td>
<td></td>
</tr>
<tr>
<td>
1
</td>
<td>
Dialogue Event Table
</td>
<td>
컷신/사운드/플래그 연동
</td>
<td></td>
</tr>
<tr>
<td>
1
</td>
<td>
NPC Profile Table
</td>
<td>
NPC 기본 설정
</td>
<td></td>
</tr>
<tr>
<td>
1
</td>
<td>
NPC State Table
</td>
<td>
NPC 현재 상태
</td>
<td></td>
</tr>
<tr>
<td>
2
</td>
<td>
Narration Table
</td>
<td>
나레이션 관리
</td>
<td></td>
</tr>
<tr>
<td>
2
</td>
<td>
Scene Context Table
</td>
<td>
장면 분위기/금지 정보
</td>
<td></td>
</tr>
<tr>
<td>
3
</td>
<td>
AI Prompt Rule Table
</td>
<td>
AI 생성 규칙
</td>
<td></td>
</tr>
<tr>
<td>
3
</td>
<td>
AI Fallback Table
</td>
<td>
AI 실패 대체 대사
</td>
<td></td>
</tr>
</table>

## 1. 퍼즐 목표

※ 본 항목은 퍼즐 목표가 아니라 <b>툴 제작 목표</b> 기준으로 작성

### 툴 목표

이 툴은 게임 내 <b>대화 / 나레이션 / 선택지 / 조사 반응 / 컷신 연동 / AI 생성 대사</b>를 하나의 흐름 안에서 관리하기 위한 시스템이다.

### 이 툴이 해결하려는 문제

- 대사를 코드에 직접 적으면 수정과 관리가 어렵다
- 분기 구조가 많아질수록 흐름 파악이 힘들어진다
- 컷신, 신뢰도, 조사 반응이 대사와 따로 놀 수 있다
- AI NPC를 붙일 경우 설정 붕괴나 스포일러 문제가 생길 수 있다

### 툴을 통해 얻고 싶은 결과

- 고정 대사와 AI 생성 대사를 함께 사용할 수 있다
- 장면별 대화 흐름을 일관되게 유지할 수 있다
- NPC 성격, 감정, 신뢰도에 맞는 반응을 출력할 수 있다
- 컷신/이벤트와 자연스럽게 연결할 수 있다
- 기획자가 데이터 수정만으로 대사를 관리할 수 있다

### 툴 컨셉 문장

<b>스토리 대화의 안정성과 AI 대화의 자연스러움을 함께 갖춘 하이브리드형 대화/나레이션 시스템</b>

---

## 2. 퍼즐 진행 방법

### 2-1. 퍼즐 구성

※ 실제 퍼즐이 아니라 <b>툴 사용 흐름</b> 기준

### 기본 진행 흐름

1. 플레이어가 NPC, 오브젝트, 트리거와 상호작용
2. 시스템이 현재 장면과 상태값을 확인
3. 고정 대화 / AI 대화 / 나레이션 / <b>플레이어 텍스트 입력(주관식) 기반 대화</b> 중 어떤 타입인지 판별
4. 해당 데이터를 불러오거나 AI 응답을 생성
5. UI에 출력
6. 대화 종료 후 입력 결과(의도/태그/점수 보정), 플래그, 컷신, 이벤트를 연동

### 대화 처리 방식 후보

### 후보 A. 고정 대사 중심형

- 모든 대사를 미리 작성
- 안정적이고 구현이 쉬움
- 자유 대화 느낌은 약함

### 후보 B. 하이브리드형

- 핵심 대사는 고정
- 일반 반응, 조사, 자유 질문은 AI 생성
- 가장 현실적이고 추천되는 방식

### 후보 C. AI 생성 중심형

- 대부분의 대사를 AI가 생성
- 자유도는 높지만 서사 통제가 어려움
- 초반 프로젝트에는 비추천

### 추천 방식

<b>후보 B. 하이브리드형</b>

---

### 2-2. 플레이어 상호작용

### 플레이어가 하게 되는 상호작용

- NPC에게 말 걸기
- 오브젝트 조사하기
- 텍스트 입력으로 대화하기(주관식)
- 나레이션 확인하기
- 특정 위치에서 자동 대화 시작하기
- 컷신 직전 대화 트리거 밟기

### 상호작용 결과

- 일반 대사 출력
- 나레이션 출력
- 입력 UI 표시(텍스트 입력)
- 신뢰도 변화
- 오브젝트 조사 반응 출력
- 컷신 시작
- 다음 대화로 분기
- AI 대사 생성 및 출력

### 활용 예시

- 백스테이지에서 피아노를 조사하면 AI NPC가 짧은 감정 반응 출력
- 플레이어가 특정 기억 조각을 찾은 뒤 말 걸면 다른 대사 출력
- 중요한 컷신에서는 고정 대사만 재생
- 자유 대화 구간에서는 AI가 상황에 맞게 자연스럽게 답변

---

## 3. 퍼즐 구성

※ 비퍼즐형 툴이므로 “공간/오브젝트/구조/판정/완료 결과”를 시스템 기준으로 해석

### 3-1. 공간

### 툴이 사용될 공간/상황

- NPC 대화
- 오브젝트 조사
- 컷신 직전/직후
- 맵 진입/종료 구간
- 회상 장면
- 나레이션 구간
- 자유 대화 구간

### 적용 대상 예시

- 플레이어와 음악가의 감정 대화
- 피아노 앞 조사 반응
- 무대 뒤편 나레이션
- 기억 복원 직전 컷신 대사
- 신뢰도에 따른 대화 분기

---

### 3-2. 오브젝트

### 시스템상 필요한 핵심 오브젝트/구성 요소

- Dialogue Manager
- Dialogue Data
- NPC State Data
- Player Input Data
- Narration Data
- Event Trigger
- AI Prompt Builder
- AI Response Parser
- Dialogue UI
- Cutscene Connector

### UI 요소

- 화자 이름창
- 대사 본문창
- 초상화
- 텍스트 입력창
- 전송(Submit) 버튼
- 다음 버튼
- 자동 진행 버튼
- 스킵 버튼
- 로그 버튼
- 나레이션 전용 UI

### 데이터 요소

- 대화 ID
- 장면 ID
- 화자 이름
- 대화 타입
- 대사 내용
- 입력 프롬프트/입력 제한
- 입력 해석 결과(intent/태그/점수 보정)
- 다음 대화 ID
- 조건값
- 이벤트 호출 여부
- AI 사용 여부

---

### 3-3. 구조

### 전체 구조

<b>플레이어 상호작용 → 현재 상태 확인 → 대화 타입 판별 → 데이터 로드 또는 AI 생성 → UI 출력 → 결과 반영</b>

### 구조 제안

### 구조 1. 고정형 구조

- 미리 작성된 대사만 출력
- 컷신 중심 게임에 적합
- 확장성은 낮음

### 구조 2. 하이브리드 구조

- 대화 흐름은 시스템이 잡고
- 실제 문장은 일부 AI가 생성
- 추천 구조

### 구조 3. AI 중심 구조

- 거의 모든 대화를 AI가 생성
- 관리 부담이 큼

### 추천 구조

<b>하이브리드 구조</b>

### 세부 흐름 예시

- NPC와 상호작용
- 현재 장소, 신뢰도, 진행도 확인
- 해당 대화가 고정 대사인지 확인
- 고정이면 즉시 출력
- 주관식 입력 구간이면 입력 UI 표시 → 입력 제출
- AI가 입력을 해석(intent/태그/점수 보정/다음 흐름) + 1\~2문장 응답 생성
- AI 대사 필요 시 프롬프트 생성
- 응답 JSON 파싱
- 대사 UI 표시(플레이어 입력 + AI 응답)
- 입력 결과를 상태값에 반영

---

### 3-4. 판정

### 필요한 판정 요소

- NPC 상호작용 범위
- 오브젝트 조사 범위
- 특정 장면 진입 트리거
- 대화 조건 충족 여부
- 신뢰도 조건
- 아이템/기억 조각 보유 여부
- 컷신 시작 조건
- AI 호출 가능 여부

### 판정 로직 예시

- <code>trust &gt;= 3</code> 이면 친밀한 반응 사용
- <code>memoryPieceFound == true</code> 이면 추가 대사 해금
- <code>scene == 3-3_backstage</code> 이면 백스테이지 전용 반응 사용
- <code>isMajorCutscene == true</code> 이면 AI 생성 차단
- <code>inspectPiano == true</code> 이면 피아노 관련 대사 출력

### 예외 처리

- AI 응답 실패 시 대체 고정 대사 출력
- 조건 미충족 시 기본 대사 출력
- 데이터 누락 시 시스템 메시지 출력 또는 대화 종료

---

### 3-5. 완료 결과

### 툴 제작 완료 시 기대 결과

- 대사 흐름을 코드 수정 없이 데이터 중심으로 관리할 수 있다
- NPC 대화, 나레이션, 조사 반응을 하나의 구조 안에서 처리할 수 있다
- 컷신과 자연스럽게 연동된다
- AI NPC 반응이 장면과 감정에 맞게 출력된다
- 중요한 장면은 고정 대사로 안전하게 유지된다

### 플레이어 입장에서 얻는 결과

- 캐릭터가 더 살아 있는 느낌
- 대화가 상황에 맞게 자연스럽게 이어짐
- 조사와 대사가 따로 놀지 않음
- 컷신 진입 전 감정선이 매끄럽게 이어짐

---

## 4. 연출 요소

### 대사 연출

- 타이핑 효과
- 대사창 등장/퇴장 애니메이션
- 화자 전환 효과
- 초상화 표정 변화
- 특정 키워드 강조

### 나레이션 연출

- 화자 이름 없이 중앙 또는 상단 출력
- 화면 페이드와 함께 등장
- 배경 음악이나 환경음과 함께 분위기 강조

### AI 대사 연출

- 같은 상황에서도 문장이 약간씩 달라짐
- 신뢰도와 감정 상태에 따라 어조 변화
- 자유 대화에서 캐릭터성이 살아남

### 컷신 연출 연동

- 대화 종료 후 Timeline 시작
- 카메라 전환
- 캐릭터 애니메이션 재생
- 사운드 / BGM 변화
- 조명 변화
- 파티클 연출

### 추천 연출 방향

- 일반 대화는 간결하게
- 나레이션은 분위기 전환용으로 사용
- AI 대사는 짧고 캐릭터성 있게
- 중요한 장면은 연출보다 감정 전달 우선

---

## 5. 핵심 시스템 요약

### 핵심 시스템 구성

- Dialogue Manager: 전체 대화 흐름 제어
- Dialogue Data: 고정 대사 데이터 관리
- NPC State Data: 성격, 감정, 신뢰도 등 상태값 관리
- Player Input System: 텍스트 입력 수신 + AI 해석 처리
- Narration System: 나레이션 출력 처리
- AI Prompt Builder: AI에게 보낼 프롬프트 생성
- AI Response Parser: AI 응답 결과 파싱
- Event Connector: 컷신, 사운드, 조명, 퀘스트 연동
- Dialogue UI: 화면 출력 담당

### 시스템 한 줄 요약

<b>대화 흐름은 시스템이 통제하고, AI는 허용된 범위 안에서만 자연스러운 문장을 생성하는 구조</b>

### 가장 중요한 원칙

- 핵심 스토리 장면은 고정 대사
- 자유 대화와 조사 반응은 AI 생성 가능
- AI는 감독 없이 말하는 것이 아니라, 시스템이 짜둔 틀 안에서만 반응
- 실패 시 언제든 고정 대사로 대체 가능해야 함

---

## 6. 구현/연동 메모(업데이트)

### 현재 확정 방향

- 고정 대사 + AI 대사 혼합형 구조 사용
- 핵심 컷신과 감정 절정 대사는 고정 유지
- 자유 대화, 조사 반응, 짧은 코멘트는 AI 사용 가능
- 대사, 나레이션, 선택지, 이벤트를 한 시스템 안에서 관리

### 추후 확정 필요 항목

- 데이터 저장 방식: ScriptableObject / JSON / CSV 중 선택
- AI 호출 방식: API 직접 호출 / 중간 서버 경유
- 응답 포맷: JSON 고정 여부
- 대사창 UI 스타일
- 로그 저장 여부
- 다국어 대응 여부
- 음성 출력 연동 여부

### 추천 구현 순서

1. 고정형 대화 시스템 구현
2. 나레이션 UI 구현
3. 선택지 분기 구현
4. 오브젝트 조사 반응 연결
5. 컷신/이벤트 연동
6. NPC 상태값 반영
7. AI 대화 연동
8. 실패 시 대체 대사 처리
9. 로그 및 디버그 기능 추가

### 구현 시 주의점

- AI 대사는 길어지지 않게 제한할 것
- AI가 스포일러를 말하지 못하게 금지 정보 관리 필요
- 컷신 직전/직후에는 AI 대사 사용 범위를 제한할 것
- 대사 데이터와 컷신 이벤트는 분리 관리할 것
- 디버그용으로 현재 대화 ID, 상태값, 선택 결과를 확인할 수 있어야 함

### 테스트 포인트

- 대사 출력 정상 여부
- 선택지 분기 정상 여부
- 조건에 따른 다른 대사 출력 여부
- AI 응답 실패 시 대체 대사 출력 여부
- 컷신 연동 정상 여부
- 신뢰도 반영 여부
- 로그 저장 및 호출 여부

---

# 후보 정리

## 툴 이름 후보

- 대화/나레이션 툴
- AI NPC 연동 대화 시스템
- 하이브리드 서사 대화 툴
- 컷신 연동 대화 시스템

### 추천 툴명

<b>AI NPC 연동 대화 시스템</b>

## 구조 후보

- 고정형
- 하이브리드형
- AI 중심형

### 추천 구조

<b>하이브리드형</b>

## 데이터 방식 후보

- ScriptableObject
- JSON
- CSV

### 추천

- 초반 구현: <b>ScriptableObject</b>
- 나중 확장: JSON 병행 고려
{% endraw %}
