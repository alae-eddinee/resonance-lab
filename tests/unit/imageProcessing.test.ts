import { describe, expect, it } from "vitest";
import { applyThreshold, connectedComponents, symmetryScore, type GrayscaleImage } from "@/lib/vision/imageProcessing";

function makeSymmetricImage(size: number): GrayscaleImage {
  const data = new Uint8ClampedArray(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mirrored = size - 1 - x;
      const isDot = (x - size / 2) ** 2 + (y - size / 2) ** 2 < (size / 4) ** 2;
      data[y * size + x] = isDot ? 200 : 0;
      data[y * size + mirrored] = isDot ? 200 : data[y * size + mirrored];
    }
  }
  return { width: size, height: size, data };
}

describe("applyThreshold", () => {
  it("separates bright pixels from dark", () => {
    const gray: GrayscaleImage = { width: 2, height: 1, data: new Uint8ClampedArray([10, 250]) };
    const mask = applyThreshold(gray, 128);
    expect(Array.from(mask.data)).toEqual([0, 1]);
  });
});

describe("connectedComponents", () => {
  it("counts two separate blobs", () => {
    const width = 5;
    const height = 1;
    const data = new Uint8Array([1, 1, 0, 1, 1]);
    const { count } = connectedComponents({ width, height, data }, 1);
    expect(count).toBe(2);
  });
});

describe("symmetryScore", () => {
  it("scores a mirror-symmetric mask near 1", () => {
    const gray = makeSymmetricImage(32);
    const mask = applyThreshold(gray, 128);
    expect(symmetryScore(mask, "vertical")).toBeGreaterThan(0.9);
  });
});
