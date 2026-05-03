import { cloudApi } from "./cloud";
import { amveraApi } from "./amvera";
import type { ApiClient } from "./types";

const backend = (import.meta.env.VITE_API_BACKEND as string | undefined) ?? "cloud";

export const api: ApiClient = backend === "amvera" ? amveraApi : cloudApi;
export const apiBackend = backend;
export type * from "./types";
