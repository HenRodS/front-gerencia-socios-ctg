import { apiRequest } from "./api";
import { mapBackendToFrontendSocio, mapFrontendToBackendSocio } from "../utils/socioMapper";

export const socioService = {
  async getAll() {
    const data = await apiRequest("/socios");

    return data.map(
      mapBackendToFrontendSocio
    );
  },

  async getById(id) {
    const data = await apiRequest(
      `/socios/${id}`
    );

    return mapBackendToFrontendSocio(
      data
    );
  },

  async create(socio) {
    const data = await apiRequest(
      "/socios",
      {
        method: "POST",
        body: JSON.stringify(
          mapFrontendToBackendSocio(
            socio
          )
        ),
      }
    );

    return mapBackendToFrontendSocio(
      data
    );
  },

  async update(id, socio) {
    return apiRequest(
      `/socios/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(
          mapFrontendToBackendSocio(
            socio
          )
        ),
      }
    );
  },

  async delete(id) {
    return apiRequest(
      `/socios/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};