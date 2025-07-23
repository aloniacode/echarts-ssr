import type { EChartsCoreOption } from "echarts/core";

const FUNCTION_FIELDS = new Set([
  "animationDuration",
  "animationDelay",
  "animationDurationUpdate",
  "animationDelayUpdate",
  "formatter",
  "pageFormatter",
  "optionToContent",
  "contentToOption",
  "valueFormatter",
  "symbolSize",
  "symbolRotate",
  "labelLayout",
  "color",
  "position",
]);

function parseFunction(funcStr: string) {
  try {
    return new Function("return " + funcStr)();
  } catch (error) {
    console.error(`Failed to parse function: ${funcStr}`, error);
    return undefined;
  }
}

export function isObject(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

function isArray(arr: any) {
  return Array.isArray(arr);
}

// Fuzzy judgement
function isFunctionString(str: string): boolean {
  return str.includes("function") || str.includes("=>");
}

function shouldParseFunction(key: string) {
  return FUNCTION_FIELDS.has(key);
}
export function restoreFunctionsInOption(option: EChartsCoreOption) {
  const stack: any[] = [option];
  while (stack.length > 0) {
    const current = stack.pop();
    if (isObject(current)) {
      Object.entries(current).forEach(([key, value]) => {
        if (
          typeof value === "string" &&
          shouldParseFunction(key) &&
          isFunctionString(value)
        ) {
          current[key] = parseFunction(value);
        } else if (isObject(value) || isArray(value)) {
          stack.push(value);
        }
      });
    }
    if (isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        const value = current[i];
        if (isObject(value) || isArray(value)) {
          stack.push(value);
        }
      }
    }
  }
}
