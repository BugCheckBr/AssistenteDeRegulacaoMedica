/**
 * Mocks for browser extension APIs (chrome.* and browser.*)
 *
 * This file provides mock implementations for common browser extension APIs
 * to be used in a Jest/JSDOM environment. It helps simulate the behavior
 * of these APIs during unit testing.
 */

global.chrome = {
  runtime: {
    getURL: (path) => `chrome-extension://__MSG_@@extension_id__/${path}`,
    sendMessage: jest.fn((message, callback) => {
      if (callback) {
        callback({});
      }
      return Promise.resolve({});
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({
      manifest_version: 3,
      name: 'Assistente de Regulação Médica',
      version: '3.3.7',
    })),
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
    session: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([{ id: 1, url: 'http://example.com' }])),
    create: jest.fn(() => Promise.resolve({ id: 2 })),
    update: jest.fn(() => Promise.resolve({ id: 1 })),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
  sidePanel: {
    open: jest.fn(() => Promise.resolve()),
    setOptions: jest.fn(() => Promise.resolve()),
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
  contextMenus: {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
};

// For cross-browser compatibility, alias browser to chrome
global.browser = global.chrome;
