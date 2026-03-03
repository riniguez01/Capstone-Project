import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {

    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [location, setLocation] = useState("");
    const [age, setAge] = useState("");
    const [error, setError] = useState("");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignup = (e) => {
        e.preventDefault();

        if (!firstName.trim()) {
            setError("First name is required.");
            return;
        }

        if (!lastName.trim()) {
            setError("Last name is required.");
            return;
        }

        if (!location.trim()) {
            setError("Location is required.");
            return;
        }

        if (!age || age < 18) {
            setError("You must be 18 or older.");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setError("");

        // Backend disabled
        /*
        fetch("/api/signup", {...})
        */

        navigate("/questionnaire");
    };

    return (
        <div className="signin-page faded-background d-flex flex-column justify-content-center align-items-center min-vh-100">

            <div className="p-4 text-center">
                <h1 className="fs-3 text-white">Tell us your vibe.</h1>
                <h2 className="fs-6 text-white">Let us get to know you.</h2>
            </div>

            <div className="signin-card p-4 mb-3 text-center">

                <form onSubmit={handleSignup}>

                    <div className="mb-3 text-start">
                        <label>First Name:</label>
                        <input
                            type="text"
                            className="form-control custom-input bg-light"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            className="form-control custom-input bg-light"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Location:</label>
                        <input
                            type="text"
                            className="form-control custom-input bg-light"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Age:</label>
                        <input
                            type="number"
                            className="form-control custom-input bg-light"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-danger small">{error}</p>
                    )}

                    <div className="mb-3 text-start">
                        <label>Email:</label>
                        <input
                            type="email"
                            className="form-control custom-input bg-light"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 text-start">
                        <label>Password:</label>
                        <input
                            type="password"
                            className="form-control custom-input bg-light"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Next
                    </button>
                </form>

                <div className="mt-3 small">
                    <a href="/" className="text-dark">Back to Login</a>
                </div>
            </div>
        </div>
    );
}

export default Signup;