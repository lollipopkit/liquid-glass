import { defineComponent, h, ref, toRef, useAttrs, watchEffect } from "vue";
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableString,
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
    const inputRef = ref<HTMLInputElement | null>(null);
    const pressed = ref(false);
    const focused = ref(false);
    const value = useControllableString(
      toRef(props, "modelValue"),
      props.defaultValue,
      emit
    );
    const focusAmount = useAnimatedNumber(0, {
      stiffness: 0.18,
      damping: 0.8,
    });
    const pressAmount = useAnimatedNumber(0, {
      stiffness: 0.22,
      damping: 0.78,
    });

    watchEffect(() => {
      focusAmount.setTarget(focused.value ? 1 : 0);
    });

    watchEffect(() => {
      pressAmount.setTarget(pressed.value ? 1 : 0);
    });

    const clearPressed = () => {
      pressed.value = false;
    };

    watchEffect((onCleanup) => {
      if (!pressed.value || typeof window === "undefined") {
        return;
      }

      window.addEventListener("pointerup", clearPressed);
      window.addEventListener("pointercancel", clearPressed);
      onCleanup(() => {
        window.removeEventListener("pointerup", clearPressed);
        window.removeEventListener("pointercancel", clearPressed);
      });
    });

    return () => {
      const backgroundOpacity = Math.max(
        mix(0.05, 0.3, pressAmount.value.value),
        mix(0.05, 0.2, focusAmount.value.value)
      );
      const scale =
        mix(0.8, 1, focusAmount.value.value) *
        mix(1, 0.99, pressAmount.value.value);
      const blur = 1;
      const scaleRatio = 0.7;
      const specularOpacity = 0.2;
      const specularSaturation = 4;
      const boxShadow = "0 4px 16px rgba(0, 0, 0, 0.16)";

      return h(
        "label",
        {
          class: cn(
            "relative flex h-14 w-full max-w-[420px] min-w-0 items-center overflow-hidden rounded-full px-5 text-black",
            "dark:text-white",
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
          onClick: () => {
            if (!props.disabled) {
              inputRef.value?.focus();
            }
          },
        },
        [
          h(LiquidGlassFilter, {
            id: filterId,
            assets: searchboxAssets,
            width: 420,
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
              boxShadow,
              transform: "translateZ(0)",
              willChange: "background-color",
            },
          }),
          h("span", {
            class: "pointer-events-none relative z-[1] shrink-0 opacity-70",
            innerHTML:
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
          }),
          h("input", {
            ref: inputRef,
            ...attrs,
            autocomplete: props.autocomplete,
            disabled: props.disabled,
            type: "search",
            value: value.value,
            placeholder: props.placeholder,
            class: cn(
              "relative z-[1] ml-3 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-none",
              "text-black/70 outline-none placeholder:text-black/70 selection:bg-sky-400/25",
              "dark:text-white/70 dark:placeholder:text-white/70",
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
            onMousedown: (event: MouseEvent) => {
              if (!focused.value) {
                event.preventDefault();
              }
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
