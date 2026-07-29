import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, "enemy-code-data.js");
const unityRoot =
  process.env.LUCID_UNITY_ROOT ??
  "C:/GitHubProjects/UnityProject_LucidDiver";

const context = { window: {} };
vm.runInNewContext(readFileSync(dataPath, "utf8"), context);

const refreshed = Object.fromEntries(
  Object.entries(context.window.ENEMY_CODE_FILES ?? {}).map(([id, file]) => [
    id,
    {
      ...file,
      code: readFileSync(join(unityRoot, file.sourcePath), "utf8").replace(/^\uFEFF/, ""),
    },
  ]),
);

const output = `/* Unity 현재본에서 생성한 발표·포트폴리오용 읽기 전용 코드 스냅샷입니다. */\nwindow.ENEMY_CODE_FILES = ${JSON.stringify(refreshed, null, 2)};\n`;
writeFileSync(dataPath, output, "utf8");
