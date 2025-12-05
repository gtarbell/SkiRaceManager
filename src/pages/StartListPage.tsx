import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Race, StartListEntry, Team } from "../models";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";

import Modal from "../components/Modal";

export default function StartListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { raceId } = useParams<{ raceId: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [list, setList] = useState<StartListEntry[] | null>(null);
  const [teamOrder, setTeamOrder] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showErr, setShowErr] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [excludedInput, setExcludedInput] = useState("");
  

  useEffect(() => {
    (async () => {
      try {
        if (!user) { navigate("/"); return; }
        if (user.role !== "ADMIN") { navigate("/home"); return; }
        const r = await api.getRace(raceId!);
        if (!r) throw new Error("Race not found");
        setRace(r);
        const [existing, excludes, teamsResp] = await Promise.all([
          api.getStartList(user, raceId!),
          api.getExcludedBibs(user, raceId!),
          api.listTeams(),
        ]);
        setList(existing.entries ?? existing);
        setTeamOrder(existing.meta?.teamsOrder ?? []);
        setTeams(teamsResp);
        setExcludedInput(excludes.join(", "));
      } catch (e: any) {
        setErr(e.message ?? "Failed to load start list");
        setShowErr(true);
      }
    })();
  }, [user, raceId, navigate]);

  function parseExcluded(): number[] {
    return excludedInput
      .split(/[,\\s]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => Number.isFinite(n) && n > 0);
  }

  async function saveExcluded() {
    if (!raceId || !user) return;
    const parsed = parseExcluded();
    const saved = await api.setExcludedBibs(user, raceId, parsed);
    setExcludedInput(saved.join(", "));
  }

  async function generate() {
    if (!user) return;
    setBusy(true);
    try {
      const excludes = parseExcluded();
      const res = await api.generateStartList(user, raceId!, excludes);
      setList(res.entries ?? []);
      setTeamOrder(res.meta?.teamsOrder ?? []);
      setTeams(await api.listTeams());
    } catch (e: any) {
      setErr(e.message ?? "Failed to generate start list");
      setShowErr(true);
    } finally {
      setBusy(false);
    }
  }

function csvEscape(s: string) {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: StartListEntry[]) {
  const header = ["Bib","Racer","Class","Team","Gender"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      String(r.bib),
      csvEscape(r.racerName),
      csvEscape(r.class),
      csvEscape(r.teamName),
      csvEscape(r.gender),
    ].join(","));
  }
  return lines.join("\n");
}

function downloadCsv() {
  if (!list || list.length === 0 || !race) return;
  const csv = toCsv(list);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const safeRace = race.name.replace(/[^a-z0-9\-]+/gi, "_").toLowerCase();
  const file = `start-list_${safeRace}_${race.date}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}


  if (!race) return <section className="card">Loading…</section>;

  return (
    <section>
      <div className="row" style={{justifyContent:"space-between", alignItems:"baseline"}}>
        <h1>Start List — {race.name}</h1>
        <Link to="/races" className="secondary">Back to Races</Link>
      </div>
      <p className="muted">{race.type} • {race.location} • {new Date(race.date).toLocaleDateString()}</p>

      <div className="card" style={{marginBottom:16}}>
        <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
          <div className="muted small">
            Randomizes teams, snakes by start position, Women then Men. Assigns bibs: Women 1.., Men 100..
          </div>
          <button onClick={generate} disabled={isBusy}>{isBusy ? "Generating…" : "Generate / Regenerate"}</button>
        </div>
        <div style={{marginTop:12}}>
          <label className="muted small" style={{display:"block", marginBottom:4}}>Excluded bibs for this race (comma or space separated)</label>
          <div className="row" style={{alignItems:"center", gap:8}}>
            <input
              style={{flex:1}}
              value={excludedInput}
              onChange={e => setExcludedInput(e.target.value)}
              placeholder="e.g. 6, 7, 13, 42, 111"
            />
            <button className="secondary" onClick={saveExcluded} disabled={!raceId}>Save</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Start List</h2>
        {teamOrder.length > 0 && (
          <p className="muted small" style={{marginTop:0}}>
            Team randomization order: {teamOrder.map(tid => teams.find(t => t.teamId === tid)?.name ?? tid).join(" → ")}
          </p>
        )}
        {!list || list.length === 0 ? (
          <div className="muted">No start list yet. Click “Generate”.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{width:70}}>Bib</th>
                <th>Racer</th>
                <th style={{width:160}}>Class</th>
                <th>Team</th>
                <th style={{width:90}}>Gender</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={`${e.bib}-${e.racerId}`}>
                  <td>{e.bib}</td>
                  <td>{e.racerName}</td>
                  <td>{e.class}</td>
                  <td>{e.teamName}</td>
                  <td>{e.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>

          
        )}
      </div>

      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <button
            className="secondary"
            onClick={downloadCsv}
            disabled={!list || list.length === 0}
            title={!list || list.length === 0 ? "Generate a start list first" : "Download start list as CSV"}
        >
            Download CSV
        </button>
        </div>


      <Modal open={showErr} title="Start List" onClose={()=>setShowErr(false)}>
        <p style={{margin:0}}>{err}</p>
      </Modal>
    </section>
  );
}
