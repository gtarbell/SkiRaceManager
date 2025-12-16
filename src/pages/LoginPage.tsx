import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  if (user) {
    // already logged in
    navigate("/home");
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(username.trim());
      navigate("/home");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    }
  };

  return (
    <section className="grid" style={{ alignItems: "start" }}>
      <div className="card">
        <h1>Sign in</h1>
        <form onSubmit={onSubmit} className="form">
          <label>
            Username
            <input
              placeholder="Coach Sam"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>
          {err && <div className="error">{err}</div>}
          <button type="submit">Continue</button>
        </form>
      </div>
      <div className="card">
        <h2>Public links</h2>
        <p className="muted">View published data without signing in.</p>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <a className="link-button secondary-link" href="/public/races/race1/start-list">Race 1 Start Lists</a>
          <a className="link-button secondary-link" href="/public/races/race1/results">Race 1 Results</a>
          <a className="link-button secondary-link" href="/public/season-results">Season Results</a>
        </div>
        
      </div>
    </section>
  );
}
