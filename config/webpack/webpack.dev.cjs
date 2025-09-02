const path = require('path');
const webpack = require('webpack');
const { baseConfig } = require('./webpack.base');

/**
 * Configuração Webpack para Desenvolvimento
 * Otimizada para hot reload e debugging de browser extensions
 */

const devConfig = {
    ...baseConfig,
    mode: 'development',
    devtool: 'cheap-module-source-map',
    
    entry: {
        background: path.resolve(__dirname, '../../background.js'),
        'content-script': path.resolve(__dirname, '../../content-script.js'),
        sidebar: path.resolve(__dirname, '../../sidebar.js'),
        options: path.resolve(__dirname, '../../options.js'),
        help: path.resolve(__dirname, '../../help.js'),
        styles: path.resolve(__dirname, '../../src/input.css'),
        
        // Development-specific entries
        'dev-reload': path.resolve(__dirname, './dev-reload.js')
    },
    
    output: {
        path: path.resolve(__dirname, '../../dist/dev'),
        filename: '[name].js',
        clean: true
    },
    
    plugins: [
        ...baseConfig.plugins,
        
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            '__DEV__': true,
            '__PROD__': false,
            'BROWSER_TARGET': JSON.stringify(process.env.BUILD_TARGET || 'chrome')
        }),
        
        // Hot reload plugin para development
        new webpack.HotModuleReplacementPlugin()
    ],
    
    optimization: {
        minimize: false,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    
    // Watch options para development
    watch: true,
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
        ignored: [
            /node_modules/,
            /dist/,
            /\.git/
        ]
    },
    
    // Development server configuration
    devServer: {
        contentBase: path.resolve(__dirname, '../../dist/dev'),
        compress: true,
        port: 3000,
        hot: true,
        overlay: {
            warnings: true,
            errors: true
        }
    },
    
    stats: {
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
        timings: true
    }
};

module.exports = devConfig;
