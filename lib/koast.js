'use strict';

var injections = require('./injections/injections');

function makeAngularModule(name) {
  return angular.module(name, ['koast-setup']);
};

function makeService(module) {
  return function (_koastSetup) {
    return module.getService();
  };
};

angular.module('koast-setup', [])

.factory('_koastSetup', function($q, $http) {
  injections.set('q', $q);
  injections.set('http', $http);
});

makeAngularModule('koast-logger')
  .factory('_koastLogger', makeService(require('./logger/logger')));

makeAngularModule('koast-http')
  .factory('_koastHttp', makeService(require('./http/http')))
  .factory('_koastTokenKeeper', makeService(require('./http/token-keeper')));
