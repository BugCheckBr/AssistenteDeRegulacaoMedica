import { extractPhoneMap, gatherPhoneValues, normalizeNumber } from '../../ui/phone-utils.js';

describe('phone-utils', () => {
  test('normalizeNumber removes country code 55 and leading zeros', () => {
    expect(normalizeNumber('+55-54-34011272'.replace(/\D/g, ''))).toBe('5434011272');
    expect(normalizeNumber('0055434011272')).toBe('5434011272');
    expect(normalizeNumber('00001234')).toBe('1234');
  });

  test('extractPhoneMap extracts multiple numbers and groups by sufix', () => {
    const raw = '+55 (54) 3401-1272; +55 54 99629-4829 / 3056-7950';
    const map = extractPhoneMap(raw);
    // deve conter chaves (sufixos)
    expect(map.size).toBeGreaterThanOrEqual(2);
    // verificar que números normalizados existem
    const allNums = [...map.values()].flatMap((s) => [...s]);
    expect(allNums.some((n) => n.includes('34011272'))).toBe(true);
    expect(allNums.some((n) => n.includes('996294829') || n.includes('99629482'))).toBe(true);
  });

  test('gatherPhoneValues encontra telefones em objetos aninhados', () => {
    const obj = {
      contato: { telefone: '+55-54-34011272' },
      meta: { notes: 'ligar para 996294829' },
    };
    const vals = gatherPhoneValues(obj);
    expect(vals.length).toBeGreaterThanOrEqual(1);
    expect(vals.some((v) => v.includes('34011272') || v.includes('996294829'))).toBe(true);
  });
});
