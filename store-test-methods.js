/**
 * 🔧 STORE.JS CLEANUP METHODS - PHASE 1 FIXES
 * Métodos para corrigir memory leaks nos testes
 */

/* eslint-env node */
/* global store, listeners, listenerMetadata, notificationCount, state, process */
/* eslint-disable no-global-assign */

// ADICIONAR AO FINAL DO store.js

// Test utilities (only available in test environment)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  /**
   * Limpa todos os listeners (apenas para testes)
   * ⚠️ NUNCA usar em produção
   */
  store._clearAllListeners = function () {
    listeners.clear();
    listenerMetadata.clear();
    notificationCount = 0;
    // eslint-disable-next-line no-undef
    listenerCounter = 0;
  };

  /**
   * Reseta estado do store (apenas para testes)
   * ⚠️ NUNCA usar em produção
   */
  store._resetState = function () {
    Object.keys(state).forEach((key) => {
      delete state[key];
    });

    // Estado padrão limpo
    state.currentPatient = {
      ficha: null,
      cadsus: null,
      timeline: null,
      isenFullPKCrypto: null,
    };
  };

  /**
   * Obtém estatísticas do store para debugging
   */
  store._getTestStats = function () {
    return {
      listenersCount: listeners.size,
      metadataCount: listenerMetadata.size,
      notificationCount,
      debugMode: this._debugMode,
      stateKeys: Object.keys(state),
    };
  };
}
