import { createContext, useContext, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [profile, setProfile] = useState({

        name: "Yoma",
        location: "IL",
        gender: "Male",
        minAge: 18,
        maxAge: 100,

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
        minHeight: 60,
        maxHeight: 80,
        genderPref: "",
        politicalPref: "",
    });

    return (
        <UserContext.Provider value={{ profile, setProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}