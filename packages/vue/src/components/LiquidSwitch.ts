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
import switchAssets from "virtual:liquidGlassFilterAssets?width=146&height=92&radius=46&bezelWidth=19&glassThickness=47&refractiveIndex=1.5&bezelType=lip";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableBoolean,
  useFilterId,
} from "../shared";

const THUMB_WIDTH = 146;
const THUMB_HEIGHT = 92;
const THUMB_RADIUS = THUMB_HEIGHT / 2;
const TRACK_WIDTH = 160;
const TRACK_HEIGHT = 67;
const REST_SCALE = 0.65;
const ACTIVE_SCALE = 0.9;
const THUMB_REST_OFFSET = ((1 - REST_SCALE) * THUMB_WIDTH) / 2;
const TRACK_PADDING = (THUMB_HEIGHT - TRACK_HEIGHT) / 2;
const TRAVEL =
  TRACK_WIDTH - TRACK_HEIGHT - (THUMB_WIDTH - THUMB_HEIGHT) * REST_SCALE;

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
      const active = !props.disabled && pressed.value;
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
      const trackBackground = `rgba(${mix(148, 59, checkedAmount.value.value)},${mix(148, 191, checkedAmount.value.value)},${mix(159, 78, checkedAmount.value.value)},${mix(0.47, 0.93, checkedAmount.value.value)})`;
      const blur = 0.2;
      const scaleRatio = 0.4 + 0.5 * activeAmount.value.value;
      const specularOpacity = 0.5;
      const specularSaturation = 6;
      const thumbScale = props.disabled
        ? REST_SCALE
        : mix(REST_SCALE, ACTIVE_SCALE, activeAmount.value.value);
      const thumbLeft =
        -THUMB_REST_OFFSET +
        (TRACK_HEIGHT - THUMB_HEIGHT * REST_SCALE) / 2 +
        TRAVEL * checkedAmount.value.value;
      const thumbBackground = `rgba(255,255,255,${mix(1, 0.1, activeAmount.value.value)})`;
      const thumbShadow =
        activeAmount.value.value > 0.5
          ? "0 4px 22px rgba(0,0,0,0.1), inset 2px 7px 24px rgba(0,0,0,0.09), inset -2px -7px 24px rgba(255,255,255,0.09)"
          : "0 4px 22px rgba(0,0,0,0.1)";

      return h(
        "label",
        {
          class: cn(
            "relative inline-flex h-[92px] w-[160px] shrink-0 select-none touch-none",
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
              emit("focus", event);
            },
            onBlur: (event: FocusEvent) => {
              pressed.value = false;
              emit("blur", event);
            },
          }),
          h(
            "div",
            {
              class: "absolute inset-y-0",
              style: {
                left: "0",
                right: "0",
              },
            },
            [
              h("div", {
                class: "absolute",
                style: {
                  top: `${TRACK_PADDING}px`,
                  width: `${TRACK_WIDTH}px`,
                  height: `${TRACK_HEIGHT}px`,
                  borderRadius: `${TRACK_HEIGHT / 2}px`,
                  backgroundColor: trackBackground,
                  boxShadow: "none",
                  willChange: "background-color",
                },
              }),
              h(LiquidGlassFilter, {
                id: filterId,
                assets: switchAssets,
                width: THUMB_WIDTH,
                height: THUMB_HEIGHT,
                blur,
                scaleRatio,
                specularOpacity,
                specularSaturation,
              }),
              h("div", {
                class: "pointer-events-none absolute",
                style: {
                  top: 0,
                  width: `${THUMB_WIDTH}px`,
                  height: `${THUMB_HEIGHT}px`,
                  left: `${thumbLeft}px`,
                  borderRadius: `${THUMB_RADIUS}px`,
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
