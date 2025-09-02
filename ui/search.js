/**
 * @file Módulo para gerir a funcionalidade de busca de pacientes.
 */
import * as API from '../api.js';
import { store } from '../store.js';
import * as Utils from '../utils.js';

let searchInput;
let searchResultsList;
let recentPatientsList;
let onSelectPatient; // Callback para notificar o sidebar sobre a seleção

function renderSearchResults(patients) {
  if (!searchResultsList) return;
  if (patients.length === 0) {
    searchResultsList.innerHTML =
      '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente encontrado.</li>';
    return;
  }
  searchResultsList.innerHTML = patients
    .map(
      (p) =>
        `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition" data-idp="${
          p.idp
        }" data-ids="${p.ids}">${renderPatientListItem(p)}</li>`
    )
    .join('');
}

/**
 * Renderiza a lista de pacientes recentes a partir do store.
 */
function renderRecentPatients() {
  if (!recentPatientsList) return;
  const recents = store.getRecentPatients() || [];
  recentPatientsList.innerHTML =
    '<li class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400">PACIENTES RECENTES</li>' +
    (recents.length === 0
      ? '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente recente.</li>'
      : recents
          .map((p) => {
            // CORREÇÃO: Lida com a estrutura de dados antiga e nova dos pacientes recentes.
            const fichaData = p.ficha || p; // Se p.ficha não existe, 'p' é o próprio objeto da ficha.
            const idp = fichaData.isenPK?.idp || fichaData.idp;
            const ids = fichaData.isenPK?.ids || fichaData.ids;

            if (!idp || !ids) return ''; // Pula a renderização se o item estiver malformado.

            return `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition recent-patient-item" data-idp="${idp}" data-ids="${ids}">${renderPatientListItem(
              fichaData
            )}</li>`;
          })
          .join(''));
}

function renderPatientListItem(patient) {
  const nome =
    patient.value ||
    Utils.getNestedValue(patient, 'entidadeFisica.entidade.entiNome') ||
    'Nome não informado';
  const idp = patient.idp || patient.isenPK?.idp;
  const ids = patient.ids || patient.isenPK?.ids;
  const dataNascimento =
    patient.dataNascimento || Utils.getNestedValue(patient, 'entidadeFisica.entfDtNasc');
  // Calcula idade e formata a data de nascimento para exibição
  const idade = Utils.calculateAge(dataNascimento);
  const formattedDob = Utils.formatDate(dataNascimento);
  // extrair gênero (tenta a ficha completa ou o próprio objeto paciente)
  const rawGender =
    Utils.extractGenderFromFicha(patient) || Utils.extractGenderFromFicha(patient.ficha || {});
  const genderSymbol = rawGender ? Utils.getGenderSymbol(rawGender) : '';
  const genderLabel = rawGender ? Utils.getGenderLabel(rawGender) : '';
  const genderBadgeClass = rawGender
    ? Utils.getGenderBadgeClass(rawGender)
    : 'bg-gray-100 text-gray-800';
  const cpf = patient.cpf || Utils.getNestedValue(patient, 'entidadeFisica.entfCPF');
  const cns = patient.cns || patient.isenNumCadSus;
  const genderBadge = rawGender
    ? ` <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${genderBadgeClass} ml-1">${genderSymbol} ${genderLabel}</span>`
    : '';

  return `
      <div class="font-medium text-slate-800">${nome}${genderBadge}</div>
      <div class="grid grid-cols-2 gap-x-4 text-xs text-slate-500 mt-1">
        <span><strong class="font-semibold">Cód:</strong> ${idp}-${ids}</span>
        <span><strong class="font-semibold">Nasc:</strong> ${formattedDob ? formattedDob + (idade !== null ? ' • ' + idade + ' anos' : '') : idade !== null ? idade + ' anos' : dataNascimento || '-'}</span>
        <span><strong class="font-semibold">CPF:</strong> ${cpf || '-'}</span>
        <span><strong class="font-semibold">CNS:</strong> ${cns || '-'}</span>
      </div>
    `;
}

const handleSearchInput = Utils.debounce(async () => {
  const searchTerm = searchInput.value.trim();
  store.clearPatient();
  recentPatientsList.classList.add('hidden');
  searchResultsList.classList.remove('hidden');
  if (searchTerm.length < 1) {
    searchResultsList.innerHTML = '';
    return;
  }
  Utils.toggleLoader(true);
  try {
    const patients = await API.searchPatients(searchTerm);
    renderSearchResults(patients);
  } catch {
    Utils.showMessage('Erro ao buscar pacientes.');
  } finally {
    Utils.toggleLoader(false);
  }
}, 500);

function handleSearchFocus() {
  if (searchInput.value.length > 0) return;
  renderRecentPatients();
  searchResultsList.classList.add('hidden');
  recentPatientsList.classList.remove('hidden');
}

function handleSearchBlur() {
  setTimeout(() => {
    searchResultsList.classList.add('hidden');
    recentPatientsList.classList.add('hidden');
  }, 200);
}

async function handleResultClick(event) {
  const listItem = event.target.closest('li[data-idp]');
  if (!listItem) return;

  const { idp, ids } = listItem.dataset;

  if (listItem.classList.contains('recent-patient-item')) {
    const recentPatient = store.getRecentPatients().find((p) => {
      // CORREÇÃO: Lida com a estrutura de dados antiga e nova.
      const patientIdp = p.ficha ? p.ficha.isenPK.idp : p.idp;
      return patientIdp == idp;
    });

    // Se o paciente foi encontrado e tem a nova estrutura (com cache), usa os dados do cache.
    if (recentPatient && recentPatient.ficha) {
      store.setPatient(recentPatient.ficha, recentPatient.cadsus);
      searchInput.value = '';
      searchResultsList.classList.add('hidden');
      recentPatientsList.classList.add('hidden');
      return;
    }
  }

  // Para pacientes novos ou pacientes recentes com a estrutura antiga (que precisam ser re-buscados).
  if (onSelectPatient) {
    onSelectPatient({ idp, ids });
  }

  searchInput.value = '';
  searchResultsList.classList.add('hidden');
  recentPatientsList.classList.add('hidden');
}

export function init(config) {
  searchInput = document.getElementById('patient-search-input');
  searchResultsList = document.getElementById('search-results');
  recentPatientsList = document.getElementById('recent-patients-list');
  onSelectPatient = config.onSelectPatient;

  store.subscribe(() => {
    if (!recentPatientsList.classList.contains('hidden')) {
      renderRecentPatients();
    }
  });

  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', handleSearchFocus);
  searchInput.addEventListener('blur', handleSearchBlur);
  searchResultsList.addEventListener('click', handleResultClick);
  recentPatientsList.addEventListener('click', handleResultClick);
}
