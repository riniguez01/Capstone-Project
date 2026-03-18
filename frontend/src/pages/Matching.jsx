import Navbar from "../components/Navbar";
import Match from "../components/Match";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Matching() {
    const { matches, matchesLoading, matchesError, currentUser, token } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [matches]);

    const handleHeart = async () => {
        const likedUser = matches[currentIndex];
        if (!likedUser || !currentUser) return;

        // BACKEND
        try {
            await fetch(`http://localhost:4000/matches/${currentUser.user_id}/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ liked_user_id: likedUser.user_id }),
            });
        } catch (err) {
            console.error("Like failed:", err);
        }

        setCurrentIndex((prev) => Math.min(prev + 1, matches.length - 1));
    };

    const handleReject = () => {
        setCurrentIndex((prev) => Math.min(prev + 1, matches.length - 1));
    };

    if (matchesLoading) return (
        <>
            <Navbar />
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-white">Finding your matches...</p>
            </div>
        </>
    );

    if (matchesError) return (
        <>
            <Navbar />
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-danger">{matchesError}</p>
            </div>
        </>
    );

    if (!matches || matches.length === 0) return (
        <>
            <Navbar />
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-white">No matches found yet.</p>
            </div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="container d-flex flex-column justify-content-center align-items-center faded-background min-vh-100 min-vw-100">
                <p className="text-white small mb-3" style={{ opacity: 0.7 }}>
                    {currentIndex + 1} / {matches.length}
                </p>
                <Match
                    user={matches[currentIndex]}
                    onHeart={handleHeart}
                    onReject={handleReject}
                />
            </div>
        </>
    );
}

export default Matching;