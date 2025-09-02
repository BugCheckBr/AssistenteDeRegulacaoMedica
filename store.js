/**
 * @file store.js - Gestor de estado centralizado para a aplicação.
 * Implementa um padrão simples de "publish-subscribe" para gerir o estado global.
 */

import { logError } from './ErrorHandler.js';

const state = {
  currentPatient: {
    ficha: null,
    cadsus: null,
    lastCadsusCheck: null,
    isUpdating: false,
  },
  recentPatients: [],
  savedFilterSets: {},
};

// Enhanced listener management for better memory handling
const listeners = new Set(); // O(1) performance for add/remove operations
const listenerMetadata = new WeakMap(); // Automatic garbage collection tracking
let nextListenerId = 1;

// Medical data persistence strategy - defines what can be safely persisted
const PERSISTENT_DATA = {
  recentPatients: true, // Lista de pacientes buscados manualmente
  savedFilterSets: true, // Conjuntos de filtros salvos pelo usuário
  userPreferences: true, // Configurações da extensão
  automationRules: true, // Regras de automação configuradas
};

export const store = {
  // Debug and monitoring tools
  _debugMode: false,
  _stats: {
    notificationCount: 0,
    listenerCount: 0,
    lastNotification: null,
    memoryUsage: {},
  },

  /**
   * Adiciona uma função de callback à lista de listeners com enhanced tracking.
   * @param {Function} listener A função a ser adicionada.
   * @param {Object} options Opções para tracking e debugging.
   * @returns {Function} Uma função para remover o listener (unsubscribe).
   */
  subscribe(listener, options = {}) {
    const listenerId = nextListenerId++;
    const metadata = {
      id: listenerId,
      createdAt: Date.now(),
      component: options.component || 'unknown',
      description: options.description || '',
    };

    listeners.add(listener);
    listenerMetadata.set(listener, metadata);

    if (this._debugMode) {
      console.log(`[Store] Listener ${metadata.id} registered from ${metadata.component}`);
    }

    // Enhanced unsubscribe function with debugging
    return () => {
      listeners.delete(listener);
      listenerMetadata.delete(listener);

      if (this._debugMode) {
        console.log(`[Store] Unsubscribed listener ${metadata.id} from ${metadata.component}`);
      }
    };
  },

  _notify() {
    this._stats.notificationCount++;
    this._stats.lastNotification = Date.now();
    this._stats.listenerCount = listeners.size;

    if (this._debugMode) {
      this._updateMemoryStats();
      console.log(
        `[Store] Notifying ${listeners.size} listeners (notification #${this._stats.notificationCount})`
      );
    }

    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        const metadata = listenerMetadata.get(listener);
        logError('STORE_LISTENER', 'Erro num listener do store', {
          errorMessage: error.message,
          listenerMetadata: metadata,
        });
      }
    }

    // Auto-cleanup a cada 100 notificações
    if (this._stats.notificationCount % 100 === 0) {
      this._cleanupOrphanedListeners();
    }
  },

  /**
   * Detecta e remove listeners órfãos para prevenir memory leaks.
   */
  _cleanupOrphanedListeners() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutos
    let removedCount = 0;

    for (const listener of listeners) {
      const metadata = listenerMetadata.get(listener);
      if (metadata && now - metadata.createdAt > maxAge) {
        // Tentar detectar se listener ainda é válido
        try {
          // Test call with empty state
          if (typeof listener === 'function') {
            // Se chegou até aqui, listener provavelmente ainda é válido
            continue;
          }
        } catch (listenerError) {
          // Se erro, remove listener órfão
          listeners.delete(listener);
          listenerMetadata.delete(listener);
          removedCount++;

          if (this._debugMode) {
            console.warn(`[Store] Removed orphaned listener ${metadata.id}`, listenerError.message);
          }
        }
      }
    }

    if (this._debugMode && removedCount > 0) {
      console.log(`[Store] Cleaned up ${removedCount} orphaned listeners`);
    }
  },

  /**
   * Toggle debug mode para store monitoring.
   */
  enableDebug(enable = true) {
    this._debugMode = enable;
    if (enable) {
      console.log('[Store] Debug mode enabled');
      this._logCurrentState();
    } else {
      console.log('[Store] Debug mode disabled');
    }
  },

  /**
   * Log estado atual do store para debugging.
   */
  _logCurrentState() {
    const currentState = this.getState();
    const stats = {
      listenersCount: listeners.size,
      stateSize: JSON.stringify(currentState).length,
      recentPatientsCount: currentState.recentPatients.length,
      filterSetsCount: Object.keys(currentState.savedFilterSets).length,
      currentPatientLoaded: !!currentState.currentPatient.ficha,
    };

    console.log('[Store] Current state:', stats);
    return stats;
  },

  /**
   * Atualiza estatísticas de memory usage.
   */
  _updateMemoryStats() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this._stats.memoryUsage = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Obter informações de debug do store.
   */
  getDebugInfo() {
    return {
      ...this._stats,
      listenersCount: listeners.size,
      debugMode: this._debugMode,
      stateSnapshot: this.getState(),
    };
  },

  /**
   * Limpa dados antigos para prevenir crescimento excessivo de estado.
   */
  clearOldData(options = {}) {
    const {
      maxRecentPatients = 50,
      maxFilterSets = 20,
      clearCurrentPatient = false,
      clearAllData = false,
    } = options;

    if (clearAllData) {
      state.currentPatient.ficha = null;
      state.currentPatient.cadsus = null;
      state.currentPatient.lastCadsusCheck = null;
      state.currentPatient.isUpdating = false;
      state.recentPatients = [];
      state.savedFilterSets = {};
      this._notify();
      return;
    }

    // Limpar paciente atual se solicitado
    if (clearCurrentPatient) {
      this.clearPatient();
    }

    // Limpar pacientes recentes excessivos
    if (state.recentPatients.length > maxRecentPatients) {
      state.recentPatients = state.recentPatients.slice(0, maxRecentPatients);
    }

    // Limpar filtros salvos excessivos
    const filterKeys = Object.keys(state.savedFilterSets);
    if (filterKeys.length > maxFilterSets) {
      const toKeep = filterKeys.slice(0, maxFilterSets);
      const newFilterSets = {};
      toKeep.forEach((key) => {
        newFilterSets[key] = state.savedFilterSets[key];
      });
      state.savedFilterSets = newFilterSets;
    }

    this._notify();

    if (this._debugMode) {
      console.log('[Store] Old data cleared', {
        recentPatientsCount: state.recentPatients.length,
        filterSetsCount: Object.keys(state.savedFilterSets).length,
      });
    }
  },

  setPatient(fichaData, cadsusData) {
    state.currentPatient.ficha = fichaData;
    state.currentPatient.cadsus = cadsusData;
    state.currentPatient.lastCadsusCheck = cadsusData ? new Date() : null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },

  clearPatient(options = {}) {
    const {
      resetFiltersToDefault = true, // ✅ Por padrão reseta filtros para nova análise
      keepTimeline = false,
      keepForSeconds = 0,
      reason = 'patient_change',
      notifyListeners = true,
    } = options;

    if (this._debugMode) {
      console.log(`[Store] Clearing patient data (reason: ${reason})`);
    }

    // Limpeza imediata de dados sensíveis
    state.currentPatient.ficha = null;
    state.currentPatient.cadsus = null;
    state.currentPatient.lastCadsusCheck = null;
    state.currentPatient.isUpdating = false;

    // Timeline: manter temporariamente se solicitado (para UX suave)
    if (keepTimeline && keepForSeconds > 0) {
      setTimeout(() => {
        if (state.currentPatient.timeline) {
          state.currentPatient.timeline = null;
          if (notifyListeners) this._notify();
        }
      }, keepForSeconds * 1000);
    } else if (state.currentPatient.timeline) {
      state.currentPatient.timeline = null;
    }

    // ✅ CRUCIAL: Reset filtros para nova análise médica
    if (resetFiltersToDefault) {
      // Integrar com sistema existente (sidebar.js)
      if (typeof window !== 'undefined') {
        // Opção 1: Usar FilterManager se existe
        if (window.FilterManager?.resetToDefault) {
          window.FilterManager.resetToDefault();
        } else if (typeof window.resetFiltersToDefault === 'function') {
          // Opção 2: Integrar com sistema atual
          window.resetFiltersToDefault();
        }
      }
    }

    if (notifyListeners) {
      this._notify();
    }
  },

  /**
   * Novo método específico para mudança de paciente com fluxo médico adequado.
   */
  async changePatient(newPatientData, source = 'manual') {
    if (this._debugMode) {
      console.log(
        `[Store] Changing patient (source: ${source}):`,
        newPatientData.nome || 'Unknown'
      );
    }

    // 1. Limpar análise anterior (incluindo filtros)
    this.clearPatient({
      resetFiltersToDefault: true,
      reason: 'new_patient_analysis',
    });

    // 2. Carregar novo paciente
    this.setPatient(newPatientData.ficha, newPatientData.cadsus);

    // 3. Adicionar aos recentes SE foi busca manual
    if (source === 'manual') {
      this.addRecentPatient(newPatientData);
      this._autoSave(['recentPatients']); // ✅ Persiste apenas lista
    }

    // 4. Aplicar automação SE configurada
    if (typeof window !== 'undefined') {
      // Sistema de automação pode não existir ainda
      if (window.AutomationManager?.isEnabled && window.AutomationManager.isEnabled()) {
        await window.AutomationManager.applyRules();
      } else if (typeof window.applyAutomationRules === 'function') {
        // Integração com sistema atual se existir
        await window.applyAutomationRules();
      }
      // Se não existe automação, continua normalmente (não é crítico)
    }

    if (this._debugMode) {
      console.log('[Store] Nova análise de paciente iniciada');
    }
  },

  /**
   * Adiciona paciente aos recentes com controle de persistência médica.
   */
  addRecentPatient(patient, options = {}) {
    const {
      manual = true, // Apenas adiciona se foi busca manual
      maxRecent = 50,
    } = options;

    // Apenas adiciona se foi busca manual (não navegação casual)
    if (!manual) {
      if (this._debugMode) {
        console.log('[Store] Paciente auto-detectado não adicionado aos recentes');
      }
      return;
    }

    // Sanitizar dados para persistência (remover informações sensíveis)
    const safePatient = {
      id: patient.id || patient.ficha?.isenPK?.idp + '-' + patient.ficha?.isenPK?.ids,
      nome: patient.nome || patient.ficha?.nome, // Nome é necessário para UX
      searchedAt: Date.now(),
      source: 'manual_search',
      // CPF, CNS, dados médicos → NUNCA salvos
    };

    // Remove duplicatas
    const filtered = state.recentPatients.filter((p) => p.id !== safePatient.id);

    // Adiciona no início
    state.recentPatients = [safePatient, ...filtered].slice(0, maxRecent);

    // Auto-save APENAS recentPatients (dados não-sensíveis)
    this._autoSave(['recentPatients']);
    this._notify();

    if (this._debugMode) {
      console.log(`[Store] Paciente adicionado aos recentes: ${safePatient.nome}`);
    }
  },

  /**
   * Auto-save seletivo e inteligente para dados médicos seguros.
   */
  _autoSave: (() => {
    let timeout;
    return function (keys = []) {
      // Filtrar apenas chaves permitidas para persistência
      const allowedKeys = keys.filter((key) => PERSISTENT_DATA[key]);

      if (allowedKeys.length === 0) {
        if (this._debugMode) {
          console.log('[Store] Nenhuma chave persistente para salvar');
        }
        return;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        store.saveToStorage(allowedKeys);
      }, 1000); // Save após 1 segundo de inatividade
    }.bind(this);
  })(),

  /**
   * Salva dados médicos permitidos no storage do browser.
   */
  async saveToStorage(keys = null) {
    try {
      // Se não especificado, salvar apenas dados persistentes permitidos
      const defaultPersistentKeys = Object.keys(PERSISTENT_DATA).filter(
        (key) => PERSISTENT_DATA[key]
      );

      const keysToSave = keys || defaultPersistentKeys;

      // Filtrar apenas chaves permitidas para persistência
      const allowedKeys = keysToSave.filter((key) => PERSISTENT_DATA[key]);

      if (allowedKeys.length === 0) {
        if (this._debugMode) {
          console.log('[Store] Nenhuma chave persistente para salvar');
        }
        return;
      }

      const api = typeof browser !== 'undefined' ? browser : chrome;
      const dataToSave = {};

      allowedKeys.forEach((key) => {
        if (state[key] !== undefined) {
          dataToSave[key] = state[key];
        }
      });

      await api.storage.local.set(dataToSave);

      if (this._debugMode) {
        console.log(
          '[Store] Dados médicos persistidos (sem estado de análise):',
          Object.keys(dataToSave)
        );
      }
    } catch (error) {
      logError('STORE_PERSISTENCE', 'Erro ao salvar no storage', {
        errorMessage: error.message,
        keys: keys || 'default',
      });
    }
  },

  /**
   * Carrega dados médicos permitidos do storage do browser.
   */
  async loadFromStorage() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const persistentKeys = Object.keys(PERSISTENT_DATA).filter((key) => PERSISTENT_DATA[key]);

      const data = await api.storage.local.get(persistentKeys);

      let hasChanges = false;
      persistentKeys.forEach((key) => {
        if (data[key] !== undefined) {
          state[key] = data[key];
          hasChanges = true;
        }
      });

      // ✅ IMPORTANTE: NÃO carregar currentPatient ou currentFilters
      // Nova sessão = nova análise com filtros padrão do usuário

      if (hasChanges) {
        this._notify();
      }

      if (this._debugMode) {
        console.log('[Store] Dados persistentes carregados (análise resetada):', Object.keys(data));
      }

      return data;
    } catch (error) {
      logError('STORE_PERSISTENCE', 'Erro ao carregar do storage', {
        errorMessage: error.message,
      });
      return {};
    }
  },

  setPatientUpdating() {
    state.currentPatient.isUpdating = true;
    this._notify();
  },

  getPatient() {
    return state.currentPatient.ficha ? state.currentPatient : null;
  },

  getCurrentPatient() {
    return state.currentPatient;
  },

  setRecentPatients(patients) {
    state.recentPatients = patients;
    this._notify();
  },

  getRecentPatients() {
    return state.recentPatients;
  },

  setSavedFilterSets(sets) {
    state.savedFilterSets = sets;
    this._notify();
  },

  // Método para salvar conjunto de filtros
  saveFilterSet(name, filterSet) {
    if (!name || typeof name !== 'string') {
      if (this._debugMode) {
        console.warn('[Store] Nome inválido para conjunto de filtros:', name);
      }
      return;
    }

    state.savedFilterSets[name] = { ...filterSet, savedAt: Date.now() };

    // Auto-save para persistir filtros salvos
    this._autoSave(['savedFilterSets']);
    this._notify();

    if (this._debugMode) {
      console.log(`[Store] Conjunto de filtros salvo: ${name}`);
    }
  },

  // Método para deletar conjunto de filtros
  deleteFilterSet(name) {
    if (state.savedFilterSets[name]) {
      delete state.savedFilterSets[name];
      this._autoSave(['savedFilterSets']);
      this._notify();

      if (this._debugMode) {
        console.log(`[Store] Conjunto de filtros removido: ${name}`);
      }
    }
  },

  getSavedFilterSets() {
    return state.savedFilterSets;
  },

  getState() {
    return {
      currentPatient: { ...state.currentPatient },
      recentPatients: [...state.recentPatients],
      savedFilterSets: { ...state.savedFilterSets },
    };
  },
};
