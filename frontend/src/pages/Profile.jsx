import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { useUser } from "../context/UserContext";
import beatrice from "../assets/beatrice.png";
import {useState} from "react";

function ToggleGroup({ options, value, onChange }) {
    return (
        <div className="d-flex flex-wrap gap-2 mt-1">
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`toggle-btn ${value === opt ? "toggle-btn-active" : ""}`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

function Profile() {
    const { profile, setProfile, preferences, setPreferences } = useUser();
    const updateProfile = (field, value) => setProfile((prev) => ({ ...prev, [field]: value }));
    const updatePref = (field, value) => setPreferences((prev) => ({ ...prev, [field]: value }));

    const starRating = 3;

    const inchesToDisplay = (inches) => {
        const ft = Math.floor(inches / 12);
        const inch = inches % 12;
        return `${ft}'${inch}"`;
    };

    // const [profilePic, setProfilePic] = useState(beatrice);

    const profilePic = profile.profilePic || beatrice;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            //setProfilePic(url);
            updateProfile("profilePic", url);
        }
    };

    const handleSave = () => {
        // BACKEND DISABLED
        /*
        fetch("/api/save-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile, preferences })
        });
        */
        alert("Profile saved successfully!");
    };

    return (
        <>
            <Navbar />
            <div className="container d-flex justify-content-center align-items-center text-center faded-background min-vh-100 min-vw-100">
                <div className="login-card p-4 text-center mb-4">

                    <div className="bg-white" style={{ position: "relative" }}>
                        <img
                            src={profilePic}
                            className="rounded mb-3 mt-5"
                            alt="profile"
                            style={{ width: "70%", aspectRatio: "1/1", objectFit: "cover", cursor: "pointer" }}
                            onClick={() => document.getElementById("picUpload").click()}
                        />
                        <input
                            id="picUpload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                        <div className="text-muted small mb-2 bi-camera" style={{ cursor: "pointer" }} onClick={() => document.getElementById("picUpload").click()}>
                            -Change Photo
                        </div>
                        <div className="pb-2">
                            <StarRating rating={starRating} />
                        </div>
                    </div>

                    <h3 className="mt-3">My Profile</h3>

                    <div className="mb-3 text-start">
                        <label>Name</label>
                        <input className="form-control" value={profile.name} onChange={(e) => updateProfile("name", e.target.value)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Location</label>
                        <input className="form-control" value={profile.location} onChange={(e) => updateProfile("location", e.target.value)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Gender</label>
                        <ToggleGroup options={["Male", "Female", "Non-binary"]} value={profile.gender} onChange={(v) => updateProfile("gender", v)} />
                    </div>

                    <h5 className="section-title">Identity &amp; Background</h5>

                    <div className="mb-3 text-start">
                        <label>Religion</label>
                        <select className="form-select" value={profile.religion} onChange={(e) => updateProfile("religion", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Atheist</option>
                            <option>Agnostic</option>
                            <option>Buddhist</option>
                            <option>Catholic</option>
                            <option>Christian</option>
                            <option>Hindu</option>
                            <option>Jewish</option>
                            <option>Mormon</option>
                            <option>Muslim</option>
                            <option>Spiritual (non-religious)</option>
                            <option>Other</option>
                            <option>Prefer not to say</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Ethnicity</label>
                        <select className="form-select" value={profile.ethnicity} onChange={(e) => updateProfile("ethnicity", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Asian</option>
                            <option>Black / African American</option>
                            <option>Hispanic / Latino</option>
                            <option>Middle Eastern</option>
                            <option>Native American</option>
                            <option>Pacific Islander</option>
                            <option>White / Caucasian</option>
                            <option>Multiracial</option>
                            <option>Other</option>
                            <option>Prefer not to say</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Education</label>
                        <select className="form-select" value={profile.education} onChange={(e) => updateProfile("education", e.target.value)}>
                            <option value="">Select...</option>
                            <option>High School</option>
                            <option>Some College</option>
                            <option>Associate's Degree</option>
                            <option>Bachelor's Degree</option>
                            <option>Master's Degree</option>
                            <option>Doctorate / PhD</option>
                            <option>Trade</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Your Height: {inchesToDisplay(profile.height)}</label>
                        <input
                            type="range"
                            min="48"
                            max="96"
                            value={profile.height}
                            onChange={(e) => updateProfile("height", Number(e.target.value))}
                            className="single-range mt-1"
                        />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Family-Oriented?</label>
                        <ToggleGroup options={["Yes", "No"]} value={profile.familyOriented} onChange={(v) => updateProfile("familyOriented", v)} />
                    </div>

                    <h5 className="section-title">Lifestyle &amp; Habits</h5>

                    <div className="mb-3 text-start">
                        <label>Do you smoke?</label>
                        <ToggleGroup options={["Yes", "No", "Occasionally"]} value={profile.smoker} onChange={(v) => updateProfile("smoker", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Do you drink?</label>
                        <ToggleGroup options={["Yes", "No", "Social"]} value={profile.drinker} onChange={(v) => updateProfile("drinker", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Do you drink coffee?</label>
                        <ToggleGroup options={["Yes", "No"]} value={profile.coffeeDrinker} onChange={(v) => updateProfile("coffeeDrinker", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Diet</label>
                        <ToggleGroup options={["Omnivore", "Vegetarian", "Vegan", "Other"]} value={profile.diet} onChange={(v) => updateProfile("diet", v)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Activity Level</label>
                        <ToggleGroup options={["Low", "Medium", "High"]} value={profile.activityLevel} onChange={(v) => updateProfile("activityLevel", v)} />
                    </div>

                    <h5 className="section-title">Interests &amp; Hobbies</h5>

                    <div className="mb-3 text-start">
                        <label>Music Preference</label>
                        <select className="form-select" value={profile.musicPref} onChange={(e) => updateProfile("musicPref", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Pop</option>
                            <option>Hip-Hop / Rap</option>
                            <option>R&amp;B / Soul</option>
                            <option>Rock</option>
                            <option>Country</option>
                            <option>Electronic / EDM</option>
                            <option>Jazz / Blues</option>
                            <option>Classical</option>
                            <option>Latin</option>
                            <option>Everything</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Are you a gamer?</label>
                        <ToggleGroup options={["Yes", "No", "Casual"]} value={profile.gamer} onChange={(v) => updateProfile("gamer", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Are you a reader?</label>
                        <ToggleGroup options={["Yes", "No", "Occasionally"]} value={profile.reader} onChange={(v) => updateProfile("reader", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Do you like to travel?</label>
                        <ToggleGroup options={["Love it", "Occasionally", "Not really"]} value={profile.travel} onChange={(v) => updateProfile("travel", v)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Animals / Pets</label>
                        <select className="form-select" value={profile.pets} onChange={(e) => updateProfile("pets", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Love animals</option>
                            <option>Have pets</option>
                            <option>Allergic</option>
                            <option>Not a fan</option>
                            <option>Neutral</option>
                        </select>
                    </div>

                    <h5 className="section-title">Personality &amp; Values</h5>

                    <div className="mb-3 text-start">
                        <label>Personality Type</label>
                        <ToggleGroup options={["Introvert", "Extrovert", "Ambivert"]} value={profile.personality} onChange={(v) => updateProfile("personality", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Dating Goals</label>
                        <ToggleGroup options={["Casual", "Serious", "Long-term"]} value={profile.datingGoal} onChange={(v) => updateProfile("datingGoal", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>What's your political standing?</label>
                        <select className="form-select" value={profile.politicalStanding} onChange={(e) => updateProfile("politicalStanding", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Very Liberal</option>
                            <option>Liberal</option>
                            <option>Moderate</option>
                            <option>Conservative</option>
                            <option>Very Conservative</option>
                            <option>Apolitical</option>
                            <option>Prefer not to say</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Bio</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Tell us more about yourself..."
                            value={profile.bio}
                            onChange={(e) => updateProfile("bio", e.target.value)}
                        />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Do you have or want children?</label>
                        <ToggleGroup options={["Have kids", "Want kids", "Don't want kids", "Open"]} value={profile.children} onChange={(v) => updateProfile("children", v)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Astrology Sign (optional)</label>
                        <select className="form-select" value={profile.astrology} onChange={(e) => updateProfile("astrology", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Aries</option>
                            <option>Taurus</option>
                            <option>Gemini</option>
                            <option>Cancer</option>
                            <option>Leo</option>
                            <option>Virgo</option>
                            <option>Libra</option>
                            <option>Scorpio</option>
                            <option>Sagittarius</option>
                            <option>Capricorn</option>
                            <option>Aquarius</option>
                            <option>Pisces</option>
                        </select>
                    </div>

                    <h5 className="section-title">Partner Preferences</h5>

                    <div className="mb-3 text-start">
                        <label>Gender Preference</label>
                        <ToggleGroup options={["Male", "Female", "Non-binary", "No preference"]} value={preferences.genderPref} onChange={(v) => updatePref("genderPref", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Age Range: {preferences.minAge} – {preferences.maxAge}</label>
                        <div style={{ position: "relative", height: "30px" }}>
                            <input type="range" min="18" max="100" value={preferences.minAge}
                                   onChange={(e) => updatePref("minAge", Math.min(Number(e.target.value), preferences.maxAge - 1))}
                                   className="dual-range dual-range-min" />
                            <input type="range" min="18" max="100" value={preferences.maxAge}
                                   onChange={(e) => updatePref("maxAge", Math.max(Number(e.target.value), Number(preferences.minAge) + 1))}
                                   className="dual-range" />
                        </div>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Height Range: {inchesToDisplay(preferences.minHeight)} – {inchesToDisplay(preferences.maxHeight)}</label>
                        <div style={{ position: "relative", height: "30px" }}>
                            <input type="range" min="48" max="96" value={preferences.minHeight}
                                   onChange={(e) => updatePref("minHeight", Math.min(Number(e.target.value), preferences.maxHeight - 1))}
                                   className="dual-range dual-range-min" />
                            <input type="range" min="48" max="96" value={preferences.maxHeight}
                                   onChange={(e) => updatePref("maxHeight", Math.max(Number(e.target.value), Number(preferences.minHeight) + 1))}
                                   className="dual-range" />
                        </div>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Religion Preference</label>
                        <select className="form-select" value={preferences.religionPref} onChange={(e) => updatePref("religionPref", e.target.value)}>
                            <option value="">No preference</option>
                            <option>Atheist</option>
                            <option>Agnostic</option>
                            <option>Buddhist</option>
                            <option>Catholic</option>
                            <option>Christian</option>
                            <option>Hindu</option>
                            <option>Jewish</option>
                            <option>Mormon</option>
                            <option>Muslim</option>
                            <option>Spiritual (non-religious)</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Ethnicity Preference</label>
                        <select className="form-select" value={preferences.ethnicityPref} onChange={(e) => updatePref("ethnicityPref", e.target.value)}>
                            <option value="">No preference</option>
                            <option>Asian</option>
                            <option>Black / African American</option>
                            <option>Hispanic / Latino</option>
                            <option>Middle Eastern</option>
                            <option>Native American</option>
                            <option>Pacific Islander</option>
                            <option>White / Caucasian</option>
                            <option>Multiracial</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Political Preference</label>
                        <select className="form-select" value={preferences.politicalPref} onChange={(e) => updatePref("politicalPref", e.target.value)}>
                            <option value="">No preference</option>
                            <option>Very Liberal</option>
                            <option>Liberal</option>
                            <option>Moderate</option>
                            <option>Conservative</option>
                            <option>Very Conservative</option>
                            <option>Apolitical</option>
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Children Preference</label>
                        <ToggleGroup options={["Has kids", "Wants kids", "No kids", "No preference"]} value={preferences.childrenPref} onChange={(v) => updatePref("childrenPref", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Activity Level Preference</label>
                        <ToggleGroup options={["Low", "Medium", "High", "No preference"]} value={preferences.activityPref} onChange={(v) => updatePref("activityPref", v)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Dating Goals Preference</label>
                        <ToggleGroup options={["Casual", "Serious", "Long-term", "No preference"]} value={preferences.datingGoalPref} onChange={(v) => updatePref("datingGoalPref", v)} />
                    </div>

                    <div>
                        <button className="btn btn-danger me-2 mb-2">
                            Get Aura +
                        </button>
                    </div>
                    <div>
                        <button className="btn btn-outline-danger me-2" onClick={handleSave}>
                            Save
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}

export default Profile;