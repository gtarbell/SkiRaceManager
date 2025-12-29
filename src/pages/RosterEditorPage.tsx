import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Gender, Racer, RacerClass, Race, RosterEntry, Team } from "../models";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";

import Modal from "../components/Modal";

export default function RosterEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { raceId, teamId } = useParams<{ raceId: string; teamId: string }>();

  const [race, setRace] = useState<Race | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [eligible, setEligible] = useState<Racer[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [genderTab, setGenderTab] = useState<Gender>("Male");
  const [err, setErr] = useState<string | null>(null);
  const [showErr, setShowErr] = useState(false);
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  const [copyFromRaceId, setCopyFromRaceId] = useState<string>("");
  const [eligibleClassFilter, setEligibleClassFilter] = useState<RacerClass | "All">("All");

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          navigate("/");
          return;
        }
        const [r, t, elig, ros, races] = await Promise.all([
          api.getRace(raceId!),
          api.getTeamById(teamId!),
          api.eligibleRacers(user, teamId!),
          api.getRoster(user, raceId!, teamId!),
          api.listRaces(),
        ]);
        if (!r) throw new Error("Race not found");
        if (!t) throw new Error("Team not found");
        // auth checked inside eligible/getRoster
        setRace(r); setTeam(t); setEligible(elig); setRoster(ros);
        setAllRaces(races);
        const firstOther = races.find(x => x.raceId !== raceId);
        setCopyFromRaceId(firstOther?.raceId ?? "");
      } catch (e: any) {
        setErr(e.message ?? "Failed to load roster editor");
        setShowErr(true);
      }
    })();
  }, [user, raceId, teamId, navigate]);

  const genders: Gender[] = api.genders();
  const classes: RacerClass[] = api.classes();
  const racerById = (id: string) => team?.racers.find(r => r.racerId === id);

  const eligByGender = useMemo(() => {
    const setSelected = new Set(roster.map(r => r.racerId));
    const classFilter = eligibleClassFilter;
    return genders.reduce<Record<Gender, Racer[]>>((acc, g) => {
      acc[g] = eligible
        .filter(r => r.gender === g && !setSelected.has(r.racerId))
        .filter(r => classFilter === "All" ? true : r.class === classFilter)
        .sort((a,b)=>a.name.localeCompare(b.name));
      return acc;
    }, {} as any);
  }, [genders, eligible, roster, eligibleClassFilter]);

  const view = useMemo(() => {
    const normalizeClass = (cls: RosterEntry["class"]): RacerClass =>
      cls === "DNS - Did Not Start" || (cls as any) === "DNS" ? "DNS - Did Not Start" : cls;
    const byClass: Record<RacerClass, RosterEntry[]> = classes.reduce((acc, cls) => {
      acc[cls] = [];
      return acc;
    }, {} as Record<RacerClass, RosterEntry[]>);
    roster.filter(e => e.gender === genderTab)
          .forEach(e => {
            const cls = normalizeClass(e.class);
            byClass[cls] = byClass[cls] || [];
            byClass[cls].push({ ...e, class: cls });
          });
    for (const k of Object.keys(byClass) as RacerClass[]) {
      byClass[k].sort((a,b)=>(a.startOrder ?? Infinity) - (b.startOrder ?? Infinity));
    }
    const counts = {
      varsity: byClass["Varsity"].length,
      valt: byClass["Varsity Alternate"].length,
    };
    return { byClass, counts };
  }, [classes, roster, genderTab]);

  const editingLocked = !!race?.locked;
  const lockMessage = "Roster is locked for this race. Unlock it from the Races page to make changes.";

  async function add(racer: Racer, desired?: RacerClass) {
    if (!user || !race) return;
    if (editingLocked) { setErr(lockMessage); setShowErr(true); return; }
    setErr(null);
    try {
      const updated = await api.addToRoster(user, raceId!, teamId!, racer, desired);
      if (!Array.isArray(updated)) throw new Error("Unexpected roster response");
      setRoster(updated);
    } catch (e: any) { setErr(e.message ?? "Failed to add"); setShowErr(true);}
  }
  async function remove(racerId: string) {
    if (!user || !race) return;
    if (editingLocked) { setErr(lockMessage); setShowErr(true); return; }
    setErr(null);
    try {
      const updated = await api.removeFromRoster(user, raceId!, teamId!, racerId);
      setRoster(updated);
    } catch (e: any) { setErr(e.message ?? "Failed to remove"); setShowErr(true);}
  }
  async function copyFromOtherRace() {
    if (!user || !race) return;
    if (editingLocked) { setErr(lockMessage); setShowErr(true); return; }
    if (!copyFromRaceId) return;
    if (roster.length > 0) {
      const ok = window.confirm("Copying will discard current roster entries for this race. Continue?");
      if (!ok) return;
    }
    try {
      const updated = await api.copyRosterFromRace(user, copyFromRaceId, raceId!, teamId!);
      setRoster(updated);
      setErr(`Roster copied from "${allRaces.find(r => r.raceId === copyFromRaceId)?.name}". ` +
             `Caps and Provisional locks were enforced.`);
      setShowErr(true);
    } catch (e: any) {
      setErr(e.message ?? "Failed to copy roster");
      setShowErr(true);
    }
  }
  async function changeClass(racerId: string, newClass: RacerClass) {
    if (!user || !race) return;
    if (editingLocked) { setErr(lockMessage); setShowErr(true); return; }
    setErr(null);
    try {
      await api.updateEntryClass(user, raceId!, teamId!, racerId, newClass);
      var newroster = await api.getRoster(user, raceId!, teamId!);
      setRoster(newroster);
    } catch (e: any) { setErr(e.message ?? "Failed to update class"); setShowErr(true);}
  }
  async function move(racerId: string, dir: "up" | "down") {
    if (!user || !race) return;
    if (editingLocked) { setErr(lockMessage); setShowErr(true); return; }
    setErr(null);
    try {
      await api.moveEntry(user, raceId!, teamId!, racerId, dir);
      var newroster = await api.getRoster(user, raceId!, teamId!);
      setRoster(newroster);
    } catch (e: any) { setErr(e.message ?? "Failed to reorder"); setShowErr(true);}
  }

  if (!race || !team) return <section className="card">Loading…</section>;

  return (
    <section>
      <div className="row" style={{justifyContent:"space-between", alignItems:"baseline"}}>
        <h1>{race.name} — {team.name}</h1>
        <Link to="/races" className="secondary">Back to Races</Link>
      </div>
      <p className="muted">{race.type} • {race.location} • {new Date(race.date).toLocaleDateString()}</p>
      {race.locked && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="title" style={{ marginBottom: 4 }}>Roster locked</div>
          <div className="muted small">Unlock this race from the Races page to edit entries.</div>
        </div>
      )}

      
      <div className="card" style={{marginBottom:16, width:400}}>
  <div className="row" style={{justifyContent:"space-between", alignItems:"end", gap:12}}>
    <div>
      <div className="muted small" style={{paddingBottom: 8}}>Copy roster from another race</div>
      <label>
        <select
          value={copyFromRaceId}
          onChange={e => setCopyFromRaceId(e.target.value)}
          style={{ marginLeft: 8 , paddingBottom: 8}}
        >
          <option value="" disabled>
            {allRaces.length ? "Select race…" : "No races available"}
          </option>
          {allRaces.filter(r => r.raceId !== raceId).map(r => (
            <option key={r.raceId} value={r.raceId}>
              {r.name} — {new Date(r.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>
    <div style={{paddingTop:8}}>
    <button
      style={{ marginLeft: 8}}
      onClick={copyFromOtherRace}
      disabled={!copyFromRaceId || editingLocked}
      title={
        !copyFromRaceId
          ? "Select a source race first"
          : editingLocked
            ? lockMessage
            : "Copy roster"
      }
    >
      Copy Roster
      </button>
      </div>
    </div>
  </div>
</div>
 <div className="tabs" style={{marginTop:25, paddingTop:10, borderTop: "thick double #32a1ce"}}>
        {genders.map(g => (
          <button key={g} className={g===genderTab ? "" : "secondary"} onClick={()=>setGenderTab(g)}>{g}</button>
        ))}
      </div>

      <div className="grid">
        {/* Eligible pool */}
        <div className="card">
          <div className="row" style={{justifyContent:"space-between", alignItems:"center", gap:12}}>
            <h2 style={{marginBottom:0}}>Eligible Racers ({eligByGender[genderTab]?.length ?? 0})</h2>
            <label className="muted small" style={{display:"flex", alignItems:"center", gap:6}}>
              Filter by class:
              <select
                value={eligibleClassFilter}
                onChange={e => setEligibleClassFilter(e.target.value as RacerClass | "All")}
              >
                <option value="All">All</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          {eligByGender[genderTab]?.length ? (
            <ul className="list">
              {eligByGender[genderTab].map(r => {
                const dnsButton = (
                  <button
                    className="secondary"
                    onClick={() => add(r, "DNS - Did Not Start")}
                    disabled={editingLocked}
                    title={editingLocked ? lockMessage : undefined}
                  >
                    Add DNS
                  </button>
                );
                if (r.class === "Provisional") {
                  return (
                    <li key={r.racerId} className="list-item">
                      <div>
                        <div className="title">{r.name}</div>
                        <div className="muted small">{r.gender} • Baseline {r.class}</div>
                      </div>
                      <div className="row">
                        <button
                          onClick={() => add(r, "Provisional")}
                          disabled={editingLocked}
                          title={editingLocked ? lockMessage : undefined}
                        >
                          Add Provisional
                        </button>
                        {dnsButton}
                      </div>
                    </li>
                  );
                }

                // Decide which button should be primary based on baseline class
                const primary = r.class; // "Varsity" | "Varsity Alternate" | "Jr Varsity"

                const btn = (label: string, desired: RacerClass, isPrimary: boolean) => (
                  <button
                    className={isPrimary ? undefined : "secondary"}
                    onClick={() => add(r, desired)}
                    disabled={editingLocked}
                    title={editingLocked ? lockMessage : undefined}
                  >
                    {label}
                  </button>
                );

                return (
                  <li key={r.racerId} className="list-item">
                    <div>
                      <div className="title">{r.name}</div>
                      <div className="muted small">{r.gender} • Baseline {r.class}</div>
                    </div>
                    <div className="row">
                      {btn("Add Varsity", "Varsity", primary === "Varsity")}
                      {btn("Add VA", "Varsity Alternate", primary === "Varsity Alternate")}
                      {btn("Add JV", "Jr Varsity", primary === "Jr Varsity")}
                      {dnsButton}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (<div className="muted">No available racers for {genderTab}.</div>)}
        </div>

        {/* Roster editor */}
        <div className="card">
          <h2>Roster — {genderTab}</h2>
          <div className="muted small" style={{marginBottom:8}}>
            Caps per gender: <b>Varsity ≤ 5</b>, <b>Varsity Alternate ≤ 1</b>. Provisional class is fixed. DNS entries are excluded from start order and bibs.
          </div>

          {classes.map(c => (
            <div key={c} style={{marginBottom:16}}>
              <h3 style={{margin:"12px 0 8px"}}>{c}</h3>
              {view.byClass[c].length === 0 ? (
                <div className="muted small">No racers.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{width:44}}>#</th>
                      <th>Name</th>
                      <th style={{width:210}}>Class</th>
                      <th style={{width:150}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.byClass[c].map((e, idx) => {
                      const racer = racerById(e.racerId);
                      const isProvBaseline = racer?.class === "Provisional";
                      const isDns = e.class === "DNS - Did Not Start" || (e.class as any) === "DNS";
                      const isVaOrJv = e.class === "Varsity Alternate" || e.class === "Jr Varsity";
                      const showUp = !isDns && (isVaOrJv || (e.startOrder ?? 0) > 1);
                      const isLastJv = e.class === "Jr Varsity" && idx === view.byClass[c].length - 1;
                      const isLastProv = e.class === "Provisional" && idx === view.byClass[c].length - 1;
                      const showDown = !isDns && !isLastJv && !isLastProv;
                      const options: RacerClass[] = isProvBaseline
                        ? (["Provisional", "DNS - Did Not Start"] as RacerClass[])
                        : (["Varsity", "Varsity Alternate", "Jr Varsity", "DNS - Did Not Start"] as RacerClass[]);
                      return (
                        <tr key={e.racerId}>
                          <td>{isDns ? "—" : e.startOrder}</td>
                          <td>{racer?.name ?? e.racerId}</td>
                          <td>
                          <select
                            value={isDns ? "DNS - Did Not Start" : e.class}
                            onChange={ev => changeClass(e.racerId, ev.target.value as RacerClass)}
                            disabled={editingLocked}
                            title={editingLocked ? lockMessage : undefined}
                          >
                              {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="right">
                            <div className="row" style={{justifyContent:"flex-end"}}>
                              {showUp && (
                                <button
                                  className="secondary"
                                  onClick={() => move(e.racerId, "up")}
                                  disabled={editingLocked}
                                  title={editingLocked ? lockMessage : undefined}
                                >↑</button>
                              )}
                              {showDown && (
                                <button
                                  className="secondary"
                                  onClick={() => move(e.racerId, "down")}
                                  disabled={editingLocked}
                                  title={editingLocked ? lockMessage : undefined}
                                >↓</button>
                              )}
                              <button
                                className="danger"
                                onClick={() => remove(e.racerId)}
                                disabled={editingLocked}
                                title={editingLocked ? lockMessage : undefined}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}

        </div>
      </div>
      <Modal
        open={showErr}
        title="Roster Notice"
        onClose={() => setShowErr(false)}
        >
        <p style={{margin:0}}>{err}</p>
      </Modal>
    </section>
  );
}
