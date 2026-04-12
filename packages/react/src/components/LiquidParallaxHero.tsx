import React, { useEffect, useRef } from "react";
import heroAssets from "virtual:liquidGlassFilterAssets?width=150&height=150&radius=75&bezelWidth=40&glassThickness=120&refractiveIndex=1.5";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { cn, toCssSize, useAnimatedNumber, useFilterId } from "./shared";

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
  children,
  className,
  focalImageSrc,
  height,
  imageSrc,
  lensSize = 200,
  parallaxSpeed = -0.25,
}) => {
  const filterId = useFilterId("liquid-parallax-hero");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const progress = useAnimatedNumber(0, {
    stiffness: 0.12,
    damping: 0.82,
  });
  const sourceForLens = focalImageSrc ?? imageSrc;
  const backgroundOffset = Math.min(800, progress.value) * parallaxSpeed;
  const backgroundY = -60 + backgroundOffset;
  const focalY = 13 + backgroundOffset * 0.75;

  useEffect(() => {
    const update = () => {
      progress.setTarget(window.scrollY || 0);
    };

    const scheduleUpdate = () => {
      if (frameRef.current || typeof window === "undefined") {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        update();
      });
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameRef.current && typeof window !== "undefined") {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-slate-600/20",
          className
        )}
        style={{
          height: toCssSize(height, "400px"),
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: "700px auto",
          backgroundPositionX: "center",
          backgroundPositionY: `${backgroundY}px`,
        }}
      >
        {children}
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
          viewBox="0 0 150 150"
          preserveAspectRatio="xMidYMid slice"
          colorInterpolationFilters="sRGB"
          style={{
            borderRadius: "100px",
            boxShadow: "0 16px 31px rgba(0,0,0,0.4)",
          }}
        >
          <LiquidGlassFilter
            id={filterId}
            assets={heroAssets}
            width={150}
            height={150}
            specularOpacity={0.2}
            specularSaturation={6}
            withSvgWrapper={false}
          />
          <g filter={`url(#${filterId})`}>
            <image
              href={sourceForLens}
              width={lensSize}
              preserveAspectRatio="xMidYMid slice"
              x={-29}
              y={focalY}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
