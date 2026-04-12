import Navbar from "../components/Navbar";
import AuraPlusHint from "../components/AuraPlusHint";
import ShieldRating from "../components/ShieldRating";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../config/api";

/** Prefer API `trust_shield_display`; else derive from legacy fields. */
function matchCardShieldRating(user) {
    if (!user) return null;
    const tsd = user.trust_shield_display;
    if (tsd != null && tsd !== "") {
        const n = Number(tsd);
        if (Number.isFinite(n) && n >= 1 && n <= 5) return Math.round(n);
    }

    const num = (v) => {
        if (v == null || v === "") return null;
        const x = Number(v);
        return Number.isFinite(x) ? x : null;
    };

    const fromDirect = num(user.shield_rating ?? user.starRating);
    if (fromDirect != null && fromDirect >= 1 && fromDirect <= 5) {
        return Math.round(fromDirect);
    }

    const fromPub = num(user.public_trust_rating);
    if (fromPub != null) {
        return Math.max(1, Math.min(5, Math.round(fromPub)));
    }

    return null;
}

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

function MatchCard({ user, onHeart, onReject, likesLeft, heartPending, swipeHeartOut }) {
    const [animating, setAnimating] = useState(null);
    const outOfLikes = likesLeft !== null && likesLeft <= 0;
    const heartLocked = outOfLikes || heartPending;

    const fire = (dir, cb) => {
        setAnimating(dir);
        setTimeout(() => { setAnimating(null); cb(); }, 350);
    };

    const cardClass = [
        "match-card",
        swipeHeartOut ? "match-card--swipe-heart" : "",
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
                <div className="match-card__rating-badge match-card__rating-badge--corner" title={user.trust_label ?? ""}>
                    <ShieldRating variant="onDark" rating={matchCardShieldRating(user)} />
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
                    type="button"
                    className="btn-reject"
                    disabled={heartPending}
                    onClick={() => { if (!heartPending) fire("reject", onReject); }}
                >✕</button>

                <button
                    className={`btn-heart${heartLocked ? " btn-heart--disabled" : ""}`}
                    type="button"
                    onClick={() => { if (!heartLocked) onHeart(); }}
                    disabled={heartLocked}
                    title={outOfLikes ? "Daily like limit reached" : heartPending ? "Sending…" : "Like"}
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
    const [heartPending, setHeartPending] = useState(false);
    const [likeActionError, setLikeActionError] = useState("");
    const [likeLimitAuraPlus, setLikeLimitAuraPlus] = useState(false);
    const [swipeHeartOut, setSwipeHeartOut] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);
    useEffect(() => { setCurrentIndex(0); }, [matches]);
    useEffect(() => {
        setLikeActionError("");
        setLikeLimitAuraPlus(false);
    }, [currentIndex]);

    const handleHeart = () => {
        const liked = matches[currentIndex];
        if (!liked || !currentUser || heartPending) return;
        if (likesLeft !== null && likesLeft <= 0) return;
        setHeartPending(true);
        setLikeActionError("");

        fetch(`${API_BASE_URL}/matches/${currentUser.user_id}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ liked_user_id: liked.user_id }),
        })
            .then(async (res) => {
                let data = {};
                try {
                    data = await res.json();
                } catch {
                    data = {};
                }
                if (res.status === 429) {
                    setLikeActionError(data.error || "Daily like limit reached.");
                    setLikeLimitAuraPlus(data.upgrade_hint === "aura_plus");
                    if (data.likes_left !== undefined) setLikesLeft(data.likes_left);
                    setHeartPending(false);
                    return;
                }
                const accepted = res.ok || res.status === 409;
                if (!accepted) {
                    setLikeActionError(data.error || "Could not send like.");
                    setHeartPending(false);
                    return;
                }
                if (data.likes_left !== undefined) setLikesLeft(data.likes_left);
                setSwipeHeartOut(true);
                setTimeout(() => {
                    addLikedUser(liked);
                    if (data.match_created) {
                        setShowItsMatch(true);
                        setTimeout(() => setShowItsMatch(false), 2000);
                    }
                    setCurrentIndex((prev) => prev + 1);
                    setSwipeHeartOut(false);
                    setHeartPending(false);
                }, 350);
            })
            .catch(() => {
                setLikeActionError("Could not connect to server.");
                setHeartPending(false);
            });
    };

    const handleReject   = () => setCurrentIndex(prev => prev + 1);
    const handleOpenChat = (user) => navigate("/chat", { state: { selectedMatch: user } });

    const showIdleAuraPlus =
        likesLeft === 0
        && tierLimit === 3
        && currentIndex < matches.length
        && matches.length > 0
        && !likeActionError;

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
                {(likesLeft !== null || (!allSwiped && matches.length > 0)) && (
                    <div className="match-counter">
                        {!allSwiped && matches.length > 0 && (
                            <span className="match-counter__progress">{currentIndex + 1} of {matches.length}</span>
                        )}
                        {likesLeft !== null && (
                            <span className="match-counter__likes">❤️ {likesLeft} of {tierLimit} like{tierLimit !== 1 ? "s" : ""} left today</span>
                        )}
                    </div>
                )}

                {showIdleAuraPlus && <AuraPlusHint className="aura-plus-hint--quiet" />}

                {likeActionError && (
                    <div className="match-like-alert" role="alert">{likeActionError}</div>
                )}
                {likeLimitAuraPlus && <AuraPlusHint />}

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
                        key={matches[currentIndex].user_id}
                        user={matches[currentIndex]}
                        onHeart={handleHeart}
                        onReject={handleReject}
                        likesLeft={likesLeft}
                        heartPending={heartPending}
                        swipeHeartOut={swipeHeartOut}
                    />
                )}

                <LikedPortal likedUsers={likedUsers} onOpenChat={handleOpenChat} />
            </div>
        </>
    );
}