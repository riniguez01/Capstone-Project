/**
 * Rebuilds capstone demo accounts: removes all @test.com and @aura.demo users (and dependent rows),
 * then inserts a curated roster with password: password123 (bcrypt hash below).
 *
 * Run from project root (loads .env then backend/.env):
 *   node scripts/seedCapstoneDemoUsers.js
 *
 * Requires: seed_data.sql + migrations (lookup tables, height_inches, preferences.user_id unique, preferred_ethnicity_id).
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { main: assignTestUserProfilePhotos } = require("./assignTestUserProfilePhotos");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

/** Same hash as database/Aura_migration_v11.sql — plaintext: password123 */
const PASSWORD_HASH =
    "$2b$10$RIyatva2/Qc33XpWHLrjx.UbEsT4e3Z/E7LdurYh0ECxogjeuW3AS";

const CHI_LAT = 41.878113;
const CHI_LON = -87.629799;
const LA_LAT = 34.052235;
const LA_LON = -118.243683;
/** ~92 miles from Chicago — should fail max_distance 50 miles for Chicago viewers */
const MKE_LAT = 43.038902;
const MKE_LON = -87.906474;

/**
 * @typedef {Object} PrefSpec
 * @property {number} minAge
 * @property {number} maxAge
 * @property {number} minHeight
 * @property {number} maxHeight
 * @property {number} min_distance_miles
 * @property {number} max_distance_miles
 * @property {string|null} religion — partner religion label or null for open
 * @property {string|null} ethnicity — partner ethnicity or null
 * @property {string|null} political
 * @property {string|null} children
 * @property {string|null} dating_goal
 * @property {string|null} activity
 * @property {string|null} family
 * @property {string[]|null} genderPrefs — UI labels: Male, Female, Non-binary (maps to Man/Woman/Non-binary in DB)
 */

/**
 * @typedef {Object} UserSpec
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} dob — YYYY-MM-DD
 * @property {string} gender — Man | Woman | Non-binary (DB gender_type.gender_name)
 * @property {string} bio
 * @property {string} city
 * @property {string} state
 * @property {number} lat
 * @property {number} lon
 * @property {number} height_inches
 * @property {string} religion
 * @property {string} ethnicity
 * @property {string} education
 * @property {string} family_own — Yes | No | No preference
 * @property {string} smoker
 * @property {string} drinker
 * @property {string} coffee
 * @property {string} diet
 * @property {string} activity
 * @property {string} music
 * @property {string} gamer
 * @property {string} reader
 * @property {string} travel
 * @property {string} pets
 * @property {string} personality
 * @property {string} dating_goal
 * @property {string} astrology
 * @property {string} children_own
 * @property {string} political
 * @property {number} trust
 * @property {string} account_status
 * @property {PrefSpec} pref
 */

/** @type {UserSpec[]} */
const DEMO_USERS = [
    {
        email: "dante@test.com",
        first_name: "Dante",
        last_name: "Rivera",
        dob: "1998-05-12",
        gender: "Woman",
        bio: "Love concerts, hiking, and trying new restaurants.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 69,
        religion: "Christian",
        ethnicity: "Asian",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "High",
        music: "Pop",
        gamer: "Casual",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Serious",
        astrology: "Leo",
        children_own: "Want kids",
        political: "Moderate",
        trust: 85,
        account_status: "active",
        pref: {
            minAge: 22,
            maxAge: 40,
            minHeight: 58,
            maxHeight: 76,
            min_distance_miles: 0,
            max_distance_miles: 50,
            /** Explicit constraints for demo + preference-aware matching (Beatrice/Avery align). */
            religion: "Christian",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Open",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "beatrice@test.com",
        first_name: "Beatrice",
        last_name: "Chen",
        dob: "1999-03-15",
        gender: "Non-binary",
        bio: "Bookworm who loves hiking and live music.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 65,
        religion: "Christian",
        ethnicity: "Hispanic / Latino",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "High",
        music: "Classical",
        gamer: "No",
        reader: "Yes",
        travel: "Love it",
        pets: "Have pets",
        personality: "Ambivert",
        dating_goal: "Long-term",
        astrology: "Libra",
        children_own: "Open",
        political: "Moderate",
        trust: 90,
        account_status: "active",
        pref: {
            minAge: 24,
            maxAge: 35,
            minHeight: 60,
            maxHeight: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "Christian",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Want kids",
            dating_goal: "Long-term",
            activity: "High",
            family: "Yes",
            genderPrefs: ["Female"],
        },
    },
    {
        email: "zendaya@test.com",
        first_name: "Zendaya",
        last_name: "Brooks",
        dob: "1997-07-22",
        gender: "Non-binary",
        bio: "Coffee addict, casual gamer, dog mom.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 63,
        religion: "Christian",
        ethnicity: "Black / African American",
        education: "Some College",
        family_own: "Yes",
        smoker: "No",
        drinker: "No",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Hip-Hop / Rap",
        gamer: "Casual",
        reader: "Occasionally",
        travel: "Occasionally",
        pets: "Have pets",
        personality: "Extrovert",
        dating_goal: "Serious",
        astrology: "Virgo",
        children_own: "Open",
        political: "Liberal",
        trust: 75,
        account_status: "active",
        pref: {
            minAge: 23,
            maxAge: 38,
            minHeight: 60,
            maxHeight: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "No preference",
            ethnicity: "No preference",
            political: "No preference",
            children: "No preference",
            dating_goal: "Serious",
            activity: "Medium",
            family: "No preference",
            genderPrefs: ["Woman", "Non-binary"],
        },
    },
    {
        email: "olivia@test.com",
        first_name: "Olivia",
        last_name: "Scott",
        dob: "2000-11-08",
        gender: "Non-binary",
        bio: "Musician and travel enthusiast based in Chicago.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 62,
        religion: "Christian",
        ethnicity: "White / Caucasian",
        education: "Bachelor's Degree",
        family_own: "No",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Vegetarian",
        activity: "High",
        music: "Rock",
        gamer: "No",
        reader: "Yes",
        travel: "Love it",
        pets: "Neutral",
        personality: "Ambivert",
        dating_goal: "Long-term",
        astrology: "Scorpio",
        children_own: "Don't want kids",
        political: "Moderate",
        trust: 55,
        account_status: "active",
        pref: {
            minAge: 21,
            maxAge: 32,
            minHeight: 60,
            maxHeight: 70,
            min_distance_miles: 0,
            max_distance_miles: 40,
            religion: "No preference",
            ethnicity: "White / Caucasian",
            political: "Moderate",
            children: "Don't want kids",
            dating_goal: "Long-term",
            activity: "High",
            family: "No",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "shane@test.com",
        first_name: "Shane",
        last_name: "Webb",
        dob: "1999-01-01",
        gender: "Non-binary",
        bio: "Loves cooking and outdoor adventures.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 64,
        religion: "Christian",
        ethnicity: "Asian",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "High",
        music: "Country",
        gamer: "No",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Serious",
        astrology: "Capricorn",
        children_own: "Want kids",
        political: "Moderate",
        trust: 25,
        account_status: "active",
        pref: {
            minAge: 22,
            maxAge: 35,
            minHeight: 60,
            maxHeight: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "Christian",
            ethnicity: "Asian",
            political: "Moderate",
            children: "Want kids",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "priya@test.com",
        first_name: "Priya",
        last_name: "Patel",
        dob: "1999-06-15",
        gender: "Non-binary",
        bio: "Yoga instructor who loves art and poetry.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 65,
        religion: "Hindu",
        ethnicity: "Asian",
        education: "Master's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Vegetarian",
        activity: "High",
        music: "Classical",
        gamer: "No",
        reader: "Yes",
        travel: "Love it",
        pets: "Neutral",
        personality: "Introvert",
        dating_goal: "Serious",
        astrology: "Pisces",
        children_own: "Open",
        political: "Liberal",
        trust: 80,
        account_status: "active",
        pref: {
            minAge: 25,
            maxAge: 40,
            minHeight: 62,
            maxHeight: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "Hindu",
            ethnicity: "Asian",
            political: "Liberal",
            children: "Open",
            dating_goal: "Serious",
            activity: "High",
            family: "Yes",
            genderPrefs: ["Woman", "Non-binary"],
        },
    },
    {
        email: "tyler@test.com",
        first_name: "Tyler",
        last_name: "Brooks",
        dob: "1999-06-15",
        gender: "Man",
        bio: "Huge sports fan and weekend chef.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 72,
        religion: "Christian",
        ethnicity: "Black / African American",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "High",
        music: "Hip-Hop / Rap",
        gamer: "Casual",
        reader: "No",
        travel: "Occasionally",
        pets: "Have pets",
        personality: "Extrovert",
        dating_goal: "Serious",
        astrology: "Aries",
        children_own: "Want kids",
        political: "Moderate",
        trust: 80,
        account_status: "active",
        pref: {
            minAge: 22,
            maxAge: 35,
            minHeight: 62,
            maxHeight: 70,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "No preference",
            ethnicity: "No preference",
            political: "No preference",
            children: "Want kids",
            dating_goal: "Long-term",
            activity: "High",
            family: "Yes",
            genderPrefs: ["Female"],
        },
    },
    {
        email: "sandra@test.com",
        first_name: "Sandra",
        last_name: "Nguyen",
        dob: "1975-01-01",
        gender: "Non-binary",
        bio: "Wine lover and avid reader.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 63,
        religion: "Christian",
        ethnicity: "Asian",
        education: "Master's Degree",
        family_own: "No",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Jazz / Blues",
        gamer: "No",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Serious",
        astrology: "Cancer",
        children_own: "Don't want kids",
        political: "Moderate",
        trust: 85,
        account_status: "active",
        pref: {
            minAge: 45,
            maxAge: 60,
            minHeight: 60,
            maxHeight: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "No preference",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Don't want kids",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "No",
            genderPrefs: ["Non-binary", "Woman"],
        },
    },
    {
        email: "jasmine@test.com",
        first_name: "Jasmine",
        last_name: "Torres",
        dob: "1999-06-15",
        gender: "Non-binary",
        bio: "Surf instructor and foodie based in LA.",
        city: "Los Angeles",
        state: "CA",
        lat: LA_LAT,
        lon: LA_LON,
        height_inches: 65,
        religion: "Christian",
        ethnicity: "Hispanic / Latino",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "High",
        music: "Latin",
        gamer: "No",
        reader: "Yes",
        travel: "Love it",
        pets: "Love animals",
        personality: "Extrovert",
        dating_goal: "Serious",
        astrology: "Sagittarius",
        children_own: "Open",
        political: "Liberal",
        trust: 85,
        account_status: "active",
        pref: {
            minAge: 24,
            maxAge: 36,
            minHeight: 62,
            maxHeight: 72,
            min_distance_miles: 0,
            max_distance_miles: 25,
            religion: "No preference",
            ethnicity: "Hispanic / Latino",
            political: "Liberal",
            children: "Open",
            dating_goal: "Serious",
            activity: "High",
            family: "Yes",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "derek@test.com",
        first_name: "Derek",
        last_name: "Mills",
        dob: "1999-06-15",
        gender: "Non-binary",
        bio: "Photographer and street art enthusiast.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 64,
        religion: "Christian",
        ethnicity: "White / Caucasian",
        education: "Some College",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Electronic / EDM",
        gamer: "Casual",
        reader: "Occasionally",
        travel: "Love it",
        pets: "Neutral",
        personality: "Ambivert",
        dating_goal: "Serious",
        astrology: "Gemini",
        children_own: "Open",
        political: "Moderate",
        trust: 85,
        account_status: "suspended",
        pref: {
            minAge: 22,
            maxAge: 40,
            minHeight: 60,
            maxHeight: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "Christian",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Open",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "finley@test.com",
        first_name: "Finley",
        last_name: "Reed",
        dob: "1996-04-10",
        gender: "Non-binary",
        bio: "Trust score just above the cutoff — good for testing filters.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 66,
        religion: "Christian",
        ethnicity: "Multiracial",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Rock",
        gamer: "Casual",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Serious",
        astrology: "Aquarius",
        children_own: "Open",
        political: "Moderate",
        trust: 42,
        account_status: "active",
        pref: {
            minAge: 24,
            maxAge: 38,
            minHeight: 60,
            maxHeight: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "No preference",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Open",
            dating_goal: "Serious",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Non-binary", "Woman"],
        },
    },
    {
        email: "avery@test.com",
        first_name: "Avery",
        last_name: "Kim",
        dob: "1995-09-21",
        gender: "Non-binary",
        bio: "Strong overlap with Dante on values and lifestyle.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 67,
        religion: "Christian",
        ethnicity: "Asian",
        education: "Master's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "High",
        music: "R&B / Soul",
        gamer: "No",
        reader: "Yes",
        travel: "Love it",
        pets: "Have pets",
        personality: "Ambivert",
        dating_goal: "Long-term",
        astrology: "Virgo",
        children_own: "Want kids",
        political: "Moderate",
        trust: 88,
        account_status: "active",
        pref: {
            minAge: 25,
            maxAge: 36,
            minHeight: 62,
            maxHeight: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "Christian",
            ethnicity: "Asian",
            political: "Moderate",
            children: "Want kids",
            dating_goal: "Long-term",
            activity: "High",
            family: "Yes",
            genderPrefs: ["Female", "Non-binary"],
        },
    },
    {
        email: "kendall@test.com",
        first_name: "Kendall",
        last_name: "Hayes",
        dob: "2001-02-14",
        gender: "Non-binary",
        bio: "Casual dating only — tests dating-goal compatibility.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 64,
        religion: "Agnostic",
        ethnicity: "White / Caucasian",
        education: "Some College",
        family_own: "No",
        smoker: "Occasionally",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Pop",
        gamer: "Yes",
        reader: "Occasionally",
        travel: "Occasionally",
        pets: "Not a fan",
        personality: "Extrovert",
        dating_goal: "Casual",
        astrology: "Leo",
        children_own: "Don't want kids",
        political: "Liberal",
        trust: 70,
        account_status: "active",
        pref: {
            minAge: 21,
            maxAge: 30,
            minHeight: 60,
            maxHeight: 72,
            min_distance_miles: 0,
            max_distance_miles: 40,
            religion: "No preference",
            ethnicity: "No preference",
            political: "Liberal",
            children: "Don't want kids",
            dating_goal: "Casual",
            activity: "Medium",
            family: "No",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "reese@test.com",
        first_name: "Reese",
        last_name: "Walsh",
        dob: "1998-11-30",
        gender: "Non-binary",
        bio: "Trust score below 40 — should be filtered out for most viewers.",
        city: "Chicago",
        state: "IL",
        lat: CHI_LAT,
        lon: CHI_LON,
        height_inches: 65,
        religion: "Christian",
        ethnicity: "White / Caucasian",
        education: "Bachelor's Degree",
        family_own: "No",
        smoker: "No",
        drinker: "No",
        coffee: "No",
        diet: "Vegan",
        activity: "Low",
        music: "Classical",
        gamer: "No",
        reader: "Yes",
        travel: "Not really",
        pets: "Allergic",
        personality: "Introvert",
        dating_goal: "Serious",
        astrology: "Taurus",
        children_own: "Don't want kids",
        political: "Apolitical",
        trust: 35,
        account_status: "active",
        pref: {
            minAge: 22,
            maxAge: 40,
            minHeight: 60,
            maxHeight: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            religion: "No preference",
            ethnicity: "No preference",
            political: "No preference",
            children: "No preference",
            dating_goal: "Serious",
            activity: "Low",
            family: "No preference",
            genderPrefs: ["Non-binary"],
        },
    },
    {
        email: "morgan@test.com",
        first_name: "Morgan",
        last_name: "Lee",
        dob: "1997-03-08",
        gender: "Non-binary",
        bio: "Milwaukee — far enough from Chicago to fail distance for 50mi prefs.",
        city: "Milwaukee",
        state: "WI",
        lat: MKE_LAT,
        lon: MKE_LON,
        height_inches: 66,
        religion: "Christian",
        ethnicity: "White / Caucasian",
        education: "Bachelor's Degree",
        family_own: "Yes",
        smoker: "No",
        drinker: "Social",
        coffee: "Yes",
        diet: "Omnivore",
        activity: "Medium",
        music: "Rock",
        gamer: "Casual",
        reader: "Yes",
        travel: "Occasionally",
        pets: "Love animals",
        personality: "Ambivert",
        dating_goal: "Serious",
        astrology: "Libra",
        children_own: "Open",
        political: "Moderate",
        trust: 78,
        account_status: "active",
        pref: {
            minAge: 24,
            maxAge: 38,
            minHeight: 62,
            maxHeight: 74,
            min_distance_miles: 0,
            max_distance_miles: 100,
            religion: "Christian",
            ethnicity: "No preference",
            political: "Moderate",
            children: "Open",
            dating_goal: "Long-term",
            activity: "Medium",
            family: "Yes",
            genderPrefs: ["Non-binary", "Woman"],
        },
    },
];

const MAPS = {
    religion: "religion_type",
    religion_id: "religion_type_id",
    religion_name: "religion_name",
    ethnicity: "ethnicity_type",
    ethnicity_id: "ethnicity_type_id",
    ethnicity_name: "ethnicity_name",
    gender: "gender_type",
    gender_id: "gender_type_id",
    gender_name: "gender_name",
    education: "education_career",
    education_id: "education_career_id",
    education_name: "education_career_name",
    smoking: "smoking",
    smoking_id: "smoking_id",
    smoking_name: "smoking_name",
    drinking: "drinking",
    drinking_id: "drinking_id",
    drinking_name: "drinking_name",
    coffee: "coffee_drinker",
    coffee_id: "coffee_id",
    coffee_name: "coffee_name",
    diet: "diet",
    diet_id: "diet_id",
    diet_name: "diet_name",
    activity: "activity_level",
    activity_id: "activity_level_id",
    activity_name: "activity_name",
    family: "family_oriented",
    family_id: "family_oriented_id",
    family_name: "family_oriented_name",
    music: "music",
    music_id: "music_id",
    music_name: "music_name",
    gamer: "gamer",
    gamer_id: "isgamer_id",
    gamer_name: "isgamer_name",
    reader: "reader",
    reader_id: "isreader_id",
    reader_name: "isreader_name",
    travel: "travel_interest",
    travel_id: "travel_interest_id",
    travel_name: "travel_interest_name",
    pets: "pet_interest",
    pets_id: "pet_interest_id",
    pets_name: "pet_interest_name",
    personality: "personality_type",
    personality_id: "personality_type_id",
    personality_name: "personality_type_name",
    dating_goals: "dating_goals",
    dating_goals_id: "dating_goals_id",
    dating_goal_name: "dating_goal_name",
    astrology: "astrology_sign",
    astrology_id: "astrology_sign_id",
    astrology_name: "astrology_sign",
    children: "want_children",
    children_id: "want_children_id",
    children_name: "want_children",
    political: "political_affil",
    political_id: "political_affil_id",
    political_name: "political_affil",
};

const UI_GENDER_TO_DB = { Male: "Man", Female: "Woman", "Non-binary": "Non-binary" };

async function loadMap(client, table, idCol, nameCol) {
    const { rows } = await client.query(`SELECT "${idCol}", "${nameCol}" FROM "${table}"`);
    const m = new Map();
    for (const row of rows) m.set(row[nameCol], row[idCol]);
    return m;
}

async function deleteSeedUsers(client) {
    await client.query(`
        CREATE TEMP TABLE _doomed ON COMMIT DROP AS
        SELECT user_id FROM users
        WHERE email ILIKE '%@test.com' OR email ILIKE '%@aura.demo'
    `);
    const { rows: doomedRows } = await client.query(`SELECT user_id FROM _doomed`);
    const ids = doomedRows.map((r) => r.user_id);
    if (ids.length === 0) {
        console.log("No @test.com / @aura.demo users to remove.");
        return;
    }
    console.log(`Removing ${ids.length} existing demo users and dependencies...`);

    // Must run before deleting users: checkins can reference doomed users without going through matches/schedules.
    await client.query(
        `DELETE FROM post_date_checkin WHERE reviewer_user_id IN (SELECT user_id FROM _doomed)
            OR reviewed_user_id IN (SELECT user_id FROM _doomed)`
    );

    const { rows: matchRows } = await client.query(
        `SELECT match_id FROM matches
         WHERE user1_id IN (SELECT user_id FROM _doomed)
            OR user2_id IN (SELECT user_id FROM _doomed)`
    );
    const matchIds = matchRows.map((r) => r.match_id);

    if (matchIds.length > 0) {
        await client.query(`DELETE FROM safety_actions WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(
            `DELETE FROM safety_actions WHERE message_id IN (
                SELECT message_id FROM message WHERE match_id = ANY($1::int[])
            )`,
            [matchIds]
        );
        await client.query(
            `DELETE FROM post_date_checkin WHERE schedule_id IN (
                SELECT schedule_id FROM date_scheduling WHERE match_id = ANY($1::int[])
            )`,
            [matchIds]
        );
        await client.query(
            `DELETE FROM survey_trigger WHERE schedule_id IN (
                SELECT schedule_id FROM date_scheduling WHERE match_id = ANY($1::int[])
            )`,
            [matchIds]
        );
        await client.query(`DELETE FROM date_scheduling WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(`DELETE FROM conversation_safety_state WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(`DELETE FROM message WHERE match_id = ANY($1::int[])`, [matchIds]);
        await client.query(`DELETE FROM matches WHERE match_id = ANY($1::int[])`, [matchIds]);
    }

    await client.query(
        `DELETE FROM survey_trigger WHERE user1_id IN (SELECT user_id FROM _doomed)
            OR user2_id IN (SELECT user_id FROM _doomed)`
    );
    await client.query(
        `DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM _doomed)`
    );
    await client.query(
        `DELETE FROM swipes WHERE swipe_user_id IN (SELECT user_id FROM _doomed)
            OR swiped_user_id IN (SELECT user_id FROM _doomed)`
    );
    await client.query(
        `DELETE FROM reports WHERE reported_user_id IN (SELECT user_id FROM _doomed)
            OR reporter_user_id IN (SELECT user_id FROM _doomed)`
    );
    await client.query(
        `DELETE FROM blocks WHERE blocker_user_id IN (SELECT user_id FROM _doomed)
            OR blocked_user_id IN (SELECT user_id FROM _doomed)`
    );
    await client.query(`DELETE FROM verification WHERE user_id IN (SELECT user_id FROM _doomed)`);
    await client.query(
        `DELETE FROM moderation WHERE user_id IN (SELECT user_id FROM _doomed)
            OR admin_id IN (SELECT user_id FROM _doomed)`
    );
    await client.query(`DELETE FROM photo WHERE user_id IN (SELECT user_id FROM _doomed)`);
    await client.query(`DELETE FROM trust_score WHERE user_id IN (SELECT user_id FROM _doomed)`);

    await client.query(`DELETE FROM trust_score_history WHERE user_id IN (SELECT user_id FROM _doomed)`).catch(() => {});
    await client.query(`DELETE FROM user_availability WHERE user_id IN (SELECT user_id FROM _doomed)`).catch(() => {});

    await client.query(
        `DELETE FROM preference_genders WHERE preference_id IN (
            SELECT preference_id FROM preferences WHERE user_id IN (SELECT user_id FROM _doomed)
        )`
    );
    await client.query(`DELETE FROM preferences WHERE user_id IN (SELECT user_id FROM _doomed)`);
    await client.query(`DELETE FROM users WHERE user_id IN (SELECT user_id FROM _doomed)`);
    console.log("Old demo users removed.");
}

function must(map, label, ctx) {
    const v = map.get(label);
    if (v === undefined) throw new Error(`Missing lookup ${ctx}: "${label}"`);
    return v;
}

async function seed() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    await client.connect();

    const religion = await loadMap(client, MAPS.religion, MAPS.religion_id, MAPS.religion_name);
    const ethnicity = await loadMap(client, MAPS.ethnicity, MAPS.ethnicity_id, MAPS.ethnicity_name);
    const gender = await loadMap(client, MAPS.gender, MAPS.gender_id, MAPS.gender_name);
    const education = await loadMap(client, MAPS.education, MAPS.education_id, MAPS.education_name);
    const smoking = await loadMap(client, MAPS.smoking, MAPS.smoking_id, MAPS.smoking_name);
    const drinking = await loadMap(client, MAPS.drinking, MAPS.drinking_id, MAPS.drinking_name);
    const coffee = await loadMap(client, MAPS.coffee, MAPS.coffee_id, MAPS.coffee_name);
    const diet = await loadMap(client, MAPS.diet, MAPS.diet_id, MAPS.diet_name);
    const activity = await loadMap(client, MAPS.activity, MAPS.activity_id, MAPS.activity_name);
    const family = await loadMap(client, MAPS.family, MAPS.family_id, MAPS.family_name);
    const music = await loadMap(client, MAPS.music, MAPS.music_id, MAPS.music_name);
    const gamer = await loadMap(client, MAPS.gamer, MAPS.gamer_id, MAPS.gamer_name);
    const reader = await loadMap(client, MAPS.reader, MAPS.reader_id, MAPS.reader_name);
    const travel = await loadMap(client, MAPS.travel, MAPS.travel_id, MAPS.travel_name);
    const pets = await loadMap(client, MAPS.pets, MAPS.pets_id, MAPS.pets_name);
    const personality = await loadMap(client, MAPS.personality, MAPS.personality_id, MAPS.personality_name);
    const datingGoals = await loadMap(client, MAPS.dating_goals, MAPS.dating_goals_id, MAPS.dating_goal_name);
    const astrology = await loadMap(client, MAPS.astrology, MAPS.astrology_id, MAPS.astrology_name);
    const children = await loadMap(client, MAPS.children, MAPS.children_id, MAPS.children_name);
    const political = await loadMap(client, MAPS.political, MAPS.political_id, MAPS.political_name);

    const langResult = await client.query(
        `SELECT language_type_id FROM language WHERE language_name = 'English' LIMIT 1`
    );
    const languageId = langResult.rows[0]?.language_type_id;
    if (!languageId) throw new Error("language 'English' not found");

    try {
        await client.query("BEGIN");
        await deleteSeedUsers(client);

        for (const u of DEMO_USERS) {
            const gid = must(gender, u.gender, "gender");
            const insertUser = `
                INSERT INTO users (
                    first_name, last_name, email, password_hash,
                    date_of_birth, gender_identity,
                    bio, profile_photo_url, location_city, location_state,
                    latitude, longitude, account_status, created_at, last_login,
                    height_inches, religion_id, role_id, tier_id,
                    ethnicity_id, language_id, education_career_id,
                    smoking_id, drinking_id, coffee_id, diet_id,
                    activity_level, family_oriented, music,
                    gamer, reader, travel, pet_interest,
                    personality_type, dating_goals, looking_for,
                    astrology, children, political
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW(),
                    $14,$15,1,1,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
                ) RETURNING user_id
            `;
            const { rows: urows } = await client.query(insertUser, [
                u.first_name,
                u.last_name,
                u.email,
                PASSWORD_HASH,
                u.dob,
                gid,
                u.bio,
                null,
                u.city,
                u.state,
                u.lat,
                u.lon,
                u.account_status,
                u.height_inches,
                must(religion, u.religion, "religion"),
                must(ethnicity, u.ethnicity, "ethnicity"),
                languageId,
                must(education, u.education, "education"),
                must(smoking, u.smoker, "smoking"),
                must(drinking, u.drinker, "drinking"),
                must(coffee, u.coffee, "coffee"),
                must(diet, u.diet, "diet"),
                must(activity, u.activity, "activity"),
                must(family, u.family_own, "family"),
                must(music, u.music, "music"),
                must(gamer, u.gamer, "gamer"),
                must(reader, u.reader, "reader"),
                must(travel, u.travel, "travel"),
                must(pets, u.pets, "pets"),
                must(personality, u.personality, "personality"),
                must(datingGoals, u.dating_goal, "dating_goal"),
                u.bio.slice(0, 120),
                must(astrology, u.astrology, "astrology"),
                must(children, u.children_own, "children"),
                must(political, u.political, "political"),
            ]);
            const userId = urows[0].user_id;

            await client.query(
                `INSERT INTO trust_score (user_id, internal_score, last_updated)
                 VALUES ($1, $2, NOW())`,
                [userId, u.trust]
            );

            const p = u.pref;
            const prefRel = p.religion ? must(religion, p.religion, "pref.religion") : null;
            const prefEth = p.ethnicity ? must(ethnicity, p.ethnicity, "pref.ethnicity") : null;
            const prefPol = p.political ? must(political, p.political, "pref.political") : null;
            const prefChild = p.children ? must(children, p.children, "pref.children") : null;
            const prefDate = p.dating_goal ? must(datingGoals, p.dating_goal, "pref.dating_goal") : null;
            const prefAct = p.activity ? must(activity, p.activity, "pref.activity") : null;
            const prefFam = p.family ? must(family, p.family, "pref.family") : null;

            const { rows: prow } = await client.query(
                `INSERT INTO preferences (
                    user_id,
                    preferred_age_min, preferred_age_max,
                    min_distance_miles, max_distance_miles,
                    preferred_height_min, preferred_height_max,
                    preferred_religion_type_id, preferred_ethnicity_id,
                    preferred_political_affil, preferred_want_children,
                    preferred_dating_goals, preferred_activity_level, preferred_family_oriented
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                RETURNING preference_id`,
                [
                    userId,
                    p.minAge,
                    p.maxAge,
                    p.min_distance_miles,
                    p.max_distance_miles,
                    p.minHeight,
                    p.maxHeight,
                    prefRel,
                    prefEth,
                    prefPol,
                    prefChild,
                    prefDate,
                    prefAct,
                    prefFam,
                ]
            );
            const preferenceId = prow[0].preference_id;

            if (p.genderPrefs && p.genderPrefs.length > 0) {
                for (const gLabel of p.genderPrefs) {
                    const dbName = UI_GENDER_TO_DB[gLabel] || gLabel;
                    const gidPref = must(gender, dbName, "pref.gender");
                    await client.query(
                        `INSERT INTO preference_genders (preference_id, gender_type_id)
                         VALUES ($1, $2)
                         ON CONFLICT (preference_id, gender_type_id) DO NOTHING`,
                        [preferenceId, gidPref]
                    );
                }
            }
        }

        const { ensureTestUserTrustDatesReviewed } = require("./ensureTestUserTrustDatesReviewed");
        await ensureTestUserTrustDatesReviewed(client);

        await client.query("COMMIT");
        console.log(`Seeded ${DEMO_USERS.length} users (@test.com). Password for all: password123`);
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        await client.end();
    }

    try {
        await assignTestUserProfilePhotos();
        console.log("Assigned deterministic Pexels profile photos for demo/test users.");
    } catch (e) {
        if (String(e.message || "").includes("Missing PEXELS_API_KEY")) {
            console.warn(
                "Skipped profile photo assignment: PEXELS_API_KEY is missing. Add it to .env and backend/.env, then run npm run db:photos:assign."
            );
        } else {
            throw e;
        }
    }
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
