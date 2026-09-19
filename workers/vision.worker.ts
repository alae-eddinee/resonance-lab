import {
  toGrayscale,
  subtractBackground,
  otsuThreshold,
  applyThreshold,
  connectedComponents,
  edgeDensity,
  foregroundFraction,
  symmetryScore,
  rotationalSymmetryScore,
  patternComplexity,
} from "../lib/vision/imageProcessing";

export interface VisionAnalysisRequest {
  requestId: number;
  width: number;
  height: number;
  /** RGBA bytes, same layout as ImageData.data */
  pixels: Uint8ClampedArray;
  manualThreshold?: number;
  subtractBg: boolean;
}

export interface VisionAnalysisResponse {
  requestId: number;
  threshold: number;
  foregroundFraction: number;
  edgeDensity: number;
  componentCount: number;
  largestComponents: number[];
  verticalSymmetry: number;
  horizontalSymmetry: number;
  rotational4Fold: number;
  complexity: number;
  maskPixels: Uint8Array;
}

self.onmessage = (event: MessageEvent<VisionAnalysisRequest>) => {
  const { requestId, width, height, pixels, manualThreshold, subtractBg } = event.data;
  const imageData = { width, height, data: pixels } as ImageData;
  let gray = toGrayscale(imageData);
  if (subtractBg) gray = subtractBackground(gray);

  const threshold = manualThreshold ?? otsuThreshold(gray);
  const mask = applyThreshold(gray, threshold);
  const components = connectedComponents(mask, 6);

  const response: VisionAnalysisResponse = {
    requestId,
    threshold,
    foregroundFraction: foregroundFraction(mask),
    edgeDensity: edgeDensity(mask),
    componentCount: components.count,
    largestComponents: components.sizes.sort((a, b) => b - a).slice(0, 5),
    verticalSymmetry: symmetryScore(mask, "vertical"),
    horizontalSymmetry: symmetryScore(mask, "horizontal"),
    rotational4Fold: rotationalSymmetryScore(mask, 90),
    complexity: patternComplexity(mask),
    maskPixels: mask.data,
  };

  (self as unknown as Worker).postMessage(response, [response.maskPixels.buffer]);
};
