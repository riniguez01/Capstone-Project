import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";

const API = "https://aura-backend-ysqh.onrender.com";

export default function Notifications() {
    const { currentUser, token } = useUser();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [responding, setResponding]       = useState(null);

    useEffect(() => {
        if (!currentUser || !token) return;
        fetch(`${API}/dates/notifications/${currentUser.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => setNotifications(data.notifications || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [currentUser, token]);

    const handleRespond = async (scheduleId, response) => {
        setResponding(scheduleId);
        try {
            await fetch(`${API}/dates/${scheduleId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ response, user_id: currentUser.user_id }),
            });
            setNotifications(prev =>
                prev.map(n => {
                    const p = typeof n.payload === "string" ? JSON.parse(n.payload) : n.payload;
                    if (p?.schedule_id === scheduleId) return { ...n, is_read: true, responded: response };
                    return n;
                })
            );
        } catch {}
        finally { setResponding(null); }
    };

    const formatDate = (dt) => {
        if (!dt) return "";
        return new Date(dt).toLocaleString("en-US", {
            weekday: "short", month: "short", day: "numeric",
            hour: "numeric", minute: "2-digit",
        });
    };

    const renderNotification = (n) => {
        const payload = typeof n.payload === "string" ? JSON.parse(n.payload) : n.payload;

        if (n.type === "date_request") {
            return (
                <div key={n.notification_id} className="notification-card">
                    <div className="notification-icon">📅</div>
                    <div className="notification-body">
                        <div className="notification-title">Date Request</div>
                        <div className="notification-detail">
                            {payload?.venue_name && <span>{payload.venue_name}</span>}
                            {payload?.proposed_datetime && (
                                <span> · {formatDate(payload.proposed_datetime)}</span>
                            )}
                        </div>
                        {!n.responded && !n.is_read && (
                            <div className="notification-actions">
                                <button
                                    className="btn btn-sm btn-danger"
                                    disabled={responding === payload?.schedule_id}
                                    onClick={() => handleRespond(payload.schedule_id, "approved")}
                                >
                                    Accept
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    disabled={responding === payload?.schedule_id}
                                    onClick={() => handleRespond(payload.schedule_id, "rejected")}
                                >
                                    Decline
                                </button>
                            </div>
                        )}
                        {(n.responded || n.is_read) && (
                            <div className={`notification-status ${n.responded === "approved" ? "notification-status-accepted" : "notification-status-read"}`}>
                                {n.responded === "approved" ? "✅ Accepted" : n.responded === "rejected" ? "❌ Declined" : "Seen"}
                            </div>
                        )}
                    </div>
                    <div className="notification-time">{formatDate(n.created_at)}</div>
                </div>
            );
        }

        if (n.type === "date_accepted") {
            return (
                <div key={n.notification_id} className="notification-card">
                    <div className="notification-icon">🎉</div>
                    <div className="notification-body">
                        <div className="notification-title">Date Accepted!</div>
                        <div className="notification-detail">
                            {payload?.venue_name} · {formatDate(payload?.proposed_datetime)}
                        </div>
                        <button
                            className="btn btn-sm btn-danger mt-2"
                            onClick={() => navigate("/chat")}
                        >
                            Go to Chat
                        </button>
                    </div>
                    <div className="notification-time">{formatDate(n.created_at)}</div>
                </div>
            );
        }

        if (n.type === "post_date_survey") {
            return (
                <div key={n.notification_id} className="notification-card">
                    <div className="notification-icon">📝</div>
                    <div className="notification-body">
                        <div className="notification-title">How did your date go?</div>
                        <div className="notification-detail">Share your safety check-in.</div>
                        <button
                            className="btn btn-sm btn-danger mt-2"
                            onClick={() => navigate("/postDate", { state: { schedule_id: payload?.schedule_id } })}
                        >
                            Complete Check-In
                        </button>
                    </div>
                    <div className="notification-time">{formatDate(n.created_at)}</div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <Navbar />
            <div className="faded-background min-vh-100 min-vw-100 d-flex justify-content-center pt-4">
                <div className="login-card p-4 mb-4 notifications-card">
                    <h4 className="section-title mb-3">🔔 Notifications</h4>

                    {loading && <p className="text-muted text-center">Loading...</p>}

                    {!loading && notifications.length === 0 && (
                        <p className="text-muted text-center">No notifications yet.</p>
                    )}

                    {!loading && notifications.map(renderNotification)}
                </div>
            </div>
        </>
    );
}