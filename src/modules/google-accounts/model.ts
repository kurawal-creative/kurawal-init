import { t } from "elysia";

/**
 * Validation schemas and types for Google Accounts module.
 *
 * Kept separate from service implementation so routes can import validation only.
 *
 * Note:
 * - createdAt/updatedAt are represented as ISO date strings in responses.
 * - Password field is required for creation but should NOT be returned in responses.
 */

export namespace GoogleAccountsModel {
    // Request body for creating a Google account
    export const createBody = t.Object({
        email: t.String({
            format: "email",
            error: "Invalid email",
        }),
    });

    export type CreateBody = typeof createBody.static;

    // Params for item routes
    export const params = t.Object({
        id: t.String(),
    });

    export type Params = typeof params.static;

    // Individual account item (metadata only, password omitted)
    export const accountItem = t.Object({
        id: t.String(),
        email: t.String(),
        createdAt: t.String(),
        updatedAt: t.String(),
    });

    export type AccountItem = typeof accountItem.static;

    // Response for list endpoint
    export const listResponse = t.Object({
        success: t.Boolean(),
        data: t.Array(accountItem),
    });

    export type ListResponse = typeof listResponse.static;

    // Response for single item
    export const singleResponse = t.Object({
        success: t.Boolean(),
        data: accountItem,
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
export type GoogleAccountCreateBody = GoogleAccountsModel.CreateBody;
export type GoogleAccountParams = GoogleAccountsModel.Params;
export type GoogleAccountDTO = GoogleAccountsModel.AccountItem;
export type GoogleAccountListResponse = GoogleAccountsModel.ListResponse;
export type GoogleAccountSingleResponse = GoogleAccountsModel.SingleResponse;
export type GoogleAccountDeleteResponse = GoogleAccountsModel.DeleteResponse;
