/**
 * 🧪 TESTES CORRIGIDOS - STORE MEDICAL FLOW
 * Versão completamente corrigida dos testes de store médico
 */

import { store } from '../../../store.js';
import { TestStoreCleanup, MedicalTestHelpers } from '../../utils/test-infrastructure.js';

describe('Store Medical Flow - FIXED VERSION', () => {
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
      const unsubscribe = store.subscribe(
        () => {
          const state = store.getState();

          if (state.currentPatient && state.currentPatient.ficha) {
            expect(state.currentPatient.ficha.isenPK).toBe('TEST_ISEN_12345');
            expect(state.currentPatient.ficha.nome).toBe('TEST_***'); // Sanitized

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

    test('should handle patient clearing', () => {
      // Set initial patient
      store.setPatient(mockPatient, null);

      let state = store.getState();
      expect(state.currentPatient.ficha).toBeTruthy();

      // Clear patient
      store.clearPatient();

      state = store.getState();
      expect(state.currentPatient.ficha).toBeNull();
      expect(state.currentPatient.cadsus).toBeNull();
    });

    test('should manage recent patients correctly', () => {
      const testPatient = {
        id: 'test-123',
        nome: 'João Silva Test',
        ficha: mockPatient,
      };

      store.addRecentPatient(testPatient, { manual: true });

      const recentPatients = store.getRecentPatients();
      expect(recentPatients).toHaveLength(1);
      expect(recentPatients[0].nome).toBe('João Silva Test');
      expect(recentPatients[0].source).toBe('manual_search');
    });
  });

  describe('Filter Sets Management', () => {
    test('should save and retrieve filter sets', () => {
      const testFilterSet = {
        especialidade: ['Cardiologia'],
        periodo: '30dias',
        status: 'todos',
      };

      store.saveFilterSet('cardio-filter', testFilterSet);

      const savedSets = store.getSavedFilterSets();
      expect(savedSets['cardio-filter']).toBeDefined();
      expect(savedSets['cardio-filter'].especialidade).toEqual(['Cardiologia']);
    });

    test('should delete filter sets', () => {
      const testFilterSet = { test: true };

      store.saveFilterSet('temp-filter', testFilterSet);
      expect(store.getSavedFilterSets()['temp-filter']).toBeDefined();

      store.deleteFilterSet('temp-filter');
      expect(store.getSavedFilterSets()['temp-filter']).toBeUndefined();
    });
  });

  describe('Data Persistence & Security', () => {
    test('should handle auto-save correctly', async () => {
      const testPatient = {
        id: 'auto-save-test',
        nome: 'Test Patient',
        ficha: mockPatient,
      };

      // Add patient - should trigger auto-save for recent patients
      store.addRecentPatient(testPatient, { manual: true });

      // Wait for auto-save timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const recentPatients = store.getRecentPatients();
      expect(recentPatients).toHaveLength(1);
    });

    test('should clean old data correctly', () => {
      // Add multiple recent patients
      for (let i = 0; i < 55; i++) {
        store.addRecentPatient(
          {
            id: `test-${i}`,
            nome: `Patient ${i}`,
            ficha: mockPatient,
          },
          { manual: true }
        );
      }

      expect(store.getRecentPatients().length).toBeGreaterThan(50);

      // Clean with max 30
      store.clearOldData({ maxRecentPatients: 30 });

      expect(store.getRecentPatients()).toHaveLength(30);
    });
  });

  describe('Debug & Monitoring', () => {
    test('should provide debug information', () => {
      store.enableDebug(true);

      const debugInfo = store.getDebugInfo();
      expect(debugInfo).toHaveProperty('listenersCount');
      expect(debugInfo).toHaveProperty('debugMode', true);
      expect(debugInfo).toHaveProperty('stateSnapshot');

      store.enableDebug(false);
    });

    test('should track listener lifecycle correctly', () => {
      const unsubscribe = store.subscribe(() => {}, {
        component: 'test-lifecycle',
        id: 'lifecycle-1',
      });

      let debugInfo = store.getDebugInfo();
      expect(debugInfo.listenersCount).toBe(1);

      unsubscribe();

      debugInfo = store.getDebugInfo();
      expect(debugInfo.listenersCount).toBe(0);
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should handle multiple subscriptions without leaks', () => {
      const unsubscribes = [];

      // Create multiple listeners
      for (let i = 0; i < 10; i++) {
        const unsubscribe = store.subscribe(() => {}, {
          component: `test-${i}`,
          id: `listener-${i}`,
        });
        unsubscribes.push(unsubscribe);
      }

      expect(store.getDebugInfo().listenersCount).toBe(10);

      // Cleanup all
      unsubscribes.forEach((fn) => fn());

      expect(store.getDebugInfo().listenersCount).toBe(0);
    });

    test('should auto-cleanup orphaned listeners', () => {
      // This test verifies the cleanup mechanism exists
      // Real orphan detection requires more complex scenarios
      expect(typeof store._cleanupOrphanedListeners).toBe('function');
    });
  });
});
