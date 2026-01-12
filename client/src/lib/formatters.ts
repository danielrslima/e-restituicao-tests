/**
 * Utilitários de formatação e validação para o formulário de novo cálculo
 * Validações rigorosas: datas sem faltar algarismo, anos com 4 dígitos
 */

/**
 * Formata número do processo judicial
 * Máscara: XXXXXXX-XX.XXXX.X.XX.XXXX
 * Exemplo: 0001453-21.2013.5.10.0018
 */
export const formatProcesso = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 20);
  
  if (cleaned.length <= 7) {
    return cleaned;
  } else if (cleaned.length <= 9) {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length <= 13) {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9)}`;
  } else if (cleaned.length <= 14) {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13)}`;
  } else if (cleaned.length <= 15) {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14)}`;
  } else if (cleaned.length <= 17) {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14, 16)}.${cleaned.slice(16)}`;
  } else {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14, 16)}.${cleaned.slice(16, 20)}`;
  }
};

/**
 * Formata data no formato DD/MM/YYYY
 * Validação rigorosa: não pode faltar algarismo
 * Exemplo: 24/12/2020
 */
export const formatData = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 8);
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  } else {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }
};

/**
 * Valida se a data está completa e correta
 * Retorna true se DD/MM/YYYY está válido
 */
export const isDataValida = (data: string): boolean => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = data.match(regex);
  
  if (!match) return false;
  
  const [, dia, mes, ano] = match;
  const diaNum = parseInt(dia);
  const mesNum = parseInt(mes);
  const anoNum = parseInt(ano);
  
  // Validar mês
  if (mesNum < 1 || mesNum > 12) return false;
  
  // Validar dia
  if (diaNum < 1 || diaNum > 31) return false;
  
  // Validar ano (1900-2099)
  if (anoNum < 1900 || anoNum > 2099) return false;
  
  // Validar dia específico do mês
  const diasPorMes = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (diaNum > diasPorMes[mesNum - 1]) return false;
  
  // Validar fevereiro em ano não bissexto
  if (mesNum === 2 && diaNum === 29) {
    const isBissexto = (anoNum % 4 === 0 && anoNum % 100 !== 0) || (anoNum % 400 === 0);
    if (!isBissexto) return false;
  }
  
  return true;
};

/**
 * Formata valor monetário no formato 1.234.567,89
 * Sempre com 2 casas decimais
 * Exemplo: 2.315.218,05
 */
export const formatValor = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  
  // Garantir que sempre tem 2 casas decimais
  const padded = cleaned.padStart(3, '0');
  const inteiro = padded.slice(0, -2) || '0';
  const decimal = padded.slice(-2);
  
  // Formatar parte inteira com separadores de milhares
  const inteiroParts = inteiro.split('').reverse();
  const inteiroParts3 = [];
  for (let i = 0; i < inteiroParts.length; i += 3) {
    inteiroParts3.push(inteiroParts.slice(i, i + 3).reverse().join(''));
  }
  const inteiroFormatado = inteiroParts3.reverse().join('.');
  
  return `${inteiroFormatado},${decimal}`;
};

/**
 * Converte valor formatado para número (em centavos)
 * Exemplo: "2.315.218,05" → 231521805
 */
export const parseValor = (value: string): number => {
  const cleaned = value.replace(/\D/g, '');
  return parseInt(cleaned) || 0;
};

/**
 * Formata ano com validação de 4 dígitos
 * Exemplo: 2020
 */
export const formatAno = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  return cleaned;
};

/**
 * Valida se o ano está completo e correto
 * Retorna true se tem exatamente 4 dígitos e está entre 1900-2099
 */
export const isAnoValido = (ano: string): boolean => {
  if (ano.length !== 4) return false;
  const anoNum = parseInt(ano);
  return anoNum >= 1900 && anoNum <= 2099;
};

/**
 * Formata CPF com máscara 000.000.000-00
 */
export const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  } else if (cleaned.length <= 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  } else {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  }
};

/**
 * Formata CNPJ com máscara 00.000.000/0000-00
 */
export const formatCNPJ = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  } else if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  } else if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  } else {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
  }
};

/**
 * Converte valor formatado para display (BRL)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
};
