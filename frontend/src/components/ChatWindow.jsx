import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ChatWindow({ match, onBack }) {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { from: "them", text: `Hey! We matched 😊` }
    ]);
    const [input, setInput] = useState("");

    const handleSend = (text = input.trim()) => {
        if (!text) return;
        setMessages((prev) => [...prev, { from: "me", text }]);
        setInput("");

        // BACKEND DISABLED
        /*
        fetch("/api/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: match.name, text })
        });
        */
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSend();
    };

    const handleRequestDate = () => {
        navigate("/dates", { state: { match, returnTo: "/chat" } });
    };

    return (
        <div className="d-flex flex-column w-100" style={{ height: "80vh" }}>

            <div
                className="d-flex align-items-center gap-3 p-3 mb-3 rounded"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
                <button className="btn btn-sm btn-outline-danger" onClick={onBack}>
                    ‹ Back
                </button>
                <img
                    src={match.image}
                    alt={match.name}
                    style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #c94b5b"
                    }}
                />
                <div className="fw-bold">{match.name}</div>
                <button
                    className="btn btn-sm btn-danger ms-auto bi-calendar-week"
                    onClick={handleRequestDate}
                >
                    - Plan Date
                </button>
            </div>

            <div
                className="flex-grow-1 overflow-auto px-2 mb-3 d-flex flex-column gap-2"
                style={{ scrollBehavior: "smooth" }}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`d-flex ${msg.from === "me" ? "justify-content-end" : "justify-content-start"}`}
                    >
                        <div
                            style={{
                                maxWidth: "70%",
                                padding: "10px 14px",
                                borderRadius: msg.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                background: msg.from === "me" ? "#a8001c" : "white",
                                color: msg.from === "me" ? "white" : "black",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                                fontSize: "0.95rem"
                            }}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="d-flex gap-2">
                <input
                    className="form-control"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ borderRadius: "20px" }}
                />
                <button
                    className="btn btn-danger"
                    onClick={() => handleSend()}
                    style={{ borderRadius: "20px", paddingInline: "20px" }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatWindow;