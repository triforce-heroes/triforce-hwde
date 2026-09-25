import { glob, readFile } from "node:fs/promises";
import { basename, join, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { extract, extractContainer, extractRecords, extractXLs } from "#/Extract";
import { rebuild, rebuildContainer, rebuildRecords, rebuildXLs } from "#/Rebuild";
import { languageEnglish, languages, languageSupported, type Language } from "#/types/Language";
import { isSkipped, isSplit } from "#/types/Override";

const files = await Array.fromAsync(glob("**/*.bin", { cwd: "tests/fixtures" }));
const entries = files.map((file) => ({
  file: file.replaceAll(sep, "/"),
  data: readFile(join("tests/fixtures", file)),
}));

describe("extractContainer()", () => {
  it.each(entries)("extractContainer($file)", async ({ file, data }) => {
    expect.assertions(3);

    const dataAwaited = await data;
    const container = extractContainer(dataAwaited);

    await expect(container).toMatchFileSnapshot(`snaps/extractContainer/${basename(file)}.snap`);

    const rebuilded = rebuildContainer(container);

    expect(rebuilded).toHaveLength(dataAwaited.length);
    expect(rebuilded.toHex()).toStrictEqual(dataAwaited.toHex());
  });
});

describe("extractXLs()", () => {
  it.each(entries)("extractXLs($file)", async ({ file, data }) => {
    expect.assertions(3);

    const block = extractContainer(await data).at(languages.indexOf(languageEnglish))!;
    const xls = extractXLs(block);

    await expect(xls).toMatchFileSnapshot(`snaps/extractXLs/${basename(file)}.snap`);

    const rebuilded = rebuildXLs(xls);

    expect(rebuilded).toHaveLength(block.length);
    expect(rebuilded.toHex()).toStrictEqual(block.toHex());
  });
});

describe("extractRecords()", async () => {
  interface Test {
    xl: Buffer;
    file: string;
    group: number;
    language: Language;
    snapshot: string;
  }

  const tests: Test[] = [];

  for (const entry of entries) {
    // oxlint-disable-next-line no-await-in-loop
    const container = extractContainer(await entry.data);

    for (const language of languageSupported) {
      // Split files expose table A (offset 1) and table B (offset 13).
      const split = isSplit(entry.file);
      const offsets = split ? [1, 13] : [0];

      for (const offset of offsets) {
        const block = container.at(offset + languages.indexOf(language))!;
        const xls = extractXLs(block);

        for (const [group, xl] of xls.entries()) {
          if (!isSkipped(entry.file, group)) {
            const snapshot = split
              ? `snaps/extractRecords/${basename(entry.file)}/${language}/${offset}.${group}.snap`
              : `snaps/extractRecords/${basename(entry.file)}/${language}/${group}.snap`;

            tests.push({ ...entry, xl, group, language, snapshot });
          }
        }
      }
    }
  }

  it.each(tests)("extractRecords(xl, $file, $group)", async ({ file, xl, group, snapshot }) => {
    expect.assertions(3);

    await expect(extractRecords(xl, file, group)).toMatchFileSnapshot(snapshot);

    const rebuilded = rebuildRecords(xl, file, group, new Map());

    expect(rebuilded).toHaveLength(xl.length);
    expect(rebuilded.toHex()).toStrictEqual(xl.toHex());
  });

  it("rebuildRecords() with replacements", async () => {
    expect.assertions(1);

    const container = extractContainer(await readFile("tests/fixtures/common/msgdata.bin"));
    const block = container.at(languages.indexOf(languageEnglish))!;
    const xl = extractXLs(block).at(0)!;

    const file = "common/msgdata";
    const group = 0;

    const rebuilded = rebuildRecords(
      xl,
      file,
      group,
      new Map([
        ["0.0.0", "test"],
        ["0.0.1", "ignore"],
        ["0.1.0", "ação"],
      ]),
    );

    await expect(extractRecords(rebuilded, file, group)).toMatchFileSnapshot(
      `snaps/rebuildRecords.snap`,
    );
  });
});

describe("extract()", () => {
  interface Test {
    file: string;
    data: Promise<Buffer>;
    language: Language;
  }

  const tests: Test[] = [];

  for (const entry of entries) {
    for (const language of languageSupported) {
      tests.push({ ...entry, language });
    }
  }

  it.each(tests)("extract(data, $file, $language)", async ({ file, data, language }) => {
    expect.assertions(3);

    const dataAwaited = await data;

    await expect(extract(dataAwaited, file, language)).toMatchFileSnapshot(
      `snaps/extract/${basename(file)}/${language}.snap`,
    );

    const rebuilded = rebuild(dataAwaited, file, language, new Map());

    expect(rebuilded).toHaveLength(dataAwaited.length);
    expect(rebuilded.toHex()).toStrictEqual(dataAwaited.toHex());
  });
});
