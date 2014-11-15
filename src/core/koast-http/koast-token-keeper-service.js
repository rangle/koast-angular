'use strict';
var nebular = require('nebular');

/**
 * @module koast-http/_koastTokenKeeper
 */
nebular.module('koast-http')
  .factory('_koastTokenKeeper', ['$log', '$window',
    function ($log, $window) {
      var TOKEN_KEY = 'KoastToken';
      var service = {};
      service.saveToken = function (params) {
        var tokenValue = params.token || params;
        $window.localStorage.setItem(TOKEN_KEY, tokenValue);
      };
      service.loadToken = function () {
        return $window.localStorage.getItem(TOKEN_KEY);
      };
      service.clear = function () {
        return $window.localStorage.removeItem(TOKEN_KEY);
      };

      return service;
    }
  ]);
