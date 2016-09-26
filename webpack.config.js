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
const CopyWebpackPlugin = require('copy-webpack-plugin')
const SplitByPathPlugin = require('webpack-split-by-path')


module.exports = {
    construct: constructProductionDefaultConfig
}

function constructProductionDefaultConfig(config, defaultConfig) {
    const extractCSS = new ExtractTextPlugin('[name]_[contentHash:8].css', {
        allChunks: true
    })

    const extractSASS = new ExtractTextPlugin('[name]_[contentHash:8].css', {
        allChunks: true
    })

    const webpackConfig = {
        entry: {
            main: [
                'babel-polyfill'
            ]
        },
        output: {
            publicPath: '',
            pathinfo: !config.compress,
            filename: '[name]_[chunkHash:10].js',
            chunkFilename: '[id]-[chunkHash:10].js'
        },
        debug: !config.compress,
        devtool: config.compress ? null : 'cheap-source-map',
        // this is for long term caching
        recordsPath: path.resolve(process.cwd(), '.tmp/webpack-records.json'),
        module: {
            loaders: [
                // website ico
                {
                    test: /favicon.ico$/,
                    loader: 'file?name=[name]_[hash:6].[ext]'
                },
                // pure css
                {
                    test: /\.css$/,
                    loader: extractCSS.extract(['css', 'postcss'])
                },
                // scss
                {
                    test: /\.s[ac]ss$/,
                    loader: extractSASS.extract(['css', 'postcss', 'resolve-url', 'sass?sourceMap'])
                },
                // misc file
                {
                    test: /\.(json|map|wsdl|xsd)$/,
                    loaders: [
                        'file?name=misc/[name]-[hash:8].[ext]'
                    ]
                },
                // music file
                {
                    test: /\.(mp3|wav)$/,
                    loaders: [
                        'file?name=media/[name]-[hash:8].[ext]'
                    ]
                },
                // font file
                {
                    test: /\.(woff|woff2|ttf|eot)(\?.+)?$/,
                    loaders: [
                        'file?name=font/[name]-[hash:8].[ext]'
                    ]
                },
                {
                    test: /\.(svg)(\?.+)$/,
                    loaders: [
                        'file?name=font/[name]-[hash:8].[ext]'
                    ]
                },
                // image file
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loaders: [
                        'file?hash=sha512&digest=hex&name=[name]_[hash:8].[ext]',
                        'image-webpack'
                    ]
                }
            ]
        },
        plugins: [
            new webpack.optimize.OccurrenceOrderPlugin(),
            extractCSS,
            extractSASS,
            new CopyWebpackPlugin([{ from: 'static' }]),
            new SplitByPathPlugin([
                {
                    name: 'vendor',
                    path: [
                        path.join(process.cwd(), 'node_modules'),
                        path.join(config.outputBase, 'bower_components')
                    ]
                }
            ])
        ],
        imageWebpackLoader: {
            progressive: true, // for jpg
            optimizationLevel: 7, // for png
            interlaced: false, // for git
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
