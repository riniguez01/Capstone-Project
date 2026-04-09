import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

const API = "http://3.16.24.97:4000";

function Navbar() {
    const { currentUser, token } = useUser();
    const [menuOpen,  setMenuOpen]  = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);

    const fetchNotifications = () => {
        if (!currentUser || !token) return;
        fetch(`${API}/dates/notifications/${currentUser.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.notifications) {
                    setNotifications(data.notifications);
                    setUnread(data.notifications.filter(n => !n.is_read).length);
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchNotifications();
    }, [currentUser, token]);

    const handleRespond = async (scheduleId, response) => {
        try {
            await fetch(`${API}/dates/${scheduleId}/respond`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ response, user_id: currentUser.user_id }),
            });
            fetchNotifications();
        } catch (err) {
            console.error("Respond error:", err);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return "";
        return new Date(iso).toLocaleString([], {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const formatNotif = (n) => {
        const p = n.payload || {};
        if (n.type === "date_request") {
            return {
                icon:     "📅",
                title:    "Date Request",
                body:     `${p.venue_name || "Venue"} · ${formatDate(p.proposed_datetime)}`,
                showActions: true,
                scheduleId:  p.schedule_id,
            };
        }
        if (n.type === "date_accepted") {
            return {
                icon:  "✅",
                title: "Date Accepted!",
                body:  `${p.venue_name || "Your date"} on ${formatDate(p.proposed_datetime)} is confirmed.`,
                showActions: false,
            };
        }
        if (n.type === "post_date_survey") {
            return {
                icon:  "⭐",
                title: "Rate Your Date",
                body:  `How did your date at ${p.venue_name || "the venue"} go?`,
                showActions: false,
            };
        }
        return { icon: "🔔", title: n.type, body: "", showActions: false };
    };

    return (
        <>
            <nav className="navbar navbar-dark navbar-color px-4">
                <span className="navbar-brand" onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "pointer" }}>☰</span>
                <div className="d-flex gap-3 text-white align-items-center">
                    <div className="notif-bell-wrap" onClick={() => { setNotifOpen(!notifOpen); fetchNotifications(); }}>
                        <i className="bi bi-bell"></i>
                        {unread > 0 && (
                            <span className="notif-badge">{unread}</span>
                        )}
                    </div>
                    <i className="bi bi-share"></i>
                    <i className="bi bi-search"></i>
                </div>
            </nav>

            {notifOpen && (
                <div className="notif-panel">
                    <h5 className="section-title">🔔 Notifications</h5>
                    {notifications.length === 0 && (
                        <p className="text-muted small text-center mt-3">No notifications yet.</p>
                    )}
                    {notifications.map((n) => {
                        const f = formatNotif(n);
                        return (
                            <div key={n.notification_id} className={`notif-item${n.is_read ? " notif-item--read" : ""}`}>
                                <div className="notif-item__icon">{f.icon}</div>
                                <div className="notif-item__body">
                                    <div className="notif-item__title">{f.title}</div>
                                    <div className="notif-item__text">{f.body}</div>
                                    <div className="notif-item__time">{formatDate(n.created_at)}</div>
                                    {f.showActions && !n.is_read && (
                                        <div className="d-flex gap-2 mt-2">
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRespond(f.scheduleId, "approved")}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRespond(f.scheduleId, "rejected")}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                    {f.showActions && n.is_read && (
                                        <div className="notif-item__responded">Responded</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={`sidebar ${menuOpen ? "open" : ""}`}>
                <button className="close-btn" onClick={() => setMenuOpen(false)}>×</button>
                <ul className="list-unstyled mt-4">
                    <li><a href="/profile">Profile</a></li>
                    <li><a href="/matching">Matching</a></li>
                    <li><a href="/dates">Date Planner</a></li>
                    <li><a href="/chat">Messages</a></li>
                    <li><a href="/">Logout</a></li>
                </ul>
            </div>
        </>
    );
}

export default Navbar;