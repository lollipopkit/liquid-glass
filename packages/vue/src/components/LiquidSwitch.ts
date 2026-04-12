import { defineComponent, h, ref, toRef, useAttrs } from "vue";
import switchAssets from "virtual:liquidGlassFilterAssets?width=58&height=58&radius=29&bezelWidth=16&glassThickness=58&refractiveIndex=1.5&bezelType=lip";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { cn, useControllableBoolean, useFilterId } from "../shared";

const THUMB_SIZE = 58;
const TRACK_WIDTH = 92;
const TRACK_HEIGHT = 40;
const TRACK_PADDING = (THUMB_SIZE - TRACK_HEIGHT) / 2;

export const LiquidSwitch = defineComponent({
  name: "LiquidSwitch",
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    defaultValue: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  setup(props, { emit }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-switch");
    const pressed = ref(false);
    const focused = ref(false);
    const value = useControllableBoolean(
      toRef(props, "modelValue"),
      props.defaultValue,
      emit
    );

    return () => {
      const active = !props.disabled && (pressed.value || focused.value);

      return h(
        "label",
        {
          class: cn(
            "relative inline-flex h-[58px] w-[110px] shrink-0 select-none",
            props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            attrs.class as string | undefined
          ),
        },
        [
          h("input", {
            ...attrs,
            type: "checkbox",
            disabled: props.disabled,
            checked: value.value,
            class:
              "absolute inset-0 z-20 h-full w-full cursor-inherit opacity-0",
            onChange: (event: Event) => {
              const target = event.currentTarget as HTMLInputElement;
              value.value = target.checked;
              emit("change", event);
            },
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
                left: `${TRACK_PADDING}px`,
                right: `${TRACK_PADDING}px`,
              },
            },
            [
              h("div", {
                class:
                  "absolute inset-x-0 border border-black/8 transition-[background-color,box-shadow] duration-200 dark:border-white/8",
                style: {
                  top: `${TRACK_PADDING}px`,
                  height: `${TRACK_HEIGHT}px`,
                  borderRadius: `${TRACK_HEIGHT / 2}px`,
                  backgroundColor: value.value
                    ? "rgba(56,189,248,0.48)"
                    : "rgba(148,148,159,0.34)",
                  boxShadow: focused.value
                    ? "0 0 0 1px rgba(56,189,248,0.22)"
                    : "0 10px 24px rgba(15,23,42,0.08)",
                },
              }),
              h(LiquidGlassFilter, {
                id: filterId,
                assets: switchAssets,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                blur: active ? 0.08 : 0.18,
                scaleRatio: active ? 0.94 : 0.62,
                specularOpacity: active ? 0.6 : 0.5,
                specularSaturation: active ? 8 : 6,
              }),
              h("div", {
                class:
                  "pointer-events-none absolute border border-white/35 bg-white/16 shadow-[0_10px_24px_rgba(15,23,42,0.15)] transition-[left,transform,background-color,box-shadow] duration-200",
                style: {
                  top: 0,
                  width: `${THUMB_SIZE}px`,
                  height: `${THUMB_SIZE}px`,
                  left: value.value ? `${TRACK_WIDTH - THUMB_SIZE}px` : "0px",
                  borderRadius: `${THUMB_SIZE / 2}px`,
                  backdropFilter: `url(#${filterId})`,
                  transform: `scale(${props.disabled ? 0.76 : active ? 0.94 : 0.8})`,
                  backgroundColor: value.value
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(255,255,255,0.18)",
                  boxShadow: active
                    ? "0 14px 28px rgba(15,23,42,0.18)"
                    : "0 8px 22px rgba(15,23,42,0.14)",
                },
              }),
            ]
          ),
        ]
      );
    };
  },
});
