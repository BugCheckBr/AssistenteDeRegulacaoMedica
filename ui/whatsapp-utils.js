/**
 * Utilitários para montar mensagem do WhatsApp com anonimização e saudação dinâmica.
 * Exporta funções puras para facilitar testes unitários.
 */

export function computeMaskedName(name) {
  if (!name) return '***';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '***';
  const firstName = parts[0];
  if (parts.length === 1) return firstName;
  const restMasked = parts.slice(1).map((s) => (s && s[0] ? s[0].toUpperCase() + '***' : '***'));
  return `${firstName} ${restMasked.join(' ')}`.trim();
}

export function selectGreeting(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Bom dia!';
  if (h >= 12 && h < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

/**
 * Monta a mensagem final substituindo saudação inicial (se houver) e o marcador
 * NOME DO PACIENTE por uma versão mascarada.
 *
 * @param {string} template
 * @param {string} fullName
 * @param {Date} date
 * @returns {string}
 */
export function buildWhatsAppMessage(template = '', fullName = '', date = new Date()) {
  const greeting = selectGreeting(date);
  const masked = computeMaskedName(fullName);

  const tpl = String(template);

  // Troca saudação inicial se houver (Bom dia!/Boa tarde!/Boa noite!) no começo do template
  const greetingRegex = /^\s*(Bom dia!?|Boa tarde!?|Boa noite!?)[\s\r\n]*/i;
  let result;
  if (greetingRegex.test(tpl)) {
    result = tpl.replace(greetingRegex, `${greeting}\n`);
  } else {
    // não havia saudação — acrescenta no topo
    result = `${greeting}\n${tpl}`.trim();
  }

  // Substitui todas as ocorrências de NOME DO PACIENTE (com ou sem aspas)
  result = result.replace(/"NOME DO PACIENTE"/g, `"${masked}"`);
  result = result.replace(/NOME DO PACIENTE/g, masked);

  return result;
}
