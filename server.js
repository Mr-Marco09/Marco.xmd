// cat server.js
const express = require("express");
const path = require("path");
const app = express();
const config = require("./config.json");

const startServer = (getSocketFunc) => {
    const PORT = process.env.PORT || 3000;

    app.use(express.static(path.join(__dirname, "public")));

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "public/index.html"));
    });

    // --- Pairing code pour chaque numéro ---
    app.get("/pair", async (req, res) => {
        const num = req.query.number;
        if (!num) return res.status(400).json({ error: "Numéro requis" });

        try {
            const sock = await getSocketFunc(num);
            if (!sock) return res.status(503).json({ error: "Bot non prêt" });

            const code = await sock.requestPairingCode(num);
            res.status(200).json({ code });
        } catch (err) {
            console.error(`Erreur Pairing (${num}):`, err);
            res.status(500).json({ error: "Erreur génération code" });
        }
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 Serveur de ${config.botName} en ligne sur http://localhost:${PORT}`);
    });
};

module.exports = { startServer };
