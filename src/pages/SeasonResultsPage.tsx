import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Race, RaceResultGroup, RaceResultEntry, TeamResult } from "../models";

type RaceResultResponse = { groups?: RaceResultGroup[]; teamScores?: TeamResult[] };

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
type TeamPerRaceStat = { points: number; place: number; totalTimeSec: number | null };
type TeamSeasonRow = {
  key: string;
  teamId: string;
  teamName: string;
  gender: string;
  perRace: Record<string, TeamPerRaceStat>;
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
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

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

function buildTeamPlaceMap(teamScores: TeamResult[]) {
  const map = new Map<string, PerRaceStat>();
  const genders: ("Female" | "Male")[] = ["Female", "Male"];
  const big = Number.MAX_SAFE_INTEGER;
  for (const gender of genders) {
    const list = teamScores
      .filter(t => t.gender === gender)
      .slice()
      .sort((a, b) => {
        const aT = a.totalTimeSec ?? big;
        const bT = b.totalTimeSec ?? big;
        return aT - bT || a.teamName.localeCompare(b.teamName);
      });
    list.reduce<{ entry: TeamResult; place: number }[]>((acc, entry, idx) => {
      if (idx === 0) return [{ entry, place: 1 }];
      const prev = acc[acc.length - 1];
      const place = (entry.totalTimeSec ?? big) === (prev.entry.totalTimeSec ?? big) ? prev.place : idx + 1;
      acc.push({ entry, place });
      return acc;
    }, []).forEach(({ entry, place }) => {
      map.set(`${entry.gender}|${entry.teamId}`, { points: entry.points, place });
    });
  }
  return map;
}

export default function SeasonResultsPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [seasonRows, setSeasonRows] = useState<SeasonRow[]>([]);
  const [teamRows, setTeamRows] = useState<TeamSeasonRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
        const teamAgg = new Map<string, TeamSeasonRow>();
        for (const [race, res] of results) {
          const groups = res.groups || [];
          const teamScores = res.teamScores || [];
          const placeMap = buildPlaceMap(groups);
          const teamPlaceMap = buildTeamPlaceMap(teamScores);
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
          for (const t of teamScores) {
            const mapKey = `${t.gender}|${t.teamId}`;
            const placeStat = teamPlaceMap.get(mapKey);
            if (!placeStat) continue;
            const existing = teamAgg.get(mapKey) || {
              key: mapKey,
              teamId: t.teamId,
              teamName: t.teamName,
              gender: t.gender,
              perRace: {},
              totalPoints: 0,
            };
            existing.perRace[race.raceId] = { points: placeStat.points, place: placeStat.place, totalTimeSec: t.totalTimeSec ?? null };
            existing.totalPoints += placeStat.points;
            teamAgg.set(mapKey, existing);
          }
        }
        setSeasonRows(Array.from(agg.values()));
        setTeamRows(Array.from(teamAgg.values()));
      } catch (e: any) {
        setErr(e.message || "Failed to load season results");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasRows = (gender: string, cls: string) =>
    seasonRows.some(r => r.gender === gender && normalizeClass(r.class) === cls);

  const groupsWithRows = useMemo(
    () => groupOrder.filter(g => hasRows(g.gender, g.class)),
    [seasonRows]
  );

  const toc = useMemo(
    () => {
      const items = groupsWithRows.map(g => ({
        id: `season-${slug(g.gender)}-${slug(g.class)}`,
        label: `${g.gender} ${g.class}`,
      }));
      if (teamRows.some(t => t.gender === "Female")) items.push({ id: "teams-female", label: "Female Varsity Teams" });
      if (teamRows.some(t => t.gender === "Male")) items.push({ id: "teams-male", label: "Male Varsity Teams" });
      return items;
    },
    [groupsWithRows, teamRows]
  );

  useEffect(() => {
    if (!toc.length) {
      setActiveSection(null);
      return;
    }

    const sections = toc
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);

    const offset = 120;
    let ticking = false;

    const syncActive = () => {
      ticking = false;
      if (!sections.length) return;
      let current: string | null = sections[0]?.id ?? null;
      for (const el of sections) {
        const top = el.getBoundingClientRect().top;
        if (top - offset <= 0) {
          current = el.id;
        } else {
          break;
        }
      }
      setActiveSection(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncActive);
    };

    syncActive();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [toc]);

  if (loading) return <section className="card">Loading season results…</section>;
  if (err) return <section className="card error">{err}</section>;

  const renderGroup = (gender: string, cls: string) => {
    const rows = seasonRows
      .filter(r => r.gender === gender && normalizeClass(r.class) === cls)
      .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
    if (!rows.length) return null;
    return (
      <div className="card" key={`${gender}-${cls}`} id={`season-${slug(gender)}-${slug(cls)}`}>
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

  const renderTeamStandings = (gender: "Female" | "Male") => {
    const rows = teamRows
      .filter(r => r.gender === gender)
      .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName));
    if (!rows.length) return null;
    const withPlaces = rows.map((row, idx, arr) => {
      const place = idx === 0 ? 1 : (row.totalPoints === arr[idx - 1].totalPoints ? (arr[idx - 1] as any).place : idx + 1);
      (row as any).place = place;
      return { row, place };
    });
    return (
      <div className="card" id={gender === "Female" ? "teams-female" : "teams-male"}>
        <div className="title">Season Team Standings • {gender} Varsity</div>
        <div className="muted small" style={{ marginBottom: 8 }}>
          Points are summed from varsity team scores across counting races.
        </div>
        <div className="scroll-x">
          <table className="table" style={{ minWidth: 650 }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Place</th>
                <th style={{ width: 220 }}>Team</th>
                {races.map(r => (
                  <th key={r.raceId} style={{ width: 110 }}>{r.name}</th>
                ))}
                <th style={{ width: 110 }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {withPlaces.map(({ row, place }) => (
                <tr key={row.key}>
                  <td>{place}</td>
                  <td>{row.teamName}</td>
                  {races.map(r => {
                    const stat = row.perRace[r.raceId];
                    if (!stat) return <td key={r.raceId}>—</td>;
                    return (
                      <td key={r.raceId}>
                        <div>{stat.points} pts ({stat.place})</div>
                        {stat.totalTimeSec !== null && (
                          <div className="muted small">{stat.totalTimeSec.toFixed(3)}s</div>
                        )}
                      </td>
                    );
                  })}
                  <td>{row.totalPoints}</td>
                </tr>
              ))}
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
      {toc.length > 0 ? (
        <div className="results-layout">
          <aside className="toc">
            <div className="toc-inner">
              <div className="title" style={{ marginBottom: 8 }}>Jump to</div>
              <div className="toc-links">
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`link-button secondary-link${activeSection === item.id ? " is-active" : ""}`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
          <div className="results-content">
            {groupOrder.map(g => renderGroup(g.gender, g.class))}
            {renderTeamStandings("Female")}
            {renderTeamStandings("Male")}
          </div>
        </div>
      ) : (
        <section className="card">No season results posted yet.</section>
      )}
    </section>
  );
}
