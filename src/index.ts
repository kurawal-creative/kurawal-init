import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { openapi } from "@elysiajs/openapi";
import { ai } from "@/modules/ai";
import { auth } from "@/modules/auth";
import { googleAccounts } from "@/modules/google-accounts";
import { apiKeys } from "@/modules/api-keys";
import { logger } from "@grotto/logysia";
import { cors } from "@elysiajs/cors";
import { config } from "@/config";
import { file } from "bun";

const app = new Elysia()
    .use(cors())
    .use(logger({ logIP: true }))
    .use(openapi())
    .use(staticPlugin({ assets: "client/dist", prefix: "/", indexHTML: false }))
    .use(ai)
    .use(auth)
    .use(googleAccounts)
    .use(apiKeys)
    .onError(({ code, path, set }) => {
        // Serve SPA for 404s that aren't API or asset requests
        if (code === "NOT_FOUND" && !path.startsWith("/api/") && !path.startsWith("/assets")) {
            set.status = 200;
            return file("./client/dist/index.html");
        }
    })
    .listen(
        config.server.port ||
            (() => {
                throw new Error("Server configuration is invalid: 'port' is undefined.");
            })(),
    );

console.log(`
╔════════════════════════════════════════════╗
║     🚀 Kurawal Init API Server             ║
╠════════════════════════════════════════════╣
║  Server: http://${app.server?.hostname}:${app.server?.port?.toString().padEnd(21)}║
║  Docs:   http://${app.server?.hostname}:${app.server?.port}/api/docs${" ".repeat(11)}║
║  Env:    ${config.server.env.padEnd(31)}║
╚════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    process.exit(0);
});
