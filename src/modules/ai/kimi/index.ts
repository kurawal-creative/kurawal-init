import { Elysia } from "elysia";
import { KimiService, KimiStreamEvent } from "./service";
import { KimiModel } from "./model";
import { AppError } from "@/middlewares/error-handler";
import { validateApiKey } from "@/middlewares/validate-api-key";

export const kimi = new Elysia({ prefix: "/kimi" })
    .use(validateApiKey)
    .post(
        "/",
        async ({ body }) => {
            try {
                const html = await KimiService.query(body.query);

                if (!html || html.trim() === "") {
                    throw new AppError(500, "No response from Kimi");
                }

                return {
                    success: true,
                    html,
                };
            } catch (error) {
                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(500, error instanceof Error ? error.message : "Failed to query Kimi");
            }
        },
        {
            body: KimiModel.queryRequest,
            detail: {
                summary: "Query Kimi AI (non-streaming)",
                description: "Send a query to Kimi AI and get the complete response",
                tags: ["AI", "Kimi"],
            },
        },
    )
    .get(
        "/stream",
        async ({ query, request }) => {
            try {
                const queryText = query.q;
                const apiKey = query.apiKey;

                if (!queryText || queryText.trim() === "") {
                    throw new AppError(400, "Query parameter 'q' is required");
                }

                if (!apiKey || apiKey.trim() === "") {
                    throw new AppError(400, "Query parameter 'apiKey' is required");
                }

                // Validasi API key
                const { prisma } = await import("@/lib/prisma");
                const existingKey = await prisma.apiKey.findFirst({
                    where: {
                        key: apiKey,
                    },
                });

                if (!existingKey) {
                    throw new AppError(401, "Invalid API Key");
                }

                const handler = new KimiService();
                const encoder = new TextEncoder();

                const stream = new ReadableStream({
                    start(controller) {
                        // Listen to chunk events
                        handler.on("chunk", (event: KimiStreamEvent) => {
                            const data = `data: ${JSON.stringify(event)}\n\n`;
                            controller.enqueue(encoder.encode(data));
                        });

                        // Listen to error events
                        handler.on("error", (error: Error) => {
                            const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                            controller.enqueue(encoder.encode(errorData));
                            controller.close();
                            handler.cleanup();
                        });

                        // Listen to end event
                        handler.on("end", () => {
                            controller.close();
                            handler.cleanup();
                        });

                        // Handle client disconnect
                        request.signal.addEventListener("abort", () => {
                            console.log("⚠️ Client disconnected, cleaning up...");
                            controller.close();
                            handler.cleanup();
                        });

                        // Start streaming
                        handler.queryStream(queryText).catch((error) => {
                            console.error("Stream error:", error);
                            const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                            controller.enqueue(encoder.encode(errorData));
                            controller.close();
                            handler.cleanup();
                        });
                    },
                });

                return new Response(stream, {
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        Connection: "keep-alive",
                    },
                });
            } catch (error) {
                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(500, error instanceof Error ? error.message : "Failed to start stream");
            }
        },
        {
            query: KimiModel.streamQuery,
            detail: {
                summary: "Query Kimi AI (streaming)",
                description: "Send a query to Kimi AI and get streaming response via SSE using EventEmitter",
                tags: ["AI", "Kimi", "SSE"],
            },
        },
    );
