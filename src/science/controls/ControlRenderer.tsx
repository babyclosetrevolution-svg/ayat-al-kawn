import type { ControlSpec } from "../types";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";
import { Stepper } from "./Stepper";

/**
 * ControlRenderer — dispatch on the tagged union so the experience UI
 * stays declarative.
 */
export function ControlRenderer({ spec }: { spec: ControlSpec }) {
  switch (spec.kind) {
    case "slider":
      return <Slider spec={spec} />;
    case "toggle":
      return <Toggle spec={spec} />;
    case "stepper":
      return <Stepper spec={spec} />;
  }
}
