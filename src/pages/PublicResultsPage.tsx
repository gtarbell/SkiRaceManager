import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Race, RaceResultGroup } from "../models";
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

export default function PublicResultsPage() {
  const { raceId } = useParams();
  const [groups, setGroups] = useState<RaceResultGroup[]>([]);
  const [race, setRace] = useState<Race | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (e: any) {
        setErr(e.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [raceId]);

  if (!raceId) return <section className="card error">Race not specified.</section>;
  if (loading) return <section className="card">Loading results…</section>;
  if (err) return <section className="card error">{err}</section>;
  if (!groups.length) return <section className="card">No results posted yet.</section>;

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Race Results</h1>
          {race && (
            <div className="muted">
              {race.name} • {race.location} • {new Date(race.date).toLocaleDateString()} • {race.type}
            </div>
          )}
        </div>
        <Link to="/">Back</Link>
      </div>
      {groups.map(group => (
        <div className="card" key={`${group.gender}-${group.class}`}>
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
    </section>
  );
}
