function ChatList({ matches, loading, onSelect }) {
    if (loading) {
        return (
            <div className="w-100 text-center text-muted py-4">
                Loading matches...
            </div>
        );
    }

    return (
        <div className="w-100">
            <h5 className="section-title mb-3">Your Matches</h5>
            {matches.length === 0 && (
                <p className="text-muted text-center">No matches yet. Keep swiping!</p>
            )}
            {matches.map((match) => (
                <div
                    key={match.match_id}
                    className="d-flex align-items-center gap-3 p-3 mb-2 rounded chat-list-row"
                    onClick={() => onSelect(match)}
                >
                    <img
                        src={match.image}
                        alt={match.name}
                        className="chat-list-avatar"
                    />
                    <div className="text-start flex-grow-1 overflow-hidden">
                        <div className="fw-bold">{match.name}</div>
                        <div className="text-muted small text-truncate">
                            {match.last_message || "Tap to say hello!"}
                        </div>
                    </div>
                    {match.unread_count > 0 && (
                        <span className="badge bg-danger rounded-pill">{match.unread_count}</span>
                    )}
                    <div className="ms-auto text-danger">›</div>
                </div>
            ))}
        </div>
    );
}

export default ChatList;