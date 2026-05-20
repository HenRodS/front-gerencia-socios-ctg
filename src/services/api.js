const API_URL = "http://localhost:8000";

async function request(endpoint, options = {}) {

  const authToken = options.authToken;
  const headers = options.headers;

  const finalHeaders = {
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

  get: (endpoint, token) => {

    return request(endpoint, {
      method: "GET",
      authToken: token,
    });
  },

  post: (endpoint, body, token) => {

    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      authToken: token,
    });
  },

  put: (endpoint, body, token) => {

    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      authToken: token,
    });
  },

  patch: (endpoint, body, token) => {

    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      authToken: token,
    });
  },

  delete: (endpoint, token) => {

    return request(endpoint, {
      method: "DELETE",
      authToken: token,
    });
  },
};