'use strict';

const fs = require('fs');
const url = require('url');
const path = require('path');
const extend = require('node.extend');
const less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

module.exports = function defineLessConnectMiddleware(root, opt) {
    if (typeof root != 'string') throw new TypeError('[less-connect-middleware] ' +
        'expected `root` arguments to be of type "string", got ', JSON.stringify(root));

    const options = extend(true, {
        less: {
            paths: [],
            compress: false,
            yuicompress: false,
            pre(src) {
                return src
            },
            post(src) {
                return src
            }
        },
        autoprefixer: {
            browsers: [
                'last 1 version',
                'ie 8',
                'ie 9',
                'ie 10',
                'ie 11',
                'Android >= 4'
            ]
        }
    }, opt);

    const prefixer = postcss([autoprefixer(options.autoprefixer)]);

    return function lessConnectMiddleware(req, res, next) {
        const pathname = url.parse(req.url).pathname;
        const lessPath = path.join(root, pathname);

        if (!(req.method.toUpperCase() == 'GET' && pathname.endsWith('.less'))) {
            return next();
        }

        function onError(err) {
            next(err.code == 'ENOENT' ? null : err);
        }

        fs.readFile(lessPath, 'utf8', function(err, src) {
            if (err) return onError(err);
            const lessSrc = options.less.pre(src);

            less.render(lessSrc, options.less, function(err, result) {
                if (err) return onError(err);
                const css = options.less.post(result.css);

                prefixer
                    .process(css)
                    .catch(onError)
                    .then(function(result) {
                        res.setHeader('Content-Type', 'text/css');
                        res.setHeader('Content-Length', result.css.length);
                        res.end(result.css);
                    });
            });
        });
    };
};
