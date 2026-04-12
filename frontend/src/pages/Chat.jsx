import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../config/api";

function Chat() {
    const { currentUser, token } = useUser();
    const location = useLocation();

    const [mutualMatches, setMutualMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    const [selectedMatch, setSelectedMatch] = useState(location.state?.selectedMatch || null);

    useEffect(() => {
        if (!currentUser || !token) return;

        fetch(`${API_BASE_URL}/matches/${currentUser.user_id}/mutual`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.matches) setMutualMatches(data.matches);
                setLoadingMatches(false);
            })
            .catch(() => setLoadingMatches(false));
    }, [currentUser, token]);

    return (
        <>
            <Navbar />
            <div className="chat-page-outer faded-background">
                <div className="chat-page-inner">
                    {selectedMatch ? (
                        <ChatWindow match={selectedMatch} onBack={() => setSelectedMatch(null)} />
                    ) : (
                        <ChatList
                            matches={mutualMatches}
                            loading={loadingMatches}
                            onSelect={(m) => setSelectedMatch(m)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default Chat;
