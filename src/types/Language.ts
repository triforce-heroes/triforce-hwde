export const languages = [
  "ja",
  "en",
  "fr-EU",
  "de",
  "it",
  "es-EU",
  "en-EU",
  "fr",
  "es",
  "ko",
  "zh-Hans",
  "zh-Hant",
] as const;

export type Language = (typeof languages)[number];

export const languageEnglish: Language = "en";

export const languageSupported: Language[] = [
  "en",
  "fr-EU",
  "de",
  "it",
  "es-EU",
  "en-EU",
  "fr",
  "es",
];

export const languageRequired: Language[] = ["en", "es", "fr", "it"];
