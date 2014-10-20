/* global angular */

angular.module('koast', ['koast-user', 'koast-resource']).run(function () {
  if (typeof _ === typeof undefined) {
    throw new Error(
      '_ is undefined. koast-angular requires underscore or lodash to be loaded'
    );
  }
})

// The public service for use by the developer.
.factory('koast', ['_koastUser', '_koastResourceGetter', '$log',
  '_koastHttp',
  function (koastUser, koastResourceGetter, $log, _koastHttp) {
    'use strict';
    var service = {};
    var resourceGetterMethodsToCopy = [
      'setApiUriPrefix',
      'getResource',
      'createResource',
      'queryForResources',
      'addEndpoint'
    ];

    // For koastUser, we just attach the service as a field.
    service.user = koastUser;

    // For koastResourceGetter we basically copy all the methods except init.
    resourceGetterMethodsToCopy.forEach(function (functionName) {
      service[functionName] = koastResourceGetter[functionName];
    });

    service.init = function (options) {


      $log.info('Initializing koast.');
      _koastHttp.setOptions(options);
      koastUser.init(options);
      koastResourceGetter.init(options);

    };

    return service;
  }
]);
