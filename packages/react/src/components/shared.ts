import { useEffect, useId, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...parts: Array<string | false | null | undefined>) {
  return twMerge(parts.filter(Boolean).join(" "));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useFilterId(prefix: string) {
  const reactId = useId();
  return `${prefix}-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function useControllableValue<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  function setValue(nextValue: T) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  }

  return [value, setValue] as const;
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, size };
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

export function useAnimatedNumber(
  initialValue: number,
  options: AnimatedNumberOptions = {}
) {
  const [value, setValue] = useState(initialValue);
  const stateRef = useRef({
    current: initialValue,
    target: initialValue,
    velocity: 0,
    frame: 0,
  });
  const optionsRef = useRef({
    stiffness: options.stiffness ?? 0.18,
    damping: options.damping ?? 0.78,
    precision: options.precision ?? 0.001,
  });

  optionsRef.current = {
    stiffness: options.stiffness ?? 0.18,
    damping: options.damping ?? 0.78,
    precision: options.precision ?? 0.001,
  };

  function stop() {
    const state = stateRef.current;

    if (!state.frame || typeof window === "undefined") {
      return;
    }

    window.cancelAnimationFrame(state.frame);
    state.frame = 0;
  }

  function ensureTicking() {
    const state = stateRef.current;

    if (state.frame || typeof window === "undefined") {
      return;
    }

    state.frame = window.requestAnimationFrame(tick);
  }

  function tick() {
    const state = stateRef.current;
    const { damping, precision, stiffness } = optionsRef.current;

    state.frame = 0;
    state.current += state.velocity;
    state.velocity += (state.target - state.current) * stiffness;
    state.velocity *= damping;

    if (
      Math.abs(state.target - state.current) < precision &&
      Math.abs(state.velocity) < precision
    ) {
      state.current = state.target;
      state.velocity = 0;
      setValue(state.current);
      return;
    }

    setValue(state.current);
    ensureTicking();
  }

  useEffect(() => () => stop(), []);

  return {
    value,
    setTarget(nextValue: number) {
      stateRef.current.target = nextValue;
      ensureTicking();
    },
    jump(nextValue: number) {
      const state = stateRef.current;

      state.current = nextValue;
      state.target = nextValue;
      state.velocity = 0;
      setValue(nextValue);
      stop();
    },
  };
}
