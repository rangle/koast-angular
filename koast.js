'use strict';

var nebular = require('nebular');
var loggerModule = require('./src/core/koast-logger/koast-logger-service');

// var injections = require('./injections/injections');

// function makeAngularModule(name) {
//   return angular.module(name, ['koast-setup']);
// };

// function makeService(module) {
//   return function (_koastSetup) {
//     return module.getService();
//   };
// };

angular.module('koast-setup', [])
  .factory('_koastSetup', function($q, $http) {
    nebular.setService('q', $q);
    nebular.setService('http', $http);
    return nebular.instantiateService('_koastLogger');
  });

makeAngularModule('koast-logger')
  .factory('_koastLogger', function() {
    return nebular.getService('_koastLogger');
  });

// makeAngularModule('koast-http')
//   .factory('_koastHttp', makeService(require('./http/http')))
//   .factory('_koastTokenKeeper', makeService(require('./http/token-keeper')));
