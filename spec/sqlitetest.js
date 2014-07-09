// Requires mocha: npm install -g mocha

var KnexStore = require('../index');
var assert = require('assert');
var Promise = require('bluebird');
var fs = require('fs');


if (fs.existsSync('express-brute-knex-test.sqlite')) {
  fs.unlinkSync('express-brute-knex-test.sqlite');
}

sqliteknex = require('knex').initialize({
  debug: true,
  client: 'sqlite3',
  connection: {
    filename: "express-brute-knex-test.sqlite"
  }
});

describe('Express brute KnexStore', function() {
  this.timeout(4000);

  var store, callback, store, count=0;
  store = new KnexStore({
    knex: sqliteknex
  });

  it("can be instantiated", function () {
    assert(store);
    assert(store instanceof KnexStore);
  });

  it("returns null when no value is available", function (done) {
    store.get("novalue").then(function (result) {
      assert.equal(result, null);
      done();
    })
  });

  it('should set records and get them back', function(done) {
    var curDate = new Date(),
    object = {count: 17, lastRequest: curDate, firstRequest: curDate};

    store.set('set records ', object, 10*1000)
    .then(function (result) {
      return assert.equal(result[0], 1); // 1 row should be updated.
    })
    .then(function () {
      return store.get('set records ').then(function (result) {
        assert.equal(result.count, 17);
        done();
      })
    })
  })

  it('should set records and not get them back if they expire', function(done) {
    var curDate = new Date(),
    object = {count: 17, lastRequest: curDate, firstRequest: curDate};

    store.set('1234expire', object, 0)
    .then(function (result) {
      return assert.notEqual(result[0], null  ); // 1 row should be updated ??
    })
    .then(function () {
      return store.get('1234expire').then(function (result) {
        assert.equal(result, null);
        done();
      })
    })
  })

  it("can reset the count of requests to zero", function (done) {
    var curDate = new Date(),
        object = {count: 36713, lastRequest: curDate, firstRequest: curDate},
        key = "reset1.2.3.4";

    store.set(key, object, 10 * 1000)
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

  it("can increment even if no value was set", function (done) {
    var key = "incrementtest";

    store.increment(key, 10 * 1000)
    .then(function (result) {
      return store.get(key)
    })
    .then(function (result) {
      assert.equal(result.count, 1)
      done();
    })
  });

  it("supports data expiring", function (done) {
    this.timeout(10000);

    var curDate = new Date(),
        object = {count: 1, lastRequest: curDate, firstRequest: curDate};

    store.increment('expiring', 0)
    .then(function (result) {
      return store.get('expiring').delay(100) // give a delay for DB consistency, though it may not work every time.
    })
    .then(function (result) {
      assert.equal(result, null);
      done();
    })
  });
})
