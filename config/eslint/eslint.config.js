import js from '@eslint/js';
import globals from 'globals';

/**
 * Base ESLint Configuration for Browser Extension
 * Medical Data Compliance & Security Focused
 */

export default [
  // Base JavaScript rules
  js.configs.recommended,

  {
    // Global ignores
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-zips/**',
      'coverage/**',
      '.nyc_output/**',
      'docs/**',
      '**/*.bat',
      '**/*.sh',
      'config/webpack/**',
      'config/jest/**',
      'test/setup.js', // Ignoring for now due to 'global' and 'process' errors
    ],
  },

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        // Browser extension APIs
        chrome: 'readonly',
        browser: 'readonly',
        // Medical extension specific
        AssistenteRegulacao: 'writable',
      },
    },

    rules: {
      // Code Quality
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'off', // Allow console for extension debugging
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-functions': 'off',

      // Security Rules - Critical for Medical Data
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-global-assign': 'error',
      'no-proto': 'error',

      // Medical Data Protection
      'no-alert': 'warn', // Permitimos alertas no SectionManager apenas com disable-next-line
      'no-debugger': 'error', // No debugger in production

      // Extension Specific
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-shadow': 'warn',

      // Async/Await Best Practices
      'prefer-promise-reject-errors': 'error',
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',

      // Medical Extension Compliance
      'no-mixed-spaces-and-tabs': 'error',
      indent: ['error', 2],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
    },

    files: ['**/*.js'],
  },

  // Node.js scripts configuration
  {
    files: [
      'scripts/**/*.js',
      'release.js',
      '*.config.js',
      'tailwind.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-process-exit': 'off',
    },
  },

  // CommonJS files configuration
  {
    files: ['**/*.cjs', 'postcss.config.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Browser Extension Specific Rules
  {
    files: ['background.js', 'content-script.js', 'sidebar.js'],
    rules: {
      // Extension API usage
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'Use browser/chrome API instead of window in extension context',
        },
      ],

      // Medical data security
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='console'][callee.property.name=/^(log|info|warn|error)$/] > Literal[value=/(?:cpf|sus|cns|password|token|auth)/i]",
          message: 'Do not log sensitive medical data',
        },
        {
          selector: "CallExpression[callee.name='eval']",
          message: 'eval() is forbidden in medical extensions for security',
        },
      ],
    },
  },

  // Content Script Specific
  {
    files: ['content-script.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        document: 'readonly',
        window: 'readonly',
        location: 'readonly',
      },
    },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'write',
          message: 'document.write can introduce XSS vulnerabilities',
        },
        {
          property: 'innerHTML',
          message: 'innerHTML can introduce XSS - use textContent or secure methods',
        },
      ],
    },
  },

  // API and Data Handling
  {
    files: ['api.js', 'store.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='localStorage']",
          message: 'Use browser.storage.session for medical data instead of localStorage',
        },
        {
          selector:
            "CallExpression[callee.object.name='JSON'][callee.property.name='stringify'] > MemberExpression[property.name=/(?:cpf|sus|cns|password)/i]",
          message: 'Do not serialize sensitive medical data without sanitization',
        },
      ],

      // Require error handling for API calls
      'prefer-promise-reject-errors': 'error',
      'no-throw-literal': 'error',
    },
  },

  // Test Files
  {
    files: ['test/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node, // Add Node.js globals for test environment
        global: 'writable', // Jest global object
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in tests
      'no-unused-expressions': 'off', // Allow expect statements
    },
  },

  // Prettier integration - deve ser o último para garantir que as regras do Prettier sobrescrevam as do ESLint
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      // Desativamos regras que podem entrar em conflito com o Prettier
      indent: 'off',
      'quote-props': 'off',
      quotes: 'off',
      'brace-style': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'arrow-parens': 'off',
      'comma-dangle': 'off',
      'computed-property-spacing': 'off',
      'max-len': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'no-multi-spaces': 'off',
      'space-before-function-paren': 'off',
      'keyword-spacing': 'off',
    },
  },
];
