/**
 * Encrypted cookie session. The signing key comes from SESSION_SECRET, or is
 * generated once into the data volume so a fresh container still gets a stable
 * key across restarts.
 */
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { useSession } from "@tanstack/react-start/server";
import { dataDir, readJson, writeJson } from "@/lib/json-file.server";
import { findById, publicUser } from "./users.server";
import { atLeast, type Role, type StudioUser } from "./roles";

type SessionData = { userId?: string };

let cachedSecret: string | null = null;

async function sessionSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }
  const file = join(await dataDir(), "session.key");
  const existing = await readJson<{ secret: string }>(file);
  if (existing?.secret) {
    cachedSecret = existing.secret;
    return cachedSecret;
  }
  const secret = randomBytes(48).toString("base64url");
  await writeJson(file, { secret });
  cachedSecret = secret;
  return secret;
}

async function config() {
  return {
    password: await sessionSecret(),
    name: "studio-os-session",
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      // Self-hosted studios usually run plain HTTP on a LAN; honour an opt-in.
      secure: process.env.STUDIO_SECURE_COOKIES === "true",
    },
  };
}

export async function startSession(userId: string) {
  const session = await useSession<SessionData>(await config());
  await session.update({ userId });
}

export async function endSession() {
  const session = await useSession<SessionData>(await config());
  await session.clear();
}

/** The signed-in user, or null. Deactivated accounts are treated as signed out. */
export async function currentUser(): Promise<StudioUser | null> {
  const session = await useSession<SessionData>(await config());
  const id = session.data?.userId;
  if (!id) return null;
  const found = await findById(id);
  if (!found || !found.active) return null;
  return publicUser(found);
}

export async function requireUser(): Promise<StudioUser> {
  const user = await currentUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

export async function requireRole(role: Role): Promise<StudioUser> {
  const user = await requireUser();
  if (!atLeast(user, role)) throw new Error("Your role does not allow that.");
  return user;
}
