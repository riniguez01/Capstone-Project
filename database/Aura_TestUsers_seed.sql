-- ============================================
-- Aura Dating - Test Users Seed File
-- ============================================


-- ============================================
-- MAIN TEST USER
-- ============================================

INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Dante', 'Rivera', 'dante@test.com', 'hashedpassword',
    '1998-05-12', 2,
    'Love concerts, hiking, and trying new restaurants', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    69, 6, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for something serious',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (1, 85, NOW());

INSERT INTO preferences (
    user_id, preferred_age_min, preferred_age_max,
    min_distance_miles, max_distance_miles,
    preferred_height_min, preferred_height_max,
    preferred_religion_type_id,
    preferred_smoking, preferred_drinking,
    preferred_coffee, preferred_diet,
    preferred_activity_level, preferred_music,
    preferred_family_oriented, preferred_isgamer,
    preferred_isreader, preferred_travel_interest,
    preferred_pet_interest, preferred_dating_goals,
    preferred_personality_type, preferred_astrology_sign,
    preferred_want_children, preferred_political_affil
) VALUES (
    1, 22, 30,
    0, 50,
    60, 72,
    6,
    2, 3,
    1, 1,
    3, 1,
    1, 1,
    1, 1,
    1, 3,
    3, NULL,
    1, 3
);

INSERT INTO preference_genders (preference_id, gender_type_id)
VALUES (1, 3);

-- ============================================
-- SHOULD MATCH
-- ============================================

-- Beatrice: Perfect match
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Beatrice', 'Chen', 'beatrice@test.com', 'hashedpassword',
    '1999-03-15', 3,
    'Bookworm who loves hiking and live music', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    65, 6, 1, 1,
    3, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for something serious',
    3, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (2, 90, NOW());

-- Zendaya: Good match
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Zendaya', 'Brooks', 'zendaya@test.com', 'hashedpassword',
    '1997-07-22', 3,
    'Coffee addict, casual gamer, dog mom', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    63, 6, 1, 1,
    1, 1, 3,
    2, 2, 1, 1,
    2, 1, 3,
    1, 3, 1, 2,
    2, 3, 'Open to serious relationships',
    7, 1, 2
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (3, 75, NOW());

-- Olivia: Moderate match
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Olivia', 'Scott', 'olivia@test.com', 'hashedpassword',
    '2000-11-08', 3,
    'Musician and travel enthusiast based in Chicago', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    62, 6, 1, 1,
    2, 5, 4,
    2, 3, 2, 2,
    3, 2, 2,
    2, 1, 1, 1,
    1, 3, 'Looking for long term',
    1, 4, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (4, 55, NOW());

-- ============================================
-- SHOULD BE FILTERED OUT
-- ============================================

-- Shane: FILTERED - trust score 25
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Shane', 'Webb', 'shane@test.com', 'hashedpassword',
    '1999-01-01', 3,
    'Loves cooking and outdoor adventures', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    64, 6, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for serious relationship',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (5, 25, NOW());

-- Priya: FILTERED - wrong religion
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Priya', 'Patel', 'priya@test.com', 'hashedpassword',
    '1999-06-15', 3,
    'Yoga instructor who loves art and poetry', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    65, 2, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for serious relationship',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (6, 80, NOW());

-- Tyler: FILTERED - wrong gender
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Tyler', 'Brooks', 'tyler@test.com', 'hashedpassword',
    '1999-06-15', 2,
    'Huge sports fan and weekend chef', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    72, 6, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for serious relationship',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (7, 80, NOW());

-- Sandra: FILTERED - age out of range
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Sandra', 'Nguyen', 'sandra@test.com', 'hashedpassword',
    '1975-01-01', 3,
    'Wine lover and avid reader', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'active', NOW(), NOW(),
    63, 6, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for serious relationship',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (8, 85, NOW());

-- Jasmine: FILTERED - wrong state
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Jasmine', 'Torres', 'jasmine@test.com', 'hashedpassword',
    '1999-06-15', 3,
    'Surf instructor and foodie based in LA', NULL, 'Los Angeles',
    'CA', 34.052235, -118.243683,
    'active', NOW(), NOW(),
    65, 6, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for serious relationship',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (9, 85, NOW());

-- Derek: FILTERED - suspended account
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, gender_identity,
    bio, profile_photo_url, location_city,
    location_state, latitude, longitude,
    account_status, created_at, last_login,
    height_inches, religion_id, role_id, tier_id,
    ethnicity_id, language_id, education_career_id,
    smoking_id, drinking_id, coffee_id, diet_id,
    activity_level, family_oriented, music,
    gamer, reader, travel, pet_interest,
    personality_type, dating_goals, looking_for,
    astrology, children, political
) VALUES (
    'Derek', 'Mills', 'derek@test.com', 'hashedpassword',
    '1999-06-15', 3,
    'Photographer and street art enthusiast', NULL, 'Chicago',
    'IL', 41.878113, -87.629799,
    'suspended', NOW(), NOW(),
    64, 6, 1, 1,
    1, 1, 4,
    2, 3, 1, 1,
    3, 1, 1,
    3, 2, 2, 1,
    3, 3, 'Looking for serious relationship',
    5, 1, 3
);

INSERT INTO trust_score (user_id, internal_score, last_updated)
VALUES (10, 85, NOW());