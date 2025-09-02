/**
 * @jest-environment jsdom
 */
/**
 * Standalone ErrorHandler Unit Tests
 * Tests the real ErrorHandler module without global mocks
 */

/* global fail */

// Setup global mocks BEFORE importing any modules
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    getManifest: jest.fn().mockReturnValue({ version: '3.3.7-test' }),
  },
};

global.window = { addEventListener: jest.fn() };
global.document = { addEventListener: jest.fn() };
global.navigator = { userAgent: 'Mozilla/5.0 (Test Browser)' };
global.performance = {
  mark: jest.fn(),
  measure: jest.fn(),
  now: jest.fn(() => Date.now()),
};

// Force unmock ErrorHandler for this test file
jest.unmock('../../ErrorHandler.js');

import {
  ERROR_CATEGORIES,
  ERROR_LEVELS,
  ErrorHandler,
  getErrorHandler,
  logError,
  logInfo,
  sanitizeForLog,
} from '../../ErrorHandler.js';

describe('ErrorHandler Standalone Tests', () => {
  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Imports and Basic Structure', () => {
    test('All imports are defined', () => {
      expect(ERROR_CATEGORIES).toBeDefined();
      expect(ERROR_LEVELS).toBeDefined();
      expect(ErrorHandler).toBeDefined();
      expect(getErrorHandler).toBeDefined();
      expect(logError).toBeDefined();
      expect(logInfo).toBeDefined();
      expect(sanitizeForLog).toBeDefined();
    });

    test('ERROR_CATEGORIES has required properties', () => {
      expect(ERROR_CATEGORIES.SIGSS_API).toBe('sigss_api');
      expect(ERROR_CATEGORIES.CADSUS_API).toBe('cadsus_api');
      expect(ERROR_CATEGORIES.MEDICAL_DATA).toBe('medical_data');
      expect(ERROR_CATEGORIES.SECURITY).toBe('security');
    });

    test('ERROR_LEVELS has required values', () => {
      expect(ERROR_LEVELS.DEBUG).toBe(1);
      expect(ERROR_LEVELS.INFO).toBe(2);
      expect(ERROR_LEVELS.WARN).toBe(3);
      expect(ERROR_LEVELS.ERROR).toBe(4);
      expect(ERROR_LEVELS.FATAL).toBe(5);
    });

    test('ErrorHandler is a valid instance', () => {
      expect(ErrorHandler).toBeDefined();
      expect(typeof ErrorHandler.logInfo).toBe('function');
      expect(typeof ErrorHandler.logError).toBe('function');
      expect(typeof ErrorHandler.sanitizeForLogging).toBe('function');
    });
  });

  describe('Singleton Pattern', () => {
    test('getErrorHandler returns consistent instance', () => {
      const instance1 = getErrorHandler();
      const instance2 = getErrorHandler();
      expect(instance1).toStrictEqual(instance2);
      expect(instance1.constructor).toBe(instance2.constructor);
    });
  });

  describe('Data Sanitization', () => {
    test('sanitizes sensitive medical fields', () => {
      const sensitiveData = {
        id: 'REGU_123',
        cpf: '123.456.789-01',
        nome: 'João Silva',
        cns: '12345678901234',
        telefone: '(11) 99999-9999',
        reguId: 'REG_456',
      };

      const sanitized = sanitizeForLog(sensitiveData);

      expect(sanitized.id).toBe('REGU_123'); // Technical ID - OK
      expect(sanitized.reguId).toBe('REG_456'); // Technical ID - OK
      expect(sanitized.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.cns).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.telefone).toBe('[SANITIZED_MEDICAL_DATA]');
    });

    test('preserves technical IDs necessary for debugging', () => {
      const technicalData = {
        reguId: 'REG_123',
        reguIdp: 'REGP_456',
        isenPK: 'ISEN_789',
        isenFullPKCrypto: 'CRYPTO_ABC',
        sessionId: 'SESS_DEF',
        requestId: 'REQ_GHI',
      };

      const sanitized = sanitizeForLog(technicalData);

      // All technical IDs should be preserved
      Object.keys(technicalData).forEach((key) => {
        expect(sanitized[key]).toBe(technicalData[key]);
      });
    });

    test('handles arrays with sanitization', () => {
      const arrayData = [
        { id: 'PAT_1', nome: 'João', cpf: '123.456.789-01' },
        { id: 'PAT_2', nome: 'Maria', cpf: '987.654.321-00' },
      ];

      const sanitized = sanitizeForLog(arrayData);

      expect(sanitized).toHaveLength(2);
      expect(sanitized[0].id).toBe('PAT_1');
      expect(sanitized[0].nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized[0].cpf).toBe('[SANITIZED_MEDICAL_DATA]');
    });

    test('limits large arrays', () => {
      const largeArray = new Array(10).fill({ id: 'TEST' });
      const sanitized = sanitizeForLog(largeArray);

      expect(sanitized).toHaveLength(6); // 5 items + "...X more items"
      expect(sanitized[5]).toContain('more items');
    });

    test('truncates very long strings', () => {
      const longString = 'A'.repeat(200);
      const sanitized = sanitizeForLog(longString);

      expect(sanitized).toHaveLength(103); // 100 chars + "..."
      expect(sanitized).toMatch(/\.\.\.$/);
    });
  });

  describe('Logging Functions', () => {
    test('logInfo works correctly', () => {
      logInfo('Test info message', { test: 'data' }, ERROR_CATEGORIES.SIGSS_API);

      expect(console.info).toHaveBeenCalledWith(
        '[Assistente Médico sigss_api] Test info message',
        expect.anything()
      );
    });

    test('logError works correctly', () => {
      logError('Test error message', { error: 'details' }, ERROR_CATEGORIES.MEDICAL_DATA);

      expect(console.error).toHaveBeenCalledWith(
        '[Assistente Médico medical_data] Test error message',
        expect.anything()
      );
    });

    test('automatically sanitizes data in logs', () => {
      const sensitiveData = {
        reguId: 'REG_123',
        cpf: '123.456.789-00',
        nome: 'João Silva',
      };

      logError('Test with sensitive data', sensitiveData, ERROR_CATEGORIES.MEDICAL_DATA);

      // Check that console.error was called
      expect(console.error).toHaveBeenCalled();
      const loggedData = console.error.mock.calls[0][1];

      // Two possibilities: either JSON string or already sanitized object
      if (typeof loggedData === 'string') {
        try {
          const parsedData = JSON.parse(loggedData);
          expect(parsedData.reguId).toBe('REG_123');
          expect(parsedData.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
          expect(parsedData.nome).toBe('[SANITIZED_MEDICAL_DATA]');
        } catch (e) {
          fail('Expected JSON string but could not parse: ' + e.message);
        }
      } else {
        expect(loggedData.reguId).toBe('REG_123');
        expect(loggedData.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
        expect(loggedData.nome).toBe('[SANITIZED_MEDICAL_DATA]');
      }
    });
  });

  describe('Medical Compliance', () => {
    test('never logs sensitive medical fields', () => {
      const testCases = [
        { cpf: '123.456.789-01' },
        { cns: '12345678901234' },
        { nome_completo: 'João da Silva' },
        { data_nascimento: '1990-01-01' },
        { endereco: 'Rua das Flores, 123' },
        { telefone: '(11) 99999-9999' },
        { diagnostico: 'Diabetes Type 2' },
        { medicamento: 'Metformina 500mg' },
      ];

      testCases.forEach((testCase) => {
        const sanitized = sanitizeForLog(testCase);
        Object.values(sanitized).forEach((value) => {
          expect(value).toBe('[SANITIZED_MEDICAL_DATA]');
        });
      });
    });

    test('preserves technical IDs needed for medical debugging', () => {
      const medicalTechnicalData = {
        reguId: 'REG_2024_001',
        reguIdp: 'REGP_2024_001',
        reguIds: 'REGS_2024_001',
        isenPK: 'ISEN_ABC123',
        isenFullPKCrypto: 'CRYPTO_DEF456',
        sessionId: 'SESS_GHI789',
        requestId: 'REQ_JKL012',
        transactionId: 'TXN_MNO345',
      };

      const sanitized = sanitizeForLog(medicalTechnicalData);

      Object.entries(medicalTechnicalData).forEach(([key, value]) => {
        expect(sanitized[key]).toBe(value);
      });
    });
  });

  describe('ErrorHandler Instance Methods', () => {
    test('ErrorHandler has all required methods', () => {
      const handler = getErrorHandler();
      expect(typeof handler.logInfo).toBe('function');
      expect(typeof handler.logError).toBe('function');
      expect(typeof handler.logWarning).toBe('function');
      expect(typeof handler.sanitizeForLogging).toBe('function');
      expect(typeof handler.startPerformanceMark).toBe('function');
      expect(typeof handler.endPerformanceMark).toBe('function');
      expect(typeof handler.subscribe).toBe('function');
      expect(typeof handler.unsubscribe).toBe('function');
      expect(typeof handler.getStoredErrors).toBe('function');
    });

    test('performance marks work', (done) => {
      const handler = getErrorHandler();
      handler.startPerformanceMark('test_operation');

      setTimeout(() => {
        handler.endPerformanceMark('test_operation');
        expect(console.info).toHaveBeenCalledWith(
          expect.stringContaining('Performance: test_operation took'),
          expect.any(String)
        );
        done();
      }, 10);
    }, 100);

    test('observer pattern works', () => {
      const handler = getErrorHandler();
      const mockObserver = jest.fn();

      handler.subscribe(mockObserver);
      handler.logInfo('Test message');

      expect(mockObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
          level: 'INFO',
        })
      );
    });

    test('unsubscribe removes observer', () => {
      const handler = getErrorHandler();
      const mockObserver = jest.fn();

      handler.subscribe(mockObserver);
      handler.unsubscribe(mockObserver);
      handler.logInfo('Test message');

      expect(mockObserver).not.toHaveBeenCalled();
    });
  });

  describe('Error Storage', () => {
    test('stores critical errors', async () => {
      const handler = getErrorHandler();
      await handler.logError('Critical test error', { severity: 'high' });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalErrors: expect.arrayContaining([
            expect.objectContaining({
              message: 'Critical test error',
              level: 'ERROR',
            }),
          ]),
        })
      );
    });

    test('retrieves stored errors', async () => {
      const mockErrors = [
        { message: 'Error 1', level: 'ERROR', timestamp: '2024-01-01T00:00:00.000Z' },
        { message: 'Error 2', level: 'FATAL', timestamp: '2024-01-01T01:00:00.000Z' },
      ];

      chrome.storage.local.get.mockResolvedValue({ medicalErrors: mockErrors });

      const handler = getErrorHandler();
      const storedErrors = await handler.getStoredErrors();

      expect(storedErrors).toEqual(mockErrors);
    });
  });
});
