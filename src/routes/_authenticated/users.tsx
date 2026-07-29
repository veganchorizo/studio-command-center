import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/studio/Panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, atLeast, useAuth, type Role, type StudioUser } from "@/features/auth/store";
import {
  createUserFn,
  deleteUserFn,
  listUsersFn,
  updateUserFn,
} from "@/features/auth/admin.functions";

const TITLE = "Users — The Studio OS";
const DESC = "Create studio accounts, assign roles and reset passphrases across the whole studio.";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

const ROLE_NOTES: Record<Role, string> = {
  owner: "Full control, including accounts, finance and data import.",
  engineer: "Runs sessions, clients, campaigns and training.",
  assistant: "Day-to-day records: sessions, gear, archive, tickets.",
  intern: "Read-only across the studio, plus tasks and notes.",
};

function errText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function UsersPage() {
  const me = useAuth((s) => s.user);
  const isOwner = atLeast(me, "owner");
  const [users, setUsers] = useState<StudioUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      setUsers(await listUsersFn());
    } catch (err) {
      toast.error("Could not load accounts", { description: errText(err, "Try again.") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOwner) void reload();
    else setLoading(false);
  }, [isOwner]);

  if (!isOwner) {
    return (
      <div className="space-y-4">
        <PageHeader title="Users" code="SYS / ACCESS" subtitle="Owner access required." />
        <Panel title="Restricted" code="403">
          <p className="text-xs text-muted-foreground">
            Only studio owners can create accounts and assign roles. Ask an owner for access.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        code="SYS / ACCESS"
        subtitle="Accounts live on the studio server — anyone reaching this container signs in with them."
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <Panel title="Roster" code={`${users.length} ACCOUNT${users.length === 1 ? "" : "S"}`}>
          {loading ? (
            <p className="readout text-[0.65rem] text-muted-foreground">Loading roster…</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {users.map((u) => (
                <UserRow key={u.id} user={u} isSelf={u.id === me?.id} onChanged={reload} />
              ))}
            </ul>
          )}
        </Panel>

        <CreateUser onCreated={reload} />
      </div>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
}: {
  user: StudioUser;
  isSelf: boolean;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateUserFn({
        data: { id: user.id, name, email, role, password: password || undefined },
      });
      setPassword("");
      setOpen(false);
      await onChanged();
      toast.success(`${name} updated`);
    } catch (err) {
      toast.error("Could not save", { description: errText(err, "Try again.") });
    } finally {
      setBusy(false);
    }
  }

  async function setActive(active: boolean) {
    try {
      await updateUserFn({ data: { id: user.id, active } });
      await onChanged();
      toast.success(active ? "Account enabled" : "Account disabled");
    } catch (err) {
      toast.error("Could not change status", { description: errText(err, "Try again.") });
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await deleteUserFn({ data: { id: user.id } });
      await onChanged();
      toast.success("Account deleted");
    } catch (err) {
      toast.error("Could not delete", { description: errText(err, "Try again.") });
    }
  }

  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs text-foreground">{user.name}</span>
            {isSelf && (
              <span className="readout text-[0.55rem] uppercase tracking-widest text-primary">
                you
              </span>
            )}
            {!user.active && (
              <span className="readout text-[0.55rem] uppercase tracking-widest text-destructive">
                disabled
              </span>
            )}
          </div>
          <div className="readout truncate text-[0.6rem] text-muted-foreground">
            {user.email} · {user.role} ·{" "}
            {user.lastSignInAt
              ? `last in ${new Date(user.lastSignInAt).toLocaleDateString()}`
              : "never signed in"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen((v) => !v)}>
            <UserCog className="size-3.5" />
          </Button>
          {!isSelf && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[0.6rem] uppercase tracking-widest"
                onClick={() => void setActive(!user.active)}
              >
                {user.active ? "Disable" : "Enable"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => void remove()}>
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-2 grid gap-2 border border-border bg-rail p-2 sm:grid-cols-2">
          <Input className="h-8 text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <Input className="h-8 text-xs" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <RoleSelect value={role} onChange={setRole} />
          <Input
            className="h-8 text-xs"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New passphrase (optional)"
          />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-8" disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r} className="text-xs">
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateUser({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("assistant");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createUserFn({ data: { name, email, role, password } });
      setName("");
      setEmail("");
      setPassword("");
      setRole("assistant");
      await onCreated();
      toast.success("Account created");
    } catch (err) {
      toast.error("Could not create account", { description: errText(err, "Try again.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="New account" code="CREATE">
      <form onSubmit={submit} className="space-y-2">
        <Input className="h-8 text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <Input
          className="h-8 text-xs"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@studio.local"
        />
        <RoleSelect value={role} onChange={setRole} />
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">{ROLE_NOTES[role]}</p>
        <Input
          className="h-8 text-xs"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passphrase (min 8 characters)"
        />
        <Button type="submit" size="sm" className="h-8 w-full" disabled={busy}>
          <Plus className="size-3.5" /> {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
    </Panel>
  );
}
