//#region src/types/Block.d.ts
type Block = Buffer;
//#endregion
//#region src/types/Language.d.ts
declare const languages: readonly ["ja", "en", "fr-EU", "de", "it", "es-EU", "en-EU", "fr", "es", "ko", "zh-Hans", "zh-Hant"];
type Language = (typeof languages)[number];
//#endregion
//#region src/types/XL.d.ts
type XL = Block;
//#endregion
export { Language as n, Block as r, XL as t };