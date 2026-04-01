import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useUser } from "../context/UserContext";

function Chat() {
    const { mutualMatches } = useUser();
    const location = useLocation();

    const [selectedMatch, setSelectedMatch] = useState(
        location.state?.selectedMatch || null
    );

    return (
        <>
            <Navbar />
            <div className="container d-flex justify-content-center align-items-start faded-background min-vh-100 min-vw-100 pt-4">
                <div className="login-card p-4 mb-4 chat-page-card">
                    {selectedMatch ? (
                        <ChatWindow
                            match={selectedMatch}
                            onBack={() => setSelectedMatch(null)}
                        />
                    ) : (
                        <ChatList
                            matches={mutualMatches}
                            onSelect={(match) => setSelectedMatch(match)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default Chat;

