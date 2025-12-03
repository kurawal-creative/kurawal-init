import { t } from "elysia";

export namespace GeminiModel {
    // Gemini Image Generation Request
    export const imageRequest = t.Object({
        image: t.Optional(
            t.File({
                type: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
                maxSize: 5 * 1024 * 1024, // 5MB
            }),
        ),
        prompt: t.String({
            minLength: 1,
            maxLength: 1000,
        }),
    });

    export type ImageRequest = typeof imageRequest.static;
}
