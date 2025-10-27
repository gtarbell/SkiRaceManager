import { Team, User, Racer, Gender, RacerClass, Race, RosterEntry } from "../models";

// Users unchanged
let users: User[] = [
  { id: "u1", name: "Geddy Admin", role: "ADMIN", teamIds: [] },
  { id: "u2", name: "Coach Josh", role: "COACH", teamIds: ["t4"] },
  { id: "u3", name: "Brad", role: "ADMIN", teamIds: [] },
  { id: "u4", name: "Eastside Coach", role: "COACH", teamIds: ["t2", "t3", "t1"] },
];

// NOTE: Removed Non-Binary racers; reassigned any to Male/Female
let teams: Team[] = [
  {
    id: "t4",
    name: "Sandy High School",
    coachUserIds: ["u2"],
    racers: [
      { id: "r100", name: "Ansel Ofstie", gender: "Male", class: "Varsity", teamId: "t4" },
      { id: "r101", name: "Mario Heckel", gender: "Male", class: "Varsity", teamId: "t4" },
      { id: "r102", name: "Dylan Brown", gender: "Male", class: "Varsity", teamId: "t4" },
      { id: "r103", name: "Grant Messinger", gender: "Male", class: "Varsity", teamId: "t4" },
      { id: "r104", name: "Ethan Van Hee", gender: "Male", class: "Varsity", teamId: "t4" },
      { id: "r105", name: "Beck Schreiner", gender: "Male", class: "Varsity Alternate", teamId: "t4" },
      { id: "r106", name: "Kai Muntz", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r107", name: "Max Kocubinski", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r108", name: "Hayden Ferschweiler", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r109", name: "Finley Lafayette", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r110", name: "Ben Hohl", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r111", name: "Jackson Mulick", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r112", name: "Jameson Stone", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r113", name: "Noah Lowery", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r114", name: "Henry Bird", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r115", name: "Ben Leiblein", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      { id: "r116", name: "Coen Fleming-Harris", gender: "Male", class: "Jr Varsity", teamId: "t4" },

      { id: "r200", name: "Anika Wipper", gender: "Female", class: "Varsity", teamId: "t5" },
    { id: "r201", name: "Wallace Hamalanien", gender: "Female", class: "Varsity", teamId: "t5" },
    { id: "r202", name: "Anna Nguyen", gender: "Female", class: "Varsity", teamId: "t5" },
    { id: "r203", name: "Brynn Fleming-Harris", gender: "Female", class: "Varsity", teamId: "t5" },
    { id: "r204", name: "Hannah Ban", gender: "Female", class: "Varsity", teamId: "t5" },
    { id: "r205", name: "Keegan Deters", gender: "Female", class: "Varsity Alternate", teamId: "t5" },
    { id: "r206", name: "Chella Houston", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r207", name: "Brighton Wilson", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r208", name: "Addison Kolibaba", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r209", name: "Leah Shaw", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r210", name: "Montana Tarbell", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r211", name: "Ella Nguyen", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r212", name: "Athea Wehrung", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r213", name: "Rory Mason", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r214", name: "Payton Haney", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r215", name: "Josephine Bird", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    { id: "r216", name: "Wren Schreiner", gender: "Female", class: "Provisional", teamId: "t5" },
    ],
  },
  {
    id: "t2",
    name: "Cleveland HS",
    coachUserIds: ["u4"],
    racers: [
      { id: "r3", name: "Riley Kim",  gender: "Female", class: "Provisional", teamId: "t2" },
      { id: "r4", name: "Morgan Fox", gender: "Female", class: "Varsity",     teamId: "t2" },
      { id: "r5", name: "Drew Park",  gender: "Male",   class: "Varsity",     teamId: "t2" },
    ],
  },
  { id: "t3", name: "Grant HS", coachUserIds: ["u4"], racers: [] },
  {
    id: "t1",
    name: "Franklin HS",
    coachUserIds: ["u4"],
    racers: [
      { id: "r3", name: "Isa Halle",  gender: "Female", class: "Varsity", teamId: "t1" },
      { id: "r4", name: "Cleo	Craig", gender: "Female", class: "Varsity",     teamId: "t1" },
      
    ],
  },
];

let races: Race[] = [
  { id: "race1", name: "Kelsey Race", location: "Meadows (Stadium)",  date: "2026-01-02", type: "Giant Slalom" },
  { id: "race2", name: "SL 1",     location: "Anthony Lakes", date: "2026-01-10", type: "Slalom" },
  { id: "race3", name: "GS 1",     location: "Ski Bowl (MT Hood Lane)", date: "2026-01-19", type: "Giant Slalom" },
   { id: "race4", name: "SL 2",     location: "Ski Bowl (Challenger)", date: "2026-01-30", type: "Slalom" },
   { id: "race5", name: "GS 2",     location: "Meadows (Middle Fork)", date: "2026-02-08", type: "Giant Slalom" },
   { id: "race6", name: "GS 3",     location: "Meadows (Middle Fork)", date: "2026-02-08", type: "Giant Slalom" },
      { id: "race7", name: "SL 3",     location: "Cooper Spur", date: "2026-02-20", type: "Slalom" },
];

const key = (raceId: string, teamId: string) => `${raceId}:${teamId}`;
let rosters: Record<string, RosterEntry[]> = {};

function byGender(entries: RosterEntry[], gender: Gender) {
  return entries.filter(e => e.gender === gender);
}
function countByClass(entries: RosterEntry[], gender: Gender, rc: RacerClass) {
  return byGender(entries, gender).filter(e => e.class === rc).length;
}
function nextStartOrder(entries: RosterEntry[], gender: Gender, rc: RacerClass) {
  const list = byGender(entries, gender).filter(e => e.class === rc);
  return list.length === 0 ? 1 : Math.max(...list.map(e => e.startOrder)) + 1;
}
function ensureAuth(user: User, teamId: string) {
  if (user.role === "ADMIN") return;
  if (!user.teamIds.includes(teamId)) throw new Error("Not authorized for this team");
}

export const mockApi = {
  async loginByName(name: string): Promise<User> {
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) throw new Error("User not found. Try 'Alice Admin', 'Carl Coach', or 'Casey Coach'.");
    return structuredClone(user);
  },

  async getTeamsForUser(user: User): Promise<Team[]> {
    if (user.role === "ADMIN") return structuredClone(teams);
    const allowed = new Set(user.teamIds);
    return structuredClone(teams.filter(t => allowed.has(t.id)));
  },
  async getTeamById(teamId: string): Promise<Team | undefined> {
    const t = teams.find(t => t.id === teamId);
    return t ? structuredClone(t) : undefined;
  },
  async addRacer(teamId: string, input: Omit<Racer, "id" | "teamId">): Promise<Racer> {
    const team = teams.find(t => t.id === teamId);
    if (!team) throw new Error("Team not found");
    const r: Racer = { id: "r" + Math.random().toString(36).slice(2, 9), teamId, ...input };
    team.racers.push(r);
    return structuredClone(r);
  },
  async updateRacer(teamId: string, racerId: string, patch: Partial<Omit<Racer, "id" | "teamId">>): Promise<Racer> {
    const team = teams.find(t => t.id === teamId);
    if (!team) throw new Error("Team not found");
    const idx = team.racers.findIndex(r => r.id === racerId);
    if (idx === -1) throw new Error("Racer not found");
    team.racers[idx] = { ...team.racers[idx], ...patch };
    return structuredClone(team.racers[idx]);
  },
  async removeRacer(teamId: string, racerId: string): Promise<void> {
    const team = teams.find(t => t.id === teamId);
    if (!team) throw new Error("Team not found");
    team.racers = team.racers.filter(r => r.id !== racerId);
    for (const k of Object.keys(rosters)) {
      rosters[k] = rosters[k].filter(e => e.racerId !== racerId || e.teamId !== teamId);
    }
  },

  // Only Male/Female now
  genders(): Gender[] {
    return ["Male", "Female"];
  },
  classes(): RacerClass[] {
    return ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];
  },

  async listRaces(): Promise<Race[]> {
    return structuredClone(races).sort((a, b) => a.date.localeCompare(b.date));
  },
  async getRace(raceId: string): Promise<Race | undefined> {
    const r = races.find(r => r.id === raceId);
    return r ? structuredClone(r) : undefined;
  },

  async getRoster(user: User, raceId: string, teamId: string): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    return structuredClone(rosters[key(raceId, teamId)] ?? []);
  },

  async copyRosterFromRace(
    user: User,
    fromRaceId: string,
    toRaceId: string,
    teamId: string
  ): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    if (fromRaceId === toRaceId) throw new Error("Choose a different race to copy from.");

    const source = structuredClone(rosters[key(fromRaceId, teamId)] ?? []);
    // If nothing to copy, just clear target roster to empty copy
    const targetKey = key(toRaceId, teamId);
    const t = teams.find(t => t.id === teamId);
    if (!t) throw new Error("Team not found");

    // Build a fresh list enforcing caps and Provisional lock
    const result: RosterEntry[] = [];
    const pushIfAllowed = (entry: RosterEntry) => {
      const racer = t.racers.find(r => r.id === entry.racerId);
      if (!racer) return; // skip if racer no longer on team
      // lock Provisional to Provisional
      const desiredClass: RacerClass =
        racer.class === "Provisional" ? "Provisional" : entry.class;

      if (desiredClass === "Varsity" && countByClass(result, entry.gender, "Varsity") >= 5) return;
      if (desiredClass === "Varsity Alternate" && countByClass(result, entry.gender, "Varsity Alternate") >= 1) return;

      result.push({
        raceId: toRaceId,
        teamId,
        racerId: racer.id,
        gender: racer.gender, // trust current baseline gender
        class: desiredClass,
        startOrder: nextStartOrder(result, racer.gender, desiredClass),
      });
    };

    // Copy order with sensible priority: Varsity, V-Alt, JV, Provisional (preserve original order inside each)
    const classPriority: RacerClass[] = ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];
    const ordered = source
      .slice()
      .sort((a, b) => {
        if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
        const pa = classPriority.indexOf(a.class);
        const pb = classPriority.indexOf(b.class);
        return pa === pb ? a.startOrder - b.startOrder : pa - pb;
      });

    for (const e of ordered) pushIfAllowed(e);

    rosters[targetKey] = result;
    return structuredClone(result);
  },

  async eligibleRacers(user: User, teamId: string): Promise<Racer[]> {
    ensureAuth(user, teamId);
    const t = teams.find(t => t.id === teamId);
    if (!t) throw new Error("Team not found");
    return structuredClone(t.racers);
  },

  // IMPORTANT: Provisional baseline cannot change on any race roster.
  async addToRoster(user: User, raceId: string, teamId: string, racerId: string, desiredClass?: RacerClass): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    const t = teams.find(t => t.id === teamId);
    if (!t) throw new Error("Team not found");
    const racer = t.racers.find(r => r.id === racerId);
    if (!racer) throw new Error("Racer not found");

    const k = key(raceId, teamId);
    const list = rosters[k] ?? (rosters[k] = []);
    if (list.some(e => e.racerId === racerId)) return structuredClone(list);

    // Lock to Provisional if baseline is Provisional
    const rc: RacerClass =
      racer.class === "Provisional" ? "Provisional" : (desiredClass ?? racer.class ?? "Jr Varsity");

    // enforce caps
    if (rc === "Varsity" && countByClass(list, racer.gender, "Varsity") >= 5)
      throw new Error(`Varsity is capped at 5 for ${racer.gender}.`);
    if (rc === "Varsity Alternate" && countByClass(list, racer.gender, "Varsity Alternate") >= 1)
      throw new Error(`Varsity Alternate is capped at 1 for ${racer.gender}.`);

    const entry: RosterEntry = {
      raceId, teamId, racerId: racer.id, gender: racer.gender, class: rc,
      startOrder: nextStartOrder(list, racer.gender, rc),
    };
    list.push(entry);
    return structuredClone(list);
  },

  async removeFromRoster(user: User, raceId: string, teamId: string, racerId: string): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    const k = key(raceId, teamId);
    rosters[k] = (rosters[k] ?? []).filter(e => e.racerId !== racerId);
    return structuredClone(rosters[k]);
  },

  async updateEntryClass(user: User, raceId: string, teamId: string, racerId: string, newClass: RacerClass): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    const k = key(raceId, teamId);
    const list = rosters[k] ?? [];
    const idx = list.findIndex(e => e.racerId === racerId);
    if (idx === -1) throw new Error("Entry not found");

    // If baseline is Provisional, prevent change
    const team = teams.find(t => t.id === teamId);
    const racer = team?.racers.find(r => r.id === racerId);
    if (racer?.class === "Provisional" && newClass !== "Provisional") {
      throw new Error("Provisional racers must remain Provisional for all races.");
    }

    const entry = list[idx];

    // enforce caps (exclude this entry when counting)
    const others = list.filter(e => e.racerId !== racerId);
    if (newClass === "Varsity" && countByClass(others, entry.gender, "Varsity") >= 5)
      throw new Error(`Varsity is capped at 5 for ${entry.gender}.`);
    if (newClass === "Varsity Alternate" && countByClass(others, entry.gender, "Varsity Alternate") >= 1)
      throw new Error(`Varsity Alternate is capped at 1 for ${entry.gender}.`);

    entry.class = newClass;
    entry.startOrder = nextStartOrder(others, entry.gender, newClass);
    this.normalizeStartOrders(raceId, teamId, entry.gender);
    return structuredClone(list);
  },

  async moveEntry(user: User, raceId: string, teamId: string, racerId: string, direction: "up" | "down"): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    const k = key(raceId, teamId);
    const list = rosters[k] ?? [];
    const i = list.findIndex(e => e.racerId === racerId);
    if (i === -1) throw new Error("Entry not found");
    const e = list[i];

    const bucket = list
      .filter(x => x.gender === e.gender && x.class === e.class)
      .sort((a, b) => a.startOrder - b.startOrder);

    const pos = bucket.findIndex(b => b.racerId === racerId);
    if (direction === "up" && pos > 0) {
      const above = bucket[pos - 1];
      const tmp = e.startOrder; e.startOrder = above.startOrder; above.startOrder = tmp;
    }
    if (direction === "down" && pos < bucket.length - 1) {
      const below = bucket[pos + 1];
      const tmp = e.startOrder; e.startOrder = below.startOrder; below.startOrder = tmp;
    }
    this.normalizeStartOrders(raceId, teamId, e.gender, e.class);
    return structuredClone(list);
  },

  normalizeStartOrders(raceId: string, teamId: string, gender: Gender, rc?: RacerClass) {
    const k = key(raceId, teamId);
    const list = rosters[k] ?? [];
    const buckets = rc ? [rc] : (["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"] as RacerClass[]);
    for (const c of buckets) {
      const bucket = list
        .filter(e => e.gender === gender && e.class === c)
        .sort((a, b) => a.startOrder - b.startOrder);
      bucket.forEach((e, idx) => e.startOrder = idx + 1);
    }
  },
};
