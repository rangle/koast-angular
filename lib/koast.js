angular.module('koast-logger', [])

.factory('_koastLogger', function() {
  var loggerModule = require('./logger/logger');
  return loggerModule.makeLoggerService();
});