import { fetchRegulationDetails } from './api.js';
import './browser-polyfill.js';
import { ERROR_CATEGORIES, logError, logInfo, logWarning } from './ErrorHandler.js';
import { KeepAliveManager } from './KeepAliveManager.js';

const api = typeof browser !== 'undefined' ? browser : chrome;

/**
 * 🛡️ TASK-C-003: Background Script Message Handler - Implementação Completa
 * Gerenciador de configuração de URL base para validação de origem SIGSS.
 * Handles installation scenarios and URL changes dynamically.
 */
class URLConfigurationManager {
  constructor() {
    this.baseUrl = null;
    this.validDomains = new Set();
    this.configCheckInterval = null;
    this.isWaitingForConfig = false;
    this.initializeConfiguration();
  }

  /**
   * Inicializa a configuração de URL base.
   */
  async initializeConfiguration() {
    try {
      await this.loadBaseUrl();

      if (!this.baseUrl) {
        logWarning(
          'URL base não configurada na inicialização - aguardando configuração',
          {},
          ERROR_CATEGORIES.SECURITY_VALIDATION
        );
        this.startConfigMonitoring();
      } else {
        this.updateValidDomains();
        logInfo(
          'URL Configuration Manager inicializado com sucesso',
          {
            baseUrl: this.sanitizeUrl(this.baseUrl),
            validDomainsCount: this.validDomains.size,
          },
          ERROR_CATEGORIES.SECURITY_VALIDATION
        );
      }
    } catch (error) {
      logError(
        'Falha na inicialização do URL Configuration Manager',
        { errorMessage: error.message },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      this.startConfigMonitoring();
    }
  }

  /**
   * Carrega URL base do storage.
   */
  async loadBaseUrl() {
    try {
      const data = await api.storage.sync.get('baseUrl');
      this.baseUrl = data?.baseUrl || null;
    } catch (error) {
      logError(
        'Erro ao carregar URL base do storage',
        { errorMessage: error.message },
        ERROR_CATEGORIES.STORAGE
      );
      throw error;
    }
  }

  /**
   * Atualiza lista de domínios válidos baseado na URL base.
   */
  updateValidDomains() {
    this.validDomains.clear();

    if (!this.baseUrl) return;

    try {
      const url = new URL(this.baseUrl);
      const domain = url.hostname;

      // Adiciona domínio principal
      this.validDomains.add(domain);

      // Adiciona variações comuns para ambientes SIGSS
      const baseDomain = domain.replace(/^(www\.|sigss\.|sistema\.)/, '');
      this.validDomains.add(`sigss.${baseDomain}`);
      this.validDomains.add(`sistema.${baseDomain}`);
      this.validDomains.add(`www.${baseDomain}`);
      this.validDomains.add(baseDomain);

      logInfo(
        'Domínios válidos atualizados',
        {
          baseUrl: this.sanitizeUrl(this.baseUrl),
          validDomainsCount: this.validDomains.size,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
    } catch (error) {
      logError(
        'Falha ao processar URL base para domínios válidos',
        {
          baseUrl: this.sanitizeUrl(this.baseUrl),
          errorMessage: error.message,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
    }
  }

  /**
   * Inicia monitoramento periódico para aguardar configuração.
   */
  startConfigMonitoring() {
    if (this.configCheckInterval) return;

    this.isWaitingForConfig = true;

    this.configCheckInterval = setInterval(async () => {
      try {
        await this.loadBaseUrl();

        if (this.baseUrl) {
          this.updateValidDomains();
          this.stopConfigMonitoring();

          logInfo(
            'URL base detectada após aguardar configuração',
            {
              baseUrl: this.sanitizeUrl(this.baseUrl),
              validDomainsCount: this.validDomains.size,
            },
            ERROR_CATEGORIES.SECURITY_VALIDATION
          );

          // Processar mensagens em fila, se houver
          messageQueue.processQueuedMessages();
        }
      } catch (error) {
        logError(
          'Erro durante verificação periódica de configuração',
          { errorMessage: error.message },
          ERROR_CATEGORIES.STORAGE
        );
      }
    }, 5000); // Verifica a cada 5 segundos
  }

  /**
   * Para monitoramento de configuração.
   */
  stopConfigMonitoring() {
    if (this.configCheckInterval) {
      clearInterval(this.configCheckInterval);
      this.configCheckInterval = null;
      this.isWaitingForConfig = false;
    }
  }

  /**
   * Valida se uma URL pertence a um domínio SIGSS válido.
   */
  isValidSIGSSDomain(url) {
    if (!url || this.validDomains.size === 0) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Verifica domínio exato
      if (this.validDomains.has(hostname)) {
        return true;
      }

      // Verifica subdomínios
      for (const validDomain of this.validDomains) {
        if (hostname.endsWith(`.${validDomain}`)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logWarning(
        'URL inválida detectada durante validação',
        {
          url: this.sanitizeUrl(url),
          errorMessage: error.message,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      return false;
    }
  }

  /**
   * Verifica se a extensão está aguardando configuração.
   */
  isAwaitingConfiguration() {
    return this.isWaitingForConfig;
  }

  /**
   * Força reload da configuração (para mudanças de URL).
   */
  async reloadConfiguration() {
    const oldBaseUrl = this.baseUrl;
    await this.loadBaseUrl();

    if (oldBaseUrl !== this.baseUrl) {
      this.updateValidDomains();

      logInfo(
        'Configuração de URL atualizada',
        {
          oldUrl: this.sanitizeUrl(oldBaseUrl),
          newUrl: this.sanitizeUrl(this.baseUrl),
          validDomainsCount: this.validDomains.size,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
    }
  }

  /**
   * Sanitiza URL para logging seguro.
   */
  sanitizeUrl(url) {
    if (!url) return 'null';
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return '[URL_MALFORMED]';
    }
  }

  /**
   * Cleanup resources.
   */
  destroy() {
    this.stopConfigMonitoring();
    this.validDomains.clear();
    this.baseUrl = null;
  }
}

/**
 * Rate Limiter para controlar frequência de mensagens por tab.
 * Prevents spam and potential DoS attacks.
 */
class MessageRateLimiter {
  constructor(maxMessages = 5, windowMs = 1000) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.tabCounts = new Map(); // tabId -> { count, lastReset }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup a cada minuto
  }

  /**
   * Verifica se uma tab pode enviar mensagem (rate limiting).
   */
  canSendMessage(tabId) {
    if (!tabId) return true; // Permite mensagens sem tabId (edge cases)

    const now = Date.now();
    const tabData = this.tabCounts.get(tabId) || { count: 0, lastReset: now };

    // Reset counter se janela de tempo passou
    if (now - tabData.lastReset >= this.windowMs) {
      tabData.count = 0;
      tabData.lastReset = now;
    }

    // Verifica limite
    if (tabData.count >= this.maxMessages) {
      logWarning(
        'Rate limit excedido para tab',
        {
          tabId,
          currentCount: tabData.count,
          maxMessages: this.maxMessages,
          windowMs: this.windowMs,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      return false;
    }

    // Incrementa contador
    tabData.count++;
    this.tabCounts.set(tabId, tabData);
    return true;
  }

  /**
   * Remove entradas antigas para evitar memory leak.
   */
  cleanup() {
    const now = Date.now();
    const entriesToDelete = [];

    for (const [tabId, tabData] of this.tabCounts.entries()) {
      if (now - tabData.lastReset >= this.windowMs * 5) {
        // Remove após 5 janelas
        entriesToDelete.push(tabId);
      }
    }

    entriesToDelete.forEach((tabId) => this.tabCounts.delete(tabId));

    if (entriesToDelete.length > 0) {
      logInfo(
        'Rate limiter cleanup executado',
        { removedTabs: entriesToDelete.length },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
    }
  }

  /**
   * Cleanup resources.
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.tabCounts.clear();
  }
}

/**
 * Validator para estrutura de payloads de mensagens.
 * Ensures message integrity for medical regulation data.
 */
class PayloadValidator {
  /**
   * Valida estrutura do payload para SAVE_REGULATION_DATA.
   */
  static validateRegulationPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return {
        valid: false,
        error: 'Payload deve ser um objeto',
      };
    }

    // Campos obrigatórios para dados de regulação
    const requiredFields = ['reguIdp', 'reguIds'];
    const missingFields = requiredFields.filter((field) => !payload[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
      };
    }

    // Validação de tipos
    if (typeof payload.reguIdp !== 'string' || typeof payload.reguIds !== 'string') {
      return {
        valid: false,
        error: 'reguIdp e reguIds devem ser strings',
      };
    }

    // Validação de formato (IDs devem ser numéricos)
    if (!/^\d+$/.test(payload.reguIdp) || !/^\d+$/.test(payload.reguIds)) {
      return {
        valid: false,
        error: 'IDs de regulação devem conter apenas dígitos',
      };
    }

    // Validação de tamanho (IDs muito longos são suspeitos)
    if (payload.reguIdp.length > 20 || payload.reguIds.length > 20) {
      return {
        valid: false,
        error: 'IDs de regulação excedem tamanho máximo permitido',
      };
    }

    return { valid: true };
  }

  /**
   * Valida estrutura geral de mensagem.
   */
  static validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return {
        valid: false,
        error: 'Mensagem deve ser um objeto',
      };
    }

    if (!message.type || typeof message.type !== 'string') {
      return {
        valid: false,
        error: 'Tipo de mensagem obrigatório',
      };
    }

    // Lista de tipos de mensagem permitidos
    const allowedTypes = ['SAVE_REGULATION_DATA'];
    if (!allowedTypes.includes(message.type)) {
      return {
        valid: false,
        error: `Tipo de mensagem não permitido: ${message.type}`,
      };
    }

    return { valid: true };
  }
}

/**
 * Fila de mensagens para aguardar configuração inicial.
 * Handles messages received before URL configuration is complete.
 */
class MessageQueue {
  constructor(maxQueueSize = 10) {
    this.queue = [];
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Adiciona mensagem à fila.
   */
  enqueue(message, sender, sendResponse) {
    if (this.queue.length >= this.maxQueueSize) {
      logWarning(
        'Fila de mensagens cheia - descartando mensagem mais antiga',
        {
          queueSize: this.queue.length,
          maxSize: this.maxQueueSize,
          messageType: message.type,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      this.queue.shift(); // Remove mensagem mais antiga
    }

    this.queue.push({
      message,
      sender,
      sendResponse,
      timestamp: Date.now(),
    });

    logInfo(
      'Mensagem adicionada à fila aguardando configuração',
      {
        messageType: message.type,
        queueSize: this.queue.length,
        senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
      },
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );
  }

  /**
   * Processa todas as mensagens em fila.
   */
  async processQueuedMessages() {
    if (this.queue.length === 0) return;

    logInfo(
      'Processando mensagens em fila após configuração',
      { queueSize: this.queue.length },
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );

    const messagesToProcess = [...this.queue];
    this.queue = [];

    for (const queuedMessage of messagesToProcess) {
      try {
        await processValidatedMessage(queuedMessage.message, queuedMessage.sender);
      } catch (error) {
        logError(
          'Erro ao processar mensagem da fila',
          {
            messageType: queuedMessage.message.type,
            errorMessage: error.message,
          },
          ERROR_CATEGORIES.SECURITY_VALIDATION
        );
      }
    }
  }

  /**
   * Limpa fila (útil para reset).
   */
  clear() {
    const clearedCount = this.queue.length;
    this.queue = [];

    if (clearedCount > 0) {
      logInfo(
        'Fila de mensagens limpa',
        { clearedMessages: clearedCount },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
    }
  }
}

/**
 * Valida origem de mensagens contra domínios SIGSS configurados.
 */
function validateMessageOrigin(sender) {
  // 1. Verificação básica de sender
  if (!sender || !sender.tab) {
    logWarning(
      'Mensagem recebida sem informações de sender/tab',
      {},
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );
    return {
      valid: false,
      reason: 'Sender ou tab information ausente',
    };
  }

  // 2. Verificação de URL da tab
  const tabUrl = sender.tab.url;
  if (!tabUrl) {
    logWarning(
      'Mensagem recebida de tab sem URL',
      { tabId: sender.tab.id },
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );
    return {
      valid: false,
      reason: 'Tab URL ausente',
    };
  }

  // 3. Verificação contra domínios SIGSS válidos
  if (!urlConfigManager.isValidSIGSSDomain(tabUrl)) {
    logWarning(
      'Mensagem rejeitada - origem não é domínio SIGSS válido',
      {
        tabUrl: urlConfigManager.sanitizeUrl(tabUrl),
        tabId: sender.tab.id,
        validDomainsCount: urlConfigManager.validDomains.size,
      },
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );
    return {
      valid: false,
      reason: 'Origem não é domínio SIGSS válido',
    };
  }

  // 4. Verificação de path SIGSS específico
  if (!tabUrl.includes('/sigss/')) {
    logWarning(
      'Mensagem rejeitada - URL não contém path SIGSS',
      {
        tabUrl: urlConfigManager.sanitizeUrl(tabUrl),
        tabId: sender.tab.id,
      },
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );
    return {
      valid: false,
      reason: 'URL não contém path SIGSS válido',
    };
  }

  return { valid: true };
}

/**
 * Processa mensagem validada (após todas as verificações).
 */
async function processValidatedMessage(message, sender) {
  if (message.type === 'SAVE_REGULATION_DATA') {
    logInfo(
      'Processando dados de regulação validados',
      {
        payloadType: typeof message.payload,
        hasPayload: !!message.payload,
        senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
        tabId: sender.tab?.id,
      },
      ERROR_CATEGORIES.BACKGROUND_SCRIPT
    );

    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        await api.storage.local.set({ pendingRegulation: regulationDetails });

        logInfo(
          'Detalhes da regulação salvos no storage local com sucesso',
          {
            regulationId: regulationDetails.id || 'unknown',
            hasDetails: !!regulationDetails,
            tabId: sender.tab?.id,
          },
          ERROR_CATEGORIES.BACKGROUND_SCRIPT
        );
      } else {
        logWarning(
          'Não foram encontrados detalhes para a regulação',
          {
            payloadType: typeof message.payload,
            tabId: sender.tab?.id,
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
          tabId: sender.tab?.id,
        },
        ERROR_CATEGORIES.BACKGROUND_SCRIPT
      );
    }
  }
}

// === INICIALIZAÇÃO DOS COMPONENTES ===

// Instâncias globais
const urlConfigManager = new URLConfigurationManager();
const rateLimiter = new MessageRateLimiter(5, 1000); // 5 mensagens por segundo
const messageQueue = new MessageQueue(10); // Máximo 10 mensagens em fila

/**
 * MESSAGE HANDLER PRINCIPAL COM VALIDAÇÃO COMPLETA
 */
api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    // 1. VALIDAÇÃO DE ESTRUTURA DA MENSAGEM
    const messageValidation = PayloadValidator.validateMessage(message);
    if (!messageValidation.valid) {
      logWarning(
        'Mensagem rejeitada - estrutura inválida',
        {
          error: messageValidation.error,
          messageType: message.type,
          senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      return false;
    }

    // 2. VERIFICAÇÃO DE CONFIGURAÇÃO
    if (urlConfigManager.isAwaitingConfiguration()) {
      logInfo(
        'URL base não configurada - adicionando mensagem à fila',
        {
          messageType: message.type,
          senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );

      messageQueue.enqueue(message, sender, sendResponse);
      return true; // Mantém canal aberto para resposta futura
    }

    // 3. VALIDAÇÃO DE ORIGEM
    const originValidation = validateMessageOrigin(sender);
    if (!originValidation.valid) {
      logWarning(
        'Mensagem rejeitada por validação de origem',
        {
          reason: originValidation.reason,
          messageType: message.type,
          senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
          tabId: sender.tab?.id,
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      return false;
    }

    // 4. RATE LIMITING
    if (!rateLimiter.canSendMessage(sender.tab?.id)) {
      logWarning(
        'Mensagem rejeitada por rate limiting',
        {
          messageType: message.type,
          tabId: sender.tab?.id,
          senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
        },
        ERROR_CATEGORIES.SECURITY_VALIDATION
      );
      return false;
    }

    // 5. VALIDAÇÃO DE PAYLOAD ESPECÍFICO
    if (message.type === 'SAVE_REGULATION_DATA') {
      const payloadValidation = PayloadValidator.validateRegulationPayload(message.payload);
      if (!payloadValidation.valid) {
        logWarning(
          'Payload de regulação inválido',
          {
            error: payloadValidation.error,
            tabId: sender.tab?.id,
            senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
          },
          ERROR_CATEGORIES.SECURITY_VALIDATION
        );
        return false;
      }
    }

    // 6. PROCESSAMENTO DA MENSAGEM VALIDADA
    await processValidatedMessage(message, sender);
    return true;
  } catch (error) {
    logError(
      'Erro crítico no message handler',
      {
        errorMessage: error.message,
        messageType: message.type,
        tabId: sender.tab?.id,
        senderUrl: urlConfigManager.sanitizeUrl(sender.tab?.url),
      },
      ERROR_CATEGORIES.BACKGROUND_SCRIPT
    );
    return false;
  }
});

/**
 * Monitora mudanças na configuração de URL base.
 */
api.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.baseUrl) {
    logInfo(
      'Mudança na URL base detectada',
      {
        hasOldValue: !!changes.baseUrl.oldValue,
        hasNewValue: !!changes.baseUrl.newValue,
      },
      ERROR_CATEGORIES.SECURITY_VALIDATION
    );

    // Recarrega configuração com nova URL
    urlConfigManager.reloadConfiguration();
  }
});

// === FUNCIONALIDADES ORIGINAIS PRESERVADAS ===

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

// Initialize KeepAliveManager
const keepAliveManager = new KeepAliveManager();
try {
  keepAliveManager.start();
} catch (error) {
  logError(
    'Falha ao inicializar KeepAliveManager',
    { errorMessage: error.message },
    ERROR_CATEGORIES.BACKGROUND_SCRIPT
  );
}

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

/**
 * Cleanup ao unload da extensão.
 * Para service workers, cleanup automático via alarms API.
 */
// For service worker environment - cleanup via event listener
if (typeof self !== 'undefined' && self.addEventListener) {
  self.addEventListener('unload', () => {
    keepAliveManager?.stop();
  });
}
api.runtime.onSuspend.addListener(() => {
  logInfo('Extension suspending - cleanup de recursos', {}, ERROR_CATEGORIES.EXTENSION_LIFECYCLE);

  urlConfigManager.destroy();
  rateLimiter.destroy();
  messageQueue.clear();
});
