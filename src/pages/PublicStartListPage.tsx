import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { Race, StartListEntry } from "../models";

export default function PublicStartListPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [list, setList] = useState<StartListEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!raceId) throw new Error("Race not specified");
        const [r, start] = await Promise.all([
          api.getRace(raceId),
          api.getStartListPublic(raceId),
        ]);
        if (!r) throw new Error("Race not found");
        setRace(r);
        setList((start.entries ?? start).slice().sort((a, b) => a.bib - b.bib));
      } catch (e: any) {
        setErr(e.message ?? "Failed to load start list");
      }
    })();
  }, [raceId]);

  const byGender = useMemo(() => {
    const women = list.filter(e => e.gender === "Female").sort((a, b) => a.bib - b.bib);
    const men = list.filter(e => e.gender === "Male").sort((a, b) => a.bib - b.bib);
    return { women, men };
  }, [list]);

  if (err) return <section className="card error">{err}</section>;
  if (!race) return <section className="card">Loading…</section>;

  const Section = ({ title, entries }: { title: string; entries: StartListEntry[] }) => {
    const mid = Math.ceil(entries.length / 2);
    const cols = [entries.slice(0, mid), entries.slice(mid)];
    return (
      <div className="card print-plain" style={{ marginBottom: 16 }}>
        
        {entries.length === 0 ? (
          <div className="muted">No racers.</div>
        ) : (
          <div className="startlist-columns">
            {cols.map((col, idx) => (
              <div key={idx} className="startlist-col">
                {col.map(e => (
                  <div key={e.bib} className="startlist-card">
                    <div className="startlist-bib">{e.bib}</div>
                    
                      <div className="startlist-name">{e.racerName}</div>
                      <div className="muted small">{e.teamName} • {e.class}</div>
                    
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <span className="small">Female • {race.name} • {race.type} • {race.location} • {new Date(race.date).toLocaleDateString()}</span>
        </div>
        <button className="secondary" onClick={() => window.print()}>Print</button>
      </div>

      <Section title="Female" entries={byGender.women} />
      <div className="page-break" aria-hidden />
      <span className="muted medium">Male • {race.name} • {race.type} • {race.location} • {new Date(race.date).toLocaleDateString()}</span>
      <Section title="Male" entries={byGender.men} />
    </section>
  );
}
