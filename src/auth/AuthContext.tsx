import React, { createContext, useContext, useMemo, useState } from "react";
import { AuthState, User } from "../models";
import { mockApi } from "../services/mockApi";

const Ctx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string) => {
    const u = await mockApi.loginByName(username);
    setUser(u);
  };
  const logout = () => setUser(null);

  const value = useMemo<AuthState>(() => ({ user, login, logout }), [user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
