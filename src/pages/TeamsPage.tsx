import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Team } from "../models";
import { mockApi } from "../services/mockApi";

export default function TeamsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        const res = await mockApi.getTeamsForUser(user);
        setTeams(res);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load teams");
      }
    })();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <section>
      <h1>Teams</h1>
      {err && <div className="error">{err}</div>}
      {!teams ? (
        <div className="muted">Loading…</div>
      ) : teams.length === 0 ? (
        <div className="muted">No teams assigned.</div>
      ) : (
        <ul className="list">
          {teams.map(t => (
            <li key={t.id} className="list-item">
              <div>
                <div className="title">{t.name}</div>
                <div className="muted">{t.racers.length} racer{t.racers.length === 1 ? "" : "s"}</div>
              </div>
              <Link to={`/teams/${t.id}`} className="secondary">Manage</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
