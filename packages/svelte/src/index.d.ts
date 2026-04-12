import { SvelteComponent } from "svelte";

export interface LiquidSearchboxProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  autocomplete?: string;
  inputClass?: string;
  className?: string;
}

export interface LiquidSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export interface LiquidSwitchProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface LiquidMagnifyingGlassProps {
  lensWidth?: number;
  lensHeight?: number;
  initialX?: number;
  initialY?: number;
  magnification?: number;
  className?: string;
}

export interface LiquidParallaxHeroProps {
  imageSrc: string;
  alt: string;
  focalImageSrc?: string;
  height?: number | string;
  lensSize?: number;
  parallaxSpeed?: number;
  className?: string;
}

export class LiquidSearchbox extends SvelteComponent<LiquidSearchboxProps> {}
export class LiquidSlider extends SvelteComponent<LiquidSliderProps> {}
export class LiquidSwitch extends SvelteComponent<LiquidSwitchProps> {}
export class LiquidMagnifyingGlass extends SvelteComponent<LiquidMagnifyingGlassProps> {}
export class LiquidParallaxHero extends SvelteComponent<LiquidParallaxHeroProps> {}
