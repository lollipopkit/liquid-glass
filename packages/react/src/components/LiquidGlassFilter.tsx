import type { LiquidGlassFilterAssets } from "@lollipopkit/liquid-glass";
import React from "react";

export type LiquidGlassFilterProps = {
  id: string;
  assets: LiquidGlassFilterAssets;
  withSvgWrapper?: boolean;
  blur?: number;
  scaleRatio?: number;
  specularOpacity?: number;
  specularSaturation?: number;
  magnifyingScale?: number;
  width?: number;
  height?: number;
};

export const LiquidGlassFilter: React.FC<LiquidGlassFilterProps> = ({
  id,
  assets,
  withSvgWrapper = true,
  blur = 0.2,
  scaleRatio = 1,
  specularOpacity = 0.4,
  specularSaturation = 4,
  magnifyingScale = 24,
  width = assets.width,
  height = assets.height,
}) => {
  const scale = assets.maxDisplacement * scaleRatio;

  const filter = (
    <filter id={id}>
      {assets.magnifyingUrl ? (
        <>
          <feImage
            href={assets.magnifyingUrl}
            x="0"
            y="0"
            width={width}
            height={height}
            result="magnifying_displacement_map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="magnifying_displacement_map"
            scale={magnifyingScale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="magnified_source"
          />
        </>
      ) : null}
      <feGaussianBlur
        in={assets.magnifyingUrl ? "magnified_source" : "SourceGraphic"}
        stdDeviation={blur}
        result="blurred_source"
      />
      <feImage
        href={assets.displacementUrl}
        x="0"
        y="0"
        width={width}
        height={height}
        result="displacement_map"
      />
      <feDisplacementMap
        in="blurred_source"
        in2="displacement_map"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="displaced"
      />
      <feColorMatrix
        in="displaced"
        type="saturate"
        values={String(specularSaturation)}
        result="displaced_saturated"
      />
      <feImage
        href={assets.specularUrl}
        x="0"
        y="0"
        width={width}
        height={height}
        result="specular_layer"
      />
      <feComposite
        in="displaced_saturated"
        in2="specular_layer"
        operator="in"
        result="specular_saturated"
      />
      <feComponentTransfer in="specular_layer" result="specular_faded">
        <feFuncA type="linear" slope={specularOpacity} />
      </feComponentTransfer>
      <feBlend
        in="specular_saturated"
        in2="displaced"
        mode="normal"
        result="withSaturation"
      />
      <feBlend in="specular_faded" in2="withSaturation" mode="normal" />
    </filter>
  );

  if (!withSvgWrapper) {
    return filter;
  }

  return (
    <svg colorInterpolationFilters="sRGB" style={{ display: "none" }}>
      <defs>{filter}</defs>
    </svg>
  );
};
