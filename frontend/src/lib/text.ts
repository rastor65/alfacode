/** Texto en minusculas y sin tildes, para buscar sin importar acentos ni mayusculas. */
export function normalizeSearch(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
