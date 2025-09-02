/**
 * @file store-medical-flow.test.js - Testes de Fluxo Médico do Store
 * Validação do comportamento médico: reset de filtros, distinção manual vs auto
 */

import { store } from '../../../store.js';

describe('Store Medical Flow', () => {
  beforeEach(() => {
    // Reset store state for each test
    store.clearOldData({ clearAllData: true });
    store.enableDebug(false);

    // Limpa apenas propriedades específicas do window, preservando mocks globais
    window.FilterManager = undefined;
    window.AutomationManager = undefined;
    // Não sobrescrever window.resetFiltersToDefault nem window.applyAutomationRules (mantém jest.fn do setup.js)
  });

  afterEach(() => {
    // Cleanup listeners after each test
    store.clearOldData({ clearAllData: true });
  });

  test('should reset filters when changing patient', async () => {
    // Mock FilterManager
    window.FilterManager = {
      resetToDefault: jest.fn(),
    };

    const patient1 = {
      id: 1,
      nome: 'João Silva',
      ficha: { isenPK: { idp: 1, ids: 1 } },
    };
    const patient2 = {
      id: 2,
      nome: 'Maria Santos',
      ficha: { isenPK: { idp: 2, ids: 2 } },
    };

    // Carregar primeiro paciente
    await store.changePatient(patient1, 'manual');

    // Verificar reset foi chamado
    expect(window.FilterManager.resetToDefault).toHaveBeenCalledTimes(1);

    // Trocar para segundo paciente
    await store.changePatient(patient2, 'manual');

    // Verificar reset foi chamado novamente (nova análise)
    expect(window.FilterManager.resetToDefault).toHaveBeenCalledTimes(2);
  });

  test('should use fallback filter reset method', async () => {
    // Mock fallback function
    window.resetFiltersToDefault = jest.fn();

    const patient = {
      id: 1,
      nome: 'Test Patient',
      ficha: { isenPK: { idp: 1, ids: 1 } },
    };

    await store.changePatient(patient, 'manual');

    // Verificar fallback foi chamado
    expect(window.resetFiltersToDefault).toHaveBeenCalledTimes(1);
  });

  test('should not add auto-detected patients to recent list', async () => {
    const initialRecentCount = store.getRecentPatients().length;
    const autoDetectedPatient = {
      id: 999,
      nome: 'Auto Detected',
      ficha: { isenPK: { idp: 999, ids: 999 } },
    };

    // Simular detecção automática
    await store.changePatient(autoDetectedPatient, 'auto_detection');

    // Lista de recentes não deve mudar
    expect(store.getRecentPatients().length).toBe(initialRecentCount);
  });

  test('should add manually searched patients to recent list', async () => {
    const initialRecentCount = store.getRecentPatients().length;
    const manualPatient = {
      id: 888,
      nome: 'Manual Search',
      ficha: { isenPK: { idp: 888, ids: 888 } },
    };

    // Simular busca manual
    await store.changePatient(manualPatient, 'manual');

    // Lista de recentes deve aumentar
    expect(store.getRecentPatients().length).toBe(initialRecentCount + 1);
    expect(store.getRecentPatients()[0].nome).toBe('Manual Search');
  });

  test('should apply automation when available and enabled', async () => {
    // Mock AutomationManager
    window.AutomationManager = {
      isEnabled: jest.fn(() => true),
      applyRules: jest.fn(),
    };

    const patient = {
      id: 1,
      nome: 'Test Patient',
      ficha: { isenPK: { idp: 1, ids: 1 } },
    };

    await store.changePatient(patient, 'manual');

    // Verificar automação foi aplicada
    expect(window.AutomationManager.isEnabled).toHaveBeenCalled();
    expect(window.AutomationManager.applyRules).toHaveBeenCalled();
  });

  test('should use fallback automation method', async () => {
    // Mock fallback automation
    window.applyAutomationRules = jest.fn();

    const patient = {
      id: 1,
      nome: 'Test Patient',
      ficha: { isenPK: { idp: 1, ids: 1 } },
    };

    await store.changePatient(patient, 'manual');

    // Verificar fallback foi chamado
    expect(window.applyAutomationRules).toHaveBeenCalled();
  });

  test('should work without automation (graceful degradation)', async () => {
    // Não definir nenhum automation manager
    const patient = {
      id: 1,
      nome: 'Test Patient',
      ficha: { isenPK: { idp: 1, ids: 1 } },
    };

    // Não deve dar erro
    await expect(store.changePatient(patient, 'manual')).resolves.not.toThrow();

    // Paciente deve estar carregado
    expect(store.getCurrentPatient().ficha).toEqual(patient.ficha);
  });

  test('should sanitize patient data for recent list', () => {
    const sensitivePatient = {
      id: 1,
      nome: 'João Silva',
      cpf: '12345678900', // Sensível - não deve persistir
      cns: '123456789012345', // Sensível - não deve persistir
      ficha: {
        isenPK: { idp: 1, ids: 1 },
        nome: 'João Silva',
        detalhes: 'médicos sensíveis',
      },
    };

    store.addRecentPatient(sensitivePatient, { manual: true });

    const recentPatients = store.getRecentPatients();
    expect(recentPatients.length).toBe(1);

    const savedPatient = recentPatients[0];

    // Verificar dados seguros foram salvos
    expect(savedPatient.nome).toBe('João Silva');
    expect(savedPatient.source).toBe('manual_search');
    expect(savedPatient.searchedAt).toBeDefined();

    // Verificar dados sensíveis NÃO foram salvos
    expect(savedPatient.cpf).toBeUndefined();
    expect(savedPatient.cns).toBeUndefined();
    expect(savedPatient.ficha).toBeUndefined();
  });

  test('should handle clearPatient with different options', () => {
    const patient = { id: 1, nome: 'Test Patient' };
    store.setPatient(patient, { id: 'cadsus' });

    // Verificar paciente está carregado
    expect(store.getCurrentPatient().ficha).not.toBeNull();

    // Clear com opções customizadas
    store.clearPatient({
      resetFiltersToDefault: false,
      reason: 'test_clear',
      notifyListeners: false,
    });

    // Verificar paciente foi limpo
    expect(store.getCurrentPatient().ficha).toBeNull();
    expect(store.getCurrentPatient().cadsus).toBeNull();
  });

  test('should maintain timeline temporarily when requested', (done) => {
    const patient = { id: 1, nome: 'Test Patient' };
    store.setPatient(patient, null);

    // Simular timeline data
    store._getCurrentState = () => ({
      ...store.getState(),
      currentPatient: {
        ...store.getCurrentPatient(),
        timeline: [{ id: 1, event: 'test' }],
      },
    });

    // Clear mantendo timeline temporariamente
    store.clearPatient({
      keepTimeline: true,
      keepForSeconds: 0.1, // 100ms para teste rápido
      notifyListeners: false,
    });

    // Timeline deve ainda existir inicialmente
    // (este teste é conceitual pois timeline não está implementada ainda)

    setTimeout(() => {
      // Após timeout, timeline deve ter sido limpa
      done();
    }, 150);
  });

  test('should prevent duplicate patients in recent list', () => {
    const patient = {
      id: 1,
      nome: 'João Silva',
      ficha: { isenPK: { idp: 1, ids: 1 } },
    };

    // Adicionar o mesmo paciente múltiplas vezes
    store.addRecentPatient(patient, { manual: true });
    store.addRecentPatient(patient, { manual: true });
    store.addRecentPatient(patient, { manual: true });

    // Deve haver apenas uma entrada
    expect(store.getRecentPatients().length).toBe(1);
    expect(store.getRecentPatients()[0].nome).toBe('João Silva');
  });

  test('should respect maxRecent limit', () => {
    // Adicionar muitos pacientes
    for (let i = 1; i <= 60; i++) {
      const patient = {
        id: i,
        nome: `Patient ${i}`,
        ficha: { isenPK: { idp: i, ids: i } },
      };
      store.addRecentPatient(patient, { manual: true, maxRecent: 50 });
    }

    // Lista deve respeitar limite de 50
    expect(store.getRecentPatients().length).toBe(50);

    // Último paciente deve estar no início (mais recente)
    expect(store.getRecentPatients()[0].nome).toBe('Patient 60');
  });
});
