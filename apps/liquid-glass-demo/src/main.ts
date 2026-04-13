import { mount } from "svelte";
import {
  configureLiquidGlassStaticAssets,
} from "@lollipopkit/liquid-glass-svelte";
import heroAssets from "virtual:liquidGlassFilterAssets?width=150&height=150&radius=75&bezelWidth=40&glassThickness=120&refractiveIndex=1.5";
import magnifierAssets from "virtual:liquidGlassFilterAssets?width=210&height=150&radius=75&bezelWidth=25&glassThickness=110&refractiveIndex=1.5&bezelType=convex_squircle&magnify=true";
import searchboxAssets from "virtual:liquidGlassFilterAssets?width=420&height=56&radius=28&bezelWidth=27&glassThickness=70&refractiveIndex=1.5&bezelType=convex_squircle";
import sliderAssets from "virtual:liquidGlassFilterAssets?width=90&height=60&radius=30&bezelWidth=16&glassThickness=80&refractiveIndex=1.45&bezelType=convex_squircle";
import switchAssets from "virtual:liquidGlassFilterAssets?width=146&height=92&radius=46&bezelWidth=19&glassThickness=47&refractiveIndex=1.5&bezelType=lip";

import App from "./App.svelte";
import "./index.css";

configureLiquidGlassStaticAssets({
  hero: heroAssets,
  magnifier: magnifierAssets,
  searchbox: searchboxAssets,
  slider: sliderAssets,
  switch: switchAssets,
});

const app = mount(App, {
  target: document.getElementById("root")!,
});

export default app;
