import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

const getPageTitle = (pathname: string) => {
  if (pathname === "/" || pathname.startsWith("/home")) return "Home";
  if (pathname.startsWith("/teams/")) return "Team Detail";
  if (pathname.startsWith("/teams")) return "Teams";
  if (pathname.startsWith("/races/") && pathname.includes("/roster/")) return "Roster Editor";
  if (pathname.startsWith("/races/") && pathname.includes("/start-list")) return "Start List";
  if (pathname.startsWith("/races/") && pathname.includes("/results")) return "Race Results";
  if (pathname.startsWith("/races")) return "Races";
  if (pathname.startsWith("/public/races/") && pathname.includes("/start-list/teams")) return "Public Start List by Team";
  if (pathname.startsWith("/public/races/") && pathname.includes("/start-list")) return "Public Start List";
  if (pathname.startsWith("/public/races/") && pathname.includes("/results")) return "Public Results";
  if (pathname.startsWith("/public/season-results")) return "Season Results";
  return "Race Manager";
};

function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = async () => { await logout(); navigate("/logged-out"); };

  const isHome = location.pathname.startsWith("/home");
  const isTeams = location.pathname.startsWith("/teams");
  const isRaces = location.pathname.startsWith("/races");

  return (
    <header className="topbar">
      <div className="brand">Race Manager - Mt Hood League</div>
      <nav className="nav">
        {user && (
          <>
            <Link to="/home" className={isHome ? "active" : undefined}>Home</Link>
            <Link to="/teams" className={isTeams ? "active" : undefined}>Teams</Link>
            <Link to="/races" className={isRaces ? "active" : undefined}>Races</Link>
            <span className="user">{user.name} ({user.role})</span>
            <button onClick={onLogout} className="secondary">Logout</button>
          </>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (!gtag) return;

    const pageTitle = getPageTitle(location.pathname);
    document.title = `Race Manager - ${pageTitle}`;

    gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: pageTitle,
    });
  }, [location]);

  return (
    <AuthProvider>
      <TopBar />
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer">© {new Date().getFullYear()} Cascade Timing</footer>
    </AuthProvider>
  );
}
