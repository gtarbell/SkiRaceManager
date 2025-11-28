import { Team, User, Racer, Gender, RacerClass, Race, RosterEntry, StartListEntry  } from "../models";

let users: User[] = [
  { id: "u1", name: "Geddy Admin", role: "ADMIN", teamIds: [] },
  { id: "u2", name: "Coach Josh", role: "COACH", teamIds: ["t4"] },
  { id: "u3", name: "Brad", role: "ADMIN", teamIds: [] },
  { id: "u4", name: "Eastside Coach", role: "COACH", teamIds: ["t2", "t3", "t1"] },
];

const API = import.meta.env.VITE_API_BASE_URL; // set in Amplify/Env

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let apiUrl = "https://qhlag5gvl6.execute-api.us-east-2.amazonaws.com";

  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  // Some endpoints may return { error } with 200; treat those as failures too
  if (body && !Array.isArray(body) && typeof body === "object" && "error" in body) {
    throw new Error((body as any).error);
  }
  return body as T;
}

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


const classOrder: RacerClass[] = ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


const startLists: Record<string, StartListEntry[]> = {};

export const api = {
  
  ensureAuth(user: User, teamId: string) {
    if (user.role === "ADMIN") return;
    if (!user.teamIds.includes(teamId)) throw new Error("Not authorized for this team");
  },
  genders(): Gender[] {
    return ["Male", "Female"];
  },
  classes(): RacerClass[] {
    return ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];
  },

  async loginByName(name: string): Promise<User> {
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) throw new Error("User not found. Try 'Alice Admin', 'Carl Coach', or 'Casey Coach'.");
    return structuredClone(user);
  },

  async listRaces(): Promise<Race[]>
  {
    return req("/races/")
  } ,

  async getRace(raceId: string): Promise<Race | undefined> { return req(`/races/${raceId}`); },
  async getTeamsForUser(user: User): Promise<Team[]> {
    if (user.role === "ADMIN") 
      return req("/teams/");
    else
      return req(`/teams/?ids=${encodeURIComponent(user.teamIds.join(","))}`)
  },

  async getTeamById(teamId: string): Promise<Team | undefined> {
    return req(`/teams/${teamId}`);
  },

  async listTeams(): Promise<Team[]> {
    return req(`/teams/`);
  },
  async addRacer(teamId: string, input: Omit<Racer, "racerId" | "teamId">): Promise<Racer> {
    return req(`/teams/${teamId}/racers`, { method: "POST", body: JSON.stringify(input) })
  },

  async updateRacer(teamId: string, racerId: string, patch: Partial<Omit<Racer, "racerId" | "teamId">>): Promise<Racer> {
    return req(`/teams/${teamId}/racers/${racerId}`, { method: "PATCH", body: JSON.stringify(patch) })
  },
  async removeRacer(teamId: string, racerId: string): Promise<void> {
    req(`/teams/${teamId}/racers/${racerId}`, { method: "DELETE" });
  },
  async getRoster (user: any, raceId: string, teamId: string) : Promise<RosterEntry[]> {
    return req(`/races/${raceId}/roster/${teamId}`);

  },

  async addToRoster (user: any, raceId: string, teamId: string, racer: { racerId: string; gender: "Male"|"Female"; class: string }, desiredClass?: string) : Promise<RosterEntry[]>{
    return req(`/races/${raceId}/roster/${teamId}/add`, {
      method: "POST",
      body: JSON.stringify({ racerId: racer.racerId, desiredClass, rGender: racer.gender, rBaseClass: racer.class }),
    });
  },

  async removeFromRoster (user: any, raceId: string, teamId: string, racerId: string) : Promise<RosterEntry[]>{
    return req(`/races/${raceId}/roster/${teamId}/entry/${racerId}`, { method: "DELETE" });
  },

  async updateEntryClass (user: any, raceId: string, teamId: string, racerId: string, newClass: string): Promise<RosterEntry>{
    return req(`/races/${raceId}/roster/${teamId}/entry/${racerId}`, { method: "PATCH", body: JSON.stringify({ newClass }) });
    //return result;
  },
  async moveEntry (user: any, raceId: string, teamId: string, racerId: string, direction: "up"|"down") : Promise<RosterEntry>{
    return req(`/races/${raceId}/roster/${teamId}/move`, { method: "POST", body: JSON.stringify({ racerId, direction }) });
  },
  // // start list
  // generateStartList: (raceId: string, excludeCsv?: string) =>
  //   req(`/races/${raceId}/start-list/generate`, { method: "POST", body: JSON.stringify({ excludeCsv }) }),
  // getStartList: (raceId: string) => req(`/races/${raceId}/start-list`),
  // getStartListMeta: (raceId: string) => req(`/races/${raceId}/start-list?meta=1`),

  async copyRosterFromRace(
    user: User,
    fromRaceId: string,
    toRaceId: string,
    teamId: string
  ): Promise<RosterEntry[]> {
    api.ensureAuth(user, teamId);
    if (fromRaceId === toRaceId) throw new Error("Choose a different race to copy from.");

    const source = structuredClone(rosters[key(fromRaceId, teamId)] ?? []);
    // If nothing to copy, just clear target roster to empty copy
    const targetKey = key(toRaceId, teamId);
    const t = await this.getTeamById(teamId);
    //const t = teams.find(t => t.teamId === teamId);
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
    this.ensureAuth(user, teamId);
    const t = await this.getTeamById(teamId);
    if (!t) throw new Error("Team not found");
    return structuredClone(t.racers);
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

    var teams = await this.listTeams();
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
