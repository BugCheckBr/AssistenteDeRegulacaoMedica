/**
 * @file Content Script para a extensão Assistente de Regulação (v16 - Detecção com Broker).
 * Este script observa a abertura da aba de manutenção e envia os IDs para o background script,
 * que atua como um intermediário para salvar os dados no storage.session.
 */

(function () {
  // Implementação inline das constantes e funções de logging necessárias
  // (sem usar módulos ES6 para compatibilidade com content scripts)

  const ERROR_CATEGORIES = {
    CONTENT_SCRIPT: 'content_script',
    EXTENSION_LIFECYCLE: 'extension_lifecycle',
  };

  // Função de logging simplificada para content script
  function logInfo(message, data, category) {
    const prefix = `[Assistente Médico ${category || ERROR_CATEGORIES.CONTENT_SCRIPT}]`;
    console.info(`${prefix} ${message}`, data || {});
  }

  function logError(message, data, category) {
    const prefix = `[Assistente Médico ${category || ERROR_CATEGORIES.CONTENT_SCRIPT}]`;
    console.error(`${prefix} ${message}`, data || {});
  }

  logInfo(
    'Script de controle v16 (Detecção com Broker) ativo',
    {},
    ERROR_CATEGORIES.CONTENT_SCRIPT
  );

  const api = typeof browser !== 'undefined' ? browser : chrome;
  let lastProcessedReguId = null;

  const checkMaintenanceTab = () => {
    const maintenanceTabPanel = document.getElementById('tabs-manutencao');
    const isActive =
      maintenanceTabPanel && maintenanceTabPanel.getAttribute('aria-expanded') === 'true';

    if (isActive) {
      const idpElement = document.querySelector('#regu\\.reguPK\\.idp');
      const idsElement = document.querySelector('#regu\\.reguPK\\.ids');

      if (idpElement && idsElement && idpElement.value) {
        const reguIdp = idpElement.value;
        const reguIds = idsElement.value;
        const currentReguId = `${reguIdp}-${reguIds}`;

        if (currentReguId !== lastProcessedReguId) {
          lastProcessedReguId = currentReguId;
          const payload = { reguIdp, reguIds };

          logInfo(
            'Dados de regulação detectados na página SIGSS',
            {
              hasPayload: !!payload,
              pageUrl: document.location.pathname,
              payloadKeys: payload ? Object.keys(payload) : [],
            },
            ERROR_CATEGORIES.CONTENT_SCRIPT
          );

          // Envia a mensagem para o background script, que tem acesso ao storage.session
          try {
            api.runtime.sendMessage({ type: 'SAVE_REGULATION_DATA', payload });
            logInfo(
              'Mensagem enviada para background script com sucesso',
              { messageType: 'SAVE_REGULATION_DATA' },
              ERROR_CATEGORIES.CONTENT_SCRIPT
            );
          } catch (e) {
            logError(
              'Falha ao enviar mensagem para background script',
              { errorMessage: e.message },
              ERROR_CATEGORIES.CONTENT_SCRIPT
            );
          }
        }
      }
    } else {
      lastProcessedReguId = null;
    }
  };

  const observer = new MutationObserver(() => {
    clearTimeout(observer.debounceTimeout);
    observer.debounceTimeout = setTimeout(checkMaintenanceTab, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'aria-expanded', 'class'],
  });
})();
