import { defineComponent, h, ref, toRef, useAttrs, watchEffect } from "vue";
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableString,
  useElementSize,
  useFilterId,
} from "../shared";

export const LiquidSearchbox = defineComponent({
  name: "LiquidSearchbox",
  inheritAttrs: false,
  props: {
    modelValue: String,
    defaultValue: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "Search",
    },
    autocomplete: {
      type: String,
      default: "off",
    },
    inputClass: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  setup(props, { emit }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-searchbox");
    const { elementRef, size } = useElementSize<HTMLLabelElement>();
    const pressed = ref(false);
    const focused = ref(false);
    const value = useControllableString(
      toRef(props, "modelValue"),
      props.defaultValue,
      emit
    );
    const focusAmount = useAnimatedNumber(0, {
      stiffness: 0.14,
      damping: 0.76,
    });
    const pressAmount = useAnimatedNumber(0, {
      stiffness: 0.22,
      damping: 0.72,
    });

    watchEffect(() => {
      focusAmount.setTarget(focused.value ? 1 : 0);
    });

    watchEffect(() => {
      pressAmount.setTarget(pressed.value ? 1 : 0);
    });

    return () => {
      const backgroundOpacity = Math.max(
        mix(0.05, 0.3, pressAmount.value.value),
        mix(0.05, 0.2, focusAmount.value.value)
      );
      const scale =
        mix(0.985, 1, focusAmount.value.value) *
        mix(1, 0.992, pressAmount.value.value);
      const blur = mix(0.8, 0.35, focusAmount.value.value);
      const scaleRatio = mix(0.72, 0.92, focusAmount.value.value);
      const specularOpacity = mix(0.18, 0.24, focusAmount.value.value);
      const specularSaturation = mix(4, 6, focusAmount.value.value);
      const boxShadow = `0 12px 28px rgba(15,23,42,${mix(0.12, 0.16, focusAmount.value.value)})`;

      return h(
        "label",
        {
          ref: elementRef,
          class: cn(
            "relative flex h-14 w-full min-w-0 items-center overflow-hidden rounded-full border px-4 text-black",
            "border-black/10 bg-white/10 shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
            "dark:border-white/10 dark:bg-white/8 dark:text-white",
            props.disabled ? "cursor-not-allowed opacity-70" : "cursor-text",
            attrs.class as string | undefined
          ),
          style: {
            transform: `scale(${props.disabled ? 1 : scale})`,
            willChange: "transform",
          },
          onPointerdown: () => {
            if (!props.disabled) {
              pressed.value = true;
            }
          },
          onPointerup: () => {
            pressed.value = false;
          },
          onPointercancel: () => {
            pressed.value = false;
          },
          onPointerleave: () => {
            pressed.value = false;
          },
        },
        [
          h(LiquidGlassFilter, {
            id: filterId,
            assets: searchboxAssets,
            width: Math.max(Math.round(size.value.width), 280),
            height: 56,
            blur,
            scaleRatio,
            specularOpacity,
            specularSaturation,
          }),
          h("span", {
            class: "absolute inset-0",
            style: {
              borderRadius: "9999px",
              backdropFilter: `url(#${filterId})`,
              backgroundColor: props.disabled
                ? "rgba(255,255,255,0.12)"
                : `rgba(255,255,255,${backgroundOpacity})`,
              boxShadow: focused.value
                ? `0 0 0 1px rgba(56,189,248,0.24), ${boxShadow}`
                : boxShadow,
              willChange: "background-color, box-shadow",
            },
          }),
          h("span", {
            class:
              "pointer-events-none relative z-[1] shrink-0 text-black/55 dark:text-white/55",
            innerHTML:
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
          }),
          h("input", {
            ...attrs,
            autocomplete: props.autocomplete,
            disabled: props.disabled,
            type: "search",
            value: value.value,
            placeholder: props.placeholder,
            class: cn(
              "relative z-[1] ml-3 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-none",
              "text-black/80 outline-none placeholder:text-black/45 selection:bg-sky-400/25",
              "dark:text-white/82 dark:placeholder:text-white/42",
              "disabled:cursor-not-allowed",
              props.inputClass
            ),
            onInput: (event: Event) => {
              const target = event.currentTarget as HTMLInputElement;
              value.value = target.value;
            },
            onChange: (event: Event) => emit("change", event),
            onFocus: (event: FocusEvent) => {
              focused.value = true;
              emit("focus", event);
            },
            onBlur: (event: FocusEvent) => {
              focused.value = false;
              pressed.value = false;
              emit("blur", event);
            },
          }),
        ]
      );
    };
  },
});
