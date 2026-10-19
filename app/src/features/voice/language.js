// Liga o dicionário de linguagem (agro-linguagem) à camada de linguagem da voz.
import dictionary from './linguagem/dicionario_agro_ptbr.json';
import { createLanguage } from './language-core.js';

export const language = createLanguage(dictionary);
