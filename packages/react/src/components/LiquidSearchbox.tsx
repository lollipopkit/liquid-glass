import React, { useEffect, useRef, useState } from "react";
import type {
  LiquidGlassAssetMode,
  LiquidGlassFilterParamInput,
} from "@lollipopkit/liquid-glass";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  cn,
  mix,
  useAnimatedNumber,
  useControllableValue,
  useFilterId,
} from "./shared";
import {
  resolveLiquidGlassComponentAssets,
  resolveLiquidGlassComponentMode,
  useLiquidGlassRuntimeAssets,
  type UseLiquidGlassRuntimeAssetsOptions,
} from "../runtime";
import { getLiquidGlassStaticAssets } from "../staticAssets";

export type LiquidSearchboxRuntimeParams = Partial<
  Pick<
    LiquidGlassFilterParamInput,
    "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
  >
>;

const SEARCHBOX_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
  bezelType: "convex_squircle",
  bezelWidth: 27,
  glassThickness: 70,
  height: 56,
  radius: 28,
  refractiveIndex: 1.5,
  width: 420,
};

export type LiquidSearchboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "size" | "type" | "value"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  mode?: LiquidGlassAssetMode;
  runtime?: boolean;
  runtimeOptions?: UseLiquidGlassRuntimeAssetsOptions;
  runtimeParams?: LiquidSearchboxRuntimeParams;
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
  mode,
  runtime = false,
  runtimeOptions,
  runtimeParams,
  value: controlledValue,
  ...inputProps
}) => {
  const filterId = useFilterId("liquid-searchbox");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [value, setValue] = useControllableValue(
    controlledValue,
    defaultValue,
    onValueChange
  );
  const mergedRuntimeInput = {
    ...SEARCHBOX_RUNTIME_INPUT,
    ...runtimeParams,
  };
  const staticAssets = getLiquidGlassStaticAssets("searchbox");
  const resolvedMode = resolveLiquidGlassComponentMode(
    mode,
    runtime,
    Boolean(staticAssets)
  );
  const runtimeState = useLiquidGlassRuntimeAssets(
    mergedRuntimeInput,
    {
      ...runtimeOptions,
      enabled: resolvedMode === "runtime",
    }
  );
  const focusAmount = useAnimatedNumber(0, {
    stiffness: 0.18,
    damping: 0.8,
  });
  const pressAmount = useAnimatedNumber(0, {
    stiffness: 0.22,
    damping: 0.78,
  });

  useEffect(() => {
    focusAmount.setTarget(focused ? 1 : 0);
  }, [focused]);

  useEffect(() => {
    pressAmount.setTarget(pressed ? 1 : 0);
  }, [pressed]);

  useEffect(() => {
    if (!pressed) {
      return;
    }

    const clearPressed = () => setPressed(false);
    window.addEventListener("pointerup", clearPressed);
    window.addEventListener("pointercancel", clearPressed);

    return () => {
      window.removeEventListener("pointerup", clearPressed);
      window.removeEventListener("pointercancel", clearPressed);
    };
  }, [pressed]);

  const backgroundOpacity = Math.max(
    mix(0.05, 0.3, pressAmount.value),
    mix(0.05, 0.2, focusAmount.value)
  );
  const scale = mix(0.8, 1, focusAmount.value) * mix(1, 0.99, pressAmount.value);
  const blur = 1;
  const scaleRatio = 0.7;
  const specularOpacity = 0.2;
  const specularSaturation = 4;
  const boxShadow = "0 4px 16px rgba(0, 0, 0, 0.16)";
  const filterAssets = resolveLiquidGlassComponentAssets(
    resolvedMode,
    runtimeState.assets,
    staticAssets,
    mergedRuntimeInput
  );

  return (
    <label
      className={cn(
        "relative flex h-14 w-full max-w-[420px] min-w-0 items-center overflow-hidden rounded-full px-5 text-black",
        "dark:text-white",
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
      onClick={() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }}
    >
      <LiquidGlassFilter
        id={filterId}
        assets={filterAssets}
        width={filterAssets.width}
        height={filterAssets.height}
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
          boxShadow,
          transform: "translateZ(0)",
          willChange: "background-color",
        }}
      />

      <span className="pointer-events-none relative z-[1] shrink-0 opacity-70">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <input
        ref={inputRef}
        {...inputProps}
        autoComplete={autoComplete}
        disabled={disabled}
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn(
          "relative z-[1] ml-3 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-none",
          "text-black/70 outline-none placeholder:text-black/70 selection:bg-sky-400/25",
          "dark:text-white/70 dark:placeholder:text-white/70",
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
        onMouseDown={(event) => {
          if (!focused) {
            event.preventDefault();
          }
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
