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


const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function mapMensalidadeParaPagamento(m) {
  const nomeMes = MESES_NOMES[(m.mes - 1)] || '';
  const [y, mo, d] = (m.data_vencimento || '').split('-');
  return {
    mes: `${nomeMes}/${m.ano}`,
    valor: `R$ ${parseFloat(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    status: m.status,
    data: d && mo && y ? `${d}/${mo}/${y}` : '—',
  };
}

// Converte os dados recebidos do back-end para o formato em conformidade com as páginas do front-end
function mapBackendToFrontendSocio(b, mensalidades = []) {
  let enderecoStr = '';
  if (b.endereco) {
    if (typeof b.endereco === 'string') {
      enderecoStr = b.endereco;
    } else if (typeof b.endereco === 'object') {
      const { logradouro, numero, complemento, bairro, cidade, estado, cep } = b.endereco;
      const compStr = complemento ? ` (${complemento})` : '';
      enderecoStr = `${logradouro || ''}, ${numero || ''}${compStr} - ${bairro || ''}, ${cidade || ''}/${estado || ''}`;
      if (cep) {
        enderecoStr += ` - CEP: ${cep}`;
      }
    }
  }
  if (!enderecoStr) {
    enderecoStr = 'Rua Não Informada, S/N - Centro - Charqueadas/RS';
  }

  const pagamentos = mensalidades.map(mapMensalidadeParaPagamento);

  const temPendente = mensalidades.some(m => m.status === 'Atrasado' || m.status === 'Pendente');
  const ultimoPago = mensalidades
    .filter(m => m.status === 'Pago')
    .sort((a, b) => b.ano - a.ano || b.mes - a.mes)[0];

  return {
    id: Number(b.id),
    nome: b.nome,
    cpf: b.cpf,
    email: b.email || '',
    telefone: b.telefone,
    data_nascimento: b.data_nascimento,
    endereco: enderecoStr,
    logradouro: b.endereco?.logradouro || '',
    numero: b.endereco?.numero || '',
    complemento: b.endereco?.complemento || '',
    bairro: b.endereco?.bairro || '',
    cidade: b.endereco?.cidade || '',
    estado: b.endereco?.estado || '',
    cep: b.endereco?.cep || '',
    status: b.status || 'Ativo',
    invernada: CATEGORIA_TO_INVERNADA[String(b.categoria)] || 'Nenhuma',
    dependentes: Array.isArray(b.dependentes) ? b.dependentes.length : 0,
    mensalidade: temPendente ? 'Atrasado' : 'Em dia',
    data_entrada: b.data_entrada,
    ultimoPagamento: ultimoPago ? `${String(ultimoPago.mes).padStart(2,'0')}/${ultimoPago.ano}` : null,
    pagamentos,
  };
}

// Converte os dados do front-end no JSON que o controlador PHP do back-end necessita
function mapFrontendToBackendSocio(f) {
  let logradouro = 'Rua Não Informada';
  let numero = 'S/N';
  let bairro = 'Centro';
  let cidade = 'Charqueadas';
  let estado = 'RS';
  let cep = '96745-000';
  let complemento = '';

  if (f.logradouro || f.numero || f.bairro || f.cidade || f.estado || f.cep) {
    logradouro = f.logradouro || 'Rua Não Informada';
    numero = f.numero || 'S/N';
    bairro = f.bairro || 'Centro';
    cidade = f.cidade || 'Charqueadas';
    estado = f.estado || 'RS';
    cep = f.cep || '96745-000';
    complemento = f.complemento || '';
  } else if (f.endereco) {
    const parts = f.endereco.split('-');
    if (parts.length >= 2) {
      const leftPart = parts[0].trim();
      const rightPart = parts[1].trim();

      const cityStateParts = rightPart.split('/');
      if (cityStateParts.length >= 2) {
        cidade = cityStateParts[0].trim();
        estado = cityStateParts[1].replace(/CEP:?\s*\d{5}-?\d{3}/i, '').trim();
      } else {
        cidade = rightPart;
      }

      const leftSubParts = leftPart.split(',');
      if (leftSubParts.length >= 3) {
        logradouro = leftSubParts[0].trim();
        numero = leftSubParts[1].trim();
        bairro = leftSubParts[2].trim();
      } else if (leftSubParts.length === 2) {
        logradouro = leftSubParts[0].trim();
        numero = leftSubParts[1].trim();
      } else {
        logradouro = leftPart;
      }
    } else {
      const leftSubParts = f.endereco.split(',');
      if (leftSubParts.length >= 2) {
        logradouro = leftSubParts[0].trim();
        numero = leftSubParts[1].trim();
      } else {
        logradouro = f.endereco;
      }
    }

    const cepMatch = f.endereco.match(/(\d{5}-\d{3})|(\d{8})/);
    if (cepMatch) {
      cep = cepMatch[0];
    }
  }

  return {
    nome: f.nome,
    cpf: f.cpf,
    telefone: f.telefone || '',
    email: f.email || '',
    foto: f.foto || '',
    identidade: f.identidade || 'Não informada',
    logradouro,
    numero,
    bairro,
    cidade,
    estado,
    cep,
    complemento: complemento || null,
    data_nascimento: f.data_nascimento || '1990-01-01',
    data_entrada: f.data_entrada || new Date().toISOString().split('T')[0],
    status: f.status || 'Ativo',
    categoria: INVERNADA_TO_CATEGORIA[f.invernada] || '1',
    dancarino: f.dancarino !== undefined ? f.dancarino : true,
    paga_instrutor: f.paga_instrutor !== undefined ? f.paga_instrutor : false,
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
      const [sociosRes, mensalidadesRes] = await Promise.all([
        fetch(`${BASE_URL}/socios`),
        fetch(`${BASE_URL}/mensalidades`),
      ]);
      if (!sociosRes.ok) throw await parseError(sociosRes, 'Erro ao buscar sócios');
      const socios = await sociosRes.json();
      const mensalidades = mensalidadesRes.ok ? await mensalidadesRes.json() : [];
      return Array.isArray(socios)
        ? socios.map(s => mapBackendToFrontendSocio(s, mensalidades.filter(m => m.socio_id === s.id)))
        : [];
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
      const [socioRes, mensalidadesRes] = await Promise.all([
        fetch(`${BASE_URL}/socios/${id}`),
        fetch(`${BASE_URL}/mensalidades`),
      ]);
      if (!socioRes.ok) throw await parseError(socioRes, 'Erro ao buscar sócio');
      const socio = await socioRes.json();
      const mensalidades = mensalidadesRes.ok ? await mensalidadesRes.json() : [];
      return mapBackendToFrontendSocio(socio, mensalidades.filter(m => m.socio_id === socio.id));
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
