import { ApiError, parseErrorBody } from "./errors";

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export type ApiClientOptions = {
  onUnauthorized?: () => void;
  getToken?: () => string | null;
};

export function createApiClient(baseUrl: string, options: ApiClientOptions = {}) {
  const root = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const token = init.token ?? options.getToken?.() ?? null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${root}${path}`, {
        method: init.method ?? "GET",
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new ApiError(0, "Cannot reach the API. Check the server and your connection.", {});
    }

    if (response.status === 401) options.onUnauthorized?.();

    const text = await response.text();
    const data: unknown = text ? safeJson(text) : null;

    if (!response.ok) throw parseErrorBody(response.status, data);
    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
    delete: async (path: string) => {
      await request<unknown>(path, { method: "DELETE" });
    },
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { detail: text };
  }
}

export type ApiClient = ReturnType<typeof createApiClient>;
