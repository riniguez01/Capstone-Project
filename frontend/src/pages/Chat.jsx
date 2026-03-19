import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useUser } from "../context/UserContext";

function Chat() {
    const { likedUsers } = useUser();
    const location = useLocation();

    const [selectedMatch, setSelectedMatch] = useState(
        location.state?.selectedMatch || null
    );

    // ── TEMP DEBUG — remove after confirming it works ──
    console.log("Chat.jsx: likedUsers =", likedUsers);

    return (
        <>
            <Navbar />
            <div className="container d-flex justify-content-center align-items-start faded-background min-vh-100 min-vw-100 pt-4">
                <div className="login-card p-4 mb-4" style={{ width: "90%", maxWidth: "500px" }}>

                    {/* TEMP DEBUG — shows count on screen */}
                    <p style={{ color: "red", fontSize: "12px" }}>
                        DEBUG: likedUsers.length = {likedUsers.length}
                    </p>

                    {selectedMatch ? (
                        <ChatWindow
                            match={selectedMatch}
                            onBack={() => setSelectedMatch(null)}
                        />
                    ) : (
                        <ChatList
                            matches={likedUsers}
                            onSelect={(match) => setSelectedMatch(match)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default Chat;
