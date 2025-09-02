/**
 * Mock do api.js para testes
 * Evita importações problemáticas do ErrorHandler
 */

export const keepSessionAlive = jest.fn().mockResolvedValue(true);

export default {
  keepSessionAlive,
};
