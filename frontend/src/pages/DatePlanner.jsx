import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const VENUES = [
    { icon: "🍽️", name: "Restaurant", suggestion: "Piccolo Sogno" },
    { icon: "🎬", name: "Movie Theater", suggestion: "AMC River East" },
    { icon: "☕", name: "Coffee Shop", suggestion: "Intelligentsia Coffee" },
    { icon: "🎳", name: "Bowling", suggestion: "Pinstripes" },
    { icon: "🌳", name: "Park / Outdoors", suggestion: "Millennium Park" },
];

const TIME_SLOTS = [
    "Friday 6PM – 10PM",
    "Saturday 12PM – 5PM",
    "Saturday 6PM – 10PM",
    "Sunday 12PM – 5PM",
    "Sunday 6PM – 9PM",
];

function DatePlanner() {
    const location = useLocation();
    const navigate = useNavigate();

    const match = location.state?.match || null;
    const returnTo = location.state?.returnTo || null;

    const [selectedVenue, setSelectedVenue] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [sent, setSent] = useState(false);

    const handleSendRequest = () => {
        if (!selectedVenue || !selectedTime) return;

        const message = `📅 Date Request: How about ${selectedVenue.name} (${selectedVenue.suggestion}) on ${selectedTime}?`;

        // BACKEND DISABLED
        /*
        fetch("/api/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: match.name, text: message })
        });
        */

        setSent(true);
        setTimeout(() => {
            navigate(returnTo || "/chat");
        }, 1500);
    };

    return (
        <>
            <Navbar />

            <div className="container d-flex justify-content-center faded-background min-vh-100 min-vw-100 pt-4">
                <div className="login-card p-4 mb-4 text-start" style={{ width: "90%", maxWidth: "500px" }}>

                    <div className="text-center mb-4">
                        {match ? (
                            <>
                                <img
                                    src={match.image}
                                    alt={match.name}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "2px solid #c94b5b"
                                    }}
                                />
                                <h4 className="mt-2 mb-0">Plan a date with {match.name}</h4>
                            </>
                        ) : (
                            <h4>Date Planner</h4>
                        )}
                        <p className="text-muted small mt-1">Check out places in your area.</p>
                    </div>

                    <div className="map mb-4 d-flex align-items-center justify-content-center text-muted">
                        🗺️ Map goes here
                    </div>

                    <h5 className="section-title">Pick a Spot</h5>
                    <div className="d-flex flex-column gap-2 mb-4">
                        {VENUES.map((venue) => (
                            <div
                                key={venue.name}
                                onClick={() => setSelectedVenue(venue)}
                                className="card p-3"
                                style={{
                                    cursor: "pointer",
                                    border: selectedVenue?.name === venue.name ? "2px solid #a8001c" : "2px solid transparent",
                                    background: selectedVenue?.name === venue.name ? "#fdf0f0" : "white",
                                    transition: "all 0.15s"
                                }}
                            >
                                <div className="fw-bold">{venue.icon} {venue.name}</div>
                                <div className="text-muted small">📍 {venue.suggestion}</div>
                            </div>
                        ))}
                    </div>

                    <h5 className="section-title">Pick a Time</h5>
                    <div className="d-flex flex-column gap-2 mb-4">
                        {TIME_SLOTS.map((slot) => (
                            <div
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className="d-flex align-items-center gap-2"
                                style={{ cursor: "pointer" }}
                            >
                                <input
                                    type="radio"
                                    readOnly
                                    checked={selectedTime === slot}
                                    className="form-check-input mt-0"
                                    style={{ accentColor: "#a8001c" }}
                                />
                                <label style={{ cursor: "pointer" }}>{slot}</label>
                            </div>
                        ))}
                    </div>

                    {sent ? (
                        <div className="text-center text-success fw-bold">
                            ✅ Date request sent to {match?.name}!
                        </div>
                    ) : (
                        <div className="text-center">
                            {match ? (
                                <button
                                    className="btn btn-danger"
                                    onClick={handleSendRequest}
                                    disabled={!selectedVenue || !selectedTime}
                                >
                                    Send Date Request to {match.name}
                                </button>
                            ) : (
                                <button
                                    className="btn btn-danger"
                                    disabled={!selectedVenue || !selectedTime}
                                    onClick={() => alert(`Date planned: ${selectedVenue?.name} on ${selectedTime}`)}
                                >
                                    Save Date Plan
                                </button>
                            )}
                        </div>
                    )}

                    {returnTo && !sent && (
                        <div className="text-center mt-3">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => navigate(returnTo)}>
                                ‹ Back to Chat
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

export default DatePlanner;