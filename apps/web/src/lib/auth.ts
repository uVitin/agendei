import type { AuthenticatedProfessional } from "./types";

const TOKEN_KEY = "agendei:token";
const PROFESSIONAL_KEY = "agendei:professional";

/**
 * Acesso ao armazenamento da sessão, isolado num arquivo só.
 *
 * Os guardas `typeof window === "undefined"` existem porque o Next
 * executa componentes no servidor antes de mandar para o navegador —
 * e lá localStorage não existe.
 */
export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function readProfessional(): AuthenticatedProfessional | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PROFESSIONAL_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthenticatedProfessional;
  } catch {
    // Dado corrompido não pode derrubar a aplicação.
    return null;
  }
}

export function saveSession(
  token: string,
  professional: AuthenticatedProfessional,
): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(PROFESSIONAL_KEY, JSON.stringify(professional));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PROFESSIONAL_KEY);
}
