require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
pool.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    notification_id serial PRIMARY KEY,
    user_id         integer NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type            varchar NOT NULL,
    payload         jsonb,
    is_read         boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT NOW()
  )
`).then(() => {
  console.log('notifications table created');
  return pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
}).then(() => {
  console.log('index created');
  process.exit(0);
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
