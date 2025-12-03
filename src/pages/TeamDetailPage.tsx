import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Gender, Racer, RacerClass, Team } from "../models";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";
import Modal from "../components/Modal";

type Draft = {
  racerId?: string;
  name: string;
  gender: Gender;
  class: RacerClass;
};

const emptyDraft = (genders: Gender[], classes: RacerClass[]): Draft => ({
  name: "",
  gender: genders[0],
  class: classes[0],
});

export default function TeamDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const genders = api.genders();
  const classes = api.classes();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toRemoveId, setToRemoveId] = useState<string | null>(null);
  const [toRemoveName, setToRemoveName] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>(emptyDraft(genders, classes));
  const [highlightTick, setHighlightTick] = useState(0);
  const [highlightActive, setHighlightActive] = useState(false);
  const [filterGender, setFilterGender] = useState<Gender | "All">("All");

  useEffect(() => {
    if (!highlightTick) return;
    setHighlightActive(true);
    const t = setTimeout(() => setHighlightActive(false), 1200);
    return () => clearTimeout(t);
  }, [highlightTick]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        const t = await api.getTeamById(teamId!);
        if (!t) throw new Error("Team not found");
        // If coach, enforce visibility
        if (user.role === "COACH" && !user.teamIds.includes(t.teamId)) {
          throw new Error("Not authorized to view this team");
        }
        setTeam(t);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load team");
      }
    })();
  }, [teamId, user, navigate]);

  const visibleRacers = useMemo(() => {
    if (!team) return [];
    return team.racers
      .filter(r => (filterGender === "All" ? true : r.gender === filterGender))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [team, filterGender]);

  const startEdit = (r: Racer) => {
    setDraft({ racerId: r.racerId, name: r.name, gender: r.gender, class: r.class });
    setHighlightTick(t => t + 1);
  };

  const resetDraft = () => setDraft(emptyDraft(genders, classes));

  const submitDraft = async () => {
    if (!team) return;
    setErr(null);
    try {
      if (draft.racerId) {
        const updated = await api.updateRacer(team.teamId, draft.racerId, {
          name: draft.name.trim(),
          gender: draft.gender,
          class: draft.class,
        });
        setTeam({ ...team, racers: team.racers.map(r => (r.racerId === updated.racerId ? updated : r)) });
      } else {
        const created = await api.addRacer(team.teamId, {
          name: draft.name.trim(),
          gender: draft.gender,
          class: draft.class,
        });
        setTeam({ ...team, racers: [...team.racers, created] });
      }
      resetDraft();
    } catch (e: any) {
      setErr(e.message ?? "Failed to save racer");
    }
  };

  const askRemove = (r: Racer) => {
    setToRemoveId(r.racerId);
    setToRemoveName(r.name);
    setConfirmOpen(true);
  };


  const doRemove = async () => {
    if (!team || !toRemoveId) return;
    setErr(null);
    try {
      await api.removeRacer(team.teamId, toRemoveId);
      setTeam({ ...team, racers: team.racers.filter(r => r.racerId !== toRemoveId) });
      if (draft.racerId === toRemoveId) resetDraft();
    } catch (e: any) {
      setErr(e.message ?? "Failed to remove racer");
    } finally {
      setConfirmOpen(false);
      setToRemoveId(null);
      setToRemoveName(null);
    }
  };

  if (err) return <section className="card error">{err}</section>;
  if (!team) return <section className="card">Loading…</section>;

  return (
    <section>
      <h1>{team.name}</h1>

      <div className="toolbar">
        <label>
          Filter by gender:
          <select value={filterGender} onChange={e => setFilterGender(e.target.value as any)}>
            <option value="All">All</option>
            {api.genders().map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid">
        <div className={`card ${highlightActive ? "flash-highlight" : ""}`}>
          <h2>{draft.racerId ? "Edit Racer" : "Add Racer"}</h2>
          <div className="form">
            <label>
              Name
              <input
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="Full name"
              />
            </label>
            <label>
              Gender
              <select
                value={draft.gender}
                onChange={e => setDraft({ ...draft, gender: e.target.value as Gender })}
              >
                {api.genders().map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>
              Class
              <select
                value={draft.class}
                onChange={e => setDraft({ ...draft, class: e.target.value as RacerClass })}
              >
                {api.classes().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="row">
              <button onClick={submitDraft} disabled={!draft.name.trim()}>
                {draft.racerId ? "Save Changes" : "Add Racer"}
              </button>
              {draft.racerId && (
                <button className="secondary" onClick={resetDraft}>
                  Cancel
                </button>
              )}
            </div>
            
          </div>
        </div>

        <div className="card">
          <h2>Racers ({visibleRacers.length})</h2>
          {visibleRacers.length === 0 ? (
            <div className="muted">No racers.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Class</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRacers.map(r => (
                  <tr key={r.racerId}>
                    <td>{r.name}</td>
                    <td>{r.gender}</td>
                    <td>{r.class}</td>
                    <td className="right">
                      <button className="secondary" onClick={() => startEdit(r)}>Edit</button>
                      
                      <button className="danger" onClick={() => askRemove(r)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Modal
        open={confirmOpen}
        title="Remove Racer?"
        onClose={() => { setConfirmOpen(false); setToRemoveId(null); setToRemoveName(null); }}
        showDefaultFooter={false} // 👈 hide the built-in OK button
      >
        <p style={{ marginTop: 0 }}>
          Are you sure you want to remove <b>{toRemoveName}</b> from <b>{team?.name}</b>?
        </p>
        <p className="muted small" style={{ marginBottom: 0 }}>
          This also removes them from any race rosters for this team.
        </p>
        <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button className="secondary" onClick={() => { setConfirmOpen(false); setToRemoveId(null); setToRemoveName(null); }}>
            Cancel
          </button>
          <button className="danger" onClick={doRemove}>Remove</button>
        </div>
      </Modal>
    </section>
  );
}
