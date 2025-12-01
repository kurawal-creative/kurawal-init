import fs from "fs";
import path from "path";
import { generateImage } from "@/lib/ai/gemini";
import { queryKimi, queryKimiStream } from "@/lib/ai/kimi";

export abstract class AIService {
    static async generateGeminiImage(image: File, prompt: string): Promise<Response> {
        if (!image) {
            return new Response("Image file is required", { status: 400 });
        }

        // Save file temporarily
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        const imagePath = path.join(tempDir, `upload_${Date.now()}_image.png`);
        const buffer = Buffer.from(await image.arrayBuffer());
        fs.writeFileSync(imagePath, buffer);

        try {
            const imageBuffer = await generateImage(imagePath, prompt);
            if (imageBuffer) {
                return new Response(imageBuffer as any, {
                    headers: {
                        "Content-Type": "image/png",
                        "Content-Disposition": "inline",
                    },
                });
            } else {
                return new Response("Failed to generate image", { status: 500 });
            }
        } catch (e) {
            return new Response("Error: " + (e instanceof Error ? e.message : String(e)), { status: 500 });
        } finally {
            // Clean up temp file
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
    }

    // Stream dengan Callback Pattern
    static async queryKimiStreamResponse(query: string): Promise<Response> {
        // Bikin ReadableStream sebagai variable
        const streamResponse = new ReadableStream({
            async start(controller) {
                try {
                    // Pass callback ke queryKimiStream untuk push data
                    await queryKimiStream(query, (html) => {
                        // Format SSE
                        const data = `data: ${JSON.stringify({ html })}\n\n`;
                        // Push ke stream
                        controller.enqueue(new TextEncoder().encode(data));
                    });

                    // Selesai, tutup stream
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(streamResponse, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    }

    // Non-stream (biasa)
    static async queryKimi(query: string): Promise<Response> {
        try {
            const html = await queryKimi(query);
            if (html) {
                return new Response(html, {
                    headers: { "Content-Type": "text/html" },
                });
            } else {
                return new Response("<p>No response</p>", { status: 500 });
            }
        } catch (e) {
            return new Response("<p>Error: " + (e instanceof Error ? e.message : String(e)) + "</p>", {
                status: 500,
                headers: { "Content-Type": "text/html" },
            });
        }
    }
}
