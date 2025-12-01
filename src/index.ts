import { Elysia } from "elysia";
import { ai } from "@/modules/ai";
import { auth } from "@/modules/auth";

const app = new Elysia()
    .use(ai)
    .use(auth)
    .get("/", () => "Hello Elysia")
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
