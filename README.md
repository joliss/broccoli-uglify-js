# broccoli-uglify-js

[UglifyJS2](https://github.com/mishoo/UglifyJS2) filter for Broccoli.

## Installation

```bash
npm install --save-dev broccoli-uglify-js
```

## Usage

```js
var uglifyJavaScript = require('broccoli-uglify-js');
tree = uglifyJavaScript(tree, options);
```

### Options

The following options are supported:

* `mangle` (passed through to UglifyJS): pass `false` to skip mangling names

* `compress` (passed through to UglifyJS): pass `false` to skip compressing;
  pass an object to specify [compressor
  options](http://lisperator.net/uglifyjs/compress)

* `output` (passed through to UglifyJS): pass an object to specify additional
  [output options](http://lisperator.net/uglifyjs/codegen)

* `sourceMap`: boolean value (default to `false`) to produce the source map. If an existing
  map file (e.g.: `<filename>.js.map`) is detected for the file to uglify, it will
  be carry on, and the new version of the map will be produced.

## To Do

* Enable `ascii_only` by default
