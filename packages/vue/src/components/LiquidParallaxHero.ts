import { defineComponent, h, onMounted, onUnmounted, ref, useAttrs } from "vue";
import heroAssets from "virtual:liquidGlassFilterAssets?width=180&height=180&radius=90&bezelWidth=34&glassThickness=120&refractiveIndex=1.5&bezelType=convex_squircle";

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
      default: 180,
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
    const progress = useAnimatedNumber(0.5, {
      stiffness: 0.12,
      damping: 0.82,
    });
    let frame = 0;

    const updateProgress = () => {
      const node = containerRef.value;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const value = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      progress.setTarget(Math.max(0, Math.min(1, value)));
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
      const backgroundTravel = 180 * props.parallaxSpeed;
      const backgroundY = (progress.value.value - 0.5) * 2 * backgroundTravel;
      const focalY = (progress.value.value - 0.5) * 2 * backgroundTravel * 0.72;
      const lensImageSize = props.lensSize * 1.34;

      return h(
        "div",
        {
          ref: containerRef,
          class: cn(
            "relative isolate overflow-hidden rounded-[32px] border border-black/10 bg-slate-900 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]",
            "dark:border-white/10",
            attrs.class as string | undefined
          ),
          style: {
            height: toCssSize(props.height, "min(70vh, 560px)"),
          },
        },
        [
          h("img", {
            src: props.imageSrc,
            alt: props.alt,
            class: "absolute inset-0 h-[118%] w-full object-cover",
            style: {
              transform: `translateY(${backgroundY}px)`,
              willChange: "transform",
            },
          }),
          h("div", {
            class:
              "absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(255,255,255,0.15),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.4))]",
          }),
          h("div", {
            class:
              "absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent",
          }),
          h(
            "div",
            { class: "relative z-10 flex h-full items-end p-6 sm:p-8 lg:p-10" },
            slots.default
              ? [
                  h(
                    "div",
                    {
                      class:
                        "max-w-2xl text-white drop-shadow-[0_10px_30px_rgba(15,23,42,0.22)]",
                    },
                    slots.default()
                  ),
                ]
              : []
          ),
          h(
            "div",
            {
              class:
                "pointer-events-none absolute inset-0 flex items-center justify-center",
            },
            [
              h(
                "svg",
                {
                  class: "overflow-visible",
                  viewBox: `0 0 ${props.lensSize} ${props.lensSize}`,
                  preserveAspectRatio: "xMidYMid slice",
                  colorInterpolationFilters: "sRGB",
                  style: {
                    width: `${props.lensSize}px`,
                    height: `${props.lensSize}px`,
                    filter: "drop-shadow(0 18px 36px rgba(15,23,42,0.24))",
                  },
                },
                [
                  h(LiquidGlassFilter, {
                    id: filterId,
                    assets: heroAssets,
                    width: props.lensSize,
                    height: props.lensSize,
                    specularOpacity: 0.24,
                    specularSaturation: 6,
                    withSvgWrapper: false,
                  }),
                  h(
                    "g",
                    { filter: `url(#${filterId})` },
                    [
                      h("image", {
                        href: props.focalImageSrc ?? props.imageSrc,
                        width: lensImageSize,
                        height: lensImageSize,
                        preserveAspectRatio: "xMidYMid slice",
                        x: -(lensImageSize - props.lensSize) / 2,
                        y: focalY - (lensImageSize - props.lensSize) / 2,
                      }),
                    ]
                  ),
                ]
              ),
            ]
          ),
        ]
      );
    };
  },
});
