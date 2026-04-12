import React, { useEffect, useState } from "react";
import sliderAssets from "virtual:liquidGlassFilterAssets?width=90&height=60&radius=30&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";

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

const THUMB_WIDTH = 90;
const THUMB_HEIGHT = 60;
const TRACK_HEIGHT = 14;
const REST_SCALE = 0.6;
const ACTIVE_SCALE = 1;
const REST_WIDTH = THUMB_WIDTH * REST_SCALE;

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
  const [pressed, setPressed] = useState(false);
  const safeMax = max > min ? max : min + 1;
  const [value, setValue] = useControllableValue(
    controlledValue,
    clamp(defaultValue ?? min, min, safeMax),
    onValueChange
  );
  const normalizedValue = clamp(value, min, safeMax);
  const progress = ((normalizedValue - min) / (safeMax - min)) * 100;
  const active = !disabled && pressed;
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
  const blur = 0;
  const scaleRatio = mix(0.4, 0.9, activeAmount.value);
  const specularOpacity = 0.4;
  const specularSaturation = 7;
  const thumbScale = disabled ? REST_SCALE : mix(REST_SCALE, ACTIVE_SCALE, activeAmount.value);
  const thumbBackground = disabled
    ? "rgba(255,255,255,0.2)"
    : `rgba(255,255,255,${mix(1, 0.1, activeAmount.value)})`;
  const thumbShadow = "0 3px 14px rgba(0,0,0,0.1)";

  return (
    <div
      className={cn(
        "relative w-full max-w-[330px] min-w-[220px] select-none",
        disabled ? "opacity-60" : undefined,
        className
      )}
    >
      <div className="relative h-[60px]">
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
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setPressed(false);
            inputProps.onBlur?.(event);
          }}
        />

        <div
          className="absolute inset-y-0"
          style={{ left: REST_WIDTH / 2, right: REST_WIDTH / 2 }}
        >
          <div
            className="absolute inset-x-0 overflow-hidden rounded-full"
            style={{
              top: (THUMB_HEIGHT - TRACK_HEIGHT) / 2,
              height: TRACK_HEIGHT,
              backgroundColor: "#89898F66",
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${animatedProgress}%`,
                backgroundColor: "#0377F7",
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
            className="pointer-events-none absolute"
            style={{
              top: 0,
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
