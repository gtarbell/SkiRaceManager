import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/CascadeLogo-w.png";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login();
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
            <p className="muted">Sign in with your league-issued account.</p>
            {err && <div className="error">{err}</div>}
            <button type="submit">Continue To Login</button>
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
