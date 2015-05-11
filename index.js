var AbstractClientStore = require('express-brute/lib/AbstractClientStore');
var _ = require('lodash');

var KnexStore = module.exports = function (options) {
  var self = this;
  AbstractClientStore.apply(this, arguments);
  this.options = _.extend({}, KnexStore.defaults, options);

  if (this.options.knex) {
    this.knex = this.options.knex;
  } else {
    this.knex = require('knex')(KnexStore.defaultsKnex);
  }

  self.ready = self.knex.schema.hasTable(self.options.tablename).then(function (exists) {
    if (!exists) {
      return self.knex.schema.createTable(self.options.tablename, function (table) {
        table.string('key');
        table.dateTime('firstRequest');
        table.dateTime('lastRequest');
        table.dateTime('lifetime');
        table.integer('count');
      })
    }
  })
};
KnexStore.prototype = Object.create(AbstractClientStore.prototype);
KnexStore.prototype.set = function (key, value, lifetime, callback) {
  var self = this;
  lifetime = lifetime || 0;

  return self.ready.then(function () {
    return self.knex.transaction(function (trx) {
      return trx.select('*').forUpdate().from(self.options.tablename).where('key', '=', key)
      .then(function (foundKeys) {
        if (foundKeys.length == 0) {
          return trx.from(self.options.tablename)
          .insert({
            key: key,
            lifetime: new Date(Date.now() + lifetime  * 1000),
            lastRequest: value.lastRequest,
            firstRequest: value.firstRequest,
            count: value.count
          })
        } else {
          return trx(self.options.tablename)
          .where('key', '=', key)
          .update({
            lifetime: new Date(Date.now() + lifetime  * 1000),
            count: value.count,
            lastRequest: value.lastRequest
          })
        }
      }).asCallback(callback);
    })
  })
};
KnexStore.prototype.get = function (key, callback) {
  var self = this;
  return self.ready.tap(function () {
    return self.clearExpired();
  })
  .then(function () {
    return self.knex.select('*')
    .from(self.options.tablename)
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
  .catch(function (err) {
    if (callback) callback(err);
  })
};
KnexStore.prototype.reset = function (key, fn) {
  var self = this;
  return self.ready.then(function () {
    return self.knex(self.options.tablename)
    .where('key', '=', key)
    .del()
    .asCallback(fn);
  })
};

KnexStore.prototype.increment = function (key, lifetime, fn) {
  var self = this;
  return self.get(key).then(function (result) {
    if (result) {
      return self.knex(self.options.tablename).increment('count', 1).where('key', '=', key)
    } else {
      return self.knex(self.options.tablename).insert({
        key: key,
        firstRequest: new Date(),
        lastRequest: new Date(),
        lifetime: new Date(Date.now() + lifetime * 1000),
        count: 1
      })
    }
  }).asCallback(fn);
};

KnexStore.prototype.clearExpired = function () {
  var self = this;
  return self.ready.then(function () {
    return self.knex(self.options.tablename).del().where('lifetime', '<', new Date());
  });
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
