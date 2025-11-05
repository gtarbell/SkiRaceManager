import { Team, User, Racer, Gender, RacerClass, Race, RosterEntry, StartListEntry  } from "../models";

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
  return body as T;
}

export const api = {
  async listRaces(): Promise<Race[]>
  {
    return req("/races/")
  } ,

  async getRace(raceId: string): Promise<Race | undefined> { return req(`/races/${raceId}`); }

  // getTeamsForUser: (user: { role: "ADMIN" | "COACH"; teamIds: string[] }) =>
  //   user.role === "ADMIN" ? req("/teams") : req(`/teams?ids=${encodeURIComponent(user.teamIds.join(","))}`),

  // getTeamById: (teamId: string) => req(`/teams/${teamId}`),

  // addRacer: (teamId: string, input: { name: string; gender: "Male"|"Female"; class: string }) =>
  //   req(`/teams/${teamId}/racers`, { method: "POST", body: JSON.stringify(input) }),

  // updateRacer: (teamId: string, racerId: string, patch: any) =>
  //   req(`/teams/${teamId}/racers/${racerId}`, { method: "PATCH", body: JSON.stringify(patch) }),

  // removeRacer: (teamId: string, racerId: string) =>
  //   req(`/teams/${teamId}/racers/${racerId}`, { method: "DELETE" }),

  // getRoster: (user: any, raceId: string, teamId: string) =>
  //   req(`/races/${raceId}/roster/${teamId}`),

  // addToRoster: (user: any, raceId: string, teamId: string, racer: { id: string; gender: "Male"|"Female"; class: string }, desiredClass?: string) =>
  //   req(`/races/${raceId}/roster/${teamId}/add`, {
  //     method: "POST",
  //     body: JSON.stringify({ racerId: racer.id, desiredClass, rGender: racer.gender, rBaseClass: racer.class }),
  //   }),

  // removeFromRoster: (user: any, raceId: string, teamId: string, racerId: string) =>
  //   req(`/races/${raceId}/roster/${teamId}/entry/${racerId}`, { method: "DELETE" }),

  // updateEntryClass: (user: any, raceId: string, teamId: string, racerId: string, newClass: string) =>
  //   req(`/races/${raceId}/roster/${teamId}/entry/${racerId}`, { method: "PATCH", body: JSON.stringify({ newClass }) }),

  // moveEntry: (user: any, raceId: string, teamId: string, racerId: string, direction: "up"|"down") =>
  //   req(`/races/${raceId}/roster/${teamId}/move`, { method: "POST", body: JSON.stringify({ racerId, direction }) }),

  // // start list
  // generateStartList: (raceId: string, excludeCsv?: string) =>
  //   req(`/races/${raceId}/start-list/generate`, { method: "POST", body: JSON.stringify({ excludeCsv }) }),
  // getStartList: (raceId: string) => req(`/races/${raceId}/start-list`),
  // getStartListMeta: (raceId: string) => req(`/races/${raceId}/start-list?meta=1`),
};
