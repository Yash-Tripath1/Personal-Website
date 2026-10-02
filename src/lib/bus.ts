// Tiny event bus so the 3D scene and the DOM overlay can talk to each other.
export type ToastDetail = { text: string; x: number; y: number };

export function emit<T = unknown>(name: string, detail?: T) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on<T = unknown>(name: string, cb: (detail: T) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<T>).detail);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

export function toast(text: string, x?: number, y?: number) {
  emit<ToastDetail>("toast", {
    text,
    x: x ?? window.innerWidth / 2,
    y: y ?? window.innerHeight / 2,
  });
}

export function setCursorLabel(label: string) {
  emit<string>("cursor-label", label);
}
