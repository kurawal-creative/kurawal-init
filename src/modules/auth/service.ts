import { prisma } from "@/lib/prisma";
import { AuthModel } from "./model";

export abstract class AuthService {
    static async signIn(data: AuthModel.signInBody): Promise<{
        id: number;
        username: string;
        email: string;
        name?: string;
        avatar?: string;
    }> {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        // Verify password
        const isValid = await Bun.password.verify(data.password, user.password);
        if (!isValid) {
            throw new Error("Invalid credentials");
        }

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name ?? undefined,
            avatar: user.avatar ?? undefined,
        };
    }
}
