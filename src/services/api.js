// src/services/api.js

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const INVERNADA_TO_CATEGORIA = {
  'Nenhuma': '1',
  'Pré-Mirim': '2',
  'Mirim': '3',
  'Juvenil': '4',
  'Adulta': '5',
  'Veterana / Xiru': '6',
  'Chula': '8'
};

const CATEGORIA_TO_INVERNADA = {
  '1': 'Nenhuma',
  '2': 'Pré-Mirim',
  '3': 'Mirim',
  '4': 'Juvenil',
  '5': 'Adulta',
  '6': 'Veterana / Xiru',
  '7': 'Veterana / Xiru',
  '8': 'Chula'
};

// Converte a string única de endereço do front-end em um objeto estruturado esperado pelo back-end
function parseFrontendEndereco(enderecoStr) {
  if (!enderecoStr) {
    return {
      logradouro: 'Rua Não Informada',
      numero: 'S/N',
      bairro: 'Centro',
      cidade: 'Charqueadas',
      estado: 'RS',
      cep: '96780-000',
      complemento: ''
    };
  }

  const parts = enderecoStr.split('-');
  const logradouroNumero = parts[0] || '';
  const bairro = (parts[1] || 'Centro').trim();
  const cidadeEstado = (parts[2] || 'Charqueadas/RS').trim();

  const subParts = logradouroNumero.split(',');
  const logradouro = (subParts[0] || 'Rua Não Informada').trim();
  const numero = (subParts[1] || 'S/N').trim();

  const ceParts = cidadeEstado.split('/');
  const cidade = (ceParts[0] || 'Charqueadas').trim();
  const estado = (ceParts[1] || 'RS').trim();

  return {
    logradouro,
    numero,
    bairro,
    cidade,
    estado,
    cep: '96780-000',
    complemento: ''
  };
}

// Converte os dados recebidos do back-end para o formato em conformidade com as páginas do front-end
function mapBackendToFrontendSocio(b) {
  let enderecoStr = '';
  if (b.endereco) {
    if (typeof b.endereco === 'object') {
      const e = b.endereco;
      enderecoStr = `${e.logradouro || ''}, ${e.numero || ''}${e.complemento ? ' (' + e.complemento + ')' : ''} - ${e.bairro || ''} - ${e.cidade || ''}/${e.estado || ''}`;
    } else {
      enderecoStr = b.endereco;
    }
  } else {
    enderecoStr = 'Rua Não Informada, S/N - Centro - Charqueadas/RS';
  }
  
  // Mapeia histórico de pagamentos, se houver
  const pagamentos = Array.isArray(b.pagamentos) ? b.pagamentos.map(p => ({
    mes: p.mes || `${p.mes}/${p.ano}`,
    valor: `R$ ${p.valor}`,
    status: p.status,
    data: p.data_vencimento || '—'
  })) : [];

  return {
    id: Number(b.id),
    nome: b.nome,
    cpf: b.cpf,
    email: b.email || '',
    telefone: b.telefone,
    data_nascimento: b.data_nascimento,
    endereco: enderecoStr,
    status: b.status || 'Ativo',
    invernada: CATEGORIA_TO_INVERNADA[b.categoria] || 'Nenhuma',
    dependentes: Array.isArray(b.dependentes) ? b.dependentes.length : 0,
    mensalidade: b.mensalidade || 'Em dia',
    data_entrada: b.data_entrada,
    ultimoPagamento: b.ultimoPagamento || null,
    pagamentos: pagamentos
  };
}

// Converte os dados do front-end no JSON que o controlador PHP do back-end necessita
function mapFrontendToBackendSocio(f) {
  const addr = parseFrontendEndereco(f.endereco);
  return {
    nome: f.nome,
    cpf: f.cpf,
    telefone: f.telefone || '',
    foto: f.foto || '',
    identidade: f.identidade || 'Não informada',
    data_nascimento: f.data_nascimento || '1990-01-01',
    data_entrada: f.data_entrada || new Date().toISOString().split('T')[0],
    status: f.status || 'Ativo',
    categoria: INVERNADA_TO_CATEGORIA[f.invernada] || '1',
    dancarino: f.dancarino !== undefined ? f.dancarino : true,
    paga_instrutor: f.paga_instrutor !== undefined ? f.paga_instrutor : false,
    ...addr
  };
}

async function parseError(res, defaultMsg) {
  let errorMsg = defaultMsg;
  try {
    const errData = await res.json();
    if (errData && errData.message) {
      errorMsg = errData.message;
    }
  } catch (jsonErr) {
    console.warn('Falha ao decodificar JSON de erro:', jsonErr);
  }
  const err = new Error(errorMsg);
  err.status = res.status;
  return err;
}

export const api = {
  async getSocios() {
    try {
      const res = await fetch(`${BASE_URL}/socios`);
      if (!res.ok) {
        throw await parseError(res, 'Erro ao buscar sócios');
      }
      const data = await res.json();
      return Array.isArray(data) ? data.map(mapBackendToFrontendSocio) : [];
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async getSocioById(id) {
    try {
      const res = await fetch(`${BASE_URL}/socios/${id}`);
      if (!res.ok) {
        throw await parseError(res, 'Erro ao buscar sócio');
      }
      const data = await res.json();
      return mapBackendToFrontendSocio(data);
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async createSocio(socioData) {
    const backendData = mapFrontendToBackendSocio(socioData);
    try {
      const res = await fetch(`${BASE_URL}/socios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao cadastrar sócio');
      }
      const data = await res.json();
      return mapBackendToFrontendSocio(data);
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async updateSocio(id, socioData) {
    const backendData = mapFrontendToBackendSocio(socioData);
    try {
      const res = await fetch(`${BASE_URL}/socios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao atualizar sócio');
      }
      const data = await res.json();
      return data;
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async deleteSocio(id) {
    try {
      const res = await fetch(`${BASE_URL}/socios/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao excluir sócio');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  // === MENSALIDADES ===
  async getMensalidades() {
    try {
      const res = await fetch(`${BASE_URL}/mensalidades`);
      if (!res.ok) {
        throw await parseError(res, 'Erro ao buscar mensalidades');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async createMensalidade(data) {
    try {
      const res = await fetch(`${BASE_URL}/mensalidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao criar mensalidade');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async updateMensalidade(id, data) {
    try {
      const res = await fetch(`${BASE_URL}/mensalidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao atualizar mensalidade');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async deleteMensalidade(id) {
    try {
      const res = await fetch(`${BASE_URL}/mensalidades/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao excluir mensalidade');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  // === PAGAMENTOS ===
  async getPagamentos() {
    try {
      const res = await fetch(`${BASE_URL}/pagamentos`);
      if (!res.ok) {
        throw await parseError(res, 'Erro ao buscar pagamentos');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async createPagamento(data) {
    try {
      const res = await fetch(`${BASE_URL}/pagamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao registrar pagamento');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async updatePagamento(id, data) {
    try {
      const res = await fetch(`${BASE_URL}/pagamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao atualizar pagamento');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  async deletePagamento(id) {
    try {
      const res = await fetch(`${BASE_URL}/pagamentos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw await parseError(res, 'Erro ao excluir pagamento');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        const networkErr = new Error('Falha de comunicação com o servidor. Verifique se o backend está rodando.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  }
};
