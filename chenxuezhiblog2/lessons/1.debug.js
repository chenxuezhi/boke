
var debug = require('./debug');
var loggerServer = debug('logger:server');

loggerServer('server');
var loggerClient = debug('logger:client');
loggerClient('client');