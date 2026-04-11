function ChatList({ matches, onSelect }) {
    return (
        <div className="w-100">
            <h5 className="section-title mb-3">Your Matches</h5>
            {matches.length === 0 && (
                <p className="text-muted text-center">No matches yet. Keep swiping!</p>
            )}
            {matches.map((match, index) => (
                <div
                    key={match.match_id || index}
                    className="chat-list-row"
                    onClick={() => onSelect(match)}
                >
                    <img
                        src={match.image}
                        alt={match.name}
                        className="chat-list-avatar"
                    />
                    <div className="text-start chat-list-info">
                        <div className="fw-bold">{match.name}</div>
                        <div className="text-muted small chat-list-preview">
                            {match.last_message || `${match.location || ""} · ${match.age || ""}`}
                        </div>
                    </div>
                    {match.unread_count > 0 && (
                        <span className="chat-unread-badge">{match.unread_count}</span>
                    )}
                    <div className="ms-auto text-danger">›</div>
                </div>
            ))}
        </div>
    );
}

export default ChatList;
