/**
 * 🧪 SETUP GLOBAL PARA TESTES JEST - MEDICAL EXTENSION
 * 🏥 Setup específico para extensão médica com dados sensíveis
 * 🔒 Este arquivo é executado antes de cada teste para configurar ambiente seguro
 */

// ===== CONFIGURAÇÃO CRÍTICA DOS MOCKS =====
// DEVE ser feita ANTES de qualquer import para evitar erros de storage

// Mock browser APIs ANTES de qualquer import
function createChromeStorageMock() {
  return {
    get: jest.fn((...args) => {
      let callback = args[1];
      if (typeof args[0] === 'function') callback = args[0];
      if (typeof callback === 'function') callback({});
      return Promise.resolve({});
    }),
    set: jest.fn((items, callback) => {
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    }),
    remove: jest.fn((keys, callback) => {
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    }),
    clear: jest.fn((callback) => {
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    })
  };
}

// Configurar chrome global IMEDIATAMENTE
global.chrome = {
  runtime: {
    lastError: null,
    getManifest: jest.fn(() => ({
      version: '3.3.7',
      manifest_version: 3
    })),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    reload: jest.fn()
  },
  storage: {
    local: createChromeStorageMock(),
    sync: createChromeStorageMock(),
    session: createChromeStorageMock(),
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false)
    }
  },
  alarms: {
    create: jest.fn((name, alarmInfo) => Promise.resolve()),
    clear: jest.fn((name) => Promise.resolve(true)),
    clearAll: jest.fn(() => Promise.resolve(true)),
    get: jest.fn((name) => Promise.resolve(null)),
    getAll: jest.fn(() => Promise.resolve([])),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false)
    }
  },
  scripting: {
    executeScript: jest.fn()
  },
  contextMenus: {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn()
  },
  clipboardWrite: {
    writeText: jest.fn()
  }
};

// Mock browser como alias para chrome
global.browser = global.chrome;

// Mock console para reduzir ruído nos testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// AGORA podemos importar os módulos que dependem dos mocks
import { TestStoreCleanup } from './utils/test-infrastructure.js';

// Global test cleanup to prevent memory leaks
beforeEach(() => {
  // Limpar todos os mocks primeiro
  jest.clearAllMocks();

  // Reconfigurar chrome.storage se necessário
  if (!global.chrome.storage.local.get.mockResolvedValue) {
    global.chrome.storage.local = createChromeStorageMock();
    global.chrome.storage.sync = createChromeStorageMock();
    global.chrome.storage.session = createChromeStorageMock();
  }

  // Reset console mocks
  Object.values(global.console).forEach(fn => {
    if (fn && fn.mockClear) fn.mockClear();
  });

  TestStoreCleanup.cleanup();
  TestStoreCleanup.mockBrowserAPIs();
});

afterEach(() => {
  TestStoreCleanup.cleanup();
  jest.clearAllMocks();
});

// Mock browser APIs globalmente

// Setup environment
// Mock DOM APIs específicos para extensões
global.document = {
  ...global.document,
  createElement: jest.fn((tagName) => ({
    tagName: tagName.toUpperCase(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    style: {}
  })),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn(),
  getElementsByClassName: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  },
  head: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};


/**
 * @file setup.js - Configuração global para testes com memory leak prevention
 *
 * 🚨 CRÍTICO: Prevenir memory leaks em ambiente de teste médico
 * 🏥 LGPD: Garantir que dados sensíveis nunca vazem
 */

// Configuração de timeout para evitar hangs
jest.setTimeout(30000); // 30 segundos máximo por teste


// Sempre garantir mocks limpos e definidos antes de cada teste
beforeEach(() => {
  // === MEMORY LEAK PREVENTION ===

  // Limpar todos os timers para evitar handles abertos
  jest.clearAllTimers();

  // Limpar todos os mocks anteriores
  jest.clearAllMocks();

  // Garante que global.chrome existe
  if (!global.chrome) global.chrome = {};

  // Garante que global.chrome.storage existe
  if (!global.chrome.storage) global.chrome.storage = {};

  // Só recria chrome.storage.local se não foi sobrescrito pelo teste
  if (!global.chrome.storage.local || !global.chrome.storage.local.set || typeof global.chrome.storage.local.set !== 'function') {
    global.chrome.storage.local = createChromeStorageMock();
  } else {
    // Limpa os mocks existentes
    Object.values(global.chrome.storage.local).forEach(fn => fn && fn.mockClear && fn.mockClear());
  }

  // Garante que browser sempre referencia chrome
  global.browser = global.chrome;

  // Limpa todos os mocks de console
  Object.values(global.console).forEach(fn => fn && fn.mockClear && fn.mockClear());

  // Limpa mocks de funções globais usadas em store
  if (global.window && global.window.resetFiltersToDefault && global.window.resetFiltersToDefault.mockClear) {
    global.window.resetFiltersToDefault.mockClear();
  }
  if (global.window && global.window.applyAutomationRules && global.window.applyAutomationRules.mockClear) {
    global.window.applyAutomationRules.mockClear();
  }

  // === FETCH MOCK SETUP ===
  // Setup fetch mock com timeout para evitar hangs
  global.fetch = jest.fn(() =>
    Promise.race([
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob())
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout in test')), 5000)
      )
    ])
  );
});

// Mock para Firefox (browser API)
global.browser = { ...global.chrome };

// Mock específico para testes que usam mockBrowser
global.mockBrowser = {
  alarms: {
    create: jest.fn((name, alarmInfo) => Promise.resolve()),
    clear: jest.fn((name) => Promise.resolve(true)),
    clearAll: jest.fn(() => Promise.resolve(true)),
    get: jest.fn((name) => Promise.resolve(null)),
    getAll: jest.fn(() => Promise.resolve([])),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false)
    }
  },
  storage: {
    local: createChromeStorageMock(),
    sync: createChromeStorageMock(),
    session: createChromeStorageMock()
  },
  runtime: {
    lastError: null,
    getManifest: jest.fn(() => ({ version: '3.3.7' })),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

// Mock DOM APIs específicos para extensões
global.document = {
  ...global.document,
  createElement: jest.fn((tagName) => ({
    tagName: tagName.toUpperCase(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    style: {}
  })),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn(),
  getElementsByClassName: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  },
  head: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock window object
// Adiciona mocks globais para funções usadas em store-medical-flow
const windowBase = global.window || {};
global.window = {
  ...windowBase,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  location: {
    href: 'https://test.example.com',
    hostname: 'test.example.com',
    pathname: '/',
    search: '',
    hash: ''
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  postMessage: jest.fn(),
  // Mocks para fluxos médicos do store
  resetFiltersToDefault: jest.fn(),
  applyAutomationRules: jest.fn()
};

// Mock fetch para testes de API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Configurações específicas para extensão médica
global.medicalTestUtils = {
  // Função para sanitizar dados de teste
  sanitizeTestData: (data) => {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      // Remover dados sensíveis dos testes
      const sensitiveFields = ['cpf', 'rg', 'cns', 'nome_completo', 'endereco'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[SANITIZED]';
        }
      });

      return sanitized;
    }
    return data;
  },

  // Mock de dados de paciente para testes
  createMockPatient: () => ({
    id: 'TEST_PATIENT_001',
    nome: 'Paciente Teste',
    cpf: '[SANITIZED]',
    isenPK: 'TEST_ISEN_PK_12345',
    is_mock: true,
    is_test_data: true
  }),

  // Validar que não há vazamento de dados sensíveis
  validateNoDataLeaks: () => {
    // Esta função pode ser chamada para verificar logs, etc.
    // Por enquanto é um placeholder
  }
};

// Setup para compliance médico
global.medicalCompliance = {
  // Verificar se dados são tratados adequadamente
  validateDataHandling: (operation, data) => {
    if (data && typeof data === 'object') {
      // Verificar se dados sensíveis estão sendo persistidos
      const sensitiveFields = ['cpf', 'rg', 'cns'];
      sensitiveFields.forEach(field => {
        if (data[field] && operation.includes('persist')) {
          throw new Error(`Tentativa de persistir dados sensíveis: ${field}`);
        }
      });
    }
  },

  // Mock de validação GDPR/LGPD
  validateGDPRCompliance: (dataUsage) => {
    const requiredFields = ['purpose', 'retention', 'consent'];
    requiredFields.forEach(field => {
      if (!dataUsage[field]) {
        throw new Error(`Campo GDPR obrigatório ausente: ${field}`);
      }
    });
  }
};

// Setup antes de todos os testes
beforeAll(() => {
  console.log('🧪 Iniciando testes da extensão médica');
  console.log('🔒 Compliance médico ativo');
  console.log('📋 Mocks do browser configurados');
});

// Cleanup após todos os testes
afterAll(() => {
  console.log('✅ Testes concluídos');
  console.log('🔍 Verificando compliance final...');

  // Validação final de compliance
  if (global.medicalTestUtils?.validateNoDataLeaks) {
    global.medicalTestUtils.validateNoDataLeaks();
  }
});

module.exports = {
  // Configurações exportadas para uso em testes específicos
  mockChrome: global.chrome,
  mockBrowser: global.browser,
  medicalTestUtils: global.medicalTestUtils,
  medicalCompliance: global.medicalCompliance
};
