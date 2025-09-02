/**
 * @file store-performance.test.js - Testes de Performance do Store
 * Validação de performance com muitos listeners e dados
 */

import { store } from '../../../store.js';

describe('Store Performance', () => {
  beforeEach(() => {
    // Reset store state for each test
    store.clearOldData({ clearAllData: true });
    store.enableDebug(false);
  });

  afterEach(() => {
    // Cleanup listeners after each test
    store.clearOldData({ clearAllData: true });
  });

  test('should handle many listeners efficiently', () => {
    const start = performance.now();

    // Adicionar 1000 listeners
    const unsubscribes = [];
    for (let i = 0; i < 1000; i++) {
      const unsubscribe = store.subscribe(() => {
        // Empty listener for performance test
      });
      unsubscribes.push(unsubscribe);
    }

    // Notificar todos os listeners
    store.setPatient({ id: 'test' }, null);

    const end = performance.now();

    // Não deve demorar mais que 300ms (tolerância para CI/lento)
    expect(end - start).toBeLessThan(300);

    // Cleanup
    unsubscribes.forEach((unsub) => unsub());

    // Verificar que todos foram removidos
    expect(store.getDebugInfo().listenersCount).toBe(0);
  });

  test('should maintain performance with large recent patients list', () => {
    const manyPatients = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      nome: `Patient ${i}`,
      ficha: { isenPK: { idp: i, ids: i } },
    }));

    const start = performance.now();

    // Simular adição sequencial (como uso real)
    manyPatients.forEach((patient) => {
      store.addRecentPatient(patient, { manual: true });
    });

    const end = performance.now();

    // Operação deve ser rápida mesmo com muitos pacientes (tolerância para CI/lento)
    expect(end - start).toBeLessThan(500);

    // Lista deve ser limitada automaticamente
    expect(store.getRecentPatients().length).toBeLessThanOrEqual(50);
  });

  test('should perform fast notifications with many listeners', () => {
    // Adicionar 500 listeners
    const unsubscribes = [];
    for (let i = 0; i < 500; i++) {
      const unsubscribe = store.subscribe(() => {
        // Simulate some work
        Math.random() * 100;
      });
      unsubscribes.push(unsubscribe);
    }

    const iterations = 10;
    const times = [];

    // Medir múltiplas notificações
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      store.setPatient({ id: `test-${i}` }, null);
      const end = performance.now();
      times.push(end - start);
    }

    // Calcular tempo médio
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

    // Tempo médio deve ser razoável (tolerância para CI/lento)
    expect(averageTime).toBeLessThan(150);

    // Cleanup
    unsubscribes.forEach((unsub) => unsub());
  });

  test('should handle rapid state changes efficiently', () => {
    const start = performance.now();

    // Simular mudanças rápidas de estado
    for (let i = 0; i < 100; i++) {
      store.setPatient({ id: i, nome: `Patient ${i}` }, null);
      store.clearPatient({ notifyListeners: false });
    }

    const end = performance.now();

    // Operações rápidas devem ser eficientes (tolerância para CI/lento)
    expect(end - start).toBeLessThan(300);
  });

  test('should efficiently cleanup old data', () => {
    // Adicionar muitos dados
    const manyPatients = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      nome: `Patient ${i}`,
      ficha: { isenPK: { idp: i, ids: i } },
    }));

    // Adicionar todos os pacientes
    manyPatients.forEach((patient) => {
      store.addRecentPatient(patient, { manual: true });
    });

    // Adicionar muitos filtros salvos
    for (let i = 0; i < 50; i++) {
      store.saveFilterSet(`filter-${i}`, { status: `status-${i}` });
    }

    const start = performance.now();

    // Cleanup com limites
    store.clearOldData({
      maxRecentPatients: 10,
      maxFilterSets: 5,
    });

    const end = performance.now();

    // Cleanup deve ser rápido (tolerância para CI/lento)
    expect(end - start).toBeLessThan(150);

    // Verificar limites foram aplicados
    expect(store.getRecentPatients().length).toBe(10);
    expect(Object.keys(store.getSavedFilterSets()).length).toBe(5);
  });

  test('should handle memory cleanup without performance impact', () => {
    store.enableDebug(true);

    // Adicionar e remover muitos listeners
    for (let cycle = 0; cycle < 10; cycle++) {
      const unsubscribes = [];

      // Adicionar 100 listeners
      for (let i = 0; i < 100; i++) {
        const unsubscribe = store.subscribe(() => {});
        unsubscribes.push(unsubscribe);
      }

      // Trigger notificações para ativar auto-cleanup
      for (let i = 0; i < 15; i++) {
        store.setPatient({ id: `test-${cycle}-${i}` }, null);
      }

      // Remover todos os listeners
      unsubscribes.forEach((unsub) => unsub());
    }

    // Verificar que não há vazamento de listeners
    expect(store.getDebugInfo().listenersCount).toBe(0);

    store.enableDebug(false);
  });

  test('should maintain consistent performance across operations', () => {
    const operationTimes = [];

    // Medir diferentes operações
    const operations = [
      () => store.setPatient({ id: 'test' }, null),
      () => store.clearPatient(),
      () => store.addRecentPatient({ id: 1, nome: 'Test' }, { manual: true }),
      () => store.saveFilterSet('test', { status: 'all' }),
      () => store.getState(),
      () => store.getRecentPatients(),
      () => store.getSavedFilterSets(),
    ];

    operations.forEach((operation) => {
      const times = [];

      // Executar cada operação 50 vezes
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        operation();
        const end = performance.now();
        times.push(end - start);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      operationTimes.push(averageTime);

      // Cada operação deve ser rápida (tolerância para CI/lento)
      expect(averageTime).toBeLessThan(40);
    });

    // Performance deve ser consistente entre operações
    const maxTime = Math.max(...operationTimes);
    const minTime = Math.min(...operationTimes);
    const variance = maxTime - minTime;

    // Variância não deve ser muito alta (tolerância para CI/lento)
    expect(variance).toBeLessThan(60);
  });

  test('should handle stress test with combined operations', () => {
    const start = performance.now();

    // Simular uso intenso
    for (let i = 0; i < 100; i++) {
      // Adicionar listeners
      const unsubscribe1 = store.subscribe(() => {});
      const unsubscribe2 = store.subscribe(() => {});

      // Operações de paciente
      store.setPatient({ id: i, nome: `Patient ${i}` }, null);
      store.addRecentPatient({ id: i, nome: `Patient ${i}` }, { manual: true });

      // Operações de filtros
      store.saveFilterSet(`filter-${i}`, { status: `status-${i}` });

      // Cleanup periódico mais frequente
      if (i % 5 === 0) {
        store.clearOldData({ maxRecentPatients: 10, maxFilterSets: 5 });
      }

      // Remover listeners
      unsubscribe1();
      unsubscribe2();
    }

    const end = performance.now();

    // Teste de stress deve completar em tempo razoável (tolerância para CI/lento)
    expect(end - start).toBeLessThan(1500);

    // Verificar estado final consistente com cleanup mais frequente
    expect(store.getRecentPatients().length).toBeLessThanOrEqual(50); // Limite padrão mais alto
    expect(Object.keys(store.getSavedFilterSets()).length).toBeLessThanOrEqual(20); // Limite padrão mais alto
    expect(store.getDebugInfo().listenersCount).toBe(0);
  });
});
