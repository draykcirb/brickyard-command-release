/**
 * Created by scott on 16-3-31.
 */
'use strict'
const logger = require('log4js').getLogger('release-command')
const configMaker = require('./webpack.config')
const webpack = require('webpack')
const util = require('util')

const installCmd = require('../install')
const _ = require("lodash")

module.exports = {
	register,
	run
}

/**
 *
 * @param {Command} cmd
 * @param {function(Object)} optionsCallback
 */
function register(cmd, optionsCallback) {
	cmd
		.description('release a program')
		.arguments('<program...>')
		.usage('<program...> [options]')
		.option('--dest <dir>', 'output dir')
		.option('--dest-prefix <prefix>', 'output dir prefix')
		.option('--hashbit', 'fingerprint length of the resources')
		.option('--no-compress', 'if compress the output file')
		.option('--clean', 'clean the release www dir(boolean or path)')
		.option('--debuggable', 'release with debuggable application(Specific for angular)')
		.option('--show-config', 'output the webpack config')
		.action(function (program) {
			const opts = Object.assign({ program: program }, this.opts())
			if (!opts.destPrefix) {
				opts.destPrefix = 'release'
			}
			optionsCallback(opts)
		})
}

function run(runtime) {
	logger.trace('dev command running')

	// 无插件退出
	if (_.isEmpty(runtime.plugins)) {
		process.exit(1)
	}

	const webpackConfig = configMaker.make(runtime)
	if (runtime.config.showConfig) {
		console.log(util.inspect(webpackConfig, { depth: 4 }))
	} else {
		installCmd.run(runtime)
			.then(function () {
				webpack(webpackConfig, function (err, stats) {
					if (err) throw err
					logger.info('following is the webpack bundle stats:\n', stats.toString({
						assets: true,
						colors: true,
						version: true,
						hash: true,
						timings: true,
						chunks: false
					}))
				})
			})
			.catch(function (error) {
				logger.error('webpack:build', error)
			})
	}
}
