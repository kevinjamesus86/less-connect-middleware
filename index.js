'use strict';

const url = require('url');
const path = require('path');
const co = require('co');
const thunk = require('thunkify');
const clone = require('lodash.clonedeep');
const defaultsdeep = require('lodash.defaultsdeep');
const less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const read = thunk(require('fs').readFile);

const defaults = {
    root: process.cwd(),
    less: {
        paths: []
    },
    autoprefixer: {
        browsers: [
            'ie 8-11',
            'android >= 4',
            'last 2 versions'
        ]
    }
};

module.exports = function defineLessConnectMiddleware(options) {
    const opts = defaultsdeep({}, clone(options), defaults);
    const prefixer = postcss([autoprefixer(opts.autoprefixer)]);

    return function lessConnectMiddleware(req, res, next) {
        const pathname = url.parse(req.url).pathname;
        const file = path.join(opts.root, pathname);

        // Bail if this isn't a get request for a less file
        if (!(req.method == 'GET' && file.endsWith('.less'))) {
            return next();
        }

        co(handleRequest).catch(function(err) {
            // ENOENT is 404 so we ignore the error
            next(err.code == 'ENOENT' ? null : err);
        });

        function* handleRequest() {
            const css = yield render(file, opts.less);
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Content-Length', css.length);
            res.end(css);
        }

        function* render(file, opts) {
            opts = clone(opts);
            opts.paths.push(path.dirname(file));
            const src = yield read(file, 'utf8');
            const ret = yield less.render(src, opts);
            return yield prefix(ret.css);
        }

        function* prefix(css) {
            const ret = yield prefixer.process(css);
            return ret.css;
        }
    };
};
