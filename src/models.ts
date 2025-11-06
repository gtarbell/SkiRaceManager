export type Role = "ADMIN" | "COACH";

// Removed "Non-Binary"
export type Gender = "Male" | "Female";

export type RacerClass = "Varsity" | "Varsity Alternate" | "Jr Varsity" | "Provisional";

export interface User {
  id: string;
  name: string;
  role: Role;
  teamIds: string[];
}

export interface Racer {
  racerId: string;
  name: string;
  gender: Gender;
  class: RacerClass; // baseline/default; if "Provisional", it cannot change on any race roster
  teamId: string;
}

export interface Team {
  teamId: string;
  name: string;
  coachUserIds: string[];
  racers: Racer[];
}

export type RaceType = "Slalom" | "Giant Slalom";

export interface Race {
  raceId: string;
  name: string;
  location: string;
  date: string; // ISO
  type: RaceType;
  leagueId?: string | null;
}

export interface RosterEntry {
  raceId: string;
  teamId: string;
  racerId: string;
  gender: Gender;
  class: RacerClass;   // per-race class; if the racer's baseline is Provisional, this must remain Provisional
  startOrder: number;
}

export interface AuthState {
  user: User | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

export interface StartListEntry {
  raceId: string;
  racerId: string;
  racerName: string;
  teamId: string;
  teamName: string;
  gender: Gender;
  class: RacerClass;
  bib: number;
}
