/**
 * Entities for the modules added in milestone 2.
 * Plain structural types — the generic collection layer validates on the way in.
 */

export type Artist = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  label: string;
  genre: string;
  preferredMic: string;
  preferredChain: string;
  notes: string;
};

export type Project = {
  id: string;
  title: string;
  artist: string;
  type: "Album" | "EP" | "Single" | "Score" | "Live" | "Reissue";
  status: "planning" | "tracking" | "mixing" | "mastering" | "delivered";
  startDate: string;
  targetDate: string;
  budget: number;
  deliverables: string[];
  notes: string;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  tier: "prospect" | "active" | "retained" | "dormant";
  lifetimeValue: number;
  lastContact: string;
  notes: string;
};

export type MaintenanceTicket = {
  id: string;
  equipmentId: string;
  equipment: string;
  fault: string;
  status: "open" | "in-progress" | "waiting-parts" | "done";
  priority: "low" | "normal" | "high";
  opened: string;
  due: string;
  assignee: string;
  resolution: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: "Cables" | "Media" | "Consumables" | "Spares" | "Hardware" | "Accessories";
  quantity: number;
  minimum: number;
  location: string;
  supplier: string;
  unitCost: number;
  notes: string;
};

export type PatchPoint = {
  id: string;
  bay: string;
  row: "top" | "bottom";
  position: number;
  label: string;
  source: string;
  destination: string;
  normalled: "full" | "half" | "none";
  notes: string;
};

export type Expense = {
  id: string;
  vendor: string;
  category: "Gear" | "Rent" | "Utilities" | "Payroll" | "Supplies" | "Software" | "Other";
  amount: number;
  date: string;
  paid: boolean;
  notes: string;
};

export type Campaign = {
  id: string;
  name: string;
  channel: "Instagram" | "Newsletter" | "YouTube" | "Local Press" | "Partnership" | "Website";
  status: "draft" | "scheduled" | "running" | "complete";
  start: string;
  end: string;
  budget: number;
  linkedProject: string;
  notes: string;
};

export type KnowledgeDoc = {
  id: string;
  title: string;
  folder: "Signal Flow" | "Gear Notes" | "Procedures" | "House Style" | "Troubleshooting";
  tags: string[];
  author: string;
  updated: string;
  body: string;
};

export type TrainingModule = {
  id: string;
  title: string;
  track: "Setup" | "Tracking" | "Mixing" | "Maintenance" | "Studio Etiquette";
  level: "1" | "2" | "3";
  trainee: string;
  lessons: string[];
  completed: boolean;
  signedOffBy: string;
  notes: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: string[];
};

export type AssistantThread = {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type StudioSettings = {
  studioName: string;
  location: string;
  hourlyRate: number;
  ollamaUrl: string;
  ollamaModel: string;
  retrievalDepth: number;
};

export type AudioArchive = {
  id: string;
  title: string;
  artist: string;
  date: string;
  format: string;
  primaryDrive: string;
  archiveDrive: string;
  notes: string;
};

export type VideoArchive = {
  id: string;
  title: string;
  mediaType: string;
  showDate: string;
  primaryDrive: string;
  archiveDrive: string;
  notes: string;
};
