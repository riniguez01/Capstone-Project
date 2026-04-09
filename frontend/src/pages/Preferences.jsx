import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useState } from "react";

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

function Preferences() {
    const navigate = useNavigate();
    const { preferences, setPreferences } = useUser();
    const update = (field, value) => setPreferences((prev) => ({ ...prev, [field]: value }));

    const inchesToDisplay = (inches) => {
        const ft = Math.floor(inches / 12);
        const inch = inches % 12;
        return `${ft}'${inch}"`;
    };

    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!preferences.genderPref) {
            setError("Please select a gender preference.");
            return;
        }
        setError("");

        // BACKEND DISABLED
        /*
        fetch("/api/save-preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(preferences)
        });
        */
        navigate("/matching");
    };

    return (
        <div className="faded-background d-flex flex-column justify-content-center align-items-center min-vh-100 py-5">

            <div className="p-4 text-center">
                <h1 className="fs-3 text-white">Your Ideal Match.</h1>
                <h2 className="fs-6 text-white">Tell us what you're looking for in a partner.</h2>
            </div>

            <div className="login-card p-4 text-start mb-4" style={{ width: "90%", maxWidth: "500px" }}>
                <form onSubmit={handleSubmit}>

                    <h5 className="section-title">Basic Preferences</h5>

                    <div className="mb-3">
                        <label>Gender Preference <span className="text-danger">*</span></label>
                        <ToggleGroup
                            options={["Male", "Female", "Non-binary", "No preference"]}
                            value={preferences.genderPref}
                            onChange={(v) => update("genderPref", v)}
                        />
                    </div>

                    <div className="mb-4">
                        <label>Age Range: {preferences.minAge} – {preferences.maxAge}</label>
                        <div style={{ position: "relative", height: "30px" }}>
                            <input
                                type="range"
                                min="18"
                                max="100"
                                value={preferences.minAge}
                                onChange={(e) => update("minAge", Math.min(Number(e.target.value), preferences.maxAge - 1))}
                                className="dual-range dual-range-min"
                            />
                            <input
                                type="range"
                                min="18"
                                max="100"
                                value={preferences.maxAge}
                                onChange={(e) => update("maxAge", Math.max(Number(e.target.value), Number(preferences.minAge) + 1))}
                                className="dual-range"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label>Height Range: {inchesToDisplay(preferences.minHeight)} – {inchesToDisplay(preferences.maxHeight)}</label>
                        <div style={{ position: "relative", height: "30px" }}>
                            <input
                                type="range"
                                min="48"
                                max="96"
                                value={preferences.minHeight}
                                onChange={(e) => update("minHeight", Math.min(Number(e.target.value), preferences.maxHeight - 1))}
                                className="dual-range dual-range-min"
                            />
                            <input
                                type="range"
                                min="48"
                                max="96"
                                value={preferences.maxHeight}
                                onChange={(e) => update("maxHeight", Math.max(Number(e.target.value), Number(preferences.minHeight) + 1))}
                                className="dual-range"
                            />
                        </div>
                    </div>

                    <h5 className="section-title">Identity Preferences</h5>

                    <div className="mb-3">
                        <label>Religion Preference</label>
                        <select className="form-select" value={preferences.religionPref} onChange={(e) => update("religionPref", e.target.value)}>
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
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label>Ethnicity Preference</label>
                        <select className="form-select" value={preferences.ethnicityPref} onChange={(e) => update("ethnicityPref", e.target.value)}>
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

                    <div className="mb-4">
                        <label>Education Preference</label>
                        <select className="form-select" value={preferences.educationPref} onChange={(e) => update("educationPref", e.target.value)}>
                            <option value="">No preference</option>
                            <option>High School</option>
                            <option>Some College</option>
                            <option>Associate's Degree</option>
                            <option>Bachelor's Degree</option>
                            <option>Master's Degree</option>
                            <option>Doctorate / PhD</option>
                            <option>Trade</option>
                        </select>
                    </div>

                    <h5 className="section-title">Lifestyle Preferences</h5>

                    <div className="mb-3">
                        <label>Activity Level</label>
                        <ToggleGroup
                            options={["Low", "Medium", "High", "No preference"]}
                            value={preferences.activityPref}
                            onChange={(v) => update("activityPref", v)}
                        />
                    </div>

                    <div className="mb-3">
                        <label>Family-Oriented?</label>
                        <ToggleGroup
                            options={["Yes", "No", "No preference"]}
                            value={preferences.familyOrientedPref}
                            onChange={(v) => update("familyOrientedPref", v)}
                        />
                    </div>

                    <div className="mb-3">
                        <label>Children</label>
                        <ToggleGroup
                            options={["Has kids", "Wants kids", "No kids", "No preference"]}
                            value={preferences.childrenPref}
                            onChange={(v) => update("childrenPref", v)}
                        />
                    </div>

                    <div className="mb-3">
                        <label>Dating Goals</label>
                        <ToggleGroup
                            options={["Casual", "Serious", "Long-term", "No preference"]}
                            value={preferences.datingGoalPref}
                            onChange={(v) => update("datingGoalPref", v)}
                        />
                    </div>

                    <div className="mb-4">
                        <label>Political Preference</label>
                        <select className="form-select" value={preferences.politicalPref} onChange={(e) => update("politicalPref", e.target.value)}>
                            <option value="">No preference</option>
                            <option>Very Liberal</option>
                            <option>Liberal</option>
                            <option>Moderate</option>
                            <option>Conservative</option>
                            <option>Very Conservative</option>
                            <option>Apolitical</option>
                        </select>
                    </div>

                    {error && <p className="text-danger small mb-3">{error}</p>}

                    <div className="text-center">
                        <button type="submit" className="submit-btn">
                            Find My Matches →
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default Preferences;