import type { UserRole } from "./api/models";

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}

/** Routes a staff account must not open. */
export const STAFF_HIDDEN_WEB_PREFIXES = [
  "/dashboard",
  "/measurements",
  "/measurement-conversions",
  "/users",
  "/settings",
] as const;
