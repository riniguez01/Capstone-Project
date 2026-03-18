import { useState } from "react";
import Navbar from "../components/Navbar";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useUser } from "../context/UserContext";

function Chat() {
    const { matches } = useUser();
    const [selectedMatch, setSelectedMatch] = useState(null);

    return (
        <>
            <Navbar />
            <div className="container d-flex justify-content-center align-items-start faded-background min-vh-100 min-vw-100 pt-4">
                <div className="login-card p-4 mb-4" style={{ width: "90%", maxWidth: "500px" }}>
                    {selectedMatch ? (
                        <ChatWindow
                            match={selectedMatch}
                            onBack={() => setSelectedMatch(null)}
                        />
                    ) : (
                        <ChatList
                            matches={matches}
                            onSelect={(match) => setSelectedMatch(match)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default Chat;