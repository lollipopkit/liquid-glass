import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  configureLiquidGlassStaticAssets,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
} from "@lollipopkit/liquid-glass-react";
import { registerLiquidGlassStaticAssets } from "virtual:liquidGlassStaticAssetRegistry";

registerLiquidGlassStaticAssets(configureLiquidGlassStaticAssets);

function App() {
  const [staticValue, setStaticValue] = useState("");
  const [runtimeValue, setRuntimeValue] = useState("");
  const [staticSlider, setStaticSlider] = useState(22);
  const [runtimeSlider, setRuntimeSlider] = useState(46);
  const [staticSwitch, setStaticSwitch] = useState(true);
  const [runtimeSwitch, setRuntimeSwitch] = useState(false);

  return React.createElement(
    "main",
    {
      style: {
        display: "grid",
        gap: "1.5rem",
        maxWidth: 980,
        margin: "0 auto",
        padding: "4rem 1.25rem 6rem",
        color: "#111827",
        fontFamily: '"Instrument Sans", "Segoe UI", sans-serif',
      },
    },
    [
      React.createElement(
        "section",
        {
          key: "intro",
          style: {
            display: "grid",
            gap: "0.9rem",
          },
        },
        [
          React.createElement(
            "div",
            {
              key: "eyebrow",
              style: sectionKickerStyle,
            },
            "React + Vite"
          ),
          React.createElement(
            "h1",
            {
              key: "title",
              style: {
                margin: 0,
                fontSize: "clamp(2.8rem, 5vw, 4.8rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
              },
            },
            "Static registry and runtime fallback in one app"
          ),
          React.createElement(
            "p",
            {
              key: "copy",
              style: descriptionStyle,
            },
            "This Vite fixture registers the generated static asset registry once, then renders the same components in both auto and runtime modes."
          ),
        ]
      ),
      React.createElement(
        "div",
        {
          key: "grid",
          style: demoGridStyle,
        },
        [
          React.createElement(
            DemoCard,
            {
              key: "static",
              title: "Auto mode",
              subtitle: "Uses registered static assets first",
            },
            [
              React.createElement(LiquidSearchbox, {
                key: "search",
                mode: "auto",
                value: staticValue,
                onValueChange: setStaticValue,
                placeholder: "Search in static mode",
              }),
              React.createElement(LiquidSlider, {
                key: "slider",
                mode: "auto",
                value: staticSlider,
                onValueChange: setStaticSlider,
              }),
              React.createElement(LiquidSwitch, {
                key: "switch",
                mode: "auto",
                checked: staticSwitch,
                onCheckedChange: setStaticSwitch,
              }),
            ]
          ),
          React.createElement(
            DemoCard,
            {
              key: "runtime",
              title: "Runtime mode",
              subtitle: "Bypasses static registry and renders on demand",
            },
            [
              React.createElement(LiquidSearchbox, {
                key: "search",
                mode: "runtime",
                value: runtimeValue,
                onValueChange: setRuntimeValue,
                placeholder: "Search in runtime mode",
                runtimeOptions: { backend: "auto", useCache: true },
              }),
              React.createElement(LiquidSlider, {
                key: "slider",
                mode: "runtime",
                value: runtimeSlider,
                onValueChange: setRuntimeSlider,
                runtimeOptions: { backend: "auto", useCache: true },
              }),
              React.createElement(LiquidSwitch, {
                key: "switch",
                mode: "runtime",
                checked: runtimeSwitch,
                onCheckedChange: setRuntimeSwitch,
                runtimeOptions: { backend: "auto", useCache: true },
              }),
            ]
          ),
        ]
      ),
    ]
  );
}

function DemoCard({ children, subtitle, title }) {
  return React.createElement(
    "section",
    {
      style: {
        display: "grid",
        gap: "1rem",
        alignContent: "start",
        padding: "1.35rem",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        borderRadius: 28,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.46))",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
      },
    },
    [
      React.createElement(
        "div",
        {
          key: "header",
          style: { display: "grid", gap: "0.35rem" },
        },
        [
          React.createElement(
            "div",
            { key: "title", style: { fontSize: 24, fontWeight: 700 } },
            title
          ),
          React.createElement(
            "div",
            { key: "subtitle", style: { color: "#4b5563", lineHeight: 1.7 } },
            subtitle
          ),
        ]
      ),
      ...children,
    ]
  );
}

const demoGridStyle = {
  display: "grid",
  gap: "1.25rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
};

const sectionKickerStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "#9a3412",
};

const descriptionStyle = {
  maxWidth: 760,
  margin: 0,
  lineHeight: 1.8,
  color: "#4b5563",
};

document.body.style.margin = "0";
document.body.style.minHeight = "100vh";
document.body.style.background =
  "radial-gradient(circle at top, rgba(255,255,255,0.84), transparent 42%), linear-gradient(180deg, #f7efe7 0%, #e7eef8 100%)";

createRoot(document.getElementById("root")).render(React.createElement(App));
