import { metricFor, EARTH_RADIUS_KM } from "./metrics";
import { getBody } from "../registry/bodyIndex";
import type { ComparisonKind, ContextCard } from "../types";

/**
 * ContextCard composer — turns two bodies and a comparison kind into a
 * short, intuitive sentence. Prefers ratios ("11× wider than Earth") over
 * raw numbers. Falls back to plain numeric display when both bodies miss
 * the requested fact.
 */
export function buildContextCard(
  ids: string[],
  kind: ComparisonKind,
): ContextCard | null {
  if (ids.length < 2) return null;
  const bodies = ids.map(getBody).filter(Boolean);
  if (bodies.length < 2) return null;

  // Sort largest first for a stable ratio sentence.
  const sorted = [...bodies]
    .map((b) => ({ body: b!, metric: metricFor(b!, kind) }))
    .filter((e) => !e.metric.missing)
    .sort((a, b) => b.metric.value - a.metric.value);
  if (sorted.length < 2) return null;

  const big = sorted[0];
  const small = sorted[sorted.length - 1];
  const ratio = big.metric.value / Math.max(small.metric.value, 1e-9);

  let headline = "";
  const noun = NOUN[kind];
  if (ratio >= 1.05) {
    headline = `${big.body.name} is ${formatRatio(ratio)}× ${noun} ${small.body.name}`;
  } else {
    headline = `${big.body.name} and ${small.body.name} share a comparable ${kind}`;
  }

  const body = explain(kind, big.body.name, small.body.name, ratio);
  return { headline, body };
}

const NOUN: Record<ComparisonKind, string> = {
  diameter: "wider than",
  radius: "larger in radius than",
  mass: "more massive than",
  gravity: "stronger in gravity than",
  temperature: "hotter than",
  distance: "farther than",
  rotation: "slower-spinning than",
  orbit: "longer-orbiting than",
};

function explain(
  kind: ComparisonKind,
  big: string,
  small: string,
  ratio: number,
): string {
  const r = formatRatio(ratio);
  switch (kind) {
    case "diameter":
    case "radius":
      return `About ${r} ${small}s could fit across ${big}, end to end.`;
    case "mass":
      return `It would take roughly ${r} ${small}s to balance the mass of ${big}.`;
    case "gravity":
      return `Surface gravity on ${big} is ${r}× what you would feel standing on ${small}.`;
    case "temperature":
      return `${big} burns ${r}× hotter than ${small} — small changes in temperature drive very different physics.`;
    case "distance":
      return `${big} sits roughly ${r}× farther from its primary than ${small} does from its own.`;
    case "rotation":
      return `${big} takes ${r}× as long to complete one rotation as ${small}.`;
    case "orbit":
      return `One year on ${big} lasts ${r}× as long as one year on ${small}.`;
  }
}

function formatRatio(r: number): string {
  if (r >= 100) return r.toFixed(0);
  if (r >= 10) return r.toFixed(1);
  return r.toFixed(2);
}

/** Re-export for callers that want raw earth-scale info. */
export { EARTH_RADIUS_KM };
