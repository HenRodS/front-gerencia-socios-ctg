// src/services/api.ts

const API_URL = "http://localhost:8000";

type RequestOptions = RequestInit & {
  authToken?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {

  const authToken = options.authToken;
  const headers = options.headers;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    finalHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  if (headers) {
    Object.assign(finalHeaders, headers);
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: finalHeaders,
    }
  );

  if (!response.ok) {

    let errorMessage = `Erro na requisição: ${response.status}`;

    try {
      const error = await response.json();

      if (error.message) {
        errorMessage = error.message;
      }

    } catch {
      console.log("Não é JSON");
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {

  get: <T>(
    endpoint: string,
    token?: string
  ) => {

    return request<T>(endpoint, {
      method: "GET",
      authToken: token,
    });
  },

  post: <T>(
    endpoint: string,
    body: unknown,
    token?: string
  ) => {

    return request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      authToken: token,
    });
  },

  put: <T>(
    endpoint: string,
    body: unknown,
    token?: string
  ) => {

    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      authToken: token,
    });
  },

  patch: <T>(
    endpoint: string,
    body: unknown,
    token?: string
  ) => {

    return request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      authToken: token,
    });
  },

  delete: <T>(
    endpoint: string,
    token?: string
  ) => {

    return request<T>(endpoint, {
      method: "DELETE",
      authToken: token,
    });
  },
};