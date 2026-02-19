const express = require("express");
const path = require("path");

function startServer(commands, sessions, startBot) {
    const app = express();
    const PORT = process.env.PORT || 10000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Page principale ---
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
    });

    // --- Endpoint pour générer un pairing code ---
    app.post("/pair", async (req, res) => {
        const { number } = req.body;
        if (!number) return res.status(400).json({ error: "Numéro requis" });

        try {
            // Si session existante, renvoie code existant
            if (sessions.has(number)) {
                return res.json({ code: sessions.get(number).pairingCode });
            }

            // Crée session et renvoie pairing code
            const code = await startBot(number);
            return res.json({ code });
        } catch (err) {
            console.error(`Erreur création session ${number}:`, err);
            return res.status(500).json({ error: "Impossible de créer la session" });
        }
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 Serveur de ${PORT} en ligne`);
    });
}

module.exports = { startServer };
