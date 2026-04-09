import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API = "http://localhost:4000";

function Navbar() {
    const [open, setOpen]           = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const { currentUser, token, logout } = useUser();
    const navigate = useNavigate();
    const toggle   = () => setOpen(!open);

    useEffect(() => {
        if (!currentUser || !token) return;
        fetch(`${API}/dates/notifications/${currentUser.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                const unread = (data.notifications || []).some(n => !n.is_read);
                setHasUnread(unread);
            })
            .catch(() => {});
    }, [currentUser, token]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            <nav className="navbar navbar-dark navbar-color px-4">
                <span className="navbar-brand navbar-toggle" onClick={toggle}>☰</span>
                <div className="d-flex gap-3 text-white align-items-center">
                    <span className="navbar-icon" onClick={() => navigate("/notifications")}>
                        <i className="bi bi-bell"></i>
                        {hasUnread && <span className="navbar-notification-dot" />}
                    </span>
                    <i className="bi bi-share"></i>
                    <i className="bi bi-search"></i>
                </div>
            </nav>

            <div className={`sidebar ${open ? "open" : ""}`}>
                <button className="close-btn" onClick={toggle}>×</button>
                <ul className="list-unstyled mt-4">
                    <li><a href="/profile">Profile</a></li>
                    <li><a href="/matching">Matching</a></li>
                    <li><a href="/dates">Date Planner</a></li>
                    <li><a href="/chat">Messages</a></li>
                    <li><a href="/notifications">Notifications</a></li>
                    <li><button className="btn btn-link text-white p-0" onClick={handleLogout}>Logout</button></li>
                </ul>
            </div>
        </>
    );
}

export default Navbar;