import { createContext } from "react";
import type { LoginUserVO } from "../types/api";

export interface AuthContextType {
  user: LoginUserVO | null;
  setUser: (user: LoginUserVO | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
