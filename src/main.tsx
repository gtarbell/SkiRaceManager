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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
