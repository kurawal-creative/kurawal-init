import { t } from "elysia";

/**
 * Validation schemas and types for API Keys module.
 */

export namespace ApiKeysModel {
    // Request body for creating an API Key
    export const createBody = t.Object({
        name: t.String({
            minLength: 1,
            error: "Name is required",
        }),
        key: t.String({
            minLength: 1,
            error: "Key is required",
        }),
    });

    export type CreateBody = typeof createBody.static;

    // Params for item routes
    export const params = t.Object({
        id: t.String(),
    });

    export type Params = typeof params.static;

    // Individual API Key item
    export const apiKeyItem = t.Object({
        id: t.String(),
        name: t.String(),
        key: t.String(),
        createdAt: t.String(),
        updatedAt: t.String(),
    });

    export type ApiKeyItem = typeof apiKeyItem.static;

    // Response for list endpoint
    export const listResponse = t.Object({
        success: t.Boolean(),
        data: t.Array(apiKeyItem),
    });

    export type ListResponse = typeof listResponse.static;

    // Response for single item
    export const singleResponse = t.Object({
        success: t.Boolean(),
        data: apiKeyItem,
    });

    export type SingleResponse = typeof singleResponse.static;

    // Response for delete
    export const deleteResponse = t.Object({
        success: t.Boolean(),
        message: t.String(),
    });

    export type DeleteResponse = typeof deleteResponse.static;
}

// Export top-level typed aliases for convenience
export type ApiKeyCreateBody = ApiKeysModel.CreateBody;
export type ApiKeyParams = ApiKeysModel.Params;
export type ApiKeyDTO = ApiKeysModel.ApiKeyItem;
export type ApiKeyListResponse = ApiKeysModel.ListResponse;
export type ApiKeySingleResponse = ApiKeysModel.SingleResponse;
export type ApiKeyDeleteResponse = ApiKeysModel.DeleteResponse;
