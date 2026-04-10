import StarRating from "./StarRating";

function Match({ user, onHeart, onReject }) {
    return (
        <div className="login-card p-4 text-center mb-4">

            <div className="bg-white">
                <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
                    <button className="btn btn-outline-danger mt-5" onClick={onReject}>
                        ❌
                    </button>

                    <img
                        src={user.image}
                        className="rounded mt-4 match-profile-image"
                        alt="profile"
                    />

                    <button className="btn btn-outline-danger mt-5" onClick={onHeart}>
                        ❤️
                    </button>
                </div>

                <div className="pb-2 mt-2">
                    <StarRating rating={user.starRating} />
                </div>
            </div>

            <h3 className="mt-3">{user.name}</h3>

            <div className="mb-3 text-start">
                <label>Location</label>
                <input className="form-control" value={user.location} disabled />
            </div>

            <div className="mb-3 text-start">
                <label>Age</label>
                <input className="form-control" value={user.age} disabled />
            </div>

            <div className="mb-3 text-start">
                <label>Gender</label>
                <input className="form-control" value={user.gender} disabled />
            </div>
        </div>
    );
}

export default Match;