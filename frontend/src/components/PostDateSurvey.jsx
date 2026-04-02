import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

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

function PostDateSurvey() {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);

    const [comfortScore, setComfortScore] = useState(3);
    const [feltSafe, setFeltSafe] = useState("");
    const [boundariesRespected, setBoundariesRespected] = useState("");
    const [feltPressured, setFeltPressured] = useState("");
    const [wouldSeeAgain, setWouldSeeAgain] = useState("");
    const [comments, setComments] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!feltPressured || !wouldSeeAgain) {
            setError("Please fill in all required fields.");
            return;
        }

        setError("");

        // BACKEND DISABLED
        /*
        fetch("/api/post-date-survey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comfortScore, feltSafe, boundariesRespected, feltPressured, wouldSeeAgain, comments })
        });
        */

        setSubmitted(true);
        setTimeout(() => navigate("/chat"), 1500);
    };

    return (
        <>
            <Navbar />
            <div className="faded-background d-flex flex-column justify-content-center align-items-center min-vh-100 py-5">
                <div className="login-card p-4 text-start mb-4" style={{ width: "90%", maxWidth: "500px" }}>
                    <form onSubmit={handleSubmit}>

                        <h5 className="section-title text-white">How did your date go?</h5>

                        <div className="mb-4">
                            <label>Comfort Level: {comfortScore} / 5</label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={comfortScore}
                                onChange={(e) => setComfortScore(Number(e.target.value))}
                                className="single-range mt-1"
                            />
                        </div>

                        <div className="mb-3">
                            <label>Did you feel safe?</label>
                            <ToggleGroup options={["Yes", "No"]} value={feltSafe} onChange={setFeltSafe} />
                        </div>

                        <div className="mb-3">
                            <label>Were your boundaries respected?</label>
                            <ToggleGroup options={["Yes", "No"]} value={boundariesRespected} onChange={setBoundariesRespected} />
                        </div>

                        <div className="mb-3">
                            <label>Did you feel pressured? <span className="text-danger">*</span></label>
                            <ToggleGroup options={["Yes", "No"]} value={feltPressured} onChange={setFeltPressured} />
                                                                                              </div>

                        <div className="mb-3">
                            <label>Would you see them again? <span className="text-danger">*</span></label>
                            <ToggleGroup options={["Yes", "No", "Maybe"]} value={wouldSeeAgain} onChange={setWouldSeeAgain} />
                        </div>

                        <div className="mb-4">
                            <label>Comments</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Anything else you'd like to share..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-danger small mb-3">{error}</p>}

                        {submitted && (
                            <div className="text-center text-success fw-bold mb-3">
                                ✅ Thanks for your feedback!
                            </div>
                        )}

                        <div className="text-center">
                            <button type="submit" className="submit-btn" disabled={submitted}>
                                Submit Review
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default PostDateSurvey;
