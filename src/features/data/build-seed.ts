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
import {
  seedConversations,
  seedEquipment,
  seedInvoices,
  seedNotes,
  seedReminders,
  seedSessions,
  seedTasks,
} from "./seed";
import {
  DEFAULT_SETTINGS,
  seedArtists,
  seedAudioArchives,
  seedVideoArchives,
  seedCampaigns,
  seedClients,
  seedExpenses,
  seedInventory,
  seedKnowledge,
  seedMaintenanceTickets,
  seedPatchPoints,
  seedProjects,
  seedThreads,
  seedTraining,
} from "./seed-entities";
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

export function buildSeed(): StudioData {
  const equipment = seedEquipment();
  return {
    sessions: seedSessions(),
    equipment,
    tasks: seedTasks(),
    notes: seedNotes(),
    invoices: seedInvoices(),
    conversations: seedConversations(),
    reminders: seedReminders(equipment),
    artists: seedArtists(),
    projects: seedProjects(),
    clients: seedClients(),
    tickets: seedMaintenanceTickets(equipment),
    inventory: seedInventory(),
    patchPoints: seedPatchPoints(),
    expenses: seedExpenses(),
    campaigns: seedCampaigns(),
    knowledge: seedKnowledge(),
    training: seedTraining(),
    threads: seedThreads(),
    audioArchives: seedAudioArchives(),
    videoArchives: seedVideoArchives(),
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
