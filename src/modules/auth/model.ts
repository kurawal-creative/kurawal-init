import { t } from "elysia";

export namespace AuthModel {
    // Sign In
    export const signInBody = t.Object({
        email: t.String({
            format: "email",
            error: "Invalid email format",
        }),
        password: t.String({
            minLength: 1,
            error: "Password is required",
        }),
    });

    export type SignInBody = typeof signInBody.static;

    export const signInResponse = t.Object({
        success: t.Boolean(),
        data: t.Object({
            user: t.Object({
                id: t.String(),
                username: t.String(),
                email: t.String(),
                name: t.Optional(t.String()),
                avatar: t.Optional(t.String()),
            }),
            token: t.String(),
        }),
    });

    export type SignInResponse = typeof signInResponse.static;

    // Sign Up
    export const signUpBody = t.Object({
        username: t.String({
            minLength: 3,
            maxLength: 30,
            pattern: "^[a-zA-Z0-9_]+$",
            error: "Username must be 3-30 characters and contain only letters, numbers, and underscores",
        }),
        email: t.String({
            format: "email",
            error: "Invalid email format",
        }),
        password: t.String({
            minLength: 8,
            maxLength: 100,
            error: "Password must be 8-100 characters",
        }),
        name: t.Optional(
            t.String({
                maxLength: 100,
            }),
        ),
    });

    export type SignUpBody = typeof signUpBody.static;

    export const signUpResponse = t.Object({
        success: t.Boolean(),
        data: t.Object({
            user: t.Object({
                id: t.String(),
                username: t.String(),
                email: t.String(),
                name: t.Optional(t.String()),
                avatar: t.Optional(t.String()),
            }),
            token: t.String(),
        }),
    });

    export type SignUpResponse = typeof signUpResponse.static;

    // Get Profile
    export const profileResponse = t.Object({
        success: t.Boolean(),
        data: t.Object({
            id: t.String(),
            username: t.String(),
            email: t.String(),
            name: t.Optional(t.String()),
            avatar: t.Optional(t.String()),
        }),
    });

    export type ProfileResponse = typeof profileResponse.static;
}
