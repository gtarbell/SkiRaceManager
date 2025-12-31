import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Race, RaceType, Team } from "../models";
import { api } from "../services/api";
import Modal from "../components/Modal";

export default function RacesPage() {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[] | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [startListReady, setStartListReady] = useState<Record<string, boolean>>({});
  const [raceSaving, setRaceSaving] = useState<Record<string, boolean>>({});
  const raceTypes: RaceType[] = ["Slalom", "Giant Slalom"];
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; location: string; date: string; type: RaceType } | null>(null);

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
        setErr(null);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load races");
      }
    })();
  }, [user]);

  async function updateRace(
    race: Race,
    patch: Partial<Pick<Race, "locked" | "independent" | "name" | "location" | "date" | "type">>
  ): Promise<boolean> {
    if (!user) return false;
    setActionError(null);
    setRaceSaving(s => ({ ...s, [race.raceId]: true }));
    try {
      const updated = await api.updateRace(user, race.raceId, patch);
      setRaces(prev => prev ? prev.map(r => r.raceId === race.raceId ? { ...r, ...updated } : r) : prev);
      return true;
    } catch (e: any) {
      setActionError(e.message ?? "Failed to update race");
      return false;
    } finally {
      setRaceSaving(s => ({ ...s, [race.raceId]: false }));
    }
  }

  const beginEdit = (race: Race) => {
    setActionError(null);
    setEditingRace(race);
    setEditDraft({
      name: race.name,
      location: race.location,
      date: (race.date || "").split("T")[0],
      type: race.type,
    });
  };

  const closeEdit = () => {
    setEditingRace(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!user || !editingRace || !editDraft) return;
    const ok = await updateRace(editingRace, {
      name: editDraft.name.trim(),
      location: editDraft.location.trim(),
      date: editDraft.date,
      type: editDraft.type,
    });
    if (ok) closeEdit();
  };

  const editSaving = editingRace ? !!raceSaving[editingRace.raceId] : false;
  const editValid = !!(
    editDraft &&
    editDraft.name.trim() &&
    editDraft.location.trim() &&
    editDraft.date &&
    editDraft.type
  );

  if (!races && err) return <section className="card error">{err}</section>;
  if (!races) return <section className="card">Loading…</section>;

  return (
    <section>
      <h1>Races</h1>
      {actionError && (
        <div className="card error" style={{ marginBottom: 12 }}>{actionError}</div>
      )}
      <ul className="list">
        {races.map(r => (
          <li key={r.raceId} className="list-item">
            <div>
              <div className="title">{r.name}  <span className={`badge small ${r.locked ? "warn" : "ok"}`} title={r.locked ? "Roster locked" : "Roster open"}>
                  {/* {r.locked ? "Locked" : "Open"} */}
                </span></div>
              <div className="muted">{r.type} • {r.location} • {new Date(r.date).toLocaleDateString()}</div>
              {r.independent && (
                <div className="muted small">Independent race — excluded from season standings.</div>
              )}
              <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 6 }}>
                {user && user.role === "ADMIN" && (
                  <button
                    className="secondary"
                    onClick={() => beginEdit(r)}
                    disabled={!!raceSaving[r.raceId]}
                  >
                    Edit race info
                  </button>
                )}
                {user && user.role === "ADMIN" && (
                  <button
                    className="secondary"
                    onClick={() => updateRace(r, { locked: !r.locked })}
                    disabled={!!raceSaving[r.raceId]}
                  >
                    {raceSaving[r.raceId] ? "Saving…" : r.locked ? "Unlock roster" : "Lock roster"}
                  </button>
                )}
                {user && user.role === "ADMIN" && (
                  <button
                    className="secondary"
                    onClick={() => updateRace(r, { independent: !r.independent })}
                    disabled={!!raceSaving[r.raceId]}
                    title="Independent races do not count toward season standings."
                  >
                    {raceSaving[r.raceId] ? "Saving…" : r.independent ? "Mark as counting race" : "Mark independent"}
                  </button>

                )}

                {user && user.role === "ADMIN" && (
                  <div>
                      <Link to={`/races/${r.raceId}/start-list`}>Create Start List</Link>  •  
                      <Link to={`/races/${r.raceId}/results`}> Upload Results</Link>
                    </div>

                )}
              </div>

                <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  
                  {startListReady[r.raceId] && (
                    <>
                      <span className="row" style={{ gap: 4, alignItems: "center" }}>
                        <Link to={`/public/races/${r.raceId}/start-list`}>Start List</Link>
                        
                      </span>
                      <span> • </span>
                      <span className="row" style={{ gap: 6, alignItems: "center" }}>
                        <Link to={`/public/races/${r.raceId}/start-list/teams`}>Start List by Team</Link>
                        
                      </span>
                      <span> • </span>
                      <span className="row" style={{ gap: 6, alignItems: "center" }}>
                        <Link to={`/public/races/${r.raceId}/results`}>Race Results</Link>
                      </span>
                      {!r.independent && (
                      <>
                        <span> • </span>
                        <span className="row" style={{ gap: 6, alignItems: "center" }}>
                          <Link to={`/public/season-results`}>Season Results</Link>
                        </span>
                      </>
                      )}
                      
                    </>
                 )}
                </div>


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
                    {r.locked && <span className="badge warn" title="Rosters are locked for this race"></span>}
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
      {user && user.role === "ADMIN" && editingRace && editDraft && (
        <Modal
          open={true}
          title={`Edit ${editingRace.name}`}
          onClose={closeEdit}
          showDefaultFooter={false}
        >
          {actionError && (
            <p style={{ color: "#b00020", marginTop: 0 }}>{actionError}</p>
          )}
          <div className="form">
            <label>
              Race name
              <input
                value={editDraft.name}
                onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={editDraft.date}
                onChange={e => setEditDraft({ ...editDraft, date: e.target.value })}
              />
            </label>
            <label>
              Location
              <input
                value={editDraft.location}
                onChange={e => setEditDraft({ ...editDraft, location: e.target.value })}
              />
            </label>
            <label>
              Discipline
              <select
                value={editDraft.type}
                onChange={e => setEditDraft({ ...editDraft, type: e.target.value as RaceType })}
              >
                {raceTypes.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button className="secondary" onClick={closeEdit} disabled={editSaving}>Cancel</button>
            <button onClick={saveEdit} disabled={!editValid || editSaving}>
              {editSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
