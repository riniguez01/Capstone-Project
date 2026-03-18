--section 1: fixing typo in date_scheduling
ALTER TABLE date_scheduling
RENAME COLUMN porposed_datetime to proposed_datetime;

--section 2: add short_comment to post_date_checkin
ALTER TABLE post_date_checkin
ADD COLUMN short_comment  VARCHAR(500);

--section 3: add trust_score_history table
CREATE TABLE "trust_score_history" (
    "history_id" serial PRIMARY KEY,
    "user_id" integer,
    "score_after" integer,
    "change_reason" varchar,
    "created_at" timestamptz,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE safety_actions (
    action_id serial PRIMARY KEY,
    match_id integer,
    message_id integer,
    action_taken varchar,
    reason text,
    created_at timestamptz DEFAULT now(),
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (message_id) REFERENCES message(message_id)
);

--section 4: add user_availability table
CREATE TABLE "user_availability" (
    "availability_id" serial PRIMARY KEY,
    "user_id" integer,
    "time_slot" VARCHAR,
    "created_at" timestamptz,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

--section 5: fixed preferred gender to support multiple genders
ALTER TABLE preferences
DROP COLUMN preferred_gender;

CREATE TABLE "preference_genders" (
    "preference_id" integer,
    "gender_type_id" integer,
    PRIMARY KEY (preference_id, gender_type_id),
    FOREIGN KEY (preference_id) REFERENCES preferences(preference_id),
    FOREIGN KEY (gender_type_id) REFERENCES gender_type(gender_type_id)
);

--section 6: add CHECK constraints
ALTER TABLE swipes
ADD CONSTRAINT check_swipe_type
CHECK (swipe_type IN ('like', 'dislike', 'superlike'));
  
ALTER TABLE matches
ADD CONSTRAINT check_match_status
CHECK (match_status IN ('active', 'unmatched', 'blocked'));

ALTER TABLE reports
ADD CONSTRAINT check_report_status
CHECK (status IN ('pending', 'reviewed', 'resolved'));

ALTER TABLE moderation
ADD CONSTRAINT check_action_type
CHECK (action_type IN ('warning', 'mute', 'suspension', 'ban'));

ALTER TABLE date_scheduling
ADD CONSTRAINT check_venue_type
CHECK (venue_type IN ('public', 'semi-public', 'private'));

ALTER TABLE date_scheduling
ADD CONSTRAINT check_schedule_status
CHECK (status IN ('approved', 'rejected', 'modified'));

ALTER TABLE conversation_safety_state
ADD CONSTRAINT check_escalation_level
CHECK (escalation_level IN ('normal', 'warning', 'restrict'));

ALTER TABLE users
ADD CONSTRAINT check_account_status 
CHECK (account_status IN ('active', 'suspended', 'banned'));

--section 7: add indexes
CREATE INDEX idx_message_match_id ON message(match_id);

CREATE INDEX idx_message_sender_id ON message(sender_id);

CREATE INDEX idx_post_date_checkin_reviewed_user_id ON post_date_checkin(reviewed_user_id);

CREATE INDEX idx_swipe_and_swiped_user_id ON swipes(swipe_user_id, swiped_user_id);

CREATE INDEX idx_trust_score_user_id ON trust_score(user_id);

CREATE INDEX idx_users_dating_goals ON users(dating_goals);

CREATE INDEX idx_users_location_state ON users(location_state);

CREATE INDEX idx_preferences_user_id ON preferences(user_id);