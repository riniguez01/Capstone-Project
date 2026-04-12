import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../config/api";

function formatMsgTime(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
        return "";
    }
}

function ChatWindow({ match, onBack }) {
    const navigate = useNavigate();
    const { currentUser, token } = useUser();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [blocked, setBlocked] = useState(null);
    const [warning, setWarning] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const typingTimer = useRef(null);
    const myUserIdRef = useRef(currentUser?.user_id);
    useEffect(() => {
        myUserIdRef.current = currentUser?.user_id;
    }, [currentUser?.user_id]);

    const matchIdNum = match?.match_id != null ? Number(match.match_id) : null;

    useEffect(() => {
        if (matchIdNum == null || Number.isNaN(matchIdNum) || !token) return;

        fetch(`${API_BASE_URL}/messages/${matchIdNum}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.messages) {
                    const myId = Number(myUserIdRef.current);
                    setMessages(
                        data.messages.map((m) => ({
                            messageId: m.message_id,
                            from: Number(m.sender_id) === myId ? "me" : "them",
                            text: m.content,
                            sent_at: m.sent_at,
                        }))
                    );
                }
            })
            .catch(() => {});

        const socket = io(API_BASE_URL, { auth: { token } });
        socketRef.current = socket;

        socket.emit("join_match", { match_id: matchIdNum });

        socket.on("new_message", (msg) => {
            const myId = Number(myUserIdRef.current);
            setMessages((prev) => [
                ...prev,
                {
                    messageId: msg.message_id,
                    from: Number(msg.sender_id) === myId ? "me" : "them",
                    text: msg.content,
                    sent_at: msg.sent_at,
                },
            ]);
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

        socket.on("connect_error", (err) => {
            console.error("[chat socket]", err?.message || err);
        });

        return () => {
            socket.emit("leave_match", { match_id: matchIdNum });
            socket.disconnect();
        };
    }, [matchIdNum, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !socketRef.current || matchIdNum == null || Number.isNaN(matchIdNum)) return;
        socketRef.current.emit("send_message", { match_id: matchIdNum, content: text });
        setInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSend();
            return;
        }
        if (!socketRef.current || matchIdNum == null || Number.isNaN(matchIdNum)) return;
        socketRef.current.emit("typing", { match_id: matchIdNum });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            socketRef.current?.emit("stop_typing", { match_id: matchIdNum });
        }, 1500);
    };

    const handleRequestDate = () => {
        navigate("/dates", { state: { match, returnTo: "/chat" } });
    };

    return (
        <div className="chat-app">
            <header className="chat-app-header">
                <button type="button" className="chat-app-back" onClick={onBack} aria-label="Back to matches">
                    ‹
                </button>
                <div className="chat-app-peer">
                    <img src={match.image} alt={match.name} className="chat-app-peer-avatar" />
                    <div className="chat-app-peer-text">
                        <span className="chat-app-peer-name">{match.name}</span>
                        <span className="chat-app-peer-badge">Your match</span>
                    </div>
                </div>
                <button type="button" className="chat-app-date" onClick={handleRequestDate}>
                    <i className="bi bi-calendar-heart" aria-hidden />
                    Plan date
                </button>
            </header>

            {blocked && <div className="chat-app-banner chat-app-banner--block">{blocked}</div>}
            {warning && <div className="chat-app-banner chat-app-banner--warn">{warning}</div>}

            <div className="chat-app-thread">
                {messages.map((msg, i) => {
                    const isEvent = typeof msg.text === "string" && msg.text.startsWith("📅");
                    const rowClass = isEvent
                        ? "chat-msg-row chat-msg-row--event"
                        : msg.from === "me"
                          ? "chat-msg-row chat-msg-row--out"
                          : "chat-msg-row chat-msg-row--in";
                    const bubbleClass = isEvent
                        ? "chat-msg-bubble chat-msg-bubble--event"
                        : msg.from === "me"
                          ? "chat-msg-bubble chat-msg-bubble--out"
                          : "chat-msg-bubble chat-msg-bubble--in";
                    const key = msg.messageId != null ? `id-${msg.messageId}` : `k-${i}-${msg.sent_at || ""}`;
                    const t = formatMsgTime(msg.sent_at);
                    return (
                        <div key={key} className={rowClass}>
                            <div className="chat-msg-stack">
                                <div className={bubbleClass}>{msg.text}</div>
                                {!isEvent && t && (
                                    <div
                                        className={`chat-msg-time ${msg.from === "me" ? "chat-msg-time--out" : "chat-msg-time--in"}`}
                                    >
                                        {t}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="chat-msg-row chat-msg-row--in">
                        <div className="chat-msg-typing" aria-hidden>
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="chat-app-thread-end" />
            </div>

            <footer className="chat-app-composer">
                <div className="chat-app-composer-inner">
                    <input
                        id="chat-message-input"
                        name="message"
                        className="chat-app-input"
                        placeholder="Message…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                    <button type="button" className="chat-app-send" onClick={handleSend} aria-label="Send message">
                        <i className="bi bi-send-fill" aria-hidden />
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default ChatWindow;
