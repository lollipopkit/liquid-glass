import React, { useEffect, useRef, useState } from "react";
import type {
  CreateLiquidGlassRuntimeAssetsOptions,
  LiquidGlassAssetMode,
  LiquidGlassFilterParamInput,
} from "@lollipopkit/liquid-glass";

import { LiquidGlassFilter } from "./LiquidGlassFilter";
import {
  clamp,
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
} from "../runtime";
import { getLiquidGlassStaticAssets } from "../staticAssets";

export type LiquidSwitchRuntimeParams = Partial<
  Pick<
    LiquidGlassFilterParamInput,
    "bezelType" | "bezelWidth" | "glassThickness" | "magnify" | "radius" | "refractiveIndex"
  >
>;

export type LiquidSwitchProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "type"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  mode?: LiquidGlassAssetMode;
  runtime?: boolean;
  runtimeOptions?: CreateLiquidGlassRuntimeAssetsOptions;
  runtimeParams?: LiquidSwitchRuntimeParams;
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
const SWITCH_RUNTIME_INPUT: LiquidGlassFilterParamInput = {
  bezelType: "lip",
  bezelWidth: 19,
  glassThickness: 47,
  height: THUMB_HEIGHT,
  radius: 46,
  refractiveIndex: 1.5,
  width: THUMB_WIDTH,
};

export const LiquidSwitch: React.FC<LiquidSwitchProps> = ({
  className,
  checked: controlledChecked,
  defaultChecked = false,
  disabled = false,
  onChange,
  onCheckedChange,
  mode,
  runtime = false,
  runtimeOptions,
  runtimeParams,
  ...inputProps
}) => {
  const filterId = useFilterId("liquid-switch");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suppressClickRef = useRef(false);
  const dragStateRef = useRef({
    dragRatio: 0,
    moved: false,
    pointerId: -1,
    startChecked: false,
    startX: 0,
  });
  const [pressed, setPressed] = useState(false);
  const [checked, setChecked] = useControllableValue(
    controlledChecked,
    defaultChecked,
    onCheckedChange
  );
  const mergedRuntimeInput = {
    ...SWITCH_RUNTIME_INPUT,
    ...runtimeParams,
  };
  const staticAssets = getLiquidGlassStaticAssets("switch");
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
    if (pressed) {
      return;
    }

    checkedAmount.setTarget(checked ? 1 : 0);
  }, [checked, pressed]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      const baseRatio = dragState.startChecked ? 1 : 0;
      const displacement = event.clientX - dragState.startX;
      const ratio = baseRatio + displacement / TRAVEL;
      const overflow = ratio < 0 ? -ratio : ratio > 1 ? ratio - 1 : 0;
      const overflowSign = ratio < 0 ? -1 : 1;
      const displayRatio = clamp(ratio, 0, 1) + (overflowSign * overflow) / 22;

      dragState.dragRatio = displayRatio;
      dragState.moved = Math.abs(displacement) > 4;
      checkedAmount.jump(displayRatio);
    };

    const onPointerUp = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      const shouldCommit = dragState.moved;
      const nextChecked = clamp(dragState.dragRatio, 0, 1) > 0.5;

      dragState.pointerId = -1;
      dragState.dragRatio = 0;
      dragState.moved = false;
      inputRef.current?.releasePointerCapture?.(event.pointerId);
      setPressed(false);

      if (shouldCommit) {
        suppressClickRef.current = true;
        setChecked(nextChecked);
        return;
      }

      checkedAmount.setTarget(checked ? 1 : 0);
    };

    const onPointerCancel = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      dragState.pointerId = -1;
      dragState.dragRatio = 0;
      dragState.moved = false;
      inputRef.current?.releasePointerCapture?.(event.pointerId);
      setPressed(false);
      checkedAmount.setTarget(checked ? 1 : 0);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [checked, checkedAmount, setChecked]);

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
  const filterAssets = resolveLiquidGlassComponentAssets(
    resolvedMode,
    runtimeState.assets,
    staticAssets,
    mergedRuntimeInput
  );

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
        ref={inputRef}
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
            dragStateRef.current = {
              dragRatio: checked ? 1 : 0,
              moved: false,
              pointerId: event.pointerId,
              startChecked: checked,
              startX: event.clientX,
            };
            setPressed(true);
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }
          inputProps.onPointerDown?.(event);
        }}
        onClick={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
            return;
          }

          inputProps.onClick?.(event);
        }}
        onFocus={(event) => {
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          dragStateRef.current.pointerId = -1;
          dragStateRef.current.dragRatio = 0;
          dragStateRef.current.moved = false;
          setPressed(false);
          checkedAmount.setTarget(checked ? 1 : 0);
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
          assets={filterAssets}
          width={filterAssets.width}
          height={filterAssets.height}
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
