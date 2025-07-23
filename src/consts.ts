const DEFAULT_OPTIONS = {
  title: {
    text: "test",
  },
  tooltip: {},
  legend: {
    data: ["test"],
  },
  xAxis: {
    data: ["a", "b", "c", "d", "f", "g"],
  },
  yAxis: {},
  series: [
    {
      name: "test",
      type: "bar",
      data: [5, 20, 36, 10, 10, 20],
    },
  ],
};

export const DEFAULT_CONFIG = {
  option: DEFAULT_OPTIONS,
  enableAutoDispose: true,
};

export const SUPPORTED_FONT_EXTS = [".ttf", ".otf", ".woff", ".woff2"];