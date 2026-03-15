import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

const API = "http://localhost:4000";

export function UserProvider({ children }) {
    // ─── Auth state — loaded from localStorage on startup ─────────────────
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() => localStorage.getItem("token") || null);

    // ─── Matches state ─────────────────────────────────────────────────────
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState(null);

    // ─── Login helper — called after successful /auth/login or /auth/signup ─
    const login = (userData, jwtToken) => {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", jwtToken);
        setCurrentUser(userData);
        setToken(jwtToken);
    };

    // ─── Logout helper ──────────────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setCurrentUser(null);
        setToken(null);
        setMatches([]);
    };

    // ─── Fetch matches whenever currentUser changes ─────────────────────────
    useEffect(() => {
        if (!currentUser || !token) return;

        const fetchMatches = async () => {
            setMatchesLoading(true);
            setMatchesError(null);
            try {
                const res = await fetch(`${API}/matches/${currentUser.user_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) {
                    setMatchesError(data.error || "Failed to load matches.");
                    return;
                }
                // data.matches is already shaped as { name, location, age, gender, starRating, image }
                setMatches(data.matches || []);
            } catch (err) {
                setMatchesError("Could not connect to server.");
            } finally {
                setMatchesLoading(false);
            }
        };

        fetchMatches();
    }, [currentUser, token]);

    // ─── Alex's original profile + preferences state (unchanged) ───────────
    const [profile, setProfile] = useState({
        profilePic: null,
        name: "Yoma",
        location: "IL",
        dob: "",
        gender: "",
        height: 68,
        religion: "",
        ethnicity: "",
        education: "",
        familyOriented: "",
        smoker: "",
        drinker: "",
        coffeeDrinker: "",
        diet: "",
        activityLevel: "",
        musicPref: "",
        gamer: "",
        reader: "",
        travel: "",
        pets: "",
        personality: "",
        datingGoal: "",
        bio: "",
        astrology: "",
        children: "",
        politicalStanding: "",
    });

    const [preferences, setPreferences] = useState({
        genderPref: "",
        minAge: 18,
        maxAge: 100,
        religionPref: "",
        ethnicityPref: "",
        minHeight: 60,
        maxHeight: 80,
        politicalPref: "",
        childrenPref: "",
        educationPref: "",
        activityPref: "",
        familyOrientedPref: "",
        datingGoalPref: "",
    });

    return (
        <UserContext.Provider value={{
            // Auth
            currentUser, token, login, logout,
            // Matches
            matches, matchesLoading, matchesError,
            // Alex's original state (unchanged)
            profile, setProfile,
            preferences, setPreferences,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
