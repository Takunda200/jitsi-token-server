const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// FIX 1: Trim accidental spaces from Render variables
const JITSI_APP_ID = (process.env.JITSI_APP_ID || "").trim();
const JITSI_KID = (process.env.JITSI_KID || "").trim();

// Handle Private Key newlines
const JITSI_PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY 
    ? process.env.JITSI_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : "";

app.post('/generate-token', (req, res) => {
    try {
        const { isTeacher, roomName, userName, userEmail, userAvatar } = req.body;

        // FIX 2: Force Room Name to Lowercase
        // Jitsi often converts rooms to lowercase, so our token must match.
        const cleanRoomName = (roomName || "*").replace(/\s+/g, '_').toLowerCase();

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
            iss: "chat", 
            sub: JITSI_APP_ID,
            room: cleanRoomName, 
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4),
            nbf: Math.floor(Date.now() / 1000) - 10 // FIX 3: Allow for small clock differences
        };

        const token = jwt.sign(payload, JITSI_PRIVATE_KEY, {
            algorithm: 'RS256',
            header: { kid: JITSI_KID }
        });

        res.json({ token: token, room: cleanRoomName });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Token Factory running on port ${PORT}`);
});
