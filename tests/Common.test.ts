import { describe, expect, it } from "vitest";

import { isEncodingOverride, isSplit } from "#/types/Override";

describe("isEncodingOverride()", () => {
  it("isEncodingOverride()", () => {
    expect(isEncodingOverride("common/msgdata.bin", 6)).toBe(false);
    expect(isEncodingOverride("common/msgdata.bin", 7)).toBe(true);
  });
});

describe("isSplit()", () => {
  it("isSplit()", () => {
    expect(isSplit("battle/vmes/snvmes000.bin")).toBe(true);
    expect(isSplit("battle/scenario/snstr000.bin")).toBe(false);
    expect(isSplit("common/msgdata.bin")).toBe(false);
  });
});
