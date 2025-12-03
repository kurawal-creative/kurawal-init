import { Elysia } from "elysia";
import { GoogleAccountsService } from "./service";
import { GoogleAccountsModel } from "./model";
import { AppError } from "@/middlewares/error-handler";
import { jwtPlugin } from "@/modules/auth/service";

/**
 * Google Accounts module (scaffold)
 *
 * Endpoints:
 *  - GET    /                 -> list all google accounts (basic metadata)
 *  - POST   /                 -> create/store a new google account
 *  - GET    /:id              -> get single google account (metadata)
 *  - DELETE /:id              -> remove a stored google account
 *
 * Implementation details are delegated to ./service and validation schemas to ./model.
 */

export const googleAccounts = new Elysia({ prefix: "/api/google-accounts" })
    .use(jwtPlugin)
    // List accounts
    .get(
        "/",
        async ({ query, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

                const page = parseInt(query.page || "1");
                const pageSize = parseInt(query.pageSize || "10");
                const accounts = await GoogleAccountsService.list(page, pageSize);
                return {
                    success: true,
                    data: accounts,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to list google accounts");
            }
        },
        {
            response: [GoogleAccountsModel.listResponse],
            detail: {
                summary: "List Google Accounts",
                description: "Retrieve stored Google account metadata with pagination",
                tags: ["Admin", "GoogleAccounts"],
            },
        },
    )

    // Create / store account
    .post(
        "/",
        async ({ body, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

                const created = await GoogleAccountsService.create(body);
                return {
                    success: true,
                    data: created,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to create google account");
            }
        },
        {
            body: GoogleAccountsModel.createBody,
            response: GoogleAccountsModel.singleResponse,
            detail: {
                summary: "Store Google Account",
                description: "Store a Google account (email + encrypted password or metadata). Actual storage strategy is implemented in service.",
                tags: ["Admin", "GoogleAccounts"],
            },
        },
    )

    // Get single account by id
    .get(
        "/:id",
        async ({ params, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

                const account = await GoogleAccountsService.findById(params.id);
                if (!account) {
                    throw new AppError(404, "Google account not found");
                }
                return {
                    success: true,
                    data: account,
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to get google account");
            }
        },
        {
            params: GoogleAccountsModel.params,
            response: GoogleAccountsModel.singleResponse,
            detail: {
                summary: "Get Google Account",
                description: "Get metadata for a single stored Google account",
                tags: ["Admin", "GoogleAccounts"],
            },
        },
    )

    // Delete account
    .delete(
        "/:id",
        async ({ params, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

                await GoogleAccountsService.remove(params.id);
                return {
                    success: true,
                    message: "Deleted",
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Failed to delete google account");
            }
        },
        {
            params: GoogleAccountsModel.params,
            response: GoogleAccountsModel.deleteResponse,
            detail: {
                summary: "Delete Google Account",
                description: "Remove a stored Google account",
                tags: ["Admin", "GoogleAccounts"],
            },
        },
    )

    // Relogin account
    .post(
        "/:id/relogin",
        async ({ params, jwt, headers }) => {
            try {
                // Verify JWT
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Unauthorized");
                }
                const token = authHeader.replace("Bearer ", "");
                const payload = await jwt.verify(token);
                if (!payload) {
                    throw new AppError(401, "Invalid token");
                }

                const updated = await GoogleAccountsService.relogin(params.id);
                return {
                    success: true,
                    data: updated,
                    message: "Account relogin berhasil",
                };
            } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(500, error instanceof Error ? error.message : "Gagal relogin account");
            }
        },
        {
            params: GoogleAccountsModel.params,
            detail: {
                summary: "Relogin Google Account",
                description: "Login ulang menggunakan cookie tersimpan atau email+password yang di-decrypt",
                tags: ["Admin", "GoogleAccounts"],
            },
        },
    );
