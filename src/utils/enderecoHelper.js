export function parseFrontendEndereco(enderecoStr) {
  if (!enderecoStr) {
    return {
      logradouro: "Rua Não Informada",
      numero: "S/N",
      bairro: "Centro",
      cidade: "Charqueadas",
      estado: "RS",
      cep: "96780-000",
      complemento: "",
    };
  }

  const parts = enderecoStr.split("-");

  const logradouroNumero = parts[0] || "";
  const bairro = (parts[1] || "Centro").trim();
  const cidadeEstado = (parts[2] || "Charqueadas/RS").trim();

  const subParts = logradouroNumero.split(",");

  const logradouro =
    (subParts[0] || "Rua Não Informada").trim();

  const numero =
    (subParts[1] || "S/N").trim();

  const ceParts = cidadeEstado.split("/");

  const cidade =
    (ceParts[0] || "Charqueadas").trim();

  const estado =
    (ceParts[1] || "RS").trim();

  return {
    logradouro,
    numero,
    bairro,
    cidade,
    estado,
    cep: "96780-000",
    complemento: "",
  };
}