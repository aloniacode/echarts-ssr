import { createCanvas } from "@napi-rs/canvas";
import * as echarts from "echarts";
import { DEFAULT_CONFIG } from "./consts";
import type { IEchartConfig } from "./type";
import { restoreFunctionsInOption } from "./utils";

const DEVICE_PIXEL_RATIO = process.env.DEVICE_PIXEL_RATIO || "1";

/**
 * if `config.type` is `png`, return Buffer.
 * if `config.type` is `svg`, return a Base64-encoded svg string.
 */
function generate(config: Required<IEchartConfig>): Buffer | string {
  const newConfig = Object.assign({}, DEFAULT_CONFIG, config);
  const { type, width, height, option, enableAutoDispose } = newConfig;
  // restore functions in option
  restoreFunctionsInOption(option);
  // SVG renderer
  if (type && type === "svg") {
    const chart = echarts.init(null, null, {
      renderer: "svg",
      ssr: true,
      width,
      height,
    });

    chart.setOption(option);
    const svgString = chart.renderToSVGString();

    if (enableAutoDispose) {
      chart.dispose();
    }
    // Encoding to base64
    const buffer = Buffer.from(svgString, "utf-8");
    const base64String = buffer.toString("base64");
    return base64String;
  } else {
    // Canvas renderer
    // Init canvas instance
    const canvas = createCanvas(width, height);
    // Using canvas instance to initialize echart instance
    const chart = echarts.init(canvas, null, {
      devicePixelRatio: parseInt(DEVICE_PIXEL_RATIO, 10),
    });
    // Set options
    option.animation = false;
    option.textStyle = {
      fontFamily: "HarmonyOS_Sans_SC_Regular",
    };
    chart.setOption(option);

    const buffer = canvas.toBuffer("image/png");
    try {
      if (enableAutoDispose) {
        chart.dispose();
      }
    } catch (e) {
      console.log("Error: failed to dispose chart instace:", e);
    }
    return buffer;
  }
}

export default generate;
