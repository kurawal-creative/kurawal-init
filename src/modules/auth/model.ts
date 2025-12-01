import { t } from "elysia";

export namespace AuthModel {
    export const signInBody = t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
    });

    export type signInBody = typeof signInBody.static;

    export const signInResponse = t.Object({
        user: t.Object({
            id: t.Number(),
            username: t.String(),
            email: t.String(),
            name: t.Optional(t.String()),
            avatar: t.Optional(t.String()),
        }),
        token: t.String(),
    });

    export type signInResponse = typeof signInResponse.static;

    export const errorResponse = t.Literal("Invalid credentials");
    export type errorResponse = typeof errorResponse.static;
}
