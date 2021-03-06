/**
 * Created by scott on 16-3-31.
 */

'use strict'

const logger = require('log4js').getLogger('release-command')
const webpack = require('webpack')
const util = require('util')
const installCmd = require('brickyard-command-install') // eslint-disable-line
const _ = require('lodash')
const brickyardWebpack = require('brickyard-webpack')

const configMaker = require('./webpack.config')

module.exports = {
    register,
    run,
    config: {
        hashbit: 7,
        lint: false,
        showConfig: false,
        debuggable: false,
        compress: true,
        dev: true
    }
}

/**
 *
 * @param {Command} cmd
 * @param {function(Object)} optionsCallback
 */
function register(cmd, optionsCallback) {
    return cmd
        .alias('r')
        .description('release a program')
        .arguments('<program...>')
        .usage('<program...> [options]')
        .option('--dest <dir>', 'output dir')
        .option('--dest-prefix <prefix>', 'output dir prefix')
        .option('--dest-postfix <postfix>', 'output dir to host actual assets')
        .option('--hashbit <bitlength>', 'fingerprint length of the resources')
        .option('--no-compress', 'if compress the output file')
        .option('--sourcemap', 'output sourcemap')
        .option('--no-lint', 'disable linting the source files')
        .option('--clean', 'clean the release www dir(boolean or path)')
        .option('--debuggable', 'release with debuggable application(Specific for angular)')
        .option('--show-config', 'output the webpack config')
        .action(function (program) {
            const opts = Object.assign({ program: program }, this.opts())
            if (!opts.destPrefix) {
                opts.destPrefix = 'release'
            }
            if (opts.sourcemap === undefined && !opts.compress) {
                opts.sourcemap = true
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

    brickyardWebpack.registerFactory(configMaker.construct)

    process.env.NODE_ENV = 'PRODUCTION'

    const webpackConfig = brickyardWebpack.makeConfig(runtime)

    if (runtime.config.showConfig) {
        console.log(util.inspect(webpackConfig, { depth: 4 }))
    } else {
        installCmd.run(runtime)
            .then(function () {
                logger.info('start webpack building...\n')
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
