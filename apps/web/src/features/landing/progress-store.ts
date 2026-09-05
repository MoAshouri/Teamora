type Listener = (progress: number) => void;

/**
 * Minimal external store for scroll progress.
 * The 3D scene and the HTML overlay read from it every frame without causing React re-renders.
 */
class ProgressStore {
  value = 0;
  private listeners = new Set<Listener>();

  set(next: number) {
    const clamped = Math.min(1, Math.max(0, next));
    if (clamped === this.value) return;
    this.value = clamped;
    this.listeners.forEach((fn) => fn(clamped));
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.value);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

export const progressStore = new ProgressStore();
