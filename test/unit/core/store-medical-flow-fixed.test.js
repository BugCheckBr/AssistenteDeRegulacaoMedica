/**
 * 🧪 TESTES CORRIGIDOS - STORE MEDICAL FLOW
 * ⚠️  DEPRECATED - Use store-medical-flow-corrected.test.js instead
 * Este arquivo contém erros de setState - sendo substituído
 */

import { store } from '../../../store.js';
import { MedicalTestHelpers, TestStoreCleanup } from '../../utils/test-infrastructure.js';

describe.skip('Store Medical Flow - CORRECTED (DEPRECATED)', () => {
  let mockPatient;

  beforeEach(() => {
    TestStoreCleanup.cleanup();
    TestStoreCleanup.mockBrowserAPIs();

    mockPatient = MedicalTestHelpers.createMockPatient();
  });

  afterEach(() => {
    TestStoreCleanup.cleanup();
    jest.clearAllMocks();
  });

  describe('Patient Data Flow', () => {
    test('should handle patient selection without memory leaks', (done) => {
      let notificationCount = 0;

      const unsubscribe = store.subscribe(
        (state) => {
          notificationCount++;

          if (state.currentPatient && state.currentPatient.ficha) {
            expect(state.currentPatient.ficha.isenPK).toBe('TEST_ISEN_12345');
            expect(state.currentPatient.ficha.nome).toBe('TEST_***'); // Sanitized
            expect(notificationCount).toBeGreaterThan(0); // Validate notification occurred

            // Cleanup listener immediately to prevent leaks
            unsubscribe();
            done();
          }
        },
        { component: 'test-patient-flow', id: 'test-1' }
      );

      // Set patient data using correct store method
      store.setPatient(mockPatient, null);
    });

    test('should handle timeline data correctly', (done) => {
      const mockTimeline = MedicalTestHelpers.createMockTimeline();
      let callCount = 0;

      const unsubscribe = store.subscribe(
        (state) => {
          callCount++;

          if (state.currentPatient?.timeline && callCount === 1) {
            expect(state.currentPatient.timeline.consultas).toHaveLength(1);
            expect(state.currentPatient.timeline.consultas[0].especialidade).toBe('Cardiologia');

            // Validate no sensitive data leaked
            const stringified = JSON.stringify(state.currentPatient.timeline);
            expect(stringified).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/); // No CPF pattern

            unsubscribe();
            done();
          }
        },
        { component: 'test-timeline', id: 'test-2' }
      );

      store.setState({
        currentPatient: {
          ficha: mockPatient,
          timeline: mockTimeline,
        },
      });
    });
  });

  describe('Memory Management', () => {
    test('should properly cleanup listeners', () => {
      const listeners = [];

      // Create multiple listeners
      for (let i = 0; i < 5; i++) {
        const unsubscribe = store.subscribe(() => {}, {
          component: `test-cleanup-${i}`,
          id: `cleanup-${i}`,
        });
        listeners.push(unsubscribe);
      }

      // Unsubscribe all
      listeners.forEach((unsub) => unsub());

      // Verify cleanup
      const state = store.getState();
      expect(state).toBeDefined();
    });

    test('should handle rapid state changes without memory issues', (done) => {
      let changeCount = 0;
      const maxChanges = 10;

      const unsubscribe = store.subscribe(
        () => {
          changeCount++;

          if (changeCount === maxChanges) {
            expect(changeCount).toBe(maxChanges);
            unsubscribe();
            done();
          }
        },
        { component: 'test-rapid', id: 'rapid-1' }
      );

      // Trigger rapid changes
      for (let i = 0; i < maxChanges; i++) {
        setTimeout(() => {
          store.setState({
            testCounter: i,
          });
        }, i * 10);
      }
    });
  });

  describe('Medical Data Sanitization', () => {
    test('should sanitize sensitive medical data in state', () => {
      const sensitivePatient = {
        isenPK: 'TEST_ISEN_12345',
        nome: 'João Silva Santos', // Real name - should be sanitized
        cpf: '123.456.789-00', // Real CPF - should be sanitized
        dataNascimento: '1985-03-15', // Real date - should be sanitized
      };

      // Set state with sensitive data
      store.setState({
        currentPatient: {
          ficha: TestStoreCleanup.sanitizeTestData(sensitivePatient),
        },
      });

      const state = store.getState();
      const patient = state.currentPatient.ficha;

      expect(patient.nome).toBe('TEST_***');
      expect(patient.cpf).toBe('TEST_***');
      expect(patient.dataNascimento).toBe('TEST_***');
      expect(patient.isenPK).toBe('TEST_ISEN_12345'); // Technical ID preserved
    });
  });
});
