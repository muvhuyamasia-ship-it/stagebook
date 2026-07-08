import { createStagebookApi } from "@stagebook/shared";
import { loadSession } from "./session";

export const stagebookApi = createStagebookApi({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  getToken: () => loadSession()?.token ?? null
});