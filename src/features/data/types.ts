import { z } from "zod";

/**
 * Entity schemas — the single source of truth for the mock data layer.
 * When a real self-hosted API lands, these become the API contract.
 */

export const roomSchema = z.enum(["Studio A", "Studio B", "Live Room", "Mix Suite", "Vocal Booth"]);
export type Room = z.infer<typeof roomSchema>;

export const sessionStatusSchema = z.enum(["scheduled", "tracking", "mixing", "delivered"]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const mixRevisionSchema = z.object({
  label: z.string(),
  date: z.string(),
  note: z.string(),
});

export const sessionSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Title is required").max(120),
  artist: z.string().trim().min(1, "Artist is required").max(80),
  engineer: z.string().trim().min(1, "Engineer is required").max(80),
  assistant: z.string().trim().max(80).optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().default("10:00"),
  endTime: z.string().default("18:00"),
  room: roomSchema,
  project: z.string().trim().max(120).optional().or(z.literal("")),
  status: sessionStatusSchema,
  songs: z.array(z.string()).default([]),
  microphones: z.array(z.string()).default([]),
  outboard: z.array(z.string()).default([]),
  patching: z.string().max(2000).default(""),
  cueMixes: z.string().max(2000).default(""),
  notes: z.string().max(4000).default(""),
  problems: z.string().max(2000).default(""),
  mixRevisions: z.array(mixRevisionSchema).default([]),
  deliverables: z.array(z.string()).default([]),
  invoiceId: z.string().optional(),
});
export type Session = z.infer<typeof sessionSchema>;

export const equipmentCategorySchema = z.enum([
  "Microphone",
  "Preamp",
  "Compressor",
  "EQ",
  "Converter",
  "Monitor",
  "Instrument",
  "Amplifier",
  "Console",
  "Outboard",
]);
export type EquipmentCategory = z.infer<typeof equipmentCategorySchema>;

export const equipmentStatusSchema = z.enum(["operational", "needs-service", "in-repair", "retired"]);
export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>;

export const maintenanceEntrySchema = z.object({
  date: z.string(),
  type: z.string(),
  performedBy: z.string(),
  note: z.string(),
});
export type MaintenanceEntry = z.infer<typeof maintenanceEntrySchema>;

export const equipmentSchema = z.object({
  id: z.string(),
  manufacturer: z.string().trim().min(1, "Manufacturer is required").max(80),
  model: z.string().trim().min(1, "Model is required").max(80),
  category: equipmentCategorySchema,
  serial: z.string().trim().max(60).default(""),
  purchaseDate: z.string().default(""),
  warrantyUntil: z.string().default(""),
  purchasePrice: z.number().nonnegative().default(0),
  location: roomSchema,
  rack: z.string().trim().max(40).default(""),
  status: equipmentStatusSchema,
  notes: z.string().max(2000).default(""),
  knownIssues: z.string().max(2000).default(""),
  favoriteUses: z.array(z.string()).default([]),
  maintenanceHistory: z.array(maintenanceEntrySchema).default([]),
  nextServiceDue: z.string().optional(),
});
export type Equipment = z.infer<typeof equipmentSchema>;

export type Task = {
  id: string;
  title: string;
  priority: "low" | "normal" | "high";
  due: string;
  assignee: string;
  done: boolean;
};

export type Note = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  context: string;
};

export type Invoice = {
  id: string;
  client: string;
  amount: number;
  issued: string;
  due: string;
  paid: boolean;
};

export type Conversation = {
  id: string;
  agent: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
};

export type MaintenanceReminder = {
  id: string;
  equipmentId: string;
  equipment: string;
  task: string;
  due: string;
};
