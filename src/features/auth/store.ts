import { create } from "zustand";
import { meFn, signInFn, signOutFn } from "./auth.functions";
import { atLeast, hasAnyRole, hasRole, ROLES, type Role, type StudioUser } from "./roles";

export { ROLES, atLeast, hasAnyRole, hasRole };
export type { Role, StudioUser };

/**
 * Session-backed auth. Credentials are checked on the server against the
 * hashed roster in the container's data volume; the browser only ever holds
 * the public user record returned by the session cookie.
 */
type AuthState = {
  user: StudioUser | null;
  hydrated: boolean;
  setUser: (user: StudioUser | null) => void;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user, hydrated: true }),
  signIn: async (email, password) => {
    try {
      const result = await signInFn({ data: { email, password } });
      if (!result.ok) return { ok: false as const, error: result.error };
      set({ user: result.user, hydrated: true });
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Could not reach the studio server.",
      };
    }
  },
  signOut: async () => {
    try {
      await signOutFn();
    } finally {
      set({ user: null, hydrated: true });
    }
  },
}));

let bootstrap: Promise<StudioUser | null> | null = null;

/** Resolve the current session once per page load; cached afterwards. */
export function bootstrapAuth(force = false): Promise<StudioUser | null> {
  if (force) bootstrap = null;
  if (!bootstrap) {
    bootstrap = meFn()
      .then((user) => {
        useAuth.setState({ user, hydrated: true });
        return user;
      })
      .catch(() => {
        useAuth.setState({ user: null, hydrated: true });
        return null;
      });
  }
  return bootstrap;
}

export function clearAuthCache() {
  bootstrap = null;
}
