require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const hash = '$2b$10$RIyatva2/Qc33XpWHLrjx.UbEsT4e3Z/E7LdurYh0ECxogjeuW3AS';

    await pool.query(
        `INSERT INTO users (
            first_name, last_name, email, password_hash,
            date_of_birth, gender_identity, bio, profile_photo_url,
            location_city, location_state, latitude, longitude,
            account_status, created_at, last_login,
            height_inches, religion_id, role_id, tier_id,
            ethnicity_id, language_id, education_career_id,
            smoking_id, drinking_id, coffee_id, diet_id,
            activity_level, family_oriented, music,
            gamer, reader, travel, pet_interest,
            personality_type, dating_goals, looking_for,
            astrology, children, political
        ) VALUES (
            $1,$2,$3,$4,
            '1995-08-20',1,'Fitness enthusiast looking for a connection',NULL,
            'Austin','TX',30.267153,-97.743057,
            'active',NOW(),NOW(),
            72,5,1,1,
            1,1,4,
            2,1,1,1,
            3,1,2,
            1,2,1,1,
            2,2,'Looking for something real',
            4,1,3
        )`,
        ['Marcus', 'Johnson', 'marcus@test.com', hash]
    );
    console.log('Step 1 done: user inserted');

    await pool.query(
        `INSERT INTO trust_score (user_id, internal_score, last_updated)
         SELECT user_id, 72, NOW() FROM users WHERE email = $1`,
        ['marcus@test.com']
    );
    console.log('Step 2 done: trust score inserted');

    await pool.query(
        `INSERT INTO preferences (
            user_id, preferred_age_min, preferred_age_max,
            min_distance_miles, max_distance_miles,
            preferred_height_min, preferred_height_max,
            preferred_dating_goals
         ) SELECT user_id, 18, 22, 0, 25, 60, 76, 2
           FROM users WHERE email = $1`,
        ['marcus@test.com']
    );
    console.log('Step 3 done: preferences inserted');

    await pool.query(
        `INSERT INTO preference_genders (preference_id, gender_type_id)
         SELECT p.preference_id, 1
         FROM preferences p
         JOIN users u ON u.user_id = p.user_id
         WHERE u.email = $1`,
        ['marcus@test.com']
    );
    console.log('Step 4 done: gender preference inserted');

    console.log('');
    console.log('===================================');
    console.log('Email:    marcus@test.com');
    console.log('Password: password123');
    console.log('Expected: 0 matches');
    console.log('===================================');
    process.exit(0);
}

run().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});