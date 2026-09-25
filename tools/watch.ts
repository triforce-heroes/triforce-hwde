import { glob, readFile } from "node:fs/promises";
import { join, sep } from "node:path";

import { Publisher } from "@triforce-heroes/triforce-publisher";

import { extract } from "#/Extract";
import { languageRequired, languageSupported, type Language } from "#/types/Language";

const publisher = new Publisher(11);

for (const language of languageSupported) {
  publisher.addLanguage(language);
}

const files = await Array.fromAsync(glob("**/*.bin", { cwd: "tests/fixtures" }));

for (const file of files) {
  const resource = file.replaceAll(sep, "/").split(".").at(0)!;
  // oxlint-disable-next-line no-await-in-loop
  const content = await readFile(join("tests/fixtures", file));

  const entriesByLanguage = new Map<Language, Map<string, string>>();

  for (const language of languageSupported) {
    entriesByLanguage.set(language, extract(content, file, language));
  }

  const references = new Set<string>();

  for (const entries of entriesByLanguage.values()) {
    for (const reference of entries.keys()) {
      references.add(reference);
    }
  }

  for (const reference of references) {
    // Skip dead text: only publish when every required language has the reference.
    if (!languageRequired.every((language) => entriesByLanguage.get(language)!.has(reference))) {
      continue;
    }

    for (const language of languageSupported) {
      const text = entriesByLanguage.get(language)!.get(reference);

      if (text === undefined) {
        continue;
      }

      publisher.addReference(language, resource, reference, text);
    }
  }
}

await publisher.save("tools/resources");
