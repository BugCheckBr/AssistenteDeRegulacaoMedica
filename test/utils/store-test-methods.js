/* eslint-disable no-undef */
/**
 * 🛠️ STORE.JS CLEANUP METHODS - PHASE 1 FIXES
 * Métodos para corrigir memory leaks nos testes
 */
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  store._clearAllListeners = function () {
    listeners.clear();
    listenerMetadata.clear();
    notificationCount = 0;
    listenerCounter = 0;
  };
  store._resetState = function () {
    Object.keys(state).forEach((key) => {
      delete state[key];
    });
    state.currentPatient = {
      ficha: null,
      cadsus: null,
      timeline: null,
      isenFullPKCrypto: null,
    };
  };
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
