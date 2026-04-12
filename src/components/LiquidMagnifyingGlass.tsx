import { motion, useMotionValue } from "motion/react";
import React, { useEffect, useState } from "react";
import { Filter } from "virtual:refractionFilter?width=220&height=150&radius=75&bezelWidth=24&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";

import {
  clamp,
  cn,
  toCssSize,
  useElementSize,
  useFilterId,
} from "./shared";

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
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const maxX = Math.max(0, size.width - lensWidth);
    const maxY = Math.max(0, size.height - lensHeight);

    x.set(clamp(initialX, 0, maxX));
    y.set(clamp(initialY, 0, maxY));
  }, [initialX, initialY, lensHeight, lensWidth, size.height, size.width, x, y]);

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

      <Filter
        id={filterId}
        width={lensWidth}
        height={lensHeight}
        blur={active ? 0 : 0.15}
        scaleRatio={active ? 1 : 0.82}
        specularOpacity={0.28}
        specularSaturation={8}
        magnifyingScale={magnification}
      />

      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={ref}
        className="absolute left-0 top-0 z-10 cursor-grab active:cursor-grabbing border border-white/35 bg-white/12 shadow-[0_18px_34px_rgba(15,23,42,0.18)]"
        style={{
          x,
          y,
          width: lensWidth,
          height: lensHeight,
          borderRadius: lensHeight / 2,
          backdropFilter: `url(#${filterId})`,
        }}
        initial={false}
        animate={{
          scale: active ? 1 : 0.94,
          boxShadow: active
            ? "0 22px 42px rgba(15,23,42,0.22)"
            : "0 16px 28px rgba(15,23,42,0.18)",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onDragStart={() => setActive(true)}
        onDragEnd={() => setActive(false)}
      >
        <div
          className="pointer-events-none absolute inset-[6px] rounded-[inherit] border border-white/22"
          style={{ borderRadius: toCssSize(lensHeight / 2 - 6, "9999px") }}
        />
      </motion.div>
    </div>
  );
};
