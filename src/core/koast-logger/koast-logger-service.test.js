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
    expect(_koastLogger.setLogLevel).to.be.a('function');
    expect(_koastLogger.makeLogger).to.be.a('function');
  });

  it('should accept a number', function() {
    expect(_koastLogger.makeLogger(1)).to.be.ok;

  });

  it('should accept special types', function() {
    expect(_koastLogger.makeLogger(null)).to.be.ok;
    expect(_koastLogger.makeLogger()).to.be.ok;

  });


  it('should return an object', function() {
     expect(_koastLogger.makeLogger()).to.be.a('object');
  });

  it('should return an object that has methods', function() {
    var result = _koastLogger.makeLogger();

    expect(result.debug).to.be.a('function');
    expect(result.verbose).to.be.a('function');
    expect(result.info).to.be.a('function');
    expect(result.warn).to.be.a('function');
    expect(result.error).to.be.a('function');

  });

});