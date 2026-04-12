import React, { useEffect, useState } from "react";
import switchAssets from "virtual:liquidGlassFilterAssets?width=58&height=58&radius=29&bezelWidth=16&glassThickness=58&refractiveIndex=1.5&bezelType=lip";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableValue,
  useFilterId,
} from "./shared";

export type LiquidSwitchProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "type"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

const THUMB_SIZE = 58;
const TRACK_WIDTH = 92;
const TRACK_HEIGHT = 40;
const TRACK_PADDING = (THUMB_SIZE - TRACK_HEIGHT) / 2;

export const LiquidSwitch: React.FC<LiquidSwitchProps> = ({
  className,
  checked: controlledChecked,
  defaultChecked = false,
  disabled = false,
  onChange,
  onCheckedChange,
  ...inputProps
}) => {
  const filterId = useFilterId("liquid-switch");
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [checked, setChecked] = useControllableValue(
    controlledChecked,
    defaultChecked,
    onCheckedChange
  );
  const active = !disabled && (pressed || focused);
  const activeAmount = useAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.76,
  });
  const checkedAmount = useAnimatedNumber(checked ? 1 : 0, {
    stiffness: 0.16,
    damping: 0.74,
  });

  useEffect(() => {
    activeAmount.setTarget(active ? 1 : 0);
  }, [active]);

  useEffect(() => {
    checkedAmount.setTarget(checked ? 1 : 0);
  }, [checked]);

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

  const trackBackground = `rgba(${mix(148, 56, checkedAmount.value)},${mix(148, 189, checkedAmount.value)},${mix(159, 248, checkedAmount.value)},${mix(0.34, 0.48, checkedAmount.value)})`;
  const thumbLeft = (TRACK_WIDTH - THUMB_SIZE) * checkedAmount.value;
  const blur = mix(0.18, 0.08, activeAmount.value);
  const scaleRatio = mix(0.62, 0.94, activeAmount.value);
  const specularOpacity = mix(0.5, 0.6, activeAmount.value);
  const specularSaturation = mix(6, 8, activeAmount.value);
  const thumbScale = disabled ? 0.76 : mix(0.8, 0.94, activeAmount.value);
  const thumbBackground = `rgba(255,255,255,${mix(0.18, 0.3, checkedAmount.value)})`;
  const thumbShadow = `0 ${mix(8, 14, activeAmount.value)}px ${mix(22, 28, activeAmount.value)}px rgba(15,23,42,${mix(0.14, 0.18, activeAmount.value)})`;

  return (
    <label
      className={cn(
        "relative inline-flex h-[58px] w-[110px] shrink-0 select-none",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <input
        {...inputProps}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        className="absolute inset-0 z-20 h-full w-full cursor-inherit opacity-0"
        onChange={(event) => {
          setChecked(event.currentTarget.checked);
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
        style={{ left: TRACK_PADDING, right: TRACK_PADDING }}
      >
        <div
          className="absolute inset-x-0 border border-black/8 dark:border-white/8"
          style={{
            top: TRACK_PADDING,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: trackBackground,
            boxShadow: focused
              ? "0 0 0 1px rgba(56,189,248,0.22)"
              : "0 10px 24px rgba(15,23,42,0.08)",
            willChange: "background-color",
          }}
        />

        <LiquidGlassFilter
          id={filterId}
          assets={switchAssets}
          width={THUMB_SIZE}
          height={THUMB_SIZE}
          blur={blur}
          scaleRatio={scaleRatio}
          specularOpacity={specularOpacity}
          specularSaturation={specularSaturation}
        />

        <div
          className="pointer-events-none absolute border border-white/35 bg-white/16"
          style={{
            top: 0,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            left: thumbLeft,
            borderRadius: THUMB_SIZE / 2,
            backdropFilter: `url(#${filterId})`,
            transform: `scale(${thumbScale})`,
            backgroundColor: thumbBackground,
            boxShadow: thumbShadow,
            willChange: "left, transform, background-color, box-shadow",
          }}
        />
      </div>
    </label>
  );
};
