// require('./src/core/koast-logger/koast-logger-service');
// require('./src/core/koast-http/koast-token-keeper-service');
// require('./src/core/koast-http/koast-http-service');

require('./src/koast');

var nebular = require('nebular');
var Q = require('q');
var _ = require('lodash');

nebular.setService('$q', Q);
nebular.setService('$http', function(config) {
  return Q.when('Marvin');
});
nebular.setService('$log', {});
nebular.setService('$window', {
  localStorage: {
    getItem: function() {}
  }
});
nebular.setService('_', _);

nebular.instantiateService('_koastLogger');
nebular.instantiateService('_koastTokenKeeper');
nebular.instantiateService('_koastHttp');

var logger = nebular.getService('_koastLogger');
var log = logger.makeLogger('foo');

var http = nebular.getService('_koastHttp');

http.get('foo')
  .then(function(result) {
    log.info('Hello', result);
  })
  .then(null, function(error) {
    console.error('---', error);
  });

