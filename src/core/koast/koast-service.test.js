/* jshint expr:true */
/* globals describe, it, inject, beforeEach, Q, expect */


'use strict';

describe('koast',function(){
  beforeEach(module('koast'));

  beforeEach(module(function ($provide) {
    $provide.service('$q', function() {return Q;});
  }));

  var koast;
  beforeEach(function(){
    inject(function($injector){
      koast = $injector.get('koast');
    });
  });

  it('should exist', function() {
    expect(koast).to.be.an('object');
    expect(koast.init).to.be.a('function');
    expect(koast.user).to.be.an('object');
  });

  //TODO: write tests for init()

});