/* jshint expr:true */
/* globals describe, it, inject, beforeEach, Q, expect */


'use strict';

describe('_koastTokenKeeper',function(){
  beforeEach(module('koast-http'));

  beforeEach(module(function ($provide) {
    $provide.service('$q', function() {return Q;});
  }));

  var _koastTokenKeeper;
  beforeEach(function(){
    inject(function($injector){
      _koastTokenKeeper = $injector.get('_koastTokenKeeper');
    });
  });

  it('should exist', function() {
    expect(_koastTokenKeeper).to.be.an('object');
    expect(_koastTokenKeeper.saveToken).to.be.a('function');
    expect(_koastTokenKeeper.loadToken).to.be.a('function');
    expect(_koastTokenKeeper.clear).to.be.a('function');
  });

  //TODO: write tests for _koastTokenKeeper methods

});