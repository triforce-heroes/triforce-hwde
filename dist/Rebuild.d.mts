import { n as Language, r as Block, t as XL } from "./XL-Cvd9wmHQ.mjs";
//#region src/Rebuild.d.ts
export declare function rebuildContainer(blocks: Block[]): Buffer;
export declare function rebuildXLs(xls: XL[]): Block;
export declare function rebuildRecords(xl: XL, file: string, group: number, replacements: Map<string, string>): Buffer<ArrayBuffer>;
export declare function rebuild(data: Buffer, file: string, language: Language, replacements: Map<string, string>): Buffer;
//#endregion