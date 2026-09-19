"use client";

import { SelectField, SliderField, ControlSection } from "@/components/ui/ParameterField";
import { MATERIAL_PRESETS, findMaterial } from "@/lib/physics/materials";
import type { PlateConfig } from "@/lib/physics/types";

export function PlateConfigEditor({
  config,
  onChange,
  controlMode,
}: {
  config: PlateConfig;
  onChange: (config: PlateConfig) => void;
  controlMode: "basic" | "advanced";
}) {
  return (
    <div className="flex flex-col gap-4">
      {controlMode === "basic" && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {config.geometry.shape}, {(config.geometry.thicknessM * 1000).toFixed(2)} mm {config.material.name}, {config.boundary}.
          Switch to Advanced to edit geometry, material, and boundary directly.
        </p>
      )}

      <div>
        <p className="mb-1.5 text-sm text-[var(--color-text-secondary)]">Excitation position</p>
        <div className="grid grid-cols-2 gap-3">
          <SliderField
            label="X"
            value={config.exciterPosition.x}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ ...config, exciterPosition: { ...config.exciterPosition, x: v } })}
          />
          <SliderField
            label="Y"
            value={config.exciterPosition.y}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ ...config, exciterPosition: { ...config.exciterPosition, y: v } })}
          />
        </div>
      </div>

      {controlMode === "advanced" && (
        <ControlSection title="Geometry and material">
          <SelectField
            label="Shape"
            value={config.geometry.shape}
            onChange={(shape) => onChange({ ...config, geometry: { ...config.geometry, shape: shape as PlateConfig["geometry"]["shape"] } })}
            options={[
              { value: "square", label: "Square" },
              { value: "rectangle", label: "Rectangle" },
              { value: "circle", label: "Circle" },
            ]}
          />

          {config.geometry.shape === "circle" ? (
            <SliderField
              label="Radius"
              unit="mm"
              value={config.geometry.radiusM * 1000}
              min={30}
              max={300}
              step={1}
              onChange={(v) => onChange({ ...config, geometry: { ...config.geometry, radiusM: v / 1000 } })}
            />
          ) : (
            <>
              <SliderField
                label="Width"
                unit="mm"
                value={config.geometry.widthM * 1000}
                min={30}
                max={400}
                step={1}
                onChange={(v) =>
                  onChange({
                    ...config,
                    geometry: {
                      ...config.geometry,
                      widthM: v / 1000,
                      heightM: config.geometry.shape === "square" ? v / 1000 : config.geometry.heightM,
                    },
                  })
                }
              />
              {config.geometry.shape === "rectangle" && (
                <SliderField
                  label="Height"
                  unit="mm"
                  value={config.geometry.heightM * 1000}
                  min={30}
                  max={400}
                  step={1}
                  onChange={(v) => onChange({ ...config, geometry: { ...config.geometry, heightM: v / 1000 } })}
                />
              )}
            </>
          )}

          <SliderField
            label="Thickness"
            unit="mm"
            value={config.geometry.thicknessM * 1000}
            min={0.2}
            max={6}
            step={0.05}
            onChange={(v) => onChange({ ...config, geometry: { ...config.geometry, thicknessM: v / 1000 } })}
          />

          <SelectField
            label="Material"
            value={config.material.id}
            onChange={(id) => onChange({ ...config, material: findMaterial(id) })}
            options={MATERIAL_PRESETS.map((m) => ({ value: m.id, label: m.name }))}
          />
        </ControlSection>
      )}

      {controlMode === "advanced" && (
        <ControlSection title="Material properties">
          <SliderField
            label="Density"
            unit="kg/m³"
            value={config.material.densityKgM3}
            min={500}
            max={20000}
            step={10}
            onChange={(v) => onChange({ ...config, material: { ...config.material, id: "custom", name: "Custom", densityKgM3: v } })}
          />
          <SliderField
            label="Young's modulus"
            unit="GPa"
            value={config.material.youngsModulusGPa}
            min={10}
            max={450}
            step={1}
            onChange={(v) => onChange({ ...config, material: { ...config.material, id: "custom", name: "Custom", youngsModulusGPa: v } })}
          />
          <SliderField
            label="Poisson ratio"
            value={config.material.poissonRatio}
            min={0.1}
            max={0.45}
            step={0.01}
            onChange={(v) => onChange({ ...config, material: { ...config.material, id: "custom", name: "Custom", poissonRatio: v } })}
          />
        </ControlSection>
      )}

      {controlMode === "advanced" && (
        <ControlSection title="Boundary and mounting">
          <SelectField
            label="Boundary condition"
            value={config.boundary}
            onChange={(v) => onChange({ ...config, boundary: v as PlateConfig["boundary"] })}
            options={[
              { value: "simply-supported", label: "Simply supported" },
              { value: "clamped", label: "Clamped (approximated)" },
              { value: "free", label: "Free (approximated)" },
            ]}
          />
          <SliderField
            label="Mount X"
            value={config.mountPosition.x}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ ...config, mountPosition: { ...config.mountPosition, x: v } })}
          />
          <SliderField
            label="Mount Y"
            value={config.mountPosition.y}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ ...config, mountPosition: { ...config.mountPosition, y: v } })}
          />
        </ControlSection>
      )}

      {controlMode === "advanced" && (
        <ControlSection title="Solver">
          <SliderField
            label="Damping"
            value={config.damping}
            min={0.001}
            max={0.3}
            step={0.001}
            onChange={(v) => onChange({ ...config, damping: v })}
          />
          <SliderField
            label="Maximum mode number"
            value={config.maxModeNumber}
            min={2}
            max={12}
            step={1}
            onChange={(v) => onChange({ ...config, maxModeNumber: v })}
          />
          <SliderField
            label="Simulation resolution"
            value={config.simulationResolution}
            min={32}
            max={160}
            step={8}
            onChange={(v) => onChange({ ...config, simulationResolution: v })}
          />
        </ControlSection>
      )}
    </div>
  );
}
