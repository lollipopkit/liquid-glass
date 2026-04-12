import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  ref,
  type Ref,
} from "vue";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useFilterId(prefix: string) {
  const instance = getCurrentInstance();
  return `${prefix}-${instance?.uid ?? Math.round(Math.random() * 1_000_000)}`;
}

export function useControllableString(
  modelValue: Ref<string | undefined>,
  defaultValue: string,
  emit: (event: "update:modelValue", value: string) => void
) {
  const internalValue = ref(defaultValue);
  return computed({
    get: () => modelValue.value ?? internalValue.value,
    set: (nextValue: string) => {
      if (modelValue.value === undefined) {
        internalValue.value = nextValue;
      }
      emit("update:modelValue", nextValue);
    },
  });
}

export function useControllableNumber(
  modelValue: Ref<number | undefined>,
  defaultValue: number,
  emit: (event: "update:modelValue", value: number) => void
) {
  const internalValue = ref(defaultValue);
  return computed({
    get: () => modelValue.value ?? internalValue.value,
    set: (nextValue: number) => {
      if (modelValue.value === undefined) {
        internalValue.value = nextValue;
      }
      emit("update:modelValue", nextValue);
    },
  });
}

export function useControllableBoolean(
  modelValue: Ref<boolean | undefined>,
  defaultValue: boolean,
  emit: (event: "update:modelValue", value: boolean) => void
) {
  const internalValue = ref(defaultValue);
  return computed({
    get: () => modelValue.value ?? internalValue.value,
    set: (nextValue: boolean) => {
      if (modelValue.value === undefined) {
        internalValue.value = nextValue;
      }
      emit("update:modelValue", nextValue);
    },
  });
}

export function useElementSize<T extends HTMLElement>() {
  const elementRef = ref<T | null>(null);
  const size = ref({ width: 0, height: 0 });
  let observer: ResizeObserver | null = null;

  onMounted(() => {
    const node = elementRef.value;

    if (!node) {
      return;
    }

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      size.value = { width: rect.width, height: rect.height };
    };

    updateSize();

    observer = new ResizeObserver(updateSize);
    observer.observe(node);
  });

  onUnmounted(() => observer?.disconnect());

  return { elementRef, size };
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
  const value = ref(initialValue);
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

    if (Math.abs(target - current) < precision && Math.abs(velocity) < precision) {
      current = target;
      velocity = 0;
      value.value = current;
      return;
    }

    value.value = current;

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

  onUnmounted(stop);

  return {
    value,
    setTarget(nextValue: number) {
      target = nextValue;
      ensureTicking();
    },
    jump(nextValue: number) {
      current = nextValue;
      target = nextValue;
      velocity = 0;
      value.value = nextValue;
      stop();
    },
  };
}
