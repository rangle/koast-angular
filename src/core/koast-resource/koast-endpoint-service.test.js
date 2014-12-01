/* jshint expr:true */
/* globals describe, it, inject, beforeEach, Q, expect */


'use strict';

describe('_KoastEndpoint',function(){
  beforeEach(module('koast-resource'));

  beforeEach(module(function ($provide) {
    $provide.service('$q', function() {return Q;});
  }));

  var _KoastEndpoint;
  beforeEach(function(){
    inject(function($injector){
      _KoastEndpoint = $injector.get('_KoastEndpoint');
    });
  });

  it('should exist', function() {
    expect(_KoastEndpoint).to.be.a('function');
    expect(_KoastEndpoint.prototype.makePostUrl).to.be.a('function');
    expect(_KoastEndpoint.prototype.makeGetUrl).to.be.a('function');
  });

  //TODO: write tests for methods

});