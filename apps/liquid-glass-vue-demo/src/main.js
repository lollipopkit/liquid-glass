import { createApp, h, ref } from "vue";
import {
  configureLiquidGlassStaticAssets,
  LiquidSearchbox,
  LiquidSlider,
  LiquidSwitch,
} from "@lollipopkit/liquid-glass-vue";
import { registerLiquidGlassStaticAssets } from "virtual:liquidGlassStaticAssetRegistry";

registerLiquidGlassStaticAssets(configureLiquidGlassStaticAssets);

const panelStyle = {
  display: "grid",
  gap: "1rem",
  alignContent: "start",
  padding: "1.35rem",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "28px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.46))",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const DemoCard = (title, subtitle, children) =>
  h("section", { style: panelStyle }, [
    h("div", { style: { display: "grid", gap: "0.35rem" } }, [
      h("div", { style: { fontSize: "24px", fontWeight: 700 } }, title),
      h("div", { style: { color: "#4b5563", lineHeight: 1.7 } }, subtitle),
    ]),
    ...children,
  ]);

createApp({
  setup() {
    const staticValue = ref("");
    const runtimeValue = ref("");
    const staticSlider = ref(22);
    const runtimeSlider = ref(46);
    const staticSwitch = ref(true);
    const runtimeSwitch = ref(false);

    return () =>
      h(
        "main",
        {
          style: {
            display: "grid",
            gap: "1.5rem",
            maxWidth: "980px",
            margin: "0 auto",
            padding: "4rem 1.25rem 6rem",
            color: "#111827",
            fontFamily: '"Instrument Sans", "Segoe UI", sans-serif',
          },
        },
        [
          h("section", { style: { display: "grid", gap: "0.9rem" } }, [
            h(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#9a3412",
                },
              },
              "Vue + Vite"
            ),
            h(
              "h1",
              {
                style: {
                  margin: 0,
                  fontSize: "clamp(2.8rem, 5vw, 4.8rem)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.04em",
                },
              },
              "Static registry and runtime fallback in one app"
            ),
            h(
              "p",
              {
                style: {
                  maxWidth: "760px",
                  margin: 0,
                  lineHeight: 1.8,
                  color: "#4b5563",
                },
              },
              "This Vite fixture registers the generated static asset registry once, then renders the same components in both auto and runtime modes."
            ),
          ]),
          h(
            "div",
            {
              style: {
                display: "grid",
                gap: "1.25rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              },
            },
            [
              DemoCard("Auto mode", "Uses registered static assets first", [
                h(LiquidSearchbox, {
                  modelValue: staticValue.value,
                  "onUpdate:modelValue": (value) => {
                    staticValue.value = value;
                  },
                  mode: "auto",
                  placeholder: "Search in static mode",
                }),
                h(LiquidSlider, {
                  modelValue: staticSlider.value,
                  "onUpdate:modelValue": (value) => {
                    staticSlider.value = value;
                  },
                  mode: "auto",
                }),
                h(LiquidSwitch, {
                  modelValue: staticSwitch.value,
                  "onUpdate:modelValue": (value) => {
                    staticSwitch.value = value;
                  },
                  mode: "auto",
                }),
              ]),
              DemoCard("Runtime mode", "Bypasses static registry and renders on demand", [
                h(LiquidSearchbox, {
                  modelValue: runtimeValue.value,
                  "onUpdate:modelValue": (value) => {
                    runtimeValue.value = value;
                  },
                  mode: "runtime",
                  placeholder: "Search in runtime mode",
                  runtimeOptions: { backend: "auto", useCache: true },
                }),
                h(LiquidSlider, {
                  modelValue: runtimeSlider.value,
                  "onUpdate:modelValue": (value) => {
                    runtimeSlider.value = value;
                  },
                  mode: "runtime",
                  runtimeOptions: { backend: "auto", useCache: true },
                }),
                h(LiquidSwitch, {
                  modelValue: runtimeSwitch.value,
                  "onUpdate:modelValue": (value) => {
                    runtimeSwitch.value = value;
                  },
                  mode: "runtime",
                  runtimeOptions: { backend: "auto", useCache: true },
                }),
              ]),
            ]
          ),
        ]
      );
  },
}).mount("#root");

document.body.style.margin = "0";
document.body.style.minHeight = "100vh";
document.body.style.background =
  "radial-gradient(circle at top, rgba(255,255,255,0.84), transparent 42%), linear-gradient(180deg, #f7efe7 0%, #e7eef8 100%)";
