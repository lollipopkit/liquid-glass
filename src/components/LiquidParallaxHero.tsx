import { motion, useScroll, useTransform } from "motion/react";
import React, { useRef } from "react";
import { Filter } from "virtual:refractionFilter?width=180&height=180&radius=90&bezelWidth=34&glassThickness=120&refractiveIndex=1.5&bezelType=convex_squircle";

import { cn, toCssSize, useFilterId } from "./shared";

export type LiquidParallaxHeroProps = {
  imageSrc: string;
  alt: string;
  focalImageSrc?: string;
  children?: React.ReactNode;
  height?: number | string;
  lensSize?: number;
  parallaxSpeed?: number;
  className?: string;
};

export const LiquidParallaxHero: React.FC<LiquidParallaxHeroProps> = ({
  alt,
  children,
  className,
  focalImageSrc,
  height,
  imageSrc,
  lensSize = 180,
  parallaxSpeed = -0.25,
}) => {
  const filterId = useFilterId("liquid-parallax-hero");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sourceForLens = focalImageSrc ?? imageSrc;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const backgroundTravel = 180 * parallaxSpeed;
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    [-backgroundTravel, backgroundTravel]
  );
  const focalY = useTransform(
    scrollYProgress,
    [0, 1],
    [-backgroundTravel * 0.72, backgroundTravel * 0.72]
  );
  const lensImageSize = lensSize * 1.34;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate overflow-hidden rounded-[32px] border border-black/10 bg-slate-900 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]",
        "dark:border-white/10",
        className
      )}
      style={{ height: toCssSize(height, "min(70vh, 560px)") }}
    >
      <motion.img
        src={imageSrc}
        alt={alt}
        className="absolute inset-0 h-[118%] w-full object-cover"
        style={{ y: backgroundY }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(255,255,255,0.15),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.4))]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />

      <div className="relative z-10 flex h-full items-end p-6 sm:p-8 lg:p-10">
        {children ? (
          <div className="max-w-2xl text-white drop-shadow-[0_10px_30px_rgba(15,23,42,0.22)]">
            {children}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg
          className="overflow-visible"
          viewBox={`0 0 ${lensSize} ${lensSize}`}
          preserveAspectRatio="xMidYMid slice"
          colorInterpolationFilters="sRGB"
          style={{
            width: lensSize,
            height: lensSize,
            filter: "drop-shadow(0 18px 36px rgba(15,23,42,0.24))",
          }}
        >
          <Filter
            id={filterId}
            width={lensSize}
            height={lensSize}
            specularOpacity={0.24}
            specularSaturation={6}
            withSvgWrapper={false}
          />
          <g filter={`url(#${filterId})`}>
            <motion.image
              href={sourceForLens}
              width={lensImageSize}
              height={lensImageSize}
              preserveAspectRatio="xMidYMid slice"
              style={{
                x: -(lensImageSize - lensSize) / 2,
                y: useTransform(
                  focalY,
                  (value) => value - (lensImageSize - lensSize) / 2
                ),
              }}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
