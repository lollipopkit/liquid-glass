import React, { useEffect, useRef, useState } from "react";
import magnifierAssets from "virtual:liquidGlassFilterAssets?width=220&height=150&radius=75&bezelWidth=24&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { clamp, cn, useElementSize, useFilterId, toCssSize } from "./shared";

export type LiquidMagnifyingGlassProps = {
  children: React.ReactNode;
  className?: string;
  lensWidth?: number;
  lensHeight?: number;
  initialX?: number;
  initialY?: number;
  magnification?: number;
};

export const LiquidMagnifyingGlass: React.FC<LiquidMagnifyingGlassProps> = ({
  children,
  className,
  initialX = 24,
  initialY = 24,
  lensHeight = 150,
  lensWidth = 220,
  magnification = 28,
}) => {
  const filterId = useFilterId("liquid-magnifier");
  const { ref, size } = useElementSize<HTMLDivElement>();
  const lensRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef({ x: initialX, y: initialY });
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    baseX: initialX,
    baseY: initialY,
  });
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });

  const applyLensTransform = (
    nextPosition: { x: number; y: number },
    nextActive: boolean
  ) => {
    const node = lensRef.current;

    if (!node) {
      return;
    }

    node.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0) scale(${nextActive ? 1 : 0.94})`;
  };

  useEffect(() => {
    const maxX = Math.max(0, size.width - lensWidth);
    const maxY = Math.max(0, size.height - lensHeight);
    const nextPosition = {
      x: clamp(initialX, 0, maxX),
      y: clamp(initialY, 0, maxY),
    };
    positionRef.current = nextPosition;
    setPosition(nextPosition);
    applyLensTransform(nextPosition, active);
  }, [initialX, initialY, lensHeight, lensWidth, size.height, size.width]);

  useEffect(() => {
    applyLensTransform(positionRef.current, active);
  }, [active]);

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
        frameRef.current = null;
        applyLensTransform(positionRef.current, true);
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
      setActive(false);
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
        assets={magnifierAssets}
        width={lensWidth}
        height={lensHeight}
        blur={active ? 0 : 0.15}
        scaleRatio={active ? 1 : 0.82}
        specularOpacity={0.28}
        specularSaturation={8}
        magnifyingScale={magnification}
      />

      <div
        ref={lensRef}
        className="absolute left-0 top-0 z-10 cursor-grab touch-none border border-white/35 bg-white/12 shadow-[0_18px_34px_rgba(15,23,42,0.18)] transition-[transform,box-shadow] duration-200 active:cursor-grabbing"
        style={{
          width: lensWidth,
          height: lensHeight,
          borderRadius: lensHeight / 2,
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${active ? 1 : 0.94})`,
          backdropFilter: `url(#${filterId})`,
          transitionDuration: active ? "0ms" : "200ms",
          willChange: active ? "transform" : undefined,
          boxShadow: active
            ? "0 22px 42px rgba(15,23,42,0.22)"
            : "0 16px 28px rgba(15,23,42,0.18)",
        }}
        onPointerDown={(event) => {
          dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            baseX: positionRef.current.x,
            baseY: positionRef.current.y,
          };
          lensRef.current?.setPointerCapture?.(event.pointerId);
          applyLensTransform(positionRef.current, true);
          setActive(true);
        }}
      >
        <div
          className="pointer-events-none absolute inset-[6px] rounded-[inherit] border border-white/22"
          style={{ borderRadius: toCssSize(lensHeight / 2 - 6, "9999px") }}
        />
      </div>
    </div>
  );
};
