import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/CascadeLogo-w.png";

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
    <section className="login-page">
      <div className="login-inner">
        <img src={logo} alt="Cascade logo" className="login-logo" />
        <div className="card login-card">
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
        <div className="card login-help">
          <p className="muted small">
            First Time or need some help? Watch this quick tutorial video to get started.
          </p>
          <div className="video-embed">
            <iframe
              src="https://www.youtube.com/embed/2xTVbLrAyk4"
              title="Quick tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
