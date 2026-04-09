import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";

const API = "https://aura-dating.us";

function DateResponse() {
    const location  = useLocation();
    const navigate  = useNavigate();
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
            <div className="container d-flex justify-content-center faded-background min-vh-100 min-vw-100 pt-4">
                <div className="login-card p-4 mb-4 text-center" style={{ width: "90%", maxWidth: "400px" }}>

                    <h4 className="mb-3">📅 Date Request</h4>

                    <p className="mb-1"><strong>Venue:</strong> {payload.venue_name || "TBD"}</p>
                    <p className="mb-4">
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