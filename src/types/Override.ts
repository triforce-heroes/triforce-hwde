import { sep } from "node:path";

import { minimatch } from "minimatch";

export const encodingOverride = ["common/msgdata.bin:7"];

export const skipOverride = [
  "battle/btlmessage.bin:5",
  "battle/btlmessage.bin:6",
  "battle/scenario/snstr*.bin:4",
];

// Dual-table language files (25 blocks: 1 control + 12 table A + 12 table B).
// Unlike the rules above, this matches the whole file with no group suffix.
export const splitOverride = ["battle/vmes/snvmes*.bin"];

export function matchRule(rule: string, file: string, group: number): boolean {
  const [filePath, fileGroup] = rule.split(":", 2) as [string, string];

  if (fileGroup === String(group)) {
    const filePathNormalized = filePath.replaceAll(sep, "/");
    const fileNormalized = file.replaceAll(sep, "/");

    if (minimatch(fileNormalized, filePathNormalized)) {
      return true;
    }
  }

  return false;
}

export function isSkipped(file: string, group: number): boolean {
  return skipOverride.some((rule) => matchRule(rule, file, group));
}

export function isSplit(file: string): boolean {
  const fileNormalized = file.replaceAll(sep, "/");

  return splitOverride.some((pattern) => minimatch(fileNormalized, pattern.replaceAll(sep, "/")));
}

export function isEncodingOverride(file: string, group: number): boolean {
  return encodingOverride.some((rule) => matchRule(rule, file, group));
}
