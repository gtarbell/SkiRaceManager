import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Race, Team } from "../models";
import { mockApi } from "../services/mockApi";

export default function RacesPage() {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[] | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rs, ts] = await Promise.all([mockApi.listRaces(), user ? mockApi.getTeamsForUser(user) : Promise.resolve([])]);
        setRaces(rs);
        setTeams(ts);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load races");
      }
    })();
  }, [user]);

  if (err) return <section className="card error">{err}</section>;
  if (!races) return <section className="card">Loading…</section>;

  return (
    <section>
      <h1>Races</h1>
      <ul className="list">
        {races.map(r => (
          <li key={r.id} className="list-item">
            <div>
              <div className="title">{r.name}</div>
              <div className="muted">{r.type} • {r.location} • {new Date(r.date).toLocaleDateString()}</div>
              { user && user.role === "ADMIN" ? (
                <Link to={`/races/${r.id}/start-list`}>Start List</Link>  
              
                ) : ( <div /> )
              }
              

            </div>
            {user && teams && teams.length > 0 ? (
              <div className="row">
                {teams.map(t => (
                  <Link key={t.id} to={`/races/${r.id}/roster/${t.id}`} className="secondary">Edit {t.name} Roster</Link>
                ))}
              </div>
            ) : (
              <span className="muted">Sign in to manage rosters</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
