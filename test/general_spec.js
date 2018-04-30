const Promise = require('bluebird');
Promise.longStackTraces();

const BruteKnex = require('../lib');
const db = require('../lib/db');
const should = require('should');
const config = require('ghost-ignition').config();
const knex = db.createConnection(config.get('database'));
const name = config.get('database:client');

let store;

describe('General Tests', function () {
    before(function () {
        return knex.schema.dropTableIfExists('brute')
            .finally(function () {
                store = new BruteKnex({
                    knex: knex,
                    createTable: true
                });
            })
    });

    after(function () {
        return knex.destroy();
    });

    it(name + ' properly instantiate', function () {
        (store instanceof BruteKnex).should.be.true();
    });


    it(name + ' return null when no value is available', function () {
        return store.get('novalue').then(function (result) {
            should.not.exist(result);
        });
    });

    it(name + ' set records and get them back', function () {
        const curDate = new Date().toISOString();
        const object = { count: 17, lastRequest: curDate, firstRequest: curDate };

        return store.set('set records', object, 10 * 1000)
            .tap(function (result) {
                if (result[0] === 0) {
                    // mysql
                    result[0].should.eql(0);
                } else if (result.rowCount) {
                    // postgresql
                    result.rowCount.should.eql(1);
                } else {
                    // sqlite
                    result[0].should.eql(1);
                }
            })
            .then(function () {
                return store.get('set records').then(function (result) {
                    result.count.should.eql(17);
                });
            });
    });

    it(name + ' set records, not get them back if they expire', function () {
        const curDate = new Date().toISOString();
        const object = { count: 17, lastRequest: curDate, firstRequest: curDate };

        // NOTE: we currently use `timestamp` type, this does not store MS in e.g. MySQL
        // So we have to minimum set the lifetime to -1s
        return store.set('1234expire', object, -2000)
            .then(function () {
                return store.get('1234expire').then(function (result) {
                    should.not.exist(result);
                });
            });
    });

    it(name + ' reset (delete) a record', function () {
        const curDate = new Date().toISOString();
        const object = { count: 36713, lastRequest: curDate, firstRequest: curDate };
        const key = "reset1.2.3.4";

        return store.set(key, object, 10 * 1000)
            .then(function () {
                return store.reset(key);
            })
            .then(function (res) {
                return store.get(key);
            })
            .then(function (res) {
                should.not.exist(res);
            })
    });

    it(name + ' increment even if not originally set', function () {
        const key = "incrementtest";

        return store.increment(key, 10 * 1000)
            .then(function (result) {
                return store.get(key)
            })
            .then(function (result) {
                result.count.should.eql(1);
            })
    });

    it(name + ' expires', function () {
        const curDate = new Date().toISOString();
        const object = { count: 1, lastRequest: curDate, firstRequest: curDate };

        return store.increment('expiring', -2000)
            .then(function () {
                return store.get('expiring');
            })
            .then(function (result) {
                should.not.exist(result);
            })
    });
});
