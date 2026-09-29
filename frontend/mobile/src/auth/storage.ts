import * as SecureStore from "expo-secure-store";
import type { Session, SessionStorage } from "@raqs/shared";

const KEY = "raqs_session";
let memory: Session | null = null;

export const secureSessionStorage: SessionStorage = {
  async get() {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Session;
    } catch {
      return memory;
    }
  },
  async set(session) {
    memory = session;
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(session));
    } catch {
      // Web and some simulators have no secure store. Memory still holds the session.
    }
  },
  async clear() {
    memory = null;
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {
      // Ignore missing secure store.
    }
  },
};
