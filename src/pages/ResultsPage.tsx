import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RaceResultEntry, RaceResultGroup } from "../models";
import { api } from "../services/api";

function fmtTime(sec?: number) {
  if (sec === undefined) return "—";
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
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!raceId || !user) return;
    (async () => {
      try {
        const res = await api.getResults(user, raceId);
        setEntries(res.entries);
        setGroups(res.groups ?? []);
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
      setIssues(res.issues);
    } catch (error: any) {
      setErr(error.message || "Failed to upload results");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1>Race Results</h1>
        <Link to={`/races/${raceId}/start-list`}>Back to Start List</Link>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p>Upload a .NatFIS file for this race. Bibs are matched to the start list; mismatched names are reported.</p>
        <input type="file" accept=".NatFIS,.xml,text/xml" onChange={onFile} disabled={busy} />
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
    </section>
  );
}
