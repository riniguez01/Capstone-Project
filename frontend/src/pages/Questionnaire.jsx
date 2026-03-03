import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

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

function Questionnaire() {
    const navigate = useNavigate();
    const { profile, setProfile } = useUser();
    const update = (field, value) => setProfile((prev) => ({ ...prev, [field]: value }));

    const inchesToDisplay = (inches) => {
        const ft = Math.floor(inches / 12);
        const inch = inches % 12;
        return `${ft}'${inch}"`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!profile.religion || !profile.datingGoal || !profile.personality || !profile.genderPref) {
            alert("Please fill in all required fields.");
            return;
        }
        navigate("/matching");
    };

    return (
        <div className="faded-background d-flex flex-column justify-content-center align-items-center min-vh-100 py-5">

            <div className="p-4 text-center">
                <h1 className="fs-3 text-white">Find Your Match.</h1>
                <h2 className="fs-6 text-white">Tell us what matters to you.</h2>
            </div>

            <div className="login-card p-4 text-start mb-4" style={{ width: "90%", maxWidth: "500px" }}>
                <form onSubmit={handleSubmit}>

                    <h5 className="section-title">Identity &amp; Background</h5>

                    <div className="mb-3">
                        <label>Religion <span className="text-danger">*</span></label>
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

                    <div className="mb-3">
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

                    <div className="mb-3">
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

                    <div className="mb-4">
                        <label>Family-Oriented?</label>
                        <ToggleGroup options={["Yes", "No"]} value={profile.familyOriented} onChange={(v) => update("familyOriented", v)} />
                    </div>

                    <h5 className="section-title">Lifestyle &amp; Habits</h5>

                    <div className="mb-3">
                        <label>Smoker?</label>
                        <ToggleGroup options={["Yes", "No", "Occasionally"]} value={profile.smoker} onChange={(v) => update("smoker", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Drinker?</label>
                        <ToggleGroup options={["Yes", "No", "Social"]} value={profile.drinker} onChange={(v) => update("drinker", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Coffee Drinker?</label>
                        <ToggleGroup options={["Yes", "No"]} value={profile.coffeeDrinker} onChange={(v) => update("coffeeDrinker", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Diet</label>
                        <ToggleGroup options={["Omnivore", "Vegetarian", "Vegan", "Other"]} value={profile.diet} onChange={(v) => update("diet", v)} />
                    </div>

                    <div className="mb-4">
                        <label>Activity Level</label>
                        <ToggleGroup options={["Low", "Medium", "High"]} value={profile.activityLevel} onChange={(v) => update("activityLevel", v)} />
                    </div>

                    <h5 className="section-title">Interests &amp; Hobbies</h5>

                    <div className="mb-3">
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

                    <div className="mb-3">
                        <label>Gamer?</label>
                        <ToggleGroup options={["Yes", "No", "Casual"]} value={profile.gamer} onChange={(v) => update("gamer", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Reader?</label>
                        <ToggleGroup options={["Yes", "No", "Occasionally"]} value={profile.reader} onChange={(v) => update("reader", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Travel Interest</label>
                        <ToggleGroup options={["Love it", "Occasionally", "Not really"]} value={profile.travel} onChange={(v) => update("travel", v)} />
                    </div>

                    <div className="mb-4">
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

                    <div className="mb-3">
                        <label>Personality Type <span className="text-danger">*</span></label>
                        <ToggleGroup options={["Introvert", "Extrovert", "Ambivert"]} value={profile.personality} onChange={(v) => update("personality", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Dating Goals <span className="text-danger">*</span></label>
                        <ToggleGroup options={["Casual", "Serious", "Long-term"]} value={profile.datingGoal} onChange={(v) => update("datingGoal", v)} />
                    </div>

                    <div className="mb-3">
                        <label>Bio</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Tell us more about yourself..."
                            value={profile.bio}
                            onChange={(e) => update("bio", e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
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

                    <div className="mb-3">
                        <label>Children</label>
                        <ToggleGroup options={["Want kids", "Have kids", "Don't want kids", "Open"]} value={profile.children} onChange={(v) => update("children", v)} />
                    </div>

                    <div className="mb-3">
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

                    <div className="mb-4">
                        <label>Gender Preference <span className="text-danger">*</span></label>
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

                    <div className="mb-4">
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

                    <div className="text-center">
                        <button type="submit" className="submit-btn">
                            Find My Matches
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Questionnaire;