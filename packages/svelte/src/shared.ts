import { writable, type Readable } from "svelte/store";

let filterCounter = 0;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function createFilterId(prefix: string) {
  filterCounter += 1;
  return `${prefix}-${filterCounter}`;
}

export function toCssSize(
  value: number | string | undefined,
  fallback: string
) {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value ?? fallback;
}

export function mix(from: number, to: number, ratio: number) {
  return from + (to - from) * ratio;
}

type AnimatedNumberOptions = {
  stiffness?: number;
  damping?: number;
  precision?: number;
};

export type AnimatedNumber = Readable<number> & {
  destroy: () => void;
  jump: (value: number) => void;
  setTarget: (value: number) => void;
};

export function createAnimatedNumber(
  initialValue: number,
  options: AnimatedNumberOptions = {}
): AnimatedNumber {
  const store = writable(initialValue);
  const stiffness = options.stiffness ?? 0.18;
  const damping = options.damping ?? 0.78;
  const precision = options.precision ?? 0.001;

  let current = initialValue;
  let target = initialValue;
  let velocity = 0;
  let frame = 0;

  const stop = () => {
    if (!frame || typeof window === "undefined") {
      return;
    }

    window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const tick = () => {
    frame = 0;

    current += velocity;
    velocity += (target - current) * stiffness;
    velocity *= damping;

    if (
      Math.abs(target - current) < precision &&
      Math.abs(velocity) < precision
    ) {
      current = target;
      velocity = 0;
      store.set(current);
      return;
    }

    store.set(current);

    if (typeof window !== "undefined") {
      frame = window.requestAnimationFrame(tick);
    }
  };

  const ensureTicking = () => {
    if (frame || typeof window === "undefined") {
      return;
    }

    frame = window.requestAnimationFrame(tick);
  };

  return {
    subscribe: store.subscribe,
    setTarget(value: number) {
      target = value;
      ensureTicking();
    },
    jump(value: number) {
      target = value;
      current = value;
      velocity = 0;
      store.set(value);
      stop();
    },
    destroy() {
      stop();
    },
  };
}
