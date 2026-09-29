import { ApiError } from "../api/errors";
import { createApiClient } from "../api/client";
import { createResources } from "../api/resources";
import type { AuthProvider, Session, SessionStorage } from "./types";

/**
 * Dev-only login. The API has no password check and no POST /auth/login.
 * This looks the username up with GET /users and ignores the password.
 * Replace with a provider that calls POST /auth/login and stores access_token.
 */
export async function mockLogin(baseUrl: string, username: string, _password: string): Promise<Session> {
  const resources = createResources(createApiClient(baseUrl));
  const users = await resources.users.list();
  const user = users.find((item) => item.username === username);
  if (!user) {
    throw new ApiError(401, "No user with that username.", {});
  }
  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    accessToken: null,
  };
}

export class MockAuthProvider implements AuthProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly storage: SessionStorage,
  ) {}

  async login(username: string, password: string) {
    const session = await mockLogin(this.baseUrl, username, password);
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
