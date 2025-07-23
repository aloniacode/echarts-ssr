# Build phase
FROM docker.1ms.run/node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY src src
COPY tsconfig.json .swcrc ./
RUN pnpm build

# Running phase

FROM docker.1ms.run/node:22-alpine 

WORKDIR /app

COPY package.json ./
RUN npm install -g pnpm && \
    pnpm install --prod && \
    pnpm remove @swc/cli @swc/core typescript tsx --force

COPY --from=builder /app/dist ./dist

# Install fonts to support render canvas
RUN apk add --no-cache font-dejavu


EXPOSE 7654

CMD ["node","--experimental-specifier-resolution=node","dist/index.js"]