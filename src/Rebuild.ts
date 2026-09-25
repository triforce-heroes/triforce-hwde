import { BufferBuilder } from "@triforce-heroes/triforce-core/BufferBuilder";

import { describeXL, getEncoding } from "#/Common";
import { extractContainer, extractXLs } from "#/Extract";
import type { Block } from "#/types/Block";
import type { Language } from "#/types/Language";
import { languages } from "#/types/Language";
import { isSkipped, isSplit } from "#/types/Override";
import type { XL } from "#/types/XL";

export function rebuildContainer(blocks: Block[]): Buffer {
  const file = new BufferBuilder();

  file.writeUnsignedInt32(blocks.length);

  const payload = new BufferBuilder();
  const payloadOffset = 4 + blocks.length * 8;

  for (const block of blocks) {
    file.writeUnsignedInt32(payload.length + payloadOffset);
    file.writeUnsignedInt32(block.length);

    payload.push(block);
    payload.pad(4);
  }

  file.push(payload.build());

  return file.build();
}

export function rebuildXLs(xls: XL[]) {
  return xls.length === 1 ? xls.at(0)! : rebuildContainer(xls);
}

export function rebuildRecords(
  xl: XL,
  file: string,
  group: number,
  replacements: Map<string, string>,
) {
  const encoding = getEncoding(file, group);
  const { tableOffset, entryLength, textsOffsets, textOffset, records } = describeXL(
    xl,
    file,
    group,
  );

  const buffer = xl.subarray(0, tableOffset + textOffset);
  const textBuilder = new BufferBuilder();

  for (const [recordIndex, record] of records.entries()) {
    const recordOffset = tableOffset + recordIndex * entryLength;

    for (const [entryIndex, entry] of record.entries()) {
      const key = `${group}.${recordIndex}.${entryIndex}`;

      buffer.writeUInt32LE(
        textOffset + textBuilder.length,
        recordOffset + textsOffsets.at(entryIndex)!,
      );

      textBuilder.writeNullTerminatedString(replacements.get(key) ?? entry, encoding);

      if (encoding === "utf16-le") {
        textBuilder.writeInt16(0);
      }
    }
  }

  const bufferResult = Buffer.concat([buffer, textBuilder.build()]);

  // oxlint-disable-next-line no-bitwise
  bufferResult.writeUInt16LE(bufferResult.length & 0xff_ff, 4);

  return bufferResult;
}

export function rebuild(
  data: Buffer,
  file: string,
  language: Language,
  replacements: Map<string, string>,
): Buffer {
  const languageIndex = languages.indexOf(language);
  const container = extractContainer(data);

  // Split files carry both tables in keys prefixed with the block offset
  // ("1." for table A, "13." for table B). Each table is rebuilt from
  // its own replacements with the prefix stripped.
  if (isSplit(file)) {
    const offsets = [1, 13];
    const blocks = new Map<number, Block>();

    for (const offset of offsets) {
      const blockIndex = offset + languageIndex;
      const prefix = `${offset}.`;
      const tableReplacements = new Map<string, string>();

      for (const [key, value] of replacements) {
        if (key.startsWith(prefix)) {
          tableReplacements.set(key.slice(prefix.length), value);
        }
      }

      blocks.set(
        blockIndex,
        rebuildXLs(
          extractXLs(container.at(blockIndex)!).map((xl, group) =>
            isSkipped(file, group) ? xl : rebuildRecords(xl, file, group, tableReplacements),
          ),
        ),
      );
    }

    return rebuildContainer(container.map((block, index) => blocks.get(index) ?? block));
  }

  const block = rebuildXLs(
    extractXLs(container.at(languageIndex)!).map((xl, group) =>
      isSkipped(file, group) ? xl : rebuildRecords(xl, file, group, replacements),
    ),
  );

  return rebuildContainer([
    ...container.slice(0, languageIndex),
    block,
    ...container.slice(languageIndex + 1),
  ]);
}
