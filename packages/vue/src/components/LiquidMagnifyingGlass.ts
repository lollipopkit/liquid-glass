import { defineComponent, h, onMounted, onUnmounted, ref, useAttrs } from "vue";
import magnifierAssets from "virtual:liquidGlassFilterAssets?width=220&height=150&radius=75&bezelWidth=24&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { clamp, cn, toCssSize, useElementSize, useFilterId } from "../shared";

export const LiquidMagnifyingGlass = defineComponent({
  name: "LiquidMagnifyingGlass",
  inheritAttrs: false,
  props: {
    className: String,
    lensWidth: {
      type: Number,
      default: 220,
    },
    lensHeight: {
      type: Number,
      default: 150,
    },
    initialX: {
      type: Number,
      default: 24,
    },
    initialY: {
      type: Number,
      default: 24,
    },
    magnification: {
      type: Number,
      default: 28,
    },
  },
  setup(props, { slots }) {
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-magnifier");
    const { elementRef, size } = useElementSize<HTMLDivElement>();
    const lensRef = ref<HTMLDivElement | null>(null);
    const position = ref({ x: props.initialX, y: props.initialY });
    const active = ref(false);
    const dragState = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      baseX: props.initialX,
      baseY: props.initialY,
    };

    const onPointerMove = (event: PointerEvent) => {
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      const maxX = Math.max(0, size.value.width - props.lensWidth);
      const maxY = Math.max(0, size.value.height - props.lensHeight);
      position.value = {
        x: clamp(dragState.baseX + (event.clientX - dragState.startX), 0, maxX),
        y: clamp(dragState.baseY + (event.clientY - dragState.startY), 0, maxY),
      };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      dragState.pointerId = -1;
      active.value = false;
    };

    onMounted(() => {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });

    onUnmounted(() => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    });

    return () =>
      h(
        "div",
        {
          ref: elementRef,
          class: cn(
            "relative isolate min-h-[320px] overflow-hidden rounded-[28px] border",
            "border-black/10 bg-white/6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]",
            "dark:border-white/10 dark:bg-black/16",
            props.className,
            attrs.class as string | undefined
          ),
        },
        [
          h("div", {
            class:
              "pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.2),transparent_52%)] dark:bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.08),transparent_52%)]",
          }),
          h("div", { class: "relative h-full w-full" }, slots.default?.()),
          h(LiquidGlassFilter, {
            id: filterId,
            assets: magnifierAssets,
            width: props.lensWidth,
            height: props.lensHeight,
            blur: active.value ? 0 : 0.15,
            scaleRatio: active.value ? 1 : 0.82,
            specularOpacity: 0.28,
            specularSaturation: 8,
            magnifyingScale: props.magnification,
          }),
          h(
            "div",
            {
              ref: lensRef,
              class:
                "absolute left-0 top-0 z-10 cursor-grab border border-white/35 bg-white/12 shadow-[0_18px_34px_rgba(15,23,42,0.18)] transition-[transform,box-shadow] duration-200 active:cursor-grabbing",
              style: {
                width: `${props.lensWidth}px`,
                height: `${props.lensHeight}px`,
                borderRadius: `${props.lensHeight / 2}px`,
                transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${active.value ? 1 : 0.94})`,
                backdropFilter: `url(#${filterId})`,
                boxShadow: active.value
                  ? "0 22px 42px rgba(15,23,42,0.22)"
                  : "0 16px 28px rgba(15,23,42,0.18)",
              },
              onPointerdown: (event: PointerEvent) => {
                dragState.pointerId = event.pointerId;
                dragState.startX = event.clientX;
                dragState.startY = event.clientY;
                dragState.baseX = position.value.x;
                dragState.baseY = position.value.y;
                lensRef.value?.setPointerCapture?.(event.pointerId);
                active.value = true;
              },
            },
            [
              h("div", {
                class:
                  "pointer-events-none absolute inset-[6px] rounded-[inherit] border border-white/22",
                style: {
                  borderRadius: toCssSize(props.lensHeight / 2 - 6, "9999px"),
                },
              }),
            ]
          ),
        ]
      );
  },
});
