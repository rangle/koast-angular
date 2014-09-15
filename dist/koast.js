/* global angular */

angular.module('koast.http', [])

.factory('_koastTokenKeeper', ['$log', '$window',
  function($log, $window) {
    var TOKEN_KEY = 'KoastToken';
    var service = {};
    service.saveToken = function(params) {
      var tokenValue = params.token;
      $window.localStorage.setItem(TOKEN_KEY, tokenValue);
    };
    service.loadToken = function() {
      return $window.localStorage.getItem(TOKEN_KEY);
    };
    service.clear = function() {
      return $window.localStorage.removeItem(TOKEN_KEY);
    };
    return service;
  }
])

// Abstracts server interaction.
.factory('_koastHttp', ['$http', '$q', '_koastLogger', '_koastTokenKeeper',
  function ($http, $q, _koastLogger, _koastTokenKeeper) {
    var log = _koastLogger.makeLogger('koast.http');
    var service = {};
    var options = {
      timeout: 30000 // 30 seconds
    };
    var token = _koastTokenKeeper.loadToken();

    log.debug('Loaded token', token);

    service.setOptions = function(newOptions) {
      options = newOptions;
    };

    function addTokenHeader() {
      options.headers = options.headers || {};
      if (token) {
        options.headers['Authorization'] =  'Bearer ' + token;
      }
    }

    service.saveToken = function (tokenData) {
      token = tokenData.token;
      _koastTokenKeeper.saveToken(tokenData);
    };

    service.deleteToken = function (tokenData) {
      _koastTokenKeeper.clear();
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
        .then(function() {
          addTokenHeader();
        })
        .then(caller)
        .then(function(response) {
          service.isReachable = true;
          return response.data? response.data: response;
        })
        .then(null, function(err) {
          log.warn(err.data || err);
          throw err;
        });
        // .then(null, function(error) {
        //   error = checkErrors(error);
        //   throw error.data? error.data: error;
        // });
    }

    service.get = function(url, params) {
      return makeServerRequest(function() {
        var config = _.cloneDeep(options);
        config.url = options.baseUrl + url;
        config.params = params;
        config.method = 'GET';
        return $http(config);
      });
    };

    return service;
  }
]);

/* global angular */

angular.module('koast', ['koast-user', 'koast-resource'])

// The public service for use by the developer.
.factory('koast', ['_koastUser', '_koastResourceGetter', '$log',
  function (koastUser, koastResourceGetter, $log) {
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
      koastUser.init(options);
    };

    return service;
  }
]);
/* global angular */

// Logging with a few extra bells and whistles.
angular.module('koast.logger', [])
  .factory('_koastLogger', [
    function() {

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
      service.setLogLevel = function(newLevel) {
        logLevel = newLevel;
      };

      function log(options, groupOptions, values) {
        options = arguments[0] || {};

        if (options.level && options.level < logLevel) {
          return;
        };

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
          args.unshift('color:' + color + ';font-weight:bold;font-size:150%;');
        }
        args.unshift(colored.join(' '));
        args = args.concat(values);
        Function.prototype.apply.call(console.log, console, args);
      }

      function makeLoggerFunction(options) {
        options.level = service.levels[options.name];
        return function(groupOptions, args) {
          log(options, groupOptions, args);
        }
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
        methodNames.forEach(function(methodName) {
          logger[methodName] = function() {
            var args = arguments;
            return logFunctions[methodName](logger.options, args);
          }
        });

        return logger;
      }

      var defaultLogger = service.makeLogger({});

      methodNames.forEach(function(methodName) {
        service[methodName] = defaultLogger[methodName];
      });

      return service;
    }
  ]);
/* global angular */

angular.module('koast-persona', [])

// A "private" service that works as a wrapper around Mozilla's Persona.
.factory('_koastPersona', ['$http', '$q', '$interval', '$location', '$log',
  function ($http, $q, $interval, $location, $log) {
    'use strict';

    var service = {};
    var userInitiatedAction = false;
    var readyDeferred = $q.defer();

    // Loads persona shim assyncronously. Per persona documentation we must
    // load the shim from persona.org server (since the protocol is subject to
    // change). Persona.org can be pretty slow, however, so loading the shim
    // synchronously ruins the user experience. So, that's the reason for
    // async loading.
    function loadPersonaShim() {
      var doc = window.document;
      var head = doc.getElementsByTagName('head')[0];
      var script = doc.createElement('script');
      var deferred = $q.defer();
      var interval;

      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://login.persona.org/include.js';
      head.appendChild(script);

      interval = $interval(function () {
        if (window.navigator.id) {
          deferred.resolve();
          $interval.cancel(interval);
        }
      }, 50);

      return deferred.promise;
    }

    // Verifies a persona assertion by 
    function verifyAssertion(assertion) {
      $log.debug('verifyAssertion:');
      var audience = $location.absUrl().split('/').slice(0,3).join('/') + '/';
      var postParams = {
        assertion: assertion,
        audience: audience
      };
      $log.info('audience:', audience);
      var config = {
        timeout: 5000
      };
      return $http.post('/auth/browserid', postParams, config)
        .then(function (response) {
          $log.debug('Response:', response);
          return response.data;
        })
        .then(null, function (error) {
          if (typeof error === 'object' && error.headers) {
            // This is angular's weird way of letting us know about a timeout!
            $log.error('Persona verification timed out.');
            throw new Error ('Persona verification timed out.');
          } else {
            $log.error('Error verifying Persona assertion:', error.toString());
            $log.error(error.stack);
            throw error;
          }
        });
    }

    /** 
     * Initiates sign in with Mozilla's persona. The thing to keep in mind
     * here is that Persona sign up process is non-modal, so we don't really
     * know what is happening there until the user either completes or cancels
     * it. The user can be interacting with our site while Persona's sign up
     * window is available. Not much we can do about this.
     *
     * @param  {Object} options    An object representing options.
     * @return {undefined}         Noting is returned.
     */
    service.initiateSignIn = function (options) {
      if (!options) {
        options = {};
      }
      $log.debug('signIn');
      userInitiatedAction = true;
      navigator.id.request({
        siteName: options.siteTitle,
        oncancel: function () {
          $log.info('Persona login cancelled by user.');
        }
      });
    };


    /** 
     * Initiates sign in with Mozilla's persona. In this case few things should
     * prevent Persona from actually completing the sign out, but we don't
     * really get to know what's going on. We just start the process here and
     * hope for the best.
     *
     * @param  {Object} options    An object representing options.
     * @return {undefined}         Noting is returned.
     */
    service.initiateSignOut = function () {
      userInitiatedAction = true;
      navigator.id.logout();
    };

    /**
     * Initializes persona. This method will request persona JS shim from the
     * server and set it up when the shim arrives. Once we setup Persona
     * watch, it may call onlogin or onlogout before any user action.
     * In our case we just ignore those calls. In other words, we do not care
     * whether Persona thinks the user is already logged in or not. We only
     * want to know about logins and logouts that are activated by the user.
     * This method returns a promise that resolves when persona is fully ready.
     *
     * @param  {Object} options    An object representing options.
     * @return {promise}           A $q promise that resolves when persona is
     *                             ready.
     */
    service.init = function (options) {
      loadPersonaShim()
        .then(function () {
          $log.debug('navigator.id.watch added');
          navigator.id.watch({
            loggedInUser: null, // to block autologin
            onlogin: function (assertion) {
              if (userInitiatedAction) {
                verifyAssertion(assertion)
                  .then(function (user) {
                    options.onSignIn(user);
                  }, $log.error);
              }
            },
            onlogout: function () {
              if (userInitiatedAction) {
                options.onSignOut();
              }
            },
            onready: function () {
              readyDeferred.resolve();
            }
          });
        })
        .then(null, $log.error);
      return readyDeferred.promise;
    };

    /**
     * Returns a promise that resolves when persona is ready.
     * @return {promise}           A $q promise that returns when persona is
     *                             ready.
     */
    service.whenReady = function () {
      return readyDeferred.promise;
    };

    return service;
  }
]);
/* global angular, _ */

angular.module('koast-resource', ['koast-user'])

.factory('_KoastServerHelper', ['_koastUser',
  function(user) {
    'use strict';
    var service = {};
    service.addAuthHeaders = function (headers) {
      if (user.isSignedIn) {
        headers['koast-auth-token'] = user.meta.token;
        headers['koast-auth-token-timestamp'] = user.meta.timestamp;
        headers['koast-user'] = angular.toJson(user.data);
      }
    };
    return service;
  }])

// A "private" service providing a constructor for resources.
.factory('_KoastResource', ['_KoastServerHelper', '$q', '$http', '$log',
  function (KoastServerHelper, $q, $http, $log) {
    'use strict';
    // A client side representation of a saveable RESTful resource instance.
    function Resource(endpoint, result, options) {
      var resource = this;
      var data;
      if (options.useEnvelope) {
        data = result.data;
        if (!data) {
          throw new Error('Client expects an envelope, but server did not send it properly.');
        }
      } else {
        data = result;
      }
      _.keys(data).forEach(function (key) {
        resource[key] = data[key];
      });

      if (options.useEnvelope) {
        Object.defineProperty(this, 'can', {
          get: function () {
            return result.meta.can;
          }
        });
      }

      Object.defineProperty(this, '_endpoint', {
        get: function () {
          return endpoint;
        }
      });

      return this;
    }

    // A method for saving the resource
    Resource.prototype.save = function () {
      var url = this._endpoint.makeGetUrl(this);
      var headers = {};
      KoastServerHelper.addAuthHeaders(headers);
      return $http.put(url, this, {headers: headers});
    };

    // A method for deleting the resource
    Resource.prototype.delete = function () {
      $log.debug('The endpoint: ', this._endpoint);
      var url = this._endpoint.makeGetUrl(this);
      $log.debug('delete url:', url);
      var headers = {};
      KoastServerHelper.addAuthHeaders(headers);
      return $http.delete(url, {headers: headers});
    };

    return Resource;
  }
])

// A "private" service providing a constructor for endpoints.
.factory('_KoastEndpoint', [

  function () {
    'use strict';

    // The constructor.
    function Endpoint(prefix, handle, template, options) {
      var endpoint = this;
      endpoint.prefix = prefix;
      endpoint.handle = handle;
      endpoint.template = template;
      endpoint.options = _.clone(options);
    }

    // A method to generate the post url - that is, a URL that does not
    // identify a specific resource.
    Endpoint.prototype.makePostUrl = function () {
      return this.prefix + this.handle;
    };

    // An auxiliary function to generate the part of the URL that identifies
    // the specific resource.
    function makeResourceIdentifier(template, params) {
      
      if (!params) {
        return '';
      } else {
        return template.replace(/:([-_a-zA-Z]*)/g, function (_, paramName) {
          var param = params[paramName];
          var paramIsDefined = param || (param===0); // Accept 0 as "defined".
          if (!paramIsDefined) {
            throw new Error('Missing parameter: ' + paramName);
          }
          return params[paramName];
        });
      }
    }

    // A method to generate a URL for get, put or delete - that is, a URL that
    // identies a particular resource. This URL would not include the query
    // string, since $http will attach that for us.
    Endpoint.prototype.makeGetUrl = function (params) {
      return this.makePostUrl() + '/' + makeResourceIdentifier(this.template,
        params);
    };

    // The service instance is actually going to be a constructor function.
    return Endpoint;
  }
])

// A service that offers high level methods for interacting with resources.
.factory('_koastResourceGetter', ['_KoastResource', '_KoastServerHelper',
  '_KoastEndpoint', '$http', '$q', '$log','_koastHttp',
  function (KoastResource, KoastServerHelper, KoastEndpoint, $http, $q, $log,_koastHttp) {
    'use strict';
    var service = {};
    var prefixes = {};
    var endpoints = {};

    // Converts an array of raw results coming from the server into an array
    // of resources. If options specify a singular resource, then we just
    // return that resource.
    function convertResultsToResources(results, options) {

      var resources = _.map(results, function(rawResult) {
        return new KoastResource(options.endpoint, rawResult, options);
      });

      if (options.singular) {
        if (resources.length === 0) {
          resources = null;
        } else if (resources.length > 1) {
          $log.warn('Expected a singular resource, got ' + resources.length);
          resources = resources[0];
        } else {
          resources = resources[0];
        }
      }
      return resources;
    }

    // An auxiliary function that actually gets the resource. This should work
    // for either a request to get a single item or a query for multiple.
    function get(endpointHandle, params, query, resourceOptions) {
      var endpoint = endpoints[endpointHandle];
      var headers = {};
      var options = {};
      var getConfig = {
        params: query,
        headers: headers
      };
      options = angular.extend(options, endpoint.options);
      options = angular.extend(options, resourceOptions);
      options.endpoint = endpoint;
      if (!endpoint) {
        throw new Error('Unknown endpoint: ' + endpointHandle);
      }

      KoastServerHelper.addAuthHeaders(headers);
      return _koastHttp.get(endpoint.makeGetUrl(params), getConfig)
        .then(function (response) {
          return convertResultsToResources(response, options);
        });
    }

    // Sets the prefix for API URLs. The prefix can be optionally associated
    // with a server handle. If no handle is specified, this method sets API
    // URL prefix for the default server.
    service.setApiUriPrefix = function (newPrefix, serverHandle) {
      serverHandle = serverHandle || '_';
      prefixes[serverHandle] = newPrefix;
    };

    /**
     * Gets a single resource. This should be used when we want to retrieve
     * a specific resource.
     *
     * @param  {String} endpointHandle    A string identifying the endpoint.
     * @param  {Object} params            An object identifying a specific
     *                                    resource.
     * @return {promise}                  A $q promise that resolves to
     *                                    specific resource (or null if not
     *                                    found).
     */
    service.getResource = function (endpointHandle, params) {
      return get(endpointHandle, params, null, {
        singular: true
      });
    };


    function post(endpointHandle, data, options) {
      var deferred = $q.defer();
      var endpoint = endpoints[endpointHandle];
      var headers = {};

      options = options || {};
      if (!endpoint) {
        throw new Error('Unknown endpoint: ' + endpointHandle);
      }

      KoastServerHelper.addAuthHeaders(headers);

      $http.post(endpoint.makePostUrl(), data, {
        headers: headers
      })
        .success(function (result) {
          deferred.resolve(result);
        })
        .error(function (error) {
          deferred.reject(error);
        });
      return deferred.promise;
    }


    service.createResource = function (endpointHandle, body) {
      return post(endpointHandle, body)
        .then(null, $log.error);
    };

    /**
     * Queries for resource. This should be used when we want to get a list of
     * resources that satisfy some criteria.
     *
     * @param  {String} endpointHandle    A string identifying the endpoint.
     * @param  {Object} query             A query object.
     * @return {promise}                  A $q promise that resolves to a list
     *                                    of resources.
     */
    service.queryForResources = function (endpointHandle, query) {
      return get(endpointHandle, null, query);
    };

    service.addEndpoint = function (handle, template, options) {
      options = options || {};
      var serverHandle = options.server || '_';
      var prefix = prefixes[serverHandle];
      if (!prefix) {
        throw new Error('No URI prefix defined for server ' + serverHandle);
      }
      var endpoint = new KoastEndpoint(prefix, handle, template, options);
      if (endpoints[handle]) {
        throw new Error('An endpoint with this handle was already defined: ' +
          handle);
      }
      endpoints[handle] = endpoint;
    };

    return service;
  }
]);

/* global angular */

angular.module('koast-user', [
  'koast.logger',
  'koast.http'
])

// Abstracts out some OAuth-specific logic.
.factory('_koastOauth', ['$window', '$location', '$log', '_koastLogger',
  function ($window, $location, $log, _koastLogger) {
    'use strict';

    var service = {};

    var log = _koastLogger;

    // This is only a default value, the Koast client must set baseUrl via Koast.init()
    // if the client is served on a different server than that of the API server.
    var baseUrl = $location.absUrl().split('/').slice(0, 3).join('/');


    // Makes a URL for the OAuth provider.
    function makeAuthUrl(provider, nextUrl) {
      return baseUrl + '/auth/' + provider + '?next=' +
        encodeURIComponent(nextUrl);
    }

    // Sends the user to the provider's OAuth login page.
    service.initiateAuthentication = function (provider) {
      var newUrl = makeAuthUrl(provider, $location.absUrl());
      $window.location.replace(newUrl);
    };

    // Sets a new base URL
    service.setBaseUrl = function (newBaseUrl) {
      baseUrl = newBaseUrl;
    };

    // expects end point to precede with a forward-slash "/"
    service.makeRequestURL = function (endPoint) {
      if (!endPoint){
        endPoint = ""
      }
      return baseUrl + endPoint;
    };

    return service;
  }
])

// A service that represents the logged in user.
.factory('_koastUser', ['_koastOauth', '_koastHttp', '_koastLogger', '$log', '$timeout', '$http', '$window', '$q',
  function (koastOauth, _koastHttp, _koastLogger, $log, $timeout, $http, $window, $q) {
    'use strict';

    var log = _koastLogger.makeLogger('koast.user');
    var koastHttp = _koastHttp;

    // This is our service, which is an object that represents the user. The
    // app should be able to just add this to the scope.
    var user = {
      isAuthenticated: false, // Whether the user is authenticated or anonymous.
      isReady: false, // Whether the user's status is known.
      data: {}, // User data coming from the database or similar.
      meta: {} // Metadata: registration status, tokens, etc.
    };

    var registrationHandler; // An optional callback for registering an new user.
    var statusPromise; // A promise resolving to user's authentication status.
    var authenticatedDeferred = $q.defer();

    // Inserts a pause into a promise chain if the debug config requires it.
    function pauseIfDebugging(value) {
      var delay = user.debug.delay;
      if (delay) {
        $log.debug('Delayng for ' + delay + ' msec.');
        return $timeout(function() {
          return value;
        }, delay);
      } else {
        return value;
      }
    }

    // Sets the user's data and meta data.
    // Returns true if the user is authenticated.
    function setUser(responseBody) {

      var valid = responseBody && responseBody.data;
      var newUser;
      log.debug('Setting the user based on', responseBody);
      if (!valid) {
        log.warn('Did not get back a valid user record.', responseBody);
        user.data = {};
        user.isAuthenticated = false;
        user.meta = {};
      } else {
        // Figure out if the user is signed in. If so, update user.data and
        // user.meta.
        if (responseBody.isAuthenticated) {
          user.data = responseBody.data;
          user.meta = responseBody.meta;
          if (user.meta.token) {
            koastHttp.saveToken({
              token: user.meta.token,
              expires: user.meta.expires
            });
          }
          authenticatedDeferred.resolve();
        }
        user.isAuthenticated = responseBody.isAuthenticated;
      }
      user.isReady = true;
      return user.isAuthenticated;
    }

    // Calls registration handler if necessary. Returns a boolean indicating
    // whether the user is authenticated or a promise for such a boolean.
    function callRegistrationHandler(isAuthenticated) {
      // Call the registration handler if the user is new and the handler
      // is defined.
      if (isAuthenticated && (!user.meta.isRegistered) &&
        registrationHandler) {
        // Using $timeout to give angular a chance to update the view.
        // $timeout returns a promise equivalent to the one returned by
        // registrationHandler.
        return $timeout(registrationHandler, 0)
          .then(function () {
            return isAuthenticated;
          });
      } else {
        return isAuthenticated;
      }
    }

    // Retrieves user's data from the server. This means we need to make an
    // extra trip to the server, but the benefit is that this method works
    // across a range of authentication setups and we are not limited by
    // cookie size.
    function getUserData(url) {

      // First get the current user data from the server.
      return koastHttp.get(url || '/auth/user')
        .then(null, function(response) {
          if (response.status===401) {
            return null;
          } else {
            throw response;
          }
        })
        .then(pauseIfDebugging)
        .then(setUser)
        .then(callRegistrationHandler);
    }

    // Initiates the login process.
    user.initiateOauthAuthentication = function (provider) {
      koastOauth.initiateAuthentication(provider);
    };
    
    // Posts a logout request.
    user.logout = function (nextUrl) {
      koastHttp.deleteToken();
      return $http.post(koastOauth.makeRequestURL('/auth/logout'))
        .then(function (response) {
          if (response.data !== 'Ok') {
            throw new Error('Failed to logout.');
          } else {
            $window.location.replace(nextUrl || '/');
          }
        })
        .then(null, function (error) {
          $log.error(error);
          throw error;
        });
    };

    // user logs in with local strategy
    user.loginLocal = function(user) {
      $log.debug('Login:', user.username);
      var body = {
        username: user.username,
        password: user.password
      };
      return $http.post(koastOauth.makeRequestURL('/auth/login'), body)
        .then(function(response) {
          log.debug('loginLocal:', response);
          return response.data;
        })
        .then(setUser);
    };

    // Registers the user (social login)
    user.registerSocial = function (data) {
      return $http.put(koastOauth.makeRequestURL('/auth/user'), data)
        .then(function () {
          return getUserData();
        });
    };

    // Registers the user (local strategy)
    user.registerLocal = function (userData) {
      return $http.post(koastOauth.makeRequestURL('/auth/user'), userData);
    };

    // Checks if a username is available.
    user.checkUsernameAvailability = function (username) {
      var url = koastOauth.makeRequestURL('/auth/usernameAvailable');
      return $http.get(url, {
        params: {
          username: username
        }
      })
        .then(function (result) {
          return result.data === 'true';
        })
        .then(null, $log.error);
    };

    user.resetPassword = function(email){
      return $http.post(koastOauth.makeRequestURL('/forgot'), {email: email});
    };

    user.setNewPassword = function(newPassword, token){
      return $http.post(koastOauth.makeRequestURL('/reset/' + token), {password: newPassword});
    };

    // Attaches a registration handler - afunction that will be called when we
    // have a new user.
    user.setRegistrationHanler = function (handler) {
      registrationHandler = handler;
    };

    // Returns a promise that resolves to user's login status.
    user.getStatusPromise = function () {
      if (!statusPromise) {
        statusPromise = getUserData();
      }
      return statusPromise;
    };

    user.whenStatusIsKnown = user.getStatusPromise;

    // Initializes the user service.
    user.init = function (options) {
      options.debug = options.debug || {};
      user.debug = options.debug;
      koastHttp.setOptions(options);
      koastOauth.setBaseUrl(options.baseUrl);
      return user.getStatusPromise();
    };

    // Returns a promise that resolves when the user is authenticated.
    user.whenAuthenticated = function() {
      return authenticatedDeferred.promise;
    };

    return user;
  }
]);
