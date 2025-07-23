import { serve } from "@hono/node-server";
import { GlobalFonts } from "@napi-rs/canvas";
import cluster from "cluster";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cpus } from "os";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import generateChart from "./generator";
import type { IEchartConfig } from "./type";
import { isObject } from "./utils";

const AUTHORIZATION = process.env.AUTHORIZATION || "Bearer 123";
const HOST = process.env.HOST || "0.0.0.0";
const PORT = parseInt(process.env.PORT || "7654", 10);

const app = new Hono();

app.use(logger());

// Auth
app.use("*", async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth || auth !== AUTHORIZATION) {
    return c.text("No authorization.", 401);
  }
  await next();
});

app.get("/", (c) => {
  return c.text("[Echart SSR Server].use POST /chart to generate chart.");
});

app.post("/chart", async (c) => {
  const body = await c.req.json<IEchartConfig>();
  const { type, option, width, height } = body;
  if (!type) {
    return c.text("Type is required.", 400);
  }
  if (type !== "svg" && type !== "png") {
    return c.text("Type must be svg or png.", 400);
  }
  if (!option) {
    return c.text("option is required", 400);
  }
  if (!isObject(option)) {
    return c.text("Option must be an object.", 400);
  }
  const chart = generateChart({
    type: type,
    option: option,
    width: width || 600,
    height: height || 400,
  });
  if (typeof chart === "string") {
    return c.text(`data:image/svg+xml;base64,${chart}`, 200, {
      "Content-Type": "image/svg+xml",
    });
  }
  return c.newResponse(chart, 200, {
    "Content-Type": "image/png",
  });
});

if (cluster.isPrimary) {
  const cpuCores = cpus().length;
  const coreNum = process.env.CORE_NUM;
  let workerNumber = 0;
  if (coreNum) {
    if (parseInt(coreNum, 10) > cpuCores) {
      throw new TypeError("CORE_NUM is greater than cpu cores");
    }
    workerNumber = parseInt(coreNum, 10);
  } else {
    workerNumber = Math.ceil(cpuCores / 2);
  }
  for (let i = 0; i < workerNumber; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, _code, _signal) => {
    console.log(`worker ${worker.process.pid} died.`);
  });
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const fontPath = path.resolve(
    __dirname,
    "./fonts/HarmonyOS_Sans_SC_Regular.ttf"
  );
  GlobalFonts.registerFromPath(fontPath, "HarmonyOS_Sans_SC_Regular");

  serve(
    {
      fetch: app.fetch,
      hostname: HOST,
      port: PORT,
    },
    () => {
      console.log(`Worker ${process.pid} started`);
    }
  );
}
