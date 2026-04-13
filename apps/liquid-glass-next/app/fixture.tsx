"use client";

import { useState } from "react";
import {
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
} from "@lollipopkit/liquid-glass-react";

export function Fixture() {
  const [searchValue, setSearchValue] = useState("");
  const [sliderValue, setSliderValue] = useState(18);
  const [switchChecked, setSwitchChecked] = useState(true);

  return (
    <main
      style={{
        display: "grid",
        gap: "2rem",
        maxWidth: 960,
        margin: "0 auto",
        padding: "4rem 1.25rem 6rem",
      }}
    >
      <section style={{ display: "grid", gap: "0.9rem" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#7c2d12",
          }}
        >
          Next.js Fixture
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2.5rem, 4vw, 4.4rem)",
            lineHeight: 0.95,
          }}
        >
          Non-Vite runtime verification
        </h1>
        <p style={{ maxWidth: 760, margin: 0, lineHeight: 1.8, color: "#4b5563" }}>
          This page validates that <code>@lollipopkit/liquid-glass-react</code> can
          render in a real Next.js host without any Vite plugin. All components below
          force <code>mode="runtime"</code>.
        </p>
      </section>

      <section style={panelStyle}>
        <div style={labelStyle}>Searchbox · runtime</div>
        <LiquidSearchbox
          mode="runtime"
          value={searchValue}
          onValueChange={setSearchValue}
          placeholder="Search in Next.js"
          runtimeOptions={{ backend: "auto", useCache: true }}
        />
      </section>

      <section style={panelStyle}>
        <div style={labelStyle}>Slider · runtime</div>
        <LiquidSlider
          mode="runtime"
          value={sliderValue}
          onValueChange={setSliderValue}
          runtimeOptions={{ backend: "auto", useCache: true }}
        />
      </section>

      <section style={panelStyle}>
        <div style={labelStyle}>Switch · runtime</div>
        <LiquidSwitch
          mode="runtime"
          checked={switchChecked}
          onCheckedChange={setSwitchChecked}
          runtimeOptions={{ backend: "auto", useCache: true }}
        />
      </section>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  padding: "1.35rem",
  border: "1px solid rgba(17, 24, 39, 0.08)",
  borderRadius: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#6b7280",
};
