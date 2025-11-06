import { Team, User, Racer, Gender, RacerClass, Race, RosterEntry, StartListEntry  } from "../models";
import { api } from "../services/api";

// Users unchanged
let users: User[] = [
  { id: "u1", name: "Geddy Admin", role: "ADMIN", teamIds: [] },
  { id: "u2", name: "Coach Josh", role: "COACH", teamIds: ["t4"] },
  { id: "u3", name: "Brad", role: "ADMIN", teamIds: [] },
  { id: "u4", name: "Eastside Coach", role: "COACH", teamIds: ["t2", "t3", "t1"] },
];

let teams: Team[] = [
  {
    teamId: "t4",
    name: "Sandy High School",
    coachUserIds: ["u2"],
    racers: [
      {racerId: "r100", name: "Ansel Ofstie", gender: "Male", class: "Varsity", teamId: "t4" },
      {racerId: "r101", name: "Mario Heckel", gender: "Male", class: "Varsity", teamId: "t4" },
      {racerId: "r102", name: "Dylan Brown", gender: "Male", class: "Varsity", teamId: "t4" },
      {racerId: "r103", name: "Grant Messinger", gender: "Male", class: "Varsity", teamId: "t4" },
      {racerId: "r104", name: "Ethan Van Hee", gender: "Male", class: "Varsity", teamId: "t4" },
      {racerId: "r105", name: "Beck Schreiner", gender: "Male", class: "Varsity Alternate", teamId: "t4" },
      {racerId: "r106", name: "Kai Muntz", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r107", name: "Max Kocubinski", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r108", name: "Hayden Ferschweiler", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r109", name: "Finley Lafayette", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r110", name: "Ben Hohl", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r111", name: "Jackson Mulick", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r112", name: "Jameson Stone", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r113", name: "Noah Lowery", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r114", name: "Henry Bird", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r115", name: "Ben Leiblein", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r116", name: "Coen Fleming-Harris", gender: "Male", class: "Jr Varsity", teamId: "t4" },
      {racerId: "r200", name: "Anika Wipper", gender: "Female", class: "Varsity", teamId: "t5" },
    {racerId: "r201", name: "Wallace Hamalanien", gender: "Female", class: "Varsity", teamId: "t5" },
    {racerId: "r202", name: "Anna Nguyen", gender: "Female", class: "Varsity", teamId: "t5" },
    {racerId: "r203", name: "Brynn Fleming-Harris", gender: "Female", class: "Varsity", teamId: "t5" },
    {racerId: "r204", name: "Hannah Ban", gender: "Female", class: "Varsity", teamId: "t5" },
    {racerId: "r205", name: "Keegan Deters", gender: "Female", class: "Varsity Alternate", teamId: "t5" },
    {racerId: "r206", name: "Chella Houston", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r207", name: "Brighton Wilson", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r208", name: "Addison Kolibaba", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r209", name: "Leah Shaw", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r210", name: "Montana Tarbell", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r211", name: "Ella Nguyen", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r212", name: "Athea Wehrung", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r213", name: "Rory Mason", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r214", name: "Payton Haney", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r215", name: "Josephine Bird", gender: "Female", class: "Jr Varsity", teamId: "t5" },
    {racerId: "r216", name: "Wren Schreiner", gender: "Female", class: "Provisional", teamId: "t5" },
    ],
  },
  {
    teamId: "t2",
    name: "Cleveland HS",
    coachUserIds: ["u4"],
    racers: [
      { racerId: "r3", name: "Riley Kim",  gender: "Female", class: "Provisional", teamId: "t2" },
      { racerId: "r4", name: "Morgan Fox", gender: "Female", class: "Varsity",     teamId: "t2" },
      { racerId: "r5", name: "Drew Park",  gender: "Male",   class: "Varsity",     teamId: "t2" },
    ],
  },
  { teamId: "t3", name: "Grant HS", coachUserIds: ["u4"], racers: [] },
  {
    teamId: "t1",
    name: "Franklin HS",
    coachUserIds: ["u4"],
    racers: [
      { racerId: "r3", name: "Isa Halle",  gender: "Female", class: "Varsity", teamId: "t1" },
      { racerId: "r4", name: "Cleo	Craig", gender: "Female", class: "Varsity",     teamId: "t1" },
      
    ],
  },
];

// let races: Race[] = [
//   { id: "race1", name: "Kelsey Race", location: "Meadows (Stadium)",  date: "2026-01-02", type: "Giant Slalom" },
//   { id: "race2", name: "SL 1",     location: "Anthony Lakes", date: "2026-01-10", type: "Slalom" },
//   { id: "race3", name: "GS 1",     location: "Ski Bowl (MT Hood Lane)", date: "2026-01-19", type: "Giant Slalom" },
//    { id: "race4", name: "SL 2",     location: "Ski Bowl (Challenger)", date: "2026-01-30", type: "Slalom" },
//    { id: "race5", name: "GS 2",     location: "Meadows (Middle Fork)", date: "2026-02-08", type: "Giant Slalom" },
//    { id: "race6", name: "GS 3",     location: "Meadows (Middle Fork)", date: "2026-02-08", type: "Giant Slalom" },
//       { id: "race7", name: "SL 3",     location: "Cooper Spur", date: "2026-02-20", type: "Slalom" },
// ];

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


const classOrder: RacerClass[] = ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cache start lists by race so it stays stable until regenerated
const startLists: Record<string, StartListEntry[]> = {};

export const mockApi = {
  async loginByName(name: string): Promise<User> {
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) throw new Error("User not found. Try 'Alice Admin', 'Carl Coach', or 'Casey Coach'.");
    return structuredClone(user);
  },

  // async getTeamsForUser(user: User): Promise<Team[]> {
  //   if (user.role === "ADMIN") return structuredClone(teams);
  //   const allowed = new Set(user.teamIds);
  //   return structuredClone(teams.filter(t => allowed.has(t.teamId)));
  // },
  // async getTeamById(teamId: string): Promise<Team | undefined> {
  //   const t = teams.find(t => t.teamId === teamId);
  //   return t ? structuredClone(t) : undefined;
  // },
  // async addRacer(teamId: string, input: Omit<Racer, "id" | "teamId">): Promise<Racer> {
  //   const team = teams.find(t => t.teamId === teamId);
  //   if (!team) throw new Error("Team not found");
  //   const r: Racer = { id: "r" + Math.random().toString(36).slice(2, 9), teamId, ...input };
  //   team.racers.push(r);
  //   return structuredClone(r);
  // },
  // async updateRacer(teamId: string, racerId: string, patch: Partial<Omit<Racer, "id" | "teamId">>): Promise<Racer> {
  //   const team = teams.find(t => t.teamId === teamId);
  //   if (!team) throw new Error("Team not found");
  //   const idx = team.racers.findIndex(r => r.id === racerId);
  //   if (idx === -1) throw new Error("Racer not found");
  //   team.racers[idx] = { ...team.racers[idx], ...patch };
  //   return structuredClone(team.racers[idx]);
  // },
  // async removeRacer(teamId: string, racerId: string): Promise<void> {
  //   const team = teams.find(t => t.teamId === teamId);
  //   if (!team) throw new Error("Team not found");
  //   team.racers = team.racers.filter(r => r.id !== racerId);
  //   for (const k of Object.keys(rosters)) {
  //     rosters[k] = rosters[k].filter(e => e.racerId !== racerId || e.teamId !== teamId);
  //   }
  // },

  // Only Male/Female now
  genders(): Gender[] {
    return ["Male", "Female"];
  },
  classes(): RacerClass[] {
    return ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];
  },

  // async listRaces(): Promise<Race[]> {
  //   return structuredClone(races).sort((a, b) => a.date.localeCompare(b.date));
  // },
  // async getRace(raceId: string): Promise<Race | undefined> {
  //   const r = races.find(r => r.id === raceId);
  //   return r ? structuredClone(r) : undefined;
  // },

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
    const t = teams.find(t => t.teamId === teamId);
    if (!t) throw new Error("Team not found");

    // Build a fresh list enforcing caps and Provisional lock
    const result: RosterEntry[] = [];
    const pushIfAllowed = (entry: RosterEntry) => {
      const racer = t.racers.find(r => r.racerId === entry.racerId);
      if (!racer) return; // skip if racer no longer on team
      // lock Provisional to Provisional
      const desiredClass: RacerClass =
        racer.class === "Provisional" ? "Provisional" : entry.class;

      if (desiredClass === "Varsity" && countByClass(result, entry.gender, "Varsity") >= 5) return;
      if (desiredClass === "Varsity Alternate" && countByClass(result, entry.gender, "Varsity Alternate") >= 1) return;

      result.push({
        raceId: toRaceId,
        teamId,
        racerId: racer.racerId,
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
    const t = teams.find(t => t.teamId === teamId);
    if (!t) throw new Error("Team not found");
    return structuredClone(t.racers);
  },

  // IMPORTANT: Provisional baseline cannot change on any race roster.
  async addToRoster(user: User, raceId: string, teamId: string, racerId: string, desiredClass?: RacerClass): Promise<RosterEntry[]> {
    ensureAuth(user, teamId);
    const t = teams.find(t => t.teamId === teamId);
    if (!t) throw new Error("Team not found");
    const racer = t.racers.find(r => r.racerId === racerId);
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
      raceId, teamId, racerId: racer.racerId, gender: racer.gender, class: rc,
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
    const team = teams.find(t => t.teamId === teamId);
    const racer = team?.racers.find(r => r.racerId === racerId);
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

    async generateStartList(user: User, raceId: string): Promise<StartListEntry[]> {
    if (user.role !== "ADMIN") throw new Error("Only admins can generate start lists.");

    const race = await api.getRace(raceId);
    if (!race) throw new Error("Race not found");

    // Collect all roster entries by team for this race
    const allTeamIds = teams.map(t => t.teamId);
    const rosterByTeam: Record<string, RosterEntry[]> = {};
    for (const tid of allTeamIds) {
      rosterByTeam[tid] = await this.getRoster({ ...user, role: "ADMIN" }, raceId, tid);
    }

    // Build ordered list per gender then per class with snake by start position
    const makeGenderList = (gender: Gender): StartListEntry[] => {
      const result: StartListEntry[] = [];

      for (const cls of classOrder) {
        // max start position for this class+gender across all teams
        let maxPos = 0;
        for (const tid of allTeamIds) {
          const posMax = (rosterByTeam[tid] || [])
            .filter(e => e.gender === gender && e.class === cls)
            .reduce((m, e) => Math.max(m, e.startOrder), 0);
          maxPos = Math.max(maxPos, posMax);
        }
        if (maxPos === 0) continue;

        // Randomize team order once for this class+gender
        const randomizedTeams = shuffle(allTeamIds.slice());

        // For each position 1..maxPos, snake through teams
        for (let pos = 1; pos <= maxPos; pos++) {
          const forward = (pos % 2) === 1;
          const order = forward ? randomizedTeams : randomizedTeams.slice().reverse();
          for (const tid of order) {
            const entry = (rosterByTeam[tid] || []).find(
              e => e.gender === gender && e.class === cls && e.startOrder === pos
            );
            if (!entry) continue;
            const team = teams.find(t => t.teamId === tid)!;
            const racer = team.racers.find(r => r.racerId === entry.racerId);
            if (!racer) continue;
            result.push({
              raceId,
              racerId: entry.racerId,
              racerName: racer.name,
              teamId: team.teamId,
              teamName: team.name,
              gender,
              class: cls,
              bib: 0, // fill later
            });
          }
        }
      }
      return result;
    };

    // Women first, then Men
    const women = makeGenderList("Female");
    const men = makeGenderList("Male");

    function nextAvailableBib(start: number, exclude: Set<number>, count: number): number[] {
      const res: number[] = [];
      let num = start;
      while (res.length < count) {
        if (!exclude.has(num)) res.push(num);
        num++;
      }
      return res;
    }

    // define excluded bibs globally or pass from UI
    const excludedBibs = new Set<number>([6,7, 13, 42, 111]); // example defaults

    // Women
    const womenBibs = nextAvailableBib(1, excludedBibs, women.length);
    women.forEach((s, i) => s.bib = womenBibs[i]);

    // Men start at 100
    const menBibs = nextAvailableBib(100, excludedBibs, men.length);
    men.forEach((s, i) => s.bib = menBibs[i]);


    const full = [...women, ...men];
    startLists[raceId] = full; // cache
    return structuredClone(full);
  },

  async getStartList(user: User, raceId: string): Promise<StartListEntry[]> {
    if (user.role !== "ADMIN") throw new Error("Only admins can view start lists.");
    return structuredClone(startLists[raceId] ?? []);
  },

};



