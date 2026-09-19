export type WindowType = "hann" | "hamming" | "blackman" | "rectangular";

export function windowCoefficients(type: WindowType, size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    switch (type) {
      case "hann":
        w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
        break;
      case "hamming":
        w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
        break;
      case "blackman":
        w[i] =
          0.42 -
          0.5 * Math.cos((2 * Math.PI * i) / (size - 1)) +
          0.08 * Math.cos((4 * Math.PI * i) / (size - 1));
        break;
      case "rectangular":
      default:
        w[i] = 1;
    }
  }
  return w;
}

export function applyWindow(samples: Float32Array, window: Float32Array): Float32Array {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * window[i];
  return out;
}
