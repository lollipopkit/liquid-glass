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
