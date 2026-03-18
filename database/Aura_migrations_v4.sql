-- v4 migrations

-- 1: rename height column to inches
ALTER TABLE users
RENAME COLUMN height_cm TO height_inches;

-- 2: simplify user_availability time slots
ALTER TABLE user_availability 
DROP COLUMN day_of_week;

ALTER TABLE user_availability
DROP COLUMN start_time;

ALTER TABLE user_availability
DROP COLUMN end_time;

ALTER TABLE user_availability
ADD COLUMN time_slot varchar;

-- 3: add no preference options
INSERT INTO religion_type (religion_name) VALUES ('No preference');
INSERT INTO ethnicity_type (ethnicity_name) VALUES ('No preference');
INSERT INTO education_career (education_career_name) VALUES ('No preference');
INSERT INTO activity_level (activity_name) VALUES ('No preference');
INSERT INTO family_oriented (family_oriented_name) VALUES ('No preference');
INSERT INTO want_children (want_children) VALUES ('No preference');
INSERT INTO dating_goals (dating_goal_name) VALUES ('No preference');
INSERT INTO political_affil (political_affil) VALUES ('No preference');
INSERT INTO gender_type (gender_name) VALUES ('Open to all');

-- 4: fix would_meet_again
ALTER TABLE post_date_checkin
DROP COLUMN would_meet_again;

ALTER TABLE post_date_checkin
ADD COLUMN would_meet_again varchar;

-- 5: add venue_name to date_scheduling
ALTER TABLE date_scheduling
ADD COLUMN venue_name varchar;