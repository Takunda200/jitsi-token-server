const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors()); // Allow your Flutter app to talk to this server
app.use(express.json());

// --- YOUR KEYS GO HERE (Get these from 8x8.vc) ---
// Ideally, put these in Render "Environment Variables" later for security.
// For now, you can paste them here to test.
const JITSI_APP_ID = process.env.JITSI_APP_ID || "vpaas-magic-cookie-YOUR-APP-ID";
const JITSI_KID = process.env.JITSI_KID || "YOUR-KEY-ID";

// IMPORTANT: When pasting the Private Key, keep the \n (newlines) or use backticks ` `
const JITSI_PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
YOUR_VERY_LONG_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----`;

app.post('/generate-token', (req, res) => {
    try {
        const { isTeacher, roomName, userName, userEmail, userAvatar } = req.body;

        const payload = {
            context: {
                user: {
                    name: userName,
                    email: userEmail,
                    avatar: userAvatar,
                    moderator: isTeacher === true 
                },
                features: {
                    livestreaming: isTeacher === true,
                    recording: isTeacher === true,
                    transcription: false
                }
            },
            aud: "jitsi",
            iss: JITSI_APP_ID,
            sub: JITSI_APP_ID,
            room: roomName || "*",
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4) // 4 hours expiration
        };

        const token = jwt.sign(payload, JITSI_PRIVATE_KEY, {
            algorithm: 'RS256',
            header: { kid: JITSI_KID }
        });

        console.log("Token generated for room:", roomName);
        res.json({ token: token });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Token Factory running on port ${PORT}`);
});