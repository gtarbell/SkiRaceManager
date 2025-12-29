import { useAuth } from "../auth/AuthContext";

export default function LoggedOutPage() {
  const { login } = useAuth();

  return (
    <section className="login-page">
      <div className="login-inner">
        <div className="card login-card">
          <h1>Signed out</h1>
          <p className="muted">You have been signed out successfully.</p>
          <button onClick={login}>Sign in again</button>
        </div>
      </div>
    </section>
  );
}
