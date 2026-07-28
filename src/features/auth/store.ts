import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ROLES = ["owner", "engineer", "assistant", "intern"] as const;
export type Role = (typeof ROLES)[number];

export type StudioUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: Role;
};

/**
 * Local-only auth. Passwords are checked against a seeded local roster — this
 * is the UI contract a real auth backend will slot into, not real security.
 */
const ROSTER: Array<StudioUser & { password: string }> = [
  {
    id: "USR-1",
    email: "admin@studio.local",
    password: "studio",
    name: "D. Marchetti",
    initials: "DM",
    role: "owner",
  },
  {
    id: "USR-2",
    email: "engineer@studio.local",
    password: "studio",
    name: "S. Okafor",
    initials: "SO",
    role: "engineer",
  },
  {
    id: "USR-3",
    email: "assistant@studio.local",
    password: "studio",
    name: "P. Nowak",
    initials: "PN",
    role: "assistant",
  },
  {
    id: "USR-4",
    email: "intern@studio.local",
    password: "studio",
    name: "C. Ellis",
    initials: "CE",
    role: "intern",
  },
];

type AuthState = {
  user: StudioUser | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      signIn: (email, password) => {
        const match = ROSTER.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
        );
        if (!match) return { ok: false as const, error: "No local account matches those credentials." };
        const { password: _pw, ...user } = match;
        set({ user });
        return { ok: true as const };
      },
      signOut: () => set({ user: null }),
    }),
    {
      name: "studio-os:auth",
      partialize: (s: AuthState) => ({ user: s.user }) as unknown as AuthState,
      onRehydrateStorage: () => () => {
        useAuth.setState({ hydrated: true });
      },
    },
  ),
);

// Ensure the flag flips even when nothing was persisted.
if (typeof window !== "undefined") {
  useAuth.setState({ hydrated: true });
}


const RANK: Record<Role, number> = { owner: 4, engineer: 3, assistant: 2, intern: 1 };

export function hasRole(user: StudioUser | null, role: Role) {
  return user?.role === role;
}

export function hasAnyRole(user: StudioUser | null, roles: Role[]) {
  return !!user && roles.includes(user.role);
}

/** True when the user's role is at least as privileged as `role`. */
export function atLeast(user: StudioUser | null, role: Role) {
  return !!user && RANK[user.role] >= RANK[role];
}

export const DEMO_ACCOUNTS = ROSTER.map((u) => ({ email: u.email, role: u.role, name: u.name }));
