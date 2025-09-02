/**
 * 🏥 ASSISTENTE DE REGULAÇÃO MÉDICA - MAIN UI
 *
 * 🚨 ANTES DE MODIFICAR: Leia obrigatoriamente agents.md
 * 📋 Instruções IA: .github/instructions/agents.md.instructions.md
 * 🔒 Projeto médico - dados sensíveis - nunca logar CPF/CNS/dados pessoais
 */

// Cross-browser API alias (lint-safe)
const api = typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome : {};
import * as API from './api.js';
import './browser-polyfill.js';
import { defaultFieldConfig } from './field-config.js';
import * as Renderers from './renderers.js';
import { SectionManager } from './SectionManager.js';
import { store } from './store.js';
import { TimelineManager } from './TimelineManager.js'; // Importa o novo gestor
import * as PatientCard from './ui/patient-card.js';
import * as Search from './ui/search.js';
import * as Utils from './utils.js';

// --- ÍCONES ---
const sectionIcons = {
  'patient-details':
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-check-icon lucide-user-round-check"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/></svg>',
  timeline:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gantt-chart"><path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/></svg>',
  regulations:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check-icon lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  consultations:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope-icon lucide-stethoscope"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>',
  exams:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-microscope-icon lucide-microscope"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>',
  appointments:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check-icon lucide-calendar-check"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
  documents:
    '<svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-file-text" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
};

let currentRegulationData = null;
const sectionManagers = {}; // Objeto para armazenar instâncias de SectionManager

// Global listeners storage for memory leak prevention
const globalListeners = {
  onOpenOptionsClick: null,
  onReloadSidebarClick: null,
  onAutoModeToggleChange: null,
  onReloadBtnClick: null,
  onModalCloseBtnClick: null,
  onInfoModalClick: null,
  onMainContentClick: null,
  onInfoBtnClick: null,
  onDOMContentLoaded: null,
};

// --- FUNÇÃO AUXILIAR DE FILTRAGEM ---
/**
 * Aplica um filtro de texto normalizado a um array de dados.
 * @param {Array} items - O array de itens a ser filtrado.
 * @param {string} text - O texto de busca (pode conter múltiplos termos separados por vírgula).
 * @param {Function} getFieldContent - Uma função que recebe um item e retorna a string a ser pesquisada.
 * @returns {Array} O array de itens filtrado.
 */
const applyNormalizedTextFilter = (items, text, getFieldContent) => {
  const searchTerms = Utils.normalizeString(text)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (searchTerms.length === 0) return items;
  return items.filter((item) => {
    const content = Utils.normalizeString(getFieldContent(item));
    return searchTerms.some((term) => content.includes(term));
  });
};

// --- LÓGICA DE FILTRAGEM ---
const consultationFilterLogic = (data, filters) => {
  let filteredData = [...data];
  if (filters['hide-no-show-checkbox']) {
    filteredData = filteredData.filter((c) => !c.isNoShow);
  }

  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['consultation-filter-keyword'],
    (c) =>
      [c.specialty, c.professional, c.unit, ...c.details.map((d) => `${d.label} ${d.value}`)].join(
        ' '
      )
  );

  filteredData = applyNormalizedTextFilter(filteredData, filters['consultation-filter-cid'], (c) =>
    c.details.map((d) => d.value).join(' ')
  );

  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['consultation-filter-specialty'],
    (c) => c.specialty || ''
  );
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['consultation-filter-professional'],
    (c) => c.professional || ''
  );
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['consultation-filter-unit'],
    (c) => c.unit || ''
  );

  return filteredData;
};

const examFilterLogic = (data, filters) => {
  let filteredData = [...data];

  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['exam-filter-name'],
    (item) => item.examName
  );
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['exam-filter-professional'],
    (item) => item.professional
  );
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['exam-filter-specialty'],
    (item) => item.specialty
  );

  return filteredData;
};

const appointmentFilterLogic = (data, filters, fetchType) => {
  let filteredData = [...data];
  const status = filters['appointment-filter-status'] || 'todos';

  if (status !== 'todos') {
    filteredData = filteredData.filter(
      (a) => (a.status || '').toUpperCase() === status.toUpperCase()
    );
  }

  if (fetchType === 'consultas') {
    filteredData = filteredData.filter((a) => !a.type.toUpperCase().includes('EXAME'));
  } else if (fetchType === 'exames') {
    filteredData = filteredData.filter((a) => a.type.toUpperCase().includes('EXAME'));
  }

  filteredData = applyNormalizedTextFilter(filteredData, filters['appointment-filter-term'], (a) =>
    [a.professional, a.specialty, a.description].join(' ')
  );
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['appointment-filter-location'],
    (a) => a.location || ''
  );

  return filteredData;
};

const regulationFilterLogic = (data, filters) => {
  let filteredData = [...data];
  const status = filters['regulation-filter-status'] || 'todos';
  const priority = filters['regulation-filter-priority'] || 'todas';

  if (status !== 'todos') {
    filteredData = filteredData.filter(
      (item) => (item.status || '').toUpperCase() === status.toUpperCase()
    );
  }

  if (priority !== 'todas') {
    filteredData = filteredData.filter(
      (item) => (item.priority || '').toUpperCase() === priority.toUpperCase()
    );
  }

  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['regulation-filter-procedure'],
    (item) => item.procedure || ''
  );
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['regulation-filter-requester'],
    (item) => item.requester || ''
  );

  return filteredData;
};

const documentFilterLogic = (data, filters) => {
  let filteredData = [...data];

  // Filtro por data (client-side)
  const startDateValue = document.getElementById('document-date-initial')?.value;
  const endDateValue = document.getElementById('document-date-final')?.value;

  if (startDateValue) {
    const start = Utils.parseDate(startDateValue);
    if (start) {
      filteredData = filteredData.filter((doc) => {
        const docDate = Utils.parseDate(doc.date.split(' ')[0]);
        return docDate && docDate >= start;
      });
    }
  }

  if (endDateValue) {
    const end = Utils.parseDate(endDateValue);
    if (end) {
      filteredData = filteredData.filter((doc) => {
        const docDate = Utils.parseDate(doc.date.split(' ')[0]);
        return docDate && docDate <= end;
      });
    }
  }

  // Filtro por palavra-chave normalizada
  filteredData = applyNormalizedTextFilter(
    filteredData,
    filters['document-filter-keyword'],
    (doc) => doc.description || ''
  );

  return filteredData;
};

const sectionConfigurations = {
  'patient-details': {}, // Seção especial sem fetch
  timeline: {}, // Configuração da Timeline será tratada pelo seu próprio gestor
  consultations: {
    fetchFunction: API.fetchAllConsultations,
    renderFunction: Renderers.renderConsultations,
    initialSortState: { key: 'sortableDate', order: 'desc' },
    filterLogic: consultationFilterLogic,
  },
  exams: {
    fetchFunction: API.fetchExamesSolicitados,
    renderFunction: Renderers.renderExams,
    initialSortState: { key: 'date', order: 'desc' },
    filterLogic: examFilterLogic,
  },
  appointments: {
    fetchFunction: API.fetchAppointments,
    renderFunction: Renderers.renderAppointments,
    initialSortState: { key: 'date', order: 'desc' },
    filterLogic: appointmentFilterLogic,
  },
  regulations: {
    fetchFunction: API.fetchAllRegulations,
    renderFunction: Renderers.renderRegulations,
    initialSortState: { key: 'date', order: 'desc' },
    filterLogic: regulationFilterLogic,
  },
  documents: {
    fetchFunction: API.fetchDocuments,
    renderFunction: Renderers.renderDocuments,
    initialSortState: { key: 'date', order: 'desc' },
    filterLogic: documentFilterLogic,
  },
};

// --- FUNÇÕES DE ESTILO E ÍCONES ---

/**
 * Injeta os ícones SVG nos cabeçalhos das seções.
 */
function applySectionIcons() {
  for (const sectionKey in sectionIcons) {
    const iconContainer = document.getElementById(`${sectionKey}-section-icon`);
    if (iconContainer) {
      iconContainer.innerHTML = sectionIcons[sectionKey];
    }
  }
}

/**
 * Lê os estilos customizados do storage e os aplica aos cabeçalhos
 * usando Variáveis CSS (CSS Custom Properties) para melhor performance e manutenibilidade.
 * @param {object} styles - O objeto de estilos vindo do storage.
 */
function applyCustomHeaderStyles(styles) {
  // O CSS base com as variáveis e fallbacks já está definido em sidebar.html.
  // Esta função apenas define os valores das variáveis para cada seção.

  const defaultStyles = {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    iconColor: '#1e293b',
    fontSize: '16px',
  };

  for (const sectionKey in sectionIcons) {
    const sectionId =
      sectionKey === 'patient-details' ? 'patient-details-section' : `${sectionKey}-section`;

    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) continue;

    // Pega o estilo salvo para a seção ou usa um objeto vazio.
    const savedStyle = styles[sectionKey] || {};
    // Combina com os padrões para garantir que todas as propriedades existam.
    const finalStyle = { ...defaultStyles, ...savedStyle };

    // Define as variáveis CSS no elemento da seção.
    sectionElement.style.setProperty('--section-bg-color', finalStyle.backgroundColor);
    sectionElement.style.setProperty('--section-font-color', finalStyle.color);
    sectionElement.style.setProperty('--section-icon-color', finalStyle.iconColor);
    sectionElement.style.setProperty('--section-font-size', finalStyle.fontSize);
  }
}

async function selectPatient(patientInfo, forceRefresh = false) {
  const currentPatient = store.getPatient();
  if (currentPatient && currentPatient.ficha.isenPK.idp === patientInfo.idp && !forceRefresh) {
    return;
  }
  Utils.toggleLoader(true);
  Utils.clearMessage();
  store.setPatientUpdating();
  try {
    const ficha = await API.fetchVisualizaUsuario(patientInfo);
    const cadsus = await API.fetchCadsusData({
      cpf: Utils.getNestedValue(ficha, 'entidadeFisica.entfCPF'),
      cns: ficha.isenNumCadSus,
    });
    Object.values(sectionManagers).forEach((manager) => {
      if (typeof manager.clearAutomationFeedbackAndFilters === 'function') {
        manager.clearAutomationFeedbackAndFilters(false);
      } else if (typeof manager.clearAutomation === 'function') {
        manager.clearAutomation();
      }
    });
    store.setPatient(ficha, cadsus);
    await updateRecentPatients(store.getPatient());
  } catch (error) {
    Utils.showMessage(error.message, 'error');
    console.error(error);
    store.clearPatient();
  } finally {
    Utils.toggleLoader(false);
  }
}

async function init() {
  let baseUrlConfigured = true;

  try {
    await API.getBaseUrl();
  } catch (error) {
    if (error?.message === 'URL_BASE_NOT_CONFIGURED') {
      baseUrlConfigured = false;

      const mainContent = document.getElementById('main-content');
      const urlWarning = document.getElementById('url-config-warning');
      const openOptions = document.getElementById('open-options-from-warning');
      const reloadSidebar = document.getElementById('reload-sidebar-from-warning');

      if (mainContent) mainContent.classList.add('hidden');
      if (urlWarning) urlWarning.classList.remove('hidden');

      if (openOptions) {
        // Remove antes de adicionar
        if (globalListeners.onOpenOptionsClick) {
          openOptions.removeEventListener('click', globalListeners.onOpenOptionsClick);
        }
        globalListeners.onOpenOptionsClick = function () {
          api.runtime.openOptionsPage();
        };
        openOptions.addEventListener('click', globalListeners.onOpenOptionsClick);
      }
      if (reloadSidebar) {
        if (globalListeners.onReloadSidebarClick) {
          reloadSidebar.removeEventListener('click', globalListeners.onReloadSidebarClick);
        }
        globalListeners.onReloadSidebarClick = function () {
          location.reload();
        };
        reloadSidebar.addEventListener('click', globalListeners.onReloadSidebarClick);
      }

      // **não retornamos mais aqui**, apenas marcamos que deu “fallback”
    } else {
      console.error('Initialization failed:', error);
      Utils.showMessage('Ocorreu um erro inesperado ao iniciar a extensão.', 'error');
      // nesse caso você pode querer return ou throw de verdade
      return;
    }
  }

  // === setup das abas: sempre rodar, mesmo sem baseURL ===
  Utils.setupTabs(document.getElementById('layout-tabs-container'));
  Utils.setupTabs(document.getElementById('patterns-tabs-container'));
  // (adicione aqui quaisquer outros containers de aba que tenha)

  // === só o resto do fluxo principal depende de baseUrlConfigured ===
  if (!baseUrlConfigured) {
    // já mostramos o formulário de URL, não temos mais nada a fazer
    return;
  }

  // agora vem tudo o que precisa de baseURL
  const [globalSettings, regulationPriorities] = await Promise.all([
    loadConfigAndData(),
    API.fetchRegulationPriorities(),
  ]);

  globalSettings.regulationPriorities = regulationPriorities;

  applySectionIcons();
  applyCustomHeaderStyles(globalSettings.sectionHeaderStyles);
  applySectionOrder(globalSettings.sidebarSectionOrder);

  Search.init({ onSelectPatient: selectPatient });
  PatientCard.init(globalSettings.fieldConfigLayout, {
    onForceRefresh: selectPatient,
  });
  initializeSections(globalSettings);
  applyUserPreferences(globalSettings);
  addGlobalEventListeners();
  setupAutoModeToggle();

  await checkForPendingRegulation();
}

async function loadConfigAndData() {
  const syncData = await api.storage.sync.get({
    patientFields: defaultFieldConfig,
    filterLayout: {},
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    autoLoadDocuments: false,
    enableAutomaticDetection: true,
    dateRangeDefaults: {},
    sidebarSectionOrder: [],
    sectionHeaderStyles: {}, // Carrega a nova configuração de estilos
  });
  const localData = await api.storage.local.get({
    recentPatients: [],
    savedFilterSets: {},
    automationRules: [],
  });
  store.setRecentPatients(localData.recentPatients);
  store.setSavedFilterSets(localData.savedFilterSets);

  return {
    fieldConfigLayout: defaultFieldConfig.map((defaultField) => {
      const savedField = syncData.patientFields.find((f) => f.id === defaultField.id);
      return savedField ? { ...defaultField, ...savedField } : defaultField;
    }),
    filterLayout: syncData.filterLayout,
    userPreferences: {
      autoLoadExams: syncData.autoLoadExams,
      autoLoadConsultations: syncData.autoLoadConsultations,
      autoLoadAppointments: syncData.autoLoadAppointments,
      autoLoadRegulations: syncData.autoLoadRegulations,
      autoLoadDocuments: syncData.autoLoadDocuments,
      enableAutomaticDetection: syncData.enableAutomaticDetection,
      dateRangeDefaults: syncData.dateRangeDefaults,
    },
    sidebarSectionOrder: syncData.sidebarSectionOrder,
    sectionHeaderStyles: syncData.sectionHeaderStyles, // Passa os estilos para frente
  };
}

function applySectionOrder(order) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const sectionMap = {
    'patient-details': 'patient-details-section',
    timeline: 'timeline-section',
    regulations: 'regulations-section',
    consultations: 'consultations-section',
    exams: 'exams-section',
    appointments: 'appointments-section',
    documents: 'documents-section',
  };

  const patientCardId = 'patient-details';

  // Pega a ordem salva ou a ordem padrão do DOM
  const savedOrder = order && order.length > 0 ? order : Object.keys(sectionMap);

  // Garante que a ficha do paciente esteja sempre no topo
  // 1. Remove a ficha da ordem atual, não importa onde esteja.
  const finalOrder = savedOrder.filter((id) => id !== patientCardId);
  // 2. Adiciona a ficha no início da lista.
  finalOrder.unshift(patientCardId);

  // Adiciona quaisquer novas seções (não presentes na ordem salva) ao final
  const knownIds = new Set(finalOrder);
  Object.keys(sectionMap).forEach((id) => {
    if (!knownIds.has(id)) {
      finalOrder.push(id);
    }
  });

  // Reordena os elementos no DOM
  finalOrder.forEach((tabId) => {
    const sectionId = sectionMap[tabId];
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      mainContent.appendChild(sectionElement);
    }
  });
}

function initializeSections(globalSettings) {
  Object.keys(sectionConfigurations).forEach((key) => {
    if (key === 'patient-details') return;
    if (key === 'timeline') {
      sectionManagers[key] = new TimelineManager(key, sectionConfigurations[key], globalSettings);
      return;
    }
    sectionManagers[key] = new SectionManager(key, sectionConfigurations[key], globalSettings);
  });
}

function applyUserPreferences(globalSettings) {
  const { userPreferences, filterLayout } = globalSettings;
  const { dateRangeDefaults } = userPreferences;

  const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
  const defaultSystemRanges = {
    consultations: { start: -6, end: 0 },
    exams: { start: -6, end: 0 },
    appointments: { start: -1, end: 3 },
    regulations: { start: -12, end: 0 },
    documents: { start: -24, end: 0 },
  };

  sections.forEach((section) => {
    const range = dateRangeDefaults[section] || defaultSystemRanges[section];
    const prefix = section.replace(/s$/, '');

    const initialEl = document.getElementById(`${prefix}-date-initial`);
    const finalEl = document.getElementById(`${prefix}-date-final`);

    if (initialEl) initialEl.valueAsDate = Utils.calculateRelativeDate(range.start);
    if (finalEl) finalEl.valueAsDate = Utils.calculateRelativeDate(range.end);
  });

  Object.values(filterLayout)
    .flat()
    .forEach((filterSetting) => {
      const el = document.getElementById(filterSetting.id);
      if (el && filterSetting.defaultValue !== undefined && filterSetting.defaultValue !== null) {
        if (el.type === 'checkbox') {
          el.checked = filterSetting.defaultValue;
        } else {
          el.value = filterSetting.defaultValue;
        }
      }
    });
}

function setupAutoModeToggle() {
  const toggle = document.getElementById('auto-mode-toggle');
  const label = document.getElementById('auto-mode-label');

  api.storage.sync.get({ enableAutomaticDetection: true }).then((settings) => {
    toggle.checked = settings.enableAutomaticDetection;
    label.textContent = settings.enableAutomaticDetection ? 'Auto' : 'Manual';
  });

  // Remove antes de adicionar
  if (globalListeners.onAutoModeToggleChange) {
    toggle.removeEventListener('change', globalListeners.onAutoModeToggleChange);
  }

  globalListeners.onAutoModeToggleChange = function (event) {
    const isEnabled = event.target.checked;
    api.storage.sync.set({ enableAutomaticDetection: isEnabled });
    label.textContent = isEnabled ? 'Auto' : 'Manual';
  };

  toggle.addEventListener('change', globalListeners.onAutoModeToggleChange);
}

async function handleRegulationLoaded(regulationData) {
  Utils.toggleLoader(true);
  try {
    currentRegulationData = regulationData;

    if (regulationData && regulationData.isenPKIdp && regulationData.isenPKIds) {
      const patientInfo = {
        idp: regulationData.isenPKIdp,
        ids: regulationData.isenPKIds,
      };
      await selectPatient(patientInfo);

      const contextName = regulationData.apcnNome || regulationData.prciNome || 'Contexto';
      const infoBtn = document.getElementById('context-info-btn');
      infoBtn.title = `Contexto: ${contextName.trim()}`;
      infoBtn.classList.remove('hidden');

      await applyAutomationRules(regulationData);
    } else {
      currentRegulationData = null;
      Utils.showMessage('Não foi possível extrair os dados do paciente da regulação.', 'error');
    }
  } catch (error) {
    currentRegulationData = null;
    Utils.showMessage(`Erro ao processar a regulação: ${error.message}`, 'error');
    console.error('Erro ao processar a regulação:', error);
  } finally {
    Utils.toggleLoader(false);
  }
}

async function applyAutomationRules(regulationData) {
  const { automationRules } = await api.storage.local.get({
    automationRules: [],
  });
  if (!automationRules || automationRules.length === 0) return;

  const contextString = [
    regulationData.prciNome || '',
    regulationData.prciCodigo || '',
    regulationData.apcnNome || '',
    regulationData.apcnCod || '',
  ]
    .join(' ')
    .toLowerCase();

  for (const rule of automationRules) {
    if (rule.isActive) {
      const hasMatch = rule.triggerKeywords.some((keyword) =>
        contextString.includes(keyword.toLowerCase().trim())
      );

      if (hasMatch) {
        // Aplicar filtros nas seções existentes E na nova timeline
        Object.entries(sectionManagers).forEach(([key, manager]) => {
          if (rule.filterSettings[key] && typeof manager.applyAutomationFilters === 'function') {
            manager.applyAutomationFilters(rule.filterSettings[key], rule.name);
          }
        });
        return; // Aplica apenas a primeira regra correspondente
      }
    }
  }
}

/**
 * Lida com mudanças no storage da extensão.
 * @param {object} changes - Objeto com as mudanças.
 * @param {string} areaName - A área do storage que mudou ('sync' ou 'local').
 */
function handleStorageChange(changes, areaName) {
  if (areaName === 'local' && changes.pendingRegulation) {
    // Apenas processa se a detecção automática estiver LIGADA
    api.storage.sync.get({ enableAutomaticDetection: true }).then((settings) => {
      if (settings.enableAutomaticDetection) {
        const { newValue } = changes.pendingRegulation;
        if (newValue && newValue.isenPKIdp) {
          console.log(
            '[Assistente Sidebar] Nova regulação detectada via storage.onChanged:',
            newValue
          );
          handleRegulationLoaded(newValue);
          api.storage.local.remove('pendingRegulation');
        }
      }
    });
  }

  if (areaName === 'sync' && changes.sectionHeaderStyles) {
    api.runtime.reload();
  }

  if (areaName === 'sync' && changes.enableAutomaticDetection) {
    // Mantém o botão da sidebar sincronizado com a configuração
    setupAutoModeToggle();
  }
}

function addGlobalEventListeners() {
  const mainContent = document.getElementById('main-content');
  const infoModal = document.getElementById('info-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const infoBtn = document.getElementById('context-info-btn');
  const reloadBtn = document.getElementById('reload-sidebar-btn');

  // Create named functions for listeners to allow removal
  if (!globalListeners.onReloadBtnClick) {
    globalListeners.onReloadBtnClick = function () {
      const patient = store.getPatient();
      if (patient && patient.ficha) {
        Utils.showDialog({
          message:
            'Um paciente está selecionado e o estado atual será perdido. Deseja realmente recarregar o assistente?',
          onConfirm: () => {
            location.reload();
          },
        });
      } else {
        location.reload();
      }
    };
  }

  if (!globalListeners.onModalCloseBtnClick) {
    globalListeners.onModalCloseBtnClick = function () {
      const modal = document.getElementById('info-modal');
      if (modal) modal.classList.add('hidden');
    };
  }

  if (!globalListeners.onInfoModalClick) {
    globalListeners.onInfoModalClick = function (e) {
      if (e.target === e.currentTarget) {
        e.currentTarget.classList.add('hidden');
      }
    };
  }

  if (!globalListeners.onMainContentClick) {
    globalListeners.onMainContentClick = async function (event) {
      await handleGlobalActions(event);
    };
  }

  if (!globalListeners.onInfoBtnClick) {
    globalListeners.onInfoBtnClick = function () {
      if (!currentRegulationData) {
        Utils.showMessage('Nenhuma informação de regulação carregada.', 'info');
        return;
      }
      const modalTitle = document.getElementById('modal-title');
      const modalContent = document.getElementById('modal-content');
      const modal = document.getElementById('info-modal');

      modalTitle.textContent = 'Dados da Regulação (JSON)';
      const formattedJson = JSON.stringify(currentRegulationData, null, 2);

      modalContent.innerHTML = `<pre class="bg-slate-100 p-2 rounded-md text-xs whitespace-pre-wrap break-all">${formattedJson}</pre>`;

      modal.classList.remove('hidden');
    };
  }

  // Add listeners
  if (reloadBtn) reloadBtn.addEventListener('click', globalListeners.onReloadBtnClick);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', globalListeners.onModalCloseBtnClick);
  if (infoModal) infoModal.addEventListener('click', globalListeners.onInfoModalClick);
  if (mainContent) mainContent.addEventListener('click', globalListeners.onMainContentClick);
  if (infoBtn) infoBtn.addEventListener('click', globalListeners.onInfoBtnClick);

  // Add storage listener only once
  if (!addGlobalEventListeners.storageListenerAdded) {
    api.storage.onChanged.addListener(handleStorageChange);
    addGlobalEventListeners.storageListenerAdded = true;
  }
}

async function handleGlobalActions(event) {
  const target = event.target;
  const copyBtn = target.closest('.copy-icon');
  if (copyBtn) {
    await copyToClipboard(copyBtn);
    return;
  }
  const examResultBtn = target.closest('.view-exam-result-btn');
  if (examResultBtn) {
    await handleViewExamResult(examResultBtn);
    return;
  }

  const appointmentDetailsBtn = target.closest('.view-appointment-details-btn');
  if (appointmentDetailsBtn) {
    await handleShowAppointmentDetailsModal(appointmentDetailsBtn);
    return;
  }
  const regulationDetailsBtn = target.closest('.view-regulation-details-btn');
  if (regulationDetailsBtn) {
    await handleShowRegulationDetailsModal(regulationDetailsBtn);
    return;
  }

  const appointmentInfoBtn = target.closest('.appointment-info-btn');
  if (appointmentInfoBtn) {
    handleShowAppointmentInfo(appointmentInfoBtn);
    return;
  }

  const documentBtn = target.closest('.view-document-btn');
  if (documentBtn) {
    await handleViewDocument(documentBtn);
    return;
  }

  const regulationAttachmentBtn = target.closest('.view-regulation-attachment-btn');
  if (regulationAttachmentBtn) {
    await handleViewRegulationAttachment(regulationAttachmentBtn);
    return;
  }
}

async function copyToClipboard(button) {
  if (button.dataset.inProgress === 'true') return;
  const textToCopy = button.dataset.copyText;
  if (!textToCopy) return;
  button.dataset.inProgress = 'true';
  const original = button;
  try {
    await navigator.clipboard.writeText(textToCopy);
    if (document.body.contains(original)) original.textContent = '✅';
  } catch (err) {
    console.error('Falha ao copiar texto: ', err);
    if (document.body.contains(original)) original.textContent = '❌';
  } finally {
    setTimeout(() => {
      if (document.body.contains(original)) original.textContent = '📄';
      if (document.body.contains(original)) original.dataset.inProgress = 'false';
    }, 1200);
  }
}

async function updateRecentPatients(patientData) {
  if (!patientData || !patientData.ficha) return;
  const newRecent = { ...patientData };
  const currentRecents = store.getRecentPatients();
  const filtered = (currentRecents || []).filter(
    (p) => p.ficha.isenPK.idp !== newRecent.ficha.isenPK.idp
  );
  const updatedRecents = [newRecent, ...filtered].slice(0, 5);
  await api.storage.local.set({ recentPatients: updatedRecents });
  store.setRecentPatients(updatedRecents);
}

async function handleViewExamResult(button) {
  const { idp, ids } = button.dataset;
  const filePath = await API.fetchResultadoExame({ idp, ids });
  const baseUrl = await API.getBaseUrl();
  let url = 'about:blank';
  if (filePath) {
    url = filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`;
  }
  api.tabs.create({ url });
}

async function handleViewDocument(button) {
  const { idp, ids } = button.dataset;
  try {
    const docUrl = await API.fetchDocumentUrl({ idp, ids });
    api.tabs.create({ url: docUrl || 'about:blank' });
    if (!docUrl) {
      console.warn('URL do documento não encontrada.');
    }
  } catch (error) {
    console.error('Falha ao visualizar documento:', error);
  }
}

async function handleViewRegulationAttachment(button) {
  const { idp, ids } = button.dataset;

  try {
    const fileUrl = await API.fetchRegulationAttachmentUrl({ idp, ids });
    if (fileUrl) {
      // Use browser extension API instead of window.open
      await api.tabs.create({ url: fileUrl });
    } else {
      console.warn('⚠️ URL do anexo não encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar anexo da regulação:', error);
  }
}

function showModal(title, content) {
  const modal = document.getElementById('info-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modal.classList.remove('hidden');
}

function createDetailRow(label, value) {
  if (!value || String(value).trim() === '') return '';
  return `<div class="py-2 border-b border-slate-100 flex justify-between items-start gap-4">
            <span class="font-semibold text-slate-600 flex-shrink-0">${label}:</span>
            <span class="text-slate-800 text-right break-words">${value}</span>
          </div>`;
}

function formatRegulationDetailsForModal(data) {
  if (!data) return '<p>Dados da regulação não encontrados.</p>';
  let content = '';
  content += createDetailRow('Status', data.reguStatus);
  content += createDetailRow('Tipo', data.reguTipo === 'ENC' ? 'Consulta' : 'Exame');
  content += createDetailRow('Data Solicitação', data.reguDataStr);
  content += createDetailRow('Procedimento', data.prciNome);
  content += createDetailRow('CID', `${data.tcidCod} - ${data.tcidDescricao}`);
  content += createDetailRow('Profissional Sol.', data.prsaEntiNome);
  content += createDetailRow('Unidade Sol.', data.limoSolicitanteNome);
  content += createDetailRow('Unidade Desejada', data.limoDesejadaNome);
  content += createDetailRow('Gravidade', data.reguGravidade);
  if (data.reguJustificativa && data.reguJustificativa !== 'null') {
    content += `<div class="py-2">
    <span class="font-semibold text-slate-600">Justificativa:</span>
    <p class="text-slate-800 whitespace-pre-wrap mt-1 p-2 bg-slate-50 rounded">${data.reguJustificativa.replace(
      /\\n/g,
      '\n'
    )}</p>
</div>`;
  }
  return content;
}

function formatAppointmentDetailsForModal(data) {
  if (!data) return '<p>Dados do agendamento não encontrados.</p>';

  let status = 'Agendado';
  if (data.agcoIsCancelado === 't') status = 'Cancelado';
  else if (data.agcoIsFaltante === 't') status = 'Faltou';
  else if (data.agcoIsAtendido === 't') status = 'Atendido';

  let content = '';
  content += createDetailRow('Status', status);
  content += createDetailRow('Data', `${data.agcoData} às ${data.agcoHoraPrevista}`);
  content += createDetailRow('Local', data.unidadeSaudeDestino?.entidade?.entiNome);
  content += createDetailRow(
    'Profissional',
    data.profissionalDestino?.entidadeFisica?.entidade?.entiNome
  );
  content += createDetailRow('Especialidade', data.atividadeProfissionalCnes?.apcnNome);
  content += createDetailRow('Procedimento', data.procedimento?.prciNome);
  content += createDetailRow('Convênio', data.convenio?.entidade?.entiNome);
  if (data.agcoObs) {
    content += `<div class="py-2">
                        <span class="font-semibold text-slate-600">Observação:</span>
                        <p class="text-slate-800 whitespace-pre-wrap mt-1 p-2 bg-slate-50 rounded">${data.agcoObs}</p>
                    </div>`;
  }
  return content;
}

function formatExamAppointmentDetailsForModal(data) {
  if (!data) return '<p>Dados do agendamento de exame não encontrados.</p>';

  let content = '';
  content += createDetailRow('Data Agendamento', data.examDataCad);
  content += createDetailRow('Unidade Origem', data.ligacaoModularOrigem?.limoNome);
  content += createDetailRow('Unidade Destino', data.ligacaoModularDestino?.limoNome);
  content += createDetailRow(
    'Profissional Sol.',
    data.profissional?.entidadeFisica?.entidade?.entiNome
  );
  content += createDetailRow('Caráter', data.CaraterAtendimento?.caraDescri);
  content += createDetailRow('Critério', data.criterioExame?.critNome);

  return content;
}

async function handleShowRegulationDetailsModal(button) {
  const { idp, ids } = button.dataset;
  showModal('Detalhes da Regulação', '<p>Carregando...</p>');
  try {
    const data = await API.fetchRegulationDetails({
      reguIdp: idp,
      reguIds: ids,
    });
    const content = formatRegulationDetailsForModal(data);
    showModal('Detalhes da Regulação', content);
  } catch (error) {
    showModal('Erro', `<p>Não foi possível carregar os detalhes: ${error.message}</p>`);
  }
}

async function handleShowAppointmentDetailsModal(button) {
  const { idp, ids, type } = button.dataset;
  const isExam = type.toUpperCase().includes('EXAME');
  const title = isExam ? 'Detalhes do Agendamento de Exame' : 'Detalhes da Consulta Agendada';

  showModal(title, '<p>Carregando...</p>');

  try {
    let data;
    let content;
    if (isExam) {
      data = await API.fetchExamAppointmentDetails({ idp, ids });
      content = formatExamAppointmentDetailsForModal(data);
    } else {
      data = await API.fetchAppointmentDetails({ idp, ids });
      content = formatAppointmentDetailsForModal(data);
    }
    showModal(title, content);
  } catch (error) {
    showModal('Erro', `<p>Não foi possível carregar os detalhes: ${error.message}</p>`);
  }
}

function handleShowAppointmentInfo(button) {
  const data = JSON.parse(button.dataset.appointment);
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const infoModal = document.getElementById('info-modal');
  modalTitle.textContent = 'Detalhes do Agendamento';
  modalContent.innerHTML = `
    <p><strong>ID:</strong> ${data.id}</p>
    <p><strong>Tipo:</strong> ${
      data.isSpecialized ? 'Especializada' : data.isOdonto ? 'Odontológica' : data.type
    }</p>
    <p><strong>Status:</strong> ${data.status}</p>
    <p><strong>Data:</strong> ${data.date} às ${data.time}</p>
    <p><strong>Local:</strong> ${data.location}</p>
    <p><strong>Profissional:</strong> ${data.professional}</p>
    <p><strong>Especialidade:</strong> ${data.specialty || 'N/A'}</p>
    <p><strong>Procedimento:</strong> ${data.description}</p>
  `;
  infoModal.classList.remove('hidden');
}

async function checkForPendingRegulation() {
  try {
    const { pendingRegulation } = await api.storage.local.get('pendingRegulation');
    if (pendingRegulation && pendingRegulation.isenPKIdp) {
      await handleRegulationLoaded(pendingRegulation);
      await api.storage.local.remove('pendingRegulation');
    }
  } catch (e) {
    console.error('Erro ao verificar regulação pendente:', e);
  }
}

/**
 * Função de limpeza para remover todos os event listeners globais.
 * Previne memory leaks, especialmente em ambientes de desenvolvimento com hot-reloading.
 */
function cleanupEventListeners() {
  console.log('[Assistente] Removendo event listeners globais para limpeza.');

  const mainContent = document.getElementById('main-content');
  const infoModal = document.getElementById('info-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const infoBtn = document.getElementById('context-info-btn');
  const reloadBtn = document.getElementById('reload-sidebar-btn');
  const toggle = document.getElementById('auto-mode-toggle');
  const openOptions = document.getElementById('open-options-from-warning');
  const reloadSidebar = document.getElementById('reload-sidebar-from-warning');

  // Remover listeners de elementos DOM
  if (reloadBtn && globalListeners.onReloadBtnClick)
    reloadBtn.removeEventListener('click', globalListeners.onReloadBtnClick);
  if (modalCloseBtn && globalListeners.onModalCloseBtnClick)
    modalCloseBtn.removeEventListener('click', globalListeners.onModalCloseBtnClick);
  if (infoModal && globalListeners.onInfoModalClick)
    infoModal.removeEventListener('click', globalListeners.onInfoModalClick);
  if (mainContent && globalListeners.onMainContentClick)
    mainContent.removeEventListener('click', globalListeners.onMainContentClick);
  if (infoBtn && globalListeners.onInfoBtnClick)
    infoBtn.removeEventListener('click', globalListeners.onInfoBtnClick);
  if (toggle && globalListeners.onAutoModeToggleChange)
    toggle.removeEventListener('change', globalListeners.onAutoModeToggleChange);
  if (openOptions && globalListeners.onOpenOptionsClick)
    openOptions.removeEventListener('click', globalListeners.onOpenOptionsClick);
  if (reloadSidebar && globalListeners.onReloadSidebarClick)
    reloadSidebar.removeEventListener('click', globalListeners.onReloadSidebarClick);

  // Remover listener do documento
  if (globalListeners.onDOMContentLoaded) {
    document.removeEventListener('DOMContentLoaded', globalListeners.onDOMContentLoaded);
  }

  // Remover listener da API de storage
  if (api.storage.onChanged.hasListener(handleStorageChange)) {
    api.storage.onChanged.removeListener(handleStorageChange);
  }
}

// Initialize with removable listener
globalListeners.onDOMContentLoaded = init;
document.addEventListener('DOMContentLoaded', globalListeners.onDOMContentLoaded);

// Adiciona o listener de limpeza para quando a página da sidebar for descarregada
// eslint-disable-next-line no-restricted-globals
window.addEventListener('pagehide', cleanupEventListeners);
