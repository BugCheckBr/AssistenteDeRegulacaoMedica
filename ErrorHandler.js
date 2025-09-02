/**
 * 🏥 ASSISTENTE DE REGULAÇÃO MÉDICA - ERROR HANDLER CENTRALIZADO
 *
 * 🔒 ATENÇÃO: Este módulo lida com dados médicos sensíveis
 * 📋 Compliance: LGPD, HIPAA, Lei Geral de Proteção de Dados
 * 🚨 NUNCA logar: CPF, CNS, nomes completos, dados demográficos
 */

/**
 * Níveis de severidade para logging médico
 */
export const ERROR_LEVELS = {
  TRACE: 0, // Debugging detalhado (apenas dev)
  DEBUG: 1, // Informações de debug (apenas dev)
  INFO: 2, // Informações gerais (produção OK)
  WARN: 3, // Avisos (produção OK)
  ERROR: 4, // Erros (produção OK)
  FATAL: 5, // Erros críticos (produção OK)
};

/**
 * Categorias de erro específicas para ambiente médico
 */
export const ERROR_CATEGORIES = {
  // APIs médicas
  SIGSS_API: 'sigss_api',
  CADSUS_API: 'cadsus_api',
  MEDICAL_DATA: 'medical_data',

  // Extensão
  EXTENSION_LIFECYCLE: 'extension_lifecycle',
  CONTENT_SCRIPT: 'content_script',
  BACKGROUND_SCRIPT: 'background_script',

  // Segurança
  SECURITY: 'security',
  SECURITY_VALIDATION: 'security_validation',
  PERMISSIONS: 'permissions',
  CSP_VIOLATION: 'csp_violation',

  // Performance
  MEMORY: 'memory',
  STORAGE: 'storage',
  NETWORK: 'network',

  // UI/UX
  USER_INTERFACE: 'user_interface',
  USER_INPUT: 'user_input',

  // Seções específicas
  SECTION_FILTER_RENDER: 'section_filter_render',
  SECTION_DATA_FETCH: 'section_data_fetch',
  TIMELINE_DATA_FETCH: 'timeline_data_fetch',
  TIMELINE_NORMALIZATION: 'timeline_normalization',
  PATIENT_LOADING: 'patient_loading',
  INITIALIZATION: 'initialization',
  REGULATION_PROCESSING: 'regulation_processing',
  CLIPBOARD_OPERATION: 'clipboard_operation',
  DOCUMENT_ACCESS: 'document_access',
  REGULATION_ATTACHMENT: 'regulation_attachment',
  REGULATION_PENDING_CHECK: 'regulation_pending_check',
  SESSION_MANAGEMENT: 'session_management',
};

/**
 * Campos médicos sensíveis que NUNCA devem ser logados
 */
const SENSITIVE_MEDICAL_FIELDS = [
  // Identificação pessoal
  'cpf',
  'rg',
  'cns',
  'cartao_sus',
  'nome',
  'nome_completo',
  'nome_mae',
  'nome_pai',

  // Dados demográficos
  'data_nascimento',
  'idade',
  'sexo',
  'genero',
  'endereco',
  'rua',
  'numero',
  'bairro',
  'cidade',
  'cep',
  'telefone',
  'celular',
  'email',

  // Dados médicos específicos
  'diagnostico',
  'cid',
  'procedimento',
  'medicamento',
  'dosagem',
  'tratamento',

  // Tokens e IDs sensíveis (alguns são OK para log)
  'senha',
  'password',
  'token_acesso',
];

/**
 * Campos OK para logging (IDs técnicos necessários para debug)
 */
const LOGGABLE_TECHNICAL_FIELDS = [
  'id',
  'uuid',
  'reguId',
  'reguIdp',
  'reguIds',
  'isenPK',
  'isenFullPKCrypto',
  'sessionId',
  'requestId',
  'transactionId',
  'correlationId',
];

/**
 * Configurações do ErrorHandler baseadas no ambiente
 */
const getConfig = () => {
  let isDevelopment = false;

  try {
    // Detectar ambiente de desenvolvimento baseado na versão da extensão
    const api = typeof browser !== 'undefined' ? browser : chrome;
    isDevelopment =
      api.runtime && api.runtime.getManifest && api.runtime.getManifest().version.includes('dev');
  } catch {
    // Fallback para produção se não conseguir acessar manifest
    isDevelopment = false;
  }

  return {
    // Nível mínimo para logging
    minLevel: isDevelopment ? ERROR_LEVELS.DEBUG : ERROR_LEVELS.INFO,

    // Habilitar console.log em produção (com sanitização)
    enableConsoleLogging: true,

    // Habilitar storage de errors críticos
    enableErrorStorage: true,

    // Máximo de errors no storage (rotação)
    maxStoredErrors: 100,

    // Habilitar stack traces (apenas dev)
    enableStackTraces: isDevelopment,

    // Habilitar timing de performance
    enablePerformanceTiming: true,
  };
};

/**
 * Classe principal do ErrorHandler
 */
class MedicalErrorHandler {
  constructor() {
    this.config = getConfig();
    this.errorObservers = [];
    this.performanceMarks = new Map();

    this.initializeErrorStorage();
    this.setupGlobalErrorHandling();
  }

  /**
   * Inicializa storage para errors críticos
   */
  async initializeErrorStorage() {
    if (!this.config.enableErrorStorage) return;

    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;

      // Verificar se estamos em ambiente de teste
      const isTestEnvironment = typeof jest !== 'undefined';

      if (!api || !api.storage || !api.storage.local) {
        if (!isTestEnvironment) {
          console.warn('[ErrorHandler] Storage API não disponível');
        }
        return;
      }

      const result = await api.storage.local.get('medicalErrors');

      if (!result.medicalErrors) {
        await api.storage.local.set({ medicalErrors: [] });
      }
    } catch (error) {
      // Fallback silencioso se storage não estiver disponível
      const isTestEnvironment = typeof jest !== 'undefined';
      if (!isTestEnvironment) {
        console.warn('[ErrorHandler] Storage não disponível:', error.message);
      }
    }
  }

  /**
   * Configura captura global de errors não tratados
   */
  setupGlobalErrorHandling() {
    // Captura errors de JavaScript não tratados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError(
          'Erro JavaScript não tratado',
          {
            message: event.message,
            filename: this.sanitizeFilename(event.filename),
            lineno: event.lineno,
            colno: event.colno,
          },
          ERROR_CATEGORIES.EXTENSION_LIFECYCLE
        );
      });

      // Captura promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', (event) => {
        this.logError(
          'Promise rejeitada não tratada',
          {
            reason: event.reason?.message || 'Unknown error',
          },
          ERROR_CATEGORIES.EXTENSION_LIFECYCLE
        );
      });
    }

    // Captura violations de CSP
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.logError(
          'Violação de CSP detectada',
          {
            directive: event.violatedDirective,
            blockedURI: event.blockedURI,
            disposition: event.disposition,
          },
          ERROR_CATEGORIES.CSP_VIOLATION
        );
      });
    }
  }

  /**
   * Sanitiza dados médicos para logging seguro
   * @param {any} data - Dados a serem sanitizados
   * @param {string} strategy - Estratégia de sanitização
   * @returns {any} Dados sanitizados
   */
  sanitizeForLogging(data, strategy = 'MEDICAL_DATA') {
    if (data === null || data === undefined) return data;

    // Primitivos são safe (numbers, booleans, strings simples)
    if (typeof data !== 'object') {
      return typeof data === 'string' && data.length > 100 ? `${data.substring(0, 100)}...` : data;
    }

    // Arrays
    if (Array.isArray(data)) {
      return data.length > 5
        ? [
            ...data.slice(0, 5).map((item) => this.sanitizeForLogging(item, strategy)),
            `...${data.length - 5} more items`,
          ]
        : data.map((item) => this.sanitizeForLogging(item, strategy));
    }

    // Objects
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      // Verificar se o campo é sensível
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[SANITIZED_MEDICAL_DATA]';
        continue;
      }

      // Campos técnicos OK para logging
      if (LOGGABLE_TECHNICAL_FIELDS.includes(key)) {
        sanitized[key] = value;
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value, strategy);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Verifica se um campo é sensível para logging
   * @param {string} fieldName - Nome do campo
   * @returns {boolean} Se o campo é sensível
   */
  isSensitiveField(fieldName) {
    const lowerField = fieldName.toLowerCase();

    return SENSITIVE_MEDICAL_FIELDS.some((sensitiveField) =>
      lowerField.includes(sensitiveField.toLowerCase())
    );
  }

  /**
   * Sanitiza filename para remover informações sensíveis do path
   * @param {string} filename - Nome do arquivo
   * @returns {string} Filename sanitizado
   */
  sanitizeFilename(filename) {
    if (!filename) return 'unknown';

    // Remove paths absolutos, mantém apenas o nome do arquivo
    const parts = filename.split(/[/\\]/);
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Log de informações gerais (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do log
   */
  logInfo(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.INFO, message, data, category);
  }

  /**
   * Log de warnings (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do warning
   */
  logWarning(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.WARN, message, data, category);
  }

  /**
   * Log de errors (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do erro
   */
  logError(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.ERROR, message, data, category);
  }

  /**
   * Log de errors críticos (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do erro crítico
   */
  logFatal(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.FATAL, message, data, category);
  }

  /**
   * Log apenas para desenvolvimento
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do debug
   */
  logDebug(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.DEBUG, message, data, category);
  }

  /**
   * Método principal de logging com sanitização automática
   * @param {number} level - Nível do log
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria
   */
  log(level, message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    // Verificar nível mínimo
    if (level < this.config.minLevel) return;

    // Sanitizar dados automaticamente
    const sanitizedData = data ? this.sanitizeForLogging(data) : null;

    // Criar entrada de log
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: this.getLevelName(level),
      category,
      message,
      data: sanitizedData,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      extensionVersion: this.getExtensionVersion(),
    };

    // Adicionar stack trace apenas em desenvolvimento
    if (this.config.enableStackTraces && level >= ERROR_LEVELS.ERROR) {
      logEntry.stack = new Error().stack;
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.outputToConsole(level, logEntry);
    }

    // Storage de errors críticos
    if (this.config.enableErrorStorage && level >= ERROR_LEVELS.ERROR) {
      this.storeError(logEntry);
    }

    // Notificar observers
    this.notifyObservers(logEntry);
  }

  /**
   * Output para console com formatação adequada
   * @param {number} level - Nível do log
   * @param {object} logEntry - Entrada de log
   */
  outputToConsole(level, logEntry) {
    const prefix = `[Assistente Médico ${logEntry.category}]`;
    const message = `${prefix} ${logEntry.message}`;
    const data = logEntry.data;

    // Para Edge, que pode ter problemas com objetos no console, serializa se não for dev
    const isDevelopment = this.config.minLevel === ERROR_LEVELS.DEBUG;
    const dataToLog =
      !isDevelopment && typeof data === 'object' && data !== null ? JSON.stringify(data) : data;

    switch (level) {
      case ERROR_LEVELS.TRACE:
      case ERROR_LEVELS.DEBUG:
        console.debug(message, dataToLog);
        break;
      case ERROR_LEVELS.INFO:
        console.info(message, dataToLog);
        break;
      case ERROR_LEVELS.WARN:
        console.warn(message, dataToLog);
        break;
      case ERROR_LEVELS.ERROR:
        console.error(message, dataToLog);
        break;
      case ERROR_LEVELS.FATAL:
        console.error(`🚨 FATAL: ${message}`, dataToLog);
        break;
    }
  }

  /**
   * Armazena errors críticos para análise posterior
   * @param {object} logEntry - Entrada de log
   */
  async storeError(logEntry) {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.local.get('medicalErrors');
      let errors = result.medicalErrors || [];

      // Adicionar novo erro
      errors.unshift(logEntry);

      // Manter apenas os últimos N errors (rotação)
      if (errors.length > this.config.maxStoredErrors) {
        errors = errors.slice(0, this.config.maxStoredErrors);
      }

      await api.storage.local.set({ medicalErrors: errors });
    } catch (error) {
      // Fallback silencioso
      console.warn('[ErrorHandler] Falha ao armazenar erro:', error.message);
    }
  }

  /**
   * Notifica observers de novos logs
   * @param {object} logEntry - Entrada de log
   */
  notifyObservers(logEntry) {
    this.errorObservers.forEach((observer) => {
      try {
        observer(logEntry);
      } catch (error) {
        // Evitar loops infinitos de error
        console.warn('[ErrorHandler] Observer error:', error.message);
      }
    });
  }

  /**
   * Registra observer para logs
   * @param {Function} callback - Callback do observer
   */
  subscribe(callback) {
    this.errorObservers.push(callback);
  }

  /**
   * Remove observer
   * @param {Function} callback - Callback para remover
   */
  unsubscribe(callback) {
    const index = this.errorObservers.indexOf(callback);
    if (index > -1) {
      this.errorObservers.splice(index, 1);
    }
  }

  /**
   * Inicia marcação de performance
   * @param {string} name - Nome da operação
   */
  startPerformanceMark(name) {
    if (!this.config.enablePerformanceTiming) return;

    this.performanceMarks.set(name, Date.now());
  }

  /**
   * Finaliza marcação de performance
   * @param {string} name - Nome da operação
   * @param {string} category - Categoria do log
   */
  endPerformanceMark(name, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    if (!this.config.enablePerformanceTiming) return;

    const startTime = this.performanceMarks.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logInfo(`Performance: ${name} took ${duration}ms`, { duration }, category);
      this.performanceMarks.delete(name);
    }
  }

  /**
   * Obtém nome do nível
   * @param {number} level - Nível
   * @returns {string} Nome do nível
   */
  getLevelName(level) {
    const levelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    return levelNames[level] || 'UNKNOWN';
  }

  /**
   * Obtém versão da extensão
   * @returns {string} Versão da extensão
   */
  getExtensionVersion() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      if (api.runtime) {
        return api.runtime.getManifest().version;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Recupera errors armazenados
   * @returns {Promise<Array>} Lista de errors
   */
  async getStoredErrors() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.local.get('medicalErrors');
      return result.medicalErrors || [];
    } catch (error) {
      this.logWarning('Falha ao recuperar errors armazenados', { error: error.message });
      return [];
    }
  }

  /**
   * Limpa errors armazenados
   */
  async clearStoredErrors() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      await api.storage.local.set({ medicalErrors: [] });
      this.logInfo('Errors armazenados limpos');
    } catch (error) {
      this.logWarning('Falha ao limpar errors armazenados', { error: error.message });
    }
  }
}

// Singleton instance
let errorHandlerInstance = null;

/**
 * Obtém instância singleton do ErrorHandler
 * @returns {MedicalErrorHandler} Instância do ErrorHandler
 */
export function getErrorHandler() {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new MedicalErrorHandler();
  }
  return errorHandlerInstance;
}

// Exportar instância padrão para conveniência
export const ErrorHandler = getErrorHandler();

// Exports para backward compatibility e testing
export { MedicalErrorHandler };

/**
 * Helper functions para uso rápido
 */
export const logInfo = (message, data, category) => ErrorHandler.logInfo(message, data, category);
export const logWarning = (message, data, category) =>
  ErrorHandler.logWarning(message, data, category);
export const logError = (message, data, category) => ErrorHandler.logError(message, data, category);
export const logFatal = (message, data, category) => ErrorHandler.logFatal(message, data, category);
export const logDebug = (message, data, category) => ErrorHandler.logDebug(message, data, category);

/**
 * Sanitização específica para dados médicos (export direto)
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} Dados sanitizados
 */
export const sanitizeForLog = (data) => ErrorHandler.sanitizeForLogging(data);
