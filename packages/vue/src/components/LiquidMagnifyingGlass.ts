import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  useAttrs,
  watchEffect,
} from "vue";
import magnifierAssets from "virtual:liquidGlassFilterAssets?width=210&height=150&radius=75&bezelWidth=25&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  clamp,
  cn,
  mix,
  useAnimatedNumber,
  useElementSize,
  useFilterId,
} from "../shared";

export const LiquidMagnifyingGlass = defineComponent({
  name: "LiquidMagnifyingGlass",
  inheritAttrs: false,
  props: {
    className: String,
    lensWidth: {
      type: Number,
      default: 210,
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
      default: 24,
    },
  },
  setup(props, { slots }) {
    const specularOpacity = 0.5;
    const specularSaturation = 9;
    const attrs = useAttrs();
    const filterId = useFilterId("liquid-magnifier");
    const { elementRef, size } = useElementSize<HTMLDivElement>();
    const lensRef = ref<HTMLDivElement | null>(null);
    const position = ref({ x: props.initialX, y: props.initialY });
    let frame = 0;
    const activeAmount = useAnimatedNumber(0, {
      stiffness: 0.2,
      damping: 0.74,
    });
    const velocityX = useAnimatedNumber(0, {
      stiffness: 0.18,
      damping: 0.8,
    });
    const scaleYAmount = useAnimatedNumber(0.8, {
      stiffness: 0.34,
      damping: 0.82,
    });
    const scaleXAmount = useAnimatedNumber(1, {
      stiffness: 0.34,
      damping: 0.82,
    });
    const dragState = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      baseX: props.initialX,
      baseY: props.initialY,
    };
    const moveState = {
      x: props.initialX,
      time: 0,
    };
    const livePosition = {
      x: props.initialX,
      y: props.initialY,
    };

    const onPointerMove = (event: PointerEvent) => {
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      const maxX = Math.max(0, size.value.width - props.lensWidth);
      const maxY = Math.max(0, size.value.height - props.lensHeight);
      livePosition.x = clamp(
        dragState.baseX + (event.clientX - dragState.startX),
        0,
        maxX
      );
      livePosition.y = clamp(
        dragState.baseY + (event.clientY - dragState.startY),
        0,
        maxY
      );

      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        const now = performance.now();
        const deltaTime = Math.max(1, now - moveState.time);
        const rawVelocity = ((livePosition.x - moveState.x) / deltaTime) * 1000;
        const nextVelocity =
          Math.abs(rawVelocity) < 24
            ? 0
            : clamp(rawVelocity, -5000, 5000);
        moveState.x = livePosition.x;
        moveState.time = now;
        frame = 0;
        velocityX.setTarget(nextVelocity);
        position.value = {
          x: livePosition.x,
          y: livePosition.y,
        };
      });
    };

    const syncPosition = () => {
      const maxX = Math.max(0, size.value.width - props.lensWidth);
      const maxY = Math.max(0, size.value.height - props.lensHeight);
      position.value = {
        x: clamp(position.value.x, 0, maxX),
        y: clamp(position.value.y, 0, maxY),
      };
      livePosition.x = position.value.x;
      livePosition.y = position.value.y;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      dragState.pointerId = -1;
      lensRef.value?.releasePointerCapture?.(event.pointerId);

      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      position.value = {
        x: livePosition.x,
        y: livePosition.y,
      };
      velocityX.setTarget(0);
      activeAmount.setTarget(0);
    };

    onMounted(() => {
      syncPosition();
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });

    onUnmounted(() => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    });

    const clampPosition = () => {
      const maxX = Math.max(0, size.value.width - props.lensWidth);
      const maxY = Math.max(0, size.value.height - props.lensHeight);
      position.value = {
        x: clamp(position.value.x, 0, maxX),
        y: clamp(position.value.y, 0, maxY),
      };
      livePosition.x = position.value.x;
      livePosition.y = position.value.y;
    };

    watchEffect(() => {
      const baseScale = mix(0.8, 1, activeAmount.value.value);
      scaleYAmount.setTarget(
        baseScale * Math.max(0.7, 1 - Math.abs(velocityX.value.value) / 5000)
      );
    });

    watchEffect(() => {
      const baseScale = mix(0.8, 1, activeAmount.value.value);
      scaleXAmount.setTarget(baseScale + (1 - scaleYAmount.value.value));
    });

    return () => {
      const activeValue = activeAmount.value.value;
      const baseScale = mix(0.8, 1, activeValue);
      const scaleY = scaleYAmount.value.value;
      const scaleX = scaleXAmount.value.value;
      const shadowSx = mix(0, 4, activeValue);
      const shadowSy = mix(4, 16, activeValue);
      const shadowAlpha = mix(0.16, 0.22, activeValue);
      const insetShadowAlpha = mix(0.2, 0.27, activeValue);
      const shadowBlur = mix(9, 24, activeValue);
      const boxShadow = `${shadowSx}px ${shadowSy}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}), inset ${shadowSx / 2}px ${shadowSy / 2}px 24px rgba(0,0,0,${insetShadowAlpha}), inset ${-shadowSx / 2}px ${-shadowSy / 2}px 24px rgba(255,255,255,${insetShadowAlpha})`;

      return h(
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
            blur: 0,
            scaleRatio: mix(0.8, 1, activeValue),
            specularOpacity,
            specularSaturation,
            magnifyingScale: mix(
              props.magnification,
              props.magnification * 2,
              activeValue
            ),
          }),
          h(
            "div",
            {
              ref: lensRef,
              class:
                "absolute left-0 top-0 z-10 cursor-grab border border-white/35 bg-white/12 touch-none active:cursor-grabbing",
              style: {
                width: `${props.lensWidth}px`,
                height: `${props.lensHeight}px`,
                borderRadius: `${props.lensHeight / 2}px`,
                transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`,
                backdropFilter: `url(#${filterId})`,
                boxShadow,
                willChange: "transform, box-shadow",
              },
              onPointerdown: (event: PointerEvent) => {
                clampPosition();
                dragState.pointerId = event.pointerId;
                dragState.startX = event.clientX;
                dragState.startY = event.clientY;
                dragState.baseX = position.value.x;
                dragState.baseY = position.value.y;
                moveState.x = livePosition.x;
                moveState.time = performance.now();
                velocityX.jump(0);
                scaleYAmount.jump(baseScale);
                scaleXAmount.jump(1);
                lensRef.value?.setPointerCapture?.(event.pointerId);
                activeAmount.setTarget(1);
              },
            }
          ),
        ]
      );
    };
  },
});
