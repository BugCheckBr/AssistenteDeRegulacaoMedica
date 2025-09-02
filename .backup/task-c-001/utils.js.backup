/**
 * Exibe um modal customizado de confirmação.
 * @param {Object} options
 * @param {string} options.message Mensagem a exibir
 * @param {Function} options.onConfirm Callback para confirmação
 * @param {Function} [options.onCancel] Callback para cancelamento
 */
export function showDialog({ message, onConfirm, onCancel }) {
  let modal = document.getElementById('custom-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div class="mb-4 text-slate-800 text-base" id="custom-confirm-message"></div>
          <div class="flex justify-end gap-2">
            <button id="custom-confirm-cancel" class="px-4 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300">Cancelar</button>
            <button id="custom-confirm-ok" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  modal.querySelector('#custom-confirm-message').textContent = message;
  const okBtn = modal.querySelector('#custom-confirm-ok');
  const cancelBtn = modal.querySelector('#custom-confirm-cancel');
  const close = () => {
    modal.style.display = 'none';
  };
  okBtn.onclick = () => {
    close();
    onConfirm && onConfirm();
  };
  cancelBtn.onclick = () => {
    close();
    onCancel && onCancel();
  };
}
/**
 * @file Contém funções utilitárias compartilhadas em toda a extensão.
 */

/**
 * Atraso na execução de uma função após o utilizador parar de digitar.
 * @param {Function} func A função a ser executada.
 * @param {number} [delay=500] O tempo de espera em milissegundos.
 * @returns {Function} A função com debounce.
 */
export function debounce(func, delay = 500) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Mostra ou esconde o loader principal.
 * @param {boolean} show - `true` para mostrar, `false` para esconder.
 */
export function toggleLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

/**
 * Exibe uma mensagem na área de mensagens.
 * @param {string} text O texto da mensagem.
 * @param {'error' | 'success' | 'info'} [type='error'] O tipo de mensagem.
 */
export function showMessage(text, type = 'error') {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.textContent = text;
    const typeClasses = {
      error: 'bg-red-100 text-red-700',
      success: 'bg-green-100 text-green-700',
      info: 'bg-blue-100 text-blue-700',
    };
    messageArea.className = `p-3 rounded-md text-sm ${typeClasses[type] || typeClasses.error}`;
    messageArea.style.display = 'block';
  }
}

/**
 * Limpa a área de mensagens.
 */
export function clearMessage() {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.style.display = 'none';
  }
}

/**
 * Converte uma string de data em vários formatos para um objeto Date.
 * @param {string} dateString A data no formato "dd/MM/yyyy" ou "yyyy-MM-dd", podendo conter prefixos.
 * @returns {Date|null} O objeto Date ou null se a string for inválida.
 */
export function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;

  // Tenta extrair o primeiro padrão de data válido da string.
  const dateMatch = dateString.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{2,4})/);
  if (!dateMatch) return null;

  const matchedDate = dateMatch[0];
  let year, month, day;

  // Tenta o formato YYYY-MM-DD
  if (matchedDate.includes('-')) {
    [year, month, day] = matchedDate.split('-').map(Number);
  } else if (matchedDate.includes('/')) {
    // Tenta o formato DD/MM/YYYY
    [day, month, year] = matchedDate.split('/').map(Number);
  }

  // Valida se os números são válidos e se a data é real
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Lida com anos de 2 dígitos (ex: '24' -> 2024)
  if (year >= 0 && year < 100) {
    year += 2000;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Confirma que a data não "rolou" para o mês seguinte (ex: 31 de Abril -> 1 de Maio)
  if (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  ) {
    return date;
  }

  return null; // Retorna nulo se a data for inválida (ex: 31/02/2024)
}

/**
 * Obtém um valor aninhado de um objeto de forma segura.
 * @param {object} obj O objeto.
 * @param {string} path O caminho para a propriedade (ex: 'a.b.c').
 * @returns {*} O valor encontrado ou undefined.
 */
export const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Calcula uma data relativa à data atual com base num desvio em meses.
 * @param {number} offsetInMonths - O número de meses a adicionar ou subtrair.
 * @returns {Date} O objeto Date resultante.
 */
export function calculateRelativeDate(offsetInMonths) {
  const date = new Date();
  // setMonth lida corretamente com transições de ano e dias do mês
  date.setMonth(date.getMonth() + offsetInMonths);
  return date;
}

/**
 * Retorna 'black' ou 'white' para o texto dependendo do contraste com a cor de fundo.
 * @param {string} hexcolor - A cor de fundo em formato hexadecimal (com ou sem #).
 * @returns {'black' | 'white'}
 */
export function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

/**
 * Normaliza uma string removendo acentos, cedilha e convertendo para minúsculas.
 * @param {string} str - A string a ser normalizada.
 * @returns {string} A string normalizada.
 */
export function normalizeString(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Configura um sistema de abas (tabs) dentro de um container.
 * @param {HTMLElement} container - O elemento que contém os botões e os painéis das abas.
 */
export function setupTabs(container) {
  if (!container) return;

  const tabButtons = container.querySelectorAll('.tab-button');
  const tabContents = container.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      button.classList.add('active');
      const activeContent = container.querySelector(`#${tabName}-tab`);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
}

/**
 * Normalizes data from various sources into a single, sorted timeline event list.
 * @param {object} apiData - An object containing arrays of consultations, exams, etc.
 * @returns {Array<object>} A sorted array of timeline event objects.
 */
export function normalizeTimelineData(apiData) {
  const events = [];

  // Normalize Consultations
  try {
    (apiData.consultations || []).forEach((c) => {
      if (!c || !c.date) return;
      const searchText = normalizeString(
        [c.specialty, c.professional, c.unit, ...c.details.map((d) => d.value)].join(' ')
      );
      events.push({
        type: 'consultation',
        date: parseDate(c.date.split('\n')[0]),
        sortableDate: c.sortableDate || parseDate(c.date),
        title: `Consulta: ${c.specialty || 'Especialidade não informada'}`,
        summary: `com ${c.professional || 'Profissional não informado'}`,
        details: c,
        subDetails: c.details || [],
        searchText,
      });
    });
  } catch (e) {
    console.error('Failed to normalize consultation data for timeline:', e);
  }

  // Normalize Exams
  try {
    (apiData.exams || []).forEach((e) => {
      const eventDate = parseDate(e.date);
      if (!e || !eventDate) return;
      const searchText = normalizeString(
        [e.examName, e.professional, e.specialty].filter(Boolean).join(' ')
      );
      events.push({
        type: 'exam',
        date: eventDate,
        sortableDate: eventDate,
        title: `Exame Solicitado: ${e.examName || 'Nome não informado'}`,
        summary: `Solicitado por ${e.professional || 'Não informado'}`,
        details: e,
        subDetails: [
          {
            label: 'Resultado',
            value: e.hasResult ? 'Disponível' : 'Pendente',
          },
        ],
        searchText,
      });
    });
  } catch (e) {
    console.error('Failed to normalize exam data for timeline:', e);
  }

  // Normalize Appointments
  try {
    (apiData.appointments || []).forEach((a) => {
      if (!a || !a.date) return;
      const searchText = normalizeString(
        [a.specialty, a.description, a.location, a.professional].join(' ')
      );
      events.push({
        type: 'appointment',
        date: parseDate(a.date),
        sortableDate: parseDate(a.date),
        title: `Agendamento: ${a.specialty || a.description || 'Não descrito'}`,
        summary: a.location || 'Local não informado',
        details: a,
        subDetails: [
          { label: 'Status', value: a.status || 'N/A' },
          { label: 'Hora', value: a.time || 'N/A' },
        ],
        searchText,
      });
    });
  } catch (e) {
    console.error('Failed to normalize appointment data for timeline:', e);
  }

  // Normalize Regulations
  try {
    (apiData.regulations || []).forEach((r) => {
      if (!r || !r.date) return;
      const searchText = normalizeString([r.procedure, r.requester, r.provider, r.cid].join(' '));
      events.push({
        type: 'regulation',
        date: parseDate(r.date),
        sortableDate: parseDate(r.date),
        title: `Regulação: ${r.procedure || 'Procedimento não informado'}`,
        summary: `Solicitante: ${r.requester || 'Não informado'}`,
        details: r,
        subDetails: [
          { label: 'Status', value: r.status || 'N/A' },
          { label: 'Prioridade', value: r.priority || 'N/A' },
        ],
        searchText,
      });
    });
  } catch (e) {
    console.error('Failed to normalize regulation data for timeline:', e);
  }

  // --- INÍCIO DA MODIFICAÇÃO ---
  // Normalize Documents
  try {
    (apiData.documents || []).forEach((doc) => {
      if (!doc || !doc.date) return;
      const searchText = normalizeString(doc.description || '');
      events.push({
        type: 'document',
        date: parseDate(doc.date),
        sortableDate: parseDate(doc.date),
        title: `Documento: ${doc.description || 'Sem descrição'}`,
        summary: `Tipo: ${doc.fileType.toUpperCase()}`,
        details: doc,
        subDetails: [],
        searchText,
      });
    });
  } catch (e) {
    console.error('Failed to normalize document data for timeline:', e);
  }
  // --- FIM DA MODIFICAÇÃO ---

  // Filter out events with invalid dates and sort all events by date, newest first.
  return events
    .filter((event) => event.sortableDate instanceof Date && !isNaN(event.sortableDate))
    .sort((a, b) => b.sortableDate - a.sortableDate);
}

/**
 * Filters timeline events based on automation rule filters.
 * @param {Array<object>} events - The full array of timeline events.
 * @param {object} automationFilters - The filter settings from an automation rule.
 * @returns {Array<object>} A new array with the filtered events.
 */
export function filterTimelineEvents(events, automationFilters) {
  if (!automationFilters) return events;

  const checkText = (text, filterValue) => {
    if (!filterValue) return true; // If filter is empty, it passes
    const terms = filterValue
      .toLowerCase()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (terms.length === 0) return true;
    const normalizedText = normalizeString(text || '');
    return terms.some((term) => normalizedText.includes(term));
  };

  return events.filter((event) => {
    try {
      switch (event.type) {
        case 'consultation': {
          const consultFilters = automationFilters.consultations || {};
          // Procura por um campo rotulado como CID ou CIAP para uma busca precisa.
          const cidDetail = (event.details.details || []).find(
            (d) =>
              normalizeString(d.label).includes('cid') || normalizeString(d.label).includes('ciap')
          );
          const cidText = cidDetail ? cidDetail.value : '';
          return (
            checkText(event.details.specialty, consultFilters['consultation-filter-specialty']) &&
            checkText(
              event.details.professional,
              consultFilters['consultation-filter-professional']
            ) &&
            checkText(cidText, consultFilters['consultation-filter-cid'])
          );
        }

        case 'exam': {
          const examFilters = automationFilters.exams || {};
          return (
            checkText(event.details.examName, examFilters['exam-filter-name']) &&
            checkText(event.details.professional, examFilters['exam-filter-professional']) &&
            checkText(event.details.specialty, examFilters['exam-filter-specialty'])
          );
        }

        case 'appointment': {
          const apptFilters = automationFilters.appointments || {};
          const apptText = `${event.details.specialty} ${event.details.professional} ${event.details.location}`;
          return checkText(apptText, apptFilters['appointment-filter-term']);
        }

        case 'regulation': {
          const regFilters = automationFilters.regulations || {};
          return (
            checkText(event.details.procedure, regFilters['regulation-filter-procedure']) &&
            checkText(event.details.requester, regFilters['regulation-filter-requester']) &&
            (regFilters['regulation-filter-status'] === 'todos' ||
              !regFilters['regulation-filter-status'] ||
              event.details.status.toUpperCase() ===
                regFilters['regulation-filter-status'].toUpperCase()) &&
            (regFilters['regulation-filter-priority'] === 'todas' ||
              !regFilters['regulation-filter-priority'] ||
              event.details.priority.toUpperCase() ===
                regFilters['regulation-filter-priority'].toUpperCase())
          );
        }

        default:
          return true;
      }
    } catch (e) {
      console.warn('Error filtering timeline event, it will be included by default:', event, e);
      return true;
    }
  });
}
