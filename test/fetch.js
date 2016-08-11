'use strict';

const http = require('http');

module.exports = function fetch(path) {
    return new Promise(function(resolve, reject) {
        http.get(path, function(res) {
            if (res.statusCode != 200) {
                reject(res);
            } else {
                let body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });
                res.on('end', function() {
                    res.body = body;
                    resolve(res);
                });
            }
        });
    });
};
