// Requires mocha: npm install -g mocha

var KnexStore = require('../index');
var assert = require('assert');
var Promise = require('bluebird');
var fs = require('fs');

if (fs.existsSync('express-brute-knex.sqlite')) {
  fs.unlinkSync('express-brute-knex.sqlite');
}

describe('Express brute KnexStore', function() {
  this.timeout(4000);

  var store, callback, store, count=0;
  store = new KnexStore();

  it("can be instantiated", function () {
    assert(store);
    assert(store instanceof KnexStore);
  });

  it("returns null when no value is available", function () {
    store.get("novalue").then(function (result) {
      assert.equal(result, null);
    })
  });


  it('should set records and get them back', function(done) {
    var curDate = new Date(),
    object = {count: 17, lastRequest: curDate, firstRequest: curDate};

    store.set('1.2.3.4', object, 0)
    .then(function (result) {
      return assert.equal(result[0], 1); // 1 row should be updated.
    })
    .then(function () {
      return store.get('1.2.3.4').then(function (result) {
        assert.equal(result.count, 17);
        done();
      })
    })
  })

  it("can reset the count of requests", function () {
    var curDate = new Date(),
        object = {count: 17, lastRequest: curDate, firstRequest: curDate},
        key = "reset1.2.3.4";

    store.set(key, object, 0)
    .then(function () {
      return store.reset(key);
    })
    .then(function (res) {
      return store.get(key);
    })
    .then(function (res) {
      assert.equal(res.count, 0)
      done();
    })
  });

  it("can increment even if no value was set", function () {
    var key = "incrementtest";

    store.increment(key, 0)
    .then(function (result) {
      console.log(result);

      return store.get(key)
    })
    .then(function (result) {
      console.log(result);
    })
  });

  it("supports data expiring", function () {
    this.timeout(10000);

    var curDate = new Date(),
        object = {count: 1, lastRequest: curDate, firstRequest: curDate};

    // store.set("expiring", object, 50000)
    store.increment('expiring', 50)
    .then(function (result) {
      return store.get("1.2.3.4");
    })
    .delay(500)
    .finally(function (result) {
      assert.equal(result, 'balls');
    })
  });
})
