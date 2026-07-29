/**
 * Server-side account store. Passwords are salted + scrypt-hashed; the browser
 * never sees a hash. Accounts live in a JSON file on the mounted data volume,
 * so every machine hitting this container shares one roster.
 */
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { dataDir, mutateJson, readJson } from "@/lib/json-file.server";
import { initialsFor, type Role, type StudioUser } from "./roles";

export type StoredUser = StudioUser & { salt: string; hash: string };

type UsersFile = { version: 1; users: StoredUser[] };

async function usersPath() {
  return join(await dataDir(), "users.json");
}

const KEYLEN = 64;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expected: string) {
  const actual = scryptSync(password, salt, KEYLEN);
  const target = Buffer.from(expected, "hex");
  if (target.length !== actual.length) return false;
  return timingSafeEqual(actual, target);
}

export function publicUser(u: StoredUser): StudioUser {
  const { salt: _s, hash: _h, ...rest } = u;
  return rest;
}

function randomPassword() {
  return randomBytes(9).toString("base64url");
}

/** Creates the bootstrap owner the first time the container starts. */
async function seedUsers(): Promise<UsersFile> {
  const email = (process.env.STUDIO_ADMIN_EMAIL ?? "admin@studio.local").trim().toLowerCase();
  const supplied = process.env.STUDIO_ADMIN_PASSWORD?.trim();
  const password = supplied || randomPassword();
  const name = process.env.STUDIO_ADMIN_NAME?.trim() || "Studio Owner";
  const { salt, hash } = hashPassword(password);

  if (!supplied) {
    console.warn(
      `\n[studio-os] Created the first owner account.\n[studio-os]   email:    ${email}\n[studio-os]   password: ${password}\n[studio-os] Set STUDIO_ADMIN_EMAIL / STUDIO_ADMIN_PASSWORD to control this.\n`,
    );
  }

  return {
    version: 1,
    users: [
      {
        id: randomUUID(),
        email,
        name,
        initials: initialsFor(name),
        role: "owner",
        active: true,
        createdAt: new Date().toISOString(),
        lastSignInAt: null,
        salt,
        hash,
      },
    ],
  };
}

async function load(): Promise<UsersFile> {
  const file = await usersPath();
  const existing = await readJson<UsersFile>(file);
  if (existing?.users?.length) return existing;
  // mutateJson seeds + writes atomically, so concurrent boots can't double-seed.
  return mutateJson<UsersFile>(file, seedUsers, (current) => current);
}

export async function listUsers(): Promise<StudioUser[]> {
  const { users } = await load();
  return users
    .map(publicUser)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findById(id: string): Promise<StoredUser | null> {
  const { users } = await load();
  return users.find((u) => u.id === id) ?? null;
}

export async function authenticate(email: string, password: string): Promise<StudioUser | null> {
  const { users } = await load();
  const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!match || !match.active) return null;
  if (!verifyPassword(password, match.salt, match.hash)) return null;

  const now = new Date().toISOString();
  await mutateJson<UsersFile>(await usersPath(), seedUsers, (current) => ({
    ...current,
    users: current.users.map((u) => (u.id === match.id ? { ...u, lastSignInAt: now } : u)),
  }));
  return publicUser({ ...match, lastSignInAt: now });
}

export type CreateUserInput = { email: string; name: string; role: Role; password: string };

export async function createUser(input: CreateUserInput): Promise<StudioUser> {
  const email = input.email.trim().toLowerCase();
  const file = await usersPath();
  let created: StoredUser | null = null;

  await mutateJson<UsersFile>(file, seedUsers, (current) => {
    if (current.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error("An account with that email already exists.");
    }
    const { salt, hash } = hashPassword(input.password);
    created = {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      initials: initialsFor(input.name),
      role: input.role,
      active: true,
      createdAt: new Date().toISOString(),
      lastSignInAt: null,
      salt,
      hash,
    };
    return { ...current, users: [...current.users, created] };
  });

  return publicUser(created!);
}

export type UpdateUserInput = {
  id: string;
  name?: string;
  email?: string;
  role?: Role;
  active?: boolean;
  password?: string;
};

export async function updateUser(input: UpdateUserInput): Promise<StudioUser> {
  const file = await usersPath();
  let updated: StoredUser | null = null;

  await mutateJson<UsersFile>(file, seedUsers, (current) => {
    const target = current.users.find((u) => u.id === input.id);
    if (!target) throw new Error("That account no longer exists.");

    const email = input.email ? input.email.trim().toLowerCase() : target.email;
    if (
      email !== target.email &&
      current.users.some((u) => u.id !== target.id && u.email.toLowerCase() === email)
    ) {
      throw new Error("An account with that email already exists.");
    }

    const next: StoredUser = {
      ...target,
      email,
      name: input.name?.trim() || target.name,
      initials: initialsFor(input.name?.trim() || target.name),
      role: input.role ?? target.role,
      active: input.active ?? target.active,
    };
    if (input.password) {
      const { salt, hash } = hashPassword(input.password);
      next.salt = salt;
      next.hash = hash;
    }

    const owners = current.users.filter((u) => u.role === "owner" && u.active);
    const losesOwner = target.role === "owner" && (next.role !== "owner" || !next.active);
    if (losesOwner && owners.length <= 1) {
      throw new Error("This is the last active owner — promote someone else first.");
    }

    updated = next;
    return { ...current, users: current.users.map((u) => (u.id === next.id ? next : u)) };
  });

  return publicUser(updated!);
}

export async function deleteUser(id: string): Promise<void> {
  await mutateJson<UsersFile>(await usersPath(), seedUsers, (current) => {
    const target = current.users.find((u) => u.id === id);
    if (!target) return current;
    const owners = current.users.filter((u) => u.role === "owner" && u.active);
    if (target.role === "owner" && owners.length <= 1) {
      throw new Error("This is the last active owner — promote someone else first.");
    }
    return { ...current, users: current.users.filter((u) => u.id !== id) };
  });
}

/** Ensures the roster (and therefore the bootstrap owner) exists. */
export async function ensureUsers() {
  await load();
}
