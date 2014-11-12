'use strict';

var fs            = require('fs'),
    path          = require('path'),
    util          = require('util'),
    mkdirp        = require('mkdirp'),
    symlinkOrCopy = require('symlink-or-copy'),
    walkSync      = require('walk-sync'),
    Writer        = require('broccoli-writer'),
    UglifyJS      = require('uglify-js');

module.exports = UglifyJSFiles;

// -- UglifyJSFiles -----------------------------------------------------------

function UglifyJSFiles(inputTree, options) {
    if (!(this instanceof UglifyJSFiles)) {
        return new UglifyJSFiles(inputTree, options);
    }

    this.inputTree = inputTree;
    this.options   = options || {};
}

util.inherits(UglifyJSFiles, Writer);

UglifyJSFiles.prototype.cleanup = function () {
    Writer.prototype.cleanup.apply(this, arguments);
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

            // Keep track of all the JavaScript files.
            // path.extname does not take into account the trailing '/' when
            // checking for the file's extension.
            if (path.extname(relPath) === '.js') {
                files.push(relPath);
                return;
            }

            var srcPath  = path.join(srcDir, relPath),
                destPath = path.join(destDir, relPath);

            // Copy over non-JavaScript files to the `destDir`.
            mkdirp.sync(path.dirname(destPath));
            symlinkOrCopy.sync(srcPath, destPath);
        });

        this.uglify(files, srcDir, destDir);
    }.bind(this));
};

UglifyJSFiles.prototype.uglify = function (filePaths, srcDir, destDir) {
    filePaths.forEach(function (relPath) {
        var srcFile       = path.join(srcDir, relPath);
        var destFile      = path.join(destDir, relPath);
        var origSourceMap = fs.existsSync(srcFile + '.map');

        var config   = {
            mangle: this.options.mangle,
            compress: this.options.compress,
            sourceRoot: path.dirname(srcFile),
            outSourceMap: path.basename(srcFile) + '.map',
            sourceMapIncludeSources: origSourceMap || this.options.sourceMap,
            inSourceMap: origSourceMap && srcFile + '.map'
        };

        var output = UglifyJS.minify(srcFile, config);
        fs.writeFileSync(destFile, output.code, 'utf8');
        if (this.options.sourceMap || config.inSourceMap) {
            fs.writeFileSync(destFile + '.map', output.map, 'utf8');
        }
    }, this);
};
