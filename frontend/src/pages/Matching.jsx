import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API = "http://localhost:4000";

function Pill({ label }) {
    if (!label) return null;
    return (
        <span className="match-pill">{label}</span>
    );
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

    const cardClass = [
        "match-card",
        animating === "heart"  ? "match-card--swipe-right" : "",
        animating === "reject" ? "match-card--swipe-left"  : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={cardClass}>
            <div className="match-card__photo-wrap">
                <img src={user.image} alt={user.name} className="match-card__photo" />
                <div className="match-card__photo-gradient" />
                <div className="match-card__photo-info">
                    <div className="match-card__name">
                        {user.name}{user.age ? `, ${user.age}` : ""}
                    </div>
                    {user.location && (
                        <div className="match-card__location">📍 {user.location}</div>
                    )}
                </div>
                <div className="match-card__trust-badge">
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
                    <InfoRow icon="🥗"  text={user.diet_name} />
                    <InfoRow icon="👨‍👩‍👧" text={user.family_oriented_name && `Family: ${user.family_oriented_name}`} />
                    <InfoRow icon="🎓" text={user.education_name} />
                </div>

                {user.bio && (
                    <div className="match-card__bio">
                        &ldquo;{user.bio}&rdquo;
                    </div>
                )}

                {user.score !== undefined && (
                    <div className="match-card__score">Match score: {user.score}</div>
                )}
            </div>

            <div className="match-card__actions">
                <button
                    className="match-card__btn match-card__btn--reject"
                    onClick={() => fire("reject", onReject)}
                >✕</button>

                <button
                    className={`match-card__btn match-card__btn--heart${outOfLikes ? " match-card__btn--disabled" : ""}`}
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
                <div key={i} onClick={() => onOpenChat(u)} className="liked-portal__row">
                    <img src={u.image} alt={u.name} className="liked-portal__avatar" />
                    <div className="liked-portal__info">
                        <div className="liked-portal__name">{u.name}</div>
                        <div className="liked-portal__sub">
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
    const { matches, matchesLoading, matchesError, currentUser, token, likedUsers, addLikedUser } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likesLeft, setLikesLeft]       = useState(null);
    const [showItsMatch, setShowItsMatch] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);
    useEffect(() => { setCurrentIndex(0); }, [matches]);

    useEffect(() => {
        if (!currentUser || !token) return;
        fetch(`${API}/matches/${currentUser.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.likes_left !== undefined) setLikesLeft(data.likes_left);
            })
            .catch(() => {});
    }, [currentUser, token]);

    const handleHeart = async () => {
        const liked = matches[currentIndex];
        if (!liked || !currentUser) return;

        if (likesLeft !== null && likesLeft <= 0) return;

        addLikedUser(liked);
        setCurrentIndex(prev => prev + 1);
        if (likesLeft !== null) setLikesLeft(prev => Math.max(0, prev - 1));

        try {
            const res = await fetch(`${API}/matches/${currentUser.user_id}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ liked_user_id: liked.user_id }),
            });
            const data = await res.json();

            if (res.status === 409) {
                setLikesLeft(prev => prev !== null ? prev + 1 : prev);
                return;
            }

            if (res.status === 429) {
                setLikesLeft(0);
                return;
            }

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
                <div className="its-a-match-overlay">
                    <div className="its-a-match-icon">❤️</div>
                    <div className="its-a-match-text">It&apos;s a match!</div>
                </div>
            )}

            <div className="faded-background matching-page">
                {!allSwiped && matches.length > 0 && (
                    <div className="matching-status-bar">
                        <span>{currentIndex + 1} of {matches.length}</span>
                        {likesLeft !== null && (
                            <span>❤️ {likesLeft} like{likesLeft !== 1 ? "s" : ""} left today</span>
                        )}
                    </div>
                )}

                {allSwiped || matches.length === 0 ? (
                    <div className="matching-empty">
                        <div className="matching-empty__icon">
                            {matches.length === 0 ? "🔍" : "✨"}
                        </div>
                        <div className="matching-empty__title">
                            {matches.length === 0 ? "No matches found yet" : "You've seen everyone!"}
                        </div>
                        <div className="matching-empty__sub">
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