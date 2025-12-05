import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";           // ← add
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import RacesPage from "./pages/RacesPage";
import RosterEditorPage from "./pages/RosterEditorPage";
import StartListPage from "./pages/StartListPage";
import PublicStartListPage from "./pages/PublicStartListPage";
import PublicStartListByTeamPage from "./pages/PublicStartListByTeamPage";

import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/home", element: <HomePage /> },     // ← new
      { path: "/teams", element: <TeamsPage /> },
      { path: "/teams/:teamId", element: <TeamDetailPage /> },
      { path: "/races", element: <RacesPage /> },
      { path: "/races/:raceId/roster/:teamId", element: <RosterEditorPage /> },
      { path: "/races/:raceId/start-list", element: <StartListPage /> },
      { path: "/public/races/:raceId/start-list", element: <PublicStartListPage /> },
      { path: "/public/races/:raceId/start-list/teams", element: <PublicStartListByTeamPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
