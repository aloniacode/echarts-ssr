import type { EChartsCoreOption } from "echarts/types/dist/core";

type EchartImageType = "png" | "svg";

export interface IEchartConfig {
  type: EchartImageType;
  option: EChartsCoreOption;
  width?: number;
  height?: number;
}
