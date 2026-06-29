import type { ContentLoader, EncyclopediaContent } from "../types";

/**
 * EncyclopediaRegistry — id → lazy content provider.
 *
 * Modules call `register(id, loader)` once at startup. The loader is
 * invoked on demand the first time a UI section asks for content; the
 * resolved payload is cached. This keeps cold start cheap and lets future
 * content live in code-split chunks or external JSON without any UI
 * change.
 */
class EncyclopediaRegistryImpl {
  private loaders = new Map<string, ContentLoader>();
  private cache = new Map<string, EncyclopediaContent>();
  private inflight = new Map<string, Promise<EncyclopediaContent>>();

  register(id: string, loader: ContentLoader): void {
    this.loaders.set(id, loader);
  }

  registerInline(content: EncyclopediaContent): void {
    this.loaders.set(content.id, () => Promise.resolve(content));
    this.cache.set(content.id, content);
  }

  has(id: string): boolean {
    return this.loaders.has(id);
  }

  ids(): string[] {
    return Array.from(this.loaders.keys());
  }

  /** Synchronous peek — returns cached content or undefined. */
  peek(id: string): EncyclopediaContent | undefined {
    return this.cache.get(id);
  }

  async load(id: string): Promise<EncyclopediaContent | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const loader = this.loaders.get(id);
    if (!loader) return null;
    let pending = this.inflight.get(id);
    if (!pending) {
      pending = loader().then((c) => {
        this.cache.set(id, c);
        this.inflight.delete(id);
        return c;
      });
      this.inflight.set(id, pending);
    }
    return pending;
  }
}

export const EncyclopediaRegistry = new EncyclopediaRegistryImpl();
