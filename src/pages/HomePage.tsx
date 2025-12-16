import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Race, Team, RosterEntry } from "../models";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";


function parseISO(d: string) {
  // d like "2025-12-05"
  return new Date(d + "T00:00:00");
}



export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [races, setRaces] = useState<Race[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rostersByTeam, setRostersByTeam] = useState<Record<string, RosterEntry[]>>({});
  
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    (async () => {
      try {
        const [ts, rs] = await Promise.all([
          api.getTeamsForUser(user),
          api.listRaces(),
        ]);
        setTeams(ts);
        setRaces(rs);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load home");
      }
    })();
  }, [user, navigate]);

  // Determine next upcoming race (>= today). If none, fall back to the last race (or first available).
  const nextRace = useMemo(() => {
    if (!races || races.length === 0) return null;
    const today = new Date(2026, 0, 5); // for testing);
    const upcoming = races
      .map(r => ({ r, dt: parseISO(r.date) }))
      .filter(x => x.dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
    if (upcoming.length > 0) return upcoming[0].r;
    return races.slice().sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0]; // most recent past
  }, [races]);

    useEffect(() => {
    if (!nextRace || !teams || !Array.isArray(teams)) return;
    (async () => {
        try {
        const entries = await Promise.all(
            teams.map(async (t) => {
            const ros = await api.getRoster(user!, nextRace.raceId, t.teamId);
            return [t.teamId, ros] as const;
            })
        );
        setRostersByTeam(Object.fromEntries(entries));
        } catch (e) {
        // silently ignore; badge will just not show if load fails
        }
    })();
    }, [user, nextRace, teams]);

    function badgeForTeam(t: Team) {
        const roster = rostersByTeam[t.teamId] ?? [];
        const teamRacerIds = new Set(t.racers.map(r => r.racerId));
        const rosterRacerIds = new Set(roster.map(e => e.racerId));
        const isDns = (cls: RosterEntry["class"]) => cls === "DNS - Did Not Start" || (cls as any) === "DNS";

        const allAssigned =
            t.racers.length > 0 &&
            t.racers.every(r => rosterRacerIds.has(r.racerId)) &&
            roster.length >= t.racers.length;

        const allHaveStartOrderOrDns =
            roster.every(e => (typeof e.startOrder === "number" && e.startOrder > 0) || isDns(e.class));

        if (allAssigned && allHaveStartOrderOrDns) {
            return { kind: "ok" as const, title: "All racers assigned with start orders or DNS", symbol: "✓" };
        }
        if (!allHaveStartOrderOrDns) {
            return { kind: "warn" as const, title: "Some roster entries missing start order", symbol: "!" };
        }
        // default: some racers not on roster
        const missingCount = t.racers.filter(r => !rosterRacerIds.has(r.racerId)).length;
        return { kind: "warn" as const, title: `${missingCount} racer(s) not on roster`, symbol: "!" };
    }

    
  if (err) return <section className="card error">{err}</section>;
  if (!user || !teams || !races) return <section className="card">Loading…</section>;

  // Admins: nudge to full pages; Coaches: show their teams with quick links
  const isCoach = user.role === "COACH";

  return (
    <section>
      <h1>Welcome, {user.name}</h1>

      {isCoach ? (
        <>
          <div className="card" style={{marginBottom:16}}>
            <h2>Next Race</h2>
            {nextRace ? (
              <p className="muted">
                {nextRace.name} • {nextRace.type} • {nextRace.location} • {new Date(nextRace.date).toLocaleDateString()}
              </p>
            ) : (
              <p className="muted">No races configured yet.</p>
            )}
          </div>

          {teams.length === 0 ? (
            <div className="card">
                <p className="muted">No teams assigned to your account yet.</p>
            </div>
            ) : (
            <div className="grid home-grid">
                {teams.map(t => (
                <div className="card" key={t.teamId}>
                    <h2 style={{marginBottom:8}}>{t.name}</h2>
                    <p className="muted small" style={{marginTop:0, marginBottom:12}}>
                    {t.racers.length} racer{t.racers.length === 1 ? "" : "s"}
                    </p>

                    {/* Manage Team */}
                    <div className="row" style={{justifyContent:"flex-start", gap:8, marginBottom:8}}>
                    <Link to={`/teams/${t.teamId}`} className="link-button">Manage Team</Link>
                    </div>

                    {/* Edit Next Race Roster (shown below Manage Team) */}
                    {nextRace ? (
                        <div className="muted small" style={{marginBottom:4}}>
                            <div style={{display:"flex", alignItems:"center", gap:8}}>
                            <b>Next Race:</b>
                            <span>
                                {nextRace.name} • {nextRace.type} • {nextRace.location} • {new Date(nextRace.date).toLocaleDateString()}
                            </span>
                            {/* badge */}
                            {(() => {
                                const b = badgeForTeam(t);
                                return (
                                <span className={`badge ${b.kind}`} title={b.title} aria-label={b.title} role="img">
                                    {b.symbol}
                                </span>
                                );
                            })()}
                            </div>
                            <div style={{marginTop:6}}>
                            <Link to={`/races/${nextRace.raceId}/roster/${t.teamId}` } className="link-button">Edit Next Race Roster</Link>
                            </div>
                        </div>
                        ) : (
                        <p className="muted small">No upcoming races.</p>
                        )}

                </div>
                ))}
            </div>
            )}

        </>
      ) : (
        <div className="card">
          <h2>Quick Links</h2>
          <div className="row" style={{gap:8}}>
            <Link to="/teams" className="secondary">All Teams</Link>
            <Link to="/races" className="secondary">All Races</Link>
          </div>
          {nextRace && (
            <p className="muted" style={{marginTop:12}}>
              Next race: {nextRace.name} • {nextRace.type} • {nextRace.location} • {new Date(nextRace.date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
