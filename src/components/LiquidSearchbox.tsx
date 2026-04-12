import { motion } from "motion/react";
import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";
import { Filter } from "virtual:refractionFilter?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";

import {
  cn,
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

  const interactive = !disabled;
  const active = interactive && (focused || pressed);
  const filterWidth = Math.max(Math.round(size.width), 280);

  return (
    <motion.label
      ref={ref}
      className={cn(
        "relative flex h-14 w-full min-w-0 items-center overflow-hidden rounded-full border",
        "border-black/10 bg-white/10 px-4 text-black shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
        "dark:border-white/10 dark:bg-white/8 dark:text-white",
        interactive ? "cursor-text" : "cursor-not-allowed opacity-70",
        className
      )}
      initial={false}
      animate={{
        scale: interactive ? (pressed ? 0.992 : focused ? 1 : 0.985) : 1,
      }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onPointerDown={() => {
        if (interactive) {
          setPressed(true);
        }
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <Filter
        id={filterId}
        width={filterWidth}
        height={56}
        blur={focused ? 0.35 : 0.8}
        scaleRatio={focused ? 0.92 : 0.72}
        specularOpacity={focused ? 0.24 : 0.18}
        specularSaturation={focused ? 6 : 4}
      />

      <motion.span
        className="absolute inset-0"
        style={{ borderRadius: 9999, backdropFilter: `url(#${filterId})` }}
        initial={false}
        animate={{
          backgroundColor: disabled
            ? "rgba(255,255,255,0.12)"
            : active
              ? "rgba(255,255,255,0.24)"
              : "rgba(255,255,255,0.14)",
          boxShadow: focused
            ? "0 0 0 1px rgba(56,189,248,0.24), 0 18px 40px rgba(15,23,42,0.16)"
            : "0 12px 28px rgba(15,23,42,0.12)",
        }}
        transition={{ duration: 0.18 }}
      />

      <span className="pointer-events-none relative z-[1] shrink-0 text-black/55 dark:text-white/55">
        <IoSearch size={18} aria-hidden="true" />
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
    </motion.label>
  );
};
