import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RaceResultEntry, RaceResultGroup, TeamResult } from "../models";
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

export default function ResultsPage() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const [entries, setEntries] = useState<RaceResultEntry[] | null>(null);
  const [groups, setGroups] = useState<RaceResultGroup[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [teamScores, setTeamScores] = useState<TeamResult[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!raceId || !user) return;
    (async () => {
      try {
        const res = await api.getResults(user, raceId);
        setEntries(res.entries);
        setGroups(res.groups ?? []);
        setTeamScores(res.teamScores ?? []);
        setIssues(res.issues);
      } catch {
        setEntries([]);
      }
    })();
  }, [raceId, user]);

  if (!user || user.role !== "ADMIN") return <section className="card error">Admins only.</section>;
  if (!raceId) return <section className="card error">Race not specified.</section>;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const text = await file.text();
      const res = await api.uploadResults(user, raceId, text);
      setEntries(res.entries);
      setGroups(res.groups ?? []);
      setTeamScores(res.teamScores ?? []);
      setIssues(res.issues);
    } catch (error: any) {
      setErr(error.message || "Failed to upload results");
    } finally {
      setBusy(false);
    }
  };

  const recalcTeams = async () => {
    if (!user || !raceId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.recalcTeamScores(user, raceId);
      setEntries(res.entries);
      setGroups(res.groups ?? []);
      setTeamScores(res.teamScores ?? []);
      setIssues(res.issues);
    } catch (error: any) {
      setErr(error.message || "Failed to recalculate team scores");
    } finally {
      setBusy(false);
    }
  };

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
      <div className="card">
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
        <h1>Race Results</h1>
        <Link to={`/races/${raceId}/start-list`}>Back to Start List</Link>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p>Upload a .NatFIS file for this race. Bibs are matched to the start list; mismatched names are reported.</p>
        <div className="row" style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input type="file" accept=".NatFIS,.xml,text/xml" onChange={onFile} disabled={busy} />
          <button className="secondary" onClick={recalcTeams} disabled={busy}>
            {busy ? "Working…" : "Recalculate team scores"}
          </button>
        </div>
        {busy && <div className="muted">Processing…</div>}
        {err && <div className="error">{err}</div>}
      </div>

      {issues.length > 0 && (
        <div className="card warning" style={{ marginBottom: 16 }}>
          <div className="title">Notifications</div>
          <ul>
            {issues.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}

      {groups.length > 0 && groups.map(group => (
        <div className="card">
          <div className="title">Standings • {group.gender} • {group.class}</div>
          <div className="muted" style={{ marginBottom: 8 }}>Sorted by total points (Run 1 + Run 2)</div>
          <table className="table" style={{ width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Place</th>
                <th style={{ width: 70 }}>Bib</th>
                <th style={{ width: 220 }}>Name</th>
                <th style={{ width: 140 }}>Team</th>
                <th style={{ width: 150 }}>Gender / Class</th>
                <th style={{ width: 160 }}>Run 1</th>
                <th style={{ width: 160 }}>Run 2</th>
                <th style={{ width: 110 }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {group.entries.reduce<{ entry: RaceResultEntry; place: number }[]>((acc, entry, idx, arr) => {
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
      {entries && entries.length > 0 && groups.length === 0 && (
        <div className="card">
          <div className="title">Standings</div>
          <div className="muted" style={{ marginBottom: 8 }}>Sorted by total points (Run 1 + Run 2)</div>
          <div className="muted">No grouping information returned.</div>
        </div>
      )}
      {teamScores.length > 0 && (
        <>
          {renderTeamScores("Female")}
          {renderTeamScores("Male")}
        </>
      )}
    </section>
  );
}
