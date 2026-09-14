"use client";
import { createContext, useContext } from "react";
import type { User } from "@/lib/auth";
const SessionContext = createContext<User | null>(null);
export function StudioSession({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}
export function useStudioUser() {
  return useContext(SessionContext);
}
