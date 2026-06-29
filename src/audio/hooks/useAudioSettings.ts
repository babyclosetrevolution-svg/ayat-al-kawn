import { useEffect, useState } from "react";
import { AudioEngine } from "../engine/AudioEngine";
import type { AudioSettings } from "../types";

export function useAudioSettings(): AudioSettings {
  const [s, set] = useState<AudioSettings>(() => AudioEngine.getSettings());
  useEffect(() => AudioEngine.subscribe(set), []);
  return s;
}
