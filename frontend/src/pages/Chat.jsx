import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useUser } from "../context/UserContext";

const API = "https://aura-dating.us";

function Chat() {
    const { currentUser, token } = useUser();
    const location = useLocation();

    const [mutualMatches, setMutualMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    const [selectedMatch, setSelectedMatch] = useState(
        location.state?.selectedMatch || null
    );

    useEffect(() => {
        if (!currentUser || !token) return;

        fetch(`${API}/matches/${currentUser.user_id}/mutual`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.matches) setMutualMatches(data.matches);
                setLoadingMatches(false);
            })
            .catch(() => setLoadingMatches(false));
    }, [currentUser, token]);

    return (
        <>
            <Navbar />
            <div className="container d-flex justify-content-center align-items-start faded-background min-vh-100 min-vw-100 pt-4">
                <div className="login-card chat-page-card p-4 mb-4">
                    {selectedMatch ? (
                        <ChatWindow
                            match={selectedMatch}
                            onBack={() => setSelectedMatch(null)}
                        />
                    ) : (
                        <ChatList
                            matches={mutualMatches}
                            loading={loadingMatches}
                            onSelect={(match) => setSelectedMatch(match)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default Chat;