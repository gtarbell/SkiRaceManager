import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Race, RaceResultEntry, RaceResultGroup, TeamResult } from "../models";
import { api } from "../services/api";

type RaceResultResponse = { groups?: RaceResultGroup[]; teamScores?: TeamResult[] };
type Discipline = "Slalom" | "Giant Slalom";

type RacerSeason = {
  key: string;
  racerId?: string;
  name: string;
  team: string;
  gender: "Male" | "Female";
  pointsByDiscipline: Record<Discipline, Record<string, [number, number]>>;
  timeByDiscipline: Record<Discipline, Record<string, number>>;
};

type TeamSeason = {
  key: string;
  teamId: string;
  teamName: string;
  gender: "Male" | "Female";
  points: number;
  raceTimes: Record<string, number>;
};

type RankedRow = {
  key: string;
  name: string;
  team?: string;
  points: number;
  racesCounted: number;
  droppedPoints: number;
  raceTimes: Record<string, number>;
  tieBreakerApplied: boolean;
  rank: number;
};

type TeamRankedRow = {
  key: string;
  teamName: string;
  points: number;
  racesCounted: number;
  raceTimes: Record<string, number>;
  tieBreakerApplied: boolean;
  rank: number;
};

type StateQualifierRow = RankedRow & { qualifierSeed: number };

const MAX_LIST_SIZE = 10;
const EMPTY_RACE_IDS: Record<Discipline, string[]> = { Slalom: [], "Giant Slalom": [] };

const toDiscipline = (raceType: string): Discipline | null => {
  const t = (raceType || "").toLowerCase();
  if (t.includes("giant") || t === "gs") return "Giant Slalom";
  if (t.includes("slalom") || t === "sl") return "Slalom";
  return null;
};

const isVarsityClass = (className: string) => {
  const c = (className || "").toLowerCase();
  return c === "varsity" || c === "varsity alternate";
};

const racerKey = (entry: RaceResultEntry) => entry.racerId || `${entry.racerName}|${entry.teamName}`;

function hasValidRaceTime(entry: RaceResultEntry) {
  return (
    entry.run1Status === 1
    && entry.run2Status === 1
    && typeof entry.run1TimeSec === "number"
    && typeof entry.run2TimeSec === "number"
  );
}

function dropLowest(scores: number[]) {
  if (!scores.length) return { total: 0, dropped: 0, counted: 0 };
  if (scores.length === 1) return { total: scores[0], dropped: 0, counted: 1 };
  const sorted = scores.slice().sort((a, b) => a - b);
  const dropped = sorted[0];
  const total = sorted.slice(1).reduce((sum, score) => sum + score, 0);
  return { total, dropped, counted: sorted.length - 1 };
}

function pairTieBreak(aTimes: Record<string, number>, bTimes: Record<string, number>) {
  const commonRaceIds = Object.keys(aTimes).filter(raceId => typeof bTimes[raceId] === "number");
  if (!commonRaceIds.length) return null;
  const aTotal = commonRaceIds.reduce((sum, raceId) => sum + aTimes[raceId], 0);
  const bTotal = commonRaceIds.reduce((sum, raceId) => sum + bTimes[raceId], 0);
  return { aTotal, bTotal };
}

function rankRows<T extends { key: string; points: number; raceTimes: Record<string, number>; nameForSort: string }>(rows: T[]) {
  const tieBreakApplied = new Map<string, boolean>();
  rows.forEach(row => tieBreakApplied.set(row.key, false));

  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      if (rows[i].points !== rows[j].points) continue;
      const tie = pairTieBreak(rows[i].raceTimes, rows[j].raceTimes);
      if (tie && tie.aTotal !== tie.bTotal) {
        tieBreakApplied.set(rows[i].key, true);
        tieBreakApplied.set(rows[j].key, true);
      }
    }
  }

  const sorted = rows.slice().sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const tie = pairTieBreak(a.raceTimes, b.raceTimes);
    if (tie && tie.aTotal !== tie.bTotal) return tie.aTotal - tie.bTotal;
    return a.nameForSort.localeCompare(b.nameForSort);
  });

  const withRanks = sorted.reduce<Array<T & { rank: number }>>((acc, row, idx) => {
    if (idx === 0) {
      acc.push({ ...row, rank: 1 });
      return acc;
    }
    const prev = acc[idx - 1];
    const tiedOnPoints = row.points === prev.points;
    const tie = pairTieBreak(row.raceTimes, prev.raceTimes);
    const tiedOnBreaker = !tie || tie.aTotal === tie.bTotal;
    const rank = tiedOnPoints && tiedOnBreaker ? prev.rank : idx + 1;
    acc.push({ ...row, rank });
    return acc;
  }, []);

  return withRanks.map(row => ({ ...row, tieBreakerApplied: tieBreakApplied.get(row.key) || false }));
}

function runScoresForDiscipline(pointsByRace: Record<string, [number, number]>, raceIds: string[]) {
  return raceIds.flatMap(raceId => pointsByRace[raceId] ?? [0, 0]);
}

function buildIndividualRows(
  racers: RacerSeason[],
  raceIdsByDiscipline: Record<Discipline, string[]>,
  gender: "Male" | "Female",
  category: "sl" | "gs" | "combined",
  maxRows: number | null = MAX_LIST_SIZE
): RankedRow[] {
  const baseRows = racers
    .filter(r => r.gender === gender)
    .map(r => {
      const slScores = runScoresForDiscipline(r.pointsByDiscipline.Slalom, raceIdsByDiscipline.Slalom);
      const gsScores = runScoresForDiscipline(r.pointsByDiscipline["Giant Slalom"], raceIdsByDiscipline["Giant Slalom"]);
      const sl = dropLowest(slScores);
      const gs = dropLowest(gsScores);
      const slTimes = r.timeByDiscipline.Slalom;
      const gsTimes = r.timeByDiscipline["Giant Slalom"];

      if (category === "sl") {
        return {
          key: `${r.key}|sl`,
          name: r.name,
          nameForSort: r.name,
          team: r.team,
          points: sl.total,
          racesCounted: sl.counted,
          droppedPoints: sl.dropped,
          raceTimes: slTimes,
        };
      }

      if (category === "gs") {
        return {
          key: `${r.key}|gs`,
          name: r.name,
          nameForSort: r.name,
          team: r.team,
          points: gs.total,
          racesCounted: gs.counted,
          droppedPoints: gs.dropped,
          raceTimes: gsTimes,
        };
      }

      return {
        key: `${r.key}|combined`,
        name: r.name,
        nameForSort: r.name,
        team: r.team,
        points: sl.total + gs.total,
        racesCounted: sl.counted + gs.counted,
        droppedPoints: sl.dropped + gs.dropped,
        raceTimes: { ...slTimes, ...gsTimes },
      };
    })
    .filter(row => row.points > 0);

  const ranked = rankRows(baseRows).map(row => ({
      key: row.key,
      name: row.name,
      team: row.team,
      points: row.points,
      racesCounted: row.racesCounted,
      droppedPoints: row.droppedPoints,
      raceTimes: row.raceTimes,
      tieBreakerApplied: row.tieBreakerApplied,
      rank: row.rank,
    }));

  return maxRows === null ? ranked : ranked.slice(0, maxRows);
}

function buildTeamRows(teams: TeamSeason[], gender: "Male" | "Female"): TeamRankedRow[] {
  const baseRows = teams
    .filter(t => t.gender === gender)
    .map(t => ({
      key: t.key,
      teamName: t.teamName,
      nameForSort: t.teamName,
      points: t.points,
      racesCounted: Object.keys(t.raceTimes).length,
      raceTimes: t.raceTimes,
    }))
    .filter(row => row.points > 0);

  return rankRows(baseRows)
    .slice(0, MAX_LIST_SIZE)
    .map(row => ({
      key: row.key,
      teamName: row.teamName,
      points: row.points,
      racesCounted: row.racesCounted,
      raceTimes: row.raceTimes,
      tieBreakerApplied: row.tieBreakerApplied,
      rank: row.rank,
    }));
}

function buildStateQualifiers(rows: RankedRow[], excludedTeams: Set<string>, count = 3): StateQualifierRow[] {
  const filtered = rows.filter(row => !row.team || !excludedTeams.has(row.team)).slice(0, count);
  return filtered.map((row, idx) => ({ ...row, qualifierSeed: idx + 1 }));
}

export default function PublicAwardsPage() {
  const [individuals, setIndividuals] = useState<RacerSeason[]>([]);
  const [teams, setTeams] = useState<TeamSeason[]>([]);
  const [raceIdsByDiscipline, setRaceIdsByDiscipline] = useState<Record<Discipline, string[]>>(EMPTY_RACE_IDS);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const raceList = await api.listRaces();
        const countingRaces = raceList
          .filter(race => !race.independent)
          .map(race => ({ race, discipline: toDiscipline(race.type) }))
          .filter((item): item is { race: Race; discipline: Discipline } => !!item.discipline)
          .sort((a, b) => a.race.date.localeCompare(b.race.date));
        const disciplineRaceIds: Record<Discipline, string[]> = { Slalom: [], "Giant Slalom": [] };
        countingRaces.forEach(({ race, discipline }) => {
          disciplineRaceIds[discipline].push(race.raceId);
        });

        const raceResults = await Promise.all(
          countingRaces.map(async ({ race, discipline }): Promise<{ raceId: string; discipline: Discipline; data: RaceResultResponse }> => {
            try {
              const data = await api.getResultsPublic(race.raceId);
              return { raceId: race.raceId, discipline, data };
            } catch {
              return { raceId: race.raceId, discipline, data: { groups: [], teamScores: [] } };
            }
          })
        );

        const racerMap = new Map<string, RacerSeason>();
        const teamMap = new Map<string, TeamSeason>();

        for (const { raceId, discipline, data } of raceResults) {
          const groups = data.groups || [];
          const teamScores = data.teamScores || [];

          for (const group of groups) {
            if (group.gender !== "Male" && group.gender !== "Female") continue;
            if (!isVarsityClass(String(group.class))) continue;
            for (const entry of group.entries) {
              const key = racerKey(entry);
              const racer = racerMap.get(key) || {
                key,
                racerId: entry.racerId,
                name: entry.racerName,
                team: entry.teamName,
                gender: group.gender,
                pointsByDiscipline: { Slalom: {}, "Giant Slalom": {} },
                timeByDiscipline: { Slalom: {}, "Giant Slalom": {} },
              };

              racer.pointsByDiscipline[discipline][raceId] = [entry.run1Points || 0, entry.run2Points || 0];

              if (hasValidRaceTime(entry)) {
                racer.timeByDiscipline[discipline][raceId] = (entry.run1TimeSec || 0) + (entry.run2TimeSec || 0);
              }

              racerMap.set(key, racer);
            }
          }

          for (const team of teamScores) {
            if (team.gender !== "Male" && team.gender !== "Female") continue;
            const key = `${team.gender}|${team.teamId}`;
            const existing = teamMap.get(key) || {
              key,
              teamId: team.teamId,
              teamName: team.teamName,
              gender: team.gender,
              points: 0,
              raceTimes: {},
            };

            existing.points += team.points || 0;
            if (typeof team.totalTimeSec === "number") {
              existing.raceTimes[raceId] = team.totalTimeSec;
            }
            teamMap.set(key, existing);
          }
        }

        setIndividuals(Array.from(racerMap.values()));
        setTeams(Array.from(teamMap.values()));
        setRaceIdsByDiscipline(disciplineRaceIds);
      } catch (e: any) {
        setErr(e.message || "Failed to load awards");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maleSlalom = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Male", "sl"), [individuals, raceIdsByDiscipline]);
  const maleGs = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Male", "gs"), [individuals, raceIdsByDiscipline]);
  const maleCombined = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Male", "combined"), [individuals, raceIdsByDiscipline]);

  const femaleSlalom = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Female", "sl"), [individuals, raceIdsByDiscipline]);
  const femaleGs = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Female", "gs"), [individuals, raceIdsByDiscipline]);
  const femaleCombined = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Female", "combined"), [individuals, raceIdsByDiscipline]);

  const maleSlalomAll = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Male", "sl", null), [individuals, raceIdsByDiscipline]);
  const maleGsAll = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Male", "gs", null), [individuals, raceIdsByDiscipline]);
  const maleCombinedAll = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Male", "combined", null), [individuals, raceIdsByDiscipline]);

  const femaleSlalomAll = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Female", "sl", null), [individuals, raceIdsByDiscipline]);
  const femaleGsAll = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Female", "gs", null), [individuals, raceIdsByDiscipline]);
  const femaleCombinedAll = useMemo(() => buildIndividualRows(individuals, raceIdsByDiscipline, "Female", "combined", null), [individuals, raceIdsByDiscipline]);

  const maleTeams = useMemo(() => buildTeamRows(teams, "Male"), [teams]);
  const femaleTeams = useMemo(() => buildTeamRows(teams, "Female"), [teams]);
  const maleStateTeamNames = useMemo(() => new Set(maleTeams.slice(0, 3).map(t => t.teamName)), [maleTeams]);
  const femaleStateTeamNames = useMemo(() => new Set(femaleTeams.slice(0, 3).map(t => t.teamName)), [femaleTeams]);

  const maleSlalomQualifiers = useMemo(
    () => buildStateQualifiers(maleSlalomAll, maleStateTeamNames, 3),
    [maleSlalomAll, maleStateTeamNames]
  );
  const maleGsQualifiers = useMemo(
    () => buildStateQualifiers(maleGsAll, maleStateTeamNames, 3),
    [maleGsAll, maleStateTeamNames]
  );
  const femaleSlalomQualifiers = useMemo(
    () => buildStateQualifiers(femaleSlalomAll, femaleStateTeamNames, 3),
    [femaleSlalomAll, femaleStateTeamNames]
  );
  const femaleGsQualifiers = useMemo(
    () => buildStateQualifiers(femaleGsAll, femaleStateTeamNames, 3),
    [femaleGsAll, femaleStateTeamNames]
  );

  const downloadCsv = () => {
    const headers = ["category", "gender", "rank", "racer", "team", "points", "scores_used", "dropped_points", "tie_breaker_applied"];
    const groups: Array<{ category: string; gender: string; rows: RankedRow[] }> = [
      { category: "Slalom", gender: "Male", rows: maleSlalomAll },
      { category: "Giant Slalom", gender: "Male", rows: maleGsAll },
      { category: "Combined", gender: "Male", rows: maleCombinedAll },
      { category: "Slalom", gender: "Female", rows: femaleSlalomAll },
      { category: "Giant Slalom", gender: "Female", rows: femaleGsAll },
      { category: "Combined", gender: "Female", rows: femaleCombinedAll },
    ];

    const esc = (v: string | number) => {
      const s = String(v);
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) return `"${s.replace(/"/g, "\"\"")}"`;
      return s;
    };

    const lines = [headers.join(",")];
    groups.forEach(group => {
      group.rows.forEach(row => {
        lines.push([
          esc(group.category),
          esc(group.gender),
          esc(row.rank),
          esc(row.name),
          esc(row.team || ""),
          esc(row.points),
          esc(row.racesCounted),
          esc(row.droppedPoints),
          esc(row.tieBreakerApplied ? "TB" : ""),
        ].join(","));
      });
    });

    const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "season-awards-all-racers.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <section className="card">Loading awards…</section>;
  if (err) return <section className="card error">{err}</section>;

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Season Awards</h1>
          <div className="muted" style={{ marginBottom: 12 }}>
            Top 10 standings by points. Individual lists drop each racer&apos;s lowest run score per discipline.
            Tie-breaker uses lowest combined time across races both tied entries have in common.
          </div>
        </div>
        <div className="row">
          <button className="secondary" onClick={downloadCsv}>Download CSV</button>
          <Link to="/">Back</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="muted small">
          <strong>TB</strong> indicates the time-based tie-breaker was applied for that entry.
        </div>
      </div>

      <div className="card">
        <div className="title" style={{ marginBottom: 8 }}>Individual State Qualifiers</div>
        <div className="muted small" style={{ marginBottom: 10 }}>
          Top 3 in each discipline/gender who are not on the gender&apos;s top 3 teams.
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>
          Men excluded teams: {maleTeams.slice(0, 3).map(t => t.teamName).join(", ") || "None"}<br />
          Women excluded teams: {femaleTeams.slice(0, 3).map(t => t.teamName).join(", ") || "None"}
        </div>
        <StateQualifierTable title="Men Slalom Qualifiers" rows={maleSlalomQualifiers} />
        <StateQualifierTable title="Men Giant Slalom Qualifiers" rows={maleGsQualifiers} />
        <StateQualifierTable title="Women Slalom Qualifiers" rows={femaleSlalomQualifiers} />
        <StateQualifierTable title="Women Giant Slalom Qualifiers" rows={femaleGsQualifiers} />
      </div>

      <AwardsTable title="Men Individual Slalom" rows={maleSlalom} />
      <AwardsTable title="Men Individual Giant Slalom" rows={maleGs} />
      <AwardsTable title="Men Individual Combined" rows={maleCombined} />

      <AwardsTable title="Women Individual Slalom" rows={femaleSlalom} />
      <AwardsTable title="Women Individual Giant Slalom" rows={femaleGs} />
      <AwardsTable title="Women Individual Combined" rows={femaleCombined} />

      <TeamAwardsTable title="Men Team Rankings" rows={maleTeams} />
      <TeamAwardsTable title="Women Team Rankings" rows={femaleTeams} />
    </section>
  );
}

function AwardsTable({ title, rows }: { title: string; rows: RankedRow[] }) {
  return (
    <div className="card">
      <div className="title" style={{ marginBottom: 8 }}>{title}</div>
      <div className="scroll-x">
        <table className="table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th style={{ width: 220 }}>Racer</th>
              <th style={{ width: 180 }}>Team</th>
              <th style={{ width: 90 }}>Points</th>
              <th style={{ width: 110 }}>Scores Used</th>
              <th style={{ width: 110 }}>Dropped</th>
              <th style={{ width: 70 }}>TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(row => (
              <tr key={row.key}>
                <td>{row.rank}</td>
                <td>{row.name}</td>
                <td>{row.team || "—"}</td>
                <td>{row.points}</td>
                <td>{row.racesCounted}</td>
                <td>{row.droppedPoints}</td>
                <td>{row.tieBreakerApplied ? "TB" : ""}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="muted">No eligible results yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamAwardsTable({ title, rows }: { title: string; rows: TeamRankedRow[] }) {
  return (
    <div className="card">
      <div className="title" style={{ marginBottom: 8 }}>{title}</div>
      <div className="scroll-x">
        <table className="table" style={{ minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th style={{ width: 260 }}>Team</th>
              <th style={{ width: 100 }}>Points</th>
              <th style={{ width: 130 }}>Races Timed</th>
              <th style={{ width: 70 }}>TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(row => (
              <tr key={row.key}>
                <td>{row.rank}</td>
                <td>{row.teamName}</td>
                <td>{row.points}</td>
                <td>{row.racesCounted}</td>
                <td>{row.tieBreakerApplied ? "TB" : ""}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="muted">No team standings yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StateQualifierTable({ title, rows }: { title: string; rows: StateQualifierRow[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="title" style={{ marginBottom: 8 }}>{title}</div>
      <div className="scroll-x">
        <table className="table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 100 }}>Qualifier</th>
              <th style={{ width: 120 }}>Overall Rank</th>
              <th style={{ width: 220 }}>Racer</th>
              <th style={{ width: 180 }}>Team</th>
              <th style={{ width: 90 }}>Points</th>
              <th style={{ width: 70 }}>TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(row => (
              <tr key={`${title}-${row.key}`}>
                <td>{row.qualifierSeed}</td>
                <td>{row.rank}</td>
                <td>{row.name}</td>
                <td>{row.team || "—"}</td>
                <td>{row.points}</td>
                <td>{row.tieBreakerApplied ? "TB" : ""}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="muted">No qualifiers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
