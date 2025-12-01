FROM oven/bun:latest AS builder

WORKDIR /app

COPY client/ ./client/

WORKDIR /client

RUN bun install

RUN bun run build

FROM oven/bun:latest

WORKDIR /app

COPY . .

COPY --from=builder /client/dist ./client/dist

RUN bun install

EXPOSE 3000

CMD ["bun", "src/index.ts"]
