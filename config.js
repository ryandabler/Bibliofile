"use strict";

exports.DATABASE_URL = process.env.DATABASE_URL || global.DATABASE_URL || 'mongodb://localhost/bibliofile';
exports.TEST_DATABASE_URL = process.env.DATABASE_URL || global.DATABASE_URL || 'mongodb://localhost/test-bibliofile';
exports.PORT = process.env.PORT || 8080;