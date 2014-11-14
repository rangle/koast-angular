/**
 * @module koast-http/_koastTokenKeeper
 */

'use strict';

console.log('token-keeper');

var loggerModule = require('../logger/logger');
var TOKEN_KEY = 'KoastToken';
var service;

function makeService() {

  service = {};

  var logger = loggerModule.getService();

  var log = logger.makeLogger('koast.token-keeper');
  log.info('Initializing token keeper');

  service.saveToken = function (params) {
    var tokenValue = params.token || params;
    window.localStorage.setItem(TOKEN_KEY, tokenValue);
  };

  service.loadToken = function () {
    return window.localStorage.getItem(TOKEN_KEY);
  };

  service.clear = function () {
    return window.localStorage.removeItem(TOKEN_KEY);
  };

  return service;
};

exports.getService = function() {
  return service || makeService();
};