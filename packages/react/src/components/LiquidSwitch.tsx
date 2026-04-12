import React, { useEffect, useState } from "react";
import switchAssets from "virtual:liquidGlassFilterAssets?width=146&height=92&radius=46&bezelWidth=19&glassThickness=47&refractiveIndex=1.5&bezelType=lip";

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

const THUMB_WIDTH = 146;
const THUMB_HEIGHT = 92;
const THUMB_RADIUS = THUMB_HEIGHT / 2;
const TRACK_WIDTH = 160;
const TRACK_HEIGHT = 67;
const REST_SCALE = 0.65;
const ACTIVE_SCALE = 0.9;
const THUMB_REST_OFFSET = ((1 - REST_SCALE) * THUMB_WIDTH) / 2;
const TRACK_PADDING = (THUMB_HEIGHT - TRACK_HEIGHT) / 2;
const TRAVEL =
  TRACK_WIDTH - TRACK_HEIGHT - (THUMB_WIDTH - THUMB_HEIGHT) * REST_SCALE;

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
  const [pressed, setPressed] = useState(false);
  const [checked, setChecked] = useControllableValue(
    controlledChecked,
    defaultChecked,
    onCheckedChange
  );
  const active = !disabled && pressed;
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

  const trackBackground = `rgba(${mix(148, 59, checkedAmount.value)},${mix(148, 191, checkedAmount.value)},${mix(159, 78, checkedAmount.value)},${mix(0.47, 0.93, checkedAmount.value)})`;
  const blur = 0.2;
  const scaleRatio = 0.4 + 0.5 * activeAmount.value;
  const specularOpacity = 0.5;
  const specularSaturation = 6;
  const thumbScale = disabled ? REST_SCALE : mix(REST_SCALE, ACTIVE_SCALE, activeAmount.value);
  const thumbLeft =
    -THUMB_REST_OFFSET +
    (TRACK_HEIGHT - THUMB_HEIGHT * REST_SCALE) / 2 +
    TRAVEL * checkedAmount.value;
  const thumbBackground = `rgba(255,255,255,${mix(1, 0.1, activeAmount.value)})`;
  const thumbShadow =
    activeAmount.value > 0.5
      ? "0 4px 22px rgba(0,0,0,0.1), inset 2px 7px 24px rgba(0,0,0,0.09), inset -2px -7px 24px rgba(255,255,255,0.09)"
      : "0 4px 22px rgba(0,0,0,0.1)";

  return (
    <label
      className={cn(
        "relative inline-flex h-[92px] w-[160px] shrink-0 select-none touch-none",
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
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setPressed(false);
          inputProps.onBlur?.(event);
        }}
      />

      <div
        className="absolute inset-y-0"
        style={{ left: 0, right: 0 }}
      >
        <div
          className="absolute"
          style={{
            top: TRACK_PADDING,
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: trackBackground,
            boxShadow: "none",
            willChange: "background-color",
          }}
        />

        <LiquidGlassFilter
          id={filterId}
          assets={switchAssets}
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
            left: thumbLeft,
            borderRadius: THUMB_RADIUS,
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
