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
    <section className="card">
      <h1>Sign in</h1>
      <p className="muted">Use mock users: <b>Alice Admin</b>, <b>Carl Coach</b>, <b>Casey Coach</b></p>
      <form onSubmit={onSubmit} className="form">
        <label>
          Username
          <input
            placeholder="Alice Admin"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </label>
        {err && <div className="error">{err}</div>}
        <button type="submit">Continue</button>
      </form>
    </section>
  );
}
