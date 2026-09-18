const pgp = require('pg-promise')();
const config = require('./index');

const db = pgp(config.databaseUrl);

module.exports = db;
