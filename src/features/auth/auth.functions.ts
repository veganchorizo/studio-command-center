import { createServerFn } from "@tanstack/react-start";
import type { StudioUser } from "./roles";

/** Who am I? Returns null when signed out — safe to call from anywhere. */
export const meFn = createServerFn({ method: "GET" }).handler(async (): Promise<StudioUser | null> => {
  const { currentUser } = await import("./session.server");
  return currentUser();
});

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => {
    if (typeof input?.email !== "string" || typeof input?.password !== "string") {
      throw new Error("Email and passphrase are required.");
    }
    return { email: input.email.slice(0, 320), password: input.password.slice(0, 512) };
  })
  .handler(async ({ data }): Promise<{ ok: true; user: StudioUser } | { ok: false; error: string }> => {
    const { authenticate } = await import("./users.server");
    const { startSession } = await import("./session.server");
    const user = await authenticate(data.email, data.password);
    if (!user) return { ok: false, error: "No account matches those credentials." };
    await startSession(user.id);
    return { ok: true, user };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { endSession } = await import("./session.server");
  await endSession();
  return { ok: true as const };
});

/** Any signed-in user may change their own passphrase. */
export const changeOwnPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: { current: string; next: string }) => {
    if (typeof input?.current !== "string" || typeof input?.next !== "string") {
      throw new Error("Both passphrases are required.");
    }
    if (input.next.length < 8) throw new Error("New passphrase must be at least 8 characters.");
    return input;
  })
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { authenticate, updateUser } = await import("./users.server");
    const me = await requireUser();
    const ok = await authenticate(me.email, data.current);
    if (!ok) throw new Error("Current passphrase is incorrect.");
    await updateUser({ id: me.id, password: data.next });
    return { ok: true as const };
  });
