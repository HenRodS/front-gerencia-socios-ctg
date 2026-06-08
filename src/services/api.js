const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function parseError(res, defaultMsg) {
  try {
    const data = await res.json();
    return new Error(data.message || defaultMsg);
  } catch {
    return new Error(defaultMsg);
  }
}

export async function apiRequest(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw await parseError(res, "Erro na requisição");
    }

    if (res.status === 204) {
      return null;
    }

    return await res.json();
  } catch (err) {
    if (
      err instanceof TypeError ||
      err.message === "Failed to fetch"
    ) {
      const networkErr = new Error(
        "Falha de comunicação com o servidor."
      );

      networkErr.isNetworkError = true;
      throw networkErr;
    }

    throw err;
  }
}