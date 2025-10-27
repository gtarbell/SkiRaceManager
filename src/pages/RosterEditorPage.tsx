import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Gender, Racer, RacerClass, Race, RosterEntry, Team } from "../models";
import { mockApi } from "../services/mockApi";
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

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          navigate("/");
          return;
        }
        const [r, t, elig, ros, races] = await Promise.all([
          mockApi.getRace(raceId!),
          mockApi.getTeamById(teamId!),
          mockApi.eligibleRacers(user, teamId!),
          mockApi.getRoster(user, raceId!, teamId!),
          mockApi.listRaces(),
        ]);
        if (!r) throw new Error("Race not found");
        if (!t) throw new Error("Team not found");
        // auth checked inside eligible/getRoster
        setRace(r); setTeam(t); setEligible(elig); setRoster(ros);
        setAllRaces(races);
        const firstOther = races.find(x => x.id !== raceId);
        setCopyFromRaceId(firstOther?.id ?? "");
      } catch (e: any) {
        setErr(e.message ?? "Failed to load roster editor");
        setShowErr(true);
      }
    })();
  }, [user, raceId, teamId, navigate]);

  const genders: Gender[] = mockApi.genders();
  const classes: RacerClass[] = mockApi.classes();
  const racerById = (id: string) => team?.racers.find(r => r.id === id);

  const eligByGender = useMemo(() => {
    const setSelected = new Set(roster.map(r => r.racerId));
    return genders.reduce<Record<Gender, Racer[]>>((acc, g) => {
      acc[g] = eligible.filter(r => r.gender === g && !setSelected.has(r.id))
                       .sort((a,b)=>a.name.localeCompare(b.name));
      return acc;
    }, {} as any);
  }, [genders, eligible, roster]);

  const view = useMemo(() => {
    const byClass: Record<RacerClass, RosterEntry[]> = {
      "Varsity": [], "Varsity Alternate": [], "Jr Varsity": [], "Provisional": []
    };
    roster.filter(e => e.gender === genderTab)
          .forEach(e => byClass[e.class].push(e));
    for (const k of Object.keys(byClass) as RacerClass[]) {
      byClass[k].sort((a,b)=>a.startOrder - b.startOrder);
    }
    const counts = {
      varsity: byClass["Varsity"].length,
      valt: byClass["Varsity Alternate"].length,
    };
    return { byClass, counts };
  }, [roster, genderTab]);

  async function add(racer: Racer, desired?: RacerClass) {
    if (!user) return;
    setErr(null);
    try {
      const updated = await mockApi.addToRoster(user, raceId!, teamId!, racer.id, desired);
      setRoster(updated);
    } catch (e: any) { setErr(e.message ?? "Failed to add"); setShowErr(true);}
  }
  async function remove(racerId: string) {
    if (!user) return;
    setErr(null);
    try {
      const updated = await mockApi.removeFromRoster(user, raceId!, teamId!, racerId);
      setRoster(updated);
    } catch (e: any) { setErr(e.message ?? "Failed to remove"); setShowErr(true);}
  }
  async function copyFromOtherRace() {
  if (!user) return;
  if (!copyFromRaceId) return;
  try {
    const updated = await mockApi.copyRosterFromRace(user, copyFromRaceId, raceId!, teamId!);
    setRoster(updated);
    setErr(`Roster copied from "${allRaces.find(r => r.id === copyFromRaceId)?.name}". ` +
           `Caps and Provisional locks were enforced.`);
    setShowErr(true);
  } catch (e: any) {
    setErr(e.message ?? "Failed to copy roster");
    setShowErr(true);
  }
}
  async function changeClass(racerId: string, newClass: RacerClass) {
    if (!user) return;
    setErr(null);
    try {
      const updated = await mockApi.updateEntryClass(user, raceId!, teamId!, racerId, newClass);
      setRoster(updated);
    } catch (e: any) { setErr(e.message ?? "Failed to update class"); setShowErr(true);}
  }
  async function move(racerId: string, dir: "up" | "down") {
    if (!user) return;
    setErr(null);
    try {
      const updated = await mockApi.moveEntry(user, raceId!, teamId!, racerId, dir);
      setRoster(updated);
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

       <div className="tabs">
        {genders.map(g => (
          <button key={g} className={g===genderTab ? "" : "secondary"} onClick={()=>setGenderTab(g)}>{g}</button>
        ))}
      </div>
      <div className="card" style={{marginBottom:16}}>
  <div className="row" style={{justifyContent:"space-between", alignItems:"end", gap:12}}>
    <div>
      <div className="muted small">Copy roster from another race</div>
      <label>
        <span className="muted small">Source race</span>
        <select
          value={copyFromRaceId}
          onChange={e => setCopyFromRaceId(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="" disabled>
            {allRaces.length ? "Select race…" : "No races available"}
          </option>
          {allRaces.filter(r => r.id !== raceId).map(r => (
            <option key={r.id} value={r.id}>
              {r.name} — {new Date(r.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>
    </div>
    <button
      onClick={copyFromOtherRace}
      disabled={!copyFromRaceId}
      title={!copyFromRaceId ? "Select a source race first" : "Copy roster"}
    >
      Copy Roster
    </button>
  </div>
</div>


      <div className="grid">
        {/* Eligible pool */}
        <div className="card">
          <h2>Eligible Racers ({eligByGender[genderTab]?.length ?? 0})</h2>
          {eligByGender[genderTab]?.length ? (
             <ul className="list">
            {eligByGender[genderTab].map(r => {
                if (r.class === "Provisional") {
                // Provisional stays as a single primary action
                return (
                    <li key={r.id} className="list-item">
                    <div>
                        <div className="title">{r.name}</div>
                        <div className="muted small">{r.gender} • Baseline {r.class}</div>
                    </div>
                    <div className="row">
                        <button onClick={() => add(r, "Provisional")}>Add Provisional</button>
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
                >
                    {label}
                </button>
                );

                return (
                <li key={r.id} className="list-item">
                    <div>
                    <div className="title">{r.name}</div>
                    <div className="muted small">{r.gender} • Baseline {r.class}</div>
                    </div>
                    <div className="row">                    
                    {btn("Add Varsity", "Varsity", primary === "Varsity")}
                    {btn("Add VA", "Varsity Alternate", primary === "Varsity Alternate")}
                    {btn("Add JV", "Jr Varsity", primary === "Jr Varsity")}
                    
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
            Caps per gender: <b>Varsity ≤ 5</b>, <b>Varsity Alternate ≤ 1</b>. Provisional class is fixed.
          </div>

          {(["Varsity", "Varsity Alternate", "Jr Varsity", "Provisional"] as RacerClass[]).map(c => (
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
                    {view.byClass[c].map(e => {
                      const racer = racerById(e.racerId);
                      const isProvBaseline = racer?.class === "Provisional";
                      const options: RacerClass[] = isProvBaseline
                        ? ["Provisional"]
                        : (["Varsity", "Varsity Alternate", "Jr Varsity"] as RacerClass[]);
                      return (
                        <tr key={e.racerId}>
                          <td>{e.startOrder}</td>
                          <td>{racer?.name ?? e.racerId}</td>
                          <td>
                            <select
                              value={e.class}
                              onChange={ev => changeClass(e.racerId, ev.target.value as RacerClass)}
                              disabled={isProvBaseline}
                            >
                              {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="right">
                            <div className="row" style={{justifyContent:"flex-end"}}>
                              <button className="secondary" onClick={() => move(e.racerId, "up")}>↑</button>
                              <button className="secondary" onClick={() => move(e.racerId, "down")}>↓</button>
                              <button className="danger" onClick={() => remove(e.racerId)}>Remove</button>
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
        title="Roster Limit"
        onClose={() => setShowErr(false)}
        >
        <p style={{margin:0}}>{err}</p>
      </Modal>
    </section>
  );
}