import { fetchRegulationDetails } from './api.js';
import './browser-polyfill.js';
import { ERROR_CATEGORIES, logError, logInfo, logWarning } from './ErrorHandler.js';
import { KeepAliveManager } from './KeepAliveManager.js';

const api = typeof browser !== 'undefined' ? browser : chrome;

api.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'SAVE_REGULATION_DATA') {
    logInfo(
      'Recebido pedido para salvar dados da regulação',
      {
        payloadType: typeof message.payload,
        hasPayload: !!message.payload,
      },
      ERROR_CATEGORIES.BACKGROUND_SCRIPT
    );

    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        // CORREÇÃO: Usando storage.local em vez de storage.session para maior compatibilidade.
        await api.storage.local.set({ pendingRegulation: regulationDetails });

        logInfo(
          'Detalhes da regulação salvos no storage local com sucesso',
          {
            regulationId: regulationDetails.id || 'unknown',
            hasDetails: !!regulationDetails,
          },
          ERROR_CATEGORIES.BACKGROUND_SCRIPT
        );
      } else {
        logWarning(
          'Não foram encontrados detalhes para a regulação',
          {
            payloadType: typeof message.payload,
          },
          ERROR_CATEGORIES.BACKGROUND_SCRIPT
        );
      }
    } catch (e) {
      logError(
        'Falha ao buscar ou salvar dados da regulação',
        {
          errorMessage: e.message,
          errorType: e.constructor.name,
        },
        ERROR_CATEGORIES.BACKGROUND_SCRIPT
      );
    }
    return true;
  }
});

async function openSidebar(tab) {
  try {
    if (api.sidePanel) {
      await api.sidePanel.open({ windowId: tab.windowId });
      logInfo(
        'Sidebar aberto via sidePanel API',
        { windowId: tab.windowId },
        ERROR_CATEGORIES.BACKGROUND_SCRIPT
      );
    } else if (api.sidebarAction) {
      await api.sidebarAction.toggle();
      logInfo('Sidebar alternado via sidebarAction API', {}, ERROR_CATEGORIES.BACKGROUND_SCRIPT);
    } else {
      logWarning('Nenhuma API de sidebar disponível', {}, ERROR_CATEGORIES.BACKGROUND_SCRIPT);
    }
  } catch (error) {
    logError(
      'Falha ao abrir sidebar',
      {
        errorMessage: error.message,
        tabId: tab.id,
        windowId: tab.windowId,
      },
      ERROR_CATEGORIES.BACKGROUND_SCRIPT
    );
  }
}

api.action.onClicked.addListener(openSidebar);

new KeepAliveManager();

api.runtime.onInstalled.addListener((details) => {
  logInfo(
    'Extensão instalada/atualizada',
    {
      reason: details.reason,
      version: api.runtime.getManifest().version,
    },
    ERROR_CATEGORIES.EXTENSION_LIFECYCLE
  );

  if (api.sidePanel) {
    api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch((e) =>
        logError(
          'Falha ao definir o comportamento do sidePanel',
          { errorMessage: e.message },
          ERROR_CATEGORIES.BACKGROUND_SCRIPT
        )
      );
  }

  api.contextMenus.create({
    id: 'openSidePanel',
    title: 'Alternar Assistente de Regulação',
    contexts: ['all'],
  });

  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
      openSidebar(tab);
    }
  });

  if (details.reason === 'install') {
    logInfo(
      'Primeira instalação detectada, abrindo página de ajuda',
      {},
      ERROR_CATEGORIES.EXTENSION_LIFECYCLE
    );
    api.tabs.create({ url: api.runtime.getURL('help.html') });
  }
});
