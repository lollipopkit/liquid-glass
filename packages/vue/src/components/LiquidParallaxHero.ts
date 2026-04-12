import { defineComponent, h, onMounted, onUnmounted, ref, useAttrs } from "vue";
import heroAssets from "virtual:liquidGlassFilterAssets?width=150&height=150&radius=75&bezelWidth=40&glassThickness=120&refractiveIndex=1.5";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { cn, toCssSize, useAnimatedNumber, useFilterId } from "../shared";

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
  },
  setup(props, { slots }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-parallax-hero");
    const containerRef = ref<HTMLDivElement | null>(null);
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
                  assets: heroAssets,
                  width: 150,
                  height: 150,
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
