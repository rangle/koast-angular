/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var injections = __webpack_require__(1);

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
	  .factory('_koastLogger', makeService(__webpack_require__(2)));

	makeAngularModule('koast-http')
	  .factory('_koastHttp', makeService(__webpack_require__(3)))
	  .factory('_koastTokenKeeper', makeService(__webpack_require__(4)));

	console.log('124');

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	
	var injections = {};
	exports.set = function(key, value) {
	  console.log('setting ', key);
	  injections[key] = value;
	};
	exports.get = function(key) {
	  return injections[key];
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* global angular */
	'use strict';
	// Logging with a few extra bells and whistles.
	//

	/**
	 * @service koast-logger
	 */

	console.log('logger loaded');

	var injections = __webpack_require__(1);

	console.log('inj:', injections);
	console.log('q:', injections.get('q'));

	var service;

	function makeService() {

	  service = {};

	  service.levels = {
	    debug: 1,
	    verbose: 2,
	    info: 3,
	    warn: 4,
	    error: 5
	  };

	  var logLevel = 3;
	  service.colors = {};
	  service.setLogLevel = function (newLevel) {
	    logLevel = newLevel;
	  };

	  function log(options, groupOptions, values) {
	    options = arguments[0] || {};

	    if (options.level && options.level < logLevel) {
	      return;
	    }

	    var color = options.color || 'black';
	    var args = [];
	    var noMoreColors = false;
	    values = Array.prototype.slice.call(values, 0);
	    var colored = [];
	    if (typeof values[0] === 'string') {
	      colored.push('%c' + values.shift());
	      args.push('color:' + color + ';');
	    }

	    if (groupOptions.groupName) {
	      colored.unshift('%c[' + groupOptions.groupName + ']');
	      args.unshift('color:gray;');
	    }
	    if (options.symbol) {
	      colored.unshift('%c' + options.symbol);
	      args.unshift('color:' + color +
	        ';font-weight:bold;font-size:150%;');
	    }
	    args.unshift(colored.join(' '));
	    args = args.concat(values);
	    Function.prototype.apply.call(console.log, console, args);
	  }

	  function makeLoggerFunction(options) {
	    options.level = service.levels[options.name];
	    return function (groupOptions, args) {
	      log(options, groupOptions, args);
	    };
	  }

	  var logFunctions = {
	    debug: makeLoggerFunction({
	      name: 'debug',
	      color: 'gray',
	      symbol: '✍'
	    }),
	    verbose: makeLoggerFunction({
	      name: 'verbose',
	      color: 'cyan',
	      symbol: '☞'
	    }),
	    info: makeLoggerFunction({
	      name: 'info',
	      color: '#0074D9',
	      symbol: '☞'
	    }),
	    warn: makeLoggerFunction({
	      name: 'warn',
	      color: 'orange',
	      symbol: '⚐'
	    }),
	    error: makeLoggerFunction({
	      name: 'error',
	      color: 'red',
	      symbol: '⚑'
	    }),
	  };

	  var methodNames = ['debug', 'verbose', 'info', 'warn', 'error'];

	  service.makeLogger = function (options) {
	    var logger = {};
	    if (typeof options === 'string') {
	      options = {
	        groupName: options
	      };
	    }
	    logger.options = options;
	    methodNames.forEach(function (methodName) {
	      logger[methodName] = function () {
	        var args = arguments;
	        return logFunctions[methodName](logger.options, args);
	      };
	    });

	    return logger;
	  };

	  var defaultLogger = service.makeLogger({});

	  methodNames.forEach(function (methodName) {
	    service[methodName] = defaultLogger[methodName];
	  });

	  return service;
	};

	exports.getService = function() {
	  return service || makeService();
	};

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// Abstracts server interaction.
	var injections = __webpack_require__(1);
	var loggerModule = __webpack_require__(2);
	var tokenKeeperModule = __webpack_require__(4);

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


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module koast-http/_koastTokenKeeper
	 */

	'use strict';

	console.log('token-keeper');

	var loggerModule = __webpack_require__(2);
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

/***/ }
/******/ ])