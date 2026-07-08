import { createStagebookApi } from "@stagebook/shared";
import { loadSession } from "./session";

export const stagebookApi = createStagebookApi({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  getToken: () => loadSession()?.token ?? null
});