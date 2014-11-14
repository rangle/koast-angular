'use strict';
// Abstracts server interaction.
var injections = require('../injections/injections');
var loggerModule = require('../logger/logger');
var tokenKeeperModule = require('./token-keeper');

/**
 * more stuff
 * @module http
 */

var service;

function makeService () {
  var service = {}
  var logger = loggerModule.getService();
  var tokenKeeper = tokenKeeperModule.getService();
  var log = logger.makeLogger('koast.http');

  var options = {
    timeout: 30000 // 30 seconds
  };
  var token = tokenKeeper.loadToken();
  var $q = injections.get('q'); // TODO: rename to 'q'
  var $http = injections.get('http'); // TODO: rename to 'http'

  log.debug('Loaded token', token);

  service.setOptions = function (newOptions) {
    options = newOptions;
  };

  function addTokenHeader() {
    options.headers = options.headers || {};
    if (token) {
      options.headers.Authorization = 'Bearer ' + token;
    }
  };

  service.saveToken = function (tokenData) {
    token = tokenData.token;
    tokenKeeper.saveToken(tokenData);
  };

  service.deleteToken = function (tokenData) {
    tokenKeeper.clear();
  };

  function whenAuthenticated() {
    // ::todo
    return $q.when();
  }

  // Sandwiches a call to the server inbetween checking for things like
  // authentication and post-call error checking.
  function makeServerRequest(caller) {
    return whenAuthenticated()
      // .then(function() {
      //   if (!networkInformation.isOnline) {
      //     throw 'offline';
      //   }
      // })
      .then(function () {
        addTokenHeader();
      })
      .then(caller)
      .then(function (response) {
        service.isReachable = true;
        return response.data ? response.data : response;
      })
      .then(null, function (err) {
        log.warn(err.data || err);
        throw err;
      });
    // .then(null, function(error) {
    //   error = checkErrors(error);
    //   throw error.data? error.data: error;
    // });
  };

  service.post = function (url, data, inputOptions) {
    inputOptions = _.cloneDeep(inputOptions) || options;
    inputOptions.baseUrl = options.baseUrl || '';
    inputOptions.method = 'POST';
    inputOptions.data = data;
    return makeServerRequest(function () {
      var config = _.cloneDeep(inputOptions);
      config.url = inputOptions.baseUrl + url;
      config.params = inputOptions.params;
      return $http(config);
    });
  };

  service.put = function (url, data, inputOptions) {
    inputOptions = _.cloneDeep(inputOptions) || options;
    inputOptions.baseUrl = options.baseUrl || '';
    inputOptions.method = 'PUT';
    inputOptions.data = data;
    return makeServerRequest(function () {
      var config = _.cloneDeep(inputOptions);
      config.url = inputOptions.baseUrl + url;
      config.params = inputOptions.params;

      return $http(config);
    });
  };
  service.get = function (url, inputOptions) {
    inputOptions = _.cloneDeep(inputOptions) || options;
    inputOptions.baseUrl = options.baseUrl || '';
    inputOptions.method = 'GET';
    return makeServerRequest(function () {
      var config = _.cloneDeep(inputOptions);
      config.url = inputOptions.baseUrl + url;
      config.params = inputOptions.params;

      return $http(config);
    });
  };

  return service;
};

exports.getService = function() {
  return service || makeService();
};
