import { api } from "./api";

const BASE_URL = "/socios";

export const socioService = {

  listar: () => {
    return api.get(BASE_URL);
  },

  buscarPorId: (id) => {
    return api.get(`${BASE_URL}/${id}`);
  },

  criar: (socio) => {
    return api.post(BASE_URL, socio);
  },

  atualizar: (id, socio) => {
    return api.put(`${BASE_URL}/${id}`, socio);
  },

  atualizarParcial: (id, dados) => {
    return api.patch(`${BASE_URL}/${id}`, dados);
  },

  deletar: (id) => {
    return api.delete(`${BASE_URL}/${id}`);
  },

  listarPagamentos: (id) => {
    return api.get(`${BASE_URL}/${id}/pagamentos`);
  },

  adicionarPagamento: (id, pagamento) => {
    return api.post(
      `${BASE_URL}/${id}/pagamentos`,
      pagamento
    );
  },
};