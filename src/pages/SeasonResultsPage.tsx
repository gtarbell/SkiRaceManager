import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Race, RaceResultGroup, RaceResultEntry } from "../models";

type RaceResultResponse = { groups?: RaceResultGroup[] };

type PerRaceStat = { points: number; place: number };
type SeasonRow = {
  key: string;
  racerId?: string;
  name: string;
  team: string;
  gender: string;
  class: string;
  perRace: Record<string, PerRaceStat>;
  totalPoints: number;
};

const groupOrder = [
  { gender: "Female", class: "Varsity" },
  { gender: "Male", class: "Varsity" },
  { gender: "Female", class: "Jr Varsity" },
  { gender: "Male", class: "Jr Varsity" },
  { gender: "Female", class: "Provisional" },
  { gender: "Male", class: "Provisional" },
];

const normalizeClass = (cls: string) => (cls === "Varsity Alternate" ? "Varsity" : cls);

function buildPlaceMap(groups: RaceResultGroup[]) {
  const map = new Map<string, PerRaceStat>();
  for (const g of groups) {
    const arr = (g.entries || []).slice();
    arr.reduce<{ entry: RaceResultEntry; place: number }[]>((acc, entry, idx) => {
      if (idx === 0) return [{ entry, place: 1 }];
      const prev = acc[acc.length - 1];
      const place = entry.totalPoints === prev.entry.totalPoints ? prev.place : idx + 1;
      acc.push({ entry, place });
      return acc;
    }, []).forEach(({ entry, place }) => {
      map.set(entry.racerId || `${entry.racerName}|${entry.teamName}`, { points: entry.totalPoints, place });
    });
  }
  return map;
}

export default function SeasonResultsPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [seasonRows, setSeasonRows] = useState<SeasonRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const raceList = await api.listRaces();
        const sortedRaces = raceList
          .filter(r => !r.independent)
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date));
        setRaces(sortedRaces);
        const results = await Promise.all(sortedRaces.map(async (r): Promise<[Race, RaceResultResponse]> => {
          try {
            const res = await api.getResultsPublic(r.raceId);
            return [r, res];
          } catch {
            return [r, { groups: [] }];
          }
        }));

        const agg = new Map<string, SeasonRow>();
        for (const [race, res] of results) {
          const groups = res.groups || [];
          const placeMap = buildPlaceMap(groups);
          for (const g of groups) {
            const gender = g.gender;
            const cls = normalizeClass(String(g.class));
            for (const entry of g.entries) {
              const key = entry.racerId || `${entry.racerName}|${entry.teamName}`;
              const placeStat = placeMap.get(key);
              if (!placeStat) continue;
              const existing = agg.get(key) || {
                key,
                racerId: entry.racerId,
                name: entry.racerName,
                team: entry.teamName,
                gender,
                class: cls,
                perRace: {},
                totalPoints: 0,
              };
              existing.perRace[race.raceId] = placeStat;
              existing.totalPoints += placeStat.points;
              existing.gender = gender;
              existing.class = cls;
              agg.set(key, existing);
            }
          }
        }
        setSeasonRows(Array.from(agg.values()));
      } catch (e: any) {
        setErr(e.message || "Failed to load season results");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <section className="card">Loading season results…</section>;
  if (err) return <section className="card error">{err}</section>;

  const renderGroup = (gender: string, cls: string) => {
    const rows = seasonRows
      .filter(r => r.gender === gender && normalizeClass(r.class) === cls)
      .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
    if (!rows.length) return null;
    return (
      <div className="card" key={`${gender}-${cls}`} id={`season-${gender}-${cls}`}>
        <div className="title">Season Standings • {gender} • {cls}</div>
        <div className="scroll-x">
          <table className="table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Place</th>
                <th style={{ width: 200 }}>Name</th>
                <th style={{ width: 160 }}>Team</th>
                {races.map(r => (
                  <th key={r.raceId} style={{ width: 90 }}>{r.name}</th>
                ))}
                <th style={{ width: 100 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const place = idx === 0 ? 1 : (row.totalPoints === rows[idx - 1].totalPoints ? (rows[idx - 1] as any).place : idx + 1);
                (row as any).place = place;
                return (
                  <tr key={row.key}>
                    <td>{place}</td>
                    <td>{row.name}</td>
                    <td>{row.team}</td>
                    {races.map(r => {
                      const stat = row.perRace[r.raceId];
                      return <td key={r.raceId}>{stat ? `${stat.points} pts (${stat.place})` : "—"}</td>;
                    })}
                    <td>{row.totalPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1>Season Results</h1>
        <Link to="/">Back</Link>
      </div>
      <p className="muted small">Independent races are excluded from season standings.</p>
      {groupOrder.map(g => renderGroup(g.gender, g.class)).filter(Boolean)}
    </section>
  );
}
