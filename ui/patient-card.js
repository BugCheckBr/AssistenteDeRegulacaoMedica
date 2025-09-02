/**
 * @file Módulo para gerir o card de "Dados do Paciente".
 */
import { store } from '../store.js';
import * as Utils from '../utils.js';
import { extractPhoneMap, formatDisplayNumber, gatherPhoneValues } from './phone-utils.js';

let patientDetailsSection,
  patientMainInfoDiv,
  patientAdditionalInfoDiv,
  toggleDetailsBtn,
  patientCardFooter,
  cadsusTimestamp,
  refreshCadsusBtn;
let fieldConfigLayout = [];
let onForceRefresh; // Callback para forçar a atualização
const options = {
  suffixLength: 8,
  showFullPhones: true,
  debugPhones: false,
  whatsAppMessage: `Boa tarde! Aqui é da Secretaria da Saúde de Farroupilha
Tenho esse telefone como contato para "NOME DO PACIENTE"
Ligar com URGÊNCIA no telefone 2131-5303 - opção 4
Assunto: Agendamento de CONSULTA/EXAME`,
};

/**
 * Renderiza os detalhes do paciente no card.
 * @param {object} patientData - O objeto completo do paciente vindo do store.
 */
function render(patientData) {
  if (!patientDetailsSection || !patientData || !patientData.ficha) {
    hide();
    return;
  }

  const { ficha, cadsus, lastCadsusCheck, isUpdating } = patientData;

  patientMainInfoDiv.innerHTML = '';
  patientAdditionalInfoDiv.innerHTML = '';

  // Extrair nome do paciente para gerar anonimização (mascaramento com asteriscos)
  const patientFullName = Utils.getNestedValue(ficha, 'entidadeFisica.entidade.entiNome') || '';
  const computeMaskedName = (name) => {
    if (!name) return '***';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '***';
    // primeiro nome completo
    const firstName = parts[0];
    if (parts.length === 1) return firstName;
    // para as demais partes, mascarar como 'X***'
    const restMasked = parts.slice(1).map((s) => (s && s[0] ? s[0].toUpperCase() + '***' : '***'));
    return `${firstName} ${restMasked.join(' ')}`;
  };
  const patientMaskedName = computeMaskedName(patientFullName);

  const getLocalValue = (field, data) => {
    if (typeof field.key === 'function') return field.key(data);
    return Utils.getNestedValue(data, field.key);
  };

  const getCadsusValue = (field, data) => {
    if (!data || field.cadsusKey === null) return null;
    // Normalize data: accept either the cell array directly or an object { cell: [...] }
    const cellArray = Array.isArray(data)
      ? data
      : data && Array.isArray(data.cell)
        ? data.cell
        : null;
    if (typeof field.cadsusKey === 'function') return field.cadsusKey(cellArray || data);
    // If cadsusKey is a number/index, read from cell array when present
    if (typeof field.cadsusKey === 'number') {
      return cellArray ? cellArray[field.cadsusKey] : data[field.cadsusKey];
    }
    // fallback: return property if defined
    return data[field.cadsusKey];
  };

  /**
   * Extrai um conjunto normalizado de telefones a partir de uma string.
   * Normalização aplicada:
   * - encontra sequências de dígitos (comprimento >= 6)
   * - remove código de país repetido (55) no início
   * - remove zeros à esquerda
   * - usa os últimos 8 dígitos como chave (sufixo) para comparação independente da ordem/DDD
   * Retorna um Set de sufixos (strings).
   */
  /**
   * Varre um objeto (limitando profundidade) em busca de valores de telefone
   * com base em chaves que contenham padrões comuns (tel, fone, telefone, cel, whats, contato).
   * Retorna array de strings encontradas.
   */
  // use gatherPhoneValues and extractPhoneMap from ui/phone-utils.js

  // Conjuntos globais de telefones combinados (ficha + cadsus)
  const fichaPhoneValues = gatherPhoneValues(ficha);
  const cadsusPhoneValues = gatherPhoneValues(cadsus);
  const fichaPhoneMapGlobal = extractPhoneMap(fichaPhoneValues, options.suffixLength);
  const cadsusPhoneMapGlobal = extractPhoneMap(cadsusPhoneValues, options.suffixLength);

  // NOTE: mergePhoneMaps removed by request. We'll prefer the local map when
  // available and fall back to the global map. This keeps comportamento
  // previsível e evita mesclagem automática de variantes.

  const sortedFields = [...fieldConfigLayout].sort((a, b) => a.order - b.order);

  // Calcular idade a partir da data de nascimento (campo dtNasc no defaultFieldConfig)
  // Não logar nem expor a data crua, apenas a idade em anos.
  const rawDtNasc = Utils.getNestedValue(ficha, 'entidadeFisica.entfDtNasc');
  const age = Utils.calculateAge(rawDtNasc);
  const rawGender = Utils.extractGenderFromFicha(ficha);
  const genderSymbol = rawGender ? Utils.getGenderSymbol(rawGender) : '';
  const genderLabel = rawGender ? Utils.getGenderLabel(rawGender) : '';
  const genderBadgeClass = rawGender
    ? Utils.getGenderBadgeClass(rawGender)
    : 'bg-gray-100 text-gray-800';

  // Inserir uma linha destacada no topo somente com o Nome
  try {
    const nome = Utils.getNestedValue(ficha, 'entidadeFisica.entidade.entiNome') || '-';
    patientMainInfoDiv.innerHTML += `<div class="py-2 border-b border-slate-100"><div class="font-semibold text-lg text-slate-800">${nome}</div></div>`;

    // Adiciona itens separados: Nascimento (data formatada + idade) e Gênero (badge)
    const formattedDob = Utils.formatDate(rawDtNasc);
    const dobDisplay = formattedDob
      ? `${formattedDob}${age !== null ? ' • ' + age + ' anos' : ''}`
      : age !== null
        ? `${age} anos`
        : '-';
    const dobRow = `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-600">Nascimento:</span><span class="text-slate-900 text-right">${dobDisplay}</span></div>`;

    const genderBadge = rawGender
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${genderBadgeClass}">${genderSymbol} ${genderLabel}</span>`
      : '<span class="text-slate-500">-</span>';
    const genderRow = `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-600">Gênero:</span><span class="text-right">${genderBadge}</span></div>`;

    patientMainInfoDiv.innerHTML += dobRow + genderRow;
  } catch {
    // noop - não podemos logar dados sensíveis
  }

  // Evitar duplicar o campo de nascimento (dtNasc) — já renderizado acima.
  const skipFieldIds = new Set(['dtNasc']);

  sortedFields.forEach((field) => {
    if (skipFieldIds.has(field.id)) return;
    if (!field.enabled) return;

    let localValue = getLocalValue(field, ficha);
    if (field.formatter) localValue = field.formatter(localValue);

    let cadsusValue = getCadsusValue(field, cadsus);
    if (field.formatter) cadsusValue = field.formatter(cadsusValue);

    const v1 = String(localValue || '').trim();
    const v2 = String(cadsusValue || '').trim();
    let icon = '';

    if (cadsus && field.cadsusKey !== null) {
      let compareV1 = v1;
      let compareV2 = v2;

      if (field.id === 'telefone') {
        // Extrai mapa de sufixo->números para exibição e conjuntos de sufixos para comparação
        let map1 = extractPhoneMap(v1, options.suffixLength);
        let map2 = extractPhoneMap(v2, options.suffixLength);

        // fallback para mapas globais (varredura completa da ficha/cadsus)
        if ((!map1 || map1.size === 0) && fichaPhoneMapGlobal && fichaPhoneMapGlobal.size > 0) {
          map1 = fichaPhoneMapGlobal;
        }
        if ((!map2 || map2.size === 0) && cadsusPhoneMapGlobal && cadsusPhoneMapGlobal.size > 0) {
          map2 = cadsusPhoneMapGlobal;
        }

        const set1 = new Set(map1 ? map1.keys() : []);
        const set2 = new Set(map2 ? map2.keys() : []);

        // Interseção: se houver ao menos um sufixo em comum consideramos que confere
        const hasCommon = [...set1].some((s) => set2.has(s));

        if (hasCommon && set1.size > 0 && set2.size > 0) {
          icon = '<span class="comparison-icon" title="Dado confere com o CADSUS">✅</span>';
        } else {
          const tooltipText = `Ficha: ${v1 || 'Vazio'}\nCADSUS: ${v2 || 'Vazio'}`;
          icon = `<span class="comparison-icon" data-tooltip="${tooltipText}">⚠️</span>`;
        }
      } else {
        compareV1 = Utils.normalizeString(v1);
        compareV2 = Utils.normalizeString(v2);

        if (compareV1 && compareV1 === compareV2) {
          icon = '<span class="comparison-icon" title="Dado confere com o CADSUS">✅</span>';
        } else {
          const tooltipText = `Ficha: ${v1 || 'Vazio'}\nCADSUS: ${v2 || 'Vazio'}`;
          icon = `<span class="comparison-icon" data-tooltip="${tooltipText}">⚠️</span>`;
        }
      }
    }

    let extraHtml = '';

    const valueClass =
      field.id.toLowerCase().includes('alerg') && v1 && v1 !== '-'
        ? 'text-red-600 font-bold'
        : 'text-slate-900';

    // displayValue: por padrão mostra v1, mas para telefone mostramos a união de todos os números
    let displayValue = v1 || '-';
    let copyIcon = '';
    if (field.id === 'telefone') {
      // mapas locais a partir do campo ficha (v1) e CADSUS (v2)
      const localMapField = extractPhoneMap(v1, options.suffixLength);
      const cadsusMapField = extractPhoneMap(v2, options.suffixLength);

      // para exibição sempre mesclar o mapa do campo com o mapa global correspondente
      // Preferir o mapa extraído do próprio campo (localMapField). Se vazio,
      // cair para o mapa global (varredura completa da ficha).
      const localMap =
        localMapField && localMapField.size > 0 ? localMapField : fichaPhoneMapGlobal;
      const cadsusMap =
        cadsusMapField && cadsusMapField.size > 0 ? cadsusMapField : cadsusPhoneMapGlobal;

      // Não renderizar inline a união de telefones aqui para evitar duplicação.
      // As listas serão exibidas separadamente nas seções CADSUS e MV abaixo.
      displayValue = '';
      copyIcon = '';
      // debug opcional: imprime mapas para inspeção no DevTools
      const mapToPlain = (m) => {
        const o = {};
        for (const [k, set] of m.entries()) o[k] = Array.from(set.values());
        return o;
      };
      if (options.debugPhones && typeof console !== 'undefined' && console.debug) {
        try {
          console.debug('[patient-card] phone-debug', {
            fichaPhoneValues,
            cadsusPhoneValues,
            localMap: localMap ? mapToPlain(localMap) : null,
            cadsusMap: cadsusMap ? mapToPlain(cadsusMap) : null,
          });
        } catch (e) {
          console.debug('[patient-card] phone-debug failed to serialize', e);
        }
      }
    } else {
      copyIcon = v1
        ? `<span class="copy-icon" title="Copiar" data-copy-text="${v1}">📄</span>`
        : '';
    }
    // Se for telefone, monta uma visualização dos conjuntos extraídos (mascarando para privacidade)
    if (field.id === 'telefone') {
      // extrai mapas para renderização
      // map2Field: números extraídos do campo CADSUS (v2)
      const map2Field = extractPhoneMap(v2, options.suffixLength);
      // mapGlobal: números extraídos do cadastro completo do MV (varredura completa)
      const map1Global = fichaPhoneMapGlobal;

      // usa formatDisplayNumber importada de phone-utils.js

      // Construir HTML mostrando:
      // - Conjunto (Campo Ficha): números extraídos apenas do campo exibido
      // - Cadastro MV: números extraídos pela varredura completa da ficha
      // - Conjunto (CADSUS): números extraídos apenas do campo CADSUS
      // Deduplicação entre seções: prioridade Campo -> CADSUS -> Cadastro(MV)
      // Agrupa números por sufixo (últimos options.suffixLength dígitos) e escolhe
      // a variante preferida para exibição. Preferimos a variante mais longa
      // (ex: com DDI+DDD) quando há múltiplas representações do mesmo sufixo.
      const canonicalFromMap = (map) => {
        if (!map || map.size === 0) return [];
        const suffixMap = new Map(); // suffix -> bestCanonical
        const seenOrder = [];

        for (const nums of map.values()) {
          for (const n of nums) {
            const s = String(n).replace(/\D/g, '');
            if (!s) continue;
            const canon = s.startsWith('55') ? s : '55' + s;
            const suffix = canon.slice(-options.suffixLength);

            if (!suffixMap.has(suffix)) {
              suffixMap.set(suffix, canon);
              seenOrder.push(suffix);
            } else {
              const current = suffixMap.get(suffix);
              // preferir variante com mais dígitos (ex: com DDI+DDD)
              if (canon.length > current.length) {
                suffixMap.set(suffix, canon);
              }
            }
          }
        }

        return seenOrder.map((suf) => suffixMap.get(suf));
      };

      // Para simplificar, exibir apenas duas listas formatadas (uma por linha):
      // - Formato CADSUS (formatDisplayNumber por item)
      // - Formato MV (formatDisplayNumber por item)
      const cadsusCanonical = canonicalFromMap(map2Field);
      const mvCanonical = canonicalFromMap(map1Global);

      const renderPlainList = (list) => {
        if (!list || list.length === 0) return '<div class="text-xs text-slate-500">(vazio)</div>';
        const makeTelHref = (canon) => 'tel:+' + String(canon).replace(/\D/g, '');
        return (
          '<div class="phone-list text-sm">' +
          list
            .map((n) => {
              const href = makeTelHref(n);
              const display = formatDisplayNumber(n);
              const copyVal = '+' + String(n).replace(/\D/g, '');
              // adicionar botão de WhatsApp que reutiliza aba se possível
              const waData = '+' + String(n).replace(/\D/g, '');
              // incluir mensagem padrão como atributo data-wa-msg (anonimizando o nome do paciente)
              const waMsgTemplate = options.whatsAppMessage || '';
              // calcular saudação baseada no período do dia local
              const computeGreeting = () => {
                const h = new Date().getHours();
                // 05:00-11:59 => Bom dia
                if (h >= 5 && h < 12) return 'Bom dia!';
                // 12:00-17:59 => Boa tarde
                if (h >= 12 && h < 18) return 'Boa tarde!';
                // 18:00-04:59 => Boa noite
                return 'Boa noite!';
              };
              // substituir saudação inicial do template (se houver) pelo valor calculado
              const waMsgWithGreeting = waMsgTemplate.replace(
                /^\s*(Bom[oa]\s+(dia|tarde|noite)!?\s*)/i,
                computeGreeting() + ' '
              );
              const waMsgRaw = waMsgWithGreeting.replace(/NOME DO PACIENTE/g, patientMaskedName);
              const waMsg = waMsgRaw.replace(/"/g, '&quot;');
              return `<div class="phone-item"><a class="phone-link" href="${href}">${display}</a> <button type="button" class="phone-copy-btn" data-copy="${copyVal}" title="Copiar">📋</button> <button type="button" class="phone-wa-btn" data-wa="${waData}" data-wa-msg="${waMsg}" title="Abrir WhatsApp">💬</button></div>`;
            })
            .join('') +
          '</div>'
        );
      };

      const cadsusSection = `<div><strong class="text-slate-600">CADSUS :</strong>${renderPlainList(cadsusCanonical)}</div>`;
      const mvSection = `<div class="mt-1"><strong class="text-slate-600">SIGSS MV :</strong>${renderPlainList(mvCanonical)}</div>`;

      extraHtml = `\n        <div class="mt-1 text-xs text-slate-500">\n          ${cadsusSection}\n          ${mvSection}\n        </div>`;
    }

    const rowHtml = `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-600">${
      field.label
    }:</span><span class="${valueClass} text-right flex items-center">${
      displayValue
    }${icon}${copyIcon}</span></div>`;

    // Montagem final simplificada: concatenar rowHtml com extraHtml UMA vez
    const finalRowHtml = rowHtml + extraHtml;

    if (field.section === 'main') {
      patientMainInfoDiv.innerHTML += finalRowHtml;
    } else {
      patientAdditionalInfoDiv.innerHTML += finalRowHtml;
    }
  });

  if (lastCadsusCheck) {
    cadsusTimestamp.textContent = `CADSUS verificado em: ${lastCadsusCheck.toLocaleString()}`;
    patientCardFooter.style.display = 'flex';
  } else {
    cadsusTimestamp.textContent = 'Não foi possível verificar dados do CADSUS.';
    patientCardFooter.style.display = 'flex';
  }

  refreshCadsusBtn.querySelector('.refresh-icon').classList.toggle('spinning', isUpdating);
  refreshCadsusBtn.disabled = isUpdating;

  toggleDetailsBtn.style.display = sortedFields.some((f) => f.enabled && f.section === 'more')
    ? 'block'
    : 'none';
  patientDetailsSection.style.display = 'block';
}

function hide() {
  if (patientDetailsSection) patientDetailsSection.style.display = 'none';
}

// Abre/reencontra uma aba do WhatsApp Web para conversar com o número informado.
// Tenta usar a API de abas do navegador (browser/ chrome) quando disponível e
// com permissão; caso contrário, abre uma nova aba com o link padrão.
async function openWhatsAppWebForNumber(canonicalNumber, message = '') {
  if (!canonicalNumber) return;
  // sanitizar: apenas dígitos
  const phone = String(canonicalNumber).replace(/\D/g, '');
  if (!phone) return;
  const encodedMsg = message ? encodeURIComponent(String(message)) : '';
  const waUrl = encodedMsg
    ? `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`
    : `https://web.whatsapp.com/send?phone=${phone}`;

  // preferir webextension polyfill (browser) quando disponível
  const api =
    typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome : null;

  // Se possível, procurar por uma aba existente do WhatsApp Web e reaproveitá-la.
  if (api && api.tabs && typeof api.tabs.query === 'function') {
    try {
      const tabs = await api.tabs.query({ url: '*://web.whatsapp.com/*' });
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        // focar janela/aba (se possível) e tentar navegar para o link de chat
        try {
          if (api.windows && typeof api.windows.update === 'function' && tab.windowId != null) {
            await api.windows.update(tab.windowId, { focused: true });
          }
        } catch {
          // ignore
        }

        try {
          await api.tabs.update(tab.id, { active: true, url: waUrl });
          return;
        } catch {
          // se não for possível atualizar a URL, ativar a aba e abrir em nova aba como fallback
          try {
            await api.tabs.update(tab.id, { active: true });
            window.open(waUrl, '_blank');
            return;
          } catch {
            window.open(waUrl, '_blank');
            return;
          }
        }
      }
    } catch {
      // possível falta de permissão ou API não suportada; cair para fallback
    }
  }

  // Fallback simples: abrir nova aba/janela
  try {
    window.open(waUrl, '_blank');
  } catch {
    // última alternativa: navegar na janela atual
    window.location.href = waUrl;
  }
}

function handleToggleDetails() {
  patientAdditionalInfoDiv.classList.toggle('show');
  toggleDetailsBtn.textContent = patientAdditionalInfoDiv.classList.contains('show')
    ? 'Mostrar menos'
    : 'Mostrar mais';
}

function handleForceRefresh() {
  const patient = store.getPatient();
  if (patient && patient.ficha && onForceRefresh) {
    onForceRefresh({ idp: patient.ficha.isenPK.idp, ids: patient.ficha.isenPK.ids }, true);
  }
}

function onStateChange() {
  const patient = store.getPatient();
  if (patient) {
    render(patient);
  } else {
    hide();
  }
}

/**
 * Inicializa o módulo do card de paciente.
 * @param {Array<object>} config - A configuração dos campos da ficha.
 * @param {object} callbacks - Funções de callback.
 * @param {Function} callbacks.onForceRefresh - Função para forçar a atualização.
 */
export function init(config, callbacks) {
  patientDetailsSection = document.getElementById('patient-details-section');
  patientMainInfoDiv = document.getElementById('patient-main-info');
  patientAdditionalInfoDiv = document.getElementById('patient-additional-info');
  toggleDetailsBtn = document.getElementById('toggle-details-btn');
  patientCardFooter = document.getElementById('patient-card-footer');
  cadsusTimestamp = document.getElementById('cadsus-timestamp');
  refreshCadsusBtn = document.getElementById('refresh-cadsus-btn');

  // Garantir que não haja campos duplicados por 'id' (pode ocorrer se o config
  // vindo do armazenamento contiver entradas repetidas). Preservar a ordem.
  const seenIds = new Set();
  fieldConfigLayout = config.filter((f) => {
    if (!f || !f.id) return false;
    if (seenIds.has(f.id)) return false;
    seenIds.add(f.id);
    return true;
  });
  onForceRefresh = callbacks.onForceRefresh;
  // permitir sobrescrever opções via callbacks.options
  if (callbacks && callbacks.options) {
    if (typeof callbacks.options.suffixLength === 'number')
      options.suffixLength = callbacks.options.suffixLength;
    if (typeof callbacks.options.showFullPhones === 'boolean')
      options.showFullPhones = callbacks.options.showFullPhones;
    if (typeof callbacks.options.debugPhones === 'boolean')
      options.debugPhones = callbacks.options.debugPhones;
    if (typeof callbacks.options.whatsAppMessage === 'string')
      options.whatsAppMessage = callbacks.options.whatsAppMessage;
  }

  toggleDetailsBtn.addEventListener('click', handleToggleDetails);
  refreshCadsusBtn.addEventListener('click', handleForceRefresh);
  // delegação para lidar com botoes de copiar telefones
  document.addEventListener('click', (ev) => {
    let btn = null;
    // ev.target pode ser um TextNode; garantir que é Element antes de chamar closest
    if (ev.target instanceof Element) {
      btn = ev.target.closest('.phone-copy-btn');
    } else if (ev.target && ev.target.parentElement) {
      btn = ev.target.parentElement.closest('.phone-copy-btn');
    }
    if (!btn) return;
    const toCopy = btn.getAttribute('data-copy');
    if (!toCopy) return;
    try {
      navigator.clipboard.writeText(toCopy);
      btn.textContent = '✔️';
      setTimeout(() => (btn.textContent = '📋'), 1200);
    } catch {
      // fallback: criar elemento temporário
      const ta = document.createElement('textarea');
      ta.value = toCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  });

  // delegação para abrir links tel: em resposta a um clique do usuário
  // Alguns ambientes de extensão bloqueiam o lançamento de protocolos externos
  // quando não é detectado um gesto direto; ao interceptar o clique e
  // chamar window.open a partir do handler de evento do usuário, geralmente
  // contornamos esse bloqueio.
  document.addEventListener('click', (ev) => {
    if (!(ev.target instanceof Element)) return;
    const link = ev.target.closest('.phone-link');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    try {
      // abrir em nova janela para acionar o handler do sistema
      window.open(href);
    } catch {
      // fallback para navegação direta
      window.location.href = href;
    }
    ev.preventDefault();
  });

  // delegação para botão WhatsApp
  document.addEventListener('click', (ev) => {
    if (!(ev.target instanceof Element)) return;
    const waBtn = ev.target.closest('.phone-wa-btn');
    if (!waBtn) return;
    const wa = waBtn.getAttribute('data-wa');
    if (!wa) return;
    const waMsg = waBtn.getAttribute('data-wa-msg') || options.whatsAppMessage || '';
    // chamar a função local para abrir/reusar aba do WhatsApp Web com mensagem
    try {
      openWhatsAppWebForNumber(wa, waMsg);
    } catch {
      // ignore
    }
    ev.preventDefault();
  });

  store.subscribe(onStateChange);
}
