import type { SnapshotSerializer } from "vitest";

export default {
  test(val) {
    return Buffer.isBuffer(val);
  },
  serialize(val: Buffer) {
    return `Buffer(${val.length})`;
  },
} satisfies SnapshotSerializer;
