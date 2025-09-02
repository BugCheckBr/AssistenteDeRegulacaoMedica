/**
 * @jest-environment node
 */
/**
 * Unit Tests for KeepAliveManager
 * Tests the hybrid alarms/setInterval implementation for service worker compatibility
 */

import { jest } from '@jest/globals';
import { TestStoreCleanup } from '../utils/test-infrastructure.js';

// Mock inline antes de qualquer import
jest.doMock('../../ErrorHandler.js', () => ({
  getErrorHandler: jest.fn(() => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarning: jest.fn(),
    setupGlobalErrorHandling: jest.fn(),
  })),
}));

jest.doMock('../../api.js', () => ({
  keepSessionAlive: jest.fn().mockResolvedValue(true),
}));

let originalDocument;
let originalWindow;

beforeEach(() => {
  // Use standardized test infrastructure
  TestStoreCleanup.cleanup();
  TestStoreCleanup.mockBrowserAPIs();

  // Store originals for service worker simulation
  originalDocument = global.document;
  originalWindow = global.window;

  // Mock timer functions
  jest.useFakeTimers();

  // Enhanced chrome.alarms mock
  global.chrome.alarms = {
    create: jest.fn().mockResolvedValue(),
    clear: jest.fn().mockResolvedValue(true),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  };

  // Enhanced chrome.storage mock for KeepAliveManager settings
  global.chrome.storage.sync = {
    get: jest.fn().mockResolvedValue({ keepSessionAliveInterval: 10 }),
    set: jest.fn().mockResolvedValue(),
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  };

  // Enhanced window mock for background scripts
  global.window = {
    ...originalWindow,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  // Enhanced document mock
  global.document = {
    ...originalDocument,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  // Mock fetch
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
});

afterEach(() => {
  // Use standardized cleanup
  TestStoreCleanup.cleanup();
  jest.clearAllMocks();
  jest.useRealTimers();

  // Restore original globals
  global.document = originalDocument;
  global.window = originalWindow;
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
    global.document = originalDocument || { addEventListener: jest.fn() };
    global.window = originalWindow || { addEventListener: jest.fn() };
    global.importScripts = jest.fn();
  }

  describe('Service Worker Detection', () => {
    test('should detect service worker environment when importScripts is undefined', () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.detectServiceWorkerEnvironment()).toBe(true);
    });

    test('should detect background script environment when importScripts exists', () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.detectServiceWorkerEnvironment()).toBe(false);
    });
  });

  describe('Alarms API Implementation', () => {
    test('should create alarm when starting in service worker environment', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.chrome.alarms.create).toHaveBeenCalledWith(
        'keepalive-session',
        expect.objectContaining({ periodInMinutes: expect.any(Number) })
      );
    });

    test('should setup alarm listener when starting in service worker environment', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');

      const kam = new KeepAliveManager();
      await kam.initPromise; // Aguarda a inicialização

      expect(global.chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
    });

    test('should clear existing alarm before creating new one', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.chrome.alarms.clear).toHaveBeenCalledWith('keepalive-session');
      expect(global.chrome.alarms.create).toHaveBeenCalled();
    });

    test('should handle alarm events correctly', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      // Spy no método executeKeepAlive ao invés de testar fetch
      const executeKeepAliveSpy = jest.spyOn(kam, 'executeKeepAlive').mockResolvedValue();

      await kam.start();
      const alarmListener = global.chrome.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      if (alarmListener) {
        await alarmListener({ name: 'keepalive-session' });
        expect(executeKeepAliveSpy).toHaveBeenCalled();
      }
    });

    test('should ignore non-keepAlive alarms', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      const alarmListener = global.chrome.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      global.fetch = jest.fn();
      if (alarmListener) {
        await alarmListener({ name: 'otherAlarm' });
        expect(global.fetch).not.toHaveBeenCalled();
      }
    });
  });

  describe('SetInterval Implementation', () => {
    test('should use setInterval in background script environment', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1; // Garante que não será 0
      await kam.start();
      expect(kam.intervalId).toBeDefined();
      expect(kam.intervalId).not.toBeNull();
    });

    test('should not create alarm in background script environment', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;
      await kam.start();
      expect(global.chrome.alarms.create).not.toHaveBeenCalled();
    });

    test('should execute ping via setInterval', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.initPromise; // Aguarda a inicialização

      // Spy no método executeKeepAlive ANTES de start()
      const executeKeepAliveSpy = jest.spyOn(kam, 'executeKeepAlive').mockResolvedValue();

      kam.intervalMinutes = 1; // 1 minuto
      await kam.start();

      // Executa apenas os timers pendentes ao invés de avançar o tempo
      jest.runOnlyPendingTimers();
      expect(executeKeepAliveSpy).toHaveBeenCalled();
    });
  });

  describe('Stop Functionality', () => {
    test('should clear alarm when stopping in service worker environment', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      kam.stop();
      expect(global.chrome.alarms.clear).toHaveBeenCalledWith('keepalive-session');
    });

    test('should clear interval when stopping in background script environment', async () => {
      setupBackgroundEnv();
      jest.resetModules();
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
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();

      await kam.initPromise; // Aguarda a inicialização

      // Agora para o KeepAliveManager
      kam.stop();
      expect(global.chrome.alarms.onAlarm.removeListener).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully in alarm context', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await kam.start();
      const alarmListener = global.chrome.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      if (alarmListener) {
        await expect(alarmListener({ name: 'keepalive-session' })).resolves.toBeUndefined();
      }
    });

    test('should handle fetch errors gracefully in setInterval context', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await kam.start();
      // Fast-forward timer - should not throw
      expect(() => jest.advanceTimersByTime(60000)).not.toThrow();
    });

    test('should handle missing alarms API gracefully', async () => {
      setupServiceWorkerEnv();
      global.chrome.alarms = undefined;
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(() => kam.start()).not.toThrow();
    });
  });

  describe('State Management', () => {
    test('should track running state correctly', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
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
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.initPromise;
      kam.intervalMinutes = 1; // Garante que não será 0

      await kam.start();
      await kam.start();
      expect(global.chrome.alarms.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work with chrome API', async () => {
      setupServiceWorkerEnv();
      delete global.browser;
      // Garante que chrome.alarms existe
      global.chrome.alarms = {
        create: jest.fn().mockResolvedValue(),
        clear: jest.fn().mockResolvedValue(true),
        onAlarm: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      };
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.intervalMinutes = 1;
      await kam.start();
      expect(global.chrome.alarms.clear).toHaveBeenCalled();
    });

    test('should work with browser API', async () => {
      setupServiceWorkerEnv();

      // Correção: Clona o objeto chrome para o browser e DEPOIS deleta o chrome.
      // Isso garante que o mock do 'browser' tenha todas as APIs necessárias (storage, etc.)
      global.browser = { ...global.chrome };
      delete global.chrome;

      jest.resetModules();
      const { KeepAliveManager: FreshManager } = require('../../KeepAliveManager.js');
      const freshManager = new FreshManager();
      await freshManager.initPromise; // Aguarda a inicialização
      await freshManager.start();
      expect(global.browser.alarms.clear).toHaveBeenCalled();
    });
  });
});
