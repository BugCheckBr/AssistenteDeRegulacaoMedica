import { ERROR_CATEGORIES, logError, logWarning } from './ErrorHandler.js';

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

  // Tenta extrair data e hora juntos
  const dateTimeMatch = dateString.match(/(\d{2}\/\d{2}\/\d{4})[ T]?(\d{2}:\d{2}:\d{2})?/);
  if (!dateTimeMatch) return null;
  const datePart = dateTimeMatch[1];
  const timePart = dateTimeMatch[2];
  const [day, month, rawYear] = datePart.split('/').map(Number);
  let year = rawYear;
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (year >= 0 && year < 100) year += 2000;
  let hours = 0,
    minutes = 0,
    seconds = 0;
  if (timePart) {
    [hours, minutes, seconds] = timePart.split(':').map(Number);
  }
  // Cria data local (não UTC)
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }
  return null;
}

/**
 * Calcula a idade em anos a partir de uma data (string ou Date).
 * @param {string|Date} dateInput Data no formato aceito por `parseDate` ou um objeto Date.
 * @returns {number|null} Idade em anos ou null se a data for inválida.
 */
export function calculateAge(dateInput) {
  if (!dateInput) return null;
  const dateObj = dateInput instanceof Date ? dateInput : parseDate(String(dateInput));
  if (!dateObj) return null;

  const now = new Date();
  let age = now.getFullYear() - dateObj.getFullYear();
  const monthDiff = now.getMonth() - dateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateObj.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Formata uma data em dd/MM/YYYY a partir de string ou Date.
 * @param {string|Date} dateInput
 * @returns {string|null} Data formatada ou null se inválida.
 */
export function formatDate(dateInput) {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : parseDate(String(dateInput));
  if (!d) return null;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Retorna um símbolo unicode representando o gênero a partir de um valor bruto.
 * Aceita valores comuns ('M', 'F', 'Masculino', 'Feminino', etc.).
 * @param {string} raw - Valor bruto do campo gênero/sexo.
 * @returns {string} Símbolo unicode ou empty string se indefinido.
 */
export function getGenderSymbol(raw) {
  if (!raw && raw !== 0) return '';
  const v = String(raw).trim().toLowerCase();
  if (!v) return '';
  // masculino
  if (v === 'm' || v === 'masculino' || v === 'male' || v === 'mas') return '♂';
  // feminino
  if (v === 'f' || v === 'feminino' || v === 'female' || v === 'fem') return '♀';
  // outros/ignorado
  if (v === 'o' || v === 'outro' || v === 'x' || v === 'indefinido' || v === 'null') return '⚧';
  // valores como '1'/'2' podem ser utilizados por alguns sistemas (1=M,2=F)
  if (v === '1') return '♂';
  if (v === '2') return '♀';
  return '⚧';
}

/**
 * Retorna um rótulo legível para o gênero (Português curto).
 * @param {string} raw
 * @returns {string}
 */
export function getGenderLabel(raw) {
  if (!raw && raw !== 0) return '';
  const v = String(raw).trim().toLowerCase();
  if (!v) return '';
  if (v === 'm' || v === 'masculino' || v === 'male' || v === 'mas' || v === '1')
    return 'Masculino';
  if (v === 'f' || v === 'feminino' || v === 'female' || v === 'fem' || v === '2')
    return 'Feminino';
  return 'Outro';
}

/**
 * Classe(s) utilitárias para o badge de gênero (Tailwind-compatible).
 * @param {string} raw
 * @returns {string} classes
 */
export function getGenderBadgeClass(raw) {
  const label = getGenderLabel(raw);
  if (label === 'Masculino') return 'bg-blue-100 text-blue-800';
  if (label === 'Feminino') return 'bg-pink-100 text-pink-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * Tenta extrair o campo de sexo/gênero de um objeto `ficha` em caminhos comuns.
 * Retorna o valor bruto (string) ou null.
 * @param {object} ficha
 * @returns {string|null}
 */
export function extractGenderFromFicha(ficha) {
  if (!ficha || typeof ficha !== 'object') return null;

  // Alguns endpoints retornam a linha em formato grid: ficha.cell ou ficha.rows[0].cell
  // onde o gênero frequentemente aparece em posições fixas (ex: 12).
  const tryCellArray = (arr) => {
    if (!Array.isArray(arr)) return null;
    const idxCandidates = [12, 11, 9, 8, 13];
    for (const i of idxCandidates) {
      if (i >= 0 && i < arr.length) {
        const v = arr[i];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
      }
    }
    return null;
  };

  // 1) ficha.cell direto
  const fromCell = tryCellArray(ficha.cell);
  if (fromCell) return fromCell;

  // 2) ficha.rows[0].cell (estruturas tipo grid)
  if (Array.isArray(ficha.rows) && ficha.rows.length > 0) {
    const row = ficha.rows[0];
    const rowCell = row && Array.isArray(row.cell) ? row.cell : Array.isArray(row) ? row : null;
    const fromRowCell = tryCellArray(rowCell);
    if (fromRowCell) return fromRowCell;
  }

  // 3) fallback para caminhos nomeados na ficha
  const candidates = [
    'entidadeFisica.entfSexo',
    'entidadeFisica.sexo',
    'entidadeFisica.entidade.sexo',
    'sexo',
    'genero',
  ];
  for (const path of candidates) {
    const val = getNestedValue(ficha, path);
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
  }

  return null;
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
  // DEBUG: Exibe dados brutos recebidos
  console.log('DEBUG apiData.consultations:', apiData.consultations);
  console.log('DEBUG apiData.appointments:', apiData.appointments);
  // Normalize Exams Completed
  try {
    (apiData.examsCompleted || []).forEach((e) => {
      const eventDate = parseDate(e.date);
      if (!e || !eventDate) return;
      const searchText = normalizeString(
        [e.examName, e.provider, e.status].filter(Boolean).join(' ')
      );
      events.push({
        type: 'examCompleted',
        date: eventDate,
        sortableDate: eventDate,
        title: `Exame Realizado: ${e.examName || 'Nome não informado'}`,
        summary: `Realizado por ${e.provider || 'Não informado'}`,
        details: e,
        hasResult: !!e.hasResult,
        resultIdp: e.resultIdp,
        resultIds: e.resultIds,
        subDetails: [
          { label: 'Status', value: e.status || 'N/A' },
          { label: 'Resultado', value: e.hasResult ? 'Disponível' : 'Pendente' },
        ],
        searchText,
      });
    });
  } catch (e) {
    logError(
      'Failed to normalize completed exam data for timeline',
      {
        errorMessage: e.message,
        error: e,
      },
      ERROR_CATEGORIES.TIMELINE_NORMALIZATION
    );
  }

  // Normalize Consultations
  try {
    (apiData.consultations || []).forEach((c) => {
      if (!c) return;
      // Extrai datas de agendamento e atendimento
      let agendamentoDate = null;
      let atendimentoDateTime = null;
      if (typeof c.date === 'string') {
        // Exemplo: "Ag 06/08/2025\nAt 06/08/2025 13:41:20"
        const agMatch = c.date.match(/Ag (\d{2}\/\d{2}\/\d{4})/);
        if (agMatch) agendamentoDate = agMatch[1];
        const atMatch = c.date.match(/At (\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2}:\d{2})/);
        if (atMatch) atendimentoDateTime = `${atMatch[1]} ${atMatch[2]}`;
      }
      // Se não encontrou, tenta campos alternativos
      if (!agendamentoDate && c.date) agendamentoDate = c.date;
      if (!atendimentoDateTime && c.time && c.date) atendimentoDateTime = `${c.date} ${c.time}`;
      if (!atendimentoDateTime && (c.atendimentoDate || c.dataConsulta))
        atendimentoDateTime = c.atendimentoDate || c.dataConsulta;
      if (!atendimentoDateTime && agendamentoDate) atendimentoDateTime = agendamentoDate;
      if (!atendimentoDateTime) return;

      const searchText = normalizeString(
        [
          c.specialty,
          c.professional,
          c.unit,
          c.status,
          c.description,
          ...(c.details ? c.details.map((d) => d.value) : []),
        ].join(' ')
      );
      // Monta subDetails idêntico à sessão de consultas
      const subDetails = [
        { label: 'Unidade', value: c.unit || '' },
        { label: 'Especialidade', value: c.specialty || '' },
        { label: 'Profissional', value: c.professional || '' },
        { label: 'Prioridade', value: c.priority || '' },
        { label: 'Status', value: c.status || '' },
        c.isNoShow ? { label: 'PACIENTE FALTOU', value: 'Sim' } : null,
        agendamentoDate ? { label: 'Agendamento', value: agendamentoDate } : null,
        atendimentoDateTime ? { label: 'Atendimento', value: atendimentoDateTime } : null,
        c.description ? { label: 'Descrição da Consulta', value: c.description } : null,
        ...(c.details || []),
      ].filter(Boolean);
      events.push({
        type: 'consultation',
        date: parseDate(atendimentoDateTime),
        sortableDate: c.sortableDate || parseDate(atendimentoDateTime),
        title: `Consulta: ${c.specialty || 'Especialidade não informada'}`,
        summary: `com ${c.professional || 'Profissional não informado'}`,
        details: c,
        subDetails,
        searchText,
      });
    });
  } catch (e) {
    logError(
      'Failed to normalize consultation data for timeline',
      {
        errorMessage: e.message,
        error: e,
      },
      ERROR_CATEGORIES.TIMELINE_NORMALIZATION
    );
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
        hasResult: !!e.hasResult,
        resultIdp: e.resultIdp,
        resultIds: e.resultIds,
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
    logError(
      'Failed to normalize exam data for timeline',
      {
        errorMessage: e.message,
        error: e,
      },
      ERROR_CATEGORIES.TIMELINE_NORMALIZATION
    );
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
    logError(
      'Failed to normalize appointment data for timeline',
      {
        errorMessage: e.message,
        error: e,
      },
      ERROR_CATEGORIES.TIMELINE_NORMALIZATION
    );
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
    logError(
      'Failed to normalize regulation data for timeline',
      {
        errorMessage: e.message,
        error: e,
      },
      ERROR_CATEGORIES.TIMELINE_NORMALIZATION
    );
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
    logError(
      'Failed to normalize document data for timeline',
      {
        errorMessage: e.message,
        error: e,
      },
      ERROR_CATEGORIES.TIMELINE_NORMALIZATION
    );
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
      logWarning(
        'TIMELINE_FILTERING',
        'Error filtering timeline event, it will be included by default',
        { eventType: event?.type, errorMessage: e.message }
      );
      return true;
    }
  });
}
