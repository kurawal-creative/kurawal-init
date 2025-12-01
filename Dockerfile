FROM timbru31/node-chrome:jod AS builder

WORKDIR /client

COPY client/package.json ./package.json

RUN npm i bun -g
RUN bun install

COPY client/ ./

RUN bun run build

FROM timbru31/node-chrome:jod

WORKDIR /app

COPY . .

COPY --from=builder /client/dist ./client/dist

RUN npm i bun -g
RUN bun install

EXPOSE 3000

CMD ["bun", "src/index.ts"]
