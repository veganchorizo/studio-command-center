import type { Equipment } from "./types";
import type {
  Artist,
  AssistantThread,
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
import { ARTISTS, ENGINEERS } from "./seed";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rng = makeRng(913377);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const iso = (days: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

const LABELS = ["Foundry Records", "Independent", "Tidewater Music", "Copper Hill", "Salt & Static", "Northfield"];
const GENRES = ["Indie Rock", "Folk", "Soul", "Post-Punk", "Ambient", "Jazz", "Electronic", "Americana"];
const MICS = ["Neumann U 47", "Telefunken ELA M 251", "Shure SM7B", "AKG C414 XLS", "Coles 4038", "Royer R-121"];
const CHAINS = [
  "251 → Neve 1073 → LA-2A",
  "U 47 → Chandler TG2 → 1176",
  "SM7B → API 512c → Distressor",
  "C414 → Millennia HV-3D → CL 1B",
];

export function seedArtists(): Artist[] {
  return ARTISTS.map((name, i) => ({
    id: `ART-${1000 + i}`,
    name,
    contact: pick(["Manager — R. Sandoval", "Direct", "Manager — T. Whitlow", "Label A&R"]),
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@mail.local`,
    phone: `+44 7${int(100, 999)} ${int(100000, 999999)}`,
    label: pick(LABELS),
    genre: pick(GENRES),
    preferredMic: pick(MICS),
    preferredChain: pick(CHAINS),
    notes: pick([
      "No de-esser on the way in. Prefers a dry cue.",
      "Works late — book evening slots where possible.",
      "Brings own guitar amp, needs a spare 57.",
      "Sensitive to headphone bleed, use closed backs.",
      "",
    ]),
  }));
}

const PROJECT_TITLES = [
  "Lantern Weather LP",
  "Cold Harbour — Single",
  "Ashfield Sessions EP",
  "Tidewater — Score",
  "Live at the Foundry",
  "Copper Lines 2011 Reissue",
  "Sync Library Vol. 4",
  "House of Salt LP",
  "Peregrine EP",
  "Undertow — Single",
  "Marrow LP",
  "Gravel Road EP",
];

export function seedProjects(): Project[] {
  return PROJECT_TITLES.map((title, i) => ({
    id: `PRJ-${2000 + i}`,
    title,
    artist: pick(ARTISTS),
    type: pick(["Album", "EP", "Single", "Score", "Live", "Reissue"] as const),
    status: pick(["planning", "tracking", "mixing", "mastering", "delivered"] as const),
    startDate: iso(-int(20, 400)),
    targetDate: iso(int(-60, 120)),
    budget: int(2, 40) * 1000,
    deliverables: ["24/96 stems", "Mastered WAV", "Instrumental"].slice(0, int(1, 3)),
    notes: pick(["Label deadline is hard.", "Budget approved for two extra mix days.", ""]),
  }));
}

export function seedClients(): Client[] {
  return [
    "Foundry Records",
    "Tidewater Music",
    "Copper Hill Group",
    "Salt & Static",
    "Northfield Tape Club",
    "Brightwork Media",
    "Halcyon Sync",
    "Meridian Ads",
    "Lowlight Film",
    "Ravensbourne Trust",
  ].map((company, i) => ({
    id: `CLI-${3000 + i}`,
    name: pick(["R. Sandoval", "T. Whitlow", "A. Nkemelu", "J. Byrne", "H. Ostrowski", "M. Calder"]),
    company,
    email: `bookings@${company.toLowerCase().replace(/[^a-z]+/g, "")}.local`,
    phone: `+44 20 ${int(1000, 9999)} ${int(1000, 9999)}`,
    tier: pick(["prospect", "active", "retained", "dormant"] as const),
    lifetimeValue: int(2, 90) * 1000,
    lastContact: iso(-int(1, 120)),
    notes: pick(["Pays on 30-day terms.", "Prefers a single invoice per project.", "Always books Studio A.", ""]),
  }));
}

const FAULTS = [
  "Intermittent crackle on the right channel",
  "Meter lamp out",
  "Tube noise above 40dB gain",
  "Fader 22 scratchy",
  "Ground hum when patched to the plate",
  "Capsule needs re-tensioning",
  "Power supply fan rattling",
  "Bypass relay sticking",
];

export function seedMaintenanceTickets(equipment: Equipment[]): MaintenanceTicket[] {
  const flagged = equipment.filter((e) => e.status !== "operational").slice(0, 10);
  const pool = flagged.length ? flagged : equipment.slice(0, 10);
  return pool.map((e, i) => {
    const status = pick(["open", "in-progress", "waiting-parts", "done"] as const);
    return {
      id: `MTK-${4000 + i}`,
      equipmentId: e.id,
      equipment: `${e.manufacturer} ${e.model}`,
      fault: pick(FAULTS),
      status,
      priority: pick(["low", "normal", "high"] as const),
      opened: iso(-int(1, 60)),
      due: iso(int(-10, 45)),
      assignee: pick(ENGINEERS),
      resolution: status === "done" ? "Serviced on the bench, passed a full signal test." : "",
    };
  });
}

export function seedInventory(): InventoryItem[] {
  const items: Array<[string, InventoryItem["category"], number, number]> = [
    ["XLR 3m (Neutrik/Van Damme)", "Cables", 42, 20],
    ["XLR 10m", "Cables", 18, 12],
    ["TRS 1m patch", "Cables", 60, 40],
    ["Speakon 5m", "Cables", 8, 6],
    ["1/4in instrument 6m", "Cables", 14, 10],
    ["2in tape reel (RMGI SM900)", "Media", 3, 4],
    ["Archive HDD 8TB", "Media", 5, 3],
    ["LTO-8 cartridge", "Media", 11, 6],
    ["Pop shield fabric", "Consumables", 6, 3],
    ["Isopropyl 99% 1L", "Consumables", 2, 3],
    ["Contact cleaner (DeoxIT)", "Consumables", 4, 2],
    ["Gaffer tape (black)", "Consumables", 9, 6],
    ["12AX7 valve", "Spares", 6, 4],
    ["EF86 valve", "Spares", 1, 2],
    ["Neutrik XLR-F connector", "Spares", 30, 15],
    ["Console fader spare", "Spares", 3, 2],
    ["Mic clip (standard)", "Accessories", 22, 12],
    ["Shockmount (U 87)", "Accessories", 4, 2],
    ["Boom stand", "Hardware", 15, 10],
    ["Short stand", "Hardware", 12, 8],
  ];
  return items.map(([name, category, quantity, minimum], i) => ({
    id: `INV-${5000 + i}`,
    name,
    category,
    quantity,
    minimum,
    location: pick(["Store room", "Studio A rack", "Machine room", "Loft"]),
    supplier: pick(["Studiospares", "Thomann", "Canford", "Local"]),
    unitCost: int(2, 180),
    notes: "",
  }));
}

export function seedPatchPoints(): PatchPoint[] {
  const out: PatchPoint[] = [];
  const bays = ["Bay 1 — Console", "Bay 2 — Outboard", "Bay 3 — Machine Room"];
  const sources = ["Mic line", "Console direct out", "Converter out", "Tape return", "Insert send"];
  const dests = ["Neve 1073", "API 512c", "1176 Rev D", "LA-2A", "Converter in", "Console line in", "EMT 140 Plate"];
  bays.forEach((bay, b) => {
    for (let p = 1; p <= 12; p++) {
      (["top", "bottom"] as const).forEach((row) => {
        out.push({
          id: `PTC-${6000 + out.length}`,
          bay,
          row,
          position: p,
          label: `${bay.split(" ")[1]}${p}${row === "top" ? "T" : "B"}`,
          source: row === "top" ? sources[(b + p) % sources.length] : "",
          destination: row === "bottom" ? dests[(b + p) % dests.length] : "",
          normalled: p % 4 === 0 ? "none" : p % 3 === 0 ? "half" : "full",
          notes: "",
        });
      });
    }
  });
  return out;
}

export function seedExpenses(): Expense[] {
  const vendors: Array<[string, Expense["category"]]> = [
    ["Canford Audio", "Gear"],
    ["Foundry Estates", "Rent"],
    ["Octopus Energy", "Utilities"],
    ["Payroll — March", "Payroll"],
    ["Studiospares", "Supplies"],
    ["Avid", "Software"],
    ["Thomann", "Gear"],
    ["Insurance — Allianz", "Other"],
    ["Payroll — April", "Payroll"],
    ["FabFilter", "Software"],
    ["Cleaning contract", "Other"],
    ["Thames Water", "Utilities"],
  ];
  return vendors.map(([vendor, category], i) => ({
    id: `EXP-${7000 + i}`,
    vendor,
    category,
    amount: int(60, 4200),
    date: iso(-int(1, 180)),
    paid: rng() > 0.25,
    notes: "",
  }));
}

export function seedCampaigns(): Campaign[] {
  const names = [
    "Foundry Live — Spring Sessions",
    "Analog Summer promo",
    "Newsletter — Gear Deep Dive",
    "Mixing day-rate offer",
    "Studio tour film",
    "Local press — 10 year feature",
    "Partnership: Northfield Tape Club",
    "Website rebuild + booking form",
  ];
  return names.map((name, i) => ({
    id: `MKT-${8000 + i}`,
    name,
    channel: pick(["Instagram", "Newsletter", "YouTube", "Local Press", "Partnership", "Website"] as const),
    status: pick(["draft", "scheduled", "running", "complete"] as const),
    start: iso(-int(0, 90)),
    end: iso(int(5, 120)),
    budget: int(0, 30) * 100,
    linkedProject: pick(PROJECT_TITLES),
    notes: "",
  }));
}

export function seedKnowledge(): KnowledgeDoc[] {
  const docs: Array<[string, KnowledgeDoc["folder"], string[], string]> = [
    [
      "Studio A signal flow",
      "Signal Flow",
      ["studio-a", "console", "normals"],
      "Mic lines 1–24 arrive at Bay 1 top row and normal down into the console line inputs.\n\nInserts break at Bay 2. The room pair is normalled to 15/16 — do not re-patch without noting it here, printed mixes depend on it.\n\nConverter A feeds channels 1–16, Converter B feeds 17–32.",
    ],
    [
      "Tape machine alignment",
      "Procedures",
      ["tape", "alignment", "monthly"],
      "Align the 2in machine at the start of any tape date.\n\n1. Warm up 30 minutes.\n2. Play the alignment tone reel: 1kHz, 10kHz, 100Hz.\n3. Set repro level to +6 over 250nWb/m.\n4. Set bias for 3dB overbias at 10kHz.\n5. Log the pass in the maintenance ticket for the machine.",
    ],
    [
      "U 47 handling",
      "Gear Notes",
      ["mic", "valve", "care"],
      "The 47 lives in its case, in the store room, not on a stand overnight.\n\nPower up and let it stabilise for 10 minutes before a take. Never hot-plug the 7-pin. If it sounds thin or noisy above 40dB, open a maintenance ticket — that is usually the valve, not the capsule.",
    ],
    [
      "Cue mix house style",
      "House Style",
      ["cue", "tracking", "headphones"],
      "Cue 1 is always drums-heavy with no click. Cue 2 is vocal-forward. Cue 3 carries the click.\n\nDefault to closed backs for anything near an open mic. Print the cue layout into the session notes so the next engineer can rebuild it.",
    ],
    [
      "Hum and buzz triage",
      "Troubleshooting",
      ["hum", "ground", "debug"],
      "Work outward from the source.\n\n1. Mute everything, unmute one path at a time.\n2. Swap the cable before you suspect the box.\n3. Lift the ground at the patchbay, never at the mains plug.\n4. Check for a lighting dimmer on the same ring — the Live Room has one.\n5. If it follows the box, open a ticket.",
    ],
    [
      "Session archive procedure",
      "Procedures",
      ["archive", "delivery", "backup"],
      "At delivery: consolidate, bounce 24/96 stems, export a session PDF with the mic list and outboard recall, then copy to the archive HDD and the LTO cartridge.\n\nTwo copies or it is not archived. Log the cartridge number in the session record.",
    ],
    [
      "Mix Suite normals",
      "Signal Flow",
      ["mix-suite", "normals"],
      "The Mix Suite patchbay is fully normalled from converter out to the summing bus. Half-normals are on the outboard inserts only.\n\nAnything you re-patch, you put back before you leave.",
    ],
    [
      "Booking and deposit policy",
      "House Style",
      ["booking", "clients", "finance"],
      "50% deposit confirms a date. Cancellations inside 7 days keep the deposit.\n\nDay rate includes an assistant. Tape, media and consumables are billed at cost plus 10%.",
    ],
  ];
  return docs.map(([title, folder, tags, body], i) => ({
    id: `KB-${9000 + i}`,
    title,
    folder,
    tags,
    author: pick(ENGINEERS),
    updated: iso(-int(1, 90)),
    body,
  }));
}

export function seedTraining(): TrainingModule[] {
  const mods: Array<[string, TrainingModule["track"], TrainingModule["level"], string[]]> = [
    ["Studio A setup from cold", "Setup", "1", ["Power-up order", "Console reset", "Mic line check", "Cue system test"]],
    ["Mic locker handling", "Setup", "1", ["Case discipline", "Valve mics", "Ribbon care", "Logging usage"]],
    ["Drum tracking assist", "Tracking", "2", ["Stand placement", "Phase check", "Headphone bleed", "Take logging"]],
    ["Vocal day workflow", "Tracking", "2", ["Booth prep", "Comp sheet", "Cue balance", "Backup takes"]],
    ["Patchbay literacy", "Setup", "2", ["Normals", "Half-normals", "Reading the bay map", "Restoring defaults"]],
    ["Mix recall discipline", "Mixing", "3", ["Recall sheets", "Outboard photos", "Revision naming", "Client notes"]],
    ["Bench basics", "Maintenance", "3", ["Cable testing", "Connector soldering", "Ticket writing", "Escalation"]],
    ["Client-facing conduct", "Studio Etiquette", "1", ["Arrival", "Catering", "Silence protocol", "Wrap-up"]],
  ];
  const trainees = ["C. Ellis", "M. Adeyemi", "P. Nowak"];
  return mods.map(([title, track, level, lessons], i) => ({
    id: `TRN-${10000 + i}`,
    title,
    track,
    level,
    trainee: trainees[i % trainees.length],
    lessons,
    completed: rng() > 0.6,
    signedOffBy: rng() > 0.6 ? pick(ENGINEERS) : "",
    notes: "",
  }));
}

export function seedThreads(): AssistantThread[] {
  return [
    {
      id: "CNV-6000",
      title: "Why is the room pair phasey in Studio A?",
      model: "",
      updatedAt: iso(0),
      messages: [],
    },
    {
      id: "CNV-6001",
      title: "Which valves are due this quarter?",
      model: "",
      updatedAt: iso(-1),
      messages: [],
    },
  ];
}

export const DEFAULT_SETTINGS: StudioSettings = {
  studioName: "The Foundry",
  location: "London, UK",
  hourlyRate: 65,
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.1",
  retrievalDepth: 6,
};

/** The archive starts empty — entries are added by hand or imported from CSV. */
export function seedAudioArchives(): AudioArchive[] {
  return [];
}

export function seedVideoArchives(): VideoArchive[] {
  return [];
}
