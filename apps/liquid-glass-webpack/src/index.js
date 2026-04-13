import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
} from "@lollipopkit/liquid-glass-react";

function App() {
  const [searchValue, setSearchValue] = useState("");
  const [sliderValue, setSliderValue] = useState(18);
  const [switchChecked, setSwitchChecked] = useState(true);

  return React.createElement(
    "main",
    {
      style: {
        display: "grid",
        gap: "2rem",
        maxWidth: 960,
        margin: "0 auto",
        padding: "4rem 1.25rem 6rem",
        color: "#111827",
        fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
      },
    },
    [
      React.createElement(
        "section",
        {
          key: "intro",
          style: { display: "grid", gap: "0.9rem" },
        },
        [
          React.createElement(
            "div",
            {
              key: "eyebrow",
              style: {
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#7c2d12",
              },
            },
            "Webpack Fixture"
          ),
          React.createElement(
            "h1",
            {
              key: "title",
              style: {
                margin: 0,
                fontSize: "clamp(2.5rem, 4vw, 4.4rem)",
                lineHeight: 0.95,
              },
            },
            "Traditional bundler runtime verification"
          ),
          React.createElement(
            "p",
            {
              key: "copy",
              style: { maxWidth: 760, margin: 0, lineHeight: 1.8, color: "#4b5563" },
            },
            "This fixture validates @lollipopkit/liquid-glass-react in Webpack 5 without any Vite plugin. Components below force mode=\"runtime\"."
          ),
        ]
      ),
      React.createElement(
        "section",
        { key: "search", style: panelStyle },
        [
          React.createElement("div", { key: "label", style: labelStyle }, "Searchbox · runtime"),
          React.createElement(LiquidSearchbox, {
            key: "control",
            mode: "runtime",
            value: searchValue,
            onValueChange: setSearchValue,
            placeholder: "Search in Webpack",
            runtimeOptions: { backend: "auto", useCache: true },
          }),
        ]
      ),
      React.createElement(
        "section",
        { key: "slider", style: panelStyle },
        [
          React.createElement("div", { key: "label", style: labelStyle }, "Slider · runtime"),
          React.createElement(LiquidSlider, {
            key: "control",
            mode: "runtime",
            value: sliderValue,
            onValueChange: setSliderValue,
            runtimeOptions: { backend: "auto", useCache: true },
          }),
        ]
      ),
      React.createElement(
        "section",
        { key: "switch", style: panelStyle },
        [
          React.createElement("div", { key: "label", style: labelStyle }, "Switch · runtime"),
          React.createElement(LiquidSwitch, {
            key: "control",
            mode: "runtime",
            checked: switchChecked,
            onCheckedChange: setSwitchChecked,
            runtimeOptions: { backend: "auto", useCache: true },
          }),
        ]
      ),
    ]
  );
}

const panelStyle = {
  display: "grid",
  gap: "1rem",
  padding: "1.35rem",
  border: "1px solid rgba(17, 24, 39, 0.08)",
  borderRadius: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#6b7280",
};

document.body.style.margin = "0";
document.body.style.minHeight = "100vh";
document.body.style.background =
  "radial-gradient(circle at top, rgba(255,255,255,0.85), transparent 42%), linear-gradient(180deg, #f7efe7 0%, #efe6d8 100%)";

createRoot(document.getElementById("root")).render(React.createElement(App));
