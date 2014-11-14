'use strict';

var fs            = require('fs'),
    path          = require('path'),
    util          = require('util'),
    mkdirp        = require('mkdirp'),
    quickTemp     = require('quick-temp'),
    symlinkOrCopy = require('symlink-or-copy'),
    walkSync      = require('walk-sync'),
    helpers       = require('broccoli-kitchen-sink-helpers'),
    Writer        = require('broccoli-writer'),
    UglifyJS      = require('uglify-js');

module.exports = UglifyJSFiles;

// -----------------------------------------------------------------------------

var hashFile    = helpers.hashTree;
var hashStrings = helpers.hashStrings;

// -- UglifyJSFiles -----------------------------------------------------------

function UglifyJSFiles(inputTree, options) {
    if (!(this instanceof UglifyJSFiles)) {
        return new UglifyJSFiles(inputTree, options);
    }

    this.inputTree = inputTree;
    this.options   = options || {};

    this._cache      = {};
}

util.inherits(UglifyJSFiles, Writer);

UglifyJSFiles.prototype.cleanup = function () {
    quickTemp.remove(this, 'tmpCacheDir');
    Writer.prototype.cleanup.apply(this, arguments);
};

UglifyJSFiles.prototype.getCacheDir = function () {
    return quickTemp.makeOrReuse(this, 'tmpCacheDir');
};

UglifyJSFiles.prototype.write = function (readTree, destDir) {
    // Creates the output dir.
    mkdirp.sync(destDir);

    return readTree(this.inputTree).then(function (srcDir) {
        var files = [];

        walkSync(srcDir).forEach(function (relPath) {
            // Skip doing anything with dir entries.
            if (relPath.charAt(relPath.length - 1) === '/') {
                return;
            }

            var srcPath  = path.join(srcDir, relPath);
            var destPath = path.join(destDir, relPath);
            var hashValue;

            // Copy over non-JavaScript files to the `destDir`.
            mkdirp.sync(path.dirname(destPath));
            symlinkOrCopy.sync(srcPath, destPath);

            // Keep track of all the JavaScript files if there is not a valid
            // cache entry for the source file.
            if (path.extname(relPath) === '.js') {
                hashValue = hashStrings([srcPath, hashFile(srcPath)]);
                if (!this._cache[srcPath] || this._cache[srcPath].hashValue !== hashValue) {
                    files.push(relPath);
                    this._cache[srcPath] = {
                        hashValue: hashValue,
                        relDestPath: path.join(path.dirname(relPath), path.basename(relPath, '.js') + '.min.js')
                    };
                } else {
                    this.copyFromCache(this._cache[srcPath], destDir);
                }
            }
        }, this);

        this.uglifyAndCache(files, srcDir, destDir);
    }.bind(this));
};

UglifyJSFiles.prototype.uglifyAndCache = function (filePaths, srcDir, destDir) {
    filePaths.forEach(function (relPath) {
        var srcPath       = path.join(srcDir, relPath);
        var cacheEntry    = this._cache[srcPath];
        var cacheDir      = this.getCacheDir();
        var cachePath     = path.join(cacheDir, cacheEntry.hashValue);
        var origSourceMap = fs.existsSync(srcPath + '.map');

        var config = {
            mangle: this.options.mangle,
            compress: this.options.compress,
            sourceRoot: path.dirname(srcPath),
            outSourceMap: path.basename(cacheEntry.relDestPath) + '.map',
            sourceMapIncludeSources: origSourceMap,
            inSourceMap: origSourceMap && srcPath + '.map'
        };

        var output = UglifyJS.minify(srcPath, config);
        fs.writeFileSync(cachePath + '.js',  output.code, 'utf8');
        fs.writeFileSync(cachePath + '.map', output.map,  'utf8');

        this.copyFromCache(cacheEntry, destDir);
    }, this);
};

UglifyJSFiles.prototype.copyFromCache = function (cacheEntry, destDir) {
    var cacheDir  = this.getCacheDir();
    var cachePath = path.join(cacheDir, cacheEntry.hashValue);
    var destPath  = path.join(destDir, cacheEntry.relDestPath);

    mkdirp.sync(path.dirname(destPath));
    symlinkOrCopy.sync(cachePath + '.js', destPath);
    symlinkOrCopy.sync(cachePath + '.map', destPath + '.map');
};
