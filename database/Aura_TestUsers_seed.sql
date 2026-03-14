-- ============================================
-- Aura Dating - Test Users Seed File
-- ============================================

-- Main test user (run matching as this user)
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1998-05-12', 'He/Him', 2,
    1, 'Love concerts, hiking, and trying new restaurants', 'Chicago',
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
    preferred_gender, min_distance_miles,
    max_distance_miles, preferred_height_min,
    preferred_height_max, preferred_religion_type_id,
    preferred_smoking, preferred_drinking,
    preferred_activity_level, preferred_dating_goals
) VALUES (
    1, 22, 30,
    3, 0,
    50, 60,
    72, 6,
    2, 3,
    3, 3
);

-- ============================================
-- SHOULD MATCH
-- ============================================

-- Candidate 1: Perfect match - highest score expected
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1999-03-15', 'She/Her', 3,
    1, 'Bookworm who loves hiking and live music', 'Chicago',
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

-- Candidate 2: Good match - medium score expected
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1997-07-22', 'She/Her', 3,
    1, 'Coffee addict, casual gamer, dog mom', 'Chicago',
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

-- Candidate 3: Valid match - moderate trust penalty
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '2000-11-08', 'She/Her', 3,
    1, 'Musician and travel enthusiast based in Chicago', 'Chicago',
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

-- Candidate 4: FILTERED - trust score below 40
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1999-01-01', 'He/Him', 3,
    1, 'Loves cooking and outdoor adventures', 'Chicago',
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

-- Candidate 5: FILTERED - wrong religion
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1999-06-15', 'She/Her', 3,
    1, 'Yoga instructor who loves art and poetry', 'Chicago',
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

-- Candidate 6: FILTERED - wrong gender
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1999-06-15', 'He/Him', 2,
    1, 'Huge sports fan and weekend chef', 'Chicago',
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

-- Candidate 7: FILTERED - age out of range
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1975-01-01', 'She/Her', 3,
    1, 'Wine lover and avid reader', 'Chicago',
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

-- Candidate 8: FILTERED - wrong location
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1999-06-15', 'She/Her', 3,
    1, 'Surf instructor and foodie based in LA', 'Los Angeles',
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

-- Candidate 9: FILTERED - suspended account
INSERT INTO users (
    first_name, last_name, email, password_hash,
    date_of_birth, pronouns, gender_identity,
    sexual_orientation, bio, location_city,
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
    '1999-06-15', 'He/Him', 3,
    1, 'Photographer and street art enthusiast', 'Chicago',
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

