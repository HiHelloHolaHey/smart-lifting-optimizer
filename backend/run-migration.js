require('dotenv').config();
const pgp = require('pg-promise')();
const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if (!file) { console.error('Usage: node run-migration.js <file.sql>'); process.exit(1); }
const db = pgp(process.env.DATABASE_URL);
db.none(fs.readFileSync(path.resolve(file), 'utf8'))
  .then(() => console.log('Migration applied:', file))
  .catch(e => { console.error(e.message); process.exitCode = 1; })
  .finally(() => pgp.end());
