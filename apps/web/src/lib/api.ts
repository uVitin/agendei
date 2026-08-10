const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export interface ApiIssue {
  field: string;
  message: string;
}

/** Erro vindo da API, já com status e código de negócio. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly issues?: ApiIssue[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  token?: string | null;
  headers?: Record<string, string>;
}

/**
 * Ponto ÚNICO de acesso à API. Toda tela passa por aqui.
 * Se um dia a autenticação mudar de localStorage para cookie,
 * só este arquivo muda.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      body?.message ?? "Não foi possível concluir a operação.",
      response.status,
      body?.code,
      body?.issues,
    );
  }

  return body as T;
}
