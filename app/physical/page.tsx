"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { SliderField } from "@/components/ui/ParameterField";
import { Button } from "@/components/ui/Button";
import { SaveExperimentButton } from "@/components/experiments/SaveExperimentButton";
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
  type GrayscaleImage,
} from "@/lib/vision/imageProcessing";

const MAX_DIMENSION = 320;

export default function PhysicalPage() {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [subtractBg, setSubtractBg] = useState(true);
  const [manualThreshold, setManualThreshold] = useState<number | null>(null);
  const [invert, setInvert] = useState(false);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const grayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const [metrics, setMetrics] = useState<{
    threshold: number;
    foreground: number;
    edges: number;
    components: number;
    vSymmetry: number;
    hSymmetry: number;
    rotational: number;
    complexity: number;
  } | null>(null);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImageEl(img);
      setFileName(file.name);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  useEffect(() => {
    if (!imageEl) return;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(imageEl.width, imageEl.height));
    const w = Math.round(imageEl.width * scale);
    const h = Math.round(imageEl.height * scale);

    const orig = originalCanvasRef.current;
    const gray = grayCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!orig || !gray || !mask) return;

    [orig, gray, mask].forEach((c) => {
      c.width = w;
      c.height = h;
    });

    const origCtx = orig.getContext("2d")!;
    origCtx.drawImage(imageEl, 0, 0, w, h);
    const imageData = origCtx.getImageData(0, 0, w, h);

    let grayImg: GrayscaleImage = toGrayscale(imageData);
    if (subtractBg) grayImg = subtractBackground(grayImg);

    const grayCtx = gray.getContext("2d")!;
    const grayImageData = grayCtx.createImageData(w, h);
    for (let i = 0; i < grayImg.data.length; i++) {
      grayImageData.data[i * 4] = grayImg.data[i];
      grayImageData.data[i * 4 + 1] = grayImg.data[i];
      grayImageData.data[i * 4 + 2] = grayImg.data[i];
      grayImageData.data[i * 4 + 3] = 255;
    }
    grayCtx.putImageData(grayImageData, 0, 0);

    const threshold = manualThreshold ?? otsuThreshold(grayImg);
    const binaryMask = applyThreshold(grayImg, threshold, invert);

    const maskCtx = mask.getContext("2d")!;
    const maskImageData = maskCtx.createImageData(w, h);
    for (let i = 0; i < binaryMask.data.length; i++) {
      const v = binaryMask.data[i] === 1 ? 220 : 20;
      maskImageData.data[i * 4] = v;
      maskImageData.data[i * 4 + 1] = binaryMask.data[i] === 1 ? 195 : 20;
      maskImageData.data[i * 4 + 2] = binaryMask.data[i] === 1 ? 142 : 22;
      maskImageData.data[i * 4 + 3] = 255;
    }
    maskCtx.putImageData(maskImageData, 0, 0);

    const components = connectedComponents(binaryMask, 6);
    setMetrics({
      threshold,
      foreground: foregroundFraction(binaryMask),
      edges: edgeDensity(binaryMask),
      components: components.count,
      vSymmetry: symmetryScore(binaryMask, "vertical"),
      hSymmetry: symmetryScore(binaryMask, "horizontal"),
      rotational: rotationalSymmetryScore(binaryMask, 90),
      complexity: patternComplexity(binaryMask),
    });
  }, [imageEl, subtractBg, manualThreshold, invert]);

  return (
    <div>
      <PageHeader
        title="Real Experiment Analyzer"
        description="Measure visible patterns in uploaded footage."
        actions={
          <SaveExperimentButton
            disabled={!metrics}
            disabledReason="Upload an image to measure a pattern"
            buildRecord={() => ({
              sourceType: "physical-footage",
              evidenceCategories: ["footage-measurement"],
              activeModeIds: [],
              measurements: (metrics
                ? {
                    threshold: metrics.threshold,
                    foregroundFraction: metrics.foreground,
                    edgeDensity: metrics.edges,
                    connectedComponents: metrics.components,
                    verticalSymmetry: metrics.vSymmetry,
                    horizontalSymmetry: metrics.hSymmetry,
                    rotationalSymmetry: metrics.rotational,
                    complexity: metrics.complexity,
                  }
                : {}) as Record<string, number>,
            })}
          />
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {!imageEl ? (
          <FileDropzone accept="image/*" label="Choose a plate photograph" onFile={handleFile} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">{fileName}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stage title="Original">
                <canvas ref={originalCanvasRef} className="w-full rounded-[var(--radius-sm)]" />
              </Stage>
              <Stage title="Grayscale / background subtracted">
                <canvas ref={grayCanvasRef} className="w-full rounded-[var(--radius-sm)]" />
              </Stage>
              <Stage title="Segmentation" evidence>
                <canvas ref={maskCanvasRef} className="w-full rounded-[var(--radius-sm)]" />
              </Stage>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={subtractBg} onChange={(e) => setSubtractBg(e.target.checked)} className="h-5 w-5" />
                  Subtract background
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} className="h-5 w-5" />
                  Invert mask (bright sand on dark plate)
                </label>
                <SliderField
                  label="Manual threshold override"
                  value={manualThreshold ?? metrics?.threshold ?? 128}
                  min={0}
                  max={255}
                  step={1}
                  onChange={setManualThreshold}
                />
                <Button variant="tertiary" onClick={() => setManualThreshold(null)}>
                  Use automatic threshold
                </Button>
                <Button variant="tertiary" onClick={() => setImageEl(null)}>
                  Upload a different image
                </Button>
              </div>

              {metrics && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
                  <h3 className="mb-2 text-sm font-semibold">Pattern measurements</h3>
                  <table className="w-full text-left text-sm">
                    <tbody>
                      <MetricRow label="Threshold used" value={metrics.threshold.toFixed(0)} />
                      <MetricRow label="Foreground (sand) fraction" value={metrics.foreground.toFixed(3)} />
                      <MetricRow label="Edge density" value={metrics.edges.toFixed(3)} />
                      <MetricRow label="Connected components" value={String(metrics.components)} />
                      <MetricRow label="Vertical symmetry" value={metrics.vSymmetry.toFixed(3)} />
                      <MetricRow label="Horizontal symmetry" value={metrics.hSymmetry.toFixed(3)} />
                      <MetricRow label="Rotational symmetry (90°)" value={metrics.rotational.toFixed(3)} />
                      <MetricRow label="Pattern complexity" value={metrics.complexity.toFixed(2)} />
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                    Estimates from this footage and the current processing settings; uncalibrated pixel measurements,
                    not physical distances or forces.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stage({ title, evidence, children }: { title: string; evidence?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)]">{title}</h3>
        {evidence && <EvidenceBadge category="footage-measurement" />}
      </div>
      {children}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-[var(--color-divider)]">
      <td className="py-1 text-[var(--color-text-secondary)]">{label}</td>
      <td className="py-1 text-right tabular-nums">{value}</td>
    </tr>
  );
}
