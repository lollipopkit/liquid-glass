import { defineComponent, h, ref, toRef, useAttrs } from "vue";
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
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

    return () =>
      h(
        "label",
        {
          ref: elementRef,
          class: cn(
            "relative flex h-14 w-full min-w-0 items-center overflow-hidden rounded-full border px-4 text-black transition-transform duration-200",
            "border-black/10 bg-white/10 shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
            "dark:border-white/10 dark:bg-white/8 dark:text-white",
            props.disabled ? "cursor-not-allowed opacity-70" : "cursor-text",
            attrs.class as string | undefined
          ),
          style: {
            transform: `scale(${props.disabled ? 1 : pressed.value ? 0.992 : focused.value ? 1 : 0.985})`,
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
            blur: focused.value ? 0.35 : 0.8,
            scaleRatio: focused.value ? 0.92 : 0.72,
            specularOpacity: focused.value ? 0.24 : 0.18,
            specularSaturation: focused.value ? 6 : 4,
          }),
          h("span", {
            class:
              "absolute inset-0 transition-[background-color,box-shadow] duration-200",
            style: {
              borderRadius: "9999px",
              backdropFilter: `url(#${filterId})`,
              backgroundColor: props.disabled
                ? "rgba(255,255,255,0.12)"
                : focused.value || pressed.value
                  ? "rgba(255,255,255,0.24)"
                  : "rgba(255,255,255,0.14)",
              boxShadow: focused.value
                ? "0 0 0 1px rgba(56,189,248,0.24), 0 18px 40px rgba(15,23,42,0.16)"
                : "0 12px 28px rgba(15,23,42,0.12)",
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
  },
});
