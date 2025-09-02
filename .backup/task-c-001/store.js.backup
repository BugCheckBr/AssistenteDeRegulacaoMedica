/**
 * @file store.js - Gestor de estado centralizado para a aplicação.
 * Implementa um padrão simples de "publish-subscribe" para gerir o estado global.
 */

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

const listeners = [];

export const store = {
  /**
   * Adiciona uma função de callback à lista de listeners.
   * @param {Function} listener A função a ser adicionada.
   * @returns {Function} Uma função para remover o listener (unsubscribe).
   */
  subscribe(listener) {
    listeners.push(listener);
    // PASSO 3.3: Retorna uma função de unsubscribe para melhor gestão de memória.
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  _notify() {
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Erro num listener do store:', error);
      }
    }
  },

  setPatient(fichaData, cadsusData) {
    state.currentPatient.ficha = fichaData;
    state.currentPatient.cadsus = cadsusData;
    state.currentPatient.lastCadsusCheck = cadsusData ? new Date() : null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },

  clearPatient() {
    state.currentPatient.ficha = null;
    state.currentPatient.cadsus = null;
    state.currentPatient.lastCadsusCheck = null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },

  setPatientUpdating() {
    state.currentPatient.isUpdating = true;
    this._notify();
  },

  getPatient() {
    return state.currentPatient.ficha ? state.currentPatient : null;
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
