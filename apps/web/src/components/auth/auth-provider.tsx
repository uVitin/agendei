"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, apiFetch } from "@/lib/api";
import {
  clearSession,
  readProfessional,
  readToken,
  saveSession,
} from "@/lib/auth";
import type { AuthResponse, AuthenticatedProfessional } from "@/lib/types";

interface AuthContextValue {
  token: string | null;
  professional: AuthenticatedProfessional | null;
  /** true enquanto a sessão salva ainda está sendo verificada. */
  loading: boolean;
  signIn: (data: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [professional, setProfessional] =
    useState<AuthenticatedProfessional | null>(null);
  const [loading, setLoading] = useState(true);

  // Ao carregar a aplicação, recupera a sessão e CONFIRMA com a API.
  useEffect(() => {
    const savedToken = readToken();

    if (!savedToken) {
      setLoading(false);
      return;
    }

    let active = true;
    setProfessional(readProfessional());

    apiFetch<AuthenticatedProfessional>("/auth/me", { token: savedToken })
      .then((data) => {
        if (!active) return;
        setToken(savedToken);
        setProfessional(data);
        saveSession(savedToken, data);
      })
      .catch((error) => {
        if (!active) return;
        // Token expirado ou inválido: limpa em vez de insistir.
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }
        setToken(null);
        setProfessional(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((data: AuthResponse) => {
    saveSession(data.token, data.professional);
    setToken(data.token);
    setProfessional(data.professional);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setToken(null);
    setProfessional(null);
  }, []);

  const value = useMemo(
    () => ({ token, professional, loading, signIn, signOut }),
    [token, professional, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }

  return context;
}
