'use strict';

const fs = require('fs');
const url = require('url');
const path = require('path');
const co = require('co');
const thunk = require('thunkify');
const clonedeep = require('lodash.clonedeep');
const defaultsdeep = require('lodash.defaultsdeep');
const less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// Thunkify for co
const read = thunk(fs.readFile.bind(fs));
const render = thunk(less.render.bind(less));

const defaults = {
    debug: false,
    less: {
        paths: [],
        references: []
    },
    autoprefixer: {
        browsers: [
            'ie 8-11',
            'android >= 4',
            'last 2 versions'
        ]
    }
};

function findOfType(iterable, type) {
    for (const item of iterable) {
        if (item && typeof item == type) return item;
    }
}

module.exports = function defineLessConnectMiddleware() {
    const opts = defaultsdeep({}, findOfType(arguments, 'object'), defaults);
    const root = opts.root || findOfType(arguments, 'string') || process.cwd();
    const prefixer = postcss([autoprefixer(opts.autoprefixer)]);

    return function lessConnectMiddleware(req, res, next) {
        const pathname = url.parse(req.url).pathname;
        const file = path.join(root, pathname);

        // Bail if this isn't a get request for a less file
        if (!(req.method == 'GET' && file.endsWith('.less'))) {
            return next();
        }

        co(handleRequest).catch(function(err) {
            // ENOENT is 404 so we ignore the error
            next(err.code == 'ENOENT' ? null : err);
        });

        function* handleRequest() {
            const lessOpts = clonedeep(opts.less);
            const paths = lessOpts.paths;

            // Add root & file dir to the less paths so relative @import
            // statements don't cause the less compiler to flip out
            paths.unshift(root, path.dirname(file));

            let src = yield read(file, 'utf-8');

            // Add references to less files which may normally
            // be compiled as part of a build task. Perhaps they
            // don't have @import statements for the stuff they depend on :/
            let refs = '';
            for (const ref of lessOpts.references) {
                refs += `@import (reference) "${ref}";\n`;
            }
            src = refs + src;

            let css = yield renderLess(src, lessOpts);
            css = yield prefixCss(css);

            // Ship it
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Content-Length', css.length);
            res.end(css);
        }

        function* renderLess(src, opts) {
            const result = yield less.render(src, opts);
            return result.css;
        }

        function* prefixCss(src) {
            const result = yield autoprefixer.process(src);
            return result.css;
        }
    };
};
