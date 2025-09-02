/**
 * @file store-persistence.test.js - Testes de Persistência Médica do Store
 * Validação de armazenamento seguro e compliance LGPD/HIPAA
 */

import { store } from '../../../store.js';

describe('Store Medical Persistence', () => {
  beforeEach(() => {
    // Reset store state for each test
    store.clearOldData({ clearAllData: true });
    store.enableDebug(false);
    // Garante que global.chrome existe
    if (!global.chrome) global.chrome = {};
    // Garante que global.chrome.storage existe
    if (!global.chrome.storage) global.chrome.storage = {};
    // Garante que global.chrome.storage.local existe
    if (!global.chrome.storage.local) {
      // Cria um mock básico se não existir
      global.chrome.storage.local = {
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({}),
        remove: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
      };
    }
    // Limpa mocks do chrome.storage.local
    Object.values(global.chrome.storage.local).forEach(
      (fn) => fn && fn.mockClear && fn.mockClear()
    );
  });

  afterEach(() => {
    // Cleanup
    store.clearOldData({ clearAllData: true });
    jest.clearAllMocks();
  });

  test('should only persist allowed medical data', async () => {
    const sensitivePatient = {
      id: 1,
      nome: 'João Silva',
      cpf: '12345678900', // Sensível - não deve persistir
      cns: '123456789012345', // Sensível - não deve persistir
      ficha: {
        isenPK: { idp: 1, ids: 1 },
        detalhes: 'médicos sensíveis',
      },
    };

    // Definir estado com dados sensíveis
    store.setPatient(sensitivePatient, null);
    store.addRecentPatient(sensitivePatient, { manual: true });

    // Aguardar auto-save
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Verificar que apenas dados seguros foram salvos
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
      recentPatients: [
        expect.objectContaining({
          id: expect.any(Number), // ID pode ser número
          nome: 'João Silva',
          source: 'manual_search',
        }),
      ],
    });

    // Verificar que dados sensíveis NÃO foram salvos
    const savedData = global.chrome.storage.local.set.mock.calls[0][0];
    expect(savedData.currentPatient).toBeUndefined();
    expect(savedData.recentPatients[0].cpf).toBeUndefined();
    expect(savedData.recentPatients[0].cns).toBeUndefined();
    expect(savedData.recentPatients[0].ficha).toBeUndefined();
  });

  test('should not persist current patient data', async () => {
    const patient = { id: 1, nome: 'Test Patient', ficha: { dados: 'sensíveis' } };

    store.setPatient(patient, null);
    await store.saveToStorage();

    // currentPatient nunca deve ser salvo
    expect(global.chrome.storage.local.set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        currentPatient: expect.anything(),
      })
    );
  });

  test('should restore session correctly after restart', async () => {
    // Simular dados persistidos
    const persistedData = {
      recentPatients: [{ id: '1-1', nome: 'João Silva', searchedAt: Date.now() }],
      savedFilterSets: { favorito: { status: 'all' } },
    };

    global.chrome.storage.local.get.mockResolvedValue(persistedData);

    // Carregar dados
    await store.loadFromStorage();

    // Verificar dados foram carregados
    expect(store.getRecentPatients()).toEqual(persistedData.recentPatients);
    expect(store.getSavedFilterSets()).toEqual(persistedData.savedFilterSets);

    // Verificar que currentPatient permanece vazio (nova sessão = nova análise)
    expect(store.getCurrentPatient().ficha).toBeNull();
  });

  test('should handle storage errors gracefully', async () => {
    // Mock storage error
    const storageError = new Error('Storage quota exceeded');
    global.chrome.storage.local.set.mockRejectedValue(storageError);

    const patient = { id: 1, nome: 'Test Patient' };
    store.addRecentPatient(patient, { manual: true });

    // Não deve gerar erro não tratado
    await expect(store.saveToStorage(['recentPatients'])).resolves.not.toThrow();
  });

  test('should filter only allowed keys for persistence', async () => {
    const testData = {
      recentPatients: [{ id: 1, nome: 'Test' }],
      savedFilterSets: { test: {} },
      currentPatient: { ficha: { sensitive: 'data' } }, // Não permitido
      secretKey: 'should-not-save', // Não permitido
    };

    // Tentar salvar todas as chaves
    Object.keys(testData).forEach((key) => {
      if (key === 'recentPatients') {
        store.setRecentPatients(testData[key]);
      } else if (key === 'savedFilterSets') {
        store.setSavedFilterSets(testData[key]);
      }
    });

    await store.saveToStorage(Object.keys(testData));

    // Verificar que apenas chaves permitidas foram salvas
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
      recentPatients: testData.recentPatients,
      savedFilterSets: testData.savedFilterSets,
      // currentPatient e secretKey NÃO devem estar presentes
    });

    const savedData = global.chrome.storage.local.set.mock.calls[0][0];
    expect(savedData.currentPatient).toBeUndefined();
    expect(savedData.secretKey).toBeUndefined();
  });

  test('should use browser API when available', async () => {
    // Mock browser API (Firefox)
    const mockBrowserStorage = {
      local: {
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({}),
      },
    };
    global.browser = { storage: mockBrowserStorage };
    delete global.chrome;

    const patient = { id: 1, nome: 'Test Patient' };
    store.addRecentPatient(patient, { manual: true });

    await store.saveToStorage(['recentPatients']);

    // Verificar que browser API foi usado
    expect(mockBrowserStorage.local.set).toHaveBeenCalled();
  });

  test('should not save when no persistent keys provided', async () => {
    await store.saveToStorage(['nonExistentKey', 'anotherInvalidKey']);

    // Storage não deve ser chamado
    expect(global.chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('should auto-save only specific keys', async () => {
    store.enableDebug(true);

    const patient = { id: 1, nome: 'Test Patient', ficha: { data: 'test' } };

    // Adicionar aos recentes (deve trigger auto-save)
    store.addRecentPatient(patient, { manual: true });

    // Aguardar auto-save
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Verificar que apenas recentPatients foi salvo
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
      recentPatients: expect.any(Array),
    });

    const savedData = global.chrome.storage.local.set.mock.calls[0][0];
    expect(Object.keys(savedData)).toEqual(['recentPatients']);
  });

  test('should handle partial data load gracefully', async () => {
    // Simular dados parciais
    const partialData = {
      recentPatients: [{ id: '1', nome: 'Test' }],
      // savedFilterSets ausente
    };

    global.chrome.storage.local.get.mockResolvedValue(partialData);

    await store.loadFromStorage();

    // Verificar dados parciais foram carregados
    expect(store.getRecentPatients()).toEqual(partialData.recentPatients);

    // savedFilterSets deve manter valor padrão
    expect(store.getSavedFilterSets()).toEqual({});
  });

  test('should return empty object on load error', async () => {
    const loadError = new Error('Storage access denied');
    global.chrome.storage.local.get.mockRejectedValue(loadError);

    const result = await store.loadFromStorage();

    // Deve retornar objeto vazio em caso de erro
    expect(result).toEqual({});

    // Estado do store não deve ser afetado
    expect(store.getRecentPatients()).toEqual([]);
    expect(store.getSavedFilterSets()).toEqual({});
  });

  test('should debug log persistence operations', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    store.enableDebug(true);

    const patient = { id: 1, nome: 'Test Patient' };
    store.addRecentPatient(patient, { manual: true });

    await store.saveToStorage(['recentPatients']);

    // Verificar logs de debug
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Store] Dados médicos persistidos'),
      expect.any(Array)
    );

    consoleSpy.mockRestore();
  });
});
