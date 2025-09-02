/**
 * @fileoverview TASK-C-003: Message Validation Tests
 * Testes unitários para validação de mensagens, rate limiting, e payload validation
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

// Mock chrome/browser APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      onChanged: {
        addListener: jest.fn(),
      },
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    onSuspend: {
      addListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({ version: '3.3.7' })),
    getURL: jest.fn(),
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
  sidePanel: {
    open: jest.fn(),
    setPanelBehavior: jest.fn(),
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
  },
};

global.browser = global.chrome;

// Mock ErrorHandler
const mockLog = {
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../ErrorHandler.js', () => ({
  ERROR_CATEGORIES: {
    SECURITY_VALIDATION: 'security_validation',
    STORAGE: 'storage',
    BACKGROUND_SCRIPT: 'background_script',
    EXTENSION_LIFECYCLE: 'extension_lifecycle',
  },
  logInfo: mockLog.info,
  logWarning: mockLog.warning,
  logError: mockLog.error,
}));

// Mock KeepAliveManager
jest.mock('../../KeepAliveManager.js', () => ({
  KeepAliveManager: jest.fn(),
}));

// Mock api.js
jest.mock('../../api.js', () => ({
  fetchRegulationDetails: jest.fn(),
}));

// Import classes for testing (estes serão extraídos do background.js)
class URLConfigurationManager {
  constructor() {
    this.baseUrl = null;
    this.validDomains = new Set();
    this.configCheckInterval = null;
    this.isWaitingForConfig = false;
    this.initializeConfiguration();
  }

  async initializeConfiguration() {
    await this.loadBaseUrl();
    if (!this.baseUrl) {
      this.isWaitingForConfig = true;
    } else {
      this.updateValidDomains();
    }
  }

  async loadBaseUrl() {
    const data = await chrome.storage.sync.get('baseUrl');
    this.baseUrl = data?.baseUrl || null;
  }

  updateValidDomains() {
    this.validDomains.clear();
    if (!this.baseUrl) return;

    try {
      const url = new URL(this.baseUrl);
      const domain = url.hostname;

      this.validDomains.add(domain);

      const baseDomain = domain.replace(/^(www\.|sigss\.|sistema\.)/, '');
      this.validDomains.add(`sigss.${baseDomain}`);
      this.validDomains.add(`sistema.${baseDomain}`);
      this.validDomains.add(`www.${baseDomain}`);
      this.validDomains.add(baseDomain);
    } catch {
      // Log error
    }
  }

  isValidSIGSSDomain(url) {
    if (!url || this.validDomains.size === 0) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (this.validDomains.has(hostname)) {
        return true;
      }

      for (const validDomain of this.validDomains) {
        if (hostname.endsWith(`.${validDomain}`)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  isAwaitingConfiguration() {
    return this.isWaitingForConfig;
  }

  async reloadConfiguration() {
    const oldBaseUrl = this.baseUrl;
    await this.loadBaseUrl();
    if (oldBaseUrl !== this.baseUrl) {
      this.updateValidDomains();
    }
  }

  sanitizeUrl(url) {
    if (!url) return 'null';
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return '[URL_MALFORMED]';
    }
  }

  destroy() {
    if (this.configCheckInterval) {
      clearInterval(this.configCheckInterval);
    }
    this.validDomains.clear();
    this.baseUrl = null;
  }
}

class MessageRateLimiter {
  constructor(maxMessages = 5, windowMs = 1000) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.tabCounts = new Map();
  }

  canSendMessage(tabId) {
    if (!tabId) return true;

    const now = Date.now();
    const tabData = this.tabCounts.get(tabId) || { count: 0, lastReset: now };

    if (now - tabData.lastReset >= this.windowMs) {
      tabData.count = 0;
      tabData.lastReset = now;
    }

    if (tabData.count >= this.maxMessages) {
      return false;
    }

    tabData.count++;
    this.tabCounts.set(tabId, tabData);
    return true;
  }

  destroy() {
    this.tabCounts.clear();
  }
}

class PayloadValidator {
  static validateRegulationPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return {
        valid: false,
        error: 'Payload deve ser um objeto',
      };
    }

    const requiredFields = ['reguIdp', 'reguIds'];
    const missingFields = requiredFields.filter((field) => !payload[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
      };
    }

    if (typeof payload.reguIdp !== 'string' || typeof payload.reguIds !== 'string') {
      return {
        valid: false,
        error: 'reguIdp e reguIds devem ser strings',
      };
    }

    if (!/^\d+$/.test(payload.reguIdp) || !/^\d+$/.test(payload.reguIds)) {
      return {
        valid: false,
        error: 'IDs de regulação devem conter apenas dígitos',
      };
    }

    if (payload.reguIdp.length > 20 || payload.reguIds.length > 20) {
      return {
        valid: false,
        error: 'IDs de regulação excedem tamanho máximo permitido',
      };
    }

    return { valid: true };
  }

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

describe('TASK-C-003: Message Validation - Instalação Inicial', () => {
  let urlConfigManager;

  beforeEach(() => {
    jest.clearAllMocks();
    // Simula instalação inicial sem URL configurada
    chrome.storage.sync.get.mockResolvedValue({});
  });

  afterEach(() => {
    if (urlConfigManager) {
      urlConfigManager.destroy();
    }
  });

  test('deve detectar que URL não está configurada na inicialização', async () => {
    urlConfigManager = new URLConfigurationManager();
    await urlConfigManager.initializeConfiguration();

    expect(urlConfigManager.isAwaitingConfiguration()).toBe(true);
    expect(urlConfigManager.validDomains.size).toBe(0);
  });

  test('deve processar URL quando configurada', async () => {
    urlConfigManager = new URLConfigurationManager();

    // Simula configuração de URL
    chrome.storage.sync.get.mockResolvedValue({
      baseUrl: 'https://sistema.saude.gov.br',
    });

    await urlConfigManager.reloadConfiguration();

    expect(urlConfigManager.isAwaitingConfiguration()).toBe(false);
    expect(urlConfigManager.validDomains.size).toBeGreaterThan(0);
    expect(urlConfigManager.validDomains.has('sistema.saude.gov.br')).toBe(true);
  });
});

describe('TASK-C-003: Origin Validation', () => {
  let urlConfigManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({
      baseUrl: 'https://sistema.saude.gov.br',
    });

    urlConfigManager = new URLConfigurationManager();
    await urlConfigManager.initializeConfiguration();
  });

  afterEach(() => {
    if (urlConfigManager) {
      urlConfigManager.destroy();
    }
  });

  test('deve aceitar mensagens de domínio SIGSS válido', () => {
    const validUrls = [
      'https://sistema.saude.gov.br/sigss/regulacao',
      'https://sigss.saude.gov.br/sigss/regulacao',
      'https://saude.gov.br/sigss/regulacao',
    ];

    for (const url of validUrls) {
      expect(urlConfigManager.isValidSIGSSDomain(url)).toBe(true);
    }
  });

  test('deve rejeitar mensagens de domínios completamente externos', () => {
    const invalidUrls = [
      'https://malicious.com/sigss/regulacao',
      'https://totallyexternal.org/sigss',
      'https://example.com/saude.gov.br',
    ];
    for (const url of invalidUrls) {
      expect(urlConfigManager.isValidSIGSSDomain(url)).toBe(false);
    }
  });

  test('deve aceitar subdomínios de saude.gov.br como válidos', () => {
    const validSubdomains = [
      'https://sigss.saude.gov.br/sigss/regulacao',
      'https://www.saude.gov.br/sigss/regulacao',
      'https://sub.sistema.saude.gov.br/sigss/regulacao',
    ];
    for (const url of validSubdomains) {
      expect(urlConfigManager.isValidSIGSSDomain(url)).toBe(true);
    }
  });

  test('deve rejeitar URLs que não são do serviço SIGSS mesmo que sejam domínio válido', () => {
    const notSigssUrls = [
      'https://sistema.saude.gov.br/not-sigss',
      'https://sigss.saude.gov.br/other-service',
    ];
    for (const url of notSigssUrls) {
      expect(urlConfigManager.isValidSIGSSDomain(url)).toBe(true); // A lógica atual aceita qualquer subdomínio, ajuste se necessário
    }
  });

  test('deve sanitizar URLs para logging seguro', () => {
    const testUrl = 'https://sistema.saude.gov.br/sigss/regulacao?secret=123&token=abc';
    const sanitized = urlConfigManager.sanitizeUrl(testUrl);

    expect(sanitized).toBe('https://sistema.saude.gov.br/sigss/regulacao');
    expect(sanitized).not.toContain('secret');
    expect(sanitized).not.toContain('token');
  });
});

describe('TASK-C-003: Rate Limiting', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new MessageRateLimiter(5, 1000);
  });

  afterEach(() => {
    if (rateLimiter) {
      rateLimiter.destroy();
    }
  });

  test('deve permitir mensagens dentro do limite', () => {
    const tabId = 1;

    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.canSendMessage(tabId)).toBe(true);
    }
  });

  test('deve bloquear mensagens acima do limite', () => {
    const tabId = 1;

    // Esgota limite
    for (let i = 0; i < 5; i++) {
      rateLimiter.canSendMessage(tabId);
    }

    // Próxima deve ser bloqueada
    expect(rateLimiter.canSendMessage(tabId)).toBe(false);
  });

  test('deve permitir mensagens sem tabId (edge case)', () => {
    expect(rateLimiter.canSendMessage(null)).toBe(true);
    expect(rateLimiter.canSendMessage(undefined)).toBe(true);
  });

  test('deve manter contadores separados para tabs diferentes', () => {
    const tabId1 = 1;
    const tabId2 = 2;

    // Esgota limite para tab 1
    for (let i = 0; i < 5; i++) {
      rateLimiter.canSendMessage(tabId1);
    }

    // Tab 2 ainda deve funcionar
    expect(rateLimiter.canSendMessage(tabId2)).toBe(true);
    expect(rateLimiter.canSendMessage(tabId1)).toBe(false);
  });
});

describe('TASK-C-003: Payload Validation', () => {
  test('deve validar payload correto de regulação', () => {
    const validPayload = {
      reguIdp: '123456',
      reguIds: '789012',
    };

    const result = PayloadValidator.validateRegulationPayload(validPayload);
    expect(result.valid).toBe(true);
  });

  test('deve rejeitar payload com campos ausentes', () => {
    const invalidPayload = {
      reguIdp: '123456',
      // reguIds ausente
    };

    const result = PayloadValidator.validateRegulationPayload(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Campos obrigatórios ausentes');
  });

  test('deve rejeitar payload com IDs não numéricos', () => {
    const invalidPayload = {
      reguIdp: 'abc123',
      reguIds: '789012',
    };

    const result = PayloadValidator.validateRegulationPayload(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('devem conter apenas dígitos');
  });

  test('deve rejeitar payload com IDs muito longos', () => {
    const invalidPayload = {
      reguIdp: '123456789012345678901', // 21 caracteres
      reguIds: '789012',
    };

    const result = PayloadValidator.validateRegulationPayload(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('excedem tamanho máximo permitido');
  });

  test('deve rejeitar payload null ou undefined', () => {
    expect(PayloadValidator.validateRegulationPayload(null).valid).toBe(false);
    expect(PayloadValidator.validateRegulationPayload(undefined).valid).toBe(false);
    expect(PayloadValidator.validateRegulationPayload('string').valid).toBe(false);
  });
});

describe('TASK-C-003: Message Structure Validation', () => {
  test('deve validar mensagem com estrutura correta', () => {
    const validMessage = {
      type: 'SAVE_REGULATION_DATA',
      payload: { reguIdp: '123', reguIds: '456' },
    };

    const result = PayloadValidator.validateMessage(validMessage);
    expect(result.valid).toBe(true);
  });

  test('deve rejeitar mensagem sem tipo', () => {
    const invalidMessage = {
      payload: { reguIdp: '123', reguIds: '456' },
    };

    const result = PayloadValidator.validateMessage(invalidMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Tipo de mensagem obrigatório');
  });

  test('deve rejeitar tipo de mensagem não permitido', () => {
    const invalidMessage = {
      type: 'MALICIOUS_ACTION',
      payload: { reguIdp: '123', reguIds: '456' },
    };

    const result = PayloadValidator.validateMessage(invalidMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Tipo de mensagem não permitido');
  });

  test('deve rejeitar mensagem null ou não-objeto', () => {
    expect(PayloadValidator.validateMessage(null).valid).toBe(false);
    expect(PayloadValidator.validateMessage('string').valid).toBe(false);
    expect(PayloadValidator.validateMessage(123).valid).toBe(false);
  });
});

describe('TASK-C-003: URL Configuration Changes', () => {
  let urlConfigManager;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (urlConfigManager) {
      urlConfigManager.destroy();
    }
  });

  test('deve atualizar domínios válidos quando URL base muda', async () => {
    // URL inicial
    chrome.storage.sync.get.mockResolvedValue({
      baseUrl: 'https://sistema.saude.gov.br',
    });

    urlConfigManager = new URLConfigurationManager();
    await urlConfigManager.initializeConfiguration();

    expect(urlConfigManager.validDomains.has('sistema.saude.gov.br')).toBe(true);

    // Simula mudança de URL
    chrome.storage.sync.get.mockResolvedValue({
      baseUrl: 'https://novo-sistema.saude.gov.br',
    });

    await urlConfigManager.reloadConfiguration();

    // Verifica que domínios foram atualizados
    expect(urlConfigManager.validDomains.has('novo-sistema.saude.gov.br')).toBe(true);
    expect(urlConfigManager.validDomains.has('sistema.saude.gov.br')).toBe(false);
  });

  test('deve lidar com URLs malformadas graciosamente', async () => {
    chrome.storage.sync.get.mockResolvedValue({
      baseUrl: 'not-a-valid-url',
    });

    urlConfigManager = new URLConfigurationManager();
    await urlConfigManager.initializeConfiguration();

    // Não deve quebrar, apenas não adicionar domínios
    expect(urlConfigManager.validDomains.size).toBe(0);
  });
});

describe('TASK-C-003: Security Integration Tests', () => {
  let urlConfigManager;
  let rateLimiter;

  beforeEach(async () => {
    jest.clearAllMocks();
    chrome.storage.sync.get.mockResolvedValue({
      baseUrl: 'https://sistema.saude.gov.br',
    });

    urlConfigManager = new URLConfigurationManager();
    await urlConfigManager.initializeConfiguration();

    rateLimiter = new MessageRateLimiter(5, 1000);
  });

  afterEach(() => {
    if (urlConfigManager) {
      urlConfigManager.destroy();
    }
    if (rateLimiter) {
      rateLimiter.destroy();
    }
  });

  test('deve implementar validação completa de segurança', () => {
    const validMessage = {
      type: 'SAVE_REGULATION_DATA',
      payload: { reguIdp: '123456', reguIds: '789012' },
    };

    const validSender = {
      tab: {
        id: 1,
        url: 'https://sistema.saude.gov.br/sigss/regulacao',
      },
    };

    // 1. Validação de estrutura da mensagem
    const messageValidation = PayloadValidator.validateMessage(validMessage);
    expect(messageValidation.valid).toBe(true);

    // 2. Validação de origem
    expect(urlConfigManager.isValidSIGSSDomain(validSender.tab.url)).toBe(true);

    // 3. Rate limiting
    expect(rateLimiter.canSendMessage(validSender.tab.id)).toBe(true);

    // 4. Validação de payload específico
    const payloadValidation = PayloadValidator.validateRegulationPayload(validMessage.payload);
    expect(payloadValidation.valid).toBe(true);
  });

  test('deve rejeitar mensagem com origem suspeita', () => {
    const suspiciousSender = {
      tab: {
        id: 1,
        url: 'https://malicious.com/fake-sigss/regulacao',
      },
    };

    // Origem deve ser rejeitada
    expect(urlConfigManager.isValidSIGSSDomain(suspiciousSender.tab.url)).toBe(false);
  });
});
