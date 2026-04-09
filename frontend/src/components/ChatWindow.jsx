import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";

const API = "https://aura-backend-ysqh.onrender.com";

function ChatWindow({ match, onBack }) {
    const navigate = useNavigate();
    const { currentUser, token } = useUser();
    const [matchId, setMatchId]     = useState(match?.match_id || null);
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState("");
    const [warning, setWarning]     = useState(null);
    const [blocked, setBlocked]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const socketRef                 = useRef(null);
    const bottomRef                 = useRef(null);

    useEffect(() => {
        if (!match?.user_id || !token || matchId) return;
        fetch(`${API}/matches/${currentUser.user_id}/mutual`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                const found = (data.matches || []).find(m => m.user_id === match.user_id);
                if (found) setMatchId(found.match_id);
            })
            .catch(() => {});
    }, [match?.user_id, token, matchId, currentUser]);

    useEffect(() => {
        if (!matchId || !token) return;

        fetch(`${API}/messages/${matchId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        const socket = io(API, {
            auth: { token },
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.emit("join_match", { match_id: matchId });

        socket.on("new_message", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on("safety_prompt", ({ reason }) => {
            setWarning(reason);
            setTimeout(() => setWarning(null), 5000);
        });

        socket.on("message_blocked", ({ reason }) => {
            setBlocked(reason);
            setTimeout(() => setBlocked(null), 6000);
        });

        return () => {
            socket.emit("leave_match", { match_id: matchId });
            socket.disconnect();
        };
    }, [matchId, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !socketRef.current || !matchId) return;
        setInput("");
        setWarning(null);
        setBlocked(null);
        socketRef.current.emit("send_message", {
            match_id: matchId,
            content:  text,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSend();
    };

    const handleRequestDate = () => {
        navigate("/dates", { state: { match, returnTo: "/chat" } });
    };

    const formatTime = (ts) => {
        if (!ts) return "";
        return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="d-flex flex-column w-100 chat-window-wrap">
            <div className="d-flex align-items-center gap-3 p-3 mb-3 rounded chat-header">
                <button className="btn btn-sm btn-outline-danger" onClick={onBack}>
                    ‹ Back
                </button>
                <img
                    src={match.image}
                    alt={match.name}
                    className="chat-avatar"
                />
                <div className="fw-bold">{match.name}</div>
                <button
                    className="btn btn-sm btn-danger ms-auto bi-calendar-week"
                    onClick={handleRequestDate}
                >
                    Plan Date
                </button>
            </div>

            {warning && (
                <div className="alert alert-warning py-2 px-3 mb-2 small">
                    ⚠️ {warning}
                </div>
            )}
            {blocked && (
                <div className="alert alert-danger py-2 px-3 mb-2 small">
                    🚫 {blocked}
                </div>
            )}

            <div className="flex-grow-1 overflow-auto px-2 mb-3 d-flex flex-column gap-2 chat-message-list">
                {loading && (
                    <div className="text-center text-muted small pt-3">Loading messages...</div>
                )}
                {!loading && messages.length === 0 && (
                    <div className="text-center text-muted small pt-3">
                        Say hello to {match.name}!
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser?.user_id;
                    return (
                        <div
                            key={msg.message_id || i}
                            className={`d-flex ${isMe ? "justify-content-end" : "justify-content-start"}`}
                        >
                            <div className={`chat-bubble ${isMe ? "chat-bubble--me" : "chat-bubble--them"}`}>
                                <div>{msg.content}</div>
                                <div className="chat-bubble__time">{formatTime(msg.sent_at)}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="d-flex gap-2">
                <input
                    className="form-control chat-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="btn btn-danger chat-send-btn"
                    onClick={handleSend}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatWindow;