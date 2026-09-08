import { CATEGORIES } from "./seed";

/**
 * DEMO CLASSIFIER — this is NOT a trained AI model.
 * Rule-based/mock inference so the flow is demonstrable offline.
 * `classifyImage` is the single seam to replace with a real ML endpoint later:
 * the return shape matches what a model server would provide.
 */
export interface Classification {
  category: string;
  subcategory: string;
  icon: string;
  confidence: number;
  approx_weight: number;
  condition: string;
  value_min: number;
  value_max: number;
  engine: "mock-rules-v1";
}

export async function classifyImage(
  _imageDataUrl: string | undefined,
  hint?: string,
): Promise<Classification> {
  await new Promise((r) => setTimeout(r, 1400));
  const cat =
    CATEGORIES.find((c) => c.key === hint) ??
    CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]!;
  const weight = Math.round((1.5 + Math.random() * 3) * 10) / 10;
  const confidence = Math.round((0.82 + Math.random() * 0.15) * 100);
  return {
    category: cat.key,
    subcategory: cat.label,
    icon: cat.icon,
    confidence,
    approx_weight: weight,
    condition: "Used",
    value_min: Math.round(weight * cat.min),
    value_max: Math.round(weight * cat.max),
    engine: "mock-rules-v1",
  };
}
