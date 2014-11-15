'use strict';
var nebular = require('nebular');

require('./core/koast');
require('./core/koast-http');
require('./core/koast-logger');
require('./core/koast-resource');
require('./core/koast-user');
require('./core/koast-version-check');

/**
 *
 * @module koast
 */
nebular.module('koast', ['koast-user', 'koast-resource', 'koast-versionCheck'])
  .run(function () {
    if (typeof _ === typeof undefined) {
      throw new Error(
        '_ is undefined. koast-angular requires underscore or lodash to be loaded'
      );
    }
  });