var AbstractClientStore = require('express-brute/lib/AbstractClientStore'),
  _ = require('lodash'),
  Promise = require('bluebird')

var KnexStore = module.exports = function (options) {
  var that = this;
  AbstractClientStore.apply(this, arguments);
  this.options = _.extend({}, KnexStore.defaults, options);
  this.knexOptions = _(this.options).clone();

  if (this.options.knex) {
    this.knex = this.options.knex;
  } else {
    this.knex = require('knex')(KnexStore.defaultsKnex);
  }

  that.ready = that.knex.schema.hasTable(that.options.tablename).then(function (exists) {
    if (!exists) {
      return that.knex.schema.createTable(that.options.tablename, function (table) {
        table.string('key')
        table.dateTime('firstRequest')
        table.dateTime('lastRequest')
        table.dateTime('lifetime')
        table.integer('count')
      })
    }
  })
};
KnexStore.prototype = Object.create(AbstractClientStore.prototype);
KnexStore.prototype.set = function (key, value, lifetime, callback) {
  var that = this;
  lifetime = lifetime || 0;

  return that.ready.then(function () {
    return that.knex.transaction(function (trx) {
      return trx.select('*').forUpdate().from(that.options.tablename).where('key', '=', key)
      .then(function (foundKeys) {
        if (foundKeys.length == 0) {
          return trx.from(that.options.tablename)
          .insert({
            key: key,
            lifetime: new Date(Date.now() + lifetime  * 1000),
            lastRequest: value.lastRequest,
            firstRequest: value.firstRequest,
            count: value.count
          })
        } else {
          return trx(that.options.tablename)
          .where('key', '=', key)
          .update({
            lifetime: new Date(Date.now() + lifetime  * 1000),
            count: value.count+foundKeys[0].count,
            lastRequest: value.lastRequest
          })
        }
      })
      .then(function (res) {
        if (callback) {
          callback(null);
        }
        return res;
      })
    })
  })
};
KnexStore.prototype.get = function (key, callback) {
  var that = this;
  return that.ready.tap(function () {
    return that.clearExpired();
  })
  .then(function () {
    return that.knex.select('*')
    .from(that.options.tablename)
    .where('key', '=', key)
  })
  .then(function (response) {
    var data = {};
    if (response[0]) {
      data.lastRequest = new Date(response[0].lastRequest);
      data.firstRequest = new Date(response[0].firstRequest);
      data.count = response[0].count;
      if (callback) {
        callback(null, data)
      }
      return data;
    } else {
      retval = null;
      if (callback) {
        callback(null, retval);
      }
      return retval;
    }
  })
};
KnexStore.prototype.reset = function (key, callback) {
  var that = this;
  return that.ready.then(function () {
    return that.knex(that.options.tablename)
    .where('key', '=', key)
    .update({count:0})
    .then(function (res) {
      if (callback) {
        callback(null);
      }
      return res;
    })
  })
};
KnexStore.prototype.increment = function (key, lifetime, callback) {
  var that = this;
  return that.get(key).then(function (result) {
    if (result) {
      return that.knex(that.options.tablename).increment('count', 1).where('key', '=', key)
    } else {
      return that.knex(that.options.tablename).insert({
        key: key,
        firstRequest: new Date(),
        lastRequest: new Date(),
        lifetime: new Date(Date.now() + lifetime * 1000),
        count: 1
      })
    }
  })
  .then(function (res) {
    if (callback) {
      callback(null, res);
    }
    return res;
  })
};

KnexStore.prototype.clearExpired = function () {
  // var that = this;
  // return that
  // .ready
  // .then(function () {
  //   return that.knex(that.options.tablename).del().where('lifetime', '<', new Date());
  // });
  var that = this;
  return that.knex(that.options.tablename).del().where('lifetime', '<', new Date());
};



KnexStore.defaults = {
  tablename: 'brute'
};

KnexStore.defaultsKnex = {
  client: 'sqlite3',
  // debug: true,
  connection: {
    filename: "./express-brute-knex.sqlite"
  }
}
