import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthState, User } from "../models";
import { getCurrentAppUser, getIdToken, logoutCognito, startLoginRedirect } from "./cognitoClient";
const Ctx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentAppUser().then(setUser).catch(() => setUser(null));
  }, []);

  const login = async () => {
    await startLoginRedirect();
  };

  const logout = async () => {
    await logoutCognito();
    setUser(null);
  };

  const value = useMemo<AuthState>(
    () => ({ user, login, logout, getIdToken }),
    [user]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
