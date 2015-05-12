const Promise = require('bluebird');
Promise.longStackTraces();

const KnexStore = require('./index');
const Knex = require('knex');
const assert = require('assert');
const fs = require('fs');
const test = require('tape');

if (fs.existsSync('express-brute-knex-test.sqlite')) {
  fs.unlinkSync('express-brute-knex-test.sqlite');
}

sqliteknex = new Knex({
  debug: true,
  client: 'sqlite3',
  connection: {
    filename: "express-brute-knex-test.sqlite"
  }
});

postgresknex = new Knex({
  debug: true,
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    user     : 'travis',
    password : '',
    database : 'travis_ci_test',
    charset  : 'utf8',
  }
});

mysqlknex = new Knex({
  debug: true,
  client: 'mysql',
  connection: {
    host     : 'localhost',
    user     : 'travis',
    password : '',
    database : 'travis',
    charset  : 'utf8',
  },
  pool: {
    min: 1,
    max: 1
  }
});

Promise.join((function () {
  return mysqlknex.schema.dropTable('brute')
})(), (function () {
  return postgresknex.schema.dropTable('brute')
})())
.finally(
// finally to ignore drop tables that don't exist errors
function () {
  const sqlitestore = new KnexStore({
    knex: sqliteknex
  });

  const postgresstore = new KnexStore({
    knex: postgresknex
  });

  const mysql = new KnexStore({
    knex: mysqlknex
  });


  var stores = [];
  stores.push([sqlitestore, 'sqlite']);
  stores.push([postgresstore, 'postgres']);
  stores.push([mysql, 'mysql']);

  stores.forEach(function (item) {

    const store = item[0];
    const name = item[1];

    test(name +' properly instantiate', function (t) {
      t.plan(2);

      t.ok(store, name +' exists');
      t.ok(store instanceof KnexStore, name +' instanceof');
    });


    test(name +' return null when no value is available', function (t) {
      t.plan(1);

      store.get('novalue').then(function (result) {
        t.equal(result, null, name +' novalue null');
      });
    });

    test(name +' set records and get them back', function (t) {
      t.plan(2);
      const curDate = new Date();
      const object = {count: 17, lastRequest: curDate, firstRequest: curDate};

      store.set('set records', object, 10*1000)
      .tap(function (result) {
        if (result[0] === 0 ) {
          // mysql
          t.equal(result[0], 0, name +' 1 row should be updated');
        } else if (result.rowCount) {
          // postgresql
          t.equal(result.rowCount, 1, name +' 1 row should be updated');
        } else {
          // sqlite
          t.equal(result[0], 1, name +' 1 row should be updated');
        }       
      })
      .then(function () {
        return store.get('set records').then(function (result) {
          t.equal(result.count, 17, name +' result should be 17');
        });
      });
    });

    test(name + ' set records, not get them back if they expire', function (t) {
      t.plan(2);
      const curDate = new Date();
      const object = {count: 17, lastRequest: curDate, firstRequest: curDate};

      store.set('1234expire', object, 0)
      .then(function (result) {
        return t.notEqual(result[0], null); // 1 row should be updated ??
      })
      .then(function () {
        return store.get('1234expire').then(function (result) {
          t.equal(result, null, name + ' null result');
        });
      });
    });

    test(name + ' reset (delete) a record', function (t) {
      t.plan(1);

      const curDate = new Date();
      const object = {count: 36713, lastRequest: curDate, firstRequest: curDate};
      const key = "reset1.2.3.4";

      store.set(key, object, 10 * 1000)
      .then(function () {
        return store.reset(key);
      })
      .then(function (res) {
        return store.get(key);
      })
      .then(function (res) {
        t.equal(res, null, name +' is null')
      })
    });

    test(name + ' increment even if not originally set', function (t) {
      t.plan(1);

      const key = "incrementtest";

      store.increment(key, 10 * 1000)
      .then(function (result) {
        return store.get(key)
      })
      .then(function (result) {
        t.equal(result.count, 1, 'count should be 1')
      })
    });

    test(name + ' expires', function (t) {
      t.plan(1);

      const curDate = new Date();
      const object = {count: 1, lastRequest: curDate, firstRequest: curDate};

      store.increment('expiring', 0)
      .then(function (result) {
        return store.get('expiring');
      })
      .then(function (result) {
        t.equal(result, null);
      })
    });

    test(name + ' properly destroy', function (t) {
      store.knex.destroy().then(t.end);
    });  
  });
})