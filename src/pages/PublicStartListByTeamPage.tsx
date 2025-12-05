import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Race, StartListEntry } from "../models";

export default function PublicStartListByTeamPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [entries, setEntries] = useState<StartListEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!raceId) throw new Error("Race not specified");
        const [r, list] = await Promise.all([
          api.getRace(raceId),
          api.getStartListPublic(raceId),
        ]);
        if (!r) throw new Error("Race not found");
        setRace(r);
        setEntries((list.entries ?? list).slice().sort((a, b) => a.bib - b.bib));
      } catch (e: any) {
        setErr(e.message ?? "Failed to load start list");
      }
    })();
  }, [raceId]);

  const grouped = useMemo(() => {
    const byTeam: Record<string, StartListEntry[]> = {};
    for (const e of entries) {
      byTeam[e.teamId] = byTeam[e.teamId] || [];
      byTeam[e.teamId].push(e);
    }
    return Object.entries(byTeam)
      .map(([teamId, list]) => ({
        teamId,
        teamName: list[0]?.teamName || teamId,
        entries: list.slice().sort((a, b) => a.bib - b.bib),
      }))
      .sort((a, b) => a.entries.length - b.entries.length || a.teamName.localeCompare(b.teamName));
  }, [entries]);

  if (err) return <section className="card error">{err}</section>;
  if (!race) return <section className="card">Loading…</section>;

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          
          <span className="muted medium">{race.type} • {race.location} • {new Date(race.date).toLocaleDateString()}</span>
        </div>
        <button className="secondary" onClick={() => window.print()}>Print</button>
      </div>
     
      {grouped.length === 0 ? (
        <div className="card print-plain">
          <div className="muted">No start list entries.</div>
        </div>
      ) : (
        <div className="team-grid three-col">
          {grouped.map((g) => (
            <div key={g.teamId} className="card print-plain" style={{ marginBottom: 0 }}>
              <div style={{ marginTop: 0, marginBottom: 2 }}>{g.teamName}</div>
              <div className="startlist-columns">
                <div className="startlist-col">
                  {g.entries.map(e => (
                    <div key={e.bib} className="startlist-card">
                      <div className="startlist-bib">{e.bib}</div>
                      
                        <div className="startlist-name">{e.racerName}</div>
                        {/* <div className="muted small">{e.class}</div> */}
                      
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
