import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const API = "http://localhost:4000";

function Pill({ label }) {
    if (!label) return null;
    return (
        <span style={{
            background: "#fdf0f0", color: "#a8001c", borderRadius: "20px",
            padding: "3px 11px", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap",
        }}>{label}</span>
    );
}

function InfoRow({ icon, text }) {
    if (!text) return null;
    return (
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px" }}>
            <span style={{ flexShrink: 0, width: "20px" }}>{icon}</span>
            <span style={{ color: "#444" }}>{text}</span>
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
        <div style={{
            background: "white", borderRadius: "24px",
            width: "100%", maxWidth: "400px",
            boxShadow: "0 8px 32px rgba(139,0,0,0.18)",
            overflow: "hidden",
            transform: animating === "heart" ? "translateX(90px) rotate(8deg) scale(0.95)"
                : animating === "reject" ? "translateX(-90px) rotate(-8deg) scale(0.95)"
                    : "none",
            opacity: animating ? 0 : 1,
            transition: "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease",
        }}>

            {/* Photo */}
            <div style={{ position: "relative" }}>
                <img src={user.image} alt={user.name}
                     style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                    pointerEvents: "none",
                }} />
                <div style={{ position: "absolute", bottom: "14px", left: "16px", color: "white" }}>
                    <div style={{ fontSize: "21px", fontWeight: 700, lineHeight: 1.1 }}>
                        {user.name}{user.age ? `, ${user.age}` : ""}
                    </div>
                    {user.location && (
                        <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "3px" }}>
                            📍 {user.location}
                        </div>
                    )}
                </div>
                <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: "rgba(0,0,0,0.5)", borderRadius: "20px", padding: "3px 9px",
                }}>
                    <StarRating rating={user.starRating} />
                </div>
            </div>

            {/* Info */}
            <div style={{ padding: "14px 16px 8px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                    <Pill label={user.gender} />
                    {user.age && <Pill label={`${user.age} yrs`} />}
                    {user.height && <Pill label={user.height} />}
                    {user.personality_name && <Pill label={user.personality_name} />}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 12px", marginBottom: "10px" }}>
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
                    <div style={{
                        padding: "8px 10px", background: "#fafafa", borderRadius: "10px",
                        color: "#555", fontStyle: "italic", fontSize: "13px",
                        borderLeft: "3px solid #c94b5b", marginBottom: "8px",
                    }}>
                        "{user.bio}"
                    </div>
                )}

                {user.score !== undefined && (
                    <div style={{ fontSize: "11px", color: "#ccc", textAlign: "right" }}>
                        Match score: {user.score}
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "36px", padding: "10px 16px 22px" }}>
                <button
                    onClick={() => fire("reject", onReject)}
                    style={{
                        width: "62px", height: "62px", borderRadius: "50%",
                        border: "2px solid #e0e0e0", background: "white", fontSize: "22px",
                        cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        transition: "transform 0.15s", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >✕</button>

                <button
                    onClick={() => { if (!outOfLikes) fire("heart", onHeart); }}
                    disabled={outOfLikes}
                    title={outOfLikes ? "Daily like limit reached" : "Like"}
                    style={{
                        width: "62px", height: "62px", borderRadius: "50%", border: "none",
                        background: outOfLikes ? "#ccc" : "linear-gradient(135deg,#c94b5b,#a8001c)",
                        fontSize: "22px", cursor: outOfLikes ? "not-allowed" : "pointer",
                        boxShadow: outOfLikes ? "none" : "0 4px 16px rgba(168,0,28,0.4)",
                        transition: "transform 0.15s", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={e => { if (!outOfLikes) e.currentTarget.style.transform = "scale(1.12)"; }}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >❤️</button>
            </div>
        </div>
    );
}

function LikedPortal({ likedUsers, onOpenChat }) {
    if (likedUsers.length === 0) return null;
    return (
        <div style={{
            width: "100%", maxWidth: "400px", marginTop: "24px",
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
            borderRadius: "20px", padding: "16px 18px",
            border: "1px solid rgba(255,255,255,0.25)",
        }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>
                ❤️ Liked — {likedUsers.length} {likedUsers.length === 1 ? "person" : "people"}
            </div>
            {likedUsers.map((u, i) => (
                <div key={i} onClick={() => onOpenChat(u)}
                     style={{
                         display: "flex", alignItems: "center", gap: "12px",
                         background: "rgba(255,255,255,0.92)", borderRadius: "14px",
                         padding: "10px 14px", marginBottom: "8px",
                         cursor: "pointer", transition: "transform 0.15s",
                     }}
                     onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                     onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    <img src={u.image} alt={u.name} style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        objectFit: "cover", border: "2px solid #c94b5b", flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{u.name}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "1px" }}>
                            {[u.location, u.age && `${u.age} yrs`, u.gender].filter(Boolean).join(" · ")}
                        </div>
                    </div>
                    <div style={{
                        fontSize: "12px", fontWeight: 600, color: "#a8001c",
                        background: "#fdf0f0", borderRadius: "10px",
                        padding: "4px 10px", whiteSpace: "nowrap",
                    }}>Message →</div>
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

        // ✅ Always add to liked list regardless of API response
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
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(168,0,28,0.88)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    zIndex: 9999, pointerEvents: "none",
                }}>
                    <div style={{ fontSize: "56px" }}>❤️</div>
                    <div style={{ color: "white", fontSize: "32px", fontWeight: 800, marginTop: "12px" }}>
                        It's a match!
                    </div>
                </div>
            )}

            <div className="faded-background min-vh-100 min-vw-100" style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", paddingTop: "24px", paddingBottom: "40px",
            }}>
                {!allSwiped && matches.length > 0 && (
                    <div style={{
                        color: "rgba(255,255,255,0.8)", fontSize: "13px",
                        marginBottom: "16px", display: "flex", gap: "20px",
                    }}>
                        <span>{currentIndex + 1} of {matches.length}</span>
                        {likesLeft !== null && (
                            <span>❤️ {likesLeft} like{likesLeft !== 1 ? "s" : ""} left today</span>
                        )}
                    </div>
                )}

                {allSwiped || matches.length === 0 ? (
                    <div style={{
                        background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
                        borderRadius: "24px", padding: "48px 32px", textAlign: "center",
                        color: "white", maxWidth: "400px", width: "100%",
                        border: "1px solid rgba(255,255,255,0.2)",
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            {matches.length === 0 ? "🔍" : "✨"}
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
                            {matches.length === 0 ? "No matches found yet" : "You've seen everyone!"}
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.75 }}>
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
