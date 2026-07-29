import type {
  Conversation,
  Equipment,
  Invoice,
  MaintenanceReminder,
  Note,
  Session,
  Task,
} from "./types";
import type {
  Artist,
  AssistantThread,
  AudioArchive,
  VideoArchive,
  Campaign,
  Client,
  Expense,
  InventoryItem,
  KnowledgeDoc,
  MaintenanceTicket,
  PatchPoint,
  Project,
  StudioSettings,
  TrainingModule,
} from "./entities";
import { DEFAULT_SETTINGS } from "./seed-entities";
import type { Role } from "@/features/auth/roles";

/** The whole studio document. Lives server-side in `/data/studio.json`. */
export type StudioData = {
  sessions: Session[];
  equipment: Equipment[];
  tasks: Task[];
  notes: Note[];
  invoices: Invoice[];
  conversations: Conversation[];
  reminders: MaintenanceReminder[];
  artists: Artist[];
  projects: Project[];
  clients: Client[];
  tickets: MaintenanceTicket[];
  inventory: InventoryItem[];
  patchPoints: PatchPoint[];
  expenses: Expense[];
  campaigns: Campaign[];
  knowledge: KnowledgeDoc[];
  training: TrainingModule[];
  threads: AssistantThread[];
  audioArchives: AudioArchive[];
  videoArchives: VideoArchive[];
  settings: StudioSettings;
};

/** Every keyed list in the database — the generic collection layer works over these. */
export type CollectionName = {
  [K in keyof StudioData]: StudioData[K] extends Array<{ id: string }> ? K : never;
}[keyof StudioData];

/** A blank studio: every collection starts empty, only defaults for settings. */
export function buildSeed(): StudioData {
  return {
    sessions: [],
    equipment: [],
    tasks: [],
    notes: [],
    invoices: [],
    conversations: [],
    reminders: [],
    artists: [],
    projects: [],
    clients: [],
    tickets: [],
    inventory: [],
    patchPoints: [],
    expenses: [],
    campaigns: [],
    knowledge: [],
    training: [],
    threads: [],
    audioArchives: [],
    videoArchives: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export const COLLECTION_NAMES = Object.keys(buildSeed()).filter(
  (k) => k !== "settings",
) as CollectionName[];

/**
 * Minimum role required to write to each collection. Mirrors the `writeRole`
 * each module passes to CollectionModule, and is re-checked on the server.
 */
export const COLLECTION_WRITE_ROLE: Record<CollectionName, Role> = {
  sessions: "assistant",
  equipment: "assistant",
  tasks: "intern",
  notes: "intern",
  invoices: "owner",
  conversations: "assistant",
  reminders: "assistant",
  artists: "assistant",
  projects: "assistant",
  clients: "engineer",
  tickets: "assistant",
  inventory: "assistant",
  patchPoints: "assistant",
  expenses: "owner",
  campaigns: "engineer",
  knowledge: "assistant",
  training: "engineer",
  threads: "intern",
  audioArchives: "assistant",
  videoArchives: "assistant",
};

export const SETTINGS_WRITE_ROLE: Role = "engineer";
