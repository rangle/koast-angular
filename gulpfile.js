'use strict';

var gulp = require('gulp');
var rg = require('rangle-gulp');
var exec = require('child_process').exec;
var watch = require('gulp-watch');
var karmaVendorFiles = [
  'bower_components/angular/angular.js',
  'bower_components/angular-mocks/angular-mocks.js',
  'bower_components/sinon-chai/lib/sinon-chai.js',
  'testing/lib/*.js'
];

var karmaFiles = [
  'src/**/*.js'
];

rg.setLogLevel('info');

gulp.task('karma', rg.karma({
  files: karmaFiles,
  vendor: karmaVendorFiles,
  karmaConf: 'testing/karma-ci.conf.js'
}));

gulp.task('karma-ci', rg.karma({
  files: karmaFiles,
  vendor: karmaVendorFiles,
  karmaConf: 'testing/karma-ci.conf.js'
}));

gulp.task('karma-watch', rg.karmaWatch({
  files: karmaFiles,
  vendor: karmaVendorFiles,
  karmaConf: 'testing/karma.conf.js'
}));

gulp.task('mocha', rg.mocha());

gulp.task('lint', rg.jshint({
  files: [
    'src/**/*.js',
  ]
}));

gulp.task('beautify', rg.beautify({
  files: []
}));

gulp.task('concat', rg.concatAndUglify({
  files: 'src/**/*.js',
  name: 'koast',
  dest: 'dist/'
}));


gulp.task('dev', rg.nodemon({
  // workingDirectory: 'examples/basic-express/',
  script: 'examples/basic-express/server/app.js',
  onChange: ['lint'] // or ['lint', 'karma']
}));

gulp.task('test', ['karma']);

gulp.task('default', ['lint', 'concat', 'karma']);
