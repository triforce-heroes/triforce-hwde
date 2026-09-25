import { n as Language, r as Block, t as XL } from "./XL-Cvd9wmHQ.mjs";
//#region src/Extract.d.ts
export declare function extractContainer(data: Buffer): Block[];
export declare function extractXLs(block: Block): XL[];
export declare function extractRecords(xl: XL, file: string, group: number): string[][];
export declare function extract(data: Buffer, file: string, language: Language): Map<string, string>;
//#endregion