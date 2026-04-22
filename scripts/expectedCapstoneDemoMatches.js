/**
 * Offline deck for scripts/seedCapstoneDemoUsers.js roster using backend/matching/filterMatches.js
 * (same hard filters as GET /matches). Does not compute scores — order in app is by rankMatches/scoreMatch.
 *
 *   node scripts/expectedCapstoneDemoMatches.js
 */
const filterMatches = require("../backend/matching/filterMatches");

const CHI_LAT = 41.878113;
const CHI_LON = -87.629799;
const LA_LAT = 34.052235;
const LA_LON = -118.243683;
const MKE_LAT = 43.038902;
const MKE_LON = -87.906474;

const G = { MAN: 2, WOMAN: 3, NB: 4 };

/** @type {Record<string, any>} */
const USERS = {
    dante: {
        email: "dante@test.com",
        user_id: 1,
        gender_identity: G.WOMAN,
        trust_score: 85,
        account_status: "active",
        date_of_birth: "1998-05-12",
        height_inches: 69,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 22,
            preferred_age_max: 40,
            preferred_height_min: 58,
            preferred_height_max: 76,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.NB],
        },
    },
    beatrice: {
        email: "beatrice@test.com",
        user_id: 2,
        gender_identity: G.NB,
        trust_score: 90,
        account_status: "active",
        date_of_birth: "1999-03-15",
        height_inches: 65,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 24,
            preferred_age_max: 35,
            preferred_height_min: 60,
            preferred_height_max: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.WOMAN],
        },
    },
    zendaya: {
        email: "zendaya@test.com",
        user_id: 3,
        gender_identity: G.NB,
        trust_score: 75,
        account_status: "active",
        date_of_birth: "1997-07-22",
        height_inches: 63,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 23,
            preferred_age_max: 38,
            preferred_height_min: 60,
            preferred_height_max: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.WOMAN, G.NB],
        },
    },
    olivia: {
        email: "olivia@test.com",
        user_id: 4,
        gender_identity: G.NB,
        trust_score: 55,
        account_status: "active",
        date_of_birth: "2000-11-08",
        height_inches: 62,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 21,
            preferred_age_max: 32,
            preferred_height_min: 60,
            preferred_height_max: 70,
            min_distance_miles: 0,
            max_distance_miles: 40,
            preferred_genders: [G.NB],
        },
    },
    shane: {
        email: "shane@test.com",
        user_id: 5,
        gender_identity: G.NB,
        trust_score: 25,
        account_status: "active",
        date_of_birth: "1999-01-01",
        height_inches: 64,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 22,
            preferred_age_max: 35,
            preferred_height_min: 60,
            preferred_height_max: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.NB],
        },
    },
    priya: {
        email: "priya@test.com",
        user_id: 6,
        gender_identity: G.NB,
        trust_score: 80,
        account_status: "active",
        date_of_birth: "1999-06-15",
        height_inches: 65,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 25,
            preferred_age_max: 40,
            preferred_height_min: 62,
            preferred_height_max: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.WOMAN, G.NB],
        },
    },
    tyler: {
        email: "tyler@test.com",
        user_id: 7,
        gender_identity: G.MAN,
        trust_score: 80,
        account_status: "active",
        date_of_birth: "1999-06-15",
        height_inches: 72,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 22,
            preferred_age_max: 35,
            preferred_height_min: 62,
            preferred_height_max: 70,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.WOMAN],
        },
    },
    sandra: {
        email: "sandra@test.com",
        user_id: 8,
        gender_identity: G.NB,
        trust_score: 85,
        account_status: "active",
        date_of_birth: "1975-01-01",
        height_inches: 63,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 45,
            preferred_age_max: 60,
            preferred_height_min: 60,
            preferred_height_max: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.NB, G.WOMAN],
        },
    },
    jasmine: {
        email: "jasmine@test.com",
        user_id: 9,
        gender_identity: G.NB,
        trust_score: 85,
        account_status: "active",
        date_of_birth: "1999-06-15",
        height_inches: 65,
        latitude: LA_LAT,
        longitude: LA_LON,
        preferences: {
            preferred_age_min: 24,
            preferred_age_max: 36,
            preferred_height_min: 62,
            preferred_height_max: 72,
            min_distance_miles: 0,
            max_distance_miles: 25,
            preferred_genders: [G.NB],
        },
    },
    derek: {
        email: "derek@test.com",
        user_id: 10,
        gender_identity: G.NB,
        trust_score: 85,
        account_status: "suspended",
        date_of_birth: "1999-06-15",
        height_inches: 64,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 22,
            preferred_age_max: 40,
            preferred_height_min: 60,
            preferred_height_max: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.NB],
        },
    },
    finley: {
        email: "finley@test.com",
        user_id: 11,
        gender_identity: G.NB,
        trust_score: 42,
        account_status: "active",
        date_of_birth: "1996-04-10",
        height_inches: 66,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 24,
            preferred_age_max: 38,
            preferred_height_min: 60,
            preferred_height_max: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.NB, G.WOMAN],
        },
    },
    avery: {
        email: "avery@test.com",
        user_id: 12,
        gender_identity: G.NB,
        trust_score: 88,
        account_status: "active",
        date_of_birth: "1995-09-21",
        height_inches: 67,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 25,
            preferred_age_max: 36,
            preferred_height_min: 62,
            preferred_height_max: 74,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.WOMAN, G.NB],
        },
    },
    kendall: {
        email: "kendall@test.com",
        user_id: 13,
        gender_identity: G.NB,
        trust_score: 70,
        account_status: "active",
        date_of_birth: "2001-02-14",
        height_inches: 64,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 21,
            preferred_age_max: 30,
            preferred_height_min: 60,
            preferred_height_max: 72,
            min_distance_miles: 0,
            max_distance_miles: 40,
            preferred_genders: [G.NB],
        },
    },
    reese: {
        email: "reese@test.com",
        user_id: 14,
        gender_identity: G.NB,
        trust_score: 35,
        account_status: "active",
        date_of_birth: "1998-11-30",
        height_inches: 65,
        latitude: CHI_LAT,
        longitude: CHI_LON,
        preferences: {
            preferred_age_min: 22,
            preferred_age_max: 40,
            preferred_height_min: 60,
            preferred_height_max: 72,
            min_distance_miles: 0,
            max_distance_miles: 50,
            preferred_genders: [G.NB],
        },
    },
    morgan: {
        email: "morgan@test.com",
        user_id: 15,
        gender_identity: G.NB,
        trust_score: 78,
        account_status: "active",
        date_of_birth: "1997-03-08",
        height_inches: 66,
        latitude: MKE_LAT,
        longitude: MKE_LON,
        preferences: {
            preferred_age_min: 24,
            preferred_age_max: 38,
            preferred_height_min: 62,
            preferred_height_max: 74,
            min_distance_miles: 0,
            max_distance_miles: 100,
            preferred_genders: [G.NB, G.WOMAN],
        },
    },
};

const ORDER = Object.keys(USERS);

function candidatePoolForViewer(viewerKey) {
    return ORDER.filter((k) => {
        if (k === viewerKey) return false;
        const u = USERS[k];
        if (u.account_status !== "active") return false;
        return true;
    }).map((k) => USERS[k]);
}

function main() {
    console.log("Capstone demo seed — users who pass hard filters (alphabetical).");
    console.log("API sorts by match score (rankMatches). Gender IDs: 2=Man, 3=Woman, 4=Non-binary.\n");

    for (const vk of ORDER) {
        const viewer = USERS[vk];
        if (viewer.account_status !== "active") {
            console.log(`${viewer.email}  →  (no deck: account not active — GET /matches returns 403)`);
            continue;
        }
        if (viewer.trust_score <= filterMatches.TRUST_ELIMINATION_THRESHOLD) {
            console.log(`${viewer.email}  →  (no deck: viewer internal trust ≤ ${filterMatches.TRUST_ELIMINATION_THRESHOLD})`);
            continue;
        }
        const pool = candidatePoolForViewer(vk);
        const passed = filterMatches(viewer, pool);
        passed.sort((a, b) => a.email.localeCompare(b.email));
        console.log(`${viewer.email}`);
        if (passed.length === 0) console.log("  (no one)");
        else passed.forEach((c) => console.log(`  • ${c.email}`));
    }
}

main();
