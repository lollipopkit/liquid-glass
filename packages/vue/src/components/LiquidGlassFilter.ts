import type { LiquidGlassFilterAssets } from "@lollipopkit/liquid-glass";
import {
  computed,
  defineComponent,
  h,
  type PropType,
} from "vue";

export const LiquidGlassFilter = defineComponent({
  name: "LiquidGlassFilter",
  props: {
    id: {
      type: String,
      required: true,
    },
    assets: {
      type: Object as PropType<LiquidGlassFilterAssets>,
      required: true,
    },
    withSvgWrapper: {
      type: Boolean,
      default: true,
    },
    blur: {
      type: Number,
      default: 0.2,
    },
    scaleRatio: {
      type: Number,
      default: 1,
    },
    specularOpacity: {
      type: Number,
      default: 0.4,
    },
    specularSaturation: {
      type: Number,
      default: 4,
    },
    magnifyingScale: {
      type: Number,
      default: 24,
    },
    width: {
      type: Number,
      default: undefined,
    },
    height: {
      type: Number,
      default: undefined,
    },
  },
  setup(props) {
    const width = computed(() => props.width ?? props.assets.width);
    const height = computed(() => props.height ?? props.assets.height);
    const scale = computed(() => props.assets.maxDisplacement * props.scaleRatio);

    return () => {
      const children = [];

      if (props.assets.magnifyingUrl) {
        children.push(
          h("feImage", {
            href: props.assets.magnifyingUrl,
            x: 0,
            y: 0,
            width: width.value,
            height: height.value,
            result: "magnifying_displacement_map",
          }),
          h("feDisplacementMap", {
            in: "SourceGraphic",
            in2: "magnifying_displacement_map",
            scale: props.magnifyingScale,
            xChannelSelector: "R",
            yChannelSelector: "G",
            result: "magnified_source",
          })
        );
      }

      children.push(
        h("feGaussianBlur", {
          in: props.assets.magnifyingUrl ? "magnified_source" : "SourceGraphic",
          stdDeviation: props.blur,
          result: "blurred_source",
        }),
        h("feImage", {
          href: props.assets.displacementUrl,
          x: 0,
          y: 0,
          width: width.value,
          height: height.value,
          result: "displacement_map",
        }),
        h("feDisplacementMap", {
          in: "blurred_source",
          in2: "displacement_map",
          scale: scale.value,
          xChannelSelector: "R",
          yChannelSelector: "G",
          result: "displaced",
        }),
        h("feColorMatrix", {
          in: "displaced",
          type: "saturate",
          values: String(props.specularSaturation),
          result: "displaced_saturated",
        }),
        h("feImage", {
          href: props.assets.specularUrl,
          x: 0,
          y: 0,
          width: width.value,
          height: height.value,
          result: "specular_layer",
        }),
        h("feComposite", {
          in: "displaced_saturated",
          in2: "specular_layer",
          operator: "in",
          result: "specular_saturated",
        }),
        h(
          "feComponentTransfer",
          {
            in: "specular_layer",
            result: "specular_faded",
          },
          [h("feFuncA", { type: "linear", slope: props.specularOpacity })]
        ),
        h("feBlend", {
          in: "specular_saturated",
          in2: "displaced",
          mode: "normal",
          result: "withSaturation",
        }),
        h("feBlend", {
          in: "specular_faded",
          in2: "withSaturation",
          mode: "normal",
        })
      );

      const filter = h("filter", { id: props.id }, children);

      if (!props.withSvgWrapper) {
        return filter;
      }

      return h(
        "svg",
        {
          colorInterpolationFilters: "sRGB",
          style: { display: "none" },
        },
        [h("defs", null, [filter])]
      );
    };
  },
});
