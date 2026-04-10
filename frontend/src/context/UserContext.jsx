import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();
const API = "https://aura-backend-ysqh.onrender.com";

export function UserProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [matches, setMatches]           = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState(null);
    const [likesLeft, setLikesLeft]       = useState(null);
    const [tierLimit, setTierLimit]       = useState(3);

    const [likedUsers, setLikedUsers] = useState([]);
    const addLikedUser = (user) => {
        setLikedUsers(prev =>
            prev.find(u => u.user_id === user.user_id) ? prev : [...prev, user]
        );
    };

    const login = (userData, jwtToken) => {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", jwtToken);
        setCurrentUser(userData);
        setToken(jwtToken);
    };

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setCurrentUser(null);
        setToken(null);
        setMatches([]);
        setLikedUsers([]);
        setLikesLeft(null);
    };

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
                if (!res.ok) { setMatchesError(data.error || "Failed to load matches."); return; }
                setMatches(data.matches || []);
                if (data.likes_left !== undefined) setLikesLeft(data.likes_left);
                if (data.tier_limit !== undefined) setTierLimit(data.tier_limit);
            } catch { setMatchesError("Could not connect to server."); }
            finally { setMatchesLoading(false); }
        };
        fetchMatches();
    }, [currentUser, token]);

    const [profile, setProfile] = useState({
        profilePic: null, name: "Yoma", location: "IL", dob: "", gender: "",
        height: 68, religion: "", ethnicity: "", education: "", familyOriented: "",
        smoker: "", drinker: "", coffeeDrinker: "", diet: "", activityLevel: "",
        musicPref: "", gamer: "", reader: "", travel: "", pets: "", personality: "",
        datingGoal: "", bio: "", astrology: "", children: "", politicalStanding: "",
    });

    const [preferences, setPreferences] = useState({
        genderPref: "", minAge: 18, maxAge: 100, religionPref: "", ethnicityPref: "",
        minHeight: 60, maxHeight: 80, politicalPref: "", childrenPref: "",
        educationPref: "", activityPref: "", familyOrientedPref: "", datingGoalPref: "",
    });

    return (
        <UserContext.Provider value={{
            currentUser, token, login, logout,
            matches, matchesLoading, matchesError,
            likesLeft, setLikesLeft, tierLimit,
            likedUsers, addLikedUser,
            profile, setProfile,
            preferences, setPreferences,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() { return useContext(UserContext); }