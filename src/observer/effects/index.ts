/**
 * Observer Effects — reserved for future motion-aware post-effects
 * (subtle lens response, depth-of-field on inspect, faint motion blur on
 * travel). Foundation only: nothing wired yet to avoid touching the
 * rendering pipeline.
 */

export interface ObserverEffect {
  id: string;
  enabled: boolean;
}

class EffectRegistryImpl {
  private effects = new Map<string, ObserverEffect>();
  register(e: ObserverEffect) { this.effects.set(e.id, e); }
  list() { return [...this.effects.values()]; }
}

export const EffectRegistry = new EffectRegistryImpl();
