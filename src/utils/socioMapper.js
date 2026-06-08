import { CATEGORIA_TO_INVERNADA, INVERNADA_TO_CATEGORIA } from "./categoriaHelper";
import { parseFrontendEndereco } from "./enderecoHelper";

export function mapBackendToFrontendSocio(b) {
  let enderecoStr = "";

  if (b.endereco) {
    if (typeof b.endereco === "object") {
      const e = b.endereco;

      enderecoStr =
        `${e.logradouro || ""}, ${e.numero || ""}` +
        `${e.complemento ? ` (${e.complemento})` : ""}` +
        ` - ${e.bairro || ""}` +
        ` - ${e.cidade || ""}/${e.estado || ""}`;
    } else {
      enderecoStr = b.endereco;
    }
  }

  const pagamentos = Array.isArray(b.pagamentos)
    ? b.pagamentos.map((p) => ({
        mes: p.mes || `${p.mes}/${p.ano}`,
        valor: `R$ ${p.valor}`,
        status: p.status,
        data: p.data_vencimento || "—",
      }))
    : [];

  return {
    id: Number(b.id),
    nome: b.nome,
    cpf: b.cpf,
    email: b.email || "",
    telefone: b.telefone,
    data_nascimento: b.data_nascimento,
    endereco: enderecoStr,
    status: b.status || "Ativo",
    invernada:
      CATEGORIA_TO_INVERNADA[b.categoria] ||
      "Nenhuma",
    dependentes: b.dependentes?.length || 0,
    mensalidade: b.mensalidade || "Em dia",
    data_entrada: b.data_entrada,
    ultimoPagamento: b.ultimoPagamento,
    pagamentos,
  };
}

export function mapFrontendToBackendSocio(f) {
  const endereco = parseFrontendEndereco(
    f.endereco
  );

  return {
    nome: f.nome,
    cpf: f.cpf,
    telefone: f.telefone || "",
    foto: f.foto || "",
    identidade:
      f.identidade || "Não informada",
    data_nascimento:
      f.data_nascimento || "1990-01-01",
    data_entrada:
      f.data_entrada ||
      new Date().toISOString().split("T")[0],
    status: f.status || "Ativo",
    categoria:
      INVERNADA_TO_CATEGORIA[f.invernada] ||
      "1",
    dancarino: f.dancarino ?? true,
    paga_instrutor:
      f.paga_instrutor ?? false,
    ...endereco,
  };
}