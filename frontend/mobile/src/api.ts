import { createApiClient, createResources } from "@raqs/shared";

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export const resources = createResources(
  createApiClient(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000", {
    onUnauthorized: () => onUnauthorized(),
  }),
);
