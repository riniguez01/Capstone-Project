const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const filterMatches = require("../matching/filterMatches");
const rankMatches = require("../matching/rankMatches");
const scoreMatch = require("../matching/scoreMatch");
const { normalizePreferredGenderIds } = require("../matching/preferredGenderIds");

function basePrefs(overrides = {}) {
    return {
        preferred_age_min: 18,
        preferred_age_max: 99,
        preferred_genders: [3],
        preferred_religion_type_id: null,
        preferred_religion_label: "No preference",
        preferred_political_affil: null,
        preferred_political_label: "No preference",
        preferred_ethnicity_id: null,
        preferred_ethnicity_label: "No preference",
        preferred_dating_goals: null,
        preferred_dating_goals_label: "No preference",
        preferred_want_children: null,
        preferred_want_children_label: "No preference",
        preferred_family_oriented: null,
        preferred_family_oriented_label: "No preference",
        min_distance_miles: null,
        max_distance_miles: null,
        preferred_height_min: null,
        preferred_height_max: null,
        ...overrides,
    };
}

describe("normalizePreferredGenderIds", () => {
    test("treats scalar int/bigint as single-id list (pg edge cases)", () => {
        assert.deepEqual(normalizePreferredGenderIds(3), [3]);
        assert.deepEqual(normalizePreferredGenderIds(3n), [3]);
    });
});

describe("filterMatches", () => {
    test("removes candidates at or below trust elimination threshold", () => {
        const user = {
            user_id: 1,
            gender_identity: 2,
            dating_goals: 3,
            dating_goals_name: "Long-term",
            children: 1,
            children_name: "Want kids",
            latitude: 41.87,
            longitude: -87.62,
            preferences: basePrefs(),
        };
        const bad = {
            user_id: 99,
            trust_score: 25,
            account_status: "active",
            gender_identity: 3,
            date_of_birth: "1999-01-01",
            preferences: { preferred_genders: [2] },
        };
        const out = filterMatches(user, [bad]);
        assert.equal(out.length, 0);
    });

    test("enforces mutual gender when both sides list preferences", () => {
        const user = {
            user_id: 1,
            gender_identity: 2,
            dating_goals: 3,
            dating_goals_name: "Long-term",
            children: 1,
            children_name: "Want kids",
            latitude: 41.87,
            longitude: -87.62,
            preferences: basePrefs({ preferred_genders: [3] }),
        };
        const womanOnlyWantsWomen = {
            user_id: 2,
            trust_score: 80,
            account_status: "active",
            gender_identity: 3,
            date_of_birth: "1999-01-01",
            preferences: { preferred_genders: [3] },
        };
        const out = filterMatches(user, [womanOnlyWantsWomen]);
        assert.equal(out.length, 0);
    });

    test("partner religion open (label) matches any candidate religion", () => {
        const user = {
            user_id: 1,
            gender_identity: 2,
            dating_goals: 3,
            dating_goals_name: "Long-term",
            children: 1,
            children_name: "Want kids",
            latitude: 41.87,
            longitude: -87.62,
            preferences: basePrefs({
                preferred_religion_type_id: 99,
                preferred_religion_label: "No preference",
                preferred_genders: [3],
            }),
        };
        const christianNb = {
            user_id: 2,
            trust_score: 80,
            account_status: "active",
            gender_identity: 3,
            religion_id: 5,
            political: 3,
            ethnicity_id: 1,
            dating_goals: 3,
            dating_goals_name: "Long-term",
            children: 1,
            children_name: "Want kids",
            date_of_birth: "1999-01-01",
            latitude: 41.87,
            longitude: -87.62,
            preferences: { preferred_genders: [2] },
        };
        const out = filterMatches(user, [christianNb]);
        assert.equal(out.length, 1);
    });

    test("filters by partner family-oriented when preference is Yes or No (not open)", () => {
        const user = {
            user_id: 1,
            gender_identity: 2,
            dating_goals: 3,
            dating_goals_name: "Long-term",
            children: 1,
            children_name: "Want kids",
            latitude: 41.87,
            longitude: -87.62,
            preferences: basePrefs({
                preferred_genders: [3],
                preferred_family_oriented: 1,
                preferred_family_oriented_label: "Yes",
            }),
        };
        const wantsFamilyYes = {
            user_id: 10,
            trust_score: 80,
            account_status: "active",
            gender_identity: 3,
            family_oriented: 1,
            religion_id: 5,
            political: 3,
            ethnicity_id: 1,
            dating_goals: 3,
            dating_goals_name: "Long-term",
            children: 1,
            children_name: "Want kids",
            date_of_birth: "1999-01-01",
            latitude: 41.87,
            longitude: -87.62,
            height_inches: 66,
            preferences: { preferred_genders: [2] },
        };
        const familyNo = { ...wantsFamilyYes, user_id: 11, family_oriented: 2 };
        const out = filterMatches(user, [familyNo, wantsFamilyYes]);
        assert.equal(out.length, 1);
        assert.equal(out[0].user_id, 10);
    });
});

describe("rankMatches", () => {
    test("applies penalty when candidate trust is at or below penalty threshold", () => {
        const user = {
            user_id: 1,
            gender_identity: 2,
            religion_id: 6,
            dating_goals: 3,
            children: 1,
            political: 3,
            family_oriented: 1,
            music: 1,
            travel: 2,
            pet_interest: 1,
            reader: 2,
            gamer: 3,
            activity_level: 3,
            drinking_id: 3,
            smoking_id: 2,
            diet_id: 1,
            coffee_id: 1,
            personality_type: 3,
        };
        const candidate = {
            user_id: 4,
            trust_score: 55,
            gender_identity: 3,
            religion_id: 6,
            dating_goals: 3,
            children: 1,
            political: 3,
            family_oriented: 1,
            music: 1,
            travel: 2,
            pet_interest: 1,
            reader: 2,
            gamer: 3,
            activity_level: 3,
            drinking_id: 3,
            smoking_id: 2,
            diet_id: 1,
            coffee_id: 1,
            personality_type: 3,
        };
        const raw = scoreMatch(user, candidate).totalScore;
        const ranked = rankMatches(user, [candidate]);
        assert.equal(ranked[0].raw_score, raw);
        assert.equal(ranked[0].trust_penalized, true);
        assert.equal(ranked[0].score, Math.max(0, raw - 15));
    });
});

describe("scoreMatch", () => {
    test("returns totalScore and breakdown in 0-100 range", () => {
        const a = {
            music: 1,
            travel: 2,
            pet_interest: 1,
            reader: 2,
            gamer: 3,
            activity_level: 3,
            drinking_id: 3,
            smoking_id: 2,
            diet_id: 1,
            coffee_id: 1,
            personality_type: 3,
            religion_id: 6,
            family_oriented: 1,
            political: 3,
            dating_goals: 3,
            children: 1,
            education_career_id: 4,
        };
        const b = { ...a };
        const r = scoreMatch(a, b);
        assert.ok(r.totalScore >= 0 && r.totalScore <= 100);
        assert.ok(r.breakdown.interests >= 0 && r.breakdown.interests <= 100);
    });
});
