-- v7: Create missing tables needed for notifications, surveys, and post-date checkins

CREATE TABLE IF NOT EXISTS notifications (
    notification_id serial PRIMARY KEY,
    user_id         integer NOT NULL,
    type            varchar NOT NULL,
    payload         jsonb,
    is_read         boolean DEFAULT false,
    created_at      timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_trigger (
    survey_trigger_id serial PRIMARY KEY,
    schedule_id       integer UNIQUE,
    user1_id          integer,
    user2_id          integer,
    trigger_at        timestamptz,
    sent              boolean DEFAULT false,
    created_at        timestamptz DEFAULT NOW()
);

ALTER TABLE post_date_checkin
    DROP COLUMN IF EXISTS would_meet_again;

ALTER TABLE post_date_checkin
    ADD COLUMN IF NOT EXISTS would_meet_again varchar;

ALTER TABLE post_date_checkin
    ADD COLUMN IF NOT EXISTS short_comment text;

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    NOT VALID;