import { Elysia } from "elysia";
import { GeminiService } from "./service";
import { GeminiModel } from "./model";
import { AppError } from "@/middlewares/error-handler";
import { validateApiKey } from "@/middlewares/validate-api-key";

export const gemini = new Elysia({ prefix: "/gemini" }).use(validateApiKey).post(
    "/",
    async ({ body }) => {
        try {
            const response = await GeminiService.generateImage(body.image, body.prompt);

            if (Buffer.isBuffer(response)) {
                return new Response(new Uint8Array(response), {
                    headers: {
                        "Content-Type": "image/png",
                        "Content-Disposition": "inline; filename=generated.png",
                        "Cache-Control": "no-cache",
                    },
                });
            } else if (typeof response === "string") {
                return new Response(response, {
                    headers: {
                        "Content-Type": "text/plain",
                        "Cache-Control": "no-cache",
                    },
                });
            } else {
                throw new Error("Invalid response type");
            }
        } catch (error) {
            throw new AppError(500, error instanceof Error ? error.message : "Failed to generate image");
        }
    },
    {
        body: GeminiModel.imageRequest,
        detail: {
            summary: "Generate image with Gemini",
            description: "Optionally upload an image and provide a prompt to generate a new image using Gemini AI. If no image is provided, it will generate based on prompt only.",
            tags: ["AI", "Gemini"],
        },
    },
);
