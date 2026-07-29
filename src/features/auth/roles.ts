/** Role vocabulary — client-safe, shared by the browser store and the server. */
export const ROLES = ["owner", "engineer", "assistant", "intern"] as const;
export type Role = (typeof ROLES)[number];

export type StudioUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: Role;
  active: boolean;
  createdAt?: string;
  lastSignInAt?: string | null;
};

export const RANK: Record<Role, number> = { owner: 4, engineer: 3, assistant: 2, intern: 1 };

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

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
