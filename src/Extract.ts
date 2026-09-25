import { BufferConsumer } from "@triforce-heroes/triforce-core/BufferConsumer";

import { describeXL } from "#/Common";
import type { Block } from "#/types/Block";
import type { Language } from "#/types/Language";
import { languages } from "#/types/Language";
import { isSkipped, isSplit } from "#/types/Override";
import { XL_MAGIC, type XL } from "#/types/XL";

export function extractContainer(data: Buffer): Block[] {
  const header = new BufferConsumer(data);
  const count = header.readUnsignedInt32();
  const blocks: Block[] = [];

  for (let index = 0; index < count; index++) {
    const offset = header.readUnsignedInt32();
    const length = header.readUnsignedInt32();

    blocks.push(data.subarray(offset, offset + length));
  }

  return blocks;
}

export function extractXLs(block: Block): XL[] {
  return block.readUInt32LE() === XL_MAGIC ? [block] : extractContainer(block);
}

export function extractRecords(xl: XL, file: string, group: number): string[][] {
  return isSkipped(file, group) ? [] : describeXL(xl, file, group).records;
}

export function extract(data: Buffer, file: string, language: Language): Map<string, string> {
  const languageIndex = languages.indexOf(language);
  const container = extractContainer(data);
  const entries = new Map<string, string>();

  // Split files expose both tables in one map, prefixing references with
  // the block offset (1 for table A, 13 for table B). Adding the offset
  // to the language index lands on the right block of each table.
  const split = isSplit(file);
  const offsets = split ? [1, 13] : [0];

  for (const offset of offsets) {
    const prefix = split ? `${offset}.` : "";
    const block = container.at(offset + languageIndex)!;

    for (const [group, xl] of extractXLs(block).entries()) {
      const records = extractRecords(xl, file, group);

      for (const [index, record] of records.entries()) {
        for (const [position, entry] of record.entries()) {
          if (!["", "0"].includes(entry)) {
            entries.set(`${prefix}${group}.${index}.${position}`, entry);
          }
        }
      }
    }
  }

  return entries;
}
