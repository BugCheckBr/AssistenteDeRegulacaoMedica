import * as API from './api.js'; // Importa a API para buscar prioridades
import './browser-polyfill.js';
import { defaultFieldConfig } from './field-config.js';
import { filterConfig } from './filter-config.js';
import * as Utils from './utils.js';

// Cross-browser API alias
const api = typeof browser !== 'undefined' ? browser : chrome;

// --- Constantes ---
const CONFIG_VERSION = '1.3'; // Versão da estrutura de configuração

// --- Variáveis de Estado ---
let automationRules = [];
let currentlyEditingRuleId = null;
let draggedTab = null; // Variável para a aba arrastada

// --- Elementos do DOM ---
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('statusMessage');
const closeButton = document.getElementById('closeButton');
const restoreDefaultsButton = document.getElementById('restoreDefaultsButton');
const exportButton = document.getElementById('exportButton');
const importFileInput = document.getElementById('import-file-input');

// Ficha do Paciente
const mainFieldsZone = document.getElementById('main-fields-zone');
const moreFieldsZone = document.getElementById('more-fields-zone');

// Abas e Zonas de Filtros Manuais
const allDropZones = document.querySelectorAll('.drop-zone');

// --- Elementos do DOM para o Gerenciador de Automação ---
const automationRulesList = document.getElementById('automation-rules-list');
const createNewRuleBtn = document.getElementById('create-new-rule-btn');
const ruleEditorModal = document.getElementById('rule-editor-modal');
const ruleEditorTitle = document.getElementById('rule-editor-title');
const ruleNameInput = document.getElementById('rule-name-input');
const ruleTriggersInput = document.getElementById('rule-triggers-input');
const cancelRuleBtn = document.getElementById('cancel-rule-btn');
const saveRuleBtn = document.getElementById('save-rule-btn');

/**
 * Cria um elemento de campo arrastável para a Ficha do Paciente.
 * @param {object} field - O objeto de configuração do campo.
 * @returns {HTMLElement} O elemento <div> do campo.
 */
function createDraggableField(field) {
  const div = document.createElement('div');
  div.className = 'draggable';
  div.dataset.fieldId = field.id;
  div.draggable = true;

  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <input type="checkbox" class="field-enabled-checkbox" ${field.enabled ? 'checked' : ''}>
    <input type="text" class="field-label-input" value="${field.label}">
  `;

  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);

  return div;
}

/**
 * Cria um elemento de filtro arrastável com controlos para valor padrão.
 * @param {object} filter - O objeto de configuração do filtro.
 * @param {Array<object>} priorities - A lista de prioridades dinâmicas para a regulação.
 * @returns {HTMLElement} O elemento <div> do filtro.
 */
function createDraggableFilter(filter, priorities = []) {
  const div = document.createElement('div');
  div.className = 'draggable';
  div.dataset.filterId = filter.id;
  div.draggable = true;

  const displayType = filter.type === 'selectGroup' ? 'select' : filter.type;

  let defaultValueControl = '';
  if (filter.type !== 'component') {
    switch (filter.type) {
      case 'text': {
        defaultValueControl =
          '<input type="text" class="filter-default-value-input w-full" placeholder="Valor padrão...">';
        break;
      }
      case 'select':
      case 'selectGroup': {
        let optionsHtml = '';
        if (filter.id === 'regulation-filter-priority') {
          // Constrói o dropdown de prioridades dinamicamente
          optionsHtml = filter.options
            .map((opt) => `<option value="${opt.value}">${opt.text}</option>`)
            .join(''); // Adiciona "Todas"
          priorities.forEach((prio) => {
            optionsHtml += `<option value="${prio.coreDescricao}">${prio.coreDescricao}</option>`;
          });
        } else {
          // Lógica original para outros selects
          optionsHtml = (filter.options || [])
            .map((opt) => `<option value="${opt.value}">${opt.text}</option>`)
            .join('');
        }
        defaultValueControl = `<select class="filter-default-value-input w-full">${optionsHtml}</select>`;
        break;
      }
      case 'checkbox': {
        defaultValueControl =
          '<input type="checkbox" class="filter-default-value-input h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">';
        break;
      }
    }
  }

  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <div class="flex-grow flex flex-col gap-2">
        <div class="flex justify-between items-center">
            <span class="font-medium text-sm">${filter.label}</span>
            <span class="text-xs text-slate-400 p-1 bg-slate-100 rounded">${displayType}</span>
        </div>
        ${
          defaultValueControl
            ? `
        <div class="flex items-center gap-2 text-xs text-slate-500">
            <label for="default-${filter.id}">Padrão:</label>
            ${defaultValueControl.replace('class="', `id="default-${filter.id}" class="`)}
        </div>`
            : ''
        }
    </div>
  `;

  if (filter.type === 'component') {
    div.classList.add('draggable-component');
  }

  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);

  return div;
}

/**
 * Renderiza os campos da Ficha do Paciente nas zonas corretas.
 * @param {Array<object>} config - A configuração de campos.
 */
function renderPatientFields(config) {
  mainFieldsZone.innerHTML = '';
  moreFieldsZone.innerHTML = '';

  const sortedConfig = [...config].sort((a, b) => a.order - b.order);

  sortedConfig.forEach((field) => {
    const fieldElement = createDraggableField(field);
    if (field.section === 'main') {
      mainFieldsZone.appendChild(fieldElement);
    } else {
      moreFieldsZone.appendChild(fieldElement);
    }
  });
}

/**
 * Renderiza os filtros de seção nas zonas corretas e define seus valores padrão.
 * @param {object} layout - A configuração de layout dos filtros.
 */
async function renderFilterLayout(layout) {
  let priorities = [];

  try {
    const baseUrl = await API.getBaseUrl();
    if (baseUrl) {
      priorities = await API.fetchRegulationPriorities();
    }
  } catch (error) {
    console.error('Não foi possível carregar prioridades:', error);
  }

  Object.keys(filterConfig).forEach((section) => {
    const mainZone = document.getElementById(`${section}-main-filters-zone`);
    const moreZone = document.getElementById(`${section}-more-filters-zone`);
    if (mainZone) mainZone.innerHTML = '';
    if (moreZone) moreZone.innerHTML = '';
  });

  Object.entries(filterConfig).forEach(([sectionKey, filters]) => {
    const sectionLayout = layout[sectionKey] || [];
    const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

    const sortedFilters = [...filters].sort((a, b) => {
      const orderA = layoutMap.get(a.id)?.order ?? Infinity;
      const orderB = layoutMap.get(b.id)?.order ?? Infinity;
      return orderA - orderB;
    });

    sortedFilters.forEach((filter) => {
      const filterLayoutData = layoutMap.get(filter.id);
      const location = filterLayoutData?.location || filter.defaultLocation;

      if (sectionKey === 'patient-card') return;
      const zoneId = `${sectionKey}-${location}-filters-zone`;
      const zone = document.getElementById(zoneId);

      if (zone) {
        const filterElement = createDraggableFilter(filter, priorities);
        zone.appendChild(filterElement);

        if (
          filter.type !== 'component' &&
          filterLayoutData &&
          filterLayoutData.defaultValue !== undefined
        ) {
          const defaultValueInput = filterElement.querySelector('.filter-default-value-input');
          if (defaultValueInput) {
            if (defaultValueInput.type === 'checkbox') {
              defaultValueInput.checked = filterLayoutData.defaultValue;
            } else {
              defaultValueInput.value = filterLayoutData.defaultValue;
            }
          }
        }
      }
    });
  });
}

/**
 * Reordena os botões das abas na página de opções com base na ordem salva.
 * @param {string[]} order - Array de IDs de abas na ordem correta.
 */
function applyTabOrder(order) {
  const tabsContainer = document.querySelector('#filter-tabs-container .tabs');
  if (!tabsContainer) return;

  const tabMap = new Map();
  tabsContainer.querySelectorAll('.tab-button').forEach((tab) => {
    tabMap.set(tab.dataset.tab, tab);
  });

  // Anexa as abas na ordem salva. As não encontradas na ordem (novas) permanecem.
  order.forEach((tabId) => {
    const tabElement = tabMap.get(tabId);
    if (tabElement) {
      tabsContainer.appendChild(tabElement);
    }
  });
}

/**
 * Carrega a configuração salva e renderiza a página.
 */
async function restoreOptions() {
  const syncItems = await api.storage.sync.get({
    baseUrl: '',
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    autoLoadDocuments: false,
    enableAutomaticDetection: true,
    keepSessionAliveInterval: 10,
    patientFields: defaultFieldConfig,
    filterLayout: {},
    dateRangeDefaults: {},
    sidebarSectionOrder: null,
    sectionHeaderStyles: {},
  });

  const localItems = await api.storage.local.get({
    automationRules: [],
  });

  document.getElementById('baseUrlInput').value = syncItems.baseUrl || '';
  document.getElementById('enableAutomaticDetection').checked = syncItems.enableAutomaticDetection;
  document.getElementById('keepSessionAliveInterval').value = syncItems.keepSessionAliveInterval;
  document.getElementById('autoLoadExamsCheckbox').checked = syncItems.autoLoadExams;
  document.getElementById('autoLoadConsultationsCheckbox').checked =
    syncItems.autoLoadConsultations;
  document.getElementById('autoLoadAppointmentsCheckbox').checked = syncItems.autoLoadAppointments;
  document.getElementById('autoLoadRegulationsCheckbox').checked = syncItems.autoLoadRegulations;
  document.getElementById('autoLoadDocumentsCheckbox').checked = syncItems.autoLoadDocuments;

  if (syncItems.sidebarSectionOrder) {
    applyTabOrder(syncItems.sidebarSectionOrder);
  }

  const currentPatientFieldsConfig = defaultFieldConfig.map((defaultField) => {
    const savedField = syncItems.patientFields.find((f) => f.id === defaultField.id);
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });
  renderPatientFields(currentPatientFieldsConfig);

  try {
    await renderFilterLayout(syncItems.filterLayout);
  } catch (error) {
    console.error('Erro ao renderizar filtros:', error);
  }

  const sections = [
    'patient-details',
    'timeline',
    'consultations',
    'exams',
    'appointments',
    'regulations',
    'documents',
  ];
  const defaultRanges = {
    consultations: { start: -6, end: 0 },
    exams: { start: -6, end: 0 },
    appointments: { start: -1, end: 3 },
    regulations: { start: -12, end: 0 },
    documents: { start: -24, end: 0 },
  };

  // CORREÇÃO 2: Define os estilos padrão aqui.
  const defaultStyles = {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    iconColor: '#1e293b',
    fontSize: '16px',
  };

  sections.forEach((section) => {
    if (defaultRanges[section]) {
      const range = syncItems.dateRangeDefaults[section] || defaultRanges[section];
      const startOffsetEl = document.getElementById(`${section}-start-offset`);
      const endOffsetEl = document.getElementById(`${section}-end-offset`);
      if (startOffsetEl) startOffsetEl.value = Math.abs(range.start);
      if (endOffsetEl) endOffsetEl.value = range.end;
    }

    // Restaura estilos, usando os padrões como base.
    const savedStyle = syncItems.sectionHeaderStyles[section] || {};
    const style = { ...defaultStyles, ...savedStyle };

    const bgColorEl = document.getElementById(`style-${section}-bg-color`);
    const fontColorEl = document.getElementById(`style-${section}-font-color`);
    const iconColorEl = document.getElementById(`style-${section}-icon-color`);
    const fontSizeEl = document.getElementById(`style-${section}-font-size`);

    if (bgColorEl) bgColorEl.value = style.backgroundColor;
    if (fontColorEl) fontColorEl.value = style.color;
    if (iconColorEl) iconColorEl.value = style.iconColor;
    if (fontSizeEl) fontSizeEl.value = style.fontSize;
  });

  automationRules = localItems.automationRules || [];
  renderAutomationRules();
}

/**
 * Salva as configurações GERAIS (não as regras de automação).
 */
async function saveOptions() {
  // Validação da URL base
  const baseUrlInput = document.getElementById('baseUrlInput');
  const baseUrlValid = baseUrlInput.value.trim();
  try {
    if (!baseUrlValid) throw new Error('A URL base não pode estar vazia.');
    new URL(baseUrlValid); // Valida sintaxe
  } catch {
    Utils.showMessage('URL base inválida! Informe uma URL válida do SIGSS.', 'error');
    baseUrlInput.focus();
    return;
  }
  const baseUrl = document.getElementById('baseUrlInput').value;
  const enableAutomaticDetection = document.getElementById('enableAutomaticDetection').checked;
  const keepSessionAliveInterval =
    parseInt(document.getElementById('keepSessionAliveInterval').value, 10) || 0;
  const autoLoadExams = document.getElementById('autoLoadExamsCheckbox').checked;
  const autoLoadConsultations = document.getElementById('autoLoadConsultationsCheckbox').checked;
  const autoLoadAppointments = document.getElementById('autoLoadAppointmentsCheckbox').checked;
  const autoLoadRegulations = document.getElementById('autoLoadRegulationsCheckbox').checked;
  const autoLoadDocuments = document.getElementById('autoLoadDocumentsCheckbox').checked;

  const patientFields = [];
  mainFieldsZone.querySelectorAll('.draggable').forEach((div, index) => {
    const fieldId = div.dataset.fieldId;
    const label = div.querySelector('.field-label-input').value;
    const enabled = div.querySelector('.field-enabled-checkbox').checked;
    patientFields.push({
      id: fieldId,
      label,
      enabled,
      section: 'main',
      order: index + 1,
    });
  });
  moreFieldsZone.querySelectorAll('.draggable').forEach((div, index) => {
    const fieldId = div.dataset.fieldId;
    const label = div.querySelector('.field-label-input').value;
    const enabled = div.querySelector('.field-enabled-checkbox').checked;
    patientFields.push({
      id: fieldId,
      label,
      enabled,
      section: 'more',
      order: index + 1,
    });
  });

  const filterLayout = {};
  document.querySelectorAll('#layout-config-section .drop-zone').forEach((zone) => {
    if (!zone.dataset.section) return;
    const section = zone.dataset.section;
    if (!filterLayout[section]) filterLayout[section] = [];
    const location = zone.id.includes('-main-') ? 'main' : 'more';
    zone.querySelectorAll('.draggable').forEach((div, index) => {
      const filterId = div.dataset.filterId;
      const originalFilter = filterConfig[section].find((f) => f.id === filterId);
      const newFilterData = {
        id: filterId,
        location: location,
        order: index + 1,
      };
      if (originalFilter.type !== 'component') {
        const defaultValueInput = div.querySelector('.filter-default-value-input');
        if (defaultValueInput) {
          newFilterData.defaultValue =
            defaultValueInput.type === 'checkbox'
              ? defaultValueInput.checked
              : defaultValueInput.value;
        }
      }
      filterLayout[section].push(newFilterData);
    });
  });

  const dateRangeDefaults = {};
  const sectionsForDate = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
  sectionsForDate.forEach((section) => {
    const startEl = document.getElementById(`${section}-start-offset`);
    const endEl = document.getElementById(`${section}-end-offset`);
    if (startEl && endEl) {
      const start = -parseInt(startEl.value, 10) || 0;
      const end = parseInt(endEl.value, 10) || 0;
      dateRangeDefaults[section] = { start, end };
    }
  });

  const sectionHeaderStyles = {};
  const sectionsForStyle = [
    'patient-details',
    'timeline',
    'consultations',
    'exams',
    'appointments',
    'regulations',
    'documents',
  ];
  sectionsForStyle.forEach((section) => {
    const bgColorEl = document.getElementById(`style-${section}-bg-color`);
    if (bgColorEl) {
      // Check if the element exists before accessing properties
      sectionHeaderStyles[section] = {
        backgroundColor: bgColorEl.value,
        color: document.getElementById(`style-${section}-font-color`).value,
        iconColor: document.getElementById(`style-${section}-icon-color`).value,
        fontSize: document.getElementById(`style-${section}-font-size`).value,
      };
    }
  });

  const sidebarSectionOrder = [...document.querySelectorAll('.tabs .tab-button')].map(
    (btn) => btn.dataset.tab
  );

  await api.storage.sync.set({
    baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl,
    enableAutomaticDetection,
    keepSessionAliveInterval,
    autoLoadExams,
    autoLoadConsultations,
    autoLoadAppointments,
    autoLoadRegulations,
    autoLoadDocuments,
    patientFields,
    filterLayout,
    dateRangeDefaults,
    sidebarSectionOrder,
    sectionHeaderStyles,
  });

  Utils.showMessage(
    'Configurações salvas! As alterações serão aplicadas ao recarregar o assistente.',
    'success'
  );

  setTimeout(() => {
    const statusMsg = document.getElementById('statusMessage');
    if (statusMsg) {
      statusMsg.textContent = '';
      statusMsg.className = 'text-sm font-medium';
    }
  }, 4000);
}

// --- Lógica de Arrastar e Soltar (Drag and Drop) ---
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target.closest('.draggable, .rule-item');
  if (!draggedElement) return;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => draggedElement.classList.add('dragging'), 0);
}

function handleDragEnd() {
  if (!draggedElement) return;
  draggedElement.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  if (!draggedElement) return;

  const dropZone = e.target.closest('.drop-zone, #automation-rules-list');
  if (dropZone) {
    const afterElement = getDragAfterElement(dropZone, e.clientY);
    if (afterElement == null) {
      dropZone.appendChild(draggedElement);
    } else {
      dropZone.insertBefore(draggedElement, afterElement);
    }

    if (dropZone.id === 'automation-rules-list') {
      reorderAutomationRules();
    }
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll('.draggable:not(.dragging), .rule-item:not(.dragging)'),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// --- Lógica de Arrastar e Soltar para Abas ---
function getDragAfterTab(container, x) {
  const draggableElements = [...container.querySelectorAll('.tab-button:not(.dragging)')];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset && child.draggable) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function setupTabDnD(container) {
  if (!container) return;

  const tabs = container.querySelectorAll('.tab-button');
  tabs.forEach((tab) => {
    if (tab.dataset.tab !== 'patient-card') {
      tab.draggable = true;
    }
  });

  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('tab-button') && e.target.draggable) {
      draggedTab = e.target;
      setTimeout(() => e.target.classList.add('dragging'), 0);
    }
  });

  container.addEventListener('dragend', () => {
    if (draggedTab) {
      draggedTab.classList.remove('dragging');
      draggedTab = null;
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedTab) return;

    const afterElement = getDragAfterTab(container, e.clientX);
    if (afterElement) {
      container.insertBefore(draggedTab, afterElement);
    } else {
      container.appendChild(draggedTab);
    }
  });
}

// --- Lógica para Restaurar Padrões ---
async function handleRestoreDefaults() {
  Utils.showDialog({
    message:
      'Tem certeza de que deseja restaurar todas as configurações de layout e valores padrão? Isto também restaurará a ordem das seções e os estilos dos cabeçalhos. Esta ação não pode ser desfeita.',
    onConfirm: async () => {
      await api.storage.sync.remove([
        'patientFields',
        'filterLayout',
        'dateRangeDefaults',
        'enableAutomaticDetection',
        'sidebarSectionOrder',
        'sectionHeaderStyles',
      ]);
      mainFieldsZone.innerHTML = '';
      moreFieldsZone.innerHTML = '';
      window.location.reload();
    },
  });
}

// --- Lógica de Exportação e Importação ---
async function handleExport() {
  try {
    const settingsToExport = await api.storage.sync.get(null);
    settingsToExport.configVersion = CONFIG_VERSION;
    const settingsString = JSON.stringify(settingsToExport, null, 2);
    const blob = new Blob([settingsString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `assistente-regulacao-config-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Utils.showMessage('Configurações exportadas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao exportar configurações:', error);
    Utils.showMessage('Erro ao exportar configurações.', 'error');
  } finally {
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 3000);
  }
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedSettings = JSON.parse(e.target.result);
      if (!importedSettings.configVersion || !importedSettings.filterLayout) {
        throw new Error('Ficheiro de configuração inválido ou corrompido.');
      }
      if (importedSettings.configVersion.split('.')[0] !== CONFIG_VERSION.split('.')[0]) {
        Utils.showDialog({
          message:
            'A versão do ficheiro de configuração é muito diferente da versão da extensão. A importação pode causar erros. Deseja continuar mesmo assim?',
          onConfirm: async () => {
            await api.storage.sync.clear();
            await api.storage.sync.set(importedSettings);
            restoreOptions();
            Utils.showMessage('Configurações importadas e aplicadas com sucesso!', 'success');
          },
        });
        return;
      }
      await api.storage.sync.clear();
      await api.storage.sync.set(importedSettings);
      restoreOptions();
      Utils.showMessage('Configurações importadas e aplicadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      Utils.showMessage(`Erro ao importar: ${error.message}`, 'error');
    } finally {
      importFileInput.value = '';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 5000);
    }
  };
  reader.readAsText(file);
}

// --- LÓGICA PARA O GERENCIADOR DE AUTOMAÇÃO ---

/**
 * Renderiza a lista de regras de automação na UI.
 */
function renderAutomationRules() {
  automationRulesList.innerHTML = '';
  automationRules.forEach((rule) => {
    const ruleElement = document.createElement('div');
    ruleElement.className = 'rule-item border rounded-lg bg-white p-3';
    ruleElement.dataset.ruleId = rule.id;
    ruleElement.draggable = true;

    const keywords = rule.triggerKeywords.join(', ');
    const checked = rule.isActive ? 'checked' : '';

    ruleElement.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="drag-handle cursor-grab text-slate-400">⠿</span>
                <div>
                  <p class="font-semibold text-slate-800">${rule.name}</p>
                  <p class="text-xs text-slate-500" title="${keywords}">Gatilhos: ${
                    keywords.length > 50 ? keywords.substring(0, 50) + '...' : keywords
                  }</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <label class="relative inline-flex items-center cursor-pointer" title="${
                  rule.isActive ? 'Regra Ativa' : 'Regra Inativa'
                }">
                  <input type="checkbox" class="sr-only peer rule-toggle-active" ${checked}>
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <button class="text-sm font-medium text-blue-600 hover:underline rule-edit-btn">Editar</button>
                <button class="text-sm font-medium text-slate-500 hover:underline rule-duplicate-btn">Duplicar</button>
                <button class="text-sm font-medium text-red-600 hover:underline rule-delete-btn">Excluir</button>
              </div>
            </div>
        `;
    automationRulesList.appendChild(ruleElement);
  });

  document.querySelectorAll('.rule-item').forEach((item) => {
    const ruleId = item.dataset.ruleId;
    item.querySelector('.rule-edit-btn').addEventListener('click', () => handleEditRule(ruleId));
    item
      .querySelector('.rule-delete-btn')
      .addEventListener('click', () => handleDeleteRule(ruleId));
    item
      .querySelector('.rule-duplicate-btn')
      .addEventListener('click', () => handleDuplicateRule(ruleId));
    item
      .querySelector('.rule-toggle-active')
      .addEventListener('change', (e) => handleToggleRuleActive(ruleId, e.target.checked));
  });
}

/**
 * Salva o array de regras de automação no storage local.
 */
async function saveAutomationRules() {
  await api.storage.local.set({ automationRules });
  Utils.showMessage('Regras de automação salvas.', 'success');
  setTimeout(() => {
    statusMessage.textContent = '';
  }, 2000);
}

/**
 * Abre o modal do editor de regras, preenchendo-o se uma regra for fornecida.
 * @param {string|null} ruleId - O ID da regra a ser editada, ou null para criar uma nova.
 */
async function openRuleEditor(ruleId = null) {
  currentlyEditingRuleId = ruleId;
  await populateRuleEditorFilters();

  if (ruleId) {
    const rule = automationRules.find((r) => r.id === ruleId);
    if (!rule) return;
    ruleEditorTitle.textContent = 'Editar Regra de Automação';
    ruleNameInput.value = rule.name;
    ruleTriggersInput.value = rule.triggerKeywords.join(', ');

    Object.entries(rule.filterSettings).forEach(([sectionKey, filters]) => {
      // --- INÍCIO DA CORREÇÃO ---
      // Preenche os filtros de data
      if (filters && filters.dateRange) {
        const { start, end } = filters.dateRange;
        const startOffsetEl = document.getElementById(`rule-${sectionKey}-start-offset`);
        const endOffsetEl = document.getElementById(`rule-${sectionKey}-end-offset`);
        if (startOffsetEl && start !== null && !isNaN(start)) {
          startOffsetEl.value = Math.abs(start);
        } else if (startOffsetEl) {
          startOffsetEl.value = '';
        }
        if (endOffsetEl && end !== null && !isNaN(end)) {
          endOffsetEl.value = end;
        } else if (endOffsetEl) {
          endOffsetEl.value = '';
        }
      }
      // --- FIM DA CORREÇÃO ---

      // Preenche outros filtros
      Object.entries(filters).forEach(([filterId, value]) => {
        if (filterId === 'dateRange') return;
        const element = document.getElementById(`rule-${sectionKey}-${filterId}`);
        if (element) {
          if (element.type === 'checkbox') {
            element.checked = value;
          } else {
            element.value = value;
          }
        }
      });
    });
  } else {
    ruleEditorTitle.textContent = 'Criar Nova Regra de Automação';
    ruleNameInput.value = '';
    ruleTriggersInput.value = '';

    // Limpa todos os campos, incluindo os de data
    const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
    sections.forEach((sectionKey) => {
      const startEl = document.getElementById(`rule-${sectionKey}-start-offset`);
      const endEl = document.getElementById(`rule-${sectionKey}-end-offset`);
      if (startEl) startEl.value = '';
      if (endEl) endEl.value = '';
    });

    document
      .querySelectorAll(
        '#rule-editor-modal input[type="text"]:not(.rule-date-range-input), #rule-editor-modal input[type="search"]:not(.rule-date-range-input)'
      )
      .forEach((el) => (el.value = ''));
    document
      .querySelectorAll('#rule-editor-modal input[type="checkbox"]')
      .forEach((el) => (el.checked = false));
    document.querySelectorAll('#rule-editor-modal select').forEach((el) => {
      if (el.options.length > 0) {
        el.value = el.options[0].value;
      }
    });
  }

  ruleEditorModal.classList.remove('hidden');
}

/**
 * Fecha o modal do editor de regras.
 */
function closeRuleEditor() {
  ruleEditorModal.classList.add('hidden');
  currentlyEditingRuleId = null;
}

/**
 * Salva a regra (nova ou editada) do modal.
 */
function handleSaveRule() {
  const name = ruleNameInput.value.trim();
  if (!name) {
    Utils.showMessage('O nome da regra é obrigatório.', 'error');
    return;
  }

  const triggerKeywords = ruleTriggersInput.value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const filterSettings = {};
  const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];

  sections.forEach((sectionKey) => {
    filterSettings[sectionKey] = {};

    // --- INÍCIO DA CORREÇÃO ---
    // Salva as configurações de data
    const startOffsetEl = document.getElementById(`rule-${sectionKey}-start-offset`);
    const endOffsetEl = document.getElementById(`rule-${sectionKey}-end-offset`);
    const startVal = startOffsetEl.value;
    const endVal = endOffsetEl.value;

    const startNum = parseInt(startVal, 10);
    const endNum = parseInt(endVal, 10);

    if (!isNaN(startNum) || !isNaN(endNum)) {
      filterSettings[sectionKey].dateRange = {
        start: !isNaN(startNum) ? -startNum : null,
        end: !isNaN(endNum) ? endNum : null,
      };
    }
    // --- FIM DA CORREÇÃO ---

    // Salva as configurações dos outros filtros
    const sectionFilters = filterConfig[sectionKey] || [];
    sectionFilters.forEach((filter) => {
      if (filter.type === 'component') return;
      const element = document.getElementById(`rule-${sectionKey}-${filter.id}`);
      if (element) {
        const value = element.type === 'checkbox' ? element.checked : element.value;
        filterSettings[sectionKey][filter.id] = value;
      }
    });
  });

  if (currentlyEditingRuleId) {
    const ruleIndex = automationRules.findIndex((r) => r.id === currentlyEditingRuleId);
    if (ruleIndex > -1) {
      automationRules[ruleIndex].name = name;
      automationRules[ruleIndex].triggerKeywords = triggerKeywords;
      automationRules[ruleIndex].filterSettings = filterSettings;
    }
  } else {
    const newRule = {
      id: Date.now().toString(),
      name,
      triggerKeywords,
      isActive: true,
      filterSettings,
    };
    automationRules.push(newRule);
  }

  saveAutomationRules();
  renderAutomationRules();
  closeRuleEditor();
}

function handleEditRule(ruleId) {
  openRuleEditor(ruleId);
}

function handleDeleteRule(ruleId) {
  Utils.showDialog({
    message: 'Tem certeza que deseja excluir esta regra?',
    onConfirm: () => {
      automationRules = automationRules.filter((r) => r.id !== ruleId);
      saveAutomationRules();
      renderAutomationRules();
    },
  });
}

function handleDuplicateRule(ruleId) {
  const originalRule = automationRules.find((r) => r.id === ruleId);
  if (!originalRule) return;

  const newRule = JSON.parse(JSON.stringify(originalRule));
  newRule.id = Date.now().toString();
  newRule.name = `${originalRule.name} (Cópia)`;
  newRule.isActive = false;

  const originalIndex = automationRules.findIndex((r) => r.id === ruleId);
  automationRules.splice(originalIndex + 1, 0, newRule);

  saveAutomationRules();
  renderAutomationRules();
}

function handleToggleRuleActive(ruleId, isActive) {
  const ruleIndex = automationRules.findIndex((r) => r.id === ruleId);
  if (ruleIndex > -1) {
    automationRules[ruleIndex].isActive = isActive;
    saveAutomationRules();
  }
}

function reorderAutomationRules() {
  const newOrderedIds = [...automationRulesList.querySelectorAll('.rule-item')].map(
    (item) => item.dataset.ruleId
  );
  automationRules.sort((a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id));
  saveAutomationRules();
}

/**
 * Popula as abas do editor de regras com os controles de filtro apropriados.
 */
async function populateRuleEditorFilters() {
  let priorities = [];

  try {
    const baseUrl = await API.getBaseUrl();
    if (baseUrl) {
      priorities = await API.fetchRegulationPriorities();
    }
  } catch (error) {
    console.error('Não foi possível carregar prioridades:', error);
  }

  const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];

  sections.forEach((sectionKey) => {
    const container = document.getElementById(`${sectionKey}-rule-editor-tab`);
    if (!container) return;
    container.innerHTML = ''; // Limpa o conteúdo anterior

    // Adiciona o componente de data
    const dateRangeElement = createDateRangeElementForRuleEditor(sectionKey);
    container.appendChild(dateRangeElement);

    const sectionFilters = filterConfig[sectionKey] || [];

    sectionFilters.forEach((filter) => {
      if (filter.type === 'component') return;
      const filterElement = createFilterElementForRuleEditor(filter, sectionKey, priorities);
      container.appendChild(filterElement);
    });
  });

  const firstTabButton = document.querySelector('#rule-editor-filter-tabs .tab-button');
  if (firstTabButton) {
    firstTabButton.click();
  }
}

/**
 * Cria um único elemento de filtro para o modal do editor de regras.
 * @param {object} filter - O objeto de configuração do filtro.
 * @param {string} sectionKey - A chave da seção.
 * @param {Array<object>} priorities - A lista de prioridades dinâmicas.
 * @returns {HTMLElement} O elemento HTML do filtro.
 */
function createFilterElementForRuleEditor(filter, sectionKey, priorities) {
  const container = document.createElement('div');
  const elementId = `rule-${sectionKey}-${filter.id}`;
  let elementHtml = '';

  if (filter.type !== 'checkbox') {
    container.className = 'mb-3';
    elementHtml += `<label for="${elementId}" class="block font-medium mb-1 text-sm">${filter.label}</label>`;
  }

  switch (filter.type) {
    case 'text':
      elementHtml += `<input type="text" id="${elementId}" placeholder="${
        filter.placeholder || ''
      }" class="w-full px-2 py-1 border border-slate-300 rounded-md">`;
      break;
    case 'select':
    case 'selectGroup':
      elementHtml += `<select id="${elementId}" class="w-full px-2 py-1 border border-slate-300 rounded-md bg-white">`;
      if (filter.id === 'regulation-filter-priority') {
        elementHtml += '<option value="todas">Todas</option>';
        priorities.forEach((prio) => {
          elementHtml += `<option value="${prio.coreDescricao}">${prio.coreDescricao}</option>`;
        });
      } else {
        (filter.options || []).forEach((opt) => {
          elementHtml += `<option value="${opt.value}">${opt.text}</option>`;
        });
      }
      elementHtml += '</select>';
      break;
    case 'checkbox':
      container.className = 'flex items-center gap-2';
      elementHtml += `<input id="${elementId}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <label for="${elementId}" class="block text-sm text-slate-700">${filter.label}</label>`;
      break;
  }
  container.innerHTML = elementHtml;
  return container;
}

/**
 * Cria o componente de intervalo de datas para o editor de regras.
 * @param {string} sectionKey - A chave da seção.
 * @returns {HTMLElement} O elemento HTML do componente.
 */
function createDateRangeElementForRuleEditor(sectionKey) {
  const container = document.createElement('div');
  container.className = 'p-2 bg-slate-50 rounded-md border mb-4';
  container.innerHTML = `
    <h5 class="font-medium text-xs text-slate-500 mb-2">Período de Busca Automático</h5>
    <div class="flex items-center gap-4 text-sm">
        <div>
            <label for="rule-${sectionKey}-start-offset" class="text-xs">Início (meses antes):</label>
            <input type="number" id="rule-${sectionKey}-start-offset" class="w-20 p-1 border rounded-md rule-date-range-input" placeholder="Padrão" min="0">
        </div>
        <div>
            <label for="rule-${sectionKey}-end-offset" class="text-xs">Fim (meses depois):</label>
            <input type="number" id="rule-${sectionKey}-end-offset" class="w-20 p-1 border rounded-md rule-date-range-input" placeholder="Padrão" min="0">
        </div>
    </div>
    <p class="text-xs text-slate-400 mt-2">Deixe em branco para usar o padrão global da seção.</p>
  `;
  return container;
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
  await restoreOptions();

  const mainTabsContainer = document.querySelector('#filter-tabs-container .tabs');
  Utils.setupTabs(document.getElementById('filter-tabs-container'));
  if (mainTabsContainer) {
    setupTabDnD(mainTabsContainer);
  }
  Utils.setupTabs(document.getElementById('rule-editor-filter-tabs'));

  createNewRuleBtn.addEventListener('click', () => openRuleEditor(null));
  cancelRuleBtn.addEventListener('click', closeRuleEditor);
  saveRuleBtn.addEventListener('click', handleSaveRule);

  ruleEditorModal.addEventListener('click', (e) => {
    if (e.target === ruleEditorModal) {
      closeRuleEditor();
    }
  });

  automationRulesList.addEventListener('dragstart', handleDragStart);
  automationRulesList.addEventListener('dragend', handleDragEnd);
  automationRulesList.addEventListener('dragover', handleDragOver);
  automationRulesList.addEventListener('drop', handleDrop);

  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.enableAutomaticDetection) {
      const toggle = document.getElementById('enableAutomaticDetection');
      if (toggle) {
        toggle.checked = changes.enableAutomaticDetection.newValue;
      }
    }
  });
});

saveButton.addEventListener('click', saveOptions);
closeButton.addEventListener('click', () => {
  window.close();
});
restoreDefaultsButton.addEventListener('click', handleRestoreDefaults);
exportButton.addEventListener('click', handleExport);
importFileInput.addEventListener('change', handleImport);

allDropZones.forEach((zone) => {
  zone.addEventListener('dragover', handleDragOver);
  zone.addEventListener('drop', handleDrop);
});
