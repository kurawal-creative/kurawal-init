import { Elysia } from "elysia";
import jwt from "@elysiajs/jwt";
import { prisma } from "@/lib/prisma";
import { config } from "@/config";
import { AppError } from "@/middlewares/error-handler";
import { AuthModel } from "./model";

// JWT Payload interface
interface JWTPayload {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
}

// User DTO interface
interface UserDTO {
    id: string;
    username: string;
    email: string;
    name?: string;
    avatar?: string;
}

// Auth Context interface - exported for type-safe usage
export interface AuthContext {
    user: {
        id: string;
        email: string;
    };
}

// ============================================
// JWT Plugin - Request Dependent Service
// ============================================
export const jwtPlugin = new Elysia({ name: "auth.jwt" }).use(
    jwt({
        name: "jwt",
        secret: config.jwt.secret,
    }),
);

// ============================================
// Authentication Plugin - Request Dependent Service
// ============================================
export const authenticate = new Elysia({ name: "auth.authenticate" }).use(jwtPlugin).derive(async ({ jwt, headers }) => {
    const authHeader = headers.authorization;

    if (!authHeader) {
        throw new AppError(401, "Authorization header missing");
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

    const payload = (await jwt.verify(token)) as JWTPayload | false;

    if (!payload) {
        throw new AppError(401, "Invalid or expired token");
    }

    return {
        user: {
            id: payload.id as string,
            email: payload.email,
        },
    };
});

// ============================================
// Auth Service - Non-Request Dependent Service
// ============================================
export abstract class AuthService {
    // Transform Prisma user to DTO
    private static toUserDTO(user: { id: string; username: string; email: string; name: string | null; avatar: string | null }): UserDTO {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name ?? undefined,
            avatar: user.avatar ?? undefined,
        };
    }

    // Sign In
    static async signIn(data: AuthModel.SignInBody): Promise<UserDTO> {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            // Generic error message to prevent user enumeration
            throw new AppError(401, "Invalid credentials");
        }

        // Verify password
        const isValid = await Bun.password.verify(data.password, user.password);

        if (!isValid) {
            throw new AppError(401, "Invalid credentials");
        }

        console.log(user);

        return this.toUserDTO(user);
    }

    // Sign Up
    static async signUp(data: AuthModel.SignUpBody): Promise<UserDTO> {
        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: data.email }, { username: data.username }],
            },
        });

        if (existing) {
            if (existing.email === data.email) {
                throw new AppError(409, "Email already registered");
            }
            if (existing.username === data.username) {
                throw new AppError(409, "Username already taken");
            }
        }

        // Hash password
        const hashedPassword = await Bun.password.hash(data.password, {
            algorithm: "bcrypt",
            cost: 10,
        });

        // Create user
        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                name: data.name,
            },
        });

        return this.toUserDTO(user);
    }

    // Get user by ID
    static async getUserById(id: string): Promise<UserDTO> {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError(404, "User not found");
        }

        return this.toUserDTO(user);
    }
}
