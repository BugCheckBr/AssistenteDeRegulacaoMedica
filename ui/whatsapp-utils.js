/**
 * Utilitários para montar mensagem do WhatsApp com anonimização e saudação dinâmica.
 * Exporta funções puras para facilitar testes unitários.
 */

// Mensagem padrão centralizada para uso em toda a UI/fluxo WhatsApp.
// Edite aqui para alterar o texto padrão exibido/compartilhado pelo sistema.
export const DEFAULT_WHATSAPP_MESSAGE = `SAUDACAO Aqui é da Secretaria da Saúde de Farroupilha
Tenho esse telefone como contato para "NOME DO PACIENTE"
Ligar com URGÊNCIA no telefone 054 2131-5303 - opção 4
Assunto: Agendamento de CONSULTA/EXAME`;

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
  if (h >= 7 && h < 12) return 'Bom dia 🙂!';
  if (h >= 12 && h < 18) return 'Boa tarde 🙂!';
  return 'Boa noite 😴!';
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
  const greetingRegex = /^\s*(SAUDACAO?|Bom dia!?|Boa tarde!?|Boa noite!?)[\s\r\n]*/i;
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
