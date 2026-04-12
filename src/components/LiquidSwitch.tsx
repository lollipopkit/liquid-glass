import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Filter } from "virtual:refractionFilter?width=58&height=58&radius=29&bezelWidth=16&glassThickness=58&bezelType=lip&refractiveIndex=1.5";

import { cn, useControllableValue, useFilterId } from "./shared";

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

  useEffect(() => {
    if (!pressed) {
      return;
    }

    const handlePointerUp = () => setPressed(false);

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [pressed]);

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
        <motion.div
          className="absolute inset-x-0 border border-black/8 dark:border-white/8"
          style={{
            top: TRACK_PADDING,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
          }}
          initial={false}
          animate={{
            backgroundColor: checked
              ? "rgba(56,189,248,0.48)"
              : "rgba(148,148,159,0.34)",
            boxShadow: focused
              ? "0 0 0 1px rgba(56,189,248,0.22)"
              : "0 10px 24px rgba(15,23,42,0.08)",
          }}
          transition={{ duration: 0.18 }}
        />

        <Filter
          id={filterId}
          width={THUMB_SIZE}
          height={THUMB_SIZE}
          blur={active ? 0.08 : 0.18}
          scaleRatio={active ? 0.94 : 0.62}
          specularOpacity={active ? 0.6 : 0.5}
          specularSaturation={active ? 8 : 6}
        />

        <motion.div
          className="pointer-events-none absolute border border-white/35 bg-white/16 shadow-[0_10px_24px_rgba(15,23,42,0.15)]"
          style={{
            top: 0,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backdropFilter: `url(#${filterId})`,
          }}
          initial={false}
          animate={{
            left: checked ? TRACK_WIDTH - THUMB_SIZE : 0,
            scale: disabled ? 0.76 : active ? 0.94 : 0.8,
            backgroundColor: checked
              ? "rgba(255,255,255,0.3)"
              : "rgba(255,255,255,0.18)",
            boxShadow: active
              ? "0 14px 28px rgba(15,23,42,0.18)"
              : "0 8px 22px rgba(15,23,42,0.14)",
          }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
        />
      </div>
    </label>
  );
};
