import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  useAttrs,
  watchEffect,
  type PropType,
} from "vue";
import sliderAssets from "virtual:liquidGlassFilterAssets?width=90&height=60&radius=30&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";
import type {
  CreateLiquidGlassRuntimeAssetsOptions,
  LiquidGlassFilterParamInput,
} from "@lollipopkit/liquid-glass";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  clamp,
  cn,
  mix,
  useAnimatedNumber,
  useControllableNumber,
  useFilterId,
} from "../shared";
import { useLiquidGlassRuntimeAssets } from "../runtime";

export type LiquidSliderRuntimeParams = Partial<
  Pick<
    LiquidGlassFilterParamInput,
    "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
  >
>;

const THUMB_WIDTH = 90;
const THUMB_HEIGHT = 60;
const TRACK_HEIGHT = 14;
const REST_SCALE = 0.6;
const ACTIVE_SCALE = 1;
const REST_WIDTH = THUMB_WIDTH * REST_SCALE;
const SLIDER_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
  bezelType: "convex_squircle",
  bezelWidth: 16,
  glassThickness: 80,
  height: THUMB_HEIGHT,
  radius: 30,
  refractiveIndex: 1.45,
  width: THUMB_WIDTH,
};

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
    runtime: {
      type: Boolean,
      default: false,
    },
    runtimeOptions: {
      type: Object as PropType<CreateLiquidGlassRuntimeAssetsOptions | undefined>,
      default: undefined,
    },
    runtimeParams: {
      type: Object as PropType<LiquidSliderRuntimeParams | undefined>,
      default: undefined,
    },
  },
  emits: ["update:modelValue", "change", "focus", "blur"],
  setup(props, { emit }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-slider");
    const pressed = ref(false);
    const safeMax = props.max > props.min ? props.max : props.min + 1;
    const value = useControllableNumber(
      toRef(props, "modelValue"),
      clamp(props.defaultValue ?? props.min, props.min, safeMax),
      emit
    );
    const runtimeState = useLiquidGlassRuntimeAssets(
      computed(() => ({
        ...SLIDER_RUNTIME_INPUT,
        ...(props.runtimeParams ?? {}),
      })),
      computed(() => ({
        ...(props.runtimeOptions ?? {}),
        enabled: props.runtime,
      }))
    );
    const activeAmount = useAnimatedNumber(0, {
      stiffness: 0.18,
      damping: 0.76,
    });
    const progressAmount = useAnimatedNumber(0, {
      stiffness: 0.26,
      damping: 0.72,
    });

    watchEffect(() => {
      const active = !props.disabled && pressed.value;
      activeAmount.setTarget(active ? 1 : 0);
    });

    watchEffect(() => {
      const normalizedValue = clamp(value.value, props.min, safeMax);
      const progress = ((normalizedValue - props.min) / (safeMax - props.min)) * 100;

      if (pressed.value) {
        progressAmount.jump(progress);
        return;
      }

      progressAmount.setTarget(progress);
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
      const normalizedValue = clamp(value.value, props.min, safeMax);
      const blur = 0;
      const scaleRatio = mix(0.4, 0.9, activeAmount.value.value);
      const specularOpacity = 0.4;
      const specularSaturation = 7;
      const thumbScale = props.disabled
        ? REST_SCALE
        : mix(REST_SCALE, ACTIVE_SCALE, activeAmount.value.value);
      const thumbBackground = props.disabled
        ? "rgba(255,255,255,0.2)"
        : `rgba(255,255,255,${mix(1, 0.1, activeAmount.value.value)})`;
      const thumbShadow = "0 3px 14px rgba(0,0,0,0.1)";
      const filterAssets =
        props.runtime && runtimeState.assets.value
          ? runtimeState.assets.value
          : sliderAssets;

      return h(
        "div",
        {
          class: cn(
            "relative w-full max-w-[330px] min-w-[220px] select-none",
            props.disabled ? "opacity-60" : undefined,
            attrs.class as string | undefined
          ),
        },
        [
          h("div", { class: "relative h-[60px]" }, [
            h("input", {
              ...attrs,
              class: cn(
                "absolute inset-0 z-20 m-0 h-full w-full cursor-pointer touch-none opacity-0",
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
                  left: `${REST_WIDTH / 2}px`,
                  right: `${REST_WIDTH / 2}px`,
                },
              },
              [
                h(
                  "div",
                  {
                    class: "absolute inset-x-0 overflow-hidden rounded-full",
                    style: {
                      top: `${(THUMB_HEIGHT - TRACK_HEIGHT) / 2}px`,
                      height: `${TRACK_HEIGHT}px`,
                      backgroundColor: "#89898F66",
                    },
                  },
                  [
                    h("div", {
                      class: "h-full rounded-full",
                      style: {
                        width: `${progressAmount.value.value}%`,
                        backgroundColor: "#0377F7",
                      },
                    }),
                  ]
                ),
                h(LiquidGlassFilter, {
                  id: filterId,
                  assets: filterAssets,
                  width: filterAssets.width,
                  height: filterAssets.height,
                  blur,
                  scaleRatio,
                  specularOpacity,
                  specularSaturation,
                }),
                h("div", {
                  class: "pointer-events-none absolute",
                  style: {
                    top: "0",
                    width: `${THUMB_WIDTH}px`,
                    height: `${THUMB_HEIGHT}px`,
                    left: `calc(${progressAmount.value.value}% - ${THUMB_WIDTH / 2}px)`,
                    borderRadius: `${THUMB_HEIGHT / 2}px`,
                    backdropFilter: `url(#${filterId})`,
                    transform: `scale(${thumbScale})`,
                    backgroundColor: thumbBackground,
                    boxShadow: thumbShadow,
                    willChange: "left, transform, background-color, box-shadow",
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
