import { Elysia, t } from "elysia";
import { AuthService, authenticateUser } from "./service";
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
        async ({ jwt, headers: { authorization } }) => {
            try {
                const user = await authenticateUser(jwt, authorization);

                const profile = await AuthService.getUserById(user.id);

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
    );
