import type { AmbientLayerSpec, AudioChannel, AudioSettings, ProceduralRecipe } from "../types";

/**
 * AudioEngine — singleton Web Audio host.
 *
 * Owns the AudioContext, master/channel gain graph, and a registry of
 * active procedural layers. Layers are tiny synth chains (oscillator +
 * filter + noise) built on demand so we never ship audio assets and
 * everything is fully responsive to settings changes.
 *
 * Lazy by design: the context is only created after the first user
 * gesture (browser autoplay policy). Until then, calls become no-ops.
 */

interface ActiveLayer {
  spec: AmbientLayerSpec;
  gain: GainNode;
  nodes: AudioNode[];
  stop: () => void;
}

const DEFAULTS: AudioSettings = {
  master: 0.6,
  music: 0.6,
  ambience: 0.8,
  effects: 0.8,
  muted: false,
  unlocked: false,
};

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /**
   * Presence bus — a single BiquadFilter inserted between the master
   * gain and the destination. Its cutoff frequency is animated by the
   * PresenceEngine so slow flight sounds deeper (low cutoff) and fast
   * flight opens up (brighter harmonics). No new music, no new layers.
   */
  private presenceFilter: BiquadFilterNode | null = null;
  private presenceBias = 0; // 0 = deep drone, 1 = fully open
  private channels = new Map<AudioChannel, GainNode>();
  private active = new Map<string, ActiveLayer>();
  private settings: AudioSettings = { ...DEFAULTS };
  private listeners = new Set<(s: AudioSettings) => void>();

  getSettings(): AudioSettings {
    return this.settings;
  }

  subscribe(cb: (s: AudioSettings) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    for (const l of this.listeners) l(this.settings);
  }

  patchSettings(p: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...p };
    this.applyGains();
    this.emit();
  }

  /** Must be called from a user gesture. */
  async unlock(): Promise<void> {
    if (this.settings.unlocked) return;
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!Ctx) return;
      this.ctx = new Ctx();
      if (this.ctx.state === "suspended") await this.ctx.resume();
      this.master = this.ctx.createGain();
      this.presenceFilter = this.ctx.createBiquadFilter();
      this.presenceFilter.type = "lowpass";
      this.presenceFilter.Q.value = 0.4;
      this.presenceFilter.frequency.value = this.cutoffFromBias(this.presenceBias);
      this.master.connect(this.presenceFilter);
      this.presenceFilter.connect(this.ctx.destination);
      for (const ch of ["music", "ambience", "effects"] as AudioChannel[]) {
        const g = this.ctx.createGain();
        g.connect(this.master);
        this.channels.set(ch, g);
      }
      this.settings = { ...this.settings, unlocked: true };
      this.applyGains();
      this.emit();
    } catch {
      // Audio is optional — silently ignore failures.
    }
  }

  private channelGain(ch: AudioChannel): number {
    if (this.settings.muted) return 0;
    return this.settings.master * this.settings[ch];
  }

  private applyGains(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.value = 1;
    for (const [ch, node] of this.channels) {
      node.gain.value = this.channelGain(ch);
    }
  }

  private cutoffFromBias(bias: number): number {
    // Deep drone at rest (~450 Hz) → open harmonics at journey speeds
    // (~5.5 kHz). Below musical brightness so nothing new is introduced.
    return 450 + bias * 5100;
  }

  /**
   * Presence bias in [0, 1] — mapped from the PresenceEngine layer.
   * Smoothly animates the master lowpass cutoff. Safe to call every
   * frame; the transition uses Web Audio's own ramp so no JS jitter.
   */
  setPresenceBias(bias: number): void {
    const b = Math.max(0, Math.min(1, bias));
    this.presenceBias = b;
    if (!this.ctx || !this.presenceFilter) return;
    const target = this.cutoffFromBias(b);
    const now = this.ctx.currentTime;
    this.presenceFilter.frequency.cancelScheduledValues(now);
    this.presenceFilter.frequency.setTargetAtTime(target, now, 1.8);
  }


  /** Replace the active layer set with `layers`, crossfading. */
  setActiveLayers(layers: AmbientLayerSpec[]): void {
    if (!this.ctx || !this.settings.unlocked) return;
    const desiredIds = new Set(layers.map((l) => l.id));
    // Stop layers no longer needed.
    for (const [id, layer] of this.active) {
      if (!desiredIds.has(id)) this.fadeOutAndStop(layer);
    }
    // Start new layers.
    for (const spec of layers) {
      if (this.active.has(spec.id)) continue;
      this.startLayer(spec);
    }
  }

  stopAll(): void {
    for (const layer of this.active.values()) this.fadeOutAndStop(layer);
  }

  private fadeOutAndStop(layer: ActiveLayer): void {
    if (!this.ctx) return;
    const fade = layer.spec.fade ?? 1.2;
    const now = this.ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
    layer.gain.gain.linearRampToValueAtTime(0.0001, now + fade);
    setTimeout(() => {
      layer.stop();
      this.active.delete(layer.spec.id);
    }, fade * 1000 + 50);
  }

  private startLayer(spec: AmbientLayerSpec): void {
    if (!this.ctx) return;
    const channel = this.channels.get(spec.channel);
    if (!channel) return;
    const layerGain = this.ctx.createGain();
    layerGain.gain.value = 0.0001;
    layerGain.connect(channel);
    const nodes: AudioNode[] = [layerGain];
    const stoppers: Array<() => void> = [];
    this.buildSynth(spec.recipe, layerGain, nodes, stoppers);
    const now = this.ctx.currentTime;
    const fade = spec.fade ?? 1.4;
    layerGain.gain.linearRampToValueAtTime(spec.gain ?? 0.4, now + fade);
    this.active.set(spec.id, {
      spec,
      gain: layerGain,
      nodes,
      stop: () => {
        for (const s of stoppers) {
          try {
            s();
          } catch {
            /* ignore */
          }
        }
      },
    });
  }

  private buildSynth(
    r: ProceduralRecipe,
    out: GainNode,
    nodes: AudioNode[],
    stoppers: Array<() => void>,
  ): void {
    if (!this.ctx) return;
    if (r.kind === "silence") return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (r.kind === "drone" || r.kind === "pad" || r.kind === "energy") {
      const baseHz = r.baseHz ?? 60;
      const detune = r.detune ?? 7;
      const partials = r.kind === "pad" ? 4 : 3;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = r.cutoffHz ?? 600;
      filter.Q.value = 0.7;
      filter.connect(out);
      nodes.push(filter);
      for (let i = 0; i < partials; i++) {
        const osc = ctx.createOscillator();
        osc.type = r.kind === "energy" ? "sawtooth" : "sine";
        osc.frequency.value = baseHz * (1 + i * 0.5);
        osc.detune.value = (i - partials / 2) * detune;
        const og = ctx.createGain();
        og.gain.value = 1 / (partials + 1);
        osc.connect(og).connect(filter);
        // Slow LFO on detune.
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = (r.lfoHz ?? 0.08) * (1 + i * 0.3);
        lfoGain.gain.value = 4 + i * 2;
        lfo.connect(lfoGain).connect(osc.detune);
        osc.start(now);
        lfo.start(now);
        nodes.push(osc, og, lfo, lfoGain);
        stoppers.push(() => {
          osc.stop();
          lfo.stop();
        });
      }
      return;
    }

    if (r.kind === "wind" || r.kind === "shimmer") {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      const color = r.noiseColor ?? (r.kind === "wind" ? 0.7 : 0.2);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = last * color + white * (1 - color);
        data[i] = last;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = r.kind === "wind" ? "lowpass" : "highpass";
      filter.frequency.value = r.cutoffHz ?? (r.kind === "wind" ? 700 : 2000);
      filter.Q.value = 0.5;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = r.lfoHz ?? 0.15;
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain).connect(filter.frequency);
      noise.connect(filter).connect(out);
      noise.start(now);
      lfo.start(now);
      nodes.push(noise, filter, lfo, lfoGain);
      stoppers.push(() => {
        noise.stop();
        lfo.stop();
      });
    }
  }
}

export const AudioEngine = new AudioEngineImpl();
