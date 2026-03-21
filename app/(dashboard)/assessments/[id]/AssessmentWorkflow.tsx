"use client";

import { useState } from "react";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { ControlAttestationForm } from "./ControlAttestationForm";

type Control = {
  id: string;
  controlId: string;
  title: string;
  description: string | null;
  implementationGuidance: string | null;
  cosaiLayer: string | null;
  framework: { code: string; name: string };
  attestation?: { id: string; status: string; notes: string | null };
};

type Props = {
  assessmentId: string;
  assetId: string;
  layers: string[];
  byLayer: Record<string, (Control & { attestation?: { status: string; notes: string | null } })[]>;
  status: string;
};

export function AssessmentWorkflow({ assessmentId, assetId, layers, byLayer, status }: Props) {
  const [activeLayer, setActiveLayer] = useState(layers[0] ?? "");

  const controls = byLayer[activeLayer] ?? [];
  const attested = controls.filter(
    (c) => c.attestation?.status === "COMPLIANT" || c.attestation?.status === "NOT_APPLICABLE"
  );
  const pct = controls.length > 0 ? Math.round((attested.length / controls.length) * 100) : 0;

  return (
    <div className="flex gap-4">
      <div className="w-48 shrink-0 space-y-1">
        {layers.map((layer) => {
          const ctrls = byLayer[layer] ?? [];
          const a = ctrls.filter(
            (c) =>
              c.attestation?.status === "COMPLIANT" || c.attestation?.status === "NOT_APPLICABLE"
          ).length;
          const lpct = ctrls.length > 0 ? Math.round((a / ctrls.length) * 100) : 0;
          return (
            <button
              key={layer}
              type="button"
              onClick={() => setActiveLayer(layer)}
              className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                activeLayer === layer
                  ? "bg-navy-600/30 text-navy-300"
                  : "text-slatePro-400 hover:bg-slatePro-800"
              }`}
            >
              <span className="block truncate">
                {layer.replace("LAYER_", "L").replace(/_/g, " ")}
              </span>
              <span className="text-xs">{lpct}%</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <ComplianceRing percentage={pct} />
          <span className="text-slatePro-300">
            {activeLayer} — {attested.length}/{controls.length} attested
          </span>
        </div>

        <div className="space-y-3">
          {controls.map((c) => (
            <div
              key={c.id}
              className="border-slatePro-700 bg-slatePro-900/30 rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-slatePro-200 font-medium">
                    {c.controlId}: {c.title}
                  </div>
                  <div className="text-slatePro-500 text-xs">{c.framework.code}</div>
                  {c.description && (
                    <p className="text-slatePro-400 mt-1 text-sm">{c.description}</p>
                  )}
                  {c.implementationGuidance && (
                    <p className="text-slatePro-500 mt-1 text-xs">{c.implementationGuidance}</p>
                  )}
                </div>
                {status !== "APPROVED" && (
                  <ControlAttestationForm
                    assetId={assetId}
                    controlId={c.id}
                    controlTitle={c.title}
                    currentStatus={c.attestation?.status ?? "PENDING"}
                    currentNotes={c.attestation?.notes ?? ""}
                  />
                )}
                {status === "APPROVED" && (
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs ${
                      c.attestation?.status === "COMPLIANT"
                        ? "bg-emerald-100 text-emerald-700"
                        : c.attestation?.status === "NOT_APPLICABLE"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c.attestation?.status ?? "PENDING"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
