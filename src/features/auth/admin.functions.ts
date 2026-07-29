import { createServerFn } from "@tanstack/react-start";
import { ROLES, type Role, type StudioUser } from "./roles";

function assertRole(value: unknown): Role {
  if (typeof value !== "string" || !(ROLES as readonly string[]).includes(value)) {
    throw new Error("Unknown role.");
  }
  return value as Role;
}

function assertEmail(value: unknown): string {
  if (typeof value !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim())) {
    throw new Error("Enter a valid email address.");
  }
  return value.trim().slice(0, 320);
}

function assertName(value: unknown): string {
  if (typeof value !== "string" || value.trim().length < 2) throw new Error("Enter a name.");
  return value.trim().slice(0, 120);
}

function assertPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8) {
    throw new Error("Passphrase must be at least 8 characters.");
  }
  return value.slice(0, 512);
}

export const listUsersFn = createServerFn({ method: "GET" }).handler(async (): Promise<StudioUser[]> => {
  const { requireRole } = await import("./session.server");
  await requireRole("owner");
  const { listUsers } = await import("./users.server");
  return listUsers();
});

export const createUserFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; name: string; role: Role; password: string }) => ({
    email: assertEmail(input?.email),
    name: assertName(input?.name),
    role: assertRole(input?.role),
    password: assertPassword(input?.password),
  }))
  .handler(async ({ data }) => {
    const { requireRole } = await import("./session.server");
    await requireRole("owner");
    const { createUser } = await import("./users.server");
    return createUser(data);
  });

export const updateUserFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      email?: string;
      name?: string;
      role?: Role;
      active?: boolean;
      password?: string;
    }) => {
      if (typeof input?.id !== "string" || !input.id) throw new Error("Missing account id.");
      return {
        id: input.id,
        email: input.email === undefined ? undefined : assertEmail(input.email),
        name: input.name === undefined ? undefined : assertName(input.name),
        role: input.role === undefined ? undefined : assertRole(input.role),
        active: input.active === undefined ? undefined : Boolean(input.active),
        password: input.password ? assertPassword(input.password) : undefined,
      };
    },
  )
  .handler(async ({ data }) => {
    const { requireRole } = await import("./session.server");
    await requireRole("owner");
    const { updateUser } = await import("./users.server");
    return updateUser(data);
  });

export const deleteUserFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => {
    if (typeof input?.id !== "string" || !input.id) throw new Error("Missing account id.");
    return input;
  })
  .handler(async ({ data }) => {
    const { requireRole } = await import("./session.server");
    const me = await requireRole("owner");
    if (me.id === data.id) throw new Error("You cannot delete the account you are signed in with.");
    const { deleteUser } = await import("./users.server");
    await deleteUser(data.id);
    return { ok: true as const };
  });
