var AbstractClientStore = require('express-brute/lib/AbstractClientStore'),
    _ = require('lodash')

var KnexStore = module.exports = function (options) {
  var that = this;
	AbstractClientStore.apply(this, arguments);
	this.options = _.extend({}, KnexStore.defaults, options);
	this.knexOptions = _(this.options).clone();

  this.knex = require('knex')(this.options);
  this.ready = this.knex.schema.hasTable(this.options.tablename)
              .then(function (exists) {
                if (!exists) {
                   return that.knex.schema.createTable(that.options.tablename, function (table) {
                    table.string('key')
                    table.dateTime('firstRequest')
                    table.dateTime('lastRequest')
                    table.integer('lifetime')
                    table.integer('count')
                  })
                } else {
                  return true;
                }
              });
};
KnexStore.prototype = Object.create(AbstractClientStore.prototype);
KnexStore.prototype.set = function (key, value, lifetime, callback) {
  var that = this;
  lifetime = lifetime || 0;

  that.ready.then(function () {
    that.knex.select('*').from(that.options.tablename).where('key', '=', key)
    .then(function (foundKeys) {
      if (foundKeys.length == 0) {
        console.log(value)
        return that.knex(that.options.tablename)
        .insert({
            key: key,
            lifetime: lifetime,
            lastRequest: value.lastRequest,
            firstRequest: value.firstRequest,
            count: value.count
          })
        .then(function () {
          callback(null);
        })
        // .catch(function (err) {
        //   callback(err);
        // })
      } else {
        return that.knex(that.options.tablename)
        .where('key', '=', key)
        .update({
           lifetime: lifetime,
           count: value.count+foundKeys[0].count,
           lastRequest: value.lastRequest
          })
        .then(function (x) {
          callback.call(null);
        })
        // .catch(function (err) {
        //   callback.call(err);
        // })
      }
    })
  })
};
KnexStore.prototype.get = function (key, callback) {
  var that = this;
  that.ready.then(function () {
    return that.knex.select('*')
    .from(that.options.tablename)
    .where('key', '=', key)
    .then(function (response) {
      var data = {};
      if (response[0]) {
        data.lastRequest = new Date(response[0].lastRequest);
        data.firstRequest = new Date(response[0].firstRequest);
        data.count = response[0].count;
        callback(null, data)
      } else {
        callback(null, {
          count:0,
          firstRequest:new Date(),
          lastRequest:new Date()
        });
      }
    })
    // .catch(function (err) {
    //   callback(err)
    // })
  })
};
KnexStore.prototype.reset = function (key, callback) {
	this.client.del(this.options.prefix+key, function (err, data) {
		typeof callback == 'function' && callback.apply(this, arguments);
	});
};
KnexStore.defaults = {
	client: 'sqlite3',
  debug:true,
  connection: {
    filename: "./express-brute.sqlite"
  },
  tablename: 'brute'
};
