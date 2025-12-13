export type Role = "ADMIN" | "COACH";

// Removed "Non-Binary"
export type Gender = "Male" | "Female";

export type RacerClass = "Varsity" | "Varsity Alternate" | "Jr Varsity" | "Provisional" | "DNS - Did Not Start";

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
  locked?: boolean;
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

export type RunStatus = 0 | 1 | 2 | 4; // 1=Finished, 2=DNF, 4=DSQ

export interface RaceResultEntry {
  raceId: string;
  bib: number;
  racerId?: string;
  racerName: string;
  teamId?: string;
  teamName: string;
  gender: Gender | "Unknown";
  class: RacerClass | "Unknown";
  run1Status: RunStatus;
  run2Status: RunStatus;
  run1TimeSec?: number;
  run2TimeSec?: number;
  run1Points: number;
  run2Points: number;
  totalPoints: number;
}

export interface RaceResultGroup {
  gender: Gender | "Unknown";
  class: RacerClass | "Unknown";
  entries: RaceResultEntry[];
}

export interface TeamResult {
  gender: Gender;
  teamId: string;
  teamName: string;
  run1TotalSec: number | null;
  run2TotalSec: number | null;
  totalTimeSec: number | null;
  run1Contribs: { bib: number; racerName: string; timeSec: number }[];
  run2Contribs: { bib: number; racerName: string; timeSec: number }[];
  points: number;
}
