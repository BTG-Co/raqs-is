import { createApiClient, createResources } from "@raqs/shared";

let onUnauthorized = () => {};
let accessToken: string | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const resources = createResources(
  createApiClient(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000", {
    getToken: () => accessToken,
    onUnauthorized: () => onUnauthorized(),
  }),
);
