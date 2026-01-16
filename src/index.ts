import { serve } from "@hono/node-server";
import { GlobalFonts } from "@napi-rs/canvas";
import cluster from "cluster";
import { existsSync } from "fs";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { logger } from "hono/logger";
import { cpus } from "os";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import generateChart from "./generator";
import type { IEchartConfig } from "./type";
import { isObject } from "./utils";

const AUTHORIZATION = process.env.AUTHORIZATION;
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number.parseInt(process.env.PORT || "7654", 10);
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const MAX_DIMENSION = 8000;

if (!AUTHORIZATION) {
    throw new Error("AUTHORIZATION is required");
}

const app = new Hono();

app.use(logger());
app.use("*", bearerAuth({ token: AUTHORIZATION }));

app.notFound((c) => c.text("Not found.", 404));

app.onError((err, c) => {
    console.error(err);
    return c.text("Internal server error.", 500);
});

app.get("/", (c) => {
    return c.text("[Echart SSR Server].use POST /chart to generate chart.");
});

app.post("/chart", async (c) => {
    let body: IEchartConfig;
    try {
        body = await c.req.json<IEchartConfig>();
    } catch {
        return c.text("Invalid JSON body.", 400);
    }

    const { type, option, width, height } = body;
    if (!type) {
        return c.text("Type is required.", 400);
    }
    if (type !== "svg" && type !== "png") {
        return c.text("Type must be svg or png.", 400);
    }
    if (!option) {
        return c.text("option is required.", 400);
    }
    if (!isObject(option)) {
        return c.text("Option must be an object.", 400);
    }

    const resolvedWidth = resolveDimension(width, DEFAULT_WIDTH);
    if (resolvedWidth === null) {
        return c.text(`width must be an integer between 1 and ${MAX_DIMENSION}.`, 400);
    }
    const resolvedHeight = resolveDimension(height, DEFAULT_HEIGHT);
    if (resolvedHeight === null) {
        return c.text(`height must be an integer between 1 and ${MAX_DIMENSION}.`, 400);
    }

    let chart: Buffer | string;
    try {
        chart = generateChart({
            type: type,
            option: option,
            width: resolvedWidth,
            height: resolvedHeight,
        });
    } catch (err) {
        console.error(err);
        return c.text("Failed to generate chart.", 500);
    }

    if (typeof chart === "string") {
        const svgText = Buffer.from(chart, "base64").toString("utf-8");
        return c.text(svgText, 200, {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "no-store",
        });
    }
    return c.newResponse(chart, 200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
    });
});
/**
 * resolve dimension from input, if input is undefined or null, return fallback value.
 * if input is not a number or not an integer, return null.
 * if input is less than 1 or greater than MAX_DIMENSION, return null.
 * otherwise, return input.
 * @param input dimension input
 * @param fallback fallback value
 * @returns resolved dimension or null
 */
function resolveDimension(input: unknown, fallback: number): number | null {
    if (input === undefined || input === null) {
        return fallback;
    }
    if (typeof input !== "number" || !Number.isInteger(input)) {
        return null;
    }
    if (input < 1 || input > MAX_DIMENSION) {
        return null;
    }
    return input;
}
/**
 * primary process running function
 */
function resolvePrimaryProcess() {
    const cpuCores = cpus().length;
    const coreNum = process.env.CORE_NUM;
    let workerNumber = 0;
    if (coreNum) {
        const parsed = Number.parseInt(coreNum, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
            workerNumber = Math.min(parsed, cpuCores);
        }
    } else {
        workerNumber = Math.ceil(cpuCores / 2);
    }
    // make sure worker number is at least 1
    workerNumber = Math.max(workerNumber, 1);
    for (let i = 0; i < workerNumber; i++) {
        cluster.fork();
    }
    // while worker is dead, restart it after 1 second
    cluster.on("exit", (worker, _code, _signal) => {
        console.log(`worker ${worker.process.pid} died.`);
        setTimeout(() => {
            cluster.fork();
        }, 1000);
    });
}
/**
 * resolve font path from current module path
 * @returns font path
 */
function resolveFontPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return path.resolve(__dirname, "./fonts/HarmonyOS_Sans_SC_Regular.ttf");
}
/**
 * worker process running function
 */
function resolveWorkerProcess() {
    const fontPath = resolveFontPath();
    if (!existsSync(fontPath)) {
        throw new Error(`Font file not found: ${fontPath}`);
    }
    const fontExist = GlobalFonts.families.find(font => font.family === "HarmonyOS_Sans_SC_Regular");
    if(!fontExist) {
        GlobalFonts.registerFromPath(fontPath, "HarmonyOS_Sans_SC_Regular");
    }

    serve(
        {
            fetch: app.fetch,
            hostname: HOST,
            port: Number.isFinite(PORT) ? PORT : 7654,
        },
        () => {
            console.log(`🚀Worker ${process.pid} started`);
        }
    );
}

// Cluster running
cluster.isPrimary ? resolvePrimaryProcess() : resolveWorkerProcess();
