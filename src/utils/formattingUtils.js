// src/utils/formattingUtils.js
// Funções e constantes de data/formatação compartilhadas entre as páginas

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/**
 * Gera uma lista de strings "Mês/Ano" partindo do mês atual para o passado.
 * @param {number} quantidade - Quantos meses gerar (padrão: 13)
 */
export function gerarMeses(quantidade = 13) {
  const hoje = new Date()
  const lista = []
  for (let i = 0; i < quantidade; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    lista.push(`${MESES_NOMES[d.getMonth()]}/${d.getFullYear()}`)
  }
  return lista
}

/**
 * Converte uma string de data ISO (YYYY-MM-DD) ou BR (DD/MM/YYYY) em Date.
 */
export function parseDate(str) {
  if (!str) return new Date(0)
  if (str.includes('-')) {
    const [y, m, d] = str.split('-')
    return new Date(y, m - 1, d)
  }
  if (str.includes('/')) {
    const [d, m, y] = str.split('/')
    return new Date(y, m - 1, d)
  }
  return new Date(str)
}

/**
 * Formata data ISO (YYYY-MM-DD) para o formato BR (DD/MM/YYYY).
 */
export function formatDateBR(str) {
  if (!str) return ''
  if (str.includes('-')) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }
  return str
}

/**
 * Aplica máscara de CPF enquanto o usuário digita.
 * Limita a 11 dígitos e formata como ###.###.###-##
 */
export function formatarCPF(value) {
  const digitos = value.replace(/\D/g, '')
  const limitados = digitos.substring(0, 11)
  if (limitados.length <= 3) return limitados
  if (limitados.length <= 6) return `${limitados.slice(0, 3)}.${limitados.slice(3)}`
  if (limitados.length <= 9) return `${limitados.slice(0, 3)}.${limitados.slice(3, 6)}.${limitados.slice(6)}`
  return `${limitados.slice(0, 3)}.${limitados.slice(3, 6)}.${limitados.slice(6, 9)}-${limitados.slice(9)}`
}

/**
 * Aplica máscara de telefone enquanto o usuário digita.
 * Suporta formatos (XX) XXXXX-XXXX e (XX) XXXX-XXXX
 */
export function formatarTelefone(value) {
  const digitos = value.replace(/\D/g, '')
  const limitados = digitos.substring(0, 11)
  if (limitados.length <= 2) return limitados
  if (limitados.length <= 7) return `(${limitados.slice(0, 2)}) ${limitados.slice(2)}`
  return `(${limitados.slice(0, 2)}) ${limitados.slice(2, 7)}-${limitados.slice(7)}`
}

/**
 * Valida CPF com dígitos verificadores.
 */
export function validarCPF(cpf) {
  const limpo = cpf.replace(/\D/g, '')
  if (limpo.length !== 11) return false
  if (/^(\d)\1{10}$/.test(limpo)) return false

  let soma = 0
  for (let i = 1; i <= 9; i++) soma += parseInt(limpo.substring(i - 1, i)) * (11 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo.substring(9, 10))) return false

  soma = 0
  for (let i = 1; i <= 10; i++) soma += parseInt(limpo.substring(i - 1, i)) * (12 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo.substring(10, 11))) return false

  return true
}

/**
 * Gera as iniciais de um nome (primeira e última palavra).
 */
export function iniciais(nome) {
  const partes = (nome || '').trim().split(' ')
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes[partes.length - 1]?.[0] ?? ''
  return (primeira + ultima).toUpperCase()
}

/**
 * Converte valor monetário de string para número.
 * Suporta formatos "R$ 80,00", "80.00", 80.
 */
export function parseMoeda(val) {
  if (typeof val === 'number') return val
  const str = String(val ?? '80.00')
  const n = parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.'))
  return isNaN(n) ? 80 : n
}
