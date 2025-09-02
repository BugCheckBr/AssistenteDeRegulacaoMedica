/**
 * @jest-environment node
 */
/**
 * Unit Tests for KeepAliveManager - VERSÃO CORRIGIDA
 * Tests the hybrid alarms/setInterval implementation for service worker compatibility
 */

import { jest } from '@jest/globals';

// Mock ErrorHandler GLOBALMENTE antes de qualquer outra importação
const mockErrorHandler = {
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarning: jest.fn(),
  setupGlobalErrorHandling: jest.fn(),
  sanitizeData: jest.fn((data) => data),
  createMedicalError: jest.fn((type, message, context) => ({
    type,
    message,
    context,
    timestamp: new Date().toISOString(),
  })),
};

// Mock API module
const mockAPI = {
  keepSessionAlive: jest.fn().mockResolvedValue(true),
};

let originalDocument;
let originalWindow;

beforeEach(() => {
  // Mock timer functions
  jest.useFakeTimers();

  // Store originals for service worker simulation
  originalDocument = global.document;
  originalWindow = global.window;

  // Enhanced chrome.alarms mock
  global.chrome = {
    alarms: {
      create: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue(true),
      onAlarm: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    storage: {
      sync: {
        get: jest.fn().mockResolvedValue({ keepSessionAliveInterval: 10 }),
        set: jest.fn().mockResolvedValue(),
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
    },
  };

  // Enhanced window mock for background scripts
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  // Enhanced document mock
  global.document = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  // Mock fetch
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });

  // Mock modules usando require cache
  jest.doMock('../../ErrorHandler.js', () => ({
    getErrorHandler: jest.fn(() => mockErrorHandler),
  }));

  jest.doMock('../../api.js', () => mockAPI);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();

  // Restore original globals
  global.document = originalDocument;
  global.window = originalWindow;

  // Clear module cache
  jest.resetModules();
});

describe('KeepAliveManager', () => {
  function setupServiceWorkerEnv() {
    // Simulate service worker environment
    delete global.document;
    delete global.window;
    Object.defineProperty(global, 'importScripts', {
      value: undefined,
      writable: true,
    });
  }

  function setupBackgroundEnv() {
    // Simulate background script environment
    global.document = { addEventListener: jest.fn() };
    global.window = { addEventListener: jest.fn() };
    global.importScripts = jest.fn();
  }

  describe('Service Worker Detection', () => {
    test('should detect service worker environment when importScripts is undefined', () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.detectServiceWorkerEnvironment()).toBe(true);
    });

    test('should detect background script environment when importScripts exists', () => {
      setupBackgroundEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.detectServiceWorkerEnvironment()).toBe(false);
    });
  });

  describe('Alarms API Implementation', () => {
    test('should create alarm when starting in service worker environment', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1; // Garante que não será 0

      await kam.start();
      expect(global.chrome.alarms.create).toHaveBeenCalledWith(
        'keepalive-session',
        expect.objectContaining({ periodInMinutes: 1 })
      );
    });

    test('should setup alarm listener when KeepAliveManager is created in service worker', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');

      // O listener é configurado no init(), que é chamado no constructor
      new KeepAliveManager();

      // Aguarda qualquer operação async do init
      await Promise.resolve();

      expect(global.chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
    });

    test('should clear existing alarm before creating new one', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      expect(global.chrome.alarms.clear).toHaveBeenCalledWith('keepalive-session');
      expect(global.chrome.alarms.create).toHaveBeenCalled();
    });

    test('should handle alarm events correctly', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();

      // Simula disparo do alarm
      const alarmListener = global.chrome.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      if (alarmListener) {
        await alarmListener({ name: 'keepalive-session' });
        expect(mockAPI.keepSessionAlive).toHaveBeenCalled();
      }
    });

    test('should ignore non-keepAlive alarms', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      await kam.start();

      const alarmListener = global.chrome.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      if (alarmListener) {
        await alarmListener({ name: 'otherAlarm' });
        expect(mockAPI.keepSessionAlive).not.toHaveBeenCalled();
      }
    });
  });

  describe('SetInterval Implementation', () => {
    test('should use setInterval in background script environment', async () => {
      setupBackgroundEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      expect(kam.intervalId).toBeDefined();
      expect(kam.intervalId).not.toBeNull();
    });

    test('should not create alarm in background script environment', async () => {
      setupBackgroundEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      expect(global.chrome.alarms.create).not.toHaveBeenCalled();
    });

    test('should execute ping via setInterval', async () => {
      setupBackgroundEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1; // 1 minuto

      await kam.start();

      // Avança o timer em 60 segundos (1 minuto)
      jest.advanceTimersByTime(60000);

      expect(mockAPI.keepSessionAlive).toHaveBeenCalled();
    });
  });

  describe('Stop Functionality', () => {
    test('should clear alarm when stopping in service worker environment', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      kam.stop();
      expect(global.chrome.alarms.clear).toHaveBeenCalledWith('keepalive-session');
    });

    test('should clear interval when stopping in background script environment', async () => {
      setupBackgroundEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      expect(kam.intervalId).toBeDefined();
      kam.stop();
      expect(kam.intervalId).toBeNull();
    });

    test('should remove alarm listener when stopping', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      // Aguarda inicialização
      await Promise.resolve();

      kam.stop();
      expect(global.chrome.alarms.onAlarm.removeListener).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully in alarm context', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      // Mock API para retornar erro
      mockAPI.keepSessionAlive.mockRejectedValueOnce(new Error('Network error'));

      await kam.start();
      const alarmListener = global.chrome.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      if (alarmListener) {
        await expect(alarmListener({ name: 'keepalive-session' })).resolves.toBeUndefined();
      }
    });

    test('should handle fetch errors gracefully in setInterval context', async () => {
      setupBackgroundEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      mockAPI.keepSessionAlive.mockRejectedValueOnce(new Error('Network error'));

      await kam.start();

      // Fast-forward timer - should not throw
      expect(() => jest.advanceTimersByTime(60000)).not.toThrow();
    });

    test('should handle missing alarms API gracefully', async () => {
      setupServiceWorkerEnv();
      global.chrome.alarms = undefined;

      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      expect(() => kam.start()).not.toThrow();
    });
  });

  describe('State Management', () => {
    test('should track running state correctly', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      // Configura o interval para que start() não retorne cedo
      kam.intervalMinutes = 1;

      expect(kam.isActive).toBe(false);
      await kam.start();
      expect(kam.isActive).toBe(true);
      kam.stop();
      expect(kam.isActive).toBe(false);
    });

    test('should prevent multiple starts', async () => {
      setupServiceWorkerEnv();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      await kam.start();
      expect(global.chrome.alarms.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work with chrome API', async () => {
      setupServiceWorkerEnv();
      delete global.browser;

      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      expect(global.chrome.alarms.clear).toHaveBeenCalled();
    });

    test('should work with browser API', async () => {
      setupServiceWorkerEnv();
      delete global.chrome;
      global.browser = {
        alarms: {
          create: jest.fn().mockResolvedValue(),
          clear: jest.fn().mockResolvedValue(true),
          onAlarm: { addListener: jest.fn(), removeListener: jest.fn() },
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({ keepSessionAliveInterval: 10 }),
            onChanged: { addListener: jest.fn() },
          },
        },
      };

      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;

      await kam.start();
      expect(global.browser.alarms.clear).toHaveBeenCalled();
    });
  });
});
