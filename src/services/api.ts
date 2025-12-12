import { Team, User, Racer, Gender, RacerClass, Race, RosterEntry, StartListEntry, RaceResultEntry, RaceResultGroup, TeamResult  } from "../models";

let users: User[] = [
  { id: "u1", name: "Geddy Admin", role: "ADMIN", teamIds: [] },
  { id: "u2", name: "Coach Josh", role: "COACH", teamIds: ["sandy"] },
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
  if (rc === "DNS - Did Not Start") return 0;
  const list = byGender(entries, gender).filter(e => e.class === rc);
  return list.length === 0 ? 1 : Math.max(...list.map(e => e.startOrder)) + 1;
}

const rosterClasses: RacerClass[] = ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional", "DNS - Did Not Start"];
const racingClassOrder: RacerClass[] = ["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"];


export const api = {
  
  ensureAuth(user: User, teamId: string) {
    if (user.role === "ADMIN") return;
    if (!user.teamIds.includes(teamId)) throw new Error("Not authorized for this team");
  },
  genders(): Gender[] {
    return ["Male", "Female"];
  },
  classes(): RacerClass[] {
    return rosterClasses;
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
  async getRacePublic(raceId: string): Promise<Race | undefined> { return req(`/races/${raceId}`); },
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
    return req(`/races/${toRaceId}/roster/${teamId}/copy`, {
      method: "POST",
      body: JSON.stringify({ fromRaceId }),
    });
  },

  async eligibleRacers(user: User, teamId: string): Promise<Racer[]> {
    this.ensureAuth(user, teamId);
    const t = await this.getTeamById(teamId);
    if (!t) throw new Error("Team not found");
    return structuredClone(t.racers);
  },

 
  normalizeStartOrders(raceId: string, teamId: string, gender: Gender, rc?: RacerClass) {
    if (rc === "DNS - Did Not Start") return;
    const k = key(raceId, teamId);
    const list = rosters[k] ?? [];
    const buckets = rc ? [rc] : racingClassOrder;
    for (const c of buckets) {
      const bucket = list
        .filter(e => e.gender === gender && e.class === c)
        .sort((a, b) => a.startOrder - b.startOrder);
      bucket.forEach((e, idx) => e.startOrder = idx + 1);
    }
  },

  async generateStartList(user: User, raceId: string, excludedBibs?: number[]): Promise<{ entries: StartListEntry[]; meta?: any }> {
    if (user.role !== "ADMIN") throw new Error("Only admins can generate start lists.");
    return req(`/races/${raceId}/start-list/generate`, {
      method: "POST",
      body: JSON.stringify({ excludedBibs }),
    });
  },

  async getStartList(user: User, raceId: string): Promise<{ entries: StartListEntry[]; meta?: any }> {
    if (user.role !== "ADMIN") throw new Error("Only admins can view start lists.");
    return req(`/races/${raceId}/start-list`);
  },

  async getStartListPublic(raceId: string): Promise<{ entries: StartListEntry[]; meta?: any }> {
    return req(`/races/${raceId}/start-list`);
  },

  async getExcludedBibs(user: User, raceId: string): Promise<number[]> {
    if (user.role !== "ADMIN") throw new Error("Only admins can view start lists.");
    return req(`/races/${raceId}/start-list/excluded`);
  },

  async setExcludedBibs(user: User, raceId: string, bibs: number[]): Promise<number[]> {
    if (user.role !== "ADMIN") throw new Error("Only admins can edit excluded bibs.");
    return req(`/races/${raceId}/start-list/excluded`, {
      method: "POST",
      body: JSON.stringify({ excludedBibs: bibs }),
    });
  },

  async uploadResults(user: User, raceId: string, xml: string): Promise<{ entries: RaceResultEntry[]; issues: string[]; groups?: RaceResultGroup[]; teamScores?: TeamResult[] }> {
    if (user.role !== "ADMIN") throw new Error("Only admins can upload results.");
    return req(`/races/${raceId}/results`, {
      method: "POST",
      body: JSON.stringify({ xml }),
    });
  },

  async getResults(user: User, raceId: string): Promise<{ entries: RaceResultEntry[]; issues: string[]; groups?: RaceResultGroup[]; teamScores?: TeamResult[] }> {
    if (user.role !== "ADMIN") throw new Error("Only admins can view results.");
    return req(`/races/${raceId}/results`);
  },

  async getResultsPublic(raceId: string): Promise<{ entries: RaceResultEntry[]; issues: string[]; groups?: RaceResultGroup[]; teamScores?: TeamResult[] }> {
    return req(`/races/${raceId}/results`);
  },
};
