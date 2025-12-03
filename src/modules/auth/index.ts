import { Elysia, t } from "elysia";
import { AuthService } from "./service";
import { AuthModel } from "./model";
import { jwtPlugin } from "./service";
import { AppError } from "@/middlewares/error-handler";

export const auth = new Elysia({ prefix: "/api/auth" })
    .use(jwtPlugin)
    .post(
        "/signin",
        async ({ body, jwt }) => {
            try {
                const user = await AuthService.signIn(body);
                const token = await jwt.sign({
                    id: user.id,
                    email: user.email,
                });

                return {
                    success: true,
                    data: {
                        user,
                        token,
                    },
                };
            } catch (error) {
                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(500, error instanceof Error ? error.message : "Sign in failed");
            }
        },
        {
            body: AuthModel.signInBody,
            response: AuthModel.signInResponse,
            detail: {
                summary: "Sign in",
                description: "Authenticate user with email and password",
                tags: ["Auth"],
            },
        },
    )
    .post(
        "/signup",
        async ({ body, jwt }) => {
            try {
                const user = await AuthService.signUp(body);
                const token = await jwt.sign({
                    id: user.id,
                    email: user.email,
                });

                return {
                    success: true,
                    data: {
                        user,
                        token,
                    },
                };
            } catch (error) {
                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(500, error instanceof Error ? error.message : "Sign up failed");
            }
        },
        {
            body: AuthModel.signUpBody,
            response: AuthModel.signUpResponse,
            detail: {
                summary: "Sign up",
                description: "Register a new user account",
                tags: ["Auth"],
            },
        },
    )
    .get(
        "/profile",
        async ({ jwt, headers }) => {
            try {
                const authHeader = headers.authorization;

                if (!authHeader) {
                    throw new AppError(401, "Authorization header is required");
                }

                if (!authHeader.startsWith("Bearer ")) {
                    throw new AppError(401, "Authorization header must be in format: Bearer <token>");
                }

                const token = authHeader.replace("Bearer ", "");

                if (!token) {
                    throw new AppError(401, "Token is required in Authorization header");
                }

                const payload = await jwt.verify(token);

                if (!payload) {
                    throw new AppError(401, "Invalid or expired token");
                }

                // Validate payload structure
                const jwtPayload = payload as { id: string; email: string };
                if (!jwtPayload.id || !jwtPayload.email) {
                    throw new AppError(401, "Invalid token payload");
                }

                const profile = await AuthService.getUserById(jwtPayload.id);

                return {
                    success: true,
                    data: profile,
                };
            } catch (error) {
                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(500, error instanceof Error ? error.message : "Failed to get profile");
            }
        },
        {
            response: AuthModel.profileResponse,
            detail: {
                summary: "Get profile",
                description: "Get authenticated user's profile",
                tags: ["Auth"],
            },
        },
    )
