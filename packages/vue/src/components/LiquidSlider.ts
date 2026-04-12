import { defineComponent, h, ref, toRef, useAttrs } from "vue";
import sliderAssets from "virtual:liquidGlassFilterAssets?width=84&height=56&radius=28&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { clamp, cn, useControllableNumber, useFilterId } from "../shared";

const THUMB_WIDTH = 84;
const THUMB_HEIGHT = 56;

export const LiquidSlider = defineComponent({
  name: "LiquidSlider",
  inheritAttrs: false,
  props: {
    modelValue: Number,
    defaultValue: Number,
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  setup(props, { emit }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-slider");
    const pressed = ref(false);
    const focused = ref(false);
    const safeMax = props.max > props.min ? props.max : props.min + 1;
    const value = useControllableNumber(
      toRef(props, "modelValue"),
      clamp(props.defaultValue ?? props.min, props.min, safeMax),
      emit
    );

    return () => {
      const normalizedValue = clamp(value.value, props.min, safeMax);
      const progress = ((normalizedValue - props.min) / (safeMax - props.min)) * 100;
      const active = !props.disabled && (focused.value || pressed.value);

      return h(
        "div",
        {
          class: cn(
            "relative w-full min-w-[220px] select-none",
            props.disabled ? "opacity-60" : undefined,
            attrs.class as string | undefined
          ),
        },
        [
          h("div", { class: "relative h-16" }, [
            h("input", {
              ...attrs,
              class: cn(
                "absolute inset-0 z-20 m-0 h-full w-full cursor-pointer opacity-0",
                props.disabled ? "cursor-not-allowed" : undefined
              ),
              type: "range",
              min: props.min,
              max: safeMax,
              step: props.step,
              disabled: props.disabled,
              value: normalizedValue,
              onInput: (event: Event) => {
                const target = event.currentTarget as HTMLInputElement;
                value.value = Number(target.value);
              },
              onChange: (event: Event) => emit("change", event),
              onPointerdown: () => {
                if (!props.disabled) {
                  pressed.value = true;
                }
              },
              onPointerup: () => {
                pressed.value = false;
              },
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
            h(
              "div",
              {
                class: "absolute inset-y-0",
                style: {
                  left: `${THUMB_WIDTH / 2}px`,
                  right: `${THUMB_WIDTH / 2}px`,
                },
              },
              [
                h(
                  "div",
                  {
                    class:
                      "absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10",
                  },
                  [
                    h("div", {
                      class:
                        "h-full rounded-full bg-sky-500/85 transition-[width] duration-200",
                      style: { width: `${progress}%` },
                    }),
                  ]
                ),
                h(LiquidGlassFilter, {
                  id: filterId,
                  assets: sliderAssets,
                  width: THUMB_WIDTH,
                  height: THUMB_HEIGHT,
                  blur: active ? 0.1 : 0.3,
                  scaleRatio: active ? 0.92 : 0.56,
                  specularOpacity: active ? 0.52 : 0.4,
                  specularSaturation: active ? 9 : 7,
                }),
                h("div", {
                  class:
                    "pointer-events-none absolute border border-white/35 bg-white/16 shadow-[0_8px_26px_rgba(15,23,42,0.15)] transition-[left,transform,background-color,box-shadow] duration-200",
                  style: {
                    top: `${(64 - THUMB_HEIGHT) / 2}px`,
                    width: `${THUMB_WIDTH}px`,
                    height: `${THUMB_HEIGHT}px`,
                    left: `calc(${progress}% - ${THUMB_WIDTH / 2}px)`,
                    borderRadius: `${THUMB_HEIGHT / 2}px`,
                    backdropFilter: `url(#${filterId})`,
                    transform: `scale(${props.disabled ? 0.72 : active ? 1 : 0.7})`,
                    backgroundColor: props.disabled
                      ? "rgba(255,255,255,0.14)"
                      : active
                        ? "rgba(255,255,255,0.28)"
                        : "rgba(255,255,255,0.16)",
                    boxShadow: active
                      ? "0 14px 28px rgba(15,23,42,0.18)"
                      : "0 8px 20px rgba(15,23,42,0.14)",
                  },
                }),
              ]
            ),
          ]),
        ]
      );
    };
  },
});
