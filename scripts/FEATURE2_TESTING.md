# Feature 2 — Post-date safety check-in & trust (testing guide)

Use the **Feature 2 test pair** the same way Feature 3 uses `feature3TestPair.js`: seed once, then **`reset`** between runs to wipe check-ins, trust, moderation, dates, and chat while keeping the same logins.

---

## Prerequisites

1. **PostgreSQL** reachable with credentials in `.env` (project root or `backend/.env`): `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` if needed.
2. **Migration v8** applied (`database/Aura_migrations_v8.sql`) so `scheduled_end_at`, `trust_score.public_trust_rating`, `trust_safety_events`, `moderation_actions`, `moderation_appeals`, etc. exist.
3. **Backend** on port **4000** (or your `API_BASE_URL`).
4. **Frontend** with `API_BASE_URL` pointing at that backend (see `frontend/src/config/api.js`).

---

## Test accounts (created by the seed script)

| Email               | Role in pair | Password     |
|---------------------|--------------|--------------|
| `feature2a@test.com` | Alpha (Woman) | `password123` |
| `feature2b@test.com` | Beta (Man)    | `password123` |

Both users are in **Chicago**, mutually matched, with **trust_score internal = 75** and **no public rating** until enough dated feedback exists.

---

## Commands

From the **project root**:

```bash
# First time (or full recreate): drops old Feature 2 users if present, creates both users + mutual match
node scripts/feature2TestPair.js seed
```

```bash
# Between test runs: resets trust + moderation + dates + messages + match row, then recreates mutual match
node scripts/feature2TestPair.js reset
```

After **`reset`**, restart the backend so the **survey cron** (runs every 60s) and any in-memory state are clean.

---

## Structured test scenarios

### A — Environment smoke test

1. Run `node scripts/feature2TestPair.js seed`.
2. Start backend + frontend.
3. Log in as **feature2a@test.com**.
4. Call **`GET /auth/me`** with Bearer token (or open Profile after load) and confirm **`trust_display.label`** is **New User** and **`dates_reviewed`** is **0** (or low until you complete flows).

**Pass criteria:** No 500s; profile loads; trust shows “New User” until 3+ distinct reviewed dates.

---

### B — Date request → approve → survey notification timing

1. Run **`reset`** (or **`seed`** if first time); restart backend.
2. Log in as **feature2a** (or **b**).
3. From **Date planner** (or API), send a date request to the match using a **`venue_type` of `public`** (required if you later flag `trust_public_dates_only` — default accounts are not flagged).
4. Log in as the **other** user → **Notifications** → **Accept** the date.

**Why surveys used to “never” show:** the planner picks the **next** Fri/Sun slot, so `proposed_datetime` is often **days in the future**. The spec stores `trigger_at = proposed_datetime + 2h + 1m` (after “date end”), which is also days away — the job only sends when `trigger_at <= NOW()`.

**Current behavior:**

- **`NODE_ENV=production`:** `trigger_at` stays **`proposed_datetime + 2 hours + 1 minute`** (realistic delay).
- **Non-production (local default):** `trigger_at` is **`NOW()`**, and the server **runs the survey job right after approve**, so both users should get **`post_date_survey`** within the same request cycle (refresh **Notifications**).

**Override:** set **`POST_DATE_SURVEY_RELAXED_TIMING=false`** in `backend/.env` to force delayed timing even locally (you must then wait until `trigger_at` or call `POST /dates/survey-check` after that time).

**Pass criteria:** Both users see “How did your date go?”; payload includes `schedule_id`.

---

### C — Safety check-in (happy path)

1. Complete **B** so `schedule_id` exists and survey notifications fired (or open **Post-date** from notification state with `schedule_id`).
2. As **feature2a**, open **`/postDate`** from the notification (state must include `schedule_id`).
3. Submit: comfort **4–5**, **safe = Yes**, **boundaries = Yes**, **pressure = No**, **meet again = Yes** (meet again does not change the safety score; it is stored only).
4. Repeat as **feature2b** reviewing the partner (swap roles conceptually — each submits about the **other** user).

**Pass criteria:** `201` from `POST /dates/survey`; **`GET /auth/me`** for the *reviewed* user shows updated **`trust_display`** when enough distinct dates exist; no duplicate submit (second submit → **409**).

---

### D — “New user” vs public rating

1. After **`reset`**, run **B + C** for **one** approved date only (two check-ins, one `schedule_id`).

**Pass criteria:** Distinct dates as reviewee **&lt; 3** → label stays **New User**; numeric public rating may stay hidden per product rules.

2. To exercise **≥ 3 dates** quickly you can either:
   - repeat **B + C** with **reset** skipped and **new date requests** three times (three distinct `schedule_id`s), or  
   - insert minimal rows in SQL (advanced) — prefer three real flows for realism.

**Pass criteria:** After **3 distinct** `schedule_id`s as **reviewed** user, **`public_trust_rating`** and shield count appear when you load profile / matches.

---

### E — Negative signal (single-event cap)

1. **`reset`**, then one full **B** cycle.
2. Submit check-in with **safe = No** or **pressure = Yes** (strong negative signals).
3. Inspect DB: `trust_score.internal_score` drops; public average respects **≤ 0.3** drop vs previous public per event when applicable.

**Pass criteria:** Scores change; no absurd single-step public collapse.

---

### F — Appeals (eligibility + freeze)

**Who can appeal**

- A user with an **active** `moderation_actions` row, **or**
- A user with at least one **`trust_safety_events`** row as **subject** in the last **90 days** (e.g. after a negative date check-in about them).

**UI**

1. As an eligible user, open **Profile** — you should see **Submit a trust appeal** when **`GET /appeals/eligibility`** returns `eligible: true`, or use the sidebar **Trust appeal** link and open **`/appeals`**.
2. Submit category **Misunderstanding** | **False report** | **Context missing** and explanation (**10–300** chars).

**API-only (optional)**

1. Trigger eligibility via **moderation_actions** (SQL `active = true`) **or** complete a check-in in **E** that creates **`trust_safety_events`** for the reviewee.
2. **`POST /appeals`** with the same category + explanation rules.

**Freeze**

3. After a successful appeal submit, submit another check-in **as reviewee** — internal/public trust should **not** move while **`trust_frozen_until`** is set (appeal pending).

**Pass criteria:** `201` from **`POST /appeals`** when eligible; **`403`** when not; **`GET /appeals/mine`** lists submissions; freeze on `trust_score` as documented.

---

### G — Notifications (bell badge, read state, panel)

**Setup:** Complete **B** through the **Accept** step so the **requester** gets a **`date_accepted`** (or **Decline** to test **`date_declined`**).

1. As the **requester** (person who sent the date request), open the **bell** once.
   - **Pass:** Badge count drops for **accept/decline** (they are marked read when the panel **opens**).
   - **Pass:** Notification rows still appear but show as **read** (dimmed styling where applied).
2. Click **outside** the panel (not on the bell).
   - **Pass:** Panel closes without requiring a second bell click.
3. Open **`/notifications`** full page after a new accept/decline.
   - **Pass:** Same informational types are marked read; navbar badge updates (or within ~60s poll / next interaction via **`notificationEpoch`**).
4. **Pending date request** (recipient): open the bell — **Accept/Decline** should still be available; badge should still reflect **unread** until you respond (do **not** bulk-mark `date_request` on open).
5. **`post_date_survey`:** Badge stays until **`POST /dates/survey`** succeeds (then that user’s survey row is marked read server-side). Opening the bell alone does **not** clear survey unread count.

---

### H — Post-date survey “already submitted” UI

1. Complete **C** for one user on a given `schedule_id`.
2. Open **`/postDate`** again with the same `schedule_id` (bookmark or navigate from notification if still visible).

**Pass criteria:** **`GET /dates/survey/status/:scheduleId`** returns `submitted: true`; form is **disabled** / greyed; message explains check-in already recorded (not only a 409 on submit).

---

### I — Shields vs profile (expectations)

1. After **3+** distinct reviewed dates, compare **Profile** safety trust and a **Matching** card for **another** user.

**Pass criteria:** Same underlying rules (**`trustLabelFromPublic`**); shields are a **rounded** rolling average — one bad review may not change the shield count; Profile shows a short note about rolling average when numeric trust is shown.

---

## Quick API reference (manual testing)

- `POST /dates/survey` — body: `schedule_id`, `comfortScore`, `feltSafe`, `boundariesRespected`, `feltPressured`, `wouldSeeAgain`, optional `comments` (JWT).
- `GET /dates/survey/status/:scheduleId` — JWT; `{ "submitted": true | false }`.
- `PATCH /dates/notifications/:userId/read` — JWT; body `{ "types": ["date_accepted", "date_declined"] }` or `{ "notification_ids": [ ... ] }` (must match authenticated user).
- `GET /dates/notifications/:userId` — JWT; **must** match JWT user id.
- `POST /dates/survey-check` — triggers pending surveys (no JWT in current route; use only in dev).
- `GET /auth/me` — includes **`trust_display`**.
- `GET /appeals/eligibility` — JWT; `{ "eligible": boolean, "reason"?: string }`.
- `POST /appeals` — JWT, `{ "category": "Misunderstanding" | "False report" | "Context missing", "explanation": "..." }` (10–300 chars).
- `GET /appeals/mine` — JWT; list appeals.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Survey never appears | **Notifications must use your API:** `Notifications.jsx` uses `API_BASE_URL` (in dev = `http://localhost:4000`). If **`NODE_ENV=production`** on the backend, `trigger_at` may be days ahead — set `POST_DATE_SURVEY_RELAXED_TIMING=true` or test with non-production `NODE_ENV`. After Accept, **`runSurveyTriggers` runs immediately**; refresh Notifications. |
| 409 on survey | Unique `(schedule_id, reviewer_user_id)` — already submitted for that date. UI should block resubmit via **`/dates/survey/status/...`**. |
| Accept/decline badge never clears | Open the **bell** or **`/notifications`** so **`date_accepted` / `date_declined`** mark read; ensure you are logged in as the **requester** for that test. |
| Survey badge won’t clear until submit | By design — only successful **`POST /dates/survey`** marks **`post_date_survey`** read. |
| `403` on `GET /dates/notifications/:otherUserId` | Notifications are scoped to the JWT user only. |
| Trust not resetting | Run **`reset`** again; confirm `trust_score` row exists for both `user_id`s. |
| DB errors on reset | Apply migration v8; ensure `moderation_appeals` / `trust_safety_events` tables exist. |
| No appeal form on `/appeals` | **`GET /appeals/eligibility`** — need moderation action or a **`trust_safety_events`** row in the last 90 days for that user. |

---

## Related files

- `scripts/feature2TestPair.js` — seed / reset implementation  
- `database/Aura_migrations_v8.sql` — Feature 2 DDL  
- `backend/services/trustService.js` — scoring and moderation hooks  
