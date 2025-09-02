/**
 * @file store-memory.test.js - Testes de Memory Management do Store
 * Validação de prevenção de memory leaks e cleanup de listeners
 */

import { store } from '../../../store.js';

describe('Store Memory Management', () => {
  beforeEach(() => {
    // Reset store state for each test
    store.clearOldData({ clearAllData: true });
    store.enableDebug(false);
  });

  afterEach(() => {
    // Cleanup listeners after each test
    store.clearOldData({ clearAllData: true });
  });

  test('should not leak listeners', () => {
    const initialCount = store.getDebugInfo().listenersCount;

    // Adicionar 100 listeners
    const unsubscribes = [];
    for (let i = 0; i < 100; i++) {
      const unsubscribe = store.subscribe(() => {}, {
        component: `test-component-${i}`,
        description: 'Test listener',
      });
      unsubscribes.push(unsubscribe);
    }

    expect(store.getDebugInfo().listenersCount).toBe(initialCount + 100);

    // Remover todos
    unsubscribes.forEach((unsub) => unsub());

    expect(store.getDebugInfo().listenersCount).toBe(initialCount);
  });

  test('should cleanup old data correctly', () => {
    // Adicionar muitos pacientes
    const manyPatients = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Patient ${i}`,
      searchedAt: Date.now(),
    }));

    store.setRecentPatients(manyPatients);
    expect(store.getRecentPatients().length).toBe(100);

    // Cleanup com limite
    store.clearOldData({ maxRecentPatients: 50 });
    expect(store.getRecentPatients().length).toBe(50);
  });

  test('should track listener metadata correctly', () => {
    store.enableDebug(true);

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = store.subscribe(listener1, {
      component: 'test-component-1',
      description: 'First test listener',
    });

    const unsubscribe2 = store.subscribe(listener2, {
      component: 'test-component-2',
      description: 'Second test listener',
    });

    expect(store.getDebugInfo().listenersCount).toBe(2);

    // Remove primeiro listener
    unsubscribe1();
    expect(store.getDebugInfo().listenersCount).toBe(1);

    // Remove segundo listener
    unsubscribe2();
    expect(store.getDebugInfo().listenersCount).toBe(0);
  });

  test('should handle listener errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Adicionar listener que gera erro
    const errorListener = jest.fn(() => {
      throw new Error('Test listener error');
    });

    store.subscribe(errorListener);

    // Trigger notification que deve capturar erro
    store.setPatient({ test: 'data' }, null);

    // Listener deve ter sido chamado
    expect(errorListener).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should maintain performance with many listeners', () => {
    const start = performance.now();

    // Adicionar 1000 listeners
    const unsubscribes = [];
    for (let i = 0; i < 1000; i++) {
      const unsubscribe = store.subscribe(() => {}, {
        component: `perf-test-${i}`,
      });
      unsubscribes.push(unsubscribe);
    }

    // Notificar
    store.setPatient({ id: 'test' }, null);

    const end = performance.now();

    // Não deve demorar mais que 100ms
    expect(end - start).toBeLessThan(100);

    // Cleanup
    unsubscribes.forEach((unsub) => unsub());
  });

  test('should update memory stats when available', () => {
    // Mock performance.memory se não existir
    const originalMemory = global.performance?.memory;

    global.performance = global.performance || {};
    global.performance.memory = {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
      totalJSHeapSize: 1024 * 1024 * 20, // 20MB
      jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
    };

    store.enableDebug(true);
    store._updateMemoryStats();

    const debugInfo = store.getDebugInfo();
    expect(debugInfo.memoryUsage).toBeDefined();
    expect(debugInfo.memoryUsage.used).toBe(10);
    expect(debugInfo.memoryUsage.total).toBe(20);
    expect(debugInfo.memoryUsage.limit).toBe(100);

    // Restore original
    if (originalMemory) {
      global.performance.memory = originalMemory;
    } else {
      delete global.performance.memory;
    }
  });

  test('should auto-cleanup every 100 notifications', () => {
    const cleanupSpy = jest.spyOn(store, '_cleanupOrphanedListeners');

    // Trigger 100 notifications
    for (let i = 0; i < 100; i++) {
      store.setPatient({ id: `test-${i}` }, null);
    }

    // Cleanup deve ter sido chamado pelo menos uma vez
    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    cleanupSpy.mockRestore();
  });

  test('should clear all data when requested', () => {
    // Adicionar dados de teste
    store.setPatient({ id: 'test' }, { id: 'cadsus' });
    store.setRecentPatients([{ id: 1, name: 'Test' }]);
    store.setSavedFilterSets({ test: { filter: 'value' } });

    // Verificar dados existem
    expect(store.getCurrentPatient().ficha).not.toBeNull();
    expect(store.getRecentPatients().length).toBe(1);
    expect(Object.keys(store.getSavedFilterSets()).length).toBe(1);

    // Clear all data
    store.clearOldData({ clearAllData: true });

    // Verificar dados foram limpos
    expect(store.getCurrentPatient().ficha).toBeNull();
    expect(store.getRecentPatients().length).toBe(0);
    expect(Object.keys(store.getSavedFilterSets()).length).toBe(0);
  });
});
