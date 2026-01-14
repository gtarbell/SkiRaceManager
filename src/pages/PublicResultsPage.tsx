import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Race, RaceResultGroup, TeamResult } from "../models";
import { api } from "../services/api";

function fmtTime(sec?: number) {
  if (sec === undefined) return "—";
  if (sec >= 60) {
    const minutes = Math.floor(sec / 60);
    const seconds = sec - minutes * 60;
    return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
  }
  return sec.toFixed(3);
}

function statusLabel(status: number) {
  if (status === 0) return "DNS";
  if (status === 1) return "Finished";
  if (status === 2) return "DNF";
  if (status === 4) return "DSQ";
  return "—";
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function PublicResultsPage() {
  const { raceId } = useParams();
  const [groups, setGroups] = useState<RaceResultGroup[]>([]);
  const [race, setRace] = useState<Race | null>(null);
  const [teamScores, setTeamScores] = useState<TeamResult[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const raceInfo = await api.getRacePublic(raceId);
        setRace(raceInfo ?? null);
        const res = await api.getResultsPublic(raceId);
        setGroups(res.groups ?? []);
        setTeamScores(res.teamScores ?? []);
      } catch (e: any) {
        setErr(e.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [raceId]);

  const toc: { id: string; label: string }[] = useMemo(() => ([
    ...groups.map(g => ({ id: `group-${slug(g.gender)}-${slug(g.class)}`, label: `${g.gender} ${g.class}` })),
    ...(teamScores.some(t => t.gender === "Female") ? [{ id: "team-female", label: "Female Varsity Teams" }] : []),
    ...(teamScores.some(t => t.gender === "Male") ? [{ id: "team-male", label: "Male Varsity Teams" }] : []),
  ]), [groups, teamScores]);

  useEffect(() => {
    if (!toc.length) {
      setActiveSection(null);
      return;
    }

    const sections = toc
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);

    const offset = 120; // account for sticky header space
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

  if (!raceId) return <section className="card error">Race not specified.</section>;
  if (loading) return <section className="card">Loading results…</section>;
  if (err) return <section className="card error">{err}</section>;
  if (!groups.length) return <section className="card">No results posted yet.</section>;

  const renderTeamScores = (gender: "Female" | "Male") => {
    const teams = teamScores.filter(t => t.gender === gender);
    if (!teams.length) return null;
    const ranked = teams
      .slice()
      .sort((a, b) => {
        const aT = a.totalTimeSec ?? Number.MAX_SAFE_INTEGER;
        const bT = b.totalTimeSec ?? Number.MAX_SAFE_INTEGER;
        return aT - bT || a.teamName.localeCompare(b.teamName);
      })
      .map((t, idx, arr) => {
        if (idx === 0) return { ...t, place: 1 };
        const prev = arr[idx - 1];
        const place = (t.totalTimeSec ?? Number.MAX_SAFE_INTEGER) === (prev.totalTimeSec ?? Number.MAX_SAFE_INTEGER) ? (prev as any).place : idx + 1;
        return { ...t, place };
      });
    const fmtContribs = (list: { bib: number; racerName: string; timeSec: number }[]) =>
      list.map(c => `${c.bib} ${c.racerName} (${fmtTime(c.timeSec)})`).join(", ");
    return (
      <div className="card" id={gender === "Female" ? "team-female" : "team-male"}>
        <div className="title">{gender} Varsity Team Scores</div>
        <div className="muted" style={{ marginBottom: 8 }}>Best three times per run; points scaled by team count.</div>
        <table className="table" style={{ width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Place</th>
              <th style={{ width: 160 }}>Team</th>
              <th style={{ width: 160 }}>Run 1 Total</th>
              <th style={{ width: 220 }}>Run 1 Used</th>
              <th style={{ width: 160 }}>Run 2 Total</th>
              <th style={{ width: 220 }}>Run 2 Used</th>
              <th style={{ width: 140 }}>Total Time</th>
              <th style={{ width: 90 }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(t => (
              <tr key={t.teamId}>
                <td>{t.place}</td>
                <td>{t.teamName}</td>
                <td>{t.run1TotalSec !== null ? fmtTime(t.run1TotalSec) : "—"}</td>
                <td className="small">{t.run1Contribs.length ? fmtContribs(t.run1Contribs) : "Need 3 finishers"}</td>
                <td>{t.run2TotalSec !== null ? fmtTime(t.run2TotalSec) : "—"}</td>
                <td className="small">{t.run2Contribs.length ? fmtContribs(t.run2Contribs) : "Need 3 finishers"}</td>
                <td>{t.totalTimeSec !== null ? fmtTime(t.totalTimeSec) : "—"}</td>
                <td>{t.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          
          {race && (
            <div>
              <h1>Race Results  • {race.name}</h1>
              <div className="muted" style={{ paddingBottom: "15px" }}>
                {race.location} • {new Date(race.date).toLocaleDateString()} • {race.type}
              </div>
            </div>
          )}
        </div>
        <Link to="/">Back</Link>
      </div>
      <div className="results-layout">
        {toc.length > 0 && (
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
        )}
        <div className="results-content">
          {groups.map(group => (
            <div className="card" key={`${group.gender}-${group.class}`} id={`group-${slug(group.gender)}-${slug(group.class)}`}>
              <div className="title" style={{ marginBottom: 8 }}>Standings • {group.gender} • {group.class}</div>
              {/* <div className="muted" style={{ marginBottom: 8 }}>Sorted by total points (Run 1 + Run 2)</div> */}
              <table className="table" style={{ width: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Place</th>
                    <th style={{ width: 70 }}>Bib</th>
                    <th style={{ width: 220 }}>Name</th>
                    <th style={{ width: 140 }}>Team</th>
                    <th style={{ width: 150 }}>Gender / Class</th>
                    <th style={{ width: 160 }}>Run 1 (Seconds)</th>
                    <th style={{ width: 160 }}>Run 2 (Seconds)</th>
                    <th style={{ width: 110 }}>Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {group.entries.reduce<{ entry: any; place: number }[]>((acc, entry, idx) => {
                    if (idx === 0) return [{ entry, place: 1 }];
                    const prev = acc[acc.length - 1];
                    const place = entry.totalPoints === prev.entry.totalPoints ? prev.place : idx + 1;
                    acc.push({ entry, place });
                    return acc;
                  }, []).map(({ entry, place }) => (
                    <tr key={entry.bib}>
                      <td>{place}</td>
                      <td>{entry.bib}</td>
                      <td>{entry.racerName}</td>
                      <td>{entry.teamName}</td>
                      <td>{entry.gender} • {entry.class}</td>
                      <td>
                        <div>{fmtTime(entry.run1TimeSec)}</div>
                        <div className="muted">{statusLabel(entry.run1Status)} • {entry.run1Points} pts</div>
                      </td>
                      <td>
                        <div>{fmtTime(entry.run2TimeSec)}</div>
                        <div className="muted">{statusLabel(entry.run2Status)} • {entry.run2Points} pts</div>
                      </td>
                      <td>{entry.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {teamScores.length > 0 && (
            <>
              {renderTeamScores("Female")}
              {renderTeamScores("Male")}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
