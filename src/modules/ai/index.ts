// Controller handle HTTP related eg. routing, request validation
import { Elysia, t } from "elysia";
import { AIService } from "./service";

export const ai = new Elysia({ prefix: "/api/ai" })
    .post(
        "/gemini",
        async ({ body }) => {
            const { image, prompt } = body;
            return await AIService.generateGeminiImage(image, prompt);
        },
        {
            body: t.Object({
                image: t.File(),
                prompt: t.String(),
            }),
        },
    )
    .post(
        "/kimi",
        async ({ body }) => {
            const { query: queryText = "Hello" } = body;
            return await AIService.queryKimi(queryText);
        },
        {
            body: t.Object({
                query: t.Optional(t.String()),
            }),
        },
    )
    .get("/kimi/stream", async ({ query }) => {
        const queryText = (query.q as string) || "Hello";
        return await AIService.queryKimiStreamResponse(queryText);
    });
