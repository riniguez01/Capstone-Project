function ChatList({ matches, onSelect }) {
    return (
        <div className="w-100">
            <h5 className="section-title mb-3">Your Matches</h5>
            {matches.length === 0 && (
                <p className="text-muted text-center">No matches yet. Keep swiping!</p>
            )}
            {matches.map((match, index) => (
                <div
                    key={index}
                    className="d-flex align-items-center gap-3 p-3 mb-2 rounded"
                    onClick={() => onSelect(match)}
                    style={{
                        background: "white",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "transform 0.1s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                    <img
                        src={match.image}
                        alt={match.name}
                        style={{
                            width: "55px",
                            height: "55px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #c94b5b"
                        }}
                    />
                    <div className="text-start">
                        <div className="fw-bold">{match.name}</div>
                        <div className="text-muted small">{match.location} · {match.age}</div>
                    </div>
                    <div className="ms-auto text-danger">›</div>
                </div>
            ))}
        </div>
    );
}

export default ChatList;