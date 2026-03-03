import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { useUser } from "../context/UserContext";
import beatrice from "../assets/beatrice.png";

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
    const { profile, setProfile } = useUser();
    const update = (field, value) => setProfile((prev) => ({ ...prev, [field]: value }));

    const starRating = 3;

    const inchesToDisplay = (inches) => {
        const ft = Math.floor(inches / 12);
        const inch = inches % 12;
        return `${ft}'${inch}"`;
    };

    const handleSave = () => {
        // Backend disabled
        /*
        fetch("/api/save-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile)
        });
        */
        alert("Profile saved successfully!");
    };

    return (
        <>
            <Navbar />

            <div className="container d-flex justify-content-center align-items-center text-center faded-background min-vh-100 min-vw-100">
                <div className="login-card p-4 text-center mb-4">
                    <div className="bg-white">
                        <img
                            src={beatrice}
                            className="rounded mb-3 mt-5"
                            alt="profile"
                            style={{ width: "70%", aspectRatio: "1/1", objectFit: "cover" }}
                        />
                        <div className="pb-2">
                            <StarRating rating={starRating} />
                        </div>
                    </div>

                    <h3 className="mt-3">Profile</h3>

                    <div className="mb-3 text-start">
                        <label>Name</label>
                        <input
                            className="form-control"
                            value={profile.name}
                            onChange={(e) => update("name", e.target.value)}
                        />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Location</label>
                        <input
                            className="form-control"
                            value={profile.location}
                            onChange={(e) => update("location", e.target.value)}
                        />
                    </div>

                    <h5 className="section-title">Identity &amp; Background</h5>

                    <div className="mb-3 text-start">
                        <label>Religion</label>
                        <select className="form-select" value={profile.religion} onChange={(e) => update("religion", e.target.value)}>
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
                        </select>
                    </div>

                    <div className="mb-3 text-start">
                        <label>Ethnicity</label>
                        <select className="form-select" value={profile.ethnicity} onChange={(e) => update("ethnicity", e.target.value)}>
                            <option value="">Select...</option>
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
                        <label>Education / Career</label>
                        <select className="form-select" value={profile.education} onChange={(e) => update("education", e.target.value)}>
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

                    <div className="mb-4 text-start">
                        <label>Family-Oriented?</label>
                        <ToggleGroup options={["Yes", "No"]} value={profile.familyOriented} onChange={(v) => update("familyOriented", v)} />
                    </div>

                    <h5 className="section-title">Lifestyle &amp; Habits</h5>

                    <div className="mb-3 text-start">
                        <label>Smoker?</label>
                        <ToggleGroup options={["Yes", "No", "Occasionally"]} value={profile.smoker} onChange={(v) => update("smoker", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Drinker?</label>
                        <ToggleGroup options={["Yes", "No", "Social"]} value={profile.drinker} onChange={(v) => update("drinker", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Coffee Drinker?</label>
                        <ToggleGroup options={["Yes", "No"]} value={profile.coffeeDrinker} onChange={(v) => update("coffeeDrinker", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Diet</label>
                        <ToggleGroup options={["Omnivore", "Vegetarian", "Vegan", "Other"]} value={profile.diet} onChange={(v) => update("diet", v)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Activity Level</label>
                        <ToggleGroup options={["Low", "Medium", "High"]} value={profile.activityLevel} onChange={(v) => update("activityLevel", v)} />
                    </div>

                    <h5 className="section-title">Interests &amp; Hobbies</h5>

                    <div className="mb-3 text-start">
                        <label>Music Preference</label>
                        <select className="form-select" value={profile.musicPref} onChange={(e) => update("musicPref", e.target.value)}>
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
                        <label>Gamer?</label>
                        <ToggleGroup options={["Yes", "No", "Casual"]} value={profile.gamer} onChange={(v) => update("gamer", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Reader?</label>
                        <ToggleGroup options={["Yes", "No", "Occasionally"]} value={profile.reader} onChange={(v) => update("reader", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Travel Interest</label>
                        <ToggleGroup options={["Love it", "Occasionally", "Not really"]} value={profile.travel} onChange={(v) => update("travel", v)} />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Animals / Pets</label>
                        <select className="form-select" value={profile.pets} onChange={(e) => update("pets", e.target.value)}>
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
                        <ToggleGroup options={["Introvert", "Extrovert", "Ambivert"]} value={profile.personality} onChange={(v) => update("personality", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Dating Goals</label>
                        <ToggleGroup options={["Casual", "Serious", "Long-term"]} value={profile.datingGoal} onChange={(v) => update("datingGoal", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Bio</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Tell us more about yourself..."
                            value={profile.bio}
                            onChange={(e) => update("bio", e.target.value)}
                        />
                    </div>

                    <div className="mb-4 text-start">
                        <label>Astrology Sign (optional)</label>
                        <select className="form-select" value={profile.astrology} onChange={(e) => update("astrology", e.target.value)}>
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

                    <h5 className="section-title">Relationship &amp; Family</h5>

                    <div className="mb-3 text-start">
                        <label>Children</label>
                        <ToggleGroup options={["Want kids", "Have kids", "Don't want kids", "Open"]} value={profile.children} onChange={(v) => update("children", v)} />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Height Preference: {inchesToDisplay(profile.minHeight)} – {inchesToDisplay(profile.maxHeight)}</label>
                        <div style={{ position: "relative", height: "30px" }}>
                            <input
                                type="range"
                                min="48"
                                max="96"
                                value={profile.minHeight}
                                onChange={(e) => update("minHeight", Math.min(Number(e.target.value), profile.maxHeight - 1))}
                                className="dual-range dual-range-min"
                            />
                            <input
                                type="range"
                                min="48"
                                max="96"
                                value={profile.maxHeight}
                                onChange={(e) => update("maxHeight", Math.max(Number(e.target.value), Number(profile.minHeight) + 1))}
                                className="dual-range"
                            />
                        </div>
                    </div>

                    <div className="mb-4 text-start">
                        <label>Gender Preference</label>
                        <ToggleGroup options={["Male", "Female", "Non-binary", "Open to all"]} value={profile.genderPref} onChange={(v) => update("genderPref", v)} />
                    </div>

                    <h5 className="section-title">Filters</h5>

                    <div className="mb-3 text-start">
                        <label>Match Age Range: {profile.minAge} - {profile.maxAge}</label>
                        <div style={{ position: "relative", height: "30px" }}>
                            <input
                                type="range"
                                min="18"
                                max="100"
                                value={profile.minAge}
                                onChange={(e) => update("minAge", Math.min(Number(e.target.value), profile.maxAge - 1))}
                                className="dual-range dual-range-min"
                            />
                            <input
                                type="range"
                                min="18"
                                max="100"
                                value={profile.maxAge}
                                onChange={(e) => update("maxAge", Math.max(Number(e.target.value), Number(profile.minAge) + 1))}
                                className="dual-range"
                            />
                        </div>
                    </div>

                    <div className="mb-4 text-start">
                        <label>Political Preference</label>
                        <select className="form-select" value={profile.politicalPref} onChange={(e) => update("politicalPref", e.target.value)}>
                            <option value="">Select...</option>
                            <option>Very Liberal</option>
                            <option>Liberal</option>
                            <option>Moderate</option>
                            <option>Conservative</option>
                            <option>Very Conservative</option>
                            <option>Apolitical</option>
                        </select>
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
