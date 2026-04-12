import componentStyles from "./styles.css?inline";
import "./styles.css";

const STYLE_ID = "liquid-glass-vue-styles";

function ensureComponentStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = componentStyles;
  document.head.appendChild(style);
}

ensureComponentStyles();

export { LiquidSearchbox } from "./components/LiquidSearchbox";
export { LiquidSlider } from "./components/LiquidSlider";
export { LiquidSwitch } from "./components/LiquidSwitch";
export { LiquidMagnifyingGlass } from "./components/LiquidMagnifyingGlass";
export { LiquidParallaxHero } from "./components/LiquidParallaxHero";
