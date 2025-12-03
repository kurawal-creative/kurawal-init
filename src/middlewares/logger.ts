import { Elysia } from "elysia";

// Extend Request interface to include custom properties
interface ExtendedRequest extends Request {
    __startTime?: number;
    __requestId?: string;
}

export const logger = new Elysia({ name: "logger" })
    .onRequest(({ request }) => {
        const requestId = crypto.randomUUID();
        const url = new URL(request.url);
        console.log(`[${requestId}] ${request.method} ${url.pathname}`);
        // Store start time for duration calculation
        (request as ExtendedRequest).__startTime = performance.now();
        (request as ExtendedRequest).__requestId = requestId;
    })
    .onAfterHandle(({ request, set }) => {
        const extendedRequest = request as ExtendedRequest;
        const requestId = extendedRequest.__requestId;
        const startTime = extendedRequest.__startTime;
        const duration = performance.now() - startTime!;
        const url = new URL(request.url);
        console.log(`[${requestId}] ${request.method} ${url.pathname} - ${set.status} - ${duration.toFixed(2)}ms`);
    });
