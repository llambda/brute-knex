express-brute-knex
===================
A [knex.js](http://knexjs.org/) store for [express-brute](https://github.com/AdamPflug/express-brute)

Installation
------------
  via npm:

      $ npm install express-brute-knex

Usage
-----
``` js
var ExpressBrute = require('express-brute'),
    KnexStore = require('express-brute-knex'),
    postgresknex = require('knex').initialize({
      debug: true,
      client: 'pg',
      connection: {
        host     : '127.0.0.1',
        user     : 'brute',
        password : '',
        database : 'brute',
        charset  : 'utf8',
      }
    });

var store = new KnexStore({
  tablename: 'brute',
  knex: postgresknex
});

var bruteforce = new ExpressBrute(store);

app.post('/auth',
	bruteforce.prevent, // error 403 if we hit this route too often
	function (req, res, next) {
		res.send('Success!');
	}
);
```

Options
-------
- `tablename`         Table name (default 'brute') to store records in. Table will be created automatically if necessary.
- `knex`              knex instance to use. If not provided, defaults to a sqlite3 database named ./express-brute-knex.sqlite

