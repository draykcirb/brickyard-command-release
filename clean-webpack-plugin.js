/* eslint no-param-reassign: 1 */
/**
 * Created by scott on 16-6-14.
 *
 * copy and modify from https://github.com/johnagan/clean-webpack-plugin
 */

'use strict'

const os = require('os')
const path = require('path')
const del = require('del')
const logger = require('log4js').getLogger('release-command')

// added node .10
// http://stackoverflow.com/questions/21698906/how-to-check-if-a-path-is-absolute-or-relative/30714706#30714706
function isAbsolute(dir) {
    return path.normalize(dir + path.sep) === path.normalize(path.resolve(dir) + path.sep)
}

function upperCaseWindowsRoot(dir) {
    const splitPath = dir.split(path.sep)
    splitPath[0] = splitPath[0].toUpperCase()
    return splitPath.join(path.sep)
}

function CleanWebpackPlugin(paths, options = {}) {
    if (options.verbose === undefined) {
        options.verbose = process.env.NODE_ENV !== 'test'
    }

    if (options.dry === undefined) {
        options.dry = false
    }

    // determine webpack root
    options.root = options.root || process.cwd()

    // allows for a single string entry
    if (typeof paths === 'string' || paths instanceof String) {
        paths = [paths]
    }

    // store paths and options
    this.paths = paths
    this.options = options
}

CleanWebpackPlugin.prototype.apply = function () {
    const self = this
    const results = []
    let workingDir
    let dirName
    let projectRootDir
    let webpackDir

    // exit if no paths passed in
    if (self.paths === undefined) {
        results.push({ path: self.paths, output: 'nothing to clean' })
        return results
    }

    if (!isAbsolute(self.options.root) && self.options.verbose) {
        logger.warn(`clean-webpack-plugin: ${self.options.root} project root must be an absolute path. Skipping all...`)
        results.push({ path: self.options.root, output: 'project root must be an absolute path' })
        return results
    }

    workingDir = process.cwd()
    dirName = __dirname
    projectRootDir = path.resolve(self.options.root)
    webpackDir = path.dirname(module.parent.filename)

    if (os.platform() === 'win32') {
        workingDir = upperCaseWindowsRoot(workingDir)
        dirName = upperCaseWindowsRoot(dirName)
        projectRootDir = upperCaseWindowsRoot(projectRootDir)
        webpackDir = upperCaseWindowsRoot(webpackDir)
    }

    // preform an rm -rf on each path
    self.paths.forEach(function (delPath) {
        delPath = path.resolve(self.options.root, delPath)

        if (os.platform() === 'win32') {
            delPath = upperCaseWindowsRoot(delPath)
        }

        // disallow deletion any directories outside of root path.
        if (delPath.indexOf(projectRootDir) < 0 && self.options.verbose) {
            logger.warn(`clean-webpack-plugin: ${delPath} is outside of the project root. Skipping...`)
            results.push({ path: delPath, output: 'must be inside the project root' })
            return
        }

        if (delPath === projectRootDir && self.options.verbose) {
            logger.warn(`clean-webpack-plugin: ${delPath} is equal to project root. Skipping...`)
            results.push({ path: delPath, output: 'is equal to project root' })
            return
        }

        if (delPath === webpackDir && self.options.verbose) {
            logger.warn(`clean-webpack-plugin: ${delPath} would delete webpack. Skipping...`)
            results.push({ path: delPath, output: 'would delete webpack' })
            return
        }

        if ((delPath === dirName || delPath === workingDir) && self.options.verbose) {
            logger.log(`clean-webpack-plugin: ${delPath} is working directory. Skipping...`)
            results.push({ path: delPath, output: 'is working directory' })
            return
        }

        if (self.options.dry !== true) {
            del.sync(delPath)
        }

        if (self.options.verbose) {
            logger.info(`clean-webpack-plugin: ${delPath} has been removed.`)
            results.push({ path: delPath, output: 'removed' })
        }
    })

    return results
}

module.exports = CleanWebpackPlugin
