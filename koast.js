'use strict';

require('./src/koast');
var nebular = require('nebular');

function makeAngularModule(name) {
  return angular.module(name, ['koast-setup']);
};

// function makeService(module) {
//   return function (_koastSetup) {
//     return module.getService();
//   };
// };

angular.module('koast-setup', [])
  .factory('_koastSetup', function($q, $http, $log, $window, $location, $timeout) {
    nebular.setService('$q', $q);
    nebular.setService('$http', $http);
    nebular.setService('$log', $log);
    nebular.setService('$window', $window);
    nebular.setService('$location', $location);
    nebular.setService('$timeout', $timeout);
    nebular.setService('_', require('lodash'));
    nebular.setAngularUtils(angular);
  });

makeAngularModule('koast')
  .factory('koast', function(_koastSetup) {
    nebular.instantiateService('koast');
    return nebular.getService('koast');
  });

// makeAngularModule('koast-http')
//   .factory('_koastHttp', makeService(require('./http/http')))
//   .factory('_koastTokenKeeper', makeService(require('./http/token-keeper')));
