/**
 * 🧪 FASE 1 - SEMANA 1: Test Infrastructure Fixes
 * Correções críticas para testes instáveis
 */

import { store } from '../../store.js';

// Test helper to clean up store listeners between tests
export class TestStoreCleanup {
  static cleanup() {
    // Force cleanup of all listeners to prevent memory leaks in tests
    if (store._clearAllListeners) {
      store._clearAllListeners();
    }

    // Reset store state
    if (store._resetState) {
      store._resetState();
    }

    // Disable debug mode in tests to reduce console noise
    if (store.disableDebug) {
      store.disableDebug();
    }
  }

  static mockBrowserAPIs() {
    // Mock browser storage APIs consistently
    global.chrome = global.chrome || {};
    global.chrome.storage = global.chrome.storage || {};

    global.chrome.storage.local = {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue(),
    };

    global.chrome.storage.session = {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue(),
    };

    global.chrome.runtime = {
      sendMessage: jest.fn(),
      onMessage: { addListener: jest.fn() },
      getManifest: jest.fn(() => ({ version: '3.3.7-test' })),
    };
  }

  static sanitizeTestData(data) {
    // Ensure no real medical data is used in tests
    const sensitiveFields = ['cpf', 'cns', 'nome', 'nomeMae', 'dataNascimento'];
    const sanitized = { ...data };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = 'TEST_***';
      }
    });

    return sanitized;
  }
}

// Enhanced medical test helpers
export class MedicalTestHelpers {
  static createMockPatient() {
    return TestStoreCleanup.sanitizeTestData({
      isenPK: 'TEST_ISEN_12345',
      nome: 'PACIENTE_TESTE',
      cpf: '000.000.000-00', // Will be sanitized
      dataNascimento: '1990-01-01', // Will be sanitized
    });
  }

  static createMockTimeline() {
    return {
      consultas: [
        {
          data: '2024-01-15',
          especialidade: 'Cardiologia',
          medico: 'DR_TESTE_***',
        },
      ],
      exames: [
        {
          data: '2024-02-20',
          tipo: 'Raio-X',
          resultado: 'NORMAL',
        },
      ],
      regulacoes: [
        {
          reguId: 'REG_TEST_123',
          status: 'PENDENTE',
          data: '2024-03-01',
        },
      ],
    };
  }

  static createMockSigssResponse(url) {
    if (url.includes('consultarPaciente')) {
      return {
        rows: [
          {
            cell: [
              'TEST_ID',
              'PACIENTE_TESTE_***',
              '1990-01-01',
              'M',
              'MAE_TESTE_***',
              // ... more sanitized fields
            ],
          },
        ],
      };
    }

    if (url.includes('timeline')) {
      return MedicalTestHelpers.createMockTimeline();
    }

    return {};
  }
}

export default { TestStoreCleanup, MedicalTestHelpers };
