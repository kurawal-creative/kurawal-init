import { Elysia } from "elysia";
import { gemini } from "./gemini";
import { kimi } from "./kimi";

export const ai = new Elysia({ prefix: "/api/ai" }).use(gemini).use(kimi);
