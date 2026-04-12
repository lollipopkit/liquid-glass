import React, { useEffect, useState } from "react";
import sliderAssets from "virtual:liquidGlassFilterAssets?width=84&height=56&radius=28&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  clamp,
  cn,
  mix,
  useAnimatedNumber,
  useControllableValue,
  useFilterId,
} from "./shared";

export type LiquidSliderProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "max" | "min" | "step" | "type" | "value"
> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

const THUMB_WIDTH = 84;
const THUMB_HEIGHT = 56;

export const LiquidSlider: React.FC<LiquidSliderProps> = ({
  className,
  defaultValue,
  disabled = false,
  max = 100,
  min = 0,
  onChange,
  onValueChange,
  step = 1,
  value: controlledValue,
  ...inputProps
}) => {
  const filterId = useFilterId("liquid-slider");
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const safeMax = max > min ? max : min + 1;
  const [value, setValue] = useControllableValue(
    controlledValue,
    clamp(defaultValue ?? min, min, safeMax),
    onValueChange
  );
  const normalizedValue = clamp(value, min, safeMax);
  const progress = ((normalizedValue - min) / (safeMax - min)) * 100;
  const active = !disabled && (focused || pressed);
  const activeAmount = useAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.76,
  });
  const progressAmount = useAnimatedNumber(progress, {
    stiffness: 0.26,
    damping: 0.72,
  });

  const handleInput = (nextValue: number) => {
    setValue(nextValue);
  };

  useEffect(() => {
    activeAmount.setTarget(active ? 1 : 0);
  }, [active]);

  useEffect(() => {
    if (pressed) {
      progressAmount.jump(progress);
      return;
    }

    progressAmount.setTarget(progress);
  }, [pressed, progress]);

  useEffect(() => {
    if (!pressed) {
      return;
    }

    const onPointerUp = () => setPressed(false);
    const onPointerCancel = () => setPressed(false);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [pressed]);

  const animatedProgress = progressAmount.value;
  const blur = mix(0.3, 0.05, activeAmount.value);
  const scaleRatio = mix(0.56, 0.92, activeAmount.value);
  const specularOpacity = mix(0.4, 0.52, activeAmount.value);
  const specularSaturation = mix(7, 9, activeAmount.value);
  const thumbScale = disabled ? 0.72 : mix(0.68, 1, activeAmount.value);
  const thumbBackground = disabled
    ? "rgba(255,255,255,0.14)"
    : `rgba(255,255,255,${mix(0.16, 0.28, activeAmount.value)})`;
  const thumbShadow = `0 ${mix(8, 14, activeAmount.value)}px ${mix(20, 28, activeAmount.value)}px rgba(15,23,42,${mix(0.14, 0.18, activeAmount.value)})`;

  return (
    <div
      className={cn(
        "relative w-full min-w-[220px] select-none",
        disabled ? "opacity-60" : undefined,
        className
      )}
    >
      <div className="relative h-16">
        <input
          {...inputProps}
          className={cn(
            "absolute inset-0 z-20 m-0 h-full w-full cursor-pointer opacity-0 touch-none",
            disabled ? "cursor-not-allowed" : undefined
          )}
          type="range"
          min={min}
          max={safeMax}
          step={step}
          disabled={disabled}
          value={normalizedValue}
          onInput={(event) => {
            handleInput(Number(event.currentTarget.value));
            inputProps.onInput?.(event);
          }}
          onChange={(event) => {
            onChange?.(event);
          }}
          onPointerDown={(event) => {
            if (!disabled) {
              setPressed(true);
            }
            inputProps.onPointerDown?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            setPressed(false);
            inputProps.onBlur?.(event);
          }}
        />

        <div
          className="absolute inset-y-0"
          style={{ left: THUMB_WIDTH / 2, right: THUMB_WIDTH / 2 }}
        >
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-sky-500/85"
              style={{
                width: `${animatedProgress}%`,
              }}
            />
          </div>

          <LiquidGlassFilter
            id={filterId}
            assets={sliderAssets}
            width={THUMB_WIDTH}
            height={THUMB_HEIGHT}
            blur={blur}
            scaleRatio={scaleRatio}
            specularOpacity={specularOpacity}
            specularSaturation={specularSaturation}
          />

          <div
            className="pointer-events-none absolute border border-white/35 bg-white/16"
            style={{
              top: (64 - THUMB_HEIGHT) / 2,
              width: THUMB_WIDTH,
              height: THUMB_HEIGHT,
              left: `calc(${animatedProgress}% - ${THUMB_WIDTH / 2}px)`,
              borderRadius: THUMB_HEIGHT / 2,
              backdropFilter: `url(#${filterId})`,
              transform: `scale(${thumbScale})`,
              backgroundColor: thumbBackground,
              boxShadow: thumbShadow,
              willChange: "left, transform, background-color, box-shadow",
            }}
          />
        </div>
      </div>
    </div>
  );
};
