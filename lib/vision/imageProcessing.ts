export interface GrayscaleImage {
  width: number;
  height: number;
  /** 0-255 per pixel */
  data: Uint8ClampedArray;
}

export function toGrayscale(imageData: ImageData): GrayscaleImage {
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    out[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return { width, height, data: out };
}

/** Simple background subtraction: estimates background via large-radius box blur, subtracts it. */
export function subtractBackground(gray: GrayscaleImage, radius = 15): GrayscaleImage {
  const background = boxBlur(gray, radius);
  const out = new Uint8ClampedArray(gray.data.length);
  for (let i = 0; i < gray.data.length; i++) {
    out[i] = Math.max(0, 128 + gray.data[i] - background.data[i]);
  }
  return { width: gray.width, height: gray.height, data: out };
}

export function boxBlur(gray: GrayscaleImage, radius: number): GrayscaleImage {
  const { width, height, data } = gray;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy += Math.max(1, Math.floor(radius / 4))) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += Math.max(1, Math.floor(radius / 4))) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          sum += data[yy * width + xx];
          count++;
        }
      }
      out[y * width + x] = count > 0 ? sum / count : data[y * width + x];
    }
  }
  return { width, height, data: out };
}

/** Otsu's method for automatic global threshold selection. */
export function otsuThreshold(gray: GrayscaleImage): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < gray.data.length; i++) histogram[gray.data[i]]++;
  const total = gray.data.length;

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histogram[t];

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) ** 2;
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}

export interface BinaryMask {
  width: number;
  height: number;
  data: Uint8Array;
}

export function applyThreshold(gray: GrayscaleImage, threshold: number, invert = false): BinaryMask {
  const data = new Uint8Array(gray.data.length);
  for (let i = 0; i < gray.data.length; i++) {
    const on = gray.data[i] >= threshold;
    data[i] = (invert ? !on : on) ? 1 : 0;
  }
  return { width: gray.width, height: gray.height, data };
}

/** Connected-component labeling via flood fill (4-connectivity). */
export function connectedComponents(mask: BinaryMask, minSize = 8): { count: number; sizes: number[] } {
  const { width, height, data } = mask;
  const visited = new Uint8Array(data.length);
  const sizes: number[] = [];
  const stack: number[] = [];

  for (let start = 0; start < data.length; start++) {
    if (data[start] === 0 || visited[start]) continue;
    stack.push(start);
    visited[start] = 1;
    let size = 0;
    while (stack.length > 0) {
      const idx = stack.pop()!;
      size++;
      const x = idx % width;
      const y = Math.floor(idx / width);
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (data[nIdx] === 1 && !visited[nIdx]) {
          visited[nIdx] = 1;
          stack.push(nIdx);
        }
      }
    }
    if (size >= minSize) sizes.push(size);
  }
  return { count: sizes.length, sizes };
}

export function edgeDensity(mask: BinaryMask): number {
  const { width, height, data } = mask;
  let edges = 0;
  let total = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      total++;
      const center = data[idx];
      if (
        data[idx - 1] !== center ||
        data[idx + 1] !== center ||
        data[idx - width] !== center ||
        data[idx + width] !== center
      ) {
        edges++;
      }
    }
  }
  return total === 0 ? 0 : edges / total;
}

export function foregroundFraction(mask: BinaryMask): number {
  let on = 0;
  for (let i = 0; i < mask.data.length; i++) on += mask.data[i];
  return on / mask.data.length;
}

/** Fraction of foreground pixels mirrored across the vertical/horizontal axis. */
export function symmetryScore(mask: BinaryMask, axis: "vertical" | "horizontal"): number {
  const { width, height, data } = mask;
  let matches = 0;
  let total = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const mirrorX = axis === "vertical" ? width - 1 - x : x;
      const mirrorY = axis === "horizontal" ? height - 1 - y : y;
      const mirrorIdx = mirrorY * width + mirrorX;
      if (data[idx] === 1 || data[mirrorIdx] === 1) {
        total++;
        if (data[idx] === data[mirrorIdx]) matches++;
      }
    }
  }
  return total === 0 ? 1 : matches / total;
}

/** Rotational symmetry at a given angle (degrees), sampled via nearest-neighbor rotation about center. */
export function rotationalSymmetryScore(mask: BinaryMask, degrees: number): number {
  const { width, height, data } = mask;
  const cx = width / 2;
  const cy = height / 2;
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  let matches = 0;
  let total = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (data[idx] === 0) continue;
      const dx = x - cx;
      const dy = y - cy;
      const rx = Math.round(cx + dx * cos - dy * sin);
      const ry = Math.round(cy + dx * sin + dy * cos);
      if (rx < 0 || rx >= width || ry < 0 || ry >= height) continue;
      total++;
      if (data[ry * width + rx] === 1) matches++;
    }
  }
  return total === 0 ? 0 : matches / total;
}

export function patternComplexity(mask: BinaryMask): number {
  const components = connectedComponents(mask, 4);
  const density = edgeDensity(mask);
  return components.count * 0.15 + density * 10;
}
