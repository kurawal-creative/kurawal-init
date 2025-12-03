import { t } from "elysia";

export namespace KimiModel {
    // Kimi Query Request (POST body)
    export const queryRequest = t.Object({
        query: t.String({
            minLength: 1,
            maxLength: 2000,
            default: "Hello",
        }),
    });

    export type QueryRequest = typeof queryRequest.static;

    // Kimi Stream Query (GET query params)
    export const streamQuery = t.Object({
        q: t.String({
            minLength: 1,
            maxLength: 2000,
        }),
        apiKey: t.String({
            minLength: 1,
        }),
    });

    export type StreamQuery = typeof streamQuery.static;

    // Response Types
    export interface QueryResponse {
        success: boolean;
        html: string;
    }

    export interface StreamEvent {
        html: string;
        isComplete: boolean;
        progress: number;
    }
}
