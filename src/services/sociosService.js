import { api } from './api'

export function getSocios() {
  return api.getSocios()
}

export function getSocioById(id) {
  return api.getSocioById(id)
}

export function createSocio(socioData) {
  return api.createSocio(socioData)
}

export function updateSocio(id, socioData) {
  return api.updateSocio(id, socioData)
}

export function deleteSocio(id) {
  return api.deleteSocio(id)
}

export function getMensalidades() {
  return api.getMensalidades()
}

export function createMensalidade(data) {
  return api.createMensalidade(data)
}

export function updateMensalidade(id, data) {
  return api.updateMensalidade(id, data)
}

export function getPagamentos() {
  return api.getPagamentos()
}

export function createPagamento(data) {
  return api.createPagamento(data)
}
