'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const connect = require('connect');
const portfinder = require('portfinder');
const middleware = require('../index');

describe('less-connect-middleware', function() {
    let app;
    let server;
    let port;

    function assertEqualsFile(expected, file) {
        const filepath = path.join(__dirname, file);
        assert.equal(expected, fs.readFileSync(filepath, 'utf-8'));
    }

    function fetch(path) {
        return require('./fetch')('http://localhost:' + port + '/' + path);
    }

    beforeEach(function(done) {
        app = connect();
        portfinder.getPort(function(err, ret) {
            if (err) {
                done(err);
            } else {
                port = ret;
                server = http.createServer(app);
                server.listen(port, done);
            }
        });
    });

    afterEach(function(done) {
        app = null;
        if (server) {
            server.close(done);
            server = null;
        } else {
            done();
        }
    });

    it('throws when `root` is not a string', function() {
        assert.throws(function() {
            app.use(middleware());
        });
    });

    it('serves files relative to the root path', function() {
        app.use(middleware(__dirname));
        return fetch('less/200.less').then(function(res) {
            assert.equal(200, res.statusCode);
        });
    });

    it('calls `next()` when file is not found', function() {
        app.use(middleware(__dirname));
        app.use(function(req, res) {
            res.statusCode = 404;
            res.end();
        });
        return fetch('less/404.less').catch(function(res) {
            assert.equal(404, res.statusCode);
        });
    });

    it('adds vendor prefixes', function() {
        app.use(middleware(__dirname));
        return fetch('less/prefix.less').then(function(res) {
            assert.equal(200, res.statusCode);
            assertEqualsFile(res.body, 'css/prefix.css');
        });
    });
});
