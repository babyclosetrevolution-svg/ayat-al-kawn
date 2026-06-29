/**
 * Science Engine — shared types.
 *
 * The science layer is fully independent from rendering, simulation and
 * knowledge. It exposes a data-driven catalogue of *experiences*, each
 * of which manipulates one or more typed parameters bound to lightweight
 * visual hooks in the world layer. The UI builds itself entirely from
 * these descriptors — no hardcoded panels.
 */

export type ParamValue = number | boolean | string;

export interface BaseControl<T extends ParamValue> {
  /** Fully-qualified parameter key, e.g. "earth.atmosphereIntensity". */
  paramKey: string;
  /** Default value (also resets to this). */
  defaultValue: T;
  /** UI label shown above the control. */
  label: string;
  /** One-line educational note describing what the user is observing. */
  note?: string;
}

export interface SliderControl extends BaseControl<number> {
  kind: "slider";
  min: number;
  max: number;
  step?: number;
  /** Optional unit suffix shown next to the value (e.g. "×", "°"). */
  unit?: string;
  /** Optional named anchors rendered under the track ("Real", "Fast"). */
  ticks?: { value: number; label: string }[];
}

export interface ToggleControl extends BaseControl<boolean> {
  kind: "toggle";
}

export interface StepperControl extends BaseControl<string> {
  kind: "stepper";
  options: { value: string; label: string }[];
}

export type ControlSpec = SliderControl | ToggleControl | StepperControl;

export interface Experience {
  /** Stable id within the body, e.g. "rotation". */
  id: string;
  /** Body id this experience belongs to, e.g. "earth". */
  bodyId: string;
  title: string;
  /** Concise explanation — separate from rendering logic. */
  description: string;
  controls: ControlSpec[];
  /** True when at least one control supports a play/pause animation. */
  playable?: boolean;
}
