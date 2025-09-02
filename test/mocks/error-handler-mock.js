/**
 * Mock do ErrorHandler para testes
 * Evita problemas com window.addEventListener em ambiente de teste
 */

export const getErrorHandler = jest.fn(() => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarning: jest.fn(),
  setupGlobalErrorHandling: jest.fn(),
  sanitizeData: jest.fn((data) => data),
  createMedicalError: jest.fn((type, message, context) => ({
    type,
    message,
    context,
    timestamp: new Date().toISOString(),
  })),
}));

export default {
  getErrorHandler,
};
