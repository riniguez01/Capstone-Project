-- Aura_migrations_v5.sql
-- Adds notifications table and survey_trigger for post-date survey flow

CREATE TABLE IF NOT EXISTS notifications (
    notification_id serial PRIMARY KEY,
    user_id         integer NOT NULL REFERENCES users(user_id),
    type            varchar NOT NULL,
    payload         jsonb,
    is_read         boolean DEFAULT false,
    created_at      timestamptz DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS survey_trigger (
    schedule_id integer PRIMARY KEY REFERENCES date_scheduling(schedule_id),
    user1_id    integer NOT NULL REFERENCES users(user_id),
    user2_id    integer NOT NULL REFERENCES users(user_id),
    trigger_at  timestamptz NOT NULL,
    sent        boolean DEFAULT false,
    created_at  timestamptz DEFAULT NOW()
);