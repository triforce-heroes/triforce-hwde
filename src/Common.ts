import { BufferConsumer } from "@triforce-heroes/triforce-core";
import type { TextEncoding } from "@triforce-heroes/triforce-core/Encoding";

import { isEncodingOverride } from "#/types/Override";
import type { XL } from "#/types/XL";

export function getEncoding(file: string, group: number): TextEncoding {
  return isEncodingOverride(file, group) ? "utf16-le" : "cp1252";
}

export function describeXL(xl: XL, file: string, group: number) {
  const encoding = getEncoding(file, group);

  const reader = new BufferConsumer(xl);
  reader.skip(4 + 2); // (magic) + (file length)
  const descriptorsCount = reader.readUnsignedInt16();
  const entriesCount = reader.readUnsignedInt16();
  const entryLength = reader.readUnsignedInt16();
  const tableOffset = reader.readUnsignedInt32();
  const textOffset = entriesCount * entryLength;

  const textsOffsets: number[] = [];
  let descriptorOffset = 0;

  for (let i = 0; i < descriptorsCount; i++) {
    switch (reader.readInt8()) {
      case 0x00: {
        textsOffsets.push(descriptorOffset);
        descriptorOffset += 4;
        break;
      }

      case 0x01: {
        descriptorOffset += 4;
        break;
      }

      case 0x02: {
        descriptorOffset += 2;
        break;
      }

      case 0x03: {
        descriptorOffset += 1;
        break;
      }

      default:
      // empty
    }
  }

  const records: string[][] = [];
  const textReader = new BufferConsumer(xl, tableOffset + textOffset);

  for (let i = 0; i < entriesCount; i++) {
    const entries: string[] = [];

    // oxlint-disable-next-line typescript/prefer-for-of
    for (let j = 0; j < textsOffsets.length; j++) {
      entries.push(textReader.readNullTerminatedString(encoding));

      if (encoding === "utf16-le") {
        textReader.skip(2);
      }
    }

    records.push(entries);
  }

  return { tableOffset, entryLength, textOffset, textsOffsets, records };
}
