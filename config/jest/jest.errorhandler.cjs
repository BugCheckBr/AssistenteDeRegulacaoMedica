/**
 * Jest Configuration for ErrorHandler Unit Tests
 * Custom config without module mapping to test real ErrorHandler
 */

module.exports = {
  displayName: 'ErrorHandler Unit Tests',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test/unit/ErrorHandler.test.js'
  ],
  rootDir: '../../',

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'ErrorHandler.js'
  ],
  coverageDirectory: '<rootDir>/coverage/errorhandler',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    'ErrorHandler.js': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // NO module mapping - we want to test the real ErrorHandler
  moduleNameMapper: {},

  // Globals for browser extension
  globals: {
    chrome: {},
    browser: {},
    AssistenteRegulacao: {}
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Test timeout for async operations
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output for medical compliance tracking
  verbose: true,

  // Error on deprecated features
  errorOnDeprecated: true,

  // Medical data security testing
  reporters: [
    'default'
  ]
};
