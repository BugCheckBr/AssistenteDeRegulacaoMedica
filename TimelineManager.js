/**
 * @file Módulo TimelineManager, responsável por gerir a secção da Linha do Tempo.
 */
import * as API from './api.js';
import { ERROR_CATEGORIES, logError } from './ErrorHandler.js';
import * as Renderers from './renderers.js';
import { store } from './store.js';
import * as Utils from './utils.js';

export class TimelineManager {
  constructor(sectionKey, config, globalSettings) {
    this.sectionKey = sectionKey;
    this.config = config;
    this.globalSettings = globalSettings;

    this.allData = [];
    this.currentPatient = null;
    this.isLoading = false;

    // State for automation filters
    this.activeRuleFilters = null;
    this.activeRuleName = null;
    this.isFilteredView = false;

    this.elements = {};
    this.init();
  }

  init() {
    this.cacheDomElements();
    this.addEventListeners();
    store.subscribe(() => this.onStateChange());
  }

  cacheDomElements() {
    this.elements = {
      section: document.getElementById('timeline-section'),
      wrapper: document.getElementById('timeline-wrapper'),
      content: document.getElementById('timeline-content'),
      fetchBtn: document.getElementById('fetch-timeline-btn'),
      toggleBtn: document.getElementById('toggle-timeline-list-btn'),
      automationFeedback: document.getElementById('timeline-automation-feedback'),
      dateInitial: document.getElementById('timeline-date-initial'),
      dateFinal: document.getElementById('timeline-date-final'),
      searchKeyword: document.getElementById('timeline-search-keyword'),
    };
  }

  addEventListeners() {
    // Remove listeners antes de adicionar
    if (!this._listeners) this._listeners = {};
    const el = this.elements;
    // Remove
    el.fetchBtn?.removeEventListener('click', this._listeners.onFetchBtnClick);
    el.toggleBtn?.removeEventListener('click', this._listeners.onToggleBtnClick);
    el.searchKeyword?.removeEventListener('input', this._listeners.onSearchKeywordInput);
    el.dateInitial?.removeEventListener('change', this._listeners.onDateInitialChange);
    el.dateFinal?.removeEventListener('change', this._listeners.onDateFinalChange);
    el.section?.removeEventListener('click', this._listeners.onSectionClick);

    // Funções nomeadas
    this._listeners.onFetchBtnClick = this.onFetchBtnClick.bind(this);
    this._listeners.onToggleBtnClick = this.onToggleBtnClick.bind(this);
    this._listeners.onSearchKeywordInput = Utils.debounce(
      this.onSearchKeywordInput.bind(this),
      300
    );
    this._listeners.onDateInitialChange = this.onDateInitialChange.bind(this);
    this._listeners.onDateFinalChange = this.onDateFinalChange.bind(this);
    this._listeners.onSectionClick = this.onSectionClick.bind(this);

    // Adiciona
    el.fetchBtn?.addEventListener('click', this._listeners.onFetchBtnClick);
    el.toggleBtn?.addEventListener('click', this._listeners.onToggleBtnClick);
    el.searchKeyword?.addEventListener('input', this._listeners.onSearchKeywordInput);
    el.dateInitial?.addEventListener('change', this._listeners.onDateInitialChange);
    el.dateFinal?.addEventListener('change', this._listeners.onDateFinalChange);
    el.section?.addEventListener('click', this._listeners.onSectionClick);
  }

  onFetchBtnClick() {
    this.fetchData();
  }
  onToggleBtnClick() {
    this.toggleSection();
  }
  onSearchKeywordInput() {
    this.render();
  }
  onDateInitialChange() {
    this.render();
  }
  onDateFinalChange() {
    this.render();
  }
  onSectionClick(event) {
    const header = event.target.closest('.timeline-header');
    if (header) {
      const details = header.nextElementSibling;
      if (details && details.classList.contains('timeline-details-body')) {
        details.classList.toggle('show');
      }
      return;
    }

    const toggleDetailsBtn = event.target.closest('.timeline-toggle-details-btn');
    if (toggleDetailsBtn) {
      const timelineItem = toggleDetailsBtn.closest('.timeline-item');
      const details = timelineItem?.querySelector('.timeline-details-body');
      if (details) {
        details.classList.toggle('show');
      }
      return;
    }

    const toggleFilterBtn = event.target.closest('#timeline-toggle-filter-btn');
    if (toggleFilterBtn) {
      this.toggleFilteredView();
    }
  }

  onStateChange() {
    const patientState = store.getPatient();
    const newPatient = patientState ? patientState.ficha : null;

    if (this.currentPatient?.isenPK?.idp !== newPatient?.isenPK?.idp) {
      this.setPatient(newPatient);
    }
  }

  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
    this.clearAutomation();
    this.elements.content.innerHTML = '';
    if (this.elements.searchKeyword) {
      this.elements.searchKeyword.value = '';
    }
    this.applyDefaultDateRange();

    if (this.elements.section) {
      this.elements.section.style.display = patient ? 'block' : 'none';
    }
  }

  applyDefaultDateRange() {
    const dateRangeDefaults = this.globalSettings.userPreferences.dateRangeDefaults;
    const range = dateRangeDefaults.timeline || { start: -12, end: 0 };

    if (this.elements.dateInitial)
      this.elements.dateInitial.valueAsDate = Utils.calculateRelativeDate(range.start);
    if (this.elements.dateFinal)
      this.elements.dateFinal.valueAsDate = Utils.calculateRelativeDate(range.end);
  }

  async fetchData() {
    if (!this.currentPatient || this.isLoading) {
      return;
    }

    this.isLoading = true;
    Renderers.renderTimeline([], 'loading');

    try {
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: '01/01/1900', // Busca sempre o histórico completo
        dataFinal: new Date().toLocaleDateString('pt-BR'),
      };

      const apiData = await API.fetchAllTimelineData(params);
      const normalizedData = Utils.normalizeTimelineData(apiData);

      this.allData = normalizedData;
      this.render();
    } catch (error) {
      logError(
        'Erro ao buscar dados para a Linha do Tempo',
        {
          errorMessage: error.message,
          error: error,
        },
        ERROR_CATEGORIES.TIMELINE_DATA_FETCH
      );
      Renderers.renderTimeline([], 'error');
    } finally {
      this.isLoading = false;
    }
  }

  getFilterValues() {
    return {
      startDate: this.elements.dateInitial?.value,
      endDate: this.elements.dateFinal?.value,
      keyword: Utils.normalizeString(this.elements.searchKeyword?.value || ''),
    };
  }

  render() {
    if (this.allData.length === 0 && !this.isLoading) {
      Renderers.renderTimeline([], 'empty');
      return;
    }

    let dataToRender = this.allData;
    const filters = this.getFilterValues();

    // Client-side filtering
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      dataToRender = dataToRender.filter((event) => event.sortableDate >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja incluído
      dataToRender = dataToRender.filter((event) => event.sortableDate <= endDate);
    }
    if (filters.keyword) {
      dataToRender = dataToRender.filter((event) => event.searchText.includes(filters.keyword));
    }

    // Automation rule filtering
    if (this.isFilteredView && this.activeRuleFilters) {
      dataToRender = Utils.filterTimelineEvents(dataToRender, this.activeRuleFilters);
    }

    Renderers.renderTimeline(dataToRender, 'success');
  }

  toggleSection() {
    this.elements.wrapper?.classList.toggle('show');
    this.elements.toggleBtn.textContent = this.elements.wrapper.classList.contains('show')
      ? 'Recolher'
      : 'Expandir';
  }

  applyAutomationFilters(filters, ruleName) {
    this.activeRuleFilters = filters;
    this.activeRuleName = ruleName;
    this.isFilteredView = false;

    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.innerHTML = `
            <div class="flex justify-between items-center text-sm">
                <span>Regra '<strong>${ruleName}</strong>' ativa.</span>
                <button id="timeline-toggle-filter-btn" class="font-semibold text-blue-600 hover:underline">
                    Ver timeline focada
                </button>
            </div>
        `;
      this.elements.automationFeedback.classList.remove('hidden');
    }

    if (this.allData.length > 0) {
      this.render();
    }
  }

  clearAutomation() {
    this.activeRuleFilters = null;
    this.activeRuleName = null;
    this.isFilteredView = false;
    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.classList.add('hidden');
      this.elements.automationFeedback.innerHTML = '';
    }
    if (this.allData.length > 0) {
      this.render();
    }
  }

  toggleFilteredView() {
    this.isFilteredView = !this.isFilteredView;
    const button = document.getElementById('timeline-toggle-filter-btn');
    if (button) {
      button.textContent = this.isFilteredView ? 'Ver timeline completa' : 'Ver timeline focada';
    }
    this.render();
  }
}
