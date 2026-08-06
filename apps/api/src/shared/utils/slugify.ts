/**
 * Converte um nome em slug de URL.
 * "Barbearia do Vitor" -> "barbearia-do-vitor"
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD") // separa letra e acento
    .replace(/[\u0300-\u036f]/g, "") // remove os acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove pontuação
    .replace(/\s+/g, "-") // espaços viram hífen
    .replace(/-+/g, "-") // colapsa hífens repetidos
    .replace(/^-|-$/g, ""); // tira hífen das pontas
}
