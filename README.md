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
	KnexStore = require('express-brute-knex');

var store = new KnexStore({});
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
- `tablename`         Table name (default 'brute')


For details see [node-redis](https://github.com/mranney/node_redis).
