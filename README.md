# express-brute-knex

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][dependencies-image]][dependencies-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[![NPM][npm-image]][npm-url]

## A [knex.js](http://knexjs.org/) store for [express-brute](https://github.com/AdamPflug/express-brute).

### Installation

  via npm:

      $ npm install express-brute-knex

### Usage

### Usage

Refer to the [example application](https://github.com/llambda/express-brute-knex/blob/master/example.js).

### Options

- `tablename`         Table name (default 'brute') to store records in. Table will be created automatically if necessary.
- `knex`              knex instance to use. If not provided, defaults to a sqlite3 database named ./express-brute-knex.sqlite


[npm-version-image]: https://img.shields.io/npm/v/express-brute-knex.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/express-brute-knex.svg
[npm-image]: https://nodei.co/npm/express-brute-knex.png?downloads=true&downloadRank=true&stars=true
[npm-url]: https://npmjs.org/package/express-brute-knex
[travis-image]: https://img.shields.io/travis/llambda/express-brute-knex/master.svg
[travis-url]: https://travis-ci.org/llambda/express-brute-knex
[dependencies-image]: https://david-dm.org/llambda/express-brute-knex.svg?style=flat
[dependencies-url]: https://david-dm.org/llambda/express-brute-knex
[coveralls-image]: https://img.shields.io/coveralls/llambda/express-brute-knex/master.svg
[coveralls-url]: https://coveralls.io/r/llambda/express-brute-knex?branch=master
[node-image]: https://img.shields.io/node/v/express-brute-knex.svg
[node-url]: http://nodejs.org/download/
[gitter-join-chat-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-channel-url]: https://gitter.im/llambda/express-brute-knex
[express-session-url]: https://github.com/expressjs/session
[io-url]: https://iojs.org

