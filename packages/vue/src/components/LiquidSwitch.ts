import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  useAttrs,
  watchEffect,
} from "vue";
import switchAssets from "virtual:liquidGlassFilterAssets?width=58&height=58&radius=29&bezelWidth=16&glassThickness=58&refractiveIndex=1.5&bezelType=lip";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableBoolean,
  useFilterId,
} from "../shared";

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
    const activeAmount = useAnimatedNumber(0, {
      stiffness: 0.18,
      damping: 0.76,
    });
    const checkedAmount = useAnimatedNumber(value.value ? 1 : 0, {
      stiffness: 0.16,
      damping: 0.74,
    });

    watchEffect(() => {
      const active = !props.disabled && (pressed.value || focused.value);
      activeAmount.setTarget(active ? 1 : 0);
    });

    watchEffect(() => {
      checkedAmount.setTarget(value.value ? 1 : 0);
    });

    const onPointerUp = () => {
      pressed.value = false;
    };

    onMounted(() => {
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });

    onUnmounted(() => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    });

    return () => {
      const trackBackground = `rgba(${mix(148, 56, checkedAmount.value.value)},${mix(148, 189, checkedAmount.value.value)},${mix(159, 248, checkedAmount.value.value)},${mix(0.34, 0.48, checkedAmount.value.value)})`;
      const thumbLeft = (TRACK_WIDTH - THUMB_SIZE) * checkedAmount.value.value;
      const blur = mix(0.18, 0.08, activeAmount.value.value);
      const scaleRatio = mix(0.62, 0.94, activeAmount.value.value);
      const specularOpacity = mix(0.5, 0.6, activeAmount.value.value);
      const specularSaturation = mix(6, 8, activeAmount.value.value);
      const thumbScale = props.disabled
        ? 0.76
        : mix(0.8, 0.94, activeAmount.value.value);
      const thumbBackground = `rgba(255,255,255,${mix(0.18, 0.3, checkedAmount.value.value)})`;
      const thumbShadow = `0 ${mix(8, 14, activeAmount.value.value)}px ${mix(22, 28, activeAmount.value.value)}px rgba(15,23,42,${mix(0.14, 0.18, activeAmount.value.value)})`;

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
                  "absolute inset-x-0 border border-black/8 dark:border-white/8",
                style: {
                  top: `${TRACK_PADDING}px`,
                  height: `${TRACK_HEIGHT}px`,
                  borderRadius: `${TRACK_HEIGHT / 2}px`,
                  backgroundColor: trackBackground,
                  boxShadow: focused.value
                    ? "0 0 0 1px rgba(56,189,248,0.22)"
                    : "0 10px 24px rgba(15,23,42,0.08)",
                  willChange: "background-color",
                },
              }),
              h(LiquidGlassFilter, {
                id: filterId,
                assets: switchAssets,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                blur,
                scaleRatio,
                specularOpacity,
                specularSaturation,
              }),
              h("div", {
                class:
                  "pointer-events-none absolute border border-white/35 bg-white/16",
                style: {
                  top: 0,
                  width: `${THUMB_SIZE}px`,
                  height: `${THUMB_SIZE}px`,
                  left: `${thumbLeft}px`,
                  borderRadius: `${THUMB_SIZE / 2}px`,
                  backdropFilter: `url(#${filterId})`,
                  transform: `scale(${thumbScale})`,
                  backgroundColor: thumbBackground,
                  boxShadow: thumbShadow,
                  willChange: "left, transform, background-color, box-shadow",
                },
              }),
            ]
          ),
        ]
      );
    };
  },
});
