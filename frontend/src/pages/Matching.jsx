import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API = "http://localhost:4000";

function Pill({ label }) {
    if (!label) return null;
    return <span className="match-pill">{label}</span>;
}

function InfoRow({ icon, text }) {
    if (!text) return null;
    return (
        <div className="match-info-row">
            <span className="match-info-icon">{icon}</span>
            <span className="match-info-text">{text}</span>
        </div>
    );
}

function MatchCard({ user, onHeart, onReject, likesLeft }) {
    const [animating, setAnimating] = useState(null);
    const outOfLikes = likesLeft !== null && likesLeft <= 0;

    const fire = (dir, cb) => {
        setAnimating(dir);
        setTimeout(() => { setAnimating(null); cb(); }, 350);
    };

    return (
        <div className={`match-card${animating === "heart" ? " match-card-swipe-right" : animating === "reject" ? " match-card-swipe-left" : ""}`}>
            <div className="match-card-photo-wrap">
                <img src={user.image} alt={user.name} className="match-card-photo" />
                <div className="match-card-photo-gradient" />
                <div className="match-card-photo-info">
                    <div className="match-card-name">
                        {user.name}{user.age ? `, ${user.age}` : ""}
                    </div>
                    {user.location && (
                        <div className="match-card-location">📍 {user.location}</div>
                    )}
                </div>
                <div className="match-card-rating-badge">
                    <StarRating rating={user.starRating} />
                </div>
            </div>

            <div className="match-card-body">
                <div className="match-pill-row">
                    <Pill label={user.gender} />
                    {user.age && <Pill label={`${user.age} yrs`} />}
                    {user.height && <Pill label={user.height} />}
                    {user.personality_name && <Pill label={user.personality_name} />}
                </div>

                <div className="match-info-grid">
                    <InfoRow icon="🎯" text={user.dating_goals_name} />
                    <InfoRow icon="🙏" text={user.religion_name} />
                    <InfoRow icon="⚡" text={user.activity_name && `Activity: ${user.activity_name}`} />
                    <InfoRow icon="👶" text={user.children_name} />
                    <InfoRow icon="🗳️" text={user.political_name} />
                    <InfoRow icon="🎵" text={user.music_name} />
                    <InfoRow icon="🚬" text={user.smoking_name && `Smoking: ${user.smoking_name}`} />
                    <InfoRow icon="🍷" text={user.drinking_name && `Drinking: ${user.drinking_name}`} />
                    <InfoRow icon="🥗" text={user.diet_name} />
                    <InfoRow icon="👨‍👩‍👧" text={user.family_oriented_name && `Family: ${user.family_oriented_name}`} />
                    <InfoRow icon="🎓" text={user.education_name} />
                </div>

                {user.bio && (
                    <div className="match-card-bio">"{user.bio}"</div>
                )}

                {user.score !== undefined && (
                    <div className="match-card-score">Match score: {user.score}</div>
                )}
            </div>

            <div className="match-card-actions">
                <button className="match-btn-reject" onClick={() => fire("reject", onReject)}>✕</button>
                <button
                    className={`match-btn-like${outOfLikes ? " match-btn-like-disabled" : ""}`}
                    onClick={() => { if (!outOfLikes) fire("heart", onHeart); }}
                    disabled={outOfLikes}
                    title={outOfLikes ? "Daily like limit reached" : "Like"}
                >❤️</button>
            </div>
        </div>
    );
}

function LikedPortal({ likedUsers, onOpenChat }) {
    if (likedUsers.length === 0) return null;
    return (
        <div className="liked-portal">
            <div className="liked-portal-title">
                ❤️ Liked — {likedUsers.length} {likedUsers.length === 1 ? "person" : "people"}
            </div>
            {likedUsers.map((u, i) => (
                <div key={i} className="liked-portal-row" onClick={() => onOpenChat(u)}>
                    <img src={u.image} alt={u.name} className="liked-portal-avatar" />
                    <div className="liked-portal-info">
                        <div className="liked-portal-name">{u.name}</div>
                        <div className="liked-portal-meta">
                            {[u.location, u.age && `${u.age} yrs`, u.gender].filter(Boolean).join(" · ")}
                        </div>
                    </div>
                    <div className="liked-portal-cta">Message →</div>
                </div>
            ))}
        </div>
    );
}

export default function Matching() {
    const { matches, matchesLoading, matchesError, currentUser, token, likedUsers, addLikedUser } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likesLeft, setLikesLeft]       = useState(null);
    const [showItsMatch, setShowItsMatch] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);
    useEffect(() => { setCurrentIndex(0); }, [matches]);

    const handleHeart = async () => {
        const liked = matches[currentIndex];
        if (!liked || !currentUser) return;

        addLikedUser(liked);
        setCurrentIndex(prev => prev + 1);

        try {
            const res = await fetch(`${API}/matches/${currentUser.user_id}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ liked_user_id: liked.user_id }),
            });
            const data = await res.json();
            if (data.likes_left !== undefined) setLikesLeft(data.likes_left);
            if (data.match_created) {
                setShowItsMatch(true);
                setTimeout(() => setShowItsMatch(false), 2000);
            }
        } catch (err) { console.error("Like failed:", err); }
    };

    const handleReject   = () => setCurrentIndex(prev => prev + 1);
    const handleOpenChat = (user) => navigate("/chat", { state: { selectedMatch: user } });

    if (matchesLoading) return (
        <><Navbar />
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-white">Finding your matches...</p>
            </div></>
    );
    if (matchesError) return (
        <><Navbar />
            <div className="faded-background d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
                <p className="text-danger">{matchesError}</p>
            </div></>
    );

    const allSwiped = currentIndex >= matches.length;

    return (
        <>
            <Navbar />

            {showItsMatch && (
                <div className="its-a-match-overlay">
                    <div className="its-a-match-emoji">❤️</div>
                    <div className="its-a-match-text">It's a match!</div>
                </div>
            )}

            <div className="faded-background matching-page">
                {!allSwiped && matches.length > 0 && (
                    <div className="matching-counter">
                        <span>{currentIndex + 1} of {matches.length}</span>
                        {likesLeft !== null && (
                            <span>❤️ {likesLeft} like{likesLeft !== 1 ? "s" : ""} left today</span>
                        )}
                    </div>
                )}

                {allSwiped || matches.length === 0 ? (
                    <div className="matching-empty-state">
                        <div className="matching-empty-icon">
                            {matches.length === 0 ? "🔍" : "✨"}
                        </div>
                        <div className="matching-empty-title">
                            {matches.length === 0 ? "No matches found yet" : "You've seen everyone!"}
                        </div>
                        <div className="matching-empty-sub">
                            {matches.length === 0
                                ? "Complete your profile to get better matches."
                                : "Check back tomorrow for new matches."}
                        </div>
                    </div>
                ) : (
                    <MatchCard
                        user={matches[currentIndex]}
                        onHeart={handleHeart}
                        onReject={handleReject}
                        likesLeft={likesLeft}
                    />
                )}

                <LikedPortal likedUsers={likedUsers} onOpenChat={handleOpenChat} />
            </div>
        </>
    );
}
