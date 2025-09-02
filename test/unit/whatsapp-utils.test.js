import {
  buildWhatsAppMessage,
  computeMaskedName,
  selectGreeting,
} from '../../ui/whatsapp-utils.js';

describe('whatsapp-utils', () => {
  test('computeMaskedName - mantém primeiro nome e mascara resto', () => {
    expect(computeMaskedName('João Carlos Silva')).toBe('João C*** S***');
    expect(computeMaskedName('Maria')).toBe('Maria');
    expect(computeMaskedName('')).toBe('***');
    expect(computeMaskedName(null)).toBe('***');
  });

  test('selectGreeting - faixas corretas', () => {
    expect(selectGreeting(new Date('2025-09-01T06:00:00'))).toBe('Bom dia!');
    expect(selectGreeting(new Date('2025-09-01T13:00:00'))).toBe('Boa tarde!');
    expect(selectGreeting(new Date('2025-09-01T20:00:00'))).toBe('Boa noite!');
  });

  test('buildWhatsAppMessage - substitui saudação e nome mascarado', () => {
    const tpl = `Bom dia!\nTenho esse telefone como contato para "NOME DO PACIENTE"\nAssunto: Teste`;
    const msg = buildWhatsAppMessage(tpl, 'João Silva', new Date('2025-09-01T14:00:00'));
    expect(msg).toMatch(/Boa tarde!/);
    expect(msg).toContain('"João S***"');
  });

  test('buildWhatsAppMessage - adiciona saudação se não existir', () => {
    const tpl = `Linha sem saudação\nTenho esse telefone como contato para NOME DO PACIENTE`;
    const msg = buildWhatsAppMessage(tpl, 'Ana Paula', new Date('2025-09-01T09:00:00'));
    expect(msg.startsWith('Bom dia!')).toBe(true);
    expect(msg).toContain('Ana P***');
  });
});
