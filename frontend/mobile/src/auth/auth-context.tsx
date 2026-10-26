import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { JwtAuthProvider, type Session } from "@raqs/shared";
import { secureSessionStorage } from "./storage";
import { setAccessToken, setUnauthorizedHandler } from "../api";

type AuthValue = {
  ready: boolean;
  session: Session | null;
  login: (username: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const auth = new JwtAuthProvider(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000", secureSessionStorage);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    void auth.getSession().then((stored) => {
      if (!active) return;
      setAccessToken(stored?.accessToken ?? null);
      setSession(stored);
      setReady(true);
    });
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      void auth.logout().then(() => setSession(null));
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session,
      login: async (username, password) => {
        const next = await auth.login(username, password);
        setAccessToken(next.accessToken);
        setSession(next);
        return next;
      },
      logout: async () => {
        setAccessToken(null);
        await auth.logout();
        setSession(null);
      },
    }),
    [ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
