import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();
const API = "https://aura-dating.us";

export function UserProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);

    const [matches, setMatches]               = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError]     = useState(null);
    const [mutualMatches, setMutualMatches]   = useState([]);
    const [likedUsers, setLikedUsers]         = useState([]);

    const [profile, setProfile] = useState({
        profilePic: null, name: "", location: "", dob: "", gender: "",
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
        setMutualMatches([]);
        setLikedUsers([]);
        setProfile({
            profilePic: null, name: "", location: "", dob: "", gender: "",
            height: 68, religion: "", ethnicity: "", education: "", familyOriented: "",
            smoker: "", drinker: "", coffeeDrinker: "", diet: "", activityLevel: "",
            musicPref: "", gamer: "", reader: "", travel: "", pets: "", personality: "",
            datingGoal: "", bio: "", astrology: "", children: "", politicalStanding: "",
        });
    };

    useEffect(() => {
        if (!currentUser || !token) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || !data.user) return;
                const u = data.user;

                const inchesToHeight = (inches) => inches || 68;
                const genderNorm = { "Man": "Male", "Woman": "Female", "Male": "Male", "Female": "Female", "Non-binary": "Non-binary" };

                setProfile(prev => ({
                    ...prev,
                    name:             `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                    location:         u.location_city      || "",
                    bio:              u.bio                || "",
                    gender:           genderNorm[u.gender_name] || u.gender_name || "",
                    height:           inchesToHeight(u.height_inches),
                    religion:         u.religion_name      || "",
                    ethnicity:        u.ethnicity_name     || "",
                    education:        u.education_career_name || "",
                    smoker:           u.smoking_name       || "",
                    drinker:          u.drinking_name      || "",
                    coffeeDrinker:    u.coffee_name        || "",
                    diet:             u.diet_name          || "",
                    activityLevel:    u.activity_name      || "",
                    musicPref:        u.music_name         || "",
                    gamer:            u.isgamer_name       || "",
                    reader:           u.isreader_name      || "",
                    travel:           u.travel_interest_name || "",
                    pets:             u.pet_interest_name  || "",
                    personality:      u.personality_type_name || "",
                    datingGoal:       u.dating_goal_name   || "",
                    children:         u.children_name      || "",
                    politicalStanding: u.political_name    || "",
                    familyOriented:   u.family_oriented_name || "",
                    astrology:        u.astrology_name     || "",
                    profilePic:       u.profile_photo_url  || null,
                }));
            } catch {}
        };

        const fetchPreferences = async () => {
            try {
                const res = await fetch(`${API}/profile/preferences`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || !data.preferences) return;
                const p = data.preferences;
                setPreferences(prev => ({
                    ...prev,
                    genderPref:     p.genderPref      || "",
                    minAge:         p.minAge          || 18,
                    maxAge:         p.maxAge          || 100,
                    minHeight:      p.minHeight       || 60,
                    maxHeight:      p.maxHeight       || 80,
                    datingGoalPref: p.datingGoalPref  || "",
                    childrenPref:   p.childrenPref    || "",
                    politicalPref:  p.politicalPref   || "",
                    activityPref:   p.activityPref    || "",
                }));
            } catch {}
        };

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
            } catch { setMatchesError("Could not connect to server."); }
            finally { setMatchesLoading(false); }
        };

        const fetchMutualMatches = async () => {
            try {
                const res = await fetch(`${API}/matches/${currentUser.user_id}/mutual`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) setMutualMatches(data.matches || []);
            } catch {}
        };

        fetchProfile();
        fetchPreferences();
        fetchMatches();
        fetchMutualMatches();
    }, [currentUser, token]);

    return (
        <UserContext.Provider value={{
            currentUser, token, login, logout,
            matches, matchesLoading, matchesError,
            mutualMatches, setMutualMatches,
            likedUsers, addLikedUser,
            profile, setProfile,
            preferences, setPreferences,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() { return useContext(UserContext); }