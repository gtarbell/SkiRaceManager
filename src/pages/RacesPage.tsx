import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Race, Team } from "../models";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";

export default function RacesPage() {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[] | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [startListReady, setStartListReady] = useState<Record<string, boolean>>({});
  const [lockSaving, setLockSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const [rs, ts] = await Promise.all([api.listRaces(), user ? api.getTeamsForUser(user) : Promise.resolve([])]);
        setRaces(rs);
        setTeams(ts);
        // quick check if start list exists (no auth for public)
        const readiness: Record<string, boolean> = {};
        for (const r of rs) {
          try {
            const sl = await api.getStartListPublic(r.raceId);
            readiness[r.raceId] = Array.isArray(sl) ? sl.length > 0 : (sl.entries?.length ?? 0) > 0;
          } catch {
            readiness[r.raceId] = false;
          }
        }
        setStartListReady(readiness);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load races");
      }
    })();
  }, [user]);

  async function updateLock(race: Race, locked: boolean) {
    if (!user) return;
    setErr(null);
    setLockSaving(s => ({ ...s, [race.raceId]: true }));
    try {
      const updated = await api.setRaceLock(user, race.raceId, locked);
      setRaces(prev => prev ? prev.map(r => r.raceId === race.raceId ? { ...r, locked: updated.locked } : r) : prev);
    } catch (e: any) {
      setErr(e.message ?? "Failed to update lock");
    } finally {
      setLockSaving(s => ({ ...s, [race.raceId]: false }));
    }
  }

  if (err) return <section className="card error">{err}</section>;
  if (!races) return <section className="card">Loading…</section>;

  return (
    <section>
      <h1>Races</h1>
      <ul className="list">
        {races.map(r => (
          <li key={r.raceId} className="list-item">
            <div>
              <div className="title">{r.name}</div>
              <div className="muted">{r.type} • {r.location} • {new Date(r.date).toLocaleDateString()}</div>
              <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 6 }}>
                <span className={`badge ${r.locked ? "warn" : "ok"}`} title={r.locked ? "Roster locked" : "Roster open"}>
                  {r.locked ? "Locked" : "Open"}
                </span>
                {user && user.role === "ADMIN" && (
                  <button
                    className="secondary"
                    onClick={() => updateLock(r, !r.locked)}
                    disabled={!!lockSaving[r.raceId]}
                  >
                    {lockSaving[r.raceId] ? "Saving…" : r.locked ? "Unlock roster" : "Lock roster"}
                  </button>
                )}
              </div>
              {user && user.role === "ADMIN" && (
                <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Link to={`/races/${r.raceId}/start-list`}>Start List (admin)</Link>
                  <Link to={`/races/${r.raceId}/results`}>Upload Results</Link>
                  {startListReady[r.raceId] && (
                    <>
                      <span className="row" style={{ gap: 4, alignItems: "center" }}>
                        <Link to={`/public/races/${r.raceId}/start-list`}>Public Start List</Link>
                        <button
                          className="icon-only"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/public/races/${r.raceId}/start-list`)}
                          title="Copy link"
                        >
                          🔗
                        </button>
                      </span>
                      <span className="row" style={{ gap: 6, alignItems: "center" }}>
                        <Link to={`/public/races/${r.raceId}/start-list/teams`}>Start List by Team</Link>
                        <button
                          className="icon-only"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/public/races/${r.raceId}/start-list/teams`)}
                          title="Copy link"
                        >
                          🔗
                        </button>
                      </span>
                      <span className="row" style={{ gap: 6, alignItems: "center" }}>
                        <Link to={`/public/races/${r.raceId}/results`}>Public Results</Link>
                        <button
                          className="icon-only"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/public/races/${r.raceId}/results`)}
                          title="Copy link"
                        >
                          🔗
                        </button>
                      </span>
                    </>
                  )}
                </div>
              )}

            </div>
            {user && teams && teams.length > 0 ? (
              <div className="row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                {teams.map(t => (
                  <div key={t.teamId} className="row" style={{ alignItems: "center", gap: 6 }}>
                    <Link
                      to={`/races/${r.raceId}/roster/${t.teamId}`}
                      className="secondary"
                    >
                      {r.locked ? `View ${t.name} Roster` : `Edit ${t.name} Roster`}
                    </Link>
                    {r.locked && <span className="badge warn" title="Rosters are locked for this race">Locked</span>}
                  </div>
                ))}
              </div>
            ) : (
              <span className="muted">Sign in to manage rosters</span>
            )}
          </li>
        ))}
      </ul>
      {user && user.role === "ADMIN" && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="title">Season Results</div>
              <div className="muted">View season-long standings by gender/class.</div>
            </div>
            <Link to="/public/season-results">Open</Link>
          </div>
        </div>
      )}
    </section>
  );
}
