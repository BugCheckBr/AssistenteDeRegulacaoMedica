const { createTargetConfig } = require('./webpack.base');

/**
 * Configuração Webpack para Firefox Add-ons (AMO)
 * Otimizada para compatibilidade com Firefox e AMO guidelines
 */

const firefoxConfig = createTargetConfig('firefox');

// Otimizações específicas para Firefox
firefoxConfig.optimization.splitChunks.cacheGroups.firefoxApi = {
    test: /browser\.|webExtensions/,
    name: 'firefox-api',
    chunks: 'all',
    priority: 15
};

// Performance otimizada para AMO
firefoxConfig.performance = {
    hints: 'warning',
    maxAssetSize: 300000, // 300kb (AMO é mais flexível)
    maxEntrypointSize: 300000,
    assetFilter: function(assetFilename) {
        return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
};

// Firefox-specific babel targets
firefoxConfig.module.rules[0].use.options.presets[0][1].targets = {
    firefox: '91' // Minimum Firefox version for modern APIs
};

// Configurações específicas para debugging no Firefox
if (process.env.NODE_ENV === 'development') {
    firefoxConfig.devtool = 'source-map'; // Firefox tem melhor suporte a source maps
}

module.exports = firefoxConfig;
