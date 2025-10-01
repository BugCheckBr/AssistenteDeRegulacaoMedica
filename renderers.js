/**
 * @file Contém todas as funções responsáveis por gerar o HTML dos resultados.
 */

import { getSortIndicator } from './SectionManager.js';
import * as Utils from './utils.js';

export function renderConsultations(consultations, sortState) {
  const contentDiv = document.getElementById('consultations-content');
  if (!contentDiv) return;

  if (consultations.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhuma consulta encontrada para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="specialty">Especialidade/Profissional <span class="sort-indicator">${getSortIndicator(
          'specialty',
          sortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="sortableDate">Data <span class="sort-indicator">${getSortIndicator(
          'sortableDate',
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    consultations
      .map(
        (c) => `
        <div class="p-3 mb-3 border rounded-lg ${
          c.isNoShow ? 'bg-red-50 border-red-200' : 'bg-white'
        } consultation-item">
            <div class="flex justify-between items-start cursor-pointer consultation-header">
                <div>
                    <p class="font-bold text-blue-700 pointer-events-none">${c.specialty}</p>
                    <p class="text-sm text-slate-600 pointer-events-none">${c.professional}</p>
                </div>
                <p class="text-sm font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded whitespace-pre-wrap text-right pointer-events-none">${c.date.replace(
                  /\n/g,
                  '<br>'
                )}</p>
            </div>
            <div class="consultation-body collapse-section show">
                ${
                  c.isNoShow
                    ? '<p class="text-center font-bold text-red-600 mt-2">PACIENTE FALTOU</p>'
                    : `
                <p class="text-sm text-slate-500 mt-1">${c.unit}</p>
                <div class="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <p class="text-xs font-semibold text-slate-500 uppercase">Status (Normalizado)</p>
                    <p class="text-sm text-slate-700 whitespace-pre-wrap">${c.status || ''}</p>
                    <p class="text-xs font-semibold text-slate-500 uppercase">Status (Bruto)</p>
                    <p class="text-sm text-slate-700 whitespace-pre-wrap">${(() => {
                      const statusBruto = [];
                      if (c.agcoIsCancelado === 't') statusBruto.push('Cancelado');
                      if (c.agcoIsFaltante === 't') statusBruto.push('Faltante');
                      if (c.agcoIsAtendido === 't') statusBruto.push('Atendido');
                      if (c.agcoIsDesmarcado === 't') statusBruto.push('Desmarcado');
                      // Se não há flags, tenta usar os campos normalizados
                      if (statusBruto.length === 0) {
                        if (c.Atendido === 'SIM') statusBruto.push('Atendido');
                        if (c.Faltante === 'SIM') statusBruto.push('Faltante');
                        if (c.Cancelado === 'SIM') statusBruto.push('Cancelado');
                        if (c.Desmarcado === 'SIM') statusBruto.push('Desmarcado');
                        if (c['Primeira Consulta'] === 'SIM') statusBruto.push('Primeira Consulta');
                      }
                      return statusBruto.length ? statusBruto.join(', ') : 'Nenhum';
                    })()}</p>
                    ${c.details
                      .map(
                        (d) =>
                          `<p class="text-xs font-semibold text-slate-500 uppercase">${
                            d.label
                          }</p><p class="text-sm text-slate-700 whitespace-pre-wrap">${d.value.replace(
                            /\n/g,
                            '<br>'
                          )} <span class="copy-icon" title="Copiar" data-copy-text="${
                            d.value
                          }">📄</span></p>`
                      )
                      .join('')}
                </div>`
                }
            </div>
        </div>
    `
      )
      .join('');
}

export function renderExams(exams, sortState) {
  const contentDiv = document.getElementById('exams-content');
  if (!contentDiv) return;

  if (exams.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhum exame encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="examName">Nome do Exame <span class="sort-indicator">${getSortIndicator(
          'examName',
          sortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          'date',
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    exams
      .map((exam) => {
        const idp = exam.resultIdp;
        const ids = exam.resultIds;
        const idpStr = idp !== null && idp !== undefined ? String(idp).split('-')[0] : '';
        let idsStr = ids !== null && ids !== undefined ? String(ids) : '';
        // Se ids for igual ao idp, mas idp tem hífen, extrai sufixo do idp
        if (idsStr === idpStr && String(idp).includes('-')) {
          idsStr = String(idp).split('-')[1] || '1';
        } else if (idsStr.includes('-')) {
          idsStr = idsStr.split('-')[1] || idsStr.split('-')[0];
        }
        const showBtn =
          exam.hasResult &&
          idp !== null &&
          idp !== undefined &&
          ids !== null &&
          ids !== undefined &&
          idpStr !== '' &&
          idsStr !== '';
        return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <p class="font-semibold text-indigo-700">${
              exam.examName || 'Nome do exame não informado'
            } <span class="copy-icon" title="Copiar" data-copy-text="${exam.examName}">📄</span></p>
            <div class="text-sm text-slate-500 mt-1">
                <p>Solicitado por: ${exam.professional || 'Não informado'} (${
                  exam.specialty || 'N/A'
                })</p>
                <p>Data: ${exam.date || 'Não informada'}</p>
            </div>
            ${
              showBtn
                ? `<button class="view-exam-result-btn mt-2 w-full text-sm bg-green-100 text-green-800 py-1 rounded hover:bg-green-200" data-idp="${idpStr}" data-ids="${idsStr}">Visualizar Resultado</button>`
                : ''
            }
        </div>
      `;
      })
      .join('');
}

export function renderAppointments(appointments, sortState) {
  // Log seguro para debug dos dados recebidos
  console.log('[Assistente de Regulação] Dados recebidos em renderAppointments:', appointments);
  const contentDiv = document.getElementById('appointments-content');
  if (!contentDiv) return;

  const statusStyles = {
    AGENDADO: 'bg-blue-100 text-blue-800',
    PRESENTE: 'bg-green-100 text-green-800',
    FALTOU: 'bg-red-100 text-red-800',
    CANCELADO: 'bg-yellow-100 text-yellow-800',
    ATENDIDO: 'bg-purple-100 text-purple-800',
  };

  if (appointments.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhum agendamento encontrado para o filtro selecionado.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="specialty">Especialidade <span class="sort-indicator">${getSortIndicator(
          'specialty',
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${getSortIndicator(
          'status',
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          'date',
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    appointments
      .map((item) => {
        const style = statusStyles[item.status] || 'bg-gray-100 text-gray-800';
        let typeText = item.type;
        if (item.isSpecialized) {
          typeText = 'CONSULTA ESPECIALIZADA';
        } else if (item.isOdonto) {
          typeText = 'CONSULTA ODONTO';
        } else if (item.type.toUpperCase().includes('EXAME')) {
          typeText = 'EXAME';
        }

        // Corrige mapeamento para exames ("exam-590065-1") e consultas ("2926231-1")
        let idp = '';
        let ids = '';
        if (item.type === 'EXAME' && item.id && item.id.startsWith('exam-')) {
          const parts = item.id.split('-');
          idp = parts[1];
          ids = parts[2];
        } else if (item.id && item.id.includes('-')) {
          [idp, ids] = item.id.split('-');
        } else if (item.examPK && item.examPK.idp && item.examPK.ids) {
          idp = item.examPK.idp;
          ids = item.examPK.ids;
        } else if (item.idp && item.ids) {
          idp = item.idp;
          ids = item.ids;
        }

        return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${typeText}</p>
                    <p class="text-sm text-indigo-600 font-medium">${
                      item.specialty || 'Sem especialidade'
                    }</p>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${
                  item.status
                }</span>
            </div>
            <div class="text-sm text-slate-500 mt-2 border-t pt-2">
                <p><strong>Data:</strong> ${item.date} às ${item.time}</p>
                <p><strong>Local:</strong> ${item.location}</p>
                <p><strong>Profissional:</strong> ${item.professional}</p>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t">
                   ${idp && ids ? `<button class="view-appointment-details-btn text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${idp}" data-ids="${ids}" data-type="${item.type}">Ver Detalhes</button>` : '<span class="text-xs text-slate-400">ID de agendamento não disponível</span>'}
            </div>
        </div>
      `;
      })
      .join('');
}

export function renderRegulations(regulations, sortState, globalSettings) {
  const contentDiv = document.getElementById('regulations-content');
  if (!contentDiv) return;

  const priorityNameMap = new Map();
  const priorityColorMap = new Map();
  if (globalSettings && globalSettings.regulationPriorities) {
    globalSettings.regulationPriorities.forEach((prio) => {
      priorityNameMap.set(prio.coreDescricao, prio.coreDescricao);
      priorityColorMap.set(prio.coreDescricao, prio.coreCor);
    });
  }

  const statusStyles = {
    AUTORIZADO: 'bg-green-100 text-green-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    NEGADO: 'bg-red-100 text-red-800',
    DEVOLVIDO: 'bg-orange-100 text-orange-800',
    CANCELADA: 'bg-gray-100 text-gray-800',
    'EM ANÁLISE': 'bg-blue-100 text-blue-800',
  };

  if (regulations.length === 0) {
    contentDiv.innerHTML =
      '<p class="text-slate-500">Nenhum resultado encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="procedure">Procedimento <span class="sort-indicator">${getSortIndicator(
          'procedure',
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${getSortIndicator(
          'status',
          sortState
        )}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          'date',
          sortState
        )}</span></span>
    </div>
  `;
  contentDiv.innerHTML =
    headers +
    regulations
      .map((item) => {
        const statusKey = (item.status || '').toUpperCase();
        const style = statusStyles[statusKey] || 'bg-gray-100 text-gray-800';

        const priorityKey = (item.priority || '').toUpperCase();
        const priorityColor = priorityColorMap.get(priorityKey) || 'CCCCCC';
        const textColor = Utils.getContrastYIQ(priorityColor);
        const priorityStyle = `background-color: #${priorityColor}; color: ${textColor};`;
        const priorityText = priorityNameMap.get(priorityKey) || item.priority;

        const typeText = (item.type || '').startsWith('CON') ? 'CONSULTA' : 'EXAME';
        const typeColor = typeText === 'CONSULTA' ? 'text-cyan-700' : 'text-fuchsia-700';

        const attachmentsHtml =
          item.attachments && item.attachments.length > 0
            ? `
            <div class="mt-2 pt-2 border-t border-slate-100">
                <p class="text-xs font-semibold text-slate-500 mb-1">ANEXOS:</p>
                <div class="space-y-1">
                    ${item.attachments
                      .map(
                        (att) => `
                        <button class="view-regulation-attachment-btn w-full text-left text-sm bg-gray-50 text-gray-700 py-1 px-2 rounded hover:bg-gray-100 flex justify-between items-center" data-idp="${
                          att.idp
                        }" data-ids="${att.ids}">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="flex-shrink-0" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/><path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/></svg>
                                <span class="truncate" title="${
                                  att.description
                                } (${att.fileType.toUpperCase()})">${
                                  att.description
                                } (${att.fileType.toUpperCase()})</span>
                            </div>
                            <span class="text-xs text-slate-400 flex-shrink-0 ml-2">${
                              att.date
                            }</span>
                        </button>`
                      )
                      .join('')}
                </div>
            </div>
            `
            : '';

        return `
            <div class="p-3 mb-3 border rounded-lg bg-white">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                           <p class="font-bold ${typeColor}">${typeText}</p>
                           <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="${priorityStyle}">${priorityText}</span>
                        </div>
                        <p class="text-sm text-slate-800 font-medium">${
                          item.procedure
                        } <span class="copy-icon" title="Copiar" data-copy-text="${
                          item.procedure
                        }">📄</span></p>
                        <p class="text-xs text-slate-500">${
                          item.cid
                        } <span class="copy-icon" title="Copiar" data-copy-text="${
                          item.cid
                        }">📄</span></p>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${
                      item.status
                    }</span>
                </div>
                <div class="text-sm text-slate-500 mt-2 border-t pt-2 space-y-1">
                    <p><strong>Data:</strong> ${item.date}</p>
                    <p><strong>Solicitante:</strong> ${item.requester}</p>
                    <p><strong>Executante:</strong> ${item.provider || 'Não definido'}</p>
                </div>
                <div class="mt-2 pt-2 border-t">
                     <button class="view-regulation-details-btn w-full text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${
                       item.idp
                     }" data-ids="${item.ids}">
                        Visualizar Detalhes
                    </button>
                </div>
                ${attachmentsHtml}
            </div>
      `;
      })
      .join('');
}

export function renderDocuments(documents, sortState) {
  const contentDiv = document.getElementById('documents-content');
  if (!contentDiv) return;

  if (!documents || documents.length === 0) {
    contentDiv.innerHTML = '<p class="text-slate-500">Nenhum documento encontrado.</p>';
    return;
  }

  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="description">Descrição <span class="sort-indicator">${getSortIndicator(
          'description',
          sortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          'date',
          sortState
        )}</span></span>
    </div>
  `;

  contentDiv.innerHTML =
    headers +
    documents
      .map(
        (doc) => `
        <div class="p-3 mb-2 border rounded-lg bg-white">
            <p class="font-semibold text-gray-800">${doc.description}</p>
            <div class="text-sm text-slate-500 mt-1">
                <span>Data: ${doc.date}</span> |
                <span class="font-medium">Tipo: ${doc.fileType.toUpperCase()}</span>
            </div>
            <button class="view-document-btn mt-2 w-full text-sm bg-gray-100 text-gray-800 py-1 rounded hover:bg-gray-200" data-idp="${
              doc.idp
            }" data-ids="${doc.ids}">
                Visualizar Documento
            </button>
        </div>
      `
      )
      .join('');
}

/**
 * Renders the timeline based on the provided events and status.
 * @param {Array<object>} events - The array of timeline event objects.
 * @param {'loading'|'empty'|'error'|'success'} status - The current status of the timeline.
 */
export function renderTimeline(events, status) {
  const contentDiv = document.getElementById('timeline-content');
  if (!contentDiv) return;

  const eventTypeStyles = {
    consultation: {
      label: 'Consulta',
      color: 'blue',
      bgColorClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
      icon: 'M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3m-6-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    },
    exam: {
      label: 'Exame',
      color: 'green',
      bgColorClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
      icon: 'M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3',
    },
    appointment: {
      label: 'Agendamento',
      color: 'purple',
      bgColorClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
      icon: 'M8 2v4M16 2v4M3 10h18M3 4h18v16H3zM9 16l2 2 4-4',
    },
    regulation: {
      label: 'Regulação',
      color: 'red',
      bgColorClass: 'bg-red-100',
      iconColorClass: 'text-red-600',
      icon: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4',
    },
    // --- INÍCIO DA MODIFICAÇÃO ---
    document: {
      label: 'Documento',
      color: 'gray',
      bgColorClass: 'bg-gray-100',
      iconColorClass: 'text-gray-600',
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6',
    },
    // --- FIM DA MODIFICAÇÃO ---
  };

  let contentHtml = '';

  switch (status) {
    case 'loading':
      contentHtml = '<p class="text-slate-500 text-center">A carregar linha do tempo...</p>';
      break;
    case 'empty':
      contentHtml =
        '<p class="text-slate-500 text-center">Nenhum evento encontrado para este paciente.</p>';
      break;
    case 'error':
      contentHtml =
        '<p class="text-red-500 text-center">Ocorreu um erro ao carregar os dados. Tente novamente.</p>';
      break;
    case 'success':
      if (events.length === 0) {
        contentHtml =
          '<p class="text-slate-500 text-center">Nenhum evento encontrado para os filtros aplicados.</p>';
        break;
      }
      contentHtml = '<div class="relative space-y-4">';
      contentHtml += '<div class="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>';

      contentHtml += events
        .map((event) => {
          const style = eventTypeStyles[event.type] || {
            label: 'Evento',
            color: 'gray',
            bgColorClass: 'bg-gray-100',
            iconColorClass: 'text-gray-600',
            icon: '',
          };

          // Personalização de cor por status
          if (event.type === 'appointment' && event.details?.status) {
            switch (event.details.status) {
              case 'AGENDADO':
                style.bgColorClass = 'bg-blue-100';
                style.iconColorClass = 'text-blue-600';
                break;
              case 'PRESENTE':
                style.bgColorClass = 'bg-green-100';
                style.iconColorClass = 'text-green-600';
                break;
              case 'FALTOU':
                style.bgColorClass = 'bg-red-100';
                style.iconColorClass = 'text-red-600';
                break;
              case 'CANCELADO':
                style.bgColorClass = 'bg-yellow-100';
                style.iconColorClass = 'text-yellow-600';
                break;
              case 'ATENDIDO':
                style.bgColorClass = 'bg-purple-100';
                style.iconColorClass = 'text-purple-600';
                break;
              default:
                style.bgColorClass = 'bg-gray-100';
                style.iconColorClass = 'text-gray-600';
            }
          }
          if ((event.type === 'exam' || event.type === 'examCompleted') && event.details) {
            if (event.details.hasResult) {
              style.bgColorClass = 'bg-green-100';
              style.iconColorClass = 'text-green-700';
            } else {
              style.bgColorClass = 'bg-yellow-100';
              style.iconColorClass = 'text-yellow-600';
            }
          }
          if (event.type === 'consultation' && event.details) {
            if (event.details.isSpecialized) {
              style.bgColorClass = 'bg-purple-100';
              style.iconColorClass = 'text-purple-600';
            } else if (event.details.isOdonto) {
              style.bgColorClass = 'bg-orange-100';
              style.iconColorClass = 'text-orange-600';
            } else {
              style.bgColorClass = 'bg-blue-100';
              style.iconColorClass = 'text-blue-600';
            }
          }
          if (event.type === 'regulation' && event.details) {
            if (event.details.status === 'URGENTE') {
              style.bgColorClass = 'bg-red-100';
              style.iconColorClass = 'text-red-600';
            } else if (event.details.status === 'FINALIZADA') {
              style.bgColorClass = 'bg-green-100';
              style.iconColorClass = 'text-green-600';
            } else {
              style.bgColorClass = 'bg-yellow-100';
              style.iconColorClass = 'text-yellow-600';
            }
          }
          // Padroniza ícone SVG para cada tipo de evento
          switch (event.type) {
            case 'appointment':
              style.icon = 'M8 2v4M16 2v4M3 10h18M3 4h18v16H3zM9 16l2 2 4-4'; // calendário/check
              break;
            case 'examCompleted':
            case 'exam':
              // Ícone microscópio
              style.icon =
                'M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3';
              break;
            case 'consultation':
              style.icon =
                'M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3m-6-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'; // usuário/consulta
              break;
            case 'regulation':
              style.icon =
                'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4'; // regulação/alerta
              break;
            case 'document':
              style.icon = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6'; // documento
              break;
            default:
              style.icon = '';
          }
          const dateString =
            event.date instanceof Date && !isNaN(event.date)
              ? event.date.toLocaleDateString('pt-BR')
              : 'Data Inválida';

          let topRightDetailsHtml = '';
          let extraInfoHtml = '';

          if (event.type === 'appointment') {
            const a = event.details;
            let idp = '';
            let ids = '';
            if (a.id && a.id.startsWith('exam-')) {
              const parts = a.id.split('-');
              idp = parts[1];
              ids = parts[2];
            } else if (a.id && a.id.includes('-')) {
              [idp, ids] = a.id.split('-');
            } else if (a.examPK && a.examPK.idp && a.examPK.ids) {
              idp = a.examPK.idp;
              ids = a.examPK.ids;
            } else if (a.idp && a.ids) {
              idp = a.idp;
              ids = a.ids;
            }

            const statusStyles = {
              AGENDADO: 'text-blue-600',
              PRESENTE: 'text-green-600',
              FALTOU: 'text-red-600',
              CANCELADO: 'text-yellow-600',
              ATENDIDO: 'text-purple-600',
            };
            const statusClass = statusStyles[a.status] || 'text-slate-600';
            const timeHtml = `<div class="text-xs text-slate-500">às ${a.time}</div>`;
            const statusHtml = `<div class="mt-1 text-xs font-semibold ${statusClass}">${a.status}</div>`;

            const icon =
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>';
            const detailsButtonHtml = `<button class="view-appointment-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1" data-idp="${idp}" data-ids="${ids}" data-type="${a.type}">${icon}<span>Detalhes</span></button>`;

            topRightDetailsHtml = timeHtml + statusHtml + detailsButtonHtml;
          } else if (event.type === 'exam' || event.type === 'examCompleted') {
            const statusText = event.details.hasResult ? 'Com Resultado' : 'Sem Resultado';
            const statusClass = event.details.hasResult ? 'text-green-600' : 'text-yellow-600';
            // Ícone microscópio para ambos os status
            const microscopeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle mr-1"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`;
            // Ícone documento com check para laudo/resultado
            const resultIcon = event.details.hasResult
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle mr-1"><rect x="3" y="2" width="14" height="20" rx="2"/><polyline points="9 17 12 20 17 15"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`
              : '';
            topRightDetailsHtml = `<div class="mt-1 text-xs font-semibold ${statusClass}">${microscopeIcon}${resultIcon}${statusText}</div>`;
            if (event.details.hasResult && event.details.resultIdp && event.details.resultIds) {
              topRightDetailsHtml += `<button class="view-exam-result-btn mt-2 text-xs bg-green-100 text-green-800 py-1 px-3 rounded hover:bg-green-200 flex items-center gap-1" data-idp="${event.details.resultIdp}" data-ids="${event.details.resultIds}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle mr-1"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Visualizar Resultado</button>`;
            }
          } else if (event.type === 'regulation') {
            const r = event.details;
            if (r.idp && r.ids) {
              const icon =
                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>';
              topRightDetailsHtml = `<button class="view-regulation-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1" data-idp="${r.idp}" data-ids="${r.ids}">${icon}<span>Detalhes</span></button>`;
            }
          }

          if (event.type === 'consultation') {
            const icon =
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>';
            topRightDetailsHtml = `<button class="timeline-toggle-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1">${icon}<span>Detalhes</span></button>`;

            // Renderiza subDetails sempre no topo
            const subDetailsHtml = (event.subDetails || [])
              .map(
                (d) =>
                  `<p class="text-xs font-semibold text-slate-500 uppercase mb-1">${d.label}</p>
                   <p class="text-sm text-slate-700 mb-2">${String(d.value).replace(/\n/g, '<br>')}</p>`
              )
              .join('');

            extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200">
                    ${subDetailsHtml}
                </div>
            `;
          } else if (event.type === 'regulation') {
            const r = event.details;
            const attachmentsHtml =
              r.attachments && r.attachments.length > 0
                ? `
                <div class="mt-2 pt-2 border-t border-slate-100">
                    <p class="text-xs font-semibold text-slate-500 mb-1">ANEXOS:</p>
                    <div class="space-y-1">
                        ${r.attachments
                          .map(
                            (att) => `
                            <button class="view-regulation-attachment-btn w-full text-left text-sm bg-gray-50 text-gray-700 py-1 px-2 rounded hover:bg-gray-100 flex justify-between items-center" data-idp="${
                              att.idp
                            }" data-ids="${att.ids}">
                                <div class="flex items-center gap-2 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="flex-shrink-0" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/><path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/></svg>
                                    <span class="truncate" title="${
                                      att.description
                                    } (${att.fileType.toUpperCase()})">${
                                      att.description
                                    } (${att.fileType.toUpperCase()})</span>
                                </div>
                                <span class="text-xs text-slate-400 flex-shrink-0 ml-2">${
                                  att.date
                                }</span>
                            </button>
                        `
                          )
                          .join('')}
                    </div>
                </div>
                `
                : '';

            extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200 text-sm">
                    <p class="mb-1"><strong>Status:</strong> ${r.status}</p>
                    <p class="mb-1"><strong>Prioridade:</strong> ${r.priority}</p>
                    <p class="mb-1"><strong>CID:</strong> ${r.cid}</p>
                    <p class="mb-2"><strong>Executante:</strong> ${r.provider || 'Não definido'}</p>
                    ${attachmentsHtml}
                </div>
            `;
            // --- INÍCIO DA MODIFICAÇÃO ---
          } else if (event.type === 'document') {
            const doc = event.details;
            extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200">
                    <button class="view-document-btn w-full text-sm bg-gray-100 text-gray-800 py-1 rounded hover:bg-gray-200" data-idp="${doc.idp}" data-ids="${doc.ids}">
                        Visualizar Documento
                    </button>
                </div>
            `;
          }
          // --- FIM DA MODIFICAÇÃO ---

          return `
                    <div class="relative pl-10 timeline-item" data-event-type="${event.type}">
                        <div class="absolute left-4 top-2 -ml-[15px] h-[30px] w-[30px] rounded-full ${style.bgColorClass} border-2 border-white flex items-center justify-center ${style.iconColorClass}" title="${style.label}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <path d="${style.icon}" />
                            </svg>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div class="timeline-header cursor-pointer">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-sm font-semibold text-${style.color}-700">${event.title}</p>
                                        <p class="text-xs text-slate-600">${event.summary}</p>
                                    </div>
                                    <div class="text-right flex-shrink-0 ml-2">
                                        <p class="text-xs font-medium text-slate-500">${dateString}</p>
                                        ${topRightDetailsHtml}
                                    </div>
                                </div>
                            </div>
                            ${extraInfoHtml}
                        </div>
                    </div>
                `;
        })
        .join('');
      contentHtml += '</div>';
      break;
  }
  contentDiv.innerHTML = contentHtml;
}
