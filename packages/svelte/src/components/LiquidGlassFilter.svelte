<script lang="ts">
  import type { LiquidGlassFilterAssets } from "@lollipopkit/liquid-glass";

  export let id: string;
  export let assets: LiquidGlassFilterAssets;
  export let withSvgWrapper = true;
  export let blur = 0.2;
  export let scaleRatio = 1;
  export let specularOpacity = 0.4;
  export let specularSaturation = 4;
  export let magnifyingScale = 24;
  export let width: number | undefined = undefined;
  export let height: number | undefined = undefined;

  $: actualWidth = width ?? assets.width;
  $: actualHeight = height ?? assets.height;
  $: scale = assets.maxDisplacement * scaleRatio;
</script>

{#if withSvgWrapper}
  <svg color-interpolation-filters="sRGB" style="display: none;">
    <defs>
      <filter {id}>
        {#if assets.magnifyingUrl}
          <feImage
            href={assets.magnifyingUrl}
            x="0"
            y="0"
            width={actualWidth}
            height={actualHeight}
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
        {/if}
        <feGaussianBlur
          in={assets.magnifyingUrl ? "magnified_source" : "SourceGraphic"}
          stdDeviation={blur}
          result="blurred_source"
        />
        <feImage
          href={assets.displacementUrl}
          x="0"
          y="0"
          width={actualWidth}
          height={actualHeight}
          result="displacement_map"
        />
        <feDisplacementMap
          in="blurred_source"
          in2="displacement_map"
          {scale}
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
          width={actualWidth}
          height={actualHeight}
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
    </defs>
  </svg>
{:else}
  <filter {id}>
    {#if assets.magnifyingUrl}
      <feImage
        href={assets.magnifyingUrl}
        x="0"
        y="0"
        width={actualWidth}
        height={actualHeight}
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
    {/if}
    <feGaussianBlur
      in={assets.magnifyingUrl ? "magnified_source" : "SourceGraphic"}
      stdDeviation={blur}
      result="blurred_source"
    />
    <feImage
      href={assets.displacementUrl}
      x="0"
      y="0"
      width={actualWidth}
      height={actualHeight}
      result="displacement_map"
    />
    <feDisplacementMap
      in="blurred_source"
      in2="displacement_map"
      {scale}
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
      width={actualWidth}
      height={actualHeight}
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
{/if}
