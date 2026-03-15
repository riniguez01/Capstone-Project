// MatchingWithBackend.jsx
// Cindy's integration layer — pulls real matches from backend via UserContext.
// Alex's Matching.jsx is NOT modified. This file replaces the /matching route
// in App.jsx and renders the same UI using live data instead of mock data.

import Navbar from "../components/Navbar";
import Match from "../components/Match";
import { useEffect, useCallback, useState } from "react";
import { useUser } from "../context/UserContext";

function MatchingWithBackend() {
    const { matches, matchesLoading, matchesError, currentUser, token } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Reset index when matches load
    useEffect(() => {
        setCurrentIndex(0);
    }, [matches]);

    const handleWheel = useCallback((e) => {
        if (e.deltaY < 0) {
            setCurrentIndex((prev) => Math.min(prev + 1, matches.length - 1));
        } else {
            setCurrentIndex((prev) => Math.max(prev - 1, 0));
        }
    }, [matches.length]);

    useEffect(() => {
        window.addEventListener("wheel", handleWheel);
        return () => window.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    const handleHeart = async () => {
        const likedUser = matches[currentIndex];
        if (!likedUser || !currentUser) return;

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

    if (matchesLoading) {
        return (
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-white">Finding your matches...</p>
            </div>
        );
    }

    if (matchesError) {
        return (
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-danger">{matchesError}</p>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-white">No matches found yet.</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container d-flex flex-column justify-content-center align-items-center faded-background min-vh-100 min-vw-100">
                <p className="text-white small mb-2" style={{ opacity: 0.7 }}>
                    Scroll ↑ for next · Scroll ↓ for previous
                </p>
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

export default MatchingWithBackend;
