import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Race, StartListEntry, Team } from "../models";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";
import { formatRaceDate } from "../utils/date";

import Modal from "../components/Modal";

type StartListCandidate = Omit<StartListEntry, "bib">;

function sortByBib(entries: StartListEntry[]) {
  return entries.slice().sort((a, b) => a.bib - b.bib);
}

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
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  const [copyFromRaceId, setCopyFromRaceId] = useState<string>("");
  const [bibDraftByRacer, setBibDraftByRacer] = useState<Record<string, string>>({});
  const [savingBibForRacerId, setSavingBibForRacerId] = useState<string | null>(null);
  const [manualCandidates, setManualCandidates] = useState<StartListCandidate[]>([]);
  const [manualRacerId, setManualRacerId] = useState("");
  const [manualBib, setManualBib] = useState("");
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  async function refreshManualCandidates(nextList?: StartListEntry[] | null, nextTeams?: Team[]) {
    if (!user || !raceId) return;
    const teamList = nextTeams ?? teams;
    const currentList = nextList ?? list ?? [];
    if (!teamList.length) {
      setManualCandidates([]);
      setManualRacerId("");
      return;
    }
    const listedRacerIds = new Set(currentList.map(e => e.racerId));
    const rosterLists = await Promise.all(teamList.map(t => api.getRoster(user, raceId, t.teamId).catch(() => [])));
    const candidates: StartListCandidate[] = [];
    teamList.forEach((team, idx) => {
      const roster = rosterLists[idx] as any[];
      roster.forEach((entry) => {
        const cls = String(entry.class ?? "");
        if (cls === "DNS" || cls === "DNS - Did Not Start") return;
        if (listedRacerIds.has(String(entry.racerId))) return;
        const racer = team.racers.find(r => r.racerId === entry.racerId);
        if (!racer) return;
        candidates.push({
          raceId: raceId,
          racerId: racer.racerId,
          racerName: racer.name,
          teamId: team.teamId,
          teamName: team.name,
          gender: entry.gender,
          class: entry.class,
        } as StartListCandidate);
      });
    });
    candidates.sort((a, b) =>
      a.teamName.localeCompare(b.teamName) ||
      a.gender.localeCompare(b.gender) ||
      a.racerName.localeCompare(b.racerName)
    );
    setManualCandidates(candidates);
    setManualRacerId(prev => (prev && candidates.some(c => c.racerId === prev)) ? prev : (candidates[0]?.racerId ?? ""));
  }


  useEffect(() => {
    (async () => {
      try {
        if (!user) { navigate("/"); return; }
        if (user.role !== "ADMIN") { navigate("/home"); return; }
        const r = await api.getRace(raceId!);
        if (!r) throw new Error("Race not found");
        setRace(r);
        const [existing, excludes, teamsResp, raceList] = await Promise.all([
          api.getStartList(user, raceId!),
          api.getExcludedBibs(user, raceId!),
          api.listTeams(),
          api.listRaces(),
        ]);
        setList(sortByBib(existing.entries ?? existing));
        setTeamOrder(existing.meta?.teamsOrder ?? []);
        setTeams(teamsResp);
        setExcludedInput(excludes.join(", "));
        setAllRaces(raceList);
        setCopyFromRaceId(raceList.find(race => race.raceId !== raceId)?.raceId ?? "");
        await refreshManualCandidates(sortByBib(existing.entries ?? existing), teamsResp);
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
      const nextList = sortByBib(res.entries ?? []);
      const nextTeams = await api.listTeams();
      setList(nextList);
      setTeamOrder(res.meta?.teamsOrder ?? []);
      setTeams(nextTeams);
      await refreshManualCandidates(nextList, nextTeams);
    } catch (e: any) {
      setErr(e.message ?? "Failed to generate start list");
      setShowErr(true);
    } finally {
      setBusy(false);
    }
  }

  async function copyFromRace() {
    if (!user || !raceId || !copyFromRaceId) return;
    setBusy(true);
    try {
      await api.copyStartList(user, raceId, copyFromRaceId);
      const [existing, excludes, teamsResp] = await Promise.all([
        api.getStartList(user, raceId),
        api.getExcludedBibs(user, raceId),
        api.listTeams(),
      ]);
      const nextList = sortByBib(existing.entries ?? existing);
      setList(nextList);
      setTeamOrder(existing.meta?.teamsOrder ?? []);
      setTeams(teamsResp);
      setExcludedInput(excludes.join(", "));
      await refreshManualCandidates(nextList, teamsResp);
    } catch (e: any) {
      setErr(e.message ?? "Failed to copy start list");
      setShowErr(true);
    } finally {
      setBusy(false);
    }
  }

  function isEditingBib(racerId: string) {
    return Object.prototype.hasOwnProperty.call(bibDraftByRacer, racerId);
  }

  function startEditingBib(entry: StartListEntry) {
    setBibDraftByRacer(prev => ({ ...prev, [entry.racerId]: String(entry.bib) }));
  }

  function cancelEditingBib(racerId: string) {
    setBibDraftByRacer(prev => {
      const next = { ...prev };
      delete next[racerId];
      return next;
    });
  }

  async function saveBib(entry: StartListEntry) {
    if (!raceId || !user) return;
    const raw = (bibDraftByRacer[entry.racerId] ?? "").trim();
    const bib = Number(raw);
    if (!Number.isInteger(bib) || bib <= 0) {
      setErr("Bib must be a positive integer.");
      setShowErr(true);
      return;
    }
    setSavingBibForRacerId(entry.racerId);
    try {
      const updated = await api.updateStartListBib(user, raceId, entry.racerId, bib);
      setList(prev => {
        if (!prev) return prev;
        return sortByBib(prev.map(item => (item.racerId === updated.racerId ? { ...item, bib: updated.bib } : item)));
      });
      cancelEditingBib(entry.racerId);
    } catch (e: any) {
      setErr(e.message ?? "Failed to update bib");
      setShowErr(true);
    } finally {
      setSavingBibForRacerId(null);
    }
  }

  async function addManualEntry() {
    if (!raceId || !user) return;
    if (!manualRacerId) {
      setErr("Select a racer to add.");
      setShowErr(true);
      return;
    }
    const bib = Number(manualBib.trim());
    if (!Number.isInteger(bib) || bib <= 0) {
      setErr("Bib must be a positive integer.");
      setShowErr(true);
      return;
    }
    setIsAddingManual(true);
    try {
      const created = await api.addStartListEntry(user, raceId, manualRacerId, bib);
      const nextList = sortByBib([...(list ?? []), created]);
      setList(nextList);
      setManualBib("");
      await refreshManualCandidates(nextList);
    } catch (e: any) {
      setErr(e.message ?? "Failed to add racer to start list");
      setShowErr(true);
    } finally {
      setIsAddingManual(false);
    }
  }

function csvEscape(s: string) {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function splitName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { first: "", last: "" };
  if (trimmed.includes(",")) {
    const [last, first] = trimmed.split(",", 2);
    return { first: (first ?? "").trim(), last: (last ?? "").trim() };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  const last = parts.pop() ?? "";
  return { first: parts.join(" "), last };
}

function classCode(value: StartListEntry["class"]) {
  switch (value) {
    case "Varsity":
      return "V";
    case "Varsity Alternate":
      return "VA";
    case "Jr Varsity":
      return "JV";
    case "Provisional":
      return "P";
    default:
      return value;
  }
}

function toCsv(rows: StartListEntry[]) {
  const header = ["Start Order","Bib","First Name","Last Name","Class","Team","Gender"];
  const lines = [header.join(",")];
  rows.forEach((r, index) => {
    const name = splitName(r.racerName);
    lines.push([
      String(index + 1),
      String(r.bib),
      csvEscape(name.first),
      csvEscape(name.last),
      csvEscape(classCode(r.class)),
      csvEscape(r.teamName),
      csvEscape(r.gender),
    ].join(","));
  });
  return lines.join("\n");
}

function downloadCsvFile(csv: string, file: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadCsv() {
  if (!list || list.length === 0 || !race) return;
  const safeRace = race.name.replace(/[^a-z0-9\-]+/gi, "_").toLowerCase();
  const base = `start-list_${safeRace}_${race.date}`;

  const femaleRows = list.filter(r => r.gender === "Female");
  const maleRows = list.filter(r => r.gender === "Male");

  if (femaleRows.length > 0) {
    downloadCsvFile(toCsv(femaleRows), `${base}_female.csv`);
  }
  if (maleRows.length > 0) {
    downloadCsvFile(toCsv(maleRows), `${base}_male.csv`);
  }
}


  if (!race) return <section className="card">Loading…</section>;

  return (
    <section>
      <div className="row" style={{justifyContent:"space-between", alignItems:"baseline"}}>
        <h1>Start List — {race.name}</h1>
        <Link to="/races" className="secondary">Back to Races</Link>
      </div>
      <p className="muted">{race.type} • {race.location} • {formatRaceDate(race.date)}</p>

      <div className="card" style={{marginBottom:16}}>
        <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
          <div className="muted small">
            Randomizes teams, snakes by start position, Women then Men. Assigns bibs: Women 1.., Men 100..
          </div>
          <button onClick={generate} disabled={isBusy}>{isBusy ? "Generating…" : "Generate / Regenerate"}</button>
        </div>
        <div className="row" style={{ alignItems: "center", gap: 8, marginTop: 12 }}>
          <label className="muted small" style={{ minWidth: 130 }}>Copy start list from</label>
          <select
            value={copyFromRaceId}
            onChange={e => setCopyFromRaceId(e.target.value)}
            disabled={isBusy}
          >
            <option value="">Select a race…</option>
            {allRaces
              .filter(r => r.raceId !== raceId)
              .map(r => (
                <option key={r.raceId} value={r.raceId}>
                  {r.name} • {formatRaceDate(r.date)}
                </option>
              ))}
          </select>
          <button
            className="secondary"
            onClick={copyFromRace}
            disabled={isBusy || !copyFromRaceId}
          >
            {isBusy ? "Copying…" : "Copy"}
          </button>
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
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <label className="muted small" style={{ display: "block", marginBottom: 4 }}>
            Manually add rostered racer to this start list
          </label>
          <div className="row" style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              value={manualRacerId}
              onChange={e => setManualRacerId(e.target.value)}
              disabled={isAddingManual || manualCandidates.length === 0 || !list || list.length === 0}
              style={{ minWidth: 320 }}
            >
              {manualCandidates.length === 0 ? (
                <option value="">No eligible rostered racers available</option>
              ) : (
                manualCandidates.map(c => (
                  <option key={c.racerId} value={c.racerId}>
                    {c.racerName} • {c.teamName} • {c.gender} • {c.class}
                  </option>
                ))
              )}
            </select>
            <input
              type="number"
              min={1}
              value={manualBib}
              onChange={e => setManualBib(e.target.value)}
              placeholder="Bib #"
              disabled={isAddingManual || !list || list.length === 0}
              style={{ width: 110 }}
            />
            <button
              onClick={addManualEntry}
              disabled={isAddingManual || !manualRacerId || !list || list.length === 0}
            >
              {isAddingManual ? "Adding…" : "Add Racer"}
            </button>
          </div>
          {(!list || list.length === 0) && (
            <div className="muted small" style={{ marginTop: 6 }}>
              Generate or copy a start list first.
            </div>
          )}
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
                <th style={{width:220}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={`${e.bib}-${e.racerId}`}>
                  <td>
                    {isEditingBib(e.racerId) ? (
                      <input
                        type="number"
                        min={1}
                        style={{ width: 80 }}
                        value={bibDraftByRacer[e.racerId]}
                        onChange={ev => setBibDraftByRacer(prev => ({ ...prev, [e.racerId]: ev.target.value }))}
                        disabled={savingBibForRacerId === e.racerId}
                      />
                    ) : (
                      e.bib
                    )}
                  </td>
                  <td>{e.racerName}</td>
                  <td>{e.class}</td>
                  <td>{e.teamName}</td>
                  <td>{e.gender}</td>
                  <td>
                    {isEditingBib(e.racerId) ? (
                      <div className="row" style={{ gap: 8 }}>
                        <button
                          onClick={() => saveBib(e)}
                          disabled={savingBibForRacerId === e.racerId}
                        >
                          {savingBibForRacerId === e.racerId ? "Saving…" : "Save"}
                        </button>
                        <button
                          className="secondary"
                          onClick={() => cancelEditingBib(e.racerId)}
                          disabled={savingBibForRacerId === e.racerId}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="secondary" onClick={() => startEditingBib(e)}>
                        Edit Bib
                      </button>
                    )}
                  </td>
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
