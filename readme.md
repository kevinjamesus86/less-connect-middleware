**less connect middleware**

[![Build Status](https://travis-ci.org/kevinjamesus86/less-connect-middleware.svg?branch=master)](https://travis-ci.org/kevinjamesus86/less-connect-middleware)


```js
'use strict';

const http = require('http');
const connect = require('connect');
const serveLess = require('less-connect-middleware');

const app = connect();

// Set it up
app.use(
    serveLess({
        // The base (or root) directory from which files will be served
        root: process.cwd(),
        less: {
            // Specifies directories to scan for @import directives when parsing.
            // Default value is the directory of the source file, which is probably what you want
            paths: []
        },
        // See https://github.com/postcss/autoprefixer for more options
        autoprefixer: {
            // Browser queries for vendor prefixing CSS
            // https://github.com/ai/browserslist
            browsers: [
                'ie 9-11',
                'defaults'
            ]
        }
    })
);

// Press go
http.createServer(app).listen(3000);

```
