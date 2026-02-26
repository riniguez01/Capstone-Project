const generateMatches = require("../services/matchingService");

// Mock user
const mockUser = {
    user_id: 1,
    date_of_birth: "2003-05-10",
    location_state: "Illinois",
    activity_level: "medium",
    gender_identity: 1,
    religion_id: 2,
    interests: ["music", "movies", "travel"],
    trust_score: 85,
    preferences: { //preferences are treated as hard constraints
        preferred_age_min: 18,
        preferred_age_max: 25,
        preferred_gender: 1,
        preferred_religion_type_id: 2,
        preferred_distance_states: ["Illinois", "Indiana", "Wisconsin"]
    }
};

// Mock candidates: mock data to simulate database users, but the architecture is built so it can easily plug into a real database
const mockCandidates = [
    { user_id: 2, date_of_birth: "2002-04-01", location_state: "Illinois", activity_level: "medium", gender_identity: 1, religion_id: 2, interests: ["music","movies","travel"], trust_score: 85 },
    { user_id: 3, date_of_birth: "1999-06-15", location_state: "Indiana", activity_level: "high", gender_identity: 1, religion_id: 2, interests: ["sports","travel"], trust_score: 90 },
    { user_id: 4, date_of_birth: "2001-02-10", location_state: "Wisconsin", activity_level: "medium", gender_identity: 1, religion_id: 2, interests: ["music","gaming"], trust_score: 70 },
    { user_id: 5, date_of_birth: "2003-09-20", location_state: "Texas", activity_level: "low", gender_identity: 1, religion_id: 3, interests: ["movies"], trust_score: 60 },
    { user_id: 6, date_of_birth: "2002-11-05", location_state: "Illinois", activity_level: "medium", gender_identity: 1, religion_id: 2, interests: ["music","travel","gaming"], trust_score: 95 },
    { user_id: 7, date_of_birth: "1998-01-30", location_state: "Illinois", activity_level: "high", gender_identity: 1, religion_id: 2, interests: ["movies","sports","travel"], trust_score: 88 },
    { user_id: 8, date_of_birth: "2000-07-18", location_state: "Indiana", activity_level: "medium", gender_identity: 2, religion_id: 2, interests: ["music"], trust_score: 75 }
];

// GET all candidates
exports.getAllCandidates = (req, res) => {
    res.json(mockCandidates);
};

// GET matches
exports.getMatches = (req, res) => {

    const shouldRank = req.query.ranked === "true";

    const matches = generateMatches(mockUser, mockCandidates, shouldRank);

    const fullMatches = matches.map(match => {
        const candidate = mockCandidates.find(c => c.user_id === match.user_id);

        return {
            ...candidate,
            score: match.score,
            breakdown: match.breakdown
        };
    });

    res.json(fullMatches);
};