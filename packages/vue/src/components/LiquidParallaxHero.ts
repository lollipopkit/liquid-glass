import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  useAttrs,
  type PropType,
} from "vue";
import heroAssets from "virtual:liquidGlassFilterAssets?width=150&height=150&radius=75&bezelWidth=40&glassThickness=120&refractiveIndex=1.5";
import type {
  CreateLiquidGlassRuntimeAssetsOptions,
  LiquidGlassFilterParamInput,
} from "@lollipopkit/liquid-glass";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { cn, toCssSize, useAnimatedNumber, useFilterId } from "../shared";
import { useLiquidGlassRuntimeAssets } from "../runtime";

export type LiquidParallaxHeroRuntimeParams = Partial<
  Pick<
    LiquidGlassFilterParamInput,
    "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
  >
>;

const HERO_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
  bezelWidth: 40,
  glassThickness: 120,
  height: 150,
  radius: 75,
  refractiveIndex: 1.5,
  width: 150,
};

export const LiquidParallaxHero = defineComponent({
  name: "LiquidParallaxHero",
  inheritAttrs: false,
  props: {
    imageSrc: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    focalImageSrc: String,
    height: [Number, String],
    lensSize: {
      type: Number,
      default: 200,
    },
    parallaxSpeed: {
      type: Number,
      default: -0.25,
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
      type: Object as PropType<LiquidParallaxHeroRuntimeParams | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-parallax-hero");
    const containerRef = ref<HTMLDivElement | null>(null);
    const runtimeState = useLiquidGlassRuntimeAssets(
      computed(() => ({
        ...HERO_RUNTIME_INPUT,
        ...(props.runtimeParams ?? {}),
      })),
      computed(() => ({
        ...(props.runtimeOptions ?? {}),
        enabled: props.runtime,
      }))
    );
    const progress = useAnimatedNumber(0, {
      stiffness: 0.12,
      damping: 0.82,
    });
    let frame = 0;

    const updateProgress = () => {
      progress.setTarget(window.scrollY || 0);
    };

    const scheduleUpdate = () => {
      if (frame || typeof window === "undefined") {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateProgress();
      });
    };

    onMounted(() => {
      scheduleUpdate();
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", scheduleUpdate);
    });

    onUnmounted(() => {
      if (frame && typeof window !== "undefined") {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    });

    return () => {
      const backgroundOffset =
        Math.min(800, progress.value.value) * props.parallaxSpeed;
      const backgroundY = -60 + backgroundOffset;
      const focalY = 13 + backgroundOffset * 0.75;
      const filterAssets =
        props.runtime && runtimeState.assets.value
          ? runtimeState.assets.value
          : heroAssets;

      return h("div", {}, [
        h(
          "div",
          {
            ref: containerRef,
            class: cn(
              "relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-slate-600/20",
              attrs.class as string | undefined
            ),
            style: {
              height: toCssSize(props.height, "400px"),
              backgroundImage: `url(${props.imageSrc})`,
              backgroundSize: "700px auto",
              backgroundPositionX: "center",
              backgroundPositionY: `${backgroundY}px`,
            },
          },
          [
            ...(slots.default?.() ?? []),
            h(
              "svg",
              {
                class:
                  "pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 overflow-hidden",
                viewBox: "0 0 150 150",
                preserveAspectRatio: "xMidYMid slice",
                colorInterpolationFilters: "sRGB",
                style: {
                  borderRadius: "100px",
                  boxShadow: "0 16px 31px rgba(0,0,0,0.4)",
                },
              },
              [
                h(LiquidGlassFilter, {
                  id: filterId,
                  assets: filterAssets,
                  width: filterAssets.width,
                  height: filterAssets.height,
                  specularOpacity: 0.2,
                  specularSaturation: 6,
                  withSvgWrapper: false,
                }),
                h("g", { filter: `url(#${filterId})` }, [
                  h("image", {
                    href: props.focalImageSrc ?? props.imageSrc,
                    width: props.lensSize,
                    preserveAspectRatio: "xMidYMid slice",
                    x: -29,
                    y: focalY,
                  }),
                ]),
              ]
            ),
          ]
        ),
      ]);
    };
  },
});
