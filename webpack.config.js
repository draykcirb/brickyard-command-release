/**
 * Created by scott on 16-4-5.
 */
'use strict'

const webpack = require('webpack')
const path = require('path')
const url = require('url')
const fs = require('fs')
const _ = require('lodash')
const CleanWebpackPlugin = require('./clean-webpack-plugin')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const SplitByPathPlugin = require('webpack-split-by-path')

const configDefaulter = require('brickyard-command-dev/webpack.config.default')

const extractCSS = new ExtractTextPlugin('static_[contentHash:8].css', {
	disable: false,
	allChunks: true
})

const extractSASS = new ExtractTextPlugin('main_[contentHash:8].css', {
	disable: false,
	allChunks: true
})

module.exports = {
	make: function (runtime) {
		return configDefaulter.make(runtime, constructProductionDefaultConfig)
	}
}

function constructProductionDefaultConfig(config, defaultConfig) {
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
			chunkFilename: "[id]-[chunkHash:10].js"
		},
		debug: !config.compress,
		devtool: config.compress ? null : 'cheap-source-map',
		module: {
			/*preLoaders: [
			 { test: /\.(sass|scss)$/, loader: 'stylelint' },
			 {
			 test: /\.js$/,
			 exclude: /(node_modules|bower_components)/,
			 loaders: ['eslint-loader']
			 }
			 ],*/
			loaders: [
				// website ico
				{
					test: /favicon.ico$/,
					loader: 'file?name=[name]_[hash:6].[ext]'
				},
				// js file
				{
					test: /\.js?$/,
					exclude: /(node_modules|bower_components)/,
					loaders: ['ng-annotate-loader', 'babel-loader']
				},
				// pure css
				{
					test: /\.css$/,
					loader: extractCSS.extract(['css', 'postcss'])
				},
				// scss
				{
					test: /\.scss$/,
					loader: extractSASS.extract(['css', 'postcss', 'resolve-url', 'sass?sourceMap'])
				},
				// html
				{
					test: /\.html$/,
					exclude: /index\.html$/,
					loaders: ['ngtemplate?relativeTo=' + defaultConfig.context, 'html?attrs=link:href img:src source:src']
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
		eslint: {
			emitError: true,
			emitWarning: false,
			quiet: false,
			failOnWarning: false,
			failOnError: true
		},
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
		webpackConfig.plugins.push(new CleanWebpackPlugin(_.isBoolean(config.clean) ? defaultConfig.output.path : config.clean, { verbose: true }))
	}

	return webpackConfig
}
