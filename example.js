const ExpressBrute = require('express-brute');
const BruteKnex = require('.');
const Knex = require('knex');

var store = new BruteKnex({
	createTable: true
});

const bruteforce = new ExpressBrute(store, {
	freeRetries: 2
});

const express = require('express');
const app = express();
app.get('/',
	bruteforce.prevent, // 403 if we hit this route too often
	function (req, res, next) {
		res.send('Success!');
	}
);

app.listen(3000);
