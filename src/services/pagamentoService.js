import { apiRequest } from "./api";

export const pagamentoService = {
  getAll() {
    return apiRequest("/pagamentos");
  },

  create(data) {
    return apiRequest("/pagamentos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return apiRequest(
      `/pagamentos/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  delete(id) {
    return apiRequest(
      `/pagamentos/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};