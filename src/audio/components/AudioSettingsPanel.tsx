import { useState } from "react";
import { Volume2, VolumeX, Music, Wind, Bell } from "lucide-react";
import { AudioEngine } from "../engine/AudioEngine";
import { useAudioSettings } from "../hooks/useAudioSettings";

/**
 * AudioSettingsPanel — floating glass panel with master/channel sliders.
 * Collapsed by default to a tiny icon button at the bottom-right.
 */
export function AudioSettingsPanel() {
  const s = useAudioSettings();
  const [open, setOpen] = useState(false);

  const toggleMute = () => {
    if (!s.unlocked) void AudioEngine.unlock();
    AudioEngine.patchSettings({ muted: !s.muted });
  };

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-md text-white shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-white/55">Audio</span>
            <button
              onClick={toggleMute}
              className="text-xs text-white/70 hover:text-white"
              aria-label={s.muted ? "Unmute" : "Mute"}
            >
              {s.muted ? "Muted" : "On"}
            </button>
          </div>
          <Slider label="Master" icon={<Volume2 size={14} />} value={s.master} onChange={(v) => AudioEngine.patchSettings({ master: v })} />
          <Slider label="Music" icon={<Music size={14} />} value={s.music} onChange={(v) => AudioEngine.patchSettings({ music: v })} />
          <Slider label="Ambience" icon={<Wind size={14} />} value={s.ambience} onChange={(v) => AudioEngine.patchSettings({ ambience: v })} />
          <Slider label="Effects" icon={<Bell size={14} />} value={s.effects} onChange={(v) => AudioEngine.patchSettings({ effects: v })} />
        </div>
      )}
      <button
        onClick={() => {
          if (!s.unlocked) void AudioEngine.unlock();
          setOpen((o) => !o);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/80 backdrop-blur-md hover:text-white"
        aria-label="Audio settings"
      >
        {s.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}

function Slider({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-2 block">
      <div className="mb-1 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.25em] text-white/60">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span>{Math.round(value * 100)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white/80"
      />
    </label>
  );
}
