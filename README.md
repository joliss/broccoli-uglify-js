# broccoli-coffee

[UglifyJS2](https://github.com/mishoo/UglifyJS2) filter for Broccoli.

## Usage

```js
var UglifyJSFilter = require('broccoli-uglify-js')(broccoli);
tree.addTransformer(new UglifyJSFilter);
```

### Options

You can pass a hash of options to the `UglifyJSFilter` constructor, for
instance

```js
new UglifyJSFilter({
  mangle: false
})
```

The following options are supported:

* `mangle` (passed through to UglifyJS): pass `false` to skip mangling names

* `compress` (passed through to UglifyJS): pass `false` to skip compressing;
  pass an object to specify [compressor
  options](http://lisperator.net/uglifyjs/compress)

* `output` (passed through to UglifyJS): pass an object to specify additional
  [output options](http://lisperator.net/uglifyjs/codegen)

## Source Maps

Source maps are not yet supported.
