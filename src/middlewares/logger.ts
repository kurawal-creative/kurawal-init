import { Elysia } from "elysia";

export const logger = new Elysia({ name: "logger" })
    .onRequest(({ request }) => {
        const requestId = crypto.randomUUID();
        const url = new URL(request.url);
        console.log(`[${requestId}] ${request.method} ${url.pathname}`);
        // Store start time for duration calculation
        (request as any).__startTime = performance.now();
        (request as any).__requestId = requestId;
    })
    .onAfterHandle(({ request, set }) => {
        const requestId = (request as any).__requestId;
        const startTime = (request as any).__startTime;
        const duration = performance.now() - startTime;
        const url = new URL(request.url);
        console.log(
            `[${requestId}] ${request.method} ${url.pathname} - ${set.status} - ${duration.toFixed(2)}ms`,
        );
    });
