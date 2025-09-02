const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

/**
 * Configuração base do Webpack para Browser Extensions
 * Shared configuration for Chrome, Firefox, and Edge builds
 */

const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'cheap-module-source-map' : false,

    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(__dirname, '../../'),
            '@ui': path.resolve(__dirname, '../../ui'),
            '@utils': path.resolve(__dirname, '../../utils.js'),
            '@config': path.resolve(__dirname, '../../config')
        }
    },

    module: {
        rules: [
            // JavaScript
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    chrome: '88',
                                    firefox: '91',
                                    edge: '88'
                                },
                                modules: false,
                                useBuiltIns: 'entry',
                                corejs: 3
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-optional-chaining',
                            '@babel/plugin-proposal-nullish-coalescing-operator'
                        ]
                    }
                }
            },

            // CSS
            {
                test: /\.css$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: isDev
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    'tailwindcss',
                                    'autoprefixer',
                                    ...(isProduction ? ['cssnano'] : [])
                                ]
                            }
                        }
                    }
                ]
            },

            // Images
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name].[hash:8][ext]'
                }
            },

            // Fonts
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash:8][ext]'
                }
            }
        ]
    },

    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['**/*'],
            cleanStaleWebpackAssets: false
        }),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.BUILD_TARGET': JSON.stringify(process.env.BUILD_TARGET || 'chrome'),
            '__DEV__': isDev,
            '__PROD__': isProduction
        }),

        new MiniCssExtractPlugin({
            filename: isDev ? '[name].css' : '[name].[contenthash:8].css',
            chunkFilename: isDev ? '[id].css' : '[id].[contenthash:8].css'
        }),

        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../../icons'),
                    to: 'icons',
                    globOptions: {
                        ignore: ['**/.DS_Store']
                    }
                },
                {
                    from: path.resolve(__dirname, '../../node_modules/webextension-polyfill/dist/browser-polyfill.js'),
                    to: 'browser-polyfill.js'
                },
                {
                    from: path.resolve(__dirname, '../../help.html'),
                    to: 'help.html'
                },
                {
                    from: path.resolve(__dirname, '../../sidebar.html'),
                    to: 'sidebar.html'
                },
                {
                    from: path.resolve(__dirname, '../../options.html'),
                    to: 'options.html'
                }
            ]
        })
    ],

    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: isProduction,
                        drop_debugger: isProduction,
                        pure_funcs: isProduction ? ['console.log', 'console.info'] : []
                    },
                    mangle: {
                        safari10: true
                    },
                    format: {
                        comments: false,
                        safari10: true
                    }
                },
                extractComments: false
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true }
                        }
                    ]
                }
            })
        ],

        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    chunks: 'all',
                    priority: 5,
                    reuseExistingChunk: true
                }
            }
        }
    },

    performance: {
        hints: isProduction ? 'warning' : false,
        maxAssetSize: 250000, // 250kb
        maxEntrypointSize: 250000
    },

    stats: {
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
    }
};

// Entry points específicos para browser extensions
const getEntryPoints = (target) => {
    const entries = {
        background: path.resolve(__dirname, '../../background.js'),
        'content-script': path.resolve(__dirname, '../../content-script.js'),
        sidebar: path.resolve(__dirname, '../../sidebar.js'),
        options: path.resolve(__dirname, '../../options.js'),
        help: path.resolve(__dirname, '../../help.js'),
        api: path.resolve(__dirname, '../../api.js'),
        store: path.resolve(__dirname, '../../store.js'),
        utils: path.resolve(__dirname, '../../utils.js'),
        styles: path.resolve(__dirname, '../../src/input.css')
    };

    // UI components
    entries['ui/patient-card'] = path.resolve(__dirname, '../../ui/patient-card.js');
    entries['ui/search'] = path.resolve(__dirname, '../../ui/search.js');

    // Managers
    entries['KeepAliveManager'] = path.resolve(__dirname, '../../KeepAliveManager.js');
    entries['SectionManager'] = path.resolve(__dirname, '../../SectionManager.js');
    entries['TimelineManager'] = path.resolve(__dirname, '../../TimelineManager.js');

    // Configs
    entries['field-config'] = path.resolve(__dirname, '../../field-config.js');
    entries['filter-config'] = path.resolve(__dirname, '../../filter-config.js');

    // Error Handler
    entries['ErrorHandler'] = path.resolve(__dirname, '../../ErrorHandler.js');

    // Renderers
    entries['renderers'] = path.resolve(__dirname, '../../renderers.js');

    return entries;
};

// Função para criar configuração específica do target
const createTargetConfig = (target) => {
    const config = { ...baseConfig };

    config.entry = getEntryPoints(target);
    config.output = {
        path: path.resolve(__dirname, `../../dist/${target}`),
        filename: '[name].js',
        chunkFilename: '[name].[contenthash:8].js',
        clean: true
    };

    // Plugin para copiar manifest específico do target
    let manifestSource;
    if (target === 'edge') {
        manifestSource = path.resolve(__dirname, '../../manifest-edge.json');
    } else if (target === 'firefox') {
        manifestSource = path.resolve(__dirname, '../../manifest-firefox.json');
    } else {
        manifestSource = path.resolve(__dirname, '../../manifest.json');
    }

    config.plugins.push(
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: manifestSource,
                    to: 'manifest.json',
                    transform(content) {
                        const manifest = JSON.parse(content.toString());

                        // Otimizações específicas por target
                        if (target === 'firefox') {
                            // Firefox-specific optimizations
                            if (manifest.manifest_version === 2) {
                                if (!manifest.applications) {
                                    manifest.applications = {
                                        gecko: {
                                            id: 'assistente-regulacao@example.com',
                                            strict_min_version: '91.0'
                                        }
                                    };
                                }
                            }

                            // Remove Chrome-specific keys
                            delete manifest.minimum_chrome_version;
                            delete manifest.key;
                        }

                        if (target === 'edge') {
                            // Edge-specific optimizations
                            // Edge uses Manifest V3 like Chrome, no minimum version needed

                            // Remove other browser keys
                            delete manifest.applications;
                            delete manifest.browser_specific_settings;
                            delete manifest.key;
                        }

                        if (target === 'chrome') {
                            // Chrome-specific optimizations
                            if (!manifest.minimum_chrome_version) {
                                manifest.minimum_chrome_version = '88';
                            }

                            // Remove other browser keys
                            delete manifest.applications;
                            delete manifest.browser_specific_settings;
                            delete manifest.minimum_edge_version;
                        }

                        // Production optimizations
                        if (isProduction) {
                            // Remove development keys
                            delete manifest.key;
                            delete manifest.update_url;
                        }

                        return JSON.stringify(manifest, null, 2);
                    }
                }
            ]
        })
    );

    // Target-specific plugins
    if (target === 'firefox') {
        config.plugins.push(
            new webpack.DefinePlugin({
                'BROWSER_TARGET': JSON.stringify('firefox'),
                'MANIFEST_VERSION': JSON.stringify(2) // ou 3 dependendo do manifest
            })
        );
    }

    if (target === 'chrome') {
        config.plugins.push(
            new webpack.DefinePlugin({
                'BROWSER_TARGET': JSON.stringify('chrome'),
                'MANIFEST_VERSION': JSON.stringify(3)
            })
        );
    }

    if (target === 'edge') {
        config.plugins.push(
            new webpack.DefinePlugin({
                'BROWSER_TARGET': JSON.stringify('edge'),
                'MANIFEST_VERSION': JSON.stringify(3)
            })
        );
    }

    return config;
};

module.exports = {
    baseConfig,
    createTargetConfig,
    getEntryPoints
};
