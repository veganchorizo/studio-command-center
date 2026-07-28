import type {
  Conversation,
  Equipment,
  EquipmentCategory,
  Invoice,
  MaintenanceReminder,
  Note,
  Room,
  Session,
  SessionStatus,
  Task,
} from "./types";

/** Deterministic PRNG so the mock studio looks the same on every boot. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rng = makeRng(20260728);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const pickMany = <T,>(arr: readonly T[], n: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
};

export const today = () => new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

export const ROOMS: Room[] = ["Studio A", "Studio B", "Live Room", "Mix Suite", "Vocal Booth"];

export const ARTISTS = [
  "Halden Reeve",
  "The Copper Lines",
  "Nia Ferreira",
  "Saltwater Choir",
  "Odetta Vane",
  "Brutalist Garden",
  "Kwame Osei",
  "Junipa",
  "The Long Divide",
  "Marisol Duran",
  "Fen & Bramble",
  "Otto Lindqvist",
  "Sable Hour",
  "Ruth Okonkwo",
  "Northfield Tape Club",
];

export const ENGINEERS = ["D. Marchetti", "S. Okafor", "L. Brennan", "R. Tanaka"];
export const ASSISTANTS = ["P. Nowak", "C. Ellis", "M. Adeyemi", ""];

const PROJECTS = [
  "Lantern Weather LP",
  "Single — Cold Harbour",
  "Ashfield Sessions EP",
  "Score — Tidewater",
  "Live at the Foundry",
  "Reissue — Copper Lines 2011",
  "Demo Package",
  "Sync Library Vol. 4",
];

const SONGS = [
  "Cold Harbour",
  "Ninth Street",
  "Fold the Map",
  "Anvil Chorus",
  "Slow Tide",
  "Peregrine",
  "House of Salt",
  "Undertow",
  "Ferrous",
  "Late Bloom",
  "Gravel Road",
  "Marrow",
];

const MICS = [
  "Neumann U 47",
  "Neumann U 87 Ai",
  "AKG C414 XLS",
  "Coles 4038",
  "Royer R-121",
  "Shure SM7B",
  "Shure SM57",
  "Sennheiser MD 421",
  "Telefunken ELA M 251",
  "Beyerdynamic M 160",
  "Earthworks QTC40",
  "AEA R84",
];

const OUTBOARD = [
  "Neve 1073 (x2)",
  "API 512c",
  "Urei 1176 Rev D",
  "Teletronix LA-2A",
  "Empirical Labs Distressor",
  "Pultec EQP-1A",
  "SSL G-Comp",
  "Lexicon 480L",
  "EMT 140 Plate",
  "Chandler TG2",
];

const DELIVERABLES = [
  "24/96 stems",
  "Rough mix MP3",
  "Instrumental",
  "TV mix",
  "Session archive",
  "Vocal comp",
  "Mastered WAV",
];

const PROBLEMS = [
  "Intermittent crackle on channel 14 — reseated card, resolved.",
  "Cue box 3 lost the click mid-take. Swapped for spare.",
  "Kick mic phantom dropout, traced to a bad XLR from the drum sub-snake.",
  "Console fader 22 dusty, needs a cleaning pass.",
  "",
  "",
  "",
];

const NOTE_BODIES = [
  "Artist prefers the 251 on lead vocal, no de-esser on the way in.",
  "Drum room mics 8ft up, facing the back wall. Sounded huge — repeat this.",
  "Client wants all rough mixes bounced with 2dB more vocal than the room mix.",
  "Bass DI + Ampeg blend at 60/40 worked best on the up-tempo tracks.",
  "Do not re-patch the Mix Suite normals — printed mixes depend on the current setup.",
  "Coffee: oat flat white for Nia, black filter for the band.",
];

export function seedSessions(): Session[] {
  const out: Session[] = [];
  // ~2 years of history plus a forward-looking book
  const offsets: number[] = [0, 0, 1, 2, 3, 5, 8, 12, 15, 21];
  for (let i = 0; i < 30; i++) offsets.push(-Math.floor(rng() * 730) - 1);

  offsets.forEach((off, idx) => {
    const d = shift(off);
    const status: SessionStatus =
      off > 0 ? "scheduled" : off === 0 ? "tracking" : off > -30 ? pick(["mixing", "delivered"]) : "delivered";
    const artist = pick(ARTISTS);
    const startHour = 9 + Math.floor(rng() * 5);
    out.push({
      id: `SES-${String(1000 + idx)}`,
      title: `${artist} — ${pick(["Tracking", "Overdubs", "Mix", "Vocal Day", "Band Live", "Comping"])}`,
      artist,
      engineer: pick(ENGINEERS),
      assistant: pick(ASSISTANTS),
      date: iso(d),
      startTime: `${String(startHour).padStart(2, "0")}:00`,
      endTime: `${String(Math.min(startHour + 6 + Math.floor(rng() * 4), 23)).padStart(2, "0")}:00`,
      room: pick(ROOMS),
      project: pick(PROJECTS),
      status,
      songs: pickMany(SONGS, 1 + Math.floor(rng() * 4)),
      microphones: pickMany(MICS, 2 + Math.floor(rng() * 5)),
      outboard: pickMany(OUTBOARD, 1 + Math.floor(rng() * 4)),
      patching: "Line 1-8 → Neve 1073 → Converter A. Room pair normalled to 15/16.",
      cueMixes: "Cue 1: drums-heavy, no click. Cue 2: vocal + acoustic. Cue 3: full band, click on.",
      notes: pick(NOTE_BODIES),
      problems: pick(PROBLEMS),
      mixRevisions:
        status === "mixing" || status === "delivered"
          ? [
              { label: "v1", date: iso(shift(off + 2)), note: "First pass, vocal a touch buried." },
              { label: "v2", date: iso(shift(off + 4)), note: "Vocal up 1.5dB, tightened low end." },
            ]
          : [],
      deliverables: status === "delivered" ? pickMany(DELIVERABLES, 2 + Math.floor(rng() * 3)) : [],
    });
  });

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const GEAR: Array<[string, string, EquipmentCategory]> = [
  ["Neumann", "U 47", "Microphone"],
  ["Neumann", "U 87 Ai", "Microphone"],
  ["Neumann", "KM 84", "Microphone"],
  ["AKG", "C414 XLS", "Microphone"],
  ["AKG", "D112", "Microphone"],
  ["Coles", "4038", "Microphone"],
  ["Royer", "R-121", "Microphone"],
  ["Shure", "SM7B", "Microphone"],
  ["Shure", "SM57", "Microphone"],
  ["Shure", "KSM32", "Microphone"],
  ["Sennheiser", "MD 421-II", "Microphone"],
  ["Telefunken", "ELA M 251", "Microphone"],
  ["Beyerdynamic", "M 160", "Microphone"],
  ["AEA", "R84", "Microphone"],
  ["Earthworks", "QTC40", "Microphone"],
  ["Neve", "1073 DPA", "Preamp"],
  ["Neve", "1081 R", "Preamp"],
  ["API", "3124+", "Preamp"],
  ["API", "512c", "Preamp"],
  ["Chandler", "TG2", "Preamp"],
  ["Great River", "ME-1NV", "Preamp"],
  ["Millennia", "HV-3D", "Preamp"],
  ["Urei", "1176 Rev D", "Compressor"],
  ["Teletronix", "LA-2A", "Compressor"],
  ["Empirical Labs", "Distressor EL8-X", "Compressor"],
  ["SSL", "G-Series Bus Comp", "Compressor"],
  ["dbx", "160VU", "Compressor"],
  ["Tube-Tech", "CL 1B", "Compressor"],
  ["Pultec", "EQP-1A", "EQ"],
  ["Manley", "Massive Passive", "EQ"],
  ["API", "550b", "EQ"],
  ["Maselec", "MEA-2", "EQ"],
  ["Lynx", "Aurora 16", "Converter"],
  ["Burl", "B2 Bomber ADC", "Converter"],
  ["Antelope", "Orion 32+", "Converter"],
  ["Apogee", "Symphony I/O", "Converter"],
  ["Barefoot", "MicroMain 27", "Monitor"],
  ["Yamaha", "NS-10M", "Monitor"],
  ["ATC", "SCM45A", "Monitor"],
  ["Auratone", "5C", "Monitor"],
  ["Fender", "Deluxe Reverb '65", "Amplifier"],
  ["Vox", "AC30", "Amplifier"],
  ["Ampeg", "B-15N", "Amplifier"],
  ["Marshall", "JCM800", "Amplifier"],
  ["Hammond", "B-3 + Leslie 122", "Instrument"],
  ["Rhodes", "Mark I Stage 73", "Instrument"],
  ["Wurlitzer", "200A", "Instrument"],
  ["Yamaha", "C7 Grand", "Instrument"],
  ["Ludwig", "Classic Maple Kit", "Instrument"],
  ["Gretsch", "Round Badge Kit", "Instrument"],
  ["SSL", "Duality Delta 48", "Console"],
  ["Neve", "5088 Sidecar", "Console"],
  ["Lexicon", "480L", "Outboard"],
  ["EMT", "140 Plate", "Outboard"],
  ["Eventide", "H3000", "Outboard"],
  ["Roland", "RE-201 Space Echo", "Outboard"],
  ["Bricasti", "M7", "Outboard"],
  ["Studer", "A827 2\" 24-track", "Outboard"],
  ["Ampex", "ATR-102", "Outboard"],
  ["Drawmer", "1968", "Compressor"],
];

const SERVICE_TYPES = ["Tube replacement", "Calibration", "Cleaning", "Firmware update", "Repair", "Recap"];
const TECHS = ["Halvorsen Audio Service", "In-house — D. Marchetti", "Ridge Electronics", "In-house — R. Tanaka"];

export function seedEquipment(): Equipment[] {
  return GEAR.map(([manufacturer, model, category], i) => {
    const r = rng();
    const status =
      r > 0.9 ? "in-repair" : r > 0.74 ? "needs-service" : r > 0.72 ? "retired" : "operational";
    const purchase = shift(-Math.floor(rng() * 6000) - 200);
    const history = Array.from({ length: Math.floor(rng() * 4) }, (_, k) => ({
      date: iso(shift(-Math.floor(rng() * 1200) - k * 30)),
      type: pick(SERVICE_TYPES),
      performedBy: pick(TECHS),
      note: pick([
        "Bias checked, within spec.",
        "Replaced both output tubes, re-biased.",
        "Cleaned pots and switch contacts.",
        "Recalibrated to +4dBu reference.",
        "Replaced worn XLR socket.",
      ]),
    })).sort((a, b) => (a.date < b.date ? 1 : -1));

    return {
      id: `EQ-${String(2000 + i)}`,
      manufacturer,
      model,
      category,
      serial: `${manufacturer.slice(0, 3).toUpperCase()}-${Math.floor(rng() * 900000 + 100000)}`,
      purchaseDate: iso(purchase),
      warrantyUntil: iso(shift(Math.floor(rng() * 900) - 400)),
      purchasePrice: Math.floor(rng() * 12000 + 300),
      location: pick(ROOMS),
      rack: pick(["Rack A", "Rack B", "Rack C", "Mic Locker", "Floor", "Sidecar"]),
      status,
      notes: pick([
        "Sounds best with the pad engaged on loud sources.",
        "Serial-matched pair with its neighbour — keep them together.",
        "Original transformer, do not modify.",
        "Sits on the sidecar for tracking days.",
        "",
      ]),
      knownIssues:
        status === "operational"
          ? ""
          : pick([
              "Channel 2 output is ~2dB lower than channel 1.",
              "Meter lamp is out.",
              "Intermittent crackle when the gain pot is swept.",
              "Fan is noisy — needs replacing before it goes in the live room.",
            ]),
      favoriteUses: pickMany(
        ["Lead vocal", "Kick in", "Room pair", "Bass DI", "Drum bus", "Acoustic guitar", "Mix bus", "Overheads"],
        1 + Math.floor(rng() * 3),
      ),
      maintenanceHistory: history,
      nextServiceDue:
        status === "operational" && rng() > 0.7 ? iso(shift(Math.floor(rng() * 90) - 20)) : undefined,
    } satisfies Equipment;
  });
}

export function seedTasks(): Task[] {
  const titles = [
    "Order replacement 12AX7s for the LA-2A",
    "Archive the Copper Lines multitracks to LTO",
    "Re-label Studio B patchbay row 4",
    "Chase Northfield Tape Club invoice",
    "Book tech for the Studer alignment",
    "Restock XLR cables — down to 4 spares",
    "Photograph the mic locker for insurance",
    "Write the intern signal-flow checklist",
    "Renew the Live Room PAT testing",
  ];
  return titles.map((title, i) => ({
    id: `TSK-${3000 + i}`,
    title,
    priority: pick(["low", "normal", "high"] as const),
    due: iso(shift(Math.floor(rng() * 24) - 6)),
    assignee: pick(ENGINEERS),
    done: rng() > 0.78,
  }));
}

export function seedNotes(): Note[] {
  return NOTE_BODIES.map((body, i) => ({
    id: `NOTE-${4000 + i}`,
    body,
    author: pick(ENGINEERS),
    createdAt: iso(shift(-Math.floor(rng() * 14))),
    context: pick([...ARTISTS.slice(0, 6), "Studio A", "Mix Suite"]),
  }));
}

export function seedInvoices(): Invoice[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `INV-${5000 + i}`,
    client: pick(ARTISTS),
    amount: Math.floor(rng() * 6000 + 400),
    issued: iso(shift(-Math.floor(rng() * 60) - 5)),
    due: iso(shift(Math.floor(rng() * 30) - 12)),
    paid: rng() > 0.55,
  }));
}

export function seedConversations(): Conversation[] {
  const items: Array<[string, string]> = [
    ["Chief Engineer", "Why is the room pair phasey in Studio A?"],
    ["Maintenance Manager", "Which tubes are due for replacement this quarter?"],
    ["Archivist", "Find every session Nia Ferreira tracked on the 251"],
    ["Studio Manager", "Draft a booking confirmation for Saltwater Choir"],
    ["Business Analyst", "Revenue by room for the last two quarters"],
  ];
  return items.map(([agent, title], i) => ({
    id: `CNV-${6000 + i}`,
    agent,
    title,
    updatedAt: iso(shift(-i)),
    pinned: i < 2,
  }));
}

export function seedReminders(equipment: Equipment[]): MaintenanceReminder[] {
  return equipment
    .filter((e) => e.nextServiceDue)
    .slice(0, 8)
    .map((e, i) => ({
      id: `MNT-${7000 + i}`,
      equipmentId: e.id,
      equipment: `${e.manufacturer} ${e.model}`,
      task: pick(SERVICE_TYPES),
      due: e.nextServiceDue!,
    }))
    .sort((a, b) => (a.due < b.due ? -1 : 1));
}
