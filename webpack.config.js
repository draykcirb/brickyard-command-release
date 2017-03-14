/**
 * Created by scott on 16-4-5.
 */
/* eslint import/no-unresolved:0 */

'use strict'

const webpack = require('webpack')
const path = require('path')
const _ = require('lodash')
const CleanWebpackPlugin = require('./clean-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    construct: constructProductionDefaultConfig
}

function constructProductionDefaultConfig(config, defaultConfig) {
    const extractCSS = new ExtractTextPlugin({
        filename: 'static_[contentHash:8].css',
        allChunks: true
    })

    const extractSASS = new ExtractTextPlugin({
        filename: '[name]_[contentHash:8].css',
        allChunks: true
    })

    const webpackConfig = {
        output: {
            publicPath: '',
            pathinfo: !config.compress,
            filename: '[name]_[chunkHash:10].js',
            chunkFilename: '[id]-[chunkHash:10].js'
        },
        devtool: config.sourcemap ? 'source-map' : false,
        // this is for long term caching
        recordsPath: path.resolve(process.cwd(), '.tmp/webpack-records.json'),
        module: {
            rules: [
                // website ico
                {
                    test: /favicon.ico$/,
                    loader: 'file-loader?name=[name]_[hash:6].[ext]'
                },
                // pure css
                {
                    test: /\.css$/,
                    loader: extractCSS.extract(['css-loader', 'postcss-loader'])
                },
                // scss
                {
                    test: /\.s[ac]ss$/,
                    loader: extractSASS.extract(['css-loader', 'postcss-loader', 'resolve-url-loader', 'sass-loader?sourceMap'])
                },
                // misc file
                {
                    test: /\.(json|map|wsdl|xsd)$/,
                    loaders: [
                        'file-loader?name=misc/[name]-[hash:8].[ext]'
                    ]
                },
                // music file
                {
                    test: /\.(mp3|wav)$/,
                    loaders: [
                        'file-loader?name=media/[name]-[hash:8].[ext]'
                    ]
                },
                // font file
                {
                    test: /\.(woff|woff2|ttf|eot)(\?.+)?$/,
                    loaders: [
                        'file-loader?name=font/[name]-[hash:8].[ext]'
                    ]
                },
                {
                    test: /\.(svg)(\?.+)$/,
                    loaders: [
                        'file-loader?name=font/[name]-[hash:8].[ext]'
                    ]
                },
                // image file
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loaders: [
                        'file-loader?hash=sha512&digest=hex&name=[name]_[hash:8].[ext]',
                        {
                            loader: 'image-webpack-loader',
                            query: {
                                progressive: true, // for jpg
                                optimizationLevel: 7, // for png
                                interlaced: false, // for gif
                                svgo: {
                                    plugins: [
                                        {
                                            cleanupIDs: false
                                        }
                                    ]
                                }, // for svg
                                pngquant: { quality: '65-90', speed: 4 }
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new webpack.optimize.OccurrenceOrderPlugin(),
            extractCSS,
            extractSASS,
            new webpack.LoaderOptionsPlugin({
                debug: !config.compress
            })
            // new webpack.optimize.CommonsChunkPlugin('manifest', '[name]_[hash:10].js'),
            /* new webpack.optimize.CommonsChunkPlugin({
                name: 'vendor',
                filename: '[name]_[hash:10].js',
                minChunks: (mod) => {
                    if (typeof mod.userRequest !== 'string') {
                        return false
                    }

                    let isThirdParty = mod.userRequest.indexOf('node_modules') !== -1
                        || mod.userRequest.indexOf('bower_components') !== -1

                    return !isThirdParty
                }
            })*/
        ]
    }

    if (config.compress) {
        webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }))
    }

    if (config.clean) {
        webpackConfig.plugins.push(
            new CleanWebpackPlugin(
                _.isBoolean(config.clean) ? defaultConfig.output.path : config.clean,
                { verbose: true }
            )
        )
    }

    return webpackConfig
}
