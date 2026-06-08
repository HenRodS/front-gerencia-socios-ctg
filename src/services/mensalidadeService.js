import { apiRequest } from "./api";

export const mensalidadeService = {
  getAll() {
    return apiRequest(
      "/mensalidades"
    );
  },

  create(data) {
    return apiRequest(
      "/mensalidades",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  update(id, data) {
    return apiRequest(
      `/mensalidades/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  delete(id) {
    return apiRequest(
      `/mensalidades/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};