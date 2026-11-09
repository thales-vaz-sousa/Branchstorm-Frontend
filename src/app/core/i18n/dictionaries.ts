import pt from './lang.pt';
import en from './lang.en';
import es from './lang.es';
import fr from './lang.fr';

export type LangCode = 'pt' | 'en' | 'es' | 'fr';
export type LangParams = Record<string, string | number>;
export type Dict = Record<string, string>;

/**
 * Dicionários por idioma. A chave ausente ou o idioma sem a chave cai
 * para o português (`pt`), que é a fonte da verdade dos textos.
 */
export const DICTS: Record<LangCode, Dict> = {
  pt,
  en,
  es,
  fr,
};
