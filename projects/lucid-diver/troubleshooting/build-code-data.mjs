import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const unityRoot =
  process.env.LUCID_UNITY_ROOT ??
  "C:/GitHubProjects/UnityProject_LucidDiver";

const files = [
  {
    id: "LocalInputReader",
    path: "Assets/02_Scripts/System/Player/LocalInputReader.cs",
    responsibility:
      "UI와 플레이어 액션맵을 전환하고, 여러 시스템의 입력 차단 요청을 소스별로 관리합니다.",
  },
  {
    id: "TutorialManager",
    path: "Assets/02_Scripts/System/Tutorial/TutorialManager.cs",
    responsibility:
      "튜토리얼 단계 진행, 팝업 표시, 전투 실습 제어와 입력 복구 타이밍을 총괄합니다.",
  },
  {
    id: "TutorialTrigger",
    path: "Assets/02_Scripts/System/Tutorial/TutorialTrigger.cs",
    responsibility:
      "플레이어 진입과 단계 조건을 확인해 튜토리얼 진행 이벤트를 전달합니다.",
  },
  {
    id: "TutorialPopup",
    path: "Assets/02_Scripts/System/Tutorial/TutorialPopup.cs",
    responsibility:
      "안내 UI의 표시·닫기 흐름을 담당하고 게임 입력과 UI 입력의 경계를 유지합니다.",
  },
];

const data = Object.fromEntries(
  files.map((file) => [
    file.id,
    {
      id: file.id,
      sourcePath: file.path,
      responsibility: file.responsibility,
      code: readFileSync(join(unityRoot, file.path), "utf8").replace(/^\uFEFF/, ""),
    },
  ]),
);

const output = `/* Unity 현재본에서 생성한 포트폴리오용 읽기 전용 코드 스냅샷입니다. */\nwindow.TROUBLESHOOTING_CODE_FILES = ${JSON.stringify(data, null, 2)};\n`;

writeFileSync(join(here, "troubleshooting-code-data.js"), output, "utf8");
