import React, { useEffect, useState } from "react";
import sliderAssets from "virtual:liquidGlassFilterAssets?width=84&height=56&radius=28&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import { clamp, cn, useControllableValue, useFilterId } from "./shared";

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

  useEffect(() => {
    if (!pressed) {
      return;
    }

    const onPointerUp = () => setPressed(false);
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, [pressed]);

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
            "absolute inset-0 z-20 m-0 h-full w-full cursor-pointer opacity-0",
            disabled ? "cursor-not-allowed" : undefined
          )}
          type="range"
          min={min}
          max={safeMax}
          step={step}
          disabled={disabled}
          value={normalizedValue}
          onChange={(event) => {
            const nextValue = Number(event.currentTarget.value);
            setValue(nextValue);
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
              className="h-full rounded-full bg-sky-500/85 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <LiquidGlassFilter
            id={filterId}
            assets={sliderAssets}
            width={THUMB_WIDTH}
            height={THUMB_HEIGHT}
            blur={active ? 0.1 : 0.3}
            scaleRatio={active ? 0.92 : 0.56}
            specularOpacity={active ? 0.52 : 0.4}
            specularSaturation={active ? 9 : 7}
          />

          <div
            className="pointer-events-none absolute border border-white/35 bg-white/16 shadow-[0_8px_26px_rgba(15,23,42,0.15)] transition-[left,transform,background-color,box-shadow] duration-200"
            style={{
              top: (64 - THUMB_HEIGHT) / 2,
              width: THUMB_WIDTH,
              height: THUMB_HEIGHT,
              left: `calc(${progress}% - ${THUMB_WIDTH / 2}px)`,
              borderRadius: THUMB_HEIGHT / 2,
              backdropFilter: `url(#${filterId})`,
              transform: `scale(${disabled ? 0.72 : active ? 1 : 0.7})`,
              backgroundColor: disabled
                ? "rgba(255,255,255,0.14)"
                : active
                  ? "rgba(255,255,255,0.28)"
                  : "rgba(255,255,255,0.16)",
              boxShadow: active
                ? "0 14px 28px rgba(15,23,42,0.18)"
                : "0 8px 20px rgba(15,23,42,0.14)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
