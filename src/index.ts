import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { ai } from "@/modules/ai";
import { auth } from "@/modules/auth";

const app = new Elysia()
    .use(
        staticPlugin({
            assets: "client/dist",
            prefix: "/",
            index: "index.html",
        }),
    )
    .use(ai)
    .use(auth)
    .get("/", () => "Hello Elysia")
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
