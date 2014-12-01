/* jshint expr:true */
/* globals describe, it, inject, beforeEach, Q, expect */


'use strict';

describe('_koastLogger',function(){
  beforeEach(module('koast-logger'));

  beforeEach(module(function ($provide) {
    $provide.service('$q', function() {return Q;});
  }));

  var _koastLogger;
  beforeEach(function(){
    inject(function($injector){
      _koastLogger = $injector.get('_koastLogger');
    });
  });

  it('should exist', function() {
    expect(_koastLogger).to.be.an('object');
    expect(_koastLogger.makeLogger).to.be.a('function');
  });

  //TODO: write tests for makeLogger

});