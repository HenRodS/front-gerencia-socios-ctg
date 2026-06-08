export const INVERNADA_TO_CATEGORIA = {
  Nenhuma: "1",
  "Pré-Mirim": "2",
  Mirim: "3",
  Juvenil: "4",
  Adulta: "5",
  "Veterana / Xiru": "6",
  Chula: "8",
};

export const CATEGORIA_TO_INVERNADA =
  Object.fromEntries(
    Object.entries(INVERNADA_TO_CATEGORIA)
      .map(([k, v]) => [v, k])
  );