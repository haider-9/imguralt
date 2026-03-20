import { handle as authHandle } from "./lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = authHandle;