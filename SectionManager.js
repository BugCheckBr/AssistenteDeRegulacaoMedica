/**
 * @file Módulo SectionManager, responsável por gerir uma secção inteira da sidebar.
 */

import { ERROR_CATEGORIES, logError } from './ErrorHandler.js';
import { filterConfig } from './filter-config.js';
import { store } from './store.js';
import * as Utils from './utils.js';

/**
 * Gera o HTML para o indicador de ordenação (seta para cima/baixo).
 * @param {string} key - A chave da coluna atual.
 * @param {object} state - O objeto de estado de ordenação da secção.
 * @returns {string} O caractere da seta ou uma string vazia.
 */
export function getSortIndicator(key, state) {
  if (state.key !== key) return '';
  return state.order === 'asc' ? '▲' : '▼';
}

export class SectionManager {
  /**
   * @param {string} sectionKey - A chave da secção (ex: "consultations").
   * @param {object} config - Configurações específicas da secção.
   * @param {Function} config.fetchFunction - A função da API para buscar dados.
   * @param {Function} config.renderFunction - A função para renderizar os dados.
   * @param {object} config.initialSortState - O estado inicial de ordenação.
   * @param {object} globalSettings - Configurações globais da aplicação.
   */
  constructor(sectionKey, config, globalSettings) {
    this.sectionKey = sectionKey;
    this.prefix = this.getPrefix(sectionKey);
    this.config = config;
    this.globalSettings = globalSettings;

    this.allData = [];
    this.currentPatient = null;
    this.isLoading = false;
    this.sortState = { ...config.initialSortState };
    this.fetchType = 'all';

    this.elements = {};

    this.init();
  }

  getPrefix(sectionKey) {
    const map = {
      consultations: 'consultation',
      exams: 'exam',
      appointments: 'appointment',
      regulations: 'regulation',
      documents: 'document',
    };
    return map[sectionKey] || sectionKey;
  }

  init() {
    this.cacheDomElements();
    this.renderFilterControls();
    this.addEventListeners();
    store.subscribe(() => this.onStateChange());
  }

  onStateChange() {
    const patientState = store.getPatient();
    const newPatient = patientState ? patientState.ficha : null;

    if (this.currentPatient?.isenPK?.idp !== newPatient?.isenPK?.idp) {
      this.setPatient(newPatient);
    }

    this.populateSavedFilterDropdown();
  }

  cacheDomElements() {
    const { sectionKey, prefix } = this;
    this.elements = {
      section: document.getElementById(`${sectionKey}-section`),
      wrapper: document.getElementById(`${sectionKey}-wrapper`),
      content: document.getElementById(`${sectionKey}-content`),
      fetchBtn: document.getElementById(`fetch-${sectionKey}-btn`),
      toggleBtn: document.getElementById(`toggle-${sectionKey}-list-btn`),
      toggleMoreBtn: document.getElementById(`toggle-more-${prefix}-filters-btn`),
      clearBtn: document.getElementById(`clear-${prefix}-filters-btn`),
      mainFilters: document.getElementById(`${prefix}-main-filters`),
      moreFilters: document.getElementById(`${prefix}-more-filters`),
      automationFeedback: document.getElementById(`${sectionKey}-automation-feedback`),
    };
  }

  addEventListeners() {
    // Remove listeners antes de adicionar
    if (!this._listeners) this._listeners = {};
    const el = this.elements;
    el.fetchBtn?.removeEventListener('click', this._listeners.onFetchBtnClick);
    el.toggleBtn?.removeEventListener('click', this._listeners.onToggleBtnClick);
    el.toggleMoreBtn?.removeEventListener('click', this._listeners.onToggleMoreBtnClick);
    el.clearBtn?.removeEventListener('click', this._listeners.onClearBtnClick);
    el.section?.removeEventListener('input', this._listeners.onSectionInput);
    el.section?.removeEventListener('change', this._listeners.onSectionChange);
    el.section?.removeEventListener('click', this._listeners.onSectionClick);

    // Funções nomeadas
    this._listeners.onFetchBtnClick = this.onFetchBtnClick.bind(this);
    this._listeners.onToggleBtnClick = this.onToggleBtnClick.bind(this);
    this._listeners.onToggleMoreBtnClick = this.onToggleMoreBtnClick.bind(this);
    this._listeners.onClearBtnClick = this.onClearBtnClick.bind(this);
    this._listeners.onSectionInput = Utils.debounce(this.onSectionInput.bind(this), 300);
    this._listeners.onSectionChange = this.onSectionChange.bind(this);
    this._listeners.onSectionClick = this.onSectionClick.bind(this);

    // Adiciona
    el.fetchBtn?.addEventListener('click', this._listeners.onFetchBtnClick);
    el.toggleBtn?.addEventListener('click', this._listeners.onToggleBtnClick);
    el.toggleMoreBtn?.addEventListener('click', this._listeners.onToggleMoreBtnClick);
    el.clearBtn?.addEventListener('click', this._listeners.onClearBtnClick);
    el.section?.addEventListener('input', this._listeners.onSectionInput);
    el.section?.addEventListener('change', this._listeners.onSectionChange);
    el.section?.addEventListener('click', this._listeners.onSectionClick);
  }

  onFetchBtnClick() {
    this.fetchData();
  }
  onToggleBtnClick() {
    this.toggleSection();
  }
  onToggleMoreBtnClick() {
    this.toggleMoreFilters();
  }
  onClearBtnClick() {
    this.clearFilters();
  }
  onSectionInput(e) {
    if (e.target.matches("input[type='text'], input[type='date']")) {
      this.applyFiltersAndRender();
    }
  }
  onSectionChange(e) {
    if (e.target.matches("select, input[type='checkbox'], input[type='radio']")) {
      if (e.target.closest('.filter-select-group')) {
        this.handleFetchTypeChange(e.target);
      } else {
        this.applyFiltersAndRender();
      }
    }
    if (e.target.id === `${this.prefix}-saved-filters-select`) this.loadFilterSet();
  }
  onSectionClick(e) {
    const target = e.target;
    const sortHeader = target.closest('.sort-header');
    if (sortHeader) this.handleSort(sortHeader.dataset.sortKey);

    if (target.closest(`#${this.prefix}-save-filter-btn`)) this.saveFilterSet();
    if (target.closest(`#${this.prefix}-delete-filter-btn`)) this.deleteFilterSet();
    if (target.closest('.clear-automation-btn')) {
      this.clearAutomationFeedbackAndFilters(true);
    }
  }
  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
    this.clearFilters(false);
    this.clearAutomationFeedbackAndFilters(false);
    this.applyFiltersAndRender();

    if (this.elements.section) {
      this.elements.section.style.display = patient ? 'block' : 'none';
    }

    // 🔒 CORREÇÃO CRÍTICA: Carregamento automático baseado na configuração do usuário
    if (patient) {
      const autoLoadKey = `autoLoad${
        this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)
      }`;

      // 🚨 VALIDAÇÃO RIGOROSA: Verifica se as configurações foram carregadas
      if (!this.globalSettings) {
        console.warn(
          `[Assistente Médico] ⚠️ globalSettings não definido para ${this.sectionKey}. MODO MANUAL forçado.`
        );
        return;
      }

      if (!this.globalSettings.userPreferences) {
        console.warn(
          `[Assistente Médico] ⚠️ userPreferences não definido para ${this.sectionKey}. MODO MANUAL forçado.`
        );
        return;
      }

      // 🔍 VERIFICAÇÃO EXPLÍCITA: Obtém o valor da configuração
      const isAutoMode = this.globalSettings.userPreferences[autoLoadKey];

      // 📊 LOG DETALHADO para diagnóstico
      console.log(`[Assistente Médico] 🔧 === DIAGNÓSTICO CARREGAMENTO AUTOMÁTICO ===`);
      console.log(`[Assistente Médico] 🔧 Seção: ${this.sectionKey}`);
      console.log(`[Assistente Médico] 🔧 autoLoadKey: ${autoLoadKey}`);
      console.log(`[Assistente Médico] 🔧 isAutoMode: ${isAutoMode} (tipo: ${typeof isAutoMode})`);
      console.log(
        `[Assistente Médico] 🔧 userPreferences completo:`,
        this.globalSettings.userPreferences
      );

      // 🎯 DECISÃO FINAL: Só carrega se explicitamente TRUE
      if (isAutoMode === true) {
        console.log(
          `[Assistente Médico] ✅ MODO AUTO CONFIRMADO: Carregando ${this.sectionKey} automaticamente`
        );
        this.fetchData();
      } else {
        console.log(
          `[Assistente Médico] 🔒 MODO MANUAL CONFIRMADO: Aguardando ação do usuário para ${this.sectionKey}`
        );
        console.log(
          `[Assistente Médico] 🔒 Valor recebido: ${isAutoMode} (esperado: true para auto)`
        );
        // ✋ NÃO executa fetchData() - usuário deve clicar no botão manualmente
      }
    }
  }

  async fetchData() {
    if (!this.currentPatient) {
      if (this.elements.section.style.display !== 'none')
        Utils.showMessage('Nenhum paciente selecionado.');
      return;
    }
    if (this.isLoading) return;

    this.isLoading = true;
    this.elements.content.innerHTML = '<p class="text-slate-500">Carregando...</p>';

    try {
      const fetchTypeElement = this.elements.mainFilters?.querySelector(
        `#${this.prefix}-fetch-type-buttons`
      );
      if (fetchTypeElement) {
        this.fetchType = fetchTypeElement.value;
      }

      const dataInicialValue = this.elements.dateInitial ? this.elements.dateInitial.value : null;
      const dataFinalValue = this.elements.dateFinal ? this.elements.dateFinal.value : null;

      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: dataInicialValue
          ? new Date(dataInicialValue).toLocaleDateString('pt-BR')
          : '01/01/1900',
        dataFinal: dataFinalValue
          ? new Date(dataFinalValue).toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR'),
        type: this.fetchType,
      };

      if (this.sectionKey === 'exams') {
        params.comResultado = this.fetchType === 'withResult' || this.fetchType === 'all';
        params.semResultado = this.fetchType === 'withoutResult' || this.fetchType === 'all';
      }

      const result = await this.config.fetchFunction(params);
      this.allData = Array.isArray(result) ? result : result.jsonData || [];
    } catch (error) {
      logError(
        `Erro ao buscar dados para ${this.sectionKey}`,
        {
          sectionKey: this.sectionKey,
          errorMessage: error.message,
          error: error,
        },
        ERROR_CATEGORIES.SECTION_DATA_FETCH
      );
      const sectionNameMap = {
        consultations: 'consultas',
        exams: 'exames',
        appointments: 'agendamentos',
        regulations: 'regulações',
        documents: 'documentos',
      };
      const friendlyName = sectionNameMap[this.sectionKey] || this.sectionKey;
      Utils.showMessage(`Erro ao buscar ${friendlyName}. Verifique a conexão e a URL base.`);
      this.allData = [];
    } finally {
      this.isLoading = false;
      this.applyFiltersAndRender();
    }
  }

  applyFiltersAndRender() {
    let filteredData = [...this.allData];
    if (this.config.filterLogic) {
      filteredData = this.config.filterLogic(filteredData, this.getFilterValues(), this.fetchType);
    }
    const sortedData = this.sortData(filteredData);
    this.config.renderFunction(sortedData, this.sortState, this.globalSettings);
    this.updateActiveFiltersIndicator();
  }

  sortData(data) {
    const { key, order } = this.sortState;
    return [...data].sort((a, b) => {
      let valA, valB;
      if (key === 'date' || key === 'sortableDate') {
        valA = a.sortableDate || Utils.parseDate(a.date);
        valB = b.sortableDate || Utils.parseDate(b.date);
      } else {
        valA = (a[key] || '').toString().toLowerCase();
        valB = (b[key] || '').toString().toLowerCase();
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getFilterValues() {
    const values = {};
    const filters = filterConfig[this.sectionKey] || [];
    filters.forEach((filter) => {
      if (filter.type === 'component') return;

      if (filter.type === 'selectGroup') {
        // Para selectGroup (radio buttons), busca pelo que está selecionado
        const radioSelected = document.querySelector(`input[name="${filter.id}"]:checked`);
        if (radioSelected) {
          values[filter.id] = radioSelected.value;
        }
      } else {
        const el = document.getElementById(filter.id);
        if (el) {
          values[filter.id] = el.type === 'checkbox' ? el.checked : el.value;
        }
      }
    });
    return values;
  }

  toggleSection() {
    this.elements.wrapper?.classList.toggle('show');
    this.elements.toggleBtn.textContent = this.elements.wrapper.classList.contains('show')
      ? 'Recolher'
      : 'Expandir';
  }

  toggleMoreFilters() {
    const shouldShow = !this.elements.moreFilters.classList.contains('show');
    this.elements.moreFilters.classList.toggle('show', shouldShow);
    this.elements.toggleMoreBtn.querySelector('.button-text').textContent = shouldShow
      ? 'Menos filtros'
      : 'Mais filtros';
    this.updateActiveFiltersIndicator();
  }

  clearFilters(shouldRender = true) {
    const sectionLayout = this.globalSettings.filterLayout[this.sectionKey] || [];
    const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

    // --- INÍCIO DA CORREÇÃO ---
    // Reseta o período de busca para o padrão global da seção
    const dateRangeDefaults = this.globalSettings.userPreferences.dateRangeDefaults;
    const defaultRanges = {
      consultations: { start: -6, end: 0 },
      exams: { start: -6, end: 0 },
      appointments: { start: -1, end: 3 },
      regulations: { start: -12, end: 0 },
      documents: { start: -24, end: 0 },
    };
    const range = dateRangeDefaults[this.sectionKey] || defaultRanges[this.sectionKey];
    if (this.elements.dateInitial)
      this.elements.dateInitial.valueAsDate = Utils.calculateRelativeDate(range.start);
    if (this.elements.dateFinal)
      this.elements.dateFinal.valueAsDate = Utils.calculateRelativeDate(range.end);
    // --- FIM DA CORREÇÃO ---

    // 🔒 CORREÇÃO CRÍTICA: Verifica se deve evitar carregamento automático
    const autoLoadKey = `autoLoad${this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)}`;
    const isAutoMode = this.globalSettings?.userPreferences?.[autoLoadKey] === true;
    const shouldAvoidAutoFetch = !isAutoMode && this.currentPatient; // Evita fetch automático no modo manual

    (filterConfig[this.sectionKey] || []).forEach((filter) => {
      if (filter.type === 'component') return;

      if (filter.type === 'selectGroup') {
        // Para selectGroup (radio buttons), seleciona o primeiro por padrão
        const savedFilterSettings = layoutMap.get(filter.id);
        let defaultValue;

        if (savedFilterSettings && savedFilterSettings.defaultValue !== undefined) {
          defaultValue = savedFilterSettings.defaultValue;
        } else {
          defaultValue = filter.options ? filter.options[0].value : '';
        }

        const radioToCheck = document.querySelector(
          `input[name="${filter.id}"][value="${defaultValue}"]`
        );
        if (radioToCheck) {
          radioToCheck.checked = true;
          // 🔒 CORREÇÃO: Só chama handleFetchTypeChange se não estiver no modo manual
          if (radioToCheck.classList.contains('filter-select-group') && !shouldAvoidAutoFetch) {
            this.handleFetchTypeChange(radioToCheck);
          } else if (
            radioToCheck.classList.contains('filter-select-group') &&
            shouldAvoidAutoFetch
          ) {
            // Apenas atualiza o fetchType sem fazer fetch
            this.fetchType = radioToCheck.value || radioToCheck.dataset.fetchType;
          }
        }
      } else {
        const el = document.getElementById(filter.id);
        if (el) {
          const savedFilterSettings = layoutMap.get(filter.id);
          let defaultValue;

          if (savedFilterSettings && savedFilterSettings.defaultValue !== undefined) {
            defaultValue = savedFilterSettings.defaultValue;
          } else {
            defaultValue = filter.defaultChecked ?? (filter.options ? filter.options[0].value : '');
          }

          if (el.type === 'checkbox') {
            el.checked = defaultValue;
          } else {
            el.value = defaultValue;
          }

          // 🔒 CORREÇÃO: Só chama handleFetchTypeChange se não estiver no modo manual
          if (el.classList.contains('filter-select-group') && !shouldAvoidAutoFetch) {
            this.handleFetchTypeChange(el);
          } else if (el.classList.contains('filter-select-group') && shouldAvoidAutoFetch) {
            // Apenas atualiza o fetchType sem fazer fetch
            this.fetchType = el.value || el.dataset.fetchType;
          }
        }
      }
    });
    if (shouldRender) {
      this.applyFiltersAndRender();
    }
  }

  handleSort(sortKey) {
    if (this.sortState.key === sortKey) {
      this.sortState.order = this.sortState.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState.key = sortKey;
      this.sortState.order = 'desc';
    }
    this.applyFiltersAndRender();
  }

  handleFetchTypeChange(element) {
    this.fetchType = element.value || element.dataset.fetchType;
    this.fetchData();
  }

  updateActiveFiltersIndicator() {
    const indicator = this.elements.toggleMoreBtn?.querySelector('span:not(.button-text)');
    if (!indicator || !this.elements.moreFilters) return;
    const isShown = this.elements.moreFilters.classList.contains('show');
    let activeCount = 0;
    const filterElements = this.elements.moreFilters.querySelectorAll('input, select');
    filterElements.forEach((el) => {
      if (
        (el.type === 'select-one' || el.type === 'select') &&
        el.value !== 'todos' &&
        el.value !== 'todas' &&
        el.value !== '' &&
        el.value !== 'all'
      )
        activeCount++;
      else if (el.type === 'text' && el.value.trim() !== '') activeCount++;
      else if (el.type === 'checkbox' && el.checked) activeCount++;
    });
    if (activeCount > 0 && !isShown) {
      indicator.textContent = activeCount;
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }

  saveFilterSet() {
    // eslint-disable-next-line no-alert
    const name = window.prompt('Digite um nome para o conjunto de filtros:');
    if (!name || name.trim() === '') {
      Utils.showMessage('Nome inválido. O filtro não foi salvo.');
      return;
    }

    const savedSets = store.getSavedFilterSets();
    if (!savedSets[this.sectionKey]) {
      savedSets[this.sectionKey] = [];
    }
    const existingIndex = savedSets[this.sectionKey].findIndex((set) => set.name === name);
    const filterValues = this.getFilterValues();
    const newSet = { name, values: filterValues };
    if (existingIndex > -1) {
      savedSets[this.sectionKey][existingIndex] = newSet;
    } else {
      savedSets[this.sectionKey].push(newSet);
    }
    browser.storage.local.set({ savedFilterSets: savedSets });
    store.setSavedFilterSets(savedSets);
    Utils.showMessage(`Filtro "${name}" salvo com sucesso.`, 'success');
  }

  loadFilterSet() {
    const select = document.getElementById(`${this.prefix}-saved-filters-select`);
    const name = select.value;
    if (!name) return;
    const set = (store.getSavedFilterSets()[this.sectionKey] || []).find((s) => s.name === name);
    if (!set) return;

    // 🔒 CORREÇÃO: Verifica se deve evitar carregamento automático
    const autoLoadKey = `autoLoad${this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)}`;
    const isAutoMode = this.globalSettings?.userPreferences?.[autoLoadKey] === true;
    const shouldAvoidAutoFetch = !isAutoMode && this.currentPatient;

    Object.entries(set.values).forEach(([id, value]) => {
      // Verifica se é um filtro selectGroup (radio buttons)
      const radioInput = document.querySelector(`input[name="${id}"][value="${value}"]`);
      if (radioInput) {
        radioInput.checked = true;
        if (radioInput.classList.contains('filter-select-group')) {
          if (!shouldAvoidAutoFetch) {
            this.handleFetchTypeChange(radioInput);
          } else {
            // Apenas atualiza o fetchType sem fazer fetch
            this.fetchType = radioInput.value || radioInput.dataset.fetchType;
          }
        }
      } else {
        // Tenta encontrar o elemento pelo ID (para outros tipos de filtro)
        const el = document.getElementById(id);
        if (el) {
          if (el.type === 'checkbox') el.checked = value;
          else el.value = value;

          if (el.classList.contains('filter-select-group')) {
            if (!shouldAvoidAutoFetch) {
              this.handleFetchTypeChange(el);
            } else {
              // Apenas atualiza o fetchType sem fazer fetch
              this.fetchType = el.value || el.dataset.fetchType;
            }
          }
        }
      }
    });
    this.applyFiltersAndRender();
  }

  deleteFilterSet() {
    const select = document.getElementById(`${this.prefix}-saved-filters-select`);
    const name = select.value;
    if (!name) {
      Utils.showMessage('Selecione um filtro para apagar.');
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmation = window.confirm(`Tem certeza que deseja apagar o filtro "${name}"?`);
    if (!confirmation) return;

    const savedSets = store.getSavedFilterSets();
    savedSets[this.sectionKey] = (savedSets[this.sectionKey] || []).filter(
      (set) => set.name !== name
    );
    browser.storage.local.set({ savedFilterSets: savedSets });
    store.setSavedFilterSets(savedSets);
    Utils.showMessage(`Filtro "${name}" apagado.`, 'success');
  }

  populateSavedFilterDropdown() {
    const select = document.getElementById(`${this.prefix}-saved-filters-select`);
    if (!select) return;
    const currentSelection = select.value;
    select.innerHTML = '<option value="">Carregar filtro...</option>';
    const sets = store.getSavedFilterSets()[this.sectionKey] || [];
    sets.forEach((set) => {
      const option = document.createElement('option');
      option.value = set.name;
      option.textContent = set.name;
      select.appendChild(option);
    });
    select.value = currentSelection;
  }

  createFilterElement(filter) {
    const container = document.createElement('div');
    container.className = 'mb-2';

    const label = document.createElement('label');
    label.htmlFor = filter.id;
    label.className = 'block text-sm font-medium text-slate-700';
    label.textContent = filter.label;
    container.appendChild(label);

    let input;
    switch (filter.type) {
      case 'select':
        input = document.createElement('select');
        input.className =
          'mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md';
        filter.options.forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.text;
          input.appendChild(option);
        });
        if (filter.isFetchTrigger) {
          input.classList.add('filter-select-group');
        }
        break;
      case 'selectGroup': {
        // SelectGroup é renderizado como botões de radio com aparência de select
        const radioContainer = document.createElement('div');
        radioContainer.className =
          'mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus-within:outline-none focus-within:ring-blue-500 focus-within:border-blue-500 sm:text-sm rounded-md bg-white';
        radioContainer.style.minHeight = '2.5rem'; // Mesma altura que um select

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'flex flex-wrap gap-2 items-center';

        filter.options.forEach((opt, index) => {
          const radioWrapper = document.createElement('div');
          radioWrapper.className = 'flex items-center';

          const radioInput = document.createElement('input');
          radioInput.type = 'radio';
          radioInput.id = `${filter.id}-${opt.value}`;
          radioInput.name = filter.id;
          radioInput.value = opt.value;
          radioInput.className = 'h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500';
          radioInput.classList.add('filter-select-group');

          // Primeira opção selecionada por padrão
          if (index === 0) {
            radioInput.checked = true;
          }

          const radioLabel = document.createElement('label');
          radioLabel.htmlFor = `${filter.id}-${opt.value}`;
          radioLabel.className = 'ml-2 block text-sm text-slate-900 cursor-pointer';
          radioLabel.textContent = opt.text;

          radioWrapper.appendChild(radioInput);
          radioWrapper.appendChild(radioLabel);
          innerWrapper.appendChild(radioWrapper);
        });

        radioContainer.appendChild(innerWrapper);
        container.appendChild(radioContainer);
        return container;
      }
      case 'text':
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = filter.placeholder || '';
        input.className =
          'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
        break;
      case 'checkbox':
        // Checkbox tem um layout diferente
        container.innerHTML = `
          <div class="flex items-center">
            <input id="${filter.id}" type="checkbox" class="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500">
            <label for="${filter.id}" class="ml-2 block text-sm text-slate-900">${filter.label}</label>
          </div>
        `;
        return container;
      default:
        return null;
    }

    input.id = filter.id;
    container.appendChild(input);
    return container;
  }

  renderFilterControls() {
    try {
      const sectionFilters = filterConfig[this.sectionKey] || [];
      const filterLayout =
        this.globalSettings && typeof this.globalSettings.filterLayout === 'object'
          ? this.globalSettings.filterLayout
          : {};
      const sectionLayout = Array.isArray(filterLayout[this.sectionKey])
        ? filterLayout[this.sectionKey]
        : [];
      const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

      const sortedItems = [...sectionFilters].sort((a, b) => {
        const orderA = layoutMap.get(a.id)?.order ?? Infinity;
        const orderB = layoutMap.get(b.id)?.order ?? Infinity;
        return orderA - orderB;
      });

      if (this.elements.mainFilters) this.elements.mainFilters.innerHTML = '';
      if (this.elements.moreFilters) this.elements.moreFilters.innerHTML = '';

      sortedItems.forEach((item) => {
        const location = layoutMap.get(item.id)?.location || item.defaultLocation;
        const container =
          location === 'main' ? this.elements.mainFilters : this.elements.moreFilters;

        if (container) {
          let element;
          if (item.type === 'component') {
            element = this.createUiComponent(item.componentName);
          } else {
            element = this.createFilterElement(item);
          }
          if (element) {
            container.appendChild(element);
          }
        }
      });

      // Popula dinamicamente as prioridades de regulação
      this.populateRegulationPriorities();
    } catch (e) {
      logError(
        `Erro ao renderizar filtros para ${this.sectionKey}`,
        {
          sectionKey: this.sectionKey,
          errorMessage: e.message,
          error: e,
        },
        ERROR_CATEGORIES.SECTION_FILTER_RENDER
      );
    }
  }

  populateRegulationPriorities() {
    if (this.sectionKey === 'regulations' && this.globalSettings?.regulationPriorities) {
      const prioritySelect = document.getElementById('regulation-filter-priority');
      if (prioritySelect) {
        // Limpa as opções existentes exceto a primeira ("Todas")
        while (prioritySelect.children.length > 1) {
          prioritySelect.removeChild(prioritySelect.lastChild);
        }

        // Adiciona as prioridades dinâmicas
        this.globalSettings.regulationPriorities.forEach((priority) => {
          const option = document.createElement('option');
          option.value = priority;
          option.textContent = priority;
          prioritySelect.appendChild(option);
        });
      }
    }
  }

  createUiComponent(componentName) {
    switch (componentName) {
      case 'date-range':
        return this.renderDateRangeComponent();
      case 'saved-filters':
        return this.renderSavedFiltersComponent();
      default:
        return null;
    }
  }

  renderDateRangeComponent() {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-2 gap-4 text-sm';
    container.innerHTML = `
        <div>
            <label for="${this.prefix}-date-initial" class="block font-medium">Data Inicial</label>
            <input type="date" id="${this.prefix}-date-initial" class="mt-1 w-full px-2 py-1 border border-slate-300 rounded-md"/>
        </div>
        <div>
            <label for="${this.prefix}-date-final" class="block font-medium">Data Final</label>
            <input type="date" id="${this.prefix}-date-final" class="mt-1 w-full px-2 py-1 border border-slate-300 rounded-md"/>
        </div>
      `;
    this.elements.dateInitial = container.querySelector(`#${this.prefix}-date-initial`);
    this.elements.dateFinal = container.querySelector(`#${this.prefix}-date-final`);
    return container;
  }

  renderSavedFiltersComponent() {
    const container = document.createElement('div');
    container.className = 'mt-4 pt-4 border-t';
    container.id = `${this.prefix}-saved-filters-container`;
    container.innerHTML = `
      <h3 class="text-sm font-semibold text-slate-600 mt-3 mb-2">Filtros Salvos</h3>
      <div class="flex items-center gap-2">
        <select id="${this.prefix}-saved-filters-select" class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md bg-white text-sm" title="Carregar um filtro salvo">
          <option value="">Carregar filtro...</option>
        </select>
        <button id="${this.prefix}-saved-filters-load" class="px-2 py-1 bg-blue-500 text-white rounded-md text-sm">Carregar</button>
        <button id="${this.prefix}-saved-filters-delete" class="px-2 py-1 bg-red-500 text-white rounded-md text-sm">Excluir</button>
      </div>
    `;
    return container;
  }

  applyAutomationFilters(filterSettings, ruleName) {
    if (!filterSettings) return;

    // --- INÍCIO DA CORREÇÃO ---
    // Aplica o período de busca da regra, se definido
    if (filterSettings.dateRange) {
      const { start, end } = filterSettings.dateRange;
      if (this.elements.dateInitial && start !== null && !isNaN(start)) {
        this.elements.dateInitial.valueAsDate = Utils.calculateRelativeDate(start);
      }
      if (this.elements.dateFinal && end !== null && !isNaN(end)) {
        this.elements.dateFinal.valueAsDate = Utils.calculateRelativeDate(end);
      }
    }
    // --- FIM DA CORREÇÃO ---

    Object.entries(filterSettings).forEach(([filterId, value]) => {
      // Pula a propriedade dateRange que já foi tratada
      if (filterId === 'dateRange') return;

      const el = document.getElementById(filterId);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = value;
        } else {
          el.value = value;
        }
      }
    });

    this.fetchData();

    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.innerHTML = `
            <div class="flex justify-between items-center">
                <span>Filtro automático aplicado: <strong>${ruleName}</strong></span>
                <button class="clear-automation-btn text-blue-800 hover:text-blue-900 font-bold" title="Limpar filtro automático">&times;</button>
            </div>
        `;
      this.elements.automationFeedback.classList.remove('hidden');
    }
  }

  clearAutomationFeedbackAndFilters(shouldRender = true) {
    if (
      this.elements.automationFeedback &&
      !this.elements.automationFeedback.classList.contains('hidden')
    ) {
      this.elements.automationFeedback.classList.add('hidden');
      this.elements.automationFeedback.innerHTML = '';
      this.clearFilters(false);
    }
    if (shouldRender) {
      this.applyFiltersAndRender();
    }
  }
}
