import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";

const API = "http://localhost:4000";

function DateResponse() {
    const location               = useLocation();
    const navigate               = useNavigate();
    const { currentUser, token } = useUser();

    const notification = location.state?.notification;
    const payload      = notification?.payload || {};

    const [responded, setResponded] = useState(false);
    const [answer, setAnswer]       = useState("");

    const handleRespond = async (response) => {
        try {
            await fetch(`${API}/dates/${payload.schedule_id}/respond`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ response, user_id: currentUser?.user_id }),
            });
        } catch (err) {
            console.error("Response failed:", err);
        }

        setAnswer(response);
        setResponded(true);
        setTimeout(() => navigate("/chat"), 1500);
    };

    return (
        <>
            <Navbar />
            <div className="faded-background d-flex flex-column justify-content-center align-items-center min-vh-100 py-5">
                <div className="login-card form-card p-4 text-center mb-4">

                    <h4 className="mb-1">📅 Date Request</h4>

                    {payload.sender_name && (
                        <p className="fw-bold mb-1">{payload.sender_name} wants to go on a date!</p>
                    )}

                    <p className="mb-1 text-muted">
                        <strong>Venue:</strong> {payload.venue_name || "TBD"}
                    </p>
                    <p className="mb-4 text-muted">
                        <strong>When:</strong>{" "}
                        {payload.proposed_datetime
                            ? new Date(payload.proposed_datetime).toLocaleString()
                            : "TBD"}
                    </p>

                    {responded ? (
                        <div className={`fw-bold ${answer === "approved" ? "text-success" : "text-danger"}`}>
                            {answer === "approved" ? "✅ Date accepted!" : "❌ Date declined."}
                        </div>
                    ) : (
                        <div className="d-flex gap-3 justify-content-center">
                            <button className="btn btn-danger" onClick={() => handleRespond("approved")}>
                                ✅ Accept
                            </button>
                            <button className="btn btn-outline-danger" onClick={() => handleRespond("rejected")}>
                                ❌ Decline
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

export default DateResponse;