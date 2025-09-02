/**
 * Jest Unit Test Configuration
 * Medical Extension Testing with Security Focus
 */

module.exports = {
  displayName: 'Unit Tests',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test/unit/**/*.test.js',
    '<rootDir>/test/unit/**/*.spec.js'
  ],
  rootDir: '../../',

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!dist/**',
    '!coverage/**',
    '!test/**',
    '!scripts/**',
    '!config/**',
        '!*.config.js'
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^./ErrorHandler.js$': '<rootDir>/test/mocks/error-handler-mock.js',
    '^../../ErrorHandler.js$': '<rootDir>/test/mocks/error-handler-mock.js',
    '^./api.js$': '<rootDir>/test/mocks/api-mock.js',
    '^../../api.js$': '<rootDir>/test/mocks/api-mock.js'
  },

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

  // Mock configuration for browser APIs - moved to setupFilesAfterEnv
  // setupFiles: ['<rootDir>/test/mocks/browser-mocks.js'],

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
