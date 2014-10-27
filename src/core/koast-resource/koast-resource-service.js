/*global angular,_*/

/**
 * @module koast-resource/_KoastResource
 */
angular.module('koast-resource')
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
            throw new Error(
              'Client expects an envelope, but server did not send it properly.'
            );
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
        return $http.put(url, this, {
          headers: headers
        });
      };

      // A method for deleting the resource
      Resource.prototype.delete = function () {
        $log.debug('The endpoint: ', this._endpoint);
        var url = this._endpoint.makeGetUrl(this);
        $log.debug('delete url:', url);
        var headers = {};
        KoastServerHelper.addAuthHeaders(headers);
        return $http.delete(url, {
          headers: headers
        });
      };

      return Resource;
    }
  ])