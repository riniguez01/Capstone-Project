import "dotenv/config";

const base = (process.env.SMOKE_API_BASE || "http://127.0.0.1:4000").replace(/\/$/, "");
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

async function main() {
    if (!email || !password) {
        console.error(
            "Set SMOKE_EMAIL and SMOKE_PASSWORD in your environment or .env (same values you use to log in)."
        );
        process.exit(1);
    }

    const loginRes = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok) {
        console.error("Login failed:", loginRes.status, loginData);
        process.exit(1);
    }
    const token = loginData.token;
    const userId = process.env.SMOKE_USER_ID || loginData.user?.user_id;
    if (!token || userId == null) {
        console.error("Login response missing token or user id:", loginData);
        process.exit(1);
    }

    const okRes = await fetch(`${base}/matches/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const okData = await okRes.json().catch(() => ({}));
    if (!okRes.ok) {
        console.error("GET /matches failed:", okRes.status, okData);
        process.exit(1);
    }
    if (!Array.isArray(okData.matches)) {
        console.error("Response missing matches array:", okData);
        process.exit(1);
    }
    console.log(
        `OK: GET /matches/${userId} → ${okRes.status}, matches.length=${okData.matches.length}`
    );

    const ignoreParamRes = await fetch(`${base}/matches/not-a-number`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const ignoreParamData = await ignoreParamRes.json().catch(() => ({}));
    if (!ignoreParamRes.ok || !Array.isArray(ignoreParamData.matches)) {
        console.error(
            "Expected 200 + matches[] when Bearer present (path userId ignored; uses JWT):",
            ignoreParamRes.status,
            ignoreParamData
        );
        process.exit(1);
    }
    console.log("OK: path :userId ignored when JWT present (matches for logged-in user)");

    const noAuthRes = await fetch(`${base}/matches/${userId}`);
    if (noAuthRes.status !== 401) {
        console.error(`Expected 401 without Authorization, got ${noAuthRes.status}`);
        process.exit(1);
    }
    console.log("OK: missing Bearer token returns 401");

    console.log("\nSmoke checks passed.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
