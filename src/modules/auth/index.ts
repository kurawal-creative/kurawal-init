// Controller handle HTTP related eg. routing, request validation
import { Elysia, t } from "elysia";
import jwt from "@elysiajs/jwt";
import { AuthService } from "./service";
import { AuthModel } from "./model";

export const auth = new Elysia({ prefix: "/api/auth" })
    .use(
        jwt({
            name: "jwt",
            secret: process.env.JWT_SECRET!,
        }),
    )
    .post(
        "/signin",
        async ({ body, jwt }) => {
            try {
                const user = await AuthService.signIn(body);
                const token = await jwt.sign({ id: user.id, email: user.email });
                return { user, token };
            } catch (error) {
                throw new Error(error instanceof Error ? error.message : "Signin failed");
            }
        },
        {
            body: AuthModel.signInBody,
            response: AuthModel.signInResponse,
        },
    );
