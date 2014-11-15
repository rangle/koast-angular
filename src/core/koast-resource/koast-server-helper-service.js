var nebular = require('nebular');

/**
 * @module koast-resource/_KoastServerHelper
 */
nebular.module('koast-resource')
  .factory('_KoastServerHelper', ['_koastUser', '_koastTokenKeeper',
    function (user, _koastTokenKeeper) {
      'use strict';
      var service = {};

      service.addAuthHeaders = function (headers) {

        if (user.isSignedIn) {
          headers['koast-auth-token'] = user.meta.token;
          headers['koast-auth-token-timestamp'] = user.meta.timestamp;
          headers['koast-user'] = angular.toJson(user.data);

        }
        headers['Authorization'] = 'Bearer ' + _koastTokenKeeper.loadToken();
      };
      return service;
    }
  ]);