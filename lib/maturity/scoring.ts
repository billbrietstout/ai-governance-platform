/**
 * Maturity assessment scoring engine.
 * Scores: 1.0-1.9=M1, 2.0-2.9=M2, 3.0-3.9=M3, 4.0-4.9=M4, 5.0=M5
 */

import { MATURITY_QUESTIONS } from "./questions";
import type { MaturityLayer } from "./questions";

export type AnswerInput = {
  questionId: string;
  answer: number;
  score: number;
};

export type LayerScores = {
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  L5: number;
  overall: number;
};

export function scoreAssessment(answers: AnswerInput[]): LayerScores {
  const byLayer: Record<MaturityLayer, { sum: number; weight: number }> = {
    L1: { sum: 0, weight: 0 },
    L2: { sum: 0, weight: 0 },
    L3: { sum: 0, weight: 0 },
    L4: { sum: 0, weight: 0 },
    L5: { sum: 0, weight: 0 }
  };

  for (const a of answers) {
    const q = MATURITY_QUESTIONS.find((x) => x.id === a.questionId);
    if (!q) continue;
    const w = q.weight;
    byLayer[q.layer].sum += a.score * w;
    byLayer[q.layer].weight += w;
  }

  const L1 = byLayer.L1.weight > 0 ? byLayer.L1.sum / byLayer.L1.weight : 1;
  const L2 = byLayer.L2.weight > 0 ? byLayer.L2.sum / byLayer.L2.weight : 1;
  const L3 = byLayer.L3.weight > 0 ? byLayer.L3.sum / byLayer.L3.weight : 1;
  const L4 = byLayer.L4.weight > 0 ? byLayer.L4.sum / byLayer.L4.weight : 1;
  const L5 = byLayer.L5.weight > 0 ? byLayer.L5.sum / byLayer.L5.weight : 1;
  const overall = (L1 + L2 + L3 + L4 + L5) / 5;

  return {
    L1: Math.round(L1 * 10) / 10,
    L2: Math.round(L2 * 10) / 10,
    L3: Math.round(L3 * 10) / 10,
    L4: Math.round(L4 * 10) / 10,
    L5: Math.round(L5 * 10) / 10,
    overall: Math.round(overall * 10) / 10
  };
}

export function getMaturityLevel(score: number): number {
  if (score >= 5) return 5;
  if (score >= 4) return 4;
  if (score >= 3) return 3;
  if (score >= 2) return 2;
  return 1;
}

export type NextStep = {
  layer: MaturityLayer;
  priority: "high" | "medium" | "low";
  action: string;
};

export function getNextSteps(layerScores: LayerScores, _vertical?: string): NextStep[] {
  const steps: NextStep[] = [];
  const layers: MaturityLayer[] = ["L1", "L2", "L3", "L4", "L5"];
  const suggestions: Record<MaturityLayer, string[]> = {
    L1: ["Document an AI governance policy", "Map regulations to your AI systems", "Assign executive ownership (CAIO)", "Create an AI incident response plan", "Define AI value and ROI KPIs"],
    L2: ["Classify AI datasets", "Establish data lineage", "Implement MDM for AI data", "Deploy shadow AI discovery", "Assign data stewards"],
    L3: ["Build an AI asset inventory", "Document accountability assignments", "Run compliance gap analysis", "Define AI asset lifecycle", "Add agentic AI controls"],
    L4: ["Enable scan coverage for AI assets", "Implement drift detection", "Configure anomaly alerts", "Integrate MLOps with governance", "Enforce guardrails"],
    L5: ["Assess vendor assurance", "Maintain model cards", "Track provenance", "Apply vulnerability management", "Assess supply chain risk"]
  };

  for (const layer of layers) {
    const score = layerScores[layer];
    const level = getMaturityLevel(score);
    if (level < 5) {
      const nextAction = suggestions[layer][level] ?? `Improve ${layer} maturity`;
      steps.push({
        layer,
        priority: score < 2 ? "high" : score < 3 ? "medium" : "low",
        action: nextAction
      });
    }
  }
  const order = { high: 0, medium: 1, low: 2 };
  steps.sort((a, b) => order[a.priority] - order[b.priority]);
  return steps.slice(0, 5);
}
