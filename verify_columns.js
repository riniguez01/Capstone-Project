require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
async function check() {
  const tables = [
    'smoking', 'drinking', 'coffee_drinker', 'diet',
    'activity_level', 'music', 'dating_goals',
    'political_affil', 'want_children', 'family_oriented',
    'personality_type', 'religion_type', 'gender_type',
    'ethnicity_type', 'education_career', 'gamer',
    'reader', 'travel_interest', 'pet_interest', 'astrology_sign'
  ];
  for (const t of tables) {
    const r = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`${t}: ${r.rows.map(c => c.column_name).join(', ')}`);
  }
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
