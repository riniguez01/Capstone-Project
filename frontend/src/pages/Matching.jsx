import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API = "https://aura-backend-ysqh.onrender.com";

function Pill({ label }) {
    if (!label) return null;
    return <span className="match-pill">{label}</span>;
}

function InfoRow({ icon, text }) {
    if (!text) return null;
    return (
        <div className="info-row">
            <span className="info-row__icon">{icon}</span>
            <span className="info-row__text">{text}</span>
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

    const cardClass = [
        "match-card",
        animating === "heart"  ? "match-card--swipe-heart"  : "",
        animating === "reject" ? "match-card--swipe-reject" : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={cardClass}>
            <div className="match-card__photo-wrap">
                <img src={user.image} alt={user.name} className="match-card__photo" />
                <div className="match-card__gradient" />
                <div className="match-card__photo-info">
                    <div className="match-card__name">
                        {user.name}{user.age ? `, ${user.age}` : ""}
                    </div>
                    {user.location && (
                        <div className="match-card__location">📍 {user.location}</div>
                    )}
                </div>
                <div className="match-card__rating-badge">
                    <StarRating rating={user.starRating} />
                </div>
            </div>

            <div className="match-card__body">
                <div className="match-card__pills">
                    <Pill label={user.gender} />
                    {user.age && <Pill label={`${user.age} yrs`} />}
                    {user.height && <Pill label={user.height} />}
                    {user.personality_name && <Pill label={user.personality_name} />}
                </div>

                <div className="match-card__grid">
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
                    <div className="match-card__bio">"{user.bio}"</div>
                )}

                {user.score !== undefined && (
                    <div className="match-card__score">Match score: {user.score}</div>
                )}
            </div>

            <div className="match-card__actions">
                <button
                    className="btn-reject"
                    onClick={() => fire("reject", onReject)}
                >✕</button>

                <button
                    className={`btn-heart${outOfLikes ? " btn-heart--disabled" : ""}`}
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
            <div className="liked-portal__heading">
                ❤️ Liked — {likedUsers.length} {likedUsers.length === 1 ? "person" : "people"}
            </div>
            {likedUsers.map((u, i) => (
                <div key={i} className="liked-portal__item" onClick={() => onOpenChat(u)}>
                    <img src={u.image} alt={u.name} className="liked-portal__avatar" />
                    <div className="liked-portal__info">
                        <div className="liked-portal__name">{u.name}</div>
                        <div className="liked-portal__meta">
                            {[u.location, u.age && `${u.age} yrs`, u.gender].filter(Boolean).join(" · ")}
                        </div>
                    </div>
                    <div className="liked-portal__cta">Message →</div>
                </div>
            ))}
        </div>
    );
}

export default function Matching() {
    const { matches, matchesLoading, matchesError, currentUser, token, likedUsers, addLikedUser, likesLeft, setLikesLeft, tierLimit } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showItsMatch, setShowItsMatch] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);
    useEffect(() => { setCurrentIndex(0); }, [matches]);

    const handleHeart = async () => {
        const liked = matches[currentIndex];
        if (!liked || !currentUser) return;

        addLikedUser(liked);
        setCurrentIndex(prev => prev + 1);
        setLikesLeft(prev => (prev !== null ? Math.max(0, prev - 1) : null));

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

    const allSwiped = currentIndex >= matches.length;

    return (
        <>
            <Navbar />

            {showItsMatch && (
                <div className="match-overlay">
                    <div className="match-overlay__icon">❤️</div>
                    <div className="match-overlay__text">It's a match!</div>
                </div>
            )}

            <div className="faded-background min-vh-100 min-vw-100 match-page">
                {!allSwiped && matches.length > 0 && (
                    <div className="match-counter">
                        <span>{currentIndex + 1} of {matches.length}</span>
                        {likesLeft !== null && (
                            <span>❤️ {likesLeft} of {tierLimit} like{tierLimit !== 1 ? "s" : ""} left today</span>
                        )}
                    </div>
                )}

                {allSwiped || matches.length === 0 ? (
                    <div className="match-empty">
                        <div className="match-empty__icon">
                            {matches.length === 0 ? "🔍" : "✨"}
                        </div>
                        <div className="match-empty__title">
                            {matches.length === 0 ? "No matches found yet" : "You've seen everyone!"}
                        </div>
                        <div className="match-empty__subtitle">
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