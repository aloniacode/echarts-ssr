# Echarts SSR Service

<div align="center">

📘 English | [中文](./README.zh-CN.md)

</div>

> Inspired by [echarts5-canvas-ssr](https://github.com/mosliu/echarts5-canvas-ssr#readme).

## New Features

- Based on Hono, fast and lightweight.

- Supports two types of responses, including image buffer and SVG string.

- Supports parsing function strings in Echarts options.

- Multi-process architecture.

- Uses [skr canvas](https://github.com/Brooooooklyn/canvas) instead of [node-canvas](https://github.com/Automattic/node-canvas), providing better canvas rendering performance.

## Usage

### Local Development

```sh
pnpm install

pnpm run dev
```

### Service Deployment

```sh
pnpm install

pnpm run build

pnpm run start
```

### Container Deployment

```sh
docker build -t echarts-ssr-server:latest .

docker run -d -p 7654:7654 --name echarts-ssr echarts-ssr:latest
```

## API Endpoints

### Default Endpoint

> Returns a simple message string. You can expand this endpoint to serve your own purposes.

```http
GET /
```

### Chart Endpoint

```sh
POST /chart
```

Body of `POST` Request:

| Parameter | Type               | Description                                                                                                                                                                                   |
| --------  | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | `'png' \| 'svg'`   | Type of response content. If the `type` value is `'png'`, the response will be binary data (`Buffer`). If the `type` value is `'svg'`, the response will be a Base64-encoded SVG string. Default is `'png'`. |
| `option`  | `EchartCoreOption` | Echarts configuration options.                                                                                                                                                               |
| `width`   | `number \| string` | Chart width.                                                                                                                                                                                 |
| `height`  | `number \| string` | Chart height.                                                                                                                                                                                |

If you need to use a function in the echarts option, send it as a string. For example:

```json
{
  "legend": {
    "data": ["Sales", "Marketing", "Technology"],
    "formatter": "(name) => name.toUpperCase()"
  }
}
```

## Custom Deployment

You can customize the `ENV` variables in `Dockerfile` to modify the default configurations.

```Dockerfile
# Number of worker threads.
# Make sure you do not exceed the total number of CPU cores in your machine.
# The best practice is to use half the total number of CPU cores.
ENV WORKER_PROCESSES=8

# Simple authorization for the server. Default is "Bearer 123".
ENV AUTHORIZATION="Bearer 123456789"

# Hostname of the Node server. Defaults to "0.0.0.0".
ENV HOST="0.0.0.0"

# Port of the Node server. Ensure that the port is available. Default is `7654`.
ENV PORT=9999

# This value determines the resolution of the chart and defaults to `window.devicePixelRatio` in browsers.
ENV DEVICE_PIXEL_RATIO=1.5
```
