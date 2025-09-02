const { createTargetConfig } = require('./webpack.base');

/**
 * Configuração Webpack para Microsoft Edge Add-ons
 * Otimizada para Edge Add-ons Store e características específicas do Edge
 */

const edgeConfig = createTargetConfig('edge');

// Otimizações específicas para Edge
edgeConfig.optimization.splitChunks.cacheGroups.edgeApi = {
    test: /chrome\.|browser\.|edge\./,
    name: 'edge-api',
    chunks: 'all',
    priority: 15
};

// Performance otimizada para Edge Add-ons Store
edgeConfig.performance = {
    hints: 'warning',
    maxAssetSize: 150000, // 150kb (Edge Store é mais restritivo)
    maxEntrypointSize: 150000,
    assetFilter: function(assetFilename) {
        return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
};

// Edge-specific babel targets
edgeConfig.module.rules[0].use.options.presets[0][1].targets = {
    edge: '88' // Minimum Edge version for Manifest V3
};

// Edge otimizações de compatibilidade
edgeConfig.module.rules[0].use.options.plugins.push(
    ['@babel/plugin-transform-async-to-generator', {
        module: 'bluebird',
        method: 'coroutine'
    }]
);

// Edge tem algumas peculiaridades com service workers
if (process.env.NODE_ENV === 'production') {
    const minimizer = edgeConfig.optimization.minimizer[0];

    // Garante que o objeto terserOptions e compress existam
    if (!minimizer.terserOptions) {
        minimizer.terserOptions = {};
    }
    if (!minimizer.terserOptions.compress) {
        minimizer.terserOptions.compress = {};
    }

    // Edge prefere código menos otimizado para melhor compatibilidade
    minimizer.terserOptions.compress = {
        ...minimizer.terserOptions.compress,
        keep_infinity: true,
        keep_fargs: true,
        keep_fnames: true
    };
}

module.exports = edgeConfig;
