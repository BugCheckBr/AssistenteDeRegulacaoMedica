const { createTargetConfig } = require('./webpack.base');

/**
 * Configuração Webpack para Chrome Web Store
 * Otimizada para Manifest V3 e características específicas do Chrome
 */

const chromeConfig = createTargetConfig('chrome');

// Otimizações específicas para Chrome
chromeConfig.optimization.splitChunks.cacheGroups.chromeApi = {
    test: /chrome\.|browser\./,
    name: 'chrome-api',
    chunks: 'all',
    priority: 15
};

// Performance otimizada para Chrome Web Store
chromeConfig.performance = {
    hints: 'warning',
    maxAssetSize: 200000, // 200kb (Chrome Web Store limit)
    maxEntrypointSize: 200000,
    assetFilter: function(assetFilename) {
        return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
};

// Chrome-specific babel targets
chromeConfig.module.rules[0].use.options.presets[0][1].targets = {
    chrome: '88' // Minimum Chrome version for Manifest V3
};

// Service Worker específico para Chrome
chromeConfig.entry['service-worker'] = chromeConfig.entry.background;
delete chromeConfig.entry.background;

module.exports = chromeConfig;
