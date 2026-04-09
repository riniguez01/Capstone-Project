import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";

const API = "http://localhost:4000";

function ChatWindow({ match, onBack }) {
    const navigate = useNavigate();
    const { currentUser, token } = useUser();
    const [messages, setMessages]     = useState([]);
    const [input, setInput]           = useState("");
    const [blocked, setBlocked]       = useState(null);
    const [warning, setWarning]       = useState(null);
    const [isTyping, setIsTyping]     = useState(false);
    const socketRef  = useRef(null);
    const bottomRef  = useRef(null);
    const typingTimer = useRef(null);

    useEffect(() => {
        if (!match?.match_id || !token) return;

        fetch(`${API}/messages/${match.match_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.messages) {
                    setMessages(data.messages.map(m => ({
                        from:    m.sender_id === currentUser?.user_id ? "me" : "them",
                        text:    m.content,
                        sent_at: m.sent_at,
                    })));
                }
            })
            .catch(() => {});

        const socket = io(API, { auth: { token } });
        socketRef.current = socket;

        socket.emit("join_match", { match_id: match.match_id });

        socket.on("new_message", (msg) => {
            setMessages(prev => [...prev, {
                from:    msg.sender_id === currentUser?.user_id ? "me" : "them",
                text:    msg.content,
                sent_at: msg.sent_at,
            }]);
        });

        socket.on("message_blocked", ({ reason }) => {
            setBlocked(reason);
            setTimeout(() => setBlocked(null), 4000);
        });

        socket.on("safety_prompt", ({ reason }) => {
            setWarning(reason);
            setTimeout(() => setWarning(null), 4000);
        });

        socket.on("user_typing", () => setIsTyping(true));
        socket.on("user_stop_typing", () => setIsTyping(false));

        return () => {
            socket.emit("leave_match", { match_id: match.match_id });
            socket.disconnect();
        };
    }, [match?.match_id, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !socketRef.current || !match?.match_id) return;
        socketRef.current.emit("send_message", { match_id: match.match_id, content: text });
        setInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") { handleSend(); return; }
        if (!socketRef.current || !match?.match_id) return;
        socketRef.current.emit("typing", { match_id: match.match_id });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            socketRef.current?.emit("stop_typing", { match_id: match.match_id });
        }, 1500);
    };

    const handleRequestDate = () => {
        navigate("/dates", { state: { match, returnTo: "/chat" } });
    };

    return (
        <div className="chat-window">
            <div className="chat-window-header">
                <button className="btn btn-sm btn-outline-danger" onClick={onBack}>‹ Back</button>
                <img src={match.image} alt={match.name} className="chat-window-avatar" />
                <div className="fw-bold">{match.name}</div>
                <button className="btn btn-sm btn-danger ms-auto" onClick={handleRequestDate}>
                    📅 Plan Date
                </button>
            </div>

            {blocked && (
                <div className="chat-blocked-banner">🚫 {blocked}</div>
            )}
            {warning && (
                <div className="chat-warning-banner">⚠️ {warning}</div>
            )}

            <div className="chat-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble-row ${msg.from === "me" ? "chat-bubble-row-me" : "chat-bubble-row-them"}`}>
                        <div className={`chat-bubble ${msg.from === "me" ? "chat-bubble-me" : "chat-bubble-them"}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="chat-bubble-row chat-bubble-row-them">
                        <div className="chat-bubble chat-bubble-them chat-typing-indicator">
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="chat-input-row">
                <input
                    className="form-control chat-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className="btn btn-danger chat-send-btn" onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatWindow;
