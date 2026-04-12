import React, { useEffect, useState } from "react";
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableValue,
  useElementSize,
  useFilterId,
} from "./shared";

export type LiquidSearchboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "size" | "type" | "value"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
};

export const LiquidSearchbox: React.FC<LiquidSearchboxProps> = ({
  autoComplete = "off",
  className,
  defaultValue = "",
  disabled = false,
  inputClassName,
  onChange,
  onValueChange,
  placeholder = "Search",
  value: controlledValue,
  ...inputProps
}) => {
  const filterId = useFilterId("liquid-searchbox");
  const { ref, size } = useElementSize<HTMLLabelElement>();
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [value, setValue] = useControllableValue(
    controlledValue,
    defaultValue,
    onValueChange
  );
  const focusAmount = useAnimatedNumber(0, {
    stiffness: 0.14,
    damping: 0.76,
  });
  const pressAmount = useAnimatedNumber(0, {
    stiffness: 0.22,
    damping: 0.72,
  });

  useEffect(() => {
    focusAmount.setTarget(focused ? 1 : 0);
  }, [focused]);

  useEffect(() => {
    pressAmount.setTarget(pressed ? 1 : 0);
  }, [pressed]);

  const backgroundOpacity = Math.max(
    mix(0.05, 0.3, pressAmount.value),
    mix(0.05, 0.2, focusAmount.value)
  );
  const scale =
    mix(0.985, 1, focusAmount.value) * mix(1, 0.992, pressAmount.value);
  const blur = mix(0.8, 0.35, focusAmount.value);
  const scaleRatio = mix(0.72, 0.92, focusAmount.value);
  const specularOpacity = mix(0.18, 0.24, focusAmount.value);
  const specularSaturation = mix(4, 6, focusAmount.value);
  const boxShadow = `0 12px 28px rgba(15,23,42,${mix(0.12, 0.16, focusAmount.value)})`;

  return (
    <label
      ref={ref}
      className={cn(
        "relative flex h-14 w-full min-w-0 items-center overflow-hidden rounded-full border px-4 text-black",
        "border-black/10 bg-white/10 shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
        "dark:border-white/10 dark:bg-white/8 dark:text-white",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-text",
        className
      )}
      style={{
        transform: `scale(${disabled ? 1 : scale})`,
        willChange: "transform",
      }}
      onPointerDown={() => {
        if (!disabled) {
          setPressed(true);
        }
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <LiquidGlassFilter
        id={filterId}
        assets={searchboxAssets}
        width={Math.max(Math.round(size.width), 280)}
        height={56}
        blur={blur}
        scaleRatio={scaleRatio}
        specularOpacity={specularOpacity}
        specularSaturation={specularSaturation}
      />

      <span
        className="absolute inset-0"
        style={{
          borderRadius: 9999,
          backdropFilter: `url(#${filterId})`,
          backgroundColor: disabled
            ? "rgba(255,255,255,0.12)"
            : `rgba(255,255,255,${backgroundOpacity})`,
          boxShadow: focused
            ? `0 0 0 1px rgba(56,189,248,0.24), ${boxShadow}`
            : boxShadow,
          willChange: "background-color, box-shadow",
        }}
      />

      <span className="pointer-events-none relative z-[1] shrink-0 text-black/55 dark:text-white/55">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <input
        {...inputProps}
        autoComplete={autoComplete}
        disabled={disabled}
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn(
          "relative z-[1] ml-3 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-none",
          "text-black/80 outline-none placeholder:text-black/45 selection:bg-sky-400/25",
          "dark:text-white/82 dark:placeholder:text-white/42",
          "disabled:cursor-not-allowed",
          inputClassName
        )}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          onChange?.(event);
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
    </label>
  );
};
