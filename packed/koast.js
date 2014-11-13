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

	angular.module('koast-logger', [])

	.factory('_koastLogger', function() {
	  var loggerModule = __webpack_require__(1);
	  return loggerModule.makeLoggerService();
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* global angular */
	'use strict';
	// Logging with a few extra bells and whistles.
	//

	/**
	 * @module koast-logger
	 */
	exports.makeLoggerService = function() {
	      var service = {};
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


/***/ }
/******/ ])