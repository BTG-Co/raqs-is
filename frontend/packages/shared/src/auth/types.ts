import type { UserRole } from "../api/models";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
};

export type Session = {
  user: SessionUser;
  accessToken: string | null;
};

export interface SessionStorage {
  get(): Promise<Session | null>;
  set(session: Session): Promise<void>;
  clear(): Promise<void>;
}

export interface AuthProvider {
  login(username: string, password: string): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
}

export class MemorySessionStorage implements SessionStorage {
  private session: Session | null = null;

  async get() {
    return this.session;
  }

  async set(session: Session) {
    this.session = session;
  }

  async clear() {
    this.session = null;
  }
}
