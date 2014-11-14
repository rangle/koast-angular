require('./src/core/koast-logger/koast-logger-service');

var nebular = require('nebular');
var q = require('q');

nebular.setService('$q', q);
nebular.setService('$http', {});
nebular.setService('$log', {});
nebular.setService('$window', {});

nebular.instantiateService('_koastLogger');
nebular.instantiateService('_koastTokenKeeper');
nebular.instantiateService('_koastHttp');

var logger = nebular.getService('_koastLogger');
var log = logger.makeLogger('foo');

log.info('Hello');
