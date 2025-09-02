/**
 * Testes unitários para utils.js
 * Foca em funções utilitárias críticas da extensão médica
 */

import {
  debounce,
  normalizeString,
  normalizeTimelineData,
  parseDate,
  showDialog,
} from '../../utils.js';
import { TestStoreCleanup } from '../utils/test-infrastructure.js';

describe('Utils.js Medical Extension Tests', () => {
  let cleanup;

  beforeEach(() => {
    cleanup = new TestStoreCleanup();

    // Mock DOM para funções que manipulam UI
    document.body.innerHTML = '<div id="message-container"></div>';
    global.document.querySelector = jest.fn((selector) => {
      if (selector === '#message-container') {
        return document.getElementById('message-container');
      }
      return null;
    });
  });

  afterEach(() => {
    cleanup.cleanup();
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('debounce', () => {
    test('should delay function execution', async () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should use default delay when not provided', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn);

      expect(typeof debouncedFn).toBe('function');
    });

    test('should pass arguments correctly', async () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
  describe('showDialog', () => {
    test('should create dialog with medical confirmation', () => {
      document.createElement = jest.fn(() => {
        const element = {
          classList: { add: jest.fn() },
          style: {},
          innerHTML: '',
          appendChild: jest.fn(),
          addEventListener: jest.fn(),
          querySelector: jest.fn(() => ({ addEventListener: jest.fn() })),
        };
        return element;
      });
      document.body.appendChild = jest.fn();
      const options = {
        message: 'Confirmar regulação médica?',
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
      };
      showDialog(options);
      expect(document.createElement).toHaveBeenCalledWith('div');
    });
    test('should handle dialog without cancel callback', () => {
      document.createElement = jest.fn(() => ({
        classList: { add: jest.fn() },
        style: {},
        innerHTML: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => ({ addEventListener: jest.fn() })),
      }));
      document.body.appendChild = jest.fn();
      const options = { message: 'Regulação processada com sucesso', onConfirm: jest.fn() };
      expect(() => showDialog(options)).not.toThrow();
    });
  });
  describe('parseDate', () => {
    test('should parse valid date string', () => {
      const testDate = '2024-01-15';
      const parsed = parseDate(testDate);
      expect(parsed).toBeDefined();
      expect(parsed instanceof Date).toBe(true);
    });
    test('should handle invalid date string', () => {
      const invalidDate = 'invalid-date';
      const parsed = parseDate(invalidDate);
      expect(parsed).toBeNull();
    });
    test('should handle medical date formats', () => {
      const medicalDate = '15/01/2024';
      const parsed = parseDate(medicalDate);
      expect(parsed instanceof Date || parsed === null).toBe(true);
    });
    test('should handle empty or null input', () => {
      expect(parseDate('')).toBeNull();
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
    });
  });
  describe('normalizeString', () => {
    test('should normalize string correctly', () => {
      const testString = 'Ação Médica Regulação';
      const normalized = normalizeString(testString);
      expect(normalized).toBe('acao medica regulacao');
    });
    test('should handle empty string', () => {
      const normalized = normalizeString('');
      expect(normalized).toBe('');
    });
    test('should handle special medical characters', () => {
      const medicalString = 'Atenção: Emergência médica!';
      const normalized = normalizeString(medicalString);
      expect(normalized).toBe('atencao: emergencia medica!');
    });
    test('should handle accented medical terms', () => {
      const medicalTerms = 'Cirurgia Cardiovascular Emergência';
      const normalized = normalizeString(medicalTerms);
      expect(normalized).toBe('cirurgia cardiovascular emergencia');
    });
  });
  describe('normalizeTimelineData', () => {
    test('should normalize timeline data from SIGSS API', () => {
      const mockApiData = [
        {
          id: 'reg123',
          data: '2024-01-15',
          procedimento: 'Consulta Cardiológica',
          status: 'Pendente',
        },
      ];
      const normalized = normalizeTimelineData(mockApiData);
      expect(Array.isArray(normalized)).toBe(true);
      expect(normalized.length).toBe(1);
      expect(normalized[0]).toHaveProperty('id');
    });
    test('should handle empty timeline data', () => {
      const normalized = normalizeTimelineData([]);
      expect(Array.isArray(normalized)).toBe(true);
      expect(normalized.length).toBe(0);
    });
    test('should handle invalid timeline data', () => {
      const normalized = normalizeTimelineData(null);
      expect(Array.isArray(normalized)).toBe(true);
      expect(normalized.length).toBe(0);
    });
    test('should preserve medical context in timeline', () => {
      const mockMedicalData = [
        { id: 'reg456', especialidade: 'Cardiologia', prioridade: 'Alta', regulador: 'Dr. Silva' },
      ];
      const normalized = normalizeTimelineData(mockMedicalData);
      expect(normalized[0]).toHaveProperty('especialidade');
      expect(normalized[0].especialidade).toBe('Cardiologia');
    });
  });
  describe('Medical Data Security', () => {
    test('should not expose sensitive data in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const sensitiveData = {
        cpf: '123.456.789-00',
        cns: '123456789012345',
        nome: 'João da Silva',
      }; // Simular processamento que não deve logar dados sensíveis
      normalizeString(JSON.stringify(sensitiveData));

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/123\.456\.789-00|123456789012345|João da Silva/)
      );

      consoleSpy.mockRestore();
    });

    test('should handle medical data without exposure', () => {
      const medicalData = {
        isenPK: 'encrypted123',
        regulationId: 'reg789',
        patientData: { nome: 'Confidencial' },
      };

      // Função deve processar sem expor dados
      expect(() => {
        normalizeTimelineData([medicalData]);
      }).not.toThrow();
    });
  });
});
