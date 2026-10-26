import { ApiError, parseErrorBody } from "../api/errors";
import { createApiClient } from "../api/client";
import type { User } from "../api/models";
import type { AuthProvider, Session, SessionStorage } from "./types";

export async function loginWithPassword(baseUrl: string, username: string, password: string): Promise<Session> {
  const root = baseUrl.replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${root}/auth/user/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username, password }),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the API. Check the server and your connection.", {});
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { detail: text };
    }
  }
  if (!response.ok) throw parseErrorBody(response.status, data);

  const accessToken = accessTokenFrom(data);
  if (!accessToken) throw new ApiError(401, "Login did not return a token.", {});

  const user = await createApiClient(root, { getToken: () => accessToken }).get<User>("/auth/me");
  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    accessToken,
  };
}

function accessTokenFrom(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("access_token" in data)) return null;
  const token = (data as { access_token: unknown }).access_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export class JwtAuthProvider implements AuthProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly storage: SessionStorage,
  ) {}

  async login(username: string, password: string) {
    const session = await loginWithPassword(this.baseUrl, username, password);
    await this.storage.set(session);
    return session;
  }

  async logout() {
    await this.storage.clear();
  }

  getSession() {
    return this.storage.get();
  }
}
