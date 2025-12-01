FROM oven/bun:latest AS builder

WORKDIR /client

COPY client/package.json ./package.json
COPY client/bun.lock ./bun.lock

RUN bun install

COPY client/ ./

RUN bun run build

FROM oven/bun:latest

WORKDIR /app

COPY . .

COPY --from=builder /client/dist ./client/dist

RUN bun install

EXPOSE 3000

CMD ["bun", "src/index.ts"]
