import React, { useEffect, useRef, useState } from "react";
import type {
  CreateLiquidGlassRuntimeAssetsOptions,
  LiquidGlassAssetMode,
  LiquidGlassFilterParamInput,
} from "@lollipopkit/liquid-glass";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  clamp,
  cn,
  mix,
  useAnimatedNumber,
  useElementSize,
  useFilterId,
} from "./shared";
import {
  resolveLiquidGlassComponentAssets,
  resolveLiquidGlassComponentMode,
  useLiquidGlassRuntimeAssets,
} from "../runtime";
import { getLiquidGlassStaticAssets } from "../staticAssets";

export type LiquidMagnifyingGlassRuntimeParams = Partial<
  Pick<
    LiquidGlassFilterParamInput,
    "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
  >
>;

export type LiquidMagnifyingGlassProps = {
  children: React.ReactNode;
  className?: string;
  lensWidth?: number;
  lensHeight?: number;
  initialX?: number;
  initialY?: number;
  magnification?: number;
  mode?: LiquidGlassAssetMode;
  runtime?: boolean;
  runtimeOptions?: CreateLiquidGlassRuntimeAssetsOptions;
  runtimeParams?: LiquidMagnifyingGlassRuntimeParams;
};

export const LiquidMagnifyingGlass: React.FC<LiquidMagnifyingGlassProps> = ({
  children,
  className,
  initialX = 24,
  initialY = 24,
  lensHeight = 150,
  lensWidth = 210,
  magnification = 24,
  mode,
  runtime = false,
  runtimeOptions,
  runtimeParams,
}) => {
  const specularOpacity = 0.5;
  const specularSaturation = 9;
  const filterId = useFilterId("liquid-magnifier");
  const mergedRuntimeInput = {
    bezelType: "convex_squircle" as const,
    bezelWidth: 25,
    glassThickness: 110,
    height: lensHeight,
    magnify: true,
    radius: Math.floor(lensHeight / 2),
    refractiveIndex: 1.5,
    width: lensWidth,
    ...runtimeParams,
  };
  const staticAssets = getLiquidGlassStaticAssets("magnifier");
  const resolvedMode = resolveLiquidGlassComponentMode(
    mode,
    runtime,
    Boolean(staticAssets)
  );
  const runtimeState = useLiquidGlassRuntimeAssets(
    mergedRuntimeInput,
    {
      ...runtimeOptions,
      enabled: resolvedMode === "runtime",
    }
  );
  const { ref, size } = useElementSize<HTMLDivElement>();
  const lensRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef({ x: initialX, y: initialY });
  const moveStateRef = useRef({ x: initialX, time: 0 });
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    baseX: initialX,
    baseY: initialY,
  });
  const [position, setPosition] = useState({ x: initialX, y: initialY });
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

  useEffect(() => {
    const maxX = Math.max(0, size.width - lensWidth);
    const maxY = Math.max(0, size.height - lensHeight);
    const nextPosition = {
      x: clamp(initialX, 0, maxX),
      y: clamp(initialY, 0, maxY),
    };
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  }, [initialX, initialY, lensHeight, lensWidth, size.height, size.width]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (dragStateRef.current.pointerId !== event.pointerId) {
        return;
      }

      const maxX = Math.max(0, size.width - lensWidth);
      const maxY = Math.max(0, size.height - lensHeight);
      const nextX = clamp(
        dragStateRef.current.baseX + (event.clientX - dragStateRef.current.startX),
        0,
        maxX
      );
      const nextY = clamp(
        dragStateRef.current.baseY + (event.clientY - dragStateRef.current.startY),
        0,
        maxY
      );

      positionRef.current = { x: nextX, y: nextY };

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        const now = performance.now();
        const deltaTime = Math.max(1, now - moveStateRef.current.time);
        const rawVelocity =
          ((positionRef.current.x - moveStateRef.current.x) / deltaTime) * 1000;
        const nextVelocity =
          Math.abs(rawVelocity) < 24 ? 0 : clamp(rawVelocity, -5000, 5000);
        moveStateRef.current = { x: positionRef.current.x, time: now };
        frameRef.current = null;
        velocityX.setTarget(nextVelocity);
        setPosition(positionRef.current);
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragStateRef.current.pointerId !== event.pointerId) {
        return;
      }

      dragStateRef.current.pointerId = -1;
      lensRef.current?.releasePointerCapture?.(event.pointerId);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      setPosition(positionRef.current);
      velocityX.setTarget(0);
      activeAmount.setTarget(0);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [lensHeight, lensWidth, size.height, size.width]);

  const baseScale = mix(0.8, 1, activeAmount.value);
  useEffect(() => {
    const targetScaleY =
      baseScale * Math.max(0.7, 1 - Math.abs(velocityX.value) / 5000);
    scaleYAmount.setTarget(targetScaleY);
  }, [baseScale, velocityX.value]);

  useEffect(() => {
    scaleXAmount.setTarget(baseScale + (1 - scaleYAmount.value));
  }, [baseScale, scaleYAmount.value]);

  const scaleY = scaleYAmount.value;
  const scaleX = scaleXAmount.value;
  const shadowSx = mix(0, 4, activeAmount.value);
  const shadowSy = mix(4, 16, activeAmount.value);
  const shadowAlpha = mix(0.16, 0.22, activeAmount.value);
  const insetShadowAlpha = mix(0.2, 0.27, activeAmount.value);
  const shadowBlur = mix(9, 24, activeAmount.value);
  const boxShadow = `${shadowSx}px ${shadowSy}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}), inset ${shadowSx / 2}px ${shadowSy / 2}px 24px rgba(0,0,0,${insetShadowAlpha}), inset ${-shadowSx / 2}px ${-shadowSy / 2}px 24px rgba(255,255,255,${insetShadowAlpha})`;
  const filterAssets = resolveLiquidGlassComponentAssets(
    resolvedMode,
    runtimeState.assets,
    staticAssets,
    mergedRuntimeInput
  );

  return (
    <div
      ref={ref}
      className={cn(
        "relative isolate min-h-[320px] overflow-hidden rounded-[28px] border",
        "border-black/10 bg-white/6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]",
        "dark:border-white/10 dark:bg-black/16",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.2),transparent_52%)] dark:bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.08),transparent_52%)]" />
      <div className="relative h-full w-full">{children}</div>

      <LiquidGlassFilter
        id={filterId}
        assets={filterAssets}
        width={lensWidth}
        height={lensHeight}
        blur={0}
        scaleRatio={mix(0.8, 1, activeAmount.value)}
        specularOpacity={specularOpacity}
        specularSaturation={specularSaturation}
        magnifyingScale={mix(
          magnification,
          magnification * 2,
          activeAmount.value
        )}
      />

      <div
        ref={lensRef}
        className="absolute left-0 top-0 z-10 cursor-grab touch-none border border-white/35 bg-white/12 active:cursor-grabbing"
        style={{
          width: lensWidth,
          height: lensHeight,
          borderRadius: lensHeight / 2,
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`,
          backdropFilter: `url(#${filterId})`,
          willChange: "transform, box-shadow",
          boxShadow,
        } as React.CSSProperties}
        onPointerDown={(event) => {
          dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            baseX: positionRef.current.x,
            baseY: positionRef.current.y,
          };
          moveStateRef.current = {
            x: positionRef.current.x,
            time: performance.now(),
          };
          velocityX.jump(0);
          scaleYAmount.jump(mix(0.8, 1, activeAmount.value));
          scaleXAmount.jump(1);
          lensRef.current?.setPointerCapture?.(event.pointerId);
          activeAmount.setTarget(1);
        }}
      >
      </div>
    </div>
  );
};
